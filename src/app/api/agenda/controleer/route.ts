import { leesIcs } from "@/lib/ics";
import { herkenAlles, vouwSamen, tel, SOORT_INFO } from "@/lib/agenda-herken";

// Haalt een agendalink op, leest hem uit en vertelt wat erin zit.
// Bewaart niets: dit is de controlestap van het koppelscherm, zodat een
// leerkracht zíet dat zijn link werkt voordat hij hem opslaat.

export const runtime = "nodejs";

const MAX = 5 * 1024 * 1024; // 5 MB is ruim voor een schooljaar

/**
 * Een adres dat een bezoeker zelf intypt mag nooit naar ons eigen netwerk
 * wijzen. Anders kan iemand onze server gebruiken om bij interne adressen te
 * komen die van buitenaf niet bereikbaar zijn.
 */
function veiligAdres(ruw: string): { url: string } | { fout: string } {
  let tekst = ruw.trim();
  if (!tekst) return { fout: "Er staat nog geen link in het veld." };

  // Agenda-apps geven vaak een webcal-adres; dat is gewoon https.
  if (/^webcal:\/\//i.test(tekst)) tekst = "https://" + tekst.slice(9);
  if (!/^https?:\/\//i.test(tekst)) tekst = "https://" + tekst;

  let url: URL;
  try {
    url = new URL(tekst);
  } catch {
    return { fout: "Dit lijkt geen geldige link. Kopieer hem opnieuw uit je agenda." };
  }
  if (url.protocol !== "https:") {
    return { fout: "Alleen een beveiligde link (https) kan worden gekoppeld." };
  }
  if (url.username || url.password) {
    return { fout: "Deze link bevat een wachtwoord. Gebruik de agendalink uit je app." };
  }

  const host = url.hostname.toLowerCase();
  const verboden =
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^\[?::1\]?$/.test(host) ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^0\./.test(host);
  if (verboden) return { fout: "Dit adres kunnen we niet ophalen." };

  return { url: url.toString() };
}

export async function POST(request: Request) {
  let link = "";
  try {
    link = (await request.json())?.link ?? "";
  } catch {
    return Response.json({ fout: "Geen link ontvangen." }, { status: 400 });
  }

  const gecontroleerd = veiligAdres(String(link));
  if ("fout" in gecontroleerd) {
    return Response.json({ fout: gecontroleerd.fout }, { status: 400 });
  }

  let tekst: string;
  try {
    const antwoord = await fetch(gecontroleerd.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
      headers: { Accept: "text/calendar, text/plain;q=0.9, */*;q=0.5" },
    });
    if (!antwoord.ok) {
      return Response.json(
        {
          fout:
            antwoord.status === 404
              ? "Deze agenda bestaat niet (meer). Haal de link opnieuw op in je app."
              : `De agenda gaf een foutmelding (${antwoord.status}). Klopt de link nog?`,
        },
        { status: 400 },
      );
    }
    const lengte = Number(antwoord.headers.get("content-length") || 0);
    if (lengte > MAX) {
      return Response.json({ fout: "Deze agenda is te groot om te verwerken." }, { status: 400 });
    }
    tekst = await antwoord.text();
    if (tekst.length > MAX) {
      return Response.json({ fout: "Deze agenda is te groot om te verwerken." }, { status: 400 });
    }
  } catch {
    return Response.json(
      { fout: "We konden de agenda niet bereiken. Controleer de link en je verbinding." },
      { status: 400 },
    );
  }

  if (!/BEGIN:VCALENDAR/i.test(tekst)) {
    return Response.json(
      {
        fout:
          "Op dit adres staat geen agenda. Let op dat je de agendalink kopieert en niet het adres van de website.",
      },
      { status: 400 },
    );
  }

  const agenda = leesIcs(tekst);
  const groepen = vouwSamen(herkenAlles(agenda.afspraken));
  const telling = tel(groepen).map((t) => ({
    soort: t.soort,
    woord: t.aantal === 1 ? SOORT_INFO[t.soort].woord.toLowerCase() : SOORT_INFO[t.soort].meervoud,
    aantal: t.aantal,
    slots: t.slots,
    weken: t.weken,
    vrij: SOORT_INFO[t.soort].vrij,
  }));

  const datums = groepen.map((g) => g.van).sort();
  const heleDagen = groepen.filter((g) => g.heleDag).length;

  return Response.json({
    naam: agenda.naam ?? null,
    aantal: agenda.afspraken.length,
    blokken: groepen.length,
    van: datums[0] ?? null,
    tot: datums[datums.length - 1] ?? null,
    herhalend: agenda.herhalend,
    heleDagen,
    telling,
  });
}

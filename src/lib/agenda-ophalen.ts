import { leesIcs, type IcsAgenda } from "./ics";

// Het ophalen van een agendalink: adrescontrole, netwerkverkeer en foutmeldingen
// in gewone taal. Gedeeld door de controlestap in het koppelscherm en het
// nachtelijke verversen, zodat beide zich precies hetzelfde gedragen.

const MAX = 5 * 1024 * 1024; // 5 MB is ruim voor een schooljaar

/**
 * Een adres dat een gebruiker zelf intypt mag nooit naar ons eigen netwerk
 * wijzen. Anders kan iemand onze server gebruiken om bij interne adressen te
 * komen die van buitenaf niet bereikbaar zijn.
 */
export function veiligAdres(ruw: string): { url: string } | { fout: string } {
  let tekst = String(ruw ?? "").trim();
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

export async function haalAgenda(url: string): Promise<{ agenda: IcsAgenda } | { fout: string }> {
  let tekst: string;
  try {
    const antwoord = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
      headers: { Accept: "text/calendar, text/plain;q=0.9, */*;q=0.5" },
    });
    if (!antwoord.ok) {
      return {
        fout:
          antwoord.status === 404
            ? "Deze agenda bestaat niet (meer). Haal de link opnieuw op in je app."
            : antwoord.status === 401 || antwoord.status === 403
              ? "Deze agenda is niet meer gedeeld. Vraag een nieuwe link op in je app."
              : `De agenda gaf een foutmelding (${antwoord.status}). Klopt de link nog?`,
      };
    }
    if (Number(antwoord.headers.get("content-length") || 0) > MAX) {
      return { fout: "Deze agenda is te groot om te verwerken." };
    }
    tekst = await antwoord.text();
    if (tekst.length > MAX) return { fout: "Deze agenda is te groot om te verwerken." };
  } catch {
    return { fout: "We konden de agenda niet bereiken. Controleer de link en je verbinding." };
  }

  if (!/BEGIN:VCALENDAR/i.test(tekst)) {
    return {
      fout:
        "Op dit adres staat geen agenda. Let op dat je de agendalink kopieert en niet het adres van de website.",
    };
  }

  return { agenda: leesIcs(tekst) };
}

/**
 * Namen van kinderen uit een titel halen vóór hij wordt opgeslagen.
 *
 * In een leerkracht-agenda staan afspraken als "Gesprek ouders <voornaam>".
 * De tijd en het soort mogen bij ons op de server staan, de naam niet. Die
 * vervangen we door een neutraal woord; op het scherm van de leerkracht zelf
 * blijft alles gewoon leesbaar dankzij de bestaande maskeerlaag.
 */
export function maskeerNamen(titel: string, namen: string[]): string {
  let uit = titel;
  for (const naam of namen) {
    const schoon = naam.trim();
    if (schoon.length < 3) continue; // te kort: te veel valse treffers
    const patroon = new RegExp(
      `(^|[^\\p{L}])${schoon.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[^\\p{L}]|$)`,
      "giu",
    );
    uit = uit.replace(patroon, (_m, voor) => `${voor}[leerling]`);
  }
  return uit;
}

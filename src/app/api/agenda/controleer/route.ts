import { haalAgenda, veiligAdres } from "@/lib/agenda-ophalen";
import { herkenAlles, vouwSamen, tel, SOORT_INFO } from "@/lib/agenda-herken";

// Haalt een agendalink op en vertelt wat erin zit. Bewaart niets: dit is de
// controlestap van het koppelscherm, zodat een leerkracht zíet dat zijn link
// werkt voordat hij hem opslaat.

export const runtime = "nodejs";

export async function POST(request: Request) {
  let link = "";
  try {
    link = (await request.json())?.link ?? "";
  } catch {
    return Response.json({ fout: "Geen link ontvangen." }, { status: 400 });
  }

  const gecontroleerd = veiligAdres(link);
  if ("fout" in gecontroleerd) return Response.json({ fout: gecontroleerd.fout }, { status: 400 });

  const opgehaald = await haalAgenda(gecontroleerd.url);
  if ("fout" in opgehaald) return Response.json({ fout: opgehaald.fout }, { status: 400 });

  const agenda = opgehaald.agenda;
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

  return Response.json({
    naam: agenda.naam ?? null,
    aantal: agenda.afspraken.length,
    blokken: groepen.length,
    van: datums[0] ?? null,
    tot: datums[datums.length - 1] ?? null,
    herhalend: agenda.herhalend,
    heleDagen: groepen.filter((g) => g.heleDag).length,
    telling,
  });
}

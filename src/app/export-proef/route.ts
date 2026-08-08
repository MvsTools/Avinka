import { type NextRequest, NextResponse } from "next/server";
import { bestandsnaamVoor, deelBestand, exportPaginaHtml, zipBestand } from "@/app/api/account/export/route";

/* ⚠️ TIJDELIJK — WEG ZODRA DE EIGENAAR HET EXPORTSCHERM HEEFT GOEDGEKEURD.
 * Zelfde soort proefpagina als destijds /wek-proef en /cijfers-proef.
 *
 * Waarom hij bestaat: het exportscherm is alleen te zien als je bent ingelogd,
 * en dat kan ik niet. Zonder deze pagina zou ik een scherm opleveren dat ik
 * nooit heb gezien, en daar is dit project al een paar keer op stukgelopen.
 * De gegevens hieronder zijn verzonnen; er komt geen database aan te pas. */

function afspraken(n: number) {
  const soorten = ["gesprek", "toets", "activiteit", "vergadering", "overig"];
  const titels = [
    "Oudergesprek Sanne",
    "Rekentoets blok 4",
    "Studiedag",
    "Bouwvergadering",
    "Schoolreis groep 6",
    "Rapporten mee naar huis",
  ];
  return Array.from({ length: n }, (_, i) => ({
    id: `nep-${i}`,
    titel: titels[i % titels.length],
    datum: `2026-0${(i % 9) + 1}-${String((i % 27) + 1).padStart(2, "0")}`,
    tot_datum: `2026-0${(i % 9) + 1}-${String((i % 27) + 1).padStart(2, "0")}`,
    hele_dag: i % 3 === 0,
    begintijd: i % 3 === 0 ? null : "14:30:00",
    eindtijd: i % 3 === 0 ? null : "15:15:00",
    soort: soorten[i % soorten.length],
    tijdvakken: 1,
    locatie: i % 4 === 0 ? "Lokaal 6" : null,
    bijgewerkt: "2026-08-01T09:00:00Z",
  }));
}

export async function GET(request: NextRequest) {
  const gegevens: Record<string, Record<string, unknown>[]> = {
    instellingen: [
      {
        schoolnaam: "De Vlinderboom",
        standaardgroep: "groep 6",
        toon: "warm",
        taalniveau: "standaard",
        lengte: "gemiddeld",
        aanspreekvorm: "je",
        abon_plan: "compleet",
        abon_vorm: "maand",
        abon_status: "opgezegd",
        ref_code: "MARIEKE-7742",
      },
    ],
    klassen: [
      {
        naam: "Groep 6",
        leerlingen: ["Sanne", "Joris", "Fatima", "Tom", "Lise"],
        leerlingen_data: [
          { naam: "Sanne", geslacht: "m" },
          { naam: "Joris", geslacht: "j" },
          { naam: "Fatima", geslacht: "m" },
          { naam: "Tom", geslacht: "j" },
          { naam: "Lise", geslacht: "m" },
        ],
        actief: true,
        created_at: "2025-08-20T08:00:00Z",
      },
    ],
    rapporten: [
      {
        naam: "Sanne",
        verhaal:
          "Sanne werkt geconcentreerd en helpt anderen graag. Bij rekenen zoekt ze uit zichzelf naar een handige aanpak, en ze durft steeds vaker een vraag te stellen als ze iets niet snapt. In de kring komt ze goed uit haar woorden.",
        updated_at: "2026-02-10T10:00:00Z",
      },
      { naam: "Joris", verhaal: "Joris heeft een sterke rekenknobbel.", updated_at: "2026-02-10T10:05:00Z" },
    ],
    bestanden: [
      { type: "plattegrond", naam: "Klasopstelling november", data: { plekken: [] }, tool: "plattegrond" },
      { type: "les", naam: "Les breuken vergelijken", inhoud: "Leerdoel: breuken vergelijken.", tool: "lesontwerp" },
    ],
    taken: [
      { tekst: "Gesprek met de ouders van Sanne inplannen", gedaan: false, deadline: "2026-09-12" },
      { tekst: "Rapporten nakijken", gedaan: true, gedaan_op: "2026-02-11T19:00:00Z" },
    ],
    agenda_items: afspraken(149),
    agenda_bronnen: [
      { naam: "Schoolagenda", systeem: "ics", modus: "alles", kleur: "groen", actief: true, aantal_items: 149 },
    ],
    basisrooster: [{ schooljaar: "2025/2026", data: { ma: [] }, bijgewerkt: "2026-01-05T09:00:00Z" }],
    rooster_week: [{ maandag: "2026-02-02", data: { ma: [] }, bijgewerkt: "2026-02-02T07:30:00Z" }],
    statistiek: [{ tellers: { rapport: 12, analyse: 3 }, minuten: 640, streak: 4, streak_max: 11 }],
    toestemmingen: [
      { voorwaarden_versie: "2026-08-05", privacy_versie: "2026-08-05", geaccepteerd_op: "2026-08-05T12:00:00Z", bron: "registratie" },
    ],
    reviews: [],
    feedback: [{ soort: "idee", bericht: "Kan de takenlijst ook per week?", pagina: "/dashboard/taken", status: "nieuw" }],
    proef_feedback: [],
    ai_verbruik: [
      { tool: "rapporten", model: "claude-sonnet", input_tokens: 1840, output_tokens: 520, created_at: "2026-02-10T10:00:00Z" },
    ],
  };

  // Zo kun je ook de downloadbestanden zelf bekijken, in de browser in plaats
  // van als download: /export-proef?deel=agenda_items
  const gekozen = request.nextUrl.searchParams.getAll("deel");
  if (gekozen.length === 1) {
    const { inhoud } = deelBestand(gekozen[0], gegevens[gekozen[0]] ?? []);
    return new NextResponse(inhoud, {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  if (gekozen.length > 1) {
    const zip = zipBestand(
      gekozen.map((d) => ({
        naam: bestandsnaamVoor(d),
        inhoud: deelBestand(d, gegevens[d] ?? []).inhoud,
      })),
    );
    return new NextResponse(Buffer.from(zip), {
      headers: {
        "content-type": "application/zip",
        "content-disposition": 'attachment; filename="avinka-proef.zip"',
      },
    });
  }

  return new NextResponse(
    exportPaginaHtml({ email: "marieke@devlinderboom.nl", voornaam: "Marieke" }, gegevens),
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

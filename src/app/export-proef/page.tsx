import GegevensBlok from "@/components/GegevensBlok";
import {
  EIGEN_WERK,
  type Gegevens,
  OVERIG,
  bouwKaarten,
  zonderGeheimen,
} from "@/lib/export-gegevens";

/* ⚠️ TIJDELIJK — WEG ZODRA DE EIGENAAR HET EXPORTSCHERM HEEFT GOEDGEKEURD.
 * Zelfde soort proefpagina als destijds /wek-proef en /cijfers-proef.
 *
 * Waarom hij bestaat: /mijn-gegevens is alleen te zien als je bent ingelogd, en
 * dat kan ik niet. Zonder deze pagina zou ik een scherm opleveren dat ik nooit
 * heb gezien, en daar is dit project al een paar keer op stukgelopen. De
 * gegevens hieronder zijn verzonnen; er komt geen database aan te pas. */

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
    soort: soorten[i % soorten.length],
    locatie: i % 4 === 0 ? "Lokaal 6" : null,
  }));
}

const RUW: Gegevens = {
  instellingen: [
    {
      schoolnaam: "De Vlinderboom",
      standaardgroep: "groep 6",
      toon: "warm",
      taalniveau: "standaard",
      abon_plan: "compleet",
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
        "Sanne werkt geconcentreerd en helpt anderen graag. Bij rekenen zoekt ze uit zichzelf naar een handige aanpak, en ze durft steeds vaker een vraag te stellen als ze iets niet snapt.",
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
    { tekst: "Rapporten nakijken", gedaan: true },
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
  duo_overdracht: [
    {
      tekst:
        "Sanne heeft deze week extra geoefend met breuken, het gaat beter. Joris is dinsdag naar de logopedist, dan mist hij de spellingles.",
      bijgewerkt: "2026-02-09T16:20:00Z",
    },
  ],
  duo_taken: [
    { tekst: "Toetsen klaarzetten in IEP", gedaan: false, deadline: "2026-09-15" },
    { tekst: "Ouderavond voorbereiden", gedaan: true },
  ],
  duo_koppels: [
    { status: "actief", rol: "duo", uitgenodigd_email: "collega@devlinderboom.nl", created_at: "2025-09-01T08:00:00Z" },
  ],
  duo_overdracht_gelezen: [{ gelezen_op: "2026-02-09T17:00:00Z" }],
  bestand_deling: [
    {
      gedeeld_email: "collega@devlinderboom.nl",
      rol: "lezer",
      token: "DIT-TOKEN-MAG-NIET-IN-DE-EXPORT",
      created_at: "2026-01-20T11:00:00Z",
    },
  ],
};

export default function ExportProef() {
  // Dezelfde behandeling als de echte pagina, anders test je iets anders dan
  // wat een leerkracht krijgt.
  const gegevens: Gegevens = Object.fromEntries(
    Object.entries(RUW).map(([tabel, rijen]) => [tabel, zonderGeheimen(rijen)]),
  );

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <p className="mb-6 rounded-2xl bg-accent-soft px-5 py-3 text-sm font-semibold text-ink/70">
        Proefpagina met verzonnen gegevens. De echte staat op /mijn-gegevens.
      </p>
      <h2 className="text-xs font-extrabold uppercase tracking-[0.09em] text-ink/65">Meenemen</h2>
      <p className="mb-4 mt-1 max-w-[60ch] text-sm text-ink/65">
        Deze gegevens gaan over je klas en verdwijnen na verloop van tijd. Vink aan wat je wilt
        bewaren.
      </p>
      <GegevensBlok kaarten={bouwKaarten(EIGEN_WERK, gegevens)} actie="/export-proef" />

      <h2 className="mt-12 text-xs font-extrabold uppercase tracking-[0.09em] text-ink/65">
        En dit weten we verder van je
      </h2>
      <p className="mb-4 mt-1 max-w-[60ch] text-sm text-ink/65">
        Hier kun je ook los iets van ophalen. Deze komen als Excel-tabel.
      </p>
      <GegevensBlok kaarten={bouwKaarten(OVERIG, gegevens)} actie="/export-proef" toonFormaat={false} />
    </main>
  );
}

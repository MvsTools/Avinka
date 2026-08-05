// TIJDELIJKE PROEFPAGINA — niet mergen, weghalen zodra "Wat eraan komt" is
// goedgekeurd. Staat er zodat de eigenaar het blok kan bekijken zonder in te
// loggen: zijn eigen agenda loopt tot juli 2026 en heeft na vandaag niets in de
// vensters staan, dus op de echte Start zou er (terecht) niets verschijnen.

import WatEraanKomt from "@/components/dashboard/WatEraanKomt";
import VandaagRij from "@/components/dashboard/VandaagRij";
import { maakSchooljaar, schooljaarVoor } from "@/lib/planning";
import type { PlanItem, PlanningBron } from "@/lib/planning";

const VANDAAG = "2026-08-05";

function item(p: Partial<PlanItem> & { id: string; datum: string; titel: string }): PlanItem {
  return {
    bronId: "proef",
    totDatum: p.datum,
    heleDag: true,
    tijdvakken: 1,
    soort: "overig",
    ...p,
  } as PlanItem;
}

const BRON: PlanningBron = {
  schooljaar: maakSchooljaar(schooljaarVoor(VANDAAG), "midden", VANDAAG),
  periodes: [],
  blokken: [],
  weekOverrides: {},
  taken: [],
  items: [
    item({ id: "1", datum: "2026-08-25", titel: "Rapporten mee naar huis", soort: "rapport" }),
    item({ id: "2", datum: "2026-08-18", titel: "Startgesprekken groep 5", soort: "gesprek" }),
    item({
      id: "3",
      datum: "2026-08-03",
      totDatum: "2026-08-04",
      titel: "Cito middenmeting rekenen",
      soort: "toets",
    }),
    // Een toets die eraan komt: die moet je zelf klaarzetten, daar helpt geen
    // tool bij.
    item({ id: "6", datum: "2026-08-12", titel: "Toetsweek begrijpend lezen", soort: "toets" }),
    // Verder weg dan de gesprekken hierboven: daar is de fase nog "zelf
    // klaarzetten" in plaats van "Oudercontact openen".
    item({ id: "7", datum: "2026-08-23", titel: "Rapportgesprekken", soort: "gesprek" }),
    item({ id: "4", datum: "2026-09-10", titel: "Schoolreis", soort: "activiteit" }),
    item({ id: "5", datum: "2026-08-20", titel: "Rapportgesprekken groep 8", soort: "gesprek" }),
  ],
};

/** Een namaak-toolkaart met dezelfde klassen als op Start, alleen om het ritme
 *  van de pagina te kunnen beoordelen. */
function NepTool({ naam, emoji, tint }: { naam: string; emoji: string; tint: string }) {
  return (
    <div className="flex items-stretch gap-5 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
      <span className={"grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl " + tint}>
        {emoji}
      </span>
      <span className="min-w-0">
        <span className="block font-bold text-ink">{naam}</span>
        <span className="mt-1 block text-sm text-ink/60">
          Korte omschrijving van wat deze tool voor je doet.
        </span>
      </span>
    </div>
  );
}

export default function Proef() {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-8 overflow-x-hidden bg-cream px-4 py-8 md:px-8">
      <div>
        <h1 className="text-2xl font-black text-ink">Proef: Wat eraan komt</h1>
        <p className="mt-1 text-sm text-ink/60">
          Verzonnen afspraken, want in je echte agenda staat na vandaag niets in de vensters. Doet
          eerst 5 augustus 2026 alsof dat vandaag is.
        </p>
      </div>

      {/* 1 — Start als geheel, om het ruimtebeslag tussen de dagrij en de tools
          te kunnen beoordelen. */}
      <div className="rounded-3xl border border-dashed border-ink/15 p-4 md:p-6">
        <p className="mb-4 text-sm font-bold text-ink/50">1. Zoals Start er als geheel uitziet</p>
        <div className="flex flex-col gap-8">
          <VandaagRij bron={BRON} vandaag={VANDAAG} groepen={[5]} />
          <WatEraanKomt bron={BRON} vandaag={VANDAAG} groepen={[5]} maximaal={2} />
          <section>
            <h2 className="text-xl font-bold text-ink">Jouw tools</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <NepTool naam="Toetsanalyse" emoji="📊" tint="bg-sky-50" />
              <NepTool naam="Rapporten" emoji="📝" tint="bg-violet-50" />
              <NepTool naam="Oudercontact" emoji="✉️" tint="bg-rose-50" />
              <NepTool naam="Plattegrond" emoji="🪑" tint="bg-amber-50" />
            </div>
          </section>
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-ink/15 p-4 md:p-6">
        <p className="mb-1 text-sm font-bold text-ink/50">
          2. Zoals het in Mijn schooljaar staat (alles, geen maximum)
        </p>
        <p className="mb-4 text-sm text-ink/50">
          Let op de tweede regel: dat is het werk waar Avinka je NIET bij helpt. Witte knop met een
          +, en die zet het op je takenlijst in plaats van een tool te openen.
        </p>
        <WatEraanKomt bron={BRON} vandaag={VANDAAG} groepen={[5]} />
      </div>

      <div className="rounded-3xl border border-dashed border-ink/15 p-4 md:p-6">
        <p className="mb-1 text-sm font-bold text-ink/50">
          3. Hetzelfde, maar nu weet Avinka dat jullie Parro, ParnasSys en IEP gebruiken
        </p>
        <p className="mb-4 text-sm text-ink/50">
          Zelfde afspraken, andere teksten: de tip wordt concreet in plaats van algemeen. Dit komt
          uit Instellingen → Voorkeuren.
        </p>
        <WatEraanKomt
          bron={BRON}
          vandaag={VANDAAG}
          groepen={[5]}
          systemen={{ communicatieApp: "parro", lvsSysteem: "parnassys", toetsSysteem: "iep" }}
        />
      </div>

      <div className="rounded-3xl border border-dashed border-ink/15 p-4 md:p-6">
        <p className="mb-4 text-sm font-bold text-ink/50">
          4. Als een tool niet in je pakket zit (hier: Rapporten)
        </p>
        <WatEraanKomt bron={BRON} vandaag={VANDAAG} groepen={[5]} vergrendeld={["rapporten"]} />
      </div>

      <div className="rounded-3xl border border-dashed border-ink/15 p-4 md:p-6">
        <p className="mb-2 text-sm font-bold text-ink/50">
          5. Als er niets speelt — hoort helemaal niets te tonen
        </p>
        <WatEraanKomt bron={{ ...BRON, items: [] }} vandaag={VANDAAG} />
        <p className="text-sm text-ink/40">— hier eindigt de pagina, dus goed —</p>
      </div>
    </main>
  );
}

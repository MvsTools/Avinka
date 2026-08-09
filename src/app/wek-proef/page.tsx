// ⚠️ TIJDELIJKE PROEFPAGINA — weghalen zodra de eigenaar "Wat eraan komt"
// heeft goedgekeurd. Bestaat alleen om de strook te kunnen ZIEN zonder in te
// loggen (dezelfde truc als /cijfers-proef en /wachtscherm-proef eerder).
// De knoppen praten hier met de echte API en krijgen dus een 401; het gaat om
// de vorm, niet om de werking.

"use client";

import { Blokkaart, lesontwerpLink } from "@/components/dashboard/RoosterBewerken";
import WatEraanKomt from "@/components/dashboard/WatEraanKomt";
import { maakSchooljaar, periodesVan } from "@/lib/planning";
import type { PlanItem, PlanningBron, Roosterblok } from "@/lib/planning";

const VANDAAG = "2027-02-01";

function item(
  id: string,
  datum: string,
  titel: string,
  soort: PlanItem["soort"],
  totDatum = datum,
): PlanItem {
  return {
    id,
    bronId: "proef",
    datum,
    totDatum,
    heleDag: true,
    titel,
    soort,
    tijdvakken: 1,
  };
}

export default function WekProef() {
  const schooljaar = maakSchooljaar("2026-2027", "midden", VANDAAG);
  const bron: PlanningBron = {
    schooljaar,
    periodes: periodesVan(schooljaar),
    items: [
      item("proef-1", "2027-02-12", "Rapporten mee naar huis", "rapport"),
      item("proef-2", "2027-02-09", "Oudergesprekken groep 6", "gesprek"),
      item("proef-3", "2027-01-26", "Toetsweek rekenen", "toets", "2027-01-29"),
      item("proef-4", "2027-03-05", "Verkeersexamen", "activiteit"),
    ],
    blokken: [],
    weekOverrides: {},
    taken: [],
  };

  return (
    // Zo breed als de echte inhoudskolom van het dashboard op een laptop van
    // 1280 (max-w-7xl min de navigatie), zodat wat hier past daar ook past.
    // ⚠️ `min-w-0` hoort erbij: de body is een flexbox, en zonder dat groeit
    // een kolom mee met zijn inhoud in plaats van te krimpen — dan lijkt het
    // net alsof het onderdeel buiten het scherm loopt. Het echte dashboard
    // zet die klasse op precies dezelfde plek.
    <main className="mx-auto w-full min-w-0 max-w-[820px] px-6 py-10">
      <WatEraanKomt
        bron={bron}
        vandaag={VANDAAG}
        groepen={[6]}
        context={{ werkdagen: "01234", rapporten: { klaar: 12, totaal: 28 } }}
        van="schooljaar"
      />

      {/* Het kaartje dat opengaat als je in het weekrooster op een lesblok
          klikt — hier los neergezet, want het echte rooster komt van de server
          en die laat niemand binnen zonder inloggen. */}
      <Blokkaart
        blok={LESBLOK}
        x={40}
        y={420}
        kant="rechts"
        beginEerder={() => {}}
        beginLater={() => {}}
        eindeEerder={() => {}}
        eindeLater={() => {}}
        zetOmschrijving={() => {}}
        aantalZelfdeVak={4}
        overalGelijk={false}
        lesLink={lesontwerpLink(LESBLOK)}
        weghalen={() => {}}
        sluit={() => {}}
      />
    </main>
  );
}

const LESBLOK: Roosterblok = {
  id: "proef-blok",
  weekdag: 1,
  begin: "09:15",
  eind: "10:00",
  vak: "rekenen",
  naam: "Rekenen",
  kleur: { bg: "#e0f2fe", tekst: "#075985" },
  omschrijving: "Blok 4, les 3 — breuken vergelijken",
  soort: "les",
};

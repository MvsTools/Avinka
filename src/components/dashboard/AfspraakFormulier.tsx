"use client";

import { SOORT_INFO, type Soort } from "@/lib/agenda-herken";
import TijdVeld from "./TijdVeld";
import type { EigenAfspraakVorm, Vorm } from "./useEigenAfspraakVorm";

// De velden van "zelf een afspraak toevoegen" — los van EigenAfspraken.tsx,
// zodat SchooljaarDagkaart hetzelfde formulier kan tonen op de plek waar je
// al bent (een dag in de kalender), in plaats van je naar Jaaroverzicht te
// sturen.
//
// 🔑 HET SOORT IS HET BELANGRIJKSTE VELD, en daarom staat het niet onderaan
// als bijzaak. Het bepaalt wat Avinka met de afspraak dóét: zet je er
// "oudergesprekken" bij, dan krijg je drie weken van tevoren te horen dat je
// het rooster moet openzetten.

/** Wat een soort je oplevert. Kort, want dit staat onder een keuzerij. */
const WAT_LEVERT_HET_OP: Partial<Record<Soort, string>> = {
  rapport: "Je krijgt 4 weken vooraf een seintje, en een knop naar Rapporten.",
  gesprek: "Je krijgt 3 weken vooraf een seintje om het rooster open te zetten.",
  toets: "Je krijgt vooraf een seintje om de toetsen klaar te zetten, en erna om ze te analyseren.",
  activiteit: "Bij een schoolreis, sportdag of excursie krijg je 6 weken vooraf een seintje over hulpouders en vervoer.",
  vrij: "Deze dag telt als een dag zonder les.",
  vakantie: "Deze dagen tellen als vakantie.",
};

/**
 * De soorten op volgorde van hoe vaak je ze nodig hebt — niet op de technische
 * volgorde uit SOORT_INFO. "Vakantie" staat bewust achteraan: dat is de
 * zwaarste keuze (die maakt een hele dag leeg in je jaaroverzicht) en hoort
 * niet als eerste onder je duim te staan.
 */
const SOORT_VOLGORDE: Soort[] = [
  "overig",
  "gesprek",
  "toets",
  "rapport",
  "activiteit",
  "vergadering",
  "vrij",
  "vakantie",
];

const VELD =
  "w-full rounded-xl border border-black/10 bg-cream/50 px-4 py-2.5 text-sm text-ink outline-none transition-shadow placeholder:text-ink/35 focus:border-brand focus:shadow-[0_0_0_3px_rgba(47,158,110,0.18)]";

export default function AfspraakFormulier({
  vorm,
  soortOpen,
  setSoortOpen,
  fout,
  bezig,
  wijzigTitel,
  wijzigVeld,
  kiesSoort,
  bewaar,
  annuleren,
}: {
  vorm: Vorm;
  soortOpen: EigenAfspraakVorm["soortOpen"];
  setSoortOpen: EigenAfspraakVorm["setSoortOpen"];
  fout: EigenAfspraakVorm["fout"];
  bezig: EigenAfspraakVorm["bezig"];
  wijzigTitel: EigenAfspraakVorm["wijzigTitel"];
  wijzigVeld: EigenAfspraakVorm["wijzigVeld"];
  kiesSoort: EigenAfspraakVorm["kiesSoort"];
  bewaar: EigenAfspraakVorm["bewaar"];
  annuleren: EigenAfspraakVorm["annuleren"];
}) {
  return (
    <div className="flex flex-col gap-4">
      <label className="block">
        <span className="text-sm font-bold text-ink">Wat is het?</span>
        <input
          autoFocus
          value={vorm.titel}
          onChange={(e) => wijzigTitel(e.target.value)}
          placeholder="Bijv. Oudergesprekken groep 5"
          className={VELD + " mt-1.5"}
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <label className="min-w-[9rem] flex-1">
          <span className="text-sm font-bold text-ink">Wanneer?</span>
          <input
            type="date"
            value={vorm.datum}
            onChange={(e) =>
              wijzigVeld({
                datum: e.target.value,
                // Eén dag is verreweg het meest voorkomend; de einddatum
                // schuift daarom mee zolang je hem niet zelf hebt gezet.
                totDatum:
                  !vorm.totDatum || vorm.totDatum === vorm.datum ? e.target.value : vorm.totDatum,
              })
            }
            className={VELD + " mt-1.5"}
          />
        </label>
        <label className="min-w-[9rem] flex-1">
          <span className="text-sm font-bold text-ink">Tot en met</span>
          <input
            type="date"
            value={vorm.totDatum || vorm.datum}
            min={vorm.datum}
            onChange={(e) => wijzigVeld({ totDatum: e.target.value })}
            className={VELD + " mt-1.5"}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex items-center gap-2 py-2.5">
          <input
            type="checkbox"
            checked={vorm.heleDag}
            onChange={(e) => wijzigVeld({ heleDag: e.target.checked })}
            className="h-4 w-4 accent-[#25855a]"
          />
          <span className="text-sm font-bold text-ink">Hele dag</span>
        </label>
        {!vorm.heleDag && (
          <>
            <label>
              <span className="text-sm font-bold text-ink">Van</span>
              <TijdVeld
                key={(vorm.id ?? "nieuw") + "-begin"}
                value={vorm.begin}
                onChange={(v) => wijzigVeld({ begin: v })}
                className="mt-1.5"
              />
            </label>
            <label>
              <span className="text-sm font-bold text-ink">Tot</span>
              <TijdVeld
                key={(vorm.id ?? "nieuw") + "-eind"}
                value={vorm.eind}
                onChange={(v) => wijzigVeld({ eind: v })}
                className="mt-1.5"
              />
            </label>
          </>
        )}
      </div>

      <div>
        {soortOpen ? (
          <>
            <span className="text-sm font-bold text-ink">
              Wat voor soort?
              <span className="font-normal text-ink/50"> (bepaalt of je er een seintje van krijgt)</span>
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {SOORT_VOLGORDE.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => kiesSoort(s)}
                  className={
                    "rounded-xl border px-3.5 py-2 text-sm font-semibold transition " +
                    (vorm.soort === s
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-black/10 text-ink/70 hover:border-black/20")
                  }
                >
                  {SOORT_INFO[s].woord}
                </button>
              ))}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setSoortOpen(true)}
            className="flex flex-wrap items-baseline gap-x-2 text-left"
          >
            <span className="text-sm font-bold text-ink">Soort: {SOORT_INFO[vorm.soort].woord}</span>
            <span className="text-sm text-ink/45 underline-offset-2 hover:underline">
              klopt dat niet? wijzigen
            </span>
          </button>
        )}
        {WAT_LEVERT_HET_OP[vorm.soort] && (
          <p className="mt-2 text-xs text-ink/55">{WAT_LEVERT_HET_OP[vorm.soort]}</p>
        )}
      </div>

      {fout && (
        <p role="alert" className="text-sm font-semibold text-rose-700">
          {fout}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={bewaar}
          disabled={bezig}
          className="rounded-xl bg-brand-dark px-4 py-2 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.97] disabled:opacity-60"
        >
          {bezig ? "Bezig…" : vorm.id ? "Wijziging bewaren" : "Toevoegen"}
        </button>
        <button
          onClick={annuleren}
          className="rounded-xl border border-black/10 px-4 py-2 text-sm font-bold text-ink/60 transition-colors hover:text-ink"
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}

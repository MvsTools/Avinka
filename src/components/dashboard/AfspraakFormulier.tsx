"use client";

import TijdVeld from "./TijdVeld";
import type { EigenAfspraakVorm, Vorm } from "./useEigenAfspraakVorm";

// De velden van "zelf een afspraak toevoegen" — los van EigenAfspraken.tsx,
// zodat SchooljaarDagkaart hetzelfde formulier kan tonen op de plek waar je
// al bent (een dag in de kalender), in plaats van je naar Jaaroverzicht te
// sturen.
//
// Bewust GEEN "wat voor soort?"-vraag. Avinka herkent dat zelf uit de titel
// (zie useEigenAfspraakVorm → agenda-herken.ts) en gebruikt die herkenning op
// de achtergrond om te bepalen of en wanneer je er een seintje van krijgt.
// Mist de herkenning iets, dan gebeurt er gewoon niets — geen seintje is een
// veilige misser, in tegenstelling tot een verkeerd seintje. En komt er tóch
// een seintje dat niet klopt, dan klik je dat in "Wat eraan komt" gewoon weg.

const VELD =
  "w-full rounded-xl border border-black/10 bg-cream/50 px-4 py-2.5 text-sm text-ink outline-none transition-shadow placeholder:text-ink/35 focus:border-brand focus:shadow-[0_0_0_3px_rgba(47,158,110,0.18)]";

export default function AfspraakFormulier({
  vorm,
  fout,
  bezig,
  wijzigTitel,
  wijzigVeld,
  bewaar,
  annuleren,
  weghalen,
}: {
  vorm: Vorm;
  fout: EigenAfspraakVorm["fout"];
  bezig: EigenAfspraakVorm["bezig"];
  wijzigTitel: EigenAfspraakVorm["wijzigTitel"];
  wijzigVeld: EigenAfspraakVorm["wijzigVeld"];
  bewaar: EigenAfspraakVorm["bewaar"];
  annuleren: EigenAfspraakVorm["annuleren"];
  /** Alleen zinvol bij het wijzigen van een bestaande afspraak (vorm.id). */
  weghalen?: EigenAfspraakVorm["weghalen"];
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
        {vorm.id && weghalen && (
          <button
            onClick={() => weghalen(vorm.id!)}
            disabled={bezig}
            className="ml-auto rounded-xl px-4 py-2 text-sm font-bold text-ink/40 transition-colors hover:text-rose-700 disabled:opacity-50"
          >
            Verwijderen
          </button>
        )}
      </div>
    </div>
  );
}

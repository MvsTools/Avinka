"use client";

import { forwardRef, useImperativeHandle } from "react";
import { SOORT_INFO } from "@/lib/agenda-herken";
import { dagnaam, kort } from "@/lib/planning";
import type { PlanItem } from "@/lib/planning";
import AfspraakFormulier from "./AfspraakFormulier";
import { useEigenAfspraakVorm, type Vorm } from "./useEigenAfspraakVorm";

// Zelf een afspraak in je agenda zetten.
//
// Zonder gekoppelde schoolagenda bleef Mijn schooljaar leeg — en juist de
// dingen die JOU aangaan (jouw gespreksavond, de startdag van het team) staan
// vaak niet in de agenda die de school deelt.
//
// De velden zelf staan in AfspraakFormulier.tsx (ook gebruikt door het
// dagkaartje in de kalender) en de logica in useEigenAfspraakVorm.ts; dit
// bestand is de kaart in Jaaroverzicht: de knop, de lijst van wat je al hebt
// toegevoegd, en het openklappen van het formulier.

export type { Vorm };

/** Om het formulier van buitenaf te openen — bijv. met een "+" op een dag in
 *  de kalender, mét die datum al ingevuld. */
export type EigenAfsprakenHandle = { open: (start?: Partial<Vorm>) => void };

const EigenAfspraken = forwardRef<EigenAfsprakenHandle, {
  /** De afspraken die deze leerkracht zelf heeft ingevoerd. */
  eigen: PlanItem[];
  vandaag: string;
}>(function EigenAfspraken({ eigen, vandaag }, ref) {
  const f = useEigenAfspraakVorm(vandaag);

  useImperativeHandle(ref, () => ({ open: f.open }));

  if (!f.vorm && !f.gelukt && eigen.length === 0) return null;

  return (
    <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      {f.gelukt && !f.vorm && (
        <p role="status" className="text-sm font-semibold text-brand-dark">
          {f.gelukt}
        </p>
      )}

      {f.vorm && (
        <AfspraakFormulier
          vorm={f.vorm}
          soortOpen={f.soortOpen}
          setSoortOpen={f.setSoortOpen}
          fout={f.fout}
          bezig={f.bezig}
          wijzigTitel={f.wijzigTitel}
          wijzigVeld={f.wijzigVeld}
          kiesSoort={f.kiesSoort}
          bewaar={f.bewaar}
          annuleren={f.annuleren}
        />
      )}

      {eigen.length > 0 && (
        <div className={f.vorm || f.gelukt ? "mt-5 border-t border-black/5 pt-4" : ""}>
          <p className="text-xs font-bold uppercase tracking-wider text-ink/40">
            Jouw eigen afspraken ({eigen.length})
          </p>
          <ul className="mt-2 flex flex-col">
            {eigen.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-3 border-b border-black/5 py-2.5 last:border-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">{a.titel}</span>
                  <span className="block text-sm text-ink/55">
                    {dagnaam(a.datum)} {kort(a.datum)}
                    {a.totDatum && a.totDatum !== a.datum && ` t/m ${kort(a.totDatum)}`}
                    {!a.heleDag && a.begin && ` · ${a.begin}`}
                    {" · "}
                    {SOORT_INFO[a.soort]?.woord ?? a.soort}
                  </span>
                </span>
                <button
                  onClick={() =>
                    f.open({
                      id: a.id,
                      titel: a.titel,
                      datum: a.datum,
                      totDatum: a.totDatum,
                      heleDag: a.heleDag,
                      begin: a.begin ?? "",
                      eind: a.eind ?? "",
                      soort: a.soort,
                    })
                  }
                  className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-ink/55 transition-colors hover:text-ink"
                >
                  Wijzigen
                </button>
                <button
                  onClick={() => f.weghalen(a.id)}
                  disabled={f.bezig}
                  className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-ink/45 transition-colors hover:text-rose-700 disabled:opacity-50"
                >
                  Weghalen
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
});

export default EigenAfspraken;

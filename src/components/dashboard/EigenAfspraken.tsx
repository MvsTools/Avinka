"use client";

import { forwardRef, useImperativeHandle } from "react";
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
// bestand is alleen de knop-tot-formulier in Jaaroverzicht. Wijzigen en
// weghalen gebeurt NIET hier — dat gebeurt op de dag zelf, in het dagkaartje
// (SchooljaarDagkaart), zodat een eigen afspraak altijd op zijn eigen datum
// staat en nooit in een losse lijst daarboven.

export type { Vorm };

/** Om het formulier van buitenaf te openen — bijv. met een "+" op een dag in
 *  de kalender, mét die datum al ingevuld. */
export type EigenAfsprakenHandle = { open: (start?: Partial<Vorm>) => void };

const EigenAfspraken = forwardRef<EigenAfsprakenHandle, { vandaag: string }>(
  function EigenAfspraken({ vandaag }, ref) {
    const f = useEigenAfspraakVorm(vandaag);

    useImperativeHandle(ref, () => ({ open: f.open }));

    if (!f.vorm && !f.gelukt) return null;

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
            fout={f.fout}
            bezig={f.bezig}
            wijzigTitel={f.wijzigTitel}
            wijzigVeld={f.wijzigVeld}
            bewaar={f.bewaar}
            annuleren={f.annuleren}
          />
        )}
      </section>
    );
  },
);

export default EigenAfspraken;

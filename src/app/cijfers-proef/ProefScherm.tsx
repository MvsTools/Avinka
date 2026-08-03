"use client";

import { useEffect, useState } from "react";
import { WereldCijfers, urenUit } from "../_landing/Cijfers";
import { DONKER, SPECKLE_STIJL } from "../_landing/Wereld";

/* ⚠️ TIJDELIJKE PROEFPAGINA — /cijfers-proef. Weghalen zodra het bord is
   goedgekeurd.

   Dit rendert het ECHTE component uit _landing/Cijfers.tsx, niet een kopie.
   Dat is met opzet: een losse kopie loopt na de eerste wijziging uit de pas
   en dan beoordeel je iets anders dan wat er straks live staat. Hier zit
   alleen de bediening omheen: knoppen om een dag toe te voegen, en een
   vanzelf oplopende teller zodat het mechaniek te zien is. In het echt komt
   er veel minder vaak een dag bij. */

const START = { minuten: 77_040, leerkrachten: 37, uitwerkingen: 9_412 };
const MINUTEN_PER_UUR = 60;

export default function ProefScherm() {
  const [cijfers, setCijfers] = useState(START);
  const [loopt, setLoopt] = useState(true);

  const uurErbij = () =>
    setCijfers((c) => ({
      ...c,
      minuten: c.minuten + MINUTEN_PER_UUR,
      uitwerkingen: c.uitwerkingen + 2,
    }));

  useEffect(() => {
    if (!loopt) return;
    const t = setInterval(uurErbij, 4200);
    return () => clearInterval(t);
  }, [loopt]);

  return (
    <div className="relative min-h-screen" style={SPECKLE_STIJL}>
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-14">
        <h1
          className="font-display text-[clamp(2rem,4vw,3rem)] font-black tracking-tight"
          style={{ color: DONKER }}
        >
          Het klapbord, met echte bediening
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-ink/70">
          Testcijfers, niet de echte. Nu op {urenUit(cijfers.minuten)} uur. Zet het
          oplopen uit en klik zelf, dan zie je één kaartje omslaan; laat het lopen en je
          ziet af en toe twee kaartjes tegelijk gaan.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={uurErbij}
            className="rounded-xl bg-brand px-5 py-3 font-bold text-white transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Er komt een uur bij
          </button>
          <button
            type="button"
            onClick={() => setLoopt((l) => !l)}
            className="rounded-xl bg-white px-5 py-3 font-bold text-ink ring-1 ring-ink/10 transition hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {loopt ? "Zet vanzelf oplopen uit" : "Zet vanzelf oplopen aan"}
          </button>
          <button
            type="button"
            onClick={() => setCijfers(START)}
            className="rounded-xl px-4 py-3 font-semibold text-ink/60 underline underline-offset-4 transition hover:text-ink"
          >
            terug naar het begin
          </button>
        </div>

        {/* De drempels testen: hieronder valt de onderste regel weg, en bij
           heel weinig data verdwijnt de hele sectie. */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-base">
          <span className="text-ink/50">Drempels uitproberen:</span>
          <button
            type="button"
            onClick={() => setCijfers({ minuten: 77_040, leerkrachten: 9, uitwerkingen: 120 })}
            className="underline underline-offset-4 hover:text-brand-dark"
          >
            weinig leerkrachten en uitwerkingen
          </button>
          <button
            type="button"
            onClick={() => setCijfers({ minuten: 2_000, leerkrachten: 4, uitwerkingen: 30 })}
            className="underline underline-offset-4 hover:text-brand-dark"
          >
            bijna geen data (sectie hoort te verdwijnen)
          </button>
          {/* Wat gebeurt er als het echt gaat lopen? 1000 leerkrachten die elk
             ~2 uur per week terugwinnen is bijna 100.000 uur per jaar. */}
          <button
            type="button"
            onClick={() =>
              setCijfers({ minuten: 5_580_000, leerkrachten: 1_000, uitwerkingen: 100_000 })
            }
            className="underline underline-offset-4 hover:text-brand-dark"
          >
            over een jaar bij 1000 leerkrachten
          </button>
        </div>
      </div>

      <div className="relative z-10 mt-10">
        <WereldCijfers cijfers={cijfers} bijhouden={false} />
      </div>
    </div>
  );
}

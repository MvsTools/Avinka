"use client";

import { useEffect, useState } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   ⚠️ TIJDELIJKE TESTPAGINA — hoort bij het uitzoeken waarom op de telefoon van
   de eigenaar geen enkele knop op /nieuw6 reageert.

   Wat we inmiddels weten, via public/telefoontest.html (kale HTML, geen Next):
   javascript draait, moderne schrijfwijze werkt, een los scriptbestand wordt
   opgehaald én een knop reageert op een vingertik. Het toestel is dus in orde.

   Wat nog openstaat: valt Next/React op afstand niet aan (dan doet ook deze
   piepkleine pagina niets), of struikelt specifiek de landingspagina ergens
   over (dan werkt deze pagina wél). Daarom staat hier het kleinst mogelijke
   React-scherm: één knop, één teller.

   🔑 De regel "React is wakker" verschijnt alleen ná hydratatie. De rest van
   deze pagina komt van de server en zegt dus niets over of React draait — dat
   onderscheid is precies waar ik eerder in ben getrapt bij het meetstrookje.
   Weggooien zodra de oorzaak bekend is.
   ────────────────────────────────────────────────────────────────────────── */

export default function Knoptest() {
  const [teller, setTeller] = useState(0);
  const [wakker, setWakker] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    setWakker(true);
    const bijFout = (e: ErrorEvent) => setFout(e.message);
    window.addEventListener("error", bijFout);
    return () => window.removeEventListener("error", bijFout);
  }, []);

  return (
    <main style={{ padding: 20, font: "16px/1.6 system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Knoptest</h1>

      <p
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          marginBottom: 10,
          background: wakker ? "#1f7a4d" : "#8c2b2b",
          color: "#fff",
          fontWeight: 700,
        }}
      >
        {wakker ? "React is wakker" : "React is NIET wakker"}
      </p>

      <p style={{ marginBottom: 12 }}>
        Knop ingedrukt: <strong>{teller}×</strong>
      </p>

      <button
        type="button"
        onClick={() => setTeller((t) => t + 1)}
        style={{
          padding: "16px 22px",
          fontSize: 17,
          fontWeight: 700,
          borderRadius: 12,
          border: 0,
          background: "#17251d",
          color: "#f6f3ea",
        }}
      >
        Druk hier
      </button>

      {fout && (
        <p style={{ marginTop: 14, color: "#8c2b2b", fontWeight: 700 }}>fout: {fout}</p>
      )}
    </main>
  );
}

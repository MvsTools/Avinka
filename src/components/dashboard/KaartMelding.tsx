"use client";

import { useEffect, useRef, useState } from "react";

/* Klein uitroepteken in de hoek van een toolkaart, met de uitleg erachter.
 *
 * Waarom een client-component voor zoiets kleins: de kaart is één grote
 * <Link>. Een klik hierbinnen navigeert dus uit zichzelf naar de tool, en
 * Next slaat dat navigeren alleen over als de klik is afgebroken. Vandaar de
 * preventDefault + stopPropagation hieronder — zonder dat opent de tool zodra
 * je de uitleg wilt lezen.
 *
 * Aanwijzen én klikken allebei: aanwijzen bestaat niet op een telefoon, en
 * alleen-klikken voelt op een muis als een extra handeling. Toetsenbord komt
 * er via focus gratis bij. */
export default function KaartMelding({
  tekst,
  className = "absolute right-5 top-5 z-10",
}: {
  tekst: string;
  /* Waar in de kaart het uitroepteken hangt. Standaard rechtsboven; los mee te
     geven omdat niet elke kaart daar evenveel ruimte heeft. */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wikkel = useRef<HTMLSpanElement>(null);

  // Buiten de melding tikken sluit hem weer. Alleen nodig zolang hij openstaat.
  useEffect(() => {
    if (!open) return;
    function buitenaf(e: PointerEvent) {
      if (!wikkel.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", buitenaf);
    return () => document.removeEventListener("pointerdown", buitenaf);
  }, [open]);

  return (
    <span
      ref={wikkel}
      className={className}
      /* Bewust pointerEnter met een muis-controle en niet mouseEnter: bij een
         tik op een telefoon doet de browser alsof je ook met de muis aanwijst.
         Zonder deze controle opent de eerste tik de uitleg en sluit de klik
         die er direct achteraan komt hem weer, en zie je dus niets. */
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setOpen(false);
      }}
    >
      <button
        type="button"
        aria-label="Waarom kan ik hier niet opslaan?"
        aria-expanded={open}
        onClick={(e) => {
          // Niet doorklikken naar de tool: zie de uitleg bovenaan.
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-sm font-black text-amber-700 transition hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        !
      </button>

      {open && (
        <span
          role="note"
          className="absolute right-0 top-8 w-64 max-w-[calc(100vw-4rem)] rounded-2xl bg-ink px-4 py-3 text-sm leading-6 text-white shadow-lg"
        >
          {tekst}
        </span>
      )}
    </span>
  );
}

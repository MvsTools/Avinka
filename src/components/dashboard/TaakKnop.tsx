"use client";

import { useState } from "react";

// Zet één voorgestelde taak op je eigen takenlijst. Gebruikt door "Wat eraan
// komt" voor het werk waar geen tool bij hoort (de toetsen klaarzetten).
//
// ⚠️ Deze knop kan mislukken, dus hij zegt het ook als dat gebeurt. Dat is de
// terugkerende les uit dit project: een actie die stilletjes niets doet ziet er
// precies zo uit als een actie die lukt.

type Stand = "klaar" | "bezig" | "gedaan" | "mislukt";

export default function TaakKnop({
  taken,
  deadline,
  label,
  alOpDeLijst = false,
}: {
  /**
   * Wat er op de takenlijst komt. Meestal één regel, maar in de startweek
   * staan er meerdere klussen tegelijk klaar en zet één knop ze allemaal neer.
   */
  taken: string[];
  /** De dag waarop het af moet zijn ("2026-08-25"). */
  deadline?: string;
  /** Wat er op de knop staat ("Toetsen klaarzetten"). */
  label: string;
  alOpDeLijst?: boolean;
}) {
  const [stand, setStand] = useState<Stand>(alOpDeLijst ? "gedaan" : "klaar");

  if (stand === "gedaan") {
    return (
      <span className="flex shrink-0 items-center gap-1.5 self-start rounded-xl px-4 py-2 text-sm font-bold text-brand-dark sm:self-auto">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
        {taken.length > 1 ? `${taken.length} taken staan op je lijst` : "Staat op je lijst"}
      </span>
    );
  }

  const zet = async () => {
    setStand("bezig");
    try {
      // Eén voor één: de API neemt één taak per keer aan, en zo weten we ook
      // zeker dat een half gelukte poging zichtbaar mislukt in plaats van
      // stilletjes de helft neer te zetten.
      for (const tekst of taken) {
        const res = await fetch("/api/taken", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tekst, ...(deadline ? { deadline } : {}) }),
        });
        if (!res.ok) {
          setStand("mislukt");
          return;
        }
      }
      setStand("gedaan");
    } catch {
      setStand("mislukt");
    }
  };

  return (
    <span className="flex shrink-0 flex-col items-start gap-1 self-start sm:items-end sm:self-auto">
      <button
        type="button"
        onClick={zet}
        disabled={stand === "bezig"}
        className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-bold text-ink/75 transition-transform duration-150 hover:text-ink active:scale-[0.97] disabled:opacity-60"
      >
        {stand === "bezig" ? "Bezig…" : label}
        <span aria-hidden className="ml-1.5 text-ink/40">
          +
        </span>
      </button>
      {stand === "mislukt" && (
        <span role="status" className="text-xs font-semibold text-rose-700">
          Niet gelukt. Probeer het nog eens.
        </span>
      )}
    </span>
  );
}

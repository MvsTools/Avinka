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
  tekst,
  deadline,
  label,
  alOpDeLijst = false,
}: {
  /** De tekst zoals hij op de takenlijst komt. */
  tekst: string;
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
        Staat op je lijst
      </span>
    );
  }

  const zet = async () => {
    setStand("bezig");
    try {
      const res = await fetch("/api/taken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tekst, ...(deadline ? { deadline } : {}) }),
      });
      setStand(res.ok ? "gedaan" : "mislukt");
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

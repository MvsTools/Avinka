"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getTaken, setTaakGedaan, type Taak } from "@/lib/db";

// In-/uitklapbaar takenlijst-overzicht op het startscherm. Ingeklapt zie je
// alleen hoeveel er openstaat; uitgeklapt verschijnt de lijst. Hier kun je
// alléén afvinken — toevoegen, deadlines en bewerken doe je in de takenlijst
// zelf (link onderaan). Bewust licht, zodat de tools de hoofdmoot blijven.
export default function TakenOverzicht() {
  const [taken, setTaken] = useState<Taak[] | null>(null);
  const [uit, setUit] = useState(false);

  useEffect(() => {
    getTaken().then(setTaken);
  }, []);

  // Skeleton met dezelfde hoogte, zodat de pagina niet verspringt.
  if (!taken) {
    return <div className="h-[52px] animate-pulse rounded-2xl border border-black/5 bg-white/60" />;
  }

  const open = taken
    .filter((t) => !t.gedaan)
    .sort((a, b) => {
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    });

  function vinkAf(id: string) {
    // Optimistisch wegstrepen; de taak valt meteen uit de open-lijst.
    setTaken((ts) => (ts ?? []).map((t) => (t.id === id ? { ...t, gedaan: true } : t)));
    setTaakGedaan(id, true);
  }

  // Lege lijst: een rustig linkje, niets om uit te klappen.
  if (open.length === 0) {
    return (
      <Link
        href="/dashboard/taken"
        className="group flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-5 py-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <span className="text-lg" aria-hidden>
          📋
        </span>
        <span className="text-ink/60">Je takenlijst is leeg.</span>
        <span className="ml-auto font-bold text-brand transition group-hover:translate-x-0.5">→</span>
      </Link>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setUit((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-cream/50"
        aria-expanded={uit}
      >
        <span className="text-lg" aria-hidden>
          📋
        </span>
        <span className="text-sm font-bold text-ink">
          {open.length} {open.length === 1 ? "taak" : "taken"} open
        </span>
        <svg
          viewBox="0 0 24 24"
          className={"ml-auto h-4 w-4 text-ink/40 transition-transform " + (uit ? "rotate-180" : "")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {uit && (
        <div className="border-t border-black/5 px-3 pb-3 pt-1">
          <ul className="flex flex-col">
            {open.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => vinkAf(t.id)}
                  className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-cream"
                  title="Afvinken"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-black/15 text-white transition group-hover:border-brand group-hover:bg-brand">
                    <svg viewBox="0 0 24 24" className="h-3 w-3 opacity-0 transition group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1 text-sm text-ink/80">{t.tekst}</span>
                </button>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard/taken"
            className="mt-1 inline-block px-2 text-xs font-semibold text-brand hover:underline"
          >
            Naar je takenlijst →
          </Link>
        </div>
      )}
    </div>
  );
}

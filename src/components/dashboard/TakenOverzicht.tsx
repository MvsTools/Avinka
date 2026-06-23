"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getTaken, setTaakGedaan, type Taak } from "@/lib/db";

// Compact takenlijst-knopje in de header, naast de streak. Ingeklapt zie je
// alleen hoeveel er openstaat; klik opent een klein paneeltje met je open taken.
// Daarin kun je alléén afvinken — toevoegen, deadlines en bewerken doe je in de
// takenlijst zelf (link onderaan). Bewust klein, zodat de tools de held blijven.
export default function TakenOverzicht() {
  const [taken, setTaken] = useState<Taak[] | null>(null);
  const [uit, setUit] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTaken().then(setTaken);
  }, []);

  // Klik buiten het paneeltje sluit het.
  useEffect(() => {
    if (!uit) return;
    function buiten(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setUit(false);
    }
    document.addEventListener("mousedown", buiten);
    return () => document.removeEventListener("mousedown", buiten);
  }, [uit]);

  if (!taken) {
    return <div className="h-[50px] w-28 shrink-0 animate-pulse rounded-2xl border border-black/5 bg-white/60" />;
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
    setTaken((ts) => (ts ?? []).map((t) => (t.id === id ? { ...t, gedaan: true } : t)));
    setTaakGedaan(id, true);
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setUit((o) => !o)}
        className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        aria-expanded={uit}
        title="Je open taken"
      >
        <span className="flex h-12 w-11 shrink-0 items-center justify-center text-[28px]" aria-hidden>
          📋
        </span>
        <div className="min-w-0 pr-1 text-left">
          <p className="font-bold leading-tight text-ink">
            {open.length} {open.length === 1 ? "taak" : "taken"} open
          </p>
          <p className="mt-0.5 text-xs text-ink/55">
            {open.length === 0 ? "Alles afgevinkt" : "Klik om af te vinken"}
          </p>
        </div>
        <svg
          viewBox="0 0 24 24"
          className={"h-4 w-4 shrink-0 text-ink/40 transition-transform " + (uit ? "rotate-180" : "")}
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
        <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-2xl border border-black/10 bg-white p-2 shadow-xl">
          {open.length === 0 ? (
            <p className="px-2 py-3 text-sm text-ink/55">Niets meer open. Lekker bezig!</p>
          ) : (
            <ul className="flex max-h-72 flex-col overflow-y-auto">
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
          )}
          <Link
            href="/dashboard/taken"
            className="mt-1 inline-block px-2 py-1 text-xs font-semibold text-brand hover:underline"
          >
            Naar je takenlijst →
          </Link>
        </div>
      )}
    </div>
  );
}

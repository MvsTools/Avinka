"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { addTaak, getTaken, setTaakGedaan, setTaakDeadline, type Taak } from "@/lib/db";

// Compact takenlijst-knopje in de header, naast de streak. Ingeklapt zie je
// alleen hoeveel er openstaat; klik opent een klein paneeltje met je open taken.
// Daarin kun je afvinken en snel een taak toevoegen; deadlines, wekelijks en
// bewerken doe je in de takenlijst zelf (link onderaan). Bewust klein, zodat de
// tools de held blijven.
export default function TakenOverzicht() {
  const [taken, setTaken] = useState<Taak[] | null>(null);
  const [uit, setUit] = useState(false);
  const [invoer, setInvoer] = useState("");
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

  // Een wekelijkse taak die nog ruim vóór z'n deadline ligt is "gepland": net als
  // in de takenlijst zelf verschijnt die pas 2 dagen van tevoren, ook hier.
  const verstopt = (t: Taak) => t.wekelijks && !!t.deadline && dagenTot(t.deadline) > 2;

  const open = taken
    .filter((t) => !t.gedaan && !verstopt(t))
    .sort((a, b) => {
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    });

  function vinkAf(taak: Taak) {
    // Wekelijkse taak afvinken = niet "klaar", maar een week vooruit plannen.
    // Zo verdwijnt hij uit de lijst en komt hij vanzelf 2 dagen voor de volgende
    // keer weer terug, precies zoals in de takenlijst zelf.
    if (taak.wekelijks) {
      const basis = taak.deadline ? new Date(taak.deadline + "T00:00:00") : new Date();
      basis.setDate(basis.getDate() + 7);
      const nieuw = isoDate(basis);
      setTaken((ts) => (ts ?? []).map((t) => (t.id === taak.id ? { ...t, deadline: nieuw } : t)));
      setTaakDeadline(taak.id, nieuw);
      return;
    }
    setTaken((ts) => (ts ?? []).map((t) => (t.id === taak.id ? { ...t, gedaan: true } : t)));
    setTaakGedaan(taak.id, true);
  }

  async function voegToe(e: React.FormEvent) {
    e.preventDefault();
    const t = invoer.trim();
    if (!t) return;
    setInvoer("");
    const nieuw = await addTaak(t);
    if (nieuw) setTaken((ts) => [nieuw, ...(ts ?? [])]);
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
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-xl" aria-hidden>
          📋
        </span>
        <span className="text-sm font-bold text-ink">
          {open.length} {open.length === 1 ? "taak" : "taken"}
        </span>
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
                    onClick={() => vinkAf(t)}
                    className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-cream"
                    title="Afvinken"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-black/15 text-white transition group-hover:border-brand group-hover:bg-brand">
                      <svg viewBox="0 0 24 24" className="h-3 w-3 opacity-0 transition group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1 text-sm text-ink/80">{t.tekst}</span>
                    {t.deadline && dagenTot(t.deadline) === 0 && (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4 shrink-0 text-amber-500"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-label="Voor vandaag gepland"
                      >
                        <title>Voor vandaag gepland</title>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={voegToe} className="mt-1 flex items-center gap-2 border-t border-black/5 px-2 pt-2">
            <input
              value={invoer}
              onChange={(e) => setInvoer(e.target.value)}
              placeholder="Snel een taak toevoegen…"
              className="min-w-0 flex-1 rounded-xl bg-cream px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink/45 focus:ring-2 focus:ring-brand/20"
            />
            <button
              type="submit"
              disabled={!invoer.trim()}
              className="shrink-0 rounded-xl bg-brand px-3 py-2 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-50"
              aria-label="Taak toevoegen"
            >
              +
            </button>
          </form>

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

// Datum als YYYY-MM-DD (lokale tijd).
function isoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Aantal dagen tot een deadline (negatief = te laat).
function dagenTot(iso: string): number {
  const vandaag = new Date();
  vandaag.setHours(0, 0, 0, 0);
  return Math.round((new Date(iso + "T00:00:00").getTime() - vandaag.getTime()) / 86400000);
}

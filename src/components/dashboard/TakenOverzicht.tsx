"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getTaken, type Taak } from "@/lib/db";

// Read-only overzichtje van je open taken op het startscherm. Je kunt hier niets
// aanpassen of afvinken — de hele kaart is een link naar de volledige takenlijst,
// waar dat wél kan. Bewust een spiegel van je to-do, zodat je 'm dagelijks ziet.
const MAX = 5;

// Zelfde dringendheid-label + kleur als in de takenlijst (TakenView).
function deadlineInfo(d: string): { label: string; klasse: string } {
  const vandaag = new Date();
  vandaag.setHours(0, 0, 0, 0);
  const due = new Date(d + "T00:00:00");
  const dagen = Math.round((due.getTime() - vandaag.getTime()) / 86400000);
  let label: string;
  if (dagen < 0) label = "Te laat";
  else if (dagen === 0) label = "Vandaag";
  else if (dagen === 1) label = "Morgen";
  else label = due.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
  const klasse =
    dagen < 0
      ? "border-rose-200 bg-rose-50 text-rose-600"
      : dagen <= 1
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-black/10 bg-cream text-ink/60";
  return { label, klasse };
}

export default function TakenOverzicht() {
  const [taken, setTaken] = useState<Taak[] | null>(null);

  useEffect(() => {
    getTaken().then(setTaken);
  }, []);

  // Skeleton met dezelfde hoogte-orde, zodat het grid niet verspringt.
  if (!taken) {
    return <div className="h-44 animate-pulse rounded-3xl border border-black/5 bg-white/60" />;
  }

  const open = taken
    .filter((t) => !t.gedaan)
    .sort((a, b) => {
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    });
  const tonen = open.slice(0, MAX);
  const meer = open.length - tonen.length;

  return (
    <Link
      href="/dashboard/taken"
      className="group flex flex-col rounded-3xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
      title="Naar je takenlijst"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
          <span className="text-xl">📋</span> Je takenlijst
        </h3>
        {open.length > 0 && (
          <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand">
            {open.length} te doen
          </span>
        )}
      </div>

      {open.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-ink/55">
          Niets meer op je lijst. Lekker bezig — geniet van je vrije tijd.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {tonen.map((t) => {
            const dl = t.deadline ? deadlineInfo(t.deadline) : null;
            return (
              <li key={t.id} className="flex items-center gap-2.5">
                <span className="h-4 w-4 shrink-0 rounded-full border-2 border-black/15" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm text-ink/80">{t.tekst}</span>
                {dl && (
                  <span
                    className={"shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold " + dl.klasse}
                  >
                    {dl.label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <span className="mt-auto inline-block pt-3 text-sm font-bold text-brand">
        {meer > 0 ? `Nog ${meer} meer — naar je takenlijst →` : "Naar je takenlijst →"}
      </span>
    </Link>
  );
}

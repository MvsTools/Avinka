"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getTaken, type Taak } from "@/lib/db";

// Slank takenlijst-strookje op het startscherm: hoeveel staat er open + de
// dringendste taak. Bewust licht, zodat de tools de hoofdmoot blijven. Je kunt
// hier niets aanpassen; de hele strip linkt naar de volledige takenlijst.

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
  const top = open[0];
  const topDl = top?.deadline ? deadlineInfo(top.deadline) : null;

  return (
    <Link
      href="/dashboard/taken"
      title="Naar je takenlijst"
      className="group flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-5 py-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="text-lg" aria-hidden>
        📋
      </span>

      {open.length === 0 ? (
        <span className="text-sm text-ink/60">Je takenlijst is leeg. Iets toevoegen?</span>
      ) : (
        <>
          <span className="shrink-0 text-sm font-bold text-ink">
            {open.length} {open.length === 1 ? "taak" : "taken"} open
          </span>
          {top && (
            <>
              <span className="shrink-0 text-ink/25" aria-hidden>
                ·
              </span>
              <span className="min-w-0 truncate text-sm text-ink/65">{top.tekst}</span>
              {topDl && (
                <span
                  className={
                    "shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold " + topDl.klasse
                  }
                >
                  {topDl.label}
                </span>
              )}
            </>
          )}
        </>
      )}

      <span className="ml-auto shrink-0 text-base font-bold text-brand transition group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  );
}

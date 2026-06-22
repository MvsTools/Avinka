"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStreak } from "@/lib/db";
import { huidigeMijlpaal, volgendeMijlpaal } from "@/lib/streak";

// Compacte streak-vlam voor het startscherm (lichte achtergrond), zodat je je
// reeks meteen ziet. Zelfde data en mijlpalen als de grote vlam in Statistieken.
export default function StreakBadge() {
  const [data, setData] = useState<{ streak: number; record: number } | null>(null);

  useEffect(() => {
    getStreak().then(setData);
  }, []);

  // Skeleton met dezelfde maat, zodat de header niet verspringt bij het laden.
  if (!data) {
    return <div className="h-[68px] w-56 shrink-0 animate-pulse rounded-2xl border border-black/5 bg-white/60" />;
  }

  const { streak, record } = data;
  const dood = streak === 0;
  const mijlpaal = huidigeMijlpaal(streak);
  const volgende = volgendeMijlpaal(streak);

  let sub: string;
  if (dood) sub = "Gebruik een tool om te starten";
  else if (mijlpaal) sub = `${mijlpaal.emoji} ${mijlpaal.titel}`;
  else if (volgende) sub = `Nog ${volgende.vanaf - streak} tot ${volgende.emoji} ${volgende.titel}`;
  else if (record > streak) sub = `Record: ${record}`;
  else sub = "Lekker bezig!";

  return (
    <Link
      href="/dashboard/statistieken"
      className="flex shrink-0 items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      title="Bekijk je statistieken"
    >
      <div className="relative h-12 w-11 shrink-0">
        <svg
          viewBox="0 0 24 24"
          className="h-full w-full [filter:drop-shadow(0_3px_5px_rgba(0,0,0,0.18))]"
          aria-hidden
        >
          <defs>
            <linearGradient id="vlam-badge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff3d00" />
              <stop offset="45%" stopColor="#ff9100" />
              <stop offset="100%" stopColor="#ffd000" />
            </linearGradient>
          </defs>
          <path
            d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
            fill={dood ? "rgba(20,18,40,0.14)" : "url(#vlam-badge)"}
          />
        </svg>
        <span
          className={
            "absolute inset-0 flex items-center justify-center pt-1.5 font-serif text-lg font-bold " +
            (dood ? "text-ink/40" : "text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.35)]")
          }
        >
          {streak}
        </span>
      </div>
      <div className="min-w-0 pr-1">
        <p className="font-bold leading-tight text-ink">
          {dood ? "Start je streak" : `${streak} ${streak === 1 ? "dag" : "dagen"} op rij`}
        </p>
        <p className="mt-0.5 text-xs text-ink/55">{sub}</p>
      </div>
    </Link>
  );
}

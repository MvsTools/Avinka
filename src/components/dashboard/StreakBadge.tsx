"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStreak } from "@/lib/db";

// Compacte streak-vlam voor het startscherm (lichte achtergrond), zodat je je
// reeks meteen ziet. Zelfde data en mijlpalen als de grote vlam in Statistieken.
export default function StreakBadge() {
  const [data, setData] = useState<{ streak: number; record: number } | null>(null);

  useEffect(() => {
    getStreak().then(setData);
  }, []);

  // Skeleton met dezelfde maat, zodat de header niet verspringt bij het laden.
  if (!data) {
    return <div className="h-[50px] w-28 shrink-0 animate-pulse rounded-2xl border border-black/5 bg-white/60" />;
  }

  const { streak } = data;
  const dood = streak === 0;

  return (
    <Link
      href="/dashboard/statistieken"
      className="flex shrink-0 items-center gap-2 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      title="Bekijk je statistieken"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-[22px] shrink-0 [filter:drop-shadow(0_2px_3px_rgba(0,0,0,0.15))]"
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
      <span className="text-sm font-bold text-ink">
        {dood ? "Geen reeks" : `${streak} ${streak === 1 ? "dag" : "dagen"}`}
      </span>
    </Link>
  );
}

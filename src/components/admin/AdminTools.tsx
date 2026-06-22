"use client";

import { useEffect, useState } from "react";
import { getCommunityStats, type CommunityStats } from "@/lib/db";
import { TIJD_DEFS } from "@/lib/tijdwinst";

// Zelfde acties als in "Mijn statistieken" — uit de centrale tijdwinst-bron.
const DEFS = TIJD_DEFS;

function urenTekst(min: number): string {
  const u = Math.round(min / 60);
  return u.toLocaleString("nl-NL") + (u === 1 ? " uur" : " uur");
}

export default function AdminTools() {
  const [comm, setComm] = useState<CommunityStats | null>(null);
  const [laden, setLaden] = useState(true);

  useEffect(() => {
    getCommunityStats().then((c) => {
      setComm(c);
      setLaden(false);
    });
  }, []);

  if (laden) {
    return <div className="h-40 animate-pulse rounded-3xl border border-black/5 bg-white/60" />;
  }
  if (!comm) {
    return (
      <p className="rounded-2xl bg-white px-5 py-4 text-sm text-ink/60 shadow-sm">
        Nog geen gebruiksgegevens.
      </p>
    );
  }

  const aantal = (s: string) => comm.som[s] ?? 0;
  const rijen = DEFS.map((d) => ({ ...d, n: aantal(d.sleutel) })).sort((a, b) => b.n - a.n);
  const totaalActies = rijen.reduce((s, r) => s + r.n, 0);
  const totaalMin = rijen.reduce(
    (s, r) => s + (comm.somMinuten[r.sleutel] ?? r.n * r.vast),
    0,
  );
  const maxN = Math.max(...rijen.map((r) => r.n), 1);

  return (
    <div className="flex flex-col gap-6">
      {/* Totalen */}
      <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Totaal</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-brand/30 bg-brand-soft p-4">
            <p className="font-serif text-3xl font-semibold text-brand">
              {comm.gebruikers.toLocaleString("nl-NL")}
            </p>
            <p className="mt-0.5 text-sm text-ink/60">Actieve gebruikers</p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-cream p-4">
            <p className="font-serif text-3xl font-semibold text-ink">
              {totaalActies.toLocaleString("nl-NL")}
            </p>
            <p className="mt-0.5 text-sm text-ink/60">Acties totaal</p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-cream p-4">
            <p className="font-serif text-3xl font-semibold text-ink">{urenTekst(totaalMin)}</p>
            <p className="mt-0.5 text-sm text-ink/60">Tijd bespaard (schatting)</p>
          </div>
        </div>
      </section>

      {/* Per actie */}
      <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Gebruik per tool/actie</h2>
        <div className="mt-4 flex flex-col gap-3">
          {rijen.map((r) => (
            <div key={r.sleutel}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-semibold text-ink">
                  {r.icon} {r.label}
                </span>
                <span className="text-ink/60">{r.n.toLocaleString("nl-NL")}×</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/5">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${Math.round((r.n / maxN) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  getAdminVerbruik,
  getAdminVerbruikTijd,
  type VerbruikRij,
  type VerbruikDag,
} from "@/lib/db";
import { kostenUSD, kostenTekst } from "@/lib/ai-kosten";
import BarChart from "@/components/admin/BarChart";

function dagLabel(d: string): string {
  const dt = new Date(d);
  return `${dt.getDate()}/${dt.getMonth() + 1}`;
}

const TOOL_NAMEN: Record<string, string> = {
  rapporten: "Rapporten",
  toetsanalyse: "Toetsanalyse",
  oudercontact: "Oudercontact",
  plattegrond: "Plattegrond",
  onbekend: "Onbekend",
};

const PERIODES = [
  { dagen: 7, label: "7 dagen" },
  { dagen: 30, label: "30 dagen" },
  { dagen: 90, label: "90 dagen" },
];

function kost(r: VerbruikRij): number {
  return kostenUSD(r.model, {
    input: r.input,
    output: r.output,
    cache_creation: r.cache_creation,
    cache_read: r.cache_read,
  });
}

function groepeer(rijen: VerbruikRij[], sleutel: "tool" | "model") {
  const map = new Map<string, { calls: number; kosten: number; tokens: number }>();
  for (const r of rijen) {
    const k = r[sleutel] || "onbekend";
    const huidig = map.get(k) ?? { calls: 0, kosten: 0, tokens: 0 };
    huidig.calls += r.calls;
    huidig.kosten += kost(r);
    huidig.tokens += r.input + r.output + r.cache_creation + r.cache_read;
    map.set(k, huidig);
  }
  return [...map.entries()]
    .map(([naam, v]) => ({ naam, ...v }))
    .sort((a, b) => b.kosten - a.kosten);
}

export default function AdminVerbruik() {
  const [dagen, setDagen] = useState(30);
  const [rijen, setRijen] = useState<VerbruikRij[] | null>(null);
  const [perDag, setPerDag] = useState<VerbruikDag[]>([]);

  useEffect(() => {
    setRijen(null);
    getAdminVerbruik(dagen).then(setRijen);
    getAdminVerbruikTijd(dagen).then(setPerDag);
  }, [dagen]);

  // Kosten per dag (sommeer over modellen binnen elke dag).
  const kostenPerDag = (() => {
    const map = new Map<string, number>();
    for (const r of perDag) {
      const k = kostenUSD(r.model, {
        input: r.input,
        output: r.output,
        cache_creation: r.cache_creation,
        cache_read: r.cache_read,
      });
      map.set(r.dag, (map.get(r.dag) ?? 0) + k);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  })();

  return (
    <div className="flex flex-col gap-6">
      {/* Periode-keuze */}
      <div className="inline-flex w-fit rounded-2xl border border-black/10 bg-white p-1 shadow-sm">
        {PERIODES.map((p) => (
          <button
            key={p.dagen}
            type="button"
            onClick={() => setDagen(p.dagen)}
            className={
              "rounded-xl px-4 py-2 text-sm font-bold transition " +
              (dagen === p.dagen ? "bg-ink text-white shadow-sm" : "text-ink/60 hover:text-ink")
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      {rijen === null ? (
        <div className="h-40 animate-pulse rounded-3xl border border-black/5 bg-white/60" />
      ) : rijen.length === 0 ? (
        <p className="rounded-2xl bg-white px-5 py-4 text-sm text-ink/60 shadow-sm">
          Nog geen AI-verbruik in deze periode.
        </p>
      ) : (
        <Inhoud rijen={rijen} />
      )}

      <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Kosten over tijd</h2>
        <p className="mt-0.5 text-sm text-ink/55">Geschatte AI-kosten per dag.</p>
        <div className="mt-4">
          <BarChart
            data={kostenPerDag.map(([dag, kosten]) => ({
              label: dagLabel(dag),
              value: Math.round(kosten * 100) / 100,
              titel: dag,
            }))}
            kleur="#2f9e6e"
            formatValue={(n) => kostenTekst(n)}
          />
        </div>
      </section>

      <p className="text-xs text-ink/45">
        Kosten zijn een schatting op basis van de Anthropic-lijstprijzen (zie
        <code className="mx-1 rounded bg-black/5 px-1">lib/ai-kosten.ts</code>) en in US dollar.
        De tokens zelf worden exact gelogd; pas de prijzen aan als ze wijzigen.
      </p>
    </div>
  );
}

function Inhoud({ rijen }: { rijen: VerbruikRij[] }) {
  const totaalKosten = rijen.reduce((s, r) => s + kost(r), 0);
  const totaalCalls = rijen.reduce((s, r) => s + r.calls, 0);
  const totaalTokens = rijen.reduce(
    (s, r) => s + r.input + r.output + r.cache_creation + r.cache_read,
    0,
  );
  const perTool = groepeer(rijen, "tool");
  const perModel = groepeer(rijen, "model");
  const maxToolKosten = Math.max(...perTool.map((t) => t.kosten), 0.0001);

  return (
    <>
      {/* Totalen */}
      <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Totaal</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-brand/30 bg-brand-soft p-4">
            <p className="font-serif text-3xl font-semibold text-brand">{kostenTekst(totaalKosten)}</p>
            <p className="mt-0.5 text-sm text-ink/60">Geschatte AI-kosten</p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-cream p-4">
            <p className="font-serif text-3xl font-semibold text-ink">{totaalCalls.toLocaleString("nl-NL")}</p>
            <p className="mt-0.5 text-sm text-ink/60">AI-aanroepen</p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-cream p-4">
            <p className="font-serif text-3xl font-semibold text-ink">
              {(totaalTokens / 1_000_000).toFixed(2)}M
            </p>
            <p className="mt-0.5 text-sm text-ink/60">Tokens totaal</p>
          </div>
        </div>
      </section>

      {/* Per tool */}
      <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Kosten per tool</h2>
        <div className="mt-4 flex flex-col gap-3">
          {perTool.map((t) => (
            <div key={t.naam}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-semibold text-ink">{TOOL_NAMEN[t.naam] ?? t.naam}</span>
                <span className="text-ink/60">
                  {kostenTekst(t.kosten)} · {t.calls.toLocaleString("nl-NL")} calls
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/5">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${Math.round((t.kosten / maxToolKosten) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Per model */}
      <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Kosten per model</h2>
        <div className="mt-4 divide-y divide-black/5">
          {perModel.map((m) => (
            <div key={m.naam} className="flex items-baseline justify-between gap-3 py-2 text-sm">
              <span className="font-mono text-ink/80">{m.naam}</span>
              <span className="text-ink/60">
                {kostenTekst(m.kosten)} · {m.calls.toLocaleString("nl-NL")} calls
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

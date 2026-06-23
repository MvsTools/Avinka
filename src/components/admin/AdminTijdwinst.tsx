"use client";

import { useEffect, useState } from "react";
import { getAdminTijdwinst, type AdminTijdwinst } from "@/lib/db";
import { TIJD_DEFS } from "@/lib/tijdwinst";
import BarChart from "@/components/admin/BarChart";

// Bespaarde tijd → leesbaar (min → uur → dagen). Zelfde format als in
// "Mijn statistieken".
function tijdTekst(min: number): string {
  const totaal = Math.max(0, Math.round(min));
  if (totaal < 60) return `${totaal} min`;
  const totU = Math.floor(totaal / 60);
  const m = totaal % 60;
  if (totU < 24) return m > 0 ? `${totU} uur ${m} min` : `${totU} uur`;
  const d = Math.floor(totU / 24);
  const u = totU % 24;
  let s = `${d} d`;
  if (u > 0) s += ` ${u} u`;
  if (m > 0) s += ` ${m} min`;
  return s;
}

function dagLabel(d: string): string {
  const dt = new Date(d);
  return `${dt.getDate()}/${dt.getMonth() + 1}`;
}

const DEF = new Map(TIJD_DEFS.map((d) => [d.sleutel, d]));
function soortInfo(sleutel: string) {
  return DEF.get(sleutel) ?? { kort: sleutel, label: sleutel, icon: "•", kleur: "#8a8398" };
}

const PERIODES = [
  { dagen: 7, label: "7 dagen" },
  { dagen: 30, label: "30 dagen" },
  { dagen: 90, label: "90 dagen" },
];

export default function AdminTijdwinst() {
  const [dagen, setDagen] = useState(30);
  const [data, setData] = useState<AdminTijdwinst | null>(null);
  const [bezig, setBezig] = useState(true);

  useEffect(() => {
    setBezig(true);
    getAdminTijdwinst(dagen).then((d) => {
      setData(d);
      setBezig(false);
    });
  }, [dagen]);

  const perSoort = (data?.per_soort ?? []).filter((s) => s.minuten > 0 || s.acties > 0);
  const maxSoortMin = Math.max(...perSoort.map((s) => s.minuten), 1);
  const gemPerGebruiker =
    data && data.gebruikers_actief > 0 ? data.totaal_minuten / data.gebruikers_actief : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Periode-keuze (stuurt de trendgrafiek aan) */}
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

      {bezig && !data ? (
        <div className="h-40 animate-pulse rounded-3xl border border-black/5 bg-white/60" />
      ) : !data || data.totaal_acties === 0 ? (
        <p className="rounded-2xl bg-white px-5 py-4 text-sm text-ink/60 shadow-sm">
          Nog geen tijdwinst geregistreerd.
        </p>
      ) : (
        <>
          {/* Highlight-kaarten (lifetime over alle gebruikers) */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-brand/30 bg-brand-soft p-4">
              <p className="font-serif text-3xl font-semibold text-brand">
                {tijdTekst(data.totaal_minuten)}
              </p>
              <p className="mt-0.5 text-sm text-ink/60">Totaal bespaard</p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-cream p-4">
              <p className="font-serif text-3xl font-semibold text-ink">
                {Math.round(data.totaal_acties).toLocaleString("nl-NL")}
              </p>
              <p className="mt-0.5 text-sm text-ink/60">Acties totaal</p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-cream p-4">
              <p className="font-serif text-3xl font-semibold text-ink">
                {data.gebruikers_actief}
                <span className="text-lg text-ink/40"> / {data.gebruikers}</span>
              </p>
              <p className="mt-0.5 text-sm text-ink/60">Actieve gebruikers</p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-cream p-4">
              <p className="font-serif text-3xl font-semibold text-ink">
                {data.actieve_weken >= 1 ? tijdTekst(data.gem_actieve_week) : "—"}
              </p>
              <p className="mt-0.5 text-sm text-ink/60">Gem. per actieve week</p>
            </div>
          </section>

          {/* Uitsplitsing per soort */}
          <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-bold text-ink">Bespaarde tijd per tool</h2>
              <span className="text-sm text-ink/55">
                gemiddeld {tijdTekst(gemPerGebruiker)} per actieve gebruiker
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-3.5">
              {perSoort.map((s) => {
                const info = soortInfo(s.soort);
                return (
                  <div key={s.soort}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-semibold text-ink">
                        <span className="mr-1.5">{info.icon}</span>
                        {info.kort}
                      </span>
                      <span className="text-ink/60">
                        {tijdTekst(s.minuten)} · {Math.round(s.acties).toLocaleString("nl-NL")}×
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/5">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round((s.minuten / maxSoortMin) * 100)}%`,
                          background: info.kleur,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Trend over de gekozen periode */}
          <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink">Bespaarde tijd per dag</h2>
            <p className="mt-0.5 text-sm text-ink/55">
              Over alle gebruikers, laatste {dagen} dagen.
            </p>
            <div className="mt-4">
              <BarChart
                data={data.per_dag.map((d) => ({
                  label: dagLabel(d.dag),
                  value: Math.round(d.minuten),
                  titel: d.dag,
                }))}
                kleur="#2f9e6e"
                formatValue={(n) => tijdTekst(n)}
              />
            </div>
          </section>

          <p className="text-xs text-ink/45">
            Alleen totalen over alle gebruikers, nooit losse persoonsgegevens. De eenmalige
            1-augustus-backfill is uitgesloten uit de dag- en weekreeksen.
          </p>
        </>
      )}
    </div>
  );
}

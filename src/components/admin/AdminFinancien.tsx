"use client";

import { useEffect, useState } from "react";
import {
  getAdminOverzicht,
  getAdminSnapshots,
  type AdminOverzicht,
  type AbonSnapshot,
} from "@/lib/db";
import { planById, prijsTekst } from "@/lib/abonnement";
import BarChart from "@/components/admin/BarChart";

function maandLabel(d: string): string {
  return new Date(d).toLocaleDateString("nl-NL", { month: "short" });
}
// MRR uit de bewaarde aantallen × de huidige prijzen (prijzen blijven in de code).
function mrrVan(s: AbonSnapshot): number {
  return (
    s.start * (planById("start")?.prijsMaand ?? 0) +
    s.compleet * (planById("compleet")?.prijsMaand ?? 0) +
    s.pro * (planById("pro")?.prijsMaand ?? 0)
  );
}

type PlanId = "start" | "compleet" | "pro";
const PLAN_IDS: PlanId[] = ["start", "compleet", "pro"];

export default function AdminFinancien() {
  const [d, setD] = useState<AdminOverzicht | null>(null);
  const [snapshots, setSnapshots] = useState<AbonSnapshot[]>([]);
  const [laden, setLaden] = useState(true);

  useEffect(() => {
    getAdminOverzicht().then((x) => {
      setD(x);
      setLaden(false);
    });
    getAdminSnapshots(12).then(setSnapshots);
  }, []);

  if (laden) {
    return <div className="h-40 animate-pulse rounded-3xl border border-black/5 bg-white/60" />;
  }
  if (!d) {
    return (
      <p className="rounded-2xl bg-white px-5 py-4 text-sm text-ink/60 shadow-sm">
        Nog geen gegevens beschikbaar.
      </p>
    );
  }

  const rijen = PLAN_IDS.map((id) => {
    const prijs = planById(id)?.prijsMaand ?? 0;
    const aantal = d.plan[id];
    return { id, naam: planById(id)?.naam ?? id, aantal, prijs, mrr: aantal * prijs };
  });
  const mrr = rijen.reduce((s, r) => s + r.mrr, 0);
  const betalend = rijen.reduce((s, r) => s + r.aantal, 0);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Verwachte omzet</h2>
        <p className="mt-0.5 text-sm text-ink/55">
          Op basis van de actieve abonnementen — een indicatie tot de echte betalingen via Mollie lopen.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-brand/30 bg-brand-soft p-4">
            <p className="font-serif text-3xl font-semibold text-brand">{prijsTekst(mrr)}</p>
            <p className="mt-0.5 text-sm text-ink/60">Maandomzet (MRR)</p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-cream p-4">
            <p className="font-serif text-3xl font-semibold text-ink">{prijsTekst(mrr * 12)}</p>
            <p className="mt-0.5 text-sm text-ink/60">Op jaarbasis (indicatief)</p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-cream p-4">
            <p className="font-serif text-3xl font-semibold text-ink">{betalend}</p>
            <p className="mt-0.5 text-sm text-ink/60">Betalende abonnementen</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Maandomzet over tijd</h2>
        <p className="mt-0.5 text-sm text-ink/55">
          Verwachte MRR per maand (bouwt zich op vanaf de eerste momentopname).
        </p>
        <div className="mt-4">
          <BarChart
            data={snapshots.map((s) => ({
              label: maandLabel(s.maand),
              value: Math.round(mrrVan(s)),
              titel: s.maand,
            }))}
            kleur="#059669"
            formatValue={(n) => prijsTekst(n)}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Omzet per pakket</h2>
        <div className="mt-4 divide-y divide-black/5">
          {rijen.map((r) => (
            <div key={r.id} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
              <span className="font-semibold text-ink">{r.naam}</span>
              <span className="text-ink/60">
                {r.aantal} × {prijsTekst(r.prijs)} ={" "}
                <span className="font-bold text-ink">{prijsTekst(r.mrr)}</span> p/m
              </span>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-ink/45">
        Echte omzet, mislukte/teruggeboekte betalingen en de juli/augustus-gratis-korting
        van schooljaar-abonnementen worden pas verrekend zodra de Mollie-betalingen live zijn.
      </p>
    </div>
  );
}

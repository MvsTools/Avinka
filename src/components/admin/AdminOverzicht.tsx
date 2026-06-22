"use client";

import { useEffect, useState } from "react";
import {
  getAdminOverzicht,
  getAdminGroei,
  type AdminOverzicht as Data,
  type GroeiPunt,
} from "@/lib/db";
import { planById, prijsTekst } from "@/lib/abonnement";
import Donut from "@/components/admin/Donut";
import BarChart from "@/components/admin/BarChart";

function maandLabel(d: string): string {
  return new Date(d).toLocaleDateString("nl-NL", { month: "short" });
}

export default function AdminOverzicht() {
  const [d, setD] = useState<Data | null>(null);
  const [groei, setGroei] = useState<GroeiPunt[]>([]);
  const [laden, setLaden] = useState(true);

  useEffect(() => {
    getAdminOverzicht().then((x) => {
      setD(x);
      setLaden(false);
    });
    getAdminGroei(12).then(setGroei);
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

  const betaald = d.status.actief + d.status.opgezegd;
  const proef = Math.max(
    0,
    d.gebruikers - d.status.actief - d.status.opgezegd - d.status.verlopen,
  );
  const mrr =
    d.plan.start * (planById("start")?.prijsMaand ?? 0) +
    d.plan.compleet * (planById("compleet")?.prijsMaand ?? 0) +
    d.plan.pro * (planById("pro")?.prijsMaand ?? 0);
  const conversie =
    d.verwijzingen.uitgenodigd > 0
      ? Math.round((d.verwijzingen.betalend / d.verwijzingen.uitgenodigd) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Module: gebruikers & abonnementen */}
      <Module titel="Gebruikers & abonnementen">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Gebruikers" waarde={d.gebruikers} />
          <Stat label="Betalend" waarde={betaald} accent />
          <Stat label="In proef" waarde={proef} />
          <Stat label="Verlopen" waarde={d.status.verlopen} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Stat label="Start" waarde={d.plan.start} />
          <Stat label="Compleet" waarde={d.plan.compleet} />
          <Stat label="Pro" waarde={d.plan.pro} />
        </div>
      </Module>

      {/* Module: groei (aanmeldingen per maand) */}
      <Module titel="Groei" subtitel="Nieuwe aanmeldingen per maand">
        <BarChart
          data={groei.map((g) => ({
            label: maandLabel(g.maand),
            value: g.aantal,
            titel: g.maand,
          }))}
        />
      </Module>

      {/* Module: pakketverdeling (grafiek) */}
      <Module titel="Pakketverdeling" subtitel="Verdeling van de betalende abonnementen">
        <Donut
          data={[
            { label: "Start", value: d.plan.start, kleur: "#0ea5e9" },
            { label: "Compleet", value: d.plan.compleet, kleur: "#2f9e6e" },
            { label: "Pro", value: d.plan.pro, kleur: "#7c3aed" },
          ]}
        />
      </Module>

      {/* Module: financiën (indicatief) */}
      <Module titel="Financiën" subtitel="Verwacht, op basis van actieve abonnementen">
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat label="Maandomzet (MRR)" waarde={prijsTekst(mrr)} accent />
          <Stat label="Op jaarbasis (indicatief)" waarde={prijsTekst(mrr * 12)} />
        </div>
        <p className="mt-3 text-xs text-ink/50">
          Echte omzet volgt uit Mollie zodra de betalingen live zijn. Schooljaar-
          abonnementen (juli/augustus gratis) zijn hier nog niet verrekend.
        </p>
      </Module>

      {/* Module: verwijzingen */}
      <Module titel="Verwijzingen">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Uitnodigers" waarde={d.verwijzingen.uitnodigers} />
          <Stat label="Uitgenodigd" waarde={d.verwijzingen.uitgenodigd} />
          <Stat label="Betalend geworden" waarde={d.verwijzingen.betalend} accent />
          <Stat label="Conversie" waarde={`${conversie}%`} />
        </div>
      </Module>
    </div>
  );
}

function Module({
  titel,
  subtitel,
  children,
}: {
  titel: string;
  subtitel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-ink">{titel}</h2>
      {subtitel && <p className="mt-0.5 text-sm text-ink/55">{subtitel}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Stat({
  label,
  waarde,
  accent = false,
}: {
  label: string;
  waarde: number | string;
  accent?: boolean;
}) {
  return (
    <div className={"rounded-2xl border p-4 " + (accent ? "border-brand/30 bg-brand-soft" : "border-black/5 bg-cream")}>
      <p className={"font-serif text-3xl font-semibold " + (accent ? "text-brand" : "text-ink")}>
        {waarde}
      </p>
      <p className="mt-0.5 text-sm text-ink/60">{label}</p>
    </div>
  );
}

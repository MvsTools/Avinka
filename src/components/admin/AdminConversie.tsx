"use client";

import { useEffect, useState } from "react";
import { getAdminConversie, type AdminConversie as Data } from "@/lib/db";
import Donut from "@/components/admin/Donut";

const INTENTIE_LABEL: Record<string, string> = {
  zeker: "Zeker weten",
  twijfel: "Twijfelt nog",
  nee: "Geen abonnement",
};
const INTENTIE_KLEUR: Record<string, string> = {
  zeker: "#059669",
  twijfel: "#f59e0b",
  nee: "#e11d48",
};

export default function AdminConversie() {
  const [d, setD] = useState<Data | null>(null);
  const [laden, setLaden] = useState(true);

  useEffect(() => {
    getAdminConversie().then((x) => {
      setD(x);
      setLaden(false);
    });
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

  const { aangemeld, betalend, verlopen } = d.funnel;
  const afgerond = betalend + verlopen; // proeven die een keuze hebben gemaakt
  const conversie = afgerond > 0 ? Math.round((betalend / afgerond) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Funnel */}
      <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Funnel</h2>
        <p className="mt-0.5 text-sm text-ink/55">Van aanmelding tot betalend abonnement.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Stat label="Aangemeld" waarde={aangemeld} />
          <Stat label="Betalend geworden" waarde={betalend} accent />
          <Stat label="Proef verlopen" waarde={verlopen} />
          <Stat label="Conversie" waarde={`${conversie}%`} accent />
        </div>
        <p className="mt-3 text-xs text-ink/50">
          Conversie = betalend ÷ (betalend + verlopen): het aandeel afgeronde proeven dat
          een abonnement nam.
        </p>
      </section>

      {/* Intentie uit de proef-pop-up */}
      <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Verwachte intentie</h2>
        <p className="mt-0.5 text-sm text-ink/55">
          Antwoorden op de vraag aan het eind van de proef.
        </p>
        <div className="mt-4">
          <Donut
            data={[
              { label: INTENTIE_LABEL.zeker, value: d.intentie.zeker, kleur: INTENTIE_KLEUR.zeker },
              { label: INTENTIE_LABEL.twijfel, value: d.intentie.twijfel, kleur: INTENTIE_KLEUR.twijfel },
              { label: INTENTIE_LABEL.nee, value: d.intentie.nee, kleur: INTENTIE_KLEUR.nee },
            ]}
          />
        </div>
      </section>

      {/* Categorieën (snelle keuzes) */}
      <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Belangrijkste redenen</h2>
        <p className="mt-0.5 text-sm text-ink/55">Gekozen categorieën, meest genoemd bovenaan.</p>
        {d.categorieen.length === 0 ? (
          <p className="mt-3 text-sm text-ink/55">Nog geen categorieën gekozen.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {(() => {
              const max = Math.max(...d.categorieen.map((c) => c.aantal), 1);
              return d.categorieen.map((c, i) => (
                <div key={i}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: INTENTIE_KLEUR[c.intentie] }}
                      />
                      <span className="font-semibold text-ink">{c.categorie}</span>
                      <span className="text-ink/45">{INTENTIE_LABEL[c.intentie]}</span>
                    </span>
                    <span className="text-ink/60">{c.aantal}×</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/5">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((c.aantal / max) * 100)}%`,
                        background: INTENTIE_KLEUR[c.intentie],
                      }}
                    />
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </section>

      {/* Vrije toelichtingen */}
      <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Toelichtingen</h2>
        {d.redenen.length === 0 ? (
          <p className="mt-3 text-sm text-ink/55">Nog geen toelichtingen ontvangen.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {d.redenen.map((r, i) => (
              <li key={i} className="rounded-2xl border border-black/5 bg-cream p-4">
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                  style={{ background: INTENTIE_KLEUR[r.intentie] }}
                >
                  {INTENTIE_LABEL[r.intentie] ?? r.intentie}
                </span>
                <p className="mt-2 text-sm leading-6 text-ink/80">{r.reden}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, waarde, accent = false }: { label: string; waarde: number | string; accent?: boolean }) {
  return (
    <div className={"rounded-2xl border p-4 " + (accent ? "border-brand/30 bg-brand-soft" : "border-black/5 bg-cream")}>
      <p className={"font-serif text-3xl font-semibold " + (accent ? "text-brand" : "text-ink")}>{waarde}</p>
      <p className="mt-0.5 text-sm text-ink/60">{label}</p>
    </div>
  );
}

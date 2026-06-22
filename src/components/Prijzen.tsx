"use client";

import Link from "next/link";
import { useState } from "react";
import { PLANNEN, PROEF_DAGEN, prijsTekst } from "@/lib/abonnement";

// De prijzen lezen we uit dezelfde centrale bron (lib/abonnement) als het
// dashboard, zodat de pakketten, voordelen en de jaarprijs overal gelijk zijn.
export default function Prijzen() {
  // false = maandelijks, true = per schooljaar (zomer gratis = 2 maanden cadeau)
  const [jaar, setJaar] = useState(false);

  return (
    <section id="prijzen" className="mx-auto w-full max-w-6xl px-6 pt-12 pb-24">
      <h2 className="text-center text-4xl font-black tracking-tight text-ink">
        Eén vast bedrag. Onbeperkt gebruik.
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-center text-lg text-ink/60">
        Je begint met {PROEF_DAGEN} dagen gratis proberen, zonder betaalgegevens.
        Daarna kies je het abonnement dat bij je past.
      </p>

      {/* Schakelaar: maandelijks of per schooljaar */}
      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-2xl border border-black/10 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setJaar(false)}
            className={
              "rounded-xl px-5 py-2.5 text-sm font-bold transition " +
              (!jaar ? "bg-brand text-white shadow-sm" : "text-ink/60 hover:text-ink")
            }
          >
            Maandelijks
          </button>
          <button
            type="button"
            onClick={() => setJaar(true)}
            className={
              "rounded-xl px-5 py-2.5 text-sm font-bold transition " +
              (jaar ? "bg-brand text-white shadow-sm" : "text-ink/60 hover:text-ink")
            }
          >
            Per schooljaar
          </button>
        </div>
      </div>

      <div className="mt-12 grid items-stretch gap-6 sm:grid-cols-3">
        {PLANNEN.map((plan) => (
          <div
            key={plan.id}
            className={
              plan.held
                ? "relative flex flex-col rounded-3xl bg-white p-8 shadow-2xl ring-2 ring-brand sm:-my-4 sm:py-12"
                : "flex flex-col rounded-3xl border border-black/5 bg-white p-8 shadow-sm"
            }
          >
            {plan.held && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1.5 text-xs font-black uppercase tracking-wide text-ink shadow-sm">
                Meest gekozen
              </span>
            )}
            <h3 className="text-2xl font-bold text-ink">{plan.naam}</h3>
            <p className="mt-1 text-sm text-ink/55">{plan.tagline}</p>
            <p className="mt-5">
              <span className="text-5xl font-black text-ink">{prijsTekst(plan.prijsMaand)}</span>
              <span className="ml-1 text-ink/50">p/m</span>
            </p>
            {jaar && (
              <p className="mt-2 text-sm font-semibold text-emerald-600">
                Maandelijkse betaling · juli en augustus gratis
              </p>
            )}
            <ul className="mt-7 flex-1 space-y-3.5">
              {plan.voordelen.map((punt) => (
                <li key={punt} className="flex gap-2.5 text-ink/80">
                  <span className="font-bold text-brand">✓</span>
                  <span>{punt}</span>
                </li>
              ))}
            </ul>
            <Link
              href={jaar ? "/sign-up?plan=jaar" : "/sign-up?plan=maand"}
              className={
                "mt-8 rounded-2xl px-5 py-3.5 text-center text-base font-bold transition " +
                (plan.held
                  ? "bg-brand text-white shadow-lg shadow-brand/25 hover:bg-brand-dark"
                  : "border-2 border-ink/10 text-ink hover:border-ink/20")
              }
            >
              Probeer gratis
            </Link>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-ink/50">
        {jaar
          ? "Per schooljaar: maandelijkse betaling, waarbij juli en augustus gratis zijn."
          : "Alle abonnementen zijn maandelijks opzegbaar."}
      </p>
    </section>
  );
}

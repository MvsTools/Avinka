"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { bevestigMetCode, type AuthState } from "@/app/auth/actions";

/**
 * De pagina `/bevestigen`: mailadres + code, voor wie het tabblad kwijt is
 * waarin hij zich aanmeldde.
 *
 * Hier staat het mailadres wél als invoerveld, anders dan op het wachtscherm.
 * Daar weten we het al; hier komt iemand met alleen een mailtje in zijn hand.
 */
export default function BevestigLosseCode() {
  const [stand, actie, bezig] = useActionState<AuthState, FormData>(
    bevestigMetCode,
    {},
  );
  const [code, setCode] = useState("");

  return (
    <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 shadow-xl sm:p-10">
      <h1 className="text-2xl font-bold text-ink">Bevestig je aanmelding</h1>
      <p className="mt-2 leading-7 text-ink/70">
        Vul je e-mailadres in en de code die je per mail kreeg.
      </p>

      <form action={actie} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-bold text-ink">
            E-mailadres
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="jij@school.nl"
            defaultValue={stand.email ?? ""}
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <div>
          <label htmlFor="code" className="block text-sm font-bold text-ink">
            Code uit de mail
          </label>
          <input
            id="code"
            name="code"
            type="text"
            autoComplete="one-time-code"
            inputMode="numeric"
            required
            placeholder="000000"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-3 text-center text-xl font-bold tracking-[0.4em] text-ink outline-none transition placeholder:font-normal placeholder:tracking-[0.3em] placeholder:text-ink/25 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <div aria-live="polite" className="empty:hidden">
          {stand.error && (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {stand.error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={bezig || code.length < 6}
          className="w-full rounded-2xl bg-brand px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
        >
          {bezig ? "Bezig…" : "Bevestigen"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        Code kwijt?{" "}
        <Link
          href="/sign-up"
          className="font-bold text-brand-dark hover:underline"
        >
          Meld je opnieuw aan
        </Link>
      </p>
    </div>
  );
}

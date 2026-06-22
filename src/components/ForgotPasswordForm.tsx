"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type AuthState } from "@/app/auth/actions";

// Vraagt een herstelmail aan. Toont altijd dezelfde bevestiging, of het
// e-mailadres nu bestaat of niet (zo verraden we geen accounts).
export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    {},
  );

  if (state.message) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 text-center shadow-xl sm:p-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-3xl">
          📬
        </span>
        <h1 className="mt-5 text-2xl font-bold text-ink">Check je mail</h1>
        <p className="mt-3 leading-7 text-ink/70">{state.message}</p>
        <Link
          href="/sign-in"
          className="mt-7 inline-block rounded-2xl border-2 border-ink/10 px-6 py-3 font-bold text-ink transition hover:border-ink/20"
        >
          Terug naar inloggen
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 shadow-xl sm:p-10">
      <h1 className="text-3xl font-black tracking-tight text-ink">
        Wachtwoord vergeten?
      </h1>
      <p className="mt-2 text-ink/60">
        Geen zorgen. Vul je e-mailadres in, dan sturen we je een link om een
        nieuw wachtwoord in te stellen.
      </p>

      {state.error && (
        <p
          role="alert"
          className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
        >
          {state.error}
        </p>
      )}

      <form action={formAction} className="mt-6 space-y-4">
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
            placeholder="jij@voorbeeld.nl"
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-brand px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Een momentje…" : "Stuur me een herstellink"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        Weet je het weer?{" "}
        <Link href="/sign-in" className="font-bold text-brand hover:underline">
          Inloggen
        </Link>
      </p>
    </div>
  );
}

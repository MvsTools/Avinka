"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePassword, type AuthState } from "@/app/auth/actions";

// Hier stelt de gebruiker een nieuw wachtwoord in, na het klikken op de
// link in de herstelmail. Bij succes gaat hij door naar het dashboard.
//
// 🔑 `tokenHash` reist mee als verborgen veld en wordt pas bij het VERSTUREN
// ingewisseld (zie updatePassword). Daarom staat er geen token te wachten in een
// sessie: het openen van dit scherm doet niets, en een mailscanner die de link
// vooruit ophaalt kan hem dus niet opgebruiken. Ontbreekt het token, dan werkt
// het formulier op een bestaande sessie, zoals het altijd deed.
export default function NewPasswordForm({ tokenHash = "" }: { tokenHash?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    updatePassword,
    {},
  );

  return (
    <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 shadow-xl sm:p-10">
      <h1 className="text-3xl font-black tracking-tight text-ink">
        Kies een nieuw wachtwoord
      </h1>
      <p className="mt-2 text-ink/60">
        Bijna klaar. Bedenk een nieuw wachtwoord, dan ben je weer binnen.
      </p>

      {state.error && (
        <div
          role="alert"
          className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
        >
          {state.error}{" "}
          <Link href="/wachtwoord-vergeten" className="underline">
            Nieuwe link aanvragen
          </Link>
        </div>
      )}

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="token_hash" value={tokenHash} />
        <div>
          <label htmlFor="password" className="block text-sm font-bold text-ink">
            Nieuw wachtwoord
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Minstens 6 tekens"
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-brand px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Opslaan…" : "Wachtwoord opslaan"}
        </button>
      </form>
    </div>
  );
}

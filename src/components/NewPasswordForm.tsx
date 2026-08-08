"use client";

import { useActionState, useState } from "react";
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
//
// 🔑 `email` komt uit een cookie die bij het aanvragen is gezet. Het staat er
// niet alleen om te tonen "voor welk account is dit": een wachtwoordbeheerder
// heeft een gebruikersnaam nodig om het nieuwe wachtwoord aan het juiste account
// te koppelen. Vandaar een echt veld met `autoComplete="username"` en niet een
// regel tekst. Opende iemand de mail op een ander apparaat, dan is er geen
// cookie en laten we het veld weg in plaats van iets te verzinnen.
export default function NewPasswordForm({
  tokenHash = "",
  email = "",
}: {
  tokenHash?: string;
  email?: string;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    updatePassword,
    {},
  );
  const [eerste, setEerste] = useState("");
  const [tweede, setTweede] = useState("");

  // Pas klagen als er in het tweede veld iets staat: meetypen mag niet
  // aanvoelen als fout maken.
  const verschilt = tweede.length > 0 && eerste !== tweede;

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

        {email && (
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-ink">
              Account
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              readOnly
              // `readOnly` en niet `disabled`: een uitgeschakeld veld wordt door
              // wachtwoordbeheerders overgeslagen, en dan koppelt hij het nieuwe
              // wachtwoord alsnog niet aan dit account.
              className="mt-1.5 w-full cursor-default rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-ink/70 outline-none"
            />
          </div>
        )}

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
            value={eerste}
            onChange={(e) => setEerste(e.target.value)}
            placeholder="Minstens 6 tekens"
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <div>
          <label htmlFor="password2" className="block text-sm font-bold text-ink">
            Nog een keer
          </label>
          <input
            id="password2"
            name="password2"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={tweede}
            onChange={(e) => setTweede(e.target.value)}
            aria-invalid={verschilt}
            aria-describedby={verschilt ? "password2-fout" : undefined}
            placeholder="Typ hetzelfde wachtwoord"
            className={
              "mt-1.5 w-full rounded-xl border bg-cream px-4 py-3 text-ink outline-none transition focus:ring-2 " +
              (verschilt
                ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200"
                : "border-black/10 focus:border-brand focus:ring-brand/20")
            }
          />
          {verschilt && (
            <p id="password2-fout" className="mt-1.5 text-sm font-semibold text-rose-700">
              Deze twee zijn nog niet gelijk.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending || verschilt}
          className="w-full rounded-2xl bg-brand px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Opslaan…" : "Wachtwoord opslaan"}
        </button>
      </form>
    </div>
  );
}

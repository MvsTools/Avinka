"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import {
  bevestigMetCode,
  bevestigingOpnieuw,
  type AuthState,
} from "@/app/auth/actions";
import { alleenCijfers, CODE_MIN, CODE_PLAATSHOUDER } from "@/lib/auth-code";

/**
 * De pagina `/bevestigen`: mailadres + code, plus de mogelijkheid een nieuwe
 * code aan te vragen.
 *
 * Hier belandt vooral iemand die probeerde in te loggen op een account dat nog
 * niet bevestigd is. Voor hem is dit geen formulier maar een uitweg: zijn
 * wachtscherm is weg, en opnieuw aanmelden kan niet want het account bestaat al.
 */
export default function BevestigLosseCode({
  beginEmail = "",
  onbevestigd = false,
}: {
  beginEmail?: string;
  onbevestigd?: boolean;
}) {
  const [codeStand, codeActie, codeBezig] = useActionState<AuthState, FormData>(
    bevestigMetCode,
    {},
  );
  const [opnieuwStand, opnieuwActie, opnieuwBezig] = useActionState<
    AuthState,
    FormData
  >(bevestigingOpnieuw, {});

  // Het adres staat in state en niet als defaultValue, omdat álletwee de
  // formulieren het nodig hebben: bevestigen én een nieuwe code aanvragen.
  const [email, setEmail] = useState(beginEmail);
  const [code, setCode] = useState("");
  const [nu, setNu] = useState(() => Date.now());

  const vrijOp = opnieuwStand.opnieuwNa;

  useEffect(() => {
    if (!vrijOp) return;
    const t = setInterval(() => setNu(Date.now()), 500);
    return () => clearInterval(t);
  }, [vrijOp]);

  const rest = vrijOp ? Math.max(0, Math.ceil((vrijOp - nu) / 1000)) : 0;

  return (
    <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 shadow-xl sm:p-10">
      <h1 className="text-2xl font-bold text-ink">
        {onbevestigd ? "Nog even bevestigen" : "Bevestig je aanmelding"}
      </h1>
      <p className="mt-2 leading-7 text-ink/70">
        {onbevestigd
          ? "Je account is nog niet bevestigd. Vul hier de code uit je mail in."
          : "Vul je e-mailadres in en de code die je per mail kreeg."}
      </p>

      <form action={codeActie} className="mt-6 space-y-4">
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            autoFocus={onbevestigd}
            placeholder={CODE_PLAATSHOUDER}
            value={code}
            onChange={(e) => setCode(alleenCijfers(e.target.value))}
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-3 text-center text-xl font-bold tracking-[0.3em] text-ink outline-none transition placeholder:font-normal placeholder:tracking-[0.25em] placeholder:text-ink/25 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <div aria-live="polite" className="empty:hidden">
          {codeStand.error && (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {codeStand.error}
            </p>
          )}
          {opnieuwStand.message === "opnieuw" && (
            <p className="rounded-2xl bg-brand-soft px-4 py-3 text-sm font-semibold text-brand-dark">
              Verstuurd. Kijk zo even in je mail.
            </p>
          )}
          {opnieuwStand.error && (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {opnieuwStand.error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={codeBezig || code.length < CODE_MIN}
          className="w-full rounded-2xl bg-brand px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
        >
          {codeBezig ? "Bezig…" : "Bevestigen"}
        </button>
      </form>

      {/* Een <div> en geen <p>: een formulier mag niet in een tekstalinea staan. */}
      <div className="mt-6 text-center text-sm text-ink/60">
        Geen code meer?{" "}
        <form action={opnieuwActie} className="inline">
          <input type="hidden" name="email" value={email} />
          <button
            type="submit"
            disabled={opnieuwBezig || rest > 0 || !email}
            className="font-bold text-brand-dark underline decoration-brand/40 underline-offset-2 transition hover:decoration-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:font-semibold disabled:text-ink/50 disabled:no-underline"
          >
            {opnieuwBezig
              ? "Bezig…"
              : rest > 0
                ? `Opnieuw over ${rest}s`
                : "Stuur een nieuwe"}
          </button>
        </form>
      </div>

      <p className="mt-2 text-center text-sm text-ink/60">
        Lukt het niet?{" "}
        <a
          href="mailto:support@avinka.nl"
          className="font-bold text-brand-dark underline decoration-brand/40 underline-offset-2 hover:decoration-brand"
        >
          support@avinka.nl
        </a>
      </p>

      <p className="mt-6 text-center text-sm text-ink/60">
        <Link href="/sign-in" className="font-bold text-brand-dark hover:underline">
          Terug naar inloggen
        </Link>
      </p>
    </div>
  );
}

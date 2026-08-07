"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { login, signup, type AuthState } from "@/app/auth/actions";
import { PROEF_DAGEN } from "@/lib/abonnement";
import BevestigWachtscherm from "@/components/BevestigWachtscherm";

// "marieke" / "MARIEKE" -> "Marieke", "anne-marie" -> "Anne-Marie". Zelfde
// regel als metHoofdletter() in auth/actions.ts (die kan hier niet
// geïmporteerd worden, "use server"), maar dan live terwijl je typt — de
// server-kant blijft de echte afdwinging, dit is puur voor wat je zíet.
function metHoofdletter(naam: string): string {
  return naam.toLowerCase().replace(/(^|[\s-])\p{L}/gu, (m) => m.toUpperCase());
}

// Eén formulier voor zowel inloggen als registreren — scheelt dubbele code.
// mode bepaalt de teksten, de velden en welke actie er draait.
//
// `volgende` is de pagina waar je ná het inloggen heen moet, in plaats van het
// dashboard. Nodig bij een uitnodigingslink: wie nog niet ingelogd is belandt
// eerst hier, en zonder dit zou de uitnodiging bij het inloggen wegvallen.
export default function AuthCard({
  mode,
  volgende,
}: {
  mode: "signin" | "signup";
  volgende?: string;
}) {
  const isSignup = mode === "signup";
  const actie = isSignup ? signup : login;

  // Wissel je hier tussen inloggen en registreren, dan moet de bestemming mee.
  // Zonder dit raakt een uitnodiging alsnog kwijt bij iemand die nog geen
  // account heeft — precies de persoon die je uitnodigt.
  const metVolgende = (pad: string) =>
    volgende ? `${pad}?volgende=${encodeURIComponent(volgende)}` : pad;

  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    actie,
    {},
  );

  // We houden de velden zelf bij (controlled), zodat ze ná een foutmelding
  // gewoon ingevuld blijven staan en niet door de server-action worden gewist.
  const [voornaam, setVoornaam] = useState("");
  const [email, setEmail] = useState("");
  const [wachtwoord, setWachtwoord] = useState("");

  // "Onthoud mijn e-mailadres": we bewaren alleen het e-mailadres lokaal op dit
  // apparaat, nooit het wachtwoord (dat laten we aan het wachtwoordbeheer van de
  // browser over). Alleen bij inloggen.
  const [onthoud, setOnthoud] = useState(false);

  // Oogje: toont het wachtwoord kort (2 seconden) na een klik, daarna weer
  // verborgen. Zo kun je even controleren wat je typte zonder dat het blijft staan.
  const [zichtbaar, setZichtbaar] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function toonWachtwoordEven() {
    setZichtbaar(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setZichtbaar(false), 2000);
  }

  // Loopt de timer nog als de pagina sluit? Netjes opruimen.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // Bij het openen van het inlogscherm: een eerder onthouden e-mailadres alvast
  // invullen en het vinkje aanzetten.
  useEffect(() => {
    if (isSignup) return;
    const bewaard = localStorage.getItem("avinka_onthoud_email");
    if (bewaard) {
      setEmail(bewaard);
      setOnthoud(true);
    }
  }, [isSignup]);

  // Bewaar (of wis) het e-mailadres op het moment van inloggen, op basis van het
  // vinkje. Hangt aan de inlog-knop, dus loopt vlak vóór de server-actie.
  function bewaarKeuze() {
    if (isSignup) return;
    if (onthoud && email) localStorage.setItem("avinka_onthoud_email", email);
    else localStorage.removeItem("avinka_onthoud_email");
  }

  // Na een geslaagde registratie neemt het wachtscherm het over: dat kan de
  // mail opnieuw sturen en legt uit wat er mis kan zijn.
  if (state.message) {
    return <BevestigWachtscherm email={state.email} volgende={volgende} />;
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 shadow-xl sm:p-10">
      <h1 className="text-3xl font-black tracking-tight text-ink">
        {isSignup ? "Maak je account" : "Welkom terug"}
      </h1>
      <p className="mt-2 text-ink/60">
        {isSignup
          ? `Begin met ${PROEF_DAGEN} dagen gratis proberen. Geen betaalgegevens nodig.`
          : "Log in om verder te gaan met Avinka."}
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
        {volgende && <input type="hidden" name="volgende" value={volgende} />}
        {isSignup && (
          <div>
            <label htmlFor="voornaam" className="block text-sm font-bold text-ink">
              Je voornaam
            </label>
            <input
              id="voornaam"
              name="voornaam"
              type="text"
              autoComplete="given-name"
              required
              placeholder="Bijv. Sanne"
              value={voornaam}
              onChange={(e) => setVoornaam(metHoofdletter(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
        )}

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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="block text-sm font-bold text-ink">
              Wachtwoord
            </label>
            {!isSignup && (
              <Link
                href="/wachtwoord-vergeten"
                tabIndex={-1}
                className="text-sm font-semibold text-brand hover:underline"
              >
                Vergeten?
              </Link>
            )}
          </div>
          <div className="relative mt-1.5">
            <input
              id="password"
              name="password"
              type={zichtbaar ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={6}
              placeholder={isSignup ? "Minstens 6 tekens" : "Je wachtwoord"}
              value={wachtwoord}
              onChange={(e) => setWachtwoord(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-cream px-4 py-3 pr-12 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <button
              type="button"
              onClick={toonWachtwoordEven}
              tabIndex={-1}
              aria-label={zichtbaar ? "Wachtwoord verbergen" : "Wachtwoord 2 seconden tonen"}
              title="Even tonen"
              className="absolute inset-y-0 right-0 flex items-center px-4 text-ink/40 transition hover:text-ink/70"
            >
              {zichtbaar ? (
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {!isSignup && (
          <label className="flex items-center gap-2.5 text-sm font-medium text-ink/70">
            <input
              type="checkbox"
              checked={onthoud}
              onChange={(e) => {
                const aan = e.target.checked;
                setOnthoud(aan);
                if (!aan) localStorage.removeItem("avinka_onthoud_email");
              }}
              className="h-5 w-5 flex-shrink-0 rounded border-black/20 text-brand focus:ring-brand/30"
            />
            Onthoud mijn e-mailadres
          </label>
        )}

        {isSignup && (
          <label className="flex items-start gap-3 pt-1 text-sm leading-6 text-ink/70">
            <input
              type="checkbox"
              name="akkoord"
              required
              className="mt-0.5 h-5 w-5 flex-shrink-0 rounded border-black/20 text-brand focus:ring-brand/30"
            />
            <span>
              Ik ga akkoord met de{" "}
              <Link
                href="/voorwaarden"
                target="_blank"
                className="font-semibold text-brand hover:underline"
              >
                algemene voorwaarden
              </Link>{" "}
              en de{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="font-semibold text-brand hover:underline"
              >
                privacyverklaring
              </Link>
              .
            </span>
          </label>
        )}

        <button
          type="submit"
          onClick={bewaarKeuze}
          disabled={pending}
          className="w-full rounded-2xl bg-brand px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? "Een momentje…"
            : isSignup
              ? "Account aanmaken"
              : "Inloggen"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        {isSignup ? (
          <>
            Heb je al een account?{" "}
            <Link href={metVolgende("/sign-in")} className="font-bold text-brand hover:underline">
              Inloggen
            </Link>
          </>
        ) : (
          <>
            Nog geen account?{" "}
            <Link href={metVolgende("/sign-up")} className="font-bold text-brand hover:underline">
              Maak er gratis een
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

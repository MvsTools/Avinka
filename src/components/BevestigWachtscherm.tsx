"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { bevestigingOpnieuw, type AuthState } from "@/app/auth/actions";

/**
 * Het scherm ná een geslaagde registratie.
 *
 * Waarom dit meer is dan één regel "check je mail": op een schoolmailadres
 * sneuvelt de bevestigingsmail geregeld in een filter waar de leerkracht zelf
 * niet bij kan. Zonder uitweg staat iemand dan te wachten op iets dat nooit
 * komt, en haakt af zonder dat wij het merken. Vandaar: opnieuw sturen,
 * eerlijk uitleggen wat er aan de hand kan zijn, en een mens om op terug te
 * vallen.
 *
 * ⚠️ Bewust GEEN "vraag je ICT-beheerder om avinka.nl door te laten". Dat is
 * technisch het juiste advies, maar geen leerkracht loopt daarvoor naar de
 * systeembeheerder — die haakt af. Dat briefje sturen we zelf mee als iemand
 * contact opneemt.
 */
export default function BevestigWachtscherm({
  email,
  volgende,
  opnieuwNa,
}: {
  email?: string;
  volgende?: string;
  /** Wanneer de knop vrijkomt, gerekend vanaf de mail van het AANMELDEN. */
  opnieuwNa?: number;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    bevestigingOpnieuw,
    {},
  );
  const [nu, setNu] = useState(() => Date.now());

  // Supabase' grens geldt per adres, dus de mail van het aanmelden telt mee.
  // Zolang er nog niet opnieuw verstuurd is, geldt het tijdstip dat bij de
  // registratie is meegegeven; daarna dat van de laatste verzending.
  const vrijOp = state.opnieuwNa ?? opnieuwNa;

  // De klok loopt alleen als er iets af te tellen valt. De setState zit in de
  // callback van het interval, niet in het effect zelf — dat scheelt een reeks
  // cascaderende renders (en de lint-regel die daarop let).
  useEffect(() => {
    if (!vrijOp) return;
    const t = setInterval(() => setNu(Date.now()), 500);
    return () => clearInterval(t);
  }, [vrijOp]);

  // Afgeleid, niet bijgehouden: het tijdstip komt van de server en hier rekenen
  // we alleen uit hoeveel er nog over is.
  const rest = vrijOp ? Math.max(0, Math.ceil((vrijOp - nu) / 1000)) : 0;
  const opSlot = pending || rest > 0;

  return (
    <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 shadow-xl sm:p-10">
      <div className="text-center">
        <span
          aria-hidden
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-3xl"
        >
          📬
        </span>
        <h1 className="mt-5 text-2xl font-bold text-ink">Check je mail</h1>
        {/* Het adres krijgt een eigen regel. Midden in een gecentreerde zin
            rafelt het over drie regels en raak je juist het ene stukje kwijt
            waar iemand op moet controleren: staat daar écht mijn adres? */}
        <p className="mt-3 leading-7 text-ink/70">
          We hebben een bevestigingslink gestuurd naar:
        </p>
        {email && (
          <p className="mt-1.5 break-words font-bold text-ink">{email}</p>
        )}
        <p className="mt-1.5 leading-7 text-ink/70">
          Klik erop om te bevestigen.
        </p>
      </div>

      <form action={formAction} className="mt-6">
        <input type="hidden" name="email" value={email ?? ""} />
        {volgende && <input type="hidden" name="volgende" value={volgende} />}
        <button
          type="submit"
          disabled={opSlot}
          // Op slot NIET wegvagen met opacity: in die knop staat de teller, en
          // die moet leesbaar blijven. Vandaar een grijze staat (4,35:1) in
          // plaats van vervaagd groen (2,15:1).
          className="w-full rounded-2xl border-2 border-brand/25 px-6 py-3 font-bold text-brand-dark transition hover:border-brand/50 hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:border-ink/10 disabled:text-ink/60 disabled:hover:border-ink/10 disabled:hover:bg-transparent"
        >
          {pending
            ? "Bezig…"
            : rest > 0
              ? `Opnieuw sturen kan over ${rest}s`
              : "Stuur de mail opnieuw"}
        </button>
      </form>

      {/* Eén gebied voor beide uitkomsten, zodat een schermlezer het voorleest
          zodra het verschijnt. */}
      <div aria-live="polite" className="empty:hidden">
        {state.message === "opnieuw" && (
          <p className="mt-3 rounded-2xl bg-brand-soft px-4 py-3 text-sm font-semibold text-brand-dark">
            Verstuurd. Hij kan een paar minuten onderweg zijn.
          </p>
        )}
        {state.error && (
          <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {state.error}
          </p>
        )}
      </div>

      <div className="mt-7 border-t border-ink/10 pt-6">
        <h2 className="text-sm font-bold text-ink">Niets ontvangen?</h2>
        <p className="mt-2 text-sm leading-6 text-ink/70">
          Kijk eerst in je map Ongewenst. Staat hij daar ook niet, dan houdt de
          mailserver van je school hem waarschijnlijk tegen. Avinka bestaat pas
          sinds kort, en onbekende afzenders worden op scholen streng gefilterd.
        </p>
        <p className="mt-3 text-sm leading-6 text-ink/70">
          Dat kun je zelf niet oplossen, maar ik wel. Mail me op{" "}
          <a
            href="mailto:support@avinka.nl"
            className="font-bold text-brand-dark underline decoration-brand/40 underline-offset-2 hover:decoration-brand"
          >
            support@avinka.nl
          </a>
          , dan zet ik je account met de hand klaar.
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-ink/60">
        Al bevestigd?{" "}
        <Link
          href="/sign-in"
          className="font-bold text-brand-dark hover:underline"
        >
          Inloggen
        </Link>
      </p>
    </div>
  );
}

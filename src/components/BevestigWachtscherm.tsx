"use client";

import { useActionState, useEffect, useState } from "react";
import {
  bevestigMetCode,
  bevestigingOpnieuw,
  type AuthState,
} from "@/app/auth/actions";

/**
 * Het scherm ná een geslaagde registratie: hier vul je de code uit de mail in.
 *
 * 🔑 WAAROM EEN CODE EN GEEN LINK — de korte versie (de lange staat bij
 * `bevestigMetCode` in auth/actions.ts): schoolbesturen draaien Microsoft
 * Safe Links, dat elke link in een mail eerst zélf ophaalt om hem te
 * controleren. Een eenmalige bevestigingslink is daardoor al opgebruikt vóórdat
 * de leerkracht klikt. Aan een code valt niets op te klikken.
 *
 * ⚠️ Bewust GEEN uitleg meer over schoolfilters op dit scherm. Die stond er
 * eerder wel, maar sinds de mail bewezen aankomt is die bewering niet meer waar,
 * en een verkeerde verklaring is erger dan geen verklaring.
 */
export default function BevestigWachtscherm({
  email,
  volgende,
  opnieuwNa,
}: {
  email?: string;
  volgende?: string;
  /** Wanneer "stuur opnieuw" vrijkomt, gerekend vanaf de mail van het aanmelden. */
  opnieuwNa?: number;
}) {
  const [codeStand, codeActie, codeBezig] = useActionState<AuthState, FormData>(
    bevestigMetCode,
    {},
  );
  const [opnieuwStand, opnieuwActie, opnieuwBezig] = useActionState<
    AuthState,
    FormData
  >(bevestigingOpnieuw, {});

  const [code, setCode] = useState("");
  const [nu, setNu] = useState(() => Date.now());

  // Supabase' grens geldt per adres, dus de mail van het aanmelden telt mee.
  // Zolang er nog niet opnieuw verstuurd is geldt het tijdstip van de
  // registratie; daarna dat van de laatste verzending.
  const vrijOp = opnieuwStand.opnieuwNa ?? opnieuwNa;

  useEffect(() => {
    if (!vrijOp) return;
    const t = setInterval(() => setNu(Date.now()), 500);
    return () => clearInterval(t);
  }, [vrijOp]);

  const rest = vrijOp ? Math.max(0, Math.ceil((vrijOp - nu) / 1000)) : 0;
  const opSlot = opnieuwBezig || rest > 0;

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
        {/* Het adres op een eigen regel. Midden in een gecentreerde zin rafelt
            het over drie regels en raak je juist het ene stukje kwijt waarop
            iemand moet controleren: staat daar écht mijn adres, of heb ik me
            vertypt? Dat laatste is de meest voorkomende reden dat er geen mail
            aankomt. */}
        <p className="mt-3 leading-7 text-ink/70">We hebben een code gestuurd naar:</p>
        <p className="mt-1.5 break-words font-bold text-ink">
          {email ?? "je e-mailadres"}
        </p>
        <p className="mt-1.5 text-sm text-ink/60">
          Dat kan tot 5 minuten duren.
        </p>
      </div>

      <form action={codeActie} className="mt-6 flex flex-wrap gap-3">
        <input type="hidden" name="email" value={email ?? ""} />
        {volgende && <input type="hidden" name="volgende" value={volgende} />}
        <label htmlFor="code" className="sr-only">
          Code uit de mail
        </label>
        <input
          id="code"
          name="code"
          type="text"
          /* Hiermee biedt iOS de code uit de mail zelf aan boven het
             toetsenbord, zonder dat je de mail hoeft te openen. Android doet
             iets vergelijkbaars. */
          autoComplete="one-time-code"
          inputMode="numeric"
          autoFocus
          required
          placeholder="000000"
          value={code}
          /* Alles wat geen cijfer is eruit: mensen plakken de code geregeld
             mét de ruimte die ze in de mail zien. Eén breed veld in plaats van
             zes hokjes, juist omdat plakken in hokjes zo vaak misgaat. */
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="min-w-[9rem] flex-1 rounded-xl border border-black/10 bg-cream px-4 py-3 text-center text-xl font-bold tracking-[0.4em] text-ink outline-none transition placeholder:font-normal placeholder:tracking-[0.3em] placeholder:text-ink/25 focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="submit"
          disabled={codeBezig || code.length < 6}
          /* Op een smal scherm valt de knop onder het veld; dan hoort hij ook
             de volle breedte te nemen in plaats van links te blijven hangen. */
          className="w-full rounded-2xl bg-brand px-6 py-3 font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {codeBezig ? "Bezig…" : "Bevestigen"}
        </button>
      </form>

      {/* Eén gebied voor alle meldingen, zodat een schermlezer het voorleest
          zodra er iets verschijnt. */}
      <div aria-live="polite" className="empty:hidden">
        {codeStand.error && (
          <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {codeStand.error}
          </p>
        )}
        {opnieuwStand.message === "opnieuw" && (
          <p className="mt-3 rounded-2xl bg-brand-soft px-4 py-3 text-sm font-semibold text-brand-dark">
            Verstuurd. Hij kan een paar minuten onderweg zijn.
          </p>
        )}
        {opnieuwStand.error && (
          <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {opnieuwStand.error}
          </p>
        )}
      </div>

      {/* Een <div>, geen <p>: een formulier mag niet in een tekstalinea staan.
          Dat is ongeldige HTML en de browser trekt hem dan uit elkaar. */}
      <div className="mt-6 text-center text-sm text-ink/60">
        Geen mail gekregen?{" "}
        <form action={opnieuwActie} className="inline">
          <input type="hidden" name="email" value={email ?? ""} />
          {volgende && <input type="hidden" name="volgende" value={volgende} />}
          <button
            type="submit"
            disabled={opSlot}
            className="font-bold text-brand-dark underline decoration-brand/40 underline-offset-2 transition hover:decoration-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:font-semibold disabled:text-ink/50 disabled:no-underline"
          >
            {opnieuwBezig
              ? "Bezig…"
              : rest > 0
                ? `Opnieuw over ${rest}s`
                : "Stuur opnieuw"}
          </button>
        </form>
      </div>

      {/* Op een eigen regel, want samen op één regel met een scheidingsteken
          brak het af met dat teken bungelend aan het eind. */}
      <p className="mt-2 text-center text-sm text-ink/60">
        Lukt het niet?{" "}
        <a
          href="mailto:support@avinka.nl"
          className="font-bold text-brand-dark underline decoration-brand/40 underline-offset-2 hover:decoration-brand"
        >
          support@avinka.nl
        </a>
      </p>
    </div>
  );
}

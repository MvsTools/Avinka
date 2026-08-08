"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

/* Je wachtwoord wijzigen terwijl je gewoon ingelogd bent.
 *
 * WAAROM DIT ER MOET ZIJN: hiervoor stuurde de knop je naar "wachtwoord
 * vergeten", dus je moest een mail afwachten om iets te veranderen waar je al
 * toegang toe had. Op een schoolmailadres duurt dat een paar minuten (het filter
 * scant de link), en dat is een gekke omweg voor wie gewoon even een ander
 * wachtwoord wil.
 *
 * ⚠️ HET HUIDIGE WACHTWOORD WORDT GEVRAAGD, en dat is geen formaliteit: zonder
 * die controle kan iedereen die langs een onbeheerd ingelogd scherm loopt het
 * wachtwoord veranderen en de eigenaar buitensluiten. Op een school staat er
 * geregeld een laptop open in een lokaal. We controleren het door er echt mee in
 * te loggen; mislukt dat, dan verandert er niets en blijft de huidige sessie
 * gewoon geldig. */
export default function WachtwoordWijzigen({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [huidig, setHuidig] = useState("");
  const [nieuw, setNieuw] = useState("");
  const [herhaling, setHerhaling] = useState("");
  const [bezig, setBezig] = useState(false);
  const [uitkomst, setUitkomst] = useState<{ ok: boolean; tekst: string } | null>(null);

  // ⚠️ Bewust GEEN controle tijdens het typen: dan staat er "komen niet overeen"
  // terwijl je nog gewoon bezig bent met het tweede veld. Pas melden bij het
  // opslaan, zoals ook op het herstelscherm.
  function sluit() {
    setOpen(false);
    setHuidig("");
    setNieuw("");
    setHerhaling("");
  }

  async function opslaan() {
    if (bezig) return;
    if (!huidig || !nieuw) {
      setUitkomst({ ok: false, tekst: "Vul je huidige en je nieuwe wachtwoord in." });
      return;
    }
    if (nieuw.length < 6) {
      setUitkomst({ ok: false, tekst: "Kies een wachtwoord van minstens 6 tekens." });
      return;
    }
    if (nieuw !== herhaling) {
      setUitkomst({ ok: false, tekst: "De wachtwoorden komen niet overeen." });
      return;
    }
    if (nieuw === huidig) {
      setUitkomst({ ok: false, tekst: "Dat is het wachtwoord dat je nu al gebruikt." });
      return;
    }

    setBezig(true);
    setUitkomst(null);
    const sb = createClient();

    // Eerst bewijzen dat je het huidige wachtwoord kent.
    const { error: inlogFout } = await sb.auth.signInWithPassword({
      email,
      password: huidig,
    });
    if (inlogFout) {
      setBezig(false);
      // Bewust niet de melding van Supabase: die zegt "Invalid login
      // credentials", en dan ga je je afvragen of je e-mailadres wel klopt.
      setUitkomst({ ok: false, tekst: "Je huidige wachtwoord klopt niet." });
      return;
    }

    const { error } = await sb.auth.updateUser({ password: nieuw });
    setBezig(false);

    if (error) {
      setUitkomst({
        ok: false,
        tekst: error.message || "Het is niet gelukt. Probeer het zo nog eens.",
      });
      return;
    }

    sluit();
    setUitkomst({
      ok: true,
      tekst: "Je wachtwoord is gewijzigd. Vanaf nu log je in met het nieuwe.",
    });
  }

  const veld =
    "w-full max-w-xs rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    // `items-start` en niet `items-center`: opengeklapt is de linkerkolom drie
    // velden hoog, en dan zweeft de knop rechts halverwege in de lucht in plaats
    // van naast de regel waar hij bij hoort.
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink/55">Wachtwoord</p>
        <p className="text-ink">••••••••</p>

        {open && (
          <div className="mt-3 space-y-3">
            {/* Verborgen, maar wel aanwezig: een wachtwoordbeheerder heeft een
                gebruikersnaam nodig om het nieuwe wachtwoord aan het juiste
                account te koppelen. */}
            <input type="email" value={email} autoComplete="username" readOnly hidden />
            <div>
              <label htmlFor="ww-huidig" className="block text-sm font-semibold text-ink/70">
                Huidig wachtwoord
              </label>
              <input
                id="ww-huidig"
                type="password"
                autoComplete="current-password"
                value={huidig}
                onChange={(e) => setHuidig(e.target.value)}
                className={"mt-1 " + veld}
              />
            </div>
            <div>
              <label htmlFor="ww-nieuw" className="block text-sm font-semibold text-ink/70">
                Nieuw wachtwoord
              </label>
              <input
                id="ww-nieuw"
                type="password"
                autoComplete="new-password"
                value={nieuw}
                onChange={(e) => setNieuw(e.target.value)}
                placeholder="Minstens 6 tekens"
                className={"mt-1 " + veld}
              />
            </div>
            <div>
              <label htmlFor="ww-herhaling" className="block text-sm font-semibold text-ink/70">
                Nog een keer
              </label>
              <input
                id="ww-herhaling"
                type="password"
                autoComplete="new-password"
                value={herhaling}
                onChange={(e) => setHerhaling(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    opslaan();
                  }
                }}
                className={"mt-1 " + veld}
              />
            </div>
            <button
              type="button"
              onClick={opslaan}
              disabled={bezig}
              className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
            >
              {bezig ? "Bezig…" : "Wachtwoord opslaan"}
            </button>
          </div>
        )}

        {uitkomst && (
          <p
            role="status"
            className={
              "mt-3 max-w-md rounded-2xl px-4 py-3 text-sm leading-6 " +
              (uitkomst.ok
                ? "bg-brand-soft text-ink/75"
                : "bg-rose-50 font-semibold text-rose-700")
            }
          >
            {uitkomst.tekst}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          if (open) sluit();
          else setOpen(true);
          setUitkomst(null);
        }}
        className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-black/20 hover:text-ink"
      >
        {open ? "Annuleren" : "Wachtwoord wijzigen"}
      </button>
    </div>
  );
}

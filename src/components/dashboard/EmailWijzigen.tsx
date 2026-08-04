"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

/* Je e-mailadres wijzigen.
 *
 * WAAROM DIT ER MOET ZIJN: een leerkracht meldt zich aan met haar schooladres
 * en stapt een jaar later over naar een andere school. Zonder deze knop is haar
 * account dan onbereikbaar, want ook "wachtwoord vergeten" mailt naar precies
 * het postvak dat ze kwijt is. Dat is bij deze doelgroep geen randgeval.
 *
 * Het adres verandert PAS als de link in de bevestigingsmail is aangeklikt.
 * Tot die tijd blijft alles bij het oude, en dat staat er ook zo. */
export default function EmailWijzigen({ huidig }: { huidig: string }) {
  const [open, setOpen] = useState(false);
  const [nieuw, setNieuw] = useState("");
  const [bezig, setBezig] = useState(false);
  const [uitkomst, setUitkomst] = useState<{ ok: boolean; tekst: string } | null>(null);

  async function verstuur() {
    const adres = nieuw.trim();
    if (!adres || bezig) return;

    // Vorm globaal controleren; de echte controle doet Supabase. Dit vangt
    // alleen de typefout af waardoor je anders op een bevestigingsmail zou
    // zitten wachten die nooit komt.
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adres)) {
      setUitkomst({ ok: false, tekst: "Dat lijkt geen geldig e-mailadres." });
      return;
    }
    if (adres.toLowerCase() === huidig.toLowerCase()) {
      setUitkomst({ ok: false, tekst: "Dat is het adres dat je nu al gebruikt." });
      return;
    }

    setBezig(true);
    setUitkomst(null);
    const sb = createClient();
    const { error } = await sb.auth.updateUser({ email: adres });
    setBezig(false);

    if (error) {
      // De melding van Supabase meenemen: die zegt bijvoorbeeld dat het adres
      // al in gebruik is, en dat wil je gewoon kunnen lezen.
      setUitkomst({ ok: false, tekst: error.message || "Het is niet gelukt. Probeer het zo nog eens." });
      return;
    }
    setUitkomst({
      ok: true,
      tekst: `We hebben een bevestigingsmail gestuurd naar ${adres}. Klik op de link in die mail om de wijziging af te ronden. Krijg je ook een mail op je huidige adres, bevestig die dan ook. Tot die tijd log je gewoon in met ${huidig}.`,
    });
    setNieuw("");
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink/55">E-mailadres</p>
        <p className="break-all text-ink">{huidig || "—"}</p>

        {open && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="email"
              value={nieuw}
              onChange={(e) => setNieuw(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  verstuur();
                }
              }}
              placeholder="je nieuwe e-mailadres"
              autoComplete="off"
              className="w-full max-w-xs rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <button
              type="button"
              onClick={verstuur}
              disabled={bezig}
              className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
            >
              {bezig ? "Bezig…" : "Stuur bevestiging"}
            </button>
          </div>
        )}

        {uitkomst && (
          <p
            role="status"
            className={
              "mt-3 max-w-md rounded-2xl px-4 py-3 text-sm leading-6 " +
              (uitkomst.ok ? "bg-brand-soft text-ink/75" : "bg-rose-50 font-semibold text-rose-700")
            }
          >
            {uitkomst.tekst}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setUitkomst(null);
        }}
        className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-black/20 hover:text-ink"
      >
        {open ? "Annuleren" : "E-mailadres wijzigen"}
      </button>
    </div>
  );
}

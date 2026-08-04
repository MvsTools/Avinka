"use client";

import { useState } from "react";

/* Knopje om te controleren of de verzendstraat werkt. Stuurt één mail naar het
   adres waarmee je bent ingelogd; de route accepteert geen ander adres.
   Zie src/app/api/mail/test/route.ts.

   Hoort bij het opzetten van de mail (docs/plan-mail.md) en mag weg zodra de
   echte mails draaien en zichzelf bewijzen. */
export default function AdminMailTest() {
  const [bezig, setBezig] = useState(false);
  const [uitkomst, setUitkomst] = useState<{ ok: boolean; tekst: string } | null>(null);

  async function stuur() {
    setBezig(true);
    setUitkomst(null);
    try {
      const r = await fetch("/api/mail/test", { method: "POST" });
      const d = await r.json();
      setUitkomst(
        r.ok
          ? { ok: true, tekst: `Verstuurd naar ${d.naar}. Kijk in je inbox (en in spam).` }
          : { ok: false, tekst: String(d.error ?? `Mislukt (status ${r.status})`) },
      );
    } catch {
      setUitkomst({ ok: false, tekst: "Geen verbinding met de server." });
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-bold text-ink">Mail testen</h2>
      <p className="mt-1 text-sm text-ink/65">
        Stuurt één testmail naar je eigen adres, via Resend en vanaf avinka.nl.
      </p>
      <button
        type="button"
        onClick={stuur}
        disabled={bezig}
        className="mt-3 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
      >
        {bezig ? "Bezig…" : "Stuur testmail"}
      </button>

      {uitkomst && (
        <p
          role="status"
          className={
            "mt-3 rounded-2xl px-4 py-3 text-sm font-semibold " +
            (uitkomst.ok ? "bg-brand-soft text-ink/75" : "bg-rose-50 text-rose-700")
          }
        >
          {uitkomst.tekst}
        </p>
      )}
    </div>
  );
}

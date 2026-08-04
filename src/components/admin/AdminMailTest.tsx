"use client";

import { useState } from "react";

/* Knopje om te controleren of de verzendstraat werkt. Laat je het veld leeg,
   dan gaat de mail naar het adres waarmee je bent ingelogd. Een ander adres mag
   alleen omdat een meetdienst een wegwerpadres uitdeelt, en zonder dat kom je
   nooit te weten waaróm je in de ongewenste map belandt. Alleen voor admins;
   zie src/app/api/mail/test/route.ts.

   Hoort bij het opzetten van de mail (docs/plan-mail.md) en mag weg zodra de
   echte mails draaien en zichzelf bewijzen. */
export default function AdminMailTest() {
  const [bezig, setBezig] = useState(false);
  const [naar, setNaar] = useState("");
  const [uitkomst, setUitkomst] = useState<{ ok: boolean; tekst: string } | null>(null);

  async function stuur() {
    setBezig(true);
    setUitkomst(null);
    try {
      const r = await fetch("/api/mail/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ naar: naar.trim() }),
      });
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
        Stuurt één proefmail via Resend, vanaf avinka.nl. Laat het veld leeg om
        naar jezelf te sturen, of vul het wegwerpadres van{" "}
        <a
          href="https://www.mail-tester.com"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-brand hover:underline"
        >
          mail-tester.com
        </a>{" "}
        in om een oordeel te krijgen.
      </p>
      <input
        type="email"
        value={naar}
        onChange={(e) => setNaar(e.target.value)}
        placeholder="leeg = naar jezelf"
        autoComplete="off"
        className="mt-3 w-full max-w-sm rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      <br />
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

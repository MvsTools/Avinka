"use client";

import { useEffect, useState } from "react";
import { getBetaEigenFormatLijst, zetBetaEigenFormat } from "@/lib/db";

// Wie mag de bèta "eigen schoolsjabloon" zien bij Toetsanalyse (IEP en Cito).
// Die functie werkt alleen betrouwbaar bij sjablonen die van tevoren zijn
// getest, dus staat voor iedereen standaard uit; hier zet je een account op
// e-mailadres aan of uit.
export default function AdminBetaToegang() {
  const [lijst, setLijst] = useState<string[] | null>(null);
  const [email, setEmail] = useState("");
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState("");

  const ververs = () => getBetaEigenFormatLijst().then(setLijst);
  useEffect(() => {
    ververs();
  }, []);

  async function aanzetten(e: React.FormEvent) {
    e.preventDefault();
    const adres = email.trim();
    if (!adres) return;
    setBezig(true);
    setMelding("");
    const ok = await zetBetaEigenFormat(adres, true);
    setBezig(false);
    if (ok) {
      setEmail("");
      ververs();
    } else {
      setMelding("Kon dit account niet vinden of aanzetten.");
    }
  }

  async function uitzetten(adres: string) {
    setBezig(true);
    await zetBetaEigenFormat(adres, false);
    setBezig(false);
    ververs();
  }

  return (
    <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-ink">Bèta: eigen schoolsjabloon</h2>
      <p className="mt-1 text-sm text-ink/60">
        Staat standaard uit voor iedereen. Zet een account hier aan zodra je het sjabloon zelf hebt
        getest.
      </p>

      <form onSubmit={aanzetten} className="mt-4 flex flex-wrap items-center gap-2.5">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e-mailadres van de leerkracht"
          className="min-w-0 flex-1 rounded-xl border border-black/10 bg-cream px-3.5 py-2.5 text-sm text-ink outline-none transition focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="submit"
          disabled={bezig || !email.trim()}
          className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          Aanzetten
        </button>
      </form>
      {melding && <p className="mt-2 text-sm text-red-600">{melding}</p>}

      <div className="mt-5">
        {lijst === null ? (
          <p className="text-sm text-ink/50">Laden…</p>
        ) : lijst.length === 0 ? (
          <p className="text-sm text-ink/50">Nog geen enkel account aangezet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {lijst.map((adres) => (
              <li
                key={adres}
                className="flex items-center justify-between gap-3 rounded-xl bg-cream px-3.5 py-2.5"
              >
                <span className="min-w-0 truncate text-sm text-ink">{adres}</span>
                <button
                  type="button"
                  onClick={() => uitzetten(adres)}
                  disabled={bezig}
                  className="shrink-0 text-sm font-semibold text-ink/50 transition hover:text-red-600 disabled:opacity-50"
                >
                  Uitzetten
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

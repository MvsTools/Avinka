"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Twee AVG-rechten die je zelf in het platform kunt uitoefenen:
// 1. Je gegevens downloaden (inzage + portabiliteit).
// 2. Je account definitief verwijderen (recht op vergetelheid).
export default function AccountBeheer() {
  const router = useRouter();
  const [open, setOpen] = useState(false); // gevarenzone uitgeklapt?
  const [tekst, setTekst] = useState(""); // typ-bevestiging
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  const magWissen = tekst.trim().toUpperCase() === "VERWIJDER";

  async function verwijder() {
    if (!magWissen || bezig) return;
    setBezig(true);
    setFout("");
    try {
      const r = await fetch("/api/account", { method: "DELETE" });
      if (!r.ok) throw new Error();
      // Account is weg; naar de startpagina, sessie is al opgeruimd.
      router.push("/");
      router.refresh();
    } catch {
      setFout("Verwijderen lukte niet. Probeer het later opnieuw of mail ons.");
      setBezig(false);
    }
  }

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="text-lg font-bold text-ink">Mijn gegevens</h2>
      <p className="mt-2 text-sm text-ink/65">
        Je hebt altijd recht op inzage in je eigen gegevens en om je account te laten
        verwijderen. Dat regel je hier zelf.
      </p>

      {/* Inzien — opent een leesbare overzichtspagina in een nieuw tabblad. */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-4">
        <div>
          <p className="text-sm font-semibold text-ink">Zien wat we bewaren</p>
          <p className="text-sm text-ink/60">
            Een leesbaar overzicht van alles wat we onder je account bewaren. Je kunt het
            afdrukken, opslaan als pdf of downloaden als bestand.
          </p>
        </div>
        <a
          href="/api/account/export"
          target="_blank"
          rel="noopener"
          className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-black/20 hover:text-ink"
        >
          Overzicht openen
        </a>
      </div>

      {/* Gevarenzone — verwijderen achter een bewuste bevestiging. */}
      <div className="pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Account verwijderen</p>
            <p className="text-sm text-ink/60">
              Verwijdert je account en alle bijbehorende gegevens definitief.
            </p>
          </div>
          {!open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
            >
              Account verwijderen
            </button>
          )}
        </div>

        {open && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/60 p-5">
            <p className="text-sm font-semibold text-ink">
              Weet je het zeker? Dit kan niet ongedaan worden gemaakt.
            </p>
            <p className="mt-1 text-sm text-ink/70">
              Je klas, je opgeslagen teksten, je plattegronden en al je andere gegevens
              worden verwijderd. Typ <strong>VERWIJDER</strong> om te bevestigen.
            </p>
            <input
              value={tekst}
              onChange={(e) => setTekst(e.target.value)}
              placeholder="VERWIJDER"
              autoComplete="off"
              className="mt-3 w-full max-w-xs rounded-xl border border-red-200 bg-white px-4 py-3 text-ink outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200"
            />
            {fout && <p className="mt-2 text-sm font-medium text-red-600">{fout}</p>}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={verwijder}
                disabled={!magWissen || bezig}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {bezig ? "Bezig met verwijderen…" : "Definitief verwijderen"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setTekst("");
                  setFout("");
                }}
                disabled={bezig}
                className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-black/20 hover:text-ink"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

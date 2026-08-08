"use client";

import { useState } from "react";

/* Eén blok van de pagina "Wat we van jou bewaren": kaarten naast elkaar, per
 * kaart een vinkhokje en een uitklapbare preview, en eronder één downloadknop
 * die meetelt wat je hebt aangevinkt.
 *
 * ⚠️ HET VINKHOKJE STAAT BUITEN <summary>, EN DAT IS GEEN SMAAKKWESTIE. Een
 * hokje binnen een summary klapt de sectie open zodra je hem aanvinkt: het hele
 * blok is dan de knop. Daarom is de kaart opgedeeld: hokje en titel bovenin,
 * "Bekijken" als los klapkopje eronder.
 *
 * ⚠️ Het is een gewoon <form method="get">: elk aangevinkt hokje wordt een
 * ?deel= in de link. De telling op de knop is versiering; de download zelf
 * leunt er niet op. */

export type Kaart = {
  tabel: string;
  titel: string;
  /** "2 rapportteksten" — in woorden, niet "2 regels". */
  telling: string;
  /** "Word" / "Excel" / "Agenda", of null als er niets te downloaden valt. */
  formaat: string | null;
  /** Per rij de label/waarde-paren voor de preview. */
  rijen: { label: string; waarde: string }[][];
};

export default function GegevensBlok({
  kaarten,
  actie,
  toonFormaat = true,
}: {
  kaarten: Kaart[];
  actie: string;
  /** In het onderste blok is élk bestand een Excel-tabel; dat woord op elke
   *  kaart herhalen is ruis, want de uitleg erboven zegt het al. */
  toonFormaat?: boolean;
}) {
  const [gekozen, setGekozen] = useState<string[]>([]);

  function wissel(tabel: string) {
    setGekozen((oud) =>
      oud.includes(tabel) ? oud.filter((t) => t !== tabel) : [...oud, tabel],
    );
  }

  const n = gekozen.length;

  return (
    <form method="get" action={actie}>
      {/* items-start is hier de sleutel: zonder dat rekt een uitgeklapte kaart
          zijn buurman mee omhoog, en dan staat die vol lucht. */}
      <div className="grid items-start gap-3 sm:grid-cols-2">
        {kaarten.map((k) => (
          <section
            key={k.tabel}
            className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm shadow-ink/[0.03]"
          >
            <div className="flex items-start gap-3">
              {k.formaat !== null ? (
                <input
                  type="checkbox"
                  name="deel"
                  value={k.tabel}
                  checked={gekozen.includes(k.tabel)}
                  onChange={() => wissel(k.tabel)}
                  aria-label={`${k.titel} downloaden`}
                  className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-brand-dark"
                />
              ) : (
                // Lege kolom, anders staat deze titel uit de rooilijn met de
                // rest en lijkt dat een fout.
                <span className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-lg font-semibold leading-snug text-ink">
                  {k.titel}
                </h3>
                <p className="mt-0.5 text-sm text-ink/55">
                  {k.telling}
                  {k.formaat && toonFormaat && (
                    <>
                      {" · "}
                      <span className="font-bold text-ink/70">{k.formaat}</span>
                    </>
                  )}
                </p>

                <details className="group mt-3">
                  <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-bold text-brand-dark hover:underline">
                    <span className="transition-transform group-open:rotate-90">›</span>
                    {/* Twee echte woorden, geen ::after-truc: dan leest een
                        schermlezer ook "Verbergen" voor. */}
                    <span className="group-open:hidden">Bekijken</span>
                    <span className="hidden group-open:inline">Verbergen</span>
                  </summary>
                  <div className="mt-3 space-y-4 border-t border-ink/8 pt-3">
                    {k.rijen.map((velden, i) => (
                      <dl
                        key={i}
                        className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[minmax(0,9rem)_1fr]"
                      >
                        {velden.map((v, j) => (
                          <div key={j} className="contents">
                            <dt className="font-semibold text-ink/50">{v.label}</dt>
                            <dd className="mb-1 break-words whitespace-pre-wrap text-ink sm:mb-0">
                              {v.waarde}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={n === 0}
          className="rounded-2xl bg-brand-dark px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark/90 disabled:cursor-not-allowed disabled:bg-ink/15 disabled:text-ink/40 disabled:shadow-none"
        >
          {n === 0
            ? "Download wat je hebt aangevinkt"
            : n === 1
              ? "Download 1 onderdeel"
              : `Download ${n} onderdelen`}
        </button>
        <span className="text-sm text-ink/50">
          {n === 0
            ? "Nog niets aangevinkt"
            : n === 1
              ? ""
              : "Je krijgt ze samen in een zip-bestand"}
        </span>
      </div>
    </form>
  );
}

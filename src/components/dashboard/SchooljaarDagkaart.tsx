"use client";

import { useEffect, useRef } from "react";
import { kort, volledig } from "@/lib/planning";
import type { Dagbeeld } from "@/lib/planning";
import { ETIKET } from "./schooljaar-stijl";

// Het kaartje van één dag. Klik een dag aan (in de kalender of in de lijst) en
// je ziet precies wat er staat en hoe laat. Straks komt hier je lesrooster van
// die dag bij; de dagweergave rekent al met dezelfde gegevens.

export default function SchooljaarDagkaart({
  beeld,
  sluit,
}: {
  beeld: Dagbeeld;
  sluit: () => void;
}) {
  const kaart = useRef<HTMLDivElement>(null);

  // Escape sluit, en de knop krijgt de aandacht zodat je met het toetsenbord
  // niet achter het kaartje verdwaalt.
  useEffect(() => {
    const toets = (e: KeyboardEvent) => {
      if (e.key === "Escape") sluit();
    };
    document.addEventListener("keydown", toets);
    kaart.current?.focus();
    return () => document.removeEventListener("keydown", toets);
  }, [sluit]);

  const afspraken = beeld.items.filter((i) => i.soort !== "vakantie");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onClick={sluit}
    >
      <div
        ref={kaart}
        role="dialog"
        aria-modal="true"
        aria-label={volledig(beeld.datum)}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl outline-none sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-serif text-2xl font-semibold text-ink">{volledig(beeld.datum)}</p>
            {beeld.periode && (
              <p className="mt-1 text-sm text-ink/50">
                {beeld.periode.naam}
                {beeld.periode.eindigtMet
                  ? `, tot de ${beeld.periode.eindigtMet.naam.toLowerCase()}`
                  : ""}
              </p>
            )}
          </div>
          <button
            onClick={sluit}
            aria-label="Sluiten"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/10 text-ink/50 transition-transform duration-150 hover:text-ink active:scale-[0.96]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Wat voor dag is het? Eén regel, meteen duidelijk. */}
        {beeld.vakantie ? (
          <p className="mt-4 rounded-2xl bg-brand-soft px-4 py-3 font-semibold text-brand-dark">
            {beeld.vakantie.naam}, tot en met {kort(beeld.vakantie.tot)}
          </p>
        ) : beeld.vrijReden === "vrije dag" ? (
          <p className="mt-4 rounded-2xl bg-brand-soft px-4 py-3 font-semibold text-brand-dark">
            Geen les vandaag. Voor jou is het meestal wel een werkdag.
          </p>
        ) : beeld.weekend ? (
          <p className="mt-4 rounded-2xl bg-cream px-4 py-3 font-semibold text-ink/60">Weekend</p>
        ) : null}

        {afspraken.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {afspraken.map((item) => {
              const et = ETIKET[item.soort];
              const meerdaags = item.totDatum > item.datum;
              return (
                <li key={item.id} className="rounded-2xl border border-black/5 bg-cream/40 px-4 py-3">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-semibold text-ink">{item.titel}</span>
                    <span className={"rounded-lg px-2 py-0.5 text-xs font-bold " + et.stijl}>
                      {et.woord}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink/60">
                    {item.heleDag
                      ? meerdaags
                        ? `Hele dag, ${kort(item.datum)} tot en met ${kort(item.totDatum)}`
                        : "Hele dag"
                      : `${item.begin}${item.eind ? ` tot ${item.eind}` : ""}`}
                    {item.tijdvakken > 1
                      ? `, ${item.tijdvakken} tijdvakken achter elkaar`
                      : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        {!afspraken.length && !beeld.vakantie && (
          <p className="mt-4 text-ink/60">
            {beeld.weekend
              ? "Niets gepland."
              : "Niets bijzonders deze dag. Een gewone lesdag dus."}
          </p>
        )}
      </div>
    </div>
  );
}

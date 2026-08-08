"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { kort, volledig, zijkantLabel } from "@/lib/planning";
import type { Dagbeeld, PlanItem } from "@/lib/planning";
import AfspraakFormulier from "./AfspraakFormulier";
import { ETIKET } from "./schooljaar-stijl";
import { useEigenAfspraakVorm } from "./useEigenAfspraakVorm";

// Het kaartje van één dag. Klik een dag aan (in de kalender of in de lijst) en
// je ziet precies wat er staat en hoe laat. Straks komt hier je lesrooster van
// die dag bij; de dagweergave rekent al met dezelfde gegevens.
//
// De vensterschil en de afspraakregel staan hier ook, want het weekkaartje
// gebruikt precies dezelfde.

/** Het venster zelf: verduisterde achtergrond, sluiten met Escape of ernaast. */
export function Kaartvenster({
  titel,
  sluit,
  extra,
  children,
}: {
  titel: string;
  sluit: () => void;
  /** Extra knop vóór het kruisje, bijv. de + om een afspraak op deze dag te zetten. */
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const kaart = useRef<HTMLDivElement>(null);

  // De sluit-functie komt vrijwel altijd binnen als een verse arrow-functie
  // (`sluit={() => setOpen(null)}`), dus als afhankelijkheid verandert hij bij
  // ELKE render van de ouder. Stond hij in de dependency-array, dan draaide de
  // focus-regel hieronder telkens opnieuw — en pakte het venster de aandacht af
  // van wat er op dat moment gebeurde. In een venster met een tekstveld betekent
  // dat: één letter typen en je staat er weer buiten. Daarom via een ref, zodat
  // het effect alleen bij openen draait maar wél de nieuwste functie aanroept.
  const sluitRef = useRef(sluit);
  useEffect(() => {
    sluitRef.current = sluit;
  });

  // Escape sluit, en het venster krijgt bij openen de aandacht zodat je met het
  // toetsenbord niet achter het kaartje verdwaalt.
  useEffect(() => {
    const toets = (e: KeyboardEvent) => {
      if (e.key === "Escape") sluitRef.current();
    };
    document.addEventListener("keydown", toets);
    kaart.current?.focus();
    return () => document.removeEventListener("keydown", toets);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onClick={sluit}
    >
      <div
        ref={kaart}
        role="dialog"
        aria-modal="true"
        aria-label={titel}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl outline-none sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4">
          <p className="font-serif text-2xl font-semibold text-ink">{titel}</p>
          <div className="flex shrink-0 items-center gap-2">
            {extra}
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
        </div>
        {children}
      </div>
    </div>
  );
}

/** Eén afspraak met zijn tijd. Zelfde vorm in het dag- en het weekkaartje. */
export function Afspraakregel({
  item,
  groepen,
  onWijzig,
}: {
  item: PlanItem;
  groepen: number[];
  /** Alleen voor je eigen afspraken: maakt de regel klikbaar om te wijzigen,
   *  al ingevuld. Afspraken uit een gekoppelde agenda krijgen dit niet. */
  onWijzig?: () => void;
}) {
  const et = ETIKET[item.soort];
  const meerdaags = item.totDatum > item.datum;
  const zijkant = zijkantLabel(item, groepen);
  const inhoud = (
    <>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-semibold text-ink">{item.titel}</span>
        <span className={"rounded-lg px-2 py-0.5 text-xs font-bold " + et.stijl}>{et.woord}</span>
        {zijkant && (
          <span className="rounded-lg border border-black/10 px-2 py-0.5 text-xs font-semibold text-ink/45">
            {zijkant}
          </span>
        )}
        {onWijzig && <span className="ml-auto text-xs font-bold text-ink/35">Wijzigen</span>}
      </div>
      <p className="mt-1 text-sm text-ink/60">
        {item.heleDag
          ? meerdaags
            ? `Hele dag, ${kort(item.datum)} tot en met ${kort(item.totDatum)}`
            : "Hele dag"
          : `${item.begin}${item.eind ? ` tot ${item.eind}` : ""}`}
        {item.tijdvakken > 1 ? `, ${item.tijdvakken} tijdvakken achter elkaar` : ""}
      </p>
    </>
  );

  if (onWijzig) {
    return (
      <li>
        <button
          onClick={onWijzig}
          className="w-full rounded-2xl border border-black/5 bg-cream/40 px-4 py-3 text-left transition-colors hover:border-brand/30 hover:bg-cream/70"
        >
          {inhoud}
        </button>
      </li>
    );
  }

  return (
    <li
      className={
        "rounded-2xl border border-black/5 bg-cream/40 px-4 py-3 " + (zijkant ? "opacity-70" : "")
      }
    >
      {inhoud}
    </li>
  );
}

/** Wat voor dag het is, in één regel: startweek, vakantie, vrije dag, weekend. */
export function Dagstatus({ beeld }: { beeld: Dagbeeld }) {
  if (beeld.eersteSchooldag) {
    return (
      <p className="mt-4 rounded-2xl bg-accent-soft px-4 py-3 font-semibold text-amber-800">
        Eerste schooldag
      </p>
    );
  }
  if (beeld.startweek) {
    return (
      <p className="mt-4 rounded-2xl bg-accent-soft px-4 py-3 font-semibold text-amber-800">
        Startweek
      </p>
    );
  }
  if (beeld.vakantie) {
    return (
      <p className="mt-4 rounded-2xl bg-brand-soft px-4 py-3 font-semibold text-brand-dark">
        {beeld.vakantie.naam}, tot en met {kort(beeld.vakantie.tot)}
      </p>
    );
  }
  if (beeld.vrijReden === "vrije dag") {
    return (
      <p className="mt-4 rounded-2xl bg-brand-soft px-4 py-3 font-semibold text-brand-dark">
        Geen les vandaag. Voor jou is het meestal wel een werkdag.
      </p>
    );
  }
  if (beeld.weekend) {
    return <p className="mt-4 rounded-2xl bg-cream px-4 py-3 font-semibold text-ink/60">Weekend</p>;
  }
  return null;
}

export default function SchooljaarDagkaart({
  beeld,
  sluit,
  groepen = [],
  eigenBronId,
}: {
  beeld: Dagbeeld;
  sluit: () => void;
  groepen?: number[];
  /** De bron-id van je eigen, zelf ingevoerde afspraken — die mag je hier
   *  meteen wijzigen; alles uit een gekoppelde agenda blijft alleen-lezen. */
  eigenBronId?: string | null;
}) {
  // De datum staat al vast, dus "+ Afspraak" hier scheelt een stap tegenover
  // dezelfde knop boven de kalender in Jaaroverzicht. En het formulier
  // verschijnt IN dit kaartje — niet ergens anders op de pagina, waar je het
  // eerst moest gaan zoeken.
  const formulier = useEigenAfspraakVorm(beeld.datum);
  // Net verwijderd? Dan METEEN uit de lijst, niet pas als router.refresh()
  // klaar is — anders lijkt verwijderen traag terwijl het al gelukt is.
  const afspraken = beeld.items.filter(
    (i) => i.soort !== "vakantie" && !formulier.netVerwijderd.has(i.id),
  );

  return (
    <Kaartvenster
      titel={volledig(beeld.datum)}
      sluit={sluit}
      extra={
        !formulier.vorm && (
          <button
            onClick={() => formulier.open({ datum: beeld.datum })}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-dark px-3 py-2 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.97]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Afspraak
          </button>
        )
      }
    >
      {formulier.vorm ? (
        <div className="mt-4">
          <AfspraakFormulier
            vorm={formulier.vorm}
            fout={formulier.fout}
            bezig={formulier.bezig}
            wijzigTitel={formulier.wijzigTitel}
            wijzigVeld={formulier.wijzigVeld}
            bewaar={formulier.bewaar}
            annuleren={formulier.annuleren}
            weghalen={formulier.weghalen}
          />
        </div>
      ) : (
        <>
          <Dagstatus beeld={beeld} />

          {formulier.gelukt && (
            <p role="status" className="mt-4 text-sm font-semibold text-brand-dark">
              {formulier.gelukt}
            </p>
          )}

          {afspraken.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2">
              {afspraken.map((item) => (
                <Afspraakregel
                  key={item.id}
                  item={item}
                  groepen={groepen}
                  onWijzig={
                    eigenBronId && item.bronId === eigenBronId
                      ? () =>
                          formulier.open({
                            id: item.id,
                            titel: item.titel,
                            datum: item.datum,
                            totDatum: item.totDatum,
                            heleDag: item.heleDag,
                            begin: item.begin ?? "",
                            eind: item.eind ?? "",
                            soort: item.soort,
                          })
                      : undefined
                  }
                />
              ))}
            </ul>
          )}

          {/* ⭐ §5 VAN HET PLAN, de andere kant op: "een taak met een datum
              verschijnt in de planning op die dag."
              De motor rekende dit al uit (dagbeeld.ts filtert taken op deadline)
              maar geen enkel scherm liet het zien — de lijst werd berekend en
              weggegooid. Zonder dit blijft je planning en je takenlijst twee
              losse dingen, terwijl juist het samenkomen de belofte is.
              ⚠️ Alleen tonen, niet afvinken: je takenlijst is de plek waar je ze
              beheert. Twee plekken waar je hetzelfde kunt afvinken is twee
              plekken die uit elkaar kunnen lopen. */}
          {beeld.taken.length > 0 && (
            <div className="mt-5">
              <h3 className="text-xs font-extrabold uppercase tracking-[0.08em] text-ink/45">
                Van je takenlijst
              </h3>
              <ul className="mt-2 flex flex-col gap-1.5">
                {beeld.taken.map((taak) => (
                  <li
                    key={taak.id}
                    className="flex items-start gap-2.5 rounded-xl bg-cream px-3 py-2 text-sm"
                  >
                    <span
                      aria-hidden
                      className={
                        "mt-0.5 shrink-0 " + (taak.gedaan ? "text-brand" : "text-ink/30")
                      }
                    >
                      {taak.gedaan ? "✓" : "○"}
                    </span>
                    <span className={taak.gedaan ? "text-ink/45 line-through" : "text-ink/80"}>
                      {taak.tekst}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard/taken"
                className="mt-2 inline-block text-sm font-bold text-brand-dark hover:underline"
              >
                Naar je takenlijst →
              </Link>
            </div>
          )}

          {!afspraken.length && !beeld.taken.length && !beeld.vakantie && !beeld.startweek && (
            <p className="mt-4 text-ink/60">
              {beeld.weekend ? "Niets gepland." : "Niets bijzonders deze dag."}
            </p>
          )}
        </>
      )}
    </Kaartvenster>
  );
}

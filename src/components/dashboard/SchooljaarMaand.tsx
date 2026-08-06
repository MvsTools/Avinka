"use client";

import { useState } from "react";
import {
  dagbeeld,
  maandagVan,
  plus,
  verschil,
  volledig,
  weeknummer,
  zijkantLabel,
} from "@/lib/planning";
import type { Dagbeeld, PlanItem, PlanningBron } from "@/lib/planning";
import { ETIKET, STIP } from "./schooljaar-stijl";
import SchooljaarDagkaart from "./SchooljaarDagkaart";
import SchooljaarWeekkaart from "./SchooljaarWeekkaart";

// De maandweergave: hetzelfde jaar, maar dan als kalender. Handig om te zien
// hoe druk een maand is en waar de gaten zitten.

const WEEKDAGEN = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const MAANDVOL = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

/** Een balkje van een meerdaagse afspraak, binnen één weekrij. */
type Balk = {
  item: PlanItem;
  /** Kolom binnen de week, 0 = maandag. */
  startCol: number;
  /** Hoeveel kolommen breed, geknipt aan de randen van de week. */
  span: number;
  /** Begint de afspraak écht hier, of loopt ze door vanuit de vorige week? */
  magStart: boolean;
  /** Eindigt de afspraak écht hier, of loopt ze door naar de volgende week? */
  magEind: boolean;
  /** Rijtje binnen de week: twee tegelijk lopende afspraken krijgen elk hun eigen laan. */
  lane: number;
};

const BALK_HOOGTE = 18;
const BALK_GAP = 4;

/**
 * Welke meerdaagse afspraken lopen door deze week, en op welke laan: zo vallen
 * twee tegelijk lopende afspraken niet over elkaar, en blijft elke afspraak
 * over de dagen heen op precies dezelfde hoogte staan.
 */
function balkenVoorWeek(bron: PlanningBron, weekStart: string, weekEind: string): Balk[] {
  const items = bron.items
    .filter(
      (i) =>
        !i.dubbelVan &&
        i.soort !== "vakantie" &&
        i.totDatum > i.datum &&
        i.datum <= weekEind &&
        i.totDatum >= weekStart,
    )
    .sort((a, b) => a.datum.localeCompare(b.datum) || b.totDatum.localeCompare(a.totDatum));

  const laneTot: string[] = [];
  return items.map((item) => {
    let lane = laneTot.findIndex((tot) => tot < item.datum);
    if (lane === -1) lane = laneTot.length;
    laneTot[lane] = item.totDatum;
    const startCol = Math.max(0, verschil(weekStart, item.datum));
    const eindCol = Math.min(6, verschil(weekStart, item.totDatum));
    return {
      item,
      startCol,
      span: eindCol - startCol + 1,
      magStart: item.datum >= weekStart,
      magEind: item.totDatum <= weekEind,
      lane,
    };
  });
}

export default function SchooljaarMaand({
  bron,
  vandaag,
  groepen,
  maand: eerste,
  zetMaand: setEerste,
  eigenBronId,
}: {
  bron: PlanningBron;
  vandaag: string;
  groepen: number[];
  /** Welke maand er getoond wordt; staat hierbuiten omdat de maandkiezer op de
   *  knoppenregel hem ook aanstuurt. */
  maand: string;
  zetMaand: (maand: string) => void;
  /** Zie SchooljaarDagkaart: bepaalt welke afspraken je hier mag wijzigen. */
  eigenBronId?: string | null;
}) {
  const binnenJaar = vandaag >= bron.schooljaar.start && vandaag <= bron.schooljaar.eind;
  const begin = binnenJaar ? vandaag : bron.schooljaar.start;
  const [gekozen, setGekozen] = useState<string | null>(null);
  const [week, setWeek] = useState<string | null>(null);

  const jaar = Number(eerste.slice(0, 4));
  const maand = Number(eerste.slice(5, 7)) - 1;
  const aantalDagen = new Date(Date.UTC(jaar, maand + 1, 0)).getUTCDate();
  const laatste = `${eerste.slice(0, 7)}-${String(aantalDagen).padStart(2, "0")}`;

  // Het rooster begint altijd op een maandag en loopt tot en met de week
  // waarin de laatste dag van de maand valt.
  const rasterStart = maandagVan(eerste);
  const rijen = Math.ceil((verschil(rasterStart, laatste) + 1) / 7);
  const cellen = Array.from({ length: rijen * 7 }, (_, i) => plus(rasterStart, i));
  const weekRijen = Array.from({ length: rijen }, (_, i) => cellen.slice(i * 7, i * 7 + 7));

  const verschuif = (n: number) => {
    setEerste(new Date(Date.UTC(jaar, maand + n, 1)).toISOString().slice(0, 10));
  };
  const kanTerug = eerste > bron.schooljaar.start.slice(0, 7) + "-01";
  const kanVooruit = eerste < bron.schooljaar.eind.slice(0, 7) + "-01";
  const opVandaag = eerste === begin.slice(0, 7) + "-01";

  // De vakantie staat al als groen vlak met een naam in de kalender. Hem
  // daarnaast ook nog als afspraak tonen leverde op elke maandag twee keer
  // hetzelfde woord op.
  const beeldVan = (datum: string) => {
    const beeld = dagbeeld(bron, datum);
    return { ...beeld, items: beeld.items.filter((i) => i.soort !== "vakantie") };
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        {/* Pijltjes vóór de maandnaam, en de naam op een vaste breedte. Anders
            schuiven ze mee met de lengte van het woord ("mei" tegenover
            "september") en klik je bij doorbladeren steeds mis. */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => verschuif(-1)}
            disabled={!kanTerug}
            aria-label="Vorige maand"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-ink/70 transition-transform duration-150 hover:text-ink active:scale-[0.96] disabled:opacity-35"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => verschuif(1)}
            disabled={!kanVooruit}
            aria-label="Volgende maand"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-ink/70 transition-transform duration-150 hover:text-ink active:scale-[0.96] disabled:opacity-35"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <h3 className="min-w-[11rem] text-lg font-bold text-ink">
          {MAANDVOL[maand]} {jaar}
        </h3>
        {!opVandaag && (
          <button
            onClick={() => setEerste(begin.slice(0, 7) + "-01")}
            className="text-sm font-bold text-brand-dark underline-offset-4 hover:underline"
          >
            Naar vandaag
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        <div className="grid grid-cols-[2rem_repeat(7,minmax(0,1fr))] border-b border-black/5 sm:grid-cols-[2.6rem_repeat(7,minmax(0,1fr))]">
          <div className="px-1 py-2 text-center text-xs font-bold uppercase tracking-wider text-ink/30">
            wk
          </div>
          {WEEKDAGEN.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-xs font-bold uppercase tracking-wider text-ink/40">
              {d}
            </div>
          ))}
        </div>

        {weekRijen.map((dagen) => (
          <Maandweek
            key={dagen[0]}
            dagen={dagen}
            eerste={eerste}
            vandaag={vandaag}
            gekozen={gekozen}
            setGekozen={setGekozen}
            setWeek={setWeek}
            groepen={groepen}
            bron={bron}
            beeldVan={beeldVan}
          />
        ))}
      </div>

      {/* Tik een dag aan en het kaartje van die dag komt naar voren: wat er
          staat en hoe laat. */}
      {gekozen && (
        <SchooljaarDagkaart
          beeld={beeldVan(gekozen)}
          groepen={groepen}
          sluit={() => setGekozen(null)}
          eigenBronId={eigenBronId}
        />
      )}
      {week && (
        <SchooljaarWeekkaart
          bron={bron}
          maandag={week}
          groepen={groepen}
          sluit={() => setWeek(null)}
        />
      )}
    </div>
  );
}

/**
 * Eén weekrij: de zeven dagcellen, plus een balkje per meerdaagse afspraak die
 * over die dagen loopt. Het balkje ligt als eigen raster óver de dagcellen
 * heen, met precies dezelfde kolommen — zo blijft hij op elke dag exact even
 * hoog staan en zie je in één oogopslag dat het om dezelfde afspraak gaat.
 */
function Maandweek({
  dagen,
  eerste,
  vandaag,
  gekozen,
  setGekozen,
  setWeek,
  groepen,
  bron,
  beeldVan,
}: {
  dagen: string[];
  eerste: string;
  vandaag: string;
  gekozen: string | null;
  setGekozen: (d: string | null) => void;
  setWeek: (d: string) => void;
  groepen: number[];
  bron: PlanningBron;
  beeldVan: (datum: string) => Dagbeeld;
}) {
  const weekStart = dagen[0];
  const weekEind = dagen[6];
  const balken = balkenVoorWeek(bron, weekStart, weekEind);
  const lanes = balken.reduce((m, b) => Math.max(m, b.lane + 1), 0);
  const reserve = lanes * (BALK_HOOGTE + BALK_GAP);

  return (
    <div className="relative">
      <div className="grid grid-cols-[2rem_repeat(7,minmax(0,1fr))] sm:grid-cols-[2.6rem_repeat(7,minmax(0,1fr))]">
        <button
          onClick={() => setWeek(weekStart)}
          aria-label={`Week ${weeknummer(weekStart)} bekijken`}
          className="flex min-h-[58px] items-start justify-center border-b border-r border-black/5 bg-cream/50 pt-2 text-xs font-bold tabular-nums text-ink/35 transition-colors hover:bg-cream hover:text-ink/70 sm:min-h-[92px]"
        >
          {weeknummer(weekStart)}
        </button>

        {dagen.map((datum, i) => {
          const beeld = beeldVan(datum);
          const dezeMaand = datum.slice(0, 7) === eerste.slice(0, 7);
          const isVandaag = datum === vandaag;
          const vakantie = beeld.vakantie;
          const eersteVakantiedag = vakantie && (vakantie.van === datum || beeld.weekdag === 0);
          // De balkjes hierboven tonen de meerdaagse afspraken al; hier dus
          // alleen de eendaagse, anders staat elke afspraak twee keer.
          const eendaags = beeld.items.filter((it) => it.totDatum <= it.datum);

          return (
            <button
              key={datum}
              onClick={() => setGekozen(gekozen === datum ? null : datum)}
              aria-label={`${volledig(datum)}${beeld.items.length ? `, ${beeld.items.length} afspraken` : ""}`}
              className={
                "min-h-[58px] border-b border-r border-black/5 p-1 text-left sm:min-h-[92px] sm:p-1.5 " +
                (i % 7 === 6 ? "border-r-0 " : "") +
                (!dezeMaand ? "opacity-35 " : "") +
                (gekozen === datum ? "ring-2 ring-inset ring-brand " : "") +
                // De startweek is geen vrije dag maar een werkweek: eigen
                // warme tint, niet het groen van "geen les". Daarna: groen
                // is vrij, en in een vakantie is het weekend dat ook.
                (beeld.startweek
                  ? "bg-accent-soft "
                  : beeld.vakantie || (beeld.vrij && !beeld.weekend)
                    ? "bg-brand-soft "
                    : beeld.weekend
                      ? "bg-cream/70 "
                      : "bg-white ")
              }
            >
              <span
                className={
                  "flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold tabular-nums " +
                  (isVandaag
                    ? "bg-brand-dark text-white"
                    : beeld.weekend
                      ? "text-ink/35"
                      : "text-ink/70")
                }
              >
                {Number(datum.slice(8, 10))}
              </span>

              {/* Ruimte voor de balkjes hierboven, zodat ze nooit over de
                  dagnummers of de labels hieronder heen vallen. */}
              {reserve > 0 && <div style={{ height: reserve }} />}

              {beeld.eersteSchooldag && dezeMaand && (
                <p className="mt-0.5 hidden truncate text-xs font-bold leading-tight text-amber-800 sm:block">
                  Eerste schooldag
                </p>
              )}
              {beeld.startweek && datum === bron.schooljaar.startweek.van && dezeMaand && (
                <p className="mt-0.5 hidden truncate text-xs font-bold leading-tight text-amber-800 sm:block">
                  Startweek
                </p>
              )}
              {eersteVakantiedag && dezeMaand && (
                <p className="mt-0.5 hidden truncate text-xs font-bold leading-tight text-brand-dark sm:block">
                  {vakantie.naam}
                </p>
              )}

              {/* Op een laptop de namen, op een telefoon stipjes: zeven
                  kolommen met tekst passen daar niet. */}
              <span className="mt-1 hidden flex-col gap-1 sm:flex">
                {eendaags.slice(0, 3).map((it) => (
                  <span
                    key={it.id}
                    title={
                      it.titel +
                      (it.begin ? `, ${it.begin}` : "") +
                      (zijkantLabel(it, groepen) ? ` (${zijkantLabel(it, groepen)})` : "")
                    }
                    className={
                      "truncate rounded-md px-1.5 py-0.5 text-xs font-bold leading-snug " +
                      ETIKET[it.soort].stijl +
                      // Waarschijnlijk niet van jou: blijft staan, maar rustiger.
                      (zijkantLabel(it, groepen) ? " opacity-50" : "")
                    }
                  >
                    {it.titel}
                  </span>
                ))}
                {eendaags.length > 3 && (
                  <span className="px-1.5 text-xs font-bold text-ink/45">
                    en nog {eendaags.length - 3}
                  </span>
                )}
              </span>
              <span className="mt-1 flex flex-wrap gap-1 sm:hidden">
                {eendaags.slice(0, 4).map((it) => (
                  <span key={it.id} className={"h-1.5 w-1.5 rounded-full " + STIP[it.soort]} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {lanes > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-8 grid grid-cols-[2rem_repeat(7,minmax(0,1fr))] gap-y-1 sm:top-9 sm:grid-cols-[2.6rem_repeat(7,minmax(0,1fr))]"
          style={{ gridTemplateRows: `repeat(${lanes}, ${BALK_HOOGTE}px)` }}
        >
          {balken.map((b) => (
            <button
              key={b.item.id}
              onClick={() => setGekozen(plus(weekStart, b.startCol))}
              title={
                b.item.titel +
                (zijkantLabel(b.item, groepen) ? ` (${zijkantLabel(b.item, groepen)})` : "")
              }
              className={
                "pointer-events-auto flex items-center truncate px-1.5 text-left text-[11px] font-bold leading-none sm:text-xs " +
                ETIKET[b.item.soort].stijl +
                (b.magStart ? " rounded-l-md" : "") +
                (b.magEind ? " rounded-r-md" : "") +
                (zijkantLabel(b.item, groepen) ? " opacity-50" : "")
              }
              style={{
                gridColumnStart: b.startCol + 2,
                gridColumnEnd: `span ${b.span}`,
                gridRowStart: b.lane + 1,
              }}
            >
              <span className="hidden truncate sm:inline">{b.item.titel}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


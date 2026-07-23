// "Wat speelt er op dag X?" — de enige vraag die Start, de Dag-laag en de
// Week-laag stellen. Antwoorden doen we hier, één keer, zonder database: je
// geeft de gegevens mee, je krijgt het beeld terug. Zo kan elk scherm hetzelfde
// tonen en kunnen we het los nakijken.

import { SOORT_INFO } from "../agenda-herken";
import { isWeekend, maandagVan, plus, weekdag, weeknummer } from "./datum";
import { periodeOp, vakantieOp } from "./schooljaar";
import type { Dagbeeld, PlanningBron, PlanItem, Weekbeeld } from "./types";

/** Hele dagen eerst, daarna op begintijd. */
function opTijd(a: PlanItem, b: PlanItem): number {
  if (a.heleDag !== b.heleDag) return a.heleDag ? -1 : 1;
  return (a.begin || "").localeCompare(b.begin || "");
}

/** Loopt deze afspraak over de gegeven dag heen? Meerdaagse afspraken tellen mee. */
function opDag(item: PlanItem, datum: string): boolean {
  return item.datum <= datum && datum <= (item.totDatum || item.datum);
}

export function dagbeeld(bron: PlanningBron, datum: string): Dagbeeld {
  const { schooljaar, periodes, items, blokken, taken } = bron;

  const items_ = items.filter((i) => !i.dubbelVan && opDag(i, datum)).sort(opTijd);
  const vakantie = vakantieOp(schooljaar, datum);
  const weekend = isWeekend(datum);
  const buitenSchooljaar = datum < schooljaar.start || datum > schooljaar.eind;
  // De startweek valt vóór de eerste schooldag (technisch nog vakantie), maar
  // is voor de leerkracht een werkweek. Alleen de werkdagen tellen mee.
  const startweek =
    !weekend && datum >= schooljaar.startweek.van && datum <= schooljaar.startweek.tot;

  // Een vrije dag uit de agenda (studiedag, margedag) telt net zo hard als een
  // vakantie: er is dan geen les, ook al staat er wel iets in je rooster.
  const vrijeDag = items_.find((i) => i.heleDag && SOORT_INFO[i.soort]?.vrij);

  const vrij = weekend || Boolean(vakantie) || Boolean(vrijeDag) || buitenSchooljaar;
  // Buiten het schooljaar is het altijd zomervakantie: die van vorig jaar loopt
  // door tot de eerste schooldag, die van dit jaar begint na de laatste.
  const vrijReden = weekend
    ? ("weekend" as const)
    : vakantie || buitenSchooljaar
      ? ("vakantie" as const)
      : vrijeDag
        ? ("vrije dag" as const)
        : undefined;

  return {
    datum,
    weekdag: weekdag(datum),
    weekend,
    vrij,
    vrijReden,
    vakantie,
    items: items_,
    blokken: vrij
      ? []
      : blokken
          .filter((b) => b.weekdag === weekdag(datum))
          .sort((a, b) => a.begin.localeCompare(b.begin)),
    taken: taken.filter((t) => t.deadline === datum),
    periode: periodeOp(periodes, datum),
    buitenSchooljaar,
    startweek,
  };
}

/** Dezelfde vraag, maar dan voor een hele week (maandag tot en met vrijdag). */
export function weekbeeld(bron: PlanningBron, datumInDeWeek: string): Weekbeeld {
  const maandag = maandagVan(datumInDeWeek);
  const dagen = [0, 1, 2, 3, 4].map((n) => dagbeeld(bron, plus(maandag, n)));
  return {
    maandag,
    weeknummer: weeknummer(maandag),
    dagen,
    periode: dagen.find((d) => d.periode)?.periode,
    // Fase 2 vult dit: een week wijkt af zodra je hem los van je basisrooster
    // hebt aangepast. Tot die tijd is elke week gewoon je basisrooster.
    afwijkend: false,
  };
}

/**
 * De eerstvolgende dag waarop echt iets gebeurt, vanaf een datum. Handig voor
 * Start: is het weekend of vakantie, dan laten we zien wanneer je weer begint.
 */
export function volgendeSchooldag(bron: PlanningBron, vanaf: string, maxDagen = 60): string | null {
  for (let n = 0; n < maxDagen; n++) {
    const d = plus(vanaf, n);
    if (d > bron.schooljaar.eind) return null;
    if (!dagbeeld(bron, d).vrij) return d;
  }
  return null;
}

/** Alles wat er de komende dagen aankomt, op volgorde. Voor de vooruitblik. */
export function komendeItems(bron: PlanningBron, vanaf: string, dagen = 28): PlanItem[] {
  const tot = plus(vanaf, dagen);
  return bron.items
    .filter((i) => !i.dubbelVan && (i.totDatum || i.datum) >= vanaf && i.datum <= tot)
    .sort((a, b) => a.datum.localeCompare(b.datum) || opTijd(a, b));
}

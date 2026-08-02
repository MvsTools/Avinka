// De vakanties van JOUW school gaan boven de landelijke lijst.
//
// Scholen mogen afwijken van de adviesdata van de Rijksoverheid, en dat doen ze
// ook: een tweede meiweek, een eigen studieweek, een herfstvakantie die een dag
// eerder begint. Zodra de gekoppelde schoolagenda een vakantie noemt, is die
// dus leidend. De landelijke lijst blijft alleen staan voor wat de school zelf
// niet in de agenda heeft gezet.
//
// Weegprincipe bij twijfel: liever een schooldag te veel dan een vakantiedag te
// veel. "Vrij" op een dag dat je voor de klas staat is een veel vervelendere
// fout dan andersom, dus bij een korte of halve vermelding vullen we aan in
// plaats van te vervangen.

import { plus } from "./datum";
import type { PlanItem, Schooljaar } from "./types";
import type { Vakantie } from "./vakanties";

/** Een vermelding van minstens zoveel dagen zien we als de hele vakantie. */
const VOLWAARDIG = 3;

/** Uit "Herfstvakantie groep 1 t/m 8" halen we de soort: herfst. */
function soortUitNaam(naam: string): string | undefined {
  const t = naam.toLowerCase();
  if (/herfst/.test(t)) return "herfst";
  if (/kerst|winter/.test(t)) return "kerst";
  if (/voorjaar|krokus|carnaval/.test(t)) return "voorjaar";
  if (/mei|hemelvaart|pinkster/.test(t)) return "mei";
  if (/zomer/.test(t)) return "zomer";
  return undefined;
}

/** "Herfstvakantie groep 1 t/m 8" wordt weer gewoon "Herfstvakantie". */
function netterNaam(titel: string): string {
  const schoon = titel
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\s*(groep|gr\.?)\s*[\d\s/t&m-]+$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return schoon.charAt(0).toUpperCase() + schoon.slice(1) || titel;
}

/**
 * Vakanties uit de agenda halen. Scholen zetten er soms losse dagen in ("Vrij:
 * herfstvakantie" per dag), dus wat aan elkaar grenst plakken we weer aan
 * elkaar tot één vakantie.
 */
export function vakantiesUitAgenda(items: PlanItem[]): Vakantie[] {
  const ruw = items
    .filter((i) => !i.dubbelVan && i.soort === "vakantie")
    .map((i) => ({
      naam: netterNaam(i.titel),
      kort: soortUitNaam(i.titel) ?? "eigen",
      van: i.datum,
      tot: i.totDatum || i.datum,
    }))
    .sort((a, b) => a.van.localeCompare(b.van));

  const uit: Vakantie[] = [];
  for (const v of ruw) {
    const vorige = uit[uit.length - 1];
    // Aan elkaar vast of overlappend, en van dezelfde soort? Dan is het er één.
    // Een weekend ertussen telt ook als aaneengesloten.
    const aansluitend = vorige && v.van <= plus(vorige.tot, 3) && vorige.kort === v.kort;
    if (aansluitend) {
      vorige.tot = v.tot > vorige.tot ? v.tot : vorige.tot;
      if (v.naam.length < vorige.naam.length) vorige.naam = v.naam;
    } else {
      uit.push({ ...v });
    }
  }
  return uit;
}

/**
 * De landelijke lijst en de eigen schoolagenda samenvoegen tot één waarheid.
 *
 * Drie gevallen, en het verschil ertussen is belangrijk:
 *
 * 1. **De agenda overlapt de landelijke vakantie** (school schuift hem op).
 *    Dan wint de agenda helemaal. Voorbeeld: landelijk 17 t/m 25 oktober, jouw
 *    school 10 t/m 18 oktober. Zou je die samenvoegen, dan stond 19 t/m 25
 *    oktober onterecht als vakantie terwijl je gewoon voor de klas staat.
 * 2. **De agenda sluit erop aan** (school plakt er een week aan vast, zoals een
 *    tweede meiweek). Dan is het samen één langere vakantie. Vervangen zou de
 *    échte meivakantie wegpoetsen.
 * 3. **De agenda staat er los van.** Dan zijn het twee verschillende vakanties
 *    en blijven ze allebei staan.
 *
 * Is de vermelding in de agenda maar een dag of twee, dan is het waarschijnlijk
 * een flard (alleen de eerste dag genoteerd). We houden dan allebei aan, zodat
 * er nooit een vakantiedag wegvalt.
 */
export function combineerVakanties(landelijk: Vakantie[], uitAgenda: Vakantie[]): Vakantie[] {
  const uit: Vakantie[] = [];
  const gebruikt = new Set<Vakantie>();

  for (const l of landelijk) {
    const zelfdeSoort = uitAgenda.filter((e) => e.kort === l.kort);
    const overlappend = zelfdeSoort.filter((e) => e.van <= l.tot && e.tot >= l.van);
    const aansluitend = zelfdeSoort.filter(
      (e) => !overlappend.includes(e) && e.van <= plus(l.tot, 3) && plus(e.tot, 3) >= l.van,
    );

    if (!overlappend.length && !aansluitend.length) {
      uit.push(l); // niets over te zeggen in de agenda: het vangnet blijft staan
      continue;
    }

    let van: string;
    let tot: string;
    let naam: string;

    if (overlappend.length) {
      const dagen = overlappend.reduce((n, e) => n + tel(e.van, e.tot), 0);
      van = overlappend.map((e) => e.van).sort()[0];
      tot = overlappend.map((e) => e.tot).sort().at(-1) as string;
      naam = overlappend[0].naam || l.naam;
      if (dagen < VOLWAARDIG) {
        // Te kort om de hele vakantie te zijn: aanvullen in plaats van vervangen.
        van = van < l.van ? van : l.van;
        tot = tot > l.tot ? tot : l.tot;
        naam = l.naam;
      }
    } else {
      van = l.van;
      tot = l.tot;
      naam = l.naam;
    }

    // Wat eraan vastzit hoort erbij (de tweede meiweek van jouw school).
    for (const e of aansluitend) {
      if (e.van < van) van = e.van;
      if (e.tot > tot) tot = e.tot;
    }

    [...overlappend, ...aansluitend].forEach((e) => gebruikt.add(e));
    uit.push({ naam, kort: l.kort, van, tot });
  }

  for (const e of uitAgenda) if (!gebruikt.has(e)) uit.push(e);

  return uit.sort((a, b) => a.van.localeCompare(b.van));
}

function tel(van: string, tot: string): number {
  return Math.round((Date.parse(tot + "T12:00:00Z") - Date.parse(van + "T12:00:00Z")) / 86400000) + 1;
}

/**
 * Het schooljaar bijwerken met de vakanties van je eigen school. De eerste en
 * laatste schooldag schuiven mee: begint jouw zomervakantie eerder, dan is jouw
 * laatste schooldag ook eerder.
 */
export function metEigenVakanties(jaar: Schooljaar, items: PlanItem[]): Schooljaar {
  const uitAgenda = vakantiesUitAgenda(items);
  if (!uitAgenda.length) return jaar;

  const vakanties = combineerVakanties(jaar.vakanties, uitAgenda);
  const zomer = vakanties.filter((v) => v.kort === "zomer").sort((a, b) => a.van.localeCompare(b.van));
  // De zomervakantie die het schooljaar afsluit, is die na de eerste schooldag.
  const slot = zomer.find((v) => v.van > jaar.start);

  return {
    ...jaar,
    vakanties,
    eind: slot ? plus(slot.van, -1) : jaar.eind,
  };
}

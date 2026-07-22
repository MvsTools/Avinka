// Herkennen wat een afspraak uit een schoolagenda eigenlijk is.
//
// KERNPRINCIPE (zelfde lijn als de werkbladenmotor): dit doet de CODE, niet de
// AI. Een woordenlijst is voorspelbaar, gratis en uit te leggen. Wat we niet
// herkennen verzinnen we niet: dat blijft gewoon staan zoals de school het
// heeft opgeschreven.

import type { IcsAfspraak } from "./ics";

export type Soort =
  | "vakantie"
  | "vrij"
  | "rapport"
  | "gesprek"
  | "vergadering"
  | "toets"
  | "activiteit"
  | "overig";

/** Op volgorde: de eerste die past wint. Specifiek staat dus boven algemeen. */
const REGELS: { soort: Soort; woorden: RegExp }[] = [
  { soort: "vakantie", woorden: /vakantie|kerstreces|zomerreces/i },
  {
    soort: "vrij",
    woorden:
      /studiedag|marge ?dag|margedag|studiemiddag|lesvrij|leerlingen ?vrij|kinderen ?vrij|vrije dag|alle groepen vrij|roostervrij/i,
  },
  { soort: "rapport", woorden: /rapport|portfolio ?mee|rapportfolio/i },
  {
    soort: "gesprek",
    woorden:
      /gesprek|10 ?minuten|tien ?minuten|contactavond|spreekavond|ouderavond|kennismakingsavond|startgesprek|voortgangsgesprek|adviesgesprek/i,
  },
  {
    soort: "vergadering",
    woorden: /vergader|overleg|bouwbijeenkomst|teambijeenkomst|studiebijeenkomst|mt-|bordsessie/i,
  },
  { soort: "toets", woorden: /toets|cito|iep|entree|eindtoets|doorstroomtoets|dictee/i },
  {
    soort: "activiteit",
    woorden:
      /schoolreis|schoolkamp|kamp|excursie|musical|viering|feest|sportdag|koningsspelen|open ?dag|open ?huis|juffendag|meesterdag|voorleesontbijt|kerst|sint|paas|carnaval|avondvierdaagse|schoolfotograaf|luizen|boekenweek|bezoek|museum|voorstelling|theater|workshop|project ?(week|afsluiting)|presentatie|informatieavond|inloop(ochtend|middag)?/i,
  },
];

export function herken(titel: string): Soort {
  for (const r of REGELS) if (r.woorden.test(titel)) return r.soort;
  return "overig";
}

export const SOORT_INFO: Record<
  Soort,
  { woord: string; meervoud: string; vrij: boolean; tool?: string }
> = {
  vakantie: { woord: "Vakantie", meervoud: "vakanties", vrij: true },
  vrij: { woord: "Vrije dag", meervoud: "vrije dagen", vrij: true },
  rapport: { woord: "Rapporten", meervoud: "rapportmomenten", vrij: false, tool: "rapporten" },
  gesprek: {
    woord: "Gesprekken",
    meervoud: "dagen met gesprekken",
    vrij: false,
    tool: "oudercontact",
  },
  vergadering: { woord: "Vergadering", meervoud: "vergaderingen", vrij: false },
  toets: { woord: "Toetsen", meervoud: "toetsmomenten", vrij: false, tool: "toetsanalyse" },
  activiteit: { woord: "Activiteit", meervoud: "activiteiten", vrij: false, tool: "draaiboek" },
  overig: { woord: "Afspraak", meervoud: "overige afspraken", vrij: false },
};

export type HerkendeAfspraak = IcsAfspraak & { soort: Soort };

export function herkenAlles(afspraken: IcsAfspraak[]): HerkendeAfspraak[] {
  return afspraken.map((a) => ({ ...a, soort: herken(a.titel) }));
}

export type Groep = {
  soort: Soort;
  titel: string;
  van: string;
  tot: string;
  heleDag: boolean;
  begin?: string;
  eind?: string;
  /** Meer dan 1 als losse tijdvakken zijn samengevouwen. */
  aantal: number;
};

/**
 * Oudergesprekken staan in een schoolagenda als tientallen losse tijdvakken
 * van tien minuten. Ongefilterd overnemen zou de planning onleesbaar maken,
 * dus per dag vouwen we ze samen tot één blok van begin tot eind.
 */
export function vouwSamen(afspraken: HerkendeAfspraak[]): Groep[] {
  const uit: Groep[] = [];
  const bakken = new Map<string, HerkendeAfspraak[]>();

  for (const a of afspraken) {
    const vouwbaar = a.soort === "gesprek" && !a.heleDag;
    if (!vouwbaar) {
      uit.push({
        soort: a.soort,
        titel: a.titel,
        van: a.van,
        tot: a.tot,
        heleDag: a.heleDag,
        begin: a.begin,
        eind: a.eind,
        aantal: 1,
      });
      continue;
    }
    const sleutel = `${a.van}|${a.soort}`;
    const lijst = bakken.get(sleutel);
    if (lijst) lijst.push(a);
    else bakken.set(sleutel, [a]);
  }

  for (const [, lijst] of bakken) {
    const begin = lijst.map((a) => a.begin || "").sort()[0];
    const eind = lijst.map((a) => a.eind || a.begin || "").sort().reverse()[0];
    // De kortste titel is meestal de algemene ("Oudergesprekken" in plaats van
    // "Oudergesprek 18:20"), en die willen we tonen.
    const titel = lijst.map((a) => a.titel).sort((x, y) => x.length - y.length)[0];
    uit.push({
      soort: lijst[0].soort,
      titel: lijst.length > 1 ? titel.replace(/\s*\d{1,2}[:.]\d{2}.*$/, "") : titel,
      van: lijst[0].van,
      tot: lijst[0].van,
      heleDag: false,
      begin,
      eind,
      aantal: lijst.length,
    });
  }

  uit.sort((a, b) => a.van.localeCompare(b.van) || (a.begin || "").localeCompare(b.begin || ""));
  return uit;
}

/** Korte samenvatting voor het koppelscherm: "7 studiedagen, 3 keer rapporten". */
export function tel(groepen: Groep[]): { soort: Soort; aantal: number; slots?: number }[] {
  const per = new Map<Soort, { aantal: number; slots: number }>();
  for (const g of groepen) {
    const b = per.get(g.soort) || { aantal: 0, slots: 0 };
    b.aantal++;
    b.slots += g.aantal;
    per.set(g.soort, b);
  }
  return [...per.entries()]
    .map(([soort, b]) => ({ soort, aantal: b.aantal, slots: b.slots > b.aantal ? b.slots : undefined }))
    .sort((a, b) => b.aantal - a.aantal);
}

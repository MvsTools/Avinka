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
      /studiedag|marge ?dag|margedag|studiemiddag|lesvrij|leerlingen ?vrij|kinderen ?vrij|vrije dag|alle groepen vrij|roostervrij|hemelvaart|pinksteren|goede vrijdag/i,
  },
  {
    // Staat vóór "rapport": "Rapportgesprek" en "Rapportavond" gaan over de
    // GESPREKKEN plannen, niet over het rapport schrijven — allebei bevatten
    // "rapport", maar de bedoeling (en dus het seintje) is een andere.
    soort: "gesprek",
    woorden:
      /gesprek|10 ?minuten|tien ?minuten|contactavond|spreekavond|ouderavond|kennismakingsavond|startgesprek|voortgangsgesprek|adviesgesprek|driehoeksgesprek|kindgesprek|eindgesprek|rapportavond|voortgangsavond|informatiegesprek/i,
  },
  { soort: "rapport", woorden: /rapport|portfolio ?mee|rapportfolio|cijferlijst/i },
  {
    soort: "vergadering",
    woorden:
      /vergader|overleg|bouwbijeenkomst|teambijeenkomst|studiebijeenkomst|mt-|bordsessie|\bmr\b|medezeggenschapsraad|\bgmr\b|ouderraad/i,
  },
  {
    // Staat vóór "toets": "Verkeerstoets" bevat het woord "toets", maar is
    // qua voorbereiding (vrijwilligers langs het parcours) een activiteit,
    // geen toets die je moet analyseren. Zie ook de opmerking bij "activiteit".
    soort: "activiteit",
    // Bewust breed: dit is de opvangbak voor alles wat er in een basisschooljaar
    // gebeurt en geen les, toets, gesprek of vrije dag is — van Sinterklaas tot
    // het verkeersexamen. Mist er iets, dan valt het gewoon terug op "Afspraak".
    // Welke van deze onderwerpen ook een seintje/taak krijgen, staat NIET hier
    // maar in aanleiding.ts (ACTIVITEIT_ONDERWERP) — dit bestand herkent alleen
    // wát iets is, niet wat we ermee doen.
    //
    // Bewust met meerdere namen voor hetzelfde: scholen noemen niet allemaal
    // hetzelfde ding hetzelfde. Het verkeersexamen heet ook verkeerstoets,
    // fietsexamen, of theoretisch/praktisch examen verkeer; een schoolkamp
    // ook een kampweek; de avondvierdaagse ook wandelvierdaagse of 4-daagse;
    // een sportdag ook een sport- en speldag, sporttoernooi of sportinstuif;
    // een schoolreis ook een uitstapje; Sinterklaas voor de bovenbouw draait
    // om de surprise; luizencontrole heet ook (hoofd)luis, niet alleen luizen.
    woorden:
      /schoolreis|schoolkamp|kampweek|\bkamp\b|excursie|uitstapje|musical|viering|feest|sportdag|speldag|sporttoernooi|sportinstuif|koningsspelen|koningsontbijt|open ?dag|open ?huis|juffendag|meesterdag|voorleesontbijt|kerst|sinterklaas|sint\b|pakjesavond|schoen ?zetten|intocht|surprise|paas|pasen|sint ?maarten|lampion|carnaval|avondvierdaagse|wandelvierdaagse|4-?daagse|schoolfoto|fotograaf|luizen|hoofdluis|boekenweek|voorleeswedstrijd|bezoek|museum|voorstelling|theater|workshop|project ?(week|afsluiting)|presentatie|informatieavond|inloop(ochtend|middag)?|verkeers(examen|toets|proef)|fietsexamen|(theoretisch|praktisch|theorie|praktijk) ?-? ?examen verkeer|zwem(les|men)|schaatsen|survival|lentekriebels|dodenherdenking|bevrijdingsdag|diploma|afscheid|suikerfeest|offerfeest|halloween|sponsorloop|schoolontbijt|wandelen voor water|buitenlesdag|disco|wendag|wenmiddag|wenmoment|kinderpostzegels/i,
  },
  {
    soort: "toets",
    woorden:
      /toets|cito|iep|entree|eindtoets|doorstroomtoets|dictee|avi|dmt|nio|drempelonderzoek|screening/i,
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
  // "Geen les" en niet "vrije dag": een studiedag is vrij voor de kinderen,
  // maar voor de leerkracht een werkdag.
  vrij: { woord: "Geen les", meervoud: "dagen zonder les", vrij: true },
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

/** Het weeknummer zoals scholen het gebruiken, plus het jaar (ISO). */
function weekSleutel(datum: string): string {
  const d = new Date(datum + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + 3);
  const eerste = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  eerste.setUTCDate(eerste.getUTCDate() - ((eerste.getUTCDay() + 6) % 7) + 3);
  return `${d.getUTCFullYear()}-${1 + Math.round((d.getTime() - eerste.getTime()) / 604800000)}`;
}

/**
 * Korte samenvatting voor het koppelscherm. `weken` telt over hoeveel
 * schoolweken iets verspreid staat: gesprekken staan vaak op veel losse
 * dagen (zeker als je meer dan één groep hebt), maar in maar een paar weken.
 */
export function tel(
  groepen: Groep[],
): { soort: Soort; aantal: number; slots?: number; weken?: number }[] {
  const per = new Map<Soort, { aantal: number; slots: number; weken: Set<string> }>();
  for (const g of groepen) {
    const b = per.get(g.soort) || { aantal: 0, slots: 0, weken: new Set<string>() };
    b.aantal++;
    b.slots += g.aantal;
    b.weken.add(weekSleutel(g.van));
    per.set(g.soort, b);
  }
  return [...per.entries()]
    .map(([soort, b]) => ({
      soort,
      aantal: b.aantal,
      slots: b.slots > b.aantal ? b.slots : undefined,
      weken: b.weken.size < b.aantal ? b.weken.size : undefined,
    }))
    .sort((a, b) => b.aantal - a.aantal);
}

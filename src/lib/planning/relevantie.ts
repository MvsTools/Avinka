// Wat in een schoolagenda gaat eigenlijk over JOU?
//
// Een gedeelde schoolagenda (Parro, Social Schools) is geschreven voor ouders
// en voor de hele school. Voor een leerkracht van groep 6 staat er dus veel in
// dat niet van hem is: de rapportgesprekken van groep 7, en oproepen als
// "chauffeurs gezocht" of "wie helpt met het decor".
//
// We gooien nooit iets weg. We zetten het opzij, met een knop om het alsnog te
// laten zien. Wat we niet zeker weten laten we gewoon staan: liever iets te
// veel tonen dan iets verbergen dat wél van jou was.

import type { PlanItem } from "./types";

/**
 * Welke groepen noemt deze titel? Geeft null als er geen groep in staat; dan is
 * het schoolbreed en dus altijd voor jou.
 *
 * Snapt "groep 6", "gr. 6", "groep 1/2", "groep 3,4,5 en 6" en "groep 1 t/m 8".
 */
export function groepenUitTitel(titel: string): number[] | null {
  const treffer = /\b(?:groep(?:en)?|gr\.?)\s*([\d]+(?:\s*(?:[\/,&+-]|t\/m|tot en met|tot|en)\s*\d+)*)/i.exec(
    titel,
  );
  if (!treffer) return null;

  const stuk = treffer[1];
  const reeks = /\b(\d)\s*(?:-|t\/m|tot en met|tot)\s*(\d)\b/i.exec(stuk);
  if (reeks) {
    const van = Number(reeks[1]);
    const tot = Number(reeks[2]);
    if (van <= tot) {
      const uit: number[] = [];
      for (let n = van; n <= tot; n++) uit.push(n);
      return uit;
    }
  }

  const nummers = (stuk.match(/\d/g) ?? []).map(Number).filter((n) => n >= 1 && n <= 8);
  return nummers.length ? [...new Set(nummers)] : null;
}

/**
 * Is dit een oproep aan ouders in plaats van een afspraak voor de leerkracht?
 * Denk aan rijouders, hulpouders en meefietsers.
 *
 * De activiteit zelf ("Schoolreis", "Bezoek Paleis het Loo") blijft gewoon
 * staan; alleen de oproep eromheen gaat opzij.
 */
export function isOuderoproep(titel: string): boolean {
  const t = titel.toLowerCase();
  return (
    /hulp\b|hulpouder|wie helpt|gezocht|chauffeur|meefiets|meerijden|\brijden\b|\bmee naar\b|brengen\s*\/?\s*halen|begeleider/.test(
      t,
    ) && !/hulpmiddel/.test(t)
  );
}

/**
 * Jouw eigen groep uit de instellingen. Daar staat vrije tekst in: "Groep 7",
 * "7", "1/2", of niets. We halen er de nummers uit; lukt dat niet, dan filteren
 * we niet (want dan weten we het gewoon niet).
 */
export function mijnGroepen(instelling: string | null | undefined): number[] {
  const tekst = String(instelling ?? "").trim();
  if (!tekst) return [];
  return groepenUitTitel(/^\s*\d/.test(tekst) ? `groep ${tekst}` : tekst) ?? [];
}

export type Relevantie = {
  /** Hoort bij een andere groep dan die van jou. */
  andereGroep: boolean;
  /** Een oproep aan ouders. */
  ouderoproep: boolean;
};

export function beoordeel(item: PlanItem, eigenGroepen: number[] = []): Relevantie {
  const groepen = groepenUitTitel(item.titel);
  return {
    // Zonder groepsnummer is het schoolbreed, en zonder ingestelde eigen groep
    // weten we niets: allebei laten staan.
    andereGroep: Boolean(
      eigenGroepen.length && groepen && !groepen.some((g) => eigenGroepen.includes(g)),
    ),
    ouderoproep: isOuderoproep(item.titel),
  };
}

/**
 * Het merkje bij een afspraak die waarschijnlijk niet van jou is: "groep 8" of
 * "voor ouders". Geeft null als het gewoon van jou is.
 *
 * WAAROM MERKEN EN NIET VERBERGEN: bij groep 8 hoort soms iets waar de hele
 * school bij is (de musical, het uitzwaaien). "Oh, hier hoef ik niets mee" is
 * een prima ervaring; "dat heb ik gemist, het stond niet in mijn agenda" is dat
 * niet. Dus laten we het staan, alleen rustiger.
 */
export function zijkantLabel(item: PlanItem, eigenGroepen: number[] = []): string | null {
  if (item.soort === "vakantie" || item.soort === "vrij") return null;
  const oordeel = beoordeel(item, eigenGroepen);
  if (oordeel.andereGroep) {
    const groepen = groepenUitTitel(item.titel) ?? [];
    return groepen.length === 1 ? `groep ${groepen[0]}` : "andere groepen";
  }
  return oordeel.ouderoproep ? "voor ouders" : null;
}

/**
 * De afspraken die over jou gaan, plus hoeveel er opzij zijn gezet en waarom.
 * Alleen voor wie zelf kiest om strak te filteren; standaard tonen we alles.
 * Vakanties en vrije dagen blijven sowieso staan: die gelden voor iedereen.
 */
export function filterVoorMij(
  items: PlanItem[],
  eigenGroepen: number[] = [],
): { voorMij: PlanItem[]; andereGroep: number; ouderoproep: number } {
  let andereGroep = 0;
  let ouderoproep = 0;
  const voorMij: PlanItem[] = [];

  for (const item of items) {
    if (item.soort === "vakantie" || item.soort === "vrij") {
      voorMij.push(item);
      continue;
    }
    const oordeel = beoordeel(item, eigenGroepen);
    if (oordeel.andereGroep) andereGroep++;
    else if (oordeel.ouderoproep) ouderoproep++;
    else voorMij.push(item);
  }

  return { voorMij, andereGroep, ouderoproep };
}

// Dezelfde afspraak uit twee agenda's: één keer tonen.
//
// Wie zowel de schoolagenda als zijn eigen agenda koppelt, krijgt de studiedag
// twee keer binnen. Binnen één agenda vangen we dat al af in de database; hier
// gaat het om dubbelingen TUSSEN agenda's.
//
// KERNREGEL: nooit weggooien, wel verbergen. We zetten een verwijzing op de
// dubbel (dubbelVan) en laten hem staan. Koppelt de leerkracht later één van de
// twee agenda's los, dan blijft de afspraak gewoon bestaan via de andere. Zo
// verlies je nooit iets, ook niet per ongeluk.

import type { PlanItem } from "./types";

/** Woorden die niets zeggen over wélke afspraak het is. */
const RUIS =
  /\b(kopie|copy|herhaling|groep(en)?|gr|klas|alle|school|schoolbreed|def|definitief|concept|nieuw|gewijzigd)\b/g;

/**
 * Titels vergelijkbaar maken. "Studiedag (alle groepen vrij)" en "Studiedag
 * groep 1 t/m 8" moeten allebei op "studiedag" uitkomen.
 */
export function normaliseer(titel: string): string {
  return titel
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accenten eraf
    .replace(/[^a-z0-9\s]/g, " ") // leestekens eruit
    .replace(RUIS, " ")
    .replace(/\b\d+\b/g, " ") // losse getallen (groepsnummers, jaartallen)
    // Losse letters zeggen niets. Ze blijven over uit dingen als "t/m" en
    // "gr. a", en zonder deze regel lijkt "studiedag t m" niet meer op
    // "studiedag" terwijl het over hetzelfde gaat.
    .replace(/\b[a-z]\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Lijken twee titels genoeg op elkaar om dezelfde afspraak te zijn? */
function zelfdeTitel(a: string, b: string): boolean {
  const x = normaliseer(a);
  const y = normaliseer(b);
  if (!x || !y) return false;
  if (x === y) return true;
  // De ene agenda schrijft het uitgebreider dan de andere.
  const kort = x.length < y.length ? x : y;
  const lang = x.length < y.length ? y : x;
  return kort.length >= 5 && lang.includes(kort);
}

/**
 * Twee afspraken zijn dezelfde als ze op dezelfde dag(en) vallen en hetzelfde
 * heten. Staat er in de ene agenda een tijd bij en in de andere niet, dan is
 * het nog steeds dezelfde afspraak: de ene school zet de studiedag als hele dag
 * neer, de andere van 08:30 tot 15:00.
 *
 * Staan er in állebei tijden en verschillen die, dan laten we ze staan. Twee
 * gespreksavonden op dezelfde dag zijn echt twee avonden.
 */
function zelfdeAfspraak(a: PlanItem, b: PlanItem): boolean {
  if (a.datum !== b.datum || a.totDatum !== b.totDatum) return false;
  if (!a.heleDag && !b.heleDag && (a.begin || "") !== (b.begin || "")) return false;
  return zelfdeTitel(a.titel, b.titel);
}

/**
 * Dubbelingen aanwijzen. `volgorde` is de volgorde waarin de agenda's zijn
 * gekoppeld: de eerste is de hoofdagenda en die wint. Wat daarna komt wordt
 * als dubbel gemarkeerd.
 *
 * Afspraken uit dezelfde agenda laten we met rust: een school die twee keer
 * "Teamvergadering" op één dag zet, bedoelt dat waarschijnlijk ook.
 */
export function markeerDubbelingen(items: PlanItem[], volgorde: string[] = []): PlanItem[] {
  const rang = (bronId: string) => {
    const n = volgorde.indexOf(bronId);
    return n === -1 ? volgorde.length : n;
  };

  // Per dag vergelijken; buiten een dag kan er niets dubbel zijn.
  const perDag = new Map<string, PlanItem[]>();
  const uit = items.map((i) => ({ ...i, dubbelVan: undefined as string | undefined }));

  for (const item of uit) {
    const lijst = perDag.get(item.datum);
    if (lijst) lijst.push(item);
    else perDag.set(item.datum, [item]);
  }

  for (const lijst of perDag.values()) {
    if (lijst.length < 2) continue;
    // De hoofdagenda eerst, zodat die het origineel levert.
    const opRang = [...lijst].sort((a, b) => rang(a.bronId) - rang(b.bronId));
    for (let i = 0; i < opRang.length; i++) {
      const origineel = opRang[i];
      if (origineel.dubbelVan) continue;
      for (let j = i + 1; j < opRang.length; j++) {
        const kandidaat = opRang[j];
        if (kandidaat.dubbelVan) continue;
        if (kandidaat.bronId === origineel.bronId) continue;
        if (zelfdeAfspraak(origineel, kandidaat)) kandidaat.dubbelVan = origineel.id;
      }
    }
  }

  return uit;
}

/** Hoeveel afspraken zijn er samengevoegd? Voor de uitleg op het scherm. */
export function telDubbelingen(items: PlanItem[]): number {
  return items.filter((i) => i.dubbelVan).length;
}

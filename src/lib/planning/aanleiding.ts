// "De agenda zegt wanneer je welke tool nodig hebt" (fase 4).
//
// Uit een herkende afspraak volgt een AANLEIDING: een reden om nu iets te gaan
// doen, met de datum erbij en de tool die erbij hoort. Over drie weken gaan de
// rapporten mee, dus je wilt nu beginnen — dat is de hele gedachte achter Mijn
// schooljaar: de leerkracht hoeft niet zelf te bedenken wat eraan komt.
//
// KERNPRINCIPE, net als bij het herkennen zelf: dit doet de CODE, niet de AI.
// Een venster van drie weken is uit te leggen, kost niets en geeft elke keer
// hetzelfde antwoord.
//
// DRIE DINGEN DIE HIER BEWUST NIET GEBEUREN:
// 1. Geen signaal naar een tool die niet op het dashboard staat. `tools.ts` is
//    de baas: staat de draaiboek-tool er niet in, dan is er geen knop naar toe.
//    Anders bouw je een verwijzing naar een scherm dat nog niet bestaat.
// 2. Geen signaal over de afspraken van een andere groep of over oproepen aan
//    ouders. Daar is `relevantie.ts` al voor, en die maatstaf hoort hier net zo
//    hard te gelden: "over 3 weken gaan de rapporten mee" is onzin als het de
//    rapporten van groep 8 zijn en jij groep 5 hebt.
// 3. Nooit twee signalen van dezelfde soort. Een gespreksavond staat vaak als
//    drie losse avonden in de agenda; dat is één aanleiding, niet drie.

import { SOORT_INFO } from "../agenda-herken";
import { toolBySlug, type Tool } from "../tools";
import { bereikTekst, dagnaam, kort, verschil } from "./datum";
import { beoordeel } from "./relevantie";
import type { PlanItem, PlanningBron, Soort } from "./types";

/**
 * Hoeveel dagen vóór een afspraak het signaal verschijnt, en hoeveel dagen het
 * daarna nog blijft staan.
 *
 * De vensters komen uit het plan (§4) en volgen hoe het werk echt loopt:
 * rapporten schrijf je over een paar weken verdeeld, een draaiboek voor een
 * schoolreis begin je ruim van tevoren, en een toets analyseer je pas als hij
 * gemaakt is — dus die staat als enige NA de datum.
 */
const VENSTER: Partial<Record<Soort, { voor: number; na: number }>> = {
  rapport: { voor: 21, na: 0 },
  gesprek: { voor: 14, na: 0 },
  activiteit: { voor: 42, na: 0 },
  toets: { voor: 0, na: 10 },
};

/** Wat je gaat doen — dit komt op de knop. */
const ACTIE: Partial<Record<Soort, string>> = {
  rapport: "Rapporten schrijven",
  gesprek: "Gesprekken voorbereiden",
  toets: "Toetsen analyseren",
  activiteit: "Draaiboek maken",
};

export type Aanleiding = {
  /** Van het agenda-item, dus stabiel tussen twee keer laden. */
  id: string;
  item: PlanItem;
  soort: Soort;
  /** De tool die erbij hoort. Staat altijd in `tools.ts` en heeft altijd een pad. */
  tool: Tool;
  /** Dagen tot de afspraak: 3 = over drie dagen, 0 = vandaag, -2 = eergisteren. */
  dagen: number;
  /** "Over 3 weken gaan de rapporten mee" */
  kop: string;
  /** "vrijdag 28 augustus", of "3 t/m 4 augustus" bij een meerdaagse afspraak. */
  wanneer: string;
  /**
   * De afspraak zoals de school hem opschreef — maar alleen als die iets
   * toevoegt. Bij een rapport of een gespreksavond zegt de kop het al ("gaan de
   * rapporten mee" naast "Rapporten mee naar huis" is twee keer hetzelfde); bij
   * een toets staat er juist in wélke toets het was.
   */
  detail?: string;
  /** "Rapporten schrijven" */
  actie: string;
};

/**
 * Hoe lang nog, in gewone taal. Vanaf een week rekenen we in weken, want
 * "over 9 dagen" is een getal waar niemand iets mee doet. Zelfde afronding als
 * de vakantieteller op Start, zodat de twee elkaar nooit tegenspreken.
 */
export function wanneerTekst(dagen: number): string {
  if (dagen <= 0) return "Vandaag";
  if (dagen === 1) return "Morgen";
  if (dagen < 7) return `Over ${dagen} dagen`;
  const weken = Math.round(dagen / 7);
  return weken === 1 ? "Over een week" : `Over ${weken} weken`;
}

/** De zin die bovenaan het signaal staat. */
function kopVoor(item: PlanItem, soort: Soort, dagen: number): string {
  const wanneer = wanneerTekst(dagen);
  switch (soort) {
    case "rapport":
      return `${wanneer} gaan de rapporten mee`;
    case "gesprek":
      return `${wanneer} zijn de oudergesprekken`;
    case "toets":
      // Dit venster begint pas op de dag zelf: de toets moet gemaakt zijn
      // voordat er iets te analyseren valt.
      return dagen === 0 ? "De toetsen zijn vandaag" : "De toetsen zijn net geweest";
    default:
      return `${wanneer}: ${item.titel}`;
  }
}

/**
 * Alles wat er de komende tijd aankomt en waar een tool bij hoort, het
 * dichtstbijzijnde eerst. Wat nu speelt of net geweest is staat bovenaan.
 *
 * `eigenGroepen` komt uit je instellingen (zie `mijnGroepen`); zonder die
 * informatie filteren we niet, want dan weten we het gewoon niet.
 */
export function aanleidingen(
  bron: PlanningBron,
  vandaag: string,
  eigenGroepen: number[] = [],
): Aanleiding[] {
  const gevonden: Aanleiding[] = [];

  for (const item of bron.items) {
    if (item.dubbelVan) continue;

    const venster = VENSTER[item.soort];
    if (!venster) continue;

    const slug = SOORT_INFO[item.soort]?.tool;
    const tool = slug ? toolBySlug(slug) : undefined;
    if (!tool?.pad) continue;

    const oordeel = beoordeel(item, eigenGroepen);
    if (oordeel.andereGroep || oordeel.ouderoproep) continue;

    // Een meerdaagse afspraak (toetsweek, schoolkamp) telt vanaf zijn eerste
    // dag voor "hoe lang nog", maar is pas voorbij na zijn laatste.
    const dagen = verschil(vandaag, item.datum);
    const nogTeGaan = verschil(vandaag, item.totDatum || item.datum);
    if (dagen > venster.voor) continue;
    if (nogTeGaan < -venster.na) continue;

    gevonden.push({
      id: item.id,
      item,
      soort: item.soort,
      tool,
      dagen,
      kop: kopVoor(item, item.soort, dagen),
      wanneer:
        item.totDatum && item.totDatum !== item.datum
          ? bereikTekst(item.datum, item.totDatum)
          : `${dagnaam(item.datum)} ${kort(item.datum)}`,
      detail: item.soort === "toets" ? item.titel : undefined,
      actie: ACTIE[item.soort] ?? `Openen in ${tool.naam}`,
    });
  }

  // Wat loopt of net geweest is telt allemaal als "nu" (vandaar de klem op 0)
  // en staat vooraan; daarna gewoon op datum.
  gevonden.sort(
    (a, b) => Math.max(a.dagen, 0) - Math.max(b.dagen, 0) || a.item.datum.localeCompare(b.item.datum),
  );

  // Eén per soort: drie gespreksavonden achter elkaar zijn één aanleiding.
  const gezien = new Set<Soort>();
  const uniek: Aanleiding[] = [];
  for (const a of gevonden) {
    if (gezien.has(a.soort)) continue;
    gezien.add(a.soort);
    uniek.push(a);
  }
  return uniek;
}

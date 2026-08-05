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

/**
 * Het werk waar Avinka je NIET bij helpt, maar dat er wel bij hoort — en dat je
 * juist daarom vergeet. Werk je met IEP, dan moet iemand de toetsen klaarzetten;
 * dat doet geen enkele tool voor je.
 *
 * Deze signalen hebben dus geen tool maar een knop naar je eigen takenlijst:
 * voorgesteld, niet opgelegd (§5 van het plan). Ze gelden tot de dag vóór de
 * afspraak — daarna is klaarzetten te laat en neemt het andere signaal het over.
 *
 * Dit is de ALGEMENE tekst, voor wie zijn systemen niet heeft ingevuld. Staat
 * er wel iets in je instellingen, dan maakt `opMaat` hieronder het concreet.
 */
const VOORBEREIDING: Partial<Record<Soort, { voor: number; knop: string; taak: string }>> = {
  toets: {
    voor: 10,
    knop: "Toetsen klaarzetten",
    taak: "Toetsen klaarzetten in het leerlingvolgsysteem",
  },
  rapport: {
    voor: 28,
    knop: "Gegevens bijwerken",
    taak: "Toetsgegevens bijwerken, zodat de rapporten kloppen",
  },
  gesprek: {
    voor: 21,
    knop: "Rooster inplannen",
    taak: "Gespreksrooster maken en de tijden naar ouders sturen",
  },
};

/**
 * Zo werkt jouw school — uit je instellingen. Weten we welk systeem je
 * gebruikt, dan wordt een vage tip een concrete: "zet de gesprekken open in
 * Parro" in plaats van "maak een gespreksrooster".
 */
export type Schoolsystemen = {
  /** '' | parro | social_schools | isy | konnect */
  communicatieApp?: string;
  /** Eigen Isy/Konnect-adres; Parro en Social Schools hebben een vast adres. */
  communicatieUrl?: string;
  /** '' | parnassys | esis */
  lvsSysteem?: string;
  /** '' | iep | cito | beide */
  toetsSysteem?: string;
};

const APP_NAAM: Record<string, string> = {
  parro: "Parro",
  social_schools: "Social Schools",
  isy: "Isy",
  konnect: "Konnect",
};
// ⚠️ Dezelfde adressen staan in public/avinka-communicatie-app.js (die is voor
// de tools, deze voor het dashboard). Samen bijwerken.
const APP_URL: Record<string, string> = {
  parro: "https://talk.parro.com",
  social_schools: "https://app.socialschools.eu",
};
const APP_STAARTJE: Record<string, string> = {
  isy: ".isy-school.nl",
  konnect: ".ouderportaal.nl",
};

/** Het volledige webadres van jullie communicatie-app, of "" als we het niet weten. */
function appUrl(sys: Schoolsystemen): string {
  const app = sys.communicatieApp ?? "";
  if (APP_URL[app]) return APP_URL[app];
  const staartje = APP_STAARTJE[app];
  const voorstuk = (sys.communicatieUrl ?? "").trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
  if (!staartje || !voorstuk) return "";
  return voorstuk.includes(".") ? `https://${voorstuk}` : `https://${voorstuk}${staartje}`;
}
const LVS_NAAM: Record<string, string> = { parnassys: "ParnasSys", esis: "Esis" };
const TOETS_NAAM: Record<string, string> = { iep: "IEP", cito: "Cito" };

/**
 * De voorbereidingstip toegespitst op de systemen van deze school.
 *
 * ⚠️ We beweren alleen wat we zeker weten. Van Parro is bekend dat je de
 * gesprekken daar openzet en dat ouders zichzelf intekenen; of dat bij Isy of
 * Konnect net zo gaat weten we niet, dus daar blijft de tekst algemeen en
 * noemen we alleen de naam. Iets verkeerds beweren is erger dan iets algemeens
 * zeggen — dezelfde regel als bij "Onbeperkt gebruik" op de prijzenpagina.
 */
function opMaat(
  soort: Soort,
  standaard: { knop: string; taak: string },
  sys: Schoolsystemen,
): { knop: string; taak: string; link?: string } {
  if (soort === "gesprek" && sys.communicatieApp) {
    const naam = APP_NAAM[sys.communicatieApp] ?? "je communicatie-app";
    const link = appUrl(sys) || undefined;
    // Weten we waar het moet gebeuren, dan brengt de knop je er meteen heen —
    // dat scheelt de omweg via je takenlijst. Kennen we het adres niet (Isy en
    // Konnect hebben er per school een), dan blijft het een taak.
    return sys.communicatieApp === "parro"
      ? {
          knop: link ? `Openen in ${naam}` : `Openzetten in ${naam}`,
          taak: `Gesprekken openzetten in ${naam}, dan tekenen ouders zelf in`,
          link,
        }
      : {
          knop: link ? `Openen in ${naam}` : `Inplannen in ${naam}`,
          taak: `Gespreksrooster klaarzetten in ${naam}`,
          link,
        };
  }
  if (soort === "toets") {
    // Het toetssysteem is preciezer dan het LVS: je zet je toetsen klaar in IEP
    // of Cito, niet in de leerlingadministratie. Alleen bij "allebei" of niets
    // vallen we terug op het LVS, en anders op de algemene tekst.
    const naam =
      TOETS_NAAM[sys.toetsSysteem ?? ""] ?? LVS_NAAM[sys.lvsSysteem ?? ""] ?? "";
    if (naam) return { knop: `Klaarzetten in ${naam}`, taak: `Toetsen klaarzetten in ${naam}` };
  }
  if (soort === "rapport" && sys.lvsSysteem) {
    const naam = LVS_NAAM[sys.lvsSysteem] ?? "je leerlingvolgsysteem";
    return {
      knop: `Bijwerken in ${naam}`,
      taak: `Toetsgegevens bijwerken in ${naam}, zodat de rapporten kloppen`,
    };
  }
  return standaard;
}

export type Aanleiding = {
  /** Van het agenda-item, dus stabiel tussen twee keer laden. */
  id: string;
  item: PlanItem;
  soort: Soort;
  /**
   * "doen" = er is een tool die het werk uit handen neemt.
   * "voorbereiden" = jij moet zelf iets klaarzetten; dan is de knop je takenlijst.
   */
  aard: "doen" | "voorbereiden";
  /** Alleen bij "doen". Staat altijd in `tools.ts` en heeft altijd een pad. */
  tool?: Tool;
  /** Alleen bij "voorbereiden": de tekst zoals hij op je takenlijst komt. */
  taak?: string;
  /** Alleen bij "voorbereiden": staat hij er al op? Dan geen knop meer. */
  alOpDeLijst?: boolean;
  /**
   * Alleen bij "voorbereiden": het systeem waar het moet gebeuren, als we het
   * adres kennen (Parro, Social Schools). Dan wordt de knop een link daarheen
   * in plaats van een taak.
   */
  link?: string;
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
function kopVoor(item: PlanItem, soort: Soort, dagen: number, aard: "doen" | "voorbereiden"): string {
  const wanneer = wanneerTekst(dagen);
  switch (soort) {
    case "rapport":
      return `${wanneer} gaan de rapporten mee`;
    case "gesprek":
      return `${wanneer} zijn de oudergesprekken`;
    case "toets":
      // Het toolvenster begint pas op de dag zelf: de toets moet gemaakt zijn
      // voordat er iets te analyseren valt. Ervóór gaat het over klaarzetten.
      if (aard === "voorbereiden") return `${wanneer} beginnen de toetsen`;
      return dagen === 0 ? "De toetsen zijn vandaag" : "De toetsen zijn net geweest";
    default:
      return `${wanneer}: ${item.titel}`;
  }
}

/**
 * Alles wat er de komende tijd aankomt, het dichtstbijzijnde eerst. Wat nu
 * speelt of net geweest is staat bovenaan.
 *
 * Eén afspraak levert hooguit ÉÉN signaal, dat met de tijd van vorm verandert:
 * eerst het klaarzetten dat je zelf moet doen, daarna het werk waar een tool
 * bij helpt. De vensters sluiten daarom op elkaar aan in plaats van te
 * overlappen — anders staat er twee keer "over 3 weken gaan de rapporten mee"
 * onder elkaar, met twee verschillende knoppen.
 *
 * `eigenGroepen` komt uit je instellingen (zie `mijnGroepen`); zonder die
 * informatie filteren we niet, want dan weten we het gewoon niet.
 */
export function aanleidingen(
  bron: PlanningBron,
  vandaag: string,
  eigenGroepen: number[] = [],
  systemen: Schoolsystemen = {},
): Aanleiding[] {
  const gevonden: Aanleiding[] = [];
  const opDeLijst = new Set(bron.taken.filter((t) => !t.gedaan).map((t) => t.tekst));

  for (const item of bron.items) {
    if (item.dubbelVan) continue;

    const venster = VENSTER[item.soort];
    const voorbereiding = VOORBEREIDING[item.soort];
    if (!venster && !voorbereiding) continue;

    const oordeel = beoordeel(item, eigenGroepen);
    if (oordeel.andereGroep || oordeel.ouderoproep) continue;

    // Een meerdaagse afspraak (toetsweek, schoolkamp) telt vanaf zijn eerste
    // dag voor "hoe lang nog", maar is pas voorbij na zijn laatste.
    const dagen = verschil(vandaag, item.datum);
    const nogTeGaan = verschil(vandaag, item.totDatum || item.datum);

    const slug = SOORT_INFO[item.soort]?.tool;
    const tool = slug ? toolBySlug(slug) : undefined;
    // Geen knop naar een tool die niet op het dashboard staat.
    const toolFase =
      Boolean(venster && tool?.pad) && dagen <= venster!.voor && nogTeGaan >= -venster!.na;
    // Ervóór: het klaarzetten dat geen tool voor je doet. Loopt tot de dag
    // waarop het toolvenster begint, dus de twee bijten elkaar nooit.
    const voorFase =
      Boolean(voorbereiding) &&
      !toolFase &&
      dagen >= 1 &&
      dagen <= voorbereiding!.voor &&
      dagen > (venster?.voor ?? 0);

    if (!toolFase && !voorFase) continue;

    const aard = toolFase ? ("doen" as const) : ("voorbereiden" as const);
    const tip = voorFase ? opMaat(item.soort, voorbereiding!, systemen) : null;
    const wanneer =
      item.totDatum && item.totDatum !== item.datum
        ? bereikTekst(item.datum, item.totDatum)
        : `${dagnaam(item.datum)} ${kort(item.datum)}`;

    gevonden.push({
      id: item.id,
      item,
      soort: item.soort,
      aard,
      tool: toolFase ? tool : undefined,
      taak: tip?.taak,
      link: tip?.link,
      alOpDeLijst: tip ? opDeLijst.has(tip.taak) : undefined,
      dagen,
      kop: kopVoor(item, item.soort, dagen, aard),
      wanneer,
      detail: item.soort === "toets" ? item.titel : undefined,
      actie: toolFase ? (ACTIE[item.soort] ?? `Openen in ${tool!.naam}`) : tip!.knop,
    });
  }

  // Wat loopt of net geweest is telt allemaal als "nu" (vandaar de klem op 0)
  // en staat vooraan; daarna gewoon op datum.
  gevonden.sort(
    (a, b) => Math.max(a.dagen, 0) - Math.max(b.dagen, 0) || a.item.datum.localeCompare(b.item.datum),
  );

  // Eén per soort én fase: drie gespreksavonden achter elkaar zijn samen één
  // aanleiding. Wel apart, want het is ander werk: een toets die net geweest is
  // (analyseren) naast een toets die eraan komt (klaarzetten).
  const gezien = new Set<string>();
  const uniek: Aanleiding[] = [];
  for (const a of gevonden) {
    const sleutel = `${a.soort}/${a.aard}`;
    if (gezien.has(sleutel)) continue;
    gezien.add(sleutel);
    uniek.push(a);
  }
  return uniek;
}

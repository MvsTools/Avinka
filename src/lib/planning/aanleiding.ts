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
import { bereikTekst, dagnaam, kort, plus, verschil } from "./datum";
import { groep8Momenten, heeftGroep8 } from "./groep8";
import { beoordeel } from "./relevantie";
import type { PlanItem, PlanningBron, Soort } from "./types";
import { laatsteWerkdagVoor, leesWerkdagen } from "./werkdagen";

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
  // Bij een schoolreis, sportdag of excursie is dít het stuk dat je niet zelf
  // in de hand hebt en dat daarom vroeg moet: je hebt begeleiders en vervoer
  // nodig, en die moeten hun eigen dag vrij kunnen houden. Zes weken, want een
  // ouder die moet ruilen op zijn werk heeft die tijd nodig.
  activiteit: {
    voor: 42,
    knop: "Hulpouders vragen",
    taak: "Hulpouders en vervoer regelen",
  },
};

/**
 * Zo werkt jouw school — uit je instellingen. Weten we welk systeem je
 * gebruikt, dan wordt een vage tip een concrete: "zet de gesprekken open in
 * Parro" in plaats van "maak een gespreksrooster".
 */
export type Schoolsystemen = {
  /** '' | parro | social_schools | schoudercom | basisonline | isy */
  communicatieApp?: string;
  /** Eigen SchouderCom/Isy-adres; de rest heeft een vast adres. */
  communicatieUrl?: string;
  /** '' | parnassys | esis */
  lvsSysteem?: string;
  /** '' | iep | cito | beide */
  toetsSysteem?: string;
};

const APP_NAAM: Record<string, string> = {
  parro: "Parro",
  social_schools: "Social Schools",
  schoudercom: "SchouderCom",
  basisonline: "het Ouderportaal",
  isy: "Isy",
};

/**
 * Hoe het plannen van oudergesprekken in elk systeem werkt. Uitgezocht in de
 * openbare handleidingen van de leveranciers zelf (augustus 2026):
 *
 * - Parro: agenda → "Gesprekken plannen", groep en leerlingen kiezen; ouders
 *   kiezen per kind een tijd en kunnen er een notitie bij zetten.
 * - Social Schools: klasmenu → "oudergesprekken plannen"; ouders krijgen een
 *   uitnodiging en kiezen een tijdslot. De leerkracht kan zelf tijden toewijzen.
 * - Isy: de school zet dagen en tijden open, ouders kiezen er een.
 * - SchouderCom: twee smaken — de planner maakt zelf een rooster (houdt
 *   rekening met broertjes/zusjes), of een intekenlijst waarop ouders kiezen.
 *   Daarom staat er hier NIET dat ouders zelf intekenen.
 * - BasisOnline (Ouderportaal): gesprekkenplanner, ouders tekenen in.
 *
 * ⚠️ Staat een systeem hier niet in, dan blijft de tekst algemeen. Nooit gokken
 * hoe andermans software werkt.
 */
const GESPREK_TIP: Record<string, string> = {
  parro: "Gesprekken openzetten in Parro (agenda → Gesprekken plannen), dan kiezen ouders zelf een tijd",
  social_schools:
    "Oudergesprekken plannen in Social Schools (via het klasmenu), dan kiezen ouders zelf een tijd",
  schoudercom: "Gesprekken inplannen in SchouderCom, met de planner of een intekenlijst",
  basisonline: "Gesprekken openzetten in het Ouderportaal, dan kiezen ouders zelf een tijd",
  isy: "Gespreksdagen en tijden openzetten in Isy, dan kiezen ouders zelf een tijd",
};

/**
 * Hulpouders en vervoer vragen — óók per systeem uitgezocht, want het zit er
 * NIET overal in (augustus 2026):
 *
 * - Parro: vrijwilligers en materialen regel je bij een agenda-item; ouders
 *   schrijven zich in.
 * - Social Schools: agenda-item → "Meer opties" → materialen/vrijwilligers
 *   vragen, met aantallen. Ouders melden zich met een plusje.
 * - SchouderCom: een "oproepje" onder een bericht — een formuliertje waarin een
 *   ouder ook kan invullen hoeveel kinderen er in zijn auto passen.
 * - BasisOnline: intekenlijsten bij een activiteit.
 * - ⚠️ Isy: heeft hier GEEN aparte module voor (wel Formulieren, Toestemmingen
 *   en Nieuws). Dus geen belofte over "de inschrijflijst" — daar staat alleen
 *   dat je het via Isy vraagt.
 */
const HULPOUDER_TIP: Record<string, string> = {
  parro: "Hulpouders en vervoer vragen in Parro, via een inschrijving bij de activiteit",
  social_schools:
    "Hulpouders en vervoer vragen in Social Schools, via materialen/vrijwilligers bij het agenda-item",
  schoudercom: "Hulpouders en vervoer vragen in SchouderCom, met een oproepje onder je bericht",
  basisonline: "Hulpouders en vervoer vragen in het Ouderportaal, met een intekenlijst",
  isy: "Hulpouders en vervoer vragen via Isy",
};
// ⚠️ Dezelfde adressen staan in public/avinka-communicatie-app.js (die is voor
// de tools, deze voor het dashboard). Samen bijwerken.
const APP_URL: Record<string, string> = {
  parro: "https://talk.parro.com",
  social_schools: "https://app.socialschools.eu",
  basisonline: "https://ouders.basisonline.nl",
};
const APP_STAARTJE: Record<string, string> = {
  isy: ".isy-school.nl",
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
// ⚠️ Alleen adressen die we ZEKER weten (nagezocht augustus 2026):
// - IEP heeft één vast inlogadres voor alle scholen.
// - Leerling in beeld loopt volgens Cito zelf via Basispoort; dat is de poort,
//   niet de toets, dus de knop zegt ook "via Basispoort".
// - Dia (Dia-groeiwijzer) en Boom hebben geen adres dat we hard kunnen maken →
//   die krijgen alleen een taak, geen knop. Liever geen link dan een verkeerde.
const TOETS_URL: Record<string, string> = {
  iep: "https://www.ieplvs.nl/login",
  cito: "https://www.basispoort.nl",
};
const TOETS_KNOP: Record<string, string> = {
  iep: "Openen in IEP",
  cito: "Openen via Basispoort",
};
const TOETS_NAAM: Record<string, string> = {
  iep: "IEP",
  cito: "Cito",
  dia: "Dia",
  boom: "Boom",
};

/**
 * De voorbereidingstip toegespitst op de systemen van deze school.
 *
 * ⚠️ We beweren alleen wat we zeker weten. Van Parro is bekend dat je de
 * gesprekken daar openzet en dat ouders zichzelf intekenen; of dat bij Isy of
 * andere systemen net zo gaat weten we niet, dus daar blijft de tekst algemeen
 * en noemen we alleen de naam. Iets verkeerds beweren is erger dan iets algemeens
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
    // dat scheelt de omweg via je takenlijst. Kennen we het adres niet (dat
    // vult de school zelf in bij SchouderCom en Isy), dan blijft het een taak
    // voor op je lijst.
    return {
      knop: link ? `Openen in ${naam}` : `Inplannen in ${naam}`,
      taak: GESPREK_TIP[sys.communicatieApp] ?? `Gespreksrooster klaarzetten in ${naam}`,
      link,
    };
  }
  if (soort === "toets") {
    // Het toetssysteem is preciezer dan het LVS: je zet je toetsen klaar in IEP
    // of Cito, niet in de leerlingadministratie. Alleen bij "allebei" of niets
    // vallen we terug op het LVS, en anders op de algemene tekst.
    const naam =
      TOETS_NAAM[sys.toetsSysteem ?? ""] ?? LVS_NAAM[sys.lvsSysteem ?? ""] ?? "";
    if (naam) {
      const sleutel = sys.toetsSysteem ?? "";
      return {
        knop: TOETS_KNOP[sleutel] ?? `Klaarzetten in ${naam}`,
        taak: `Toetsen klaarzetten in ${naam}`,
        link: TOETS_URL[sleutel],
      };
    }
  }
  if (soort === "activiteit" && sys.communicatieApp) {
    // Hulpouders vraag je waar de ouders zitten, dus dit signaal hoort naar de
    // communicatie-app te wijzen en niet naar je takenlijst.
    const naam = APP_NAAM[sys.communicatieApp] ?? "je communicatie-app";
    const link = appUrl(sys) || undefined;
    return {
      knop: link ? `Oproep in ${naam}` : "Hulpouders vragen",
      taak: HULPOUDER_TIP[sys.communicatieApp] ?? `Hulpouders en vervoer vragen via ${naam}`,
      link,
    };
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
  /** Stabiel tussen twee keer laden. */
  id: string;
  /**
   * Waar hoort dit signaal bij, en in welke fase? Hierop ontdubbelen we: drie
   * gespreksavonden achter elkaar zijn samen één aanleiding, maar een toets die
   * net geweest is (analyseren) staat wél los van een toets die eraan komt
   * (klaarzetten).
   */
  sleutel: string;
  /** De dag waar het om draait. */
  datum: string;
  /** Alleen bij een afspraak uit je agenda; kalendermomenten hebben er geen. */
  item?: PlanItem;
  soort?: Soort;
  /**
   * "doen" = er is een tool die het werk uit handen neemt.
   * "voorbereiden" = jij moet zelf iets klaarzetten; dan is de knop je takenlijst.
   */
  aard: "doen" | "voorbereiden";
  /** Alleen bij "doen". Staat altijd in `tools.ts` en heeft altijd een pad. */
  tool?: Tool;
  /**
   * Alleen bij "voorbereiden": wat er op je takenlijst komt. Meestal één regel,
   * maar in de startweek staan er meerdere klussen tegelijk klaar.
   */
  taken?: string[];
  /**
   * De dag waarop de taak op je lijst komt. Werk je niet op de dag zelf, dan is
   * dit je laatste werkdag ervóór — een herinnering op je vrije woensdag helpt
   * je niet.
   */
  taakDatum?: string;
  /** Alleen bij "voorbereiden": staat alles er al op? Dan geen knop meer. */
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
 * Wat er in de startweek klaar moet staan — de week vóór de eerste schooldag,
 * als de kinderen nog vrij zijn en jij je lokaal inricht.
 *
 * Deze lijst komt van de eigenaar zelf (leerkracht). Hou hem kort en algemeen:
 * dit moet voor élke groep kloppen, en wat per school verschilt hoort in je
 * eigen takenlijst thuis, niet hier.
 */
const STARTWEEK_TAKEN = [
  "Plattegrond maken",
  "Klas inrichten",
  "Boeken en schriften uitdelen",
  "Klassenlijst controleren",
  "Eerste schooldag voorbereiden",
];

/** Wat het scherm nog meer van je weet dan alleen je agenda. */
export type Context = {
  /** Uit je instellingen: "0134" = maandag, dinsdag, donderdag, vrijdag. */
  werkdagen?: string;
  /** Hoe ver je bent met de rapporten van je huidige groep. */
  rapporten?: { klaar: number; totaal: number };
};

/** "nog 16 van de 28" — of niets als er geen klas of geen leerlingen zijn. */
function voortgangTekst(voortgang?: { klaar: number; totaal: number }): string | undefined {
  if (!voortgang || voortgang.totaal <= 0) return undefined;
  const over = Math.max(0, voortgang.totaal - voortgang.klaar);
  if (over === 0) return `alle ${voortgang.totaal} rapporten staan er`;
  return `nog ${over} van de ${voortgang.totaal} rapporten`;
}

/**
 * Momenten die niet in je agenda staan maar wel elk jaar terugkomen, omdat ze
 * uit het schooljaar zelf volgen.
 *
 * ⚠️ Alleen momenten waarvan we ZEKER weten dat ze voor iedereen gelden. De
 * startweek en de laatste schoolweken zitten al in het schooljaarmodel; alles
 * wat per school verschilt hoort in de agenda thuis, niet hier.
 */
function uitDeKalender(
  bron: PlanningBron,
  vandaag: string,
  werkdagen: number[],
  opLijst: (taken?: string[]) => boolean | undefined,
): Aanleiding[] {
  const { schooljaar } = bron;
  const uit: Aanleiding[] = [];
  if (schooljaar.afgesloten) return uit;

  // 1. DE STARTWEEK ZELF — de week waarin je je lokaal klaarmaakt terwijl de
  //    kinderen nog vrij zijn. Bewust NIET eerder: daarvóór is het vakantie en
  //    dan werkt er niemand, dus een signaal van twee weken vooraf komt aan op
  //    een moment dat je het niet kunt gebruiken (correctie van de eigenaar).
  //
  //    Hier staat niet één klus maar een lijstje: in die week moet er van
  //    alles tegelijk klaar. Eén knop zet ze allemaal op je takenlijst.
  const startVan = schooljaar.startweek.van;
  const startTot = plus(schooljaar.start, -1);
  if (vandaag >= startVan && vandaag <= startTot) {
    const taken = STARTWEEK_TAKEN;
    const dagen = verschil(vandaag, schooljaar.start);
    uit.push({
      id: `kalender-startweek-${schooljaar.id}`,
      sleutel: "kalender/startweek",
      datum: schooljaar.start,
      aard: "voorbereiden",
      taken,
      // De laatste werkdag vóór de eerste schooldag: alles moet klaar zijn
      // wanneer de kinderen binnenkomen.
      taakDatum: laatsteWerkdagVoor(startTot, werkdagen),
      alOpDeLijst: opLijst(taken),
      dagen,
      kop: "Deze week zet je je klas klaar",
      wanneer: `eerste schooldag ${dagnaam(schooljaar.start)} ${kort(schooljaar.start)}`,
      detail: `${taken.length} dingen om te doen`,
      actie: `${taken.length} taken op mijn lijst`,
    });
  }

  // 2. De laatste weken: de overdracht naar de leerkracht van volgend jaar.
  //    Drie weken, want dit is het klusje dat in de laatste week niet meer past.
  const naarEind = verschil(vandaag, schooljaar.eind);
  if (naarEind >= 0 && naarEind <= 21) {
    const taak = "Overdracht schrijven voor de leerkracht van volgend jaar";
    uit.push({
      id: `kalender-overdracht-${schooljaar.id}`,
      sleutel: "kalender/overdracht",
      datum: schooljaar.eind,
      aard: "voorbereiden",
      taken: [taak],
      taakDatum: laatsteWerkdagVoor(schooljaar.eind, werkdagen),
      alOpDeLijst: opLijst([taak]),
      dagen: naarEind,
      kop: `${wanneerTekst(naarEind)} is het schooljaar afgelopen`,
      wanneer: `laatste schooldag ${kort(schooljaar.eind)}`,
      detail: "overdracht naar volgend jaar",
      actie: "Overdracht schrijven",
    });
  }

  return uit;
}

/**
 * Groep 8 heeft een eigen jaar met landelijk vastgelegde momenten. Die staan
 * niet per se in de schoolagenda, terwijl er wel harde termijnen aan hangen.
 * Zie `groep8.ts` — dat lijstje werken we jaarlijks bij.
 */
function uitGroep8(
  bron: PlanningBron,
  vandaag: string,
  eigenGroepen: number[],
  werkdagen: number[],
  opLijst: (taken?: string[]) => boolean | undefined,
): Aanleiding[] {
  if (!heeftGroep8(eigenGroepen) || bron.schooljaar.afgesloten) return [];

  return groep8Momenten(bron.schooljaar.id).flatMap((m) => {
    const dagen = verschil(vandaag, m.datum);
    const nogTeGaan = verschil(vandaag, m.totDatum);
    // Vanaf zijn venster tot en met de laatste dag van het moment zelf.
    if (dagen > m.voor || nogTeGaan < 0) return [];
    return [
      {
        id: `groep8-${m.id}-${bron.schooljaar.id}`,
        sleutel: `groep8/${m.id}`,
        datum: m.datum,
        aard: "voorbereiden" as const,
        taken: [m.taak],
        taakDatum: laatsteWerkdagVoor(m.datum, werkdagen),
        alOpDeLijst: opLijst([m.taak]),
        dagen,
        kop: `${wanneerTekst(dagen)}: ${m.kop.toLowerCase()}`,
        wanneer:
          m.totDatum !== m.datum ? bereikTekst(m.datum, m.totDatum) : `${dagnaam(m.datum)} ${kort(m.datum)}`,
        detail: "groep 8",
        actie: m.knop,
      },
    ];
  });
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
  extra: Context = {},
): Aanleiding[] {
  const gevonden: Aanleiding[] = [];
  const opDeLijst = new Set(bron.taken.filter((t) => !t.gedaan).map((t) => t.tekst));
  const werkdagen = leesWerkdagen(extra.werkdagen);
  const opLijst = (taken?: string[]) =>
    taken?.length ? taken.every((t) => opDeLijst.has(t)) : undefined;

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
    const toolMogelijk = Boolean(venster && tool?.pad);
    const toolFase = toolMogelijk && dagen <= venster!.voor && nogTeGaan >= -venster!.na;
    // Ervóór: het klaarzetten dat geen tool voor je doet. Loopt tot de dag
    // waarop het toolvenster begint, dus de twee bijten elkaar nooit.
    //
    // ⚠️ Die grens geldt ALLEEN als er ook echt een tool is. Zonder die
    // uitzondering verdween het hulpouders-signaal volledig: bij een activiteit
    // zijn beide vensters zes weken, dus "buiten het toolvenster" bestond niet —
    // en de draaiboek-tool die het had moeten overnemen staat niet eens op het
    // dashboard. Resultaat: een signaal dat we wel bouwden maar dat nooit
    // verscheen.
    const voorFase =
      Boolean(voorbereiding) &&
      !toolFase &&
      dagen >= 1 &&
      dagen <= voorbereiding!.voor &&
      (!toolMogelijk || dagen > venster!.voor);

    if (!toolFase && !voorFase) continue;

    const aard = toolFase ? ("doen" as const) : ("voorbereiden" as const);
    const tip = voorFase ? opMaat(item.soort, voorbereiding!, systemen) : null;
    const wanneer =
      item.totDatum && item.totDatum !== item.datum
        ? bereikTekst(item.datum, item.totDatum)
        : `${dagnaam(item.datum)} ${kort(item.datum)}`;

    gevonden.push({
      id: item.id,
      sleutel: `${item.soort}/${aard}`,
      datum: item.datum,
      item,
      soort: item.soort,
      aard,
      tool: toolFase ? tool : undefined,
      taken: tip ? [tip.taak] : undefined,
      taakDatum: tip ? laatsteWerkdagVoor(item.datum, werkdagen) : undefined,
      link: tip?.link,
      alOpDeLijst: opLijst(tip ? [tip.taak] : undefined),
      dagen,
      kop: kopVoor(item, item.soort, dagen, aard),
      wanneer,
      // Bij een toets zegt de titel wélke toets het was; bij de rapporten is
      // het nuttigst hoe ver je al bent.
      detail:
        item.soort === "toets"
          ? item.titel
          : item.soort === "rapport" && toolFase
            ? voortgangTekst(extra.rapporten)
            : undefined,
      actie: toolFase ? (ACTIE[item.soort] ?? `Openen in ${tool!.naam}`) : tip!.knop,
    });
  }

  gevonden.push(...uitDeKalender(bron, vandaag, werkdagen, opLijst));
  gevonden.push(...uitGroep8(bron, vandaag, eigenGroepen, werkdagen, opLijst));

  // Wat loopt of net geweest is telt allemaal als "nu" (vandaar de klem op 0)
  // en staat vooraan; daarna gewoon op datum.
  gevonden.sort(
    (a, b) => Math.max(a.dagen, 0) - Math.max(b.dagen, 0) || a.datum.localeCompare(b.datum),
  );

  // Eén per sleutel: drie gespreksavonden achter elkaar zijn samen één
  // aanleiding. Wel apart, want het is ander werk: een toets die net geweest is
  // (analyseren) naast een toets die eraan komt (klaarzetten).
  const gezien = new Set<string>();
  const uniek: Aanleiding[] = [];
  for (const a of gevonden) {
    if (gezien.has(a.sleutel)) continue;
    gezien.add(a.sleutel);
    uniek.push(a);
  }
  return uniek;
}

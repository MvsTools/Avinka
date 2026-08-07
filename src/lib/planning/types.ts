// De begrippen van Mijn schooljaar, op één plek.
//
// Alles wat op het scherm komt (jaar, periode, week, dag) is een andere blik op
// dezelfde vier dingen: het schooljaar met zijn vakanties, de afspraken uit je
// agenda, je basisrooster en je taken.

import type { Soort } from "../agenda-herken";
import type { Regio, Vakantie } from "./vakanties";

export type { Regio, Vakantie };
export type { Soort };

export type Schooljaar = {
  /** "2026-2027" */
  id: string;
  /** "2026/2027", voor op het scherm. */
  label: string;
  regio: Regio;
  /** Eerste schooldag. */
  start: string;
  /** Laatste schooldag. */
  eind: string;
  vakanties: Vakantie[];
  /** De week (ma–vr) vóór de eerste schooldag: lokaal klaarmaken, plannen. */
  startweek: { van: string; tot: string };
  /** Vorig schooljaar mag je bekijken, niet bewerken. */
  afgesloten: boolean;
};

export type Periode = {
  /** 1, 2, 3 … op volgorde van het jaar. */
  nummer: number;
  /** "Periode 1" */
  naam: string;
  /** "van de zomervakantie tot de herfstvakantie" */
  omschrijving: string;
  van: string;
  tot: string;
  /** Aantal schoolweken in dit blok. */
  weken: number;
  /** De vakantie waar dit blok op uitkomt (het laatste blok heeft de zomer). */
  eindigtMet?: Vakantie;
};

/** Een afspraak uit een gekoppelde agenda, in planningstaal. */
export type PlanItem = {
  id: string;
  bronId: string;
  datum: string;
  /** Bij een meerdaagse afspraak de laatste dag; anders gelijk aan datum. */
  totDatum: string;
  heleDag: boolean;
  begin?: string;
  eind?: string;
  titel: string;
  soort: Soort;
  /** Meer dan 1 als losse tijdvakken zijn samengevouwen (gesprekken van 10 minuten). */
  tijdvakken: number;
  /** Gezet als deze afspraak ook in een andere agenda staat; dan tonen we hem één keer. */
  dubbelVan?: string;
};

/**
 * Een blok uit je basisrooster: een les tijdens schooltijd of je eigen tijd na
 * schooltijd. Het echte opslaan komt in fase 2; de vorm staat hier vast zodat
 * de dag- en weekweergave er nu al mee kunnen rekenen.
 */
export type Roosterblok = {
  id: string;
  /** 0 = maandag … 4 = vrijdag. */
  weekdag: number;
  begin: string;
  eind: string;
  /** Vak-id uit het basisrooster ("rekenen", "gym") of taaksoort na schooltijd. */
  vak: string;
  naam: string;
  /** Zachte achtergrond + bijpassende tekstkleur, overgenomen uit de weekplanning. */
  kleur?: { bg: string; tekst: string };
  /** Eigen aantekening bij dit blok ("Jeugdjournaal kijken"). Vrije tekst van de
   *  leerkracht zelf, dus nooit leerlingnamen — dat blijft de afspraak. */
  omschrijving?: string;
  /** Staat dit blok vast op zijn tijd (het slotje)? Al uitgerekend, inclusief de
   *  pauzes die standaard vaststaan. Zie `staatVast` in rooster.ts. */
  opSlot?: boolean;
  /** Een les binnen schooltijd, of je eigen tijd erna. */
  soort: "les" | "taak";
};

export type Taak = {
  id: string;
  tekst: string;
  gedaan: boolean;
  deadline?: string;
};

/** Wat er op één dag speelt. Dit is wat Start toont en wat de Dag-laag uitvergroot. */
export type Dagbeeld = {
  datum: string;
  weekdag: number;
  weekend: boolean;
  /** Geen les vandaag: weekend, vakantie of een vrije dag uit de agenda. */
  vrij: boolean;
  vrijReden?: "weekend" | "vakantie" | "vrije dag";
  vakantie?: Vakantie;
  /** De startweek vóór de eerste schooldag: geen les, maar wel een werkweek. */
  startweek: boolean;
  /** Is dit de eerste schooldag zelf? Staat vast aan het schooljaar, dus dit
   *  hoef je nooit zelf in te plannen. */
  eersteSchooldag: boolean;
  /** De afspraken van vandaag, op tijd gesorteerd. */
  items: PlanItem[];
  /** Je rooster van vandaag, op tijd gesorteerd. Leeg als de dag vrij is. */
  blokken: Roosterblok[];
  /** Taken die vandaag aflopen. */
  taken: Taak[];
  periode?: Periode;
  /** Valt deze dag buiten het schooljaar (bijvoorbeeld in de zomervakantie)? */
  buitenSchooljaar: boolean;
};

export type Weekbeeld = {
  maandag: string;
  weeknummer: number;
  dagen: Dagbeeld[];
  periode?: Periode;
  /** Waar of niet: deze week wijkt af van het basisrooster. Vult zich in fase 2. */
  afwijkend: boolean;
};

/** Alles wat de vier lagen nodig hebben, in één keer opgehaald. */
export type PlanningBron = {
  schooljaar: Schooljaar;
  periodes: Periode[];
  items: PlanItem[];
  blokken: Roosterblok[];
  /** Weken die van het basisrooster afwijken, per maandag (ISO). Leeg = geen afwijkingen. */
  weekOverrides: Record<string, Roosterblok[]>;
  taken: Taak[];
};

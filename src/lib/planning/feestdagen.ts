// De Nederlandse feestdagen die een basisschool structureel vrij geeft.
//
// In tegenstelling tot de schoolvakanties (vakanties.ts, die de overheid elk
// jaar opnieuw vaststelt en die dus jaarlijks met de hand moet worden
// bijgewerkt) volgen deze data een vaste regel: Koningsdag ligt vast op de
// kalender, en Pasen/Hemelvaart/Pinksteren volgen de paasformule. Dit bestand
// hoeft daardoor nooit onderhouden te worden — het geldt voor ieder jaar,
// voor altijd.
//
// BEWUST NIET opgenomen: Nieuwjaarsdag en de Kerstdagen (vallen altijd in de
// kerstvakantie), Eerste Paas-/Pinksterdag (altijd een zondag), en Goede
// Vrijdag/Bevrijdingsdag buiten een lustrumjaar (die geeft niet elke school
// vrij — zie de "liever een schooldag te veel"-regel in eigen-vakanties.ts).
// Alleen de dagen waarop vrijwel elke basisschool dicht is, komen er als
// vaste "geen les"-dag in te staan; de rest zou een gok zijn.

import type { PlanItem, Schooljaar } from "./types";

/** Paaszondag van een kalenderjaar (Gauss/Butcher-algoritme, altijd correct). */
function paaszondag(jaar: number): string {
  const a = jaar % 19;
  const b = Math.floor(jaar / 100);
  const c = jaar % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const maand = Math.floor((h + l - 7 * m + 114) / 31);
  const dag = ((h + l - 7 * m + 114) % 31) + 1;
  return `${jaar}-${String(maand).padStart(2, "0")}-${String(dag).padStart(2, "0")}`;
}

function plus(iso: string, dagen: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dagen);
  return d.toISOString().slice(0, 10);
}

function weekdag(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getUTCDay(); // 0 = zondag
}

/** 27 april, maar een dag eerder als die op zondag valt. */
function koningsdag(jaar: number): string {
  const datum = `${jaar}-04-27`;
  return weekdag(datum) === 0 ? plus(datum, -1) : datum;
}

type LandelijkeVrijeDag = { naam: string; datum: string };

/** De vaste, structurele "geen les"-dagen van één kalenderjaar. */
function vrijeDagenVanJaar(jaar: number): LandelijkeVrijeDag[] {
  const pasen = paaszondag(jaar);
  return [
    { naam: "Tweede Paasdag", datum: plus(pasen, 1) },
    { naam: "Koningsdag", datum: koningsdag(jaar) },
    { naam: "Hemelvaartsdag", datum: plus(pasen, 39) },
    { naam: "Tweede Pinksterdag", datum: plus(pasen, 50) },
  ];
}

/** Zodat een landelijke feestdag nooit verward wordt met een echte, gekoppelde agenda. */
export const FEESTDAGEN_BRON_ID = "landelijke-feestdagen";

/**
 * De feestdagen van een schooljaar, klaar om als PlanItem tussen de andere
 * afspraken te schuiven. Staat de school zelf ook in een gekoppelde agenda
 * (bijvoorbeeld als "Koningsdag - alle groepen vrij"), dan herkent
 * markeerDubbelingen ze als dezelfde dag en wint de echte agenda — precies
 * zoals bij de landelijke vakantiedata.
 */
export function feestdagenAlsItems(schooljaar: Schooljaar): PlanItem[] {
  const jaarStart = Number(schooljaar.start.slice(0, 4));
  const jaarEind = Number(schooljaar.eind.slice(0, 4));
  const jaren = jaarStart === jaarEind ? [jaarStart] : [jaarStart, jaarEind];

  return jaren
    .flatMap(vrijeDagenVanJaar)
    .filter((f) => f.datum >= schooljaar.start && f.datum <= schooljaar.eind)
    .map((f) => ({
      id: `feestdag-${f.datum}`,
      bronId: FEESTDAGEN_BRON_ID,
      datum: f.datum,
      totDatum: f.datum,
      heleDag: true,
      titel: f.naam,
      soort: "vrij" as const,
      tijdvakken: 1,
    }));
}

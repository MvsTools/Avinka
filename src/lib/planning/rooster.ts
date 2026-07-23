// Het basisrooster: je vaste lesweek.
//
// Het rooster wordt gemaakt in de weekplanning-tool. Die bewaart een eigen vorm
// (tijden in minuten sinds middernacht, dagen als "ma"), en die vorm nemen we
// ongewijzigd over in de database. Zo kan de tool blijven werken zoals hij werkt
// en vertalen we hier één keer naar de begrippen van Mijn schooljaar.
//
// AFSPRAAK (zie docs/planning-mijn-schooljaar.md §3.6): het basisrooster is een
// sjabloon ZONDER datums. Er kan dus nooit een agenda-afspraak in staan. Die
// twee ontmoeten elkaar pas in een concrete week.

import type { Roosterblok } from "./types";

/** Zoals de weekplanning-tool het bewaart. */
export type RoosterBlokRuw = {
  id: string;
  dag: string;
  /** Minuten sinds middernacht. */
  start: number;
  /** Lengte in minuten. */
  duur: number;
  vak: string;
  naam: string;
  /** "les" = tijdens schooltijd, "taak" = eigen tijd erna, "vast" = pauze of gym. */
  type?: string;
};

export type RoosterSetup = {
  groep?: number | string;
  dagen?: string[];
  begin?: number;
  eind?: number;
  dagBegin?: Record<string, number>;
  dagEind?: Record<string, number>;
  vakken?: { id: string; naam: string }[];
};

export type Basisrooster = {
  setup: RoosterSetup;
  blokken: RoosterBlokRuw[];
};

const DAGEN = ["ma", "di", "wo", "do", "vr"];

/** "ma" → 0, "vr" → 4. Geeft -1 voor iets wat we niet kennen. */
export function dagNummer(dag: string): number {
  return DAGEN.indexOf(String(dag).toLowerCase().slice(0, 2));
}

/** 510 → "08:30" */
export function minutenNaarTijd(minuten: number): string {
  const m = Math.max(0, Math.round(minuten));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/**
 * Is dit een geldig bewaard rooster? We zijn streng bij het inlezen, want de
 * gegevens komen uit localStorage van een browser en kunnen van alles zijn.
 */
export function isBasisrooster(waarde: unknown): waarde is Basisrooster {
  if (!waarde || typeof waarde !== "object") return false;
  const o = waarde as { setup?: unknown; blokken?: unknown };
  return Boolean(o.setup) && typeof o.setup === "object" && Array.isArray(o.blokken);
}

/**
 * Van de vorm van de tool naar de blokken waar Mijn schooljaar mee rekent.
 * Pauzes en gym ("vast") tellen als les: ze horen bij je schooldag.
 */
export function naarBlokken(rooster: Basisrooster | null): Roosterblok[] {
  if (!rooster) return [];
  return rooster.blokken
    .filter((b) => b && dagNummer(b.dag) >= 0 && b.duur > 0)
    .map((b) => ({
      id: b.id,
      weekdag: dagNummer(b.dag),
      begin: minutenNaarTijd(b.start),
      eind: minutenNaarTijd(b.start + b.duur),
      vak: b.vak,
      naam: b.naam,
      soort: b.type === "taak" ? ("taak" as const) : ("les" as const),
    }))
    .sort((a, b) => a.weekdag - b.weekdag || a.begin.localeCompare(b.begin));
}

/**
 * De vroegste begintijd en de laatste eindtijd van de lesdagen, zodat de
 * weekweergave weet hoe hoog het raster moet zijn. Zonder rooster geven we een
 * gewone schooldag terug.
 */
export function rasterGrenzen(blokken: Roosterblok[]): { begin: string; eind: string } {
  const lessen = blokken.filter((b) => b.soort === "les");
  if (!lessen.length) return { begin: "08:30", eind: "15:00" };
  return {
    begin: lessen.map((b) => b.begin).sort()[0],
    eind: lessen.map((b) => b.eind).sort().at(-1) as string,
  };
}

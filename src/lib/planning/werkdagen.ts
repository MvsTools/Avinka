// Op welke dagen sta jij voor de klas?
//
// Parttime werken is in het basisonderwijs eerder regel dan uitzondering. Een
// voorgestelde taak die op je vrije woensdag afloopt helpt je niet: die zie je
// pas als het te laat is. Weten we je werkdagen, dan schuift zo'n taak naar je
// laatste werkdag ervóór.
//
// De vorm komt uit `instellingen.werkdagen`: een tekst met dagcijfers, 0 =
// maandag t/m 4 = vrijdag. Leeg betekent "niet gezegd" en dan rekenen we met
// alle vijf de schooldagen — nooit met minder, want een aanname die je dagen
// wégneemt maakt het scherm stiller dan het hoort te zijn.

import { plus, weekdag } from "./datum";

/** Alle schooldagen, als iemand niets heeft ingevuld. */
export const ALLE_SCHOOLDAGEN = [0, 1, 2, 3, 4];

export const DAGNAMEN_KORT = ["ma", "di", "wo", "do", "vr"];

/** "0134" → [0, 1, 3, 4]. Lege of onbegrepen invoer → alle schooldagen. */
export function leesWerkdagen(tekst: string | null | undefined): number[] {
  const cijfers = String(tekst ?? "")
    .split("")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 4);
  const uniek = [...new Set(cijfers)].sort((a, b) => a - b);
  return uniek.length ? uniek : ALLE_SCHOOLDAGEN;
}

/** [0, 1, 3, 4] → "0134", voor het opslaan. */
export function schrijfWerkdagen(dagen: number[]): string {
  return [...new Set(dagen)]
    .filter((n) => n >= 0 && n <= 4)
    .sort((a, b) => a - b)
    .join("");
}

/**
 * Zet één dag aan of uit en geef de nieuwe opslagwaarde terug.
 *
 * ⚠️ Werkt op de RAUWE tekst, niet op `leesWerkdagen`: leeg betekent in het
 * instellingenscherm "nog niets gekozen", terwijl het bij het rekenen juist
 * "alle dagen" betekent. Zou je hier `leesWerkdagen` gebruiken, dan zet je
 * eerste klik in één keer vier dagen aan.
 */
export function wisselWerkdag(tekst: string | null | undefined, dag: number): string {
  const nu = tekst ? leesWerkdagen(tekst) : [];
  return schrijfWerkdagen(nu.includes(dag) ? nu.filter((d) => d !== dag) : [...nu, dag]);
}

export function isWerkdag(datum: string, werkdagen: number[] = ALLE_SCHOOLDAGEN): boolean {
  return werkdagen.includes(weekdag(datum));
}

/**
 * De laatste dag waarop jij werkt, op of vóór `datum`.
 *
 * Gaan de rapporten op vrijdag mee en werk jij niet op vrijdag, dan wil je de
 * herinnering op donderdag. We kijken maximaal twee weken terug; vindt hij
 * niets (iemand die geen enkele dag werkt kan niet, maar toch), dan geven we
 * gewoon de oorspronkelijke datum terug — liever een taak op een rare dag dan
 * helemaal geen taak.
 */
export function laatsteWerkdagVoor(
  datum: string,
  werkdagen: number[] = ALLE_SCHOOLDAGEN,
): string {
  if (!werkdagen.length) return datum;
  for (let terug = 0; terug <= 14; terug++) {
    const dag = plus(datum, -terug);
    if (werkdagen.includes(weekdag(dag))) return dag;
  }
  return datum;
}

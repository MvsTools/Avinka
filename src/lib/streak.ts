// ════════════════════════════════════════════════════════════════════════
//  Streak-logica: het aantal opeenvolgende SCHOOLDAGEN dat een leerkracht
//  actief is op Avinka. Het weekend én schoolvakanties tellen niet mee én
//  breken de streak niet (dan werken we niet) — precies dezelfde regel voor
//  allebei. Vrijdag → maandag is dus gewoon "op rij", en de vrijdag vóór de
//  meivakantie → de maandag erna ook.
//
//  Pure functies, zonder database — bruikbaar op de server (tellen) en in de
//  browser (tonen). De vakantiedata zelf haalt de aanroeper op (regio via
//  haalRegio + beschikbareSchooljaren) en geeft die mee; zonder vakanties
//  vallen deze functies terug op alleen het weekend. Datums in
//  Europe/Amsterdam, als "JJJJ-MM-DD".
// ════════════════════════════════════════════════════════════════════════

import type { Vakantie } from "./planning/vakanties";

export function amsterdamDatum(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // JJJJ-MM-DD
}

// 0 = zondag … 6 = zaterdag
function dagVanWeek(datum: string): number {
  return new Date(datum + "T12:00:00Z").getUTCDay();
}

export function isWeekend(datum: string): boolean {
  const d = dagVanWeek(datum);
  return d === 0 || d === 6;
}

function vorigeKalenderdag(datum: string): string {
  const d = new Date(datum + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Valt deze dag in een van de gegeven vakanties? */
function valtInVakantie(datum: string, vakanties: Vakantie[]): boolean {
  return vakanties.some((v) => v.van <= datum && datum <= v.tot);
}

// Een dag die niet meetelt voor de streak (en 'm ook niet breekt): weekend of
// schoolvakantie. Zonder vakanties meegegeven is dat gewoon het weekend.
export function isVrijeDag(datum: string, vakanties: Vakantie[] = []): boolean {
  return isWeekend(datum) || valtInVakantie(datum, vakanties);
}

// Gaat maximaal dit veel dagen terug op zoek naar een schooldag — ruim boven
// de langste vakantie (zomer, een dag of 45), zodat een streak nooit door een
// bug in een oneindige lus vast kan lopen.
const MAX_TERUG = 90;

// De schooldag direct vóór deze schooldag: een gewoon weekend of vakantie
// wordt overgeslagen, precies zoals maandag al na vrijdag komt.
export function vorigeWerkdag(datum: string, vakanties: Vakantie[] = []): string {
  let d = vorigeKalenderdag(datum);
  for (let i = 0; i < MAX_TERUG && isVrijeDag(d, vakanties); i++) d = vorigeKalenderdag(d);
  return d;
}

// De laatste schooldag op of vóór deze datum (een weekend- of vakantiedag →
// de laatste schooldag ervoor).
export function laatsteWerkdag(datum: string, vakanties: Vakantie[] = []): string {
  let d = datum;
  for (let i = 0; i < MAX_TERUG && isVrijeDag(d, vakanties); i++) d = vorigeKalenderdag(d);
  return d;
}

// Leeft de opgeslagen streak nu nog? (laatste = de dag waarop je voor het laatst
// actief was). Zo niet, dan is de reeks verbroken en tonen we 0.
//
// Let op: dit houdt geen rekening met een vrijstelling die een echte gemiste
// dag zou opvangen (zie volgendeStreakStand) — dat is bewust alleen aan de
// schrijfkant opgelost. Bij een net gemiste dag toont dit scherm de streak dus
// heel even als verbroken, tot je de eerstvolgende keer weer een tool gebruikt
// en de vrijstelling 'm daar automatisch herstelt.
export function streakLeeftNog(laatste: string | null, nu: Date, vakanties: Vakantie[] = []): boolean {
  if (!laatste) return false;
  const vandaag = amsterdamDatum(nu);
  if (laatste === vandaag) return true;
  const ref = laatsteWerkdag(vandaag, vakanties); // de schooldag die "vandaag" vertegenwoordigt
  if (laatste === ref) return true;
  // Op een schooldag mag je ook de vorige schooldag nog hebben (vandaag nog niet actief).
  if (!isVrijeDag(vandaag, vakanties) && laatste === vorigeWerkdag(ref, vakanties)) return true;
  return false;
}

// ── Vrijstellingen: vangen precies één gemiste schooldag op ──────────────
// Elke STREAK_FREEZE_ELKE schooldagen streak verdien je er één bij, tot
// maximaal STREAK_FREEZE_MAX in voorraad — sta je al op het maximum, dan
// bewaar je de volgende niet (geen opsparen voorbij de grens).
export const STREAK_FREEZE_ELKE = 10; // 2 schoolweken
export const STREAK_FREEZE_MAX = 2;

export type StreakStand = { streak: number; streakMax: number; freezes: number };
export type StreakUitkomst = StreakStand & { laatste: string; freezeGebruikt: boolean };

/**
 * De nieuwe streak-stand na een actie op `vandaag` (de aanroeper checkt al dat
 * dit een echte schooldag is waarop nog niet eerder geteld is). Precies één
 * gemiste schooldag wordt opgevangen door een verdiende vrijstelling; is die
 * er niet, dan breekt de streak alsnog.
 */
export function volgendeStreakStand(
  vandaag: string,
  laatste: string | null,
  stand: StreakStand,
  vakanties: Vakantie[] = [],
): StreakUitkomst {
  const gisterenSchool = vorigeWerkdag(vandaag, vakanties);
  const eergisterenSchool = vorigeWerkdag(gisterenSchool, vakanties);

  let { streak, streakMax, freezes } = stand;
  let freezeGebruikt = false;

  if (laatste === gisterenSchool) {
    streak += 1;
  } else if (laatste === eergisterenSchool && freezes > 0) {
    streak += 1;
    freezes -= 1;
    freezeGebruikt = true;
  } else {
    streak = 1;
  }

  if (streak > streakMax) streakMax = streak;
  if (streak > 0 && streak % STREAK_FREEZE_ELKE === 0 && freezes < STREAK_FREEZE_MAX) freezes += 1;

  return { streak, streakMax, freezes, laatste: vandaag, freezeGebruikt };
}

// ── Mijlpalen: een leuke titel + trofee bij een bepaalde streaklengte ─────
// `reward` is de beloning die erbij hoort in het Beloningen-scherm (zie
// BeloningenView.tsx) — telt op basis van je hoogst ooit bereikte streak
// (streak_max), niet je actuele streak, anders zou een gebroken en opnieuw
// opgebouwde streak dezelfde beloning telkens opnieuw kunnen "verdienen".
export type Mijlpaal = { vanaf: number; titel: string; emoji: string; reward: string };
export const STREAK_MIJLPALEN: Mijlpaal[] = [
  { vanaf: 15, titel: "Op dreef", emoji: "🔥", reward: "15% korting volgende maand" },
  { vanaf: 30, titel: "In het ritme", emoji: "🏅", reward: "30% korting volgende maand" },
  { vanaf: 50, titel: "Doorzetter", emoji: "💪", reward: "50% korting volgende maand" },
  { vanaf: 100, titel: "Avinka-kampioen", emoji: "🏆", reward: "1 maand gratis" },
  { vanaf: 200, titel: "Avinka-legende", emoji: "👑", reward: "3 maanden gratis" },
  { vanaf: 500, titel: "Avinka voor altijd", emoji: "🌟", reward: "6 maanden gratis" },
];

export function huidigeMijlpaal(streak: number): Mijlpaal | null {
  let m: Mijlpaal | null = null;
  for (const x of STREAK_MIJLPALEN) if (streak >= x.vanaf) m = x;
  return m;
}

export function volgendeMijlpaal(streak: number): Mijlpaal | null {
  return STREAK_MIJLPALEN.find((x) => streak < x.vanaf) ?? null;
}

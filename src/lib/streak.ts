// ════════════════════════════════════════════════════════════════════════
//  Streak-logica: het aantal opeenvolgende WERKDAGEN dat een leerkracht actief
//  is op Avinka. Het weekend telt niet mee én breekt de streak niet (dan werken
//  we niet). Vrijdag → maandag is dus gewoon "op rij".
//
//  Pure functies, zonder database — bruikbaar op de server (tellen) en in de
//  browser (tonen). Datums in Europe/Amsterdam, als "JJJJ-MM-DD".
// ════════════════════════════════════════════════════════════════════════

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

// De werkdag direct vóór deze werkdag: maandag → vorige vrijdag, anders gisteren.
export function vorigeWerkdag(datum: string): string {
  const d = new Date(datum + "T12:00:00Z");
  const terug = d.getUTCDay() === 1 ? 3 : 1;
  d.setUTCDate(d.getUTCDate() - terug);
  return d.toISOString().slice(0, 10);
}

// De laatste werkdag op of vóór deze datum (een weekenddag → de vrijdag ervoor).
export function laatsteWerkdag(datum: string): string {
  let d = datum;
  while (isWeekend(d)) d = vorigeKalenderdag(d);
  return d;
}

// Leeft de opgeslagen streak nu nog? (laatste = de dag waarop je voor het laatst
// actief was). Zo niet, dan is de reeks verbroken en tonen we 0.
export function streakLeeftNog(laatste: string | null, nu: Date): boolean {
  if (!laatste) return false;
  const vandaag = amsterdamDatum(nu);
  if (laatste === vandaag) return true;
  const ref = laatsteWerkdag(vandaag); // de werkdag die "vandaag" vertegenwoordigt
  if (laatste === ref) return true;
  // Op een werkdag mag je ook de vorige werkdag nog hebben (vandaag nog niet actief).
  if (!isWeekend(vandaag) && laatste === vorigeWerkdag(ref)) return true;
  return false;
}

// ── Mijlpalen: een leuke titel + trofee bij een bepaalde streaklengte ─────
export type Mijlpaal = { vanaf: number; titel: string; emoji: string };
export const STREAK_MIJLPALEN: Mijlpaal[] = [
  { vanaf: 3, titel: "Op dreef", emoji: "🔥" },
  { vanaf: 5, titel: "Hele schoolweek", emoji: "🏅" },
  { vanaf: 10, titel: "Doorzetter", emoji: "💪" },
  { vanaf: 20, titel: "Avinka-kampioen", emoji: "🏆" },
  { vanaf: 40, titel: "Avinka-legende", emoji: "👑" },
];

export function huidigeMijlpaal(streak: number): Mijlpaal | null {
  let m: Mijlpaal | null = null;
  for (const x of STREAK_MIJLPALEN) if (streak >= x.vanaf) m = x;
  return m;
}

export function volgendeMijlpaal(streak: number): Mijlpaal | null {
  return STREAK_MIJLPALEN.find((x) => streak < x.vanaf) ?? null;
}

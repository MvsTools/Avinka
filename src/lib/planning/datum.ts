// Datumrekenen voor Mijn schooljaar.
//
// Eén afspraak in het hele onderdeel: een datum is altijd de tekst "JJJJ-MM-DD".
// Geen Date-objecten die heen en weer reizen, want daar gaat het bij zomertijd
// en tijdzones altijd mis. Rekenen doen we op klokslag 12 uur UTC: dan valt een
// dag nooit per ongeluk om.

/** Middaguur in UTC, zodat zomertijd nooit een dag verschuift. */
function punt(iso: string): Date {
  return new Date(iso + "T12:00:00Z");
}

/** De dag van vandaag in Nederland. */
export function vandaag(nu: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(nu);
}

/** 0 = maandag … 6 = zondag. Zo telt een schoolweek, niet zoals JavaScript. */
export function weekdag(iso: string): number {
  return (punt(iso).getUTCDay() + 6) % 7;
}

export function isWeekend(iso: string): boolean {
  return weekdag(iso) >= 5;
}

/** Een aantal dagen erbij (of eraf met een negatief getal). */
export function plus(iso: string, dagen: number): string {
  const d = punt(iso);
  d.setUTCDate(d.getUTCDate() + dagen);
  return d.toISOString().slice(0, 10);
}

/** Het aantal dagen van a naar b. Zelfde dag = 0. */
export function verschil(a: string, b: string): number {
  return Math.round((punt(b).getTime() - punt(a).getTime()) / 86400000);
}

/** De maandag van de week waarin deze datum valt. */
export function maandagVan(iso: string): string {
  return plus(iso, -weekdag(iso));
}

/** Valt deze datum binnen van..tot? Beide randen tellen mee. */
export function inBereik(iso: string, van: string, tot: string): boolean {
  return iso >= van && iso <= tot;
}

/** Alle datums van van..tot, beide randen mee. */
export function reeks(van: string, tot: string): string[] {
  const uit: string[] = [];
  for (let d = van; d <= tot; d = plus(d, 1)) uit.push(d);
  return uit;
}

/** Het weeknummer zoals scholen het gebruiken (ISO 8601). */
export function weeknummer(iso: string): number {
  const d = punt(iso);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + 3); // donderdag van deze week
  const eerste = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  eerste.setUTCDate(eerste.getUTCDate() - ((eerste.getUTCDay() + 6) % 7) + 3);
  return 1 + Math.round((d.getTime() - eerste.getTime()) / 604800000);
}

/** Hele schoolweken (maandag t/m vrijdag) tussen twee datums, randen mee. */
export function schoolweken(van: string, tot: string): number {
  return Math.max(0, Math.round(verschil(maandagVan(van), maandagVan(tot)) / 7) + 1);
}

// ── Voor op het scherm ────────────────────────────────────────────────────

const DAGEN = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];
const MAANDEN = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

export function dagnaam(iso: string): string {
  return DAGEN[weekdag(iso)];
}

export function maandnaam(iso: string): string {
  return MAANDEN[Number(iso.slice(5, 7)) - 1];
}

/** "12 november" */
export function kort(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${maandnaam(iso)}`;
}

/** "donderdag 12 november 2026" */
export function volledig(iso: string): string {
  return `${dagnaam(iso)} ${kort(iso)} ${iso.slice(0, 4)}`;
}

/**
 * Een periode in gewone taal: "12 t/m 16 november", of korter als het binnen
 * dezelfde maand valt. Voor één dag gewoon die dag.
 */
export function bereikTekst(van: string, tot: string): string {
  if (van === tot) return kort(van);
  const zelfdeMaand = van.slice(0, 7) === tot.slice(0, 7);
  const eerste = zelfdeMaand ? String(Number(van.slice(8, 10))) : kort(van);
  return `${eerste} t/m ${kort(tot)}`;
}

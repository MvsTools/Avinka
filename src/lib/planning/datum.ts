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
 * De titel van een afspraak zonder de datum die wij er zélf al bij zetten.
 *
 * Scholen zetten de datum vaak in de titel: "Zomerfeest disco 18 september
 * 2026". Staat daar in ons scherm "vrijdag 18 september" onder, dan lees je
 * hem twee keer. Dit haalt hem weg — waar hij ook staat: vooraan
 * ("18 september: Zomerfeest"), achteraan of tussendoor.
 *
 * 🔑 DE REGEL DIE DIT VEILIG MAAKT: alleen een datum die de ÓNZE is.
 * "Inschrijven vóór 10 september" bij een feest op 18 september blijft dus
 * staan — dat is geen herhaling maar informatie, en die weghalen is veel erger
 * dan hem twee keer tonen. Vandaar dat de datums waar het om gaat worden
 * meegegeven in plaats van dat we elke datum wegpoetsen.
 *
 * ⚠️ Drie dingen laat hij bewust met rust, allemaal echte schoolgevallen:
 * - `1/2` in "Groep 1/2 uitje" is geen 1 februari.
 * - een datum naast "t/m" of "tot" hoort bij een periode; er één uit slopen
 *   maakt van "3 t/m 4 augustus" een kreupel "3 t/m".
 * - een los jaartal ("Kamp 2026") is geen datum.
 * Blijft er na het schrappen niets over (de titel wás alleen een datum), dan
 * houden we de originele titel: een lege kop is erger dan een dubbele datum.
 */
export function zonderDatum(titel: string, datums: string[]): string {
  const doelen = datums.filter(Boolean).map((d) => ({
    dag: Number(d.slice(8, 10)),
    maand: Number(d.slice(5, 7)),
    jaar: Number(d.slice(0, 4)),
  }));
  if (!doelen.length || !titel) return titel;

  // "vrijdag 18 september 2026" / "vr 18 sep" / "18 september"
  // ⚠️ De weekdagen staan hier VOLUIT plus als afkorting, met een \b erachter.
  // Eerst stond er `(ma|di|wo|do|vr|za|zo)[a-z]*` en dat vrat halve woorden op:
  // "Zomerfeest disco 18 september" werd "Zomerfeest", want "disco" begint met
  // "di". Gevonden door het te testen, niet door ernaar te kijken.
  const tekstueel =
    /(?:\b(?:maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag|ma|di|wo|do|vr|za|zo)\b\.?\s+)?\b(\d{1,2})\s+(jan|feb|mrt|maa|apr|mei|jun|jul|aug|sep|okt|nov|dec)[a-z]*\.?(?:\s+(\d{4}))?/gi;
  // "18-09-2026" / "18/9"
  const numeriek = /\b(\d{1,2})[-/](\d{1,2})(?:[-/](\d{2,4}))?\b/g;
  const AFK = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

  function magWeg(heel: string, dag: number, maand: number, jaar: number | null, index: number) {
    if (!doelen.some((d) => d.dag === dag && d.maand === maand && (jaar === null || d.jaar === jaar)))
      return false;
    const ervoor = titel.slice(Math.max(0, index - 12), index).toLowerCase();
    const erna = titel.slice(index + heel.length, index + heel.length + 6).toLowerCase();
    if (/groep\s*$/.test(ervoor)) return false;
    if (/(t\/m|tot)\s*$/.test(ervoor) || /^\s*(t\/m|tot)\b/.test(erna)) return false;
    return true;
  }

  let uit = titel.replace(tekstueel, (heel, d, m, j, index: number) => {
    const maand = AFK.indexOf(String(m).toLowerCase().slice(0, 3)) + 1;
    // "maa" van maart valt buiten de afkortingenlijst; die vangen we hier op.
    const maandNr = maand > 0 ? maand : String(m).toLowerCase().startsWith("maa") ? 3 : 0;
    if (!maandNr) return heel;
    return magWeg(heel, Number(d), maandNr, j ? Number(j) : null, index) ? " " : heel;
  });

  uit = uit.replace(numeriek, (heel, d, m, j, index: number) => {
    const jaar = j ? Number(j.length === 2 ? `20${j}` : j) : null;
    // De index verwijst naar de al bewerkte tekst; voor de buur-controle is dat
    // precies wat we willen (we kijken naar wat er NU omheen staat).
    const ervoor = uit.slice(Math.max(0, index - 12), index).toLowerCase();
    if (/groep\s*$/.test(ervoor)) return heel;
    if (/(t\/m|tot)\s*$/.test(ervoor)) return heel;
    if (!doelen.some((x) => x.dag === Number(d) && x.maand === Number(m) && (jaar === null || x.jaar === jaar)))
      return heel;
    return " ";
  });

  const schoon = uit
    .replace(/\(\s*\)|\[\s*\]/g, "") // haakjes die leeg achterbleven
    .replace(/\s+/g, " ")
    .replace(/^[\s:;,\-–—|]+/, "")
    .replace(/[\s:;,\-–—|]+$/, "")
    .trim();
  return schoon || titel;
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

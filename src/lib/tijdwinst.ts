// ════════════════════════════════════════════════════════════════════════
//  Tijdwinst — ÉÉN bron van waarheid voor "hoeveel tijd heb je bespaard?"
//
//  Adaptief: de winst wordt berekend uit de ECHTE omvang van wat je maakte
//  (aantal woorden van de tekst, aantal geanalyseerde onderdelen, aantal
//  leerlingen), niet uit een vast getal per soort. De code rekent dit uit —
//  de AI verzint hier nooit een getal (conform onze werkregel).
//
//  Toon: eerlijk-conservatief. We rekenen je schrijf-/denktijd, met een
//  BESCHEIDEN aftrek voor het nalezen/bijschaven (verwerkt in `perWoord`), en
//  een redelijk plafond (`max`) zodat het nooit overdreven aanvoelt. Doel: een
//  leerkracht denkt "dit scheelt me echt tijd", niet "dit had ik zelf in 5 min".
//
//  WIL JE BIJSTELLEN? Pas alleen de getallen in CFG hieronder aan.
// ════════════════════════════════════════════════════════════════════════

// Het omvang-signaal dat een tool meestuurt bij een afgeronde actie.
export type TijdSignaal = {
  woorden?: number; // aantal woorden van de gegenereerde tekst (schrijf-tools)
  items?: number; // aantal geanalyseerde onderdelen (Toetsanalyse)
  leerlingen?: number; // aantal leerlingen (Plattegrond)
};

// Per actie:
//  - basis      = vaste opstarttijd (de tekst opzetten / erover nadenken), in min
//  - perWoord   = NETTO gewonnen minuten per woord (jouw schrijftijd minus je
//                 naleestijd — bewust niet zwaar afgetrokken)
//  - perItem    = gewonnen minuten per geanalyseerd onderdeel (Toetsanalyse)
//  - perLeerling= gewonnen minuten per leerling (Plattegrond)
//  - max        = redelijk plafond per actie (nooit overdreven)
//  - vast       = terugvalwaarde als er (nog) geen omvang-signaal is, en de
//                 waarde waarmee oude tellingen zijn meegeteld (continuïteit)
//  - label/kort/icon/kleur = weergave in Statistieken/Admin
type Cfg = {
  basis: number;
  perWoord?: number;
  perItem?: number;
  perLeerling?: number;
  max: number;
  vast: number;
  label: string;
  kort: string;
  icon: string;
  kleur: string;
};

const CFG: Record<string, Cfg> = {
  rapport: {
    basis: 4, perWoord: 0.09, max: 30, vast: 10,
    label: "Rapporten geschreven", kort: "Rapporten", icon: "📝", kleur: "#7c3aed",
  },
  analyse: {
    basis: 25, perItem: 1.3, max: 180, vast: 120,
    label: "Toetsanalyses gedaan", kort: "Analyses", icon: "📊", kleur: "#2f9e6e",
  },
  gesprek: {
    basis: 6, perWoord: 0.08, max: 45, vast: 20,
    label: "Oudergesprekken uitgewerkt", kort: "Gesprekken", icon: "🗣️", kleur: "#0ea5e9",
  },
  weekbericht: {
    basis: 3, perWoord: 0.07, max: 35, vast: 15,
    label: "Weekberichten", kort: "Weekbericht", icon: "🗓️", kleur: "#f59e0b",
  },
  nieuwsbrief: {
    basis: 4, perWoord: 0.07, max: 60, vast: 30,
    label: "Nieuwsbrieven", kort: "Nieuwsbrief", icon: "📰", kleur: "#db2777",
  },
  bericht: {
    basis: 2, perWoord: 0.06, max: 20, vast: 10,
    label: "Oudercontact-berichten", kort: "Oudercontact", icon: "💬", kleur: "#059669",
  },
  brief: {
    basis: 3, perWoord: 0.07, max: 40, vast: 15,
    label: "Informatiebrieven", kort: "Brieven", icon: "📄", kleur: "#0891b2",
  },
  uitnodiging: {
    basis: 3, perWoord: 0.07, max: 30, vast: 20,
    label: "Uitnodigingen", kort: "Uitnodiging", icon: "✉️", kleur: "#e11d48",
  },
  plattegrond: {
    basis: 6, perLeerling: 0.4, max: 25, vast: 15,
    label: "Plattegronden gemaakt", kort: "Plattegrond", icon: "🗺️", kleur: "#6366f1",
  },
};

// Volgorde + weergavegegevens voor de schermen (Statistieken, Admin).
export type TijdDef = {
  sleutel: string;
  label: string;
  kort: string;
  icon: string;
  kleur: string;
  vast: number;
};
export const TIJD_DEFS: TijdDef[] = Object.entries(CFG).map(([sleutel, c]) => ({
  sleutel,
  label: c.label,
  kort: c.kort,
  icon: c.icon,
  kleur: c.kleur,
  vast: c.vast,
}));

// Berekent de bespaarde minuten voor ÉÉN afgeronde actie, uit het omvang-signaal.
// Geen signaal (of onbekende soort) → terugval op de vaste waarde. Altijd
// minstens 1 minuut en nooit boven het plafond.
export function minutenVoor(type: string, signaal?: TijdSignaal | null): number {
  const c = CFG[type];
  if (!c) return 0;
  let m: number;
  if (c.perWoord != null && signaal?.woorden != null) {
    m = c.basis + signaal.woorden * c.perWoord;
  } else if (c.perItem != null && signaal?.items != null) {
    m = c.basis + signaal.items * c.perItem;
  } else if (c.perLeerling != null && signaal?.leerlingen != null) {
    m = c.basis + signaal.leerlingen * c.perLeerling;
  } else {
    m = c.vast; // geen bruikbaar signaal → oude gedrag
  }
  return Math.max(1, Math.min(Math.round(m), c.max));
}

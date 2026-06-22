// ════════════════════════════════════════════════════════════════════════
//  Abonnementen — ÉÉN bron van waarheid.
//
//  Hier staan de drie pakketten, de prijzen, wat elke tier krijgt, welk
//  AI-model erbij hoort en de toegangsregels. Wil je iets aan de abonnementen
//  veranderen? Doe het hier, dan werkt het overal door (dashboard + later Mollie).
//
//  VEILIGHEIDSVLAG: zolang `BETALINGEN_LIVE` uit staat, krijgt IEDEREEN volledige
//  toegang (de testfase). Niemand wordt dan buitengesloten als de gratis proef
//  afloopt, en de AI-modellen blijven zoals de tools ze zelf kiezen. Pas als
//  Mollie live is, zet je NEXT_PUBLIC_BETALINGEN_LIVE=true en gelden de echte
//  tier-regels.
// ════════════════════════════════════════════════════════════════════════

export type PlanId = "start" | "compleet" | "pro";
export type Vorm = "maand" | "jaar";
export type AbonStatus = "proef" | "actief" | "opgezegd" | "verlopen";

export const BETALINGEN_LIVE =
  process.env.NEXT_PUBLIC_BETALINGEN_LIVE === "true";

export const PROEF_DAGEN = 7;

// ── De drie pakketten ─────────────────────────────────────────────────────
export type Plan = {
  id: PlanId;
  naam: string;
  prijsMaand: number; // in euro, per maand
  tagline: string;
  held?: boolean; // de uitgelichte "held" (Compleet)
  // 'alle'  = alle tools; 'keuze' = één zelfgekozen tool (Start)
  toegang: "alle" | "keuze";
  voordelen: string[];
};

export const PLANNEN: Plan[] = [
  {
    id: "start",
    naam: "Start",
    prijsMaand: 5.99,
    tagline: "Voor wie er één tool uit wil halen",
    toegang: "keuze",
    voordelen: [
      "Eén tool naar keuze",
      "Onbeperkt gebruik",
      "Je klas bewaard",
      "Namen blijven op je eigen apparaat",
    ],
  },
  {
    id: "compleet",
    naam: "Compleet",
    prijsMaand: 9.99,
    tagline: "Alles wat je nodig hebt, op één plek",
    held: true,
    toegang: "alle",
    voordelen: [
      "Alles van Start",
      "Alle vier de tools, onbeperkt",
      "Meerdere groepen beheren",
      "Alles bewaren en ordenen in Bestanden",
      "Een sterk AI-model voor betere teksten",
    ],
  },
  {
    id: "pro",
    naam: "Pro",
    prijsMaand: 16.99,
    tagline: "Voor wie het maximale eruit haalt",
    toegang: "alle",
    voordelen: [
      "Alles van Compleet",
      "Het sterkste AI-model voor de meest genuanceerde teksten",
      "Voorrang als het druk is",
      "Als eerste toegang tot nieuwe tools",
    ],
  },
];

export function planById(id: string | null | undefined): Plan | undefined {
  return PLANNEN.find((p) => p.id === id);
}

// Hoeveel klassen/groepen mag een plan beheren?
export const KLAS_LIMIET: Record<PlanId, number> = {
  start: 1,
  compleet: 3,
  pro: 3,
};

// Het aantal groepen dat deze gebruiker mag beheren. Tijdens de testfase
// (vlag uit) geen limiet; in de proef het Compleet-niveau; daarna per plan.
export function klasLimiet(ab: Abonnement, nu: Date = new Date()): number {
  if (!BETALINGEN_LIVE) return Infinity;
  if (proefLoopt(ab, nu)) return KLAS_LIMIET.compleet;
  if (ab.plan) return KLAS_LIMIET[ab.plan];
  return KLAS_LIMIET.start;
}

// ── AI-model per tier ─────────────────────────────────────────────────────
// Dekt ook de AI-kosten: Start = zuinig basismodel, Compleet = sterk,
// Pro = het sterkste. Tijdens de gratis proef geven we het Compleet-model,
// zodat mensen meteen goede resultaten zien. Pas hier aan om kosten te sturen.
export const MODEL_PER_PLAN: Record<PlanId | "proef", string> = {
  start: "claude-haiku-4-5-20251001",
  compleet: "claude-sonnet-4-6",
  pro: "claude-opus-4-8",
  proef: "claude-sonnet-4-6",
};

// ── De abonnementsstand van een gebruiker ─────────────────────────────────
export type Abonnement = {
  plan: PlanId | null; // gekozen betaald plan; null tijdens de proef
  vorm: Vorm | null;
  status: AbonStatus;
  proefEindigt: string | null; // ISO-datum
  periodeEindigt: string | null; // einde betaalde periode (ISO)
  startTool: string | null; // gekozen tool bij Start
};

// De databasekolommen + de vertaling van een ruwe rij naar een Abonnement.
// Eén plek, zodat de browser (db.ts) en de server (/api/claude) hetzelfde doen.
export const ABON_COLS =
  "abon_plan, abon_vorm, abon_status, proef_eindigt, periode_eindigt, start_tool, created_at";

export type AbonnementRow = {
  abon_plan: string | null;
  abon_vorm: string | null;
  abon_status: string | null;
  proef_eindigt: string | null;
  periode_eindigt: string | null;
  start_tool: string | null;
  created_at: string | null;
};

export function mapAbonnementRow(d: AbonnementRow | null): Abonnement {
  if (!d) return nieuwAbonnement();
  // Proef-einddatum: opgeslagen datum, anders 7 dagen na aanmaak.
  let proefEindigt = d.proef_eindigt;
  if (!proefEindigt && d.created_at) {
    const e = new Date(d.created_at);
    e.setDate(e.getDate() + PROEF_DAGEN);
    proefEindigt = e.toISOString();
  }
  return {
    plan: (d.abon_plan as PlanId | null) ?? null,
    vorm: (d.abon_vorm as Vorm | null) ?? null,
    status: (d.abon_status as AbonStatus | null) ?? "proef",
    proefEindigt: proefEindigt ?? nieuwAbonnement().proefEindigt,
    periodeEindigt: d.periode_eindigt ?? null,
    startTool: d.start_tool ?? null,
  };
}

// De standaardstand voor een nieuw account: 7 dagen gratis proef.
export function nieuwAbonnement(nu: Date = new Date()): Abonnement {
  const eind = new Date(nu);
  eind.setDate(eind.getDate() + PROEF_DAGEN);
  return {
    plan: null,
    vorm: null,
    status: "proef",
    proefEindigt: eind.toISOString(),
    periodeEindigt: null,
    startTool: null,
  };
}

// Hoeveel hele dagen proef resteren er nog (0 als verlopen).
export function proefDagenResterend(ab: Abonnement, nu: Date = new Date()): number {
  if (!ab.proefEindigt) return 0;
  const eind = new Date(ab.proefEindigt).getTime();
  const ms = eind - nu.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / (1000 * 60 * 60 * 24));
}

// Loopt de gratis proef nog?
export function proefLoopt(ab: Abonnement, nu: Date = new Date()): boolean {
  return ab.status === "proef" && proefDagenResterend(ab, nu) > 0;
}

// Mag deze gebruiker de tools überhaupt gebruiken?
// Zolang betalingen niet live zijn: iedereen ja (testfase).
export function heeftToegang(ab: Abonnement, nu: Date = new Date()): boolean {
  if (!BETALINGEN_LIVE) return true;
  if (proefLoopt(ab, nu)) return true;
  return ab.status === "actief" || ab.status === "opgezegd";
}

// Mag deze gebruiker een specifieke tool openen?
// Start = alleen de zelfgekozen tool; proef en Compleet/Pro = alles.
export function magToolGebruiken(
  ab: Abonnement,
  slug: string,
  nu: Date = new Date(),
): boolean {
  if (!BETALINGEN_LIVE) return true;
  if (!heeftToegang(ab, nu)) return false;
  if (proefLoopt(ab, nu)) return true;
  if (ab.plan === "start") return ab.startTool === slug;
  return ab.plan === "compleet" || ab.plan === "pro";
}

// Mag deze gebruiker de Bestanden gebruiken (bewaren/ordenen van teksten en
// plattegronden)? Hoort bij Compleet en Pro (en de proef). Start = niet.
export function magBestandenGebruiken(
  ab: Abonnement,
  nu: Date = new Date(),
): boolean {
  if (!BETALINGEN_LIVE) return true;
  if (!heeftToegang(ab, nu)) return false;
  if (proefLoopt(ab, nu)) return true;
  return ab.plan === "compleet" || ab.plan === "pro";
}

// Welk AI-model hoort bij deze gebruiker? null = niets overschrijven
// (de tool houdt zijn eigen keuze — zo werkt het tijdens de testfase).
export function modelVoor(ab: Abonnement, nu: Date = new Date()): string | null {
  if (!BETALINGEN_LIVE) return null;
  if (proefLoopt(ab, nu)) return MODEL_PER_PLAN.proef;
  if (ab.plan) return MODEL_PER_PLAN[ab.plan];
  return MODEL_PER_PLAN.proef;
}

// Een schooljaar-abonnement: juli en augustus zijn gratis. Je betaalt gewoon
// per maand, maar over een heel jaar dus 10 in plaats van 12 keer. Eén plek,
// zodat de schermen (en later de incasso-logica) hetzelfde rekenen.
export const GRATIS_MAANDEN_JAAR = 2;
export const BETAALDE_MAANDEN_JAAR = 12 - GRATIS_MAANDEN_JAAR;

// Het totale jaarbedrag (10 × het maandbedrag) — puur informatief / voor de
// latere incasso-berekening. Er wordt nooit een heel jaar in één keer afgerekend.
export function jaarPrijs(prijsMaand: number): number {
  return Math.round(prijsMaand * BETAALDE_MAANDEN_JAAR * 100) / 100;
}

// Nette prijsweergave, bv. "€5,99".
export function prijsTekst(euro: number): string {
  return "€" + euro.toFixed(2).replace(".", ",");
}

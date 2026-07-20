// ════════════════════════════════════════════════════════════════════════
//  AI-KOSTENPLAFOND per account per maand.
//
//  Waarom dit bestaat: /api/claude had geen enkele rem. Ingelogd zijn was
//  genoeg, dus één account kon onbeperkt AI-kosten maken. Dat is een risico
//  bij een gedeeld schoolaccount, maar vooral bij de proefgroep, waar de
//  eigenaar de rekening zelf betaalt.
//
//  Hoe het werkt: vóór elke AI-aanroep telt de route op wat dit account deze
//  kalendermaand heeft verbruikt (uit de bestaande tabel `ai_verbruik`),
//  rekent dat om naar euro's, en blokkeert netjes boven de grens. Er is GEEN
//  nieuwe database-tabel of SQL voor nodig.
//
//  Grenzen bijstellen? Alleen de tabel MAAND_LIMIET hieronder aanpassen.
// ════════════════════════════════════════════════════════════════════════

import type { Abonnement, PlanId } from "@/lib/abonnement";
import { proefLoopt } from "@/lib/abonnement";

// ── De grens per pakket, in euro per kalendermaand ────────────────────────
// Gekozen op basis van echt gemeten verbruik (juli 2026): een leerkracht komt
// in een zware rapportmaand rond de €3 uit, in een gewone maand rond de €1.
// Deze grenzen raakt een normale gebruiker dus nooit; drie leerkrachten die
// één account delen lopen er wél tegenaan. Zie ook de prijzen in
// abonnement.ts — een grens mag nooit boven de opbrengst van het pakket uit.
export const MAAND_LIMIET: Record<PlanId | "proef", number> = {
  start: 5,
  compleet: 8,
  pro: 8,
  proef: 5,
};

// ── Tarieven per model, in dollar per miljoen tokens ──────────────────────
// Bron: de officiële prijslijst. Let op: dit zijn DOLLARS; de omrekening naar
// euro gebeurt onderaan. Nieuw model erbij? Hier een regel toevoegen.
type Tarief = { in: number; uit: number };

const TARIEVEN: Array<{ prefix: string; tarief: Tarief }> = [
  { prefix: "claude-haiku-4-5", tarief: { in: 1, uit: 5 } },
  { prefix: "claude-sonnet-4-6", tarief: { in: 3, uit: 15 } },
  { prefix: "claude-sonnet-5", tarief: { in: 3, uit: 15 } },
  { prefix: "claude-opus-4-6", tarief: { in: 5, uit: 25 } },
  { prefix: "claude-opus-4-7", tarief: { in: 5, uit: 25 } },
  { prefix: "claude-opus-4-8", tarief: { in: 5, uit: 25 } },
];

// Onbekend model: reken met het duurste tarief dat we kennen. Liever te hoog
// schatten dan een onbekend model gratis laten doorlopen.
const DUURSTE: Tarief = { in: 5, uit: 25 };

// Prompt caching: schrijven kost 1,25× het invoertarief, lezen 0,1×.
const CACHE_SCHRIJF_FACTOR = 1.25;
const CACHE_LEES_FACTOR = 0.1;

// Ruwe omrekenkoers. Hoeft niet exact te zijn: dit dient om een plafond te
// bewaken, niet om een factuur te maken.
const EURO_PER_DOLLAR = 0.92;

function tariefVoor(model: string | null): Tarief {
  if (!model) return DUURSTE;
  const m = model.toLowerCase();
  const hit = TARIEVEN.find((t) => m.startsWith(t.prefix));
  return hit ? hit.tarief : DUURSTE;
}

// ── Eén rij uit `ai_verbruik` omrekenen naar euro ─────────────────────────
export type VerbruikRij = {
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cache_creation_tokens: number | null;
  cache_read_tokens: number | null;
};

export function kostenVanRij(rij: VerbruikRij): number {
  const t = tariefVoor(rij.model);
  const invoer = rij.input_tokens ?? 0;
  const uitvoer = rij.output_tokens ?? 0;
  const cacheSchrijf = rij.cache_creation_tokens ?? 0;
  const cacheLees = rij.cache_read_tokens ?? 0;

  const dollars =
    (invoer * t.in +
      uitvoer * t.uit +
      cacheSchrijf * t.in * CACHE_SCHRIJF_FACTOR +
      cacheLees * t.in * CACHE_LEES_FACTOR) /
    1_000_000;

  return dollars * EURO_PER_DOLLAR;
}

export function kostenVanRijen(rijen: VerbruikRij[]): number {
  return rijen.reduce((som, r) => som + kostenVanRij(r), 0);
}

// ── Welke grens geldt voor deze gebruiker? ────────────────────────────────
// Bewust ONAFHANKELIJK van BETALINGEN_LIVE: ook tijdens de testfase moet er
// een rem staan, want dan betaalt de eigenaar de AI-kosten zelf.
export function limietVoor(ab: Abonnement, nu: Date = new Date()): number {
  if (proefLoopt(ab, nu)) return MAAND_LIMIET.proef;
  if (ab.plan) return MAAND_LIMIET[ab.plan];
  return MAAND_LIMIET.proef;
}

// Het begin van de huidige kalendermaand, als ISO-tekst voor de query.
export function beginVanDezeMaand(nu: Date = new Date()): string {
  return new Date(Date.UTC(nu.getUTCFullYear(), nu.getUTCMonth(), 1)).toISOString();
}

// De melding die de gebruiker te zien krijgt. De tools tonen deze tekst
// letterlijk, dus schrijf hem menselijk en met een uitweg erin.
export function limietMelding(limiet: number): string {
  return (
    "Je hebt deze maand het maximum aan AI-gebruik bereikt " +
    "(ongeveer €" +
    limiet.toFixed(2).replace(".", ",") +
    "). Volgende maand kun je weer verder. " +
    "Heb je meer nodig, of klopt dit niet? Neem even contact op, dan kijken we mee."
  );
}

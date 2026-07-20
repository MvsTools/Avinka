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

import type { Abonnement } from "@/lib/abonnement";
import { CREDITS_PER_PLAN, proefLoopt } from "@/lib/abonnement";

// ── De grens per pakket ───────────────────────────────────────────────────
// Gekozen op basis van echt gemeten verbruik (juli 2026): een leerkracht komt
// in een zware rapportmaand rond de €3 uit (60 credits), in een gewone maand
// rond de €1. Geen enkele echte gebruiker komt dus in de buurt.
//
// De pakketten lopen bewust ver uiteen, zodat Pro ook op de meter voelt als
// meer. LET OP wat dat betekent: met deze ruimte is dit plafond vooral een
// noodrem tegen ontsporende kosten, en NIET meer de rem op accountdelen —
// drie leerkrachten samen halen de Compleet-grens niet. Delen moet dus komen
// van de klaslimiet per pakket (nog te bouwen), niet van deze credits.
// Het aantal credits per pakket staat in abonnement.ts (CREDITS_PER_PLAN),
// want dat is óók wat er op de pakketkaartjes staat. Eén bron, dus de
// verkooptekst en de echte grens kunnen niet uit elkaar lopen.
//
// Bij de gekozen aantallen ligt de inkoopwaarde onder de opbrengst van het
// pakket (Start €5,99, Compleet €9,99, Pro €16,99), zodat één ontspoorde
// gebruiker nooit geld kost.

// ── Credits: wat de gebruiker ziet ────────────────────────────────────────
// Naar buiten toe praten we over "credits", niet over euro's. Twee redenen:
// een leerkracht hoeft onze inkoopprijs niet te kennen, en zo kunnen we de
// euro-waarde bijstellen zonder dat het getal op het scherm verspringt.
// 20 credits = €1, dus: Start en proef 100 credits, Compleet en Pro 160.
export const CREDITS_PER_EURO = 20;

export function naarCredits(euro: number): number {
  return Math.round(euro * CREDITS_PER_EURO);
}

// ── Wat kost één volledige actie, in credits? ─────────────────────────────
// Ruwe schatting op basis van gemeten verbruik (juli 2026), bewust aan de
// ruime kant. Dit is ALLEEN voor de controle vooraf: "heb je genoeg voor een
// hele run?" Zo valt niemand halverwege een analyse stil. De echte afrekening
// gaat altijd op werkelijk verbruik.
// Let op: de eenheid is "één run zoals de gebruiker die start". Bij
// Toetsanalyse is dat een hele analyse (tien tot vijftien AI-aanroepen), bij
// Rapporten één rapport voor één kind.
export const KOSTEN_SCHATTING: Record<string, number> = {
  toetsanalyse: 10,
  rapporten: 2,
  werkbladen: 3,
  lesontwerp: 3,
  draaiboek: 5,
  oudercontact: 2,
};

export function schattingVoor(tool: string | null): number {
  if (!tool) return 3;
  return KOSTEN_SCHATTING[tool] ?? 3;
}

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

// ── Welke grens geldt voor deze gebruiker, in CREDITS? ────────────────────
// Bewust ONAFHANKELIJK van BETALINGEN_LIVE: ook tijdens de testfase moet er
// een rem staan, want dan betaalt de eigenaar de AI-kosten zelf.
export function limietVoor(ab: Abonnement, nu: Date = new Date()): number {
  if (proefLoopt(ab, nu)) return CREDITS_PER_PLAN.proef;
  if (ab.plan) return CREDITS_PER_PLAN[ab.plan];
  return CREDITS_PER_PLAN.proef;
}

// Wat heeft deze gebruiker deze maand verbruikt, in credits?
export function verbruikInCredits(rijen: VerbruikRij[]): number {
  return naarCredits(kostenVanRijen(rijen));
}

// Het begin van de huidige kalendermaand, als ISO-tekst voor de query.
export function beginVanDezeMaand(nu: Date = new Date()): string {
  return new Date(Date.UTC(nu.getUTCFullYear(), nu.getUTCMonth(), 1)).toISOString();
}

// De melding die de gebruiker te zien krijgt. De tools tonen deze tekst
// letterlijk, dus schrijf hem menselijk en met een uitweg erin.
// Bewust ZONDER bedragen of aantallen: het plafond draait op de achtergrond
// en een normale gebruiker komt er nooit. Wie deze tekst wél ziet, heeft meer
// aan een vervolgstap dan aan een getal.
export function limietMelding(_limiet?: number): string {
  return (
    "Je hebt deze maand veel van de tools gebruikt en bent aan je maandtegoed toe. " +
    "Aan het begin van de nieuwe maand kun je gewoon weer verder. " +
    "Wil je eerder verder? Kijk bij je abonnement, of neem even contact op."
  );
}

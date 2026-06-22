// Geschatte AI-kosten op basis van de Anthropic-lijstprijzen.
//
// ⚠️ CONTROLEER deze bedragen tegen de actuele prijzen van Anthropic en pas ze
//    hier aan als ze wijzigen. Het zijn prijzen in US dollar per 1 miljoen tokens.
//    De tokens zelf worden exact gelogd; dit is alleen de omrekening naar kosten.
type Prijs = {
  input: number; // gewone invoer-tokens
  output: number; // uitvoer-tokens
  cacheWrite: number; // prompt-cache aanmaken
  cacheRead: number; // prompt-cache teruglezen (veel goedkoper)
};

// Per modelfamilie. Onbekende modellen vallen terug op het Sonnet-tarief.
const PRIJZEN: Record<"opus" | "sonnet" | "haiku", Prijs> = {
  opus: { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 },
  sonnet: { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  haiku: { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.1 },
};

function familie(model?: string | null): "opus" | "sonnet" | "haiku" {
  const m = (model || "").toLowerCase();
  if (m.includes("opus")) return "opus";
  if (m.includes("haiku")) return "haiku";
  return "sonnet";
}

export type TokenSom = {
  input: number;
  output: number;
  cache_creation: number;
  cache_read: number;
};

// Geschatte kosten in US dollar voor een hoeveelheid tokens van een bepaald model.
export function kostenUSD(model: string | null | undefined, t: TokenSom): number {
  const p = PRIJZEN[familie(model)];
  return (
    (t.input * p.input +
      t.output * p.output +
      t.cache_creation * p.cacheWrite +
      t.cache_read * p.cacheRead) /
    1_000_000
  );
}

// Nette weergave, bijv. "$12,34" (of "$0,07" bij kleine bedragen).
export function kostenTekst(usd: number): string {
  return "$" + usd.toFixed(2).replace(".", ",");
}

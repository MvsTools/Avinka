import { schoolweken } from "@/lib/planning";
import type { Periode, Soort } from "@/lib/planning";

/**
 * "nog 4 weken tot de kerstvakantie" — hoe leerkrachten aftellen. Op één plek,
 * zodat de lijst en de kalender exact dezelfde tekst tonen. In de laatste week
 * wordt het "laatste week tot de ...".
 */
export function aftellenTotVakantie(periode: Periode, vandaag: string): string {
  const rest = Math.max(0, periode.weken - schoolweken(periode.van, vandaag));
  const vak = periode.eindigtMet?.naam.toLowerCase() ?? "vakantie";
  return rest === 0
    ? `laatste week tot de ${vak}`
    : `nog ${rest} ${rest === 1 ? "week" : "weken"} tot de ${vak}`;
}

// Hoe een soort afspraak eruitziet in Mijn schooljaar. Op één plek, zodat de
// lijst, de kalender en straks je lesdag dezelfde taal spreken.
//
// Elk soort krijgt een WOORD, niet alleen een kleur: wie kleuren slecht
// onderscheidt moet net zo goed kunnen zien wat er staat.

export const ETIKET: Record<Soort, { woord: string; stijl: string }> = {
  vakantie: { woord: "Vakantie", stijl: "bg-brand-soft text-brand-dark" },
  // Bewust niet "Vrije dag": een studiedag is vrij voor de kinderen, maar voor
  // de leerkracht gewoon een werkdag. "Geen les" klopt voor allebei.
  vrij: { woord: "Geen les", stijl: "bg-brand-soft text-brand-dark" },
  rapport: { woord: "Rapporten", stijl: "bg-accent-soft text-amber-800" },
  gesprek: { woord: "Gesprekken", stijl: "border border-brand/35 bg-white text-brand-dark" },
  vergadering: { woord: "Vergadering", stijl: "bg-cream text-ink/60" },
  toets: { woord: "Toetsen", stijl: "bg-accent-soft text-amber-800" },
  activiteit: { woord: "Activiteit", stijl: "bg-cream text-ink/60" },
  overig: { woord: "Afspraak", stijl: "bg-cream text-ink/60" },
};

/** Het stipje in de kalender op een telefoon, waar geen tekst bij past. */
export const STIP: Record<Soort, string> = {
  vakantie: "bg-brand-dark",
  vrij: "bg-brand-dark",
  rapport: "bg-amber-500",
  gesprek: "border-2 border-brand-dark",
  vergadering: "bg-ink/40",
  toets: "bg-amber-500",
  activiteit: "bg-ink/40",
  overig: "bg-ink/25",
};

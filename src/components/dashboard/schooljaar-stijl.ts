import type { Soort } from "@/lib/planning";

// Hoe een soort afspraak eruitziet in Mijn schooljaar. Op één plek, zodat de
// lijst, de kalender en straks je lesdag dezelfde taal spreken.
//
// Elk soort krijgt een WOORD, niet alleen een kleur: wie kleuren slecht
// onderscheidt moet net zo goed kunnen zien wat er staat.

export const ETIKET: Record<Soort, { woord: string; stijl: string }> = {
  vakantie: { woord: "Vakantie", stijl: "bg-brand-soft text-brand-dark" },
  vrij: { woord: "Vrije dag", stijl: "bg-brand-soft text-brand-dark" },
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

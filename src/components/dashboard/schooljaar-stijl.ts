import type { Soort } from "@/lib/planning";

// Hoe een soort afspraak eruitziet in Mijn schooljaar. Op één plek, zodat de
// lijst, de kalender en straks je lesdag dezelfde taal spreken.
//
// Elk soort krijgt een WOORD, niet alleen een kleur: wie kleuren slecht
// onderscheidt moet net zo goed kunnen zien wat er staat.

// Groen dat donker genoeg is om als kleine vetgedrukte tekst op een groene
// ondergrond te staan. brand-dark (#25855a) haalt daar net geen AA op
// (4.05:1 op brand-soft, en het wordt slechter naarmate de vulling dieper
// wordt); dit is diezelfde kleur, twee stappen donkerder.
const GROEN_DIEP = "text-[#155239]";

// Een eigen kleur voor "activiteit" — schoolkamp, projectweek, avondvierdaagse,
// sportdag. Dat zijn de leukste dingen van het jaar en die stonden in hetzelfde
// grijs als een vergadering; toetsen en rapporten kregen wél een warme kleur.
//
// Het is geen willekeurige vierde kleur: de huisinkt (#221c3a) is zelf een
// violet, en dit is diezelfde tint een stuk lichter en frisser. Botst dus niet
// met het amber van toetsen of het groen van vakanties, maar hoort wel bij de
// familie. Vergadering en "overig" blijven bewust neutraal grijs — die hoeven
// geen aandacht te trekken.
const LILA_TEKST = "text-[#3a2d8c]";

export const ETIKET: Record<Soort, { woord: string; stijl: string }> = {
  vakantie: { woord: "Vakantie", stijl: `bg-brand-soft ${GROEN_DIEP}` },
  // Bewust niet "Vrije dag": een studiedag is vrij voor de kinderen, maar voor
  // de leerkracht gewoon een werkdag. "Geen les" klopt voor allebei.
  vrij: { woord: "Geen les", stijl: `bg-brand-soft ${GROEN_DIEP}` },
  rapport: { woord: "Rapporten", stijl: "bg-accent-soft text-amber-800" },
  gesprek: { woord: "Gesprekken", stijl: `border border-brand/35 bg-white ${GROEN_DIEP}` },
  vergadering: { woord: "Vergadering", stijl: "bg-cream text-ink/75" },
  toets: { woord: "Toetsen", stijl: "bg-accent-soft text-amber-800" },
  activiteit: { woord: "Activiteit", stijl: `bg-[#eae6fc] ${LILA_TEKST}` },
  overig: { woord: "Afspraak", stijl: "bg-cream text-ink/75" },
};

/**
 * De doorlopende balk van een meerdaagse afspraak in de kalender (zie
 * SchooljaarMaand). Eigen kleuren, want een balk moet iets anders doen dan een
 * etiketje: hij ligt over vijf witte dagvakken heen en moet over die hele
 * breedte te zien zijn als ÉÉN ding. De etiketkleuren zijn daar te bleek voor
 * — bg-cream (#fbf6ee) verschilt nauwelijks van wit, dus een projectweek of
 * schoolkamp viel praktisch weg.
 *
 * Vandaar één stap dieper in dezelfde palette. De titel staat er bewust maar
 * één keer in: bij elke dag hetzelfde woord herhalen maakt er weer vijf losse
 * afspraken van, en dat is precies wat de balk moest oplossen. Loopt de
 * afspraak door naar de volgende week, dan krijgt die weekrij zijn eigen balk
 * mét titel, dus je raakt het opschrift nooit kwijt.
 */
// ⚠️ Deze kleuren zijn met opzet ONDOORZICHTIG, geen bg-brand/25 en dergelijke.
// Een halfdoorzichtige balk neemt namelijk de kleur van de dag eronder over, en
// een dag is hier lang niet altijd wit: het weekend is cream, een vakantie is
// groen, de startweek is amber. Eén schoolkamp van woensdag tot en met dinsdag
// kreeg zo drie tinten over zijn eigen lengte — precies het tegenovergestelde
// van "dit is één ding". De waarden hieronder zijn dezelfde kleuren, alvast
// uitgerekend over wit.
export const BALK: Record<Soort, string> = {
  vakantie: `bg-[#cbe7db] ${GROEN_DIEP}`,
  vrij: `bg-[#cbe7db] ${GROEN_DIEP}`,
  rapport: "bg-[#fbd391] text-amber-900",
  toets: "bg-[#fbd391] text-amber-900",
  gesprek: `bg-[#daeee5] ring-1 ring-inset ring-[#8dcaaf] ${GROEN_DIEP}`,
  vergadering: "bg-[#e0dfe3] text-ink",
  activiteit: `bg-[#d5ccf8] ${LILA_TEKST}`,
  overig: "bg-[#e0dfe3] text-ink",
};

/** Het stipje in de kalender op een telefoon, waar geen tekst bij past. */
export const STIP: Record<Soort, string> = {
  vakantie: "bg-brand-dark",
  vrij: "bg-brand-dark",
  rapport: "bg-amber-500",
  gesprek: "border-2 border-brand-dark",
  vergadering: "bg-ink/40",
  toets: "bg-amber-500",
  activiteit: "bg-[#6d5ae0]",
  overig: "bg-ink/25",
};

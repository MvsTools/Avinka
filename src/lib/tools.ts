// De vier Avinka-tools, op één plek. Wordt gebruikt op de Start-pagina en elders.
// De kleur-klassen staan voluit (niet samengesteld), zodat Tailwind ze meepakt.
export type Tool = {
  slug: string;
  naam: string;
  emoji: string;
  tekst: string;
  badge: string;
  tint: string;
  rand: string;
  wekelijks?: boolean;
  // Is de tool al naar het platform overgezet? Dan wijst `pad` naar de live-tool;
  // anders opent de tegel een "binnenkort"-pagina.
  pad?: string;
};

export const tools: Tool[] = [
  {
    slug: "toetsanalyse",
    naam: "Toetsanalyse",
    emoji: "📊",
    tekst: "Zie in één oogopslag hoe je groep ervoor staat en wie wat extra aandacht kan gebruiken.",
    badge: "bg-sky-500",
    tint: "bg-sky-50",
    rand: "hover:border-sky-300",
    pad: "/tools/toetsanalyse.html",
  },
  {
    slug: "rapporten",
    naam: "Rapporten",
    emoji: "📝",
    tekst: "Warme, persoonlijke rapportteksten die klinken alsof jij ze schreef.",
    badge: "bg-violet-500",
    tint: "bg-violet-50",
    rand: "hover:border-violet-300",
    pad: "/tools/rapporten.html",
  },
  {
    slug: "oudercontact",
    naam: "Oudercontact",
    emoji: "✉️",
    tekst: "Oudergesprekken, weekberichten en ouderberichten die zo de deur uit kunnen.",
    badge: "bg-rose-500",
    tint: "bg-rose-50",
    rand: "hover:border-rose-300",
    wekelijks: true,
    pad: "/tools/oudercontact.html",
  },
  {
    slug: "plattegrond",
    naam: "Plattegrond",
    emoji: "🪑",
    tekst: "Schuif je klasplattegrond in elkaar met een paar klikken. Slepen, schikken, klaar.",
    badge: "bg-amber-500",
    tint: "bg-amber-50",
    rand: "hover:border-amber-300",
    pad: "/tools/plattegrond.html",
  },
];

export function toolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

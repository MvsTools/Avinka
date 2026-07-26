// Het basisrooster: je vaste lesweek.
//
// Het rooster wordt gemaakt in de weekplanning-tool. Die bewaart een eigen vorm
// (tijden in minuten sinds middernacht, dagen als "ma"), en die vorm nemen we
// ongewijzigd over in de database. Zo kan de tool blijven werken zoals hij werkt
// en vertalen we hier één keer naar de begrippen van Mijn schooljaar.
//
// AFSPRAAK (zie docs/planning-mijn-schooljaar.md §3.6): het basisrooster is een
// sjabloon ZONDER datums. Er kan dus nooit een agenda-afspraak in staan. Die
// twee ontmoeten elkaar pas in een concrete week.

import type { Roosterblok } from "./types";

/** Zoals de weekplanning-tool het bewaart. */
export type RoosterBlokRuw = {
  id: string;
  dag: string;
  /** Minuten sinds middernacht. */
  start: number;
  /** Lengte in minuten. */
  duur: number;
  vak: string;
  naam: string;
  /** "les" = tijdens schooltijd, "taak" = eigen tijd erna, "vast" = pauze of gym. */
  type?: string;
  /** Eigen aantekening bij dit blok, door de leerkracht zelf getypt. */
  omschrijving?: string;
  /** Het slotje: dit blok staat vast op zijn tijd. Niet gezet = de standaard van
   *  `staatVast` (pauzes vast, de rest los). */
  opSlot?: boolean;
};

export type RoosterSetup = {
  groep?: number | string;
  dagen?: string[];
  begin?: number;
  eind?: number;
  dagBegin?: Record<string, number>;
  dagEind?: Record<string, number>;
  // Eigen vakken bewaren hun kleur mee (bg + tx), standaardvakken niet: die
  // halen we uit de vaste catalogus hieronder. blokken (lengtes per week) en de
  // dagdeel-vlaggen gebruikt de generator om de lessen te verdelen.
  vakken?: {
    id: string;
    naam: string;
    bg?: string;
    tx?: string;
    blokken?: number[];
    zwaar?: boolean;
    middag?: boolean;
    ontspan?: boolean;
    ochtend?: boolean;
  }[];
};

export type Basisrooster = {
  setup: RoosterSetup;
  blokken: RoosterBlokRuw[];
};

const DAGEN = ["ma", "di", "wo", "do", "vr"];

// Dezelfde kleuren als in de weekplanning-tool (public/tools/weekplanning.html):
// een zachte achtergrond met een bijpassende donkere tekstkleur. Zo herkent de
// leerkracht in het weekrooster precies de kleuren waarmee hij het bouwde.
// Pauzes zijn bewust gedempt zodat de lessen zelf eruit springen.
type Kleur = { bg: string; tekst: string };

// Een vol, vrolijk palet dat de hele kleurenwaaier gebruikt. Voor rood-groen-
// kleurenblindheid is de sleutel het verschil in licht/donker: vakken die qua
// kleur op elkaar zouden lijken (twee groenen, geel/oranje) staan bewust op een
// andere lichtheid, en een paar krijgen een stevige donkere kleur met witte
// tekst. De naam in het blok blijft altijd het vangnet.
// Een vol, vrolijk palet dat de hele kleurenwaaier gebruikt. Voor rood-groen-
// kleurenblindheid is de sleutel het verschil in licht/donker: vakken die qua
// tint op elkaar zouden lijken (de groen/geel/oranje-groep) staan bewust op een
// andere lichtheid, van heel licht (geel) naar dieper (gym-groen). De naam in
// het blok blijft altijd het vangnet.
const VAK_KLEUR: Record<string, Kleur> = {
  dagopening: { bg: "#f7cf5e", tekst: "#6e5000" }, // goud
  rekenen: { bg: "#9cc7ff", tekst: "#0d4a95" }, // blauw
  taal: { bg: "#cdb0ff", tekst: "#4d1e9c" }, // paars
  spelling: { bg: "#ffb3e6", tekst: "#8a1f74" }, // magenta
  tlezen: { bg: "#b6e88f", tekst: "#35701a" }, // licht groen
  blezen: { bg: "#7fdcd6", tekst: "#06534f" }, // aqua
  schrijven: { bg: "#cdd45a", tekst: "#4e5600" }, // olijf
  wo: { bg: "#ffb066", tekst: "#7a3d00" }, // oranje
  engels: { bg: "#93dbf2", tekst: "#0a5a7a" }, // hemelsblauw
  creatief: { bg: "#ff9fb0", tekst: "#8a1f3d" }, // koraalroze
  muziek: { bg: "#ff8a7a", tekst: "#7a1e10" }, // rood
  seo: { bg: "#ffe873", tekst: "#6e5600" }, // geel
  verkeer: { bg: "#aeb4f5", tekst: "#2f3aa5" }, // indigo
  gym: { bg: "#74c78a", tekst: "#0f5e34" }, // diep groen
  pauze: { bg: "#e5e0d5", tekst: "#6f6a5c" }, // gedempt neutraal
};

/** Als we een vak niet kennen: een rustige neutrale kleur i.p.v. niets. */
const VAK_KLEUR_STANDAARD: Kleur = { bg: "#efeae0", tekst: "#5c5647" };

/**
 * De kleur van een blok: eerst de vaste catalogus (standaardvakken, pauze, gym),
 * dan de kleur die een eigen vak zelf heeft meegekregen in de setup, en anders
 * een neutrale terugval.
 */
/**
 * De randkleur van een blok. Een (bijna-)witte achtergrond krijgt een iets
 * duidelijkere grijze rand zodat het blok zichtbaar blijft tegen de witte
 * pagina; gekleurde blokken houden een zachte rand.
 */
export function randKleur(bg?: string): string {
  const h = (bg ?? "").replace("#", "");
  if (h.length < 6) return "rgba(0,0,0,0.05)";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const licht = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  return licht > 0.9 ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.05)";
}

export function kleurVoor(vak: string, setup: RoosterSetup): Kleur {
  // Een zelfgekozen kleur (bg + tx in de setup) wint altijd, ook voor een
  // standaardvak; anders de vaste catalogus, en anders een neutrale terugval.
  const eigen = setup.vakken?.find((v) => v.id === vak);
  if (eigen?.bg && eigen?.tx) return { bg: eigen.bg, tekst: eigen.tx };
  if (VAK_KLEUR[vak]) return VAK_KLEUR[vak];
  return VAK_KLEUR_STANDAARD;
}

/**
 * Staat dit blok vast op zijn tijd? Dat is het slotje uit de bewerkstand, en het
 * betekent overal hetzelfde: dit blok schuift niet, het ruilt niet van plek, en
 * het blijft staan als je de lessen opnieuw verdeelt. Wat je erop loslaat komt
 * ernaast te staan.
 *
 * Pauzes staan standaard vast: dat zijn de ankers van de schooldag, en zo hoeft
 * niemand ze eerst zelf vast te zetten. Haal je er zelf het slotje af, dan is dat
 * expliciet `opSlot: false` en wint jouw keuze.
 */
export function staatVast(blok: { vak: string; opSlot?: boolean }): boolean {
  return blok.opSlot ?? blok.vak === "pauze";
}

/** Een blok zoals de ruil-rekensom het nodig heeft: welke dag, van wanneer, hoe lang. */
export type RuilBlok = { id: string; weekdag: number; start: number; duur: number };
/** Waar een blok na de ruil terechtkomt. */
export type RuilPlek = { weekdag: number; start: number; duur: number };

/**
 * Hoeveel minuten er vanaf `start` aaneengesloten vrij zijn op die dag. Volgt er
 * niets meer, dan is er ruimte tot het eind van de dag: het raster groeit vanzelf
 * mee met je blokken.
 */
function ruimteVanaf(blokken: RuilBlok[], weekdag: number, start: number): number {
  let eind = Infinity;
  for (const b of blokken) {
    if (b.weekdag !== weekdag) continue;
    if (b.start >= start) eind = Math.min(eind, b.start);
    // Een blok dat al lóópt op dit tijdstip (kan bij twee lessen naast elkaar):
    // dan is hier niets vrij.
    else if (b.start + b.duur > start) return 0;
  }
  return eind === Infinity ? 24 * 60 - start : eind - start;
}

/**
 * Twee blokken van moment wisselen. De regel in één zin: ieder houdt zijn eigen
 * lengte, en past een blok niet in zijn nieuwe plek, dan wordt alleen dát blok
 * korter. De rest van de dag blijft precies staan — nooit doorschuiven, want dan
 * verzet één sleepactie ineens je hele middag.
 *
 * Is een blok korter dan de plek waar het heen gaat, dan blijft er gewoon wat
 * ruimte over. Die zie je staan en kun je zelf oprekken.
 *
 * `null` = ruilen kan hier niet (te weinig ruimte voor een blok van 10 minuten).
 */
export function berekenRuil(
  blokken: RuilBlok[],
  aId: string,
  bId: string,
): { a: RuilPlek; b: RuilPlek } | null {
  if (aId === bId) return null;
  const a = blokken.find((x) => x.id === aId);
  const b = blokken.find((x) => x.id === bId);
  if (!a || !b) return null;
  // De twee ruilers zelf staan de ruil niet in de weg, want ze gaan allebei weg.
  // Maar hun nieuwe begintijd is wél een grens: staan ze op dezelfde dag, dan mag
  // het ene blok niet over de nieuwe plek van het andere heen groeien. Daarom
  // zetten we op de plek die vrijkomt een streepje (lengte 0) neer.
  const anderen = blokken.filter((x) => x.id !== aId && x.id !== bId);
  const grens = (x: RuilBlok): RuilBlok => ({
    id: "grens",
    weekdag: x.weekdag,
    start: x.start,
    duur: 0,
  });
  const aDuur = Math.min(a.duur, ruimteVanaf([...anderen, grens(a)], b.weekdag, b.start));
  const bDuur = Math.min(b.duur, ruimteVanaf([...anderen, grens(b)], a.weekdag, a.start));
  if (aDuur < 10 || bDuur < 10) return null;
  return {
    a: { weekdag: b.weekdag, start: b.start, duur: aDuur },
    b: { weekdag: a.weekdag, start: a.start, duur: bDuur },
  };
}

/** "ma" → 0, "vr" → 4. Geeft -1 voor iets wat we niet kennen. */
export function dagNummer(dag: string): number {
  return DAGEN.indexOf(String(dag).toLowerCase().slice(0, 2));
}

/** 510 → "08:30" */
export function minutenNaarTijd(minuten: number): string {
  const m = Math.max(0, Math.round(minuten));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/**
 * Is dit een geldig bewaard rooster? We zijn streng bij het inlezen, want de
 * gegevens komen uit localStorage van een browser en kunnen van alles zijn.
 */
export function isBasisrooster(waarde: unknown): waarde is Basisrooster {
  if (!waarde || typeof waarde !== "object") return false;
  const o = waarde as { setup?: unknown; blokken?: unknown };
  return Boolean(o.setup) && typeof o.setup === "object" && Array.isArray(o.blokken);
}

/**
 * Van de vorm van de tool naar de blokken waar Mijn schooljaar mee rekent.
 * Pauzes en gym ("vast") tellen als les: ze horen bij je schooldag.
 */
export function naarBlokken(rooster: Basisrooster | null): Roosterblok[] {
  if (!rooster) return [];
  return rooster.blokken
    .filter((b) => b && dagNummer(b.dag) >= 0 && b.duur > 0)
    .map((b) => ({
      id: b.id,
      weekdag: dagNummer(b.dag),
      begin: minutenNaarTijd(b.start),
      eind: minutenNaarTijd(b.start + b.duur),
      vak: b.vak,
      naam: b.naam,
      kleur: kleurVoor(b.vak, rooster.setup),
      omschrijving: typeof b.omschrijving === "string" ? b.omschrijving : undefined,
      opSlot: staatVast(b),
      soort: b.type === "taak" ? ("taak" as const) : ("les" as const),
    }))
    .sort((a, b) => a.weekdag - b.weekdag || a.begin.localeCompare(b.begin));
}

/**
 * Overlappen twee lessen op dezelfde dag qua tijd, dan horen ze naast elkaar in
 * plaats van over elkaar (net als afspraken in een agenda). Deze functie geeft
 * per blok een kolom (`kol`) en het aantal kolommen in zijn overlap-groep (`n`),
 * zodat een weergave `left = kol/n` en `breedte = 1/n` kan rekenen.
 */
export function schikDag(blokken: Roosterblok[]): Map<string, { kol: number; n: number }> {
  const min = (t: string) => {
    const [u, m] = t.split(":").map(Number);
    return u * 60 + (m || 0);
  };
  const items = blokken
    .map((b) => ({ id: b.id, start: min(b.begin), eind: min(b.eind), kol: 0 }))
    .sort((a, b) => a.start - b.start || a.eind - b.eind);

  const uit = new Map<string, { kol: number; n: number }>();
  let groep: typeof items = [];
  let groepEind = -1;
  let kolommen: number[] = []; // laatste eindtijd per kolom, binnen de groep

  const sluitGroep = () => {
    const n = Math.max(1, kolommen.length);
    for (const it of groep) uit.set(it.id, { kol: it.kol, n });
    groep = [];
    kolommen = [];
  };

  for (const it of items) {
    // Geen overlap meer met de lopende groep? Dan die groep afsluiten.
    if (groep.length && it.start >= groepEind) {
      sluitGroep();
      groepEind = -1;
    }
    // De eerste kolom die vrij is (waarvan de vorige les al klaar is), anders een
    // nieuwe kolom erbij.
    let kol = kolommen.findIndex((e) => e <= it.start);
    if (kol === -1) {
      kol = kolommen.length;
      kolommen.push(it.eind);
    } else {
      kolommen[kol] = it.eind;
    }
    it.kol = kol;
    groep.push(it);
    groepEind = Math.max(groepEind, it.eind);
  }
  sluitGroep();
  return uit;
}

/**
 * De vroegste begintijd en de laatste eindtijd van de lesdagen, zodat de
 * weekweergave weet hoe hoog het raster moet zijn. Zonder rooster geven we een
 * gewone schooldag terug.
 */
export function rasterGrenzen(blokken: Roosterblok[]): { begin: string; eind: string } {
  const lessen = blokken.filter((b) => b.soort === "les");
  if (!lessen.length) return { begin: "08:30", eind: "15:00" };
  return {
    begin: lessen.map((b) => b.begin).sort()[0],
    eind: lessen.map((b) => b.eind).sort().at(-1) as string,
  };
}

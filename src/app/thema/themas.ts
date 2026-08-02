/* ── Vijf visuele varianten van /nieuw5 ─────────────────────────────────────
   Zelfde pagina, andere huid. Er wordt hier GEEN sectie, tekst, volgorde of
   gedrag aangeraakt: elke variant is een set CSS-variabelen die om de
   bestaande componenten heen wordt gezet. De componenten in ../nieuw5 lezen
   al hun kleuren, vormen en schaduwen uit die variabelen (zie het TOKENS-blok
   bovenaan Wereld.tsx), met de huidige waarden als terugval — /nieuw5 zelf
   blijft daardoor onveranderd.

   Wat per variant verschuift:
   - het letterpaar (display, tekst, handschrift)
   - het volledige palet, inclusief de veldkleur die de pagina ritme geeft
   - de papiertextuur onder de hele pagina
   - de vormtaal: van organische blobs tot strakke hoeken
   - het schaduwkarakter: van diepe zachte val tot harde offset zonder blur

   De vijf zijn met opzet ver uit elkaar getrokken op temperatuur, contrast,
   vorm en textuur. Het is een keuzeronde, geen vijf variaties op één idee.
   ─────────────────────────────────────────────────────────────────────────── */

export type ThemaId = "krijtlijn" | "zonnewarm" | "diepbos" | "riso" | "botanisch";

export type Thema = {
  id: ThemaId;
  naam: string;
  eenRegel: string;
  letters: string;
  /* De CSS-variabelen die op de wrapper komen. Alles wat hier niet in staat,
     valt terug op de waarde die in de componenten zelf staat. */
  tokens: Record<string, string>;
};

/* Een papiertextuur als data-URI. Losse functie omdat elke variant een eigen
   korrel heeft: stipjes, ruitjes, liniatuur of halftoon. De kleur gaat als
   parameter mee zodat het patroon bij het palet blijft. */
function stippen(kleur: string, alpha: number, maat = 22, straal = 1.4) {
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${maat}' height='${maat}'%3E%3Ccircle cx='${maat / 2}' cy='${maat / 2}' r='${straal}' fill='%23${kleur}' opacity='${alpha}'/%3E%3C/svg%3E")`;
}

function lijnen(kleur: string, alpha: number, afstand = 34) {
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${afstand}' height='${afstand}'%3E%3Cpath d='M0 ${afstand - 0.5}H${afstand}' stroke='%23${kleur}' stroke-opacity='${alpha}' stroke-width='1'/%3E%3C/svg%3E")`;
}

function ruit(kleur: string, alpha: number, maat = 26) {
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${maat}' height='${maat}'%3E%3Cpath d='M0 0H${maat}M0 0V${maat}' stroke='%23${kleur}' stroke-opacity='${alpha}' stroke-width='1'/%3E%3C/svg%3E")`;
}

/* Halftoon: twee versprongen puntenrasters, zoals een rasterdruk. */
function halftoon(kleur: string, alpha: number, maat = 14) {
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${maat}' height='${maat}'%3E%3Ccircle cx='3' cy='3' r='1.5' fill='%23${kleur}' opacity='${alpha}'/%3E%3Ccircle cx='${maat - 4}' cy='${maat - 4}' r='1.5' fill='%23${kleur}' opacity='${alpha}'/%3E%3C/svg%3E")`;
}

/* Organische blob-vormen (de huidige taal) en twee strakkere families, zodat
   een variant zijn vormtaal in één keer kan omzetten. */
const BLOB = {
  "--w-vorm-ei": "72% 28% 58% 42% / 44% 56% 42% 58%",
  "--w-vorm-kiezel": "38% 62% 46% 54% / 63% 37% 62% 38%",
  "--w-vorm-koepel": "52% 48% 46% 54% / 76% 74% 26% 24%",
  "--w-vorm-wig": "24% 76% 70% 30% / 66% 34% 68% 32%",
  "--w-vorm-schelp": "62% 38% 34% 66% / 36% 62% 40% 64%",
};

/* Strak: de achtergrondvlakken worden rechthoeken met één zachte hoek. Dat
   haalt het speelse eruit zonder de vlakken zelf weg te nemen. */
const STRAK = {
  "--w-vorm-ei": "1.5rem",
  "--w-vorm-kiezel": "1.5rem 1.5rem 1.5rem 6rem",
  "--w-vorm-koepel": "6rem 6rem 1.5rem 1.5rem",
  "--w-vorm-wig": "1.5rem 6rem 1.5rem 1.5rem",
  "--w-vorm-schelp": "1.5rem 1.5rem 6rem 1.5rem",
};

/* Zacht: alles ovaal, maar regelmatiger dan de blobs — ronder en rustiger. */
const OVAAL = {
  "--w-vorm-ei": "50%",
  "--w-vorm-kiezel": "46% 54% 50% 50% / 50% 46% 54% 50%",
  "--w-vorm-koepel": "50% 50% 46% 54% / 60% 60% 40% 40%",
  "--w-vorm-wig": "54% 46% 50% 50% / 50% 54% 46% 50%",
  "--w-vorm-schelp": "50% 50% 54% 46% / 46% 50% 50% 54%",
};

export const THEMAS: Thema[] = [
  /* ── 1 ─────────────────────────────────────────────────────────────────── */
  {
    id: "krijtlijn",
    naam: "Krijtlijn",
    eenRegel:
      "Een goed vormgegeven schoolboek: warm papier, diepe inkt, haarlijnen en bijna geen schaduw.",
    letters: "Fraunces + Public Sans",
    tokens: {
      /* palet: de groene velden worden leisteenblauw, groen blijft alleen als
         merkteken op knoppen en vinkjes — zo blijft het logo kloppen zonder
         dat de pagina groen ís */
      "--color-ink": "#16203a",
      "--color-cream": "#f7f5f0",
      "--color-sand": "#eeeae1",
      "--color-brand": "#1f7a54",
      "--color-brand-dark": "#175c3f",
      "--color-brand-soft": "#e4ede8",
      "--color-accent": "#cf7a4e",
      "--color-accent-soft": "#f6e7de",
      "--w-sier-a": "#dfe4ee",
      "--w-sier-b": "#e9e3d6",
      "--w-kaart-warm": "#fbfaf6",
      "--w-film-hoogtepunt": "#7fd8ae",
      "--w-papier": "#f7f5f0",
      "--w-papier-patroon": lijnen("16203a", 0.05, 32),
      "--w-veld": "#e8ecf3",
      "--w-veld-diep": "#d3dbe8",
      "--w-silhouet": "#dde3ed",
      "--w-vlak-papier": "#efece5",
      "--w-vlak-veld": "#e0e6ef",
      "--w-vlak-veld-zacht": "#e4e9f1",
      "--w-donker": "#16203a",
      "--w-kop": "#28365c",
      "--w-kaart-rand": "#d7dae2",
      "--w-schaduw-rgb": "22,32,58",
      /* haarlijn in plaats van diepte: één scherpe, korte schaduw */
      "--w-kaart-radius": "0.75rem",
      "--w-kaart-schaduw": "-2px 4px 0 0 rgba(22,32,58,0.08)",
      "--w-knop-radius": "0.5rem",
      "--w-knop-radius-hover": "0.5rem",
      "--w-vorm-groot": "0.75rem",
      "--w-vorm-beeld": "0.5rem",
      "--w-vorm-blok1": "0.5rem",
      "--w-vorm-blok2": "0.5rem",
      "--w-vorm-blok3": "0.5rem",
      "--w-vorm-tegel1": "0.375rem",
      "--w-vorm-tegel2": "0.375rem",
      "--w-vorm-tegel3": "0.375rem",
      ...STRAK,
    },
  },

  /* ── 2 ─────────────────────────────────────────────────────────────────── */
  {
    id: "zonnewarm",
    naam: "Zonnewarm",
    eenRegel:
      "Late middagzon: abrikoos papier, diep bosgroen, mandarijn accent en heel veel ronding.",
    letters: "Outfit + DM Sans",
    tokens: {
      "--color-ink": "#3a2418",
      "--color-cream": "#fff6ec",
      "--color-sand": "#ffe8d2",
      "--color-brand": "#17694a",
      "--color-brand-dark": "#0f4f37",
      "--color-brand-soft": "#dcece4",
      "--color-accent": "#ea6b2a",
      "--color-accent-soft": "#ffe3cd",
      "--w-sier-a": "#ffdcc0",
      "--w-sier-b": "#f6e2c8",
      "--w-kaart-warm": "#fffaf3",
      "--w-film-hoogtepunt": "#8ee0b6",
      "--w-papier": "#fff6ec",
      "--w-papier-patroon": stippen("ea6b2a", 0.1, 26, 1.6),
      "--w-veld": "#ffe8d2",
      "--w-veld-diep": "#ffd4ae",
      "--w-silhouet": "#ffdcbe",
      "--w-vlak-papier": "#fdedde",
      "--w-vlak-veld": "#ffdfc4",
      "--w-vlak-veld-zacht": "#ffe4cc",
      "--w-donker": "#0f4f37",
      "--w-kop": "#17694a",
      "--w-kaart-rand": "#f4dcc6",
      "--w-schaduw-rgb": "120,58,20",
      /* zacht en diep: de kaarten liggen echt op het papier */
      "--w-kaart-radius": "2.75rem",
      "--w-kaart-schaduw": "-18px 44px 90px -50px rgba(120,58,20,0.55)",
      "--w-knop-radius": "999px",
      "--w-knop-radius-hover": "999px",
      "--w-vorm-groot": "3rem",
      "--w-vorm-beeld": "2rem",
      "--w-vorm-blok1": "1.75rem",
      "--w-vorm-blok2": "1.75rem",
      "--w-vorm-blok3": "1.75rem",
      "--w-vorm-tegel1": "1.25rem",
      "--w-vorm-tegel2": "1.25rem",
      "--w-vorm-tegel3": "1.25rem",
      ...OVAAL,
    },
  },

  /* ── 3 ─────────────────────────────────────────────────────────────────── */
  {
    id: "diepbos",
    naam: "Diep bos",
    eenRegel:
      "Koel en grafisch: bot-papier, diepe dennenvelden, helder smaragd en oud goud, met strakke hoeken.",
    letters: "Space Grotesk + Manrope",
    tokens: {
      "--color-ink": "#101a16",
      "--color-cream": "#f2f1e8",
      "--color-sand": "#e4e3d6",
      "--color-brand": "#0b7a56",
      "--color-brand-dark": "#085f43",
      "--color-brand-soft": "#d9ece4",
      "--color-accent": "#b8891f",
      "--color-accent-soft": "#f2e8d0",
      "--w-sier-a": "#cfded6",
      "--w-sier-b": "#e2ded0",
      "--w-kaart-warm": "#fbfaf5",
      "--w-film-hoogtepunt": "#3ddc97",
      "--w-papier": "#f2f1e8",
      "--w-papier-patroon": ruit("101a16", 0.05, 30),
      /* Het veld is diep van kleur maar bewust nog licht: de koppen op dit
         veld gebruiken dezelfde token als de koppen op de witte kaarten, dus
         een echt donker veld zou die onleesbaar maken. De dramatiek komt hier
         van het contrast tussen bot-papier en verzadigd groen, niet van zwart. */
      "--w-veld": "#cddfd6",
      "--w-veld-diep": "#aecabd",
      "--w-silhouet": "#bdd4c8",
      "--w-vlak-papier": "#e9e8dc",
      "--w-vlak-veld": "#c1d7cc",
      "--w-vlak-veld-zacht": "#c7dbd1",
      "--w-donker": "#0e1a14",
      "--w-kop": "#0b6a4a",
      "--w-slot": "#0c1511",
      "--w-kaart-rand": "#d8d6c8",
      "--w-schaduw-rgb": "14,26,20",
      "--w-kaart-radius": "1rem",
      "--w-kaart-schaduw": "-10px 30px 70px -44px rgba(14,26,20,0.65)",
      "--w-knop-radius": "0.75rem",
      "--w-knop-radius-hover": "0.75rem",
      "--w-vorm-groot": "1rem",
      "--w-vorm-beeld": "0.75rem",
      "--w-vorm-blok1": "0.75rem",
      "--w-vorm-blok2": "0.75rem",
      "--w-vorm-blok3": "0.75rem",
      "--w-vorm-tegel1": "0.5rem",
      "--w-vorm-tegel2": "0.5rem",
      "--w-vorm-tegel3": "0.5rem",
      ...STRAK,
    },
  },

  /* ── 4 ─────────────────────────────────────────────────────────────────── */
  {
    id: "riso",
    naam: "Riso",
    eenRegel:
      "Gedrukt in twee inkten: halftoonraster, harde offsetschaduw zonder blur, spearmint en inktblauw.",
    letters: "Epilogue + Work Sans",
    tokens: {
      "--color-ink": "#1a1a2e",
      "--color-cream": "#fbf7ef",
      "--color-sand": "#f2ece0",
      "--color-brand": "#0a7a70",
      "--color-brand-dark": "#065c55",
      "--color-brand-soft": "#dbf0ee",
      "--color-accent": "#a9b1ff",
      "--color-accent-soft": "#e2e4ff",
      "--w-sier-a": "#cfeae6",
      "--w-sier-b": "#e6e0d2",
      "--w-kaart-warm": "#fdfaf4",
      "--w-film-hoogtepunt": "#5ce0d2",
      "--w-papier": "#fbf7ef",
      "--w-papier-patroon": halftoon("0f9b8e", 0.11, 15),
      "--w-veld": "#ddf1ee",
      "--w-veld-diep": "#b7e2dd",
      "--w-silhouet": "#c8e8e4",
      "--w-vlak-papier": "#f2eee3",
      "--w-vlak-veld": "#d0ebe7",
      "--w-vlak-veld-zacht": "#d6eeea",
      "--w-donker": "#0b4f4a",
      "--w-kop": "#0a6c63",
      "--w-kaart-rand": "#1a1a2e",
      "--w-schaduw-rgb": "26,26,46",
      /* de drukfout als stijlmiddel: een harde tweede kleur ernaast, geen blur */
      "--w-kaart-radius": "0.25rem",
      "--w-kaart-schaduw": "6px 6px 0 0 rgba(79,93,255,0.9)",
      "--w-knop-radius": "0.25rem",
      "--w-knop-radius-hover": "0.25rem",
      "--w-vorm-groot": "0.25rem",
      "--w-vorm-beeld": "0.125rem",
      "--w-vorm-blok1": "0.25rem",
      "--w-vorm-blok2": "0.25rem",
      "--w-vorm-blok3": "0.25rem",
      "--w-vorm-tegel1": "0.125rem",
      "--w-vorm-tegel2": "0.125rem",
      "--w-vorm-tegel3": "0.125rem",
      ...STRAK,
    },
  },

  /* ── 5 ─────────────────────────────────────────────────────────────────── */
  {
    id: "botanisch",
    naam: "Botanisch",
    eenRegel:
      "Havermout en olijf: gedempte natuurtinten, mosterd accent, serif koppen en zachte diepte.",
    letters: "Newsreader + Archivo",
    tokens: {
      "--color-ink": "#2a2e24",
      "--color-cream": "#f5f2e8",
      "--color-sand": "#eae5d4",
      "--color-brand": "#4a7c59",
      "--color-brand-dark": "#3a6246",
      "--color-brand-soft": "#e3ebe1",
      "--color-accent": "#c8971f",
      "--color-accent-soft": "#f5ecd3",
      "--w-sier-a": "#dde5d3",
      "--w-sier-b": "#eee6cf",
      "--w-kaart-warm": "#faf8f0",
      "--w-film-hoogtepunt": "#8fd6a4",
      "--w-papier": "#f5f2e8",
      "--w-papier-patroon": stippen("4a7c59", 0.13, 24, 1.2),
      "--w-veld": "#e2e8da",
      "--w-veld-diep": "#c9d5bd",
      "--w-silhouet": "#d5dfc9",
      "--w-vlak-papier": "#eeeadd",
      "--w-vlak-veld": "#d9e2cf",
      "--w-vlak-veld-zacht": "#dee6d5",
      "--w-donker": "#2f4a35",
      "--w-kop": "#3c6749",
      "--w-kaart-rand": "#d8d3c0",
      "--w-schaduw-rgb": "47,74,53",
      "--w-kaart-radius": "1.75rem",
      "--w-kaart-schaduw": "-12px 30px 64px -42px rgba(47,74,53,0.6)",
      "--w-knop-radius": "1.5rem 1.1rem 1.6rem 1.2rem",
      "--w-knop-radius-hover": "1.1rem 1.6rem 1.2rem 1.5rem",
      "--w-vorm-groot": "2.25rem 1rem 2rem 1.2rem / 1.2rem 2rem 1rem 2.25rem",
      "--w-vorm-beeld": "1.5rem 0.7rem 1.4rem 0.8rem / 0.8rem 1.4rem 0.7rem 1.5rem",
      "--w-vorm-blok1": "1.1rem",
      "--w-vorm-blok2": "1.1rem",
      "--w-vorm-blok3": "1.1rem",
      "--w-vorm-tegel1": "0.75rem",
      "--w-vorm-tegel2": "0.75rem",
      "--w-vorm-tegel3": "0.75rem",
      ...BLOB,
    },
  },
];

export function themaVoor(id: string): Thema | undefined {
  return THEMAS.find((t) => t.id === id);
}

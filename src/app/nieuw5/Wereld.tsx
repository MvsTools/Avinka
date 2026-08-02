"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from "react";

/* ── De Wereld van /nieuw5 ──────────────────────────────────────────────────
   De body-taal, geleend van de referentie (bahamabucks) maar met óns merk:
   - gespikkeld papier-wit als grondtoon (hun sneeuw-speckle → papier/krijt)
   - zacht groene velden met GROTE tone-on-tone silhouetten van schoolgerei
     (hun palmbladeren → ons potlood / papieren vliegtuigje / liniaal)
   - witte kaarten met grote organische rondingen die over de veldranden
     heen schuiven
   - golf-overgangen tussen alle kleurvelden
   - amberkleurige confetti-stipjes, spaarzaam
   - één donkergroene sticker die de hele pagina meereist
   Rood/koraal uit de referentie is overal groen geworden. De film bovenaan
   en de toolkaarten blijven ongemoeid: dat is al ons "filmisch realisme".
   Reveals liften mee op het data-reveal/is-in-systeem van Vierde.tsx. ───── */

/* MINT was de eigenaar op alle mintvelden te donker; MINT_LICHT is nu de
   echte veldkleur van de pagina (Herken, Privacy, Regie, Maker, Ervaringen).
   MINT zelf blijft in gebruik als DIEPERE tint-op-tint-accent bovenop dat
   lichte veld, maar alleen nog op witte kaarten (het mintblok/quote-blokje
   in de makerskaart) — niet meer op het veld zelf: dat bleek daar tóch te
   donker. */
/* ── TOKENS ────────────────────────────────────────────────────────────────
   Elke kleur, vorm en schaduw hieronder is een CSS-variabele met de huidige
   waarde als terugval. Zonder wrapper verandert er dus niets: /nieuw5 ziet
   eruit zoals hij eruitzag. Zet een wrapper met andere `--w-*`-waarden om de
   componenten heen en de hele pagina verschuift mee, zonder dat er één
   sectie, tekst of stukje gedrag verandert. Dat is wat de vijf thema-routes
   doen (zie themas.ts).

   Waarom variabelen en niet vijf kopieën van de pagina: een kopie loopt na
   de eerste inhoudelijke wijziging meteen uit de pas, en dan vergelijk je
   geen skins meer maar vijf verschillende pagina's. ──────────────────────── */
export const MINT = "var(--w-veld-diep, #cfe6d8)";
export const MINT_LICHT = "var(--w-veld, #ecf6f0)";
/* Alle tint-op-tint-accenten die BOVENOP het mintveld liggen (silhouetten,
   de zachte klodders/vlakken) zijn met dezelfde stap meegelicht als MINT →
   MINT_LICHT, anders staan ze nu te hard tegen het nieuwe lichte veld af. */
export const MINT_DIEP = "var(--w-silhouet, #d2e8dc)"; // silhouetten op mint
/* Achtergrondvlakken: bewust maar een paar procent van de ondergrond af.
   De rustigste sectie van de pagina (privacy) heeft óók een achtergrond-
   motief — de vliegtuigjes — en die werkt juist omdat je hem nauwelijks
   ziet. Dat is de maat voor alle vlakken hieronder. */
export const VLAK_PAPIER = "var(--w-vlak-papier, #f2f4ed)"; // op het gespikkelde papier
export const VLAK_MINT = "var(--w-vlak-veld, #e3efe7)"; // op een mintveld
/* Nog een stap zachter, voor plekken waar meerdere vlakken bij elkaar staan:
   twee vormen naast elkaar tellen op en worden samen al snel te aanwezig. */
const VLAK_MINT_ZACHT = "var(--w-vlak-veld-zacht, #e7f2eb)";
/* Koptekst op lichte vlakken. Stond eerder ook als achtergrond van het
   slotveld; die twee rollen zijn nu gescheiden (zie SLOT hieronder), want een
   variant kan de ene willen verdiepen zonder de andere onleesbaar te maken. */
export const DONKER = "var(--w-donker, #17503a)";
/* De achtergrond van het donkergroene slotveld, de enige plek op de pagina
   waar een veld echt donker is. */
export const SLOT = "var(--w-slot, #17503a)";
export const KOP = "var(--w-kop, #1e6b4d)"; // koppen op licht veld (het "getinte" groen)

/* Gespikkeld papier: kleine groene + amberen spikkels op bijna-wit. */
export const SPECKLE_STIJL: CSSProperties = {
  backgroundColor: "var(--w-papier, var(--w-papier, #fcfbf7))",
  backgroundImage: `var(--w-papier-patroon, url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='190' height='190'%3E%3Cg fill='%232f9e6e' opacity='0.11'%3E%3Ccircle cx='12' cy='20' r='1.6'/%3E%3Ccircle cx='48' cy='8' r='1.1'/%3E%3Ccircle cx='92' cy='30' r='1.7'/%3E%3Ccircle cx='142' cy='14' r='1.2'/%3E%3Ccircle cx='176' cy='44' r='1.4'/%3E%3Ccircle cx='26' cy='72' r='1.3'/%3E%3Ccircle cx='72' cy='58' r='1.6'/%3E%3Ccircle cx='120' cy='78' r='1.1'/%3E%3Ccircle cx='162' cy='94' r='1.5'/%3E%3Ccircle cx='8' cy='120' r='1.4'/%3E%3Ccircle cx='54' cy='134' r='1.7'/%3E%3Ccircle cx='98' cy='114' r='1.2'/%3E%3Ccircle cx='138' cy='146' r='1.4'/%3E%3Ccircle cx='178' cy='128' r='1.1'/%3E%3Ccircle cx='30' cy='168' r='1.5'/%3E%3Ccircle cx='86' cy='160' r='1.3'/%3E%3Ccircle cx='128' cy='176' r='1.6'/%3E%3C/g%3E%3Cg fill='%23f59e0b' opacity='0.09'%3E%3Ccircle cx='66' cy='28' r='1.3'/%3E%3Ccircle cx='152' cy='62' r='1.4'/%3E%3Ccircle cx='20' cy='98' r='1.2'/%3E%3Ccircle cx='112' cy='142' r='1.5'/%3E%3Ccircle cx='58' cy='100' r='1.1'/%3E%3C/g%3E%3C/svg%3E"))`,
};

/* Vijf duidelijk verschillende organische vormen voor de achtergrondvlakken.
   Ze komen allemaal uit dezelfde familie als onze kaarten (ongelijke acht-
   waarden-radii), maar met opzet ver uit elkaar getrokken: steeds dezelfde
   ovaal herhalen leest als één vorm die je vijf keer ziet. In combinatie met
   een andere breedte/hoogte-verhouding en een andere draaiing per plek is
   geen van de vlakken hetzelfde. */
const VLAKVORMEN = {
  ei: "var(--w-vorm-ei, 72% 28% 58% 42% / 44% 56% 42% 58%)",
  kiezel: "var(--w-vorm-kiezel, 38% 62% 46% 54% / 63% 37% 62% 38%)",
  koepel: "var(--w-vorm-koepel, 52% 48% 46% 54% / 76% 74% 26% 24%)",
  wig: "var(--w-vorm-wig, 24% 76% 70% 30% / 66% 34% 68% 32%)",
  schelp: "var(--w-vorm-schelp, 62% 38% 34% 66% / 36% 62% 40% 64%)",
} as const;

/* ── ÉÉN LICHTBRON VOOR DE HELE PAGINA ────────────────────────────────────
   Het licht valt van rechtsboven. Dat is geen decoratie maar een afspraak:
   élke schaduw op deze pagina valt daardoor naar linksonder, met dezelfde
   verhouding tussen de horizontale en verticale verschuiving. Daarvóór stond
   iedere schaduw recht naar beneden (x = 0), wat betekent dat elke kaart zijn
   eigen lampje boven zich had. Met één richting wordt de pagina één RUIMTE
   waarin dingen liggen, in plaats van een verzameling losse vlakken.

   Er komt hiervoor geen enkel nieuw element bij; het richt alleen wat er al
   staat. De bijbehorende lichtplas zelf staat in `Lichtbron` onderaan.

   Vuistregel: x ≈ -0,4 × y. Verder dan dat gaat het als een lage avondzon
   lezen en wordt het theater; minder is niet meer te zien. */
const SCHADUW_HELLING = 0.4;
export function schaduw(y: number, blur: number, spread: number, alpha: number, kleur = "var(--w-schaduw-rgb, 23,80,58)") {
  return `${-Math.round(y * SCHADUW_HELLING)}px ${y}px ${blur}px ${spread}px rgba(${kleur},${alpha})`;
}

/* Rand en schaduw van de organische kaarten (regie-kaartjes én de makers-
   kaart), zodat die twee gegarandeerd hetzelfde aanvoelen. */
const KAART_RAND = "var(--w-kaart-rand, #d4e5dc)";
const KAART_SCHADUW = schaduw(34, 66, -34, 0.6);

/* Witte kaart met grote ronding: dé kaartvorm van deze wereld. */
export const KAART =
  "rounded-[var(--w-kaart-radius,2.5rem)] bg-white shadow-[var(--w-kaart-schaduw,-14px_36px_80px_-48px_rgba(23,80,58,0.55))] ring-1 ring-ink/[0.04]";

/* ── Golf-overgang tussen twee kleurvelden ──
   Elke overgang op de pagina heeft nu een EIGEN golf. Dat is een bewuste
   koerswijziging: eerst deelden alle zeven overgangen letterlijk hetzelfde
   pad, waardoor de decoratie erbovenop de afwisseling moest leveren (vandaar
   dat er negen verf-klodders stonden). De golf is de eigen sectietaal van de
   site, dus die mag het verschil dragen — dan hoeft er veel minder bij.

   De y in de paden is de hoogte van de golflijn binnen een viewBox van 110
   hoog: KLEINE y = het gevulde veld komt hoog in de strook, GROTE y = het
   blijft laag. `flip` spiegelt dat verticaal, dus bij een flip-golf hangt het
   vórige veld juist diep naar beneden waar de y klein is. */
/* De paden worden BEREKEND, niet met de hand getekend: y is een rechte
   helling van `start` naar `eind` met daar een sinus overheen. Dat is met
   opzet — een met de hand getekende helling werd meteen een strakke wig en
   verloor het golfkarakter, en losse bezier-punten knikken zodra ze ongelijk
   verdeeld liggen. Als functie van x kan dat allebei niet gebeuren: het blijft
   altijd een golf, en de helling en de deining zijn los te regelen. */
function maakGolf({
  start, eind, amp = 20, golven = 1.2, fase = 0,
}: { start: number; eind: number; amp?: number; golven?: number; fase?: number }) {
  const N = 24;
  const p: Array<[number, number]> = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    p.push([t * 1440, start + (eind - start) * t + amp * Math.sin(t * Math.PI * 2 * golven + fase)]);
  }
  const P = (i: number) => p[Math.max(0, Math.min(N, i))];
  let d = `M ${P(0)[0].toFixed(1)} ${P(0)[1].toFixed(1)}`;
  for (let i = 0; i < N; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += ` C ${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)},`;
    d += ` ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)},`;
    d += ` ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `${d} L1440 111 L0 111 Z`;
}

const GOLVEN = {
  /* de oorspronkelijke: rustige dubbele deining, vlak */
  zacht: maakGolf({ start: 62, eind: 56, amp: 26, golven: 1.15, fase: 0.4 }),
  /* deint gewoon door, maar loopt onderweg flink op naar rechts */
  oploopLinks: maakGolf({ start: 26, eind: 90, amp: 19, golven: 1.35, fase: 1.2 }),
  /* dezelfde deining, andere kant op */
  oploopRechts: maakGolf({ start: 90, eind: 26, amp: 19, golven: 1.35, fase: 2.6 }),
  /* zakt in het midden ver weg, komt aan beide randen hoog terug */
  hapMidden: maakGolf({ start: 36, eind: 32, amp: 34, golven: 0.5, fase: 0 }),
  /* bijna vlak, alleen een trage deining */
  rust: maakGolf({ start: 76, eind: 72, amp: 11, golven: 1.45, fase: 0.9 }),
  /* één hoge kam op het linkerderde, daarna lang uitlopend */
  kam: maakGolf({ start: 72, eind: 64, amp: 32, golven: 0.7, fase: -2.67 }),
  /* de overgang naar de ervaringen-sectie: dezelfde ronde, vloeiende golf
     als de rest van de pagina (geen zaagtand), maar zonder dat de deining
     netjes rond hetzelfde niveau links-rechts blijft hangen — hij zakt
     nadrukkelijk weg naar rechts, zodat het mintveld daar veel dieper
     doorloopt dan aan de linkerkant. */
  speels: maakGolf({ start: 22, eind: 92, amp: 17, golven: 1.3, fase: 0.5 }),
  /* twee volle, ondiepe deiningen — de enige golf op de pagina die meer dan
     anderhalve slag maakt. Sluit het prijzenveld af zonder een kant te
     kiezen: hij begint en eindigt op bijna dezelfde hoogte. */
  ribbel: maakGolf({ start: 58, eind: 52, amp: 15, golven: 2.05, fase: 0.8 }),
} as const;

export function Golf({
  kleur, flip = false, vorm = "zacht", hoogte = "h-[60px] sm:h-[96px]",
}: { kleur: string; flip?: boolean; vorm?: keyof typeof GOLVEN; hoogte?: string }) {
  /* Zonder flip: onderin de sectie, gevuld met de kleur van het vólgende veld.
     Met flip: bovenin de sectie, gevuld met de kleur van het vórige veld —
     dat veld hapt dan golvend deze sectie in. Beide blijven binnen de sectie,
     dus overflow-hidden knipt niets weg. */
  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-[5] leading-[0]"
      style={flip ? { top: -1 } : { bottom: -1 }}
      aria-hidden
    >
      <svg
        viewBox="0 0 1440 110"
        preserveAspectRatio="none"
        className={`block w-full ${hoogte}`}
        style={flip ? { transform: "scaleY(-1)" } : undefined}
      >
        <path d={GOLVEN[vorm]} fill={kleur} />
      </svg>
    </div>
  );
}

/* ── Grote flat silhouetten (onze palmbladeren): schoolgerei, één tint ── */

/* Elke silhouet bestaat uit twee lagen: de buitenste span draagt de plek,
   draaiing en scroll-parallax (data-wpar), de svg erin wiegt traag heen en
   weer zoals de palmbladeren van de referentie. `tel` spreidt de wieg-
   animaties in de tijd zodat ze niet synchroon lopen. */
function SilhouetWrap({
  par, style, tel = 0, className = "", children,
}: { par: number; style: CSSProperties; tel?: number; className?: string; children: ReactNode }) {
  return (
    <span className={`pointer-events-none absolute ${className}`} style={style} aria-hidden data-wpar={par}>
      <span
        className="wereld-wieg block"
        style={{ animationDelay: `${-tel * 3.6}s`, animationDuration: `${14 + (tel % 3) * 2}s` }}
      >
        {children}
      </span>
    </span>
  );
}

function SilhouetVliegtuig({ kleur, style, tel }: { kleur: string; style: CSSProperties; tel?: number }) {
  return (
    <SilhouetWrap par={0.07} style={style} tel={tel}>
      <svg viewBox="0 0 100 92" className="block w-full">
        <g fill={kleur}>
          <path d="M0 44 L100 0 L47 54 Z" />
          <path d="M47 58 L98 6 L58 90 L42 66 Z" />
        </g>
      </svg>
    </SilhouetWrap>
  );
}

function SilhouetLiniaal({ kleur, veld, style, tel }: { kleur: string; veld: string; style: CSSProperties; tel?: number }) {
  return (
    <SilhouetWrap par={0.04} style={style} tel={tel}>
      <svg viewBox="0 0 200 46" className="block w-full">
        <rect width="200" height="46" rx="9" fill={kleur} />
        {[20, 44, 68, 92, 116, 140, 164, 188].map((x, i) => (
          <rect key={x} x={x} y="0" width="3.5" height={i % 2 ? 12 : 18} rx="1.5" fill={veld} />
        ))}
      </svg>
    </SilhouetWrap>
  );
}

/* Losse drijvende spikkels: een paar stipjes die heel traag omhoog zweven
   binnen een kleurveld, als stof in het licht. */
function Drijvers({ punten }: { punten: Array<{ x: string; y: string; amber?: boolean; tel?: number }> }) {
  return (
    <>
      {punten.map((p, i) => (
        <span
          key={i}
          className="wereld-stip pointer-events-none absolute h-2 w-2 rounded-full"
          style={{
            left: p.x,
            top: p.y,
            background: p.amber ? "var(--color-accent, #f59e0b)" : "var(--color-brand, #2f9e6e)",
            animationDelay: `${-(p.tel ?? i) * 5.2}s`,
          }}
          aria-hidden
        />
      ))}
    </>
  );
}

/* De klodder-knop: dé knopvorm van de wereld. `vol` = merkgroen met een wit
   vinkje, `licht` = wit met inkt, `wit` = wit met donkergroen (voor op het
   donkere slotveld). */
export function BlobKnop({
  href, variant = "vol", maat = "normaal", className = "", onClick, children,
}: {
  href: string;
  variant?: "vol" | "licht" | "wit";
  /* `klein` is voor krappe plekken (de knop óp een toolkaart): zelfde vorm en
     gewicht, alleen minder ruimte eromheen, zodat het label bij een smalle
     kaart niet buiten de knop valt. */
  maat?: "normaal" | "klein";
  className?: string;
  /* Next roept dit aan vóór het navigeren en slaat de navigatie over zodra de
     klik is afgebroken (`e.preventDefault()`). Zo kan een knop in een
     sleepbare rij een sleepbeweging tegenhouden zonder toch te navigeren. */
  onClick?: (e: ReactMouseEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
}) {
  const stijl =
    variant === "vol"
      ? "bg-brand text-white shadow-lg shadow-brand/25 hover:bg-brand-dark"
      : variant === "wit"
        ? "bg-white shadow-lg"
        : "border-2 border-ink/10 bg-white text-ink hover:border-ink/20";
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`blobknop inline-flex items-center justify-center gap-2.5 whitespace-nowrap text-center font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand ${
        maat === "klein" ? "px-5 py-3.5 text-base" : "px-8 py-4 text-lg"
      } ${stijl} ${className}`}
      style={variant === "wit" ? { color: DONKER } : undefined}
    >
      {variant === "vol" && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/20" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="#fff" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
        </span>
      )}
      {children}
    </Link>
  );
}

/* Een echte gevallen verf-klodder (splat): een grillig, onregelmatig silhouet
   met uitlopers/vingers én een paar losse satelliet-druppels eromheen, alsof
   er een klodder verf op het papier is gevallen. De vorm wordt deterministisch
   gegenereerd uit `seed` (deterministische ruis via sin, dus geen Math.random →
   geen hydration-mismatch), zodat elke klodder uniek maar reproduceerbaar is.
   De randen worden met een gesloten Catmull-Rom-spline vloeiend gemaakt. */
function SilhouetSplat({
  kleur, seed = 0, punten = 26, plat = 0.7, vinger = 1.16, style, tel, className,
}: { kleur: string; seed?: number; punten?: number; plat?: number; vinger?: number; style: CSSProperties; tel?: number; className?: string }) {
  // Vorm rond de oorsprong (0,0); `plat` drukt de Y in zodat de klodder
  // breder-dan-hoog wordt. De viewBox wordt exact op de vorm gezet, zodat de
  // gerenderde hoogte voorspelbaar ≈ breedte × plat is (nette plaatsing,
  // geen afsnijding bij sectiegrenzen).
  const N = punten, base = 118;
  const rawPts: Array<[number, number]> = [];
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2;
    let r = base * (1 + 0.19 * Math.sin(i * 1.3 + seed) + 0.11 * Math.sin(i * 2.7 + seed * 1.7) + 0.06 * Math.sin(i * 4.1 + seed * 0.6));
    // af en toe een langere "vinger" waar de verf is uitgelopen. Standaard
    // bleef die op 1,52 staan en dan wordt het geen gevallen klodder maar een
    // ster: spitse punten die als pootjes onder de kaarten vandaan steken.
    // Met meer punten en een zachtere uitloop blijft het een ronde vlek.
    if ((i + Math.round(seed * 3)) % 7 === 0) r *= vinger;
    rawPts.push([r * Math.cos(ang), r * Math.sin(ang)]);
  }
  const rawDrops: Array<[number, number, number]> = [];
  for (let k = 0; k < 3; k++) {
    const ang = seed * 0.9 + k * 1.9;
    const dist = base * (1.5 + 0.28 * Math.sin(k * 2 + seed));
    const rr = 5 + 6 * Math.abs(Math.sin(k * 3 + seed * 1.4));
    rawDrops.push([dist * Math.cos(ang), dist * Math.sin(ang), rr]);
  }
  // Normaliseer de Y zodat de eindverhouding hoogte/breedte exact `plat`
  // wordt (ongeacht waar de vingers vallen). Zo is de gerenderde hoogte
  // voorspelbaar = breedte × plat en past de splat netjes in zijn sectie.
  let rx0 = Infinity, rx1 = -Infinity, ry0 = Infinity, ry1 = -Infinity;
  rawPts.forEach(([x, y]) => { if (x < rx0) rx0 = x; if (x > rx1) rx1 = x; if (y < ry0) ry0 = y; if (y > ry1) ry1 = y; });
  rawDrops.forEach(([x, y, r]) => { if (x - r < rx0) rx0 = x - r; if (x + r > rx1) rx1 = x + r; if (y - r < ry0) ry0 = y - r; if (y + r > ry1) ry1 = y + r; });
  const sy = (plat * (rx1 - rx0)) / (ry1 - ry0);
  const pts = rawPts.map(([x, y]) => [x, y * sy] as [number, number]);
  const drops = rawDrops.map(([x, y, r]) => [x, y * sy, r] as [number, number, number]);
  const P = (i: number) => pts[((i % N) + N) % N];
  let d = `M ${P(0)[0].toFixed(1)} ${P(0)[1].toFixed(1)}`;
  for (let i = 0; i < N; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  d += " Z";
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  pts.forEach(([x, y]) => { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; });
  drops.forEach(([x, y, r]) => { if (x - r < minX) minX = x - r; if (x + r > maxX) maxX = x + r; if (y - r < minY) minY = y - r; if (y + r > maxY) maxY = y + r; });
  const m = 12;
  const vb = `${(minX - m).toFixed(1)} ${(minY - m).toFixed(1)} ${(maxX - minX + 2 * m).toFixed(1)} ${(maxY - minY + 2 * m).toFixed(1)}`;
  return (
    <SilhouetWrap par={0.03} style={style} tel={tel} className={className}>
      <svg viewBox={vb} className="block w-full">
        <path d={d} fill={kleur} />
        {drops.map((dp, i) => (
          <circle key={i} cx={dp[0].toFixed(1)} cy={dp[1].toFixed(1)} r={dp[2].toFixed(1)} fill={kleur} />
        ))}
      </svg>
    </SilhouetWrap>
  );
}

/* Een terugkerend achtergrondveld van verf-klodders — ons antwoord op de
   herhaalde palmbladeren van de referentie. Per sectie een handjevol grote
   splats in wisselende vorm (seed), kleur en formaat, als rustige onderlaag
   achter de kaarten. De z-index verschilt per sectie (meegegeven via
   className): in mint-secties boven de golf (z-[6]), op papier juist achter
   de kaarten (-z-10 in een geïsoleerde sectie). Alleen op desktop. */
export function SplatVeld({
  items, className = "",
}: {
  items: Array<{ kleur: string; seed?: number; plat?: number; style: CSSProperties; tel?: number }>;
  className?: string;
}) {
  return (
    <div className={`pointer-events-none absolute inset-0 hidden lg:block ${className}`} aria-hidden>
      {items.map((it, i) => (
        <SilhouetSplat key={i} kleur={it.kleur} seed={it.seed} plat={it.plat} style={it.style} tel={it.tel} />
      ))}
    </div>
  );
}

/* ── De uitvergrote kaartvorm ──────────────────────────────────────────────
   Het achtergrondmotief dat wél van deze site is. Een verf-klodder komt uit
   een schildersatelier en heeft met een werkplek voor leerkrachten niets te
   maken; deze vorm is letterlijk de blob-vorm van onze eigen kaarten en van
   de klodder-knop — dezelfde ongelijke acht-waarden-radii, alleen tien keer
   zo groot en tint-op-tint. De achtergrond is daarmee een vergroting van de
   site zelf in plaats van een gast van buiten, en omdat het contrast met de
   ondergrond klein is, kan hij nooit met de tekst gaan concurreren.

   `vorm` kiest uit VLAKVORMEN: elke plek op de pagina krijgt een andere, want
   dezelfde ovaal vijf keer herhalen leest als één vorm en niet als een taal. */
export function KaartVlak({
  kleur, vorm, breedte, hoogte, style, tel, className = "",
}: {
  kleur: string; vorm: keyof typeof VLAKVORMEN; breedte: number; hoogte: number;
  style: CSSProperties; tel?: number; className?: string;
}) {
  return (
    <SilhouetWrap par={0.022} style={style} tel={tel} className={className}>
      <span className="block" style={{ width: breedte, height: hoogte, background: kleur, borderRadius: VLAKVORMEN[vorm] }} />
    </SilhouetWrap>
  );
}

/* ── Confetti: een paar losse stipjes rond een blok ── */
export function Confetti({ punten }: { punten: Array<{ x: string; y: string; r?: number; amber?: boolean }> }) {
  return (
    <>
      {punten.map((p, i) => (
        <span
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: (p.r ?? 5) * 2,
            height: (p.r ?? 5) * 2,
            background: p.amber ? "var(--color-accent, #f59e0b)" : "var(--color-brand, #2f9e6e)",
            opacity: p.amber ? 0.55 : 0.4,
          }}
          aria-hidden
        />
      ))}
    </>
  );
}

/* ── De effecten-motor ──────────────────────────────────────────────────
   Onzichtbaar component dat al het "leven" van de wereld aanstuurt, naar
   het model van de referentie (waar de palmbladeren altijd zachtjes wiegen):
   1. de wieg-animatie van de silhouetten (CSS, hieronder);
   2. de scroll-parallax van de silhouetten (data-wpar);
   3. de muis-diepte van de zwevende kaartjes (data-diepte): de cursor
      stuurt twee CSS-variabelen (--mx/--my, -1..1) en elk kaartje schuift
      daar zijn eigen diepte-factor mee op.
   prefers-reduced-motion zet alles stil. ── */
export function WereldFx() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const wortel = document.documentElement;
    const silhouetten = [...document.querySelectorAll<SVGElement>("[data-wpar]")];
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        silhouetten.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const mid = rect.top + rect.height / 2 - window.innerHeight / 2;
          const sp = parseFloat(el.dataset.wpar || "0");
          el.style.translate = `0 ${(-mid * sp).toFixed(1)}px`;
        });
        raf = 0;
      });
    };
    let muisRaf = 0;
    const onMuis = (e: MouseEvent) => {
      if (muisRaf) return;
      muisRaf = requestAnimationFrame(() => {
        wortel.style.setProperty("--mx", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        wortel.style.setProperty("--my", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
        muisRaf = 0;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMuis, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMuis);
      if (raf) cancelAnimationFrame(raf);
      if (muisRaf) cancelAnimationFrame(muisRaf);
    };
  }, []);

  return (
    <style>{`
      @keyframes wereld-wieg {
        0%, 100% { transform: rotate(-1.6deg) translateY(0); }
        50% { transform: rotate(1.6deg) translateY(-10px); }
      }
      .wereld-wieg { animation: wereld-wieg 15s ease-in-out infinite; transform-origin: 50% 100%; will-change: transform; }
      @keyframes wereld-drijf {
        0%, 100% { transform: translateY(0) rotate(var(--dr, 0deg)); }
        50% { transform: translateY(-13px) rotate(var(--dr, 0deg)); }
      }
      .wereld-drijf { animation: wereld-drijf 6.5s ease-in-out infinite; }
      @keyframes wereld-stip {
        0% { transform: translateY(0); opacity: 0; }
        12% { opacity: .5; }
        88% { opacity: .5; }
        100% { transform: translateY(-46vh); opacity: 0; }
      }
      .wereld-stip { animation: wereld-stip 16s linear infinite; }
      @keyframes wereld-zweefvlucht {
        0% { offset-distance: 0%; }
        100% { offset-distance: 100%; }
      }
      .wereld-vlucht { offset-path: path('M 0 60 C 180 -20, 420 120, 660 30 C 830 -30, 1020 70, 1200 10'); offset-rotate: auto 12deg; animation: wereld-zweefvlucht 34s linear infinite; }
      .muiskaart { transform: translate(calc(var(--mx, 0) * var(--diep, 0) * 1px), calc(var(--my, 0) * var(--diep, 0) * 1px)); transition: transform .35s cubic-bezier(.2,.7,.2,1); }
      /* De klodder-knop: organisch-ongelijke rondingen (familie van de
         blob-kaarten) die bij hover van vorm wisselen — onze eigen knopvorm,
         zoals de referentie zijn golf-knoppen heeft. */
      .blobknop { border-radius: var(--w-knop-radius, 2.1rem 1.3rem 2.2rem 1.4rem); transition: border-radius .45s cubic-bezier(.2,.7,.2,1), transform .2s ease, background-color .2s ease, box-shadow .2s ease; }
      .blobknop:hover { border-radius: var(--w-knop-radius-hover, 1.3rem 2.2rem 1.4rem 2.1rem); transform: translateY(-2px) rotate(-0.6deg); }
      .blobknop:active { transform: translateY(0) scale(.97); }
      @media (prefers-reduced-motion: reduce) {
        .wereld-wieg, .wereld-drijf, .wereld-stip, .wereld-vlucht { animation: none; }
        .muiskaart { transform: none; }
      }
    `}</style>
  );
}

/* ════════════════════════ DE SECTIES ════════════════════════ */

/* 1. Intro: wat Avinka is. Op het gespikkelde papier, met om de tekst heen
   een paar lichte school-vormpjes die zachtjes wiegen — geen product-
   fragmenten (die zitten al in de film en bij de tools). */
export function WereldIntro() {
  return (
    // overflow-x-clip (i.p.v. -hidden): horizontaal netjes geclipt, verticaal
    // niet. Dat mocht, want tóén stond deze sectie bovenaan de body met alleen
    // papieren ademruimte erboven.
    <section className="relative overflow-x-clip">
      {/* Hier stond een verf-klodder onder de rechter alinea, maar die las als
         een cartoon-explosie. Nu draagt de golf naar de sectie hieronder die
         hoek (het mintveld loopt daar rechts flink omhoog) en ligt er alleen
         nog een uitvergrote kaartvorm achter — de vorm van de site zelf. */}
      {/* Hier stonden nog een gum- en een boek-silhouet achter de tekst.
         Eruit op verzoek; het uitvergrote kaartvlak rechts draagt deze sectie
         verder alleen. */}
      <KaartVlak
        kleur={MINT_LICHT}
        breedte={620}
        hoogte={430}
        /* Hij LOOPT DOOR over de sectiegrens, tot op het mintveld erboven.
           Twee dingen waren daarvoor nodig:

           1. z-[11]. De lagen van "Herken je dit?" (golf z-5, vlakken z-6,
              inhoud z-10) zitten in dezelfde stapelcontext als deze sectie en
              schilderden er dus overheen — dát was de kaarsrechte afsnijding.
              Elf ligt daar net boven.
           2. De kleur van het mintveld zelf, en dus GEEN mengmodus. Waar hij
              over het veld valt is hij per definitie onzichtbaar, en waar hij
              eronder uitkomt leest hij als een uitloper van datzelfde veld.
              De vorm en de sectie erboven zijn daarmee één ding in plaats van
              twee die elkaar raken. */
        style={{
          right: "-6%",
          top: -60,
          transform: "rotate(-11deg)",
        }}
        vorm="ei"
        className="z-[11] hidden lg:block"
        tel={1}
      />

      {/* De tekstkolom kreeg iets meer breedte (0,9 / 1,1 in plaats van
         1 / 1,05): de uitleg hiernaast is de kern van de hele pagina en las
         als een zijopmerking. Met een bredere kolom past de eerste zin op
         minder regels en kan hij groter staan zonder te versnipperen. */}
      {/* z-20: het vlak hierboven staat op 11 om over de lagen van de sectie
         ervóór heen te komen, en zou anders ook over deze tekst heen vallen —
         nu het een dekkende mintkleur heeft in plaats van een doorschijnende
         tint is dat niet meer onschuldig. */}
      <div className="relative z-20 mx-auto grid w-full max-w-5xl gap-10 px-6 pb-24 pt-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:pb-32 lg:pt-24">
        <Confetti punten={[{ x: "2%", y: "18%", r: 4, amber: true }, { x: "96%", y: "70%", r: 5 }, { x: "88%", y: "8%", r: 3 }]} />
        <div>
          <h2
            data-reveal
            className="font-display text-[clamp(1.875rem,3.1vw,2.5rem)] font-black leading-[1.06] tracking-tight [text-wrap:balance]"
            style={{ color: KOP }}
          >
            De slimme werkplek voor leerkrachten in het basisonderwijs
          </h2>
          <div data-reveal className="mt-8 flex flex-col gap-3 sm:flex-row">
            <BlobKnop href="/sign-up" className="w-full sm:w-auto">Probeer Avinka gratis</BlobKnop>
            <BlobKnop href="#tools" variant="licht" className="w-full sm:w-auto">Bekijk de tools</BlobKnop>
          </div>
        </div>
        {/* Dit is de uitleg van het hele product en stond er in dezelfde maat
           en kleur bij als elke andere bijzin op de pagina. Nu in twee stukken
           met een echte rangorde: de eerste zin zegt wát Avinka is en staat
           groot en in de kopkleur, de rest legt uit hoe dat werkt en blijft
           gewone lopende tekst. Zo valt de kern op zonder dat het blok gaat
           schreeuwen. */}
        <div className="max-w-2xl lg:pt-1">
          <p
            data-reveal
            className="text-[1.375rem] font-semibold leading-9 [text-wrap:balance] sm:text-2xl sm:leading-10"
            style={{ color: KOP }}
          >
            Avinka brengt de hulpmiddelen voor je schoolwerk samen in één
            omgeving.
          </p>
          <p data-reveal className="mt-4 text-lg leading-8 text-ink/75" style={{ transitionDelay: "90ms" }}>
            Je geeft aan wat je nodig hebt en Avinka helpt je met de uitwerking,
            zodat terugkerende taken minder tijd kosten en je werk
            overzichtelijk blijft.
          </p>
        </div>
      </div>
    </section>
  );
}

/* 2. Herken je dit? Mint-veld, drie witte kaarten die trapsgewijs hangen,
   groot potlood-silhouet als ons palmblad. */
export const PIJN = [
  {
    titel: "Te veel administratie",
    tekst: "Je wilt er zijn voor je klas, maar raakt steeds meer tijd kwijt aan formulieren, analyses en verslagen.",
  },
  {
    titel: "Alles staat verspreid",
    tekst: "Voor elke taak weer een andere tool, website of document. Niets komt op één plek samen.",
  },
  {
    titel: "Het schuift steeds door",
    tekst: "Taken die je eigenlijk allang af had willen hebben, blijven op de stapel liggen.",
  },
];

export function WereldHerken() {
  return (
    <section className="relative overflow-hidden" style={{ background: MINT_LICHT }}>
      {/* Deze overgang is de grootste van de pagina: het papier hangt links
         diep door en trekt zich rechts helemaal terug, zodat het mintveld aan
         de rechterkant flink omhoog loopt — precies achter de intro-alinea
         die daarboven eindigt. Dat vult die hoek met de eigen sectietaal in
         plaats van met een losse vlek. De onderrand van deze sectie loopt
         dezelfde kant op, waardoor het hele mintveld een schuine band wordt. */}
      <Golf kleur="var(--w-papier, #fcfbf7)" flip vorm="oploopLinks" hoogte="h-[80px] sm:h-[140px]" />
      {/* Van drie klodders naar één. De twee die weg zijn: een zandkleurige
         rechtsonder (twee accentkleuren in één beeld vechten met elkaar) en
         een kleine linksonder. Wat overblijft is de grote, nu in dezelfde
         kleurfamilie als het veld eronder: dit is de plek waar de vlek een
         uitzondering mag zijn, niet het behang van de hele pagina. */}
      <SplatVeld
        className="z-[6]"
        items={[
          { kleur: VLAK_MINT_ZACHT, seed: 2.4, plat: 0.86, style: { width: 700, left: "45%", top: 170, transform: "rotate(4deg)" }, tel: 2 },
        ]}
      />
      {/* De linkerkolom loopt leeg zodra de sticky kop wegscrollt, dus daar
         hoort iets te liggen. Maar twéé vlakken die elkaar overlappen werd
         hier te druk: ze telden op tot één groot donker gebied naast de
         kaarten. Eén breed, laag vlak in de zachtste tint is genoeg om de
         hoek te dragen zonder aandacht te vragen. */}
      <KaartVlak
        kleur={VLAK_MINT_ZACHT}
        vorm="koepel"
        breedte={820}
        hoogte={320}
        style={{ left: "-18%", bottom: 130, transform: "rotate(6deg)" }}
        className="z-[6] hidden lg:block"
        tel={5}
      />
      <Drijvers punten={[{ x: "46%", y: "88%", amber: true, tel: 2 }, { x: "88%", y: "80%", tel: 4 }]} />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-28 pt-32 lg:pb-36 lg:pt-40">
        <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <div>
            <h2
              data-reveal
              className="font-display text-[clamp(2.25rem,4.4vw,3.5rem)] font-black leading-[0.98] tracking-tight lg:sticky lg:top-28"
              style={{ color: DONKER }}
            >
              Herken
              <br />
              je dit?
            </h2>
            {/* Drie regels in plaats van twee. Kalam loopt breder dan de Caveat
               die hier eerst stond, waardoor "efficiënter" als los woord op een
               derde regel viel — een wees. Kleiner zetten hielp wel maar kostte
               aanwezigheid; drie korte regels lezen bij handschrift juist
               natuurlijk, dus de maat kon terug omhoog. De tekst is
               ongewijzigd, alleen de regelval. */}
            <p
              data-reveal
              className="mt-6 text-2xl leading-snug lg:sticky lg:top-60"
              style={{ fontFamily: "var(--font-hand)", color: KOP }}
            >
              Het hoort bij het werk,
              <br />
              maar het kan slimmer,
              <br />
              sneller en efficiënter
            </p>
          </div>

          <div className="relative">
            <Confetti punten={[{ x: "-4%", y: "-3%", r: 4, amber: true }, { x: "101%", y: "48%", r: 5 }]} />
            {PIJN.map((p, i) => (
              <div
                key={p.titel}
                data-reveal
                style={
                  {
                    transitionDelay: `${i * 110}ms`,
                    "--stap": `${i * 22}px`,
                    rotate: `${i % 2 ? 0.8 : -0.8}deg`,
                  } as CSSProperties
                }
                className={`${KAART} relative mb-6 flex items-start gap-5 p-7 lg:ml-[var(--stap)]`}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand" aria-hidden>
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-display text-2xl font-black tracking-tight text-ink">{p.titel}</h3>
                  <p className="mt-1.5 text-lg leading-7 text-ink/70">{p.tekst}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Zelfde helling als de bovenrand: het papier komt links hoog terug en
         blijft rechts laag, zodat het mintveld als geheel schuin oploopt. */}
      <Golf kleur="var(--w-papier, #fcfbf7)" vorm="oploopLinks" />
    </section>
  );
}


/* 6. De maker: mint-veld met liniaal-silhouet, één witte kaart. */
export function WereldMaker({ fotoBestand }: { fotoBestand?: string }) {
  return (
    <section className="relative overflow-hidden">
      {/* Het mintveld begon eerst bovenaan deze sectie, en dan zat de golf
         maar een paar tientallen pixels onder de golf van de sectie erboven:
         twee randen vlak op elkaar, waardoor het als één rommelige overgang
         las. Nu begint de mint pas op de halve hoogte van de sectie — en
         omdat de verticale padding hier symmetrisch is, valt dat precies
         halverwege de kaart. De kaart ligt dus met zijn bovenkant op papier
         en met zijn onderkant op mint, en de twee golven hebben ruimte.
         (Spiegelbeeld van de regie-sectie, waar de mint juist bovenin zit.) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-1/2" aria-hidden>
        <div className="absolute inset-0" style={{ background: MINT_LICHT }} />
        <Golf kleur="var(--w-papier, #fcfbf7)" flip vorm="kam" />
      </div>
      {/* De liniaal hoort in het mintveld te liggen, dus onderin de sectie. */}
      <SilhouetLiniaal kleur={MINT_DIEP} veld={MINT_LICHT} style={{ width: 460, left: -120, bottom: 150, transform: "rotate(-14deg)" }} />
      {/* De bovenhelft van deze sectie (nog papier) had niets. Samen met de
         onderkant van de privacysectie was dat het grootste gat in het
         achtergrondweefsel van de pagina. Rechts, tegenover de liniaal die
         onderin links ligt. */}
      <KaartVlak
        kleur={VLAK_PAPIER}
        vorm="wig"
        breedte={600}
        hoogte={320}
        style={{ right: "-12%", top: 60, transform: "rotate(-8deg)" }}
        className="hidden lg:block"
        tel={6}
      />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-32 pt-32 lg:pb-36 lg:pt-36">
        {/* De kaart hoort nu bij de familie: organische radii, tonale rand en
           het vinkje-badge op de bovenrand, net als de regie-kaartjes. Hij was
           daarvoor een strak afgerond blok met drie lange alinea's, waardoor
           hij als een lap tekst las in plaats van als een kennismaking. */}
        <div
          data-reveal
          className="relative border-[2.5px] px-8 py-12 sm:px-14 sm:py-14"
          style={{
            /* niet puur wit: een warme papiertoon houdt de kaart in dezelfde
               wereld als het gespikkelde papier van de pagina */
            background: "var(--w-kaart-warm, #fffdf9)",
            borderRadius: "3.2rem 2.4rem 3.4rem 2.6rem / 2.6rem 3.4rem 2.4rem 3.2rem",
            borderColor: KAART_RAND,
            boxShadow: KAART_SCHADUW,
            rotate: "-0.6deg",
          }}
        >
          <Confetti punten={[{ x: "94%", y: "8%", r: 5, amber: true }, { x: "2%", y: "86%", r: 4 }]} />
          {/* Hier hing een groen vinkje-badge over de bovenrand. Eruit op
             verzoek: het vinkje van het merk zit al in het mintblok onderaan
             deze kaart, en op een kennismaking met de maker voegt een
             afvink-teken niets toe. */}

          <div className="relative flex flex-col gap-10 sm:flex-row sm:items-stretch sm:gap-12">
            {/* Portretkolom: de foto in een organische vorm in plaats van een
               cirkel, met een zacht mintvlak dat er schuin onderuit steekt.
               Naam en rol staan hier, niet onderaan de tekst: dan leest het
               als een kennismaking en niet als een ondertekende brief. Het
               naamblok wordt naar beneden geduwd (mt-auto), want anders bleef
               er een groot leeg wit gat onder in de linkerhelft van de kaart. */}
            <div className="flex shrink-0 flex-col sm:w-52">
              <div className="relative h-32 w-32 sm:h-52 sm:w-52">
                {/* het vlak steekt naar één kant uit, niet rondom: anders
                   valt het samen met de foto en wordt het een ring */}
                <span
                  className="absolute -bottom-5 -left-6 -right-1 -top-1"
                  style={{ background: MINT, borderRadius: VLAKVORMEN.kiezel, rotate: "-9deg" }}
                  aria-hidden
                />
                <span
                  className="relative flex h-full w-full items-center justify-center overflow-hidden"
                  style={{ background: MINT_DIEP, borderRadius: VLAKVORMEN.ei, rotate: "3deg" }}
                >
                  {fotoBestand ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/${fotoBestand}`} alt="Michael van Spanje" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display text-4xl font-black" style={{ color: DONKER }}>MvS</span>
                  )}
                </span>
              </div>
              <div className="mt-8 sm:mt-auto sm:pt-10">
                <p className="text-3xl leading-none text-ink/85" style={{ fontFamily: "var(--font-hand)" }}>Michael</p>
                <p className="mt-1.5 text-sm text-ink/60">Leerkracht &amp; maker van Avinka</p>
              </div>
            </div>

            <div>
              <p className="text-2xl leading-none" style={{ fontFamily: "var(--font-hand)", color: KOP }}>
                van een leerkracht, voor leerkrachten
              </p>
              <h2 className="mt-3 font-display text-3xl font-black leading-[1.06] tracking-tight [text-wrap:balance] sm:text-4xl" style={{ color: DONKER }}>
                Ik ben Michael. Net als jij sta ik voor de klas.
              </h2>
              <p className="mt-6 text-lg leading-8 text-ink/75">
                Ik weet hoeveel tijd er gaat naar rapporten, analyses en
                verslagen. Daarom bouw ik hulpmiddelen die dat werk sneller en
                eenvoudiger maken. Geen ingewikkelde techniek, wel zorgvuldig
                met de gegevens van je leerlingen.
              </p>
              <p className="mt-4 text-lg leading-8 text-ink/75">
                Wat begon als een oplossing voor mijn eigen werk, werd een
                bredere missie: laten zien dat slimmer werken juist eenvoudig
                kan zijn.
              </p>
              {/* De slotregel was vet gedrukte tekst op wit en verdween
                 daardoor in de rest van de kaart, terwijl het juist de zin is
                 die je moet onthouden. Nu is het een eigen mintblok in de vorm
                 van de kaarten zelf: het geeft de kaart kleur én zet de zin
                 apart als het punt van het verhaal.
                 Er hing ook een vinkje-badge over de bovenrand van dit blok;
                 die is er samen met die van de kaart zelf uit. */}
              <div
                className="relative mt-8 px-7 py-6"
                style={{ background: MINT, borderRadius: "2.4rem 1.6rem 2.2rem 1.5rem" }}
              >
                <p className="text-lg font-bold leading-8" style={{ color: DONKER }}>
                  Goede leerkrachten horen hun tijd te besteden aan leerlingen,
                  niet aan papierwerk.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Het mintveld loopt hier NIET meer dood: het gaat gewoon door tot de
         onderrand van de sectie en zet zich in de ervaringen-sectie eronder
         voort (zelfde MINT-tint, dus geen naad op de overgang). Daar krijgt
         het pas zijn eigen speelse zaagtand-overgang terug naar papier. */}
    </section>
  );
}

/* ── De lichtplas ─────────────────────────────────────────────────────────
   De tweede helft van "één lichtbron": de bron zelf. Eén warme plas licht
   die hoort bij de schaduwrichting hierboven (zie SCHADUW_HELLING).

   Drie keuzes die hem rustig houden:
   1. De kern ligt BUITEN beeld (rechtsboven, net voorbij de hoek). Je ziet
      dus nooit een cirkel of een hotspot, alleen de uitloop ervan — precies
      zoals licht dat door een raam naar binnen valt. Zodra je de bron zelf
      ziet, wordt het een vorm en dan is het decoratie.
   2. Hij staat VAST aan het scherm. Daardoor beweegt er niets: het is de
      pagina die onder het licht door schuift, niet het licht dat over de
      pagina kruipt. Elke sectie wordt op dezelfde manier belicht en dat is
      precies wat "één ruimte" betekent.
   3. Zeer lage dekking, en warm in plaats van wit. De pagina is koel (mint
      op mint); dit is het enige dat er warmte in brengt.

   Dat "vast aan het scherm" gebeurt met `background-attachment: fixed` en
   NIET met `position: fixed`. Een fixed element negeert namelijk waar zijn
   ouder staat en legde de warme waas dus ook over de film bovenaan — die
   werd daar olijfgroen en verloor zijn eigen avond-naar-dag-belichting. Met
   background-attachment blijft de plas in schermcoördinaten staan, maar is
   hij alleen te zien binnen dit element (de body). iOS Safari negeert de
   eigenschap; daar schuift de plas gewoon mee, wat prima degradeert.

   Ligt boven de sectie-achtergronden maar onder de vaste bovenbalk (z-40),
   zodat de groene knop rechtsboven scherp blijft. */
export function Lichtbron() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-30"
      aria-hidden
      style={{
        background:
          "radial-gradient(75vw 85vh at 94% -14%, rgba(255,241,206,0.26), rgba(255,241,206,0.11) 45%, rgba(255,241,206,0) 74%)",
        backgroundAttachment: "fixed",
      }}
    />
  );
}

/* 10. Slot: het donkergroene veld, één keer op de pagina. */
export function WereldSlot() {
  return (
    <section className="relative overflow-hidden" style={{ background: SLOT }}>
      <Golf kleur="var(--w-papier, #fcfbf7)" flip />
      <SilhouetVliegtuig kleur="#ffffff" style={{ width: 300, right: -40, top: 60, transform: "rotate(14deg)", opacity: 0.05 }} tel={1} />
      {/* Ook hier stond een potlood-silhouet; op deze schaal en bij dit lage
         contrast was er geen potlood meer in te herkennen, alleen een wig.
         Een organisch vlak doet hetzelfde werk en hoort bij de rest. */}
      <KaartVlak
        kleur="rgba(255,255,255,0.05)"
        vorm="schelp"
        breedte={620}
        hoogte={380}
        style={{ left: "-8%", bottom: 40, transform: "rotate(-9deg)" }}
        className="hidden lg:block"
        tel={2}
      />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-32 pt-36 text-center">
        <Confetti punten={[{ x: "16%", y: "18%", r: 4, amber: true }, { x: "82%", y: "12%", r: 5 }, { x: "90%", y: "70%", r: 4, amber: true }]} />
        {/* Hier stond een wit vierkant met het merkvinkje boven de slotkop.
           Eruit op verzoek; de kop begint nu meteen. */}
        <h2 data-reveal className="font-display text-[clamp(2.5rem,5.5vw,4rem)] font-black leading-[1.02] tracking-tight text-white [text-wrap:balance]">
          Kom binnen. Je werkplek staat klaar.
        </h2>
        <p data-reveal className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/75">
          7 dagen gratis proberen, zonder betaalgegevens vooraf.
        </p>
        <div data-reveal className="mt-9">
          <BlobKnop href="/sign-up" variant="wit">Probeer Avinka gratis</BlobKnop>
        </div>
      </div>
    </section>
  );
}

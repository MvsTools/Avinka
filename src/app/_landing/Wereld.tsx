"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
/* ── DE SCHAKELAAR VOOR ACHTERGRONDRUIS OP PAPIER ──────────────────────────
   De pagina wisselt lege papiervelden af met mintvelden die door golven
   worden begrensd. Achtergrondvormen (blobs, silhouetten, confettistipjes)
   stonden in ALLEBEI, en op het kale papier werden ze ruis: er is daar geen
   veld dat ze draagt, dus ze zweven.

   Afspraak sinds 3-8: die vormen horen ALLEEN in de golvende mintvelden.
   Zet deze schakelaar op `true` en alles wat op papier stond komt precies
   terug zoals het was — de code is niet weggegooid, alleen uitgeschakeld.
   ⚠️ De vormen IN de mintvelden hangen hier niet aan; die blijven altijd staan.
   ────────────────────────────────────────────────────────────────────────── */
export const RUIS_OP_PAPIER = false;

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

/* Rand van de organische kaarten. Hier stond ook een bijpassende
   KAART_SCHADUW — schaduw(34, 66, -34, 0.6) — zodat de regie-kaartjes en de
   makerskaart gegarandeerd hetzelfde aanvoelden. Die is weg omdat de
   makerskaart een klein colofon-kaartje is geworden en een grote-kaart-
   schaduw hem laat zweven; hij draagt nu zijn eigen, kortere schaduw (zie
   WereldMaker). Privacy.tsx heeft een eigen kopie van allebei. */
const KAART_RAND = "var(--w-kaart-rand, #d4e5dc)";

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
  /* Blijft rechts diep in de mint hangen, deint (net als oploopLinks) een
     stukje omhoog en omlaag, en klimt dan door naar een kam die bijna alle
     mint wegneemt — links blijft dus een klein beetje mint over in plaats
     van een kaarsrechte lijn naar boven.
     ⚠️ TWEE MISLUKTE POGINGEN, ALLEBEI OP AMPLITUDE: eerst amp 55 (bijna
     de halve vakhoogte), toen amp 30 — beide ver boven de 11-34 die elke
     andere golf hier gebruikt. Deze golf is nu qua amp (19) en golven
     (1.35) een letterlijk hergebruik van oploopLinks/oploopRechts, niet iets
     nieuw verzonnens; alleen start/eind staan verder uit elkaar (10/94 i.p.v.
     26/90) omdat deze golf verder moet reizen. Reken je dat om naar echte
     pixels (het vak is hoger dan bij oploopLinks), dan komt hij nog zo'n 15%
     boven de grootste bestaande golf (zacht, ~54px) uit — dat is de prijs
     van de afstand die hij moet overbruggen, niet van een te grote amplitude
     an sich. Gebruikt met een Golf die zijn VOLLE vak beslaat (niet alleen
     een randje onderaan), anders is de reis te klein om iets voor te
     stellen. */
  stijging: maakGolf({ start: 10, eind: 94, amp: 19, golven: 1.35, fase: 1.2 }),
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

/* ⚠️ De liniaal is weg. Hij lag als enige nog in de makers-sectie en die is
   er 4-8 uit gehaald: daar ligt inmiddels een schrift met lijnen, een foto en
   vier bladzijden tekst, en dan is nog een stuk schoolgerei geen sfeer meer
   maar een derde ding dat om aandacht vraagt. De tekening zelf staat in de
   geschiedenis als hij ooit terug moet (het was een rechthoek met streepjes,
   twintig regels). */

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
      {/* Deze sectie heeft geen achtergrondvorm meer. Er stonden eerst een
         gum- en een boek-silhouet en daarna een uitvergroot kaartvlak; alle
         drie zijn er op verzoek uit. Wat overblijft is het gespikkelde papier
         met de losse stipjes, en het mintveld erboven dat met zijn golf de
         bovenrand van deze sectie maakt. */}
      {/* De tekstkolom kreeg iets meer breedte (0,9 / 1,1 in plaats van
         1 / 1,05): de uitleg hiernaast is de kern van de hele pagina en las
         als een zijopmerking. Met een bredere kolom past de eerste zin op
         minder regels en kan hij groter staan zonder te versnipperen. */}
      <div className="relative mx-auto grid w-full max-w-5xl gap-10 px-6 pb-24 pt-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:pb-32 lg:pt-24">
        {/* Papier: alleen zichtbaar met de schakelaar aan (zie RUIS_OP_PAPIER). */}
        {RUIS_OP_PAPIER && (
          <Confetti punten={[{ x: "2%", y: "18%", r: 4, amber: true }, { x: "96%", y: "70%", r: 5 }, { x: "88%", y: "8%", r: 3 }]} />
        )}
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


/* 6. De maker: een COLOFON, geen sectie over één persoon.
   ── Waarom dit stuk is gehalveerd ──────────────────────────────────────
   Wat hier stond was een kaart van bijna een heel scherm hoog: een portret
   van 208px, een display-kop van 36px ("Ik ben Michael. Net als jij sta ik
   voor de klas."), twee alinea's van vier regels en daaronder nóg een
   mintblok met de slotzin. Alles klopte los van elkaar, maar samen kreeg
   één persoon evenveel ruimte als het hele productverhaal erboven. Voor een
   serieus product is dat de verkeerde verhouding: het kaartje moet
   vertrouwen wekken, niet de pagina overnemen.

   Het is nu een colofon-kaartje: een klein, liggend object dat links in het
   veld ligt met open mint ernaast, ongeveer 40rem breed in plaats van
   paginabreed. Wat eruit ging en waarom:
   - de display-kop. Die deed inhoudelijk hetzelfde als de handgeschreven
     regel eronder ("van een leerkracht, voor leerkrachten") en was hier de
     tweede titel binnen één blok.
   - het aparte mintblok met de slotzin. Die zin is het punt van het
     verhaal, dus die is gebléven — maar nu als gewone tweede regel in
     kopkleur, waar hij precies dezelfde nadruk krijgt voor een fractie van
     de hoogte.
   - de alinea over "een bredere missie". Dat is een zin over de maker, niet
     over de lezer.
   Wat bleef: de foto in de organische vorm met het mintvlak dat er schuin
   onderuit steekt (het enige echt eigen detail van dit kaartje), de naam en
   de rol, en de tagline in handschrift.

   ⚠️ De VELDOPBOUW is met opzet niet aangeraakt: de mint begint nog steeds
   op de halve hoogte van de sectie, de padding boven en onder is nog steeds
   gelijk (dus de kleurnaad valt nog steeds halverwege de kaart) en de
   kam-golf is dezelfde. Alleen de maten van de achtergrondvormen zijn
   meegekrompen met de sectie — zie de opmerkingen daar. */
/* ── Het schriftje openen op scrollpositie ─────────────────────────────────
   De kaft draait open terwijl je scrollt: dicht als de sectie onderin beeld
   komt, helemaal open als hij op driekwart van het scherm staat. Bewust géén
   animatie die één keer afspeelt — de eigenaar vroeg om iets dat opengaat
   TIJDENS het scrollen, dus de stand hangt aan de scrollpositie en loopt ook
   terug als je omhoog scrolt.

   🔑 De hoek gaat naar een CSS-variabele op de wrapper (--open), niet naar de
   transform van de kaft zelf. Zo blijft de hele vormgeving in het stijlblad
   staan en schrijft dit effect maar één getal.

   Waarom rAF en geen scroll-handler die direct schrijft: een scroll-gebeurtenis
   vuurt vaker dan het scherm ververst, en elke schrijfactie naar style dwingt
   de browser tot herberekenen. Nu hoogstens één keer per frame, en alleen als
   het element in beeld is (dezelfde spaarzaamheid als het cijferbord). */
/* Hoeveel bladen er omslaan. Verandert dit, dan moeten de .w-blad-N-regels in
   het stijlblad mee (elk blad heeft zijn eigen diepte in de stapel). */
const BLADEN = 3;

/* ⚠️ HET BLADEREN ZAT EERST AAN DE SCROLL VAST, en dat is er op verzoek uit.
   De eigenaar wil er zélf doorheen kunnen bladeren: dat maakt van een
   filmpje-dat-afspeelt een voorwerp dat je vasthebt — precies het verschil
   dat de polaroids ook maken.
   START OP 1: het schrift ligt dus al open op de eerste bladzijde (foto en
   naam), niet dicht. Terugbladeren naar de kaft kan wel; daar staat het
   etiket met zijn naam erop. */
const START_BLAD = 1;

export function WereldMaker({ fotoBestand }: { fotoBestand?: string }) {
  const [omgeslagen, setOmgeslagen] = useState(START_BLAD);
  const verder = () => setOmgeslagen((n) => Math.min(BLADEN, n + 1));
  const terug = () => setOmgeslagen((n) => Math.max(0, n - 1));

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

        {/* ⚠️ Hier lag ruitjespapier over het mintveld. Eruit op verzoek: het
           schrift zelf heeft al lijnen, en dan is een tweede lijnenspel in de
           achtergrond eronder ruis in plaats van sfeer. Het veld is weer
           gewoon veld. */}

        {/* Rechts van de makerskaart begint het mintveld dat doorloopt tot in
           de ervaringen-sectie, en die hele rechterbovenhoek was leeg: de
           liniaal ligt linksonder en verder lag hier niets tot ver in de
           polaroids. Dit vlak vult hem en hangt met zijn bovenkant boven de
           golf uit, zodat de kam-golf hem op de mintrand afsnijdt.
           🔑 Het eigen overflow-vakje is nodig: deze laag zelf mag NIET
           clippen (dan knipt hij een pixel van de golf) en zonder vakje zou
           het vlak boven de golf uit het papier in steken — precies de fout
           die eerder bij het polaroid-vlak is hersteld. */}
        <div className="absolute inset-0 overflow-hidden">
          {/* ⚠️ Hier lag een liniaal-silhouet linksonder. Eruit op verzoek.
             Terecht ook: er ligt in deze sectie al een schrift met lijnen, een
             foto en vier bladzijden tekst. Nog een stuk schoolgerei in de
             achtergrond is dan geen sfeer meer maar een derde ding dat om
             aandacht vraagt. Het mintvlak rechts blijft; dat draagt de golf. */}
          <KaartVlak
            kleur={VLAK_MINT}
            vorm="ei"
            breedte={480}
            hoogte={260}
            style={{ right: "-6%", top: -50, transform: "rotate(7deg)" }}
            className="hidden lg:block"
            tel={5}
          />
        </div>

        <Golf kleur="var(--w-papier, #fcfbf7)" flip vorm="kam" />
      </div>
      {/* De bovenhelft van deze sectie (nog papier) had niets. Samen met de
         onderkant van de privacysectie was dat het grootste gat in het
         achtergrondweefsel van de pagina. Rechts, tegenover de liniaal die
         onderin links ligt. */}
      {/* Dit vlak ligt in de PAPIEREN bovenhelft van deze sectie (de mint
         begint pas halverwege), dus het valt onder de opruiming. */}
      {RUIS_OP_PAPIER && (
        <KaartVlak
          kleur={VLAK_PAPIER}
          vorm="wig"
          breedte={460}
          hoogte={240}
          style={{ right: "-12%", top: 40, transform: "rotate(-8deg)" }}
          className="hidden lg:block"
          tel={6}
        />
      )}

      {/* 🔑 HET CONCEPT: EEN SCHRIFTJE DAT OPENGAAT TERWIJL JE SCROLLT.
         Idee van de eigenaar zelf, na vier afgekeurde pogingen van mij die
         allemaal hetzelfde waren: een rechthoek met een foto en tekst erin.
         Een kaart kleiner maken of anders indelen is geen andere vorm.

         Waarom een schrift en niet zomaar een boekje: het is het voorwerp van
         deze doelgroep, en het is het enige dat hier nog vrij was. Het rapport
         is al vergeven aan "Avinka in cijfers", de polaroids hangen bij de
         ervaringen. Een schrift heeft bovendien van nature precies wat we
         nodig hebben: een etiket waar je je naam op schrijft. Daar staat dus
         "Even voorstellen" op, en het schrift opent naar de bladzijde waar je
         hem leert kennen.

         DE COMPOSITIE (en niet alleen de mechaniek — dat is hier de
         terugkerende valkuil): dicht zie je alleen de kaft, rechts op het
         veld. De linkerhelft is gewoon leeg mintveld, zoals een schrift op
         een tafel ligt. Bij het opendraaien vult de kaft die lege helft en
         wordt de rechterbladzijde vrijgegeven. Er beweegt dus niets naar de
         zijkant en er springt geen ruimte bij: de plek is er al, hij wordt
         alleen ingevuld. */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-20 pt-20 lg:pb-24 lg:pt-24">
        <Confetti punten={[{ x: "3%", y: "88%", r: 4 }]} />

        {/* ⚠️ DE OPZET IS OMGEKEERD (op verzoek): het schrift ligt aan één
           kant en de tekst staat ernaast, niet erin. Een schrift waar je hele
           productverhaal in past bestaat niet — dat was precies waarom het
           onrealistisch aanvoelde. Nu ligt er een schrift met een foto erin,
           zoals een schrift er echt uitziet, en de tekst staat gewoon op het
           veld ernaast. */}
        <div className="w-mkr-rij">
          {/* ── links: de kop en de uitleg ──
             🔑 DE TAAKVERDELING TUSSEN LINKS EN HET SCHRIFT, en dat is waar
             deze alinea drie keer op stukliep:
             het SCHRIFT vertelt wie hij is en waarom hij Avinka maakte;
             LINKS moet vertellen wat dat voor de LEZER betekent.
             Zolang hier stond "ik bouw het zelf, geen bedrijf, geen
             supportafdeling" zei het in andere woorden hetzelfde als
             bladzijde 3 van het schrift, alleen zakelijker. En het definieerde
             Avinka bovendien met wat het NIET is, wat altijd zwakker leest dan
             wat het wél is. */}
          <div className="w-mkr-tekst">
            <h2 className="w-mkr-kop">Even voorstellen</h2>
            {/* De richting komt van de eigenaar: Avinka is er voor het werk na
               schooltijd. Zijn eigen formulering was "ondersteunen in taken";
               dat is één stap te ambtelijk voor een pagina die verder in
               gewone taal staat, dus het is "helpen met het werk dat na
               schooltijd blijft liggen" geworden.
               De tweede zin doet het werk van de KOP: bij "Even voorstellen"
               hoort een mens. Hij staat er letterlijk zoals de eigenaar hem
               heeft aangeleverd; niet gladstrijken. Er stond eerst "Ik ken dat
               werk, want ik doe het zelf" (van mij) — deze zegt meer, want hij
               nodigt uit in plaats van alleen te bevestigen. */}
            <p className="w-schrift-tekst">
              Avinka is gebouwd om leerkrachten te helpen met het werk dat na
              schooltijd blijft liggen. Ik doe aanpassingen op basis van eigen
              ervaringen, maar sta graag open voor alle feedback.
            </p>
            {/* De uitnodiging om te bladeren, met hetzelfde handgeschreven
               boogpijltje als bij de polaroids ("klik op een foto om de
               ervaring te lezen"). Dezelfde soort handeling, dus dezelfde
               aanwijzing — een tweede vormtaal verzinnen voor hetzelfde
               gebaar maakt een pagina rommelig.
               ⚠️ WEL EEN ANDER PAD, en dat was fout overgenomen. Bij de
               polaroids wijst het pijltje naar BENEDEN, want daar hangen de
               foto's onder de tekst. Hier ligt het schrift ERNAAST, en dan
               wijst een pijl naar beneden naar leeg veld. Dit is dezelfde
               hand en dezelfde dikte, maar de boog loopt naar rechts. */}
            <p className="w-mkr-wenk">
              blader zelf door mijn schrift
              <svg
                viewBox="0 0 40 28"
                className="h-6 w-9 shrink-0"
                fill="none"
                stroke={KOP}
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M2 20 C 10 23, 22 21, 32 13" />
                <path d="M25 12.5 L 33.5 12 L 30 19" />
              </svg>
            </p>
          </div>

        {/* ── HET SCHRIFT WAAR JE DOORHEEN BLADERT ─────────────────────────
             Niet één kaft die opengaat, maar drie bladen die één voor één
             omslaan terwijl je scrollt. Elke bladzijde vertelt één ding.
             Dat lost het echte bezwaar op: het schrift dééd maar één keer
             iets, en verder stond er een tekstkolom naast een voorwerp.

             De onderste bladzijde ligt er altijd (die bepaalt ook de hoogte);
             daar bovenop liggen de bladen die omslaan, in een 3D-stapel. De
             browser sorteert ze zelf op diepte dankzij preserve-3d, dus er
             is geen z-index-geknutsel nodig dat bij de helft moet omklappen. */}
        <div data-reveal className="w-schrift">
          {/* Blad 4, de onderste: ligt er altijd. */}
          {/* SPREAD 3, RECHTS: de laatste bladzijde, met de zin die je moet
             onthouden. Ligt er altijd; de omslaande bladen liggen erbovenop. */}
          <div className="w-schrift-blad w-papier">
            <div className="w-schrift-inhoud">
              <p className="w-blad-tekst">
                Geen ingewikkelde techniek, wel zorgvuldig met de gegevens van
                je leerlingen.
              </p>
              <p className="w-blad-kern">
                Goede leerkrachten horen hun tijd te besteden aan leerlingen,
                niet aan administratie.
              </p>
            </div>
          </div>

          {/* De twee bladerknoppen. Ze bedekken elk een halve bladzijde, dus
             je kunt gewoon op het schrift klikken — maar het zijn échte
             knoppen, met een label en een zichtbaar pijltje aan de buitenrand.
             🔑 Zichtbaar, niet verstopt achter hover: bedieningselementen
             wegmoffelen tot je erover gaat is op deze site een afgekeurde
             gewoonte. Ze staan boven de bladen (z-index) zodat de 3D-stapel
             de klik niet opvangt. */}
          <button
            type="button"
            className="w-blad-knop w-blad-terug"
            onClick={terug}
            disabled={omgeslagen === 0}
            aria-label="Vorige bladzijde"
          >
            <span aria-hidden>‹</span>
          </button>
          <button
            type="button"
            className="w-blad-knop w-blad-verder"
            onClick={verder}
            disabled={omgeslagen === BLADEN}
            aria-label="Volgende bladzijde"
          >
            <span aria-hidden>›</span>
          </button>

          <div className="w-schrift-stapel">
            {/* Blad 3 — slaat als laatste om. Voorkant is de rechterbladzijde
               van de tweede spread, achterkant de linker van de derde. */}
            <div className={`w-blad w-blad-3 ${omgeslagen > 2 ? "is-om" : ""}`}>
              {/* SPREAD 2, RECHTS: de vragen lopen door op de rechterbladzijde,
                 zoals in een echt vriendenboekje. */}
              <div className="w-blad-voor w-papier">
                <div className="w-schrift-inhoud">
                  {/* ⚠️ De laatste vraag is met opzet de laatste. Het antwoord
                     "werk na schooltijd" is precies het probleem waar de
                     volgende bladzijde het antwoord op is — je slaat om van de
                     klacht naar de reden. De eigenaar zei het zelf: "boem,
                     volgende bladzijde". Zet er dus niets achter.
                     Kort houden trouwens: een antwoord dat omloopt naar een
                     tweede regel schuift alles eronder van de lijnen af. */}
                  <dl className="w-blad-vragen">
                    <div>
                      <dt>school</dt>
                      <dd>Regenboog Osseveld</dd>
                    </div>
                    <div>
                      <dt>ik woon in</dt>
                      <dd>Apeldoorn</dd>
                    </div>
                    <div>
                      <dt>het leukste aan mijn werk</dt>
                      {/* ⚠️ Niet inkorten. Ik had hier "een veilige plek
                         bieden" van gemaakt zodat het op één regel paste; de
                         eigenaar zette het terug. Zijn woorden gaan voor de
                         regelval — hij loopt hier gewoon om naar een tweede
                         regel, precies zoals in een echt vriendenboekje. */}
                      <dd>een veilige leeromgeving bieden</dd>
                    </div>
                    <div>
                      <dt>het minst leuke</dt>
                      <dd>werk na schooltijd</dd>
                    </div>
                  </dl>
                </div>
              </div>
              {/* SPREAD 3, LINKS: de tweede omslag. */}
              <div className="w-blad-achter w-papier">
                <div className="w-schrift-inhoud">
                  <p className="w-blad-kop">Waarom ik Avinka heb gemaakt</p>
                  <p className="w-blad-tekst">
                    Wat begon als een oplossing voor mijn eigen werk, werd een
                    bredere missie: laten zien dat slimmer werken juist
                    eenvoudig kan zijn.
                  </p>
                </div>
              </div>
            </div>

            {/* Blad 2 — de foto. Dit is de bladzijde waar het schrift op
               openligt als je aankomt: eerst een gezicht en een naam, dan pas
               de woorden. */}
            <div className={`w-blad w-blad-2 ${omgeslagen > 1 ? "is-om" : ""}`}>
              <div className="w-blad-voor w-papier">
                <div className="w-schrift-inhoud">
                  <div className="w-schrift-afdruk">
                    <div className="w-schrift-foto">
                      {fotoBestand ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/${fotoBestand}`}
                          alt="Michael van Spanje"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-display text-2xl font-black" style={{ color: DONKER }}>
                          MvS
                        </span>
                      )}
                    </div>
                    {/* ⚠️ Hier stond een onderschrift ("dat ben ik"). Eruit op
                       verzoek: de naam staat er al onder, dus het zei niets
                       wat je niet al zag. */}
                  </div>
                  {/* Naam en rol horen op deze bladzijde en niet alleen op het
                     etiket: dit is de eerste bladzijde die je ziet, en een
                     foto zonder naam stelt niemand voor. */}
                  <p className="w-blad-naam">Michael van Spanje</p>
                  {/* ⚠️ Hier stond eerst "leerkracht & maker" en daarna alleen
                     "leerkracht". Allebei mis: "maker" was mijn woord en klinkt
                     als jargon, en zonder titel erbij verdween het gewicht.
                     De eigenaar koos zelf "oprichter": dat zegt dat dit geen
                     hobbyproject is maar een bedrijf met iemand die ervoor
                     staat — precies wat een school wil weten. */}
                  <p className="w-blad-rol">leerkracht &amp; oprichter</p>
                </div>
              </div>
              {/* De achterkant van dit blad is de LINKERbladzijde zodra je
                 doorbladert. Daar staat het begin van het verhaal — dezelfde
                 woorden die ooit in het grote makersblok stonden en die de
                 eigenaar toen had goedgekeurd. Ze zijn niet weg, ze staan nu
                 op de plek waar je ze pas leest als je ze wilt lezen. */}
              {/* ── SPREAD 2, LINKS: het vriendenboekje ────────────────────
                 Idee van de eigenaar, en het klopt precies: een vriendenboekje
                 is een schoolvoorwerp dat van nature bestaat uit voorgedrukte
                 vragen met handgeschreven antwoorden. Dat is exact het
                 mechaniek dat het etiket op de kaft al gebruikt, dus het is
                 geen nieuw idioom maar hetzelfde idee op ware grootte.
                 Bijkomend voordeel: zo kun je persoonlijke dingen vertellen
                 zonder dat het een cv wordt. De vraag doet het werk. */}
              <div className="w-blad-achter w-papier">
                <div className="w-schrift-inhoud">
                  {/* Alle antwoorden zijn door de eigenaar zelf opgegeven.
                     Niets hiervan invullen of bijstellen zonder hem: het zijn
                     feiten over een echt persoon, inclusief zijn school en
                     woonplaats. */}
                  <p className="w-blad-kop">Persoonlijke vragen</p>
                  <dl className="w-blad-vragen">
                    <div>
                      <dt>leeftijd</dt>
                      <dd>30</dd>
                    </div>
                    <div>
                      <dt>ik geef les in</dt>
                      <dd>groep 7</dd>
                    </div>
                    <div>
                      <dt>dat doe ik al</dt>
                      <dd>7 jaar</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            {/* Blad 1 — de kaft, slaat als eerste om. */}
            <div className={`w-blad w-blad-1 ${omgeslagen > 0 ? "is-om" : ""}`}>
              <div className="w-blad-voor w-schrift-voor">
                {/* Het etiket, zoals op elk schoolschrift: iets scheef
                   geplakt, want niemand plakt dat recht. Voorgedrukte woordjes
                   met de hand ingevuld — daar staat zijn naam, ter grootte van
                   een invulregel. */}
                <div className="w-schrift-etiket">
                  <dl className="w-schrift-invul">
                    <div>
                      <dt>naam</dt>
                      <dd>Michael van Spanje</dd>
                    </div>
                    {/* "vak: leerkracht & maker" is er ook uit. Los van dat
                       "maker" raar klinkt, is leerkracht geen vák — op een
                       schriftetiket vul je bij vak iets als rekenen in. Twee
                       ingevulde regels is bovendien hoe zo'n etiket er
                       meestal uitziet. */}
                    {/* Groep 7 vanaf schooljaar 2026/2027. De eigenaar gaf dit
                       zelf op; niet zelf invullen of aanpassen zonder hem. */}
                    <div>
                      <dt>groep</dt>
                      <dd>7</dd>
                    </div>
                    <div>
                      <dt>van</dt>
                      <dd>Avinka</dd>
                    </div>
                  </dl>
                </div>
              </div>
              {/* ── De binnenkant van de kaft ──
                 Was een leeg groen vlak, en dat was de helft van de eerste
                 spread. Nu plakken er drie geeltjes: precies dezelfde als op
                 het bureau in de film bovenaan de pagina (accent-soft, klein,
                 scheef, harde slagschaduw). Dat is geen nieuw rekwisiet maar
                 een terugverwijzing — het werk uit de film ligt hier in zijn
                 eigen schrift, en dat is meteen waarom Avinka bestaat.
                 ⚠️ Handschrift in plaats van de gedrukte letter van de film:
                 op een geeltje in je eigen schrift schrijf je zelf.
                 De onderste blijft boven de 25%-lijn, want daar zit het
                 bladerpijltje in de hoek. */}
              <div className="w-blad-achter w-schrift-achter">
                <span className="w-geeltje" style={{ top: "9%", left: "8%", rotate: "-6deg" }}>
                  rapporten af vóór vrijdag
                </span>
                <span className="w-geeltje" style={{ top: "36%", right: "7%", rotate: "5deg" }}>
                  toetsen groep 7 analyseren
                </span>
                <span className="w-geeltje" style={{ top: "62%", left: "12%", rotate: "-3deg" }}>
                  oudergesprekken plannen
                </span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* ⚠️ In dit stijlblok mag geen accent-aanhalingsteken staan, ook niet
         in een opmerking: dat sluit de tekst van het blok af en dan valt de
         hele pagina om. Dat is hier één keer gebeurd. */}
      <style>{`
        /* ── het schrift ──
           Twee bladzijden naast elkaar. De rechter staat gewoon in de stroom
           en bepaalt dus de hoogte; de kaft ligt er absoluut overheen. Zo
           verspringt er niets als hij opengaat: de ruimte was er al.
           --open loopt van 0 (dicht) tot 1 (open) en wordt door de scroll
           gezet; alle beweging hieronder hangt aan dat ene getal. */
        /* ── de rij: tekst links, schrift rechts ──
           Het schrift heeft een vaste maat en de tekst krijgt de rest. Zo
           blijft het schrift een voorwerp met een eigen formaat in plaats van
           een blok dat met het scherm meerekt. */
        /* ⚠️ Boven uitlijnen en niet centreren. Met align-items:center zweefde
           de kop halverwege het schrift, en dan lijkt het of de twee helften
           niets met elkaar te maken hebben. Nu begint de kop op dezelfde
           hoogte als de bovenrand van het schrift en lees je de sectie van
           linksboven naar rechts. */
        .w-mkr-rij {
          display: grid;
          gap: clamp(28px, 4vw, 56px);
          align-items: start;
        }
        @media (min-width: 900px) {
          .w-mkr-rij { grid-template-columns: minmax(0, 1fr) 32rem; }
        }
        .w-mkr-tekst { max-width: 42ch; }
        .w-mkr-kop {
          font-family: var(--font-display), Georgia, serif;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.02;
          font-size: clamp(1.9rem, 3.6vw, 2.75rem);
          color: ${DONKER};
          margin-bottom: clamp(14px, 1.8vw, 20px);
          text-wrap: balance;
        }
        /* De eerste alinea na de kop hoeft geen extra ruimte: de kop heeft
           zijn eigen marge al. */
        .w-mkr-kop + .w-schrift-tekst { margin-top: 0; }
        /* De wenk naar het schrift, in het handschrift van de pagina. Klein
           en gedempt: het is een onderschrift, geen knop. */
        .w-mkr-wenk {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: clamp(18px, 2.2vw, 26px);
          font-family: var(--font-hand), "Segoe Script", cursive;
          font-size: 1.15rem;
          line-height: 1.3;
          color: ${KOP};
        }

        .w-schrift {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          width: 100%;
          max-width: 32rem;
          perspective: 1500px;
          rotate: -1.2deg;
        }

        /* ── de stapel bladen ──
           Ligt precies over de rechterhelft, waar de bladzijde ook ligt. Elk
           blad draait om de rug (de linkerrand). preserve-3d laat de browser
           de bladen zelf op diepte sorteren: een blad dat voorbij de 90 graden
           is, ligt fysiek links en wordt dus vanzelf achter de bladen
           getekend die nog dicht liggen. */
        .w-schrift-stapel {
          position: absolute;
          inset: 0 0 0 50%;
          transform-style: preserve-3d;
        }
        .w-blad {
          position: absolute;
          inset: 0;
          transform-origin: left center;
          transform-style: preserve-3d;
          will-change: transform;
        }
        .w-blad-voor,
        .w-blad-achter {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          overflow: hidden;
        }
        .w-blad-achter { transform: rotateY(180deg); }
        /* De achterkant van een papieren blad ligt na het omslaan links, dus
           daar zit de vouw aan de rechterkant en zijn de ronde hoeken
           gespiegeld. */
        .w-blad-achter.w-papier {
          border-left: 2px solid ${KAART_RAND};
          border-right: none;
          border-radius: 1.4rem 0 0 1.6rem;
          box-shadow: none;
        }
        .w-blad-achter.w-papier::before {
          inset: 0 0 0 auto;
          background: linear-gradient(to left, rgba(var(--w-schaduw-rgb, 23,80,58), 0.13), transparent);
        }

        /* Elk blad zijn eigen plek in de stapel. De translateZ is minimaal
           (een blad papier is dun) maar genoeg om de sortering eenduidig te
           maken; zonder die verschillen flikkeren vlakken die precies
           samenvallen.
           🔑 Het omslaan is nu een OVERGANG en geen scrollstand: de klik zet
           de klasse, de browser doet de beweging. De curve remt aan het eind
           af zoals een blad dat neervalt; 0,72s is lang genoeg om het te
           volgen en kort genoeg om drie keer achter elkaar te doen. */
        /* 🔑 DE VOLGORDE IS HIER HET HELE VERHAAL: eerst draaien, dán de
           diepte. In CSS wordt de RECHTSE bewerking als eerste op het element
           toegepast, dus rotateY(...) translateZ(...) betekent: verschuif het
           blad in zijn EIGEN richting en draai dat mee. Een blad dat omslaat
           neemt zijn dikte dus mee naar de andere kant en ligt daar onderop —
           precies zoals papier zich gedraagt.
           Andersom (translateZ eerst) blijft de verschuiving in de richting
           van de kijker staan, hoe ver het blad ook gedraaid is. Dan ligt de
           kaft na het omslaan nog steeds bovenop en zie je de binnenkant van
           het karton in plaats van de bladzijde die je net omsloeg. Dat was
           hier de bug. */
        .w-blad {
          transform: rotateY(0deg) translateZ(var(--z));
          transition: transform 0.72s cubic-bezier(0.22, 1, 0.32, 1);
        }
        .w-blad.is-om { transform: rotateY(-178deg) translateZ(var(--z)); }
        /* ⚠️ TWEE FOUTEN OP RIJ HIER, allebei het waard om vast te leggen.
           1. Met 0,8px verschil in diepte lagen de omgeslagen bladen zo goed
              als in hetzelfde vlak. De browser kon niet bepalen welke bovenop
              hoorde en viel terug op de volgorde in de opmaak: na het omslaan
              van de foto zag je nog steeds de binnenkant van de kaft.
           2. De reparatie was ELK BLAD EEN EIGEN EINDHOEK geven, want een
              stapel omgeslagen bladen waaiert ook uiteen. Dat is precies fout:
              vlakken onder een verschillende hoek SNIJDEN elkaar, en dan
              tekent de browser links van de snijlijn het ene blad en rechts
              het andere. Zichtbaar als een groene baan dwars door de
              linkerbladzijde.
           🔑 De regel: houd omslaande vlakken EVENWIJDIG en zet ze alleen uit
           elkaar in de diepte. Evenwijdige vlakken kunnen elkaar niet snijden,
           dus de sortering is altijd eenduidig. Stappen van 2px is genoeg.
           Het blad dat als EERSTE omslaat ligt onderop; dat is de kaft. */
        .w-blad-1 { --z: 6px; }
        .w-blad-2 { --z: 4px; }
        .w-blad-3 { --z: 2px; }

        /* ── de bladerknoppen ──
           Elk een halve bladzijde groot, dus je klikt gewoon op het schrift.
           Het pijltje staat aan de buitenrand, waar je duim bij een echt boek
           ook zit. */
        /* ⚠️ De pijltjes stonden verticaal in het midden en lagen daarmee
           dwars over de tekst — op de linkerbladzijde liep het pijltje pal
           door "analyses en verslagen" heen. Ze staan nu in de ONDERHOEK,
           waar op elke bladzijde ruimte over is (de tekst vult nooit het hele
           blad). De knop zelf blijft de halve bladzijde groot, dus je kunt nog
           steeds gewoon op het papier klikken. */
        .w-blad-knop {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 50%;
          z-index: 3;
          display: flex;
          align-items: flex-end;
          padding: 0 10px 12px;
          border: 0;
          background: none;
          cursor: pointer;
          font-size: 1.6rem;
          line-height: 1;
          color: ${KOP};
          transition: opacity 0.3s ease;
        }
        .w-blad-terug { left: 0; justify-content: flex-start; }
        .w-blad-verder { right: 0; justify-content: flex-end; }
        .w-blad-knop span {
          display: grid;
          place-items: center;
          width: 2rem;
          height: 2rem;
          border-radius: 999px;
          background: var(--color-cream, #fbf6ee);
          box-shadow: ${schaduw(6, 16, -8, 0.4)};
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .w-blad-knop:hover span { transform: scale(1.08); }
        .w-blad-terug:hover span { transform: translateX(-2px) scale(1.08); }
        .w-blad-verder:hover span { transform: translateX(2px) scale(1.08); }
        .w-blad-knop:focus-visible {
          outline: 2px solid var(--color-brand, #2f9e6e);
          outline-offset: 4px;
          border-radius: 1rem;
        }
        /* Uitgeschakeld betekent hier: er is geen bladzijde meer die kant op.
           Niet weghalen maar dempen, zodat de plek niet verspringt. */
        .w-blad-knop:disabled { cursor: default; opacity: 0; }

        /* ── de rechterbladzijde ──
           Warm papier met schrijflijnen. De lijnen komen uit een verloop en
           niet uit losse elementen: zo lopen ze altijd door tot onderaan,
           hoeveel tekst er ook staat. */
        /* 🔑 DE STAPEL BLADEN. Hier zat een deel van het "onrealistisch": het
           was één vel, en een schrift is een stapel. De losse box-shadows met
           een negatieve spread zijn de randen van de bladen eronder — twee is
           genoeg, drie werd een trapje. Daarna pas de echte slagschaduw. */
        /* De onderste bladzijde staat in de stroom en bepaalt de hoogte van
           het hele schrift; alle omslaande bladen liggen er absoluut
           overheen. Iets hoger dan eerst (17 → 20rem), zodat het schrift lang
           genoeg in beeld blijft om er in drie stappen doorheen te bladeren. */
        /* ⚠️ DE HOOGTE VOLGT UIT DE LANGSTE BLADZIJDE, NIET UIT SMAAK.
           "Waarom ik Avinka heb gemaakt" is de volste: een kop van twee regels,
           een lege regel en zes regels tekst — negen regels, 270px. Daaronder
           moet het bladerpijltje passen (32px plus 12px marge). Op 22rem lag
           dat pijltje 7px ovér de laatste tekstregel; nagemeten, niet gegokt.
           Kortere bladzijden houden gewoon lege regels over, en dat is precies
           hoe een schrift eruitziet. */
        .w-schrift-blad {
          grid-column: 2;
          position: relative;
          min-height: 25rem;
        }
        /* Het papier zelf: dit is wat elke bladzijde EN elke achterkant van
           een blad krijgt. Losgetrokken van .w-schrift-blad omdat de
           omslaande bladen dezelfde look nodig hebben zonder in de stroom te
           staan. */
        /* ── DE SCHRIJFLIJNEN EN DE TEKST HOREN OP ELKAAR ──────────────────
           De tekst moet ÓP de lijnen staan, niet ertussen of erdoorheen. Dat
           lukt alleen als drie dingen exact op elkaar zijn afgestemd, en ze
           staan daarom alle drie hier bij elkaar in variabelen:
             --regel      de regelafstand (en dus de line-height van de tekst)
             --kantlijn   de padding boven, waar de eerste regel begint
             --lijnzakking hoeveel de lijn onder de bovenkant van een regel
                          valt, oftewel waar de schrijflijn hoort
           De lijn wordt getekend aan het BEGIN van elke herhaling, en met
           background-position schuiven we die naar de juiste hoogte.
           ⚠️ Verander je de lettergrootte van het handschrift, dan moet
           --lijnzakking mee: hij is gemeten op de echte letter, niet berekend.
           Padding met vaste waarden en niet met clamp(), want een padding die
           meebeweegt met de schermbreedte gooit de uitlijning elke keer om. */
        .w-papier {
          --regel: 30px;
          /* Ruimer dan eerst (26): de eerste schrijfregel plakte tegen de
             bovenrand van de bladzijde. Een schrift heeft daar altijd een
             stukje wit. */
          --kantlijn: 38px;
          /* Gemeten, niet berekend: met een merkteken zonder afmetingen op de
             basislijn van de eerste regel ligt die basislijn 26,1px onder de
             kantlijn. Op 26 valt de schrijflijn dus precies op de basislijn en
             staan de letters erop.
             ⚠️ Op 28 leek het goed op papier — 1,9px verschil — maar op het
             scherm zag je een duidelijk gaatje tussen de letters en de lijn.
             Bij handschrift valt zoiets meteen op, want daar hóórt geen ruimte
             te zitten. Verander je de lettergrootte, meet dit dan opnieuw. */
          --lijnzakking: 26px;
          --eerste-lijn: calc(var(--kantlijn) + var(--lijnzakking));
          padding: var(--kantlijn) clamp(16px, 2vw, 24px);
          /* ⚠️ DE DEKPLAAT BOVENAAN IS GEEN VERSIERING MAAR EEN REPARATIE.
             Een repeating-gradient herhaalt vanaf zijn ankerpunt naar BEIDE
             kanten. Er liep dus ook een lijn 30px bóven de eerste schrijfregel,
             dwars door de bovenste tekstregel heen. Die eerste laag is een
             ondoorzichtige baan papier tot net boven de eerste lijn; daarmee
             begint het lijntjespatroon precies waar het schrift begint.
             Volgorde van de lagen: dekplaat, lijnen, papier. */
          background:
            linear-gradient(
              to bottom,
              var(--w-kaart-warm, #fffdf9) 0 calc(var(--eerste-lijn) - 1px),
              transparent calc(var(--eerste-lijn) - 1px)
            ),
            repeating-linear-gradient(
              to bottom,
              rgba(var(--w-schaduw-rgb, 23,80,58), 0.13) 0 1px,
              transparent 1px var(--regel)
            ),
            var(--w-kaart-warm, #fffdf9);
          background-repeat: no-repeat, repeat, no-repeat;
          background-position: 0 0, 0 var(--eerste-lijn), 0 0;
          border: 2px solid ${KAART_RAND};
          border-left: none;
          border-radius: 0 1.4rem 1.6rem 0;
          box-shadow:
            2px 3px 0 -1px #f6f2e6,
            4px 6px 0 -2px #efeadb,
            ${schaduw(20, 44, -24, 0.5)};
        }
        /* De schaduw bij de rug: papier krult altijd iets weg van de vouw,
           dus daar is het donkerder. Staat op ELK blad, want elk blad heeft
           een rug. (Dit hing eerst aan --open en werd lichter naarmate het
           schrift openging; met meerdere bladen slaat dat nergens meer op —
           de vouw blijft de vouw.) */
        .w-papier::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 38px;
          border-radius: 0 40% 40% 0 / 0 50% 50% 0;
          background: linear-gradient(to right, rgba(var(--w-schaduw-rgb, 23,80,58), 0.13), transparent);
          pointer-events: none;
        }
        /* Het ezelsoor: de rechteronderhoek is omgevouwen, zoals bij elk
           schrift dat echt gebruikt wordt. Alleen op de ONDERSTE bladzijde —
           op elk blad zou het een kunstje worden dat drie keer voorbijkomt.
           Twee driehoeken over elkaar: de onderste is de veldkleur die door
           het gat zichtbaar wordt, de bovenste het omgeslagen stukje papier
           (iets donkerder, want je kijkt tegen de achterkant aan). */
        .w-schrift-blad.w-papier::after {
          content: "";
          position: absolute;
          right: -1px;
          bottom: -1px;
          width: clamp(30px, 3.4vw, 44px);
          aspect-ratio: 1;
          background:
            linear-gradient(to bottom left, var(--w-veld, #ecf6f0) 50%, transparent 50.5%),
            linear-gradient(to top right, #f4efe2 50%, transparent 50.5%);
          border-bottom-right-radius: 0.35rem;
          filter: drop-shadow(-2px -2px 3px rgba(var(--w-schaduw-rgb, 23,80,58), 0.12));
        }
        .w-schrift-inhoud { position: relative; }
        .w-schrift-naam {
          font-family: var(--font-display), Georgia, serif;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1.15;
          font-size: clamp(1.15rem, 1.9vw, 1.4rem);
          color: ${DONKER};
        }
        .w-schrift-rol {
          margin-top: 0.1rem;
          font-size: 0.95rem;
          line-height: 1.5;
          color: rgba(34, 28, 58, 0.7);
        }
        /* ⚠️ Deze drie stonden op een regelafstand van exact 30px, gelijk aan
           de schrijflijnen, want toen liep de tekst óp de lijnen van de
           bladzijde. Nu staat de tekst naast het schrift op het gewone veld
           en is dat juist verkeerd: daar hoort de leesbare maat van de rest
           van de pagina. */
        .w-schrift-tekst {
          margin-top: 1.15rem;
          font-size: 1.05rem;
          line-height: 1.7;
          color: rgba(34, 28, 58, 0.78);
        }
        .w-schrift-kern {
          margin-top: 0.85rem;
          font-size: 1.05rem;
          font-weight: 600;
          line-height: 1.7;
          color: ${KOP};
        }

        /* ── tekst ÓP een bladzijde ──
           In het handschrift van de pagina, want dit is een schrift: gedrukte
           letters op schrijflijnen zien er altijd uit als een tekstvak met een
           patroontje erachter. De regelafstand is exact de regelafstand van de
           lijnen; elke marge hieronder is daarom een veelvoud daarvan, anders
           schuift alles wat eronder staat van de lijn af. */
        .w-blad-tekst,
        .w-blad-kern,
        .w-blad-naam,
        .w-blad-rol {
          font-family: var(--font-hand), "Segoe Script", cursive;
          line-height: var(--regel);
          margin: 0;
        }
        .w-blad-tekst {
          font-size: 1.22rem;
          color: rgba(34, 28, 58, 0.86);
        }
        /* Eén lege regel ervoor, zodat de slotzin niet tegen de alinea erboven
           aan plakt. Een hele regel en geen halve: alles moet op het raster
           blijven staan. */
        .w-blad-kern {
          font-size: 1.22rem;
          color: ${KOP};
          margin-top: var(--regel);
        }
        /* ── het vriendenboekje ──
           Een voorgedrukt vraagje, daaronder het handgeschreven antwoord. Elk
           paar beslaat dus precies twee regels; de kop plus een lege regel
           erna nemen er twee. Alles blijft daarmee op het lijnenraster staan.
           ⚠️ Houd de antwoorden kort genoeg voor één regel. Loopt er eentje om,
           dan schuift alles daaronder een regel op — dat mag, maar dan moet je
           wel nakijken of de bladzijde nog past. */
        .w-blad-kop {
          font-family: var(--font-display), Georgia, serif;
          font-weight: 900;
          letter-spacing: -0.02em;
          font-size: 1.02rem;
          line-height: var(--regel);
          margin: 0 0 var(--regel);
          color: ${DONKER};
        }
        .w-blad-vragen { margin: 0; }
        .w-blad-vragen dt {
          font-size: 0.76rem;
          line-height: var(--regel);
          letter-spacing: 0.03em;
          color: rgba(34, 28, 58, 0.5);
        }
        .w-blad-vragen dd {
          margin: 0;
          font-family: var(--font-hand), "Segoe Script", cursive;
          font-size: 1.15rem;
          line-height: var(--regel);
          color: ${KOP};
        }

        /* Naam en rol onder de foto, op de eerste bladzijde. Gecentreerd
           onder de afdruk, want die staat er ook gecentreerd op. */
        .w-blad-naam {
          text-align: center;
          font-size: 1.32rem;
          color: ${DONKER};
        }
        .w-blad-rol {
          text-align: center;
          font-size: 1.05rem;
          color: rgba(34, 28, 58, 0.72);
        }

        /* ── de kaft ──
           Alleen nog het uiterlijk: de stand en de draaiing komen van .w-blad,
           want de kaft is gewoon het eerste blad van de stapel. */
        .w-schrift-voor,
        .w-schrift-achter {
          border-radius: 0 1.4rem 1.6rem 0;
        }
        .w-schrift-voor {
          background: ${DONKER};
          box-shadow: ${schaduw(22, 50, -22, 0.55)};
        }
        /* De rug: een iets donkerder baan langs de vouw, met twee nietjes. */
        .w-schrift-voor::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 16px;
          background: rgba(0, 0, 0, 0.16);
        }
        /* ⚠️ De maten hieronder horen bij een kaft van ongeveer 16rem breed.
           Toen het schrift kleiner werd, brak eerst "Even voorstellen" over
           twee regels en daarna ook de ingevulde naam — dan lees je een
           etiket met zes regeltjes in plaats van een kop. Wordt het schrift
           ooit weer groter, dan mogen deze mee omhoog. */
        .w-schrift-etiket {
          position: absolute;
          left: 10%;
          right: 8%;
          top: 17%;
          padding: clamp(12px, 1.5vw, 16px) clamp(13px, 1.6vw, 17px)
                   clamp(13px, 1.6vw, 16px);
          background: var(--color-cream, #fbf6ee);
          border-radius: 0.5rem 0.6rem 0.5rem 0.55rem;
          rotate: -1.4deg;
          box-shadow: 0 10px 22px -16px rgba(0, 0, 0, 0.5);
        }
        .w-schrift-titel {
          font-family: var(--font-display), Georgia, serif;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.05;
          font-size: clamp(1.05rem, 1.5vw, 1.32rem);
          color: ${DONKER};
          text-wrap: balance;
        }
        /* De invulregels van een schrift-etiket: een voorgedrukt woordje en
           een lijn waar met de hand op geschreven is. De lijn hoort ONDER de
           tekst door te lopen, niet ernaast — daarom een border-bottom op de
           regel zelf en niet een los streepje. */
        .w-schrift-invul {
          margin-top: clamp(10px, 1.4vw, 14px);
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .w-schrift-invul > div {
          display: flex;
          align-items: baseline;
          gap: 8px;
          border-bottom: 1px solid rgba(var(--w-schaduw-rgb, 23,80,58), 0.28);
          padding-bottom: 2px;
        }
        .w-schrift-invul dt {
          flex: none;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: lowercase;
          color: rgba(34, 28, 58, 0.5);
        }
        .w-schrift-invul dd {
          margin: 0;
          font-family: var(--font-hand), "Segoe Script", cursive;
          font-size: 0.88rem;
          line-height: 1.15;
          white-space: nowrap;
          color: ${KOP};
          /* Handschrift staat nooit precies op de lijn. */
          transform: rotate(-0.6deg) translateY(-1px);
        }

        /* De binnenkant van de kaft: hetzelfde karton, van de andere kant
           gezien. Iets lichter dan de voorkant omdat er licht op valt zodra
           hij openligt, en verder leeg — er hoort niets op de binnenkant van
           een kaft. Hier stond een mintgroen vlak met een uitgeknipte foto,
           en dat las als een paneel in plaats van als karton. */
        .w-schrift-achter {
          background: color-mix(in srgb, ${DONKER} 88%, #ffffff);
          border-radius: 1.4rem 0 0 1.6rem;
        }
        /* De geeltjes op de binnenkant van de kaft. Maten en schaduw komen van
           de geeltjes in de film (bg-accent-soft, kleine radius, harde
           slagschaduw); alleen de letter is hier handschrift. */
        .w-geeltje {
          position: absolute;
          z-index: 2;
          width: 6.6rem;
          padding: 9px 10px 11px;
          background: var(--color-accent-soft, #fff2d6);
          border-radius: 2px;
          font-family: var(--font-hand), "Segoe Script", cursive;
          font-size: 0.82rem;
          line-height: 1.25;
          color: rgba(34, 28, 58, 0.82);
          box-shadow: 0 12px 24px -12px rgba(8, 5, 20, 0.55);
        }

        /* De vouw: waar het karton omgeknikt is, blijft het donkerder. */
        .w-schrift-achter::before {
          content: "";
          position: absolute;
          inset: 0 0 0 auto;
          width: 18px;
          background: rgba(0, 0, 0, 0.18);
        }
        /* De rug ligt na het opendraaien aan de rechterkant van dit vlak: daar
           zit de vouw, dus daar hoort de schaduw. */
        .w-schrift-achter::after {
          content: "";
          position: absolute;
          inset: 0 0 0 auto;
          width: 34px;
          background: linear-gradient(to left, rgba(var(--w-schaduw-rgb, 23,80,58), 0.14), transparent);
          pointer-events: none;
        }
        /* De foto in de organische vorm van deze wereld — het enige detail dat
           alle eerdere pogingen hebben overleefd. */
        /* ── de ingeplakte foto ──
           🔑 HIER ZAT HET GROOTSTE STUK "ONREALISTISCH". De foto stond als
           blob-vorm uitgeknipt midden op een gekleurd vlak te zweven. Dat is
           een UI-element, geen foto in een schrift. Een echte afdruk heeft
           een witte rand, ligt nooit helemaal recht en werpt een kleine
           schaduw op het papier eronder. Dat is alles wat er nodig was. */
        /* 🔑 DE FOTO MOET EEN HEEL AANTAL REGELS BESLAAN. Alles wat tussen de
           tekst staat en géén veelvoud van de regelafstand hoog is, duwt de
           regels eronder van de lijnen af — en dan klopt de rest van de
           bladzijde niet meer. Daarom staan de maten hier vast (geen clamp)
           en rekent de ondermarge het verschil weg tot precies zes regels.
           Verander je de fotohoogte, dan rekent de marge vanzelf mee. */
        .w-schrift-afdruk {
          --fotohoogte: 145px;
          --randje: 14px; /* 8px boven + 6px onder */
          width: fit-content;
          margin: 0 auto calc(var(--regel) * 6 - var(--fotohoogte) - var(--randje));
          padding: 8px 8px 6px;
          background: #ffffff;
          border-radius: 3px;
          rotate: -2.2deg;
          box-shadow:
            0 1px 0 rgba(var(--w-schaduw-rgb, 23,80,58), 0.10),
            0 10px 20px -12px rgba(var(--w-schaduw-rgb, 23,80,58), 0.5);
        }
        /* Vaste maat, want de hoogte telt mee in de regelberekening hierboven.
           132 bij 145 is ongeveer de verhouding van een pasfoto. */
        .w-schrift-foto {
          width: 132px;
          height: var(--fotohoogte);
          display: grid;
          place-items: center;
          overflow: hidden;
          background: ${MINT_DIEP};
        }
        /* Het onderschrift hoort ONDER de afdruk maar BINNEN het witte randje,
           zoals bij een foto waar iemand op geschreven heeft. */
        .w-schrift-onderschrift {
          margin-top: 5px;
          font-family: var(--font-hand), "Segoe Script", cursive;
          font-size: 0.86rem;
          line-height: 1.25;
          text-align: center;
          color: ${KOP};
        }

        /* ── mobiel: geen boek, wel hetzelfde schrift ──
           Een opengeslagen schrift naast elkaar past niet op 390px, en een
           kaft die over de halve breedte draait wordt daar een truc zonder
           inhoud. Onder sm valt het schrift dus uit elkaar in drie lagen
           boven elkaar: het kaftje met het etiket, de foto, en de bladzijde.
           ⚠️ De kaft mag hier NIET verdwijnen. In de eerste versie stond hij
           op display:none, en daarmee was "Even voorstellen" op de telefoon
           helemaal weg — dat is de kop van de sectie. Hij wordt hier dus een
           strook in plaats van een kaft. */
        /* ── mobiel: geen bladeren, wel hetzelfde schrift ──
           Een blad dat om zijn rug draait heeft twee halve breedtes nodig, en
           die zijn er op 390px niet. Bovendien: op een telefoon scrol je met
           je duim door de pagina, en dan is een mechaniek die de scroll kaapt
           precies wat je niet wil. Het schrift valt hier dus uit elkaar in
           losse bladen ONDER elkaar — kaft, foto, en de twee zinnen. Zelfde
           onderdelen, zelfde volgorde, alleen uitgeklapt.
           ⚠️ De kaft moet blijven staan: daar staat wie het schrift is van. */
        @media (max-width: 639px) {
          .w-schrift {
            display: flex;
            flex-direction: column;
            grid-template-columns: 1fr;
            perspective: none;
            rotate: -0.6deg;
            max-width: none;
          }
          .w-schrift-stapel {
            position: relative;
            inset: auto;
            order: 0;
            transform-style: flat;
            display: flex;
            /* omgekeerd, want in de opmaak ligt de kaft onderaan (bovenop de
               stapel) en op mobiel hoort hij vooraan */
            flex-direction: column-reverse;
          }
          /* "blader maar door het schrift hiernaast" klopt hier niet: het
             schrift staat eronder in plaats van ernaast, en het ligt al
             uitgeklapt. Een uitnodiging voor iets dat er niet is, is erger
             dan geen uitnodiging. */
          .w-mkr-wenk { display: none; }
          /* De bladerknoppen ook: hier ligt alles al open, dus er valt niets
             te bladeren en twee zwevende pijltjes zouden nergens heen wijzen. */
          .w-blad-knop { display: none; }
          .w-blad { position: relative; inset: auto; transform-style: flat; }
          .w-blad, .w-blad.is-om { transform: none; transition: none; }
          /* ⚠️ De achterkanten stonden hier op display:none, want ze wáren
             leeg. Sinds er tekst op staat (de linkerbladzijde van elke
             spread) zou dat de helft van het verhaal wegpoetsen op de
             telefoon. Ze staan nu gewoon onder hun eigen voorkant, wat ook de
             leesvolgorde is: eerst de bladzijde, dan de achterkant ervan.
             Alleen de binnenkant van de KAFT blijft weg: daar staat niets. */
          .w-blad-voor,
          .w-blad-achter {
            position: relative;
            inset: auto;
            backface-visibility: visible;
          }
          .w-schrift-achter { display: none; }

          .w-schrift-voor { padding: clamp(16px, 4vw, 22px); border-radius: 1.5rem 1.4rem 0 0; }
          .w-schrift-voor::before { width: 10px; }
          /* Ruimte aan beide kanten: het etiket staat scheef, en zonder marge
             rechts loopt de gedraaide hoek tegen de rand van de kaft aan en
             wordt hij door de overflow afgeknipt. Dan lijkt het een fout in
             plaats van een geplakt etiket. */
          .w-schrift-etiket {
            position: relative;
            left: auto;
            right: auto;
            top: auto;
            margin: 0 12px 0 16px;
          }

          .w-papier {
            border-left: 2px solid ${KAART_RAND};
            border-radius: 0;
            box-shadow: none;
          }
          .w-papier::before { display: none; }
          /* De onderste bladzijde sluit de stapel af en krijgt dus de ronding
             en de schaduw van het hele schrift. */
          .w-schrift-blad {
            order: 1;
            grid-column: 1;
            min-height: 0;
            border-radius: 0 0 1.4rem 1.5rem;
            box-shadow: ${schaduw(18, 40, -22, 0.45)};
          }
          .w-schrift-foto { width: 8.5rem; }
        }

        /* Wie beweging heeft afgezet bladert nog steeds — het blad staat
           alleen meteen op zijn eindstand in plaats van om te zwaaien. De
           inhoud blijft dus bereikbaar; dat is het verschil met de animatie
           helemaal uitzetten. */
        @media (prefers-reduced-motion: reduce) {
          .w-blad { transition: none; }
          .w-blad-knop span { transition: none; }
        }
      `}</style>
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
      <SilhouetVliegtuig kleur="#ffffff" style={{ width: 300, right: -40, top: 125, transform: "rotate(14deg)", opacity: 0.05 }} tel={1} />
      {/* Ook hier stond een potlood-silhouet; op deze schaal en bij dit lage
         contrast was er geen potlood meer in te herkennen, alleen een wig.
         Een organisch vlak doet hetzelfde werk en hoort bij de rest. */}
      <KaartVlak
        kleur="rgba(255,255,255,0.05)"
        vorm="schelp"
        breedte={620}
        hoogte={380}
        style={{ left: "-8%", bottom: 55, transform: "rotate(-9deg)" }}
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

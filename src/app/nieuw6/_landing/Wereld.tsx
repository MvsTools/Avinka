"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { PROEF_DAGEN } from "@/lib/abonnement";

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

/* ⚠️ Hier stonden KAART_RAND en KAART_SCHADUW — schaduw(34, 66, -34, 0.6) —
   zodat de regie-kaartjes en de makerskaart gegarandeerd hetzelfde
   aanvoelden. Allebei weg: de makerssectie draagt sinds 5-8 een CV dat zijn
   eigen randen en schaduwen uit de RUIMTE haalt (echte vlakken, echte diepte)
   in plaats van uit een gedeelde tekenwaarde. Privacy.tsx heeft een eigen
   kopie van allebei en is daar niet van afhankelijk. */

/* ── DE TYPEMAAT VAN DE LANDING ────────────────────────────────────────────
   ⚠️ AANLEIDING (5-8): de eigenaar liep de pagina langs en zag het meteen —
   "meerdere titelvelden, meerdere ondertitels, meerdere beschrijvingen, maar
   de groottes verschillen, dat ziet er slordig uit". Nagemeten klopte dat: de
   sectiekoppen stonden op 36, 40, 44, 54,4, 56 en 64px. ZEVEN losse
   clamp()-definities voor wat in wezen twee rollen zijn.

   🔑 En drie ervan waren BIJNA-MISSERS: 54,4 naast 56, min 1,9rem naast
   1,875rem, min 2,4rem naast 2,5rem. Dat is het bewijs dat het niet om smaak
   ging maar om verloop: niemand kiest bewust 54,4. Zo gaat het altijd als
   dezelfde waarde op zeven plekken opnieuw wordt ingetypt.

   Daarom staan ze nu hier, als één bron — net als KAART hieronder. Gebruik
   deze constanten en typ nooit een eigen clamp voor een kop; dan kan het niet
   opnieuw uit elkaar lopen.

   DE LADDER (bij 1440px breed):
     KOP_GROOT   64px  de twee grote momenten: de belofte bovenaan de pagina
                       en de uitnodiging in het slotveld. Verder niets.
     KOP_SECTIE  44px  élke sectiekop. Eén maat, zodat je aan het formaat ziet
                       dat je een nieuwe sectie in gaat.
     KOP_BLOK    24px  een kop BINNEN een sectie: de kaartjes van "Herken je
                       dit?", de stappen van "Zo werkt het", de prijskaarten.
   Alle drie in de display-letter, zwaar, met strakke regelafstand en negatieve
   letterafstand — hoe groter de letter, hoe strakker.

   ⚠️ WAAROM 44 EN NIET 56, want dat is geprobeerd. Op 56 (de maat die vier van
   de tien secties al hadden) viel de intro-kop "De slimme werkplek voor
   leerkrachten in het basisonderwijs" over VIJF regels in zijn kolom en ging
   die sectie de hero beconcurreren. Op 44 is dat drie regels, past "Alle
   tools, één werkplek" naast het handgeschreven duwtje op één regel, en
   houden de korte koppen hun kracht — in de browser vergeleken, niet gegokt.
   🔑 De maat van een gedeelde kop wordt bepaald door de LANGSTE kop die hem
   gebruikt, niet door de mooiste. ──────────────────────────────────────────── */
/* ⚠️ WERKBANK: de ONDERGRENZEN zijn hier verlaagd voor de telefoon.
   De bovengrens en de groeisnelheid zijn ongemoeid, dus op een breed scherm
   verandert er niets — daar wint de bovenwaarde toch.

   🔑 WAAROM HET MIS GING: bij clamp() bepaalt de EERSTE waarde wat een telefoon
   krijgt. Op 390px is 5,5vw maar 21px, dus won de ondergrens van 40px: de
   hero-kop was op een telefoon net zo groot als op een laptop. Die drie
   ondergrenzen zijn ooit gekozen met een breed scherm voor je neus, en dat is
   precies de val die overal beschreven staat.
   Nu: 36 / 30 / 18px op een telefoon. Vanaf ongeveer 650px breed neemt de
   vw-term het over en loopt alles weer naar de oude maten toe.

   ⚠️ 10-8: DIT IS DE TWEEDE POGING, en de eerste zat te laag. Ik had 30 / 24 / 18
   gezet en de eigenaar zag het meteen: "de titelvelden mogen allemaal wat groter,
   zijn nu best klein". Een sectiekop van 24px is op een telefoon nauwelijks meer
   dan de lopende tekst eronder (18px), en dan doet hij zijn werk niet — je ziet
   niet meer dát je een nieuwe sectie in gaat. Nu 30px voor een sectiekop.
   🔑 KOP_GROOT MOEST DUS MEE, ook al ging de vraag daar niet over. Op 30 zou de
   belofte bovenaan even groot zijn geworden als élke sectiekop eronder, en dan is
   de ladder weg. De afstand tussen de treden is het punt, niet de losse maat.

   ⚠️ EN OP EEN TELEFOON STAAT ALLES IN HET MIDDEN — vandaar `max-sm:text-center`
   hieronder. Dat lijkt in strijd met de huisregel "niet alles centreren", maar
   die regel gaat over een BREED scherm: daar is links uitlijnen wat een pagina
   een ruggengraat geeft, omdat er een kolom naast staat om tegen af te zetten.
   Op een telefoon is er geen kolom ernaast. Een kop die daar links begint hangt
   scheef in het scherm, want de marges links en rechts zijn zelden even breed —
   precies wat de eigenaar zag bij de twee knoppen (24 links, 38 rechts).
   🔑 Het staat HIER en niet bij elke sectie apart, om dezelfde reden als de
   maten zelf: op tien plekken los ingetypt loopt het gegarandeerd uit elkaar.
   Wie een kop centreert of juist links wil, doet dat hier voor de hele pagina. */
export const KOP_GROOT =
  "font-display text-[clamp(2.25rem,5.5vw,4rem)] font-black leading-[1.05] tracking-[-0.025em] [text-wrap:balance] max-sm:text-center";
export const KOP_SECTIE =
  "font-display text-[clamp(1.875rem,4.4vw,2.75rem)] font-black leading-[1.1] tracking-[-0.02em] [text-wrap:balance] max-sm:text-center";
export const KOP_BLOK =
  "font-display text-[clamp(1.125rem,1.9vw,1.5rem)] font-black leading-[1.3] tracking-[-0.015em]";

/* ── DE TEKST ONDER EEN KOP ────────────────────────────────────────────────
   Stond op 16, 16,3, 16,8 en 18px. Die eerste drie zijn geen keuzes maar
   afrondingen van drie verschillende clamps die allemaal ongeveer hetzelfde
   probeerden te zijn. Eén maat: 18px met een ruime regelafstand, want dit is
   lopende tekst en geen bijschrift.

   ⚠️ OP EEN TELEFOON BLIJFT DE MAAT 18px — alleen de regelafstand zakt van 1,78
   naar 1,55. Dat onderscheid is de hele les van deze ronde. Toen de pagina op
   een telefoon "veel te groot" was, heb ik óók de lopende tekst verkleind, tot
   14px. Fout: te groot waren de KOPPEN (40px) en de WITRUIMTE. De tekst zelf
   was nooit het probleem, en op 14px werden die twee secties de kleinste van de
   pagina — precies wat de eigenaar op zijn S21 Ultra zag.
   🔑 Wat een blok op een telefoon hoog maakt is zelden de lettergrootte; het is
   de ruimte eromheen. Krimp dus eerst marges en regelafstand, en pas de letter
   als het dan nog niet past. Leesbaarheid inleveren is de laatste stap, niet de
   eerste. */
export const TEKST_SECTIE = "text-[1.125rem] leading-[1.55] sm:leading-[1.78]";

/* ── HET HANDSCHRIFT ───────────────────────────────────────────────────────
   Hier stonden drie maten (20, 22,4 en 24px) voor wat op het oog hetzelfde is.
   Twee ervan zijn het WEL: er zijn twee rollen, en die verschillen ook echt.

     HAND_REGEL  24px  een uitspraak onder een sectiekop. Hij hoort bij de kop
                       en mag gelezen worden ("Het hoort bij het werk, maar het
                       kan slimmer", "privacy voorop").
     HAND_WENK   20px  een AANWIJZING bij iets dat je kunt doen ("sleep de rij
                       opzij", "klik op een foto"). Die hoort kleiner: hij is
                       een onderschrift en geen boodschap.

   🔑 Twee maten dus, maar met een reden die je kunt uitleggen — dat is het
   verschil met de drie die er stonden. De 22,4 was er niet één van. */
export const HAND_REGEL = "text-2xl leading-[1.38]";
export const HAND_WENK = "text-xl leading-[1.4]";

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
  href, variant = "vol", maat = "normaal", vinkje = true, className = "", onClick, children,
}: {
  href: string;
  variant?: "vol" | "licht" | "wit";
  /* Het vinkje in de gevulde knop is het merkmotief en staat er standaard.
     ⚠️ Zet het uit als de knop NIET naar aanmelden gaat. Op "Naar de prijzen"
     (een sprong naar beneden binnen de pagina) leest een vinkje als afvinken:
     het belooft dat er iets klaar is terwijl er alleen iets verplaatst.
     🔑 Een merkteken dat overal hetzelfde betekent is sterk; een merkteken dat
     op één plek iets anders lijkt te beloven, kost meer dan het oplevert. */
  vinkje?: boolean;
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
      {variant === "vol" && vinkje && (
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
      {/* ⚠️ ALLEEN `pt` OP DE TELEFOON, NIET `pb`. De eigenaar miste ruimte tussen
         de handgeschreven regel van "Herken je dit?" en de kop hier, en zei er
         meteen bij: "de tussenruimte richting De tools is perfect". Dat is dus
         geen sectie die te krap staat maar één rand die te krap staat.
         🔑 Ruimte hoort bij de kant waar hij ontbreekt. Was ik hier op de hele
         sectie gaan sleutelen (of op de gap), dan had ik de onderkant meeverpest
         die al goed was — en dat merk je pas twee schermen verder.
         Gemeten: het gat was 176px, waarvan 82px van deze sectie en de rest de
         staart van de vorige plus de golf. Nu 208px. */}
      <div className="relative mx-auto grid w-full max-w-5xl gap-10 px-6 pb-24 pt-16 max-sm:pt-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:pb-32 lg:pt-24">
        {/* Papier: alleen zichtbaar met de schakelaar aan (zie RUIS_OP_PAPIER). */}
        {RUIS_OP_PAPIER && (
          <Confetti punten={[{ x: "2%", y: "18%", r: 4, amber: true }, { x: "96%", y: "70%", r: 5 }, { x: "88%", y: "8%", r: 3 }]} />
        )}
        <div>
          <h2
            data-reveal
            className={KOP_SECTIE}
            style={{ color: KOP }}
          >
            De slimme werkplek voor leerkrachten in het basisonderwijs
          </h2>
          {/* ⚠️ DEZE TWEE KNOPPEN ZIJN AL TWEE KEER VAN VORM GEWISSELD — lees dit
              vóór je ze een derde keer verandert.

              Ze stonden ONDER elkaar over de volle breedte, en samen namen ze
              bijna een derde van het scherm. Daarom heb ik ze 9-8 NAAST elkaar
              gezet en gekrompen (14px tekst, krappe ruimte eromheen): het paste
              precies op 360px, dus het probleem "ze vreten het scherm op" was
              opgelost.
              🔑 En dat was de verkeerde oplossing, want ik loste de verkeerde
              klacht op. De eigenaar 10-8: "zijn te klein". Ruimte besparen was
              MIJN zorg; op een telefoon scrol je toch, dus verticale ruimte is
              het goedkoopste wat er is. Een knop die je makkelijk raakt is meer
              waard dan een halve schermhoogte winst.

              Nu dus weer onder elkaar, maar met een verschil: over de VOLLE
              BREEDTE. Dat is wat het de vorige keer niet was — twee smalle
              knoppen onder elkaar zien er slap uit, twee brede lezen als een
              keuze. Ze zijn ook weer op de gewone paginamaat (18px tekst, px-8
              py-4), zodat ze niet langer de kleinste knoppen van de pagina zijn.
              Aanraakvlak: ~59px hoog, ruim boven de 44px die WCAG 2.2 vraagt. */}
          <div data-reveal className="mt-6 flex gap-3 max-sm:flex-col sm:mt-8">
            {/* ⚠️ De doorzichtige rand is GEEN opsmuk. De lichte knop hieronder
                heeft `border-2`, deze niet, dus die werd 64px hoog en deze 60.
                Naast elkaar zie je dat niet; recht boven elkaar en allebei even
                breed wél — dan lijkt de onderste knop groter. Alleen op de
                telefoon, want op een breed scherm staan ze naast elkaar en is
                de hoogte van de gevulde knop af. */}
            {/* ⭐ DEZE EERSTE KNOP IS OP TELEFOON EN PC NIET DEZELFDE, en dat is
                een bewust verschil — het enige op deze pagina.

                Op een TELEFOON gaat hij naar de prijzen. Reden van de eigenaar:
                sinds de proef staat "Probeer gratis" daar al vast in de balk
                bovenaan zodra je de hero voorbij bent, en die balk is hier in
                beeld. Twee keer dezelfde actie binnen één blikveld is er één te
                veel; de vraag die op dít punt open staat is wat het kost.
                Op een BREED SCHERM blijft "Probeer Avinka gratis" staan. Daar
                heeft de hero geen knoppen (die is één doorlopende film) en is
                dit de eerste echte aanmeldknop van de pagina. Weghalen zou daar
                een conversiepunt schrappen uit een versie die af is.

                🔑 De naam is van de eigenaar en is onderweg nog gedraaid. Eerst
                "Naar de prijzen" (uit vier voorstellen), daarna toch
                "Bekijk abonnementen": het gaat om het abonnement dat je kiest,
                niet om een prijslijst, en "Naar de abonnementen" vond hij te
                groot staan. De knop ernaast heet daarom nu "Ontdek de tools" —
                anders begonnen ze allebei met "Bekijk".
                ⚠️ Het adres blijft `#prijzen`; dat is het id van de sectie en dat
                staat los van wat er op de knop staat.
                ⚠️ Het blijft de gevulde knop: het is de hoofdactie van déze
                sectie. Voelt twee keer groen in beeld te druk, dan is `variant`
                het enige wat daarvoor hoeft te wijzigen.

                De krappere zijruimte op de telefoon (px-5 in plaats van px-8) is
                nodig omdat een langere tekst met het vinkje ernaast anders niet
                op één regel past op 360px — en `whitespace-nowrap` laat hem niet
                afbreken. Bij een knop over de volle breedte doet die zijruimte
                toch niets: de tekst staat gecentreerd. */}
            <BlobKnop
              href="#prijzen"
              vinkje={false}
              className="max-sm:w-full max-sm:border-2 max-sm:border-transparent max-sm:px-5 sm:hidden"
            >
              Bekijk abonnementen
            </BlobKnop>
            <BlobKnop href="/sign-up" className="max-sm:hidden">
              Probeer Avinka gratis
            </BlobKnop>
            {/* ⚠️ "Ontdek de tools", was "Bekijk de tools". De aanleiding is de
                knop hierboven: op een telefoon heet die nu "Bekijk
                abonnementen", en twee knoppen die allebei met hetzelfde
                werkwoord beginnen lezen als één rijtje in plaats van als twee
                keuzes. Keuze van de eigenaar.
                🔑 Deze tekst is NIET gesplitst tussen telefoon en pc, met opzet:
                één belofte hoort één naam te hebben, en "ontdek" past ook op een
                breed scherm bij wat er gebeurt (de kaartenrij die je zelf
                opzijschuift). Op pc staat er dus wél "Probeer Avinka gratis"
                naast "Ontdek de tools" — geen botsing. */}
            <BlobKnop href="#tools" variant="licht" className="max-sm:w-full">
              Ontdek de tools
            </BlobKnop>
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
            /* Op een telefoon was deze openingszin 22px met een regelafstand
               van 36: bijna sectiekop-formaat, terwijl het lopende tekst is. */
            /* Deze zin moet boven de lopende tekst uitkomen, en die is op een
               telefoon 18px. Op 17px stond hij er ónder — de rangorde stond
               omgekeerd. Nu 20px: groter dan de alinea, kleiner dan de kop. */
            className="text-xl font-semibold leading-7 [text-wrap:balance] max-sm:text-center sm:text-2xl sm:leading-10"
            style={{ color: KOP }}
          >
            {/* ⚠️ HIER STONDEN ACHTEREENVOLGENS: "Avinka brengt de hulpmiddelen
               voor je schoolwerk samen in één omgeving" (de gereedschapskist in
               één zin) en daarna "Bij Avinka staat al je schoolwerk op één plek.
               Ook denkt het programma actief mee in toekomstige weken."

               Die tweede is eruit om een reden die je pas ziet als je de sectie
               in één oogopslag bekijkt: de kop links zegt "de slimme WERKPLEK",
               deze zin zei "op één PLEK", en de alinea eronder zegt "zorgt voor
               OVERZICHT". Drie keer hetzelfde idee, naast elkaar. De zwakste
               van de drie stond vooraan.

               🔑 De vuistregel die daaruit volgt: kijk bij een sectie niet naar
               zinnen maar naar IDEEËN. Twee zinnen kunnen prima verschillen en
               toch hetzelfde zeggen, en dat merk je alleen als je ze naast
               elkaar legt in plaats van na elkaar te lezen.

               Wat er nu staat is de openingszin van de eigenaar. Hij begint bij
               de LEERKRACHT en niet bij het product, en dat is precies waarom
               hij werkt: iemand leest verder omdat het over hem gaat. Al mijn
               eigen pogingen begonnen bij de ellende of bij de functie.
               ⚠️ Niet gladstrijken en niet aanvullen. Deze regel moet kort
               blijven; de uitleg staat eronder. */}
            Voor de klas maak jij het verschil.
          </p>
          {/* ⚠️ HIER IS HET ÉÉN KEER GOED MISGEGAAN, en dat is het waard om vast
             te leggen. Ik heb bij het omzetten naar de nieuwe koers het woord
             "hulpmiddelen" uit de eerste zin gehaald — en dat was het ENIGE
             woord in deze sectie dat zei dát er tools zijn. Wat overbleef was
             een opbergverhaal ("alles op één plek") plus een vooruitkijkverhaal
             ("denkt mee"), en nergens meer wát het ding doet. De eigenaar:
             "waar staat nu dat het met behulp van slimme AI-tools is? Dit is de
             belangrijkste sectie van de landing."

             🔑 DE LES: bij een koerswijziging poets je het FRAME op, maar de
             SUBSTANTIE moet blijven staan. Een bezoeker die hier stopt met
             lezen moet weten wat hij koopt, niet hoe wij erover denken. Zet het
             concrete dus vooraan en het nieuwe erachter, niet andersom.

             ⚠️ DIT IS DE VERKOOPZIN, GEEN SPECIFICATIEBLAD. Hier is het twee
             keer misgegaan en allebei de keren in dezelfde richting: ik ging
             opsommen wát er allemaal is (rapporten, toetsen, ouderberichten,
             vakanties, de data van groep 8). De eigenaar: "te specifiek, je
             gaat te veel in op wat er allemaal is. Leerkrachten moeten hieruit
             opmaken: woah dat is handig, heb ik nodig."

             🔑 EEN OPSOMMING OVERTUIGT NIET, HERKENNING WEL. Een leerkracht
             wil hier geen lijst afvinken maar zichzelf tegenkomen. Daarom
             begint de zin bij de AVOND die hij kwijt is, niet bij de functie
             die dat oplost — en pas als hij zichzelf herkent, wil hij weten
             hoe. De opbouw is dus:
             1. de pijn die verdwijnt, in zijn woorden;
             2. pas dan waardoor.

             De twee pijnen hier zijn niet vrij gekozen: het zijn er twee uit
             "Herken je dit?" hierboven, zodat deze sectie letterlijk antwoord
             geeft op wat daar staat. "Taken die je pas ziet als het te laat
             is" is de derde pijn, en die had tot nu toe nergens antwoord.

             ⚠️ Wat hier NIET meer in staat en waar het wél waar is: dat Avinka
             de vakanties en de vaste data van groep 8 kent, ook zonder dat je
             iets koppelt (`lib/planning/vakanties.ts` en `groep8.ts`). Dat is
             sterk bewijs, maar het is BEWIJS en geen verkoopzin. Wil je het
             tonen, doe dat dan ergens waar bewijs hoort.

             ⚠️ DE AI ZIT MET OPZET AAN HET SCHRIJFWERK VAST EN NIET AAN DE
             ANDERE TWEE. Het overzicht en het vooruitkijken doet de code; de AI
             schrijft alleen de tekst. Zou hier staan dat AI-tools voor overzicht
             zorgen, dan spreekt deze zin stap 02 van "Zo werkt het" en twee
             vragen in de FAQ tegen. Die scheiding moet overal hetzelfde zijn.
             🔑 AI wordt hier ook genoemd omdat het MOET: sinds 2-8-2026 geldt de
             transparantieplicht uit de AI Act (zie [[ai-act-onderwijs]]). Haal
             het woord hier dus niet weg om de zin mooier te maken.

             Deze alinea is van de eigenaar zelf; ik heb er twee dingen aan
             bijgesteld die hij heeft overgenomen: "terwijl" beloofde een
             tegenstelling die niet kwam (aandacht en energie zeiden hetzelfde),
             en "aandacht" stond er twee keer terwijl het het slotwoord moest
             zijn. Niet verder gladstrijken. */}
          {/* [text-wrap:pretty] hoort bij het centreren en niet bij de maat: een
              gecentreerde alinea van vier regels valt zonder dat vaak uit op een
              korte slotregel van één woord, en dat staat midden in het scherm
              een stuk lelijker dan links. */}
          <p data-reveal className={`mt-3 ${TEKST_SECTIE} text-ink/75 max-sm:text-center max-sm:[text-wrap:pretty] sm:mt-4`} style={{ transitionDelay: "90ms" }}>
            Toch vraagt het werk na schooltijd net zoveel van je, en juist dat
            kost energie. Avinka zorgt voor overzicht, denkt vooruit en laat AI
            het schrijfwerk doen, zodat jij meer rust en aandacht overhoudt voor
            je leerlingen.
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

/* De handgeschreven regel bij "Herken je dit?".
   ⚠️ ÉÉN definitie, twee plekken — en dat is met opzet. Op een breed scherm
   staat hij naast de kaarten (meelopend onder de sticky kop): daar is het een
   onderschrift bij wat je ernaast ziet. Op een telefoon valt die kolom bóvenop
   de kaarten, en dan lees je de conclusie ("het kan slimmer") vóór de drie
   problemen waar hij over gaat. Daarom staat hij op mobiel ná de kaarten.
   🔑 Niet twee keer overtypen: dan loopt de tekst vroeg of laat uit elkaar en
   corrigeer je er maar één. Zie de Prijzen-kopie die ooit een rechtgezette
   belofte terugbracht op de voorpagina. */
function HandRegel({ className = "" }: { className?: string }) {
  return (
    <p
      data-reveal
      className={`${HAND_REGEL} ${className}`}
      style={{ fontFamily: "var(--font-hand)", color: KOP }}
    >
      Het hoort bij het werk,
      <br />
      maar het kan slimmer,
      <br />
      sneller en efficiënter
    </p>
  );
}

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
      {/* Telefoonversie: zelfde vorm, zelfde kant, ongeveer half zo groot.
         ⚠️ De zijmarge moet in PROCENTEN groter dan op pc: -18% van 1440 is 260
         pixels, -18% van 390 maar 70. Wil je hetzelfde "loopt het beeld uit",
         dan moet het percentage mee omhoog — hier -34%. Dat is de val bij het
         overzetten van een brede compositie: dezelfde waarde is niet dezelfde
         maat. */}
      <KaartVlak
        kleur={VLAK_MINT_ZACHT}
        vorm="koepel"
        breedte={380}
        hoogte={170}
        style={{ left: "-34%", bottom: 120, transform: "rotate(6deg)" }}
        className="z-[6] lg:hidden"
        tel={5}
      />
      <Drijvers punten={[{ x: "46%", y: "88%", amber: true, tel: 2 }, { x: "88%", y: "80%", tel: 4 }]} />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-28 pt-32 lg:pb-36 lg:pt-40">
        <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <div>
            <h2
              data-reveal
              className={`${KOP_SECTIE} lg:sticky lg:top-28`}
              style={{ color: DONKER }}
            >
              {/* De regelbreek is er voor de SMALLE KOLOM op een breed scherm
                 (0.78fr naast de kaarten); daar past "Herken je dit?" niet op
                 één regel. Op een telefoon is er geen kolom en dus geen reden om
                 te breken — daar stonden twee woorden op twee regels midden in
                 het scherm.
                 ⚠️ `lg:inline` en niet `lg:block`: inline is de eigen weergave
                 van een <br>. Zet je hem op block, dan is de breek er nog wel
                 maar krijgt het element ook een eigen regelhoogte. */}
              {/* ⚠️ Die {" "} is GEEN opsmuk. JSX gooit de witruimte weg die
                 tegen een tag aan ligt, dus met alleen een verborgen <br> stond
                 er letterlijk "Herkenje dit?" — onzichtbaar zolang de breek nog
                 aan stond, meteen zichtbaar zodra hij uit ging. */}
              Herken{" "}
              <br className="hidden lg:inline" />
              je dit?
            </h2>
            {/* Drie regels in plaats van twee. Kalam loopt breder dan de Caveat
               die hier eerst stond, waardoor "efficiënter" als los woord op een
               derde regel viel — een wees. Kleiner zetten hielp wel maar kostte
               aanwezigheid; drie korte regels lezen bij handschrift juist
               natuurlijk, dus de maat kon terug omhoog. De tekst is
               ongewijzigd, alleen de regelval.
               Op een telefoon staat deze regel ná de kaarten; zie HandRegel. */}
            <HandRegel className="mt-6 hidden lg:sticky lg:top-60 lg:block" />
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
                /* ⚠️ Alles met een `sm:` ervoor is de bestaande desktopmaat en
                   blijft ongemoeid; wat ervóór staat geldt alleen op een
                   telefoon. Zo krimpt de kaart daar (kleinere binnenmarge,
                   minder tussenruimte) zonder dat het brede scherm iets merkt. */
                className={`${KAART} relative mb-3 flex items-start gap-3 p-4 sm:mb-6 sm:gap-5 sm:p-7 lg:ml-[var(--stap)]`}
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand sm:h-9 sm:w-9 sm:rounded-xl" aria-hidden>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div>
                  {/* ⚠️ Hier stond `text-2xl` hardgecodeerd, terwijl de
                      type-ladder bovenaan dit bestand zegt dat juist de
                      kaartjes van "Herken je dit?" KOP_BLOK horen te
                      gebruiken. Op een telefoon gaf dat een kop van 24px op
                      een kaart van 5cm breed. Niet vervangen door KOP_BLOK:
                      dat zou op een smalle laptop (1024px) óók 19,5px geven
                      in plaats van 24, en het brede scherm is af. Alleen de
                      telefoon krimpt dus. */}
                  {/* Kleiner dan de sectiekop erboven (die is 24px op een
                      telefoon): een kaartkop hoort de sectiekop niet te
                      beconcurreren. 18px titel, 16px tekst.
                      ⚠️ Dit stond eerst op 17 en 14. Die 14 maakte deze kaarten
                      de kleinste tekst van de hele pagina; de andere kaarten
                      (Zo werkt het, Veilig omgaan met AI) staan allebei op 16.
                      De 18 voor de titel is de ondergrens van KOP_BLOK, de maat
                      die volgens de ladder bovenaan dit bestand bij een kop
                      BINNEN een sectie hoort. Beide waarden zijn dus overgenomen
                      en niet opnieuw verzonnen — zo blijven ze gelijklopen. */}
                  <h3 className="font-display text-lg font-black leading-tight tracking-tight text-ink sm:text-2xl">{p.titel}</h3>
                  <p className="mt-1 text-base leading-6 text-ink/70 sm:mt-1.5 sm:text-lg sm:leading-7">{p.tekst}</p>
                </div>
              </div>
            ))}
            {/* Op een telefoon sluit de handgeschreven regel de drie problemen
               af in plaats van ze aan te kondigen. */}
            <HandRegel className="mt-8 text-center lg:hidden" />
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
/* ── HET MAKERSBLOK IS EEN CV ──────────────────────────────────────────────
   ⚠️ TWEE DINGEN ZIJN HIER ACHTER ELKAAR AFGEVALLEN. Lees dit vóór je iets
   terugzet, want allebei zijn ze uitgeprobeerd en allebei zijn ze afgekeurd.

   1. HET SCHRIFT (4-8 tot 5-8). Een schrift waar je zelf doorheen bladerde:
      kaft met etiket, vriendenboekje, drie spreads. Eigenaar: "het gedraaide
      3D-effect vind ik heel vet, maar het schriftje is gewoon niet helemaal
      mijn ding."
   2. DE 3D-RUIMTE (5-8). Daarna lag hier een CV dat gekanteld in de ruimte
      lag, met echte randen, een stapel losse vellen eronder en een kanteling
      die met je muis meedraaide. Eigenaar: "haal dat 3D-gedeelte hier maar
      weg, ziet er niet uit."

   🔑 WAT ER OVERBLIJFT IS DE BEDOELING, NIET DE MECHANIEK. Wat elke ronde
   overleefde was de INHOUD en de VOLGORDE: wie hij is, en daarna waar Avinka
   voor staat. Wat er telkens uit ging was het apparaat eromheen. Bouw hier dus
   geen nieuw mechaniek in; dit is een kaart en die hoort bij de andere kaarten
   van deze wereld te horen.

   Wat een CV hier goed doet:
   - Alles staat er tegelijk op, dus de missie zit niet achter een klik. Dat is
     een harde les van deze pagina: de tijdwinst per tool zat ook ooit achter
     een interactie en dat was fout. Wat je moet lezen, laat je zien.
   - Een CV heeft van nature de volgorde die de eigenaar vroeg: eerst wie je
     bent, dan waar je voor staat.
   - Het is een vorm die iedereen kent, dus er valt niets uit te leggen. */

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
          {/* Telefoonversie. De negatieve top houdt hem onder de kleurrand
             vandaan komen — dat is de stand die volgens mijn aantekeningen
             werkt, en hij draagt hier de golf. */}
          <KaartVlak
            kleur={VLAK_MINT}
            vorm="ei"
            breedte={300}
            hoogte={165}
            style={{ right: "-26%", top: -40, transform: "rotate(7deg)" }}
            className="lg:hidden"
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

      {/* 🔑 HET CONCEPT: EEN CV DIE SCHUIN OP HET VELD LIGT.
         De compositie is dezelfde als altijd — links de kop en één zin voor de
         lezer, rechts het voorwerp — maar het voorwerp is nu een document in
         plaats van een schrift.

         DE OPBOUW VAN HET DOCUMENT, en die is niet willekeurig:
         1. een donkergroene kopband met de naam, de rol en de foto. Dat is de
            eerste seconde: er staat een mens achter dit product.
         2. links een smalle kolom met de harde feiten (groep, jaren, school,
            woonplaats). Kort, want dit is de aanleiding en niet het verhaal.
         3. rechts de brede kolom: waarom Avinka bestaat en waar het heen gaat.
            Dít is waar de sectie voor bedoeld is en het krijgt dus de meeste
            ruimte — de eigenaar: "beetje persoonlijke info, daarna vooral over
            Avinka".
         4. onderaan, met de hand geschreven, de zin die je moet onthouden.

         ⚠️ Waarom de handgeschreven zin daar staat en niet in de gedrukte
         kolom: op een CV zet je zelf niet wat je gelooft — dat schrijf je
         eronder. Het is het enige stuk van dit document dat niet uit een
         printer komt, en daarom leest het als de persoon in plaats van als de
         sollicitant. */}
      {/* De padding boven en onder blijft aan elkaar gelijk. Dat is geen
         netheid: de mint begint op de halve hoogte van deze sectie, dus zodra
         die twee uit de pas lopen valt de kleurnaad niet meer halverwege het
         document. Verander je er één, verander dan allebei.
         (Hij stond op pt-28/pt-36 omdat een omslaand blad van het schrift ver
         boven de sectie uit zwaaide en door overflow:hidden werd afgeknipt. Er
         slaat nu niets meer om, dus het mag weer krapper — maar het document
         is wél hoger dan het schrift was, dus niet terug naar pt-20.) */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-24 pt-24 lg:pb-28 lg:pt-28">
        <Confetti punten={[{ x: "3%", y: "88%", r: 4 }]} />

        <div className="w-mkr-rij">
          {/* ── links: de kop en de uitleg ──
             🔑 DE TAAKVERDELING TUSSEN LINKS EN HET DOCUMENT, en dat is waar
             deze alinea drie keer op stukliep:
             het CV vertelt wie hij is en waar Avinka voor staat;
             LINKS moet vertellen wat dat voor de LEZER betekent.
             Zolang hier stond "ik bouw het zelf, geen bedrijf, geen
             supportafdeling" zei het in andere woorden hetzelfde als het
             document ernaast, alleen zakelijker. En het definieerde Avinka
             bovendien met wat het NIET is, wat altijd zwakker leest dan wat
             het wél is. */}
          <div className="w-mkr-tekst">
            <h2 className={`${KOP_SECTIE} w-mkr-kop`}>Even voorstellen</h2>
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
            <p className={`${TEKST_SECTIE} w-mkr-inleiding`}>
              Avinka is gebouwd om leerkrachten te helpen met het werk dat na
              schooltijd blijft liggen. Ik doe aanpassingen op basis van eigen
              ervaringen, maar sta graag open voor alle feedback.
            </p>
            {/* ── de uitnodiging ──
               ⚠️ HIER STOND EEN QUOTE: "Goede leerkrachten horen hun tijd te
               besteden aan leerlingen, niet aan administratie." Eruit op
               verzoek ("dit vind ik een meh quote voor in het groen"), en
               daarmee staat die zin nergens meer op de pagina.
               🔑 Wat ervoor in de plaats komt is geen uitspraak maar een
               UITNODIGING, en dat past beter bij waar hij staat. Deze kolom
               spreekt de lezer aan, en de zin ernaast in de kaart zegt al
               "ik sta graag open voor alle feedback" — dit maakt daar iets
               van dat je ook echt kúnt doen in plaats van alleen leest.
               Handschrift, want dit is het enige stuk van de sectie dat de
               maker rechtstreeks tegen je zegt. */}
            <p className={`${HAND_REGEL} w-mkr-belofte`}>
              Laat me vooral weten wat je ervan vindt!
            </p>
            {/* ── het adres, met een pijltje ernaartoe ──
               ✅ info@avinka.nl is bevestigd door de eigenaar: het officiële
               adres in de zakelijke Google Workspace, dus het ontvangt ook
               echt. (support@avinka.nl is een alias en staat op /dashboard/hulp
               voor "ik kom er niet uit" — niet door elkaar gebruiken.)

               Het pijltje is DEZELFDE hand als bij de polaroids ("klik op een
               foto om de ervaring te lezen"): zelfde dikte, zelfde ronde
               uiteinden, alleen gespiegeld zodat de boog naar beneden loopt in
               plaats van omhoog. Een tweede vormtaal verzinnen voor hetzelfde
               gebaar maakt een pagina rommelig.
               🔑 Het staat hier ook niet voor de sier: onder deze kolom viel
               een groot leeg vlak, en een aanwijzing die daar de blik naartoe
               trekt vult dat gat met iets dat werk doet in plaats van met
               decoratie. */}
            <div className="w-mkr-contact">
              {/* ⚠️ TWEE KEER DE VERKEERDE KANT OP GEWEEST. Eerst liep hij bijna
                 vlak naar rechts (daalde 7px over 30px breedte) en las als een
                 streepje. Daarna liep hij van linksboven schuin naar
                 rechtsonder — één diagonale haal.
                 De eigenaar wil dat hij EERST NAAR BENEDEN gaat en DAN NAAR
                 RECHTS. Dat is ook logischer: de uitnodiging staat erboven en
                 het adres ernaast, dus de pijl moet die hoek echt om.
                 🔑 De vorm zit in de controlepunten. Het eerste ligt recht onder
                 het beginpunt (7,15 onder 7,2) — daardoor vertrekt de lijn
                 verticaal. Het tweede ligt linksonder het eindpunt (9,25 bij
                 30,27) — daardoor komt hij horizontaal aan. Zo maakt één curve
                 een hele hoek, zonder knik. */}
              <svg
                className="w-mkr-pijl"
                viewBox="0 0 38 34"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M7 2 C 7 15, 9 25, 30 27" />
                {/* De punt staat haaks op het EIND van de curve, en die komt
                   horizontaal binnen — dus de weerhaken wijzen naar links. */}
                <path d="M23.5 23 L 30.5 27 L 23 29.8" />
              </svg>
              <a className={`${HAND_WENK} w-mkr-mail`} href="mailto:info@avinka.nl">
                {/* Lijnicoon in dezelfde trant als de drie pictogrammen in de
                   privacysectie: dunne lijn, ronde hoeken, geen vulling. */}
                <svg
                  className="w-mkr-envelop"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <rect x="2.5" y="5" width="19" height="14" rx="3" />
                  <path d="M3.6 7.6 L12 13.6 L20.4 7.6" />
                </svg>
                {/* De onderstreping zit op de TEKST en niet op de link, anders
                   loopt hij ook onder het envelopje door en wordt het één
                   doorgestreept blokje. */}
                <span>info@avinka.nl</span>
              </a>
            </div>
          </div>

        {/* ⚠️ DE SCHEEFSTAND STAAT MET OPZET OP `rotate:` EN NIET IN EEN
           TRANSFORM. Dit element draagt data-reveal, en de reveal-regel
           .anim [data-reveal].is-in { transform: none } in Landing.tsx wist
           elke transform op datzelfde element weg. Sinds CSS Transforms 2 is
           rotate een eigen eigenschap en valt hij daar niet onder, dus die
           overleeft het wél. Dat kostte bij de 3D-poging een hele ronde: die
           kanteling verdween en het zag eruit als een bouwfout. */}
        <div data-reveal className="w-cv">
            <article className="w-cv-blad">
              {/* ── de kopband ──
                 Naam links, foto rechts. Dit is de eerste seconde van het hele
                 blok: er staat een mens achter dit product, en die heeft een
                 gezicht en een naam. Donkergroen omdat dit de enige plek in de
                 sectie is die om aandacht mag vragen. */}
              {/* ── de kopband ──
                 🔑 DE GOLF IS WAT DIT DOCUMENT BIJ DE PAGINA LAAT HOREN. Elke
                 kleurovergang op deze landing is een golf — papier naar mint,
                 mint naar papier, zeven keer. Een kaart met een kaarsrechte
                 kleurscheiding erin is daarom het enige element op de pagina
                 dat zijn eigen taal niet spreekt, en dat is precies wat de
                 eigenaar bedoelde met "simpel en saai".
                 Vorm "zacht" is letterlijk hergebruikt, geen nieuwe golf: de
                 regel is dat golven bestaande amp/golven-waarden delen. In een
                 vak van 38px levert amp 26 zo'n 9px deining — genoeg om te zien
                 dat het een golf is, te weinig om met de sectiegolven te gaan
                 concurreren. */}
              <header className="w-cv-band">
                <div>
                  <p className="w-cv-naam">Michael van Spanje</p>
                  {/* ⚠️ "oprichter" is het woord van de eigenaar zelf en het
                     zegt iets wat "maker" niet zegt: dit is geen hobbyproject
                     maar een bedrijf met iemand die ervoor staat. Precies wat
                     een school wil weten. Niet terugveranderen. */}
                  <p className="w-cv-rol">leerkracht &amp; oprichter van Avinka</p>
                </div>
                {/* ── de foto breekt door de kleurgrens ──
                   Ze staat in een organische vorm (dezelfde ongelijke radii als
                   de kaarten van deze wereld) en zakt met haar onderkant tot IN
                   de golf. Dat is geen versiering maar een van de vaste
                   kenmerken van deze designtaal: beeld dat over een veldrand
                   heen loopt in plaats van er netjes binnen te blijven.
                   Het crème randje doet er nog iets bij: het houdt de
                   achtergrond van de foto weg van het donkergroen, dat er
                   anders tegenaan botst. */}
                <div className="w-cv-pas">
                  {fotoBestand ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/${fotoBestand}`}
                      alt="Michael van Spanje"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-display text-xl font-black" style={{ color: DONKER }}>
                      MvS
                    </span>
                  )}
                </div>
                <Golf
                  kleur="var(--w-kaart-warm, #fffdf9)"
                  vorm="zacht"
                  hoogte="h-[30px] sm:h-[38px]"
                />
              </header>

              {/* ── de personalia als strook ──
                 ⚠️ DIT STOND ALS SMALLE KOLOM NAAST HET VERHAAL en dat kan niet
                 meer nu het document weer naast de tekst staat: op 32rem hield
                 het verhaal dan 300px over en liep elke alinea over vier
                 regels. Over de volle breedte is de leesregel ~62 tekens, de
                 maat waarop lopende tekst het prettigst leest.
                 Boven elkaar zet het bovendien de volgorde neer die de eigenaar
                 vroeg: "beetje persoonlijke info, daarna vooral over Avinka". */}
              <div className="w-cv-strook">
                {/* Alle gegevens hieronder komen van de eigenaar zelf. Niets
                   hiervan invullen, afronden of bijstellen zonder hem: het zijn
                   feiten over een echt persoon, inclusief zijn school.

                   ⚠️ DE INDELING IS DOOR DE EIGENAAR BEPAALD (5-8): links wie
                   hij is, midden waar hij werkt, rechts hoe lang al. Niet
                   herschikken naar wat "beter uitkomt" in het rooster.
                   🔑 Het zijn drie APARTE lijstjes en niet één rooster met
                   losse cellen. Dat moet ook: in één rooster bepaalt de hoogste
                   cel van een rij hoe hoog die rij is, en omdat "werk" twee
                   waarden heeft zou "woont in" links een gat onder zich
                   krijgen. Drie kolommen die elk hun eigen hoogte bepalen
                   hebben dat probleem niet.
                   (En een div met divs erin mag niet binnen een dl staan — de
                   inhoud van een dl mag alleen dt, dd of een div met dt/dd
                   zijn. Vandaar drie dl-s in plaats van groepen in één dl.) */}
                <div className="w-cv-feiten">
                  <dl className="w-cv-kolom">
                    <div>
                      <dt>leeftijd</dt>
                      <dd>30</dd>
                    </div>
                    <div>
                      <dt>woont in</dt>
                      <dd>Apeldoorn</dd>
                    </div>
                  </dl>
                  <dl className="w-cv-kolom">
                    {/* ⚠️ De groep hing hier eerst als tweede waarde ONDER
                       "werk", zonder eigen label. Op verzoek losgetrokken tot
                       een eigen regel met een eigen kop, net als de twee
                       links. Zo staat er nergens meer een waarde zonder dat
                       erbij staat waar hij antwoord op geeft. */}
                    <div>
                      <dt>werk</dt>
                      <dd>Regenboog Osseveld</dd>
                    </div>
                    <div>
                      <dt>groep</dt>
                      <dd>7</dd>
                    </div>
                  </dl>
                  <dl className="w-cv-kolom">
                    <div>
                      <dt>voor de klas</dt>
                      <dd>7 jaar</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="w-cv-verhaal">
                {/* De eerste alinea hieronder stond op de laatste bladzijde van
                   het schrift en was daarvóór al goedgekeurd in het oude
                   makersblok; die is niet herschreven, alleen verplaatst naar
                   de plek waar hij zonder klik te lezen is. De koppen en de
                   tweede alinea zijn 5-8 door de eigenaar bijgestuurd. */}
                {/* De kop is die van de eigenaar zelf (5-8). Hij stond er als
                   "Waarom Avinka bestaat" — dat gaat over het product, en dit
                   blok gaat over de maker. Niet terugdraaien naar de
                   product-formulering. */}
                <h3 className="w-cv-sectiekop">Waarom ik Avinka heb gebouwd</h3>
                {/* ⚠️ HET TWEEDE DEEL IS 5-8 VERVANGEN. Er stond "laten zien
                   dat slimmer werken juist eenvoudig kan zijn"; eigenaar: "de
                   eerste zin is goed, tweede beetje meh". Hij koos uit drie
                   richtingen (van-mij-naar-iedereen, een standpunt over het
                   vak, of wat het de lezer oplevert) voor het STANDPUNT.
                   Dat is dus geen toevallige formulering maar een keuze: dit
                   deel gaat bewust over het vak en niet over de winst voor de
                   lezer — die staat al in de handgeschreven regel ernaast en
                   in de belofte bovenaan de pagina. */}
                {/* ⚠️ HIER STOND EEN MARKEERSTIFTHAAL over "het zwaarste
                   deel". Weg op verzoek: "die markeerstift mag weg, heel raar".
                   🔑 En de redenering waarmee ik hem erin zette, klopte niet —
                   niet herhalen. Ik dacht: de markeerstift in "Herken je dit?"
                   is het enige stuk vormgeving waarvan de eigenaar ooit zei "ik
                   vind dit leuk", dus die hoort hier ook. Maar dáár streept een
                   hele sectiekop zichzelf aan terwijl je scrollt — dat is een
                   gebeurtenis. Een stilstaand groen blokje achter drie woorden
                   in een alinea is iets heel anders: dat leest niet als een
                   stift maar als een gemarkeerd stuk tekst in een document.
                   Een motief overnemen is niet hetzelfde als hetzelfde effect
                   krijgen; de schaal en de beweging horen erbij. */}
                <p>
                  Wat begon als een oplossing voor mijn eigen werk, werd een
                  bredere missie: het werk na schooltijd hoort niet het zwaarste
                  deel van het vak te zijn.
                </p>
                {/* ⚠️ HIER STOND ALLEEN "Geen ingewikkelde techniek, wel
                   zorgvuldig met de gegevens van je leerlingen." De eigenaar
                   wil dit blok meer de kant op van "leerkrachten helpen om werk
                   na schooltijd efficiënter te doen" (5-8). Die richting staat
                   nu vooraan; de oude zin is er niet uit gegooid maar erachter
                   gezet, want daar zit de enige privacy-belofte van dit blok in.
                   🔑 In de IK-vorm, en dat is geen stijlkeuze. De inleiding
                   links zegt bijna hetzelfde ("Avinka is gebouwd om leerkrachten
                   te helpen met het werk dat na schooltijd blijft liggen"), maar
                   die gaat over het PRODUCT. Onder de kop "Waar ik voor sta"
                   hoort een persoon te staan, anders staat dezelfde zin twee
                   keer op dezelfde pagina in ander lettertype. */}
                <h3 className="w-cv-sectiekop">Waar ik voor sta</h3>
                <p>
                  Ik wil leerkrachten helpen om het werk na schooltijd
                  efficiënter te doen. Zonder ingewikkelde techniek, en
                  zorgvuldig met de gegevens van je leerlingen.
                </p>
                {/* ⚠️ HIER STOND EEN DERDE BLOK ("Waar het heen gaat"), tekst
                   van mij. Eruit toen het document weer naast de tekst moest
                   passen: het kostte 110px hoogte en dat is precies wat er niet
                   is. Het zei bovendien in andere woorden hetzelfde als de
                   inleiding links ("ik doe aanpassingen op basis van eigen
                   ervaringen, maar sta graag open voor alle feedback"), dus er
                   ging geen informatie verloren.
                   🔑 Als er ooit een derde blok bij moet: dan moet er ook een
                   ander blok uit, of het document past niet meer. */}
              </div>

            </article>
        </div>
        </div>
      </div>

      {/* ⚠️ In dit stijlblok mag geen accent-aanhalingsteken staan, ook niet
         in een opmerking: dat sluit de tekst van het blok af en dan valt de
         hele pagina om. Dat is hier één keer gebeurd. */}
      <style>{`
        /* ── de rij: tekst links, document rechts ──
           ⚠️ DIT IS ÉÉN KEER OVER DE VOLLE BREEDTE GEPROBEERD (document van
           46rem onder de kop) en dat werd meteen afgekeurd: "ik vind hem nu
           alsnog een hele grote kaart". Terug naast de tekst dus, zoals het
           schrift stond.
           🔑 De prijs daarvan is dat het document LAAG moet blijven, want
           naast een tekstkolom van ~260px mag er geen voorwerp van 600px
           staan. Dat is de reden dat de handgeschreven zin naar links is
           verhuisd en dat de personalia een strook zijn in plaats van een
           kolom — geen smaak, maar hoogte.

           ⚠️ Ooit boven uitgelijnd i.p.v. gecentreerd, omdat het document toen
           het kleine schriftje was: met align-items:center zweefde de kop
           halverwege een véél te laag object en leek het of de twee helften
           niets met elkaar te maken hadden. Nu het document de volle CV-kaart
           is (vergelijkbare hoogte als de tekstkolom), speelt dat niet meer —
           eigenaar bevestigde 6-8 dat het de kleinere schriftje-hoogte was,
           niet een principiële afkeuring van centreren zelf. */
        .w-mkr-rij {
          display: grid;
          gap: clamp(28px, 4vw, 56px);
          align-items: center;
        }
        @media (min-width: 900px) {
          .w-mkr-rij { grid-template-columns: minmax(0, 1fr) 32rem; }
        }
        .w-mkr-tekst { max-width: 42ch; }
        /* ⭐ OP EEN TELEFOON KOMT HET CV TUSSEN DE INLEIDING EN DE UITNODIGING.
           De eigenaar: op pc klopt het, want links de tekst en rechts het CV,
           naast elkaar. Onder elkaar niet, en dat is meer dan smaak — het maakt
           de VOLGORDE onlogisch. Je las eerst de inleiding, dan "laat me weten
           wat je ervan vindt" met een mailadres, en pas dáárna wie die "me" dan
           is. De uitnodiging kwam dus vóór de voorstelling.
           Nu: kop, inleiding, het CV, en dan pas de uitnodiging met het adres.
           Dat is de volgorde van een echte kennismaking, en het zet het adres
           bovendien onderaan de sectie waar het als afsluiter werkt.

           🔑 Bewust GEEN nieuw mechaniek hier. Bij dit blok zijn al drie dingen
           afgekeurd (het schrift, de 3D-kanteling, de losse kaartindelingen) en
           de les daarvan was steeds dezelfde: het effect wérkte, het hoorde
           alleen niet bij een pagina die verder plat is. Een andere volgorde is
           geen effect.

           ⚠️ "display: contents" op de tekstkolom laat die kolom zelf uit de
           opmaak verdwijnen, zodat kop, inleiding, uitnodiging en adres directe
           kinderen van het raster worden en dus los te nummeren zijn. De
           row-gap gaat daarom op 0: anders komt die tussen álle vier te staan
           en zou elk element zijn eigen marge kwijtraken aan een dubbele
           tussenruimte. Het CV krijgt zijn afstand met een eigen marge.

           ⚠️⚠️ GEEN BACKTICKS IN DIT COMMENTAAR. Deze hele stijlblok staat in
           een template-string; één backtick sluit hem en de pagina valt om. Ik
           ben er zojuist weer ingetrapt — het stond in mijn aantekeningen én er
           staat verderop in dit bestand een waarschuwing over. */
        @media (max-width: 639px) {
          .w-mkr-rij { row-gap: 0; }
          .w-mkr-tekst { display: contents; }
          .w-mkr-kop { order: 1; }
          .w-mkr-inleiding { order: 2; }
          .w-cv { order: 3; margin-top: clamp(26px, 7vw, 38px); }
          .w-mkr-belofte { order: 4; margin-top: clamp(26px, 7vw, 38px); }
          .w-mkr-contact { order: 5; }
        }
        /* De handgeschreven uitnodiging onder de inleiding. Groter dan de
           lopende tekst, maar in handschrift en niet in de display-letter:
           grote display-regels in deze kolom zijn eerder afgekeurd met "een
           tweede titel, lelijk". */
        /* ⚠️ Stond op clamp(1,15rem, 1,9vw, 1,4rem) = 22,4px, en dat was de
           enige handgeschreven regel op de pagina met een eigen maat: de andere
           uitspraken staan op 24 en de aanwijzingen op 20. Maat komt nu van
           HAND_REGEL; hier blijft wat eigen is aan deze plek. */
        .w-mkr-belofte {
          margin: clamp(20px, 2.6vw, 28px) 0 0;
          max-width: 30ch;
          font-family: var(--font-hand), "Segoe Script", cursive;
          color: ${KOP};
        }
        /* ── het pijltje en het adres ──
           Ze staan ingesprongen en iets lager dan de uitnodiging, zodat ze in
           de lege ruimte onder deze kolom vallen in plaats van er strak
           tegenaan te plakken. De uitlijning is op de ONDERkant: het pijltje
           eindigt rechtsonder, en daar begint het adres. */
        .w-mkr-contact {
          display: flex;
          align-items: flex-end;
          gap: 0.6rem;
          margin-top: clamp(12px, 1.8vw, 20px);
          margin-left: clamp(20px, 5vw, 72px);
        }
        /* De verhouding volgt de viewBox (38 bij 34): de pijl daalt eerst en
           gaat dan pas opzij, dus hij is bijna net zo hoog als breed.
           ⚠️ DE ONDERMARGE IS GEMETEN, NIET GEKOZEN. De punt van de pijl ligt
           niet op de onderrand van het vakje maar op y=27 van de 34 — dus zo'n
           7px daarboven. Lijn je het vakje onderaan uit met de link, dan komt de
           punt onder de tekst uit; dat stond er 5px naast. Deze marge duwt hem
           die 5px omhoog, zodat de punt precies op het midden van
           info@avinka.nl wijst.
           🔑 Verander je de maat van de pijl of de tekengrootte van het adres,
           meet dit dan opnieuw: het is een verhouding tussen twee dingen, geen
           vaste waarde. */
        .w-mkr-pijl {
          flex: none;
          width: 2.45rem;
          height: 2.2rem;
          margin-bottom: 0.42rem;
          color: ${KOP};
        }
        /* Het adres in dezelfde hand als de uitnodiging — alsof iemand het voor
           je opschrijft — met het envelopje ervoor. */
        /* Het adres is een aanwijzing en geen uitspraak, dus het staat op de
           kleinere van de twee handschriftmaten (HAND_WENK) — net als "sleep de
           rij opzij" en "klik op een foto". */
        .w-mkr-mail {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-family: var(--font-hand), "Segoe Script", cursive;
          color: ${KOP};
          transition: color 0.2s ease;
        }
        .w-mkr-envelop {
          flex: none;
          width: 1.15rem;
          height: 1.15rem;
        }
        /* De onderstreping los van de letters (offset), anders loopt hij door
           de staarten van de g en de j. Handschrift alleen is geen aanwijzing
           dat je ergens op kunt klikken, en dit is de enige link in de sectie. */
        .w-mkr-mail span {
          text-decoration: underline;
          text-decoration-thickness: 1.5px;
          text-underline-offset: 5px;
        }
        .w-mkr-mail:hover { color: ${DONKER}; }
        .w-mkr-mail:focus-visible {
          outline: 2px solid var(--color-brand, #2f9e6e);
          outline-offset: 4px;
          border-radius: 0.5rem;
        }
        /* ⚠️ De maat staat NIET meer hier maar in KOP_SECTIE bovenaan dit
           bestand — deze kop stond op clamp(1.9rem, 3.6vw, 2.75rem) en dat was
           net niet gelijk aan de andere sectiekoppen. Hier blijft alleen wat
           eigen is aan déze plek: de kleur en de marge eronder. */
        .w-mkr-kop {
          margin-bottom: clamp(14px, 1.8vw, 20px);
          color: ${DONKER};
        }
        /* De eerste alinea na de kop hoeft geen extra ruimte: de kop heeft
           zijn eigen marge al. */
        /* ⚠️ Stond op 1,05rem/1,7 (16,8px) terwijl de beschrijving onder de
           andere sectiekoppen 18px is. Dat verschil van ruim een punt zie je
           niet als je één sectie bekijkt, maar wel als je de pagina afscrolt.
           De maat komt nu van TEKST_SECTIE, hier blijft alleen de kleur. */
        .w-mkr-inleiding {
          margin: 0;
          color: rgba(34, 28, 58, 0.78);
        }

        /* ── DE KAART ─────────────────────────────────────────────────────
           ⚠️ HIER STOND EEN HELE 3D-RUIMTE: perspectief, een gekantelde scene,
           echte randvlakken voor de dikte, twee losse vellen eronder en een
           kanteling die met de muis meedraaide. Alles eruit op verzoek
           ("haal dat 3D-gedeelte hier maar weg, ziet er niet uit").
           🔑 De les die dit blok drie rondes lang heeft geleerd: het probleem
           was nooit dat het effect niet WERKTE. Het werkte alle drie de keren.
           Het hoorde alleen niet bij een pagina die verder helemaal plat is —
           één element met een eigen ruimte staat los van de rest, hoe goed het
           op zichzelf ook is. Zet hier dus geen nieuw mechaniek in; laat de
           kaart een kaart zijn en haal het karakter uit de VORMTAAL.

           Wat er nu voor zorgt dat hij bij de rest hoort:
           - dezelfde ronding als elke andere kaart van deze wereld
             (--w-kaart-radius), dus hij verandert vanzelf mee in de themas
           - dezelfde slagschaduw (--w-kaart-schaduw) en dus dezelfde lichtval
           - de golf tussen de kopband en het papier
           - de foto in een organische vorm die door die golf heen breekt
           - een haal met de markeerstift, zoals in "Herken je dit?"
           De scheefstand van een halve graad staat op de losse eigenschap
           rotate en niet in een transform — zie de opmerking bij de opmaak. */
        .w-cv {
          position: relative;
          width: 100%;
          max-width: 32rem;
        }
        .w-cv-blad {
          position: relative;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: var(--w-kaart-radius, 2.5rem);
          background: #ffffff;
          box-shadow:
            var(--w-kaart-schaduw, -14px 36px 80px -48px rgba(23, 80, 58, 0.55)),
            0 0 0 1px rgba(34, 28, 58, 0.04);
          /* Niets op deze pagina ligt kaarsrecht; de kaarten in "Herken je dit?"
             staan om en om op 0,8 graden. Op de losse eigenschap rotate en niet
             in een transform, anders wist de reveal hem weg.
             ⚠️ Stond op -0.7deg, maar de kaart staat al rechts in de rij en
             kantelde daardoor visueel nog verder naar rechts (eigenaar 6-8:
             "kantelt naar rechts terwijl die al rechts staat"). Omgedraaid
             naar de andere kant, zodat de kanteling de positie tegenwerkt
             i.p.v. verdubbelt. */
          rotate: 0.7deg;
        }

        /* ── de kopband ──
           De ruimte onderin (padding-bottom) is voor de golf: die ligt daar
           overheen, dus tekst die er te dicht bij komt verdwijnt eronder.
           position/z-index zijn nodig omdat de foto uit deze band mag steken. */
        .w-cv-band {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: clamp(12px, 2vw, 20px);
          padding: clamp(16px, 2.4vw, 22px) clamp(20px, 2.8vw, 26px)
                   clamp(34px, 4.4vw, 44px);
          /* Terug naar KOP, op verzoek 6-8 na de mint-poging ("niet mooi").
             De letterlijke huiskleur (#2f9e6e) kan hier niet: die ligt qua
             helderheid tussen wit en donkere tekst in, dus geen van beide
             haalt op de rol-regel de 4,5:1-norm (wit: 3,36:1, donker: 2,78:1).
             KOP is wél uit dezelfde groenfamilie én leesbaar (wit erop ±6,4:1). */
          background: ${KOP};
        }
        .w-cv-naam {
          margin: 0;
          font-family: var(--font-display), Georgia, serif;
          font-weight: 900;
          letter-spacing: -0.025em;
          line-height: 1.08;
          font-size: clamp(1.3rem, 2.6vw, 1.65rem);
          color: #ffffff;
        }
        .w-cv-rol {
          margin: 0.3rem 0 0;
          font-size: 0.92rem;
          line-height: 1.35;
          /* Wit op 85% haalt op dit KOP-groen ruim boven 4,5:1 (±5,2:1). */
          color: rgba(255, 255, 255, 0.85);
        }
        /* ── de foto ──
           In de organische vorm van deze wereld (dezelfde ongelijke radii als
           de achtergrondvlakken), niet als rechthoekig pasje. Vaste maat, want
           een foto die met de kolom meerekt wordt op smalle schermen een pasje
           van niks.
           ⚠️ HIER STOND translateY(32px), waarmee de foto tot in de golf zakte
           en door de kleurgrens heen brak. Eruit op verzoek: "mijn foto moet
           ter hoogte van mijn naam, iets hoger dus". Hij staat nu gewoon
           gecentreerd naast de naam.
           🔑 De hoogte van de band verandert daar NIET van: een transform
           verschuift alleen wat je ziet, niet wat het element in de opmaak
           inneemt. De band was en blijft even hoog als de foto plus de ruimte
           voor de golf.
           z-index moet hoger dan 5 blijven: dat is de laag van de golf, en
           anders verdwijnt de onderkant van de foto eronder. */
        .w-cv-pas {
          position: relative;
          z-index: 6;
          flex: none;
          display: grid;
          place-items: center;
          width: 88px;
          height: 100px;
          overflow: hidden;
          rotate: 2.5deg;
          background: var(--color-cream, #fbf6ee);
          border: 5px solid var(--color-cream, #fbf6ee);
          border-radius: ${VLAKVORMEN.kiezel};
          box-shadow: 0 10px 20px -10px rgba(0, 0, 0, 0.6);
        }

        /* ── het lijf ── */
        /* ── de personalia-strook ──
           Een eigen band met een haarlijn eronder, zoals de personalia bovenaan
           een echt CV. Nauwelijks getint: net genoeg om als apart veld te lezen
           zonder er een gekleurd blok van te maken. */
        .w-cv-strook {
          padding: clamp(14px, 2vw, 18px) clamp(20px, 2.8vw, 26px);
          background: rgba(var(--w-schaduw-rgb, 23,80,58), 0.03);
          border-bottom: 1px solid rgba(var(--w-schaduw-rgb, 23,80,58), 0.13);
        }
        /* De feiten: label erboven, waarde eronder. Dat is de taal van een
           formulier, en dat is precies wat een CV is.
           🔑 Drie kolommen naast elkaar in plaats van een lijst onder elkaar
           scheelt ruim 140px hoogte, en die hoogte is hier het hele probleem
           (zie .w-mkr-rij).
           De middelste kolom krijgt iets meer breedte: daar staat de langste
           waarde (de schoolnaam), en in een gelijke derde liep die om. */
        .w-cv-feiten {
          display: grid;
          grid-template-columns: 0.85fr 1.3fr 0.85fr;
          gap: clamp(10px, 1.6vw, 16px);
          margin: 0;
        }
        /* Elke kolom is een eigen lijstje en bepaalt dus zijn eigen hoogte. */
        .w-cv-kolom {
          display: flex;
          flex-direction: column;
          gap: clamp(10px, 1.4vw, 13px);
          margin: 0;
        }
        .w-cv-feiten dt {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          /* ⚠️ GEMETEN, NIET GESCHAT. Op 0,58 dekking haalde dit label 3,99:1
             op het papier en dat is onder AA — ik had er 4,6 bij geschreven
             zonder het na te rekenen. Op 0,70 en 11,2px is het 5,8:1.
             Dit is de kleinste tekst van het hele document; ga hier niet
             lichter zitten, en meet opnieuw als de papierkleur verandert. */
          color: rgba(34, 28, 58, 0.7);
        }
        .w-cv-feiten dd {
          margin: 0.18rem 0 0;
          font-size: 0.94rem;
          font-weight: 600;
          line-height: 1.35;
          color: ${DONKER};
        }
        /* Het verhaal over de volle breedte van het document: ~62 tekens per
           regel, en dat is de maat waarop lopende tekst het prettigst leest. */
        .w-cv-verhaal {
          padding: clamp(16px, 2.4vw, 22px) clamp(20px, 2.8vw, 26px)
                   clamp(20px, 2.8vw, 26px);
        }
        /* ⚠️ HIER STOND .w-cv-markeer: een groene markeerstifthaal over een
           paar woorden in het verhaal. Weg op verzoek ("heel raar"), inclusief
           de nowrap-grendel die ervoor zorgde dat hij niet over twee regels
           brak. Zie de opmerking bij de alinea in de opmaak voor waarom de
           redenering erachter niet klopte. */
        .w-cv-sectiekop {
          margin: 0 0 0.35rem;
          font-family: var(--font-display), Georgia, serif;
          font-weight: 900;
          letter-spacing: -0.015em;
          line-height: 1.2;
          font-size: 1.02rem;
          color: ${DONKER};
        }
        .w-cv-verhaal p {
          margin: 0 0 1.15rem;
          font-size: 0.95rem;
          line-height: 1.62;
          color: rgba(34, 28, 58, 0.8);
        }
        .w-cv-verhaal p:last-child { margin-bottom: 0; }

        /* ── mobiel ───────────────────────────────────────────────────────
           De kaart pakt de volle breedte en gaat recht staan. Die scheefstand
           van 0,7 graden werkt op een breed veld, maar tussen twee schermranden
           op 24px afstand leest hij als een fout in plaats van als losheid. */
        @media (max-width: 639px) {
          .w-cv { max-width: none; }
          .w-cv-blad { rotate: none; }
          /* De foto een maatje kleiner, anders houdt de naam er te weinig
             breedte naast over en breekt "Michael van Spanje" over twee
             regels — een naam hoort op één regel te staan. */
          .w-cv-pas { width: 72px; height: 82px; }
          /* Twee kolommen in plaats van drie: op 390px is een derde van de
             breedte ~100px en dan loopt zowel het label als de waarde eronder
             om. De derde kolom ("voor de klas") zakt naar de tweede rij. */
          .w-cv-feiten { grid-template-columns: repeat(2, minmax(0, 1fr)); }
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
      {/* Telefoonversie. Het donkergroene slotveld is het donkerste vlak van de
         pagina, dus hier is wit-op-5% precies genoeg: meer zou een vlek worden. */}
      <KaartVlak
        kleur="rgba(255,255,255,0.05)"
        vorm="schelp"
        breedte={340}
        hoogte={205}
        style={{ left: "-28%", bottom: 45, transform: "rotate(-9deg)" }}
        className="lg:hidden"
        tel={2}
      />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-32 pt-36 text-center">
        <Confetti punten={[{ x: "16%", y: "18%", r: 4, amber: true }, { x: "82%", y: "12%", r: 5 }, { x: "90%", y: "70%", r: 4, amber: true }]} />
        {/* Hier stond een wit vierkant met het merkvinkje boven de slotkop.
           Eruit op verzoek; de kop begint nu meteen. */}
        <h2 data-reveal className={`${KOP_GROOT} text-white`}>
          Kom binnen. Je werkplek staat klaar.
        </h2>
        {/* ⚠️ Hier stond de 7 met de hand ingetypt, terwijl de drie andere
           plekken die de proefperiode noemen (de eindkaart van de tools-rij, de
           prijzensectie en de vraag "Hoe werkt de gratis proefperiode?") hem uit
           PROEF_DAGEN halen. Eén hardgecodeerd getal tussen drie afgeleide is
           precies hoe een pagina zichzelf later tegenspreekt: verandert de
           proefduur, dan blijft alleen deze zin op 7 staan. */}
        <p data-reveal className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/75">
          {PROEF_DAGEN} dagen gratis proberen, zonder betaalgegevens vooraf.
        </p>
        <div data-reveal className="mt-9">
          <BlobKnop href="/sign-up" variant="wit">Probeer Avinka gratis</BlobKnop>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";

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

const MINT = "#cfe6d8";
const MINT_DIEP = "#b5d8c4"; // silhouetten op mint
const DONKER = "#17503a"; // slotveld + sticker
const KOP = "#1e6b4d"; // koppen op licht veld (het "getinte" groen)

/* Gespikkeld papier: kleine groene + amberen spikkels op bijna-wit. */
export const SPECKLE_STIJL: CSSProperties = {
  backgroundColor: "#fcfbf7",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='190' height='190'%3E%3Cg fill='%232f9e6e' opacity='0.11'%3E%3Ccircle cx='12' cy='20' r='1.6'/%3E%3Ccircle cx='48' cy='8' r='1.1'/%3E%3Ccircle cx='92' cy='30' r='1.7'/%3E%3Ccircle cx='142' cy='14' r='1.2'/%3E%3Ccircle cx='176' cy='44' r='1.4'/%3E%3Ccircle cx='26' cy='72' r='1.3'/%3E%3Ccircle cx='72' cy='58' r='1.6'/%3E%3Ccircle cx='120' cy='78' r='1.1'/%3E%3Ccircle cx='162' cy='94' r='1.5'/%3E%3Ccircle cx='8' cy='120' r='1.4'/%3E%3Ccircle cx='54' cy='134' r='1.7'/%3E%3Ccircle cx='98' cy='114' r='1.2'/%3E%3Ccircle cx='138' cy='146' r='1.4'/%3E%3Ccircle cx='178' cy='128' r='1.1'/%3E%3Ccircle cx='30' cy='168' r='1.5'/%3E%3Ccircle cx='86' cy='160' r='1.3'/%3E%3Ccircle cx='128' cy='176' r='1.6'/%3E%3C/g%3E%3Cg fill='%23f59e0b' opacity='0.09'%3E%3Ccircle cx='66' cy='28' r='1.3'/%3E%3Ccircle cx='152' cy='62' r='1.4'/%3E%3Ccircle cx='20' cy='98' r='1.2'/%3E%3Ccircle cx='112' cy='142' r='1.5'/%3E%3Ccircle cx='58' cy='100' r='1.1'/%3E%3C/g%3E%3C/svg%3E")`,
};

/* Witte kaart met grote ronding: dé kaartvorm van deze wereld. */
const KAART =
  "rounded-[2.5rem] bg-white shadow-[0_36px_80px_-48px_rgba(23,80,58,0.55)] ring-1 ring-ink/[0.04]";

/* ── Golf-overgang tussen twee kleurvelden ── */
function Golf({ kleur, flip = false }: { kleur: string; flip?: boolean }) {
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
        className="block h-[60px] w-full sm:h-[96px]"
        style={flip ? { transform: "scaleY(-1)" } : undefined}
      >
        <path
          d="M0 62 C 230 108, 500 16, 760 46 C 1000 74, 1240 112, 1440 54 L1440 111 L0 111 Z"
          fill={kleur}
        />
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

function SilhouetPotlood({ kleur, style, tel, className }: { kleur: string; style: CSSProperties; tel?: number; className?: string }) {
  return (
    <SilhouetWrap par={0.05} style={style} tel={tel} className={className}>
      <svg viewBox="0 0 120 26" className="block w-full">
        <g fill={kleur}>
          <rect x="4" y="5" width="84" height="16" rx="3" />
          <path d="M88 5 L114 13 L88 21 Z" />
          <rect x="-4" y="5" width="12" height="16" rx="5" />
        </g>
      </svg>
    </SilhouetWrap>
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
            background: p.amber ? "#f59e0b" : "#2f9e6e",
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
  href, variant = "vol", className = "", children,
}: { href: string; variant?: "vol" | "licht" | "wit"; className?: string; children: ReactNode }) {
  const stijl =
    variant === "vol"
      ? "bg-brand text-white shadow-lg shadow-brand/25 hover:bg-brand-dark"
      : variant === "wit"
        ? "bg-white shadow-lg"
        : "border-2 border-ink/10 bg-white text-ink hover:border-ink/20";
  return (
    <Link
      href={href}
      className={`blobknop inline-flex items-center justify-center gap-2.5 whitespace-nowrap px-8 py-4 text-center text-lg font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand ${stijl} ${className}`}
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

/* Muis-diepte: de inhoud schuift zachtjes mee met de cursor. Gebruikt bij de
   privacy-kaarten, waar het een functie heeft: het bewijs komt naar je toe. */
function MuisDiepte({ diep, className = "", children }: { diep: number; className?: string; children: ReactNode }) {
  return (
    <div className={`muiskaart ${className}`} style={{ "--diep": diep } as CSSProperties}>
      {children}
    </div>
  );
}

/* Kleine school-vormpjes voor op het papier: net als de grote silhouetten,
   maar lichter van toon en bescheidener. */
function SilhouetGum({ kleur, style, tel, className }: { kleur: string; style: CSSProperties; tel?: number; className?: string }) {
  return (
    <SilhouetWrap par={0.05} style={style} tel={tel} className={className}>
      <svg viewBox="0 0 120 54" className="block w-full">
        <rect x="2" y="6" width="116" height="42" rx="14" fill={kleur} />
        <rect x="2" y="6" width="44" height="42" rx="14" fill={kleur} opacity="0.55" />
      </svg>
    </SilhouetWrap>
  );
}

function SilhouetBoek({ kleur, style, tel, className }: { kleur: string; style: CSSProperties; tel?: number; className?: string }) {
  return (
    <SilhouetWrap par={0.04} style={style} tel={tel} className={className}>
      <svg viewBox="0 0 140 84" className="block w-full">
        <path d="M70 12 C 50 2, 20 2, 6 10 L6 72 C 20 64, 50 64, 70 74 C 90 64, 120 64, 134 72 L134 10 C 120 2, 90 2, 70 12 Z" fill={kleur} />
        <path d="M70 12 L70 74" stroke="#fff" strokeWidth="3" opacity="0.5" />
      </svg>
    </SilhouetWrap>
  );
}

/* Een echte gevallen verf-klodder (splat): een grillig, onregelmatig silhouet
   met uitlopers/vingers én een paar losse satelliet-druppels eromheen, alsof
   er een klodder verf op het papier is gevallen. De vorm wordt deterministisch
   gegenereerd uit `seed` (deterministische ruis via sin, dus geen Math.random →
   geen hydration-mismatch), zodat elke klodder uniek maar reproduceerbaar is.
   De randen worden met een gesloten Catmull-Rom-spline vloeiend gemaakt. */
function SilhouetSplat({
  kleur, seed = 0, punten = 20, plat = 0.7, style, tel, className,
}: { kleur: string; seed?: number; punten?: number; plat?: number; style: CSSProperties; tel?: number; className?: string }) {
  // Vorm rond de oorsprong (0,0); `plat` drukt de Y in zodat de klodder
  // breder-dan-hoog wordt. De viewBox wordt exact op de vorm gezet, zodat de
  // gerenderde hoogte voorspelbaar ≈ breedte × plat is (nette plaatsing,
  // geen afsnijding bij sectiegrenzen).
  const N = punten, base = 118;
  const rawPts: Array<[number, number]> = [];
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2;
    let r = base * (1 + 0.30 * Math.sin(i * 1.3 + seed) + 0.17 * Math.sin(i * 2.7 + seed * 1.7) + 0.1 * Math.sin(i * 4.1 + seed * 0.6));
    // af en toe een langere "vinger" waar de verf is uitgelopen
    if ((i + Math.round(seed * 3)) % 6 === 0) r *= 1.52;
    rawPts.push([r * Math.cos(ang), r * Math.sin(ang)]);
  }
  const rawDrops: Array<[number, number, number]> = [];
  for (let k = 0; k < 4; k++) {
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

/* ── Confetti: een paar losse stipjes rond een blok ── */
function Confetti({ punten }: { punten: Array<{ x: string; y: string; r?: number; amber?: boolean }> }) {
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
            background: p.amber ? "#f59e0b" : "#2f9e6e",
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
      .blobknop { border-radius: 2.1rem 1.3rem 2.2rem 1.4rem; transition: border-radius .45s cubic-bezier(.2,.7,.2,1), transform .2s ease, background-color .2s ease, box-shadow .2s ease; }
      .blobknop:hover { border-radius: 1.3rem 2.2rem 1.4rem 2.1rem; transform: translateY(-2px) rotate(-0.6deg); }
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
    // overflow-x-clip (i.p.v. -hidden): horizontaal netjes geclipt, maar de
    // verf-klodder mag verticaal naar boven uitsteken in de papieren
    // ademruimte erboven (naadloos, zelfde papier) zodat hij groter kan.
    <section className="relative overflow-x-clip">
      {/* De verf-klodder ligt onder de RECHTER tekst; de schoolgerei-icoontjes
         staan links. (Omgewisseld t.o.v. de standaard-opzet.) */}
      <SilhouetSplat kleur="#d3e5da" seed={9.2} plat={0.9} style={{ width: 520, right: "1%", top: -72, transform: "rotate(5deg)" }} className="hidden lg:block" tel={1} />
      <SilhouetGum kleur="#dcebe2" style={{ width: 130, left: "4%", top: 40, transform: "rotate(14deg)" }} tel={2} />
      <SilhouetBoek kleur="#e9e2cf" style={{ width: 170, left: "10%", bottom: 52, transform: "rotate(-8deg)", opacity: 0.8 }} />

      <div className="relative mx-auto grid w-full max-w-5xl gap-10 px-6 pb-24 pt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pb-32 lg:pt-24">
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
        <div className="max-w-xl lg:pt-2">
          <p data-reveal className="text-lg leading-8 text-ink/75">
            Avinka brengt de hulpmiddelen voor je schoolwerk samen in één
            omgeving. Je geeft aan wat je nodig hebt en Avinka helpt je met de
            uitwerking, zodat terugkerende taken minder tijd kosten en je werk
            overzichtelijk blijft.
          </p>
        </div>
      </div>
    </section>
  );
}

/* 2. Herken je dit? Mint-veld, drie witte kaarten die trapsgewijs hangen,
   groot potlood-silhouet als ons palmblad. */
const PIJN = [
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
    <section className="relative overflow-hidden" style={{ background: MINT }}>
      <Golf kleur="#fcfbf7" flip />
      <SplatVeld
        className="z-[6]"
        items={[
          { kleur: "#e6d9bd", seed: 6.7, plat: 0.92, style: { width: 440, right: "-10%", bottom: 48, transform: "rotate(-8deg)" }, tel: 4 },
          { kleur: "#a6ccb7", seed: 2.4, plat: 0.86, style: { width: 700, left: "45%", top: 170, transform: "rotate(4deg)" }, tel: 2 },
          { kleur: "#98c1a9", seed: 3.9, plat: 0.92, style: { width: 420, left: "-21%", bottom: 100, transform: "rotate(5deg)" }, tel: 1 },
        ]}
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
            <p
              data-reveal
              className="mt-6 text-2xl leading-snug lg:sticky lg:top-60"
              style={{ fontFamily: "var(--font-hand)", color: KOP }}
            >
              het hoort bij het werk.
              <br />
              maar het kan met minder gedoe.
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
      <Golf kleur="#fcfbf7" />
    </section>
  );
}

/* 4. Privacy: mint-veld met vliegtuig-silhouet; één sterke witte kaart met
   de klassenlijst-maskering + een klein overlappend bewaar-kaartje. */
const KLAS = ["Sofie", "Daan", "Iris", "Mees", "Noor"];

export function WereldPrivacy() {
  return (
    <section className="relative overflow-hidden" style={{ background: MINT }}>
      <Golf kleur="#fcfbf7" flip />
      <SilhouetVliegtuig kleur={MINT_DIEP} style={{ width: 380, right: -60, top: 135, transform: "rotate(10deg)" }} />
      <SilhouetVliegtuig kleur={MINT_DIEP} style={{ width: 150, left: "8%", bottom: 150, transform: "rotate(-16deg)", opacity: 0.6 }} tel={1} />
      {/* een klein vliegtuigje glijdt heel traag door het veld */}
      <span className="pointer-events-none absolute left-[6%] top-[16%] hidden lg:block" aria-hidden>
        <span className="wereld-vlucht block opacity-70">
          <svg viewBox="0 0 100 92" style={{ width: 44 }}>
            <g fill={MINT_DIEP}>
              <path d="M0 44 L100 0 L47 54 Z" />
              <path d="M47 58 L98 6 L58 90 L42 66 Z" />
            </g>
          </svg>
        </span>
      </span>
      <Drijvers punten={[{ x: "22%", y: "78%", tel: 1 }, { x: "70%", y: "86%", amber: true, tel: 3 }]} />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-32 pt-32 lg:pb-40 lg:pt-40">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-20">
          {/* de teksten: bekentenis + hoe het werkt */}
          <div className="max-w-xl">
            <p data-reveal className="text-2xl" style={{ fontFamily: "var(--font-hand)", color: KOP }}>
              privacy voorop
            </p>
            <h2
              data-reveal
              className="mt-2 font-display text-[clamp(2.25rem,4vw,3.5rem)] font-black leading-[1.02] tracking-tight [text-wrap:balance]"
              style={{ color: DONKER }}
            >
              Er is één ding dat we bewust niet doen.
            </h2>
            <p data-reveal style={{ transitionDelay: "90ms" }} className="mt-7 text-xl leading-9 text-ink/75">
              Gegevens van leerlingen bewaren we niet. Het staat bij jou en
              niet bij ons. En namen van leerlingen gaan nooit naar de AI: op
              jouw apparaat wordt elke naam vervangen door een schuilnaam, nog
              vóór er iets wordt verstuurd.
            </p>
            <p data-reveal className="mt-5 text-xl font-bold leading-9" style={{ transitionDelay: "160ms", color: DONKER }}>
              Onhandig? Soms. Maar privacy weegt voor ons het zwaarst.
            </p>
          </div>

          {/* het bewijs: de klassenlijst als vriendelijke blob-kaart met een
             mint kopband en gekleurde schuilnaam-chips, het bewaar-lijstje
             als geel post-it dat er schuin onderuit steekt. De hele stapel
             beweegt zachtjes mee met de muis: het bewijs komt naar je toe. */}
          <MuisDiepte diep={14} className="relative mx-auto w-full max-w-md sm:pb-24">
            <Confetti punten={[{ x: "-7%", y: "5%", r: 5 }, { x: "104%", y: "26%", r: 4, amber: true }, { x: "-4%", y: "72%", r: 3, amber: true }]} />

            <div
              data-reveal
              className="relative z-10 overflow-hidden bg-white shadow-[0_36px_80px_-48px_rgba(23,80,58,0.55)] ring-1 ring-ink/[0.04]"
              style={{ borderRadius: "2.6rem 3.4rem 2.9rem 3.6rem" }}
            >
              {/* donkergroene kopband, zoals de stevige kaartkoppen van de referentie */}
              <div className="flex items-center justify-between px-8 py-5" style={{ background: DONKER }}>
                <p className="font-display text-xl font-black tracking-tight text-white">Groep 5</p>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
                  {KLAS.length + 19} leerlingen
                </span>
              </div>
              <div className="p-7 pt-5">
                <div className="flex items-end gap-3 text-[0.6rem] font-bold uppercase tracking-[0.14em]">
                  <span className="flex-1 text-ink/45">Op jouw apparaat</span>
                  <span className="shrink-0" style={{ color: KOP }}>De AI ziet</span>
                </div>
                <ul className="mt-3 space-y-2">
                  {KLAS.map((naam, i) => (
                    <li key={naam} className="flex items-center gap-3 rounded-full px-4 py-2" style={{ background: i % 2 ? "#f5f9f4" : "#fbf8ef" }}>
                      <span className="flex-1 font-semibold text-ink">{naam}</span>
                      <svg width="20" height="12" viewBox="0 0 20 12" fill="none" aria-hidden>
                        <path d="M1 6h15m0 0l-4-4m4 4l-4 4" stroke={KOP} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                      </svg>
                      <span
                        className="rounded-full px-3 py-1 text-sm font-bold"
                        style={i % 2 ? { background: "#fdf3c4", color: "#8a6d1a" } : { background: "#dff0e6", color: KOP }}
                      >
                        leerling {String.fromCharCode(65 + i)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 pl-4 text-xs text-ink/50">en 19 anderen, allemaal gemaskeerd</p>
              </div>

              {/* stempel op de hoek */}
              <span
                className="absolute right-5 top-[4.6rem] rotate-[7deg] rounded-xl border-[3px] px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em]"
                style={{ borderColor: KOP, color: KOP, background: "#ffffffd9" }}
              >
                ✓ gemaskeerd
              </span>
            </div>

            {/* het bewaar-lijstje: een geel post-it, schuin eronder */}
            <div
              data-reveal
              style={{ transitionDelay: "140ms", background: "#fdf3c4", borderRadius: "4px 22px 18px 20px" }}
              className="relative z-20 mt-5 w-full rotate-0 p-6 shadow-[0_28px_55px_-30px_rgba(23,80,58,0.5)] sm:absolute sm:-bottom-8 sm:-right-16 sm:mt-0 sm:w-60 sm:rotate-[3deg]"
            >
              <p className="text-lg leading-tight text-ink/85" style={{ fontFamily: "var(--font-hand)" }}>wat we bewaren:</p>
              <ul className="mt-2 space-y-1">
                {["lesontwerpen", "werkbladen", "draaiboeken"].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-lg text-ink/85" style={{ fontFamily: "var(--font-hand)" }}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke={KOP} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-2.5 text-lg leading-tight text-ink/85" style={{ fontFamily: "var(--font-hand)" }}>
                en <span className="underline decoration-wavy decoration-2" style={{ textDecorationColor: KOP }}>geen</span> leerlinggegevens
              </p>
            </div>
          </MuisDiepte>
        </div>
      </div>
      {/* Geen golfrand hier: de mint loopt bewust door in de regie-sectie
         hieronder, tot halverwege de drie kaartjes. De golf-overgang naar
         papier gebeurt daar. */}
    </section>
  );
}

/* 5. Regie: drie kleine witte kaarten op het papier, licht gedraaid. */
const REGIE = [
  { titel: "Jij beslist", tekst: "Avinka schrijft de voorzet, jij beslist. Niets gaat zonder jou de deur uit." },
  { titel: "Altijd bij te sturen", tekst: "Elke tekst is een voorstel. Aanpassen, inkorten of opnieuw laten schrijven kan met één klik, net zo makkelijk als een mailtje typen." },
  { titel: "De cijfers kloppen altijd", tekst: "Die berekent de tool zelf. De AI schrijft alleen de tekst eromheen en verzint nooit getallen of feiten." },
];

export function WereldRegie() {
  /* Geen verschijn-effecten hier: de kaarten en de verf-klodders staan
     gewoon meteen op hun plek (de eerdere splash-dan-val-choreografie voelde
     te onrustig). Alleen de rustige, wereld-brede ambient-wieg blijft. */

  /* Drie beloftes als speelse, licht gedraaide blob-kaarten: elk een eigen
     zachte kleur, een script-woord erboven en een eigen hoekje-detail. */
  /* Alle drie wit; het verschil zit nu in de VORM. Elk kaartje is een eigen
     organische kei via asymmetrische 8-waarden-radii, met een tonale rand
     met body en een verticale stagger zodat de rij speels golft. */
  const RAND = "#d4e5dc";
  const SCHADUW = "0 34px 66px -34px rgba(23,80,58,0.6)";
  /* badgeLeft = precies de x-positie (% vanaf links) waar de twee boven-
     hoeken van elke blob elkaar raken, dus de echte "piek" van de vorm —
     berekend uit de eerste twee radius-waarden (top-links / top-rechts).
     Het vinkje-badge staat daar gecentreerd op, zodat het altijd op de rand
     zit in plaats van erboven te zweven. */
  const STIJLEN = [
    { rot: -2.2, radius: "58% 42% 48% 52% / 54% 46% 54% 46%", script: "jij hebt de regie", mt: "lg:mt-10", pad: "px-9 py-12 lg:px-10 lg:py-14", minh: "min-h-[18rem] lg:min-h-[22rem]", badgeLeft: "58%" },
    { rot: 1.6, radius: "42% 58% 58% 42% / 46% 44% 56% 54%", script: "niks staat vast", mt: "lg:mt-0", pad: "px-10 py-14 lg:px-12 lg:py-16", minh: "min-h-[21rem] lg:min-h-[25rem]", badgeLeft: "42%" },
    { rot: -1.1, radius: "52% 48% 42% 58% / 56% 42% 58% 44%", script: "beloofd", mt: "lg:mt-14", pad: "px-9 py-12 lg:px-10 lg:py-14", minh: "min-h-[18rem] lg:min-h-[22rem]", badgeLeft: "52%" },
  ];
  return (
    <section className="relative overflow-x-clip">
      {/* De mint-achtergrond van de privacysectie hierboven loopt hier door
         tot halverwege de kaartjes: een vol-breed mintvlak over de bovenste
         helft van de sectie, met de golf-overgang naar papier precies op de
         halve hoogte. Omdat de sectie symmetrische verticale padding heeft,
         valt die halve hoogte samen met het midden van de kaartjesrij (en op
         mobiel met het midden van de gestapelde kaartjes). */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bottom-1/2 overflow-hidden" aria-hidden>
        <div className="absolute inset-0" style={{ background: MINT }} />
        <Golf kleur="#fcfbf7" />
      </div>

      {/* Twee grote, grillige verf-klodders (splats) — alsof er echt een paar
         klodders op het papier zijn gevallen: onregelmatige randen, uitlopers
         en losse satelliet-druppels. Groot en speels; deels achter/onder de
         kaarten vandaan. Eén tint-op-tint groen (linksboven, op de mint), één
         warm zand-getint (rechtsonder, deels onder de kaarten op het papier).
         Mobiel: verborgen. */}
      <SilhouetSplat kleur="#a6ccb7" seed={1.2} plat={0.88} style={{ width: 600, left: "-6%", top: -60, transform: "rotate(-4deg)" }} className="z-[6] hidden lg:block" tel={2} />
      <SilhouetSplat kleur="#e7dcc2" seed={4.8} plat={0.9} style={{ width: 540, right: "-6%", top: -30, transform: "rotate(7deg)" }} className="z-[6] hidden lg:block" tel={5} />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-10 pb-16 lg:pt-12 lg:pb-20">
        <Confetti punten={[{ x: "0%", y: "8%", r: 4, amber: true }, { x: "99%", y: "84%", r: 4 }, { x: "52%", y: "-2%", r: 3 }]} />
        <div className="grid items-start gap-8 md:grid-cols-3">
        {REGIE.map((kaart, i) => {
          const s = STIJLEN[i];
          return (
            <div
              key={kaart.titel}
              style={{
                rotate: `${s.rot}deg`,
                background: "#ffffff",
                borderRadius: s.radius,
                borderColor: RAND,
                boxShadow: SCHADUW,
              }}
              className={`relative flex flex-col items-center justify-center text-center border-[2.5px] ${s.pad} ${s.minh} ${s.mt} transition-transform duration-300 hover:-translate-y-1.5 hover:rotate-0`}
            >
              {/* Het vinkje-badge staat precies op de piek van de blob (waar
                 de twee bovenhoek-radii samenkomen), zodat het altijd op de
                 rand zit in plaats van los erboven te zweven. */}
              <span
                className="absolute flex h-9 w-9 items-center justify-center rounded-2xl bg-brand shadow-md"
                style={{ left: s.badgeLeft, top: -16, transform: "translate(-50%, 0) rotate(8deg)" }}
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
              </span>
              <p className="text-xl" style={{ fontFamily: "var(--font-hand)", color: KOP }}>{s.script}</p>
              <h3 className="mt-1 font-display text-2xl font-black tracking-tight [text-wrap:balance]" style={{ color: DONKER }}>
                {kaart.titel}
              </h3>
              <p className="mt-3 max-w-[17rem] leading-7 text-ink/70">{kaart.tekst}</p>
            </div>
          );
        })}
        </div>
      </div>
    </section>
  );
}

/* 6. De maker: mint-veld met liniaal-silhouet, één witte kaart. */
export function WereldMaker({ fotoBestand }: { fotoBestand?: string }) {
  return (
    <section className="relative overflow-hidden" style={{ background: MINT }}>
      <Golf kleur="#fcfbf7" flip />
      <SilhouetLiniaal kleur={MINT_DIEP} veld={MINT} style={{ width: 460, left: -120, top: 165, transform: "rotate(-14deg)" }} />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-32 pt-32 lg:pb-36 lg:pt-36">
        <div data-reveal className={`${KAART} relative overflow-hidden px-8 py-14 sm:px-14`}>
          <Confetti punten={[{ x: "94%", y: "10%", r: 5, amber: true }, { x: "3%", y: "88%", r: 4 }]} />
          <div className="relative flex flex-col gap-8 sm:flex-row sm:gap-12">
            <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-sm ring-4 ring-brand-soft" style={{ background: MINT }}>
              {fotoBestand ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/${fotoBestand}`} alt="Michael van Spanje" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-2xl font-black" style={{ color: DONKER }}>MvS</span>
              )}
            </span>
            <div>
              <p className="text-2xl" style={{ fontFamily: "var(--font-hand)", color: KOP }}>
                van een leerkracht, voor leerkrachten
              </p>
              <h2 className="mt-1 font-display text-3xl font-black tracking-tight [text-wrap:balance] sm:text-4xl" style={{ color: DONKER }}>
                Ik ben Michael. Net als jij sta ik voor de klas.
              </h2>
              <p className="mt-6 text-lg leading-8 text-ink/75">
                Ik weet hoeveel tijd er gaat naar rapporten, analyses en andere
                administratieve taken. Daarom ben ik begonnen met het bouwen van
                slimme hulpmiddelen die dat werk sneller en eenvoudiger maken.
                Geen ingewikkelde technologie, maar praktische tools die direct
                tijd besparen en zorgvuldig omgaan met de privacy van je
                leerlingen.
              </p>
              <p className="mt-4 text-lg leading-8 text-ink/75">
                Wat begon als een oplossing voor mijn eigen werk, groeide uit
                tot een bredere missie. Ik geloof dat leerkrachten veel meer
                voordeel kunnen halen uit de mogelijkheden van AI dan nu vaak
                gebeurt. Met Avinka wil ik laten zien dat slimmer werken juist
                eenvoudig kan zijn.
              </p>
              <p className="mt-6 text-lg font-bold leading-8 text-ink">
                Want goede leerkrachten horen hun tijd te besteden aan
                leerlingen, niet aan onnodig papierwerk.
              </p>
              <p className="mt-8 text-3xl text-ink/80" style={{ fontFamily: "var(--font-hand)" }}>Michael</p>
              <p className="text-sm text-ink/60">Leerkracht &amp; maker van Avinka</p>
            </div>
          </div>
        </div>
      </div>
      <Golf kleur="#fcfbf7" />
    </section>
  );
}

/* 7. Ervaringen: eerlijk en licht, op het papier. */
export function WereldErvaringen() {
  return (
    <section className="relative mx-auto w-full max-w-3xl px-6 py-20 text-center">
      <h2 data-reveal className="font-display text-3xl font-black tracking-tight [text-wrap:balance]" style={{ color: KOP }}>
        Wat leerkrachten zeggen
      </h2>
      <p data-reveal className="mx-auto mt-5 max-w-xl text-lg leading-8 text-ink/70">
        Deze zomer test een groep leerkrachten Avinka in de praktijk. Hun
        ervaringen komen hier te staan, in hun eigen woorden. Geen verzonnen
        quotes, dat beloven we.
      </p>
    </section>
  );
}

/* 10. Slot: het donkergroene veld, één keer op de pagina. */
export function WereldSlot() {
  return (
    <section className="relative overflow-hidden" style={{ background: DONKER }}>
      <Golf kleur="#fcfbf7" flip />
      <SilhouetVliegtuig kleur="#ffffff" style={{ width: 300, right: -40, top: 60, transform: "rotate(14deg)", opacity: 0.05 }} tel={1} />
      <SilhouetPotlood kleur="#ffffff" style={{ width: 380, left: -90, bottom: 60, transform: "rotate(-18deg)", opacity: 0.04 }} tel={2} />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-32 pt-36 text-center">
        <Confetti punten={[{ x: "16%", y: "18%", r: 4, amber: true }, { x: "82%", y: "12%", r: 5 }, { x: "90%", y: "70%", r: 4, amber: true }]} />
        <div data-reveal className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg shadow-black/20">
          <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke={DONKER} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 data-reveal className="mt-7 font-display text-[clamp(2.5rem,5.5vw,4rem)] font-black leading-[1.02] tracking-tight text-white [text-wrap:balance]">
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

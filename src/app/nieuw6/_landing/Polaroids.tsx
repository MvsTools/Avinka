"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Confetti, DONKER, Golf, HAND_WENK, KOP, KOP_SECTIE, MINT, MINT_LICHT, MINT_DIEP, KaartVlak, VLAK_MINT } from "./Wereld";

/* ── De polaroids: wat leerkrachten zeggen ─────────────────────────────────
   Ervaringen als instax-kaartjes aan één levende draad. Geen prikbord, geen
   houten knijpers: een dunne, licht doorhangende lijn (familie van de golf-
   overgangen) waar de kaartjes met een kort draadje aan hangen.

   De fysica (desktop). Kernregel: ALLEEN de kaart onder je muis beweegt.
   Kaartjes weten niets van elkaar, botsen niet, en er is geen ambient wieg
   — laat je de rij met rust, dan hangt hij volledig stil.
   - hover: het kaartje komt naar voren en volgt de kant waarop jij beweegt;
     stop je, dan zwaait het terug naar zijn eigen scheve hoek. Elk kaartje
     doet dat in zijn eigen tempo, uit zijn eigen draadlengte (zie `VEER`);
   - slepen: het kaartje schuift langs de draad mee met je muis en de draad
     zakt eronder door; loslaten laat het terugveren met een nazwaai;
   - klikken (zonder slepen): de kaart draait om en je leest de ervaring.

   De rAF-lus stopt zichzelf zodra alles is uitgezwaaid en wordt pas weer
   gewekt als je een kaart aanraakt (of bij een resize). Zolang je er niet
   bent kost deze sectie dus niets.

   Mobiel is bewust géén verkleinde desktop maar een stapel foto's in je
   hand: één grote polaroid tegelijk, omhoog vegen schuift de bovenste van
   de stapel en de volgende komt eronder vandaan; tikken draait de kaart om.

   Maten zijn die van echt instax mini-film: kaart 54×86 mm, beeld 46×62 mm
   (dunne rand van 4 mm rondom, dikke onderrand van ±20 mm).

   ⚠️ DEMO-INHOUD: de namen en quotes hieronder zijn VOORBEELDEN om het
   ontwerp te beoordelen. Vóór live gaan vervangen door echte ervaringen uit
   de zomertest — de site belooft "geen verzonnen quotes". ─────────────── */

type Kaart = {
  foto: string;
  alt: string;
  naam: string;
  rol: string;
  quote: string;
  /* het woord (of de woorden) dat op de achterkant een groen streepje krijgt */
  accent: string;
  doodle: "hart" | "ster" | "smiley";
  /* rustplek op de draad (percentage van de sectiebreedte) */
  x: number;
  /* lengte van het draadje tussen draad en kaart (px) — variatie hierin
     geeft de verschillende hoogtes uit de referentie */
  draad: number;
  /* rusthoek */
  rot: number;
};

/* x/draad/rot horen bij de POSITIE op de draad (van links naar rechts, met
   afwisselende hoogte/hoek voor het ritme), niet bij een kaart zelf — bij een
   herschikking blijven deze vijf waarden dus gewoon op hun plek staan en
   verhuist alleen de inhoud (foto/naam/quote) ernaartoe. */
const KAARTEN: Kaart[] = [
  {
    foto: "/nieuw5/foto/polaroid-3.png",
    alt: "Kapstok met rugtassen en jassen, met kindertekeningen erboven",
    naam: "Sanne",
    rol: "Groep 4",
    quote: "Rapporten maken ging altijd ten koste van mijn avond. Nu heb ik die tijd terug voor mijn gezin.",
    accent: "die tijd terug",
    doodle: "ster",
    x: 8,
    draad: 66,
    rot: -4,
  },
  {
    foto: "/nieuw5/foto/polaroid-6.png",
    alt: "Vol bureau met stapels nakijkwerk, een laptop en een map 'Groep 6'",
    naam: "Marieke",
    rol: "Groep 6",
    quote: "Sinds ik Avinka gebruik ben ik een uur eerder klaar. Dat geeft me zoveel rust in mijn avond.",
    accent: "rust",
    doodle: "hart",
    x: 28.5,
    draad: 128,
    rot: 2.5,
  },
  {
    foto: "/nieuw5/foto/polaroid-4.png",
    alt: "Digibord met een ochtendkeuzemenu, in een gezellig ingericht lokaal",
    naam: "Kim",
    rol: "Groep 8",
    quote: "Alles staat op één plek. Geen losse documenten meer, maar overzicht en structuur.",
    accent: "op één plek",
    doodle: "hart",
    x: 49,
    draad: 84,
    rot: -1.5,
  },
  {
    foto: "/nieuw5/foto/polaroid-5.png",
    alt: "Bureau met een kop koffie, nakijkwerk en een laptop, in zonlicht",
    naam: "Eva",
    rol: "Groep 5",
    quote: "Ouderberichten schrijven gaat zoveel sneller en persoonlijker. Ouders reageren ook positiever!",
    accent: "persoonlijker",
    doodle: "smiley",
    x: 69.5,
    draad: 148,
    rot: 3,
  },
  {
    foto: "/nieuw5/foto/polaroid-7.png",
    alt: "Laptop met een cijferoverzicht open, op een bureau met een schrift en stiften",
    naam: "Joris",
    rol: "IB'er",
    quote: "De analyses geven me in één overzicht wat ik nodig heb om mijn groep goed te begeleiden.",
    accent: "één overzicht",
    doodle: "smiley",
    x: 90,
    draad: 92,
    rot: -2.6,
  },
];

/* Instax mini-verhoudingen, als percentages van de kaartbreedte (54 mm):
   rand 4/54 ≈ 7.4%, beeldhoogte 62/54 ≈ 114.8%, kaarthoogte 86/54 ≈ 159.3%. */
const KAART_RATIO = 86 / 54;
const RAND_PCT = "7.4%";
const FOTO_RATIO = 46 / 62;

function Doodle({ soort, kleur }: { soort: Kaart["doodle"]; kleur: string }) {
  if (soort === "hart")
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={kleur} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 20c-5-3.5-8-6.5-8-10a4 4 0 0 1 8-1.2A4 4 0 0 1 20 10c0 3.5-3 6.5-8 10Z" />
      </svg>
    );
  if (soort === "ster")
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={kleur} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 5.9L12 16.4l-5.3 2.9 1.2-5.9L3.4 9.3l6-.7L12 3Z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={kleur} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14a4.5 4.5 0 0 0 7 0" />
      <circle cx="9" cy="9.5" r="0.4" fill={kleur} />
      <circle cx="15" cy="9.5" r="0.4" fill={kleur} />
    </svg>
  );
}

/* Eén instax-kaartje met voor- en achterkant. De flip zit op een binnenste
   laag zodat de fysica (buitenste lagen) er nooit mee vecht. */
function PolaroidKaart({
  kaart, omgedraaid, klein = false,
}: { kaart: Kaart; omgedraaid: boolean; klein?: boolean }) {
  return (
    <span className="pk-flipruimte block h-full w-full" style={{ perspective: "1200px" }}>
      <span
        className="pk-flip relative block h-full w-full"
        style={{ transform: omgedraaid ? "rotateY(180deg)" : "rotateY(0deg)", transformStyle: "preserve-3d" }}
      >
        {/* voorkant: de foto met het dikke instax-onderschrift */}
        <span
          className="pk-zijde absolute inset-0 flex flex-col bg-white"
          style={{ padding: RAND_PCT, paddingBottom: 0, backfaceVisibility: "hidden", borderRadius: 5 }}
        >
          <span className="relative block w-full overflow-hidden" style={{ aspectRatio: `${FOTO_RATIO}`, borderRadius: 2, background: MINT_DIEP }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={kaart.foto} alt={kaart.alt} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
            {/* het zachte glansje van instax-film over de foto */}
            <span
              className="pointer-events-none absolute inset-0"
              style={{ background: "linear-gradient(112deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 32%)" }}
              aria-hidden
            />
          </span>
          <span className="flex flex-1 items-center justify-between gap-2 pl-1 pr-0.5">
            <span className="min-w-0">
              <span className={`block truncate leading-none text-ink/85 ${klein ? "text-xl" : "text-2xl"}`} style={{ fontFamily: "var(--font-hand)" }}>
                {kaart.naam}
              </span>
              <span className={`mt-0.5 block leading-none text-ink/50 ${klein ? "text-[0.7rem]" : "text-xs"}`}>{kaart.rol}</span>
            </span>
            <Doodle soort={kaart.doodle} kleur={kaart.doodle === "ster" ? "var(--color-accent, #f59e0b)" : "var(--color-brand, #2f9e6e)"} />
          </span>
        </span>

        {/* achterkant: de ervaring, handgeschreven */}
        <span
          className="pk-zijde absolute inset-0 flex flex-col bg-white"
          style={{ padding: RAND_PCT, transform: "rotateY(180deg)", backfaceVisibility: "hidden", borderRadius: 5 }}
        >
          <span className="font-display text-4xl leading-none" style={{ color: MINT }} aria-hidden>
            &ldquo;
          </span>
          <span className={`mt-1 block flex-1 pl-1 leading-6 text-ink/85 ${klein ? "text-lg" : "text-xl"}`} style={{ fontFamily: "var(--font-hand)" }}>
            {kaart.quote.split(kaart.accent).map((deel, i, delen) => (
              <span key={i}>
                {deel}
                {i < delen.length - 1 && (
                  <span className="underline decoration-2 underline-offset-4" style={{ textDecorationColor: "var(--color-brand, #2f9e6e)" }}>
                    {kaart.accent}
                  </span>
                )}
              </span>
            ))}
          </span>
          <span className="flex items-end justify-between pb-2 pl-1">
            <span>
              <span className="block text-xl leading-none" style={{ fontFamily: "var(--font-hand)", color: KOP }}>{kaart.naam}</span>
              <span className="mt-0.5 block text-xs leading-none text-ink/50">{kaart.rol}</span>
            </span>
            <Doodle soort={kaart.doodle} kleur={kaart.doodle === "ster" ? "var(--color-accent, #f59e0b)" : "var(--color-brand, #2f9e6e)"} />
          </span>
        </span>
      </span>
    </span>
  );
}

/* ── Desktop: de levende draad ── */

/* Hoeveel de kaart meegeeft aan de beweging van je muis. `DUW_KRACHT` zet
   opgespaarde muisafstand om in graden, `DUW_MAX` is hoeveel duw er hoogstens
   in kan zitten en `DUW_MAXHOEK` begrenst de uitslag: ver genoeg om te voelen
   dat hij jou volgt, niet zo ver dat het een pretpark wordt.
   `DUW_DEMPING` bepaalt hoe snel de duw uitdooft als je stil blijft staan. */
const DUW_KRACHT = 0.15;
const DUW_MAX = 90;
const DUW_MAXHOEK = 9;
const DUW_DEMPING = 9;

/* Elk kaartje zwaait in zijn eigen tempo, en dat tempo komt uit zijn eigen
   draadlengte. Een echte slinger gaat sneller naarmate hij korter is
   (ω² = g/L), dus Marieke aan 66px tikt vlot heen en weer waar Kim aan 148px
   er duidelijk langer over doet. De demping schaalt mee zodat ze allemaal
   even soepel uitzwaaien, alleen niet even snel. */
const GEM_DRAAD = KAARTEN.reduce((s, k) => s + k.draad, 0) / KAARTEN.length;
const VEER = KAARTEN.map((k) => {
  const stijf = 60 * (GEM_DRAAD / k.draad);
  return { k: stijf, d: 0.594 * Math.sqrt(stijf) };
});

/* veer-integratie: één stap van een gedempte veer richting `doel` */
function veer(huidig: number, snelheid: number, doel: number, k: number, d: number, dt: number): [number, number] {
  const v = snelheid + (k * (doel - huidig) - d * snelheid) * dt;
  return [huidig + v * dt, v];
}

type Fysica = {
  x: number; vx: number; // horizontale positie t.o.v. rustplek
  dip: number; vdip: number; // hoe ver het ophangpunt doorzakt
  hoek: number; vhoek: number; // slingerhoek
  til: number; vtil: number; // hover-lift 0..1
};

function DraadScene() {
  const scene = useRef<HTMLDivElement>(null);
  const draadPad = useRef<SVGPathElement>(null);
  const kaartRefs = useRef<Array<HTMLDivElement | null>>([]);
  const binnenRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const draadjes = useRef<Array<SVGLineElement | null>>([]);
  const knoopjes = useRef<Array<SVGCircleElement | null>>([]);
  const [omgedraaid, setOmgedraaid] = useState<boolean[]>(() => KAARTEN.map(() => false));

  /* alle bewegingsstaat buiten React om: 60×/s */
  const fys = useRef<Fysica[]>(KAARTEN.map(() => ({ x: 0, vx: 0, dip: 0, vdip: 0, hoek: 0, vhoek: 0, til: 0, vtil: 0 })));
  const sleep = useRef<{ i: number; startX: number; startPointerX: number; laatstePointerX: number; bewogen: boolean } | null>(null);
  /* click vuurt pas ná pointerup, wanneer de sleepstatus al gewist is —
     deze vlag onthoudt één tik lang dat de laatste beweging een sleep was */
  const netGesleept = useRef(false);
  const hoverI = useRef(-1);
  /* de opgespaarde duw van je muis over de kaart waar je nu op staat, plus
     waar je cursor de vorige keer was om de richting uit af te leiden */
  const duw = useRef(0);
  const vorigeHoverX = useRef<number | null>(null);
  /* zet de rAF-lus weer aan; hij stopt zichzelf als alles is uitgezwaaid */
  const wek = useRef<(() => void) | null>(null);
  const rustig = useRef(false); // prefers-reduced-motion

  /* rust-y van de draad op positie x (fractie 0..1): lichte doorhang */
  const draadY = (fx: number) => 30 + 30 * Math.sin(Math.PI * Math.min(1, Math.max(0, fx)));

  useEffect(() => {
    const el = scene.current;
    if (!el) return;
    rustig.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let vorige = performance.now();
    let raf = 0;

    /* Is alles uitgezwaaid? Dan zetten we de lus helemaal stil in plaats van
       60x per seconde dezelfde waarden te blijven schrijven. Dat scheelt echt
       wat: één frame is ~40 DOM-attributen plus een herberekend SVG-pad, en
       dat gebeurde eerder ook als er niemand keek. Nu kost de sectie niets
       zolang je er niet bent. */
    const inRust = () => {
      if (hoverI.current !== -1 || sleep.current) return false;
      if (Math.abs(duw.current) > 0.01) return false;
      for (let i = 0; i < KAARTEN.length; i++) {
        const f = fys.current[i];
        if (Math.abs(f.x) > 0.05 || Math.abs(f.vx) > 0.05) return false;
        if (Math.abs(f.dip) > 0.05 || Math.abs(f.vdip) > 0.05) return false;
        if (Math.abs(f.hoek - KAARTEN[i].rot) > 0.02 || Math.abs(f.vhoek) > 0.05) return false;
        if (f.til > 0.004 || Math.abs(f.vtil) > 0.01) return false;
      }
      return true;
    };

    const stap = (t: number) => {
      const dt = Math.min(0.032, (t - vorige) / 1000);
      vorige = t;

      const breed = el.clientWidth;

      /* ⚠️ Op mobiel staat deze scène op display:none (daar is het een stapel
         foto's in je hand), en dan is clientWidth 0. Zonder deze uitstap deelt
         de fysica hieronder door nul — `hangX / breed` wordt NaN — en schrijft
         ze NaN in de x/y van elk draadje, elk knoopje en het draadpad. Dat gaf
         ruim duizend consolefouten per mobiel bezoek.
         Stoppen mag: de ResizeObserver onderaan wekt de lus vanzelf zodra het
         element weer breedte krijgt (bij draaien of vergroten van het venster). */
      if (breed === 0) { raf = 0; return; }

      /* de duw van je muis dooft uit zodra je stil blijft staan, en dan veert
         de kaart vanzelf terug naar zijn eigen scheve hoek */
      duw.current *= Math.max(0, 1 - dt * DUW_DEMPING);

      /* ── 1. veren integreren ── */
      for (let i = 0; i < KAARTEN.length; i++) {
        const f = fys.current[i];
        const k = KAARTEN[i];
        const isSleep = sleep.current?.i === i;

        /* horizontaal: tijdens slepen strak achter de muis aan, daarna
           terugveren naar de eigen plek met een nazwaai */
        const rustX = (k.x / 100) * breed;
        let doelX = isSleep ? sleep.current!.laatstePointerX - sleep.current!.startPointerX + sleep.current!.startX : 0;
        /* niet voorbij de randen van de scène te slepen */
        if (isSleep) doelX = Math.max(24 - rustX, Math.min(breed - 24 - rustX, doelX));
        [f.x, f.vx] = veer(f.x, f.vx, doelX, isSleep ? 320 : 40, isSleep ? 34 : 7.5, dt);

        /* het ophangpunt zakt door onder beweging (gewicht aan de draad) */
        [f.dip, f.vdip] = veer(f.dip, f.vdip, 0, 130, 9.5, dt);

        /* slingerhoek. Teken-afspraak: een POSITIEVE hoek draait met de klok
           mee om het punt op de draad, en dus gaat de onderkant van de kaart
           naar LINKS. Een duw naar rechts is daarom een negatieve hoek.
           Onder de muis volgt de kaart jouw beweging; sleep je hem, dan hangt
           hij recht aan je cursor; verder veert hij naar zijn rusthoek. */
        const onderMuis = hoverI.current === i && !isSleep;
        const doelHoek = onderMuis
          ? Math.max(-DUW_MAXHOEK, Math.min(DUW_MAXHOEK, -duw.current * DUW_KRACHT))
          : isSleep
            ? 0
            : k.rot;
        [f.hoek, f.vhoek] = veer(f.hoek, f.vhoek, doelHoek, VEER[i].k, VEER[i].d, dt);

        /* hover-lift */
        [f.til, f.vtil] = veer(f.til, f.vtil, hoverI.current === i ? 1 : 0, 170, 22, dt);
      }

      /* Als alles is uitgezwaaid: exact op de rustwaarden zetten, nog één keer
         tekenen en dan de lus stoppen. Zonder dit snappen blijven er staartjes
         van duizendsten hangen en komt hij nooit tot rust. */
      const klaar = inRust();
      if (klaar) {
        duw.current = 0;
        for (let i = 0; i < KAARTEN.length; i++) {
          fys.current[i] = { x: 0, vx: 0, dip: 0, vdip: 0, hoek: KAARTEN[i].rot, vhoek: 0, til: 0, vtil: 0 };
        }
      }

      /* ── 2. tekenen ──
         Geen onderlinge botsingen (meer): kaartjes tikken elkaar niet aan en
         weten niet van elkaars bestaan. Ook geen ambient wieg. Wat je niet
         aanraakt, hangt stil. */
      const punten: Array<[number, number]> = [];
      for (let i = 0; i < KAARTEN.length; i++) {
        const f = fys.current[i];
        const k = KAARTEN[i];
        const isSleep = sleep.current?.i === i;
        const totHoek = f.hoek;

        const rustX = (k.x / 100) * breed;
        const hangX = rustX + f.x;
        const hangY = draadY(hangX / breed) + f.dip;
        punten.push([hangX, hangY]);

        /* de kaart slingert om zijn punt óp de draad (transform-origin ligt
           draadlengte boven de kaart), dus het draadje scharniert mee: de
           kaarttop hangt op hoek `totHoek` onder het ophangpunt */
        const kaartEl = kaartRefs.current[i];
        if (kaartEl) {
          kaartEl.style.transform =
            `translate3d(${hangX}px, ${hangY + k.draad}px, 0) translateX(-50%) rotate(${totHoek}deg)`;
          kaartEl.style.zIndex = hoverI.current === i || isSleep ? "40" : String(10 + i);
        }
        /* de hover-lift zit op de binnenste laag, zodat schaal en lift in
           de as van de kaart gebeuren en niet om het draaipunt op de draad */
        const binnen = binnenRefs.current[i];
        if (binnen) {
          binnen.style.transform = `translateY(${f.til * -7}px) scale(${1 + f.til * 0.045})`;
        }
        const rad = (totHoek * Math.PI) / 180;
        const lente = k.draad + f.til * -7;
        const lijn = draadjes.current[i];
        if (lijn) {
          /* MIN, niet plus: de kaart draait met de klok mee om dit punt, dus
             bij een positieve hoek zakt zijn top naar links weg. Met een plus
             wees het draadje precies de andere kant op dan de kaart hing. */
          lijn.setAttribute("x1", String(hangX));
          lijn.setAttribute("y1", String(hangY));
          lijn.setAttribute("x2", (hangX - Math.sin(rad) * lente).toFixed(1));
          lijn.setAttribute("y2", (hangY + Math.cos(rad) * lente).toFixed(1));
        }
        const knoop = knoopjes.current[i];
        if (knoop) {
          knoop.setAttribute("cx", String(hangX));
          knoop.setAttribute("cy", String(hangY));
        }
      }

      /* de draad zelf: een vloeiende lijn door de ophangpunten heen */
      if (draadPad.current) {
        const alle: Array<[number, number]> = [[-30, 26], ...punten, [breed + 30, 26]];
        let d = `M ${alle[0][0]} ${alle[0][1]}`;
        for (let i = 0; i < alle.length - 1; i++) {
          const p0 = alle[Math.max(0, i - 1)], p1 = alle[i], p2 = alle[i + 1], p3 = alle[Math.min(alle.length - 1, i + 2)];
          d += ` C ${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)},`;
          d += ` ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)},`;
          d += ` ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
        }
        draadPad.current.setAttribute("d", d);
      }

      if (klaar) { raf = 0; return; } // uitgezwaaid: lus stopt hier
      raf = requestAnimationFrame(stap);
    };

    /* De lus draait alleen als er iets te bewegen valt. `wek` wordt geroepen
       zodra je een kaart aanraakt, en bij een resize omdat de rustplekken dan
       opnieuw uitgerekend moeten worden. Er wordt altijd minstens één frame
       getekend, dus na een resize staat alles meteen weer goed. */
    wek.current = () => {
      if (raf) return;
      vorige = performance.now();
      raf = requestAnimationFrame(stap);
    };
    wek.current();

    const ro = new ResizeObserver(() => wek.current?.());
    ro.observe(el);
    return () => { if (raf) cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  /* pointer-gedrag: pas ná 6px beweging wordt het een sleep (anders kaapt
     de sleep elke klik — zelfde les als bij de tool-galerij) */
  const opPointerDown = (i: number) => (e: ReactPointerEvent) => {
    if (rustig.current) return;
    sleep.current = { i, startX: fys.current[i].x, startPointerX: e.clientX, laatstePointerX: e.clientX, bewogen: false };
    wek.current?.();
  };
  const opPointerMove = (i: number) => (e: ReactPointerEvent) => {
    const s = sleep.current;
    if (!s || s.i !== i) {
      /* je sleept niet, je strijkt er alleen langs: de kaart gaat mee met de
         kant waarop jij beweegt en zwaait terug zodra je stilhoudt */
      if (rustig.current || hoverI.current !== i) return;
      const vorig = vorigeHoverX.current;
      vorigeHoverX.current = e.clientX;
      if (vorig === null) return;
      duw.current = Math.max(-DUW_MAX, Math.min(DUW_MAX, duw.current + (e.clientX - vorig)));
      return;
    }
    const afstand = Math.abs(e.clientX - s.startPointerX);
    if (!s.bewogen && afstand > 6) {
      s.bewogen = true;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }
    if (s.bewogen) {
      const vorig = s.laatstePointerX;
      s.laatstePointerX = e.clientX;
      const dx = e.clientX - vorig;
      /* het gewicht trekt de draad omlaag onder de kaart die je vasthebt —
         en verder gebeurt er niets: de buren blijven hangen waar ze hangen */
      fys.current[i].vdip += Math.min(60, Math.abs(dx) * 14);
    }
  };
  const opPointerUp = (i: number) => () => {
    const s = sleep.current;
    if (!s || s.i !== i) return;
    netGesleept.current = s.bewogen;
    if (s.bewogen) {
      /* nazwaai op het moment van loslaten */
      fys.current[i].vhoek += fys.current[i].vx * 0.09;
    }
    sleep.current = null;
  };
  const opKlik = (i: number) => () => {
    /* een sleep is geen klik */
    if (netGesleept.current) {
      netGesleept.current = false;
      return;
    }
    setOmgedraaid((v) => v.map((o, j) => (j === i ? !o : o)));
  };

  return (
    <div ref={scene} className="relative hidden h-[640px] lg:block" style={{ touchAction: "pan-y" }}>
      {/* de draad + draadjes + knoopjes: één fijne inktlijn-familie */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <path ref={draadPad} fill="none" stroke={KOP} strokeOpacity="0.32" strokeWidth="1.5" />
        {KAARTEN.map((k, i) => (
          <g key={k.naam}>
            <line ref={(r) => { draadjes.current[i] = r; }} stroke={KOP} strokeOpacity="0.28" strokeWidth="1.2" />
            <circle ref={(r) => { knoopjes.current[i] = r; }} r="2.6" fill={KOP} fillOpacity="0.4" />
          </g>
        ))}
      </svg>

      {KAARTEN.map((k, i) => (
        <div
          key={k.naam}
          ref={(r) => { kaartRefs.current[i] = r; }}
          className="absolute left-0 top-0 w-[212px] will-change-transform"
          /* het draaipunt ligt óp de draad (draadlengte boven de kaart), dus
             kaart én draadje slingeren samen om het ophangpunt */
          style={{ height: 212 * KAART_RATIO, transformOrigin: `50% ${-k.draad}px`, left: 0 }}
          onPointerEnter={() => { hoverI.current = i; vorigeHoverX.current = null; duw.current = 0; wek.current?.(); }}
          onPointerLeave={() => { hoverI.current = -1; vorigeHoverX.current = null; }}
          onPointerDown={opPointerDown(i)}
          onPointerMove={opPointerMove(i)}
          onPointerUp={opPointerUp(i)}
          onPointerCancel={() => { sleep.current = null; }}
        >
          <button
            type="button"
            ref={(r) => { binnenRefs.current[i] = r; }}
            onClick={opKlik(i)}
            aria-expanded={omgedraaid[i]}
            aria-label={omgedraaid[i] ? `Draai de foto van ${k.naam} terug` : `Lees de ervaring van ${k.naam} (${k.rol})`}
            className="pk-schaduw block h-full w-full cursor-grab select-none rounded-[5px] text-left will-change-transform focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand active:cursor-grabbing"
          >
            <PolaroidKaart kaart={k} omgedraaid={omgedraaid[i]} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Mobiel: de stapel in je hand ── */

function StapelScene() {
  const [volgorde, setVolgorde] = useState<number[]>(() => KAARTEN.map((_, i) => i));
  const [omgedraaid, setOmgedraaid] = useState<boolean[]>(() => KAARTEN.map(() => false));
  const [vertrekkend, setVertrekkend] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  /* `richting` blijft null tot duidelijk is welke kant de vinger op gaat.
     Zodra dat "omhoog/omlaag" is laten we de veeg helemaal los: dan hoort hij
     bij de PAGINA en niet bij de stapel. */
  const greep = useRef<{
    startY: number; startX: number; laatsteX: number; laatsteT: number;
    snelheid: number; bewogen: boolean; richting: "zij" | "vert" | null;
  } | null>(null);
  /* zelfde click-na-veeg-vlag als op desktop */
  const netGeveegd = useRef(false);

  const bovenste = volgorde[0];

  /* ⚠️ DE KAART GAAT NU OPZIJ, NIET OMHOOG. Zie de uitleg bij touchAction
     hieronder waarom. De verticale verplaatsing is alleen nog een lichte dip:
     een polaroid die je opzij schuift zakt een beetje mee, dat leest als
     gewicht. */
  const zetTransform = (dx: number, animatie: string) => {
    const el = topRef.current;
    if (!el) return;
    el.style.transition = animatie;
    el.style.transform = `translate3d(${dx}px, ${Math.abs(dx) * 0.06}px, 0) rotate(${dx * 0.05}deg)`;
  };

  const opDown = (e: ReactPointerEvent) => {
    if (vertrekkend) return;
    greep.current = {
      startY: e.clientY, startX: e.clientX, laatsteX: e.clientX,
      laatsteT: performance.now(), snelheid: 0, bewogen: false, richting: null,
    };
  };
  const opMove = (e: ReactPointerEvent) => {
    const g = greep.current;
    if (!g || vertrekkend) return;
    const dy = e.clientY - g.startY;
    const dx = e.clientX - g.startX;

    /* 🔑 DE KERN VAN DE FIX: pas bij 8px beweging bepalen we welke kant deze
       veeg op wil, en dat besluit staat daarna vast voor de rest van het
       gebaar. Gaat hij vooral omhoog of omlaag, dan laten we hem LOS — geen
       pointer-capture, geen transform — en scrolt de pagina gewoon door.
       ⚠️ Dat besluit moet één keer vallen en niet elke muisbeweging opnieuw:
       tijdens een schuine veeg wisselt de grootste van de twee anders heen en
       weer, en dan pakt en lost de kaart om beurten. */
    if (!g.bewogen && Math.hypot(dx, dy) > 8) {
      g.bewogen = true;
      g.richting = Math.abs(dx) > Math.abs(dy) ? "zij" : "vert";
      if (g.richting === "zij") (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }
    if (g.bewogen && g.richting === "zij") {
      const nu = performance.now();
      g.snelheid = (e.clientX - g.laatsteX) / Math.max(1, nu - g.laatsteT);
      g.laatsteX = e.clientX;
      g.laatsteT = nu;
      zetTransform(dx, "none");
    }
  };
  const opUp = (e: ReactPointerEvent) => {
    const g = greep.current;
    greep.current = null;
    if (!g || vertrekkend) return;
    /* ⚠️ DEZE REGEL MOET VÓÓR DE VERTICALE UITSTAP STAAN. Zet je hem erna, dan
       telt een verticale sleep als een gewone tik en klapt de foto om terwijl
       je alleen wilde scrollen. Precies dat gebeurde in de test.
       🔑 Een sleep is geen tik, ongeacht de richting. Dat de veeg niet voor ons
       was betekent alleen dat de KAART niets doet, niet dat er niets gebeurde. */
    netGeveegd.current = g.bewogen;
    /* Een verticale veeg was voor de pagina, niet voor de stapel. */
    if (g.richting === "vert") return;
    if (!g.bewogen) return; // klik → flip (via onClick)
    const dx = e.clientX - g.startX;
    const weg = Math.abs(dx) > 90 || Math.abs(g.snelheid) > 0.55;
    if (weg) {
      setVertrekkend(true);
      /* de kaart verlaat het scherm aan de kant waar je hem heen duwde */
      const kant = dx < 0 ? -1 : 1;
      zetTransform(kant * window.innerWidth * 1.1, "transform 0.42s cubic-bezier(0.23, 1, 0.32, 1)");
      window.setTimeout(() => {
        setVolgorde((v) => [...v.slice(1), v[0]]);
        setOmgedraaid((o) => o.map((val, i) => (i === bovenste ? false : val)));
        const el = topRef.current;
        if (el) {
          el.style.transition = "none";
          el.style.transform = "translate3d(0,0,0)";
        }
        setVertrekkend(false);
      }, 430);
    } else {
      zetTransform(0, "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)");
    }
  };
  const opKlik = () => {
    if (netGeveegd.current || vertrekkend) {
      netGeveegd.current = false;
      return;
    }
    setOmgedraaid((v) => v.map((o, i) => (i === bovenste ? !o : o)));
  };

  const kaartBreed = "min(76vw, 300px)";

  return (
    <div className="lg:hidden">
      {/* ⚠️⚠️ `touchAction: "pan-y"` EN NIET "none" — HIER ZAT EEN ECHTE BUG.
         Met "none" belooft dit blok aan de browser dat het ÉLKE veeg zelf
         afhandelt, ook een verticale. Gevolg: wilde je bij de foto's gewoon
         verder naar beneden scrollen, dan gebeurde er niets — je stond stil op
         de polaroids. Gevonden door de eigenaar.
         Met "pan-y" houdt de browser het verticale pannen zelf (de pagina
         scrolt door) en krijgen wij alleen het horizontale gebaar.

         🔑 De tweede helft van de fix zit in opMove: `touch-action` regelt wat
         de BROWSER doet, maar onze eigen code moet dezelfde grens trekken.
         Zonder de richtingtoets daar zou een schuine veeg alsnog de kaart
         meenemen én de pagina laten scrollen.
         🔑 En de derde helft is de tekst eronder: die zei "veeg omhoog". Een
         gebaar veranderen zonder de aanwijzing te veranderen levert een
         instructie op die actief tegenwerkt. */}
      <div className="relative mx-auto" style={{ width: kaartBreed, height: `calc(${kaartBreed} * ${KAART_RATIO} + 44px)`, touchAction: "pan-y" }}>
        {/* de stapel eronder: alleen de eerstvolgende twee, steeds iets
           kleiner en lager — genoeg om de stapel te voelen */}
        {[2, 1].map((diepte) => {
          const idx = volgorde[diepte];
          if (idx === undefined) return null;
          return (
            <div
              key={KAARTEN[idx].naam}
              className="pk-schaduw absolute left-0 top-0 h-full w-full rounded-[5px]"
              /* ⚠️ GEEN TRANSITION HIER, en dat is een bewuste verwijdering.
                 Er stond transform 0.45s. Gevolg: zodra je de bovenste kaart
                 wegveegde, schoof de kaart eronder van de diepte-2-stand naar
                 de diepte-1-stand — van +2° naar -2,4° en een stukje groter — en
                 dat duurde bijna een halve seconde. De eigenaar zag dat als "hij
                 zet zichzelf eerst recht" en wilde het weg.
                 🔑 Wat hier animeerde was niet de kaart die je pakte maar de
                 kaart eróchter. Zonder meten had ik de verkeerde aangepast: de
                 nieuwe bovenste kaart stond meteen goed (transition 0s), de
                 beweging kwam van de buur. Meet bij "er beweegt iets ongewenst"
                 dus welk element het is, in plaats van het element te pakken
                 waar je naar kijkt.
                 De stapel staat nu meteen in zijn nieuwe stand. Dat mag: je hebt
                 je aandacht toch bij de kaart die wegvliegt. */
              style={{
                transform: `translateY(${diepte * 16}px) scale(${1 - diepte * 0.055}) rotate(${diepte % 2 ? -2.4 : 2}deg)`,
                zIndex: 5 - diepte,
              }}
              aria-hidden
            >
              <PolaroidKaart kaart={KAARTEN[idx]} omgedraaid={false} klein />
            </div>
          );
        })}

        {/* de bovenste kaart: vegen of tikken */}
        <div
          ref={topRef}
          className="absolute left-0 top-0 h-full w-full will-change-transform"
          style={{ zIndex: 10 }}
          onPointerDown={opDown}
          onPointerMove={opMove}
          onPointerUp={opUp}
          onPointerCancel={() => { greep.current = null; zetTransform(0, "transform 0.5s cubic-bezier(0.23,1,0.32,1)"); }}
        >
          <button
            type="button"
            onClick={opKlik}
            aria-expanded={omgedraaid[bovenste]}
            aria-label={omgedraaid[bovenste] ? `Draai de foto van ${KAARTEN[bovenste].naam} terug` : `Lees de ervaring van ${KAARTEN[bovenste].naam} (${KAARTEN[bovenste].rol})`}
            className="pk-schaduw block h-full w-full select-none rounded-[5px] text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            {/* ⚠️⚠️ DEZE `key` IS DE ECHTE FIX VOOR "hij zet zichzelf eerst recht".
               Zonder key hergebruikt React ditzelfde stukje HTML voor de
               vólgende polaroid. Het draai-laagje (.pk-flip) heeft een
               transition van 0,65s, en dat laagje stond op rotateY(180deg) als
               je de kaart had omgedraaid om te lezen. Veeg je dan door, dan
               krijgt hetzelfde element rotateY(0deg) voor de nieuwe kaart — en
               dus zie je de nieuwe foto binnendraaien alsof hij zichzelf
               rechtzet. Met een key maakt React een nieuw element; dat begint
               op 0 graden en heeft niets om vanaf te animeren.
               🔑 Dit trad alleen op ALS je de kaart eerst had omgedraaid, en
               precies zo gebruik je hem: tikken om te lezen, dan doorvegen.
               Ik had eerder de verkeerde bron aangepast (de transition op de
               stapelkaarten). Die was ook overbodig, maar dit was het.
               🔑 Les: een resterende animatie na een wissel komt vaak niet van
               je eigen code maar van HERGEBRUIKTE HTML. Vraag je bij "hij
               animeert nog steeds" af of het element wel echt nieuw is. */}
            <PolaroidKaart key={KAARTEN[bovenste].naam} kaart={KAARTEN[bovenste]} omgedraaid={omgedraaid[bovenste]} klein />
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm font-semibold text-ink/60">
        tik om te lezen · veeg opzij voor de volgende
      </p>
      <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden>
        {KAARTEN.map((k, i) => (
          <span
            key={k.naam}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{ width: bovenste === i ? 18 : 6, background: bovenste === i ? "var(--color-brand, #2f9e6e)" : "rgba(34,28,58,0.2)" }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── De sectie ── */
export function WereldPolaroids() {
  return (
    <section className="relative overflow-x-clip">
      {/* Het mintveld van de makers-sectie hierboven (WereldMaker) loopt hier
         gewoon door — zelfde MINT-tint, dus geen naad op de sectiegrens —
         en krijgt hier zijn eigen golf terug naar het gespikkelde papier.
         Was voorheen een dun lijntje vlak achter de makerskaart; ligt nu
         veel groter en reikt tot in het intro-tekstblok van deze sectie.
         De golf zelf loopt bewust niet vlak links-rechts: hij zakt naar
         rechts een flink stuk dieper weg dan waar hij links begint. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[300px] overflow-hidden sm:h-[380px] lg:h-[480px]"
        aria-hidden
      >
        <div className="absolute inset-0" style={{ background: MINT_LICHT }} />

        {/* ⚠️ Dit vlak stond BUITEN deze laag en dus bovenop de golf: het lag
           over de overgang heen en stak met een mint-tint het papier in, waar
           die tint niet hoort. Nu staat het ertussen — mint, dan het vlak, dan
           de golf — zodat de golf hem precies op de kleurrand afsnijdt en hij
           onder het veld vandaan lijkt te komen. Zelfde ingreep als bij het
           vlak in de cijfersectie hieronder en dat bij "Veilig omgaan met AI".
           🔑 De volgorde binnen de laag IS de ingreep. */}
        <KaartVlak
          kleur={VLAK_MINT}
          vorm="schelp"
          breedte={560}
          hoogte={430}
          style={{ left: "-9%", top: 40, transform: "rotate(-7deg)" }}
          className="hidden lg:block"
          tel={1}
        />

        <Golf kleur="var(--w-papier, #fcfbf7)" vorm="speels" hoogte="h-[90px] sm:h-[130px] lg:h-[170px]" />
      </div>
      {/* ⚠️ Hier lag een vlak rechtsonder (koepel, 640x360). Het liep dwars
         door de twee rechter polaroids heen en is verhuisd naar de
         cijfersectie hieronder, waar de golf hem netjes op de mintrand
         afsnijdt. Zelfde ingreep als bij "Veilig omgaan met AI": een vorm
         hoort onder een kleurveld vandaan te komen, niet over inhoud heen te
         liggen. */}

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-24 pt-24 lg:pb-28 lg:pt-28">
        {/* Dit was de enige sectie van de pagina zonder stipjes; over ruim
           veertienhonderd pixels lag er geen enkele. */}
        <Confetti punten={[{ x: "1%", y: "12%", r: 4 }, { x: "97%", y: "34%", r: 5, amber: true }]} />
        <div className="text-center">
          {/* Het handgeschreven opstapje "wat leerkrachten zeggen" is weg: het
             handschrift zit hier al ín de kop ("uit de praktijk"), dus stond
             het er twee keer, en paginabreed stond dit opstapje in zes van de
             negen secties. */}
          <h2
            data-reveal
            className={KOP_SECTIE}
            style={{ color: DONKER }}
          >
            Echte ervaringen{" "}
            <span className="whitespace-nowrap" style={{ fontFamily: "var(--font-hand)", fontWeight: 400, color: "var(--color-brand, #2f9e6e)" }}>
              uit de praktijk
            </span>
          </h2>
        </div>

        {/* het handgeschreven hintje met een boogpijltje naar de kaarten */}
        <p
          data-reveal
          className={`mt-8 hidden items-center gap-2 lg:flex ${HAND_WENK}`}
          style={{ fontFamily: "var(--font-hand)", color: KOP }}
        >
          klik op een foto om de ervaring te lezen
          <svg viewBox="0 0 40 28" className="h-6 w-9" fill="none" stroke={KOP} strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M2 4 C 14 6, 26 10, 32 22" />
            <path d="M26 20 L 32.5 23 L 34 16" />
          </svg>
        </p>

        <div data-reveal className="mt-4 lg:mt-0">
          <DraadScene />
          <div className="mt-10 lg:hidden">
            <StapelScene />
          </div>
        </div>

        {/* ⚠️ Hier stond de disclaimer dat dit voorbeeld-ervaringen zijn en
           dat de echte uit de zomertest komen. Die is er op verzoek uit.
           De kaartjes zelf zijn nog steeds verzonnen voorbeelden mét
           verzonnen namen — vervangen door echte reacties vóór de pagina
           publiek gaat. */}
      </div>

      <style>{`
        /* schaduw naar linksonder: de pagina heeft één lichtbron rechtsboven
           (zie SCHADUW_HELLING in Wereld.tsx) */
        .pk-schaduw { box-shadow: -7px 18px 38px -20px rgba(23,80,58,0.45), -1px 3px 8px -4px rgba(23,80,58,0.25); }
        .pk-flip { transition: transform 0.65s cubic-bezier(0.3, 0.9, 0.25, 1); }
        @media (prefers-reduced-motion: reduce) {
          /* geen 3D-draai: de kanten faden over elkaar heen */
          .pk-flip { transition: none; }
          .pk-zijde { transition: opacity 0.3s ease; }
        }
      `}</style>
    </section>
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DONKER, Golf, KOP, MINT_LICHT, KaartVlak, VLAK_MINT } from "./Wereld";

/* ── De privacysectie: DE GRENS ────────────────────────────────────────────
   Eén beeld draagt deze sectie: een verticale lijn, en dat is de rand van
   jouw apparaat. Links staat wat jij schrijft, rechts wat er weggaat. De
   namen steken die grens over — en veranderen precies op de lijn.

   WAT ER HIERVOOR MIS GING, en waarom dit anders is:
   1. De vorige versie toonde het maskeren als een TOESTAND: twee panelen die
      allebei al af waren. Het moment waarop een naam verdwijnt is nou juist
      het hele punt, en dat zag je dus nooit gebeuren. Nu is het een
      GEBEURTENIS: de naam laat los, vliegt, en klapt óp de grens om.
   2. Er stond veel te veel. Kop, alinea, label, veld, twee panelen, een
      voetnoot, drie stappen en een lege plek — acht blokken voor één belofte.
      Nu: de kop, het beeld, en één slotzin.
   3. Er gebeurde niets bij scrollen of hoveren. Nu drijft de hele oversteek
      op je scrollpositie, licht de grens op waar een naam hem raakt, en kun
      je met je muis over een naam gaan om vooruit te zien wat ermee gebeurt.

   De tweede helft van de belofte staat eronder: de gegevens die de grens niet
   eens halen. Die duwen ertegenaan en blijven liggen.

   ⚠️ Het maskeren is ECHT en gebeurt in de browser: hele woorden,
   hoofdletter-ongevoelig, dezelfde regel als public/avinka-masking.js. Er
   gaat hier niets de deur uit — gemeten: nul netwerkverzoeken. Die nul is de
   sectie. Komt er ooit iets bij dat wél verstuurt, dan klopt het niet meer. */

const STANDAARD = "Sofie, Daan, Iris";
const SCHUILNAAM = (i: number) => `leerling ${String.fromCharCode(65 + i)}`;

/* Wat de grens niet haalt. Dit is de andere helft van de belofte: namen gaan
   gemaskeerd mee, maar dít gaat helemaal niet mee. */
const BLIJFT = ["toetsresultaten", "gespreksverslagen", "rapportcijfers"];

/* De zin waarin de namen staan. Bewust een echte rapportzin: zo zie je dat
   het verhaal heel blijft en alleen de naam verandert. */
function maakDelen(namen: string[]) {
  const staarten = [
    " liet dit halfjaar een mooie groei zien bij spelling. ",
    " werkt geconcentreerder dan eerst. En ",
    " durft steeds vaker iets te vragen.",
  ];
  return namen.map((naam, i) => ({ naam, staart: staarten[i] ?? " " }));
}

function soepel(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
const klem = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function WereldPrivacy() {
  const [invoer, setInvoer] = useState(STANDAARD);
  const [zweef, setZweef] = useState(-1);

  const sectie = useRef<HTMLElement>(null);
  const vanRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const naarRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const vliegRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const gloedRef = useRef<HTMLDivElement>(null);
  const blijftRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const lijnRef = useRef<HTMLDivElement>(null);
  /* De laag waarin de namen vliegen. ALLE posities worden hiertegen gemeten:
     de vliegende kopieën staan hierin, dus meten tegen de sectie leverde een
     verschuiving op ter grootte van de afstand tussen sectie en raster — de
     namen landden dan netjes een paar honderd pixels naast hun doel. */
  const beeldRef = useRef<HTMLDivElement>(null);

  const namen = useMemo(() => {
    const gevonden = Array.from(
      new Map(
        invoer
          .split(/[,;\n]+/)
          .flatMap((d) => d.trim().split(/\s+/))
          .map((d) => d.trim())
          .filter((d) => d.length > 1)
          .map((d) => [d.toLowerCase(), d]),
      ).values(),
    ).slice(0, 3);
    return gevonden.length ? gevonden : ["Sofie", "Daan", "Iris"];
  }, [invoer]);

  const delen = useMemo(() => maakDelen(namen), [namen]);

  /* ── de oversteek ──
     De posities worden gemeten (niet geraden): waar staat de naam links, waar
     is zijn plek rechts. Daartussen vliegt een kopie. Meten gebeurt bij
     layout en bij resize, nooit per frame — dat zou elke frame een layout
     forceren en precies het gehaper opleveren dat we eerder hadden. */
  const posities = useRef<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]);
  const meet = useCallback(() => {
    const el = beeldRef.current;
    if (!el) return;
    const basis = el.getBoundingClientRect();
    posities.current = namen.map((_, i) => {
      const a = vanRefs.current[i]?.getBoundingClientRect();
      const b = naarRefs.current[i]?.getBoundingClientRect();
      if (!a || !b) return { x1: 0, y1: 0, x2: 0, y2: 0 };
      return {
        x1: a.left - basis.left + a.width / 2,
        y1: a.top - basis.top + a.height / 2,
        x2: b.left - basis.left + b.width / 2,
        y2: b.top - basis.top + b.height / 2,
      };
    });
  }, [namen]);

  useLayoutEffect(() => {
    meet();
  }, [meet]);

  useEffect(() => {
    const el = sectie.current;
    if (!el) return;

    /* Geen state maar een gewone variabele: dit wordt alleen in de teken-lus
       gelezen en hoeft nooit een render te veroorzaken. */
    const rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Pas meten als de layout écht klaar is. Meten in een layout-effect gaat
       mis: de webfonts zijn dan nog niet geladen, de regels breken daarna
       anders, en de landingsplekken verschuiven — waardoor de namen naast hun
       doel terechtkwamen. Daarom meten we lui, bij het eerste tekenmoment,
       en opnieuw zodra de fonts binnen zijn of de maat verandert. */
    let gemeten = false;
    const ro = new ResizeObserver(() => {
      gemeten = false;
      wek();
    });
    ro.observe(el);
    document.fonts?.ready.then(() => {
      gemeten = false;
      wek();
    });

    let raf = 0;
    const teken = () => {
      raf = 0;
      if (!gemeten) {
        meet();
        gemeten = true;
      }
      const r = el.getBoundingClientRect();
      /* De oversteek loopt terwijl de sectie door beeld komt. Geen sticky en
         geen extra schermlengte: die maakten de pagina eerder alleen maar
         langer zonder dat er iets bij kwam. */
      const p = klem((window.innerHeight * 0.78 - r.top) / (r.height * 0.62));

      const beeld = beeldRef.current?.getBoundingClientRect();
      const lijnX =
        lijnRef.current && beeld
          ? lijnRef.current.getBoundingClientRect().left - beeld.left
          : 0;

      let gloedSterkte = 0;
      let gloedY = 0;

      namen.forEach((naam, i) => {
        const vlieg = vliegRefs.current[i];
        const van = vanRefs.current[i];
        const pos = posities.current[i];
        if (!vlieg || !pos) return;

        /* elke naam vertrekt iets later, zodat het een reeks wordt en geen
           groepssprong */
        const start = 0.1 + i * 0.15;
        const t = rustig ? 1 : klem((p - start) / 0.34);
        const e = soepel(t);

        const x = pos.x1 + (pos.x2 - pos.x1) * e;
        const y = pos.y1 + (pos.y2 - pos.y1) * e;
        /* een lichte boog: hij wordt opgetild en weer neergezet */
        const boog = Math.sin(e * Math.PI) * -26;

        vlieg.style.transform = `translate3d(${x.toFixed(1)}px, ${(y + boog).toFixed(1)}px, 0) translate(-50%, -50%)`;
        vlieg.style.opacity = t > 0.02 ? "1" : "0";

        /* de omslag gebeurt precies op de grens */
        const overGrens = x >= lijnX;
        vlieg.dataset.gemaskeerd = overGrens ? "ja" : "nee";
        const wil = overGrens ? SCHUILNAAM(i) : naam;
        if (vlieg.textContent !== wil) vlieg.textContent = wil;

        /* De naam links BLIJFT staan. Hij verdween eerst helemaal, en dan las
           het als "je tekst is gewist" — terwijl er in werkelijkheid alleen
           een kopie vertrekt; jouw eigen tekst houdt de naam gewoon. Hij dipt
           dus even weg terwijl de kopie onderweg is en komt daarna terug. */
        if (van) van.style.opacity = (1 - 0.62 * Math.sin(klem(t) * Math.PI)).toFixed(2);

        /* de grens licht op waar hij geraakt wordt */
        const raakt = 1 - Math.min(1, Math.abs(x - lijnX) / 90);
        if (raakt > gloedSterkte && t > 0 && t < 1) {
          gloedSterkte = raakt;
          gloedY = y;
        }
      });

      if (gloedRef.current) {
        gloedRef.current.style.opacity = (gloedSterkte * 0.9).toFixed(2);
        gloedRef.current.style.transform = `translate3d(-50%, ${gloedY.toFixed(0)}px, 0) translateY(-50%) scaleY(${(0.6 + gloedSterkte * 0.9).toFixed(2)})`;
      }

      /* de gegevens die de grens niet halen: ze duwen ertegenaan en blijven */
      blijftRefs.current.forEach((el2, i) => {
        if (!el2) return;
        const start = 0.22 + i * 0.1;
        const t = rustig ? 1 : klem((p - start) / 0.3);
        const duw = Math.sin(soepel(t) * Math.PI) * 22;
        el2.style.transform = `translate3d(${duw.toFixed(1)}px, 0, 0)`;
        el2.style.setProperty("--gestopt", t > 0.55 ? "1" : "0");
      });
    };

    const wek = () => {
      if (!raf) raf = requestAnimationFrame(teken);
    };
    window.addEventListener("scroll", wek, { passive: true });
    window.addEventListener("resize", wek);
    teken();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", wek);
      window.removeEventListener("resize", wek);
    };
  }, [namen, meet]);

  return (
    <section
      ref={sectie}
      className="relative overflow-hidden"
      style={{ background: MINT_LICHT }}
      aria-label="Privacy"
    >
      <Golf kleur="#fcfbf7" flip vorm="oploopRechts" hoogte="h-[70px] sm:h-[118px]" />
      <KaartVlak
        kleur={VLAK_MINT}
        vorm="koepel"
        breedte={760}
        hoogte={360}
        style={{ right: "-15%", top: 90, transform: "rotate(-5deg)" }}
        className="hidden lg:block"
        tel={3}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-28 pt-28 lg:pb-32 lg:pt-32">
        <h2
          data-reveal
          className="max-w-2xl font-display text-[clamp(2.1rem,4.4vw,3.4rem)] font-black leading-[1.03] tracking-tight [text-wrap:balance]"
          style={{ color: DONKER }}
        >
          Namen komen hier niet voorbij.
        </h2>

        {/* ── het beeld ── */}
        <div ref={beeldRef} className="relative mt-14 grid gap-10 md:grid-cols-2 md:gap-0">
          {/* de grens zelf */}
          <div
            ref={lijnRef}
            className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px md:block"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(30,107,77,0.45) 12%, rgba(30,107,77,0.45) 88%, transparent)" }}
            aria-hidden
          >
            {/* de plek waar een naam de grens raakt, licht op */}
            <div
              ref={gloedRef}
              className="absolute left-1/2 top-0 h-24 w-24 rounded-full opacity-0"
              style={{
                background:
                  "radial-gradient(circle, rgba(47,158,110,0.55) 0%, rgba(47,158,110,0.18) 45%, rgba(47,158,110,0) 72%)",
              }}
            />
          </div>

          {/* links: wat jij schrijft */}
          <div className="md:pr-12">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-ink/45">
              Op jouw apparaat
            </p>
            <p className="mt-4 text-xl leading-9 text-ink/85 sm:text-2xl sm:leading-10">
              {delen.map((d, i) => (
                <span key={i}>
                  <span
                    ref={(r) => {
                      vanRefs.current[i] = r;
                    }}
                    onMouseEnter={() => setZweef(i)}
                    onMouseLeave={() => setZweef(-1)}
                    className="cursor-default font-bold underline decoration-2 underline-offset-4"
                    style={{ textDecorationColor: "#f59e0b" }}
                  >
                    {zweef === i ? SCHUILNAAM(i) : d.naam}
                  </span>
                  {d.staart}
                </span>
              ))}
            </p>

            <label className="mt-8 flex flex-wrap items-center gap-3 text-base text-ink/55">
              <span>Typ je eigen klas:</span>
              <input
                value={invoer}
                onChange={(e) => setInvoer(e.target.value)}
                spellCheck={false}
                autoComplete="off"
                placeholder={STANDAARD}
                aria-label="Namen van leerlingen uit je klas"
                className="min-w-[12rem] flex-1 rounded-xl border-[2px] border-[#cfe0d6] bg-white/70 px-4 py-2 text-base text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/15"
              />
            </label>
          </div>

          {/* rechts: wat er weggaat */}
          <div className="md:pl-12">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em]" style={{ color: KOP }}>
              Wat de AI ontvangt
            </p>
            <p className="mt-4 text-xl leading-9 text-ink/85 sm:text-2xl sm:leading-10">
              {delen.map((d, i) => (
                <span key={i}>
                  {/* de lege plek waar de schuilnaam neerkomt */}
                  <span
                    ref={(r) => {
                      naarRefs.current[i] = r;
                    }}
                    className="inline-block rounded-md align-baseline"
                    style={{
                      minWidth: `${SCHUILNAAM(i).length * 0.56}em`,
                      background: "rgba(47,158,110,0.10)",
                    }}
                  >
                    {/* Op een smal scherm vliegt er niets (de laag hieronder
                       staat op md:block), dus daar hoort de schuilnaam er
                       gewoon te staan — anders blijft het vakje eeuwig leeg. */}
                    <span className="px-1.5 font-bold text-[#1e6b4d] md:hidden">
                      {SCHUILNAAM(i)}
                    </span>
                    <span className="hidden md:inline" style={{ height: "1.1em" }} />
                  </span>
                  {d.staart}
                </span>
              ))}
            </p>
          </div>

          {/* de vliegende namen */}
          <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
            {namen.map((naam, i) => (
              <span
                key={i}
                ref={(r) => {
                  vliegRefs.current[i] = r;
                }}
                data-gemaskeerd="nee"
                className="absolute left-0 top-0 whitespace-nowrap rounded-md px-1.5 text-xl font-bold opacity-0 will-change-transform sm:text-2xl [&[data-gemaskeerd='ja']]:bg-brand/12 [&[data-gemaskeerd='ja']]:text-[#1e6b4d] [&[data-gemaskeerd='nee']]:text-ink"
              >
                {naam}
              </span>
            ))}
          </div>
        </div>

        {/* ── wat de grens niet eens haalt ── */}
        <div className="mt-16 flex flex-wrap items-center gap-x-3 gap-y-4">
          <span className="text-base text-ink/55">En dit gaat helemaal niet mee:</span>
          {BLIJFT.map((b, i) => (
            <span
              key={b}
              ref={(r) => {
                blijftRefs.current[i] = r;
              }}
              className="grens-chip relative rounded-full border-[2px] px-4 py-1.5 text-base font-semibold will-change-transform"
              style={{ borderColor: "#cfe0d6", color: "#1e6b4d", background: "rgba(255,255,255,0.6)" }}
            >
              {b}
            </span>
          ))}
        </div>

        <p data-reveal className="mt-10 max-w-xl text-lg leading-8 text-ink/70">
          Dit gebeurt in je eigen browser, nog voor er iets verstuurd wordt.
          Gegevens van leerlingen bewaren we niet.
        </p>
      </div>

      <style>{`
        /* het streepje dat door een chip valt zodra hij is tegengehouden */
        .grens-chip::after {
          content: "";
          position: absolute;
          left: 12%;
          right: 12%;
          top: 50%;
          height: 2px;
          background: #1e6b4d;
          border-radius: 2px;
          transform: scaleX(var(--gestopt, 0));
          transform-origin: left center;
          transition: transform .45s cubic-bezier(.2,.7,.2,1);
          opacity: .55;
        }
      `}</style>
    </section>
  );
}

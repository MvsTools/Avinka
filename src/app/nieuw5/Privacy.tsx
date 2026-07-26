"use client";

import { useEffect, useRef } from "react";
import { DONKER, Golf, KOP, MINT_LICHT, KaartVlak, VLAK_MINT } from "./Wereld";

/* ── De privacysectie: DE GRENS ────────────────────────────────────────────
   Je kunt hier zelf proberen iets naar buiten te slepen. Namen glippen er
   doorheen, maar hun naam wordt er op de grens vanaf geschraapt. Gegevens van
   leerlingen komen er niet doorheen, hoe hard je ook trekt.

   Dat is de belofte als natuurkunde in plaats van als tekst: je leest niet
   dát het niet kan, je merkt dat het niet lukt.

   WAAROM ZO — geleerd van de polaroids, het enige stuk van deze pagina dat
   echt van ons is. Wat die bijzonder maakte was niet het plaatje maar het
   gedrag: een echte slinger, met een tempo dat uit zijn eigen draadlengte
   volgde, en je kon eraan zitten. Diezelfde vier dingen zitten hier in:
   - de GRENS IS EEN MEMBRAAN, geen lijn. Hij staat strak en buigt door waar
     je iets tegenaan duwt — hetzelfde soort eigenschap als de doorzakkende
     waslijn: één stuk natuurkunde waar alles op reageert;
   - de kaartjes hebben MASSA. Een naamkaartje is licht, een dossier zwaar en
     traag. Dat verschil voel je in het slepen en het vertelt de regel al
     voordat je hem leest;
   - de naam wordt er op de grens LETTERLIJK AFGESCHRAAPT: de letters blijven
     aan jouw kant achter, vallen terug en lossen op. Het kaartje komt er aan
     de andere kant uit met alleen nog een schuilnaam;
   - wat over is, kan niet meer terug. Ook van de andere kant houdt het
     membraan hem tegen. Weg is weg.

   De rAF-lus slaapt zodra alles stilligt (les van de polaroids: 60x per
   seconde naar de DOM schrijven terwijl niemand kijkt is zonde), en alles
   gaat via transform zodat er geen layout per frame nodig is (les van het
   water, waar left/top het scrollen liet haperen).

   ⚠️ De schuilnamen hebben dezelfde vorm als in de echte maskeerlaag
   (public/avinka-masking.js). Er gaat op deze pagina niets de deur uit. ── */

type Kaartje = {
  id: string;
  soort: "naam" | "dossier";
  tekst: string;
  masker?: string;
  /* thuisplek links: fractie van de halve breedte, en van de hoogte */
  hx: number;
  hy: number;
  /* waar een overgestoken naamkaartje neerkomt, fractie van de rechterhelft */
  ux: number;
  uy: number;
  rot: number;
  /* zwaarder = trager achter je vinger aan, en veert harder terug */
  massa: number;
  /* Eigen plek op een smal scherm. Met de bureaublad-posities vielen de
     kaartjes daar over elkaar heen: de helft is dan nog geen 170px breed. */
  mhx: number;
  mhy: number;
  /* op een smal scherm laten we er eentje weg, anders is het te vol */
  wegOpSmal?: boolean;
};

const KAARTJES: Kaartje[] = [
  { id: "sofie", soort: "naam", tekst: "Sofie", masker: "leerling A", hx: 0.24, hy: 0.22, ux: 0.30, uy: 0.20, rot: -4, massa: 1, mhx: 0.36, mhy: 0.10 },
  { id: "daan", soort: "naam", tekst: "Daan", masker: "leerling B", hx: 0.66, hy: 0.62, ux: 0.62, uy: 0.56, rot: 3, massa: 1, mhx: 0.34, mhy: 0.47 },
  { id: "iris", soort: "naam", tekst: "Iris", masker: "leerling C", hx: 0.28, hy: 0.84, ux: 0.34, uy: 0.86, rot: -2, massa: 1, mhx: 0.36, mhy: 0.86 },
  { id: "toets", soort: "dossier", tekst: "toetsresultaten", hx: 0.62, hy: 0.18, ux: 0, uy: 0, rot: 2.5, massa: 2.6, mhx: 0.52, mhy: 0.28 },
  { id: "gesprek", soort: "dossier", tekst: "gespreksverslagen", hx: 0.26, hy: 0.52, ux: 0, uy: 0, rot: -3, massa: 2.9, mhx: 0.52, mhy: 0.66 },
  { id: "rapport", soort: "dossier", tekst: "rapportcijfers", hx: 0.70, hy: 0.90, ux: 0, uy: 0, rot: 1.5, massa: 2.4, mhx: 0.5, mhy: 0.5, wegOpSmal: true },
];

type Fysica = {
  x: number; y: number;
  vx: number; vy: number;
  plet: number; // hoe hard het tegen het membraan wordt geduwd, 0..1
  over: boolean;
};

const klem = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function WereldPrivacy() {
  const scene = useRef<HTMLDivElement>(null);
  const kaartRefs = useRef<Array<HTMLDivElement | null>>([]);
  const naamRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const schraapRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const membraanRef = useRef<SVGPathElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const veld = scene.current;
    if (!veld) return;

    const rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let B = 0;
    let H = 0;
    const grens = () => B / 2;

    const fys: Fysica[] = KAARTJES.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, plet: 0, over: false }));

    let smal = false;
    const thuis = (i: number) => {
      const k = KAARTJES[i];
      if (fys[i].over) return { x: grens() + k.ux * (B / 2), y: k.uy * H };
      const fx = smal ? k.mhx : k.hx;
      const fy = smal ? k.mhy : k.hy;
      return { x: fx * (B / 2), y: fy * H };
    };

    /* De halve breedte van elk kaartje wordt GEMETEN en niet aangenomen. Met
       een vaste waarde klopte het op mobiel niet meer: daar zijn de kaartjes
       kleiner, en een dossier bleek breder dan zijn eigen helft van de scène. */
    const halven: number[] = KAARTJES.map(() => 50);
    let gemeten = false;
    const meet = () => {
      const r = veld.getBoundingClientRect();
      const eerste = B === 0;
      B = r.width;
      H = r.height;
      smal = B < 520;
      kaartRefs.current.forEach((el, i) => {
        if (el) halven[i] = el.offsetWidth / 2;
      });
      if (eerste) {
        fys.forEach((f, i) => {
          const t = thuis(i);
          f.x = t.x;
          f.y = t.y;
        });
      }
      gemeten = true;
    };
    meet();

    const ro = new ResizeObserver(() => {
      meet();
      wek();
    });
    ro.observe(veld);

    /* ── slepen ──
       Eén luisteraar op de scène in plaats van zes losse handlers: welk
       kaartje je pakt staat in een data-attribuut. */
    let sleep: { i: number; dx: number; dy: number } | null = null;
    let muisX = 0;
    let muisY = 0;
    /* Het voordoen is een GESTUURDE beweging en geen zetje. Een impuls werkt
       hier niet: de terugveer haalt er binnen veertig pixels alles weer uit,
       dus het kaartje kwam nooit bij de grens. Nu wordt het kaartje even
       "vastgehouden" alsof er iemand aan trekt, en daarna losgelaten. */
    let demo: { i: number; t: number } | null = null;

    const opDown = (e: PointerEvent) => {
      const doel = (e.target as HTMLElement).closest<HTMLElement>("[data-kaart]");
      if (!doel) return;
      const i = Number(doel.dataset.kaart);
      const r = veld.getBoundingClientRect();
      muisX = e.clientX - r.left;
      muisY = e.clientY - r.top;
      sleep = { i, dx: muisX - fys[i].x, dy: muisY - fys[i].y };
      demo = null;
      doel.setPointerCapture?.(e.pointerId);
      if (hintRef.current) hintRef.current.style.opacity = "0";
      wek();
    };
    const opMove = (e: PointerEvent) => {
      if (!sleep) return;
      const r = veld.getBoundingClientRect();
      muisX = e.clientX - r.left;
      muisY = e.clientY - r.top;
      wek();
    };
    const opUp = () => {
      sleep = null;
      wek();
    };
    veld.addEventListener("pointerdown", opDown);
    window.addEventListener("pointermove", opMove, { passive: true });
    window.addEventListener("pointerup", opUp, { passive: true });
    window.addEventListener("pointercancel", opUp, { passive: true });

    /* de letters die op de grens achterblijven */
    const schraap: Array<{ t: number; x: number; y: number } | null> = KAARTJES.map(() => null);

    let raf = 0;
    let vorige = performance.now();

    const inRust = () => {
      if (sleep || demo) return false;
      for (let i = 0; i < KAARTJES.length; i++) {
        if (smal && KAARTJES[i].wegOpSmal) continue;
        const f = fys[i];
        const t = thuis(i);
        if (Math.abs(f.x - t.x) > 0.3 || Math.abs(f.y - t.y) > 0.3) return false;
        if (Math.abs(f.vx) > 0.4 || Math.abs(f.vy) > 0.4) return false;
        if (f.plet > 0.004) return false;
        if (schraap[i]) return false;
      }
      return true;
    };

    const stap = (nu: number) => {
      const dt = Math.min(0.032, (nu - vorige) / 1000);
      vorige = nu;
      if (!gemeten) meet();

      const G = grens();
      let bocht = 0;
      let bochtY = H / 2;

      if (demo) {
        demo.t += dt;
        if (demo.t > 1.45) demo = null;
      }

      for (let i = 0; i < KAARTJES.length; i++) {
        const k = KAARTJES[i];
        if (smal && k.wegOpSmal) continue;
        const f = fys[i];
        const t = thuis(i);
        const half = halven[i];

        /* Hoe hard je tegen het membraan duwt. Dit is de afstand tussen waar
           je vinger het kaartje naartoe TREKT en waar het membraan het
           tegenhoudt — niet de restoverschrijding na het klemmen. Dat laatste
           is per frame maar een paar pixels, waardoor de doorbuiging
           onzichtbaar bleef. */
        let druk = 0;

        if (sleep?.i === i || demo?.i === i) {
          /* achter je vinger aan, maar de massa remt: een dossier sleept
             merkbaar zwaarder dan een naamkaartje */
          let doelX: number;
          let doelY: number;
          if (sleep?.i === i) {
            doelX = muisX - sleep.dx;
            doelY = muisY - sleep.dy;
          } else {
            /* het voorgedane trekje: rustig naar net voorbij de grens */
            const v = Math.min(1, demo!.t / 1.15);
            const zacht = v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
            doelX = t.x + (G + 70 - t.x) * zacht;
            doelY = t.y;
          }
          druk = Math.max(0, doelX + half - G);
          const stijf = 240 / k.massa;
          f.vx += ((doelX - f.x) * stijf) * dt;
          f.vy += ((doelY - f.y) * stijf) * dt;
          f.vx *= Math.pow(0.0025, dt);
          f.vy *= Math.pow(0.0025, dt);
        } else {
          /* terugveren naar zijn plek, met nazwaai */
          const stijf = 54 / k.massa;
          f.vx += ((t.x - f.x) * stijf - f.vx * 8.6) * dt;
          f.vy += ((t.y - f.y) * stijf - f.vy * 8.6) * dt;
        }

        f.x += f.vx * dt;
        f.y += f.vy * dt;

        /* ── het membraan ── */
        if (k.soort === "dossier") {
          /* komt er niet doorheen: het membraan buigt door, het kaartje wordt
             platgeduwd, en het duwt terug */
          if (f.x + half > G) {
            f.x = G - half;
            f.vx = Math.min(f.vx, 0);
          }
          if (druk > 0) {
            /* het membraan geeft mee, het dossier wordt platter, en zodra je
               loslaat schiet het terug */
            f.plet = Math.min(1, druk / 120);
            if (druk > bocht) {
              bocht = druk;
              bochtY = f.y;
            }
          }
        } else if (!f.over) {
          /* een naam mag erdoor, maar loopt er vlak voor stroperig — dat
             hobbeltje is wat je in je vingers voelt */
          const afstand = G - (f.x + half);
          if (afstand < 46 && afstand > 0) {
            f.vx *= 0.87;
            const duw = (46 - afstand) * 0.8 + druk * 0.5;
            if (duw > bocht) {
              bocht = duw;
              bochtY = f.y;
            }
          }
          if (f.x + half >= G) {
            f.over = true;
            f.vx *= 1.3; // het plopje erdoorheen
            schraap[i] = { t: 0, x: G, y: f.y };
          }
        } else {
          /* weg is weg: van de overkant houdt het membraan hem ook tegen */
          if (f.x - half < G) {
            f.x = G + half;
            f.vx = Math.max(f.vx, 8);
            f.plet = Math.min(1, f.plet + 0.06);
          }
        }

        /* loslaten = de pletting dooft uit (tijdens duwen wordt hij elke frame
           opnieuw uit de druk gezet, dus dan heeft dit geen effect) */
        if (druk <= 0) f.plet *= Math.pow(0.02, dt);
        f.x = klem(f.x, half, B - half);
        f.y = klem(f.y, 34, H - 34);

        const el = kaartRefs.current[i];
        if (el) {
          const kantel = klem(f.vx * 0.05, -14, 14);
          el.style.transform =
            `translate3d(${f.x.toFixed(1)}px, ${f.y.toFixed(1)}px, 0) translate(-50%, -50%)` +
            ` rotate(${(k.rot + kantel).toFixed(1)}deg)` +
            ` scale(${(1 - f.plet * 0.11).toFixed(3)}, ${(1 + f.plet * 0.17).toFixed(3)})`;
          el.style.zIndex = sleep?.i === i ? "40" : String(10 + i);
        }
        const naam = naamRefs.current[i];
        if (naam && k.soort === "naam") {
          const wil = f.over ? k.masker! : k.tekst;
          if (naam.textContent !== wil) naam.textContent = wil;
          if (naam.dataset.gemaskeerd !== (f.over ? "ja" : "nee")) {
            naam.dataset.gemaskeerd = f.over ? "ja" : "nee";
          }
        }
      }

      /* de achtergebleven letters vallen terug en lossen op */
      for (let i = 0; i < KAARTJES.length; i++) {
        const s = schraap[i];
        const el = schraapRefs.current[i];
        if (!el) continue;
        if (!s) {
          if (el.style.opacity !== "0") el.style.opacity = "0";
          continue;
        }
        s.t += dt;
        const v = s.t / 1.15;
        if (v >= 1) {
          schraap[i] = null;
          el.style.opacity = "0";
          continue;
        }
        el.style.opacity = (1 - v * v).toFixed(2);
        el.style.transform =
          `translate3d(${(s.x - 30 - v * 34).toFixed(1)}px, ${(s.y + v * v * 96).toFixed(1)}px, 0)` +
          ` translate(-50%, -50%) rotate(${(-v * 30).toFixed(1)}deg)`;
      }

      if (membraanRef.current) {
        const b = Math.min(64, bocht * 0.62);
        membraanRef.current.setAttribute("d", `M ${G} 0 Q ${(G + b).toFixed(1)} ${bochtY.toFixed(1)} ${G} ${H}`);
        membraanRef.current.style.strokeOpacity = (0.38 + Math.min(0.5, b / 70)).toFixed(2);
      }

      if (inRust()) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(stap);
    };

    const wek = () => {
      if (raf || rustig) return;
      vorige = performance.now();
      raf = requestAnimationFrame(stap);
    };

    /* Eén keer voordoen. Niet iedereen sleept uit zichzelf, en als je het
       niet probeert mis je de hele sectie. */
    let voorgedaan = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || voorgedaan || rustig) return;
        voorgedaan = true;
        window.setTimeout(() => {
          demo = { i: 0, t: 0 };
          if (hintRef.current) hintRef.current.style.opacity = "1";
          wek();
        }, 750);
      },
      { rootMargin: "-14% 0px" },
    );
    io.observe(veld);

    stap(performance.now());
    if (rustig) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      veld.removeEventListener("pointerdown", opDown);
      window.removeEventListener("pointermove", opMove);
      window.removeEventListener("pointerup", opUp);
      window.removeEventListener("pointercancel", opUp);
    };
  }, []);

  return (
    <section className="relative overflow-hidden" style={{ background: MINT_LICHT }} aria-label="Privacy">
      <Golf kleur="#fcfbf7" flip vorm="oploopRechts" hoogte="h-[70px] sm:h-[118px]" />
      <KaartVlak
        kleur={VLAK_MINT}
        vorm="koepel"
        breedte={720}
        hoogte={340}
        style={{ right: "-16%", top: 80, transform: "rotate(-5deg)" }}
        className="hidden lg:block"
        tel={3}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-28 pt-28 lg:pb-32 lg:pt-32">
        <div className="max-w-2xl">
          <p data-reveal className="text-2xl" style={{ fontFamily: "var(--font-hand)", color: KOP }}>
            privacy voorop
          </p>
          <h2
            data-reveal
            className="mt-2 font-display text-[clamp(2.1rem,4.4vw,3.4rem)] font-black leading-[1.03] tracking-tight [text-wrap:balance]"
            style={{ color: DONKER }}
          >
            Er is één ding dat we bewust niet doen.
          </h2>
          <p data-reveal style={{ transitionDelay: "80ms" }} className="mt-6 text-xl leading-9 text-ink/75">
            Gegevens van leerlingen bewaren we niet. En hun namen gaan nooit
            naar de AI: die worden op jouw eigen apparaat vervangen door een
            schuilnaam, nog vóór er iets wordt verstuurd.
          </p>
        </div>

        <p
          ref={hintRef}
          className="mt-12 flex items-center gap-2 text-xl opacity-0 transition-opacity duration-700"
          style={{ fontFamily: "var(--font-hand)", color: KOP }}
        >
          sleep maar eens iets naar de overkant
          <svg viewBox="0 0 40 28" className="h-6 w-9" fill="none" stroke={KOP} strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M2 4 C 14 6, 26 10, 32 22" />
            <path d="M26 20 L 32.5 23 L 34 16" />
          </svg>
        </p>

        {/* ── de scène ── */}
        <div
          ref={scene}
          className="relative mt-4 h-[540px] touch-none select-none sm:h-[470px]"
        >
          <p className="pointer-events-none absolute left-0 top-0 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-ink/40">
            Op jouw apparaat
          </p>
          <p
            className="pointer-events-none absolute right-0 top-0 text-[0.68rem] font-bold uppercase tracking-[0.16em]"
            style={{ color: KOP }}
          >
            Wat er weggaat
          </p>

          {/* het membraan: geen getekende lijn maar iets dat gespannen staat */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            <path
              ref={membraanRef}
              fill="none"
              stroke={KOP}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="2 10"
              strokeOpacity="0.38"
            />
          </svg>

          {/* de letters die op de grens achterblijven */}
          {KAARTJES.map((k, i) => (
            <span
              key={`s-${k.id}`}
              ref={(r) => {
                schraapRefs.current[i] = r;
              }}
              className="pointer-events-none absolute left-0 top-0 whitespace-nowrap text-2xl opacity-0"
              style={{ fontFamily: "var(--font-hand)", color: "#a07c14" }}
              aria-hidden
            >
              {k.tekst}
            </span>
          ))}

          {/* de kaartjes */}
          {KAARTJES.map((k, i) => (
            <div
              key={k.id}
              data-kaart={i}
              ref={(r) => {
                kaartRefs.current[i] = r;
              }}
              className={`absolute left-0 top-0 cursor-grab will-change-transform active:cursor-grabbing ${
                k.wegOpSmal ? "hidden sm:block" : ""
              }`}
            >
              {k.soort === "naam" ? (
                /* Naamkaartje: licht, warm, handgeschreven — zoals het kaartje
                   op een bakje of boven aan een werkblad. */
                <span
                  className="flex h-[48px] w-[88px] items-center justify-center rounded-[14px] sm:h-[56px] sm:w-[108px] border-[2.5px] bg-white shadow-[-4px_12px_26px_-14px_rgba(23,80,58,0.55)]"
                  style={{ borderColor: "#d4e5dc" }}
                >
                  <span
                    ref={(r) => {
                      naamRefs.current[i] = r;
                    }}
                    data-gemaskeerd="nee"
                    className="text-[1.15rem] leading-none transition-[font-size] duration-200 sm:text-[1.4rem] [&[data-gemaskeerd='ja']]:text-[0.82rem] sm:[&[data-gemaskeerd='ja']]:text-[0.98rem] [&[data-gemaskeerd='ja']]:font-bold"
                    style={{ fontFamily: "var(--font-hand)", color: DONKER }}
                  >
                    {k.tekst}
                  </span>
                </span>
              ) : (
                /* Dossier: zwaarder, met een tab en liniaallijntjes. Dit is het
                   soort ding dat er helemaal niet uit gaat. */
                <span className="relative block w-[122px] pt-2.5 sm:w-[164px]">
                  <span className="absolute left-3 top-0 h-3 w-16 rounded-t-[7px]" style={{ background: "#dfe9dc" }} />
                  <span
                    className="relative block rounded-[10px] border-[2.5px] px-3.5 py-3 shadow-[-4px_12px_26px_-14px_rgba(23,80,58,0.55)]"
                    style={{ background: "#f7f5ee", borderColor: "#d4e5dc" }}
                  >
                    <span className="block text-[0.72rem] font-bold leading-tight sm:text-[0.84rem]" style={{ color: "#3c5147" }}>
                      {k.tekst}
                    </span>
                    <span className="mt-2 block h-[3px] w-3/4 rounded-full bg-ink/10" />
                    <span className="mt-1.5 block h-[3px] w-1/2 rounded-full bg-ink/10" />
                  </span>
                </span>
              )}
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-xl text-lg leading-8 text-ink/70">
          Een naam glipt erdoor, maar laat zijn naam aan deze kant achter.
          Gegevens van leerlingen komen er helemaal niet doorheen.
        </p>
      </div>
    </section>
  );
}

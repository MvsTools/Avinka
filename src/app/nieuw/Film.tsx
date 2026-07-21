"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* ──────────────────────────────────────────────────────────────────────────
   "De klok draait terug" — verticale plak (opening + beat 1: de rapporten).

   Je kijkt recht van boven op het bureau van een leerkracht, 18:15,
   avondlamp aan. Scrollen = de tijd terugdraaien: de klok loopt achteruit,
   de stapels ruimen zichzelf op, het licht wordt langzaam weer middag.
   De volledige film eindigt op 16:15 (precies 2 uur terug); deze plak
   spoelt het eerste half uur terug en stopt dan met een bouwnotitie.

   Techniek: CSS-sticky podium + één GSAP-tijdlijn met scrub. Alles is
   transform/opacity (geen layout-werk), zodat het soepel blijft op
   schoolse laptops. prefers-reduced-motion krijgt een stilstaande versie.
   ────────────────────────────────────────────────────────────────────────── */

const START_MIN = 18 * 60 + 15; // 18:15
const EIND_MIN = 17 * 60 + 40; // einde van deze plak: 17:40

const fmt = (m: number) => {
  const t = Math.round(m);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

export default function Film() {
  const root = useRef<HTMLDivElement>(null);
  const klokRef = useRef<{ min: number }>({ min: START_MIN });
  const [reduced, setReduced] = useState<boolean | null>(null);

  useEffect(() => {
    setReduced(!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useGSAP(
    () => {
      if (reduced !== false) return; // wachten tot we het zeker weten; reduced = geen film
      const q = gsap.utils.selector(root);

      const digitaal = q<HTMLElement>("[data-klok-digitaal]");
      const wUur = q<HTMLElement>("[data-wijzer-uur]");
      const wMin = q<HTMLElement>("[data-wijzer-min]");

      const zetKlok = () => {
        const m = klokRef.current.min;
        if (digitaal[0]) digitaal[0].textContent = fmt(m);
        const mi = m % 60;
        const uurDeg = ((m / 60) % 12) * 30 + mi * 0.5;
        const minDeg = mi * 6;
        if (wUur[0]) wUur[0].style.transform = `rotate(${uurDeg}deg)`;
        if (wMin[0]) wMin[0].style.transform = `rotate(${minDeg}deg)`;
      };
      zetKlok();

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: q("[data-podium-scroll]")[0],
          start: "top top",
          end: "bottom bottom",
          scrub: 0.9,
        },
      });

      /* De hele plak duurt 100 tijdlijn-eenheden. */

      // De klok spoelt continu terug: élke scrollbeweging is tijdreizen.
      tl.to(klokRef.current, { min: EIND_MIN, duration: 100, ease: "none", onUpdate: zetKlok }, 0);

      // Het avondlicht trekt heel langzaam weg (volledig daglicht pas in de hele film).
      tl.to(q("[data-avond]"), { opacity: 0.55, duration: 100, ease: "none" }, 0);
      tl.to(q("[data-daglicht]"), { opacity: 0.22, duration: 100, ease: "none" }, 0);

      // Beat 0 → uit: de openingsregel maakt plaats.
      tl.to(q("[data-beat0]"), { autoAlpha: 0, y: -46, duration: 8 }, 10);
      tl.to(q("[data-scrollhint]"), { autoAlpha: 0, duration: 4 }, 6);

      // Beat 1: Avinka wordt wakker. Het tabletscherm gaat aan…
      tl.to(q("[data-tab-standby]"), { autoAlpha: 0, duration: 4 }, 20);
      tl.fromTo(q("[data-tab-gloed]"), { autoAlpha: 0.2 }, { autoAlpha: 1, duration: 5 }, 20);

      // …en de rapporten vliegen niet zomaar wég: ze gaan Avinka ÍN.
      // (Doelpositie = het tabletscherm; gemeten, zodat het op elk formaat klopt.)
      const stapelEl = q("[data-stapel]")[0];
      const tabletEl = q("[data-tablet]")[0];
      let dx = 430;
      let dy = 190;
      if (stapelEl && tabletEl) {
        const s = stapelEl.getBoundingClientRect();
        const d = tabletEl.getBoundingClientRect();
        dx = d.left + d.width / 2 - (s.left + s.width / 2);
        dy = d.top + d.height / 2 - (s.top + s.height / 2);
      }
      q("[data-vel]").forEach((vel, i) => {
        tl.to(
          vel,
          {
            x: dx + (i % 2 === 0 ? 14 : -10),
            y: dy + i * 6,
            scale: 0.08,
            rotate: 14 - i * 7,
            autoAlpha: 0,
            duration: 13,
            ease: "power2.in",
          },
          26 + i * 3.2,
        );
      });
      // In het Avinka-scherm verschijnen de klaar-regels terwijl de vellen aankomen…
      q("[data-tab-rij]").forEach((rij, i) => {
        tl.fromTo(rij, { autoAlpha: 0, y: 7 }, { autoAlpha: 1, y: 0, duration: 4 }, 31 + i * 3.6);
      });
      // …met als slot een vinkje in de app.
      tl.fromTo(
        q("[data-tab-check]"),
        { autoAlpha: 0, scale: 0 },
        { autoAlpha: 1, scale: 1, duration: 4, ease: "back.out(2.4)" },
        46,
      );
      // De rode pen rolt weg: nakijken op papier hoeft niet meer.
      tl.to(q("[data-pen]"), { x: -560, y: -300, rotate: -74, autoAlpha: 0, duration: 11, ease: "power2.in" }, 34);

      // Camerabeweging: de hele plak zoomt heel langzaam uit, en de losse
      // spullen driften minimaal uiteen — dat geeft het platte vlak diepte.
      tl.fromTo(q("[data-zoom]"), { scale: 1.07 }, { scale: 1, duration: 100, ease: "none" }, 0);
      q("[data-drift]").forEach((el, i) => {
        tl.to(el, { y: -(26 + (i % 3) * 16), x: i % 2 === 0 ? 14 : -14, duration: 100, ease: "none" }, 0);
      });
      // …en het datalabel bevestigt de winst.
      tl.fromTo(
        q("[data-tag-rapporten]"),
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 5 },
        33,
      );
      tl.to(q("[data-tag-rapporten]"), { autoAlpha: 0, y: -10, duration: 5 }, 56);

      // Beat 1: tekst erbij, tekst eruit.
      tl.fromTo(q("[data-beat1]"), { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 8 }, 26);
      tl.to(q("[data-beat1]"), { autoAlpha: 0, y: -40, duration: 7 }, 52);

      // Teaser: wat de volgende beats worden.
      tl.fromTo(q("[data-teaser]"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 8 }, 62);
      tl.to(q("[data-teaser]"), { autoAlpha: 0, y: -26, duration: 6 }, 80);

      // Einde plak: scène dimt, bouwnotitie verschijnt.
      tl.to(q("[data-scene]"), { opacity: 0.28, scale: 0.985, duration: 10 }, 84);
      tl.fromTo(q("[data-einde]"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 8 }, 88);
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <div ref={root} className="bg-[#131022] text-cream">
      {/* ── Vaste laag: merk + klok ─────────────────────────────────── */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-between px-5 pt-5 sm:px-8 sm:pt-6">
        <a href="/" className="pointer-events-auto flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand shadow-lg shadow-brand/40">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span className="font-display text-2xl font-black lowercase tracking-tight text-cream">
            avinka
          </span>
        </a>
        <Klok />
      </header>

      {reduced ? (
        <StilVerhaal />
      ) : (
        <>
          {/* ── Het podium: 460vh scroll, de scène plakt in beeld ───── */}
          <div data-podium-scroll className="relative h-[460vh]">
            <div className="sticky top-0 h-screen overflow-hidden">
              {/* De scène (alles wat bij het bureau hoort) */}
              <div data-scene className="absolute inset-0">
                <div data-zoom className="absolute inset-0 will-change-transform">
                  <Bureau />
                </div>

                {/* Avondlaag: warme lamp-poel, verder donker */}
                <div
                  data-avond
                  className="pointer-events-none absolute inset-0"
                  style={{
                    opacity: 0.96,
                    background:
                      "radial-gradient(circle 62rem at 74% 10%, rgba(255,176,86,0.34), rgba(19,14,40,0.48) 48%, rgba(13,9,28,0.88) 82%)",
                  }}
                />
                {/* Daglicht-laag: schuift er heel langzaam overheen */}
                <div
                  data-daglicht
                  className="pointer-events-none absolute inset-0"
                  style={{
                    opacity: 0,
                    background:
                      "linear-gradient(200deg, rgba(255,236,200,0.55), rgba(255,214,150,0.12) 55%, transparent 80%)",
                    mixBlendMode: "screen",
                  }}
                />
                {/* Vignet + korrel: filmisch randje */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{ background: "radial-gradient(ellipse at 50% 42%, transparent 62%, rgba(8,5,20,0.45) 100%)" }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                  }}
                />
              </div>

              {/* ── Tekstlagen (over de scène) ────────────────────── */}
              <div data-beat0 className="absolute inset-x-0 bottom-[16vh] z-20 px-6 sm:bottom-[13vh] sm:px-12">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-amber-200/80 sm:text-xs">
                  18:15 · de school is al drie uur uit
                </p>
                <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.5rem,6vw,4.8rem)] font-black leading-[1.02] tracking-tight text-cream">
                  Jij zit hier nog.
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-cream/75 sm:text-lg sm:leading-8">
                  De klas was om kwart over drie leeg. Maar de rapporten, de
                  toetsen en de mails van ouders waren dat niet.
                </p>
              </div>

              <div data-beat1 className="absolute inset-x-0 bottom-[16vh] z-20 px-6 opacity-0 sm:bottom-[13vh] sm:px-12">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-brand-soft/90 sm:text-xs">
                  scroll terug · de ai van avinka neemt het typwerk over
                </p>
                <h2 className="mt-3 max-w-3xl font-display text-[clamp(2.2rem,5.2vw,4.2rem)] font-black leading-[1.04] tracking-tight text-cream">
                  De stapel gaat Avinka in. Klaar komt eruit.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-cream/75 sm:text-lg sm:leading-8">
                  Jij geeft per kind een paar steekwoorden, de AI schrijft er
                  jouw rapport van: in jouw woorden, met jouw blik. Jij leest na
                  en houdt het laatste woord. De stapel? Om 17:40 al van je bureau.
                </p>
              </div>

              <div data-teaser className="absolute inset-x-0 top-1/2 z-20 -translate-y-1/2 px-6 text-center opacity-0">
                <p className="mx-auto max-w-2xl font-display text-[clamp(1.8rem,4vw,3.2rem)] font-black leading-tight tracking-tight text-cream">
                  En zo gaat het door: de toetsen, de ouders, je les van morgen…
                </p>
                <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.3em] text-amber-200/80">
                  …tot de klok op 16:15 staat
                </p>
              </div>

              {/* Bouwnotitie: hier stopt de proefplak */}
              <div data-einde className="absolute inset-x-0 top-1/2 z-30 -translate-y-1/2 px-6 text-center opacity-0">
                <span className="inline-block rounded-full border border-cream/20 bg-cream/5 px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-cream/70">
                  einde proefplak
                </span>
                <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-cream/70">
                  De volledige film spoelt door naar 16:15: toetsen, oudercontact,
                  je les van morgen, het privacy-moment met het naamkaartje, en de
                  finale op een leeg bureau in de middagzon.
                </p>
              </div>

              {/* Scroll-hint */}
              <div data-scrollhint className="absolute inset-x-0 bottom-5 z-20 flex flex-col items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-cream/55">
                  scroll om de tijd terug te draaien
                </span>
                <svg viewBox="0 0 24 24" className="h-4 w-4 animate-bounce text-cream/55 motion-reduce:animate-none" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* ── Na de plak: korte bouwnotitie in rust ──────────────── */}
          <section className="mx-auto max-w-2xl px-6 py-24 text-center">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-cream/50">
              bouwnotitie · niet voor bezoekers
            </p>
            <p className="mt-4 text-base leading-7 text-cream/70">
              Dit was de verticale plak van &ldquo;De klok draait terug&rdquo;.
              Bevalt het scrollgevoel en de sfeer? Dan bouwen we in deze taal de
              volledige film, plus een kalme onderbouw met prijzen en vragen.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

/* ── De klok: analoog + digitaal, het instrument van de pagina ────────── */

function Klok() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-cream/15 bg-[#0d0a1c]/70 px-3.5 py-2 backdrop-blur">
      <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
        <circle cx="24" cy="24" r="22" fill="rgba(251,246,238,0.06)" stroke="rgba(251,246,238,0.35)" strokeWidth="2" />
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1="24"
            y1="4.5"
            x2="24"
            y2={i % 3 === 0 ? "8.5" : "7"}
            stroke="rgba(251,246,238,0.45)"
            strokeWidth={i % 3 === 0 ? 2 : 1}
            transform={`rotate(${i * 30} 24 24)`}
          />
        ))}
        <g data-wijzer-uur style={{ transformOrigin: "24px 24px", transform: "rotate(187.5deg)" }}>
          <line x1="24" y1="24" x2="24" y2="13" stroke="#fbf6ee" strokeWidth="2.6" strokeLinecap="round" />
        </g>
        <g data-wijzer-min style={{ transformOrigin: "24px 24px", transform: "rotate(90deg)" }}>
          <line x1="24" y1="24" x2="24" y2="8" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        </g>
        <circle cx="24" cy="24" r="1.8" fill="#fbf6ee" />
      </svg>
      <div className="text-right">
        <span data-klok-digitaal className="block font-mono text-lg font-bold tabular-nums leading-none text-cream">
          18:15
        </span>
        <span className="mt-1 block font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-cream/50">
          jouw tijd
        </span>
      </div>
    </div>
  );
}

/* ── Het bureau, recht van boven ──────────────────────────────────────────
   Realisme-afspraken voor élk voorwerp:
   - Licht komt van de lamp rechtsboven → slagschaduw valt naar linksonder
     (negatieve x, positieve y), plus een strakke contactschaduw.
   - Materialen: houtnerf + vezel op papier + glas op de schermen.
   - Twee lichtbronnen: warm lamplicht en (zodra Avinka wakker is) het
     koelwitte schermlicht van de tablet.
   ────────────────────────────────────────────────────────────────────────── */

const SCHADUW = "-18px 22px 36px rgba(6,4,14,0.5), -5px 7px 12px rgba(6,4,14,0.38)";
const SCHADUW_ZWAAR = "-24px 30px 48px rgba(6,4,14,0.55), -6px 9px 14px rgba(6,4,14,0.4)";
const PAPIER_NERF =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)' opacity='0.55'/%3E%3C/svg%3E\")";

function Bureau() {
  return (
    <div className="absolute inset-0">
      {/* Houten blad, full-bleed: warm, met nerf */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(112deg, #57402c 0%, #6b4f36 22%, #5d442e 41%, #6f5238 58%, #5a412c 76%, #684d34 100%)",
        }}
      />
      {/* Houtnerf: plankdelen + fijne nerven + organische ruis */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-45"
        style={{
          background:
            "repeating-linear-gradient(112deg, rgba(40,27,16,0.4) 0px, rgba(40,27,16,0.4) 1.5px, transparent 1.5px, transparent 148px), repeating-linear-gradient(112deg, rgba(46,32,20,0.2) 0px, transparent 2px, transparent 19px, rgba(46,32,20,0.13) 21px, transparent 23px, transparent 47px)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-25 mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='90'%3E%3Cfilter id='w'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.008 0.11' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23w)' opacity='0.75'/%3E%3C/svg%3E\")",
          transform: "rotate(22deg) scale(1.6)",
        }}
      />
      {/* Zachte sheen waar het lamplicht het blad raakt */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle 40rem at 74% 12%, rgba(255,214,150,0.10), transparent 65%)" }}
      />

      {/* Lamp: voet rechtsboven, de gloed zit in de avondlaag */}
      <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-[#241a10] shadow-[0_18px_50px_rgba(0,0,0,0.5)]" />
      <div className="absolute right-16 top-16 h-3 w-28 -rotate-[28deg] rounded-full bg-[#1c130b]/80" />

      {/* ── De rapportenstapel (beat 1) + rode pen ── */}
      <div data-stapel className="absolute left-[16%] top-[26%] sm:left-[24%]">
        {[4, 3, 2, 1].map((n) => (
          <div
            key={n}
            data-vel
            className="absolute rounded-[3px]"
            style={{
              width: "clamp(130px, 15vw, 215px)",
              height: "clamp(176px, 20.5vw, 292px)",
              background: `linear-gradient(160deg, ${n % 2 === 0 ? "#f3ecdd" : "#f0e8d8"}, ${n % 2 === 0 ? "#e9e0cd" : "#e6ddc9"})`,
              transform: `translate(${n * 5}px, ${-n * 6}px) rotate(${n % 2 === 0 ? n * 1.6 : -n * 1.3}deg)`,
              zIndex: 5 - n,
              boxShadow: n === 4 ? SCHADUW_ZWAAR : "-4px 5px 9px rgba(6,4,14,0.3)",
            }}
          >
            {n === 1 && <VelInhoud />}
          </div>
        ))}
        {/* het bovenste vel: een echt rapport, mét nakijkwerk-sporen */}
        <div
          data-vel
          className="relative z-10 rounded-[3px]"
          style={{
            width: "clamp(130px, 15vw, 215px)",
            height: "clamp(176px, 20.5vw, 292px)",
            background: "linear-gradient(160deg, #faf5ea 0%, #f4eddd 70%, #efe6d3 100%)",
            transform: "rotate(-2deg)",
            boxShadow: "-8px 10px 18px rgba(6,4,14,0.42), inset 0 0 26px rgba(120,100,70,0.08)",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 rounded-[3px] opacity-[0.35] mix-blend-multiply"
            style={{ backgroundImage: PAPIER_NERF }}
          />
          <VelInhoud boven />
        </div>
        {/* rode balpen, dwars op de stapel */}
        <div data-pen className="absolute -right-20 top-[58%] z-20 hidden h-3 w-36 rotate-[78deg] sm:block">
          <div
            className="h-full w-full rounded-full"
            style={{
              background:
                "linear-gradient(180deg, #e0616a 0%, #c22730 34%, #97161e 78%, #7c1118 100%)",
              boxShadow: "-6px 8px 12px rgba(6,4,14,0.45)",
            }}
          />
          {/* specular highlight + punt + clip */}
          <div className="absolute left-3 top-[3px] h-[3px] w-24 rounded-full bg-white/45" />
          <div
            className="absolute -right-4 top-1/2 h-[5px] w-5 -translate-y-1/2 rounded-r-full"
            style={{ background: "linear-gradient(180deg, #d8d8e2, #8a8a98)" }}
          />
          <div className="absolute -left-1.5 top-1/2 h-[6px] w-3 -translate-y-1/2 rounded-l-full bg-[#7c1118]" />
        </div>
      </div>

      {/* ── De Avinka-tablet: de helper die het bureau leegmaakt ── */}
      <div data-drift className="absolute right-[8%] top-[38%] sm:right-[21%] sm:top-[33%]">
        {/* schermgloed op het bureaublad */}
        <div
          data-tab-gloed
          aria-hidden
          className="absolute -inset-10 rounded-[3rem]"
          style={{
            opacity: 0.2,
            background: "radial-gradient(ellipse at 50% 45%, rgba(251,246,238,0.4), rgba(251,246,238,0.08) 55%, transparent 75%)",
            filter: "blur(6px)",
          }}
        />
        <div
          data-tablet
          className="relative rotate-[5deg] rounded-[22px] p-[10px]"
          style={{
            width: "clamp(168px, 19vw, 248px)",
            aspectRatio: "3/4",
            background: "linear-gradient(150deg, #1c1c24 0%, #0c0c12 55%, #16161e 100%)",
            boxShadow: SCHADUW_ZWAAR + ", inset -1px 1px 1px rgba(255,255,255,0.14)",
          }}
        >
          {/* het actieve Avinka-scherm */}
          <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[13px] bg-cream p-3">
            <div className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-brand">
                <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="font-display text-[13px] font-black lowercase tracking-tight text-ink">avinka</span>
              <span className="ml-auto font-mono text-[8px] font-bold uppercase tracking-widest text-ink/40">rapporten</span>
            </div>
            <div className="mt-2.5 flex flex-1 flex-col gap-1.5">
              {["Sofie", "Milan", "Noor"].map((naam) => (
                <div key={naam} data-tab-rij className="rounded-lg bg-white px-2 py-1.5 shadow-sm ring-1 ring-ink/5" style={{ opacity: 0 }}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-ink">{naam}</span>
                    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="#2f9e6e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-auto font-mono text-[7px] font-bold text-ink/35">in jouw toon</span>
                  </div>
                  <div className="mt-1 h-[2.5px] w-11/12 rounded-full bg-ink/15" />
                  <div className="mt-[3px] h-[2.5px] w-3/5 rounded-full bg-ink/10" />
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-brand-soft px-2 py-1 text-center font-mono text-[8px] font-bold text-brand-dark">
              5 rapporten · klaar om na te lezen
            </div>
            {/* het grote vinkje als alles binnen is */}
            <div data-tab-check className="absolute inset-0 z-10 flex items-center justify-center" style={{ opacity: 0 }}>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand shadow-xl shadow-brand/40">
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
            </div>
            {/* stand-by: donker glas met een rustig ademend vinkje */}
            <div
              data-tab-standby
              className="absolute inset-0 z-20 flex items-center justify-center rounded-[13px]"
              style={{ background: "linear-gradient(160deg, #14141c 0%, #0c0c12 100%)" }}
            >
              <span className="standby-vink flex h-9 w-9 items-center justify-center rounded-xl bg-brand/25">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#4fc08d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
              {/* glasreflectie */}
              <div
                aria-hidden
                className="absolute inset-0 rounded-[13px]"
                style={{ background: "linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.075) 46%, rgba(255,255,255,0.02) 55%, transparent 60%)" }}
              />
            </div>
          </div>
        </div>
        {/* datalabel bij de tablet: hier landt de winst */}
        <div data-tag-rapporten className="absolute -bottom-12 left-[30%] z-20 -translate-x-1/2 opacity-0">
          <span className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-brand/50 bg-[#0d0a1c]/85 px-3 py-2 font-mono text-[11px] font-bold text-cream backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            avinka · rapporten ✓ · 35 min terug
          </span>
        </div>
      </div>

      {/* ── Toetsen: uitslagenlijst + rekenmachine (beat 2, nog stil) ── */}
      <div data-drift className="absolute right-[2%] top-[70%] sm:right-[3%] sm:top-[69%]">
        <div
          className="relative rounded-[3px] p-3"
          style={{
            width: "clamp(150px, 17vw, 250px)",
            height: "clamp(120px, 13vw, 190px)",
            background: "linear-gradient(165deg, #f7f1e4 0%, #efe7d5 100%)",
            transform: "rotate(3.5deg)",
            boxShadow: SCHADUW,
          }}
        >
          <div aria-hidden className="absolute inset-0 rounded-[3px] opacity-30 mix-blend-multiply" style={{ backgroundImage: PAPIER_NERF }} />
          <p className="font-mono text-[7px] font-bold uppercase tracking-widest text-[#8d8069]">
            toetsuitslag · rekenen · groep 5
          </p>
          <div className="mt-1.5 space-y-[4px]">
            {[88, 72, 95, 64, 80, 91].map((w, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-[3px] rounded-full bg-[#a99c84]" style={{ width: 26 }} />
                <div className="h-[5px] rounded-[1px] bg-[#ddd2bc]" style={{ width: `${w * 0.55}%` }} />
                <span className="font-mono text-[6.5px] font-bold text-[#a4634f]">{[52, 38, 61, 33, 47, 58][i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div
          className="absolute -left-14 top-6 h-[104px] w-[68px] -rotate-6 rounded-[9px] p-2"
          style={{
            background: "linear-gradient(155deg, #2d2c38 0%, #1c1b26 60%, #24232f 100%)",
            boxShadow: SCHADUW + ", inset -1px 1px 1px rgba(255,255,255,0.1)",
          }}
        >
          <div
            className="flex h-6 items-center justify-end rounded-[4px] px-1.5 font-mono text-[10px] font-bold text-[#cfe3d3]"
            style={{ background: "linear-gradient(180deg, #46584a, #33443a)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.45)" }}
          >
            58,3
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-[13px] rounded-[3px]"
                style={{
                  background: "linear-gradient(180deg, #4b4a5a 0%, #37364a 100%)",
                  boxShadow: "0 1px 1px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Telefoon met ouder-berichten (beat 3, nog stil) ── */}
      <div
        data-drift
        className="absolute left-[42%] top-[12%] h-[172px] w-[84px] rotate-[7deg] rounded-[18px] p-[5px] sm:left-[47%] sm:top-[15%]"
        style={{
          background: "linear-gradient(150deg, #2a2a34 0%, #101016 45%, #1e1e28 100%)",
          boxShadow: SCHADUW + ", inset -1px 1px 1px rgba(255,255,255,0.16)",
        }}
      >
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[13px] bg-[#181824] p-1.5">
          {/* camera-eiland + statusregel */}
          <div className="mx-auto mb-1 h-[4px] w-8 rounded-full bg-black/70" />
          <span className="font-mono text-[7px] font-bold uppercase tracking-widest text-cream/45">ouders · 6 nieuw</span>
          <div className="mt-1 space-y-1">
            {[["S", "#7c9885"], ["M", "#8a7ca0"], ["J", "#a08a7c"]].map(([ltr, kleur], i) => (
              <div key={i} className="flex items-start gap-1.5 rounded-[7px] bg-[#242433] p-1.5">
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[7px] font-bold text-white/90"
                  style={{ background: kleur as string }}
                >
                  {ltr}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block h-[3px] w-3/4 rounded-full bg-cream/30" />
                  <span className="mt-[3px] block h-[3px] w-1/2 rounded-full bg-cream/15" />
                </span>
              </div>
            ))}
          </div>
          <span className="mt-auto self-end rounded-full bg-[#e0313b] px-1.5 py-[1px] font-mono text-[8px] font-bold text-white shadow-sm">
            6
          </span>
          {/* glasreflectie over het scherm */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.09) 38%, rgba(255,255,255,0.02) 48%, transparent 55%)" }}
          />
        </div>
      </div>

      {/* ── Lesmappen + plakbriefje (beat 4, nog stil) ── */}
      <div data-drift className="absolute left-[8%] top-[8%] hidden sm:block">
        {/* onderste map met papierranden die uitsteken */}
        <div
          className="relative h-40 w-56 -rotate-3 rounded-[6px]"
          style={{ background: "linear-gradient(155deg, #37695a 0%, #2a5245 100%)", boxShadow: SCHADUW_ZWAAR }}
        >
          <div className="absolute -right-1.5 top-4 h-28 w-2 rounded-r-[2px] bg-[#efe7d4]" style={{ boxShadow: "-1px 2px 3px rgba(6,4,14,0.3)" }} />
          <div className="absolute -right-2.5 top-8 h-16 w-2 rounded-r-[2px] bg-[#e5dcc6]" />
        </div>
        {/* bovenste kraft-map met tab en elastiek */}
        <div
          className="absolute left-7 top-6 h-40 w-56 rotate-2 rounded-[6px]"
          style={{
            background: "linear-gradient(155deg, #a97d58 0%, #8d6644 55%, #9a7350 100%)",
            boxShadow: SCHADUW + ", inset -1px 1px 1px rgba(255,255,255,0.12)",
          }}
        >
          <div className="absolute -top-2 left-6 h-4 w-20 rounded-t-[5px] bg-[#a97d58]" />
          <div className="absolute inset-y-3 right-5 w-[3px] rounded-full bg-[#4a3826]/60" />
          <p className="absolute left-4 top-5 font-mono text-[8px] font-bold uppercase tracking-widest text-[#4a3826]/70">
            lesvoorbereiding
          </p>
        </div>
        {/* plakbriefje met omgekruld hoekje */}
        <div
          className="absolute -right-9 bottom-2 flex h-[86px] w-[86px] rotate-6 items-center justify-center p-2 text-center font-display text-[11.5px] font-bold italic leading-tight text-ink/75"
          style={{
            background: "linear-gradient(150deg, #ffe993 0%, #f7dc6e 78%, #ecc94b 100%)",
            boxShadow: "-8px 10px 16px rgba(6,4,14,0.35)",
          }}
        >
          les morgen: breuken!
          <span
            aria-hidden
            className="absolute bottom-0 right-0 h-4 w-4"
            style={{ background: "linear-gradient(315deg, #131022 46%, #d9b83e 50%, #f2d766 100%)" }}
          />
        </div>
      </div>

      {/* ── Koffie: blijft tot het einde (die is verdiend) ── */}
      <div data-drift className="absolute right-[2%] top-[11%] sm:right-[31%] sm:top-[16%]">
        {/* schotel */}
        <div
          className="h-24 w-24 rounded-full"
          style={{
            background: "radial-gradient(circle at 62% 34%, #f7f1e6 0%, #e8e0cf 55%, #cfc5ae 100%)",
            boxShadow: SCHADUW + ", inset -2px 3px 6px rgba(6,4,14,0.18)",
          }}
        />
        {/* kop met dikke rand */}
        <div
          className="absolute left-1/2 top-1/2 h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle at 60% 32%, #fdfaf3 0%, #efe8d8 60%, #d6cbb2 100%)",
            boxShadow: "-4px 6px 10px rgba(6,4,14,0.35), inset -1px 2px 2px rgba(255,255,255,0.8)",
          }}
        />
        {/* koffie met crema-rand en glans */}
        <div
          className="absolute left-1/2 top-1/2 h-[54px] w-[54px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 58% 34%, #6b4226 0%, #402613 18%, #341d0e 45%, #241207 100%)",
            boxShadow: "inset -2px 3px 7px rgba(0,0,0,0.6), inset 0 0 0 3px rgba(158,113,74,0.35)",
          }}
        />
        <div className="absolute left-[54%] top-[38%] h-2.5 w-5 -rotate-12 rounded-full bg-white/12 blur-[1.5px]" />
        {/* oor */}
        <div
          className="absolute -right-3.5 top-1/2 h-9 w-5 -translate-y-1/2 rounded-r-full border-[5px]"
          style={{ borderColor: "#e9e1d0", boxShadow: "-3px 5px 7px rgba(6,4,14,0.3)" }}
        />
        {/* stoom: klein levend detail */}
        <svg viewBox="0 0 40 60" className="stoom absolute -top-10 left-1/2 h-14 w-9 -translate-x-1/2 text-white/20 blur-[1.5px]" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" aria-hidden>
          <path d="M14 52 C 8 40, 22 34, 16 20" />
          <path d="M27 54 C 21 44, 33 36, 26 24" opacity="0.7" />
        </svg>
      </div>

      <style>{`
        .stoom { animation: stoomOp 3.6s ease-in-out infinite; }
        @keyframes stoomOp {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: .45; }
          50% { transform: translateX(-50%) translateY(-7px); opacity: .85; }
        }
        .standby-vink { animation: ademen 2.8s ease-in-out infinite; }
        @keyframes ademen {
          0%, 100% { opacity: .45; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.07); }
        }
        @media (prefers-reduced-motion: reduce) { .stoom, .standby-vink { animation: none; } }
      `}</style>
    </div>
  );
}

/* Een geprint rapport-vel: kopregel, naam, alinea's van fijne tekstregels
   en (op het bovenste vel) een rood nakijk-krabbeltje. */
function VelInhoud({ boven = false }: { boven?: boolean }) {
  return (
    <div className="relative p-3 sm:p-4">
      {boven && (
        <>
          <p className="font-mono text-[7px] font-bold uppercase tracking-[0.2em] text-[#8d8069]">
            rapport · periode 2 · groep 5
          </p>
          <p className="mt-1 font-display text-[13px] font-black text-[#3d3428]">Sofie</p>
          <div className="mb-2 mt-1 h-px w-full bg-[#d8cdb6]" />
        </>
      )}
      {Array.from({ length: boven ? 9 : 6 }).map((_, i) => (
        <div
          key={i}
          className="mb-[7px] h-[2.5px] rounded-full"
          style={{
            width: `${[94, 86, 90, 58, 88, 79, 92, 68, 40][i % 9]}%`,
            background: boven ? "#a99c84" : "#bdb096",
          }}
        />
      ))}
      {boven && (
        <svg viewBox="0 0 60 14" className="absolute bottom-8 right-4 h-3 w-14 text-[#c22730]/70" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M3 9 C 10 4, 16 12, 23 7 C 30 2, 36 11, 44 6 C 50 3, 54 8, 57 6" />
        </svg>
      )}
    </div>
  );
}

/* ── prefers-reduced-motion: hetzelfde verhaal, zonder film ───────────── */

function StilVerhaal() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-28">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-amber-200/80">
        18:15 · de school is al drie uur uit
      </p>
      <h1 className="mt-4 font-display text-5xl font-black tracking-tight text-cream">
        Jij zit hier nog.
      </h1>
      <p className="mt-5 text-lg leading-8 text-cream/75">
        De klas was om kwart over drie leeg. Maar de rapporten, de toetsen en de
        mails van ouders waren dat niet. Avinka draait de klok voor je terug:
        elke week 2 uur, van 18:15 naar 16:15. De AI van Avinka neemt het
        uitzoek- en typwerk over: rapporten in jouw woorden, toetsen
        doorgerekend, ouders bijgepraat. Jij leest na en houdt het laatste
        woord. En de namen van je leerlingen? Die verlaten jouw computer nooit.
      </p>
    </div>
  );
}

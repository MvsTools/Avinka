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

      // Beat 1: de rapporten. Eerst een groene vink-stempel op de stapel…
      tl.fromTo(
        q("[data-stempel]"),
        { autoAlpha: 0, scale: 2.1, rotate: -18 },
        { autoAlpha: 1, scale: 1, rotate: -8, duration: 5, ease: "back.out(2.2)" },
        22,
      );
      // …dan glijden de vellen één voor één van het bureau (linksboven weg,
      // uit de buurt van de tekstzone linksonder)…
      q("[data-vel]").forEach((vel, i) => {
        tl.to(
          vel,
          {
            x: -(640 + i * 130),
            y: -(340 + i * 80),
            rotate: -30 - i * 8,
            autoAlpha: 0,
            duration: 14,
            ease: "power2.in",
          },
          27 + i * 3.4,
        );
      });
      // …de rode pen rolt met ze mee weg (die heb je niet meer nodig)…
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
                  scroll terug · de rapporten
                </p>
                <h2 className="mt-3 max-w-3xl font-display text-[clamp(2.2rem,5.2vw,4.2rem)] font-black leading-[1.04] tracking-tight text-cream">
                  De rapporten schrijven zichzelf.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-cream/75 sm:text-lg sm:leading-8">
                  In jouw woorden, met jouw blik op elk kind. Jij leest na en
                  houdt het laatste woord. De stapel? Die was je om 17:40 al kwijt.
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

/* ── Het bureau, recht van boven ──────────────────────────────────────── */

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
      {/* Houtnerf: lange subtiele strepen */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "repeating-linear-gradient(112deg, rgba(46,32,20,0.28) 0px, transparent 3px, transparent 26px, rgba(46,32,20,0.18) 29px, transparent 31px, transparent 68px)",
        }}
      />

      {/* Lamp: voet rechtsboven, de gloed zit in de avondlaag */}
      <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-[#241a10] shadow-[0_18px_50px_rgba(0,0,0,0.5)]" />
      <div className="absolute right-16 top-16 h-3 w-28 -rotate-[28deg] rounded-full bg-[#1c130b]/80" />

      {/* ── De rapportenstapel (beat 1) + rode pen ── */}
      <div className="absolute left-[16%] top-[26%] sm:left-[24%]">
        {[4, 3, 2, 1].map((n) => (
          <div
            key={n}
            data-vel
            className="absolute rounded-[4px] bg-[#f6efe2] shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
            style={{
              width: "clamp(130px, 15vw, 215px)",
              height: "clamp(176px, 20.5vw, 292px)",
              transform: `translate(${n * 5}px, ${-n * 6}px) rotate(${n % 2 === 0 ? n * 1.6 : -n * 1.3}deg)`,
              zIndex: 5 - n,
            }}
          >
            {n === 1 && <VelInhoud />}
          </div>
        ))}
        {/* het bovenste vel + de stempel */}
        <div
          data-vel
          className="relative z-10 rounded-[4px] bg-cream shadow-[0_14px_34px_rgba(0,0,0,0.5)]"
          style={{ width: "clamp(130px, 15vw, 215px)", height: "clamp(176px, 20.5vw, 292px)", transform: "rotate(-2deg)" }}
        >
          <VelInhoud boven />
          <div data-stempel className="absolute inset-0 z-20 flex items-center justify-center opacity-0">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-brand bg-brand/10 sm:h-20 sm:w-20">
              <svg viewBox="0 0 24 24" className="h-9 w-9 sm:h-11 sm:w-11" fill="none" stroke="#2f9e6e" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>
        </div>
        {/* datalabel naast de stapel */}
        <div data-tag-rapporten className="absolute -right-4 top-1/2 z-20 translate-x-full opacity-0">
          <span className="flex items-center gap-2 rounded-lg border border-brand/50 bg-[#0d0a1c]/85 px-3 py-2 font-mono text-[11px] font-bold text-cream backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            rapporten ✓ · 35 min terug
          </span>
        </div>
        {/* rode pen: naast de stapel, in het lamplicht */}
        <div data-pen className="absolute -right-24 top-[62%] z-10 hidden h-2.5 w-32 rotate-[78deg] sm:block">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-[#b3232a] via-[#d63a41] to-[#8f1b21] shadow-[0_6px_16px_rgba(0,0,0,0.45)]" />
          <div className="absolute -right-3 top-1/2 h-1.5 w-4 -translate-y-1/2 rounded-r-full bg-[#3a3a44]" />
        </div>
      </div>

      {/* ── Toetsen: rooster-vel + rekenmachine (beat 2, nog stil) ── */}
      <div data-drift className="absolute right-[10%] top-[52%] sm:right-[16%]">
        <div
          className="rounded-[4px] bg-[#f6efe2] p-3 shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
          style={{ width: "clamp(150px, 17vw, 250px)", height: "clamp(120px, 13vw, 190px)", transform: "rotate(3.5deg)" }}
        >
          <div className="mb-2 h-2 w-2/3 rounded-full bg-[#c7bba6]" />
          <div className="grid grid-cols-4 gap-1">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="h-3.5 rounded-[2px] bg-[#e6dcc8]" />
            ))}
          </div>
        </div>
        <div className="absolute -left-16 top-8 h-24 w-16 -rotate-6 rounded-lg bg-[#23222e] p-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.5)]">
          <div className="h-6 rounded-sm bg-[#9fb5a4]" />
          <div className="mt-1.5 grid grid-cols-3 gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-2.5 rounded-[2px] bg-[#3a3948]" />
            ))}
          </div>
        </div>
      </div>

      {/* ── Telefoon met ouder-berichten (beat 3, nog stil) ── */}
      <div data-drift className="absolute left-[52%] top-[16%] h-40 w-20 rotate-[7deg] rounded-2xl bg-[#1b1a26] p-1.5 shadow-[0_14px_34px_rgba(0,0,0,0.55)] sm:left-[48%]">
        <div className="flex h-full w-full flex-col gap-1.5 rounded-xl bg-[#242231] p-2">
          <span className="font-mono text-[8px] font-bold uppercase tracking-widest text-cream/45">ouders · 6 nieuw</span>
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-md bg-[#312f42] p-1.5">
              <div className="h-1.5 w-3/4 rounded-full bg-cream/25" />
              <div className="mt-1 h-1.5 w-1/2 rounded-full bg-cream/15" />
            </div>
          ))}
          <span className="mt-auto self-end rounded-full bg-[#d63a41] px-1.5 font-mono text-[9px] font-bold text-white">6</span>
        </div>
      </div>

      {/* ── Lesmap + plakbriefje (beat 4, nog stil) ── */}
      <div data-drift className="absolute left-[8%] top-[10%] hidden sm:block">
        <div className="h-40 w-56 -rotate-3 rounded-md bg-[#2e5e4c] shadow-[0_14px_34px_rgba(0,0,0,0.5)]" />
        <div className="absolute left-6 top-5 h-40 w-56 rotate-2 rounded-md bg-[#7a4b3a] shadow-[0_10px_26px_rgba(0,0,0,0.45)]" />
        <div className="absolute -right-8 bottom-3 flex h-20 w-20 rotate-6 items-center justify-center bg-[#ffe58f] p-2 text-center font-display text-[11px] font-bold leading-tight text-ink/80 shadow-[0_8px_18px_rgba(0,0,0,0.4)]">
          les morgen: breuken!
        </div>
      </div>

      {/* ── Koffie: blijft tot het einde (die is verdiend) ── */}
      <div data-drift className="absolute right-[26%] top-[18%] sm:right-[30%]">
        <div className="h-24 w-24 rounded-full bg-[#efe8da] shadow-[0_12px_28px_rgba(0,0,0,0.5)]" />
        <div className="absolute left-1/2 top-1/2 h-[74px] w-[74px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fbf6ee] shadow-inner" />
        <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3b2417]" />
        <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
        <div className="absolute -right-4 top-1/2 h-8 w-5 -translate-y-1/2 rounded-r-full border-4 border-[#efe8da]" />
        {/* stoom: klein levend detail */}
        <svg viewBox="0 0 40 60" className="stoom absolute -top-10 left-1/2 h-14 w-9 -translate-x-1/2 text-white/25" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
          <path d="M14 52 C 8 40, 22 34, 16 20" />
          <path d="M27 54 C 21 44, 33 36, 26 24" opacity="0.7" />
        </svg>
      </div>

      <style>{`
        .stoom { animation: stoomOp 3.6s ease-in-out infinite; }
        @keyframes stoomOp {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: .5; }
          50% { transform: translateX(-50%) translateY(-7px); opacity: .9; }
        }
        @media (prefers-reduced-motion: reduce) { .stoom { animation: none; } }
      `}</style>
    </div>
  );
}

/* Regels tekst op een rapport-vel; het bovenste vel heeft ook een naamkaartje. */
function VelInhoud({ boven = false }: { boven?: boolean }) {
  return (
    <div className="p-3 sm:p-4">
      {boven && (
        <span className="mb-2 inline-block rounded-md bg-[#ede9fe] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-[#5b21b6]">
          rapport · Sofie
        </span>
      )}
      {Array.from({ length: boven ? 8 : 5 }).map((_, i) => (
        <div
          key={i}
          className="mb-2 h-1.5 rounded-full bg-[#c7bba6]"
          style={{ width: `${[92, 78, 88, 60, 84, 72, 90, 48][i % 8]}%` }}
        />
      ))}
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
        elke week 2 uur, van 18:15 naar 16:15. De rapporten in jouw woorden, de
        toetsen doorgerekend, de ouders bijgepraat. En de namen van je
        leerlingen? Die verlaten jouw computer nooit.
      </p>
    </div>
  );
}

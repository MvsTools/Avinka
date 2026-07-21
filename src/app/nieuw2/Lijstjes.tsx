"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type SVGProps } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Prijzen from "@/components/Prijzen";
import { PROEF_DAGEN } from "@/lib/abonnement";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* ──────────────────────────────────────────────────────────────────────────
   "Twee lijstjes"

   Film (kort, Mercury-tempo): het papieren takenlijstje van vanavond in
   avondlicht. Een groene pen zet het eerste vinkje, Avinka vinkt de rest,
   het licht wordt weer dag. Daarna het kalme lijf: vijf twijfels die één
   voor één worden afgevinkt, met de twijfelbalk als voortgang én navigatie.

   Techniek: CSS-sticky podium + één GSAP-tijdlijn met scrub voor de film;
   IntersectionObserver + CSS voor alle beweging in het lijf.
   prefers-reduced-motion krijgt een stilstaand alternatief met dezelfde
   inhoud en boodschap.
   ────────────────────────────────────────────────────────────────────────── */

/* Het papieren lijstje: de taken van vanavond. Herkenning, geen tool-opsomming. */
const TAKEN = [
  "rapporten schrijven (groep 5)",
  "toetsen nakijken + analyse",
  "ouderberichten beantwoorden",
  "les van morgen voorbereiden",
  "werkblad breuken maken",
];

/* De vijf twijfels: dit is de informatie-structuur van de pagina. */
const TWIJFELS = [
  { id: "werkplek", kort: "Wat krijg ik?", vraag: "Wat krijg ik precies?" },
  { id: "tijdwinst", kort: "Tijdwinst", vraag: "Levert het echt tijd op?" },
  { id: "privacy", kort: "Privacy", vraag: "Is het veilig voor mijn leerlingen?" },
  { id: "gemak", kort: "Gemak", vraag: "Kan ik dit wel?" },
  { id: "prijzen", kort: "Prijs", vraag: "Wat kost het, en zit ik ergens aan vast?" },
] as const;

type TwijfelId = (typeof TWIJFELS)[number]["id"];

const TOOLS = [
  { naam: "Toetsanalyse", emoji: "📊", kleur: "bg-sky-500", tint: "bg-sky-50" },
  { naam: "Rapporten", emoji: "📝", kleur: "bg-violet-500", tint: "bg-violet-50" },
  { naam: "Oudercontact", emoji: "✉️", kleur: "bg-rose-500", tint: "bg-rose-50" },
  { naam: "Plattegrond", emoji: "🪑", kleur: "bg-amber-500", tint: "bg-amber-50" },
  { naam: "Lesontwerp", emoji: "📓", kleur: "bg-teal-500", tint: "bg-teal-50" },
];

const WINSTEN = [
  {
    taak: "Rapporten schrijven",
    winst: 35,
    uitleg: "Jij kent het kind, Avinka schrijft de voorzet in jouw toon.",
    demo: "rapport",
  },
  {
    taak: "Toetsen analyseren",
    winst: 45,
    uitleg: "Van cijferlijst naar inzicht, zonder avond in Excel.",
    demo: "analyse",
  },
  {
    taak: "Ouderberichten",
    winst: 15,
    uitleg: "Vriendelijk, duidelijk en in een paar minuten verstuurd.",
    demo: "bericht",
  },
  {
    taak: "Les voorbereiden",
    winst: 25,
    uitleg: "Eén leerdoel erin, een complete les eruit.",
    demo: "les",
  },
];

const FAQ = [
  {
    vraag: "Gaan de gegevens van mijn leerlingen ergens heen?",
    antwoord:
      "Nee. Namen, plaatsen en contactgegevens worden op je eigen apparaat onleesbaar gemaakt voordat er iets wordt verstuurd. Je account staat bovendien op beveiligde servers in Europa. Privacy is bij Avinka de ruggengraat, geen bijzaak.",
  },
  {
    vraag: "Moet ik verstand van AI of computers hebben?",
    antwoord:
      "Nee. Als je een e-mail kunt sturen, kun je met Avinka werken. Je typt of plakt wat je hebt en de tool doet de rest. Geen handleiding, geen technisch gedoe.",
  },
  {
    vraag: "Verzint de AI zelf cijfers of feiten?",
    antwoord:
      "Nee. Alle berekeningen doet de tool zelf, en die kloppen altijd. De AI schrijft alleen de tekst eromheen en verzint nooit getallen of feiten. Jij leest na en houdt altijd het laatste woord.",
  },
  {
    vraag: "Hoe werkt de gratis proefperiode?",
    antwoord: `Je probeert Avinka ${PROEF_DAGEN} dagen volledig gratis uit, met toegang tot alle tools. Je hoeft vooraf geen betaalgegevens in te vullen. Bevalt het? Dan kies je daarna zelf een abonnement. Wil je niet verder, dan stopt het vanzelf en betaal je niets.`,
  },
  {
    vraag: "Werkt het op mijn laptop, Chromebook of tablet?",
    antwoord:
      "Ja. Avinka werkt gewoon in je browser op elk apparaat. Je hoeft niets te installeren: inloggen en beginnen.",
  },
  {
    vraag: "Is het ook voor mijn hele school of team?",
    antwoord:
      "Avinka is nu gemaakt voor jou als individuele leerkracht. Een variant voor teams en scholen komt later.",
  },
];

/* Papier-textuur (subtiele nerf) voor het lijstje. */
const PAPIER_NERF =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)' opacity='0.4'/%3E%3C/svg%3E\")";

/* ── Kleine bouwstenen ─────────────────────────────────────────────────── */

/* Een getekend vinkje (stroke), voor de hand-vink en de sectiekoppen.
   Rest-props (zoals data-attributen voor de filmtijdlijn) gaan mee op de svg. */
function Vink({
  className,
  dik = 3.2,
  ...rest
}: { className?: string; dik?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden {...rest}>
      <path
        d="M4.5 12.5l5 5.5L19.5 6.5"
        stroke="currentColor"
        strokeWidth={dik}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
      />
    </svg>
  );
}

/* Het papieren lijstje. In de film half afgevinkt door de tijdlijn;
   in de reduced-versie en het slot volledig afgevinkt. */
function PapierLijstje({
  afgevinkt,
  film = false,
  className = "",
}: {
  afgevinkt: number; // hoeveel items al gevinkt zijn (statisch)
  film?: boolean; // true: vinkjes via data-attributen door GSAP bestuurd
  className?: string;
}) {
  return (
    <div
      data-papier
      className={`relative rounded-md bg-[#fdfaf2] px-6 pb-7 pt-5 shadow-[0_18px_50px_rgba(30,15,40,0.35)] ${className}`}
      style={{ backgroundImage: PAPIER_NERF }}
    >
      {/* rood kantlijntje, schoolschrift */}
      <div className="pointer-events-none absolute inset-y-0 left-10 w-px bg-rose-300/70" aria-hidden />
      <p className="font-hand pl-6 text-[1.35rem] font-semibold leading-none text-ink/80">
        vanavond nog:
      </p>
      <ul className="mt-3 space-y-2.5">
        {TAKEN.map((taak, i) => (
          <li key={taak} className="flex items-center gap-3 pl-1">
            <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] border-2 border-ink/30 bg-white/60">
              {film ? (
                <Vink
                  className={`h-5 w-5 text-brand ${i === 0 ? "vink-hand" : "vink-pop"}`}
                  {...(i === 0 ? { "data-vink-hand": true } : { "data-vink-pop": i })}
                />
              ) : (
                i < afgevinkt && <Vink className="h-5 w-5 text-brand" />
              )}
            </span>
            <span className="font-hand text-[1.3rem] leading-tight text-ink/85">{taak}</span>
          </li>
        ))}
      </ul>
      {/* ezelsoor */}
      <div
        className="pointer-events-none absolute -bottom-0 right-0 h-7 w-7 rounded-tl-md bg-[#efe6d2] shadow-[-2px_-2px_6px_rgba(30,15,40,0.12)]"
        aria-hidden
      />
    </div>
  );
}

/* ── De pagina ─────────────────────────────────────────────────────────── */

export default function Lijstjes({ fotoBestand }: { fotoBestand?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState<boolean | null>(null);
  const [klaar, setKlaar] = useState<Set<TwijfelId>>(new Set());

  /* Voor de eerste verf beslissen of we de film of de stille versie tonen. */
  useLayoutEffect(() => {
    setReduced(!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  }, []);

  /* ── De film ── */
  useGSAP(
    () => {
      if (reduced !== false) return;
      const q = gsap.utils.selector(root);

      const beats = q("[data-beat-a], [data-beat-b], [data-beat-c], [data-beat-d], [data-beat-e]");
      gsap.set(beats, { autoAlpha: 0 });
      gsap.set(q("[data-beat-a]"), { autoAlpha: 1 });
      gsap.set(q("[data-pen]"), { autoAlpha: 0, x: 90, y: 120, rotate: 12 });
      gsap.set(q("[data-daglicht], [data-dagtafel], [data-naad]"), { autoAlpha: 0 });
      const handVink = q<SVGPathElement>("[data-vink-hand] path");
      const popVinks = q("[data-vink-pop]");
      handVink.forEach((p) => gsap.set(p, { strokeDasharray: 1, strokeDashoffset: 1 }));
      gsap.set(popVinks, { autoAlpha: 0, scale: 0.5, transformOrigin: "50% 50%" });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: q("[data-film]")[0],
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      /* Beat A → B: herkenning maakt plaats voor de belofte. */
      tl.to(q("[data-beat-a]"), { autoAlpha: 0, y: -24, duration: 6 }, 8);
      tl.fromTo(q("[data-beat-b]"), { y: 24 }, { autoAlpha: 1, y: 0, duration: 7 }, 13);

      /* Camera zoomt rustig naar het lijstje. */
      tl.to(q("[data-scene]"), { scale: 1.22, yPercent: -4, duration: 26, ease: "power1.inOut" }, 14);

      /* De pen komt op en zet het eerste vinkje, met de hand. */
      tl.to(q("[data-pen]"), { autoAlpha: 1, x: 0, y: 0, rotate: 0, duration: 8 }, 20);
      handVink.forEach((p) => tl.to(p, { strokeDashoffset: 0, duration: 6, ease: "power1.out" }, 30));
      tl.to(q("[data-pen]"), { x: 26, y: -10, rotate: -6, duration: 6 }, 30);

      /* Belofte weg, het licht begint al te draaien, Avinka neemt het over.
         Het daglicht komt eerst, zodat de inkt-tekst nooit op donker staat. */
      tl.to(q("[data-beat-b]"), { autoAlpha: 0, y: -24, duration: 5 }, 40);
      tl.to(q("[data-pen]"), { autoAlpha: 0, x: 60, y: -40, duration: 6 }, 41);
      tl.to(q("[data-daglicht], [data-dagtafel]"), { autoAlpha: 1, duration: 20, ease: "power1.inOut" }, 42);
      tl.to(q("[data-naad]"), { autoAlpha: 1, duration: 14, ease: "power1.inOut" }, 68);
      tl.fromTo(q("[data-beat-c]"), { y: 24 }, { autoAlpha: 1, y: 0, duration: 6 }, 49);

      /* De cascade: Avinka vinkt de rest. */
      popVinks.forEach((v, i) =>
        tl.to(v, { autoAlpha: 1, scale: 1, duration: 3.5, ease: "back.out(2.2)" }, 54 + i * 4),
      );
      tl.to(q("[data-scene]"), { scale: 1.06, yPercent: 0, duration: 20, ease: "power1.inOut" }, 60);

      /* Handoff: en jouw twijfels? */
      tl.to(q("[data-beat-c]"), { autoAlpha: 0, y: -24, duration: 5 }, 72);
      tl.fromTo(q("[data-beat-e]"), { y: 24 }, { autoAlpha: 1, y: 0, duration: 7 }, 77);
      tl.to(q("[data-scrollhint]"), { autoAlpha: 0, duration: 4 }, 10).to(
        q("[data-scrollhint]"),
        { autoAlpha: 0, duration: 0.1 },
        99,
      );
    },
    { scope: root, dependencies: [reduced] },
  );

  /* ── Het lijf: reveals + twijfels afvinken ── */
  useEffect(() => {
    if (reduced === null) return;
    const el = root.current;
    if (!el) return;

    /* Reveals alleen mét beweging; de inhoud is zonder JS gewoon zichtbaar. */
    if (!reduced) el.classList.add("anim");

    const reveals = el.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -12% 0px" },
    );
    reveals.forEach((r) => io.observe(r));

    /* Sentinels: onderaan elke sectie wordt de twijfel afgevinkt. */
    const sentinels = el.querySelectorAll<HTMLElement>("[data-sentinel]");
    const ioSent = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.getAttribute("data-sentinel") as TwijfelId;
            setKlaar((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
            ioSent.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -20% 0px" },
    );
    sentinels.forEach((s) => ioSent.observe(s));

    /* De teller naar 120 minuten. */
    const teller = el.querySelector<HTMLElement>("[data-teller]");
    let raf = 0;
    if (teller) {
      const ioTel = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          ioTel.disconnect();
          if (reduced) {
            teller.textContent = "120";
            return;
          }
          const t0 = performance.now();
          const duur = 1400;
          const tick = (t: number) => {
            const p = Math.min(1, (t - t0) / duur);
            const eased = 1 - Math.pow(1 - p, 4);
            teller.textContent = String(Math.round(eased * 120));
            if (p < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        },
        { threshold: 0.6 },
      );
      ioTel.observe(teller);
    }

    return () => {
      io.disconnect();
      ioSent.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const naarSectie = (id: TwijfelId) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div ref={root} className="flex flex-1 flex-col bg-cream text-ink">
      <StijlBlok />

      {/* ── Bovenbalk: altijd aanwezig, ook tijdens de film. ── */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-black/5 bg-cream/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          {/* Gewone img: de dev-optimizer van next/image laadt traag (zelfde keuze als de v1-film). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Avinka_logo.png" alt="Avinka" className="h-8 w-auto sm:h-9" />
          <nav className="flex items-center gap-2 sm:gap-4">
            <a
              href="#prijzen"
              className="rounded-lg px-2 py-2 text-sm font-semibold text-ink/70 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:text-base"
            >
              <span className="hidden sm:inline">Liever meteen de feiten? </span>
              <span className="underline decoration-accent decoration-2 underline-offset-4">
                Prijzen
              </span>
            </a>
            <Link
              href="/sign-up"
              className="rounded-xl bg-brand-dark px-3.5 py-2 text-sm font-bold text-white shadow-sm shadow-brand/20 transition hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-4 sm:text-base"
            >
              Probeer gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* ══ DE FILM ══ */}
      {reduced ? (
        <StilAlternatief />
      ) : (
        <section data-film className="relative h-[340vh]" aria-label="Intro: het lijstje van vanavond">
          <div className="sticky top-0 h-screen overflow-hidden">
            {/* Avondlicht: warm, geen nacht. */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, #33244a 0%, #55345a 34%, #a05a3f 72%, #c97b3f 100%)",
              }}
              aria-hidden
            />
            {/* Daglicht schuift eroverheen tijdens de cascade. */}
            <div
              data-daglicht
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, #fbf6ee 0%, #f8efdd 55%, #f4e7c9 100%)",
              }}
              aria-hidden
            />

            {/* De scène: bureau met lijstje. */}
            <div data-scene className="absolute inset-0 will-change-transform">
              {/* tafelblad-suggestie onderin (avond) */}
              <div
                className="absolute inset-x-0 bottom-0 h-[46%]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(61,35,24,0) 0%, rgba(61,35,24,0.28) 30%, rgba(61,35,24,0.42) 100%)",
                }}
                aria-hidden
              />
              {/* hetzelfde tafelblad in daglicht: warm zand in plaats van modder */}
              <div
                data-dagtafel
                className="absolute inset-x-0 bottom-0 h-[46%]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(244,236,219,0) 0%, rgba(231,214,180,0.55) 35%, rgba(219,196,152,0.75) 100%)",
                }}
                aria-hidden
              />

              {/* het lijstje, iets gedraaid, rechts van het midden */}
              <div className="absolute left-1/2 top-[46%] w-[19rem] -translate-x-1/2 rotate-[-2.5deg] sm:left-[58%] sm:top-[42%] sm:w-[21rem]">
                <PapierLijstje afgevinkt={0} film />
                {/* de groene pen: punt op het eerste vakje, romp naar rechtsonder */}
                <div data-pen className="absolute left-2 top-11 h-0 w-0">
                  <svg
                    viewBox="0 0 120 20"
                    className="w-36 origin-[6px_10px] rotate-[38deg] drop-shadow-[-8px_12px_10px_rgba(30,15,40,0.35)]"
                    aria-hidden
                  >
                    <path d="M4 10L20 4.5 20 15.5z" fill="#e7d9b8" />
                    <path d="M4 10L11 7.6 11 12.4z" fill="#221c3a" />
                    <rect x="20" y="4" width="74" height="12" rx="6" fill="#2f9e6e" />
                    <rect x="88" y="4" width="6" height="12" fill="#25855a" />
                    <rect x="94" y="4.5" width="22" height="11" rx="5.5" fill="#25855a" />
                  </svg>
                </div>
              </div>

              {/* koud kopje thee, bovenaanzicht */}
              <div className="absolute left-[12%] top-[58%] hidden sm:block" aria-hidden>
                <div className="relative h-20 w-20 rounded-full bg-[#efe6d2] shadow-[-10px_14px_24px_rgba(30,15,40,0.3)]">
                  <div className="absolute inset-2 rounded-full bg-[#8a5a33]" />
                  <div className="absolute -right-3 top-7 h-6 w-5 rounded-r-full border-4 border-[#efe6d2]" />
                </div>
              </div>

              {/* stapel schriften, bovenaanzicht */}
              <div className="absolute right-[6%] top-[16%] hidden sm:block" aria-hidden>
                <div className="absolute rotate-[9deg]">
                  <div className="h-40 w-32 rounded-md bg-[#b89a3f] shadow-[-10px_14px_22px_rgba(30,15,40,0.3)]" />
                </div>
                <div className="absolute left-2 top-3 rotate-[3deg]">
                  <div className="h-40 w-32 rounded-md bg-[#3f6db8] shadow-[-8px_10px_16px_rgba(30,15,40,0.25)]" />
                </div>
                <div className="relative left-4 top-6 rotate-[-4deg]">
                  <div className="h-40 w-32 rounded-md bg-[#b8563f] shadow-[-8px_10px_16px_rgba(30,15,40,0.25)]">
                    <div className="absolute inset-x-4 top-5 h-10 rounded-sm bg-[#fdfaf2]/85" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Tekstbeats: bovenin, nooit over het lijstje. ── */}
            <div className="absolute inset-x-0 top-[4.5rem] z-10 px-6 sm:top-[5.5rem]">
              <div className="mx-auto w-full max-w-6xl">
                <div className="relative min-h-[9.5rem] max-w-xl">
                  <p
                    data-beat-a
                    className="absolute font-display text-4xl font-black leading-[1.05] tracking-tight text-[#fdf7ec] [text-shadow:0_2px_24px_rgba(30,15,40,0.4)] sm:text-5xl"
                  >
                    Het lijstje van vanavond.
                    <span className="mt-3 block font-sans text-lg font-semibold text-[#fdf7ec]/85 sm:text-xl">
                      Herken je het?
                    </span>
                  </p>
                  <h1
                    data-beat-b
                    className="absolute font-display text-4xl font-black leading-[1.05] tracking-tight text-[#fdf7ec] [text-shadow:0_2px_24px_rgba(30,15,40,0.4)] sm:text-5xl"
                  >
                    Avinka geeft je die avonden terug.
                    <span className="mt-3 block font-sans text-lg font-semibold text-[#fdf7ec]/85 sm:text-xl">
                      Elke week zo&apos;n 2 uur. Kijk maar.
                    </span>
                  </h1>
                  <p
                    data-beat-c
                    className="absolute font-display text-4xl font-black leading-[1.05] tracking-tight text-ink sm:text-5xl"
                  >
                    Avinka vinkt je taken af.
                    <span className="mt-3 block font-sans text-lg font-semibold text-ink/70 sm:text-xl">
                      Jij kijkt na en houdt het laatste woord.
                    </span>
                  </p>
                  <p
                    data-beat-e
                    className="absolute font-display text-4xl font-black leading-[1.05] tracking-tight text-ink sm:text-5xl"
                  >
                    En jouw twijfels?
                    <span className="mt-3 block font-sans text-lg font-semibold text-ink/70 sm:text-xl">
                      Die vinken we hieronder af. Eén voor één.
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* zachte naad naar de crème-body, komt op met het daglicht */}
            <div
              data-naad
              className="absolute inset-x-0 bottom-0 h-28"
              style={{
                background: "linear-gradient(180deg, rgba(251,246,238,0) 0%, #fbf6ee 92%)",
              }}
              aria-hidden
            />

            {/* scrollhint */}
            <div
              data-scrollhint
              className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-1 text-[#fdf7ec]/90"
              aria-hidden
            >
              <span className="text-sm font-semibold">Scroll maar rustig</span>
              <span className="hintzweef text-xl leading-none">↓</span>
            </div>
          </div>
        </section>
      )}

      {/* ══ HET LIJF ══ */}
      <main className="relative z-10 bg-cream">
        {/* De twijfelbalk: voortgang én navigatie. */}
        <div className="sticky top-[3.4rem] z-30 border-b border-black/5 bg-cream/90 backdrop-blur sm:top-[3.9rem]">
          <nav
            aria-label="De vijf twijfels"
            className="twijfelnav mx-auto flex w-full max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 sm:gap-2 sm:px-6"
          >
            <span className="mr-1 hidden shrink-0 text-sm font-bold text-ink/50 md:inline">
              Jouw twijfels:
            </span>
            {TWIJFELS.map((t) => {
              const done = klaar.has(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => naarSectie(t.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                    done ? "bg-brand-soft text-brand-dark" : "text-ink/60 hover:bg-black/5 hover:text-ink"
                  }`}
                >
                  <span
                    className={`flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border-2 ${
                      done ? "border-brand bg-brand text-white" : "border-ink/30 bg-white"
                    }`}
                  >
                    {done && <Vink className="vinkpop h-3 w-3" dik={4} />}
                  </span>
                  {t.kort}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── 1. Wat krijg ik precies? ── */}
        <section id="werkplek" className="scroll-mt-28">
          <div className="mx-auto w-full max-w-6xl px-6 pb-24 pt-16 sm:pt-20">
            <SectieKop
              nummer={1}
              vraag={TWIJFELS[0].vraag}
              done={klaar.has("werkplek")}
              antwoord="Je eigen werkplek, met alle AI-tools op één plek."
            />
            <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1fr_1.15fr]">
              <div data-reveal className="max-w-md text-lg leading-8 text-ink/75">
                <p>
                  Geen losse websites en documenten meer. Je logt één keer in en alles
                  staat klaar: je klassen, je tools en je bewaarde werk. Elke tool is
                  gemaakt voor het echte werk in de klas, niet als technisch speeltje.
                </p>
                <p className="mt-4">
                  En het groeit met je mee. Er komen steeds nieuwe tools bij, zonder
                  dat je er iets voor hoeft te doen.
                </p>
              </div>

              {/* Dashboard-mockup */}
              <div data-reveal className="relative">
                <div className="rounded-2xl border border-black/5 bg-white p-3 shadow-[0_24px_60px_rgba(34,28,58,0.12)]">
                  <div className="flex items-center gap-1.5 px-2 pb-2 pt-1" aria-hidden>
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    <span className="ml-3 h-5 flex-1 rounded-md bg-cream text-center text-[10px] font-semibold leading-5 text-ink/40">
                      avinka.nl/dashboard
                    </span>
                  </div>
                  <div className="rounded-xl bg-cream p-4 sm:p-5">
                    <p className="font-display text-xl font-black text-ink">
                      Goedemiddag! Wat vinken we af?
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {TOOLS.map((tool, i) => (
                        <div
                          key={tool.naam}
                          data-reveal
                          style={{ transitionDelay: `${i * 70}ms` }}
                          className={`rounded-xl border border-black/5 ${tool.tint} p-3`}
                        >
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-base text-white ${tool.kleur}`}
                          >
                            {tool.emoji}
                          </span>
                          <p className="mt-2 text-sm font-bold text-ink">{tool.naam}</p>
                        </div>
                      ))}
                      <div
                        data-reveal
                        style={{ transitionDelay: "350ms" }}
                        className="rounded-xl border-2 border-dashed border-black/10 p-3"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-sm">
                          ✨
                        </span>
                        <p className="mt-2 text-sm font-bold text-ink/60">Binnenkort meer</p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-center text-sm font-semibold text-ink/50">
                  Zo ziet je dashboard eruit: alles op één plek, klaar om af te vinken.
                </p>
              </div>
            </div>
          </div>
          <div data-sentinel="werkplek" aria-hidden />
        </section>

        {/* ── 2. Levert het echt tijd op? ── */}
        <section id="tijdwinst" className="scroll-mt-28 border-y border-black/5 bg-white">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <SectieKop
              nummer={2}
              vraag={TWIJFELS[1].vraag}
              done={klaar.has("tijdwinst")}
              antwoord="Reken maar mee. Vier taken, één werkweek."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {WINSTEN.map((w, i) => (
                <div
                  key={w.taak}
                  data-reveal
                  style={{ transitionDelay: `${i * 90}ms` }}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-black/5 bg-cream p-6"
                >
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-black text-ink">{w.taak}</h3>
                    <p className="mt-1.5 leading-7 text-ink/70">{w.uitleg}</p>
                    <MiniDemo soort={w.demo} />
                  </div>
                  <span className="shrink-0 rounded-full bg-brand-soft px-3 py-1.5 text-sm font-bold tabular-nums text-brand-dark">
                    +{w.winst} min
                  </span>
                </div>
              ))}
            </div>
            <div data-reveal className="mt-12 text-center">
              <p className="font-display text-3xl font-black tracking-tight text-ink sm:text-4xl">
                Samen{" "}
                <span className="text-brand">
                  <span data-teller className="tabular-nums">
                    0
                  </span>{" "}
                  minuten
                </span>{" "}
                per week.
              </p>
              <p className="mt-3 text-lg font-semibold text-ink/60">
                Dat zijn je twee uur. Elke week weer.
              </p>
            </div>
          </div>
          <div data-sentinel="tijdwinst" aria-hidden />
        </section>

        {/* ── 3. Is het veilig voor mijn leerlingen? ── */}
        <section id="privacy" className="scroll-mt-28">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <SectieKop
              nummer={3}
              vraag={TWIJFELS[2].vraag}
              done={klaar.has("privacy")}
              antwoord="Ja. Namen van leerlingen blijven thuis."
            />
            <div className="mt-10 grid items-center gap-10 lg:grid-cols-2">
              {/* De maskeer-demo */}
              <div data-reveal className="maskeer rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-sm font-bold text-ink/50">Jij typt:</p>
                <p className="mt-2 text-xl leading-9 text-ink">
                  &ldquo;
                  <span className="relative">
                    <span className="naam-echt font-bold">Sofie</span>
                    <span className="naam-masker font-bold text-brand-dark">leerling A</span>
                  </span>{" "}
                  heeft hard gewerkt aan haar tafels.&rdquo;
                </p>
                <div className="mt-5 flex items-center gap-3 rounded-xl bg-brand-soft p-4">
                  <svg viewBox="0 0 24 24" className="schildje h-8 w-8 shrink-0 text-brand-dark" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  <p className="text-base font-semibold leading-6 text-brand-dark">
                    Voordat er iets wordt verstuurd, maakt Avinka de naam op jouw eigen
                    apparaat onleesbaar. De AI ziet alleen &ldquo;leerling A&rdquo;.
                  </p>
                </div>
              </div>
              <div data-reveal className="max-w-md text-lg leading-8 text-ink/75">
                <p>
                  Privacy is bij Avinka de ruggengraat, geen bijzaak. Namen, plaatsen en
                  contactgegevens gaan nooit naar de AI. Jouw account staat op beveiligde
                  servers in Europa.
                </p>
                <p className="mt-4">
                  In je rapport of bericht staat gewoon weer de echte naam. Alleen jij
                  ziet die, niemand anders.
                </p>
              </div>
            </div>
          </div>
          <div data-sentinel="privacy" aria-hidden />
        </section>

        {/* ── 4. Kan ik dit wel? ── */}
        <section id="gemak" className="scroll-mt-28 border-y border-black/5 bg-white">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <SectieKop
              nummer={4}
              vraag={TWIJFELS[3].vraag}
              done={klaar.has("gemak")}
              antwoord="Als je een e-mail kunt sturen, kun je dit."
            />
            <div className="mt-10 grid items-start gap-10 lg:grid-cols-2">
              <div data-reveal className="max-w-md text-lg leading-8 text-ink/75">
                <p>
                  Geen handleiding, geen cursus, geen technisch gedoe. Je typt of plakt
                  wat je hebt, klikt op de knop en leest het resultaat na. Meer is het
                  niet.
                </p>
                <p className="mt-4">
                  En jij beslist altijd. Avinka schrijft de voorzet, jij past aan wat je
                  wilt. Niets gaat zonder jou de deur uit.
                </p>
              </div>

              {/* Maker-kaart: van een leerkracht, voor leerkrachten */}
              <div data-reveal className="rounded-2xl border border-black/5 bg-cream p-7 shadow-sm sm:p-8">
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft ring-2 ring-brand/20">
                    {fotoBestand ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/${fotoBestand}`}
                        alt="Michael van Spanje, leerkracht en maker van Avinka"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="font-display text-lg font-black text-brand-dark">MvS</span>
                    )}
                  </span>
                  <div>
                    <p className="font-display text-xl font-black text-ink">
                      Van een leerkracht, voor leerkrachten
                    </p>
                    <p className="text-sm font-semibold text-ink/55">
                      Michael van Spanje, maker van Avinka
                    </p>
                  </div>
                </div>
                <p className="mt-5 leading-8 text-ink/75">
                  &ldquo;Ik sta zelf voor de klas en ik ken dat lijstje van vanavond uit
                  mijn hoofd. Daarom bouw ik Avinka: praktische hulp die direct tijd
                  bespaart en zorgvuldig omgaat met de privacy van je leerlingen. Goede
                  leerkrachten horen hun tijd te besteden aan leerlingen, niet aan
                  onnodig papierwerk.&rdquo;
                </p>
                <p className="font-hand mt-4 text-2xl text-ink/80">Michael</p>
              </div>
            </div>
          </div>
          <div data-sentinel="gemak" aria-hidden />
        </section>

        {/* ── 5. Wat kost het? ── */}
        <section id="prijzen" className="scroll-mt-28">
          <div className="mx-auto w-full max-w-6xl px-6 pt-20">
            <SectieKop
              nummer={5}
              vraag={TWIJFELS[4].vraag}
              done={klaar.has("prijzen")}
              antwoord={`Probeer eerst ${PROEF_DAGEN} dagen gratis, zonder betaalgegevens.`}
            />
          </div>
          <Prijzen />
          <div className="mx-auto w-full max-w-3xl px-6 pb-4">
            <p data-reveal className="text-center text-lg leading-8 text-ink/70">
              Het maandabonnement zeg je op wanneer je wilt, zonder kleine lettertjes.
              Kies je per schooljaar, dan zijn juli en augustus gratis.
            </p>
          </div>

          {/* FAQ */}
          <div id="vragen" className="mx-auto w-full max-w-3xl scroll-mt-28 px-6 py-16">
            <h3 className="text-center font-display text-3xl font-black tracking-tight text-ink">
              Nog een paar eerlijke vragen
            </h3>
            <div className="mt-8 space-y-3">
              {FAQ.map((item) => (
                <details
                  key={item.vraag}
                  className="group/faq rounded-2xl border border-black/5 bg-white p-5"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg text-lg font-bold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
                    {item.vraag}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-dark text-white transition-transform group-open/faq:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 leading-8 text-ink/70">{item.antwoord}</p>
                </details>
              ))}
            </div>
          </div>
          <div data-sentinel="prijzen" aria-hidden />
        </section>

        {/* ── Slot: alles afgevinkt ── */}
        <section className="border-t border-black/5 bg-white">
          <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center">
            <div data-reveal className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand text-white shadow-lg shadow-brand/25">
              <Vink className="slotvink h-11 w-11" dik={3.6} />
            </div>
            <h2 data-reveal className="mt-7 font-display text-4xl font-black tracking-tight text-ink sm:text-5xl">
              Alles afgevinkt.
            </h2>
            <p data-reveal className="mx-auto mt-5 max-w-xl text-lg leading-8 text-ink/70">
              Vijf twijfels, vijf antwoorden. Wat overblijft is het proberen zelf:{" "}
              {PROEF_DAGEN} dagen gratis, alle tools, geen betaalgegevens vooraf.
            </p>
            <div data-reveal className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="w-full rounded-2xl bg-brand-dark px-8 py-4 text-lg font-bold text-white shadow-lg shadow-brand/25 transition hover:-translate-y-0.5 hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto"
              >
                Probeer Avinka gratis
              </Link>
              <a
                href="#werkplek"
                className="w-full rounded-2xl border-2 border-ink/10 bg-white px-8 py-4 text-lg font-bold text-ink transition hover:border-ink/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto"
              >
                Lees nog eens terug
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ── Sectiekop: het benoemde twijfel-systeem (checkbox + vraag). ───────── */
function SectieKop({
  nummer,
  vraag,
  antwoord,
  done,
}: {
  nummer: number;
  vraag: string;
  antwoord: string;
  done: boolean;
}) {
  return (
    <div data-reveal className="max-w-3xl">
      <div className="flex items-start gap-4">
        <span
          className={`mt-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 transition-colors sm:mt-3 sm:h-10 sm:w-10 ${
            done ? "border-brand bg-brand text-white" : "border-ink/25 bg-white text-transparent"
          }`}
          aria-hidden
        >
          <Vink className={`h-6 w-6 ${done ? "vinkpop" : ""}`} dik={3.6} />
        </span>
        <div>
          <h2 className="font-display text-3xl font-black leading-tight tracking-tight text-ink sm:text-4xl">
            <span className="sr-only">Twijfel {nummer}: </span>
            {vraag}
          </h2>
          <p className="mt-2.5 text-lg font-semibold text-brand-dark sm:text-xl">{antwoord}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Mini-demo's in de tijdwinst-kaartjes. Puur CSS, start bij .is-in. ── */
function MiniDemo({ soort }: { soort: string }) {
  if (soort === "rapport")
    return (
      <div className="demo-rapport mt-3 space-y-1.5" aria-hidden>
        <div className="h-2 rounded-full bg-violet-200" style={{ width: "88%" }} />
        <div className="h-2 rounded-full bg-violet-200" style={{ width: "72%" }} />
        <div className="h-2 rounded-full bg-violet-200" style={{ width: "80%" }} />
      </div>
    );
  if (soort === "analyse")
    return (
      <div className="demo-analyse mt-3 flex h-10 items-end gap-1.5" aria-hidden>
        {[45, 80, 60, 95, 30, 70].map((h, i) => (
          <div
            key={i}
            className="w-4 rounded-t-sm bg-sky-300"
            style={{ height: `${h}%`, transitionDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    );
  if (soort === "bericht")
    return (
      <div className="demo-bericht mt-3 flex items-center gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-500"
            style={{ transitionDelay: `${i * 120}ms` }}
          >
            <Vink className="h-3.5 w-3.5" dik={4} />
          </span>
        ))}
        <span className="text-sm font-semibold text-ink/50">3 berichten klaar</span>
      </div>
    );
  return (
    <div className="demo-les mt-3 flex items-center gap-2" aria-hidden>
      {["Start", "Kern", "Afsluiting"].map((stap, i) => (
        <span
          key={stap}
          className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-bold text-teal-700"
          style={{ transitionDelay: `${i * 120}ms` }}
        >
          {stap}
        </span>
      ))}
    </div>
  );
}

/* ── Stilstaand alternatief voor prefers-reduced-motion. ───────────────── */
function StilAlternatief() {
  return (
    <section className="relative overflow-hidden pt-24" aria-label="Intro">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pb-16 pt-6 lg:grid-cols-2">
        <div>
          <p className="text-lg font-semibold text-ink/60">Het lijstje van vanavond kent iedereen.</p>
          <h1 className="mt-3 font-display text-4xl font-black leading-[1.05] tracking-tight text-ink sm:text-5xl">
            Avinka geeft je die avonden terug.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-ink/70">
            Elke week zo&apos;n 2 uur minder administratie. Avinka vinkt je taken af,
            jij kijkt na en houdt het laatste woord. Hieronder vinken we jouw twijfels
            af, één voor één.
          </p>
        </div>
        <div className="mx-auto w-[19rem] rotate-[-2deg] sm:w-[21rem]">
          <PapierLijstje afgevinkt={5} className="!shadow-[0_18px_40px_rgba(34,28,58,0.15)]" />
        </div>
      </div>
    </section>
  );
}

/* ── Alle eigen CSS: reveals, vink-pops en demo's. ─────────────────────── */
function StijlBlok() {
  return (
    <style>{`
      .font-hand { font-family: var(--font-hand), "Segoe Print", cursive; }

      /* Chips-balk: wel scrollen, geen zichtbare balk. */
      .twijfelnav { scrollbar-width: none; }
      .twijfelnav::-webkit-scrollbar { display: none; }

      /* Reveals: inhoud is standaard zichtbaar; .anim voegt de beweging toe. */
      .anim [data-reveal] {
        opacity: 0;
        transform: translateY(18px);
        transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
          transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .anim [data-reveal].is-in { opacity: 1; transform: none; }

      /* Scrollhint: rustige zweving, geen bounce. */
      @keyframes hintzweef {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(7px); }
      }
      .hintzweef { animation: hintzweef 1.8s ease-in-out infinite; }

      /* Vink-pop: kort en met karakter, zoals het merk-moment hoort. */
      @keyframes vinkpop {
        0% { transform: scale(0.5); opacity: 0; }
        60% { transform: scale(1.18); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
      .anim .vinkpop { animation: vinkpop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

      /* Slotvinkje tekent zichzelf. */
      .anim [data-reveal] .slotvink path {
        stroke-dasharray: 1;
        stroke-dashoffset: 1;
        transition: stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s;
      }
      .anim [data-reveal].is-in .slotvink path { stroke-dashoffset: 0; }

      /* Maskeer-demo: Sofie wordt leerling A zodra de kaart in beeld is.
         Alleen opacity/filter/transform, geen layout-animatie. */
      .maskeer .naam-masker { display: none; }
      .anim .maskeer .naam-echt {
        display: inline-block;
        transition: opacity 0.4s ease 0.9s, filter 0.4s ease 0.9s;
      }
      .anim .maskeer .naam-masker {
        display: inline-block;
        opacity: 0;
        transform: translateY(6px);
        transition: opacity 0.4s ease 1.2s, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1) 1.2s;
      }
      .anim .maskeer.is-in .naam-echt { opacity: 0; filter: blur(4px); position: absolute; }
      .anim .maskeer.is-in .naam-masker { opacity: 1; transform: none; }
      .anim .maskeer .schildje { transform: scale(0.6); opacity: 0; transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1) 1.5s, opacity 0.3s ease 1.5s; }
      .anim .maskeer.is-in .schildje { transform: scale(1); opacity: 1; }

      /* Mini-demo's: rustig tot leven zodra de kaart in beeld is. */
      .anim .demo-rapport div { transform: scaleX(0); transform-origin: left; transition: transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.4s; }
      .anim [data-reveal].is-in .demo-rapport div { transform: scaleX(1); }
      .anim .demo-rapport div:nth-child(2) { transition-delay: 0.55s; }
      .anim .demo-rapport div:nth-child(3) { transition-delay: 0.7s; }
      .anim .demo-analyse div { transform: scaleY(0); transform-origin: bottom; transition: transform 0.6s cubic-bezier(0.22,1,0.36,1) 0.4s; }
      .anim [data-reveal].is-in .demo-analyse div { transform: scaleY(1); }
      .anim .demo-bericht span, .anim .demo-les span { opacity: 0; transform: scale(0.6); transition: opacity 0.3s ease 0.5s, transform 0.3s cubic-bezier(0.34,1.56,0.64,1) 0.5s; }
      .anim [data-reveal].is-in .demo-bericht span,
      .anim [data-reveal].is-in .demo-les span { opacity: 1; transform: scale(1); }

      @media (prefers-reduced-motion: reduce) {
        .anim [data-reveal] { opacity: 1; transform: none; transition: none; }
      }
    `}</style>
  );
}

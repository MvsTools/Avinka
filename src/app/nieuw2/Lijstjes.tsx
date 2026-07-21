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

/* ── De takenmuur: de lijst die nooit ophoudt ──────────────────────────────
   De film speelt zich af in UI-land: één taakkaart wordt een muur van
   honderden taken (overweldiging als beeld), tot Avinka de golf vinkjes
   erdoorheen trekt en er een kort, behapbaar lijstje overblijft. */

const MUUR_TAKEN = [
  "Rapporten schrijven",
  "Toetsen nakijken",
  "Toetsanalyse maken",
  "Ouderberichten beantwoorden",
  "Weekplanning maken",
  "Werkblad breuken maken",
  "Oudergesprek voorbereiden",
  "Observaties verwerken",
  "Spellingles voorbereiden",
  "Stukje nieuwsbrief schrijven",
  "Pluswerk klaarzetten",
  "Sociogram invullen",
  "Rapportvergadering voorbereiden",
  "Kopieën maken",
  "Toetsrooster checken",
  "Handelingsplan bijwerken",
  "Leesniveaus bijwerken",
  "Schoolreisje regelen (bus!)",
  "Verjaardagen bijhouden",
  "Weektaak samenstellen",
  "Absenties verwerken",
  "MR-stukken lezen",
  "Gymles voorbereiden",
  "Knutselwerk voorbereiden",
  "Oudergesprekken inplannen",
  "Groepsplan rekenen",
  "Leesdossier aanvullen",
  "Stagiair feedback geven",
  "Methodetoets klaarleggen",
  "Klassendienst-rooster maken",
];
const MUUR_META = ["groep 5", "45 min", "groep 7", "20 min", "groep 4", "±1 uur", "10 min"];
const MUUR_KOLOMMEN = 13;
const MUUR_RIJEN = 11;
const KAART_B = 264; // px, breedte van één taakkaart
const KAART_H = 64;
const MUUR_GAT = 14;
const MUUR_BREEDTE = MUUR_KOLOMMEN * KAART_B + (MUUR_KOLOMMEN - 1) * MUUR_GAT;
const MUUR_HOOGTE = MUUR_RIJEN * KAART_H + (MUUR_RIJEN - 1) * MUUR_GAT;
/* De kaart in het exacte midden: daar start de film ingezoomd op. */
const MUUR_MIDDEN = Math.floor(MUUR_RIJEN / 2) * MUUR_KOLOMMEN + Math.floor(MUUR_KOLOMMEN / 2);

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

/* Eén taakkaart op de muur. ring = afstand tot het midden (voor de groei),
   diag = diagonale positie (voor de vinkgolf). */
function TaakKaart({
  naam,
  meta,
  badge,
  ring,
  diag,
}: {
  naam: string;
  meta: string;
  badge: string | null;
  ring: number;
  diag: number;
}) {
  return (
    <div
      data-kaart
      data-ring={ring}
      data-diag={diag}
      className="flex h-16 items-center gap-3 rounded-xl bg-white px-4 shadow-sm ring-1 ring-black/5"
    >
      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-ink/25 bg-white">
        <Vink data-mvink data-diag={diag} className="h-[18px] w-[18px] text-brand" dik={4} />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{naam}</span>
      {badge ? (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
            badge === "vandaag!" ? "bg-accent-soft text-amber-700" : "bg-rose-50 text-rose-600"
          }`}
        >
          {badge}
        </span>
      ) : (
        <span className="shrink-0 text-xs font-semibold text-ink/45">{meta}</span>
      )}
    </div>
  );
}

/* Het kaartje dat overblijft als de muur is afgevinkt: rust. */
function KlaarKaart() {
  return (
    <div className="w-[19.5rem] rounded-2xl bg-white p-5 shadow-[0_24px_60px_rgba(34,28,58,0.16)] ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg font-black text-ink">Vandaag</p>
        <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-dark">
          alles afgevinkt
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {[
          "Rapporten: 6 voorzetten klaar",
          "Toetsanalyse groep 5 staat klaar",
          "3 ouderberichten verstuurd",
        ].map((regel) => (
          <li key={regel} className="flex items-center gap-2.5 text-sm font-semibold text-ink/75">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-brand text-white">
              <Vink className="h-3 w-3" dik={4.5} />
            </span>
            {regel}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-baseline justify-between border-t border-black/5 pt-3">
        <span className="text-sm font-semibold text-ink/55">deze week teruggewonnen</span>
        <span className="font-display text-2xl font-black tabular-nums text-brand-dark">2:00</span>
      </div>
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

      const muur = q<HTMLElement>("[data-muur]")[0];
      const kaarten = q<HTMLElement>("[data-kaart]");
      const vinks = q<HTMLElement>("[data-mvink]");
      if (!muur) return;

      /* Start ingezoomd op de middelste kaart; eindstand toont de hele muur.
         Function-based + invalidateOnRefresh zodat resize blijft kloppen. */
      const startSchaal = () => Math.min(window.innerWidth * 0.62, 400) / KAART_B;
      const eindSchaal = () =>
        Math.max(
          Math.min(window.innerWidth / MUUR_BREEDTE, (window.innerHeight * 0.86) / MUUR_HOOGTE) * 1.04,
          0.2,
        );

      gsap.set(muur, { transformOrigin: "50% 50%", force3D: true });
      kaarten.forEach((k, i) => {
        if (i !== MUUR_MIDDEN) gsap.set(k, { autoAlpha: 0, scale: 0.9 });
      });
      gsap.set(vinks, { autoAlpha: 0, scale: 0.5, transformOrigin: "50% 50%" });
      gsap.set(q("[data-veeg]"), { xPercent: -180, autoAlpha: 0 });
      gsap.set(q("[data-klaarwrap]"), { autoAlpha: 0 });
      gsap.set(q("[data-verweg]"), { autoAlpha: 0, scale: 1.16 });

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

      /* Eén taak → de belofte van drukte. */
      tl.to(q("[data-beat-a]"), { autoAlpha: 0, y: -24, duration: 5 }, 7);
      tl.fromTo(q("[data-beat-b]"), { y: 24 }, { autoAlpha: 1, y: 0, duration: 6 }, 12);

      /* De lijst vermenigvuldigt zich; de camera trekt terug tot de muur.
         Kaarten verschijnen in ringen rond het midden, met wat jitter. */
      tl.fromTo(
        muur,
        { scale: startSchaal },
        { scale: eindSchaal, duration: 36, ease: "power2.inOut", immediateRender: true },
        12,
      );
      tl.to(muur, { rotateX: 7, duration: 18, ease: "power1.inOut" }, 30);
      kaarten.forEach((k, i) => {
        if (i === MUUR_MIDDEN) return;
        const ring = Number(k.dataset.ring);
        tl.to(
          k,
          { autoAlpha: 1, scale: 1, duration: 3, ease: "power2.out" },
          13 + ring * 3.6 + (i % 5) * 0.5,
        );
      });

      /* De verre laag komt op terwijl de camera terugtrekt: de lijst is
         groter dan je scherm, groter dan je scroll. */
      tl.to(q("[data-verweg]"), { autoAlpha: 0.65, scale: 1, duration: 18, ease: "power1.inOut" }, 22);

      /* Stil moment op de volle muur. */
      tl.to(q("[data-beat-b]"), { autoAlpha: 0, y: -24, duration: 5 }, 36);
      tl.fromTo(q("[data-beat-c]"), { y: 24 }, { autoAlpha: 1, y: 0, duration: 5 }, 40);
      tl.to(q("[data-beat-c]"), { autoAlpha: 0, y: -24, duration: 5 }, 52);

      /* Avinka: de groene veeg en de vinkgolf, diagonaal over de muur. */
      tl.fromTo(q("[data-beat-d]"), { y: 24 }, { autoAlpha: 1, y: 0, duration: 6 }, 55);
      tl.to(q("[data-veeg]"), { autoAlpha: 1, duration: 3 }, 55);
      tl.to(q("[data-veeg]"), { xPercent: 160, duration: 20, ease: "power1.inOut" }, 55);
      tl.to(q("[data-veeg]"), { autoAlpha: 0, duration: 3 }, 73);
      vinks.forEach((v) => {
        const diag = Number(v.dataset.diag ?? 0);
        tl.to(v, { autoAlpha: 1, scale: 1, duration: 2.5, ease: "back.out(2)" }, 56 + diag * 0.75);
      });
      kaarten.forEach((k) => {
        const diag = Number(k.dataset.diag);
        tl.to(k, { opacity: 0.55, duration: 2.5, ease: "power1.out" }, 57.5 + diag * 0.75);
      });
      tl.to(q("[data-verweg]"), { autoAlpha: 0.2, duration: 16, ease: "power1.inOut" }, 58);

      /* De muur is af: camera duikt terug naar binnen, de muur lost op,
         en wat overblijft is één kort, behapbaar lijstje. */
      tl.to(q("[data-beat-d]"), { autoAlpha: 0, y: -24, duration: 4 }, 76);
      tl.to(muur, { scale: () => eindSchaal() * 2.4, rotateX: 0, autoAlpha: 0, duration: 12, ease: "power2.in" }, 76);
      tl.to(q("[data-verweg]"), { autoAlpha: 0, duration: 8, ease: "power1.in" }, 76);
      tl.fromTo(
        q("[data-klaarwrap]"),
        { scale: 0.86 },
        { autoAlpha: 1, scale: 1, duration: 8, ease: "power2.out" },
        82,
      );
      tl.fromTo(q("[data-beat-e]"), { y: 24 }, { autoAlpha: 1, y: 0, duration: 6 }, 88);

      /* scrollhint verdwijnt zodra er gescrold wordt */
      tl.to(q("[data-scrollhint]"), { autoAlpha: 0, duration: 4 }, 8);
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
        <section data-film className="relative h-[380vh]" aria-label="Intro: de lijst die nooit ophoudt">
          <p className="sr-only">
            Eén taak wordt een muur van honderden leerkracht-taken. Avinka trekt er een golf
            vinkjes doorheen tot er een kort, behapbaar lijstje overblijft: elke week zo&apos;n
            2 uur terug.
          </p>
          <div className="sticky top-0 h-screen overflow-hidden bg-cream">
            {/* zachte lichtplek achter het podium */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(90% 70% at 50% 40%, rgba(255,255,255,0.8) 0%, rgba(251,246,238,0) 62%)",
              }}
              aria-hidden
            />

            {/* de verre laag: onscherpe suggestie van nog honderden kaartjes
                (één div met een getegelde witte vlek + blur = diepte en oneindigheid) */}
            <div
              data-verweg
              className="pointer-events-none absolute inset-[-10%] blur-[5px]"
              style={{
                backgroundColor: "rgba(210,193,161,0.8)",
                backgroundImage: "linear-gradient(#ffffff, #fbf7ee)",
                backgroundSize: "112px 34px",
                backgroundRepeat: "space",
                maskImage: "radial-gradient(80% 80% at 50% 50%, black 58%, transparent 100%)",
                WebkitMaskImage: "radial-gradient(80% 80% at 50% 50%, black 58%, transparent 100%)",
              }}
              aria-hidden
            />

            {/* de takenmuur */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: "1400px" }}>
              <div
                data-muur
                className="grid shrink-0 will-change-transform"
                style={{
                  width: MUUR_BREEDTE,
                  gridTemplateColumns: `repeat(${MUUR_KOLOMMEN}, ${KAART_B}px)`,
                  gap: MUUR_GAT,
                  maskImage: "radial-gradient(74% 74% at 50% 50%, black 55%, transparent 99%)",
                  WebkitMaskImage: "radial-gradient(74% 74% at 50% 50%, black 55%, transparent 99%)",
                }}
                aria-hidden
              >
                {Array.from({ length: MUUR_RIJEN * MUUR_KOLOMMEN }, (_, i) => {
                  const rij = Math.floor(i / MUUR_KOLOMMEN);
                  const kol = i % MUUR_KOLOMMEN;
                  const eerste = i === MUUR_MIDDEN;
                  return (
                    <TaakKaart
                      key={i}
                      naam={eerste ? "Rapporten schrijven" : MUUR_TAKEN[i % MUUR_TAKEN.length]}
                      meta={eerste ? "groep 5" : MUUR_META[i % MUUR_META.length]}
                      badge={!eerste && i % 9 === 2 ? "deadline morgen" : !eerste && i % 13 === 5 ? "vandaag!" : null}
                      ring={Math.max(Math.abs(rij - Math.floor(MUUR_RIJEN / 2)), Math.abs(kol - Math.floor(MUUR_KOLOMMEN / 2)))}
                      diag={rij + kol}
                    />
                  );
                })}
              </div>
            </div>

            {/* de groene veeg die de vinkgolf aankondigt */}
            <div
              data-veeg
              className="pointer-events-none absolute inset-y-[-15%] left-1/2 w-[38vw] rotate-[14deg]"
              style={{
                background:
                  "linear-gradient(90deg, rgba(47,158,110,0) 0%, rgba(47,158,110,0.13) 50%, rgba(47,158,110,0) 100%)",
              }}
              aria-hidden
            />

            {/* wat overblijft: het behapbare lijstje */}
            <div data-klaarwrap className="absolute inset-0 flex items-center justify-center">
              <KlaarKaart />
            </div>
            {/* ── Tekstbeats: bovenin, boven de muur. ── */}
            <div className="absolute inset-x-0 top-[4.5rem] z-10 px-6 sm:top-[5.5rem]">
              <div className="mx-auto w-full max-w-6xl">
                <div className="relative min-h-[9.5rem] max-w-xl">
                  <p
                    data-beat-a
                    className="absolute font-display text-4xl font-black leading-[1.05] tracking-tight text-ink [text-shadow:0_2px_18px_rgba(251,246,238,0.9)] sm:text-5xl"
                  >
                    Het begint met één taak.
                    <span className="mt-3 block font-sans text-lg font-semibold text-ink/65 sm:text-xl">
                      Prima te doen.
                    </span>
                  </p>
                  <h1
                    data-beat-b
                    className="absolute font-display text-4xl font-black leading-[1.05] tracking-tight text-ink [text-shadow:0_2px_18px_rgba(251,246,238,0.9)] sm:text-5xl"
                  >
                    Maar de lijst houdt nooit op.
                    <span className="mt-3 block font-sans text-lg font-semibold text-ink/65 sm:text-xl">
                      Er komt elke week meer bij dan eraf gaat.
                    </span>
                  </h1>
                  <p
                    data-beat-c
                    className="absolute font-display text-4xl font-black leading-[1.05] tracking-tight text-ink [text-shadow:0_2px_18px_rgba(251,246,238,0.9)] sm:text-5xl"
                  >
                    Herken je dit?
                    <span className="mt-3 block font-sans text-lg font-semibold text-ink/65 sm:text-xl">
                      Dit is waar je vrije tijd blijft.
                    </span>
                  </p>
                  <p
                    data-beat-d
                    className="absolute font-display text-4xl font-black leading-[1.05] tracking-tight text-ink [text-shadow:0_2px_18px_rgba(251,246,238,0.9)] sm:text-5xl"
                  >
                    Avinka vinkt met je mee.
                    <span className="mt-3 block font-sans text-lg font-semibold text-ink/65 sm:text-xl">
                      Jij kijkt na en houdt het laatste woord. Elke week zo&apos;n 2 uur terug.
                    </span>
                  </p>
                  <p
                    data-beat-e
                    className="absolute font-display text-4xl font-black leading-[1.05] tracking-tight text-ink [text-shadow:0_2px_18px_rgba(251,246,238,0.9)] sm:text-5xl"
                  >
                    En jouw twijfels?
                    <span className="mt-3 block font-sans text-lg font-semibold text-ink/65 sm:text-xl">
                      Die vinken we hieronder af. Eén voor één.
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* scrollhint */}
            <div
              data-scrollhint
              className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-1 text-ink/60"
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
          <p className="text-lg font-semibold text-ink/60">
            De takenlijst van een leerkracht houdt nooit op.
          </p>
          <h1 className="mt-3 font-display text-4xl font-black leading-[1.05] tracking-tight text-ink sm:text-5xl">
            Avinka maakt hem behapbaar.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-ink/70">
            Elke week zo&apos;n 2 uur minder administratie. Avinka vinkt met je mee,
            jij kijkt na en houdt het laatste woord. Hieronder vinken we jouw twijfels
            af, één voor één.
          </p>
        </div>
        <div className="mx-auto">
          <KlaarKaart />
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

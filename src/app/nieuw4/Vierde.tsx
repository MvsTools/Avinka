"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type SVGProps } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Prijzen from "@/components/Prijzen";
import { PROEF_DAGEN } from "@/lib/abonnement";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* ──────────────────────────────────────────────────────────────────────────
   /nieuw4 — "Alles op z'n plek" (film, van v3) + "Jouw twijfels" (body, van v2)

   FILM (bovenin): het overvolle scherm van een leerkracht ruimt zichzelf
   scrollend op; elk venster vliegt naar zijn plek in het dashboard, avond
   wordt dag, payoff "Alles op z'n plek".

   BODY (eronder): een sticky twijfelbalk die meevinkt terwijl je de vijf
   twijfels van de bezoeker leest, elk met een bewegend UI-fragment.

   prefers-reduced-motion krijgt een stilstaande, volledige versie.
   Vanaf hier wordt er stuk voor stuk handmatig bijgeschaafd.
   ────────────────────────────────────────────────────────────────────────── */

/* ── Body-data (v2): de vijf twijfels = de informatie-structuur ────────── */

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

/* ── Filmbouwstenen (v3) ───────────────────────────────────────────────── */

// Een zwevend "venster" op het rommelige bureaublad.
function Venster({
  naam,
  titel,
  className = "",
  children,
}: {
  naam: string;
  titel: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-venster={naam}
      className={
        "absolute overflow-hidden rounded-2xl bg-white text-left shadow-[0_24px_60px_-16px_rgba(8,5,20,0.65)] ring-1 ring-white/10 " +
        className
      }
    >
      <div className="flex items-center gap-2 border-b border-black/[0.06] bg-slate-50/90 px-3.5 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          <span className="h-2 w-2 rounded-full bg-slate-300" />
        </span>
        <span className="truncate text-[10px] font-semibold tracking-wide text-slate-400">
          {titel}
        </span>
      </div>
      {children}
    </div>
  );
}

// Grijze "tekstregels" in een venster.
function Regels({ n, kort = false }: { n: number; kort?: boolean }) {
  const breedtes = ["w-full", "w-11/12", "w-4/5", "w-full", "w-3/5", "w-10/12", "w-2/3"];
  return (
    <div className="space-y-1.5">
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full bg-slate-200 ${breedtes[i % breedtes.length]} ${
            kort && i === n - 1 ? "w-1/3" : ""
          }`}
        />
      ))}
    </div>
  );
}

// Een tool-tegel in het mini-dashboard.
function Tegel({
  naam,
  label,
  emoji,
  kleur,
}: {
  naam: string;
  label: string;
  emoji: string;
  kleur: string;
}) {
  return (
    <div
      data-tegel={naam}
      className="relative flex items-center gap-2.5 rounded-2xl border border-black/5 bg-white p-2.5 shadow-sm"
    >
      <span
        data-tegelvink={naam}
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-black text-white shadow-sm"
        aria-hidden
      >
        ✓
      </span>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base text-white shadow-sm ${kleur}`}
        aria-hidden
      >
        {emoji}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-bold text-ink">{label}</span>
        <span className="block text-[10px] font-bold text-brand">Openen →</span>
      </span>
    </div>
  );
}

/* ── Bodybouwsteen (v2): het getekende vinkje ──────────────────────────── */

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

/* ── De pagina ─────────────────────────────────────────────────────────── */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function abonneerReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export default function Vierde({ fotoBestand }: { fotoBestand?: string }) {
  const root = useRef<HTMLDivElement>(null);
  // null op de server (eerste paint), daarna de echte systeemvoorkeur.
  const reduced = useSyncExternalStore<boolean | null>(
    abonneerReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => null,
  );
  const film = reduced === false;
  const [klaar, setKlaar] = useState<Set<TwijfelId>>(new Set());

  /* ── De film (v3): rommelig bureaublad → dashboard ── */
  useGSAP(
    () => {
      if (!film) return;
      const q = gsap.utils.selector(root);

      /* ── Beginstanden ── */
      gsap.set(q("[data-venster]"), { autoAlpha: 1 });
      gsap.set(q("[data-tegel]"), { autoAlpha: 0.18, scale: 0.94 });
      gsap.set(q("[data-tegelvink], [data-taakvink]"), { autoAlpha: 0, scale: 0.5 });
      gsap.set(q("[data-taakrij]"), { autoAlpha: 0, x: 14 });
      gsap.set(q("[data-paneel]"), { autoAlpha: 0, y: 18 });
      gsap.set(q("[data-winstchip], [data-slotwoord]"), { autoAlpha: 0, y: 12 });
      gsap.set(q("[data-daglaag]"), { opacity: 0 });

      /* ── Vluchtbaan: van venstermidden naar tegelmidden (gemeten) ── */
      const midden = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      };
      const baan = (naam: string, doelSel: string) => {
        const el = q(`[data-venster="${naam}"]`)[0];
        const doel = q(doelSel)[0];
        if (!el || !doel) return null;
        if (getComputedStyle(el).display === "none") return null;
        return {
          el,
          dx: () => midden(doel).x - midden(el).x,
          dy: () => midden(doel).y - midden(el).y,
        };
      };

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: q("[data-film-scroll]")[0],
          start: "top top",
          end: "bottom bottom",
          scrub: 0.9,
          invalidateOnRefresh: true,
        },
      });

      /* ── 0-8 · een tel stilte, dan verdwijnt de hint ── */
      tl.to(q("[data-scrollhint]"), { autoAlpha: 0, duration: 3 }, 3);

      /* ── 0-24 · de rommel leeft: alles drijft heel licht ── */
      q("[data-venster]").forEach((el, i) => {
        tl.to(
          el,
          { y: i % 2 === 0 ? -10 : 8, x: i % 3 === 0 ? 6 : -6, duration: 24, ease: "none" },
          0,
        );
      });

      /* ── 18-26 · de werkplek schuift ónder de rommel in beeld ── */
      tl.to(q("[data-paneel]"), { autoAlpha: 1, y: 0, duration: 8 }, 18);

      /* ── 26-70 · opruimen: elk venster vliegt naar zijn plek ── */
      const vlucht = (naam: string, doelSel: string, t: number, vinkSel?: string) => {
        const b = baan(naam, doelSel);
        if (b) {
          tl.to(b.el, { x: b.dx, y: b.dy, scale: 0.3, rotation: 0, duration: 7 }, t);
          tl.to(b.el, { autoAlpha: 0, duration: 2 }, t + 5);
        }
        const doel = q(doelSel)[0];
        if (doel?.hasAttribute("data-tegel")) {
          tl.to(doelSel, { autoAlpha: 1, scale: 1, duration: 3, ease: "back.out(1.6)" }, t + 5);
          if (vinkSel)
            tl.to(vinkSel, { autoAlpha: 1, scale: 1, duration: 2.5, ease: "back.out(2)" }, t + 7);
        } else {
          tl.to(doelSel, { autoAlpha: 1, x: 0, duration: 3, ease: "power2.out" }, t + 5);
        }
      };

      vlucht("geel1", '[data-taakrij="1"]', 26);
      vlucht("weektaak", '[data-taakrij="4"]', 29.5);
      vlucht("word", '[data-tegel="rapporten"]', 31, '[data-tegelvink="rapporten"]');
      vlucht("excel", '[data-tegel="toets"]', 35.5, '[data-tegelvink="toets"]');
      vlucht("toetsanalyse", '[data-tegel="toets"]', 38, '[data-tegelvink="toets"]');
      vlucht("mail", '[data-tegel="ouder"]', 42, '[data-tegelvink="ouder"]');
      vlucht("melding", '[data-taakrij="2"]', 46);
      vlucht("plattegrond", '[data-tegel="plattegrond"]', 49, '[data-tegelvink="plattegrond"]');
      vlucht("les", '[data-tegel="les"]', 53.5, '[data-tegelvink="les"]');
      vlucht("browser", '[data-tegel="werkbladen"]', 58, '[data-tegelvink="werkbladen"]');
      vlucht("draaiboek", '[data-taakrij="5"]', 61);
      vlucht("geel2", '[data-taakrij="3"]', 63.5);

      // De overvolle map hoeft nergens heen: die is gewoon niet meer nodig.
      tl.to(q('[data-venster="map"]'), { scale: 0.5, autoAlpha: 0, rotation: 0, duration: 6 }, 64);

      /* ── 71-81 · de taken worden afgevinkt (het merk-moment) ── */
      [1, 2, 3, 4, 5].forEach((n, i) => {
        tl.to(`[data-taakvink="${n}"]`, { autoAlpha: 1, scale: 1, duration: 2, ease: "back.out(2)" }, 71 + i * 2);
        tl.to(`[data-taaktekst="${n}"]`, { opacity: 0.5, duration: 2 }, 71 + i * 2);
      });

      /* ── 72-92 · avond wordt dag; de belofte blijft staan en kleurt mee ── */
      tl.to(q("[data-avondlaag]"), { opacity: 0, duration: 20, ease: "power1.inOut" }, 72);
      tl.to(q("[data-daglaag]"), { opacity: 1, duration: 20, ease: "power1.inOut" }, 72);
      tl.to(q("[data-belofte]"), { color: "#221c3a", duration: 14, ease: "power1.inOut" }, 74);
      tl.add(() => {
        const st = tl.scrollTrigger;
        q("[data-header]")[0]?.classList[st && st.progress > 0.79 ? "add" : "remove"]("film-klaar");
      }, 80);

      /* ── 86-98 · de payoff ── */
      tl.to(q("[data-winstchip]"), { autoAlpha: 1, y: 0, duration: 4, ease: "back.out(1.6)" }, 86);
      tl.to(q("[data-slotwoord]"), { autoAlpha: 1, y: 0, duration: 6, ease: "power2.out" }, 90);
    },
    { scope: root, dependencies: [film], revertOnUpdate: true },
  );

  /* ── De body (v2): reveals + twijfels afvinken + teller ── */
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

      {/* ── Vaste bovenbalk: logo altijd leesbaar, CTA ook op mobiel,
             en een uitweg voor wie de film wil overslaan. ── */}
      <header
        data-header
        className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
          film ? "" : "film-klaar"
        } [&.film-klaar]:border-b [&.film-klaar]:border-black/5 [&.film-klaar]:bg-cream/85 [&.film-klaar]:backdrop-blur`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <span className="rounded-xl bg-cream/95 px-2.5 py-1.5 shadow-sm ring-1 ring-black/5">
            {/* Gewone img: de dev-optimizer van next/image laadt traag (zelfde keuze als v1/v2). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Avinka_logo.png" alt="Avinka" className="h-8 w-auto" />
          </span>
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              data-skiplink
              href="#verder"
              className={`whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold transition sm:text-base ${
                film ? "text-cream/90 hover:text-white" : "text-ink/70 hover:text-ink"
              } [[data-header].film-klaar_&]:text-ink/70 [[data-header].film-klaar_&]:hover:text-ink`}
            >
              <span className="sm:hidden">Overslaan</span>
              <span className="hidden sm:inline">Liever meteen lezen?</span>
            </a>
            <Link
              href="/sign-up"
              className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-dark sm:text-base"
            >
              Probeer gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* ════════════════════════ DE FILM (v3) ════════════════════════ */}
      <section
        data-film-scroll
        aria-label="Avinka ruimt je schoolwerk op"
        className={film ? "relative h-[300vh]" : "relative"}
      >
        <div
          className={
            film
              ? "sticky top-0 flex h-screen flex-col items-center overflow-hidden px-4 pt-14 sm:pt-16"
              : "relative flex flex-col items-center gap-8 overflow-hidden px-4 pb-16 pt-28"
          }
        >
          {/* Lichtlagen: avond onder, dag erboven ingefaded */}
          <div
            data-avondlaag
            className={`pointer-events-none absolute inset-0 bg-[#1d1735] ${film ? "" : "hidden"}`}
            aria-hidden
          >
            {/* warme bureaulamp rechtsboven */}
            <div className="absolute -right-24 -top-24 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(closest-side,rgba(245,158,11,0.32),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(10,7,24,0.55)_100%)]" />
          </div>
          <div data-daglaag className="pointer-events-none absolute inset-0 bg-cream" aria-hidden>
            <div className="bg-dots absolute inset-0 opacity-60" />
          </div>

          {/* De grote belofte: groots, muisstil, en niets komt eroverheen */}
          <div data-intro className="relative z-30 mx-auto mt-[1.5vh] w-[min(94vw,62rem)] text-center">
            <h1
              data-belofte
              className={`font-display text-[clamp(2.4rem,5.5vw,4rem)] font-black leading-[1.04] tracking-tight [text-wrap:balance] ${
                film ? "text-cream" : "text-ink"
              }`}
            >
              Win elke week <span className="text-brand">2 uur</span> terug.
            </h1>
          </div>

          {/* ── Het rommelige bureaublad (alleen in de film) ── */}
          {film && (
            <div className="absolute inset-0 z-20" aria-hidden>
              {/* Word: het rapport */}
              <Venster
                naam="word"
                titel="rapport_groep5_DEFINITIEF(3).docx"
                className="left-[3%] top-[42%] w-56 -rotate-[5deg] sm:left-[2%] sm:top-[34%] sm:w-64"
              >
                <div className="p-3.5">
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    Sofie heeft dit halfjaar een mooie groei laten zien bij
                  </p>
                  <div className="mt-2">
                    <Regels n={4} kort />
                  </div>
                </div>
              </Venster>

              {/* Excel: de toetsuitslagen */}
              <Venster
                naam="excel"
                titel="toetsuitslagen_M-toets.xlsx"
                className="hidden w-52 rotate-[4deg] sm:right-[2%] sm:top-[34%] sm:block sm:w-60"
              >
                <div className="grid grid-cols-4 gap-px bg-slate-200 p-px text-[9px] text-slate-500">
                  {["", "M5", "E5", "vs", "Yas", "231", "244", "+13", "Nor", "228", "225", "-3", "Mik", "219", "236", "+17"].map(
                    (c, i) => (
                      <span key={i} className={`bg-white px-1.5 py-1 ${i < 4 ? "font-bold text-slate-400" : ""}`}>
                        {c}
                      </span>
                    ),
                  )}
                </div>
              </Venster>

              {/* Mail aan ouders, nooit af */}
              <Venster
                naam="mail"
                titel="Concept · niet verzonden"
                className="left-[6%] bottom-[22%] w-56 rotate-[2deg] sm:left-[18%] sm:bottom-[4%] sm:w-64"
              >
                <div className="p-3.5 text-[11px] text-slate-600">
                  <p className="text-slate-400">Aan: ouders groep 5</p>
                  <p className="mt-1.5">
                    Beste ouders,
                    <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse bg-slate-500 align-middle" />
                  </p>
                  <div className="mt-2">
                    <Regels n={2} kort />
                  </div>
                </div>
              </Venster>

              {/* Browser vol tabbladen */}
              <Venster
                naam="browser"
                titel=""
                className="hidden w-64 rotate-[-3deg] sm:right-[8%] sm:bottom-[6%] sm:block"
              >
                <div className="flex gap-1 border-b border-black/5 bg-slate-50 px-2 pt-1.5 text-[9px] text-slate-500">
                  <span className="truncate rounded-t-md bg-white px-2 py-1 ring-1 ring-black/5">werkblad breuken gr5</span>
                  <span className="truncate rounded-t-md px-2 py-1">SLO-doelen</span>
                  <span className="truncate rounded-t-md px-2 py-1">10 ideeën…</span>
                  <span className="shrink-0 rounded-t-md px-2 py-1 font-bold">+14</span>
                </div>
                <div className="p-3.5">
                  <div className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] text-slate-400">
                    nog een werkblad zoeken…
                  </div>
                </div>
              </Venster>

              {/* Plattegrond-plaatje */}
              <Venster
                naam="plattegrond"
                titel="plattegrond_lokaal_v4_ECHT.png"
                className="hidden w-44 rotate-[6deg] lg:left-[4%] lg:top-[58%] lg:block"
              >
                <div className="grid grid-cols-4 gap-1.5 p-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <span key={i} className="h-4 rounded-sm bg-amber-200/70" />
                  ))}
                </div>
              </Venster>

              {/* De les van morgen */}
              <Venster
                naam="les"
                titel="les_dinsdag_breuken.docx"
                className="hidden w-48 -rotate-[4deg] lg:right-[4%] lg:top-[56%] lg:block"
              >
                <div className="p-3.5">
                  <p className="text-[10px] font-bold text-slate-500">Lesdoel:</p>
                  <div className="mt-1.5">
                    <Regels n={3} kort />
                  </div>
                </div>
              </Venster>

              {/* De bodemloze map */}
              <Venster
                naam="map"
                titel="Mijn documenten (1.243 items)"
                className="hidden w-40 rotate-[3deg] lg:left-[5%] lg:bottom-[5%] lg:block"
              >
                <div className="grid grid-cols-4 gap-2 p-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <span key={i} className="h-5 rounded-sm bg-sky-100" />
                  ))}
                </div>
              </Venster>

              {/* Geeltjes: kriskras in de linker- en rechtermarge, midden vrij.
                  Bij het scrollen vliegen ze naar hun plek in het dashboard:
                  oudergesprekken/weektaak/draaiboek naar de to-do, toetsen
                  analyseren naar de Toetsanalyse-tegel, rapporten naar de to-do. */}
              <div
                data-venster="geel1"
                className="absolute left-[3%] top-[54%] w-36 -rotate-[6deg] rounded-sm bg-accent-soft p-3 text-[11px] font-semibold leading-snug text-ink/80 shadow-[0_16px_36px_-10px_rgba(8,5,20,0.6)] sm:left-[3%] sm:top-[22%]"
              >
                oudergesprekken plannen!!
              </div>
              <div
                data-venster="toetsanalyse"
                className="absolute hidden w-32 rotate-[3deg] rounded-sm bg-accent-soft p-3 text-[11px] font-semibold leading-snug text-ink/80 shadow-[0_16px_36px_-10px_rgba(8,5,20,0.6)] sm:left-[15%] sm:top-[70%] sm:block"
              >
                toetsen analyseren
              </div>
              <div
                data-venster="weektaak"
                className="absolute hidden w-32 rotate-[4deg] rounded-sm bg-accent-soft p-3 text-[11px] font-semibold leading-snug text-ink/80 shadow-[0_16px_36px_-10px_rgba(8,5,20,0.6)] sm:right-[3%] sm:top-[21%] sm:block"
              >
                weektaak maken
              </div>
              <div
                data-venster="geel2"
                className="absolute right-[4%] top-[46%] w-32 rotate-[8deg] rounded-sm bg-accent-soft p-3 text-[11px] font-semibold leading-snug text-ink/80 shadow-[0_16px_36px_-10px_rgba(8,5,20,0.6)] sm:right-[19%] sm:top-[49%]"
              >
                rapporten af vóór vrijdag
              </div>
              <div
                data-venster="draaiboek"
                className="absolute hidden w-32 -rotate-[4deg] rounded-sm bg-accent-soft p-3 text-[11px] font-semibold leading-snug text-ink/80 shadow-[0_16px_36px_-10px_rgba(8,5,20,0.6)] sm:right-[6%] sm:top-[70%] sm:block"
              >
                draaiboek kerst maken
              </div>

              {/* Melding */}
              <div
                data-venster="melding"
                className="absolute bottom-[10%] left-[8%] flex w-52 items-center gap-2.5 rounded-xl bg-ink/95 p-3 text-[11px] font-semibold text-cream shadow-[0_16px_36px_-10px_rgba(8,5,20,0.6)] ring-1 ring-white/10 sm:bottom-[5%] sm:left-auto sm:right-[26%]"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black">
                  3
                </span>
                nieuwe berichten van ouders
              </div>
            </div>
          )}

          {/* ── De werkplek waar alles landt: een mini-versie van het echte
                 dashboard (bovenbalk, welkom, takenstrookje, Jouw tools, tip) ── */}
          <div data-paneel className="relative z-10 mt-4 w-[min(92vw,44rem)] sm:mt-5">
            <div className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
              {/* mini-bovenbalk */}
              <div className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Avinka_wordmerk.png" alt="" className="h-4 w-auto sm:h-5" />
                <span className="flex items-center gap-2 text-[10px] font-semibold text-ink/50">
                  Hallo, Sanne
                  <span className="rounded-lg border border-black/10 px-2 py-1">Uitloggen</span>
                </span>
              </div>

              <div className="bg-cream px-4 py-3.5 sm:px-5">
                {/* welkom-kop, zoals op de echte Start-pagina */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black tracking-tight text-ink sm:text-base">
                      Welkom terug, Sanne! 👋
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink/60">
                      Je tijd na schooltijd is van jou.
                    </p>
                  </div>
                  <span
                    data-winstchip
                    className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand-dark"
                  >
                    +2 uur deze week
                  </span>
                </div>

                {/* het takenstrookje (hier landen de geeltjes) */}
                <div className="mt-3 rounded-2xl bg-white p-3 ring-1 ring-black/5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-ink/45">
                    Vandaag
                  </p>
                  <ul className="mt-1.5 grid gap-1.5 text-[11px] font-semibold text-ink/85 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-1.5">
                    {[
                      { n: 1, t: "oudergesprekken plannen" },
                      { n: 2, t: "ouders terugmailen" },
                      { n: 3, t: "rapporten vóór vrijdag" },
                      { n: 4, t: "weektaak maken" },
                      { n: 5, t: "draaiboek kerst" },
                    ].map((r) => (
                      <li key={r.n} data-taakrij={r.n} className="flex items-start gap-1.5">
                        <span
                          data-taakvink={r.n}
                          className="mt-[1px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand text-[9px] font-black text-white"
                          aria-hidden
                        >
                          ✓
                        </span>
                        <span data-taaktekst={r.n} className="leading-snug">
                          {r.t}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* jouw tools */}
                <p className="mt-3.5 text-[11px] font-bold text-ink">Jouw tools</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2 sm:gap-2.5">
                  <Tegel naam="toets" label="Toetsanalyse" emoji="📊" kleur="bg-sky-500" />
                  <Tegel naam="rapporten" label="Rapporten" emoji="📝" kleur="bg-violet-500" />
                  <Tegel naam="ouder" label="Oudercontact" emoji="✉️" kleur="bg-rose-500" />
                  <Tegel naam="plattegrond" label="Plattegrond" emoji="🪑" kleur="bg-amber-500" />
                  <Tegel naam="les" label="Lesontwerp" emoji="📓" kleur="bg-teal-500" />
                  <div
                    data-tegel="werkbladen"
                    className="relative flex items-center gap-2.5 rounded-2xl border-2 border-dashed border-black/10 bg-white/70 p-2.5"
                  >
                    <span
                      data-tegelvink="werkbladen"
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-black text-white shadow-sm"
                      aria-hidden
                    >
                      ✓
                    </span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft px-0.5 text-center text-[7px] font-black uppercase leading-tight text-brand-dark">
                      Binnen kort
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-bold text-ink">
                        Werkbladen
                      </span>
                      <span className="block text-[10px] font-medium text-ink/50">
                        De volgende tool
                      </span>
                    </span>
                  </div>
                </div>

                {/* de tip-balk van het echte dashboard */}
                <p className="mt-3 rounded-xl bg-brand-soft px-3 py-2 text-[10px] font-medium text-ink/70">
                  💡 <span className="font-bold">Tip:</span> de namen van je leerlingen
                  blijven altijd op je eigen computer.
                </p>
              </div>
            </div>

            {/* De payoff onder het paneel */}
            <div data-slotwoord className="mt-4 text-center sm:mt-6">
              <p className="font-display text-xl font-black tracking-tight text-ink sm:text-3xl">
                Alles op z&rsquo;n plek.
              </p>
              <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-ink/65 sm:mt-2 sm:text-base sm:leading-7">
                Dit is jouw werkplek. Scroll verder, dan vinken we je twijfels af.
              </p>
            </div>
          </div>

          {/* Scrollhint */}
          {film && (
            <div
              data-scrollhint
              className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 text-center text-cream/80"
            >
              <p className="text-sm font-semibold">Scroll om op te ruimen</p>
              <span className="mt-1 inline-block animate-pulse text-lg" aria-hidden>
                ↓
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════ DE BODY (v2) ════════════════════════ */}
      <main id="verder" className="relative z-10 scroll-mt-16 bg-cream">
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
                  &ldquo;Ik sta zelf voor de klas en ik ken dat volle scherm van
                  dinsdagavond uit mijn hoofd. Daarom bouw ik Avinka: praktische hulp die
                  direct tijd bespaart en zorgvuldig omgaat met de privacy van je
                  leerlingen. Goede leerkrachten horen hun tijd te besteden aan
                  leerlingen, niet aan onnodig papierwerk.&rdquo;
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

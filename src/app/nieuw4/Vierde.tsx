"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type SVGProps,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Prijzen from "@/components/Prijzen";
import { PROEF_DAGEN } from "@/lib/abonnement";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* ──────────────────────────────────────────────────────────────────────────
   /nieuw4 — "Alles op z'n plek"

   FILM (bovenin): het overvolle scherm van een leerkracht ruimt zichzelf
   scrollend op; elk venster vliegt naar zijn plek in het tablet-dashboard,
   avond wordt dag. De finale: vier vertrouwens-chips poppen onder de tablet
   binnen en dragen je de pagina in.

   BODY (eronder): de volledige inhoud van de landingspagina, positief
   verteld: de landing (wat Avinka is, mét het afgevinkte briefje uit de
   filmwereld), de tools, privacy, gemak, de maker, prijzen en vragen.

   prefers-reduced-motion krijgt een stilstaande, volledige versie.
   Wordt stuk voor stuk handmatig bijgeschaafd.
   ────────────────────────────────────────────────────────────────────────── */

/* ── Inhoud ────────────────────────────────────────────────────────────── */

const STRIP = [
  "🔒 Namen blijven thuis",
  "🇳🇱 Volledig Nederlands",
  "💚 Door een leerkracht gemaakt",
  "✓ Maandelijks opzegbaar",
];

/* De tool-galerij: per tool één kunstkaart (Stripe-achtig, maar in onze
   eigen beeldtaal). Nieuwe tool = kaart erbij. `licht` bepaalt of de naam
   op de kaart een donker plaatje nodig heeft. */
const KAARTEN = [
  {
    id: "rapporten",
    naam: "Rapporten",
    zin: "Rapportteksten die klinken alsof jij ze schreef.",
    licht: false,
  },
  {
    id: "toetsanalyse",
    naam: "Toetsanalyse",
    zin: "Zie in één oogopslag wie extra aandacht nodig heeft.",
    licht: false,
  },
  {
    id: "oudercontact",
    naam: "Oudercontact",
    zin: "Weekberichten en oudergesprekken zonder leeg scherm.",
    licht: false,
  },
  {
    id: "lesontwerp",
    naam: "Lesontwerp",
    zin: "Van één leerdoel naar een complete les met differentiatie.",
    licht: true,
  },
  {
    id: "plattegrond",
    naam: "Plattegrond",
    zin: "De klasopstelling puzzelt zichzelf uit, jouw wensen voorop.",
    licht: false,
  },
  {
    id: "werkbladen",
    naam: "Werkbladen",
    zin: "Printbare werkbladen die precies bij je les passen.",
    licht: false,
  },
  {
    id: "draaiboek",
    naam: "Draaiboek",
    zin: "Elk schoolevenement compleet uitgedacht, tot de taakverdeling aan toe.",
    licht: true,
  },
  {
    id: "weekplanning",
    naam: "Weekplanning",
    zin: "Je hele week in één helder rooster, gekoppeld aan je tools.",
    licht: false,
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
    vraag: "Welk abonnement past bij mij?",
    antwoord:
      "Gebruik je één tool? Dan is Start genoeg. Wil je alle tools en je klassen automatisch koppelen? Dan is Compleet de logische keuze, en die kiezen de meeste leerkrachten. Pro is er voor wie het maximale uit Avinka wil halen.",
  },
  {
    vraag: "Wat is het verschil tussen maandelijks en per schooljaar?",
    antwoord:
      "Bij maandelijks betaal je per maand en zeg je op wanneer je wilt. Bij een schooljaar-abonnement betaal je ook gewoon per maand, maar zijn juli en augustus gratis. Je hoeft in de zomer niets stop te zetten en je houdt je klassen en bewaarde werk.",
  },
  {
    vraag: "Kan ik later wisselen of opzeggen?",
    antwoord:
      "Het maandabonnement kun je altijd opzeggen, zonder kleine lettertjes. Upgraden naar een groter pakket kan op elk moment. Het schooljaar-abonnement loopt een heel schooljaar; daar staat tegenover dat de zomermaanden gratis zijn.",
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

/* ── Filmbouwstenen ────────────────────────────────────────────────────── */

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
      className="relative flex flex-col items-center gap-1 rounded-xl border border-black/5 bg-white p-2 text-center shadow-sm"
    >
      <span
        data-tegelvink={naam}
        className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-black text-white shadow-sm"
        aria-hidden
      >
        ✓
      </span>
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm text-white shadow-sm ${kleur}`}
        aria-hidden
      >
        {emoji}
      </span>
      <span className="w-full truncate text-[10px] font-bold text-ink">{label}</span>
    </div>
  );
}

// Een item in de dashboard-zijbalk, net als het echte DashboardNav.
function MiniNav({
  label,
  icon,
  actief = false,
  naam,
}: {
  label: string;
  icon: React.ReactNode;
  actief?: boolean;
  naam?: string;
}) {
  return (
    <span
      {...(naam ? { "data-nav": naam } : {})}
      className={`relative flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-semibold ${
        actief ? "bg-brand text-white shadow-sm shadow-brand/20" : "text-ink/70"
      }`}
    >
      <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
      <span className="truncate">{label}</span>
    </span>
  );
}

/* Kleine lijn-iconen voor de zijbalk (zelfde stijl als het echte dashboard). */
function NavHome() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V20h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 20v-5h5v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function NavTaken() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 6.5l1.5 1.5L7.5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12.5l1.5 1.5L7.5 11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 7h9M11 13h9M11 19h6" strokeLinecap="round" />
    </svg>
  );
}
function NavKlas() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" strokeLinecap="round" />
      <path d="M15 19a4 4 0 0 1 5.5-3.7" strokeLinecap="round" />
    </svg>
  );
}
function NavTekst() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M6 3h8l4 4v14H6z" strokeLinejoin="round" />
      <path d="M14 3v4h4" strokeLinejoin="round" />
      <path d="M9 12h6M9 16h6" strokeLinecap="round" />
    </svg>
  );
}
function NavChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 20V4" strokeLinecap="round" />
      <path d="M4 20h16" strokeLinecap="round" />
      <rect x="7" y="12" width="3" height="5" rx="0.6" />
      <rect x="12" y="8" width="3" height="9" rx="0.6" />
      <rect x="17" y="5" width="3" height="12" rx="0.6" />
    </svg>
  );
}

/* ── Het getekende vinkje ──────────────────────────────────────────────── */

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

/* De handgetrokken streep onder een accentwoord — dezelfde als in de hero
   van de echte landingspagina, zodat het één merk blijft. */
function Streep() {
  return (
    <svg
      viewBox="0 0 200 12"
      className="absolute -bottom-3 left-0 w-full text-accent sm:-bottom-4"
      fill="none"
      aria-hidden
    >
      <path d="M2 9C40 3 160 3 198 7" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

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

  /* ── De film: rommelig bureaublad → tablet-dashboard ── */
  useGSAP(
    () => {
      if (!film) return;
      const q = gsap.utils.selector(root);

      /* ── Beginstanden ── */
      gsap.set(q("[data-venster]"), { autoAlpha: 1 });
      gsap.set(q("[data-tegel]"), { autoAlpha: 0.18, scale: 0.94 });
      gsap.set(q("[data-tegelvink]"), { autoAlpha: 0, scale: 0.5 });
      gsap.set(q("[data-paneel]"), { autoAlpha: 0, y: 18 });
      gsap.set(q("[data-daglaag]"), { opacity: 0 });
      // De takenlijst begint dicht; de rijen leeg. Fase 2 klapt hem open.
      gsap.set(q("[data-takendrop]"), { autoAlpha: 0, scale: 0.96, y: -4, transformOrigin: "top center" });
      gsap.set(q("[data-takenrow]"), { autoAlpha: 0, x: 8 });
      // De vertrouwens-chips van de finale.
      gsap.set(q("[data-stripchip]"), { autoAlpha: 0, y: 14, scale: 0.9 });

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

      /* ── FASE 1 · eerst alle tools vullen: elk venster vliegt naar zijn tegel ── */
      vlucht("word", '[data-tegel="rapporten"]', 28, '[data-tegelvink="rapporten"]');
      vlucht("excel", '[data-tegel="toets"]', 32, '[data-tegelvink="toets"]');
      vlucht("toetsanalyse", '[data-tegel="toets"]', 35, '[data-tegelvink="toets"]');
      vlucht("mail", '[data-tegel="ouder"]', 39, '[data-tegelvink="ouder"]');
      vlucht("plattegrond", '[data-tegel="plattegrond"]', 43, '[data-tegelvink="plattegrond"]');
      vlucht("les", '[data-tegel="les"]', 47, '[data-tegelvink="les"]');
      vlucht("browser", '[data-tegel="werkbladen"]', 51, '[data-tegelvink="werkbladen"]');

      // De documenten-map naar Bestanden in de zijbalk; wordt daar opgenomen.
      const bMap = baan("map", '[data-nav="bestanden"]');
      if (bMap) {
        tl.to(bMap.el, { x: bMap.dx, y: bMap.dy, scale: 0.24, rotation: 0, duration: 6 }, 54);
        tl.to(bMap.el, { autoAlpha: 0, duration: 2 }, 58);
      }

      /* ── FASE 2 · de takenlijst klapt open; dan zweven de losse reminders er
             één voor één in en verschijnen als taak in de lijst ── */
      tl.to(q("[data-takendrop]"), { autoAlpha: 1, scale: 1, y: 0, duration: 4, ease: "power2.out" }, 60);
      tl.to(q("[data-chevron]"), { rotation: 180, duration: 4 }, 60);

      const naarRow = (naam: string, rowSel: string, t: number) => {
        const b = baan(naam, rowSel);
        if (b) {
          tl.to(b.el, { x: b.dx, y: b.dy, scale: 0.34, rotation: 0, duration: 5 }, t);
          tl.to(b.el, { autoAlpha: 0, duration: 1.5 }, t + 3.5);
        }
        tl.to(rowSel, { autoAlpha: 1, x: 0, duration: 2.2, ease: "power2.out" }, t + 3.5);
      };

      naarRow("geel1", '[data-takenrow="1"]', 64);
      naarRow("melding", '[data-takenrow="2"]', 67.5);
      naarRow("geel2", '[data-takenrow="3"]', 71);
      naarRow("weektaak", '[data-takenrow="4"]', 74.5);
      naarRow("draaiboek", '[data-takenrow="5"]', 78);

      // De teller loopt mee op: elke keer dat er een taak landt, telt hij +1.
      const teller = { v: 0 };
      tl.to(
        teller,
        {
          v: 5,
          duration: 20,
          ease: "none",
          snap: { v: 1 },
          onUpdate: () => {
            const el = q("[data-takencount]")[0];
            if (el) el.textContent = String(teller.v);
          },
        },
        64,
      );

      // Alles binnen: de lijst klapt weer netjes dicht.
      tl.to(q("[data-takendrop]"), { autoAlpha: 0, scale: 0.96, y: -4, duration: 3 }, 84);
      tl.to(q("[data-chevron]"), { rotation: 0, duration: 3 }, 84);

      // De volle tablet zakt iets omlaag, weg van de kop bovenin.
      tl.to(q("[data-paneel]"), { y: 10, duration: 8, ease: "power2.out" }, 82);

      /* ── 72-92 · avond wordt dag; de belofte blijft staan en kleurt mee ── */
      tl.to(q("[data-avondlaag]"), { opacity: 0, duration: 20, ease: "power1.inOut" }, 72);
      tl.to(q("[data-daglaag]"), { opacity: 1, duration: 20, ease: "power1.inOut" }, 72);
      tl.to(q("[data-belofte]"), { color: "#221c3a", duration: 14, ease: "power1.inOut" }, 74);
      tl.add(() => {
        const st = tl.scrollTrigger;
        q("[data-header]")[0]?.classList[st && st.progress > 0.86 ? "add" : "remove"]("film-klaar");
      }, 86);

      /* ── 88-98 · finale: de vier zekerheden poppen één voor één binnen ── */
      q("[data-stripchip]").forEach((chip, i) => {
        tl.to(chip, { autoAlpha: 1, y: 0, scale: 1, duration: 3, ease: "back.out(1.8)" }, 88 + i * 2.5);
      });
    },
    { scope: root, dependencies: [film], revertOnUpdate: true },
  );

  /* ── De body: reveals + de optelsom-teller ── */
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

    return () => io.disconnect();
  }, [reduced]);

  return (
    <div ref={root} className="flex flex-1 flex-col bg-cream text-ink">
      <StijlBlok />

      {/* ── Vaste bovenbalk ── */}
      <header
        data-header
        className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
          film ? "" : "film-klaar"
        } [&.film-klaar]:border-b [&.film-klaar]:border-black/5 [&.film-klaar]:bg-cream/85 [&.film-klaar]:backdrop-blur`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <span className="rounded-xl bg-cream/95 px-2.5 py-1.5 shadow-sm ring-1 ring-black/5">
            {/* Gewone img: de dev-optimizer van next/image laadt traag. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Avinka_logo.png" alt="Avinka" className="h-8 w-auto" />
          </span>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/sign-up"
              className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-dark sm:text-base"
            >
              Probeer gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* ════════════════════════ DE FILM ════════════════════════ */}
      <section
        data-film-scroll
        aria-label="Avinka ruimt je schoolwerk op"
        className={film ? "relative h-[300vh]" : "relative"}
      >
        <div
          className={
            film
              ? "sticky top-0 flex h-screen flex-col items-center overflow-hidden px-4 pt-12 sm:pt-14"
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
              Win elke week <span className="text-brand">2 uur</span> terug
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

              {/* Geeltjes: kriskras in de linker- en rechtermarge, midden vrij. */}
              <div
                data-venster="geel1"
                className="absolute left-[3%] top-[54%] w-36 -rotate-[6deg] rounded-sm bg-accent-soft p-3 text-[11px] font-semibold leading-snug text-ink/80 shadow-[0_16px_36px_-10px_rgba(8,5,20,0.6)] sm:left-[20%] sm:top-[53%]"
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
                className="absolute hidden w-32 rotate-[4deg] rounded-sm bg-accent-soft p-3 text-[11px] font-semibold leading-snug text-ink/80 shadow-[0_16px_36px_-10px_rgba(8,5,20,0.6)] sm:right-[14%] sm:top-[30%] sm:block"
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

              {/* Melding: als wit kaartje, zelfde stijl als de vensters */}
              <div
                data-venster="melding"
                className="absolute bottom-[10%] left-[8%] flex w-52 items-center gap-2.5 rounded-2xl bg-white p-3 shadow-[0_24px_60px_-16px_rgba(8,5,20,0.65)] ring-1 ring-black/5 sm:bottom-[6%] sm:left-auto sm:right-[22%]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-xs font-black text-white">
                  3
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold text-ink">Nieuwe berichten</span>
                  <span className="block text-[10px] text-slate-500">van ouders groep 5</span>
                </span>
              </div>
            </div>
          )}

          {/* ── De werkplek waar alles landt: een tablet met het Avinka-dashboard ── */}
          <div data-paneel className="relative z-10 mt-3 w-[min(94vw,39rem)] sm:mt-4">
            {/* tablet-behuizing: alles wordt in dit apparaat opgeruimd */}
            <div className="rounded-[1.4rem] bg-ink/90 p-1 shadow-[0_34px_80px_-24px_rgba(8,5,20,0.75)] ring-1 ring-white/10">
              <div className="relative overflow-hidden rounded-[1.05rem] bg-cream">
                {/* bovenbalk */}
                <div className="flex items-center justify-between border-b border-black/5 bg-white px-3 py-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/Avinka_wordmerk.png" alt="" className="h-3.5 w-auto sm:h-4" />
                  <span className="text-[9px] font-semibold text-ink/50">
                    <span className="rounded-md border border-black/10 px-1.5 py-0.5">Uitloggen</span>
                  </span>
                </div>

                <div className="flex">
                  {/* zijbalk, net als het echte dashboard */}
                  <nav className="hidden w-[8.5rem] shrink-0 flex-col gap-0.5 border-r border-black/5 bg-white/50 p-2 sm:flex">
                    <MiniNav label="Start" actief icon={<NavHome />} />
                    <MiniNav label="Takenlijst" icon={<NavTaken />} />
                    <MiniNav label="Mijn klas" icon={<NavKlas />} />
                    <MiniNav label="Bestanden" naam="bestanden" icon={<NavTekst />} />
                    <MiniNav label="Statistieken" icon={<NavChart />} />
                  </nav>

                  {/* hoofdvlak */}
                  <div className="min-w-0 flex-1 px-3 py-3 sm:px-4">
                    {/* welkom-kop met takenlijst-knop + streak */}
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                      <div>
                        <p className="text-sm font-black tracking-tight text-ink">
                          Welkom terug! 👋
                        </p>
                        <p className="mt-0.5 text-[10px] text-ink/60">
                          Kies een tool om mee te beginnen.
                        </p>
                      </div>
                      <div className="flex shrink-0 items-start gap-1.5">
                        {/* takenlijst-knop met uitklap-paneel (fase 2) */}
                        <div className="relative">
                          <span
                            data-takenpill
                            className="flex items-center gap-1.5 rounded-lg border border-black/5 bg-white px-2 py-1 text-[10px] font-bold text-ink shadow-sm"
                          >
                            <span aria-hidden>📋</span>
                            <span>
                              <span data-takencount>0</span> taken
                            </span>
                            <svg
                              data-chevron
                              viewBox="0 0 24 24"
                              className="h-2.5 w-2.5 text-ink/40"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden
                            >
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </span>
                          <div
                            data-takendrop
                            className="invisible absolute left-0 top-full z-20 mt-1 w-44 rounded-xl border border-black/10 bg-white p-1.5 text-left opacity-0 shadow-xl sm:left-auto sm:right-0"
                          >
                            {[
                              { n: 1, t: "oudergesprekken plannen" },
                              { n: 2, t: "ouders terugmailen" },
                              { n: 3, t: "rapporten vóór vrijdag" },
                              { n: 4, t: "weektaak maken" },
                              { n: 5, t: "draaiboek kerst" },
                            ].map((r) => (
                              <div
                                key={r.n}
                                data-takenrow={r.n}
                                className="flex items-center gap-1.5 rounded-md px-1 py-1 text-[9px] font-semibold text-ink/80"
                              >
                                <span className="h-3 w-3 shrink-0 rounded-full border-2 border-black/15" aria-hidden />
                                <span className="truncate">{r.t}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <span className="flex items-center gap-1 rounded-lg border border-black/5 bg-white px-2 py-1 text-[10px] font-bold text-ink shadow-sm">
                          <svg viewBox="0 0 24 24" className="h-3.5 w-[13px]" aria-hidden>
                            <defs>
                              <linearGradient id="vlam-mini" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ff3d00" />
                                <stop offset="45%" stopColor="#ff9100" />
                                <stop offset="100%" stopColor="#ffd000" />
                              </linearGradient>
                            </defs>
                            <path
                              d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
                              fill="url(#vlam-mini)"
                            />
                          </svg>
                          12 dagen
                        </span>
                      </div>
                    </div>

                    {/* jouw tools */}
                    <p className="mt-3 text-[10px] font-bold text-ink">Jouw tools</p>
                    <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                      <Tegel naam="toets" label="Toetsanalyse" emoji="📊" kleur="bg-sky-500" />
                      <Tegel naam="rapporten" label="Rapporten" emoji="📝" kleur="bg-violet-500" />
                      <Tegel naam="ouder" label="Oudercontact" emoji="✉️" kleur="bg-rose-500" />
                      <Tegel naam="plattegrond" label="Plattegrond" emoji="🪑" kleur="bg-amber-500" />
                      <Tegel naam="les" label="Lesontwerp" emoji="📓" kleur="bg-teal-500" />
                      <div
                        data-tegel="werkbladen"
                        className="relative flex flex-col items-center gap-1 rounded-xl border-2 border-dashed border-black/10 bg-white/60 p-2 text-center"
                      >
                        <span
                          data-tegelvink="werkbladen"
                          className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-black text-white shadow-sm"
                          aria-hidden
                        >
                          ✓
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-sm">
                          ✨
                        </span>
                        <span className="w-full truncate text-[10px] font-bold text-ink/60">Werkbladen</span>
                      </div>
                    </div>

                    {/* tip-balk */}
                    <p className="mt-2.5 rounded-lg bg-brand-soft px-2.5 py-1.5 text-[9px] font-medium text-ink/70">
                      💡 <span className="font-bold">Tip:</span> de namen van je leerlingen
                      blijven altijd op je eigen computer.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Finale: de vier zekerheden poppen binnen en dragen je de pagina in */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-6">
              {STRIP.map((s) => (
                <span
                  key={s}
                  data-stripchip
                  className="rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-ink/75 shadow-sm ring-1 ring-black/5 sm:text-sm"
                >
                  {s}
                </span>
              ))}
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

      {/* Ademruimte tussen film en body: de finale mag uitademen voordat de
         uitleg begint. */}
      <div aria-hidden className="bg-cream" style={{ height: film ? "14vh" : "6vh" }} />

      {/* ════════════════════════ DE BODY ════════════════════════ */}
      <main id="verder" className="relative z-10 scroll-mt-16 bg-cream">
        {/* ── 1. Wat Avinka is ─────────────────────────────────────────────
           De film vertelt de belofte en het probleem; hier staat in gewone
           zinnen wát het dan is, zodat niemand hoeft te raden. Kop en knoppen
           links, de uitleg rechts. Bewust stil: de kaarten hieronder zijn het
           levendige stuk. ── */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-28 top-0 h-80 w-80 rounded-full bg-brand/10 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-accent/15 blur-3xl" aria-hidden />
          <div className="relative mx-auto grid w-full max-w-5xl gap-10 px-6 pb-20 pt-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pb-28 lg:pt-16">
            <div>
              <h2
                data-reveal
                className="font-display text-[clamp(1.875rem,3.1vw,2.375rem)] font-black leading-[1.08] tracking-tight [text-wrap:balance]"
              >
                De slimme werkplek voor leerkrachten in het basisonderwijs
              </h2>
              <div data-reveal className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/sign-up"
                  className="knop-druk w-full whitespace-nowrap rounded-2xl bg-brand px-7 py-4 text-center text-lg font-bold text-white shadow-lg shadow-brand/25 transition-[transform,background-color] duration-200 hover:bg-brand-dark sm:w-auto"
                >
                  Probeer Avinka gratis
                </Link>
                <a
                  href="#tools"
                  className="knop-druk w-full whitespace-nowrap rounded-2xl border-2 border-ink/10 bg-white px-7 py-4 text-center text-lg font-bold text-ink transition-[transform,border-color] duration-200 hover:border-ink/20 sm:w-auto"
                >
                  Bekijk de tools
                </a>
              </div>
            </div>

            {/* De uitleg: wat het is en wat het je oplevert. Verder niets. */}
            <div className="max-w-xl lg:pt-2">
              <p data-reveal className="text-lg leading-8 text-ink/75">
                Avinka brengt de hulpmiddelen voor je schoolwerk samen in één
                omgeving. Je geeft aan wat je nodig hebt en Avinka helpt je met
                de uitwerking, zodat terugkerende taken minder tijd kosten en je
                werk overzichtelijk blijft.
              </p>
            </div>
          </div>
        </section>

        {/* ── 3. De tool-galerij: grote kunstkaarten, jij schuift ze zelf ── */}
        <section id="tools" className="relative overflow-hidden scroll-mt-20">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="absolute -right-32 top-24 h-96 w-96 rounded-full bg-brand/[0.07] blur-3xl" />
          </div>

          <ToolRail />

          <div className="relative mx-auto w-full max-w-5xl px-6 pb-24">
            {/* De payoff: waaróm dit er allemaal staat. Geen rekensom, wel de
               belofte uit de landingspagina zelf. */}
            <div data-reveal className="mt-16 rounded-[2rem] bg-sand px-6 py-14 text-center sm:px-12">
              <p className="font-display text-4xl font-black leading-[1.05] tracking-tight text-ink [text-wrap:balance] sm:text-5xl">
                Minder administratie,{" "}
                <span className="relative whitespace-nowrap text-brand">
                  meer onderwijs
                  <Streep />
                </span>
              </p>
              <p className="mx-auto mt-9 max-w-xl text-lg leading-8 text-ink/70">
                Veel van dit werk kost tijd, maar vraagt niet je volle aandacht.
                Dát is wat Avinka overneemt. De rest blijft van jou.
              </p>
              <p className="mt-8 inline-block rounded-2xl bg-white px-6 py-3 text-lg font-bold text-ink shadow-sm ring-1 ring-black/5">
                Meer rust. Minder werkdruk. Meer tijd voor je klas.
              </p>
            </div>
          </div>
        </section>

        {/* ── 4. Privacy, zichtbaar gemaakt ── */}
        <section className="relative overflow-hidden bg-ink text-cream">
          <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand/20 blur-3xl" aria-hidden />
          <div className="relative mx-auto grid w-full max-w-5xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
            <div data-reveal>
              <h2 className="font-display text-4xl font-black tracking-tight text-white [text-wrap:balance]">
                Namen blijven thuis
              </h2>
              <p className="mt-6 text-lg leading-8 text-cream/80">
                Privacy is ons belangrijkste uitgangspunt. Namen van leerlingen
                gaan nooit naar AI: ze worden op je eigen apparaat onleesbaar
                gemaakt voordat er ook maar iets wordt verstuurd.
              </p>
              <p className="mt-4 text-lg leading-8 text-cream/80">
                Je account staat bovendien op beveiligde servers in Europa.
                Geen bijzaak, maar de ruggengraat van alles wat we bouwen.
              </p>
            </div>
            {/* De maskeer-demo: Sofie wordt leerling A voor je ogen */}
            <div data-reveal className="maskeer rounded-2xl bg-white p-6 text-ink shadow-2xl sm:p-8">
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
          </div>
        </section>

        {/* ── 5. De regie blijft bij jou ── */}
        <section className="mx-auto w-full max-w-5xl px-6 py-24">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            <div data-reveal>
              <h2 className="font-display text-4xl font-black tracking-tight [text-wrap:balance]">
                Jij houdt het laatste woord
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-ink/70">
                Avinka schrijft de voorzet, jij beslist. Niets gaat zonder jou de
                deur uit. En de cijfers? Die berekent de tool zelf, dus die kloppen
                altijd. De AI schrijft alleen de tekst eromheen en verzint nooit
                getallen of feiten.
              </p>
            </div>
            <div className="space-y-6 self-center">
              <div data-reveal className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-xl" aria-hidden>
                  ✉️
                </span>
                <p className="leading-7 text-ink/75">
                  <span className="font-bold text-ink">Niet ingewikkeld.</span>{" "}
                  Net zo makkelijk als een mailtje typen. Je hoeft niets te
                  leren en weet meteen wat je moet doen.
                </p>
              </div>
              <div data-reveal style={{ transitionDelay: "90ms" }} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-xl" aria-hidden>
                  ✏️
                </span>
                <p className="leading-7 text-ink/75">
                  <span className="font-bold text-ink">Altijd bij te sturen.</span>{" "}
                  Elke tekst is een voorstel. Aanpassen, inkorten of opnieuw
                  laten schrijven kan met één klik.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. De maker ── */}
        <section className="mx-auto w-full max-w-5xl px-6 pb-24">
          <div data-reveal className="relative overflow-hidden rounded-[2rem] bg-sand px-8 py-14 sm:px-14">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/15 blur-2xl" aria-hidden />
            <div className="relative flex flex-col gap-8 sm:flex-row sm:gap-12">
              <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-black/5">
                {fotoBestand ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/${fotoBestand}`}
                    alt="Michael van Spanje"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-display text-2xl font-black text-brand">MvS</span>
                )}
              </span>
              <div>
                <h2 className="font-display text-3xl font-black tracking-tight [text-wrap:balance] sm:text-4xl">
                  Van een leerkracht, voor leerkrachten
                </h2>
                <p className="mt-6 text-lg leading-8 text-ink/75">
                  Ik ben Michael. Net als jij sta ik voor de klas. Ik weet hoeveel
                  tijd er gaat naar rapporten, analyses en andere administratieve
                  taken. Daarom ben ik begonnen met het bouwen van slimme
                  hulpmiddelen die dat werk sneller en eenvoudiger maken. Geen
                  ingewikkelde technologie, maar praktische tools die direct tijd
                  besparen en zorgvuldig omgaan met de privacy van je leerlingen.
                </p>
                <p className="mt-4 text-lg leading-8 text-ink/75">
                  Wat begon als een oplossing voor mijn eigen werk, groeide uit tot
                  een bredere missie. Ik geloof dat leerkrachten veel meer voordeel
                  kunnen halen uit de mogelijkheden van AI dan nu vaak gebeurt. Niet
                  omdat ze niet willen, maar omdat de meeste oplossingen te technisch
                  of te ingewikkeld zijn. Met Avinka wil ik laten zien dat slimmer
                  werken juist eenvoudig kan zijn.
                </p>
                <p className="mt-6 text-lg font-semibold leading-8 text-ink">
                  Want goede leerkrachten horen hun tijd te besteden aan
                  leerlingen, niet aan onnodig papierwerk.
                </p>
                <p className="font-hand mt-8 text-3xl text-ink/80">Michael</p>
                <p className="text-sm text-ink/60">Leerkracht &amp; maker van Avinka</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 7. Eerlijk over ervaringen ── */}
        <section className="border-y border-black/5 bg-white">
          <div className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
            <h2 data-reveal className="font-display text-3xl font-black tracking-tight [text-wrap:balance]">
              Wat leerkrachten zeggen
            </h2>
            <p data-reveal className="mx-auto mt-5 max-w-xl text-lg leading-8 text-ink/70">
              Deze zomer test een groep leerkrachten Avinka in de praktijk. Hun
              ervaringen komen hier te staan, in hun eigen woorden. Geen
              verzonnen quotes, dat beloven we.
            </p>
          </div>
        </section>

        {/* ── 8. Prijzen ── */}
        <Prijzen />

        {/* ── 9. Veelgestelde vragen ── */}
        <section id="vragen" className="scroll-mt-16 bg-white">
          <div className="mx-auto w-full max-w-3xl px-6 py-24">
            <h2 className="text-center font-display text-4xl font-black tracking-tight [text-wrap:balance]">
              Veelgestelde vragen
            </h2>
            <div className="mt-12 space-y-4">
              {FAQ.slice(0, 4).map((item) => (
                <details
                  key={item.vraag}
                  className="group/faq rounded-2xl border border-black/5 bg-cream p-6"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg text-lg font-bold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
                    {item.vraag}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-transform group-open/faq:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 leading-8 text-ink/70">{item.antwoord}</p>
                </details>
              ))}
              <details className="group/more">
                <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-lg py-2 text-center text-base font-bold text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
                  Nog meer veelgestelde vragen
                  <span className="text-lg transition-transform group-open/more:rotate-180">⌄</span>
                </summary>
                <div className="mt-4 space-y-4">
                  {FAQ.slice(4).map((item) => (
                    <details
                      key={item.vraag}
                      className="group/faq rounded-2xl border border-black/5 bg-cream p-6"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg text-lg font-bold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
                        {item.vraag}
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-transform group-open/faq:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="mt-4 leading-8 text-ink/70">{item.antwoord}</p>
                    </details>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* ── 10. Slot ── */}
        <section className="relative overflow-hidden bg-ink">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-brand/25 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-accent/15 blur-3xl" aria-hidden />
          <div className="relative mx-auto w-full max-w-3xl px-6 py-24 text-center">
            <div data-reveal className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30">
              <Vink className="slotvink h-9 w-9" dik={3.6} />
            </div>
            <h2 data-reveal className="mt-7 font-display text-4xl font-black tracking-tight text-white [text-wrap:balance]">
              Kom binnen.
            </h2>
            <p data-reveal className="mx-auto mt-5 max-w-xl text-lg leading-8 text-cream/80">
              Je werkplek staat klaar. {PROEF_DAGEN} dagen gratis proberen,
              zonder betaalgegevens vooraf.
            </p>
            <Link
              href="/sign-up"
              data-reveal
              className="mt-9 inline-block rounded-2xl bg-white px-8 py-4 text-lg font-black text-brand-dark shadow-lg transition hover:-translate-y-0.5"
            >
              Probeer Avinka gratis
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ── De tool-galerij: een sleepbare rij kunstkaarten, één per tool.
   Zoals de klantkaarten van Stripe, maar in de Avinka-beeldtaal: elk
   kaartbeeld is een eigen kleine wereld met échte inhoud (een rapportzin,
   een berichtje van thuis, een klasopstelling), geen interface-namaak.
   De bezoeker heeft de regie: zelf slepen, vegen of de pijltjes. Niets
   beweegt uit zichzelf; een bekeken kaart zet wel zijn eigen vinkje. ──── */

/* De kop boven de rij. */
function RailKop() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6">
      <div data-reveal className="max-w-2xl">
        <h2 className="font-display text-4xl font-black tracking-tight [text-wrap:balance]">
          Dit staat er voor je klaar
        </h2>
        <p className="mt-4 text-lg text-ink/60">
          Acht tools, en er komen er steeds meer bij.
        </p>
      </div>
    </div>
  );
}

/* De kaarten zelf; `gezien` bepaalt welke vinkjes aan staan. */
function RailKaarten({ gezien }: { gezien: boolean[] }) {
  return (
    <>
      {KAARTEN.map((k, i) => (
        <figure
          key={k.id}
          data-kaart
          className="rail-kaart w-[18.5rem] shrink-0 snap-start select-none sm:w-[21rem]"
          style={{ "--i": i } as CSSProperties}
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/10 transition-transform duration-300 hover:-translate-y-1.5">
            <KaartBeeld soort={k.id} />
            <div className="kaart-grain pointer-events-none absolute inset-0" aria-hidden />
            <p
              className={`absolute bottom-4 left-4 flex items-center gap-2 font-display text-lg font-black tracking-tight ${
                k.licht
                  ? "rounded-full bg-ink py-1.5 pl-1.5 pr-4 text-cream shadow-md"
                  : "text-white"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors duration-300 ${
                  gezien[i] ? "bg-white text-brand-dark" : "bg-white/15 ring-1 ring-white/50"
                }`}
                aria-hidden
              >
                {gezien[i] && <Vink className="vinkpop h-3.5 w-3.5" dik={4} />}
              </span>
              {k.naam}
            </p>
          </div>
        </figure>
      ))}

      {/* En de rij groeit gewoon door: de haak naar meer. */}
      <figure
        className="rail-kaart w-[18.5rem] shrink-0 snap-start select-none sm:w-[21rem]"
        style={{ "--i": KAARTEN.length } as CSSProperties}
      >
        <div className="relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl bg-ink shadow-lg ring-1 ring-black/10">
          <div className="absolute -right-16 -top-12 h-56 w-56 rounded-full bg-brand/30 blur-3xl" aria-hidden />
          <div className="absolute -left-20 top-14 h-52 w-52 rounded-full bg-accent/25 blur-3xl" aria-hidden />
          <div className="absolute right-4 top-6 flex gap-2" aria-hidden>
            <div className="h-24 w-16 rotate-6 rounded-xl bg-white/10 ring-1 ring-white/15" />
            <div className="h-28 w-20 -rotate-3 rounded-xl bg-white/[0.07] ring-1 ring-white/10" />
          </div>
          <div className="relative p-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-cream/80 ring-1 ring-white/15">
              nieuwe tools onderweg ✨
            </span>
            <p className="mt-3 font-display text-3xl font-black leading-[1.03] tracking-tight text-cream">
              En dit is nog maar het begin
            </p>
          </div>
        </div>
      </figure>
    </>
  );
}

function ToolRail() {
  const rail = useRef<HTMLDivElement>(null);
  const greep = useRef({ actief: false, startX: 0, startScroll: 0 });
  const [kanTerug, setKanTerug] = useState(false);
  const [kanVerder, setKanVerder] = useState(true);
  const [gezien, setGezien] = useState<boolean[]>(() => KAARTEN.map(() => false));
  const [wakker, setWakker] = useState(false);

  const bijScroll = () => {
    const el = rail.current;
    if (!el) return;
    setKanTerug(el.scrollLeft > 8);
    setKanVerder(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);

    const rand = el.getBoundingClientRect();
    // Het vinkje volgt de kaart: staat hij goed in beeld, dan vinkt hij zich
    // af; schuif je terug, dan gaat het vinkje weer uit. Zo zie je de
    // beweging elke keer opnieuw, welke kant je ook op gaat.
    const kaarten = el.querySelectorAll<HTMLElement>("[data-kaart]");
    setGezien((oud) => {
      let anders = false;
      const nieuw = oud.slice();
      kaarten.forEach((kaart, i) => {
        const r = kaart.getBoundingClientRect();
        const inBeeld = r.left >= rand.left - 12 && r.left <= rand.right - r.width * 0.55;
        if (nieuw[i] !== inBeeld) {
          nieuw[i] = inBeeld;
          anders = true;
        }
      });
      return anders ? nieuw : oud;
    });
  };

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setWakker(true);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (wakker) bijScroll();
  }, [wakker]);

  const stap = (richting: number) => {
    const el = rail.current;
    el?.scrollBy({ left: richting * Math.round(el.clientWidth * 0.75), behavior: "smooth" });
  };

  const pakVast = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = rail.current;
    if (e.pointerType !== "mouse" || !el) return;
    greep.current = { actief: true, startX: e.clientX, startScroll: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
    el.classList.add("sleept");
  };
  const beweeg = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = rail.current;
    if (!greep.current.actief || !el) return;
    e.preventDefault();
    el.scrollLeft = greep.current.startScroll - (e.clientX - greep.current.startX);
  };
  const laatLos = () => {
    greep.current.actief = false;
    rail.current?.classList.remove("sleept");
  };

  const kantlijn = "max(1.5rem, calc(50% - 32rem + 1.5rem))";

  return (
    <div className="pt-24">
      <RailKop />
      <div className="mt-10">
        <div
          ref={rail}
          data-reveal
          role="region"
          aria-label="De tools van Avinka"
          tabIndex={0}
          onScroll={bijScroll}
          onPointerDown={pakVast}
          onPointerMove={beweeg}
          onPointerUp={laatLos}
          onPointerCancel={laatLos}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              stap(1);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              stap(-1);
            }
          }}
          className="tool-rail flex gap-5 overflow-x-auto pb-2 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink/60 sm:gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ paddingLeft: kantlijn, paddingRight: kantlijn, scrollPaddingLeft: kantlijn }}
        >
          <RailKaarten gezien={gezien} />
        </div>

        <div className="mx-auto flex w-full max-w-5xl justify-end px-6 pt-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => stap(-1)}
              disabled={!kanTerug}
              aria-label="Vorige tools"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-sm ring-1 ring-black/10 transition hover:-translate-y-0.5 active:scale-95 disabled:pointer-events-none disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-5 w-5" aria-hidden>
                <path d="M14.5 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => stap(1)}
              disabled={!kanVerder}
              aria-label="Volgende tools"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-sm ring-1 ring-black/10 transition hover:-translate-y-0.5 active:scale-95 disabled:pointer-events-none disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-5 w-5" aria-hidden>
                <path d="M9.5 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Een tafelgroepje van vier voor de plattegrond-kaart, met leerlingnamen. */
function Tafelgroep({
  namen = [null, null, null, null],
  accent = -1,
  className = "",
}: {
  namen?: (string | null)[];
  accent?: number;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-2 gap-1.5 ${className}`} aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`flex h-8 w-14 items-center justify-center rounded-lg text-xs font-bold ${
            i === accent
              ? "bg-accent text-ink shadow-[0_0_0_3px_rgba(245,158,11,0.35)]"
              : "bg-cream/85 text-ink/80"
          }`}
        >
          {namen[i]}
        </span>
      ))}
    </div>
  );
}

/* ── De kaartbeelden: acht kleine werelden in de merktaal. ─────────────── */
function KaartBeeld({ soort }: { soort: string }) {
  if (soort === "rapporten")
    return (
      <div className="absolute inset-0 bg-ink">
        <div className="absolute -right-14 -top-16 h-56 w-56 rounded-full bg-accent/25 blur-3xl" aria-hidden />
        <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-brand/25 blur-3xl" aria-hidden />
        {/* het vel met de eerste zin */}
        <div className="absolute left-1/2 top-[45%] w-[80%] -translate-x-1/2 -translate-y-1/2 -rotate-2 rounded-xl bg-cream p-5 shadow-2xl">
          <p className="font-display text-lg font-black leading-snug text-ink">
            &ldquo;Sofie liet dit halfjaar een prachtige groei zien&hellip;&rdquo;
          </p>
          <div className="mt-4 space-y-2" aria-hidden>
            <div className="h-1.5 rounded-full bg-ink/10" />
            <div className="h-1.5 w-5/6 rounded-full bg-ink/10" />
            <div className="h-1.5 w-11/12 rounded-full bg-ink/10" />
            <div className="h-1.5 w-3/4 rounded-full bg-ink/10" />
          </div>
        </div>
        <Vink
          className="absolute right-4 top-[58%] h-20 w-20 -rotate-6 text-brand drop-shadow-lg"
          dik={2.4}
        />
      </div>
    );

  if (soort === "toetsanalyse")
    return (
      <div className="absolute inset-0 bg-brand-dark">
        <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" aria-hidden />
        {/* Flow-layout: nooit overlap, ook op de kortere mobiele kaart. */}
        <div className="relative flex h-full flex-col px-6 pb-16 pt-6">
          <p className="font-hand self-end text-xl text-white">groep 5 · M-toets</p>
          {/* per domein één balk, zoals in het echte groepsbeeld */}
          <div className="mt-4 space-y-3" aria-hidden>
            {[
              { naam: "Getallen", breed: 78, aandacht: false },
              { naam: "Verhoudingen", breed: 64, aandacht: false },
              { naam: "Meten en meetkunde", breed: 36, aandacht: true },
              { naam: "Verbanden", breed: 70, aandacht: false },
            ].map((d) => (
              <div key={d.naam}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">{d.naam}</span>
                  {d.aandacht && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-ink">
                      valt op
                    </span>
                  )}
                </div>
                <div className="mt-1.5 h-2.5 rounded-full bg-white/15">
                  <div
                    className={`h-full rounded-full ${d.aandacht ? "bg-accent" : "bg-white/85"}`}
                    style={{ width: `${d.breed}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-auto pt-4 text-sm font-bold leading-6 text-white">
            Sofie en Yassin kunnen extra oefenen bij meten.
          </p>
        </div>
      </div>
    );

  if (soort === "oudercontact")
    return (
      <div className="absolute inset-0 bg-accent">
        <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-white/30 blur-3xl" aria-hidden />
        <div className="absolute -left-14 -top-14 h-56 w-56 rounded-full bg-ink/10 blur-3xl" aria-hidden />
        {/* het weekbericht */}
        <div className="absolute left-5 right-12 top-[22%] -rotate-1 rounded-2xl rounded-bl-md bg-white p-4 shadow-xl">
          <p className="text-sm font-bold text-ink">Beste ouders, wat een week!</p>
          <p className="mt-1 text-sm leading-6 text-ink/70">
            De spreekbeurten waren een feestje, en woensdag…
          </p>
        </div>
        {/* het antwoord van thuis */}
        <div className="absolute bottom-[24%] left-12 right-5 rotate-1 rounded-2xl rounded-br-md bg-ink p-4 shadow-xl">
          <p className="text-sm leading-6 text-cream">Wat leuk om zo mee te kijken. Dankjewel! ❤️</p>
        </div>
        <p className="font-hand absolute left-6 top-6 -rotate-2 text-xl text-ink/80">
          vrijdag 16:02 · verstuurd
        </p>
      </div>
    );

  if (soort === "lesontwerp") {
    // Eén coördinatenstelsel (viewBox 336×420 = de 4:5-kaart) voor de route
    // én de stations, zodat elk station exact op de lijn valt, op elk formaat.
    const stations = [
      { label: "Start", x: 70, y: 46, brand: false, rot: -2 },
      { label: "Lesdoel", x: 246, y: 110, brand: false, rot: 1 },
      { label: "Instructie", x: 92, y: 174, brand: false, rot: -1 },
      { label: "Verwerking", x: 246, y: 238, brand: false, rot: 2 },
      { label: "Afsluiting ✓", x: 128, y: 298, brand: true, rot: -2 },
    ];
    return (
      <div className="absolute inset-0 bg-cream">
        <div className="bg-grid absolute inset-0 opacity-70" aria-hidden />
        <div className="absolute -left-16 top-1/4 h-56 w-56 rounded-full bg-brand/15 blur-3xl" aria-hidden />
        {/* de route: serpentine die precies door de vijf stations loopt */}
        <svg viewBox="0 0 336 420" fill="none" className="absolute inset-0 h-full w-full" aria-hidden>
          <path
            d="M70 46 C 205 62, 260 76, 246 110 C 232 162, 98 138, 92 174 C 86 224, 240 200, 246 238 C 253 280, 146 268, 128 298"
            stroke="#2f9e6e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="1 11"
          />
        </svg>
        {stations.map((s) => (
          <p
            key={s.label}
            className={`absolute whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-bold shadow-md ${
              s.brand ? "bg-brand text-white" : "bg-white text-ink ring-1 ring-black/5"
            }`}
            style={{
              left: `${(s.x / 336) * 100}%`,
              top: `${(s.y / 420) * 100}%`,
              transform: `translate(-50%, -50%) rotate(${s.rot}deg)`,
            }}
          >
            {s.label}
          </p>
        ))}
      </div>
    );
  }

  if (soort === "plattegrond")
    return (
      <div className="absolute inset-0 bg-ink">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(251,246,238,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(251,246,238,0.07) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
          aria-hidden
        />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/20 blur-3xl" aria-hidden />
        {/* het bord */}
        <div className="absolute left-1/2 top-7 h-2 w-28 -translate-x-1/2 rounded-full bg-cream/60" aria-hidden />
        {/* de tafelgroepjes, met een paar namen erin */}
        <Tafelgroep className="absolute left-7 top-[19%] -rotate-3" namen={[null, "Sofie", null, null]} />
        <Tafelgroep
          className="absolute right-6 top-[31%] rotate-2"
          accent={2}
          namen={[null, null, "Yassin", null]}
        />
        <Tafelgroep className="absolute left-[26%] top-[54%] rotate-1" namen={["Mila", null, null, null]} />
      </div>
    );

  if (soort === "werkbladen")
    return (
      <div className="absolute inset-0 bg-brand">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/20 blur-3xl" aria-hidden />
        {/* het werkblad zelf */}
        <div className="absolute left-1/2 top-[46%] w-[80%] -translate-x-1/2 -translate-y-1/2 rotate-2 rounded-xl bg-white p-5 shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/40">
            Werkblad · spelling
          </p>
          <p className="mt-3 text-sm font-bold text-ink">1. Vul in: ei of ij?</p>
          <p className="mt-1.5 text-sm leading-7 text-ink/80">
            De kon
            <span
              className="mx-0.5 inline-block w-5 border-b-2 border-ink/45 align-[-0.1em]"
              aria-hidden
            />
            nen zitten in het hok.
          </p>
          <p className="mt-3 text-sm font-bold text-ink">2. Zoek de woorden</p>
          <div className="mt-1.5 flex items-start gap-2.5">
            {/* 5×4-rooster; 'hok' loopt verticaal, 'reis' diagonaal (echte
               woordzoeker, niet alles keurig links-naar-rechts). 'dag' staat
               er ook echt in (rij 3, horizontaal) — die mag de kijker vinden. */}
            <div className="grid grid-cols-5 gap-1" aria-hidden>
              {(() => {
                // hok = kolom 0 (idx 0,5,10); reis = diagonaal ↙ (idx 3,7,11,15);
                // dag = idx 12,13,14, nog niet aangestreept
                const letters = ["H", "T", "B", "R", "M", "O", "N", "E", "L", "P", "K", "I", "D", "A", "G", "S", "T", "A", "J", "E"];
                const hok = new Set([0, 5, 10]);
                const reis = new Set([3, 7, 11, 15]);
                return letters.map((letter, i) => (
                  <span
                    key={i}
                    className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${
                      hok.has(i)
                        ? "bg-brand text-white"
                        : reis.has(i)
                          ? "bg-accent/80 text-ink"
                          : "bg-cream text-ink/55"
                    }`}
                  >
                    {letter}
                  </span>
                ));
              })()}
            </div>
            <ul className="space-y-1 text-xs font-bold">
              <li className="flex items-center gap-1 text-ink/40 line-through">
                <Vink className="h-3 w-3 text-brand" dik={4} /> hok
              </li>
              <li className="flex items-center gap-1 text-ink/40 line-through">
                <Vink className="h-3 w-3 text-accent" dik={4} /> reis
              </li>
              <li className="text-ink/70">dag</li>
            </ul>
          </div>
        </div>
        <p className="font-hand absolute left-6 top-5 -rotate-2 text-xl text-white">
          klaar om te printen
        </p>
      </div>
    );

  if (soort === "draaiboek")
    return (
      <div className="absolute inset-0 bg-accent-soft">
        <div className="absolute -left-14 -top-14 h-56 w-56 rounded-full bg-accent/30 blur-3xl" aria-hidden />
        <p className="absolute left-5 top-6 -rotate-2 rounded-lg bg-ink px-3 py-1.5 font-display text-sm font-bold text-cream shadow-md">
          Kerstdiner · het draaiboek
        </p>
        {/* de tijdlijn van de avond */}
        <div className="absolute bottom-[26%] left-9 top-[24%] w-0.5 rounded-full bg-ink/15" aria-hidden />
        {[
          { tijd: "17:00", wat: "inloop ouders", klaar: true, top: "26%" },
          { tijd: "17:30", wat: "kerstdiner", klaar: true, top: "42%" },
          { tijd: "18:15", wat: "optreden groep 5", klaar: false, top: "58%" },
        ].map((r) => (
          <div key={r.tijd} className="absolute left-6 flex items-center gap-3" style={{ top: r.top }}>
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                r.klaar ? "bg-brand text-white" : "bg-white ring-1 ring-ink/15"
              }`}
              aria-hidden
            >
              {r.klaar && <Vink className="h-3 w-3" dik={4} />}
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-ink shadow-sm">
              {r.tijd} · {r.wat}
            </span>
          </div>
        ))}
      </div>
    );

  /* weekplanning */
  return (
    <div className="absolute inset-0 bg-brand-dark">
      <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" aria-hidden />
      {/* de week als vijf kolommen */}
      <div className="absolute inset-x-6 bottom-[24%] top-[16%] grid grid-cols-5 gap-2" aria-hidden>
        {[
          { dag: "ma", blokken: ["h-12 bg-white/85", "h-16 bg-white/40", "h-10 bg-brand-soft/80"] },
          { dag: "di", blokken: ["h-16 bg-white/40", "h-10 bg-white/85", "h-14 bg-white/40"] },
          { dag: "wo", blokken: ["h-10 bg-white/85", "h-12 bg-accent", "h-8 bg-white/40"] },
          { dag: "do", blokken: ["h-14 bg-white/40", "h-16 bg-brand-soft/80", "h-10 bg-white/85"] },
          { dag: "vr", blokken: ["h-12 bg-white/85", "h-10 bg-white/40"] },
        ].map((kolom) => (
          <div key={kolom.dag} className="flex flex-col gap-1.5">
            <span className="text-center text-xs font-bold text-white/70">{kolom.dag}</span>
            {kolom.blokken.map((blok, i) => (
              <span key={i} className={`w-full rounded-lg ${blok}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Alle eigen CSS: reveals, vink-pops en demo's. ─────────────────────── */
function StijlBlok() {
  return (
    <style>{`
      .font-hand { font-family: var(--font-hand), "Segoe Print", cursive; }

      /* Reveals: inhoud is standaard zichtbaar; .anim voegt de beweging toe. */
      .anim [data-reveal] {
        opacity: 0;
        transform: translateY(18px);
        transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
          transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .anim [data-reveal].is-in { opacity: 1; transform: none; }

      /* ── De tool-galerij ── */
      /* Slepen: de rail pakt de muis vast; tijdens het slepen geen snap. */
      .tool-rail { cursor: grab; scroll-snap-type: x proximity; }
      .tool-rail.sleept { cursor: grabbing; scroll-snap-type: none; scroll-behavior: auto; }

      /* De kaarten komen één voor één van rechts binnen — alléén in de
         handmatige rail. In de gepinde variant zijn ze meteen zichtbaar
         (de pin ís de reveal). Via translate zodat hover-translate blijft werken. */
      .anim .tool-rail .rail-kaart {
        opacity: 0;
        translate: 72px 0;
        transition: opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1),
          translate 0.65s cubic-bezier(0.22, 1, 0.36, 1);
        transition-delay: calc(var(--i) * 90ms);
      }
      .anim .tool-rail.is-in .rail-kaart { opacity: 1; translate: 0 0; }

      /* Filmkorrel over de kaartbeelden: maakt de vlakken materiaal. */
      .kaart-grain {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
        background-size: 160px 160px;
        mix-blend-mode: overlay;
        opacity: 0.35;
      }

      /* Vink-pop: kort en met karakter, zoals het merk-moment hoort. */
      @keyframes vinkpop {
        0% { transform: scale(0.5); opacity: 0; }
        60% { transform: scale(1.18); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
      .anim .vinkpop { animation: vinkpop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

      /* Knoppen mogen voelen dat je ze indrukt. */
      .knop-druk:active { transform: scale(0.97); }

      /* Slotvinkje tekent zichzelf. */
      .anim [data-reveal] .slotvink path {
        stroke-dasharray: 1;
        stroke-dashoffset: 1;
        transition: stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        transition-delay: var(--vertraag, 0.3s);
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

      @media (prefers-reduced-motion: reduce) {
        .anim [data-reveal] { opacity: 1; transform: none; transition: none; }
      }
    `}</style>
  );
}

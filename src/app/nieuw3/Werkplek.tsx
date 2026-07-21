"use client";

import Link from "next/link";
import { useRef, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Prijzen from "@/components/Prijzen";
import Logo from "@/components/Logo";
import { PROEF_DAGEN } from "@/lib/abonnement";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* ──────────────────────────────────────────────────────────────────────────
   "Alles op z'n plek" — de film + de kalme onderbouw.

   De opening is het scherm dat elke leerkracht kent: vensters, tabbladen
   en geeltjes, 's avonds laat. Scrollen ruimt op. Elk venster vliegt naar
   zijn plek in een dashboard dat midden in beeld ontstaat; bij elke landing
   klikt er een vinkje. Het avondlicht wordt daglicht en de film zet je
   zonder knip neer op de werkplek zelf. Daarna: leesrust.

   Techniek: CSS-sticky podium + één GSAP-tijdlijn met scrub.
   Vluchtbanen worden gemeten (function-based + invalidateOnRefresh),
   zodat vensters ook na een resize precies op hun tegel landen.
   Alles is transform/opacity. prefers-reduced-motion krijgt een
   stilstaande versie met dezelfde inhoud (de opgeruimde eindstand).
   ────────────────────────────────────────────────────────────────────────── */

/* ── Teksten (grotendeels van de bestaande landingspagina) ─────────────── */

const pijnpunten = [
  {
    titel: "Te veel administratie",
    tekst:
      "Je wilt er zijn voor je klas, maar raakt steeds meer tijd kwijt aan formulieren, analyses en verslagen.",
  },
  {
    titel: "Alles staat verspreid",
    tekst:
      "Voor elke taak weer een andere tool, website of document. Niets komt op één plek samen.",
  },
  {
    titel: "Het werk gaat mee naar huis",
    tekst:
      "Avonden en weekenden vullen zich met taken die je eigenlijk allang af had willen hebben.",
  },
];

const tools = [
  {
    naam: "Toetsanalyse",
    winst: "± 35 min per week",
    tekst:
      "In één oogopslag zie je hoe je groep ervoor staat en wie wat extra aandacht kan gebruiken. Geen uren meer puzzelen in Excel.",
    kleur: "bg-sky-500",
    tint: "bg-sky-50",
  },
  {
    naam: "Rapporten",
    winst: "± 45 min per week",
    tekst:
      "Warme, persoonlijke rapportteksten die klinken alsof jij ze schreef. Want dat deed je, alleen een stuk sneller.",
    kleur: "bg-violet-500",
    tint: "bg-violet-50",
  },
  {
    naam: "Oudercontact",
    winst: "± 15 min per week",
    tekst:
      "Oudergesprekken, weekberichten en ouderberichten, in een paar minuten klaar. Nooit meer staren naar een leeg scherm.",
    kleur: "bg-rose-500",
    tint: "bg-rose-50",
  },
  {
    naam: "Lesontwerp",
    winst: "± 25 min per week",
    tekst:
      "Lever een lesdoel aan en krijg een complete, kant-en-klare les terug: met opbouw, bouwstenen en praktische tips. Klaar om voor de klas te gebruiken.",
    kleur: "bg-teal-500",
    tint: "bg-teal-50",
  },
  {
    naam: "Plattegrond",
    winst: "scheelt een avond puzzelen",
    tekst:
      "Schuif je klasplattegrond in elkaar met een paar klikken. Of laat Avinka slim plaatsen op basis van je sociogram, met jouw wensen altijd als leidend.",
    kleur: "bg-amber-500",
    tint: "bg-amber-50",
  },
];

const faq = [
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

/* ── Kleine bouwstenen voor de film ────────────────────────────────────── */

// Een zwevend "venster" op het rommelige bureaublad. Bewust rustig getekend:
// zachte schaduw, dunne rand, één neutraal balkje met de bestandsnaam.
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

// Een tool-tegel in het mini-dashboard: dezelfde opbouw als de echte tegels
// op de Start-pagina (wit kaartje, gekleurd icoon-vierkant, naam, "Openen →").
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

/* ── De pagina ─────────────────────────────────────────────────────────── */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function abonneerReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export default function Werkplek({ fotoBestand }: { fotoBestand?: string }) {
  const root = useRef<HTMLDivElement>(null);
  // null op de server (eerste paint), daarna de echte systeemvoorkeur.
  const reduced = useSyncExternalStore<boolean | null>(
    abonneerReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => null,
  );

  // Bij verminderde beweging (of vóór hydratatie) tonen we meteen de
  // opgeruimde eindstand: dashboard zichtbaar, geen vliegende vensters.
  const film = reduced === false;

  useGSAP(
    () => {
      if (!film) return;
      const q = gsap.utils.selector(root);

      /* ── Beginstanden ── */
      gsap.set(q("[data-venster]"), { autoAlpha: 1 });
      // Tegels beginnen als zachte "spookjes": je ziet de lege plekken die
      // straks gevuld worden, in plaats van een gapend leeg vlak.
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
        // display:none (mobiel verbergt een paar vensters) → geen vlucht.
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
      const vlucht = (
        naam: string,
        doelSel: string,
        t: number,
        vinkSel?: string,
      ) => {
        const b = baan(naam, doelSel);
        if (b) {
          tl.to(
            b.el,
            { x: b.dx, y: b.dy, scale: 0.3, rotation: 0, duration: 7 },
            t,
          );
          tl.to(b.el, { autoAlpha: 0, duration: 2 }, t + 5);
        }
        // De landing zelf (tegel of taakrij) verschijnt ook als het venster
        // op dit formaat verborgen is; het dashboard wordt altijd compleet.
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
      vlucht("word", '[data-tegel="rapporten"]', 31, '[data-tegelvink="rapporten"]');
      vlucht("excel", '[data-tegel="toets"]', 35.5, '[data-tegelvink="toets"]');
      vlucht("mail", '[data-tegel="ouder"]', 40, '[data-tegelvink="ouder"]');
      vlucht("melding", '[data-taakrij="2"]', 44.5);
      vlucht("plattegrond", '[data-tegel="plattegrond"]', 49, '[data-tegelvink="plattegrond"]');
      vlucht("les", '[data-tegel="les"]', 53.5, '[data-tegelvink="les"]');
      vlucht("browser", '[data-tegel="werkbladen"]', 58, '[data-tegelvink="werkbladen"]');
      vlucht("geel2", '[data-taakrij="3"]', 62.5);

      // De overvolle map hoeft nergens heen: die is gewoon niet meer nodig.
      tl.to(q('[data-venster="map"]'), { scale: 0.5, autoAlpha: 0, rotation: 0, duration: 6 }, 64);

      /* ── 71-79 · de taken worden afgevinkt (het merk-moment) ── */
      [1, 2, 3].forEach((n, i) => {
        tl.to(`[data-taakvink="${n}"]`, { autoAlpha: 1, scale: 1, duration: 2, ease: "back.out(2)" }, 71 + i * 2.5);
        tl.to(`[data-taaktekst="${n}"]`, { opacity: 0.5, duration: 2 }, 71 + i * 2.5);
      });

      /* ── 72-92 · avond wordt dag; de belofte blijft staan en kleurt mee ── */
      tl.to(q("[data-avondlaag]"), { opacity: 0, duration: 20, ease: "power1.inOut" }, 72);
      tl.to(q("[data-daglaag]"), { opacity: 1, duration: 20, ease: "power1.inOut" }, 72);
      tl.to(q("[data-belofte]"), { color: "#221c3a", duration: 14, ease: "power1.inOut" }, 74);
      tl.add(() => {
        // Op voortgang gebaseerd (niet toggle), zodat heen en weer scrubben
        // de kopbalk altijd in de juiste stand zet.
        const st = tl.scrollTrigger;
        q("[data-header]")[0]?.classList[st && st.progress > 0.79 ? "add" : "remove"]("film-klaar");
      }, 80);

      /* ── 86-98 · de payoff ── */
      tl.to(q("[data-winstchip]"), { autoAlpha: 1, y: 0, duration: 4, ease: "back.out(1.6)" }, 86);
      tl.to(q("[data-slotwoord]"), { autoAlpha: 1, y: 0, duration: 6, ease: "power2.out" }, 90);
    },
    { scope: root, dependencies: [film], revertOnUpdate: true },
  );

  return (
    <div ref={root} className="flex flex-1 flex-col bg-cream text-ink">
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
            <Logo vol className="h-8 w-auto" priority />
          </span>
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              data-skiplink
              href="#verder"
              className={`rounded-lg px-2.5 py-2 text-sm font-semibold transition sm:text-base ${
                film ? "text-cream/90 hover:text-white" : "text-ink/70 hover:text-ink"
              } [[data-header].film-klaar_&]:text-ink/70 [[data-header].film-klaar_&]:hover:text-ink`}
            >
              Liever meteen lezen?
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

      {/* ════════════════════════ DE FILM ════════════════════════ */}
      <section
        data-film-scroll
        aria-label="Avinka ruimt je schoolwerk op"
        className={film ? "relative h-[300vh]" : "relative"}
      >
        <div
          className={
            film
              ? "sticky top-0 flex h-screen flex-col items-center overflow-hidden pt-20 sm:pt-24"
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
          <div data-intro className="relative z-30 mx-auto mt-[4vh] w-[min(94vw,62rem)] text-center">
            <h1
              data-belofte
              className={`font-display text-[clamp(2.6rem,6vw,4.5rem)] font-black leading-[1.04] tracking-tight [text-wrap:balance] ${
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
                className="left-[3%] top-[34%] w-56 -rotate-[5deg] sm:left-[3%] sm:top-[32%] sm:w-64"
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
                className="hidden w-52 rotate-[4deg] sm:right-[3%] sm:top-[30%] sm:block sm:w-60"
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

              {/* Geeltjes */}
              <div
                data-venster="geel1"
                className="absolute left-[50%] top-[34%] w-36 -rotate-[7deg] rounded-sm bg-accent-soft p-3 text-[11px] font-semibold leading-snug text-ink/80 shadow-[0_16px_36px_-10px_rgba(8,5,20,0.6)] sm:left-[52%] sm:top-[33%]"
              >
                oudergesprekken plannen!!
              </div>
              <div
                data-venster="geel2"
                className="absolute right-[5%] top-[46%] w-32 rotate-[8deg] rounded-sm bg-accent-soft p-3 text-[11px] font-semibold leading-snug text-ink/80 shadow-[0_16px_36px_-10px_rgba(8,5,20,0.6)] sm:right-[12%] sm:top-[42%]"
              >
                rapporten af vóór vrijdag
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
          <div data-paneel className="relative z-10 mt-5 w-[min(92vw,44rem)] sm:mt-7">
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

              <div className="bg-cream px-4 py-4 sm:px-5">
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
                  <ul className="mt-1.5 grid gap-1.5 text-[11px] font-semibold text-ink/85 sm:grid-cols-3 sm:gap-2">
                    {[
                      { n: 1, t: "oudergesprekken plannen" },
                      { n: 2, t: "ouders terugmailen" },
                      { n: 3, t: "rapporten vóór vrijdag" },
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
                Dit is jouw werkplek. Scroll verder, dan laten we zien hoe hij werkt.
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

      {/* ════════════════════════ DE ONDERBOUW ════════════════════════ */}
      <main id="verder" className="relative z-10 scroll-mt-16">
        {/* 1. Wat dit is + CTA boven de vouw na de film */}
        <section className="mx-auto w-full max-w-3xl px-6 pb-16 pt-24 text-center">
          <h2 className="font-display text-4xl font-black tracking-tight [text-wrap:balance]">
            Eén werkplek voor al je schoolwerk
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-ink/70">
            Avinka vermindert de administratieve werkdruk van leerkrachten met
            slimme AI-tools. Minder uitzoekwerk, minder typwerk, meer tijd voor
            lesgeven en persoonlijke aandacht.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="w-full rounded-2xl bg-brand px-8 py-4 text-lg font-bold text-white shadow-lg shadow-brand/25 transition hover:-translate-y-0.5 hover:bg-brand-dark sm:w-auto"
            >
              Probeer Avinka gratis
            </Link>
            <a
              href="#klaarstaan"
              className="w-full rounded-2xl border-2 border-ink/10 bg-white px-8 py-4 text-lg font-bold text-ink transition hover:border-ink/20 sm:w-auto"
            >
              Bekijk wat er klaarstaat
            </a>
          </div>
          <p className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm font-bold text-ink/60">
            <span>🔒 Privacy als uitgangspunt</span>
            <span>🇳🇱 Volledig Nederlands</span>
            <span>💚 Door een leerkracht gemaakt</span>
            <span>✓ Maandelijks opzegbaar</span>
          </p>
        </section>

        {/* 2. Waarom dit bestaat (pijn, zonder kaartjes-grid) */}
        <section className="border-y border-black/5 bg-white">
          <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-20 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
            <div>
              <h2 className="font-display text-3xl font-black tracking-tight [text-wrap:balance] sm:text-4xl">
                Dat scherm van net? Gewoon een dinsdagavond.
              </h2>
              <p className="mt-5 text-lg leading-8 text-ink/70">
                Het hoort bij het werk. Maar het kan{" "}
                <span className="font-bold text-brand">sneller, slimmer en efficiënter</span>.
              </p>
            </div>
            <ul className="space-y-6 self-center">
              {pijnpunten.map((p) => (
                <li key={p.titel} className="flex gap-4">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" aria-hidden />
                  <p className="leading-7 text-ink/75">
                    <span className="font-bold text-ink">{p.titel}.</span> {p.tekst}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3. De tools, als rijen met tijdwinst en een optelsom */}
        <section id="klaarstaan" className="mx-auto w-full max-w-5xl scroll-mt-20 px-6 py-24">
          <h2 className="font-display text-4xl font-black tracking-tight [text-wrap:balance]">
            Wat er voor je klaarstaat
          </h2>
          <p className="mt-4 max-w-xl text-lg text-ink/60">
            Het platform groeit met je mee: er komen steeds nieuwe tools bij die
            je werk lichter maken.
          </p>

          <div className="mt-12 divide-y divide-black/5">
            {tools.map((tool) => (
              <div
                key={tool.naam}
                className="grid gap-3 py-7 sm:grid-cols-[15rem_1fr] sm:gap-8"
              >
                <div>
                  <h3 className="flex items-center gap-2.5 font-display text-2xl font-black tracking-tight">
                    <span className={`h-3 w-3 rounded-full ${tool.kleur}`} aria-hidden />
                    {tool.naam}
                  </h3>
                  <p className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-bold text-ink/70 ${tool.tint}`}>
                    {tool.winst}
                  </p>
                </div>
                <p className="self-center leading-8 text-ink/70">{tool.tekst}</p>
              </div>
            ))}
            {/* De volgende op de roadmap */}
            <div className="grid gap-3 py-7 sm:grid-cols-[15rem_1fr] sm:gap-8">
              <div>
                <h3 className="flex items-center gap-2.5 font-display text-2xl font-black tracking-tight text-ink/60">
                  <span className="h-3 w-3 rounded-full border-2 border-dashed border-ink/30" aria-hidden />
                  Werkbladen
                </h3>
                <p className="mt-2 inline-block rounded-full bg-brand-soft px-3 py-1 text-sm font-bold text-brand-dark">
                  binnenkort
                </p>
              </div>
              <p className="self-center leading-8 text-ink/60">
                Maak in een paar klikken een passend werkblad bij je les. De
                volgende tool die eraan komt.
              </p>
            </div>
          </div>

          <p className="mt-10 rounded-2xl bg-sand px-6 py-5 text-center text-lg font-bold text-ink sm:text-xl">
            35 + 45 + 15 + 25 minuten. Bij elkaar{" "}
            <span className="text-brand">zo&rsquo;n twee uur, elke week weer</span>.
          </p>
        </section>

        {/* 4. Privacy, zichtbaar gemaakt */}
        <section className="bg-ink text-cream">
          <div className="mx-auto grid w-full max-w-5xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
            <div>
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
            {/* Demo: wat de AI wel en niet ziet */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-white p-5 text-ink shadow-lg">
                <p className="text-xs font-bold uppercase tracking-wide text-ink/45">
                  Wat jij typt
                </p>
                <p className="mt-2 leading-7">
                  <mark className="rounded-md bg-accent-soft px-1.5 py-0.5 font-bold">Sofie</mark>{" "}
                  kan de sommen tot 100 nu vlot maken en groeide dit halfjaar flink.
                </p>
              </div>
              <p className="text-center text-2xl" aria-hidden>
                ↓
              </p>
              <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-bold uppercase tracking-wide text-cream/60">
                  Wat de AI te zien krijgt
                </p>
                <p className="mt-2 leading-7 text-cream">
                  <span className="rounded-md bg-brand px-1.5 py-0.5 font-bold text-white">
                    leerling A
                  </span>{" "}
                  kan de sommen tot 100 nu vlot maken en groeide dit halfjaar flink.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. De regie blijft bij jou */}
        <section className="mx-auto w-full max-w-5xl px-6 py-24">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            <div>
              <h2 className="font-display text-4xl font-black tracking-tight [text-wrap:balance]">
                Jij houdt het laatste woord
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-ink/70">
                Avinka schrijft de voorzet, jij houdt het laatste woord. Niets
                gaat zonder jou de deur uit. En de cijfers? Die berekent de tool
                zelf, dus die kloppen altijd. De AI schrijft alleen de tekst
                eromheen en verzint nooit getallen of feiten.
              </p>
            </div>
            <div className="space-y-6 self-center">
              <div className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-xl" aria-hidden>
                  ✉️
                </span>
                <p className="leading-7 text-ink/75">
                  <span className="font-bold text-ink">Niet ingewikkeld.</span>{" "}
                  Net zo makkelijk als een mailtje typen. Je hoeft niets te
                  leren en weet meteen wat je moet doen.
                </p>
              </div>
              <div className="flex gap-4">
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

        {/* 6. De maker */}
        <section className="mx-auto w-full max-w-5xl px-6 pb-24">
          <div className="rounded-[2rem] bg-sand px-8 py-14 sm:px-14">
            <div className="flex flex-col gap-8 sm:flex-row sm:gap-12">
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
                <p className="mt-8 font-display text-xl font-black italic">Michael van Spanje</p>
                <p className="text-sm text-ink/60">Leerkracht &amp; maker van Avinka</p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Eerlijk over ervaringen (geen verzonnen quotes) */}
        <section className="border-y border-black/5 bg-white">
          <div className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
            <h2 className="font-display text-3xl font-black tracking-tight [text-wrap:balance]">
              Wat leerkrachten zeggen
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-ink/70">
              Deze zomer test een groep leerkrachten Avinka in de praktijk. Hun
              ervaringen komen hier te staan, in hun eigen woorden. Geen
              verzonnen quotes, dat beloven we.
            </p>
          </div>
        </section>

        {/* 8. Prijzen */}
        <Prijzen />

        {/* 9. Veelgestelde vragen */}
        <section id="vragen" className="scroll-mt-16 bg-white">
          <div className="mx-auto w-full max-w-3xl px-6 py-24">
            <h2 className="text-center font-display text-4xl font-black tracking-tight [text-wrap:balance]">
              Veelgestelde vragen
            </h2>
            <div className="mt-12 space-y-4">
              {faq.slice(0, 4).map((item) => (
                <details
                  key={item.vraag}
                  className="group/faq rounded-2xl border border-black/5 bg-cream p-6 [&_summary]:cursor-pointer"
                >
                  <summary className="flex list-none items-center justify-between text-lg font-bold">
                    {item.vraag}
                    <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-transform group-open/faq:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 leading-8 text-ink/70">{item.antwoord}</p>
                </details>
              ))}
              <details className="group/more">
                <summary className="flex cursor-pointer list-none items-center justify-center gap-2 py-2 text-center text-base font-bold text-brand hover:underline">
                  Nog meer veelgestelde vragen
                  <span className="text-lg transition-transform group-open/more:rotate-180">⌄</span>
                </summary>
                <div className="mt-4 space-y-4">
                  {faq.slice(4).map((item) => (
                    <details
                      key={item.vraag}
                      className="group/faq rounded-2xl border border-black/5 bg-cream p-6 [&_summary]:cursor-pointer"
                    >
                      <summary className="flex list-none items-center justify-between text-lg font-bold">
                        {item.vraag}
                        <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-transform group-open/faq:rotate-45">
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

        {/* 10. Slot */}
        <section className="relative overflow-hidden bg-ink">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-brand/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative mx-auto w-full max-w-3xl px-6 py-24 text-center">
            <h2 className="font-display text-4xl font-black tracking-tight text-white [text-wrap:balance]">
              Kom binnen.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-cream/80">
              Je werkplek staat klaar. {PROEF_DAGEN} dagen gratis proberen,
              zonder betaalgegevens vooraf.
            </p>
            <Link
              href="/sign-up"
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

"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type SVGProps,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { signout } from "@/app/auth/actions";
import { PROEF_DAGEN } from "@/lib/abonnement";
import { WereldCijfers, toontCijfers, type Cijfers } from "./Cijfers";
import {
  SPECKLE_STIJL,
  BlobKnop,
  Confetti,
  Golf,
  KaartVlak,
  MINT_LICHT,
  RUIS_OP_PAPIER,
  KOP,
  Lichtbron,
  VLAK_MINT,
  VLAK_PAPIER,
  WereldFx,
  WereldIntro,
  WereldHerken,
  WereldMaker,
  WereldSlot,
} from "./Wereld";
import { WereldHoeWerktHet } from "./HoeWerktHet";
import { WereldPolaroids } from "./Polaroids";
import { WereldPrivacy } from "./Privacy";
import { WereldPrijzen, WereldVragen } from "./PrijzenVragen";

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
  /* Was "Namen blijven thuis". De eigenaar wilde die term kwijt; deze zegt
     hetzelfde in gewone woorden en sluit aan op de privacysectie verderop,
     waar de belofte "namen gaan nooit mee" wordt uitgelegd. */
  "🔒 Leerlingnamen gaan nooit mee",
  "🇳🇱 Volledig Nederlands",
  "💚 Door een leerkracht gemaakt",
  "✓ Maandelijks opzegbaar",
];

/* De herkenning boven de tools: het werk bij de naam noemen, in de taal van
   de leerkracht zelf. Kort houden; de kaarten eronder doen het echte werk. */
const PIJNPUNTEN = [
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
    titel: "Het schuift steeds door",
    tekst:
      "Taken die je eigenlijk allang af had willen hebben, blijven op de stapel liggen.",
  },
];

/* De regie blijft bij jou: drie beloftes, elk op een eigen kaartje. Bewust
   drie losse kaarten en geen doorlopend verhaal, want dit zijn drie dingen
   die je los van elkaar moet kunnen onthouden. */
const REGIE = [
  {
    titel: "Jij beslist",
    tekst:
      "Avinka schrijft de voorzet, jij beslist. Niets gaat zonder jou de deur uit.",
  },
  {
    titel: "Altijd bij te sturen",
    tekst:
      "Elke tekst is een voorstel. Aanpassen, inkorten of opnieuw laten schrijven kan met één klik, net zo makkelijk als een mailtje typen.",
  },
  {
    titel: "De cijfers kloppen altijd",
    tekst:
      "Die berekent de tool zelf. De AI schrijft alleen de tekst eromheen en verzint nooit getallen of feiten.",
  },
];

/* De tool-galerij: per tool één kunstkaart (Stripe-achtig, maar in onze
   eigen beeldtaal). Nieuwe tool = kaart erbij. `licht` bepaalt of de naam
   op de kaart een donker plaatje nodig heeft. */
export const KAARTEN = [
  {
    id: "rapporten",
    kort: "± 10 min",
    naam: "Rapporten",
    tijd: "± 10 minuten per rapport",
    zin: "Rapportteksten die klinken alsof jij ze schreef.",
    uitleg:
      "Je geeft per leerling een paar steekwoorden en Avinka maakt er lopende rapportteksten van, in jouw toon en op het niveau dat jij kiest. Jij leest na, past aan en kopieert elk verhaal met één klik naar je eigen systeem.",
    licht: false,
  },
  {
    id: "toetsanalyse",
    kort: "± 3 uur",
    naam: "Toetsanalyse",
    tijd: "± 3 uur per toetsronde",
    zin: "Zie in één oogopslag wie extra aandacht nodig heeft.",
    uitleg:
      "Voor IEP en Cito. Avinka haalt alle gegevens uit je toetsoverzicht en zet ze om in een analyse zoals jij die zelf zou schrijven: waar je groep staat, welke leerlingen opvallen en welke zorgen klassikaal aandacht vragen. Een stevige basis voor je eigen analyse, die je alleen nog hoeft aan te scherpen.",
    licht: false,
  },
  {
    id: "oudercontact",
    kort: "± 2–20 min",
    naam: "Oudercontact",
    tijd: "± 2 tot 20 minuten per bericht",
    zin: "Kwalitatieve berichten aan ouders in jouw stijl.",
    uitleg:
      "Van een kort berichtje tot een informatiebrief aan alle ouders: je vertelt wat er speelt en je krijgt een nette tekst terug die je alleen nog hoeft na te lezen. Een berichtje is zo klaar, een brief scheelt al gauw twintig minuten. Ook voor lastige boodschappen, want de toon kies je zelf.",
    licht: false,
  },
  {
    id: "lesontwerp",
    kort: "± 25 min",
    naam: "Lesontwerp",
    tijd: "± 25 minuten per les",
    zin: "Van één leerdoel naar een compleet doordachte les.",
    uitleg:
      "Geef een leerdoel op en je krijgt een complete les terug volgens het EDI-model. Je kiest zelf het lestype, van een korte instructie tot een bewegende of coöperatieve les. Met succescriteria, bouwstenen en differentiatie.",
    licht: true,
  },
  {
    id: "plattegrond",
    kort: "± 20 min",
    naam: "Plattegrond",
    tijd: "± 20 minuten per opstelling",
    zin: "De slimme klassenopstelling.",
    uitleg:
      "Een plattegrond op basis van jouw wensen of van een sociogram dat je uploadt. Avinka legt de basis, jij verschuift waar nodig. Want jij kent je klas het best.",
    licht: false,
  },
  {
    id: "werkbladen",
    kort: "± 15 min",
    naam: "Werkbladen",
    tijd: "± 15 minuten per werkblad",
    zin: "Werkbladen die precies bij je les passen.",
    uitleg:
      "Kies een vakgebied/onderwerp en je krijgt een printklaar werkblad. Je geeft je voorkeuren door en kunt het laten aansluiten op een lesontwerp. Ook maak je er hele boekjes mee als ondersteuningsmateriaal.",
    licht: false,
  },
  {
    id: "draaiboek",
    kort: "± 3 uur",
    naam: "Draaiboek",
    tijd: "± 3 uur per draaiboek",
    zin: "Een uitgedacht schoolevenement.",
    uitleg:
      "Van kerstdiner tot schoolreis. Je geeft je wensen door en krijgt een compleet draaiboek met tijdlijn, taakverdeling, boodschappenlijst en nog veel meer. Klaar om te delen met je collega's en te gebruiken als werkbestand.",
    licht: true,
  },
  {
    id: "weekplanning",
    kort: "± 30 min",
    naam: "Weekplanning",
    tijd: "± 30 minuten per planning",
    zin: "Je week compleet ingepland.",
    uitleg:
      "Een weekplanning die wordt opgesteld op basis van jouw wensen, ook voor de uren na schooltijd. Avinka houdt rekening met drukke periodes en vinkt je taken af. Koppelen aan je persoonlijke agenda en de schoolagenda is ook mogelijk.",
    licht: false,
  },
];

export const FAQ = [
  {
    vraag: "Gaan de gegevens van mijn leerlingen ergens heen?",
    antwoord:
      "Nee. Namen, plaatsen en contactgegevens worden op je eigen apparaat onleesbaar gemaakt voordat er iets wordt verstuurd. Je account staat bovendien op beveiligde servers in Europa. Privacy is bij Avinka de ruggengraat, geen bijzaak.",
  },
  {
    vraag: "Waarom zou ik dit gebruiken en niet gewoon ChatGPT?",
    antwoord:
      "Omdat je daar het werk eromheen zelf doet. Avinka weet al hoe een rapport, een toetsanalyse of een lesontwerp eruit hoort te zien: de opbouw en de didactiek zitten in de tool, niet in een prompt die je elke keer opnieuw moet bedenken. Het rekenwerk doet de tool zelf, dus daar kan niets in verzonnen worden. Namen van je leerlingen worden onleesbaar gemaakt voordat er iets wordt verstuurd. En je krijgt geen chatvenster terug maar een bestand dat je meteen kunt printen of bewaren.",
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

export function Vink({
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

/* De landingspagina zelf. Het serverwerk (wie is de bezoeker, mag die de
   prijzen zien, staat er een foto klaar) gebeurt in ../page.tsx; hier komt dat
   binnen als drie kale props, zodat dit een client-component kan blijven — de
   film en alle beweging hebben de browser nodig. */
export default function Landing({
  fotoBestand,
  ingelogd = false,
  toonPrijzen = true,
  cijfers = null,
  bijhouden = true,
}: {
  fotoBestand?: string;
  ingelogd?: boolean;
  toonPrijzen?: boolean;
  /* De gemeenschapscijfers voor het klapbord. null = nog geen data, en dan
     laat WereldCijfers zichzelf helemaal weg. Zie Cijfers.tsx. */
  cijfers?: Cijfers | null;
  /* false bij een voorbeeldbord (?cijfers=demo): dan blijft het bord staan op
     de meegegeven getallen in plaats van de echte op te halen. */
  bijhouden?: boolean;
}) {
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
      /* "2 uur" is in de avond lichter mint (leesbaar op donkergroen) en
         kleurt met de dag mee terug naar het merkgroen. */
      tl.to(q("[data-uur]"), { color: "var(--color-brand, #2f9e6e)", duration: 14, ease: "power1.inOut" }, 74);
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

    /* De leesband: de regel waar je nu bent staat scherp, de andere wachten
       gedempt. Loopt beide kanten op, dus terugscrollen werkt ook. */
    const leesIo = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => e.target.classList.toggle("leest", e.isIntersecting)),
      // Smalle band (zo'n 10% van het scherm) zodat er meestal één regel
      // tegelijk scherp staat en je oog echt meeloopt.
      { rootMargin: "-42% 0px -48% 0px" },
    );
    el.querySelectorAll("[data-leesregel]").forEach((r) => leesIo.observe(r));

    return () => {
      io.disconnect();
      leesIo.disconnect();
    };
  }, [reduced]);

  return (
    <div ref={root} className="flex flex-1 flex-col bg-[var(--w-papier,#fcfbf7)] text-ink">
      <StijlBlok />

      {/* ── Vaste bovenbalk ── */}
      <header
        data-header
        className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
          film ? "" : "film-klaar"
        } [&.film-klaar]:border-b [&.film-klaar]:border-black/5 [&.film-klaar]:bg-[color-mix(in_srgb,var(--w-papier,#fcfbf7)_85%,transparent)] [&.film-klaar]:backdrop-blur`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <span className="rounded-xl bg-cream/95 px-2.5 py-1.5 shadow-sm ring-1 ring-black/5">
            {/* Gewone img: de dev-optimizer van next/image laadt traag. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Avinka_logo.png" alt="Avinka" className="h-8 w-auto" />
          </span>
          {/* ⚠️ De balk is tijdens de film doorzichtig, en de film BEGINT op de
             donkergroene avondlaag en eindigt op licht papier. Een gewone
             tekstlink zou daar dus eerst onleesbaar zijn. Vandaar dat de
             tweede-keus-actie hetzelfde crème plaatje krijgt als het logo:
             die leest op allebei de ondergronden. */}
          <nav className="flex items-center gap-2 sm:gap-3">
            {ingelogd ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-dark sm:py-2 sm:text-base"
                >
                  Mijn dashboard
                </Link>
                <form action={signout}>
                  <button
                    type="submit"
                    className="rounded-xl bg-cream/95 px-3.5 py-3 text-sm font-semibold text-ink/80 shadow-sm ring-1 ring-black/5 transition hover:text-ink sm:py-2 sm:text-base"
                  >
                    Uitloggen
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="rounded-xl bg-cream/95 px-3.5 py-3 text-sm font-semibold text-ink/80 shadow-sm ring-1 ring-black/5 transition hover:text-ink sm:py-2 sm:text-base"
                >
                  Inloggen
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-dark sm:py-2 sm:text-base"
                >
                  Probeer gratis
                </Link>
              </>
            )}
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
          {/* Lichtlagen: avond onder, dag erboven ingefaded.
             De avond is hetzelfde diepe groen als het slotveld onderaan:
             de pagina opent en sluit in dezelfde kleur. De dag is exact
             het gespikkelde papier van de body, zodat de film naadloos in
             de werkplek-sectie overloopt in plaats van met een harde lijn. */}
          <div
            data-avondlaag
            className={`pointer-events-none absolute inset-0 bg-[var(--w-donker,#17503a)] ${film ? "" : "hidden"}`}
            aria-hidden
          >
            {/* warme bureaulamp rechtsboven */}
            <div className="absolute -right-24 -top-24 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(closest-side,rgba(245,158,11,0.32),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(6,24,17,0.55)_100%)]" />
          </div>
          <div data-daglaag className="pointer-events-none absolute inset-0" style={SPECKLE_STIJL} aria-hidden />

          {/* De grote belofte: groots, muisstil, en niets komt eroverheen */}
          <div data-intro className="relative z-30 mx-auto mt-[1.5vh] w-[min(94vw,62rem)] text-center">
            <h1
              data-belofte
              className={`font-display text-[clamp(2.4rem,5.5vw,4rem)] font-black leading-[1.04] tracking-tight [text-wrap:balance] ${
                film ? "text-cream" : "text-ink"
              }`}
            >
              Win elke week{" "}
              <span data-uur className={film ? "text-[var(--w-film-hoogtepunt,#6fd7a3)]" : "text-brand"}>
                2 uur
              </span>{" "}
              terug
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
                      {/* Werkbladen stond hier nog als "binnenkort"-tegel: een
                         gestippeld kadertje met een ✨ in plaats van een icoon,
                         uit de tijd dat de tool nog niet bestond. Het is nu een
                         gewone tool, dus ook een gewone tegel. Potlood, want
                         een werkblad is het enige wat de leerling zelf invult;
                         indigo omdat dat het verst af staat van de vijf
                         kleuren die er al liggen. */}
                      <Tegel naam="werkbladen" label="Werkbladen" emoji="✏️" kleur="bg-indigo-500" />
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
         uitleg begint. De strook was helemaal kaal — het eerste vormpje van de
         wereld begon pas een paar honderd pixels verderop — waardoor de film
         en de body als twee losse pagina's aan elkaar geplakt leken.

         Hier heeft een zacht verloop gestaan om die strook te vullen. Dat is er
         weer uit, want het maakte precies het probleem dat het moest oplossen:
         ⚠️ het verloop had zijn centrum op 88% breedte, bóvenaan de strook. Daar
         begint het dus op volle sterkte, terwijl de film erboven gewoon papier
         is — en dat geeft een harde horizontale rand op de sectiegrens. Links
         was het al uitgedoofd (het centrum ligt rechts), dus daar liep de kleur
         wél mooi door: precies het verschil links/rechts dat opviel.
         Les: een verloop dat op een rand begint, IS een rand. Wil je hier ooit
         weer iets, laat het dan in het midden van de strook beginnen en naar
         beide kanten uitdoven. */}
      <div aria-hidden style={{ height: film ? "14vh" : "6vh", ...SPECKLE_STIJL }} />

      {/* ════════════════════════ DE BODY ════════════════════════ */}
      <main id="verder" className="relative z-10 scroll-mt-16" style={SPECKLE_STIJL}>
        {/* De effecten-motor: wieg-animaties, scroll-parallax en muis-diepte. */}
        <WereldFx />

        {/* De lichtbron waar alle schaduwen op deze pagina bij horen. Staat
           binnen <main> zodat hij bij de body hoort en niet bij de film: die
           heeft zijn eigen avond-naar-dag-belichting. */}
        <Lichtbron />

        {/* ── 1. Herken je dit? Mint-veld met witte kaarten en het grote
           potlood-silhouet: het eerste kleurveld van de wereld.

           Stond eerst ná de intro, en dan ging de pagina van pijn (de film)
           naar oplossing (de intro) en wéér terug naar pijn. Nu loopt de
           ladder één kant op: de film laat de chaos zien, deze sectie zegt in
           woorden wat er misgaat, en pas daarna komt het antwoord. ── */}
        <WereldHerken />

        {/* ── 2. Wat Avinka is: kalm op het gespikkelde papier. Het antwoord
           op de drie pijnpunten hierboven. ── */}
        <WereldIntro />

        {/* ── 3. De tool-galerij: grote kunstkaarten, jij schuift ze zelf.
           Eigen ondergrond (zand) zodat het duidelijk een nieuw hoofdstuk is
           en niet doorloopt uit de herkenning erboven. Dat het één werkplek
           is en niet een tas losse tools, heeft de film bovenaan al laten
           zien; hier hoeft dat niet nog eens in tekst. Na de kaarten gaat de
           pagina direct door naar de privacybelofte. ── */}
        {/* ⚠️ Dit was een papieren sectie, en daarmee liep het papier drie
           secties lang door: intro → tools → zo werkt het. De pagina wisselt
           overal af tussen papier en een golvend mintveld, en precies op de
           plek waar de tools staan viel dat ritme stil. Nu is dit een eigen
           veld met een golf aan beide kanten, en gaat de pagina weer netjes
           om en om: mint (herken) → papier (intro) → MINT (tools) → papier
           (zo werkt het) → mint (privacy).
           De verticale ruimte moest daarvoor omhoog (pt-6 → pt-28): een golf
           is ~120px hoog en liep anders dwars door de kop. */}
        <section
          id="tools"
          className="relative isolate overflow-hidden pb-28 pt-28 scroll-mt-20 lg:pb-32 lg:pt-32"
          style={{ background: MINT_LICHT }}
        >
          <Golf kleur="var(--w-papier, #fcfbf7)" flip vorm="hapMidden" hoogte="h-[70px] sm:h-[118px]" />

          {/* De grote vorm van deze sectie. Hij hangt met zijn bovenkant boven
             de golf uit; de golf ligt op z-[5] en dit vlak op -z-10, dus het
             papier van de golf snijdt hem precies op de kleurrand af. Je ziet
             daardoor geen vorm die tegen een rand aan botst maar een vorm die
             onder het veld vandaan komt — dezelfde ingreep als bij "Veilig
             omgaan met AI", de polaroids en de cijfers.
             Rechts, want de kop staat links: zo draagt hij de lege hoek naast
             het handgeschreven duwtje in plaats van achter tekst te liggen. */}
          <KaartVlak
            kleur={VLAK_MINT}
            vorm="kiezel"
            breedte={900}
            hoogte={520}
            style={{ right: "-12%", top: -120, transform: "rotate(4deg)" }}
            className="-z-10 hidden lg:block"
            tel={4}
          />

          {/* Hier stonden drie verf-klodders achter de kaarten. Die kaarten
             zijn zelf al het kleurrijkste van de hele pagina (donker, groen,
             amber), dus een drukke achtergrond ging ermee concurreren in
             plaats van hem te dragen. Er ligt nu één uitvergrote kaartvorm
             links — dezelfde blob-vorm als de kaarten zelf, alleen enorm en
             tint-op-tint — en verder niets. */}
          {/* Papier: uit sinds de opruiming, zie RUIS_OP_PAPIER in Wereld.tsx. */}
          {RUIS_OP_PAPIER && (
            <KaartVlak
              kleur={VLAK_PAPIER}
              vorm="kiezel"
              breedte={940}
              hoogte={430}
              style={{ left: "-8%", top: 90, transform: "rotate(-4deg)" }}
              className="-z-10 hidden lg:block"
              tel={3}
            />
          )}
          {/* De rechter is bewust lang en vlak. Hij was 620 breed, 330 hoog en
             7° gedraaid, en dan daalt zijn linkerflank net zo steil als de
             rechterflank van het vlak hiernaast — twee steile randen naar
             elkaar toe met een strook papier ertussen, en dat leest als een
             botsing in plaats van als één vorm.
             Nu loopt hij ~300px verder door naar links, is hij lager en staat
             hij bijna recht (3°). Daardoor overlapt hij het vlak links en komt
             zijn flank er in een flauwe hoek bovenop in plaats van ertegenaan. */}
          {/* Papier: uit sinds de opruiming. */}
          {RUIS_OP_PAPIER && (
            <KaartVlak
              kleur={VLAK_PAPIER}
              vorm="wig"
              breedte={920}
              hoogte={300}
              style={{ right: "-11%", top: 60, transform: "rotate(3deg)" }}
              className="-z-10 hidden lg:block"
              tel={6}
            />
          )}
          {/* Papier: uit sinds de opruiming. */}
          {RUIS_OP_PAPIER && (
            <Confetti punten={[{ x: "6%", y: "84%", r: 4 }, { x: "93%", y: "22%", r: 5, amber: true }]} />
          )}
          <ToolRail />
          {/* Terug naar papier voor "Zo werkt het". Een andere golfvorm dan
             bovenaan: dezelfde vorm boven en onder maakt van een veld een
             gestempelde band. */}
          <Golf kleur="var(--w-papier, #fcfbf7)" vorm="kam" hoogte="h-[70px] sm:h-[110px]" />
        </section>

        {/* ── 3b. Zo werkt het: de drie stappen. Staat hier omdat je net hebt
           gezien wát je krijgt; de vraag die dan komt is hoe dat gaat. En de
           laatste stap ("jij leest na en past aan") loopt rechtstreeks door
           in de privacysectie hieronder. ── */}
        <WereldHoeWerktHet />

        {/* ── 4. Privacy: de belofte wordt hier niet verteld maar bewezen.
           Een live maskeer-proef waarin de bezoeker de namen van zijn eigen
           klas typt en ze ziet verdwijnen — het uitblijven van een laadmoment
           is zelf het bewijs dat het op zijn apparaat gebeurt. ── */}
        <WereldPrivacy />

        {/* ── 5. HIER STOND "De regie blijft bij jou": drie ronde kaartjes met
           "Jij beslist", "Altijd bij te sturen" en "De cijfers kloppen altijd".
           Weggehaald, om drie redenen:

           1. Ze hingen los. Elke andere sectie opent met een titel; deze drie
              kwamen uit het niets. Dat werkte toen er iets anders boven stond,
              maar de privacysectie eindigt nu zélf met drie blokjes. Drie
              blokjes gevolgd door drie cirkels leest als een herhaling zonder
              verband.
           2. Inhoudelijke overlap. "Wij maken AI veilig" (hierboven) en "jij
              houdt de AI in de hand" (hier) zijn dezelfde redenering, in twee
              losse secties gezet.
           3. Twee van de drie waren zwak: "jij beslist" en "je kunt het
              aanpassen" zegt elke AI-tool. De derde, dat de tool zelf rekent
              en de AI nooit getallen verzint, was juist de sterkste claim van
              de pagina. Die is verhuisd naar het slot van de privacysectie,
              waar hij de redenering afmaakt: je gegevens zijn veilig, én wat
              eruit komt klopt. De FAQ verderop behandelt hem ook nog. ── */}

        {/* ── 6. De maker ── */}
        <WereldMaker fotoBestand={fotoBestand} />

        {/* ── 7. Ervaringen: polaroids aan de levende draad. ── */}
        <WereldPolaroids />

        {/* ── 7b. Samen teruggewonnen: het klapbord met de echte cijfers.
           Staat hier omdat de polaroids het zachte bewijs zijn (wat mensen
           zéggen) en dit het harde (wat er gemeten is). Samen vormen ze het
           bewijsblok, en dat hoort vlak vóór de prijzen te staan: dat is het
           moment waarop iemand beslist.

           Zolang er nog te weinig data is laat de sectie zichzelf helemaal
           weg, inclusief de kop. Er staat dus nooit een nul of een pijnlijk
           laag getal op de voorpagina. ── */}
        <WereldCijfers cijfers={cijfers} bijhouden={bijhouden} prijzenVolgt={toonPrijzen} />

        {/* ── 8. Prijzen: het eigen mintveld. Vóór deze verbouwing lagen
           maker, ervaringen, prijzen én vragen allemaal op hetzelfde papier;
           dit veld brengt de afwisseling terug in de staart van de pagina. ── */}
        {/* Wie al betaalt hoeft geen prijzen meer te zien; proef- en verlopen
           accounts wél, want die kunnen nog een plan kiezen. */}
        {toonPrijzen && <WereldPrijzen zonderTopgolf={toontCijfers(cijfers)} zonderOndergolf />}

        {/* ── 9. Veelgestelde vragen: het lichtste blok van de pagina, geen
           kaders maar haarlijnen.
           Het mintveld van de prijzen loopt hier nog even door — tot voorbij
           de eerste vraag — en pas dáár golft het terug naar papier. Staan de
           prijzen er niet, dan is dat veld er ook niet en eindigt het al
           hierboven, dus dan begint deze sectie gewoon op papier. ── */}
        <WereldVragen items={FAQ} mintBoven={toonPrijzen} />

        {/* ── 10. Slot: het donkergroene veld, één keer op de pagina. ── */}
        <WereldSlot />
      </main>
    </div>
  );
}

/* ── De markeersectie ───────────────────────────────────────────────────
   Twee identieke lagen boven elkaar: onderop de crème versie, daarbovenop
   dezelfde inhoud in het groen. De groene laag wordt met clip-path van links
   naar rechts opengetrokken op het ritme van je scroll, met een schuine rand
   zoals een echte markeerstift. Zo kleurt de tekst perfect om in plaats van
   te verkleuren.
   De haal gaat één kant op: eenmaal aangestreept blijft het staan, ook als je
   terugscrolt. Zo blijft de pagina rustig in plaats van heen en weer te
   flikkeren bij elke scrollbeweging.
   De bovenste laag is aria-hidden en vangt geen muis: de knoppen eronder
   blijven gewoon de echte knoppen. ─────────────────────────────────────── */
/* ── Het scharnier naar de tools ────────────────────────────────────────
   Eerst de erkenning in gedempt inkt, dan de belofte in groen. Bewust
   zonder markeerstift: die staat al op de sectie hierboven, en twee keer
   dezelfde truc binnen één scherm is geen taal meer maar een tic. ─────── */
const BELOFTE = ['Maar het kan sneller, slimmer', 'en met minder gedoe.'];

function Scharnier() {
  return (
    <p className="mt-14 flex max-w-3xl flex-col items-start font-display text-[clamp(1.375rem,3.1vw,2.25rem)] font-black leading-[1.25] tracking-tight">
      <span data-reveal className="text-ink/55">
        Het hoort bij het werk.
      </span>
      <span data-reveal className="mt-3 text-brand-dark" style={{ transitionDelay: '120ms' }}>
        {BELOFTE.join(' ')}
      </span>
    </p>
  );
}

function Markeersectie() {
  const sectie = useRef<HTMLElement>(null);
  const haal = useRef<HTMLDivElement>(null);
  const waas = useRef<HTMLDivElement>(null);
  const reduced = useSyncExternalStore<boolean | null>(
    abonneerReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => null,
  );

  useEffect(() => {
    if (reduced === null) return;
    const sec = sectie.current;
    const laag = haal.current;
    if (!sec || !laag) return;

    const schaduw = waas.current;

    if (reduced) {
      laag.style.clipPath = "inset(0 0 0 0)";
      if (schaduw) schaduw.style.clipPath = "inset(0 0 0 0)";
      return;
    }

    let bezig = false;
    let ver = 0; // hoe ver de stift is geweest; loopt nooit terug
    const teken = () => {
      if (bezig) return;
      bezig = true;
      requestAnimationFrame(() => {
        bezig = false;
        const vh = window.innerHeight;
        const r = sec.getBoundingClientRect();
        // De haal loopt van "sectie komt onderin binnen" tot "sectie staat
        // goed in beeld": zo is hij klaar op het moment dat je uitgelezen bent.
        const p = Math.min(1, Math.max(0, (vh * 0.82 - r.top) / (vh * 0.62)));
        if (p <= ver) {
          // Al verder geweest: laten staan en verder niets rekenen.
          if (ver >= 1) {
            window.removeEventListener("scroll", teken);
            window.removeEventListener("resize", teken);
          }
          return;
        }
        ver = p;
        // De haal stopt net voorbij de tekst in plaats van van het scherm af
        // te lopen, zodat je de kriskras-stiftrand blijft zien. Is er geen
        // ruimte naast de tekst (smal scherm), dan loopt hij gewoon door.
        const tekstRechts = r.width / 2 + Math.min(1024, r.width) / 2 - 24;
        const eind = ((tekstRechts + 28) / r.width) * 100 + 3.6;
        const b = p * (eind <= 100 ? eind : 105);
        // Geen liniaal maar een stiftrand. Ook boven en onder loopt de rand
        // een paar pixels op en neer, zoals een stift over papier; de punten
        // liggen op fracties van de haal, dus ze blijven altijd binnen wat er
        // al aangestreept is.
        // Boven en onder kaarsrecht; alleen de kop van de stift is grillig.
        const maakVorm = (bb: number) =>
          `polygon(0 0, ${bb}% 0, ${bb - 1.3}% 24%, ${bb - 3.1}% 52%,` +
          ` ${bb - 1.8}% 76%, ${bb - 3.6}% 100%, 0 100%)`;

        laag.style.clipPath = maakVorm(b);
        // De waas is dezelfde vorm in een doos die boven en onder tien pixels
        // ruimer is: uitgelopen inkt langs de randen.
        if (schaduw) schaduw.style.clipPath = maakVorm(b + 0.55);
      });
    };

    teken();
    window.addEventListener("scroll", teken, { passive: true });
    window.addEventListener("resize", teken);
    return () => {
      window.removeEventListener("scroll", teken);
      window.removeEventListener("resize", teken);
    };
  }, [reduced]);

  return (
    <section ref={sectie} className="relative isolate">
      {/* De gloed hoort binnen de sectie te blijven; de stiftinkt niet. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-28 top-0 h-80 w-80 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
      </div>

      <MarkeerInhoud />

      {/* Uitgelopen inkt: dezelfde vorm, iets ruimer en half doorschijnend,
         zodat de rand niet als een geplakt vlak aanvoelt maar als iets dat
         in het papier trekt. */}
      <div
        ref={waas}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -inset-y-[10px] -z-10 bg-brand-dark/20 blur-[3px]"
        style={{ clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" }}
      />

      <div
        ref={haal}
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-brand-dark"
        style={{ clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" }}
      >
        <MarkeerInhoud donker />
      </div>
    </section>
  );
}

/* De inhoud staat twee keer op de pagina, dus hij hoort op één plek te
   staan. `donker` is de versie die op de groene haal ligt. */
function MarkeerInhoud({ donker = false }: { donker?: boolean }) {
  return (
    <div className="relative mx-auto grid w-full max-w-5xl gap-10 px-6 pb-16 pt-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pb-20 lg:pt-16">
      <div>
        <h2
          data-reveal={donker ? undefined : ""}
          className={`font-display text-[clamp(1.875rem,3.1vw,2.375rem)] font-black leading-[1.08] tracking-tight [text-wrap:balance] ${
            donker ? "text-white" : ""
          }`}
        >
          De slimme werkplek voor leerkrachten in het basisonderwijs
        </h2>
        <div data-reveal={donker ? undefined : ""} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            tabIndex={donker ? -1 : undefined}
            className={`knop-druk w-full whitespace-nowrap rounded-2xl px-7 py-4 text-center text-lg font-bold shadow-lg transition-[transform,background-color] duration-200 sm:w-auto ${
              donker
                ? "bg-white text-brand-dark shadow-black/10"
                : "bg-brand text-white shadow-brand/25 hover:bg-brand-dark"
            }`}
          >
            Probeer Avinka gratis
          </Link>
          <a
            href="#tools"
            tabIndex={donker ? -1 : undefined}
            className={`knop-druk w-full whitespace-nowrap rounded-2xl border-2 px-7 py-4 text-center text-lg font-bold transition-[transform,border-color] duration-200 sm:w-auto ${
              donker
                ? "border-white/45 bg-transparent text-white"
                : "border-ink/10 bg-white text-ink hover:border-ink/20"
            }`}
          >
            Bekijk de tools
          </a>
        </div>
      </div>

      <div className="max-w-xl lg:pt-2">
        <p
          data-reveal={donker ? undefined : ""}
          className={`text-lg leading-8 ${donker ? "text-white" : "text-ink/75"}`}
        >
          Avinka brengt de hulpmiddelen voor je schoolwerk samen in één
          omgeving. Je geeft aan wat je nodig hebt en Avinka helpt je met de
          uitwerking, zodat terugkerende taken minder tijd kosten en je werk
          overzichtelijk blijft.
        </p>
      </div>
    </div>
  );
}

/* ── De tool-galerij: een sleepbare rij kunstkaarten, één per tool.
   Zoals de klantkaarten van Stripe, maar in de Avinka-beeldtaal: elk
   kaartbeeld is een eigen kleine wereld met échte inhoud (een rapportzin,
   een berichtje van thuis, een klasopstelling), geen interface-namaak.
   De bezoeker heeft de regie: zelf slepen, vegen of de pijltjes. Niets
   beweegt uit zichzelf; een bekeken kaart zet wel zijn eigen vinkje. ──── */

/* ── Het bewijs bij de privacybelofte ───────────────────────────────────
   Twee kaarten die een bewering omzetten in iets dat je kunt nalopen. Ze
   zijn van tekst gemaakt en niet van tekeningetjes: daardoor blijven ze
   op een telefoon net zo leesbaar als op een breed scherm, alleen dan op
   volle breedte onder hun eigen alinea.
   De beweging hangt aan de reveal die de pagina al gebruikt: krijgt de
   kaart `is-in`, dan lopen de regels één voor één af. Zonder beweging of
   zonder JS staat de eindstand er meteen. ──────────────────────────────── */

/* ── De papierstapel achter de kaarten ─────────────────────────────────
   Twee vellen die schuin onder het kaartje uit steken, zoals een stapeltje
   op je bureau. Ze geven de kaart iets om op te liggen zonder er kleur bij
   te halen, wat op deze plek in de pagina belangrijker is dan opvallen.
   De vellen liggen naar de buitenkant, weg van de tekst ernaast; bij de
   rechterkaart waaieren ze de andere kant op.
   De eindstand staat in `--eind`, zodat de vellen zonder beweging gewoon
   goed liggen en er mét beweging onder de kaart vandaan schuiven. ────── */
const VELLEN = [
  { vulling: "bg-sand", rand: "ring-ink/[0.07]", graden: 5, x: 11, y: 7, wacht: 0.16 },
  { vulling: "bg-white", rand: "ring-ink/[0.05]", graden: 2.4, x: 5, y: 3, wacht: 0.08 },
];

function PapierStapel({ spiegel = false }: { spiegel?: boolean }) {
  const kant = spiegel ? 1 : -1;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {VELLEN.map((vel) => (
        <div
          key={vel.graden}
          style={
            {
              "--eind": `translate(${kant * vel.x}px, ${vel.y}px) rotate(${kant * vel.graden}deg)`,
              "--vel-wacht": `${vel.wacht}s`,
            } as CSSProperties
          }
          className={`stapelvel absolute inset-0 rounded-2xl ring-1 shadow-[-3px_8px_20px_-16px_rgba(34,28,58,0.5)] ${vel.vulling} ${vel.rand}`}
        />
      ))}
    </div>
  );
}

/* De scheidslijn loopt langs de leerling: je eigen lesmateriaal bewaren we
   zodat je het terugvindt, alles waar een kind in voorkomt niet. */
const BIJ_ONS = ["lesontwerpen", "werkbladen", "draaiboeken"];
const NIET_BIJ_ONS = [
  "leerlinggegevens",
  "toetsresultaten",
  "gespreksverslagen",
  "berichten",
];

function BewaarKaart() {
  return (
    <div data-reveal className="kaartblok relative w-full max-w-xs">
      <PapierStapel />
      <div className="relative rounded-2xl bg-white p-6 shadow-[-10px_26px_60px_-28px_rgba(34,28,58,0.45)] ring-1 ring-black/5">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-ink/45">
        Wat we wel bewaren
      </p>
      <ul className="mt-4 space-y-2.5">
        {BIJ_ONS.map((regel) => (
          <li key={regel} className="flex items-center gap-2.5 font-bold text-ink">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
              <Vink className="h-3 w-3" dik={4} />
            </span>
            {regel}
          </li>
        ))}
      </ul>

      <div className="my-5 border-t border-dashed border-ink/20" aria-hidden />

      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-ink/45">
        Wat we niet bewaren
      </p>
      <ul className="mt-4 space-y-2.5">
        {NIET_BIJ_ONS.map((regel, i) => (
          <li
            key={regel}
            style={{ "--i": i } as CSSProperties}
            className="wis-regel flex items-center gap-2.5"
          >
            <span className="h-5 w-5 shrink-0" aria-hidden />
            <span className="wis-woord">{regel}</span>
          </li>
        ))}
      </ul>
      </div>
    </div>
  );
}

/* De klassenlijst: het meest persoonlijke bestand dat een leerkracht heeft.
   Links wat op jouw apparaat blijft staan, rechts wat de AI ervan te zien
   krijgt. De rechterkolom schrijft zichzelf regel voor regel vol, zodat je
   niet één naam ziet veranderen maar een hele klas tegelijk. */
const KLAS = ["Sofie", "Daan", "Iris", "Mees", "Noor"];
const KLAS_REST = 19;

function KlassenlijstKaart() {
  return (
    <div data-reveal className="kaartblok relative w-full max-w-xs lg:ml-auto">
      <PapierStapel spiegel />
      <div className="relative rounded-2xl bg-white p-6 shadow-[-10px_26px_60px_-28px_rgba(34,28,58,0.45)] ring-1 ring-black/5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-lg font-black tracking-tight">Groep 5</p>
        <p className="text-xs text-ink/50">{KLAS.length + KLAS_REST} leerlingen</p>
      </div>

      {/* Op een smal scherm valt het linkerkopje over twee regels; met een
         gedeelde onderlijn blijven de twee kopjes toch netjes op één hoogte. */}
      <div className="mt-5 flex items-end gap-3 text-[0.6rem] font-bold uppercase tracking-[0.12em]">
        <span className="flex-1 text-ink/45">Op jouw apparaat</span>
        <span className="w-[6.5rem] shrink-0 pl-3 text-brand-dark">De AI ziet</span>
      </div>

      <ul className="mt-2">
        {KLAS.map((naam, i) => (
          <li
            key={naam}
            style={{ "--i": i } as CSSProperties}
            className="flex items-stretch gap-3 border-t border-ink/[0.07]"
          >
            <span className="flex-1 py-2 font-semibold text-ink">{naam}</span>
            <span className="w-[6.5rem] shrink-0 border-l border-ink/10 bg-brand-soft/50 py-2 pl-3 font-semibold text-brand-dark">
              <span className="klasmasker">
                leerling {String.fromCharCode(65 + i)}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <div className="flex gap-3 border-t border-ink/[0.07]">
        <span className="flex-1 py-2 text-xs text-ink/50">
          en {KLAS_REST} anderen
        </span>
        <span className="w-[6.5rem] shrink-0 border-l border-ink/10 bg-brand-soft/50" aria-hidden />
      </div>
      </div>
    </div>
  );
}

/* De kop boven de rij. De ondertitel wijst meteen op het slepen: zonder die
   hint blijft de helft van de kaarten onopgemerkt buiten beeld staan. */
function RailKop() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6">
      {/* Hier stond een gewone ondertekst. Die is vervangen door hetzelfde
         handgeschreven duwtje als bij de ervaringen-sectie, maar gespiegeld:
         daar staat de tekst links met het pijltje rechts, hier andersom. Twee
         keer exact dezelfde zet zou een tic worden; gespiegeld is het een
         motief dat je herkent. */}
      <div data-reveal className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <h2 className="max-w-2xl font-display text-4xl font-black tracking-tight [text-wrap:balance]">
          Alle tools, één werkplek
        </h2>
        <p
          className="flex shrink-0 items-center gap-2 text-xl lg:pb-1"
          style={{ fontFamily: "var(--font-hand)", color: KOP }}
        >
          {/* Hetzelfde pijltje als bij de polaroids, horizontaal gespiegeld
             (x wordt 40 − x), zodat het naar de kaarten linksonder wijst in
             plaats van naar rechts. */}
          <svg
            viewBox="0 0 40 28"
            className="h-6 w-9 shrink-0"
            fill="none"
            stroke={KOP}
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M38 4 C 26 6, 14 10, 8 22" />
            <path d="M14 20 L 7.5 23 L 6 16" />
          </svg>
          sleep de rij opzij om ze allemaal te zien
        </p>
      </div>
    </div>
  );
}

/* ── Het open paneel ────────────────────────────────────────────────────
   Klik je een kaart aan, dan vouwt hij open vanaf zijn eigen plek in de rij:
   het paneel wordt op zijn eindpositie gerenderd en daarna teruggerekend
   naar de maten van de kaart (FLIP), waarna één beweging het naar zijn plek
   brengt. De tekening blijft dus in beeld en groeit mee; het leest als
   dezelfde kaart die dichterbij komt. De tekst komt een tel later, zodat je
   eerst de beweging ziet en dan pas leest.
   Sluiten gaat met Escape, met de knop, of door naast het paneel te klikken;
   dan speelt dezelfde beweging terug naar de kaart. Bij verminderde beweging
   verschijnt en verdwijnt het paneel gewoon. ─────────────────────────── */
/* Waar het paneel moet staan zodat de tékening erin precies op de kaart in de
   rij valt. Eén schaalfactor voor beide richtingen, anders rekt de tekening
   uit. Rekent met transform-origin center: een punt P belandt na schalen op
   midden + schaal × (P − midden). */
function beeldStand(vanaf: DOMRect, naar: DOMRect, beeld: DOMRect) {
  const schaal = vanaf.width / beeld.width;
  const paneelX = naar.left + naar.width / 2;
  const paneelY = naar.top + naar.height / 2;
  const dx =
    vanaf.left + vanaf.width / 2 - paneelX - schaal * (beeld.left + beeld.width / 2 - paneelX);
  const dy =
    vanaf.top + vanaf.height / 2 - paneelY - schaal * (beeld.top + beeld.height / 2 - paneelY);
  return `translate(${dx}px, ${dy}px) scale(${schaal})`;
}

function ToolPaneel({
  kaart,
  vanaf,
  opSluiten,
  opStartSluiten,
  reduced,
}: {
  kaart: (typeof KAARTEN)[number];
  vanaf: DOMRect;
  opSluiten: () => void;
  opStartSluiten: () => void;
  reduced: boolean;
}) {
  const doek = useRef<HTMLDivElement>(null);
  const paneel = useRef<HTMLDivElement>(null);
  const sluiter = useRef<HTMLButtonElement>(null);
  const bezigMetSluiten = useRef(false);

  // Openen: van de kaartmaten naar de eigen maten, in één beweging.
  useEffect(() => {
    const p = paneel.current;
    const d = doek.current;
    if (!p || !d) return;
    sluiter.current?.focus({ preventScroll: true });

    const duur = reduced ? 0 : 620;
    d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced ? 0 : 260, fill: "both" });

    const naar = p.getBoundingClientRect();
    const schaalX = vanaf.width / naar.width;
    const schaalY = vanaf.height / naar.height;
    p.animate(
      [
        {
          transform: `translate(${vanaf.left - naar.left}px, ${vanaf.top - naar.top}px) scale(${schaalX}, ${schaalY})`,
          opacity: reduced ? 0 : 1,
        },
        { transform: "translate(0, 0) scale(1, 1)", opacity: 1 },
      ],
      { duration: duur, easing: "cubic-bezier(0.32, 0.72, 0, 1)", fill: "both" },
    );
    return () => {
      p.getAnimations().forEach((a) => a.cancel());
    };
  }, [vanaf, reduced]);

  /* Sluiten in twee bewegingen, zoals je een boekje dichtdoet:
     1. het paneel klapt dicht tot alleen de tekening (de tekstkolom wordt
        weggeknipt met clip-path, de tekst vervaagt tegelijk);
     2. die tekening valt op zijn eigen kaart in de rij: hij schuift ernaartoe
        en wordt onderweg tot exact het kaartformaat bijgesneden, zodat hij er
        precies op landt.
     Op een smal scherm staat de tekening bovenop in plaats van ernaast; daar
     krimpt het paneel gewoon als geheel terug. */
  const sluit = () => {
    const p = paneel.current;
    const d = doek.current;
    if (!p || !d || bezigMetSluiten.current) return opSluiten();
    bezigMetSluiten.current = true;

    // De openanimatie stoppen, anders blijft die (fill: both) meepraten over
    // transform en clip-path.
    p.getAnimations().forEach((a) => a.cancel());

    const naar = p.getBoundingClientRect();
    const beeldEl = p.querySelector("[data-paneelbeeld]");
    const beeld = beeldEl?.getBoundingClientRect();
    const naastElkaar = !!beeld && beeld.width < naar.width * 0.9;
    const duur = reduced ? 140 : 620;

    d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: duur, fill: "both" });
    p.querySelector(".paneel-tekst")?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: reduced ? 100 : 200,
      easing: "ease-out",
      fill: "both",
    });

    if (!naastElkaar || !beeld) {
      // Smal scherm: het paneel krimpt in één beweging terug naar de kaart.
      const terug = p.animate(
        [
          { transform: "translate(0, 0) scale(1, 1)" },
          {
            transform: `translate(${vanaf.left - naar.left}px, ${vanaf.top - naar.top}px) scale(${vanaf.width / naar.width}, ${vanaf.height / naar.height})`,
          },
        ],
        { duration: duur, easing: "cubic-bezier(0.32, 0.72, 0, 1)", fill: "both" },
      );
      p.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: duur * 0.42,
        delay: duur * 0.58,
        easing: "ease-in",
        fill: "both",
      });
      window.setTimeout(opStartSluiten, 110);
      terug.onfinish = opSluiten;
      return;
    }

    // 1 · dichtklappen tot de tekening, 2 · vallen op de kaart.
    const klap = 0.34; // deel van de tijd dat het dichtklappen kost
    const rechts = naar.width - beeld.width;
    const schaal = vanaf.width / beeld.width;
    // Zoveel van de tekening past er in de kaart; de rest snijden we onderweg
    // symmetrisch weg, zodat hij precies op het kaartformaat uitkomt.
    const knip = Math.max(0, (beeld.height - vanaf.height / schaal) / 2);
    const hoek = 24; // rounded-3xl, zodat de hoeken rond blijven tijdens het knippen

    /* Twee losse animaties in plaats van één met tussenpunten: keyframe-
       posities worden in de geëasede tijd gerekend, waardoor het dichtklappen
       anders al voorbij is voor je het gezien hebt. Beide op "forwards", zodat
       de tweede pas meetelt zodra hij begint. */
    const klapDuur = duur * klap;
    p.animate(
      [
        { clipPath: `inset(0px 0px 0px 0px round ${hoek}px)` },
        { clipPath: `inset(0px ${rechts}px 0px 0px round ${hoek}px)` },
      ],
      { duration: klapDuur, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" },
    );
    p.animate(
      [
        { clipPath: `inset(0px ${rechts}px 0px 0px round ${hoek}px)` },
        { clipPath: `inset(${knip}px ${rechts}px ${knip}px 0px round ${hoek}px)` },
      ],
      {
        duration: duur - klapDuur,
        delay: klapDuur,
        easing: "cubic-bezier(0.34, 0.9, 0.24, 1)",
        fill: "forwards",
      },
    );

    const terug = p.animate(
      [{ transform: "translate(0, 0) scale(1)" }, { transform: beeldStand(vanaf, naar, beeld) }],
      {
        duration: duur - klapDuur,
        delay: klapDuur,
        easing: "cubic-bezier(0.34, 0.9, 0.24, 1)",
        fill: "both",
      },
    );
    /* De laatste tel: de tekening lost op in de kaart eronder. Zonder dat
       verdwijnt hij ineens, en dat zie je. De kaart komt daarom ook net even
       eerder terug dan de tekening weg is. */
    p.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 150,
      delay: duur - 150,
      easing: "ease-in",
      fill: "forwards",
    });
    window.setTimeout(opStartSluiten, duur - 190);
    terug.onfinish = opSluiten;
  };

  useEffect(() => {
    const opToets = (e: KeyboardEvent) => {
      if (e.key === "Escape") sluit();
    };
    document.addEventListener("keydown", opToets);
    // Achtergrond niet mee laten scrollen zolang het paneel open staat.
    const vorige = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", opToets);
      document.body.style.overflow = vorige;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* In een portal, want de body van de pagina zit in een eigen stapellaag:
     zonder portal schuift het paneel onder de vaste bovenbalk. */
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div
        ref={doek}
        onClick={sluit}
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        aria-hidden
      />
      <div
        ref={paneel}
        role="dialog"
        aria-modal="true"
        aria-label={kaart.naam}
        className="paneel relative z-10 max-h-full w-full max-w-3xl overflow-y-auto rounded-3xl bg-cream shadow-2xl ring-1 ring-black/10"
      >
        <div className="grid sm:grid-cols-[0.85fr_1.15fr]">
          {/* De tekening van de kaart, nu groot. Op een smal scherm platter,
             anders duwt hij de tekst helemaal onder de vouw. */}
          <div
            data-paneelbeeld
            className="relative aspect-[16/9] overflow-hidden sm:aspect-auto sm:min-h-[22rem]"
          >
            <KaartBeeld soort={kaart.id} />
            <div className="kaart-grain pointer-events-none absolute inset-0" aria-hidden />
          </div>

          <div className="paneel-tekst p-6 sm:p-9">
            <h3 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
              {kaart.naam}
            </h3>
            {/* De tijdwinst per keer: sommige tools gebruik je wekelijks,
               andere een paar keer per jaar, dus "per week" zou niet kloppen. */}
            <p className="mt-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3.5 py-1.5 text-sm font-bold text-brand-dark">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Bespaart {kaart.tijd}
              </span>
            </p>
            <p className="mt-4 text-lg font-semibold leading-8 text-brand-dark">{kaart.zin}</p>
            <p className="mt-5 leading-8 text-ink/70">{kaart.uitleg}</p>
            <Link
              href="/sign-up"
              className="knop-druk mt-8 inline-block rounded-2xl bg-brand px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-brand/25 transition-[transform,background-color] duration-200 hover:bg-brand-dark"
            >
              Probeer Avinka gratis
            </Link>
          </div>
        </div>

        <button
          ref={sluiter}
          type="button"
          onClick={sluit}
          aria-label="Sluiten"
          className="knop-druk absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-md ring-1 ring-black/10 transition-[transform,background-color] duration-200 hover:bg-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/60"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>,
    document.body,
  );
}

/* De kaarten zelf; `gezien` bepaalt welke vinkjes aan staan, `opOpenen`
   krijgt de aangeklikte kaart mét zijn positie op het scherm, zodat het
   paneel vanaf díe plek open kan vouwen. */
function RailKaarten({
  gezien,
  opOpenen,
  opKnopKlik,
  openId,
}: {
  gezien: boolean[];
  opOpenen: (index: number, vanaf: DOMRect, e: ReactMouseEvent) => void;
  opKnopKlik: (e: ReactMouseEvent<HTMLAnchorElement>) => void;
  openId: string | null;
}) {
  return (
    <>
      {KAARTEN.map((k, i) => (
        <figure
          key={k.id}
          data-kaart
          className="rail-kaart w-[18.5rem] shrink-0 snap-start select-none sm:w-[21rem]"
          style={{ "--i": i } as CSSProperties}
        >
          <button
            type="button"
            onClick={(e) => opOpenen(i, e.currentTarget.getBoundingClientRect(), e)}
            aria-label={`${k.naam}: ${k.zin} Meer lezen.`}
            className={`kaart-knop group relative block aspect-[4/5] w-full overflow-hidden rounded-3xl text-left shadow-lg ring-1 ring-black/10 transition-[transform,box-shadow,opacity] duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink/60 ${
              openId === k.id ? "opacity-0" : ""
            }`}
          >
            <KaartBeeld soort={k.id} />
            <div className="kaart-grain pointer-events-none absolute inset-0" aria-hidden />
            {/* De tijdwinst als klein chipje in een bovenhoek. Stond eerst
               alléén in het paneel dat opengaat bij een klik, en dat is juist
               het bewijs onder de belofte bovenaan de pagina ("win elke week 2
               uur terug") — dus het hoort in beeld voor wie langs scrollt.
               Daarna stond het als tweede regel onder de naam, maar dat werd
               te zwaar; klein en in een hoek is genoeg.

               Alle acht in DEZELFDE hoek (rechtsboven): dat was de hoek die
               het minst bezet was. De tekeningen die er iets hadden staan zijn
               ervoor opgeschoven — zie de opmerkingen bij toetsanalyse,
               oudercontact en draaiboek in KaartBeeld.

               Alleen de duur, zonder het woord "bespaart": het klokje zegt al
               dat het over tijd gaat, en de volledige zin ("± 10 minuten per
               rapport") staat in het paneel dat bij een klik opengaat. */}
            <span
              className={`absolute right-3.5 top-3.5 z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-bold shadow-sm ${
                k.licht ? "bg-ink/90 text-cream" : "bg-white/95 text-ink"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {k.kort}
            </span>
            <p
              className={`absolute bottom-4 left-4 flex items-center gap-2 font-display text-lg font-black tracking-tight ${
                k.licht
                  ? "rounded-full bg-ink py-1.5 pl-1.5 pr-4 text-cream shadow-md"
                  : "text-white"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                  gezien[i] ? "bg-white text-brand-dark" : "bg-white/15 ring-1 ring-white/50"
                }`}
                aria-hidden
              >
                {gezien[i] && <Vink className="vinkpop h-3.5 w-3.5" dik={4} />}
              </span>
              {k.naam}
            </p>
            {/* Verschijnt bij hover: het duwtje dat zegt dat je kunt klikken.
               Rechts, met een zachte verdonkering eronder zodat het op elke
               tekening leesbaar blijft. */}
            <span
              className="kaart-hint pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-end bg-gradient-to-t from-ink/55 to-transparent p-4 pt-14"
              aria-hidden
            >
              <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-md">
                Bekijk
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </span>
            </span>
          </button>
        </figure>
      ))}

      {/* De rij groeit door — én eindigt met de uitnodiging. Wie tot hier
         sleept heeft alle tools gezien; dit is het warmste punt van de
         pagina, dus staat de knop hier en niet in een losse balk eronder.
         De kaart houdt zijn eigen belofte ("dit is nog maar het begin") en
         die loopt door in het aanbod: kom maar kijken. */}
      <figure
        className="rail-kaart w-[18.5rem] shrink-0 snap-start select-none sm:w-[21rem]"
        style={{ "--i": KAARTEN.length } as CSSProperties}
      >
        <div className="relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl bg-ink shadow-lg ring-1 ring-black/10">
          <div className="absolute -right-16 -top-12 h-56 w-56 rounded-full bg-brand/30 blur-3xl" aria-hidden />
          <div className="absolute -left-20 top-14 h-52 w-52 rounded-full bg-accent/25 blur-3xl" aria-hidden />
          <div className="absolute right-4 top-5 flex gap-2" aria-hidden>
            <div className="h-20 w-14 rotate-6 rounded-xl bg-white/10 ring-1 ring-white/15" />
            <div className="h-24 w-16 -rotate-3 rounded-xl bg-white/[0.07] ring-1 ring-white/10" />
          </div>
          <div className="relative p-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-cream/80 ring-1 ring-white/15">
              nieuwe tools onderweg ✨
            </span>
            <p className="mt-3 font-display text-3xl font-black leading-[1.03] tracking-tight text-cream">
              En dit is nog maar het begin
            </p>
            <BlobKnop
              href="/sign-up"
              variant="wit"
              maat="klein"
              className="mt-6 w-full"
              onClick={opKnopKlik}
            >
              Probeer Avinka gratis
            </BlobKnop>
            {/* Kort genoeg om op de smalste kaart op één regel te blijven. */}
            <p className="mt-3 text-center text-xs leading-5 text-cream/55">
              {PROEF_DAGEN} dagen gratis, geen betaalgegevens.
            </p>
          </div>
        </div>
      </figure>
    </>
  );
}

export function ToolRail() {
  const rail = useRef<HTMLDivElement>(null);
  const greep = useRef({ actief: false, startX: 0, startScroll: 0, vangt: 0 });
  // Waar de muis of vinger neerkwam; zo weten we bij de klik of er gesleept is.
  const neer = useRef({ x: 0, y: 0 });
  const [kanTerug, setKanTerug] = useState(false);
  const [kanVerder, setKanVerder] = useState(true);
  const [gezien, setGezien] = useState<boolean[]>(() => KAARTEN.map(() => false));
  const [wakker, setWakker] = useState(false);
  const [open, setOpen] = useState<{ index: number; vanaf: DOMRect } | null>(null);
  // De kaart onder het paneel is verborgen zolang het paneel er "is"; zodra
  // het sluiten begint komt hij terug, zodat het paneel erin kan overvloeien.
  const [kaartVerborgen, setKaartVerborgen] = useState(false);
  const reduced = useSyncExternalStore<boolean | null>(
    abonneerReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => null,
  );

  /* Een sleepbeweging mag geen kaart openen. We vergelijken daarom waar de
     klik viel met waar de muis neerkwam: meer dan een paar pixels verschil is
     slepen geweest. Een klik via het toetsenbord heeft geen positie
     (detail 0) en opent altijd. */
  const isVersleept = (e: ReactMouseEvent) =>
    e.detail !== 0 && Math.hypot(e.clientX - neer.current.x, e.clientY - neer.current.y) > 6;

  const opOpenen = (index: number, vanaf: DOMRect, e: ReactMouseEvent) => {
    if (isVersleept(e)) return;
    setOpen({ index, vanaf });
    setKaartVerborgen(true);
  };

  /* Dezelfde beveiliging voor de knop op de laatste kaart. Een link navigeert
     uit zichzelf, dus die moeten we actief tegenhouden: Next slaat het
     navigeren over zodra de klik is afgebroken. */
  const opKnopKlik = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    if (isVersleept(e)) e.preventDefault();
  };

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
    if (!wakker) return;
    bijScroll();
    /* Snap pas aanzetten als de kaarten uitgeschoven zijn. De laatste kaart
       start met (aantal × 90ms) vertraging en doet er 650ms over; daarna staat
       alles stil en kan snap geen scrollcorrecties meer veroorzaken. */
    const klaar = window.setTimeout(
      () => rail.current?.classList.add("rust"),
      KAARTEN.length * 90 + 700,
    );
    return () => window.clearTimeout(klaar);
  }, [wakker]);

  const stap = (richting: number) => {
    const el = rail.current;
    el?.scrollBy({ left: richting * Math.round(el.clientWidth * 0.75), behavior: "smooth" });
  };

  /* Slepen met de muis. Belangrijk: de pointer wordt pas overgenomen zodra er
     écht gesleept wordt. Doe je dat al bij het indrukken, dan levert de
     browser de klik af bij de rail in plaats van bij de kaart, en opent er
     dus nooit iets. */
  const pakVast = (e: ReactPointerEvent<HTMLDivElement>) => {
    neer.current = { x: e.clientX, y: e.clientY };
    const el = rail.current;
    if (e.pointerType !== "mouse" || !el) return;
    greep.current = { actief: true, startX: e.clientX, startScroll: el.scrollLeft, vangt: 0 };
  };
  const beweeg = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = rail.current;
    if (!greep.current.actief || !el) return;
    const verzet = e.clientX - greep.current.startX;
    if (!greep.current.vangt) {
      if (Math.abs(verzet) <= 5) return;
      greep.current.vangt = e.pointerId;
      el.setPointerCapture(e.pointerId);
      el.classList.add("sleept");
    }
    e.preventDefault();
    el.scrollLeft = greep.current.startScroll - verzet;
  };
  const laatLos = () => {
    const el = rail.current;
    if (el && greep.current.vangt && el.hasPointerCapture(greep.current.vangt)) {
      el.releasePointerCapture(greep.current.vangt);
    }
    greep.current = { actief: false, startX: 0, startScroll: 0, vangt: 0 };
    el?.classList.remove("sleept");
  };

  const kantlijn = "max(1.5rem, calc(50% - 32rem + 1.5rem))";

  return (
    /* Was pt-24. Met de ondertekst erbij hing de kop midden in zijn blok; nu
       die weg is stond er 120px boven de kop en nog maar 40px tot de kaarten,
       en dan zakt de titel optisch weg naar de rij toe. Dit haalt er 32px af,
       zodat de kop weer boven zijn eigen sectie staat in plaats van vlak boven
       de kaarten. */
    <div className="pt-14">
      <RailKop />
      <div className="mt-3">
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
          className="tool-rail flex gap-5 overflow-x-auto py-7 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink/60 sm:gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ paddingLeft: kantlijn, paddingRight: kantlijn, scrollPaddingLeft: kantlijn }}
        >
          <RailKaarten
            gezien={gezien}
            opOpenen={opOpenen}
            opKnopKlik={opKnopKlik}
            openId={open && kaartVerborgen ? KAARTEN[open.index].id : null}
          />
        </div>

        <div className="mx-auto flex w-full max-w-5xl justify-end px-6">
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

      {open && (
        <ToolPaneel
          kaart={KAARTEN[open.index]}
          vanaf={open.vanaf}
          reduced={reduced === true}
          opStartSluiten={() => setKaartVerborgen(false)}
          opSluiten={() => setOpen(null)}
        />
      )}
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
export function KaartBeeld({ soort }: { soort: string }) {
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
          {/* Stond rechts (self-end), maar daar zit nu het tijdwinst-chipje
             dat op elke kaart in dezelfde hoek hoort. Links is hier de vrije
             kant: de balken eronder beginnen ook links.
             Op de smalle kaart schuift de regel een rij naar beneden: het
             handschrift (Kalam) is breed genoeg om daar alsnog tot onder het
             chipje te lopen. Vanaf sm is er ruimte zat en staat hij weer op
             zijn oude hoogte. */}
          <p className="font-hand mt-6 self-start text-xl text-white sm:mt-0">groep 5 · middenmeting</p>
          {/* Per vak één balk, niet per rekendomein: een toetsronde gaat net
             zo goed over spelling en begrijpend lezen. */}
          <div className="mt-4 space-y-3" aria-hidden>
            {[
              { naam: "Rekenen", breed: 78, aandacht: false },
              { naam: "Begrijpend lezen", breed: 64, aandacht: false },
              { naam: "Spelling", breed: 36, aandacht: true },
              { naam: "Technisch lezen", breed: 72, aandacht: false },
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
            Sofie en Yassin vallen op bij spelling: werkwoorden.
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
        {/* Zit iets lager dan de andere kaarten hun hoektekst: deze regel is
           breed genoeg om tot voorbij het midden te lopen, en het tijdwinst-
           chipje rechtsboven viel er anders overheen. Onder het chipje langs
           houdt de regel zijn volledige tekst. */}
        <p className="font-hand absolute left-6 top-12 -rotate-2 text-xl text-ink/80">
          vrijdag 16:02 · verstuurd
        </p>
      </div>
    );

  if (soort === "lesontwerp") {
    // Eén coördinatenstelsel (viewBox 336×420 = de 4:5-kaart) voor de route
    // én de stations, zodat elk station exact op de lijn valt, op elk formaat.
    const stations = [
      { label: "Voorkennis", x: 70, y: 46, brand: false, rot: -2 },
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
            stroke="var(--color-brand, #2f9e6e)"
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
        {/* Het werkblad zelf. Op de smalle kaart (mobiel) vulde het bijna het
           hele vlak en kwam de rechterbovenhoek onder het tijdwinst-chipje
           uit; daar staat het nu iets smaller en iets lager. Vanaf sm is er
           ruimte zat en blijft de oude maat staan. */}
        <div className="absolute left-1/2 top-[50%] w-[76%] -translate-x-1/2 -translate-y-1/2 rotate-2 rounded-xl bg-white p-4 shadow-2xl sm:top-[46%] sm:w-[80%] sm:p-5">
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
        {/* Iets lager dan de andere hoekteksten, net als bij oudercontact: dit
           labeltje is breed genoeg om op de smalle kaart tot onder het
           tijdwinst-chipje rechtsboven te lopen. */}
        <p className="absolute left-5 top-12 -rotate-2 rounded-lg bg-ink px-3 py-1.5 font-display text-sm font-bold text-cream shadow-md">
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

      /* Reveals: inhoud is standaard zichtbaar; .anim voegt de beweging toe.

         Even op 12px/0,5s gezet omdat een sectie er ruim een seconde over
         deed. Dat was de verkeerde knop: niet de LENGTE van de beweging zat
         in de weg, maar het AANTAL losse bewegingen. Negen elementen die elk
         hun eigen moment kozen leest als rommel, ook als elk afzonderlijk
         netjes is. Met de reveals op groepen (zie Privacy.tsx) is dat weg, en
         mocht de beweging weer voluit — korter maakte het effect namelijk zo
         goed als onzichtbaar. */
      .anim [data-reveal] {
        opacity: 0;
        transform: translateY(18px);
        transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
          transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .anim [data-reveal].is-in { opacity: 1; transform: none; }

      /* Overlays die op een foto vastgeplakt zitten (de naamkadertjes in de
         privacysectie) mogen NIET meeschuiven: als zo'n kadertje omhoog komt
         terwijl de foto stilstaat, laat het los van het papier waar het op
         hoort te liggen. Die faden alleen. */
      .anim [data-reveal][data-stil] { transform: none; }

      /* ── De tool-galerij ── */
      /* Slepen: de rail pakt de muis vast; tijdens het slepen geen snap.
         Snap staat óók uit zolang de kaarten binnenkomen: die schuiven dan
         met translate, en scroll-snap corrigeert de scrollpositie mee op de
         bewegende snappunten. Samen met scroll-behavior: smooth zag je de rij
         daardoor doorschieten en terugveren. Pas als alles stilstaat gaat
         snap aan. */
      .tool-rail { cursor: grab; scroll-snap-type: none; overflow-anchor: none; }
      .tool-rail.rust { scroll-snap-type: x proximity; }
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

      /* De herkenningsregels: de tekst staat stil en netjes. Wat er gebeurt:
         de regel in de leesband staat op vol inkt, de andere gedempt, en het
         hokje in de kantlijn vinkt zichzelf groen af zodra je de regel leest.
         Herken je dit? De pagina vinkt met je mee. Omkeerbaar; zonder .anim
         staat alles vol en afgevinkt. */
      [data-leesregel] .kop { color: rgb(34 28 58); }
      [data-leesregel] .uitleg { color: rgb(34 28 58 / 0.6); }
      .anim [data-leesregel] .kop,
      .anim [data-leesregel] .uitleg {
        transition: color 0.55s cubic-bezier(0.23, 1, 0.32, 1);
      }
      .anim [data-leesregel] .kop { color: rgb(34 28 58 / 0.55); }
      .anim [data-leesregel] .uitleg { color: rgb(34 28 58 / 0.45); }
      .anim [data-leesregel].leest .kop { color: rgb(34 28 58); }
      .anim [data-leesregel].leest .uitleg { color: rgb(34 28 58 / 0.7); }



      /* Knoppen mogen voelen dat je ze indrukt. */
      .knop-druk:active { transform: scale(0.97); }

      /* De kaart komt naar je toe als je erover gaat, en de hint verschijnt.
         Alleen op echte muisaanwijzers: op touch triggert hover bij tikken. */
      .kaart-knop { cursor: pointer; }
      .kaart-hint {
        opacity: 0;
        transition: opacity 0.25s ease-out;
      }
      .kaart-hint > span {
        transform: translateY(8px);
        transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
      }
      @media (hover: hover) and (pointer: fine) {
        .kaart-knop:hover {
          transform: scale(1.035) translateY(-6px);
          box-shadow: -9px 22px 45px -20px rgb(34 28 58 / 0.45);
        }
        .kaart-knop:hover .kaart-hint { opacity: 1; }
        .kaart-knop:hover .kaart-hint > span { transform: translateY(0); }
        .kaart-knop:active { transform: scale(1.005) translateY(-2px); }
      }
      .kaart-knop:focus-visible .kaart-hint { opacity: 1; }
      .kaart-knop:focus-visible .kaart-hint > span { transform: translateY(0); }

      /* De tekst in het paneel komt net na de beweging binnen. */
      .paneel-tekst > * {
        opacity: 0;
        transform: translateY(10px);
        animation: paneeltekst 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards;
      }
      .paneel-tekst > *:nth-child(1) { animation-delay: 0.22s; }
      .paneel-tekst > *:nth-child(2) { animation-delay: 0.28s; }
      .paneel-tekst > *:nth-child(3) { animation-delay: 0.34s; }
      .paneel-tekst > *:nth-child(4) { animation-delay: 0.4s; }
      .paneel-tekst > *:nth-child(5) { animation-delay: 0.46s; }
      @keyframes paneeltekst {
        to { opacity: 1; transform: translateY(0); }
      }

      /* Slotvinkje tekent zichzelf. */
      .anim [data-reveal] .slotvink path {
        stroke-dasharray: 1;
        stroke-dashoffset: 1;
        transition: stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        transition-delay: var(--vertraag, 0.3s);
      }
      .anim [data-reveal].is-in .slotvink path { stroke-dashoffset: 0; }

      /* Het herken-vinkje wacht niet op .is-in maar op .leest: pas als je de
         regel echt leest, vinkt het hokje zichzelf af. Deze regels staan ná
         het generieke slotvink-patroon en winnen dus bij gelijke sterkte. */
      .anim [data-leesregel].is-in .herkenvink path {
        stroke-dashoffset: 1;
        transition: stroke-dashoffset 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.15s;
      }
      .anim [data-leesregel].leest .herkenvink path { stroke-dashoffset: 0; }

      /* ── Het bewijs bij de privacybelofte ──
         Beide kaarten hangen aan de reveal die de pagina al gebruikt. De
         eindstand staat in de eerste regels, dus zonder JS of zonder
         beweging klopt het beeld meteen; .anim draait het terug naar het
         beginpunt en laat het aflopen. */

      /* De doorgestreepte regels: de streep trekt zichzelf en de tekst
         zakt weg, één regel na de andere. Je ziet het weggaan in plaats
         van erover te lezen. */
      .wis-regel { color: rgb(34 28 58 / 0.45); }
      .wis-woord { position: relative; }
      .wis-woord::after {
        content: "";
        position: absolute;
        left: -0.12em;
        right: -0.12em;
        top: 0.7em;
        height: 2px;
        border-radius: 2px;
        background: rgb(47 158 110 / 0.8);
        transform-origin: left center;
      }
      /* De tekst gaat voor. De kaart staat ernaast en komt dus op hetzelfde
         moment in beeld, maar hij wacht tot de zin er staat: eerst lezen,
         dan het bewijs. Alles in de kaart hangt aan die ene wachttijd, zodat
         de volgorde binnen de kaart klopt hoe lang je hem ook maakt. */
      .kaartblok { --wacht: 0.42s; }
      .anim .kaartblok { transition-delay: var(--wacht); }

      .anim .kaartblok .wis-regel {
        color: rgb(34 28 58 / 0.75);
        transition: color 0.45s ease;
        transition-delay: calc(var(--wacht) + 0.36s + var(--i) * 0.13s);
      }
      .anim .kaartblok.is-in .wis-regel { color: rgb(34 28 58 / 0.45); }
      .anim .kaartblok .wis-woord::after {
        transform: scaleX(0);
        transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        transition-delay: calc(var(--wacht) + 0.36s + var(--i) * 0.13s);
      }
      .anim .kaartblok.is-in .wis-woord::after { transform: scaleX(1); }

      /* De klassenlijst: de rechterkolom schrijft zichzelf regel voor regel
         vol. De echte namen blijven staan, want die blijven bij jou. */
      .anim .kaartblok .klasmasker {
        opacity: 0;
        transform: translateX(-6px);
        transition: opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        transition-delay: calc(var(--wacht) + 0.32s + var(--i) * 0.11s);
      }
      .anim .kaartblok.is-in .klasmasker { opacity: 1; transform: none; }

      /* De vellen onder de kaart: zonder beweging liggen ze meteen goed,
         mét beweging beginnen ze recht onder de kaart en schuiven ze er
         rustig onderuit. */
      .stapelvel { transform: var(--eind); }
      .anim .kaartblok .stapelvel {
        opacity: 0;
        transform: none;
        transition: opacity 0.45s ease-out, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        transition-delay: calc(var(--wacht) + var(--vel-wacht));
      }
      .anim .kaartblok.is-in .stapelvel {
        opacity: 1;
        transform: var(--eind);
      }

      @media (prefers-reduced-motion: reduce) {
        .anim [data-reveal] { opacity: 1; transform: none; transition: none; }
        /* Paneel en kaart-hint gewoon tonen, zonder beweging. */
        .paneel-tekst > * { opacity: 1; transform: none; animation: none; }
        .kaart-hint { transition: opacity 0.2s linear; }
        .kaart-hint > span { transform: none; transition: none; }
      }
    `}</style>
  );
}

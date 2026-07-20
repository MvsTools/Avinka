"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import HeroFlow from "@/components/HeroFlow";
import Prijzen from "@/components/Prijzen";
import { PROEF_DAGEN } from "@/lib/abonnement";

/* ──────────────────────────────────────────────────────────────────────────
   Concept "De Lijst": de pagina ís een takenlijst van een leerkracht.
   Eén doorlopende lijn (de marge van het lijstje) loopt van boven naar
   beneden; elke sectie is een item dat wordt afgevinkt zodra je het
   passeert. Onderaan telt de winst op: 2 uur, elke week weer.

   Motion is bewust minimaal: het vinkje, de doorstreep en de groene lijn
   die meegroeit. Verder rust. (Zie CLAUDE.md + geheugen hero-rust.)
   ────────────────────────────────────────────────────────────────────────── */

/* ── Teksten op één plek ─────────────────────────────────────────────── */

const ITEMS = [
  {
    slug: "rapporten",
    taak: "5 rapporten schrijven",
    sub: "groep 5 · periode 2",
    tool: "Rapporten",
    emoji: "📝",
    kleur: "#8b5cf6",
    zacht: "#ede9fe",
    min: 35,
    tekst:
      "Je vertelt in een paar steekwoorden hoe het met Sofie gaat. Avinka schrijft er een warm, persoonlijk rapport van dat klinkt alsof jij het schreef. Want dat deed je ook, alleen een stuk sneller.",
  },
  {
    slug: "toetsanalyse",
    taak: "Toetsen analyseren",
    sub: "IEP rekenen · groep 5",
    tool: "Toetsanalyse",
    emoji: "📊",
    kleur: "#0284c7",
    zacht: "#e0f2fe",
    min: 45,
    tekst:
      "Plak je toetsoverzicht erin en zie meteen hoe je groep ervoor staat, per domein en per kind. De tool rekent alles zelf uit en de AI verzint nooit een cijfer. Geen avond meer puzzelen in Excel.",
  },
  {
    slug: "oudercontact",
    taak: "Oudergesprekken",
    sub: "10-minutengesprekken voorbereiden",
    tool: "Oudercontact",
    emoji: "✉️",
    kleur: "#e11d48",
    zacht: "#ffe4e6",
    min: 15,
    tekst:
      "Van gespreksleidraad tot weekbericht: jij kiest de toon, Avinka zet de voorzet klaar. Nooit meer om kwart voor tien naar een leeg scherm staren.",
  },
  {
    slug: "lesontwerp",
    taak: "Les voorbereiden",
    sub: "breuken vergelijken",
    tool: "Lesontwerp",
    emoji: "📓",
    kleur: "#0d9488",
    zacht: "#ccfbf1",
    min: 25,
    tekst:
      "Lever één lesdoel aan en krijg een complete les terug, opgebouwd volgens EDI. Met werkvormen, differentiatie en praktische tips. Klaar om morgen te geven.",
  },
];

const TOTAAL_SOM = ITEMS.map((i) => i.min).join(" + "); // "35 + 45 + 15 + 25"

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
];

/* ── De pagina ───────────────────────────────────────────────────────── */

export default function DeLijst({ fotoBestand }: { fotoBestand?: string }) {
  const lijstRef = useRef<HTMLDivElement>(null);
  // done[i] hoort bij het i-de element met [data-vink] (4 taken, slot, einde).
  const [done, setDone] = useState<boolean[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = lijstRef.current;
    if (!el) return;
    const markers = Array.from(el.querySelectorAll<HTMLElement>("[data-vink]"));
    let raf = 0;
    const meet = () => {
      raf = 0;
      // De "afvink-lijn" ligt op 55% van het scherm: wat je passeert, is klaar.
      const lijn = window.innerHeight * 0.55;
      setDone(markers.map((m) => m.getBoundingClientRect().top < lijn));
      const r = el.getBoundingClientRect();
      setProgress(Math.min(1, Math.max(0, (lijn - r.top) / r.height)));
    };
    const plan = () => {
      if (!raf) raf = requestAnimationFrame(meet);
    };
    meet();
    window.addEventListener("scroll", plan, { passive: true });
    window.addEventListener("resize", plan);
    return () => {
      window.removeEventListener("scroll", plan);
      window.removeEventListener("resize", plan);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="relative flex-1 overflow-x-clip">
      <style>{`
        .omcirkel-teken { animation: omcirkel .9s ease-out .45s both; }
        @keyframes omcirkel { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) { .omcirkel-teken { animation: none; } }
      `}</style>
      {/* Papier-grain over de hele pagina: bewuste textuur, nauwelijks zichtbaar. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.05] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Bovenbalk */}
      <header className="sticky top-0 z-40 border-b border-ink/5 bg-cream/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3.5">
          <Logo className="h-9 w-auto" priority />
          <nav className="flex items-center gap-1.5 sm:gap-3">
            <a
              href="#prijzen"
              className="hidden rounded-lg px-3 py-2 text-base font-semibold text-ink/70 hover:text-ink sm:inline"
            >
              Prijzen
            </a>
            <Link
              href="/sign-in"
              className="rounded-lg px-3 py-2 text-base font-semibold text-ink/70 hover:text-ink"
            >
              Inloggen
            </Link>
            <Link
              href="/sign-up"
              className="rounded-xl bg-brand px-4 py-2 text-base font-bold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-dark"
            >
              Probeer gratis
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* 1. HERO ─ links de belofte, rechts de demo die het waarmaakt */}
        <section className="mx-auto w-full max-w-6xl px-6 pt-14 pb-20 lg:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[11fr_9fr]">
            <div>
              <p className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.18em] text-ink/50">
                <VinkjeKlein />
                Van to-do naar gedaan
              </p>
              <h1 className="mt-6 font-display text-[clamp(2.4rem,6vw,4.5rem)] font-black leading-[1.04] tracking-tight text-ink">
                Win elke week
                <br />
                <span className="relative inline-block whitespace-nowrap">
                  <span className="relative z-10">2 uur</span>
                  <OmcirkelD />
                </span>{" "}
                terug.
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-8 text-ink/70 sm:text-xl">
                Avinka is de takenlijst die meewerkt. Rapporten, toetsanalyse,
                oudercontact en je lesvoorbereiding staan er al op: jij klikt,
                Avinka doet de voorzet, jij houdt het laatste woord.
              </p>
              <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/sign-up"
                  className="rounded-2xl bg-brand px-8 py-4 text-lg font-bold text-white shadow-lg shadow-brand/25 transition hover:-translate-y-0.5 hover:bg-brand-dark motion-reduce:hover:translate-y-0"
                >
                  Probeer Avinka gratis
                </Link>
                <a
                  href="#lijst"
                  className="group rounded-lg px-1 py-2 text-lg font-bold text-ink/70 transition hover:text-ink"
                >
                  Bekijk het lijstje{" "}
                  <span className="inline-block transition-transform group-hover:translate-y-0.5 motion-reduce:group-hover:translate-y-0">
                    ↓
                  </span>
                </a>
              </div>
              <p className="mt-6 text-sm font-semibold text-ink/50">
                {PROEF_DAGEN} dagen gratis · geen betaalgegevens nodig · namen van
                leerlingen blijven thuis
              </p>
            </div>
            <div className="relative lg:justify-self-end">
              {/* Zachte gloed verankert de demo in de compositie, zonder drukte */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-x-10 -inset-y-8 rounded-[3rem] bg-brand/10 blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-6 -right-8 h-40 w-40 rounded-full bg-accent/15 blur-2xl"
              />
              <div className="relative">
                <HeroFlow />
              </div>
            </div>
          </div>
        </section>

        {/* 2. HET LIJSTJE ─ de ruggengraat van de pagina */}
        <section id="lijst" className="scroll-mt-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="max-w-2xl pb-4 pl-[56px] sm:pl-[76px]">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-ink/50">
                Het lijstje
              </p>
              <h2 className="mt-4 font-display text-4xl font-black tracking-tight text-ink sm:text-5xl">
                Dinsdagmiddag, kwart over vier.
              </h2>
              <p className="mt-5 text-lg leading-8 text-ink/70">
                De klas is leeg, het echte werk begint. Herkenbaar? Scroll maar
                mee. Avinka streept door.
              </p>
            </div>

            {/* De lijst zelf: lijn + items */}
            <div ref={lijstRef} className="relative">
              {/* De marge-lijn. De groene vulling groeit mee met je scroll. */}
              <div
                aria-hidden
                className="absolute bottom-0 top-0 left-[19px] w-[2px] rounded-full bg-ink/10 sm:left-[27px]"
              >
                <div
                  className="absolute left-0 top-0 h-full w-full origin-top rounded-full bg-brand transition-transform duration-200 ease-out motion-reduce:transition-none"
                  style={{ transform: `scaleY(${progress})` }}
                />
              </div>

              {ITEMS.map((item, i) => (
                <LijstItem key={item.slug} item={item} done={!!done[i]} index={i} />
              ))}

              {/* De rest van de lijst: blijft gewoon staan, eerlijk is eerlijk. */}
              <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-4 pb-16 sm:grid-cols-[56px_minmax(0,1fr)] sm:gap-x-5">
                <div />
                <div className="max-w-2xl space-y-3">
                  <RestRij taak="Plattegrond omgooien" chip="🪑 ook een Avinka-tool" />
                  <RestRij taak="Werkbladen maken" chip="✨ binnenkort" />
                </div>
              </div>

              {/* Tussendoor: de privacybelofte, als vastgeprikt briefje */}
              <div
                data-vink
                className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-4 pb-20 sm:grid-cols-[56px_minmax(0,1fr)] sm:gap-x-5"
              >
                <div className="pt-1">
                  <span
                    className={
                      "relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border-2 bg-cream transition-colors duration-300 sm:h-12 sm:w-12 sm:rounded-2xl " +
                      (done[ITEMS.length]
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-ink/15 text-ink/40")
                    }
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5 sm:h-6 sm:w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <rect x="4" y="11" width="16" height="9" rx="2.5" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                  </span>
                </div>
                <div className="max-w-2xl -rotate-[0.6deg] rounded-3xl border border-accent/30 bg-accent-soft p-8 shadow-sm sm:p-10">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-ink/50">
                    Tussendoor even dit
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-black tracking-tight text-ink sm:text-4xl">
                    Namen blijven thuis.
                  </h2>
                  <p className="mt-4 text-lg leading-8 text-ink/75">
                    Voordat er ook maar iets naar de AI gaat, maakt Avinka de
                    namen van je leerlingen op jouw eigen computer onleesbaar.
                    Je account staat op beveiligde servers in Europa. Privacy is
                    hier de ruggengraat, geen bijzaak.
                  </p>
                </div>
              </div>

              {/* Het einde van de lijst: de optelsom */}
              <div
                data-vink
                className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-x-4 pb-24 sm:grid-cols-[56px_minmax(0,1fr)] sm:gap-x-5"
              >
                {/* Dekt de lijn af onder de eindvink: de lijst eindigt hiér */}
                <div
                  aria-hidden
                  className="absolute bottom-0 left-[19px] top-8 z-[1] w-[2px] bg-cream sm:left-[27px]"
                />
                <div className="pt-2">
                  <span
                    className={
                      "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-12 sm:w-12 " +
                      (done[ITEMS.length + 1]
                        ? "border-brand bg-brand text-white shadow-lg shadow-brand/30"
                        : "border-ink/15 bg-cream text-transparent")
                    }
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </div>
                <div className="max-w-2xl">
                  <h2 className="font-display text-[clamp(3rem,7vw,5rem)] font-black leading-none tracking-tight text-ink">
                    Klaar.
                  </h2>
                  <p className="mt-6 text-xl leading-9 text-ink/75 sm:text-2xl">
                    <span className="font-bold tabular-nums text-ink">
                      {TOTAAL_SOM} minuten.
                    </span>{" "}
                    Dat is{" "}
                    <span className="relative inline-block whitespace-nowrap font-bold text-brand">
                      2 uur
                      <MarkerStreep />
                    </span>
                    , elke week weer. Voor je klas, je gezin, of gewoon de bank.
                  </p>
                  <Link
                    href="/sign-up"
                    className="mt-9 inline-block rounded-2xl bg-brand px-8 py-4 text-lg font-bold text-white shadow-lg shadow-brand/25 transition hover:-translate-y-0.5 hover:bg-brand-dark motion-reduce:hover:translate-y-0"
                  >
                    Probeer Avinka gratis
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. DE MAKER ─ een kort, persoonlijk briefje */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-24">
          <div className="mx-auto max-w-2xl rotate-[0.4deg] rounded-3xl border border-ink/5 bg-white p-8 shadow-md sm:p-12">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-ink/50">
              Wie dit maakt
            </p>
            <h2 className="mt-3 font-display text-3xl font-black tracking-tight text-ink sm:text-4xl">
              Ik had dit lijstje zelf.
            </h2>
            <p className="mt-5 text-lg leading-8 text-ink/75">
              Ik ben Michael. Ik sta net als jij voor de klas, en ik ken de
              avonden waarop het nakijkwerk wint van de bank. Daarom bouw ik
              Avinka: praktische tools die het uitzoek- en typwerk overnemen en
              zorgvuldig omgaan met de privacy van je leerlingen.
            </p>
            <p className="mt-4 text-lg leading-8 text-ink/75">
              Geen ingewikkelde technologie, geen handleiding. Gewoon je lijstje,
              een stuk korter. En jij houdt het laatste woord, altijd.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-brand-soft ring-2 ring-brand/20">
                {fotoBestand ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/${fotoBestand}`}
                    alt="Michael van Spanje"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-display text-lg font-black text-brand">
                    MvS
                  </span>
                )}
              </span>
              <span>
                <span className="block font-display text-xl font-bold italic text-ink">
                  Michael van Spanje
                </span>
                <span className="block text-sm font-semibold text-ink/55">
                  leerkracht en maker van Avinka
                </span>
              </span>
            </div>
          </div>
        </section>

        {/* 4. PRIJZEN (gedeelde component, zelfde bron als het dashboard) */}
        <Prijzen />

        {/* 5. VRAGEN */}
        <section id="vragen" className="mx-auto w-full max-w-6xl scroll-mt-8 px-6 pb-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-4xl font-black tracking-tight text-ink">
              Eerlijke antwoorden
            </h2>
            <div className="mt-10 space-y-4">
              {FAQ.map((item) => (
                <details
                  key={item.vraag}
                  className="group/faq rounded-2xl border border-ink/5 bg-white p-6 shadow-sm [&_summary]:cursor-pointer"
                >
                  <summary className="flex list-none items-center justify-between text-lg font-bold text-ink">
                    {item.vraag}
                    <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-transform group-open/faq:rotate-45 motion-reduce:transition-none">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 leading-8 text-ink/70">{item.antwoord}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 6. SLOT ─ nog één ding op de lijst, en dat ben jij */}
        <section className="relative overflow-hidden bg-ink">
          <div className="bg-grid absolute inset-0 opacity-[0.06]" aria-hidden />
          <div className="relative mx-auto w-full max-w-6xl px-6 py-24">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/50">
              Nog één ding voor op je lijstje
            </p>
            <Link
              href="/sign-up"
              className="group mt-8 flex items-center gap-5 rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-white/25 hover:bg-white/10 sm:gap-8 sm:p-9"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-[3px] border-white/40 transition-colors group-hover:border-brand group-hover:bg-brand sm:h-16 sm:w-16 sm:rounded-2xl">
                <svg
                  viewBox="0 0 24 24"
                  className="h-7 w-7 text-white opacity-0 transition-opacity group-hover:opacity-100 sm:h-9 sm:w-9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="flex-1 font-display text-2xl font-black tracking-tight text-white sm:text-5xl">
                Avinka gratis proberen
              </span>
              <span className="text-3xl text-white/50 transition-transform group-hover:translate-x-1.5 motion-reduce:group-hover:translate-x-0 sm:text-4xl">
                →
              </span>
            </Link>
            <p className="mt-6 text-sm font-semibold text-white/50">
              {PROEF_DAGEN} dagen gratis · geen betaalgegevens · maandelijks opzegbaar
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ── Een item op de lijst ────────────────────────────────────────────── */

function LijstItem({
  item,
  done,
  index,
}: {
  item: (typeof ITEMS)[number];
  done: boolean;
  index: number;
}) {
  return (
    <div
      data-vink
      className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-4 pb-20 sm:grid-cols-[56px_minmax(0,1fr)] sm:gap-x-5 sm:pb-24"
    >
      {/* Het vakje op de lijn */}
      <div className="pt-1.5 sm:pt-2.5">
        <span
          className={
            "relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border-[2.5px] transition-all duration-300 motion-reduce:transition-none sm:h-12 sm:w-12 sm:rounded-2xl " +
            (done
              ? "border-brand bg-brand shadow-lg shadow-brand/25"
              : "border-ink/20 bg-cream")
          }
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 sm:h-7 sm:w-7"
            fill="none"
            stroke="#fff"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path
              d="M5 13l4 4L19 7"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={done ? 0 : 1}
              className="transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none"
              style={{ transitionDelay: done ? "120ms" : "0ms" }}
            />
          </svg>
        </span>
      </div>

      {/* De taak + wat Avinka ermee doet */}
      <div className="grid max-w-4xl items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:gap-12">
        <div>
          <h3
            className={
              "relative inline-block whitespace-nowrap font-display text-2xl font-black tracking-tight transition-colors duration-300 sm:text-4xl " +
              (done ? "text-ink/45" : "text-ink")
            }
          >
            {item.taak}
            {/* Handgetekende doorstreep, tekent zichzelf bij het afvinken */}
            <svg
              viewBox="0 0 200 12"
              preserveAspectRatio="none"
              className="absolute left-[-2%] top-[54%] h-[10px] w-[104%] text-ink/55"
              fill="none"
              aria-hidden
            >
              <path
                d="M2 7 C 50 3, 120 10, 198 5"
                stroke="currentColor"
                strokeWidth="4.5"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={done ? 0 : 1}
                className="transition-[stroke-dashoffset,opacity] duration-500 ease-out motion-reduce:transition-none"
                style={{ transitionDelay: done ? "180ms" : "0ms", opacity: done ? 1 : 0 }}
              />
            </svg>
          </h3>
          <p className="mt-1.5 text-base font-semibold text-ink/45">{item.sub}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold text-ink"
              style={{ background: item.zacht }}
            >
              <span aria-hidden>{item.emoji}</span> {item.tool}
            </span>
            <span
              className={
                "inline-flex items-center rounded-full bg-brand-soft px-3 py-1.5 text-sm font-extrabold tabular-nums text-brand-dark transition-all duration-300 motion-reduce:transition-none " +
                (done ? "opacity-100" : "translate-y-1 opacity-0")
              }
            >
              ⏱ +{item.min} min terug
            </span>
          </div>

          <p className="mt-5 text-lg leading-8 text-ink/70">{item.tekst}</p>
        </div>

        {/* Vignet: een rustig, stilstaand inkijkje in de tool */}
        <div
          className={
            "rounded-3xl border border-ink/5 bg-white p-6 shadow-md " +
            (index % 2 === 0 ? "lg:rotate-[0.7deg]" : "lg:-rotate-[0.7deg]")
          }
        >
          <Vignet slug={item.slug} kleur={item.kleur} zacht={item.zacht} />
        </div>
      </div>
    </div>
  );
}

/* Kleine, stilstaande productinkijkjes. Bewust zonder animatie: de rust
   van de pagina zit hem juist in wat er níet beweegt. */
function Vignet({ slug, kleur, zacht }: { slug: string; kleur: string; zacht: string }) {
  if (slug === "rapporten") {
    return (
      <div>
        <VignetKop label="Rapport · Sofie" kleur={kleur} />
        <p className="mt-3 text-[15px] leading-7 text-ink/80">
          Sofie heeft zich de afgelopen periode mooi ontwikkeld. Ze werkt
          geconcentreerd en zelfstandig, en durft steeds vaker een vraag te
          stellen als ze er even niet uitkomt. Bij rekenen groeit haar
          zelfvertrouwen zichtbaar…
        </p>
        <span
          className="mt-4 inline-block rounded-full px-3 py-1 text-xs font-extrabold"
          style={{ background: zacht, color: "#221c3a" }}
        >
          klinkt als jij, niet als een robot
        </span>
      </div>
    );
  }
  if (slug === "toetsanalyse") {
    const domeinen = [
      { naam: "Getallen", pct: 78, kleur: "#2f9e6e", status: "op niveau" },
      { naam: "Verhoudingen", pct: 44, kleur: "#c07a1a", status: "aandacht" },
      { naam: "Meten & meetkunde", pct: 82, kleur: "#2f9e6e", status: "sterk" },
    ];
    return (
      <div>
        <VignetKop label="Groepsbeeld · IEP rekenen" kleur={kleur} />
        <div className="mt-4 space-y-2.5">
          {domeinen.map((d) => (
            <div key={d.naam} className="flex items-center gap-2.5">
              <span className="w-[122px] text-[13px] font-bold text-ink">{d.naam}</span>
              <span className="h-2 flex-1 rounded-full bg-ink/5">
                <span
                  className="block h-2 rounded-full"
                  style={{ width: `${d.pct}%`, background: d.kleur }}
                />
              </span>
              <span className="w-[60px] text-right text-[11px] font-bold" style={{ color: d.kleur }}>
                {d.status}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-xl bg-accent-soft px-3.5 py-2.5 text-[13px] font-semibold text-ink/80">
          → 4 leerlingen: verlengde instructie breuken
        </p>
      </div>
    );
  }
  if (slug === "oudercontact") {
    return (
      <div>
        <VignetKop label="Weekbericht · groep 5" kleur={kleur} />
        <p className="mt-3 text-[15px] leading-7 text-ink/80">
          Beste ouders, wat een week! We zijn gestart met ons project over de
          ruimte en de klas ging er helemaal in op. Volgende week dinsdag zijn
          de 10-minutengesprekken…
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["warm", "kort", "jij-vorm"].map((t) => (
            <span
              key={t}
              className="rounded-full px-3 py-1 text-xs font-extrabold text-ink"
              style={{ background: zacht }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  }
  // lesontwerp
  const fases = ["Voorkennis activeren", "Lesdoel", "Instructie (ik)", "Begeleide inoefening (wij)", "Zelfstandig (jij)"];
  return (
    <div>
      <VignetKop label="EDI-les · breuken vergelijken" kleur={kleur} />
      <div className="mt-4 space-y-2">
        {fases.map((fase, i) => (
          <div key={fase} className="flex items-center gap-2.5">
            <span
              className="flex shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
              style={{ background: kleur, width: 22, height: 22 }}
            >
              {i + 1}
            </span>
            <span className="text-[14px] font-semibold text-ink">{fase}</span>
          </div>
        ))}
        <p className="pl-8 text-[13px] font-semibold text-ink/45">…en nog 4 stappen</p>
      </div>
    </div>
  );
}

function VignetKop({ label, kleur }: { label: string; kleur: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: kleur }} />
      <span className="text-xs font-bold uppercase tracking-wide text-ink/50">{label}</span>
    </div>
  );
}

/* Een taak die (nog) niet door Avinka wordt afgevinkt in deze scroll */
function RestRij({ taak, chip }: { taak: string; chip: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-ink/5 bg-white/60 px-5 py-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-ink/15 bg-white" />
      <span className="flex-1 font-display text-xl font-bold text-ink/80">{taak}</span>
      <span className="rounded-full bg-sand px-3 py-1 text-xs font-extrabold text-ink/70">
        {chip}
      </span>
    </div>
  );
}

/* ── Handgetekende accenten ──────────────────────────────────────────── */

/* De amberkleurige omcirkeling rond "2 uur" in de hero */
function OmcirkelD() {
  return (
    <svg
      viewBox="0 0 260 110"
      preserveAspectRatio="none"
      className="absolute -inset-x-[8%] -inset-y-[10%] h-[120%] w-[116%] text-accent"
      fill="none"
      aria-hidden
    >
      <path
        d="M132 10 C 214 6, 252 32, 249 56 C 246 84, 178 104, 116 102 C 52 100, 10 80, 12 54 C 14 28, 68 10, 168 13"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        className="omcirkel-teken"
      />
    </svg>
  );
}

/* Amber onderstreping bij "2 uur" in de optelsom */
function MarkerStreep() {
  return (
    <svg
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      className="absolute -bottom-1 left-0 h-[8px] w-full text-accent"
      fill="none"
      aria-hidden
    >
      <path
        d="M2 9 C 40 3, 160 3, 198 7"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VinkjeKlein() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand">
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="#fff"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

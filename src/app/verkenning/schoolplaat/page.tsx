import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Instrument_Serif, Instrument_Sans } from "next/font/google";

export const metadata: Metadata = {
  title: "Verkenning B · Schoolplaat",
  description: "Richting B: de Jetses-schoolplaat.",
};

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-plaat-serif",
});
const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-plaat-sans",
});

/* Richting B — "Schoolplaat".
   Referent: de klassieke Nederlandse schoolplaat (Jetses, Koekkoek). Aards,
   schilderachtig, redactioneel als een poster. Ingelijste panelen als
   hangende wandplaten, met titelcartouche. Bewust GEEN nagetekend tafereel
   (dat wordt kinderlijk): de rijkdom komt uit warme kleurvlakken, lijst en
   hoog-contrast typografie. Palet: oker, gedempt olijf, baksteen, luchtblauw. */

const ROOM = "#efe6d1";
const INKT = "#2b2419";
const OKER = "#c78a2b";
const OLIJF = "#6d7444";
const BAKSTEEN = "#a8543a";
const LUCHT = "#7f95a0";

const PLATEN = [
  { titel: "Rapporten", nr: "I", van: OLIJF, naar: "#4e5730", tekst: "De AI schrijft mee, jij houdt de pen." },
  { titel: "Toetsanalyse", nr: "II", van: BAKSTEEN, naar: "#7c3a26", tekst: "Het hele groepsbeeld in één oogopslag." },
  { titel: "Oudercontact", nr: "III", van: OKER, naar: "#9c6516", tekst: "Een warme mail in twee minuten." },
  { titel: "Lesontwerp", nr: "IV", van: LUCHT, naar: "#566a74", tekst: "Een complete les uit één leerdoel." },
];

/* Een ingelijst paneel als hangende wandplaat: warme kleurgradiënt binnen een
   lijst, met een koperen ophangoog en een titelcartouche onderin. */
function Plaat({
  van,
  naar,
  titel,
  nr,
  tekst,
  groot = false,
}: {
  van: string;
  naar: string;
  titel: string;
  nr: string;
  tekst?: string;
  groot?: boolean;
}) {
  return (
    <figure className="relative flex flex-col items-center">
      <span
        className="h-5 w-5 rounded-full ring-2"
        style={{ background: "#d9c9a0", boxShadow: "inset 0 -2px 3px rgba(0,0,0,.3)", borderColor: INKT }}
        aria-hidden
      />
      <span className="h-4 w-px" style={{ background: `${INKT}66` }} aria-hidden />
      <div
        className="w-full overflow-hidden rounded-sm p-2"
        style={{ background: "#e4d7b6", boxShadow: `0 22px 40px -24px ${INKT}, inset 0 0 0 1px ${INKT}22` }}
      >
        <div
          className={`relative flex ${groot ? "aspect-[5/4]" : "aspect-[4/3]"} items-start justify-between overflow-hidden rounded-[2px] p-5`}
          style={{
            background: `radial-gradient(120% 120% at 20% 12%, ${van} 0%, ${naar} 78%)`,
            boxShadow: `inset 0 0 60px ${INKT}55`,
          }}
        >
          <span
            className="text-white/85"
            style={{ fontFamily: "var(--font-plaat-serif)", fontSize: groot ? "3rem" : "2rem", lineHeight: 1 }}
          >
            {nr}
          </span>
          {/* filmkorrel voor schilderachtige textuur */}
          <span
            className="pointer-events-none absolute inset-0 mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")",
            }}
            aria-hidden
          />
        </div>
        {/* titelcartouche, zoals het onderschrift op een echte schoolplaat */}
        <figcaption
          className="mt-2 rounded-[2px] px-3 py-2 text-center"
          style={{ background: ROOM, color: INKT }}
        >
          <span
            className="block tracking-[0.16em]"
            style={{ fontFamily: "var(--font-plaat-serif)", fontSize: groot ? "1.8rem" : "1.3rem" }}
          >
            {titel}
          </span>
          {tekst && <span className="mt-0.5 block text-sm" style={{ color: `${INKT}b0` }}>{tekst}</span>}
        </figcaption>
      </div>
    </figure>
  );
}

export default function SchoolplaatPage() {
  return (
    <main
      className={`${serif.variable} ${sans.variable} min-h-screen w-full`}
      style={
        {
          fontFamily: "var(--font-plaat-sans), system-ui, sans-serif",
          "--font-display": "var(--font-plaat-serif)",
          background: ROOM,
          color: INKT,
        } as CSSProperties
      }
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* ── Hero: poster-opmaak, asymmetrisch ── */}
        <section className="grid items-center gap-12 py-16 md:grid-cols-[1.15fr_0.85fr] md:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: BAKSTEEN }}>
              Schoolplaat № 1 · van een leerkracht, voor leerkrachten
            </p>
            <h1
              className="mt-5 text-[clamp(3rem,8vw,6.5rem)] leading-[0.92]"
              style={{ fontFamily: "var(--font-plaat-serif)", letterSpacing: "-0.015em" }}
            >
              Win elke week twee uur terug.
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-8" style={{ color: `${INKT}cc` }}>
              <span
                className="float-left mr-3 mt-1"
                style={{ fontFamily: "var(--font-plaat-serif)", fontSize: "3.6rem", lineHeight: 0.8, color: BAKSTEEN }}
              >
                A
              </span>
              l je schoolwerk staat overal en nergens. Avinka brengt het samen op
              één eigen werkplek, met slimme hulp die het administratieve werk uit
              handen neemt. Zodat jij tijd overhoudt voor de klas.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/sign-up"
                className="rounded-full px-8 py-3.5 text-lg font-semibold text-white transition hover:-translate-y-0.5"
                style={{ background: INKT }}
              >
                Begin gratis
              </Link>
              <span className="text-base" style={{ color: `${INKT}99` }}>
                Zeven dagen · zonder betaalgegevens
              </span>
            </div>
          </div>
          <Plaat groot titel="Groep 5" nr="№1" van={OLIJF} naar="#4e5730" tekst="jouw werkplek" />
        </section>

        {/* ── Herken je dit? — redactioneel ── */}
        <section className="border-y py-16" style={{ borderColor: `${INKT}22` }}>
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] leading-tight" style={{ fontFamily: "var(--font-plaat-serif)" }}>
              Herken je dit?
            </h2>
            <div className="space-y-5 text-lg leading-8" style={{ color: `${INKT}cc` }}>
              <p>
                De rapporten stapelen zich op tot diep in de avond. De toetsen
                liggen te wachten om geanalyseerd te worden. En de oudermail moet
                er ook nog even tussendoor.
              </p>
              <p className="text-xl italic" style={{ fontFamily: "var(--font-plaat-serif)", color: BAKSTEEN }}>
                Het hoort bij het werk. Maar het kan sneller, slimmer en met
                minder gedoe.
              </p>
            </div>
          </div>
        </section>

        {/* ── De platen: tools als hangende wandplaten ── */}
        <section className="py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: BAKSTEEN }}>
            Alle tools, één werkplek
          </p>
          <h2 className="mt-3 text-[clamp(2rem,4vw,3.2rem)]" style={{ fontFamily: "var(--font-plaat-serif)" }}>
            De wandplaten
          </h2>
          <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {PLATEN.map((p) => (
              <Plaat key={p.titel} titel={p.titel} nr={p.nr} van={p.van} naar={p.naar} tekst={p.tekst} />
            ))}
          </div>
        </section>

        {/* ── Slot ── */}
        <section className="border-t py-24 text-center" style={{ borderColor: `${INKT}22` }}>
          <h2 className="mx-auto max-w-2xl text-[clamp(2.4rem,5vw,4rem)] leading-tight" style={{ fontFamily: "var(--font-plaat-serif)" }}>
            Kom binnen. Je werkplek staat klaar.
          </h2>
          <Link
            href="/sign-up"
            className="mt-9 inline-block rounded-full px-9 py-4 text-lg font-semibold text-white transition hover:-translate-y-0.5"
            style={{ background: BAKSTEEN }}
          >
            Probeer Avinka gratis
          </Link>
        </section>

        <footer className="pb-16 text-sm" style={{ color: `${INKT}88` }}>
          Richting B · Schoolplaat ·{" "}
          <Link href="/verkenning" className="underline">
            terug naar de drie
          </Link>
        </footer>
      </div>
    </main>
  );
}

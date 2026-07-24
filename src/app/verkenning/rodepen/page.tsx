import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Kalam } from "next/font/google";

export const metadata: Metadata = {
  title: "Verkenning C · De rode pen",
  description: "Richting C: de nakijkwereld.",
};

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-pen-display",
});
const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-pen-sans",
});
const hand = Kalam({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-pen-hand",
});

/* Richting C — "De rode pen".
   Referent: de nakijkwereld van de leerkracht. Rode ✓, doorhalingen,
   omcirkelde woorden, kantlijn-notities, stempels. Rood is de primaire kleur
   (geen groen), op nuchter papier met inktzwarte tekst. Het afvinken-ritueel
   letterlijk in de taal van de rode pen. */

const PAPIER = "#f7f4ec";
const INKT = "#1b1b1a";
const ROOD = "#d13b30";
const GRAFIET = "#57544d";

const HERKEN = [
  "Rapporten schrijven tot diep in de avond",
  "Toetsen analyseren in het weekend",
  "Oudermail die er ook nog even tussendoor moet",
];

const TOOLS = [
  ["Rapporten", "schrijft mee, jij houdt de pen"],
  ["Toetsanalyse", "het groepsbeeld in één oogopslag"],
  ["Oudercontact", "een warme mail in twee minuten"],
  ["Lesontwerp", "een complete les uit één leerdoel"],
];

/* Een rode omcirkeling, zoals een leerkracht een goed antwoord aankringelt. */
function Cirkel({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap px-1">
      {children}
      <svg
        className="absolute -inset-x-2 -inset-y-1"
        viewBox="0 0 200 70"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M100 6 C 40 4, 8 20, 10 38 C 12 58, 70 66, 108 64 C 168 61, 194 44, 190 28 C 186 12, 150 5, 96 8"
          fill="none"
          stroke={ROOD}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/* Een gedraaide rode stempel. */
function Stempel({ tekst, rot = -8 }: { tekst: string; rot?: number }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-md border-[3px] px-3 py-1 text-sm font-bold uppercase tracking-widest"
      style={{
        color: ROOD,
        borderColor: ROOD,
        transform: `rotate(${rot}deg)`,
        fontFamily: "var(--font-pen-sans)",
        opacity: 0.85,
      }}
    >
      {tekst}
    </span>
  );
}

export default function RodepenPage() {
  return (
    <main
      className={`${display.variable} ${sans.variable} ${hand.variable} min-h-screen w-full`}
      style={
        {
          fontFamily: "var(--font-pen-sans), system-ui, sans-serif",
          "--font-display": "var(--font-pen-display)",
          background: PAPIER,
          color: INKT,
          backgroundImage: `linear-gradient(90deg, transparent 78px, ${ROOD}22 78px, ${ROOD}22 80px, transparent 80px)`,
        } as CSSProperties
      }
    >
      <div className="mx-auto max-w-5xl px-6 sm:pl-28">
        {/* ── Hero ── */}
        <section className="pt-16 pb-20">
          <div className="flex items-center gap-4">
            <span className="text-xl" style={{ fontFamily: "var(--font-pen-hand)", color: GRAFIET }}>
              van een leerkracht, voor leerkrachten
            </span>
            <Stempel tekst="nagekeken ✓" />
          </div>

          <h1
            className="mt-6 text-[clamp(3rem,8.5vw,6.5rem)] font-extrabold leading-[0.95] tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-pen-display)" }}
          >
            Win elke week{" "}
            <Cirkel>twee uur</Cirkel>{" "}
            terug.
          </h1>

          <p className="mt-8 max-w-xl text-xl leading-9" style={{ color: `${INKT}cc` }}>
            Al je schoolwerk staat overal en nergens. Avinka brengt het samen op
            één eigen werkplek en neemt het administratieve werk uit handen.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Link
              href="/sign-up"
              className="rounded-lg px-8 py-4 text-lg font-bold text-white shadow-sm transition hover:-translate-y-0.5"
              style={{ background: ROOD }}
            >
              Begin gratis
            </Link>
            <span className="text-xl" style={{ fontFamily: "var(--font-pen-hand)", color: GRAFIET }}>
              7 dagen, zonder betaalgegevens
            </span>
          </div>
        </section>

        {/* ── Herken je dit? ── */}
        <section className="border-t py-16" style={{ borderColor: `${INKT}18` }}>
          <h2 className="text-4xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-pen-display)" }}>
            Herken je dit?
          </h2>
          <ul className="mt-8 space-y-4">
            {HERKEN.map((zin) => (
              <li key={zin} className="flex items-center gap-4 text-xl">
                <span className="shrink-0 text-3xl font-bold" style={{ color: ROOD, fontFamily: "var(--font-pen-hand)" }} aria-hidden>
                  ✓
                </span>
                <span style={{ color: `${INKT}dd` }}>{zin}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-2xl" style={{ fontFamily: "var(--font-pen-hand)", color: ROOD }}>
            Het hoort bij het werk. Maar het kan met minder gedoe.
          </p>
        </section>

        {/* ── Tools: als een nagekeken checklist ── */}
        <section className="border-t py-16" style={{ borderColor: `${INKT}18` }}>
          <div className="flex items-baseline justify-between">
            <h2 className="text-4xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-pen-display)" }}>
              Alle tools, één werkplek
            </h2>
            <Stempel tekst="af" rot={6} />
          </div>
          <ul className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {TOOLS.map(([naam, uitleg]) => (
              <li key={naam} className="flex items-start gap-4 border-b pb-5" style={{ borderColor: `${INKT}12` }}>
                <span
                  className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white"
                  style={{ background: ROOD }}
                  aria-hidden
                >
                  ✓
                </span>
                <div>
                  <p className="text-xl font-bold" style={{ fontFamily: "var(--font-pen-display)" }}>{naam}</p>
                  <p className="text-base" style={{ color: `${INKT}99` }}>{uitleg}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Slot ── */}
        <section className="border-t py-24 text-center" style={{ borderColor: `${INKT}18` }}>
          <div className="mb-6 flex justify-center">
            <Stempel tekst="goed gedaan ✓" rot={-5} />
          </div>
          <h2 className="mx-auto max-w-2xl text-[clamp(2.4rem,5vw,4rem)] font-extrabold leading-tight tracking-tight" style={{ fontFamily: "var(--font-pen-display)" }}>
            Kom binnen. Je werkplek staat klaar.
          </h2>
          <Link
            href="/sign-up"
            className="mt-9 inline-block rounded-lg px-9 py-4 text-lg font-bold text-white transition hover:-translate-y-0.5"
            style={{ background: ROOD }}
          >
            Probeer Avinka gratis
          </Link>
        </section>

        <footer className="pb-16 text-sm" style={{ color: GRAFIET }}>
          Richting C · De rode pen ·{" "}
          <Link href="/verkenning" className="underline">
            terug naar de drie
          </Link>
        </footer>
      </div>
    </main>
  );
}

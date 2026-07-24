import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Newsreader, Caveat } from "next/font/google";

export const metadata: Metadata = {
  title: "Verkenning A · Schrift",
  description: "Richting A: het oude schoolschrift.",
};

const serif = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-schrift-serif",
});
const hand = Caveat({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-schrift-hand",
});

/* Richting A — "Schrift".
   Referent: het Nederlandse schoolschrift. Gelinieerd papier, linnen kaft,
   de rode kantlijn, handschrift in inkt. Palet bewust wég van brand-groen:
   inktblauwzwart + kantlijnrood + kraft op warm papier. */

const PAPIER = "#f4efe3";
const INKT = "#26303a";
const ROOD = "#cf4a45";
const KRAFT = "#b79b6a";
const LIJN = "#c3ccd2";

const HERKEN = [
  "De rapporten stapelen zich op tot diep in de avond.",
  "De toetsen liggen te wachten om geanalyseerd te worden.",
  "En de oudermail moet er ook nog even tussendoor.",
];

const INHOUD = [
  ["Rapporten", "schrijft mee, jij houdt de pen"],
  ["Toetsanalyse", "ziet het groepsbeeld in één oogopslag"],
  ["Oudercontact", "een warme mail in twee minuten"],
  ["Lesontwerp", "een complete les uit één leerdoel"],
];

/* Gelinieerd papier met een rode kantlijn, net als in een echt schrift. */
const papierStijl: CSSProperties = {
  backgroundColor: PAPIER,
  backgroundImage: `repeating-linear-gradient(${PAPIER}, ${PAPIER} 37px, ${LIJN} 37px, ${LIJN} 38px)`,
  backgroundPositionY: "8px",
};

export default function SchriftPage() {
  return (
    <main
      className={`${serif.variable} ${hand.variable} min-h-screen w-full`}
      style={
        {
          fontFamily: "var(--font-schrift-serif), Georgia, serif",
          "--font-display": "var(--font-schrift-serif)",
          color: INKT,
          ...papierStijl,
        } as CSSProperties
      }
    >
      {/* De kantlijn loopt over de hele pagina, links van de tekstkolom */}
      <div className="relative mx-auto max-w-5xl px-8 sm:px-0">
        <div
          className="pointer-events-none absolute inset-y-0 hidden sm:block"
          style={{ left: 88, width: 2, background: ROOD, opacity: 0.6 }}
          aria-hidden
        />

        <div className="sm:pl-32 sm:pr-10">
          {/* ── Kop van het schrift ── */}
          <header className="flex items-baseline justify-between pt-10">
            <p className="text-sm tracking-wide" style={{ color: KRAFT }}>
              Avinka · schrift
            </p>
            <p
              className="text-2xl"
              style={{ fontFamily: "var(--font-schrift-hand)", color: ROOD }}
            >
              groep 5
            </p>
          </header>

          {/* ── Hero ── */}
          <section className="pt-20 pb-24">
            <p
              className="text-3xl"
              style={{ fontFamily: "var(--font-schrift-hand)", color: KRAFT }}
            >
              van een leerkracht, voor leerkrachten
            </p>
            <h1 className="mt-3 max-w-3xl text-[clamp(2.8rem,7vw,5.2rem)] font-semibold leading-[1.02] tracking-[-0.01em]">
              Win elke week{" "}
              <span className="relative whitespace-nowrap">
                twee uur
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  height="14"
                  viewBox="0 0 300 14"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    d="M2 8 C 60 3, 120 12, 180 6 S 260 4, 298 9"
                    fill="none"
                    stroke={ROOD}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              terug.
            </h1>
            <p className="mt-8 max-w-xl text-xl leading-9" style={{ color: `${INKT}cc` }}>
              Al je schoolwerk staat overal en nergens. Avinka brengt het samen
              op één eigen werkplek, zodat jij tijd overhoudt voor de klas.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Link
                href="/sign-up"
                className="rounded-md px-7 py-3.5 text-lg font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
                style={{ background: INKT }}
              >
                Begin gratis
              </Link>
              <span
                className="text-2xl"
                style={{ fontFamily: "var(--font-schrift-hand)", color: ROOD }}
              >
                ✓ zeven dagen, zonder betaalgegevens
              </span>
            </div>
          </section>

          {/* ── Herken je dit? ── */}
          <section className="border-t py-20" style={{ borderColor: `${KRAFT}66` }}>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Herken je dit?
            </h2>
            <ul className="mt-8 space-y-5">
              {HERKEN.map((zin) => (
                <li key={zin} className="flex items-start gap-4 text-xl leading-9">
                  <span
                    className="mt-1 shrink-0 text-2xl"
                    style={{ fontFamily: "var(--font-schrift-hand)", color: ROOD }}
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span style={{ color: `${INKT}dd` }}>{zin}</span>
                </li>
              ))}
            </ul>
            <p
              className="mt-10 text-3xl"
              style={{ fontFamily: "var(--font-schrift-hand)", color: KRAFT }}
            >
              Het hoort bij het werk. Maar het kan met minder gedoe.
            </p>
          </section>

          {/* ── Inhoud (de tools als inhoudsopgave van het schrift) ── */}
          <section className="border-t py-20" style={{ borderColor: `${KRAFT}66` }}>
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Inhoud
              </h2>
              <span className="text-sm" style={{ color: KRAFT }}>
                één werkplek
              </span>
            </div>
            <ol className="mt-8">
              {INHOUD.map(([naam, uitleg], i) => (
                <li
                  key={naam}
                  className="flex items-baseline gap-4 border-b py-5"
                  style={{ borderColor: `${LIJN}` }}
                >
                  <span
                    className="w-8 shrink-0 text-lg"
                    style={{ color: ROOD, fontFamily: "var(--font-schrift-hand)" }}
                  >
                    {i + 1}.
                  </span>
                  <span className="text-2xl font-semibold">{naam}</span>
                  <span
                    className="ml-auto text-right text-lg italic"
                    style={{ color: `${INKT}99` }}
                  >
                    {uitleg}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {/* ── Slot ── */}
          <section className="border-t py-24 text-center" style={{ borderColor: `${KRAFT}66` }}>
            <p
              className="text-3xl"
              style={{ fontFamily: "var(--font-schrift-hand)", color: ROOD }}
            >
              ✓ nagekeken
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Kom binnen. Je werkplek staat klaar.
            </h2>
            <Link
              href="/sign-up"
              className="mt-9 inline-block rounded-md px-8 py-4 text-lg font-semibold text-white transition hover:-translate-y-0.5"
              style={{ background: ROOD }}
            >
              Probeer Avinka gratis
            </Link>
          </section>

          <footer className="pb-16 pt-4 text-sm" style={{ color: KRAFT }}>
            Richting A · Schrift ·{" "}
            <Link href="/verkenning" className="underline">
              terug naar de drie
            </Link>
          </footer>
        </div>
      </div>
    </main>
  );
}

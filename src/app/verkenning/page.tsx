import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verkenning · niet-generieke identiteit",
  description: "Drie richtingen voor een eigen Avinka-identiteit, geworteld in Nederlands schoolerfgoed.",
};

/* ──────────────────────────────────────────────────────────────────────────
   /verkenning — kladpagina's om uit de "tasteful AI"-cluster te breken.
   Drie richtingen, elk uit een écht referentiepunt (geen groen/crème/amber).
   Wegwerp; raakt de echte landing (src/app/page.tsx) en /nieuw4 niet aan.
   ────────────────────────────────────────────────────────────────────────── */

const RICHTINGEN = [
  {
    slug: "schrift",
    nr: "A",
    naam: "Schrift",
    referent: "Het oude schoolschrift",
    beschrijving:
      "Gelinieerd papier, linnen kaft, de rode kantlijn, inkt. Bookish en rustig. Palet: blauwgrijs, kraft, kantlijnrood.",
    kleuren: ["#26303a", "#cf4a45", "#cbb488", "#f4efe3"],
  },
  {
    slug: "schoolplaat",
    nr: "B",
    naam: "Schoolplaat",
    referent: "De Jetses-schoolplaat",
    beschrijving:
      "Schilderachtig, aards, redactioneel als een poster. Ingelijste panelen, drop caps. Palet: oker, gedempt olijf, baksteen.",
    kleuren: ["#2b2419", "#c78a2b", "#6d7444", "#a8543a"],
  },
  {
    slug: "rodepen",
    nr: "C",
    naam: "De rode pen",
    referent: "De nakijkwereld",
    beschrijving:
      "Rode ✓, stempels, kantlijn-notities. Rood als primair, geen groen. Stevige grotesk plus handgeschreven notities.",
    kleuren: ["#1b1b1a", "#d13b30", "#57544d", "#f7f4ec"],
  },
];

export default function VerkenningIndex() {
  return (
    <main className="min-h-screen w-full bg-[#1a1a22] px-6 py-20 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/45">
          Verkenning · intern
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          Drie eigen identiteiten, uit Nederlands schoolerfgoed
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
          Dezelfde Avinka-boodschap, drie totaal andere huiden. Elk geworteld
          in iets echts uit de klas, zodat geen ervan in de standaard
          groen/crème/amber-cluster valt. Bekijk ze naast elkaar en reageer op
          wat je ziet.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {RICHTINGEN.map((r) => (
            <Link
              key={r.slug}
              href={`/verkenning/${r.slug}`}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06]"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-black text-white/30">{r.nr}</span>
                <div className="flex gap-1.5">
                  {r.kleuren.map((c) => (
                    <span
                      key={c}
                      className="h-4 w-4 rounded-full ring-1 ring-white/15"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <h2 className="mt-4 text-2xl font-black tracking-tight">{r.naam}</h2>
              <p className="mt-1 text-sm font-semibold text-white/50">{r.referent}</p>
              <p className="mt-4 text-sm leading-6 text-white/65">{r.beschrijving}</p>
              <p className="mt-6 text-sm font-bold text-white/80 group-hover:underline">
                Bekijk richting {r.nr} →
              </p>
            </Link>
          ))}
        </div>

        <p className="mt-14 text-sm text-white/40">
          Kladpagina's. De echte landing blijft ongemoeid; wat je kiest,
          verwerken we daarna pas in de guardrails.
        </p>
      </div>
    </main>
  );
}

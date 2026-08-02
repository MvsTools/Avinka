import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Avinka · twee andere opzetten",
  description: "Dezelfde teksten, een andere manier van weergeven.",
};

const OPZETTEN = [
  {
    id: "raster",
    naam: "Raster",
    kern: "De achtergrond is de structuur",
    tekst:
      "Een doorlopend kolommenraster over de hele pagina waar alles op vastklikt. Geen blobs, geen golven, geen zachte diepte — wel zware sectieregels, nummers en labels in de kantlijn, en koppen náást de inhoud in plaats van erboven. De accenten zijn massieve blokjes die op het raster vallen.",
  },
  {
    id: "baan",
    naam: "Baan",
    kern: "De pagina als één route naar beneden",
    tekst:
      "Een doorlopende lijn met een halte per onderdeel; de blokken hangen er om beurten links en rechts aan. De achtergrond bestaat uit enorme, dunne cirkelbogen die dwars door de sectiegrenzen heen lopen. De drie stappen van 'Zo werkt het' liggen letterlijk op de route.",
  },
];

export default function OpzetOverzicht() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-black tracking-tight text-neutral-900">
        Twee andere opzetten
      </h1>
      <p className="mt-3 max-w-xl leading-7 text-neutral-600">
        Hier is niet de huid veranderd maar de <strong className="font-semibold text-neutral-900">manier van weergeven</strong>.
        De teksten zijn woord voor woord gelijk aan{" "}
        <Link href="/nieuw5" className="font-semibold text-neutral-900 underline underline-offset-4">
          het origineel
        </Link>{" "}
        en de film bovenaan is ongewijzigd. Wat anders is: de indeling, het ritme
        en vooral de achtergrond — in beide opzetten is de blob-taal volledig
        uitgezet en vervangen door iets anders.
      </p>

      <ul className="mt-10 space-y-3">
        {OPZETTEN.map((o) => (
          <li key={o.id}>
            <Link
              href={`/opzet/${o.id}`}
              className="group block rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              <span className="flex flex-wrap items-baseline gap-x-3">
                <span className="text-lg font-bold text-neutral-900">{o.naam}</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  {o.kern}
                </span>
              </span>
              <span className="mt-2 block text-sm leading-6 text-neutral-600">{o.tekst}</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm leading-6 text-neutral-500">
        De vijf kleur- en lettervarianten staan los hiervan op{" "}
        <Link href="/thema" className="font-semibold text-neutral-700 underline underline-offset-4">
          /thema
        </Link>
        .
      </p>
    </main>
  );
}

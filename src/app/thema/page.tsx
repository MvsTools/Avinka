import Link from "next/link";
import type { Metadata } from "next";
import { THEMAS } from "./themas";

export const metadata: Metadata = {
  title: "Avinka · vijf visuele varianten",
  description: "Dezelfde landingspagina in vijf verschillende huiden.",
};

/* Een neutrale keuzepagina, bewust in grijstinten: zodra deze pagina zelf een
   van de vijf paletten zou dragen, vergelijk je de varianten niet meer eerlijk.
   De kleurstalen per kaart komen rechtstreeks uit de thema-tokens, dus ze
   kunnen niet uit de pas gaan lopen met wat je op de variant zelf ziet. */
export default function ThemaOverzicht() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-black tracking-tight text-neutral-900">
        Vijf visuele varianten
      </h1>
      <p className="mt-3 max-w-xl leading-7 text-neutral-600">
        Dezelfde pagina, vijf keer een andere huid. Structuur, secties,
        volgorde, teksten en werking zijn overal gelijk aan{" "}
        <Link href="/nieuw5" className="font-semibold text-neutral-900 underline underline-offset-4">
          de huidige landingspagina
        </Link>
        . Alleen letters, kleuren, textuur, vormen en schaduwen verschillen.
        Onderaan elke variant staat een balkje om direct door te klikken.
      </p>

      <ul className="mt-10 space-y-3">
        {THEMAS.map((t) => (
          <li key={t.id}>
            <Link
              href={`/thema/${t.id}`}
              className="group flex items-center gap-5 rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              <span className="flex shrink-0 gap-1" aria-hidden>
                {[
                  t.tokens["--w-papier"],
                  t.tokens["--w-veld"],
                  t.tokens["--color-brand"],
                  t.tokens["--color-accent"],
                  t.tokens["--w-donker"],
                ].map((kleur, i) => (
                  <span
                    key={i}
                    className="h-10 w-5 rounded-full ring-1 ring-black/10"
                    style={{ background: kleur }}
                  />
                ))}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-lg font-bold text-neutral-900">{t.naam}</span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    {t.letters}
                  </span>
                </span>
                <span className="mt-1 block text-sm leading-6 text-neutral-600">{t.eenRegel}</span>
              </span>
              <span className="ml-auto shrink-0 text-neutral-300 transition group-hover:text-neutral-900" aria-hidden>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

import { existsSync } from "fs";
import path from "path";
import type { CSSProperties } from "react";
import { Bricolage_Grotesque, Kalam } from "next/font/google";
import { MINT_LICHT, SPECKLE_STIJL, DONKER, KOP } from "../_landing/Wereld";
import { VariantPasje, VariantVragen, VariantTweePetten } from "./Varianten";

/* ⚠️ TIJDELIJKE PROEFPAGINA — /maker-proef. Weghalen zodra de eigenaar een
   variant heeft gekozen; die verhuist dan naar WereldMaker in Wereld.tsx en
   deze map kan weg (net als /cijfers-proef destijds).

   De letters staan hier net als op de echte pagina: Bricolage voor de koppen
   en Kalam voor het handschrift. Zonder die twee beoordeel je een variant op
   het verkeerde lettertype, en juist het handschrift doet in twee van de drie
   varianten echt werk. */

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const hand = Kalam({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-hand" });

const landingStijl: CSSProperties = {
  "--font-display": "var(--font-bricolage)",
} as CSSProperties;

function zoekAfbeelding(basis: string) {
  const varianten = ["jpg", "jpeg", "png", "webp"].flatMap((ext) => [
    `${basis}.${ext}`,
    `${basis[0].toUpperCase()}${basis.slice(1)}.${ext}`,
  ]);
  return varianten.find((f) => existsSync(path.join(process.cwd(), "public", f)));
}

const VARIANTEN = [
  {
    letter: "A",
    naam: "Het pasje",
    idee:
      "Een profiel wordt niet leuk van vormgeving maar van dingen die je nog niet wist. Vier controleerbare feiten zeggen meer dan drie alinea's over motivatie — en feiten houden het zakelijk.",
    Component: VariantPasje,
  },
  {
    letter: "B",
    naam: "Drie vragen",
    idee:
      "Zelfde tekst als nu, maar met een vraag ervoor. Dat maakt van een mededeling een gesprek. De vragen staan in het handschrift van de pagina, de antwoorden in gewone letters: twee stemmen, geen versiering.",
    Component: VariantVragen,
  },
  {
    letter: "C",
    naam: "Twee petten",
    idee:
      "Het enige idee dat alleen bij jou kan: je bent allebei. Links de leerkracht, rechts de bouwer, met jou op de naad ertussen. Dat is niet decoratie, dat is het argument zelf.",
    Component: VariantTweePetten,
  },
];

export default function MakerProef() {
  const foto = zoekAfbeelding("michael");

  return (
    <div
      className={`min-h-screen ${display.variable} ${hand.variable}`}
      style={{ ...landingStijl, ...SPECKLE_STIJL }}
    >
      <div className="mx-auto w-full max-w-5xl px-6 py-14">
        <h1
          className="font-display text-[clamp(2rem,4vw,3rem)] font-black tracking-tight"
          style={{ color: DONKER }}
        >
          Drie makersblokken
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-ink/70">
          Dezelfde inhoud, drie vormen. Alles tussen [ haakjes ] is een feit dat ik niet weet en dat
          jij moet invullen — die haakjes zijn geen ontwerp, die zijn een vraag aan jou.
        </p>
      </div>

      {VARIANTEN.map(({ letter, naam, idee, Component }) => (
        <section key={letter} className="relative py-12" style={{ background: MINT_LICHT }}>
          <div className="mx-auto w-full max-w-5xl px-6">
            <p className="text-sm font-bold uppercase tracking-[0.14em]" style={{ color: KOP }}>
              Variant {letter} · {naam}
            </p>
            <p className="mt-2 max-w-2xl text-base leading-7 text-ink/70">{idee}</p>
            <div className="mt-7">
              <Component foto={foto} />
            </div>
          </div>
        </section>
      ))}

      <div className="mx-auto w-full max-w-5xl px-6 py-14">
        <p className="max-w-2xl text-base leading-7 text-ink/70">
          Alle drie staan ze hier op het mintveld, net als op de echte pagina. Kies er één, of zeg
          welk stuk van de ene in de andere moet — dan bouw ik hem af en zet ik hem in de landing.
        </p>
      </div>
    </div>
  );
}

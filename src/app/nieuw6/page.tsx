import { existsSync } from "fs";
import path from "path";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Outfit, DM_Sans, Kalam } from "next/font/google";
import Footer from "@/components/Footer";
import Vierde from "./Vierde";

/* ──────────────────────────────────────────────────────────────────────────
   /nieuw6 — een eigen kopie van /nieuw5.

   Losse kopie en geen wrapper om /nieuw5 heen, precies zoals /nieuw5 ooit uit
   /nieuw4 is ontstaan: je kunt hier vrij in verbouwen zonder dat het origineel
   meebeweegt. /nieuw5 blijft de vastgezette stand.

   Twee dingen zijn overgenomen uit de variantenronde:

   1. HET LETTERPAAR VAN "ZONNEWARM" — Outfit voor de koppen, DM Sans voor de
      lopende tekst, Kalam voor de handgeschreven regels. Outfit is een
      geometrische schreefloze met open vormen: ronder en vriendelijker dan
      Bricolage, zonder kinderlijk te worden. Kalam hoorde bij die variant en
      is meegekomen, zodat het geheel klopt met wat er stond.

   2. DE HOKJES — het gespikkelde papier is vervangen door ruitjespapier, het
      patroon uit de variant "Diep bos". Dat zit in Wereld.tsx bij SPECKLE_STIJL.

   Verder is dit regel voor regel dezelfde pagina.
   ────────────────────────────────────────────────────────────────────────── */

const display = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-dmsans" });
const hand = Kalam({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-hand" });

export const metadata: Metadata = {
  title: "Avinka · nieuw6",
  description:
    "Al je schoolwerk staat overal en nergens. Avinka brengt het samen op één eigen werkplek en geeft je elke week zo'n 2 uur terug. Namen van leerlingen blijven thuis.",
};

function zoekBestand(namen: string[]) {
  return namen.find((f) => existsSync(path.join(process.cwd(), "public", f)));
}

function zoekAfbeelding(basis: string) {
  const varianten = ["jpg", "jpeg", "png", "webp"].flatMap((ext) => [
    `${basis}.${ext}`,
    `${basis[0].toUpperCase()}${basis.slice(1)}.${ext}`,
  ]);
  return zoekBestand(varianten);
}

/* ⚠️ `--font-sans` alléén zetten is niet genoeg, en dat is een valkuil die
   op /nieuw5 al jaren meeloopt: de regel die die variabele gebruikt staat in
   globals.css op `body`, en dat element ligt BOVEN deze wrapper. De variabele
   wordt daar dus al opgelost vóór onze waarde bestaat, en alles hierbinnen
   erft simpelweg de al berekende letter. Gevolg op /nieuw5: Instrument Sans
   wordt wel geladen maar nooit gebruikt — de lopende tekst is daar in
   werkelijkheid Plus Jakarta.

   Daarom staat `fontFamily` hier óók echt op de wrapper. De koppen blijven
   Outfit, want die regel (h1/h2/h3 en de klasse font-display) wint van de
   overerving. */
const nieuweStijl: CSSProperties = {
  "--font-display": "var(--font-outfit)",
  "--font-sans": "var(--font-dmsans)",
  fontFamily: "var(--font-dmsans), system-ui, sans-serif",
} as CSSProperties;

export default function Nieuw6Landing() {
  const fotoBestand = zoekAfbeelding("michael");

  return (
    <div
      className={`flex flex-1 flex-col ${display.variable} ${sans.variable} ${hand.variable}`}
      style={nieuweStijl}
    >
      <Vierde fotoBestand={fotoBestand} />
      <Footer maxWidth="max-w-5xl" />
    </div>
  );
}

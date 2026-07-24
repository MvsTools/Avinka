import { existsSync } from "fs";
import path from "path";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Caveat } from "next/font/google";
import Footer from "@/components/Footer";
import Vierde from "./Vierde";

/* ──────────────────────────────────────────────────────────────────────────
   /nieuw5 — het GEHEEL.

   Kloon van /nieuw4 (film + tools blijven, teksten blijven), maar met één
   samenhangende designtaal eroverheen: de "rode pen × Bahama"-richting.
   Trucje voor "alles hoort bij elkaar": jullie Tailwind v4-tokens verwijzen
   naar CSS-variabelen. Door die variabelen hier op de wrapper te herdefiniëren
   verschuift de HELE pagina in één keer naar de nieuwe letter + het nieuwe
   palet. Losse vormen/achtergronden schaven we daarna sectie voor sectie bij.
   Het echte /nieuw4 (en src/app/page.tsx) blijft onaangeraakt.
   ────────────────────────────────────────────────────────────────────────── */

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument" });
const hand = Caveat({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-hand" });

export const metadata: Metadata = {
  title: "Avinka · één geheel (nieuw5)",
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

/* GROEN BLIJFT de huiskleur (hoort bij het Avinka-vinkje). Het enige dat we
   hier overnemen uit de verkenning is de LETTER die de eigenaar mooi vond
   (Bricolage voor de koppen). De rest van de designtaal — mooie achtergrond,
   overlappende kaartjes, leuke toevoegingen, beweging — brengen we sectie voor
   sectie IN het design zelf, niet door de kleuren om te gooien. */
const nieuweStijl: CSSProperties = {
  "--font-display": "var(--font-bricolage)",
} as CSSProperties;

export default function Nieuw5Landing() {
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

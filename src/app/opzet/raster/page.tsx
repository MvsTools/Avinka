import { existsSync } from "fs";
import path from "path";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Caveat } from "next/font/google";
import Footer from "@/components/Footer";
import Vierde from "../../nieuw5/Vierde";
import RasterBody from "../RasterBody";

/* ── OPZET A · RASTER ─────────────────────────────────────────────────

   De tokens hieronder zetten de oude achtergrondtaal UIT: alle blob-vlakken,
   silhouetten en veldkleuren krijgen dezelfde kleur als hun ondergrond en
   verdwijnen daarmee, ook in de secties die hun eigen beeldwerk houden. Zo is
   het veld vrij voor het nieuwe achtergrondsysteem, zonder dat er in de
   componenten zelf iets is aangepast. De film bovenaan blijft ongewijzigd. */

export const metadata: Metadata = {
  title: "Avinka · opzet Raster",
  description: "Het kolommenraster is de achtergrond; elke sectie klikt erop vast.",
};

/* Bewust dezelfde letters als /nieuw5. Deze twee opzetten gaan over de manier
   van weergeven, niet over de typografie; met een ander letterpaar erbij zou
   je niet meer kunnen zien waar het verschil vandaan komt. */
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument" });
const hand = Caveat({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-hand-bron" });

function zoekAfbeelding(basis: string) {
  const varianten = ["jpg", "jpeg", "png", "webp"].flatMap((ext) => [
    `${basis}.${ext}`,
    `${basis[0].toUpperCase()}${basis.slice(1)}.${ext}`,
  ]);
  return varianten.find((f) => existsSync(path.join(process.cwd(), "public", f)));
}

const TOKENS = {
  "--font-display": "var(--font-bricolage)",
  "--font-hand": "var(--font-hand-bron)",
  /* geen enkele blob meer: de vlakken vallen weg tegen hun ondergrond */
  "--w-vlak-papier": "transparent",
  "--w-vlak-veld": "transparent",
  "--w-vlak-veld-zacht": "transparent",
  "--w-silhouet": "transparent",
  "--w-sier-a": "transparent",
  "--w-sier-b": "transparent",
  /* alles op dezelfde papierkleur: geen kleurvelden en dus geen golven */
  "--w-papier": "#f7f5f0",
  "--w-veld": "#f7f5f0",
  "--w-veld-diep": "#e9e6de",
  /* strak: haarlijnen in plaats van diepte */
  "--w-kaart-radius": "0.5rem",
  "--w-kaart-schaduw": "none",
  "--w-knop-radius": "0.375rem",
  "--w-knop-radius-hover": "0.375rem",
  "--w-kaart-rand": "#ddd9cf",
  "--w-donker": "#16203a",
  "--w-kop": "#28365c",
  "--color-ink": "#16203a",
  "--w-slot": "#16203a",
  "--w-papier-patroon": "none",
} as CSSProperties;

export default function Pagina() {
  return (
    <div
      className={`flex flex-1 flex-col ${display.variable} ${sans.variable} ${hand.variable}`}
      style={TOKENS}
    >
      {(() => {
        const foto = zoekAfbeelding("michael");
        return <Vierde fotoBestand={foto} body={<RasterBody fotoBestand={foto} />} />;
      })()}
      <Footer maxWidth="max-w-5xl" />
    </div>
  );
}

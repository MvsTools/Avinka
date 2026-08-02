import { existsSync } from "fs";
import path from "path";
import type { CSSProperties } from "react";
import Footer from "@/components/Footer";
import Vierde from "../nieuw5/Vierde";
import Wisselaar from "./Wisselaar";
import { LETTERS } from "./letters";
import type { Thema } from "./themas";

/* ── De drager van elke variant ─────────────────────────────────────────────
   Rendert exact dezelfde `Vierde` als /nieuw5 — zelfde secties, zelfde
   volgorde, zelfde teksten, zelfde gedrag. Het enige verschil is de wrapper:
   daar staan de lettervariabelen en de kleur-, vorm- en schaduwtokens van het
   thema op. Alles binnenin leest die variabelen (zie het TOKENS-blok in
   nieuw5/Wereld.tsx), dus de hele pagina verschuift mee zonder dat er ook
   maar één component is aangepast.
   ─────────────────────────────────────────────────────────────────────────── */

function zoekAfbeelding(basis: string) {
  const varianten = ["jpg", "jpeg", "png", "webp"].flatMap((ext) => [
    `${basis}.${ext}`,
    `${basis[0].toUpperCase()}${basis.slice(1)}.${ext}`,
  ]);
  return varianten.find((f) => existsSync(path.join(process.cwd(), "public", f)));
}

export default function ThemaPagina({ thema }: { thema: Thema }) {
  const stijl = {
    /* De pagina hangt aan --font-display / --font-sans / --font-hand; de
       lettervariabelen van next/font heten --t-*, dus hier worden ze aan
       elkaar geknoopt. Zo hoeft er in de componenten niets te veranderen. */
    "--font-display": "var(--t-display)",
    "--font-sans": "var(--t-tekst)",
    "--font-hand": "var(--t-hand)",
    ...thema.tokens,
  } as CSSProperties;

  return (
    <div className={`flex flex-1 flex-col ${LETTERS[thema.id].klassen}`} style={stijl}>
      <Vierde fotoBestand={zoekAfbeelding("michael")} />
      <Footer maxWidth="max-w-5xl" />
      <Wisselaar huidig={thema.id} />
    </div>
  );
}

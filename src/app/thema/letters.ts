import {
  Archivo,
  Architects_Daughter,
  Caveat,
  DM_Sans,
  Epilogue,
  Fraunces,
  Indie_Flower,
  Kalam,
  Manrope,
  Newsreader,
  Outfit,
  Patrick_Hand,
  Public_Sans,
  Space_Grotesk,
  Work_Sans,
} from "next/font/google";
import type { ThemaId } from "./themas";

/* ── De letterparen ─────────────────────────────────────────────────────────
   next/font laadt alleen wat je op moduleniveau aanroept, dus alle vijftien
   families staan hier bij elkaar. Per variant drie rollen:

   - display: de koppen. Bepaalt het karakter het sterkst.
   - tekst: de lopende tekst. Moet op 18px over lange alinea's prettig lezen.
   - hand: de handgeschreven regels die in de inhoud zitten ("privacy voorop",
     "van een leerkracht, voor leerkrachten"). Die tekst verandert niet, dus
     elke variant heeft er een handschrift voor nodig dat bij de rest past.

   De gewichten zijn krap gehouden: de pagina gebruikt alleen normaal, halfvet
   en zwaar. Elk extra gewicht is een bestand dat de bezoeker moet laden.
   ─────────────────────────────────────────────────────────────────────────── */

const fraunces = Fraunces({ subsets: ["latin"], weight: ["600", "700", "900"], variable: "--t-display" });
const publicSans = Public_Sans({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--t-tekst" });

const outfit = Outfit({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--t-display" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--t-tekst" });

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["600", "700"], variable: "--t-display" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "600", "800"], variable: "--t-tekst" });

const epilogue = Epilogue({ subsets: ["latin"], weight: ["700", "800", "900"], variable: "--t-display" });
const workSans = Work_Sans({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--t-tekst" });

const newsreader = Newsreader({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--t-display" });
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--t-tekst" });

const caveat = Caveat({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--t-hand" });
const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"], variable: "--t-hand" });
const architectsDaughter = Architects_Daughter({ subsets: ["latin"], weight: "400", variable: "--t-hand" });
const patrickHand = Patrick_Hand({ subsets: ["latin"], weight: "400", variable: "--t-hand" });
const indieFlower = Indie_Flower({ subsets: ["latin"], weight: "400", variable: "--t-hand" });

export const LETTERS: Record<ThemaId, { klassen: string }> = {
  krijtlijn: { klassen: `${fraunces.variable} ${publicSans.variable} ${caveat.variable}` },
  zonnewarm: { klassen: `${outfit.variable} ${dmSans.variable} ${kalam.variable}` },
  diepbos: { klassen: `${spaceGrotesk.variable} ${manrope.variable} ${architectsDaughter.variable}` },
  riso: { klassen: `${epilogue.variable} ${workSans.variable} ${patrickHand.variable}` },
  botanisch: { klassen: `${newsreader.variable} ${archivo.variable} ${indieFlower.variable}` },
};

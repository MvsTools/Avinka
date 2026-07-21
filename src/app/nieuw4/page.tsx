import { existsSync } from "fs";
import path from "path";
import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import Footer from "@/components/Footer";
import Vierde from "./Vierde";

/* ──────────────────────────────────────────────────────────────────────────
   /nieuw4 — de bundeling.

   Bovenin de filmische opening van v3 (/nieuw3, "Alles op z'n plek"): het
   overvolle scherm van een leerkracht ruimt zichzelf scrollend op tot het
   Avinka-dashboard. Daaronder de body van v2 (/nieuw2): de sticky twijfelbalk
   die meevinkt, met de vijf twijfels en de bewegende UI-secties.

   Wordt vanaf hier stuk voor stuk handmatig bijgeschaafd.
   De echte landingspagina (src/app/page.tsx) blijft onaangeraakt.
   ────────────────────────────────────────────────────────────────────────── */

const handschrift = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-hand",
});

export const metadata: Metadata = {
  title: "Avinka · alles op z'n plek",
  description:
    "Al je schoolwerk staat overal en nergens. Avinka brengt het samen op één eigen werkplek en geeft je elke week zo'n 2 uur terug. Namen van leerlingen blijven thuis.",
};

export default function Nieuw4Landing() {
  // Toont automatisch de foto zodra die in public/ staat; anders een monogram.
  const fotoBestand = ["michael.jpg", "michael.jpeg", "michael.png", "michael.webp"].find(
    (f) => existsSync(path.join(process.cwd(), "public", f)),
  );

  return (
    <div className={`flex flex-1 flex-col ${handschrift.variable}`}>
      <Vierde fotoBestand={fotoBestand} />
      <Footer maxWidth="max-w-5xl" />
    </div>
  );
}

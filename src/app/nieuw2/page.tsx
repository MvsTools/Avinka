import { existsSync } from "fs";
import path from "path";
import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import Footer from "@/components/Footer";
import Lijstjes from "./Lijstjes";

/* ──────────────────────────────────────────────────────────────────────────
   /nieuw2 — landingsconcept "Twee lijstjes".

   Avinka vinkt je taken af. Deze pagina vinkt je twijfels af.

   Korte filmische intro (Mercury-tempo): het papieren takenlijstje van
   vanavond, in avondlicht. Een groene pen zet het eerste vinkje, Avinka
   vinkt de rest, het licht wordt weer dag. Daarna een kalm, leesbaar lijf
   waarin elke sectie één twijfel beantwoordt en afvinkt.

   De bestaande landingspagina (src/app/page.tsx) blijft onaangeraakt.
   ────────────────────────────────────────────────────────────────────────── */

const handschrift = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-hand",
});

export const metadata: Metadata = {
  title: "Avinka — vink je avond af",
  description:
    "Het lijstje van vanavond hoeft niet meer mee naar huis. Avinka geeft leerkrachten elke week 2 uur terug: minder administratie, meer leven. Namen van leerlingen blijven thuis.",
};

export default function Nieuw2Landing() {
  // Toont automatisch de foto zodra die in public/ staat; anders een monogram.
  const fotoBestand = ["michael.jpg", "michael.jpeg", "michael.png", "michael.webp"].find(
    (f) => existsSync(path.join(process.cwd(), "public", f)),
  );

  return (
    <div className={`flex flex-1 flex-col ${handschrift.variable}`}>
      <Lijstjes fotoBestand={fotoBestand} />
      <Footer maxWidth="max-w-5xl" />
    </div>
  );
}

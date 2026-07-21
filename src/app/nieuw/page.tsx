import { existsSync } from "fs";
import path from "path";
import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Film from "./Film";

/* ──────────────────────────────────────────────────────────────────────────
   /nieuw — landingsconcept "De klok draait terug" (verticale plak).
   Eén doorlopende scène: het bureau van een leerkracht om 18:15.
   Scrollen spoelt de tijd terug; het bureau wordt letterlijk leger.
   De bestaande landingspagina (src/app/page.tsx) blijft onaangeraakt.
   Het eerdere concept "De Lijst" is bewaard in git (commit c63e691).
   ────────────────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Avinka — draai de klok terug",
  description:
    "Het is 18:15 en je zit nog op school. Avinka geeft leerkrachten elke week 2 uur terug: minder administratie, meer leven. Namen van leerlingen blijven thuis.",
};

export default function NieuwLanding() {
  // Toont automatisch de foto zodra die in public/ staat; anders een monogram.
  const fotoBestand = ["michael.jpg", "michael.jpeg", "michael.png", "michael.webp"].find(
    (f) => existsSync(path.join(process.cwd(), "public", f)),
  );

  return (
    <div className="flex flex-1 flex-col">
      <Film fotoBestand={fotoBestand} />
      <Footer maxWidth="max-w-5xl" />
    </div>
  );
}

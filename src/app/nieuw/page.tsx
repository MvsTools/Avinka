import { existsSync } from "fs";
import path from "path";
import type { Metadata } from "next";
import Footer from "@/components/Footer";
import DeLijst from "./DeLijst";

/* ──────────────────────────────────────────────────────────────────────────
   /nieuw — herontwerp van de landingspagina (concept "De Lijst").
   De hele pagina is één takenlijst die al scrollend wordt afgevinkt.
   De bestaande landingspagina (src/app/page.tsx) blijft onaangeraakt tot
   de eigenaar akkoord is.
   ────────────────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Avinka — van to-do naar gedaan",
  description:
    "Avinka is de takenlijst die meewerkt: rapporten, toetsanalyse, oudercontact en lesvoorbereiding. Win elke week 2 uur terug.",
};

export default function NieuwLanding() {
  // Toont automatisch de foto zodra die in public/ staat; anders een monogram.
  const fotoBestand = ["michael.jpg", "michael.jpeg", "michael.png", "michael.webp"].find(
    (f) => existsSync(path.join(process.cwd(), "public", f)),
  );

  return (
    <div className="flex flex-1 flex-col">
      <DeLijst fotoBestand={fotoBestand} />
      <Footer maxWidth="max-w-6xl" />
    </div>
  );
}

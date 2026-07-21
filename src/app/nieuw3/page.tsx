import { existsSync } from "fs";
import path from "path";
import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Werkplek from "./Werkplek";

/* ──────────────────────────────────────────────────────────────────────────
   /nieuw3 — landingsconcept "Alles op z'n plek" (v3, Scherm 2).
   Filmische opening: het overvolle scherm van een leerkracht ('s avonds,
   overal vensters en geeltjes). Scrollen ruimt op: elk venster vliegt naar
   zijn plek in het Avinka-dashboard, dat onder je ogen ontstaat. De film
   landt in daglicht op de werkplek zelf; daarna volgt een kalme onderbouw
   met de teksten van de bestaande landingspagina.
   De echte landingspagina (src/app/page.tsx) blijft onaangeraakt.
   ────────────────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Avinka · alles op z'n plek",
  description:
    "Al je schoolwerk staat overal en nergens. Avinka brengt het samen op één eigen werkplek en geeft je elke week zo'n 2 uur terug. Namen van leerlingen blijven thuis.",
};

export default function Nieuw3Landing() {
  // Toont automatisch de foto zodra die in public/ staat; anders een monogram.
  const fotoBestand = ["michael.jpg", "michael.jpeg", "michael.png", "michael.webp"].find(
    (f) => existsSync(path.join(process.cwd(), "public", f)),
  );

  return (
    <div className="flex flex-1 flex-col">
      <Werkplek fotoBestand={fotoBestand} />
      <Footer maxWidth="max-w-5xl" />
    </div>
  );
}

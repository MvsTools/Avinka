import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans, Caveat } from "next/font/google";
import Werkplek from "./Werkplek";

export const metadata: Metadata = {
  title: "Verkenning · De opgeruimde werkplek",
  description: "Proef: Avinka's eigen wereld (papier/planning/nakijken) met het chill-kleurrecept, groen intact.",
};

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-hand" });

export default function WerkplekPage() {
  return (
    <div className={`${bricolage.variable} ${jakarta.variable} ${caveat.variable}`}>
      <Werkplek />
    </div>
  );
}

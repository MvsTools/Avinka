import type { Metadata } from "next";
import { Baloo_2, Hanken_Grotesk, Caveat } from "next/font/google";
import Max from "./Max";

export const metadata: Metadata = {
  title: "Verkenning · max (referentie-palet)",
  description: "Op referentie-niveau gebouwd, met de kleuren van de referentie. Test.",
};

const baloo = Baloo_2({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-baloo" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-caveat" });

export default function MaxPage() {
  return (
    <div className={`${baloo.variable} ${hanken.variable} ${caveat.variable}`}>
      <Max />
    </div>
  );
}

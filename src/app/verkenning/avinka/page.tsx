import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Caveat } from "next/font/google";
import AvinkaStijl from "./AvinkaStijl";

export const metadata: Metadata = {
  title: "Verkenning · De rode pen × Bahama",
  description: "Proef: de rode-pen-richting met Bahama-energie, vertaald naar Avinka.",
};

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument" });
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-caveat" });

export default function AvinkaVerkenningPage() {
  return (
    <div className={`${bricolage.variable} ${sans.variable} ${caveat.variable}`}>
      <AvinkaStijl />
    </div>
  );
}

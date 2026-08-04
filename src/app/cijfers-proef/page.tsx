import type { CSSProperties } from "react";
import { Bricolage_Grotesque, Kalam } from "next/font/google";
import ProefScherm from "./ProefScherm";

/* ⚠️ TIJDELIJKE ROUTE — /cijfers-proef.
   Drie richtingen voor de "Avinka in cijfers"-sectie, zodat de eigenaar ze
   naast elkaar kan zien bewegen. Zodra er één gekozen is verhuist die naar
   src/app/_landing/ en gaan deze map én src/app/_landing/CijfersProef.tsx weg.

   De lettertypes staan hier net zo opgezet als op de echte landing
   (src/app/page.tsx), anders vergelijk je een andere letter dan straks in
   het echt. */

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const hand = Kalam({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-hand" });

const landingStijl: CSSProperties = {
  "--font-display": "var(--font-bricolage)",
} as CSSProperties;

export default function CijfersProefPagina() {
  return (
    <div className={`flex flex-1 flex-col ${display.variable} ${hand.variable}`} style={landingStijl}>
      <ProefScherm />
    </div>
  );
}

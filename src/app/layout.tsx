import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { MAG_GEVONDEN_WORDEN } from "@/lib/zichtbaarheid";

// Warme, karaktervolle serif voor de koppen — straalt vertrouwen en vakmanschap uit.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

// Vriendelijke, heldere sans voor de leestekst — modern en toegankelijk.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Avinka — slimme hulp voor leerkrachten",
  description:
    "Eén plek met slimme tools die je tijd besparen: toetsanalyse, rapportteksten, oudercommunicatie en je klasplattegrond. Gemaakt voor leerkrachten.",
  // Zolang dit een testomgeving is, houden we zoekmachines eruit. Dit is de
  // tweede helft van dezelfde maatregel als src/app/robots.ts: robots.txt is
  // een verzoek, deze regel op de pagina zelf weegt zwaarder.
  // Openzetten met AVINKA_INDEXEREN=ja — zie src/lib/zichtbaarheid.ts.
  robots: MAG_GEVONDEN_WORDEN ? undefined : { index: false, follow: false, nocache: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${fraunces.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        {children}
      </body>
    </html>
  );
}

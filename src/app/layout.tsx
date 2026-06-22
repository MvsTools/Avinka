import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

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

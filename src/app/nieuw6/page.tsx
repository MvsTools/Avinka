import { existsSync } from "fs";
import path from "path";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Kalam } from "next/font/google";
import { createClient } from "@/utils/supabase/server";
import Footer from "@/components/Footer";
import { PLANNEN, heeftBetaaldAbonnement, type PlanId } from "@/lib/abonnement";
import { getAbonnementServer } from "@/lib/abonnement-server";
import Landing from "./_landing/Landing";
import { haalCijfers } from "@/lib/cijfers";

/* ──────────────────────────────────────────────────────────────────────────
   ⚠️ WERKBANK VOOR DE MOBIELE WEERGAVE — TIJDELIJK. NIET DE ECHTE PAGINA.

   Een kopie van de landingspagina (`src/app/page.tsx` + `src/app/_landing/`)
   om de mobiele weergave op te bouwen zónder de bureaubladversie aan te raken.
   Die is volgens de eigenaar af en perfect; daar blijven we van af.

   🔑 DIT IS EEN WERKBANK, GEEN TWEEDE LANDINGSPAGINA. Aan het eind is het
   VERSCHIL tussen deze map en `src/app/_landing/` precies de mobiele fix. Dat
   verschil zetten we over naar het origineel en daarna gaat deze hele map weg.
   Laat nooit twee landingspagina's naast elkaar bestaan: toen
   `components/Prijzen.tsx` ooit werd gekopieerd, erfde de kopie de tekst maar
   niet de latere correcties — en die kopie werd de echte pagina, mét een
   belofte die allang was rechtgezet.

   Twee verschillen met de echte pagina, allebei met opzet:
   1. GEEN doorstuur naar /dashboard voor wie is ingelogd. Op de echte pagina
      gebeurt dat wél (daar is `?startpagina` de uitweg). Hier zou dat alleen
      maar in de weg zitten: wij zijn ingelogd terwijl we aan het bouwen zijn.
   2. De ervaringen-sectie staat hier AAN (zie TOON_ERVARINGEN in
      ./_landing/Landing.tsx). Op de echte pagina staat die uit tot er echte
      quotes zijn, maar voor het mobiele ontwerp moeten we wél de complete
      pagina voor ons hebben — anders richten we een sectie niet in die er bij
      de lancering gewoon staat.
   ────────────────────────────────────────────────────────────────────────── */

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const hand = Kalam({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-hand" });

export const metadata: Metadata = {
  title: "Werkbank mobiel — Avinka",
  // Deze werkbank hoort nooit in een zoekmachine te staan, ook niet per
  // ongeluk. De hele site staat al op noindex, maar dit is de vangriem.
  robots: { index: false, follow: false },
};

const landingStijl: CSSProperties = {
  "--font-display": "var(--font-bricolage)",
} as CSSProperties;

function zoekAfbeelding(basis: string) {
  const varianten = ["jpg", "jpeg", "png", "webp"].flatMap((ext) => [
    `${basis}.${ext}`,
    `${basis[0].toUpperCase()}${basis.slice(1)}.${ext}`,
  ]);
  return varianten.find((f) => existsSync(path.join(process.cwd(), "public", f)));
}

const PLAN_IDS: PlanId[] = PLANNEN.map((p) => p.id);

export default async function MobieleWerkbank({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const abonnement = user ? await getAbonnementServer() : null;
  const huidigPlan =
    PLAN_IDS.find((p) => p === params.plan) ??
    (abonnement && heeftBetaaldAbonnement(abonnement) ? abonnement.plan : null);

  return (
    <div
      className={`flex flex-1 flex-col ${display.variable} ${hand.variable}`}
      style={landingStijl}
    >
      <Landing
        fotoBestand={zoekAfbeelding("michael")}
        ingelogd={Boolean(user)}
        huidigPlan={huidigPlan}
        cijfers={await haalCijfers()}
      />
      <Footer maxWidth="max-w-5xl" />
    </div>
  );
}

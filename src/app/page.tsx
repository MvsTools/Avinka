import { existsSync } from "fs";
import path from "path";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Kalam } from "next/font/google";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Footer from "@/components/Footer";
import { PLANNEN, heeftBetaaldAbonnement, type PlanId } from "@/lib/abonnement";
import { getAbonnementServer } from "@/lib/abonnement-server";
import Landing from "./_landing/Landing";
import { haalCijfers } from "@/lib/cijfers";

/* ──────────────────────────────────────────────────────────────────────────
   DE LANDINGSPAGINA.

   De pagina zelf staat in ./_landing (een private map: de underscore houdt
   hem buiten de routing, zodat er geen route /_landing ontstaat). Dit bestand
   doet alleen het serverwerk dat een landingspagina nodig heeft — wie is de
   bezoeker, mag die de prijzen zien, staat er een foto klaar — en hangt daar
   de letters van de pagina omheen.

   ⚠️ Waarom de letters híér staan en niet in layout.tsx: layout.tsx zet
   --font-sans op <body>, en alles daarbinnen erft de al berekende letter.
   Een --font-* op deze wrapper zetten heeft dus geen effect op de lopende
   tekst; alleen --font-display werkt, omdat de koppen die variabele pas op
   h1/h2/h3 uitlezen. De lopende tekst van de landing is daarom gewoon Plus
   Jakarta, net als de rest van het platform.
   ────────────────────────────────────────────────────────────────────────── */

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
// Het handschrift van "privacy voorop" en "maar het kan slimmer, sneller en
// efficiënter". Kalam loopt breder dan Caveat; wisselt dit ooit, controleer
// dan de regelval van die twee zinnen én de labels op de toolkaarten.
const hand = Kalam({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-hand" });

export const metadata: Metadata = {
  title: "Avinka — win elke week 2 uur terug",
  description:
    "Al je schoolwerk staat overal en nergens. Avinka brengt het samen op één eigen werkplek en geeft je elke week zo'n 2 uur terug. Leerlingnamen gaan nooit mee.",
};

// Groen blijft de huiskleur; het enige dat de landing omzet is de koplettertype.
const landingStijl: CSSProperties = {
  "--font-display": "var(--font-bricolage)",
} as CSSProperties;

// Toont automatisch de foto zodra die in public/ staat; anders een MvS-monogram.
function zoekAfbeelding(basis: string) {
  const varianten = ["jpg", "jpeg", "png", "webp"].flatMap((ext) => [
    `${basis}.${ext}`,
    `${basis[0].toUpperCase()}${basis.slice(1)}.${ext}`,
  ]);
  return varianten.find((f) => existsSync(path.join(process.cwd(), "public", f)));
}

/* De cijfers voor het klapbord ("Samen teruggewonnen").

   Komt uit avinka_landing_cijfers(): een SECURITY DEFINER-functie die alleen
   drie totalen teruggeeft en die anon mag aanroepen. Bewust een eigen, kleine
   functie en niet wijs_community_stats(): die geeft ook de uitsplitsing per
   tool en de streaks terug, en dat hoeft een bezoeker niet te kunnen opvragen.

   Gaat er iets mis, dan geeft dit null terug en laat de sectie zichzelf
   helemaal weg. Een landingspagina die stukloopt op een teller is erger dan
   een landingspagina zonder teller.

   ⚠️ HIER STOND ?cijfers=demo MET DEMO_CIJFERS (77.040 minuten, 37
   leerkrachten, 9.412 uitwerkingen). Weg op 5-8, en niet terugzetten: het was
   een publieke URL waarmee iederéén het cijferbord met VERZONNEN getallen te
   zien kreeg. Op een pagina waar het hele punt van dat bord is dat de cijfers
   echt zijn, is dat het gevaarlijkste soort schakelaar — een screenshot uit
   die stand is niet van een echte te onderscheiden.
   Wil je het ontwerp weer met grote getallen beoordelen, doe dat dan lokaal
   met een tijdelijke waarde in deze functie, niet met een schakelaar die op
   de echte site blijft staan. */

/* De geldige waarden voor ?plan= (zie hieronder). Uit PLANNEN afgeleid en niet
   met de hand overgetikt, zodat een nieuw pakket vanzelf meedoet. */
const PLAN_IDS: PlanId[] = PLANNEN.map((p) => p.id);

/* Het ophalen zelf staat in lib/cijfers.ts, samen met de cache. Die bron wordt
   gedeeld met /api/cijfers, waar de browser elke halve minuut op klopt om het
   bord te laten bijlopen: één implementatie, één cache. */

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ startpagina?: string; plan?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Bekende (ingelogde) bezoeker die de site opent → meteen door naar het
  // dashboard, niet eerst de publieke startpagina. Uitzondering: wie de
  // startpagina bewust bekijkt via het logo (link met ?startpagina) krijgt 'm
  // wél te zien (anders zou hij meteen worden teruggekaatst).
  const params = await searchParams;
  if (user && params.startpagina === undefined) {
    redirect("/dashboard");
  }

  // Welk betaald pakket heeft deze bezoeker? null = uitgelogd, in de proef of
  // verlopen; dan staat de hele prijzensectie gewoon open.
  //
  // ⚠️ Hier stond `toonPrijzen`: wie al betaalde kreeg de prijzensectie
  // helemaal niet te zien. Dat is teruggedraaid — de sectie is er nu altijd en
  // past zich aan (pakketten die je al hebt gaan dicht, hogere pakketten
  // krijgen een upgrade-knop). Zo verandert de pagina niet ongevraagd van vorm
  // en kun je vanaf de voorpagina nog steeds overstappen.
  //
  // Met ?plan=start|compleet|pro bekijk je hoe de sectie er voor zo'n klant
  // uitziet zonder dat je zo'n account nodig hebt. Net als ?cijfers=demo puur
  // om het ontwerp te kunnen beoordelen: het verandert alleen wat je ziet.
  // Toegang tot tools, credits en modellen komt overal elders uit de database
  // en trekt zich hier niets van aan.
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

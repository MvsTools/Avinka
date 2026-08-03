import { existsSync } from "fs";
import path from "path";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Kalam } from "next/font/google";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Footer from "@/components/Footer";
import { heeftBetaaldAbonnement } from "@/lib/abonnement";
import { getAbonnementServer } from "@/lib/abonnement-server";
import Landing from "./_landing/Landing";
import type { Cijfers } from "./_landing/Cijfers";

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

   Met ?cijfers=demo zie je het bord met testgetallen: dat is om het ontwerp te
   kunnen beoordelen, niet iets wat een bezoeker tegenkomt. */
const DEMO_CIJFERS = { minuten: 77_040, leerkrachten: 37, uitwerkingen: 9_412 };

async function haalCijfers(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Cijfers | null> {
  try {
    const { data, error } = await supabase.rpc("avinka_landing_cijfers");
    if (error || !data) return null;
    const d = data as { minuten?: number; leerkrachten?: number; uitwerkingen?: number };
    return {
      minuten: Number(d.minuten ?? 0),
      leerkrachten: Number(d.leerkrachten ?? 0),
      uitwerkingen: Number(d.uitwerkingen ?? 0),
    };
  } catch {
    return null;
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ startpagina?: string; cijfers?: string }>;
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

  // Een ingelogde bezoeker die de startpagina tóch bekijkt: alleen wie al een
  // betaald abonnement heeft, hoeft de prijzen niet meer te zien. Proef- en
  // verlopen accounts wél (zij kunnen nog een plan kiezen).
  const toonPrijzen = user ? !heeftBetaaldAbonnement(await getAbonnementServer()) : true;

  return (
    <div
      className={`flex flex-1 flex-col ${display.variable} ${hand.variable}`}
      style={landingStijl}
    >
      <Landing
        fotoBestand={zoekAfbeelding("michael")}
        ingelogd={Boolean(user)}
        toonPrijzen={toonPrijzen}
        cijfers={params.cijfers === "demo" ? DEMO_CIJFERS : await haalCijfers(supabase)}
      />
      <Footer maxWidth="max-w-5xl" />
    </div>
  );
}

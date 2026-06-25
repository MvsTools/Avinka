import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Geeft de centrale schrijf-voorkeuren van de ingelogde leerkracht terug, zodat
// de tools (Rapporten, Oudercontact, Toetsanalyse) hun velden bij het openen
// automatisch kunnen voorvullen. De leerkracht kan het daarna in de tool zelf
// nog aanpassen — dit is alleen de slimme standaard.
//
// Waarden sluiten exact aan op de bestaande tool-velden:
//   toon          : warm | neutraal | zakelijk
//   taalniveau    : standaard | a2 | b1
//   lengte        : kort | gemiddeld | uitgebreid
//   aanspreekvorm : je | u   (alleen Oudercontact gebruikt dit)
//
// RLS zorgt dat je alleen je eigen instellingen krijgt. Geen sessie/fout → de
// standaarden, zodat de tool altijd gewoon doorwerkt.
const STANDAARD = {
  toon: "warm",
  taalniveau: "standaard",
  lengte: "gemiddeld",
  aanspreekvorm: "je",
  standaardgroep: "",
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(STANDAARD, { status: 401 });
  }

  const { data, error } = await supabase
    .from("instellingen")
    .select("toon, taalniveau, lengte, aanspreekvorm, standaardgroep")
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json(STANDAARD);
  }

  return NextResponse.json({
    toon: data.toon ?? STANDAARD.toon,
    taalniveau: data.taalniveau ?? STANDAARD.taalniveau,
    lengte: data.lengte ?? STANDAARD.lengte,
    aanspreekvorm: data.aanspreekvorm ?? STANDAARD.aanspreekvorm,
    standaardgroep: data.standaardgroep ?? STANDAARD.standaardgroep,
  });
}

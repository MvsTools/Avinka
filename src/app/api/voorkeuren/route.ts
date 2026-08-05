import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Geeft de centrale schrijf-voorkeuren van de ingelogde leerkracht terug, zodat
// de tools (Rapporten, Oudercontact, Toetsanalyse) hun velden bij het openen
// automatisch kunnen voorvullen. De leerkracht kan het daarna in de tool zelf
// nog aanpassen — dit is alleen de slimme standaard.
//
// Waarden sluiten exact aan op de bestaande tool-velden:
//   toon             : warm | neutraal | zakelijk
//   taalniveau       : standaard | a2 | b1
//   lengte           : kort | gemiddeld | uitgebreid
//   aanspreekvorm    : je | u   (alleen Oudercontact gebruikt dit)
//   communicatie_app : '' | parro | social_schools | schoudercom | basisonline | isy
//   communicatie_url : eigen SchouderCom/Isy-webadres (de rest heeft een vast adres)
//   lvs_systeem      : '' | parnassys | esis (voor de "open in je LVS"-knop)
//   lvs_url          : eigen Esis-webadres (ParnasSys heeft één vast adres)
//   toets_systeem    : '' | iep | cito | dia | boom | beide
//   werkdagen        : '' of dagcijfers, 0=maandag t/m 4=vrijdag (bijv. '0134')
//
// RLS zorgt dat je alleen je eigen instellingen krijgt. Geen sessie/fout → de
// standaarden, zodat de tool altijd gewoon doorwerkt.
const STANDAARD = {
  toon: "warm",
  taalniveau: "standaard",
  lengte: "gemiddeld",
  aanspreekvorm: "je",
  standaardgroep: "",
  communicatie_app: "",
  communicatie_url: "",
  lvs_systeem: "",
  lvs_url: "",
  toets_systeem: "",
  werkdagen: "",
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
    .select(
      "toon, taalniveau, lengte, aanspreekvorm, standaardgroep, communicatie_app, communicatie_url, lvs_systeem, lvs_url, toets_systeem, werkdagen"
    )
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
    communicatie_app: data.communicatie_app ?? STANDAARD.communicatie_app,
    communicatie_url: data.communicatie_url ?? STANDAARD.communicatie_url,
    lvs_systeem: data.lvs_systeem ?? STANDAARD.lvs_systeem,
    lvs_url: data.lvs_url ?? STANDAARD.lvs_url,
    toets_systeem: data.toets_systeem ?? STANDAARD.toets_systeem,
    werkdagen: data.werkdagen ?? STANDAARD.werkdagen,
  });
}

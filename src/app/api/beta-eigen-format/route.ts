import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Of dit account de bèta "eigen schoolsjabloon" (Toetsanalyse, IEP en Cito)
// mag zien. Standaard uit: die functie werkt alleen betrouwbaar bij sjablonen
// die van tevoren zijn getest, dus de eigenaar zet 'm per account handmatig
// aan (admin-scherm bij Tools). Geen sessie of geen rij → gewoon uit.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ aan: false });

  const { data } = await supabase
    .from("instellingen")
    .select("beta_eigen_format")
    .maybeSingle();

  return NextResponse.json({ aan: data?.beta_eigen_format === true });
}

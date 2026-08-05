import { createClient } from "@/utils/supabase/server";
import { ververBron } from "@/lib/agenda-opslaan";
import { EIGEN_SYSTEEM } from "@/lib/agenda-eigen";

// Een gekoppelde agenda opnieuw ophalen. Zonder id worden ze allemaal
// bijgewerkt; dat is straks ook wat de nachtelijke verversing gebruikt.

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ fout: "Niet ingelogd." }, { status: 401 });

  let id: string | undefined;
  try {
    id = (await request.json())?.id;
  } catch {
    // geen id meegegeven: dan alles
  }

  let query = supabase
    .from("agenda_bronnen")
    .select("id, naam, link_geheim, modus, systeem")
    .eq("actief", true)
    // Je eigen afspraken hebben niets op te halen. `ververBron` weigert ze ook
    // zelf (daar zit het echte slot), maar dan zou je hier wel een nutteloze
    // foutmelding over je eigen agenda terugkrijgen.
    .neq("systeem", EIGEN_SYSTEEM);
  if (id) query = query.eq("id", id);

  const { data: bronnen, error } = await query;
  if (error) return Response.json({ fout: "Kon je agenda's niet ophalen." }, { status: 500 });
  if (!bronnen?.length) return Response.json({ fout: "Geen agenda gevonden." }, { status: 404 });

  const uitslagen = [];
  for (const bron of bronnen) {
    const uitslag = await ververBron(supabase, bron);
    uitslagen.push({
      id: bron.id,
      naam: bron.naam,
      ...("fout" in uitslag ? { fout: uitslag.fout } : { aantal: uitslag.aantal }),
    });
  }

  return Response.json({ bijgewerkt: uitslagen });
}

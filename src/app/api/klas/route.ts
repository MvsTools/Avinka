import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { haalActieveKlas } from "@/lib/actieve-klas";

// Geeft de klassenlijst van de INGELOGDE leerkracht terug, zodat de tools
// (Plattegrond, Rapporten, Oudercontact) de namen kunnen invullen.
// RLS in de database zorgt dat je alleen je eigen klas krijgt.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Welke groep actief is (eigen klas of een gedeelde die je koos) staat in
  // src/lib/actieve-klas.ts, zodat de Start-pagina exact hetzelfde antwoord
  // krijgt als de tools.
  let data: {
    id: string;
    naam: string;
    leerlingen: string[] | null;
    leerlingen_data: unknown;
  } | null = null;
  try {
    data = await haalActieveKlas(supabase, "id, naam, leerlingen, leerlingen_data");
  } catch {
    // Een lege klas teruggeven zou de tool laten zeggen "je hebt nog geen klas
    // ingevuld", terwijl de klas er gewoon is. Liever een eerlijke fout.
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const namen: string[] = data?.leerlingen ?? [];
  const ruw = data?.leerlingen_data;
  const leerlingenData =
    Array.isArray(ruw) && ruw.length
      ? ruw
      : namen.map((n) => ({ naam: n, geslacht: "" }));

  // Mag je voor DEZE groep rapporten BEWERKEN? Kijk je alleen mee, dan niet:
  // rapporten zijn geschreven oordelen over kinderen en die legt vast wie er
  // ook verantwoordelijk voor is. Lezen mag een meekijker sinds 4-8 wel.
  //
  // De database weigert het schrijven zelf ook (policy "duo-partner rapporten
  // schrijven"), maar zonder dit antwoord merkt de tool dat pas ná het typen
  // van een heel rapport. Nu kan hij het vooraf zeggen.
  let magRapportenBewerken = true;
  if (data?.id) {
    const { data: volledig } = await supabase.rpc("klas_toegang_volledig", {
      p_klas: data.id,
    });
    magRapportenBewerken = volledig === true;
  }

  return NextResponse.json({
    id: data?.id ?? "", // voor tools die een rapport/bestand aan deze klas koppelen (duo-collega's)
    naam: data?.naam ?? "",
    leerlingen: namen, // platte namenlijst — bestaande tools blijven werken
    leerlingenData, // [{naam, geslacht}] — voor tools die hij/zij willen gebruiken
    magRapportenBewerken,
  });
}

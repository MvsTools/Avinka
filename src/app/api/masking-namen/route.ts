import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Geeft ALLE voornamen van de ingelogde leerkracht terug — over al z'n klassen
// heen — als platte, ontdubbelde lijst, plus de schoolnaam uit de instellingen.
//
// Enig doel: de extra maskeringslaag in de tools (public/avinka-masking.js).
// Die vervangt deze namen + de schoolnaam client-side als losse hele woorden
// (hoofdletter-ongevoelig) door codes vóór verzending naar de AI, als vangnet
// bovenop de maskering die elke tool zelf al doet. Zo wordt ook een per ongeluk
// met kleine letter getypte naam ("rik") of de schoolnaam (in een geüpload
// bestand of ergens getypt) nog afgeschermd.
//
// RLS zorgt dat je alleen je eigen gegevens krijgt. Bij geen sessie/fout geven
// we een lege lijst terug (de tool valt dan stil terug op z'n eigen maskering).
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ namen: [], school: "" }, { status: 401 });
  }

  const { data, error } = await supabase.from("klassen").select("leerlingen");
  if (error) {
    return NextResponse.json({ namen: [], school: "" }, { status: 500 });
  }

  const set = new Set<string>();
  for (const rij of data ?? []) {
    const lijst: unknown = (rij as { leerlingen?: unknown }).leerlingen;
    if (!Array.isArray(lijst)) continue;
    for (const n of lijst) {
      const naam = String(n ?? "").trim();
      if (naam.length >= 2) set.add(naam);
    }
  }

  // De schoolnaam meenemen: die moet net als leerlingnamen overal gemaskeerd
  // worden, zodat hij nooit mee naar de AI gaat. Staat in de instellingen-rij
  // (RLS geeft je alleen je eigen rij). Faalt dit, dan simpelweg geen school.
  let school = "";
  try {
    const { data: inst } = await supabase
      .from("instellingen")
      .select("schoolnaam")
      .maybeSingle();
    school = String((inst as { schoolnaam?: string } | null)?.schoolnaam ?? "").trim();
  } catch {
    /* geen schoolnaam beschikbaar → alleen namen maskeren */
  }

  return NextResponse.json({
    namen: [...set],
    school: school.length >= 2 ? school : "",
  });
}

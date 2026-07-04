import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Publieke, read-only weergave van een gedeeld draaiboek via het token.
// Werkt OOK zonder account (anon), dankzij de security-definer functie
// public.gedeeld_draaiboek(token). Is de bezoeker ingelogd én heeft die
// bewerkrecht (eigenaar of uitgenodigd-met-bewerken), dan geven we dat mee
// zodat de leeslink een "Bewerk in Avinka"-knop kan tonen.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const sb = await createClient();
  const { data, error } = await sb.rpc("gedeeld_draaiboek", { p_token: token });
  const row = (Array.isArray(data) ? data[0] : data) as
    | { id: string; naam: string; data: unknown; rol: string }
    | undefined;
  if (error || !row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let kanBewerken = false;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (user) {
    const { data: best } = await sb
      .from("bestanden")
      .select("id, user_id")
      .eq("id", row.id)
      .maybeSingle();
    if (best && (best as { user_id: string }).user_id === user.id) {
      kanBewerken = true;
    } else {
      const email = (user.email || "").toLowerCase();
      if (email) {
        const { data: d } = await sb
          .from("bestand_deling")
          .select("rol")
          .eq("bestand_id", row.id)
          .eq("rol", "bewerken")
          .ilike("gedeeld_email", email)
          .maybeSingle();
        if (d) kanBewerken = true;
      }
    }
  }

  return NextResponse.json({
    naam: row.naam,
    data: row.data,
    rol: row.rol,
    bestandId: row.id,
    kanBewerken,
    ingelogd: !!user,
  });
}

import { createClient } from "@/utils/supabase/server";

// Een seintje in "Wat eraan komt" wegklikken. Geen scherm laat je meer
// vooraf het soort instellen (zie AfspraakFormulier.tsx) — klopt een gok
// een keer niet, dan klik je het seintje hier weg op het moment dat het
// er is. RLS zorgt dat je alleen je eigen id's kunt wegleggen.

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
    /* hieronder afgevangen */
  }
  if (!id || typeof id !== "string") return Response.json({ fout: "Welk seintje?" }, { status: 400 });

  const { error } = await supabase
    .from("aanleiding_genegeerd")
    .upsert({ user_id: user.id, aanleiding_id: id }, { onConflict: "user_id,aanleiding_id" });

  if (error) return Response.json({ fout: "Wegklikken lukte niet." }, { status: 500 });
  return Response.json({ ok: true });
}

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

  // ⚠️ ignoreDuplicates, niet de standaard "merge": een gewone upsert genereert
  // ON CONFLICT ... DO UPDATE, en dat vraagt UPDATE-recht op de tabel — ook al
  // gebeurt er bij een botsing niets. `authenticated` heeft hier alleen
  // select/insert/delete (met opzet, zie migratie), dus een gewone upsert
  // strandde altijd op 403, nog vóór RLS er iets van vond. Updaten is hier
  // ook nooit nodig: nog een keer wegklikken van hetzelfde seintje mag
  // gewoon niets doen.
  const { error } = await supabase
    .from("aanleiding_genegeerd")
    .upsert(
      { user_id: user.id, aanleiding_id: id },
      { onConflict: "user_id,aanleiding_id", ignoreDuplicates: true },
    );

  if (error) return Response.json({ fout: "Wegklikken lukte niet." }, { status: 500 });
  return Response.json({ ok: true });
}

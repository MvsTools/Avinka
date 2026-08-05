import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Voegt één taak toe aan de persoonlijke to-do-lijst van de INGELOGDE leerkracht.
// Gebruikt door tools (o.a. Oudercontact) om een afspraak die de leerkracht zelf
// moet regelen rechtstreeks op de to-do-lijst te zetten. RLS bewaakt de rijen.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let tekst = "";
  let deadline: string | null = null;
  try {
    const body = await req.json();
    tekst = typeof body?.tekst === "string" ? body.tekst.trim() : "";
    // Alleen een kale datum ("2026-08-25"). Mijn schooljaar zet die erbij zodat
    // een voorbereidingstaak op de goede dag in je dagbeeld opduikt.
    if (typeof body?.deadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.deadline)) {
      deadline = body.deadline;
    }
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!tekst) {
    return NextResponse.json({ error: "leeg" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("taken")
    .insert({ user_id: user.id, tekst: tekst.slice(0, 500), ...(deadline ? { deadline } : {}) })
    .select("id, tekst, gedaan, deadline, wekelijks, created_at, gedaan_op")
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, taak: data });
}

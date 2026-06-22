import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Opgeslagen rapportteksten per kind (Rapporten). RLS zorgt dat je alleen
// je eigen rapporten ziet. GET = ophalen, POST = bewaren/bijwerken, DELETE = wissen.
async function ingelogd() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await ingelogd();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await supabase.from("rapporten").select("naam, verhaal");
  return NextResponse.json({ rapporten: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await ingelogd();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { naam?: string; verhaal?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const naam = String(body.naam ?? "").trim();
  const verhaal = String(body.verhaal ?? "");
  if (!naam || !verhaal.trim()) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const { error } = await supabase
    .from("rapporten")
    .upsert({ user_id: user.id, naam, verhaal }, { onConflict: "user_id,naam" });
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const { supabase, user } = await ingelogd();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await supabase.from("rapporten").delete().eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}

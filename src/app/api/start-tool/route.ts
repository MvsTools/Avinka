import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { serviceClient } from "@/lib/supabase-service";
import { toolBySlug } from "@/lib/tools";
import { amsterdamDatum } from "@/lib/streak";

// Zet welke ene tool een Start-abonnee mag gebruiken (`instellingen.start_tool`).
// Dat veld staat achter het fraude-slot (zie database/migratie-fraude-slot.sql:
// alles wat een tool ontgrendelt schrijft de server), dus dit loopt via de
// servicesleutel, niet via de gewone sessie-verbinding.
//
// De kolomcommentaar in schema.sql zei al "max 1×/maand" maar niets hield zich
// daaraan — dat wordt hier voor het eerst echt afgedwongen, tegen wisselen om
// steeds een andere tool tijdelijk te "lenen".
const WACHTDAGEN = 30;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const slug = String(body.slug ?? "").trim();
  if (!toolBySlug(slug)) return NextResponse.json({ error: "onbekende_tool" }, { status: 400 });

  const db = serviceClient();
  if (!db) {
    console.error("[start-tool] SUPABASE_SERVICE_ROLE_KEY ontbreekt");
    return NextResponse.json({ error: "server_niet_klaar" }, { status: 503 });
  }

  const { data: rij, error: leesFout } = await db
    .from("instellingen")
    .select("abon_plan, start_tool, start_tool_sinds")
    .eq("user_id", user.id)
    .maybeSingle();
  if (leesFout) {
    console.error("[start-tool] rij ophalen mislukt:", leesFout.message);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  if (rij?.abon_plan !== "start") {
    return NextResponse.json({ error: "geen_start_pakket" }, { status: 403 });
  }

  const vandaag = amsterdamDatum(new Date());
  const sinds = rij.start_tool_sinds as string | null;
  if (rij.start_tool && sinds) {
    const dagenGeleden = Math.floor(
      (new Date(vandaag).getTime() - new Date(sinds).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (dagenGeleden < WACHTDAGEN) {
      return NextResponse.json(
        {
          error: "te_vroeg",
          dagenTeGaan: WACHTDAGEN - dagenGeleden,
        },
        { status: 429 },
      );
    }
  }

  const { error: schrijfFout } = await db
    .from("instellingen")
    .update({ start_tool: slug, start_tool_sinds: vandaag })
    .eq("user_id", user.id);
  if (schrijfFout) {
    console.error("[start-tool] vastleggen mislukt:", schrijfFout.message);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug });
}

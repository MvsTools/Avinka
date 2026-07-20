import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { ABON_COLS, type AbonnementRow, mapAbonnementRow } from "@/lib/abonnement";
import {
  beginVanDezeMaand,
  KOSTEN_SCHATTING,
  kostenVanRijen,
  limietVoor,
  naarCredits,
  type VerbruikRij,
} from "@/lib/ai-limiet";

// Hoeveel AI-credits heeft dit account deze maand nog over?
//
// Gebruikt door (a) de tools, die vóór een run controleren of er genoeg over
// is, en (b) het instellingenscherm, dat de stand toont. Alleen lezen; de
// echte rem zit in /api/claude.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Admins hebben geen plafond (anders blokkeert de eigenaar zichzelf).
  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminRow) {
    return NextResponse.json({
      onbeperkt: true,
      limiet: null,
      gebruikt: 0,
      resterend: null,
      schatting: KOSTEN_SCHATTING,
    });
  }

  const { data: abonRij } = await supabase
    .from("instellingen")
    .select(ABON_COLS)
    .eq("user_id", user.id)
    .maybeSingle();
  const limietEuro = limietVoor(mapAbonnementRow(abonRij as AbonnementRow | null));

  const { data: verbruik } = await supabase
    .from("ai_verbruik")
    .select(
      "model, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens",
    )
    .eq("user_id", user.id)
    .gte("created_at", beginVanDezeMaand());

  const gebruiktEuro = kostenVanRijen((verbruik ?? []) as VerbruikRij[]);

  const limiet = naarCredits(limietEuro);
  const gebruikt = Math.min(naarCredits(gebruiktEuro), limiet);

  return NextResponse.json({
    onbeperkt: false,
    limiet,
    gebruikt,
    resterend: Math.max(0, limiet - gebruikt),
    schatting: KOSTEN_SCHATTING,
  });
}

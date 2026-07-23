import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isBasisrooster, schooljaarVoor, vandaag } from "@/lib/planning";
import { haalRegio } from "@/lib/planning";

// Je basisrooster bewaren bij je account, per schooljaar. Tot nu toe stond het
// alleen in de browser waarin je het maakte; hiermee is het overal hetzelfde.
//
// Er staan geen leerlingnamen in een rooster: alleen vakken, dagen en tijden.

export async function POST(verzoek: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ fout: "Log eerst in." }, { status: 401 });

  let body: { rooster?: unknown; schooljaar?: unknown };
  try {
    body = await verzoek.json();
  } catch {
    return NextResponse.json({ fout: "Onleesbaar verzoek." }, { status: 400 });
  }

  if (!isBasisrooster(body.rooster)) {
    return NextResponse.json({ fout: "Dit is geen bruikbaar rooster." }, { status: 400 });
  }

  // Zonder opgegeven schooljaar: het jaar waar we nu in zitten.
  const schooljaar =
    typeof body.schooljaar === "string" && /^\d{4}-\d{4}$/.test(body.schooljaar)
      ? body.schooljaar
      : schooljaarVoor(vandaag(), await haalRegio(supabase));

  const { error } = await supabase.from("basisrooster").upsert(
    {
      user_id: user.id,
      schooljaar,
      data: body.rooster,
      bijgewerkt: new Date().toISOString(),
    },
    { onConflict: "user_id,schooljaar" },
  );

  if (error) {
    return NextResponse.json({ fout: "Het rooster kon niet worden bewaard." }, { status: 500 });
  }
  return NextResponse.json({ schooljaar });
}

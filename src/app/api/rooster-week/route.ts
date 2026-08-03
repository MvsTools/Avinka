import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  haalBasisrooster,
  haalRegio,
  isBasisrooster,
  isRoosterWeekData,
  maandagVan,
  schooljaarVoor,
} from "@/lib/planning";

// Eén week die afwijkt van je basisrooster: uitstapje, toetsweek, geruilde dag.
// Je basisrooster blijft ongemoeid; hier staat alleen wat er die ene week
// anders is. Zie database/schema.sql (tabel rooster_week) en
// docs/planning-mijn-schooljaar.md §3.2.

function geldigeMaandag(verzoek: Request): string | null {
  const gevraagd = new URL(verzoek.url).searchParams.get("maandag");
  if (!gevraagd || !/^\d{4}-\d{2}-\d{2}$/.test(gevraagd)) return null;
  return maandagVan(gevraagd);
}

// Het rooster van een specifieke week ophalen. Bestaat er nog geen
// weekafwijking, dan krijg je een kopie van het basisrooster terug: zo begin
// je in de bewerkstand met een vertrouwd startpunt en pas je alleen aan wat
// die week anders is.
export async function GET(verzoek: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ fout: "Log eerst in." }, { status: 401 });

  const maandag = geldigeMaandag(verzoek);
  if (!maandag) return NextResponse.json({ fout: "Ongeldige of ontbrekende datum." }, { status: 400 });

  const schooljaar = schooljaarVoor(maandag, await haalRegio(supabase));
  const basisrooster = await haalBasisrooster(supabase, schooljaar);
  if (!basisrooster) {
    return NextResponse.json(
      { fout: "Je hebt nog geen basisrooster voor dit schooljaar." },
      { status: 400 },
    );
  }

  const { data } = await supabase
    .from("rooster_week")
    .select("data")
    .eq("user_id", user.id)
    .eq("maandag", maandag)
    .maybeSingle();

  const ruw = (data as { data?: unknown } | null)?.data;
  if (isRoosterWeekData(ruw)) {
    return NextResponse.json({
      rooster: { setup: basisrooster.setup, blokken: ruw.blokken },
      overschrijving: true,
    });
  }
  return NextResponse.json({ rooster: basisrooster, overschrijving: false });
}

// De weekafwijking bewaren. We schrijven bewust alleen de blokken weg: een
// weekafwijking krijgt nooit een eigen vakkenlijst/kleuren, die blijven van
// het basisrooster (zie het kolomcommentaar bij rooster_week in schema.sql).
export async function POST(verzoek: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ fout: "Log eerst in." }, { status: 401 });

  let body: { rooster?: unknown; maandag?: unknown };
  try {
    body = await verzoek.json();
  } catch {
    return NextResponse.json({ fout: "Onleesbaar verzoek." }, { status: 400 });
  }

  if (typeof body.maandag !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.maandag)) {
    return NextResponse.json({ fout: "Ongeldige of ontbrekende datum." }, { status: 400 });
  }
  const maandag = maandagVan(body.maandag);

  if (!isBasisrooster(body.rooster)) {
    return NextResponse.json({ fout: "Dit is geen bruikbaar rooster." }, { status: 400 });
  }

  const { error } = await supabase.from("rooster_week").upsert(
    {
      user_id: user.id,
      maandag,
      data: { blokken: body.rooster.blokken },
      bijgewerkt: new Date().toISOString(),
    },
    { onConflict: "user_id,maandag" },
  );

  if (error) {
    return NextResponse.json({ fout: "De weekafwijking kon niet worden bewaard." }, { status: 500 });
  }
  return NextResponse.json({ maandag });
}

// Terugzetten naar basis: de weekafwijking weggooien, zodat die week weer
// gewoon het basisrooster volgt.
export async function DELETE(verzoek: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ fout: "Log eerst in." }, { status: 401 });

  const maandag = geldigeMaandag(verzoek);
  if (!maandag) return NextResponse.json({ fout: "Ongeldige of ontbrekende datum." }, { status: 400 });

  const { error } = await supabase
    .from("rooster_week")
    .delete()
    .eq("user_id", user.id)
    .eq("maandag", maandag);

  if (error) {
    return NextResponse.json({ fout: "Terugzetten naar basis is niet gelukt." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

import { createClient } from "@/utils/supabase/server";
import { veiligAdres } from "@/lib/agenda-ophalen";
import { versleutel, staart } from "@/lib/geheim";
import { ververBron } from "@/lib/agenda-opslaan";

// De gekoppelde agenda's van de ingelogde leerkracht: tonen, koppelen,
// verversen en loskoppelen. De link zelf gaat versleuteld de database in en
// komt hier nooit meer uit; naar buiten tonen we alleen het staartje.

export const runtime = "nodejs";

const SYSTEMEN = ["parro", "socialschools", "outlook", "google", "ics"];

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ fout: "Niet ingelogd." }, { status: 401 });

  const { data, error } = await supabase
    .from("agenda_bronnen")
    .select("id, naam, systeem, modus, kleur, actief, laatst_gelukt, laatste_fout, aantal_items")
    .order("created_at", { ascending: true });
  if (error) return Response.json({ fout: "Kon je agenda's niet ophalen." }, { status: 500 });

  return Response.json({ bronnen: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ fout: "Niet ingelogd." }, { status: 401 });

  let body: { link?: string; naam?: string; systeem?: string; modus?: string } = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ fout: "Geen gegevens ontvangen." }, { status: 400 });
  }

  const gecontroleerd = veiligAdres(body.link ?? "");
  if ("fout" in gecontroleerd) return Response.json({ fout: gecontroleerd.fout }, { status: 400 });

  const systeem = SYSTEMEN.includes(String(body.systeem)) ? String(body.systeem) : "ics";
  const modus = body.modus === "heledagen" ? "heledagen" : "alles";
  const naam = String(body.naam ?? "").trim().slice(0, 60) || "Schoolagenda";

  let link_geheim: string;
  try {
    link_geheim = versleutel(gecontroleerd.url);
  } catch {
    // Liever weigeren dan een sleutel leesbaar wegschrijven.
    return Response.json(
      { fout: "Agendakoppeling is nog niet ingeschakeld op deze server." },
      { status: 503 },
    );
  }

  const { data: bron, error } = await supabase
    .from("agenda_bronnen")
    .insert({ naam, systeem, modus, link_geheim })
    .select("id, link_geheim, modus")
    .single();
  if (error || !bron) {
    return Response.json({ fout: "De agenda kon niet worden opgeslagen." }, { status: 500 });
  }

  const uitslag = await ververBron(supabase, bron);
  if ("fout" in uitslag) {
    // De koppeling blijft staan met de foutmelding erbij, zodat de leerkracht
    // hem kan herstellen in plaats van alles opnieuw te moeten doen.
    return Response.json({ id: bron.id, fout: uitslag.fout }, { status: 400 });
  }

  return Response.json({
    id: bron.id,
    naam,
    systeem,
    modus,
    aantal: uitslag.aantal,
    staart: staart(gecontroleerd.url),
  });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ fout: "Niet ingelogd." }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ fout: "Geen agenda opgegeven." }, { status: 400 });

  // De afspraken verdwijnen mee dankzij de koppeling in de database.
  const { error } = await supabase.from("agenda_bronnen").delete().eq("id", id);
  if (error) return Response.json({ fout: "Loskoppelen is niet gelukt." }, { status: 500 });

  return Response.json({ ok: true });
}

import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verstuurMail } from "@/lib/mail";
import { serviceClient } from "@/lib/supabase-service";
import { uitnodigingHtml, uitnodigingOnderwerp, uitnodigingTekst } from "@/lib/mail-duo";

// Een collega uitnodigen bij een groep, met de uitnodiging per mail.
//
// Waarom dit een SERVERroute is en niet gewoon vanuit het scherm: de
// verzendsleutel mag nooit in de browser komen. En omdat we hier toch zijn,
// maken we de uitnodiging in dezelfde stap aan. Dat scheelt een halve
// toestand waarin er wel een koppelrij staat maar de mail nooit verstuurd is.
//
// De insert loopt via de sessie van de ingelogde gebruiker, dus RLS geldt
// gewoon: je kunt alleen uitnodigen voor een klas die van jou is (zie de
// policy "eigen duo koppel aanmaken" in schema.sql). Dit is geen extra slot
// dat we hier moeten nabouwen.

function maakCode(): string {
  // Zelfde vorm als de bestaande codes: kort, hoofdletters, makkelijk over te
  // typen. Zonder de tekens die je met elkaar verwart (0/O, 1/I).
  const tekens = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += tekens[Math.floor(Math.random() * tekens.length)];
  }
  return code;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { klasId?: string; rol?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const klasId = String(body.klasId ?? "").trim();
  const rol = body.rol === "meekijken" ? "meekijken" : "volledig";
  const email = String(body.email ?? "").trim();

  if (!klasId) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "ongeldig_adres" }, { status: 400 });
  }
  if (email.toLowerCase() === (user.email ?? "").toLowerCase()) {
    // Je eigen uitnodiging accepteren kan toch niet (zie duo_koppel_accepteren),
    // dus dat vangen we hier af met een begrijpelijke melding in plaats van een
    // mail die nergens toe leidt.
    return NextResponse.json({ error: "eigen_adres" }, { status: 400 });
  }

  // Naam van de groep en van de uitnodiger, voor in de mail.
  const { data: klas } = await supabase
    .from("klassen")
    .select("naam")
    .eq("id", klasId)
    .maybeSingle();
  const klasNaam = (klas?.naam ?? "").trim() || "je groep";
  const vanWie = ((user.user_metadata?.first_name as string) ?? "").trim();

  const code = maakCode();
  const { error: insertFout } = await supabase.from("duo_koppels").insert({
    gebruiker_a: user.id,
    klas_id: klasId,
    code,
    rol,
    status: "uitgenodigd",
    uitgenodigd_email: email,
  });
  if (insertFout) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const oorsprong = new URL(request.url).origin;
  const link = `${oorsprong}/dashboard/instellingen?duo=${code}`;

  // Kennen we deze collega al? Dan wordt het "Hallo Marieke," in plaats van
  // "Hallo,". Zo niet, dan is dat geen fout: je nodigt juist vaak iemand uit
  // die nog geen account heeft.
  //
  // ⚠️ ALLEEN SERVER-SIDE, met de servicesleutel. De functie vertelt of een
  // adres een account heeft en hoe die persoon heet; met de sessie van de
  // uitnodiger erop zou iedere gebruiker adressen kunnen aftasten. De uitkomst
  // blijft hier: hij bepaalt alleen de aanhef van een mail die naar dát adres
  // gaat, en gaat nooit terug naar de uitnodiger.
  //
  // Geen servicesleutel of een fout? Dan gewoon geen naam. Een persoonlijke
  // aanhef is een extraatje, geen voorwaarde om te kunnen uitnodigen.
  let voornaam = "";
  const db = serviceClient();
  if (db) {
    const { data: gevonden, error: naamFout } = await db.rpc("wijs_voornaam_van_adres", {
      p_email: email,
    });
    if (naamFout) {
      // Loggen, niet laten struikelen (zie mail-verzendstraat: log bij een
      // mislukte actie ALTIJD de reden, ook als je gewoon doorgaat).
      console.error("voornaam opzoeken mislukt:", naamFout.message);
    } else if (typeof gevonden === "string") {
      voornaam = gevonden;
    }
  }

  const gegevens = { vanWie, klasNaam, link, voornaam };

  const verstuurd = await verstuurMail({
    naar: email,
    onderwerp: uitnodigingOnderwerp(gegevens),
    tekst: uitnodigingTekst(gegevens),
    html: uitnodigingHtml(gegevens),
  });

  if (!verstuurd.ok) {
    // ⚠️ De uitnodiging bestaat nu wel maar is niet verstuurd. Niet weggooien:
    // de link werkt gewoon, dus de eigenaar kan hem alsnog zelf doorsturen.
    // Wel eerlijk melden, mét de code, anders staat er een uitnodiging die
    // niemand kent.
    return NextResponse.json(
      { error: "mail_mislukt", melding: verstuurd.melding, code, link },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, code, link, naar: email });
}

import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verstuurMail } from "@/lib/mail";
import {
  uitnodigingHtml,
  uitnodigingOnderwerp,
  uitnodigingTekst,
  type Uitnodiging,
} from "@/lib/mail-duo";

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
  // `rol` gaat mee zodat de mail zegt wat je straks mag. Zonder dat merkte de
  // eigenaar bij het testen pas dát hij meekijker was toen hij op Rapporten
  // klikte en het daar zag staan.
  // Met het type erbij, anders verbreedt TypeScript "meekijken" | "volledig"
  // tot een gewone string zodra het in dit object belandt.
  const gegevens: Uitnodiging = { vanWie, klasNaam, link, rol };

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

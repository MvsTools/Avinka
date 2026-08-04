import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verstuurMail, SUPPORT } from "@/lib/mail";

// Eén testmail, om te controleren of de verzendstraat werkt en hoe de mail
// beoordeeld wordt.
//
// ⚠️ Alleen voor admins. Een open route die mail verstuurt is een cadeau voor
// wie hem vindt.
//
// ⚠️ Zonder adres gaat de mail naar JEZELF. Een ander adres mag alleen omdat
// een meetdienst als mail-tester.com een wegwerpadres uitdeelt en je anders
// nooit te weten komt waaróm je in de ongewenste map belandt. Dat is bewust
// beperkt tot admins: dit is de enige plek in het platform waar iemand een
// adres kan opgeven dat niet van hemzelf is.
//
// Deze route is een hulpmiddel, geen platformfunctie. Mag weg zodra de echte
// mails draaien.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: isAdmin } = await supabase.rpc("wijs_is_admin");
  if (isAdmin !== true) {
    return NextResponse.json({ error: "geen_admin" }, { status: 403 });
  }

  let naar = user.email;
  try {
    const body = await request.json();
    const gevraagd = String(body?.naar ?? "").trim();
    // Geen sluitende adrescontrole nodig: Resend weigert onzin zelf en de
    // route is toch al afgeschermd. Wel een minimale vorm, zodat een typefout
    // niet als "verstuurd" wordt gemeld.
    if (gevraagd && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(gevraagd)) naar = gevraagd;
  } catch {
    /* geen body meegestuurd: dan naar jezelf */
  }

  const nu = new Date().toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" });
  // ⚠️ De tekst lijkt bewust op een ECHTE mail van het platform en niet op een
  // test. Een onderwerp als "Testmail" en twee regels zonder link zijn voor een
  // spamfilter zelf al een signaal; dan meet je je eigen testopzet in plaats
  // van je verzendstraat.
  const antwoord = await verstuurMail({
    naar,
    onderwerp: "Bevestig je aanmelding bij Avinka",
    antwoordAan: SUPPORT,
    tekst: [
      "Hallo,",
      "",
      "Bedankt voor je aanmelding bij Avinka. Klik op de link hieronder om je",
      "e-mailadres te bevestigen, dan staat je account klaar.",
      "",
      "https://avinka.nl/auth/confirm",
      "",
      "Heb je je niet aangemeld? Dan hoef je niets te doen; zonder bevestiging",
      "gebeurt er niets met dit adres.",
      "",
      "Met vriendelijke groet,",
      "Michael van Spanje",
      "Avinka",
      "",
      `(Proefbericht, verstuurd op ${nu}.)`,
    ].join("\n"),
  });

  if (!antwoord.ok) {
    return NextResponse.json({ error: antwoord.melding }, { status: 500 });
  }
  return NextResponse.json({ ok: true, naar, id: antwoord.id });
}

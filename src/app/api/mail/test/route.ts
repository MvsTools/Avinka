import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verstuurMail } from "@/lib/mail";

// Eén testmail naar JEZELF, om te controleren of de verzendstraat werkt.
//
// ⚠️ Twee sloten, en allebei met opzet:
// 1. Je moet ingelogd zijn én admin. Een open route die mail verstuurt is een
//    cadeau voor wie hem vindt.
// 2. Hij stuurt ALTIJD naar het adres van wie is ingelogd, nooit naar een
//    adres uit het verzoek. Ook als het eerste slot ooit zou wegvallen, kan
//    niemand deze route gebruiken om een ander te mailen.
//
// Deze route is een hulpmiddel, geen platformfunctie. Mag weg zodra de echte
// mails draaien.
export async function POST() {
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

  const nu = new Date().toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" });
  const antwoord = await verstuurMail({
    naar: user.email,
    onderwerp: "Testmail vanuit Avinka",
    tekst: [
      "Deze mail komt uit het Avinka-platform.",
      "",
      `Verstuurd op ${nu}.`,
      "",
      "Zie je dit bericht, dan werkt de verzendstraat: het domein is",
      "geverifieerd, de sleutel klopt en de mail komt vanaf avinka.nl.",
    ].join("\n"),
  });

  if (!antwoord.ok) {
    return NextResponse.json({ error: antwoord.melding }, { status: 500 });
  }
  return NextResponse.json({ ok: true, naar: user.email, id: antwoord.id });
}

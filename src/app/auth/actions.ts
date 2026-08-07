"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { VOORWAARDEN, PRIVACY } from "@/lib/juridisch";
import { veiligIntern } from "@/lib/paden";
import { isWegwerpAdres } from "@/lib/email-normaliseren";

// Het resultaat dat de formulieren tonen (foutmelding of bevestiging).
// `email` staat er alleen bij na een geslaagde registratie: het wachtscherm
// toont het adres én heeft het nodig om de mail opnieuw te kunnen sturen.
// `opnieuwNa` is het tijdstip (epoch ms) waarop de knop "stuur opnieuw" weer
// vrijkomt. Bewust een tijdstip en geen aantal seconden: het scherm kan er dan
// zelf uit afleiden hoeveel er nog over is, zonder een teller bij te houden die
// uit de pas kan lopen met de werkelijkheid.
export type AuthState = {
  error?: string;
  message?: string;
  email?: string;
  opnieuwNa?: number;
};

// Vertaalt de Engelse Supabase-meldingen naar begrijpelijk Nederlands.
function nlFout(bericht: string): string {
  const b = bericht.toLowerCase();
  if (b.includes("invalid login credentials"))
    return "E-mailadres of wachtwoord klopt niet.";
  if (b.includes("email not confirmed"))
    return "Bevestig eerst je e-mailadres via de link in je mail.";
  if (b.includes("user already registered") || b.includes("already been registered"))
    return "Er bestaat al een account met dit e-mailadres. Log in.";
  if (b.includes("password should be at least"))
    return "Kies een wachtwoord van minstens 6 tekens.";
  if (b.includes("unable to validate email") || b.includes("invalid email"))
    return "Vul een geldig e-mailadres in.";
  if (b.includes("different from the old password"))
    return "Kies een nieuw wachtwoord dat anders is dan je huidige.";
  if (b.includes("for security purposes") || b.includes("rate limit"))
    return "Even geduld — je hebt dit net al geprobeerd. Wacht een minuutje en probeer opnieuw.";
  // Onbekende Supabase-melding: de gebruiker krijgt een nette generieke tekst,
  // maar de echte reden mag niet verloren gaan — anders is dit soort fout
  // straks niet meer te herleiden (zie mail-verzendstraat: altijd de reden loggen).
  console.error("Onvertaalde auth-fout van Supabase:", bericht);
  return "Er ging iets mis. Probeer het zo nog eens.";
}

// Waar gaan we heen ná het inloggen? Standaard het dashboard, maar een
// uitnodigingslink wil je vasthouden (zie AuthCard). `veiligIntern` houdt
// tegen dat dit veld naar een vreemde site kan wijzen.
function veiligeVolgende(waarde: FormDataEntryValue | null): string {
  return veiligIntern(waarde == null ? null : String(waarde));
}

// "marieke" / "MARIEKE" -> "Marieke", "anne-marie" -> "Anne-Marie". Dit is de
// enige plek waar first_name wordt vastgelegd; alle andere plekken (dashboard-
// begroeting, duo-uitnodiging, Mollie-checkout, de aanmeldmail) lezen 'm alleen.
function metHoofdletter(naam: string): string {
  return naam.toLowerCase().replace(/(^|[\s-])\p{L}/gu, (m) => m.toUpperCase());
}

// INLOGGEN — bij succes door naar het dashboard (of naar `volgende`).
export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const volgende = veiligeVolgende(formData.get("volgende"));

  if (!email || !password) {
    return { error: "Vul je e-mailadres en wachtwoord in." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: nlFout(error.message) };
  }

  revalidatePath("/", "layout");
  redirect(volgende);
}

// REGISTREREN — stuurt een bevestigingsmail; account is pas actief na bevestiging.
export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const voornaam = metHoofdletter(String(formData.get("voornaam") ?? "").trim());
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const akkoord = formData.get("akkoord");
  const volgende = veiligeVolgende(formData.get("volgende"));

  if (!voornaam || !email || !password) {
    return { error: "Vul je naam, e-mailadres en wachtwoord in." };
  }
  if (password.length < 6) {
    return { error: "Kies een wachtwoord van minstens 6 tekens." };
  }
  /* Wegwerpadressen (postvakken die na een uur weer weg zijn) weren we hier,
     met een gewone zin in plaats van een verwijt. Dit is een drempeltje, geen
     slot: de echte rem op herhaalde gratis weken is dat een proef weinig waard
     is (CREDITS_PER_PLAN) en dat één brievenbus er maar één krijgt
     (database/migratie-proef-per-brievenbus.sql). */
  if (isWegwerpAdres(email)) {
    return {
      error:
        "Dit lijkt een tijdelijk mailadres. Gebruik je schoolmail of je eigen adres — je hebt het nodig om je account te bevestigen.",
    };
  }
  // Akkoord op voorwaarden + privacy is verplicht (ook server-side gecontroleerd,
  // zodat het niet te omzeilen is door de checkbox uit te schakelen).
  if (!akkoord) {
    return {
      error: "Ga akkoord met de voorwaarden en de privacyverklaring om door te gaan.",
    };
  }

  // Bouw de absolute terugkeer-URL voor de bevestigingslink in de mail.
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host") ?? ""}`;

  // Leg het akkoord vast: welke versies van voorwaarden + privacy, en wanneer.
  // Deze metadata reist mee met de accountaanmaak; een database-trigger kopieert
  // ze naar de append-only bewijstabel `toestemmingen` (AVG-verantwoording).
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: voornaam,
        voorwaarden_versie: VOORWAARDEN.versie,
        privacy_versie: PRIVACY.versie,
        akkoord_op: new Date().toISOString(),
        akkoord_bron: "registratie",
      },
      // De bevestigingslink houdt de bestemming vast, zodat een uitnodiging
      // een mailbevestiging kan overleven.
      emailRedirectTo:
        volgende === "/dashboard"
          ? `${origin}/auth/confirm`
          : `${origin}/auth/confirm?next=${encodeURIComponent(volgende)}`,
    },
  });

  if (error) {
    return { error: nlFout(error.message) };
  }

  // Staat e-mailbevestiging UIT, dan is de gebruiker meteen ingelogd → dashboard.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect(volgende);
  }

  // Staat bevestiging AAN, dan moet de gebruiker eerst de mail bevestigen.
  // Het adres gaat mee: het wachtscherm toont het, en de knop "stuur opnieuw"
  // heeft het nodig.
  return { message: "verstuurd", email };
}

// BEVESTIGINGSMAIL OPNIEUW STUREN — vanaf het wachtscherm, voor wie niets
// binnenkreeg. Belangrijk genoeg om apart te bestaan: op een schoolmailadres
// sneuvelt deze mail geregeld in een filter waar de gebruiker zelf niet bij kan
// (zie docs/supabase-mail-instellingen.md), en zonder deze knop is de enige
// uitweg opnieuw registreren — wat niet kan, want het account bestaat al.
export async function bevestigingOpnieuw(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const volgende = veiligeVolgende(formData.get("volgende"));

  if (!email) {
    return { error: "We weten niet naar welk adres we moeten sturen. Meld je opnieuw aan." };
  }

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host") ?? ""}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      // Zelfde bestemming als bij het aanmelden, anders raakt een uitnodiging
      // alsnog kwijt bij wie de tweede mail gebruikt.
      emailRedirectTo:
        volgende === "/dashboard"
          ? `${origin}/auth/confirm`
          : `${origin}/auth/confirm?next=${encodeURIComponent(volgende)}`,
    },
  });

  if (error) {
    // De reden altijd loggen — anders is een mislukte verzending later niet te
    // herleiden (zelfde les als bij de 535-storing, zie mail-verzendstraat).
    console.error("Bevestigingsmail opnieuw sturen mislukte:", error.message);
    return { error: nlFout(error.message) };
  }

  // Een minuut op slot. Supabase heeft zelf ook een snelheidsgrens; deze
  // wachttijd houdt de gebruiker daar weg, want díé foutmelding helpt niemand.
  return { message: "opnieuw", opnieuwNa: Date.now() + 60_000 };
}

// WACHTWOORD VERGETEN — stuurt een herstelmail (als het account bestaat).
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Vul je e-mailadres in." };
  }

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host") ?? ""}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/nieuw-wachtwoord`,
  });

  // Bij een fout tonen we toch dezelfde melding: zo verraden we niet of een
  // e-mailadres wel of niet bij ons bekend is (privacy + veiligheid).
  if (error) {
    console.error("resetPasswordForEmail:", error.message);
  }

  return {
    message:
      "Als er een account bij dit e-mailadres hoort, hebben we je een mail gestuurd om een nieuw wachtwoord in te stellen.",
  };
}

// NIEUW WACHTWOORD OPSLAAN — kan alleen met een geldige herstelsessie
// (de gebruiker komt hier via de link uit de herstelmail).
export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) {
    return { error: "Kies een wachtwoord van minstens 6 tekens." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "Je herstellink is verlopen. Vraag hieronder een nieuwe aan.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: nlFout(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// UITLOGGEN — wist de sessie en stuurt terug naar de startpagina.
export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";

// Het resultaat dat de formulieren tonen (foutmelding of bevestiging).
export type AuthState = { error?: string; message?: string };

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
  return "Er ging iets mis. Probeer het zo nog eens.";
}

// INLOGGEN — bij succes door naar het dashboard.
export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Vul je e-mailadres en wachtwoord in." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: nlFout(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// REGISTREREN — stuurt een bevestigingsmail; account is pas actief na bevestiging.
export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const voornaam = String(formData.get("voornaam") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const akkoord = formData.get("akkoord");

  if (!voornaam || !email || !password) {
    return { error: "Vul je naam, e-mailadres en wachtwoord in." };
  }
  if (password.length < 6) {
    return { error: "Kies een wachtwoord van minstens 6 tekens." };
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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: voornaam },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    return { error: nlFout(error.message) };
  }

  // Staat e-mailbevestiging UIT, dan is de gebruiker meteen ingelogd → dashboard.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  // Staat bevestiging AAN, dan moet de gebruiker eerst de mail bevestigen.
  return {
    message:
      "Bijna klaar! We hebben je een mail gestuurd. Klik op de link daarin om je account te bevestigen.",
  };
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

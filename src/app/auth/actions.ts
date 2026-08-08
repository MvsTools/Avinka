"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { VOORWAARDEN, PRIVACY } from "@/lib/juridisch";
import { veiligIntern } from "@/lib/paden";
import { HERSTEL_ADRES_COOKIE } from "@/lib/herstel";
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

// Supabase stuurt hoogstens één auth-mail per minuut naar hetzelfde adres
// (SMTP max frequency, standaard 60s). Die grens geldt per ADRES, niet per
// knop: de mail van het aanmelden telt dus mee. Daarom rekent zowel signup()
// als bevestigingOpnieuw() met deze waarde, anders klikt iemand vlak na zijn
// registratie op "opnieuw sturen" en krijgt hij een weigering te zien.
// ⚠️ Staat de grens in het Supabase-dashboard anders, pas hem hier ook aan.
const MAIL_INTERVAL_MS = 60_000;

// Vertaalt de Engelse Supabase-meldingen naar begrijpelijk Nederlands.
function nlFout(bericht: string): string {
  const b = bericht.toLowerCase();
  if (b.includes("invalid login credentials"))
    return "E-mailadres of wachtwoord klopt niet.";
  // ⚠️ Er zit sinds 8-8 geen link meer in de aanmeldmail maar een code. Deze
  // tekst is een vangnet: normaal stuurt login() zo iemand meteen door naar
  // /bevestigen in plaats van deze melding te tonen.
  if (b.includes("email not confirmed"))
    return "Je e-mailadres is nog niet bevestigd. Vul de code uit je mail in.";
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
  if (b.includes("token has expired") || b.includes("invalid token") || b.includes("otp"))
    return "Deze code klopt niet of is verlopen. Vraag hieronder een nieuwe aan.";
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
    // Nog niet bevestigd? Dan is een foutmelding een doodlopende weg: opnieuw
    // aanmelden kan niet (het account bestaat al) en het wachtscherm met het
    // codeveld is weg. Stuur deze persoon meteen naar de plek waar hij het
    // alsnog kan afmaken, mét de mogelijkheid een nieuwe code aan te vragen.
    // ⚠️ Dit verraadt niets nieuws: de oude foutmelding zei ook al dat het
    // adres bekend maar onbevestigd was.
    if (error.message.toLowerCase().includes("email not confirmed")) {
      redirect(`/bevestigen?email=${encodeURIComponent(email)}&reden=onbevestigd`);
    }
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

  // 🔴 BESTAAT DIT ADRES AL? Dan doet Supabase met opzet alsof het gelukt is:
  // hij maakt niets aan en verstuurt niets, maar geeft wél succes terug. Dat is
  // een beveiliging — zou hij "dit adres bestaat al" zeggen, dan kan een vreemde
  // uitvinden of iemand een Avinka-account heeft.
  //
  // ⚠️ Zonder het onderstaande is dat een DOODLOPENDE WEG: je belandt op het
  // wachtscherm en wacht op een code die nooit komt. Dat overkwam de eigenaar
  // 8-8 zelf, en die weet hoe het werkt; een leerkracht haakt hier af.
  //
  // Herkennen kan aan een lege `identities`-lijst: dat is Supabase' manier om
  // het tóch door te geven aan de app zonder het aan de bezoeker te vertellen.
  // Wij kiezen ervoor het wél te zeggen. Dat verraadt dat een adres bekend is,
  // maar het alternatief kost je een gebruiker die niets fout deed — en de app
  // zegt het elders al ("Er bestaat al een account met dit e-mailadres").
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    redirect("/sign-in?fout=bestaat-al");
  }

  // Staat e-mailbevestiging UIT, dan is de gebruiker meteen ingelogd → dashboard.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect(volgende);
  }

  // Staat bevestiging AAN, dan moet de gebruiker eerst de mail bevestigen.
  // Het adres gaat mee: het wachtscherm toont het, en de knop "stuur opnieuw"
  // heeft het nodig. De teller start hier al — er is zojuist een mail de deur
  // uit gegaan, dus die minuut loopt vanaf nu.
  return { message: "verstuurd", email, opnieuwNa: Date.now() + MAIL_INTERVAL_MS };
}

// AANMELDING BEVESTIGEN MET EEN CODE UIT DE MAIL.
//
// 🔑 WAAROM EEN CODE EN GEEN LINK (besloten 8-8-2026, na meten op de echte site)
// Schoolbesturen draaien Microsoft Defender met "Safe Links": élke link in élke
// binnenkomende mail wordt herschreven naar een adres van Microsoft, en Microsoft
// haalt hem eerst zélf op om te controleren of hij veilig is. Bij een eenmalige
// bevestigingslink is het kaartje daarmee al gebruikt vóórdat de leerkracht
// klikt. Dat verklaarde óók de vertraging van minuten: dat controleren kost tijd.
// Een code is niets om op te klikken en dus niets om op te gebruiken.
// Tweede winst: je blijft in het tabblad waar je je aanmeldde, in plaats van in
// een nieuw venster te belanden (op mobiel vaak zelfs binnen de mail-app).
// Zie [[mail-verzendstraat]]. ⚠️ De herstelmail houdt bewust wél een link: daar
// verwacht iedereen er een, en dat probleem pakken we apart aan.
export async function bevestigMetCode(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  // Spaties eruit: mensen plakken de code geregeld mét de ruimte die ze in de
  // mail zien, of typen er zelf een.
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  const volgende = veiligeVolgende(formData.get("volgende"));

  if (!email || !code) {
    return { error: "Vul je e-mailadres en de code uit de mail in.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "signup",
  });

  if (error) {
    // De reden altijd loggen, anders is een mislukte bevestiging later niet te
    // herleiden (zelfde les als bij de 535-storing).
    console.error("Bevestigen met code mislukte:", error.message);
    return { error: nlFout(error.message), email };
  }

  revalidatePath("/", "layout");
  redirect(volgende);
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

  return { message: "opnieuw", opnieuwNa: Date.now() + MAIL_INTERVAL_MS };
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

  // Het adres onthouden voor het scherm waar het nieuwe wachtwoord wordt
  // gekozen. Dat scherm kan het namelijk nergens anders vandaan halen: er is op
  // dat moment nog geen sessie, en uit het token valt geen adres af te leiden.
  // 🔑 Het staat er niet alleen om te tonen: een wachtwoordbeheerder heeft een
  // gebruikersnaam nodig om het nieuwe wachtwoord aan het juiste account te
  // koppelen. Zonder dat veld slaat hij het los of onder de verkeerde site op.
  // Een uur geldig, net als het token zelf. Opent iemand de mail op een ander
  // apparaat, dan is er geen cookie en laat dat scherm het veld gewoon weg.
  const koekjes = await cookies();
  koekjes.set(HERSTEL_ADRES_COOKIE, email, {
    maxAge: 60 * 60,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return {
    message:
      "Als er een account bij dit e-mailadres hoort, hebben we je een mail gestuurd. Reken op een paar minuten voordat hij binnen is.",
  };
}

// NIEUW WACHTWOORD OPSLAAN.
//
// 🔑 HIER WORDT HET TOKEN UIT DE HERSTELMAIL INGEWISSELD (8-8-2026)
// Dat gebeurde vroeger al zodra de link werd geopend, en dat is precies wat
// misgaat bij scholen met Microsoft Safe Links: Microsoft haalt élke link in een
// binnenkomende mail eerst zélf op om hem te controleren, en een eenmalig token
// is daarmee opgebruikt vóórdat de leerkracht klikt. Nu doet het openen van het
// scherm niets en gebeurt het inwisselen pas bij het VERSTUREN van dit
// formulier. Een scanner opent pagina's, maar vult geen wachtwoorden in.
// Zo werkt het bij de meeste grote partijen ook. Zie [[mail-verzendstraat]].
//
// Twee manieren om hier te komen, allebei geldig:
//   1. mét `token_hash` uit de mail en nog géén sessie (de gewone route)
//   2. met een bestaande sessie, zonder token (iemand die al ingelogd is)
export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const herhaling = String(formData.get("password2") ?? "");
  const token_hash = String(formData.get("token_hash") ?? "");
  if (password.length < 6) {
    return { error: "Kies een wachtwoord van minstens 6 tekens." };
  }
  // Het scherm controleert dit ook al terwijl je typt. Hier stáát het omdat een
  // controle in de browser geen controle is: dit is de plek die het echt afdwingt.
  if (password !== herhaling) {
    return { error: "De twee wachtwoorden zijn niet gelijk." };
  }

  const supabase = await createClient();
  let {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && token_hash) {
    const { data, error } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash,
    });
    if (error) {
      console.error("Herstel-token inwisselen mislukte:", error.message);
      // ⚠️ nlFout() kent hier de juiste tekst niet: Supabase zegt bij een
      // opgebruikte link "Email link is invalid or has expired", en dat matcht
      // geen van zijn patronen → dan zou hier "Er ging iets mis" staan terwijl
      // we precies weten wat er aan de hand is. En de tekst van nlFout gaat over
      // een códe ("Deze code klopt niet"), wat hier het verkeerde woord is.
      const b = error.message.toLowerCase();
      const verlopen =
        b.includes("expired") || b.includes("invalid") || b.includes("not found");
      return {
        error: verlopen
          ? "Deze herstellink is verlopen of al gebruikt."
          : nlFout(error.message),
      };
    }
    // GEEN FOUT MAAR OOK GEEN SESSIE. Blijf hierop toetsen: "er kwam geen fout
    // terug" is niet hetzelfde als "er is een sessie". `verifyOtp` bewaart een
    // sessie alleen als er een access_token in het antwoord zit, dus zonder deze
    // toets zou iemand dóórgaan zonder sessie en pas veel later merken dat er
    // niets is opgeslagen.
    //
    // 🔑 De `pkce_`-vraag is hiermee BEANTWOORD (8-8-2026, echte test op
    // schoolmail): `resetPasswordForEmail` stuurt een code_challenge mee omdat
    // @supabase/ssr standaard op flowType 'pkce' staat, en het token in de mail
    // begint dus met `pkce_` — maar POST /verify slikt dat gewoon en geeft een
    // sessie terug. Er hoeft géén code-uitwisseling bijgebouwd te worden.
    // Fijne bijkomstigheid: `verifyOtp` raakt de code-verifier niet aan, dus dit
    // werkt óók als de mail op een ander apparaat wordt geopend dan waar het
    // herstel is aangevraagd.
    if (!data.session) {
      console.error("Herstel-token gaf geen fout maar ook geen sessie");
      return { error: "Deze herstellink werkte niet." };
    }
    user = data.session.user;
  }

  // "hieronder" stond hier vroeger, maar de knop om een nieuwe aan te vragen
  // staat in de melding zelf, niet eronder.
  if (!user) {
    return { error: "Deze herstellink is verlopen of al gebruikt." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: nlFout(error.message) };
  }

  // Het onthouden adres heeft zijn werk gedaan; laat het niet rondslingeren op
  // wat een gedeelde schoolcomputer kan zijn.
  (await cookies()).delete(HERSTEL_ADRES_COOKIE);

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

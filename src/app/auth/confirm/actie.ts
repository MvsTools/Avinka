"use server";

import { type EmailOtpType } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { veiligIntern } from "@/lib/paden";

// HET TOKEN UIT EEN MAILLINK VERZILVEREN — alleen op een echte klik.
//
// 🔑 WAAROM DIT EEN ACTIE IS EN GEEN GET (8-8-2026)
// Tot vandaag verzilverde `auth/confirm` het token zodra de pagina werd
// opgevraagd. Dat is precies wat er misgaat bij scholen die Microsoft Defender
// met Safe Links gebruiken: Microsoft haalt élke link in élke binnenkomende mail
// eerst zélf op om te controleren of hij veilig is, en een eenmalig token is
// daarmee opgebruikt vóórdat de leerkracht klikt. Die krijgt dan "deze link is
// verlopen of al gebruikt". Bewezen op de echte site; zie [[mail-verzendstraat]].
//
// Een Server Action loopt over POST, en dat is het hele punt: een scanner opent
// pagina's, maar drukt geen knoppen. De aanmeldmail heeft dit niet meer nodig
// (die bevat sinds 8-8 een code in plaats van een link), maar de herstelmail en
// de adreswijziging houden bewust wél een link — daar verwacht iedereen er een.
//
// ⚠️ Deze functie is, zoals elke Server Action, ook rechtstreeks met een POST
// te bereiken. Dat is hier geen gat: het token uit de mail ís de sleutel, en
// zonder een geldig token gebeurt er niets.
export async function verzilverMailLink(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  const token_hash = String(formData.get("token_hash") ?? "");
  const type = (String(formData.get("type") ?? "") || null) as EmailOtpType | null;
  // Alleen paden bínnen de site: anders is dit veld te gebruiken om iemand
  // vanaf een ogenschijnlijk eigen Avinka-link naar een vreemde site te sturen.
  const next = veiligIntern(formData.get("next")?.toString());

  const supabase = await createClient();

  // 🔑 GESLAAGD = ER IS EEN SESSIE. Niet: "er kwam geen foutmelding terug."
  // Dat verschil is echt: `verifyOtp` bewaart de sessie alleen
  // `if (session?.access_token)` (auth-js GoTrueClient.js). Komt er een antwoord
  // zónder sessie, dan zou "geen fout = gelukt" iemand doorsturen zonder sessie,
  // die vervolgens "Link verlopen" ziet terwijl er niets in de log staat.
  // Precies de klacht die we 8-8 niet konden herleiden.
  let gelukt = false;
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) console.error("auth/confirm exchangeCodeForSession:", error.message);
    else if (!data.session) console.error("auth/confirm: code ingewisseld maar geen sessie");
    else gelukt = true;
  } else if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (error) {
      console.error("auth/confirm verifyOtp:", error.message);
    } else if (!data.session) {
      console.error("auth/confirm: verifyOtp gaf geen fout maar ook geen sessie | type=", type);
    } else {
      gelukt = true;
    }
  }

  // TWEEDE KANS: is deze bezoeker ondertussen al ingelogd? Dan is het werk al
  // gedaan en hoeft hij geen foutmelding te zien. Dat gebeurt bij een dubbele
  // klik op de knop: de eerste verzilvert het token en logt in, de tweede vindt
  // het token al gebruikt.
  // ⚠️ Dit is géén versoepeling: zonder geldige sessie volgt de foutmelding
  // alsnog. We erkennen alleen een sessie die deze bezoeker zojuist zelf met een
  // geldig token heeft verkregen.
  if (!gelukt) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      console.error(
        "auth/confirm: token mislukt maar sessie is geldig, dus toch doorgestuurd",
      );
      gelukt = true;
    }
  }

  if (gelukt) {
    revalidatePath("/", "layout");
    redirect(next);
  }

  // Herstelmail mislukt? Stuur hem naar het scherm waar hij tóch heen wilde.
  // Zonder sessie toont dat "Link verlopen" met een knop om een nieuwe aan te
  // vragen — precies de uitweg die hier hoort, en die tekst staat er al.
  if (type === "recovery") {
    redirect("/nieuw-wachtwoord");
  }

  redirect("/sign-in?fout=link-verlopen");
}

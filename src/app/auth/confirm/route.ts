import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { veiligIntern } from "@/lib/paden";

// Hierheen komt de gebruiker via de link in een bevestigings- of herstelmail.
// We wisselen de code/token uit voor een echte sessie en sturen door.
// Werkt met beide soorten Supabase-links:
//   - ?code=...                       (standaard-mailtemplate)
//   - ?token_hash=...&type=...        (aangepaste mailtemplate)
//
// 🔑 WAAROM HIER EEN TWEEDE KANS IN ZIT (7-8-2026, gemeten op de echte site)
// Eén klik op een mail-link levert TWEE aanvragen op, ongeveer een seconde uit
// elkaar. De eerste verzilvert het token en logt netjes in; de tweede vindt het
// token dan al gebruikt en kreeg vroeger een foutmelding. En laat dát nou net
// het antwoord zijn dat de gebruiker op zijn scherm zag: "deze link is verlopen
// of al gebruikt", terwijl hij in werkelijkheid gewoon was ingelogd.
// Vandaar: mislukt het verzilveren, kijk dan eerst of er al een geldige sessie
// is. Zo ja, dan is het werk al gedaan en sturen we hem gewoon door.
// ⚠️ Dit is géén versoepeling van de beveiliging: zonder geldige sessie krijg je
// nog steeds de foutmelding. We erkennen alleen een sessie die deze bezoeker
// zojuist zelf met een geldig token heeft verkregen.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Alleen paden bínnen de site: `new URL(next, …)` zou een volledig adres
  // ("https://…") gewoon overnemen, en dan is deze route te gebruiken om
  // mensen vanuit een ogenschijnlijk eigen link naar een vreemde site te
  // sturen. Alles wat geen intern pad is valt terug op het dashboard.
  const next = veiligIntern(searchParams.get("next"));

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    console.error("auth/confirm exchangeCodeForSession:", error.message);
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    console.error("auth/confirm verifyOtp:", error.message);
  }

  // Tweede kans: is deze bezoeker ondertussen al ingelogd? Dan was het de
  // dubbele aanvraag hierboven en hoeft hij geen foutmelding te zien.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    console.error(
      "auth/confirm: token mislukt maar sessie is geldig, dus toch doorgestuurd",
    );
    return NextResponse.redirect(new URL(next, request.url));
  }

  // ⏳ TIJDELIJK, om de dubbele aanvraag te kunnen herleiden. Hiermee zien we in
  // de Vercel-logs of die tweede aanvraag van dezelfde browser komt of van iets
  // anders (een mailscanner, een vooruitlader). Weghalen zodra dat duidelijk is.
  console.error(
    "auth/confirm MISLUKT |",
    "type=", type ?? "(geen)",
    "| ua=", request.headers.get("user-agent")?.slice(0, 120) ?? "(geen)",
    "| x-forwarded-for=", request.headers.get("x-forwarded-for") ?? "(geen)",
  );

  // Link ongeldig of verlopen: terug naar inloggen met een nette melding.
  return NextResponse.redirect(
    new URL("/sign-in?fout=link-verlopen", request.url),
  );
}

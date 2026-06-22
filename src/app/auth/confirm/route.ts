import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Hierheen komt de gebruiker via de link in een bevestigings- of herstelmail.
// We wisselen de code/token uit voor een echte sessie en sturen door.
// Werkt met beide soorten Supabase-links:
//   - ?code=...                       (standaard-mailtemplate)
//   - ?token_hash=...&type=...        (aangepaste mailtemplate)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }

  // Link ongeldig of verlopen: terug naar inloggen met een nette melding.
  return NextResponse.redirect(
    new URL("/sign-in?fout=link-verlopen", request.url),
  );
}

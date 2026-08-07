/* De code uit de bevestigingsmail.

   ⚠️ De lengte is een INSTELLING van Supabase, niet iets van ons:
   Authentication → Providers → Email → "Email OTP Length". Bij ons staat hij op
   8. Verander je hem daar, pas dan CODE_LENGTE hier aan.

   🔑 Maar het veld is er bewust niet strikt op gebouwd. Toen dit op 6 stond en
   Supabase 8 stuurde, kapte het invoerveld de laatste twee cijfers af en kon
   niemand bevestigen — zonder dat er iets fout leek te gaan. Daarom: tot
   CODE_MAX mag je typen, en vanaf CODE_MIN mag je op Bevestigen drukken. Staat
   de instelling ooit anders, dan werkt het nog steeds; hoogstens ziet de
   plaatshouder er dan even naast uit. */
export const CODE_LENGTE = 8;

/** Ruim genoeg voor elke stand van de Supabase-instelling (die gaat tot 10). */
export const CODE_MAX = 10;

/** Vanaf hier mag je op Bevestigen drukken. Supabase' kortste stand is 6. */
export const CODE_MIN = 6;

/** De plaatshouder in het veld: net zoveel nullen als de code lang is. */
export const CODE_PLAATSHOUDER = "0".repeat(CODE_LENGTE);

/* Alles wat geen cijfer is eruit. Mensen plakken de code geregeld mét de ruimte
   die ze in de mail zien, of met een spatie die hun mailprogramma erin heeft
   gezet. Dat mag nooit de reden zijn dat bevestigen mislukt. */
export function alleenCijfers(waarde: string): string {
  return waarde.replace(/\D/g, "").slice(0, CODE_MAX);
}

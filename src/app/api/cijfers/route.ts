import { NextResponse } from "next/server";
import { CIJFERS_CACHE_SECONDEN, haalCijfers } from "@/lib/cijfers";

/* Waar het klapbord op de voorpagina elke halve minuut op klopt.

   Openbaar en zonder inlog, want het zijn geaggregeerde totalen zonder iets
   over een individuele gebruiker. De zware kant (de databasequery) zit achter
   de cache in haalCijfers(); deze route zelf is dus goedkoop, ook als er veel
   bezoekers tegelijk kijken.

   Geeft 204 terug als er geen cijfers zijn. Dan weet de browser dat er niets
   te tonen valt zonder dat we een leeg of nul-getal hoeven te verzinnen. */
export async function GET() {
  const cijfers = await haalCijfers();
  if (!cijfers) return new NextResponse(null, { status: 204 });

  return NextResponse.json(cijfers, {
    headers: {
      /* Ook tussenliggende caches mogen dit even vasthouden; het is voor
         iedereen hetzelfde antwoord. */
      "Cache-Control": `public, max-age=0, s-maxage=${CIJFERS_CACHE_SECONDEN}, stale-while-revalidate=60`,
    },
  });
}

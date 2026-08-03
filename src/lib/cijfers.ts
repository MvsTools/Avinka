/* ── De gemeenschapscijfers voor het klapbord op de voorpagina ──────────────
   Eén bron voor twee plekken: de serverrendering van de landingspagina
   (src/app/page.tsx) en de route waar de browser elke halve minuut op klopt
   (src/app/api/cijfers/route.ts).

   🔑 WAAROM DIT VIA fetch GAAT EN NIET VIA DE SUPABASE-CLIENT
   De gewone serverclient leest cookies, en dan is elk verzoek per definitie
   uniek en valt er niets te cachen. Deze aanroep heeft geen cookies nodig (het
   zijn publieke totalen), dus met een kale fetch kan Next het antwoord
   CENTRAAL bewaren: `next: { revalidate: ... }` betekent dat de database
   hooguit twee keer per minuut wordt bevraagd, of er nu één bezoeker is of
   duizend. Zonder die cache zou elke bezoeker die op de pagina blijft staan
   elke 30 seconden een eigen databasequery veroorzaken.

   ⚠️ BEWUST GEEN Supabase Realtime op de tabel `statistiek`. Realtime stuurt
   de gewijzigde RIJ mee naar de client, en die rij bevat de tellers van één
   individuele gebruiker. Voor een publieke pagina is dat een lek. Alleen het
   geaggregeerde functie-antwoord mag naar buiten.
   ────────────────────────────────────────────────────────────────────────── */

export type Cijfers = {
  /* werkelijk bespaarde minuten over alle gebruikers heen */
  minuten: number;
  leerkrachten: number;
  uitwerkingen: number;
};

/* Hoe lang het antwoord centraal bewaard blijft. Het bord verspringt pas als
   er een hele schooldag (7,5 uur) bij komt, dus vaker dan dit ophalen levert
   nooit een ander getal op. */
export const CIJFERS_CACHE_SECONDEN = 30;

export async function haalCijfers(): Promise<Cijfers | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sleutel = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !sleutel) return null;

  try {
    const antwoord = await fetch(`${url}/rest/v1/rpc/avinka_landing_cijfers`, {
      method: "POST",
      headers: {
        apikey: sleutel,
        Authorization: `Bearer ${sleutel}`,
        "Content-Type": "application/json",
      },
      body: "{}",
      next: { revalidate: CIJFERS_CACHE_SECONDEN },
    });
    if (!antwoord.ok) return null;
    const d = (await antwoord.json()) as {
      minuten?: number;
      leerkrachten?: number;
      uitwerkingen?: number;
    };
    return {
      minuten: Number(d.minuten ?? 0),
      leerkrachten: Number(d.leerkrachten ?? 0),
      uitwerkingen: Number(d.uitwerkingen ?? 0),
    };
  } catch {
    /* Een landingspagina die stukloopt op een teller is erger dan een
       landingspagina zonder teller. */
    return null;
  }
}

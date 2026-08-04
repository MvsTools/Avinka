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

/* ⚠️ WAT DEZE DRIE GETALLEN PRECIES BETEKENEN — niet raden, dit is besloten.
   Ze komen uit avinka_landing_cijfers() en tellen ALLE accounts die ooit iets
   in een tool hebben afgerond, ongeacht hun abonnement: proef, actief,
   opgezegd en verlopen tellen allemaal mee. Er bestaat namelijk pas een rij in
   `statistiek` zodra iemand echt iets gedáán heeft, dus het is "leerkrachten
   die Avinka gebruikt hebben", niet "aanmeldingen" en niet "abonnees".

   Die keuze past bij elkaar: de uren zijn óók van alle tijd, dus "37
   leerkrachten hebben samen 1.284 uur bespaard" is een ware zin.

   ADMIN-ACCOUNTS TELLEN NIET MEE, in alle drie de getallen. Anders staat de
   eigenaar zelf als leerkracht op zijn eigen voorpagina, en zouden er uren in
   het totaal zitten van iemand die niet bij het aantal leerkrachten is
   meegeteld. Overwogen en niet gekozen: alleen betalende abonnementen (dan
   staat het tijdens de proefgroep op nul) en alleen recent actieven (dan slaan
   de uren en de leerkrachten op verschillende periodes). */
export type Cijfers = {
  /* werkelijk bespaarde minuten over alle meetellende gebruikers heen */
  minuten: number;
  /* accounts die ooit een actie afrondden, zonder admins */
  leerkrachten: number;
  /* afgeronde acties over alle tools heen ("keer afgevinkt" op de landing) */
  uitwerkingen: number;
};

/* Hoe lang het antwoord centraal bewaard blijft. Het rapport verspringt pas
   als er een heel uur bij komt, dus vaker ophalen levert nooit een ander getal
   op. (Hier stond nog "een hele schooldag van 7,5 uur"; die eenheid is
   vervangen door het uur.) */
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

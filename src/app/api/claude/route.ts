import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  ABON_COLS,
  type AbonnementRow,
  BETALINGEN_LIVE,
  heeftToegang,
  magToolGebruiken,
  mapAbonnementRow,
  modelVoor,
} from "@/lib/abonnement";
import { aanbiederVoor } from "@/lib/ai-providers";
import { bevatNaam, namenRegex } from "@/lib/namen-vangnet";
import {
  beginVanDezeMaand,
  limietMelding,
  limietVoor,
  verbruikInCredits,
  type VerbruikRij,
} from "@/lib/ai-limiet";

// De beveiligde AI-route van het platform. Vervangt de oude Netlify-proxy:
// - controleert dat de gebruiker is INGELOGD (vervangt het wachtwoordscherm);
// - voegt de geheime Anthropic-sleutel server-side toe (staat alleen hier, in .env);
// - stuurt het verzoek ongewijzigd door (zodat o.a. prompt-caching blijft werken);
// - logt alleen GEBRUIKSMETADATA (tokens, model, tool) voor het admin-kosten-
//   overzicht — nooit de inhoud (geen prompt/antwoord, geen leerlinggegevens).

// Haalt de tool-naam uit de Referer (de pagina vanwaar de call komt), bijv.
// "/tools/rapporten.html" → "rapporten". Null als onbekend.
function toolUitReferer(referer: string | null): string | null {
  if (!referer) return null;
  const m = referer.match(/\/tools\/([a-z0-9-]+)\.html/i);
  return m ? m[1].toLowerCase() : null;
}

// Waar komt deze aanvraag vandaan? De losse tools verraden zichzelf via de
// Referer, maar AI-knoppen in het dashboard zelf (zoals bij de overdracht)
// staan allemaal op /dashboard. Die noemen hun naam daarom expliciet, anders
// belanden ze als "onbekend" in het kostenoverzicht. Alleen als naam
// bruikbaar: kleine letters, cijfers en streepjes, kort — het is gebruikers-
// invoer en het gaat rechtstreeks de database in.
function toolVan(request: NextRequest): string | null {
  const eigen = request.headers.get("x-avinka-tool");
  if (eigen && /^[a-z0-9-]{1,40}$/.test(eigen)) return eigen;
  return toolUitReferer(request.headers.get("referer"));
}
export async function POST(request: NextRequest) {
  // 1) Alleen ingelogde leerkrachten mogen de AI gebruiken.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 1b) KOSTENPLAFOND. Telt op wat dit account deze kalendermaand aan AI heeft
  //     verbruikt en stopt boven de grens van het pakket (zie lib/ai-limiet.ts).
  //     Drie bewuste keuzes:
  //     - Geldt OOK als betalingen nog niet live zijn: in de testfase betaalt
  //       de eigenaar de rekening, dus juist dán is een rem nodig.
  //     - Admins zijn vrijgesteld, anders loopt de eigenaar bij het bouwen en
  //       testen zelf tegen zijn eigen plafond aan.
  //     - Gaat de telling om wat voor reden dan ook mis, dan laten we de
  //       aanvraag DOOR. Een betalende leerkracht mag nooit stilvallen door
  //       een hapering in onze eigen boekhouding.
  try {
    const { data: adminRow } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRow) {
      const { data: abonRij } = await supabase
        .from("instellingen")
        .select(ABON_COLS)
        .eq("user_id", user.id)
        .maybeSingle();
      const limiet = limietVoor(mapAbonnementRow(abonRij as AbonnementRow | null));

      const { data: verbruik } = await supabase
        .from("ai_verbruik")
        .select(
          "model, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens",
        )
        .eq("user_id", user.id)
        .gte("created_at", beginVanDezeMaand());

      if (verbruik && verbruikInCredits(verbruik as VerbruikRij[]) >= limiet) {
        // Bewust GEEN 429: de tools vertalen die status zelf naar "het is even
        // druk", en dat zou hier een onjuiste boodschap zijn. Met 402 tonen ze
        // de tekst hieronder letterlijk.
        return NextResponse.json(
          { error: { type: "limiet_bereikt", message: limietMelding(limiet) } },
          { status: 402 },
        );
      }
    }
  } catch {
    /* telling mislukt → doorlaten, nooit een gebruiker blokkeren op een fout */
  }

  // 1c) TOEGANG PER PAKKET — de motor, niet de deur.
  //     De proxy houdt de PAGINA's al tegen (src/utils/supabase/middleware.ts),
  //     maar dit is waar het werk gebeurt. Zonder deze controle kon een
  //     Start-klant de tools van een duurder pakket buiten het scherm om alsnog
  //     laten draaien, en bleef een verlopen proef gewoon antwoord krijgen: in
  //     de browser word je weggestuurd, de API deed het nog.
  //
  //     Alleen actief als betalingen live zijn — in de testfase mag iedereen
  //     alles, net als overal elders.
  //
  //     ⚠️ Lukt het lezen van de abonnementsstand niet, dan laten we DOOR.
  //     Dezelfde keuze als bij het kostenplafond hierboven: een betalende
  //     leerkracht mag nooit stilvallen door een hapering bij ons.
  if (BETALINGEN_LIVE) {
    try {
      const { data: abonRij } = await supabase
        .from("instellingen")
        .select(ABON_COLS)
        .eq("user_id", user.id)
        .maybeSingle();
      if (abonRij) {
        const ab = mapAbonnementRow(abonRij as AbonnementRow | null);
        // 402 en niet 429: de tools tonen de tekst bij 402 letterlijk, terwijl
        // 429 bij hen "het is even druk" betekent. Dat zou hier onwaar zijn.
        if (!heeftToegang(ab)) {
          return NextResponse.json(
            {
              error: {
                type: "geen_toegang",
                message:
                  "Je gratis proefperiode is voorbij. Kies een abonnement om verder te werken.",
              },
            },
            { status: 402 },
          );
        }
        // Bij een onbekende tool laten we door: we weten dan niet wat we zouden
        // weigeren. Het kostenplafond blijft de rem die daar overheen ligt.
        const tool = toolVan(request);
        if (tool && !magToolGebruiken(ab, tool)) {
          return NextResponse.json(
            {
              error: {
                type: "tool_niet_in_pakket",
                message:
                  "Deze tool hoort niet bij jouw abonnement. Bekijk je abonnement om alle tools te gebruiken.",
              },
            },
            { status: 402 },
          );
        }
      }
    } catch {
      /* stand onbekend → doorlaten, nooit blokkeren op onze eigen fout */
    }
  }

  // 2) Het verzoek inlezen.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // 2b) AI-modeltier afdwingen (alleen als betalingen live zijn). Het juiste
  //     model per pakket wordt server-side gezet — een Start-klant kan dus geen
  //     duurder model afdwingen. Zolang BETALINGEN_LIVE uit staat gebeurt er
  //     niets en houdt elke tool zijn eigen model (de testfase).
  if (BETALINGEN_LIVE && body && typeof body === "object") {
    const { data: abonRow } = await supabase
      .from("instellingen")
      .select(ABON_COLS)
      .eq("user_id", user.id)
      .maybeSingle();
    const model = modelVoor(mapAbonnementRow(abonRow as AbonnementRow | null));
    if (model) (body as Record<string, unknown>).model = model;
  }

  // 2b-bis) HET NAMENVANGNET — de laatste controle vóór er iets de deur uitgaat.
  //     Zie src/lib/namen-vangnet.ts voor het waarom. Kort: de belofte "namen
  //     gaan nooit naar de AI" hing tot nu toe volledig aan de browser. Dit is
  //     de enige laag die niet kapot kan gaan doordat er in een tool iets misgaat.
  //
  //     Het gaat alleen af als de maskering vóór dit punt heeft gefaald: werkt
  //     die, dan staan er codes (KN-001) in de tekst en vindt dit niets.
  //
  //     ⚠️ Bij een LEESFOUT laten we door, met een logregel. Dezelfde afweging
  //     als bij het kostenplafond en de pakketcontrole hierboven: een leerkracht
  //     midden in de rapportweek mag niet stilvallen door een hapering van ons.
  //     Er zijn dan twee dingen tegelijk stuk (de browserlaag én onze database)
  //     en Anthropic heeft een verwerkersovereenkomst met zero data retention.
  //     Vind je dat te ruim, dan is dít de regel die je omdraait.
  try {
    const { data: klasRijen } = await supabase.from("klassen").select("leerlingen");
    const namen: string[] = [];
    for (const rij of klasRijen ?? []) {
      const lijst: unknown = (rij as { leerlingen?: unknown }).leerlingen;
      if (Array.isArray(lijst)) for (const n of lijst) namen.push(String(n ?? ""));
    }
    const re = namenRegex(namen);
    if (bevatNaam(JSON.stringify(body ?? ""), re)) {
      // Nooit de naam zelf loggen — dat is precies het gegeven dat we beschermen.
      console.error(
        `namenvangnet: opdracht geweigerd, er stond een leerlingnaam in (tool: ${toolVan(request) ?? "onbekend"})`,
      );
      return NextResponse.json(
        {
          error: {
            type: "naam_in_opdracht",
            message:
              "Er staat een naam uit je klas in deze opdracht. Avinka stuurt namen van kinderen nooit naar de AI, dus we hebben dit tegengehouden. Ververs de pagina en probeer het opnieuw; blijft het gebeuren, laat het ons dan weten.",
          },
        },
        { status: 422 },
      );
    }
  } catch {
    console.error("namenvangnet: klassenlijst niet te lezen, opdracht doorgelaten");
  }

  // 2c) Welke AI-aanbieder hoort bij deze gebruiker? Vandaag krijgt iedereen
  //     Claude (de kolom `ai_provider` bestaat misschien nog niet, of staat
  //     leeg). Lukt de lookup niet, dan valt aanbiederVoor() terug op de
  //     standaard (Claude) — zo verandert er nu niets aan de werking.
  let aiProvider: string | null = null;
  try {
    const { data: provRow } = await supabase
      .from("instellingen")
      .select("ai_provider")
      .eq("user_id", user.id)
      .maybeSingle();
    aiProvider = (provRow as { ai_provider?: string | null } | null)?.ai_provider ?? null;
  } catch {
    /* kolom bestaat (nog) niet of leesfout → standaard-aanbieder (Claude) */
  }
  const aanbieder = aanbiederVoor(aiProvider);

  // 3) De geheime sleutel van de gekozen aanbieder (alleen op de server bekend).
  const key = process.env[aanbieder.envSleutel];
  if (!key) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  // 4) Doorsturen naar de aanbieder. Voor Claude is dit exact als voorheen:
  //    body ongewijzigd, dezelfde headers.
  const verzoek = aanbieder.bouwVerzoek(body, key);
  let upstream: Response;
  try {
    upstream = await fetch(verzoek.url, {
      method: "POST",
      headers: verzoek.headers,
      body: verzoek.body,
    });
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }

  // 5) Het ruwe antwoord ophalen en naar het tool-formaat vertalen. Voor
  //    Claude is dat ongewijzigd; een andere aanbieder zet zijn antwoord om.
  const ruw = await upstream.text();
  const text = aanbieder.vertaalAntwoord(ruw);

  // 5b) Gebruiksmetadata loggen (alleen tokens/model/tool — nooit de inhoud).
  //     Mag de respons nooit vertragen of breken: in een try/catch.
  if (upstream.ok) {
    try {
      const v = aanbieder.leesVerbruik(ruw);
      if (v) {
        await supabase.from("ai_verbruik").insert({
          user_id: user.id,
          tool: toolVan(request),
          model: v.model,
          input_tokens: v.input_tokens,
          output_tokens: v.output_tokens,
          cache_creation_tokens: v.cache_creation_tokens,
          cache_read_tokens: v.cache_read_tokens,
        });
      }
    } catch {
      /* logging is bijzaak — nooit de AI-respons laten falen */
    }
  }

  return new NextResponse(text, {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
}

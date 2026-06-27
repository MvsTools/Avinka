import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  ABON_COLS,
  type AbonnementRow,
  BETALINGEN_LIVE,
  mapAbonnementRow,
  modelVoor,
} from "@/lib/abonnement";
import { aanbiederVoor } from "@/lib/ai-providers";

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
export async function POST(request: NextRequest) {
  // 1) Alleen ingelogde leerkrachten mogen de AI gebruiken.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
          tool: toolUitReferer(request.headers.get("referer")),
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

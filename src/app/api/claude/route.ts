import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  ABON_COLS,
  type AbonnementRow,
  BETALINGEN_LIVE,
  mapAbonnementRow,
  modelVoor,
} from "@/lib/abonnement";

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

  // 3) De geheime sleutel (alleen op de server bekend).
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  // 4) Doorsturen naar Anthropic.
  let upstream: Response;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }

  // 5) Het antwoord van Anthropic ongewijzigd teruggeven.
  const text = await upstream.text();

  // 5b) Gebruiksmetadata loggen (alleen tokens/model/tool — nooit de inhoud).
  //     Mag de respons nooit vertragen of breken: in een try/catch.
  if (upstream.ok) {
    try {
      const parsed = JSON.parse(text) as {
        model?: string;
        usage?: {
          input_tokens?: number;
          output_tokens?: number;
          cache_creation_input_tokens?: number;
          cache_read_input_tokens?: number;
        };
      };
      const u = parsed?.usage;
      if (u) {
        await supabase.from("ai_verbruik").insert({
          user_id: user.id,
          tool: toolUitReferer(request.headers.get("referer")),
          model: parsed?.model ?? null,
          input_tokens: u.input_tokens ?? 0,
          output_tokens: u.output_tokens ?? 0,
          cache_creation_tokens: u.cache_creation_input_tokens ?? 0,
          cache_read_tokens: u.cache_read_input_tokens ?? 0,
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

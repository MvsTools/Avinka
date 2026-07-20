import { createClient } from "@/utils/supabase/server";
import { ABON_COLS, type AbonnementRow, mapAbonnementRow } from "@/lib/abonnement";
import {
  beginVanDezeMaand,
  kostenVanRijen,
  limietVoor,
  naarCredits,
  type VerbruikRij,
} from "@/lib/ai-limiet";

// Toont hoeveel AI-credits dit account deze maand nog over heeft.
//
// We tonen bewust CREDITS en geen euro's: een leerkracht hoeft onze
// inkoopprijs niet te kennen, en zo kunnen we de waarde per credit bijstellen
// zonder dat het getal op het scherm verspringt.
export default async function AiCredits() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: abonRij } = await supabase
    .from("instellingen")
    .select(ABON_COLS)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: verbruik } = await supabase
    .from("ai_verbruik")
    .select(
      "model, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens",
    )
    .eq("user_id", user.id)
    .gte("created_at", beginVanDezeMaand());

  const limiet = naarCredits(
    limietVoor(mapAbonnementRow(abonRij as AbonnementRow | null)),
  );
  const gebruikt = Math.min(
    naarCredits(kostenVanRijen((verbruik ?? []) as VerbruikRij[])),
    limiet,
  );
  const resterend = Math.max(0, limiet - gebruikt);
  const deel = limiet > 0 ? Math.min(100, (gebruikt / limiet) * 100) : 0;

  // De eerste van de volgende maand, in gewone taal.
  const nu = new Date();
  const volgende = new Date(nu.getFullYear(), nu.getMonth() + 1, 1);
  const wanneer = volgende.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
  });

  const bijnaOp = !adminRow && resterend <= limiet * 0.15;

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="text-lg font-bold text-ink">AI-gebruik deze maand</h2>
      <p className="mt-2 text-sm text-ink/65">
        Elke keer dat een tool iets voor je schrijft, kost dat een paar credits. Op{" "}
        {wanneer} staat je tegoed er weer op.
      </p>

      {adminRow ? (
        <p className="mt-5 rounded-2xl bg-cream px-4 py-3 text-sm text-ink/70">
          Dit account heeft geen limiet.
        </p>
      ) : (
        <>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-ink">
              {resterend}
            </span>
            <span className="text-ink/60">
              van de {limiet} credits over
            </span>
          </div>

          <div
            className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-black/[0.07]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={limiet}
            aria-valuenow={resterend}
            aria-label="Resterende AI-credits deze maand"
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${deel}%`,
                background: bijnaOp ? "#b45309" : "#25855a",
              }}
            />
          </div>

          <p className="mt-3 text-sm text-ink/55">
            {bijnaOp
              ? "Je credits raken op. Heb je er eerder meer nodig? Neem gerust contact op."
              : "Ruim voldoende voor een normale maand."}
          </p>
        </>
      )}
    </div>
  );
}

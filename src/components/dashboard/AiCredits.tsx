import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import {
  ABON_COLS,
  type AbonnementRow,
  CREDITS_PER_PLAN,
  mapAbonnementRow,
  planById,
  proefLoopt,
} from "@/lib/abonnement";
import {
  beginVanDezeMaand,
  limietVoor,
  verbruikInCredits,
  type VerbruikRij,
} from "@/lib/ai-limiet";

// "Verbruik" — altijd zichtbaar in de instellingen: de balk, het aantal
// credits en wanneer het tegoed weer wordt bijgevuld. De aantallen komen uit
// CREDITS_PER_PLAN (abonnement.ts), dezelfde bron als de pakketkaartjes.
//
// Het blok met de vervolgstap verschijnt pas als het tegoed echt op raakt.
// Iemand met een eigen account komt daar vrijwel nooit; die hoeft er dus ook
// niet elke maand aan herinnerd te worden.
const DREMPEL_VERVOLGSTAP = 70; // procent

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

  const abon = mapAbonnementRow(abonRij as AbonnementRow | null);
  const limiet = limietVoor(abon);
  const gebruikt = Math.min(
    verbruikInCredits((verbruik ?? []) as VerbruikRij[]),
    limiet,
  );
  const resterend = Math.max(0, limiet - gebruikt);
  const procent = limiet > 0 ? Math.round((gebruikt / limiet) * 100) : 0;

  const planNaam = proefLoopt(abon)
    ? "Gratis proefperiode"
    : (planById(abon.plan)?.naam ?? "Gratis proefperiode");

  // Wanneer wordt het tegoed weer bijgevuld? Altijd de 1e van de maand erna.
  const nu = new Date();
  const reset = new Date(nu.getFullYear(), nu.getMonth() + 1, 1);
  const resetTekst = reset.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
  });

  const bijnaOp = procent >= DREMPEL_VERVOLGSTAP;
  const op = resterend === 0;
  const hoger =
    abon.plan === "pro"
      ? null
      : abon.plan === "compleet"
        ? planById("pro")
        : planById("compleet");

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-ink">Verbruik</h2>
        <span className="text-sm font-semibold text-ink/45">{planNaam}</span>
      </div>

      {adminRow ? (
        <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-sm text-ink/70">
          Dit account heeft geen limiet.
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-ink">
              <span className="text-2xl font-black tracking-tight">{gebruikt}</span>
              <span className="text-ink/60"> van de {limiet} credits gebruikt</span>
            </p>
            <span className="text-sm font-semibold text-ink/45">{procent}%</span>
          </div>

          <div
            className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-black/[0.07]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={limiet}
            aria-valuenow={gebruikt}
            aria-label="Gebruikte credits deze maand"
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.max(procent, 2))}%`,
                background: op ? "#be123c" : bijnaOp ? "#b45309" : "#25855a",
              }}
            />
          </div>

          <p className="mt-3 text-sm text-ink/60">
            Credits resetten op {resetTekst}.
          </p>

          {bijnaOp && (
            <div className="mt-5 rounded-2xl bg-cream p-4">
              <p className="text-sm font-semibold text-ink">
                {op ? "Je credits zijn op" : "Je credits raken op"}
              </p>
              <p className="mt-1 text-sm text-ink/65">
                {hoger
                  ? `${hoger.naam} geeft je ${planCredits(hoger.id)} credits per maand.`
                  : "Je zit al op het ruimste pakket."}{" "}
                Je kunt ook eenmalig credits bijkopen.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {hoger && (
                  <Link
                    href="/dashboard/abonnement"
                    className="rounded-xl bg-[#25855a] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                  >
                    Bekijk {hoger.naam}
                  </Link>
                )}
                <span
                  className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-ink/40"
                  title="Beschikbaar zodra betalingen live staan"
                >
                  Credits bijkopen — binnenkort
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Klein hulpje zodat het aantal credits van een pakket uit dezelfde bron komt
// als de pakketkaartjes.
function planCredits(id: string): number {
  return CREDITS_PER_PLAN[id as keyof typeof CREDITS_PER_PLAN] ?? 0;
}

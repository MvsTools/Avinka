import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import {
  ABON_COLS,
  type AbonnementRow,
  mapAbonnementRow,
  planById,
} from "@/lib/abonnement";
import {
  beginVanDezeMaand,
  kostenVanRijen,
  limietVoor,
  naarCredits,
  type VerbruikRij,
} from "@/lib/ai-limiet";

// "Verbruik" — bewust een STIL onderdeel.
//
// Het AI-plafond draait op de achtergrond. Een leerkracht met een eigen
// account komt er nooit in de buurt (gemeten: een zware rapportmaand zit rond
// een derde van de Start-grens), dus er is geen reden om iedereen een
// leeglopende meter te laten zien. Dat zou het gevoel geven dat je op de klok
// werkt, en het botst met hoe we de pakketten verkopen.
//
// Daarom: deze kaart toont NIETS zolang er niets aan de hand is. Pas vanaf
// DREMPEL verschijnt hij, en dan meteen met de vervolgstap erbij.
const DREMPEL = 70; // procent verbruikt

export default async function AiCredits() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Admins hebben geen plafond — niets te tonen.
  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (adminRow) return null;

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
  const limiet = naarCredits(limietVoor(abon));
  const gebruikt = Math.min(
    naarCredits(kostenVanRijen((verbruik ?? []) as VerbruikRij[])),
    limiet,
  );
  const procent = limiet > 0 ? Math.round((gebruikt / limiet) * 100) : 0;

  // Niets aan de hand → helemaal niets tonen.
  if (procent < DREMPEL) return null;

  const op = gebruikt >= limiet;
  const hoger =
    abon.plan === "pro"
      ? null
      : abon.plan === "compleet"
        ? planById("pro")
        : planById("compleet");

  const nu = new Date();
  const volgende = new Date(nu.getFullYear(), nu.getMonth() + 1, 1);
  const wanneer = volgende.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
  });

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="text-lg font-bold text-ink">Verbruik</h2>

      <p className="mt-2 text-ink/75">
        {op
          ? "Je hebt deze maand veel van de tools gebruikt en bent aan je maandtegoed toe."
          : "Je gebruikt de tools deze maand opvallend veel. Je nadert je maandtegoed."}
      </p>

      <div
        className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-black/[0.07]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={procent}
        aria-label="Aandeel van je maandtegoed dat je hebt gebruikt"
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, Math.max(procent, 2))}%`,
            background: op ? "#be123c" : "#b45309",
          }}
        />
      </div>

      <p className="mt-3 text-sm text-ink/55">
        Op {wanneer} staat je tegoed er weer op.
      </p>

      <div className="mt-5 rounded-2xl bg-cream p-4">
        <p className="text-sm font-semibold text-ink">Meer nodig deze maand?</p>
        <p className="mt-1 text-sm text-ink/65">
          {hoger
            ? `${hoger.naam} geeft je flink meer ruimte, en je kunt ook eenmalig bijkopen.`
            : "Je zit al op het ruimste pakket. Je kunt eenmalig extra ruimte bijkopen."}
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
            Extra ruimte bijkopen — binnenkort
          </span>
        </div>
      </div>
    </div>
  );
}

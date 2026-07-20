import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import {
  ABON_COLS,
  type AbonnementRow,
  mapAbonnementRow,
  planById,
  proefLoopt,
} from "@/lib/abonnement";
import {
  beginVanDezeMaand,
  kostenVanRijen,
  limietVoor,
  MAAND_LIMIET,
  naarCredits,
  type VerbruikRij,
} from "@/lib/ai-limiet";

// "Verbruik" — hoeveel AI-credits dit account deze maand heeft gebruikt.
//
// We tonen CREDITS en geen euro's: een leerkracht hoeft onze inkoopprijs niet
// te kennen, en zo kunnen we de waarde per credit bijstellen zonder dat het
// getal op het scherm verspringt.
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
  const limiet = naarCredits(limietVoor(abon));
  const gebruikt = Math.min(
    naarCredits(kostenVanRijen((verbruik ?? []) as VerbruikRij[])),
    limiet,
  );
  const resterend = Math.max(0, limiet - gebruikt);
  const procent = limiet > 0 ? Math.round((gebruikt / limiet) * 100) : 0;

  // Hoe heet het huidige pakket, en is er een hoger pakket om naar te gaan?
  const inProef = proefLoopt(abon);
  const planNaam = inProef
    ? "Gratis proefperiode"
    : (planById(abon.plan)?.naam ?? "Gratis proefperiode");
  const hogerPakket =
    abon.plan === "pro"
      ? null
      : abon.plan === "compleet"
        ? { naam: "Pro", credits: naarCredits(MAAND_LIMIET.pro) }
        : { naam: "Compleet", credits: naarCredits(MAAND_LIMIET.compleet) };

  const bijnaOp = procent >= 85;
  const op = resterend === 0;

  // De eerste van de volgende maand, in gewone taal.
  const nu = new Date();
  const volgende = new Date(nu.getFullYear(), nu.getMonth() + 1, 1);
  const wanneer = volgende.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
  });

  const balkKleur = op ? "#be123c" : bijnaOp ? "#b45309" : "#25855a";

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-ink">Verbruik</h2>
        <span className="text-sm font-semibold text-ink/45">{planNaam}</span>
      </div>
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
          <div className="mt-5 flex items-baseline justify-between gap-3">
            <span className="text-3xl font-black tracking-tight text-ink">
              {procent}%
            </span>
            <span className="text-sm text-ink/60">
              {gebruikt} van {limiet} credits gebruikt
            </span>
          </div>

          <div
            className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-black/[0.07]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={procent}
            aria-label="Verbruikte AI-credits deze maand, in procenten"
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.max(procent, 1)}%`, background: balkKleur }}
            />
          </div>

          <p className="mt-3 text-sm text-ink/55">
            {op
              ? "Je credits voor deze maand zijn op."
              : bijnaOp
                ? `Nog ${resterend} credits over. Dat raakt op.`
                : `Nog ${resterend} credits over. Ruim voldoende voor een normale maand.`}
          </p>

          {(bijnaOp || op) && (
            <div className="mt-5 rounded-2xl bg-cream p-4">
              <p className="text-sm font-semibold text-ink">
                Meer nodig deze maand?
              </p>
              <p className="mt-1 text-sm text-ink/65">
                {hogerPakket
                  ? `Met ${hogerPakket.naam} krijg je ${hogerPakket.credits} credits per maand. Je kunt ook eenmalig credits bijkopen.`
                  : "Je zit al op het ruimste pakket. Je kunt eenmalig extra credits bijkopen."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {hogerPakket && (
                  <Link
                    href="/dashboard/abonnement"
                    className="rounded-xl bg-[#25855a] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                  >
                    Bekijk {hogerPakket.naam}
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

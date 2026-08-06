import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import VoorkeurenForm from "@/components/dashboard/VoorkeurenForm";
import AccountBeheer from "@/components/dashboard/AccountBeheer";
import AiCredits from "@/components/dashboard/AiCredits";
import DuoCollega from "@/components/dashboard/DuoCollega";
import EmailWijzigen from "@/components/dashboard/EmailWijzigen";

export default async function InstellingenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Instellingen</h1>
        <p className="mt-2 text-lg text-ink/70">
          Een paar kleine voorkeuren, en je account.
        </p>
      </div>

      <VoorkeurenForm />

      <Suspense fallback={null}>
        <DuoCollega />
      </Suspense>

      <AiCredits />

      {/* Account — eenvoudig en helder. */}
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
        <h2 className="text-lg font-bold text-ink">Mijn account</h2>

        <div className="mt-4">
          <EmailWijzigen huidig={email} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 py-4">
          <div>
            <p className="text-sm font-semibold text-ink/55">Wachtwoord</p>
            <p className="text-ink">••••••••</p>
          </div>
          <Link
            href="/wachtwoord-vergeten"
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-black/20 hover:text-ink"
          >
            Wachtwoord wijzigen
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div>
            <p className="text-sm font-semibold text-ink/55">Abonnement</p>
            <p className="text-ink">Gratis proefperiode</p>
          </div>
          <span className="rounded-full bg-cream px-3 py-1 text-sm font-semibold text-ink/55">
            Abonnementen komen binnenkort
          </span>
        </div>
      </div>

      <AccountBeheer />

      {/* Privacy en voorwaarden — altijd terug te vinden vanuit je account. */}
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
        <h2 className="text-lg font-bold text-ink">Privacy en voorwaarden</h2>
        <p className="mt-2 text-sm text-ink/65">
          Lees rustig na hoe we met jouw gegevens en die van je leerlingen omgaan, en
          welke afspraken er gelden.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/privacy"
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-black/20 hover:text-ink"
          >
            Privacyverklaring
          </Link>
          <Link
            href="/voorwaarden"
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-black/20 hover:text-ink"
          >
            Algemene voorwaarden
          </Link>
        </div>
      </div>
    </div>
  );
}

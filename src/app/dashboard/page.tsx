import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { tools } from "@/lib/tools";
import { BETALINGEN_LIVE, magToolGebruiken, magBestandenGebruiken } from "@/lib/abonnement";
import { getAbonnementServer } from "@/lib/abonnement-server";
import OnboardingCard from "@/components/dashboard/OnboardingCard";
import StreakBadge from "@/components/dashboard/StreakBadge";
import { amsterdamDatum } from "@/lib/streak";

export default async function DashboardStart() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const naam = (user?.user_metadata?.first_name as string) ?? "leerkracht";

  // "Welkom bij Avinka" op je allereerste dag; kom je een latere dag terug, dan
  // "Welkom terug". Gebaseerd op de aanmaakdatum van je account (Europe/Amsterdam),
  // dus geen extra veld of schrijfactie nodig.
  const vandaag = amsterdamDatum(new Date());
  const aangemaakt = user?.created_at ? amsterdamDatum(new Date(user.created_at)) : vandaag;
  const eersteKeer = aangemaakt === vandaag;

  // Welke tools zitten in het pakket van deze leerkracht? Zolang betalingen
  // niet live zijn, is alles open (de vlag regelt dat in magToolGebruiken).
  const ab = BETALINGEN_LIVE ? await getAbonnementServer() : null;
  const vergrendeld = (slug: string) => (ab ? !magToolGebruiken(ab, slug) : false);
  const bestandenVergrendeld = ab ? !magBestandenGebruiken(ab) : false;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
            {eersteKeer ? `Welkom bij Avinka, ${naam}!` : `Welkom terug, ${naam}!`} 👋
          </h1>
          <p className="mt-2 text-lg text-ink/70">
            {eersteKeer
              ? "Fijn dat je er bent. Hieronder zet je in een paar stappen alles klaar."
              : "Kies een tool om mee te beginnen. Je tijd na schooltijd is van jou."}
          </p>
        </div>
        <StreakBadge />
      </div>

      <OnboardingCard />

      {/* De vier tools als grote tegels — dit is het hart van het dashboard. */}
      <section id="tools" className="scroll-mt-24">
        <h2 className="text-xl font-bold text-ink">Jouw tools</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {tools.map((tool) => {
            const slot = vergrendeld(tool.slug);
            return (
              <Link
                key={tool.slug}
                href={slot ? "/dashboard/abonnement" : tool.pad ?? `/dashboard/tools/${tool.slug}`}
                className={
                  slot
                    ? "group relative flex items-start gap-5 rounded-3xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    : "group flex items-start gap-5 rounded-3xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md " +
                      tool.rand
                }
              >
                {slot && (
                  <span className="absolute right-5 top-5 text-ink/30" title="Zit niet in je pakket">
                    {/* slotje */}
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2" />
                      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
                    </svg>
                  </span>
                )}
                <span
                  className={
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl text-white shadow-sm " +
                    tool.badge +
                    (slot ? " opacity-40 grayscale" : "")
                  }
                >
                  {tool.emoji}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={"text-xl font-bold " + (slot ? "text-ink/50" : "text-ink")}>
                      {tool.naam}
                    </h3>
                    {tool.wekelijks && !slot && (
                      <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-amber-700">
                        elke week handig
                      </span>
                    )}
                  </div>
                  <p className={"mt-1 leading-7 " + (slot ? "text-ink/45" : "text-ink/70")}>
                    {tool.tekst}
                  </p>
                  <span className="mt-2 inline-block text-sm font-bold text-brand">
                    {slot ? "Bekijk abonnementen →" : "Openen →"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Snelle ingangen naar de twee handigste plekken. */}
      <section className="grid gap-5 sm:grid-cols-2">
        <Link
          href="/dashboard/mijn-klas"
          className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <span className="text-2xl">👩‍🏫</span>
          <h3 className="mt-2 text-lg font-bold text-ink">Mijn klas</h3>
          <p className="mt-1 text-sm leading-6 text-ink/65">
            Zet je klassenlijst klaar. Blijft veilig op je eigen apparaat staan.
          </p>
        </Link>
        <Link
          href={bestandenVergrendeld ? "/dashboard/abonnement" : "/dashboard/mijn-teksten"}
          className={
            "rounded-3xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md " +
            (bestandenVergrendeld ? "opacity-70" : "")
          }
        >
          <span className="text-2xl">🗂️</span>
          <h3 className="mt-2 flex items-center gap-2 text-lg font-bold text-ink">
            Bestanden
            {bestandenVergrendeld && (
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand">
                Compleet
              </span>
            )}
          </h3>
          <p className="mt-1 text-sm leading-6 text-ink/65">
            {bestandenVergrendeld
              ? "Bewaar en orden je teksten en plattegronden. Beschikbaar met Compleet."
              : "Mappen met je bewaarde teksten en plattegronden, netjes geordend."}
          </p>
        </Link>
      </section>

      <p className="rounded-2xl bg-brand-soft px-5 py-4 text-sm font-medium text-ink/70">
        💡 <strong>Tip:</strong> de namen van je leerlingen blijven altijd op je eigen
        computer en gaan nooit naar de AI. Dat regelen de tools voor je.
      </p>
    </div>
  );
}

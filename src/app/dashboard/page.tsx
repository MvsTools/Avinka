import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { tools } from "@/lib/tools";
import { BETALINGEN_LIVE, magToolGebruiken } from "@/lib/abonnement";
import { getAbonnementServer } from "@/lib/abonnement-server";
import { haalRapportGrens } from "@/lib/actieve-klas";
import OnboardingCard from "@/components/dashboard/OnboardingCard";
import WelkomModal from "@/components/dashboard/WelkomModal";
import StreakBadge from "@/components/dashboard/StreakBadge";
import TakenOverzicht from "@/components/dashboard/TakenOverzicht";
import VandaagRij from "@/components/dashboard/VandaagRij";
import WatEraanKomt from "@/components/dashboard/WatEraanKomt";
import DuoOverdracht from "@/components/dashboard/DuoOverdracht";
import CollegaUitnodigen from "@/components/dashboard/CollegaUitnodigen";
import KaartMelding from "@/components/dashboard/KaartMelding";
import { amsterdamDatum } from "@/lib/streak";
import { haalMijnGroepen, haalPlanning, plus } from "@/lib/planning";
import type { PlanItem, PlanningBron } from "@/lib/planning";

// ⚠️ TIJDELIJK — hoort bij `?voorbeeld` hieronder en gaat er samen mee weg.
// Vier verzonnen afspraken rond vandaag, zodat elk soort signaal één keer
// langskomt: eentje die net geweest is, eentje om klaar te zetten, en twee die
// eraan komen.
function metVoorbeeldAfspraken(bron: PlanningBron, vandaag: string): PlanningBron {
  const dag = (n: number) => plus(vandaag, n);
  const nep = (id: string, datum: string, titel: string, soort: PlanItem["soort"]): PlanItem => ({
    id: `voorbeeld-${id}`,
    bronId: "voorbeeld",
    datum,
    totDatum: datum,
    heleDag: true,
    tijdvakken: 1,
    titel,
    soort,
  });
  return {
    ...bron,
    items: [
      ...bron.items,
      nep("1", dag(6), "Toetsweek begrijpend lezen", "toets"),
      nep("2", dag(13), "Startgesprekken", "gesprek"),
      nep("3", dag(20), "Rapporten mee naar huis", "rapport"),
    ],
  };
}

export default async function DashboardStart({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  // ⚠️ TIJDELIJK — weghalen zodra "Wat eraan komt" is goedgekeurd.
  // `?voorbeeld` zet er een paar verzonnen afspraken bij, zodat het blok hier
  // op de echte Start te beoordelen is. Zonder die schakelaar zie je niets: in
  // een gekoppelde agenda hoeft de komende weken niets te staan.
  const { voorbeeld } = await searchParams;
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
  const [ab, planning, groepen, rapportGrens] = await Promise.all([
    BETALINGEN_LIVE ? getAbonnementServer() : Promise.resolve(null),
    haalPlanning(supabase, { nu: vandaag }),
    haalMijnGroepen(supabase),
    haalRapportGrens(supabase),
  ]);
  const vergrendeld = (slug: string) => (ab ? !magToolGebruiken(ab, slug) : false);

  // Kijk je bij de actieve groep alleen mee, dan kun je de rapporten wél lezen
  // maar niet vastleggen. Dat hoort hier te staan en niet pas ín de tool:
  // anders kom je er pas achter als je al een rapport hebt getypt.
  // Achter een uitroepteken, dus de tekst mag iets voller: je leest hem alleen
  // als je er zelf naar vraagt.
  const meekijkNotitie = (slug: string) =>
    slug === "rapporten" && !rapportGrens.magRapportenBewerken
      ? `Je kijkt mee bij ${rapportGrens.klasNaam || "deze groep"}. Je kunt de rapporten lezen, maar niet wijzigen of opslaan.`
      : "";

  return (
    <div className="flex flex-col gap-8">
      <WelkomModal />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
            {eersteKeer ? `Welkom bij Avinka, ${naam}!` : `Welkom terug, ${naam}!`} 👋
          </h1>
          {eersteKeer && (
            <p className="mt-2 text-lg text-ink/70">
              Fijn dat je er bent. Hieronder zet je in een paar stappen alles klaar.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TakenOverzicht />
          <StreakBadge />
        </div>
      </div>

      {/* De overdracht is de vierde tegel in dezelfde rij: hij hoort bij het
          "hoe staat het er vandaag voor"-blok, niet bij de tools eronder. */}
      <VandaagRij
        bron={planning}
        vandaag={vandaag}
        groepen={groepen}
        extraTegel={<DuoOverdracht />}
      />

      {/* Wat er de komende weken aankomt en welke tool daarbij hoort. Staat
          bewust tussen de dagrij en de tools: het is het bruggetje van "wat
          speelt er" naar "waar begin ik". Is er niets, dan staat er niets. */}
      <WatEraanKomt
        bron={voorbeeld ? metVoorbeeldAfspraken(planning, vandaag) : planning}
        vandaag={vandaag}
        groepen={groepen}
        maximaal={2}
        vergrendeld={tools.filter((t) => vergrendeld(t.slug)).map((t) => t.slug)}
      />

      <OnboardingCard />

      <CollegaUitnodigen />

      {/* De tools als grote tegels — dit is het hart van het dashboard. */}
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
                    ? "group relative flex items-stretch gap-5 rounded-3xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    : "group relative flex items-stretch gap-5 rounded-3xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md " +
                      tool.rand
                }
              >
                {/* Kijk je bij deze groep alleen mee, dan kun je hier niets
                    vastleggen. Als klein uitroepteken in de hoek: het geldt
                    maar voor één kaart en zelden, dus het hoeft de kaart niet
                    zwaarder te maken. Botst niet met het slotje hieronder,
                    want dat verschijnt alleen bij een vergrendelde tool. */}
                {!slot && meekijkNotitie(tool.slug) && (
                  <KaartMelding tekst={meekijkNotitie(tool.slug)} />
                )}
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
                    "flex h-14 w-14 shrink-0 self-start items-center justify-center rounded-2xl text-2xl text-white shadow-sm " +
                    tool.badge +
                    (slot ? " opacity-40 grayscale" : "")
                  }
                >
                  {tool.emoji}
                </span>
                <div className="flex min-w-0 flex-col">
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
                  <span className="mt-auto inline-block pt-3 text-sm font-bold text-brand">
                    {slot ? "Bekijk abonnementen →" : "Openen →"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <p className="rounded-2xl bg-brand-soft px-5 py-4 text-sm font-medium text-ink/70">
        💡 <strong>Tip:</strong> de namen van je leerlingen blijven altijd op je eigen
        computer en gaan nooit naar de AI. Dat regelen de tools voor je.
      </p>
    </div>
  );
}

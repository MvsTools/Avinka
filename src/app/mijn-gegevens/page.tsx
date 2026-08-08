import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import GegevensBlok from "@/components/GegevensBlok";
import {
  EIGEN_WERK,
  type Gegevens,
  OVERIG,
  SECTIES,
  TABELLEN,
  bouwKaarten,
  zonderGeheimen,
} from "@/lib/export-gegevens";
import { createClient } from "@/utils/supabase/server";

/* ══════════════════════════════════════════════════════════════════════════
 * WAT WE VAN JOU BEWAREN
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Inzage en meenemen van je eigen gegevens (AVG art. 15 en 20).
 *
 * ⚠️ DEZE PAGINA STAAT BEWUST BUITEN /dashboard. Zodra BETALINGEN_LIVE aan
 * staat stuurt de middleware iemand zonder abonnement van élke dashboardpagina
 * door naar /dashboard/abonnement (zie src/utils/supabase/middleware.ts). Zet
 * deze pagina daar dus nooit onder: dan is het recht op inzage onbereikbaar
 * voor precies de groep die er het vaakst gebruik van maakt — mensen die net
 * gestopt zijn. Inloggen is genoeg; een abonnement niet.
 *
 * Was eerder een losstaand HTML-document uit de API-route. Als echte pagina
 * erft hij de lettertypes, kleuren en vormtaal van de rest van het platform, in
 * plaats van dat er honderdvijftig regels eigen opmaak naast het designsysteem
 * staan te verouderen. Het downloaden zelf zit nog steeds in
 * src/app/api/account/export. */

export const metadata: Metadata = {
  title: "Wat Avinka van jou bewaart",
  robots: { index: false, follow: false },
};

export default async function MijnGegevensPagina() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Uitgelogd hier belanden is het normale geval: de link naar je gegevens is
  // bruikbaar voor wie is gestopt, en die is meestal niet meer ingelogd.
  if (!user) redirect("/sign-in?volgende=%2Fmijn-gegevens");

  // Er wordt gelezen met de sessie van de bezoeker, dus RLS levert per definitie
  // alleen zijn eigen rijen.
  const gegevens: Gegevens = {};
  for (const tabel of TABELLEN) {
    const { data } = await supabase.from(tabel).select("*");
    gegevens[tabel] = zonderGeheimen((data as Record<string, unknown>[]) ?? []);
  }

  const meenemen = bouwKaarten(EIGEN_WERK, gegevens);
  const overig = bouwKaarten(OVERIG, gegevens);

  const leeg = (tabellen: readonly string[]) => {
    const namen = tabellen
      .filter((t) => (gegevens[t] ?? []).length === 0)
      .map((t) => SECTIES[t].titel.replace(/^Je /, "").toLowerCase());
    if (namen.length === 0) return null;
    const lijst =
      namen.length === 1 ? namen[0] : `${namen.slice(0, -1).join(", ")} en ${namen.at(-1)}`;
    return <p className="mt-3 text-sm text-ink/45">Hier staat niets: {lijst}.</p>;
  };

  /* De uitnodiging om te blijven hoort bij het groene blok — dat gaat over "je
   * werk staat er nog als je terugkomt" — en niet bovenaan de pagina. Iemand die
   * hier zijn gegevens ophaalt oefent een recht uit; daar hoort geen
   * verkooppraatje overheen.
   * ⚠️ Alleen tonen aan wie geen lopend abonnement heeft. Een betalende klant
   * "neem een abonnement" voorhouden is de snelste manier om ongeloofwaardig te
   * worden. */
  const heeftAbonnement = gegevens.instellingen?.[0]?.abon_status === "actief";
  const voornaam = (user.user_metadata?.first_name as string) ?? "";

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:py-14">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-5 rounded-3xl border border-ink/8 bg-white px-7 py-6 shadow-sm shadow-ink/[0.03]">
        <div>
          <Image
            src="/Avinka_wordmerk.png"
            alt="Avinka"
            width={132}
            height={34}
            className="mb-3 h-7 w-auto"
            priority
          />
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">
            Wat we van jou bewaren
          </h1>
          <p className="mt-1 text-sm text-ink/55">
            {voornaam && `${voornaam} · `}
            {user.email}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-2xl border-2 border-ink/10 px-5 py-2.5 text-sm font-bold text-ink transition hover:border-ink/20"
        >
          Terug naar Avinka
        </Link>
      </header>

      <h2 className="text-xs font-extrabold uppercase tracking-[0.09em] text-ink/45">
        Meenemen
      </h2>
      <p className="mb-4 mt-1 max-w-[60ch] text-sm text-ink/55">
        Vink aan wat je wilt bewaren. Deze gegevens gaan over je klas, en die ruimen we 90 dagen
        na je laatste abonnement op.
      </p>
      <GegevensBlok kaarten={meenemen} actie="/api/account/export" />
      {leeg(EIGEN_WERK)}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-brand-soft px-7 py-6">
        <p className="max-w-[52ch] flex-1 text-sm leading-relaxed text-brand-dark">
          <strong className="font-bold">Je eigen vakwerk bewaren we gewoon voor je.</strong>{" "}
          Lesontwerpen, werkbladen, draaiboeken en je weekrooster blijven staan, ook als je stopt.
          Ze staan er nog als je terugkomt.
        </p>
        {!heeftAbonnement && (
          <Link
            href="/dashboard/abonnement"
            className="rounded-2xl bg-brand-dark px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark/90"
          >
            Weer een abonnement nemen
          </Link>
        )}
      </div>

      <h2 className="mt-12 text-xs font-extrabold uppercase tracking-[0.09em] text-ink/45">
        En dit weten we verder van je
      </h2>
      <p className="mb-4 mt-1 max-w-[60ch] text-sm text-ink/55">
        Hier kun je ook los iets van ophalen. Deze komen als Excel-tabel.
      </p>
      <GegevensBlok kaarten={overig} actie="/api/account/export" toonFormaat={false} />
      {leeg(OVERIG)}

      <div className="mt-12 flex flex-wrap gap-3">
        <a
          href="/api/account/export?format=json"
          className="rounded-2xl border border-ink/10 bg-white px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-cream"
        >
          Alles als één bestand (JSON)
        </a>
      </div>
      <p className="mt-6 text-xs leading-relaxed text-ink/45">
        Waarom we dit bewaren, hoe lang, en met wie we het delen staat in de{" "}
        <Link href="/privacy" className="font-semibold text-brand-dark hover:underline">
          privacyverklaring
        </Link>
        . Je account verwijderen doe je in Avinka onder Instellingen.
      </p>
    </main>
  );
}

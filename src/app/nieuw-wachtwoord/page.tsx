import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import NewPasswordForm from "@/components/NewPasswordForm";
import Logo from "@/components/Logo";
import { createClient } from "@/utils/supabase/server";
import { HERSTEL_ADRES_COOKIE } from "@/lib/herstel";

/* Bereikbaar via de link in de herstelmail.

   🔑 HET OPENEN VAN DIT SCHERM DOET NIETS (8-8-2026). Het token uit de mail
   reist als verborgen veld mee in het formulier en wordt pas ingewisseld als de
   gebruiker een nieuw wachtwoord VERSTUURT (zie updatePassword in
   auth/actions.ts). Dat moet zo: bij scholen met Microsoft Safe Links haalt
   Microsoft élke link in een binnenkomende mail eerst zélf op om hem te
   controleren, en een eenmalig token is daarmee opgebruikt vóórdat de leerkracht
   klikt. Een scanner opent pagina's, maar vult geen wachtwoorden in.
   Zo werkt het bij de meeste grote partijen ook. Zie [[mail-verzendstraat]].

   Wie hier zonder token én zonder sessie komt (zelf getypt, of een link die zo
   oud is dat hij niet meer meegestuurd wordt) krijgt een nette uitleg. */

export const metadata: Metadata = {
  title: "Kies een nieuw wachtwoord",
  // Een pagina met een eenmalig token in de link hoort nooit in een zoekmachine,
  // ook niet ná de livegang (dan valt de algemene noindex uit layout.tsx weg).
  robots: { index: false, follow: false },
};

export default async function NieuwWachtwoordPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; email?: string }>;
}) {
  const { token_hash, email } = await searchParams;

  // Voor welk account is dit? Met een token is er nog geen sessie, dus het moet
  // ergens anders vandaan komen. Twee bronnen, in deze volgorde:
  //
  //   1. uit de link zelf ({{ .Email }} in het mailsjabloon). Deze hoort bij het
  //      token en werkt dus op ELK apparaat.
  //   2. anders uit de cookie van het aanvragen. Die geldt alleen in dezelfde
  //      browser, en dat is op mobiel vaak net niet: mailapps openen een link in
  //      hun eigen ingebouwde browser, die zijn cookies niet deelt.
  //
  // ⚠️ De waarde uit de link is niet te vertrouwen — hij is door iedereen aan te
  // passen. Dat mag hier: dit adres bepaalt NIET welk account een nieuw
  // wachtwoord krijgt (dat doet het token), het is alleen het opschrift op het
  // scherm en de gebruikersnaam voor de wachtwoordbeheerder.
  //
  // 🔑 Spaties terug naar `+`: een plusje in een adres (jij+school@…) betekent
  // in een webadres een spatie, dus zo komt het hier binnen. Een spatie kán niet
  // in een gewoon e-mailadres voorkomen, dus deze omzetting is veilig.
  let adres = "";
  let heeftSessie = false;
  if (token_hash) {
    adres =
      (email ? email.replace(/ /g, "+") : "") ||
      (await cookies()).get(HERSTEL_ADRES_COOKIE)?.value ||
      "";
  } else {
    // Zonder token hoort dit scherm alleen te werken voor wie al is ingelogd.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    heeftSessie = Boolean(user);
    adres = user?.email ?? "";
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <Logo vol className="h-16 w-auto" priority />
      </Link>

      {token_hash || heeftSessie ? (
        <NewPasswordForm tokenHash={token_hash ?? ""} email={adres} />
      ) : (
        <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 text-center shadow-xl sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-3xl">
            ⏳
          </span>
          <h1 className="mt-5 text-2xl font-bold text-ink">Link verlopen</h1>
          <p className="mt-3 leading-7 text-ink/70">
            Deze herstellink is verlopen of al gebruikt. Vraag een nieuwe aan,
            dan sturen we je opnieuw een mail.
          </p>
          <Link
            href="/wachtwoord-vergeten"
            className="mt-7 inline-block rounded-2xl bg-brand px-6 py-3 font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark"
          >
            Nieuwe link aanvragen
          </Link>
        </div>
      )}
    </div>
  );
}

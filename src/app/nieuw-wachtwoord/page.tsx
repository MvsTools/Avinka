import type { Metadata } from "next";
import Link from "next/link";
import NewPasswordForm from "@/components/NewPasswordForm";
import Logo from "@/components/Logo";
import { createClient } from "@/utils/supabase/server";

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
  searchParams: Promise<{ token_hash?: string }>;
}) {
  const { token_hash } = await searchParams;

  // Alleen opzoeken als er geen token is: met een token hoort dit scherm juist
  // zónder sessie te werken, en dan is de vraag "ben je al ingelogd" niet aan de
  // orde.
  let heeftSessie = false;
  if (!token_hash) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    heeftSessie = Boolean(user);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <Logo vol className="h-16 w-auto" priority />
      </Link>

      {token_hash || heeftSessie ? (
        <NewPasswordForm tokenHash={token_hash ?? ""} />
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

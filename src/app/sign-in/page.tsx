import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import { veiligIntern } from "@/lib/paden";

// Logo bovenaan, terug-link naar de startpagina, en het inlogformulier.
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ fout?: string; duo?: string; volgende?: string }>;
}) {
  const { fout, duo, volgende: gevraagd } = await searchParams;

  // Kwam je hier via een duo-uitnodiging? Dan stuurde de proxy je door naar
  // het inlogscherm mét de code in de link. Die geven we door, zodat je ná het
  // inloggen op de uitnodiging uitkomt in plaats van op een leeg dashboard.
  // `volgende` is dezelfde bestemming, maar dan doorgegeven vanaf het
  // registratiescherm (zie AuthCard).
  const volgende = duo
    ? `/dashboard/instellingen?duo=${encodeURIComponent(duo)}`
    : gevraagd
      ? veiligIntern(gevraagd)
      : undefined;

  return (
    <>
    <div className="px-6 pt-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 transition hover:text-ink"
      >
        ← Terug naar de startpagina
      </Link>
    </div>
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-10">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <Logo vol className="h-16 w-auto" priority />
      </Link>

      {volgende?.includes("duo=") && (
        <p className="mb-5 w-full max-w-md rounded-2xl bg-brand-soft px-4 py-3 text-center text-sm font-semibold text-brand-dark">
          Je uitnodiging staat klaar. Log in, dan komt hij meteen in beeld. Nog geen
          account? Maak er dan eerst een aan.
        </p>
      )}

      {fout === "link-verlopen" && (
        <p className="mb-5 w-full max-w-md rounded-2xl bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-800">
          Die bevestigingslink is verlopen of al gebruikt. Log gewoon in, of
          maak opnieuw een account aan.
        </p>
      )}

      {/* Iemand probeerde zich aan te melden met een adres dat al een account
          heeft. Supabase houdt dat stil (zie signup() in auth/actions.ts), dus
          zonder deze melding stond die persoon op het wachtscherm te wachten op
          een code die nooit komt. De verwijzing naar wachtwoord vergeten staat
          erbij omdat dat meestal de échte vraag is: mensen die vergeten zijn dat
          ze een account hebben, weten hun wachtwoord ook niet meer. */}
      {fout === "bestaat-al" && (
        <p className="mb-5 w-full max-w-md rounded-2xl bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-800">
          Er bestaat al een account met dit e-mailadres. Log hieronder in, of{" "}
          <Link href="/wachtwoord-vergeten" className="underline">
            vraag een nieuw wachtwoord aan
          </Link>{" "}
          als je het niet meer weet.
        </p>
      )}

      <AuthCard mode="signin" volgende={volgende} />
    </div>
    <Footer />
    </>
  );
}

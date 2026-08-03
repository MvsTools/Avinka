import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import RefVangst from "@/components/RefVangst";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import { veiligIntern } from "@/lib/paden";

// Logo bovenaan, terug-link naar de startpagina, en het registratieformulier.
//
// `volgende` komt mee vanaf het inlogscherm als je daar via een uitnodiging
// binnenkwam: wie nog geen account heeft, moet ná het aanmaken alsnog op die
// uitnodiging uitkomen.
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ volgende?: string }>;
}) {
  const { volgende: gevraagd } = await searchParams;
  const volgende = gevraagd ? veiligIntern(gevraagd) : undefined;

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

      <AuthCard mode="signup" volgende={volgende} />
      <RefVangst />
    </div>
    <Footer />
    </>
  );
}

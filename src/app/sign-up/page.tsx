import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import RefVangst from "@/components/RefVangst";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";

// Logo bovenaan, terug-link naar de startpagina, en het registratieformulier.
export default function SignUpPage() {
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

      <AuthCard mode="signup" />
      <RefVangst />
    </div>
    <Footer />
    </>
  );
}

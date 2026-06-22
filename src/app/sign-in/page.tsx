import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";

// Logo bovenaan, terug-link naar de startpagina, en het inlogformulier.
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ fout?: string }>;
}) {
  const { fout } = await searchParams;

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

      {fout === "link-verlopen" && (
        <p className="mb-5 w-full max-w-md rounded-2xl bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-800">
          Die bevestigingslink is verlopen of al gebruikt. Log gewoon in, of
          maak opnieuw een account aan.
        </p>
      )}

      <AuthCard mode="signin" />
    </div>
    <Footer />
    </>
  );
}

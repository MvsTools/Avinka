import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { signout } from "@/app/auth/actions";
import DashboardNav from "@/components/dashboard/DashboardNav";
import RefKoppel from "@/components/RefKoppel";
import ProefFeedback from "@/components/dashboard/ProefFeedback";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import { getAbonnementServer } from "@/lib/abonnement-server";
import { magBestandenGebruiken } from "@/lib/abonnement";
import { isAdminServer } from "@/lib/admin";

// Gedeelde schil rond álle dashboard-pagina's: bovenbalk + zijnavigatie.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const naam = (user?.user_metadata?.first_name as string) ?? "leerkracht";

  // Bestanden hoort bij Compleet/Pro; bij Start tonen we het menu-item op slot.
  const bestandenVergrendeld = !magBestandenGebruiken(await getAbonnementServer());
  const admin = await isAdminServer();

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      {/* Bovenbalk */}
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <Link href="/" className="flex items-center gap-2.5" title="Naar de startpagina">
            <Logo vol className="h-10 w-auto" priority />
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-ink/60 sm:inline">
              Hallo, {naam}
            </span>
            <form action={signout}>
              <button
                type="submit"
                className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-black/20 hover:text-ink"
              >
                Uitloggen
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Navigatie + inhoud */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-6 md:flex-row md:gap-8 md:px-6 md:py-8">
        <DashboardNav bestandenVergrendeld={bestandenVergrendeld} isAdmin={admin} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Voettekst met de vaste, altijd vindbare links */}
      <Footer maxWidth="max-w-7xl" hulpHref="/dashboard/hulp" />
      <RefKoppel />
      <ProefFeedback />
    </div>
  );
}

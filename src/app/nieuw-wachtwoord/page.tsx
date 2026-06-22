import Link from "next/link";
import NewPasswordForm from "@/components/NewPasswordForm";
import Logo from "@/components/Logo";
import { createClient } from "@/utils/supabase/server";

// Bereikbaar via de link in de herstelmail. Die link geeft een geldige
// sessie; wie hier zonder sessie komt (link verlopen of direct getypt),
// krijgt een nette uitleg met een knop om opnieuw te beginnen.
export default async function NieuwWachtwoordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <Logo vol className="h-16 w-auto" priority />
      </Link>

      {user ? (
        <NewPasswordForm />
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

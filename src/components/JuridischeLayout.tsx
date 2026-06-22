import Link from "next/link";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";

// Gedeelde schil voor de juridische pagina's (privacyverklaring + voorwaarden).
// Eén plek voor de kop, terug-link en voettekst, zodat beide pagina's identiek ogen.
export default function JuridischeLayout({
  titel,
  bijgewerkt,
  intro,
  children,
}: {
  titel: string;
  bijgewerkt: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-cream">
      {/* Bovenbalk met logo (terug naar start) */}
      <header className="border-b border-black/5">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo vol className="h-9 w-auto" />
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-ink/60 transition hover:text-ink"
          >
            ← Terug naar de startpagina
          </Link>
        </div>
      </header>

      {/* Inhoud */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
        <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-black tracking-tight text-ink">
          {titel}
        </h1>
        <p className="mt-3 text-sm text-ink/50">Laatst bijgewerkt: {bijgewerkt}</p>
        {intro && <p className="mt-6 text-lg leading-8 text-ink/75">{intro}</p>}

        <div className="juridisch mt-10">{children}</div>
      </main>

      {/* Voettekst met onderlinge links */}
      <Footer maxWidth="max-w-3xl" />
    </div>
  );
}

// Kleine bouwstenen voor de tekst, zodat de opmaak overal gelijk is.
export function Sectie({
  kop,
  children,
}: {
  kop: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-bold text-ink">
        {kop}
      </h2>
      <div className="mt-3 space-y-4 leading-8 text-ink/80">{children}</div>
    </section>
  );
}

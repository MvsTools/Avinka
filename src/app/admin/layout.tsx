import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminServer } from "@/lib/admin";
import AdminNav from "@/components/admin/AdminNav";
import Logo from "@/components/Logo";
// Modules: Overzicht · Te bouwen · Conversie · Feedback · Financiën · Verbruik · Tijdwinst · Tools

// Admin-schil. Dubbele afscherming naast de middleware: wie geen admin is,
// gaat terug naar het eigen dashboard.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdminServer())) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-2.5">
            <Link href="/?startpagina" title="Naar de startpagina">
              <Logo vol className="h-10 w-auto" />
            </Link>
            <span className="text-lg font-extrabold tracking-tight text-ink/40">· Admin</span>
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-black/20 hover:text-ink"
          >
            ← Terug naar dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-6 md:flex-row md:gap-8 md:px-6 md:py-8">
        <AdminNav />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

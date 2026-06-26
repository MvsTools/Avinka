import Link from "next/link";
import { notFound } from "next/navigation";
import { toolBySlug } from "@/lib/tools";

// Tijdelijke pagina per tool. De tools verhuizen hierna één voor één
// vanuit de testversie naar het dashboard; tot die tijd staat hier een nette uitleg.
export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = toolBySlug(slug);
  if (!tool) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard"
        className="self-start text-sm font-semibold text-ink/60 transition hover:text-ink"
      >
        ← Terug naar start
      </Link>

      <div className="rounded-3xl border border-black/5 bg-white p-8 text-center shadow-sm sm:p-12">
        <span
          className={
            "mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl text-white shadow-sm " +
            tool.badge
          }
        >
          {tool.emoji}
        </span>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-ink">{tool.naam}</h1>
        <p className="mx-auto mt-3 max-w-md leading-7 text-ink/70">{tool.tekst}</p>

        <div className="mx-auto mt-7 max-w-md rounded-2xl bg-brand-soft px-5 py-4">
          <p className="text-sm font-semibold text-ink/75">
            🚧 Deze tool verhuist binnenkort naar je dashboard. We pakken ze één
            voor één in — zodra {tool.naam} klaar is, kun je hier direct beginnen.
          </p>
        </div>
      </div>
    </div>
  );
}

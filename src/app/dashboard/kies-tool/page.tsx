"use client";

// Waar een Start-abonnee zijn ENE tool kiest. Bestond nog nergens: `start_tool`
// werd overal gecontroleerd (magToolGebruiken, middleware, /api/claude) maar
// nooit ergens gezet — dus een Start-klant had tot nu toe toegang tot NUL
// tools. Zie de server-route /api/start-tool voor het schrijven + de 1×/maand-regel.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAbonnement } from "@/lib/db";
import { type Abonnement } from "@/lib/abonnement";
import { tools } from "@/lib/tools";

export default function KiesToolPagina() {
  const router = useRouter();
  const [ab, setAb] = useState<Abonnement | null>(null);
  const [bezig, setBezig] = useState<string | null>(null);
  const [teVroeg, setTeVroeg] = useState<number | null>(null);

  useEffect(() => {
    getAbonnement().then(setAb);
  }, []);

  async function kies(slug: string) {
    setBezig(slug);
    setTeVroeg(null);
    try {
      const res = await fetch("/api/start-tool", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setTeVroeg(data?.dagenTeGaan ?? null);
        setBezig(null);
        return;
      }
      if (!res.ok) {
        setBezig(null);
        return;
      }
      router.push("/dashboard");
    } catch {
      setBezig(null);
    }
  }

  if (!ab) {
    return <div className="h-40 animate-pulse rounded-3xl border border-black/5 bg-white/60" />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
          Kies je tool
        </h1>
        <p className="mt-2 max-w-xl text-lg text-ink/70">
          Bij Start krijg je onbeperkt toegang tot één tool naar keuze. Je kunt
          hem later wisselen, maximaal één keer per maand.
        </p>
      </div>

      {ab.startTool && (
        <p className="rounded-2xl bg-brand-soft px-5 py-4 text-sm font-medium text-brand">
          Je huidige keuze is <strong>{tools.find((t) => t.slug === ab.startTool)?.naam}</strong>.
          Kies hieronder een andere tool om te wisselen.
        </p>
      )}

      {teVroeg !== null && (
        <p className="rounded-2xl bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">
          Je kunt pas over {teVroeg} {teVroeg === 1 ? "dag" : "dagen"} weer wisselen — dat mag
          maximaal één keer per maand.
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {tools.map((tool) => {
          const actief = ab.startTool === tool.slug;
          return (
            <button
              key={tool.slug}
              type="button"
              onClick={() => kies(tool.slug)}
              disabled={bezig !== null || actief}
              className={
                "group relative flex items-stretch gap-5 rounded-3xl border bg-white p-6 text-left shadow-sm transition disabled:cursor-default " +
                (actief
                  ? "border-brand ring-2 ring-brand/30"
                  : "border-black/5 hover:-translate-y-1 hover:shadow-md " + tool.rand)
              }
            >
              <span
                className={
                  "flex h-14 w-14 shrink-0 self-start items-center justify-center rounded-2xl text-2xl text-white shadow-sm " +
                  tool.badge
                }
              >
                {tool.emoji}
              </span>
              <div className="flex min-w-0 flex-col">
                <h3 className="text-xl font-bold text-ink">{tool.naam}</h3>
                <p className="mt-1 leading-7 text-ink/70">{tool.tekst}</p>
                <span className="mt-auto inline-block pt-3 text-sm font-bold text-brand">
                  {actief ? "Jouw tool" : bezig === tool.slug ? "Een momentje…" : "Kies deze →"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

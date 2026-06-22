"use client";

import { useEffect, useState } from "react";
import {
  getAdminFeedback,
  setFeedbackStatus,
  type AdminFeedback as Data,
  type FeedbackItem,
  type FeedbackSoort,
} from "@/lib/db";

const SOORT_LABEL: Record<FeedbackSoort, string> = {
  idee: "Idee",
  probleem: "Probleem",
  compliment: "Compliment",
  anders: "Anders",
};
const SOORT_KLEUR: Record<FeedbackSoort, string> = {
  idee: "#2f9e6e",
  probleem: "#e11d48",
  compliment: "#059669",
  anders: "#64748b",
};

// De tool-sleutel uit de feedback (leeg = algemeen dashboard) naar een label.
const TOOL_LABEL: Record<string, string> = {
  "": "Dashboard",
  dashboard: "Dashboard",
  toetswijs: "Toetsanalyse",
  rapportwijs: "Rapporten",
  ouderwijs: "Oudercontact",
  plattegrondwijs: "Plattegrond",
  "nieuwe-tool": "Nieuwe tool",
};
function toolLabel(slug: string): string {
  return TOOL_LABEL[slug] ?? slug;
}

function datum(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

export default function AdminFeedback() {
  const [d, setD] = useState<Data | null>(null);
  const [laden, setLaden] = useState(true);
  const [dagen, setDagen] = useState(90);
  const [alleenOpen, setAlleenOpen] = useState(false);
  const [toolFilter, setToolFilter] = useState(""); // "" = alle tools

  function laad(n: number) {
    setLaden(true);
    getAdminFeedback(n).then((x) => {
      setD(x);
      setLaden(false);
    });
  }

  useEffect(() => {
    laad(dagen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dagen]);

  async function wissel(item: FeedbackItem) {
    const nieuw = item.status === "nieuw" ? "afgehandeld" : "nieuw";
    // optimistisch bijwerken
    setD((cur) =>
      cur
        ? {
            ...cur,
            open: cur.open + (nieuw === "afgehandeld" ? -1 : 1),
            items: cur.items.map((it) => (it.id === item.id ? { ...it, status: nieuw } : it)),
          }
        : cur,
    );
    const ok = await setFeedbackStatus(item.id, nieuw);
    if (!ok) laad(dagen); // mislukt → opnieuw ophalen
  }

  if (laden) {
    return <div className="h-40 animate-pulse rounded-3xl border border-black/5 bg-white/60" />;
  }
  if (!d) {
    return (
      <p className="rounded-2xl bg-white px-5 py-4 text-sm text-ink/60 shadow-sm">
        Nog geen gegevens beschikbaar.
      </p>
    );
  }

  const items = d.items
    .filter((it) => !alleenOpen || it.status === "nieuw")
    .filter((it) => !toolFilter || (it.tool || "dashboard") === toolFilter);
  const soorten = (Object.keys(SOORT_LABEL) as FeedbackSoort[]).filter(
    (s) => (d.per_soort[s] ?? 0) > 0,
  );
  // Per-tool tellingen, meest gebruikte bovenaan.
  const tools = Object.entries(d.per_tool).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-6">
      {/* Tellingen + periode */}
      <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink">Binnengekomen feedback</h2>
            <p className="mt-0.5 text-sm text-ink/55">Reacties van leerkrachten uit het dashboard en de tools.</p>
          </div>
          <div className="flex gap-1.5">
            {[30, 90, 365].map((n) => (
              <button
                key={n}
                onClick={() => setDagen(n)}
                className={
                  "rounded-full px-3 py-1.5 text-sm font-semibold transition " +
                  (dagen === n ? "bg-ink text-white" : "bg-cream text-ink/60 hover:text-ink")
                }
              >
                {n === 365 ? "1 jaar" : `${n} dgn`}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Stat label="Totaal ontvangen" waarde={d.totaal} />
          <Stat label="Nog te bekijken" waarde={d.open} accent />
        </div>

        {soorten.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {soorten.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-cream px-3 py-1 text-sm"
              >
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: SOORT_KLEUR[s] }} />
                <span className="font-semibold text-ink">{SOORT_LABEL[s]}</span>
                <span className="text-ink/50">{d.per_soort[s]}</span>
              </span>
            ))}
          </div>
        )}

        {tools.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Per tool · klik om te filteren</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <ToolChip label="Alle" actief={toolFilter === ""} onClick={() => setToolFilter("")} />
              {tools.map(([slug, n]) => (
                <ToolChip
                  key={slug}
                  label={`${toolLabel(slug)} · ${n}`}
                  actief={toolFilter === slug}
                  onClick={() => setToolFilter(toolFilter === slug ? "" : slug)}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Belangrijkste onderwerpen (snelle keuzes) */}
      {d.categorieen.length > 0 && (
        <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-ink">Belangrijkste onderwerpen</h2>
          <p className="mt-0.5 text-sm text-ink/55">Wat leerkrachten het vaakst aanstippen, per tool.</p>
          <div className="mt-4 flex flex-col gap-3">
            {(() => {
              const max = Math.max(...d.categorieen.map((c) => c.aantal), 1);
              return d.categorieen.map((c, i) => (
                <div key={i}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{c.categorie}</span>
                      <span className="text-ink/45">{toolLabel(c.tool)}</span>
                    </span>
                    <span className="text-ink/60">{c.aantal}×</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/5">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${Math.round((c.aantal / max) * 100)}%` }}
                    />
                  </div>
                </div>
              ));
            })()}
          </div>
        </section>
      )}

      {/* Lijst */}
      <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">Berichten</h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink/70">
            <input
              type="checkbox"
              checked={alleenOpen}
              onChange={(e) => setAlleenOpen(e.target.checked)}
              className="h-4 w-4 rounded border-black/20 accent-brand"
            />
            Alleen nog te bekijken
          </label>
        </div>

        {items.length === 0 ? (
          <p className="mt-4 text-sm text-ink/55">
            {alleenOpen ? "Alles is afgehandeld. 🎉" : "Nog geen feedback ontvangen."}
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {items.map((it) => (
              <li
                key={it.id}
                className={
                  "rounded-2xl border p-4 transition " +
                  (it.status === "afgehandeld"
                    ? "border-black/5 bg-cream/50 opacity-70"
                    : "border-black/5 bg-cream")
                }
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                    style={{ background: SOORT_KLEUR[it.soort] }}
                  >
                    {SOORT_LABEL[it.soort] ?? it.soort}
                  </span>
                  <span className="rounded-full border border-black/10 bg-white px-2.5 py-0.5 text-xs font-semibold text-ink/60">
                    {toolLabel(it.tool || "dashboard")}
                  </span>
                  {it.categorie && (
                    <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-medium text-ink/55">
                      {it.categorie}
                    </span>
                  )}
                  <span className="text-sm font-semibold text-ink">
                    {it.voornaam || "Leerkracht"}
                  </span>
                  {it.email && (
                    <a
                      href={`mailto:${it.email}?subject=Je feedback over Avinka`}
                      className="text-sm text-brand underline-offset-2 hover:underline"
                    >
                      {it.email}
                    </a>
                  )}
                  <span className="ml-auto text-xs text-ink/45">{datum(it.created_at)}</span>
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink/80">{it.bericht}</p>

                <div className="mt-3 flex items-center justify-between gap-3">
                  {it.pagina ? (
                    <span className="text-xs text-ink/40">📍 {it.pagina}</span>
                  ) : (
                    <span />
                  )}
                  <button
                    onClick={() => wissel(it)}
                    className={
                      "shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition " +
                      (it.status === "nieuw"
                        ? "bg-ink text-white hover:bg-ink/80"
                        : "border border-black/10 text-ink/60 hover:text-ink")
                    }
                  >
                    {it.status === "nieuw" ? "Markeer afgehandeld" : "↩ Terug naar nieuw"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ToolChip({ label, actief, onClick }: { label: string; actief: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full px-3 py-1.5 text-sm font-semibold transition " +
        (actief ? "bg-ink text-white" : "bg-cream text-ink/60 hover:text-ink")
      }
    >
      {label}
    </button>
  );
}

function Stat({ label, waarde, accent = false }: { label: string; waarde: number; accent?: boolean }) {
  return (
    <div className={"rounded-2xl border p-4 " + (accent ? "border-brand/30 bg-brand-soft" : "border-black/5 bg-cream")}>
      <p className={"font-serif text-3xl font-semibold " + (accent ? "text-brand" : "text-ink")}>{waarde}</p>
      <p className="mt-0.5 text-sm text-ink/60">{label}</p>
    </div>
  );
}

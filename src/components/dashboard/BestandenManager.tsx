"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import {
  getBestanden,
  addMap,
  addTekstBestand,
  updateBestand,
  deleteBestand,
  nlDatum,
  type Bestand,
} from "@/lib/db";

const ICON: Record<string, string> = {
  map: "📁",
  tekst: "📄",
  plattegrond: "🗺️",
  les: "📚",
  draaiboek: "🎉",
};

// Een bestand dat met mij gedeeld is (voor de "Gedeeld met mij"-tab).
type Gedeeld = {
  id: string;
  naam: string;
  tool: string | null;
  type: string;
  updated_at: string;
  rol: string;
};

function typeOrder(t: string): number {
  return t === "map" ? 0 : t === "plattegrond" ? 1 : 2;
}

// De korte omschrijving die bij een opgeslagen les hoort (zit in data.omschrijving).
function lesOmschrijving(data: unknown): string {
  if (data && typeof data === "object" && "omschrijving" in data) {
    const o = (data as { omschrijving?: unknown }).omschrijving;
    return typeof o === "string" ? o : "";
  }
  return "";
}

type ModalState =
  | { soort: "nieuwemap"; waarde: string }
  | { soort: "hernoem"; waarde: string; bestand: Bestand }
  | { soort: "verwijder"; bestand: Bestand }
  | null;

export default function BestandenManager() {
  const [bestanden, setBestanden] = useState<Bestand[]>([]);
  const [geladen, setGeladen] = useState(false);
  const [mapId, setMapId] = useState<string | null>(null); // huidige map (null = wortel)
  const [formOpen, setFormOpen] = useState(false);
  const [titel, setTitel] = useState("");
  const [tekst, setTekst] = useState("");
  const [bekijk, setBekijk] = useState<Bestand | null>(null);
  const [gekopieerd, setGekopieerd] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [tab, setTab] = useState<"mijn" | "gedeeld">("mijn");
  const [gedeeld, setGedeeld] = useState<Gedeeld[]>([]);
  const [gedeeldGeladen, setGedeeldGeladen] = useState(false);

  async function herlaad() {
    setBestanden(await getBestanden());
  }

  async function laadGedeeld() {
    try {
      const r = await fetch("/api/draaiboek/gedeeld-met-mij");
      const j = await r.json();
      setGedeeld(Array.isArray(j.bestanden) ? j.bestanden : []);
    } catch {
      setGedeeld([]);
    }
    setGedeeldGeladen(true);
  }

  useEffect(() => {
    // Geopend met ?map=… (terugkomend vanuit een les) → meteen die map openen.
    try {
      const m = new URLSearchParams(window.location.search).get("map");
      if (m) setMapId(m);
    } catch {
      /* geen window/param → wortel */
    }
    (async () => {
      await herlaad();
      setGeladen(true);
    })();
  }, []);

  // Inhoud van de huidige map (mappen eerst, daarna plattegronden, dan teksten)
  const kinderen = useMemo(
    () =>
      bestanden
        .filter((b) => (b.parent_id ?? null) === mapId)
        .sort(
          (a, b) =>
            typeOrder(a.type) - typeOrder(b.type) ||
            (a.created_at < b.created_at ? 1 : -1),
        ),
    [bestanden, mapId],
  );

  // Broodkruimels: van de huidige map omhoog naar de wortel
  const pad = useMemo(() => {
    const arr: Bestand[] = [];
    let cur = mapId;
    const byId = new Map(bestanden.map((b) => [b.id, b]));
    while (cur) {
      const b = byId.get(cur);
      if (!b) break;
      arr.unshift(b);
      cur = b.parent_id ?? null;
    }
    return arr;
  }, [bestanden, mapId]);

  function nieuweMap() {
    setModal({ soort: "nieuwemap", waarde: "" });
  }

  async function voerModalUit() {
    if (!modal) return;
    if (modal.soort === "nieuwemap") {
      const naam = modal.waarde.trim();
      if (!naam) return;
      const m = await addMap(naam, mapId);
      if (m) setBestanden((x) => [m, ...x]);
    } else if (modal.soort === "hernoem") {
      const naam = modal.waarde.trim();
      const b = modal.bestand;
      if (naam && naam !== b.naam) {
        const ok = await updateBestand(b.id, { naam });
        if (ok) {
          setBestanden((x) => x.map((i) => (i.id === b.id ? { ...i, naam } : i)));
          if (bekijk?.id === b.id) setBekijk({ ...bekijk, naam });
        }
      }
    } else if (modal.soort === "verwijder") {
      const b = modal.bestand;
      await deleteBestand(b.id);
      if (bekijk?.id === b.id) setBekijk(null);
      await herlaad();
    }
    setModal(null);
  }

  async function tekstBewaren() {
    if (!tekst.trim()) return;
    const b = await addTekstBestand(titel.trim() || "Naamloze tekst", tekst.trim(), mapId);
    if (b) setBestanden((x) => [b, ...x]);
    setTitel("");
    setTekst("");
    setFormOpen(false);
  }

  function hernoem(b: Bestand) {
    setModal({ soort: "hernoem", waarde: b.naam, bestand: b });
  }

  function verwijder(b: Bestand) {
    setModal({ soort: "verwijder", bestand: b });
  }

  async function kopieer(b: Bestand) {
    try {
      await navigator.clipboard.writeText(b.inhoud ?? "");
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2000);
    } catch {
      /* niet beschikbaar */
    }
  }

  if (!geladen) return null;

  // Een opgeslagen les direct als Word downloaden — via de gedeelde generator
  // (avinka-lesdocx.js), zonder dat er een tabblad opent. Lukt dat (nog) niet,
  // dan vallen we terug op de tool die zelf downloadt en sluit.
  async function downloadLesBestand(b: Bestand) {
    const w = window as unknown as {
      avinkaLesDocx?: {
        download: (tekst: string, meta: unknown, naam?: string) => Promise<void>;
      };
    };
    try {
      const r = await fetch(`/api/bestanden?id=${b.id}`, {
        headers: { accept: "application/json" },
      });
      if (r.ok) {
        const rij = await r.json();
        const data = rij?.data as { tekst?: string; meta?: unknown } | null;
        if (data?.tekst && w.avinkaLesDocx) {
          const naam =
            (b.naam || "lesontwerp").replace(/[\\/:*?"<>|]+/g, "-") + ".docx";
          await w.avinkaLesDocx.download(data.tekst, data.meta ?? {}, naam);
          return;
        }
      }
    } catch {
      /* val terug op de tool-route hieronder */
    }
    window.open(`/tools/lesontwerp.html?bestand=${b.id}&download=1`);
  }

  return (
    <div className="flex flex-col gap-6">
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
        strategy="lazyOnload"
      />
      <Script src="/avinka-lesdocx.js" strategy="lazyOnload" />

      {/* Tabs: eigen bestanden vs. gedeeld met mij */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("mijn")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "mijn" ? "bg-brand text-white shadow-sm shadow-brand/20" : "border border-black/10 bg-white text-ink/60 hover:text-ink"}`}
        >
          🗂️ Mijn bestanden
        </button>
        <button
          onClick={() => {
            setTab("gedeeld");
            if (!gedeeldGeladen) laadGedeeld();
          }}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "gedeeld" ? "bg-brand text-white shadow-sm shadow-brand/20" : "border border-black/10 bg-white text-ink/60 hover:text-ink"}`}
        >
          🤝 Gedeeld met mij
        </button>
      </div>

      {tab === "mijn" && (
        <>
      {/* Broodkruimels + acties */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
        <nav className="flex flex-wrap items-center gap-1 text-sm font-semibold">
          <button
            onClick={() => setMapId(null)}
            className={`rounded-lg px-2 py-1 transition hover:bg-cream ${mapId === null ? "text-ink" : "text-ink/55"}`}
          >
            🗂️ Bestanden
          </button>
          {pad.map((m) => (
            <span key={m.id} className="flex items-center gap-1">
              <span className="text-ink/30">›</span>
              <button
                onClick={() => setMapId(m.id)}
                className={`rounded-lg px-2 py-1 transition hover:bg-cream ${m.id === mapId ? "text-ink" : "text-ink/55"}`}
              >
                {m.naam}
              </button>
            </span>
          ))}
        </nav>
        <div className="ml-auto flex gap-2">
          <button
            onClick={nieuweMap}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-brand hover:text-brand"
          >
            + Nieuwe map
          </button>
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-dark"
          >
            + Tekst bewaren
          </button>
        </div>
      </div>

      {/* Tekst-formulier */}
      {formOpen && (
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <label htmlFor="t-titel" className="block text-sm font-bold text-ink">
            Titel <span className="font-normal text-ink/50">(zodat je 'm terugvindt)</span>
          </label>
          <input
            id="t-titel"
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            placeholder="Bijv. Weekbericht-template"
            className="mt-1.5 w-full max-w-md rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <label htmlFor="t-tekst" className="mt-4 block text-sm font-bold text-ink">
            De tekst
          </label>
          <textarea
            id="t-tekst"
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            rows={6}
            placeholder="Plak hier de tekst die je wilt bewaren…"
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <div className="mt-4 flex gap-3">
            <button
              onClick={tekstBewaren}
              className="rounded-2xl bg-brand px-6 py-2.5 text-base font-bold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-dark"
            >
              Bewaren
            </button>
            <button
              onClick={() => {
                setFormOpen(false);
                setTitel("");
                setTekst("");
              }}
              className="rounded-2xl border border-black/10 px-5 py-2.5 text-sm font-semibold text-ink/60 transition hover:text-ink"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Inhoud van de map */}
      {kinderen.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-black/15 bg-white/60 p-10 text-center">
          <span className="text-4xl">🗂️</span>
          <h2 className="mt-3 text-lg font-bold text-ink">Deze map is nog leeg</h2>
          <p className="mx-auto mt-2 max-w-md leading-7 text-ink/65">
            Maak een map, bewaar een tekst, of sla vanuit Plattegrond een plattegrond op —
            die belandt in <strong>Mijn plattegrond</strong>.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kinderen.map((b) => (
            <li
              key={b.id}
              className="group flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3 shadow-sm transition hover:border-brand/30 hover:shadow-md"
            >
              <button
                onClick={() => {
                  if (b.type === "map") setMapId(b.id);
                  else if (b.type === "tekst") setBekijk(b);
                  else if (b.type === "les")
                    window.location.href = `/tools/lesontwerp.html?bestand=${b.id}${mapId ? `&map=${mapId}` : ""}`;
                  else window.open(`/tools/plattegrond.html?bestand=${b.id}`, "_blank");
                }}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="text-2xl">{ICON[b.type] ?? "📄"}</span>
                <span className="min-w-0">
                  <span className="block truncate font-bold text-ink">{b.naam}</span>
                  <span className="block truncate text-xs text-ink/45">
                    {b.type === "map"
                      ? `${bestanden.filter((x) => x.parent_id === b.id).length} items`
                      : b.type === "les"
                        ? lesOmschrijving(b.data) ||
                          `Lesontwerp · ${nlDatum(b.updated_at)}`
                        : `${b.type === "plattegrond" ? "Plattegrond" : "Tekst"} · ${nlDatum(b.updated_at)}`}
                  </span>
                </span>
              </button>

              <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                {b.type === "plattegrond" && (
                  <a
                    href={`/tools/plattegrond.html?bestand=${b.id}&print=1`}
                    target="_blank"
                    title="Printen"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/45 transition hover:bg-cream hover:text-brand"
                  >
                    🖨
                  </a>
                )}
                {b.type === "les" && (
                  <button
                    onClick={() => downloadLesBestand(b)}
                    title="Downloaden als Word"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/45 transition hover:bg-cream hover:text-brand"
                  >
                    ⬇
                  </button>
                )}
                <button
                  onClick={() => hernoem(b)}
                  title="Hernoemen"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/45 transition hover:bg-cream hover:text-brand"
                >
                  ✏️
                </button>
                <button
                  onClick={() => verwijder(b)}
                  title="Verwijderen"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/45 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  🗑
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
        </>
      )}

      {tab === "gedeeld" && (
        <div>
          {!gedeeldGeladen ? (
            <div className="rounded-3xl border border-dashed border-black/15 bg-white/60 p-10 text-center text-ink/60">
              Laden…
            </div>
          ) : gedeeld.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-black/15 bg-white/60 p-10 text-center">
              <span className="text-4xl">🤝</span>
              <h2 className="mt-3 text-lg font-bold text-ink">Nog niets met je gedeeld</h2>
              <p className="mx-auto mt-2 max-w-md leading-7 text-ink/65">
                Zodra een collega een draaiboek met jouw e-mailadres deelt, verschijnt het hier.
                Jullie werken dan samen aan hetzelfde bestand.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {gedeeld.map((g) => (
                <li
                  key={g.id}
                  className="group flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3 shadow-sm transition hover:border-brand/30 hover:shadow-md"
                >
                  <button
                    onClick={() => {
                      window.location.href = `/tools/${g.tool || "draaiboek"}.html?bestand=${g.id}`;
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="text-2xl">{ICON[g.type] ?? "📄"}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-ink">{g.naam}</span>
                      <span className="block truncate text-xs text-ink/45">
                        {g.rol === "bewerken" ? "Mag bewerken" : "Alleen lezen"} ·{" "}
                        {nlDatum(g.updated_at)}
                      </span>
                    </span>
                  </button>
                  <span className="shrink-0 rounded-lg bg-cream px-2 py-1 text-xs font-semibold text-ink/50">
                    gedeeld
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Tekst bekijken */}
      {bekijk && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-ink/45 p-4 sm:p-8"
          onClick={() => setBekijk(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-serif text-2xl font-semibold text-ink">{bekijk.naam}</h3>
              <button
                onClick={() => setBekijk(null)}
                aria-label="Sluiten"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-xl text-ink/50 transition hover:text-ink"
              >
                ✕
              </button>
            </div>
            <p className="mt-4 max-h-[55vh] overflow-auto whitespace-pre-wrap rounded-2xl bg-cream p-4 text-sm leading-7 text-ink/80">
              {bekijk.inhoud}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => kopieer(bekijk)}
                className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-dark"
              >
                {gekopieerd ? "✓ Gekopieerd" : "Kopiëren"}
              </button>
              <button
                onClick={() => printTekst(bekijk)}
                className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-semibold text-ink/70 transition hover:border-brand hover:text-brand"
              >
                🖨 Printen
              </button>
              <button
                onClick={() => hernoem(bekijk)}
                className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-semibold text-ink/70 transition hover:border-brand hover:text-brand"
              >
                Hernoemen
              </button>
              <button
                onClick={() => verwijder(bekijk)}
                className="ml-auto rounded-xl px-4 py-2.5 text-sm font-semibold text-ink/45 transition hover:text-rose-600"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Naam invoeren / verwijderen — eigen scherm i.p.v. browser-melding */}
      {modal && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-auto bg-ink/45 p-4 sm:p-8"
          onClick={() => setModal(null)}
        >
          <div
            className="mt-[12vh] w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {modal.soort === "verwijder" ? (
              <>
                <h3 className="font-serif text-xl font-semibold text-ink">Verwijderen?</h3>
                <p className="mt-2 text-sm leading-6 text-ink/70">
                  {modal.bestand.type === "map" ? (
                    <>
                      De map <strong>{modal.bestand.naam}</strong> en alles wat erin staat wordt
                      verwijderd.
                    </>
                  ) : (
                    <>
                      <strong>{modal.bestand.naam}</strong> wordt verwijderd.
                    </>
                  )}
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setModal(null)}
                    className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-ink/60 transition hover:text-ink"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={voerModalUit}
                    className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700"
                  >
                    Verwijderen
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-serif text-xl font-semibold text-ink">
                  {modal.soort === "nieuwemap" ? "Nieuwe map" : "Hernoemen"}
                </h3>
                <input
                  autoFocus
                  value={modal.waarde}
                  onChange={(e) => setModal({ ...modal, waarde: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      voerModalUit();
                    }
                  }}
                  placeholder={modal.soort === "nieuwemap" ? "Naam van de map" : "Nieuwe naam"}
                  className="mt-3 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setModal(null)}
                    className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-ink/60 transition hover:text-ink"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={voerModalUit}
                    className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-dark"
                  >
                    Bewaren
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Print één tekst via een tijdelijk venster (zonder de dashboard-opmaak).
function printTekst(b: Bestand) {
  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) return;
  const esc = (s: string) =>
    s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);
  w.document.write(
    `<html><head><title>${esc(b.naam)}</title><style>` +
      `body{font-family:Georgia,'Times New Roman',serif;max-width:640px;margin:40px auto;padding:0 24px;color:#1a1a2e;line-height:1.7;}` +
      `h1{font-size:22px;margin-bottom:18px;}p{white-space:pre-wrap;}</style></head><body>` +
      `<h1>${esc(b.naam)}</h1><p>${esc(b.inhoud ?? "")}</p>` +
      `<script>window.onload=function(){window.print();}<\/script></body></html>`,
  );
  w.document.close();
}

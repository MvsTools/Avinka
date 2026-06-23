"use client";

import { useEffect, useRef, useState } from "react";
import {
  getBouwTaken,
  addBouwTaak,
  setBouwTaakGedaan,
  updateBouwTaakTekst,
  setBouwTaakPrioriteit,
  deleteBouwTaak,
  wisAfgevinkteBouwTaken,
  type BouwTaak,
  type BouwCategorie,
  type Prioriteit,
} from "@/lib/db";

// Bouw-backlog voor de admin: "wat wil ik nog bouwen voor de website". Opgesplitst
// in drie tabbladen — Algemeen, Tools en Kleine aanpassingen — elk met een eigen
// lijst en voortgang. Per item een prioriteit (Hoog/Normaal/Laag) om te bepalen
// wat eerst moet.
const CATEGORIEEN: { id: BouwCategorie; label: string; leeg: string }[] = [
  { id: "algemeen", label: "Algemeen", leeg: "Grote plannen voor het platform." },
  { id: "tools", label: "Tools", leeg: "Ideeën voor de tools (nieuw of beter)." },
  { id: "klein", label: "Kleine aanpassingen", leeg: "Kleine fixes en finetuning." },
];

export default function AdminBouwlijst() {
  const [taken, setTaken] = useState<BouwTaak[] | null>(null);
  const [actief, setActief] = useState<BouwCategorie>("algemeen");
  const [invoer, setInvoer] = useState("");
  const [bewerkId, setBewerkId] = useState<string | null>(null);
  const [bewerkTekst, setBewerkTekst] = useState("");
  const [toonAf, setToonAf] = useState(true);
  const invoerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getBouwTaken().then(setTaken);
  }, []);

  async function voegToe(e: React.FormEvent) {
    e.preventDefault();
    const t = capitaliseer(invoer.trim());
    if (!t) return;
    setInvoer("");
    const nieuw = await addBouwTaak(t, actief);
    if (nieuw) setTaken((ts) => [nieuw, ...(ts ?? [])]);
    invoerRef.current?.focus();
  }

  function toggle(taak: BouwTaak) {
    const gedaan = !taak.gedaan;
    setTaken((ts) =>
      (ts ?? []).map((t) =>
        t.id === taak.id ? { ...t, gedaan, gedaan_op: gedaan ? new Date().toISOString() : null } : t,
      ),
    );
    setBouwTaakGedaan(taak.id, gedaan);
  }

  function cyclePrio(taak: BouwTaak) {
    const nieuw = PRIO_CYCLE[taak.prioriteit];
    setTaken((ts) => (ts ?? []).map((t) => (t.id === taak.id ? { ...t, prioriteit: nieuw } : t)));
    setBouwTaakPrioriteit(taak.id, nieuw);
  }

  function verwijder(id: string) {
    setTaken((ts) => (ts ?? []).filter((t) => t.id !== id));
    deleteBouwTaak(id);
  }

  function startBewerk(t: BouwTaak) {
    setBewerkId(t.id);
    setBewerkTekst(t.tekst);
  }
  async function bewaarBewerk() {
    const id = bewerkId;
    const tekst = capitaliseer(bewerkTekst.trim());
    setBewerkId(null);
    if (!id || !tekst) return;
    setTaken((ts) => (ts ?? []).map((t) => (t.id === id ? { ...t, tekst } : t)));
    await updateBouwTaakTekst(id, tekst);
  }

  async function wisAf() {
    setTaken((ts) => (ts ?? []).filter((t) => !(t.gedaan && t.categorie === actief)));
    await wisAfgevinkteBouwTaken(actief);
  }

  if (!taken) {
    return <div className="h-64 max-w-2xl animate-pulse rounded-3xl border border-black/5 bg-white/60" />;
  }

  const inCat = taken.filter((t) => t.categorie === actief);
  const open = inCat
    .filter((t) => !t.gedaan)
    .sort((a, b) => {
      const p = PRIO_VOLGORDE[a.prioriteit] - PRIO_VOLGORDE[b.prioriteit];
      if (p !== 0) return p;
      return b.created_at.localeCompare(a.created_at);
    });
  const af = inCat
    .filter((t) => t.gedaan)
    .sort((a, b) => (b.gedaan_op ?? "").localeCompare(a.gedaan_op ?? ""));
  const total = open.length + af.length;

  // Aantal openstaande items per categorie (voor de badges op de tabbladen).
  const openPerCat = (c: BouwCategorie) => taken.filter((t) => t.categorie === c && !t.gedaan).length;

  return (
    <div className="flex max-w-2xl flex-col gap-3">
      {/* Tabbladen */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-black/5 bg-white p-1.5">
        {CATEGORIEEN.map((c) => {
          const aan = c.id === actief;
          const n = openPerCat(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActief(c.id)}
              className={
                "flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition " +
                (aan ? "bg-ink text-white shadow-sm" : "text-ink/65 hover:bg-cream")
              }
            >
              {c.label}
              {n > 0 && (
                <span
                  className={
                    "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold " +
                    (aan ? "bg-white/20 text-white" : "bg-cream text-ink/60")
                  }
                >
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl border border-black/5 bg-white shadow-sm">
        {/* Voortgang */}
        <div className="flex items-center gap-3 border-b border-black/5 px-5 py-4 sm:px-6">
          <Ring done={af.length} total={total} />
          <div>
            <p className="font-bold leading-tight text-ink">
              {open.length === 0
                ? total === 0
                  ? "Nog niets hier"
                  : "Alles gebouwd 🎉"
                : `${open.length} te bouwen`}
            </p>
            <p className="text-xs text-ink/50">
              {total > 0
                ? `${af.length} van ${total} afgerond`
                : CATEGORIEEN.find((c) => c.id === actief)?.leeg}
            </p>
          </div>
        </div>

        {/* Toevoegen */}
        <form
          onSubmit={voegToe}
          className="flex items-center gap-2 border-b border-black/5 px-4 py-3 sm:px-5"
        >
          <input
            ref={invoerRef}
            value={invoer}
            onChange={(e) => setInvoer(e.target.value)}
            placeholder="Wat wil je nog bouwen? Typ en druk op Enter…"
            className="flex-1 rounded-xl bg-cream px-4 py-2.5 text-ink outline-none transition placeholder:text-ink/45 focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="submit"
            disabled={!invoer.trim()}
            className="shrink-0 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            Toevoegen
          </button>
        </form>

        {/* Open taken */}
        {open.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-ink/50">
            {total === 0
              ? "Typ hierboven je eerste bouwplan en druk op Enter."
              : "Niets meer op de planning. Sterk werk!"}
          </p>
        ) : (
          <ul>
            {open.map((t) => (
              <li
                key={t.id}
                className="group flex items-center gap-2.5 border-b border-black/5 px-5 py-3 transition last:border-0 hover:bg-cream/40 sm:px-6"
              >
                <Rondje gedaan={false} onClick={() => toggle(t)} />
                {bewerkId === t.id ? (
                  <input
                    autoFocus
                    value={bewerkTekst}
                    onChange={(e) => setBewerkTekst(e.target.value)}
                    onBlur={bewaarBewerk}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") bewaarBewerk();
                      if (e.key === "Escape") setBewerkId(null);
                    }}
                    className="flex-1 rounded-lg border border-brand/30 bg-cream px-2 py-1 text-ink outline-none focus:ring-2 focus:ring-brand/20"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startBewerk(t)}
                    className="flex-1 cursor-text text-left text-ink"
                    title="Klik om te bewerken"
                  >
                    {t.tekst}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => cyclePrio(t)}
                  title="Prioriteit wijzigen"
                  className={
                    "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition " +
                    PRIO_STIJL[t.prioriteit]
                  }
                >
                  {PRIO_LABEL[t.prioriteit]}
                </button>
                <button
                  type="button"
                  onClick={() => verwijder(t.id)}
                  aria-label="Verwijderen"
                  className="shrink-0 rounded-lg px-1 text-lg text-ink/25 transition hover:text-rose-500"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Afgerond: subtiel apart kaartje eronder */}
      {af.length > 0 && (
        <div className="rounded-3xl border border-black/5 bg-cream/40">
          <div className="flex items-center justify-between px-5 py-2.5 sm:px-6">
            <button
              type="button"
              onClick={() => setToonAf((v) => !v)}
              className="flex items-center gap-2 text-sm font-bold text-ink/55 transition hover:text-ink"
            >
              <span className={"text-xs transition " + (toonAf ? "rotate-90" : "")}>▸</span>
              Afgerond ({af.length})
            </button>
            <button
              type="button"
              onClick={wisAf}
              className="text-xs font-semibold text-ink/40 transition hover:text-rose-500"
            >
              Wissen
            </button>
          </div>
          {toonAf && (
            <ul>
              {af.map((t) => (
                <li
                  key={t.id}
                  className="group flex items-center gap-3 border-t border-black/5 px-5 py-2.5 sm:px-6"
                >
                  <Rondje gedaan onClick={() => toggle(t)} />
                  <span className="flex-1 text-ink/45 line-through">{t.tekst}</span>
                  <button
                    type="button"
                    onClick={() => verwijder(t.id)}
                    aria-label="Verwijderen"
                    className="shrink-0 rounded-lg px-1.5 text-lg text-ink/25 transition hover:text-rose-500"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// Prioriteit: volgorde voor sortering, kleur en label, en de klik-cyclus.
const PRIO_VOLGORDE: Record<Prioriteit, number> = { hoog: 0, normaal: 1, laag: 2 };
const PRIO_LABEL: Record<Prioriteit, string> = { hoog: "Hoog", normaal: "Normaal", laag: "Laag" };
const PRIO_CYCLE: Record<Prioriteit, Prioriteit> = { normaal: "hoog", hoog: "laag", laag: "normaal" };
const PRIO_STIJL: Record<Prioriteit, string> = {
  hoog: "border-rose-200 bg-rose-50 text-rose-600",
  normaal: "border-black/10 bg-cream text-ink/55",
  laag: "border-black/10 bg-cream text-ink/35",
};

// Voortgangsring: vult groen op naarmate je meer afrondt.
function Ring({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? done / total : 0;
  const r = 11;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 28 28" className="h-9 w-9 shrink-0" aria-hidden>
      <circle cx="14" cy="14" r={r} fill="none" stroke="rgba(0,0,0,0.09)" strokeWidth="3" />
      <circle
        cx="14"
        cy="14"
        r={r}
        fill="none"
        className="text-brand"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 14 14)"
      />
    </svg>
  );
}

// Het afvinkrondje: leeg = nog te doen, groen vinkje = gedaan.
function Rondje({ gedaan, onClick }: { gedaan: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={gedaan ? "Markeer als niet gedaan" : "Afvinken"}
      className={
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition " +
        (gedaan
          ? "border-brand bg-brand text-white"
          : "border-ink/25 text-transparent hover:border-brand hover:text-brand/40")
      }
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
    </button>
  );
}

// Eerste letter een hoofdletter geven.
function capitaliseer(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

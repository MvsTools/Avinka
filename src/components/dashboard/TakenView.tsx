"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  getTaken,
  addTaak,
  setTaakGedaan,
  setTaakDeadline,
  setTaakWekelijks,
  updateTaakTekst,
  deleteTaak,
  wisAfgevinkteTaken,
  type Taak,
} from "@/lib/db";

// Persoonlijke takenlijst in de look van een echte to-do-app: één paneel met
// voortgangsring, een toevoeg-regel en taken als lijstregels. Typ een taak,
// vink 'm af, klaar. Alles staat privé in je eigen account.
export default function TakenView() {
  const [taken, setTaken] = useState<Taak[] | null>(null);
  const [invoer, setInvoer] = useState("");
  const [bewerkId, setBewerkId] = useState<string | null>(null);
  const [bewerkTekst, setBewerkTekst] = useState("");
  const [toonAf, setToonAf] = useState(true);
  const [toonGepland, setToonGepland] = useState(false);
  const [netGedaan, setNetGedaan] = useState<Set<string>>(new Set());
  const invoerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getTaken().then((ts) => {
      // Wekelijkse taken die méér dan een week te laat zijn: gemiste weken overslaan,
      // zodat er niet meerdere keren "Te laat" van dezelfde taak op de lijst blijft staan.
      const gecorrigeerd = ts.map((t) => {
        if (t.wekelijks && t.deadline && dagenTot(t.deadline) <= -7) {
          const nieuw = collapseWekelijks(t.deadline);
          if (nieuw !== t.deadline) {
            setTaakDeadline(t.id, nieuw);
            return { ...t, deadline: nieuw };
          }
        }
        return t;
      });
      setTaken(gecorrigeerd);
    });
  }, []);

  async function voegToe(e: React.FormEvent) {
    e.preventDefault();
    const t = capitaliseer(invoer.trim());
    if (!t) return;
    setInvoer("");
    const nieuw = await addTaak(t);
    if (nieuw) setTaken((ts) => [nieuw, ...(ts ?? [])]);
    invoerRef.current?.focus();
  }

  function toggle(taak: Taak) {
    // Wekelijkse taak afvinken = niet "klaar", maar doorschuiven naar de
    // eerstvolgende keer in de toekomst (één klik, ook bij achterstand).
    if (taak.wekelijks && !taak.gedaan) {
      const nieuw = volgendeWekelijkse(taak.deadline);
      setTaken((ts) => (ts ?? []).map((t) => (t.id === taak.id ? { ...t, deadline: nieuw } : t)));
      setTaakDeadline(taak.id, nieuw);
      // korte groene flits als bevestiging
      setNetGedaan((s) => new Set(s).add(taak.id));
      setTimeout(() => {
        setNetGedaan((s) => {
          const n = new Set(s);
          n.delete(taak.id);
          return n;
        });
      }, 850);
      return;
    }
    const gedaan = !taak.gedaan;
    setTaken((ts) =>
      (ts ?? []).map((t) =>
        t.id === taak.id ? { ...t, gedaan, gedaan_op: gedaan ? new Date().toISOString() : null } : t,
      ),
    );
    setTaakGedaan(taak.id, gedaan);
  }

  function verwijder(id: string) {
    setTaken((ts) => (ts ?? []).filter((t) => t.id !== id));
    deleteTaak(id);
  }

  function setDeadline(taak: Taak, deadline: string | null) {
    setTaken((ts) => (ts ?? []).map((t) => (t.id === taak.id ? { ...t, deadline } : t)));
    setTaakDeadline(taak.id, deadline);
  }

  function setWekelijks(taak: Taak, wekelijks: boolean) {
    setTaken((ts) => (ts ?? []).map((t) => (t.id === taak.id ? { ...t, wekelijks } : t)));
    setTaakWekelijks(taak.id, wekelijks);
  }

  function startBewerk(t: Taak) {
    setBewerkId(t.id);
    setBewerkTekst(t.tekst);
  }
  async function bewaarBewerk() {
    const id = bewerkId;
    const tekst = capitaliseer(bewerkTekst.trim());
    setBewerkId(null);
    if (!id || !tekst) return;
    setTaken((ts) => (ts ?? []).map((t) => (t.id === id ? { ...t, tekst } : t)));
    await updateTaakTekst(id, tekst);
  }

  async function wisAf() {
    setTaken((ts) => (ts ?? []).filter((t) => !t.gedaan));
    await wisAfgevinkteTaken();
  }

  if (!taken) {
    return <div className="mx-auto h-64 max-w-2xl animate-pulse rounded-3xl border border-black/5 bg-white/60" />;
  }

  // Een wekelijkse taak die nog ruim vóór z'n deadline ligt is "gepland": die
  // verschijnt pas 2 dagen van tevoren in de actieve lijst. (Tijdens de groene
  // flits na afvinken houden we 'm nog heel even zichtbaar.)
  const verstopt = (t: Taak) =>
    t.wekelijks && !!t.deadline && !netGedaan.has(t.id) && dagenTot(t.deadline) > 2;

  const open = taken
    .filter((t) => !t.gedaan && !verstopt(t))
    .sort((a, b) => {
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return b.created_at.localeCompare(a.created_at);
    });
  const gepland = taken
    .filter((t) => !t.gedaan && verstopt(t))
    .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""));
  const af = taken
    .filter((t) => t.gedaan)
    .sort((a, b) => (b.gedaan_op ?? "").localeCompare(a.gedaan_op ?? ""));
  // Voortgang telt alleen actieve + afgevinkte taken; geplande herhalingen niet.
  const total = open.length + af.length;

  // Eén taakregel; hergebruikt voor de actieve lijst én de Gepland-sectie.
  function regel(t: Taak) {
    const tl = toolLink(t.tekst);
    const flits = netGedaan.has(t.id);
    return (
      <li
        key={t.id}
        className={
          "group flex items-center gap-2.5 border-b border-black/5 px-5 py-3 transition last:border-0 sm:px-6 " +
          (flits ? "bg-emerald-50" : "hover:bg-cream/40")
        }
      >
        <Rondje gedaan={flits} onClick={() => toggle(t)} />
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
        {tl && (
          <Link
            href={tl.href}
            title={`Openen in ${tl.naam}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand transition hover:bg-brand/15"
          >
            <span>{tl.emoji}</span>
            <span className="hidden sm:inline">{tl.naam}</span>
            <span aria-hidden>→</span>
          </Link>
        )}
        <DeadlinePicker
          taak={t}
          onSetDeadline={(v) => setDeadline(t, v)}
          onSetWekelijks={(v) => setWekelijks(t, v)}
        />
        <button
          type="button"
          onClick={() => verwijder(t.id)}
          aria-label="Verwijderen"
          className="shrink-0 rounded-lg px-1 text-lg text-ink/25 transition hover:text-rose-500"
        >
          ✕
        </button>
      </li>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      <div className="rounded-3xl border border-black/5 bg-white shadow-sm">
        {/* Voortgang */}
        <div className="flex items-center gap-3 border-b border-black/5 px-5 py-4 sm:px-6">
          <Ring done={af.length} total={total} />
          <div>
            <p className="font-bold leading-tight text-ink">
              {open.length === 0
                ? total === 0
                  ? "Nog geen taken"
                  : "Alles afgevinkt 🎉"
                : `${open.length} te doen`}
            </p>
            {total > 0 && (
              <p className="text-xs text-ink/50">
                {af.length} van {total} afgevinkt
              </p>
            )}
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
            placeholder="Wat moet er gebeuren? Typ en druk op Enter…"
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
            {total === 0 ? "Typ hierboven je eerste taak en druk op Enter." : "Niets meer te doen. Lekker bezig!"}
          </p>
        ) : (
          <ul>{open.map(regel)}</ul>
        )}

        {/* Gepland: wekelijkse taken die later terugkomen (2 dagen van tevoren) */}
        {gepland.length > 0 && (
          <div className="border-t border-black/5">
            <button
              type="button"
              onClick={() => setToonGepland((v) => !v)}
              className="flex w-full items-center gap-2 px-5 py-2.5 text-left text-sm font-bold text-ink/55 transition hover:text-ink sm:px-6"
            >
              <span className={"text-xs transition " + (toonGepland ? "rotate-90" : "")}>▸</span>
              Gepland ({gepland.length})
              <span className="text-xs font-normal text-ink/40">· verschijnt 2 dagen van tevoren</span>
            </button>
            {toonGepland && <ul>{gepland.map(regel)}</ul>}
          </div>
        )}
      </div>

      {/* Afgevinkt: subtiel apart kaartje onder het hoofdpaneel */}
      {af.length > 0 && (
        <div className="rounded-3xl border border-black/5 bg-cream/40">
            <div className="flex items-center justify-between px-5 py-2.5 sm:px-6">
              <button
                type="button"
                onClick={() => setToonAf((v) => !v)}
                className="flex items-center gap-2 text-sm font-bold text-ink/55 transition hover:text-ink"
              >
                <span className={"text-xs transition " + (toonAf ? "rotate-90" : "")}>▸</span>
                Afgevinkt ({af.length})
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

// Voortgangsring: vult groen op naarmate je meer afvinkt.
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

// Datum als YYYY-MM-DD (lokale tijd).
function isoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Aantal dagen tot een deadline (negatief = te laat).
function dagenTot(iso: string): number {
  const vandaag = new Date();
  vandaag.setHours(0, 0, 0, 0);
  return Math.round((new Date(iso + "T00:00:00").getTime() - vandaag.getTime()) / 86400000);
}

// Wekelijkse taak die méér dan een week te laat is: sla de gemiste weken over,
// zodat er hooguit dé keer van deze week overblijft (max 6 dagen te laat) en het
// niet opstapelt. Zelfde weekdag; blijft deze week zichtbaar als "Te laat".
function collapseWekelijks(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  while (dagenTot(isoDate(d)) <= -7) d.setDate(d.getDate() + 7);
  return isoDate(d);
}

// De eerstvolgende keer ná vandaag (voor het afvinken van een wekelijkse taak):
// minstens één week vooruit, en dan door tot de datum in de toekomst ligt — zo
// hoef je nooit meerdere keren te klikken om achterstand weg te werken.
function volgendeWekelijkse(iso: string | null): string {
  const d = iso ? new Date(iso + "T00:00:00") : new Date();
  do {
    d.setDate(d.getDate() + 7);
  } while (dagenTot(isoDate(d)) <= 0);
  return isoDate(d);
}

// Eerste letter een hoofdletter geven (ook al typte je 'm niet zelf).
function capitaliseer(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Slimme tool-/module-verwijzing. Herkent trefwoorden (incl. synoniemen én
// kleine typefouten) in de taaktekst en wijst naar de juiste tool/module.
// Eerste (meest specifieke) match wint, dus modules staan boven de tool.
type Verwijzing = { naam: string; href: string; emoji: string; woorden: string[] };
const VERWIJZINGEN: Verwijzing[] = [
  { naam: "Rapporten", emoji: "📝", href: "/tools/rapporten.html",
    woorden: ["rapport", "rapporten", "rapportje", "rapporttekst", "rapportage", "rapportcijfer", "getuigschrift"] },
  { naam: "Weekbericht", emoji: "🗓️", href: "/tools/oudercontact.html?m=weekbericht",
    woorden: ["weekbericht", "weekbrief", "weekupdate", "weekmail", "week bericht"] },
  { naam: "Nieuwsbrief", emoji: "📰", href: "/tools/oudercontact.html?m=nieuwsbrief",
    woorden: ["nieuwsbrief", "maandbrief", "infobrief", "schoolkrant"] },
  { naam: "Uitnodiging", emoji: "✉️", href: "/tools/oudercontact.html?m=uitnodiging",
    woorden: ["uitnodiging", "uitnodigen", "ouderavond", "informatieavond", "inloopavond", "kaartje"] },
  { naam: "Oudergesprek", emoji: "🗣️", href: "/tools/oudercontact.html?m=gesprekken",
    woorden: ["oudergesprek", "tienminutengesprek", "voortgangsgesprek", "rapportgesprek", "kindgesprek", "gesprekken", "ouder gesprek"] },
  { naam: "Informatiebrief", emoji: "📄", href: "/tools/oudercontact.html?m=informatiebrief",
    woorden: ["ouderbrief", "informatiebrief", "brief aan ouders"] },
  { naam: "Ouderbericht", emoji: "💬", href: "/tools/oudercontact.html?m=bericht",
    woorden: ["oudercontact", "ouders mailen", "mail naar ouders", "oudermail", "ouderbericht", "mededeling"] },
  { naam: "Toetsanalyse", emoji: "📊", href: "/tools/toetsanalyse.html",
    woorden: ["toetsanalyse", "toetsresultaat", "toetsresultaten", "methodetoets", "toetsen", "toets", "cito", "iep", "lvs", "scores"] },
  { naam: "Plattegrond", emoji: "🪑", href: "/tools/plattegrond.html",
    woorden: ["plattegrond", "klasplattegrond", "klasopstelling", "opstelling", "tafelschikking", "sociogram", "groepjes"] },
];

// Levenshtein-afstand (voor het opvangen van kleine typefouten).
function lev(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      const kost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + kost);
    }
    prev = cur;
  }
  return prev[n];
}

function toolLink(tekst: string): Verwijzing | null {
  const lc = tekst.toLowerCase();
  const woorden = lc.match(/[a-zà-ÿ]+/gi) ?? [];
  for (const v of VERWIJZINGEN) {
    for (const tw of v.woorden) {
      if (lc.includes(tw)) return v;
      // Kleine typefout toestaan, maar alleen op losse, voldoende lange woorden.
      if (tw.length >= 6 && !tw.includes(" ")) {
        const drempel = tw.length <= 8 ? 1 : 2;
        for (const w of woorden) {
          if (Math.abs(w.length - tw.length) <= drempel && lev(w, tw) <= drempel) return v;
        }
      }
    }
  }
  return null;
}

const WEEKDAGEN = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
function weekdag(iso: string): string {
  return WEEKDAGEN[new Date(iso + "T00:00:00").getDay()];
}

// Aan/uit-schakelaar in de huisstijl.
function Switch({ aan, onClick }: { aan: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={aan}
      onClick={onClick}
      className={"relative h-6 w-11 shrink-0 rounded-full transition " + (aan ? "bg-brand" : "bg-black/15")}
    >
      <span
        className={
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all " +
          (aan ? "left-[22px]" : "left-0.5")
        }
      />
    </button>
  );
}

// Hoe dringend is een deadline? Geeft een label + kleurklasse.
function deadlineInfo(d: string): { label: string; klasse: string } {
  const vandaag = new Date();
  vandaag.setHours(0, 0, 0, 0);
  const due = new Date(d + "T00:00:00");
  const dagen = Math.round((due.getTime() - vandaag.getTime()) / 86400000);
  let label: string;
  if (dagen < 0) label = "Te laat";
  else if (dagen === 0) label = "Vandaag";
  else if (dagen === 1) label = "Morgen";
  else label = due.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
  const klasse =
    dagen < 0
      ? "border-rose-200 bg-rose-50 text-rose-600"
      : dagen <= 1
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-black/10 bg-cream text-ink/60";
  return { label, klasse };
}

// Datumkiezer in de huisstijl: snelkeuze + kalender + "Wekelijks herhalen".
// Vervangt de kale native datumkiezer én het losse wekelijks-knopje.
function DeadlinePicker({
  taak,
  onSetDeadline,
  onSetWekelijks,
}: {
  taak: Taak;
  onSetDeadline: (v: string | null) => void;
  onSetWekelijks: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [omhoog, setOmhoog] = useState(false);
  const [maand, setMaand] = useState(() => {
    const b = taak.deadline ? new Date(taak.deadline + "T00:00:00") : new Date();
    return new Date(b.getFullYear(), b.getMonth(), 1);
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function buiten(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", buiten);
    return () => document.removeEventListener("mousedown", buiten);
  }, [open]);

  const info = taak.deadline ? deadlineInfo(taak.deadline) : null;
  const vandaagIso = isoDate(new Date());

  // Niet genoeg ruimte onder de knop? Dan klapt de kiezer omhoog (geen scrollen).
  function schakel() {
    if (!open) {
      const r = ref.current?.getBoundingClientRect();
      setOmhoog(r ? window.innerHeight - r.bottom < 360 : false);
    }
    setOpen((o) => !o);
  }

  function quick(dagen: number) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + dagen);
    onSetDeadline(isoDate(d));
    setMaand(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  const jaar = maand.getFullYear();
  const mnd = maand.getMonth();
  const start = (new Date(jaar, mnd, 1).getDay() + 6) % 7; // maandag = 0
  const aantal = new Date(jaar, mnd + 1, 0).getDate();
  const cellen: (number | null)[] = [];
  for (let i = 0; i < start; i++) cellen.push(null);
  for (let d = 1; d <= aantal; d++) cellen.push(d);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button type="button" onClick={schakel} aria-label="Deadline en herhaling" className="flex items-center">
        {info ? (
          <span className={"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold " + info.klasse}>
            {taak.wekelijks && (
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path d="M21 4v5h-5" />
              </svg>
            )}
            {info.label}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full px-1 py-0.5 text-ink/30 transition hover:text-brand" title="Deadline toevoegen">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
              <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" strokeLinecap="round" />
            </svg>
          </span>
        )}
      </button>

      {open && (
        <div
          className={
            "absolute right-0 z-30 w-64 rounded-2xl border border-black/10 bg-white p-2.5 text-left shadow-xl " +
            (omhoog ? "bottom-full mb-2" : "top-full mt-2")
          }
        >
          {/* Snelkeuze */}
          <div className="flex gap-1.5">
            {([["Vandaag", 0], ["Morgen", 1], ["Volgende week", 7]] as const).map(([label, d]) => (
              <button
                key={label}
                type="button"
                onClick={() => quick(d)}
                className="flex-1 rounded-lg bg-cream px-2 py-1.5 text-xs font-semibold text-ink/70 transition hover:bg-brand-soft hover:text-brand"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Kalender */}
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setMaand(new Date(jaar, mnd - 1, 1))} aria-label="Vorige maand" className="rounded-lg px-2 py-1 text-ink/50 transition hover:bg-cream hover:text-ink">‹</button>
              <span className="text-sm font-bold capitalize text-ink">
                {maand.toLocaleDateString("nl-NL", { month: "long", year: "numeric" })}
              </span>
              <button type="button" onClick={() => setMaand(new Date(jaar, mnd + 1, 1))} aria-label="Volgende maand" className="rounded-lg px-2 py-1 text-ink/50 transition hover:bg-cream hover:text-ink">›</button>
            </div>
            <div className="mt-2 grid grid-cols-7 text-center text-[11px] font-semibold text-ink/35">
              {["ma", "di", "wo", "do", "vr", "za", "zo"].map((d) => (
                <span key={d} className="py-1">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cellen.map((d, i) => {
                if (d === null) return <span key={i} />;
                const iso = isoDate(new Date(jaar, mnd, d));
                const gekozen = taak.deadline === iso;
                const isVandaag = vandaagIso === iso;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSetDeadline(iso)}
                    className={
                      "h-7 rounded-lg text-[13px] transition " +
                      (gekozen
                        ? "bg-brand font-bold text-white"
                        : isVandaag
                          ? "bg-brand-soft font-bold text-brand"
                          : "text-ink hover:bg-cream")
                    }
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wekelijks herhalen */}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-cream px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Wekelijks herhalen</p>
              <p className="text-xs text-ink/55">
                {taak.wekelijks && taak.deadline ? `Iedere ${weekdag(taak.deadline)}` : "Eenmalig"}
              </p>
            </div>
            <Switch
              aan={taak.wekelijks}
              onClick={() => {
                const nieuw = !taak.wekelijks;
                if (nieuw && !taak.deadline) onSetDeadline(vandaagIso);
                onSetWekelijks(nieuw);
              }}
            />
          </div>

          {/* Onderkant */}
          <div className="mt-2 flex items-center justify-between">
            {taak.deadline ? (
              <button
                type="button"
                onClick={() => {
                  onSetWekelijks(false);
                  onSetDeadline(null);
                }}
                className="text-xs font-semibold text-ink/40 transition hover:text-rose-500"
              >
                Datum wissen
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-brand px-4 py-1.5 text-xs font-bold text-white transition hover:bg-brand-dark"
            >
              Klaar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

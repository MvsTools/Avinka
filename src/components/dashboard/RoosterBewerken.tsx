"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { naarBlokken, rasterGrenzen, schikDag, type Basisrooster } from "@/lib/planning/rooster";
import type { Roosterblok } from "@/lib/planning/types";

// De bewerkstand van het basisrooster: je vaste lesweek als sjabloon (ma–vr,
// zonder datums en zonder agenda — want je bewerkt het weekelijkse rooster, niet
// één concrete week). Alles in ditzelfde scherm, in de Avinka-stijl.
//
// Bewust GEEN automatisch opslaan: je wijzigt vrij, kunt ongedaan maken, en
// bewaart pas als je klaar bent. Klik een blok en er vouwt een kaartje open met
// de opties; klik ernaast en het sluit weer.
//
// Volgende stap: verslepen (verplaatsen en langer/korter door te slepen).

const DAGNAMEN = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag"];
const DAG_ID = ["ma", "di", "wo", "do", "vr"]; // weekdag-nummer → zoals de tool bewaart

/** Ronden op 5 minuten, zodat slepen netjes "klikt". */
function snap5(m: number): number {
  return Math.round(m / 5) * 5;
}

/** "08:30" → 510 */
function minuten(tijd: string): number {
  const [u, m] = tijd.split(":").map(Number);
  return u * 60 + (m || 0);
}

/** 510 → "08:30" */
function tijdTekst(m: number): string {
  const u = Math.floor(m / 60);
  const rest = Math.round(m % 60);
  return `${String(u).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

type Gekozen = { id: string; x: number; y: number; kant: "links" | "rechts" };

export default function RoosterBewerken({
  schooljaar,
  onKlaar,
}: {
  schooljaar: string;
  onKlaar: () => void;
}) {
  const [concept, setConcept] = useState<Basisrooster | null>(null);
  const [geschiedenis, setGeschiedenis] = useState<Basisrooster[]>([]);
  const [vuil, setVuil] = useState(false);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState<string | null>(null);
  const [opslaanBezig, setOpslaanBezig] = useState(false);
  const [gekozen, setGekozen] = useState<Gekozen | null>(null);

  // Het rooster van je account ophalen zodra de bewerkstand opent.
  useEffect(() => {
    let levend = true;
    (async () => {
      try {
        const antwoord = await fetch(
          `/api/rooster?schooljaar=${encodeURIComponent(schooljaar)}`,
          { headers: { Accept: "application/json" } },
        );
        if (!antwoord.ok) throw new Error("laden mislukt");
        const data = await antwoord.json();
        if (levend) setConcept(data.rooster ?? null);
      } catch {
        if (levend) setFout("Je rooster kon niet worden geladen.");
      } finally {
        if (levend) setLaden(false);
      }
    })();
    return () => {
      levend = false;
    };
  }, [schooljaar]);

  // Elke wijziging bewaart de vorige stand voor "ongedaan maken" en zet het
  // rooster op "niet opgeslagen". Nog niets naar de server: dat doe je zelf.
  function pasToe(maak: (c: Basisrooster) => Basisrooster) {
    if (!concept) return;
    setGeschiedenis((g) => [...g, concept]);
    setConcept(maak(concept));
    setVuil(true);
  }

  function ongedaan() {
    if (!geschiedenis.length) return;
    setConcept(geschiedenis[geschiedenis.length - 1]);
    setGeschiedenis((g) => g.slice(0, -1));
    setVuil(true);
    setGekozen(null);
  }

  async function opslaan(daarnaTerug: boolean) {
    if (!concept) {
      if (daarnaTerug) onKlaar();
      return;
    }
    setOpslaanBezig(true);
    setFout(null);
    try {
      const antwoord = await fetch("/api/rooster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rooster: concept, schooljaar }),
      });
      if (!antwoord.ok) throw new Error();
      setVuil(false);
      if (daarnaTerug) onKlaar();
    } catch {
      setFout("Opslaan is niet gelukt. Probeer het nog eens.");
    } finally {
      setOpslaanBezig(false);
    }
  }

  const lessen = useMemo<Roosterblok[]>(
    () => (concept ? naarBlokken(concept).filter((b) => b.soort === "les") : []),
    [concept],
  );
  const gekozenBlok = gekozen ? lessen.find((b) => b.id === gekozen.id) ?? null : null;

  // De onderkant verschuiven: alleen de lengte verandert (begintijd blijft staan).
  function wijzigEinde(id: string, delta: number) {
    pasToe((c) => ({
      ...c,
      blokken: c.blokken.map((b) =>
        b.id === id ? { ...b, duur: Math.min(180, Math.max(10, b.duur + delta)) } : b,
      ),
    }));
  }

  // De bovenkant verschuiven: de begintijd schuift op, de eindtijd blijft staan
  // (start en lengte bewegen tegengesteld). Niet vóór middernacht of korter dan
  // 10 minuten.
  function wijzigBegin(id: string, delta: number) {
    pasToe((c) => ({
      ...c,
      blokken: c.blokken.map((b) => {
        if (b.id !== id) return b;
        const start = b.start + delta;
        const duur = b.duur - delta;
        if (start < 0 || duur < 10 || duur > 180) return b;
        return { ...b, start, duur };
      }),
    }));
  }

  function verwijder(id: string) {
    pasToe((c) => ({ ...c, blokken: c.blokken.filter((b) => b.id !== id) }));
    setGekozen(null);
  }

  // Een blok naar een andere dag/tijd of lengte zetten (na het slepen).
  function zetBlok(id: string, w: { weekdag?: number; start?: number; duur?: number }) {
    pasToe((c) => ({
      ...c,
      blokken: c.blokken.map((b) =>
        b.id === id
          ? {
              ...b,
              dag: w.weekdag != null ? DAG_ID[w.weekdag] : b.dag,
              start: w.start != null ? w.start : b.start,
              duur: w.duur != null ? w.duur : b.duur,
            }
          : b,
      ),
    }));
  }

  // Bij een klik op een blok zetten we het kaartje NAAST het blok (rechts als het
  // past, anders links), nooit erboven of eronder. Zo bedekt het het blok nooit
  // en zie je het blok live veranderen terwijl je begin/einde bijstelt.
  function kies(id: string, el: HTMLElement) {
    if (gekozen?.id === id) {
      setGekozen(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const breedte = 244;
    const hoogteSchatting = 178;
    let x = r.right + 8;
    let kant: "links" | "rechts" = "rechts";
    if (x + breedte > window.innerWidth - 8) {
      x = r.left - breedte - 8;
      kant = "links";
    }
    if (x < 8) x = 8;
    const y = Math.max(8, Math.min(r.top, window.innerHeight - hoogteSchatting - 8));
    setGekozen({ id, x, y, kant });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Bewerk-balk: duidelijk dat je nu aan het aanpassen bent, met ongedaan
          maken, annuleren en handmatig opslaan. */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand/20 bg-brand-soft/50 px-4 py-3">
        <span className="flex items-center gap-2 font-bold text-brand-dark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          Je past je basisrooster aan
        </span>
        {vuil && <span className="text-xs font-semibold text-ink/45">Niet opgeslagen</span>}

        <span className="ml-auto flex items-center gap-2">
          <button
            onClick={ongedaan}
            disabled={!geschiedenis.length}
            className="rounded-xl border border-black/10 bg-white px-3.5 py-2 text-sm font-bold text-ink/70 transition-transform duration-150 hover:text-ink active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ongedaan maken
          </button>
          <button
            onClick={onKlaar}
            className="rounded-xl border border-black/10 bg-white px-3.5 py-2 text-sm font-bold text-ink/70 transition-transform duration-150 hover:text-ink active:scale-[0.97]"
          >
            Annuleren
          </button>
          <button
            onClick={() => opslaan(true)}
            disabled={opslaanBezig}
            className="rounded-xl bg-brand-dark px-4 py-2 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.97] disabled:opacity-60"
          >
            {opslaanBezig ? "Bezig met opslaan…" : "Opslaan"}
          </button>
        </span>
      </div>

      {fout && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{fout}</p>
      )}

      {laden ? (
        <p className="rounded-3xl border border-black/5 bg-white px-6 py-8 text-ink/60 shadow-sm">
          Je rooster wordt geladen…
        </p>
      ) : lessen.length === 0 ? (
        <p className="rounded-3xl border border-black/5 bg-white px-6 py-8 text-ink/60 shadow-sm">
          Er staan nog geen lessen in je rooster.
        </p>
      ) : (
        <Bewerkraster
          lessen={lessen}
          gekozenId={gekozen?.id ?? null}
          kies={kies}
          zetBlok={zetBlok}
        />
      )}

      {/* Het kaartje dat uit het blok openvouwt, met de opties. */}
      {gekozenBlok && gekozen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setGekozen(null)} />
          <Blokkaart
            blok={gekozenBlok}
            x={gekozen.x}
            y={gekozen.y}
            kant={gekozen.kant}
            beginEerder={() => wijzigBegin(gekozenBlok.id, -5)}
            beginLater={() => wijzigBegin(gekozenBlok.id, 5)}
            eindeEerder={() => wijzigEinde(gekozenBlok.id, -5)}
            eindeLater={() => wijzigEinde(gekozenBlok.id, 5)}
            weghalen={() => verwijder(gekozenBlok.id)}
            sluit={() => setGekozen(null)}
          />
        </>
      )}
    </div>
  );
}

function TijdRij({
  label,
  tijd,
  eerder,
  later,
}: {
  label: string;
  tijd: string;
  eerder: () => void;
  later: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-cream/60 px-2 py-1.5">
      <span className="text-sm font-semibold text-ink/70">{label}</span>
      <span className="flex items-center gap-2">
        <button
          onClick={eerder}
          aria-label={`${label} eerder`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white text-lg font-bold text-ink/70 transition-transform duration-150 hover:text-ink active:scale-[0.94]"
        >
          –
        </button>
        <span className="min-w-[3.5rem] text-center text-sm tabular-nums text-ink/70">{tijd}</span>
        <button
          onClick={later}
          aria-label={`${label} later`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white text-lg font-bold text-ink/70 transition-transform duration-150 hover:text-ink active:scale-[0.94]"
        >
          +
        </button>
      </span>
    </div>
  );
}

function Blokkaart({
  blok,
  x,
  y,
  kant,
  beginEerder,
  beginLater,
  eindeEerder,
  eindeLater,
  weghalen,
  sluit,
}: {
  blok: Roosterblok;
  x: number;
  y: number;
  kant: "links" | "rechts";
  beginEerder: () => void;
  beginLater: () => void;
  eindeEerder: () => void;
  eindeLater: () => void;
  weghalen: () => void;
  sluit: () => void;
}) {
  // Even openvouwen: klein en doorzichtig beginnen, dan op ware grootte, vanuit
  // de kant waar het blok staat.
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(true), []);
  const duur = minuten(blok.eind) - minuten(blok.begin);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ left: x, top: y, width: 244 }}
      className={
        "fixed z-50 rounded-2xl border border-black/10 bg-white p-3 shadow-xl transition duration-150 ease-out " +
        (kant === "links" ? "origin-top-right " : "origin-top-left ") +
        (open ? "scale-100 opacity-100" : "scale-95 opacity-0")
      }
    >
      {/* Kopregel altijd op één regel: naam kort af, tijd blijft ernaast. */}
      <div className="flex items-center gap-2">
        <span
          className="min-w-0 flex-1 truncate rounded-lg px-2 py-1 text-sm font-bold"
          style={{ background: blok.kleur?.bg, color: blok.kleur?.tekst }}
        >
          {blok.naam}
        </span>
        <span className="shrink-0 text-sm tabular-nums text-ink/55">{duur} min</span>
        <button
          onClick={sluit}
          aria-label="Sluiten"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink/45 transition-colors hover:bg-black/5 hover:text-ink"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* Begin en einde apart, zodat je zowel de boven- als de onderkant kunt
          verschuiven. */}
      <div className="mt-3 flex flex-col gap-1.5">
        <TijdRij label="Begin" tijd={blok.begin} eerder={beginEerder} later={beginLater} />
        <TijdRij label="Einde" tijd={blok.eind} eerder={eindeEerder} later={eindeLater} />
      </div>

      <button
        onClick={weghalen}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 transition-transform duration-150 active:scale-[0.98]"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
        </svg>
        Weghalen
      </button>
    </div>
  );
}

type Sleep = {
  id: string;
  modus: "verplaats" | "top" | "onder";
  weekdag: number;
  start: number;
  duur: number;
  dx: number;
  dy: number;
};
type Drag = {
  id: string;
  modus: "verplaats" | "top" | "onder";
  startX: number;
  startY: number;
  origStart: number;
  origDuur: number;
  origEind: number;
  origWeekdag: number;
  bewogen: boolean;
};

function Bewerkraster({
  lessen,
  gekozenId,
  kies,
  zetBlok,
}: {
  lessen: Roosterblok[];
  gekozenId: string | null;
  kies: (id: string, el: HTMLElement) => void;
  zetBlok: (id: string, w: { weekdag?: number; start?: number; duur?: number }) => void;
}) {
  const PX = 1.25;
  const RAND = 9; // px boven-/onderrand waar je kunt trekken (i.p.v. verplaatsen)
  const BOVEN = 20; // lucht boven de eerste les/tijd, zodat het niet krap begint
  const grenzen = rasterGrenzen(lessen);
  const rasterBegin = minuten(grenzen.begin);
  const rasterTot = minuten(grenzen.eind);
  const hoogte = Math.max(1, rasterTot - rasterBegin);
  const y = (m: number) => (m - rasterBegin) * PX + BOVEN;

  const uren: number[] = [];
  for (let m = Math.ceil(rasterBegin / 60) * 60; m <= rasterTot; m += 60) uren.push(m);
  const ankers: number[] = [];
  if (rasterBegin % 60 !== 0) ankers.push(rasterBegin);
  if (rasterTot % 60 !== 0) ankers.push(rasterTot);
  const tijdstippen = [...uren, ...ankers].sort((a, b) => a - b);

  // Slepen: verplaatsen (naar een andere dag/tijd) of aan de boven-/onderrand
  // trekken (korter/langer). We snappen op 5 minuten en houden de live-stand in
  // `sleep`; pas bij loslaten leggen we het echt vast (via zetBlok → geschiedenis).
  const gridRef = useRef<HTMLDivElement>(null);
  const [sleep, setSleep] = useState<Sleep | null>(null);
  const sleepRef = useRef<Sleep | null>(null);
  sleepRef.current = sleep;
  const dragRef = useRef<Drag | null>(null);

  // Linkerkant en breedte van één dagkolom (om bij het slepen de dag te bepalen).
  function kolommen() {
    const r = gridRef.current?.getBoundingClientRect();
    const gutter = 56; // 3.5rem
    return { linkerkant: (r?.left ?? 0) + gutter, breedte: r ? (r.width - gutter) / 5 : 0 };
  }

  function omlaag(e: ReactPointerEvent, b: Roosterblok) {
    if (e.button > 0) return;
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    let modus: Drag["modus"] = "verplaats";
    if (rect.height >= 24) {
      if (offsetY <= RAND) modus = "top";
      else if (offsetY >= rect.height - RAND) modus = "onder";
    }
    const origStart = minuten(b.begin);
    const origDuur = minuten(b.eind) - minuten(b.begin);
    dragRef.current = {
      id: b.id,
      modus,
      startX: e.clientX,
      startY: e.clientY,
      origStart,
      origDuur,
      origEind: origStart + origDuur,
      origWeekdag: b.weekdag,
      bewogen: false,
    };
    el.style.cursor = modus === "verplaats" ? "grabbing" : "ns-resize";
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}
  }

  function beweeg(e: ReactPointerEvent) {
    const d = dragRef.current;
    if (!d) {
      // Niet aan het slepen: het handje wordt een sleeppijltje op de randen,
      // zodat je ziet waar je kunt trekken om korter/langer te maken.
      const el = e.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const opRand = rect.height >= 24 && (offsetY <= RAND || offsetY >= rect.height - RAND);
      el.style.cursor = opRand ? "ns-resize" : "";
      return;
    }
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.bewogen && Math.abs(dx) + Math.abs(dy) > 4) d.bewogen = true;
    if (!d.bewogen) return;
    const dyMin = snap5(dy / PX);
    if (d.modus === "verplaats") {
      const k = kolommen();
      let dag = k.breedte ? Math.floor((e.clientX - k.linkerkant) / k.breedte) : d.origWeekdag;
      dag = Math.max(0, Math.min(4, dag));
      const start = Math.max(0, d.origStart + dyMin);
      setSleep({
        id: d.id,
        modus: "verplaats",
        weekdag: dag,
        start,
        duur: d.origDuur,
        dx: (dag - d.origWeekdag) * k.breedte,
        dy: (start - d.origStart) * PX,
      });
    } else if (d.modus === "top") {
      const start = Math.min(d.origEind - 10, Math.max(0, d.origStart + dyMin));
      setSleep({ id: d.id, modus: "top", weekdag: d.origWeekdag, start, duur: d.origEind - start, dx: 0, dy: 0 });
    } else {
      const duur = Math.max(10, Math.min(180, d.origDuur + dyMin));
      setSleep({ id: d.id, modus: "onder", weekdag: d.origWeekdag, start: d.origStart, duur, dx: 0, dy: 0 });
    }
  }

  function omhoog(e: ReactPointerEvent, b: Roosterblok) {
    const d = dragRef.current;
    dragRef.current = null;
    const el = e.currentTarget as HTMLElement;
    el.style.cursor = "";
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {}
    if (!d) return;
    const s = sleepRef.current;
    setSleep(null);
    // Niet echt gesleept? Dan telt het als een klik: open het kaartje.
    if (!d.bewogen || !s) {
      kies(b.id, e.currentTarget as HTMLElement);
      return;
    }
    zetBlok(s.id, { weekdag: s.weekdag, start: s.start, duur: s.duur });
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[46rem] overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        {/* Dagkoppen — geen datums, want dit is het sjabloon. */}
        <div className="grid grid-cols-[3.5rem_repeat(5,minmax(0,1fr))] border-b border-black/5">
          <div />
          {DAGNAMEN.map((naam) => (
            <div key={naam} className="border-l border-black/5 px-2 py-2">
              <span className="block text-sm font-bold text-ink">{naam}</span>
            </div>
          ))}
        </div>

        {/* Het lesrooster */}
        <div
          ref={gridRef}
          className="grid grid-cols-[3.5rem_repeat(5,minmax(0,1fr))]"
          // Lucht boven (BOVEN) en onderaan zodat het raster niet strak afkapt (en
          // je iets ruimer kunt slepen).
          style={{ height: hoogte * PX + BOVEN + 36 }}
        >
          <div className="relative">
            {tijdstippen.map((m) => (
              <span
                key={m}
                className="absolute right-2 -translate-y-1/2 text-xs tabular-nums text-ink/45"
                style={{ top: y(m) }}
              >
                {tijdTekst(m)}
              </span>
            ))}
          </div>

          {[0, 1, 2, 3, 4].map((weekdag) => {
            const dagBlokken = lessen.filter((b) => b.weekdag === weekdag);
            const schik = schikDag(dagBlokken);
            return (
              <div key={weekdag} className="relative border-l border-black/5">
                {uren
                  .filter((m) => m !== rasterBegin && m !== rasterTot)
                  .map((m) => (
                    <div
                      key={"lijn" + m}
                      className="pointer-events-none absolute inset-x-0 border-t border-black/[0.06]"
                      style={{ top: y(m) }}
                    />
                  ))}
                {dagBlokken.map((b) => {
                  // Wordt dit blok gesleept? Bij verplaatsen doet de transform het
                  // werk (top blijft staan); bij randen trekken verandert de
                  // top/hoogte juist wél. Anders zou de beweging dubbel tellen.
                  const s = sleep && sleep.id === b.id ? sleep : null;
                  const herschaal = s !== null && s.modus !== "verplaats";
                  const startMin = herschaal ? s.start : minuten(b.begin);
                  const duurMin = herschaal ? s.duur : minuten(b.eind) - minuten(b.begin);
                  const top = (startMin - rasterBegin) * PX + BOVEN;
                  const h = Math.max(17, duurMin * PX - 2);
                  const actief = b.id === gekozenId;
                  // Overlappende lessen naast elkaar: eigen kolom binnen de dag.
                  const { kol, n } = schik.get(b.id) ?? { kol: 0, n: 1 };
                  const left = `calc(${(kol * 100) / n}% + 4px)`;
                  const breedte = `calc(${100 / n}% - 8px)`;
                  // Breed blok: naam + tijd naast elkaar op één regel (past ook
                  // bij een kort blok). Smal (overlappend) blok: naam boven, tijd
                  // eronder — en alleen als het hoog genoeg is, anders zou de tijd
                  // in een te klein blokje worden gepropt.
                  const smal = n > 1;
                  const tijdTonen = !smal || h >= 30;
                  const gestapeld = smal && tijdTonen;
                  const toonBegin = s ? tijdTekst(s.start) : b.begin;
                  const stijl: CSSProperties = {
                    top,
                    height: h,
                    left,
                    width: breedte,
                    background: b.kleur?.bg,
                  };
                  if (s) {
                    stijl.zIndex = 50;
                    stijl.boxShadow = "0 10px 24px rgba(0,0,0,0.18)";
                    if (s.modus === "verplaats") stijl.transform = `translate(${s.dx}px, ${s.dy}px)`;
                  }
                  return (
                    <button
                      key={b.id}
                      onPointerDown={(e) => omlaag(e, b)}
                      onPointerMove={beweeg}
                      onPointerUp={(e) => omhoog(e, b)}
                      title={`${b.naam} ${b.begin}–${b.eind}`}
                      className={
                        "group absolute cursor-grab touch-none select-none overflow-hidden rounded-lg border px-1.5 py-px text-left transition-shadow active:cursor-grabbing " +
                        (gestapeld ? "flex flex-col " : "flex items-baseline gap-1.5 ") +
                        (actief
                          ? "border-brand-dark ring-2 ring-brand-dark/40"
                          : "border-black/5 hover:ring-2 hover:ring-black/10")
                      }
                      style={stijl}
                    >
                      <span
                        className={
                          "truncate text-xs font-bold leading-tight " +
                          (tijdTonen && !smal ? "min-w-0 flex-1" : "")
                        }
                        style={{ color: b.kleur?.tekst }}
                      >
                        {b.naam}
                      </span>
                      {tijdTonen && (
                        <span
                          className={
                            "text-xs leading-tight tabular-nums opacity-60 " +
                            (gestapeld ? "truncate" : "shrink-0")
                          }
                          style={{ color: b.kleur?.tekst }}
                        >
                          {toonBegin}
                        </span>
                      )}
                      {/* Sleepgrepen boven en onder (bij hover) om te verlengen. */}
                      {h >= 24 && (
                        <>
                          <span className="pointer-events-none absolute left-1/2 top-0.5 h-1 w-6 -translate-x-1/2 rounded-full bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                          <span className="pointer-events-none absolute bottom-0.5 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

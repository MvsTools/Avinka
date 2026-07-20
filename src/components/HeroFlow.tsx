"use client";

import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";

/* Hero-rechts: geleide demo met een muiscursor.
   To-do-lijst → cursor klikt een taak → de tool (met naam) doet z'n werk →
   ✓ Akkoord → terug, taak wordt op de klik afgestreept + tijd bespaard (oplopend
   totaal). Na alle taken: eindscherm met logo, tijdwinst en "Ontdek Avinka". */

const INK = "#221c3a";
const MUTED = "#8a879a";
const LINE = "#ece3d4";
const GREEN = "#2f9e6e";
const GREEN_DARK = "#25855a";
const GREEN_SOFT = "#e7f4ed";
const AMBER = "#c07a1a";

type Taak = { slug: string; label: string; sub: string; tool: string; emoji: string; kleur: string; zacht: string; min: number; bdur: number };
const TAKEN: Taak[] = [
  { slug: "rapporten", label: "Rapport schrijven", sub: "Sofie · groep 5", tool: "Rapporten", emoji: "📝", kleur: "#8b5cf6", zacht: "#ede9fe", min: 25, bdur: 3800 },
  { slug: "toetsanalyse", label: "Toetsen analyseren", sub: "IEP rekenen · groep 5", tool: "Toetsanalyse", emoji: "📊", kleur: "#0284c7", zacht: "#e0f2fe", min: 45, bdur: 4200 },
  { slug: "oudercontact", label: "Ouderbericht sturen", sub: "ouders van Tom", tool: "Oudercontact", emoji: "✉️", kleur: "#f43f5e", zacht: "#ffe4e6", min: 20, bdur: 3800 },
];

const RAPPORT =
  "Sofie heeft zich dit blok knap ontwikkeld. Ze werkt zelfstandig, durft steeds vaker vragen te stellen en helpt klasgenoten graag. Bij rekenen groeit haar zelfvertrouwen zichtbaar.";
const OUDER =
  "Beste ouders van Tom, wat fijn dat we elkaar spraken. Zoals afgesproken oefent Tom thuis de komende weken nog even met de tafels van 6 en 7 — een paar minuten per dag is genoeg. Fijne week!";

const DOMEINEN = [
  { naam: "Getallen", pct: 78, status: "op niveau", kleur: GREEN },
  { naam: "Verhoudingen", pct: 44, status: "aandacht", kleur: AMBER },
  { naam: "Meten & meetkunde", pct: 82, status: "sterk", kleur: GREEN },
  { naam: "Verbanden", pct: 68, status: "op niveau", kleur: "#0284c7" },
];

const H = 332;
const PAD = 20;
const rowTop = (i: number) => 52 + i * 64;
const rowMidY = (i: number) => rowTop(i) + 24;

const WP = {
  park: { x: 0.72, y: 210 },
  taskOpen: (i: number) => ({ x: 0.36, y: PAD + rowMidY(i) }),
  build: { x: 0.86, y: 60 },
  akkoord: { x: 0.82, y: 286 },
  checkbox: (i: number) => ({ x: 0.08, y: PAD + rowMidY(i) }),
};

type Seg = { kind: "intro" | "toTask" | "build" | "toAkkoord" | "back" | "end"; i: number; dur: number; wp: { x: number; y: number }; click: boolean };
const SEGS: Seg[] = [{ kind: "intro", i: -1, dur: 2600, wp: WP.park, click: false }];
for (let i = 0; i < TAKEN.length; i++) {
  SEGS.push({ kind: "toTask", i, dur: 1500, wp: WP.taskOpen(i), click: true });
  SEGS.push({ kind: "build", i, dur: TAKEN[i].bdur, wp: WP.build, click: false });
  SEGS.push({ kind: "toAkkoord", i, dur: 1500, wp: WP.akkoord, click: true });
  SEGS.push({ kind: "back", i, dur: 2500, wp: WP.checkbox(i), click: true });
}
SEGS.push({ kind: "end", i: -1, dur: 4200, wp: WP.park, click: false });
const STARTS: number[] = [];
let _a = 0;
for (const s of SEGS) { STARTS.push(_a); _a += s.dur; }
const CYCLE = _a;

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const tijdLabel = (m: number) => (m <= 0 ? "0 min" : m < 60 ? `${m} min` : m % 60 === 0 ? `${m / 60} uur` : `${Math.floor(m / 60)} u ${m % 60} m`);

export default function HeroFlow() {
  const [t, setT] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setT(STARTS[STARTS.length - 1] + 2000); return; }
    let raf = 0;
    const loop = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      setT((ts - startRef.current) % CYCLE);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  let si = 0;
  for (let k = 0; k < SEGS.length; k++) if (t >= STARTS[k]) si = k;
  const seg = SEGS[si];
  const local = clamp((t - STARTS[si]) / seg.dur);
  const prevWp = si > 0 ? SEGS[si - 1].wp : WP.park;

  const clickAt = seg.kind === "back" ? 0.5 : 0.86;
  const arr = smooth(Math.min(1, local / (clickAt - 0.16)));
  const cx = lerp(prevWp.x, seg.wp.x, arr);
  const cy = lerp(prevWp.y, seg.wp.y, arr);
  const cStart = clickAt - 0.05;
  const clickP = seg.click ? clamp((local - cStart) / 0.2) : 0;
  const pressed = seg.click && local > cStart && local < clickAt + 0.07;

  const opTool = seg.kind === "build" || seg.kind === "toAkkoord";
  const isEnd = seg.kind === "end";
  const build = seg.kind === "build" ? local : seg.kind === "toAkkoord" ? 1 : 0;

  const checkAmt = (i: number) => {
    const bi = 1 + i * 4 + 3;
    const at = STARTS[bi] + SEGS[bi].dur * 0.47; // gelijk met de klik
    if (t < at) return 0;
    return smooth((t - at) / 240);
  };
  const totaalMin = Math.round(TAKEN.reduce((s, taak, i) => s + clamp(checkAmt(i)) * taak.min, 0));

  const introRow = (i: number) => (seg.kind === "intro" ? smooth((local - 0.28 - i * 0.2) / 0.22) : 1);
  const screenKey = isEnd ? "finale" : opTool ? `tool${seg.i}` : "lijst";
  const titel = isEnd ? "klaar 🎉" : opTool ? TAKEN[seg.i].tool : "te doen";

  return (
    <div className="relative mx-auto w-full max-w-[470px]">
      <style>{CSS}</style>
      <div className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center gap-2 border-b border-black/5 bg-slate-50 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-rose-300" />
          <span className="h-3 w-3 rounded-full bg-amber-300" />
          <span className="h-3 w-3 rounded-full bg-emerald-300" />
          <span className="ml-3 flex items-center gap-2 rounded-md bg-white px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
            <Logo className="h-3.5 w-auto" /> <span className="text-slate-300">·</span> {titel}
          </span>
        </div>

        <div className="relative overflow-hidden" style={{ height: H }}>
          <div key={screenKey} className="screen absolute inset-0 p-5">
            {isEnd ? (
              <Finale min={totaalMin} />
            ) : opTool ? (
              <Tool taak={TAKEN[seg.i]} build={build} pressAkkoord={seg.kind === "toAkkoord" && pressed} />
            ) : (
              <Lijst introRow={introRow} checkAmt={checkAmt} totaalMin={totaalMin} />
            )}
          </div>
          {!isEnd && <Cursor xPct={cx} y={cy} pressed={pressed} clickP={clickP} />}
        </div>
      </div>
    </div>
  );
}

function Cursor({ xPct, y, pressed, clickP }: { xPct: number; y: number; pressed: boolean; clickP: number }) {
  return (
    <div className="pointer-events-none absolute z-30" style={{ left: `${xPct * 100}%`, top: y, transform: `translate(-3px,-2px) scale(${pressed ? 0.85 : 1})`, transition: "transform .12s" }}>
      {clickP > 0.02 && clickP < 1 && (
        <span className="absolute rounded-full" style={{ left: -3, top: -3, width: 30, height: 30, border: `2px solid ${GREEN}`, opacity: (1 - clickP) * 0.85, transform: `translate(-50%,-50%) scale(${0.4 + clickP * 1.1})` }} />
      )}
      <svg width="25" height="25" viewBox="0 0 24 24" fill="none" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,.28))" }}>
        <path d="M5 3l14 7.5-6 1.6-1.8 5.9L5 3z" fill="#fff" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Lijst({ introRow, checkAmt, totaalMin }: { introRow: (i: number) => number; checkAmt: (i: number) => number; totaalMin: number }) {
  return (
    <div className="relative h-full">
      <div className="flex items-start justify-between">
        <p className="font-display text-lg font-extrabold" style={{ color: INK }}>Te doen<span className="ml-2 text-sm font-semibold" style={{ color: MUTED }}>deze week</span></p>
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-xs font-bold text-orange-600">🔥 5</span>
          <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold tabular-nums" style={{ background: totaalMin > 0 ? GREEN_SOFT : "#f0eadf", color: totaalMin > 0 ? GREEN_DARK : MUTED, transition: "background .3s" }}>
            ⏱️ {tijdLabel(totaalMin)}
          </span>
        </div>
      </div>
      {TAKEN.map((taak, i) => {
        const o = introRow(i);
        const d = checkAmt(i);
        const af = d > 0.35;
        return (
          <div key={taak.slug} className="absolute left-0 right-0 flex items-center gap-3 rounded-xl" style={{ top: rowTop(i), height: 48, opacity: o, transform: `translateY(${(1 - o) * 12}px)` }}>
            <span className="flex shrink-0 items-center justify-center" style={{ width: 26, height: 26, borderRadius: 8, border: `2.5px solid ${d > 0.1 ? GREEN : "#cdbfa8"}`, background: d > 0.1 ? GREEN : "#fff", transform: `scale(${0.92 + d * 0.1})` }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: d > 0.35 ? 1 : 0 }}><path d="M5 13l4 4L19 7" /></svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold leading-tight" style={{ color: af ? MUTED : INK, textDecoration: af ? "line-through" : "none" }}>{taak.label}</span>
              <span className="block text-xs" style={{ color: MUTED, textDecoration: af ? "line-through" : "none" }}>{taak.sub}</span>
            </span>
            <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold" style={{ background: GREEN_SOFT, color: GREEN_DARK, opacity: d }}>+{taak.min}m</span>
          </div>
        );
      })}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 text-xs font-semibold" style={{ color: MUTED }}>
        <span>🔒</span> Namen blijven op je eigen computer — nooit naar de AI.
      </div>
    </div>
  );
}

function Tool({ taak, build, pressAkkoord }: { taak: Taak; build: number; pressAkkoord: boolean }) {
  const tijdOp = smooth((build - 0.5) / 0.2);
  const isToets = taak.slug === "toetsanalyse";
  return (
    <div className="relative flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between">
        <span className="flex items-center gap-2 rounded-full px-3 py-1 text-sm font-extrabold" style={{ background: taak.zacht, color: INK }}>
          <span>{taak.emoji}</span> {taak.tool}
        </span>
        <span className="rounded-full px-2.5 py-1 text-xs font-extrabold" style={{ background: GREEN_SOFT, color: GREEN_DARK, opacity: tijdOp }}>⏱ ~{taak.min} min bespaard</span>
      </div>

      <div className={"flex flex-1 flex-col " + (isToets ? "justify-start pt-3" : "justify-center")}>
        {taak.slug === "rapporten" && (
          <div className="rounded-2xl p-4" style={{ background: taak.zacht }}>
            <span className="mb-1.5 block text-xs font-bold" style={{ color: MUTED }}>Rapport · Sofie</span>
            <p className="text-[15px] leading-[1.65]" style={{ color: INK }}>
              {RAPPORT.slice(0, Math.floor(clamp(build / 0.8) * RAPPORT.length))}
              <span style={{ color: taak.kleur, opacity: build < 0.8 ? 1 : 0 }}>▏</span>
            </p>
          </div>
        )}

        {taak.slug === "oudercontact" && (
          <div className="rounded-2xl rounded-bl-md p-4" style={{ background: taak.zacht }}>
            <span className="mb-1.5 block text-xs font-bold" style={{ color: MUTED }}>Ouderbericht · ouders van Tom</span>
            <p className="text-[15px] leading-[1.65]" style={{ color: INK }}>
              {OUDER.slice(0, Math.floor(clamp(build / 0.8) * OUDER.length))}
              <span style={{ color: taak.kleur, opacity: build < 0.8 ? 1 : 0 }}>▏</span>
            </p>
          </div>
        )}

        {isToets && (
          <div>
            <div className="flex items-baseline gap-2.5" style={{ opacity: smooth(build / 0.14) }}>
              <span className="font-display text-3xl font-black" style={{ color: taak.kleur }}>58</span>
              <span className="text-[13px] font-semibold leading-tight" style={{ color: INK }}>gem. ontwikkelscore<br /><span style={{ color: AMBER }}>net onder 1F (60)</span></span>
              <span className="ml-auto text-[11px] font-semibold" style={{ color: MUTED }}>IEP rekenen · gr 5</span>
            </div>
            <div className="mt-3.5 space-y-2">
              {DOMEINEN.map((d, i) => {
                const r = smooth((build - 0.24 - i * 0.1) / 0.16);
                return (
                  <div key={d.naam} className="flex items-center gap-2.5" style={{ opacity: r }}>
                    <span className="w-[118px] text-[12.5px] font-bold" style={{ color: INK }}>{d.naam}</span>
                    <span className="h-2 flex-1 rounded-full" style={{ background: "#f0ece3" }}>
                      <span className="block h-2 rounded-full" style={{ width: `${d.pct * r}%`, background: d.kleur }} />
                    </span>
                    <span className="w-[62px] text-right text-[11px] font-bold" style={{ color: d.kleur }}>{d.status}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold" style={{ background: "#fdf3e2", color: AMBER, opacity: smooth((build - 0.72) / 0.14) }}>
              → 4 leerlingen: verlengde instructie breuken (Verhoudingen)
            </p>
          </div>
        )}
      </div>

      <button type="button" className="absolute rounded-xl px-5 py-2.5 text-sm font-bold text-white" style={{ right: 6, bottom: 6, background: GREEN, boxShadow: pressAkkoord ? "none" : "0 8px 18px -6px rgba(47,158,110,.6)", transform: pressAkkoord ? "scale(.95)" : "scale(1)", transition: "transform .12s", opacity: smooth((build - 0.86) / 0.12) }}>
        ✓ Akkoord
      </button>
    </div>
  );
}

function Finale({ min }: { min: number }) {
  return (
    <div className="finale flex h-full flex-col items-center justify-center text-center">
      <Logo vol className="h-16 w-auto" />
      <p className="mt-5 flex items-center gap-2 rounded-full px-4 py-2 text-base font-extrabold" style={{ background: GREEN_SOFT, color: GREEN_DARK }}>
        ⏱️ {tijdLabel(min)} bespaard deze week
      </p>
      <span className="mt-5 rounded-2xl px-6 py-3 text-[15px] font-bold text-white shadow-lg" style={{ background: GREEN, boxShadow: "0 12px 26px -8px rgba(47,158,110,.55)" }}>
        Ontdek Avinka →
      </span>
    </div>
  );
}

const CSS = `
.screen { animation: scrIn .4s ease both; }
@keyframes scrIn { from { opacity: 0; } to { opacity: 1; } }
.finale > * { animation: revUp .5s ease both; }
.finale > *:nth-child(2) { animation-delay: .12s; }
.finale > *:nth-child(3) { animation-delay: .24s; }
@keyframes revUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .screen, .finale > * { animation: none; } }
`;

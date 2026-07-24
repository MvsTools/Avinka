"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

/* Verkenning "max" — op referentie-niveau gebouwd, mét de kleuren van
   bahamabucks.com (geen groen). Doel: één samenhangende, rijke wereld waar
   véél gebeurt maar die tóch rustig oogt, door discipline in palet + ruimte.
   Mechaniek uit de referentie-analyse: golfranden op secties én kaarten,
   korrel, vage watermerken, één accent (koraal) op CTA's, getinte inkt,
   overlappende/zwevende kaarten, meereizende sticker, scroll-motion. */

const PAPER = "#faf7f1";
const MINT = "#abdcd4";
const MINT_SOFT = "#c9e6e0";
const TEALDK = "#1f7d72";
const CORAL = "#ec6859";
const CORAL_DK = "#d64f3f";
const INK = "#435756";
const INK_DEEP = "#26403c";

const D = "var(--font-baloo)"; // chunky ronde display
const B = "var(--font-hanken)"; // humanist body
const S = "var(--font-caveat)"; // script, spaarzaam

/* ── Bouwstenen ─────────────────────────────────────────────────────────── */

function Korrel({ o = 0.05 }: { o?: number }) {
  return (
    <span
      className="pointer-events-none absolute inset-0 mix-blend-multiply"
      style={{
        opacity: o,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
      }}
      aria-hidden
    />
  );
}

/* Zacht organisch watermerk (tone-on-tone), zoals de bladeren in de referentie
   — maar bij ons abstracte "blob"-vormen. */
function Watermerk({ kleur, style }: { kleur: string; style: CSSProperties }) {
  return (
    <svg viewBox="0 0 200 200" className="pointer-events-none absolute" style={style} aria-hidden>
      <path
        fill={kleur}
        d="M44 96c-14-30 6-70 42-76 34-6 66 12 74 44 8 30-8 54-36 68-30 15-66 6-80-36z"
      />
    </svg>
  );
}

/* Organische golf-overgang naar de volgende kleur. */
function Golf({ kleur, flip = false, h = 110 }: { kleur: string; flip?: boolean; h?: number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 z-10 leading-[0]" style={flip ? { top: -1 } : { bottom: -1 }} aria-hidden>
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="block w-full" style={{ height: h, transform: flip ? "scaleY(-1)" : undefined }}>
        <path d="M0 70 C 220 120, 480 20, 740 52 C 980 82, 1230 124, 1440 58 L1440 121 L0 121 Z" fill={kleur} />
      </svg>
    </div>
  );
}

function Sticker({ children, className = "", rot = -7 }: { children: ReactNode; className?: string; rot?: number }) {
  return (
    <div className={`zweef ${className}`} style={{ "--r": `${rot}deg` } as CSSProperties} aria-hidden>
      <span
        className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_14px_28px_-14px_rgba(38,64,60,0.5)]"
        style={{ background: CORAL, fontFamily: B }}
      >
        {children}
      </span>
    </div>
  );
}

/* Klein wit product-kaartje dat zweeft (echt UI-fragment). */
function Zweef({ style, delay, children }: { style: CSSProperties; delay: string; children: ReactNode }) {
  return (
    <div className="zweef absolute z-20 w-max" style={{ ...style, animationDelay: delay }} aria-hidden>
      <div className="rounded-[22px] bg-white p-4 shadow-[0_26px_50px_-24px_rgba(38,64,60,0.45)] ring-1 ring-black/[0.03]">{children}</div>
    </div>
  );
}

function Vink({ className = "", bg = TEALDK }: { className?: string; bg?: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-lg ${className}`} style={{ background: bg }} aria-hidden>
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
    </span>
  );
}

/* ── Pagina ─────────────────────────────────────────────────────────────── */

export default function Max() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = root.current?.querySelectorAll<HTMLElement>("[data-reveal]");
    if (els?.length) {
      if (reduce) els.forEach((e) => e.classList.add("in"));
      else {
        const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")), { threshold: 0.16 });
        els.forEach((e) => io.observe(e));
      }
    }
    // lichte parallax
    let raf = 0;
    const pars = [...(root.current?.querySelectorAll<HTMLElement>("[data-par]") ?? [])];
    const onScroll = () => {
      if (reduce || raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        pars.forEach((el) => { const sp = parseFloat(el.dataset.par || "0"); el.style.transform = `translateY(${y * sp}px)`; });
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main ref={root} style={{ fontFamily: `${B}, system-ui, sans-serif`, color: INK, background: PAPER }}>
      <style>{`
        [data-reveal]{opacity:0;transform:translateY(30px);transition:opacity .8s ease,transform .8s cubic-bezier(.2,.75,.2,1)}
        [data-reveal].in{opacity:1;transform:none}
        [data-reveal][data-d="1"]{transition-delay:.09s}[data-reveal][data-d="2"]{transition-delay:.18s}[data-reveal][data-d="3"]{transition-delay:.27s}
        @keyframes zweef{0%,100%{transform:translateY(0) rotate(var(--r,0deg))}50%{transform:translateY(-12px) rotate(var(--r,0deg))}}
        .zweef{animation:zweef 7s ease-in-out infinite}
        .maskrij .weg{transition:opacity .5s ease, transform .5s ease}
        [data-reveal].in .maskrij .weg{opacity:.25;transform:translateX(6px)}
        [data-reveal] .maskrij .kom{opacity:0;transform:translateX(-8px);transition:opacity .6s ease .3s, transform .6s ease .3s}
        [data-reveal].in .maskrij .kom{opacity:1;transform:none}
        @media (prefers-reduced-motion: reduce){.zweef{animation:none}}
      `}</style>

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pb-40 pt-8">
        <Korrel o={0.055} />
        <Watermerk kleur={MINT} style={{ width: 340, top: -60, left: -80, opacity: 0.35 }} />
        <Watermerk kleur={CORAL} style={{ width: 150, top: 120, right: 40, opacity: 0.1, transform: "rotate(30deg)" }} />

        {/* topbalk */}
        <div className="relative z-30 mx-auto flex max-w-6xl items-center justify-between px-6">
          <span className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: D, color: INK_DEEP }}>
            av<span style={{ color: CORAL }}>i</span>nka
          </span>
          <Link href="/sign-up" className="rounded-full px-5 py-2.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5" style={{ background: CORAL, fontFamily: B }}>
            Begin gratis
          </Link>
        </div>

        <Sticker className="absolute right-[8%] top-40 hidden md:block" rot={8}>✓ gemaakt door een juf</Sticker>

        {/* zwevende UI-kaartjes (decoratief; op mobiel weg, anders botsen ze met de tekst) */}
        <div data-par="-0.05" className="hidden md:block">
          <Zweef style={{ left: "6%", top: 300 }} delay="0s">
            <div className="flex items-center gap-3">
              <Vink className="h-8 w-8" bg={CORAL} />
              <div><p className="text-sm font-extrabold" style={{ fontFamily: D, color: INK_DEEP }}>Rapport · groep 5</p><p className="text-xs" style={{ color: `${INK}aa` }}>klaar in 4 min</p></div>
            </div>
          </Zweef>
        </div>
        <div data-par="-0.09" className="hidden md:block">
          <Zweef style={{ right: "7%", top: 340 }} delay="1.6s">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: `${INK}99` }}>Toetsanalyse · groep 5</p>
            {[["Spelling", 0.82, CORAL], ["Rekenen", 0.64, TEALDK], ["Lezen", 0.9, MINT]].map(([l, w, c]) => (
              <div key={l as string} className="mb-1.5 flex items-center gap-2">
                <span className="w-14 text-[0.7rem]" style={{ color: INK }}>{l as string}</span>
                <span className="h-2 flex-1 rounded-full" style={{ background: "#eee" }}><span className="block h-2 rounded-full" style={{ width: `${(w as number) * 100}%`, background: c as string }} /></span>
              </div>
            ))}
          </Zweef>
        </div>

        <div className="relative z-20 mx-auto mt-16 max-w-3xl px-6 text-center sm:mt-24">
          <p data-reveal className="text-3xl" style={{ fontFamily: S, color: TEALDK }}>voor leerkrachten in het basisonderwijs</p>
          <h1 data-reveal data-d="1" className="mx-auto mt-2 max-w-3xl text-[clamp(3rem,8vw,6rem)] font-extrabold leading-[0.98] tracking-[-0.01em]" style={{ fontFamily: D, color: INK_DEEP }}>
            Win elke week{" "}
            <span className="relative inline-block whitespace-nowrap">
              <span style={{ color: CORAL }}>twee uur</span>
              <svg className="absolute -bottom-2 left-0 w-full" height="16" viewBox="0 0 300 16" preserveAspectRatio="none" aria-hidden><path d="M3 9 C 70 3, 150 15, 220 7 S 285 5, 297 10" fill="none" stroke={CORAL} strokeWidth="4" strokeLinecap="round" /></svg>
            </span>{" "}
            terug.
          </h1>
          <p data-reveal data-d="2" className="mx-auto mt-7 max-w-xl text-lg leading-8">
            Al je schoolwerk op één plek. Avinka doet het administratieve voorwerk,
            jij houdt tijd over voor de klas.
          </p>
          <div data-reveal data-d="3" className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link href="/sign-up" className="rounded-full px-9 py-4 text-lg font-extrabold text-white shadow-[0_18px_36px_-16px_rgba(236,104,89,0.8)] transition hover:-translate-y-0.5" style={{ background: CORAL, fontFamily: D }}>
              Begin gratis
            </Link>
            <span className="text-lg" style={{ fontFamily: S, color: `${INK}cc` }}>7 dagen · zonder betaalgegevens</span>
          </div>
        </div>

        <Golf kleur={MINT} />
      </section>

      {/* ══ HERKEN ════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-32" style={{ background: MINT }}>
        <Korrel o={0.06} />
        <Watermerk kleur={MINT_SOFT} style={{ width: 260, bottom: -40, left: 30, opacity: 0.6 }} />

        <div className="relative z-20 mx-auto grid max-w-5xl gap-12 px-6 md:grid-cols-[0.85fr_1.15fr] md:items-center">
          <div>
            <h2 data-reveal className="text-[clamp(2.4rem,5vw,4rem)] font-extrabold leading-[0.98] tracking-tight" style={{ fontFamily: D, color: INK_DEEP }}>
              Herken je dit?
            </h2>
            <p data-reveal data-d="1" className="mt-5 text-2xl" style={{ fontFamily: S, color: TEALDK }}>
              het hoort bij het werk. maar het kan slimmer.
            </p>
          </div>
          <div className="relative">
            {["Rapporten schrijven tot diep in de avond", "Toetsen analyseren in het weekend", "Oudermail die er ook nog tussendoor moet"].map((t, i) => (
              <div key={t} data-reveal data-d={String(i + 1)}
                className="mb-4 flex items-center gap-4 rounded-[24px] bg-white p-5 shadow-[0_24px_50px_-30px_rgba(38,64,60,0.5)]"
                style={{ marginLeft: i * 28, rotate: `${i % 2 ? 1 : -1}deg` }}>
                <Vink className="h-9 w-9 shrink-0" bg={CORAL} />
                <span className="text-lg font-bold" style={{ color: INK_DEEP }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <Golf kleur={PAPER} />
      </section>

      {/* ══ TOOLS (bento) ═════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-32">
        <Korrel o={0.05} />
        <div className="relative z-20 mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p data-reveal className="text-2xl" style={{ fontFamily: S, color: CORAL }}>alles op één werkplek</p>
            <h2 data-reveal data-d="1" className="mt-1 text-[clamp(2.2rem,5vw,3.8rem)] font-extrabold leading-tight tracking-tight" style={{ fontFamily: D, color: INK_DEEP }}>
              De tools die je werk overnemen
            </h2>
          </div>

          <div className="mt-14 grid auto-rows-[minmax(150px,auto)] grid-cols-2 gap-5 lg:grid-cols-4">
            {[
              { n: "Rapporten", u: "Warme, kloppende teksten in jouw toon.", t: "± 30 min", c: CORAL, span: "lg:col-span-2 lg:row-span-2", big: true, kind: "rapport" },
              { n: "Toetsanalyse", u: "Het groepsbeeld in één oogopslag.", t: "± 45 min", c: TEALDK, kind: "bars" },
              { n: "Oudercontact", u: "Een nette mail in twee minuten.", t: "± 15 min", c: MINT },
              { n: "Lesontwerp", u: "Een complete les uit één leerdoel.", t: "± 25 min", c: TEALDK, span: "lg:col-span-2", kind: "stappen" },
              { n: "Werkbladen", u: "Printbaar, precies op niveau.", t: "± 20 min", c: CORAL },
            ].map((tool, i) => {
              const ac = tool.c === MINT ? TEALDK : tool.c;
              return (
              <div key={tool.n} data-reveal data-d={String((i % 3) + 1)}
                className={`group relative flex flex-col overflow-hidden rounded-[28px] bg-white p-6 shadow-[0_28px_60px_-38px_rgba(38,64,60,0.55)] ring-1 ring-black/[0.03] transition hover:-translate-y-1 ${tool.span || ""}`}>
                <span className="absolute right-5 top-5 h-10 w-10 rounded-xl" style={{ background: tool.c, opacity: 0.16 }} aria-hidden />
                <Vink className={tool.big ? "h-12 w-12" : "h-9 w-9"} bg={ac} />
                <h3 className={`mt-4 font-extrabold tracking-tight ${tool.big ? "text-3xl" : "text-xl"}`} style={{ fontFamily: D, color: INK_DEEP }}>{tool.n}</h3>
                <p className="mt-1.5 leading-6" style={{ color: `${INK}dd` }}>{tool.u}</p>
                <span className="mt-4 inline-block w-max rounded-full px-3 py-1 text-xs font-bold" style={{ background: `${ac}1a`, color: ac }}>bespaart {tool.t} per keer</span>

                {tool.kind === "rapport" && (
                  <div className="mt-6 flex flex-1 flex-col rounded-2xl p-5" style={{ background: PAPER }}>
                    <p className="text-xl leading-snug" style={{ fontFamily: S, color: INK }}>&ldquo;Sofie liet dit half jaar een mooie groei zien in haar spelling. Ze pakt nieuwe klanken snel op&hellip;&rdquo;</p>
                    <div className="mt-4 space-y-2.5">{[100, 94, 88, 96, 82, 70].map((w, j) => (<span key={j} className="block h-2.5 rounded-full" style={{ width: `${w}%`, background: `${INK}14` }} />))}</div>
                    <div className="mt-auto flex items-center gap-2 pt-4">
                      <Vink className="h-6 w-6" bg={CORAL} />
                      <span className="text-sm font-bold" style={{ color: `${INK}cc` }}>in jouw eigen toon</span>
                    </div>
                  </div>
                )}
                {tool.kind === "bars" && (
                  <div className="mt-4 space-y-2">
                    {[["Spelling", 0.82, CORAL], ["Rekenen", 0.6, TEALDK], ["Lezen", 0.9, MINT]].map(([l, w, c]) => (
                      <div key={l as string} className="flex items-center gap-2">
                        <span className="w-14 shrink-0 text-[0.7rem]" style={{ color: INK }}>{l as string}</span>
                        <span className="h-2 flex-1 rounded-full" style={{ background: `${INK}12` }}><span className="block h-2 rounded-full" style={{ width: `${(w as number) * 100}%`, background: c as string }} /></span>
                      </div>
                    ))}
                  </div>
                )}
                {tool.kind === "stappen" && (
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {["Start", "Uitleg", "Samen", "Zelf", "Afsluiten"].map((s, j) => (
                      <div key={s} className="flex items-center gap-2">
                        <span className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: `${ac}12`, color: INK_DEEP }}>{s}</span>
                        {j < 4 && <span className="h-px w-3" style={{ background: `${INK}22` }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>
        <Golf kleur={INK_DEEP} />
      </section>

      {/* ══ PRIVACY (bold statement) ══════════════════════════════════════ */}
      <section className="relative overflow-hidden py-36 text-center" style={{ background: INK_DEEP }}>
        <Korrel o={0.09} />
        <Watermerk kleur="#ffffff" style={{ width: 320, top: -50, right: -60, opacity: 0.04 }} />

        <div className="relative z-20 mx-auto max-w-3xl px-6">
          <p data-reveal className="text-2xl" style={{ fontFamily: S, color: MINT }}>privacy voorop</p>
          <h2 data-reveal data-d="1" className="mt-1 text-[clamp(2.6rem,6vw,4.6rem)] font-extrabold leading-[0.98] tracking-tight text-white" style={{ fontFamily: D }}>
            Namen blijven thuis.
          </h2>
          <p data-reveal data-d="2" className="mx-auto mt-6 max-w-lg text-lg leading-8" style={{ color: "#dfeae7" }}>
            De AI ziet nooit de echte naam van een leerling. Die wordt gemaskeerd
            voordat er iets de deur uitgaat.
          </p>

          <div data-reveal data-d="2" className="mx-auto mt-12 max-w-md space-y-3">
            {[["Sofie", "leerling A"], ["Daan", "leerling B"], ["Iris", "leerling C"]].map(([naam, mask]) => (
              <div key={naam} className="maskrij flex items-center justify-center gap-4 rounded-2xl bg-white/[0.06] px-6 py-4 ring-1 ring-white/10">
                <span className="weg text-xl font-bold text-white line-through decoration-[#ec6859] decoration-2">{naam}</span>
                <svg width="28" height="16" viewBox="0 0 28 16" fill="none" aria-hidden><path d="M2 8h22m0 0l-6-5m6 5l-6 5" stroke={MINT} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="kom text-xl font-extrabold" style={{ fontFamily: D, color: MINT }}>{mask}</span>
              </div>
            ))}
          </div>
        </div>
        <Golf kleur={PAPER} />
      </section>

      {/* ══ SLOT ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-36 text-center">
        <Korrel o={0.05} />
        <Watermerk kleur={MINT} style={{ width: 300, bottom: -70, left: -50, opacity: 0.4 }} />
        <div className="relative z-20 mx-auto max-w-2xl px-6">
          <Vink className="mx-auto h-16 w-16" bg={CORAL} />
          <h2 data-reveal className="mt-6 text-[clamp(2.6rem,6vw,4.4rem)] font-extrabold leading-[0.98] tracking-tight" style={{ fontFamily: D, color: INK_DEEP }}>
            Kom binnen. Je werkplek staat klaar.
          </h2>
          <Link href="/sign-up" data-reveal data-d="1" className="mt-9 inline-block rounded-full px-10 py-4 text-lg font-extrabold text-white shadow-[0_18px_36px_-16px_rgba(236,104,89,0.8)] transition hover:-translate-y-0.5" style={{ background: CORAL, fontFamily: D }}>
            Begin gratis
          </Link>
          <p data-reveal data-d="2" className="mt-8 text-sm" style={{ color: `${INK}99` }}>
            Verkenning "max" · referentie-palet ·{" "}
            <Link href="/verkenning" className="underline">terug naar de drie</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

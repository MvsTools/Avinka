"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

/* Proef — "De rode pen × Bahama-energie", vertaald naar Avinka.
   Warm papier als grond, rood als de speelse pop, chalk-mint als koele band.
   Speels = product in beweging (zwevende mini-kaartjes, sticker, golf-
   overgangen, korrel), niet cartoon-tekeningetjes. Bricolage + Caveat + sans. */

const PAPIER = "#f7f3ea";
const INK = "#211d19";
const ROOD = "#d63a2f";
const ROOD_DK = "#b82f26";
const MINT = "#dde7e1";

const D = "var(--font-bricolage)"; // display
const H = "var(--font-caveat)"; // hand/script
const S = "var(--font-instrument)"; // sans body

/* Rode omcirkeling om een woord, zoals een leerkracht aankringelt. */
function Cirkel({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap px-1">
      {children}
      <svg className="absolute -left-3 -right-3 bottom-[16%] top-[20%]" viewBox="0 0 200 70" preserveAspectRatio="none" aria-hidden>
        <path
          d="M100 6 C 40 4, 8 20, 10 38 C 12 58, 70 66, 108 64 C 168 61, 194 44, 190 28 C 186 12, 150 5, 96 8"
          fill="none" stroke={ROOD} strokeWidth="2.5" strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/* Een klein zwevend product-kaartje: een afgevinkte taak. */
function ZweefKaart({
  label, sub, style, delay,
}: { label: string; sub: string; style: CSSProperties; delay: string }) {
  return (
    <div className="zweef absolute" style={{ ...style, animationDelay: delay }} aria-hidden>
      <div className="flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 shadow-[0_18px_40px_-20px_rgba(33,29,25,0.5)] ring-1 ring-black/[0.04]">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-sm text-white" style={{ background: ROOD }}>✓</span>
        <div>
          <p className="text-sm font-bold leading-tight" style={{ fontFamily: D, color: INK }}>{label}</p>
          <p className="text-[0.7rem] leading-tight" style={{ color: `${INK}80` }}>{sub}</p>
        </div>
      </div>
    </div>
  );
}

/* Organische golf-overgang naar de volgende kleur. */
function Golf({ kleur, flip = false }: { kleur: string; flip?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 leading-[0]" style={flip ? { top: -1 } : { bottom: -1 }} aria-hidden>
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="block h-[70px] w-full sm:h-[110px]" style={flip ? { transform: "scaleY(-1)" } : undefined}>
        <path d="M0 60 C 240 120, 480 10, 720 44 C 960 78, 1200 128, 1440 56 L1440 120 L0 120 Z" fill={kleur} />
      </svg>
    </div>
  );
}

export default function AvinkaStijl() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const els = root.current?.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!els?.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.18 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <main
      ref={root}
      style={{ fontFamily: `${S}, system-ui, sans-serif`, color: INK, background: PAPIER } as CSSProperties}
    >
      <style>{`
        [data-reveal]{opacity:0;transform:translateY(26px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.7,.2,1)}
        [data-reveal].in{opacity:1;transform:none}
        [data-reveal][data-d="1"]{transition-delay:.08s}
        [data-reveal][data-d="2"]{transition-delay:.16s}
        [data-reveal][data-d="3"]{transition-delay:.24s}
        @keyframes zweef{0%,100%{transform:translateY(0) rotate(var(--r,0deg))}50%{transform:translateY(-14px) rotate(var(--r,0deg))}}
        .zweef{animation:zweef 6s ease-in-out infinite}
        .korrel{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");mix-blend-mode:multiply}
        @media (prefers-reduced-motion: reduce){.zweef{animation:none}}
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <span className="korrel pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden />

        {/* gedraaide sticker die in de hoek meekijkt */}
        <div
          className="zweef absolute right-6 top-28 hidden rotate-[9deg] sm:block"
          style={{ "--r": "9deg", animationDelay: ".4s" } as CSSProperties}
          aria-hidden
        >
          <span className="inline-flex items-center gap-1.5 rounded-xl border-[3px] px-3 py-1.5 text-sm font-black uppercase tracking-wide"
            style={{ color: ROOD, borderColor: ROOD, background: PAPIER }}>
            ✓ 7 dagen gratis
          </span>
        </div>

        {/* zwevende product-kaartjes */}
        <ZweefKaart label="Rapport · groep 5" sub="klaar in 4 min" delay="0s"
          style={{ right: "6%", top: 300, "--r": "-5deg" } as CSSProperties} />
        <ZweefKaart label="Oudermail verstuurd" sub="warm & persoonlijk" delay="2s"
          style={{ left: "4%", top: 420, "--r": "4deg" } as CSSProperties} />

        <div className="relative mx-auto max-w-4xl px-6 pb-40 pt-28 text-center sm:pt-32">
          <p data-reveal className="text-3xl" style={{ fontFamily: H, color: ROOD }}>
            van een leerkracht, voor leerkrachten
          </p>
          <h1 data-reveal data-d="1"
            className="mx-auto mt-3 max-w-3xl text-[clamp(3rem,8vw,6rem)] font-extrabold leading-[0.95] tracking-[-0.02em]"
            style={{ fontFamily: D }}>
            Win elke week <Cirkel>twee uur</Cirkel> terug.
          </h1>
          <p data-reveal data-d="2" className="mx-auto mt-8 max-w-xl text-xl leading-8" style={{ color: `${INK}cc` }}>
            Al je schoolwerk staat overal en nergens. Avinka brengt het samen op
            één eigen werkplek en neemt het administratieve werk uit handen.
          </p>
          <div data-reveal data-d="3" className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/sign-up" className="rounded-full px-8 py-4 text-lg font-bold text-white shadow-sm transition hover:-translate-y-0.5"
              style={{ background: ROOD }}
              onMouseOver={(e) => (e.currentTarget.style.background = ROOD_DK)}
              onMouseOut={(e) => (e.currentTarget.style.background = ROOD)}>
              Begin gratis
            </Link>
            <span className="text-xl" style={{ fontFamily: H, color: `${INK}99` }}>zonder betaalgegevens</span>
          </div>
        </div>

        <Golf kleur={MINT} />
      </section>

      {/* ── GEKLEURDE BAND (chalk-mint) ──────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: MINT }}>
        <span className="korrel pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden />
        {/* spaarzame confetti */}
        <span className="absolute left-[12%] top-16 text-2xl" style={{ color: ROOD, opacity: 0.5 }} aria-hidden>✓</span>
        <span className="absolute right-[16%] top-40 h-2.5 w-2.5 rounded-full" style={{ background: ROOD, opacity: 0.35 }} aria-hidden />
        <span className="absolute left-[20%] bottom-24 h-2 w-2 rounded-full" style={{ background: INK, opacity: 0.2 }} aria-hidden />

        <div className="relative mx-auto max-w-5xl px-6 py-28 sm:py-36">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div data-reveal>
              <h2 className="text-[clamp(2.2rem,4.5vw,3.6rem)] font-extrabold leading-tight tracking-tight" style={{ fontFamily: D }}>
                Alles op één plek. En het vinkt zichzelf af.
              </h2>
              <p className="mt-6 text-lg leading-8" style={{ color: `${INK}cc` }}>
                Rapporten, toetsanalyses, oudercontact en je lessen. Avinka doet
                het voorwerk, jij houdt de regie en zet de laatste streep.
              </p>
              <p className="mt-5 text-2xl" style={{ fontFamily: H, color: ROOD_DK }}>
                zo hou je tijd over voor de klas.
              </p>
            </div>

            {/* blob-kaart met een afvink-lijstje */}
            <div data-reveal data-d="1" className="relative">
              <div className="bg-white p-8 shadow-[0_40px_80px_-40px_rgba(33,29,25,0.5)]"
                style={{ borderRadius: "40px 52px 44px 56px" }}>
                <div className="mx-auto max-w-sm">
                  {[["Rapporten geschreven", true], ["Toetsen geanalyseerd", true], ["Oudermail klaar", true], ["Les voor morgen", false]].map(([t, done]) => (
                    <div key={t as string} className="flex items-center gap-3 border-b py-3 last:border-0" style={{ borderColor: `${INK}12` }}>
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg text-sm text-white"
                        style={{ background: done ? ROOD : "transparent", border: done ? "none" : `2px solid ${INK}33`, color: done ? "#fff" : "transparent" }}>✓</span>
                      <span className="text-base font-semibold" style={{ color: done ? `${INK}` : `${INK}88`, textDecoration: done ? "none" : "none" }}>{t as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Golf kleur={PAPIER} />
      </section>

      {/* ── SLOT ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-32 text-center">
        <span className="korrel pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden />
        <div className="relative mx-auto max-w-2xl px-6">
          <p data-reveal className="text-3xl" style={{ fontFamily: H, color: ROOD }}>✓ nagekeken</p>
          <h2 data-reveal data-d="1" className="mt-3 text-[clamp(2.4rem,5.5vw,4.2rem)] font-extrabold leading-[0.98] tracking-tight" style={{ fontFamily: D }}>
            Kom binnen. Je werkplek staat klaar.
          </h2>
          <Link data-reveal data-d="2" href="/sign-up"
            className="mt-9 inline-block rounded-full px-9 py-4 text-lg font-bold text-white transition hover:-translate-y-0.5"
            style={{ background: ROOD }}>
            Probeer Avinka gratis
          </Link>
          <p data-reveal data-d="3" className="mt-10 text-sm" style={{ color: `${INK}70` }}>
            Proef · rode pen × Bahama-energie ·{" "}
            <Link href="/verkenning" className="underline">terug naar de drie</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

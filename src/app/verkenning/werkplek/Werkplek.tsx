"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

/* Proef — "De opgeruimde werkplek".
   Avinka's eigen wereld: papier, planning, nakijken. Groen BLIJFT de huiskleur.
   Chill-recept van Bahama, maar Avinka: zachte salie-gronden, vol groen alleen
   als accent + vinkje, warme getinte inkt, veel lucht. Motief-familie i.p.v.
   vinkjes-behang: vaag weekraster, korrel, één markeerstreek, een post-it,
   een enkel ✓. Bricolage-koppen (die de eigenaar mooi vond) + rustige body. */

const PAPIER = "#faf6ee";
const SALIE = "#e7efe6";
const GROEN = "#2f9e6e";
const GROEN_DK = "#25855a";
const INK = "#221c3a";
const INKBODY = "#4b5147";
const AMBER = "#f59e0b";
const D = "var(--font-bricolage)";
const H = "var(--font-hand)";

/* Golf-overgang naar de volgende kleur. */
function Golf({ kleur, flip = false }: { kleur: string; flip?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 leading-[0]" style={flip ? { top: -1 } : { bottom: -1 }} aria-hidden>
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="block h-[64px] w-full sm:h-[104px]" style={flip ? { transform: "scaleY(-1)" } : undefined}>
        <path d="M0 64 C 260 118, 520 18, 780 50 C 1010 78, 1240 122, 1440 62 L1440 120 L0 120 Z" fill={kleur} />
      </svg>
    </div>
  );
}

/* De achtergrondwereld: warm vlak + heel vaag weekraster + korrel. */
function Wereld({ kleur, children, className = "" }: { kleur: string; children: ReactNode; className?: string }) {
  return (
    <section className={`relative overflow-hidden ${className}`} style={{ background: kleur }}>
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            `linear-gradient(${INK}0a 1px, transparent 1px), linear-gradient(90deg, ${INK}0a 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(120% 90% at 50% 0%, #000 40%, transparent 78%)",
          opacity: 0.5,
        }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-multiply"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")" }}
        aria-hidden
      />
      {children}
    </section>
  );
}

/* Markeerstift-streek onder een woord — één van onze motieven, spaarzaam. */
function Streek({ children, kleur = AMBER }: { children: ReactNode; kleur?: string }) {
  return (
    <span className="relative inline-block">
      <span className="absolute inset-x-[-2px] bottom-[0.08em] -z-0 h-[0.42em] -rotate-1 rounded-[2px]" style={{ background: kleur, opacity: 0.32 }} aria-hidden />
      <span className="relative z-10">{children}</span>
    </span>
  );
}

/* Groen vinkje-plaatje, als leesteken (niet als behang). */
function Vink({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-lg ${className}`} style={{ background: GROEN }} aria-hidden>
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

export default function Werkplek() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const els = root.current?.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!els?.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")), { threshold: 0.15 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  return (
    <main ref={root} style={{ fontFamily: "var(--font-sans), system-ui, sans-serif", color: INKBODY }}>
      <style>{`
        [data-reveal]{opacity:0;transform:translateY(22px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.7,.2,1)}
        [data-reveal].in{opacity:1;transform:none}
        [data-reveal][data-d="1"]{transition-delay:.09s}[data-reveal][data-d="2"]{transition-delay:.18s}
        @keyframes zweef{0%,100%{transform:translateY(0) rotate(var(--r,0deg))}50%{transform:translateY(-10px) rotate(var(--r,0deg))}}
        .zweef{animation:zweef 6.5s ease-in-out infinite}
        @media (prefers-reduced-motion: reduce){.zweef{animation:none}}
      `}</style>

      {/* ── Intro op papier ── */}
      <Wereld kleur={PAPIER} className="pb-28">
        {/* een post-it die piept: motief uit de werkplek-wereld */}
        <div className="zweef absolute right-[7%] top-24 hidden -rotate-3 sm:block" style={{ "--r": "-3deg" } as CSSProperties} aria-hidden>
          <div className="w-40 px-4 py-3 shadow-[0_16px_30px_-16px_rgba(34,28,58,0.4)]" style={{ background: "#fdf3c4", fontFamily: H, color: INK }}>
            <span className="text-lg leading-tight">oudergesprekken plannen</span>
          </div>
        </div>

        <div className="relative mx-auto max-w-3xl px-6 pt-28 text-center">
          <p data-reveal className="text-2xl" style={{ fontFamily: H, color: GROEN_DK }}>van een leerkracht, voor leerkrachten</p>
          <h1 data-reveal data-d="1" className="mx-auto mt-3 max-w-2xl text-[clamp(2.6rem,6.5vw,5rem)] font-extrabold leading-[1.02] tracking-tight" style={{ fontFamily: D, color: INK }}>
            Alles op één plek. <Streek>Rust in je week.</Streek>
          </h1>
          <p data-reveal data-d="2" className="mx-auto mt-7 max-w-xl text-lg leading-8">
            Rapporten, toetsanalyses, oudercontact en je lessen. Avinka doet het
            voorwerk, jij houdt de regie. Zo win je elke week een paar uur terug.
          </p>
          <div data-reveal data-d="2" className="mt-9">
            <Link href="/sign-up" className="inline-block rounded-full px-8 py-3.5 text-lg font-bold text-white shadow-sm transition hover:-translate-y-0.5" style={{ background: GROEN }}>
              Begin gratis
            </Link>
          </div>
        </div>
        <Golf kleur={SALIE} />
      </Wereld>

      {/* ── Salie-band: privacy als twee overlappende kaarten ── */}
      <Wereld kleur={SALIE} className="py-28 sm:py-36">
        <div className="relative mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 data-reveal className="text-[clamp(2rem,4.5vw,3.2rem)] font-extrabold leading-tight tracking-tight" style={{ fontFamily: D, color: INK }}>
              Er is één ding dat we bewust niet doen
            </h2>
            <p data-reveal data-d="1" className="mx-auto mt-5 max-w-xl text-lg leading-8">
              Gegevens van leerlingen bewaren we niet. Ze blijven bij jou, niet bij ons.
            </p>
          </div>

          {/* twee kaarten die elkaar overlappen */}
          <div className="relative mt-14 flex flex-col items-center gap-0 lg:mt-16 lg:flex-row lg:justify-center">
            {/* Kaart 1: wat we wel/niet bewaren */}
            <div data-reveal className="relative z-10 w-full max-w-sm rounded-[30px] bg-white p-7 shadow-[0_36px_70px_-40px_rgba(34,28,58,0.5)] ring-1 ring-black/[0.04] lg:mr-[-28px]">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em]" style={{ color: `${INKBODY}99` }}>Wat we wel bewaren</p>
              <ul className="mt-4 space-y-2.5">
                {["lesontwerpen", "werkbladen", "draaiboeken"].map((t) => (
                  <li key={t} className="flex items-center gap-2.5 font-bold" style={{ color: INK }}>
                    <Vink className="h-5 w-5" /> {t}
                  </li>
                ))}
              </ul>
              <div className="my-5 border-t border-dashed" style={{ borderColor: `${INKBODY}33` }} />
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em]" style={{ color: `${INKBODY}99` }}>Wat we niet bewaren</p>
              <ul className="mt-4 space-y-2.5" style={{ color: `${INKBODY}88` }}>
                {["leerlinggegevens", "toetsresultaten", "gespreksverslagen"].map((t) => (
                  <li key={t} className="line-through decoration-2" style={{ textDecorationColor: `${GROEN}99` }}>{t}</li>
                ))}
              </ul>
            </div>

            {/* Kaart 2: klassenlijst, iets lager en overlappend */}
            <div data-reveal data-d="1" className="relative z-0 mt-[-24px] w-full max-w-sm rotate-[1.5deg] rounded-[30px] bg-white p-7 shadow-[0_36px_70px_-40px_rgba(34,28,58,0.5)] ring-1 ring-black/[0.04] lg:mt-10">
              <div className="flex items-baseline justify-between">
                <p className="text-lg font-black" style={{ fontFamily: D, color: INK }}>Groep 5</p>
                <p className="text-xs" style={{ color: `${INKBODY}80` }}>24 leerlingen</p>
              </div>
              <div className="mt-4 flex text-[0.6rem] font-bold uppercase tracking-[0.12em]">
                <span className="flex-1" style={{ color: `${INKBODY}99` }}>Op jouw apparaat</span>
                <span className="w-24 pl-3" style={{ color: GROEN_DK }}>De AI ziet</span>
              </div>
              <ul className="mt-1">
                {["Sofie", "Daan", "Iris", "Mees"].map((n, i) => (
                  <li key={n} className="flex border-t" style={{ borderColor: `${INK}0f` }}>
                    <span className="flex-1 py-2 font-semibold" style={{ color: INK }}>{n}</span>
                    <span className="w-24 py-2 pl-3 font-semibold" style={{ background: `${GROEN}12`, color: GROEN_DK }}>leerling {String.fromCharCode(65 + i)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <Golf kleur={PAPIER} />
      </Wereld>

      {/* ── Slot op papier ── */}
      <Wereld kleur={PAPIER} className="py-28 text-center">
        <div className="relative mx-auto max-w-2xl px-6">
          <Vink className="mx-auto h-14 w-14" />
          <h2 data-reveal className="mt-5 text-[clamp(2.2rem,5vw,3.8rem)] font-extrabold leading-tight tracking-tight" style={{ fontFamily: D, color: INK }}>
            Kom binnen. Je werkplek staat klaar.
          </h2>
          <Link href="/sign-up" data-reveal data-d="1" className="mt-8 inline-block rounded-full px-9 py-4 text-lg font-bold text-white transition hover:-translate-y-0.5" style={{ background: GROEN }}>
            Probeer Avinka gratis
          </Link>
          <p data-reveal data-d="2" className="mt-9 text-sm" style={{ color: `${INKBODY}80` }}>
            Proef · de opgeruimde werkplek ·{" "}
            <Link href="/verkenning" className="underline">terug naar de drie</Link>
          </p>
        </div>
      </Wereld>
    </main>
  );
}

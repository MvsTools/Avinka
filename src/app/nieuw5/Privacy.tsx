"use client";

import type { CSSProperties } from "react";
import { DONKER, Golf, KOP, MINT_LICHT, KaartVlak, VLAK_MINT } from "./Wereld";

/* ── De privacysectie ──────────────────────────────────────────────────────
   Nagebouwd naar de referentie die de eigenaar aanwees: het middenstuk van
   ente.io (public/_referenties/02b-ente-mid.png). Wat hij daar sterk aan
   vond, en wat hier dus terug moet komen:

   1. TWEE LOSSE KAARTEN die elk ÉÉN ding uitleggen. Dat past precies op de
      twee beloftes: namen gaan nooit mee, en wij bewaren niets over
      leerlingen. Niet één sectie die alles tegelijk probeert te zeggen.
   2. HET PLAATJE ZEGT WAT HET DOET. Ente tekent vierkantjes om de gezichten
      met een naamchip eraan; je snapt gezichtsherkenning zonder één woord.
      Hier: kadertjes op de schriften met een chip die de SCHUILNAAM toont,
      en een zoekbalkje over het lege lokaal dat nul resultaten geeft.
   3. ECHTE FOTO'S, want dat maakt het warm. Dezelfde rechtenvrije
      schoolfoto's die ook bij de polaroids gebruikt worden.

   Bewust GEEN foto's van kinderen: een privacysectie die kindergezichten
   toont om over privacy te praten, spreekt zichzelf tegen. De namen zitten
   op het schoolwerk, en dat is ook waar ze in het echt staan.

   Na vijf verzonnen versies (bureaublad, prikbord, onderwater, de grens, de
   sluis) is dit de eerste die naar een goedgekeurde referentie is gebouwd.
   Zie [[referentie-eerst-regel]]: eerst het beeld, dan pas bouwen. ────── */

const CHIP_A: CSSProperties = { background: "#2f9e6e", color: "#ffffff" };

/* De kadertjes op de eerste foto. Percentages t.o.v. het fotovlak, gekozen
   op plekken waar op een schrift ook echt een naam staat. */
const KADERS = [
  { left: "6%", top: "18%", w: "30%", h: "17%", chip: "leerling A", vert: 0 },
  { left: "33%", top: "45%", w: "30%", h: "16%", chip: "leerling B", vert: 120 },
  { left: "12%", top: "70%", w: "31%", h: "16%", chip: "leerling C", vert: 240 },
];

export function WereldPrivacy() {
  return (
    <section className="relative overflow-hidden" style={{ background: MINT_LICHT }} aria-label="Privacy">
      <Golf kleur="#fcfbf7" flip vorm="oploopRechts" hoogte="h-[70px] sm:h-[118px]" />
      <KaartVlak
        kleur={VLAK_MINT}
        vorm="koepel"
        breedte={720}
        hoogte={340}
        style={{ right: "-16%", top: 70, transform: "rotate(-5deg)" }}
        className="hidden lg:block"
        tel={3}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24 pt-28 lg:pb-28 lg:pt-32">
        <div className="max-w-2xl">
          <p data-reveal className="text-2xl" style={{ fontFamily: "var(--font-hand)", color: KOP }}>
            privacy voorop
          </p>
          <h2
            data-reveal
            className="mt-2 font-display text-[clamp(2.1rem,4.4vw,3.4rem)] font-black leading-[1.03] tracking-tight [text-wrap:balance]"
            style={{ color: DONKER }}
          >
            Er is één ding dat we bewust niet doen.
          </h2>
        </div>

        {/* ── de twee kaarten ── */}
        <div className="mt-12 grid gap-6 lg:mt-14 lg:grid-cols-2 lg:gap-8">
          {/* KAART 1 — de maskering, letterlijk op het schoolwerk */}
          <article
            data-reveal
            className="rounded-[2.5rem] bg-white p-6 shadow-[-10px_30px_70px_-42px_rgba(23,80,58,0.6)] ring-1 ring-ink/[0.04] sm:p-8"
          >
            <h3
              className="text-center font-display text-[clamp(1.6rem,2.6vw,2.1rem)] font-black tracking-tight"
              style={{ color: DONKER }}
            >
              Namen gaan nooit mee
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-center text-base leading-7 text-ink/60">
              Op jouw eigen apparaat vervangen door een schuilnaam, nog vóór er
              iets wordt verstuurd.
            </p>

            <div className="relative mt-6 overflow-hidden rounded-[1.6rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/nieuw5/foto/p7054755.jpg"
                alt="Een stapel schriften met een potlood erop, zoals ze op een lerarenbureau liggen"
                className="block aspect-[4/3] w-full object-cover"
              />

              {/* de kadertjes, zoals de vierkantjes om de gezichten in de
                 referentie — maar wat er uitkomt is juist géén naam */}
              {KADERS.map((k) => (
                <span
                  key={k.chip}
                  data-reveal
                  style={{
                    left: k.left,
                    top: k.top,
                    width: k.w,
                    height: k.h,
                    transitionDelay: `${k.vert + 200}ms`,
                  }}
                  className="absolute rounded-[14px] border-[3px] border-white/95 shadow-[0_2px_14px_rgba(0,0,0,0.25)]"
                  aria-hidden
                >
                  <span
                    className="absolute -bottom-3 -right-2 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.72rem] font-bold shadow-md sm:text-[0.78rem]"
                    style={CHIP_A}
                  >
                    {k.chip}
                  </span>
                </span>
              ))}

              {/* het bijschrift ín de foto, zoals de referentie doet */}
              <span
                className="absolute left-3 top-3 hidden rounded-full bg-black/45 px-3 py-1.5 text-[0.7rem] font-bold text-white backdrop-blur-sm sm:block"
                aria-hidden
              >
                wat de AI ontvangt
              </span>
            </div>
          </article>

          {/* KAART 2 — het lege archief */}
          <article
            data-reveal
            style={{ transitionDelay: "120ms" }}
            className="rounded-[2.5rem] bg-white p-6 shadow-[-10px_30px_70px_-42px_rgba(23,80,58,0.6)] ring-1 ring-ink/[0.04] sm:p-8"
          >
            <h3
              className="text-center font-display text-[clamp(1.6rem,2.6vw,2.1rem)] font-black tracking-tight"
              style={{ color: DONKER }}
            >
              Wij bewaren niets over je klas
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-center text-base leading-7 text-ink/60">
              Je lesontwerpen, werkbladen en draaiboeken bewaren we wel. Alles
              over je leerlingen niet.
            </p>

            <div className="relative mt-6 overflow-hidden rounded-[1.6rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/nieuw5/foto/p36650154.jpg"
                alt="Een leeg klaslokaal met houten tafeltjes en een groen schoolbord"
                className="block aspect-[4/3] w-full object-cover"
              />

              {/* het zoekbalkje: zoek een leerling in ons archief, en vind
                 niets. Zelfde compositie als de zoekbalk over de foto's in de
                 referentie, maar met de uitkomst als de clou. */}
              <div
                data-reveal
                style={{ transitionDelay: "260ms" }}
                className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6"
              >
                <div className="flex items-center gap-2.5 rounded-full bg-white px-4 py-3 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.4)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-ink/40" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                  <span className="text-base text-ink/80" style={{ fontFamily: "var(--font-hand)" }}>
                    Sofie
                  </span>
                  <span className="ml-auto whitespace-nowrap rounded-full bg-brand/10 px-2.5 py-1 text-[0.72rem] font-bold" style={{ color: KOP }}>
                    0 resultaten
                  </span>
                </div>
              </div>

              <span
                className="absolute left-3 top-3 hidden rounded-full bg-black/45 px-3 py-1.5 text-[0.7rem] font-bold text-white backdrop-blur-sm sm:block"
                aria-hidden
              >
                ons archief van jouw klas
              </span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

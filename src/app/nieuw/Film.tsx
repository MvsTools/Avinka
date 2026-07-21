"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Prijzen from "@/components/Prijzen";
import { PROEF_DAGEN } from "@/lib/abonnement";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* ──────────────────────────────────────────────────────────────────────────
   "De klok draait terug" — de volledige film.

   Eén scène: het bureau van een leerkracht om 18:15, recht van boven.
   Scrollen spoelt de tijd terug naar 16:15 (de 2-uur-belofte, letterlijk).
   De Avinka-tablet op het bureau is de helper: stapels vliegen erín,
   klaar werk komt eruit. Halverwege een close-up voor het privacy-moment.
   De film eindigt op een (bijna) leeg bureau in middaglicht, met de CTA.
   Daarna volgt een kalme onderbouw in crème: kernpunten, prijzen, vragen
   en het briefje van de maker.

   Techniek: CSS-sticky podium + één GSAP-tijdlijn met scrub (0-100).
   Alles is transform/opacity. prefers-reduced-motion krijgt een
   stilstaande versie met dezelfde inhoud.
   ────────────────────────────────────────────────────────────────────────── */

const START_MIN = 18 * 60 + 15; // 18:15
const EIND_MIN = 16 * 60 + 15; // 16:15 — precies 2 uur terug

const fmt = (m: number) => {
  const t = Math.round(m);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

/* Realisme-afspraken voor élk voorwerp: licht van de lamp rechtsboven,
   dus slagschaduwen naar linksonder, plus een strakke contactschaduw. */
const SCHADUW = "-18px 22px 36px rgba(6,4,14,0.5), -5px 7px 12px rgba(6,4,14,0.38)";
const SCHADUW_ZWAAR = "-24px 30px 48px rgba(6,4,14,0.55), -6px 9px 14px rgba(6,4,14,0.4)";
const PAPIER_NERF =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)' opacity='0.55'/%3E%3C/svg%3E\")";

const FAQ = [
  {
    vraag: "Gaan de gegevens van mijn leerlingen ergens heen?",
    antwoord:
      "Nee. Namen, plaatsen en contactgegevens worden op je eigen apparaat onleesbaar gemaakt voordat er iets wordt verstuurd. Je account staat bovendien op beveiligde servers in Europa. Privacy is bij Avinka de ruggengraat, geen bijzaak.",
  },
  {
    vraag: "Moet ik verstand van AI of computers hebben?",
    antwoord:
      "Nee. Als je een e-mail kunt sturen, kun je met Avinka werken. Je typt of plakt wat je hebt en de tool doet de rest. Geen handleiding, geen technisch gedoe.",
  },
  {
    vraag: "Verzint de AI zelf cijfers of feiten?",
    antwoord:
      "Nee. Alle berekeningen doet de tool zelf, en die kloppen altijd. De AI schrijft alleen de tekst eromheen en verzint nooit getallen of feiten. Jij leest na en houdt altijd het laatste woord.",
  },
  {
    vraag: "Hoe werkt de gratis proefperiode?",
    antwoord: `Je probeert Avinka ${PROEF_DAGEN} dagen volledig gratis uit, met toegang tot alle tools. Je hoeft vooraf geen betaalgegevens in te vullen. Bevalt het? Dan kies je daarna zelf een abonnement. Wil je niet verder, dan stopt het vanzelf en betaal je niets.`,
  },
];

export default function Film({ fotoBestand }: { fotoBestand?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const klokRef = useRef<{ min: number }>({ min: START_MIN });
  const [reduced, setReduced] = useState<boolean | null>(null);

  useEffect(() => {
    setReduced(!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useGSAP(
    () => {
      if (reduced !== false) return;
      const q = gsap.utils.selector(root);

      /* ── De klok ── */
      const digitaal = q<HTMLElement>("[data-klok-digitaal]");
      const wUur = q<HTMLElement>("[data-wijzer-uur]");
      const wMin = q<HTMLElement>("[data-wijzer-min]");
      const zetKlok = () => {
        const m = klokRef.current.min;
        if (digitaal[0]) digitaal[0].textContent = fmt(m);
        const mi = m % 60;
        if (wUur[0]) wUur[0].style.transform = `rotate(${((m / 60) % 12) * 30 + mi * 0.5}deg)`;
        if (wMin[0]) wMin[0].style.transform = `rotate(${mi * 6}deg)`;
      };
      zetKlok();

      /* ── Vluchtdoelen meten (zodat het op elk schermformaat klopt) ── */
      const naarTablet = (el?: Element) => {
        const t = q("[data-tablet]")[0];
        if (!el || !t) return { dx: 420, dy: 180 };
        const a = el.getBoundingClientRect();
        const b = t.getBoundingClientRect();
        return {
          dx: b.left + b.width / 2 - (a.left + a.width / 2),
          dy: b.top + b.height / 2 - (a.top + a.height / 2),
        };
      };
      const dStapel = naarTablet(q("[data-stapel]")[0]);
      const dToets = naarTablet(q("[data-toets]")[0]);
      const dLesmap = naarTablet(q("[data-lesmap]")[0]);

      /* ── Beginstanden ── */
      gsap.set(
        q("[data-beat1], [data-beat2], [data-beat3], [data-beat4], [data-priv], [data-groei], [data-finale], [data-insert], [data-tag1], [data-tag2], [data-tag3], [data-tag4], [data-scherm-toets], [data-scherm-bericht], [data-scherm-les], [data-scherm-klaar], [data-tab-check], [data-priv-schild], [data-priv-anoniem]"),
        { autoAlpha: 0 },
      );
      q("[data-tab-rij], [data-toets-balk], [data-les-stap], [data-tel-check]").forEach((el) =>
        gsap.set(el, { autoAlpha: 0 }),
      );

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: q("[data-podium-scroll]")[0],
          start: "top top",
          end: "bottom bottom",
          scrub: 0.9,
        },
      });

      /* ── Doorlopend (0-100): tijd, licht, camera ── */
      tl.to(klokRef.current, { min: EIND_MIN, duration: 100, ease: "none", onUpdate: zetKlok }, 0);
      tl.to(q("[data-avond]"), { opacity: 0.5, duration: 88, ease: "none" }, 0);
      tl.to(q("[data-avond]"), { opacity: 0.06, duration: 12, ease: "power1.in" }, 88);
      tl.to(q("[data-daglicht]"), { opacity: 0.3, duration: 88, ease: "none" }, 0);
      tl.to(q("[data-daglicht]"), { opacity: 0.8, duration: 12, ease: "power1.in" }, 88);
      tl.fromTo(q("[data-zoom]"), { scale: 1.07 }, { scale: 1, duration: 100, ease: "none" }, 0);
      q("[data-drift]").forEach((el, i) => {
        tl.to(el, { y: -(22 + (i % 3) * 14), x: i % 2 === 0 ? 12 : -12, duration: 100, ease: "none" }, 0);
      });

      /* ── Intro uit ── */
      tl.to(q("[data-scrollhint]"), { autoAlpha: 0, duration: 3 }, 4);
      tl.to(q("[data-beat0]"), { autoAlpha: 0, y: -44, duration: 5 }, 7);

      /* ── BEAT 1 · de rapporten (11-26) ── */
      tl.to(q("[data-tab-standby]"), { autoAlpha: 0, duration: 3 }, 11);
      tl.fromTo(q("[data-tab-gloed]"), { autoAlpha: 0.2 }, { autoAlpha: 1, duration: 4 }, 11);
      tl.fromTo(q("[data-beat1]"), { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 5 }, 13);
      q("[data-vel]").forEach((vel, i) => {
        tl.to(
          vel,
          {
            x: dStapel.dx + (i % 2 === 0 ? 12 : -8),
            y: dStapel.dy + i * 5,
            scale: 0.08,
            rotate: 14 - i * 7,
            autoAlpha: 0,
            duration: 8,
            ease: "power2.in",
          },
          13.5 + i * 1.8,
        );
      });
      tl.to(q("[data-pen]"), { x: -520, y: -280, rotate: -74, autoAlpha: 0, duration: 7, ease: "power2.in" }, 18);
      q("[data-tab-rij]").forEach((rij, i) => {
        tl.fromTo(rij, { autoAlpha: 0, y: 7 }, { autoAlpha: 1, y: 0, duration: 2.5 }, 16 + i * 2.2);
      });
      tl.fromTo(q("[data-tab-check]"), { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 2.5, ease: "back.out(2.4)" }, 22.5);
      tl.to(q("[data-tab-check]"), { autoAlpha: 0, duration: 2 }, 26);
      tl.fromTo(q("[data-tag1]"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 3 }, 22);
      tl.to(q("[data-tag1]"), { autoAlpha: 0, y: -8, duration: 3 }, 27.5);
      tl.to(q("[data-beat1]"), { autoAlpha: 0, y: -36, duration: 4 }, 25);

      /* Tabletscherm wisselt: rapporten → toetsanalyse */
      tl.to(q("[data-scherm-rapporten]"), { autoAlpha: 0, duration: 2 }, 28);
      tl.to(q("[data-scherm-toets]"), { autoAlpha: 1, duration: 2 }, 29);

      /* ── BEAT 2 · de toetsanalyse (30-44) ── */
      tl.fromTo(q("[data-beat2]"), { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 5 }, 31);
      tl.to(
        q("[data-toets]"),
        { x: dToets.dx, y: dToets.dy, scale: 0.1, rotate: -10, autoAlpha: 0, duration: 8, ease: "power2.in" },
        32,
      );
      q("[data-toets-balk]").forEach((balk, i) => {
        tl.fromTo(balk, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 2.5 }, 35 + i * 1.6);
      });
      tl.fromTo(q("[data-tag2]"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 3 }, 40);
      tl.to(q("[data-tag2]"), { autoAlpha: 0, y: -8, duration: 3 }, 45);
      tl.to(q("[data-beat2]"), { autoAlpha: 0, y: -36, duration: 4 }, 42);

      /* ── PRIVACY · close-up (46-58) ── */
      tl.to(q("[data-sluier]"), { autoAlpha: 0.55, duration: 4 }, 46);
      tl.fromTo(q("[data-insert]"), { autoAlpha: 0, y: 40, rotate: -4 }, { autoAlpha: 1, y: 0, rotate: -2, duration: 5 }, 47);
      tl.fromTo(q("[data-priv]"), { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 5 }, 47);
      tl.fromTo(
        q("[data-priv-schild]"),
        { autoAlpha: 0, x: -46, scale: 0.6 },
        { autoAlpha: 1, x: 0, scale: 1, duration: 4, ease: "back.out(1.8)" },
        50.5,
      );
      tl.to(q("[data-priv-naam]"), { autoAlpha: 0, duration: 2 }, 51.5);
      tl.fromTo(q("[data-priv-anoniem]"), { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 2.5 }, 52.5);
      tl.to(q("[data-insert]"), { autoAlpha: 0, y: -34, duration: 4 }, 56);
      tl.to(q("[data-priv]"), { autoAlpha: 0, y: -36, duration: 4 }, 56.5);
      tl.to(q("[data-sluier]"), { autoAlpha: 0, duration: 4 }, 57);

      /* Tabletscherm wisselt: toetsanalyse → oudercontact */
      tl.to(q("[data-scherm-toets]"), { autoAlpha: 0, duration: 2 }, 58.5);
      tl.to(q("[data-scherm-bericht]"), { autoAlpha: 1, duration: 2 }, 59.5);

      /* ── BEAT 3 · het oudercontact (60-72) ── */
      tl.fromTo(q("[data-beat3]"), { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 5 }, 60.5);
      q("[data-tel-check]").forEach((c, i) => {
        tl.fromTo(c, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 2, ease: "back.out(2)" }, 62 + i * 2);
      });
      tl.to(q("[data-badge-vol]"), { autoAlpha: 0, duration: 1.5 }, 67.5);
      tl.fromTo(q("[data-badge-leeg]"), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 2, ease: "back.out(2)" }, 68);
      tl.to(q("[data-telefoon]"), { opacity: 0.55, duration: 3 }, 69);
      tl.fromTo(q("[data-tag3]"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 3 }, 67);
      tl.to(q("[data-tag3]"), { autoAlpha: 0, y: -8, duration: 3 }, 72);
      tl.to(q("[data-beat3]"), { autoAlpha: 0, y: -36, duration: 4 }, 70);

      /* Tabletscherm wisselt: oudercontact → lesontwerp */
      tl.to(q("[data-scherm-bericht]"), { autoAlpha: 0, duration: 2 }, 72.5);
      tl.to(q("[data-scherm-les]"), { autoAlpha: 1, duration: 2 }, 73.5);

      /* ── BEAT 4 · de les van morgen (74-85) ── */
      tl.fromTo(q("[data-beat4]"), { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 5 }, 74.5);
      if (dLesmap.dx !== 420 || dLesmap.dy !== 180) {
        tl.to(
          q("[data-lesmap]"),
          { x: dLesmap.dx, y: dLesmap.dy, scale: 0.1, rotate: 8, autoAlpha: 0, duration: 8, ease: "power2.in" },
          75.5,
        );
      }
      q("[data-les-stap]").forEach((stap, i) => {
        tl.fromTo(stap, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 2 }, 77.5 + i * 1.3);
      });
      tl.fromTo(q("[data-tag4]"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 3 }, 82);
      tl.to(q("[data-tag4]"), { autoAlpha: 0, y: -8, duration: 3 }, 86.5);
      tl.to(q("[data-beat4]"), { autoAlpha: 0, y: -36, duration: 4 }, 83.5);

      /* ── GROEI (86-91): lichte sluier eronder voor leesbaarheid ── */
      tl.to(q("[data-sluier]"), { autoAlpha: 0.4, duration: 3 }, 86);
      tl.fromTo(q("[data-groei]"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 4.5 }, 86.5);
      tl.to(q("[data-groei]"), { autoAlpha: 0, y: -26, duration: 3.5 }, 90.5);
      tl.to(q("[data-sluier]"), { autoAlpha: 0, duration: 3 }, 90.5);

      /* ── FINALE · 16:15 (91-100) ── */
      tl.to(q("[data-scherm-les]"), { autoAlpha: 0, duration: 2 }, 91);
      tl.to(q("[data-scherm-klaar]"), { autoAlpha: 1, duration: 2 }, 92);
      tl.to(q("[data-tab-gloed]"), { autoAlpha: 0.4, duration: 6 }, 92);
      tl.fromTo(q("[data-finale]"), { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 6 }, 93.5);
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <div ref={root} className="bg-[#131022] text-cream">
      {reduced ? (
        <>
          <header className="flex items-start justify-between px-5 pt-5 sm:px-8 sm:pt-6">
            <a href="/" className="rounded-xl bg-cream/95 px-3 py-2 shadow-lg shadow-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Avinka_wordmerk.png" alt="Avinka" className="h-6 w-auto sm:h-7" />
            </a>
          </header>
          <StilVerhaal />
        </>
      ) : (
        <div data-podium-scroll className="relative h-[1150vh]">
          <div className="sticky top-0 h-screen overflow-hidden">
            {/* ── Merk + klok: horen bij de film en schuiven ermee weg ── */}
            <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between px-5 pt-5 sm:px-8 sm:pt-6">
              <a
                href="/"
                className="pointer-events-auto rounded-xl bg-cream/95 px-3 py-2 shadow-lg shadow-black/30"
              >
                {/* bewust een gewone <img>: het bestand is klein en dit omzeilt
                    de trage dev-optimalisatie van next/image op deze route */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Avinka_wordmerk.png" alt="Avinka" className="h-6 w-auto sm:h-7" />
              </a>
              <div className="flex items-start gap-3">
                <Link
                  href="/sign-up"
                  className="pointer-events-auto hidden rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark sm:block"
                >
                  Probeer gratis
                </Link>
                <Klok />
              </div>
            </header>
            {/* ── De scène ── */}
            <div data-scene className="absolute inset-0">
              <div data-zoom className="absolute inset-0 will-change-transform">
                <Bureau />
              </div>

              {/* Avondlaag: warme lamp-poel, verder donker */}
              <div
                data-avond
                className="pointer-events-none absolute inset-0"
                style={{
                  opacity: 0.96,
                  background:
                    "radial-gradient(circle 62rem at 74% 10%, rgba(255,176,86,0.34), rgba(19,14,40,0.48) 48%, rgba(13,9,28,0.88) 82%)",
                }}
              />
              {/* Daglicht-laag: schuift er in de loop van de film overheen */}
              <div
                data-daglicht
                className="pointer-events-none absolute inset-0"
                style={{
                  opacity: 0,
                  background:
                    "linear-gradient(200deg, rgba(255,236,200,0.6), rgba(255,214,150,0.16) 55%, rgba(255,244,224,0.06) 80%)",
                  mixBlendMode: "screen",
                }}
              />
              {/* Sluier voor het privacy-moment */}
              <div data-sluier className="pointer-events-none absolute inset-0 bg-[#0b0819] opacity-0" />
              {/* Vignet + filmkorrel */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse at 50% 42%, transparent 62%, rgba(8,5,20,0.45) 100%)" }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                }}
              />
            </div>

            {/* ── Privacy close-up: het naamkaartje krijgt een schild ── */}
            <div data-insert className="absolute left-1/2 top-[30%] z-30 -translate-x-1/2 sm:left-[62%] sm:top-1/2 sm:-translate-y-1/2">
              <div
                className="relative w-[300px] rounded-[5px] p-5 sm:w-[360px]"
                style={{
                  background: "linear-gradient(160deg, #faf5ea 0%, #f2ebd9 100%)",
                  boxShadow: SCHADUW_ZWAAR,
                }}
              >
                <div aria-hidden className="absolute inset-0 rounded-[5px] opacity-30 mix-blend-multiply" style={{ backgroundImage: PAPIER_NERF }} />
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#8d8069]">
                  rapport · periode 2 · groep 5
                </p>
                <div className="relative mt-2 flex h-10 items-center">
                  <span data-priv-naam className="font-display text-3xl font-black text-[#3d3428]">
                    Sofie
                  </span>
                  <span data-priv-anoniem className="absolute left-0 font-display text-3xl font-black text-brand-dark">
                    leerling A
                  </span>
                  <span data-priv-schild className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand shadow-lg shadow-brand/40">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  </span>
                </div>
                <div className="mt-2 space-y-[6px]">
                  {[92, 74, 86].map((w, i) => (
                    <div key={i} className="h-[3px] rounded-full bg-[#a99c84]" style={{ width: `${w}%` }} />
                  ))}
                </div>
                <p className="mt-4 border-t border-[#d8cdb6] pt-2.5 font-mono text-[9px] font-bold uppercase tracking-widest text-brand-dark">
                  gebeurt op jouw computer, vóór het versturen
                </p>
              </div>
            </div>

            {/* ── Tekstlagen ── */}
            <TekstBlok data="data-beat0" kicker="dinsdag · 18:15 · de school is al drie uur uit" groot>
              <>Herken je dit bureau?</>
              <>
                De klas was om kwart over drie leeg, maar jouw werk niet. Avinka,
                gemaakt door een leerkracht, geeft je elke week zo&apos;n twee uur
                terug. Scroll en draai de klok mee.
              </>
            </TekstBlok>
            <TekstBlok data="data-beat1" kicker="de rapporten · 35 minuten terug">
              <>Rapporten schrijf je niet meer alleen.</>
              <>
                Je geeft per kind een paar steekwoorden. Avinka schrijft daar een
                warm, persoonlijk rapport van dat klinkt zoals jij. Jij leest na,
                past aan en keurt goed.
              </>
            </TekstBlok>
            <TekstBlok data="data-beat2" kicker="de toetsanalyse · 45 minuten terug">
              <>Van cijferlijst naar groepsbeeld.</>
              <>
                Plak je toetsuitslag erin en zie direct hoe je groep ervoor staat,
                per onderdeel en per kind. Alle berekeningen doet de tool zelf.
                De AI verzint nooit een cijfer.
              </>
            </TekstBlok>
            <TekstBlok data="data-priv" kicker="eerst dit, want dit gaat over kinderen">
              <>Namen blijven thuis.</>
              <>
                Voordat er ook maar iets naar de AI gaat, maakt Avinka namen op
                jouw eigen computer onleesbaar. De AI kent jouw leerlingen niet.
                Je account draait op beveiligde servers in Europa.
              </>
            </TekstBlok>
            <TekstBlok data="data-beat3" kicker="het oudercontact · 15 minuten terug">
              <>Zes berichten, één rustig antwoord.</>
              <>
                Weekberichten, gespreksleidraden en lastige mailtjes: jij kiest de
                toon, Avinka zet een voorzet klaar. Versturen doe jij, pas als jij
                het goed vindt.
              </>
            </TekstBlok>
            <TekstBlok data="data-beat4" kicker="de les van morgen · 25 minuten terug">
              <>Morgen staat al klaar.</>
              <>
                Eén leerdoel is genoeg voor een complete les, opgebouwd zoals jij
                lesgeeft. Met differentiatie voor wie meer of minder nodig heeft.
              </>
            </TekstBlok>

            {/* Groei: gecentreerd over het bijna lege bureau */}
            <div data-groei className="absolute inset-x-0 top-1/2 z-20 -translate-y-1/2 px-6 text-center">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-amber-200/80 sm:text-xs">
                en dit is pas het begin
              </p>
              <h2 className="mx-auto mt-3 max-w-2xl font-display text-[clamp(2rem,4.6vw,3.6rem)] font-black leading-tight tracking-tight text-cream">
                Elke maand ruimt Avinka meer op.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-cream/75 sm:text-lg">
                Werkbladen, draaiboeken, weekplanning: er komt steeds meer bij.
                Wat het ook wordt, het doel blijft hetzelfde: jouw avond.
              </p>
            </div>

            {/* Finale: 16:15, de belofte + CTA */}
            <div data-finale className="absolute inset-x-0 bottom-[12vh] z-20 px-6 sm:px-12">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-brand-soft sm:text-xs">
                dinsdag · 16:15
              </p>
              <h2 className="mt-3 max-w-3xl font-display text-[clamp(2.6rem,6.5vw,5.2rem)] font-black leading-[1.0] tracking-tight text-cream">
                Klaar. Twee uur eerder.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-cream/80 sm:text-lg sm:leading-8">
                Dat is de belofte van Avinka: elke week zo&apos;n twee uur terug.
                Voor je klas, je gezin, of gewoon de bank.
              </p>
              <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/sign-up"
                  className="rounded-2xl bg-brand px-8 py-4 text-lg font-bold text-white shadow-lg shadow-brand/30 transition hover:-translate-y-0.5 hover:bg-brand-dark motion-reduce:hover:translate-y-0"
                >
                  Probeer Avinka gratis
                </Link>
                <span className="text-sm font-semibold text-cream/60">
                  {PROEF_DAGEN} dagen gratis · geen betaalgegevens nodig · maandelijks opzegbaar
                </span>
              </div>
            </div>

            {/* Scroll-hint */}
            <div data-scrollhint className="absolute inset-x-0 bottom-5 z-20 flex flex-col items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-cream/55">
                scroll om de tijd terug te draaien
              </span>
              <svg viewBox="0 0 24 24" className="h-4 w-4 animate-bounce text-cream/55 motion-reduce:animate-none" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* ── De onderbouw: daglicht, rust, feiten ─────────────────────── */}
      <Onderbouw fotoBestand={fotoBestand} />
    </div>
  );
}

/* ── Herbruikbaar tekstblok linksonder in de film ─────────────────────── */

function TekstBlok({
  data,
  kicker,
  groot = false,
  children,
}: {
  data: string;
  kicker: string;
  groot?: boolean;
  children: [React.ReactNode, React.ReactNode];
}) {
  const props = { [data]: "" };
  return (
    <div {...props} className="absolute inset-x-0 bottom-[14vh] z-20 px-6 sm:bottom-[12vh] sm:px-12">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-amber-200/80 sm:text-xs">
        {kicker}
      </p>
      {groot ? (
        <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.5rem,6vw,4.8rem)] font-black leading-[1.02] tracking-tight text-cream">
          {children[0]}
        </h1>
      ) : (
        <h2 className="mt-3 max-w-3xl font-display text-[clamp(2rem,4.8vw,3.9rem)] font-black leading-[1.04] tracking-tight text-cream">
          {children[0]}
        </h2>
      )}
      <p className="mt-4 max-w-xl text-base leading-7 text-cream/75 sm:text-lg sm:leading-8">{children[1]}</p>
    </div>
  );
}

/* ── De klok: het instrument van de pagina ────────────────────────────── */

function Klok() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-cream/15 bg-[#0d0a1c]/70 px-3.5 py-2 backdrop-blur">
      <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
        <circle cx="24" cy="24" r="22" fill="rgba(251,246,238,0.06)" stroke="rgba(251,246,238,0.35)" strokeWidth="2" />
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1="24"
            y1="4.5"
            x2="24"
            y2={i % 3 === 0 ? "8.5" : "7"}
            stroke="rgba(251,246,238,0.45)"
            strokeWidth={i % 3 === 0 ? 2 : 1}
            transform={`rotate(${i * 30} 24 24)`}
          />
        ))}
        <g data-wijzer-uur style={{ transformOrigin: "24px 24px", transform: "rotate(187.5deg)" }}>
          <line x1="24" y1="24" x2="24" y2="13" stroke="#fbf6ee" strokeWidth="2.6" strokeLinecap="round" />
        </g>
        <g data-wijzer-min style={{ transformOrigin: "24px 24px", transform: "rotate(90deg)" }}>
          <line x1="24" y1="24" x2="24" y2="8" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        </g>
        <circle cx="24" cy="24" r="1.8" fill="#fbf6ee" />
      </svg>
      <div className="text-right">
        <span data-klok-digitaal className="block font-mono text-lg font-bold tabular-nums leading-none text-cream">
          18:15
        </span>
        <span className="mt-1 block font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-cream/50">
          jouw tijd
        </span>
      </div>
    </div>
  );
}

/* ── Het bureau, recht van boven ──────────────────────────────────────── */

function Bureau() {
  return (
    <div className="absolute inset-0">
      {/* Houten blad */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(112deg, #57402c 0%, #6b4f36 22%, #5d442e 41%, #6f5238 58%, #5a412c 76%, #684d34 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-45"
        style={{
          background:
            "repeating-linear-gradient(112deg, rgba(40,27,16,0.4) 0px, rgba(40,27,16,0.4) 1.5px, transparent 1.5px, transparent 148px), repeating-linear-gradient(112deg, rgba(46,32,20,0.2) 0px, transparent 2px, transparent 19px, rgba(46,32,20,0.13) 21px, transparent 23px, transparent 47px)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-25 mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='90'%3E%3Cfilter id='w'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.008 0.11' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23w)' opacity='0.75'/%3E%3C/svg%3E\")",
          transform: "rotate(22deg) scale(1.6)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle 40rem at 74% 12%, rgba(255,214,150,0.10), transparent 65%)" }}
      />

      {/* Lamp: voet rechtsboven */}
      <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-[#241a10] shadow-[0_18px_50px_rgba(0,0,0,0.5)]" />
      <div className="absolute right-16 top-16 h-3 w-28 -rotate-[28deg] rounded-full bg-[#1c130b]/80" />

      {/* ── De rapportenstapel (beat 1) + rode pen ── */}
      <div data-stapel className="absolute left-[16%] top-[26%] sm:left-[24%]">
        {[4, 3, 2, 1].map((n) => (
          <div
            key={n}
            data-vel
            className="absolute rounded-[3px]"
            style={{
              width: "clamp(130px, 15vw, 215px)",
              height: "clamp(176px, 20.5vw, 292px)",
              background: `linear-gradient(160deg, ${n % 2 === 0 ? "#f3ecdd" : "#f0e8d8"}, ${n % 2 === 0 ? "#e9e0cd" : "#e6ddc9"})`,
              transform: `translate(${n * 5}px, ${-n * 6}px) rotate(${n % 2 === 0 ? n * 1.6 : -n * 1.3}deg)`,
              zIndex: 5 - n,
              boxShadow: n === 4 ? SCHADUW_ZWAAR : "-4px 5px 9px rgba(6,4,14,0.3)",
            }}
          >
            {n === 1 && <VelInhoud />}
          </div>
        ))}
        <div
          data-vel
          className="relative z-10 rounded-[3px]"
          style={{
            width: "clamp(130px, 15vw, 215px)",
            height: "clamp(176px, 20.5vw, 292px)",
            background: "linear-gradient(160deg, #faf5ea 0%, #f4eddd 70%, #efe6d3 100%)",
            transform: "rotate(-2deg)",
            boxShadow: "-8px 10px 18px rgba(6,4,14,0.42), inset 0 0 26px rgba(120,100,70,0.08)",
          }}
        >
          <div aria-hidden className="absolute inset-0 rounded-[3px] opacity-[0.35] mix-blend-multiply" style={{ backgroundImage: PAPIER_NERF }} />
          <VelInhoud boven />
        </div>
        <div data-pen className="absolute -right-20 top-[58%] z-20 hidden h-3 w-36 rotate-[78deg] sm:block">
          <div
            className="h-full w-full rounded-full"
            style={{
              background: "linear-gradient(180deg, #e0616a 0%, #c22730 34%, #97161e 78%, #7c1118 100%)",
              boxShadow: "-6px 8px 12px rgba(6,4,14,0.45)",
            }}
          />
          <div className="absolute left-3 top-[3px] h-[3px] w-24 rounded-full bg-white/45" />
          <div
            className="absolute -right-4 top-1/2 h-[5px] w-5 -translate-y-1/2 rounded-r-full"
            style={{ background: "linear-gradient(180deg, #d8d8e2, #8a8a98)" }}
          />
          <div className="absolute -left-1.5 top-1/2 h-[6px] w-3 -translate-y-1/2 rounded-l-full bg-[#7c1118]" />
        </div>
      </div>

      {/* ── De Avinka-tablet: de helper die het bureau leegmaakt ── */}
      <div data-drift className="absolute right-[8%] top-[38%] sm:right-[21%] sm:top-[33%]">
        <div
          data-tab-gloed
          aria-hidden
          className="absolute -inset-10 rounded-[3rem]"
          style={{
            opacity: 0.2,
            background: "radial-gradient(ellipse at 50% 45%, rgba(251,246,238,0.4), rgba(251,246,238,0.08) 55%, transparent 75%)",
            filter: "blur(6px)",
          }}
        />
        <div
          data-tablet
          className="relative rotate-[5deg] rounded-[22px] p-[10px]"
          style={{
            width: "clamp(168px, 19vw, 248px)",
            aspectRatio: "3/4",
            background: "linear-gradient(150deg, #1c1c24 0%, #0c0c12 55%, #16161e 100%)",
            boxShadow: SCHADUW_ZWAAR + ", inset -1px 1px 1px rgba(255,255,255,0.14)",
          }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-[13px] bg-cream">
            {/* Scherm 1 · rapporten */}
            <div data-scherm-rapporten className="absolute inset-0 flex flex-col p-3">
              <TabletKop label="rapporten" />
              <div className="mt-2.5 flex flex-1 flex-col gap-1.5">
                {["Sofie", "Milan", "Noor"].map((naam) => (
                  <div key={naam} data-tab-rij className="rounded-lg bg-white px-2 py-1.5 shadow-sm ring-1 ring-ink/5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-ink">{naam}</span>
                      <MiniVink />
                      <span className="ml-auto font-mono text-[7px] font-bold text-ink/35">in jouw toon</span>
                    </div>
                    <div className="mt-1 h-[2.5px] w-11/12 rounded-full bg-ink/15" />
                    <div className="mt-[3px] h-[2.5px] w-3/5 rounded-full bg-ink/10" />
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-brand-soft px-2 py-1 text-center font-mono text-[8px] font-bold text-brand-dark">
                5 rapporten · klaar om na te lezen
              </div>
            </div>

            {/* Scherm 2 · toetsanalyse */}
            <div data-scherm-toets className="absolute inset-0 flex flex-col p-3">
              <TabletKop label="toetsanalyse" />
              <div className="mt-3 flex-1 space-y-2">
                {[
                  { naam: "Getallen", pct: 78, kleur: "#2f9e6e" },
                  { naam: "Verhoudingen", pct: 44, kleur: "#c07a1a" },
                  { naam: "Meten", pct: 82, kleur: "#2f9e6e" },
                  { naam: "Verbanden", pct: 68, kleur: "#0284c7" },
                ].map((d) => (
                  <div key={d.naam} data-toets-balk className="flex items-center gap-1.5">
                    <span className="w-[64px] text-[8.5px] font-bold text-ink">{d.naam}</span>
                    <span className="h-[5px] flex-1 rounded-full bg-ink/10">
                      <span className="block h-[5px] rounded-full" style={{ width: `${d.pct}%`, background: d.kleur }} />
                    </span>
                  </div>
                ))}
                <div data-toets-balk className="mt-1 rounded-lg bg-accent-soft px-2 py-1.5 text-[8px] font-bold leading-snug text-ink/80">
                  → 4 leerlingen: verlengde instructie breuken
                </div>
              </div>
              <div className="rounded-lg bg-brand-soft px-2 py-1 text-center font-mono text-[8px] font-bold text-brand-dark">
                groepsbeeld · rekenen ✓
              </div>
            </div>

            {/* Scherm 3 · oudercontact */}
            <div data-scherm-bericht className="absolute inset-0 flex flex-col p-3">
              <TabletKop label="oudercontact" />
              <div className="mt-2.5 flex-1 rounded-lg bg-white p-2 shadow-sm ring-1 ring-ink/5">
                <p className="font-mono text-[7px] font-bold uppercase tracking-widest text-ink/40">
                  weekbericht · groep 5
                </p>
                <div className="mt-1.5 space-y-[4px]">
                  {[95, 88, 92, 60, 84, 40].map((w, i) => (
                    <div key={i} className="h-[2.5px] rounded-full bg-ink/15" style={{ width: `${w}%` }} />
                  ))}
                </div>
                <span className="mt-2 inline-block rounded-full bg-brand-soft px-1.5 py-0.5 font-mono text-[7px] font-bold text-brand-dark">
                  toon: warm · kort
                </span>
              </div>
              <div className="mt-2 rounded-lg bg-brand-soft px-2 py-1 text-center font-mono text-[8px] font-bold text-brand-dark">
                voorzet klaar · jij verstuurt
              </div>
            </div>

            {/* Scherm 4 · lesontwerp */}
            <div data-scherm-les className="absolute inset-0 flex flex-col p-3">
              <TabletKop label="lesontwerp" />
              <p className="mt-2 font-mono text-[7px] font-bold uppercase tracking-widest text-ink/40">
                breuken vergelijken · EDI
              </p>
              <div className="mt-1.5 flex-1 space-y-[5px]">
                {["Voorkennis activeren", "Lesdoel", "Instructie (ik)", "Samen oefenen (wij)", "Zelfstandig (jij)"].map((fase, i) => (
                  <div key={fase} data-les-stap className="flex items-center gap-1.5">
                    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#0d9488] text-[7px] font-black text-white">
                      {i + 1}
                    </span>
                    <span className="text-[8.5px] font-bold text-ink">{fase}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-brand-soft px-2 py-1 text-center font-mono text-[8px] font-bold text-brand-dark">
                complete les · klaar voor morgen
              </div>
            </div>

            {/* Scherm 5 · klaar */}
            <div data-scherm-klaar className="absolute inset-0 flex flex-col items-center justify-center p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Avinka_wordmerk.png" alt="" className="h-6 w-auto" />
              <span className="mt-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand shadow-lg shadow-brand/30">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="mt-3 font-mono text-[9px] font-bold uppercase tracking-widest text-ink/50">
                klaar voor vandaag
              </span>
            </div>

            {/* Groot vinkje bij het binnenkomen van de rapporten */}
            <div data-tab-check className="absolute inset-0 z-10 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand shadow-xl shadow-brand/40">
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
            </div>

            {/* Stand-by: donker glas met ademend vinkje */}
            <div
              data-tab-standby
              className="absolute inset-0 z-20 flex items-center justify-center rounded-[13px]"
              style={{ background: "linear-gradient(160deg, #14141c 0%, #0c0c12 100%)" }}
            >
              <span className="standby-vink flex h-10 w-10 items-center justify-center rounded-xl bg-brand/20 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Avinka_vinkje.png" alt="" className="h-full w-full opacity-90" />
              </span>
              <div
                aria-hidden
                className="absolute inset-0 rounded-[13px]"
                style={{ background: "linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.075) 46%, rgba(255,255,255,0.02) 55%, transparent 60%)" }}
              />
            </div>
          </div>
        </div>

        {/* Datalabels: hier landt de winst, beat voor beat */}
        <DataTag data="data-tag1" tekst="avinka · rapporten ✓ · 35 min terug" />
        <DataTag data="data-tag2" tekst="avinka · toetsanalyse ✓ · 45 min terug" />
        <DataTag data="data-tag3" tekst="avinka · oudercontact ✓ · 15 min terug" />
        <DataTag data="data-tag4" tekst="avinka · lesontwerp ✓ · 25 min terug" />
      </div>

      {/* ── Toetsen: uitslagenlijst + rekenmachine (beat 2) ── */}
      <div data-toets className="absolute right-[2%] top-[70%] sm:right-[3%] sm:top-[69%]">
        <div
          className="relative rounded-[3px] p-3"
          style={{
            width: "clamp(150px, 17vw, 250px)",
            height: "clamp(120px, 13vw, 190px)",
            background: "linear-gradient(165deg, #f7f1e4 0%, #efe7d5 100%)",
            transform: "rotate(3.5deg)",
            boxShadow: SCHADUW,
          }}
        >
          <div aria-hidden className="absolute inset-0 rounded-[3px] opacity-30 mix-blend-multiply" style={{ backgroundImage: PAPIER_NERF }} />
          <p className="font-mono text-[7px] font-bold uppercase tracking-widest text-[#8d8069]">
            toetsuitslag · rekenen · groep 5
          </p>
          <div className="mt-1.5 space-y-[4px]">
            {[88, 72, 95, 64, 80, 91].map((w, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-[3px] rounded-full bg-[#a99c84]" style={{ width: 26 }} />
                <div className="h-[5px] rounded-[1px] bg-[#ddd2bc]" style={{ width: `${w * 0.55}%` }} />
                <span className="font-mono text-[6.5px] font-bold text-[#a4634f]">{[52, 38, 61, 33, 47, 58][i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div
          className="absolute -left-14 top-6 h-[104px] w-[68px] -rotate-6 rounded-[9px] p-2"
          style={{
            background: "linear-gradient(155deg, #2d2c38 0%, #1c1b26 60%, #24232f 100%)",
            boxShadow: SCHADUW + ", inset -1px 1px 1px rgba(255,255,255,0.1)",
          }}
        >
          <div
            className="flex h-6 items-center justify-end rounded-[4px] px-1.5 font-mono text-[10px] font-bold text-[#cfe3d3]"
            style={{ background: "linear-gradient(180deg, #46584a, #33443a)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.45)" }}
          >
            58,3
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-[13px] rounded-[3px]"
                style={{
                  background: "linear-gradient(180deg, #4b4a5a 0%, #37364a 100%)",
                  boxShadow: "0 1px 1px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Telefoon met ouder-berichten (beat 3) ── */}
      <div
        data-telefoon
        data-drift
        className="absolute left-[42%] top-[12%] h-[172px] w-[84px] rotate-[7deg] rounded-[18px] p-[5px] sm:left-[47%] sm:top-[15%]"
        style={{
          background: "linear-gradient(150deg, #2a2a34 0%, #101016 45%, #1e1e28 100%)",
          boxShadow: SCHADUW + ", inset -1px 1px 1px rgba(255,255,255,0.16)",
        }}
      >
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[13px] bg-[#181824] p-1.5">
          <div className="mx-auto mb-1 h-[4px] w-8 rounded-full bg-black/70" />
          <span className="font-mono text-[7px] font-bold uppercase tracking-widest text-cream/45">ouders · nieuw</span>
          <div className="mt-1 space-y-1">
            {[["S", "#7c9885"], ["M", "#8a7ca0"], ["J", "#a08a7c"]].map(([ltr, kleur], i) => (
              <div key={i} className="relative flex items-start gap-1.5 rounded-[7px] bg-[#242433] p-1.5">
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[7px] font-bold text-white/90"
                  style={{ background: kleur as string }}
                >
                  {ltr}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block h-[3px] w-3/4 rounded-full bg-cream/30" />
                  <span className="mt-[3px] block h-[3px] w-1/2 rounded-full bg-cream/15" />
                </span>
                <span data-tel-check className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-2 w-2" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              </div>
            ))}
          </div>
          <span data-badge-vol className="mt-auto self-end rounded-full bg-[#e0313b] px-1.5 py-[1px] font-mono text-[8px] font-bold text-white shadow-sm">
            6
          </span>
          <span data-badge-leeg className="absolute bottom-1.5 right-1.5 rounded-full bg-brand px-1.5 py-[1px] font-mono text-[8px] font-bold text-white opacity-0 shadow-sm">
            0
          </span>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.09) 38%, rgba(255,255,255,0.02) 48%, transparent 55%)" }}
          />
        </div>
      </div>

      {/* ── Lesmappen + plakbriefje (beat 4) ── */}
      <div data-lesmap data-drift className="absolute left-[8%] top-[8%] hidden sm:block">
        <div
          className="relative h-40 w-56 -rotate-3 rounded-[6px]"
          style={{ background: "linear-gradient(155deg, #37695a 0%, #2a5245 100%)", boxShadow: SCHADUW_ZWAAR }}
        >
          <div className="absolute -right-1.5 top-4 h-28 w-2 rounded-r-[2px] bg-[#efe7d4]" style={{ boxShadow: "-1px 2px 3px rgba(6,4,14,0.3)" }} />
          <div className="absolute -right-2.5 top-8 h-16 w-2 rounded-r-[2px] bg-[#e5dcc6]" />
        </div>
        <div
          className="absolute left-7 top-6 h-40 w-56 rotate-2 rounded-[6px]"
          style={{
            background: "linear-gradient(155deg, #a97d58 0%, #8d6644 55%, #9a7350 100%)",
            boxShadow: SCHADUW + ", inset -1px 1px 1px rgba(255,255,255,0.12)",
          }}
        >
          <div className="absolute -top-2 left-6 h-4 w-20 rounded-t-[5px] bg-[#a97d58]" />
          <div className="absolute inset-y-3 right-5 w-[3px] rounded-full bg-[#4a3826]/60" />
          <p className="absolute left-4 top-5 font-mono text-[8px] font-bold uppercase tracking-widest text-[#4a3826]/70">
            lesvoorbereiding
          </p>
        </div>
        <div
          className="absolute -right-9 bottom-2 flex h-[86px] w-[86px] rotate-6 items-center justify-center p-2 text-center font-display text-[11.5px] font-bold italic leading-tight text-ink/75"
          style={{
            background: "linear-gradient(150deg, #ffe993 0%, #f7dc6e 78%, #ecc94b 100%)",
            boxShadow: "-8px 10px 16px rgba(6,4,14,0.35)",
          }}
        >
          les morgen: breuken!
          <span
            aria-hidden
            className="absolute bottom-0 right-0 h-4 w-4"
            style={{ background: "linear-gradient(315deg, #131022 46%, #d9b83e 50%, #f2d766 100%)" }}
          />
        </div>
      </div>

      {/* ── Koffie: blijft tot het einde (die is verdiend) ── */}
      <div data-drift className="absolute right-[2%] top-[11%] sm:right-[31%] sm:top-[16%]">
        <div
          className="h-24 w-24 rounded-full"
          style={{
            background: "radial-gradient(circle at 62% 34%, #f7f1e6 0%, #e8e0cf 55%, #cfc5ae 100%)",
            boxShadow: SCHADUW + ", inset -2px 3px 6px rgba(6,4,14,0.18)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle at 60% 32%, #fdfaf3 0%, #efe8d8 60%, #d6cbb2 100%)",
            boxShadow: "-4px 6px 10px rgba(6,4,14,0.35), inset -1px 2px 2px rgba(255,255,255,0.8)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[54px] w-[54px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle at 58% 34%, #6b4226 0%, #402613 18%, #341d0e 45%, #241207 100%)",
            boxShadow: "inset -2px 3px 7px rgba(0,0,0,0.6), inset 0 0 0 3px rgba(158,113,74,0.35)",
          }}
        />
        <div className="absolute left-[54%] top-[38%] h-2.5 w-5 -rotate-12 rounded-full bg-white/12 blur-[1.5px]" />
        <div
          className="absolute -right-3.5 top-1/2 h-9 w-5 -translate-y-1/2 rounded-r-full border-[5px]"
          style={{ borderColor: "#e9e1d0", boxShadow: "-3px 5px 7px rgba(6,4,14,0.3)" }}
        />
        <svg viewBox="0 0 40 60" className="stoom absolute -top-10 left-1/2 h-14 w-9 -translate-x-1/2 text-white/20 blur-[1.5px]" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" aria-hidden>
          <path d="M14 52 C 8 40, 22 34, 16 20" />
          <path d="M27 54 C 21 44, 33 36, 26 24" opacity="0.7" />
        </svg>
      </div>

      <style>{`
        .stoom { animation: stoomOp 3.6s ease-in-out infinite; }
        @keyframes stoomOp {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: .45; }
          50% { transform: translateX(-50%) translateY(-7px); opacity: .85; }
        }
        .standby-vink { animation: ademen 2.8s ease-in-out infinite; }
        @keyframes ademen {
          0%, 100% { opacity: .45; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.07); }
        }
        @media (prefers-reduced-motion: reduce) { .stoom, .standby-vink { animation: none; } }
      `}</style>
    </div>
  );
}

function TabletKop({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/Avinka_wordmerk.png" alt="Avinka" className="h-3.5 w-auto" />
      <span className="ml-auto font-mono text-[8px] font-bold uppercase tracking-widest text-ink/40">{label}</span>
    </div>
  );
}

function MiniVink() {
  return (
    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="#2f9e6e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function DataTag({ data, tekst }: { data: string; tekst: string }) {
  const props = { [data]: "" };
  return (
    <div {...props} className="absolute -bottom-12 left-[30%] z-20 -translate-x-1/2">
      <span className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-brand/50 bg-[#0d0a1c]/85 px-3 py-2 font-mono text-[11px] font-bold text-cream backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-brand" />
        {tekst}
      </span>
    </div>
  );
}

/* Een geprint rapport-vel: kopregel, naam, alinea's en een nakijk-krabbel. */
function VelInhoud({ boven = false }: { boven?: boolean }) {
  return (
    <div className="relative p-3 sm:p-4">
      {boven && (
        <>
          <p className="font-mono text-[7px] font-bold uppercase tracking-[0.2em] text-[#8d8069]">
            rapport · periode 2 · groep 5
          </p>
          <p className="mt-1 font-display text-[13px] font-black text-[#3d3428]">Sofie</p>
          <div className="mb-2 mt-1 h-px w-full bg-[#d8cdb6]" />
        </>
      )}
      {Array.from({ length: boven ? 9 : 6 }).map((_, i) => (
        <div
          key={i}
          className="mb-[7px] h-[2.5px] rounded-full"
          style={{
            width: `${[94, 86, 90, 58, 88, 79, 92, 68, 40][i % 9]}%`,
            background: boven ? "#a99c84" : "#bdb096",
          }}
        />
      ))}
      {boven && (
        <svg viewBox="0 0 60 14" className="absolute bottom-8 right-4 h-3 w-14 text-[#c22730]/70" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M3 9 C 10 4, 16 12, 23 7 C 30 2, 36 11, 44 6 C 50 3, 54 8, 57 6" />
        </svg>
      )}
    </div>
  );
}

/* ── prefers-reduced-motion: hetzelfde verhaal, zonder film ───────────── */

function StilVerhaal() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-28">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-amber-200/80">
        dinsdag · 18:15 · de school is al drie uur uit
      </p>
      <h1 className="mt-4 font-display text-5xl font-black tracking-tight text-cream">
        Herken je dit bureau?
      </h1>
      <p className="mt-5 text-lg leading-8 text-cream/75">
        De klas was om kwart over drie leeg, maar jouw werk niet. Avinka draait
        de klok voor je terug: elke week zo&apos;n twee uur, van 18:15 naar
        16:15. De AI van Avinka neemt het uitzoek- en typwerk over: rapporten in
        jouw woorden, toetsen doorgerekend, ouders bijgepraat en je les van
        morgen klaar. Jij leest na en houdt het laatste woord. En de namen van
        je leerlingen? Die verlaten jouw computer nooit.
      </p>
      <Link
        href="/sign-up"
        className="mt-8 inline-block rounded-2xl bg-brand px-8 py-4 text-lg font-bold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
      >
        Probeer Avinka gratis
      </Link>
    </div>
  );
}

/* ── De onderbouw: crème, rust, feiten ────────────────────────────────── */

function Onderbouw({ fotoBestand }: { fotoBestand?: string }) {
  return (
    <div className="bg-cream text-ink">
      {/* Drie zekerheden, kort en zonder opsmuk */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-6 pt-20">
        <div className="grid gap-10 sm:grid-cols-3">
          {[
            {
              titel: "Niet ingewikkeld",
              tekst: "Kun je een e-mail sturen? Dan kun je met Avinka werken. Geen handleiding nodig.",
            },
            {
              titel: "Namen blijven privé",
              tekst: "Namen van leerlingen worden op jouw computer onleesbaar gemaakt en gaan nooit naar de AI.",
            },
            {
              titel: "Jij beslist altijd",
              tekst: "Avinka maakt de voorzet, jij keurt goed. Niets gaat zonder jou de deur uit.",
            },
          ].map((z) => (
            <div key={z.titel}>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft p-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/Avinka_vinkje.png" alt="" className="h-full w-full" />
                </span>
                <h3 className="font-display text-xl font-bold text-ink">{z.titel}</h3>
              </div>
              <p className="mt-3 leading-7 text-ink/70">{z.tekst}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prijzen: dezelfde bron als het dashboard */}
      <Prijzen />

      {/* Vragen */}
      <section id="vragen" className="mx-auto w-full max-w-3xl scroll-mt-8 px-6 pb-24">
        <h2 className="font-display text-4xl font-black tracking-tight text-ink">
          Veelgestelde vragen
        </h2>
        <div className="mt-10 space-y-4">
          {FAQ.map((item) => (
            <details
              key={item.vraag}
              className="group/faq rounded-2xl border border-ink/5 bg-white p-6 shadow-sm [&_summary]:cursor-pointer"
            >
              <summary className="flex list-none items-center justify-between text-lg font-bold text-ink">
                {item.vraag}
                <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-transform group-open/faq:rotate-45 motion-reduce:transition-none">
                  +
                </span>
              </summary>
              <p className="mt-4 leading-8 text-ink/70">{item.antwoord}</p>
            </details>
          ))}
        </div>
      </section>

      {/* De maker, kort en persoonlijk */}
      <section className="mx-auto w-full max-w-3xl px-6 pb-24">
        <div className="rounded-3xl border border-ink/5 bg-white p-8 shadow-md sm:p-10">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-ink/45">
            van de maker
          </p>
          <h2 className="mt-3 font-display text-3xl font-black tracking-tight text-ink">
            Ik ken dat bureau van 18:15.
          </h2>
          <p className="mt-4 text-lg leading-8 text-ink/75">
            Ik ben Michael en ik sta zelf voor de klas. Avinka is ontstaan uit
            mijn eigen avonden vol rapporten en analyses. Praktische tools,
            zorgvuldig met de privacy van je leerlingen, en jij houdt altijd het
            laatste woord.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-brand-soft ring-2 ring-brand/20">
              {fotoBestand ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/${fotoBestand}`} alt="Michael van Spanje" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-lg font-black text-brand">MvS</span>
              )}
            </span>
            <span>
              <span className="block font-display text-xl font-bold italic text-ink">Michael van Spanje</span>
              <span className="block text-sm font-semibold text-ink/55">leerkracht en maker van Avinka</span>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { DONKER, Golf, KOP, MINT_LICHT, KaartVlak, VLAK_MINT } from "./Wereld";

/* ── De privacysectie: DE SLUIS ────────────────────────────────────────────
   Een lage, levende strook waarin de belofte zichzelf voordoet. Kaartjes
   staan links in de rij voor een spleet in het membraan — de brievenbus van
   het apparaat. Naamkaartjes passen er precies doorheen, maar de spleet
   schraapt de naam eraf: de handgeschreven letters dwarrelen op een stapeltje
   aan jouw kant, en het kaartje reist verder als schuilnaam. Dossiers zijn
   te groot voor de spleet. Ze duwen, het membraan bolt, ze stuiteren terug
   en sluiten gewoon weer achteraan aan. Ze blijven het proberen; het lukt
   nooit. Dat is de grap én de belofte.

   DE VONDST IS DE SPLEET. In de vorige versie hield een onzichtbare regel
   de dossiers tegen ("dossiers mogen niet") — magie, dus uitleg nodig. Nu is
   de regel GEOMETRIE: het gat is precies naamkaartje-hoog en een dossier is
   hoger. Iedereen die weleens een pakketje bij een brievenbus heeft gehad
   snapt het zonder één woord.

   Verder geleerd van eerdere rondes:
   - hij speelt ZICHZELF. De vorige versie verstopte de kern achter een
     sleep-actie, dus 90% van de bezoekers zag hem nooit. Nu zie je binnen
     drie seconden een naam door de sluis gaan; zelf slepen is de bonus;
   - hij is LAAG (±230px). Geen speelveld dat een heel scherm opeist;
   - karakter zit in herhaling (het dossier dat blijft proberen), in de
     stapel thuisgebleven namen, en in het vinkje dat elke passage aftikt —
     het "afgevinkt"-motief van het merk op zijn eigen plek.

   Techniek: één rAF-lus die slaapt zodra de sluis uit beeld is (polaroid-
   les), alleen transforms (water-les: left/top per frame laat het scrollen
   haperen), kaartbreedtes gemeten in plaats van aangenomen (mobiel-les).
   Reduced motion krijgt een stilgezet tafereel dat het hele verhaal in één
   beeld vertelt.

   ⚠️ De schuilnamen hebben dezelfde vorm als de echte maskeerlaag
   (public/avinka-masking.js). Er gaat op deze pagina niets de deur uit. ── */

type Kaartje = {
  id: string;
  soort: "naam" | "dossier";
  tekst: string;
  masker?: string;
  /* de opmerking die een dossier bij zijn botsing achterlaat */
  noot?: string;
  wegOpSmal?: boolean;
};

const KAARTJES: Kaartje[] = [
  { id: "sofie", soort: "naam", tekst: "Sofie", masker: "leerling A" },
  { id: "toets", soort: "dossier", tekst: "toetsresultaten", noot: "past er niet door" },
  { id: "daan", soort: "naam", tekst: "Daan", masker: "leerling B" },
  { id: "gesprek", soort: "dossier", tekst: "gespreksverslagen", noot: "blijft gewoon hier", wegOpSmal: true },
  { id: "iris", soort: "naam", tekst: "Iris", masker: "leerling C" },
];

/* De toestand van één kaartje. Buiten React om: dit verandert 60x/s. */
type Fysica = {
  x: number; y: number;
  vx: number; vy: number;
  rot: number;
  fase: "wacht" | "reis" | "terug" | "weg" | "sleep";
  masked: boolean;
  dekking: number;
};

/* Een handgeschreven naam die op de stapel thuisblijvers valt. */
type Valler = { tekst: string; t: number; vanY: number; slot: number; sterft: boolean };

const klem = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const zacht = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* De spleet: iets ruimer dan een naamkaartje (h≈56), veel te krap voor een
   dossier (h≈78). De hele regel zit in deze twee getallen. */
const SPLEET_HALF = 34;

export function WereldPrivacy() {
  const scene = useRef<HTMLDivElement>(null);
  const kaartRefs = useRef<Array<HTMLDivElement | null>>([]);
  const naamRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const valRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const nootRef = useRef<HTMLSpanElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const membraanRef = useRef<SVGPathElement>(null);
  const flitsRef = useRef<SVGLineElement>(null);
  const confettiRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const veld = scene.current;
    if (!veld) return;

    const rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let B = 0;
    let H = 0;
    let smal = false;
    let gateX = 0;
    let beltY = 0;
    const halfB: number[] = KAARTJES.map(() => 50);
    const halfH: number[] = KAARTJES.map(() => 28);

    const actief = () =>
      KAARTJES.map((k, i) => (smal && k.wegOpSmal ? -1 : i)).filter((i) => i >= 0);

    /* de wachtrij, van voor (bij de spleet) naar achter */
    let rij: number[] = [];

    const fys: Fysica[] = KAARTJES.map(() => ({
      x: 0, y: 0, vx: 0, vy: 0, rot: 0, fase: "wacht", masked: false, dekking: 1,
    }));

    /* Plek in de rij: de voorste staat links van de spleet te wachten, en
       daarachter stapelen de echte breedtes op. Zo staat een smal naamkaartje
       nooit op de afstand van een breed dossier. */
    const rijPlek = (volgnr: number) => {
      let x = gateX - 92;
      for (let n = 0; n < volgnr; n++) x -= halfB[rij[n]] * 2 + 18;
      return x - halfB[rij[volgnr]];
    };

    const meet = () => {
      const r = veld.getBoundingClientRect();
      B = r.width;
      H = r.height;
      smal = B < 560;
      gateX = B * (smal ? 0.6 : 0.56);
      beltY = H * 0.52;
      kaartRefs.current.forEach((el, i) => {
        if (el) {
          halfB[i] = el.offsetWidth / 2;
          halfH[i] = el.offsetHeight / 2;
        }
      });
      /* het vinkje en het flitsje horen exact boven de spleet, en die ligt
         op smalle schermen op een ander percentage */
      if (badgeRef.current) badgeRef.current.style.left = `${gateX.toFixed(1)}px`;
      if (flitsRef.current) {
        flitsRef.current.setAttribute("x1", gateX.toFixed(1));
        flitsRef.current.setAttribute("x2", gateX.toFixed(1));
        flitsRef.current.setAttribute("y1", (beltY - SPLEET_HALF + 4).toFixed(1));
        flitsRef.current.setAttribute("y2", (beltY + SPLEET_HALF - 4).toFixed(1));
      }
    };

    const start = () => {
      meet();
      rij = actief();
      rij.forEach((wie, volgnr) => {
        fys[wie].x = rijPlek(volgnr);
        fys[wie].y = beltY;
        fys[wie].rot = (wie % 2 ? 1 : -1) * (1.2 + wie * 0.8);
      });
    };
    start();

    const ro = new ResizeObserver(() => {
      meet();
      wek();
    });
    ro.observe(veld);

    /* ── de losse spelers naast de kaartjes ── */
    const vallers: Array<Valler | null> = [null, null, null, null];
    let stapelTeller = 0;
    const confetti: Array<{ x: number; y: number; vx: number; vy: number; t: number } | null> =
      [null, null, null, null, null, null];
    let noot: { tekst: string; t: number; x: number; y: number } | null = null;

    let badgeSchaal = 1;
    let badgeVaart = 0;
    let flits = 0;
    let bocht = 0; // hoe ver het membraan bolt
    let bochtV = 0;

    /* ── de regisseur ── */
    let klok = 0;
    let rustTot = 1.0; // heel even wachten voor de eerste passage
    let reiziger = -1;
    let hintGetoond = false;
    let zelfGesleept = false;

    /* ── slepen (de bonus) ── */
    let sleep: { i: number; dx: number; dy: number } | null = null;
    let muisX = 0;
    let muisY = 0;

    const opDown = (e: PointerEvent) => {
      const doel = (e.target as HTMLElement).closest<HTMLElement>("[data-kaart]");
      if (!doel) return;
      const i = Number(doel.dataset.kaart);
      if (fys[i].dekking < 0.5) return;
      const r = veld.getBoundingClientRect();
      muisX = e.clientX - r.left;
      muisY = e.clientY - r.top;
      sleep = { i, dx: muisX - fys[i].x, dy: muisY - fys[i].y };
      if (reiziger === i) reiziger = -1;
      const idx = rij.indexOf(i);
      if (idx !== -1) rij.splice(idx, 1);
      fys[i].fase = "sleep";
      zelfGesleept = true;
      if (hintRef.current) hintRef.current.style.opacity = "0";
      doel.setPointerCapture?.(e.pointerId);
      wek();
    };
    const opMove = (e: PointerEvent) => {
      if (!sleep) return;
      const r = veld.getBoundingClientRect();
      muisX = e.clientX - r.left;
      muisY = e.clientY - r.top;
      wek();
    };
    const opUp = () => {
      if (!sleep) return;
      const f = fys[sleep.i];
      f.fase = f.masked ? "weg" : "terug";
      if (!f.masked && !rij.includes(sleep.i)) rij.push(sleep.i);
      sleep = null;
      rustTot = klok + 1.6;
      wek();
    };
    veld.addEventListener("pointerdown", opDown);
    window.addEventListener("pointermove", opMove, { passive: true });
    window.addEventListener("pointerup", opUp, { passive: true });
    window.addEventListener("pointercancel", opUp, { passive: true });

    /* een passage door de spleet: naam eraf, vinkje tikt, confetti */
    const passage = (i: number) => {
      const f = fys[i];
      f.masked = true;
      badgeSchaal = 1.45;
      badgeVaart = 0;
      flits = 1;
      const slot = stapelTeller % 3;
      vallers.forEach((v) => {
        if (v && v.slot === slot && !v.sterft) v.sterft = true;
      });
      let vrij = vallers.findIndex((v) => v === null);
      if (vrij === -1) vrij = 0;
      vallers[vrij] = { tekst: KAARTJES[i].tekst, t: 0, vanY: f.y, slot, sterft: false };
      stapelTeller++;
      for (let c = 0; c < 3; c++) {
        const vrijC = confetti.findIndex((d) => d === null);
        if (vrijC !== -1) {
          confetti[vrijC] = {
            x: gateX + 6,
            y: f.y - 10,
            vx: 55 + c * 60,
            vy: -110 - c * 45,
            t: 0,
          };
        }
      }
      if (!hintGetoond && !zelfGesleept && hintRef.current) {
        hintGetoond = true;
        hintRef.current.style.opacity = "1";
      }
    };

    /* een botsing van een dossier: membraan bolt, opmerking verschijnt */
    const botsing = (i: number, hardheid: number) => {
      bochtV += hardheid * 9;
      if (!noot) {
        noot = {
          tekst: KAARTJES[i].noot ?? "past er niet door",
          t: 0,
          x: gateX - 20,
          y: fys[i].y - halfH[i] - 12,
        };
      }
    };

    /* ── de lus ── */
    let raf = 0;
    let vorige = performance.now();
    let inBeeld = false;

    const stap = (nu: number) => {
      const dt = Math.min(0.032, (nu - vorige) / 1000);
      vorige = nu;
      klok += dt;

      /* de regisseur: om de zoveel tijd mag de voorste van de rij vertrekken */
      if (!sleep && reiziger === -1 && klok > rustTot && rij.length > 0) {
        reiziger = rij.shift()!;
        fys[reiziger].fase = "reis";
      }

      for (const i of actief()) {
        const k = KAARTJES[i];
        const f = fys[i];

        if (f.fase === "sleep" && sleep?.i === i) {
          /* achter je vinger aan; een dossier hangt zwaarder aan je hand */
          const massa = k.soort === "dossier" ? 2.4 : 1;
          f.vx += (((muisX - sleep.dx - f.x) * 240) / massa) * dt;
          f.vy += (((muisY - sleep.dy - f.y) * 240) / massa) * dt;
          f.vx *= Math.pow(0.002, dt);
          f.vy *= Math.pow(0.002, dt);
          f.x += f.vx * dt;
          f.y += f.vy * dt;

          if (!f.masked) {
            const rand = f.x + halfB[i];
            const pastInSpleet = k.soort === "naam" && Math.abs(f.y - beltY) < SPLEET_HALF - 6;
            if (rand > gateX && !pastInSpleet) {
              /* naast de spleet is het membraan gewoon een muur */
              const teVer = rand - gateX;
              f.x = gateX - halfB[i];
              bochtV += teVer * 1.4;
              if (k.soort === "dossier" && teVer > 12) botsing(i, 0.4);
            } else if (pastInSpleet && f.x - 6 > gateX) {
              passage(i);
            }
          }
        } else if (f.fase === "reis") {
          /* naar de spleet toe: er doorheen (naam) of ertegenaan (dossier) */
          f.vy += ((beltY - f.y) * 60 - f.vy * 10) * dt;
          f.y += f.vy * dt;
          f.x += (k.soort === "dossier" ? 200 : 170) * dt;
          if (k.soort === "naam") {
            if (!f.masked && f.x - 4 > gateX) passage(i);
            if (f.masked && f.x - halfB[i] > gateX) {
              f.fase = "weg";
              reiziger = -1;
              rustTot = klok + 2.0;
            }
          } else if (f.x + halfB[i] >= gateX) {
            f.x = gateX - halfB[i];
            botsing(i, 3.4);
            f.vx = -260;
            f.fase = "terug";
            rij.push(i);
            reiziger = -1;
            rustTot = klok + 1.8;
          }
        } else if (f.fase === "weg") {
          /* voorbij de sluis: rustig naar rechts, de anonimiteit in */
          f.x += 85 * dt;
          f.y = beltY + Math.sin(klok * 1.8 + i) * 3;
          if (f.x > B * 0.86) f.dekking = Math.max(0, f.dekking - dt * 1.5);
          if (f.dekking <= 0) {
            /* en links weer aansluiten: het tafereel is een lus */
            f.masked = false;
            f.x = -halfB[i] - 30;
            f.y = beltY;
            f.fase = "terug";
            rij.push(i);
            rustTot = Math.max(rustTot, klok + 1.2);
          }
        } else {
          /* wachten of terugkeren: naar je plek in de rij veren */
          const volgnr = rij.indexOf(i);
          const doelX = volgnr === -1 ? f.x : rijPlek(volgnr);
          f.vx += ((doelX - f.x) * 46 - f.vx * 8.2) * dt;
          f.vy += ((beltY - f.y) * 46 - f.vy * 8.2) * dt;
          f.x += f.vx * dt;
          f.y += f.vy * dt;
          f.dekking = Math.min(1, f.dekking + dt * 2.2);
          if (f.fase === "terug" && Math.abs(f.x - doelX) < 2 && Math.abs(f.vx) < 3) f.fase = "wacht";
        }

        /* tekenen */
        const el = kaartRefs.current[i];
        if (el) {
          /* door de spleet knijpt een kaartje even samen: de brievenbus-plof */
          const knijp = k.soort === "naam" && !sleepIs(i) ? Math.max(0, 1 - Math.abs(f.x - gateX) / 48) : 0;
          const kantel = klem(f.vx * 0.028, -10, 10);
          el.style.transform =
            `translate3d(${f.x.toFixed(1)}px, ${f.y.toFixed(1)}px, 0) translate(-50%, -50%)` +
            ` rotate(${(f.rot + kantel).toFixed(1)}deg)` +
            ` scale(${(1 + knijp * 0.07).toFixed(3)}, ${(1 - knijp * 0.24).toFixed(3)})`;
          el.style.opacity = f.dekking.toFixed(2);
          el.style.zIndex =
            sleep?.i === i ? "40" : f.fase === "reis" || f.fase === "weg" ? "30" : String(10 + i);
        }
        const naam = naamRefs.current[i];
        if (naam && k.soort === "naam") {
          const wil = f.masked ? k.masker! : k.tekst;
          if (naam.textContent !== wil) naam.textContent = wil;
          const dm = f.masked ? "ja" : "nee";
          if (naam.dataset.gemaskeerd !== dm) naam.dataset.gemaskeerd = dm;
        }
      }

      /* het membraan: veert terug, bolt bij een botsing */
      bochtV += (-bocht * 130 - bochtV * 7) * dt;
      bocht += bochtV * dt;
      if (membraanRef.current) {
        const b = klem(bocht, -12, 46);
        const top = beltY - SPLEET_HALF;
        const onder = beltY + SPLEET_HALF;
        membraanRef.current.setAttribute(
          "d",
          `M ${gateX.toFixed(1)} 6 Q ${(gateX + b).toFixed(1)} ${(top * 0.55).toFixed(1)} ${gateX.toFixed(1)} ${top.toFixed(1)}` +
            ` M ${gateX.toFixed(1)} ${onder.toFixed(1)} Q ${(gateX + b).toFixed(1)} ${((onder + H) / 2).toFixed(1)} ${gateX.toFixed(1)} ${(H - 6).toFixed(1)}`,
        );
      }

      /* het vinkje tikt af */
      badgeVaart += (-(badgeSchaal - 1) * 240 - badgeVaart * 12) * dt;
      badgeSchaal += badgeVaart * dt;
      if (badgeRef.current) {
        badgeRef.current.style.transform = `translate(-50%, -50%) rotate(8deg) scale(${badgeSchaal.toFixed(3)})`;
      }
      flits = Math.max(0, flits - dt * 3.2);
      if (flitsRef.current) flitsRef.current.style.opacity = (flits * 0.85).toFixed(2);

      /* de thuisgebleven namen dwarrelen naar hun stapel */
      for (let n = 0; n < vallers.length; n++) {
        const v = vallers[n];
        const el = valRefs.current[n];
        if (!el) continue;
        if (!v) {
          if (el.style.opacity !== "0") el.style.opacity = "0";
          continue;
        }
        v.t += dt;
        if (v.sterft) {
          const d = Math.max(0, 0.55 - v.t * 0.001 - (v.t > 1 ? (v.t - 1) * 0.9 : 0));
          el.style.opacity = d.toFixed(2);
          if (v.t > 1 && d <= 0) vallers[n] = null;
          continue;
        }
        const t = Math.min(1, v.t / 0.85);
        const e = zacht(t);
        const doelX = gateX - 56 - v.slot * 48;
        const doelY = H - 20;
        const x = gateX - 14 + (doelX - (gateX - 14)) * e;
        const y = v.vanY + (doelY - v.vanY) * (e * e);
        el.style.opacity = t < 1 ? "0.9" : "0.55";
        el.style.transform =
          `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)` +
          ` rotate(${((v.slot - 1) * 9 - 4 + e * 8).toFixed(1)}deg) scale(${(1 - e * 0.22).toFixed(3)})`;
        if (el.textContent !== v.tekst) el.textContent = v.tekst;
      }

      /* de opmerking van het dossier */
      if (nootRef.current) {
        if (noot) {
          noot.t += dt;
          const t = noot.t / 1.5;
          if (t >= 1) {
            noot = null;
            nootRef.current.style.opacity = "0";
          } else {
            if (nootRef.current.textContent !== noot.tekst) nootRef.current.textContent = noot.tekst;
            nootRef.current.style.opacity = (t < 0.15 ? t / 0.15 : 1 - Math.max(0, (t - 0.5) / 0.5)).toFixed(2);
            nootRef.current.style.transform =
              `translate3d(${noot.x.toFixed(1)}px, ${(noot.y - t * 28).toFixed(1)}px, 0) translate(-100%, -50%) rotate(-3deg)`;
          }
        } else if (nootRef.current.style.opacity !== "0") {
          nootRef.current.style.opacity = "0";
        }
      }

      /* de confetti van een passage */
      for (let c = 0; c < confetti.length; c++) {
        const d = confetti[c];
        const el = confettiRefs.current[c];
        if (!el) continue;
        if (!d) {
          if (el.style.opacity !== "0") el.style.opacity = "0";
          continue;
        }
        d.t += dt;
        if (d.t > 0.7) {
          confetti[c] = null;
          el.style.opacity = "0";
          continue;
        }
        d.vy += 620 * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        el.style.opacity = (0.9 * (1 - d.t / 0.7)).toFixed(2);
        el.style.transform = `translate3d(${d.x.toFixed(1)}px, ${d.y.toFixed(1)}px, 0) rotate(${(d.t * 260).toFixed(0)}deg)`;
      }

      /* De sluis speelt zolang hij in beeld is; daarbuiten slaapt de lus en
         kost de sectie niets. */
      if (!inBeeld && !sleep) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(stap);
    };

    const sleepIs = (i: number) => sleep?.i === i;

    const wek = () => {
      if (raf || rustig) return;
      vorige = performance.now();
      raf = requestAnimationFrame(stap);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        inBeeld = e.isIntersecting;
        if (inBeeld) wek();
      },
      { rootMargin: "-8% 0px" },
    );
    io.observe(veld);

    if (rustig) {
      /* Stilgezet tafereel dat het hele verhaal in één beeld vertelt: een
         gemaskeerd kaartje voorbij de sluis, een naam op de stapel, en een
         dossier dat tegen het membraan rust. */
      const ids = actief();
      const eerste = ids[0];
      fys[eerste].masked = true;
      fys[eerste].fase = "weg";
      fys[eerste].x = gateX + 150;
      rij = ids.slice(1);
      rij.forEach((wie, volgnr) => {
        fys[wie].x = rijPlek(volgnr);
        fys[wie].y = beltY;
      });
      const dossier = ids.find((i) => KAARTJES[i].soort === "dossier");
      if (dossier !== undefined) fys[dossier].x = gateX - halfB[dossier];
      vallers[0] = { tekst: KAARTJES[eerste].tekst, t: 1, vanY: beltY, slot: 0, sterft: false };
      bocht = 16;
      inBeeld = false;
      stap(performance.now());
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      veld.removeEventListener("pointerdown", opDown);
      window.removeEventListener("pointermove", opMove);
      window.removeEventListener("pointerup", opUp);
      window.removeEventListener("pointercancel", opUp);
    };
  }, []);

  return (
    <section className="relative overflow-hidden" style={{ background: MINT_LICHT }} aria-label="Privacy">
      <Golf kleur="#fcfbf7" flip vorm="oploopRechts" hoogte="h-[70px] sm:h-[118px]" />
      <KaartVlak
        kleur={VLAK_MINT}
        vorm="koepel"
        breedte={720}
        hoogte={340}
        style={{ right: "-16%", top: 80, transform: "rotate(-5deg)" }}
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
          <p data-reveal style={{ transitionDelay: "80ms" }} className="mt-6 text-xl leading-9 text-ink/75">
            Gegevens van leerlingen bewaren we niet. En hun namen gaan nooit
            naar de AI: die worden op jouw eigen apparaat vervangen door een
            schuilnaam, nog vóór er iets wordt verstuurd.
          </p>
        </div>

        {/* ── de sluis ── */}
        <div
          ref={scene}
          data-reveal
          className="relative mt-12 h-[230px] touch-none select-none sm:h-[240px]"
        >
          <p className="pointer-events-none absolute left-0 top-0 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-ink/40">
            Op jouw apparaat
          </p>
          <p
            className="pointer-events-none absolute right-0 top-0 text-[0.68rem] font-bold uppercase tracking-[0.16em]"
            style={{ color: KOP }}
          >
            Wat er weggaat
          </p>

          {/* de reisbaan en het membraan */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            <defs>
              <linearGradient id="sluis-baan" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor={KOP} stopOpacity="0" />
                <stop offset="0.1" stopColor={KOP} stopOpacity="0.2" />
                <stop offset="0.82" stopColor={KOP} stopOpacity="0.2" />
                <stop offset="1" stopColor={KOP} stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* de baan waar alles overheen rijdt */}
            <line x1="0" y1="66%" x2="100%" y2="66%" stroke="url(#sluis-baan)" strokeWidth="1.5" strokeDasharray="1 7" />
            {/* het membraan, met de spleet erin */}
            <path
              ref={membraanRef}
              fill="none"
              stroke={KOP}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="2 9"
              strokeOpacity="0.5"
            />
            {/* het groene flitsje van een passage */}
            <line ref={flitsRef} x1="56%" y1="34%" x2="56%" y2="70%" stroke="#2f9e6e" strokeWidth="3" strokeLinecap="round" style={{ opacity: 0 }} />
          </svg>

          {/* het vinkje boven de spleet: de stempel van de sluis */}
          <div
            ref={badgeRef}
            className="pointer-events-none absolute flex h-9 w-9 items-center justify-center rounded-2xl bg-brand shadow-md"
            style={{ left: "56%", top: "13%", transform: "translate(-50%, -50%) rotate(8deg)" }}
            aria-hidden
          >
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* de thuisgebleven namen op hun stapel */}
          {[0, 1, 2, 3].map((n) => (
            <span
              key={`val-${n}`}
              ref={(r) => {
                valRefs.current[n] = r;
              }}
              className="pointer-events-none absolute left-0 top-0 whitespace-nowrap text-xl opacity-0"
              style={{ fontFamily: "var(--font-hand)", color: "#a07c14" }}
              aria-hidden
            />
          ))}

          {/* de opmerking van een gebotst dossier */}
          <span
            ref={nootRef}
            className="pointer-events-none absolute left-0 top-0 whitespace-nowrap text-lg opacity-0"
            style={{ fontFamily: "var(--font-hand)", color: KOP }}
            aria-hidden
          />

          {/* de confetti */}
          {[0, 1, 2, 3, 4, 5].map((c) => (
            <span
              key={`conf-${c}`}
              ref={(r) => {
                confettiRefs.current[c] = r;
              }}
              className="pointer-events-none absolute left-0 top-0 h-[7px] w-[7px] rounded-[2px] opacity-0"
              style={{ background: c % 2 ? "#f59e0b" : "#2f9e6e" }}
              aria-hidden
            />
          ))}

          {/* de kaartjes */}
          {KAARTJES.map((k, i) => (
            <div
              key={k.id}
              data-kaart={i}
              ref={(r) => {
                kaartRefs.current[i] = r;
              }}
              className={`absolute left-0 top-0 cursor-grab will-change-transform active:cursor-grabbing ${
                k.wegOpSmal ? "hidden sm:block" : ""
              }`}
            >
              {k.soort === "naam" ? (
                <span
                  className="flex h-[52px] w-[96px] items-center justify-center rounded-[14px] border-[2.5px] bg-white shadow-[-4px_12px_26px_-14px_rgba(23,80,58,0.55)] sm:h-[56px] sm:w-[106px]"
                  style={{ borderColor: "#d4e5dc" }}
                >
                  <span
                    ref={(r) => {
                      naamRefs.current[i] = r;
                    }}
                    data-gemaskeerd="nee"
                    className="text-[1.25rem] leading-none sm:text-[1.4rem] [&[data-gemaskeerd='ja']]:rounded-md [&[data-gemaskeerd='ja']]:bg-brand/10 [&[data-gemaskeerd='ja']]:px-1.5 [&[data-gemaskeerd='ja']]:py-1 [&[data-gemaskeerd='ja']]:font-sans [&[data-gemaskeerd='ja']]:text-[0.82rem] [&[data-gemaskeerd='ja']]:font-bold [&[data-gemaskeerd='ja']]:text-[#1e6b4d] sm:[&[data-gemaskeerd='ja']]:text-[0.9rem]"
                    style={{ fontFamily: "var(--font-hand)", color: DONKER }}
                  >
                    {k.tekst}
                  </span>
                </span>
              ) : (
                /* het dossier: zichtbaar te hoog voor de spleet */
                <span className="relative block w-[128px] pt-2.5 sm:w-[150px]">
                  <span className="absolute left-3 top-0 h-3 w-14 rounded-t-[7px]" style={{ background: "#dfe9dc" }} />
                  <span
                    className="relative block rounded-[10px] border-[2.5px] px-3 py-3 shadow-[-4px_12px_26px_-14px_rgba(23,80,58,0.55)] sm:py-3.5"
                    style={{ background: "#f7f5ee", borderColor: "#d4e5dc" }}
                  >
                    <span className="block text-[0.72rem] font-bold leading-tight sm:text-[0.8rem]" style={{ color: "#3c5147" }}>
                      {k.tekst}
                    </span>
                    <span className="mt-1.5 block h-[3px] w-3/4 rounded-full bg-ink/10" />
                    <span className="mt-1 block h-[3px] w-1/2 rounded-full bg-ink/10" />
                  </span>
                </span>
              )}
            </div>
          ))}

          {/* de uitnodiging, pas na de eerste passage */}
          <p
            ref={hintRef}
            className="pointer-events-none absolute bottom-0 right-0 hidden text-lg opacity-0 transition-opacity duration-700 sm:block"
            style={{ fontFamily: "var(--font-hand)", color: KOP }}
          >
            je mag ze ook zelf slepen
          </p>
        </div>

        <p className="mt-8 max-w-xl text-lg leading-8 text-ink/70">
          Een naam past er alleen doorheen zonder zijn naam. En alles met
          leerlinggegevens past er helemaal niet door.
        </p>
      </div>
    </section>
  );
}

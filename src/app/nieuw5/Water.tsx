"use client";

import { useEffect, useRef } from "react";
import { Golf, MINT_LICHT } from "./Wereld";

/* ── De privacysectie: onder de oppervlakte ────────────────────────────────
   Eén filmisch moment in plaats van een uitlegblok met kaartjes. De belofte
   wordt niet verteld maar VOORGEDAAN, in zes beats die aan je scrollpositie
   hangen:

     1. RUST      spiegelglad water, alleen licht en diepte
     2. AANRAKING je muis maakt rimpels; waar je raakt komt heel even één
                  woord boven — laat je los, dan zakt het weer weg
     3. LAGEN     het water wordt helderder: er blijkt van alles te drijven,
                  op verschillende dieptes, nooit alles tegelijk leesbaar
     4. MASKER    een lichtbundel zakt het water in. Binnen de bundel zie je
                  wat er van jouw apparaat vertrekt: elke naam is daar al
                  vervangen door een schuilnaam
     5. STROMING  de stroom trekt aan, de woorden lossen op — niets blijft
     6. BOODSCHAP het water valt stil en de kop komt boven

   ⚠️ Beat 4 wijkt bewust af van de referentie-storyboard. Daar was het
   "zichtbaar voor de juiste mensen", een verhaal over rollen en rechten. Dat
   is niet wat Avinka doet: hier gaan namen nóóit mee, ze worden op het
   apparaat zelf vervangen. De sectie mag geen belofte tonen die we niet
   waarmaken (zie het juristentraject).

   Het water is een WebGL-shader en geen plaatje of tekening. Dat is een
   bewuste keuze: eerdere pogingen om een fysieke wereld met CSS ná te tekenen
   liepen twee keer stuk op "dit is Paint, geen film". Zonneschittering op
   golven is nu juist iets wat je niet tekent maar uitrekent — per pixel de
   golfhelling bepalen en kijken of die de zon precies jouw kant op kaatst.
   Daar komt de glinsterbaan vanzelf uit, inclusief het uitwaaieren naar de
   kijker toe.

   De zon is ook het scharnier met de rest van de pagina: bovenin loopt de
   lucht exact door in het crème van het papier erboven, verderop verhit hij
   naar goud en daaronder begint het water. Er is dus geen naad tussen de
   lichte pagina en het donker — het licht kantelt gewoon.  ────────────── */

/* De perspectiefafspraak, gedeeld door shader en woorden. Zonder dat de twee
   exact hetzelfde rekenen, drijven de woorden niet ín het water maar erboven.
     sy = schermhoogte 0 (boven) .. 1 (onder)
     HORIZON = waar het water begint
     b   = hoe ver onder de horizon
     dist = afstand tot de kijker; b -> 0 is oneindig ver (de horizon zelf)
   De omkering (van afstand naar schermpositie) staat in `naarScherm`. */
const HORIZON = 0.3;
const DIEPTE_C = 0.7; // dist * b = DIEPTE_C
const SPREIDING = 2.0;
/* GLSL ES kent geen impliciete int-naar-float: een `2` uit JS zou hier een
   compileerfout geven. Daarom altijd via toFixed de punt erin houden. */
const glf = (n: number) => n.toFixed(4);

function naarScherm(wx: number, dist: number) {
  const b = DIEPTE_C / dist;
  return { sx: 0.5 + wx / (dist * SPREIDING), sy: HORIZON + b };
}

/* De woorden die onder de oppervlakte drijven. Twee soorten: voornamen (die
   in de bundel een schuilnaam krijgen) en gegevenssoorten (die daar gewoon
   oplossen). `dist` is de afstand tot de kijker, `wx` de plek links/rechts. */
type Woord = {
  tekst: string;
  masker?: string;
  wx: number;
  dist: number;
  /* per woord een eigen tempo zodat ze niet als groep bewegen */
  tel: number;
  /* Op een smal scherm past maar de helft: twaalf woorden vielen daar over
     elkaar én over de glinsterbaan heen, en dan is er niets meer te lezen.
     Deze selectie houdt het verhaal heel — genoeg namen om de maskering te
     laten zien, genoeg gegevenssoorten om de lading te voelen. */
  mobiel?: boolean;
};

const WOORDEN: Woord[] = [
  { tekst: "Sofie", masker: "leerling A", wx: -0.5, dist: 1.35, tel: 0, mobiel: true },
  { tekst: "toetsresultaten", wx: 0.66, dist: 1.6, tel: 3 },
  { tekst: "Daan", masker: "leerling B", wx: 0.1, dist: 1.15, tel: 6, mobiel: true },
  { tekst: "gespreksverslag", wx: -1.15, dist: 2.0, tel: 1, mobiel: true },
  { tekst: "Iris", masker: "leerling C", wx: 1.15, dist: 2.2, tel: 4, mobiel: true },
  { tekst: "rapportcijfers", wx: -0.3, dist: 2.55, tel: 7, mobiel: true },
  { tekst: "Mees", masker: "leerling D", wx: -1.6, dist: 2.8, tel: 2 },
  { tekst: "leerlingnummer", wx: 1.75, dist: 3.1, tel: 5, mobiel: true },
  { tekst: "Noor", masker: "leerling E", wx: 0.6, dist: 3.4, tel: 8 },
  { tekst: "absenties", wx: -1.05, dist: 3.75, tel: 9 },
  { tekst: "onderzoeksverslag", wx: 1.9, dist: 4.1, tel: 10 },
  { tekst: "Yassin", masker: "leerling F", wx: -2.1, dist: 4.5, tel: 11 },
];

/* ── De shader ──
   Camera in de oorsprong, water als vlak eronder. Voor elke pixel onder de
   horizon zoeken we het punt op het water, bepalen daar de golfhelling en
   kijken hoeveel van de zon die helling naar de kijker kaatst. */
const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2  uRes;
uniform float uTijd;
uniform float uHelder;   // 0 = ondoorzichtig, 1 = je kijkt het water in
uniform float uBundel;   // sterkte van de lichtbundel
uniform float uBundelX;  // wereld-x van de bundel
uniform float uStroom;   // hoe hard de stroming trekt
uniform float uKalm;     // beat 6: het water valt stil en wordt weer ondoorzichtig
uniform float uRustig;   // 1 = prefers-reduced-motion: alles stil
uniform vec4  uRimpels[8]; // xy = wereldpositie, z = starttijd, w = kracht

const float HORIZON = ${glf(HORIZON)};
const float DIEPTE_C = ${glf(DIEPTE_C)};
const float SPREIDING = ${glf(SPREIDING)};

/* De zon staat laag en net rechts van het midden — dezelfde hoek als het
   licht op de rest van de pagina, zodat het één ruimte blijft. */
const float ZON_X = 0.62;
const vec3  ZON_KLEUR = vec3(1.0, 0.94, 0.78);
const vec3  PAPIER = vec3(0.988, 0.984, 0.969); // #fcfbf7, de pagina erboven
const vec3  DIEP = vec3(0.012, 0.055, 0.042);   // donkergroen, geen blauw
const vec3  ONDIEP = vec3(0.043, 0.176, 0.132);

/* ── Golfhoogte ──
   Eerst met optellende sinussen gedaan; dat gaf een zichtbaar geweven raster
   in plaats van water, want twee gekruiste sinussen zijn nu eenmaal ruitjes.
   Nu waardeRuis met domain warping: het meetpunt wordt eerst zélf verschoven
   door een tragere ruis. Daardoor kan er per definitie geen patroon ontstaan,
   en krijgen de golffronten die grillige, onderling botsende vorm die echt
   open water heeft. */
float hash(vec2 p) {
  p = fract(p * vec2(127.31, 311.7));
  p += dot(p, p + 42.17);
  return fract(p.x * p.y);
}

float ruis(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 2.0 - 1.0;
}

float golfhoogte(vec2 p, float t) {
  /* de warp: hierdoor lopen de golffronten nooit recht */
  vec2 warp = vec2(
    ruis(p * 0.30 + vec2(t * 0.05, 0.0)),
    ruis(p * 0.30 + vec2(0.0, t * 0.042) + 19.7)
  );
  /* De schaal bepaalt hoeveel golven er dichtbij in beeld passen. Op 1.15
     stond er onderin maar één of twee golven over de volle breedte, waardoor
     het daar een gladde plas werd in plaats van water. */
  vec2 q = p * 2.9 + warp * 1.05;

  float h = 0.0;
  float amp = 0.52;
  float freq = 1.0;
  /* elke octaaf een slag gedraaid, anders liggen ze toch weer op één as */
  mat2 draai = mat2(0.864, -0.504, 0.504, 0.864);
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    h += ruis(q * freq + vec2(t * (0.22 + fi * 0.10), -t * (0.15 + fi * 0.07))) * amp;
    q = draai * q;
    freq *= 2.07;
    amp *= 0.50;
  }

  /* de rimpels van je muis: ringen die uitdijen en uitdoven */
  for (int i = 0; i < 8; i++) {
    vec4 r = uRimpels[i];
    if (r.w > 0.001) {
      float leeftijd = uTijd - r.z;
      if (leeftijd > 0.0 && leeftijd < 5.0) {
        float d = distance(p, r.xy);
        float straal = leeftijd * 1.9;
        float band = exp(-pow((d - straal) * 1.6, 2.0));
        h += sin((d - straal) * 7.0) * band * exp(-leeftijd * 0.75) * r.w * 0.40;
      }
    }
  }
  return h;
}

void main() {
  vec2 sp = gl_FragCoord.xy / uRes;
  float sx = sp.x;
  float sy = 1.0 - sp.y; // 0 boven, 1 onder

  float t = uTijd * (1.0 - uRustig * 0.98);

  /* ── boven de horizon: de lucht die uit het papier ontstaat ── */
  if (sy < HORIZON) {
    float f = sy / HORIZON;              // 0 bovenaan, 1 aan de horizon
    /* van het papier van de pagina naar warm goud vlak boven het water */
    vec3 lucht = mix(PAPIER, vec3(1.0, 0.90, 0.66), pow(f, 1.5));
    /* de zon zelf: een felle kern precies op de horizon, breed uitwaaierend */
    float dx = (sx - ZON_X) * 1.9;
    float dy = (HORIZON - sy) * 3.4;
    float gloed = exp(-(dx * dx + dy * dy) * 3.2);
    lucht = mix(lucht, vec3(1.0), clamp(gloed * 1.25, 0.0, 1.0));
    /* een horizontale waas vlak boven het water, zoals warme lucht doet */
    lucht = mix(lucht, vec3(1.0, 0.96, 0.86), pow(f, 7.0) * 0.75);
    gl_FragColor = vec4(lucht, 1.0);
    return;
  }

  /* ── onder de horizon: het water ── */
  float b = sy - HORIZON;
  float dist = DIEPTE_C / max(b, 0.0012);
  float wx = (sx - 0.5) * dist * SPREIDING;
  vec2 w = vec2(wx, dist);

  /* Hoge golffrequenties doven uit met de afstand. Zonder dat gaat het in de
     verte ruisen: daar vallen meerdere golven binnen één pixel. */
  float demping = 1.0 / (1.0 + dist * dist * 0.055);

  /* de meetafstand voor de helling groeit mee met de afstand, zodat we in de
     verte over een groter stuk water uitmiddelen in plaats van te flikkeren */
  float e = 0.02 * max(1.0, dist * 0.8);
  float h0 = golfhoogte(w, t);
  float hx = golfhoogte(w + vec2(e, 0.0), t);
  float hz = golfhoogte(w + vec2(0.0, e), t);
  /* aan het eind gaat de deining eruit: het water wordt spiegelglad */
  float amp = (0.055 + uStroom * 0.05) * demping * (1.0 - uKalm * 0.62);
  vec3 N = normalize(vec3(-(hx - h0) / e * amp, 1.0, -(hz - h0) / e * amp));

  /* kijkrichting terug naar de camera (die op hoogte 1 in de oorsprong staat) */
  vec3 P = vec3(wx, -1.0, dist);
  vec3 V = normalize(-P);
  /* de zon als ver licht, laag boven de horizon */
  vec3 L = normalize(vec3((ZON_X - 0.5) * 2.2, 0.165, 1.0));
  vec3 Hv = normalize(V + L);

  /* Drie lobben in plaats van twee. De scherpe geeft de losse vonken, de
     middelste laat de baan naar de kijker toe uitwaaieren (met alleen een
     harde lob stopte de glinsterbaan halverwege), de brede legt er een
     zachte gloed omheen. */
  float basis = max(dot(N, Hv), 0.0);
  float spec = pow(basis, 340.0);
  float specMidden = pow(basis, 70.0) * 0.34;
  float specZacht = pow(basis, 16.0) * 0.13;

  /* fresnel: vlak onder de horizon kijk je scherend en spiegelt het water
     bijna alles, dichtbij kijk je erin */
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.0);
  fres = clamp(fres, 0.03, 1.0);

  /* De basiskleur. De spiegeling was eerst bijna wit, waardoor het water
     grijs werd in plaats van groen; hij houdt nu de warme tint van de lucht
     vast en mengt maar half zo sterk in. */
  vec3 spiegel = mix(vec3(0.62, 0.66, 0.56), vec3(1.0, 0.92, 0.75), 0.45);
  vec3 kleur = mix(DIEP, ONDIEP, clamp(1.0 - dist * 0.12, 0.0, 1.0));
  kleur = mix(kleur, spiegel, fres * 0.5);

  /* als het water helderder wordt zie je de diepte eronder: een zachte gloed
     die van onderaf komt, sterker naar de kijker toe */
  float onderlicht = uHelder * exp(-dist * 0.22) * 0.5;
  kleur += vec3(0.05, 0.20, 0.15) * onderlicht;

  /* de glinsterbaan van de zon */
  kleur += ZON_KLEUR * (spec * 2.4 + specMidden + specZacht)
         * (0.4 + 0.6 * exp(-dist * 0.05)) * (1.0 - uKalm * 0.72);

  /* ── de lichtbundel ──
     Een kegel die vanaf de horizon het water in zakt. Binnen de kegel wordt
     het water lichter, zodat wat daar drijft leesbaar is. */
  if (uBundel > 0.001) {
    float straal = 0.80 + dist * 0.26;
    float d = abs(wx - uBundelX);
    /* twee kegels over elkaar: een heldere kern met een zachte zoom eromheen,
       anders leest het als een vlek en niet als licht dat het water in valt */
    float kern = smoothstep(straal * 0.62, 0.0, d);
    float zoom = smoothstep(straal * 1.5, straal * 0.2, d);
    float diepteval = smoothstep(0.0, 1.4, dist) * smoothstep(9.0, 3.2, dist);
    float bundel = diepteval * uBundel;
    /* de bundel schemert mee met de golven, anders is het een dode vlek */
    bundel *= 0.80 + 0.20 * sin(h0 * 3.0 + t * 1.6);
    kleur += vec3(0.62, 0.95, 0.80) * kern * bundel * 0.62;
    kleur += vec3(0.40, 0.78, 0.62) * zoom * bundel * 0.30;
  }

  /* helemaal onderin het beeld dooft alles naar het diepe donker */
  kleur = mix(kleur, DIEP, smoothstep(0.72, 1.0, sy) * 0.55);

  /* Beat 6: het water wordt weer ondoorzichtig en donker. Dat is niet alleen
     het einde van het verhaal ("er is niets meer te zien") maar ook wat de
     slotkop leesbaar maakt — die stond eerst dwars over de glinsterbaan. */
  kleur = mix(kleur, DIEP * 1.15, uKalm * 0.5);

  gl_FragColor = vec4(kleur, 1.0);
}
`;

/* De beats, uitgedrukt in scrollvoortgang. */
function fasen(p: number) {
  const tussen = (a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));
  return {
    /* het water wordt helder en de woorden komen tevoorschijn */
    helder: tussen(0.26, 0.46) * (1 - tussen(0.76, 0.92)),
    /* de lichtbundel zakt in en trekt weer weg */
    bundel: tussen(0.46, 0.58) * (1 - tussen(0.66, 0.78)),
    /* de stroming die de woorden meeneemt */
    stroom: tussen(0.64, 0.86),
    /* het water valt stil en wordt weer ondoorzichtig */
    kalm: tussen(0.78, 0.93),
    /* alles is opgelost, de kop komt boven */
    slot: tussen(0.84, 0.97),
    /* de uitnodiging om te bewegen, alleen in het begin */
    hint: tussen(0.06, 0.14) * (1 - tussen(0.24, 0.34)),
  };
}

export function WereldWater() {
  const buiten = useRef<HTMLDivElement>(null);
  const doek = useRef<HTMLCanvasElement>(null);
  const woordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const kopRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const oeverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = doek.current;
    const sectie = buiten.current;
    if (!canvas || !sectie) return;

    const rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) {
      /* Geen WebGL: dan blijft de CSS-achtergrond van het doek staan (een
         verloop in dezelfde kleuren). De tekst werkt gewoon. */
      canvas.style.background =
        "linear-gradient(#fcfbf7 0%, #ffe9bd 28%, #0f3a2c 34%, #041008 100%)";
      return;
    }

    /* ── programma ── */
    const maak = (soort: number, bron: string) => {
      const s = gl.createShader(soort)!;
      gl.shaderSource(s, bron);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("[water] shader:", gl.getShaderInfoLog(s));
      }
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, maak(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, maak(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = {
      res: gl.getUniformLocation(prog, "uRes"),
      tijd: gl.getUniformLocation(prog, "uTijd"),
      helder: gl.getUniformLocation(prog, "uHelder"),
      bundel: gl.getUniformLocation(prog, "uBundel"),
      bundelX: gl.getUniformLocation(prog, "uBundelX"),
      stroom: gl.getUniformLocation(prog, "uStroom"),
      kalm: gl.getUniformLocation(prog, "uKalm"),
      rustig: gl.getUniformLocation(prog, "uRustig"),
      /* array-uniform: WebGL 1 wil hier de eerste index expliciet zien */
      rimpels: gl.getUniformLocation(prog, "uRimpels[0]"),
    };
    gl.uniform1f(u.rustig, rustig ? 1 : 0);

    /* ── maat ──
       De devicePixelRatio wordt afgetopt op 1.5. Een shader die per pixel
       zes golfoctaven en acht rimpels uitrekent is op een 4K-scherm anders
       zomaar vier keer zo duur, en het verschil zie je bij water niet. */
    const meet = () => {
      /* 0.8: we tekenen bewust onder schermresolutie en laten de browser
         opschalen. Bij water ziet niemand dat — het is toch een zachte,
         bewegende textuur — maar het scheelt bijna de helft van het werk. */
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * 0.8;
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, canvas.width, canvas.height);
    };
    meet();
    const ro = new ResizeObserver(meet);
    ro.observe(canvas);

    /* ── rimpels ──
       Acht plekken, steeds de oudste hergebruikt. De positie wordt van het
       scherm naar het waterVLAK omgerekend, zodat een rimpel in de verte
       vanzelf smal en plat is en dichtbij breed — precies zoals perspectief
       hoort te werken. */
    const rimpels = new Float32Array(8 * 4);
    let volgende = 0;
    let laatsteRimpel = -1;
    const raak = (klantX: number, klantY: number, kracht: number) => {
      const r = canvas.getBoundingClientRect();
      const sx = (klantX - r.left) / r.width;
      const sy = (klantY - r.top) / r.height;
      if (sy < HORIZON + 0.005 || sy > 1 || sx < 0 || sx > 1) return;
      const dist = DIEPTE_C / (sy - HORIZON);
      if (dist > 14) return;
      const wx = (sx - 0.5) * dist * SPREIDING;
      const i = volgende % 8;
      rimpels[i * 4] = wx;
      rimpels[i * 4 + 1] = dist;
      rimpels[i * 4 + 2] = klok();
      rimpels[i * 4 + 3] = kracht;
      volgende++;
      wek();
    };

    const start = performance.now();
    const klok = () => (performance.now() - start) / 1000;

    let muisX = -999;
    let muisY = -999;
    const opMuis = (e: PointerEvent) => {
      muisX = e.clientX;
      muisY = e.clientY;
      const nu = klok();
      /* niet elke pixel een rimpel: dat wordt soep. Ongeveer 12 per seconde. */
      if (nu - laatsteRimpel > 0.085) {
        laatsteRimpel = nu;
        raak(e.clientX, e.clientY, 1);
      }
    };
    const opKlik = (e: PointerEvent) => raak(e.clientX, e.clientY, 2.2);
    if (!rustig) {
      sectie.addEventListener("pointermove", opMuis, { passive: true });
      sectie.addEventListener("pointerdown", opKlik, { passive: true });
    }

    /* ── scrollvoortgang ── */
    let voortgang = 0;
    const meetVoortgang = () => {
      const r = sectie.getBoundingClientRect();
      const loop = r.height - window.innerHeight;
      voortgang = loop <= 0 ? 0 : Math.min(1, Math.max(0, -r.top / loop));
    };

    /* ── de lus ──
       Draait alleen als de sectie in beeld is. Buiten beeld staat alles stil,
       dus dit stuk kost niets zolang je er niet bent. */
    let raf = 0;
    let inBeeld = false;
    const stap = () => {
      raf = 0;
      meetVoortgang();
      const f = fasen(voortgang);
      const t = klok();

      gl.uniform1f(u.tijd, t);
      gl.uniform1f(u.helder, f.helder);
      gl.uniform1f(u.bundel, f.bundel);
      gl.uniform1f(u.stroom, f.stroom);
      gl.uniform1f(u.kalm, f.kalm);
      /* de bundel volgt je muis, maar traag en alleen als je in beeld bent */
      const r = canvas.getBoundingClientRect();
      const msx = (muisX - r.left) / Math.max(1, r.width);
      const msy = (muisY - r.top) / Math.max(1, r.height);
      let bundelX = 0;
      if (msy > HORIZON && msy < 1 && msx > 0 && msx < 1) {
        const d = DIEPTE_C / (msy - HORIZON);
        bundelX = (msx - 0.5) * d * SPREIDING;
      }
      gl.uniform1f(u.bundelX, bundelX);
      gl.uniform4fv(u.rimpels, rimpels);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      tekenWoorden(t, f, r);

      if (inBeeld && !rustig) raf = requestAnimationFrame(stap);
    };
    const wek = () => {
      if (!raf && inBeeld) raf = requestAnimationFrame(stap);
    };

    /* ── de woorden ──
       Ze staan als gewone tekst in de DOM (dus scherp en selecteerbaar), maar
       hun plek komt uit dezelfde perspectiefberekening als de shader. Blur en
       dekking vertellen de diepte: hoe verder weg, hoe onleesbaarder. */
    const tekenWoorden = (t: number, f: ReturnType<typeof fasen>, r: DOMRect) => {
      const msx = (muisX - r.left) / Math.max(1, r.width);
      const msy = (muisY - r.top) / Math.max(1, r.height);
      let muisW: { wx: number; dist: number } | null = null;
      if (msy > HORIZON && msy < 1 && msx > 0 && msx < 1) {
        const d = DIEPTE_C / (msy - HORIZON);
        muisW = { wx: (msx - 0.5) * d * SPREIDING, dist: d };
      }

      WOORDEN.forEach((wo, i) => {
        const el = woordRefs.current[i];
        if (!el) return;

        /* de stroming draagt de woorden mee en trekt ze uit elkaar */
        const drift = Math.sin(t * 0.22 + wo.tel * 1.3) * 0.22 + f.stroom * (1.1 + wo.tel * 0.08);
        const wx = wo.wx + drift;
        const dist = wo.dist + Math.sin(t * 0.17 + wo.tel) * 0.06;
        const { sx, sy } = naarScherm(wx, dist);

        /* buiten beeld: niet tekenen */
        if (sx < -0.25 || sx > 1.25 || sy > 1.04) {
          el.style.opacity = "0";
          return;
        }

        /* Hoe zichtbaar is dit woord?
           - `helder`: de fase waarin het water doorzichtig wordt
           - de rimpel onder je muis licht het lokaal even op
           - de bundel maakt het scherp leesbaar
           - de stroming lost het weer op */
        let zicht = f.helder * (1 - Math.min(1, (dist - 1) / 5.5) * 0.55);

        let nabij = 0;
        if (muisW) {
          const d = Math.hypot(wx - muisW.wx, dist - muisW.dist);
          nabij = Math.max(0, 1 - d / 1.5);
        }
        /* in beat 2 is de aanraking het enige dat iets laat zien */
        zicht = Math.max(zicht, nabij * (0.35 + 0.65 * f.helder));

        const inBundel = f.bundel > 0.01 ? Math.max(0, 1 - Math.abs(wx - bundelXVanMuis(muisW)) / (0.85 + dist * 0.3)) : 0;
        const bundelKracht = inBundel * f.bundel * (dist < 8 ? 1 : 0);

        const oplossen = Math.min(1, f.stroom * 1.25);
        const dekking = Math.max(0, Math.min(1, (zicht * 1.15 + bundelKracht * 0.9) * (1 - oplossen)));

        /* Scherpte. Stond eerst op factor 7, waardoor de woorden in de
           lagen-beat vlekken bleven in plaats van woorden: je moet kunnen
           LEZEN dat er gegevens drijven, anders mist de scène zijn punt.
           Onder water blijft een restje waas altijd staan. */
        const wazig = (1 - Math.min(1, zicht + bundelKracht)) * 4.2 + 0.5 + oplossen * 9;

        /* grootte volgt het perspectief */
        const schaal = Math.max(0.5, 1.5 / dist);

        el.style.opacity = String(dekking);
        el.style.left = `${sx * 100}%`;
        el.style.top = `${sy * 100}%`;
        el.style.filter = `blur(${wazig.toFixed(2)}px)`;
        el.style.transform =
          `translate(-50%, -50%) scale(${schaal.toFixed(3)}) ` +
          `skewX(${(Math.sin(t * 0.9 + wo.tel) * 3 * (1 - bundelKracht)).toFixed(2)}deg)`;

        /* in de bundel verschijnt de schuilnaam in plaats van de echte naam */
        const gemaskeerd = bundelKracht > 0.45 && wo.masker;
        const wil = gemaskeerd ? wo.masker! : wo.tekst;
        if (el.dataset.nu !== wil) {
          el.dataset.nu = wil;
          el.textContent = wil;
        }
        el.style.color = gemaskeerd ? "#c8f5dd" : "#eafaf2";
        el.style.letterSpacing = gemaskeerd ? "0.04em" : "0em";
        /* een zachte gloed eromheen: onder water heeft licht geen harde rand,
           en het tilt de tekst los van het donkere groen */
        el.style.textShadow = `0 0 ${(14 * (1 - bundelKracht) + 6).toFixed(0)}px rgba(10,40,30,0.85)`;
      });

      if (kopRef.current) {
        kopRef.current.style.opacity = String(f.slot);
        kopRef.current.style.transform = `translateY(${(1 - f.slot) * 26}px)`;
      }
      if (hintRef.current) hintRef.current.style.opacity = String(f.hint);
      /* de oever komt pas aan het eind in beeld: hij is de overgang terug naar
         het lichte mintveld van de sectie hieronder */
      if (oeverRef.current) oeverRef.current.style.opacity = String(f.slot);
    };

    const bundelXVanMuis = (m: { wx: number; dist: number } | null) => (m ? m.wx : 0);

    const io = new IntersectionObserver(
      ([e]) => {
        inBeeld = e.isIntersecting;
        if (inBeeld) wek();
      },
      { rootMargin: "10% 0px" },
    );
    io.observe(sectie);

    const opScroll = () => wek();
    window.addEventListener("scroll", opScroll, { passive: true });

    /* één frame tekenen, ook bij reduced motion (dan blijft het stilstaan) */
    meetVoortgang();
    inBeeld = true;
    stap();
    inBeeld = false;

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", opScroll);
      sectie.removeEventListener("pointermove", opMuis);
      sectie.removeEventListener("pointerdown", opKlik);
    };
  }, []);

  return (
    <section ref={buiten} className="relative" style={{ height: "340vh" }} aria-label="Privacy">
      <div className="sticky top-0 h-screen overflow-hidden">
        <canvas ref={doek} className="absolute inset-0 h-full w-full" aria-hidden />

        {/* de woorden onder de oppervlakte */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {WOORDEN.map((w, i) => (
            <span
              key={w.tekst}
              ref={(r) => {
                woordRefs.current[i] = r;
              }}
              className={`absolute whitespace-nowrap text-3xl font-semibold opacity-0 will-change-[transform,opacity,filter] sm:text-4xl ${
                w.mobiel ? "" : "hidden sm:block"
              }`}
              style={{ fontFamily: "var(--font-hand)" }}
            >
              {w.tekst}
            </span>
          ))}
        </div>

        {/* de uitnodiging, alleen in het begin */}
        <p
          ref={hintRef}
          className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 text-center text-lg opacity-0 sm:text-xl"
          style={{ fontFamily: "var(--font-hand)", color: "#cfe9dc" }}
        >
          beweeg je muis over het water
        </p>

        {/* De oever: dezelfde golfvorm als de rest van de pagina, in de kleur
           van het mintveld waar de volgende sectie mee begint. Hij verschijnt
           pas in de laatste beat, zodat het water niet abrupt op een rand
           eindigt maar je er als het ware weer uit stapt. */}
        <div ref={oeverRef} className="pointer-events-none absolute inset-0 opacity-0" aria-hidden>
          <Golf kleur={MINT_LICHT} vorm="rust" hoogte="h-[70px] sm:h-[110px]" />
        </div>

        {/* de boodschap, helemaal aan het eind */}
        <div
          ref={kopRef}
          className="absolute inset-x-0 bottom-0 top-auto px-6 pb-[14vh] opacity-0 sm:pb-[16vh]"
        >
          <div className="mx-auto w-full max-w-4xl text-center">
            <p className="text-2xl" style={{ fontFamily: "var(--font-hand)", color: "#8fd9b4" }}>
              privacy voorop
            </p>
            <h2 className="mt-3 font-display text-[clamp(2.1rem,5.2vw,4.2rem)] font-black leading-[1.02] tracking-tight text-white [text-wrap:balance]">
              Er is één ding dat we bewust niet doen.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/75 sm:text-xl sm:leading-9">
              Gegevens van leerlingen bewaren we niet, en hun namen gaan nooit
              naar de AI. Op jouw apparaat wordt elke naam vervangen door een
              schuilnaam, nog vóór er iets wordt verstuurd.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

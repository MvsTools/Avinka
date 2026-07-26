"use client";

import { useEffect, useRef } from "react";
import { Golf, MINT_LICHT } from "./Wereld";

/* ── De privacysectie: onder de oppervlakte ────────────────────────────────
   Eén filmisch moment in plaats van een uitlegblok met kaartjes. De belofte
   wordt niet verteld maar voorgedaan.

   DE CAMERA IS HET HELE VERSCHIL. De eerste versie zette je op een boot die
   naar een verre horizon keek: alles gebeurde ver weg en klein, en een leeg
   vlak met een harde horizon leest als CGI. Nu duik je er middenin. Je zakt
   door het oppervlak heen, dat wordt een plafond bóven je, en vanaf dat
   moment hang je in de waterkolom met de dingen op armlengte.

   DE MECHANIEK IS DE SCROLL, NIET DE MUIS. In de eerste versie volgde de
   lichtbundel je cursor, waardoor wie gewoon doorscrolde het belangrijkste
   moment nooit zag. Nu veegt een lichtbundel op je scrollpositie door het
   water: waar hij overheen trekt licht een woord op, en zodra hij verder is
   valt het terug in het donker. Je hoeft niet uit te leggen dat informatie
   alleen zichtbaar is als er licht op valt — je ziet het gebeuren.

   De beats, met links een kolom die per beat één zin toont:
     intro   de zon op het oppervlak — het scharnier met het lichte papier
     duik    je zakt erdoorheen, het oppervlak wordt een plafond
     01      de bundel veegt: wat je invult, blijft bij jou
     02      dezelfde veeg, maar nu klappen de namen om naar schuilnamen
     03      de bundels doven, alles lost op
     slot    één zin in het donker

   ⚠️ Beat 02 wijkt bewust af van de referentie-storyboard. Daar was het
   "zichtbaar voor de juiste mensen", een verhaal over rollen en rechten. Dat
   is niet wat Avinka doet: namen gaan nooit mee, ze worden op het apparaat
   zelf vervangen. De sectie mag geen belofte tonen die we niet waarmaken.

   Waarom dit als foto oogt en niet als tekening — vier dingen die niets met
   golven te maken hebben:
     1. KLEURABSORPTIE. Water eet eerst rood, dan oranje. Die verschuiving
        met de diepte is dé aanwijzing dat je naar water kijkt.
     2. SNELL'S WINDOW. Van onderaf zie je de hele lucht samengeperst in een
        kegel van 48,6°; daarbuiten spiegelt het oppervlak de donkere diepte.
        Dat is de meest herkenbare vorm van onderwaterfotografie die er is.
     3. GODRAYS met de rimpeling van het oppervlak erin flikkerend, opgeteld
        langs de kijkstraal (echt volumetrisch, geen geschilderde streep).
     4. SCHERPTEDIEPTE op de zwevende deeltjes. Een camera die niet alles
        scherp heeft, leest onmiddellijk als een echte camera.  ─────────── */

/* GLSL ES kent geen impliciete int-naar-float: een `2` uit JS zou hier een
   compileerfout geven. Daarom alles via toFixed. */
const glf = (n: number) => n.toFixed(4);

/* ── De camera ──
   Gedeeld door shader en DOM. Zonder dat die twee exact hetzelfde rekenen,
   hangen de woorden niet ín het water maar erboven. */
const FOCUS = 0.85; // brandpuntsafstand; hoger = smallere kijkhoek
const DUIK_DIEPTE = -1.75; // waar de camera onder water uitkomt

/* De camera KANTELT tijdens de duik. Boven water kijk je iets omlaag, zodat
   de horizon hoog staat en je vooral water ziet. Onder water kantelt hij
   omhoog naar het oppervlak — en dat is nodig ook: Snell's window begint pas
   bij 48,6° van recht omhoog, dus met een horizontale blik zie je het nooit
   en houd je alleen een grauwe band over. Het meekantelen is bovendien wat
   de duik filmisch maakt: je kijkt terug naar het licht waar je vandaan komt. */
const PITCH_BOVEN = 0.17;
const PITCH_ONDER = -0.32;

function rotX(y: number, z: number, a: number) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { y: y * c - z * s, z: y * s + z * c };
}

/* Wereldpunt -> schermpositie (0..1), plus de afstand tot de camera. */
function naarScherm(
  wx: number,
  wy: number,
  wz: number,
  camY: number,
  pitch: number,
  aspect: number,
) {
  const r = rotX(wy - camY, wz, -pitch);
  if (r.z <= 0.05) return null;
  const uvx = (FOCUS * wx) / r.z;
  const uvy = (FOCUS * r.y) / r.z;
  return {
    sx: 0.5 + uvx / aspect,
    sy: 0.5 - uvy,
    afstand: Math.hypot(wx, r.y, r.z),
  };
}

/* ── Wat er in het water hangt ──
   Voornamen krijgen in de tweede veeg een schuilnaam; gegevenssoorten lossen
   daar gewoon op. De posities staan bewust uit elkaar in x, want de bundel
   veegt van links naar rechts en moet ze één voor één aandoen. */
type Woord = {
  tekst: string;
  masker?: string;
  wx: number;
  wy: number;
  wz: number;
  /* Op een smal scherm past maar de helft: anders vallen ze over elkaar en
     is er niets meer te lezen. */
  mobiel?: boolean;
};

const WOORDEN: Woord[] = [
  { tekst: "Sofie", masker: "leerling A", wx: -4.6, wy: -1.6, wz: 5.2, mobiel: true },
  { tekst: "toetsresultaten", wx: -3.5, wy: -3.4, wz: 6.8 },
  { tekst: "Daan", masker: "leerling B", wx: -2.4, wy: -0.9, wz: 4.4, mobiel: true },
  { tekst: "gespreksverslag", wx: -1.5, wy: -3.9, wz: 7.6, mobiel: true },
  { tekst: "Iris", masker: "leerling C", wx: -0.5, wy: -2.1, wz: 5.0, mobiel: true },
  { tekst: "rapportcijfers", wx: 0.6, wy: -4.3, wz: 8.4 },
  { tekst: "Mees", masker: "leerling D", wx: 1.6, wy: -1.3, wz: 4.8, mobiel: true },
  { tekst: "leerlingnummer", wx: 2.6, wy: -3.6, wz: 7.0, mobiel: true },
  { tekst: "Noor", masker: "leerling E", wx: 3.6, wy: -2.4, wz: 5.6, mobiel: true },
  { tekst: "absenties", wx: 4.6, wy: -4.0, wz: 8.0 },
  { tekst: "Yassin", masker: "leerling F", wx: 5.4, wy: -1.5, wz: 6.2 },
];

/* Zwevende deeltjes. Ze doen twee dingen tegelijk: ze maken het water zicht-
   baar (zonder iets in het water is er geen water) en ze leveren de scherpte-
   diepte, want de dichtstbijzijnde staan onscherp. */
const DEELTJES = Array.from({ length: 34 }, (_, i) => {
  const g = (n: number, m: number) => ((i * n) % m) / m;
  return {
    wx: -7 + g(37, 29) * 14,
    wy: -0.4 - g(53, 31) * 4.6,
    wz: 2.6 + g(71, 23) * 8.5,
    tempo: 0.5 + g(29, 17) * 1.1,
    fase: g(43, 19) * 6.28,
  };
});

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2  uRes;
uniform float uTijd;
uniform float uCamY;    // camerahoogte: + boven water, - eronder
uniform float uVeeg;    // wereld-x van de hoofdbundel
uniform float uBundels; // sterkte van de bundels
uniform float uDoezel;  // de troebele flits op het moment dat je erdoorheen gaat
uniform float uKalm;    // het water valt stil en sluit zich
uniform float uPitch;   // de camera kantelt omhoog tijdens de duik
uniform float uRustig;  // prefers-reduced-motion

const float FOCUS = ${glf(FOCUS)};

/* De zon staat laag en net rechts van het midden — dezelfde hoek als het
   licht op de rest van de pagina, zodat het één ruimte blijft. */
const float ZON_X = 0.62;
const vec3  ZON_KLEUR = vec3(1.0, 0.94, 0.78);
const vec3  PAPIER = vec3(0.988, 0.984, 0.969); // #fcfbf7, de pagina erboven

/* Onderwaterkleuren. Het verloop van ondiep naar diep is precies de
   absorptie: het warme licht verdwijnt als eerste. */
const vec3 ONDIEP = vec3(0.13, 0.40, 0.30);
const vec3 DIEP   = vec3(0.020, 0.110, 0.104);
const vec3 AFGROND= vec3(0.006, 0.045, 0.055);

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

/* Golfhoogte met domain warping. Optellende sinussen geven altijd een
   zichtbaar geweven raster — twee gekruiste sinussen zijn nu eenmaal
   ruitjes. Door het meetpunt eerst zélf te verschuiven met een tragere ruis
   kan er per definitie geen patroon ontstaan. */
float golfhoogte(vec2 p, float t) {
  vec2 warp = vec2(
    ruis(p * 0.30 + vec2(t * 0.05, 0.0)),
    ruis(p * 0.30 + vec2(0.0, t * 0.042) + 19.7)
  );
  vec2 q = p * 2.9 + warp * 1.05;
  float h = 0.0;
  float amp = 0.52;
  float freq = 1.0;
  mat2 draai = mat2(0.864, -0.504, 0.504, 0.864);
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    h += ruis(q * freq + vec2(t * (0.22 + fi * 0.10), -t * (0.15 + fi * 0.07))) * amp;
    q = draai * q;
    freq *= 2.07;
    amp *= 0.50;
  }
  return h;
}

/* Caustics: het dansende lichtnet. Geribbelde ruis (1 - |ruis|) tot een hoge
   macht geeft precies die dunne heldere aders met donker ertussen. */
float caustic(vec2 p, float t) {
  float c = 0.0;
  float amp = 1.0;
  for (int i = 0; i < 2; i++) {
    float fi = float(i);
    float n = ruis(p * (1.0 + fi * 2.4) + vec2(t * 0.24, -t * 0.19) * (1.0 + fi));
    c += (1.0 - abs(n)) * amp;
    amp *= 0.62;
  }
  return pow(clamp(c / 1.62, 0.0, 1.0), 4.5);
}

vec3 draaiX(vec3 v, float a) {
  float c = cos(a), s = sin(a);
  return vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c);
}

/* De lucht zoals je hem van bovenaf ziet: loopt bovenin door in het papier
   van de pagina en verhit naar de horizon toe tot goud, met de zon erin. */
vec3 luchtKleur(vec3 D) {
  float f = clamp(1.0 - D.y * 2.6, 0.0, 1.0); // 1 aan de horizon, 0 recht omhoog
  vec3 k = mix(PAPIER, vec3(1.0, 0.90, 0.66), pow(f, 1.5));
  float dx = (D.x - (ZON_X - 0.5) * 1.6) * 2.0;
  float dy = D.y * 4.0;
  float gloed = exp(-(dx * dx + dy * dy) * 2.6);
  k = mix(k, vec3(1.0), clamp(gloed * 1.3, 0.0, 1.0));
  return k;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTijd * (1.0 - uRustig * 0.98);

  vec3 D = normalize(vec3(uv.x, uv.y, FOCUS));
  D = draaiX(D, uPitch);

  /* de zon als ver licht, laag boven de horizon */
  vec3 L = normalize(vec3((ZON_X - 0.5) * 2.2, 0.34, 1.0));

  vec3 kleur;

  if (uCamY > 0.0) {
    /* ══ BOVEN WATER ══ */
    if (D.y >= -0.002) {
      kleur = luchtKleur(D);
    } else {
      float afstand = uCamY / (-D.y);
      vec2 P = vec2(D.x * afstand, D.z * afstand);
      float demping = 1.0 / (1.0 + afstand * afstand * 0.055);
      float e = 0.02 * max(1.0, afstand * 0.8);
      float h0 = golfhoogte(P, t);
      float hx = golfhoogte(P + vec2(e, 0.0), t);
      float hz = golfhoogte(P + vec2(0.0, e), t);
      float amp = 0.055 * demping;
      vec3 N = normalize(vec3(-(hx - h0) / e * amp, 1.0, -(hz - h0) / e * amp));
      vec3 V = -D;
      vec3 Hv = normalize(V + L);
      float basis = max(dot(N, Hv), 0.0);
      float spec = pow(basis, 340.0) * 2.4 + pow(basis, 70.0) * 0.34 + pow(basis, 16.0) * 0.13;
      float fres = clamp(pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.0), 0.03, 1.0);
      vec3 spiegel = mix(vec3(0.62, 0.66, 0.56), vec3(1.0, 0.92, 0.75), 0.45);
      kleur = mix(DIEP, ONDIEP, clamp(1.0 - afstand * 0.12, 0.0, 1.0));
      kleur = mix(kleur, spiegel, fres * 0.5);
      kleur += ZON_KLEUR * spec * (0.4 + 0.6 * exp(-afstand * 0.05));
    }
  } else {
    /* ══ ONDER WATER ══ */
    float diepte = -uCamY;

    if (D.y > 0.004) {
      /* de straal gaat omhoog en raakt het oppervlak van onderaf */
      float afstand = diepte / D.y;
      vec2 P = vec2(D.x * afstand, D.z * afstand);
      float e = 0.05;
      float h0 = golfhoogte(P * 0.7, t);
      float hx = golfhoogte(P * 0.7 + vec2(e, 0.0), t);
      float hz = golfhoogte(P * 0.7 + vec2(0.0, e), t);
      /* de rimpeling verstoort de hoek waaronder je naar buiten kijkt: dát
         laat de rand van Snell's window golven, en dat is het detail waaraan
         je onderwaterbeelden herkent */
      float golving = 0.16 / (1.0 + afstand * 0.25);
      vec3 Dv = normalize(D + vec3((hx - h0) / e, 0.0, (hz - h0) / e) * golving);

      /* Snell's window: binnen 48,6° van recht omhoog zie je de lucht,
         daarbuiten spiegelt het oppervlak de diepte terug */
      float hoek = acos(clamp(Dv.y, 0.0, 1.0));
      float raam = smoothstep(1.20, 0.52, hoek);

      /* de lucht samengeperst in die kegel */
      vec3 buiten = luchtKleur(normalize(vec3(Dv.x * 1.9, max(Dv.y, 0.05) * 0.55 + 0.10, Dv.z * 1.9)));
      /* het licht van de zon dat door het raam breekt */
      float zonBreking = pow(max(dot(Dv, L), 0.0), 90.0);
      buiten += ZON_KLEUR * zonBreking * 2.2;

      vec3 spiegeling = mix(DIEP, AFGROND, clamp(afstand * 0.05, 0.0, 1.0));
      /* onder de spiegelende rand danst het caustic-net mee */
      spiegeling += vec3(0.10, 0.30, 0.26) * caustic(P * 0.55, t) * 0.5;

      kleur = mix(spiegeling, buiten, raam);
      /* Absorptie: hoe verder door het water, hoe meer er wegvalt. Stond op
         0.13 en dat vrat vrijwel het hele beeld op — klopt natuurkundig maar
         levert een zwarte brij. 0.075 houdt de diepte zichtbaar. */
      kleur = mix(kleur, DIEP, clamp(1.0 - exp(-afstand * 0.075), 0.0, 1.0));
    } else {
      /* de straal gaat naar beneden: alleen nog diepte */
      float val = clamp(-D.y * 2.2, 0.0, 1.0);
      kleur = mix(DIEP, AFGROND, val);
    }

    /* Verstrooiing: water gloeit zelf, want elk deeltje erin kaatst licht van
       boven terug. Zonder dit is de kolom een zwart gat en zie je geen water
       maar leegte. */
    kleur += ONDIEP * 0.17 * exp(uCamY * 0.30) * (0.45 + 0.55 * smoothstep(-0.5, 0.6, D.y));

    /* ── de lichtbundels ──
       Echt volumetrisch: we lopen de kijkstraal af en tellen op hoeveel licht
       er op elk punt naar binnen valt. Waar het licht het oppervlak passeert
       staat het caustic-net, dus de bundels flikkeren vanzelf mee met de
       golven in plaats van dat het geschilderde strepen worden. */
    float straal = 0.0;
    for (int i = 0; i < 10; i++) {
      float s = (float(i) + 0.5) / 10.0;
      float afst = s * s * 15.0; // dichterbij fijner bemonsteren
      vec3 Q = vec3(D.x * afst, uCamY + D.y * afst, D.z * afst);
      if (Q.y < 0.0 && Q.y > -7.0) {
        /* waar kwam dit licht het water binnen? */
        vec2 intree = vec2(Q.x, Q.z) + vec2(L.x, L.z) * (-Q.y) / L.y;
        float c = caustic(intree * 0.42, t);
        /* de hoofdbundel: een brede kolom die met je scroll opzij veegt */
        float hoofd = exp(-pow((Q.x - uVeeg) / 0.95, 2.0));
        float bijdrage = c * (0.16 + hoofd * 2.2);
        /* dieper = zwakker, en verder weg = uitgedoofd door het water zelf */
        bijdrage *= exp(Q.y * 0.42) * exp(-afst * 0.11);
        straal += bijdrage;
      }
    }
    straal *= uBundels * 0.40;
    /* Filmische rolloff. Zonder dit brandt de bundel bij elke tuning vroeg of
       laat uit tot wit — en dan is de tekst eroverheen onleesbaar. Zo loopt
       hij altijd zacht naar zijn maximum toe, hoe fel de bron ook staat. */
    straal = straal / (1.0 + straal);
    /* schuin omhoog kijkend zie je de bundels het langst: daar val je met de
       blik langs de kolom mee in plaats van er dwars doorheen */
    straal *= 0.55 + 0.45 * smoothstep(-0.3, 0.5, D.y);
    kleur += vec3(0.66, 0.98, 0.72) * straal;
  }

  /* ── het moment dat je erdoorheen gaat ──
     Vlak bij de waterlijn wordt het beeld troebel en licht: schuim, belletjes
     en een lens die even niets scherp krijgt. Dat is precies wat een echte
     camera doet, en het dekt meteen het rekenkundig lelijke moment af waarop
     de camera exact op het wateroppervlak staat. */
  if (uDoezel > 0.001) {
    float schuim = caustic(uv * 5.5 + vec2(0.0, t * 0.6), t * 2.0);
    float belletjes = pow(max(0.0, ruis(uv * 22.0 + vec2(t * 1.4, -t * 2.1))), 2.0);
    vec3 troebel = mix(vec3(0.72, 0.88, 0.82), vec3(1.0, 0.98, 0.92), schuim);
    kleur = mix(kleur, troebel + belletjes * 0.35, uDoezel);
  }

  /* het water sluit zich weer aan het eind */
  kleur = mix(kleur, AFGROND, uKalm * 0.62);

  /* filmkorrel: het laatste zetje van render naar opname */
  float korrel = (hash(gl_FragCoord.xy + fract(t) * 91.7) - 0.5) * 0.030;
  kleur += korrel;

  /* vignet */
  float vig = 1.0 - 0.30 * dot(uv, uv);
  kleur *= vig;

  gl_FragColor = vec4(kleur, 1.0);
}
`;

/* ── De choreografie ──
   Alles hangt aan de scrollpositie, niets aan de muis. */
function fasen(p: number) {
  const tussen = (a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));
  const duik = tussen(0.14, 0.30);
  /* de camera zakt van boven het water naar de kolom eronder, en kantelt
     onderweg omhoog naar het licht waar hij vandaan komt */
  const camY = 0.85 + (DUIK_DIEPTE - 0.85) * duik;
  const pitch = PITCH_BOVEN + (PITCH_ONDER - PITCH_BOVEN) * duik;
  /* de troebele flits precies rond de waterlijn */
  const bijLijn = Math.max(0, 1 - Math.abs(camY) / 0.55);

  /* twee vegen: de eerste laat zien wat er ligt, de tweede wat er weggaat */
  const veeg1 = tussen(0.32, 0.52);
  const veeg2 = tussen(0.56, 0.78);
  const tweede = veeg2 > 0;
  const veeg = -7.5 + (tweede ? veeg2 : veeg1) * 15;

  /* de bundel dooft tussen de twee vegen door, zodat het terugspringen naar
     links onzichtbaar blijft */
  const bundels =
    Math.min(1, tussen(0.30, 0.35) - tussen(0.50, 0.545) + tussen(0.555, 0.60)) *
    (1 - tussen(0.78, 0.88));

  return {
    camY,
    pitch,
    duik,
    doezel: bijLijn * 0.92,
    veeg,
    bundels: Math.max(0, bundels),
    maskeer: p > 0.545,
    kalm: tussen(0.80, 0.93),
    /* welke zin er links staat */
    intro: 1 - tussen(0.16, 0.26),
    beat1: tussen(0.30, 0.36) * (1 - tussen(0.50, 0.56)),
    beat2: tussen(0.56, 0.62) * (1 - tussen(0.74, 0.80)),
    beat3: tussen(0.78, 0.84) * (1 - tussen(0.86, 0.90)),
    slot: tussen(0.88, 0.96),
    /* de oever waarmee we weer naar het licht gaan */
    oever: tussen(0.90, 0.99),
  };
}

const BEATS = [
  { nr: "01", zin: "Wat je invult, blijft bij jou." },
  { nr: "02", zin: "En wat er weggaat, is gemaskeerd." },
  { nr: "03", zin: "Daarna is het weg. Wij bewaren het niet." },
];

export function WereldWater() {
  const buiten = useRef<HTMLDivElement>(null);
  const doek = useRef<HTMLCanvasElement>(null);
  const woordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const stofRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const introRef = useRef<HTMLDivElement>(null);
  const beatRefs = useRef<Array<HTMLDivElement | null>>([]);
  const slotRef = useRef<HTMLDivElement>(null);
  const oeverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = doek.current;
    const sectie = buiten.current;
    if (!canvas || !sectie) return;

    const rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) {
      canvas.style.background =
        "linear-gradient(#fcfbf7 0%, #ffe9bd 22%, #0d3b31 34%, #02090c 100%)";
      return;
    }

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
      camY: gl.getUniformLocation(prog, "uCamY"),
      veeg: gl.getUniformLocation(prog, "uVeeg"),
      bundels: gl.getUniformLocation(prog, "uBundels"),
      doezel: gl.getUniformLocation(prog, "uDoezel"),
      kalm: gl.getUniformLocation(prog, "uKalm"),
      pitch: gl.getUniformLocation(prog, "uPitch"),
      rustig: gl.getUniformLocation(prog, "uRustig"),
    };
    gl.uniform1f(u.rustig, rustig ? 1 : 0);

    /* De volumetrische bundels kosten tien monsters per pixel. Ze zijn zacht,
       dus we tekenen bewust onder schermresolutie en laten de browser
       opschalen — dat scheelt ruim de helft van het werk en je ziet het niet. */
    let aspect = 1;
    const meet = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * 0.7;
      const r = canvas.getBoundingClientRect();
      aspect = r.width / Math.max(1, r.height);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, canvas.width, canvas.height);
    };
    meet();
    const ro = new ResizeObserver(meet);
    ro.observe(canvas);

    const start = performance.now();
    const klok = () => (performance.now() - start) / 1000;

    let voortgang = 0;
    const meetVoortgang = () => {
      const r = sectie.getBoundingClientRect();
      const loop = r.height - window.innerHeight;
      voortgang = loop <= 0 ? 0 : Math.min(1, Math.max(0, -r.top / loop));
    };

    /* ── de woorden en het stof ──
       Ze staan als gewone DOM in het water: scherp, selecteerbaar en met een
       echte blur voor de scherptediepte. Hun plek komt uit precies dezelfde
       cameraberekening als de shader. */
    const tekenLagen = (t: number, f: ReturnType<typeof fasen>) => {
      WOORDEN.forEach((wo, i) => {
        const el = woordRefs.current[i];
        if (!el) return;
        /* traag meedrijven met de stroming */
        const drift = Math.sin(t * 0.18 + i * 1.7) * 0.16;
        const pos = naarScherm(wo.wx + drift, wo.wy, wo.wz, f.camY, f.pitch, aspect);
        if (!pos || pos.sx < -0.3 || pos.sx > 1.3 || pos.sy < -0.2 || pos.sy > 1.2) {
          el.style.opacity = "0";
          return;
        }

        /* Hoeveel licht valt er op dit woord? Exact dezelfde bundelvorm als
           in de shader, dus wat je ziet oplichten klopt met waar het licht
           daadwerkelijk staat. */
        const inBundel = Math.exp(-Math.pow((wo.wx + drift - f.veeg) / 0.95, 2));
        const licht = inBundel * f.bundels;

        /* Alleen belicht is leesbaar; daarbuiten zakt het terug. Maar het
           water is licht, dus een onbelicht woord verdwijnt niet in het zwart
           — het wordt juist een donkere schim. Dat is ook fysiek kloppend:
           zonder licht erop zie je alleen een silhouet. */
        const dekking = Math.max(0, Math.min(1, 0.28 + licht * 1.4));
        const wazig = (1 - Math.min(1, licht * 1.5)) * 4.5 + 0.4;

        /* schaal volgt het perspectief */
        const schaal = Math.max(0.34, 5.0 / pos.afstand);

        el.style.opacity = String(dekking * (1 - f.kalm));
        el.style.left = `${pos.sx * 100}%`;
        el.style.top = `${pos.sy * 100}%`;
        el.style.filter = `blur(${wazig.toFixed(2)}px)`;
        el.style.transform = `translate(-50%, -50%) scale(${schaal.toFixed(3)})`;

        /* in de tweede veeg klapt de naam om naar de schuilnaam */
        const gemaskeerd = f.maskeer && !!wo.masker && licht > 0.12;
        const wil = gemaskeerd ? wo.masker! : wo.tekst;
        if (el.dataset.nu !== wil) {
          el.dataset.nu = wil;
          el.textContent = wil;
        }
        /* onbelicht = donkere schim tegen het lichte water, belicht = helder
           en warm, alsof de bundel hem echt aanstraalt */
        const helderheid = Math.min(1, licht * 1.5);
        el.style.color = gemaskeerd
          ? `color-mix(in srgb, #06231d ${(100 - helderheid * 100).toFixed(0)}%, #ccffe6)`
          : `color-mix(in srgb, #06231d ${(100 - helderheid * 100).toFixed(0)}%, #ffffff)`;
        el.style.textShadow = `0 0 ${(10 + helderheid * 26).toFixed(0)}px rgba(120,255,214,${(helderheid * 0.55).toFixed(2)})`;
      });

      DEELTJES.forEach((d, i) => {
        const el = stofRefs.current[i];
        if (!el) return;
        /* stof zweeft langzaam omhoog en dwarrelt een beetje */
        const op = ((t * 0.05 * d.tempo + d.fase) % 1) * 4.4;
        const wy = d.wy + op - 2.2;
        const wx = d.wx + Math.sin(t * 0.22 * d.tempo + d.fase) * 0.35;
        const pos = naarScherm(wx, wy, d.wz, f.camY, f.pitch, aspect);
        if (!pos || pos.sx < -0.1 || pos.sx > 1.1 || pos.sy < -0.1 || pos.sy > 1.1) {
          el.style.opacity = "0";
          return;
        }
        const inBundel = Math.exp(-Math.pow((wx - f.veeg) / 1.6, 2));
        /* stof is er altijd, maar licht pas echt op in de bundel */
        const helder = 0.1 + inBundel * f.bundels * 0.85;
        /* scherptediepte: dichtbij onscherp, dat verraadt een echte lens */
        const onscherp = Math.max(0, (5.2 - pos.afstand) * 0.75);
        const maat = Math.max(1.2, 9 / pos.afstand);
        el.style.opacity = String(helder * (1 - f.duik * 0.0) * (1 - f.kalm) * 0.9);
        el.style.left = `${pos.sx * 100}%`;
        el.style.top = `${pos.sy * 100}%`;
        el.style.width = `${maat.toFixed(1)}px`;
        el.style.height = `${maat.toFixed(1)}px`;
        el.style.filter = `blur(${onscherp.toFixed(2)}px)`;
      });

      const zet = (el: HTMLElement | null, v: number, y = 18) => {
        if (!el) return;
        el.style.opacity = String(v);
        el.style.transform = `translateY(${((1 - v) * y).toFixed(1)}px)`;
      };
      zet(introRef.current, f.intro);
      beatRefs.current.forEach((el, i) =>
        zet(el, [f.beat1, f.beat2, f.beat3][i] ?? 0),
      );
      zet(slotRef.current, f.slot);
      if (oeverRef.current) oeverRef.current.style.opacity = String(f.oever);
    };

    let raf = 0;
    let inBeeld = false;
    const stap = () => {
      raf = 0;
      meetVoortgang();
      const f = fasen(voortgang);
      const t = klok();

      gl.uniform1f(u.tijd, t);
      gl.uniform1f(u.camY, f.camY);
      gl.uniform1f(u.veeg, f.veeg);
      gl.uniform1f(u.bundels, f.bundels);
      gl.uniform1f(u.doezel, f.doezel);
      gl.uniform1f(u.kalm, f.kalm);
      gl.uniform1f(u.pitch, f.pitch);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      tekenLagen(t, f);

      if (inBeeld && !rustig) raf = requestAnimationFrame(stap);
    };
    const wek = () => {
      if (!raf && inBeeld) raf = requestAnimationFrame(stap);
    };

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

    /* één frame tekenen, ook bij reduced motion */
    meetVoortgang();
    inBeeld = true;
    stap();
    inBeeld = false;

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", opScroll);
    };
  }, []);

  return (
    <section ref={buiten} className="relative" style={{ height: "420vh" }} aria-label="Privacy">
      <div className="sticky top-0 h-screen overflow-hidden">
        <canvas ref={doek} className="absolute inset-0 h-full w-full" aria-hidden />

        {/* het stof in het water */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {DEELTJES.map((_, i) => (
            <span
              key={i}
              ref={(r) => {
                stofRefs.current[i] = r;
              }}
              className="absolute rounded-full bg-[#d8fbee] opacity-0"
              style={{ transform: "translate(-50%, -50%)" }}
            />
          ))}
        </div>

        {/* de woorden die in het water hangen */}
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

        {/* ── De tekstkolom, links, in het water ──
           Per beat één zin, zodat er nooit een moment is waarop je wel iets
           moois ziet maar niet weet wat het betekent. Alles staat op dezelfde
           plek: het is één stem die doorpraat, geen losse blokjes. */}
        <div className="pointer-events-none absolute inset-0">
          {/* Een zachte schaduw aan de linkerkant. Het water is levend en soms
             fel — zonder dit hangt de leesbaarheid van de kop af van waar de
             lichtbundel toevallig staat, en dat is geen ontwerp maar geluk. */}
          <div
            className="absolute inset-y-0 left-0 w-full sm:w-3/5"
            style={{
              background:
                "linear-gradient(to right, rgba(2,20,16,0.72) 0%, rgba(2,20,16,0.5) 38%, rgba(2,20,16,0) 100%)",
            }}
            aria-hidden
          />
          <div className="relative mx-auto flex h-full w-full max-w-6xl items-center px-6">
            <div className="relative w-full max-w-md sm:max-w-lg">
              <div ref={introRef} className="absolute inset-x-0 top-1/2 -translate-y-1/2">
                <p className="text-2xl" style={{ fontFamily: "var(--font-hand)", color: "#8fd9b4" }}>
                  privacy voorop
                </p>
                <h2 className="mt-3 font-display text-[clamp(2rem,4.4vw,3.5rem)] font-black leading-[1.03] tracking-tight text-white [text-wrap:balance]">
                  Er is één ding dat we bewust niet doen.
                </h2>
              </div>

              {BEATS.map((b, i) => (
                <div
                  key={b.nr}
                  ref={(r) => {
                    beatRefs.current[i] = r;
                  }}
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-0"
                >
                  <p className="font-display text-sm font-black tracking-[0.3em]" style={{ color: "#6fcfa2" }}>
                    {b.nr}
                  </p>
                  <p className="mt-3 font-display text-[clamp(1.6rem,3.4vw,2.6rem)] font-black leading-[1.08] tracking-tight text-white [text-wrap:balance]">
                    {b.zin}
                  </p>
                </div>
              ))}

              <div ref={slotRef} className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-0">
                <p className="font-display text-[clamp(1.7rem,3.6vw,2.8rem)] font-black leading-[1.08] tracking-tight text-white [text-wrap:balance]">
                  Namen blijven thuis.
                </p>
                <p className="mt-5 text-lg leading-8 text-white/70">
                  Op jouw apparaat wordt elke naam vervangen door een schuilnaam,
                  nog vóór er iets wordt verstuurd. Gegevens van leerlingen
                  bewaren we niet.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* de oever: de overgang terug naar het lichte mintveld eronder */}
        <div ref={oeverRef} className="pointer-events-none absolute inset-0 opacity-0" aria-hidden>
          <Golf kleur={MINT_LICHT} vorm="rust" hoogte="h-[70px] sm:h-[110px]" />
        </div>
      </div>
    </section>
  );
}

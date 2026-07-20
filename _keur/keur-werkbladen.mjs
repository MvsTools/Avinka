/* ───────────────────────────────────────────────────────────────────────────
   COLLEGA 1 — De Werkblad-keurder  (gratis, GEEN AI-call)

   Rendert elke werkbladmodule op ECHTE A4 (via public/avinka-werkblad.js, de
   motor van de tool zelf), op alle drie de lengtes (kort/middel/lang), en checkt:
     • GROOTTE    — hoeveel A4-kantjes? (een werkblad hoort ~max 2 kantjes)
     • TE BREED   — steekt er iets buiten de paginabreedte? (uitlijning)
     • KAPOT      — render-fout, JS-fout of leeg blad
     • SPELLING   — mogelijke spelfouten in de VASTE opdracht-teksten
                    (tegen OpenTaal + scripts/woordbank/toegestaan.txt; advies)

   Van elk gemarkeerd blad komt een screenshot in _keur/uit/, plus een
   overzicht in _keur/uit/rapport.html dat je gewoon in je browser opent.

   Draaien:  npm run keur        (of: node _keur/keur-werkbladen.mjs)
   Instelbaar: KEUR_MAX (max kantjes, standaard 2), KEUR_LENGTES=kort,middel,groot
   Bron van de modules + lengte-logica: public/werkblad-preview.html (één bron).
   ─────────────────────────────────────────────────────────────────────────── */
import { chromium } from "playwright";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HIER = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HIER, "..");
const UIT = join(HIER, "uit");
mkdirSync(UIT, { recursive: true });

// ── A4-maten (printbaar gebied bij 9mm marge) ───────────────────────────────
const PX_PER_MM = 96 / 25.4;
const A4_BREED_MM = 210 - 2 * 9;      // 192 mm
const A4_HOOG_MM = 297 - 2 * 9;       // 279 mm per kantje
const VIEWPORT_BREED = Math.round(A4_BREED_MM * PX_PER_MM); // ≈ 726 px
const MAX_KANTJES = Number(process.env.KEUR_MAX ?? 2);
const LENGTES = (process.env.KEUR_LENGTES || "kort,middel,groot").split(",").map((s) => s.trim());
const SHOT = new Set((process.env.KEUR_SHOT || "").split(",").map((s) => s.trim()).filter(Boolean)); // altijd screenshotten

// ── Uit de preview: CATS + de lengte-logica (pasLengte/ITEMS) ────────────────
const PREVIEW = readFileSync(join(ROOT, "public", "werkblad-preview.html"), "utf8");

function knip(bron, van, tot) {
  const s = bron.indexOf(van);
  if (s < 0) throw new Error(`Kon '${van}' niet vinden in werkblad-preview.html`);
  const e = bron.indexOf(tot, s);
  return bron.slice(s, e < 0 ? undefined : e);
}
function catsLiteral() {
  const s = PREVIEW.indexOf("var CATS =");
  const open = PREVIEW.indexOf("[", s);
  let diepte = 0, i = open, q = null;
  for (; i < PREVIEW.length; i++) {
    const c = PREVIEW[i];
    if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; }
    if (c === "'" || c === '"') q = c;
    else if (c === "[") diepte++;
    else if (c === "]") { if (--diepte === 0) { i++; break; } }
  }
  return PREVIEW.slice(open, i);
}
// De lengte-schaal-logica letterlijk overnemen (blijft gelijk aan de preview):
const LENGTE_LOGICA = knip(PREVIEW, "var IDX = {", "// Goedgekeurde");

function pakModules(cats) {
  const uit = [];
  for (const c of cats) for (const t of c[3]) uit.push({ num: t[0], key: t[1], naam: t[2], cat: c[0] });
  return uit;
}

// ── Spelling: woordenboek + toegestaan-lijst laden (mag ontbreken) ──────────
function laadWoordenboek() {
  const p = join(ROOT, "scripts", "woordbank", "_bron", "opentaal-wordlist.txt");
  if (!existsSync(p)) return null;
  const set = new Set(readFileSync(p, "utf8").split("\n").map((w) => w.trim().toLowerCase()).filter(Boolean));
  const extra = join(ROOT, "scripts", "woordbank", "toegestaan.txt");
  if (existsSync(extra)) for (const r of readFileSync(extra, "utf8").split("\n")) {
    const w = r.trim().toLowerCase(); if (w && !w.startsWith("#")) set.add(w);
  }
  // Eigen/merk- en werkbladtermen die terecht op een blad mogen staan
  for (const w of ["avinka", "antwoordblad", "smiley", "smileys", "kruis", "husselen", "rijmwoord", "rijmwoorden", "lidwoord", "getallenlijn", "rekenmuurtje", "splitshuis", "tafelkaart", "maaltafel", "buurgetallen", "plaatswaarde", "kommagetallen", "kommagetal", "romeinse", "staafdiagram", "sudoku", "doolhof", "bingokaart", "geheimschrift", "anagram", "alfabetiseren", "klankgroepen", "lettertegels", "woordslang", "woordtrap", "pyramidewoord", "weetwoord", "regelwoord", "voltooid", "grondwoord", "woordfamilie", "synoniemen", "antoniemen", "tegenstellingen"]) set.add(w);
  return set;
}
const WB = laadWoordenboek();
function spelfouten(tekst) {
  if (!WB || !tekst) return [];
  const uit = [];
  for (let tok of String(tekst).toLowerCase().split(/[^a-zà-öø-ÿ']+/)) {
    tok = tok.replace(/^'+|'+$/g, "");
    if (tok.length < 3) continue;
    if (!WB.has(tok)) uit.push(tok);
  }
  return [...new Set(uit)];
}

// ── Browser opzetten ─────────────────────────────────────────────────────────
const cats = eval("(" + catsLiteral() + ")");
const modules = pakModules(cats);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: VIEWPORT_BREED, height: 1400 } });
const jsFouten = [];
page.on("pageerror", (e) => jsFouten.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") jsFouten.push(m.text()); });

await page.setContent(
  `<!doctype html><html lang="nl"><head><meta charset="utf-8">
   <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Fraunces:wght@600;700&family=Baloo+2:wght@600;700&display=swap" rel="stylesheet">
   </head><body><div id="wb-print"></div></body></html>`,
  { waitUntil: "load" }
);
await page.addScriptTag({ path: join(ROOT, "public", "avinka-werkblad.js") });
// CATS + lengte-logica als echte globals in de pagina (via een <script>)
await page.addScriptTag({ content:
  `window.__CATS = (${catsLiteral()});\n var lengte = 'middel';\n ${LENGTE_LOGICA}\n window.__pasLengte = pasLengte;` });
await page.emulateMedia({ media: "print" });
await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});

console.log(`\n📋 Werkblad-keurder — ${modules.length} modules × ${LENGTES.length} lengtes, echte A4 (${A4_BREED_MM}×${A4_HOOG_MM} mm/kantje)`);
console.log(`   spelling: ${WB ? WB.size.toLocaleString("nl") + " woorden geladen" : "OVERGESLAGEN (geen woordenlijst)"}\n`);

// ── Elke module × lengte meten ───────────────────────────────────────────────
const resultaten = [];
for (const m of modules) {
  const r = { ...m, perLengte: {}, problemen: [], spelling: [] };

  // Spelling op de VASTE opdracht/kop-tekst (verandert niet met lengte)
  const bronBlokken = (() => { for (const c of cats) for (const t of c[3]) if (t[0] === m.num) return t[3]; return []; })();
  const vasteTekst = [];
  const loop = (o) => { if (!o || typeof o !== "object") return; for (const k of ["opdracht", "kop"]) if (typeof o[k] === "string") vasteTekst.push(o[k]); for (const v of Object.values(o)) if (v && typeof v === "object") loop(v); };
  bronBlokken.forEach(loop);
  const fout = [...new Set(vasteTekst.flatMap(spelfouten))];
  if (fout.length) { r.spelling = fout; r.problemen.push("SPELLING? (" + fout.slice(0, 6).join(", ") + ")"); }

  for (const len of LENGTES) {
    jsFouten.length = 0;
    let meting;
    try {
      meting = await page.evaluate(({ num, len, cat }) => {
        window.lengte = len;
        let blokken = null;
        for (const c of window.__CATS) for (const t of c[3]) if (t[0] === num) blokken = t[3].map((b) => window.__pasLengte(b));
        const wb = { titel: cat, vak: cat, groep: "groep 5", blokken };
        const el = document.getElementById("wb-print");
        try { el.innerHTML = window.avinkaWerkblad.render(wb, { antwoorden: true }); }
        catch (e) { return { fout: "render: " + (e && e.message || e) }; }
        const vraag = el.querySelector(".wb-page:not(.wb-page-ant)");
        const h = vraag ? vraag.getBoundingClientRect().height : 0;
        const teBreed = vraag ? Math.max(0, vraag.scrollWidth - vraag.clientWidth) : 0;
        return { vraagPx: h, teBreedPx: teBreed, leeg: !vraag || h < 6 };
      }, { num: m.num, len, cat: m.naam });
    } catch (e) { meting = { fout: "evaluate: " + (e && e.message || e) }; }

    const cel = { len };
    if (meting.fout) { cel.fout = meting.fout; r.problemen.push(`KAPOT@${len} (${meting.fout})`); }
    else if (meting.leeg) { cel.leeg = true; r.problemen.push(`KAPOT@${len} (leeg)`); }
    else {
      cel.kantjes = +(meting.vraagPx / PX_PER_MM / A4_HOOG_MM).toFixed(2);
      cel.teBreedMM = +(meting.teBreedPx / PX_PER_MM).toFixed(1);
      if (cel.kantjes > MAX_KANTJES + 0.05) r.problemen.push(`TE GROOT@${len} (${cel.kantjes} kantjes)`);
      if (cel.teBreedMM > 2) r.problemen.push(`TE BREED@${len} (${cel.teBreedMM}mm buiten pagina)`);
    }
    if (jsFouten.length) { cel.jsFout = jsFouten[0].slice(0, 100); r.problemen.push(`JS-FOUT@${len}`); }
    r.perLengte[len] = cel;

    // Screenshot bij een LAYOUT-probleem op deze lengte (spelling telt niet mee)
    const layoutFout = cel.fout || cel.leeg || (cel.kantjes > MAX_KANTJES + 0.05) || (cel.teBreedMM > 2) || cel.jsFout;
    if (layoutFout || SHOT.has(String(m.num))) {
      const naam = `${String(m.num).padStart(2, "0")}-${m.key}-${len}.png`;
      await page.locator("#wb-print").screenshot({ path: join(UIT, naam) }).catch(() => {});
      (r.shots ||= []).push({ len, naam });
    }
  }

  r.ok = r.problemen.length === 0;
  resultaten.push(r);

  const maten = LENGTES.map((l) => { const c = r.perLengte[l]; return c.fout || c.leeg ? "×" : (c.kantjes ?? "?"); }).join(" / ");
  console.log(`${r.ok ? "✅" : "⚠️ "} #${String(m.num).padStart(2)} ${m.naam.slice(0, 32).padEnd(32)} ${maten}` + (r.ok ? "" : "  → " + r.problemen.join(" · ")));
}
await browser.close();

// ── Rapport: JSON + een HTML-pagina die je in de browser opent ───────────────
const gemarkeerd = resultaten.filter((r) => !r.ok);
writeFileSync(join(UIT, "rapport.json"), JSON.stringify(resultaten, null, 2));

const rijen = gemarkeerd.map((r) => {
  const shots = (r.shots || []).map((s) => `<figure><figcaption>${s.len}</figcaption><img src="${s.naam}" loading="lazy"></figure>`).join("");
  const spel = r.spelling.length ? `<p class="spel">📝 Mogelijke spelfouten: <b>${r.spelling.join(", ")}</b> <span>(controleer — advies, geen zekerheid)</span></p>` : "";
  return `<section><h2>#${r.num} · ${esc(r.naam)}</h2><p class="prob">${r.problemen.map(esc).join(" &nbsp;·&nbsp; ")}</p>${spel}<div class="shots">${shots}</div></section>`;
});
function esc(s) { return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }
writeFileSync(join(UIT, "rapport.html"),
  `<!doctype html><meta charset="utf-8"><title>Werkblad-keurder — rapport</title>
   <style>body{font:15px/1.5 system-ui,sans-serif;max-width:900px;margin:24px auto;padding:0 18px;color:#221c3a;background:#f6f4ef}
   h1{font-size:22px}.top{color:#555}section{background:#fff;border:1px solid #0001;border-radius:14px;padding:14px 18px;margin:16px 0}
   h2{font-size:17px;margin:.2em 0}.prob{color:#b45309;font-weight:600;margin:.3em 0}.spel{color:#a11;background:#fff4f4;padding:8px 10px;border-radius:8px}
   .spel span{color:#888;font-weight:400}.shots{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px}
   figure{margin:0}figcaption{font-size:12px;color:#666;margin-bottom:4px}img{max-width:260px;border:1px solid #0002;border-radius:8px;box-shadow:0 4px 14px #0001}</style>
   <h1>📋 Werkblad-keurder</h1>
   <p class="top">${resultaten.length} modules × ${LENGTES.length} lengtes · <b>${resultaten.length - gemarkeerd.length} OK</b> · <b>${gemarkeerd.length} gemarkeerd</b> · max ${MAX_KANTJES} kantjes · ${new Date().toLocaleString("nl-NL")}</p>
   ${gemarkeerd.length ? rijen.join("\n") : '<section>🎉 Alles groen — niets gemarkeerd.</section>'}`);

console.log(`\n── Klaar ──`);
console.log(`${resultaten.length} modules · ${resultaten.length - gemarkeerd.length} OK · ${gemarkeerd.length} gemarkeerd`);
console.log(`\n👀 Open het overzicht:  _keur/uit/rapport.html   (met screenshots erin)\n`);
process.exit(gemarkeerd.length ? 1 : 0);

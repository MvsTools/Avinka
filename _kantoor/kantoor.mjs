/* ───────────────────────────────────────────────────────────────────────────
   HET AVINKA-KANTOOR — cockpit voor je AI-collega's (staat LOS van het platform)

   Professionele versie: teamvloer, opdrachten, keuring met LIVE module-preview
   (renderen via public/avinka-werkblad.js), en een activiteitenlog.

   Starten:  node _kantoor/kantoor.mjs   →   open http://localhost:4321
   Ships NOOIT mee naar Vercel (losse map, eigen server, geen deel van de app).
   ─────────────────────────────────────────────────────────────────────────── */
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright";

const HIER = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HIER, "..");
const PREVIEW = join(ROOT, "public", "werkblad-preview.html");
const STAAT = join(HIER, "staat.json");
const PORT = 4321;

const LEEG = { status: { bouwer: "rust", keurmeester: "rust" }, opdrachten: [], log: [] };
const leesStaat = () => (existsSync(STAAT) ? { ...LEEG, ...JSON.parse(readFileSync(STAAT, "utf8")) } : structuredClone(LEEG));
const schrijfStaat = (s) => writeFileSync(STAAT, JSON.stringify(s, null, 2));
function logRegel(staat, tekst, ic = "•") { staat.log.unshift({ t: new Date().toISOString(), tekst, ic }); staat.log = staat.log.slice(0, 40); }

// ── Catalogus (CATS + GETEST) live uit de preview ───────────────────────────
function catsLiteral(html) {
  const s = html.indexOf("var CATS ="), open = html.indexOf("[", s);
  let d = 0, i = open, q = null;
  for (; i < html.length; i++) {
    const c = html[i];
    if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; }
    if (c === "'" || c === '"') q = c; else if (c === "[") d++; else if (c === "]") { if (--d === 0) { i++; break; } }
  }
  return html.slice(open, i);
}
function leesCatalogus() {
  const html = readFileSync(PREVIEW, "utf8");
  const cats = eval("(" + catsLiteral(html) + ")");
  const g = html.match(/var GETEST = \[([^\]]*)\]/);
  const getest = g ? g[1].split(",").map((x) => parseInt(x.trim())).filter((n) => !isNaN(n)) : [];
  const modules = [];
  for (const c of cats) for (const t of c[3]) modules.push({ num: t[0], key: t[1], naam: t[2], cat: c[0], catIc: c[1] });
  return { modules, getest };
}
function keurGoed(num) {
  const html = readFileSync(PREVIEW, "utf8").replace(/var GETEST = \[([^\]]*)\]/, (_, inner) => {
    const arr = inner.split(",").map((x) => parseInt(x.trim())).filter((n) => !isNaN(n));
    if (!arr.includes(num)) arr.push(num);
    arr.sort((a, b) => a - b);
    return "var GETEST = [" + arr.join(", ") + "]";
  });
  writeFileSync(PREVIEW, html);
}

// ── Live module-preview via de echte render-engine (browser warm houden) ────
let page = null, keten = Promise.resolve();
async function zorgPage() {
  if (page) return page;
  const browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 726, height: 1400 } });
  await page.setContent(
    `<!doctype html><meta charset="utf-8">
     <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Fraunces:wght@600;700&family=Baloo+2:wght@600;700&display=swap" rel="stylesheet">
     <div id="wb-print"></div>`, { waitUntil: "load" });
  await page.addScriptTag({ path: join(ROOT, "public", "avinka-werkblad.js") });
  await page.addScriptTag({ content: `window.__CATS = (${catsLiteral(readFileSync(PREVIEW, "utf8"))});` });
  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  return page;
}
function renderModule(num) {
  const run = keten.then(async () => {
    const pg = await zorgPage();
    await pg.evaluate((n) => {
      let naam = "Werkblad", cat = "", blokken = null;
      for (const c of window.__CATS) for (const t of c[3]) if (t[0] === n) { naam = t[2]; cat = c[0]; blokken = t[3]; }
      const wb = { titel: naam, vak: cat, groep: "groep 5", blokken: blokken || [] };
      document.getElementById("wb-print").innerHTML = window.avinkaWerkblad.render(wb, { antwoorden: true });
    }, num);
    return pg.locator("#wb-print").screenshot();
  });
  keten = run.catch(() => {});
  return run;
}

// ── HTTP ─────────────────────────────────────────────────────────────────────
const json = (res, o, c = 200) => { res.writeHead(c, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };
const body = (req) => new Promise((r) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => r(b ? JSON.parse(b) : {})); });
const CAT_LABEL = { spelling: "Taal & spelling", rekenen: "Rekenen", universeel: "Universeel", puzzel: "Puzzels & speels" };

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return res.end(readFileSync(join(HIER, "index.html"), "utf8"));
    }
    if (req.method === "GET" && url.pathname === "/api/status") {
      const { modules, getest } = leesCatalogus(), staat = leesStaat();
      return json(res, {
        status: staat.status,
        opdrachten: staat.opdrachten.filter((o) => o.status !== "klaar"),
        wachtOpKeuring: modules.filter((m) => !getest.includes(m.num)),
        getestAantal: getest.length, totaal: modules.length, log: staat.log,
      });
    }
    if (req.method === "POST" && url.pathname === "/api/opdracht") {
      const b = await body(req), staat = leesStaat();
      const label = CAT_LABEL[b.categorie] || "Universeel";
      staat.opdrachten.push({ id: Date.now(), collega: "bouwer", categorie: b.categorie || "universeel", label, status: "wachtrij" });
      staat.status.bouwer = "wachtrij";
      logRegel(staat, `Je gaf de Bouwer een opdracht: ${label}`, "🧑‍💻");
      schrijfStaat(staat);
      return json(res, { ok: true });
    }
    if (req.method === "POST" && url.pathname === "/api/keur") {
      const b = await body(req);
      if (typeof b.num === "number") {
        keurGoed(b.num);
        const staat = leesStaat();
        logRegel(staat, `Je keurde #${b.num}${b.naam ? " " + b.naam : ""} goed → nu getest ✓`, "✅");
        schrijfStaat(staat);
      }
      return json(res, { ok: true });
    }
    const mprev = url.pathname.match(/^\/api\/preview\/(\d+)$/);
    if (req.method === "GET" && mprev) {
      const png = await renderModule(parseInt(mprev[1]));
      res.writeHead(200, { "content-type": "image/png", "cache-control": "no-store" });
      return res.end(png);
    }
    json(res, { error: "niet gevonden" }, 404);
  } catch (e) { json(res, { error: String((e && e.message) || e) }, 500); }
}).listen(PORT, () => console.log("🏢 Avinka-kantoor draait op http://localhost:" + PORT));

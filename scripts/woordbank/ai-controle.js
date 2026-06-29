/* Avinka — AI-controle (Sonnet) over de woord- en werkwoordenbanken.
 *
 * Twee passes:
 *   1. werkwoordenbank: haal homografen eruit (mannen/bomen/waren = naamwoord) ->
 *      _bron/ww-afgekeurd.txt
 *   2. spellingbank (lek-gevoelige categorieen): haal verkapte werkwoordsvormen
 *      eruit (loopt/gemaakt/bleef) -> _bron/extra-werkwoordsvormen.txt
 *
 * Alle oordelen worden gecachet in _bron/ai-cache.json -> opnieuw draaien is
 * gratis en deterministisch. Eenmalige build-stap.
 *
 * Draaien:  NODE_OPTIONS=--use-system-ca node scripts/woordbank/ai-controle.js
 */
"use strict";
const fs = require("fs");
const https = require("https");
const path = require("path");
const BRON = (f) => path.join(__dirname, "_bron", f);

const env = fs.readFileSync(path.join(__dirname, "..", "..", ".env.local"), "utf8");
const KEY = (env.match(/^ANTHROPIC_API_KEY=(.+)$/m) || [])[1];
if (!KEY) { console.error("Geen ANTHROPIC_API_KEY"); process.exit(1); }

const MODEL = "claude-sonnet-4-6";
const PRIJS = { in: 3.0, uit: 15.0 };
const BATCH = 120;

// ── Cache (woord-oordeel) op schijf ───────────────────────────────────────────
const CACHE_PAD = BRON("ai-cache.json");
let cache = {};
try { cache = JSON.parse(fs.readFileSync(CACHE_PAD, "utf8")); } catch (e) {}
function bewaarCache() { fs.writeFileSync(CACHE_PAD, JSON.stringify(cache)); }

let kostenTotaal = 0, oproepen = 0;
function callSonnet(prompt) {
  const body = JSON.stringify({ model: MODEL, max_tokens: 1500, messages: [{ role: "user", content: prompt }] });
  return new Promise((res, rej) => {
    const r = https.request({
      hostname: "api.anthropic.com", path: "/v1/messages", method: "POST",
      headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json", "content-length": Buffer.byteLength(body) },
    }, resp => {
      let d = ""; resp.on("data", c => d += c); resp.on("end", () => {
        let j; try { j = JSON.parse(d); } catch (e) { return rej(new Error("parse: " + d.slice(0, 200))); }
        if (j.type === "error") return rej(new Error(JSON.stringify(j.error)));
        const u = j.usage || {};
        kostenTotaal += (u.input_tokens || 0) / 1e6 * PRIJS.in + (u.output_tokens || 0) / 1e6 * PRIJS.uit;
        oproepen++;
        res((j.content || []).map(b => b.text || "").join(""));
      });
    });
    r.on("error", rej); r.write(body); r.end();
  });
}

// Keurt een lijst woorden met `instructie`. `tag` = cache-namespace. Geeft de Set
// van AFGEKEURDE woorden terug. Alleen niet-gecachte woorden gaan naar de AI.
async function keur(woorden, instructie, tag) {
  const afgekeurd = new Set();
  const teVragen = [];
  for (const w of woorden) {
    const k = tag + "|" + w;
    if (k in cache) { if (cache[k]) afgekeurd.add(w); }
    else teVragen.push(w);
  }
  for (let i = 0; i < teVragen.length; i += BATCH) {
    const groep = teVragen.slice(i, i + BATCH);
    const tekst = await callSonnet(instructie + "\n\nWoorden:\n" + groep.join(", "));
    let weg = [];
    try { weg = JSON.parse((tekst.match(/\[[\s\S]*\]/) || ["[]"])[0]); } catch (e) {}
    const wegSet = new Set(weg.map(x => String(x).toLowerCase().trim()));
    for (const w of groep) {
      const slecht = wegSet.has(w);
      cache[tag + "|" + w] = slecht;
      if (slecht) afgekeurd.add(w);
    }
    bewaarCache();
    process.stdout.write(`  ${tag}: ${Math.min(i + BATCH, teVragen.length)}/${teVragen.length}\r`);
  }
  return afgekeurd;
}

(async () => {
  // ── Pass 1: werkwoordenbank — homografen ──────────────────────────────────
  const wb = require("./werkwoordenbank.json").groepen;
  const inf = [...new Set([].concat(wb["6"], wb["7"], wb["8"]).map(v => v.inf))];
  const ww = await keur(inf,
    "Hieronder staan woorden die als HÉÉL WERKWOORD (infinitief, de -en-vorm zoals lopen, werken, " +
    "koken, fietsen) in een werkwoordenbank staan voor de basisschool. Geef UITSLUITEND de woorden " +
    "terug die GÉÉN infinitief van een werkwoord zijn, namelijk: (a) zelfstandige naamwoorden " +
    "(mannen, bomen, dagen, tranen), of (b) al vervoegde vormen (waren en kwamen = verleden tijd " +
    "van zijn/komen; gingen). Een echt heel werkwoord (trouwen, wagen, zagen, koken, plannen) laat " +
    "je STAAN. Geef een JSON array van strings, geen uitleg.", "ww2");
  fs.writeFileSync(BRON("ww-afgekeurd.txt"), [...ww].sort().join("\n"));
  console.log(`\nPass 1 (werkwoordenbank): ${ww.size} homografen afgekeurd van ${inf.length}.`);

  // ── Pass 2: spellingbank — verkapte werkwoordsvormen in lek-categorieen ────
  const bank = require("./woordenbank.json").categorieen;
  const LEK = ["open_gesloten", "langermaak_d", "f_naar_v", "s_naar_z", "c_als_s", "c_als_k", "ng_nk", "sch", "eer_oor_eur"];
  const spelWoorden = [...new Set(LEK.flatMap(id => (bank[id] ? bank[id].woorden.map(x => x[0]) : [])))];
  const vormen = await keur(spelWoorden,
    "Hieronder staan Nederlandse woorden uit een SPELLING-oefenbank. Daarin horen zelfstandige " +
    "naamwoorden en bijvoeglijke naamwoorden thuis, maar GEEN werkwoordsvormen (die zitten in een " +
    "aparte bank). Geef UITSLUITEND de woorden terug die een VERVOEGDE WERKWOORDSVORM zijn " +
    "(bv. 'loopt', 'gemaakt', 'bleef', 'vond', 'komen', 'werkte'). Is een woord ook een gewoon " +
    "zelfstandig of bijvoeglijk naamwoord (bv. 'hand', 'zacht', 'vriend', 'licht'), laat het dan " +
    "STAAN. Geef een JSON array van strings, geen uitleg.", "spel");
  fs.writeFileSync(BRON("extra-werkwoordsvormen.txt"), [...vormen].sort().join("\n"));
  console.log(`Pass 2 (spellingbank): ${vormen.size} verkapte werkwoorden gevonden van ${spelWoorden.length}.`);

  console.log(`\nAI-oproepen: ${oproepen}  ·  kosten deze run: $${kostenTotaal.toFixed(4)} (gecachet → herhalen is gratis)`);
  console.log("Voorbeeld afgekeurde werkwoorden:", [...ww].slice(0, 15).join(", "));
  console.log("Voorbeeld verkapte werkwoorden (spelling):", [...vormen].slice(0, 15).join(", "));
})();

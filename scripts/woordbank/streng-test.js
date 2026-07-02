/* Eenmalige TEST: haalbaarheid van een strengere geschiktheids-pass.
   Draait 1 batch over doorglippers + "moet-blijven"-woorden om valse treffers te meten.
   NIET onderdeel van de build. Draai: node scripts/woordbank/streng-test.js */
"use strict";
const fs = require("fs");
const https = require("https");
const path = require("path");
const env = fs.readFileSync(path.join(__dirname, "..", "..", ".env.local"), "utf8");
const KEY = (env.match(/^ANTHROPIC_API_KEY=(.+)$/m) || [])[1];
const MODEL = "claude-sonnet-4-6";
const PRIJS = { in: 3.0, uit: 15.0 };

// Doorglippers die eruit MOETEN (eigenaar keurde ze af):
const SLIP = ["harem","guerrilla","kannibalen","billenkoek","bommenwerper","bommenlegger",
  "chardonnay","sherry","moloch","hoogverraad","kidnapping","afvallige","goddeloze","wreker","eros"];
// Woorden die juist MOETEN BLIJVEN (geschiedenis/alledaags) — valse-treffer-meter:
const BLIJFT = ["leger","soldaat","soldaten","oorlog","vrede","ridder","kasteel","zwaard","kanon",
  "held","gevecht","ruzie","geschiedenis","koning","strijd","wapenschild","wijn","bier","kaas",
  "water","tafel","professor","koffie","ziek","dokter","medicijn","politie","brandweer","vlag"];

const prompt =
  "Beoordeel deze Nederlandse woorden voor een SPELLING-werkblad voor basisschoolkinderen (groep 3-8). " +
  "Geef UITSLUITEND de woorden terug die je ER LIEVER NIET OP ZOU ZETTEN omdat ze een volwassen, " +
  "verontrustende of niet-kindgerichte bijklank hebben, ook al zijn ze niet grof. Denk aan: " +
  "specifieke oorlogswapens of aanslag-/geweldsmisdrijven (bommenwerper, bomaanslag, ontvoering, " +
  "hoogverraad), wreedheid of kannibalisme, alcoholsoorten/drank als thema (chardonnay, sherry, likeur), " +
  "religieus-duistere of occulte begrippen (moloch, goddeloze, afvallige), en exotisch-volwassen " +
  "onderwerpen (harem). HEEL BELANGRIJK — laat gewone geschiedenis-, natuur- en alledaagse woorden STAAN: " +
  "leger, soldaat, oorlog, vrede, ridder, kasteel, zwaard, kanon, koning, strijd, held, gevecht, ruzie, " +
  "geschiedenis, wijn en bier als gewoon woord, kaas, water, professor, koffie, ziek, dokter, politie. " +
  "Het gaat om de VOLWASSEN/VERONTRUSTENDE BIJKLANK, niet om moeilijkheid. Geef een JSON array van strings, geen uitleg.";

const woorden = [...SLIP, ...BLIJFT];
const body = JSON.stringify({ model: MODEL, max_tokens: 800, messages: [{ role: "user", content: prompt + "\n\nWoorden:\n" + woorden.join(", ") }] });
const r = https.request({ hostname: "api.anthropic.com", path: "/v1/messages", method: "POST",
  headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json", "content-length": Buffer.byteLength(body) } },
  resp => { let d = ""; resp.on("data", c => d += c); resp.on("end", () => {
    const j = JSON.parse(d);
    if (j.type === "error") { console.error(j.error); return; }
    const tekst = (j.content || []).map(b => b.text || "").join("");
    let weg = []; try { weg = JSON.parse((tekst.match(/\[[\s\S]*\]/) || ["[]"])[0]); } catch (e) {}
    const wegSet = new Set(weg.map(x => String(x).toLowerCase().trim()));
    const gemist = SLIP.filter(w => !wegSet.has(w));
    const vals = BLIJFT.filter(w => wegSet.has(w));
    console.log("AFGEKEURD door strenge pass:", [...wegSet].sort().join(", "));
    console.log("\n✓ Doorglippers correct gepakt:", SLIP.filter(w => wegSet.has(w)).length + "/" + SLIP.length);
    console.log("✗ Doorglippers alsnog GEMIST:", gemist.length ? gemist.join(", ") : "geen");
    console.log("⚠ VALSE TREFFERS (moesten blijven):", vals.length ? vals.join(", ") : "geen");
    const u = j.usage || {};
    const kosten = (u.input_tokens || 0) / 1e6 * PRIJS.in + (u.output_tokens || 0) / 1e6 * PRIJS.uit;
    console.log(`\ntokens in/uit: ${u.input_tokens}/${u.output_tokens} · kosten deze batch: $${kosten.toFixed(5)}`);
  }); });
r.on("error", e => console.error(e)); r.write(body); r.end();

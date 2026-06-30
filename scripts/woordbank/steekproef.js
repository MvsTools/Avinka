/* Avinka — STEEKPROEF-audit over de woordenbank (kwaliteit, advies-only).
 *
 * Per spellingcategorie wordt een steekproef getrokken (gespreid over de
 * woorden) en door Sonnet beoordeeld op drie kwaliteitsvragen:
 *   (a) past het woord ECHT in deze spellingcategorie?
 *   (b) is het geschikt voor kinderen (groep 3-8)?
 *   (c) is het een gewoon, bruikbaar Nederlands woord (geen rommel/naam)?
 * Output = een rapport in de console. Dit script WEERT NIETS automatisch; het
 * is bedoeld om onbekende gevallen te vinden die je daarna handmatig in een
 * blocklist/allowlist of categorieregex verwerkt.
 *
 * Draaien:  NODE_OPTIONS=--use-system-ca node scripts/woordbank/steekproef.js
 *           (optioneel) STEEKPROEF=25 om de steekproefgrootte per categorie te zetten.
 */
"use strict";
const fs = require("fs");
const https = require("https");
const path = require("path");

const env = fs.readFileSync(path.join(__dirname, "..", "..", ".env.local"), "utf8");
const KEY = (env.match(/^ANTHROPIC_API_KEY=(.+)$/m) || [])[1];
if (!KEY) { console.error("Geen ANTHROPIC_API_KEY"); process.exit(1); }

const MODEL = "claude-sonnet-4-6";
const PRIJS = { in: 3.0, uit: 15.0 };
const N = parseInt(process.env.STEEKPROEF || "20", 10);   // woorden per categorie

let kosten = 0, oproepen = 0;
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
        kosten += (u.input_tokens || 0) / 1e6 * PRIJS.in + (u.output_tokens || 0) / 1e6 * PRIJS.uit;
        oproepen++;
        res((j.content || []).map(b => b.text || "").join(""));
      });
    });
    r.on("error", rej); r.write(body); r.end();
  });
}

// Gespreide (deterministische) steekproef van n woorden uit een lijst.
function steekproef(woorden, n) {
  if (woorden.length <= n) return woorden.slice();
  const stap = woorden.length / n;
  const uit = [];
  for (let i = 0; i < n; i++) uit.push(woorden[Math.floor(i * stap)]);
  return [...new Set(uit)];
}

(async () => {
  const bank = require("./woordenbank.json").categorieen;
  const ids = Object.keys(bank);
  console.log(`STEEKPROEF-audit: ${ids.length} categorieen, ${N} woorden elk.\n`);

  const problemen = [];
  for (const id of ids) {
    const cat = bank[id];
    const woorden = steekproef(cat.woorden.map(x => x[0]), N);
    const prompt =
      `Je controleert de KWALITEIT van een spelling-oefenbank voor de basisschool (groep 3-8).\n` +
      `Spellingcategorie: "${cat.label}" — ${cat.omschrijving || ""} (voorbeeld: ${cat.voorbeeld || "?"}).\n\n` +
      `Hieronder een steekproef woorden die de bank in DEZE categorie heeft gezet. Geef UITSLUITEND de ` +
      `woorden terug die een PROBLEEM hebben, met reden. Een probleem is: ` +
      `(a) "categorie" = past niet echt in deze spellingcategorie; ` +
      `(b) "ongeschikt" = niet geschikt voor kinderen; ` +
      `(c) "rommel" = geen gewoon/bruikbaar Nederlands woord, een eigennaam, of een vervoegd werkwoord. ` +
      `Woorden die prima zijn laat je weg. Antwoord met een JSON array van objecten ` +
      `{"woord":"...","soort":"categorie|ongeschikt|rommel","reden":"kort"}. Geen extra uitleg.\n\n` +
      `Woorden:\n${woorden.join(", ")}`;
    let arr = [];
    try { arr = JSON.parse((await callSonnet(prompt)).match(/\[[\s\S]*\]/)[0]); } catch (e) {}
    if (arr.length) {
      problemen.push({ id, label: cat.label, gevonden: arr });
      console.log(`\n[${id}] ${cat.label} — ${arr.length} aandachtspunt(en) van ${woorden.length}:`);
      for (const p of arr) console.log(`   • ${p.woord}  (${p.soort}) — ${p.reden}`);
    } else {
      console.log(`[${id}] ${cat.label} — schoon (${woorden.length} bekeken)`);
    }
  }

  // Compacte samenvatting per soort, makkelijk over te nemen in block/allowlist.
  const perSoort = { categorie: [], ongeschikt: [], rommel: [] };
  for (const c of problemen) for (const p of c.gevonden) (perSoort[p.soort] || (perSoort[p.soort] = [])).push(p.woord);
  console.log(`\n\n=== SAMENVATTING ===`);
  for (const s of Object.keys(perSoort)) console.log(`${s} (${perSoort[s].length}): ${[...new Set(perSoort[s])].sort().join(", ") || "—"}`);
  console.log(`\nAI-oproepen: ${oproepen}  ·  kosten: $${kosten.toFixed(4)}`);
})();

/* Eenmalige TEST: kalibratie van de BETEKENIS-/woordenschatvloer.
   Vraagt Sonnet per woord: vanaf welke groep (3-8) past de BETEKENIS — niet de
   spelling. Meet dat tegen een bekende steekproef met verwachte banden, zodat we
   de prompt kunnen ijken vóór de grote run over de hele bank.
   NIET onderdeel van de build. Draai: node scripts/woordbank/niveau-test.js */
"use strict";
const fs = require("fs");
const https = require("https");
const path = require("path");
const env = fs.readFileSync(path.join(__dirname, "..", "..", ".env.local"), "utf8");
const KEY = (env.match(/^ANTHROPIC_API_KEY=(.+)$/m) || [])[1];
const MODEL = "claude-sonnet-4-6";
const PRIJS = { in: 3.0, uit: 15.0 };

// Steekproef met VERWACHTE minimumgroep (op betekenis/woordenschat, niet spelling).
// Bewust een mix van heel-concreet (laag) tot abstract/volwassen (hoog) + een paar
// die spellingtechnisch makkelijk zijn maar qua betekenis hoog horen.
const STEEK = {
  3: ["huis", "boom", "kat", "bal", "oma", "melk", "fiets", "stoel", "vis", "maan"],
  4: ["verhaal", "gezellig", "verkeer", "gezond", "spannend", "vriendelijk"],
  5: ["museum", "uitvinding", "natuur", "gedicht", "toekomst"],
  6: ["milieu", "cultuur", "regering", "verantwoordelijk", "vervuiling"],
  7: ["democratie", "economie", "discriminatie", "immigratie", "grondwet"],
  8: ["borgtocht", "penthouse", "hypotheek", "faillissement", "aandeelhouder", "jurisprudentie", "inflatie"],
};

const prompt =
  "Je helpt bij het maken van SPELLING-werkbladen voor de basisschool (groep 3 t/m 8). " +
  "Voor ELK woord hieronder: bepaal vanaf welke GROEP (een getal 3 t/m 8) het woord past " +
  "op basis van de BETEKENIS en de woordenschat — dus: vanaf welke groep begrijpt een " +
  "gemiddeld kind dit woord en past het qua onderwerp op een werkblad. " +
  "LET OP: het gaat NIET om hoe moeilijk het woord te SCHRIJVEN is (spelling), en NIET om " +
  "of het woord ongepast is — puur om de betekenis/woordenschat. " +
  "Heel concrete, alledaagse dingen (huis, boom, melk, fiets) horen bij groep 3. " +
  "Abstracte, maatschappelijke of volwassen begrippen (democratie, hypotheek, faillissement, " +
  "inflatie) horen pas bij groep 7 of 8. Twijfel je tussen twee groepen, kies dan de LAAGSTE " +
  "waarbij het nog echt begrijpelijk is. " +
  "Antwoord met UITSLUITEND een JSON-object dat elk woord aan een getal koppelt, bv. " +
  '{"huis":3,"democratie":7}. Geen uitleg.';

const woorden = Object.values(STEEK).flat();
const body = JSON.stringify({ model: MODEL, max_tokens: 1200, messages: [{ role: "user", content: prompt + "\n\nWoorden:\n" + woorden.join(", ") }] });
const r = https.request({ hostname: "api.anthropic.com", path: "/v1/messages", method: "POST",
  headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json", "content-length": Buffer.byteLength(body) } },
  resp => { let d = ""; resp.on("data", c => d += c); resp.on("end", () => {
    const j = JSON.parse(d);
    if (j.type === "error") { console.error(j.error); return; }
    const tekst = (j.content || []).map(b => b.text || "").join("");
    let uit = {}; try { uit = JSON.parse((tekst.match(/\{[\s\S]*\}/) || ["{}"])[0]); } catch (e) {}
    let afw = 0, groot = 0;
    for (const [verwacht, lijst] of Object.entries(STEEK)) {
      console.log(`\n— verwacht groep ${verwacht} —`);
      for (const w of lijst) {
        const g = uit[w];
        const d2 = g == null ? "?" : (g - +verwacht);
        const vlag = g == null ? "  (geen antwoord)" : (Math.abs(d2) === 0 ? "  ✓" : Math.abs(d2) === 1 ? "  ~" : "  ✗ " + (d2 > 0 ? "+" : "") + d2);
        if (g != null) { afw += Math.abs(d2); if (Math.abs(d2) >= 2) groot++; }
        console.log("  " + w.padEnd(16) + "AI: " + (g == null ? "-" : g) + vlag);
      }
    }
    console.log(`\nGemiddelde afwijking: ${(afw / woorden.length).toFixed(2)} groep · grote missers (≥2): ${groot}`);
    const u = j.usage || {};
    const kosten = (u.input_tokens || 0) / 1e6 * PRIJS.in + (u.output_tokens || 0) / 1e6 * PRIJS.uit;
    console.log(`tokens in/uit: ${u.input_tokens}/${u.output_tokens} · kosten deze probe: $${kosten.toFixed(5)}`);
  }); });
r.on("error", e => console.error(e)); r.write(body); r.end();

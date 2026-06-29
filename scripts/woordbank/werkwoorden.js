/* Avinka — werkwoordenbank-bouwer (build-time, Node).
 *
 * Bouwt (1) een werkwoordenbank per groep (opbouwend makkelijk->moeilijk) en
 * (2) een set van alle werkwoordsvormen, zodat bouw.js die uit de gewone
 * spellingbank kan strepen (werkwoordspelling = aparte regels).
 *
 * Bronnen (OPEN, geen methode-materiaal):
 *   OpenTaal-woordenlijst            -> correcte spelling + lexicon-check
 *   hermitdave nl_50k freq           -> komt het voor? + niveau
 *   Horroon "most common dutch verbs"-> onregelmatige (sterke) werkwoorden + vormen
 *
 * Regelmatige (zwakke) werkwoorden vervoegen we zelf met de 't kofschip-regel
 * (stam + te/de, voltooid deelwoord ge...t/d). Een woord op -en is een (herkend)
 * werkwoord als het verwachte voltooid deelwoord in OpenTaal bestaat.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const BRON = (f) => path.join(__dirname, "_bron", f);
const DATUM = "2026-06-29";

const OPENTAAL = new Set(fs.readFileSync(BRON("opentaal-wordlist.txt"), "utf8").split(/\r?\n/).filter(Boolean));
const RANG = new Map();
fs.readFileSync(BRON("nl_frequentie_50k.txt"), "utf8").split(/\r?\n/).filter(Boolean).forEach((r, i) => {
  const w = r.split(/\s+/)[0]; if (w && !RANG.has(w)) RANG.set(w, i + 1);
});
const ONREGEL = JSON.parse(fs.readFileSync(BRON("onregelmatige-werkwoorden.json"), "utf8"));
const schoon = (s) => String(s || "").toLowerCase().match(/[a-zà-ÿ]+/) ? String(s).toLowerCase().match(/[a-zà-ÿ]+/)[0] : "";

// ── Stam bepalen (verenkelen/verdubbelen + f->v, s->z terug) ──────────────────
function stamVan(inf) {
  if (!inf.endsWith("en")) return null;
  let b = inf.slice(0, -2);
  if (/([bcdfghjklmnpqrstvwxz])\1$/.test(b)) b = b.slice(0, -1);            // pakken -> pak
  else {
    const m = b.match(/([^aeiou])([aeou])([bcdfghjklmnpqrstvwxz])$/);        // open lettergreep: maken->maak
    if (m) b = b.slice(0, -3) + m[1] + m[2] + m[2] + m[3];
  }
  return b.replace(/v$/, "f").replace(/z$/, "s");                            // leven->leef, reizen->reis
}
// 't kofschip: stam-eindklank in t,k,f,s,ch,p,x -> te, anders -> de. Let op: kijk
// naar de klank van het hele werkwoord (leven=v -> de), dus naar de letter VOOR -en.
function vtSuffix(inf) {
  const b = inf.slice(0, -2), last = b.slice(-1);
  return (b.endsWith("ch") || "tkfspx".includes(last)) ? "te" : "de";
}
function vdKandidaten(inf, stam) {
  const eind = /[td]$/.test(stam) ? "" : (vtSuffix(inf) === "te" ? "t" : "d");
  const kern = stam + eind;                                    // werkt->gewerkt, speeld->gespeeld
  const lijst = ["ge" + kern];
  if (/^(be|ge|ver|ont|her|er)/.test(inf)) lijst.push(kern);   // onscheidbaar voorvoegsel: GEEN ge- (veranderen->veranderd)
  return lijst;
}

// ── Werkwoorden verzamelen ────────────────────────────────────────────────────
const werkwoorden = new Map(); // inf -> {inf, stam, ttHij, vtEnk, vtMv, vd, soort}

// (1) onregelmatige uit Horroon
for (const r of ONREGEL) {
  const inf = schoon(r.infinitive);
  if (!inf.endsWith("en")) continue;
  const stam = stamVan(inf); if (!stam) continue;
  werkwoorden.set(inf, {
    inf, stam,
    ttHij: /t$/.test(stam) ? stam : stam + "t",
    vtEnk: schoon(r.simplepast), vtMv: schoon(r.simplepastplural),
    vd: schoon(r.pastparticiple), soort: "sterk",
  });
}
// (2) regelmatige uit OpenTaal: -en woord waarvan het voltooid deelwoord bestaat
for (const inf of OPENTAAL) {
  if (!/^[a-zà-ÿ]+en$/.test(inf) || inf.length < 4 || inf.length > 15 || werkwoorden.has(inf)) continue;
  if (!RANG.has(inf)) continue;                    // alleen werkwoorden die echt voorkomen
  const stam = stamVan(inf); if (!stam || stam.length < 2) continue;
  const vd = vdKandidaten(inf, stam).find(x => OPENTAAL.has(x));
  const ttHij = /t$/.test(stam) ? stam : stam + "t";
  // Beide echte vormen moeten bestaan: zo vallen zn-meervouden (mannen->mant?,
  // jongen->jongt?) af die toevallig een geldig voltooid deelwoord hebben.
  if (!vd || !OPENTAAL.has(ttHij)) continue;
  const suf = vtSuffix(inf);
  werkwoorden.set(inf, {
    inf, stam,
    ttHij: /t$/.test(stam) ? stam : stam + "t",
    vtEnk: stam + suf, vtMv: stam + suf + "n", vd, soort: "zwak",
  });
}

// ── Niveau per werkwoord (opbouwend makkelijk -> moeilijk) ─────────────────────
// Werkwoordspelling start rond groep 6; valkuilen schuiven door naar 7/8.
function niveau(v) {
  let g = 6;
  const rang = RANG.get(v.inf) || 99999;
  if (v.soort === "sterk") g = 7;                          // klankverandering verleden tijd
  if (/(ven|zen)$/.test(v.inf)) g = Math.max(g, 8);        // f/v, s/z kofschip-valkuil (leven->leefde)
  if (/[td]$/.test(v.stam)) g = Math.max(g, 8);            // dubbele d/t (praatte, raadde)
  if (rang > 12000) g = Math.max(g, 7);
  if (rang > 28000) g = Math.max(g, 8);
  return Math.min(8, g);
}

const BLOCK = /^(neuken|kotsen|zuipen|moorden|kanker|schijten|pissen|zieken)/;
// Door de AI-controle (ai-controle.js) afgekeurde homografen/vervoegingen.
let AFGEKEURD = new Set();
try { AFGEKEURD = new Set(fs.readFileSync(BRON("ww-afgekeurd.txt"), "utf8").split(/\r?\n/).filter(Boolean)); } catch (e) {}
const lijst = [...werkwoorden.values()].filter(v => v.inf.length <= 13 && !BLOCK.test(v.inf) && v.vtEnk && v.vd && !AFGEKEURD.has(v.inf));
for (const v of lijst) v.vanaf = niveau(v);
lijst.sort((a, b) => a.vanaf - b.vanaf || (RANG.get(a.inf) || 9e9) - (RANG.get(b.inf) || 9e9) || a.inf.localeCompare(b.inf));

// ── Uitvoer 1: werkwoordenbank.json (per groep) ───────────────────────────────
const perGroep = { 6: [], 7: [], 8: [] };
for (const v of lijst) {
  const g = Math.max(6, v.vanaf);
  perGroep[g].push({ inf: v.inf, stam: v.stam, ttHij: v.ttHij, vtEnk: v.vtEnk, vtMv: v.vtMv, vd: v.vd, soort: v.soort });
}
fs.writeFileSync(path.join(__dirname, "werkwoordenbank.json"), JSON.stringify({
  versie: "1.0", gegenereerd: DATUM,
  bron: "OpenTaal (BSD-3/CC-BY-3.0) + hermitdave nl_50k (CC-BY-SA-4.0) + Horroon 'most common dutch verbs' (onregelmatige). Regelmatige vervoegd met de 't kofschip-regel. Geen methode-materiaal.",
  opbouw: "Groep 6 = regelmatig/tegenwoordige tijd; 7 = verleden tijd + sterke ww; 8 = valkuilen (dt, f/v-s/z, zeldzaam).",
  groepen: perGroep,
}));

// ── Uitvoer 2: alle werkwoordsvormen (voor het strepen in bouw.js) ────────────
const vormen = new Set();
for (const v of lijst) {
  [v.inf, v.ttHij, v.vtEnk, v.vtMv, v.vd].forEach(f => { if (f) vormen.add(f); });
}
fs.writeFileSync(BRON("werkwoordsvormen.txt"), [...vormen].sort().join("\n"));

// ── Rapport ───────────────────────────────────────────────────────────────────
console.log("WERKWOORDENBANK gebouwd:", DATUM);
console.log("herkende werkwoorden:", lijst.length, "(sterk:", lijst.filter(v => v.soort === "sterk").length, "/ zwak:", lijst.filter(v => v.soort === "zwak").length + ")");
console.log("werkwoordsvormen voor strepen:", vormen.size);
for (const g of [6, 7, 8]) console.log(`groep ${g}: ${perGroep[g].length} werkwoorden`);
console.log("\nVoorbeeld groep 6:", perGroep[6].slice(0, 8).map(v => `${v.inf}(hij ${v.ttHij}, ${v.vtEnk}, ${v.vd})`).join("  "));
console.log("\nVoorbeeld groep 7:", perGroep[7].slice(0, 6).map(v => `${v.inf}->${v.vtEnk}/${v.vd}`).join("  "));
console.log("\nVoorbeeld groep 8:", perGroep[8].slice(0, 8).map(v => `${v.inf}(${v.vtEnk})`).join("  "));
console.log("\nControle kofschip — werken:", JSON.stringify([...werkwoorden.values()].find(v => v.inf === "werken")));
console.log("Controle f/v — leven:", JSON.stringify([...werkwoorden.values()].find(v => v.inf === "leven")));
console.log("Controle sterk — lopen:", JSON.stringify([...werkwoorden.values()].find(v => v.inf === "lopen")));

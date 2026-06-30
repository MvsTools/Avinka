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
// Volledige afgekeurd-lijst uit de cache (stabiel, ook na een herbouw waarbij de
// bank al opgeschoond is): alle oordelen voor `tag` die 'true' zijn.
function uitCache(tag) {
  const p = tag + "|";
  return new Set(Object.keys(cache).filter(k => k.startsWith(p) && cache[k]).map(k => k.slice(p.length)));
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
  const wwAll = uitCache("ww2");
  fs.writeFileSync(BRON("ww-afgekeurd.txt"), [...wwAll].sort().join("\n"));
  console.log(`\nPass 1 (werkwoordenbank): ${wwAll.size} homografen/vervoegingen afgekeurd (uit cache).`);

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
  const vormenAll = uitCache("spel");
  fs.writeFileSync(BRON("extra-werkwoordsvormen.txt"), [...vormenAll].sort().join("\n"));
  console.log(`Pass 2 (spellingbank): ${vormenAll.size} verkapte werkwoorden (uit cache).`);

  // ── Pass 3: veiligheidscheck — ongepaste woorden over de HELE bank ─────────
  // Inclusief de werkwoord-infinitieven (pijpen/beffen e.d. zijn werkwoorden!).
  const alleWoorden = [...new Set([...Object.values(bank).flatMap(c => c.woorden.map(x => x[0])), ...inf])];
  await keur(alleWoorden,
    "Hieronder staan Nederlandse woorden die op een werkblad voor basisschoolkinderen (groep 3-8) " +
    "kunnen komen. Geef UITSLUITEND de woorden terug die NIET geschikt zijn voor kinderen: " +
    "scheldwoorden/gevloek (verdomme, klootzak), seksueel, grof/expliciet geweld, drugs, of " +
    "anderszins ongepast of kwetsend. Gewone woorden (ook 'dood', 'bloed', 'ziek' op zichzelf) " +
    "laat je STAAN, tenzij echt grof. Geef een JSON array van strings, geen uitleg.", "ongepast");
  console.log(`Pass 3 (brede check): ${uitCache("ongepast").size} ongepast.`);

  // Pass 5: tweede, categorie-expliciete veiligheidscheck (vangt wat pass 3 mist).
  await keur(alleWoorden,
    "Beoordeel deze Nederlandse woorden voor een basisschoolwerkblad (groep 3-8). Geef UITSLUITEND " +
    "de woorden terug die in minstens EEN van deze categorieen vallen: (1) scheldwoord/gevloek, " +
    "(2) seksueel/erotisch, (3) expliciet of grof geweld of wapens, (4) drugs of drank-misbruik, " +
    "(5) kwetsende scheldnaam voor een groep mensen, (6) grof woord voor lichaamsdeel of " +
    "uitwerpselen, (7) zelfmoord/zelfbeschadiging. LET OP homoniemen: een woord met ook een gewone " +
    "betekenis (schatje, zaadje, nicht=familie, wippen=op de wip) laat je STAAN. Gewone woorden " +
    "(dood, bloed, ziek, oorlog, leger) blijven ook staan tenzij echt grof/expliciet. JSON array.", "veilig2");
  console.log(`Pass 5 (categorie-expliciet): ${uitCache("veilig2").size} ongepast.`);

  // ongepast.txt = unie van beide veiligheidspasses.
  // Pass 7: VOLWASSEN/SEKSUEEL onderwerp (geen scheldwoord, maar niet voor kinderen).
  // Let op: gericht op het ONDERWERP, NIET op moeilijkheid (lastige groep 7/8-woorden
  // moeten blijven).
  await keur(alleWoorden,
    "Beoordeel deze Nederlandse woorden voor een werkblad voor basisschoolkinderen (groep 3-8). " +
    "Geef UITSLUITEND de woorden terug die over een VOLWASSEN, SEKSUEEL of EROTISCH onderwerp gaan " +
    "dat niet op een kinderwerkblad hoort: seks en seksualiteit, seksuele orientatie (lesbisch, " +
    "homoseksueel, biseksueel), erotiek/porno, expliciete lichaams- of relatie-intimiteit, " +
    "prostitutie. BELANGRIJK: het gaat ALLEEN om het ONDERWERP, NIET om moeilijkheid. Een moeilijk " +
    "of abstract woord (relatie, democratie, filosofie, puberteit, verliefd) is gewoon goed en " +
    "blijft STAAN — haal niets weg omdat het lastig of 'te volwassen qua niveau' is. Alleen " +
    "seksueel/erotisch/orientatie-onderwerp eruit. Geef een JSON array van strings, geen uitleg.", "volwassen");
  console.log(`Pass 7 (volwassen onderwerp): ${uitCache("volwassen").size} eruit.`);

  // Pass 8: DISCRIMINATIE — kwetsende scheldnamen voor bevolkingsgroepen.
  // Gericht op de KWETSENDE SCHELDNAAM zelf (etnisch/religieus/herkomst), NIET op
  // de neutrale benaming. Moslim, jood, christen, allochtoon, buitenlander,
  // vluchteling, zigeuner-als-volk e.d. zijn gewone woorden (geschiedenis/
  // maatschappij groep 7/8) en blijven staan.
  await keur(alleWoorden,
    "Beoordeel deze Nederlandse woorden voor een werkblad voor basisschoolkinderen (groep 3-8). " +
    "Geef UITSLUITEND de woorden terug die een KWETSENDE SCHELDNAAM of denigrerende benaming zijn " +
    "voor een bevolkingsgroep op basis van etniciteit, huidskleur, nationaliteit, religie of " +
    "afkomst (een raciale/etnische/religieuze slur of racistisch scheldwoord). BELANGRIJK: het gaat " +
    "ALLEEN om de kwetsende scheldnaam zelf, NIET om het onderwerp en NIET om moeilijkheid. Neutrale, " +
    "gewone benamingen voor een groep of geloof (moslim, jood, christen, hindoe, allochtoon, " +
    "buitenlander, vluchteling, asielzoeker, nationaliteit-namen zoals marokkaan/turk/duitser) zijn " +
    "GEEN scheldwoord en blijven STAAN. Ook gewone woorden over huidskleur of afkomst (bruin, zwart, " +
    "blank op zichzelf) blijven staan. Alleen de echte kwetsende scheldnaam eruit. Geef een JSON " +
    "array van strings, geen uitleg.", "discriminatie");
  console.log(`Pass 8 (discriminatie/scheldnamen): ${uitCache("discriminatie").size} eruit.`);

  // Pass 9: WREEDHEID — alleen expliciete/verontrustende gruwel, NIET generiek geweld.
  // Oorlog/leger/soldaat/wapen/gevecht/dood/bloed blijven staan (geschiedenis groep 7/8).
  await keur(alleWoorden,
    "Beoordeel deze Nederlandse woorden voor een werkblad voor basisschoolkinderen (groep 3-8). " +
    "Geef UITSLUITEND de woorden terug die over EXPLICIETE of VERONTRUSTENDE WREEDHEID gaan die " +
    "niet op een kinderwerkblad hoort: martelen/marteling, verkrachten/verkrachting, onthoofden/" +
    "onthoofding, verminking, bloedbad, slachting van mensen, genocide, terreuraanslag, executie, " +
    "gruwelijke folter. BELANGRIJK: het gaat ALLEEN om expliciete, gruwelijke wreedheid, NIET om " +
    "gewoon 'geweld' en NIET om moeilijkheid. Alledaagse of geschiedenis-/nieuws-woorden over oorlog, " +
    "leger, soldaat, wapen, gevecht, ruzie, dood, bloed, ziek, ongeluk (groep 7/8) blijven gewoon " +
    "STAAN. Alleen het gruwelijke/expliciete eruit. Geef een JSON array van strings, geen uitleg.", "wreedheid");
  console.log(`Pass 9 (wreedheid): ${uitCache("wreedheid").size} eruit.`);

  // Pass 10: DRUGS / DRANK-MISBRUIK — incl. drug-straattaal; gewone woorden blijven.
  await keur(alleWoorden,
    "Beoordeel deze Nederlandse woorden voor een werkblad voor basisschoolkinderen (groep 3-8). " +
    "Geef UITSLUITEND de woorden terug die over DRUGS of DRUGSGEBRUIK gaan, of over expliciet " +
    "DRANK- of DRUGSMISBRUIK: illegale drugs en drug-straattaal (wiet, hasj, joint, blowen, coke, " +
    "cocaine, heroine, speed, xtc, junkie, dealen), en woorden over dronkenschap of verslaving " +
    "(bezopen, lazarus, verslaafd, junk). BELANGRIJK: alleen het DRUGS-/MISBRUIK-onderwerp, NIET de " +
    "moeilijkheid. Gewone, alledaagse woorden (bier, wijn, glas, fles, proost, sigaret, medicijn, " +
    "pil als medicijn, apotheek) blijven STAAN tenzij ze duidelijk over misbruik gaan. Geef een " +
    "JSON array van strings, geen uitleg.", "drugs");
  console.log(`Pass 10 (drugs/drank-misbruik): ${uitCache("drugs").size} eruit.`);

  const ongepastAll = new Set([...uitCache("ongepast"), ...uitCache("veilig2"), ...uitCache("volwassen"),
    ...uitCache("discriminatie"), ...uitCache("wreedheid"), ...uitCache("drugs")]);
  fs.writeFileSync(BRON("ongepast.txt"), [...ongepastAll].sort().join("\n"));
  console.log(`Totaal ongepast (alle passes): ${ongepastAll.size}.`);

  // ── Pass 6: Engelse namen/woorden uit de LEENWOORD-categorieen ─────────────
  const LEEN = ["c_als_s", "c_als_k", "x", "ch_sj", "th", "accent_e", "eau", "isch", "y_grieks"];
  const leenWoorden = [...new Set(LEEN.flatMap(id => (bank[id] ? bank[id].woorden.map(x => x[0]) : [])))];
  await keur(leenWoorden,
    "Hieronder staan woorden uit leenwoord-spellingcategorieen voor een NEDERLANDS spellingwerkblad " +
    "(basisschool). Geef UITSLUITEND de woorden terug die ONGESCHIKT zijn omdat het (a) een Engelse/" +
    "buitenlandse naam is (clark, nick, baxter, rex) of (b) een Engels woord dat geen gewoon " +
    "Nederlands woord is (black, truck, cross, jock, fox, relax, cool). Gewone, in het Nederlands " +
    "gangbare (leen)woorden (computer, club, contact, camera, taxi, examen, garage, cafe, thee, " +
    "politie) laat je STAAN. Geef een JSON array van strings, geen uitleg.", "engels");
  const engels = uitCache("engels");
  fs.writeFileSync(BRON("engels.txt"), [...engels].sort().join("\n"));
  console.log(`Pass 6 (leenwoorden): ${engels.size} Engelse namen/woorden van ${leenWoorden.length}.`);

  // ── Pass 11: EIGENNAMEN (kwaliteit, geen veiligheid) — voor-/plaatsnamen als
  // kleine letter eruit (kees, jan, amsterdam). Homoniemen die OOK een gewoon
  // woord zijn (roos, bas, ton, lot, wil) blijven staan. Eigen eigennamen.txt.
  await keur(alleWoorden,
    "Beoordeel deze Nederlandse woorden voor een SPELLING-werkblad (groep 3-8). Geef UITSLUITEND de " +
    "woorden terug die UITSLUITEND een EIGENNAAM zijn: een voornaam (kees, jan, sanne, mohammed), een " +
    "achternaam, of een plaats-/land-/riviernaam (amsterdam, frankrijk, parijs, rijn) — woorden die " +
    "eigenlijk alleen met een HOOFDLETTER horen en geen gewone woordbetekenis hebben. HEEL BELANGRIJK: " +
    "laat een woord STAAN als het OOK een gewoon Nederlands woord is met een kleine letter (roos=bloem, " +
    "bas=lage stem, ton=vat/1000kg, lot=noodlot, wil=willen, max=hoogstens, kim=horizon, mis, gum, " +
    "guppy, dirk=dolk). Twijfel je of het ook een gewoon woord is? Laat het dan STAAN. Geef een JSON " +
    "array van strings, geen uitleg.", "eigennaam");
  const eigennamen = uitCache("eigennaam");
  fs.writeFileSync(BRON("eigennamen.txt"), [...eigennamen].sort().join("\n"));
  console.log(`Pass 11 (eigennamen): ${eigennamen.size} voor-/plaatsnamen eruit.`);

  // (Geen open/gesloten-snoei: die categorie is breed maar correct — agent/foto/
  //  samen/alles zijn echte klankgroepenwoorden. We laten 'm staan.)

  console.log(`\nAI-oproepen: ${oproepen}  ·  kosten deze run: $${kostenTotaal.toFixed(4)} (gecachet → herhalen is gratis)`);
  console.log("Voorbeeld afgekeurde werkwoorden:", [...ww].slice(0, 15).join(", "));
  console.log("Voorbeeld verkapte werkwoorden (spelling):", [...vormen].slice(0, 15).join(", "));
})();

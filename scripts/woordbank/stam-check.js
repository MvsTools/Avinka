/* Droogloop: zoekt woorden in de woordbank die een "heftige stam" BEVATTEN
   (samenstellingen die door de hele-woord-blocklist glippen, bv. bommenwerper).
   Draai: node scripts/woordbank/stam-check.js
   Doel: valse treffers spotten VOORDAT we de stam-check in bouw.js vastzetten. */
const fs = require("fs");
const path = require("path");

// Lange, ondubbelzinnige stammen. Kort/ambigu (bom, mes, gif) bewust NIET:
// die matchen te veel onschuldigs (mest, kermis). Hele-woord-varianten daarvan
// zitten al in de harde BLOCK van bouw.js.
const STAMMEN = [
  // geweld / oorlog / dood
  "moord", "wapen", "bommen", "geweer", "kogel", "granaat", "explos", "aanslag",
  "terror", "ontvoer", "gijzel", "martel", "mishandel", "onthoofd", "wurg",
  "slachting", "bloedbad", "executie", "executeer", "lynch", "kruisig", "gesneuveld",
  "sneuvel", "veldslag", "loopgraaf", "concentratiekamp", "genocide", "holocaust",
  // seksueel / intiem
  "seks", "porno", "erotie", "erotisch", "incest", "pedofiel", "prostitu", "bordeel",
  "orgie", "masturb", "condoom", "verkracht", "aanrand", "geslachtsdeel",
  // drugs / verslaving
  "cocaine", "heroine", "verslaaf", "junkie", "overdosis", "drugs", "wietplant",
  // scheldwoord-stammen
  "kanker", "godverd",
];

const bank = require(path.join(__dirname, "woordenbank.json")).categorieen;
const alle = new Map(); // woord -> Set(categorieen)
for (const k of Object.keys(bank)) {
  const arr = Array.isArray(bank[k]) ? bank[k] : (bank[k].woorden || []);
  for (const x of arr) {
    const w = Array.isArray(x) ? x[0] : x;
    if (!alle.has(w)) alle.set(w, new Set());
    alle.get(w).add(k);
  }
}

let totaalTreffers = 0;
const perStam = {};
for (const [w] of alle) {
  for (const s of STAMMEN) {
    if (w.includes(s)) { (perStam[s] = perStam[s] || []).push(w); totaalTreffers++; break; }
  }
}

console.log("Woorden in bank (uniek):", alle.size);
console.log("Getroffen door een heftige stam:", totaalTreffers, "\n");
for (const s of STAMMEN) {
  if (!perStam[s]) continue;
  console.log("[" + s + "] (" + perStam[s].length + "): " + perStam[s].sort().join(", "));
}

/* Avinka — woordbank-bouwer (build-time, Node). VOLLEDIGE BOUW.
 *
 * Bouwt een eigen spelling-woordenbank uit OPEN bronnen. GEEN methode-materiaal.
 *   OpenTaal-woordenlijst  (BSD-3 / CC-BY-3.0, Stichting OpenTaal) -> correcte spelling
 *   hermitdave nl_50k freq (CC-BY-SA-4.0, OpenSubtitles)           -> komt het voor? + niveau
 *
 * PRINCIPE (met de eigenaar uitgedacht):
 *  - Wij roosteren GEEN categorieen per groep (dat doet de methode/leerkracht).
 *    De gevraagde doelcategorie wordt altijd gehonoreerd.
 *  - Onze leermomenten-tabel (algemeen, SLO-gekalibreerd, methode-neutraal) bewaakt
 *    alleen de ACHTERGROND: een woord mag in de pool van categorie X bij groep G
 *    als elk ANDER ingredient (niet X zelf) <= groep G is. Bewust voorzichtig:
 *    zit het ernaast, dan de veilige kant op (hooguit iets te makkelijk woord).
 *  - Werkwoordsvormen horen in een latere aparte bank en worden hier uitgesloten.
 *
 * Output: woordenbank.json (leest de tool straks) + een runrapport op de console.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const BRON = (f) => path.join(__dirname, "_bron", f);
const DATUM = "2026-06-29";

const OPEN_LIJST = fs.readFileSync(BRON("opentaal-wordlist.txt"), "utf8").split(/\r?\n/).filter(Boolean);
const OPENTAAL = new Set(OPEN_LIJST);
const RANG = new Map();
fs.readFileSync(BRON("nl_frequentie_50k.txt"), "utf8").split(/\r?\n/).filter(Boolean).forEach((r, i) => {
  const w = r.split(/\s+/)[0]; if (w && !RANG.has(w)) RANG.set(w, i + 1);
});
// Werkwoordsvormen (gemaakt door werkwoorden.js) om uit de spellingbank te strepen.
let WERKWVORMEN = new Set();
try { WERKWVORMEN = new Set(fs.readFileSync(BRON("werkwoordsvormen.txt"), "utf8").split(/\r?\n/).filter(Boolean)); } catch (e) {}
// Extra verkapte werkwoorden die de AI-controle (ai-controle.js) vond.
try { fs.readFileSync(BRON("extra-werkwoordsvormen.txt"), "utf8").split(/\r?\n/).filter(Boolean).forEach(w => WERKWVORMEN.add(w)); } catch (e) {}
// Ongepaste woorden (AI-veiligheidscheck) — overal weren.
let ONGEPAST = new Set();
try { ONGEPAST = new Set(fs.readFileSync(BRON("ongepast.txt"), "utf8").split(/\r?\n/).filter(Boolean)); } catch (e) {}
// Engelse namen/woorden uit de leenwoord-categorieen (AI) — overal weren.
try { fs.readFileSync(BRON("engels.txt"), "utf8").split(/\r?\n/).filter(Boolean).forEach(w => ONGEPAST.add(w)); } catch (e) {}
// Eigennamen (voor-/plaatsnamen als kleine letter, AI, kwaliteit) — overal weren.
try { fs.readFileSync(BRON("eigennamen.txt"), "utf8").split(/\r?\n/).filter(Boolean).forEach(w => ONGEPAST.add(w)); } catch (e) {}
// Handmatig geweerd (eigenaar-review) — beschermd, ai-controle.js raakt dit NIET aan.
try { fs.readFileSync(BRON("ongepast-handmatig.txt"), "utf8").split(/\r?\n/).map(s => s.trim()).filter(w => w && !w.startsWith("#")).forEach(w => ONGEPAST.add(w)); } catch (e) {}
// Woorden die GEEN klankgroepenwoord zijn — alleen uit open_gesloten weren.
let GEEN_KLANKGROEP = new Set();
try { GEEN_KLANKGROEP = new Set(fs.readFileSync(BRON("geen-klankgroep.txt"), "utf8").split(/\r?\n/).filter(Boolean)); } catch (e) {}
// Vervoegingen/verbuigingen (AI-classificatie) — NIET weren, maar labelen ("v")
// zodat de tool grondvormen en vervoegingen los kan aanbieden.
let VERVOEGING = new Set();
try { VERVOEGING = new Set(fs.readFileSync(BRON("vervoegingen.txt"), "utf8").split(/\r?\n/).filter(Boolean)); } catch (e) {}
// Toegestaan-lijst: woorden die de AI-check te streng weghaalde maar wél mogen
// (bv. wippen = op de wip). Overrulet de AI-ongepast-lijst, NOOIT de harde blocklist.
let TOEGESTAAN = new Set();
try { TOEGESTAAN = new Set(fs.readFileSync(path.join(__dirname, "toegestaan.txt"), "utf8").split(/\r?\n/).map(s => s.trim()).filter(w => w && !w.startsWith("#"))); } catch (e) {}
// "Extra gevoelig" (eigenaar-lijst): woorden die MOGEN blijven maar waar de tools
// een zachte, kindvriendelijke context bij moeten kiezen. Weert niks; wordt als
// window.avinkaGevoelig meegepubliceerd zodat de prompt er extra op kan letten.
let GEVOELIG = new Set();
try { GEVOELIG = new Set(fs.readFileSync(BRON("gevoelig.txt"), "utf8").split(/\r?\n/).map(s => s.trim()).filter(w => w && !w.startsWith("#"))); } catch (e) {}
// Betekenis-/woordenschatvloer per woord (AI-niveaupas, ai-controle.js) — bepaalt
// mede vanaf welke groep een woord mag, los van de spelling-moeilijkheid.
let NIVEAU = {};
try { NIVEAU = JSON.parse(fs.readFileSync(BRON("niveau.json"), "utf8")); } catch (e) {}
// Handmatige niveau-correcties (eigenaar), regels "woord=groep" of "woord 6".
// Winnen altijd van de AI-niveaupas. # = commentaar.
try {
  fs.readFileSync(BRON("niveau-handmatig.txt"), "utf8").split(/\r?\n/).forEach(r => {
    r = r.trim(); if (!r || r.startsWith("#")) return;
    const m = r.match(/^([a-zà-ÿ]+)\s*[=\s]\s*([3-8])$/i);
    if (m) NIVEAU[m[1].toLowerCase()] = +m[2];
  });
} catch (e) {}
function semantiekVloer(w) { const g = NIVEAU[w]; return (g >= 3 && g <= 8) ? g : 0; }

const KLINKERS = "aeiouyàáâäèéêëìíîïòóôöùúûü";
function lettergrepen(w) {
  const m = w.toLowerCase().replace(/ij/g, "I").match(new RegExp("[" + KLINKERS + "]+|I", "g"));
  return m ? m.length : 1;
}


// ── Leermomenten-tabel: spelling-ingredienten met "vanaf groep" ───────────────
// Algemeen/SLO-gekalibreerd, methode-neutraal. `doel` = wordt als oefenlijst
// aangeboden; verschijnselen zonder `doel` tellen alleen mee als achtergrond.
// `soort`: orthografisch (regex op letters = betrouwbaar) of fonetisch (klank
// nodig = benadering, later met AI/handcheck te verfijnen).
const ING = [
  // ── groep 3: klank/eerste vaste klankgroepen
  // Hakwoord = woord van ÉÉN lettergreep/klankgroep dat je "hakt" in klanken: kat, bal,
  // rij, rijk, trein, school. De vanaf-groep volgt uit een eventuele ANDERE eigenschap
  // (ei/ij -> groep 4), dus kat=groep 3, rijk=groep 4. LET OP: na de bouw filteren we deze
  // categorie (zie post-pass onderaan) tot alleen de woorden die óók in een ANDERE, al-geschoonde
  // categorie zitten (rij=ei/ij, bank=nk, school=sch) ∪ de handmatige mkm-kernlijst — zo erven we
  // alleen gevette woorden en niet de losse werkwoordsvormen/functiewoorden/Engelse leenwoorden
  // die als enige-lettergreep-woord anders massaal binnenkomen (gaat, komt, boy, team, uit).
  { id: "hakwoord", g: 3, doel: 1, soort: "fonetisch", label: "hakwoorden (woorden van één klankgroep, zoals kat, bal, rij)", test: w => lettergrepen(w) === 1 },
  // Staal splitst dit: zingwoord = ng (zingen, koning), plankwoord = nk (plank, bank).
  // NIET de "ng" op een woordgrens (on+gehoorzaam, aan+geven): dat is geen ng-KLANK.
  { id: "ng", g: 3, doel: 1, soort: "orthografisch", label: "woorden met ng (zoals zingen, koning)", test: w => /ng/.test(w) && !/^(on|aan)g/.test(w) },
  { id: "nk", g: 3, doel: 1, soort: "orthografisch", label: "woorden met nk (zoals plank, bank)", test: w => /nk/.test(w) },
  { id: "sch", g: 3, doel: 1, soort: "orthografisch", label: "woorden met sch", test: w => /sch/.test(w) && !/isch/.test(w) },
  { id: "cht", g: 3, doel: 1, soort: "orthografisch", label: "woorden met cht (korte klank + cht)", test: w => /cht/.test(w) },
  { id: "eer_oor_eur", g: 3, doel: 1, soort: "orthografisch", label: "woorden met eer, oor of eur", test: w => /eer|oor|eur/.test(w) },
  // Apart houden zodat je "aai", "ooi" of "oei" los kunt oefenen (of alle drie samen).
  { id: "aai", g: 3, doel: 1, soort: "orthografisch", label: "woorden met aai (je hoort /j/, je schrijft i)", test: w => /aai/.test(w) },
  { id: "ooi", g: 3, doel: 1, soort: "orthografisch", label: "woorden met ooi (je hoort /j/, je schrijft i)", test: w => /ooi/.test(w) },
  { id: "oei", g: 3, doel: 1, soort: "orthografisch", label: "woorden met oei (je hoort /j/, je schrijft i)", test: w => /oei/.test(w) },
  { id: "eeuw_ieuw", g: 3, doel: 1, soort: "orthografisch", label: "woorden met eeuw of ieuw", test: w => /eeuw|ieuw/.test(w) },
  // ── groep 4: ei/ij, au/ou, open/gesloten, voor-/achtervoegsel, langer maken
  { id: "ei_ij", g: 4, doel: 1, soort: "orthografisch", label: "woorden met ei of ij (weetwoorden)", test: w => /(^|[^o])ei|ij/.test(w) },
  { id: "au_ou", g: 4, doel: 1, soort: "orthografisch", label: "woorden met au of ou (weetwoorden)", test: w => /au|ou/.test(w) },
  { id: "open_gesloten", g: 4, doel: 1, soort: "fonetisch", label: "open en gesloten lettergreep (verdubbelen of verlengen)", test: w => openGesloten(w) },
  // voorvoegsel: NIET elk woord dat toevallig met be/ge/ver/ont/her begint (gek, bel,
  // bed) — alleen als het deel ná het voorvoegsel een bestaand woord is (ge+bouw, ver+haal).
  { id: "voorvoegsel", g: 4, doel: 1, soort: "orthografisch", label: "woorden met een voorvoegsel (be-, ge-, ver-, ont-, her-)", test: w => heeftVoorvoegsel(w) },
  // achtervoegsel: -ig/-lijk, maar NIET korte toevalstreffers (big, lig, wig) of de
  // tig-getallen (twintig, dertig). Lengte-ondergrens + getal-uitsluiting.
  { id: "achtervoegsel", g: 4, doel: 1, soort: "orthografisch", label: "woorden op -ig of -lijk", test: w => (/lijk(e|heid|er|st)?$/.test(w) && w.length >= 6) || (/ig(e|heid|er|st)?$/.test(w) && w.length >= 5 && !/^(twin|der|veer|vijf|zes|zeven|tach|negen)tig/.test(w)) },
  { id: "langermaak_d", g: 4, doel: 1, soort: "fonetisch", label: "woorden die op een /t/-klank eindigen maar met d (langer maken)", test: w => langermaakD(w) },
  // ── groep 5: verkleinwoord, f->v, s->z, samenstelling
  { id: "verkleinwoord", g: 5, doel: 1, soort: "orthografisch", label: "verkleinwoorden (-je, -tje, -etje, -pje, -kje)", test: w => isVerkleinwoord(w) },
  { id: "f_naar_v", g: 5, doel: 1, soort: "fonetisch", label: "woorden op /f/ die met v worden verlengd (duif -> duiven)", test: w => verlengtNaar(w, "f", "v") },
  { id: "s_naar_z", g: 5, doel: 1, soort: "fonetisch", label: "woorden op /s/ die met z worden verlengd (huis -> huizen)", test: w => verlengtNaar(w, "s", "z") },
  { id: "samenstelling", g: 5, doel: 0, soort: "structuur", label: "samenstelling", test: w => isSamenstelling(w) },
  // ── groep 6: c, -tie, -isch (weetwoorden)
  // De c maakt de /s/ zelf (cent, citroen): c vóór e/i/y. NIET na een s (scene, scenario):
  // daar maakt de s de /s/-klank, niet de c — dat is geen c-als-/s/-woord.
  { id: "c_als_s", g: 6, doel: 1, soort: "fonetisch", label: "de c die klinkt als /s/ (cent, citroen)", test: w => /(^|[^s])c[eiy]/.test(w) },
  // De c maakt de /k/ zelf (cola, cactus, club): c vóór a/o/u of in cl/cr. GEEN ck
  // (ticket, snack, stick): daar komt de /k/ uit de ck-digraaf, niet uit een losse c.
  { id: "c_als_k", g: 6, doel: 1, soort: "fonetisch", label: "de c die klinkt als /k/ (cola, cactus)", test: w => /c[aou]|c[lr]/.test(w) },
  { id: "tie", g: 6, doel: 1, soort: "orthografisch", label: "woorden op -tie (je hoort /(t)sie/)", test: w => /tie$|ties$/.test(w) },
  { id: "isch", g: 6, doel: 1, soort: "orthografisch", label: "woorden op -isch (je hoort /ies/)", test: w => /isch/.test(w) },
  // ── groep 7/8: leenwoorden / bijzonder
  { id: "x", g: 7, doel: 1, soort: "orthografisch", label: "de x die je als /ks/ hoort (taxi, examen)", test: w => /x/.test(w) },
  { id: "th", g: 7, doel: 1, soort: "orthografisch", label: "de th die je als /t/ hoort (thee, thema)", test: w => /th/.test(w) },
  { id: "ch_sj", g: 7, doel: 1, soort: "fonetisch", label: "de ch die klinkt als /sj/ (chef, machine)", test: w => /ch/.test(w) && !/sch|cht/.test(w) },
  { id: "eau", g: 8, doel: 1, soort: "orthografisch", label: "woorden met -eau (je hoort /oo/)", test: w => /eau/.test(w) },
  { id: "accent_e", g: 8, doel: 1, soort: "orthografisch", label: "woorden met een accentstreepje op de e (café, privé)", test: w => /[éèê]/.test(w) },
  // Griekse y = y als klinker MIDDEN in het woord (systeem, type, cyclus), NIET de
  // Engelse -y aan het eind (baby, party, pony, hobby) en niet de ij.
  { id: "y_grieks", g: 8, doel: 1, soort: "orthografisch", label: "woorden met de Griekse y", test: w => /y/.test(w) && !/ij/.test(w) && !/y$/.test(w) },
  // Woorden die op -y eindigen (je hoort /ie/, je schrijft y): baby, pony, hobby, lolly.
  // Medeklinker + y aan het eind (geen -ay/-oy/-ey/-uy, die klinken anders).
  { id: "y_eind", g: 7, doel: 1, soort: "orthografisch", label: "woorden die eindigen op -y (je hoort /ie/, je schrijft y)", test: w => /[bcdfghjklmnpqrstvz]y$/.test(w) },
  // Tremawoord (Staal): trema markeert een nieuwe lettergreep (ruïne, egoïst, patiënt, ideeën).
  { id: "trema", g: 7, doel: 1, soort: "orthografisch", label: "woorden met een trema (ë, ï, ö)", test: w => /[ëïöü]/.test(w) },
];
const ING_BY_ID = Object.fromEntries(ING.map(i => [i.id, i]));
const DOELEN = ING.filter(i => i.doel);

// open/gesloten lettergreep (verdubbelen/verlengen). Verdubbeling (dubbele
// medeklinker) is betrouwbaar; de "verlenging" (bo-men) blijft fonetisch lastig,
// dus beperkt tot korte tweelettergrepige woorden om de ruis te dempen.
// Klankgroepenwoord (open/gesloten lettergreep). De regel gaat over de lettergrepen
// ÍN het woord zelf: een dubbele medeklinker hoort bij een gesloten klankgroep
// (kof-fie, pro-fes-sor, bak-ker), of een open klankgroep met één klinker + medeklinker
// (wa-ter, ta-fel, ka-mer). Bewust ruim gehouden — niet elk woord hoeft een meervoud te
// vormen; het gaat om de klankgroep-spelling.
function openGesloten(w) {
  if (/([bcdfgklmnprstvz])\1/.test(w)) return true; // verdubbeling (gesloten klankgroep)
  return lettergrepen(w) === 2 && w.length <= 7 &&
    /^[bcdfghjklmnprstvwz]*[aeou][bcdfghjklmnprstvwz][aeiouy]/.test(w) &&
    !/(aa|ee|oo|uu|oe|eu|ie|ei|ij|ou|au|ui|aai|ooi|oei)/.test(w);
}

// f->v / s->z verlenging: betrouwbaar te checken door de ECHTE verbogen vorm in
// OpenTaal op te zoeken (duif->duiven bestaat; jas->jazen bestaat niet). Houdt
// rekening met het verenkelen van de dubbele klinker (roos->rozen, doof->doven).
function verlengtNaar(w, eind, vervang) {
  if (!w.endsWith(eind) || w.length < 4) return false;
  const stam = w.slice(0, -1);
  const enkel = stam.replace(/(aa|ee|oo|uu)([^aeiou]*)$/, (m, vv, rest) => vv[0] + rest);
  const kand = [stam + vervang + "en", stam + vervang + "e"];
  if (enkel !== stam) kand.push(enkel + vervang + "en", enkel + vervang + "e");
  return kand.some(k => OPENTAAL.has(k));
}
// langer maken: /t/-klank aan het eind maar met d (hand->handen). Check de
// verbogen vorm in OpenTaal i.p.v. de klank te raden.
function langermaakD(w) {
  if (!/d$/.test(w) || /dd$/.test(w) || w.length < 4) return false;
  const enkel = w.replace(/(aa|ee|oo|uu)([^aeiou]*)$/, (m, vv, rest) => vv[0] + rest);
  const kand = [w + "en"];
  if (enkel !== w) kand.push(enkel + "en");
  return kand.some(k => OPENTAAL.has(k));
}
function heeftVoorvoegsel(w) {
  var m = w.match(/^(be|ge|ver|ont|her)(.+)/);
  return !!m && m[2].length >= 3 && OPENTAAL.has(m[2]);
}
function isVerkleinwoord(w) {
  const m = w.match(/(etje|pje|kje|tje|je)$/);
  if (!m) return false;
  const stam = w.slice(0, -m[0].length);
  return stam.length >= 2 && (OPENTAAL.has(stam) || OPENTAAL.has(stam + "e"));
}
function isSamenstelling(w) {
  for (let i = 3; i <= w.length - 3; i++) {
    const a = w.slice(0, i), b = w.slice(i), ra = RANG.get(a), rb = RANG.get(b);
    if (OPENTAAL.has(a) && OPENTAAL.has(b) && ra && rb && ra < 20000 && rb < 20000) return true;
  }
  return false;
}

// ── Werkwoordsvormen uitsluiten (gaan naar de latere werkwoord-bank) ──────────
const WERKW = new Set([
  "dacht","dachten","gedacht","kocht","kochten","gekocht","bracht","brachten","gebracht",
  "zocht","zochten","gezocht","vocht","vochten","gevochten","mocht","mochten","wachtte","wachtten",
  "gewacht","richtte","richtten","gericht","vluchtte","gevlucht","zuchtte","gezucht","lachte","lachten",
  "gelachen","juichte","juichten","gejuicht","kuchte","gekucht","smachtte","verwachtte","verwacht",
  "bezocht","onderzocht","verkocht","verkochten","gebiecht","biechtte","stichtte","gesticht"
]);
const VOORV = /^(aan|af|be|door|in|mee|na|om|onder|ont|op|over|uit|ver|voor|her|te|toe)/;
function isWerkwoordsvorm(w) {
  if (kerntestWerkw(w)) return true;
  const m = w.match(VOORV);
  if (m) { const rest = w.slice(m[0].length); if (rest.length >= 3 && kerntestWerkw(rest)) return true; }
  return false;
}
function kerntestWerkw(w) {
  if (WERKW.has(w)) return true;
  if (/(tte|dde)$/.test(w)) return true;
  if (/cht$/.test(w) && OPENTAAL.has(w.slice(0, -1))) return true; // lach -> lacht
  if (/^ge.+(en|t|d)$/.test(w) && OPENTAAL.has(w.replace(/^ge/, "") + "en")) return true;
  return false;
}

// ── Blocklist (ongepast voor kinderen) ────────────────────────────────────────
const BLOCK = new Set([
  // geweld / dood
  "dood","dode","doden","lijk","lijken","moord","moorden","vermoord","wapen","wapens","geweer",
  "bom","bommen","mes","messen","bloed","bloederig","gevecht","gevechten","slachten","slachthuis",
  "afslachten","afgeslacht","gelyncht","lynchen","beul","galg","gif","gifte","vergif",
  // seksueel / intiem
  "seks","seksueel","sexy","naakt","naakte","bloot","blote","borst","borsten","kont","poep","plas",
  "verkracht","verkrachten","verkrachte","hoer","hoertje","hoeren","lichtekooi","pik","penis","vagina",
  "condoom","zwanger","bevrucht","bevruchten","bevruchte","drachtig",
  // drugs / verslaving
  "drug","drugs","wiet","hasj","cocaine","heroine","dronken","dronk","zat","kater","verslaafd","verslaving",
  // scheldwoorden / naar
  "kut","lul","kanker","tering","tyfus","sukkel","idioot","debiel","mongool","stom","stomme","scheet",
  "echtscheiding","echtgenoot","echtbreuk","hebzucht","wraakzucht","ontucht","overspel",
  "tiet","tieten","reet","kont","scheten","piemel","tepel","tepels","slet","del","trut","mietje",
  // gevloek / grof (komt uit de ondertitel-frequentielijst)
  "verdomme","godverdomme","godver","godverdorie","verdomd","verdomde","verrek","verrekte",
  "klootzak","klootzakken","kloot","kloten","klote","klere","sodemieter","sodeju","kut","kutten",
  "neuk","neuken","neukt","neukte","hoer","hoeren","hoertje","pik","pijp","pijpen","kont","reet",
  "schijt","schijten","stront","kak","kakken","pis","pies","pissen","flikker","flikkers","teef","teven",
  "klootviool","mongolen","kankeren","optyfen","oprotten","oprot","mafkees","eikel","eikels","sukkels",
  // gecureerd uit de LDNOOBW NL-scheldwoordenlijst (onschuldige homoniemen als
  // schatje/zaadje/nicht/wippen bewust NIET geweerd):
  "aso","beffen","naaien","ouwehoeren","piesen","pijpen","poepen","rukken","verkloten","verneuken","vingeren","zeiken",
  // volwassen/seksueel onderwerp (geen scheldwoord, maar niet voor een kinderwerkblad):
  "lesbisch","homoseksueel","homoseksualiteit","homo","homos","biseksueel","seks","seksueel","seksuele","seksualiteit",
  "erotisch","erotiek","orgasme","porno","pornografie","condoom","condooms","prostituee","prostitutie","bordeel",
  "vagina","penis","clitoris","masturberen","vrijen","geslachtsdeel","geslachtsgemeenschap","seksen","viagra",
  // verontrustend medisch / zwaar volwassen onderwerp (gevonden via steekproef-audit):
  "uitzaaiing","uitzaaiingen","seropositief","eunuch","exorcist","gijzeling","gijzelen","gynaecologie","pneumothorax",
  // te zeldzaam / niet-passend / ongemakkelijk voor een kinderwerkblad (handmatig na
  // review van gegenereerde spellingwerkbladen, 1-7-2026): celstraf/celgenoot (gevangenis),
  // celibaat/celibatair (seksueel-getint), en losse rare/onbekende woorden.
  "cel","celstraf","celgenoot","cellen","celibaat","celibatair","celibataire","narcisme","narcist","narcistisch",
  "dolce","specifieks","exorcisme","eunuchen","bordeelhouder","maffia","maffiabaas",
  // Engelse woorden die toevallig een NL-spellingcategorie raken maar er niet in horen:
  "ice","nice","price","choice","voice","peace","please","cheese","cheer","race","space","dance","place","face",
  // mild volwassen bijklank, niet voor groep 7:
  "hartstocht","hartstochtelijk","hartstochten",
]);
// ── Stam-vangnet: samenstellingen/verbuigingen die door de hele-woord-BLOCK
// glippen (bommenwerper matcht "bom"/"bommen" niet). Alleen LANGE, ondubbelzinnige
// stammen — korte/ambigue (bom, mes, gif) matchen te veel onschuldigs (mest, kermis)
// en horen als heel woord in BLOCK. Getest via stam-check.js: 0 valse treffers.
// TOEGESTAAN (toegestaan.txt) kan een enkele valse treffer alsnog vrijgeven.
const STAM_BLOCK = [
  // geweld / oorlog / dood
  "moord","wapen","bommen","geweer","kogel","granaat","explos","aanslag",
  "terror","ontvoer","gijzel","martel","mishandel","onthoofd","wurg",
  "slachting","bloedbad","executie","executeer","lynch","kruisig","gesneuveld",
  "sneuvel","veldslag","loopgraaf","concentratiekamp","genocide","holocaust",
  // seksueel / intiem
  "seks","porno","erotie","erotisch","incest","pedofiel","prostitu","bordeel",
  "orgie","masturb","condoom","verkracht","aanrand","geslachtsdeel",
  // drugs / verslaving
  "cocaine","heroine","verslaaf","junkie","overdosis","drugs","wietplant",
  // scheldwoord-stammen
  "kanker","godverd",
];
function bevatHeftigeStam(w) { for (const s of STAM_BLOCK) if (w.includes(s)) return true; return false; }
// Frequentieplafond: woorden die zeldzamer zijn dan deze rang laten we NIET toe
// (verjonging — houd het bij woorden die kinderen echt kennen). Tunebaar.
// (24k->40k getest 4-7: voegde vooral te moeilijke/vreemde/ongepaste woorden toe
//  — gecastreerd, cougar, sarcofaag — dus teruggedraaid. De bank was al Staal-formaat.)
const MAX_RANG = 24000;

function kindgeschikt(w, staWerkwToe) {
  if (!/^[a-zà-ÿ]+$/.test(w)) return false;
  if (w.length < 3 || w.length > 12) return false;
  if (!RANG.has(w)) return false;
  if (RANG.get(w) < 60) return false;   // de allerfrequentste = functiewoorden (de, het, hij, zijn) - geen oefenwoord
  if (RANG.get(w) >= MAX_RANG) return false; // te zeldzaam voor een kinderwerkblad (verjonging)
  if (BLOCK.has(w)) return false;                          // harde blocklist: nooit terug
  if (ONGEPAST.has(w) && !TOEGESTAAN.has(w)) return false;  // AI-ongepast, tenzij toegestaan
  if (bevatHeftigeStam(w) && !TOEGESTAAN.has(w)) return false; // samenstelling/verbuiging van een heftige stam
  if (!staWerkwToe) {
    if (WERKWVORMEN.has(w)) return false;   // gegenereerde werkwoordsvormen (werkwoorden.js)
    if (isWerkwoordsvorm(w)) return false;
  }
  return true;
}

function freqFloor(w) {
  const r = RANG.get(w);
  if (r < 4000) return 3; if (r < 9000) return 4; if (r < 16000) return 5;
  if (r < 26000) return 6; if (r < 40000) return 7; return 8;
}

// ── Bouw ──────────────────────────────────────────────────────────────────────
const banken = {}; // catId -> { ...meta, woorden: [[w, vanaf], ...] }
for (const d of DOELEN) banken[d.id] = { label: d.label, soort: d.soort, introGroep: d.g, woorden: [] };

let nBump = 0, bumpSom = 0; // woord-slots die de betekenisvloer omhoog duwde
const kandidaten = OPEN_LIJST.filter(kindgeschikt);
for (const w of kandidaten) {
  const ings = ING.filter(i => i.test(w));
  if (!ings.length) continue;
  const ff = freqFloor(w);
  for (const ing of ings) {
    if (!ing.doel) continue;
    if (ing.id === "open_gesloten" && GEEN_KLANKGROEP.has(w)) continue; // AI: geen echt klankgroepenwoord
    // achtergrond = zwaarste ANDER ingredient (de doelcategorie zelf telt niet mee)
    const achtergrond = ings.filter(i => i.id !== ing.id).map(i => i.g);
    // vanaf = zwaarste van: spelling-achtergrond, frequentie-vloer, betekenisvloer.
    const basisVanaf = Math.max(3, ff, achtergrond.length ? Math.max(...achtergrond) : 0);
    const sem = semantiekVloer(w);
    const vanaf = Math.max(basisVanaf, sem);
    if (sem > basisVanaf) { nBump++; bumpSom += (vanaf - basisVanaf); }
    // Verkleinwoorden in hun eigen categorie zijn het doel, geen "vervoeging".
    const isVerv = VERVOEGING.has(w) && ing.id !== "verkleinwoord";
    banken[ing.id].woorden.push(isVerv ? [w, vanaf, "v"] : [w, vanaf]);
  }
}
for (const id in banken) banken[id].woorden.sort((a, b) => a[1] - b[1] || RANG.get(a[0]) - RANG.get(b[0]) || a[0].localeCompare(b[0]));

// ── Kleine banken aanvullen met INFINITIEVEN (werkwoorden op -en) ─────────────
// Klank-categorieen zoals aai/ooi/oei zijn erg klein omdat we werkwoorden weren, terwijl
// juist veel aai-woorden werkwoorden zijn (draaien, gooien, groeien). Een INFINITIEF is een
// schoon oefenwoord zonder werkwoordspelling-valkuil (geen +t/+dt/+de), dus die laten we
// voor KLEINE banken alsnog toe. Conjugaties/participia op -t/-d blijven geweerd.
const KLEIN_DREMPEL = 60;
const infinitieven = OPEN_LIJST.filter(w => /en$/.test(w) && w.length >= 4 && !kindgeschikt(w) && kindgeschikt(w, true));
let nInf = 0;
for (const d of DOELEN) {
  const b = banken[d.id];
  if (b.woorden.filter(x => x[2] !== "v").length >= KLEIN_DREMPEL) continue; // alleen kleine banken
  const heeft = new Set(b.woorden.map(x => x[0]));
  for (const w of infinitieven) {
    if (heeft.has(w) || !d.test(w)) continue;
    if (d.id === "open_gesloten" && GEEN_KLANKGROEP.has(w)) continue;
    const achtergrond = ING.filter(i => i.test(w) && i.id !== d.id).map(i => i.g);
    const vanaf = Math.max(3, freqFloor(w), achtergrond.length ? Math.max(...achtergrond) : 0, semantiekVloer(w));
    b.woorden.push([w, vanaf]); heeft.add(w); nInf++;
  }
  // Ruim losse VERVOEGINGEN/DEELWOORDEN op die door het werkwoordfilter lekten (draait,
  // draaide, gedraaid, genaaid, bezaaid): houd de infinitief (op -en) + het naamwoord.
  b.woorden = b.woorden.filter(x => {
    const w = x[0];
    // deelwoord op cluster+d met een werkwoord-voorvoegsel (gedraaid, omgedraaid, bezaaid, vermoeid)
    if (/(aai|ooi|oei)d$/.test(w) && /^(ge|be|ver|ont|her|over|onder|aan|op|uit|af|in|door|om|mee|toe|weg|na|voor)/.test(w)) return false;
    // tegenwoordige/verleden tijd (draait/draaide/draaiden) ALS we de infinitief hebben
    var m = w.match(/(aai|ooi|oei)(t|de|te|den|ten|dt)$/);
    if (m && heeft.has(w.slice(0, w.length - m[2].length) + "en")) return false;
    return true;
  });
  b.woorden.sort((a, b2) => a[1] - b2[1] || RANG.get(a[0]) - RANG.get(b2[0]) || a[0].localeCompare(b2[0]));
}

// ── Hakwoord opschonen: één klankgroep ÉN geen echte spellingregel ────────────
// Een hakwoord is een woord van ÉÉN klankgroep dat verder GEEN eigen spellingregel heeft:
// de kale klankzuivere woorden (kat, bal, vis) plus de weetwoorden die geen echte regel
// kennen (ei/ij: rij, mij; au/ou: nou, koud). Een woord met cht/ng/nk/sch/c/x/... hoort in
// DIE categorie (licht=cht, bank=nk, school=sch, zing=ng) en is dus GEEN hakwoord.
//   - ei/ij en au/ou tellen NIET als regel: het zijn weetwoorden, geen echte categorie.
//   - f->v en s->z tellen OOK niet: het BASISwoord is klankzuiver (glas, wolf, huis); de
//     v/z komt pas in het MEERVOUD (glas->glazen, wolf->wolven). Het singuliere woord is
//     dus gewoon een hakwoord; de meervoudsregel is een aparte, latere les.
//   - de kale klankzuivere kern komt uit de handmatige mkm-kernlijst (_bron/hakwoord.txt),
//     want die woorden vallen per definitie in géén categorie, en de ruwe enig-lettergreep-
//     lijst zit vol losse werkwoordsvormen/functiewoorden/Engelse woorden (gaat, uit, boy).
const NIET_DISKWALIFICEREND = new Set(["ei_ij", "au_ou", "f_naar_v", "s_naar_z"]);
const eenLettergreepRegel = new Set(); // 1-klankgroep-woorden mét een ECHTE regel-categorie in het BASISwoord
for (const id in banken) {
  if (id === "hakwoord" || NIET_DISKWALIFICEREND.has(id)) continue;
  for (const [w] of banken[id].woorden) if (lettergrepen(w) === 1) eenLettergreepRegel.add(w);
}
const weetEenLettergreep = new Set(); // 1-klankgroep ei/ij + au/ou + f->v + s->z (mogen hakwoord zijn)
for (const id of NIET_DISKWALIFICEREND) for (const [w] of banken[id].woorden) if (lettergrepen(w) === 1) weetEenLettergreep.add(w);

let hakKernlijst = new Set();
try {
  fs.readFileSync(BRON("hakwoord.txt"), "utf8").split(/\r?\n/)
    .map(s => s.trim().toLowerCase()).filter(w => w && !w.startsWith("#"))
    .forEach(w => hakKernlijst.add(w));
} catch (e) { console.log("hakwoord.txt niet gevonden:", e.message); }

// Regel: één klankgroep, GEEN echte regel-categorie, en óf weetwoord (ei/ij, au/ou) óf kernlijst.
function isHakwoord(w) {
  if (eenLettergreepRegel.has(w)) return false;       // heeft een eigen regel -> hoort in die categorie
  return weetEenLettergreep.has(w) || hakKernlijst.has(w);
}
const hakVoor = banken.hakwoord.woorden.length;
const kernAfgevallen = [...hakKernlijst].filter(w => eenLettergreepRegel.has(w)); // kernlijst-woorden met tóch een regel
banken.hakwoord.woorden = banken.hakwoord.woorden.filter(x => isHakwoord(x[0]));
// Kernlijst-woorden die kindgeschikt niet haalde (net buiten het frequentieplafond) alsnog toevoegen.
const heeftHak = new Set(banken.hakwoord.woorden.map(x => x[0]));
let nKernExtra = 0;
for (const w of hakKernlijst) {
  if (heeftHak.has(w) || eenLettergreepRegel.has(w)) continue;
  banken.hakwoord.woorden.push([w, 3]); heeftHak.add(w); nKernExtra++;
}
banken.hakwoord.woorden.sort((a, b) => a[1] - b[1] || (RANG.get(a[0]) || 99999) - (RANG.get(b[0]) || 99999) || a[0].localeCompare(b[0]));
console.log(`hakwoord: ${hakVoor} ruw -> ${banken.hakwoord.woorden.length} (kern ${nKernExtra + [...hakKernlijst].filter(w=>heeftHak.has(w)&&!weetEenLettergreep.has(w)).length}, weetwoord-1klankgroep ${weetEenLettergreep.size})`);
if (kernAfgevallen.length) console.log("  (kernlijst-woorden met tóch een eigen regel, dus GEEN hakwoord meer):", kernAfgevallen.join(", "));

// ── Wegschrijven ──────────────────────────────────────────────────────────────
const uit = {
  versie: "1.0",
  gegenereerd: DATUM,
  bron: "OpenTaal-woordenlijst (BSD-3 / CC-BY-3.0, (c) Stichting OpenTaal) + hermitdave FrequencyWords nl_50k (CC-BY-SA-4.0, OpenSubtitles). Eigen classificatie en niveau-indeling. Geen methode-materiaal.",
  principe: "Doelcategorie wordt altijd aangeboden; de groep (vanaf) per woord is bepaald door het zwaarste ANDERE spelling-ingredient (achtergrond), methode-neutraal en bewust voorzichtig.",
  categorieen: banken,
};
fs.writeFileSync(path.join(__dirname, "woordenbank.json"), JSON.stringify(uit));

// Slank publiek script voor de tools (alleen id -> [[woord, vanaf], ...]).
const slim = {};
for (const id in banken) slim[id] = banken[id].woorden;
fs.writeFileSync(path.join(__dirname, "..", "..", "public", "avinka-woordenbank.js"),
  "/* Auto-gegenereerd door scripts/woordbank/bouw.js — NIET handmatig bewerken.\n" +
  "   Bron: OpenTaal (BSD-3/CC-BY-3.0) + hermitdave nl_50k (CC-BY-SA-4.0). Geen methode-materiaal. */\n" +
  "window.avinkaWoordenbank=" + JSON.stringify(slim) + ";\n" +
  "window.avinkaGevoelig=" + JSON.stringify([...GEVOELIG].sort()) + ";\n");

// ── Runrapport ────────────────────────────────────────────────────────────────
console.log("WOORDENBANK gebouwd:", DATUM);
console.log("kandidaten (kindgeschikt, geen werkwoord/blocklist):", kandidaten.length);
console.log("\ncategorie".padEnd(34), "soort".padEnd(14), "totaal", " | per groep 3-8 (nieuw)");
let totaal = 0;
const onder = [];
for (const d of DOELEN) {
  const b = banken[d.id];
  const perG = [3, 4, 5, 6, 7, 8].map(g => b.woorden.filter(x => x[1] === g).length);
  totaal += b.woorden.length;
  if (b.woorden.length < 40) onder.push(d.id + " (" + b.woorden.length + ")");
  console.log(d.id.padEnd(34), d.soort.padEnd(14), String(b.woorden.length).padStart(5), " | " + perG.join("  "));
}
let nVerv = 0, nGrond = 0;
for (const id in banken) for (const x of banken[id].woorden) (x[2] === "v" ? nVerv++ : nGrond++);
console.log("\nTOTAAL woorden (som over categorieen, met overlap):", totaal, `(grondvorm ${nGrond} · vervoeging ${nVerv})`);
const nNiveau = Object.keys(NIVEAU).length;
console.log(`betekenisvloer: ${nNiveau} woorden beoordeeld · ${nBump} slots omhoog geduwd (gem. +${nBump ? (bumpSom / nBump).toFixed(2) : 0} groep)`);
console.log("bestand: scripts/woordbank/woordenbank.json (" + Math.round(fs.statSync(path.join(__dirname, "woordenbank.json")).size / 1024) + " kB)");
if (onder.length) console.log("\nLET OP, dunne categorieen (<40):", onder.join(", "));
console.log("\nVoorbeelden groep 3 'cht':", banken.cht.woorden.filter(x => x[1] === 3).slice(0, 18).map(x => x[0]).join(", "));
console.log("Voorbeelden groep 4 'ei_ij':", banken.ei_ij.woorden.filter(x => x[1] <= 4).slice(0, 18).map(x => x[0]).join(", "));
console.log("Voorbeelden groep 6 'tie':", banken.tie.woorden.filter(x => x[1] <= 6).slice(0, 18).map(x => x[0]).join(", "));

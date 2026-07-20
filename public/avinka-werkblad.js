/* ───────────────────────────────────────────────────────────────────────────
   Avinka — Werkblad-renderer (de motor achter de Werkbladen-tool).

   Filosofie (gelijk aan Lesontwerp): de CODE regelt de vormgeving en de
   structuur, de AI levert alleen de inhoud. De AI geeft een werkblad terug als
   GESTRUCTUREERDE JSON (een lijst "blokken"); deze module rendert dat tot een
   prachtige, gethematiseerde A4-pagina (scherm + print/PDF). Zo ziet élk
   werkblad er ontworpen uit, en kloppen sommen/woordzoekers altijd (die maakt de
   code zelf, niet de AI).

   Publieke API (window.avinkaWerkblad):
     .THEMAS                         → object met alle thema's
     .themaKeys()                    → ['ruimte','onderwater',...]
     .kiesThema(onderwerp, groep, vak) → automatische thema-keuze (key)
     .normaliseer(wb)                → vult gegenereerde inhoud (sommen,
                                       woordzoeker, getallenlijn) IN het object,
                                       zodat scherm/print/antwoordblad gelijk zijn
     .render(wb, { antwoorden:false }) → HTML-string (één of twee .wb-page's)
     .platteTekst(wb)                → korte platte tekst (voor opslaan/zoeken)

   Een werkblad-object (wb):
     { titel, ondertitel?, thema, vak, groep, naamveld?, blokken:[ Blok, ... ] }
   Blok-types: tekst · meerkeuze · invul · open · koppelen · categoriseren ·
     waarnietwaar · sommen · getallenlijn · woordzoeker · teken · reflectie
   ─────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  // ── Huisstijl ──────────────────────────────────────────────────────────────
  // Eén vaste, vriendelijke stijl (geen wisselende thema's): palet + lettertype +
  // emoji-mascottes. CSS-variabelen worden per pagina gezet. Print-vriendelijk.
  var THEMAS = {
    fris: {
      naam: "Avinka", emoji: "⭐",
      band: "linear-gradient(135deg,#2f9e6e,#25855a)", bandInk: "#ffffff",
      accent: "#2f9e6e", soft: "#e7f4ed", ink: "#221c3a", paper: "#ffffff",
      font: "'Plus Jakarta Sans', sans-serif",
      mascottes: ["⭐", "✏️", "✅", "📚", "🌟", "✦", "🎯", "💡"]
    }
  };

  function thema(key) { return THEMAS[key] || THEMAS.fris; }
  function themaKeys() { return Object.keys(THEMAS); }

  // Automatische thema-keuze op onderwerp (trefwoord) → anders op groep.
  // Eén vaste, vriendelijke huisstijl: geen thema-keuze, geen wisselende skins.
  // De aantrekkingskracht komt uit gevarieerde, leuke opdrachten + icoontjes.
  function kiesThema() { return "fris"; }

  // ── Kleine helpers ─────────────────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function letterReeks(n) { var s = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; return s.slice(0, n).split(""); }
  // Diacrieten weg + alleen letters (voor de woordzoeker).
  function alleenLetters(w) {
    return String(w || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z]/g, "");
  }

  // Getal <-> Nederlands telwoord (1-20; genoeg voor de puzzel-aantallen 8-16).
  var GETALWOORD = { 1: "één", 2: "twee", 3: "drie", 4: "vier", 5: "vijf", 6: "zes",
    7: "zeven", 8: "acht", 9: "negen", 10: "tien", 11: "elf", 12: "twaalf", 13: "dertien",
    14: "veertien", 15: "vijftien", 16: "zestien", 17: "zeventien", 18: "achttien",
    19: "negentien", 20: "twintig" };
  var TELWOORD_RE = "een|één|twee|drie|vier|vijf|zes|zeven|acht|negen|tien|elf|twaalf|dertien|veertien|vijftien|zestien|zeventien|achttien|negentien|twintig";
  // Corrigeert een aantal dat in de opdrachttekst staat ("Zoek de ACHT woorden") naar
  // het ECHTE aantal items (n). Nodig omdat de AI het getal in de zin schrijft, terwijl
  // de code de woordlijst daarna nog kan inkorten (bankwoorden afdwingen, pagina-fit):
  // dan zou de tekst liegen ("acht" terwijl er zes staan). Vervangt alleen een getal dat
  // vlak vóór "woorden" staat en houdt de rest + de stijl (cijfer/telwoord) heel.
  function syncAantalWoord(opdracht, n) {
    if (!opdracht || !n) return opdracht;
    var re = new RegExp("\\b(\\d{1,2}|" + TELWOORD_RE + ")\\b([\\s\\S]{0,24}?\\bwoorden\\b)", "i");
    return String(opdracht).replace(re, function (_, getal, rest) {
      var nieuw = /^\d+$/.test(getal) ? String(n) : (GETALWOORD[n] || String(n));
      return nieuw + rest;
    });
  }

  // ── Generators: de CODE maakt de sommen / woordzoeker / getallenlijn ────────

  // Reken-engine: maakt sommen + (correcte) antwoorden uit een spec.
  // spec: { bewerking:'+'|'-'|'×'|'÷'|'mix', min, max, aantal }
  function genSommen(spec) {
    spec = spec || {};
    var aantal = Math.min(40, Math.max(1, spec.aantal || 10));
    var min = spec.min != null ? spec.min : 1;
    var max = spec.max != null ? spec.max : 20;
    if (max <= min) max = min + 9;
    var bew = spec.bewerking || "+";
    var items = [], pogingen = 0, zien = {};
    while (items.length < aantal && pogingen < aantal * 30) {
      pogingen++;
      var op = bew === "mix" ? ["+", "-", "×", "÷"][randInt(0, 3)] : bew;
      var a, b, ant, som;
      if (op === "+") {
        a = randInt(min, max); b = randInt(min, max); ant = a + b; som = a + " + " + b;
      } else if (op === "-") {
        a = randInt(min, max); b = randInt(min, a); ant = a - b; som = a + " − " + b; // minteken −
      } else if (op === "×") {
        // bij × houden we de factoren behapbaar (tafels), tenzij het bereik klein is
        var fa = Math.min(max, 12), fb = Math.min(max, 12);
        a = randInt(Math.max(1, Math.min(min, 1)), fa); b = randInt(1, fb); ant = a * b; som = a + " × " + b;
      } else { // ÷  → hele uitkomsten
        var deler = randInt(2, Math.min(10, Math.max(2, max < 10 ? max : 10)));
        var uitk = randInt(1, Math.max(2, Math.floor(max / deler)));
        a = deler * uitk; b = deler; ant = uitk; som = a + " : " + b;
      }
      if (zien[som]) continue; zien[som] = 1;
      items.push({ som: som, antwoord: String(ant) });
    }
    return items;
  }

  // Getallenlijn: bepaalt nette ticks en de gevraagde (in te vullen) punten.
  function genGetallenlijn(spec) {
    spec = spec || {};
    var start = spec.start != null ? spec.start : 0;
    var eind = spec.eind != null ? spec.eind : 100;
    var stap = spec.stap != null ? spec.stap : 10;
    if (eind <= start) eind = start + 100;
    if (stap <= 0) stap = Math.max(1, Math.round((eind - start) / 10));
    // niet te veel ticks
    while ((eind - start) / stap > 21) stap *= 2;
    var ticks = [];
    for (var v = start; v <= eind + 0.0001; v += stap) ticks.push(Math.round(v * 100) / 100);
    var gevraagd = arr(spec.gevraagd).filter(function (x) { return x > start && x < eind; });
    if (!gevraagd.length) {
      // kies 3 binnenste ticks om te vragen
      var binnen = ticks.slice(1, -1);
      gevraagd = shuffle(binnen).slice(0, Math.min(3, binnen.length)).sort(function (a, b) { return a - b; });
    }
    return { start: start, eind: eind, stap: stap, ticks: ticks, gevraagd: gevraagd };
  }

  // Eén of meer getallenlijnen onder elkaar. Het aantal lijnen schaalt met de
  // lengte (1/2/3); elke lijn schuift een bereik op zodat ze verschillen en
  // krijgt 3 invulvakjes.
  function genGetallenlijnReeks(spec) {
    spec = spec || {};
    var n = Math.min(4, Math.max(1, spec.lijnen || spec.aantal || 1));
    var baseStart = spec.start != null ? spec.start : 0;
    var baseEind = spec.eind != null ? spec.eind : 100;
    var stap = spec.stap != null ? spec.stap : 10;
    var span = (baseEind - baseStart) || 100;
    var lijnen = [];
    for (var i = 0; i < n; i++) {
      // elke volgende lijn een bereik hoger; gevraagd leeg laten → 3 willekeurige
      // binnenste ticks per lijn.
      lijnen.push(genGetallenlijn({ start: baseStart + i * span, eind: baseEind + i * span, stap: stap }));
    }
    return lijnen;
  }

  // Woordzoeker: plaatst de woorden in een raster (8 richtingen) en vult op.
  // Eén poging tot een vol raster van gegeven maat; geeft null als niet alle
  // woorden geplaatst konden worden (de buitenlus probeert het dan opnieuw).
  function bouwWoordzoeker(schoon, size) {
    var grid = [];
    for (var r = 0; r < size; r++) { grid.push([]); for (var c = 0; c < size; c++) grid[r].push(null); }
    var richtingen = [[0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1]];
    var geplaatst = [], kleur = {};
    for (var idx = 0; idx < schoon.length; idx++) {
      var w = schoon[idx], gelukt = false;
      for (var poging = 0; poging < 300 && !gelukt; poging++) {
        var d = richtingen[randInt(0, richtingen.length - 1)];
        var rr = randInt(0, size - 1), cc = randInt(0, size - 1);
        var er = rr + d[0] * (w.length - 1), ec = cc + d[1] * (w.length - 1);
        if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
        var ok = true;
        for (var k = 0; k < w.length; k++) {
          // Geen overlap: een vakje dat al door een ander woord is bezet mag NIET
          // opnieuw gebruikt worden, ook niet als de letter toevallig gelijk is.
          if (grid[rr + d[0] * k][cc + d[1] * k]) { ok = false; break; }
        }
        if (!ok) continue;
        for (var k2 = 0; k2 < w.length; k2++) {
          grid[rr + d[0] * k2][cc + d[1] * k2] = { l: w[k2], w: idx };
        }
        geplaatst.push(w); kleur[w] = idx; gelukt = true;
      }
      if (!gelukt) return null; // niet alles past → buitenlus probeert opnieuw / groter
    }
    var alfa = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (var r2 = 0; r2 < size; r2++) for (var c2 = 0; c2 < size; c2++) {
      if (!grid[r2][c2]) grid[r2][c2] = { l: alfa[randInt(0, 25)], w: -1 };
    }
    return { size: size, grid: grid, woorden: geplaatst, kleur: kleur };
  }

  function genWoordzoeker(woorden) {
    var schoon = arr(woorden).map(alleenLetters).filter(function (w) { return w.length >= 2; });
    schoon = schoon.filter(function (w, i) { return schoon.indexOf(w) === i; }).slice(0, 16);
    var maxlen = schoon.reduce(function (m, w) { return Math.max(m, w.length); }, 0);
    var size = Math.max(11, maxlen + 1);
    if (schoon.length > 10) size = Math.max(size, 14);
    if (schoon.length > 13) size = Math.max(size, 16);
    // Probeer meermaals; lukt het na een paar keer niet, dan een maat groter.
    // Garandeert dat ALLE woorden in het raster staan (geen stil weglaten).
    for (var maat = size; maat <= size + 2; maat++) {
      for (var poging = 0; poging < 12; poging++) {
        var res = bouwWoordzoeker(schoon, maat);
        if (res) return res;
      }
    }
    // Uiterste vangnet (zou met bovenstaande marges niet moeten gebeuren).
    return bouwWoordzoeker(schoon, size + 3) || bouwWoordzoeker(schoon.slice(0, 12), size);
  }

  // Rekenmuurtje: onderste rij willekeurig; elke steen = som van de twee eronder.
  function genMuur(spec) {
    spec = spec || {};
    var rijen = Math.min(5, Math.max(3, spec.rijen || 3));
    var max = Math.max(2, spec.max || (rijen >= 4 ? 8 : 12));
    var onder = [];
    for (var i = 0; i < rijen; i++) onder.push(randInt(1, max));
    var muur = [onder];
    while (muur[0].length > 1) {
      var r = muur[0], nw = [];
      for (var j = 0; j < r.length - 1; j++) nw.push(r[j] + r[j + 1]);
      muur.unshift(nw);
    }
    return muur; // muur[0] = top (1 steen), laatste rij = onderste (gegeven)
  }
  // 1 t/m 3 rekenmuurtjes (schaalt met de lengte); naast elkaar gecentreerd.
  function genMuren(spec) {
    spec = spec || {};
    var n = Math.min(3, Math.max(1, spec.aantal || 1)), muren = [];
    for (var i = 0; i < n; i++) muren.push(genMuur(spec));
    return muren;
  }

  // Splitshuis: splits 'getal' in twee delen; links gegeven, rechts in te vullen.
  function genHuis(spec) {
    spec = spec || {};
    var getal = Math.max(3, spec.getal || 10);
    var aantal = Math.min(8, Math.max(3, spec.aantal || 6));
    var links = [];
    for (var i = 1; i < getal; i++) links.push(i);
    links = shuffle(links).slice(0, Math.min(aantal, links.length));
    return { getal: getal, rijen: links.map(function (l) { return { links: l, rechts: getal - l }; }) };
  }
  // 1 t/m 3 splitshuizen (schaalt met de lengte); naast elkaar gecentreerd. Elk
  // huis krijgt een vaste hoogte (rijen), zodat de lengte het AANTAL huizen bepaalt.
  // spec.getallen = [9,6,7] → elk huis een eigen getal (didactische variatie);
  // geen getallen → alle huizen hetzelfde spec.getal (bv. "splitsen van 10").
  function genHuizen(spec) {
    spec = spec || {};
    var n = Math.min(3, Math.max(1, spec.aantal || 1));
    var rijen = Math.min(8, Math.max(3, spec.rijen || 5));
    var lijst = arr(spec.getallen).filter(function (g) { return g >= 3; }), getallen = [];
    for (var i = 0; i < n; i++) getallen.push(lijst.length ? lijst[i % lijst.length] : (spec.getal || 10));
    return getallen.map(function (g) { return genHuis({ getal: g, aantal: rijen }); });
  }

  // Klok: tijden passend bij 'soort' (heel/half/kwartier/vijf).
  function genKlok(spec) {
    spec = spec || {};
    var aantal = Math.min(12, Math.max(2, spec.aantal || 6));
    var soort = spec.soort || "half";
    var cij = spec.cijfers; // true | false | "mix"
    var min = soort === "heel" ? [0] : soort === "kwartier" ? [0, 15, 30, 45]
      : soort === "vijf" ? [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] : [0, 30];
    var items = [];
    for (var i = 0; i < aantal; i++) {
      var c = cij === "mix" ? Math.random() < 0.5 : !!cij; // per klok bij "mix"
      items.push({ h: randInt(1, 12), m: min[randInt(0, min.length - 1)], cijfers: c });
    }
    return items;
  }

  // Geld (in centen → geen afrondingsfouten). bewerking "+" (samen betalen),
  // "-" (wisselgeld: betaald − prijs) of "mix".
  function genGeld(spec) {
    spec = spec || {};
    var aantal = Math.min(12, Math.max(2, spec.aantal || 6));
    var max = Math.max(2, spec.max || 20);
    var heel = spec.kommagetallen === false, bew = spec.bewerking || "+";
    var stap = heel ? 100 : 5;
    function bedrag() { return heel ? randInt(1, max) * 100 : randInt(1, max * 20) * 5; }
    var items = [];
    for (var i = 0; i < aantal; i++) {
      var op = bew === "mix" ? (Math.random() < 0.5 ? "-" : "+") : (bew === "-" ? "-" : "+");
      var a = bedrag(), b = bedrag();
      if (op === "-") { if (a < b) { var t = a; a = b; b = t; } if (a === b) a += stap; items.push({ a: a, b: b, op: "−", res: a - b }); }
      else items.push({ a: a, b: b, op: "+", res: a + b });
    }
    return items;
  }

  // Doolhof: recursive-backtracker. Per cel muren [boven, rechts, onder, links].
  var DH_DIRS = [[0, -1, 0], [1, 0, 1], [0, 1, 2], [-1, 0, 3]]; // dx, dy, muurindex
  function genDoolhof(spec) {
    spec = spec || {};
    var n = Math.min(16, Math.max(6, spec.grootte || 11));
    var cel = [];
    for (var y = 0; y < n; y++) { cel.push([]); for (var x = 0; x < n; x++) cel[y].push({ m: [1, 1, 1, 1], bez: false }); }
    var stack = [[0, 0]]; cel[0][0].bez = true;
    while (stack.length) {
      var top = stack[stack.length - 1], cx = top[0], cy = top[1], buren = [];
      for (var d = 0; d < 4; d++) {
        var nx = cx + DH_DIRS[d][0], ny = cy + DH_DIRS[d][1];
        if (nx >= 0 && nx < n && ny >= 0 && ny < n && !cel[ny][nx].bez) buren.push(d);
      }
      if (!buren.length) { stack.pop(); continue; }
      var dd = buren[randInt(0, buren.length - 1)];
      var ax = cx + DH_DIRS[dd][0], ay = cy + DH_DIRS[dd][1];
      cel[cy][cx].m[DH_DIRS[dd][2]] = 0;
      cel[ay][ax].m[(DH_DIRS[dd][2] + 2) % 4] = 0;
      cel[ay][ax].bez = true;
      stack.push([ax, ay]);
    }
    return { n: n, cel: cel };
  }
  // Kortste pad door het doolhof (voor het antwoordblad).
  function doolhofPad(D) {
    var n = D.n, q = [[0, 0]], prev = {}, seen = { "0,0": 1 };
    while (q.length) {
      var c = q.shift(), x = c[0], y = c[1];
      if (x === n - 1 && y === n - 1) break;
      for (var d = 0; d < 4; d++) {
        if (D.cel[y][x].m[DH_DIRS[d][2]]) continue;
        var nx = x + DH_DIRS[d][0], ny = y + DH_DIRS[d][1];
        if (nx < 0 || ny < 0 || nx >= n || ny >= n || seen[nx + "," + ny]) continue;
        seen[nx + "," + ny] = 1; prev[nx + "," + ny] = x + "," + y; q.push([nx, ny]);
      }
    }
    var pad = [], cur = (n - 1) + "," + (n - 1);
    while (cur) { pad.unshift(cur); cur = prev[cur]; }
    return pad;
  }

  // Kruiswoord: legt de woorden kruisend in een rooster (greedy intersecties).
  // Eén bouw-poging in de gegeven volgorde (eerste woord = anker, horizontaal).
  function bouwKruiswoord(lijst) {
    var grid = {}, plaats = [];
    function L(x, y) { return grid[x + "," + y]; }
    function zet(w, x, y, dir) { for (var i = 0; i < w.length; i++) grid[(x + (dir === "h" ? i : 0)) + "," + (y + (dir === "v" ? i : 0))] = w[i]; }
    function past(w, x, y, dir) {
      for (var i = 0; i < w.length; i++) {
        var cx = x + (dir === "h" ? i : 0), cy = y + (dir === "v" ? i : 0), hier = L(cx, cy);
        if (hier && hier !== w[i]) return false;
        if (!hier) {
          if (dir === "h") { if (L(cx, cy - 1) || L(cx, cy + 1)) return false; }
          else { if (L(cx - 1, cy) || L(cx + 1, cy)) return false; }
        }
      }
      if (dir === "h") { if (L(x - 1, y) || L(x + w.length, y)) return false; }
      else { if (L(x, y - 1) || L(x, y + w.length)) return false; }
      return true;
    }
    zet(lijst[0].woord, 0, 0, "h");
    plaats.push({ woord: lijst[0].woord, oms: lijst[0].oms, x: 0, y: 0, dir: "h" });
    for (var k = 1; k < lijst.length; k++) {
      var w = lijst[k].woord, gezet = false;
      for (var p = 0; p < plaats.length && !gezet; p++) {
        var pl = plaats[p];
        for (var i = 0; i < pl.woord.length && !gezet; i++) {
          for (var j = 0; j < w.length && !gezet; j++) {
            if (pl.woord[i] !== w[j]) continue;
            var px = pl.x + (pl.dir === "h" ? i : 0), py = pl.y + (pl.dir === "v" ? i : 0);
            var dir = pl.dir === "h" ? "v" : "h";
            var sx = dir === "h" ? px - j : px, sy = dir === "v" ? py - j : py;
            if (past(w, sx, sy, dir)) { zet(w, sx, sy, dir); plaats.push({ woord: w, oms: lijst[k].oms, x: sx, y: sy, dir: dir }); gezet = true; }
          }
        }
      }
    }
    if (plaats.length < 2) return null;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (var key in grid) {
      if (!grid.hasOwnProperty(key)) continue;
      var pr = key.split(","), gx = +pr[0], gy = +pr[1];
      if (gx < minX) minX = gx; if (gx > maxX) maxX = gx; if (gy < minY) minY = gy; if (gy > maxY) maxY = gy;
    }
    // Nummering: startcellen in leesvolgorde.
    var nums = {}, tel = 0, vragen = [];
    for (var yy = minY; yy <= maxY; yy++) for (var xx = minX; xx <= maxX; xx++) {
      if (!L(xx, yy)) continue;
      var startH = L(xx + 1, yy) && !L(xx - 1, yy);
      var startV = L(xx, yy + 1) && !L(xx, yy - 1);
      if (startH || startV) nums[xx + "," + yy] = ++tel;
    }
    plaats.forEach(function (p) {
      vragen.push({ nr: nums[p.x + "," + p.y], dir: p.dir, oms: p.oms || p.woord.toLowerCase(), woord: p.woord });
    });
    vragen.sort(function (a, b) { return a.nr - b.nr; });
    return { grid: grid, minX: minX, minY: minY, maxX: maxX, maxY: maxY, nums: nums, vragen: vragen, aantal: plaats.length };
  }

  function genKruiswoord(woorden) {
    var lijst = arr(woorden).map(function (w) {
      return { woord: alleenLetters(w && w.woord != null ? w.woord : w), oms: (w && w.omschrijving) || "" };
    }).filter(function (w) { return w.woord.length >= 2 && w.woord.length <= 14; });
    if (lijst.length < 2) return null;
    var doel = lijst.length, beste = null, besteN = -1;
    // Greedy plaatsing laat soms een woord vallen dat nergens kruist. We proberen
    // het daarom vaak opnieuw met geschudde volgorde en houden de poging waarin de
    // MEESTE woorden geplaatst zijn — stoppen zodra ALLE woorden erin staan.
    for (var poging = 0; poging < 80; poging++) {
      // Poging 0 = langste-eerst (geeft meestal de strakste interlock); daarna geschud.
      var vol = lijst.slice();
      if (poging === 0) vol.sort(function (a, b) { return b.woord.length - a.woord.length; });
      else for (var i = vol.length - 1; i > 0; i--) { var jj = randInt(0, i), t = vol[i]; vol[i] = vol[jj]; vol[jj] = t; }
      var res = bouwKruiswoord(vol);
      if (!res) continue;
      if (res.aantal > besteN) { besteN = res.aantal; beste = res; }
      if (res.aantal === doel) break;
    }
    return beste;
  }

  function rangeArr(a, b) { var r = []; for (var i = a; i <= b; i++) r.push(i); return r; }

  // Reeks: meerdere reeksen met gaten. Soorten:
  //  - "plus"  : rekenkundig (+stap) — gaten binnenin
  //  - "maal"  : meetkundig (×a)
  //  - "regel" : samengesteld (×2 +b, bv. "×2 +5") — patroon herkennen, gaten achteraan
  // Lengte (aantal vakjes) loopt op richting bovenbouw (groter getalbereik).
  function genReeks(spec) {
    spec = spec || {};
    var aantal = Math.min(8, Math.max(2, spec.aantal || 4));
    var max = spec.max || 30;
    // rekenkundige reeksen lopen op richting bovenbouw, tot 15 vakjes (meer
    // hulpgetallen → patroon makkelijker te herkennen).
    var termen = Math.min(14, Math.max(5, spec.termen || (max >= 400 ? 14 : max >= 150 ? 12 : max >= 60 ? 9 : 6)));
    var soorten = arr(spec.soorten).length ? arr(spec.soorten) : (max > 80 ? ["plus", "plus", "regel", "maal"] : ["plus"]);
    var komma = !!spec.kommagetallen;
    var rijen = [];
    for (var r = 0; r < aantal; r++) {
      if (komma) {
        // kommagetallen-reeks: reken in TIENDEN (geen float-ruis), constante stap
        var st10 = [1, 2, 5][randInt(0, 2)], start10 = randInt(1, 20), termK = Math.min(9, termen), vk = [];
        for (var ik = 0; ik < termK; ik++) vk.push((start10 + st10 * ik) / 10);
        var innerK = []; for (ik = 1; ik < termK - 1; ik++) innerK.push(ik);
        rijen.push({ vals: vk, gaten: shuffle(innerK).slice(0, 2), komma: true });
        continue;
      }
      var soort = soorten[randInt(0, soorten.length - 1)], vals = [], gaten, i;
      if (soort === "maal") {
        // ×a explodeert → kort houden, wel een paar hulpgetallen vóór de gaten
        var a = randInt(2, 3), s = randInt(1, 3), tm = a === 3 ? 5 : 7;
        for (i = 0; i < tm; i++) vals.push(s * Math.pow(a, i));
        gaten = [vals.length - 2, vals.length - 1];
      } else if (soort === "regel") {
        var b = randInt(2, 6), v = randInt(1, 4), tr = 7;
        for (i = 0; i < tr; i++) { vals.push(v); v = v * 2 + b; }
        gaten = [vals.length - 2, vals.length - 1];
      } else {
        var start = randInt(1, Math.max(5, Math.min(40, max))), stap = randInt(2, 10);
        for (i = 0; i < termen; i++) vals.push(start + stap * i);
        var inner = []; for (i = 1; i < termen - 1; i++) inner.push(i);
        gaten = shuffle(inner).slice(0, 2);
      }
      rijen.push({ vals: vals, gaten: gaten });
    }
    return rijen;
  }

  // Vergelijken: paren (getal of som); het teken < , > of =.
  // De twee uitkomsten liggen DICHT bij elkaar (incl. gelijk → "="). Bij een klein
  // getalbereik vooral kale getallen (groep 3: 7 > 5); bij een groter bereik meer
  // sommen, zodat je echt moet rekenen i.p.v. op het oog te zien.
  // Comparison-engine: vergelijk < > = tussen twee "kanten". De renderer is
  // representatie-onafhankelijk (toont l.text of l.html en berekent het teken uit
  // l.val/r.val), dus alleen de generator kiest de representatie via spec.soort:
  // getallen (default) · keer · min · kommagetallen · breuken · procenten · mix.
  function genVergelijk(spec) {
    spec = spec || {};
    var soort = spec.soort || "getallen";
    if (soort !== "getallen") return genVergAnders(spec, soort);
    var aantal = Math.min(14, Math.max(2, spec.aantal || 8)), max = Math.max(8, spec.max || 20);
    var laag = max <= 12; // klein bereik → kale-getallen-werk overheerst
    function som(doel) { var a = randInt(1, doel - 1); return { text: a + " + " + (doel - a), val: doel }; }
    function getal(doel) { return { text: "" + doel, val: doel }; }
    // twee VERSCHILLENDE sommen voor hetzelfde doel (voor een "="-paar)
    function somPaar(doel) {
      var a1 = randInt(1, doel - 1), min1 = Math.min(a1, doel - a1), a2, g = 0;
      do { a2 = randInt(1, doel - 1); g++; } while (Math.min(a2, doel - a2) === min1 && g < 12);
      return [{ text: a1 + " + " + (doel - a1), val: doel }, { text: a2 + " + " + (doel - a2), val: doel }];
    }
    var deltas = [-3, -2, -1, 0, 1, 2, 3], items = []; // 0 → "="
    for (var i = 0; i < aantal; i++) {
      var basis = randInt(3, max), d = deltas[randInt(0, deltas.length - 1)];
      var lv = basis, rv = Math.max(2, basis + d), m = Math.random(), l, r;
      if (d === 0) {
        // "=" alleen zinvol mét som — nooit "26 ⃝ 26" of "8+4 ⃝ 8+4"
        if (lv >= 4 && m < 0.6) { var p = somPaar(lv); l = p[0]; r = p[1]; }
        else if (m < 0.8) { l = som(lv); r = getal(rv); }
        else { l = getal(lv); r = som(rv); }
      } else if (laag) {
        if (m < 0.7) { l = getal(lv); r = getal(rv); }       // kale getallen (meest)
        else if (m < 0.85) { l = som(lv); r = getal(rv); }
        else { l = getal(lv); r = som(rv); }
      } else {
        if (m < 0.45) { l = som(lv); r = som(rv); }          // som vs som
        else if (m < 0.65) { l = som(lv); r = getal(rv); }
        else if (m < 0.85) { l = getal(lv); r = som(rv); }
        else { l = getal(lv); r = getal(rv); }               // ook kale getallen
      }
      items.push({ l: l, r: r, teken: l.val < r.val ? "<" : l.val > r.val ? ">" : "=" });
    }
    return items;
  }

  // Vergelijken met andere representaties (breuken, procenten, kommagetallen,
  // keer/min-sommen, of een mix). Code maakt de paren + berekent het teken uit
  // de numerieke waarde, dus het teken klopt altijd; de AI kiest alleen de soort.
  function genVergAnders(spec, soort) {
    var aantal = Math.min(14, Math.max(2, spec.aantal || 8));
    function pick(a) { return a[randInt(0, a.length - 1)]; }
    function round2(x) { return Math.round(x * 100) / 100; }
    function komma(x, dec) { return x.toFixed(dec).replace(".", ","); }
    function decNL(x) { return komma(x, (Math.round(x * 100) % 10 === 0) ? 1 : 2); } // 0,4 of 0,45
    function teken(a, b) { var d = a - b; return Math.abs(d) < 1e-9 ? "=" : d < 0 ? "<" : ">"; }
    var NOEMERS = [2, 3, 4, 5, 6, 8, 10];
    function paarKeer() {
      var a = randInt(2, 9), b = randInt(2, 9), v = a * b, m = Math.random(), l = { text: a + " × " + b, val: v };
      if (m < 0.15) return { l: l, r: { text: "" + v, val: v } };
      if (m < 0.6) { var g = Math.max(1, v + pick([-3, -2, -1, 1, 2, 3])); return { l: l, r: { text: "" + g, val: g } }; }
      var c = randInt(2, 9), d = randInt(2, 9); return { l: l, r: { text: c + " × " + d, val: c * d } };
    }
    function paarMin() {
      var a = randInt(6, 20), b = randInt(1, a - 1), v = a - b, m = Math.random(), l = { text: a + " − " + b, val: v };
      if (m < 0.15) { var a2 = randInt(v + 1, 20), b2 = a2 - v; if (b2 >= 1 && a2 !== a) return { l: l, r: { text: a2 + " − " + b2, val: v } }; return { l: l, r: { text: "" + v, val: v } }; }
      if (m < 0.55) { var g = Math.max(0, v + pick([-2, -1, 1, 2])); return { l: l, r: { text: "" + g, val: g } }; }
      var c = randInt(6, 20), d = randInt(1, c - 1); return { l: l, r: { text: c + " − " + d, val: c - d } };
    }
    function paarKomma() {
      var base = randInt(1, 90) / 10, m = Math.random(), l = { text: komma(base, 1), val: round2(base) };
      if (m < 0.15) return { l: l, r: { text: komma(base, 2), val: round2(base) } }; // 0,5 = 0,50
      var d2 = round2(base + pick([-0.3, -0.2, -0.1, 0.1, 0.2, 0.3, -0.05, 0.05])); if (d2 <= 0) d2 = round2(base + 0.1);
      return { l: l, r: { text: decNL(d2), val: d2 } };
    }
    function paarBreuk() {
      var n1 = pick(NOEMERS), t1 = randInt(1, n1 - 1), v1 = t1 / n1, m = Math.random(), l = { html: breukHtml(t1, n1), text: t1 + "/" + n1, val: v1 };
      if (m < 0.18) { var f = pick([2, 3]); return { l: l, r: { html: breukHtml(t1 * f, n1 * f), text: (t1 * f) + "/" + (n1 * f), val: v1 } }; }
      var n2 = pick(NOEMERS), t2 = randInt(1, n2 - 1), v2 = t2 / n2, g = 0;
      while (Math.abs(v2 - v1) < 1e-9 && g < 16) { n2 = pick(NOEMERS); t2 = randInt(1, n2 - 1); v2 = t2 / n2; g++; }
      return { l: l, r: { html: breukHtml(t2, n2), text: t2 + "/" + n2, val: v2 } };
    }
    function paarProcent() {
      var pcts = [10, 20, 25, 30, 40, 50, 60, 70, 75, 80], p1 = pick(pcts), v1 = p1 / 100, m = Math.random(), l = { text: p1 + "%", val: v1 };
      if (m < 0.5) { var v2 = (m < 0.1) ? v1 : Math.max(0.05, Math.min(0.95, round2(v1 + pick([-0.15, -0.1, -0.05, 0.05, 0.1, 0.15])))); return { l: l, r: { text: decNL(v2), val: v2 } }; }
      var fr = pick([[1, 2, 0.5], [1, 4, 0.25], [3, 4, 0.75], [1, 5, 0.2], [2, 5, 0.4], [3, 5, 0.6], [1, 10, 0.1]]);
      return { l: l, r: { html: breukHtml(fr[0], fr[1]), text: fr[0] + "/" + fr[1], val: fr[2] } };
    }
    var makers = { keer: paarKeer, min: paarMin, kommagetallen: paarKomma, breuken: paarBreuk, procenten: paarProcent };
    function maak() { return soort === "mix" ? pick([paarBreuk, paarKomma, paarProcent])() : (makers[soort] || paarKeer)(); }
    var items = [], seen = {}, p = 0;
    while (items.length < aantal && p < aantal * 14) {
      p++;
      var pr = maak(); if (!pr) continue;
      var key = (pr.l.text || "") + "|" + (pr.r.text || "");
      if (seen[key]) continue; seen[key] = 1;
      pr.teken = teken(pr.l.val, pr.r.val);
      items.push(pr);
    }
    return items;
  }

  // Tafelkaart: óf één tafel (1..10 × n, max 10 sommen), óf meerdere tafels door
  // elkaar (spec.tafels = [2,3,4,5,10]) met spec.aantal sommen (tot 20).
  function genTafel(spec) {
    spec = spec || {};
    var tafels = arr(spec.tafels).filter(function (t) { return t >= 1; });
    var aantal = Math.min(20, Math.max(2, spec.aantal || 10));
    if (!tafels.length) {
      // één tafel: nooit hoger dan 10 × n → dus max 10 sommen
      var n = spec.tafel || randInt(2, 10), tot = Math.min(10, aantal);
      var rij = rangeArr(1, tot);
      if (spec.shuffle !== false) rij = shuffle(rij);
      return { tafel: n, mix: false, items: rij.map(function (i) { return { som: i + " × " + n, antwoord: String(i * n) }; }) };
    }
    // gemengd: trek 'aantal' sommen uit de opgegeven tafels (factor 1..10)
    var items = [];
    for (var k = 0; k < aantal; k++) {
      var t = tafels[randInt(0, tafels.length - 1)], i = randInt(1, 10);
      items.push({ som: i + " × " + t, antwoord: String(i * t) });
    }
    return { tafel: null, mix: true, tafels: tafels, items: items };
  }

  // Breuken: balkjes om te kleuren of af te lezen.
  function genBreuken(spec) {
    spec = spec || {};
    var aantal = Math.min(8, Math.max(2, spec.aantal || 4)), soort = spec.soort === "lees" ? "lees" : "kleur", items = [];
    for (var i = 0; i < aantal; i++) { var noemer = randInt(2, 8); items.push({ noemer: noemer, teller: randInt(1, noemer) }); }
    return { soort: soort, items: items };
  }

  // Kleur-op-som (rekenkleurplaat): een verborgen plaatje verschijnt bij het kleuren.
  // Herkenbare kleurplaten (pixel-art), VIERKANT per lengte. "0" = wit laten.
  // KORT = 8×8 · MIDDEL = 10×10 · LANG = 12×12 (lengte → spec.grootte 8/10/12).
  var KLEURPLATEN = [
    // ── KORT 8×8 ───────────────────────────────────────────────────────
    { naam: "hart", kleuren: { "1": { kl: "#e11d48", nm: "rood" } },
      grid: ["01100110", "11111111", "11111111", "11111111", "01111110", "00111100", "00011000", "00011000"] },
    { naam: "appel", kleuren: { "1": { kl: "#dc2626", nm: "rood" }, "2": { kl: "#16a34a", nm: "groen" }, "3": { kl: "#92400e", nm: "bruin" } },
      grid: ["00032000", "00111100", "01111110", "11111111", "11111111", "11111111", "01111110", "00111100"] },
    { naam: "huis", kleuren: { "1": { kl: "#dc2626", nm: "rood" }, "2": { kl: "#f59e0b", nm: "geel" }, "3": { kl: "#3b82f6", nm: "blauw" } },
      grid: ["00011000", "00111100", "01111110", "11111111", "22222222", "22233222", "22233222", "22222222"] },
    { naam: "boom", kleuren: { "1": { kl: "#16a34a", nm: "groen" }, "2": { kl: "#92400e", nm: "bruin" } },
      grid: ["00011000", "00111100", "01111110", "11111111", "11111111", "01111110", "00022000", "00022000"] },
    { naam: "cadeau", kleuren: { "1": { kl: "#dc2626", nm: "rood" }, "2": { kl: "#f59e0b", nm: "geel" } },
      grid: ["00022000", "00122100", "11122111", "22222222", "11122111", "11122111", "11122111", "11122111"] },
    { naam: "diamant", kleuren: { "1": { kl: "#0ea5e9", nm: "blauw" } },
      grid: ["00011000", "00111100", "01111110", "11111111", "11111111", "01111110", "00111100", "00011000"] },
    { naam: "vlinder", kleuren: { "1": { kl: "#8b5cf6", nm: "paars" }, "2": { kl: "#1f2937", nm: "zwart" } },
      grid: ["11022011", "11122111", "01122110", "00122100", "00122100", "01122110", "11122111", "11022011"] },
    { naam: "ballon", kleuren: { "1": { kl: "#dc2626", nm: "rood" }, "2": { kl: "#94a3b8", nm: "grijs" } },
      grid: ["00111100", "01111110", "11111111", "11111111", "01111110", "00111100", "00022000", "00200000"] },
    { naam: "ster", kleuren: { "1": { kl: "#f59e0b", nm: "geel" } },
      grid: ["00011000", "00011000", "11111111", "01111110", "00111100", "01111110", "01100110", "11000011"] },
    { naam: "zon", kleuren: { "1": { kl: "#f59e0b", nm: "geel" } },
      grid: ["01000010", "00111100", "01111110", "11111111", "11111111", "01111110", "00111100", "01000010"] },
    { naam: "kat", kleuren: { "1": { kl: "#f97316", nm: "oranje" }, "2": { kl: "#1f2937", nm: "zwart" } },
      grid: ["01100110", "11111111", "12111121", "11111111", "11122111", "11111111", "01111110", "00111100"] },
    { naam: "smiley", kleuren: { "1": { kl: "#f59e0b", nm: "geel" }, "2": { kl: "#1f2937", nm: "zwart" } },
      grid: ["00111100", "01111110", "11211211", "11111111", "11111111", "12111121", "01211210", "00111100"] },
    { naam: "spook", kleuren: { "1": { kl: "#cbd5e1", nm: "grijs" }, "2": { kl: "#1f2937", nm: "zwart" } },
      grid: ["00111100", "01111110", "11211211", "11111111", "11111111", "11111111", "11111111", "10101010"] },
    { naam: "paraplu", kleuren: { "1": { kl: "#dc2626", nm: "rood" }, "2": { kl: "#92400e", nm: "bruin" } },
      grid: ["00111100", "01111110", "11111111", "11111111", "00020000", "00020000", "00020000", "00022000"] },
    { naam: "lolly", kleuren: { "1": { kl: "#ec4899", nm: "roze" }, "2": { kl: "#92400e", nm: "bruin" } },
      grid: ["00111100", "01111110", "11111111", "11111111", "01111110", "00022000", "00022000", "00022000"] },
    { naam: "vlieger", kleuren: { "1": { kl: "#3b82f6", nm: "blauw" }, "2": { kl: "#f59e0b", nm: "geel" } },
      grid: ["00010000", "00111000", "01111100", "11111110", "01111100", "00111000", "00010000", "00002000"] },
    { naam: "cactus", kleuren: { "1": { kl: "#16a34a", nm: "groen" }, "2": { kl: "#92400e", nm: "bruin" } },
      grid: ["01000010", "01010010", "01010010", "01111110", "00010000", "00010000", "00222000", "00222000"] },
    { naam: "klok", kleuren: { "1": { kl: "#e2e8f0", nm: "grijs" }, "2": { kl: "#1f2937", nm: "zwart" } },
      grid: ["00111100", "01111110", "11121111", "11122111", "11121111", "11111111", "01111110", "00111100"] },
    // ── MIDDEL 10×10 ───────────────────────────────────────────────────
    { naam: "auto", kleuren: { "1": { kl: "#dc2626", nm: "rood" }, "2": { kl: "#1f2937", nm: "zwart" }, "3": { kl: "#93c5fd", nm: "lichtblauw" } },
      grid: ["0000000000", "0000000000", "0001111100", "0011331100", "0111111110", "1111111111", "1111111111", "0220000220", "0220000220", "0000000000"] },
    { naam: "madelief", kleuren: { "1": { kl: "#ec4899", nm: "roze" }, "2": { kl: "#f59e0b", nm: "geel" }, "3": { kl: "#16a34a", nm: "groen" } },
      grid: ["0001111000", "0011111100", "0111221110", "0112222110", "0111221110", "0011111100", "0001111000", "0000300000", "0003330000", "0000300000"] },
    { naam: "appel groot", kleuren: { "1": { kl: "#dc2626", nm: "rood" }, "2": { kl: "#16a34a", nm: "groen" }, "3": { kl: "#92400e", nm: "bruin" } },
      grid: ["0000300000", "0000320000", "0011111000", "0111111100", "1111111110", "1111111110", "1111111110", "0111111100", "0111111100", "0011011000"] },
    { naam: "paddenstoel", kleuren: { "1": { kl: "#dc2626", nm: "rood" }, "2": { kl: "#e7c9a9", nm: "beige" } },
      grid: ["0001110000", "0011011000", "0110111100", "1111101110", "1111111110", "0111111100", "0002220000", "0002220000", "0002220000", "0022222000"] },
    { naam: "ijsje", kleuren: { "1": { kl: "#ec4899", nm: "roze" }, "2": { kl: "#92400e", nm: "bruin" } },
      grid: ["0011110000", "0111111000", "1111111100", "1111111100", "0111111000", "0022220000", "0022220000", "0002220000", "0002200000", "0000200000"] },
    { naam: "ballon groot", kleuren: { "1": { kl: "#dc2626", nm: "rood" }, "2": { kl: "#94a3b8", nm: "grijs" } },
      grid: ["0011110000", "0111111000", "1111111100", "1111111100", "1111111100", "0111111000", "0011110000", "0001100000", "0000200000", "0000020000"] },
    { naam: "boot", kleuren: { "1": { kl: "#dc2626", nm: "rood" }, "2": { kl: "#92400e", nm: "bruin" }, "3": { kl: "#0ea5e9", nm: "blauw" } },
      grid: ["0000100000", "0001100000", "0011100000", "0111100000", "1111100000", "0000100000", "0222222200", "0222222200", "3333333333", "3333333333"] },
    { naam: "hond", kleuren: { "1": { kl: "#92400e", nm: "bruin" }, "2": { kl: "#1f2937", nm: "zwart" } },
      grid: ["1100000011", "1110000111", "0111111110", "0121111210", "0111111110", "0111221110", "0111111110", "0011111100", "0001111000", "0000000000"] },
    { naam: "raket", kleuren: { "1": { kl: "#94a3b8", nm: "grijs" }, "2": { kl: "#dc2626", nm: "rood" }, "3": { kl: "#3b82f6", nm: "blauw" } },
      grid: ["0000200000", "0001210000", "0011111000", "0011311000", "0011111000", "0011111000", "0111111100", "0210000120", "2100000012", "0000220000"] },
    { naam: "poes", kleuren: { "1": { kl: "#f97316", nm: "oranje" }, "2": { kl: "#1f2937", nm: "zwart" } },
      grid: ["0100000010", "1100000011", "1111111111", "1121111211", "1111111111", "1111211111", "1112112111", "1111111111", "0111111110", "0011111100"] },
    { naam: "zonnetje", kleuren: { "1": { kl: "#f59e0b", nm: "geel" }, "2": { kl: "#f97316", nm: "oranje" } },
      grid: ["0001010000", "0100000100", "0001110000", "0011111000", "0111111100", "1111111110", "0111111100", "0011111000", "0001110000", "0100010010"] },
    { naam: "kerstboom", kleuren: { "1": { kl: "#16a34a", nm: "groen" }, "2": { kl: "#92400e", nm: "bruin" }, "3": { kl: "#f59e0b", nm: "geel" } },
      grid: ["0000300000", "0000100000", "0001110000", "0011111000", "0001110000", "0011111000", "0111111100", "1111111111", "0000200000", "0000200000"] },
    { naam: "taart", kleuren: { "1": { kl: "#ec4899", nm: "roze" }, "2": { kl: "#f59e0b", nm: "geel" }, "3": { kl: "#dc2626", nm: "rood" } },
      grid: ["0003003000", "0003003000", "1111111111", "1111111111", "2222222222", "2222222222", "2222222222", "2222222222", "2222222222", "2222222222"] },
    { naam: "groot hart", kleuren: { "1": { kl: "#e11d48", nm: "rood" } },
      grid: ["0110000110", "1111001111", "1111111111", "1111111111", "1111111111", "0111111110", "0011111100", "0001111000", "0000110000", "0000100000"] },
    // ── LANG 12×12 (detailrijker, meerkleurig) ─────────────────────────
    { naam: "bloem", kleuren: { "1": { kl: "#ec4899", nm: "roze" }, "2": { kl: "#f59e0b", nm: "geel" }, "3": { kl: "#16a34a", nm: "groen" } },
      grid: ["000111111000", "001111111100", "011122221110", "011122221110", "011222222110", "011122221110", "001111111100", "000111111000", "000003300000", "000033330000", "000003300000", "000003300000"] },
    { naam: "huis groot", kleuren: { "1": { kl: "#dc2626", nm: "rood" }, "2": { kl: "#f59e0b", nm: "geel" }, "3": { kl: "#92400e", nm: "bruin" }, "4": { kl: "#3b82f6", nm: "blauw" } },
      grid: ["000001100000", "000011110000", "000111111000", "001111111100", "011111111110", "222222222222", "224423324422", "224423324422", "222223322222", "222223322222", "222223322222", "222222222222"] },
    { naam: "kerstboom groot", kleuren: { "1": { kl: "#16a34a", nm: "groen" }, "2": { kl: "#92400e", nm: "bruin" }, "3": { kl: "#f59e0b", nm: "geel" } },
      grid: ["000000300000", "000003330000", "000000300000", "000000100000", "000001110000", "000011111000", "000111111100", "001111111110", "011111111110", "111111111111", "000002200000", "000002200000"] },
    { naam: "auto groot", kleuren: { "1": { kl: "#dc2626", nm: "rood" }, "2": { kl: "#1f2937", nm: "zwart" }, "3": { kl: "#93c5fd", nm: "lichtblauw" } },
      grid: ["000000000000", "000111111000", "001133331100", "011111111110", "111111111111", "111111111111", "111111111111", "111111111111", "022000002200", "022000002200", "022000002200", "000000000000"] },
    { naam: "taart groot", kleuren: { "1": { kl: "#ec4899", nm: "roze" }, "2": { kl: "#f59e0b", nm: "geel" }, "3": { kl: "#dc2626", nm: "rood" } },
      grid: ["000300300000", "000300300000", "111111111111", "111111111111", "222222222222", "222222222222", "222222222222", "222222222222", "222222222222", "222222222222", "222222222222", "222222222222"] },
    { naam: "robot", kleuren: { "1": { kl: "#94a3b8", nm: "grijs" }, "2": { kl: "#1f2937", nm: "zwart" } },
      grid: ["000111111000", "001111111100", "011211211110", "011111111110", "011122211110", "001111111000", "000111111000", "011111111110", "111111111111", "111111111111", "010111110010", "010000000010"] },
    { naam: "ster groot", kleuren: { "1": { kl: "#f59e0b", nm: "geel" } },
      grid: ["000001100000", "000001100000", "000011110000", "111111111111", "011111111110", "001111111100", "001111111100", "011111111110", "011110011110", "011100001110", "011000000110", "110000000011"] },
    { naam: "zon groot", kleuren: { "1": { kl: "#f59e0b", nm: "geel" }, "2": { kl: "#f97316", nm: "oranje" } },
      grid: ["000020020000", "002000000200", "000111111000", "000111111000", "021111111120", "011111111110", "011111111110", "021111111120", "000111111000", "000111111000", "002000000200", "000020020000"] },
    { naam: "cupcake", kleuren: { "1": { kl: "#ec4899", nm: "roze" }, "2": { kl: "#f59e0b", nm: "geel" }, "3": { kl: "#dc2626", nm: "rood" } },
      grid: ["000003000000", "000011100000", "000111110000", "001111111000", "011111111100", "111111111110", "011111111100", "022222222000", "022222222000", "022222222000", "002222220000", "002222220000"] },
    { naam: "kat groot", kleuren: { "1": { kl: "#f97316", nm: "oranje" }, "2": { kl: "#1f2937", nm: "zwart" }, "3": { kl: "#ec4899", nm: "roze" } },
      grid: ["010000000010", "011000000110", "111111111111", "111111111111", "112111111211", "111111111111", "111113311111", "111121121111", "111111111111", "011111111110", "001111111100", "000111111000"] },
    { naam: "reuzenhart", kleuren: { "1": { kl: "#e11d48", nm: "rood" } },
      grid: ["011110011110", "111111111111", "111111111111", "111111111111", "111111111111", "011111111110", "011111111110", "001111111100", "000111111000", "000011110000", "000001100000", "000000000000"] },
    { naam: "klok groot", kleuren: { "1": { kl: "#e2e8f0", nm: "grijs" }, "2": { kl: "#1f2937", nm: "zwart" } },
      grid: ["000111111000", "001111111100", "011112111110", "111111111111", "111111211111", "111112221111", "111111211111", "111111111111", "011111111110", "011111111110", "001111111100", "000111111000"] },
    { naam: "paddenstoel groot", kleuren: { "1": { kl: "#dc2626", nm: "rood" }, "2": { kl: "#e7c9a9", nm: "beige" } },
      grid: ["000011110000", "000111111000", "001101101100", "011111111110", "111110111110", "111111111110", "011111111100", "000022220000", "000022220000", "000022220000", "000022220000", "000222222000"] },
    { naam: "ijsje groot", kleuren: { "1": { kl: "#ec4899", nm: "roze" }, "2": { kl: "#92400e", nm: "bruin" } },
      grid: ["000111100000", "001111110000", "011111111000", "011111111000", "001111110000", "000222200000", "000222200000", "000022200000", "000022000000", "000022000000", "000002000000", "000002000000"] }
  ];
  // niet-triviale deler-paren van v (beide factoren ≥2); null bij een priemgetal.
  function delerPaar(v) {
    var opties = []; for (var a = 2; a * a <= v; a++) if (v % a === 0) opties.push([a, v / a]);
    if (!opties.length) return null;
    var p = opties[randInt(0, opties.length - 1)];
    return Math.random() < 0.5 ? p : [p[1], p[0]];
  }
  // één som met uitkomst v in de gegeven bewerking; null als het niet netjes kan.
  function bouwSomOp(v, op) {
    if (op === "+") { if (v < 2) return null; var a = randInt(1, v - 1); return a + " + " + (v - a); }
    if (op === "-") { var b = randInt(1, Math.max(1, Math.round(v * 0.8))); return (v + b) + " − " + b; }
    if (op === "×") { var d = delerPaar(v); return d ? d[0] + " × " + d[1] : null; }
    if (op === ":") { var f = randInt(2, Math.max(2, Math.min(9, Math.floor(40 / Math.max(1, v)) + 1))); return (v * f) + " : " + f; }
    return null;
  }
  // één som met uitkomst v; kies uit de toegestane bewerkingen (met vangnet).
  function somMet(v, ops) {
    var volgorde = shuffle((ops && ops.length ? ops : ["+"]).slice());
    for (var i = 0; i < volgorde.length; i++) { var s = bouwSomOp(v, volgorde[i]); if (s) return { som: s, antwoord: String(v) }; }
    return { som: bouwSomOp(v, "+") || (v + " + 0"), antwoord: String(v) };
  }
  // normaliseer spec → lijst bewerkingen
  function bewerkingenUit(spec) {
    var geldig = ["+", "-", "×", ":"];
    function norm(o) { o = String(o).toLowerCase(); return o === "x" || o === "*" || o === "keer" ? "×" : o === "/" || o === "delen" || o === "÷" ? ":" : o === "min" ? "-" : o === "plus" ? "+" : o; }
    if (Array.isArray(spec.bewerkingen) && spec.bewerkingen.length) { var a = spec.bewerkingen.map(norm).filter(function (o) { return geldig.indexOf(o) !== -1; }); if (a.length) return a; }
    var bw = norm(spec.bewerking || "+");
    if (bw === "mix") return ["+", "-"];
    if (bw === "alle") return ["+", "-", "×", ":"];
    return geldig.indexOf(bw) !== -1 ? [bw] : ["+"];
  }
  function genKleurplaat(spec) {
    spec = spec || {};
    var doel = spec.grootte || 7, ops = bewerkingenUit(spec);
    var multipl = ops.every(function (o) { return o === "×" || o === ":"; }); // alleen keer/deel → composiete waarden
    var tpl = null;
    if (spec.naam) { for (var t = 0; t < KLEURPLATEN.length; t++) if (KLEURPLATEN[t].naam === spec.naam) tpl = KLEURPLATEN[t]; }
    if (!tpl) {
      // vierkante icoontjes; de lengte (doel = 7/8/10) kiest de grootte → aantal sommen
      var pool = KLEURPLATEN.filter(function (k) { return k.grid[0].length === doel; });
      if (!pool.length) pool = KLEURPLATEN;
      tpl = pool[randInt(0, pool.length - 1)];
    }
    var grid = tpl.grid, h = grid.length, w = grid[0].length;
    // bij keer/deel composiete waarden (zodat × en : netjes uitkomen); anders gemengd
    var waarden = shuffle(multipl ? [6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 24] : [5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 18]);
    var wi = 0, valMap = {}, legenda = [];
    Object.keys(tpl.kleuren).forEach(function (ch) { var v = waarden[wi++]; valMap[ch] = v; legenda.push({ waarde: v, kleur: tpl.kleuren[ch].kl, naam: tpl.kleuren[ch].nm }); });
    var bgVal = waarden[wi++];
    legenda.push({ waarde: bgVal, kleur: null, naam: "wit laten" });
    var cellen = [];
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var ch = grid[y].charAt(x), target = ch !== "0" ? valMap[ch] : bgVal, kleur = ch !== "0" ? tpl.kleuren[ch].kl : null;
      var s = somMet(target, ops); cellen.push({ som: s.som, antwoord: s.antwoord, kleur: kleur });
    }
    return { w: w, h: h, cellen: cellen, legenda: legenda };
  }

  // Staafdiagram: gebruikt door de AI aangeleverde data; code tekent + maakt vragen.
  // Staafdiagram: vragen schalen mee met de groep (SLO-leerlijn, domein Verbanden).
  // g3-4 aflezen · g4-5 verschil/totaal · g5-6 afronden/waar-niet-waar/gemiddelde
  // · g7-8 vergelijken + zelf een conclusie trekken.
  function genStaaf(b) {
    b = b || {};
    var spec = b.spec || {};
    var data = arr(b.data).filter(function (d) { return d && d.label != null && isFinite(d.waarde); }).slice(0, 8);
    if (data.length < 2) data = [{ label: "ma", waarde: 6 }, { label: "di", waarde: 9 }, { label: "wo", waarde: 3 }, { label: "do", waarde: 7 }, { label: "vr", waarde: 5 }];
    var groep = Math.max(3, Math.min(8, parseInt(b.groep || spec.groep, 10) || 5));
    var eenheid = b.eenheid || spec.eenheid || "";
    var ehv = eenheid ? eenheid + " " : "";
    var srt = data.slice().sort(function (a, b) { return b.waarde - a.waarde; });
    var maxD = srt[0], minD = srt[srt.length - 1];
    var totaal = data.reduce(function (s, d) { return s + d.waarde; }, 0), n = data.length, gem = totaal / n;
    var sh = shuffle(data.slice());
    var cat = b.categorie || spec.categorie || ""; // wat een staaf voorstelt: "dag", "kleur", "dier"
    var perCat = cat ? " per " + cat : "";
    function N2(d) { return String(d.naam || d.label); } // volledige naam in de vraag (geen afkorting)
    function meer(x, y) { if (y.waarde > x.waarde) { var t = x; x = y; y = t; } return { vraag: "Hoeveel " + ehv + "meer bij " + N2(x) + " dan bij " + N2(y) + "?", antwoord: String(x.waarde - y.waarde) }; }
    // basis (alle groepen) + groep-extra's; extra's staan op niveau-volgorde (hoogste
    // eerst) zodat de leerlijn-specifieke vraag niet wegvalt door de limiet.
    var basis = [
      { vraag: cat ? "Welke " + cat + " heeft de meeste " + eenheid + "?" : "Welke balk is het hoogst?", antwoord: N2(maxD) },
      { vraag: cat ? "Welke " + cat + " heeft de minste " + eenheid + "?" : "Welke balk is het laagst?", antwoord: N2(minD) },
      { vraag: "Hoeveel " + ehv + "bij " + N2(sh[0]) + "?", antwoord: String(sh[0].waarde) }
    ];
    var extra = [];
    if (groep >= 8) extra.push({ vraag: "Schrijf één ding op dat je uit de grafiek kunt aflezen.", antwoord: "Eigen antwoord." });
    if (groep >= 7 && n > 2) extra.push(meer(sh[0], sh[2]));
    if (groep >= 6 && totaal % n === 0) extra.push({ vraag: "Wat is het gemiddelde aantal " + eenheid + perCat + "?", antwoord: String(gem) });
    if (groep >= 5) {
      extra.push({ vraag: "Waar of niet waar: bij " + N2(sh[0]) + " zijn er meer " + eenheid + " dan bij " + N2(sh[1]) + ".", antwoord: sh[0].waarde > sh[1].waarde ? "waar" : "niet waar" });
      if (maxD.waarde >= 20) extra.push({ vraag: "Rond het aantal " + eenheid + " bij " + N2(sh[2 % n]) + " af op een tiental.", antwoord: String(Math.round(sh[2 % n].waarde / 10) * 10) });
    }
    if (groep >= 4) extra.push(meer(maxD, minD), { vraag: "Hoeveel " + ehv + "zijn er in totaal?", antwoord: String(totaal) });
    // filler om tot het gevraagde aantal te komen: meer staven aflezen (alle groepen)
    // en — vanaf groep 4 — extra verschilvragen tussen opeenvolgende staven.
    var filler = [];
    sh.forEach(function (d) { filler.push({ vraag: "Hoeveel " + ehv + "bij " + N2(d) + "?", antwoord: String(d.waarde) }); });
    if (groep >= 4) for (var p = 0; p < sh.length - 1; p++) filler.push(meer(sh[p], sh[p + 1]));
    var seen = {}, Q = [];
    basis.concat(extra, filler).forEach(function (q) { if (!seen[q.vraag]) { seen[q.vraag] = 1; Q.push(q); } });
    var aantal = Math.max(3, Math.min(Q.length, spec.vragen || (groep <= 3 ? 3 : 5)));
    return { data: data, titel: b.titel || spec.titel || "", eenheid: eenheid, groep: groep, vragen: Q.slice(0, aantal) };
  }

  // Sudoku (4x4 of 6x6) — patroon + permutaties, dan gaten.
  function genSudoku(spec) {
    spec = spec || {};
    var g = String(spec.grootte || "");
    var n = (spec.grootte === 9 || g.indexOf("9") !== -1) ? 9 : (spec.grootte === 6 || g.indexOf("6") !== -1) ? 6 : 4;
    var br = n === 9 ? 3 : 2, bc = n === 4 ? 2 : 3; // vak = br rijen × bc kolommen (4×4→2×2, 6×6→2×3, 9×9→3×3)
    function pat(r, c) { return (bc * (r % br) + Math.floor(r / br) + c) % n; }
    function perm(bandCount, bandSize) { var out = []; shuffle(rangeArr(0, bandCount - 1)).forEach(function (band) { shuffle(rangeArr(0, bandSize - 1)).forEach(function (i) { out.push(band * bandSize + i); }); }); return out; }
    var rows = perm(n / br, br), cols = perm(n / bc, bc), nums = shuffle(rangeArr(1, n));
    var sol = [];
    for (var r = 0; r < n; r++) { sol.push([]); for (var c = 0; c < n; c++) sol[r].push(nums[pat(rows[r], cols[c])]); }
    var puzzle = sol.map(function (row) { return row.slice(); });
    var weg = Math.round(n * n * (spec.moeilijk ? 0.6 : 0.5)), cellen = shuffle(rangeArr(0, n * n - 1));
    for (var k = 0; k < weg; k++) { var idx = cellen[k]; puzzle[Math.floor(idx / n)][idx % n] = 0; }
    return { n: n, br: br, bc: bc, puzzle: puzzle, sol: sol, symbolen: !!spec.symbolen };
  }

  // Geheimschrift: elk woord-letter krijgt een symbool; de leerling decodeert.
  var GEHEIM_POOL = ["★", "▲", "●", "◆", "♥", "☀", "☂", "✿", "♣", "♠", "✚", "✦", "◐", "☁", "✪", "❀", "➤", "◼", "◇", "♪", "☘", "✺", "☾", "✈", "✶", "✸"];
  function genGeheim(woorden) {
    var lijst = arr(woorden).map(alleenLetters).filter(function (w) { return w.length >= 2; }).slice(0, 6);
    if (!lijst.length) return null;
    var letters = {}; lijst.forEach(function (w) { for (var i = 0; i < w.length; i++) letters[w[i]] = 1; });
    var uniek = Object.keys(letters).sort(), sym = shuffle(GEHEIM_POOL).slice(0, uniek.length), map = {};
    uniek.forEach(function (l, i) { map[l] = sym[i] || l; });
    return { map: map, woorden: lijst };
  }

  // Anagram: husselt de letters van een woord. Bij LANGERE woorden houden we een
  // aaneengesloten stuk op de goede plek staan (als houvast, in de render onderstreept),
  // zodat er hooguit ~5 letters echt door elkaar staan. Korte woorden (<=5): volledig.
  function genHussel(woorden) {
    return arr(woorden).map(function (w) {
      var W = String(w && w.woord != null ? w.woord : w).trim().toUpperCase(); if (W.length < 2) return null;
      var n = W.length, letters = W.split("");
      var ankerLen = n <= 5 ? 0 : Math.max(3, n - 5); // vast blok groeit mee → altijd ~5 los
      var vast = new Array(n).fill(false);
      if (ankerLen > 0 && ankerLen < n) {
        var start = Math.floor(Math.random() * (n - ankerLen + 1));
        for (var a = 0; a < ankerLen; a++) vast[start + a] = true;
      }
      var vrijeIdx = [], vrijeLet = [];
      for (var i = 0; i < n; i++) if (!vast[i]) { vrijeIdx.push(i); vrijeLet.push(letters[i]); }
      var out = letters.slice(), p = 0;
      do {
        var geschud = shuffle(vrijeLet.slice());
        for (var j = 0; j < vrijeIdx.length; j++) out[vrijeIdx[j]] = geschud[j];
        p++;
      } while (out.join("") === W && p < 12 && vrijeIdx.length > 1);
      var door = out.map(function (c, idx) { return { c: c, vast: vast[idx] }; });
      return { door: door, antwoord: W, hint: ankerLen > 0 };
    }).filter(Boolean);
  }

  // Zinbouwen: husselt de woorden van een zin.
  function genZin(zinnen) {
    return arr(zinnen).map(function (z) {
      var zin = String(z && z.zin != null ? z.zin : z).trim().replace(/\s+/g, " "); if (!zin) return null;
      var woorden = zin.split(" "); if (woorden.length < 2) return null;
      var door, p = 0;
      do { door = shuffle(woorden); p++; } while (door.join(" ") === zin && p < 12);
      return { door: door, antwoord: zin };
    }).filter(Boolean);
  }


  // Bingokaart: rooster met getallen of woorden.
  function genBingo(spec) {
    spec = spec || {};
    var n = spec.grootte === 5 ? 5 : 4, soort = spec.soort === "woorden" ? "woorden" : "getallen", cellen = [];
    if (soort === "woorden") { var pool = shuffle(arr(spec.woorden).map(String).filter(Boolean)); for (var i = 0; i < n * n; i++) cellen.push(pool.length ? pool[i % pool.length] : ""); }
    else { var max = Math.max(n * n, spec.max || 50); cellen = shuffle(rangeArr(1, max)).slice(0, n * n).map(String); }
    return { n: n, cellen: cellen };
  }

  // Groepeer een (geheel) getal met duizendpunten: 1234567 → "1.234.567".
  function groepeer(n) {
    var neg = n < 0 ? "-" : "", s = String(Math.abs(Math.floor(n)));
    return neg + s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // Getal → Nederlandse woorden (0 t/m in de miljarden). Groepen onder een miljoen
  // zijn één woord; "miljoen" en "miljard" staan los met een spatie ervoor.
  function getalNaarWoord(n) {
    n = Math.floor(Math.abs(n));
    if (n === 0) return "nul";
    var E = ["", "een", "twee", "drie", "vier", "vijf", "zes", "zeven", "acht", "negen", "tien", "elf", "twaalf", "dertien", "veertien", "vijftien", "zestien", "zeventien", "achttien", "negentien"];
    var T = ["", "", "twintig", "dertig", "veertig", "vijftig", "zestig", "zeventig", "tachtig", "negentig"];
    function o100(x) { if (x < 20) return E[x]; var t = Math.floor(x / 10), e = x % 10; if (e === 0) return T[t]; var pre = e === 2 ? "tweeën" : e === 3 ? "drieën" : E[e] + "en"; return pre + T[t]; }
    function o1000(x) { if (x < 100) return o100(x); var h = Math.floor(x / 100), r = x % 100; return (h > 1 ? E[h] : "") + "honderd" + (r ? o100(r) : ""); }
    function onderMiljoen(x) { if (x < 1000) return o1000(x); var d = Math.floor(x / 1000), r = x % 1000; return (d > 1 ? o1000(d) : "") + "duizend" + (r ? o1000(r) : ""); }
    if (n < 1000000) return onderMiljoen(n);
    var delen = [];
    var miljard = Math.floor(n / 1e9); n %= 1e9;
    var miljoen = Math.floor(n / 1e6); n %= 1e6;
    if (miljard) delen.push((miljard > 1 ? onderMiljoen(miljard) : "een") + " miljard");
    if (miljoen) delen.push((miljoen > 1 ? onderMiljoen(miljoen) : "een") + " miljoen");
    if (n) delen.push(onderMiljoen(n));
    return delen.join(" ");
  }
  // Getal → Romeins.
  function naarRomeins(n) {
    var m = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]], s = "";
    n = Math.max(1, Math.floor(n));
    m.forEach(function (p) { while (n >= p[0]) { s += p[1]; n -= p[0]; } });
    return s;
  }

  // Cijferend rekenen (onder elkaar): +, − of × (2-cijferig × 1-cijferig).
  function genCijferend(spec) {
    spec = spec || {};
    var op = ["+", "-", "×"].indexOf(spec.bewerking) !== -1 ? spec.bewerking : "+";
    var aantal = Math.min(8, Math.max(2, spec.aantal || 6)), max = spec.max || 1000, items = [];
    for (var i = 0; i < aantal; i++) {
      var a, b, ant, partials = null;
      if (op === "+") { a = randInt(100, max); b = randInt(100, max); ant = a + b; }
      else if (op === "-") { a = randInt(100, max); b = randInt(10, a); ant = a - b; }
      else {
        var ma = Math.min(999, spec.maxA || 99), mb = Math.min(99, spec.maxB || 99);
        a = randInt(12, ma); b = randInt(12, mb); ant = a * b;
        // Tussenstappen (deelproducten) per cijfer van b, met de juiste nullen.
        partials = []; var bs = String(b);
        for (var p = 0; p < bs.length; p++) {
          var d = +bs.charAt(bs.length - 1 - p), z = ""; for (var k = 0; k < p; k++) z += "0";
          partials.push(String(a * d) + z);
        }
      }
      items.push({ a: a, b: b, op: op, antwoord: String(ant), partials: partials });
    }
    return { op: op, items: items };
  }

  // Ontbrekend getal (a + □ = c).
  function genOntbrekend(spec) {
    spec = spec || {};
    var op = ["+", "-", "×", "÷"].indexOf(spec.bewerking) !== -1 ? spec.bewerking : "+";
    var komma = !!spec.kommagetallen && (op === "+" || op === "-"); // kommagetallen alleen zinvol bij +/−
    var aantal = Math.min(15, Math.max(2, spec.aantal || 6)), max = spec.max || 20, items = [];
    function r1(x) { return Math.round(x * 10) / 10; }
    for (var i = 0; i < aantal; i++) {
      var a, b, res;
      if (komma) {
        if (op === "+") { a = r1(randInt(1, max * 10) / 10); b = r1(randInt(1, max * 10) / 10); res = r1(a + b); }
        else { a = r1(randInt(2, max * 10) / 10); b = r1(randInt(1, Math.round(a * 10)) / 10); res = r1(a - b); }
      } else if (op === "+") { a = randInt(1, max); b = randInt(1, max); res = a + b; }
      else if (op === "-") { a = randInt(2, max); b = randInt(1, a); res = a - b; }
      else if (op === "×") { a = randInt(2, 10); b = randInt(2, 10); res = a * b; }
      else { b = randInt(2, 10); res = randInt(2, 10); a = b * res; } // ÷: a ÷ b = res (altijd heel)
      items.push({ a: a, b: b, res: res, op: op, komma: komma, mis: randInt(0, 1) });
    }
    return items;
  }

  // Buurgetallen (x minder / x meer).
  function genBuren(spec) {
    spec = spec || {};
    var aantal = Math.min(12, Math.max(2, spec.aantal || 6));
    var max = Math.max(10, spec.max || 100);
    // Kommagetallen-variant: reken in TIENDEN (geen float-ruis), toon met komma.
    if (spec.kommagetallen) {
      var gegevenK = arr(spec.stappen).map(function (s) { return Math.round(s * 10); }).filter(function (s) { return s >= 1; });
      var wisselK = !!spec.wissel || gegevenK.length > 1;
      var poolK = gegevenK.length ? gegevenK : [1, 2, 5]; // 0,1 · 0,2 · 0,5
      var vastK = spec.stap ? Math.round(spec.stap * 10) : (gegevenK.length === 1 ? gegevenK[0] : 2);
      var maxT = Math.max(20, Math.min(max * 10, 300)), itemsK = [];
      for (var q = 0; q < aantal; q++) {
        var sK = wisselK ? poolK[randInt(0, poolK.length - 1)] : vastK;
        var nK = randInt(sK + 1, maxT - sK);
        itemsK.push({ n: nK / 10, stap: sK / 10, minder: (nK - sK) / 10, meer: (nK + sK) / 10, komma: true });
      }
      return { wissel: wisselK, stap: vastK / 10, komma: true, items: itemsK };
    }
    // twee modes: vaste stap over de hele opdracht (spec.stap), of wisselende stap
    // per rij (spec.wissel of een lijst spec.stappen). Pool schaalt met het bereik.
    var gegeven = arr(spec.stappen).filter(function (s) { return s >= 1; });
    var wissel = !!spec.wissel || gegeven.length > 1;
    // mix van ronde én niet-ronde stappen (3, 7, 15, 75, …) voor extra uitdaging
    var stappen = gegeven.length ? gegeven : (max <= 20 ? [1, 2, 3, 5, 7] : max <= 100 ? [2, 3, 5, 7, 10, 15, 25] : max <= 1000 ? [10, 15, 25, 50, 75, 100] : [50, 100, 250, 500, 1000]);
    var vastStap = spec.stap || (gegeven.length === 1 ? gegeven[0] : 1);
    var items = [];
    for (var i = 0; i < aantal; i++) {
      var stap = wissel ? stappen[randInt(0, stappen.length - 1)] : vastStap;
      var n = randInt(stap + 1, Math.max(stap + 2, max - stap));
      items.push({ n: n, stap: stap, minder: n - stap, meer: n + stap });
    }
    return { wissel: wissel, stap: vastStap, items: items };
  }

  // Getallen ordenen.
  function genOrdenen(spec) {
    spec = spec || {};
    var soort = spec.soort || "getallen";
    var aantal = Math.min(8, Math.max(2, spec.aantal || 4)), max = spec.max || 100, aflopend = !!spec.aflopend, rijen = [];
    // Kommagetallen/procenten: numeriek sorteren, dán als NL-string tonen.
    if (soort === "kommagetallen" || soort === "procenten") {
      var vastK = spec.perRij ? Math.min(6, Math.max(3, spec.perRij)) : 0;
      function disp(v) { return soort === "procenten" ? v + "%" : String(v).replace(".", ","); }
      for (var rk = 0; rk < aantal; rk++) {
        var perRijK = vastK || randInt(3, 5), setK = {};
        while (Object.keys(setK).length < perRijK) {
          var val = soort === "procenten" ? randInt(1, 20) * 5 : randInt(1, (spec.max || 10) * 10) / 10;
          setK[val] = 1;
        }
        var numsK = Object.keys(setK).map(Number);
        var sortedK = numsK.slice().sort(function (a, b) { return aflopend ? b - a : a - b; });
        rijen.push({ door: shuffle(numsK).map(disp), antwoord: sortedK.map(disp) });
      }
      return { aflopend: aflopend, soort: soort, rijen: rijen };
    }
    // Breuken ordenen: op WAARDE sorteren (dus vergelijken), tonen als echte breuk.
    if (soort === "breuken") {
      var NOEM = [2, 3, 4, 5, 6, 8], vastB = spec.perRij ? Math.min(5, Math.max(3, spec.perRij)) : 0;
      for (var rb = 0; rb < aantal; rb++) {
        var perRijB = vastB || randInt(3, 4), zien = {}, fracs = [], guard = 0;
        while (fracs.length < perRijB && guard < 200) {
          guard++;
          var nb = NOEM[randInt(0, NOEM.length - 1)], tb = randInt(1, nb - 1), vb = tb / nb, sleutel = vb.toFixed(4);
          if (zien[sleutel]) continue; // geen twee gelijke waarden (bijv. 1/2 en 2/4) → eenduidig te ordenen
          zien[sleutel] = 1; fracs.push({ t: tb, n: nb, val: vb });
        }
        var sortedB = fracs.slice().sort(function (a, b) { return aflopend ? b.val - a.val : a.val - b.val; });
        function frac(f) { return breukHtml(f.t, f.n); }
        rijen.push({ door: shuffle(fracs).map(frac), antwoord: sortedB.map(frac) });
      }
      return { aflopend: aflopend, soort: "breuken", rijen: rijen };
    }
    // aantal getallen per rij WISSELT (soms minder, soms meer); bovengrens schaalt
    // met het bereik zodat brede getallen niet buiten het werkblad vallen.
    var vast = spec.perRij ? Math.min(8, Math.max(3, spec.perRij)) : 0;
    var bovengrens = max >= 1000 ? 5 : max >= 100 ? 6 : 7;
    for (var r = 0; r < aantal; r++) {
      var perRij = vast || randInt(3, bovengrens);
      var set = {}; while (Object.keys(set).length < perRij) set[randInt(1, max)] = 1;
      var g = Object.keys(set).map(Number);
      rijen.push({ door: shuffle(g), antwoord: g.slice().sort(function (a, b) { return aflopend ? b - a : a - b; }) });
    }
    return { aflopend: aflopend, rijen: rijen };
  }

  // Plaatswaarde.
  var PLAATS = ["eenheden", "tientallen", "honderdtallen", "duizendtallen"];
  var PLAATS_ENK = ["de eenheid", "het tiental", "het honderdtal", "het duizendtal"];
  function genPlaats(spec) {
    spec = spec || {};
    var aantal = Math.min(8, Math.max(2, spec.aantal || 5)), max = spec.max || 1000, items = [];
    for (var i = 0; i < aantal; i++) { var n = randInt(10, max), d = String(n), pos = randInt(0, d.length - 1); items.push({ n: n, pos: pos, cijfer: d.charAt(d.length - 1 - pos) }); }
    return items;
  }

  // Getal in cijfers ↔ in woorden.
  function genGetalwoord(spec) {
    spec = spec || {};
    var aantal = Math.min(8, Math.max(2, spec.aantal || 5)), max = Math.max(10, spec.max || 1000), richting = spec.richting || "mix", items = [];
    var maxDig = String(max).length;
    for (var i = 0; i < aantal; i++) {
      // varieer de grootte (niet alles bij de max) → spreiding van klein tot groot
      var d = randInt(2, maxDig), lo = Math.pow(10, d - 1), hi = Math.min(max, Math.pow(10, d) - 1);
      var n = randInt(lo, hi);
      var nw = richting === "naarcijfer" ? false : richting === "naarwoord" ? true : Math.random() < 0.5;
      items.push({ n: n, woord: getalNaarWoord(n), naarWoord: nw });
    }
    return items;
  }

  // Afronden.
  function genAfronden(spec) {
    spec = spec || {};
    var toegestaan = [10, 100, 1000, 10000];
    var set = arr(spec.naartjes).filter(function (x) { return toegestaan.indexOf(x) !== -1; });
    var wissel = !!spec.wissel || set.length > 1;
    if (!set.length) set = [toegestaan.indexOf(spec.naar) !== -1 ? spec.naar : 10];
    var aantal = Math.min(12, Math.max(2, spec.aantal || 6));
    var grootste = Math.max.apply(null, set), max = spec.max || grootste * 12, items = [];
    for (var i = 0; i < aantal; i++) {
      var naar = wissel ? set[randInt(0, set.length - 1)] : set[0];
      var n = randInt(naar + 1, Math.max(naar * 2, max));
      items.push({ n: n, naar: naar, antwoord: Math.round(n / naar) * naar });
    }
    return { wissel: wissel, naar: set[0], set: set, items: items };
  }
  function afrNaam(naar) { return naar === 10 ? "tiental" : naar === 100 ? "honderdtal" : naar === 1000 ? "duizendtal" : "tienduizendtal"; }
  function afrDicht(naar) { return naar === 10 ? "tien" : naar === 100 ? "honderd" : naar === 1000 ? "duizend" : "tienduizend"; }

  // Maaltafel-rooster.
  function genMaalrooster(spec) {
    spec = spec || {};
    var boven = arr(spec.boven).length ? spec.boven : shuffle(rangeArr(1, 10)).slice(0, Math.min(6, spec.kolommen || 5)).sort(function (a, b) { return a - b; });
    var links = arr(spec.links).length ? spec.links : shuffle(rangeArr(1, 10)).slice(0, Math.min(6, spec.rijen || 5)).sort(function (a, b) { return a - b; });
    return { boven: boven, links: links };
  }
  // 1 t/m 3 maaltafel-roosters (schaalt met de lengte); naast elkaar gecentreerd.
  function genMaalroosters(spec) {
    spec = spec || {};
    var n = Math.min(3, Math.max(1, spec.aantal || 1)), roosters = [];
    for (var i = 0; i < n; i++) roosters.push(genMaalrooster(spec));
    return roosters;
  }

  // Romeinse cijfers.
  function genRomeins(spec) {
    spec = spec || {};
    var aantal = Math.min(10, Math.max(2, spec.aantal || 6)), max = spec.max || 50, richting = spec.richting || "mix", items = [];
    for (var i = 0; i < aantal; i++) { var n = randInt(1, max), nr = richting === "naarcijfer" ? false : richting === "naarromeins" ? true : Math.random() < 0.5; items.push({ n: n, romeins: naarRomeins(n), naarR: nr }); }
    return items;
  }

  // Automatiseer-sprint (veel kale sommen).
  function genSprint(spec) {
    spec = spec || {};
    return { items: genSommen({ bewerking: spec.bewerking || "mix", min: spec.min || 1, max: spec.max || 10, aantal: Math.min(40, Math.max(10, spec.aantal || 20)) }) };
  }

  // ── Normaliseren: gegenereerde inhoud IN het object vastleggen ─────────────
  // Zo zijn scherm, print en antwoordblad altijd identiek (één keer genereren).
  // Zoek-de-fout-vangnet: de fout moet ÉCHT bestaan. We tellen de woord-verschillen
  // tussen de foute zin en de correcte zin; dat moet precies 1 zijn (één verbeterd
  // woord). Geen verschil = er zit geen fout in (de bug van 2-7); meer dan één, of een
  // ander aantal woorden = geen schone één-fout-zin → item weggooien (net als het
  // invul-vangnet). De AARD van de fout (spelling/lidwoord/grammatica) blijft aan de
  // prompt over; de code controleert alleen dát er precies één woord verandert.
  function zfTokens(s) {
    return String(s == null ? "" : s).trim().split(/\s+/)
      .map(function (t) { return t.replace(/^[^0-9A-Za-zÀ-ÿ]+|[^0-9A-Za-zÀ-ÿ]+$/g, ""); })
      .filter(function (t) { return t.length; });
  }
  function zfWoordVerschil(zin, correct) {
    var a = zfTokens(zin), b = zfTokens(correct);
    if (!a.length || a.length !== b.length) return -1; // ander aantal woorden → geen schone verbetering
    var d = 0;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
    return d;
  }

  function normaliseer(wb) {
    wb = wb || {};
    wb.blokken = arr(wb.blokken);
    wb.blokken.forEach(function (b) {
      if (!b || !b.type) return;
      // Zoek-de-fout: houd alleen zinnen met precies ÉÉN echte fout (zie hierboven).
      // Blijft er minstens één goede zin over, dan gebruiken we die; anders laten we de
      // zinnen staan (fail-safe: liever een niet-perfecte opdracht dan een lege).
      if (b.type === "zoekdefout") {
        var goed = arr(b.zinnen).filter(function (z) {
          var zin = (z && z.zin != null) ? z.zin : z, correct = (z && z.correct) || "";
          return correct && zfWoordVerschil(zin, correct) === 1;
        });
        if (goed.length) b.zinnen = goed;
      }
      // Meerkeuze-opties één keer husselen, zodat het goede antwoord niet altijd
      // op dezelfde plek staat (ongeacht waar de AI het zette). Eén keer, opgeslagen.
      if (b.type === "meerkeuze" && !b._mkShuf) {
        arr(b.vragen).forEach(function (v) {
          var ops = arr(v.opties); if (ops.length < 2) return;
          var paar = shuffle(ops.map(function (o, i) { return { o: o, goed: i === v.goed }; }));
          v.opties = paar.map(function (p) { return p.o; });
          var g = 0; for (var i = 0; i < paar.length; i++) if (paar[i].goed) g = i;
          v.goed = g;
        });
        b._mkShuf = true;
      }
      // Koppelen/synant: rechter-volgorde één keer vastleggen, zodat vraag- en
      // antwoordblad dezelfde indeling tonen (en het antwoord = lijnen trekken).
      if ((b.type === "koppelen" || b.type === "synant") && !b._kpVolg) {
        var nn = arr(b.paren).length;
        b._kpVolg = nn ? shuffle(rangeArr(0, nn - 1)) : [];
      }
      if (b.type === "sommen" && !arr(b.items).length) {
        b.items = genSommen(b.spec || b);
      }
      if (b.type === "getallenlijn" && !b._lijnen) {
        b._lijnen = genGetallenlijnReeks(b.spec || b);
      }
      if (b.type === "woordzoeker" && !b._wz) {
        b._wz = genWoordzoeker(b.woorden);
      }
      if (b.type === "rekenmuurtje" && !b._muren) b._muren = genMuren(b.spec || b);
      if (b.type === "getalhuis" && !b._huizen) b._huizen = genHuizen(b.spec || b);
      if (b.type === "klok" && !b._klok) b._klok = genKlok(b.spec || b);
      if (b.type === "geld" && !b._geld) b._geld = genGeld(b.spec || b);
      if (b.type === "doolhof" && !b._doolhof) b._doolhof = genDoolhof(b.spec || b);
      if (b.type === "kruiswoord" && !b._kruis) b._kruis = genKruiswoord(b.woorden);
      if (b.type === "reeks" && !b._reeks) b._reeks = genReeks(b.spec || b);
      if (b.type === "vergelijken" && !b._verg) b._verg = genVergelijk(b.spec || b);
      if (b.type === "tafelkaart" && !b._tafel) b._tafel = genTafel(b.spec || b);
      if (b.type === "breuken" && !b._breuk) b._breuk = genBreuken(b.spec || b);
      if (b.type === "kleuropsom" && !b._kleur) b._kleur = genKleurplaat(b.spec || b);
      if (b.type === "staafdiagram" && !b._staaf) b._staaf = genStaaf(b);
      if (b.type === "sudoku" && !b._sudoku) b._sudoku = genSudoku(b.spec || b);
      if (b.type === "geheimschrift" && !b._geheim) b._geheim = genGeheim(b.woorden);
      if (b.type === "anagram" && !b._hussel) b._hussel = genHussel(b.woorden);
      if (b.type === "zinbouwen" && !b._zin) b._zin = genZin(b.zinnen);
      if (b.type === "bingo" && !b._bingo) b._bingo = genBingo(b.spec || b);
      if ((b.type === "cijferend" || b.type === "cijferplus" || b.type === "cijfermin" || b.type === "cijferkeer") && !b._cijfer) {
        var cijOp = { cijferplus: "+", cijfermin: "-", cijferkeer: "×" }[b.type];
        if (cijOp) { b.spec = b.spec || {}; b.spec.bewerking = cijOp; }
        b._cijfer = genCijferend(b.spec || b);
      }
      if (b.type === "ontbrekend" && !b._ontbr) b._ontbr = genOntbrekend(b.spec || b);
      if (b.type === "buurgetallen" && !b._buren) b._buren = genBuren(b.spec || b);
      if (b.type === "ordenen" && !b._orden) b._orden = genOrdenen(b.spec || b);
      if (b.type === "plaatswaarde" && !b._plaats) b._plaats = genPlaats(b.spec || b);
      if (b.type === "getalwoord" && !b._getalw) b._getalw = genGetalwoord(b.spec || b);
      if (b.type === "afronden" && !b._afr) b._afr = genAfronden(b.spec || b);
      if (b.type === "maalrooster" && !b._maalroosters) b._maalroosters = genMaalroosters(b.spec || b);
      if (b.type === "romeins" && !b._rom) b._rom = genRomeins(b.spec || b);
      if (b.type === "automatiseer" && !b._sprint) b._sprint = genSprint(b.spec || b);
    });
    return wb;
  }

  // ── Blok-renderers ─────────────────────────────────────────────────────────
  // Elk geeft HTML terug. `nr` = opdrachtnummer (of null voor tekst/reflectie).
  // `ant` = true → toon de antwoorden (voor het antwoordblad).

  function opdrachtKop(nr, tekst, em) {
    var n = nr != null ? '<span class="wb-nr">' + nr + "</span>" : "";
    var e = em ? '<span class="wb-kop-em">' + esc(em) + "</span>" : "";
    return '<div class="wb-opdr-kop">' + n + '<span class="wb-opdr-t">' + esc(tekst || "") + "</span>" + e + "</div>";
  }
  function lijn(breed) { return '<span class="wb-lijn" style="min-width:' + (breed || 70) + 'px"></span>'; }
  // Antwoord op het antwoordblad: gewoon een groen woord (geen lijn eronder, zodat
  // het niet óp het invullijntje komt te staan).
  function antLijn(val) { return '<span class="wb-ant" style="padding:0 4px">' + esc(val) + "</span>"; }

  function rTekst(b) {
    var kop = b.kop ? '<div class="wb-tekst-kop">' + esc(b.kop) + "</div>" : "";
    var body = String(b.tekst || "").split(/\n\s*\n/).map(function (p) {
      return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>";
    }).join("");
    return '<div class="wb-blok wb-leesblok">' + kop + '<div class="wb-tekst-body">' + body + "</div></div>";
  }

  function rMeerkeuze(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Kruis het goede antwoord aan.", b.em);
    var lijst = "";
    arr(b.vragen).forEach(function (v, i) {
      lijst += '<div class="wb-vraag"><div class="wb-vraag-t">' + (i + 1) + ". " + esc(v.vraag || "") + "</div>";
      lijst += '<div class="wb-mk-opties">';
      arr(v.opties).forEach(function (o, j) {
        var goed = ant && (v.goed === j);
        // Een vakje om aan te kruisen; op het antwoordblad een kruisje in het goede vakje.
        lijst += '<span class="wb-mk' + (goed ? " wb-goed" : "") + '"><span class="wb-vink">' +
          (goed ? "✗" : "") + "</span> " + esc(o) + "</span>";
      });
      lijst += "</div></div>";
    });
    h += '<div class="wb-mk-lijst">' + lijst + "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rInvul(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Vul het juiste woord in.", b.em);
    h += '<div class="wb-invul-lijst">';
    arr(b.items).forEach(function (it, i) {
      var voor = esc(it.voor != null ? it.voor : (it.zin || "").split("___")[0] || "");
      var na = esc(it.na != null ? it.na : ((it.zin || "").split("___")[1] || ""));
      var gat = ant ? antLijn(it.antwoord || "") : lijn(80);
      h += '<div class="wb-invul-rij"><span class="wb-rij-nr">' + (i + 1) + ".</span><span>" + voor + " " + gat + " " + na + "</span></div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rOpen(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Beantwoord de vragen.", b.em);
    arr(b.vragen).forEach(function (v, i) {
      h += '<div class="wb-open-vraag"><div class="wb-vraag-t">' + (i + 1) + ". " + esc(v.vraag || "") + "</div>";
      if (ant && v.antwoord) {
        h += '<div class="wb-ant-blok">' + esc(v.antwoord) + "</div>";
      } else {
        var regels = Math.max(1, Math.min(6, v.regels || 2));
        h += '<div class="wb-schrijfregels">';
        for (var k = 0; k < regels; k++) h += '<div class="wb-schrijfregel"></div>';
        h += "</div>";
      }
      h += "</div>";
    });
    return '<div class="wb-blok">' + h + "</div>";
  }

  // Gedeelde matching-render (koppelen + synoniemen/antoniemen). Even brede vakjes
  // met een gekleurde stip vast aan de binnenkant; ruime middenzone. De
  // verbindingen worden als ECHTE gebogen lijn getekend (SVG-overlay): op het
  // vraagblad alleen het eerste paar (voorbeeld), op het antwoordblad alle paren.
  function koppelBlok(opd, links, rechts, paren, volg, nr, ant, em) {
    var h = opdrachtKop(nr, opd, em);
    var N = paren.length, rowH = 48;
    if (!volg || volg.length !== N) volg = N ? shuffle(rangeArr(0, N - 1)) : [];
    // Links staat in paar-volgorde; rechts in de VASTE husselvolgorde (volg), zodat
    // vraag- en antwoordblad dezelfde indeling hebben. rightRowOfPair[i] = de rij
    // waar het juiste rechterwoord van paar i staat.
    var rightRowOfPair = {}; volg.forEach(function (pi, d) { rightRowOfPair[pi] = d; });
    var rijen = "";
    for (var d = 0; d < N; d++) {
      rijen += '<div class="wb-kp2-rij"><div class="wb-kp2-box wb-l">' + esc(links[paren[d][0]]) + "</div>" +
        '<span class="wb-stip wb-sl"></span><span class="wb-stip wb-sr"></span>' +
        '<div class="wb-kp2-box wb-r">' + esc(rechts[paren[volg[d]][1]]) + "</div></div>";
    }
    // SVG-lijnen: vraagblad alleen het voorbeeld (paar 0), antwoordblad alle paren.
    var H = Math.max(rowH, N * rowH), svg = '<svg class="wb-kp2-svg" viewBox="0 0 100 ' + H + '" preserveAspectRatio="none" aria-hidden="true">';
    for (var i = 0; i < N; i++) {
      if (!ant && i !== 0) continue;
      var y1 = (rowH * i + rowH / 2).toFixed(1), y2 = (rowH * rightRowOfPair[i] + rowH / 2).toFixed(1);
      svg += '<path d="M40 ' + y1 + " C50 " + y1 + ", 50 " + y2 + ", 60 " + y2 + '" class="wb-kp2-pad" vector-effect="non-scaling-stroke"/>';
    }
    svg += "</svg>";
    h += '<div class="wb-kp2">' + rijen + svg + "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }
  function rKoppelen(b, nr, ant) {
    return koppelBlok(b.opdracht || "Verbind elk vakje met het juiste vakje. Het eerste is al voorgedaan.", arr(b.links), arr(b.rechts), arr(b.paren), b._kpVolg, nr, ant, b.em);
  }

  function rCategoriseren(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Zet elk woord in het juiste vak.", b.em);
    var cats = arr(b.categorieen);
    if (!ant) {
      var bank = [];
      cats.forEach(function (c) { arr(c.items).forEach(function (w) { bank.push(w); }); });
      bank = shuffle(bank);
      h += '<div class="wb-woordbank"><span class="wb-bank-l">Woorden:</span> ' +
        bank.map(function (w) { return '<span class="wb-chip">' + esc(w) + "</span>"; }).join(" ") + "</div>";
    }
    h += '<div class="wb-cats" style="grid-template-columns:repeat(' + Math.min(3, Math.max(1, cats.length)) + ',1fr)">';
    cats.forEach(function (c) {
      h += '<div class="wb-cat"><div class="wb-cat-kop">' + esc(c.naam || "") + "</div><div class='wb-cat-in'>";
      if (ant) {
        h += arr(c.items).map(function (w) { return "<div>" + esc(w) + "</div>"; }).join("");
      } else {
        for (var k = 0; k < Math.max(3, arr(c.items).length); k++) h += '<div class="wb-schrijfregel"></div>';
      }
      h += "</div></div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rWaarNietWaar(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Is het waar of niet waar? Zet een kruisje.", b.em);
    h += '<div class="wb-wnw"><div class="wb-wnw-head"><span></span><span>waar</span><span>niet waar</span></div>';
    arr(b.stellingen).forEach(function (s, i) {
      var w = ant && s.goed === true, nw = ant && s.goed === false;
      h += '<div class="wb-wnw-rij"><span class="wb-wnw-t">' + (i + 1) + ". " + esc(s.stelling || "") + "</span>" +
        '<span class="wb-vak' + (w ? " wb-goed" : "") + '">' + (w ? "✓" : "") + "</span>" +
        '<span class="wb-vak' + (nw ? " wb-goed" : "") + '">' + (nw ? "✓" : "") + "</span></div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rSommen(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Reken uit.", b.em);
    h += somBlok(arr(b.items).map(function (it) { return { expr: it.som + " =", antwoord: it.antwoord }; }), 4, ant, 56);
    return '<div class="wb-blok">' + h + "</div>";
  }

  function lijnSvg(L, ant) {
    var W = 660, padX = 30, y = 54;
    var span = L.eind - L.start || 1;
    function x(v) { return padX + ((v - L.start) / span) * (W - 2 * padX); }
    function lbl(v) { return String(v).replace(".", ","); } // 0.5 → "0,5" (NL); integers ongewijzigd
    var svg = '<svg class="wb-nl" viewBox="0 0 ' + W + ' 96" preserveAspectRatio="xMidYMid meet">';
    svg += '<line x1="' + padX + '" y1="' + y + '" x2="' + (W - padX) + '" y2="' + y + '" class="wb-nl-as"/>';
    svg += '<polygon points="' + (W - padX) + ',' + y + ' ' + (W - padX - 10) + ',' + (y - 5) + ' ' + (W - padX - 10) + ',' + (y + 5) + '" class="wb-nl-pijl"/>';
    L.ticks.forEach(function (v) {
      var gevr = L.gevraagd.indexOf(v) !== -1;
      svg += '<line x1="' + x(v) + '" y1="' + (y - 7) + '" x2="' + x(v) + '" y2="' + (y + 7) + '" class="wb-nl-tick"/>';
      if (gevr) {
        // pijl + invulvakje boven de lijn
        svg += '<rect x="' + (x(v) - 17) + '" y="' + (y - 40) + '" width="34" height="22" rx="5" class="wb-nl-box ' + (ant ? "wb-goed" : "") + '"/>';
        if (ant) svg += '<text x="' + x(v) + '" y="' + (y - 24) + '" class="wb-nl-ant">' + lbl(v) + "</text>";
        svg += '<line x1="' + x(v) + '" y1="' + (y - 18) + '" x2="' + x(v) + '" y2="' + (y - 2) + '" class="wb-nl-wijs"/>';
      } else {
        svg += '<text x="' + x(v) + '" y="' + (y + 24) + '" class="wb-nl-label">' + lbl(v) + "</text>";
      }
    });
    svg += "</svg>";
    return svg;
  }
  function rGetallenlijn(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Welke getallen horen bij de pijlen?", b.em);
    var lijnen = b._lijnen || genGetallenlijnReeks(b.spec || b);
    var out = "";
    lijnen.forEach(function (L) { out += '<div class="wb-nl-wrap">' + lijnSvg(L, ant) + "</div>"; });
    return '<div class="wb-blok">' + h + out + "</div>";
  }

  function rWoordzoeker(b, nr, ant) {
    var W = b._wz || genWoordzoeker(b.woorden);
    var KLEUR = ["#c0392b", "#d35400", "#b9770e", "#7f8c1a", "#1e8449", "#138d75", "#1f8aa5",
      "#2471a3", "#2c3e9b", "#6c3483", "#9b2d8f", "#b03060", "#8e5a2b", "#34495e", "#196f3d", "#5d4037"];
    function kleurVan(i) { return KLEUR[((i % KLEUR.length) + KLEUR.length) % KLEUR.length]; }
    // Getal in de opdracht gelijktrekken met het ECHTE aantal geplaatste woorden.
    var opd = syncAantalWoord(b.opdracht || "Zoek de woorden en streep ze door.", W.woorden.length);
    var h = opdrachtKop(nr, opd, b.em);
    h += '<div class="wb-wz-wrap"><table class="wb-wz' + (ant ? " wb-wz-ant" : "") + '">';
    W.grid.forEach(function (rij) {
      h += "<tr>";
      rij.forEach(function (cel) {
        var hit = ant && cel.w >= 0;
        h += '<td class="' + (hit ? "wb-wz-hit" : "") + '"' +
          (hit ? ' style="background:' + kleurVan(cel.w) + '"' : "") + ">" + esc(cel.l) + "</td>";
      });
      h += "</tr>";
    });
    h += "</table>";
    h += '<div class="wb-wz-woorden">' + W.woorden.map(function (w) {
      var k = kleurVan(W.kleur[w] || 0);
      var st = ant ? ' style="background:' + k + ';border-color:' + k + ';color:#fff"' : "";
      return '<span class="wb-chip"' + st + ">" + esc(w) + "</span>";
    }).join(" ") + "</div></div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rTeken(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Maak een tekening.", b.em);
    var hoog = Math.max(60, Math.min(220, b.hoogte || 120));
    h += '<div class="wb-teken' + (ant ? " wb-teken-ant" : "") + '" style="height:' + hoog + 'px">' + (ant ? "Eigen tekening" : "") + "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rReflectie(b, ant) {
    if (ant) return ""; // reflectie hoort niet op het antwoordblad
    var vraag = b.vraag || "Hoe ging deze opdracht?";
    return '<div class="wb-blok wb-reflectie"><span class="wb-refl-v">' + esc(vraag) + "</span>" +
      '<span class="wb-smileys">😀 &nbsp; 🙂 &nbsp; 😐 &nbsp; 🙁</span></div>';
  }

  function euro(c) { var e = Math.floor(c / 100), r = c % 100; return "€ " + e + "," + (r < 10 ? "0" + r : r); }
  function tijdStr(t) { return t.h + ":" + (t.m < 10 ? "0" + t.m : t.m); }
  // Tijd in Nederlandse spreektaal: "half vijf", "kwart over tien", "vijf voor half zes".
  function tijdNaarWoord(t) {
    var U = ["twaalf", "een", "twee", "drie", "vier", "vijf", "zes", "zeven", "acht", "negen", "tien", "elf"];
    function uu(x) { return U[((x % 12) + 12) % 12]; }
    var h = t.h, m = t.m, vlg = uu(h + 1);
    if (m === 0) return uu(h) + " uur";
    if (m === 5) return "vijf over " + uu(h);
    if (m === 10) return "tien over " + uu(h);
    if (m === 15) return "kwart over " + uu(h);
    if (m === 20) return "tien voor half " + vlg;
    if (m === 25) return "vijf voor half " + vlg;
    if (m === 30) return "half " + vlg;
    if (m === 35) return "vijf over half " + vlg;
    if (m === 40) return "tien over half " + vlg;
    if (m === 45) return "kwart voor " + vlg;
    if (m === 50) return "tien voor " + vlg;
    if (m === 55) return "vijf voor " + vlg;
    return uu(h) + " uur";
  }

  function muurEen(M, ant) {
    var h = '<div class="wb-muur">';
    M.forEach(function (rij, ri) {
      var onderste = ri === M.length - 1;
      h += '<div class="wb-muur-rij">';
      rij.forEach(function (v) {
        var toon = onderste || ant;
        h += '<span class="wb-steen' + (toon && !onderste ? " wb-ant" : "") + '">' + (toon ? v : "") + "</span>";
      });
      h += "</div>";
    });
    return h + "</div>";
  }
  function rMuur(b, nr, ant) {
    var muren = b._muren || genMuren(b.spec || b);
    var h = opdrachtKop(nr, b.opdracht || "Vul het rekenmuurtje in. Elke steen is de som van de twee stenen eronder.", b.em);
    h += '<div class="wb-muren">';
    muren.forEach(function (M) { h += muurEen(M, ant); });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function huisEen(H, ant) {
    var h = '<div class="wb-huis"><div class="wb-huis-dak">' + H.getal + '</div><div class="wb-huis-body">';
    H.rijen.forEach(function (r) {
      h += '<div class="wb-huis-rij"><span class="wb-raam">' + r.links + '</span><span class="wb-huis-en">en</span>' +
        '<span class="wb-raam' + (ant ? " wb-ant" : "") + '">' + (ant ? r.rechts : "") + "</span></div>";
    });
    return h + "</div></div>";
  }
  function rHuis(b, nr, ant) {
    var huizen = b._huizen || genHuizen(b.spec || b);
    var gtl = huizen.map(function (H) { return H.getal; });
    var zelfde = gtl.every(function (g) { return g === gtl[0]; });
    var standaard = zelfde ? ("Splits het getal " + (gtl[0] || "") + ". Vul het tweede getal in.")
      : "Splits elk getal in twee delen. Vul het tweede getal in.";
    var h = opdrachtKop(nr, b.opdracht || standaard, b.em);
    h += '<div class="wb-huizen">';
    huizen.forEach(function (H) { h += huisEen(H, ant); });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function klokSvg(uur, min, cijfers) {
    var cx = 42, cy = 42, s = '<svg class="wb-klok" viewBox="0 0 84 84">';
    s += '<circle cx="42" cy="42" r="38" fill="#fff" stroke="currentColor" stroke-width="2"/>';
    for (var t = 0; t < 12; t++) {
      var a = (t * 30 - 90) * Math.PI / 180;
      s += '<line x1="' + (cx + Math.cos(a) * 34).toFixed(1) + '" y1="' + (cy + Math.sin(a) * 34).toFixed(1) +
        '" x2="' + (cx + Math.cos(a) * 38).toFixed(1) + '" y2="' + (cy + Math.sin(a) * 38).toFixed(1) + '" stroke="currentColor" stroke-width="1.5"/>';
    }
    if (cijfers) {
      for (var u = 1; u <= 12; u++) {
        var au = (u * 30 - 90) * Math.PI / 180;
        s += '<text x="' + (cx + Math.cos(au) * 28).toFixed(1) + '" y="' + (cy + Math.sin(au) * 28 + 4).toFixed(1) + '" class="wb-klok-cijfer">' + u + "</text>";
      }
    }
    var ha = ((uur % 12) * 30 + min * 0.5 - 90) * Math.PI / 180, ma = (min * 6 - 90) * Math.PI / 180;
    s += '<line x1="42" y1="42" x2="' + (cx + Math.cos(ha) * 19).toFixed(1) + '" y2="' + (cy + Math.sin(ha) * 19).toFixed(1) + '" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>';
    s += '<line x1="42" y1="42" x2="' + (cx + Math.cos(ma) * 29).toFixed(1) + '" y2="' + (cy + Math.sin(ma) * 29).toFixed(1) + '" stroke="var(--wb-accent)" stroke-width="2.2" stroke-linecap="round"/>';
    s += '<circle cx="42" cy="42" r="2.6" fill="currentColor"/></svg>';
    return s;
  }
  function rKlok(b, nr, ant) {
    var K = b._klok || genKlok(b.spec || b);
    var blokCij = !!((b.spec && b.spec.cijfers) || b.cijfers); // terugval voor oude data
    var h = opdrachtKop(nr, b.opdracht || "Hoe laat is het? Schrijf het eronder (bijvoorbeeld: half vijf).", b.em);
    h += '<div class="wb-klok-grid">';
    K.forEach(function (t) {
      var cijfers = t.cijfers != null ? t.cijfers : blokCij;
      h += '<div class="wb-klok-item">' + klokSvg(t.h, t.m, cijfers) + '<div class="wb-klok-ant">' +
        (ant ? '<span class="wb-ant">' + tijdNaarWoord(t) + "</span>" : '<span class="wb-lijn" style="min-width:70px"></span>') + "</div></div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rGeld(b, nr, ant) {
    var G = b._geld || genGeld(b.spec || b);
    var allesMin = G.every(function (it) { return it.op === "−"; });
    var allePlus = G.every(function (it) { return it.op === "+"; });
    var opd = b.opdracht || (allesMin ? "Hoeveel krijg je terug?" : allePlus ? "Reken uit. Hoeveel is het samen?" : "Reken uit. Let op + en −.");
    var h = opdrachtKop(nr, opd, b.em);
    // 2 kolommen: geldbedragen zijn breed, 3 zou afbreken en de volgorde breken
    h += somBlok(G.map(function (it) { return { expr: euro(it.a) + " " + it.op + " " + euro(it.b) + " =", antwoord: euro(it.res) }; }), 2, ant, 72);
    return '<div class="wb-blok">' + h + "</div>";
  }

  function doolhofSvg(D, ant) {
    var n = D.n, cs = Math.max(16, Math.min(26, Math.floor(360 / n))), pad = cs * n;
    var s = '<svg class="wb-doolhof" viewBox="-2 -2 ' + (pad + 4) + " " + (pad + 4) + '">';
    if (ant) {
      var p = doolhofPad(D), pts = p.map(function (c) { var xy = c.split(","); return ((+xy[0] + 0.5) * cs).toFixed(1) + "," + ((+xy[1] + 0.5) * cs).toFixed(1); });
      if (pts.length) s += '<polyline points="' + pts.join(" ") + '" class="wb-dh-pad"/>';
    }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var m = D.cel[y][x].m, px = x * cs, py = y * cs;
      if (m[0]) s += '<line x1="' + px + '" y1="' + py + '" x2="' + (px + cs) + '" y2="' + py + '"/>';
      if (m[1]) s += '<line x1="' + (px + cs) + '" y1="' + py + '" x2="' + (px + cs) + '" y2="' + (py + cs) + '"/>';
      if (m[2]) s += '<line x1="' + px + '" y1="' + (py + cs) + '" x2="' + (px + cs) + '" y2="' + (py + cs) + '"/>';
      if (m[3]) s += '<line x1="' + px + '" y1="' + py + '" x2="' + px + '" y2="' + (py + cs) + '"/>';
    }
    s += '<text x="' + (cs / 2) + '" y="' + (cs / 2 + 1) + '" class="wb-dh-mark">A</text>';
    s += '<text x="' + (pad - cs / 2) + '" y="' + (pad - cs / 2 + 1) + '" class="wb-dh-mark">B</text>';
    s += "</svg>";
    return s;
  }
  function rDoolhof(b, nr, ant) {
    var D = b._doolhof || genDoolhof(b.spec || b);
    var h = opdrachtKop(nr, b.opdracht || "Teken de weg van A naar B door het doolhof.", b.em);
    h += '<div class="wb-doolhof-wrap">' + doolhofSvg(D, ant) + "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rKruiswoord(b, nr, ant) {
    var KW = b._kruis;
    var kwAantal = (KW && KW.vragen && KW.vragen.length) || arr(b.woorden).length;
    var h = opdrachtKop(nr, syncAantalWoord(b.opdracht || "Los de kruiswoordpuzzel op.", kwAantal), b.em);
    if (!KW || !KW.vragen || !KW.vragen.length) {
      // Terugval: een gewone omschrijving-lijst met invullijnen.
      h += '<div class="wb-invul-lijst">';
      arr(b.woorden).forEach(function (w, i) {
        var oms = (w && w.omschrijving) || "";
        h += '<div class="wb-invul-rij"><span class="wb-rij-nr">' + (i + 1) + ".</span><span>" + esc(oms) + " " +
          (ant ? antLijn((w && w.woord) || "") : lijn(110)) + "</span></div>";
      });
      h += "</div>";
      return '<div class="wb-blok">' + h + "</div>";
    }
    h += '<div class="wb-kruis-wrap"><table class="wb-kruis"><tbody>';
    for (var y = KW.minY; y <= KW.maxY; y++) {
      h += "<tr>";
      for (var x = KW.minX; x <= KW.maxX; x++) {
        var letter = KW.grid[x + "," + y];
        if (!letter) { h += '<td class="leeg"></td>'; continue; }
        var num = KW.nums[x + "," + y];
        h += "<td>" + (num ? '<span class="wb-kruis-num">' + num + "</span>" : "") + (ant ? esc(letter) : "") + "</td>";
      }
      h += "</tr>";
    }
    h += "</tbody></table></div>";
    var horiz = KW.vragen.filter(function (v) { return v.dir === "h"; });
    var vert = KW.vragen.filter(function (v) { return v.dir === "v"; });
    function clueLijst(titel, lijst) {
      if (!lijst.length) return "";
      return '<div><h5 class="wb-kruis-h">' + titel + "</h5>" + lijst.map(function (v) {
        return '<div class="wb-kruis-clue"><b>' + v.nr + ".</b> " + esc(v.oms) + "</div>";
      }).join("") + "</div>";
    }
    h += '<div class="wb-kruis-clues">' + clueLijst("Horizontaal", horiz) + clueLijst("Verticaal", vert) + "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // Hergebruik: één som-regel zoals in rSommen.
  // Antwoordcel: op het antwoordblad een groen woord, anders een schrijflijn.
  function antCel(ant, antwoord) {
    return ant ? '<span class="wb-som-a"><span class="wb-ant">' + esc(antwoord) + "</span></span>" : '<span class="wb-som-a wb-som-lijn"></span>';
  }
  // Langste string (voor de breedte van de som-kolom, in tekens).
  function maxLen(lijst) { var m = 0; lijst.forEach(function (s) { var l = String(s).length; if (l > m) m = l; }); return m; }
  // Container-stijl voor een sommen-blok: aantal kolommen + breedte som-kolom (--exprw) + antwoord (--answ).
  function somStijl(kol, exprCh, answPx) { return "grid-template-columns:repeat(" + kol + ",1fr);--exprw:" + exprCh + "ch;--answ:" + answPx + "px"; }
  // Vraag-regel (links uitgelijnd): voor vragen i.p.v. sommen; antwoord rechts in een vaste kolom.
  function vraagRegel(i, html, antwoord, ant) {
    return '<div class="wb-som l"><span class="wb-som-nr">' + (i + 1) + ".</span>" +
      '<span class="wb-som-t">' + html + "</span>" +
      // antwoordblad: het antwoord op het lijntje (lijn blijft staan, geen zwevend cijfer)
      (ant ? '<span class="wb-som-a wb-som-lijn"><span class="wb-ant">' + esc(antwoord) + "</span></span>" : '<span class="wb-som-a wb-som-lijn"></span>') + "</div>";
  }
  // Som-blok: kolom-grids waarin de som-kolom zich tot de BREEDSTE som krimpt
  // (max-content). Het antwoordlijntje staat dus net na de langste som, met een
  // kleine vaste tussenruimte; alle lijntjes in een kolom staan op dezelfde hoogte.
  function somCellen(i, expr, antwoord, ant, lijnBreed) {
    return '<span class="wb-somnr">' + (i + 1) + ".</span>" +
      '<span class="wb-somt">' + esc(expr) + "</span>" +
      (ant ? '<span class="wb-soma"><span class="wb-ant">' + esc(antwoord) + "</span></span>"
        : '<span class="wb-soma wb-somlijn" style="min-width:' + (lijnBreed || 56) + 'px"></span>');
  }
  function somBlok(items, maxKol, ant, lijnBreed) {
    var N = items.length;
    maxKol = Math.min(4, Math.max(1, maxKol || 4));
    // Kolommen schalen mee met het aantal opdrachten (breedte benutten i.p.v. lang).
    var kol = maxKol >= 4 ? (N >= 13 ? 4 : N >= 9 ? 3 : N >= 5 ? 2 : 1)
      : maxKol === 3 ? (N >= 9 ? 3 : N >= 5 ? 2 : 1)
        : (N >= 5 ? 2 : 1);
    kol = Math.max(1, Math.min(kol, N));
    var perCol = Math.ceil(N / kol);
    var h = '<div class="wb-somrij">';
    for (var c = 0; c < kol; c++) {
      var cell = "";
      for (var j = 0; j < perCol; j++) {
        var idx = c * perCol + j;
        if (idx >= N) break;
        cell += somCellen(idx, items[idx].expr, items[idx].antwoord, ant, lijnBreed);
      }
      if (cell) h += '<div class="wb-somkol">' + cell + "</div>";
    }
    return h + "</div>";
  }
  // expr bevat al het teken aan het eind ("3 + 4 =" of "476 →"). Vaste 3-koloms
  // opmaak zodat het antwoordveld bij elke som recht onder elkaar staat.
  function somRegel(i, expr, antwoord, ant) {
    return '<div class="wb-som"><span class="wb-som-nr">' + (i + 1) + '.</span>' +
      '<span class="wb-som-t">' + esc(expr) + "</span>" +
      (ant ? '<span class="wb-som-a"><span class="wb-ant">' + esc(antwoord) + "</span></span>" : '<span class="wb-som-a wb-som-lijn"></span>') +
      "</div>";
  }

  function rReeks(b, nr, ant) {
    var R = b._reeks || genReeks(b.spec || b);
    var h = opdrachtKop(nr, b.opdracht || "Vul de reeks aan.", b.em);
    h += '<div class="wb-reeks">';
    R.forEach(function (rij) {
      h += '<div class="wb-reeks-rij">';
      rij.vals.forEach(function (v, idx) {
        var gat = rij.gaten.indexOf(idx) !== -1, toon = !gat || ant;
        var w = rij.komma ? String(v).replace(".", ",") : v; // kommagetallen NL tonen
        h += '<span class="wb-reeks-cel' + (gat ? " gat" : "") + (gat && ant ? " wb-ant" : "") + '">' + (toon ? w : "") + "</span>";
      });
      h += "</div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rVergelijk(b, nr, ant) {
    var V = b._verg || genVergelijk(b.spec || b);
    var h = opdrachtKop(nr, b.opdracht || "Schrijf < , > of = in het rondje.", b.em);
    h += '<div class="wb-verg-legenda"><b>&lt;</b> is kleiner dan &nbsp;·&nbsp; <b>&gt;</b> is groter dan &nbsp;·&nbsp; <b>=</b> is gelijk aan</div>';
    var Nv = V.length, kolV = Nv >= 5 ? 2 : 1, perColV = Math.ceil(Nv / kolV);
    // kolom-gewijs vullen: linkerkolom 1..perCol, rechterkolom de rest
    h += '<div class="wb-verg" style="grid-template-columns:repeat(' + kolV + ',max-content);grid-template-rows:repeat(' + perColV + ',auto);grid-auto-flow:column">';
    V.forEach(function (it, i) {
      h += '<div class="wb-verg-rij"><span class="wb-som-nr">' + (i + 1) + '.</span>' +
        '<span class="wb-verg-z wb-verg-l">' + (it.l.html || esc(it.l.text)) + '</span>' +
        '<span class="wb-verg-teken' + (ant ? " wb-ant" : "") + '">' + (ant ? esc(it.teken) : "") + '</span>' +
        '<span class="wb-verg-z wb-verg-r">' + (it.r.html || esc(it.r.text)) + "</span></div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rTafel(b, nr, ant) {
    var T = b._tafel || genTafel(b.spec || b);
    var opd = b.opdracht || (T.mix ? "Reken de tafelsommen uit." : ("Oefen de tafel van " + T.tafel + "."));
    var h = opdrachtKop(nr, opd, b.em);
    h += somBlok(T.items.map(function (it) { return { expr: it.som + " =", antwoord: it.antwoord }; }), 4, ant, 56);
    return '<div class="wb-blok">' + h + "</div>";
  }

  function breukBalk(noemer, gevuld, kleur) {
    var w = 200, h = 26, cw = w / noemer, s = '<svg class="wb-breuk" viewBox="0 0 ' + (w + 2) + ' ' + (h + 2) + '">';
    for (var i = 0; i < noemer; i++) {
      var fill = i < gevuld ? (kleur || "var(--wb-accent)") : "#fff";
      s += '<rect x="' + (1 + i * cw).toFixed(1) + '" y="1" width="' + cw.toFixed(1) + '" height="' + h + '" fill="' + fill + '" stroke="var(--wb-ink)" stroke-width="1.5"/>';
    }
    s += "</svg>"; return s;
  }
  // Gestapelde breuk: teller boven een streep, noemer eronder (echte breuknotatie).
  function breukHtml(teller, noemer) {
    return '<span class="wb-frac"><span class="wb-frac-t">' + teller + '</span><span class="wb-frac-n">' + noemer + "</span></span>";
  }
  function rBreuken(b, nr, ant) {
    var B = b._breuk || genBreuken(b.spec || b), lees = B.soort === "lees";
    var h = opdrachtKop(nr, b.opdracht || (lees ? "Welke breuk is gekleurd? Schrijf de breuk." : "Kleur het juiste deel."), b.em);
    h += '<div class="wb-breuk-lijst">';
    B.items.forEach(function (it, i) {
      h += '<div class="wb-breuk-rij"><span class="wb-rij-nr">' + (i + 1) + ".</span>";
      if (lees) { h += breukBalk(it.noemer, it.teller) + '<span class="wb-breuk-v">= ' + (ant ? '<span class="wb-ant">' + breukHtml(it.teller, it.noemer) + "</span>" : lijn(52)) + "</span>"; }
      else { h += breukBalk(it.noemer, ant ? it.teller : 0) + '<span class="wb-breuk-v">kleur ' + breukHtml(it.teller, it.noemer) + "</span>"; }
      h += "</div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rKleur(b, nr, ant) {
    var K = b._kleur || genKleurplaat(b.spec || b);
    var h = opdrachtKop(nr, b.opdracht || "Reken elke som uit en kleur volgens de code. Welk plaatje verschijnt?", b.em);
    h += '<div class="wb-kleur-legenda">' + K.legenda.map(function (lg) {
      return '<span class="wb-kleur-chip"><span class="wb-kleur-vak" style="background:' + (lg.kleur || "#fff") + '"></span>= ' + lg.waarde + " → " + esc(lg.naam) + "</span>";
    }).join(" ") + "</div>";
    h += '<table class="wb-kleur-grid"><tbody>';
    for (var y = 0; y < K.h; y++) {
      h += "<tr>";
      for (var x = 0; x < K.w; x++) {
        var c = K.cellen[y * K.w + x], stijl = ant && c.kleur ? ' style="background:' + c.kleur + '"' : "";
        h += "<td" + stijl + ">" + esc(c.som) + "</td>";
      }
      h += "</tr>";
    }
    h += "</tbody></table>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rStaaf(b, nr, ant) {
    var S = b._staaf || genStaaf(b);
    var h = opdrachtKop(nr, b.opdracht || "Bekijk de grafiek en beantwoord de vragen.", b.em);
    var maxV = S.data.reduce(function (m, d) { return Math.max(m, d.waarde); }, 1);
    // nette schaalverdeling op de y-as (waarde van de as aflezen, niet op de staaf)
    var opties = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
    var ruw = maxV / 5, stap = opties[opties.length - 1];
    for (var si = 0; si < opties.length; si++) { if (opties[si] >= ruw) { stap = opties[si]; break; } }
    var top = Math.ceil(maxV / stap) * stap;
    var bw = 40, gap = 24, padL = 28, padT = 8, padB = 28, hH = 150;
    var W = padL + S.data.length * (bw + gap) + 12;
    var svg = '<svg class="wb-staaf" viewBox="0 0 ' + W + " " + (hH + padT + padB) + '">';
    for (var v = 0; v <= top + 0.001; v += stap) {
      var gy = padT + hH - (v / top) * hH;
      svg += '<line x1="' + padL + '" y1="' + gy.toFixed(1) + '" x2="' + (W - 6) + '" y2="' + gy.toFixed(1) + '" class="' + (v === 0 ? "wb-staaf-basis" : "wb-staaf-grid") + '"/>';
      svg += '<text x="' + (padL - 5) + '" y="' + (gy + 3).toFixed(1) + '" class="wb-staaf-as">' + v + "</text>";
    }
    svg += '<line x1="' + padL + '" y1="' + padT + '" x2="' + padL + '" y2="' + (padT + hH) + '" class="wb-staaf-basis"/>';
    S.data.forEach(function (d, i) {
      var bh = (d.waarde / top) * hH, bx = padL + 10 + i * (bw + gap), by = padT + hH - bh;
      svg += '<rect x="' + bx + '" y="' + by.toFixed(1) + '" width="' + bw + '" height="' + bh.toFixed(1) + '" rx="3" fill="var(--wb-accent)"/>';
      svg += '<text x="' + (bx + bw / 2) + '" y="' + (padT + hH + 16) + '" class="wb-staaf-l">' + esc(String(d.label)) + "</text>";
    });
    svg += "</svg>";
    if (S.titel) h += '<div class="wb-staaf-titel">' + esc(S.titel) + "</div>";
    h += '<div class="wb-staaf-wrap">' + svg + "</div>";
    if (S.eenheid && !S.titel) h += '<div class="wb-staaf-eenheid">(' + esc(S.eenheid) + ")</div>";
    h += '<div class="wb-sommen" style="grid-template-columns:1fr;--answ:90px">';
    S.vragen.forEach(function (v, i) { h += vraagRegel(i, esc(v.vraag), v.antwoord, ant); });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  var SUDOKU_SYM = ["●", "▲", "★", "♥", "■", "◆"];
  function rSudoku(b, nr, ant) {
    var S = b._sudoku || genSudoku(b.spec || b);
    function toon(v) { return v === 0 ? "" : S.symbolen ? SUDOKU_SYM[v - 1] : v; }
    var h = opdrachtKop(nr, b.opdracht || ("Vul de sudoku in: elk teken 1 keer per rij, kolom en vak (1 t/m " + S.n + ")."), b.em);
    h += '<table class="wb-sudoku"><tbody>';
    for (var r = 0; r < S.n; r++) {
      h += "<tr>";
      for (var c = 0; c < S.n; c++) {
        var val = ant ? S.sol[r][c] : S.puzzle[r][c];
        var cls = ((c + 1) % S.bc === 0 && c < S.n - 1 ? " rb" : "") + ((r + 1) % S.br === 0 && r < S.n - 1 ? " bb" : "");
        var geg = !ant && S.puzzle[r][c] !== 0;
        h += '<td class="' + cls + (ant && S.puzzle[r][c] === 0 ? " wb-ant" : "") + (geg ? " geg" : "") + '">' + toon(val) + "</td>";
      }
      h += "</tr>";
    }
    h += "</tbody></table>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rGeheim(b, nr, ant) {
    var G = b._geheim;
    var h = opdrachtKop(nr, b.opdracht || "Kraak de geheime code en schrijf de woorden op.", b.em);
    if (!G) return '<div class="wb-blok">' + h + "</div>";
    h += '<div class="wb-geheim-legenda">' + Object.keys(G.map).map(function (l) {
      return '<span class="wb-geheim-paar"><b>' + esc(G.map[l]) + "</b> = " + esc(l) + "</span>";
    }).join(" ") + "</div>";
    h += '<div class="wb-geheim-woorden">';
    G.woorden.forEach(function (w, i) {
      h += '<div class="wb-geheim-rij"><span class="wb-rij-nr">' + (i + 1) + ".</span>";
      for (var k = 0; k < w.length; k++) {
        h += '<span class="wb-geheim-cel"><span class="wb-geheim-sym">' + esc(G.map[w[k]] || "?") + '</span><span class="wb-geheim-in">' + (ant ? esc(w[k]) : "") + "</span></span>";
      }
      h += "</div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rHussel(b, nr, ant) {
    var H = b._hussel || genHussel(b.woorden);
    var h = opdrachtKop(nr, b.opdracht || "Maak van de letters het goede woord.", b.em);
    if (H.some(function (it) { return it.hint; })) {
      h += '<div class="wb-hussel-uitleg">De <u>onderstreepte</u> letters staan al op de goede plek. Zet de andere letters op de juiste volgorde.</div>';
    }
    h += '<div class="wb-invul-lijst">';
    H.forEach(function (it, i) {
      // Letters met een spatie ertussen; vaste letters onderstreept als houvast.
      var reeks = (Array.isArray(it.door) ? it.door : String(it.door).split(/\s+/).map(function (c) { return { c: c, vast: false }; }))
        .map(function (x) { return x.vast ? '<u class="wb-hussel-vast">' + esc(x.c) + "</u>" : esc(x.c); }).join(" ");
      // Schrijfregel ALTIJD op een eigen regel eronder (lange letterreeksen zouden een
      // inline lijn anders laten wrappen: bij het ene woord ernaast, bij het andere eronder).
      h += '<div class="wb-anagram-item"><div class="wb-anagram-w"><span class="wb-rij-nr">' + (i + 1) + '.</span> <b class="wb-hussel">' + reeks + "</b></div>" +
        (ant ? '<div class="wb-anagram-ant"><span class="wb-ant">' + esc(it.antwoord) + "</span></div>" : '<div class="wb-schrijfregel" style="margin-top:24px"></div>') + "</div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rZin(b, nr, ant) {
    var Z = b._zin || genZin(b.zinnen);
    var h = opdrachtKop(nr, b.opdracht || "Zet de woorden in de goede volgorde. Schrijf de zin op.", b.em);
    Z.forEach(function (it, i) {
      h += '<div class="wb-zin-rij"><div class="wb-zin-chips"><span class="wb-rij-nr">' + (i + 1) + ".</span> " +
        it.door.map(function (w) { return '<span class="wb-chip">' + esc(w) + "</span>"; }).join(" ") + "</div>";
      h += ant ? '<div class="wb-ant-blok">' + esc(it.antwoord) + "</div>" : '<div class="wb-schrijfregel" style="margin-top:24px"></div>';
      h += "</div>";
    });
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rLettergrepen(b, nr, ant) {
    var maxL = maxWoordLengte(b.woorden, function (w) { return w && w.woord != null ? w.woord : w; });
    var h = opdrachtKop(nr, b.opdracht || "Verdeel de woorden in lettergrepen (klap mee).", b.em);
    h += '<div class="wb-invul-lijst">';
    arr(b.woorden).forEach(function (w, i) {
      var woord = (w && w.woord != null ? w.woord : w), delen = (w && w.delen) || [];
      h += '<div class="wb-invul-rij"><span class="wb-rij-nr">' + (i + 1) + ".</span><span>" + woordKolom(woord, maxL) +
        (ant && delen.length ? '<span class="wb-ant">' + delen.map(esc).join(" - ") + "</span>" : lijn(150)) + "</span></div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rRijm(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Schrijf bij elk woord een woord dat erop rijmt.", b.em);
    if (ant) h += '<div class="wb-ant-note">Dit zijn voorbeelden. Andere goede rijmwoorden mogen ook.</div>';
    var maxL = maxWoordLengte(b.woorden, function (w) { return w && w.woord != null ? w.woord : w; });
    h += '<div class="wb-invul-lijst">';
    arr(b.woorden).forEach(function (w, i) {
      var woord = (w && w.woord != null ? w.woord : w), rijm = (w && w.rijm) || [];
      h += '<div class="wb-invul-rij"><span class="wb-rij-nr">' + (i + 1) + ".</span><span>" + woordKolom(woord, maxL) +
        (ant && rijm.length ? '<span class="wb-ant">' + rijm.slice(0, 3).map(esc).join(", ") + "</span>" : lijn(150)) + "</span></div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rSynant(b, nr, ant) {
    var soort = b.soort === "antoniem" ? "antoniem" : "synoniem";
    var paren = arr(b.paren), links = paren.map(function (p) { return p[0]; }), rechts = paren.map(function (p) { return p[1]; });
    var idx = paren.map(function (p, i) { return [i, i]; });
    return koppelBlok(b.opdracht || ("Trek een lijn tussen de woorden die " + (soort === "antoniem" ? "tegengesteld zijn" : "hetzelfde betekenen") + "."), links, rechts, idx, b._kpVolg, nr, ant, b.em);
  }

  function rLidwoord(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Zet een rondje om het goede lidwoord.", b.em);
    h += '<div class="wb-lidw-lijst">';
    arr(b.woorden).forEach(function (w, i) {
      var woord = (w && w.woord) || "", lid = (w && w.lidwoord) || "";
      function opt(t) { return '<span class="wb-bubble' + (ant && lid === t ? " wb-lid-goed" : "") + '" style="width:auto;border-radius:13px;padding:0 8px">' + t + "</span>"; }
      h += '<div class="wb-lidw-rij"><span class="wb-rij-nr">' + (i + 1) + ".</span>" + opt("de") + opt("het") + '<span class="wb-lidw-w">' + esc(woord) + "</span></div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rZoekFout(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "In elke zin staat een fout. Schrijf de zin goed op.", b.em);
    arr(b.zinnen).forEach(function (z, i) {
      var zin = (z && z.zin != null ? z.zin : z), correct = (z && z.correct) || "";
      h += '<div class="wb-open-vraag"><div class="wb-vraag-t">' + (i + 1) + ". " + esc(zin) + "</div>" +
        (ant ? '<div class="wb-ant-blok">' + esc(correct) + "</div>" : '<div class="wb-schrijfregel" style="margin-top:24px"></div>') + "</div>";
    });
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rBingo(b, nr) {
    var B = b._bingo || genBingo(b.spec || b);
    var h = opdrachtKop(nr, b.opdracht || "Bingo! Streep door wat de juf of meester noemt.", b.em);
    h += '<table class="wb-bingo"><tbody>';
    for (var r = 0; r < B.n; r++) { h += "<tr>"; for (var c = 0; c < B.n; c++) h += "<td>" + esc(B.cellen[r * B.n + c]) + "</td>"; h += "</tr>"; }
    h += "</tbody></table>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function vakje(ant, val) { return ant ? '<span class="wb-vakje wb-ant">' + esc(String(val)) + "</span>" : '<span class="wb-vakje"></span>'; }

  function rCijferend(b, nr, ant) {
    var C = b._cijfer || genCijferend(b.spec || b);
    var hulpwoord = C.op === "-" ? "lenen" : "onthouden";
    var h = opdrachtKop(nr, b.opdracht || ("Reken cijferend uit. Zet de cijfers netjes onder elkaar en gebruik de bovenste hokjes om te " + hulpwoord + "."), b.em);
    // Uniforme breedte: het grootste aantal cijfers over ALLE sommen (incl. tussenstappen).
    var W = 1;
    C.items.forEach(function (it) {
      W = Math.max(W, String(it.a).length, String(it.b).length, String(it.antwoord).length);
      (it.partials || []).forEach(function (p) { W = Math.max(W, p.length); });
    });
    function rij(s, opTeken, klas) {
      var pad = W - s.length, cells = "";
      for (var c = 0; c < W; c++) { var ci = c - pad; cells += '<span class="wb-hok' + (klas || "") + '">' + (ci >= 0 ? s.charAt(ci) : "") + "</span>"; }
      return '<div class="wb-cijfer-rij"><span class="wb-cijfer-op">' + (opTeken || "") + "</span>" + cells + "</div>";
    }
    function leegrij(klas) { var cells = ""; for (var c = 0; c < W; c++) cells += '<span class="wb-hok' + (klas || "") + '"></span>'; return '<div class="wb-cijfer-rij"><span class="wb-cijfer-op"></span>' + cells + "</div>"; }
    h += '<div class="wb-cijfer-grid">';
    C.items.forEach(function (it, i) {
      var blok = '<div class="wb-cijfer"><span class="wb-cijfer-nr">' + (i + 1) + '.</span><div class="wb-cijfer-blok">';
      blok += leegrij(" wb-hok-carry");                 // onthoud-hokjes bovenaan
      blok += rij(String(it.a), "", "");                // bovenste getal
      blok += rij(String(it.b), it.op, "");             // teken links + onderste getal
      blok += '<div class="wb-cijfer-streep"></div>';   // bold scheidingslijn
      if (it.op === "×" && it.partials) {               // tussenstappen + eindoptelling
        it.partials.forEach(function (p) { blok += ant ? rij(p, "", " wb-hok-ant") : leegrij(""); });
        blok += '<div class="wb-cijfer-streep"></div>';
      }
      blok += ant ? rij(String(it.antwoord), "", " wb-hok-ant") : leegrij("");
      blok += "</div></div>";
      h += blok;
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rOntbrekend(b, nr, ant) {
    var I = b._ontbr || genOntbrekend(b.spec || b);
    var h = opdrachtKop(nr, b.opdracht || "Welk getal hoort op de plaats van het vakje?", b.em);
    // max 5 per kolom → 5=1 kolom, 10=2, 15=3 (11-15 komt rechts ernaast, niet eronder)
    var N = I.length, kol = Math.max(1, Math.ceil(N / 5));
    var perCol = Math.ceil(N / kol);
    h += '<div class="wb-ontbr">';
    for (var c = 0; c < kol; c++) {
      var cell = "";
      for (var j = 0; j < perCol; j++) {
        var idx = c * perCol + j; if (idx >= N) break; var it = I[idx];
        var f = function (v) { return it.komma ? String(v).replace(".", ",") : v; };
        var a = it.mis === 0 ? vakje(ant, f(it.a)) : f(it.a), bb = it.mis === 1 ? vakje(ant, f(it.b)) : f(it.b);
        cell += '<div class="wb-ontbr-rij"><span class="wb-som-nr">' + (idx + 1) + '.</span><span>' + a + " " + it.op + " " + bb + " = " + f(it.res) + "</span></div>";
      }
      if (cell) h += '<div class="wb-ontbr-kol">' + cell + "</div>";
    }
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rBuren(b, nr, ant) {
    var B = b._buren || genBuren(b.spec || b);
    function f(v) { return B.komma ? String(v).replace(".", ",") : v; } // kommagetallen NL tonen
    var opd = b.opdracht || (B.wissel
      ? "Schrijf het juiste getal in de hokjes. Let op het getal dat erbij of eraf moet."
      : ("Schrijf het getal " + f(B.stap) + " minder en " + f(B.stap) + " meer."));
    var h = opdrachtKop(nr, opd, b.em);
    var N = B.items.length, kol = N >= 6 ? 2 : 1, perCol = Math.ceil(N / kol);
    h += '<div class="wb-buren-wrap">';
    for (var c = 0; c < kol; c++) {
      var cell = "";
      for (var j = 0; j < perCol; j++) {
        var idx = c * perCol + j; if (idx >= N) break; var it = B.items[idx];
        cell += '<span class="wb-som-nr">' + (idx + 1) + ".</span>" +
          '<span class="wb-buren-cel">' + vakje(ant, f(it.minder)) + "</span>" +
          '<span class="wb-buren-op">− ' + f(it.stap) + "</span>" +
          '<span class="wb-buren-mid">' + f(it.n) + "</span>" +
          '<span class="wb-buren-op">+ ' + f(it.stap) + "</span>" +
          '<span class="wb-buren-cel">' + vakje(ant, f(it.meer)) + "</span>";
      }
      if (cell) h += '<div class="wb-buren">' + cell + "</div>";
    }
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rOrdenen(b, nr, ant) {
    var O = b._orden || genOrdenen(b.spec || b);
    var h = opdrachtKop(nr, b.opdracht || ("Zet de getallen van " + (O.aflopend ? "groot naar klein" : "klein naar groot") + " in de hokjes."), b.em);
    // alle hokjes even breed: kijk naar het grootste getal in de hele opdracht.
    // Bij breuken meten we de string-lengte NIET (dat is HTML) → vaste breuk-breedte.
    var isFrac = O.soort === "breuken", maxDig = 1;
    if (!isFrac) O.rijen.forEach(function (rij) { rij.door.forEach(function (v) { maxDig = Math.max(maxDig, String(v).length); }); });
    var obw = isFrac ? "3ch" : ((maxDig + 1.2).toFixed(1) + "ch");
    h += '<div class="wb-orden' + (isFrac ? " wb-orden-frac" : "") + '" style="--obw:' + obw + '">';
    O.rijen.forEach(function (rij, i) {
      // één grid voor de hele opdracht → kolommen (en dus de doel-hokjes) lijnen
      // gegarandeerd uit, ongeacht het aantal cijfers in het rijnummer.
      h += '<span class="wb-som-nr">' + (i + 1) + '.</span>' +
        '<span class="wb-orden-bron">' + rij.door.map(function (v) { return '<span class="wb-chip wb-orden-chip">' + v + "</span>"; }).join("") + "</span>" +
        '<span class="wb-orden-pijl">→</span>' +
        '<span class="wb-orden-doel">' + rij.antwoord.map(function (v) { return '<span class="wb-vakje wb-orden-vk' + (ant ? " wb-ant" : "") + '">' + (ant ? v : "") + "</span>"; }).join("") + "</span>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rPlaats(b, nr, ant) {
    var P = b._plaats || genPlaats(b.spec || b);
    var h = opdrachtKop(nr, b.opdracht || "Schrijf het juiste cijfer op.", b.em);
    // antwoordlijn schaalt met de grootte van de getallen (groep 7 → langere lijn)
    var maxDig = P.reduce(function (m, it) { return Math.max(m, String(it.n).length); }, 2);
    var answPx = Math.max(64, 26 + maxDig * 14);
    h += '<div class="wb-sommen" style="grid-template-columns:1fr;--answ:' + answPx + 'px">';
    P.forEach(function (it, i) { h += vraagRegel(i, "Wat is " + PLAATS_ENK[it.pos] + " in <b>" + it.n + "</b>?", it.cijfer, ant); });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rGetalwoord(b, nr, ant) {
    var G = b._getalw || genGetalwoord(b.spec || b);
    var h = opdrachtKop(nr, b.opdracht || "Schrijf het getal in cijfers of in woorden.", b.em);
    var vasteLijn = b.spec && b.spec.lijn; // AI-override (px) voor alle lijnen
    h += '<div class="wb-gw">';
    G.forEach(function (it, i) {
      var given = it.naarWoord ? groepeer(it.n) : it.woord;
      var answ = it.naarWoord ? it.woord : groepeer(it.n);
      // streeplengte volgt het verwachte antwoord: kort voor een getal, lang voor
      // een woord. De rij loopt vloeiend door, dus de pijl + streep komen altijd
      // direct ná de opdracht (ook als een lang woord afbreekt).
      var lijnW = vasteLijn || Math.min(560, Math.max(64, answ.length * 9 + 14));
      h += '<div class="wb-gw-rij"><span class="wb-som-nr">' + (i + 1) + '.</span>' +
        '<span class="wb-gw-tekst">' + esc(given) +
        ' <span class="wb-gw-pijl">→</span> ' +
        '<span class="wb-gw-lijn" style="width:' + lijnW + 'px">' +
        (ant ? '<span class="wb-ant">' + esc(answ) + "</span>" : "") + "</span></span></div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rAfronden(b, nr, ant) {
    var A = b._afr || genAfronden(b.spec || b);
    var opd = b.opdracht || (A.wissel
      ? "Rond elk getal af op het aangegeven niveau."
      : ("Rond af op de dichtstbijzijnde " + afrDicht(A.naar) + "."));
    var h = opdrachtKop(nr, opd, b.em);
    var answMax = A.items.reduce(function (m, it) { return Math.max(m, groepeer(it.antwoord).length); }, 3);
    var lijnBreed = Math.max(56, answMax * 11);
    h += somBlok(A.items.map(function (it) {
      return { expr: groepeer(it.n) + (A.wissel ? " op " + afrNaam(it.naar) : "") + " →", antwoord: groepeer(it.antwoord) };
    }), A.wissel ? 2 : 4, ant, lijnBreed);
    return '<div class="wb-blok">' + h + "</div>";
  }

  function maalEen(M, ant) {
    var h = '<table class="wb-maal"><tbody><tr><th class="hoek">×</th>';
    M.boven.forEach(function (c) { h += "<th>" + c + "</th>"; });
    h += "</tr>";
    M.links.forEach(function (r) {
      h += "<tr><th>" + r + "</th>";
      M.boven.forEach(function (c) { h += "<td" + (ant ? ' class="wb-ant"' : "") + ">" + (ant ? r * c : "") + "</td>"; });
      h += "</tr>";
    });
    return h + "</tbody></table>";
  }
  function rMaal(b, nr, ant) {
    var roosters = b._maalroosters || genMaalroosters(b.spec || b);
    var h = opdrachtKop(nr, b.opdracht || "Vul het maaltafel-rooster in.", b.em);
    h += '<div class="wb-maalrij">';
    roosters.forEach(function (M) { h += maalEen(M, ant); });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rRomeins(b, nr, ant) {
    var R = b._rom || genRomeins(b.spec || b);
    var h = opdrachtKop(nr, b.opdracht || "Schrijf het getal in Romeinse of in gewone cijfers.", b.em);
    h += somBlok(R.map(function (it) {
      return { expr: (it.naarR ? String(it.n) : it.romeins) + " →", antwoord: it.naarR ? it.romeins : String(it.n) };
    }), 3, ant, 78);
    return '<div class="wb-blok">' + h + "</div>";
  }

  function rSprint(b, nr, ant) {
    var S = b._sprint || genSprint(b.spec || b);
    var h = opdrachtKop(nr, b.opdracht || "Sprint! Zet de klok en maak zo veel mogelijk sommen goed.", b.em);
    h += somBlok(S.items.map(function (it) { return { expr: it.som + " =", antwoord: it.antwoord }; }), 4, ant, 44);
    h += '<div class="wb-sprint-score">Goed: ' + vakje(false, "") + " / " + S.items.length + " &nbsp;·&nbsp; Tijd: " + vakje(false, "") + " min</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NIEUWE SPELLING-WERKVORMEN (batch — staan in de tool op GETESTE_MODULES:false
  // tot ze gekeurd zijn). KERNPRINCIPE: de CODE bewaakt de structuur, de AI levert
  // alleen kale woorden/zinnen. GEEN enkele renderer toont een fout gespeld woord.
  // ══════════════════════════════════════════════════════════════════════════

  var KLINKERS = "aeiouáàäâéèëêíìïîóòöôúùûüy";
  function isKlinker(ch) { return KLINKERS.indexOf(String(ch).toLowerCase()) !== -1; }
  function woordTekst(w) { return String(w && w.woord != null ? w.woord : w).trim(); }
  // Eén letterhokje (leeg op het vraagblad, gevuld op het antwoordblad).
  function letterHok(ch, ant) { return '<span class="wb-lhok">' + (ant ? esc(ch) : "") + "</span>"; }

  // Het lángste woord in de lijst bepaalt de referentiebreedte, zodat het
  // schrijflijntje bij ELKE rij op dezelfde x begint (geen verspringen).
  function maxWoordLengte(woorden, pick) {
    var m = 0;
    arr(woorden).forEach(function (w) { var t = String((pick ? pick(w) : woordTekst(w)) || ""); if (t.length > m) m = t.length; });
    return m;
  }
  // innerHtml links uitgelijnd, opgevuld tot 'chars' tekens breed. Zo begint het
  // schrijflijntje erna bij ELKE rij op dezelfde x (de referentie = langste woord).
  // Plus Jakarta is proportioneel → een 'ch' is iets breder dan een gemiddelde
  // letter, dus het langste woord loopt nooit over de referentie (altijd uitgelijnd).
  function refKolom(innerHtml, chars, klas) {
    return '<span class="wb-wkol' + (klas ? " " + klas : "") + '" style="min-width:' + Math.max(2, chars) + 'ch">' + innerHtml + "</span>";
  }
  // Woord in het referentieblok + één vaste spatie → lijntje op de referentie.
  // (Geen pijltje meer: dat voegde niets toe.)
  function woordKolom(woord, chars, klas) {
    return refKolom(esc(woord), chars, klas) + "&nbsp; ";
  }

  // ── Woordvorm: "grondwoord ___" (meervoud, verkleinwoord, ww-tijden, enz.) ──
  function rWoordvorm(b, nr, ant) {
    var maxL = maxWoordLengte(b.woorden, function (w) { return w && typeof w === "object" ? (w.op != null ? w.op : (w.voor != null ? w.voor : w.woord)) : w; });
    var h = opdrachtKop(nr, b.opdracht || "Schrijf de juiste vorm van het woord.", b.em);
    h += '<div class="wb-invul-lijst">';
    arr(b.woorden).forEach(function (w, i) {
      var op = w && typeof w === "object" ? (w.op != null ? w.op : (w.voor != null ? w.voor : w.woord)) : w;
      var antw = w && typeof w === "object" ? (Array.isArray(w.antwoord) ? w.antwoord : [w.antwoord != null ? w.antwoord : w.goed]) : [""];
      var rechts;
      if (ant) rechts = '<span class="wb-ant">' + antw.filter(Boolean).map(esc).join(", ") + "</span>";
      else { var n = Math.max(1, (w && w.aantal) || antw.length || 1); rechts = ""; for (var k = 0; k < n; k++) rechts += lijn(n > 1 ? 110 : 150) + " "; }
      h += '<div class="wb-invul-rij"><span class="wb-rij-nr">' + (i + 1) + ".</span><span>" + woordKolom(op, maxL) + rechts + "</span></div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Trappen van vergelijking (3 kolommen) ────────────────────────────────────
  function rTrappen(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Vul de trappen van vergelijking in.", b.em);
    h += '<div class="wb-trap"><div class="wb-trap-rij wb-trap-head"><span>woord</span><span>vergrotend</span><span>overtreffend</span></div>';
    arr(b.woorden).forEach(function (w, i) {
      var woord = w && typeof w === "object" ? w.woord : (Array.isArray(w) ? w[0] : w);
      var a = (w && w.antwoord) || [w && w.groter, w && w.grootst];
      function cel(v) { return ant ? '<span class="wb-ant">' + esc(v || "") + "</span>" : lijn(110); }
      h += '<div class="wb-trap-rij"><span><b>' + esc(woord) + "</b></span><span>" + cel(a[0]) + "</span><span>" + cel(a[1]) + "</span></div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Pyramidewoord: letter voor letter opbouwen ───────────────────────────────
  function rPyramide(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Bouw het woord op. Schrijf op elke regel één letter meer.", b.em);
    h += '<div class="wb-pyr-lijst">';
    arr(b.woorden).forEach(function (w) {
      var woord = woordTekst(w).toUpperCase(); if (!woord) return;
      h += '<div class="wb-pyr"><div class="wb-pyr-doel">' + esc(woord) + "</div>";
      for (var i = 1; i <= woord.length; i++) {
        h += '<div class="wb-pyr-rij">';
        for (var k = 0; k < i; k++) h += letterHok(woord[k], ant);
        h += "</div>";
      }
      h += "</div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Woordtrap: telkens één letter veranderen ─────────────────────────────────
  function rWoordtrap(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Woordtrap: verander telkens één letter en maak een nieuw woord.", b.em);
    var rijen = arr(b.rijen).length ? arr(b.rijen) : arr(b.woorden).map(function (w) { return { woord: w }; });
    h += '<div class="wb-ladder">';
    rijen.forEach(function (r, i) {
      var woord = woordTekst(r.woord != null ? r.woord : r).toUpperCase();
      var geef = (i === 0) || ant; // eerste trede als voorbeeld
      var boxes = "";
      for (var k = 0; k < woord.length; k++) boxes += letterHok(woord[k], geef);
      h += '<div class="wb-ladder-rij"><span class="wb-ladder-boxes">' + boxes + "</span>" + (r.hint ? '<span class="wb-ladder-hint">' + esc(r.hint) + "</span>" : "") + "</div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Woordslang: laatste letter = eerste letter van het volgende woord ─────────
  function rWoordslang(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Woordslang: de laatste letter van een woord is de eerste van het volgende.", b.em);
    var lijst = arr(b.woorden).map(woordTekst).filter(Boolean);
    h += '<div class="wb-slang">';
    lijst.forEach(function (woord, i) {
      var cell;
      if (i === 0) cell = "<b>" + esc(woord) + "</b>";                                  // gegeven startwoord
      else if (ant) cell = '<span class="wb-ant">eigen invulling</span>';               // meerdere antwoorden mogelijk → niet één juist
      else if (i === 1) cell = "<b>" + esc(lijst[0].slice(-1)) + "</b>" + lijn(70);      // beginletter volgt nog uit het startwoord
      else cell = lijn(90);                                                              // vanaf woord 3: beginletter onbekend (hangt af van eigen keuze)
      h += '<span class="wb-slang-cel">' + cell + "</span>";
      if (i < lijst.length - 1) h += '<span class="wb-slang-pijl">→</span>';
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Verstopte woorden: doelwoorden in een letterstrook met opvulletters ──────
  // De code verstopt de woorden ECHT (opvulletters ertussen), zodat ze niet zomaar
  // achter elkaar te lezen zijn. Op het antwoordblad kleuren we de doelwoorden.
  function verstoptVul() {
    var pool = "BCDFGHKLMNPRSTVWZ", n = 1 + Math.floor(Math.random() * 2), s = "";
    for (var i = 0; i < n; i++) s += pool.charAt(Math.floor(Math.random() * pool.length));
    return s;
  }
  function rVerstopt(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Zoek de verstopte woorden en schrijf ze goed op.", b.em);
    var lijst = arr(b.woorden).map(woordTekst).filter(Boolean);
    // Bouw de strook als segmenten: opvulling · doelwoord · opvulling · doelwoord …
    var segs = [{ vul: true, t: verstoptVul() }];
    lijst.forEach(function (w, i) {
      if (i > 0) segs.push({ vul: true, t: verstoptVul() });
      segs.push({ vul: false, t: w.toUpperCase() });
    });
    segs.push({ vul: true, t: verstoptVul() });
    var strook = segs.map(function (s) {
      // Vraagblad: alle letters gelijk (niets verraadt de woorden).
      // Antwoordblad: doelwoorden gemarkeerd, opvulletters gewoon.
      if (ant && !s.vul) return '<span class="wb-verstopt-doel">' + esc(s.t) + "</span>";
      return esc(s.t);
    }).join("");
    h += '<div class="wb-verstopt-strip">' + strook + "</div>";
    h += '<div class="wb-invul-lijst">';
    lijst.forEach(function (w, i) {
      h += '<div class="wb-invul-rij"><span class="wb-rij-nr">' + (i + 1) + ".</span><span>" + (ant ? '<span class="wb-ant">' + esc(w) + "</span>" : lijn(150)) + "</span></div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Alfabetiseren ────────────────────────────────────────────────────────────
  function rAlfabet(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Zet de woorden op alfabetische volgorde.", b.em);
    var lijst = arr(b.woorden).map(woordTekst).filter(Boolean);
    var gesorteerd = lijst.slice().sort(function (a, c) { a = a.toLowerCase(); c = c.toLowerCase(); return a < c ? -1 : a > c ? 1 : 0; });
    if (!ant) h += '<div class="wb-woordbank"><span class="wb-bank-l">Woorden:</span> ' + shuffle(lijst.slice()).map(function (w) { return '<span class="wb-chip">' + esc(w) + "</span>"; }).join(" ") + "</div>";
    h += '<div class="wb-invul-lijst">';
    gesorteerd.forEach(function (w, i) {
      h += '<div class="wb-invul-rij"><span class="wb-rij-nr">' + (i + 1) + ".</span><span>" + (ant ? '<span class="wb-ant">' + esc(w) + "</span>" : lijn(180)) + "</span></div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Klankkast: één klank per hokje ───────────────────────────────────────────
  function rKlankkast(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Schrijf elke klank in een apart hokje.", b.em);
    h += '<div class="wb-klank-lijst">';
    arr(b.woorden).forEach(function (w, i) {
      var woord = w && typeof w === "object" ? w.woord : w;
      var klanken = Array.isArray(w && w.klanken) ? w.klanken : (typeof (w && w.klanken) === "number" ? new Array(w.klanken).fill("") : String(woord).split(""));
      var boxes = ""; klanken.forEach(function (k) { boxes += letterHok(k, ant); });
      h += '<div class="wb-klank-rij"><span class="wb-rij-nr">' + (i + 1) + '.</span><b class="wb-klank-w">' + esc(woord) + '</b><span class="wb-klank-boxes">' + boxes + "</span></div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Klinkers markeren ────────────────────────────────────────────────────────
  function rKlinkers(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Zet een rondje om alle klinkers (a, e, i, o, u).", b.em);
    h += '<div class="wb-klink-lijst">';
    arr(b.woorden).forEach(function (w, i) {
      var woord = woordTekst(w), letters = "";
      for (var k = 0; k < woord.length; k++) { var ch = woord[k]; letters += '<span class="wb-klink-l' + (ant && isKlinker(ch) ? " wb-klink-mark" : "") + '">' + esc(ch) + "</span>"; }
      h += '<div class="wb-klink-rij"><span class="wb-rij-nr">' + (i + 1) + '.</span><span class="wb-klink-w">' + letters + "</span></div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Klankgroepen splitsen + open/gesloten ────────────────────────────────────
  function rKlankgroep(b, nr, ant) {
    var maxL = maxWoordLengte(b.woorden, function (w) { return w && typeof w === "object" ? w.woord : w; });
    var h = opdrachtKop(nr, b.opdracht || "Verdeel in klankgroepen. Is elke klankgroep open of gesloten? (o / g)", b.em);
    h += '<div class="wb-invul-lijst">';
    arr(b.woorden).forEach(function (w, i) {
      var woord = w && typeof w === "object" ? w.woord : w, delen = (w && w.delen) || [], soorten = (w && w.soorten) || [];
      var mid = ant
        ? delen.map(function (d, di) { return '<span class="wb-ant">' + esc(d) + '</span><span class="wb-kg-tag">(' + ((soorten[di] || "?")[0]) + ")</span>"; }).join(' <span class="wb-kg-scheid">-</span> ')
        : lijn(200);
      h += '<div class="wb-invul-rij"><span class="wb-rij-nr">' + (i + 1) + ".</span><span>" + woordKolom(woord, maxL) + mid + "</span></div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Woord-in-woord: kleine woorden in een groot woord ────────────────────────
  function rWoordInWoord(b, nr, ant) {
    var maxL = maxWoordLengte(b.woorden, function (w) { return w && typeof w === "object" ? w.woord : w; });
    var h = opdrachtKop(nr, b.opdracht || "Welke kleine woorden zitten er in het grote woord? Schrijf ze op.", b.em);
    h += '<div class="wb-invul-lijst">';
    arr(b.woorden).forEach(function (w, i) {
      var woord = w && typeof w === "object" ? w.woord : w, kl = (w && (w.verstopt || w.klein)) || [];
      h += '<div class="wb-wiw-rij"><span class="wb-rij-nr">' + (i + 1) + '.</span>' + refKolom('<b class="wb-wiw-w">' + esc(woord) + "</b>", maxL) + "&nbsp; " + (ant ? '<span class="wb-ant">' + kl.map(esc).join(", ") + "</span>" : '<span class="wb-lijn" style="flex:1;min-width:80px"></span>') + "</div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Woordwaarde: letterpunten optellen (a=1 … z=26) ──────────────────────────
  function woordWaarde(woord) { var s = 0, w = String(woord).toLowerCase(); for (var i = 0; i < w.length; i++) { var c = w.charCodeAt(i) - 96; if (c >= 1 && c <= 26) s += c; } return s; }
  function rWoordwaarde(b, nr, ant) {
    var spel = b.type === "woordwaardespel" || b.spel;
    var h = opdrachtKop(nr, b.opdracht || (spel ? "Reken de woordwaarde uit. Welk woord is het meeste waard?" : "Elke letter is punten waard (a=1, b=2 … z=26). Reken de woordwaarde uit."), b.em);
    var beste = -1, bestW = "";
    arr(b.woorden).forEach(function (w) { var v = woordWaarde(woordTekst(w)); if (v > beste) { beste = v; bestW = woordTekst(w); } });
    var maxL = maxWoordLengte(b.woorden);
    h += '<div class="wb-invul-lijst">';
    arr(b.woorden).forEach(function (w, i) {
      var woord = woordTekst(w), val = woordWaarde(woord);
      h += '<div class="wb-invul-rij"><span class="wb-rij-nr">' + (i + 1) + ".</span><span>" + refKolom("<b>" + esc(woord) + "</b>&nbsp;=", maxL + 2) + "&nbsp; " + (ant ? '<span class="wb-ant">' + val + "</span>" : lijn(70)) + " punten</span></div>";
    });
    h += "</div>";
    if (spel && ant) h += '<div class="wb-ant-note">Meeste waard: <b>' + esc(bestW) + "</b> (" + beste + " punten).</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Lettertegels: woord bouwen uit een letterpool ────────────────────────────
  function rLettertegels(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Maak met de lettertegels het goede woord.", b.em);
    h += '<div class="wb-tegel-lijst">';
    arr(b.woorden).forEach(function (w, i) {
      var woord = woordTekst(w).toUpperCase(); if (!woord) return;
      var tegels = shuffle(woord.split("")).map(function (l) { return '<span class="wb-ltegel">' + esc(l) + "</span>"; }).join(" ");
      var boxes = ""; for (var k = 0; k < woord.length; k++) boxes += letterHok(woord[k], ant);
      h += '<div class="wb-tegel-rij"><span class="wb-rij-nr">' + (i + 1) + '.</span><span class="wb-tegel-pool">' + tegels + '</span><span class="wb-tegel-pijl">→</span><span class="wb-tegel-boxes">' + boxes + "</span></div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Welke hoort er niet bij (odd one out) ────────────────────────────────────
  function rOddOneOut(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Streep in elke rij het woord door dat er niet bij hoort.", b.em);
    h += '<div class="wb-odd-lijst">';
    arr(b.rijen).forEach(function (r, i) {
      var woorden = r.woorden || r.items || [], fout = r.fout != null ? r.fout : r.goed;
      h += '<div class="wb-odd-rij"><span class="wb-rij-nr">' + (i + 1) + ".</span>" +
        woorden.map(function (w, wi) { return '<span class="wb-odd-w' + (ant && wi === fout ? " wb-odd-mark" : "") + '">' + esc(w) + "</span>"; }).join("") + "</div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Regel/categorie benoemen (kruisje in de juiste kolom) ────────────────────
  function rRegelbenoemen(b, nr, ant) {
    var regels = arr(b.regels); if (!regels.length) regels = ["ja", "nee"];
    var h = opdrachtKop(nr, b.opdracht || "Bij welke soort hoort elk woord? Zet een kruisje.", b.em);
    h += '<div class="wb-regel-tabel" style="--rb-kol:' + regels.length + '">';
    h += '<div class="wb-regel-rij wb-regel-head"><span></span>' + regels.map(function (r) { return "<span>" + esc(r) + "</span>"; }).join("") + "</div>";
    arr(b.woorden).forEach(function (w, i) {
      var woord = w && typeof w === "object" ? w.woord : w, goedR = w && (w.regel != null ? w.regel : w.goed);
      h += '<div class="wb-regel-rij"><span class="wb-regel-w">' + (i + 1) + ". " + esc(woord) + "</span>" +
        regels.map(function (r, ri) { var g = ant && (goedR === r || goedR === ri); return '<span class="wb-vak' + (g ? " wb-goed" : "") + '">' + (g ? "✓" : "") + "</span>"; }).join("") + "</div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Woorddictee (blanco regels; woorden staan op het antwoordblad) ───────────
  function rDictee(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Woorddictee: schrijf het woord dat wordt voorgelezen.", b.em);
    h += '<div class="wb-dictee-lijst">';
    arr(b.woorden).map(woordTekst).filter(Boolean).forEach(function (w, i) {
      h += '<div class="wb-dictee-rij"><span class="wb-rij-nr">' + (i + 1) + ".</span>" + (ant ? '<span class="wb-ant">' + esc(w) + "</span>" : lijn(200)) + "</div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Zinsdictee ───────────────────────────────────────────────────────────────
  function rZinsdictee(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Zinsdictee: schrijf de zin die wordt voorgelezen.", b.em);
    arr(b.zinnen).forEach(function (z, i) {
      var zin = String(z && z.zin != null ? z.zin : z).trim();
      h += '<div class="wb-zinsd"><div class="wb-zinsd-nr">' + (i + 1) + ".</div>";
      h += ant ? '<div class="wb-ant-blok">' + esc(zin) + "</div>" : '<div class="wb-schrijfregels"><div class="wb-schrijfregel"></div><div class="wb-schrijfregel"></div></div>';
      h += "</div>";
    });
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Kijk – dek af – schrijf ──────────────────────────────────────────────────
  function rKijkDek(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Kijk goed – dek af – schrijf uit je hoofd – kijk na.", b.em);
    h += '<div class="wb-kdk"><div class="wb-kdk-rij wb-kdk-head"><span>Kijk</span><span>Schrijf</span><span>Schrijf nog eens</span></div>';
    arr(b.woorden).map(woordTekst).filter(Boolean).forEach(function (woord) {
      var cel = ant ? '<span class="wb-ant">' + esc(woord) + "</span>" : lijn(120);
      h += '<div class="wb-kdk-rij"><span class="wb-kdk-w">' + esc(woord) + "</span><span>" + cel + "</span><span>" + cel + "</span></div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Overschrijven (inprenting) ───────────────────────────────────────────────
  function rOverschrijf(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Schrijf elk woord netjes twee keer over.", b.em);
    h += '<div class="wb-over-lijst">';
    arr(b.woorden).map(woordTekst).filter(Boolean).forEach(function (woord, i) {
      var lijnen = ant ? '<span class="wb-ant">' + esc(woord) + '</span> <span class="wb-ant">' + esc(woord) + "</span>" : lijn(120) + " " + lijn(120);
      h += '<div class="wb-over-rij"><span class="wb-rij-nr">' + (i + 1) + '.</span><b class="wb-over-w">' + esc(woord) + '</b><span class="wb-over-lijnen">' + lijnen + "</span></div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Definitie schrijven (open) ───────────────────────────────────────────────
  function rDefinitie(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Schrijf zelf op wat elk woord betekent.", b.em);
    arr(b.woorden).forEach(function (w, i) {
      var woord = w && typeof w === "object" ? w.woord : w, bet = (w && (w.betekenis || w.antwoord)) || "";
      h += '<div class="wb-open-vraag"><div class="wb-vraag-t">' + (i + 1) + ". " + esc(woord) + "</div>";
      h += ant ? '<div class="wb-ant-blok">' + esc(bet) + "</div>" : '<div class="wb-schrijfregels"><div class="wb-schrijfregel"></div></div>';
      h += "</div>";
    });
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Woordraadsel: omschrijving → kind schrijft het woord zelf ────────────────
  function rWoordraadsel(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Lees de omschrijving en schrijf het goede woord op.", b.em);
    var items = arr(b.items).length ? arr(b.items) : arr(b.woorden);
    h += '<div class="wb-invul-lijst">';
    items.forEach(function (it, i) {
      var om = it.omschrijving != null ? it.omschrijving : it.vraag, antw = it.antwoord != null ? it.antwoord : it.woord;
      h += '<div class="wb-raadsel-rij"><span class="wb-rij-nr">' + (i + 1) + '.</span><span class="wb-raadsel-om">' + esc(om) + "</span>" + (ant ? '<span class="wb-ant" style="margin-left:8px">' + esc(antw) + "</span>" : lijn(140)) + "</div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Verhaaltje met doelwoorden ───────────────────────────────────────────────
  function rVerhaal(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Schrijf een kort verhaal. Gebruik alle woorden hieronder.", b.em);
    var lijst = arr(b.woorden).map(woordTekst).filter(Boolean);
    h += '<div class="wb-woordbank"><span class="wb-bank-l">Gebruik:</span> ' + lijst.map(function (w) { return '<span class="wb-chip">' + esc(w) + "</span>"; }).join(" ") + "</div>";
    if (ant) h += '<div class="wb-ant-note">Eigen verhaal — nakijken op de woorden en de spelling.</div>';
    var regels = Math.max(3, Math.min(10, b.regels || 6));
    h += '<div class="wb-schrijfregels">';
    for (var k = 0; k < regels; k++) h += '<div class="wb-schrijfregel"></div>';
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Woord in de juiste zin (A of B — beide zinnen correct gespeld) ───────────
  function rJuisteZin(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "In welke zin is het woord goed gebruikt? Kies A of B.", b.em);
    arr(b.items).forEach(function (it, i) {
      var goed = it.goed != null ? it.goed : 0;
      h += '<div class="wb-jz"><div class="wb-vraag-t">' + (i + 1) + ". " + (it.woord ? "<b>" + esc(it.woord) + "</b>" : "") + "</div>";
      [it.a, it.b].forEach(function (zin, li) {
        var g = ant && goed === li;
        h += '<div class="wb-jz-opt"><span class="wb-bubble' + (g ? " wb-lid-goed" : "") + '">' + (li === 0 ? "A" : "B") + "</span> <span>" + esc(zin) + "</span></div>";
      });
      h += "</div>";
    });
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Keuzebord (3×3 mini-opdrachten) ──────────────────────────────────────────
  function rKeuzebord(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Kies zelf drie opdrachten op een rij (net als boter-kaas-en-eieren).", b.em);
    var opties = arr(b.opties).slice(0, 9); while (opties.length < 9) opties.push("");
    h += '<div class="wb-bord">' + opties.map(function (o) { return '<div class="wb-bord-vak">' + esc(o) + "</div>"; }).join("") + "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // ── Tic-tac-toe met woorden (rij van drie goed overschrijven) ────────────────
  function rTicTacToe(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Kies een rij van drie. Schrijf elk woord van die rij goed over.", b.em);
    var woorden = arr(b.woorden).map(woordTekst).slice(0, 9); while (woorden.length < 9) woorden.push("");
    h += '<div class="wb-bord wb-ttt">' + woorden.map(function (w) { return '<div class="wb-bord-vak"><b>' + esc(w) + '</b><span class="wb-ttt-lijn"></span></div>'; }).join("") + "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  // Render één blok (kiest de juiste renderer).
  // Verhaal ordenen: lees door-elkaar-gehusselde zinnen en zet ze op volgorde
  // (leesbegrip + volgorde). Data: { zinnen:[{zin, volgorde}] } — de array-volgorde
  // is de husselvolgorde op het blad; 'volgorde' is het juiste nummer (antwoordblad).
  function rVerhaalOrdenen(b, nr, ant) {
    var h = opdrachtKop(nr, b.opdracht || "Lees de zinnen. Zet ze in de goede volgorde: schrijf het nummer in het hokje.", b.em);
    h += '<div class="wb-vord">';
    arr(b.zinnen).forEach(function (z) {
      var zin = z && typeof z === "object" ? z.zin : z;
      var v = z && z.volgorde;
      h += '<div class="wb-vord-rij"><span class="wb-vord-vak' + (ant ? " wb-ant" : "") + '">' + (ant && v != null ? v : "") + '</span><span class="wb-vord-zin">' + esc(zin) + "</span></div>";
    });
    h += "</div>";
    return '<div class="wb-blok">' + h + "</div>";
  }

  function renderBlok(b, nr, ant) {
    switch (b.type) {
      case "tekst": return rTekst(b);
      case "meerkeuze": return rMeerkeuze(b, nr, ant);
      case "invul": return rInvul(b, nr, ant);
      case "open": return rOpen(b, nr, ant);
      case "koppelen": return rKoppelen(b, nr, ant);
      case "categoriseren": return rCategoriseren(b, nr, ant);
      case "waarnietwaar": return rWaarNietWaar(b, nr, ant);
      case "sommen": return rSommen(b, nr, ant);
      case "getallenlijn": return rGetallenlijn(b, nr, ant);
      case "woordzoeker": return rWoordzoeker(b, nr, ant);
      case "rekenmuurtje": return rMuur(b, nr, ant);
      case "getalhuis": return rHuis(b, nr, ant);
      case "klok": return rKlok(b, nr, ant);
      case "geld": return rGeld(b, nr, ant);
      case "doolhof": return rDoolhof(b, nr, ant);
      case "kruiswoord": return rKruiswoord(b, nr, ant);
      case "reeks": return rReeks(b, nr, ant);
      case "vergelijken": return rVergelijk(b, nr, ant);
      case "tafelkaart": return rTafel(b, nr, ant);
      case "breuken": return rBreuken(b, nr, ant);
      case "kleuropsom": return rKleur(b, nr, ant);
      case "staafdiagram": return rStaaf(b, nr, ant);
      case "sudoku": return rSudoku(b, nr, ant);
      case "geheimschrift": return rGeheim(b, nr, ant);
      case "anagram": return rHussel(b, nr, ant);
      case "zinbouwen": return rZin(b, nr, ant);
      case "lettergrepen": return rLettergrepen(b, nr, ant);
      case "rijmwoorden": return rRijm(b, nr, ant);
      case "synant": return rSynant(b, nr, ant);
      case "lidwoord": return rLidwoord(b, nr, ant);
      case "zoekdefout": return rZoekFout(b, nr, ant);
      case "bingo": return rBingo(b, nr);
      case "cijferend": case "cijferplus": case "cijfermin": case "cijferkeer": return rCijferend(b, nr, ant);
      case "ontbrekend": return rOntbrekend(b, nr, ant);
      case "buurgetallen": return rBuren(b, nr, ant);
      case "ordenen": return rOrdenen(b, nr, ant);
      case "plaatswaarde": return rPlaats(b, nr, ant);
      case "getalwoord": return rGetalwoord(b, nr, ant);
      case "afronden": return rAfronden(b, nr, ant);
      case "maalrooster": return rMaal(b, nr, ant);
      case "romeins": return rRomeins(b, nr, ant);
      case "automatiseer": return rSprint(b, nr, ant);
      case "teken": return rTeken(b, nr, ant);
      case "reflectie": return rReflectie(b, ant);
      // ── Nieuwe spelling-werkvormen (batch, nog op GETESTE_MODULES:false) ──
      case "meervoud": case "verkleinwoord": case "verledentijd": case "voltooiddeelwoord":
      case "verlengen": case "grondwoord": case "samenstellen": case "woordfamilie": return rWoordvorm(b, nr, ant);
      case "trappen": return rTrappen(b, nr, ant);
      case "pyramide": return rPyramide(b, nr, ant);
      case "woordtrap": return rWoordtrap(b, nr, ant);
      case "woordslang": return rWoordslang(b, nr, ant);
      case "verstopt": return rVerstopt(b, nr, ant);
      case "alfabetiseren": return rAlfabet(b, nr, ant);
      case "klanktellen": return rKlankkast(b, nr, ant);
      case "klinkers": return rKlinkers(b, nr, ant);
      case "klankgroepen": return rKlankgroep(b, nr, ant);
      case "woordinwoord": return rWoordInWoord(b, nr, ant);
      case "verhaalordenen": return rVerhaalOrdenen(b, nr, ant);
      case "woordwaarde": case "woordwaardespel": return rWoordwaarde(b, nr, ant);
      case "lettertegels": return rLettertegels(b, nr, ant);
      case "oddoneout": return rOddOneOut(b, nr, ant);
      case "regelbenoemen": return rRegelbenoemen(b, nr, ant);
      case "dictee": return rDictee(b, nr, ant);
      case "zinsdictee": return rZinsdictee(b, nr, ant);
      case "kijkdekschrijf": return rKijkDek(b, nr, ant);
      case "overschrijf": return rOverschrijf(b, nr, ant);
      case "definitie": return rDefinitie(b, nr, ant);
      case "woordraadsel": return rWoordraadsel(b, nr, ant);
      case "verhaal": return rVerhaal(b, nr, ant);
      case "juistezin": return rJuisteZin(b, nr, ant);
      case "keuzebord": return rKeuzebord(b, nr, ant);
      case "tictactoe": return rTicTacToe(b, nr, ant);
      default: return "";
    }
  }
  // Krijgt dit bloktype een opdrachtnummer?
  function genummerd(type) { return ["tekst", "reflectie"].indexOf(type) === -1; }

  function themaStyle(th) {
    return "--wb-accent:" + th.accent + ";--wb-soft:" + th.soft + ";--wb-ink:" + th.ink +
      ";--wb-paper:" + th.paper + ";--wb-band:" + th.band + ";--wb-band-ink:" + th.bandInk + ";--wb-font:" + th.font + ";";
  }

  // ── Pagina renderen ────────────────────────────────────────────────────────
  function renderPagina(wb, ant) {
    var th = thema(wb.thema);
    var mas = th.mascottes;
    var titel = wb.titel || "Werkblad";
    var sub = ant ? "Antwoordblad" : (wb.ondertitel || "");
    var meta = [wb.vak, wb.groep].filter(Boolean).map(esc).join(" · ");

    var style = "--wb-accent:" + th.accent + ";--wb-soft:" + th.soft + ";--wb-ink:" + th.ink +
      ";--wb-paper:" + th.paper + ";--wb-band:" + th.band + ";--wb-band-ink:" + th.bandInk +
      ";--wb-font:" + th.font + ";";

    var h = '<div class="wb-page' + (ant ? " wb-page-ant" : "") + '" style="' + style + '">';
    // Titelband
    h += '<div class="wb-band">';
    h += '<span class="wb-band-mas wb-mas-l">' + mas[0] + "</span>";
    h += '<div class="wb-band-mid"><div class="wb-titel">' + esc(titel) + "</div>" +
      (sub ? '<div class="wb-sub">' + esc(sub) + "</div>" : "") + "</div>";
    h += '<span class="wb-band-mas wb-mas-r">' + (mas[1] || mas[0]) + "</span>";
    h += "</div>";
    // Naam/datum-regel (niet op het antwoordblad)
    if (wb.naamveld !== false && !ant) {
      h += '<div class="wb-naamrij"><span>Naam: ' + lijn(150) + "</span>" +
        (meta ? '<span class="wb-naam-meta">' + meta + "</span>" : "") +
        "<span>Datum: " + lijn(90) + "</span></div>";
    } else if (meta) {
      h += '<div class="wb-naamrij"><span class="wb-naam-meta">' + meta + "</span></div>";
    }
    // Blokken
    h += '<div class="wb-body">';
    var nr = 0;
    arr(wb.blokken).forEach(function (b) {
      if (!b || !b.type) return;
      var n = genummerd(b.type) ? ++nr : null;
      h += renderBlok(b, n, ant);
    });
    h += "</div>";
    // Voet
    // Brand-signatuur draagt al de afvinken-✓; kies als decoratie GEEN tweede vinkje
    // (mas[2] is de ✅) maar de Avinka-ster, anders staan er twee vinkjes naast elkaar.
    h += '<div class="wb-voet"><span>Gemaakt met Avinka ✓</span><span class="wb-voet-mas">' + (th.emoji || mas[0] || "") + "</span></div>";
    h += "</div>";
    return h;
  }

  function render(wb, opts) {
    opts = opts || {};
    if (!stylesheetIngeladen) injecteerCss();
    normaliseer(wb);
    var h = renderPagina(wb, false);
    if (opts.antwoorden) h += renderPagina(wb, true);
    return h;
  }

  // Korte platte tekst (voor opslag-preview / zoeken).
  function platteTekst(wb) {
    var regels = [wb.titel || "Werkblad"];
    arr(wb.blokken).forEach(function (b) {
      if (b.opdracht) regels.push(b.opdracht);
      if (b.tekst) regels.push(String(b.tekst).slice(0, 200));
    });
    return regels.join("\n");
  }

  // ── Stylesheet (één keer injecteren) ───────────────────────────────────────
  var stylesheetIngeladen = false;
  function injecteerCss() {
    stylesheetIngeladen = true;
    var s = document.createElement("style");
    s.id = "avinka-werkblad-css";
    s.textContent = [
      // Pagina = papier (A4-gevoel op het scherm; exacte A4 bij printen)
      ".wb-page{background:var(--wb-paper);color:var(--wb-ink);font-family:var(--wb-font);width:100%;max-width:720px;margin:0 auto 26px;border-radius:14px;box-shadow:0 14px 40px rgba(34,28,58,.16);overflow:hidden;border:1px solid rgba(34,28,58,.08);-webkit-print-color-adjust:exact;print-color-adjust:exact}",
      // Titelband
      ".wb-band{background:var(--wb-band);color:var(--wb-band-ink);display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px}",
      ".wb-band-mid{flex:1;text-align:center}",
      ".wb-titel{font-family:var(--wb-font);font-weight:700;font-size:26px;line-height:1.1;letter-spacing:-.3px}",
      ".wb-sub{font-size:13px;font-weight:600;opacity:.92;margin-top:3px}",
      ".wb-band-mas{font-size:34px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.18))}",
      // Naamrij
      ".wb-naamrij{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 18px;padding:12px 24px;border-bottom:2px dashed var(--wb-soft);font-size:14px;font-weight:600;color:var(--wb-ink)}",
      ".wb-naam-meta{background:var(--wb-soft);color:var(--wb-accent);border-radius:999px;padding:3px 12px;font-size:12px;font-weight:700}",
      // Body
      ".wb-body{padding:18px 24px 6px}",
      ".wb-blok{margin:0 0 18px;break-inside:avoid;page-break-inside:avoid}",
      // Opdracht-kop
      ".wb-opdr-kop{display:flex;align-items:center;gap:10px;margin-bottom:9px}",
      ".wb-nr{flex-shrink:0;width:26px;height:26px;border-radius:8px;background:var(--wb-accent);color:#fff;font-weight:800;font-size:14px;display:flex;align-items:center;justify-content:center}",
      ".wb-opdr-t{font-weight:700;font-size:15.5px;color:var(--wb-ink)}",
      ".wb-kop-em{margin-left:auto;font-size:20px}",
      // Invullijnen
      ".wb-lijn{display:inline-block;border-bottom:2px solid var(--wb-ink);height:1.05em;vertical-align:bottom;margin:0 2px}",
      ".wb-wkol{display:inline-block}", // referentiekolom → schrijflijntjes lijnen uit

      ".wb-ant{border-bottom-color:var(--wb-accent);color:var(--wb-accent);font-weight:800;text-align:center;padding:0 4px}",
      // Leestekst
      ".wb-leesblok{background:var(--wb-soft);border-radius:12px;padding:14px 16px;border:1px solid rgba(34,28,58,.06)}",
      ".wb-tekst-kop{font-weight:800;font-size:15px;color:var(--wb-accent);margin-bottom:6px}",
      ".wb-tekst-body{font-size:14.5px;line-height:1.7}.wb-tekst-body p{margin:0 0 8px}.wb-tekst-body p:last-child{margin:0}",
      // Meerkeuze
      ".wb-mk-lijst{column-width:300px;column-gap:34px}",
      ".wb-vraag{margin:0 0 13px;break-inside:avoid;-webkit-column-break-inside:avoid}.wb-vraag-t{font-size:14.5px;font-weight:600;margin-bottom:6px}",
      ".wb-mk-opties{display:flex;flex-wrap:wrap;gap:8px 14px}",
      ".wb-mk{display:inline-flex;align-items:center;gap:8px;font-size:14px;border:1.5px solid rgba(34,28,58,.14);border-radius:10px;padding:6px 13px 6px 8px;background:#fff}",
      ".wb-bubble{width:23px;height:23px;border-radius:50%;border:1.5px solid rgba(34,28,58,.45);color:var(--wb-ink);font-weight:800;font-size:12.5px;display:inline-flex;align-items:center;justify-content:center;background:#fff;flex-shrink:0}",
      ".wb-mk.wb-goed{background:var(--wb-soft)}",
      ".wb-vink{width:21px;height:21px;border:2px solid var(--wb-ink);border-radius:5px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;flex-shrink:0}",
      ".wb-mk.wb-goed .wb-vink{background:var(--wb-accent);border-color:var(--wb-accent)}",
      // Invul
      ".wb-invul-lijst{column-width:250px;column-gap:34px}",
      ".wb-invul-rij{display:flex;gap:9px;font-size:14.5px;line-height:1.7;margin-bottom:9px;break-inside:avoid;-webkit-column-break-inside:avoid}.wb-rij-nr{font-weight:800;color:var(--wb-accent)}",
      // Open vragen
      ".wb-open-vraag{margin:8px 0 12px}",
      ".wb-schrijfregels{margin-top:30px;display:flex;flex-direction:column;gap:26px}",
      ".wb-open-vraag{margin:10px 0 16px}",
      ".wb-schrijfregel{border-bottom:1.5px dotted rgba(34,28,58,.35);height:1px}",
      ".wb-ant-blok{margin-top:5px;background:var(--wb-soft);border-left:3px solid var(--wb-accent);border-radius:8px;padding:7px 11px;font-size:14px;font-weight:600;color:var(--wb-ink)}",
      ".wb-ant-note{margin:2px 0 10px;font-size:12.5px;font-style:italic;color:rgba(34,28,58,.6)}",
      // Koppelen
      ".wb-kp2{position:relative}",
      ".wb-kp2-rij{position:relative;height:48px}",
      ".wb-kp2-box{position:absolute;top:50%;transform:translateY(-50%);width:40%;box-sizing:border-box;background:#fff;border:1.5px solid var(--wb-ink);border-radius:9px;padding:6px 12px;font-weight:600;font-size:14px;line-height:1.2;white-space:normal;word-break:break-word;overflow:hidden}",
      ".wb-kp2-box.wb-l{left:0}",
      ".wb-kp2-box.wb-r{right:0}",
      ".wb-stip{position:absolute;top:50%;width:11px;height:11px;border-radius:50%;background:var(--wb-accent);transform:translateY(-50%);z-index:1}",
      ".wb-stip.wb-sl{left:40%}",
      ".wb-stip.wb-sr{left:60%;margin-left:-11px}",
      ".wb-kp2-svg{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none}",
      ".wb-kp2-pad{fill:none;stroke:var(--wb-accent);stroke-width:2.5;stroke-linecap:round}",
      // Categoriseren
      ".wb-woordbank{background:var(--wb-soft);border-radius:10px;padding:9px 12px;margin-bottom:11px;font-size:14px;line-height:2}",
      ".wb-bank-l{font-weight:800;color:var(--wb-accent);margin-right:4px}",
      ".wb-chip{display:inline-block;background:#fff;border:1.5px solid var(--wb-accent);color:var(--wb-ink);border-radius:999px;padding:2px 11px;font-size:13px;font-weight:600;margin:2px}",
      ".wb-cats{display:grid;gap:10px}",
      ".wb-cat{border:1.5px solid rgba(34,28,58,.16);border-radius:11px;overflow:hidden}",
      ".wb-cat-kop{background:var(--wb-accent);color:#fff;font-weight:700;font-size:13.5px;padding:7px 11px;text-align:center}",
      ".wb-cat-in{padding:24px 11px 14px;display:flex;flex-direction:column;gap:24px;min-height:92px;font-size:14px}",
      // Waar/niet waar
      ".wb-wnw{border:1.5px solid rgba(34,28,58,.14);border-radius:11px;overflow:hidden}",
      ".wb-wnw-head,.wb-wnw-rij{display:grid;grid-template-columns:1fr 64px 78px;align-items:center}",
      ".wb-wnw-head{background:var(--wb-soft);font-weight:800;font-size:12px;color:var(--wb-accent);text-align:center}.wb-wnw-head span{padding:7px 4px}",
      ".wb-wnw-rij{border-top:1px solid rgba(34,28,58,.1)}",
      ".wb-wnw-t{padding:9px 11px;font-size:14.5px}",
      ".wb-vak{justify-self:center;width:24px;height:24px;border:2px solid var(--wb-accent);border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff}",
      ".wb-vak.wb-goed{background:var(--wb-accent)}",
      // Sommen
      ".wb-sommen{display:grid;gap:11px 24px}",
      ".wb-som{display:grid;grid-template-columns:20px var(--exprw,1fr) var(--answ,58px);align-items:center;gap:7px;font-size:16px;font-weight:600;justify-content:start}",
      ".wb-som.l{grid-template-columns:20px max-content var(--answ,58px)}",
      ".wb-som.l .wb-som-a{text-align:center}",
      // Getal ↔ woord — rij loopt vloeiend door; streep komt direct na de pijl
      ".wb-gw{display:flex;flex-direction:column;gap:14px}",
      ".wb-gw-rij{display:flex;gap:8px;font-size:16px;font-weight:600;align-items:baseline}",
      ".wb-gw-rij .wb-som-nr{color:var(--wb-accent);font-weight:800;font-size:13px}",
      ".wb-gw-tekst{flex:1;min-width:0;font-weight:700;line-height:1.7}",
      ".wb-gw-pijl{color:var(--wb-accent);font-weight:800;font-size:18px}",
      ".wb-gw-lijn{display:inline-block;border-bottom:2px solid var(--wb-ink);min-height:1.2em;padding:0 5px;text-align:center;vertical-align:bottom;color:var(--wb-accent)}",
      ".wb-som-nr{color:var(--wb-accent);font-weight:800;font-size:13px}",
      ".wb-som-t{text-align:left;font-variant-numeric:tabular-nums}",
      ".wb-som-a{min-height:1.25em;text-align:right}",
      ".wb-som-a.wb-som-lijn{border-bottom:2px solid var(--wb-ink)}",
      ".wb-ontbr{display:flex;flex-wrap:wrap;gap:12px 48px;align-items:flex-start}",
      ".wb-ontbr-kol{display:flex;flex-direction:column;gap:12px}",
      ".wb-ontbr-rij{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:600}",
      ".wb-somrij{display:flex;flex-wrap:wrap;gap:12px 36px;align-items:flex-start}",
      ".wb-somkol{display:grid;grid-template-columns:auto max-content auto;column-gap:9px;row-gap:12px;align-items:center;font-size:16px;font-weight:600}",
      ".wb-somnr{color:var(--wb-accent);font-weight:800;font-size:13px}",
      ".wb-somt{text-align:left;font-variant-numeric:tabular-nums;white-space:nowrap}",
      ".wb-soma{min-height:1.25em}",
      ".wb-soma.wb-somlijn{border-bottom:2px solid var(--wb-ink)}",
      // Getallenlijn
      ".wb-nl-wrap{width:100%}.wb-nl-wrap+.wb-nl-wrap{margin-top:10px}.wb-nl{width:100%;height:auto}",
      ".wb-nl-as,.wb-nl-tick,.wb-nl-wijs{stroke:var(--wb-ink);stroke-width:2}.wb-nl-wijs{stroke-width:1.5}",
      ".wb-nl-pijl{fill:var(--wb-ink)}",
      ".wb-nl-label{font-size:13px;fill:var(--wb-ink);text-anchor:middle;font-family:var(--wb-font)}",
      ".wb-nl-box{fill:#fff;stroke:var(--wb-accent);stroke-width:2}.wb-nl-box.wb-goed{fill:var(--wb-soft)}",
      ".wb-nl-ant{font-size:13px;fill:var(--wb-accent);text-anchor:middle;font-weight:800;font-family:var(--wb-font)}",
      // Woordzoeker
      ".wb-wz-wrap{display:flex;flex-direction:column;align-items:center;gap:10px}",
      ".wb-wz{border-collapse:collapse;margin:0 auto}",
      ".wb-wz td{width:26px;height:26px;text-align:center;font-size:14px;font-weight:700;border:1px solid rgba(34,28,58,.12);font-family:var(--wb-font);text-transform:uppercase}",
      ".wb-wz-hit{background:var(--wb-accent);color:#fff;border-radius:4px}",
      ".wb-wz-woorden{display:grid;grid-template-columns:repeat(4,auto);gap:7px 16px;justify-content:center;justify-items:center}",
      // Teken
      ".wb-teken{border:2px dashed rgba(34,28,58,.3);border-radius:12px;background:repeating-linear-gradient(45deg,transparent,transparent 12px,rgba(34,28,58,.02) 12px,rgba(34,28,58,.02) 24px)}",
      ".wb-teken-ant{display:flex;align-items:center;justify-content:center;color:var(--wb-accent);font-weight:700;font-size:15px}",
      // Reflectie
      ".wb-reflectie{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--wb-soft);border-radius:11px;padding:10px 16px}",
      ".wb-refl-v{font-weight:700;font-size:14.5px}.wb-smileys{font-size:22px}",
      // Rekenmuurtje
      ".wb-muren{display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;gap:16px 26px}",
      ".wb-muur{display:flex;flex-direction:column;align-items:center;gap:6px}",
      ".wb-muur-rij{display:flex;gap:6px}",
      ".wb-steen{min-width:48px;width:auto;height:36px;padding:0 8px;border:2px solid var(--wb-ink);border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;background:var(--wb-soft)}",
      ".wb-steen.wb-ant{color:var(--wb-accent);border-color:var(--wb-accent)}",
      // Splitshuis
      ".wb-huizen{display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;gap:16px 26px}",
      ".wb-huis{width:158px;border:2px solid var(--wb-ink);border-radius:12px;overflow:hidden}",
      ".wb-huis-dak{background:var(--wb-accent);color:#fff;text-align:center;font-weight:800;font-size:21px;padding:7px}",
      ".wb-huis-body{padding:9px;display:flex;flex-direction:column;gap:8px}",
      ".wb-huis-rij{display:flex;align-items:center;justify-content:center;gap:9px}",
      ".wb-raam{width:48px;height:36px;border:2px solid var(--wb-ink);border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:800;background:#fff}",
      ".wb-raam.wb-ant{color:var(--wb-accent);border-color:var(--wb-accent)}",
      ".wb-huis-en{font-weight:700;color:var(--wb-ink);opacity:.6;font-size:13px}",
      // Klok
      ".wb-klok-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;justify-items:center}",
      ".wb-klok-item{text-align:center}",
      ".wb-klok{width:84px;height:84px;color:var(--wb-ink)}",
      ".wb-klok-cijfer{font-size:11px;font-weight:700;fill:var(--wb-ink);text-anchor:middle;font-family:var(--wb-font)}",
      ".wb-klok-ant{margin-top:6px;font-weight:800;font-size:13px;line-height:1.2;min-height:18px}",
      // Geld (gebruikt .wb-sommen)
      // Doolhof
      ".wb-doolhof-wrap{display:flex;justify-content:center}",
      ".wb-doolhof{width:100%;max-width:360px;height:auto;color:var(--wb-ink)}",
      ".wb-doolhof line{stroke:var(--wb-ink);stroke-width:2;stroke-linecap:round}",
      ".wb-dh-pad{fill:none;stroke:var(--wb-accent);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;opacity:.8}",
      ".wb-dh-mark{font-size:12px;font-weight:800;fill:var(--wb-accent);text-anchor:middle;font-family:var(--wb-font)}",
      // Kruiswoord
      ".wb-kruis-wrap{display:flex;justify-content:center;margin-bottom:12px}",
      ".wb-kruis{border-collapse:collapse}",
      ".wb-kruis td{width:27px;height:27px;border:1.5px solid var(--wb-ink);text-align:center;font-weight:800;font-size:14px;position:relative;background:#fff;font-family:var(--wb-font);text-transform:uppercase}",
      ".wb-kruis td.leeg{border:none;background:transparent}",
      ".wb-kruis-num{position:absolute;top:0;left:2px;font-size:8px;font-weight:700;color:var(--wb-accent)}",
      ".wb-kruis-clues{display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13.5px}",
      "@media (max-width:520px){.wb-kruis-clues{grid-template-columns:1fr}}",
      ".wb-kruis-h{font-size:12px;font-weight:800;color:var(--wb-accent);text-transform:uppercase;letter-spacing:.5px;margin:0 0 5px}",
      ".wb-kruis-clue{margin:3px 0;line-height:1.45}",
      // Reeks
      ".wb-reeks{display:flex;flex-direction:column;gap:9px}",
      ".wb-reeks-rij{display:flex;align-items:center;gap:10px;flex-wrap:wrap}",
      ".wb-reeks-cel{min-width:42px;height:34px;border:2px solid var(--wb-ink);border-radius:7px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;padding:0 6px}",
      ".wb-reeks-cel.gat{background:var(--wb-soft);border-style:dashed}",
      ".wb-reeks-cel.wb-ant{color:var(--wb-accent)}",
      ".wb-reeks-komma{font-weight:800;font-size:16px}",
      // Vergelijken
      ".wb-verg-legenda{font-size:12.5px;font-weight:600;color:var(--wb-ink);opacity:.65;margin:-2px 0 10px}",
      ".wb-verg-legenda b{color:var(--wb-accent)}",
      ".wb-verg{display:grid;justify-content:center;gap:10px 48px}",
      ".wb-verg-rij{display:flex;align-items:center;gap:9px;font-size:16px;font-weight:600}",
      ".wb-verg-z{display:inline-block;min-width:2.4ch;font-variant-numeric:tabular-nums}",
      ".wb-verg-l{text-align:right}.wb-verg-r{text-align:left}",
      ".wb-verg-teken{width:30px;height:30px;border:2px solid var(--wb-accent);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:800;color:var(--wb-accent)}",
      // Breuken
      ".wb-breuk-lijst{display:flex;flex-direction:column;gap:11px}",
      ".wb-breuk-rij{display:flex;align-items:center;gap:11px}",
      ".wb-breuk{height:28px;width:auto}",
      ".wb-breuk-v{font-size:15px;font-weight:700;display:inline-flex;align-items:center;gap:5px}",
      ".wb-frac{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;vertical-align:middle;line-height:1;font-weight:inherit;font-size:0.9em}", // een tikje kleiner dan de omringende getallen; strakke regelhoogte houdt de hoogte beperkt
      ".wb-frac-t{padding:0 5px 1px;border-bottom:1.5px solid currentColor}",
      ".wb-frac-n{padding:1px 5px 0}",
      // Kleur-op-som
      ".wb-kleur-legenda{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}",
      ".wb-kleur-chip{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;background:var(--wb-soft);border-radius:999px;padding:3px 11px}",
      ".wb-kleur-vak{width:14px;height:14px;border-radius:3px;border:1px solid var(--wb-ink)}",
      ".wb-kleur-grid{border-collapse:collapse;margin:0 auto}",
      ".wb-kleur-grid td{width:46px;height:30px;border:1px solid var(--wb-ink);text-align:center;font-size:11.5px;font-weight:600;font-variant-numeric:tabular-nums}",
      // Staafdiagram
      ".wb-staaf-titel{text-align:center;font-weight:800;font-size:15px;margin-bottom:6px}",
      ".wb-staaf-eenheid{text-align:center;font-size:12px;color:var(--wb-ink);opacity:.6;margin:-2px 0 8px}",
      ".wb-staaf-wrap{display:flex;justify-content:center;margin-bottom:6px}",
      ".wb-staaf{width:100%;max-width:440px;height:auto}",
      ".wb-staaf-grid{stroke:#b8c0cc;stroke-width:1;stroke-dasharray:3 3}",
      ".wb-staaf-basis{stroke:var(--wb-ink);stroke-width:1.5}",
      ".wb-staaf-as{font-size:9px;fill:var(--wb-ink);text-anchor:end;font-family:var(--wb-font)}",
      ".wb-staaf-l{font-size:12px;fill:var(--wb-ink);text-anchor:middle;font-family:var(--wb-font)}",
      // Sudoku
      ".wb-sudoku{border-collapse:collapse;margin:0 auto;border:2.5px solid var(--wb-ink)}",
      ".wb-sudoku td{width:34px;height:34px;border:1px solid var(--wb-ink);text-align:center;font-weight:700;font-size:17px;font-family:var(--wb-font)}",
      ".wb-sudoku td.rb{border-right:2.5px solid var(--wb-ink)}",
      ".wb-sudoku td.bb{border-bottom:2.5px solid var(--wb-ink)}",
      ".wb-sudoku td.geg{background:var(--wb-soft)}",
      ".wb-sudoku td.wb-ant{color:var(--wb-accent)}",
      // Geheimschrift
      ".wb-geheim-legenda{display:flex;flex-wrap:wrap;gap:6px 12px;background:var(--wb-soft);border-radius:10px;padding:9px 12px;margin-bottom:11px;font-size:14px;font-weight:600}",
      ".wb-geheim-paar b{font-size:16px;color:var(--wb-accent)}",
      ".wb-geheim-woorden{display:flex;flex-direction:column;gap:10px}",
      ".wb-geheim-rij{display:flex;align-items:flex-end;gap:5px;flex-wrap:wrap}",
      ".wb-geheim-cel{display:flex;flex-direction:column;align-items:center;gap:2px}",
      ".wb-geheim-sym{font-size:18px}",
      ".wb-geheim-in{width:22px;height:24px;border-bottom:2px solid var(--wb-ink);text-align:center;font-weight:800;color:var(--wb-accent)}",
      // Hussel / zin
      ".wb-hussel{letter-spacing:2px;font-size:16px}",
      ".wb-hussel-vast{color:var(--wb-accent);text-decoration:underline;text-underline-offset:3px}",
      ".wb-hussel-uitleg{font-size:13px;color:rgba(34,28,58,.7);margin:2px 0 12px}",
      ".wb-anagram-item{break-inside:avoid;-webkit-column-break-inside:avoid;margin:0 0 13px}",
      ".wb-anagram-ant{margin-top:5px}",
      ".wb-zin-rij{margin:0 0 12px}",
      ".wb-zin-chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center}",
      // Lidwoord
      ".wb-lidw-lijst{column-width:180px;column-gap:28px}",
      ".wb-lidw-rij{display:flex;align-items:center;gap:8px;font-size:15px;margin-bottom:9px;break-inside:avoid;-webkit-column-break-inside:avoid}",
      ".wb-lidw-w{font-weight:600}",
      ".wb-bubble.wb-lid-goed{border:2.5px solid var(--wb-accent);color:var(--wb-accent);background:var(--wb-soft)}",
      // Bingo
      ".wb-bingo{border-collapse:collapse;margin:0 auto}",
      ".wb-bingo td{width:58px;height:46px;border:2px solid var(--wb-ink);text-align:center;font-weight:700;font-size:15px;padding:2px}",
      // Algemeen invul-vakje
      ".wb-vakje{display:inline-block;min-width:36px;height:27px;border:1.5px solid var(--wb-ink);border-radius:6px;vertical-align:middle;text-align:center;font-weight:800;line-height:25px;margin:0 2px}",
      ".wb-vakje.wb-ant{color:var(--wb-accent);border-color:var(--wb-accent);background:var(--wb-soft)}",
      // Cijferend rekenen
      ".wb-cijfer-grid{display:flex;flex-wrap:wrap;gap:24px 40px}",
      ".wb-cijfer{display:flex;gap:6px;align-items:flex-start}",
      ".wb-cijfer-nr{color:var(--wb-accent);font-weight:800;font-size:13px;margin-top:24px}",
      ".wb-cijfer-blok{display:inline-block}",
      ".wb-cijfer-rij{display:flex;align-items:stretch}",
      ".wb-cijfer-op{width:22px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;color:var(--wb-accent)}",
      ".wb-hok{width:28px;height:32px;border:1px solid rgba(34,28,58,.16);margin:-0.5px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:17px;font-variant-numeric:tabular-nums}",
      ".wb-hok.wb-hok-carry{height:19px;border:1px dashed rgba(47,158,110,.55)}",
      ".wb-hok-ant{color:var(--wb-accent)}",
      ".wb-cijfer-streep{height:2.5px;background:var(--wb-ink);margin:3px 0}",
      // Buurgetallen
      ".wb-buren-wrap{display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;gap:14px 42px}",
      ".wb-buren{display:grid;grid-template-columns:repeat(6,auto);gap:12px 9px;align-items:center;justify-items:center}",
      ".wb-buren .wb-som-nr{justify-self:end;color:var(--wb-accent);font-weight:800;font-size:13px}",
      ".wb-buren-op{font-weight:800;color:var(--wb-accent);font-size:13.5px;font-variant-numeric:tabular-nums}",
      ".wb-buren-mid{min-width:60px;text-align:center;font-weight:800;font-size:17px;font-variant-numeric:tabular-nums;background:var(--wb-soft);border-radius:7px;padding:5px 10px}",
      // Ordenen
      ".wb-orden{display:grid;grid-template-columns:auto auto auto auto;gap:13px 12px;align-items:center;justify-items:start;width:max-content}",
      ".wb-orden .wb-som-nr{justify-self:end;color:var(--wb-accent);font-weight:800;font-size:13px}",
      ".wb-orden-bron{display:flex;gap:6px}",
      ".wb-orden-pijl{font-weight:800;color:var(--wb-accent);font-size:18px}",
      ".wb-orden-doel{display:flex;gap:6px}",
      ".wb-vakje.wb-orden-vk{width:max(36px,var(--obw,2.6ch));min-width:max(36px,var(--obw,2.6ch));padding:0 2px}",
      ".wb-chip.wb-orden-chip{width:max(36px,var(--obw,2.6ch));min-width:max(36px,var(--obw,2.6ch));text-align:center;padding:3px 4px;box-sizing:border-box}",
      ".wb-orden-frac .wb-orden-vk{height:auto;min-height:36px;line-height:1;font-weight:600;padding:3px 4px;display:inline-flex;align-items:center;justify-content:center}",
      ".wb-orden-frac .wb-orden-chip{height:auto;font-weight:600;padding:4px 6px;display:inline-flex;align-items:center;justify-content:center}",
      // Maaltafel-rooster
      ".wb-maalrij{display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;gap:16px 22px}",
      ".wb-maal{border-collapse:collapse}",
      ".wb-maal th,.wb-maal td{width:42px;height:32px;border:1.5px solid var(--wb-ink);text-align:center;font-weight:700;font-size:15px}",
      ".wb-maal th{background:var(--wb-soft);color:var(--wb-accent)}",
      ".wb-maal th.hoek{background:var(--wb-accent);color:#fff;font-size:18px}",
      ".wb-maal td.wb-ant{color:var(--wb-accent)}",
      // Sprint
      ".wb-sprint-score{margin-top:12px;font-weight:800;font-size:15px;text-align:center;background:var(--wb-soft);border-radius:10px;padding:9px}",
      // ── Nieuwe spelling-werkvormen ──
      ".wb-lhok{display:inline-flex;align-items:center;justify-content:center;width:26px;height:30px;border:1.5px solid var(--wb-ink);border-radius:5px;margin:0 2px 2px 0;font-weight:800;font-size:16px;color:var(--wb-accent);text-transform:uppercase;vertical-align:middle}",
      // Trappen van vergelijking
      ".wb-trap{display:grid;gap:6px}",
      ".wb-trap-rij{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;align-items:center;font-size:15px}",
      ".wb-trap-head{font-weight:800;color:var(--wb-accent);font-size:12.5px;text-transform:uppercase;letter-spacing:.4px}",
      // Pyramide
      ".wb-pyr-lijst{display:flex;flex-wrap:wrap;gap:18px 30px}",
      ".wb-pyr{display:flex;flex-direction:column;align-items:flex-start;gap:3px}",
      ".wb-pyr-doel{font-weight:800;color:var(--wb-accent);font-size:15px;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}",
      ".wb-pyr-rij{display:flex}",
      // Woordtrap (ladder)
      ".wb-ladder{display:flex;flex-direction:column;gap:6px}",
      ".wb-ladder-rij{display:flex;align-items:center;gap:12px}",
      ".wb-ladder-hint{font-size:13.5px;color:var(--wb-ink);opacity:.75}",
      // Woordslang
      ".wb-slang{display:flex;flex-wrap:wrap;align-items:center;gap:6px 4px;font-size:16px}",
      ".wb-slang-cel{display:inline-flex;align-items:center;background:var(--wb-soft);border-radius:8px;padding:5px 10px;font-weight:700}",
      ".wb-slang-pijl{color:var(--wb-accent);font-weight:800}",
      // Verstopte woorden
      ".wb-verstopt-strip{font-weight:800;font-size:20px;letter-spacing:3px;background:var(--wb-soft);border-radius:10px;padding:12px 14px;margin-bottom:12px;word-break:break-all;text-align:center;color:var(--wb-ink)}",
      ".wb-verstopt-doel{color:var(--wb-accent);background:var(--wb-soft);border-radius:4px;padding:0 2px}",
      // Klankkast
      ".wb-klank-lijst{display:flex;flex-direction:column;gap:9px}",
      ".wb-klank-rij{display:flex;align-items:center;gap:12px}",
      ".wb-klank-w{min-width:110px;font-size:16px}",
      ".wb-klank-boxes{display:flex}",
      // Klinkers markeren
      ".wb-klink-lijst{display:flex;flex-wrap:wrap;gap:10px 26px}",
      ".wb-klink-rij{display:flex;align-items:center;gap:8px}",
      ".wb-klink-w{font-size:19px;font-weight:700;letter-spacing:2px}",
      ".wb-klink-l{display:inline-block;padding:0 1px}",
      ".wb-klink-mark{color:var(--wb-accent);border:2px solid var(--wb-accent);border-radius:50%;padding:0 3px;font-weight:800}",
      // Klankgroepen
      ".wb-kg-tag{color:var(--wb-accent);font-weight:800;font-size:12.5px;margin-left:2px}",
      ".wb-kg-scheid{color:var(--wb-ink);opacity:.5;margin:0 3px}",
      // Woord-in-woord
      ".wb-wiw-rij{display:flex;align-items:center;gap:12px;margin:0 0 9px}",
      ".wb-wiw-w{font-size:18px;color:var(--wb-accent);letter-spacing:1px}",
      // Verhaal ordenen (zinsvolgorde)
      ".wb-vord{display:flex;flex-direction:column;gap:10px}",
      ".wb-vord-rij{display:flex;align-items:flex-start;gap:12px;font-size:15px;break-inside:avoid}",
      ".wb-vord-vak{flex-shrink:0;width:30px;height:30px;border:2px solid var(--wb-accent);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--wb-accent);background:#fff}",
      ".wb-vord-vak.wb-ant{background:var(--wb-soft)}",
      ".wb-vord-zin{padding-top:4px;line-height:1.5}",
      // Lettertegels
      ".wb-tegel-lijst{display:flex;flex-direction:column;gap:12px}",
      ".wb-tegel-rij{display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
      ".wb-tegel-pool{display:flex;gap:5px}",
      ".wb-ltegel{display:inline-flex;align-items:center;justify-content:center;width:28px;height:32px;background:var(--wb-accent);color:#fff;border-radius:6px;font-weight:800;font-size:16px}",
      ".wb-tegel-pijl{color:var(--wb-accent);font-weight:800;font-size:18px;margin:0 4px}",
      ".wb-tegel-boxes{display:flex}",
      // Odd one out
      ".wb-odd-lijst{display:flex;flex-direction:column;gap:10px}",
      ".wb-odd-rij{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px}",
      ".wb-odd-w{font-size:15.5px;font-weight:600;padding:4px 12px;border:1.5px solid rgba(34,28,58,.16);border-radius:10px;background:#fff}",
      ".wb-odd-mark{border-color:var(--wb-accent);color:var(--wb-accent);text-decoration:line-through;font-weight:800}",
      // Regel benoemen (tabel)
      ".wb-regel-tabel{display:grid;grid-template-columns:minmax(0,1fr) repeat(var(--rb-kol,2),minmax(64px,max-content));column-gap:8px;row-gap:5px;align-items:center}",
      ".wb-regel-rij{display:contents;font-size:14.5px}",
      ".wb-regel-head{font-weight:800;color:var(--wb-accent);font-size:12px;text-transform:uppercase;letter-spacing:.3px}",
      ".wb-regel-head span{text-align:center;white-space:nowrap;padding:0 6px}",
      ".wb-regel-w{font-weight:600}",
      ".wb-regel-rij>.wb-vak{justify-self:center}",
      // Dictee
      ".wb-dictee-lijst{display:grid;grid-template-columns:1fr 1fr;gap:12px 30px}",
      ".wb-dictee-rij{display:flex;align-items:baseline;gap:8px}",
      // Zinsdictee
      ".wb-zinsd{margin:0 0 12px}.wb-zinsd-nr{font-weight:800;color:var(--wb-accent);font-size:13px;margin-bottom:4px}",
      // Kijk-dek-schrijf
      ".wb-kdk{display:grid;gap:6px}",
      ".wb-kdk-rij{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;align-items:center}",
      ".wb-kdk-head{font-weight:800;color:var(--wb-accent);font-size:12px;text-transform:uppercase;letter-spacing:.3px}",
      ".wb-kdk-w{font-weight:700;font-size:16px}",
      // Overschrijven
      ".wb-over-lijst{display:flex;flex-direction:column;gap:12px}",
      ".wb-over-rij{display:flex;align-items:center;gap:12px;flex-wrap:wrap}",
      ".wb-over-w{font-size:17px;min-width:110px}",
      ".wb-over-lijnen{display:flex;gap:10px;flex:1}",
      // Woordraadsel
      ".wb-raadsel-rij{display:flex;align-items:baseline;gap:8px;margin:0 0 9px;break-inside:avoid;-webkit-column-break-inside:avoid}",
      ".wb-raadsel-om{flex:1;font-size:14.5px}",
      // Juiste zin
      ".wb-jz{margin:0 0 13px}",
      ".wb-jz-opt{display:flex;align-items:flex-start;gap:8px;font-size:14.5px;margin:5px 0}",
      // Keuzebord / tic-tac-toe
      ".wb-bord{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:520px}",
      ".wb-bord-vak{border:1.5px solid rgba(34,28,58,.2);border-radius:10px;min-height:64px;padding:8px 10px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-size:13.5px;gap:6px;background:#fff}",
      ".wb-ttt .wb-bord-vak{min-height:86px;justify-content:flex-start;padding-top:12px;gap:10px}",
      ".wb-ttt .wb-bord-vak b{font-size:16px}",
      ".wb-ttt-lijn{display:block;width:80%;border-bottom:2px dotted rgba(34,28,58,.35);height:1.4em}",
      // Voet
      ".wb-voet{display:flex;align-items:center;justify-content:space-between;padding:10px 24px 14px;font-size:11px;color:var(--wb-accent);font-weight:700;border-top:1px solid var(--wb-soft)}",
      ".wb-voet-mas{font-size:16px}",
      // Print: alleen het werkblad, exact A4
      "@media print{",
      "  html,body{background:#fff!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}",
      "  body *{visibility:hidden!important}",
      "  #wb-print,#wb-print *{visibility:visible!important}",
      "  #wb-print{position:absolute;left:0;top:0;width:100%}",
      "  .wb-noprint{display:none!important}",
      "  .wb-page{box-shadow:none;border:none;border-radius:0;max-width:100%;width:100%;margin:0}",
      "  .wb-band{padding:12px 18px}",
      "  .wb-body{padding:14px 20px 4px}",
      "  .wb-blok{margin-bottom:13px}",
      "  .wb-page-ant{page-break-before:always}",
      // Puzzel-/hokjesranden versterken voor de PDF: dunne (1px) en lichte (rgba .12)
      // randen worden bij het schalen naar A4 sub-pixel en vallen weg. Alleen in print
      // opaque + iets steviger maken; de schermweergave blijft ongewijzigd.
      "  .wb-wz td{border:1.2px solid rgba(34,28,58,.6)!important}",
      "  .wb-kruis{border-collapse:separate!important;border-spacing:0!important}",
      "  .wb-kruis td{border:1.4px solid var(--wb-ink)!important;box-sizing:border-box!important}",
      "  .wb-kruis td.leeg{border:none!important}",
      "  .wb-sudoku td{border:1.3px solid var(--wb-ink)!important}",
      "  .wb-sudoku td.rb{border-right:2.5px solid var(--wb-ink)!important}",
      "  .wb-sudoku td.bb{border-bottom:2.5px solid var(--wb-ink)!important}",
      "  .wb-kleur-grid td{border:1.3px solid var(--wb-ink)!important}",
      "  .wb-hok{border:1.2px solid rgba(34,28,58,.6)!important}",
      "  .wb-cat,.wb-wnw{border-color:rgba(34,28,58,.45)!important}",
      "  @page{size:A4;margin:9mm}",
      "}"
    ].join("\n");
    document.head.appendChild(s);
  }

  window.avinkaWerkblad = {
    THEMAS: THEMAS,
    themaKeys: themaKeys,
    kiesThema: kiesThema,
    normaliseer: normaliseer,
    render: render,
    // Eén los blok renderen (voor de preview-catalogus), in de huisstijl.
    blok: function (b, opts) {
      opts = opts || {};
      if (!stylesheetIngeladen) injecteerCss();
      normaliseer({ blokken: [b] });
      var th = thema(opts.thema || "fris");
      return '<div class="wb-page" style="' + themaStyle(th) + 'box-shadow:none;border:none;border-radius:0;margin:0;max-width:none;">' +
        '<div class="wb-body" style="padding:14px 16px 4px">' + renderBlok(b, opts.nr != null ? opts.nr : 1, !!opts.antwoorden) + "</div></div>";
    },
    platteTekst: platteTekst,
    // generators ook los bruikbaar
    genSommen: genSommen,
    genWoordzoeker: genWoordzoeker,
    genGetallenlijn: genGetallenlijn,
    genGetallenlijnReeks: genGetallenlijnReeks,
    genMuren: genMuren,
    genHuizen: genHuizen,
    genMaalroosters: genMaalroosters,
    getalNaarWoord: getalNaarWoord,
    tijdNaarWoord: tijdNaarWoord
  };
})();

/* ───────────────────────────────────────────────────────────────────────────
   Avinka — extra maskeringslaag: het klasnamen-vangnet.

   Bovenop de maskering die elke tool zélf al doet, legt dit bestand één
   gedeelde, platform-brede laag: het haalt de voornamen van de leerkracht
   (uit het dashboard, over al z'n klassen heen) en vervangt die in elke tekst
   vóór verzending naar de AI door codes (KN-001, KN-002, …). Ná het antwoord
   worden de codes lokaal weer teruggezet naar de echte naam.

   Waarom een aparte laag?
   - Vangnet voor namen die de tool zelf miste, bijv. een naam die per ongeluk
     met kleine letter is getypt ("rik" i.p.v. "Rik").
   - Eén bron (het dashboard) geldt overal, ook in tools die zelf geen klas
     inladen.

   Belangrijk:
   - HELE WOORDEN, HOOFDLETTER-ONGEVOELIG. Door woordgrenzen (\b) wordt "Sam"
     nooit uit "samen" geknipt en "Rik" niet uit "fabriek"; alleen losse hele
     woorden worden vervangen.
   - Eigen coderuimte (KN-###), losstaand van de codes van de tools (LL-/XG-),
     zodat de lagen elkaar niet in de weg zitten.
   - Eigen privacy-bewust: er gaat hierover niets de deur uit. De namen worden
     alleen client-side gebruikt om te maskeren; ze worden nooit verzonden.

   Gebruik in een tool:
     <script src="/avinka-masking.js"></script>
     // wacht tot de namen geladen zijn vóór het maskeren:
     await window.avinkaMask.ready;
     tekst = window.avinkaMask.apply(tekst);     // namen → codes
     ...
     resultaat = window.avinkaMask.restore(resultaat);  // codes → namen
   ─────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  var namen = []; // platte voornamenlijst uit het dashboard
  var maskMap = []; // [{ re, code }]  — naam → code
  var codeMap = []; // [{ re, real }]  — code → naam
  var normMap = []; // [{ re, real }]  — naam (elke schrijfwijze) → naam zoals in de klas

  function esc(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Hele-woord-regex, hoofdletter-ongevoelig. De woordgrens valt weg als de naam
  // begint/eindigt met een niet-letterteken (zelden bij voornamen), zodat de
  // match dan niet stilletjes faalt.
  function woordRe(s) {
    var startB = /^[A-Za-zÀ-ÿ0-9]/.test(s) ? "\\b" : "";
    var endB = /[A-Za-zÀ-ÿ0-9]$/.test(s) ? "\\b" : "";
    return new RegExp(startB + esc(s) + endB, "gi");
  }

  function bouw(lijst) {
    maskMap = [];
    codeMap = [];
    normMap = [];
    var seen = Object.create(null);
    var schoon = [];
    (lijst || []).forEach(function (n) {
      var naam = String(n == null ? "" : n).trim();
      if (naam.length < 2) return; // te kort → te veel valse treffers
      var key = naam.toLowerCase();
      if (seen[key]) return;
      seen[key] = true;
      schoon.push(naam);
    });
    // Langste namen eerst, zodat "Anne-Lot" vóór "Anne" wordt vervangen.
    schoon.sort(function (a, b) {
      return b.length - a.length;
    });
    schoon.forEach(function (naam, i) {
      var code = "KN-" + String(i + 1).padStart(3, "0");
      maskMap.push({ re: woordRe(naam), code: code });
      codeMap.push({ re: new RegExp(esc(code), "g"), real: naam });
      // Aparte regex per naam, los van de code, voor de schrijfwijze-correctie.
      normMap.push({ re: woordRe(naam), real: naam });
    });
  }

  // Eén keer ophalen bij het laden van de pagina. Faalt dit (geen sessie, fout),
  // dan blijft de lijst leeg en doet alleen de eigen maskering van de tool z'n
  // werk — de tool blijft dus gewoon werken.
  var ready = fetch("/api/masking-namen", { headers: { accept: "application/json" } })
    .then(function (r) {
      return r.ok ? r.json() : { namen: [] };
    })
    .then(function (j) {
      namen = (j && j.namen) || [];
      bouw(namen);
    })
    .catch(function () {
      namen = [];
      bouw([]);
    });

  window.avinkaMask = {
    ready: ready,
    namen: function () {
      return namen.slice();
    },
    // Vervang alle klasnamen (hele woorden, hoofdletter-ongevoelig) door codes.
    apply: function (text) {
      if (!text || !maskMap.length) return text;
      var out = text;
      maskMap.forEach(function (m) {
        out = out.replace(m.re, m.code);
      });
      return out;
    },
    // Zet de codes ná het AI-antwoord weer terug naar de echte naam, en zorg er
    // tot slot voor dat élke klasnaam in de tekst de schrijfwijze van je klas
    // krijgt. Zo komt een naam altijd met hoofdletter terug, ook als een andere
    // maskeerlaag hem (in kleine letters, zoals getypt) had teruggezet.
    restore: function (text) {
      if (!text || !codeMap.length) return text;
      var out = text;
      codeMap.forEach(function (m) {
        out = out.replace(m.re, m.real);
      });
      normMap.forEach(function (m) {
        out = out.replace(m.re, m.real);
      });
      return out;
    },
  };
})();

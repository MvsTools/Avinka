/* Avinka — Groep automatisch invullen vanuit het dashboard.

   De groep-keuze is een gewone <select class="field-select">, die door
   avinka-dropdown.js als nette huisstijl-dropdown wordt getoond (zoals rapporten).
   Geef die select óók de class "avinka-groep" en dit script vult bij het laden de
   juiste groep voor vanuit het dashboard: instellingen → standaardgroep, en anders
   de actieve klas. De leerkracht kan daarna gewoon een andere groep kiezen.

   Gebruik (in <head>): <script src="/avinka-groep.js"></script>
   en op het veld: <select class="field-select avinka-groep" ...>. */
(function () {
  "use strict";
  if (window.avinkaGroep) return;

  function vul(sels, bron) {
    var t = String(bron).toLowerCase(), doel = null;
    if (/1\s*[\/\-.en ]+\s*2|1\/2/.test(t)) doel = "1/2";
    else { var m = t.match(/[1-8]/); if (m) doel = "Groep " + m[0]; }
    if (!doel) return;
    var kaal = doel.replace(/^Groep\s*/, "");
    Array.prototype.forEach.call(sels, function (sel) {
      if (sel.value !== sel._avgInit) return; // al gewijzigd (door gebruiker of dropdown)
      var opties = Array.prototype.map.call(sel.options, function (o) { return o.value; });
      var kies = opties.indexOf(doel) >= 0 ? doel : (opties.indexOf(kaal) >= 0 ? kaal : null);
      if (kies) {
        sel.value = kies;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  function init() {
    var sels = document.querySelectorAll("select.avinka-groep");
    if (!sels.length) return;
    Array.prototype.forEach.call(sels, function (s) { s._avgInit = s.value; });
    fetch("/api/voorkeuren", { headers: { accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (v) {
        if (v && v.standaardgroep) { vul(sels, v.standaardgroep); return; }
        return fetch("/api/klas", { headers: { accept: "application/json" } })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (k) { if (k && k.naam) vul(sels, k.naam); });
      })
      .catch(function () {});
  }

  window.avinkaGroep = {};
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

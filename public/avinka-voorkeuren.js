/* Avinka — centrale schrijf-voorkeuren ophalen.

   Haalt één keer bij het laden de voorkeuren van de leerkracht op
   (/api/voorkeuren) zodat de tools hun velden automatisch kunnen voorvullen:
   toon, taalniveau, lengte en aanspreekvorm. De leerkracht kan het daarna in de
   tool zelf nog aanpassen — dit is alleen de slimme standaard.

   Gebruik in een tool:
     <script src="/avinka-voorkeuren.js"></script>
     window.avinkaVoorkeuren.ready.then(function (v) {
       // v.toon / v.taalniveau / v.lengte / v.aanspreekvorm
     });

   Faalt het ophalen (geen sessie, fout), dan komen de standaarden terug en werkt
   de tool gewoon door op z'n eigen defaults. */
(function () {
  "use strict";
  if (window.avinkaVoorkeuren) return;

  var STANDAARD = {
    toon: "warm",
    taalniveau: "standaard",
    lengte: "gemiddeld",
    aanspreekvorm: "je",
  };
  var data = Object.assign({}, STANDAARD);

  var ready = fetch("/api/voorkeuren", { headers: { accept: "application/json" } })
    .then(function (r) {
      return r.ok ? r.json() : STANDAARD;
    })
    .then(function (j) {
      data = Object.assign({}, STANDAARD, j || {});
      return data;
    })
    .catch(function () {
      data = Object.assign({}, STANDAARD);
      return data;
    });

  window.avinkaVoorkeuren = {
    ready: ready,
    get: function () {
      return Object.assign({}, data);
    },
  };
})();

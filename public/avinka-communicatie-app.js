/* Avinka — "open in Parro/Social Schools"-knop.

   Kopieert een bericht naar het klembord en opent daarna de webversie van de
   ouder-app die de leerkracht in zijn instellingen heeft gekozen (Parro of
   Social Schools). Er gaat verder niets naar die app toe — geen koppeling,
   geen API, alleen het klembord van de leerkracht zelf en een nieuw tabblad.
   Staat er in de instellingen niets gekozen, dan blijft de knop verborgen.

   Gebruik in een tool (na avinka-voorkeuren.js):
     <script src="/avinka-voorkeuren.js"></script>
     <script src="/avinka-communicatie-app.js"></script>
     avinkaCommApp.zetKnop(document.getElementById('btn-open-app'), function () {
       return mijnDefinitieveTekst();
     });
*/
(function () {
  "use strict";
  if (window.avinkaCommApp) return;

  var APPS = {
    parro: { naam: "Parro", url: "https://talk.parro.com" },
    social_schools: { naam: "Social Schools", url: "https://app.socialschools.eu" },
  };

  function kopieerNaarKlembord(tekst) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(tekst);
    }
    return new Promise(function (resolve) {
      var ta = document.createElement("textarea");
      ta.value = tekst;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) { /* geen klembord beschikbaar */ }
      document.body.removeChild(ta);
      resolve();
    });
  }

  // `haalTekst` wordt pas op het moment van klikken aangeroepen (niet vooraf),
  // zodat altijd de actuele/definitieve tekst wordt gekopieerd, ook als de
  // leerkracht na het laden nog iets heeft aangepast.
  function zetKnop(knop, haalTekst) {
    if (!knop || !window.avinkaVoorkeuren) return;
    window.avinkaVoorkeuren.ready.then(function (v) {
      var app = APPS[v.communicatie_app];
      if (!app) return; // niets ingesteld: knop blijft verborgen
      var normaalLabel = "↗ Open in " + app.naam;
      knop.textContent = normaalLabel;
      knop.style.display = "";
      knop.addEventListener("click", function () {
        var tekst = (haalTekst() || "").trim();
        if (!tekst) return;
        kopieerNaarKlembord(tekst).then(function () {
          knop.textContent = "✓ Gekopieerd — plak met Ctrl+V";
          setTimeout(function () { knop.textContent = normaalLabel; }, 2500);
          window.open(app.url, "_blank", "noopener");
        });
      });
    });
  }

  window.avinkaCommApp = { zetKnop: zetKnop };
})();

/* Avinka — "open in Parro/Social Schools/Isy/Konnect"-knop.

   Kopieert een bericht naar het klembord en opent daarna de webversie van de
   ouder-app die de leerkracht in zijn instellingen heeft gekozen. Er gaat
   verder niets naar die app toe — geen koppeling, geen API, alleen het
   klembord van de leerkracht zelf en een nieuw tabblad. Staat er in de
   instellingen niets (bruikbaars) gekozen, dan blijft de knop verborgen.

   Parro en Social Schools hebben één gedeeld inlogadres. Isy en Konnect
   werken per school/organisatie met een eigen instantie, maar altijd op
   hetzelfde vaste domein-staartje (".isy-school.nl" resp. ".ouderportaal.nl")
   — de leerkracht vult dus alleen het voorste stukje in (communicatie_url,
   bijv. "bottel").

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

  var NAMEN = {
    parro: "Parro",
    social_schools: "Social Schools",
    schoudercom: "SchouderCom",
    basisonline: "Ouderportaal (BasisOnline)",
    isy: "Isy",
    konnect: "Konnect",
  };
  var VASTE_URL = {
    parro: "https://talk.parro.com",
    social_schools: "https://app.socialschools.eu",
    basisonline: "https://ouders.basisonline.nl",
  };
  // Systemen met een eigen instantie per school delen wel altijd hetzelfde
  // vaste domein-staartje. De leerkracht vult dus alleen het voorste stukje
  // in (bijv. "bottel"); wij plakken het vaste deel erachter.
  var STAARTJE = {
    schoudercom: ".schoudercom.nl",
    isy: ".isy-school.nl",
    konnect: ".ouderportaal.nl",
  };

  // Bouwt de volledige URL uit het voorste stukje dat de leerkracht invulde.
  // Typt iemand toch het hele adres (met puntjes erin), dan zetten we er
  // alleen https:// voor in plaats van het staartje te verdubbelen.
  function bouwUrl(voorstuk, staartje) {
    voorstuk = (voorstuk || "").trim();
    if (!voorstuk) return "";
    voorstuk = voorstuk.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
    if (voorstuk.indexOf(".") !== -1) return "https://" + voorstuk;
    return "https://" + voorstuk + staartje;
  }

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
      var app = v.communicatie_app;
      var naam = NAMEN[app];
      var url = VASTE_URL[app] || (STAARTJE[app] && bouwUrl(v.communicatie_url, STAARTJE[app]));
      if (!naam || !url) return; // niets (bruikbaars) ingesteld: knop blijft verborgen

      var normaalLabel = "↗ Open in " + naam;
      knop.textContent = normaalLabel;
      knop.style.display = "";
      knop.addEventListener("click", function () {
        var tekst = (haalTekst() || "").trim();
        if (!tekst) return;
        kopieerNaarKlembord(tekst).then(function () {
          knop.textContent = "✓ Gekopieerd — plak met Ctrl+V";
          setTimeout(function () { knop.textContent = normaalLabel; }, 2500);
          window.open(url, "_blank", "noopener");
        });
      });
    });
  }

  window.avinkaCommApp = { zetKnop: zetKnop };
})();

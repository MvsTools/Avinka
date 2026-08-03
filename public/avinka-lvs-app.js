/* Avinka — "open in je LVS"-knop (ParnasSys / Esis).

   Kopieert een tekst naar het klembord en opent daarna de webversie van het
   leerlingvolgsysteem dat de leerkracht in zijn instellingen heeft gekozen,
   zodat hij 'm daar met Ctrl+V kan plakken. Er gaat verder niets automatisch
   naar het LVS toe — geen koppeling, geen API, alleen het klembord van de
   leerkracht zelf en een nieuw tabblad. Staat er in de instellingen niets
   gekozen (of bij Esis geen eigen webadres), dan blijft de knop verborgen.

   ParnasSys heeft één gedeeld inlogadres voor alle scholen. Esis werkt per
   school met een eigen instantie, maar altijd op hetzelfde vaste stuk
   ".rovictonline.nl" (bijv. esis97.rovictonline.nl) — de leerkracht hoeft dus
   alleen het voorste stukje in te vullen (lvs_url, bijv. "esis97").

   Gebruik in een tool (na avinka-voorkeuren.js):
     <script src="/avinka-voorkeuren.js"></script>
     <script src="/avinka-lvs-app.js"></script>
     avinkaLvsApp.zetKnop(document.getElementById('btn-open-lvs'), function () {
       return mijnDefinitieveTekst();
     });
*/
(function () {
  "use strict";
  if (window.avinkaLvsApp) return;

  var VASTE_URL = {
    parnassys: "https://start.parnassys.net",
  };
  // Systemen met een eigen instantie per school delen wel altijd hetzelfde
  // vaste domein-staartje. De leerkracht vult dus alleen het voorste stukje
  // in (bijv. "esis97"); wij plakken het vaste deel erachter.
  var STAARTJE = {
    esis: ".rovictonline.nl",
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
  // zodat altijd de actuele/definitieve tekst wordt gekopieerd.
  function zetKnop(knop, haalTekst) {
    if (!knop || !window.avinkaVoorkeuren) return;
    window.avinkaVoorkeuren.ready.then(function (v) {
      var systeem = v.lvs_systeem;
      var naam = systeem === "parnassys" ? "ParnasSys" : systeem === "esis" ? "Esis" : "";
      var url = VASTE_URL[systeem] || (STAARTJE[systeem] && bouwUrl(v.lvs_url, STAARTJE[systeem]));
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

  window.avinkaLvsApp = { zetKnop: zetKnop };
})();

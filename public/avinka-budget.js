/* ═══════════════════════════════════════════════════════════════════════
   AVINKA — AI-credits (gedeelde bouwsteen)

   Twee taken:
   1. VOORAF controleren of er genoeg credits over zijn voor een hele run,
      zodat niemand halverwege een analyse stilvalt.
   2. Een 402-antwoord van /api/claude herkennen als "credits op" in plaats
      van als storing, zodat de tool geen "er ging iets mis" toont.

   Gebruik in een tool:
     <script src="/avinka-dialog.js"></script>
     <script src="/avinka-budget.js"></script>

     if (!(await avinkaBudget.genoegVoor('toetsanalyse'))) return;   // vóór de run
     ...
     if (avinkaBudget.isLimiet(resp)) throw new Error(await avinkaBudget.melding(resp));

   Faalt de controle (geen netwerk, fout in de route), dan laten we ALTIJD
   door. Een gebruiker mag nooit stilvallen door een hapering in onze eigen
   boekhouding.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var stand = null; // laatst opgehaalde stand
  var bezig = null; // lopende fetch, zodat we niet dubbel ophalen

  function haalOp(vers) {
    if (!vers && bezig) return bezig;
    bezig = fetch("/api/ai-budget", { credentials: "same-origin" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (d) {
        stand = d;
        bezig = null;
        return d;
      })
      .catch(function () {
        bezig = null;
        return null; // onbekend → nooit blokkeren
      });
    return bezig;
  }

  function popup(tekst, titel) {
    if (typeof window.avinkaAlert === "function") {
      return window.avinkaAlert(tekst, { titel: titel || "Je credits zijn op" });
    }
    window.alert(tekst);
    return Promise.resolve();
  }

  function tekstVoorTekort(tool, nodig, resterend) {
    var wat = tool === "toetsanalyse" ? "een volledige analyse" : "een volledige run";
    return (
      "Je hebt niet genoeg AI-credits meer voor " +
      wat +
      ". Je hebt er nog " +
      resterend +
      " over en hiervoor zijn er ongeveer " +
      nodig +
      " nodig.\n\n" +
      "Op de 1e van de nieuwe maand staat je tegoed er weer op. " +
      "Heb je eerder meer nodig, of klopt dit niet? Neem even contact op, dan kijken we mee."
    );
  }

  var api = {
    // De laatst bekende stand (of null als die nog niet is opgehaald).
    huidig: function () {
      return stand;
    },

    // Stand ophalen. vers=true forceert een nieuwe aanvraag.
    status: function (vers) {
      return haalOp(vers);
    },

    // Genoeg credits voor een hele run van deze tool? Toont zelf een nette
    // popup als het niet zo is. Geeft true/false terug.
    genoegVoor: function (tool, nodigOverride) {
      return haalOp(true).then(function (d) {
        if (!d || d.onbeperkt) return true; // onbekend of admin → doorlaten
        var nodig =
          typeof nodigOverride === "number"
            ? nodigOverride
            : (d.schatting && d.schatting[tool]) || 3;
        if (d.resterend >= nodig) return true;
        return popup(tekstVoorTekort(tool, nodig, d.resterend)).then(function () {
          return false;
        });
      });
    },

    // Is dit antwoord van /api/claude een "credits op"-melding?
    isLimiet: function (resp) {
      return !!resp && resp.status === 402;
    },

    // De tekst uit zo'n antwoord halen (met een nette terugval).
    melding: function (resp) {
      return resp
        .json()
        .then(function (e) {
          return (
            (e && e.error && e.error.message) ||
            "Je AI-credits voor deze maand zijn op."
          );
        })
        .catch(function () {
          return "Je AI-credits voor deze maand zijn op.";
        });
    },

    // Popup tonen bij een 402 midden in een run.
    toonLimiet: function (tekst) {
      return popup(tekst);
    },
  };

  window.avinkaBudget = api;
  // Alvast op de achtergrond ophalen, zodat de controle later snel is.
  haalOp(false);
})();

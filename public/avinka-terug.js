// De terug-knop van een tool wijst terug naar waar je vandaan kwam.
//
// Een tool is geen eindstation. Je opent Oudercontact omdat in Mijn schooljaar
// stond dat de oudergesprekken eraan komen — dan wil je daarna ook weer daar
// terug zijn, niet op het dashboard. Zonder dit stond er altijd "Terug naar
// dashboard", ook voor wie daar nooit geweest is.
//
// GEBRUIK: zet `?van=schooljaar` (of start / taken) in de link naar de tool en
// neem dit script op in de tool, vóór de andere scripts. Geen `van=` of een
// onbekende waarde: er verandert niets, dan blijft "Terug naar dashboard" staan.
//
// ⚠️ Tools die vanuit Bestanden geopend kunnen worden (lesontwerp, werkbladen,
// draaiboek, plattegrond) zetten hun eigen terug-link zodra ze een bestand
// laden. Die twee bijten elkaar niet: dat gebeurt alleen bij `?bestand=`, en dan
// staat er geen `van=` in dezelfde link.
(function () {
  var PLEK = {
    schooljaar: { pad: "/dashboard/schooljaar", naam: "Mijn schooljaar" },
    start: { pad: "/dashboard", naam: "Start" },
    taken: { pad: "/dashboard/taken", naam: "je takenlijst" },
  };

  function zet() {
    var van = "";
    try {
      van = new URLSearchParams(location.search).get("van") || "";
    } catch {
      return;
    }
    var plek = PLEK[van];
    if (!plek) return;
    var links = document.querySelectorAll("a.terug-menu");
    for (var i = 0; i < links.length; i++) {
      links[i].setAttribute("href", plek.pad);
      links[i].textContent = "← Terug naar " + plek.naam;
    }
  }

  if (document.readyState !== "loading") zet();
  else document.addEventListener("DOMContentLoaded", zet);
})();

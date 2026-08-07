/* Avinka — een scherm heel even vasthouden.

   Sommige tools moeten eerst bij de server navragen wie je bent voordat ze
   weten wat je te zien hoort te krijgen: welk toetssysteem je gebruikt, of je
   bij deze groep alleen meekijkt. Zolang dat antwoord onderweg is, staat het
   standaardscherm er gewoon — en dan zie je het een seconde staan voordat het
   wegspringt. Dat is verwarrend, en bij een meekijker ronduit verkeerd: die
   ziet dan even instellingen die hij niet mag gebruiken.

   Deze helper houdt zo'n scherm kort vast en laat het los zodra je het weet.

   Gebruik:
     var wacht = avinkaSchermwacht.houdVast(document.getElementById('scherm'), 700);
     iets().then(function (v) {
       if (v.andersScherm) { wacht.laatStaan(); toonIetsAnders(); }
       else wacht.toon();
     });

   TWEE VANGNETTEN, want een scherm dat NOOIT verschijnt is veel erger dan een
   scherm dat te vroeg verschijnt:
   1. het verbergen gebeurt vanuit JavaScript, dus zonder JS staat alles er
      gewoon zoals het in de HTML staat;
   2. na `ms` milliseconden komt het scherm sowieso tevoorschijn, ook als de
      server helemaal niet antwoordt.
*/
(function () {
  "use strict";
  if (window.avinkaSchermwacht) return;

  function houdVast(el, ms) {
    if (!el) return { toon: function () {}, laatStaan: function () {} };

    var losgelaten = false;
    el.style.display = "none";

    var timer = setTimeout(toon, typeof ms === "number" ? ms : 700);

    function toon() {
      if (losgelaten) return;
      losgelaten = true;
      clearTimeout(timer);
      // Altijd terug naar "geen eigen stijl": het element wordt zelf al vanaf
      // het moment van bestaan verborgen (niet pas hierna), dus wat we hier
      // ooit "eerder" noemden was altijd al "none" — dat teruggeven hield het
      // scherm juist voorgoed verborgen.
      el.style.display = "";
    }

    /** We hebben besloten iets anders te tonen; dit scherm hoeft niet meer. */
    function laatStaan() {
      losgelaten = true;
      clearTimeout(timer);
    }

    return { toon: toon, laatStaan: laatStaan };
  }

  window.avinkaSchermwacht = { houdVast: houdVast };
})();

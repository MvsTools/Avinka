/*
   Avinka — waarschuwing bij verlaten met onbewaard werk.

   Sommige tools bewaren niets op de server (Toetsanalyse, Oudergesprekken, ...).
   Klik je daar midden in een sessie op "Terug naar dashboard" (of ververs/sluit
   je het tabblad), dan ben je je werk kwijt. Deze bouwsteen vangt dat af:

     1) Klikken op een link naar /dashboard → nette bevestiging (avinkaBevestig).
     2) Tab sluiten / verversen / terug-knop → het kale browser-vangnet.

   Beide vuren ALLEEN als er echt onbewaard werk is. Dat bepalen we zo:
     - de gebruiker heeft zelf iets getypt (input in een tekstveld), OF
     - de tool zegt van wel via window.avinkaHeeftOnbewaardWerk() (optioneel;
       bijvoorbeeld: er is al een analyse/tekst gegenereerd).

   Een tool hoeft dus alleen dit script te includen. Wil je het preciezer, geef
   dan window.avinkaHeeftOnbewaardWerk = function(){ return <bool> }.
*/
(function () {
  var getypt = false;        // heeft de gebruiker zelf iets ingevoerd?
  var aanHetVerlaten = false; // bevestigd vertrek: vangnet niet nóg een keer tonen

  // Echte invoer maakt de pagina "vuil". Programmatisch gezette waarden (voorvullen
  // vanuit voorkeuren/klas) vuren geen 'input'-event, dus die tellen niet mee.
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t && t.matches && t.matches('textarea, input, [contenteditable]')) getypt = true;
  }, true);

  function heeftWerk() {
    if (aanHetVerlaten) return false;
    if (getypt) return true;
    if (typeof window.avinkaHeeftOnbewaardWerk === 'function') {
      try { return !!window.avinkaHeeftOnbewaardWerk(); } catch (e) { return false; }
    }
    return false;
  }

  // Naar buiten toe: tools kunnen na een "alles wissen"/opslaan de vlag resetten.
  window.avinkaVerlaten = {
    schoon: function () { getypt = false; },
    heeftWerk: heeftWerk
  };

  // Klik op een dashboard-link onderscheppen (ook als je op het logo/afbeelding erin klikt).
  document.addEventListener('click', function (e) {
    if (!e.target || !e.target.closest) return;
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!/^\/dashboard(\?|#|$)/.test(href)) return;
    if (!heeftWerk()) return;

    e.preventDefault();
    var vraag = 'Je werk in deze tool wordt niet automatisch bewaard. Ga je nu terug naar het dashboard, dan raak je kwijt wat je hier hebt gemaakt.';
    var opties = { titel: 'Terug naar dashboard?', bevestig: 'Ja, terug', annuleer: 'Blijf hier', gevaar: true };
    function ga() { aanHetVerlaten = true; window.location.href = href; }
    if (window.avinkaBevestig) {
      window.avinkaBevestig(vraag, opties).then(function (ok) { if (ok) ga(); });
    } else if (window.confirm(vraag)) {
      ga();
    }
  }, true);

  // Vangnet voor tab sluiten / verversen / browser-terugknop.
  window.addEventListener('beforeunload', function (e) {
    if (heeftWerk()) { e.preventDefault(); e.returnValue = ''; }
  });
})();

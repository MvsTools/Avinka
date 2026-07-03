/* Avinka datumkiezer — de mooie agenda uit de takenlijst, maar als losse
   vanilla-JS component voor de tools. Vervangt elke <input type="date">
   automatisch door een nette knop + agenda-popover (snelkeuze + maandkalender).

   - De originele <input> blijft bestaan als verborgen waardehouder (zelfde id en
     value), zodat alle bestaande code (.value uitlezen, oninput-handlers) gewoon
     blijft werken. Bij een keuze vuren we 'input' + 'change' af.
   - GEEN "wekelijks herhalen" — dat hoort alleen in de takenlijst.
   - Nieuwe datumvelden (dynamisch gerenderde agenda-kopjes) worden via een
     MutationObserver automatisch ook omgezet. avinkaDatumRefresh() ververst de
     labels na een programmatische waardewijziging (bv. een standaarddatum). */
(function () {
  "use strict";
  if (window.__avinkaDatum) return;
  window.__avinkaDatum = true;

  // ── Hulpjes ──────────────────────────────────────────────────────────────
  function isoVan(d) {
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }
  function parse(isoStr) {
    return isoStr ? new Date(isoStr + "T00:00:00") : null;
  }
  function labelVan(isoStr) {
    var d = parse(isoStr);
    if (!d) return "";
    return d.toLocaleDateString("nl-NL", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  // Compacte "van t/m tot"-tekst: de maand vervalt vooraan als beide in dezelfde
  // maand vallen, en het jaar staat alleen achteraan. Bijv. "6 t/m 10 jul 2026".
  function labelReeksVan(vanIso, totIso) {
    var v = parse(vanIso), t = parse(totIso);
    if (!v || !t) return labelVan(vanIso);
    var zelfdeMaand = v.getFullYear() === t.getFullYear() && v.getMonth() === t.getMonth();
    var vanTxt = v.toLocaleDateString("nl-NL", zelfdeMaand ? { day: "numeric" } : { day: "numeric", month: "short" });
    var totTxt = t.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
    return vanTxt + " t/m " + totTxt;
  }

  // ── Stijl (één keer; gebruikt de CSS-variabelen van de tool) ──────────────
  function zorgStijl() {
    if (document.getElementById("avinka-dp-stijl")) return;
    var s = document.createElement("style");
    s.id = "avinka-dp-stijl";
    s.textContent =
      ".avinka-dp{position:relative;display:inline-block;}" +
      ".avinka-dp-trig{display:inline-flex;align-items:center;gap:8px;border:1.5px solid var(--line-strong,#e4ded2);background:var(--cream,#faf7f0);border-radius:11px;padding:10px 13px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:14px;font-weight:600;color:var(--ink,#2a2540);cursor:pointer;transition:border-color .2s;line-height:1.2;}" +
      ".avinka-dp-trig:hover{border-color:var(--accent2,#2f9e6e);}" +
      ".avinka-dp-trig.leeg{color:var(--muted,#8a8398);font-weight:500;}" +
      ".avinka-dp-trig svg{width:16px;height:16px;flex-shrink:0;opacity:.8;}" +
      ".avinka-dp-pop{position:fixed;z-index:100000;width:268px;background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:16px;box-shadow:0 18px 44px rgba(26,22,46,.22);padding:10px;text-align:left;font-family:'Plus Jakarta Sans',system-ui,sans-serif;}" +
      ".avinka-dp-snel{display:flex;gap:6px;}" +
      ".avinka-dp-snel button{flex:1;border:none;border-radius:9px;background:var(--cream,#f3efe6);padding:7px 4px;font:inherit;font-size:12px;font-weight:600;color:var(--ink,#2a2540);cursor:pointer;transition:.15s;}" +
      ".avinka-dp-snel button:hover{background:var(--accent2,#2f9e6e);color:#fff;}" +
      ".avinka-dp-kop{display:flex;align-items:center;justify-content:space-between;margin-top:12px;}" +
      ".avinka-dp-kop b{font-size:14px;font-weight:700;color:var(--ink,#2a2540);text-transform:capitalize;}" +
      ".avinka-dp-nav{border:none;background:none;cursor:pointer;border-radius:8px;padding:3px 8px;font-size:17px;color:var(--muted,#8a8398);transition:.15s;}" +
      ".avinka-dp-nav:hover{background:var(--cream,#f3efe6);color:var(--ink,#2a2540);}" +
      ".avinka-dp-wk{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;font-size:11px;font-weight:600;color:var(--muted,#a8a2b4);margin-top:8px;}" +
      ".avinka-dp-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-top:2px;user-select:none;}" +
      ".avinka-dp-grid button{height:30px;border:none;background:none;border-radius:9px;font:inherit;font-size:13px;color:var(--ink,#2a2540);cursor:pointer;transition:.12s;}" +
      ".avinka-dp-grid button:hover{background:var(--cream,#f3efe6);}" +
      ".avinka-dp-grid button.vandaag{background:rgba(47,158,110,.14);color:var(--accent2,#2f9e6e);font-weight:700;}" +
      ".avinka-dp-grid button.gekozen{background:var(--accent2,#2f9e6e);color:#fff;font-weight:700;}" +
      ".avinka-dp-grid button.in-reeks{background:rgba(47,158,110,.16);color:var(--accent2,#2f9e6e);border-radius:0;font-weight:600;}" +
      ".avinka-dp-hint{font-size:11px;color:var(--muted,#8a8398);text-align:center;margin-top:9px;}" +
      ".avinka-dp-voet{display:flex;align-items:center;justify-content:space-between;margin-top:10px;}" +
      ".avinka-dp-wis{border:none;background:none;cursor:pointer;font:inherit;font-size:12px;font-weight:600;color:var(--muted,#8a8398);transition:.15s;}" +
      ".avinka-dp-wis:hover{color:#e11d48;}" +
      ".avinka-dp-klaar{border:none;border-radius:9px;background:var(--accent2,#2f9e6e);color:#fff;cursor:pointer;font:inherit;font-size:12px;font-weight:700;padding:7px 16px;}";
    document.head.appendChild(s);
  }

  var KAL_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" stroke-linecap="round"/></svg>';

  // ── Eén datumveld omzetten ────────────────────────────────────────────────
  function upgrade(input) {
    if (!input || input.getAttribute("data-avinka-dp")) return;
    input.setAttribute("data-avinka-dp", "1");
    zorgStijl();
    input.style.display = "none";

    // Reeks-selectie (van…t/m…) alleen op velden die er expliciet om vragen,
    // via data-avinka-reeks. Losse datumvelden blijven één datum.
    var reeks = input.hasAttribute("data-avinka-reeks");

    var wrap = document.createElement("span");
    wrap.className = "avinka-dp";
    var trig = document.createElement("button");
    trig.type = "button";
    trig.className = "avinka-dp-trig";
    wrap.appendChild(trig);
    input.parentNode.insertBefore(wrap, input.nextSibling);

    function syncLabel() {
      var v = input.value;
      var tot = input.getAttribute("data-tot");
      if (v) {
        trig.classList.remove("leeg");
        var tekst = (reeks && tot && tot > v) ? labelReeksVan(v, tot) : labelVan(v);
        trig.innerHTML = KAL_ICON + "<span>" + tekst + "</span>";
      } else {
        trig.classList.add("leeg");
        trig.innerHTML = KAL_ICON + "<span>Kies datum</span>";
      }
    }
    input._avinkaSync = syncLabel;
    syncLabel();

    var pop = null;
    function sluit() {
      if (pop) { pop.remove(); pop = null; }
      document.removeEventListener("mousedown", buiten);
      window.removeEventListener("scroll", herplaats, true);
      window.removeEventListener("resize", herplaats);
    }
    function buiten(e) {
      // De popover hangt in de <body>, dus die apart uitsluiten (anders sluit
      // een klik ín de agenda hem meteen weer).
      if (pop && !wrap.contains(e.target) && !pop.contains(e.target)) sluit();
    }
    function herplaats() { if (pop) plaatsPop(); }
    // Zet de agenda vlak bij de knop, maar altijd binnen het scherm geklemd:
    // rechteruitlijning waar het kan, anders schuift hij mee zodat hij nooit
    // buiten beeld valt of half wordt afgeknipt.
    function plaatsPop() {
      var r = wrap.getBoundingClientRect();
      var vw = document.documentElement.clientWidth;
      var vh = window.innerHeight;
      var w = 268;
      var left = r.right - w;
      if (left < 8) left = 8;
      if (left + w > vw - 8) left = vw - 8 - w;
      var h = pop.offsetHeight || 360;
      var top = (vh - r.bottom < h + 12 && r.top > h + 12)
        ? r.top - h - 8
        : r.bottom + 8;
      pop.style.left = left + "px";
      pop.style.top = top + "px";
    }
    function kies(v) {
      input.value = v;
      input.removeAttribute("data-tot"); // enkele datum → geen reeks meer
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      syncLabel();
    }
    function kiesReeks(van, tot) {
      input.value = van;
      input.setAttribute("data-tot", tot);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      syncLabel();
    }

    function open() {
      pop = document.createElement("div");
      pop.className = "avinka-dp-pop";
      // In de <body> hangen (portal) i.p.v. in het veld: zo kan geen enkele
      // kaart/stacking-context er half overheen tekenen.
      document.body.appendChild(pop);

      var basis = parse(input.value) || new Date();
      var maand = new Date(basis.getFullYear(), basis.getMonth(), 1);

      // Reeks-slepen: van indrukken tot loslaten kleuren we het bereik live in.
      var sleepBezig = false, sleepVan = null, sleepTot = null;
      function markeer(a, b) {
        var lo = a, hi = b;
        if (lo > hi) { var t = lo; lo = hi; hi = t; }
        pop.querySelectorAll(".avinka-dp-grid button").forEach(function (btn) {
          var di = btn.getAttribute("data-iso");
          btn.classList.toggle("gekozen", di === lo || di === hi);
          btn.classList.toggle("in-reeks", di > lo && di < hi);
        });
      }
      function sleepEinde() {
        if (!sleepBezig) return;
        sleepBezig = false;
        var lo = sleepVan, hi = sleepTot;
        if (lo > hi) { var t = lo; lo = hi; hi = t; }
        if (lo === hi) kies(lo); else kiesReeks(lo, hi);
        sluit();
      }

      function quick(dagen) {
        var d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + dagen);
        kies(isoVan(d));
        sluit(); // een snelkeuze is meteen raak → agenda dicht
      }

      function teken() {
        var jaar = maand.getFullYear();
        var mnd = maand.getMonth();
        var start = (new Date(jaar, mnd, 1).getDay() + 6) % 7; // maandag = 0
        var aantal = new Date(jaar, mnd + 1, 0).getDate();
        var vandaagIso = isoVan(new Date());

        // Bestaande selectie (evt. een reeks) alvast inkleuren.
        var van = input.value;
        var tot = reeks ? input.getAttribute("data-tot") : null;
        var lo = van, hi = tot;
        if (lo && hi && lo > hi) { var tt = lo; lo = hi; hi = tt; }

        var dagen = "";
        for (var i = 0; i < start; i++) dagen += "<span></span>";
        for (var d = 1; d <= aantal; d++) {
          var di = isoVan(new Date(jaar, mnd, d));
          var cls;
          if (di === van || (tot && di === tot)) cls = "gekozen";
          else if (lo && hi && di > lo && di < hi) cls = "in-reeks";
          else if (di === vandaagIso) cls = "vandaag";
          else cls = "";
          var kl = cls ? ' class="' + cls + '"' : "";
          dagen += '<button type="button" data-iso="' + di + '"' + kl + ">" + d + "</button>";
        }
        var maandTitel = maand.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });
        pop.innerHTML =
          '<div class="avinka-dp-snel">' +
            '<button type="button" data-q="0">Vandaag</button>' +
            '<button type="button" data-q="1">Morgen</button>' +
            '<button type="button" data-q="7">Volgende week</button>' +
          "</div>" +
          '<div class="avinka-dp-kop">' +
            '<button type="button" class="avinka-dp-nav" data-nav="-1" aria-label="Vorige maand">‹</button>' +
            "<b>" + maandTitel + "</b>" +
            '<button type="button" class="avinka-dp-nav" data-nav="1" aria-label="Volgende maand">›</button>' +
          "</div>" +
          '<div class="avinka-dp-wk"><span>ma</span><span>di</span><span>wo</span><span>do</span><span>vr</span><span>za</span><span>zo</span></div>' +
          '<div class="avinka-dp-grid">' + dagen + "</div>" +
          (reeks ? '<div class="avinka-dp-hint">Sleep over meerdere dagen voor een reeks</div>' : "") +
          '<div class="avinka-dp-voet">' +
            (input.value ? '<button type="button" class="avinka-dp-wis">Datum wissen</button>' : "<span></span>") +
            '<button type="button" class="avinka-dp-klaar">Klaar</button>' +
          "</div>";

        pop.querySelectorAll(".avinka-dp-snel button").forEach(function (b) {
          b.onclick = function () { quick(parseInt(b.getAttribute("data-q"), 10)); };
        });
        pop.querySelectorAll("[data-nav]").forEach(function (b) {
          b.onclick = function () {
            maand = new Date(jaar, mnd + parseInt(b.getAttribute("data-nav"), 10), 1);
            teken();
          };
        });
        pop.querySelectorAll(".avinka-dp-grid button").forEach(function (b) {
          if (reeks) {
            // Indrukken = start, slepen = einde, loslaten = vastleggen. Eén dag
            // aanklikken (indrukken + loslaten zonder slepen) blijft één datum.
            b.addEventListener("mousedown", function (e) {
              e.preventDefault();
              sleepBezig = true;
              sleepVan = sleepTot = b.getAttribute("data-iso");
              markeer(sleepVan, sleepTot);
              document.addEventListener("mouseup", sleepEinde, { once: true });
            });
            b.addEventListener("mouseenter", function () {
              if (sleepBezig) { sleepTot = b.getAttribute("data-iso"); markeer(sleepVan, sleepTot); }
            });
          } else {
            b.onclick = function () { kies(b.getAttribute("data-iso")); sluit(); };
          }
        });
        var wis = pop.querySelector(".avinka-dp-wis");
        if (wis) wis.onclick = function () { kies(""); teken(); };
        pop.querySelector(".avinka-dp-klaar").onclick = sluit;
        plaatsPop();
      }

      teken();
      document.addEventListener("mousedown", buiten);
      window.addEventListener("scroll", herplaats, true);
      window.addEventListener("resize", herplaats);
    }

    trig.addEventListener("click", function (e) {
      e.preventDefault();
      if (pop) sluit();
      else open();
    });
  }

  // ── Alles op de pagina omzetten + nieuwe velden volgen ────────────────────
  function sweep(root) {
    (root || document)
      .querySelectorAll('input[type="date"]:not([data-avinka-dp])')
      .forEach(upgrade);
  }
  // Labels opnieuw uit de (mogelijk programmatisch gewijzigde) waarde tekenen.
  window.avinkaDatumRefresh = function () {
    document.querySelectorAll('input[type="date"][data-avinka-dp]').forEach(function (i) {
      if (typeof i._avinkaSync === "function") i._avinkaSync();
    });
  };

  var obs = new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      var added = muts[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        var n = added[j];
        if (n.nodeType !== 1) continue;
        if (n.matches && n.matches('input[type="date"]:not([data-avinka-dp])')) upgrade(n);
        if (n.querySelectorAll) sweep(n);
      }
    }
  });
  // Bestaande velden omzetten en pas dáárna nieuwe velden volgen (geen overhead
  // tijdens het laden van de pagina; dynamische agenda-velden komen later).
  function start() {
    sweep();
    obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }
  if (document.readyState !== "loading") start();
  else document.addEventListener("DOMContentLoaded", start);
})();

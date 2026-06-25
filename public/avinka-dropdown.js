/* Avinka — gedeelde huisstijl-dropdown.

   Een native <select> laat het BESTURINGSSYSTEEM het open optielijstje tekenen,
   in het OS-lettertype — dus elke tool/OS ziet er anders uit. Deze component zet
   elke <select class="field-select"> om naar een dropdown in de huisstijl, zodat
   het open lijstje overal exact hetzelfde is (Plus Jakarta Sans, afgerond, groene
   hover) — gelijk aan de zelfgebouwde dropdown van rapporten.

   De echte <select> blijft bestaan en bepaalt nog steeds de waarde: wij tekenen
   er een overlay overheen en spiegelen elke keuze terug naar de <select> met een
   'change'-event, zodat bestaande onchange-logica gewoon blijft werken.

   Gebruik in een tool (in <head>):
     <link rel="stylesheet" href="/avinka-dropdown.css" />
     <script src="/avinka-dropdown.js"></script>
   Dynamisch toegevoegde selects worden automatisch opgepakt; je kunt ook
   handmatig window.avinkaDropdown.refresh(rootEl) aanroepen. */
(function () {
  "use strict";
  if (window.avinkaDropdown) return;

  function bouw(sel) {
    if (sel.dataset.avddDone) return;
    sel.dataset.avddDone = "1";

    var wrap = document.createElement("div");
    wrap.className = "avdd";

    var btn = document.createElement("button");
    btn.type = "button";
    // erft de veld-look (rand/radius/focus/filled) van de tool zelf
    btn.className = "avdd-btn field-select";
    btn.innerHTML = '<span class="avdd-lb"></span><span class="avdd-cv" aria-hidden="true"></span>';

    var pop = document.createElement("div");
    pop.className = "avdd-pop";

    function vulOpties() {
      pop.innerHTML = "";
      Array.prototype.forEach.call(sel.options, function (o) {
        var opt = document.createElement("div");
        opt.className = "avdd-opt";
        opt.textContent = o.textContent;
        opt.dataset.value = o.value;
        if (o.disabled) opt.classList.add("avdd-dis");
        opt.addEventListener("click", function (e) {
          e.stopPropagation();
          if (o.disabled) return;
          if (sel.value !== o.value) {
            sel.value = o.value;
            sel.dispatchEvent(new Event("change", { bubbles: true }));
          }
          sync();
          sluit();
        });
        pop.appendChild(opt);
      });
    }

    function sync() {
      var o = sel.options[sel.selectedIndex];
      btn.querySelector(".avdd-lb").textContent = o ? o.textContent : "";
      btn.classList.toggle("filled", !!sel.value);
      Array.prototype.forEach.call(pop.children, function (c) {
        c.classList.toggle("sel", c.dataset.value === sel.value);
      });
    }

    function open() { vulOpties(); sync(); wrap.classList.add("open"); }
    function sluit() { wrap.classList.remove("open"); }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      wrap.classList.contains("open") ? sluit() : open();
    });
    // externe waardewijziging (bv. auto-invullen vanuit dashboard) → label bijwerken
    sel.addEventListener("change", sync);

    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(btn);
    wrap.appendChild(pop);
    wrap.appendChild(sel); // select blijft in de DOM (verborgen via CSS)

    vulOpties();
    sync();
  }

  function bouwAlle(root) {
    (root || document).querySelectorAll("select.field-select").forEach(bouw);
  }

  function init() {
    bouwAlle(document);

    document.addEventListener("click", function () {
      document.querySelectorAll(".avdd.open").forEach(function (w) { w.classList.remove("open"); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        document.querySelectorAll(".avdd.open").forEach(function (w) { w.classList.remove("open"); });
      }
    });

    if (window.MutationObserver) {
      new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          Array.prototype.forEach.call(m.addedNodes, function (n) {
            if (n.nodeType !== 1) return;
            if (n.matches && n.matches("select.field-select")) bouw(n);
            if (n.querySelectorAll) bouwAlle(n);
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    }
  }

  window.avinkaDropdown = { refresh: bouwAlle };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

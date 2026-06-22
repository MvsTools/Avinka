/* ───────────────────────────────────────────────────────────────────────────
   Wijs — privacy-pop-up voor risicovolle tools.

   Toont bij het openen van een tool/module een korte waarschuwing met wat
   wél en niet handig is. Onderin: een vinkje "Niet meer weergeven" + knop
   "Sluiten".
   - Sluiten (zonder vinkje)  → de pop-up komt de volgende keer gewoon terug.
   - Vinkje "Niet meer weergeven" aan + Sluiten → blijft weg op dit apparaat;
     er blijft alleen een klein klikbaar "🔒 Privacy"-tagje staan dat de
     pop-up weer opent.

   Gebruik:
     wijsPrivacy.gate({ key:'rapportwijs', intro:'…', wel:[…], niet:[…] });
     wijsPrivacy.leave('rapportwijs');   // verberg het tagje (bij verlaten module)

   Onthouden gebeurt per apparaat in localStorage (key: wijs_privacy_<key>).
   Bewust geen serverkoppeling — niets hierover verlaat het apparaat.
   ─────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  function injecteerStijl() {
    if (document.getElementById("wijspg-style")) return;
    var s = document.createElement("style");
    s.id = "wijspg-style";
    s.textContent = [
      ".wijspg-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(20,18,30,.45);backdrop-filter:blur(3px);padding:16px;}",
      ".wijspg-card{width:100%;max-width:470px;background:#fff;border-radius:24px;box-shadow:0 24px 60px rgba(0,0,0,.28);padding:28px;font-family:inherit;color:#1f2430;box-sizing:border-box;}",
      ".wijspg-ic{width:52px;height:52px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:26px;background:#e7f4ed;}",
      ".wijspg-h{margin:14px 0 0;font-size:20px;font-weight:800;line-height:1.25;}",
      ".wijspg-p{margin:8px 0 0;font-size:14px;line-height:1.55;color:#4b5063;}",
      ".wijspg-list{margin:16px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:9px;}",
      ".wijspg-li{display:flex;gap:10px;font-size:14px;line-height:1.45;align-items:flex-start;}",
      ".wijspg-ok{color:#059669;font-weight:800;flex:none;}",
      ".wijspg-no{color:#e11d48;font-weight:800;flex:none;}",
      ".wijspg-foot{margin-top:22px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;}",
      ".wijspg-check{display:flex;align-items:center;gap:8px;font-size:13px;color:#4b5063;cursor:pointer;user-select:none;}",
      ".wijspg-check input{width:17px;height:17px;cursor:pointer;}",
      ".wijspg-btn{border:0;background:#2f9e6e;color:#fff;font-weight:800;font-size:14px;border-radius:12px;padding:11px 24px;cursor:pointer;}",
      ".wijspg-btn:hover{background:#25855a;}",
      ".wijspg-tag{position:fixed;left:14px;bottom:14px;z-index:99998;display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid rgba(0,0,0,.08);box-shadow:0 4px 14px rgba(0,0,0,.10);color:#2f9e6e;font-weight:700;font-size:12px;border-radius:999px;padding:7px 13px;cursor:pointer;font-family:inherit;}",
      ".wijspg-tag:hover{border-color:#2f9e6e;}",
    ].join("");
    document.head.appendChild(s);
  }

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var registry = {};

  function maakEntry(id, key, cfg) {
    var overlay = null;

    var tag = document.createElement("button");
    tag.type = "button";
    tag.className = "wijspg-tag";
    tag.textContent = "🔒 Privacy";
    tag.setAttribute("aria-label", "Privacy-tips voor deze tool");
    tag.addEventListener("click", toon);
    document.body.appendChild(tag);

    function sluit(onthoudIndienAangevinkt) {
      if (!overlay) return;
      if (onthoudIndienAangevinkt) {
        var cb = overlay.querySelector(".wijspg-cb");
        if (cb && cb.checked) {
          try {
            localStorage.setItem(key, "1");
          } catch (e) {
            /* opslag niet beschikbaar — dan toont 'ie gewoon vaker */
          }
        }
      }
      overlay.remove();
      overlay = null;
    }

    function toon() {
      if (overlay) return;
      injecteerStijl();
      overlay = document.createElement("div");
      overlay.className = "wijspg-overlay";

      var wel = (cfg.wel || [])
        .map(function (t) {
          return '<li class="wijspg-li"><span class="wijspg-ok">✓</span><span>' + esc(t) + "</span></li>";
        })
        .join("");
      var niet = (cfg.niet || [])
        .map(function (t) {
          return '<li class="wijspg-li"><span class="wijspg-no">✕</span><span>' + esc(t) + "</span></li>";
        })
        .join("");

      overlay.innerHTML =
        '<div class="wijspg-card" role="dialog" aria-modal="true" aria-label="Privacy">' +
        '<div class="wijspg-ic">🔒</div>' +
        '<h2 class="wijspg-h">Privacy is ons uitgangspunt. We hebben jouw hulp daarbij nodig.</h2>' +
        (cfg.intro ? '<p class="wijspg-p">' + esc(cfg.intro) + "</p>" : "") +
        '<ul class="wijspg-list">' + wel + niet + "</ul>" +
        '<div class="wijspg-foot">' +
        '<label class="wijspg-check"><input type="checkbox" class="wijspg-cb"> Niet meer weergeven</label>' +
        '<button type="button" class="wijspg-btn">Sluiten</button>' +
        "</div>" +
        "</div>";

      overlay.querySelector(".wijspg-btn").addEventListener("click", function () {
        sluit(true);
      });
      // Klik op de donkere achtergrond telt ook als "Sluiten" (vinkje geldt dan).
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) sluit(true);
      });
      document.body.appendChild(overlay);
    }

    return {
      tag: tag,
      toon: toon,
      toonTag: function () {
        tag.style.display = "";
      },
      verbergTag: function () {
        tag.style.display = "none";
        sluit(false);
      },
    };
  }

  window.wijsPrivacy = {
    // Open de privacy-poort voor een tool/module.
    gate: function (cfg) {
      cfg = cfg || {};
      var id = cfg.key || "tool";
      var key = "wijs_privacy_" + id;
      injecteerStijl();
      var entry = registry[id] || (registry[id] = maakEntry(id, key, cfg));
      entry.toonTag();
      var weg = false;
      try {
        weg = localStorage.getItem(key) === "1";
      } catch (e) {
        /* geen opslag */
      }
      if (!weg) entry.toon();
    },
    // Verberg het tagje weer (bv. wanneer je de risicovolle module verlaat).
    leave: function (id) {
      var entry = registry[id];
      if (entry) entry.verbergTag();
    },
  };
})();

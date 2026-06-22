/* ──────────────────────────────────────────────────────────────────────────
   Wijs-dialoog — eigen melding/bevestiging in de huisstijl, i.p.v. de kale
   browser-meldingen (alert/confirm). Framework-vrij; werkt in elke tool.

     wijsAlert(tekst, opties?)      → Promise (fire-and-forget mag)
     wijsBevestig(tekst, opties?)   → Promise<boolean>  (true = bevestigd)

   opties: { titel, bevestig, annuleer, gevaar }
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  function zorgStijl() {
    if (document.getElementById("wijs-dlg-stijl")) return;
    var s = document.createElement("style");
    s.id = "wijs-dlg-stijl";
    s.textContent =
      ".wijs-dlg-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-start;justify-content:center;padding:14vh 16px 16px;background:rgba(26,22,46,.45);font-family:'Plus Jakarta Sans',system-ui,sans-serif;}" +
      ".wijs-dlg{width:100%;max-width:400px;background:#fff;border-radius:20px;box-shadow:0 24px 60px rgba(26,22,46,.30);padding:22px 22px 18px;animation:wijsDlgIn .18s ease;}" +
      "@keyframes wijsDlgIn{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}" +
      ".wijs-dlg-titel{font-family:'Fraunces',serif;font-size:18px;font-weight:600;color:#221c3a;margin:0 0 6px;}" +
      ".wijs-dlg-tekst{font-size:14px;line-height:1.55;color:#4a4660;white-space:pre-wrap;margin:0;}" +
      ".wijs-dlg-acties{display:flex;justify-content:flex-end;gap:8px;margin-top:18px;}" +
      ".wijs-dlg-btn{font-family:inherit;font-size:13.5px;font-weight:700;border-radius:12px;padding:9px 16px;cursor:pointer;border:1.5px solid transparent;transition:all .15s;}" +
      ".wijs-dlg-btn.prim{background:#2f9e6e;color:#fff;box-shadow:0 8px 18px rgba(47,158,110,.25);}" +
      ".wijs-dlg-btn.prim:hover{background:#25855a;}" +
      ".wijs-dlg-btn.sec{background:#fff;border-color:rgba(34,28,58,.13);color:#6b6880;}" +
      ".wijs-dlg-btn.sec:hover{color:#221c3a;border-color:rgba(34,28,58,.28);}" +
      ".wijs-dlg-btn.danger{background:#e11d48;color:#fff;box-shadow:0 8px 18px rgba(225,29,72,.22);}" +
      ".wijs-dlg-btn.danger:hover{background:#be123c;}" +
      ".wijs-vink{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(12px);z-index:99998;display:flex;align-items:center;gap:11px;background:#fff;border:1px solid rgba(34,28,58,.08);box-shadow:0 12px 34px rgba(26,22,46,.18);border-radius:999px;padding:10px 18px 10px 12px;opacity:0;transition:opacity .25s ease,transform .25s ease;pointer-events:none;}" +
      ".wijs-vink.in{opacity:1;transform:translateX(-50%) translateY(0);}" +
      ".wijs-vink-ic{width:30px;height:30px;border-radius:50%;background:#2f9e6e;display:flex;align-items:center;justify-content:center;flex-shrink:0;animation:wijsVinkPop .35s ease;}" +
      ".wijs-vink-ic svg{width:17px;height:17px;}" +
      "@keyframes wijsVinkPop{0%{transform:scale(.4)}60%{transform:scale(1.15)}100%{transform:scale(1)}}" +
      ".wijs-vink-tx{font-size:14px;font-weight:700;color:#221c3a;font-family:'Plus Jakarta Sans',system-ui,sans-serif;}";
    document.head.appendChild(s);
  }

  function maak(opts) {
    zorgStijl();
    return new Promise(function (resolve) {
      var isConfirm = opts.type === "confirm";
      var ov = document.createElement("div");
      ov.className = "wijs-dlg-overlay";
      var dlg = document.createElement("div");
      dlg.className = "wijs-dlg";
      dlg.setAttribute("role", "dialog");
      dlg.setAttribute("aria-modal", "true");

      var titel = opts.titel || (isConfirm ? "Even bevestigen" : "");
      if (titel) {
        var h = document.createElement("div");
        h.className = "wijs-dlg-titel";
        h.textContent = titel;
        dlg.appendChild(h);
      }
      if (opts.tekst) {
        var p = document.createElement("p");
        p.className = "wijs-dlg-tekst";
        p.textContent = opts.tekst;
        dlg.appendChild(p);
      }

      var acties = document.createElement("div");
      acties.className = "wijs-dlg-acties";

      function sluit(val) {
        ov.remove();
        document.removeEventListener("keydown", onKey, true);
        resolve(val);
      }
      function onKey(e) {
        if (e.key === "Escape") {
          e.preventDefault();
          sluit(isConfirm ? false : true);
        } else if (e.key === "Enter") {
          e.preventDefault();
          sluit(true);
        }
      }

      if (isConfirm) {
        var ann = document.createElement("button");
        ann.className = "wijs-dlg-btn sec";
        ann.textContent = opts.annuleer || "Annuleren";
        ann.onclick = function () {
          sluit(false);
        };
        acties.appendChild(ann);
      }
      var ok = document.createElement("button");
      ok.className = "wijs-dlg-btn " + (opts.gevaar ? "danger" : "prim");
      ok.textContent = opts.bevestig || (isConfirm ? "Oké" : "Sluiten");
      ok.onclick = function () {
        sluit(true);
      };
      acties.appendChild(ok);

      ov.addEventListener("click", function (e) {
        if (e.target === ov) sluit(isConfirm ? false : true);
      });

      dlg.appendChild(acties);
      ov.appendChild(dlg);
      document.body.appendChild(ov);
      document.addEventListener("keydown", onKey, true);
      setTimeout(function () {
        if (ok && ok.focus) ok.focus();
      }, 20);
    });
  }

  // Klein "afgevinkt"-toastje: popt even op als een taak klaar is. Wisselende
  // tekst zodat het niet saai wordt. Past bij Avinka: van to-do naar gedaan.
  var VINK_TEKSTEN = [
    "Afgevinkt",
    "Van je to-do naar gedaan",
    "Weer wat tijd terug",
    "Klaar, eentje van je lijst",
    "Dat staat",
  ];
  var vinkHuidig = null;
  function toonAfgevinkt() {
    zorgStijl();
    try {
      if (vinkHuidig && vinkHuidig.parentNode) vinkHuidig.remove();
      var t = document.createElement("div");
      t.className = "wijs-vink";
      t.innerHTML =
        '<span class="wijs-vink-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg></span>' +
        '<span class="wijs-vink-tx"></span>';
      t.querySelector(".wijs-vink-tx").textContent =
        VINK_TEKSTEN[Math.floor(Math.random() * VINK_TEKSTEN.length)];
      document.body.appendChild(t);
      vinkHuidig = t;
      requestAnimationFrame(function () {
        t.classList.add("in");
      });
      setTimeout(function () {
        t.classList.remove("in");
        setTimeout(function () {
          if (t.parentNode) t.remove();
          if (vinkHuidig === t) vinkHuidig = null;
        }, 320);
      }, 2600);
    } catch (e) {
      /* stil */
    }
  }
  window.wijsAfgevinkt = toonAfgevinkt;

  window.wijsAlert = function (tekst, opts) {
    opts = opts || {};
    return maak({ type: "alert", tekst: tekst, titel: opts.titel, bevestig: opts.bevestig });
  };
  // Telt één actie bij in "Mijn statistieken" (fire-and-forget; faalt stil).
  window.wijsTel = function (type) {
    try {
      fetch("/api/statistiek", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: type }),
        keepalive: true,
      });
    } catch (e) {
      /* stil */
    }
    toonAfgevinkt();
  };
  window.wijsBevestig = function (tekst, opts) {
    opts = opts || {};
    return maak({
      type: "confirm",
      tekst: tekst,
      titel: opts.titel,
      bevestig: opts.bevestig,
      annuleer: opts.annuleer,
      gevaar: opts.gevaar,
    });
  };
})();

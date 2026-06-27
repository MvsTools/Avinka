/* ───────────────────────────────────────────────────────────────────────────
   Avinka — gedeelde "Opslaan in Bestanden"-dialoog.

   Eén dialoog die élke tool kan aanroepen om iets (een les, een tekst, …) in de
   Bestanden van de leerkracht op te slaan. Toont de mappenboom als een
   bestandskiezer: navigeren, een nieuwe map maken, naam + korte omschrijving
   geven, en opslaan. Net als op je pc.

   Gebruik in een tool:
     <script src="/avinka-bestanden.js"></script>
     const res = await window.avinkaBestanden.opslaan({
       type: 'les',                       // 'les' | 'tekst'
       tool: 'lesontwerp',                // welke tool het opslaat (voor icoon/filter)
       naam: 'Rekenen — breuken vergelijken',
       omschrijving: 'Korte les over het vergelijken van breuken (groep 7).',
       inhoud: '<weergavetekst>',         // optioneel: platte tekst om te tonen
       data: { ... },                     // optioneel: structuur om het document later opnieuw te maken
       suggestiePad: ['Lesontwerpen', 'Rekenen'],  // voorgestelde map (lui aangemaakt bij opslaan)
     });
     // res = { ok:true, id, naam }  |  { ok:false, reason:'geannuleerd'|'geen_toegang'|'fout' }

   De map "Lesontwerpen → Rekenen" ontstaat pas op het moment van opslaan (lui),
   dus er blijven nooit lege mapjes achter als de leerkracht annuleert.
   ─────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  var ACCENT = "#2f9e6e";
  var ingericht = false;
  var overlay, panel, elKeuze, elLocatie, elNav, elNaam, elOms, elFout, elOpslaan;

  // Per open-aanroep gevulde toestand.
  var st = null; // { tree, mode, suggestiePad, cursorId, crumbs, opts, resolve }

  function css() {
    var s = document.createElement("style");
    s.textContent = [
      ".abx-ov{position:fixed;inset:0;background:rgba(26,22,46,.5);backdrop-filter:blur(2px);display:none;align-items:center;justify-content:center;z-index:9000;padding:20px;font-family:'Plus Jakarta Sans',system-ui,sans-serif}",
      ".abx-ov.open{display:flex}",
      ".abx-p{background:#fff;border-radius:20px;max-width:460px;width:100%;padding:24px 24px 20px;box-shadow:0 24px 60px rgba(34,28,58,.28);max-height:88vh;overflow-y:auto;animation:abxUp .25s ease both}",
      "@keyframes abxUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}",
      ".abx-h{font-family:'Fraunces',serif;font-size:21px;font-weight:600;color:#221c3a;margin:0 0 4px}",
      ".abx-sub{font-size:13px;color:#6b6880;line-height:1.5;margin:0 0 16px}",
      ".abx-loc{background:#f3faf6;border:1px solid rgba(47,158,110,.25);border-radius:12px;padding:10px 12px;margin-bottom:10px;font-size:13px;color:#221c3a;line-height:1.45}",
      ".abx-loc b{font-weight:700}",
      ".abx-crumb{color:#6b6880}",
      ".abx-nav{border:1px solid rgba(34,28,58,.13);border-radius:12px;overflow:hidden;margin-bottom:14px}",
      ".abx-row{display:flex;align-items:center;gap:9px;padding:10px 12px;font-size:14px;color:#221c3a;cursor:pointer;border-bottom:1px solid rgba(34,28,58,.07);background:#fff;width:100%;text-align:left;border-left:none;border-right:none;border-top:none;font-family:inherit}",
      ".abx-row:last-child{border-bottom:none}",
      ".abx-row:hover{background:#fbf6ee}",
      ".abx-row .ic{flex-shrink:0}",
      ".abx-empty{padding:12px;font-size:12.5px;color:#9a97ab;text-align:center}",
      ".abx-mk{display:flex;gap:8px;padding:10px 12px;background:#faf8f4;border-top:1px solid rgba(34,28,58,.07)}",
      ".abx-mk input{flex:1;border:1px solid rgba(34,28,58,.16);border-radius:9px;padding:8px 10px;font-size:13.5px;font-family:inherit;outline:none}",
      ".abx-mk input:focus{border-color:" + ACCENT + "}",
      ".abx-lbl{display:block;font-size:11px;font-weight:700;color:#6b6880;text-transform:uppercase;letter-spacing:.5px;margin:0 0 5px}",
      ".abx-in{width:100%;border:1px solid rgba(34,28,58,.16);background:#fff;font-family:inherit;font-size:14.5px;color:#221c3a;padding:10px 12px;border-radius:11px;outline:none;margin-bottom:12px;box-sizing:border-box}",
      ".abx-in:focus{border-color:" + ACCENT + ";box-shadow:0 0 0 3px rgba(47,158,110,.13)}",
      "textarea.abx-in{resize:vertical;min-height:54px;line-height:1.45}",
      ".abx-fout{font-size:12.5px;color:#be123c;margin:0 0 10px;display:none}",
      ".abx-fout.show{display:block}",
      ".abx-foot{display:flex;gap:10px;margin-top:4px}",
      ".abx-btn{flex:1;padding:12px;border-radius:12px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;border:none;transition:all .18s}",
      ".abx-btn.prim{background:" + ACCENT + ";color:#fff;box-shadow:0 8px 20px rgba(47,158,110,.28)}",
      ".abx-btn.prim:hover{background:#25855a}",
      ".abx-btn.sec{background:#f1eef6;color:#6b6880}",
      ".abx-btn.sec:hover{background:#e7e3ef}",
      ".abx-mini{background:none;border:none;color:" + ACCENT + ";font-family:inherit;font-size:12.5px;font-weight:700;cursor:pointer;padding:0;margin-top:2px}",
      ".abx-mini:hover{text-decoration:underline}",
      ".abx-seg{display:flex;gap:6px}",
      ".abx-segbtn{flex:1;padding:9px;border-radius:10px;border:1px solid rgba(34,28,58,.16);background:#fff;font-family:inherit;font-size:13px;font-weight:700;color:#6b6880;cursor:pointer}",
      ".abx-segbtn.aan{background:" + ACCENT + ";color:#fff;border-color:" + ACCENT + "}",
    ].join("\n");
    document.head.appendChild(s);
  }

  function bouw() {
    css();
    overlay = document.createElement("div");
    overlay.className = "abx-ov";
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) sluit("geannuleerd");
    });
    panel = document.createElement("div");
    panel.className = "abx-p";
    panel.innerHTML =
      '<h3 class="abx-h">Opslaan in Bestanden</h3>' +
      '<p class="abx-sub">Kies waar je dit wilt bewaren. Nieuwe mappen worden automatisch aangemaakt.</p>' +
      '<div id="abx-keuze" style="display:none;margin-bottom:12px"></div>' +
      '<div class="abx-loc" id="abx-loc"></div>' +
      '<div class="abx-nav" id="abx-nav"></div>' +
      '<label class="abx-lbl">Naam</label>' +
      '<input class="abx-in" id="abx-naam" maxlength="120">' +
      '<label class="abx-lbl">Korte omschrijving</label>' +
      '<textarea class="abx-in" id="abx-oms" maxlength="280" rows="2"></textarea>' +
      '<p class="abx-fout" id="abx-fout"></p>' +
      '<div class="abx-foot">' +
      '<button class="abx-btn sec" id="abx-annuleer">Annuleren</button>' +
      '<button class="abx-btn prim" id="abx-opslaan">Hier opslaan</button>' +
      "</div>";
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    elKeuze = panel.querySelector("#abx-keuze");
    elLocatie = panel.querySelector("#abx-loc");
    elNav = panel.querySelector("#abx-nav");
    elNaam = panel.querySelector("#abx-naam");
    elOms = panel.querySelector("#abx-oms");
    elFout = panel.querySelector("#abx-fout");
    elOpslaan = panel.querySelector("#abx-opslaan");
    panel.querySelector("#abx-annuleer").addEventListener("click", function () {
      sluit("geannuleerd");
    });
    elOpslaan.addEventListener("click", bewaar);
    ingericht = true;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function mappenOnder(parentId) {
    return (st.tree || []).filter(function (b) {
      return b.type === "map" && (b.parent_id || null) === (parentId || null);
    });
  }

  // Tekent de keuze (overschrijven/nieuw), de locatiebalk en de navigator.
  function teken() {
    elFout.classList.remove("show");

    // Keuze "bijwerken / als nieuwe" — alleen als de les al in Bestanden staat.
    if (st.bestandId) {
      elKeuze.style.display = "";
      elKeuze.innerHTML =
        '<div class="abx-seg">' +
        '<button class="abx-segbtn' + (st.overschrijf ? " aan" : "") + '" data-k="bij">Bestaande bijwerken</button>' +
        '<button class="abx-segbtn' + (!st.overschrijf ? " aan" : "") + '" data-k="nieuw">Als nieuwe opslaan</button>' +
        "</div>";
      elKeuze.querySelectorAll(".abx-segbtn").forEach(function (b) {
        b.addEventListener("click", function () {
          st.overschrijf = b.getAttribute("data-k") === "bij";
          teken();
        });
      });
    } else {
      elKeuze.style.display = "none";
    }

    // Bij overschrijven hoeft er geen map gekozen te worden.
    var toonPicker = !(st.bestandId && st.overschrijf);
    elLocatie.style.display = toonPicker ? "" : "none";
    if (!toonPicker) {
      elNav.style.display = "none";
    } else if (st.mode === "suggestie") {
      var padTekst = st.suggestiePad
        .map(function (n) {
          return esc(n);
        })
        .join(' <span class="abx-crumb">›</span> ');
      elLocatie.innerHTML =
        'Bewaren in: <b>Bestanden</b> <span class="abx-crumb">›</span> ' +
        padTekst +
        '<br><button class="abx-mini" id="abx-kies">Andere map kiezen</button>';
      elLocatie.querySelector("#abx-kies").addEventListener("click", function () {
        st.mode = "nav";
        st.cursorId = null;
        st.crumbs = [];
        teken();
      });
      elNav.style.display = "none";
    } else {
      var crumb = "<b>Bestanden</b>";
      st.crumbs.forEach(function (c) {
        crumb += ' <span class="abx-crumb">›</span> ' + esc(c.naam);
      });
      var extra = st.suggestiePad
        ? '<br><button class="abx-mini" id="abx-terugsug">Voorgestelde map gebruiken</button>'
        : "";
      elLocatie.innerHTML = "Bewaren in: " + crumb + extra;
      if (st.suggestiePad) {
        elLocatie.querySelector("#abx-terugsug").addEventListener("click", function () {
          st.mode = "suggestie";
          teken();
        });
      }
      tekenNav();
      elNav.style.display = "";
    }

    // Knoptekst past zich aan de keuze aan.
    elOpslaan.textContent = st.bestandId && st.overschrijf ? "Bijwerken" : "Hier opslaan";
  }

  function tekenNav() {
    var html = "";
    if (st.cursorId) {
      html +=
        '<button class="abx-row" data-op="terug"><span class="ic">↑</span><span>Terug</span></button>';
    }
    var subs = mappenOnder(st.cursorId);
    subs.forEach(function (m) {
      html +=
        '<button class="abx-row" data-in="' +
        esc(m.id) +
        '"><span class="ic">📁</span><span>' +
        esc(m.naam) +
        "</span></button>";
    });
    if (!subs.length && !st.cursorId) {
      html += '<div class="abx-empty">Nog geen mappen — sla hier op of maak er een.</div>';
    } else if (!subs.length) {
      html += '<div class="abx-empty">Geen submappen.</div>';
    }
    html +=
      '<div class="abx-mk"><input id="abx-mknaam" placeholder="Nieuwe map…" maxlength="120">' +
      '<button class="abx-btn prim" id="abx-mkbtn" style="flex:0 0 auto;padding:8px 14px">Maak</button></div>';
    elNav.innerHTML = html;

    elNav.querySelectorAll("[data-in]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-in");
        var m = st.tree.filter(function (x) {
          return x.id === id;
        })[0];
        st.crumbs.push({ id: id, naam: m ? m.naam : "map" });
        st.cursorId = id;
        teken();
      });
    });
    var terug = elNav.querySelector('[data-op="terug"]');
    if (terug)
      terug.addEventListener("click", function () {
        st.crumbs.pop();
        st.cursorId = st.crumbs.length ? st.crumbs[st.crumbs.length - 1].id : null;
        teken();
      });
    elNav.querySelector("#abx-mkbtn").addEventListener("click", maakMap);
    elNav.querySelector("#abx-mknaam").addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        maakMap();
      }
    });
  }

  async function maakMap() {
    var inp = elNav.querySelector("#abx-mknaam");
    var naam = (inp.value || "").trim();
    if (!naam) return;
    try {
      var r = await fetch("/api/bestanden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actie: "map", naam: naam, parent_id: st.cursorId }),
      });
      if (!r.ok) throw new Error();
      var nieuw = await r.json();
      st.tree.push({
        id: nieuw.id,
        parent_id: nieuw.parent_id || st.cursorId || null,
        type: "map",
        naam: nieuw.naam,
        tool: null,
      });
      // Meteen de nieuwe map in duiken.
      st.crumbs.push({ id: nieuw.id, naam: nieuw.naam });
      st.cursorId = nieuw.id;
      teken();
    } catch (e) {
      fout("De map kon niet worden aangemaakt. Probeer het opnieuw.");
    }
  }

  function fout(m) {
    elFout.textContent = m;
    elFout.classList.add("show");
  }

  async function bewaar() {
    var naam = (elNaam.value || "").trim();
    if (!naam) {
      fout("Geef het bestand een naam.");
      elNaam.focus();
      return;
    }
    var oms = (elOms.value || "").trim();
    var opts = st.opts;

    // Omschrijving in de data meebewaren (geen aparte kolom nodig).
    var data;
    if (opts.data && typeof opts.data === "object" && !Array.isArray(opts.data)) {
      data = Object.assign({}, opts.data, { omschrijving: oms });
    } else if (opts.data != null) {
      data = { payload: opts.data, omschrijving: oms };
    } else {
      data = { omschrijving: oms };
    }

    var lichaam = {
      type: opts.type || "tekst",
      tool: opts.tool || null,
      naam: naam,
      inhoud: opts.inhoud != null ? opts.inhoud : null,
      data: data,
    };
    if (st.bestandId && st.overschrijf) {
      lichaam.id = st.bestandId; // bestaande les bijwerken (blijft op zijn plek)
    } else if (st.mode === "suggestie") {
      lichaam.pad = st.suggestiePad;
    } else if (st.cursorId) {
      lichaam.parent_id = st.cursorId; // anders: wortel
    }

    var bijwerken = st.bestandId && st.overschrijf;
    elOpslaan.disabled = true;
    elOpslaan.textContent = bijwerken ? "Bijwerken…" : "Opslaan…";
    try {
      var r = await fetch("/api/bestanden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lichaam),
      });
      if (r.status === 403) return sluit("geen_toegang");
      if (!r.ok) throw new Error();
      var res = await r.json();
      var done = st.resolve;
      dicht();
      done({ ok: true, id: res.id, naam: res.naam, oms: oms });
    } catch (e) {
      elOpslaan.disabled = false;
      elOpslaan.textContent = bijwerken ? "Bijwerken" : "Hier opslaan";
      fout("Opslaan is niet gelukt. Probeer het opnieuw.");
    }
  }

  function dicht() {
    overlay.classList.remove("open");
    st = null;
  }
  function sluit(reden) {
    var done = st && st.resolve;
    dicht();
    if (done) done({ ok: false, reason: reden });
  }

  function opslaan(opts) {
    opts = opts || {};
    if (!ingericht) bouw();
    return new Promise(function (resolve) {
      // Haal eerst de mappenboom op (en check toegang).
      fetch("/api/bestanden?tree=1", { headers: { accept: "application/json" } })
        .then(function (r) {
          if (r.status === 403) {
            resolve({ ok: false, reason: "geen_toegang" });
            return null;
          }
          return r.ok ? r.json() : { bestanden: [] };
        })
        .then(function (j) {
          if (!j) return; // 403 al afgehandeld
          var sug =
            Array.isArray(opts.suggestiePad) && opts.suggestiePad.length
              ? opts.suggestiePad.slice()
              : null;
          st = {
            tree: (j && j.bestanden) || [],
            mode: sug ? "suggestie" : "nav",
            suggestiePad: sug,
            cursorId: null,
            crumbs: [],
            bestandId: opts.bestandId || null,
            overschrijf: !!opts.bestandId, // bestaat al → standaard bijwerken
            opts: opts,
            resolve: resolve,
          };
          elNaam.value = opts.naam || "";
          elOms.value = opts.omschrijving || "";
          elFout.classList.remove("show");
          elOpslaan.disabled = false;
          elOpslaan.textContent = "Hier opslaan";
          teken();
          overlay.classList.add("open");
          setTimeout(function () {
            elNaam.focus();
          }, 60);
        })
        .catch(function () {
          resolve({ ok: false, reason: "fout" });
        });
    });
  }

  window.avinkaBestanden = { opslaan: opslaan };
})();

/* ───────────────────────────────────────────────────────────────────────────
   Avinka — gedeelde Word-generator voor draaiboeken.

   Eén bron van waarheid voor het .docx van een draaiboek. Zowel de tool
   (draaiboek.html) als het dashboard (Bestanden → ⬇ Download als Word) kunnen
   deze module gebruiken, zodat de opmaak op één plek staat. Het resultaat is een
   nette, AANVULBARE Word (tabellen met vinkvakjes en tijdvakken die je zelf kunt
   bijwerken).

   Vereist JSZip als global (window.JSZip).

   Gebruik (in <head>):
     <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
     <script src="/avinka-draaiboekdocx.js"></script>
     await window.avinkaDraaiboekDocx.download(tekst, meta);   // maakt + downloadt

   meta: { titel, emoji, datumMooi, start, eind, groep, aantal, locatie }
   ─────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  function docxEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // ── OOXML-helpers: runs, alinea's en tabellen ──
  function dRun(text, o) { o = o || {}; var p = '';
    if (o.b) p += '<w:b/>';
    if (o.i) p += '<w:i/>';
    if (o.color) p += '<w:color w:val="' + o.color + '"/>';
    if (o.sz) p += '<w:sz w:val="' + o.sz + '"/>';
    p = p ? '<w:rPr>' + p + '</w:rPr>' : '';
    return '<w:r>' + p + '<w:t xml:space="preserve">' + docxEsc(text) + '</w:t></w:r>';
  }
  function dInline(text, base) { base = base || {};
    var s = String(text == null ? '' : text), out = '', re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g, last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) out += dRun(s.slice(last, m.index).replace(/\*/g, ''), base);
      out += m[1] != null ? dRun(m[1], Object.assign({}, base, { b: true })) : dRun(m[2], Object.assign({}, base, { i: true }));
      last = re.lastIndex;
    }
    if (last < s.length) out += dRun(s.slice(last).replace(/\*/g, ''), base);
    return out;
  }
  function dPara(runs, o) { o = o || {}; var pr = '';
    if (o.keepNext) pr += '<w:keepNext/>';
    if (o.keepLines) pr += '<w:keepLines/>';
    if (o.leftBar) pr += '<w:pBdr><w:left w:val="single" w:sz="18" w:space="6" w:color="' + o.leftBar + '"/></w:pBdr>';
    if (o.shd) pr += '<w:shd w:val="clear" w:color="auto" w:fill="' + o.shd + '"/>';
    pr += '<w:spacing w:before="' + (o.before != null ? o.before : 0) + '" w:after="' + (o.after != null ? o.after : 80) + '" w:line="' + (o.line || 264) + '" w:lineRule="auto"/>';
    if (o.jc) pr += '<w:jc w:val="' + o.jc + '"/>';
    return '<w:p><w:pPr>' + pr + '</w:pPr>' + (runs || '') + '</w:p>';
  }
  function dBorders(val, sz, color) {
    function e(p) { return '<w:' + p + ' w:val="' + val + '"' + (val !== 'none' ? ' w:sz="' + sz + '" w:space="0" w:color="' + color + '"' : '') + '/>'; }
    return '<w:tblBorders>' + e('top') + e('left') + e('bottom') + e('right') + e('insideH') + e('insideV') + '</w:tblBorders>';
  }
  function dCell(content, o) { o = o || {}; var m = o.margins != null ? o.margins : 120; var pr = '<w:tcW w:w="' + (o.w || 9072) + '" w:type="dxa"/>';
    if (o.shd) pr += '<w:shd w:val="clear" w:color="auto" w:fill="' + o.shd + '"/>';
    pr += '<w:tcMar><w:top w:w="' + m + '" w:type="dxa"/><w:left w:w="' + m + '" w:type="dxa"/><w:bottom w:w="' + m + '" w:type="dxa"/><w:right w:w="' + m + '" w:type="dxa"/></w:tcMar>';
    if (o.valign) pr += '<w:vAlign w:val="' + o.valign + '"/>';
    return '<w:tc><w:tcPr>' + pr + '</w:tcPr>' + (content || dPara('')) + '</w:tc>';
  }
  function dTable(rows, o) { o = o || {};
    var b = o.noBorders ? dBorders('none', '0', 'auto') : dBorders('single', '6', o.bc || 'E3DCCB');
    var grid = '<w:tblGrid>' + (o.grid || [9072]).map(function (w) { return '<w:gridCol w:w="' + w + '"/>'; }).join('') + '</w:tblGrid>';
    return '<w:tbl><w:tblPr><w:tblW w:w="9072" w:type="dxa"/>' + b + '<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr>' + grid +
      rows.map(function (r) { return '<w:tr>' + r + '</w:tr>'; }).join('') + '</w:tbl><w:p><w:pPr><w:spacing w:before="0" w:after="100"/></w:pPr></w:p>';
  }

  // ── Markdown → secties {title, lines[]} ──
  function parseDraaiboek(md) {
    var secs = [], cur = null;
    String(md || '').split('\n').forEach(function (raw) {
      var t = raw.replace(/\s+$/, '');
      var h2 = t.match(/^##\s+(?!#)(.+)$/);
      if (h2) { cur = { title: h2[1].trim(), lines: [] }; secs.push(cur); return; }
      if (cur) cur.lines.push(t);
    });
    return secs;
  }

  // Losse regels van een sectie → blokken {kind, text}
  function blokken(lines) {
    var out = [];
    lines.forEach(function (raw) {
      var t = raw.trim(); if (!t) return;
      var h3 = t.match(/^###\s+(.+)$/);
      if (h3) { out.push({ kind: 'h3', text: h3[1].trim() }); return; }
      if (/^[-*]\s+/.test(t)) { out.push({ kind: 'li', text: t.replace(/^[-*]\s+/, '') }); return; }
      out.push({ kind: 'p', text: t });
    });
    return out;
  }

  var GROEN = '2F9E6E', GROEN2 = '25855A', INK = '221C3A', MUT = '6B6880';

  function secIcon(low) {
    if (/^overzicht/.test(low)) return '📌';
    if (/^aftellen/.test(low)) return '⏳';
    if (/^programma/.test(low)) return '🕘';
    if (/activiteiten/.test(low)) return '🎯';
    if (/^taakverdeling/.test(low)) return '🙌';
    if (/boodschappen|materialen/.test(low)) return '🛒';
    if (/^extra/.test(low)) return '🎡';
    if (/^communicatie/.test(low)) return '✉️';
    if (/^aandacht/.test(low)) return '⚠️';
    if (/^evaluatie/.test(low)) return '🔎';
    return '▸';
  }

  // Groene sectiekop-band + body-cel (zoals de andere Avinka-documenten)
  function sectieBlok(titel, bodyXml, bodyShd) {
    var kop = '<w:trPr><w:cantSplit/></w:trPr>' + dCell(
      dPara(dRun(secIcon(titel.toLowerCase()) + '   ', { sz: 22 }) + dRun(titel, { b: true, color: 'FFFFFF', sz: 22 }), { after: 0, keepNext: true }),
      { shd: GROEN, margins: 130 });
    var lijf = dCell(bodyXml || dPara(''), { shd: bodyShd || 'FCFAF4', margins: 160 });
    return dTable([kop, lijf], { noBorders: true });
  }

  function liXml(text, teken, kleur) {
    // Afvink-markers uit de tool ("- [x] " / "- [ ] ") netjes verwerken: afgevinkt
    // krijgt een ✓ en grijze tekst, niet-afgevinkt het gewone vinkvakje.
    var t = String(text == null ? '' : text), done = false;
    var m = t.match(/^\[([ xX])\]\s+(.*)$/);
    if (m) { done = m[1].toLowerCase() === 'x'; t = m[2]; }
    var tk = done ? '✓' : (teken || '▢');
    return dPara(dRun(tk + '  ', { b: true, color: done ? '2F9E6E' : (kleur || GROEN) }) + dInline(t, { color: done ? '6B6880' : INK }), { after: 40 });
  }
  function pXml(text) { return dPara(dInline(text, { color: INK }), { after: 60 }); }

  function draaiboekNaarBody(md, meta) {
    meta = meta || {};
    var secs = parseDraaiboek(md);
    var titel = meta.titel || 'Draaiboek';
    var emoji = meta.emoji || '🎉';
    var sub = [];
    if (meta.datumMooi) sub.push(meta.datumMooi);
    if (meta.start && meta.eind) sub.push(meta.start + '–' + meta.eind);

    // Groene banner
    var banner = dTable([dCell(
      dPara(dRun(emoji + '  ', { sz: 40 }) + dRun('Draaiboek ' + titel, { b: true, color: 'FFFFFF', sz: 44 }), { after: sub.length ? 30 : 0 }) +
      (sub.length ? dPara(dRun(sub.join('   ·   '), { color: 'D6EFE2', sz: 22 }), { after: 0 }) : ''),
      { shd: GROEN, margins: 200 }
    )], { noBorders: true });

    // Meta-strook (4 kolommen)
    function mcell(label, val) {
      return dCell(
        dPara(dRun(String(label).toUpperCase(), { b: true, color: MUT, sz: 15 }), { after: 20 }) +
        dPara(dInline(val || '—', { b: true, color: INK, sz: 21 }), { after: 0 }),
        { w: 2268, shd: 'F4EFE5', valign: 'center', margins: 130 });
    }
    var metaT = dTable([
      mcell('Datum', meta.datumMooi) +
      mcell('Tijd', (meta.start && meta.eind) ? meta.start + '–' + meta.eind : '') +
      mcell('Groep', meta.groep) +
      mcell('Aantal', meta.aantal ? meta.aantal + ' kinderen' : '')
    ], { grid: [2268, 2268, 2268, 2268], bc: 'FFFFFF' });

    var body = banner + metaT;

    secs.forEach(function (sec) {
      var low = sec.title.toLowerCase();
      var bl = blokken(sec.lines);

      if (/^overzicht/.test(low)) {
        var p = bl.filter(function (b) { return b.kind !== 'h3'; }).map(function (b) { return dPara(dInline(b.text, { color: INK }), { after: 40 }); }).join('') || dPara('');
        body += sectieBlok(sec.title, p, 'E7F4ED');
        return;
      }

      if (/^programma/.test(low)) {
        // Groene sectiekop, dan per tijdvak een bandje (tijd + naam) met beschrijving.
        body += dPara(dRun('🕘   ', { sz: 22 }) + dRun(sec.title, { b: true, color: INK, sz: 24 }), { before: 120, after: 40, keepNext: true });
        var huidig = null, desc = [];
        var spoel = function () {
          if (!huidig) return;
          var m = huidig.match(/^([\d:]+\s*[–-]\s*[\d:]+)\s*[·:-]?\s*(.*)$/);
          var tijd = '', naam = huidig;
          if (m) { tijd = m[1].replace(/\s+/g, ''); naam = m[2]; }
          naam = naam.replace(/\s*\(\s*\d+\s*min\s*\)\s*$/i, '').trim();
          var kop = '<w:trPr><w:cantSplit/></w:trPr>' + dCell(
            dPara((tijd ? dRun(tijd + '   ', { b: true, color: 'FFFFFF', sz: 21 }) : '') + dRun(naam, { b: true, color: 'FFFFFF', sz: 21 }), { after: 0, keepNext: true }),
            { shd: GROEN, margins: 130 });
          var lijf = dCell(desc.length ? desc.map(function (d) { return liXml(d, '•', GROEN2); }).join('') : dPara(''), { shd: 'F4FAF7', margins: 150 });
          body += dTable([kop, lijf], { noBorders: true });
          huidig = null; desc = [];
        };
        bl.forEach(function (b) {
          if (b.kind === 'h3') { spoel(); huidig = b.text; }
          else desc.push(b.text.replace(/^[-*]\s+/, ''));
        });
        spoel();
        return;
      }

      if (/^aftellen/.test(low) || /^taakverdeling/.test(low)) {
        // Groene sectiekop; binnen de body ###-subkopjes vet + vinkvakjes eronder.
        var inner = '';
        bl.forEach(function (b) {
          if (b.kind === 'h3') inner += dPara(dInline(b.text, { b: true, color: GROEN2, sz: 21 }), { before: 100, after: 30 });
          else if (b.kind === 'li') inner += liXml(b.text, '▢');
          else inner += pXml(b.text);
        });
        body += sectieBlok(sec.title, inner || dPara(''));
        return;
      }

      if (/boodschappen|materialen/.test(low)) {
        var mat = bl.map(function (b) { return b.kind === 'li' ? liXml(b.text, '▢') : (b.kind === 'h3' ? dPara(dInline(b.text, { b: true, color: GROEN2, sz: 20 }), { before: 80, after: 20 }) : pXml(b.text)); }).join('') || dPara('');
        body += sectieBlok(sec.title, mat);
        return;
      }

      if (/^aandacht/.test(low)) {
        var aan = bl.map(function (b) { return b.kind === 'li' ? dPara(dRun('!  ', { b: true, color: 'B45309' }) + dInline(b.text, { color: INK }), { shd: 'FFFBEB', leftBar: 'F59E0B', before: 40, after: 40 }) : pXml(b.text); }).join('') || dPara('');
        body += sectieBlok(sec.title, aan, 'FFFDF5');
        return;
      }

      // Overige secties: generiek
      var gen = bl.map(function (b) { return b.kind === 'h3' ? dPara(dInline(b.text, { b: true, color: GROEN2, sz: 20 }), { before: 80, after: 20 }) : (b.kind === 'li' ? liXml(b.text, '•') : pXml(b.text)); }).join('') || dPara('');
      body += sectieBlok(sec.title, gen);
    });

    body += dPara(dRun('Gemaakt met Avinka · vul het draaiboek aan waar nodig.', { i: true, color: MUT, sz: 16 }), { before: 200, jc: 'center' });

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + body +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1417" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>' +
      '</w:body></w:document>';
  }

  var DOCX_CT = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>';
  var DOCX_RELS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
  var DOCX_DRELS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
  var DOCX_STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:color w:val="221C3A"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>';

  async function blob(tekst, meta) {
    if (typeof JSZip === 'undefined') throw new Error('JSZip ontbreekt');
    var zip = new JSZip();
    zip.file('[Content_Types].xml', DOCX_CT);
    zip.folder('_rels').file('.rels', DOCX_RELS);
    var w = zip.folder('word');
    w.file('document.xml', draaiboekNaarBody(tekst, meta || {}));
    w.file('styles.xml', DOCX_STYLES);
    w.folder('_rels').file('document.xml.rels', DOCX_DRELS);
    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  async function download(tekst, meta, bestandsnaam) {
    if (!tekst) return;
    var b = await blob(tekst, meta || {});
    var kaal = String((meta && meta.titel) || 'draaiboek').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    var naam = bestandsnaam || ('draaiboek_' + kaal + '.docx');
    var url = URL.createObjectURL(b);
    var a = document.createElement('a');
    a.href = url; a.download = naam;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  window.avinkaDraaiboekDocx = { documentXml: draaiboekNaarBody, blob: blob, download: download };
})();

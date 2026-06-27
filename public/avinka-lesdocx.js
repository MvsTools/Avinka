/* ───────────────────────────────────────────────────────────────────────────
   Avinka — gedeelde Word-generator voor lesontwerpen.

   Eén bron van waarheid voor het .docx van een les. Zowel de tool
   (lesontwerp.html) als het dashboard (Bestanden → ⬇ Download als Word)
   gebruiken deze module, zodat de opmaak maar op één plek staat.

   Vereist dat JSZip als global geladen is (window.JSZip).

   Gebruik:
     <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
     <script src="/avinka-lesdocx.js"></script>
     await window.avinkaLesDocx.download(lesTekst, meta);   // maakt + downloadt
     const blob = await window.avinkaLesDocx.blob(lesTekst, meta);  // alleen de blob
   ─────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  function docxEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // ── OOXML-helpers: runs, alinea's en tabellen (= de vakjes/kolommen) ──
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
    if (o.pageBreak) pr += '<w:pageBreakBefore/>';
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

  var LESTYPE_EMOJI = { klas: '📚', bewegend: '🤸', buiten: '☀️', cooperatief: '👥' };
  var LESTYPE_NAAM = { klas: 'In de klas', bewegend: 'Bewegend leren', buiten: 'Buitenles', cooperatief: 'Coöperatief leren' };

  // Markdown → structuur (secties + fasen + blokken)
  function parseLes(md) {
    var secs = [], cur = null, fase = null;
    function push(b) { if (cur && cur.type === 'lesopbouw') { if (fase) fase.content.push(b); } else if (cur) cur.content.push(b); }
    md.split('\n').forEach(function (raw) {
      var t = raw.trim(); if (!t) return;
      if (/^##\s+/.test(t) && !/^###/.test(t)) {
        var titel = t.replace(/^#+\s*/, ''); fase = null;
        if (/^lesopbouw/i.test(titel)) cur = { type: 'lesopbouw', title: titel, fasen: [] };
        else {
          var ty = /lesdoel/i.test(titel) ? 'lesdoel' : /lesidee/i.test(titel) ? 'lesidee' : /succescrit/i.test(titel) ? 'succescriteria' : /benodig/i.test(titel) ? 'benodigdheden' : /^tip/i.test(titel) ? 'tips' : /aanpak|zo pak/i.test(titel) ? 'aanpak' : /bouwsteen/i.test(titel) ? 'bouwstenen' : /different/i.test(titel) ? 'differentiatie' : 'overig';
          cur = { type: ty, title: titel, content: [] };
        }
        secs.push(cur); return;
      }
      if (/^###\s+/.test(t)) {
        var titel2 = t.replace(/^#+\s*/, '');
        if (cur && cur.type === 'lesopbouw') {
          var bodyT = titel2.replace(/^\d+\.\s*/, ''), tijd = '';
          var m = bodyT.match(/\(([^)]*\bmin[^)]*)\)\s*$/i);
          if (m) { tijd = m[1].trim(); bodyT = bodyT.replace(/\([^)]*\)\s*$/, '').trim(); }
          fase = { nr: cur.fasen.length + 1, title: bodyT, tijd: tijd, content: [] }; cur.fasen.push(fase);
        } else push({ kind: 'h4', text: titel2 });
        return;
      }
      if (/^\*\*\s*controle van begrip\s*:?\s*\*\*/i.test(t)) { push({ kind: 'cvb', text: t.replace(/^\*\*\s*controle van begrip\s*:?\s*\*\*\s*/i, '') }); return; }
      var lbl = t.match(/^\*\*\s*(.+?)\s*:\s*\*\*\s*(.*)$/);
      if (lbl) { push({ kind: 'label', label: lbl[1], text: lbl[2] }); return; }
      if (/^[-*]\s+/.test(t)) { push({ kind: 'li', text: t.replace(/^[-*]\s+/, '') }); return; }
      push({ kind: 'p', text: t });
    });
    return secs;
  }

  function dBlocks(blocks, liChar) {
    liChar = liChar || '✓';
    var out = '';
    blocks.forEach(function (b) {
      if (b.kind === 'li') out += dPara(dRun(liChar + '  ', { color: '2F9E6E', b: true }) + dInline(b.text, { color: '221C3A' }), { after: 30 });
      else if (b.kind === 'cvb') out += dPara(dRun('✓ Controle van begrip  ', { b: true, color: '25855A' }) + dInline(b.text, { color: '25855A' }), { shd: 'E7F4ED', leftBar: '2F9E6E', before: 140, after: 60 });
      else if (b.kind === 'label') out += dPara(dRun(b.label + ': ', { b: true, color: '25855A' }) + dInline(b.text, { color: '221C3A' }), { before: 40, after: 40 });
      else if (b.kind === 'h4') out += dPara(dInline(b.text, { b: true, color: '25855A' }), { before: 80, after: 20 });
      else out += dPara(dInline(b.text, { color: '221C3A' }), { after: 60 });
    });
    return out || dPara('');
  }

  function lesNaarBody(md, meta) {
    meta = meta || {};
    var secs = parseLes(md);
    var lestypeNaam = (meta.lestypes || []).map(function (v) { return LESTYPE_NAAM[v]; }).filter(Boolean).join(' + ') || 'Les';
    var isIdee = meta.vorm === 'idee';
    var repType = (meta.lestypes || []).filter(function (v) { return v !== 'klas'; })[0] || (meta.lestypes || [])[0];
    var emoji = isIdee ? '🎨' : (LESTYPE_EMOJI[repType] || '📚');
    var titelTxt = isIdee ? 'Lesidee' : 'Lesvoorbereiding';
    var groep = meta.groep ? (/^groep/i.test(meta.groep) ? meta.groep : 'Groep ' + meta.groep) : '—';

    // Groene banner
    var banner = dTable([dCell(
      dPara(dRun(emoji + '  ', { sz: 40 }) + dRun(titelTxt, { b: true, color: 'FFFFFF', sz: 44 }), { after: 30 }) +
      dPara(dRun(lestypeNaam + (meta.vak ? '  ·  ' + meta.vak : ''), { color: 'D6EFE2', sz: 22 }), { after: 0 }),
      { shd: '2F9E6E', margins: 200 }
    )], { noBorders: true });

    // Meta-strook (4 kolommen)
    function mcell(label, val) {
      return dCell(
        dPara(dRun(label.toUpperCase(), { b: true, color: '6B6880', sz: 15 }), { after: 20 }) +
        dPara(dInline(val || '—', { b: true, color: '221C3A', sz: 21 }), { after: 0 }),
        { w: 2268, shd: 'F4EFE5', valign: 'center', margins: 130 }
      );
    }
    var metaT = dTable([mcell('Groep', groep) + mcell('Vak', meta.vak) + mcell('Lesduur', meta.duur) + mcell('Lestype', lestypeNaam)], { grid: [2268, 2268, 2268, 2268], bc: 'FFFFFF' });

    var body = banner + metaT;
    var sectIcon = { lesdoel: '🎯', lesidee: '🎨', aanpak: '🪜', succescriteria: '✅', benodigdheden: '🧰', tips: '💡', bouwstenen: '🧩', differentiatie: '🔀', overig: '▸' };

    secs.forEach(function (sec) {
      if (sec.type === 'lesopbouw') {
        body += dPara(dRun('📋  ', { sz: 28 }) + dRun(sec.title, { b: true, color: '221C3A', sz: 28 }), { before: 0, after: 40, pageBreak: true, keepNext: true });
        sec.fasen.forEach(function (f) {
          var head = '<w:trPr><w:cantSplit/></w:trPr>' + dCell(dPara(
            dRun('Fase ' + f.nr + '   ', { b: true, color: 'FFFFFF', sz: 19 }) + dRun(f.title, { b: true, color: 'FFFFFF', sz: 23 }) + (f.tijd ? dRun('    ·  ' + f.tijd, { color: 'D6EFE2', sz: 19 }) : ''),
            { after: 0, keepNext: true }), { shd: '2F9E6E', margins: 140 });
          var bodyC = dCell(dBlocks(f.content), { shd: 'F4FAF7', margins: 160 });
          body += dTable([head, bodyC], { noBorders: true });
        });
      } else if (sec.type === 'differentiatie') {
        // Splits de inhoud op de ###-kopjes in kolommen.
        var cols = [], curCol = null;
        sec.content.forEach(function (b) {
          if (b.kind === 'h4') { curCol = { title: b.text, blocks: [] }; cols.push(curCol); }
          else if (curCol) curCol.blocks.push(b);
        });
        body += dPara(dRun('🔀  ', { sz: 24 }) + dRun(sec.title, { b: true, color: '221C3A', sz: 24 }), { before: 80, after: 50, keepNext: true });
        if (cols.length) {
          var cw = Math.floor(9072 / cols.length), grid = cols.map(function () { return cw; });
          var headRow = '<w:trPr><w:cantSplit/></w:trPr>' + cols.map(function (c) { return dCell(dPara(dRun(c.title, { b: true, color: 'FFFFFF', sz: 19 }), { after: 0, keepNext: true }), { w: cw, shd: '2F9E6E', margins: 120, valign: 'center' }); }).join('');
          var bodyRow = cols.map(function (c) { return dCell(dBlocks(c.blocks, '•'), { w: cw, shd: 'F4FAF7', margins: 140, valign: 'top' }); }).join('');
          body += dTable([headRow, bodyRow], { grid: grid, bc: 'FFFFFF' });
        }
      } else {
        var bodyShd = sec.type === 'lesdoel' ? 'E7F4ED' : 'FCFAF4';
        var liChar = (sec.type === 'benodigdheden' || sec.type === 'tips') ? '•' : '✓';
        // cantSplit + keepNext: titelregel niet verweesd laten onderaan een pagina.
        var kop = '<w:trPr><w:cantSplit/></w:trPr>' + dCell(dPara(dRun((sectIcon[sec.type] || '▸') + '   ', { sz: 22 }) + dRun(sec.title, { b: true, color: 'FFFFFF', sz: 22 }), { after: 0, keepNext: true }), { shd: '2F9E6E', margins: 130 });
        var lijf = dCell(dBlocks(sec.content, liChar), { shd: bodyShd, margins: 160 });
        body += dTable([kop, lijf], { noBorders: true });
      }
    });

    body += dPara(dRun('Gemaakt met Avinka · lees de les altijd na voordat je hem geeft.', { i: true, color: '6B6880', sz: 16 }), { before: 200, jc: 'center' });

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
    w.file('document.xml', lesNaarBody(tekst, meta || {}));
    w.file('styles.xml', DOCX_STYLES);
    w.folder('_rels').file('document.xml.rels', DOCX_DRELS);
    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  async function download(tekst, meta, bestandsnaam) {
    if (!tekst) return;
    var b = await blob(tekst, meta || {});
    var naam = bestandsnaam ||
      ('lesontwerp_' + (((meta && meta.groep) || '').replace(/[^\w]/g, '-')) + '_' + new Date().toISOString().slice(0, 10) + '.docx');
    var url = URL.createObjectURL(b);
    var a = document.createElement('a');
    a.href = url;
    a.download = naam;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  window.avinkaLesDocx = { documentXml: lesNaarBody, blob: blob, download: download };
})();

// Zet de woordenbank om naar een echte .xlsx — zonder externe dependency.
// Eén werkblad, per woord gelabeld met categorie + omschrijving + groep + vorm.
// Bedoeld om door een mens/AI nagelopen te worden op niet-passende woorden.
//
// Gebruik:  node maak-excel.js  ["C:\pad\naar\uitvoer.xlsx"]
// Standaard-uitvoer: de Documenten-map van de gebruiker.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const bank = require("./woordenbank.json");

// ---------- rijen opbouwen ----------
const KOP = ["Categorie", "Omschrijving", "Vanaf groep", "Vorm", "Woord"];
const rijen = [];
for (const id of Object.keys(bank.categorieen)) {
  const cat = bank.categorieen[id];
  // per categorie: op groep, dan alfabetisch
  const woorden = [...cat.woorden].sort((a, b) =>
    a[1] - b[1] || a[0].localeCompare(b[0], "nl")
  );
  for (const w of woorden) {
    rijen.push([
      id,
      cat.label,
      w[1],
      w[2] === "v" ? "vervoeging/verbuiging" : w[2] === "2" ? "ook geldig (hoort ook bij andere categorie)" : "grondvorm",
      w[0],
    ]);
  }
}

// ---------- XML-helpers ----------
const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function kolomLetter(n) {
  let s = "";
  n++;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function cel(kol, rij, waarde, kopRij) {
  const ref = kolomLetter(kol) + rij;
  if (typeof waarde === "number") {
    return `<c r="${ref}"${kopRij ? ' s="1"' : ""}><v>${waarde}</v></c>`;
  }
  const s = kopRij ? ' s="1"' : "";
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(
    waarde
  )}</t></is></c>`;
}

function bouwSheet() {
  const alle = [KOP, ...rijen];
  const rijenXml = alle
    .map((r, i) => {
      const rij = i + 1;
      const kop = i === 0;
      const cellen = r.map((v, k) => cel(k, rij, v, kop)).join("");
      return `<row r="${rij}">${cellen}</row>`;
    })
    .join("");
  const laatste = kolomLetter(KOP.length - 1) + alle.length;
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    `<cols>` +
    `<col min="1" max="1" width="18"/>` +
    `<col min="2" max="2" width="52"/>` +
    `<col min="3" max="3" width="12"/>` +
    `<col min="4" max="4" width="22"/>` +
    `<col min="5" max="5" width="22"/>` +
    `</cols>` +
    `<sheetData>${rijenXml}</sheetData>` +
    `<autoFilter ref="A1:${laatste}"/>` +
    `</worksheet>`
  );
}

const bestanden = {
  "[Content_Types].xml":
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    `</Types>`,
  "_rels/.rels":
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`,
  "xl/workbook.xml":
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets><sheet name="Woordbank" sheetId="1" r:id="rId1"/></sheets>` +
    `</workbook>`,
  "xl/_rels/workbook.xml.rels":
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `</Relationships>`,
  "xl/styles.xml":
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
    `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
    `<borders count="1"><border/></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>` +
    `</styleSheet>`,
  "xl/worksheets/sheet1.xml": bouwSheet(),
};

// ---------- minimale ZIP-schrijver (deflate) ----------
const CRC_TABEL = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABEL[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function schrijfZip(entries) {
  const lokaal = [];
  const centraal = [];
  let offset = 0;
  for (const { naam, data } of entries) {
    const naamBuf = Buffer.from(naam, "utf8");
    const crc = crc32(data);
    const comp = zlib.deflateRawSync(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4); // versie nodig
    lh.writeUInt16LE(0x0800, 6); // UTF-8 bestandsnaam
    lh.writeUInt16LE(8, 8); // deflate
    lh.writeUInt16LE(0, 10); // tijd
    lh.writeUInt16LE(0x21, 12); // datum (1980-01-01)
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(naamBuf.length, 26);
    lh.writeUInt16LE(0, 28);
    lokaal.push(lh, naamBuf, comp);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(8, 10);
    ch.writeUInt16LE(0, 12);
    ch.writeUInt16LE(0x21, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(comp.length, 20);
    ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(naamBuf.length, 28);
    ch.writeUInt32LE(offset, 42);
    centraal.push(ch, naamBuf);

    offset += lh.length + naamBuf.length + comp.length;
  }
  const cdBuf = Buffer.concat(centraal);
  const cdOffset = offset;
  const eind = Buffer.alloc(22);
  eind.writeUInt32LE(0x06054b50, 0);
  eind.writeUInt16LE(entries.length, 8);
  eind.writeUInt16LE(entries.length, 10);
  eind.writeUInt32LE(cdBuf.length, 12);
  eind.writeUInt32LE(cdOffset, 16);
  return Buffer.concat([...lokaal, cdBuf, eind]);
}

// ---------- wegschrijven ----------
const uitvoer =
  process.argv[2] ||
  path.join(
    process.env.USERPROFILE || process.env.HOME || ".",
    "Documents",
    "avinka-woordbank.xlsx"
  );

const entries = Object.entries(bestanden).map(([naam, xml]) => ({
  naam,
  data: Buffer.from(xml, "utf8"),
}));
fs.writeFileSync(uitvoer, schrijfZip(entries));

console.log("Klaar: " + uitvoer);
console.log(
  rijen.length +
    " woorden over " +
    Object.keys(bank.categorieen).length +
    " categorieën."
);

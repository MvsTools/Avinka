import { chromium } from "playwright";
import { join } from "node:path";

const wb = {
  titel: "De herfst", ondertitel: "Lezen & spelling", vak: "Taal", groep: "groep 5",
  blokken: [
    { type: "tekst", kop: "Lees eerst", tekst: "In de herfst worden de bladeren bruin, rood en geel. Ze dwarrelen van de bomen. De egel zoekt een warm plekje om te slapen en de eekhoorn verstopt zijn nootjes." },
    { type: "meerkeuze", opdracht: "Kruis het goede antwoord aan.", vragen: [
      { vraag: "Welke kleur worden de bladeren in de herfst?", opties: ["blauw en groen", "bruin, rood en geel", "wit en roze"], goed: 1 },
      { vraag: "Wat doet de egel in de herfst?", opties: ["hij gaat zwemmen", "hij zoekt een slaapplek", "hij vliegt weg"], goed: 1 },
      { vraag: "Wat verstopt de eekhoorn?", opties: ["zijn nootjes", "zijn schoenen", "een bal"], goed: 0 },
    ] },
    { type: "woordzoeker", opdracht: "Zoek de acht herfstwoorden.", woorden: ["BLAD", "EGEL", "REGEN", "WIND", "PADDENSTOEL", "HERFST", "BOOM", "KASTANJE"] },
  ],
};

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 820, height: 1400 }, deviceScaleFactor: 2 });
await p.setContent(
  `<!doctype html><meta charset="utf-8">
   <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Fraunces:wght@600;700&family=Baloo+2:wght@600;700&display=swap" rel="stylesheet">
   <body style="margin:0;background:#f1eee8"><div id="host" style="padding:24px;max-width:760px;margin:0 auto"></div></body>`,
  { waitUntil: "load" }
);
await p.addScriptTag({ path: join(process.cwd(), "public", "avinka-werkblad.js") });
await p.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
await p.evaluate((wb) => { document.getElementById("host").innerHTML = window.avinkaWerkblad.render(wb, { antwoorden: false }); }, wb);
await p.waitForTimeout(500);
await p.locator(".wb-page").screenshot({ path: join(process.cwd(), "_video", "public", "resultaat.png") });
await b.close();
console.log("resultaat gerenderd");

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const PUB = join(ROOT, "public");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".json": "application/json", ".webp": "image/webp" };

const server = createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  const f = join(PUB, p);
  if (f.startsWith(PUB) && existsSync(f) && statSync(f).isFile()) {
    res.writeHead(200, { "content-type": MIME[extname(f)] || "application/octet-stream" });
    res.end(readFileSync(f));
  } else {
    res.writeHead(404, { "content-type": "application/json" });
    res.end("{}"); // API-calls netjes laten falen
  }
});
await new Promise((r) => server.listen(4400, r));

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
for (const tool of ["werkbladen", "toetsanalyse", "rapporten", "plattegrond", "lesontwerp", "oudercontact"]) {
  try {
    await page.goto(`http://localhost:4400/tools/${tool}.html`, { waitUntil: "load", timeout: 15000 });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: join(ROOT, "_video", "_shots", tool + ".png") });
    console.log("shot:", tool);
  } catch (e) { console.log("FOUT", tool, String(e.message).slice(0, 80)); }
}
await b.close();
server.close();
console.log("klaar");

/* Avinka — een reservekopie nakijken en er herstel-SQL van maken.
 *
 * Een reservekopie die je nooit hebt uitgeprobeerd is geen reservekopie: dan
 * weet je pas op het slechtste moment of hij werkt. Dit script hoort daarom bij
 * `backup-database.mjs`.
 *
 * DIT SCRIPT RAAKT DE DATABASE NOOIT.
 * Het kan twee dingen:
 *   1. VERGELIJKEN — wat zit er in de kopie, wat staat er nu in de database.
 *   2. SQL SCHRIJVEN — een bestand met insert-opdrachten dat JIJ bewust draait.
 *
 *   node scripts/herstel-database.mjs                     → vergelijk de nieuwste kopie
 *   node scripts/herstel-database.mjs 2026-08-05-2339     → vergelijk die kopie
 *   node scripts/herstel-database.mjs --sql taken         → maak herstel-SQL voor één tabel
 *   node scripts/herstel-database.mjs --sql alles         → voor alle tabellen
 *
 * ⚠️ WAAROM GEEN KNOP DIE HET ZELF TERUGZET
 * De serverrol mag met opzet alleen LEZEN (zie migratie-backup-leesrecht.sql).
 * Zou dit script zelf kunnen schrijven, dan moest die rol overal schrijfrecht
 * krijgen — precies het risico dat we niet willen. Herstellen is bovendien iets
 * wat je één keer per nooit doet, met je hoofd erbij.
 *
 * ⚠️ WAT DE GEGENEREERDE SQL WEL EN NIET DOET
 * Wel: rijen die WEG zijn terugzetten (`on conflict do nothing`).
 * Niet: rijen die veranderd zijn terugdraaien, en niet: rijen weggooien die er
 * later bij kwamen. Te veel houden is te repareren, te veel weggooien niet.
 *
 * ⚠️ EN HET SCHEMA DAN
 * Dit gaat alleen over GEGEVENS. Is er iets mis met het schema (kolom weg,
 * policy stuk), dan zit je herstel in git: `database/schema.sql` + de migraties.
 */

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const PROJECT = resolve(import.meta.dirname, "..");
const DOEL = process.env.AVINKA_BACKUP_MAP || "C:\\dev\\avinka-backups";

const args = process.argv.slice(2);
const sqlVoor = args.includes("--sql") ? args[args.indexOf("--sql") + 1] : null;
const gevraagdeKopie = args.find((a) => /^\d{4}-\d{2}-\d{2}-\d{4}$/.test(a));

function leesEnv() {
  const uit = {};
  const tekst = readFileSync(join(PROJECT, ".env.local"), "utf8");
  for (const regel of tekst.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(regel);
    if (m) uit[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return uit;
}

const env = leesEnv();
const URL_BASIS = env.NEXT_PUBLIC_SUPABASE_URL;
const SLEUTEL = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_BASIS || !SLEUTEL) {
  console.error("NEXT_PUBLIC_SUPABASE_URL of SUPABASE_SERVICE_ROLE_KEY ontbreekt in .env.local.");
  process.exit(1);
}
const koppen = { apikey: SLEUTEL, Authorization: `Bearer ${SLEUTEL}` };

const kopieën = existsSync(DOEL)
  ? readdirSync(DOEL).filter((n) => /^\d{4}-\d{2}-\d{2}-\d{4}$/.test(n)).sort()
  : [];
if (!kopieën.length) {
  console.error(`Geen reservekopieën in ${DOEL}. Draai eerst backup-database.mjs.`);
  process.exit(1);
}
const kopie = gevraagdeKopie ?? kopieën.at(-1);
const map = join(DOEL, kopie);
if (!existsSync(map)) {
  console.error(`Kopie ${kopie} bestaat niet. Beschikbaar: ${kopieën.join(", ")}`);
  process.exit(1);
}

const tabellen = readdirSync(map)
  .filter((n) => n.endsWith(".json") && !n.startsWith("_"))
  .map((n) => n.replace(/\.json$/, ""));

/** Eén waarde als SQL-letterlijke tekst. */
function sqlWaarde(v) {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v) || typeof v === "object") {
    return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(v).replace(/'/g, "''")}'`;
}

if (sqlVoor) {
  const lijst = sqlVoor === "alles" ? tabellen : [sqlVoor];
  const onbekend = lijst.filter((t) => !tabellen.includes(t));
  if (onbekend.length) {
    console.error(`Niet in deze kopie: ${onbekend.join(", ")}\nWel: ${tabellen.join(", ")}`);
    process.exit(1);
  }

  const regels = [
    `-- Herstel uit reservekopie ${kopie}`,
    `-- Gemaakt op ${new Date().toISOString()} door scripts/herstel-database.mjs`,
    `--`,
    `-- LEES DIT VOOR JE HET DRAAIT:`,
    `-- - dit zet alleen rijen TERUG die weg zijn (on conflict do nothing);`,
    `-- - het verandert niets aan rijen die er nog staan;`,
    `-- - het gooit niets weg.`,
    `-- Draai het per tabel als je twijfelt, en meet daarna na.`,
    ``,
  ];

  let totaal = 0;
  for (const tabel of lijst) {
    const rijen = JSON.parse(readFileSync(join(map, `${tabel}.json`), "utf8"));
    if (!rijen.length) {
      regels.push(`-- ${tabel}: leeg in de kopie, niets te herstellen`, ``);
      continue;
    }
    const kolommen = Object.keys(rijen[0]);
    regels.push(`-- ${tabel}: ${rijen.length} rijen`);
    for (const rij of rijen) {
      const waarden = kolommen.map((k) => sqlWaarde(rij[k])).join(", ");
      regels.push(
        `insert into public.${tabel} (${kolommen.map((k) => `"${k}"`).join(", ")}) ` +
          `values (${waarden}) on conflict do nothing;`,
      );
    }
    regels.push(``);
    totaal += rijen.length;
  }

  const uitMap = join(DOEL, "_herstel");
  mkdirSync(uitMap, { recursive: true });
  const bestand = join(uitMap, `herstel-${kopie}-${sqlVoor}.sql`);
  writeFileSync(bestand, regels.join("\n"), "utf8");
  console.log(`Herstel-SQL geschreven: ${bestand}`);
  console.log(`${totaal} rijen over ${lijst.length} tabel(len).`);
  console.log(`\nDraaien doe je zelf: plak het in de Supabase SQL-editor, of vraag Claude het te draaien.`);
  process.exit(0);
}

// ── Vergelijken ────────────────────────────────────────────────────────────
async function huidigAantal(tabel) {
  const res = await fetch(`${URL_BASIS}/rest/v1/${tabel}?select=*`, {
    headers: { ...koppen, Range: "0-0", Prefer: "count=exact" },
  });
  if (!res.ok) return null;
  const n = Number((res.headers.get("content-range") || "").split("/")[1]);
  return Number.isFinite(n) ? n : null;
}

console.log(`Kopie: ${kopie}  (er zijn er ${kopieën.length})`);
console.log(`Vergelijken met de database — er wordt niets gewijzigd.\n`);
console.log("  tabel".padEnd(28) + "kopie".padStart(8) + "nu".padStart(9) + "   verschil");
console.log("  " + "-".repeat(55));

let afwijkend = 0;
for (const tabel of tabellen.sort()) {
  const rijen = JSON.parse(readFileSync(join(map, `${tabel}.json`), "utf8")).length;
  const nu = await huidigAantal(tabel);
  const verschil = nu === null ? null : nu - rijen;
  if (verschil !== 0) afwijkend++;
  const teken = verschil === null ? "?" : verschil > 0 ? `+${verschil}` : String(verschil);
  console.log(`  ${tabel}`.padEnd(28) + String(rijen).padStart(8) + String(nu ?? "?").padStart(9) + `   ${teken}`);
}

console.log(
  afwijkend === 0
    ? "\nAlles gelijk aan de kopie."
    : `\n${afwijkend} tabel(len) wijken af. Minder rijen dan de kopie? Dan kun je ze terughalen:\n` +
        `  node scripts/herstel-database.mjs ${kopie} --sql <tabel>`,
);

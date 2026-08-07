/* Avinka — reservekopie van de database.
 *
 * WAAROM DIT BESTAAT
 * Op het gratis Supabase-plan zijn er GEEN automatische back-ups en is er geen
 * knop "zet terug naar gisteren". Zolang we daarop zitten is dit ons vangnet:
 * vóór elke databasewijziging draaien we dit, zodat we altijd één stap terug
 * kunnen.
 *
 * WAT ER IN DE KOPIE ZIT
 * - alle tabellen uit het openbare schema (de gegevens);
 * - de accountlijst uit auth (id, e-mail, aangemaakt) — zonder die lijst zijn
 *   alle rijen straks verweesd, want alles hangt aan een user_id.
 * Het SCHEMA zelf (tabellen, policies, functies) zit niet in deze kopie: dat
 * staat in `database/schema.sql` en de migraties, en die staan in git.
 *
 * WAAR HET HEEN GAAT
 * Buiten de projectmap: C:\dev\avinka-backups\  (of AVINKA_BACKUP_MAP)
 * ⚠️ Bewust NIET in de repo. Hier staan voornamen van kinderen en rapporten in;
 * die horen niet in git en niet in een map die je per ongeluk deelt.
 *
 * GEBRUIK
 *   node scripts/backup-database.mjs
 */

import { readFileSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const PROJECT = resolve(import.meta.dirname, "..");
const DOEL = process.env.AVINKA_BACKUP_MAP || "C:\\dev\\avinka-backups";

/** .env.local lezen zonder extra pakket. */
function leesEnv() {
  const uit = {};
  let tekst = "";
  try {
    tekst = readFileSync(join(PROJECT, ".env.local"), "utf8");
  } catch {
    console.error("Kan .env.local niet lezen. Draai dit vanuit de projectmap.");
    process.exit(1);
  }
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
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL of SUPABASE_SERVICE_ROLE_KEY ontbreekt in .env.local.\n" +
      "Zonder die twee kan dit script niets ophalen.",
  );
  process.exit(1);
}

const koppen = { apikey: SLEUTEL, Authorization: `Bearer ${SLEUTEL}` };

/** Welke tabellen zijn er? Vragen we aan de database zelf, zodat een nieuwe
 *  tabel automatisch meegaat en niemand deze lijst hoeft bij te werken. */
async function haalTabellen() {
  const res = await fetch(`${URL_BASIS}/rest/v1/`, { headers: koppen });
  if (!res.ok) throw new Error(`tabellenlijst ophalen mislukt (${res.status})`);
  const spec = await res.json();
  return Object.keys(spec.paths || {})
    .filter((p) => p.startsWith("/") && p.length > 1 && !p.includes("{"))
    .map((p) => p.slice(1))
    .filter((naam) => naam && !naam.startsWith("rpc/"))
    .sort();
}

/** Alle rijen van één tabel, in stappen van 1000 (PostgREST geeft nooit meer). */
async function haalTabel(naam) {
  const rijen = [];
  const stap = 1000;
  for (let van = 0; ; van += stap) {
    const res = await fetch(`${URL_BASIS}/rest/v1/${naam}?select=*`, {
      headers: { ...koppen, Range: `${van}-${van + stap - 1}`, Prefer: "count=exact" },
    });
    if (!res.ok) throw new Error(`${naam}: ${res.status} ${await res.text()}`);
    const deel = await res.json();
    rijen.push(...deel);
    if (deel.length < stap) break;
  }
  return rijen;
}

/** De accounts. Zonder deze lijst is de rest van de kopie waardeloos. */
async function haalAccounts() {
  const uit = [];
  for (let pagina = 1; ; pagina++) {
    const res = await fetch(`${URL_BASIS}/auth/v1/admin/users?page=${pagina}&per_page=200`, {
      headers: koppen,
    });
    if (!res.ok) throw new Error(`accounts ophalen mislukt (${res.status})`);
    const data = await res.json();
    const users = data.users || [];
    uit.push(
      ...users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        user_metadata: u.user_metadata,
      })),
    );
    if (users.length < 200) break;
  }
  return uit;
}

/** "2026-08-05-1930" — sorteert vanzelf op tijd. */
function stempel() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

const naam = stempel();
const map = join(DOEL, naam);
mkdirSync(map, { recursive: true });

console.log(`Reservekopie van de database → ${map}\n`);

const overzicht = { gemaakt: new Date().toISOString(), project: URL_BASIS, tabellen: {} };
let totaal = 0;

try {
  const accounts = await haalAccounts();
  writeFileSync(join(map, "_accounts.json"), JSON.stringify(accounts, null, 2), "utf8");
  overzicht.accounts = accounts.length;
  console.log(`  accounts`.padEnd(28) + `${accounts.length} rijen`);

  for (const tabel of await haalTabellen()) {
    const rijen = await haalTabel(tabel);
    writeFileSync(join(map, `${tabel}.json`), JSON.stringify(rijen, null, 2), "utf8");
    overzicht.tabellen[tabel] = rijen.length;
    totaal += rijen.length;
    console.log(`  ${tabel}`.padEnd(28) + `${rijen.length} rijen`);
  }
} catch (e) {
  console.error(`\nMISLUKT: ${e.message}`);
  console.error("De kopie is NIET compleet. Niets doen aan de database tot dit werkt.");
  process.exit(1);
}

writeFileSync(join(map, "_overzicht.json"), JSON.stringify(overzicht, null, 2), "utf8");

console.log(`\n${totaal} rijen in ${Object.keys(overzicht.tabellen).length} tabellen.`);

// Even laten zien wat er nu ligt, zodat je ziet dat er echt meerdere kopieën zijn.
try {
  const alle = readdirSync(DOEL).filter((n) => /^\d{4}-\d{2}-\d{2}-\d{4}$/.test(n)).sort();
  console.log(`Kopieën in ${DOEL}: ${alle.length} (oudste ${alle[0]}, nieuwste ${alle.at(-1)})`);
} catch {
  /* map net aangemaakt */
}

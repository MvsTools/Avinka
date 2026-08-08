import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Je gegevens inzien/downloaden (AVG: recht op inzage + dataportabiliteit, art. 15/20).
// Verzamelt alles wat via RLS onder jouw account leesbaar is. RLS dwingt af dat
// je alleen je eigen rijen krijgt.
//   standaard      → een leesbare webpagina, zodat je gewoon kunt zíen wat we bewaren
//   ?format=json   → een machineleesbaar bestand, om je gegevens over te zetten
const TABELLEN = [
  "instellingen",
  "klassen",
  "rapporten",
  "bestanden",
  "statistiek",
  "taken",
  "reviews",
  "toestemmingen",
] as const;

// Vriendelijke titel per categorie.
const SECTIES: Record<string, { titel: string; leeg: string }> = {
  instellingen: { titel: "Je account en voorkeuren", leeg: "Nog geen voorkeuren ingesteld." },
  klassen: { titel: "Je klassen", leeg: "Je hebt nog geen klas ingevuld." },
  rapporten: { titel: "Concept-rapportteksten", leeg: "Geen opgeslagen concepten." },
  bestanden: { titel: "Opgeslagen bestanden en plattegronden", leeg: "Nog niets opgeslagen." },
  statistiek: { titel: "Je gebruik van Avinka", leeg: "Nog geen gebruiksgegevens." },
  taken: { titel: "Je takenlijst", leeg: "Geen taken." },
  reviews: { titel: "Je beoordeling", leeg: "Je hebt geen beoordeling achtergelaten." },
  toestemmingen: { titel: "Je akkoord op de voorwaarden", leeg: "Nog geen akkoord vastgelegd." },
};

// Nette labels voor de velden die ertoe doen.
const LABELS: Record<string, string> = {
  schoolnaam: "School",
  school_brin: "BRIN-code van de school",
  school_vestiging: "Vestigingscode van de school",
  standaardgroep: "Standaardgroep",
  toon: "Toon van de teksten",
  taalniveau: "Taalniveau",
  lengte: "Lengte van de teksten",
  aanspreekvorm: "Aanspreekvorm",
  abon_plan: "Abonnement",
  abon_vorm: "Betaalvorm",
  abon_status: "Abonnementsstatus",
  ref_code: "Jouw uitnodigingscode",
  verwezen_door: "Uitgenodigd door (code)",
  naam: "Naam",
  leerlingen: "Leerlingen (voornamen)",
  leerlingen_data: "Leerlingen",
  actief: "Actieve klas",
  verhaal: "Tekst",
  type: "Soort",
  inhoud: "Inhoud",
  tool: "Gemaakt met",
  tellers: "Aantal keer gebruikt",
  minuten: "Tijd bespaard (minuten)",
  streak: "Reeks actieve dagen",
  streak_max: "Langste reeks",
  laatste_actief: "Laatst actief",
  tekst: "Tekst",
  gedaan: "Afgevinkt",
  wekelijks: "Wekelijks terugkerend",
  deadline: "Deadline",
  sterren: "Sterren",
  mag_tonen: "Mag openbaar getoond worden",
  created_at: "Aangemaakt op",
  updated_at: "Laatst gewijzigd",
  gedaan_op: "Afgevinkt op",
  voorwaarden_versie: "Versie algemene voorwaarden",
  privacy_versie: "Versie privacyverklaring",
  geaccepteerd_op: "Akkoord gegeven op",
  bron: "Waar akkoord gegeven",
};

// Puur technische velden die niets toevoegen voor een mens.
const VERBERG = new Set(["id", "user_id", "parent_id", "per_dag"]);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function label(key: string): string {
  return LABELS[key] ?? key;
}

// Lange vrije tekst (rapporttekst, les-inhoud) niet volledig uitschrijven, maar
// samenvatten tot een herkenbare regel + woordenaantal. De volledige inhoud staat
// in de JSON-download en in de tool zelf.
function vatSamen(s: string): string {
  const schoon = s.replace(/\s+/g, " ").trim();
  const woorden = schoon ? schoon.split(" ").length : 0;
  const kort = schoon.length > 120 ? schoon.slice(0, 120).trimEnd() + "…" : schoon;
  const telling = woorden > 25 ? ` (${woorden} woorden bewaard)` : "";
  return escapeHtml(kort) + telling;
}

// Een waarde leesbaar maken. Geeft "" terug als er niets zinnigs te tonen is.
function toonWaarde(key: string, val: unknown): string {
  if (val === null || val === undefined || val === "") return "";
  if (typeof val === "boolean") return val ? "ja" : "nee";
  if (Array.isArray(val)) {
    if (val.length === 0) return "";
    // Lijst met leerlingen mét jongen/meisje.
    if (key === "leerlingen_data") {
      return val
        .map((l) => {
          const o = l as { naam?: string; geslacht?: string };
          const g = o.geslacht === "j" ? " (jongen)" : o.geslacht === "m" ? " (meisje)" : "";
          return escapeHtml(String(o.naam ?? "")) + g;
        })
        .join(", ");
    }
    return escapeHtml(val.map((x) => String(x)).join(", "));
  }
  if (typeof val === "object") {
    // De plattegrond-indeling is technische data; niet uitschrijven.
    if (key === "data") return "opgeslagen indeling";
    // Klein object (tellers, minuten): key: waarde-paren.
    const paren = Object.entries(val as Record<string, unknown>).filter(
      ([, v]) => v !== null && v !== "",
    );
    if (paren.length === 0) return "";
    return paren.map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(String(v))}`).join(" · ");
  }
  const s = String(val);
  // ISO-datums inkorten tot de datum.
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return escapeHtml(s.slice(0, 10));
  // Lange vrije tekst samenvatten in plaats van volledig tonen.
  if (key === "verhaal" || key === "inhoud") return vatSamen(s);
  return escapeHtml(s);
}

// Eén rij → een lijstje label/waarde.
function rijHtml(rij: Record<string, unknown>): string {
  const items = Object.entries(rij)
    .filter(([k]) => !VERBERG.has(k))
    .map(([k, v]) => [label(k), toonWaarde(k, v)] as const)
    .filter(([, w]) => w !== "");
  if (items.length === 0) return "";
  return (
    '<div class="rij">' +
    items
      .map(([l, w]) => `<div class="k">${escapeHtml(l)}</div><div class="v">${w}</div>`)
      .join("") +
    "</div>"
  );
}

/* Uitgelogd op deze pagina belanden is geen fout maar het normale geval: de
   link naar je gegevens is bruikbaar voor wie is gestopt, en die is meestal
   niet meer ingelogd. Een kale {"error":"unauthorized"} op een wit scherm is
   dan een doodlopende weg op precies het moment dat iemand een recht uitoefent
   (AVG art. 15/20). Dus: een gewone pagina met de weg terug. De JSON-variant
   houdt wél zijn JSON, want daar zit een programma aan de andere kant. */
function inlogPagina(): NextResponse {
  const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Even inloggen</title>
<link rel="icon" href="/Avinka_vinkje.png">
<style>
  :root{ --ink:#1f2a37; --muted:#6b7280; --brand:#25855a; --line:#e5e7eb; --cream:#f9faf8; }
  *{ box-sizing:border-box; }
  body{ margin:0; background:var(--cream); color:var(--ink); display:flex; min-height:100vh;
    align-items:center; justify-content:center; padding:24px;
    font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; line-height:1.6; }
  .kaart{ background:#fff; border:1px solid var(--line); border-radius:20px; padding:32px 34px; max-width:460px; }
  .merk{ display:block; height:26px; width:auto; margin:0 0 20px; }
  h1{ font-size:22px; font-weight:800; margin:0 0 10px; }
  p{ color:var(--muted); margin:0 0 20px; }
  a.knop{ display:inline-block; background:var(--brand); color:#fff; text-decoration:none;
    font-weight:700; font-size:15px; border-radius:12px; padding:12px 22px; }
  .foot{ font-size:13px; margin:20px 0 0; }
  .foot a{ color:var(--brand); font-weight:700; }
</style></head>
<body><div class="kaart">
  <img class="merk" src="/Avinka_wordmerk.png" alt="Avinka">
  <h1>Even inloggen</h1>
  <p>Om te kunnen laten zien wat we van jou bewaren, moeten we eerst zeker weten
     dat jij het bent. Log in met het adres van je Avinka-account; daarna kom je
     hier vanzelf op je eigen overzicht.</p>
  <a class="knop" href="/sign-in?volgende=%2Fapi%2Faccount%2Fexport">Inloggen</a>
  <p class="foot">Lukt het inloggen niet? Mail dan naar
     <a href="mailto:support@avinka.nl">support@avinka.nl</a>, dan sturen we je
     gegevens met de hand toe.</p>
</div></body></html>`;
  return new NextResponse(html, {
    status: 401,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return request.nextUrl.searchParams.get("format") === "json"
      ? NextResponse.json({ error: "unauthorized" }, { status: 401 })
      : inlogPagina();
  }

  const gegevens: Record<string, Record<string, unknown>[]> = {};
  for (const tabel of TABELLEN) {
    const { data } = await supabase.from(tabel).select("*");
    gegevens[tabel] = (data as Record<string, unknown>[]) ?? [];
  }

  const account = {
    id: user.id,
    email: user.email,
    voornaam: (user.user_metadata?.first_name as string) ?? null,
    aangemaakt: user.created_at,
  };

  // Machineleesbaar (voor overzetten naar een andere dienst).
  if (request.nextUrl.searchParams.get("format") === "json") {
    const payload = {
      geexporteerd_op: new Date().toISOString(),
      toelichting:
        "Een kopie van de gegevens die Avinka onder jouw account bewaart. Voor een verzoek dat hier niet in past, mail ons.",
      account,
      gegevens,
    };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": 'attachment; filename="avinka-mijn-gegevens.json"',
      },
    });
  }

  // Leesbare pagina.
  const secties = TABELLEN.map((tabel) => {
    const cfg = SECTIES[tabel];
    const rijen = gegevens[tabel];
    const body =
      rijen.length === 0
        ? `<p class="leeg">${escapeHtml(cfg.leeg)}</p>`
        : rijen.map(rijHtml).filter(Boolean).join('<hr class="sep">');
    return `<section><h2>${escapeHtml(cfg.titel)}</h2>${body}</section>`;
  }).join("");

  const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Wat Avinka van jou bewaart</title>
<link rel="icon" href="/Avinka_vinkje.png">
<style>
  :root{ --ink:#1f2a37; --muted:#6b7280; --brand:#2f9e6e; --line:#e5e7eb; --cream:#f9faf8; }
  *{ box-sizing:border-box; }
  body{ margin:0; background:var(--cream); color:var(--ink);
    font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; line-height:1.6; }
  .wrap{ max-width:760px; margin:0 auto; padding:40px 20px 80px; }
  .merk{ display:block; height:28px; width:auto; margin:0 0 24px; }
  h1{ font-size:28px; font-weight:800; margin:0 0 6px; }
  .intro{ color:var(--muted); margin:0 0 8px; }
  .meta{ color:var(--muted); font-size:14px; margin:0 0 28px; }
  section{ background:#fff; border:1px solid var(--line); border-radius:20px; padding:22px 24px; margin-bottom:16px; }
  h2{ font-size:18px; font-weight:800; margin:0 0 14px; }
  .rij{ display:grid; grid-template-columns:220px 1fr; gap:6px 18px; }
  @media(max-width:560px){ .rij{ grid-template-columns:1fr; gap:2px; } .k{ margin-top:8px; } }
  .k{ color:var(--muted); font-weight:600; font-size:14px; }
  .v{ color:var(--ink); word-break:break-word; white-space:pre-wrap; }
  .sep{ border:0; border-top:1px solid var(--line); margin:16px 0; }
  .leeg{ color:var(--muted); margin:0; }
  .print{ margin:24px 0 0; }
  .print button, .print a{ font:inherit; font-weight:700; font-size:14px; cursor:pointer;
    border:1px solid var(--line); background:#fff; color:var(--ink); border-radius:12px;
    padding:9px 16px; text-decoration:none; display:inline-block; }
  .foot{ color:var(--muted); font-size:13px; margin-top:28px; }
</style></head>
<body><div class="wrap">
  <img class="merk" src="/Avinka_wordmerk.png" alt="Avinka">
  <h1>Wat Avinka van jou bewaart</h1>
  <p class="intro">Dit is alles wat we onder jouw account bewaren, in gewone taal op een rij.</p>
  <p class="meta">Account: ${escapeHtml(account.email ?? "")}${
    account.voornaam ? " · " + escapeHtml(account.voornaam) : ""
  }</p>
  ${secties}
  <div class="print">
    <button onclick="window.print()">Afdrukken of opslaan als pdf</button>
    <a href="/api/account/export?format=json">Ook als bestand (JSON)</a>
  </div>
  <p class="foot">Mis je hier iets, of wil je je account verwijderen? Dat regel je in Avinka onder Instellingen, of mail ons.</p>
</div></body></html>`;

  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

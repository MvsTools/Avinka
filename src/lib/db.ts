// ════════════════════════════════════════════════════════════════════════
//  Datatoegang voor het dashboard. Praat rechtstreeks met Supabase vanuit de
//  browser; de Row Level Security in de database zorgt dat een leerkracht
//  ALLEEN zijn eigen data kan zien/bewerken. Geen losse server-route nodig:
//  Supabase + RLS ís de beveiligde koppeling.
// ════════════════════════════════════════════════════════════════════════
import { createClient } from "@/utils/supabase/client";
import { streakLeeftNog } from "@/lib/streak";
import {
  type Abonnement,
  type AbonnementRow,
  ABON_COLS,
  mapAbonnementRow,
  nieuwAbonnement,
} from "@/lib/abonnement";

export type Voorkeuren = {
  schoolnaam: string;
  standaardgroep: string;
  toon: string;
};
export type Leerling = { naam: string; geslacht: "" | "j" | "m" };
export type Klas = {
  id: string;
  naam: string;
  leerlingen: string[]; // platte namenlijst (afgeleid; voor de tools)
  leerlingenData: Leerling[]; // rijk: naam + geslacht per leerling
  actief: boolean; // de klas die de tools invullen
};
export type Tekst = { id: string; titel: string; inhoud: string; created_at: string };
export type Rapport = { naam: string; verhaal: string; updated_at: string };

// ── INSTELLINGEN ────────────────────────────────────────────────────────
export async function getVoorkeuren(): Promise<Voorkeuren | null> {
  const sb = createClient();
  const { data, error } = await sb
    .from("instellingen")
    .select("schoolnaam, standaardgroep, toon")
    .maybeSingle();
  if (error || !data) return null;
  return {
    schoolnaam: data.schoolnaam ?? "",
    standaardgroep: data.standaardgroep ?? "",
    toon: data.toon ?? "warm",
  };
}

export async function saveVoorkeuren(v: Voorkeuren): Promise<boolean> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  const { error } = await sb
    .from("instellingen")
    .upsert({ user_id: user.id, ...v }, { onConflict: "user_id" });
  return !error;
}

// ── ABONNEMENT ────────────────────────────────────────────────────────────
// Leest de abonnementsstand uit de instellingen-rij. Werkt ook vóórdat de
// migratie is gedraaid: bij een ontbrekende kolom of rij vallen we netjes
// terug op de standaard gratis proef. De echte stand komt later van Mollie.
export async function getAbonnement(): Promise<Abonnement> {
  const sb = createClient();
  const { data, error } = await sb
    .from("instellingen")
    .select(ABON_COLS)
    .maybeSingle();

  // Kolommen bestaan nog niet, of er is nog geen rij → standaard proefstand.
  if (error || !data) return nieuwAbonnement();
  return mapAbonnementRow(data as AbonnementRow);
}

// ── KLASSEN (meerdere per leerkracht) ─────────────────────────────────────
const KLAS_COLS = "id, naam, leerlingen, leerlingen_data, actief, created_at";

type KlasRow = {
  id: string;
  naam: string | null;
  leerlingen: string[] | null;
  leerlingen_data: Leerling[] | null;
  actief: boolean | null;
};

function mapKlas(r: KlasRow): Klas {
  const namen = r.leerlingen ?? [];
  const data: Leerling[] =
    Array.isArray(r.leerlingen_data) && r.leerlingen_data.length
      ? r.leerlingen_data
      : namen.map((n) => ({ naam: n, geslacht: "" as const }));
  return {
    id: r.id,
    naam: r.naam ?? "",
    leerlingen: data.map((l) => l.naam),
    leerlingenData: data,
    actief: !!r.actief,
  };
}

export async function getKlassen(): Promise<Klas[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from("klassen")
    .select(KLAS_COLS)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as KlasRow[]).map(mapKlas);
}

export async function addKlas(naam: string): Promise<Klas | null> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { count } = await sb
    .from("klassen")
    .select("id", { count: "exact", head: true });
  const actief = !count; // de eerste klas wordt meteen de actieve
  const { data, error } = await sb
    .from("klassen")
    .insert({ user_id: user.id, naam, leerlingen: [], leerlingen_data: [], actief })
    .select(KLAS_COLS)
    .single();
  if (error || !data) return null;
  return mapKlas(data as KlasRow);
}

export async function saveKlas(
  id: string,
  k: { naam: string; leerlingenData: Leerling[] },
): Promise<boolean> {
  const sb = createClient();
  const namen = k.leerlingenData.map((l) => l.naam);
  const { error } = await sb
    .from("klassen")
    .update({ naam: k.naam, leerlingen: namen, leerlingen_data: k.leerlingenData })
    .eq("id", id);
  return !error;
}

export async function deleteKlas(id: string): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("klassen").delete().eq("id", id);
  return !error;
}

export async function setActieveKlas(id: string): Promise<boolean> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  await sb.from("klassen").update({ actief: false }).eq("user_id", user.id);
  const { error } = await sb.from("klassen").update({ actief: true }).eq("id", id);
  return !error;
}

// ── RAPPORTEN (voor de koppeling met leerling-profielen) ──────────────────
export async function getRapporten(): Promise<Rapport[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from("rapporten")
    .select("naam, verhaal, updated_at");
  if (error || !data) return [];
  return data as Rapport[];
}

// ── TEKSTEN ─────────────────────────────────────────────────────────────
export async function getTeksten(): Promise<Tekst[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from("teksten")
    .select("id, titel, inhoud, created_at")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as Tekst[];
}

export async function addTekst(
  titel: string,
  inhoud: string,
  tool?: string,
): Promise<Tekst | null> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data, error } = await sb
    .from("teksten")
    .insert({ user_id: user.id, titel, inhoud, tool: tool ?? null })
    .select("id, titel, inhoud, created_at")
    .single();
  if (error || !data) return null;
  return data as Tekst;
}

export async function deleteTekst(id: string): Promise<void> {
  const sb = createClient();
  await sb.from("teksten").delete().eq("id", id);
}

// ── BESTANDEN (mappen + bestanden in één boom) ────────────────────────────
export type BestandType = "map" | "tekst" | "plattegrond";
export type Bestand = {
  id: string;
  parent_id: string | null;
  type: BestandType;
  naam: string;
  inhoud: string | null;
  data: unknown | null;
  tool: string | null;
  created_at: string;
  updated_at: string;
};
const BESTAND_COLS =
  "id, parent_id, type, naam, inhoud, data, tool, created_at, updated_at";

export async function getBestanden(): Promise<Bestand[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from("bestanden")
    .select(BESTAND_COLS)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as Bestand[];
}

async function insertBestand(
  velden: Record<string, unknown>,
): Promise<Bestand | null> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data, error } = await sb
    .from("bestanden")
    .insert({ user_id: user.id, ...velden })
    .select(BESTAND_COLS)
    .single();
  if (error || !data) return null;
  return data as Bestand;
}

export async function addMap(
  naam: string,
  parentId: string | null,
): Promise<Bestand | null> {
  return insertBestand({ type: "map", naam, parent_id: parentId });
}

export async function addTekstBestand(
  naam: string,
  inhoud: string,
  parentId: string | null,
): Promise<Bestand | null> {
  return insertBestand({ type: "tekst", naam, inhoud, parent_id: parentId });
}

export async function updateBestand(
  id: string,
  patch: { naam?: string; inhoud?: string; parent_id?: string | null },
): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("bestanden").update(patch).eq("id", id);
  return !error;
}

export async function deleteBestand(id: string): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("bestanden").delete().eq("id", id);
  return !error;
}

// ── STATISTIEK (cumulatieve tellers per gebruiker) ────────────────────────
export type Tellers = Record<string, number>;
export async function getStatistiek(): Promise<Tellers> {
  const sb = createClient();
  const { data, error } = await sb.from("statistiek").select("tellers").maybeSingle();
  if (error || !data) return {};
  return (data.tellers as Tellers) ?? {};
}

// Huidige streak (opeenvolgende werkdagen actief) + je persoonlijke record.
// streak is 0 als de reeks inmiddels verbroken is (zie streakLeeftNog).
export type StreakInfo = { streak: number; record: number };
export async function getStreak(): Promise<StreakInfo> {
  const sb = createClient();
  const { data, error } = await sb
    .from("statistiek")
    .select("streak, streak_max, laatste_actief")
    .maybeSingle();
  if (error || !data) return { streak: 0, record: 0 };
  const opgeslagen = (data.streak as number) ?? 0;
  const record = (data.streak_max as number) ?? 0;
  const laatste = (data.laatste_actief as string | null) ?? null;
  return { streak: streakLeeftNog(laatste, new Date()) ? opgeslagen : 0, record };
}

export type CommunityStats = { gebruikers: number; som: Record<string, number> };
export async function getCommunityStats(): Promise<CommunityStats | null> {
  const sb = createClient();
  const { data, error } = await sb.rpc("wijs_community_stats");
  if (error || !data) return null;
  const d = data as { gebruikers?: number; som?: Record<string, number> };
  return { gebruikers: d.gebruikers ?? 0, som: d.som ?? {} };
}

// ── UITNODIGINGEN (referral) ──────────────────────────────────────────────
function maakRefCode(): string {
  const tekens = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // zonder verwarrende tekens
  let c = "";
  const arr =
    typeof crypto !== "undefined" && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint32Array(7))
      : null;
  for (let i = 0; i < 7; i++) {
    const r = arr ? arr[i] : Math.floor(Math.random() * 1e9);
    c += tekens[r % tekens.length];
  }
  return c;
}

// Geeft je eigen uitnodigingscode terug; maakt 'm aan als die er nog niet is.
export async function getOfMaakRefCode(): Promise<string | null> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("instellingen").select("ref_code").maybeSingle();
  if (data?.ref_code) return data.ref_code as string;
  const code = maakRefCode();
  const { error } = await sb
    .from("instellingen")
    .upsert({ user_id: user.id, ref_code: code }, { onConflict: "user_id" });
  return error ? null : code;
}

// Legt eenmalig vast door wie je bent uitgenodigd (niet jezelf, alleen als nog leeg).
export async function koppelVerwijzing(code: string): Promise<void> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user || !code) return;
  const { data } = await sb
    .from("instellingen")
    .select("ref_code, verwezen_door")
    .maybeSingle();
  if (data?.verwezen_door) return; // al gekoppeld
  if (data?.ref_code === code) return; // niet jezelf
  await sb
    .from("instellingen")
    .upsert({ user_id: user.id, verwezen_door: code }, { onConflict: "user_id" });
}

// Telt hoeveel uitgenodigde collega's een BETALEND abonnement hebben (niet de
// gratis proef). Die fraudebescherming zit in de SQL-functie zelf, zie
// database/schema.sql (wijs_aantal_verwijzingen). Een nepaccount levert dus niets op.
export async function getAantalVerwijzingen(code: string): Promise<number> {
  const sb = createClient();
  if (!code) return 0;
  const { data, error } = await sb.rpc("wijs_aantal_verwijzingen", { code });
  if (error || typeof data !== "number") return 0;
  return data;
}

// Hoeveel uitgenodigde collega's zitten nog in de gratis proef (nog niet betaald)?
// Puur informatief/motiverend; telt niet mee voor de beloning.
export async function getAantalVerwijzingenProef(code: string): Promise<number> {
  const sb = createClient();
  if (!code) return 0;
  const { data, error } = await sb.rpc("wijs_aantal_verwijzingen_proef", { code });
  if (error || typeof data !== "number") return 0;
  return data;
}

// ── ADMIN (aggregaat-statistieken, alleen voor admins) ────────────────────
export type AdminOverzicht = {
  gebruikers: number;
  status: { actief: number; opgezegd: number; verlopen: number };
  plan: { start: number; compleet: number; pro: number };
  verwijzingen: { uitnodigers: number; uitgenodigd: number; betalend: number };
};

export async function getAdminOverzicht(): Promise<AdminOverzicht | null> {
  const sb = createClient();
  const { data, error } = await sb.rpc("wijs_admin_overzicht");
  if (error || !data) return null;
  return data as AdminOverzicht;
}

// AI-verbruik per (tool, model) over de laatste N dagen (alleen admin).
export type VerbruikRij = {
  tool: string;
  model: string;
  calls: number;
  input: number;
  output: number;
  cache_creation: number;
  cache_read: number;
};

export async function getAdminVerbruik(dagen = 30): Promise<VerbruikRij[]> {
  const sb = createClient();
  const { data, error } = await sb.rpc("wijs_admin_verbruik", { dagen });
  if (error || !Array.isArray(data)) return [];
  return data as VerbruikRij[];
}

// Aanmeldingen per maand (groei).
export type GroeiPunt = { maand: string; aantal: number };
export async function getAdminGroei(maanden = 12): Promise<GroeiPunt[]> {
  const sb = createClient();
  const { data, error } = await sb.rpc("wijs_admin_groei", { maanden });
  if (error || !Array.isArray(data)) return [];
  return data as GroeiPunt[];
}

// AI-verbruik per dag + model (voor de kosten-over-tijd-grafiek).
export type VerbruikDag = {
  dag: string;
  model: string;
  input: number;
  output: number;
  cache_creation: number;
  cache_read: number;
};
export async function getAdminVerbruikTijd(dagen = 30): Promise<VerbruikDag[]> {
  const sb = createClient();
  const { data, error } = await sb.rpc("wijs_admin_verbruik_tijd", { dagen });
  if (error || !Array.isArray(data)) return [];
  return data as VerbruikDag[];
}

// Maandelijkse momentopnames van de abonnement-aantallen (voor de omzetgrafiek).
export type AbonSnapshot = {
  maand: string;
  gebruikers: number;
  start: number;
  compleet: number;
  pro: number;
};
export async function getAdminSnapshots(maanden = 12): Promise<AbonSnapshot[]> {
  const sb = createClient();
  const { data, error } = await sb.rpc("wijs_admin_snapshots", { maanden });
  if (error || !Array.isArray(data)) return [];
  return data as AbonSnapshot[];
}

// ── PROEF-FEEDBACK (intentie aan het eind van de proef) ───────────────────
export type ProefIntentie = "zeker" | "twijfel" | "nee";

export async function getProefFeedback(): Promise<{ intentie: ProefIntentie } | null> {
  const sb = createClient();
  const { data } = await sb.from("proef_feedback").select("intentie").maybeSingle();
  return data ? { intentie: data.intentie as ProefIntentie } : null;
}

export async function saveProefFeedback(
  intentie: ProefIntentie,
  categorie: string,
  reden: string,
): Promise<boolean> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  const { error } = await sb.from("proef_feedback").upsert(
    { user_id: user.id, intentie, categorie: categorie.slice(0, 80), reden: reden.slice(0, 1000) },
    { onConflict: "user_id" },
  );
  return !error;
}

// ── ADMIN: conversie (funnel + intentie + redenen) ────────────────────────
export type AdminConversie = {
  funnel: { aangemeld: number; betalend: number; verlopen: number };
  intentie: { zeker: number; twijfel: number; nee: number };
  categorieen: { intentie: ProefIntentie; categorie: string; aantal: number }[];
  redenen: { intentie: ProefIntentie; reden: string; created_at: string }[];
};

export async function getAdminConversie(): Promise<AdminConversie | null> {
  const sb = createClient();
  const { data, error } = await sb.rpc("wijs_admin_conversie");
  if (error || !data) return null;
  return data as AdminConversie;
}

// ── FEEDBACK (algemene in-app feedback via de feedbackknop) ───────────────
export type FeedbackSoort = "idee" | "probleem" | "compliment" | "anders";

export async function saveFeedback(
  soort: FeedbackSoort,
  bericht: string,
  pagina: string,
  categorie = "",
  tool = "",
): Promise<boolean> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  const tekst = bericht.trim();
  const cat = categorie.trim();
  // Een categorie-tik óf een bericht is genoeg.
  if (!tekst && !cat) return false;
  const { error } = await sb.from("feedback").insert({
    user_id: user.id,
    soort,
    bericht: tekst.slice(0, 2000),
    categorie: cat.slice(0, 80),
    tool: tool.slice(0, 40),
    pagina: pagina.slice(0, 200),
  });
  return !error;
}

// ── ADMIN: feedback (tellingen + berichten met inzender voor opvolging) ────
export type FeedbackItem = {
  id: string;
  soort: FeedbackSoort;
  bericht: string;
  pagina: string;
  tool: string;
  categorie: string;
  status: "nieuw" | "afgehandeld";
  created_at: string;
  voornaam: string;
  email: string;
};
export type AdminFeedback = {
  totaal: number;
  open: number;
  per_soort: Partial<Record<FeedbackSoort, number>>;
  per_tool: Record<string, number>;
  categorieen: { tool: string; categorie: string; aantal: number }[];
  items: FeedbackItem[];
};

export async function getAdminFeedback(dagen = 90): Promise<AdminFeedback | null> {
  const sb = createClient();
  const { data, error } = await sb.rpc("wijs_admin_feedback", { dagen });
  if (error || !data) return null;
  return data as AdminFeedback;
}

export async function setFeedbackStatus(
  id: string,
  status: "nieuw" | "afgehandeld",
): Promise<boolean> {
  const sb = createClient();
  const { data, error } = await sb.rpc("wijs_admin_feedback_status", {
    fid: id,
    nieuwe_status: status,
  });
  return !error && data === true;
}

// ── REVIEWS (beloning: een review achterlaten) ────────────────────────────
// Eén review per gebruiker. mag_tonen = toestemming om 'm (met voornaam) op de
// website te laten zien — zo verzamel je echte testimonials van leerkrachten.
export type Review = { sterren: number; tekst: string; magTonen: boolean };

export async function getMijnReview(): Promise<Review | null> {
  const sb = createClient();
  const { data, error } = await sb
    .from("reviews")
    .select("sterren, tekst, mag_tonen")
    .maybeSingle();
  if (error || !data) return null;
  return {
    sterren: (data.sterren as number) ?? 0,
    tekst: (data.tekst as string) ?? "",
    magTonen: !!data.mag_tonen,
  };
}

export async function slaReviewOp(
  sterren: number,
  tekst: string,
  magTonen: boolean,
): Promise<boolean> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  const { error } = await sb
    .from("reviews")
    .upsert(
      { user_id: user.id, sterren, tekst, mag_tonen: magTonen },
      { onConflict: "user_id" },
    );
  return !error;
}

// ── Hulp: nette Nederlandse datum uit een tijdstempel ───────────────────
export function nlDatum(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// ── TAKEN (persoonlijke takenlijst: van to-do naar gedaan) ────────────────
export type Taak = {
  id: string;
  tekst: string;
  gedaan: boolean;
  deadline: string | null;
  wekelijks: boolean;
  created_at: string;
  gedaan_op: string | null;
};

const TAAK_COLS = "id, tekst, gedaan, deadline, wekelijks, created_at, gedaan_op";

export async function getTaken(): Promise<Taak[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from("taken")
    .select(TAAK_COLS)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as Taak[];
}

export async function addTaak(tekst: string): Promise<Taak | null> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const t = tekst.trim();
  if (!t) return null;
  const { data, error } = await sb
    .from("taken")
    .insert({ user_id: user.id, tekst: t.slice(0, 500) })
    .select(TAAK_COLS)
    .single();
  if (error || !data) return null;
  return data as Taak;
}

export async function setTaakGedaan(id: string, gedaan: boolean): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb
    .from("taken")
    .update({ gedaan, gedaan_op: gedaan ? new Date().toISOString() : null })
    .eq("id", id);
  return !error;
}

export async function updateTaakTekst(id: string, tekst: string): Promise<boolean> {
  const sb = createClient();
  const t = tekst.trim();
  if (!t) return false;
  const { error } = await sb.from("taken").update({ tekst: t.slice(0, 500) }).eq("id", id);
  return !error;
}

export async function setTaakDeadline(id: string, deadline: string | null): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("taken").update({ deadline }).eq("id", id);
  return !error;
}

export async function setTaakWekelijks(id: string, wekelijks: boolean): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("taken").update({ wekelijks }).eq("id", id);
  return !error;
}

export async function deleteTaak(id: string): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("taken").delete().eq("id", id);
  return !error;
}

export async function wisAfgevinkteTaken(): Promise<boolean> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  const { error } = await sb.from("taken").delete().eq("user_id", user.id).eq("gedaan", true);
  return !error;
}

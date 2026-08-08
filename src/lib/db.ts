// ════════════════════════════════════════════════════════════════════════
//  Datatoegang voor het dashboard. Praat rechtstreeks met Supabase vanuit de
//  browser; de Row Level Security in de database zorgt dat een leerkracht
//  ALLEEN zijn eigen data kan zien/bewerken. Geen losse server-route nodig:
//  Supabase + RLS ís de beveiligde koppeling.
// ════════════════════════════════════════════════════════════════════════
import { createClient } from "@/utils/supabase/client";
import { streakLeeftNog } from "@/lib/streak";
import { haalStreakVakanties } from "@/lib/planning";
import {
  type Abonnement,
  type AbonnementRow,
  ABON_COLS,
  mapAbonnementRow,
  nieuwAbonnement,
} from "@/lib/abonnement";

export type Voorkeuren = {
  schoolnaam: string;
  // Canonieke schoolkeuze uit het DUO-register (zie /api/scholen). Leeg als de
  // leerkracht zelf typt of de kolommen nog niet bestaan; legt het BRIN vast
  // voor de latere org-laag (schoolkoppeling).
  school_brin: string;
  school_vestiging: string;
  standaardgroep: string;
  toon: string; // warm | neutraal | zakelijk
  taalniveau: string; // standaard | a2 | b1
  lengte: string; // kort | gemiddeld | uitgebreid
  aanspreekvorm: string; // je | u  (alleen Oudercontact)
  communicatie_app: string; // '' | parro | social_schools | schoudercom | basisonline | isy
  communicatie_url: string; // eigen SchouderCom/Isy-webadres (de rest heeft een vast adres)
  lvs_systeem: string; // '' | parnassys | esis — voor de "open in je LVS"-knop
  lvs_url: string; // eigen Esis-webadres (ParnasSys heeft één vast adres)
  toets_systeem: string; // '' | iep | cito | dia | boom | beide
  werkdagen: string; // '' of dagcijfers, 0=maandag t/m 4=vrijdag ('0134')
};
export type Leerling = { naam: string; geslacht: "" | "j" | "m" };
export type Klas = {
  id: string;
  naam: string;
  leerlingen: string[]; // platte namenlijst (afgeleid; voor de tools)
  leerlingenData: Leerling[]; // rijk: naam + geslacht per leerling
  actief: boolean; // eigenaar-eigen "actief"-vlag (alleen betekenisvol als eigenKlas)
  eigenKlas: boolean; // van jou, of een gedeelde klas van je duo-partner?
};
export type Tekst = { id: string; titel: string; inhoud: string; created_at: string };
export type Rapport = { naam: string; verhaal: string; updated_at: string };

// ── INSTELLINGEN ────────────────────────────────────────────────────────
export async function getVoorkeuren(): Promise<Voorkeuren | null> {
  const sb = createClient();
  const { data, error } = await sb
    .from("instellingen")
    .select("schoolnaam, standaardgroep, toon, taalniveau, lengte, aanspreekvorm, communicatie_app")
    .maybeSingle();
  if (error || !data) return null;
  const v: Voorkeuren = {
    schoolnaam: data.schoolnaam ?? "",
    school_brin: "",
    school_vestiging: "",
    standaardgroep: data.standaardgroep ?? "",
    toon: data.toon ?? "warm",
    taalniveau: data.taalniveau ?? "standaard",
    lengte: data.lengte ?? "gemiddeld",
    aanspreekvorm: data.aanspreekvorm ?? "je",
    communicatie_app: (data as { communicatie_app?: string }).communicatie_app ?? "",
    communicatie_url: "",
    lvs_systeem: "",
    lvs_url: "",
    toets_systeem: "",
    werkdagen: "",
  };
  // Best-effort: deze kolommen bestaan mogelijk nog niet (migratie niet
  // gedraaid). Een aparte select faalt dan stilletjes en we houden gewoon "".
  const { data: bd } = await sb
    .from("instellingen")
    .select("school_brin, school_vestiging")
    .maybeSingle();
  if (bd) {
    v.school_brin = (bd as { school_brin?: string }).school_brin ?? "";
    v.school_vestiging = (bd as { school_vestiging?: string }).school_vestiging ?? "";
  }
  const { data: ld } = await sb
    .from("instellingen")
    .select("lvs_systeem, lvs_url, communicatie_url, toets_systeem, werkdagen")
    .maybeSingle();
  if (ld) {
    v.lvs_systeem = (ld as { lvs_systeem?: string }).lvs_systeem ?? "";
    v.lvs_url = (ld as { lvs_url?: string }).lvs_url ?? "";
    v.communicatie_url = (ld as { communicatie_url?: string }).communicatie_url ?? "";
    v.toets_systeem = (ld as { toets_systeem?: string }).toets_systeem ?? "";
    v.werkdagen = (ld as { werkdagen?: string }).werkdagen ?? "";
  }
  return v;
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
  if (!error) return true;
  // Mogelijk bestaan de BRIN- of LVS-kolommen nog niet (migratie niet
  // gedraaid) → opnieuw zonder die velden, zodat het opslaan van de overige
  // voorkeuren nooit stilletjes mislukt.
  const {
    school_brin,
    school_vestiging,
    lvs_systeem,
    lvs_url,
    communicatie_url,
    toets_systeem,
    werkdagen,
    ...kern
  } = v;
  void school_brin;
  void school_vestiging;
  void lvs_systeem;
  void lvs_url;
  void communicatie_url;
  void toets_systeem;
  void werkdagen;
  const { error: e2 } = await sb
    .from("instellingen")
    .upsert({ user_id: user.id, ...kern }, { onConflict: "user_id" });
  return !e2;
}

// ── WELKOM-POP-UP ─────────────────────────────────────────────────────────
// Heeft deze leerkracht de eenmalige welkomstpop-up al gezien? Staat als
// tijdstempel in de instellingen-rij, zodat 'ie precies één keer per account
// verschijnt (op elk apparaat). Bestaat de kolom nog niet, dan valt de select
// stilletjes terug op "nog niet gezien" en mag de pop-up gewoon verschijnen.
export async function getWelkomGezien(): Promise<boolean> {
  const sb = createClient();
  const { data, error } = await sb.from("instellingen").select("welkom_gezien").maybeSingle();
  if (error || !data) return false;
  return !!(data as { welkom_gezien?: string | null }).welkom_gezien;
}

export async function markWelkomGezien(): Promise<void> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return;
  await sb
    .from("instellingen")
    .upsert(
      { user_id: user.id, welkom_gezien: new Date().toISOString() },
      { onConflict: "user_id" },
    );
}

// ── HER-AKKOORD (voorwaarden/privacy bijgewerkt) ──────────────────────────
/**
 * Heeft deze leerkracht de huidige versies van de voorwaarden en de
 * privacyverklaring OOIT geaccepteerd? Zo ja, dan hoeft de pop-up niet.
 *
 * 🔑 Bewust "ooit", niet "als laatste". Dit keek eerst alleen naar de nieuwste
 * rij in de bewijstabel, en dat brak zodra er ná een goed akkoord nog een rij
 * met oudere versienummers binnenkwam: dan stond de pop-up er weer, ook al was
 * er allang getekend. Dat gebeurde echt — twee dev-servers naast elkaar op
 * verschillende branches (poort 3000 en 3001) hadden verschillende versies in
 * juridisch.ts staan, dus ze stuurden elkaar om beurten terug naar de pop-up.
 *
 * En het is ook gewoon juister: dat je op 5 augustus akkoord ging met versie X
 * is een feit dat niet vervalt doordat je daarna nog ergens anders klikt. De
 * tabel is append-only en bewaart elk akkoord, dus we kunnen dat feit gewoon
 * opzoeken in plaats van alleen naar de laatste regel te kijken.
 */
export async function heeftToestemmingVoor(
  voorwaardenVersie: string,
  privacyVersie: string,
): Promise<{ actueel: boolean; eersteKeer: boolean }> {
  const sb = createClient();
  const { data, error } = await sb
    .from("toestemmingen")
    .select("voorwaarden_versie, privacy_versie");
  // Bij een fout níét doen alsof er niets is vastgelegd: dan zou een haperend
  // netwerk iedereen een verplichte pop-up geven. Even niets tonen is beter;
  // de volgende keer inloggen vraagt het alsnog.
  if (error) {
    console.error("toestemmingen lezen mislukt:", error.message);
    return { actueel: true, eersteKeer: false };
  }
  const rijen = (data ?? []) as { voorwaarden_versie?: string; privacy_versie?: string }[];
  return {
    actueel:
      rijen.some((r) => r.voorwaarden_versie === voorwaardenVersie) &&
      rijen.some((r) => r.privacy_versie === privacyVersie),
    eersteKeer: rijen.length === 0,
  };
}

// Legt een nieuw akkoord vast nadat de voorwaarden/privacy zijn gewijzigd. Schrijft
// via een SECURITY DEFINER-functie naar de append-only bewijstabel (de app mag daar
// niet rechtstreeks in schrijven; alleen de trigger + deze functie vullen 'm).
export async function registreerHerAkkoord(
  voorwaardenVersie: string,
  privacyVersie: string,
): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.rpc("registreer_herakkoord", {
    p_voorwaarden: voorwaardenVersie,
    p_privacy: privacyVersie,
  });
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
const KLAS_COLS = "id, naam, leerlingen, leerlingen_data, actief, created_at, user_id";

type KlasRow = {
  id: string;
  naam: string | null;
  leerlingen: string[] | null;
  leerlingen_data: Leerling[] | null;
  actief: boolean | null;
  user_id: string;
};

function mapKlas(r: KlasRow, mijnId: string): Klas {
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
    eigenKlas: r.user_id === mijnId,
  };
}

// Geeft ook de klas(sen) van een actieve duo-partner terug (RLS staat dat
// toe, zie "duo-partner klas" in schema.sql) — eigenKlas onderscheidt ze.
export async function getKlassen(): Promise<Klas[]> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return [];
  const { data, error } = await sb
    .from("klassen")
    .select(KLAS_COLS)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as KlasRow[]).map((r) => mapKlas(r, user.id));
}

export async function addKlas(naam: string): Promise<Klas | null> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  // Alleen je EIGEN klassen tellen mee voor "is dit de eerste" en het
  // pakketlimiet — een gedeelde duo-klas van je partner hoort daar niet bij.
  const { count } = await sb
    .from("klassen")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  const actief = !count; // de eerste eigen klas wordt meteen de actieve
  const { data, error } = await sb
    .from("klassen")
    .insert({ user_id: user.id, naam, leerlingen: [], leerlingen_data: [], actief })
    .select(KLAS_COLS)
    .single();
  if (error || !data) return null;
  return mapKlas(data as KlasRow, user.id);
}

// ⚠️ Let op de `.select()` achter de update, en haal die er nooit af.
// Een update die door RLS wordt tegengehouden raakt NUL rijen en dat is voor
// Postgres geen fout: `error` blijft leeg en dit gaf dus "gelukt" terug terwijl
// er niets was opgeslagen. Een meekijkende collega kreeg zo een kind aan de
// klas toegevoegd te zien, met een "Bewaard"-melding erbij, en na herladen was
// het weg. Door de gewijzigde rij op te vragen weet je het echt: geen rij terug
// betekent niet opgeslagen.
export async function saveKlas(
  id: string,
  k: { naam: string; leerlingenData: Leerling[] },
): Promise<boolean> {
  const sb = createClient();
  const namen = k.leerlingenData.map((l) => l.naam);
  const { data, error } = await sb
    .from("klassen")
    .update({ naam: k.naam, leerlingen: namen, leerlingen_data: k.leerlingenData })
    .eq("id", id)
    .select("id");
  return !error && Array.isArray(data) && data.length > 0;
}

// Mag ik deze groep bewerken? Je eigen klas altijd; een gedeelde groep alleen
// met de rol 'volledig'. Zelfde bron als de database gebruikt, zodat het
// scherm en het slot niet uit elkaar kunnen lopen.
export async function magKlasBewerken(klasId: string): Promise<boolean> {
  const sb = createClient();
  const { data, error } = await sb.rpc("klas_toegang_volledig", { p_klas: klasId });
  return !error && data === true;
}

// Zelfde valkuil als bij saveKlas: een delete die RLS tegenhoudt raakt nul
// rijen zonder fout. Vandaar ook hier de .select().
export async function deleteKlas(id: string): Promise<boolean> {
  const sb = createClient();
  const { data, error } = await sb.from("klassen").delete().eq("id", id).select("id");
  if (!error && Array.isArray(data) && data.length === 0) return false;
  return !error;
}

// Een EIGEN klas activeren blijft de oude klassen.actief-vlag gebruiken.
// Een GEDEELDE (duo-partner) klas activeren raakt die rij bewust niet aan —
// die vlag hoort bij de eigenaar en zou anders bij hén ongemerkt omklappen.
// In plaats daarvan onthoudt je eigen instellingen-rij welke gedeelde klas
// voor JOU actief is (actieve_duo_klas_id, zie schema.sql sectie 19).
export async function setActieveKlas(klas: Klas): Promise<boolean> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  if (klas.eigenKlas) {
    await sb.from("klassen").update({ actief: false }).eq("user_id", user.id);
    const { error } = await sb.from("klassen").update({ actief: true }).eq("id", klas.id);
    if (error) return false;
    // Eigen klas gekozen: een eerder ingestelde gedeelde-klas-voorkeur vervalt.
    await sb
      .from("instellingen")
      .upsert({ user_id: user.id, actieve_duo_klas_id: null }, { onConflict: "user_id" });
    return true;
  }
  const { error } = await sb
    .from("instellingen")
    .upsert({ user_id: user.id, actieve_duo_klas_id: klas.id }, { onConflict: "user_id" });
  return !error;
}

// Welke klas is voor MIJ actief? Voorkeur voor een gekozen gedeelde
// duo-klas; anders de gewone eigen-klas-volgorde (klassen.actief).
export async function getActieveKlasId(klassen: Klas[]): Promise<string | null> {
  const sb = createClient();
  const { data } = await sb.from("instellingen").select("actieve_duo_klas_id").maybeSingle();
  const duoId = data?.actieve_duo_klas_id as string | null | undefined;
  if (duoId && klassen.some((k) => k.id === duoId)) return duoId;
  return (klassen.find((k) => k.eigenKlas && k.actief) ?? klassen[0])?.id ?? null;
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
export type BestandType = "map" | "tekst" | "plattegrond" | "les";
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

// Opgetelde bespaarde minuten per soort (adaptief opgebouwd door de tools).
export async function getMinuten(): Promise<Tellers> {
  const sb = createClient();
  const { data, error } = await sb.from("statistiek").select("minuten").maybeSingle();
  if (error || !data) return {};
  return (data.minuten as Tellers) ?? {};
}

// Bespaarde tijd + acties per dag, voor de periode-filters (vandaag/week/maand/
// schooljaar) op de statistiekenpagina. Map: 'YYYY-MM-DD' → { m: minuten, n: acties }.
export type PerDag = Record<string, { m: number; n: number }>;
export async function getPerDag(): Promise<PerDag> {
  const sb = createClient();
  const { data, error } = await sb.from("statistiek").select("per_dag").maybeSingle();
  if (error || !data) return {};
  return (data.per_dag as PerDag) ?? {};
}

// Huidige streak (opeenvolgende schooldagen actief) + je persoonlijke record +
// verdiende vrijstellingen (vangen een gemiste schooldag op, zie streak.ts).
// streak is 0 als de reeks inmiddels verbroken is (zie streakLeeftNog).
export type StreakInfo = { streak: number; record: number; freezes: number };
export async function getStreak(): Promise<StreakInfo> {
  const sb = createClient();
  const { data, error } = await sb
    .from("statistiek")
    .select("streak, streak_max, streak_freezes, laatste_actief")
    .maybeSingle();
  if (error || !data) return { streak: 0, record: 0, freezes: 0 };
  const opgeslagen = (data.streak as number) ?? 0;
  const record = (data.streak_max as number) ?? 0;
  const freezes = (data.streak_freezes as number) ?? 0;
  const laatste = (data.laatste_actief as string | null) ?? null;
  const vakanties = await haalStreakVakanties(sb);
  return { streak: streakLeeftNog(laatste, new Date(), vakanties) ? opgeslagen : 0, record, freezes };
}

export type CommunityStats = {
  gebruikers: number;
  som: Record<string, number>; // aantallen per soort, over alle gebruikers
  somMinuten: Record<string, number>; // bespaarde minuten per soort, over alle gebruikers
  gemActieveWeek: number; // gemiddelde bespaarde minuten per gebruiker per actieve week
  actieveWeken: number; // aantal (gebruiker × week)-meetpunten met activiteit (voor de drempel)
  hoogsteStreak: number; // langste streak ooit binnen de community
};
export async function getCommunityStats(): Promise<CommunityStats | null> {
  const sb = createClient();
  const { data, error } = await sb.rpc("wijs_community_stats");
  if (error || !data) return null;
  const d = data as {
    gebruikers?: number;
    som?: Record<string, number>;
    som_minuten?: Record<string, number>;
    gem_actieve_week?: number;
    actieve_weken?: number;
    hoogste_streak?: number;
  };
  return {
    gebruikers: d.gebruikers ?? 0,
    som: d.som ?? {},
    somMinuten: d.som_minuten ?? {},
    gemActieveWeek: d.gem_actieve_week ?? 0,
    actieveWeken: d.actieve_weken ?? 0,
    hoogsteStreak: d.hoogste_streak ?? 0,
  };
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

// Geeft je eigen uitnodigingscode terug; de DATABASE maakt 'm aan als die er nog
// niet is. ⚠️ Bewust niet meer hier verzonnen en weggeschreven: `ref_code` staat
// achter het fraude-slot (database/migratie-fraude-slot.sql), zodat niemand zijn
// code zelf kan kiezen of die van een ander kan overnemen.
export async function getOfMaakRefCode(): Promise<string | null> {
  const sb = createClient();
  const { data, error } = await sb.rpc("wijs_ref_code");
  if (error || typeof data !== "string") return null;
  return data;
}

// Legt eenmalig vast door wie je bent uitgenodigd. Alle controles zitten in de
// database (wijs_koppel_verwijzing): één keer, nooit je eigen code, de code moet
// bestaan, en alleen binnen 30 dagen na je aanmelding. Geeft terug of het is
// gelukt; false is een gewone uitkomst (link te laat gebruikt, al gekoppeld).
export async function koppelVerwijzing(code: string): Promise<boolean> {
  const sb = createClient();
  if (!code) return false;
  const { data, error } = await sb.rpc("wijs_koppel_verwijzing", { p_code: code });
  return !error && data === true;
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

// ── DUO-COLLEGA'S (samen één klas draaien) ────────────────────────────────
// Zelfde uitnodig-via-code-principe als hierboven (referral), maar
// tweezijdig: pas na expliciete acceptatie door de uitgenodigde krijgt die
// toegang (RLS ziet de rij pas als hij status='actief' heeft, zie
// database/schema.sql sectie 19). Geen automatische koppeling.
export type DuoRol = "volledig" | "meekijken";

export type DuoKoppel = {
  id: string;
  klasId: string;
  klasNaam: string;
  status: "uitgenodigd" | "actief";
  rol: DuoRol;
  code: string | null;
  benIkUitnodiger: boolean; // ben ik gebruiker_a (heb ik 'm aangemaakt)?
  partnerId: string | null; // de collega (null zolang nog uitgenodigd)
};

// Iemand die bij een groep hoort: de eigenaar of een gekoppelde collega.
export type KlasCollega = {
  userId: string;
  voornaam: string;
  email: string;
  rol: DuoRol;
  isEigenaar: boolean;
};

const DUO_KOPPEL_COLS = "id, gebruiker_a, gebruiker_b, klas_id, status, rol, code, klassen(naam)";

type DuoKoppelRow = {
  id: string;
  gebruiker_a: string;
  gebruiker_b: string | null;
  klas_id: string;
  status: "uitgenodigd" | "actief";
  rol: DuoRol;
  code: string | null;
  klassen: { naam: string } | { naam: string }[] | null;
};

function mapDuoKoppel(r: DuoKoppelRow, mijnId: string): DuoKoppel {
  const klas = Array.isArray(r.klassen) ? r.klassen[0] : r.klassen;
  return {
    id: r.id,
    klasId: r.klas_id,
    klasNaam: klas?.naam ?? "",
    status: r.status,
    rol: r.rol ?? "volledig",
    code: r.code,
    benIkUitnodiger: r.gebruiker_a === mijnId,
    partnerId: r.gebruiker_a === mijnId ? r.gebruiker_b : r.gebruiker_a,
  };
}

// Iedereen die bij deze groep hoort, mét naam en mailadres. Komt uit een
// security-definer functie, want `auth.users` is niet leesbaar voor gewone
// gebruikers (zie schema.sql). Dit is de bron voor "aan wie kun je een taak
// toewijzen" en voor het lijstje in Instellingen.
export async function getKlasCollegas(klasId: string): Promise<KlasCollega[]> {
  const sb = createClient();
  const { data, error } = await sb.rpc("klas_collegas", { p_klas: klasId });
  if (error || !Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map((r) => ({
    userId: r.user_id as string,
    voornaam: (r.voornaam as string) || "",
    email: (r.email as string) || "",
    rol: ((r.rol as string) || "volledig") as DuoRol,
    isEigenaar: !!r.is_eigenaar,
  }));
}

// Al je duo-koppels (verzonden én ontvangen, uitgenodigd én actief) — RLS
// laat alleen zien waar jij zelf gebruiker_a of gebruiker_b van bent.
export async function getDuoKoppels(): Promise<DuoKoppel[]> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return [];
  const { data, error } = await sb
    .from("duo_koppels")
    .select(DUO_KOPPEL_COLS)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as unknown as DuoKoppelRow[]).map((r) => mapDuoKoppel(r, user.id));
}

// De groepen die je met iemand deelt (als eigenaar óf als collega), elk één
// keer. Basis voor de gedeelde takenlijst en de overdracht: die horen bij de
// groep, niet bij een koppeling.
export async function getGedeeldeKlassen(): Promise<{ klasId: string; klasNaam: string }[]> {
  const koppels = await getDuoKoppels();
  const uniek = new Map<string, string>();
  koppels
    .filter((k) => k.status === "actief")
    .forEach((k) => uniek.set(k.klasId, k.klasNaam));
  return [...uniek].map(([klasId, klasNaam]) => ({ klasId, klasNaam }));
}

// Maakt een nieuwe uitnodiging voor de gekozen klas en geeft de deelbare
// code terug. De uitgenodigde vult die zelf in (of via een link).
//
// Meerdere uitnodigingen tegelijk mogen: je kunt je duo-partner én een
// assistent in één keer vragen. Elke uitnodiging krijgt zijn eigen code, met
// de rol die je erbij kiest.
export async function maakDuoUitnodiging(
  klasId: string,
  rol: DuoRol = "volledig",
): Promise<string | null> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user || !klasId) return null;
  const code = maakRefCode();
  const { error } = await sb
    .from("duo_koppels")
    .insert({ gebruiker_a: user.id, klas_id: klasId, code, rol, status: "uitgenodigd" });
  return error ? null : code;
}

// Rol van een collega wijzigen. Alleen de eigenaar van de klas mag dit (RLS);
// zou een meekijker zijn eigen rij mogen bijwerken, dan kon hij zichzelf
// promoveren tot 'volledig' en alsnog bij de rapporten.
export async function zetDuoRol(koppelId: string, rol: DuoRol): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("duo_koppels").update({ rol }).eq("id", koppelId);
  return !error;
}

export type DuoUitnodiging = {
  klasNaam: string;
  status: string;
  /* Is deze uitnodiging aan JOUW mailadres gekoppeld? Bij een uitnodiging die
     per mail is verstuurd mag alleen dat adres hem accepteren; bij een link
     die iemand zelf doorstuurde staat dit altijd op waar. Bewust een ja/nee:
     bij de verkeerde persoon hoeft de link niet ook nog te verklappen voor
     wie hij bedoeld was. */
  pastBijMij: boolean;
  /* Voornaam van de uitnodiger. Leeg als die geen voornaam heeft ingevuld;
     de pop-up valt dan terug op "Een collega". */
  uitnodigerVoornaam: string;
  /* School en groep van de uitnodiger: wat je overneemt als je accepteert.
     Leeg betekent dat de uitnodiger ze zelf nog niet heeft ingevuld. */
  schoolnaam: string;
  standaardgroep: string;
};

// Voorbeeld van een uitnodiging op basis van de code, vóór acceptatie —
// via security-definer RPC (RLS laat de rij zelf nog niet zien, zie schema.sql).
export async function bekijkDuoUitnodiging(
  code: string,
): Promise<DuoUitnodiging | null> {
  const sb = createClient();
  const c = code.trim().toUpperCase();
  if (!c) return null;
  const { data, error } = await sb.rpc("duo_koppel_voorbeeld", { p_code: c });
  const rij = Array.isArray(data) ? data[0] : data;
  if (error || !rij) return null;
  return {
    klasNaam: rij.klas_naam as string,
    status: rij.status as string,
    uitnodigerVoornaam: ((rij.uitnodiger_voornaam as string) || "").trim(),
    schoolnaam: ((rij.schoolnaam as string) || "").trim(),
    standaardgroep: ((rij.standaardgroep as string) || "").trim(),
    // Kent de database het veld nog niet (migratie niet gedraaid), dan niet
    // blokkeren: dan gedraagt alles zich als vóór de mailuitnodiging.
    pastBijMij: rij.past_bij_mij !== false,
  };
}

// Accepteert de uitnodiging — pas hierna krijg je (en de uitnodiger, over en
// weer) toegang tot de gedeelde klas/rapporten/bestanden/taken/overdracht.
export async function accepteerDuoUitnodiging(code: string): Promise<boolean> {
  const sb = createClient();
  const c = code.trim().toUpperCase();
  if (!c) return false;
  const { data, error } = await sb.rpc("duo_koppel_accepteren", { p_code: c });
  return !error && !!data;
}

// Loskoppelen (door wie dan ook van de twee) — sluit alle gedeelde toegang
// meteen af, RLS is live.
export async function verbreekDuo(id: string): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("duo_koppels").delete().eq("id", id);
  return !error;
}

// De gedeelde map hoort bij de GROEP, niet bij een koppeling: met drie mensen
// wil je één gedeelde map. Staat daarom op `klassen`.
// ⚠️ Met `.select()`, net als saveKlas en deleteKlas. Zonder dat is dit een
// STILLE MISLUKKING: een update die RLS tegenhoudt raakt nul rijen en geeft
// géén fout, dus `!error` was altijd waar. Een meekijker maakte zo een map aan
// die vervolgens nergens aan gekoppeld werd, en het scherm zei dat het gelukt
// was. Gevonden door de eigenaar, 8-8-2026.
export async function zetGedeeldeMap(klasId: string, mapId: string | null): Promise<boolean> {
  const sb = createClient();
  const { data, error } = await sb
    .from("klassen")
    .update({ gedeelde_map_id: mapId })
    .eq("id", klasId)
    .select("id");
  return !error && Array.isArray(data) && data.length > 0;
}

export async function getGedeeldeMap(
  klasId: string,
): Promise<{ id: string; naam: string } | null> {
  const sb = createClient();
  const { data, error } = await sb
    .from("klassen")
    .select("gedeelde_map_id, bestanden(naam)")
    .eq("id", klasId)
    .maybeSingle();
  if (error || !data?.gedeelde_map_id) return null;
  const b = data.bestanden as { naam: string } | { naam: string }[] | null;
  const map = Array.isArray(b) ? b[0] : b;
  return { id: data.gedeelde_map_id as string, naam: map?.naam ?? "" };
}

// Je eigen user-id — handig in duo-UI om "is dit van mij of mijn partner"
// te bepalen zonder overal opnieuw sb.auth.getUser() te doen.
export async function getMijnGebruikerId(): Promise<string | null> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user?.id ?? null;
}

// ── GEDEELDE TAKEN (per groep) ────────────────────────────────────────────
// Losse tabel, naast je eigen persoonlijke takenlijst (taken) — raakt die
// niet aan. Simpel gehouden: geen deadline/herhaal-systeem, alleen tekst +
// afvinken + wie het doet.
//
// ⚠️ Hangt aan de KLAS, niet aan een koppeling: hoor je met z'n drieën bij
// dezelfde groep, dan is er één lijst die jullie alle drie zien.
export type DuoTaak = {
  id: string;
  klasId: string;
  tekst: string;
  gedaan: boolean;
  toegewezenAan: string | null;
  createdAt: string;
};

const DUO_TAAK_COLS = "id, klas_id, tekst, gedaan, toegewezen_aan, created_at";

type DuoTaakRow = {
  id: string;
  klas_id: string;
  tekst: string;
  gedaan: boolean;
  toegewezen_aan: string | null;
  created_at: string;
};

function mapDuoTaak(r: DuoTaakRow): DuoTaak {
  return {
    id: r.id,
    klasId: r.klas_id,
    tekst: r.tekst,
    gedaan: r.gedaan,
    toegewezenAan: r.toegewezen_aan,
    createdAt: r.created_at,
  };
}

export async function getDuoTaken(klasId: string): Promise<DuoTaak[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from("duo_taken")
    .select(DUO_TAAK_COLS)
    .eq("klas_id", klasId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as DuoTaakRow[]).map(mapDuoTaak);
}

// Alle gedeelde taken van álle groepen waar je bij hoort, in één keer. Voor het
// startscherm: RLS levert vanzelf alleen de groepen waar je aan hangt.
export async function getAlleDuoTaken(): Promise<DuoTaak[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from("duo_taken")
    .select(DUO_TAAK_COLS)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as DuoTaakRow[]).map(mapDuoTaak);
}

export async function addDuoTaak(klasId: string, tekst: string): Promise<DuoTaak | null> {
  const sb = createClient();
  const t = tekst.trim();
  if (!t) return null;
  const { data, error } = await sb
    .from("duo_taken")
    .insert({ klas_id: klasId, tekst: t.slice(0, 500) })
    .select(DUO_TAAK_COLS)
    .single();
  if (error || !data) return null;
  return mapDuoTaak(data as DuoTaakRow);
}

export async function setDuoTaakGedaan(id: string, gedaan: boolean): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("duo_taken").update({ gedaan }).eq("id", id);
  return !error;
}

// wie: het user-id van een collega bij die groep, of null = niemand aangetikt
// (dan verschijnt de taak bij iedereen op Start).
export async function setDuoTaakToegewezen(id: string, wie: string | null): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("duo_taken").update({ toegewezen_aan: wie }).eq("id", id);
  return !error;
}

export async function deleteDuoTaak(id: string): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("duo_taken").delete().eq("id", id);
  return !error;
}

// ── OVERDRACHT (op Start, voor de collega's van deze groep) ───────────────
// Bewust ÉÉN rij per groep (zie schema.sql) — elke nieuwe overdracht
// overschrijft de vorige, er ontstaat geen archief van kind-specifieke
// opmerkingen. Nooit bijzondere persoonsgegevens (medisch, gezinssituatie).
export type DuoOverdracht = { tekst: string; auteur: string; bijgewerkt: string };

// Alle overdracht-berichten van deze groep: één per persoon, nieuwste eerst. Je
// ziet dus wie wat schreef, maar er groeit geen gesprek — ieders nieuwe bericht
// vervangt zijn eigen vorige.
export async function getDuoOverdrachten(klasId: string): Promise<DuoOverdracht[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from("duo_overdracht")
    .select("tekst, auteur, bijgewerkt")
    .eq("klas_id", klasId)
    .order("bijgewerkt", { ascending: false });
  if (error || !data) return [];
  return data as DuoOverdracht[];
}

// Wanneer heb jij de overdracht van deze groep voor het laatst gelezen? Leeg =
// nog nooit, dan is alles van je collega's nieuw.
export async function getOverdrachtGelezen(klasId: string): Promise<string | null> {
  const sb = createClient();
  const { data, error } = await sb
    .from("duo_overdracht_gelezen")
    .select("gelezen_op")
    .eq("klas_id", klasId)
    .maybeSingle();
  if (error || !data) return null;
  return data.gelezen_op as string;
}

export async function markeerOverdrachtGelezen(klasId: string): Promise<boolean> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  const { error } = await sb
    .from("duo_overdracht_gelezen")
    .upsert(
      { klas_id: klasId, user_id: user.id, gelezen_op: new Date().toISOString() },
      { onConflict: "klas_id,user_id" },
    );
  return !error;
}

export async function zetDuoOverdracht(klasId: string, tekst: string): Promise<boolean> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  const { error } = await sb
    .from("duo_overdracht")
    .upsert(
      { klas_id: klasId, tekst, auteur: user.id, bijgewerkt: new Date().toISOString() },
      { onConflict: "klas_id,auteur" },
    );
  return !error;
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

// Tijdwinst-aggregaat over alle gebruikers (uitgebreidere versie van het
// community-blok). Alleen admin; null als je geen admin bent.
export type TijdwinstSoort = { soort: string; minuten: number; acties: number };
export type TijdwinstDag = { dag: string; minuten: number; acties: number };
export type AdminTijdwinst = {
  totaal_minuten: number;
  totaal_acties: number;
  gebruikers: number;
  gebruikers_actief: number;
  per_soort: TijdwinstSoort[];
  per_dag: TijdwinstDag[];
  gem_actieve_week: number;
  actieve_weken: number;
};
export async function getAdminTijdwinst(dagen = 30): Promise<AdminTijdwinst | null> {
  const sb = createClient();
  const { data, error } = await sb.rpc("wijs_admin_tijdwinst", { dagen });
  if (error || !data) return null;
  return data as AdminTijdwinst;
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

// ── BÈTA "EIGEN SCHOOLSJABLOON" (Toetsanalyse, IEP en Cito) ────────────────
// Werkt alleen betrouwbaar bij sjablonen die van tevoren zijn getest, dus
// standaard uit; de eigenaar zet het per account handmatig aan op e-mailadres.
export async function getBetaEigenFormatLijst(): Promise<string[] | null> {
  const sb = createClient();
  const { data, error } = await sb.rpc("wijs_admin_beta_eigen_format_lijst");
  if (error || !data) return null;
  return (data as { email: string }[]).map((r) => r.email);
}

export async function zetBetaEigenFormat(email: string, aan: boolean): Promise<boolean> {
  const sb = createClient();
  const { data, error } = await sb.rpc("wijs_admin_zet_beta_eigen_format", {
    doel_email: email,
    aan,
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
  /** De naam van de activiteit waar deze taak bij hoort ("Verkeersexamen"),
   *  als je 'm zo hebt toegevoegd vanuit "Wat eraan komt". Taken met hetzelfde
   *  kopje staan in TakenView bij elkaar. Losse taken hebben dit niet. */
  kopje: string | null;
};

const TAAK_COLS = "id, tekst, gedaan, deadline, wekelijks, created_at, gedaan_op, kopje";

export async function getTaken(): Promise<Taak[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from("taken")
    .select(TAAK_COLS)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as Taak[];
}

export async function addTaak(
  tekst: string,
  kopje?: string | null,
  deadline?: string | null,
): Promise<Taak | null> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const t = tekst.trim();
  if (!t) return null;
  const { data, error } = await sb
    .from("taken")
    .insert({
      user_id: user.id,
      tekst: t.slice(0, 500),
      kopje: kopje?.trim() || null,
      ...(deadline ? { deadline } : {}),
    })
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

// ── BOUW-TAKEN (admin: "nog te bouwen voor de website") ───────────────────
// Aparte backlog in de admin-module, los van de persoonlijke takenlijst hierboven.
// Alleen admins (RLS via wijs_is_admin); gaat nooit naar AI.
export type Prioriteit = "hoog" | "normaal" | "laag";
export type BouwCategorie = "algemeen" | "tools" | "klein";
export type BouwTaak = {
  id: string;
  tekst: string;
  gedaan: boolean;
  prioriteit: Prioriteit;
  categorie: BouwCategorie;
  created_at: string;
  gedaan_op: string | null;
};

const BOUWTAAK_COLS = "id, tekst, gedaan, prioriteit, categorie, created_at, gedaan_op";

export async function getBouwTaken(): Promise<BouwTaak[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from("bouw_taken")
    .select(BOUWTAAK_COLS)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as BouwTaak[];
}

export async function addBouwTaak(
  tekst: string,
  categorie: BouwCategorie = "algemeen",
): Promise<BouwTaak | null> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const t = tekst.trim();
  if (!t) return null;
  const { data, error } = await sb
    .from("bouw_taken")
    .insert({ user_id: user.id, tekst: t.slice(0, 500), categorie })
    .select(BOUWTAAK_COLS)
    .single();
  if (error || !data) return null;
  return data as BouwTaak;
}

export async function setBouwTaakGedaan(id: string, gedaan: boolean): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb
    .from("bouw_taken")
    .update({ gedaan, gedaan_op: gedaan ? new Date().toISOString() : null })
    .eq("id", id);
  return !error;
}

export async function updateBouwTaakTekst(id: string, tekst: string): Promise<boolean> {
  const sb = createClient();
  const t = tekst.trim();
  if (!t) return false;
  const { error } = await sb.from("bouw_taken").update({ tekst: t.slice(0, 500) }).eq("id", id);
  return !error;
}

export async function setBouwTaakPrioriteit(id: string, prioriteit: Prioriteit): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("bouw_taken").update({ prioriteit }).eq("id", id);
  return !error;
}

export async function deleteBouwTaak(id: string): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("bouw_taken").delete().eq("id", id);
  return !error;
}

export async function wisAfgevinkteBouwTaken(categorie?: BouwCategorie): Promise<boolean> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  let q = sb.from("bouw_taken").delete().eq("user_id", user.id).eq("gedaan", true);
  if (categorie) q = q.eq("categorie", categorie);
  const { error } = await q;
  return !error;
}

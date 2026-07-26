"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import {
  kleurVoor,
  naarBlokken,
  randKleur,
  rasterGrenzen,
  schikDag,
  type Basisrooster,
  type RoosterSetup,
} from "@/lib/planning/rooster";
import { genereerLessen } from "@/lib/planning/genereer";
import type { Roosterblok } from "@/lib/planning/types";

// De bewerkstand van het basisrooster: je vaste lesweek als sjabloon (ma–vr,
// zonder datums en zonder agenda — want je bewerkt het weekelijkse rooster, niet
// één concrete week). Alles in ditzelfde scherm, in de Avinka-stijl.
//
// Bewust GEEN automatisch opslaan: je wijzigt vrij, kunt ongedaan maken, en
// bewaart pas als je klaar bent. Klik een blok en er vouwt een kaartje open met
// de opties; klik ernaast en het sluit weer.
//
// Volgende stap: verslepen (verplaatsen en langer/korter door te slepen).

const DAGNAMEN = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag"];
const DAG_ID = ["ma", "di", "wo", "do", "vr"]; // weekdag-nummer → zoals de tool bewaart

// Terugval-vakken voor het toevoegen, als een rooster (zeldzaam) geen eigen
// vakkenlijst heeft meegekregen. Zelfde ids als de kleurencatalogus.
const STANDAARD_VAKKEN: { id: string; naam: string }[] = [
  { id: "dagopening", naam: "Dagopening" },
  { id: "rekenen", naam: "Rekenen" },
  { id: "taal", naam: "Taal" },
  { id: "spelling", naam: "Spelling" },
  { id: "tlezen", naam: "Technisch lezen" },
  { id: "blezen", naam: "Begrijpend lezen" },
  { id: "schrijven", naam: "Schrijven" },
  { id: "wo", naam: "Wereldoriëntatie" },
  { id: "engels", naam: "Engels" },
  { id: "creatief", naam: "Creatief" },
  { id: "muziek", naam: "Muziek" },
  { id: "seo", naam: "Sociaal-emotioneel" },
  { id: "verkeer", naam: "Verkeer" },
  { id: "gym", naam: "Gym" },
];

/** Ronden op 5 minuten, zodat slepen netjes "klikt". */
function snap5(m: number): number {
  return Math.round(m / 5) * 5;
}


// De standaardvakken voor de instellingen: met een gebruikelijke lengte en het
// dagdeel waarin ze bij voorkeur vallen (gebruikt door de generator). Gym en
// pauze zitten hier niet in — die zijn vaste blokken, geen te verdelen les.
const VAK_CATALOGUS: {
  id: string;
  naam: string;
  duur: number;
  ochtend?: boolean;
  zwaar?: boolean;
  middag?: boolean;
  ontspan?: boolean;
}[] = [
  { id: "dagopening", naam: "Dagopening", duur: 15, ochtend: true },
  { id: "rekenen", naam: "Rekenen", duur: 45, zwaar: true },
  { id: "taal", naam: "Taal", duur: 45, zwaar: true },
  { id: "spelling", naam: "Spelling", duur: 30, zwaar: true },
  { id: "tlezen", naam: "Technisch lezen", duur: 30 },
  { id: "blezen", naam: "Begrijpend lezen", duur: 45, zwaar: true, middag: true },
  { id: "schrijven", naam: "Schrijven", duur: 30 },
  { id: "wo", naam: "Wereldoriëntatie", duur: 45, middag: true },
  { id: "engels", naam: "Engels", duur: 30 },
  { id: "creatief", naam: "Creatief", duur: 60, ontspan: true, middag: true },
  { id: "muziek", naam: "Muziek", duur: 30, ontspan: true, middag: true },
  { id: "seo", naam: "Sociaal-emotioneel", duur: 30, middag: true },
  { id: "verkeer", naam: "Verkeer", duur: 30, middag: true },
  { id: "gym", naam: "Gym", duur: 45 },
];

// Kleuropties: wit (geen kleur) plus een waaier die ruim genoeg is om elk vak
// zijn eigen kleur te geven. De tekstkleur is telkens een leesbare donkere tint
// bij de achtergrond.
//
// Op volgorde van de kleurencirkel, en binnen een familie van licht naar dieper.
// Dat laatste is bewust: voor rood-groen-kleurenblindheid is het verschil in
// licht/donker de sleutel, niet de tint. De naam in het blok blijft het vangnet.
const KLEUR_OPTIES: { bg: string; tekst: string; naam: string }[] = [
  { bg: "#ffffff", tekst: "#3a3a3a", naam: "Wit (geen kleur)" },
  { bg: "#e5e0d5", tekst: "#6f6a5c", naam: "Zand" },
  { bg: "#d7dde3", tekst: "#47535e", naam: "Leigrijs" },
  { bg: "#9cc7ff", tekst: "#0d4a95", naam: "Lichtblauw" },
  { bg: "#6fb0f2", tekst: "#0a3f7d", naam: "Blauw" },
  { bg: "#93dbf2", tekst: "#0a5a7a", naam: "Hemelsblauw" },
  { bg: "#7fdcd6", tekst: "#06534f", naam: "Aqua" },
  { bg: "#a8e6c9", tekst: "#10664a", naam: "Mint" },
  { bg: "#74c78a", tekst: "#0f5e34", naam: "Diepgroen" },
  { bg: "#b6e88f", tekst: "#35701a", naam: "Lichtgroen" },
  { bg: "#cdd45a", tekst: "#4e5600", naam: "Olijf" },
  { bg: "#d9cfa0", tekst: "#5f5320", naam: "Kaki" },
  { bg: "#ffe873", tekst: "#6e5600", naam: "Geel" },
  { bg: "#f7cf5e", tekst: "#6e5000", naam: "Goud" },
  { bg: "#ffd2ab", tekst: "#8a4a12", naam: "Abrikoos" },
  { bg: "#ffb066", tekst: "#7a3d00", naam: "Oranje" },
  { bg: "#e0c3a0", tekst: "#6b4520", naam: "Zandbruin" },
  { bg: "#ff8a7a", tekst: "#7a1e10", naam: "Rood" },
  { bg: "#ff9fb0", tekst: "#8a1f3d", naam: "Koraalroze" },
  { bg: "#f5c2dd", tekst: "#8a3a68", naam: "Oudroze" },
  { bg: "#ffb3e6", tekst: "#8a1f74", naam: "Magenta" },
  { bg: "#cdb0ff", tekst: "#4d1e9c", naam: "Paars" },
  { bg: "#b8a6e0", tekst: "#43248f", naam: "Lavendel" },
  { bg: "#aeb4f5", tekst: "#2f3aa5", naam: "Indigo" },
];

// Kleuren voor een zelf toegevoegd vak — vivid, in dezelfde stijl als de rest.
// We pakken telkens de eerstvolgende die nog niet in gebruik is, dus hoe langer
// deze rij, hoe langer elk eigen vak vanzelf een eigen kleur krijgt.
const EIGEN_KLEUREN: { bg: string; tx: string }[] = [
  { bg: "#c8f0d4", tx: "#1f7a4a" },
  { bg: "#ffd6cf", tx: "#b34433" },
  { bg: "#d3ddff", tx: "#3646ad" },
  { bg: "#ffe6b8", tx: "#9a6a1a" },
  { bg: "#e6d6ff", tx: "#6337ba" },
  { bg: "#c2eeea", tx: "#0f7d75" },
  { bg: "#ffd4ea", tx: "#b32f74" },
  { bg: "#e2f0b8", tx: "#5f7a15" },
  { bg: "#a8e6c9", tx: "#10664a" },
  { bg: "#ffd2ab", tx: "#8a4a12" },
  { bg: "#b8a6e0", tx: "#43248f" },
  { bg: "#93dbf2", tx: "#0a5a7a" },
  { bg: "#d9cfa0", tx: "#5f5320" },
  { bg: "#f5c2dd", tx: "#8a3a68" },
  { bg: "#d7dde3", tx: "#47535e" },
  { bg: "#cdd45a", tx: "#4e5600" },
];

/** Een uniek id voor een nieuw blok. */
function nieuwId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return "les-" + crypto.randomUUID();
  return "les-" + Date.now() + "-" + Math.round(Math.random() * 1e6);
}

/** "08:30" → 510 */
function minuten(tijd: string): number {
  const [u, m] = tijd.split(":").map(Number);
  return u * 60 + (m || 0);
}

/** 510 → "08:30" */
function tijdTekst(m: number): string {
  const u = Math.floor(m / 60);
  const rest = Math.round(m % 60);
  return `${String(u).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

type Gekozen = { id: string; x: number; y: number; kant: "links" | "rechts" };

export default function RoosterBewerken({
  schooljaar,
  onKlaar,
  verlaatGuard,
}: {
  schooljaar: string;
  onKlaar: () => void;
  // Zolang er onopgeslagen wijzigingen zijn, laat de editor via deze ref weten:
  // "vraag het mij eerst". De tabbladen erboven (Jaaroverzicht, Agenda's, …) zijn
  // gewone knoppen die geen navigatie doen, dus die roepen deze guard aan i.p.v.
  // meteen te wisselen. null = niets onopgeslagen, gewoon doorgaan.
  verlaatGuard?: { current: ((actie: () => void) => void) | null };
}) {
  const [concept, setConcept] = useState<Basisrooster | null>(null);
  const [geschiedenis, setGeschiedenis] = useState<Basisrooster[]>([]);
  const [vuil, setVuil] = useState(false);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState<string | null>(null);
  const [opslaanBezig, setOpslaanBezig] = useState(false);
  const [gekozen, setGekozen] = useState<Gekozen | null>(null);
  const [toevoegen, setToevoegen] = useState<{
    weekdag: number;
    start: number;
    duur: number;
    x: number;
    y: number;
    kant: "links" | "rechts";
  } | null>(null);
  const [instellingenOpen, setInstellingenOpen] = useState(false);
  const [vraagAfsluiten, setVraagAfsluiten] = useState(false);
  // Wat er moet gebeuren zodra de waarschuwing is afgehandeld: naar een andere
  // pagina (onderschepte link), een ander tabblad (guard) of terug naar het
  // overzicht (Annuleren). null valt terug op onKlaar.
  const [naDeWaarschuwing, setNaDeWaarschuwing] = useState<(() => void) | null>(null);
  // Welke soort wijziging als laatste is gedaan, om doorlopend typen tot één
  // stap in "ongedaan maken" samen te voegen (zie pasToe).
  const laatsteStap = useRef<string | null>(null);
  const router = useRouter();

  // De guard registreren zolang er onopgeslagen wijzigingen zijn, zodat de
  // tabbladen erboven eerst de waarschuwing kunnen laten zien.
  useEffect(() => {
    if (!verlaatGuard) return;
    verlaatGuard.current = vuil
      ? (actie: () => void) => {
          setNaDeWaarschuwing(() => actie);
          setVraagAfsluiten(true);
        }
      : null;
    return () => {
      verlaatGuard.current = null;
    };
  }, [vuil, verlaatGuard]);

  // De kleur van een vak wijzigen vanuit het blok zelf. Een kleur hoort bij het
  // vak en niet bij één les, dus alle blokken van hetzelfde vak kleuren mee.
  // Staat het vak nog niet in je vakkenlijst, dan zetten we er alleen een
  // kleur-regel voor neer: zonder `blokken` telt zo'n regel niet mee bij het
  // opnieuw verdelen en verandert er dus niets anders aan je rooster.
  function zetVakKleur(vakId: string, naam: string, opt: { bg: string; tekst: string }) {
    pasToe((c) => {
      const lijst = c.setup.vakken ?? [];
      const bestaat = lijst.some((v) => v.id === vakId);
      return {
        ...c,
        setup: {
          ...c.setup,
          vakken: bestaat
            ? lijst.map((v) => (v.id === vakId ? { ...v, bg: opt.bg, tx: opt.tekst } : v))
            : [...lijst, { id: vakId, naam, bg: opt.bg, tx: opt.tekst }],
        },
      };
    });
  }

  // De vakkenlijst in de instellingen wijzigen (welke vakken, hoe vaak per week).
  // Eigen vakken die niet in de catalogus staan, blijven onaangeroerd. Via pasToe
  // zodat het ook ongedaan te maken is.
  function zetVakken(nieuw: NonNullable<RoosterSetup["vakken"]>) {
    pasToe((c) => ({ ...c, setup: { ...c.setup, vakken: nieuw } }));
  }

  // Het rooster van je account ophalen zodra de bewerkstand opent.
  useEffect(() => {
    let levend = true;
    (async () => {
      try {
        const antwoord = await fetch(
          `/api/rooster?schooljaar=${encodeURIComponent(schooljaar)}`,
          { headers: { Accept: "application/json" } },
        );
        if (!antwoord.ok) throw new Error("laden mislukt");
        const data = await antwoord.json();
        if (levend) setConcept(data.rooster ?? null);
      } catch {
        if (levend) setFout("Je rooster kon niet worden geladen.");
      } finally {
        if (levend) setLaden(false);
      }
    })();
    return () => {
      levend = false;
    };
  }, [schooljaar]);

  // Waarschuw ook als je de pagina zelf verlaat (verversen/sluiten) met
  // niet-opgeslagen wijzigingen.
  useEffect(() => {
    if (!vuil) return;
    const waarschuw = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", waarschuw);
    return () => window.removeEventListener("beforeunload", waarschuw);
  }, [vuil]);

  // En óók als je binnen het platform wegklikt (Agenda's, Statistieken, een
  // menu-link): die navigatie laadt de pagina niet opnieuw, dus beforeunload
  // vangt haar niet. We onderscheppen zo'n klik en vragen eerst wat je wilt.
  useEffect(() => {
    if (!vuil) return;
    const opKlik = (e: globalThis.MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as HTMLElement | null)?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const href = link.getAttribute("href") ?? "";
      if (!href || href.startsWith("#")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const hier = window.location.pathname + window.location.search;
      if (url.pathname + url.search === hier) return; // zelfde pagina
      e.preventDefault();
      e.stopPropagation();
      const doel = url.pathname + url.search + url.hash;
      setNaDeWaarschuwing(() => () => router.push(doel));
      setVraagAfsluiten(true);
    };
    document.addEventListener("click", opKlik, true);
    return () => document.removeEventListener("click", opKlik, true);
  }, [vuil]);

  // Elke wijziging bewaart de vorige stand voor "ongedaan maken" en zet het
  // rooster op "niet opgeslagen". Nog niets naar de server: dat doe je zelf.
  //
  // `stap` hoort bij wijzigingen die uit veel kleine beetjes bestaan, zoals het
  // typen van een omschrijving. Blijft de stap dezelfde, dan groeien ze samen tot
  // één stap in "ongedaan maken" — anders zou elke letter er een worden.
  function pasToe(maak: (c: Basisrooster) => Basisrooster, stap?: string) {
    if (!concept) return;
    const doorgaan = stap != null && stap === laatsteStap.current;
    if (!doorgaan) setGeschiedenis((g) => [...g, concept]);
    laatsteStap.current = stap ?? null;
    setConcept(maak(concept));
    setVuil(true);
  }

  function ongedaan() {
    if (!geschiedenis.length) return;
    setConcept(geschiedenis[geschiedenis.length - 1]);
    setGeschiedenis((g) => g.slice(0, -1));
    setVuil(true);
    setGekozen(null);
  }

  async function opslaan(): Promise<boolean> {
    // Zonder geladen rooster valt er niets te bewaren. Dat mag nooit stilletjes
    // als "opgeslagen" gelden: dan sluit de bewerkstand alsof alles goed ging.
    if (!concept) {
      setFout("Er is nog geen rooster om op te slaan. Ververs de pagina en probeer het opnieuw.");
      return false;
    }
    setOpslaanBezig(true);
    setFout(null);
    try {
      const antwoord = await fetch("/api/rooster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rooster: concept, schooljaar }),
      });
      if (!antwoord.ok) {
        // Zeg erbij wat er misging. Ging het eerder mis, dan was het altijd
        // dezelfde zin en wist niemand waar het aan lag.
        if (antwoord.status === 401) {
          setFout(
            "Je bent uitgelogd, daarom kon het rooster niet worden bewaard. Log in een nieuw " +
              "tabblad opnieuw in en klik hier daarna nog eens op Opslaan — je wijzigingen blijven staan.",
          );
          return false;
        }
        const reden = await antwoord
          .json()
          .then((d) => (typeof d?.fout === "string" ? d.fout : ""))
          .catch(() => "");
        setFout(
          `Opslaan is niet gelukt. ${reden || "De server gaf geen reden."} (code ${antwoord.status})`,
        );
        return false;
      }
      setVuil(false);
      return true;
    } catch {
      setFout(
        "Opslaan is niet gelukt: geen verbinding met de server. Controleer je internet en " +
          "probeer het nog eens — je wijzigingen blijven staan.",
      );
      return false;
    } finally {
      setOpslaanBezig(false);
    }
  }

  // De bewerkstand verlaten zónder op te slaan. Voer de geparkeerde actie uit
  // (naar de andere pagina/het tabblad), of val terug op terug-naar-overzicht.
  function verlaat() {
    const actie = naDeWaarschuwing;
    setVuil(false);
    setVraagAfsluiten(false);
    setNaDeWaarschuwing(null);
    if (verlaatGuard) verlaatGuard.current = null; // guard nu direct uit
    (actie ?? onKlaar)();
  }

  async function opslaanEnVerlaat() {
    const actie = naDeWaarschuwing;
    if (!(await opslaan())) return; // opslaan mislukt: blijf, toon de fout
    setVraagAfsluiten(false);
    setNaDeWaarschuwing(null);
    if (verlaatGuard) verlaatGuard.current = null;
    if (actie) {
      // Het rooster is bewaard, maar het scherm waar je heen gaat heeft de oude
      // gegevens nog van de server. Zonder deze verversing zag je je wijziging
      // pas nadat je opnieuw de bewerkstand in was geweest. onKlaar ververst
      // zelf al, dus dat pad hoeft het niet nog een keer.
      router.refresh();
      actie();
    } else {
      onKlaar();
    }
  }

  function sluitWaarschuwing() {
    setVraagAfsluiten(false);
    setNaDeWaarschuwing(null);
  }

  const lessen = useMemo<Roosterblok[]>(
    () => (concept ? naarBlokken(concept).filter((b) => b.soort === "les") : []),
    [concept],
  );
  const gekozenBlok = gekozen ? lessen.find((b) => b.id === gekozen.id) ?? null : null;

  // De andere blokken van hetzelfde vak. Hebben die nu al dezelfde omschrijving,
  // dan staat het vinkje "bij alle …-blokken" de volgende keer vanzelf goed —
  // zo voelt het alsof de keuze onthouden is, zonder hem ergens te bewaren.
  // Let op: pauzeblokken delen allemaal `vak: "pauze"` (zie weekplanning.html) en
  // zijn alleen via `naam` uit elkaar te houden ("Eten en drinken" vs. "Buiten
  // spelen"), dus die moet hier ook mee matchen — anders telt "alle blokken"
  // per ongeluk ook de andere pauzesoort mee.
  const zelfdeVak = gekozenBlok
    ? (concept?.blokken ?? []).filter(
        (b) => b.vak === gekozenBlok.vak && b.naam === gekozenBlok.naam,
      )
    : [];
  // Alleen als er echt iets gedeeld wordt: staan ze allemaal leeg, dan begint het
  // vinkje uit. Anders zou je eerste aantekening ongevraagd overal landen.
  const overalGelijk =
    zelfdeVak.length > 1 &&
    Boolean(gekozenBlok?.omschrijving?.trim()) &&
    zelfdeVak.every((b) => (b.omschrijving ?? "") === (gekozenBlok?.omschrijving ?? ""));
  const vakkenLijst =
    concept?.setup.vakken && concept.setup.vakken.length > 0
      ? concept.setup.vakken
      : STANDAARD_VAKKEN;

  // De onderkant verschuiven: alleen de lengte verandert (begintijd blijft staan).
  function wijzigEinde(id: string, delta: number) {
    pasToe((c) => ({
      ...c,
      blokken: c.blokken.map((b) =>
        b.id === id ? { ...b, duur: Math.min(180, Math.max(10, b.duur + delta)) } : b,
      ),
    }));
  }

  // De bovenkant verschuiven: de begintijd schuift op, de eindtijd blijft staan
  // (start en lengte bewegen tegengesteld). Niet vóór middernacht of korter dan
  // 10 minuten.
  function wijzigBegin(id: string, delta: number) {
    pasToe((c) => ({
      ...c,
      blokken: c.blokken.map((b) => {
        if (b.id !== id) return b;
        const start = b.start + delta;
        const duur = b.duur - delta;
        if (start < 0 || duur < 10 || duur > 180) return b;
        return { ...b, start, duur };
      }),
    }));
  }

  // De eigen aantekening bij een blok ("Jeugdjournaal kijken"). Standaard hoort
  // die bij dít blok, want de ene pauze is de andere niet. Met `overal` schrijf
  // je hem in één keer bij elk blok van hetzelfde vak, zodat bijvoorbeeld al je
  // rekenlessen dezelfde omschrijving hebben.
  function zetOmschrijving(id: string, tekst: string, overal: boolean) {
    const nieuw = tekst.trim() ? tekst : undefined;
    pasToe(
      (c) => {
        const bron = c.blokken.find((b) => b.id === id);
        return {
          ...c,
          blokken: c.blokken.map((b) =>
            b.id === id || (overal && bron && b.vak === bron.vak && b.naam === bron.naam)
              ? { ...b, omschrijving: nieuw }
              : b,
          ),
        };
      },
      // Doorlopend typen blijft één stap in "ongedaan maken"; het aan- of
      // uitzetten van "bij alle blokken" wordt bewust wél een eigen stap.
      `omschrijving:${overal ? "vak" : "blok"}:${id}`,
    );
  }

  function verwijder(id: string) {
    pasToe((c) => ({ ...c, blokken: c.blokken.filter((b) => b.id !== id) }));
    setGekozen(null);
  }

  // Een compleet nieuw (eigen) vak: krijgt een kleur, komt in je vakkenlijst, en
  // wordt meteen als les geplaatst op de gekozen plek.
  function voegEigenVakToe(naam: string) {
    if (!toevoegen) return;
    const t = naam.trim();
    if (!t) return;
    const { weekdag, start, duur } = toevoegen;
    const vakId = nieuwId();
    const gebruikt = new Set((concept?.setup.vakken ?? []).map((v) => v.bg));
    const kl =
      EIGEN_KLEUREN.find((k) => !gebruikt.has(k.bg)) ??
      EIGEN_KLEUREN[(concept?.setup.vakken?.length ?? 0) % EIGEN_KLEUREN.length];
    pasToe((c) => ({
      ...c,
      setup: {
        ...c.setup,
        // Met `blokken` telt het nieuwe vak meteen mee bij het opnieuw verdelen,
        // met de lengte die je hier tekende.
        vakken: [
          ...(c.setup.vakken ?? []),
          { id: vakId, naam: t, blokken: [duur], bg: kl.bg, tx: kl.tx },
        ],
      },
      blokken: [
        ...c.blokken,
        { id: nieuwId(), dag: DAG_ID[weekdag], start, duur, vak: vakId, naam: t, type: "les" },
      ],
    }));
    setToevoegen(null);
  }

  // De lessen opnieuw over de week verdelen (pauzes/gym en je na-schooltijd-taken
  // blijven staan). Elke keer een andere mix; ongedaan te maken.
  function opnieuwGenereren() {
    pasToe((c) => {
      // Gym is een gewoon te verdelen vak zodra je het instelt; dan houden we de
      // oude vaste gym-blokken niet vast maar verdelen we ze opnieuw mee.
      // "Geregeld" betekent: als lesvak ingesteld (met blokken). Een gym-regel die
      // er alleen staat voor zijn kleur telt niet mee — anders zouden de vaste
      // gymblokken verdwijnen zonder dat er nieuwe voor terugkomen.
      const gymGeregeld = (c.setup.vakken ?? []).some(
        (v) => v.id === "gym" && (v.blokken?.length ?? 0) > 0,
      );
      const vaste = c.blokken.filter((b) => b.type === "vast" && !(gymGeregeld && b.vak === "gym"));
      const taken = c.blokken.filter((b) => b.type === "taak");
      return { ...c, blokken: [...vaste, ...taken, ...genereerLessen(c.setup, vaste)] };
    });
  }

  // Een hele dag kopiëren naar een of meer andere dagen. De doeldag(en) worden
  // vervangen door een kopie van de brondag (met nieuwe id's). Ideaal als je
  // ochtenden op elke dag hetzelfde opbouwt; daarna pas je alleen de rest aan.
  function kopieerDag(bron: number, doelen: number[]) {
    pasToe((c) => {
      const bronBlokken = c.blokken.filter((b) => DAG_ID.indexOf(b.dag) === bron);
      const blokken = c.blokken.filter((b) => !doelen.includes(DAG_ID.indexOf(b.dag)));
      for (const doel of doelen)
        for (const b of bronBlokken) blokken.push({ ...b, id: nieuwId(), dag: DAG_ID[doel] });
      return { ...c, blokken };
    });
  }

  // Een vak uit de lijst halen (bijv. na een typfout): weg uit je vakkenlijst,
  // inclusief de al geplaatste lessen ervan. Eén keer ongedaan te maken.
  function verwijderVak(id: string) {
    pasToe((c) => ({
      ...c,
      setup: { ...c.setup, vakken: (c.setup.vakken ?? []).filter((v) => v.id !== id) },
      blokken: c.blokken.filter((b) => b.vak !== id),
    }));
  }

  // Een nieuw vak toevoegen op een dag+tijd (na klikken op een lege plek).
  function voegToe(weekdag: number, start: number, duur: number, vak: string, naam: string) {
    pasToe((c) => ({
      ...c,
      blokken: [
        ...c.blokken,
        { id: nieuwId(), dag: DAG_ID[weekdag], start, duur, vak, naam, type: "les" },
      ],
    }));
    setToevoegen(null);
  }

  // Een blok naar een andere dag/tijd of lengte zetten (na het slepen).
  function zetBlok(id: string, w: { weekdag?: number; start?: number; duur?: number }) {
    pasToe((c) => ({
      ...c,
      blokken: c.blokken.map((b) =>
        b.id === id
          ? {
              ...b,
              dag: w.weekdag != null ? DAG_ID[w.weekdag] : b.dag,
              start: w.start != null ? w.start : b.start,
              duur: w.duur != null ? w.duur : b.duur,
            }
          : b,
      ),
    }));
  }

  // Bij een klik op een blok zetten we het kaartje NAAST het blok (rechts als het
  // past, anders links), nooit erboven of eronder. Zo bedekt het het blok nooit
  // en zie je het blok live veranderen terwijl je begin/einde bijstelt.
  function kies(id: string, el: HTMLElement) {
    if (gekozen?.id === id) {
      setGekozen(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const breedte = 244;
    const hoogteSchatting = 325; // inclusief een opengeklapt omschrijving-veld
    let x = r.right + 8;
    let kant: "links" | "rechts" = "rechts";
    if (x + breedte > window.innerWidth - 8) {
      x = r.left - breedte - 8;
      kant = "links";
    }
    if (x < 8) x = 8;
    const y = Math.max(8, Math.min(r.top, window.innerHeight - hoogteSchatting - 8));
    setGekozen({ id, x, y, kant });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Bewerk-balk: duidelijk dat je nu aan het aanpassen bent, met ongedaan
          maken, annuleren en handmatig opslaan. */}
      <div className="flex flex-col gap-3 rounded-2xl border border-brand/20 bg-brand-soft/50 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-2 font-bold text-brand-dark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            Je past je basisrooster aan
          </span>
          {vuil && <span className="text-xs font-semibold text-ink/45">Niet opgeslagen</span>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1">
            <button
              onClick={opnieuwGenereren}
              title="Opnieuw genereren — verdeel de lessen opnieuw over de week"
              aria-label="Opnieuw genereren"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-brand-dark transition-transform duration-150 hover:bg-brand-soft active:scale-[0.96]"
            >
              {/* Het sterretje vult de knop nu bijna helemaal, anders zie je hem
                  nauwelijks. */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.5l1.6 4.3 4.3 1.6-4.3 1.6L12 14.3l-1.6-4.3L6.1 8.4l4.3-1.6z" />
                <path d="M18.5 13.5l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z" />
              </svg>
            </button>
            <button
              onClick={() => setInstellingenOpen(true)}
              title="Vakken en instellingen"
              aria-label="Instellingen"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-ink/60 transition-transform duration-150 hover:text-ink active:scale-[0.96]"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </span>

          <span className="ml-auto flex items-center gap-2">
            <button
              onClick={ongedaan}
              disabled={!geschiedenis.length}
              className="rounded-xl border border-black/10 bg-white px-3.5 py-2 text-sm font-bold text-ink/70 transition-transform duration-150 hover:text-ink active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Ongedaan maken
            </button>
            <button
              onClick={() => {
                if (vuil) {
                  setNaDeWaarschuwing(null);
                  setVraagAfsluiten(true);
                } else onKlaar();
              }}
              className="rounded-xl border border-black/10 bg-white px-3.5 py-2 text-sm font-bold text-ink/70 transition-transform duration-150 hover:text-ink active:scale-[0.97]"
            >
              Annuleren
            </button>
            <button
              onClick={async () => {
                if (await opslaan()) onKlaar();
              }}
              disabled={opslaanBezig}
              className="rounded-xl bg-brand-dark px-4 py-2 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.97] disabled:opacity-60"
            >
              {opslaanBezig ? "Bezig met opslaan…" : "Opslaan"}
            </button>
          </span>
        </div>
      </div>

      {fout && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{fout}</p>
      )}

      {laden ? (
        <p className="rounded-3xl border border-black/5 bg-white px-6 py-8 text-ink/60 shadow-sm">
          Je rooster wordt geladen…
        </p>
      ) : lessen.length === 0 ? (
        <p className="rounded-3xl border border-black/5 bg-white px-6 py-8 text-ink/60 shadow-sm">
          Er staan nog geen lessen in je rooster.
        </p>
      ) : (
        <Bewerkraster
          lessen={lessen}
          gekozenId={gekozen?.id ?? null}
          kies={kies}
          zetBlok={zetBlok}
          kopieerDag={kopieerDag}
          nieuwOp={(weekdag, start, duur, x, y, kant) => {
            setGekozen(null);
            setToevoegen({ weekdag, start, duur, x, y, kant });
          }}
          voorbeeld={
            toevoegen
              ? { weekdag: toevoegen.weekdag, start: toevoegen.start, duur: toevoegen.duur }
              : null
          }
        />
      )}

      {/* Het kaartje dat uit het blok openvouwt, met de opties. */}
      {gekozenBlok && gekozen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setGekozen(null)} />
          <Blokkaart
            key={gekozenBlok.id}
            blok={gekozenBlok}
            x={gekozen.x}
            y={gekozen.y}
            kant={gekozen.kant}
            beginEerder={() => wijzigBegin(gekozenBlok.id, -5)}
            beginLater={() => wijzigBegin(gekozenBlok.id, 5)}
            eindeEerder={() => wijzigEinde(gekozenBlok.id, -5)}
            eindeLater={() => wijzigEinde(gekozenBlok.id, 5)}
            zetKleur={(opt) => zetVakKleur(gekozenBlok.vak, gekozenBlok.naam, opt)}
            zetOmschrijving={(tekst, overal) => zetOmschrijving(gekozenBlok.id, tekst, overal)}
            aantalZelfdeVak={zelfdeVak.length}
            overalGelijk={overalGelijk}
            weghalen={() => verwijder(gekozenBlok.id)}
            sluit={() => setGekozen(null)}
          />
        </>
      )}

      {/* Het kiezertje voor een nieuw vak, na klikken op een lege plek. */}
      {toevoegen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setToevoegen(null)} />
          <VakKiezer
            vakken={vakkenLijst}
            setup={concept?.setup ?? {}}
            x={toevoegen.x}
            y={toevoegen.y}
            kant={toevoegen.kant}
            kies={(vak, naam) =>
              voegToe(toevoegen.weekdag, toevoegen.start, toevoegen.duur, vak, naam)
            }
            eigenVak={voegEigenVakToe}
            verwijderVak={verwijderVak}
            sluit={() => setToevoegen(null)}
          />
        </>
      )}

      {/* Instellingen: welke vakken en hoe vaak per week. */}
      {instellingenOpen && (
        <VakkenInstellingen
          vakken={concept?.setup.vakken ?? []}
          setVakken={zetVakken}
          verwijder={verwijderVak}
          sluit={() => setInstellingenOpen(false)}
        />
      )}

      {/* Waarschuwing bij afsluiten met niet-opgeslagen wijzigingen. */}
      {vraagAfsluiten && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
          onClick={sluitWaarschuwing}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Niet-opgeslagen wijzigingen"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl"
          >
            <p className="font-serif text-2xl font-semibold text-ink">Niet-opgeslagen wijzigingen</p>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              Je hebt wijzigingen aan je basisrooster die nog niet zijn opgeslagen. Wat wil je doen?
            </p>
            {/* Mislukt het opslaan hiervandaan, dan hoort de reden hier te staan:
                de melding in het scherm erachter zie je niet. */}
            {fout && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm leading-6 font-semibold text-red-800">
                {fout}
              </p>
            )}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                onClick={sluitWaarschuwing}
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-bold text-ink/70 transition-transform duration-150 hover:text-ink active:scale-[0.97]"
              >
                Terug
              </button>
              <button
                onClick={verlaat}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition-transform duration-150 active:scale-[0.97]"
              >
                Afsluiten zonder opslaan
              </button>
              <button
                onClick={opslaanEnVerlaat}
                disabled={opslaanBezig}
                className="rounded-xl bg-brand-dark px-4 py-2 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.97] disabled:opacity-60"
              >
                {opslaanBezig ? "Bezig met opslaan…" : "Opslaan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Een teller zonder doosjes: een kale – en +, met het getal ertussen. Zes van
 * die knopjes met een eigen randje maakten de vakkenlijst onrustig; als los
 * teken zijn ze net zo goed te raken, maar ze schreeuwen niet mee.
 */
function Teller({
  waarde,
  achtervoegsel,
  label,
  minder,
  meer,
}: {
  waarde: string;
  /** Kort teken achter het getal, bijvoorbeeld de × van "5×". */
  achtervoegsel?: string;
  label: string;
  minder: () => void;
  meer: () => void;
}) {
  // Smaller dan hoog en met een klein negatief marge-tje: de tekens kruipen zo
  // tegen het getal aan, waardoor er juist rúímte valt tussen de twee tellers.
  // De knop blijft even hoog, dus goed te raken.
  const knop =
    "-mx-0.5 flex h-7 w-6 shrink-0 items-center justify-center rounded-md text-lg leading-none text-ink/30 transition-colors hover:bg-black/5 hover:text-ink active:scale-95";
  return (
    <span className="flex w-24 shrink-0 items-center justify-center">
      <button onClick={minder} aria-label={`${label} minder`} className={knop}>
        –
      </button>
      {/* Net breed genoeg voor drie cijfers, zodat de – en + dicht bij het getal
          staan en er toch niets verspringt bij 45 → 100. */}
      <span className="min-w-[1.5rem] text-center text-sm tabular-nums text-ink/75">
        {waarde}
        {achtervoegsel && <span className="text-xs text-ink/45">{achtervoegsel}</span>}
      </span>
      <button onClick={meer} aria-label={`${label} meer`} className={knop}>
        +
      </button>
    </span>
  );
}

function VakkenInstellingen({
  vakken,
  setVakken,
  verwijder,
  sluit,
}: {
  vakken: NonNullable<RoosterSetup["vakken"]>;
  setVakken: (v: NonNullable<RoosterSetup["vakken"]>) => void;
  verwijder: (id: string) => void;
  sluit: () => void;
}) {
  const [bewerkId, setBewerkId] = useState<string | null>(null);
  const [bewerkNaam, setBewerkNaam] = useState("");
  const [eigenNaam, setEigenNaam] = useState("");
  const [paletVoor, setPaletVoor] = useState<{ id: string; x: number; y: number } | null>(null);

  // Standaardvakken die nog niet zijn ingesteld (om snel toe te voegen). Een vak
  // dat er alleen staat voor zijn kleur (geen `blokken`) telt niet als ingesteld.
  const nogTeKiezen = VAK_CATALOGUS.filter(
    (k) => !vakken.some((v) => v.id === k.id && (v.blokken?.length ?? 0) > 0),
  );

  function kiesKleur(id: string, opt: { bg: string; tekst: string }) {
    setVakken(vakken.map((v) => (v.id === id ? { ...v, bg: opt.bg, tx: opt.tekst } : v)));
    setPaletVoor(null);
  }

  // De te verdelen lesvakken (pauze hoort daar niet bij — dat is een vast blok).
  // Een vak zonder `blokken` staat alleen in de lijst omdat er een kleur voor is
  // gekozen bij een blok; dat is hier nog geen ingesteld vak.
  const lesVakken = vakken.filter((v) => v.id !== "pauze" && (v.blokken?.length ?? 0) > 0);

  function zetAantal(id: string, aantal: number) {
    setVakken(
      vakken.map((v) =>
        v.id === id
          ? { ...v, blokken: Array(Math.max(1, Math.min(10, aantal))).fill(v.blokken?.[0] ?? 45) }
          : v,
      ),
    );
  }

  function zetDuur(id: string, duur: number) {
    setVakken(
      vakken.map((v) =>
        v.id === id
          ? { ...v, blokken: Array(v.blokken?.length ?? 1).fill(Math.max(10, Math.min(120, duur))) }
          : v,
      ),
    );
  }

  function bewaarNaam() {
    if (bewerkId) {
      const t = bewerkNaam.trim();
      if (t) setVakken(vakken.map((v) => (v.id === bewerkId ? { ...v, naam: t } : v)));
    }
    setBewerkId(null);
  }

  function voegStandaard(k: (typeof VAK_CATALOGUS)[number]) {
    // Stond het vak er al alleen voor zijn kleur? Dan die kleur bewaren en er een
    // echt ingesteld vak van maken, in plaats van een tweede regel erbij.
    const bestaand = vakken.find((v) => v.id === k.id);
    const nieuw = {
      id: k.id,
      naam: bestaand?.naam ?? k.naam,
      blokken: [k.duur],
      ochtend: k.ochtend,
      zwaar: k.zwaar,
      middag: k.middag,
      ontspan: k.ontspan,
      bg: bestaand?.bg,
      tx: bestaand?.tx,
    };
    setVakken(bestaand ? vakken.map((v) => (v.id === k.id ? nieuw : v)) : [...vakken, nieuw]);
  }

  function voegEigen() {
    const t = eigenNaam.trim();
    if (!t) return;
    const gebruikt = new Set(vakken.map((v) => v.bg));
    const kl =
      EIGEN_KLEUREN.find((k) => !gebruikt.has(k.bg)) ??
      EIGEN_KLEUREN[vakken.length % EIGEN_KLEUREN.length];
    setVakken([...vakken, { id: nieuwId(), naam: t, blokken: [45], bg: kl.bg, tx: kl.tx }]);
    setEigenNaam("");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onClick={sluit}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Vakken instellen"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/5 px-6 pb-4 pt-6">
          <div>
            <p className="font-serif text-2xl font-semibold text-ink">Vakken</p>
            <p className="mt-1 text-sm text-ink/60">
              Kies je vakken, hoe lang en hoe vaak per week. Klik daarna op het ✨ om opnieuw te
              verdelen.
            </p>
          </div>
          <button
            onClick={sluit}
            aria-label="Sluiten"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/10 text-ink/50 transition-transform duration-150 hover:text-ink active:scale-[0.96]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Kolomkoppen, zodat "×" en "min" niet in elke rij herhaald hoeven te
            worden. Ze staan buiten het schuivende deel en blijven dus staan. */}
        {lesVakken.length > 0 && (
          <div className="flex items-center gap-2 border-b border-black/5 px-6 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink/35">
            <span className="w-4 shrink-0" />
            <span className="min-w-0 flex-1">Vak</span>
            <span className="w-24 shrink-0 whitespace-nowrap text-center">Per week</span>
            <span className="w-24 shrink-0 whitespace-nowrap text-center">Lengte (min)</span>
            <span className="w-6 shrink-0" />
          </div>
        )}

        <div className="flex flex-col overflow-y-auto px-4 py-1">
          {lesVakken.length === 0 && (
            <p className="px-2 py-3 text-sm text-ink/50">
              Nog geen vakken. Voeg er hieronder een toe.
            </p>
          )}
          {lesVakken.map((v) => {
            const kl = kleurVoor(v.id, { vakken });
            const aantal = v.blokken?.length ?? 1;
            const duur = v.blokken?.[0] ?? 45;
            const bewerkt = bewerkId === v.id;
            return (
              <div
                key={v.id}
                className="flex items-center gap-2 rounded-lg border-b border-black/5 px-2 py-1.5 transition-colors last:border-b-0 hover:bg-cream/40"
              >
                <button
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setPaletVoor({
                      id: v.id,
                      // 200 = de breedte van het palet (6 vakjes) plus wat lucht,
                      // zodat het niet half buiten beeld valt.
                      x: Math.min(r.left, window.innerWidth - 200),
                      y: r.bottom + 6,
                    });
                  }}
                  aria-label={`Kleur van ${v.naam} kiezen`}
                  title="Kleur kiezen"
                  className="h-4 w-4 shrink-0 rounded transition-transform hover:scale-110"
                  style={{ background: kl.bg, boxShadow: `inset 0 0 0 1px ${kl.tekst}55` }}
                />
                {bewerkt ? (
                  <input
                    autoFocus
                    value={bewerkNaam}
                    onChange={(e) => setBewerkNaam(e.target.value)}
                    onBlur={bewaarNaam}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") bewaarNaam();
                      if (e.key === "Escape") setBewerkId(null);
                    }}
                    className="min-w-0 flex-1 rounded-md border border-black/15 px-1.5 py-0.5 text-sm font-semibold text-ink outline-none focus:border-brand-dark/40"
                  />
                ) : (
                  // De naam is zelf de knop om te hernoemen; dat scheelt een
                  // potlood in elke rij.
                  <button
                    onClick={() => {
                      setBewerkId(v.id);
                      setBewerkNaam(v.naam);
                    }}
                    title="Klik om de naam te wijzigen"
                    className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-ink transition-colors hover:text-brand-dark"
                  >
                    {v.naam}
                  </button>
                )}
                <Teller
                  waarde={String(aantal)}
                  achtervoegsel="×"
                  label={`${v.naam} per week`}
                  minder={() => zetAantal(v.id, aantal - 1)}
                  meer={() => zetAantal(v.id, aantal + 1)}
                />
                <Teller
                  waarde={String(duur)}
                  label={`Lengte van ${v.naam}`}
                  minder={() => zetDuur(v.id, duur - 5)}
                  meer={() => zetDuur(v.id, duur + 5)}
                />
                <button
                  onClick={() => verwijder(v.id)}
                  aria-label={`${v.naam} weghalen`}
                  title="Weghalen"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-ink/25 transition-colors hover:bg-black/5 hover:text-red-600"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        {/* Vak toevoegen: standaardvakken die er nog niet zijn, of een eigen vak. */}
        <div className="border-t border-black/5 px-4 py-3">
          {nogTeKiezen.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {nogTeKiezen.map((k) => (
                <button
                  key={k.id}
                  onClick={() => voegStandaard(k)}
                  className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold text-ink/70 transition-colors hover:bg-cream/60 hover:text-ink"
                >
                  + {k.naam}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              voegEigen();
            }}
            className="flex items-center gap-2"
          >
            <input
              value={eigenNaam}
              onChange={(e) => setEigenNaam(e.target.value)}
              placeholder="Eigen vak…"
              className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-brand-dark/40"
            />
            <button
              type="submit"
              className="rounded-lg bg-brand-dark px-3 py-1.5 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.97]"
            >
              Toevoegen
            </button>
          </form>
        </div>

        <div className="border-t border-black/5 px-6 py-4">
          <button
            onClick={sluit}
            className="w-full rounded-xl bg-brand-dark px-4 py-2.5 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.98]"
          >
            Klaar
          </button>
        </div>

        {/* Kleurpalet voor een vak — wit is "geen kleur". */}
        {paletVoor && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setPaletVoor(null)} />
            <div
              style={{ left: paletVoor.x, top: paletVoor.y }}
              className="fixed z-[61] grid grid-cols-6 gap-1.5 rounded-xl border border-black/10 bg-white p-2 shadow-xl"
            >
              {KLEUR_OPTIES.map((opt) => (
                <button
                  key={opt.bg}
                  onClick={() => kiesKleur(paletVoor.id, opt)}
                  aria-label={opt.naam}
                  title={opt.naam}
                  className="h-6 w-6 rounded-md border border-black/15 transition-transform hover:scale-110"
                  style={{ background: opt.bg }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function VakKiezer({
  vakken,
  setup,
  x,
  y,
  kant,
  kies,
  eigenVak,
  verwijderVak,
  sluit,
}: {
  vakken: { id: string; naam: string }[];
  setup: RoosterSetup;
  x: number;
  y: number;
  kant: "links" | "rechts";
  kies: (vak: string, naam: string) => void;
  eigenVak: (naam: string) => void;
  verwijderVak: (id: string) => void;
  sluit: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(y);
  const [eigenNaam, setEigenNaam] = useState("");
  // Openvouwen én de positie bijstellen zodat het kiezertje volledig in beeld
  // valt (anders vallen onderaan de pagina vakken buiten beeld).
  useEffect(() => {
    setOpen(true);
    const el = ref.current;
    if (el) setTop(Math.max(8, Math.min(y, window.innerHeight - el.offsetHeight - 8)));
  }, [y]);

  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      style={{ left: x, top, width: 220 }}
      className={
        "fixed z-50 rounded-2xl border border-black/10 bg-white p-2 shadow-xl transition duration-150 ease-out " +
        (kant === "links" ? "origin-top-right " : "origin-top-left ") +
        (open ? "scale-100 opacity-100" : "scale-95 opacity-0")
      }
    >
      <div className="flex items-center justify-between pb-1 pl-2">
        <span className="text-xs font-bold uppercase tracking-wide text-ink/40">Welke les?</span>
        <button
          onClick={sluit}
          aria-label="Sluiten"
          className="flex h-6 w-6 items-center justify-center rounded-lg text-ink/45 transition-colors hover:bg-black/5 hover:text-ink"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
        {vakken.map((v) => {
          const kl = kleurVoor(v.id, setup);
          return (
            <div
              key={v.id}
              className="group/vak flex items-center rounded-lg transition-colors hover:bg-black/5"
            >
              <button
                onClick={() => kies(v.id, v.naam)}
                className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm font-semibold text-ink/80"
              >
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded"
                  style={{ background: kl.bg, boxShadow: `inset 0 0 0 1px ${kl.tekst}33` }}
                />
                <span className="truncate">{v.naam}</span>
              </button>
              <button
                onClick={() => verwijderVak(v.id)}
                aria-label={`${v.naam} uit de lijst halen`}
                className="mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-ink/30 opacity-0 transition hover:bg-black/10 hover:text-red-600 group-hover/vak:opacity-100"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* Een compleet nieuw vak dat nog niet in de lijst staat. */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const t = eigenNaam.trim();
          if (t) eigenVak(t);
        }}
        className="mt-1 flex items-center gap-1 border-t border-black/5 pt-1.5"
      >
        <input
          value={eigenNaam}
          onChange={(e) => setEigenNaam(e.target.value)}
          placeholder="Eigen vak…"
          className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-brand-dark/40"
        />
        <button
          type="submit"
          aria-label="Eigen vak toevoegen"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-dark text-lg font-bold text-white transition-transform duration-150 active:scale-[0.94]"
        >
          +
        </button>
      </form>
    </div>
  );
}

function KopieerMenu({
  bron,
  x,
  y,
  kant,
  kopieer,
}: {
  bron: number;
  x: number;
  y: number;
  kant: "links" | "rechts";
  kopieer: (doelen: number[]) => void;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(true), []);
  const anderen = [0, 1, 2, 3, 4].filter((d) => d !== bron);
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ left: x, top: y, width: 220 }}
      className={
        "fixed z-50 rounded-2xl border border-black/10 bg-white p-2 shadow-xl transition duration-150 ease-out " +
        (kant === "links" ? "origin-top-right " : "origin-top-left ") +
        (open ? "scale-100 opacity-100" : "scale-95 opacity-0")
      }
    >
      <p className="border-b border-black/5 px-2 pb-1.5 pt-1 text-sm font-bold text-ink">
        Dag kopiëren naar:
      </p>
      <div className="mt-1 flex flex-col gap-0.5">
        {anderen.map((d) => (
          <button
            key={d}
            onClick={() => kopieer([d])}
            className="rounded-lg px-2 py-1.5 text-left text-sm font-semibold capitalize text-ink/80 transition-colors hover:bg-black/5"
          >
            {DAGNAMEN[d]}
          </button>
        ))}
        <button
          onClick={() => kopieer(anderen)}
          className="mt-0.5 rounded-lg border-t border-black/5 px-2 pb-1.5 pt-2 text-left text-sm font-bold text-brand-dark transition-colors hover:bg-black/5"
        >
          Alle andere dagen
        </button>
      </div>
    </div>
  );
}

function TijdRij({
  label,
  tijd,
  eerder,
  later,
}: {
  label: string;
  tijd: string;
  eerder: () => void;
  later: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-cream/60 px-2 py-1.5">
      <span className="text-sm font-semibold text-ink/70">{label}</span>
      <span className="flex items-center gap-2">
        <button
          onClick={eerder}
          aria-label={`${label} eerder`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white text-lg font-bold text-ink/70 transition-transform duration-150 hover:text-ink active:scale-[0.94]"
        >
          –
        </button>
        <span className="min-w-[3.5rem] text-center text-sm tabular-nums text-ink/70">{tijd}</span>
        <button
          onClick={later}
          aria-label={`${label} later`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white text-lg font-bold text-ink/70 transition-transform duration-150 hover:text-ink active:scale-[0.94]"
        >
          +
        </button>
      </span>
    </div>
  );
}

function Blokkaart({
  blok,
  x,
  y,
  kant,
  beginEerder,
  beginLater,
  eindeEerder,
  eindeLater,
  zetKleur,
  zetOmschrijving,
  aantalZelfdeVak,
  overalGelijk,
  weghalen,
  sluit,
}: {
  blok: Roosterblok;
  x: number;
  y: number;
  kant: "links" | "rechts";
  beginEerder: () => void;
  beginLater: () => void;
  eindeEerder: () => void;
  eindeLater: () => void;
  zetKleur: (opt: { bg: string; tekst: string }) => void;
  zetOmschrijving: (tekst: string, overal: boolean) => void;
  /** Aantal blokken van hetzelfde vak, inclusief dit blok. */
  aantalZelfdeVak: number;
  /** Hebben die blokken nu al allemaal dezelfde omschrijving? */
  overalGelijk: boolean;
  weghalen: () => void;
  sluit: () => void;
}) {
  // Even openvouwen: klein en doorzichtig beginnen, dan op ware grootte, vanuit
  // de kant waar het blok staat.
  const [open, setOpen] = useState(false);
  const [paletOpen, setPaletOpen] = useState(false);
  // Staat er al iets, dan staat het tekstveld meteen open — anders zie je je
  // eigen aantekening niet als je het blok aanklikt.
  const [tekstOpen, setTekstOpen] = useState(Boolean(blok.omschrijving));
  // Geldt de omschrijving voor alle blokken van dit vak? Stond hij al overal
  // gelijk, dan begint het vinkje aan.
  const [overal, setOveral] = useState(overalGelijk);
  useEffect(() => setOpen(true), []);
  const duur = minuten(blok.eind) - minuten(blok.begin);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ left: x, top: y, width: 244 }}
      className={
        "fixed z-50 rounded-2xl border border-black/10 bg-white p-3 shadow-xl transition duration-150 ease-out " +
        (kant === "links" ? "origin-top-right " : "origin-top-left ") +
        (open ? "scale-100 opacity-100" : "scale-95 opacity-0")
      }
    >
      {/* Kopregel altijd op één regel: naam kort af, tijd blijft ernaast. Het
          vakje ervoor toont de kleur van dit vak; klik erop om hem te wijzigen. */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPaletOpen((o) => !o)}
          aria-label={`Kleur van ${blok.naam} kiezen`}
          aria-expanded={paletOpen}
          title="Kleur kiezen"
          className="h-6 w-6 shrink-0 rounded-md transition-transform hover:scale-110 active:scale-95"
          style={{
            background: blok.kleur?.bg,
            boxShadow: `inset 0 0 0 1px ${blok.kleur?.tekst ?? "#000"}55`,
          }}
        />
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{blok.naam}</span>
        <span className="shrink-0 text-sm tabular-nums text-ink/55">{duur} min</span>
        <button
          onClick={sluit}
          aria-label="Sluiten"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink/45 transition-colors hover:bg-black/5 hover:text-ink"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* Begin en einde apart, zodat je zowel de boven- als de onderkant kunt
          verschuiven. */}
      <div className="mt-3 flex flex-col gap-1.5">
        <TijdRij label="Begin" tijd={blok.begin} eerder={beginEerder} later={beginLater} />
        <TijdRij label="Einde" tijd={blok.eind} eerder={eindeEerder} later={eindeLater} />
      </div>

      {/* Eén knop voor je eigen aantekening bij dit blok. Klik en er klapt een
          tekstveld open; klik nog eens en het gaat weer dicht. De tekst reist
          mee met het basisrooster en komt terug in het weekrooster. */}
      <div className="mt-1.5">
        <button
          onClick={() => setTekstOpen((o) => !o)}
          aria-expanded={tekstOpen}
          className="flex w-full items-center gap-2 rounded-xl bg-cream/60 px-2 py-1.5 text-left text-sm font-semibold text-ink/70 transition-colors hover:text-ink"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ink/45">
            <path d="M4 6h16M4 11h16M4 16h9" />
          </svg>
          <span className="min-w-0 flex-1 truncate">
            {blok.omschrijving || "Omschrijving toevoegen"}
          </span>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={"shrink-0 text-ink/40 transition-transform " + (tekstOpen ? "rotate-180" : "")}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {tekstOpen && (
          <>
            <textarea
              autoFocus={!blok.omschrijving}
              value={blok.omschrijving ?? ""}
              onChange={(e) => zetOmschrijving(e.target.value, overal)}
              rows={3}
              className="mt-1 w-full resize-none rounded-xl border border-black/10 bg-white px-2 py-1.5 text-sm leading-6 text-ink outline-none focus:border-brand-dark/40"
            />
            {/* Alleen zinvol als dit vak vaker in de week staat. */}
            {aantalZelfdeVak > 1 && (
              <label className="mt-1 flex cursor-pointer items-center gap-2 px-0.5 text-xs text-ink/60">
                <input
                  type="checkbox"
                  checked={overal}
                  onChange={(e) => {
                    setOveral(e.target.checked);
                    // Staat er al iets, dan meteen doorzetten zodat je het effect
                    // direct ziet. Is het veld leeg, dan wissen we niet stiekem
                    // de aantekeningen van de andere blokken.
                    if (e.target.checked && blok.omschrijving?.trim())
                      zetOmschrijving(blok.omschrijving, true);
                  }}
                  className="h-3.5 w-3.5 shrink-0 rounded border-black/20 accent-brand"
                />
                <span className="min-w-0 truncate">
                  Bij alle {aantalZelfdeVak} {blok.naam}-blokken
                </span>
              </label>
            )}
          </>
        )}
      </div>

      {/* Het kleurmenu, onder het vakje. De kleur hoort bij het vak, dus alle
          blokken van dit vak kleuren meteen mee. Wit = geen kleur. */}
      {paletOpen && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setPaletOpen(false)} />
          <div className="absolute left-3 top-11 z-[56] grid grid-cols-6 gap-1.5 rounded-xl border border-black/10 bg-white p-2 shadow-xl">
            {KLEUR_OPTIES.map((opt) => (
              <button
                key={opt.bg}
                onClick={() => {
                  zetKleur(opt);
                  setPaletOpen(false);
                }}
                aria-label={opt.naam}
                title={opt.naam}
                className="h-6 w-6 rounded-md border border-black/15 transition-transform hover:scale-110"
                style={{ background: opt.bg }}
              />
            ))}
          </div>
        </>
      )}

      <button
        onClick={weghalen}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 transition-transform duration-150 active:scale-[0.98]"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
        </svg>
        Weghalen
      </button>
    </div>
  );
}

type Sleep = {
  id: string;
  modus: "verplaats" | "top" | "onder";
  weekdag: number;
  start: number;
  duur: number;
  dx: number;
  dy: number;
};
type Drag = {
  id: string;
  modus: "verplaats" | "top" | "onder";
  startX: number;
  startY: number;
  origStart: number;
  origDuur: number;
  origEind: number;
  origWeekdag: number;
  bewogen: boolean;
};

function Bewerkraster({
  lessen,
  gekozenId,
  kies,
  zetBlok,
  kopieerDag,
  nieuwOp,
  voorbeeld,
}: {
  lessen: Roosterblok[];
  gekozenId: string | null;
  kies: (id: string, el: HTMLElement) => void;
  zetBlok: (id: string, w: { weekdag?: number; start?: number; duur?: number }) => void;
  kopieerDag: (bron: number, doelen: number[]) => void;
  nieuwOp: (
    weekdag: number,
    start: number,
    duur: number,
    x: number,
    y: number,
    kant: "links" | "rechts",
  ) => void;
  voorbeeld: { weekdag: number; start: number; duur: number } | null;
}) {
  const PX = 1.7; // px per minuut; ruim genoeg dat ook een 10-min-blok (15px) de
  //                letterstaartjes (p/g/j) volledig toont
  const RAND = 9; // px boven-/onderrand waar je kunt trekken (i.p.v. verplaatsen)
  const BOVEN = 20; // lucht boven de eerste les/tijd, zodat het niet krap begint
  const grenzen = rasterGrenzen(lessen);
  const rasterBegin = minuten(grenzen.begin);
  const rasterTot = minuten(grenzen.eind);
  const hoogte = Math.max(1, rasterTot - rasterBegin);
  const y = (m: number) => (m - rasterBegin) * PX + BOVEN;

  const uren: number[] = [];
  for (let m = Math.ceil(rasterBegin / 60) * 60; m <= rasterTot; m += 60) uren.push(m);
  const ankers: number[] = [];
  if (rasterBegin % 60 !== 0) ankers.push(rasterBegin);
  if (rasterTot % 60 !== 0) ankers.push(rasterTot);
  const tijdstippen = [...uren, ...ankers].sort((a, b) => a - b);

  // Slepen: verplaatsen (naar een andere dag/tijd) of aan de boven-/onderrand
  // trekken (korter/langer). We snappen op 5 minuten en houden de live-stand in
  // `sleep`; pas bij loslaten leggen we het echt vast (via zetBlok → geschiedenis).
  const gridRef = useRef<HTMLDivElement>(null);
  const [sleep, setSleep] = useState<Sleep | null>(null);
  const sleepRef = useRef<Sleep | null>(null);
  sleepRef.current = sleep;
  const dragRef = useRef<Drag | null>(null);
  const sleepEinde = useRef(0); // tijdstip van de laatste écht-gesleepte beweging
  // Waar de muis in de lege ruimte staat: toont alvast een plek voor een nieuwe
  // les, plus de grenzen van de vrije ruimte (voor het 10-minuten-raster).
  const [hover, setHover] = useState<{
    weekdag: number;
    start: number;
    duur: number;
    gapStart: number;
    gapEind: number;
  } | null>(null);
  // Het "kopieer dag"-menu: welke dag we kopiëren en waar het menu staat.
  const [kopieer, setKopieer] = useState<{
    bron: number;
    x: number;
    y: number;
    kant: "links" | "rechts";
  } | null>(null);

  function openKopieer(weekdag: number, el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const breedte = 220;
    let x = r.left;
    let kant: "links" | "rechts" = "rechts";
    if (x + breedte > window.innerWidth - 8) {
      x = r.right - breedte;
      kant = "links";
    }
    x = Math.max(8, x);
    setKopieer({ bron: weekdag, x, y: r.bottom + 6, kant });
  }

  // Linkerkant en breedte van één dagkolom (om bij het slepen de dag te bepalen).
  function kolommen() {
    const r = gridRef.current?.getBoundingClientRect();
    const gutter = 56; // 3.5rem
    return { linkerkant: (r?.left ?? 0) + gutter, breedte: r ? (r.width - gutter) / 5 : 0 };
  }

  function omlaag(e: ReactPointerEvent, b: Roosterblok) {
    if (e.button > 0) return;
    e.preventDefault();
    setHover(null);
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    let modus: Drag["modus"] = "verplaats";
    if (rect.height >= 24) {
      if (offsetY <= RAND) modus = "top";
      else if (offsetY >= rect.height - RAND) modus = "onder";
    }
    const origStart = minuten(b.begin);
    const origDuur = minuten(b.eind) - minuten(b.begin);
    dragRef.current = {
      id: b.id,
      modus,
      startX: e.clientX,
      startY: e.clientY,
      origStart,
      origDuur,
      origEind: origStart + origDuur,
      origWeekdag: b.weekdag,
      bewogen: false,
    };
    el.style.cursor = modus === "verplaats" ? "grabbing" : "ns-resize";
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}
  }

  function beweeg(e: ReactPointerEvent) {
    const d = dragRef.current;
    if (!d) {
      // Niet aan het slepen: het handje wordt een sleeppijltje op de randen,
      // zodat je ziet waar je kunt trekken om korter/langer te maken.
      const el = e.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const opRand = rect.height >= 24 && (offsetY <= RAND || offsetY >= rect.height - RAND);
      el.style.cursor = opRand ? "ns-resize" : "";
      return;
    }
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.bewogen && Math.abs(dx) + Math.abs(dy) > 4) d.bewogen = true;
    if (!d.bewogen) return;
    const dyMin = snap5(dy / PX);
    if (d.modus === "verplaats") {
      const k = kolommen();
      let dag = k.breedte ? Math.floor((e.clientX - k.linkerkant) / k.breedte) : d.origWeekdag;
      dag = Math.max(0, Math.min(4, dag));
      const start = Math.max(0, d.origStart + dyMin);
      setSleep({
        id: d.id,
        modus: "verplaats",
        weekdag: dag,
        start,
        duur: d.origDuur,
        dx: (dag - d.origWeekdag) * k.breedte,
        dy: (start - d.origStart) * PX,
      });
    } else if (d.modus === "top") {
      const start = Math.min(d.origEind - 10, Math.max(0, d.origStart + dyMin));
      setSleep({ id: d.id, modus: "top", weekdag: d.origWeekdag, start, duur: d.origEind - start, dx: 0, dy: 0 });
    } else {
      const duur = Math.max(10, Math.min(180, d.origDuur + dyMin));
      setSleep({ id: d.id, modus: "onder", weekdag: d.origWeekdag, start: d.origStart, duur, dx: 0, dy: 0 });
    }
  }

  function omhoog(e: ReactPointerEvent, b: Roosterblok) {
    const d = dragRef.current;
    dragRef.current = null;
    const el = e.currentTarget as HTMLElement;
    el.style.cursor = "";
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {}
    if (!d) return;
    const s = sleepRef.current;
    setSleep(null);
    // Niet echt gesleept? Dan telt het als een klik: open het kaartje.
    if (!d.bewogen || !s) {
      kies(b.id, e.currentTarget as HTMLElement);
      return;
    }
    sleepEinde.current = performance.now();
    zetBlok(s.id, { weekdag: s.weekdag, start: s.start, duur: s.duur });
  }

  // De ruwe (ongesnapte) tijd bij een verticale muispositie; het snappen gebeurt
  // gap-gebaseerd in plekBij.
  function tijdBijMuis(clientY: number, rect: DOMRect): number {
    const t = (clientY - rect.top - BOVEN) / PX + rasterBegin;
    return Math.max(rasterBegin, Math.min(rasterTot, t));
  }

  // Is er op deze muispositie (in deze dag) plek voor een nieuwe les? Zo ja, waar
  // en hoe lang? Bezet (er staat al een les op dat moment) → geen plek. Anders
  // bepalen we de vrije ruimte (van het blok erboven tot het blok eronder) en
  // snappen we op 10 min VANAF de bovenkant van die ruimte, zodat je een gap ook
  // helemaal kunt vullen als het blok erboven op een oneven tijd eindigt.
  function plekBij(
    weekdag: number,
    rawT: number,
  ): { start: number; duur: number; gapStart: number; gapEind: number } | null {
    const dag = lessen
      .filter((b) => b.weekdag === weekdag)
      .map((b) => ({ s: minuten(b.begin), e: minuten(b.eind) }));
    if (dag.some((b) => b.s <= rawT && rawT < b.e)) return null; // bezet op dit moment
    let gapStart = rasterBegin;
    for (const b of dag) if (b.e <= rawT && b.e > gapStart) gapStart = b.e;
    let gapEind = rasterTot;
    for (const b of dag) if (b.s > rawT && b.s < gapEind) gapEind = b.s;
    let start = gapStart + Math.round((rawT - gapStart) / 10) * 10;
    start = Math.max(gapStart, Math.min(gapEind - 10, start));
    const duur = Math.min(45, gapEind - start);
    // Een les is minstens 10 minuten; minder ruimte bieden we niet aan.
    if (duur < 10) return null;
    return { start, duur, gapStart, gapEind };
  }

  // Muis over de lege ruimte: alvast een plek tonen onder de cursor.
  function beweegLeeg(e: ReactMouseEvent, weekdag: number) {
    if (dragRef.current) return;
    if (e.target !== e.currentTarget) {
      setHover(null);
      return;
    }
    const T = tijdBijMuis(e.clientY, (e.currentTarget as HTMLElement).getBoundingClientRect());
    const plek = plekBij(weekdag, T);
    setHover((h) =>
      plek === null
        ? null
        : h && h.weekdag === weekdag && h.start === plek.start && h.duur === plek.duur
          ? h
          : { weekdag, ...plek },
    );
  }

  // Klik op een lege plek in een dagkolom → een nieuw vak toevoegen op die tijd.
  function klikLeeg(e: ReactMouseEvent, weekdag: number) {
    if (e.target !== e.currentTarget) return; // alleen de lege achtergrond, geen blok
    if (performance.now() - sleepEinde.current < 250) return; // net gesleept: geen toevoeg
    const T = tijdBijMuis(e.clientY, (e.currentTarget as HTMLElement).getBoundingClientRect());
    const plek = plekBij(weekdag, T);
    if (plek === null) return; // bezet: hier niets plaatsen
    const start = plek.start;
    const breedte = 220;
    let x = e.clientX + 8;
    let kant: "links" | "rechts" = "rechts";
    if (x + breedte > window.innerWidth - 8) {
      x = e.clientX - breedte - 8;
      kant = "links";
    }
    x = Math.max(8, x);
    // De y-positie mag ruw; het kiezertje zet zichzelf zo nodig hoger zodat het
    // volledig in beeld valt.
    nieuwOp(weekdag, start, plek.duur, x, e.clientY, kant);
  }

  return (
    <>
    <div className="overflow-x-auto">
      <div className="min-w-[46rem] overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        {/* Dagkoppen — geen datums, want dit is het sjabloon. */}
        <div className="grid grid-cols-[3.5rem_repeat(5,minmax(0,1fr))] border-b border-black/5">
          <div />
          {DAGNAMEN.map((naam, weekdag) => (
            <div
              key={naam}
              className="flex items-center justify-between gap-1 border-l border-black/5 px-2 py-2"
            >
              <span className="truncate text-sm font-bold text-ink">{naam}</span>
              <button
                onClick={(e) => openKopieer(weekdag, e.currentTarget)}
                aria-label={`${naam} kopiëren naar een andere dag`}
                title="Kopieer deze dag"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-ink/35 transition-colors hover:bg-black/5 hover:text-ink"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Het lesrooster */}
        <div
          ref={gridRef}
          className="relative grid grid-cols-[3.5rem_repeat(5,minmax(0,1fr))]"
          // Lucht boven (BOVEN) en onderaan zodat het raster niet strak afkapt (en
          // je iets ruimer kunt slepen).
          style={{ height: hoogte * PX + BOVEN + 36 }}
        >
          <div className="relative">
            {tijdstippen.map((m) => (
              <span
                key={m}
                className="absolute right-2 -translate-y-1/2 text-xs tabular-nums text-ink/45"
                style={{ top: y(m) }}
              >
                {tijdTekst(m)}
              </span>
            ))}
          </div>

          {[0, 1, 2, 3, 4].map((weekdag) => {
            const dagBlokken = lessen.filter((b) => b.weekdag === weekdag);
            const schik = schikDag(dagBlokken);
            // De voorbeeld-plek: bij een open kiezertje de gekozen plek (steviger),
            // anders de plek onder je muis (lichter, met +).
            const spook =
              voorbeeld && voorbeeld.weekdag === weekdag
                ? voorbeeld
                : !voorbeeld && hover && hover.weekdag === weekdag
                  ? hover
                  : null;
            const spookStevig = Boolean(voorbeeld && voorbeeld.weekdag === weekdag);
            // Het voorbeeld precies zo hoog als de vrije ruimte (geen minimum van
            // 17), anders zou het bij een korte gap over de les eronder vallen.
            const spookH = spook ? Math.max(6, spook.duur * PX - 2) : 0;
            return (
              <div
                key={weekdag}
                className="relative border-l border-black/5"
                onClick={(e) => klikLeeg(e, weekdag)}
                onMouseMove={(e) => beweegLeeg(e, weekdag)}
                onMouseLeave={() => setHover(null)}
              >
                {uren
                  .filter((m) => m !== rasterBegin && m !== rasterTot)
                  .map((m) => (
                    <div
                      key={"lijn" + m}
                      className="pointer-events-none absolute inset-x-0 border-t border-black/[0.06]"
                      style={{ top: y(m) }}
                    />
                  ))}
                {/* Het 10-minuten-raster binnen de vrije ruimte waar je hovert —
                    vastgepind op de bovenkant van die ruimte. */}
                {hover &&
                  hover.weekdag === weekdag &&
                  !voorbeeld &&
                  Array.from(
                    { length: Math.max(0, Math.ceil((hover.gapEind - hover.gapStart) / 10) - 1) },
                    (_, i) => hover.gapStart + (i + 1) * 10,
                  )
                    .filter((m) => m < hover.gapEind)
                    .map((m) => (
                      <div
                        key={"tien" + m}
                        className="pointer-events-none absolute inset-x-0 border-t border-black/[0.045]"
                        style={{ top: y(m) }}
                      />
                    ))}
                {dagBlokken.map((b) => {
                  // Wordt dit blok gesleept? Bij verplaatsen doet de transform het
                  // werk (top blijft staan); bij randen trekken verandert de
                  // top/hoogte juist wél. Anders zou de beweging dubbel tellen.
                  const s = sleep && sleep.id === b.id ? sleep : null;
                  const herschaal = s !== null && s.modus !== "verplaats";
                  const startMin = herschaal ? s.start : minuten(b.begin);
                  const duurMin = herschaal ? s.duur : minuten(b.eind) - minuten(b.begin);
                  const top = (startMin - rasterBegin) * PX + BOVEN;
                  // Echte hoogte (geen minimum van 17), anders steekt een kort blok
                  // over zijn buuronder heen. Tekst die niet past, wordt afgekapt.
                  const h = Math.max(6, duurMin * PX - 2);
                  const actief = b.id === gekozenId;
                  // Overlappende lessen naast elkaar: eigen kolom binnen de dag.
                  const { kol, n } = schik.get(b.id) ?? { kol: 0, n: 1 };
                  const left = `calc(${(kol * 100) / n}% + 4px)`;
                  const breedte = `calc(${100 / n}% - 8px)`;
                  // Breed blok: naam + tijd naast elkaar op één regel (past ook
                  // bij een kort blok). Smal (overlappend) blok: naam boven, tijd
                  // eronder — en alleen als het hoog genoeg is, anders zou de tijd
                  // in een te klein blokje worden gepropt.
                  const smal = n > 1;
                  const tijdTonen = !smal || h >= 30;
                  const gestapeld = smal && tijdTonen;
                  const toonBegin = s ? tijdTekst(s.start) : b.begin;
                  const stijl: CSSProperties = {
                    top,
                    height: h,
                    left,
                    width: breedte,
                    background: b.kleur?.bg,
                  };
                  // Een (bijna-)wit blok krijgt een iets duidelijkere rand; het
                  // gekozen blok houdt zijn brand-rand + ring.
                  if (!actief) stijl.borderColor = randKleur(b.kleur?.bg);
                  if (s) {
                    stijl.zIndex = 50;
                    stijl.boxShadow = "0 10px 24px rgba(0,0,0,0.18)";
                    if (s.modus === "verplaats") stijl.transform = `translate(${s.dx}px, ${s.dy}px)`;
                  }
                  return (
                    <button
                      key={b.id}
                      onPointerDown={(e) => omlaag(e, b)}
                      onPointerMove={beweeg}
                      onPointerUp={(e) => omhoog(e, b)}
                      title={`${b.naam} ${b.begin}–${b.eind}`}
                      className={
                        "group absolute cursor-grab touch-none select-none overflow-hidden rounded-lg border px-1.5 py-0 text-left transition-shadow active:cursor-grabbing " +
                        (gestapeld ? "flex flex-col " : "flex items-baseline gap-1.5 ") +
                        (actief
                          ? "border-brand-dark ring-2 ring-brand-dark/40"
                          : "border-black/5 hover:ring-2 hover:ring-black/10")
                      }
                      style={stijl}
                    >
                      <span
                        className={
                          "truncate text-xs font-bold leading-tight " +
                          (tijdTonen && !smal ? "min-w-0 flex-1" : "")
                        }
                        style={{ color: b.kleur?.tekst }}
                      >
                        {b.naam}
                      </span>
                      {tijdTonen && (
                        <span
                          className={
                            "text-xs leading-tight tabular-nums opacity-60 " +
                            (gestapeld ? "truncate" : "shrink-0")
                          }
                          style={{ color: b.kleur?.tekst }}
                        >
                          {toonBegin}
                        </span>
                      )}
                      {/* Sleepgrepen boven en onder (bij hover) om te verlengen. */}
                      {h >= 24 && (
                        <>
                          <span className="pointer-events-none absolute left-1/2 top-0.5 h-1 w-6 -translate-x-1/2 rounded-full bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                          <span className="pointer-events-none absolute bottom-0.5 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                        </>
                      )}
                    </button>
                  );
                })}
                {/* Voorbeeld-plek: onder de muis (hover) of de gekozen plek (kiezertje).
                    De hoogte volgt de vrije ruimte; de tijd staat bovenin. Plus een
                    zwarte stippellijn op de begin- en eindtijd, over de hele kolom. */}
                {spook && (
                  <div
                    className={
                      "pointer-events-none absolute left-1 right-1 overflow-hidden rounded-lg border border-dashed px-1.5 py-0 " +
                      (spookStevig
                        ? "border-brand-dark/60 bg-brand-soft/60"
                        : "border-brand-dark/40 bg-brand-soft/35")
                    }
                    style={{
                      top: (spook.start - rasterBegin) * PX + BOVEN,
                      height: spookH,
                    }}
                  >
                    <span className="flex items-center gap-0.5 text-xs font-bold leading-none tabular-nums text-brand-dark">
                      {!spookStevig && <span>+</span>}
                      {tijdTekst(spook.start)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Duidelijke stippellijnen over de hele breedte op de begin- en eindtijd
              van de schooldag — zo zie je precies tot waar je kunt plannen. */}
          <div
            className="pointer-events-none absolute left-14 right-0 z-20 border-t border-dashed border-black/45"
            style={{ top: y(rasterBegin) - 2 }}
          />
          <div
            className="pointer-events-none absolute left-14 right-0 z-20 border-t border-dashed border-black/45"
            style={{ top: y(rasterTot) }}
          />
        </div>
      </div>
    </div>

      {kopieer && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setKopieer(null)} />
          <KopieerMenu
            bron={kopieer.bron}
            x={kopieer.x}
            y={kopieer.y}
            kant={kopieer.kant}
            kopieer={(doelen) => {
              kopieerDag(kopieer.bron, doelen);
              setKopieer(null);
            }}
          />
        </>
      )}
    </>
  );
}

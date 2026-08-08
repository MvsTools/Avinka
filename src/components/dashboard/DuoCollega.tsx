"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  getKlassen,
  getDuoKoppels,
  getKlasCollegas,
  getGedeeldeMap,
  maakDuoUitnodiging,
  bekijkDuoUitnodiging,
  accepteerDuoUitnodiging,
  verbreekDuo,
  zetGedeeldeMap,
  getBestanden,
  addMap,
  type Klas,
  type DuoKoppel,
  type DuoRol,
  type DuoUitnodiging,
  type KlasCollega,
  type Bestand,
} from "@/lib/db";
import { meldVoorkeurenGewijzigd } from "@/lib/voorkeuren-verversen";

// Collega's bij deze groep: samen één klas draaien. Was eerst alleen voor een
// duobaan (twee leerkrachten), maar er kunnen er meer bij — een assistent
// bijvoorbeeld. Daarom is dit scherm per GROEP opgebouwd en niet per koppel.
//
// Uitnodigen werkt via een deelbare code/link, en pas ná expliciete acceptatie
// door de ander gaat de toegang open — dat opent gedeelde rapporten en
// bestanden, dus nooit stilzwijgend.

// Naam voor de gedeelde map. Klassen heten bij de een "7" en bij de ander
// "groep 7"; blind "Groep " ervoor plakken gaf dan "Groep groep 7". Staat het
// woord er al, dan gebruiken we de klasnaam zoals hij is (met een hoofdletter).
function gedeeldeMapNaam(klasNaam: string): string {
  const naam = klasNaam.trim();
  if (!naam) return "Gedeelde map";
  if (/^groep\b/i.test(naam)) return naam.charAt(0).toUpperCase() + naam.slice(1);
  return `Groep ${naam}`;
}

export default function DuoCollega() {
  const router = useRouter();
  const pathname = usePathname();
  const zoekParams = useSearchParams();

  const [klassen, setKlassen] = useState<Klas[]>([]);
  const [koppels, setKoppels] = useState<DuoKoppel[]>([]);
  const [bestanden, setBestanden] = useState<Bestand[]>([]);
  const [leden, setLeden] = useState<Record<string, KlasCollega[]>>({});
  const [mappen, setMappen] = useState<Record<string, { id: string; naam: string } | null>>({});
  const [laden, setLaden] = useState(true);
  const [mapKiezerVoor, setMapKiezerVoor] = useState<string | null>(null);
  const [mapBezig, setMapBezig] = useState(false);

  const [gekozenKlas, setGekozenKlas] = useState("");
  /* Er is nog maar één soort toegang, dus dit is geen keuze meer maar een vaste
     waarde. Bewust wél meegestuurd naar de server in plaats van weggelaten: dan
     staat er in de rij expliciet wat er bedoeld is, ook als de rolkeuze later
     bij de schoollicentie terugkomt. */
  const gekozenRol: DuoRol = "volledig";
  const [nieuweLink, setNieuweLink] = useState("");
  /* Het adres van je collega. Leeg = de oude werkwijze: je krijgt een link die
     je zelf doorstuurt. Ingevuld = het bericht gaat automatisch de deur uit,
     en dan is de uitnodiging ALLEEN te accepteren door precies dat adres. */
  const [gekozenEmail, setGekozenEmail] = useState("");
  const [verstuurdNaar, setVerstuurdNaar] = useState("");
  const [gekopieerd, setGekopieerd] = useState(false);
  const [uitnodigenBezig, setUitnodigenBezig] = useState(false);
  const [uitnodigenFout, setUitnodigenFout] = useState("");

  const uitnodigingsCode = zoekParams.get("duo");
  const [voorbeeld, setVoorbeeld] = useState<
    DuoUitnodiging | null | "laden" | "fout"
  >(uitnodigingsCode ? "laden" : null);
  const [accepterenBezig, setAccepterenBezig] = useState(false);
  /* Naam van de groep waar je zojuist bij kwam. Niet meteen dichtklappen na
     het accepteren: dan weet je niet of het gelukt is, en al helemaal niet dat
     je zelf nog moet wisselen als je een eigen klas hebt. */
  const [geaccepteerd, setGeaccepteerd] = useState<string | null>(null);
  const [handmatigeCode, setHandmatigeCode] = useState("");
  /* Een mislukte rol- of loskoppelactie liet hiervoor niets zien: de knop deed
     gewoon niets en je bleef zitten met de vraag of je het wel goed had
     aangeklikt. */
  const [actieFout, setActieFout] = useState("");

  async function laadAlles() {
    const [k, d, b] = await Promise.all([getKlassen(), getDuoKoppels(), getBestanden()]);
    setKlassen(k);
    setKoppels(d);
    setBestanden(b);
    setLaden(false);

    // Per gedeelde groep: wie hoort erbij (naam + mailadres, uit auth.users via
    // een security-definer functie) en welke map jullie delen.
    const klasIds = [...new Set(d.filter((x) => x.status === "actief").map((x) => x.klasId))];
    const [alleLeden, alleMappen] = await Promise.all([
      Promise.all(klasIds.map((id) => getKlasCollegas(id))),
      Promise.all(klasIds.map((id) => getGedeeldeMap(id))),
    ]);
    const l: Record<string, KlasCollega[]> = {};
    const m: Record<string, { id: string; naam: string } | null> = {};
    klasIds.forEach((id, i) => {
      l[id] = alleLeden[i];
      m[id] = alleMappen[i];
    });
    setLeden(l);
    setMappen(m);
  }

  useEffect(() => {
    (async () => {
      await laadAlles();
    })();
  }, []);

  useEffect(() => {
    if (!uitnodigingsCode) return;
    bekijkDuoUitnodiging(uitnodigingsCode).then((v) => setVoorbeeld(v ?? "fout"));
  }, [uitnodigingsCode]);

  // Escape sluit de pop-up, net als "Later". Niet tijdens het accepteren: dan
  // loopt er een verzoek en zou je het scherm kwijtraken zonder de uitkomst.
  useEffect(() => {
    if (!uitnodigingsCode || !voorbeeld || accepterenBezig) return;
    function bijToets(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (geaccepteerd) sluitBevestiging();
      else verwijderDuoParam();
    }
    window.addEventListener("keydown", bijToets);
    return () => window.removeEventListener("keydown", bijToets);
  });

  function verwijderDuoParam() {
    const params = new URLSearchParams(zoekParams.toString());
    params.delete("duo");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }

  // Een met de hand ingevulde code zetten we in de link, zodat hij daarna
  // exact dezelfde weg aflegt als een code uit een uitnodigingslink.
  function bekijkCode(code: string) {
    const c = code.trim().toUpperCase();
    if (!c) return;
    const params = new URLSearchParams(zoekParams.toString());
    params.set("duo", c);
    router.replace(`${pathname}?${params.toString()}`);
  }

  async function accepteer() {
    if (!uitnodigingsCode) return;
    setAccepterenBezig(true);
    const naam =
      typeof voorbeeld === "object" && voorbeeld !== null ? voorbeeld.klasNaam : "";
    const ok = await accepteerDuoUitnodiging(uitnodigingsCode);
    setAccepterenBezig(false);
    if (ok) {
      setGeaccepteerd(naam || "deze groep");
      laadAlles();
      // Accepteren vult school en groep in (zie duo_koppel_accepteren). Het
      // formulier daaronder heeft zijn waarden al geladen en zou anders leeg
      // blijven staan terwijl ze wél gevuld zijn.
      meldVoorkeurenGewijzigd();
    } else {
      setVoorbeeld("fout");
    }
  }

  function sluitBevestiging() {
    setGeaccepteerd(null);
    setVoorbeeld(null);
    verwijderDuoParam();
  }

  async function nodigUit() {
    if (!gekozenKlas) return;
    setUitnodigenBezig(true);
    setUitnodigenFout("");
    setVerstuurdNaar("");
    const adres = gekozenEmail.trim();

    // Met adres: de server maakt de uitnodiging én verstuurt de mail. Dat moet
    // daar gebeuren, want de verzendsleutel hoort niet in de browser.
    if (adres) {
      try {
        const r = await fetch("/api/duo/uitnodigen", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ klasId: gekozenKlas, rol: gekozenRol, email: adres }),
        });
        const d = await r.json();
        setUitnodigenBezig(false);
        if (r.ok) {
          setVerstuurdNaar(d.naar ?? adres);
          // Bewust GEEN linkveld tonen als de mail gelukt is: je hebt net iets
          // verstuurd, en dan leest een kopieerknop als "je moet nog iets".
          // De link blijft bereikbaar bij de openstaande uitnodiging hierboven,
          // en daar hoort hij ook thuis.
          setNieuweLink("");
          setGekozenEmail("");
          laadAlles();
          return;
        }
        // De uitnodiging bestaat soms wél terwijl de mail niet aankwam. Dan is
        // de link nog steeds bruikbaar, dus die tonen we alsnog.
        if (d.link) setNieuweLink(d.link);
        setUitnodigenFout(
          d.error === "ongeldig_adres"
            ? "Dat lijkt geen geldig e-mailadres."
            : d.error === "eigen_adres"
              ? "Dat is je eigen adres. Vul het adres van je duo in."
              : d.error === "mail_mislukt"
                ? "De uitnodiging staat klaar, maar de mail is niet verstuurd. Stuur de link hieronder zelf even door."
                : "Het uitnodigen lukte niet. Probeer het zo nog eens.",
        );
        laadAlles();
      } catch {
        setUitnodigenBezig(false);
        setUitnodigenFout("Geen verbinding met de server. Probeer het zo nog eens.");
      }
      return;
    }

    // Zonder adres: de oude weg, een link die je zelf doorstuurt.
    const code = await maakDuoUitnodiging(gekozenKlas, gekozenRol);
    setUitnodigenBezig(false);
    if (code) {
      setNieuweLink(`${window.location.origin}/dashboard/instellingen?duo=${code}`);
      laadAlles();
    } else {
      setUitnodigenFout("Het maken van de link lukte niet. Probeer het zo nog eens.");
    }
  }

  async function kopieer(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2000);
    } catch {
      /* niets */
    }
  }

  async function loskoppelen(koppel: DuoKoppel) {
    setActieFout("");
    const wie = koppel.status === "actief" ? "Je duo loskoppelen?" : "Uitnodiging intrekken?";
    if (!confirm(`${wie} Gedeelde toegang stopt meteen.`)) return;
    if (await verbreekDuo(koppel.id)) laadAlles();
    else setActieFout("Loskoppelen is niet gelukt. Probeer het zo nog eens.");
  }

  // Zelf uit een groep van een ander stappen. Dezelfde handeling als
  // loskoppelen (het is één koppelrij), maar vanaf de andere kant en dus met
  // andere woorden: je verwijdert niet iemand, je gaat er zelf uit.
  async function verlaatGroep(koppel: DuoKoppel, klasNaam: string) {
    setActieFout("");
    if (!confirm(`${klasNaam || "Deze groep"} verlaten? Je toegang stopt meteen.`)) return;
    if (await verbreekDuo(koppel.id)) laadAlles();
    else setActieFout("Verlaten is niet gelukt. Probeer het zo nog eens.");
  }

  async function kiesGedeeldeMap(klasId: string, mapId: string) {
    setMapBezig(true);
    const ok = await zetGedeeldeMap(klasId, mapId);
    setMapBezig(false);
    if (ok) {
      setMapKiezerVoor(null);
      laadAlles();
    }
  }

  async function nieuweGedeeldeMap(klasId: string, klasNaam: string) {
    setMapBezig(true);
    const map = await addMap(gedeeldeMapNaam(klasNaam), null);
    if (map) await zetGedeeldeMap(klasId, map.id);
    setMapBezig(false);
    setMapKiezerVoor(null);
    laadAlles();
  }

  const topMappen = bestanden.filter((b) => b.type === "map" && !b.parent_id);
  const klasNaamVan = (id: string) => klassen.find((k) => k.id === id)?.naam ?? "";

  // Alles wat je deelt, gegroepeerd per groep: de actieve collega's plus de
  // uitnodigingen die nog open staan.
  /* Ben ik de eigenaar van deze groep, of ben ik er als collega bijgekomen?
     Dat bepaalt wat je met de andere leden mag. Zonder dit onderscheid hangen
     de knoppen aan de verkeerde persoon: de koppelrij beschrijft "de ander", en
     vanuit een collega gezien is die ander juist de eigenaar. Een meekijker zag
     daardoor bij de eigenaar een knop "Rol wijzigen" (die de database terecht
     weigerde) en een knop die eruitzag alsof hij de eigenaar loskoppelde. */
  const ikBenEigenaar = (klasId: string) =>
    klassen.find((k) => k.id === klasId)?.eigenKlas === true;

  /* 🔑 UITNODIGEN KAN ALLEEN VOOR EEN GROEP DIE VAN JOU IS.
     De database dwingt dat al af: de insert-policy op `duo_koppels` eist
     `k.user_id = auth.uid()` (zie schema.sql). Maar het scherm liet álle
     groepen zien, dus ook die van een collega — en dan sta je een uitnodiging
     te versturen die achteraf geweigerd wordt. De eigenaar liep daar 8-8
     tegenaan als meekijker.
     ⚠️ Dit is dus geen beveiliging, dat is de policy. Dit voorkomt dat we iets
     aanbieden wat niet kan; een knop die niets doet is erger dan geen knop. */
  const eigenKlassen = klassen.filter((k) => k.eigenKlas === true);
  /* Heb je alleen groepen van anderen, dan hoort het hele blok weg. Heb je nog
     helemaal niets, dan blijft het staan met "Maak eerst een klas aan" — dat is
     geen dode knop maar een zetje. */
  const toonUitnodigen = eigenKlassen.length > 0 || klassen.length === 0;

  const groepen = [...new Set(koppels.map((k) => k.klasId))].map((klasId) => ({
    klasId,
    klasNaam: koppels.find((k) => k.klasId === klasId)?.klasNaam || klasNaamVan(klasId),
    actief: koppels.filter((k) => k.klasId === klasId && k.status === "actief"),
    open: koppels.filter((k) => k.klasId === klasId && k.status === "uitgenodigd"),
  }));

  return (
    /* scroll-mt: de tip op Start linkt naar #collegas, en dan moet de kop niet
       onder de vaste balk verdwijnen. */
    <div
      id="collegas"
      className="scroll-mt-24 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7"
    >
      <h2 className="text-lg font-bold text-ink">Je duo</h2>
      <p className="mt-2 text-sm text-ink/65">
        {/* ⚠️ Twee dingen die hier 8-8 uit moesten. De onderwijsassistent, want
            gedeelde toegang geeft je duo álles wat jij kunt. En de opsomming
            noemde de RAPPORTEN niet, terwijl dat het gevoeligste is wat je
            deelt — juist die moet erin staan vóórdat iemand op uitnodigen
            drukt. Gevonden door de eigenaar. */}
        Draai je samen een groep? Koppel je duo: jullie delen dan de klas, de rapporten,
        een gezamenlijke takenlijst, een gedeelde map en de overdracht. Je duo kan dus
        alles wat jij kunt. Bijzondere persoonsgegevens (medisch, gezinssituatie,
        diagnoses) horen hier nooit in.
      </p>

      {actieFout && (
        <p
          role="alert"
          className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
        >
          {actieFout}
        </p>
      )}

      {/* ── Code met de hand invullen ── */}
      {/* Vangnet: de link kan onderweg sneuvelen (doorgestuurd, afgekapt in een
          bericht, of geopend in een andere browser dan waarin je bent ingelogd).
          Met de code alleen kom je er ook. */}
      {!uitnodigingsCode && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label htmlFor="duo-code" className="text-sm text-ink/65">
            Code gekregen?
          </label>
          <input
            id="duo-code"
            value={handmatigeCode}
            onChange={(e) => setHandmatigeCode(e.target.value.toUpperCase())}
            placeholder="ABC23XY"
            maxLength={7}
            className="w-32 rounded-xl border border-black/10 bg-cream px-3 py-2 text-sm font-semibold tracking-widest text-ink outline-none focus:border-brand"
          />
          <button
            type="button"
            disabled={handmatigeCode.trim().length < 7}
            onClick={() => bekijkCode(handmatigeCode)}
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-black/20 disabled:opacity-40"
          >
            Bekijken
          </button>
        </div>
      )}

      {/* ── Uitnodiging accepteren (via ?duo=code) ──────────────────────────
         Als pop-up en niet als kaartje in de pagina: wie via een uitnodiging
         een account aanmaakt, landt hier en moest anders eerst langs het hele
         instellingenscherm naar beneden scrollen om te vinden waarvoor hij
         kwam. De velden School en Groep staan er wél achter, zodat je ze ziet
         invullen zodra je accepteert. */}
      {uitnodigingsCode && voorbeeld && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="duo-uitnodiging-kop"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-8">
            {/* Gelukt. Bewust een eigen scherm en niet gewoon dichtklappen:
                dit is het moment om te zeggen dát het gelukt is, en om te
                vertellen waar je wisselt als de groep niet vanzelf aanging
                (dat gebeurt alleen als je zelf nog geen klas met leerlingen
                hebt — zie duo_koppel_accepteren). */}
            {geaccepteerd && (
              <>
                <h2 id="duo-uitnodiging-kop" className="font-serif text-2xl font-semibold text-ink">
                  Je hoort nu bij {geaccepteerd}
                </h2>
                <p className="mt-3 leading-7 text-ink/75">
                  Jullie delen vanaf nu de rapporten, bestanden, taken en de overdracht van
                  deze groep.
                </p>
                <p className="mt-3 rounded-2xl bg-brand-soft px-4 py-3 text-sm leading-6 text-ink/75">
                  Werk je zelf al met een eigen klas? Dan blijven je tools daarnaar kijken.
                  Kies {geaccepteerd} bij <strong className="font-semibold">Mijn klas</strong> als
                  je wilt dat ze deze groep gebruiken.
                </p>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={sluitBevestiging}
                    className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
                  >
                    Klaar
                  </button>
                </div>
              </>
            )}

            {!geaccepteerd && voorbeeld === "laden" && (
              <p className="text-ink/70">Uitnodiging laden…</p>
            )}

            {!geaccepteerd && voorbeeld === "fout" && (
              <>
                <h2 id="duo-uitnodiging-kop" className="font-serif text-2xl font-semibold text-ink">
                  Deze uitnodiging werkt niet meer
                </h2>
                <p className="mt-3 leading-7 text-ink/75">
                  Misschien is hij al geaccepteerd of ingetrokken. Vraag je collega om een
                  nieuwe link.
                </p>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={verwijderDuoParam}
                    className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-semibold text-ink/70 transition hover:border-black/20"
                  >
                    Sluiten
                  </button>
                </div>
              </>
            )}

            {/* De uitnodiging is per mail verstuurd, maar niet aan het adres
                waarmee jij bent ingelogd. Bewust NIET vertellen voor wie hij
                dan wél was: is de link bij de verkeerde persoon beland, dan
                hoeft die niet ook nog het adres van een collega te weten. */}
            {!geaccepteerd &&
              typeof voorbeeld === "object" &&
              voorbeeld !== null &&
              !voorbeeld.pastBijMij && (
                <>
                  <h2 id="duo-uitnodiging-kop" className="font-serif text-2xl font-semibold text-ink">
                    Deze uitnodiging is voor een ander adres
                  </h2>
                  <p className="mt-3 leading-7 text-ink/75">
                    Hij is per mail verstuurd naar een ander e-mailadres dan waarmee je nu
                    bent ingelogd. Log in met het adres waarop je de uitnodiging kreeg, of
                    maak daarmee een account aan.
                  </p>
                  <p className="mt-3 leading-7 text-ink/60">
                    Klopt er iets niet? Vraag je collega om een nieuwe uitnodiging.
                  </p>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={verwijderDuoParam}
                      className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-semibold text-ink/70 transition hover:border-black/20"
                    >
                      Sluiten
                    </button>
                  </div>
                </>
              )}

            {!geaccepteerd &&
              typeof voorbeeld === "object" &&
              voorbeeld !== null &&
              voorbeeld.pastBijMij && (
              <>
                <h2 id="duo-uitnodiging-kop" className="font-serif text-2xl font-semibold text-ink">
                  {voorbeeld.uitnodigerVoornaam || "Een collega"} nodigt je uit
                </h2>
                <p className="mt-3 leading-7 text-ink/75">
                  Om <strong className="font-semibold text-ink">{voorbeeld.klasNaam}</strong> samen
                  te draaien. Jullie delen dan de rapporten, bestanden, taken en de overdracht
                  van die groep.
                </p>

                {/* Alleen tonen als er echt iets over te nemen valt: heeft de
                   uitnodiger zelf niets ingevuld, dan is deze belofte leeg. */}
                {(voorbeeld.schoolnaam || voorbeeld.standaardgroep) && (
                  <div className="mt-4 rounded-2xl bg-brand-soft px-4 py-3">
                    <p className="text-sm font-bold text-ink/80">
                      We vullen dan ook vast voor je in:
                    </p>
                    <p className="mt-1 text-sm text-ink/70">
                      {[voorbeeld.schoolnaam, voorbeeld.standaardgroep]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap justify-end gap-2">
                  <button
                    onClick={verwijderDuoParam}
                    className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-semibold text-ink/70 transition hover:border-black/20"
                  >
                    Later
                  </button>
                  <button
                    onClick={accepteer}
                    disabled={accepterenBezig}
                    className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
                  >
                    {accepterenBezig ? "Bezig…" : "Accepteren"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Per groep: wie hoort erbij ── */}
      {!laden && groepen.length > 0 && (
        <div className="mt-5 flex flex-col gap-4 border-t border-black/5 pt-5">
          {groepen.map((g) => (
            <div key={g.klasId}>
              <p className="text-sm font-bold text-ink">{g.klasNaam}</p>

              <ul className="mt-2 divide-y divide-black/5">
                {(leden[g.klasId] ?? []).map((lid) => {
                  // De koppel-rij hoort bij een collega, niet bij de eigenaar:
                  // daarmee kun je zijn rol wijzigen of hem loskoppelen.
                  const koppel = g.actief.find((k) => k.partnerId === lid.userId);
                  return (
                    <li
                      key={lid.userId}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-ink">
                          <strong className="font-semibold">{lid.voornaam || "Collega"}</strong>
                          {lid.isEigenaar && (
                            <span className="ml-2 text-xs text-ink/45">eigenaar van de groep</span>
                          )}
                        </p>
                        <a
                          href={`mailto:${lid.email}`}
                          className="break-all text-xs text-brand hover:underline"
                        >
                          {lid.email}
                        </a>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {/* Geen rolpilletje en geen "Rol wijzigen" meer: er is
                            nog maar één soort toegang. Zie de opmerking bij het
                            uitnodigen. */}
                        {/* Alleen de eigenaar van de groep beheert de leden.
                            Ben je er zelf als collega bij gekomen, dan hoort
                            hier niets: je stapt eruit met de knop onder de
                            lijst. */}
                        {koppel && ikBenEigenaar(g.klasId) && (
                          <>
                            <button
                              onClick={() => loskoppelen(koppel)}
                              className="rounded-lg px-2 py-1 text-xs font-semibold text-ink/50 transition hover:text-red-600"
                            >
                              Loskoppelen
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}

                {g.open.map((k) => (
                  <li
                    key={k.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-ink/70">
                        {k.benIkUitnodiger ? "Uitnodiging verstuurd" : "Uitnodiging ontvangen"}
                        <span className="ml-2 font-mono text-xs tracking-widest text-ink/45">
                          {k.code}
                        </span>
                      </p>
                      <p className="text-xs text-ink/45">Wacht op acceptatie</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {k.benIkUitnodiger && k.code && (
                        <button
                          onClick={() =>
                            kopieer(
                              `${window.location.origin}/dashboard/instellingen?duo=${k.code}`,
                            )
                          }
                          className="rounded-lg px-2 py-1 text-xs font-semibold text-brand transition hover:bg-brand-soft"
                        >
                          {gekopieerd ? "✓ Gekopieerd" : "Link kopiëren"}
                        </button>
                      )}
                      <button
                        onClick={() => loskoppelen(k)}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-ink/50 transition hover:text-red-600"
                      >
                        Intrekken
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Zelf uit de groep stappen. Alleen voor wie er als collega bij
                  is gekomen; de eigenaar verlaat zijn eigen groep niet, die
                  koppelt collega's los in de lijst hierboven. */}
              {!ikBenEigenaar(g.klasId) && g.actief.length > 0 && (
                <button
                  onClick={() => verlaatGroep(g.actief[0], g.klasNaam)}
                  className="mt-1.5 rounded-lg text-xs font-semibold text-ink/50 transition hover:text-red-600"
                >
                  Deze groep verlaten
                </button>
              )}

              {g.actief.length > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-ink/55">
                    Gedeelde map:{" "}
                    <strong className="text-ink">
                      {mappen[g.klasId]?.naam ?? "nog niet gekozen"}
                    </strong>
                  </span>
                  {/* ⚠️ Kiezen wélke map de gedeelde map is, is de groep
                      INRICHTEN — net als iemand uitnodigen of een rol wijzigen.
                      Dat hoort bij de eigenaar. De database dacht daar al zo
                      over (`klassen` bijwerken vraagt klas_toegang_volledig);
                      het scherm bood het toch aan, en het koppelen mislukte dan
                      stil. Gevonden door de eigenaar, 8-8. */}
                  {ikBenEigenaar(g.klasId) && (
                    <button
                      onClick={() =>
                        setMapKiezerVoor(mapKiezerVoor === g.klasId ? null : g.klasId)
                      }
                      className="font-semibold text-brand hover:underline"
                    >
                      {mappen[g.klasId] ? "Wijzigen" : "Map kiezen"}
                    </button>
                  )}
                </div>
              )}

              {mapKiezerVoor === g.klasId && (
                <div className="mt-2 flex flex-wrap gap-1.5 rounded-2xl bg-cream/60 p-3">
                  {topMappen.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={mapBezig}
                      onClick={() => kiesGedeeldeMap(g.klasId, m.id)}
                      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 transition hover:border-black/20 disabled:opacity-50"
                    >
                      📁 {m.naam || "Naamloze map"}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={mapBezig}
                    onClick={() => nieuweGedeeldeMap(g.klasId, g.klasNaam)}
                    className="rounded-lg border border-dashed border-black/20 px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:border-brand hover:text-brand disabled:opacity-50"
                  >
                    + Nieuwe map &quot;{gedeeldeMapNaam(g.klasNaam)}&quot;
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Nieuwe uitnodiging maken ── */}
      {toonUitnodigen && (
      <div className="mt-5 border-t border-black/5 pt-5">
        <p className="text-sm font-bold text-ink">Je duo uitnodigen</p>
        {eigenKlassen.length === 0 ? (
          <p className="mt-2 text-sm text-ink/55">Maak eerst een klas aan.</p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              {eigenKlassen.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setGekozenKlas(k.id)}
                  className={
                    "rounded-xl border px-4 py-2.5 text-sm font-semibold transition " +
                    (gekozenKlas === k.id
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-black/10 text-ink/70 hover:border-black/20")
                  }
                >
                  {k.naam}
                </button>
              ))}
            </div>

            {/* ⚖️ GEEN ROLKEUZE MEER (besluit eigenaar 8-8-2026). Er was een
                tweede rol "meekijken", bedoeld voor een assistent. Die is eruit
                omdat er nu één echte situatie is: twee leerkrachten die samen
                één groep draaien, en die zijn samen verantwoordelijk.
                🔑 Die rol beschermde bovendien niet wat je zou denken: een
                meekijker mocht de rapporten gewoon LEZEN, alleen niet schrijven.
                Rolprofielen per beroep (OA, IB, directie) horen bij de
                schoollicentie, wáár je weet wie iemand is.
                ⚠️ De kolom `rol` en de policies blijven staan en zijn correct;
                daar bouwt de schoollicentie op voort. Uitnodigen maakt altijd
                'volledig'. */}
            <p className="mt-2 text-xs text-ink/50">
              Je duo ziet en bewerkt alles van deze groep, net als jij: de
              rapporten, de klassenlijst, de gedeelde map, de taken en de
              overdracht.
            </p>

            {/* Het adres van je collega. Leeg laten mag: dan krijg je de oude
                link die je zelf doorstuurt. Dat blijft bestaan als vangnet,
                want mail hapert vaker dan je denkt: een streng spamfilter op
                schoolmail, een typefout, of je collega zit naast je en je wilt
                het in tien seconden regelen. */}
            <label htmlFor="duo-email" className="mt-4 block text-sm font-bold text-ink">
              E-mailadres van je duo{" "}
              <span className="font-normal text-ink/50">(optioneel)</span>
            </label>
            <input
              id="duo-email"
              type="email"
              value={gekozenEmail}
              onChange={(e) => setGekozenEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  nodigUit();
                }
              }}
              placeholder="leeg laten = je krijgt een link om zelf te versturen"
              autoComplete="off"
              className="mt-1.5 w-full max-w-md rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <p className="mt-1.5 text-xs text-ink/50">
              Vul je een adres in, dan gaat de uitnodiging vanzelf de deur uit en is hij
              alleen te accepteren door precies dat adres.
            </p>

            <button
              onClick={nodigUit}
              disabled={!gekozenKlas || uitnodigenBezig}
              className="mt-3 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
            >
              {uitnodigenBezig
                ? "Bezig…"
                : gekozenEmail.trim()
                  ? "Verstuur uitnodiging"
                  : `Maak uitnodigingslink${gekozenKlas ? ` voor ${klasNaamVan(gekozenKlas)}` : ""}`}
            </button>

            {uitnodigenFout && (
              <p role="alert" className="mt-3 max-w-md text-sm font-semibold text-red-600">
                {uitnodigenFout}
              </p>
            )}

            {verstuurdNaar && (
              <p role="status" className="mt-3 max-w-md rounded-2xl bg-brand-soft px-4 py-3 text-sm leading-6 text-ink/75">
                De uitnodiging is verstuurd naar <strong className="font-semibold text-ink">{verstuurdNaar}</strong>.
                Zodra je collega hem accepteert, verschijnt die hierboven in de lijst. Komt de
                mail niet aan? Dan kun je de link daar alsnog kopiëren en zelf doorsturen.
              </p>
            )}

            {nieuweLink && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  readOnly
                  value={nieuweLink}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-ink outline-none"
                />
                <button
                  onClick={() => kopieer(nieuweLink)}
                  className="shrink-0 rounded-xl border border-black/10 px-5 py-2.5 text-sm font-bold text-ink/70 transition hover:border-black/20"
                >
                  {gekopieerd ? "✓ Gekopieerd" : "Kopieer link"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      )}
    </div>
  );
}

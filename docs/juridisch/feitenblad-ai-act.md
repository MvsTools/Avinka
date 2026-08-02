# Feitenblad EU AI Act: Avinka

Voor de jurist, als aanvulling op [`feitenblad-avg.md`](feitenblad-avg.md). Dit blad
beschrijft feitelijk welke AI-functies het platform heeft, hoe ze werken, en waar
ze mogelijk onder de "hoog risico"-categorieën van de EU AI Act vallen. Alles
hieronder is nagelopen in de broncode (niet alleen documentatie); waar iets
onzeker is, staat dat expliciet vermeld.

Versie: 2 augustus 2026, bijgewerkt dezelfde dag na een correctie van de
eigenaar. Status: nog niet live, geen echte gebruikers.

**Belangrijke correctie t.o.v. de eerste versie van dit blad:** de zware
hoog-risico-verplichtingen (risicobeheer, technische documentatie, logging,
conformiteitsbeoordeling, EU-registratie) zijn via de "Digital Omnibus"
(Verordening 2026/1744, gepubliceerd 24-7-2026, in werking 27-7-2026) verschoven
van 2 augustus 2026 naar **2 december 2027**. Er is dus meer tijd dan eerst
gedacht — maar twee dingen zijn NIET uitgesteld en gelden al:
- **Artikel 4, AI-geletterdheid** — al van kracht sinds 2 februari 2025.
- **Artikel 50, transparantieplicht** — gebruikers moeten weten dat ze met AI
  werken; deze deadline is ongewijzigd en gaat in per **2 augustus 2026**,
  dus vandaag. Voor Avinka's tools (die zich expliciet als AI-tools
  presenteren) is dit vermoedelijk al in orde, maar verdient een korte
  bevestiging, geen grote actie.

Reden om ondanks het uitstel toch nu door te werken: classificeren welke tools
wel/niet hoog risico zijn kan nu al, kost tijd, en voorkomt dat dit in 2027
onder tijdsdruk moet gebeuren. De inhoudelijke analyse hieronder verandert
niet door het uitstel — alleen de urgentie van de daadwerkelijke bouw-acties.

---

## 1. Waarom dit relevant is

De EU AI Act classificeert AI-systemen in het onderwijs grotendeels als
**hoog risico** (Annex III, punt 3). Hoog risico hoeft geen probleem te zijn —
het betekent vooral dat er zorgvuldiger gebouwd, gedocumenteerd en gecontroleerd
moet worden. Het probleem ontstaat pas als een tool onder een hoog-risico-
categorie valt zónder dat we aan de bijbehorende eisen voldoen.

### 1.1 De vier hoog-risico-categorieën in onderwijs (Annex III, punt 3, letterlijk)

a. AI die bepaalt of iemand wordt toegelaten/aangenomen tot een onderwijs- of
   beroepsopleidingsinstelling, op elk niveau.
b. AI die **leerresultaten evalueert**, ook wanneer die resultaten worden
   gebruikt om **het leerproces te sturen**.
c. AI die wordt gebruikt om **in te schatten welk onderwijsniveau iemand zal
   krijgen of zal kunnen bereiken**.
d. AI die tijdens toetsen ongeoorloofd gedrag van leerlingen monitort/detecteert.

### 1.2 De uitzondering — en de uitzondering op de uitzondering

Artikel 6 lid 3: een systeem uit Annex III telt **niet** als hoog risico als het
geen significant risico vormt, wat het geval kan zijn als het systeem (a) een
smalle, procedurele taak uitvoert, (b) het resultaat van eerder afgerond
menselijk werk verbetert, (c) alleen afwijkingen in eerdere menselijke
beslissingen signaleert zonder die te vervangen/beïnvloeden zonder goede
menselijke toetsing, of (d) een voorbereidende taak uitvoert voor een
beoordeling.

**Maar:** ongeacht deze uitzonderingen geldt: **zodra een systeem "profileert"
(automatisch persoonlijke aspecten van iemand analyseert/voorspelt, zoals
prestaties), is het altíjd hoog risico.** Dit is de kernvraag bij elke tool
hieronder.

### 1.3 Wie draagt de verplichtingen: Avinka, niet Anthropic

Belangrijk punt om vooraf helder te hebben: Avinka bouwt eigen tools (eigen
prompts, eigen doel, eigen merk) bovenop het Claude-model van Anthropic via
API. Onder de AI Act is **Avinka de "aanbieder" (provider) van elk van die
tools als zelfstandig AI-systeem** — het feit dat een ander bedrijf het
onderliggende taalmodel heeft gemaakt, verschuift die rol niet. Anthropic blijft
aanbieder van hún model; Avinka wordt aanbieder van élke eigen toepassing
daarbovenop. Dit betekent: als een Avinka-tool hoog risico is, liggen de
aanbieder-verplichtingen (risicobeheersysteem, data governance, technische
documentatie, logging, transparantie, menselijk toezicht, conformiteits-
beoordeling, EU-registratie) bij Avinka zelf.

**Praktische verzachting:** voor de meeste onderwijscategorieën (punt 2 t/m 8
van Annex III, inclusief onderwijs) geldt conformiteitsbeoordeling via interne
controle (Annex VI) — **geen notified body/externe certificering nodig.** Als
kleine onderneming/startup mag Avinka bovendien de technische documentatie in
een **vereenvoudigde vorm** aanleveren (art. 11).

### 1.4 Wie er verder nog een rol heeft

- **De school** is "deployer" (gebruiksverantwoordelijke) van een hoog-risico-
  tool die ze gebruikt. Deployers die een publieke taak vervullen (scholen
  vallen daar vermoedelijk onder, ook bijzonder onderwijs) moeten vóór het
  eerste gebruik een **Fundamental Rights Impact Assessment (FRIA)** doen
  (art. 27). Dit is in beginsel de verantwoordelijkheid van de school, niet
  van Avinka — maar als Avinka via scholen wil groeien (zie
  [[schoolroute-org-laag]]), ligt het voor de hand hier ondersteuning/sjablonen
  voor te bieden, anders wordt dit een drempel bij elke schoolonderhandeling.
- **Toezichthouder in Nederland:** de Autoriteit Persoonsgegevens (AP) heeft
  een centrale rol bij hoog-risico AI in onderwijs — dezelfde toezichthouder
  als bij de AVG. Toezicht op hoog-risico-verplichtingen start eveneens in
  augustus 2026.
- **AI-geletterdheid (art. 4)** geldt al sinds 2 februari 2025: personeel dat
  met AI-systemen werkt moet een passend kennisniveau hebben. Dit is een lichte
  verplichting maar wel al lang actief — los puntje om expliciet af te vinken,
  ook voor Avinka zelf als team.
- **Transparantieplicht (art. 50)** geldt per 2 augustus 2026 — vandaag —
  ongewijzigd door het uitstel hieronder. Gebruikers moeten weten dat ze met
  een AI-systeem te maken hebben. Voor Avinka's tools (expliciet aangeboden
  als "AI-tools") is dit vermoedelijk al voldaan, maar dit is niet met
  zekerheid nagelopen in de UI-teksten — korte check waard.

---

## 2. Inventaris: wat elke tool doet (nagelopen in de broncode)

Alle AI-aanroepen lopen via `src/app/api/claude/route.ts` (voegt alleen de
sleutel toe en logt tokens/model, inspecteert de inhoud verder niet). Elke tool
is een zelfstandig bestand in `public/tools/`.

### 2.1 Rapportteksten (`public/tools/rapporten.html`)
Genereert een conceptrapporttekst per kind uit een ingevulde vragenlijst
(werkhouding, vakniveaus, zelfvertrouwen, vrije tekst). Naam wordt vóór
verzending vervangen door een code (`LL-01`). AI schrijft **tekst**, neemt geen
beslissing. Tekst verschijnt on-screen; leerkracht leest/bewerkt vóór gebruik.
Wordt opgeslagen in tabel `rapporten` (één actuele versie per kind, geen
historie), met een (nog te bevestigen) automatische verwijdering na 90 dagen.

### 2.2 Oudercontact (`public/tools/oudercontact.html`)
Zes submodules. De relevante twee:
- **Persoonlijk bericht aan ouders** — vrije tekst over één kind, AI schrijft
  concepttekst, leerkracht verstuurt zelf.
- **Oudergesprek-verslag voor het leerlingvolgsysteem** — vrije aantekeningen
  van de leerkracht worden een verslag + lijst "afspraken". **Bevinding:** er
  is een detector voor gevoelige trefwoorden (adhd, diagnose, jeugdzorg,
  mishandeling, scheiding, e.d.) die alleen een **visuele waarschuwing** toont
  — hij blokkeert of filtert niets vóór verzending naar de AI. Namen worden
  gemaskeerd, gevoelige inhoud die de leerkracht zelf intypt niet.
- Nieuwsbrief/informatiebrief/uitnodiging: generiek, groepsniveau, geen
  kind-specifieke data.

Geen serveropslag van gegenereerde teksten.

### 2.3 Lesontwerp, Werkbladen, Draaiboek
Alle drie generiek: vak/groep/leerdoel/onderwerp/evenement, geen naam- of
scorekoppeling aan een specifiek kind (Draaiboek heeft één vrij tekstveld dat
incidenteel een kind kan noemen, bijv. een allergie, maar dit is geen
structureel per-kind-veld). AI levert een document dat de leerkracht zelf
toepast. Geen opslag van kinddata.

### 2.4 Toetsanalyse (`public/tools/toetsanalyse.html`) — grootste en gevoeligste tool

**Scoreberekening:** volledig deterministisch (JavaScript, geen AI) uit een
geüpload IEP-Excel- of Cito-PDF-bestand.

**VO-uitstroomindicatie — dit is het aandachtspunt:**
- Optioneel vinkje (standaard uit), toont per leerling een indicatie van het
  passende niveau voortgezet onderwijs (bijv. "vmbo-kb/gl-tl").
- **De indeling zelf is een vaste rekenformule**, geen AI/ML: een gewogen score
  (rekenen 45%, lezen 30%, taalverzorging 25%) wordt via vaste drempelwaarden
  omgezet in een niveauband.
- **AI wordt alleen gebruikt om begeleidende tekst te schrijven** rond de al
  berekende band (een "duiding" en "aandachtspunt"), met een expliciete
  instructie aan het model om de aangeleverde cijfers/band niet te wijzigen.
- **Mens-in-de-loop is hier zwakker dan bij de andere tools:** het resultaat
  gaat rechtstreeks in een downloadbaar Word-document; er is geen scherm waarop
  de leerkracht de tekst eerst ziet/bevestigt vóór het document wordt gemaakt.
  Wel staat er een disclaimer in het document zelf ("indicatie, geen advies").
- Niets wordt naar de Avinka-server geschreven; het blijft bij het gedownloade
  document.

**Waarom dit apart aandacht verdient:** de categorisering zelf is code, geen
taalmodel — dat is een argument vóór een lagere classificatie. Maar functioneel
is het resultaat precies wat Annex III punt 3(c) beschrijft ("inschatten welk
onderwijsniveau iemand zal kunnen bereiken"), gekoppeld aan een specifiek kind,
in een document dat het klaslokaal kan verlaten. Dit is bovendien "profileren"
in de zin van de AVG (automatisch persoonlijke aspecten — hier: te verwachten
prestatieniveau — voorspellen), wat volgens de AI Act **altijd** hoog risico
maakt, ongeacht de uitzonderingen van artikel 6 lid 3.

**Groeps-/domeinanalyse en instructiegroepen — bij nader inzien even zwaar als
de uitstroomindicatie, mogelijk zwaarder.** (Deze inschatting is op 2-8-2026
naar boven bijgesteld nadat de eigenaar hier terecht op doorvroeg; de eerste
versie van dit blad noemde dit een "randgeval, waarschijnlijk lager" — dat was
te mild.)

Wat de tool feitelijk doet, nagelopen in `public/tools/toetsanalyse.html`
(o.a. r.1838, 3352-3408, 3492, 3671, 3875-3876):
- Bepaalt per domein welke leerlingen onder de drempelwaarde vallen.
- **Clustert die leerlingen tot concrete "Instructiegroepen"** met namen erbij
  (bijv. "Instructiegroep — Rekenen: contextsommen lezen").
- Bepaalt welk domein "de logische keuze voor ÉÉN instructiegroep" is, en welke
  leerlingen juist NIET in een groepje horen (al op niveau / breed zwak /
  klassikaal probleem).
- De AI schrijft de begeleidende tekst; de clustering zelf is code (er staat
  letterlijk een codecommentaar: "De AI verwoordt alleen; alle [analyse is
  code]").

**Waarom dit vermoedelijk onder Annex III punt 3(b) valt:** die categorie luidt
"AI die leerresultaten evalueert, ook wanneer die resultaten worden gebruikt om
het leerproces te sturen". Toetsresultaten evalueren én daaruit instructie-
groepen vormen is geen randgeval van die omschrijving maar vrijwel een
letterlijke invulling ervan. Het argument "het systeem verzint niets, het
rekent op basis van data" is hier geen verzachting: de verordening reguleert
juist geautomatiseerde beoordeling van personen met gevolgen voor die personen.

**Wat wél in ons voordeel pleit:**
- De clustering is deterministische code, geen taalmodel — de AI verwoordt
  alleen. Reëel argument, maar hetzelfde dunne onderscheid als bij de
  uitstroomindicatie.
- Sterker menselijk toezicht dan bij de uitstroomindicatie: de leerkracht ziet
  de onderliggende cijfers en beslist zelf wat er met een groepje gebeurt.
- Artikel 6 lid 3(d): "voorbereidende taak voor een beoordeling" — dit is
  aantoonbaar voorbereidend werk voor het professionele oordeel van de
  leerkracht. **Maar** die uitzondering vervalt bij profilering, en het
  analyseren van de prestaties van een individueel kind is profilering.

**Belangrijkste gevolg voor de besluitvorming:** de VO-uitstroomindicatie
verwijderen lost het AI Act-vraagstuk NIET op. Als de kernanalyse zelf ook in
het gereguleerde gebied valt, blijft het probleem staan na het schrappen van
die functie. De vraag is daarmee niet "welke deelfunctie halen we weg" maar
"richten we Toetsanalyse volledig conform in, of bieden we hem niet aan".
Gunstige omstandigheid: de deadline is 2 december 2027, en de PCBO-pilot rond
Toetsanalyse (gepland december 2026) valt daar ruim vóór — er is dus eerst een
pilotronde om te leren hoeveel waarde de tool in de praktijk levert, en daarna
nog bijna een jaar om de conformiteit in te richten.

### 2.5 Weekplanning — twee losse implementaties, verschillende AI-status

Belangrijk om niet te verwarren:
- **Rooster-editor in het dashboard** (`RoosterBewerken.tsx` /
  `src/lib/planning/genereer.ts`): **geen AI.** Volledig deterministisch
  verdeelalgoritme.
- **Losstaande tool** (`public/tools/weekplanning.html`): **gebruikt wél AI**
  om per lesblok een dag/tijd te kiezen. Bevat geen leerlingdata (alleen
  vaknamen, bloklengtes, schooltijden) — geen onderwijsrisico-categorie van
  toepassing, wel goed om deze twee niet als één feature te behandelen.

### 2.6 Plattegrond
Geen AI. Alleen relevant voor de AVG (voornamen), niet voor de AI Act.

### 2.7 Platformbrede kanttekening

Alle maskering (naam → code) gebeurt **client-side**; de server filtert of
controleert de inhoud niet nogmaals. Voor tools zonder gevoelige-inhoud-filter
(zoals het oudergesprek-verslag) betekent dit dat wat de leerkracht intypt,
ongefilterd naar de AI gaat — namen zijn dan wel gemaskeerd, de gevoelige
inhoud zelf niet.

---

## 3. Samenvattende risico-inschatting

| Tool | Annex III-categorie van toepassing? | Voorlopige inschatting | Prioriteit voor jurist |
|---|---|---|---|
| VO-uitstroomindicatie (Toetsanalyse) | 3(c), + profileringsregel | Waarschijnlijk hoog risico | **Hoog** |
| Toetsanalyse — domeinanalyse + instructiegroepen | 3(b) "leerresultaten evalueren... leerproces sturen", + profileringsregel | Waarschijnlijk hoog risico; **conclusie 2-8-2026 naar boven bijgesteld** | **Hoog — de tool als geheel, niet één deelfunctie** |
| Rapportteksten | Geen duidelijke fit (schrijft tekst, mens leest/bewerkt) | Waarschijnlijk geen hoog risico | Laag, wel bevestigen |
| Oudercontact — oudergesprek/LVS | Geen AI Act-fit, wel AVG-aandachtspunt (gevoelige inhoud ongefilterd) | Geen hoog-risico-AI-vraag, wel privacyvraag | Laag (AI Act) / Middel (AVG) |
| Lesontwerp, Werkbladen, Draaiboek, Oudercontact-overig | Geen fit — generiek, geen kindbeslissing | Geen hoog risico | Laag |
| Weekplanning (beide varianten) | Geen fit — geen leerlingdata/-beslissing | Geen hoog risico | Laag |
| Plattegrond | Geen AI | N.v.t. | — |

---

## 4. Concrete vragen voor de jurist, in volgorde

1. **Valt de Toetsanalyse-tool als geheel onder hoog risico** (Annex III punt
   3(b) voor de domeinanalyse/instructiegroepen, punt 3(c) voor de
   uitstroomindicatie)? Specifiek: doet het ertoe dat de eigenlijke analyse en
   clustering deterministische code is en de AI alleen de begeleidende tekst
   schrijft — of kijkt een toezichthouder naar de functie van het geheel? En
   sluit de profileringsregel de uitzondering van artikel 6 lid 3(d)
   ("voorbereidende taak") hier definitief uit?
2. Zo ja: welke stappen zijn minimaal nodig om de tool verantwoord te blijven
   aanbieden (vermoedelijk risicobeheersysteem, technische documentatie in
   vereenvoudigde startup-vorm, interne conformiteitsbeoordeling volgens
   Annex VI, EU-registratie)? En is een expliciete "ik heb dit
   gecontroleerd"-bevestiging vóór download — vergelijkbaar met hoe
   Rapportteksten al werkt — voldoende om het mens-in-de-loop-gebrek bij de
   individuele leerlingrapporten te verhelpen?
3. Bevestigen dat Avinka voor elk van haar eigen tools **"aanbieder"** is (niet
   slechts gebruiker van Anthropic's model), en wat dat concreet betekent voor
   de te volgen procedure (interne controle, Annex VI, geen notified body
   nodig; vereenvoudigde documentatie als startup).
4. **FRIA:** ligt die verplichting bij de school (als deployer met een
   publieke taak), en heeft het zin dat Avinka scholen hierbij een sjabloon of
   ondersteuning biedt als onderdeel van het schoolcontract-traject?
5. Zijproduct, niet AI Act maar AVG: de **ongefilterde gevoelige inhoud** in
   het oudergesprek-verslag (waarschuwing wel, blokkade niet) — verdient dat
   een aanpassing (bijv. alsnog blokkeren/expliciet laten bevestigen vóór
   verzending), vergelijkbaar met eerdere AVG-bevindingen?

---

## 5. Open punten / nog te verifiëren (niet met zekerheid vastgesteld)

- De automatische 90-dagen-opschoning van `rapporten` staat in het AVG-
  feitenblad genoemd, maar is niet als code teruggevonden bij dit onderzoek —
  apart bevestigen bij de ontwikkelaar.
- Niet geverifieerd of de VO-uitstroomindicatie ergens wél zichtbaar is vóór
  download (een UI-screenshot-check ontbreekt); uit de code volgt dat het
  rechtstreeks naar het Word-document gaat.
- Niet te achterhalen vanuit de code: of leerkrachten in de praktijk dezelfde
  leerling over meerdere toetsmomenten heen analyseren op een manier die
  buiten Avinka (in hun eigen archief) alsnog een langlopend profiel vormt.

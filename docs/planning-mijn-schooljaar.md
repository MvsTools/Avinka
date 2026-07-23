# Mijn schooljaar — de planning als rode draad door Avinka

_Plan, versie 2 (23-7-2026, werk/b). De zes open beslissingen zijn beantwoord en
verwerkt (§9). Wacht op de laatste goedkeuring van de eigenaar._

## 1. Wat het is

Geen tool. Een **onderdeel van het platform**, zoals de takenlijst — maar dan het
grootste onderdeel dat we hebben. De rode draad waar alles aan hangt.

In de woorden van de eigenaar:

> Mijn schooljaar, daar valt de weekplanning onder. Het wordt net als de
> takenlijst een onderdeel van het platform, geen losse tool. De rode draad. De
> echte assistent voor de leerkracht die helpt plannen en bekijken. Je kunt je
> Parro of andere agenda eraan koppelen, hij maakt een klassenplanning tijdens
> en na schooltijd. De agenda geeft aan wanneer je welke tool zou moeten
> gebruiken, heeft een koppeling met eigenlijk alles. In Start komt je lesdag te
> staan, heel mooi weergegeven en overzichtelijk. Links in de balk komt
> "Planning" te staan en daar ga je naar het complete achterliggende bestand. De
> jaarplanning, de periodeplanning, de hulp. Alles. Het moet echt groots zijn.

Eén zin als toets voor elke beslissing hieronder: **de leerkracht hoeft nooit
zelf te bedenken wat er aan zit te komen — Avinka weet het en zegt het op tijd.**

## 2. De vorm

### 2.1 Start (`/dashboard`) — je lesdag

Bovenaan Start komt **de dag van vandaag**, mooi en rustig weergegeven: het
lesrooster van vandaag als tijdlijn, met de nu-lijn, wat er ná schooltijd staat,
en wat er vanuit de schoolagenda vandaag speelt (studiedag, gesprekken,
rapporten mee). Klein en overzichtelijk; doorklikken kan altijd.

Randgevallen die het meteen goed moeten doen (anders voelt het niet slim):
vakantie, weekend, studiedag, avond (dan toont hij morgen), en de lege staat als
er nog niets gekoppeld/gepland is (dan een uitnodiging, geen leeg vlak).

### 2.2 Navigatie — "Mijn schooljaar"

Nieuw item in `DashboardNav`, in de bovenste groep (dagelijks werk), direct
onder Start of onder Takenlijst. Route: `/dashboard/schooljaar`.

### 2.3 Het achterliggende scherm — vier lagen op één plek

`/dashboard/schooljaar` is één scherm met een schakelaar tussen vier zoomniveaus.
Van grof naar fijn, altijd dezelfde gegevens:

| Laag | Wat je ziet | Waar het vandaan komt |
|---|---|---|
| **Jaar** | Je schooljaar op een rij: vakanties, studiedagen, rapportmomenten, gesprekken, activiteiten. Lijst én maandweergave. | Gekoppelde schoolagenda + vakantiedata Rijksoverheid |
| **Periode** | De blokken tussen de vakanties: wat komt eraan, wat moet af, welke tool hoort erbij, hoeveel weken heb je nog. | Jaarlaag + tool-koppelingen + takenlijst |
| **Week** | Je **basisrooster**: het lesrooster tijdens én na schooltijd, verslepen, AI-generator. Plus wat er déze week van afwijkt. | Basisrooster + jaarlaag |
| **Dag** | Eén dag uitvergroot; hetzelfde als op Start maar met ruimte. | Weeklaag |

En daarnaast, als vijfde tabblad of als instelling binnen Planning:

| **Koppelingen** | Je agenda('s) koppelen, verversen, loskoppelen; zien wat er herkend is. | Bestaand koppelscherm uit de schets |

## 3. De motor: van agenda naar dag

1. **Agenda('s) koppelen.** Leerkracht plakt de agendalink van school (Parro,
   Social Schools, Google, Outlook) — **meerdere mag** (school + eigen). We lezen
   ze uit, herkennen per afspraak het soort (studiedag / rapport / gesprek /
   vergadering / activiteit), maskeren namen, slaan de link versleuteld op en
   **halen dubbelingen er direct uit** (zie §3.1). Grotendeels al gebouwd (§6).
2. **Jaar vullen.** Vakanties uit de open data van de Rijksoverheid als vangnet;
   staat het in je eigen schoolagenda, dan wint die.
3. **Periodes afleiden.** Het jaar knipt zichzelf in blokken tussen de
   vakanties. Per blok: wat er aan komt en wat dat van je vraagt.
4. **Basisrooster maken.** Aan het begin van het schooljaar maak je één
   basisrooster (zie §3.2). Dat is de stille kracht onder alles: zonder
   basisrooster kunnen we de dag niet tonen.
5. **Dag tonen.** Start pakt de dag van vandaag = basisrooster van die dag,
   min wat de jaarlaag wegneemt (studiedag, vakantie), plus de agenda-items van
   die dag, plus wat je zelf voor die week hebt aangepast.

### 3.1 Meerdere agenda's en dubbelingen

Zodra iemand zowel de schoolagenda als zijn eigen agenda koppelt, staat dezelfde
studiedag er twee keer in. Dat moet je nooit zien.

- Binnen één bron: al afgevangen (unieke index op bron + uid + datum).
- **Tussen bronnen:** twee afspraken zijn dezelfde als ze op dezelfde datum
  vallen, dezelfde begintijd hebben (of allebei heel-dag zijn) en hun titel na
  normaliseren op elkaar lijkt (kleine letters, leestekens en ruis als "groep 6"
  of "kopie" eruit).
- **Nooit weggooien, wél samenvoegen.** De dubbel wordt verborgen en onthouden,
  niet verwijderd — koppelt hij een bron los, dan blijft de afspraak bestaan via
  de andere bron. (Dit is dezelfde les als in commit `32aa7b3`: nooit afspraken
  weggooien.)
- Eén bron is de **hoofdagenda** (de eerste die je koppelt, later te wisselen);
  bij twijfel wint die qua titel en tijd.
- De leerkracht kan een samenvoeging altijd terugdraaien ("dit zijn twee
  verschillende afspraken").

### 3.2 Het basisrooster

Geen tool meer, maar het hart van de weeklaag.

- **Aan het begin van het jaar maak je hem één keer**, met de bestaande
  drie-stappen-wizard (dagen en tijden, pauzes en gym, vakken en lengtes) en de
  AI-generator die de blokken slim over de week verdeelt.
- **Altijd aan te passen**: verslepen, korter/langer, vak toevoegen, of de hele
  wizard opnieuw.
- **Basis versus week.** Het basisrooster geldt elke week. Wijkt één week af
  (uitstapje, studiedag, toetsweek), dan pas je díé week aan zonder dat je basis
  verandert. Duidelijk zichtbaar: "deze week wijkt af van je basisrooster" met
  een knop om terug te zetten.
- **De jaarlaag knipt er automatisch in**: op een studiedag en in een vakantie
  vervalt het rooster vanzelf, een gespreksavond komt in je na-schooltijd te
  staan.
- **Meer dan één basisrooster** kan later nodig zijn (duobaan, wisselend
  A/B-rooster). Nu niet bouwen, wel het model erop voorbereiden: een basisrooster
  hangt aan een schooljaar en kan er in principe meer dan één zijn.

### 3.4 Scholen wijken af van de landelijke vakanties

Scholen mogen zelf van de adviesdata van de Rijksoverheid afwijken en doen dat
ook: een tweede meiweek, een eigen studieweek, een herfstvakantie die een week
verschoven is. **De landelijke lijst is dus een vangnet, nooit de waarheid.**
Zodra de gekoppelde schoolagenda een vakantie noemt, is die leidend.

Drie gevallen, en het verschil ertussen is waar het misgaat als je er niet over
nadenkt:

| Geval | Wat we doen | Waarom |
|---|---|---|
| De agenda **overlapt** de landelijke vakantie (school schuift hem op) | De agenda wint helemaal | Landelijk 17-25 oktober, jouw school 10-18 oktober: samenvoegen zou 19-25 oktober onterecht als vakantie tonen terwijl je gewoon voor de klas staat |
| De agenda **sluit erop aan** (tweede meiweek) | Samen één langere vakantie | Vervangen zou de échte meivakantie wegpoetsen |
| De agenda staat er **los van** | Twee verschillende vakanties, allebei blijven staan | Een eigen studieweek is geen herfstvakantie |

Twee vangnetten daarbovenop: een vermelding van maar een dag of twee zien we als
een flard (school heeft alleen de eerste dag genoteerd) en dan houden we allebei
aan, en losse dagen die aan elkaar grenzen plakken we weer aan elkaar tot één
vakantie (scholen noteren de kerstvakantie soms per dag).

De eerste en laatste schooldag schuiven mee: begint jouw zomervakantie een week
eerder, dan is jouw laatste schooldag ook een week eerder, en de periodes
herberekenen zich daarop.

### 3.3 Schooljaren bewaren

We bewaren **dit schooljaar en het vorige**. Vorig jaar mag je bekijken (jaar,
periodes, basisrooster) maar niet bewerken; er staat rustig bij dat het een
afgesloten jaar is. Alles ouder dan dat ruimen we automatisch op — goed voor de
privacy en het houdt het scherm leeg. Vooruit plannen in een volgend schooljaar
doen we bewust niet.

## 4. De koppelingen — "de agenda zegt wanneer je welke tool nodig hebt"

Dit is het onderscheidende deel. Elk herkend agenda-item krijgt een **aanleiding**
en die aanleiding wijst naar een tool, met de datum en de context al ingevuld:

| Wat er in de agenda staat | Wat Avinka aanbiedt | Wanneer |
|---|---|---|
| Rapporten mee naar huis | Rapporten schrijven | vanaf ± 3 weken ervoor |
| Oudergesprekken / startgesprekken | Oudercontact (uitnodiging, gespreksnotitie) | vanaf ± 2 weken ervoor |
| Toetsweken | Toetsanalyse | tijdens en direct erna |
| Schoolreis, sportdag, viering | Draaiboek | vanaf ± 6 weken ervoor |
| Studiedag, vergadering | Takenlijst-blok "eigen tijd" | de week zelf |
| Nieuwe lesweek | Lesontwerp / Werkbladen | doorlopend |

Twee vormen, allebei nodig:

- **Vooruitkijken** (in Planning): "Over 3 weken gaan de rapporten mee. Beginnen?"
- **Op de dag** (op Start): "Vandaag gespreksavond, 18:00-21:00. Je notities staan klaar."

De verbinding moet **beide kanten op** werken: maak je in Draaiboek een
schoolreis-draaiboek, dan weet de planning dat die schoolreis van jou is.

## 5. Takenlijst-koppeling

De takenlijst blijft wat hij is (jouw eigen lijstje), maar krijgt voeding uit de
planning: uit een agenda-item ontstaan **voorgestelde** taken op tijd ("rapporten
af over 2 weken", "draaiboek schoolreis beginnen"). Voorgesteld, niet opgelegd —
je zet ze zelf op je lijst, en je kunt het voorstellen uitzetten.

Andersom: een taak met een datum verschijnt in de planning op die dag.

## 6. Wat er al staat (werk/b, schets)

- `src/app/jaar-schets/page.tsx` (1132 regels) — twee schermen: agenda koppelen
  en je jaar op een rij (lijst + maandweergave + dagpaneel). Losse schets, nergens
  geregistreerd. **Wordt de basis van de Jaar-laag en het Koppel-scherm.**
- `src/lib/ics.ts` + `src/lib/agenda-herken.ts` — agendalinks echt uitlezen en
  het soort afspraak herkennen.
- `src/lib/agenda-ophalen.ts`, `agenda-opslaan.ts`, `src/lib/geheim.ts` —
  ophalen, opslaan, versleutelen, namen maskeren.
- `src/app/api/agenda/{bronnen,controleer,ververs}/route.ts` — koppelen,
  controleren, verversen, loskoppelen.
- `database/schema.sql` blok 16 — `agenda_bronnen` + `agenda_items`, RLS per
  gebruiker, unieke index per bron+uid+datum.
- `public/tools/weekplanning.html` — de volledige weekplanning (fase 1 + 2 af:
  wizard, AI-generator, rooster, verslepen, na-schooltijd als eigen rooster,
  autoscroll). Draait nu nog los op localStorage. Zie het geheugenbestand
  `weekplanning-project.md` voor alle details.

## 7. Fases

Elke fase is los af te leveren en te keuren. Niets gaat naar `main` zonder dat de
eigenaar het zelf gezien heeft.

### Fase 0 — fundament (geen zichtbaar scherm) — **AF (23-7-2026)**
- Eén gedeelde **planning-laag** in `src/lib/planning/`: schooljaar, periodes,
  agenda-items, roosterblokken, taken — met één manier om "wat speelt er op dag
  X / in week X / in periode X" te vragen.
- Vakantiedata Rijksoverheid als vangnet, per regio.
- Beslist hier: wat staat server-side en wat blijft op het apparaat (§8).

Gebouwd:

| Bestand | Wat het doet |
|---|---|
| `datum.ts` | Datumrekenen op "JJJJ-MM-DD" (nooit Date-objecten rondsturen), weeknummers, schoolweken, tekst in gewone taal |
| `vakanties.ts` | De landelijke vakanties per schooljaar en regio (2025-2026 + 2026-2027, opgehaald bij de Rijksoverheid op 23-7-2026). **Jaarlijks bijwerken.** Vangnet: de gekoppelde agenda wint altijd |
| `schooljaar.ts` | Van een datum naar het juiste schooljaar, eerste/laatste schooldag, en het jaar geknipt in periodes tussen de vakanties |
| `eigen-vakanties.ts` | **De vakanties van jouw school gaan boven de landelijke lijst** (zie §3.4) |
| `types.ts` | De begrippen: Schooljaar, Periode, PlanItem, Roosterblok, Taak, Dagbeeld, Weekbeeld |
| `dagbeeld.ts` | "Wat speelt er op dag X" en dezelfde vraag voor een week; volgende schooldag; wat komt eraan |
| `ophalen.ts` | De enige plek die met de database praat: agenda-items, taken, vakantieregio |
| `index.ts` | Eén ingang: `import { haalPlanning, dagbeeld } from "@/lib/planning"` |

Nagerekend met een proefrun (alle drie de regio's, periodes, studiedag,
weekend, vakantie, meerdaagse afspraak, dubbele afspraak, week met een
studiedag erin). De berekende schooljaargrenzen voor regio midden komen exact
uit op de datums die in de schets stonden: 31-8-2026 tot 16-7-2027.

### Fase 1 — Mijn schooljaar in de balk, met de Jaar-laag — **AF (23-7-2026)**
- Nieuw nav-item + route `/dashboard/schooljaar`.
- Schets omgezet naar echt scherm: jaar (lijst + maand) op echte gegevens uit
  `agenda_items`, plus het koppelscherm als eigen tabblad.
- **Meerdere agenda's** + de dubbelingen-samenvoeging uit §3.1.
- Lege staat: geen agenda gekoppeld → uitnodigend beginscherm.
- `src/app/jaar-schets/` verdwijnt.

Gebouwd: `src/app/dashboard/schooljaar/page.tsx` (haalt alles op de server op),
`SchooljaarView.tsx` (schil + jaar als lijst), `SchooljaarMaand.tsx` (kalender +
dagpaneel), `AgendaKoppelen.tsx`, `schooljaar-stijl.ts` (één plek voor hoe een
soort afspraak eruitziet), `src/lib/planning/dubbelingen.ts`. Menu-item in
`DashboardNav.tsx`, direct onder Start.

### Fase 2 — het basisrooster komt naar binnen
- Van losse `public/tools/weekplanning.html` naar de Week-laag binnen Mijn
  schooljaar; niet langer een tool.
- Opslag van localStorage naar de database (per gebruiker, per schooljaar), zodat
  je rooster op school én thuis hetzelfde is.
- Onderscheid **basis versus deze week** (§3.2), met terugzetten.
- De jaarlaag wordt randvoorwaarde: studiedag/vakantie/gespreksavond zijn bekend.
- Weekplanning verdwijnt als tool-tegel; bestaande roosters uit localStorage
  worden bij de eerste keer openen overgenomen, zodat niemand werk kwijtraakt.

### Fase 3 — Start: je lesdag
- Dagblok bovenaan Start, met alle randgevallen (vakantie, weekend, studiedag,
  avond, leeg).
- De Dag-laag binnen Mijn schooljaar als grote versie.

### Fase 4 — de koppelingen
- Aanleiding-motor: agenda-item → tool, met vensters ("3 weken ervoor").
- Vooruitkijk-blok in Planning + dag-signaal op Start.
- Tools openen mét context (datum, aanleiding); terugkoppeling van tool naar
  planning.

### Fase 5 — de periodeplanning en de hulp
- Periodelaag: blokken tussen vakanties, wat komt eraan, hoeveel weken nog.
- "De hulp": Avinka die meedenkt over de periode (wat kun je nu al doen, wat
  wordt druk, waar zit je piek). Dit is het stuk dat het écht een assistent maakt
  en verdient een eigen ontwerpronde.

## 8. AVG-grenzen (hard)

Deze regels gelden voor het hele onderdeel en zijn niet onderhandelbaar:

- **Voornaam + soort afspraak + tijdstip** = gewoon persoonsgegeven → mag
  server-side. ("Oudergesprek Umut, do 14:30".)
- **Vrij notitieveld over een kind** = bijzonder persoonsgegeven (er kan
  gezondheid in staan, ook indirect) → **nooit server-side.** Op het apparaat of
  download-eerst.
- **Geen kindnamen naar de AI.**
- De agendalink is een sleutel tot de hele schoolagenda → **versleuteld
  opslaan**, en bij het binnenhalen worden namen gemaskeerd (bestaand gedrag).
- Korte bewaartermijn / opruimen van oude schooljaren.
- Methodes: naam noemen mag, hun jaarplanning-structuur of lesinhoud als dataset
  inbouwen mag niet.

## 9. Beslissingen van de eigenaar (23-7-2026)

1. **De weekplanning is geen tool meer.** Hij gaat op in Mijn schooljaar als het
   **basisrooster**: aan het begin van het jaar één keer maken, daarna altijd aan
   te passen. Hij is de basis waarop de dagweergave draait. (§3.2)
2. **Abonnement:** advies en besluit = **Mijn schooljaar zit in élk pakket, ook
   Start.** Het is de rode draad; er iets uit halen breekt het platform in plaats
   van het duurder te maken. Start knelt vanzelf al: met één tool lopen zeven van
   de acht signalen ("over 3 weken gaan de rapporten mee") dood op een slotje —
   de eerlijkste upsell die er is, zonder iets uit te kleden. Sluit aan op de
   bestaande lijn "tier-verschil zit in aantal tools, niet in het uitkleden van
   een tool". Het AI-deel (basisrooster laten genereren) loopt al via credits en
   de drie modeltiers.
3. **Naam in de balk: "Mijn schooljaar."** Route `/dashboard/schooljaar`.
4. **Volgorde:** eerst het basisrooster (fase 2), daarna de lesdag op Start
   (fase 3). Reden: de dag ís het basisrooster van die week plus de agenda; eerst
   de lesdag bouwen betekent hem bouwen op demo-gegevens en daarna overdoen.
5. **Meerdere agenda's: nu**, inclusief het meteen herkennen en samenvoegen van
   dubbelingen. (§3.1)
6. **Bewaren: dit schooljaar en het vorige.** Vorig jaar alleen te bekijken, niet
   te bewerken. Vooruit plannen in een volgend schooljaar: nee. (§3.3)

## 10. Twee kleine besluiten erbij (23-7-2026)

- **Plek in de balk: direct onder Start**, boven Takenlijst. Reden van de
  eigenaar: het is de rode draad van het platform.
- **Niet in de statistieken.** Mijn schooljaar bespaart geen aanwijsbare minuten;
  het is een hulpmiddel dat je hoofd leegmaakt, "een soort digitale
  assistent-agenda" (eigenaar). De statistiekenpagina draait op de belofte "2 uur
  per week terug" en die getallen zijn nu eerlijk te verantwoorden — er één
  verzonnen minutenteller bij zetten maakt de hele pagina ongeloofwaardig.
  **Dus: `avinkaTel()` niet aanroepen vanuit Mijn schooljaar.** Idee voor later,
  als we iets willen tonen: een rustige regel in de trant van "je bent dit jaar
  14 keer op tijd gewaarschuwd" — vertelt wat het écht doet, zonder tijd te
  claimen.

## 11. Nog te beslissen onderweg

- Hoe ver gaat "de hulp" in fase 5 — eigen ontwerpronde.

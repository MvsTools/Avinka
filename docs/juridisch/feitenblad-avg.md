# Feitenblad AVG: Avinka

Voor de privacyjurist. Dit blad beschrijft feitelijk wat het platform doet met gegevens, zodat de beoordeling en de verwerkersovereenkomst niet met uitvraagwerk hoeven te beginnen. Alles hieronder is nagelopen in de broncode; onderaan staat een eerlijke lijst met punten waar de praktijk en de bestaande teksten nog niet kloppen.

Versie: 8 augustus 2026. Status: nog niet live, geen echte gebruikers.

Bijgewerkt op 24 juli 2026: paragraaf 4 over het koppelen van de schoolagenda is
nieuw, met bijbehorende vragen en openstaande punten. Dat onderdeel is na de
eerste versie van dit blad gebouwd en is bewust apart beschreven, omdat het het
enige onderdeel is waarbij gegevens de applicatie binnenkomen zonder dat de
leerkracht ze zelf intypt.

---

## 1. Wat het platform is

Een webapplicatie met AI-tools voor leerkrachten in het Nederlandse basisonderwijs. De leerkracht maakt er onder meer rapportteksten, oudercontact, lesontwerpen, werkbladen en toetsanalyses mee. Verkoop nu direct aan individuele leerkrachten met een abonnement; op termijn ook aan scholen en besturen.

Techniek: Next.js-applicatie, database en inlog via Supabase (hosted), betalingen via Mollie, AI via de Anthropic-API (Claude).

## 2. Welke gegevens worden opgeslagen

**Over de leerkracht (wij zijn hier verwerkingsverantwoordelijke):**
e-mailadres, versleuteld wachtwoord en voornaam (Supabase-auth); schoolnaam plus BRIN en vestigingscode uit het open DUO-register; voorkeuren voor toon en taalgebruik; abonnementsgegevens en Mollie-klantnummer; gebruiksstatistieken (aantallen, bespaarde minuten, dagreeks); persoonlijke takenlijst; ingestuurde feedback en reviews; een append-only registratie van welke versie van de voorwaarden en privacyverklaring is geaccepteerd.

**Over leerlingen (wij zijn hier verwerker):**

| Wat | Waar | Bijzonderheden |
|---|---|---|
| Klassenlijst: voornaam + geslacht per kind | tabel `klassen` | voedt de tools |
| Concept-rapportteksten per kind (naam + verhaal) | tabel `rapporten` | wordt na 90 dagen automatisch gewist |
| Plattegronden met voornamen, opgeslagen lesmateriaal | tabel `bestanden` | door de gebruiker zelf bewaard |
| Afspraken uit de schoolagenda | tabel `agenda_items` | titel van een *gekoppelde* agenda wordt gemaskeerd vóór opslaan; een afspraak die de leerkracht zélf toevoegt wordt letterlijk bewaard en kan dus een voornaam bevatten. Zie paragraaf 4 |

**Uitdrukkelijk niet opgeslagen:** toetsanalyses. De uitvoer van de toetsanalyse-tool (cijfers en niveaus per kind) wordt nergens naar de server geschreven; die ontstaat in de browser van de leerkracht en gaat als download naar het eigen apparaat. Verder geen BSN, geen diagnoses, geen medische of gedragsgegevens; de tools sturen daar actief van weg.

**Van AI-gebruik loggen wij alleen metadata:** tool, model en tokenaantallen. De prompt en het antwoord worden niet opgeslagen.

Iedere tabel staat onder Row Level Security: een gebruiker kan technisch alleen bij zijn eigen rijen.

## 3. Wat er naar de AI gaat, en hoe het gemaskeerd wordt

Vóór verzending vervangt de browser leerlingnamen door codes (`LL-01`, `LL-02`, ...) en de schoolnaam door een code. Na het antwoord worden ze in de browser weer teruggezet. Er zijn twee lagen: een maskering in de toetsanalyse-tool zelf, en een platformbreed vangnet dat alle voornamen uit de klassenlijsten plus de schoolnaam als hele woorden vervangt.

Gevolg: de AI-leverancier ontvangt gepseudonimiseerde tekst en kan het kind of de school niet herleiden. De koppelsleutel bestaat alleen bij de school.

Aandachtspunt voor de beoordeling: de maskering gebeurt volledig in de browser. De server-route naar de AI is een doorgeefluik dat de inhoud niet inspecteert en niet nogmaals maskeert. Er is dus geen tweede net als een tool zou vergeten te maskeren.

## 4. De schoolagenda koppelen

Dit onderdeel wijkt af van de rest van het platform en verdient daarom aparte
aandacht: het is het enige punt waar gegevens **binnenkomen** in plaats van dat
de leerkracht ze zelf invoert.

**Wat de leerkracht doet.** Hij haalt in zijn schoolapp (Parro, Social Schools,
Outlook of Teams, Google Agenda) de abonneerlink van de agenda op en plakt die
bij ons. Zo'n ICS-link is bedoeld om door agenda-programma's te worden
uitgelezen; dat is de functie ervan. Hij mag meerdere agenda's koppelen.

**Wat er technisch gebeurt.** Onze server haalt de link op (niet de browser van
de leerkracht, dus de aanbieder ziet ons serveradres). Voor het ophalen wordt het
adres gecontroleerd: alleen https, geen inloggegevens in de URL, en interne of
lokale adressen worden geweigerd. De opgehaalde agenda wordt gelezen, per
afspraak wordt het soort herkend (vakantie, vrije dag, rapport, gesprek,
vergadering, toets, activiteit, overig), en losse tijdvakken op dezelfde dag
worden samengevouwen tot één blok.

**Wat wij bewaren, en wat niet.**

| Wat | Bewaard? |
|---|---|
| Datum, einddatum, begintijd, eindtijd, hele dag ja/nee | ja |
| Titel van de afspraak, gemaskeerd, maximaal 300 tekens | ja (maskering geldt voor de gekoppelde agenda; een zelf toegevoegde afspraak wordt letterlijk bewaard) |
| Herkend soort en het aantal samengevouwen tijdvakken | ja |
| **Omschrijving of notitieveld van de afspraak** | **nee, wordt niet eens uitgelezen** |
| **Locatie** | **nee, wordt wel gelezen maar niet opgeslagen** |
| **Genodigden, organisator, e-mailadressen** | **nee** |

De abonneerlink zelf is een sleutel tot de hele agenda. Hij staat daarom
versleuteld in de database (`agenda_bronnen.link_geheim`, versleuteld door de
applicatie met een sleutel die niet in de database staat). De leerkracht kan een
agenda met één actie loskoppelen; de bijbehorende afspraken verdwijnen dan mee.
Beide tabellen staan onder Row Level Security.

**Maskering.** Vóór het opslaan worden de voornamen uit de eigen klassenlijsten
van deze leerkracht in de titel vervangen door `[leerling]`. "Gesprek ouders
Sanne" wordt dus "Gesprek ouders [leerling]". Namen korter dan drie letters
worden overgeslagen, om te voorkomen dat gewone woorden sneuvelen.

Belangrijke beperking, eerlijk gezegd: die maskering kent alleen de kinderen uit
de klassen die deze leerkracht zelf in het platform heeft gezet. Staat er in de
schoolagenda een naam van een kind uit een andere groep, dan blijft die staan.
In de praktijk zijn schoolagenda's meestal op groepsniveau geschreven ("Groep 7 -
Oudergesprekken"), maar wij kunnen niet garanderen dat er nooit een naam in
staat. Zie ook de openstaande punten.

**Merknamen.** Wij noemen Parro, Social Schools, Outlook, Teams en Google Agenda
bij naam om aan te geven waar de koppeling mee werkt, zonder logo's en zonder
enige suggestie van samenwerking of goedkeuring. Wij gaan ervan uit dat dit
toegestaan refererend merkgebruik is, maar horen graag of dat klopt en of de
gebruiksvoorwaarden van die aanbieders geautomatiseerd uitlezen door een derde
partij toestaan. Dat laatste hebben wij niet geverifieerd.

## 5. Externe partijen

| Partij | Rol | Wat gaat erheen | Waar |
|---|---|---|---|
| Supabase | inlog, database, auth-mails | alles uit paragraaf 2 | hosted; volgens onze eigen tekst Frankfurt (zie punt 9 hieronder) |
| Anthropic (Claude) | AI-verwerking | de gemaskeerde prompt | Verenigde Staten |
| Mollie | betalingen | voornaam en e-mail van de leerkracht, bedrag, plan | Nederland |
| Google Fonts | lettertypes | IP-adres en browsergegevens van de bezoeker | Verenigde Staten |
| Cloudflare cdnjs en jsDelivr | scriptbestanden voor de tools | IP-adres en browsergegevens van de bezoeker | Verenigde Staten |
| Parro, Social Schools, Outlook of Teams, Google Agenda | leveren de agenda die de leerkracht koppelt | wij halen op, wij sturen niets; zij zien het adres van onze server en de door de leerkracht verstrekte abonneerlink | per aanbieder verschillend |

De agenda-aanbieders in de laatste rij zijn geen verwerkers van ons: wij sturen er
geen gegevens heen. Het verkeer gaat één kant op, van hen naar ons, en alleen
omdat de leerkracht daar zelf een link voor aanlevert. Zie paragraaf 4.

Er is geen analytics, geen error-tracking, geen advertentiepixel, geen eigen e-maildienst, en er zijn alleen functionele cookies.

Voornemen richting Anthropic: hun DPA tekenen en Zero Data Retention aanvragen (dan bewaart Anthropic de aangeleverde tekst niet). Er bestaat ook een route om Claude in Frankfurt te draaien via AWS Bedrock of Google Vertex; dat is technisch voorbereid maar nog niet aangezet.

## 6. Rechten van betrokkenen, nu al gebouwd

**Inzage en overdraagbaarheid (art. 15 en 20).** Op een eigen pagina, `/mijn-gegevens`, ziet de leerkracht per categorie wat er onder zijn account staat, met een uitklapbare weergave van de inhoud. Elke categorie is los te downloaden in een formaat dat op zijn computer bruikbaar is: rapportteksten en de duo-overdracht als tekstverwerkerbestand, klassenlijst en taken als spreadsheet, de agenda als agendabestand (ics). Meerdere categorieën tegelijk komen als zip. Daarnaast is er één machineleesbaar JSON-bestand met alles.

Twee keuzes daarin die wij bewust hebben gemaakt:

- **De pagina staat buiten de afgeschermde omgeving.** Wie geen abonnement meer heeft, komt niet meer in het dashboard. Zou de export daar onder hangen, dan is het inzagerecht onbereikbaar voor precies de groep die er het vaakst gebruik van maakt: mensen die net gestopt zijn. Inloggen volstaat; een abonnement is niet nodig.
- **Twee velden gaan er nooit uit:** de privélink naar een gekoppelde schoolagenda en het deel-token van een draaiboek. Beide geven toegang aan wie ze in handen krijgt, en een geëxporteerd bestand gaat per mail rond of blijft in een downloadmap staan.

**Wissen (art. 17).** Account verwijderen met één actie; alle gekoppelde gegevens gaan mee via cascade. Per item wissen (klas, rapport, bestand, taak).

**Bewaartermijnen, automatisch afgedwongen.** Drie nachtelijke databasetaken:

| wat | termijn | loopt vanaf |
|---|---|---|
| Concept-rapportteksten | 90 dagen | de laatste bewerking, ongeacht abonnement |
| Overdracht tussen duo-collega's | 30 dagen | de laatste bewerking, ongeacht abonnement |
| Klassenlijst, plattegronden, agenda-afspraken, taken en de duo-gegevens | 90 dagen | het einde van het abonnement |

De derde is nieuw. Wie zijn abonnement laat aflopen raakt zijn gegevens over kinderen dus kwijt, ook als hij zijn account houdt; zijn eigen lesmateriaal (lesontwerpen, werkbladen, draaiboeken) blijft staan, omdat daar geen leerlinggegevens in zitten. Er gaat een aankondiging per e-mail uit, en de verwijdering kan pas plaatsvinden als die mail minstens zeven dagen eerder is verstuurd — dat is een voorwaarde in de databasefunctie zelf, geen procedureafspraak.

⚠️ **Eerlijk over de huidige stand:** deze derde taak draait elke nacht, maar verwijdert op dit moment niets. De aankondigingsmail gaat namelijk pas uit zodra de betaalfunctie live is, en zonder die mail weigert de verwijderfunctie te wissen. Vanaf de livegang werkt de keten volledig.

## 7. Wat er al aan juridische teksten ligt

Een privacyverklaring en algemene voorwaarden, beide met versienummer en met een registratie van wie welke versie heeft geaccepteerd. Bedrijfsnaam, vestigingsadres, KvK-nummer en contactadres staan er inmiddels in. Deze teksten zijn opgesteld zonder juridische toetsing en zijn precies wat wij graag nagekeken zien.

Een verwerkersovereenkomst bestaat nog niet. De voorwaarden beloven er wel al een op verzoek.

## 8. De vragen waar wij op vastlopen

1. **Wie is verwerkingsverantwoordelijke: de leerkracht of de school?** Wij verkopen nu aan individuele leerkrachten, die bij aanmelden akkoord klikken. Bij de geplande schooltools (analyse over meerdere klassen heen) kruist data meerdere leerkrachten. Mag het leerkracht-model, of moet het bij ons altijd op schoolniveau?
2. **Doorgifte naar de Verenigde Staten.** Is de DPA van Anthropic plus Zero Data Retention voldoende, of hebben wij standaardcontractbepalingen en een transfer impact assessment nodig? Zou u ons adviseren de EU-route (Frankfurt) verplicht te maken voor schoolklanten?
3. **Status van de gemaskeerde data.** Blijft dit een persoonsgegeven, en zo ja: wat mogen wij hier richting scholen feitelijk over beweren zonder dat het misleidend wordt?
4. **Een verwerkersovereenkomst die scholen direct kunnen tekenen**, bij voorkeur toegesneden vanuit het model van het Privacyconvenant Onderwijs, inclusief de bijlagen (gegevenscategorieën, subverwerkers, beveiligingsmaatregelen, bewaartermijnen). Dat model verwachten schoolbestuurders en functionarissen gegevensbescherming.
5. Nakijken van de privacyverklaring en de voorwaarden.
6. **Zijn onze bewaartermijnen verdedigbaar** (paragraaf 6)? Met name: 90 dagen voor concept-rapportteksten, en 90 dagen ná het einde van een abonnement voor de klassenlijst en de agenda. Is die tweede termijn te lang, of juist redelijk als hersteltermijn voor iemand die per ongeluk niet verlengt? En mogen wij de klassenlijst wél onbeperkt bewaren zolang het abonnement loopt, of verwacht u ook daar een grens?
7. Is een digitaal klik-akkoord rechtsgeldig, en hoe borgen wij proportioneel dat de ondertekenaar bevoegd is namens de school?
8. Hebben wij een functionaris gegevensbescherming nodig, en moeten wij een DPIA uitvoeren?
9. **De schoolagenda (paragraaf 4).** De leerkracht koppelt een agenda die van de school is en die hij zelf niet heeft opgesteld. Mag hij die link op eigen houtje aan een externe dienst geven, of is daar toestemming van de school voor nodig? En wie is voor die binnengehaalde afspraken verwerkingsverantwoordelijke: de school, de leerkracht, of wij?
10. **Mogen wij de namen Parro, Social Schools, Outlook, Teams en Google Agenda tonen** zoals beschreven in paragraaf 4, dus als aanduiding waar de koppeling mee werkt, zonder logo's en zonder claim van samenwerking?
11. **Is onze maskering van de agendatitels voldoende**, gezien de beperking dat wij alleen de kinderen uit de eigen klassen van deze leerkracht kennen (paragraaf 4)? Zo niet, is het dan verdedigbaar om helemaal geen titels op te slaan en alleen datum, tijd en soort te bewaren?

## 9. Eerlijke lijst met openstaande gaten

Deze punten zijn ons bekend en nog niet opgelost. Wij noemen ze liever zelf dan dat ze uit de beoordeling rollen.

1. De privacyverklaring noemt een bewaartermijn van 24 maanden voor technische logs. Daar zit nog geen automatische opschoning achter.
2. Google Fonts, cdnjs en jsDelivr worden vanuit de browser geladen op alle toolpagina's, maar staan niet in de subverwerkerslijst van de privacyverklaring.
3. Bij het delen van een draaiboek worden e-mailadressen van ontvangers opgeslagen en is er een deel-link die buiten de inlog om werkt. ~~Deze tabel ontbreekt in onze data-export.~~ **Opgelost:** de gedeelde bestanden staan sinds 8 augustus 2026 in de export, zonder het deel-token zelf (zie paragraaf 6). De deel-link die buiten de inlog om werkt bestaat nog wel; dat blijft een aandachtspunt.
4. ~~Ingestuurde feedback en de AI-verbruikslogs zitten niet in de data-export.~~ **Opgelost** op 8 augustus 2026; beide staan er nu in.
5. De opslagregio van Supabase staat als bewering in onze privacyverklaring maar is niet uit de configuratie te controleren; wij verifiëren dat in het Supabase-dashboard vóór het gesprek.
6. De maskering is client-side, zonder controle aan de serverkant (zie paragraaf 3).
7. De maskering van agendatitels dekt alleen de kinderen uit de eigen klassen van de leerkracht. Een naam van een kind uit een andere groep blijft staan (paragraaf 4).
8. ~~De gekoppelde agenda's en de opgehaalde afspraken zitten nog niet in de data-export van het account.~~ **Opgelost** op 8 augustus 2026. De privélink naar de agenda zelf blijft er bewust buiten (zie paragraaf 6).
9. Voor agenda-afspraken gold lange tijd géén bewaartermijn. Sinds 8 augustus 2026 vallen zij onder de opruiming van 90 dagen na het einde van het abonnement (paragraaf 6). **Er blijft één gat:** voor een leerkracht met een lopend abonnement staan afspraken van afgesloten schooljaren er nog steeds. Voornemen is die alsnog op te ruimen, in lijn met het uitgangspunt dat wij alleen het huidige en het vorige schooljaar tonen.
10. Wij hebben niet gecontroleerd of de gebruiksvoorwaarden van Parro, Social Schools, Outlook of Google het uitlezen van hun agendalink door een derde partij toestaan.
11. **Plattegronden zijn niet als afbeelding te downloaden.** Ze verdwijnen wél bij de opruiming van 90 dagen. De gegevens zitten in het JSON-bestand, maar dat is voor een leerkracht niet bruikbaar om de plattegrond terug te zien. Wij vinden dat het recht op overdraagbaarheid daarmee formeel gedekt is maar praktisch niet, en willen het opgelost hebben.
12. **De opruiming van 90 dagen is nog nooit op echte gebruikersgegevens uitgevoerd**, omdat de keten pas werkt zodra de betaalfunctie live gaat. Wel volledig getest met een wegwerpaccount dat de hele molen doorging (klas, rapporten, bestanden, taken, agenda-afspraken): negentien controles, alle geslaagd, tweemaal uitgevoerd. Het testscript is bijgevoegd op verzoek.

---

Bijlagen die wij op verzoek meesturen: het volledige databaseschema, de huidige privacyverklaring en voorwaarden.

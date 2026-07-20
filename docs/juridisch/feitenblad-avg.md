# Feitenblad AVG: Avinka

Voor de privacyjurist. Dit blad beschrijft feitelijk wat het platform doet met gegevens, zodat de beoordeling en de verwerkersovereenkomst niet met uitvraagwerk hoeven te beginnen. Alles hieronder is nagelopen in de broncode; onderaan staat een eerlijke lijst met punten waar de praktijk en de bestaande teksten nog niet kloppen.

Versie: 20 juli 2026. Status: nog niet live, geen echte gebruikers.

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
| Vrije teksten van de leerkracht | tabel `teksten` | kan namen bevatten |

**Uitdrukkelijk niet opgeslagen:** toetsanalyses. De uitvoer van de toetsanalyse-tool (cijfers en niveaus per kind) wordt nergens naar de server geschreven; die ontstaat in de browser van de leerkracht en gaat als download naar het eigen apparaat. Verder geen BSN, geen diagnoses, geen medische of gedragsgegevens; de tools sturen daar actief van weg.

**Van AI-gebruik loggen wij alleen metadata:** tool, model en tokenaantallen. De prompt en het antwoord worden niet opgeslagen.

Iedere tabel staat onder Row Level Security: een gebruiker kan technisch alleen bij zijn eigen rijen.

## 3. Wat er naar de AI gaat, en hoe het gemaskeerd wordt

Vóór verzending vervangt de browser leerlingnamen door codes (`LL-01`, `LL-02`, ...) en de schoolnaam door een code. Na het antwoord worden ze in de browser weer teruggezet. Er zijn twee lagen: een maskering in de toetsanalyse-tool zelf, en een platformbreed vangnet dat alle voornamen uit de klassenlijsten plus de schoolnaam als hele woorden vervangt.

Gevolg: de AI-leverancier ontvangt gepseudonimiseerde tekst en kan het kind of de school niet herleiden. De koppelsleutel bestaat alleen bij de school.

Aandachtspunt voor de beoordeling: de maskering gebeurt volledig in de browser. De server-route naar de AI is een doorgeefluik dat de inhoud niet inspecteert en niet nogmaals maskeert. Er is dus geen tweede net als een tool zou vergeten te maskeren.

## 4. Externe partijen

| Partij | Rol | Wat gaat erheen | Waar |
|---|---|---|---|
| Supabase | inlog, database, auth-mails | alles uit paragraaf 2 | hosted; volgens onze eigen tekst Frankfurt (zie punt 8 hieronder) |
| Anthropic (Claude) | AI-verwerking | de gemaskeerde prompt | Verenigde Staten |
| Mollie | betalingen | voornaam en e-mail van de leerkracht, bedrag, plan | Nederland |
| Google Fonts | lettertypes | IP-adres en browsergegevens van de bezoeker | Verenigde Staten |
| Cloudflare cdnjs en jsDelivr | scriptbestanden voor de tools | IP-adres en browsergegevens van de bezoeker | Verenigde Staten |

Er is geen analytics, geen error-tracking, geen advertentiepixel, geen eigen e-maildienst, en er zijn alleen functionele cookies.

Voornemen richting Anthropic: hun DPA tekenen en Zero Data Retention aanvragen (dan bewaart Anthropic de aangeleverde tekst niet). Er bestaat ook een route om Claude in Frankfurt te draaien via AWS Bedrock of Google Vertex; dat is technisch voorbereid maar nog niet aangezet.

## 5. Rechten van betrokkenen, nu al gebouwd

- Data-export van het eigen account, als leesbare pagina of als JSON.
- Account verwijderen met één actie; alle gekoppelde gegevens gaan mee via cascade.
- Per item wissen (klas, rapport, tekst, bestand, taak).
- Automatische opschoning van concept-rapportteksten na 90 dagen (nachtelijke databasetaak).

## 6. Wat er al aan juridische teksten ligt

Een privacyverklaring en algemene voorwaarden, beide met versienummer en met een registratie van wie welke versie heeft geaccepteerd. In beide staan nog placeholders voor bedrijfsnaam, adres, KvK-nummer en contactadres. Deze teksten zijn opgesteld zonder juridische toetsing en zijn precies wat wij graag nagekeken zien.

Een verwerkersovereenkomst bestaat nog niet. De voorwaarden beloven er wel al een op verzoek.

## 7. De vragen waar wij op vastlopen

1. **Wie is verwerkingsverantwoordelijke: de leerkracht of de school?** Wij verkopen nu aan individuele leerkrachten, die bij aanmelden akkoord klikken. Bij de geplande schooltools (analyse over meerdere klassen heen) kruist data meerdere leerkrachten. Mag het leerkracht-model, of moet het bij ons altijd op schoolniveau?
2. **Doorgifte naar de Verenigde Staten.** Is de DPA van Anthropic plus Zero Data Retention voldoende, of hebben wij standaardcontractbepalingen en een transfer impact assessment nodig? Zou u ons adviseren de EU-route (Frankfurt) verplicht te maken voor schoolklanten?
3. **Status van de gemaskeerde data.** Blijft dit een persoonsgegeven, en zo ja: wat mogen wij hier richting scholen feitelijk over beweren zonder dat het misleidend wordt?
4. **Een verwerkersovereenkomst die scholen direct kunnen tekenen**, bij voorkeur toegesneden vanuit het model van het Privacyconvenant Onderwijs, inclusief de bijlagen (gegevenscategorieën, subverwerkers, beveiligingsmaatregelen, bewaartermijnen). Dat model verwachten schoolbestuurders en functionarissen gegevensbescherming.
5. Nakijken van de privacyverklaring en de voorwaarden.
6. Zijn onze bewaartermijnen verdedigbaar, met name de 90 dagen voor concept-rapportteksten?
7. Is een digitaal klik-akkoord rechtsgeldig, en hoe borgen wij proportioneel dat de ondertekenaar bevoegd is namens de school?
8. Hebben wij een functionaris gegevensbescherming nodig, en moeten wij een DPIA uitvoeren?

## 8. Eerlijke lijst met openstaande gaten

Deze punten zijn ons bekend en nog niet opgelost. Wij noemen ze liever zelf dan dat ze uit de beoordeling rollen.

1. De privacyverklaring noemt een bewaartermijn van 24 maanden voor technische logs. Daar zit nog geen automatische opschoning achter.
2. Google Fonts, cdnjs en jsDelivr worden vanuit de browser geladen op alle toolpagina's, maar staan niet in de subverwerkerslijst van de privacyverklaring.
3. Bij het delen van een draaiboek worden e-mailadressen van ontvangers opgeslagen en is er een deel-link die buiten de inlog om werkt. Deze tabel ontbreekt in onze data-export.
4. Ingestuurde feedback en de AI-verbruikslogs zitten niet in de data-export.
5. De opslagregio van Supabase staat als bewering in onze privacyverklaring maar is niet uit de configuratie te controleren; wij verifiëren dat in het Supabase-dashboard vóór het gesprek.
6. De maskering is client-side, zonder controle aan de serverkant (zie paragraaf 3).

---

Bijlagen die wij op verzoek meesturen: het volledige databaseschema, de huidige privacyverklaring en voorwaarden.

# Plan: mail vanuit Avinka

Hoe het platform mail verstuurt, welke berichten dat zijn, en in welke volgorde
we het opzetten. Vastgelegd 3 augustus 2026.

**De kern in één zin:** Google Workspace blijft de postbus (inkomende mail en
jouw eigen mail), en de automatische mail van het platform gaat er eerst via
diezelfde Workspace uit en later via een aparte verzenddienst.

---

## 1. Welke mails er zijn

Drie stuks, bewust niet meer. Vijf berichten in het eerste kwartier van een
nieuw account is ruis; bevestigen en welkom heten mogen best één mail zijn.

| # | Mail | Wanneer | Afzender | Antwoordadres |
|---|---|---|---|---|
| 1 | Bevestig je aanmelding (met welkom erin) | direct bij aanmelden | `no-reply@avinka.nl` | – |
| 2 | Je proefperiode loopt af | 2 dagen vóór het einde van de 7 proefdagen | `no-reply@avinka.nl` | – |
| 3 | Bevestiging van je abonnement | direct na een geslaagde betaling | `no-reply@avinka.nl` | **`support@avinka.nl`** |

Daarnaast blijft de bestaande **wachtwoord-vergeten-mail** lopen. Die telt
technisch mee, maar is geen nieuwe bouwstap: die verstuurt Supabase al.

**Mail 3 is wettelijk verplicht** bij verkoop aan consumenten: prijs inclusief
btw, looptijd en hoe je opzegt moeten erin staan, en het moet op een duurzame
drager (lees: een mail die de klant bewaart). Dit hoort bij het rijtje
consumentenrecht-punten dat al op de go-live-lijst staat. Juist bij déze mail
wil je een echt antwoordadres: "je kunt hier niet op antwoorden" is precies de
verkeerde indruk als er iets niet klopt aan een afschrijving.

**Mail 2 is geen mailklus maar een tijdklus.** Er moet iets dagelijks kijken
wiens proef bijna afloopt (`proef_eindigt` in de abonnement-gegevens, zie
`src/lib/abonnement.ts`) en dan die mail sturen. Er draait al zo'n dagelijkse
taak in de database voor het opruimen van oude rapporten
(`database/retention.sql`, cron `wis-oude-rapporten`) — dat is het patroon om te
volgen. Bouw dit pas ná mail 1 en 3.

**Bewust NIET nu:** nieuwsbrieven, tips-mails, "je collega heeft een taak
afgevinkt", en de duo-uitnodiging per mail. De duo-uitnodiging werkt prima als
deelbare link (zie `DuoCollega.tsx`); een mail eromheen is later een kwartiertje
werk zodra de verzendstraat staat.

---

## 2. Fase 1 — nu: Workspace als afzender

Doel: af van de ingebouwde Supabase-mailservice. Die is voor testen bedoeld,
knijpt af op een paar berichten per uur, en verstuurt niet vanaf jouw domein.

1. In Supabase onder Authentication → SMTP Settings de Gmail-server invullen
   (`smtp.gmail.com`, poort 587) met het Workspace-account als gebruiker.
2. Daarvoor is een **app-wachtwoord** nodig, geen gewoon wachtwoord. Dat kan
   alleen als tweestapsverificatie op het account aanstaat.
3. ⚠️ **Wil je dat er `no-reply@avinka.nl` boven staat, dan moet die alias in
   Gmail eerst aangezet worden onder "E-mail verzenden als".** Doe je dat niet,
   dan zet Google er alsnog `info@avinka.nl` boven — de mail komt wel aan, maar
   onder de verkeerde naam.
4. De sjablonen in Supabase naar het Nederlands zetten. Let op de bestaande
   afspraak: de bevestigingslink moet de token_hash-vorm gebruiken
   (`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`),
   anders werkt hij niet met de route `/auth/confirm`.

**Grenzen om te kennen:** Workspace laat ongeveer 2.000 berichten per dag toe.
Ruim genoeg voor de proefgroep. Het risico zit niet in het aantal maar in de
vermenging: gaat er een script los, dan knijpt Google het account af en zit
jouw eigen zakelijke mail in dezelfde knel.

**Wat je hier niet krijgt:** zicht op wat er met een mail gebeurde. Je ziet
nergens of die bevestiging aankwam of op een dood adres stuitte. Precies daarom
is dit een tussenstap.

---

## 3. Fase 2 — vóór de betalingen live gaan: Resend erbij

Zodra er echt afgerekend wordt, wil je van elke bevestigingsmail kunnen zien
dat hij is aangekomen. Dan komt de verzenddienst erbij.

**Keuze: Resend.** Gratis tot 3.000 mails per maand (met een plafond van 100 per
dag), daarboven ongeveer €20 per maand voor 50.000. Koppelt met een paar regels
code. ⚠️ Cijfers zijn van augustus 2026 — narekenen op hun site vlak vóór we
koppelen.

*Niet gekozen:* Postmark levert nog iets betrouwbaarder af maar kost vanaf dag
één ~€15 per maand; Amazon SES is spotgoedkoop bij grote aantallen maar
bewerkelijk om op te zetten. Op deze schaal wegen die niet op tegen het gemak.
Overstappen is later een dag werk, geen verbouwing.

### Wat er in de DNS bij komt

Google houdt de ontvangst; de verzenddienst krijgt zijn eigen handtekening.
Ze bijten elkaar niet, op één punt na.

| Soort | Wat er gebeurt |
|---|---|
| MX (ontvangst) | **Ongewijzigd**, blijft Google |
| DKIM (handtekening) | Nieuwe regel op een eigen naam van de verzenddienst. Google houdt zijn eigen regel; twee handtekeningen naast elkaar is normaal |
| SPF (wie mag verzenden) | ⚠️ **Hier zit de valkuil.** Er mag maar **één** SPF-regel op een domein staan. Google en de verzenddienst moeten dus in dezélfde regel worden samengevoegd — een tweede regel erbij zetten breekt ze allebei |
| DMARC | Eén regel, zacht beginnen (`p=none`) zodat je eerst kunt kijken wat er binnenkomt voordat je gaat afdwingen |

### Wat er in de code bij komt

- Eén plek die mail verstuurt (`src/lib/mail.ts`), niet verspreid door de app.
- Eén huisstijl-sjabloon waar alle drie de mails in vallen. Dat doe je één keer
  goed; elke volgende mail is daarna een kwartiertje.
- De API-sleutel als omgevingsvariabele op Vercel, niet in git.

---

## 4. Volgorde en afhankelijkheden

1. **Domein eerst.** Zonder eigen domein valt hier niets in te stellen: zowel
   fase 1 als fase 2 hangen aan `avinka.nl`.
2. **Fase 1** kan meteen daarna, los van alles.
3. **Fase 2** hoort vlak vóór Mollie live gaat, want mail 3 hoort bij de eerste
   echte betaling.
4. **Mail 2** (proef loopt af) als laatste; die heeft de dagelijkse taak nodig.

---

## 5. Waar je op moet letten als het draait

- **Het dagplafond van 100 bij Resend gratis** raak je eerder dan het
  maandtotaal. Nodig je op één ochtend een grote groep uit, dan loop je daar
  tegenaan en blijven mails staan. Speelt op een lanceerdag, niet daarbuiten.
- **Kijk na de eerste echte betaling of mail 3 daadwerkelijk aankwam**, niet of
  de code geen fout gaf. Dat zijn twee verschillende dingen.
- Rond de 500 à 800 betalende gebruikers loop je uit het gratis pakket. Dan
  betaal je ~€20 per maand met honderden abonnementen die lopen; dat is op dat
  moment geen afweging meer.

# Supabase op Resend zetten

Kant-en-klaar om over te nemen in het Supabase-dashboard. Alles hier is
dashboard-werk: het staat niet in de code en gaat dus ook niet mee in een
commit of een merge. Vandaar dit bestand.

Achtergrond en de rest van de mailplannen: `docs/plan-mail.md`.

---

## 1. De verzendserver

**Authentication → Emails → SMTP Settings** (of Project Settings →
Authentication, afhankelijk van de schermversie). Zet "Enable Custom SMTP" aan.

| Veld | Waarde |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | je Resend API-sleutel (dezelfde als `RESEND_API_KEY` in `.env.local`) |
| Sender email | `no-reply@avinka.nl` |
| Sender name | `Avinka` |

⚠️ De gebruikersnaam is letterlijk het woord `resend`, niet je mailadres. Dat
is de meest gemaakte fout bij het instellen.

🔴 **EN HIJ MOET IN KLEINE LETTERS — dit heeft 7-8 een avond gekost.** Er stond
`Resend` met een hoofdletter (waarschijnlijk automatisch zo ingevuld door de
browser). De mailserver ziet dat als een compleet andere gebruikersnaam en
antwoordt `535 Invalid username`. Supabase vertaalt dat naar de nietszeggende
melding **"Error sending confirmation email"**, en de gebruiker ziet alleen
"Er ging iets mis".

🔑 **Hoe we het vonden, gebruik dit weer bij mailproblemen:** niet gokken maar
de SMTP-verbinding zelf nabootsen met een klein Node-script (inloggen, afzender
opgeven, ontvanger opgeven, stoppen vóór de inhoud — dus zonder mail te
sturen). Dat scheidde in één keer "ligt het aan Resend" van "ligt het aan
Supabase". ⭐ **De snelste losse check:** kijk in het Resend-dashboard onder
**Emails** of er überhaupt een regel bij komt. Blijft dat leeg, dan is Supabase
niet eens tot versturen gekomen en hoef je in het sjabloon of de poort niet
verder te zoeken.

⚠️ Werkt poort 465 niet, probeer dan 587. Sommige netwerken blokkeren er een.

### Daarna: de limiet ophogen

**Authentication → Rate Limits.** Zolang Supabase zijn eigen testmaildienst
gebruikt, staat het aantal mails per uur bewust laag. Met een eigen
verzendserver mag dat omhoog. Zet hem op iets als 100 per uur.

Doe je dit niet, dan lopen je eerste dertig testgebruikers die zich op één
avond aanmelden tegen een limiet aan en krijgt een deel van hen geen
bevestigingsmail. Dat is precies het soort fout dat je pas hoort als iemand het
meldt.

---

## 2. De sjablonen

⚠️ **VEROUDERD — de HTML hieronder is de kale eerste versie.** De echte,
huisstijl-versie om te plakken staat in `docs/mailsjablonen.md`. Dit blok
laten staan als geschiedenis van waar de sjablonen vandaan kwamen, niet als
bron om te kopiëren.

**Authentication → Emails → Templates.** Drie stuks. Per sjabloon vul je een
onderwerp en een berichttekst in.

🔑 **De link moet de `token_hash`-vorm gebruiken**, niet de standaardvorm met
`{{ .ConfirmationURL }}`. De route `/auth/confirm` in dit project kan allebei
aan, maar de token_hash-vorm laat ons zelf bepalen waar iemand na het
bevestigen terechtkomt (de `next=`-parameter). Bij het herstellen van een
wachtwoord is dat het verschil tussen "je staat op je dashboard en vraagt je af
wat er gebeurde" en "je staat op het scherm waar je je wachtwoord kunt kiezen".

### 2a. Confirm signup

**Subject:** `Bevestig je aanmelding bij Avinka`

```html
<p>Hallo,</p>

<p>Bedankt voor je aanmelding bij Avinka. Klik op de link hieronder om je
e-mailadres te bevestigen, dan staat je account klaar.</p>

<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Bevestig je e-mailadres</a></p>

<p>Je proefperiode van 7 dagen begint zodra je bevestigt. Je hoeft geen
betaalgegevens op te geven.</p>

<p>Heb je je niet aangemeld? Dan hoef je niets te doen. Zonder bevestiging
gebeurt er niets met dit adres.</p>

<p>Met vriendelijke groet,<br>
Michael van Spanje<br>
Avinka</p>
```

### 2b. Reset password

**Subject:** `Een nieuw wachtwoord instellen voor Avinka`

```html
<p>Hallo,</p>

<p>Je vroeg een nieuw wachtwoord aan voor je Avinka-account. Klik op de link
hieronder om er een in te stellen.</p>

<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/nieuw-wachtwoord">Nieuw wachtwoord instellen</a></p>

<p>Deze link is een uur geldig en werkt één keer.</p>

<p>Heb je dit niet aangevraagd? Dan hoef je niets te doen. Je huidige
wachtwoord blijft gewoon werken.</p>

<p>Met vriendelijke groet,<br>
Michael van Spanje<br>
Avinka</p>
```

### 2c. Change email address

**Subject:** `Bevestig je nieuwe e-mailadres voor Avinka`

```html
<p>Hallo,</p>

<p>Je wilt het e-mailadres van je Avinka-account wijzigen naar dit adres. Klik
op de link hieronder om dat te bevestigen.</p>

<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change">Bevestig dit e-mailadres</a></p>

<p>Heb je dit niet aangevraagd? Neem dan contact op via support@avinka.nl, want
dan probeert iemand anders bij je account te komen.</p>

<p>Met vriendelijke groet,<br>
Michael van Spanje<br>
Avinka</p>
```

---

## 3. Controleren of het werkt

1. **Site URL nakijken** onder Authentication → URL Configuration. Die vult de
   `{{ .SiteURL }}` in de links hierboven. Lokaal is dat `http://localhost:3001`;
   vóór livegang moet daar het echte adres staan, anders wijzen alle
   bevestigingslinks naar een computer die alleen bij jou draait.
2. Maak een account aan met een adres dat je kunt lezen.
3. De mail hoort binnen te komen vanaf `no-reply@avinka.nl`, en de link hoort
   je in te loggen en op je dashboard te zetten.
4. Vraag daarna een nieuw wachtwoord aan en kijk of je op het scherm belandt
   waar je er een kunt kiezen, niet op het dashboard.
5. In Resend zie je onder Emails dat beide berichten langs zijn gekomen. Dat is
   het verschil met vroeger: je kunt nu zien of iets is aangekomen.

---

## 4. Wat hierna nog open staat

- **DMARC strenger zetten.** ⚠️ **Correctie 7-8: er is GEEN rapportage.** Het
  record is letterlijk `v=DMARC1; p=none;` — zonder `rua=`, dus er komen geen
  rapporten binnen en er valt op dit moment niets "mee te kijken". Wil je vóór
  livegang naar `p=quarantine`, zet er dan éérst een paar weken van tevoren een
  `rua=mailto:...` bij, anders scherp je blind aan en kun je je eigen post
  blokkeren. Nu niet nodig; het is een taak voor tegen de lancering.
- **De drie eigen mails** uit `docs/plan-mail.md` (duo-uitnodiging, proef loopt
  af, abonnement bevestigd). Die gaan niet via Supabase maar via
  `src/lib/mail.ts`.
- **De testknop in /admin mag weg** zodra de echte mails draaien.

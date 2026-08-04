# De mailsjablonen in huisstijl

Plakken in Supabase onder **Authentication → Emails → Templates**. Werkt pas
nadat de eigen verzendserver is ingesteld; zie `docs/supabase-mail-instellingen.md`.

---

## Waarom deze mails er anders uitzien dan de rest van het platform

Mail is geen web. Wat hier gebruikt wordt en wat bewust NIET:

- **Tabellen voor de indeling.** Outlook rekent HTML af met de opmaakmotor van
  Word. Flexbox en grid doen het daar niet, tabellen wel. Dat ziet er in de
  broncode ouderwets uit en dat hoort zo.
- **Alle opmaak staat in het element zelf** (`style="…"`), niet in een
  stylesheet. Gmail knipt een `<style>`-blok weg bij het doorsturen. Het enige
  wat er wél in een `<style>` staat is het ophalen van de lettertypes, want dat
  kan nergens anders.
- **De eigen lettertypes worden meegestuurd, maar komen niet overal aan.**
  Fraunces en Plus Jakarta staan vooraan in de reeks, met Georgia en de
  systeemletter erachter. In Apple Mail en op de iPhone zie je de echte letter;
  ⚠️ **Gmail en Outlook laden geen lettertypes en tonen altijd de terugval.**
  Dat is een harde grens van e-mail, geen instelling die we vergeten zijn.
- **Geen logo bovenaan.** Een beeldlogo moet van een openbaar webadres komen en
  de site staat nog niet online; bovendien blokkeren Outlook en Gmail
  afbeeldingen standaard, dus dan ziet de helft van je lezers een leeg kadertje.
  Een nagemaakt tekstlogo stond gek (oordeel eigenaar 4-8), dus die is eruit.
  De mail begint nu gewoon met de kop. ⏭️ Zodra de site live is kan het echte
  logo erin, met tekst als terugval.
- **De knop is `#25855a`, niet het gewone merkgroen `#2f9e6e`.** Wit op dat
  laatste haalt 3,37:1 en zakt door de AA-grens; deze tint haalt 4,58:1.
- **De link staat ook als platte tekst onderaan.** Toont een mailprogramma de
  knop niet, dan kan iemand hem alsnog kopiëren. Dat is geen sierlijkheid maar
  de enige uitweg als de knop het niet doet.

⚠️ **Vervang de link nooit door `{{ .ConfirmationURL }}`.** Alleen met de
`token_hash`-vorm kunnen we bepalen waar iemand na het klikken belandt. Bij
wachtwoord-herstel is dat het verschil tussen op je dashboard staan en op het
scherm staan waar je een wachtwoord kiest.

---

## 1. Confirm signup

**Subject:** `Bevestig je aanmelding bij Avinka`

```html
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Plus+Jakarta+Sans:wght@400;700&display=swap');
</style>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fbf6ee;padding:32px 12px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:20px;font-family:'Plus Jakarta Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <tr><td style="padding:34px 36px 0;">
        <h1 style="margin:0;font-family:Fraunces,Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:#221c3a;">Welkom bij Avinka</h1>
        <p style="margin:14px 0 0;font-size:16px;line-height:1.65;color:#4a4458;">Nog één klik en je account staat klaar.</p>
      </td></tr>
      <tr><td align="center" style="padding:26px 36px 0;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" bgcolor="#25855a" style="border-radius:12px;">
            <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email"
               style="display:inline-block;padding:14px 30px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">Bevestig mijn adres</a>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:24px 36px 0;">
        <p style="margin:0;font-size:15px;line-height:1.65;color:#4a4458;">Je proefperiode van 7 dagen begint zodra je bevestigt. Je hoeft geen betaalgegevens op te geven.</p>
        <p style="margin:14px 0 0;font-size:15px;line-height:1.65;color:#6b6880;">Heb je je niet aangemeld? Dan hoef je niets te doen. Zonder bevestiging gebeurt er niets met dit adres.</p>
      </td></tr>
      <tr><td style="padding:24px 36px 30px;">
        <div style="border-top:1px solid #ece7e0;padding-top:16px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#8a8798;">Werkt de knop niet? Kopieer dan deze link:<br>
            <span style="color:#25855a;word-break:break-all;">{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email</span>
          </p>
          <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:#8a8798;">Avinka &middot; van to-do naar gedaan<br>Michael van Spanje</p>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
```

---

## 2. Reset password

**Subject:** `Een nieuw wachtwoord instellen voor Avinka`

Zelfde opzet; alleen de kop, de tekst, het opschrift van de knop en het `type`
in de link verschillen.

```html
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Plus+Jakarta+Sans:wght@400;700&display=swap');
</style>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fbf6ee;padding:32px 12px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:20px;font-family:'Plus Jakarta Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <tr><td style="padding:34px 36px 0;">
        <h1 style="margin:0;font-family:Fraunces,Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:#221c3a;">Een nieuw wachtwoord</h1>
        <p style="margin:14px 0 0;font-size:16px;line-height:1.65;color:#4a4458;">Je vroeg een nieuw wachtwoord aan voor je Avinka-account.</p>
      </td></tr>
      <tr><td align="center" style="padding:26px 36px 0;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" bgcolor="#25855a" style="border-radius:12px;">
            <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/nieuw-wachtwoord"
               style="display:inline-block;padding:14px 30px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">Wachtwoord instellen</a>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:24px 36px 0;">
        <p style="margin:0;font-size:15px;line-height:1.65;color:#4a4458;">Deze link is een uur geldig en werkt één keer.</p>
        <p style="margin:14px 0 0;font-size:15px;line-height:1.65;color:#6b6880;">Heb je dit niet aangevraagd? Dan kun je deze mail negeren, je wachtwoord verandert niet. Twijfel je? Mail <a href="mailto:support@avinka.nl" style="color:#25855a;font-weight:bold;">support@avinka.nl</a>.</p>
      </td></tr>
      <tr><td style="padding:24px 36px 30px;">
        <div style="border-top:1px solid #ece7e0;padding-top:16px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#8a8798;">Werkt de knop niet? Kopieer dan deze link:<br>
            <span style="color:#25855a;word-break:break-all;">{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/nieuw-wachtwoord</span>
          </p>
          <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:#8a8798;">Avinka &middot; van to-do naar gedaan<br>Michael van Spanje</p>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
```

---

## 3. Change email address

**Subject:** `Bevestig je nieuwe e-mailadres voor Avinka`

```html
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Plus+Jakarta+Sans:wght@400;700&display=swap');
</style>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fbf6ee;padding:32px 12px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:20px;font-family:'Plus Jakarta Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <tr><td style="padding:34px 36px 0;">
        <h1 style="margin:0;font-family:Fraunces,Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:#221c3a;">Bevestig dit adres</h1>
        <p style="margin:14px 0 0;font-size:16px;line-height:1.65;color:#4a4458;">Je wilt het e-mailadres van je Avinka-account wijzigen naar dit adres.</p>
      </td></tr>
      <tr><td align="center" style="padding:26px 36px 0;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" bgcolor="#25855a" style="border-radius:12px;">
            <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change"
               style="display:inline-block;padding:14px 30px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">Bevestig dit adres</a>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:24px 36px 0;">
        <p style="margin:0;font-size:15px;line-height:1.65;color:#6b6880;">Heb je dit niet aangevraagd? Neem dan contact op via support@avinka.nl, want dan probeert iemand anders bij je account te komen.</p>
      </td></tr>
      <tr><td style="padding:24px 36px 30px;">
        <div style="border-top:1px solid #ece7e0;padding-top:16px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#8a8798;">Werkt de knop niet? Kopieer dan deze link:<br>
            <span style="color:#25855a;word-break:break-all;">{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change</span>
          </p>
          <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:#8a8798;">Avinka &middot; van to-do naar gedaan<br>Michael van Spanje</p>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
```

---

## Nog te doen

- **Het echte logo** zodra de site live staat (nu staat er geen).
- **Donkere modus** is niet apart bekeken. Gmail en Outlook draaien lichte
  achtergronden soms zelf om; de kleuren staan hier expliciet, dus het blijft
  leesbaar, maar mooi is iets anders. Nakijken als er tijd is.
- Deze opzet is de basis voor de eigen mails uit `docs/plan-mail.md`
  (duo-uitnodiging, proef loopt af, abonnement bevestigd). Die gaan via
  `src/lib/mail.ts` en krijgen dezelfde vorm.

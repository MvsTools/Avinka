# Plan: de ochtendroutine (Claude Cowork)

De visie achter de losse gesprekken van 4 augustus 2026 over boekhouding en
automatisering, in één document. Nog geen bouwstap — een vastgelegd doel om
naar toe te werken zodra de losse onderdelen er staan.

**De kern in één zin:** elke werkdag van 7 tot 8 uur werkt Claude Cowork zelf
de randzaken van het platform af — mail klaarzetten, boekhouding voorbereiden,
supporttickets samenvatten, updates signaleren — zodat er om 8 uur een
ochtendbriefing klaarstaat in plaats van een lege inbox met werk erin.

---

## 1. Wat dit is, en wat niet

**Dit gaat over Claude Cowork**, niet over Claude Code (waar dit document mee
geschreven is). Cowork is een los onderdeel van de Claude.ai-app
(desktop/web/mobiel) met eigen koppelingen en een planner voor terugkerende
taken (`/schedule every weekday at 7am: ...`). Draait in de cloud, dus de
laptop hoeft niet aan. Zit in het Pro-abonnement, geen aparte kosten.

**Dit gaat niet over de automatische platformmail.** De bevestigings-,
proef-einde-, abonnements- en uitnodigingsmails die het platform zelf via
Resend verstuurt (zie `docs/plan-mail.md`) zijn pure programmalogica — een
gebeurtenis in de code triggert een vast sjabloon. Daar hoeft geen AI aan te
pas te komen en dat verandert dit plan niet. De ochtendroutine gaat over de
**eigen postbus** (Google Workspace) waar een mens iets in typt en dus
beoordeling nodig heeft.

---

## 2. De bouwstenen per domein

| Domein | Koppeling | Status |
|---|---|---|
| Mail klaarzetten | Gmail/Google Workspace-connector in Cowork | bestaat al, nu al te zetten |
| Boekhouding voorbereiden | Moneybird MCP (officieel, read-only/read-write) | wacht op Moneybird-account, dat wacht op KvK/bank ([[zakelijke-rekening]]) |
| Supporttickets uitlezen | afhankelijk van waar tickets binnenkomen | ⚠️ nog open — komt dit gewoon in de mailbox (dan dekt Gmail het al) of een apart systeem? |
| Updates signaleren | nog te bepalen | ⚠️ zie kanttekening hieronder |

### Kanttekening: "updates uitvoeren" is twee dingen

Routinematig controleren of er iets is (pakket-updates, wat is er veranderd)
is prima te automatiseren. **Echt naar productie deployen** is een ander
risiconiveau — dat raakt live gebruikersdata en kan iets breken zonder dat
iemand het meteen ziet. Dat hoort bij "klaarzetten voor akkoord", niet bij een
stille auto-actie.

---

## 3. De gouden regel, toegepast op de ochtendroutine

Zelfde regel als het bredere AI-team-plan ([[ai-team-aanpak]]): **voorbereiden
is aan Claude, de onomkeerbare klik is aan de eigenaar.** Voor deze routine
betekent dat concreet:

- Mails: als **concept** klaarzetten, niet versturen.
- Boekingen: als **voorstel** klaarzetten, niet boeken (zeker aangiftes niet).
- Supporttickets: samenvatten + een aanpak voorstellen, niet zelf beantwoorden.
- Updates: signaleren, niet zelf deployen.

Alles landt in één ochtendbriefing die de eigenaar om 8 uur doorloopt en per
onderdeel afvinkt.

---

## 4. Volgorde en afhankelijkheden

1. **Mail-triage kan het eerst** — hangt aan niets, Google Workspace is er al.
2. **Boekhouding** wacht op de zakelijke rekening + Moneybird-account
   ([[boekhoudservice-keuze]], [[moneybird-mcp-koppeling]]).
3. **Supporttickets** wacht tot duidelijk is wáár die binnenkomen — dit is nog
   geen gebouwd onderdeel van het platform.
4. **Updates-signalering** wacht tot de scope duidelijk is (alleen checken, of
   ook een concept-deploy voorbereiden).

Geen van deze vier hoeft op elkaar te wachten; ze kunnen één voor één worden
aangezet zodra hun eigen afhankelijkheid klaar is.

---

## 5. Open vragen

- Wat moet er precies in "updates uitvoeren" zitten?
- Welk systeem gaat supporttickets afhandelen, en komt dat er überhaupt als
  apart onderdeel, of blijft het bij de mailbox?
- Wanneer de eerste koppeling (mail-triage) daadwerkelijk aanzetten — kan al
  vóór livegang, als losse proef.

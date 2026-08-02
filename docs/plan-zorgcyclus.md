# Plan: de zorgcyclus in Avinka

Status: **idee-fase, nog niets gebouwd.** Vastgelegd 2 augustus 2026 naar
aanleiding van een ingeving van de eigenaar. Dit document bewaart de redenering
en de gevonden feiten, zodat dit later opgepakt kan worden zonder het onderzoek
opnieuw te doen.

---

## 1. Het idee, in de woorden van de eigenaar

> "Veel scholen vinden een inspectiebezoek heel eng. Scholen vallen massaal uit
> op het bijhouden van de kleine zorgcyclus. Ik wil via deze weekplanning en
> jaarrooster (...) een compleet gebruiksvriendelijke manier geven van de kleine
> zorgcyclus. (...) Dit moet echt een groots platform worden waar een leerkracht
> letterlijk alles op kan. Zonder die notities kunnen aanmaken per les over wie
> waar uitvalt, heb je niet veel aan een online weekplanning die voor je
> doorplant."

Kern: de weekplanning is niet af als je er niet per les bij kunt aantekenen wie
waar uitvalt. Die aantekeningen zijn tegelijk het materiaal waarmee de
zorgcyclus zichzelf vult.

## 2. Wat de "kleine zorgcyclus" is (uitgezocht)

De tegenhanger van het **groepsplan** (de "grote" cyclus: meestal twee keer per
jaar geëvalueerd). Het groepsplan is in de praktijk op veel scholen verworden
tot wat leerkrachten zelf "papieren tijgers en zinloze administratieve
rompslomp" noemen.

De **kleine/korte zorgcyclus** is dezelfde gedachte, maar veel dichter op de
dagelijkse praktijk, in vijf stappen die vaak worden doorlopen (wekelijks, van
vakantie tot vakantie, soms per les):

1. Signaleren
2. Analyseren
3. Plannen
4. Uitvoeren
5. Evalueren

Scholen die hierop overstappen zetten de doelen zelf in hun **weekplanningen**,
voor de basisgroep én de subgroepen — precies de plek waar Avinka al zit.

**De inspectie-link is echt, niet verzonnen.** In gedocumenteerde praktijk-
voorbeelden gaf de inspectie een school terug dat *"het afstemmen op de
onderwijsbehoeften onvoldoende zichtbaar was in de weekplanningen"*. Terugkerende
knelpunten uit inspectierapporten: de cyclus wordt niet afgemaakt (wel
evalueren, geen consequenties), te veel doelen tegelijk, veel data verzamelen
maar weinig analyseren. Let op: **groepsplannen zijn wettelijk niet verplicht** —
het gaat de inspectie om of je aantoonbaar afstemt, niet om het formulier.

## 3. De concurrent: Momento (belangrijke vondst)

**Momento heeft dit al**, als functie die letterlijk "Korte zorgcyclus" heet,
met exact diezelfde vijf stappen, in dezelfde planningstool die ook al
methode-lessen doorplant.

Wat Momento is: een gezamenlijk initiatief van vrijwel de hele branche —
Malmberg, Noordhoff, Zwijsen, Blink, Heutink, Reinders, De Rolf groep — gratis
voor scholen sinds 2017/2018, gekoppeld aan Basispoort.

**Waarom dat toch geen doodlopende weg is (oordeel van de eigenaar, die het als
leerkracht dagelijks gebruikt):** het werkt in de praktijk slecht. Je kunt
nergens iets afvinken, alleen losse notities maken. Zeker voor oudere
leerkrachten "een vreselijk ding". Dat is precies het gat: niet de functionaliteit
ontbreekt in de markt, maar de bruikbaarheid.

**Het onderscheidende vermogen van Avinka** is bovendien iets wat een kale
planningstool niet heeft: de zorgcyclus-notities kunnen de bestaande AI-tools
voeden (toetsanalyse signaleert, rapporten en oudercontact putten uit dezelfde
gegevens) in plaats van een los administratief eiland te zijn.

## 4. De twee harde randvoorwaarden

### 4.1 Verwerkersovereenkomst met scholen (AVG)

Dit vereist structureel meer leerlingdata op de server dan het platform nu
bewust bewaart (nu: toetsanalyses gaan nooit naar de server, rapporten worden
na 90 dagen gewist — zie [`feitenblad-avg.md`](juridisch/feitenblad-avg.md)).

Dat maakt dit **geen tool-uitbreiding maar een bedrijfsmodel-verschuiving**: van
individuele leerkracht-abonnementen naar contracten met scholen. Dat sluit aan
op de al eerder gekozen schoolroute, maar maakt die noodzakelijk in plaats van
optioneel.

### 4.2 EU AI Act (zie [`feitenblad-ai-act.md`](juridisch/feitenblad-ai-act.md))

Zodra er AI-ondersteunde signalering bij komt — leerlingen over tijd volgen,
patronen herkennen — zit dat nog dichter tegen **"profileren"** aan dan de
bestaande Toetsanalyse-tool. Profileren maakt een systeem volgens de AI Act
**altijd** hoog risico, ongeacht andere uitzonderingen.

Concreet: dit onderdeel zou vermoedelijk onder Annex III punt 3(b) vallen
("leerresultaten evalueren, ook wanneer die worden gebruikt om het leerproces te
sturen"). Deadline voor de hoog-risico-verplichtingen: **2 december 2027**.

**Belangrijk om te beseffen:** het zonder AI bouwen (puur een handige plek om
notities en afvinkjes bij te houden, zonder dat een model iets signaleert of
adviseert) valt hier waarschijnlijk grotendeels buiten. De AI Act gaat over
geautomatiseerde beoordeling, niet over een goed gebouwd notitiesysteem. Dat is
een reële ontwerpkeuze: **eerst de bruikbare, niet-AI versie** (waar Momento's
zwakte zit), en AI-signalering pas als bewuste latere stap met de bijbehorende
compliance.

## 5. Openstaande vragen vóór er iets gebouwd wordt

1. Wat doen wij precies beter dan Momento? Het antwoord "afvinken in plaats van
   losse notities" is een begin, maar verdient uitwerking — het liefst door de
   eigenaar zelf te laten opschrijven waar hij in Momento vastloopt, scherm voor
   scherm. Dat is materiaal dat niemand anders heeft.
2. Beginnen we zonder AI (notities + afvinken + koppeling aan de weekplanning),
   of meteen mét signalering? Zie 4.2 — zonder AI is aanzienlijk eenvoudiger,
   juridisch én qua bouw.
3. Verwerkersovereenkomst: wat is er minimaal nodig, en kan de PCBO-pilot
   (december 2026) als eerste school dienen om dat traject te doorlopen?
4. Hoe verhoudt dit zich tot bestaande leerlingvolgsystemen (ParnaSys, ESIS)?
   Vullen we die aan of vervangen we ze? Aanvullen is realistischer en veiliger.

## 6. Waarom dit het methode-curatiewerk heeft gepauzeerd

De methode-afvinklijst (zie [`methodes-afvinklijst.md`](methodes-afvinklijst.md))
is bewust stilgelegd na één methode (Pluspunt). Redenering van de eigenaar,
onderschreven: een weekplanning die lesnummers doorplant maar waarin je niet kunt
noteren wie waar uitvalt, levert een leerkracht weinig op. De zorgcyclus is de
functie die de planning betekenis geeft; het doorplannen van methodes is
ondersteunend daaraan, niet andersom.

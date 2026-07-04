/* Avinka — leerlijnen per vak en leerjaar (SLO).

   Bron: SLO, Tussendoelen rekenen-wiskunde voor het primair onderwijs
   (Noteboom, Aartsen & Lit, 2017), richting streefniveau 1S — samengevat per
   leerjaar in vier domeinen (Getallen & bewerkingen, Verhoudingen, Meten &
   meetkunde, Verbanden). Per groep de belangrijkste beheersingsdoelen.

   Tools gebruiken dit om een gegenereerde les precies op het leerjaar te
   kalibreren (getalbereik, abstractieniveau, complexiteit). Zo levert
   "breuken vergelijken groep 6" iets anders op dan groep 8.

   Gebruik:  <script src="/avinka-leerlijnen.js"></script>
             var ll = window.avinkaLeerlijnen.voor(vak, groep);  // '' als onbekend

   Verder beschikbaar: .ideeen(vak,groep) · .werkvormen(lestype,groep) ·
   .verwerkingen(vak,groep) · .spellingMethode(aanvullingen, groep) ·
   .spellingWoorden(aanvullingen, groep) (herkent de spellingcategorie die de
   leerkracht noemt — ook in methode-jargon zoals "colawoord" — en geeft een
   eigen, methode-neutrale instructie + eigen, correcte woorden terug, of ''.
   Een methodenaam/categoriesysteem van een uitgever wordt niet gereproduceerd;
   het niveau per leerjaar loopt via de eigen SLO-spellingleerlijn).

   Uitbreiden: voeg vakken toe aan DATA (bijv. 'spelling', 'begrijpend-lezen'). */
(function () {
  "use strict";
  if (window.avinkaLeerlijnen) return;

  var REKENEN = {
    "3": "Getalbereik t/m 20 (telrij lezen/uitspreken t/m 100, verder- en terugtellen). Optellen, aftrekken en splitsen t/m 10 uit het hoofd; optellen en aftrekken t/m 20 (in context én formele sommen); eenvoudige vermenigvuldig- en deelsituaties t/m 20 informeel oplossen; getallen t/m 50 vergelijken, ordenen en op de getallenlijn plaatsen. Meten/meetkunde: hele uren op analoge en digitale klok, geld t/m €20, meetbegrippen (lengte/inhoud/gewicht), basisfiguren. Verbanden: eenvoudige beeld- en staafdiagrammen aflezen en maken.",
    "4": "Getalbereik t/m 100 (tellen in sprongen van 2, 5 en 10; structureren; vergelijken/ordenen; splitsen in tientallen en eenheden). Optellen/aftrekken t/m 20 uit het hoofd; optellen en aftrekken t/m 100 via rijgen en splitsen (met standaardprocedures); tafels van 1, 2, 3, 4, 5 en 10 uit het hoofd; vermenigvuldigen en delen t/m 100 met strategieën. Verhoudingen: begrip 'de helft' (van een geheel én van een hoeveelheid). Meten: meter/centimeter (1 m = 100 cm) en kilogram, geld t/m €100, klok hele/halve uren en kwartieren, kalender. Verbanden: tabel en beeld-/staafdiagram aflezen.",
    "5": "Getalbereik t/m 1000 (sprongen van 10 en 100; splitsen in H/T/E) én kommagetallen met 2 decimalen. Alle tafels t/m 10 en deeltafels vlot; optellen en aftrekken t/m 1000 (en kommagetallen) met standaardprocedures; vermenigvuldigen en delen t/m 1000 met strategieën. Verhoudingen: breukbegrippen (heel, half, kwart, halveren, verdubbelen, deel/geheel); eenvoudige verhoudingstabel. Meten: mm/cm/dm/m/km, omtrek en oppervlakte op roosterpapier, liter/ml, gram (1000 g = 1 kg), klok op de minuut en tijdsduur berekenen. Verbanden: tabel/diagram aflezen en ongeordende gegevens in een tabel zetten.",
    "6": "Getalbereik t/m 100.000 én kommagetallen met 2 decimalen. Optellen en aftrekken t/m 10.000 (en kommagetallen); vermenigvuldigen en delen t/m 10.000 met strategieën; gemiddelde berekenen. Verhoudingen: veelvoorkomende benoemde breuken vergelijken en ordenen, rekenen met breuken (aanvullen tot 1, deel van geheel berekenen), relatie tussen breuken en verhoudingen, verhoudingen met geld/tijd/maten. Meten: omtrek en oppervlakte van een rechthoek met formule (2×(l+b); l×b), m²/dm²/cm², inhoudsmaten herleiden, kg↔g, samengestelde grootheden (prijs per kg/l). Verbanden: cirkeldiagram en lijngrafiek aflezen en tekenen.",
    "7": "Getalbereik t/m ±1 miljoen én kommagetallen met 3 decimalen, afronden. Optellen en aftrekken t/m 100.000; vermenigvuldigen en delen t/m 100.000. Verhoudingen: rekenen met breuken (gelijknamige optellen/aftrekken, veelvoorkomende ongelijknamige vergelijken en het verschil bepalen, breuk als operator, in context een heel getal delen door een breuk); verhoudingsproblemen waarin de relatie niet direct zichtbaar is, schaal; rekenen met eenvoudige percentages (korting, nieuwe prijs); relaties tussen verhoudingen, breuken en procenten. Meten: standaardmaten lengte/oppervlakte/inhoud/gewicht met referentiematen, oppervlakte van driehoeken, inhoud van een balk (l×b×h), temperatuur onder 0, tijdsduur in uren/minuten/seconden. Verbanden: grafiektaal (assen, legenda, stijgen/dalen) en gegevens vergelijken.",
    "8": "Getalbereik t/m ±1 miljard én kommagetallen met 3 decimalen. Optellen, aftrekken, vermenigvuldigen en delen t/m 100.000 (ook met kommagetallen); volgorde van bewerkingen en de rol van haakjes. Verhoudingen: vlot rekenen met breuken (gelijknamige optellen/aftrekken, ongelijknamige vergelijken, breuk als operator, in context delen door een breuk); verhoudingsproblemen en schaal; rekenen met procenten (1%-regel, korting, oorspronkelijke prijs, winst/verlies); relaties tussen verhoudingen, breuken, procenten en kommagetallen uit het hoofd. Meten: het systeem van lengte-, oppervlakte-, inhouds- en gewichtsmaten doorzien, oppervlakte/inhoud van kubus en balk, schaal en vergroting, tijdsysteem inclusief tijdzones. Verbanden: gegevens aflezen, interpreteren en vergelijken, trends herkennen en conclusies trekken."
  };

  // ── Spelling ── (SLO-leerstoflijnen spelling/werkwoordspelling, ref. 1F/2F)
  var SPELLING = {
    "3": "Spelling: klankzuivere woorden (mkm: maan, vis, kat) schrijven zoals je ze hoort; eerste regels (plakletters bij melk/worm, woorden op -nk, sch-). Klank-tekenkoppeling staat centraal. Taal: zinsbesef en woordenschat uitbreiden.",
    "4": "Spelling: langere woorden met lastige klanken (eu, ng, aai/ooi/oei, de 'plaagletter' bij eer/oor/eur), meervoud en verkleinwoorden. Grammatica: het begrip 'werkwoord' (doe-woord) leren herkennen. Taal: woordenschat en eenvoudige zinsbouw.",
    "5": "Spelling: open en gesloten lettergrepen (verdubbelen/verlengen: bomen–bommen), hoofdletters, weetwoorden (ei/ij, au/ou); start (voorbereidende) werkwoordspelling: werkwoorden in een tekst herkennen. Grammatica: woordsoorten benoemen (begin).",
    "6": "Spelling: per les één categorie, gelijkvormigheid (hond–honden) en analogie (hij vindt). Werkwoordspelling tegenwoordige tijd (stam, stam+t: 'hij wordt'). Grammatica: persoonsvorm, onderwerp en gezegde herkennen; woordsoorten (zelfstandig naamwoord, werkwoord, lidwoord).",
    "7": "Spelling/werkwoordspelling uitgebreid: tegenwoordige én verleden tijd (zwak: stam+te/de, 't ex-kofschip) en voltooid deelwoord (d/t). Nieuwe categorieën: leenwoorden (Frans/Engels), 's bij bezit, -isch(e), x, trema, koppelteken. Grammatica: bijvoeglijk naamwoord, verder zinsdelen.",
    "8": "Spelling: herhaling en verdieping; werkwoordspelling in complexere zinnen (+t/+dt tegenwoordige tijd, +te/+de verleden tijd), klankvaste vs. klankveranderende werkwoorden. Extra regels: stoffelijke bijvoeglijke naamwoorden (wollen), tussen-n (pannenkoek), meervouden (perziken). Richting referentieniveau 1F/2F."
  };

  // ── Taal ── (mondelinge taalvaardigheid, woordenschat, taalbeschouwing).
  // Bron: SLO leerstoflijnen mondelinge taalvaardigheid + leerlijn begrippen
  // taalbeschouwing, woordenschatdidactiek (Viertakt van Verhallen),
  // referentieniveaus 1F/2F. NB: spelling/werkwoordspelling staat apart (SPELLING).
  var TAAL = {
    "3": "Mondelinge taal: actief meedoen aan kringgesprekken (op je beurt praten, luisteren naar een ander), een verhaal navertellen, korte vragen stellen en beantwoorden. Woordenschat: snelle uitbreiding van concrete woorden uit de leefwereld; nieuwe woorden koppelen aan bekende (woordweb, plaatjes) volgens de Viertakt (voordoen/uitleggen, inoefenen, controleren). Taalbeschouwing: de begrippen woord en zin; werkwoord (doe-woord) en zelfstandig naamwoord eerst herkennen; enkelvoud/meervoud.",
    "4": "Mondelinge taal: iets vertellen voor de groep (nieuws, een verhaal), gericht luisteren en de hoofdlijn navertellen, in tweetallen overleggen. Woordenschat: woorden buiten de directe leefwereld leren, betekenis uit context/plaatjes afleiden, woorden ordenen in categorieën (woordcluster/woordkast). Taalbeschouwing: werkwoord en zelfstandig naamwoord benoemen, lidwoord, verkleinwoord, enkelvoud/meervoud.",
    "5": "Mondelinge taal: een gesprek met een doel voeren en op elkaar reageren, een korte spreekbeurt of presentatie met een hulpmiddel, gericht luisteren en vragen stellen. Woordenschat: woordbetekenissen verdiepen, betekenisrelaties leggen (synoniem, tegenstelling, woordfamilie) en figuurlijk taalgebruik gaan herkennen; strategieën om de betekenis van onbekende woorden af te leiden. Taalbeschouwing: woordsoorten benoemen (zelfstandig naamwoord, werkwoord, lidwoord, bijvoeglijk naamwoord) en het onderwerp en de persoonsvorm in een zin herkennen (start redekundig ontleden).",
    "6": "Mondelinge taal: overleggen en discussiëren in een groepje, een spreekbeurt/presentatie met opbouw (inleiding-kern-slot) en hulpmiddel houden, luisteren naar een informatieve tekst en die samenvatten. Woordenschat: abstractere woorden en schooltaalwoorden, voortbouwend op bekende woorden; minder frequente woorden, uitdrukkingen en gezegden, figuurlijk taalgebruik. Taalbeschouwing: meer woordsoorten (voornaamwoord, voorzetsel, voegwoord, telwoord), onderwerp/persoonsvorm/gezegde, werkwoordstijden benoemen.",
    "7": "Mondelinge taal: een discussie voeren met argumenten, een presentatie of kort betoog voor publiek houden, kritisch luisteren en hoofd- van bijzaken onderscheiden, je mening onderbouwen. Woordenschat: school- en vaktaalwoorden, woordvorming (afleiding en samenstelling), nuanceverschillen tussen woorden, figuurlijk taalgebruik. Taalbeschouwing: zinsdelen lijdend voorwerp en meewerkend voorwerp, hoofdzin/bijzin, woordsoorten verdiepen (vervoeging, afleiding).",
    "8": "Mondelinge taal: een goed opgebouwde presentatie of betoog houden, gesprekstechnieken gebruiken en een standpunt verdedigen, gericht en kritisch luisteren, rekening houdend met doel en publiek (richting referentieniveau 1F, streef 2F). Woordenschat: brede school- en vaktaalwoordenschat (richting ±15.000 woorden receptief), abstracte begrippen, figuurlijk taalgebruik en nuance, zelfstandig woordleerstrategieën. Taalbeschouwing: taalkundig ontleden (alle woordsoorten, vervoeging, afleiding) en redekundig ontleden (onderwerp, persoonsvorm, gezegde, lijdend en meewerkend voorwerp); reflecteren op taalgebruik."
  };
  var TECHNISCH_LEZEN = {
    "3": "Aanvankelijk technisch lezen: klankbewustzijn en het ontsleutelen van klankzuivere woorden (km/mk/mkm) zonder spellend lezen; korte teksten. Richtniveau ± AVI Start → M3 → E3.",
    "4": "Vlot en accuraat woorden lezen met complexere structuren en meerlettergrepige woorden; leestempo opbouwen. Richtniveau ± AVI M4 → E4.",
    "5": "Vloeiend lezen met aandacht voor tempo en nauwkeurigheid; woorden met afwijkende spellingpatronen en leenwoorden. Richtniveau ± AVI M5 → E5.",
    "6": "Vlot en vloeiend lezen van langere teksten, met intonatie/expressie. Richtniveau ± AVI M6 → E6.",
    "7": "Vlot, vloeiend en expressief lezen van uiteenlopende tekstsoorten. Richtniveau ± AVI M7 → E7.",
    "8": "Vlot en vloeiend lezen op eindniveau (AVI-Plus); tempo en nauwkeurigheid passend bij niveau 1F/2F; voorlezen met expressie."
  };
  var BEGRIJPEND_LEZEN = {
    "3": "Begin begrijpend lezen/luisteren: verbanden tussen woorden en zinnen; voorspellen op titel en plaatjes; voorkennis activeren. Vereist voldoende technisch leesniveau.",
    "4": "Eenvoudige strategieën: het onderwerp achterhalen (titel/illustraties), verwijswoorden koppelen ('ze' → de kinderen), de betekenis van moeilijke woorden uit de context afleiden; korte teksten.",
    "5": "Strategieën uitbreiden: vragen stellen tijdens het lezen, in eigen woorden samenvatten, verbanden tussen zinnen leggen; verhalende én informatieve teksten.",
    "6": "Hoofd- en bijzaken onderscheiden, signaalwoorden gebruiken, tekststructuur (inleiding–kern–slot) herkennen, informatie ordenen.",
    "7": "Hoofdgedachte weergeven, relaties tussen tekstdelen leggen, feiten en meningen onderscheiden; richting referentieniveau 1F.",
    "8": "Eindniveau: 1F (letterlijke betekenis begrijpen, gericht globaal/selectief lezen) en streefniveau 2F (hoofdgedachte, hoofd- vs. bijzaken, beeldspraak herkennen, teksten beoordelen en beknopt samenvatten)."
  };
  var SCHRIJVEN = {
    "3": "Korte woorden en zinnen klankzuiver opschrijven; een eenvoudige boodschap (zin met hoofdletter en punt).",
    "4": "Een korte tekst van enkele zinnen over een vertrouwd onderwerp; hoofdletters en punten; begin van ordening.",
    "5": "Een korte samenhangende tekst (verhaaltje/berichtje) met begin–midden–eind; zinnen variëren en spelling toepassen.",
    "6": "Teksten met alinea's en een duidelijke opbouw; verschillende tekstsoorten (verhaal, brief, verslag); aandacht voor doel en publiek.",
    "7": "Langere teksten plannen, schrijven en reviseren; samenhang met signaalwoorden; spelling en interpunctie verzorgen (richting 1F).",
    "8": "Verzorgde teksten voor verschillende doelen en publiek; duidelijke structuur (inleiding–kern–slot) en revisie; streefniveau 1F/2F voor schrijfvaardigheid."
  };

  // ── Engels ── (kerndoelen 13-16, ERK; streefniveau A1 eind groep 8)
  var ENGELS = {
    "3": "Speels kennismaken met Engels: luisteren en naspreken, woordenschat rond vertrouwde thema's (kleuren, getallen, dieren, familie) via liedjes, spel en TPR. Mondeling; nog niet lezen/schrijven. (formeel start meestal groep 7; eerder bij vvto)",
    "4": "Luisteren en durven spreken uitbreiden; korte standaardzinnen en woordenschat over vertrouwde onderwerpen, veel herhaling via spel en liedjes. Vooral mondeling.",
    "5": "Luisteren en spreken in korte dialoogjes; woordenschat en vaste zinnen uitbreiden; eenvoudige woorden lezen. (vervroegd Eibo/vvto)",
    "6": "Korte gesprekjes voeren over vertrouwde onderwerpen; eenvoudige teksten lezen; luistervaardigheid verder uitbouwen.",
    "7": "Formeel Eibo: luisteren, spreken, lezen en begin van schrijven; eenvoudige teksten en dialogen over vertrouwde onderwerpen; richting ERK A1.",
    "8": "Alle vier de vaardigheden; eenvoudige teksten begrijpen en korte berichtjes schrijven. Eindniveau ERK A1: vertrouwde woorden en basiszinnen over jezelf, familie en directe omgeving herkennen bij langzaam en duidelijk spreken."
  };

  // ── Zaakvakken (oriëntatie op jezelf en de wereld) ── SLO TULE/inhoudslijnen,
  //    globaler dan rekenen/taal: per bouw (onder 3-4, midden 5-6, boven 7-8).
  var AARDRIJKSKUNDE = {
    "3": "Eigen omgeving verkennen: school, huis, buurt; een eenvoudige plattegrond; begrippen voor/achter, links/rechts, dichtbij/veraf. Concreet en dichtbij.",
    "4": "De eigen woonplaats en omgeving; een eenvoudige kaart lezen (legenda, windrichtingen N/O/Z/W); landschap dichtbij.",
    "5": "Nederland: provincies en basistopografie, landschapstypen en water; kaart en atlas leren gebruiken.",
    "6": "Nederland verdiepen en Europa: topografie van Europa, klimaten en landschappen; kaartvaardigheid uitbreiden.",
    "7": "Europa en de wereld: werelddelen en topografie, klimaatzones, bevolking; atlasvaardigheid.",
    "8": "De wereld: wereldtopografie en mondiale thema's (klimaat, grondstoffen, bevolking), een eigentijds geografisch wereldbeeld; vlot met kaart en atlas (kerndoel 50)."
  };
  var GESCHIEDENIS = {
    "3": "Tijdsbesef dichtbij: vroeger/nu, dag-week-jaar, het eigen leven en de familie; de volgorde van gebeurtenissen.",
    "4": "Vroeger en nu vergelijken (wonen, school, spullen); een eenvoudige tijdlijn; generaties.",
    "5": "Eerste tijdvakken/canon: van jagers en boeren naar Grieken en Romeinen; chronologie op een tijdbalk.",
    "6": "Middeleeuwen (ridders, kastelen, steden) en de ontdekkingsreizen; eenvoudige bronnen gebruiken.",
    "7": "Gouden Eeuw, regenten en vorsten, slavernij; oorzaak en gevolg en standplaatsgebondenheid.",
    "8": "Moderne tijd: industrialisatie, wereldoorlogen, na 1945; de tijdvakken overzien en de canon van Nederland op de tijdlijn plaatsen."
  };
  var NATUUR_TECHNIEK = {
    "3": "Dichtbij waarnemen: planten, dieren en het eigen lichaam (zintuigen), seizoenen; een eenvoudig onderzoekje (kijken, vergelijken).",
    "4": "Planten en dieren in de omgeving (groei, leefomgeving), weer en seizoenen; bouwen/ontwerpen met eenvoudig materiaal.",
    "5": "Het menselijk lichaam (beweging, spijsvertering) en levenscycli; natuurverschijnselen verkennen (licht, geluid); een proefje uitvoeren.",
    "6": "Ecosystemen en voedselketens, materialen en hun eigenschappen, magnetisme en elektriciteit (stroomkring); techniek: ontwerpen, maken, evalueren (kerndoel 45).",
    "7": "Krachten, energie, licht en geluid verdiepen; de aarde en de zon (seizoenen, dag en nacht, kerndoel 46); onderzoek opzetten met variabelen.",
    "8": "Samenhangende systemen (lichaam, natuur, milieu, duurzaamheid) en technische processen; zelfstandig onderzoeken en ontwerpen, en resultaten verklaren."
  };
  var WERELDORIENTATIE = {
    "3": "Verkennen van de wereld dichtbij: de eigen omgeving (ruimte), vroeger/nu (tijd), planten/dieren/lichaam en seizoenen (natuur). Concreet en waarneembaar.",
    "4": "Eigen woonplaats en een eenvoudige kaart (ruimte); vroeger-nu vergelijken (tijd); planten/dieren en weer, een eenvoudig onderzoekje (natuur).",
    "5": "Nederland: topografie en landschap (ruimte); eerste tijdvakken op een tijdbalk (tijd); lichaam en natuurverschijnselen, een proefje (natuur).",
    "6": "Nederland en Europa (ruimte); middeleeuwen en ontdekkingsreizen (tijd); ecosystemen, magnetisme/elektriciteit en techniek ontwerpen (natuur).",
    "7": "Europa en de wereld (ruimte); Gouden Eeuw e.v. met oorzaak en gevolg (tijd); krachten/energie en aarde-zon, onderzoek opzetten (natuur).",
    "8": "De wereld en mondiale thema's, een eigentijds wereldbeeld (ruimte); moderne tijd en de canon op de tijdlijn (tijd); systemen, duurzaamheid en zelfstandig onderzoeken/ontwerpen (natuur)."
  };

  var DATA = {
    rekenen: REKENEN,
    spelling: SPELLING,
    taal: TAAL,
    "technisch-lezen": TECHNISCH_LEZEN,
    "begrijpend-lezen": BEGRIJPEND_LEZEN,
    schrijven: SCHRIJVEN,
    engels: ENGELS,
    aardrijkskunde: AARDRIJKSKUNDE,
    geschiedenis: GESCHIEDENIS,
    "natuur-techniek": NATUUR_TECHNIEK,
    wereldorientatie: WERELDORIENTATIE
  };

  function vakKey(vak) {
    var v = String(vak || "").toLowerCase();
    if (/reken/.test(v)) return "rekenen";
    if (/begrijpend/.test(v)) return "begrijpend-lezen";
    if (/technisch/.test(v)) return "technisch-lezen";
    if (/schrijven|stellen/.test(v)) return "schrijven";
    if (/spelling/.test(v)) return "spelling";
    if (/taal/.test(v)) return "taal";
    if (/engels/.test(v)) return "engels";
    if (/aardrijk/.test(v)) return "aardrijkskunde";
    if (/geschied/.test(v)) return "geschiedenis";
    if (/natuur|techniek/.test(v)) return "natuur-techniek";
    if (/wereld|oriënt|orient/.test(v)) return "wereldorientatie";
    return null;
  }
  function groepNr(groep) {
    var m = String(groep || "").match(/[3-8]/);
    return m ? m[0] : null; // groep 1/2 nog geen rekenen-detail
  }

  // ── Ideeënbank (geen leerlijn, maar een palet aan activiteiten) ──
  // Geclusterd per bouw. De AI kiest hieruit, varieert en werkt de les uit —
  // of volgt het eigen thema van de leerkracht. Bron o.a. Crea in een Notendop
  // (techniek-leerlijn beeldende vorming), SLO kerndoel 54, diverse
  // knutsel-/handvaardigheidsbronnen. Alleen materiaal dat op school aanwezig is.
  //
  // Twee soorten:
  //   • per bouw een `ideeen`-lijst met concrete, niveau-passende uitwerkingen
  //   • één `onderwerpen`-pool die bouw-overstijgend is: dezelfde onderwerpen
  //     werken in elke groep; alleen de TECHNIEK schaalt mee (per bouw via
  //     `technieken`). Zo kan "zelfportret" zowel kleuters als groep 8, maar in
  //     8 met een moeilijker techniek en meer detail.
  var IDEEEN_CREATIEF = {
    onderwerpen: [
      "een huisdier of lievelingsdier", "een wild dier (leeuw, olifant, beer)", "een vogel", "een vis of zeedier", "een insect (vlinder, kever, bij)", "een fantasiedier of -wezen", "een draak of monster", "een zelfportret", "een portret van een klasgenoot of familielid", "je eigen droomhuis of droomkamer", "een kasteel, toren of brug", "een stad of straat", "een landschap (bos, strand, berg)", "onder water / de zee", "de ruimte (planeten, raket, astronaut)", "de jungle of het regenwoud", "de dierentuin of de boerderij", "het circus", "een voertuig (auto, trein, boot, vliegtuig)", "een robot of machine", "de herfst", "de winter en sneeuw", "de lente", "de zomer", "een boom door de seizoenen", "het weer (regenboog, onweer, regen)", "de nacht: sterren en maan", "bloemen of een tuin", "eten (fruit, taart, ijsje)", "een feest (verjaardag, kerst, pasen)", "carnaval of een masker", "een sprookje of verhaal", "vuurwerk / oud en nieuw", "een eiland of schateiland", "je naam of initialen", "een patroon of mandala", "symmetrie (een spiegelbeeld)", "emoties verbeelden (blij, boos, bang)", "je favoriete sport of hobby", "een dromenvanger of wens", "kleuren en kleurmenging", "een gebouw uit een andere cultuur"
    ],
    "1-2": {
      technieken: "vingerverven, stempelen (kurk/groente/hand), scheuren en plakken, kleien (rollen/platdrukken), prikken, knippen oefenen, kralen rijgen, weven met brede stroken, verf blazen met een rietje, frottage (wrijven), eenvoudig vouwen",
      ideeen: [
        "handafdruk-dieren (vlinder, haan, vis, krokodil)", "herfstcollage met geplukte blaadjes en takjes", "stempelboom met kurk of vingers in seizoenskleuren", "kleifiguurtje rollen en platdrukken (slak, slang, egel)", "vingerverf-regenboog", "papieren slinger van gescheurde stroken", "zelfportret van uitgeknipte vormen", "kralenketting of -armband rijgen", "weven met brede papierstroken (placemat)", "verf blazen met een rietje (paardenbloem, vuurwerk)", "scheurcollage van gekleurd papier (appel, vis)", "een vorm uitprikken en ophangen", "afdrukken van groente of fruit met verf", "masker van een papieren bord", "wattenbollen-schaap of -wolk plakken", "egel van een dennenappel en klei", "symmetrische vlinder (verf, vouwen en openklappen)", "zonnetje met handafdrukken als stralen", "sneeuwpop van watten of propjes papier", "rups van een geverfde eierdoos", "spin van een wc-rol met pootjes", "bloem van een handafdruk met steel", "vis met schubben van stempels", "boom met arm als stam en vingers als blad", "pompoen scheuren en plakken", "kerstboom van groene driehoeken stapelen", "paasei versieren met stippen en stempels", "lieveheersbeestje en bij van vingerafdrukken", "regen-collage met watten en blauwe strepen", "een eigen monster van vormen en wiebeloogjes", "vis met glimmende schubben van folie of stof", "rups van vingerafdrukken op een rij", "boom met proppen crêpepapier als blad", "paddenstoel met witte stippen stempelen", "regenboog van handafdrukken", "aquarium in een schoenendoos", "bloemenweide van vingerafdrukken", "leeuw met manen van wol of papierreepjes", "auto van een geverfd doosje", "appelboom met rode vingerafdrukken", "olifant van een grijze handafdruk", "krokodil van een geverfde eierdoos", "gras of veren stempelen met een vork", "pauw met een hand als staart", "vlieger van papier met linten", "ijsje van scheurpapier plakken", "huisje van geplakte vormen (vierkant + driehoek)", "uil van proppen papier en grote ogen", "rups of slang van geverfde flessendoppen", "kerstkrans van groene handafdrukken"
      ]
    },
    "3-4": {
      technieken: "tekenen in stappen, waterverf en wasco, stempelen en sjabloon, collage, 3D van wc-rol of karton, eenvoudig papier-maché, weven, klei met details, vlechten, krastekening",
      ideeen: [
        "dier van een wc-rol (uil, vos, pinguïn)", "gevouwen vogel of kip van een papieren bord", "stippelschilderij met wattenstaafjes (pointillisme)", "seizoensboom in meerdere technieken", "kartonnen masker versieren", "kleitegel met indrukken of klei-mozaïek", "huisdier tekenen volgens stappen", "vlieger of windmolentje", "zelfportret met wasco en ecoline eroverheen", "lantaarn van papier (knippen en rollen)", "huisje van lolliestokjes", "onderzetter weven op een kartonnen weefraampje", "aardappelstempel maken en afdrukken", "fantasiedier-collage van tijdschriftknipsels", "raamhanger van zijdepapier (lichtdoorlatend)", "3D-bloem van een eierdoos", "krastekening (kleur onder zwarte wax wegkrassen)", "dier van pompons en vilt", "herfstmandala met natuurlijk materiaal", "sneeuwlandschap met zout en lijm", "boekenlegger met vlechtwerk", "een eigen robot van kosteloos materiaal", "paashaas of kuiken van een papieren bord", "kerstster vouwen", "lieveheersbeestje van een geverfde steen", "landschap met horizon en kleurverloop", "een dier symmetrisch verven (spiegelen)", "handpop van vilt of papier", "naam in versierde letters", "stripje van een paar vakjes tekenen", "vlinder met symmetrische verfdruk en details", "onderwater-tafereel met visjes en zeewier", "ridder of prinses van een wc-rol", "windsok van papier met crêpe-slierten", "sneeuwuil met geplukte papierveren", "kleurenwiel maken (primaire kleuren mengen)", "een dorpje van melkpakken", "egel met een mantel van papier-stekels", "vuurtoren met strepen", "regenboogvis met glinsterende schubben", "een eigen postzegel ontwerpen", "herfstkrans van blaadjes", "kerstkaart met stempel of vingerafdruk", "carnavalsmasker met veren en glitter", "stripfiguur opbouwen uit cirkels en driehoeken", "schaduwpop voor een schimmenspel", "verjaardagskroon versieren", "naam in bubbelletters inkleuren", "planeet met sponsverf", "vogelhuisje van karton"
      ]
    },
    "5-6": {
      technieken: "kleurmenging (primair naar secundair), waterverf met ecoline en wasco, stempel- en sjabloondruk, weven met wol, eenvoudig borduren op stramien, maquette of diorama, klei met houding en detail, mozaïek, frottage, perspectief (voor-/midden-/achtergrond)",
      ideeen: [
        "grachtenhuisjes met lichtdoorlatend papier (past bij Gouden Eeuw)", "diorama of maquette van een biotoop of landschap", "zelfportret met zelfgemengde huidskleuren", "eierschaalmozaïek in een kleitegel", "fantasiedier in 3D van kosteloos materiaal", "optische patronen, zentangle of op-art", "weven met wol op een groter weefraam", "herhaalpatroon met stempel- of sjabloondruk", "planeet of maan met sponstechniek", "duimpotje of kommetje van klei", "landschap in perspectief (voor-, midden-, achtergrond)", "zonsondergang met zwarte silhouetten", "mozaïek van papiersnippers (dier of logo)", "eenvoudig motief borduren op stramien", "pop-upkaart maken", "stad of gebouw van karton (3D-constructie)", "herfstboom met blaadjes-frottage", "dromenvanger", "portret in de stijl van Picasso (kubisme)", "schilderij met warme en koude kleuren", "een eigen stripverhaal in vakjes", "landart-mandala van natuurlijk materiaal", "masker van papier-maché", "gedetailleerd symmetrisch insect", "een eigen logo of wapen ontwerpen", "textielcollage van stofresten", "3D-seizoensdecoratie of kerststukje", "schaduwtekening (object naschetsen)", "sjabloondruk met spons", "plattegrond of doolhof tekenen en inkleuren", "stadssilhouet bij zonsondergang", "een eigen flipperkast of doolhof van karton", "stilleven met fruit natekenen", "kleurverloop schilderen (van licht naar donker)", "totempaal van bekers", "een postzegelvel met thema ontwerpen", "schaal van papier-maché over een ballon", "een dier in cartoonstijl ontwerpen", "winterlandschap met wit op donker papier", "tegelpatroon ontwerpen (symmetrie en herhaling)", "een eigen vlag of wapenschild", "een 3D-letter of -cijfer van karton", "boomhut of droomhuis ontwerpen", "spinnenweb van draad en lijm", "lampion of lichtje (lichtdoorlatend)", "een eigen fantasiewezen met krachten ontwerpen", "warme-en-koude-kleurenschilderij", "silhouet tegen een gekleurde lucht", "diorama van een historische scène", "een eigen kleurrijke insectenverzameling"
      ]
    },
    "7-8": {
      technieken: "perspectieftekenen (één verdwijnpunt), licht en schaduw (arceren), gemengde technieken, 3D-constructie van karton, druktechniek (foam-/linodruk), textiel, klei met beweging, handlettering/typografie, het volledige ontwerpproces (ontwerpen, maken, reflecteren)",
      ideeen: [
        "fantasie-eiland als ruimtelijke collage (textiel/papier/karton)", "3D-voetbalstadion van karton", "werk in de stijl van een kunstenaar (Mondriaan, Kandinsky, Escher, Van Gogh)", "explosion book bij een thema", "perspectieftekening van een straat (één verdwijnpunt)", "klei-figuur in beweging (houding van romp en ledematen)", "verjaardagskalender in vier technieken (potlood, viltstift, waterverf, wasco-ecoline)", "3D-insect of insectenhotel", "zelfportret met licht en schaduw", "foam- of linodruk (stempel snijden en afdrukken)", "maquette van een droomkamer op schaal", "onmogelijke figuur of optische illusie (Escher)", "surrealistische collage met onverwachte combinaties", "handlettering van een quote", "masker uit een andere cultuur (link met WO)", "stop-motion figuren van klei", "mandala met passer en symmetrie", "abstract schilderij met emotie of muziek als thema", "portret van een klasgenoot (verhoudingen van het gezicht)", "een logo of merk met huisstijl ontwerpen", "eigen wandkleed of vlag ontwerpen (textiel)", "dot-art of zentangle op groot formaat", "landschap met luchtperspectief (kleur vervaagt)", "bewegend mechaniek of pop-up in karton", "brug bouwen die gewicht houdt (techniek)", "silhouetportret in profiel knippen", "strippagina met perspectief en kaders", "stilleven natekenen vanuit waarneming", "mozaïek op een tegel of onderzetter", "een eigen bordspel ontwerpen en illustreren", "isometrische tekening van een gebouw", "een eigen game-personage of avatar ontwerpen", "anamorfose of 3D-illusie op papier", "typografie van je naam ontwerpen", "wereldkaart of plattegrond stileren", "een eigen boek- of albumomslag ontwerpen", "expressief zelfportret met emotie", "papier-maché masker met karakter", "draadsculptuur (figuur uit ijzerdraad)", "schaalmodel van een brug of gebouw", "negatieve ruimte tekenen (de ruimte eromheen)", "abstracte compositie naar muziek", "kleurenstudie: één onderwerp in vier kleurstemmingen", "reliëf in klei (laag en hoog)", "een eigen verpakking ontwerpen (3D-net uitvouwen)", "graffiti-naam in wildstyle (op papier)", "een poster met blikvanger en typografie voor een goed doel", "stempel uit gum snijden en een patroon afdrukken", "luchtperspectief-landschap met vervagende lagen", "schaduwspel: een compositie van licht en donker"
      ]
    }
  };
  var IDEEEN = { creatief: IDEEEN_CREATIEF };

  // ── Werkvorm-base (per lestype, niet per vak) ──
  // Vak-onafhankelijke werkvorm-templates: de AI plugt het leerdoel erin.
  // Eén estafette of loopspel werkt voor rekenen, spelling, topografie… —
  // daarom keyen we op lestype (bewegend / buiten / coöperatief), niet op vak.
  // Veel werkvormen, weinig materiaal. Bron: bewegend-leren-, buitenonderwijs-
  // en coöperatief-leren-didactiek (o.a. Kagan-structuren, Beweegwijs, IVN).
  var WERKVORMEN = {
    bewegend: {
      kern: "BEWEGEND LEREN: de leerlingen bereiken het lesdoel terwijl ze bewegen (staan, springen, lopen, hinkelen, gebaren); de beweging is verwéven met de leerstof, geen losse energizer. Het werkt het sterkst voor automatiseren, herhalen en inoefenen. Kies werkvormen met weinig materiaal en houd het veilig en ordelijk (duidelijk start-/stopsignaal, vaste opstelling, heldere afspraken).",
      lijst: [
        "Estafette: in groepjes; één leerling rent naar een opdracht, lost die op, rent terug en tikt de volgende af (sommen, woorden, feiten)",
        "Zweeds loopspel: opdrachtkaarten hangen verspreid in de zaal/gang; per groepje rent steeds één leerling naar een kaart, onthoudt of lost op, en geeft het door",
        "Loopdictee: de tekst/woorden hangen aan de muur; leerlingen lopen heen, onthouden een stukje en schrijven het bij hun tafel op",
        "Tafeljoggen: op de plaats joggen en bij elk veelvoud van de tafel een sprong of klap maken",
        "Hinkelbaan met antwoorden: hinkel naar het juiste vak (uitkomst, klank, woordsoort)",
        "Waslijn-volgorde: kaarten in de juiste volgorde aan een lijn hangen (getallen, gebeurtenissen op een tijdlijn, stappen van een proces)",
        "Levende getallenlijn/tijdlijn: leerlingen met een kaart gaan zelf op de juiste plek in de rij staan",
        "Vier hoeken: elke hoek is een antwoordoptie; bij elke vraag rennen leerlingen naar de juiste hoek",
        "Ren-je-rot: A/B/C/D-zones bij meerkeuzevragen; rennen naar het antwoord",
        "Springen op de getallenlijn: vooruit springen bij plus, achteruit bij min (met hoepels of krijtstrepen)",
        "Bewegend memory: kaartjes liggen verspreid; al rennend paren zoeken (som-uitkomst, woord-betekenis)",
        "Dobbelloop: gooi de dobbelsteen, doe dat aantal bewegingen en beantwoord dan een vraag",
        "Pittenzak-mik: gooi naar antwoordvakken op de grond en reken/lees met wat je raakt",
        "Kringbal: bal overgooien; wie vangt geeft een antwoord of stelt de volgende vraag",
        "Touwspringen met tafels: bij elke sprong het volgende veelvoud opzeggen",
        "Vak-twister: juiste hand/voet op het juiste antwoord op een mat met vakken",
        "Standbeelden (freeze): bewegen bij 'goed', stilstaan bij 'fout' (of omgekeerd)",
        "Lichaamsletters/-cijfers: met je lijf een letter, cijfer of vorm maken (alleen of in duo)",
        "Klap- en stampritmes: tafels of lettergrepen ritmisch klappen en stampen",
        "Bewegend bingo: ren naar het hokje op de grond dat bij de vraag past",
        "Estafette-puzzel: per ronde haalt een loper één puzzelstuk/letterkaart op; samen leggen ze het woord of de som",
        "Hoepelparcours: van hoepel naar hoepel springen, in elke hoepel een opdracht",
        "Levend ganzenbord: een bordspel op de vloer met krijt; vooruit bij een goed antwoord",
        "Eens/oneens-muur: ren naar de kant die jouw antwoord/stelling is en licht toe",
        "Beweegcircuit met stations: bij elk station een korte beweging + een leeropdracht",
        "Sommen-tikkertje: de tikker stelt een vraag; goed = vrij, fout = even bevroren",
        "Pylonenslalom: slalom langs pylonen, bij elke pylon een vraag of opdracht",
        "Trefbal-met-vragen: ben je af, dan een vraag beantwoorden om weer mee te doen",
        "Simon says met leerstof: alleen uitvoeren als het klopt ('Simon says: noem een meervoud')",
        "Rollende dobbelsteen: gooi een grote schuimdobbelsteen door de kring; wie hem stopt, antwoordt",
        "Galgje/level-up: bij elk goed antwoord een trede/level omhoog (springen, op de tenen)",
        "Springtouw-spelling: per letter een sprong; samen het woord spellen",
        "Estafette-bordwerk: in teams om de beurt naar het bord rennen en het woordweb/de som aanvullen",
        "Beweegkaartjes tussen instructieblokken: korte beweegopdracht gekoppeld aan de stof",
        "Hink-stap-sprong over antwoorden op de grond naar de goede uitkomst",
        "Touwtrek-quiz: het team wint terrein bij elk goed antwoord",
        "Sorteerdans: beweeg naar de zone die bij de categorie hoort (klinker/medeklinker, even/oneven)",
        "Stoelendans met opdrachten: bij stoppen van de muziek de opdracht op je stoel doen",
        "Mik-en-reken: gooi een bal/zak naar genummerde vakken en reken met de score",
        "Yoga-/houdingenketen: een houding per stap van een proces of verhaal",
        "Levend staafdiagram: leerlingen vormen rijen; samen de data aflezen en vergelijken",
        "Reuzendobbelsteen-verhaal: gooi en bouw samen rennend een verhaal of som op",
        "Vraag-en-vang: gooi de bal en stel een vraag; de vanger antwoordt en gooit door",
        "Speurroute door de gang: pijlen en posten met telkens een opdracht onderweg",
        "Energizer-koppeling: een bekende beweegpauze met de leerstof erin verweven"
      ]
    },
    buiten: {
      kern: "BUITENLES op het schoolplein of in de directe buurt: benut de ruimte, de natuur en het weer. Geef benodigdheden, een duidelijk verzamelsignaal (fluit/lied), afspraken vooraf en een werkvorm die organisatorisch haalbaar is voor één leerkracht.",
      lijst: [
        "Stoepkrijt-opdrachten: sommen, woorden of vormen op de tegels maken en oplossen",
        "Krijt-getallenlijn op de stoep: op springen, vooruit/terug, sprongen van 10",
        "Speurtocht met kaartjes/QR rond de school: per post een opgave",
        "Zoek-en-vind: zoek iets dat rond/ruw/groen is, of dat bij het thema past, en leg uit waarom",
        "Meten op het plein: omtrek of lengte meten met stappen, touw of een rolmaat",
        "Hinkelbaan met krijt tekenen en gebruiken (antwoorden in de vakken)",
        "Stratenzoektocht: huisnummers even/oneven, tellen, optellen onderweg",
        "Natuur-bingo: vind een blad, steen, veer, paddenstoel… en kruis af",
        "Land-art/mandala van natuurlijk materiaal (samen een patroon leggen)",
        "Stoeptegel-tafels: van tegel naar tegel springen op het ritme van de tafel",
        "Estafette op het plein: opdracht aan de overkant ophalen, terugrennen, aftikken",
        "Schaduw meten en tekenen: schaduwen omtrekken, vergelijken, koppelen aan de zon/tijd",
        "Zintuigenkaart buiten: wat hoor/ruik/voel je? noteren en bespreken",
        "Sorteren van gevonden voorwerpen (groot/klein, soort, kleur)",
        "Omgeving turven: langsrijdend verkeer, vogels of kleuren tellen en in een tabel zetten",
        "Plattegrond van het plein tekenen (vogelvlucht, legenda)",
        "Kompas-/windrichtingenspel: ren naar het noorden, wijs het oosten aan",
        "Krijt-woordveld: woorden of een woordweb op de tegels schrijven, al rennend aanvullen",
        "Rekenen met afstanden: hoeveel stappen tot de boom? schat eerst, meet daarna",
        "Determineren: bomen, planten of vogels zoeken en op naam brengen met een zoekkaart",
        "Vragenrace langs posten: per post op het plein een opgave, samen het rondje af",
        "Krijt-doolhof tekenen en oplossen",
        "Touwfiguren: meetkundige vormen of een tijdlijn leggen met touw",
        "Schatkaart maken en die van een ander groepje volgen",
        "Tellen in de natuur: bladeren, stenen, insecten; schatten en natellen",
        "Bewegingsparcours met leeropdrachten bij elk toestel/punt",
        "Buiten-quiz: eens/oneens aan weerszijden van het plein, rennen en toelichten",
        "Stoepkrijt-tijdlijn: gebeurtenissen op volgorde langslopen",
        "Zwerfafval-onderzoek: verzamelen, sorteren en bespreken (natuur/burgerschap)",
        "Weer meten: temperatuur, wind of regen meten en noteren over de dagen",
        "Bodem/plant onderzoeken met een loep; tekenen wat je ziet",
        "Klanken/lettergrepen springen op krijtvakken (klap of spring per stukje)",
        "Estafette-spelling: letterkaarten verspreid op het plein, samen woorden bouwen",
        "Levend staafdiagram buiten: in rijen gaan staan als data en aflezen",
        "Buiten-memory met grote kaarten op de tegels",
        "Geocaching-light: aanwijzingen of simpele coördinaten naar een 'schat'",
        "Vormen zoeken in de omgeving: rechthoeken, cirkels, symmetrie fotograferen/tekenen",
        "Ren-en-onthoud: kaart aan de overkant, ren ernaartoe, onthoud en kom terug",
        "Buitenpodium: in groepjes iets uitbeelden, presenteren of naspelen",
        "Schaduwloze schatting: lengtes/hoogtes schatten en daarna controleren"
      ]
    },
    cooperatief: {
      kern: "COÖPERATIEF LEREN: leerlingen leren mét en ván elkaar in duo's of groepjes via heldere structuren. Zorg voor positieve wederzijdse afhankelijkheid (ze hebben elkaar nodig) én individuele aanspreekbaarheid (ieder levert zichtbaar een bijdrage).",
      lijst: [
        "Denken-delen-uitwisselen: eerst zelf nadenken, dan met je maatje delen, dan klassikaal",
        "Genummerde-hoofden-samen: groepje overlegt, een willekeurig nummer antwoordt voor het groepje",
        "Tweetalcoach: de één maakt de opgave hardop, de ander coacht en checkt; dan wisselen",
        "Placemat: ieder schrijft eerst in zijn eigen vak, daarna komt de gezamenlijke kern in het midden",
        "Binnen-buitenkring: twee kringen tegenover elkaar wisselen kort uit en schuiven door",
        "Mix-tweetal-uitwisseling: door de klas lopen, bij het signaal een partner zoeken en uitwisselen",
        "Experts/legpuzzel (jigsaw): elk groepje wordt expert op een deel en leert het de anderen",
        "Wandel-wissel-uit (Quiz-Quiz-Trade): met een kaart rondlopen, elkaar overhoren en kaarten ruilen",
        "Om-de-beurt (rondpraat): met de klok mee levert ieder één bijdrage",
        "Drie-stappen-interview: A interviewt B, B interviewt A, daarna vertellen ze het in viertal door",
        "Zoek-iemand-die: een bingokaart vol vragen, klasgenoten interviewen tot het vol is",
        "Carrousel/draaitafel: groepjes rouleren langs posters/posten en vullen aan",
        "Praatstok: alleen wie de stok heeft praat; zo komt iedereen aan bod",
        "Duo-lezen/maatjeslezen: om de beurt lezen, de luisteraar vat samen of stelt een vraag",
        "Kaarten sorteren in duo's: samen classificeren/ordenen en je keuze beargumenteren",
        "Wisbordje-duo: samen overleggen en één gezamenlijk antwoord omhoog houden",
        "Gallery walk: werk ophangen, rondlopen en elkaar gerichte feedback geven",
        "Placemat-consensus: het groepje moet het eens worden over wat in het midden komt",
        "Rondschrijven (estafette-schrijven): een vel rondgeven, ieder voegt een zin/stap toe",
        "Mindmap samen: één centraal woord, ieder met een eigen kleur takken toevoegen",
        "Eén blijft, de rest gaat (markt): één legt het werk uit, de anderen halen bij groepjes op",
        "Duo-controle: elkaars werk nakijken en samen verbeteren vóór het inleveren",
        "Stellingenspel: in groepjes eens/oneens bepalen en argumenten verzamelen",
        "Co-op-puzzel: ieder heeft een stukje informatie; alleen samen los je het op",
        "Tutorlezen: een sterkere en een minder sterke lezer werken als maatjes",
        "Rollen in het groepje: voorzitter, schrijver, tijdbewaker, materiaalbaas",
        "Samenvatten in duo's: om de beurt één zin van de samenvatting",
        "Hoekenwerk met een coöperatieve opdracht per hoek (groepje moet samenwerken)",
        "Fishbowl: een binnenkring praat, de buitenkring observeert en geeft daarna feedback",
        "Genummerde-hoofden-quiz: overleg in het groepje, een random nummer scoort de punten",
        "Stippen-/stickerstemming: ideeën op posters, ieder verdeelt zijn stippen om te prioriteren",
        "Vraag-vraag-wissel met flitskaarten: elkaar overhoren en de kaart doorgeven",
        "Rollenspel in groepjes: een situatie naspelen en bespreken",
        "Wie-ben-ik in duo's: ja/nee-vragen stellen om een begrip/persoon te raden",
        "Duo-vertel: om de beurt vertellen aan de hand van plaatjes of kaartjes",
        "Check-in-duo's: voor en na de les kort met je maatje afstemmen wat je al weet/snapt",
        "Hoeksgewijs (vier hoeken): kies een hoek bij een stelling en bespreek met gelijkgestemden",
        "Genummerde groepsproducten: elk groepje maakt iets en presenteert het kort",
        "Samen-één-product: het groepje levert één gezamenlijk werkstuk waar ieders deel in zit",
        "Tweetalcoach-rekenen/lezen: vaste coach-rolwisseling per opgave of alinea"
      ]
    }
  };

  // ── Verwerkingsbank voor zaakvakken ──
  // Verwerkingsvormen voor de verwerkingsfase van een kennisles (aardrijkskunde,
  // geschiedenis, natuur & techniek, wereldoriëntatie). Mengsel van ordenende/
  // analyserende én creatieve maakvormen; vak-overstijgend, de AI vult het
  // onderwerp in. Creatieve vormen putten daarnaast uit de creatief-technieken
  // per bouw (zo wordt de creatief-bank ook voor bv. geschiedenis benut).
  var VERWERKINGEN_ZAAK = [
    "een tijdbalk maken en de gebeurtenissen in de juiste volgorde plaatsen",
    "een kaart of plattegrond inkleuren en aanvullen (legenda, symbolen, route)",
    "een mindmap of woordweb rond het kernbegrip maken",
    "een schema of tabel invullen (oorzaak en gevolg, toen en nu, kenmerken)",
    "twee bronnen (foto, tekst, kaart) vergelijken: wat valt op en wat verschilt?",
    "een bron lezen: wat zie of lees je, en wat kun je eruit afleiden?",
    "feiten en meningen uit een tekst halen en sorteren",
    "een begrippen-memory, -domino of -kwartet maken en spelen",
    "een quiz over de kern maken of spelen (op papier of digitaal)",
    "een waar-of-niet-waar-stellingenspel doen",
    "een sorteeropdracht (tijdvak, werelddeel, leefgebied, materiaalsoort)",
    "een vergelijking toen-nu of hier-daar in twee kolommen maken",
    "een eigen onderzoeksvraag bedenken en een mini-onderzoekje doen",
    "een proefje of waarneming uitvoeren en de uitkomst noteren",
    "een route of ontdekkingsreis uitstippelen op de kaart",
    "gegevens verzamelen en in een grafiek of diagram zetten",
    "de voorpagina of cover van een krant of tijdschrift over het onderwerp maken",
    "een poster of affiche over het thema ontwerpen",
    "een diorama of maquette van de scène of het landschap bouwen",
    "een stripverhaal van de gebeurtenis tekenen",
    "een nieuwsbericht of krantenartikel schrijven alsof je erbij was",
    "een interview met een historisch figuur of een bewoner naspelen of opschrijven",
    "een museumhoek inrichten met zelfgemaakte voorwerpen en bordjes",
    "een reisbrochure of folder van een gebied of land maken",
    "een ansichtkaart van vroeger of van daar schrijven en illustreren",
    "een artefact namaken (een grotschildering, een gereedschap, een kledingstuk)",
    "een wandkrant of muurkrant samenstellen",
    "een toneelstukje of rollenspel van een gebeurtenis spelen",
    "een lapbook of vouwboekje over het thema maken",
    "een schaalmodel bouwen (een kasteel, een dorp, een ecosysteem, de waterkringloop)",
    "een logo, vlag of wapen ontwerpen voor een land, stad of tijdvak",
    "een dagboekfragment schrijven vanuit iemand uit die tijd of dat gebied",
    "een informatieve weetjeskaart of flyer maken",
    "een bordspel of ganzenbord over het onderwerp ontwerpen",
    "een nieuwsuitzending of podcast naspelen of opnemen",
    "een fotoreportage of getekende reportage maken",
    "een toen-nu-fotomontage of -tekening maken",
    "een proefopstelling van een natuurverschijnsel bouwen en uitleggen",
    "een korte presentatie of praatje voor de klas voorbereiden",
    "een expertgroepje worden en het de rest van de klas uitleggen",
    "een placemat of groepsposter samen invullen en presenteren",
    "een tijdcapsule samenstellen: wat zou je bewaren en waarom?"
  ];
  function isZaakvakKey(vak) {
    return /aardrijk|geschied|natuur|techniek|wereld|ori[eë]nt/i.test(String(vak || ""));
  }

  function lestypeKey(lt) {
    var t = String(lt || "").toLowerCase();
    if (/beweg/.test(t)) return "bewegend";
    if (/buiten/.test(t)) return "buiten";
    if (/co.?op|samen/.test(t)) return "cooperatief";
    return null; // 'klas' (in de klas) → geen aparte werkvorm-base
  }

  function sample(arr, n) {
    var a = arr.slice(), out = [];
    n = Math.min(n, a.length);
    for (var i = 0; i < n; i++) out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
    return out;
  }

  // De spellingbank staat al gesorteerd van GEWOON naar ZELDZAAM (op niveau, dan
  // frequentie; zie scripts/woordbank/bouw.js). Willekeurig grabbelen uit de héle
  // lijst haalt daarom net zo vaak een zeldzaam of vreemd woord achteraan naar boven
  // (curator, penicilline, merci, account) als een alledaags woord vooraan. Daarom
  // kiezen we ALLEEN uit de "gewone kop" van de lijst — met wat variatie, zodat niet
  // elk werkblad dezelfde woorden krijgt. Geen woord verdwijnt uit de bank; de
  // zeldzame staart blijft als reserve bestaan, maar drijft niet meer bovenaan.
  var SPELLING_KOP = 36; // grootte van de gewone-woorden-kop waaruit we kiezen
  function kop(lijst) { return (lijst || []).slice(0, SPELLING_KOP); }
  function kopGreep(lijst, n) { return sample(kop(lijst), n); }
  // Voor volledig-gereviewde banken (hele lijst bruikbaar): greep met bias naar de
  // GEWONERE (voorste) woorden, maar de HELE lijst bereikbaar. Zo krijg je maximale
  // variatie zonder dat abstracte/zeldzamere woorden even vaak opduiken als alledaagse.
  function gewogenGreep(lijst, n) {
    var pool = (lijst || []).slice(), out = [];
    n = Math.min(n, pool.length);
    for (var i = 0; i < n; i++) out.push(pool.splice(Math.floor(Math.pow(Math.random(), 1.8) * pool.length), 1)[0]);
    return out;
  }

  // Doorsnede van een woordenlijst met de "extra gevoelig"-lijst (window.avinkaGevoelig,
  // meegegenereerd door scripts/woordbank/bouw.js). Uniek, in oorspronkelijke volgorde.
  function gevoeligeIn(woorden) {
    var G = window.avinkaGevoelig;
    if (!G || !G.length || !woorden || !woorden.length) return [];
    var set = {}; for (var i = 0; i < G.length; i++) set[G[i]] = 1;
    var uit = [], gezien = {};
    for (var j = 0; j < woorden.length; j++) {
      var w = String(woorden[j] || "").toLowerCase();
      if (set[w] && !gezien[w]) { gezien[w] = 1; uit.push(w); }
    }
    return uit;
  }

  function ideeVakKey(vak) {
    var v = String(vak || "").toLowerCase();
    if (/creatief|handvaardig|knutsel|beeldend/.test(v)) return "creatief";
    return null;
  }
  function cluster(groep) {
    var t = String(groep || "").toLowerCase();
    if (/1\s*\/\s*2|groep\s*1\b|groep\s*2\b/.test(t)) return "1-2";
    var m = t.match(/[3-8]/);
    if (!m) return null;
    var n = +m[0];
    return n <= 4 ? "3-4" : (n <= 6 ? "5-6" : "7-8");
  }

  // ── Spellingmethodes: alleen HERKENNEN, niet reproduceren ─────────────────
  // Veel scholen werken met een vaste spellingmethode (Staal, Taal actief,
  // Spelling in Beeld) met eigen categorienamen. Een leerkracht typt die termen
  // ("maak een werkblad over het colawoord"). De tool HERKENT die term wel — de
  // woordenbank hieronder matcht via `test` ook methode-jargon — maar koppelt 'm
  // aan een EIGEN, methode-neutrale categorie met een eigen regel (in eigen
  // woorden) en eigen, gecureerde woorden. Het categoriesysteem, de namen en de
  // regelformuleringen van een uitgever worden NIET opgeslagen of gereproduceerd,
  // en een methodenaam komt nooit in de tekst die de leerling ziet.
  // (Avinka is niet gelieerd aan of goedgekeurd door de uitgevers; een
  // methodenaam dient alleen om de juiste terminologie te treffen. Het niveau per
  // leerjaar loopt via de eigen SLO-spellingleerlijn, niet via een methode-opbouw.)
  var METHODE_NAAM = /\bstaal\b|taal\s*-?\s*actief|spelling\s*in\s*beeld|schraven|zwijsen|malmberg/i;

  // ── Woordenbank per spellingcategorie ──────────────────────────────────────
  // De AI maakt te vaak spelfouten (krisis) of kiest woorden buiten de categorie
  // (ritme/april als "kilowoord", terwijl je daar gewoon de i hoort). Daarom
  // levert de CODE de woorden aan: gecureerd, correct gespeld en gegarandeerd in
  // de juiste categorie. De tools laten de AI UITSLUITEND deze woorden gebruiken.
  // `test` herkent de categorie uit het onderwerp/de aanvullingen (Staal-naam,
  // Taal actief-naam of een fonetische omschrijving). Volgorde = prioriteit.
  // Uitbreidbaar: voeg een categorie of woorden toe (alles met de hand geverifieerd).
  var SPELLING_WOORDEN = [
    { naam: "woorden waarin je /ie/ hoort maar één i schrijft (zoals kilo, liter)", bank: "kilo_ie",
      test: /kilo\s*-?woord|liter\s*-?woord|hoor.{0,8}ie.{0,18}schrijf.{0,8}\bi\b|\bi\b[^a-z]{0,8}(klinkt als|als)[^a-z]{0,4}ie/,
      woorden: ["kilo", "liter", "prima", "titel", "crisis", "figuur", "minus", "via", "diploma", "januari", "februari"] },
    { naam: "de c die klinkt als /s/ (zoals cent, citroen)", bank: "c_als_s",
      test: /cent\s*-?woord|cijfer\s*-?woord|\bc\b[^a-z]{0,8}als[^a-z]{0,4}s\b|hoor.{0,8}\/?s\/?.{0,18}schrijf.{0,8}\bc\b/,
      woorden: ["cent", "citroen", "cirkel", "centrum", "cijfer", "december", "procent", "cement", "centimeter", "ceintuur"] },
    { naam: "de c die klinkt als /k/ (zoals cola, cactus)", bank: "c_als_k",
      test: /cola\s*-?woord|insect\s*-?woord|\bc\b[^a-z]{0,8}als[^a-z]{0,4}k\b|hoor.{0,8}\/?k\/?.{0,18}schrijf.{0,8}\bc\b/,
      woorden: ["cola", "club", "computer", "cactus", "contact", "concert", "camera", "cacao", "container", "copiloot"] },
    { naam: "woorden op -tie (je hoort /(t)sie/, je schrijft tie)", bank: "tie",
      test: /politie\s*-?woord|tie\s*-?woord|woorden? (op|met)\s*-?tie\b|tsie/,
      woorden: ["politie", "vakantie", "traktatie", "informatie", "portie", "conditie", "natie", "optie", "emotie", "sensatie", "organisatie"] },
    { naam: "woorden op -isch (je hoort /ies/, je schrijft isch)", bank: "isch",
      test: /tropisch\s*-?woord|isch\s*-?woord|woorden? (op|met)\s*-?isch\b/,
      woorden: ["tropisch", "logisch", "magisch", "fantastisch", "praktisch", "automatisch", "komisch", "typisch", "elektrisch", "historisch"] },
    { naam: "de x die je als /ks/ hoort (zoals taxi, examen)", bank: "x",
      test: /taxi\s*-?woord|\bx\s*-?woord|woorden? met (de )?\bx\b/,
      woorden: ["taxi", "examen", "extra", "exact", "maximaal", "expert", "export", "saxofoon", "exemplaar", "exotisch"] },
    { naam: "de ch die klinkt als /sj/ (zoals chef, machine)", bank: "ch_sj",
      test: /chef\s*-?woord|\bch\b[^a-z]{0,8}als[^a-z]{0,4}sj|hoor.{0,8}sj.{0,18}schrijf.{0,8}\bch\b/,
      woorden: ["chef", "machine", "chocolade", "douche", "parachute", "chic", "brochure", "charmant", "chauffeur", "champignon"] },
    { naam: "de th die je als /t/ hoort (zoals thee, thema)", bank: "th",
      test: /thee\s*-?woord|\bth\s*-?woord|woorden? met th\b/,
      woorden: ["thee", "thema", "theater", "thermometer", "bibliotheek", "apotheek", "theorie", "thuis", "methode"] },
    { naam: "de g die klinkt als /zj/ (zoals garage, etage)",
      test: /garage\s*-?woord|\bg\b[^a-z]{0,8}als[^a-z]{0,4}zj|hoor.{0,8}zj.{0,18}schrijf.{0,8}\bg\b/,
      woorden: ["garage", "etage", "bagage", "horloge", "massage", "etalage", "passagier", "reportage", "collage"] },
    { naam: "woorden met -eau (je hoort /oo/, je schrijft eau)", bank: "eau",
      test: /cadeau\s*-?woord|woorden? met eau\b|\beau\b/,
      woorden: ["cadeau", "bureau", "plateau", "niveau"] },
    { naam: "woorden met een accentstreepje op de é (zoals café, privé)", bank: "accent_e",
      test: /caf[eé]\s*-?woord|streepje op de e|accent.{0,8}\bé?e\b/,
      woorden: ["café", "privé", "coupé", "logé", "cliché", "attaché"] },
    { naam: "woorden met eer, oor of eur", bank: "eer_oor_eur",
      test: /eer\s*-?oor\s*-?eur|eer.{0,2}oor.{0,2}eur|woorden? met (eer|oor|eur)\b/,
      woorden: ["beer", "peer", "meer", "deur", "kleur", "geur", "oor", "door", "voor", "spoor", "keer", "leer"] },
    { naam: "woorden met aai, ooi of oei (je hoort /j/, je schrijft i)", bank: "aai_ooi_oei",
      test: /aai\s*-?ooi\s*-?oei|aai.{0,2}ooi.{0,2}oei|woorden? met (aai|ooi|oei)\b/,
      woorden: ["haai", "kraai", "draai", "mooi", "kooi", "gooi", "groei", "bloei", "boei", "fraai"] },
    { naam: "woorden met eeuw of ieuw", bank: "eeuw_ieuw",
      test: /eeuw\s*-?ieuw|eeuw.{0,2}ieuw|woorden? met (eeuw|ieuw)\b/,
      woorden: ["leeuw", "sneeuw", "eeuw", "meeuw", "nieuw", "kieuw", "spreeuw", "geeuw"] },
    { naam: "woorden met uw (je hoort /uu/, je schrijft u)",
      test: /uw\s*-?(rijtje|woord)|woorden? met uw\b/,
      woorden: ["uw", "duw", "ruw", "schuw", "sluw", "schaduw", "zenuw", "zwaluw"] },
    { naam: "woorden met ei of ij (weetwoorden)", bank: "ei_ij",
      test: /\bei\s*-?\/?\s*ij\b|ei en ij|ij en ei|woorden? met ei\b|woorden? met ij\b|\bei\s*-?woord|\bij\s*-?woord/,
      woorden: ["trein", "klein", "plein", "reis", "geit", "eind", "ijs", "fijn", "pijn", "wijn", "tijd", "rijk", "kijk", "zwijn"] },
    { naam: "woorden met au of ou (weetwoorden)", bank: "au_ou",
      test: /\bau\s*-?\/?\s*ou\b|au en ou|ou en au|woorden? met au\b|woorden? met ou\b|\bau\s*-?woord|\bou\s*-?woord/,
      woorden: ["blauw", "gauw", "nauw", "dauw", "saus", "pauw", "auto", "kabouter", "koud", "goud", "hout", "zout", "fout", "vrouw", "schouder"] },
    { naam: "woorden met cht (korte klank + cht)", bank: "cht",
      test: /lucht\s*-?woord|\bcht\s*-?woord|woorden? met cht\b/,
      woorden: ["licht", "nacht", "lucht", "recht", "zacht", "vlucht", "gracht", "kracht", "wacht", "dicht"] },
    { naam: "woorden met ng (zoals zingen, koning)", bank: "ng",
      regel: "Je hoort de ng-klank (zoals in koning en zingen) en die schrijf je met de twee letters ng.",
      test: /zing\s*-?woord|\bng\s*-?woord|woorden? met ng\b/,
      woorden: ["ding", "koning", "slang", "ring", "jong", "zingen", "lang", "bang", "honger", "vinger"] },
    { naam: "woorden met nk (zoals plank, bank)", bank: "nk",
      regel: "Je hoort de nk-klank (zoals in bank en denken). Je schrijft nk; er komt GEEN g tussen de n en de k (dus plank, niet plangk).",
      test: /plank\s*-?woord|denk\s*-?woord|\bnk\s*-?woord|woorden? met nk\b/,
      woorden: ["bank", "dank", "plank", "drinken", "denken", "winkel", "donker", "links", "klinken", "wenk"] },
    { naam: "woorden die op een /t/-klank eindigen maar met d of t (langer maken)", bank: "langermaak_d",
      test: /langer\s*-?maak|verlengwoord|hoor.{0,6}\bt\b.{0,16}schrijf.{0,6}\bd\b|eindigt op (een )?d\b/,
      woorden: ["hand", "hond", "bord", "paard", "woord", "mand", "wind", "hemd", "eend", "rand"] },
    { naam: "woorden op /f/ die met v worden verlengd (duif → duiven)", bank: "f_naar_v",
      test: /duiven\s*-?woord|\bf\b[^a-z]{0,6}(wordt|naar)[^a-z]{0,4}v\b|woord.{0,8}eindigt op (een )?f\b/,
      woorden: ["duif", "brief", "doof", "lief", "golf", "wolf", "druif", "schroef"] },
    { naam: "woorden op /s/ die met z worden verlengd (huis → huizen)", bank: "s_naar_z",
      test: /huizen\s*-?woord|\bs\b[^a-z]{0,6}(wordt|naar)[^a-z]{0,4}z\b|woord.{0,8}eindigt op (een )?s\b/,
      woorden: ["huis", "neus", "roos", "muis", "kaas", "gans", "vaas", "glas", "prijs"] },
    { naam: "verkleinwoorden (-je, -tje, -etje …)", bank: "verkleinwoord",
      test: /verkleinwoord|verkleining/,
      woorden: ["boom", "bloem", "man", "bal", "stoel", "koning", "raam", "huis", "kar", "tafel"] },
    { naam: "open en gesloten lettergrepen (verdubbelen of verlengen: man → mannen, maan → manen)", bank: "open_gesloten",
      test: /klankgroep|open.{0,4}gesloten|verdubbel|kasteel\s*-?woord|jager\s*-?woord|bakker\s*-?woord/,
      woorden: ["boom", "bom", "raam", "ram", "pot", "pen", "kar", "bal", "vis", "man", "zon", "kip"] },
    // Meervoud met 's: woorden die op een lange klinker (a, o, u, i, y) eindigen krijgen
    // 's in het meervoud (auto → auto's). Geen eigen bank in de woordenbank: eigen,
    // met de hand gecureerde grondvormen (het kind vormt zelf het meervoud).
    { naam: "meervoud met 's (bijvoorbeeld auto → auto's)",
      test: /['’]\s?s\b.{0,12}meervoud|meervoud.{0,12}['’]\s?s\b|komma\s*-?\s*s\b|apostrof|['’]s[\s-]?woord|auto['’]?s/,
      woorden: ["auto", "foto", "radio", "paraplu", "menu", "taxi", "baby", "pony", "kilo", "piano", "video", "oma", "opa", "hobby"] },
    { naam: "woorden met sch (zoals school, schaduw)", bank: "sch",
      test: /\bsch\s*-?woord|woorden? met sch\b/,
      woorden: ["school", "schoen", "schaap", "schaar", "schat", "schuur", "schilder", "schaduw", "schouder", "schema"] },
    // voorvoegsel/achtervoegsel/y_grieks: bouw-regexes gefixt 4-7 (valse-positieven weg),
    // dus nu herkend + op de schone bank.
    { naam: "woorden met een voorvoegsel (be-, ge-, ver-, ont-, her-)", bank: "voorvoegsel",
      test: /voorvoegsel|woorden? met (be|ge|ver|ont|her)\s*-/,
      woorden: ["gebouw", "bezoek", "bewegen", "verhaal", "ontbijt", "gevaar", "verschil", "geluk", "bericht", "gedrag"] },
    { naam: "woorden op -ig of -lijk", bank: "achtervoegsel",
      test: /achtervoegsel|woorden? op\s*-?(ig|lijk)\b|\b(ig|lijk)\s*-?woord/,
      woorden: ["aardig", "voorzichtig", "prachtig", "handig", "moeilijk", "duidelijk", "gelukkig", "vrolijk", "makkelijk", "gezellig"] },
    { naam: "woorden met de Griekse y (zoals systeem, type)", bank: "y_grieks",
      test: /griekse\s*y|\by\s*-?woord|woorden? met (de )?(griekse )?y\b/,
      woorden: ["systeem", "type", "symbool", "mysterie", "cyclus", "fysiek", "gym", "pyjama"] },
    // Lollywoord (Staal): woorden die op -y eindigen, y klinkt als /ie/ (baby, pony, hobby).
    { naam: "woorden die eindigen op -y (je hoort /ie/, je schrijft y)", bank: "y_eind",
      test: /lolly\s*-?woord|eindig\w*\s*op\s*-?y\b|op\s*-?y\s*eindig|\by\s*aan\s*het\s*eind|-y\s*-?woord/,
      woorden: ["baby", "pony", "hobby", "lolly", "party", "puppy", "teddy", "jury", "bunny", "rugby"] },
    // Tremawoord (Staal): een trema (deelteken) markeert een nieuwe lettergreep (ruïne, egoïst).
    { naam: "woorden met een trema (deelteken, zoals ruïne, egoïst)", bank: "trema",
      test: /trema\s*-?woord|\btrema\b|deelteken|puntjes op de/,
      woorden: ["ideeën", "knieën", "tweeën", "drieën", "poëzie", "reünie", "egoïst", "naïef", "ruïne", "maïs"] },
    // Routewoord (Staal): ou die klinkt als /oe/ (Franse leenwoorden). Niet uit de letters
    // af te leiden (ou is meestal /au/), dus een eigen handlijst.
    { naam: "woorden waarin ou klinkt als /oe/ (zoals route, souvenir)",
      test: /route\s*-?woord|ou\b.{0,12}\/?oe\/?|klinkt als.{0,6}oe/,
      woorden: ["route", "souvenir", "journaal", "tour", "silhouet", "bouillon", "douche", "mousse"] },
    // Trottoirwoord (Staal): oir die klinkt als /waar/. Zeldzaam, eigen handlijst.
    { naam: "woorden met oir (je hoort /waar/, zoals trottoir)",
      test: /trottoir\s*-?woord|\boir\s*-?woord|woorden? met oir\b/,
      woorden: ["trottoir", "reservoir", "repertoire", "memoires"] }
  ];
  // Kenmerk per categorie: de letter(s) die de REGEL oefent en dus in het invul-gat
  // moeten vallen (niet een willekeurige middenletter). Keyed op bank-id. Zonder
  // kenmerk (transformatie-categorieen als open/gesloten, verkleinwoord) → geen
  // vaste letter om te blanken.
  var SPELLING_FEAT = {
    kilo_ie: /i/, c_als_s: /c/, c_als_k: /c/, tie: /ties?$/, isch: /isch$/, x: /x/,
    th: /th/, ch_sj: /ch/, eau: /eau/, accent_e: /[éèê]/, eer_oor_eur: /eer|oor|eur/,
    aai_ooi_oei: /aai|ooi|oei/, eeuw_ieuw: /eeuw|ieuw/, ei_ij: /ei|ij/, au_ou: /au|ou/,
    cht: /cht/, ng: /ng/, nk: /nk/, sch: /sch/, y_grieks: /y/, y_eind: /y$/, trema: /[ëïöü]/
  };

  // ALLE genoemde categorieen (een leerkracht kan er meerdere tegelijk willen
  // oefenen, bijv. "taxiwoord, colawoord, centwoord, cadeauwoord").
  function vindSpellingCats(context) {
    var t = String(context || "").toLowerCase();
    // Robuuste herkenning: "woorden met lolly", "oefenen met de cola", "sorteren op cent"
    // enz. worden ook gepakt. We plakken bij "met/op/over <mascotte>" de "<mascotte>woord"-
    // vorm erachter, zodat de bestaande mascotte-tests ("lolly-woord", "cola-woord") matchen.
    // ("lollywoorden" en "lolly woorden" matchen al via \s*-?woord in de tests zelf.)
    // Voor ELK kort token in de invoer (ng, nk, aai, sch, cola, lolly, cadeau…) plakken we
    // de herkenbare vormen "woorden met <tok>" én "<tok>woord" achter de tekst, zodat zowel
    // de cluster-tests ("woorden met aai") als de mascotte-tests ("lolly-woord") matchen —
    // ongeacht schrijfwijze, ook in lijstjes ("ng, nk en aai") en zonder voorzetsel ervoor.
    var aug = t;
    t.split(/[\s,;.]+/).forEach(function (tok) {
      tok = tok.replace(/[-'’]/g, "").replace(/woord(en)?$/, ""); // "ng-woord"/"ngwoorden" → "ng"
      if (tok.length >= 2 && tok.length <= 9 && /^[a-zà-ÿ]+$/.test(tok)) aug += " woorden met " + tok + " " + tok + "woord";
    });
    var uit = [];
    for (var i = 0; i < SPELLING_WOORDEN.length; i++) {
      if (SPELLING_WOORDEN[i].test.test(aug)) uit.push(SPELLING_WOORDEN[i]);
    }
    return uit;
  }
  function vindSpellingCat(context) { return vindSpellingCats(context)[0] || null; }

  window.avinkaLeerlijnen = {
    voor: function (vak, groep) {
      var vk = vakKey(vak), g = groepNr(groep);
      return (vk && g && DATA[vk] && DATA[vk][g]) ? DATA[vk][g] : "";
    },
    ideeen: function (vak, groep, n) {
      var vk = ideeVakKey(vak), c = cluster(groep);
      if (!(vk && c && IDEEEN[vk] && IDEEEN[vk][c])) return "";
      var blok = IDEEEN[vk][c];
      var greep = sample(blok.ideeen, n || 14);
      var out = "Passende technieken voor deze bouw: " + blok.technieken + ".";
      out += "\nEen greep uit de ideeënbank (kies er één, of combineer/varieer): " + greep.map(function (x) { return "• " + x; }).join("  ");
      var pool = IDEEEN[vk].onderwerpen;
      if (pool && pool.length) {
        var ond = sample(pool, 8);
        out += "\nBouw-overstijgende onderwerpen (werken in élke groep — voer ze uit met een techniek die bij deze bouw past; voor oudere leerlingen mag hetzelfde onderwerp met een moeilijker techniek en meer detail): " + ond.map(function (x) { return "• " + x; }).join("  ");
      }
      return out;
    },
    werkvormen: function (lestype, groep, n) {
      var lk = lestypeKey(lestype);
      if (!(lk && WERKVORMEN[lk])) return "";
      var blok = WERKVORMEN[lk];
      var greep = sample(blok.lijst, n || 12);
      return blok.kern + "\nEen greep uit de werkvorm-base (kies er één of twee die echt bij dít leerdoel en deze groep passen en werk ze concreet uit met het leerdoel erin; varieer en stem het niveau af op de bouw): " + greep.map(function (x) { return "• " + x; }).join("  ");
    },
    // Herkent de spellingcategorie die de leerkracht noemt — ook in het jargon van
    // een methode ("het colawoord van Staal", "kasteel-woord") — en geeft een
    // EIGEN, methode-neutrale instructie terug, of ''. De methode wordt dus wél
    // begrepen, maar niet gereproduceerd: geen categorie-indeling, namen of
    // regelformuleringen van een uitgever, en de methodenaam komt niet in de
    // leerlingtekst. Het niveau loopt via de eigen SLO-spellingleerlijn (`voor`),
    // niet via een methode-opbouw. De bijbehorende correcte woorden komen uit
    // `spellingWoorden`.
    spellingMethode: function (context, groep) {
      var cats = vindSpellingCats(context);
      var noemtMethode = METHODE_NAAM.test(String(context || ""));
      if (!cats.length && !noemtMethode) return "";
      var kern = "SPELLINGCATEGORIE (eigen, methode-neutrale aanpak). Een leerkracht gebruikt vaak de termen van de eigen spellingmethode. Herken die term, maar gebruik in de les/het werkblad je EIGEN, neutrale uitleg: neem geen categorienaam, regelformulering of indeling van een methode over, en zet de naam van een methode NIET in de tekst die de leerling ziet. Maak er een eigen, goed opgebouwde en aantrekkelijke les/werkblad van die méér biedt dan een rij oefenwoorden. Gebruik UITSLUITEND de neutrale omschrijving(en) die hieronder staan; verzin GEEN eigen labels zoals \"zachte c\" of \"harde c\" (die zijn verwarrend en vaak onjuist), en zet geen methode-categorienaam (zoals \"colawoord\") in de leerlingtekst. BELANGRIJK — DEK DE HELE OPDRACHT: behandel ELK leerdoel dat de leerkracht in het onderwerp noemt. Noemt het onderwerp meerdere spellingcategorieen, of nog een categorie die hieronder niet apart wordt uitgewerkt, werk die dan óók volledig uit (met eigen, passende, correct gespelde woorden). Sla NOOIT stilzwijgend een deel van de opdracht over.";
      if (cats.length === 1) {
        return kern +
          "\nDeze les/dit werkblad gaat over de categorie: " + cats[0].naam + "." +
          (cats[0].regel ? " De juiste spellingregel is: " + cats[0].regel : "") +
          " Behandel die als hoofdonderwerp. Staat er hierboven een regel? Neem die dan (bijna) LETTERLIJK over in je uitleg — parafraseer 'm niet los en verzin er GEEN 'nooit zus of zo'-varianten bij (die kloppen vaak niet). Gebruik meerdere passende voorbeeldwoorden uit de woordenbank.";
      }
      if (cats.length > 1) {
        return kern +
          "\nDe leerkracht wil MEERDERE categorieen tegelijk oefenen. Behandel ELK van deze categorieen op het werkblad en laat er geen enkele weg (verdeel de opdrachten eerlijk over de categorieen, of maak per categorie een eigen onderdeel): " +
          cats.map(function (c) { return "\"" + c.naam + "\"" + (c.regel ? " (regel: " + c.regel + ")" : ""); }).join("; ") + "." +
          " Leg per categorie de regel kort in kindtaal uit. Waar een regel is meegegeven, neem die dan (bijna) LETTERLIJK over — parafraseer 'm niet los en verzin er GEEN 'nooit zus of zo'-varianten bij (die kloppen vaak niet). Gebruik per categorie de bijbehorende woorden uit de woordenbank.";
      }
      // Alleen een methodenaam genoemd, geen specifieke categorie.
      return kern +
        " De leerkracht noemt wel een methode maar geen specifieke categorie: kies een spellingcategorie die past bij het leerjaar (zie de leerlijn-context) en werk die uit.";
    },
    // Brede, ALTIJD-actieve toon-waarborg voor élk werkblad/elke les. Zorgt dat de
    // AI woorden in een neutrale, kindvriendelijke context gebruikt — geen geweld,
    // rampen, dood of verontrustende scenario's — ook bij woorden die we niet vooraf
    // als gevoelig hebben gemarkeerd. Benoemt daarnaast expliciet de gevoelige
    // woorden die in het onderwerp/aanvullingen zelf voorkomen.
    toonWaarborg: function (context) {
      var basis = "KINDVRIENDELIJKE TOON (altijd). Gebruik ELK woord in een neutrale, " +
        "luchtige, bij kinderen passende context. Ook als een woord op zichzelf wat " +
        "zwaar kan zijn (bijvoorbeeld \"exploderen\", \"oorlog\", \"gevangenis\"): " +
        "verzin er GEEN gewelddadig, angstig, gruwelijk of verontrustend zinnetje bij. " +
        "Dus niet \"het vliegtuig met 100 mensen explodeerde\", maar bijvoorbeeld \"de " +
        "ballon exploderde met een harde knal\". Vermijd concrete slachtoffers, dood, " +
        "bloed, rampen en bedreigende situaties in voorbeeldzinnen en verhaaltjes.";
      var gev = gevoeligeIn(String(context || "").toLowerCase().split(/[^a-zà-ÿ]+/));
      if (gev.length) basis += " In dit onderwerp zitten gevoelige woorden (" + gev.join(", ") +
        "): behandel die extra voorzichtig en licht.";
      return basis;
    },
    // Gecureerde woordenbank voor de spellingcategorie die in de tekst (onderwerp
    // + aanvullingen) wordt genoemd. Geeft een kant-en-klare instructie-string met
    // CORRECT gespelde, in-categorie woorden terug, of '' als er geen categorie
    // wordt herkend (dan valt de tool terug op de algemene regels).
    spellingWoorden: function (context, groep) {
      var cats = vindSpellingCats(context);
      if (!cats.length) return "";
      var g = (String(groep || "").match(/[3-8]/) || [])[0];
      var meer = cats.length > 1;
      // Woordenlijst voor één categorie (basisvormen + spaarzaam vervoegingen),
      // uit de nieuwe woordenbank (public/avinka-woordenbank.js) of anders de
      // met de hand gecureerde terugval-lijst.
      function bankVoor(cat) {
        if (cat.bank && g && window.avinkaWoordenbank && window.avinkaWoordenbank[cat.bank]) {
          var lijst = window.avinkaWoordenbank[cat.bank].filter(function (x) { return x[1] <= +g; });
          var grond = lijst.filter(function (x) { return x[2] !== "v"; }).map(function (x) { return x[0]; });
          var verv = lijst.filter(function (x) { return x[2] === "v"; }).map(function (x) { return x[0]; });
          if (grond.length >= 8) {
            // Standaard: kies uit de HELE (doorgereviewde) bank met frequentie-weging,
            // voor maximale variatie. Een nog-niet-gereviewde bank kan `kopOnly:true`
            // krijgen → dan alleen de gewone kop (zeldzame/vreemde tail weren).
            var kies = cat.kopOnly ? kopGreep : gewogenGreep;
            var gGrond = kies(grond, Math.min(meer ? 16 : 26, grond.length));
            var s = "Categorie \"" + cat.naam + "\" — basisvormen (kies hier vooral uit): " + gGrond.join(", ") + ".";
            var gVerv = verv.length ? kies(verv, Math.min(meer ? 5 : 8, verv.length)) : [];
            if (gVerv.length) s += " Vervoegingen (spaarzaam, alleen waar het echt helpt): " + gVerv.join(", ") + ".";
            var gev = gevoeligeIn(gGrond.concat(gVerv));
            if (gev.length) s += " LET OP — deze woorden zijn gevoelig (" + gev.join(", ") + "): gebruik ze alleen in een neutrale, luchtige context, nooit in een gewelddadig, angstig of verontrustend zinnetje.";
            return s;
          }
        }
        return "Categorie \"" + cat.naam + "\" — woorden: " + cat.woorden.join(", ") + ".";
      }
      var regels = "Gebruik in de oefeningen UITSLUITEND woorden uit deze lijst(en): correct gespeld, kindgeschikt en gegarandeerd in de juiste categorie. Verzin ZELF GEEN andere categoriewoorden; neem ze exact over zoals ze hier staan.";
      if (!meer) return "VERPLICHTE WOORDENBANK. " + regels + " " + bankVoor(cats[0]);
      return "VERPLICHTE WOORDENBANK PER CATEGORIE. " + regels +
        " Gebruik per categorie de bijbehorende woorden (meng ze niet door elkaar binnen één opdracht, tenzij de opdracht juist het onderscheiden van de categorieen oefent):\n" +
        cats.map(function (c) { return "• " + bankVoor(c); }).join("\n");
    },
    // Gestructureerde bankwoorden per herkende categorie (voor code-controle in de
    // tool: losse-woord-opdrachten mogen ALLEEN deze woorden bevatten). Geeft
    // [{naam, key, woorden:[...]}], of [] als er geen categorie wordt herkend.
    spellingBanken: function (context, groep) {
      var cats = vindSpellingCats(context);
      if (!cats.length) return [];
      var g = (String(groep || "").match(/[3-8]/) || [])[0];
      return cats.map(function (cat) {
        var woorden;
        if (cat.bank && g && window.avinkaWoordenbank && window.avinkaWoordenbank[cat.bank]) {
          woorden = window.avinkaWoordenbank[cat.bank].filter(function (x) { return x[1] <= +g && x[2] !== "v"; }).map(function (x) { return x[0]; });
          if (woorden.length < 8) woorden = cat.woorden.slice();
          else if (cat.kopOnly) woorden = kop(woorden); // standaard: hele bank; kopOnly → alleen de kop
        } else woorden = cat.woorden.slice();
        return { naam: cat.naam, key: cat.bank || cat.naam, woorden: woorden, feat: SPELLING_FEAT[cat.bank] || null };
      });
    },
    verwerkingen: function (vak, groep, n) {
      if (!isZaakvakKey(vak)) return "";
      var greep = sample(VERWERKINGEN_ZAAK, n || 12);
      var out = "Een greep uit de verwerkingsbank voor zaakvakken (kies er één die echt bij dít onderwerp en deze groep past, en werk die concreet uit; de verwerking mag best creatief zijn als dat bij het onderwerp past): " + greep.map(function (x) { return "• " + x; }).join("  ");
      var c = cluster(groep);
      if (c && IDEEEN_CREATIEF[c]) {
        out += "\nPast een creatieve maakopdracht (zoals een tijdschriftcover, poster, diorama of maquette over het onderwerp)? Gebruik dan technieken die bij deze bouw horen: " + IDEEEN_CREATIEF[c].technieken + ".";
      }
      return out;
    },
  };
})();

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
   .verwerkingen(vak,groep) · .spellingMethode(aanvullingen, groep[, maand])
   (herkent een in de vrije tekst genoemde spellingmethode zoals Staal en geeft
   de bijbehorende categorieën/regels terug, of ''. Bij Staal wordt op de
   jaaropbouw gefilterd: alleen de categorieën die de groep op dit punt in het
   schooljaar al gehad heeft — vorige groepen volledig, het lopende leerjaar
   naar rato van de maand).

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

  // ── Nederlands ── (SLO-leerstoflijnen taal/lezen, referentieniveaus 1F/2F)
  var TAAL_SPELLING = {
    "3": "Spelling: klankzuivere woorden (mkm: maan, vis, kat) schrijven zoals je ze hoort; eerste regels (plakletters bij melk/worm, woorden op -nk, sch-). Klank-tekenkoppeling staat centraal. Taal: zinsbesef en woordenschat uitbreiden.",
    "4": "Spelling: langere woorden met lastige klanken (eu, ng, aai/ooi/oei, de 'plaagletter' bij eer/oor/eur), meervoud en verkleinwoorden. Grammatica: het begrip 'werkwoord' (doe-woord) leren herkennen. Taal: woordenschat en eenvoudige zinsbouw.",
    "5": "Spelling: open en gesloten lettergrepen (verdubbelen/verlengen: bomen–bommen), hoofdletters, weetwoorden (ei/ij, au/ou); start (voorbereidende) werkwoordspelling: werkwoorden in een tekst herkennen. Grammatica: woordsoorten benoemen (begin).",
    "6": "Spelling: per les één categorie, gelijkvormigheid (hond–honden) en analogie (hij vindt). Werkwoordspelling tegenwoordige tijd (stam, stam+t: 'hij wordt'). Grammatica: persoonsvorm, onderwerp en gezegde herkennen; woordsoorten (zelfstandig naamwoord, werkwoord, lidwoord).",
    "7": "Spelling/werkwoordspelling uitgebreid: tegenwoordige én verleden tijd (zwak: stam+te/de, 't ex-kofschip) en voltooid deelwoord (d/t). Nieuwe categorieën: leenwoorden (Frans/Engels), 's bij bezit, -isch(e), x, trema, koppelteken. Grammatica: bijvoeglijk naamwoord, verder zinsdelen.",
    "8": "Spelling: herhaling en verdieping; werkwoordspelling in complexere zinnen (+t/+dt tegenwoordige tijd, +te/+de verleden tijd), klankvaste vs. klankveranderende werkwoorden. Extra regels: stoffelijke bijvoeglijke naamwoorden (wollen), tussen-n (pannenkoek), meervouden (perziken). Grammatica: zinsontleding (onderwerp, persoonsvorm, gezegde). Richting referentieniveau 1F/2F."
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
    "taal-spelling": TAAL_SPELLING,
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
    if (/spelling|taal/.test(v)) return "taal-spelling";
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

  // ── Spellingmethodes ──────────────────────────────────────────────────────
  // Veel scholen werken met een vaste spellingmethode die eigen categorienamen
  // en regelformuleringen hanteert. Noemt de leerkracht de methode in de
  // aanvullingen ("we werken met Staal"), dan gebruikt de tool die indeling +
  // die exacte namen/regels, in plaats van een methode-neutrale aanpak.
  // Bron: officiële regelkaarten / leerstofoverzichten (Malmberg, Zwijsen) en
  // de didactiek van José Schraven (basis onder Staal).
  var SPELLING_METHODES = {
    staal: {
      naam: "Staal",
      triggers: /\bstaal\b|schraven|zo leer je kinderen lezen en spellen/i,
      uitleg: "Staal (Malmberg) werkt met vaste, genummerde categorieën met herkenbare namen; de naam én de regel worden door alle jaargroepen heen op dezelfde manier gebruikt. De leerling bepaalt eerst de categorie en past dan de bijbehorende regel toe.",
      // Genummerd 1-34 (officiële Malmberg-regelkaarten). De categorieën bouwen
      // per leerjaar op; `cap` (zie staalCap) bepaalt welke een groep op dit
      // punt in het schooljaar al gehad heeft.
      cats: [
        { n: 1, naam: "hakwoord", regel: "ik schrijf het woord zoals ik het hoor (speciaal hakwoord: daar mag geen u tussen)" },
        { n: 2, naam: "zingwoord", regel: "ng, net als bij ding-dong" },
        { n: 3, naam: "luchtwoord", regel: "korte klank + cht (de ch van lucht), behalve bij hij ligt/legt/zegt" },
        { n: 4, naam: "plankwoord", regel: "daar mag geen g tussen" },
        { n: 5, naam: "eer-oor-eur-woord", regel: "ik schrijf ee, oo of eu (eel-woord: ee)" },
        { n: 6, naam: "aai-ooi-oei-woord", regel: "ik hoor de /j/, maar ik schrijf de i" },
        { n: 7, naam: "eeuw-ieuw-woord", regel: "ik denk aan de u" },
        { n: 8, naam: "langermaakwoord", regel: "ik hoor /t/ aan het eind, dus langer maken (d of t); ook het eind-b-rijtje (b)" },
        { n: 9, naam: "voorvoegsel", regel: "ik hoor /u/, maar ik schrijf de e (be-, ge-, ver-)" },
        { n: 10, naam: "klankgroepenwoord", regel: "open/gesloten lettergreep: lange klank één letter, korte klank medeklinker dubbel, tweetekenklank/medeklinker schrijf je zoals je hoort" },
        { n: 11, naam: "verkleinwoord", regel: "grondwoord + je/tje/etje/aatje/ootje/uutje" },
        { n: 12, naam: "achtervoegsel", regel: "-ig (ik hoor /ug/, schrijf ig) en -lijk" },
        { n: 13, naam: "kilowoord", regel: "ik hoor de /ie/, maar ik schrijf de i" },
        { n: 14, naam: "komma-s-woord", regel: "eerst de komma, dan de s" },
        { n: 15, naam: "centwoord", regel: "ik hoor de /s/, maar ik schrijf de c" },
        { n: 16, naam: "komma-s-meervoud", regel: "meervoud + lange klank/y/i aan het eind: 's (behalve bij ee); ook komma-s bij bezit" },
        { n: 17, naam: "politiewoord", regel: "ik hoor /tsie/, maar ik schrijf tie" },
        { n: 18, naam: "colawoord", regel: "ik hoor de /k/, maar ik schrijf de c" },
        { n: 19, naam: "tropisch-woord", regel: "ik hoor /ies/, maar ik schrijf isch" },
        { n: 20, naam: "taxiwoord", regel: "ik hoor /ks/, maar ik schrijf x" },
        { n: 21, naam: "chefwoord", regel: "ik hoor /sj/, maar ik schrijf ch" },
        { n: 22, naam: "theewoord", regel: "ik hoor de /t/, maar ik schrijf th" },
        { n: 23, naam: "caféwoord", regel: "met een streepje op de é" },
        { n: 24, naam: "cadeauwoord", regel: "ik hoor /oo/, maar ik schrijf eau" },
        { n: 25, naam: "routewoord", regel: "ik hoor /oe/, maar ik schrijf ou" },
        { n: 26, naam: "garagewoord", regel: "ik hoor /zj/, maar ik schrijf g" },
        { n: 27, naam: "lollywoord", regel: "ik schrijf de Griekse y" },
        { n: 28, naam: "tremawoord", regel: "puntjes erop" },
        { n: 29, naam: "militairwoord", regel: "ik schrijf -air" },
        { n: 30, naam: "koppelteken", regel: "samenstelling met een koppelteken" },
        { n: 31, naam: "trottoirwoord", regel: "ik schrijf -oir" },
        { n: 32, naam: "tussen-e", regel: "tussen-e in een samenstelling" },
        { n: 33, naam: "trema-meervoud", regel: "-ën (bij ie meestal -iën, met trema bij bacteriën, koloniën, oliën, poriën, financiën)" },
        { n: 34, naam: "latijns voorvoegsel", regel: "" }
      ],
      // Losse rijtjes/afspraken (niet genummerd), met de groep waarin ze starten.
      extra: [
        { vanaf: 4, naam: "ei-ij", regel: "ei staat op de ei-plaat (korte ei), ij staat er niet op (lange ij); weetwoord" },
        { vanaf: 4, naam: "au-ou", regel: "au staat op de au-plaat, ou staat er niet op; weetwoord" },
        { vanaf: 4, naam: "uw-rijtje", regel: "ik hoor /uu/, maar ik schrijf u (uw, duw, ruw, schuw, sluw, schaduw, waarschuw, zenuw, zwaluw)" },
        { vanaf: 4, naam: "woord met -eren/-enen/-elen", regel: "ik hoor twee keer de /u/, maar ik schrijf de e" },
        { vanaf: 4, naam: "samenstelling", regel: "plak twee woorden samen; pas op elk deel zijn eigen categorie + regel toe" },
        { vanaf: 5, naam: "gids-rijtje", regel: "ik denk aan de d (gids, fonds, ginds, loods, reeds, sinds, steeds)" }
      ]
    },
    taalactief: {
      naam: "Taal actief",
      triggers: /taal\s*-?\s*actief/i,
      uitleg: "Taal actief (Malmberg) deelt woorden in luisterwoorden (schrijf zoals je hoort), regelwoorden (pas een regel toe) en weetwoorden (uit het hoofd). De categorieën hebben eigen namen zoals plant-woord, kasteel-woord en cijfer-woord.",
      categorieen: [
        "Luisterwoorden: plant-/strik-/worst-woord (schrijf zoals je hoort), wolk-/berg-woord, v-f en s-z-woord, sch-/schr-woord, ng-/nk-woord, eer-oor-eur-woord, aai-ooi-oei-woord, eeuw-ieuw-uw-woord",
        "Weetwoorden: cht-/ch-woord (nacht/lach), ei-ij, au-ou, liter-woord (/ie/→i), cijfer-woord (/s/→c) en insect-woord, krab-woord (/p/→b), thee-woord (/t/→th), leenwoorden (team/chauffeur/taxi/baby), voor- en achtervoegsels (-ig, -lijk, -heid), garage-woord (/zju/→ge), isch(e)-woord, tie-woord, -iaal/-ieel/-ueel",
        "Regelwoorden: verkleinwoord, -d-woord (langer maken), kasteel-/jager-/bakker-/keuken-woord (klankgroepen: open/gesloten lettergreep), duiven-/huizen-woord (f→v, s→z), vergrotende/overtreffende trap, onbeklemtoonde woorden, apostrof-'s, trema-woorden, stoffelijk bijvoeglijk naamwoord (-en), samenstellingen, hoofdletters"
      ]
    },
    spellinginbeeld: {
      naam: "Spelling in Beeld",
      triggers: /spelling\s*in\s*beeld/i,
      uitleg: "Spelling in Beeld (Zwijsen) ordent woorden in klankwoorden, regelwoorden en weetwoorden plus werkwoordspelling, en legt sterk de nadruk op de bijbehorende strategie (klank-, regel-, woordbeeld- en analogiestrategie). De methode gebruikt categoriecodes (K = klank, R = regel, W = weetwoord, WW = werkwoord).",
      categorieen: [
        "Klankwoorden (K): schrijf zoals je hoort, inclusief lastige klankgroepen (ng/nk, cht, eer-oor-eur, aai-ooi-oei, eeuw-ieuw)",
        "Regelwoorden (R): open/gesloten lettergreep (verdubbelen/verlengen), verkleinwoord, langer maken (d/t, f→v, s→z), hoofdletters, apostrof-'s, trema, koppelteken",
        "Weetwoorden (W): ei-ij, au-ou, leenwoorden, -isch, x, c (cent/cola), th en andere in te prenten woorden",
        "Werkwoordspelling (WW): tegenwoordige tijd, verleden tijd en voltooid deelwoord"
      ]
    }
  };
  function spellingMethodeKey(context) {
    var txt = String(context || "");
    for (var k in SPELLING_METHODES) {
      if (SPELLING_METHODES.hasOwnProperty(k) && SPELLING_METHODES[k].triggers.test(txt)) return k;
    }
    return null;
  }

  // Staal bouwt de categorieën per leerjaar op. Cumulatieve eindstand per groep
  // (geverifieerd aan de Malmberg-regelkaarten groep 4 t/m 8; groep 3 = t/m 7).
  var STAAL_GROEPMAX = { "3": 7, "4": 12, "5": 19, "6": 28, "7": 34, "8": 34 };
  // Fractie van het schooljaar dat de NIEUWE categorieën van dit leerjaar al zijn
  // aangeboden (schatting per maand; aug = jaarstart, jun/jul = afgerond). Bewust
  // aan de ruime kant: liever een categorie al beschikbaar dan een die de klas
  // net behandeld heeft nog missen. Samen met Math.ceil komt elke nieuwe
  // categorie er net iets eerder bij dan strikt naar rato.
  function maandFractie(maand) {
    var f = { 8: 0.0, 9: 0.12, 10: 0.25, 11: 0.4, 12: 0.5, 1: 0.6, 2: 0.7, 3: 0.8, 4: 0.88, 5: 0.95, 6: 1.0, 7: 1.0 };
    return f[maand] != null ? f[maand] : 1.0;
  }
  // Hoogste Staal-categorienummer dat een groep op dit punt in het jaar heeft gehad.
  function staalCap(groep, maand) {
    var m = String(groep || "").match(/[3-8]/);
    if (!m) return 34; // onbekende groep: toon alles
    var g = +m[0];
    var eind = STAAL_GROEPMAX[g] || 34;
    var begin = STAAL_GROEPMAX[g - 1] || 0; // eindstand vorige groep = beginstand nu
    return Math.min(eind, begin + Math.ceil((eind - begin) * maandFractie(maand)));
  }

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
    // Spellingmethode uit de vrije aanvullingen halen (bv. "we werken met Staal")
    // en de bijbehorende categorie-indeling + namen/regels teruggeven, of ''.
    // groep + maand sturen bij Staal de opbouw: alleen de categorieën die de
    // groep op dit punt in het schooljaar al gehad heeft. maand = 1-12 (default
    // de huidige maand). vorige groepen tellen volledig mee.
    spellingMethode: function (context, groep, maand) {
      var key = spellingMethodeKey(context);
      if (!key) return "";
      var m = SPELLING_METHODES[key];
      var kop = "SPELLINGMETHODE: de school werkt met " + m.naam + ". " + m.uitleg +
        " Gebruik in deze les de categorie-indeling, de categorienamen én de regelformuleringen van " + m.naam +
        " (precies zoals de methode ze noemt), niet die van een andere methode. Behandel bij voorkeur één hoofdcategorie per les en verwijs waar dat helpt naar eerder geleerde categorieën." +
        " BELANGRIJK: gebruik de methode alléén om aan te sluiten op de categorienamen, regels en het niveau. Maak GÉÉN kopie van een gewone methodeles. De les moet een eigen, goed uitgedachte en aantrekkelijke les blijven met een sterke didactische opbouw, een pakkende context en actieve werkvormen, die méér biedt dan een standaard methodeles (anders kan de leerkracht net zo goed de methode zelf pakken).";

      // Staal: pas de jaaropbouw toe (cap op categorienummer).
      if (m.cats) {
        if (maand == null) { try { maand = new Date().getMonth() + 1; } catch (e) { maand = 6; } }
        var g = (String(groep || "").match(/[3-8]/) || [])[0];
        var cap = staalCap(groep, maand);
        var beschikbaar = m.cats.filter(function (c) { return c.n <= cap; });
        var extras = g ? m.extra.filter(function (e) { return e.vanaf <= +g; }) : m.extra;
        var uit = kop +
          " LET OP de opbouw: deze klas (groep " + (g || "?") + ") heeft op dit moment in het schooljaar de categorieën t/m nummer " + cap +
          " gehad. Gebruik ALLEEN deze (en eerder geleerde) categorieën en introduceer geen latere; tenzij de leerkracht in het leerdoel of de aanvullingen zelf een latere categorie noemt." +
          "\nBeschikbare categorieën van " + m.naam + ":\n" +
          beschikbaar.map(function (c) { return "• " + c.n + ". " + c.naam + (c.regel ? ": " + c.regel : ""); }).join("\n");
        if (extras.length) {
          uit += "\nLosse rijtjes/afspraken die al behandeld zijn:\n" +
            extras.map(function (e) { return "• " + e.naam + ": " + e.regel; }).join("\n");
        }
        return uit;
      }

      // Overige methodes: de algemene categorielijst (kies wat bij de groep past).
      return kop + " Kies de categorie(ën) die past bij het leerdoel en het niveau van de groep.\nCategorieën van " + m.naam + ":\n" +
        m.categorieen.map(function (c) { return "• " + c; }).join("\n");
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

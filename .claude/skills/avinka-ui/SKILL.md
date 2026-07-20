---
name: avinka-ui
description: Ontwerpregels en kwaliteitschecklist voor Avinka-schermen. Gebruik dit bij het bouwen of aanpassen van een tool, scherm, formulier of dialoog in public/tools/, of wanneer de gebruiker vraagt om iets mooier, toegankelijker of consistenter te maken.
---

# Avinka UI

Twee delen. Deel A is de vormtaal en die is al beslist, dus daar niet van afwijken zonder te overleggen. Deel B is een kwaliteitschecklist die pas geldt vlak voor iets af is.

## A. De vormtaal (vastgelegd, niet opnieuw uitvinden)

**Canonieke bron: `public/tools/rapporten.html`.** Kopieer patronen daaruit, ga niet zelf ontwerpen. `public/tools/_template.html` is de starter voor een nieuwe tool. Uitzondering: `plattegrond.html` houdt bewust een eigen toolbar en een eigen palet.

**Kleuren:** neem de tokens over uit `_template.html`, hardcodeer niets. De hoofdkleur is groen `--accent: #2f9e6e` met `--accent2: #25855a` en `--brand-soft: #e7f4ed`. Oudere notities noemen indigo of terracotta; die zijn achterhaald.

**Lettertypes:** Fraunces voor koppen (gewicht 600, `letter-spacing:-1px`, `<em>` als accentwoord), Plus Jakarta Sans voor de rest.

**Vaste onderdelen:**
- Velden en dropdowns: `.field-input` / `.field-select` met label `.field-label`. Focus geeft de groene ring, dat is het herkenningspunt. Ingevulde velden krijgen `.filled`.
- Dropdowns: gebruik `<select class="field-select">` plus `avinka-dropdown.css` en `avinka-dropdown.js` in de head. Nooit een kale OS-dropdown.
- Groep-veld: `<select class="field-select avinka-groep">`, een uitklapmenu en geen knoppenrij.
- Datums: `avinka-datum.js`, nooit een kale `<input type="date">`.
- Knoppen: `.btn-primary` (vol breed), `.btn-soft`, `.btn-green`.
- Instellingen staan in witte `.card`-vlakken, niet los op de achtergrond.

**Smaakregels van de eigenaar:**
- Speelsheid komt uit layout, kleur en illustratie. Niet uit losse emoji als versiering.
- Rustig en niet vol. Subtiele tekst blijft subtiel.
- Geen merklogo's van derden (Cito, IEP en dergelijke), gebruik generieke iconen.
- Bèta-functies staan verborgen achter een subtiel knopje, met een "niet gebruiken"-optie.
- Schrijf menselijk en professioneel, zonder AI-em-dash.
- Geen springende knoppen of titels tussen schermen onderling.

**Werkwijze:** ontwerp eerst als losse mockup en laat die zien, bouw pas daarna in de echte tool. De eigenaar beoordeelt op beeld. Nieuwe tools eerst los op `/tools/<naam>.html`, pas na goedkeuring overal inhaken.

**Technische valkuil:** geef SVG-iconen altijd een expliciete breedte en hoogte, anders worden ze reusachtig.

## B. Kwaliteitschecklist (loop deze af voor je zegt dat iets af is)

### Toegankelijkheid
- Contrast minimaal 4.5:1 voor gewone tekst, 3:1 voor grote tekst en voor de randen van bedienbare elementen.
- Let op: wit op `--accent` (#2f9e6e) haalt maar 3.37:1 en zakt door de norm. Wit op `--accent2` (#25855a) haalt 4.58:1. **Dus: witte tekst hoort op `--accent2`, niet op `--accent`.** De hoofdknoppen zijn hier op 20 juli 2026 op omgezet, met `filter: brightness(0.93)` als hover. Gebruik `--accent` voor vlakken, randen en iconen, niet als ondergrond voor tekst.
- Zichtbare focusring op alles wat bedienbaar is. Nooit `outline:none` zonder vervanger.
- Tab-volgorde volgt de leesvolgorde. Alles moet met het toetsenbord te bedienen zijn.
- In een dialoog: Escape sluit, focus blijft binnen de dialoog, en na sluiten springt de focus terug naar de knop die hem opende.
- Koppen lopen op volgorde (h1, h2, h3), sla geen niveau over.
- Informatie nooit alleen met kleur overbrengen, zet er een woord of icoon bij.
- Icoon-knoppen zonder tekst krijgen een `aria-label`.
- Respecteer `prefers-reduced-motion`.

### Formulieren
- Elk veld heeft een zichtbaar label. Een placeholder is geen label.
- Valideer bij het verlaten van een veld, niet bij elke toetsaanslag.
- Foutmelding onder het bijbehorende veld. Bij meerdere fouten een samenvatting bovenaan met spronglinks.
- Na een mislukte verzending springt de focus naar het eerste foute veld.
- Foutmeldingen zeggen wat er mis is en hoe je het oplost, niet alleen dat het mis is.
- Gebruik het juiste invoertype (email, tel, number) en `autocomplete` waar het kan.
- Lange formulieren slaan tussentijds op. Waarschuw voor het sluiten van iets met niet-opgeslagen werk.
- Uitgeschakelde elementen krijgen minder dekking plus een andere cursor.

### Wachten, leeg en fout
- Toon een spinner of skelet bij alles wat langer dan 300ms duurt. Bij AI-calls hoort een voortgangsindicatie, want die duren lang.
- Een leeg scherm krijgt altijd een uitleg plus een vervolgstap. Nooit een leeg wit vlak.
- Reserveer ruimte voor inhoud die nog laadt, zodat de pagina niet verspringt.
- Elke mislukte netwerk- of AI-call toont een begrijpelijke melding met een knop om opnieuw te proberen.
- Meldingen verdwijnen vanzelf na 3 tot 5 seconden en stelen de focus niet.

### Mobiel
- Aanraakvlakken minimaal 44 bij 44 pixels, met minstens 8 pixels ertussen.
- Bodytekst minimaal 16 pixels op mobiel, anders zoomt iOS automatisch in.
- Nooit horizontaal scrollen. Zoomen nooit uitschakelen.
- Test op 375, 768 en 1024 pixels breed.
- Gebruik `min-h-dvh` in plaats van `100vh`.

### Tekst en ruimte
- Regelhoogte 1.5 tot 1.75 voor lopende tekst. Maximaal 65 tot 75 tekens per regel.
- Spatiëring in stappen van 4 of 8 pixels.
- Getalkolommen met tabulaire cijfers, anders springt de uitlijning.
- Liever laten afbreken naar de volgende regel dan afkappen met puntjes.
- Micro-animaties 150 tot 300ms, nooit boven 500ms. Alleen `transform` en `opacity` animeren.

### Avinka-specifiek, altijd controleren
- Komen er leerlingnamen in beeld? Dan moet de maskering ze dekken voordat er iets naar de AI gaat.
- Wordt er iets over kinderen op de server bewaard? Dat mag alleen bewust en met een bewaartermijn. Toetsanalyse-uitvoer gaat als download, niet naar de database.
- Laadt het scherm lettertypes of scripts van een externe partij? Dat is een AVG-punt, host het liever zelf.

## Openstaande punten (niet stilzwijgend negeren)

- De rest van het platform is nog niet doorgemeten op contrast. Alleen de hoofdknoppen zijn nagerekend. Losse chips, badges, statuskleuren en witte tekst op andere gekleurde vlakken zijn nog onbekend terrein.

---

Deel B is deels afgeleid van de openbare checklists uit `nextlevelbuilder/ui-ux-pro-max-skill` (MIT-licentie). Alleen de meetbare regels zijn overgenomen. De stijlkeuzes daaruit zijn bewust niet gebruikt, want Avinka heeft een eigen vormtaal.

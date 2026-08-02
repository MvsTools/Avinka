---
name: Avinka
description: Warm, speels en slim designsysteem rond het vinkje, voor leerkrachten die tijd terugwinnen.
colors:
  brand-green: "#2f9e6e"
  brand-green-deep: "#25855a"
  brand-green-soft: "#e7f4ed"
  amber-warm: "#f59e0b"
  amber-soft: "#fff2d6"
  cream: "#fbf6ee"
  sand: "#f4ecdb"
  ink: "#221c3a"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2.4rem, 6vw, 4.5rem)"
    fontWeight: 900
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.78
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
rounded:
  md: "12px"
  lg: "16px"
  xl: "24px"
  pill: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.brand-green}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "16px 32px"
  button-primary-hover:
    backgroundColor: "{colors.brand-green-deep}"
  button-ghost:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px 32px"
  card:
    backgroundColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "28px"
  chip:
    backgroundColor: "{colors.brand-green-soft}"
    textColor: "{colors.brand-green-deep}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
---

## 1. Overview: Het Vinkje

Alles in Avinka draait om het moment van afvinken: de kleine overwinning waarmee
werk verdwijnt en rust terugkomt. Het systeem voelt warm, speels en slim; als een
opgeruimd klaslokaal, niet als een kantoorpakket en al helemaal niet als een
generieke AI-tool. Crème papiertinten, diep inkt-violet en het groene vinkje
dragen het geheel; amber is de warme knipoog. Serif-koppen (Fraunces) geven
karakter en vertrouwen, de sans (Plus Jakarta) houdt alles helder en vriendelijk.
Wat het niet mag zijn: druk, koud, techy of inwisselbaar.

## 2. Colors: Krijt, Inkt en het Groene Vinkje

- **brand-green #2f9e6e**: de kleur van het vinkje en van elke primaire actie.
  Gebruik spaarzaam en betekenisvol: als iets groen is, is het goed(gekeurd).
- **brand-green-deep #25855a** voor hover; **brand-green-soft #e7f4ed** voor
  zachte chips en succes-vlakken.
- **ink #221c3a**: alle tekst; nooit puur zwart. Op crème blijft dit AA-veilig.
- **cream #fbf6ee** is de standaardachtergrond, **sand #f4ecdb** voor secties
  die iets dieper mogen liggen; wit alleen voor kaarten en velden.
- **amber-warm #f59e0b** is accent, nooit hoofdkleur: markeringen, de "meest
  gekozen"-badge, onderstrepingen. **amber-soft #fff2d6** als zacht vlak.
- Toolkleuren (violet/sky/rose/teal per tool) zijn functioneel, niet decoratief.
- De film-landing (/nieuw) heeft een eigen donkere scène (#131022 met warm
  lamplicht); dat is een cinematografische uitzondering, geen systeemkleur.
- Verboden: kale standaard-Tailwind-kleuren als merkkleur, paarse gradients,
  grijs-op-kleur tekst.

## 3. Typography: Fraunces spreekt, Jakarta legt uit

- Koppen: Fraunces, zwart gewicht (900), strakke leading (1.02-1.1), lichte
  negatieve tracking. Groot durven: display-koppen mogen clamp tot 4.5rem+.
- Lopende tekst: Plus Jakarta Sans, 1.125rem, ruime leading (1.75+), gewicht 500.
- Kickers/labels: klein, bold, uppercase met ruime tracking (0.18-0.3em); in de
  film-landing monospace als "data-label"-stem.
- Cijfers altijd tabular-nums waar ze verspringen (klokken, tellers, prijzen).
- UI-teksten zijn menselijk en professioneel; nooit em-dashes, geen jargon.
- Inter, Roboto of system-ui als hoofdfont is verboden.

## 4. Elevation: Zacht gelaagd papier

Elevatie is ambient, niet structureel: kaarten liggen als vellen papier op het
bureau. Standaard `shadow-sm` met `ring-1 ring-black/5`; alleen primaire CTA's
krijgen een gekleurde gloed (`shadow-lg shadow-brand/25`). Borders zijn een
designelement (hairlines op ink/5 à ink/10). In de film-landing is licht wél
verhalend: één consistente lichtrichting (rechtsboven), slagschaduwen linksonder.
Geen zware dropshadows, geen dark glows.

## 5. Components

- **button-primary**: brand-green vlak, wit bold, rounded-lg (16px), hover naar
  brand-green-deep met subtiele -translate-y; nooit meer dan één per zichtvlak.
- **button-ghost**: wit met ink-tekst en hairline-rand; de rustige tweede keus.
- **card**: wit, rounded-xl (24px), 28px padding, shadow-sm + ring; koppen in
  Fraunces, nooit kaart-in-kaart.
- **chip**: pill, brand-green-soft met brand-green-deep tekst; voor statussen,
  tijdwinst ("+35 min terug") en toon-labels.
- **veld/dropdown/knop in tools**: volg het canonieke veld-knop-systeem van de
  rapporten-tool (zie geheugen tool-veld-knop-systeem); wijk daar niet van af.
- **vinkje**: het merk-moment. Checks verschijnen met een korte pop (scale vanaf
  ~0.5, back-easing, onder 300ms) of tekenen zich met stroke-dashoffset; nooit
  vanaf scale(0).
- Motion algemeen: betekenisvol en kort (UI onder 300ms, ease-out bij binnenkomst),
  scroll-reveals spaarzaam; alleen transform/opacity animeren;
  prefers-reduced-motion krijgt altijd een volwaardig alternatief.

## 6. Do's and Don'ts

**Do**
- Toets elk designbesluit aan Het Vinkje: maakt dit het gevoel van "afgevinkt,
  opgeruimd, tijd terug" sterker?
- Grote Fraunces-koppen, veel witruimte, asymmetrie waar het kan.
- Privacy zichtbaar maken (maskeer-momenten, schildjes), niet alleen benoemen.
- Echte teksten en echte voorbeelden (Sofie, groep 5); geen lorem of
  placeholder-quotes.
- Speelse details klein houden: één knipoog per scherm is genoeg.

**Don't**
- Geen hero-drie-blokjes-CTA-sjabloon, geen Inter, geen paarse gradients.
- Geen beweging zonder betekenis; niets animeren dat vaak terugkomt.
- Geen kaart-in-kaart, geen grijs-op-kleur, geen em-dashes in UI-tekst.
- Geen nieuwe kleuren of radii introduceren buiten de tokens hierboven.
- Niet centreren uit gemakzucht; kies bewust.

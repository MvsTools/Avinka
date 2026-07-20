@AGENTS.md

# CLAUDE.md — Frontend & Design Guardrails

Lees dit bij elke UI-/landing-taak. Doel: werk dat er intentioneel en uniek uitziet, nooit generieke "default AI"-output.

## Bestaande context (belangrijk)
- Dit is een **Next.js (App Router)**-project met een **eigen Avinka-designsysteem** (Tailwind-tokens: `brand` #2f9e6e, `ink`, `cream`, `accent` #f59e0b; Fraunces + Plus Jakarta). Bouw hierop voort; introduceer shadcn/ui, Framer Motion en GSAP bewust, niet blind.
- **Distinctief ≠ druk.** De eigenaar wil rust én karakter. Motion moet betekenisvol en verzorgd zijn, geen chaos (zie het geheugen: hero-rust-geen-poespas + landing-niet-generiek).

## Voor je bouwt
Noem in 1 regel: concept + aesthetic family + font-paar + accentkleur. Kun je dat niet? Dan ben je nog niet klaar om te bouwen.

## Anti-generiek regels (hard)
1. Geen Inter/system-ui/Roboto als hoofdfont; kies een bewust font-paar (display + tekst). Grote koppen (clamp tot 5-8rem), strakke leading.
2. Geen kale standaard-Tailwind-kleuren (blue-500…) als merk-accent. Werk vanuit de echte palette: basis + inkt + het amber/groen-accent.
3. Niet alles centreren. Asymmetrie, echt grid. Vermijd het "hero -> 3 blokjes -> CTA"-stramien tenzij gevraagd.
4. Betekenisvolle motion: scroll-reveals, hover, micro-interacties (Framer Motion + GSAP/ScrollTrigger) — smaakvol, niet overal om het overal.
5. Bewuste diepte/textuur: grain, gradients, echte schaduwen, borders als designelement.
6. Heb een concept dat de hele pagina draagt (magazine, terminal, product-tour, verhaal).
7. Details: focus states, echte copy (geen lorem, geen placeholder-quotes), optische uitlijning.

## Referenties (VUL JE 2-3 FAVORIETEN IN — dit is de knop voor 'uniek')
- linear.app — restraint, type-hierarchie
- vercel.com — hoog-contrast minimalisme, bold type
- family.co — speelse motion, karakter
- JOUW: <link 1> · <link 2> · <link 3>

## Stack
Next.js (App Router) + TypeScript, Tailwind, shadcn/ui, Framer Motion, GSAP. Gebruik de 21st.dev Magic MCP voor componenten.

## Workflow (niet-onderhandelbaar)
Concept eerst -> sectie voor sectie bouwen -> resultaat OPENEN in browser via Playwright MCP + screenshot -> eerlijk bekritiseren op bovenstaande regels -> minstens 1 ronde verbeteren op wat je ziet -> pas dan af. Nooit iets opleveren dat je niet visueel hebt bekeken.

## Toegankelijkheid
WCAG 2.2 AA contrast, semantische HTML, zichtbare focus states, prefers-reduced-motion, volledig responsive (check ook de mobiele screenshot).

"use client";

import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { Confetti, DONKER, KOP, KOP_SECTIE, KaartVlak, RUIS_OP_PAPIER, VLAK_PAPIER } from "./Wereld";

/* ── Zo werkt het ───────────────────────────────────────────────────────────
   Dit blok ontbrak. De pagina liet wél zien wát je krijgt (acht toolkaarten),
   maar nooit hoe het gebruiken eruitziet — terwijl dat precies is wat iemand
   wil weten die twijfelt: moet ik iets uploaden, iets typen, hoe lang duurt
   het, en wat krijg ik eruit?

   Bewust GEEN drie witte kaartjes: dat recept staat al bij "Herken je dit?",
   bij de privacyblokjes en bij de prijzen. Dit is een typografische band —
   grote cijfers, haarlijnen ertussen, geen doosjes en geen schaduw — zodat
   het licht blijft en niet als vierde kaartenrij leest. Om dezelfde reden
   staat er geen handgeschreven opstapje boven: die stonden in zes van de
   negen secties en werden daarmee een sjabloon.

   Er loopt bewust geen pijl of stippellijn tussen de stappen: verbindende
   tekeningetjes zijn op deze pagina herhaaldelijk afgekeurd. De volgorde komt
   uit de cijfers zelf. ─────────────────────────────────────────────────── */

const STAPPEN = [
  {
    titel: "Kies wat je nodig hebt",
    tekst:
      "Je pakt een tool en geeft in een paar velden door wat je wilt: een leerdoel, een toetsoverzicht of een paar steekwoorden over een leerling.",
  },
  {
    titel: "Avinka doet het voorwerk",
    tekst:
      "Je krijgt een complete uitwerking terug, opgebouwd zoals het hoort. De tool rekent zelf; de AI schrijft alleen de tekst eromheen.",
  },
  {
    titel: "Jij leest na en past aan",
    tekst:
      "Jij houdt het laatste woord. Daarna print je het, download je het als document of bewaar je het bij je eigen bestanden.",
  },
];

export function WereldHoeWerktHet() {
  /* ⭐ ALLEEN VOOR DE TELEFOON: welke stap staat open. Op een breed scherm staan
     alle drie de stappen gewoon naast elkaar en doet deze stand niets. */
  const [actief, setActief] = useState(0);

  /* ⭐ VEGEN ALS TWEEDE MANIER, NAAST DE CIJFERS.
     De veegrail is hier ooit weggehaald omdat je vlak erboven bij de tools ook
     al moest vegen. Dat argument gold toen vegen de ENIGE manier was: dan is het
     twee keer hetzelfde werk. Nu blijven de cijfers gewoon staan en is vegen een
     kortere weg voor wie hem kent. Keuze van de eigenaar, en het verschil is
     wezenlijk: een tweede manier kost niets, een tweede verplichting wel.

     🔑 De richtingtoets is overgenomen van de polaroids: bij 8px beweging valt
     eenmalig het besluit "zijwaarts of verticaal", en bij verticaal laten we
     het gebaar los zodat de pagina gewoon scrolt. Dat besluit staat daarna vast
     voor de rest van de veeg — anders wisselt bij een schuine beweging de
     grootste van de twee heen en weer.
     ⚠️ Er zit hier bewust GEEN click-afhandeling in, precies om de reden die de
     polaroids drie rondes kostte: één gebaar hoort aan één soort event te
     hangen. De cijfers erboven zijn gewone knoppen en staan hier los van. */
  const paneel = useRef<HTMLDivElement>(null);
  const veeg = useRef<{ startX: number; startY: number; richting: "zij" | "vert" | null } | null>(null);

  const zetSchuif = (dx: number, animatie: string) => {
    const el = paneel.current;
    if (!el) return;
    el.style.transition = animatie;
    el.style.transform = `translate3d(${dx}px, 0, 0)`;
  };

  const veegDown = (e: ReactPointerEvent) => {
    veeg.current = { startX: e.clientX, startY: e.clientY, richting: null };
  };
  const veegMove = (e: ReactPointerEvent) => {
    const v = veeg.current;
    if (!v) return;
    const dx = e.clientX - v.startX;
    const dy = e.clientY - v.startY;
    if (!v.richting && Math.hypot(dx, dy) > 8) {
      v.richting = Math.abs(dx) > Math.abs(dy) ? "zij" : "vert";
      if (v.richting === "zij") (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }
    if (v.richting !== "zij") return;
    /* Aan de uiteinden mag je wel duwen maar veel minder ver: dat vertelt dat
       er niets meer komt, zonder een grens te hoeven uitleggen. */
    const eind = (dx > 0 && actief === 0) || (dx < 0 && actief === STAPPEN.length - 1);
    zetSchuif(dx * (eind ? 0.18 : 0.55), "none");
  };
  const veegUp = (e: ReactPointerEvent) => {
    const v = veeg.current;
    veeg.current = null;
    if (!v || v.richting !== "zij") return;
    const dx = e.clientX - v.startX;
    if (Math.abs(dx) > 50) {
      setActief((i) => Math.min(STAPPEN.length - 1, Math.max(0, i + (dx < 0 ? 1 : -1))));
    }
    zetSchuif(0, "transform 0.26s cubic-bezier(0.23, 1, 0.32, 1)");
  };

  return (
    /* overflow-x-clip in plaats van overflow-hidden: horizontaal blijft er
       geknipt (anders duwen de vlakken de pagina breder), maar verticaal mag
       er nu doorgelopen worden. Met overflow-hidden werden de vlakken
       kaarsrecht afgesneden op de sectiegrens, en bij een organische vorm valt
       zo'n rechte lijn meteen op. */
    <section className="relative overflow-x-clip">
      {/* ⚠️ Waar de onderrand van deze sectie ligt is NIET waar je hem ziet.
         De privacysectie hieronder begint met een papieren golfstrook van 117px
         voordat de mint echt start. Een vlak dat op de sectiegrens wordt
         afgesneden houdt dus een papieren band onder zich, en dat leest als een
         wit vlak tussen de vorm en het mintveld.

         Daarom staat hier alleen nog het vlak dat naar BOVEN uitsteekt: daar
         ligt hetzelfde papier, dus dat is naadloos. Het vlak dat naar beneden
         liep is verhuisd naar de bovenkant van de privacysectie, waar de golf
         hem precies op de mintrand afsnijdt — net als het vlak rechts van
         "Veilig omgaan met AI". */}
      {/* Papier: uit sinds de opruiming, zie RUIS_OP_PAPIER in Wereld.tsx. */}
      {RUIS_OP_PAPIER && (
        <KaartVlak
          kleur={VLAK_PAPIER}
          vorm="ei"
          breedte={560}
          hoogte={300}
          style={{ right: "-12%", top: -30, transform: "rotate(9deg)" }}
          className="hidden lg:block"
          tel={6}
        />
      )}

      {/* z-10: de inhoud moet boven de vlakken hierboven blijven. */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24 pt-8 lg:pb-28">
        {/* Papier: uit sinds de opruiming. */}
        {RUIS_OP_PAPIER && (
          <Confetti punten={[{ x: "97%", y: "72%", r: 4, amber: true }]} />
        )}
        <h2
          data-reveal
          className={KOP_SECTIE}
          style={{ color: DONKER }}
        >
          Zo werkt het
        </h2>

        {/* ⭐ OP EEN TELEFOON: DRIE TABBLADEN, GEEN VEEGRAIL.
           Hier stond een veegbare rail (zelfde mechaniek als de toolrij). Eruit
           op verzoek van de eigenaar, en zijn reden is de sterkste die er is:
           "ik vind die schuifanimatie een beetje te veel omdat je dat bij de
           tools ook moet doen". Twee keer dezelfde beweging vlak na elkaar leest
           niet als een patroon maar als werk — en bij de tools verdient vegen
           zijn plek (acht kaarten, je wilt bladeren), hier niet (drie stappen,
           je wilt lezen).
           🔑 De les erachter: een mechaniek beoordeel je niet op zichzelf maar
           op wat er vlak boven staat. Deze rail was op zichzelf prima.

           Nu: 01 · 02 · 03 naast elkaar bovenaan, en daaronder de tekst van de
           gekozen stap. Stap 1 staat open bij het laden.
           ⚠️ De actieve stap is aan DRIE dingen te zien, niet aan één: volle
           kleur tegenover 30% doorzichtig, een groen streepje eronder, en een
           zwaarder cijfer. Kleur alleen is niet genoeg — voor wie kleuren slecht
           onderscheidt blijft het streepje en het gewicht over. */}
        <div className="mt-9 sm:hidden">
          <div
            role="tablist"
            aria-label="Zo werkt het, in drie stappen"
            className="flex items-end justify-center gap-9"
          >
            {STAPPEN.map((s, i) => (
              <button
                key={s.titel}
                type="button"
                role="tab"
                id={`stap-tab-${i}`}
                aria-selected={i === actief}
                aria-controls={`stap-paneel-${i}`}
                onClick={() => setActief(i)}
                className="flex flex-col items-center gap-2 rounded-xl px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <span
                  className={`font-display text-4xl leading-none tracking-tight transition-opacity duration-200 ${
                    i === actief ? "font-black opacity-100" : "font-bold opacity-30"
                  }`}
                  style={{ color: KOP }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {/* Het streepje staat er ALTIJD, alleen doorzichtig als de stap
                   dicht is. Zo springt de rij niet op als je wisselt. */}
                <span
                  aria-hidden
                  className={`h-1 w-8 rounded-full bg-brand transition-opacity duration-200 ${
                    i === actief ? "opacity-100" : "opacity-0"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* ⚠️ `min-h` is geen opsmuk: de drie teksten zijn niet even lang, en
             zonder ondergrens springt alles onder deze sectie omhoog of omlaag
             zodra je een ander nummer aantikt.
             🔑 De waarde is GEMETEN, niet geschat: 152px is de langste stap, op
             360 én op 390 breed (bij 360 worden er twee 152). Mijn eerste gok
             was 13rem = 208px en dat gaf een lege band van een halve schermhoogte
             onder de tekst. Meet zo'n ondergrens dus altijd na — te ruim is hier
             net zo lelijk als te krap, alleen minder makkelijk te zien. */}
          {/* `touchAction: pan-y` laat het verticale scrollen bij de browser en
             geeft ons alleen het zijwaartse gebaar — zelfde afspraak als bij de
             polaroids. `select-none` voorkomt dat je tijdens het vegen per
             ongeluk de tekst selecteert. */}
          <div
            ref={paneel}
            onPointerDown={veegDown}
            onPointerMove={veegMove}
            onPointerUp={veegUp}
            onPointerCancel={() => { veeg.current = null; zetSchuif(0, "transform 0.26s cubic-bezier(0.23,1,0.32,1)"); }}
            style={{ touchAction: "pan-y" }}
            className="mt-7 min-h-[9.5rem] select-none text-center"
          >
            {STAPPEN.map((s, i) => (
              <div
                key={s.titel}
                role="tabpanel"
                id={`stap-paneel-${i}`}
                aria-labelledby={`stap-tab-${i}`}
                hidden={i !== actief}
              >
                <h3 className="font-display text-xl font-black tracking-tight text-ink">{s.titel}</h3>
                <p className="mt-3 text-base leading-7 text-ink/75">{s.tekst}</p>
              </div>
            ))}
          </div>
        </div>

        {/* De haarlijnen zitten op de kolommen zelf: links van kolom 2 en 3 op
           een breed scherm. Dit raster is vanaf 640px, en daar verandert de
           tabblad-opzet hierboven niets aan. */}
        <div
          data-reveal
          className="mt-10 hidden gap-4 pb-2 sm:mt-12 sm:grid sm:grid-cols-3 sm:gap-x-10 sm:gap-y-10 sm:pb-0"
        >
          {STAPPEN.map((s, i) => (
            <div
              key={s.titel}
              style={{ transitionDelay: `${i * 90}ms` } as CSSProperties}
              /* Let op: géén `sm:pl-10` én `sm:pl-0` samen meegeven. Welke van
                 twee botsende Tailwind-klassen wint, hangt af van de volgorde
                 in het stylesheet en niet van de volgorde hier — de eerste
                 kolom kreeg zo toch inspringing en lijnde niet meer uit met de
                 kop erboven. */
              className={`border-ink/10 pt-0 sm:w-auto sm:pt-0 ${
                i === 0 ? "border-t-0" : "border-t-0 sm:border-l sm:pl-10"
              }`}
            >
              <p
                className="font-display text-4xl font-black leading-none tracking-tight sm:text-5xl"
                style={{ color: KOP, opacity: 0.35 }}
                aria-hidden
              >
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-display text-xl font-black tracking-tight text-ink sm:mt-4 sm:text-2xl">
                {s.titel}
              </h3>
              <p className="mt-2 text-base leading-7 text-ink/75 sm:mt-3 sm:text-lg sm:leading-8">{s.tekst}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

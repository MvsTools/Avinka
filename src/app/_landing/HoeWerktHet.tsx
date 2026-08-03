import type { CSSProperties } from "react";
import { Confetti, DONKER, KOP, KaartVlak, RUIS_OP_PAPIER, VLAK_PAPIER } from "./Wereld";

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
          className="font-display text-[clamp(1.875rem,3.4vw,2.75rem)] font-black tracking-tight"
          style={{ color: DONKER }}
        >
          Zo werkt het
        </h2>

        {/* De haarlijnen zitten op de kolommen zelf: links van kolom 2 en 3 op
           een breed scherm, bovenop elke stap zodra ze onder elkaar staan. */}
        <div data-reveal className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-3">
          {STAPPEN.map((s, i) => (
            <div
              key={s.titel}
              style={{ transitionDelay: `${i * 90}ms` } as CSSProperties}
              /* Let op: géén `sm:pl-10` én `sm:pl-0` samen meegeven. Welke van
                 twee botsende Tailwind-klassen wint, hangt af van de volgorde
                 in het stylesheet en niet van de volgorde hier — de eerste
                 kolom kreeg zo toch inspringing en lijnde niet meer uit met de
                 kop erboven. */
              className={`border-ink/10 pt-7 sm:border-t-0 sm:pt-0 ${
                i === 0 ? "border-t-0" : "border-t sm:border-l sm:pl-10"
              }`}
            >
              <p
                className="font-display text-5xl font-black leading-none tracking-tight"
                style={{ color: KOP, opacity: 0.35 }}
                aria-hidden
              >
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 font-display text-2xl font-black tracking-tight text-ink">
                {s.titel}
              </h3>
              <p className="mt-3 text-lg leading-8 text-ink/75">{s.tekst}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

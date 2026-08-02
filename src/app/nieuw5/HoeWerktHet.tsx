import type { CSSProperties } from "react";
import { Confetti, DONKER, KOP, KaartVlak, VLAK_PAPIER } from "./Wereld";

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
    <section className="relative overflow-hidden">
      {/* Beide vlakken stonden met een negatieve offset (bottom:-40 en
         top:-30) en werden daardoor door de sectierand kaarsrecht afgesneden:
         deze sectie heeft overflow-hidden, dus alles wat eruit steekt wordt
         geknipt. Bij een organische vorm valt zo'n rechte lijn meteen op.
         Ze staan nu allebei binnen de sectie. Let op bij het bijstellen: de
         scroll-parallax (data-wpar) verschuift ze nog eens tot enkele tientallen
         pixels, dus meet over meerdere scrollposities en niet op één moment. */}
      <KaartVlak
        kleur={VLAK_PAPIER}
        vorm="koepel"
        breedte={700}
        hoogte={330}
        style={{ left: "-14%", bottom: 55, transform: "rotate(-6deg)" }}
        className="hidden lg:block"
        tel={2}
      />
      {/* Vult het gat in het achtergrondweefsel tussen de kaartenrij hierboven
         en het mintveld hieronder: over die ruim vierhonderd pixels lag niets. */}
      <KaartVlak
        kleur={VLAK_PAPIER}
        vorm="ei"
        breedte={560}
        hoogte={300}
        style={{ right: "-12%", top: 85, transform: "rotate(9deg)" }}
        className="hidden lg:block"
        tel={6}
      />

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-24 pt-8 lg:pb-28">
        <Confetti punten={[{ x: "97%", y: "72%", r: 4, amber: true }]} />
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

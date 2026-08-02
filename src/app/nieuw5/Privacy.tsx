"use client";

import type { CSSProperties } from "react";
import { DONKER, Golf, KOP, MINT_LICHT, KaartVlak, VLAK_MINT, schaduw } from "./Wereld";

/* ── De privacysectie ──────────────────────────────────────────────────────
   Gebouwd naar de referentie die de eigenaar aanwees: het middenstuk van
   ente.io (public/_referenties/02b-ente-mid.png). Wat hij daar sterk aan
   vond, en wat hier dus terug moet komen:

   1. TWEE LOSSE KAARTEN die elk ÉÉN ding uitleggen. Dat past precies op de
      twee beloftes: namen gaan nooit naar de AI, en over een kind bewaren we
      geen oordeel. Niet één sectie die alles tegelijk probeert te zeggen.
   2. HET PLAATJE ZEGT WAT HET DOET. Ente tekent vierkantjes om de gezichten
      met een naamchip eraan; je snapt gezichtsherkenning zonder één woord.
   3. ECHTE FOTO'S, want dat maakt het warm.

   Bewust GEEN foto's van kinderen: een privacysectie die kindergezichten
   toont om over privacy te praten, spreekt zichzelf tegen. De namen staan op
   het schoolwerk, en dat is ook waar ze in het echt staan.

   ── Ronde 2 (2-8), na feedback van de eigenaar ──
   De kaarten waren te groot en te recht: twee identieke rechthoeken van
   536×556 op een pagina vol organische vormen, met de drie regie-keien er
   pal onder. En de foto's klopten niet met het verhaal — een stapel
   schriften heeft niets met leerlingnamen te maken en een klaslokaal is geen
   archief, dus de kadertjes kaderden iets willekeurigs.

   Wat er is veranderd:
   - KLEINER (max-w-5xl i.p.v. 6xl) en de foto in 5/4 i.p.v. 4/3.
   - SPEELS, maar bewust NIET zoals de regie-keien. Die zijn bijna rond; deze
     zijn gewone kaarten met vier ongelijke hoeken — de familie van de
     makerskaart. Expliciete wens van de eigenaar: het mag niet te veel van
     hetzelfde worden. Om diezelfde reden staat hier GEEN vinkje-badge: die
     zit al op de drie regie-keien én op de makerskaart.
   - De rechterkaart hangt lager, zodat de rij golft in plaats van in het
     gelid te staan.
   - NIEUWE FOTO'S. Kaart 1: drie Nederlandse werkbladen met de naamregel
     rechtsboven (Sophie, Daan, Emma), zodat ons kadertje precies over een
     échte naam valt. Kaart 2: een archiefdoos met tabbladen, waarvan de
     kleuren toevallig bijna ons eigen palet zijn.
   ── Ronde 3 en 4 (2-8): kaart 2 twee keer omgegooid ──
   Die kaart beloofde eerst "wij bewaren niets over je klas" en liet een
   zoekactie met 0 resultaten zien. Allebei onwaar: voornamen van je klas
   bewaren we wél (anders kan geen enkele tool je werk voorvullen), net als
   klasplattegronden en rapportconcepten — die laatste 90 dagen, zie
   database/retention.sql en /privacy.

   De reparatie (een lijstje van wat we wél en niet bewaren) was ook niet
   goed: het dwong de lezer tot uitzoekwerk, en zo'n belofte veroudert zodra
   er verwerkersovereenkomsten met scholen komen — dan mag er meer bewaard
   worden en moeten we een privacybelofte intrekken.

   DE REGEL DIE HIERUIT VOLGT: een schoolovereenkomst verandert de
   BEWAARTERMIJN, niet het DOEL. Beloof dus het doel, niet de inventaris. De
   kaart noemt daarom alleen nog wat er nooit met je gegevens gebeurt; dat
   blijft waar, met of zonder overeenkomst. Zie ook [[schoolroute-org-laag]].

   ⚠️ "AI ermee trainen" leunt op de DPA + zero-data-retention-afspraak bij
   Anthropic ([[ai-aanbieder-keuze]]). Die moet getekend zijn voordat dit
   publiek gaat.

   Zie [[referentie-eerst-regel]]: eerst het beeld, dan pas bouwen. ────── */

const KAART_RAND = "#d4e5dc";
const KAART_SCHADUW = schaduw(34, 66, -34, 0.6);

/* Vier duidelijk ongelijke hoeken, gespiegeld tussen de twee kaarten. Subtiel
   ongelijk werkte niet: dan lees je gewoon een afgeronde rechthoek. */
const VORM_LINKS = "3.6rem 1.2rem 3.2rem 1.6rem / 1.6rem 3.2rem 1.2rem 3.6rem";
const VORM_RECHTS = "1.3rem 3.5rem 1.5rem 3.1rem / 3.1rem 1.4rem 3.4rem 1.4rem";
/* De foto krijgt dezelfde taal, een maat zachter, zodat je geen rechthoek in
   een rechthoek ziet. */
const FOTO_LINKS = "2.4rem 0.8rem 2.2rem 1.0rem / 1.0rem 2.2rem 0.8rem 2.4rem";
const FOTO_RECHTS = "0.9rem 2.4rem 1.0rem 2.1rem / 2.1rem 1.0rem 2.3rem 0.9rem";

const CHIP: CSSProperties = { background: "#2f9e6e", color: "#ffffff" };

/* De kadertjes liggen op de drie naamregels, van "Naam:" tot het eind van de
   stippellijn. Percentages zijn t.o.v. het ZICHTBARE fotovlak: de foto is 4/3
   en wordt in een 5/4-vak getoond, dus object-cover snijdt links en rechts elk
   3,125% weg. De x-waarden hieronder zijn daar al voor gecorrigeerd.

   Het kader omsluit de naam en laat hem staan; de chip hangt eróndér in plaats
   van erop. Eerste poging had een kader precies om de handgeschreven naam met
   de chip in de hoek — die twee vielen dan samen tot één groene vlek en je zag
   het kader niet meer. Nu is het net als in de referentie: een kader om wat er
   staat, met het label los eronder. */
const NAMEN = [
  { left: "51.8%", top: "7.4%", w: "26.3%", h: "5.4%", chip: "leerling A", vert: 0 },
  { left: "53.0%", top: "34.3%", w: "25.1%", h: "5.4%", chip: "leerling B", vert: 130 },
  { left: "60.1%", top: "58.7%", w: "29.1%", h: "5.7%", chip: "leerling C", vert: 260 },
];

export function WereldPrivacy() {
  return (
    <section className="relative overflow-hidden" style={{ background: MINT_LICHT }} aria-label="Privacy">
      <Golf kleur="#fcfbf7" flip vorm="oploopRechts" hoogte="h-[70px] sm:h-[118px]" />
      <KaartVlak
        kleur={VLAK_MINT}
        vorm="koepel"
        breedte={720}
        hoogte={340}
        style={{ right: "-16%", top: 70, transform: "rotate(-5deg)" }}
        className="hidden lg:block"
        tel={3}
      />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-24 pt-28 lg:pb-28 lg:pt-32">
        <div className="max-w-2xl">
          <p data-reveal className="text-2xl" style={{ fontFamily: "var(--font-hand)", color: KOP }}>
            privacy voorop
          </p>
          <h2
            data-reveal
            className="mt-2 font-display text-[clamp(2.1rem,4.4vw,3.4rem)] font-black leading-[1.03] tracking-tight [text-wrap:balance]"
            style={{ color: DONKER }}
          >
            Er is één ding dat we bewust niet doen.
          </h2>
        </div>

        {/* ── de twee kaarten ── */}
        <div className="mt-12 grid items-start gap-8 lg:mt-14 lg:grid-cols-2 lg:gap-10">
          {/* KAART 1 — de maskering, letterlijk op het schoolwerk */}
          <article
            data-reveal
            className="relative border-[2.5px] bg-white p-5 sm:p-6"
            style={{
              borderRadius: VORM_LINKS,
              borderColor: KAART_RAND,
              boxShadow: KAART_SCHADUW,
              rotate: "-1.8deg",
            }}
          >
            <p className="text-xl leading-none" style={{ fontFamily: "var(--font-hand)", color: KOP }}>
              blijft thuis
            </p>
            <h3
              className="mt-1 font-display text-[clamp(1.4rem,2.2vw,1.75rem)] font-black leading-tight tracking-tight"
              style={{ color: DONKER }}
            >
              Namen gaan nooit mee
            </h3>
            <p className="mt-1.5 max-w-sm leading-6 text-ink/60">
              Op jouw eigen apparaat vervangen door een schuilnaam, nog vóór er
              iets wordt verstuurd.
            </p>

            <div className="relative mt-4 overflow-hidden" style={{ borderRadius: FOTO_LINKS }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/nieuw5/foto/werkbladen-namen.jpg"
                alt="Drie werkbladen die over elkaar heen liggen, met rechtsboven op elk blad een ingevulde naamregel"
                className="block aspect-[5/4] w-full object-cover"
              />

              {/* de kadertjes, zoals de vierkantjes om de gezichten in de
                 referentie — maar wat er uitkomt is juist géén naam */}
              {NAMEN.map((n) => (
                <span
                  key={n.chip}
                  data-reveal
                  style={{
                    left: n.left,
                    top: n.top,
                    width: n.w,
                    height: n.h,
                    /* de bladen liggen licht gedraaid; een kaarsrecht kader
                       ligt er dan los overheen in plaats van erop */
                    rotate: "-3.5deg",
                    transitionDelay: `${n.vert + 200}ms`,
                  }}
                  className="absolute rounded-[12px] border-[3px] border-white/95 shadow-[0_2px_14px_rgba(0,0,0,0.25)]"
                  aria-hidden
                >
                  <span
                    className="absolute left-0 top-full mt-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.72rem] font-bold shadow-md"
                    style={CHIP}
                  >
                    {n.chip}
                  </span>
                </span>
              ))}

              {/* het bijschrift ín de foto, zoals de referentie doet */}
              <span
                className="absolute left-3 top-3 hidden rounded-full bg-black/45 px-3 py-1.5 text-[0.7rem] font-bold text-white backdrop-blur-sm sm:block"
                aria-hidden
              >
                wat de AI ontvangt
              </span>
            </div>
          </article>

          {/* KAART 2 — het lege archief */}
          <article
            data-reveal
            style={{
              transitionDelay: "120ms",
              borderRadius: VORM_RECHTS,
              borderColor: KAART_RAND,
              boxShadow: KAART_SCHADUW,
              rotate: "1.4deg",
            }}
            className="relative border-[2.5px] bg-white p-5 sm:p-6 lg:mt-10"
          >
            <p className="text-xl leading-none" style={{ fontFamily: "var(--font-hand)", color: KOP }}>
              geen uitzonderingen
            </p>
            <h3
              className="mt-1 font-display text-[clamp(1.4rem,2.2vw,1.75rem)] font-black leading-tight tracking-tight"
              style={{ color: DONKER }}
            >
              We gebruiken het nergens anders voor
            </h3>
            <p className="mt-1.5 max-w-sm leading-6 text-ink/60">
              Wat je invult is er om jouw werk te doen. Verder gebeurt er niets
              mee.
            </p>

            <div className="relative mt-4 overflow-hidden" style={{ borderRadius: FOTO_RECHTS }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/nieuw5/foto/archiefdoos.jpg"
                alt="Een archiefdoos met tabbladen op een houten tafel"
                className="block aspect-[5/4] w-full object-cover"
              />

              {/* Het briefje op de doos: alleen wat er NOOIT gebeurt.

                 Hier stond eerst een inventaris van wat we wel en niet
                 bewaren. Twee bezwaren van de eigenaar, allebei terecht. Het
                 dwong de lezer tot uitzoekwerk, en — zwaarder — zo'n belofte
                 veroudert: zodra er verwerkersovereenkomsten met scholen
                 komen mag er meer bewaard worden, en dan moeten we een
                 privacybelofte intrekken. Dat is erger dan hem nooit gedaan
                 hebben.

                 Wat een schoolovereenkomst verandert is de BEWAARTERMIJN. Wat
                 niet verandert is het DOEL. Deze kaart gaat daarom over het
                 doel, en noemt alleen de ontkenningen: die blijven waar, met
                 of zonder overeenkomst. Doorgestreepte tekst zonder verdere
                 iconen — het kopje draagt de betekenis al. */}
              <div
                data-reveal
                style={{ transitionDelay: "260ms" }}
                /* Op desktop niet vol-breed: de regels zijn kort, dus een
                   vol-breed vlak werd een lege slab. Smaller leest het als een
                   label óp de doos. Op mobiel wél vol-breed, daar is geen
                   ruimte te verspillen. */
                className="absolute inset-x-4 bottom-4 sm:bottom-5 sm:left-5 sm:right-auto sm:max-w-[68%]"
              >
                <div className="overflow-hidden rounded-[1.4rem] bg-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.4)]">
                  {/* Op 390px is de foto maar ~250px hoog, dus alles wat hier
                     staat telt dubbel: zonder de kleinere maten hieronder nam
                     dit briefje de halve foto in beslag. */}
                  {/* Het kopje draagt de merkkleur: met alléén doorgestreept
                     grijs verloor deze kaart zijn anker naast de groene chips
                     van kaart 1 en werd het een bleke slab. */}
                  <p
                    className="px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.08em] sm:px-4 sm:py-1.5 sm:text-[0.66rem]"
                    style={{ color: KOP }}
                  >
                    wat er nooit mee gebeurt
                  </p>
                  <ul className="border-t border-ink/[0.07] px-3 py-1.5 sm:px-4 sm:py-2">
                    {["AI ermee trainen", "verkopen of delen", "gebruiken voor reclame"].map((wat) => (
                      <li
                        key={wat}
                        className="text-[0.74rem] leading-5 text-ink/65 line-through decoration-ink/40 sm:text-[0.8rem] sm:leading-6"
                      >
                        {wat}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <span
                className="absolute left-3 top-3 hidden rounded-full bg-black/45 px-3 py-1.5 text-[0.7rem] font-bold text-white backdrop-blur-sm sm:block"
                aria-hidden
              >
                wat je bij ons opslaat
              </span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

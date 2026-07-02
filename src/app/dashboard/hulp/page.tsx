import Link from "next/link";
import { tools } from "@/lib/tools";

// Per tool: hoe gebruik je 'm in een paar stappen, plus één tip die het verschil maakt.
const gids: Record<string, { stappen: string[]; tip: string }> = {
  toetsanalyse: {
    stappen: [
      "Kies het vak en plak of typ je toetsscores.",
      "De tool rekent zelf de niveaus en gemiddelden uit.",
      "Je krijgt een analyse per groep en per leerling, klaar om te bespreken of te downloaden.",
    ],
    tip: "De cijfers komen uit de rekenmachine van de tool, niet uit de AI. Die kloppen dus altijd.",
  },
  rapporten: {
    stappen: [
      "Je klas staat er vaak al. Klik een leerling aan.",
      "Zet een paar dingen aan die bij dit kind passen.",
      "Je krijgt een rapporttekst die je daarna nog kunt bijsturen: warmer, korter, of net even anders.",
    ],
    tip: "Hoe concreter je invult, hoe persoonlijker de tekst. Eén bijzonder detail maakt vaak het verschil.",
  },
  oudercontact: {
    stappen: [
      "Kies het soort bericht: weekbericht, oudergesprek of brief.",
      "Geef de hoofdpunten in steekwoorden.",
      "Je krijgt een nette tekst die zo de deur uit kan.",
    ],
    tip: "Steekwoorden zijn genoeg. Je hoeft geen hele zinnen te typen.",
  },
  plattegrond: {
    stappen: [
      "Kies je aantal tafels en de opstelling.",
      "Sleep de leerlingen op hun plek.",
      "Print de plattegrond of bewaar 'm voor later.",
    ],
    tip: "Hier komt geen AI aan te pas, dus je kunt eindeloos schuiven zonder iets te verbruiken.",
  },
  lesontwerp: {
    stappen: [
      "Geef je lesdoel op en kies het lestype.",
      "Stel differentiatie in als je dat wilt.",
      "Je krijgt een complete les met opbouw, bouwstenen en praktische tips.",
    ],
    tip: "Eén helder lesdoel geeft de beste les. Twijfel je? Begin klein en bouw uit.",
  },
};

// De dingen die je maar één keer instelt, en waar elke tool daarna profijt van heeft.
const slim = [
  {
    emoji: "👥",
    titel: "Vul je klas één keer in",
    tekst: "Zet je klas klaar onder Mijn klas. Daarna vullen de tools je leerlingen automatisch voor je in.",
    href: "/dashboard/mijn-klas",
    link: "Naar Mijn klas",
  },
  {
    emoji: "🎚️",
    titel: "Zet je stijl vast",
    tekst: "Bij Instellingen kies je toon, taalniveau en aanspreekvorm. Tools nemen dat automatisch over.",
    href: "/dashboard/instellingen",
    link: "Naar Instellingen",
  },
  {
    emoji: "🗂️",
    titel: "Jij bepaalt wat je bewaart",
    tekst: "We bewaren zo min mogelijk. Wil je een tekst terugvinden? Bewaar 'm zelf, dan staat hij klaar onder Mijn teksten.",
    href: "/dashboard/mijn-teksten",
    link: "Naar Mijn teksten",
  },
];

const vragen = [
  {
    vraag: "Gaan de namen van mijn leerlingen ergens heen?",
    antwoord:
      "Nee. Namen blijven op je eigen apparaat. Voordat een tool iets naar de AI stuurt, worden namen onleesbaar gemaakt. Privacy is bij ons de ruggengraat.",
  },
  {
    vraag: "Verzint de AI zelf cijfers?",
    antwoord:
      "Nee. De rekenmachine in de tool doet alle berekeningen, en die kloppen altijd. De AI schrijft alleen de tekst eromheen.",
  },
  {
    vraag: "Kan ik het resultaat nog aanpassen?",
    antwoord:
      "Altijd. Alles wat een tool maakt is een startpunt. Je stuurt bij met een knop of typt gewoon zelf verder tot het klopt zoals jij het wilt.",
  },
  {
    vraag: "Waar vind ik mijn gemaakte teksten terug?",
    antwoord:
      "We bewaren zo min mogelijk, dus bewaren doe je zelf. Sla een tekst op en je vindt 'm terug onder Mijn teksten, klaar om weer te openen of aan te passen.",
  },
  {
    vraag: "Kan ik het printen of downloaden?",
    antwoord:
      "Ja. De meeste tools hebben een download- of printknop, zodat je het resultaat zo mee kunt nemen naar je gesprek, rapport of prikbord.",
  },
  {
    vraag: "De AI maakt iets wat niet klopt. Wat nu?",
    antwoord:
      "Klik opnieuw of stuur bij, elke keer is net iets anders. Blijft er iets raars staan? Stuur een mailtje, dan kijken we mee.",
  },
  {
    vraag: "Moet ik iets installeren?",
    antwoord: "Nee. Avinka werkt gewoon in je browser. Inloggen en beginnen.",
  },
  {
    vraag: "Ik snap iets niet. Kan ik hulp krijgen?",
    antwoord:
      "Natuurlijk, en er is geen domme vraag bij. Stuur een mailtje en je krijgt antwoord van een echte leerkracht.",
  },
];

export default function HulpPage() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Hulp</h1>
      </div>

      {/* Zo haal je er het meeste uit — de drie dingen die je maar één keer doet. */}
      <section>
        <h2 className="text-xl font-bold text-ink">Zo haal je er het meeste uit</h2>
        <p className="mt-1 text-ink/60">Stel dit één keer in en elke tool wordt daarna makkelijker.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {slim.map((s) => (
            <div
              key={s.titel}
              className="flex flex-col rounded-3xl border border-black/5 bg-white p-6 shadow-sm"
            >
              <span className="text-2xl">{s.emoji}</span>
              <h3 className="mt-3 text-lg font-bold text-ink">{s.titel}</h3>
              <p className="mt-2 leading-7 text-ink/70">{s.tekst}</p>
              <Link
                href={s.href}
                className="mt-auto inline-block pt-3 text-sm font-bold text-brand hover:underline"
              >
                {s.link} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Per tool: wat kan het, en hoe pak je het aan. */}
      <section>
        <h2 className="text-xl font-bold text-ink">Wat kan elke tool, en hoe?</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {tools.map((tool) => {
            const g = gids[tool.slug];
            if (!g) return null;
            return (
              <div
                key={tool.slug}
                className="flex flex-col rounded-3xl border border-black/5 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={
                      "flex h-12 w-12 items-center justify-center rounded-2xl text-xl text-white shadow-sm " +
                      tool.badge
                    }
                  >
                    {tool.emoji}
                  </span>
                  <h3 className="text-lg font-bold text-ink">{tool.naam}</h3>
                </div>

                <ol className="mt-4 flex flex-col gap-3">
                  {g.stappen.map((stap, i) => (
                    <li key={i} className="flex gap-3">
                      <span
                        className={
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white " +
                          tool.badge
                        }
                      >
                        {i + 1}
                      </span>
                      <span className="leading-6 text-ink/75">{stap}</span>
                    </li>
                  ))}
                </ol>

                <p className={"mt-4 rounded-2xl p-3 text-sm leading-6 text-ink/75 " + tool.tint}>
                  💡 {g.tip}
                </p>

                <Link
                  href={tool.pad ?? `/dashboard/tools/${tool.slug}`}
                  className="mt-auto inline-block pt-4 text-sm font-bold text-brand hover:underline"
                >
                  {tool.naam} openen →
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Veelgestelde vragen. */}
      <section>
        <h2 className="text-xl font-bold text-ink">Veelgestelde vragen</h2>
        <div className="mt-4 space-y-3">
          {vragen.map((v) => (
            <details
              key={v.vraag}
              className="group rounded-2xl border border-black/5 bg-white p-5 [&_summary]:cursor-pointer"
            >
              <summary className="flex list-none items-center justify-between text-base font-bold text-ink">
                {v.vraag}
                <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 leading-7 text-ink/70">{v.antwoord}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Contact. */}
      <section className="rounded-3xl bg-brand-soft p-6 sm:p-7">
        <h2 className="text-lg font-bold text-ink">Kom je er niet uit?</h2>
        <p className="mt-2 leading-7 text-ink/70">
          Loop je ergens vast of mis je iets? Mail gerust naar{" "}
          <a
            href="mailto:michaelvanspanje@hotmail.com"
            className="font-bold text-brand hover:underline"
          >
            michaelvanspanje@hotmail.com
          </a>{" "}
          en je krijgt antwoord van een echte leerkracht. Jouw tip maakt Avinka beter voor iedereen.
        </p>
      </section>
    </div>
  );
}

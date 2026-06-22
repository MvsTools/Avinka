import { tools } from "@/lib/tools";

const uitleg: Record<string, string> = {
  toetswijs:
    "Plak je toetsresultaten en Toetsanalyse laat in één oogopslag zien hoe je groep ervoor staat. De cijfers worden door de tool zelf uitgerekend — die kloppen dus altijd.",
  rapportwijs:
    "Vertel kort wat je over een leerling weet, en Rapporten schrijft een warme rapporttekst die klinkt alsof jij 'm zelf schreef. Daarna pas je 'm aan naar smaak.",
  ouderwijs:
    "Voor weekberichten, nieuwsbrieven en ouderbrieven. Je geeft de hoofdpunten, Oudercontact maakt er een nette tekst van die zo de deur uit kan.",
  plattegrondwijs:
    "Maak je klasplattegrond met een paar klikken. Sleep de tafels op hun plek en je bent klaar. Hier komt geen AI aan te pas.",
};

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
    vraag: "Moet ik iets installeren?",
    antwoord: "Nee. Avinka werkt gewoon in je browser. Inloggen en beginnen.",
  },
  {
    vraag: "Ik snap iets niet of het werkt niet. Wat nu?",
    antwoord:
      "Geen probleem — daar is geen domme vraag bij. Stuur een mailtje en we helpen je verder.",
  },
];

export default function HulpPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Hulp</h1>
        <p className="mt-2 text-lg text-ink/70">
          Rustig uitgelegd, in gewone taal. Geen haast, geen domme vragen.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-bold text-ink">Wat doen de tools?</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <div
              key={tool.slug}
              className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  className={
                    "flex h-11 w-11 items-center justify-center rounded-xl text-xl text-white " +
                    tool.badge
                  }
                >
                  {tool.emoji}
                </span>
                <h3 className="text-lg font-bold text-ink">{tool.naam}</h3>
              </div>
              <p className="mt-3 leading-7 text-ink/70">{uitleg[tool.slug]}</p>
            </div>
          ))}
        </div>
      </section>

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

      <section className="rounded-3xl bg-brand-soft p-6 sm:p-7">
        <h2 className="text-lg font-bold text-ink">Hulp nodig?</h2>
        <p className="mt-2 leading-7 text-ink/70">
          Loop je ergens vast? Mail gerust naar{" "}
          <a
            href="mailto:michaelvanspanje@hotmail.com"
            className="font-bold text-brand hover:underline"
          >
            michaelvanspanje@hotmail.com
          </a>{" "}
          — je krijgt antwoord van een echte leerkracht.
        </p>
      </section>
    </div>
  );
}

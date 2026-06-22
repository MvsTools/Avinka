import { existsSync } from "fs";
import path from "path";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { signout } from "@/app/auth/actions";
import Prijzen from "@/components/Prijzen";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import { PROEF_DAGEN } from "@/lib/abonnement";

/* ──────────────────────────────────────────────────────────────────────────
   ALLE TEKSTEN STAAN HIERBOVEN, OP ÉÉN PLEK.
   Wil je iets aanpassen (een zin, prijs, vraag)? Pas het hier aan.
   ────────────────────────────────────────────────────────────────────────── */

const BELOFTE_VOOR = "Win elke week";
const BELOFTE_ACCENT = "2 uur";
const BELOFTE_NA = "terug";

const pijnpunten = [
  {
    emoji: "📋",
    titel: "Te veel administratie",
    tekst: "Je wilt er zijn voor je klas, maar raakt steeds meer tijd kwijt aan formulieren, analyses en verslagen.",
  },
  {
    emoji: "🧩",
    titel: "Alles staat verspreid",
    tekst: "Voor elke taak weer een andere tool, website of document. Niets komt op één plek samen.",
  },
  {
    emoji: "⏰",
    titel: "Het werk gaat mee naar huis",
    tekst: "Avonden en weekenden vullen zich met taken die je eigenlijk allang af had willen hebben.",
  },
];

// Elke tool heeft een eigen kleur, zodat de vakjes leven.
const tools = [
  {
    naam: "Toetsanalyse",
    emoji: "📊",
    tekst:
      "In één oogopslag zie je hoe je groep ervoor staat en wie wat extra aandacht kan gebruiken. Geen uren meer puzzelen in Excel.",
    badge: "bg-sky-500",
    tint: "bg-sky-50",
    rand: "hover:border-sky-300",
  },
  {
    naam: "Rapporten",
    emoji: "📝",
    tekst:
      "Warme, persoonlijke rapportteksten die klinken alsof jij ze schreef. Want dat deed je, alleen een stuk sneller.",
    badge: "bg-violet-500",
    tint: "bg-violet-50",
    rand: "hover:border-violet-300",
  },
  {
    naam: "Oudercontact",
    emoji: "✉️",
    tekst:
      "Weekberichten, nieuwsbrieven en ouderbrieven die zo de deur uit kunnen. Nooit meer staren naar een leeg scherm.",
    badge: "bg-rose-500",
    tint: "bg-rose-50",
    rand: "hover:border-rose-300",
  },
  {
    naam: "Plattegrond",
    emoji: "🪑",
    tekst:
      "Schuif je klasplattegrond in elkaar met een paar klikken. Of laat Avinka slim plaatsen op basis van je sociogram, met jouw wensen altijd als leidend.",
    badge: "bg-amber-500",
    tint: "bg-amber-50",
    rand: "hover:border-amber-300",
  },
];

const geruststellingen = [
  {
    titel: "Niet ingewikkeld",
    tekst: "Net zo makkelijk als een mailtje typen. Je hoeft niets te leren en weet meteen wat je moet doen.",
    tint: "bg-sky-50",
    kleur: "text-sky-600",
    icon: (
      <>
        <path d="M5 3v4M3 5h4" />
        <path d="M13 4l2.2 5.8L21 12l-5.8 2.2L13 20l-2.2-5.8L5 12l5.8-2.2L13 4z" />
      </>
    ),
  },
  {
    titel: "Namen blijven privé",
    tekst: "Privacy is ons belangrijkste uitgangspunt. Namen van leerlingen gaan nooit naar AI.",
    tint: "bg-emerald-50",
    kleur: "text-emerald-600",
    icon: (
      <>
        <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  },
  {
    titel: "Jij beslist altijd",
    tekst: "Avinka schrijft de voorzet, jij houdt het laatste woord. Niets gaat zonder jou de deur uit.",
    tint: "bg-violet-50",
    kleur: "text-violet-600",
    icon: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </>
    ),
  },
];

// VERVANG met ECHTE quotes uit je testgroep voordat je live gaat.
const ervaringen = [
  {
    quote: "[Hier komt een echte quote van een leerkracht uit je testgroep, bijvoorbeeld over tijdwinst.]",
    naam: "[Voornaam]",
    rol: "[groep / school]",
    kleur: "bg-sky-500",
  },
  {
    quote: "[Een tweede echte reactie, bijvoorbeeld over hoe makkelijk of fijn het werkt.]",
    naam: "[Voornaam]",
    rol: "[groep / school]",
    kleur: "bg-violet-500",
  },
  {
    quote: "[Een derde echte reactie, bijvoorbeeld over de rapporten of de oudercommunicatie.]",
    naam: "[Voornaam]",
    rol: "[groep / school]",
    kleur: "bg-rose-500",
  },
];

const faq = [
  {
    vraag: "Gaan de gegevens van mijn leerlingen ergens heen?",
    antwoord:
      "Nee. Namen, plaatsen en contactgegevens worden op je eigen apparaat onleesbaar gemaakt voordat er iets wordt verstuurd. Je account staat bovendien op beveiligde servers in Europa. Privacy is bij Avinka de ruggengraat, geen bijzaak.",
  },
  {
    vraag: "Moet ik verstand van AI of computers hebben?",
    antwoord:
      "Nee. Als je een e-mail kunt sturen, kun je met Avinka werken. Je typt of plakt wat je hebt en de tool doet de rest. Geen handleiding, geen technisch gedoe.",
  },
  {
    vraag: "Verzint de AI zelf cijfers of feiten?",
    antwoord:
      "Nee. Alle berekeningen doet de tool zelf, en die kloppen altijd. De AI schrijft alleen de tekst eromheen en verzint nooit getallen of feiten. Jij leest na en houdt altijd het laatste woord.",
  },
  {
    vraag: "Hoe werkt de gratis proefperiode?",
    antwoord: `Je probeert Avinka ${PROEF_DAGEN} dagen volledig gratis uit, met toegang tot alle tools. Je hoeft vooraf geen betaalgegevens in te vullen. Bevalt het? Dan kies je daarna zelf een abonnement. Wil je niet verder, dan stopt het vanzelf en betaal je niets.`,
  },
  {
    vraag: "Welk abonnement past bij mij?",
    antwoord:
      "Gebruik je één tool? Dan is Start genoeg. Wil je alle tools en je klassen automatisch koppelen? Dan is Compleet de logische keuze, en die kiezen de meeste leerkrachten. Pro is er voor wie het maximale uit Avinka wil halen.",
  },
  {
    vraag: "Wat is het verschil tussen maandelijks en per schooljaar?",
    antwoord:
      "Bij maandelijks betaal je per maand en zeg je op wanneer je wilt. Bij een schooljaar-abonnement betaal je ook gewoon per maand, maar zijn juli en augustus gratis. Je hoeft in de zomer niets stop te zetten en je houdt je klassen en bewaarde werk.",
  },
  {
    vraag: "Kan ik later wisselen of opzeggen?",
    antwoord:
      "Het maandabonnement kun je altijd opzeggen, zonder kleine lettertjes. Upgraden naar een groter pakket kan op elk moment. Het schooljaar-abonnement loopt een heel schooljaar; daar staat tegenover dat de zomermaanden gratis zijn.",
  },
  {
    vraag: "Werkt het op mijn laptop, Chromebook of tablet?",
    antwoord:
      "Ja. Avinka werkt gewoon in je browser op elk apparaat. Je hoeft niets te installeren: inloggen en beginnen.",
  },
  {
    vraag: "Is het ook voor mijn hele school of team?",
    antwoord:
      "Avinka is nu gemaakt voor jou als individuele leerkracht. Een variant voor teams en scholen komt later.",
  },
];

/* ── Kleine bouwstenen ─────────────────────────────────────────────────── */


// De product-illustratie in de hero: een nagebootst app-venster met mini-grafiek.
function AppMock() {
  const balken = [60, 85, 45, 95, 70];
  return (
    <div className="relative">
      {/* zwevende badges */}
      <div className="absolute -left-4 -top-4 z-10 rotate-[-6deg] rounded-2xl bg-white px-4 py-2 text-sm font-bold text-ink shadow-lg ring-1 ring-black/5">
        ⏱️ +2 uur
      </div>
      <div className="absolute -bottom-4 -right-3 z-10 max-w-[14rem] rotate-[5deg] rounded-2xl bg-white px-4 py-2 text-sm font-bold leading-snug text-ink shadow-lg ring-1 ring-black/5">
        Van een leerkracht, voor leerkrachten
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* vensterbalk */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="ml-3 rounded-md bg-white px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
            Toetsanalyse · Groep 5
          </span>
        </div>
        {/* inhoud */}
        <div className="p-6">
          <p className="text-sm font-semibold text-slate-400">Overzicht rekenen</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-sky-50 p-3">
              <p className="text-2xl font-extrabold text-sky-600">82%</p>
              <p className="text-xs text-slate-500">gemiddeld</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="text-2xl font-extrabold text-emerald-600">18</p>
              <p className="text-xs text-slate-500">op niveau</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-2xl font-extrabold text-amber-600">4</p>
              <p className="text-xs text-slate-500">aandacht</p>
            </div>
          </div>
          <div className="mt-5 flex h-28 items-end gap-3 rounded-xl bg-slate-50 p-4">
            {balken.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-lg bg-gradient-to-t from-brand to-emerald-400"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── De pagina ─────────────────────────────────────────────────────────── */

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Toont automatisch de foto zodra die in public/ staat; anders een MvS-monogram.
  const fotoBestand = ["michael.jpg", "michael.jpeg", "michael.png", "michael.webp"].find(
    (f) => existsSync(path.join(process.cwd(), "public", f)),
  );

  return (
    <div className="flex flex-1 flex-col">
      {/* Bovenbalk */}
      <header className="sticky top-0 z-20 border-b border-black/5 bg-cream/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <Logo vol className="h-10 w-auto" priority />
          </div>
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="#prijzen"
              className="hidden rounded-lg px-3 py-2 text-base font-semibold text-ink/70 hover:text-ink sm:inline"
            >
              Prijzen
            </a>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-brand px-4 py-2 text-base font-bold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-dark"
                >
                  Mijn dashboard
                </Link>
                <form action={signout}>
                  <button
                    type="submit"
                    className="rounded-lg px-3 py-2 text-base font-semibold text-ink/70 hover:text-ink"
                  >
                    Uitloggen
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="rounded-lg px-4 py-2 text-base font-semibold text-ink/70 hover:text-ink"
                >
                  Inloggen
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-xl bg-brand px-4 py-2 text-base font-bold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-dark"
                >
                  Probeer gratis
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* 1. HERO */}
        <section className="relative overflow-hidden">
          {/* decoratieve gloed */}
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 top-40 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
          <div className="bg-dots absolute inset-0 opacity-60" />

          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pt-8 pb-20 lg:grid-cols-2 lg:pt-12">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-ink sm:text-6xl">
                {BELOFTE_VOOR}{" "}
                <span className="relative whitespace-nowrap text-brand">
                  {BELOFTE_ACCENT}
                  <svg
                    viewBox="0 0 200 12"
                    className="absolute -bottom-2 left-0 w-full text-accent"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M2 9C40 3 160 3 198 7"
                      stroke="currentColor"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{" "}
                {BELOFTE_NA}
              </h1>
              <p className="mx-auto mt-7 max-w-xl text-lg leading-8 text-ink/70 lg:mx-0 sm:text-xl">
                Avinka vermindert de administratieve werkdruk van leerkrachten met
                slimme AI-tools. Minder uitzoekwerk, minder typwerk, meer tijd voor
                lesgeven en persoonlijke aandacht.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  href="/sign-up"
                  className="w-full rounded-2xl bg-brand px-8 py-4 text-lg font-bold text-white shadow-lg shadow-brand/25 transition hover:-translate-y-0.5 hover:bg-brand-dark sm:w-auto"
                >
                  Probeer Avinka gratis
                </Link>
                <a
                  href="#tools"
                  className="w-full rounded-2xl border-2 border-ink/10 bg-white px-8 py-4 text-lg font-bold text-ink transition hover:border-ink/20 sm:w-auto"
                >
                  Bekijk de tools
                </a>
              </div>
            </div>

            <div className="lg:pl-6">
              <AppMock />
            </div>
          </div>
        </section>

        {/* 2. VERTROUWENSSTRIP */}
        <section className="border-y border-black/5 bg-white">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-5 text-sm font-bold text-ink/70">
            <span>🔒 Privacy als uitgangspunt</span>
            <span className="hidden text-ink/15 sm:inline">•</span>
            <span>🇳🇱 Volledig Nederlands</span>
            <span className="hidden text-ink/15 sm:inline">•</span>
            <span>💜 Door een leerkracht gemaakt</span>
            <span className="hidden text-ink/15 sm:inline">•</span>
            <span>✓ Maandelijks opzegbaar</span>
          </div>
        </section>

        {/* 3. PROBLEEM */}
        <section className="mx-auto w-full max-w-6xl px-6 py-24">
          <h2 className="text-center text-4xl font-black tracking-tight text-ink">
            Herken je dit?
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {pijnpunten.map((pijn) => (
              <div
                key={pijn.titel}
                className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-3xl">
                  {pijn.emoji}
                </span>
                <h3 className="mt-5 text-xl font-bold text-ink">{pijn.titel}</h3>
                <p className="mt-2 text-lg font-medium leading-8 text-ink/70">
                  {pijn.tekst}
                </p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-14 max-w-2xl text-center text-2xl font-black leading-snug tracking-tight text-ink sm:text-3xl">
            Het hoort bij het werk. Maar het kan{" "}
            <span className="text-brand">sneller, slimmer en efficiënter</span>.
          </p>
        </section>

        {/* 4. OPLOSSING */}
        <section className="relative overflow-hidden bg-ink text-white">
          <div className="bg-grid absolute inset-0 opacity-[0.07]" />
          <div className="relative mx-auto w-full max-w-3xl px-6 py-24 text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-accent">
              De oplossing
            </span>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white">
              Minder administratie, meer onderwijs
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/75">
              Veel taken in het onderwijs kosten tijd, maar vragen niet altijd om
              jouw volledige aandacht. Avinka ondersteunt bij analyses, rapportages
              en andere administratieve werkzaamheden, zodat jij sneller kunt
              werken zonder in te leveren op kwaliteit.
            </p>
            <p className="mt-8 inline-block rounded-2xl bg-white/10 px-6 py-3 text-lg font-bold text-white ring-1 ring-white/15">
              Meer rust. Minder werkdruk. Meer tijd voor onderwijs.
            </p>
          </div>
        </section>

        {/* 5. TOOLS */}
        <section id="tools" className="mx-auto w-full max-w-6xl px-6 py-24">
          <h2 className="text-center text-4xl font-black tracking-tight text-ink">
            Alles wat je nodig hebt, op één plek
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-ink/60">
            Het platform groeit met je mee: er komen steeds nieuwe tools bij die
            je werk lichter maken.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {tools.map((tool) => (
              <div
                key={tool.naam}
                className={
                  "group flex items-start gap-5 rounded-3xl border border-black/5 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md " +
                  tool.rand
                }
              >
                <span
                  className={
                    "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl text-white shadow-sm " +
                    tool.badge
                  }
                >
                  {tool.emoji}
                </span>
                <div>
                  <h3 className="text-2xl font-bold text-ink">{tool.naam}</h3>
                  <p className="mt-2 leading-7 text-ink/70">{tool.tekst}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. HOE HET WERKT */}
        <section className="relative bg-white">
          <div className="mx-auto w-full max-w-6xl px-6 py-24">
            <h2 className="text-center text-4xl font-black tracking-tight text-ink">
              Waar je op kunt rekenen
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-lg text-ink/60">
              Eenvoudig in gebruik, veilig met gegevens, en jij houdt altijd de regie.
            </p>
            <div className="mt-14 grid gap-6 sm:grid-cols-3">
              {geruststellingen.map((g) => (
                <div
                  key={g.titel}
                  className="rounded-3xl border border-black/5 bg-cream p-8 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl " +
                        g.tint +
                        " " +
                        g.kleur
                      }
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        {g.icon}
                      </svg>
                    </span>
                    <h3 className="text-xl font-bold text-ink">{g.titel}</h3>
                  </div>
                  <p className="mt-4 leading-7 text-ink/70">{g.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. ERVARINGEN */}
        <section className="mx-auto w-full max-w-6xl px-6 py-24">
          <h2 className="text-center text-4xl font-black tracking-tight text-ink">
            Wat leerkrachten zeggen
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {ervaringen.map((e, i) => (
              <figure
                key={i}
                className="flex h-full flex-col rounded-3xl border border-black/5 bg-white p-7 shadow-sm"
              >
                <div className="text-amber-400">★★★★★</div>
                <blockquote className="mt-4 flex-1 text-lg leading-8 text-ink/80">
                  {e.quote}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span
                    className={
                      "flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-white " +
                      e.kleur
                    }
                  >
                    ?
                  </span>
                  <span>
                    <span className="block font-bold text-ink">{e.naam}</span>
                    <span className="block text-sm text-ink/55">{e.rol}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* 8. VAN EEN LEERKRACHT, VOOR LEERKRACHTEN */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-24">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand to-emerald-700 px-8 py-16 text-center text-white shadow-xl sm:px-16">
            <div className="bg-dots absolute inset-0 opacity-20" />
            <div className="relative mx-auto max-w-3xl">
              <span className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white/15 ring-4 ring-white/20">
                {fotoBestand ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/${fotoBestand}`}
                    alt="Michael van Spanje"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-display text-2xl font-black text-white">MvS</span>
                )}
              </span>
              <h2 className="mt-6 text-4xl font-black tracking-tight text-white">
                Van een leerkracht, voor leerkrachten
              </h2>
              <p className="mt-6 text-lg leading-8 text-white/85">
                Ik ben Michael. Net als jij sta ik voor de klas. Ik weet hoeveel
                tijd er gaat naar rapporten, analyses en andere administratieve
                taken. Daarom ben ik begonnen met het bouwen van slimme
                hulpmiddelen die dat werk sneller en eenvoudiger maken. Geen
                ingewikkelde technologie, maar praktische tools die direct tijd
                besparen en zorgvuldig omgaan met de privacy van je leerlingen.
              </p>
              <p className="mt-4 text-lg leading-8 text-white/85">
                Wat begon als een oplossing voor mijn eigen werk, groeide uit tot
                een bredere missie. Ik geloof dat leerkrachten veel meer voordeel
                kunnen halen uit de mogelijkheden van AI dan nu vaak gebeurt. Niet
                omdat ze niet willen, maar omdat de meeste oplossingen te technisch
                of te ingewikkeld zijn. Met Avinka wil ik laten zien dat slimmer
                werken juist eenvoudig kan zijn.
              </p>
              <p className="mt-6 text-lg font-semibold leading-8 text-white">
                Want goede leerkrachten horen hun tijd te besteden aan leerlingen,
                niet aan onnodig papierwerk.
              </p>
              <p className="mt-8 font-display text-xl italic text-white">
                Michael van Spanje
              </p>
              <p className="text-sm text-white/70">Leerkracht &amp; maker van Avinka</p>
            </div>
          </div>
        </section>

        {/* 9. PRIJZEN */}
        <Prijzen />

        {/* 10. FAQ */}
        <section id="vragen" className="scroll-mt-8 bg-white">
          <div className="mx-auto w-full max-w-3xl px-6 py-24">
            <h2 className="text-center text-4xl font-black tracking-tight text-ink">
              Veelgestelde vragen
            </h2>
            <div className="mt-12 space-y-4">
              {faq.slice(0, 4).map((item) => (
                <details
                  key={item.vraag}
                  className="group/faq rounded-2xl border border-black/5 bg-cream p-6 [&_summary]:cursor-pointer"
                >
                  <summary className="flex list-none items-center justify-between text-lg font-bold text-ink">
                    {item.vraag}
                    <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-transform group-open/faq:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 leading-8 text-ink/70">{item.antwoord}</p>
                </details>
              ))}

              <details className="group/more">
                <summary className="flex cursor-pointer list-none items-center justify-center gap-2 py-2 text-center text-base font-bold text-brand hover:underline">
                  Nog meer veelgestelde vragen
                  <span className="text-lg transition-transform group-open/more:rotate-180">
                    ⌄
                  </span>
                </summary>
                <div className="mt-4 space-y-4">
                  {faq.slice(4).map((item) => (
                    <details
                      key={item.vraag}
                      className="group/faq rounded-2xl border border-black/5 bg-cream p-6 [&_summary]:cursor-pointer"
                    >
                      <summary className="flex list-none items-center justify-between text-lg font-bold text-ink">
                        {item.vraag}
                        <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-transform group-open/faq:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="mt-4 leading-8 text-ink/70">{item.antwoord}</p>
                    </details>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* 11. SLOT-CTA */}
        <section className="relative overflow-hidden bg-ink">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-brand/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative mx-auto w-full max-w-3xl px-6 py-24 text-center">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Minder administratie, meer onderwijs
            </h2>
            <Link
              href="/sign-up"
              className="mt-9 inline-block rounded-2xl bg-white px-8 py-4 text-lg font-black text-brand shadow-lg transition hover:-translate-y-0.5"
            >
              Probeer Avinka gratis
            </Link>
          </div>
        </section>
      </main>

      {/* Voettekst */}
      <Footer maxWidth="max-w-6xl" />
    </div>
  );
}

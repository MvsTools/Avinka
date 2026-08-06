"use client";

// Mijn abonnement — toont je echte stand (gratis proef of gekozen plan) en de
// drie pakketten. De pakketten komen uit de centrale config (lib/abonnement),
// zodat dit scherm, de tier-regels en later Mollie altijd gelijk lopen.
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAbonnement } from "@/lib/db";
import {
  type Abonnement,
  type Vorm,
  BETALINGEN_LIVE,
  PLANNEN,
  PROEF_DAGEN,
  planById,
  prijsTekst,
  proefLoopt,
  proefDagenResterend,
} from "@/lib/abonnement";

export default function AbonnementView() {
  const [ab, setAb] = useState<Abonnement | null>(null);
  const [vorm, setVorm] = useState<Vorm>("maand");
  const [bezig, setBezig] = useState<string | null>(null); // plan-id dat laadt
  const [melding, setMelding] = useState<"ok" | "mislukt" | "fout" | null>(null);
  const [toonPakketten, setToonPakketten] = useState(false); // pas open na "Wijzig"

  useEffect(() => {
    getAbonnement().then(setAb);
    const q = new URLSearchParams(window.location.search);
    // Terug van Mollie? Toon een melding op basis van ?betaald=.
    const p = q.get("betaald");
    if (p === "1") setMelding("ok");
    else if (p === "0") setMelding("mislukt");
    else if (p === "fout") setMelding("fout");

    /* Binnengekomen via "Upgrade naar …" op de voorpagina (?wijzig=1). Dan is
       de keuze al gemaakt en zou het raar zijn om hier eerst nog op "Wijzig"
       te moeten klikken: de pakketten staan meteen open. ?vorm= neemt ook de
       maand/schooljaar-keuze van die pagina mee, zodat je 'm niet twee keer
       hoeft te maken. */
    if (q.get("wijzig") === "1") setToonPakketten(true);
    const v = q.get("vorm");
    if (v === "jaar" || v === "maand") setVorm(v);

    // Haal de parameters weg uit de URL, zodat de melding niet opnieuw
    // verschijnt als de pagina ververst wordt.
    if (p || q.get("wijzig") || v) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // Start het afrekenen: vraag een betaal-URL en stuur de gebruiker erheen.
  async function kiesPlan(planId: string) {
    setBezig(planId);
    try {
      const res = await fetch("/api/mollie/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: planId, vorm }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setBezig(null);
      setMelding("mislukt");
    } catch {
      setBezig(null);
      setMelding("mislukt");
    }
  }

  // Een echt gekozen, betaald pakket (niet de proef). Dan pakketten inklappen.
  const heeftActiefPlan = BETALINGEN_LIVE && ab != null && planById(ab.plan) != null;

  return (
    <div className="flex flex-col gap-8">
      {melding === "mislukt" && (
        <p className="rounded-2xl bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
          De betaling is niet afgerond. Je kunt het hieronder opnieuw proberen.
        </p>
      )}

      {/* De betaling is wél gelukt, maar wij konden je abonnement niet
          vastleggen. Nooit tonen als "mislukt": dan probeert iemand het opnieuw
          en betaalt hij twee keer. */}
      {melding === "fout" && (
        <p className="rounded-2xl bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">
          Je betaling is gelukt, maar er ging iets mis bij het vastleggen van je abonnement.
          Probeer het <strong>niet</strong> opnieuw — mail ons even op{" "}
          <a className="underline" href="mailto:support@avinka.nl">
            support@avinka.nl
          </a>
          , dan zetten we het meteen goed.
        </p>
      )}

      <HuidigeStand ab={ab} />

      {/* Heb je al een actief abonnement, dan staan de pakketten ingeklapt —
          anders is het dubbelop. Een knop "Wijzig je abonnement" vouwt ze uit.
          Tijdens de proef / zonder plan staan ze meteen open om te kiezen. */}
      {heeftActiefPlan && !toonPakketten ? (
        <div>
          <button
            type="button"
            onClick={() => setToonPakketten(true)}
            className="rounded-xl border-2 border-ink/10 px-5 py-2.5 text-sm font-bold text-ink transition hover:border-ink/20"
          >
            Wijzig je abonnement
          </button>
        </div>
      ) : (
      /* Alle abonnementen */
      <div id="pakketten" className="scroll-mt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-ink">
              {heeftActiefPlan ? "Kies een ander abonnement" : "Alle abonnementen"}
            </h3>
            <p className="mt-1 text-sm text-ink/55">
              Per maand opzegbaar. Of kies per schooljaar: dan zijn juli en augustus gratis.
            </p>
          </div>
          {heeftActiefPlan && (
            <button
              type="button"
              onClick={() => setToonPakketten(false)}
              className="shrink-0 rounded-xl px-3 py-1.5 text-sm font-semibold text-ink/60 transition hover:text-ink"
            >
              Inklappen
            </button>
          )}
        </div>

        {/* Maand of schooljaar */}
        <div className="mt-4 inline-flex rounded-2xl border border-black/10 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setVorm("maand")}
            className={
              "rounded-xl px-4 py-2 text-sm font-bold transition " +
              (vorm === "maand" ? "bg-brand text-white shadow-sm" : "text-ink/60 hover:text-ink")
            }
          >
            Maandelijks
          </button>
          <button
            type="button"
            onClick={() => setVorm("jaar")}
            className={
              "rounded-xl px-4 py-2 text-sm font-bold transition " +
              (vorm === "jaar" ? "bg-brand text-white shadow-sm" : "text-ink/60 hover:text-ink")
            }
          >
            Per schooljaar
          </button>
        </div>

        <div className="mt-4 grid items-stretch gap-4 sm:grid-cols-3">
          {/* Wijzig je je abonnement, dan tonen we alleen de ándere pakketten —
              je huidige staat immers al groot bovenaan. */}
          {(heeftActiefPlan ? PLANNEN.filter((p) => p.id !== ab?.plan) : PLANNEN).map((p) => {
            const isHuidig = ab?.plan === p.id;
            return (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm ${
                  p.held && !heeftActiefPlan ? "border-brand" : "border-black/5"
                }`}
              >
                {p.held && !heeftActiefPlan && (
                  <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white shadow-sm">
                    Meest gekozen
                  </span>
                )}
                <h4 className="font-serif text-xl font-semibold text-ink">{p.naam}</h4>
                <p className="mt-1 text-2xl font-black text-ink">
                  {prijsTekst(p.prijsMaand)}
                  <span className="text-sm font-medium text-ink/50"> p/m</span>
                </p>
                {vorm === "jaar" && (
                  <p className="mt-0.5 text-sm font-bold text-emerald-700">
                    Maandelijkse betaling · juli en augustus gratis
                  </p>
                )}
                <p className="mt-0.5 text-sm text-ink/55">{p.tagline}</p>
                <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm text-ink/75">
                  {p.voordelen.map((v) => (
                    <li key={v} className="flex items-start gap-2">
                      <span className="mt-0.5 text-emerald-600">✓</span>
                      {v}
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  {isHuidig ? (
                    <span className="block rounded-xl bg-brand-soft py-2.5 text-center text-sm font-bold text-brand">
                      Je huidige abonnement
                    </span>
                  ) : !BETALINGEN_LIVE ? (
                    <button
                      disabled
                      title="Binnenkort beschikbaar"
                      className="block w-full cursor-not-allowed rounded-xl border border-black/10 py-2.5 text-center text-sm font-semibold text-ink/40"
                    >
                      Binnenkort
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => kiesPlan(p.id)}
                      disabled={bezig !== null}
                      className={
                        "block w-full rounded-xl py-2.5 text-center text-sm font-bold transition disabled:opacity-60 " +
                        (p.held && !heeftActiefPlan
                          ? "bg-brand text-white shadow-lg shadow-brand/25 hover:bg-brand-dark"
                          : "border-2 border-ink/10 text-ink hover:border-ink/20")
                      }
                    >
                      {bezig === p.id ? "Een momentje…" : `Kies ${p.naam}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Pop-up na een geslaagde betaling: een feestelijk welkomstmoment met
          een knop die meteen naar het dashboard gaat. */}
      {melding === "ok" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl sm:p-10">
            <button
              type="button"
              onClick={() => setMelding(null)}
              aria-label="Sluiten"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink/40 transition hover:bg-black/5 hover:text-ink"
            >
              ✕
            </button>
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand to-violet-500 text-4xl shadow-lg shadow-brand/25">
              🎉
            </span>
            <h2 className="mt-5 font-serif text-3xl font-semibold text-ink">
              Welkom bij Avinka{planById(ab?.plan) ? ` ${planById(ab?.plan)!.naam}` : ""}
            </h2>
            <p className="mx-auto mt-3 max-w-sm leading-7 text-ink/70">
              Je abonnement is actief. Bedankt voor je vertrouwen, fijn dat je erbij
              bent.
              {planById(ab?.plan)?.toegang === "alle"
                ? " Je hebt nu volledige toegang tot alle tools van Avinka."
                : " Kies hierna welke tool je wilt gebruiken."}
            </p>
            <Link
              href={planById(ab?.plan)?.toegang === "keuze" ? "/dashboard/kies-tool" : "/dashboard"}
              className="mt-7 inline-block w-full rounded-2xl bg-brand px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark"
            >
              {planById(ab?.plan)?.toegang === "keuze" ? "Kies je tool" : "Aan de slag"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// De bovenste kaart: laat zien waar je nu staat.
function HuidigeStand({ ab }: { ab: Abonnement | null }) {
  if (!ab) {
    return (
      <div className="h-40 animate-pulse rounded-3xl border border-black/5 bg-white/60" />
    );
  }

  const opProef = proefLoopt(ab);
  const dagen = proefDagenResterend(ab);
  const plan = planById(ab.plan);

  // Tijdens de testfase (betalingen nog niet live): geruststellende uitleg.
  if (!BETALINGEN_LIVE) {
    return (
      <div className="rounded-3xl border-2 border-brand bg-white p-7 shadow-sm sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
          ⭐ Testfase
        </span>
        <h2 className="mt-3 font-serif text-3xl font-semibold text-ink">
          Je gebruikt Avinka volledig gratis
        </h2>
        <p className="mt-2 text-ink/70">
          Tijdens de testfase heb je toegang tot alle tools. Zodra de abonnementen
          live gaan, kies je zelf een pakket en betaal je veilig per maand via iDEAL —
          en je zegt net zo makkelijk weer op.
        </p>
      </div>
    );
  }

  // Nog in de gratis proef: een compacte aftel-kaart die zacht aanzet tot kiezen.
  if (opProef) {
    const eindDatum = ab.proefEindigt
      ? new Date(ab.proefEindigt).toLocaleDateString("nl-NL", {
          day: "numeric",
          month: "long",
        })
      : "";
    const urgent = dagen <= 1;
    const bijna = dagen <= 3;
    const kleur = urgent ? "#e11d48" : bijna ? "#f59e0b" : "#2f9e6e";
    return (
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
        <p
          className="text-xs font-bold uppercase tracking-wide"
          style={{ color: kleur }}
        >
          Gratis proefperiode
        </p>
        <h2 className="mt-1 font-serif text-2xl font-semibold text-ink">
          Nog <span style={{ color: kleur }}>{dagen}</span>{" "}
          {dagen === 1 ? "dag" : "dagen"} gratis
        </h2>
        {/* Eén blokje per proefdag; dooft naarmate de tijd verstrijkt. */}
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: PROEF_DAGEN }).map((_, i) => (
            <div
              key={i}
              className="h-2 flex-1 rounded-full transition-all"
              style={{ background: i < dagen ? kleur : "#ece7dc" }}
            />
          ))}
        </div>
        <p className="mt-2.5 text-sm text-ink/60">
          {urgent
            ? "Verleng nu zodat je niets kwijtraakt."
            : `Je proefperiode loopt af op ${eindDatum}.`}
        </p>
      </div>
    );
  }

  // Proef voorbij en (nog) geen abonnement: een duidelijk, uitnodigend scherm.
  // De drie pakketten staan er direct onder, dus we wijzen daarheen.
  if (!plan) {
    return (
      <div className="rounded-3xl border-2 border-amber-300 bg-white p-7 shadow-sm sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
          ⏳ Proefperiode voorbij
        </span>
        <h2 className="mt-3 font-serif text-3xl font-semibold text-ink">
          Je gratis proefperiode is voorbij
        </h2>
        <p className="mt-2 max-w-xl text-ink/70">
          We hopen dat je hebt ervaren hoeveel tijd Avinka je kan besparen. Kies
          hieronder een abonnement om verder te werken met je klassen, je bewaarde
          werk en alle tools. Je houdt alles wat je hebt opgebouwd.
        </p>
      </div>
    );
  }

  // Actief abonnement.
  return (
    <div className="rounded-3xl border-2 border-brand bg-white p-7 shadow-sm sm:p-8">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
        ⭐ Je huidige abonnement
      </span>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-serif text-3xl font-semibold text-ink">{plan.naam}</h2>
        <span className="text-lg font-bold text-ink">
          {prijsTekst(plan.prijsMaand)}{" "}
          <span className="text-sm font-medium text-ink/50">per maand</span>
        </span>
      </div>
      <ul className="mt-5 gap-x-8 sm:columns-2">
        {plan.voordelen.map((v) => (
          <li
            key={v}
            className="mb-2.5 flex items-start gap-2.5 break-inside-avoid text-ink/80"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
              ✓
            </span>
            {v}
          </li>
        ))}
      </ul>
    </div>
  );
}

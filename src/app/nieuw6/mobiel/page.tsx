import type { Metadata } from "next";

/* ──────────────────────────────────────────────────────────────────────────
   TELEFOONWEERGAVE OP JE EIGEN SCHERM — hoort bij de werkbank op /nieuw6.

   Waarom dit bestaat: om de mobiele weergave te beoordelen moet je hem zien,
   en dat lukte niet door het browservenster te verkleinen (Chrome negeert dat
   als het venster gemaximaliseerd staat). Een pagina in een venstertje van 390
   pixels breed heeft wél zijn eigen breedte, dus alle mobiele regels gelden
   daarbinnen precies zoals op een telefoon.

   Twee breedtes naast elkaar, en dat is met opzet:
   - 390 px is een gewone iPhone.
   - 360 px is de smalste breedte die je in de praktijk nog veel tegenkomt
     (Android). Wat daar past, past overal.

   ⚠️ TIJDELIJK, hoort bij /nieuw6. Gaat samen met de werkbank weg zodra de
   mobiele fix in de echte landingspagina zit.
   ────────────────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Telefoonweergave — werkbank",
  robots: { index: false, follow: false },
};

const TELEFOONS = [
  { naam: "iPhone", breedte: 390, hoogte: 844 },
  { naam: "Smalle Android", breedte: 360, hoogte: 800 },
];

export default function Telefoonweergave() {
  return (
    <main className="min-h-screen bg-ink/[0.04] px-6 py-8">
      <h1 className="text-2xl font-black text-ink">De landingspagina op een telefoon</h1>
      <p className="mt-1 max-w-2xl text-ink/70">
        Dit is <code className="rounded bg-ink/10 px-1.5 py-0.5 text-sm">/nieuw6</code>, de werkbank,
        in twee telefoonbreedtes. Je kunt er gewoon in scrollen en klikken. Ververs de pagina om een
        wijziging te zien.
      </p>

      <div className="mt-6 flex flex-wrap items-start gap-8">
        {TELEFOONS.map((t) => (
          <div key={t.naam}>
            <p className="mb-2 text-sm font-bold text-ink/60">
              {t.naam} · {t.breedte} px
            </p>
            <div
              className="overflow-hidden rounded-[2rem] border-[10px] border-ink/85 bg-white shadow-2xl"
              style={{ width: t.breedte, height: t.hoogte }}
            >
              <iframe
                src="/nieuw6"
                title={`Landingspagina op ${t.naam}`}
                style={{ width: t.breedte, height: t.hoogte, border: 0 }}
              />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

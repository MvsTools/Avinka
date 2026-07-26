"use client";

import { useMemo, useState } from "react";
import { DONKER, Golf, KOP, MINT, MINT_LICHT, KaartVlak, VLAK_MINT } from "./Wereld";

/* ── De privacysectie: bewijs het, vertel het niet ─────────────────────────
   Wat hier stond is drie keer gesneuveld: een uitlegblok met kaartjes ("die
   vind ik vreselijk"), en twee keer een filmische scène — laatst een duik
   onder water. Die laatste was mooi maar geleend: water heeft niets met
   leerkrachten te maken, en dat voel je.

   Het onderzoek naar hoe anderen dit doen gaf een duidelijk beeld. De norm is
   saai en voor ons ook niet bruikbaar: genummerde stappen (Apple), badges met
   SOC 2 / ISO naast de knop (die hebben we niet, en suggereren mag niet zolang
   het juristentraject loopt), en vergelijkingstabellen. In het onderwijs doet
   niemand iets bijzonders; privacy is daar een beleidsdocument.

   De uitzondering is de hoek waar privacy hét product is: browser-gebaseerde
   anonimiseerders. Die zetten allemaal een LIVE DEMO op de pagina, en daar zit
   de vondst — het uitblijven van een serverrondje is zélf het bewijs. Je hoeft
   niet te zeggen dat het op het apparaat gebeurt, je laat het zien doordat er
   niets laadt.

   Dat patroon lenen we, met één ding erbij dat die tools niet hebben: het gaat
   over een échte klas. Typ de namen van je eigen leerlingen en zie ze
   verdwijnen. Niemand gelooft een belofte zo goed als eentje die hij zelf net
   heeft getest.

   Eronder, heel rustig, de drie stappen voor wie het precies wil weten (dat is
   het Apple-patroon, en het kost bijna niets), en als afsluiter de lege plek —
   de enige grap op deze pagina die ook werkt als iemand alleen maar scant.

   ⚠️ Het maskeren hieronder is ECHT en gebeurt in de browser: hele woorden,
   hoofdletter-ongevoelig, precies zoals de platformlaag in
   public/avinka-masking.js het doet. Er gaat hier niets de deur uit. Dat moet
   ook zo blijven — de hele sectie staat of valt ermee dat de claim klopt. ── */

/* De voorbeeldzin waarin de namen landen. Bewust een echte rapportzin: zo zie
   je meteen dat het verhaal overeind blijft en alleen de naam verandert. Dat
   neemt de angst weg dat maskeren de tekst kapot maakt. */
function maakZin(namen: string[]) {
  const [a, b, c] = namen;
  const delen = [
    `${a} liet dit halfjaar een mooie groei zien bij spelling.`,
    b ? ` ${b} werkt geconcentreerder dan eerst.` : "",
    c ? ` En ${c} durft steeds vaker iets te vragen.` : "",
  ];
  return delen.join("");
}

const STANDAARD = "Sofie, Daan, Iris";
const SCHUILNAAM = (i: number) => `leerling ${String.fromCharCode(65 + i)}`;

/* Hele-woord-regex, hoofdletter-ongevoelig — dezelfde regel als de echte
   maskeerlaag. Door de woordgrenzen wordt "Sam" nooit uit "samen" geknipt. */
function woordRe(naam: string) {
  const veilig = naam.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const start = /^[A-Za-zÀ-ÿ0-9]/.test(naam) ? "\\b" : "";
  const eind = /[A-Za-zÀ-ÿ0-9]$/.test(naam) ? "\\b" : "";
  return new RegExp(start + veilig + eind, "gi");
}

const STAPPEN = [
  { nr: "01", tekst: "Je typt de naam van een leerling." },
  { nr: "02", tekst: "Nog op je eigen apparaat wordt die vervangen door een schuilnaam." },
  { nr: "03", tekst: "De AI ziet alleen die schuilnaam. Wij bewaren niets van de leerling." },
];

export function WereldPrivacy() {
  const [invoer, setInvoer] = useState(STANDAARD);

  const { namen, zin, gemaskeerd } = useMemo(() => {
    /* splitsen op komma's en spaties, dubbele eruit, en een bovengrens zodat
       iemand die de hele klassenlijst plakt de zin niet opblaast */
    const gevonden = Array.from(
      new Map(
        invoer
          .split(/[,;\n]+|\s{2,}/)
          .flatMap((d) => d.trim().split(/\s+/))
          .map((d) => d.trim())
          .filter((d) => d.length > 1)
          .map((d) => [d.toLowerCase(), d]),
      ).values(),
    ).slice(0, 3);

    const lijst = gevonden.length ? gevonden : ["Sofie", "Daan", "Iris"];
    const tekst = maakZin(lijst);
    let uit = tekst;
    lijst.forEach((n, i) => {
      uit = uit.replace(woordRe(n), SCHUILNAAM(i));
    });
    return { namen: lijst, zin: tekst, gemaskeerd: uit };
  }, [invoer]);

  /* de tekst in stukjes hakken zodat we de namen kunnen markeren */
  const markeer = (tekst: string, merken: string[], klasse: string) => {
    if (!merken.length) return tekst;
    const re = new RegExp(
      `(${merken.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
      "gi",
    );
    return tekst.split(re).map((deel, i) =>
      merken.some((m) => m.toLowerCase() === deel.toLowerCase()) ? (
        <mark key={i} className={klasse}>
          {deel}
        </mark>
      ) : (
        <span key={i}>{deel}</span>
      ),
    );
  };

  return (
    <section className="relative overflow-hidden" style={{ background: MINT_LICHT }}>
      <Golf kleur="#fcfbf7" flip vorm="oploopRechts" hoogte="h-[70px] sm:h-[118px]" />
      <KaartVlak
        kleur={VLAK_MINT}
        vorm="koepel"
        breedte={780}
        hoogte={380}
        style={{ right: "-14%", top: 120, transform: "rotate(-5deg)" }}
        className="hidden lg:block"
        tel={3}
      />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-28 pt-28 lg:pb-36 lg:pt-32">
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
          <p data-reveal style={{ transitionDelay: "80ms" }} className="mt-6 text-xl leading-9 text-ink/75">
            Gegevens van leerlingen bewaren we niet. En hun namen gaan nooit
            naar de AI: die worden op jouw eigen apparaat vervangen door een
            schuilnaam, nog vóór er iets wordt verstuurd.
          </p>
        </div>

        {/* ── De proef ── */}
        <div
          data-reveal
          style={{
            transitionDelay: "140ms",
            background: "#fffdf9",
            borderRadius: "3rem 2.2rem 3.2rem 2.4rem / 2.4rem 3.2rem 2.2rem 3rem",
            borderColor: "#d4e5dc",
            boxShadow: "-14px 34px 66px -34px rgba(23,80,58,0.6)",
          }}
          className="relative mt-14 border-[2.5px] px-7 py-9 sm:px-11 sm:py-11"
        >
          <span
            className="absolute left-[58%] top-[-18px] flex h-10 w-10 items-center justify-center rounded-2xl bg-brand shadow-md"
            style={{ translate: "-50% 0", rotate: "8deg" }}
            aria-hidden
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>

          <p className="text-2xl" style={{ fontFamily: "var(--font-hand)", color: KOP }}>
            probeer het maar
          </p>

          <label htmlFor="avinka-namen" className="mt-3 block font-display text-2xl font-black tracking-tight" style={{ color: DONKER }}>
            Typ de namen van een paar leerlingen uit je eigen klas.
          </label>

          <input
            id="avinka-namen"
            value={invoer}
            onChange={(e) => setInvoer(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            placeholder={STANDAARD}
            className="mt-5 w-full rounded-2xl border-[2.5px] border-[#d4e5dc] bg-white px-5 py-4 text-lg text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15"
          />

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            {/* wat jij schrijft */}
            <div className="rounded-2xl bg-[#f6f4ec] p-6">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-ink/45">
                Wat jij schrijft
              </p>
              <p className="mt-3 text-lg leading-8 text-ink/85">
                {markeer(zin, namen, "bg-transparent font-bold text-ink underline decoration-2 underline-offset-4 decoration-[#f59e0b]")}
              </p>
            </div>

            {/* wat de AI ontvangt */}
            <div className="rounded-2xl p-6" style={{ background: MINT }}>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em]" style={{ color: KOP }}>
                Wat de AI ontvangt
              </p>
              <p className="mt-3 text-lg leading-8 text-ink/85" aria-live="polite">
                {markeer(
                  gemaskeerd,
                  namen.map((_, i) => SCHUILNAAM(i)),
                  "rounded-md bg-white/80 px-1.5 font-bold text-[#1e6b4d]",
                )}
              </p>
            </div>
          </div>

          {/* Dit zinnetje is de kern van het bewijs: er laadt niets, want er
             gaat niets weg. Dat is precies waarom een live demo hier sterker
             is dan welke uitleg ook. */}
          <p className="mt-6 text-base leading-7 text-ink/60">
            Dit gebeurt volledig op jouw apparaat, hier in je browser. Er wordt
            niets verstuurd — je mag je internet er zelfs bij uitzetten.
          </p>
        </div>

        {/* ── De drie stappen, rustig ── */}
        <ol data-reveal className="mt-14 grid gap-8 sm:grid-cols-3">
          {STAPPEN.map((s) => (
            <li key={s.nr}>
              <p className="font-display text-sm font-black tracking-[0.3em]" style={{ color: KOP }}>
                {s.nr}
              </p>
              <p className="mt-2 text-lg leading-8 text-ink/75">{s.tekst}</p>
            </li>
          ))}
        </ol>

        {/* ── De lege plek ── */}
        <div
          data-reveal
          className="mt-14 rounded-[2rem] border-[2.5px] border-dashed px-8 py-10 text-center sm:px-12"
          style={{ borderColor: "#c6dcd0" }}
        >
          <p className="mx-auto max-w-xl text-lg leading-8 text-ink/70">
            Hier hadden we graag een voorbeeld laten zien van hoe wij met de
            gegevens van jouw leerlingen omgaan.
          </p>
          <p className="mx-auto mt-3 max-w-xl font-display text-xl font-black leading-8" style={{ color: DONKER }}>
            Daar hadden we gegevens van jouw leerlingen voor nodig gehad.
          </p>
        </div>
      </div>
    </section>
  );
}

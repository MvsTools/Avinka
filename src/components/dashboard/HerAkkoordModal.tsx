"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { heeftToestemmingVoor, registreerHerAkkoord } from "@/lib/db";
import { VOORWAARDEN, PRIVACY, WIJZIGING_SAMENVATTING } from "@/lib/juridisch";

// Verplichte her-akkoord-pop-up. Verschijnt zodra de versie van de voorwaarden of
// privacyverklaring die de leerkracht eerder accepteerde niet meer klopt met de
// huidige (of als er nog géén akkoord is vastgelegd). Je moet akkoord geven om
// verder te kunnen — geen sluitknop, niet weg te klikken. Het akkoord gaat naar de
// append-only bewijstabel via de RPC `registreer_herakkoord`.
export default function HerAkkoordModal() {
  const [status, setStatus] = useState<"laden" | "verborgen" | "open" | "bezig">("laden");
  const [eersteKeer, setEersteKeer] = useState(false);
  // Welk document is er gewijzigd? De pop-up noemde altijd allebei, ook als er
  // maar één was bijgewerkt — dan stond er "Onze voorwaarden zijn bijgewerkt"
  // boven een wijziging die alleen de privacyverklaring raakte. Onnodig
  // verwarrend, en op precies het scherm waar je dat het minst kunt hebben.
  const [wat, setWat] = useState<{ voorwaarden: boolean; privacy: boolean }>({
    voorwaarden: true,
    privacy: true,
  });
  const [fout, setFout] = useState(false);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) {
        setStatus("verborgen");
        return;
      }
      heeftToestemmingVoor(VOORWAARDEN.versie, PRIVACY.versie).then(
        ({ actueel, eersteKeer, voorwaardenOud, privacyOud }) => {
          if (actueel) {
            setStatus("verborgen");
            return;
          }
          setEersteKeer(eersteKeer);
          setWat({ voorwaarden: voorwaardenOud, privacy: privacyOud });
          setStatus("open");
        },
      );
    });
  }, []);

  async function akkoord() {
    setStatus("bezig");
    setFout(false);
    const ok = await registreerHerAkkoord(VOORWAARDEN.versie, PRIVACY.versie);
    if (ok) {
      setStatus("verborgen");
    } else {
      setFout(true);
      setStatus("open");
    }
  }

  if (status === "laden" || status === "verborgen") return null;

  const bezig = status === "bezig";
  const voorwaardenLink = (
    <Link href="/voorwaarden" target="_blank" className="font-semibold text-brand hover:underline">
      algemene voorwaarden
    </Link>
  );
  const privacyLink = (
    <Link href="/privacy" target="_blank" className="font-semibold text-brand hover:underline">
      privacyverklaring
    </Link>
  );

  // Alleen noemen wat er echt is bijgewerkt. Het lidwoord en het "lees hem/ze"
  // verschillen per geval, dus die staan hier bij elkaar in plaats van
  // verspreid door de tekst.
  const beide = wat.voorwaarden && wat.privacy;
  const kop = beide
    ? "Onze voorwaarden zijn bijgewerkt"
    : wat.privacy
      ? "Onze privacyverklaring is bijgewerkt"
      : "Onze algemene voorwaarden zijn bijgewerkt";
  const document = beide ? (
    <>
      {voorwaardenLink} en {privacyLink}
    </>
  ) : wat.privacy ? (
    privacyLink
  ) : (
    voorwaardenLink
  );
  const leesDoor = beide || wat.voorwaarden ? "Lees ze gerust even door." : "Lees hem gerust even door.";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-ink">
          {eersteKeer ? "Nog even bevestigen" : kop}
        </h2>

        <div className="mt-3 flex flex-col gap-2.5 leading-7 text-ink/75">
          {eersteKeer ? (
            <p>
              Bevestig even dat je akkoord gaat met onze {voorwaardenLink} en {privacyLink}. Zo
              blijft alles netjes vastgelegd.
            </p>
          ) : (
            <>
              <p>
                We hebben onze {document} bijgewerkt. {leesDoor}
              </p>
              {WIJZIGING_SAMENVATTING.length > 0 && (
                <div className="rounded-2xl bg-brand-soft px-4 py-3">
                  <p className="text-sm font-bold text-ink/80">Wat er veranderde:</p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-ink/70">
                    {WIJZIGING_SAMENVATTING.map((regel, i) => (
                      <li key={i}>{regel}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {fout && (
          <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            Er ging iets mis bij het opslaan. Probeer het zo nog eens.
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={akkoord}
            disabled={bezig}
            className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {bezig ? "Een momentje…" : "Ik ga akkoord"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { createClient } from "@/utils/supabase/client";
import { getWelkomGezien, markWelkomGezien } from "@/lib/db";
import { dagenSindsLive } from "@/lib/avinka";

// Eenmalige, warme welkomstpop-up voor de allereerste inlog. Kort gehouden zodat
// niemand 'm meteen wegklikt. De rest van het scherm vervaagt; alleen de
// Feedback-knop in het menu blijft scherp (opgelicht). Verschijnt precies één keer
// per account (vlag in de database) en binnen dezelfde sessie ook niet meer. De
// sessie-vlag staat PER ACCOUNT (sleutel + user-id), zodat een tweede account op
// dezelfde computer niet de stand van een ander erft.
const SESSIE_PREFIX = "avinka_welkom_weg_";

export default function WelkomModal() {
  const [open, setOpen] = useState(false);
  const [dagen, setDagen] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  // Eén keer beslissen of de pop-up mag verschijnen. Eerst het account ophalen,
  // zodat de "weggeklikt"-vlag per account werkt.
  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => {
      const id = data.user?.id ?? "anon";
      setUserId(id);
      try {
        if (sessionStorage.getItem(SESSIE_PREFIX + id) === "1") return;
      } catch {
        /* geen opslag */
      }
      getWelkomGezien().then((gezien) => {
        if (gezien) return;
        setDagen(dagenSindsLive());
        setOpen(true);
        void markWelkomGezien(); // meteen wegschrijven: ook al klik je de knop links, hij komt niet terug
      });
    });
  }, []);

  // Zolang de pop-up open is, laat de navigatie de Feedback-knop oplichten.
  // De opruiming vuurt óók bij wegnavigeren (bijv. als je op de knop klikt).
  useEffect(() => {
    if (!open) return;
    window.dispatchEvent(new Event("avinka-welkom-open"));
    return () => {
      window.dispatchEvent(new Event("avinka-welkom-dicht"));
    };
  }, [open]);

  function sluit() {
    try {
      if (userId) sessionStorage.setItem(SESSIE_PREFIX + userId, "1");
    } catch {
      /* geen opslag */
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <>
      {/* Vage, gedimde achtergrond over de rest van het scherm. */}
      <div className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm" />

      {/* De kaart zelf, gecentreerd. De wikkel laat klikken erlangs door, zodat de
          opgelichte Feedback-knop links aanklikbaar blijft. */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="pointer-events-auto relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-8">
          {/* Speels "dagen live"-vlaggetje, schuin, rechtsboven. */}
          <span className="absolute -right-3 -top-4 rotate-[7deg] rounded-full bg-accent px-4 py-2 text-sm font-extrabold text-white shadow-lg ring-2 ring-white">
            🎉 {dagen} {dagen === 1 ? "dag" : "dagen"} live
          </span>

          <button
            type="button"
            onClick={sluit}
            aria-label="Sluiten"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-ink/40 transition hover:bg-black/5 hover:text-ink"
          >
            ✕
          </button>

          <h2 className="flex flex-wrap items-center gap-2 pr-8 font-serif text-2xl font-semibold text-ink">
            Welkom bij <Logo className="h-7 w-auto -translate-y-0.5" />
          </h2>

          <div className="mt-3 flex flex-col gap-2.5 leading-7 text-ink/75">
            <p>Je bent een van onze allereerste gebruikers. Bedankt voor je vertrouwen! 💛</p>
            <p>
              Nog niet alles is perfect: ik bouw Avinka in mijn eentje, naast mijn baan als
              leerkracht. Loop je ergens tegenaan of kan iets beter?{" "}
              <strong className="text-ink">Laat het weten via feedback</strong>, dan pak ik het
              als eerste op.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={sluit}
              className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark"
            >
              Aan de slag
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

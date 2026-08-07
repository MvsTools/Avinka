"use client";

import { useRef, useState } from "react";

// Tijd typen in twee losse vakjes (uur / minuut) in plaats van de standaard
// <input type="time">. Die native versie springt al vanzelf door naar de
// minuten zodra het uur compleet is — dat nemen we hier over — maar bij
// backspace moet je daar zelf terugklikken naar het uur. Hier springt
// backspace op een leeg minutenvakje vanzelf terug, zonder klikken.

const VAKJE =
  "w-6 bg-transparent text-center text-sm tabular-nums text-ink outline-none placeholder:text-ink/35";

export default function TijdVeld({
  value,
  onChange,
  className = "",
}: {
  /** "HH:MM", of leeg als er nog niets staat. Wissel je van afspraak (een
   *  andere `key` op dit element), dan lees je hier gewoon opnieuw uit. */
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [uur, setUur] = useState(value.split(":")[0] ?? "");
  const [minuut, setMinuut] = useState(value.split(":")[1] ?? "");
  const uurRef = useRef<HTMLInputElement>(null);
  const minuutRef = useRef<HTMLInputElement>(null);

  const meld = (u: string, m: string) => {
    if (u.length === 2 && m.length === 2) onChange(`${u}:${m}`);
    else if (!u && !m) onChange("");
  };

  const wijzigUur = (ruw: string) => {
    const cijfers = ruw.replace(/\D/g, "").slice(-2);
    if (!cijfers) {
      setUur("");
      meld("", minuut);
      return;
    }
    // Een eerste cijfer van 3 t/m 9 kan nooit nog een tweede krijgen (geen
    // uur boven 23), dus die vullen we meteen aan tot "0X" en springen door.
    const compleet = cijfers.length === 2 || Number(cijfers) > 2;
    const u = compleet
      ? String(Math.min(23, Number(cijfers))).padStart(2, "0")
      : cijfers;
    setUur(u);
    meld(compleet ? u : "", minuut);
    if (compleet) {
      minuutRef.current?.focus();
      minuutRef.current?.select();
    }
  };

  const wijzigMinuut = (ruw: string) => {
    const cijfers = ruw.replace(/\D/g, "").slice(-2);
    if (!cijfers) {
      setMinuut("");
      meld(uur, "");
      return;
    }
    const compleet = cijfers.length === 2 || Number(cijfers) > 5;
    const m = compleet
      ? String(Math.min(59, Number(cijfers))).padStart(2, "0")
      : cijfers;
    setMinuut(m);
    meld(uur, compleet ? m : "");
  };

  return (
    <div
      className={
        "flex w-fit items-center gap-1 rounded-xl border border-black/10 bg-cream/50 px-3 py-2 transition-shadow focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgba(47,158,110,0.18)] " +
        className
      }
    >
      <input
        ref={uurRef}
        value={uur}
        onChange={(e) => wijzigUur(e.target.value)}
        onFocus={(e) => e.target.select()}
        inputMode="numeric"
        placeholder="uu"
        aria-label="Uur"
        maxLength={2}
        className={VAKJE}
      />
      <span className="font-bold text-ink/40">:</span>
      <input
        ref={minuutRef}
        value={minuut}
        onChange={(e) => wijzigMinuut(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && minuut === "") {
            e.preventDefault();
            uurRef.current?.focus();
            uurRef.current?.select();
          }
        }}
        onFocus={(e) => e.target.select()}
        inputMode="numeric"
        placeholder="mm"
        aria-label="Minuut"
        maxLength={2}
        className={VAKJE}
      />
    </div>
  );
}

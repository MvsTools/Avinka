"use client";

import { useFormStatus } from "react-dom";

// De knop die het token verzilvert. Client-component om één reden: zodra er
// geklikt is moet de knop op slot, anders levert een ongeduldige dubbele klik
// twee aanvragen op waarvan de tweede het token al gebruikt vindt.
//
// 🔑 De kleur is `brand-dark` (#25855a) en niet het gewone merkgroen (#2f9e6e).
// Wit op merkgroen haalt 3,37:1 en zakt daarmee door de AA-grens voor tekst
// onder 18,66px vet; deze tint haalt 4,58:1. De hover licht de knop dus ook niet
// op — dat zou het contrast juist weer verlagen — maar tilt hem op.
export default function Knop({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-7 inline-block rounded-2xl bg-brand-dark px-7 py-3.5 font-bold text-white shadow-lg shadow-brand-dark/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-dark/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark disabled:pointer-events-none disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {pending ? "Een momentje…" : label}
    </button>
  );
}

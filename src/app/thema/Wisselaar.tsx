"use client";

import Link from "next/link";
import { useState } from "react";
import { THEMAS, type ThemaId } from "./themas";

/* ── Het wisselknopje ───────────────────────────────────────────────────────
   Dit hoort NIET bij het ontwerp. Het is gereedschap om de vijf varianten met
   elkaar te vergelijken zonder telkens een URL te typen: je scrollt naar een
   plek, klikt door en ziet dezelfde sectie in een andere huid.

   Het staat daarom bewust in zijn eigen kleuren (neutraal grijs/zwart) en niet
   in die van het thema — anders vergelijk je het knopje mee. Het is
   uitklapbaar zodat het bij het beoordelen van de onderkant van de pagina niet
   in de weg zit, en het draagt geen enkel token van de varianten.
   ─────────────────────────────────────────────────────────────────────────── */

export default function Wisselaar({ huidig }: { huidig: ThemaId }) {
  const [open, setOpen] = useState(true);
  const nu = THEMAS.find((t) => t.id === huidig);

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] -translate-x-1/2 print:hidden">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-neutral-900/92 p-1 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur">
        {open ? (
          <>
            {THEMAS.map((t) => (
              <Link
                key={t.id}
                href={`/thema/${t.id}`}
                title={t.eenRegel}
                aria-current={t.id === huidig ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  t.id === huidig ? "bg-white text-neutral-900" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {t.naam}
              </Link>
            ))}
            <Link
              href="/nieuw5"
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/45 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              huidig
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Wisselaar inklappen"
              className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/80 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {nu?.naam ?? "varianten"}
          </button>
        )}
      </div>
    </div>
  );
}

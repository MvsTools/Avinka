import Link from "next/link";

// Eén footer voor het hele platform: slogan links, Hulp/Privacy/Voorwaarden rechts.
// Wil je de footer overal aanpassen? Doe het hier, op één plek.
//
// - maxWidth: zodat de footer netjes uitlijnt met de inhoud van de pagina
//   (dashboard is breder dan een juridische pagina).
// - hulpHref: in het dashboard wijst "Hulp" naar de hulppagina; op openbare
//   pagina's naar de veelgestelde vragen op de startpagina.
export default function Footer({
  maxWidth = "max-w-6xl",
  hulpHref = "/#vragen",
}: {
  maxWidth?: string;
  hulpHref?: string;
}) {
  return (
    <footer className="border-t border-black/5">
      <div
        className={
          "mx-auto flex w-full flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-ink/55 sm:flex-row " +
          maxWidth
        }
      >
        <span>Van een leerkracht, voor leerkrachten. 💜</span>
        <nav className="flex items-center gap-4">
          <Link href={hulpHref} className="font-semibold hover:text-ink">
            Hulp
          </Link>
          <Link href="/privacy" className="font-semibold hover:text-ink">
            Privacy
          </Link>
          <Link href="/voorwaarden" className="font-semibold hover:text-ink">
            Voorwaarden
          </Link>
        </nav>
      </div>
    </footer>
  );
}

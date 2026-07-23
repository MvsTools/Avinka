"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useState, type ComponentType } from "react";

// De navigatie van het dashboard. Op een telefoon een horizontale strook,
// op een laptop een rustige zijbalk. In twee groepjes (dagelijks werk boven,
// account/hulp onder) met een rustig lijntje ertussen, zodat het overzichtelijk
// blijft. `scheiding` zet dat lijntje boven een item.
type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  scheiding?: boolean;
};
const items: NavItem[] = [
  { href: "/dashboard", label: "Start", icon: IconHome },
  // Mijn schooljaar staat bewust direct onder Start: het is de rode draad van
  // het platform, niet zomaar een schermpje ertussen.
  { href: "/dashboard/schooljaar", label: "Mijn schooljaar", icon: IconJaar },
  { href: "/dashboard/taken", label: "Takenlijst", icon: IconTaken },
  { href: "/dashboard/mijn-klas", label: "Mijn klas", icon: IconKlas },
  { href: "/dashboard/mijn-teksten", label: "Bestanden", icon: IconTekst },
  { href: "/dashboard/statistieken", label: "Statistieken", icon: IconChart },
  { href: "/dashboard/beloningen", label: "Beloningen", icon: IconGift },
  { href: "/dashboard/abonnement", label: "Abonnement", icon: IconBadge, scheiding: true },
  { href: "/dashboard/instellingen", label: "Instellingen", icon: IconGear },
  { href: "/dashboard/feedback", label: "Feedback", icon: IconFeedback },
  { href: "/dashboard/hulp", label: "Hulp", icon: IconHelp },
];

export default function DashboardNav({
  bestandenVergrendeld = false,
  isAdmin = false,
}: {
  bestandenVergrendeld?: boolean;
  isAdmin?: boolean;
}) {
  const path = usePathname();

  // Zolang de welkomstpop-up openstaat, lichten we de Feedback-knop op: hij komt
  // scherp bóven de vage achtergrond te staan (de pop-up stuurt open/dicht).
  const [wijsFeedback, setWijsFeedback] = useState(false);
  useEffect(() => {
    const aan = () => setWijsFeedback(true);
    const uit = () => setWijsFeedback(false);
    window.addEventListener("avinka-welkom-open", aan);
    window.addEventListener("avinka-welkom-dicht", uit);
    return () => {
      window.removeEventListener("avinka-welkom-open", aan);
      window.removeEventListener("avinka-welkom-dicht", uit);
    };
  }, []);

  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-1 md:w-60 md:shrink-0 md:flex-col md:overflow-visible md:pb-0">
      {items.map((it) => {
        const active =
          it.href === "/dashboard" ? path === it.href : path.startsWith(it.href);
        const Icon = it.icon;
        // Bestanden op slot (Start): leidt naar het abonnement-scherm + slotje.
        const opSlot = bestandenVergrendeld && it.href === "/dashboard/mijn-teksten";
        // De Feedback-knop tijdens de welkomstpop-up: scherp boven de waas.
        const isFeedback = it.href === "/dashboard/feedback";
        const wijs = wijsFeedback && isFeedback;
        return (
          <Fragment key={it.href}>
            {it.scheiding && (
              <div className="my-1.5 hidden border-t border-black/5 md:block" aria-hidden />
            )}
            <Link
              href={opSlot ? "/dashboard/abonnement" : it.href}
              title={opSlot ? "Bestanden hoort bij Compleet" : undefined}
              data-feedback-nav={isFeedback ? "" : undefined}
              className={
                "flex shrink-0 items-center gap-3 rounded-2xl px-4 py-2.5 text-base font-semibold transition " +
                (active
                  ? "bg-brand text-white shadow-sm shadow-brand/20"
                  : opSlot
                    ? "text-ink/35 hover:bg-white hover:text-ink/50"
                    : "text-ink/70 hover:bg-white hover:text-ink") +
                (wijs
                  ? " relative z-50 scale-[1.03] bg-brand text-white shadow-xl shadow-black/25 ring-2 ring-white"
                  : "")
              }
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{it.label}</span>
              {opSlot && <IconLock className="ml-auto h-4 w-4 shrink-0" />}
            </Link>
          </Fragment>
        );
      })}

      {/* Admin: alleen zichtbaar voor admins, leidt naar de admin-module. */}
      {isAdmin && (
        <Link
          href="/admin"
          className={
            "mt-1 flex shrink-0 items-center gap-3 rounded-2xl border border-dashed border-brand/40 px-4 py-2.5 text-base font-bold transition " +
            (path.startsWith("/admin")
              ? "bg-brand text-white shadow-sm shadow-brand/20"
              : "text-brand hover:bg-brand-soft")
          }
        >
          <IconAdmin className="h-5 w-5 shrink-0" />
          <span>Admin</span>
        </Link>
      )}
    </nav>
  );
}

/* Kleine, rustige lijn-iconen — geen extra pakketten nodig. */
type IconProps = { className?: string };

function IconHome({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V20h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 20v-5h5v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconKlas({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" strokeLinecap="round" />
      <path d="M15 19a4 4 0 0 1 5.5-3.7" strokeLinecap="round" />
    </svg>
  );
}
function IconTekst({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M6 3h8l4 4v14H6z" strokeLinejoin="round" />
      <path d="M14 3v4h4" strokeLinejoin="round" />
      <path d="M9 12h6M9 16h6" strokeLinecap="round" />
    </svg>
  );
}
function IconChart({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M4 20V4" strokeLinecap="round" />
      <path d="M4 20h16" strokeLinecap="round" />
      <rect x="7" y="12" width="3" height="5" rx="0.6" />
      <rect x="12" y="8" width="3" height="9" rx="0.6" />
      <rect x="17" y="5" width="3" height="12" rx="0.6" />
    </svg>
  );
}
function IconGift({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M4 11.5h16V20H4z" strokeLinejoin="round" />
      <path d="M3 8h18v3.5H3z" strokeLinejoin="round" />
      <path d="M12 8v12" strokeLinecap="round" />
      <path d="M12 8S10.5 4 8.2 4.5C6.8 4.8 6.7 6.7 8 7.6c.9.6 4 .4 4 .4zM12 8s1.5-4 3.8-3.5c1.4.3 1.5 2.2.2 3.1-.9.6-4 .4-4 .4z" strokeLinejoin="round" />
    </svg>
  );
}
function IconBadge({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M8.5 13.5 7 21l5-2.5L17 21l-1.5-7.5" strokeLinejoin="round" />
    </svg>
  );
}
function IconGear({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6" strokeLinecap="round" />
    </svg>
  );
}
function IconAdmin({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z" strokeLinejoin="round" />
      <path d="M9.5 12l1.8 1.8L15 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconLock({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}
function IconJaar({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 9.5h17M8 3.5V6.5M16 3.5V6.5" strokeLinecap="round" />
      <path d="M8 13.5h2.5M8 17h2.5M14 13.5h2M14 17h2" strokeLinecap="round" />
    </svg>
  );
}
function IconTaken({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M3 6.5l1.5 1.5L7.5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12.5l1.5 1.5L7.5 11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 7h9M11 13h9M11 19h6" strokeLinecap="round" />
    </svg>
  );
}
function IconFeedback({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M9 18h6" strokeLinecap="round" />
      <path d="M10 21h4" strokeLinecap="round" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8.9.9 1.6l.1.5h5l.1-.5c.1-.7.4-1.2.9-1.6A6 6 0 0 0 12 3z" strokeLinejoin="round" />
    </svg>
  );
}
function IconHelp({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 0 1 4.5 1.5c0 1.7-2 2-2 3.2" strokeLinecap="round" />
      <path d="M12 17.5h.01" strokeLinecap="round" />
    </svg>
  );
}

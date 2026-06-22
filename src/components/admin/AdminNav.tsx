"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// De modules van het admin-dashboard. Bewust dezelfde rustige stijl als het
// leerkracht-dashboard, zodat het vertrouwd voelt.
const items = [
  { href: "/admin", label: "Overzicht" },
  { href: "/admin/conversie", label: "Conversie" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/financien", label: "Financiën" },
  { href: "/admin/verbruik", label: "Verbruik" },
  { href: "/admin/tools", label: "Tools" },
];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-1 md:w-56 md:shrink-0 md:flex-col md:overflow-visible md:pb-0">
      {items.map((it) => {
        const active = it.href === "/admin" ? path === it.href : path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={
              "shrink-0 rounded-2xl px-4 py-2.5 text-base font-semibold transition " +
              (active
                ? "bg-ink text-white shadow-sm"
                : "text-ink/70 hover:bg-white hover:text-ink")
            }
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

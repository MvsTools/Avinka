// Mollie-koppeling (server-only) via de native fetch van Node (undici).
//
// Bewust GEEN @mollie/api-client: die gebruikt node-fetch, dat in deze omgeving
// de systeem-CA negeert en op een TLS-certificaatfout stuit. De native fetch
// werkt wél met --use-system-ca (net als de AI-route naar Anthropic).
//
// De API-sleutel staat alleen in .env.local en komt nooit in de browser.
import { planById } from "@/lib/abonnement";

const BASIS = "https://api.mollie.com/v2";

function sleutel(): string {
  const k = process.env.MOLLIE_API_KEY;
  if (!k) throw new Error("MOLLIE_API_KEY ontbreekt in de omgeving");
  return k;
}

type RuweBetaling = {
  id: string;
  status: string;
  _links?: { checkout?: { href?: string } };
  metadata?: { userId?: string; plan?: string; vorm?: string } | null;
};

async function mollieFetch<T = RuweBetaling>(pad: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASIS + pad, {
    ...init,
    headers: {
      Authorization: `Bearer ${sleutel()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { detail?: string };
  if (!res.ok) {
    throw new Error(
      `Mollie ${res.status}: ${(data as { detail?: string })?.detail ?? "onbekende fout"}`,
    );
  }
  return data;
}

export type MolliePayment = {
  id: string;
  status: string;
  checkoutUrl: string | null;
  metadata: { userId?: string; plan?: string; vorm?: string } | null;
};

function vertaal(d: RuweBetaling): MolliePayment {
  return {
    id: d.id,
    status: d.status,
    checkoutUrl: d._links?.checkout?.href ?? null,
    metadata: d.metadata ?? null,
  };
}

// Maakt een Mollie-klant aan (nodig om later automatisch te kunnen incasseren).
// Geeft het klant-id terug; dat bewaren we bij de gebruiker (mollie_customer_id).
export async function maakKlant(opts: {
  naam?: string;
  email?: string;
}): Promise<string> {
  const d = await mollieFetch<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: opts.naam || undefined,
      email: opts.email || undefined,
    }),
  });
  return d.id;
}

// Maakt een betaling aan en geeft o.a. de afreken-URL terug.
// Met `customerId` + `sequenceType: "first"` zet de eerste betaling meteen een
// machtiging (mandaat) op, zodat we daarna maandelijks kunnen incasseren zonder
// dat de leerkracht opnieuw hoeft te betalen.
export async function maakBetaling(opts: {
  planId: string;
  vorm: string;
  redirectUrl: string;
  userId: string;
  customerId?: string;
  sequenceType?: "first" | "oneoff" | "recurring";
}): Promise<MolliePayment> {
  const naam = planById(opts.planId)?.naam ?? opts.planId;
  const body: Record<string, unknown> = {
    amount: { currency: "EUR", value: bedragVoor(opts.planId) },
    description: `Avinka ${naam} (${opts.vorm === "jaar" ? "per schooljaar" : "per maand"})`,
    redirectUrl: opts.redirectUrl,
    metadata: { userId: opts.userId, plan: opts.planId, vorm: opts.vorm },
  };
  if (opts.customerId) body.customerId = opts.customerId;
  if (opts.sequenceType) body.sequenceType = opts.sequenceType;
  const d = await mollieFetch<RuweBetaling>("/payments", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return vertaal(d);
}

// Haalt de actuele status van een betaling op (om de terugkeer te verifiëren).
export async function haalBetaling(id: string): Promise<MolliePayment> {
  return vertaal(await mollieFetch<RuweBetaling>(`/payments/${id}`));
}

// Heeft deze klant een bruikbare machtiging? (geldig of in afwachting) — zo
// kunnen we later beslissen of automatisch incasseren mag.
export async function heeftGeldigMandaat(customerId: string): Promise<boolean> {
  const d = await mollieFetch<{ _embedded?: { mandates?: { status: string }[] } }>(
    `/customers/${customerId}/mandates`,
  );
  const lijst = d._embedded?.mandates ?? [];
  return lijst.some((m) => m.status === "valid" || m.status === "pending");
}

// Het te betalen maandbedrag als string met 2 decimalen ("9.99"), zoals Mollie
// verwacht. Óók bij "per schooljaar" reken je per maand af — juli en augustus
// zijn dan gratis. Dat zomerschema (10 i.p.v. 12 incasso's) regelt de
// incasso-/verleng-logica later; de eerste betaling is altijd één maand.
export function bedragVoor(planId: string): string {
  const p = planById(planId);
  return (p?.prijsMaand ?? 0).toFixed(2);
}

// Uitlezen van een agenda in iCalendar-formaat (.ics). Elke schoolagenda die
// wij koppelen (Parro, Social Schools, Outlook, Teams, Google) levert dit
// formaat, dus dit bestand is de enige plek waar we het hoeven te begrijpen.
//
// Bewust klein gehouden: we halen eruit wat een leerkracht nodig heeft
// (wat, wanneer, waar) en negeren de rest van de standaard.

export type IcsAfspraak = {
  uid: string;
  titel: string;
  /** Eerste dag, als 2026-11-25. */
  van: string;
  /** Laatste dag (bij ons altijd meegerekend, anders dan in het formaat). */
  tot: string;
  heleDag: boolean;
  /** "16:00", alleen als het geen hele dag is. */
  begin?: string;
  eind?: string;
  locatie?: string;
};

export type IcsAgenda = {
  naam?: string;
  afspraken: IcsAfspraak[];
  /** Afspraken die zich herhalen; die kunnen we nog niet uitvouwen. */
  herhalend: number;
};

/**
 * Regels aan elkaar plakken. In het formaat wordt een lange regel afgebroken
 * en gaat hij verder op de volgende regel, die dan met een spatie of tab begint.
 */
function ontvouw(tekst: string): string[] {
  const ruw = tekst.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const uit: string[] = [];
  for (const regel of ruw) {
    if ((regel.startsWith(" ") || regel.startsWith("\t")) && uit.length) {
      uit[uit.length - 1] += regel.slice(1);
    } else {
      uit.push(regel);
    }
  }
  return uit;
}

/** "DTSTART;TZID=Europe/Brussels:20261119T160000" uit elkaar halen. */
function leesRegel(regel: string): { naam: string; params: Record<string, string>; waarde: string } | null {
  const dubbelePunt = regel.indexOf(":");
  if (dubbelePunt < 0) return null;
  const kop = regel.slice(0, dubbelePunt);
  const waarde = regel.slice(dubbelePunt + 1);
  const delen = kop.split(";");
  const naam = delen[0].toUpperCase();
  const params: Record<string, string> = {};
  for (const p of delen.slice(1)) {
    const isGelijk = p.indexOf("=");
    if (isGelijk > 0) params[p.slice(0, isGelijk).toUpperCase()] = p.slice(isGelijk + 1);
  }
  return { naam, params, waarde };
}

/** Tekens die in het formaat ontsnapt zijn weer normaal maken. */
function ontsnap(s: string): string {
  return s
    .replace(/\\n/gi, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

/** Een tijdstip in UTC omrekenen naar Nederlandse tijd. */
function naarNederlandseTijd(d: Date): { datum: string; tijd: string } {
  const delen = new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const pak = (t: string) => delen.find((p) => p.type === t)?.value ?? "00";
  return {
    datum: `${pak("year")}-${pak("month")}-${pak("day")}`,
    tijd: `${pak("hour") === "24" ? "00" : pak("hour")}:${pak("minute")}`,
  };
}

/**
 * Een datum-waarde lezen. Drie vormen komen voor:
 *   20261125                    hele dag
 *   20261119T160000             tijd zoals hij op de klok van de school staat
 *   20261119T150000Z            tijd in UTC, moet omgerekend
 */
function leesMoment(waarde: string, heleDag: boolean): { datum: string; tijd?: string } | null {
  const m = waarde.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, jr, mnd, dg, uu, mm, ss, zulu] = m;
  const datum = `${jr}-${mnd}-${dg}`;
  if (heleDag || !uu) return { datum };
  if (zulu) {
    const d = new Date(Date.UTC(+jr, +mnd - 1, +dg, +uu, +mm, +(ss || 0)));
    const nl = naarNederlandseTijd(d);
    return { datum: nl.datum, tijd: nl.tijd };
  }
  return { datum, tijd: `${uu}:${mm}` };
}

function dagErbij(datum: string, n: number): string {
  const d = new Date(datum + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function leesIcs(tekst: string): IcsAgenda {
  const regels = ontvouw(tekst);
  const afspraken: IcsAfspraak[] = [];
  let naam: string | undefined;
  let herhalend = 0;

  let bezig = false;
  let inTijdzone = false;
  let huidig: Record<string, { params: Record<string, string>; waarde: string }> = {};

  for (const regel of regels) {
    const r = leesRegel(regel);
    if (!r) continue;

    // De tijdzone-omschrijving bovenin bevat ook DTSTART- en RRULE-regels.
    // Die horen niet bij een afspraak, dus die slaan we helemaal over.
    if (r.naam === "BEGIN" && r.waarde.toUpperCase() === "VTIMEZONE") inTijdzone = true;
    if (r.naam === "END" && r.waarde.toUpperCase() === "VTIMEZONE") inTijdzone = false;
    if (inTijdzone) continue;

    if (r.naam === "BEGIN" && r.waarde.toUpperCase() === "VEVENT") {
      bezig = true;
      huidig = {};
      continue;
    }
    if (r.naam === "END" && r.waarde.toUpperCase() === "VEVENT") {
      bezig = false;
      const start = huidig["DTSTART"];
      if (!start) continue;

      const heleDag = (start.params["VALUE"] || "").toUpperCase() === "DATE";
      const van = leesMoment(start.waarde, heleDag);
      if (!van) continue;

      const eindRegel = huidig["DTEND"];
      const eind = eindRegel
        ? leesMoment(eindRegel.waarde, (eindRegel.params["VALUE"] || "").toUpperCase() === "DATE")
        : null;

      // Bij een meerdaagse afspraak is de einddatum in het formaat de dag
      // erna. Wij tellen de laatste dag gewoon mee, dat leest natuurlijker.
      let tot = eind ? eind.datum : van.datum;
      if (heleDag && eind && eind.datum > van.datum) tot = dagErbij(eind.datum, -1);

      if (huidig["RRULE"]) herhalend++;

      afspraken.push({
        uid: huidig["UID"]?.waarde || `${van.datum}-${afspraken.length}`,
        titel: ontsnap(huidig["SUMMARY"]?.waarde || "Afspraak zonder naam"),
        van: van.datum,
        tot,
        heleDag,
        begin: van.tijd,
        eind: eind?.tijd,
        locatie: huidig["LOCATION"] ? ontsnap(huidig["LOCATION"].waarde) || undefined : undefined,
      });
      continue;
    }

    if (bezig) {
      huidig[r.naam] = { params: r.params, waarde: r.waarde };
    } else if (r.naam === "X-WR-CALNAME" || (r.naam === "NAME" && !naam)) {
      naam = ontsnap(r.waarde);
    }
  }

  afspraken.sort((a, b) => a.van.localeCompare(b.van) || (a.begin || "").localeCompare(b.begin || ""));
  return { naam, afspraken, herhalend };
}

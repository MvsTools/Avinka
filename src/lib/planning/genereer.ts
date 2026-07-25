// De lessen opnieuw over de week verdelen — zonder AI, dus zonder credits.
//
// Deze verdeler denkt als een leerkracht:
//  - Veel stillezen/technisch lezen (4–5×) staat áltijd op de starttijd van de dag.
//  - Daarna dagopening/kring, dan de zware vakken ('s ochtends), en 's middags de
//    creatieve/oriënterende vakken.
//  - Vaste structuur: een vak dat je vaak (elke dag) doet, komt zo veel mogelijk
//    elke dag op DEZELFDE tijd — herkenbaar en rustig. Wie eerst wordt geplaatst,
//    pakt de beste plek, dus de volgorde is: lezen → dagopening → zwaar → rest →
//    middag.
//  - Pauzes (en al geplaatste vaste blokken) blijven staan; geen overlap; maximaal
//    één keer hetzelfde vak per dag.
//  - Binnen gelijke prioriteit en bij de dagkeuze schudden we, zodat elke keer
//    "opnieuw genereren" een andere — maar nog steeds nette — variant geeft.

import type { RoosterBlokRuw, RoosterSetup } from "./rooster";

const DAGEN = ["ma", "di", "wo", "do", "vr"];
const MIDDAG = 12 * 60;

function husselen<T>(rij: T[]): T[] {
  const a = rij.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Vak = {
  vak: string;
  naam: string;
  duur: number;
  count: number;
  ochtend: boolean;
  zwaar: boolean;
  middag: boolean;
};

export function genereerLessen(setup: RoosterSetup, vaste: RoosterBlokRuw[]): RoosterBlokRuw[] {
  const dagen = husselen((setup.dagen ?? DAGEN).filter((d) => DAGEN.includes(d)));
  const begin = setup.begin ?? 8 * 60 + 30;
  const eind = setup.eind ?? 15 * 60;
  const db = (d: string) => setup.dagBegin?.[d] ?? begin;
  const de = (d: string) => setup.dagEind?.[d] ?? eind;

  // Per vak: lengte, hoe vaak per week, en het voorkeursdagdeel. Pauze is vast.
  // Een vak zonder `blokken` staat alleen in de lijst omdat er een kleur voor is
  // gekozen; dat is geen ingesteld lesvak en verdelen we dus ook niet.
  const vakken: Vak[] = (setup.vakken ?? [])
    .filter((v) => v.id !== "pauze" && (v.blokken?.length ?? 0) > 0)
    .map((v) => ({
      vak: v.id,
      naam: v.naam,
      duur: v.blokken?.[0] ?? 45,
      count: Math.max(1, v.blokken?.length ?? 1),
      ochtend: !!v.ochtend,
      zwaar: !!v.zwaar,
      middag: !!v.middag,
    }));

  const isLezen = (v: Vak) => v.vak === "tlezen" || /lez|lees/i.test(v.naam);
  // 0 = veel lezen (aan de start), 1 = dagopening/kring, 2 = zware ochtendvakken,
  // 3 = neutraal, 4 = middagvakken. Wie lager zit, wordt eerder geplaatst.
  const prio = (v: Vak) =>
    isLezen(v) && v.count >= 4 ? 0 : v.ochtend ? 1 : v.zwaar ? 2 : v.middag ? 4 : 3;
  const gesorteerd = [0, 1, 2, 3, 4].flatMap((p) => husselen(vakken.filter((v) => prio(v) === p)));

  const bezet: RoosterBlokRuw[] = vaste.slice();
  const pastVrij = (dag: string, start: number, duur: number) => {
    if (start < db(dag) || start + duur > de(dag)) return false;
    return !bezet.some((o) => o.dag === dag && start < o.start + o.duur && start + duur > o.start);
  };
  const vakOpDag = (vak: string, dag: string) =>
    bezet.some((o) => o.type === "les" && o.vak === vak && o.dag === dag);

  const les: RoosterBlokRuw[] = [];
  let n = 0;
  const plaats = (v: Vak, dag: string, start: number) => {
    const blok: RoosterBlokRuw = {
      id: "les-" + Date.now() + "-" + n++,
      dag,
      start,
      duur: v.duur,
      vak: v.vak,
      naam: v.naam,
      type: "les",
    };
    les.push(blok);
    bezet.push(blok);
  };

  // Eén vrij gat voor een enkel blok (terugval als een vaste tijd niet lukt).
  const zoekGat = (vak: string, duur: number, deel: "ochtend" | "middag" | null) => {
    for (const dag of dagen) {
      if (vakOpDag(vak, dag)) continue;
      for (let s = db(dag); s + duur <= de(dag); s += 5) {
        if (deel === "ochtend" && s >= MIDDAG) break;
        if (deel === "middag" && s < MIDDAG) continue;
        if (pastVrij(dag, s, duur)) return { dag, start: s };
      }
    }
    return null;
  };

  const minBegin = Math.min(...dagen.map(db), begin);
  const maxEind = Math.max(...dagen.map(de), eind);

  for (const v of gesorteerd) {
    const deel: "ochtend" | "middag" | null =
      v.ochtend || v.zwaar || (isLezen(v) && v.count >= 4) ? "ochtend" : v.middag ? "middag" : null;
    let rest = v.count;

    // 1) Zoek één vaste tijd waar dit vak op zo veel mogelijk dagen past. Zo komt
    //    het elke dag op dezelfde tijd (herkenbare structuur). De vroegste tijd
    //    die op álle benodigde dagen past wint.
    let beste: { start: number; dagen: string[] } | null = null;
    for (let t = minBegin; t + v.duur <= maxEind; t += 5) {
      if (deel === "ochtend" && t >= MIDDAG) break;
      if (deel === "middag" && t < MIDDAG) continue;
      const vrij = dagen.filter((dag) => !vakOpDag(v.vak, dag) && pastVrij(dag, t, v.duur));
      if (vrij.length === 0) continue;
      if (vrij.length >= rest) {
        beste = { start: t, dagen: vrij };
        break;
      }
      if (!beste || vrij.length > beste.dagen.length) beste = { start: t, dagen: vrij };
    }
    if (beste) {
      for (const dag of beste.dagen) {
        if (rest <= 0) break;
        plaats(v, dag, beste.start);
        rest--;
      }
    }

    // 2) Wat er niet op die vaste tijd bij kon, in een vrij gat (eerst in het
    //    dagdeel, anders waar dan ook).
    while (rest > 0) {
      const gat = zoekGat(v.vak, v.duur, deel) ?? zoekGat(v.vak, v.duur, null);
      if (!gat) break;
      plaats(v, gat.dag, gat.start);
      rest--;
    }
  }

  return les;
}

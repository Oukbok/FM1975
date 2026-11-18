// =============================================================================
// HISTORISCHE LIGASTRUKTUR JE LAND UND SAISON (Wunsch Pascal: Ligareformen auch im Ausland)
// -----------------------------------------------------------------------------
// Abgeleitet aus den Weltdaten (data/world/seasons/<cc>.ts), keine Handarbeit je Land:
//  • Größe 1. Liga = Länge von t1, Größe 2. Ebene = t2 + t2b (Staffeln: t2 ist eine Staffel,
//    t2b weitere Staffeln derselben Größe hintereinander, z. B. Frankreich bis 1992/93 18 + 18);
//  • Absteiger aus der 1. Liga zur Saison y = Erstligisten von y−1, die in y fehlen; Aufsteiger =
//    Absteiger + Größenänderung (wächst die Liga, steigen mehr auf als ab, schrumpft sie, umgekehrt);
//  • Absteiger aus der 2. Ebene in den Unterbau = Zweitligisten von y−1, die in y weder in der
//    1. noch in der 2. Ebene stehen (nur wenn beide Saisons eine 2. Liga in den Daten haben).
// Ungerade Größen (19, 21, 17, 13 …) werden auf die nächste gerade Zahl ABGERUNDET – wie beim
// Spielstart (game/worldCompose.ts `composeHome` streicht den Schwächsten), weil der Spielplan
// (Kreisverfahren, engine/league.ts) eine gerade Zahl braucht. Beispiel England 1987/88: 21 → 20.
// Wo Daten fehlen: vor der ersten/nach der letzten Saison und in Lücken gilt die nächste bekannte
// Größe; Auf-/Abstieg dann wie im letzten „ruhigen“ Saisonwechsel ohne Größenänderung. Länder ohne
// 2. Liga in den Daten: `t2` = null (die Hintergrund-Welt behält ihre bisherige 2. Liga).
// Stichproben gegen Quellen (England, Italien, Spanien, Frankreich, Niederlande, Portugal,
// Deutschland): docs/recherche/ligastruktur-ausland.md. Genutzt von engine/world.ts
// (Hintergrund-Saisonwechsel), engine/worldData.ts (Start) und game/homeStructure.ts (Heimatland).
// =============================================================================
import { COUNTRY_BY_KEY } from './countries';
import { worldDataVersion, worldSeason, worldYears } from './index';
import type { SeasonRow } from './types';

export interface WorldStructure {
  /** Saison (Startjahr). */
  year: number;
  /** Größe der 1. Liga (gerade). */
  t1: number;
  /** Gesamtgröße der 2. Ebene (gerade) oder null = keine 2. Liga in den Daten. */
  t2: number | null;
  /** Staffelgrößen der 2. Ebene (je gerade; eine Zahl = eingleisig) oder null. */
  groups: number[] | null;
  /** Aufsteiger in die 1. Liga zu dieser Saison. */
  up: number;
  /** Absteiger aus der 1. Liga zu dieser Saison. */
  down: number;
  /** Absteiger aus der 2. Ebene in den Unterbau zu dieser Saison (null = unbekannt). */
  down2: number | null;
  /** 'data' = aus zwei Saisons der Daten, 'carry' = fortgeschrieben (Lücke, vor/nach den Daten). */
  src: 'data' | 'carry';
}

const even = (n: number) => n - (n % 2);
const second = (r: SeasonRow) => [...(r.t2 ?? []), ...(r.t2b ?? [])];

/** Staffelgrößen der 2. Ebene einer Saison (t2b = weitere Staffeln in t2-Größe hintereinander). */
function groupsOf(r: SeasonRow): number[] | null {
  const a = r.t2?.length ?? 0, b = r.t2b?.length ?? 0;
  if (!a) return null;
  if (!b) return [even(a)];
  const k = b % a === 0 ? b / a : 1;
  return [even(a), ...Array.from({ length: k }, () => even(Math.round(b / k)))];
}

interface Step { up: number; down: number; down2: number | null }

/** Saisonwechsel prev → cur aus den Daten (Größen bereits gerade gerundet). */
function stepOf(prev: SeasonRow, cur: SeasonRow): Step {
  const t1p = even(prev.t1.length), t1c = even(cur.t1.length);
  let down = prev.t1.filter((id) => !cur.t1.includes(id)).length;
  let up = down + (t1c - t1p);
  if (up < 0) { down -= up; up = 0; }
  const p2 = second(prev), c2 = second(cur);
  const down2 = p2.length && c2.length ? p2.filter((id) => !cur.t1.includes(id) && !c2.includes(id)).length : null;
  return { up, down, down2 };
}

let cacheVersion = -1;
const cache = new Map<string, Map<number, WorldStructure> | null>();

function build(cc: string): Map<number, WorldStructure> | null {
  const years = worldYears(cc);
  if (!years.length) return null;
  const out = new Map<number, WorldStructure>();
  let steady: Step | null = null;
  for (const y of years) {
    const cur = worldSeason(cc, y)!, prev = worldSeason(cc, y - 1);
    const g = groupsOf(cur);
    const base = { year: y, t1: even(cur.t1.length), t2: g ? g.reduce((a, b) => a + b, 0) : null, groups: g };
    if (prev) {
      const st = stepOf(prev, cur);
      out.set(y, { ...base, ...st, src: 'data' });
      const sameSize = even(prev.t1.length) === base.t1 && (groupsOf(prev)?.join() ?? '') === (g?.join() ?? '');
      if (sameSize) steady = st;
    } else {
      out.set(y, { ...base, up: -1, down: -1, down2: null, src: 'carry' });
    }
  }
  // Erste Saison/Lücken ohne Vorsaison: Auf-/Abstieg wie im ersten ruhigen Wechsel.
  const first = [...out.values()].find((s) => s.src === 'data');
  const calm = steady ?? (first ? { up: first.up, down: first.down, down2: first.down2 } : { up: 2, down: 2, down2: null });
  for (const s of out.values()) if (s.up < 0) Object.assign(s, { up: calm.down, down: calm.down, down2: calm.down2 });
  (out as Map<number, WorldStructure> & { calm?: Step }).calm = calm;
  return out;
}

function tableOf(cc: string): (Map<number, WorldStructure> & { calm?: Step }) | null {
  const v = worldDataVersion();
  if (v !== cacheVersion) { cache.clear(); cacheVersion = v; }
  if (!cache.has(cc)) cache.set(cc, build(cc));
  return cache.get(cc) as (Map<number, WorldStructure> & { calm?: Step }) | null;
}

/**
 * Struktur eines Landes (Code) in der Saison `year` (Startjahr): Größen und Auf-/Abstieg
 * ZU dieser Saison. null = keine Weltdaten für das Land (bisheriges Verhalten).
 */
export function worldStructureFor(cc: string, year: number): WorldStructure | null {
  const t = tableOf(cc);
  if (!t) return null;
  const hit = t.get(year);
  if (hit) return hit;
  // Fortschreiben: nächstes bekanntes Jahr davor (sonst danach), Auf-/Abstieg aus dem ruhigen Wechsel.
  const ys = [...t.keys()];
  const near = ys.filter((y) => y < year).pop() ?? ys[0];
  const s = t.get(near)!, calm = t.calm!;
  return { ...s, year, up: calm.down, down: calm.down, down2: calm.down2, src: 'carry' };
}

/** Wie worldStructureFor, aber über den Schlüssel der Hintergrund-Welt (`WorldCountry.name`). */
export function worldStructureOfKey(key: string, year: number): WorldStructure | null {
  const cc = COUNTRY_BY_KEY[key]?.cc;
  return cc ? worldStructureFor(cc, year) : null;
}

/**
 * Größe der 2. Liga in der Hintergrund-Welt: die Hintergrund-Welt führt die 2. Ebene immer
 * EINGLEISIG (engine/world.ts `tiers[1]`). Bei mehreren Staffeln entspricht sie einer Staffel
 * (die besten Zweitligisten beider/aller Staffeln, die übrigen stehen im Unterbau) – eine
 * Liga mit 36–48 Vereinen hätte 70–94 Spieltage.
 */
export function backgroundSecondSize(s: WorldStructure | null): number | null {
  if (!s?.groups) return null;
  return s.groups.length > 1 ? s.groups[0] : s.t2;
}

/** Auf-/Abstieg eines Saisonwechsels der Hintergrund-Welt. */
export interface WorldExchange {
  /** Aufsteiger 2. → 1. Liga, Absteiger 1. → 2. Liga. */
  up1: number; down1: number;
  /** Absteiger 2. Liga → Unterbau, Aufsteiger Unterbau → 2. Liga. */
  out2: number; in2: number;
}

/**
 * Plan für den Saisonwechsel eines Hintergrund-Landes mit `n1`/`n2` Vereinen in 1./2. Liga
 * hin zur Struktur der NEUEN Saison `s` (null = bisheriges Verhalten: 3 bzw. 2 Auf-/Absteiger,
 * 2 gegen den Unterbau). `prevMulti` = die Vorsaison hatte mehrere Zweitliga-Staffeln
 * (Abstiegszahl in den Unterbau dann nicht aus den Daten übertragbar → 2).
 */
export function worldExchangePlan(s: WorldStructure | null, n1: number, n2: number, prevMulti = false): WorldExchange {
  if (!s) { const n = n1 >= 16 ? 3 : 2; return { up1: n, down1: n, out2: 2, in2: 2 }; }
  const T1 = s.t1;
  const T2 = backgroundSecondSize(s) ?? n2;
  let down1 = Math.min(s.down, Math.max(0, n1 - 2));
  let up1 = down1 + (T1 - n1);
  if (up1 < 0) { down1 = Math.min(n1 - 2, down1 - up1); up1 = 0; }
  up1 = Math.min(up1, Math.max(0, n2 - 2));
  const m2 = n2 - up1 + down1;
  const single = (s.groups?.length ?? 1) === 1 && !prevMulti;
  let out2 = Math.max(0, single && s.down2 != null ? s.down2 : 2);
  out2 = Math.min(out2, Math.max(0, m2 - down1 - 2)); // nie die eben Abgestiegenen und nie leer
  let in2 = T2 - m2 + out2;
  if (in2 < 0) { out2 = Math.min(Math.max(0, m2 - down1 - 2), out2 - in2); in2 = Math.max(0, T2 - m2 + out2); }
  return { up1, down1, out2, in2 };
}

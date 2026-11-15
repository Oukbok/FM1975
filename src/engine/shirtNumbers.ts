// =============================================================================
// RÜCKENNUMMERN (Wunsch Pascal: Spieler anderer Vereine brauchen Rückennummern)
// -----------------------------------------------------------------------------
// Eine Rechnung für alle Kader (volle Vereine und Weltspieler), ohne Zufall –
// alles fest aus Position, Stärke und Spieler-ID:
// - Bis 1992/93 klassisch: die Stammelf trägt 1–11 nach Position (1 Torwart,
//   2/3 Außenverteidiger, 4 Vorstopper, 5 Libero/Innenverteidiger, 6 defensives
//   Mittelfeld, 7 rechts vorn, 8 Mittelfeld, 9 Mittelstürmer, 10 Spielmacher,
//   11 links vorn), Ersatztorwart 12, der Rest fortlaufend ab 13 (Jugend zuletzt).
//   Neu vergeben wird zum Saisonwechsel; Neuzugänge in der Saison bekommen die
//   nächste freie Nummer ab 12.
// - Ab 1993/94 feste Saisonnummern 1–40: Stammkräfte meist noch nach Position,
//   manche mit freier Nummer, Stars gern 7/9/10, Torhüter 1/12/22 …, Jugend 30–40.
//   Nummern bleiben, Neuzugänge bekommen eine freie, zur Position passende Nummer.
// Vorhandene gültige Nummern bleiben im Modus „behalten“ immer unverändert.
// =============================================================================
import { POSITION_GROUPS, type Club, type Player, type Position } from '../types';

/** Erste Saison (Startjahr) mit festen Saisonnummern (England 1993/94, Bundesliga 1995/96). */
export const FIXED_SHIRTS_FROM = 1993;

export interface ShirtEntry {
  id: string;
  pos: Position;
  ov: number;
  youth?: boolean;
  /** Bisherige Nummer (0/fehlt = keine). */
  cur?: number;
}

/** Positionen je klassischer Nummer, beste Eignung zuerst. Reihenfolge der Vergabe = Schlüsselreihenfolge unten. */
const CLASSIC: [number, Position[]][] = [
  [9, ['MS', 'HS', 'RA', 'LA']],
  [5, ['LIB', 'IV', 'DM']],
  [4, ['IV', 'LIB', 'DM', 'RV', 'LV']],
  [2, ['RV', 'IV', 'LIB', 'DM', 'LV']],
  [3, ['LV', 'IV', 'LIB', 'DM', 'RV']],
  [10, ['OM', 'ZM', 'HS', 'MS']],
  [6, ['DM', 'ZM', 'IV', 'LIB']],
  [7, ['RA', 'RM', 'HS', 'OM', 'LA', 'MS']],
  [11, ['LA', 'LM', 'MS', 'HS', 'RA']],
  [8, ['ZM', 'DM', 'OM', 'RM', 'LM']],
];

/** Beliebte Nummern je Mannschaftsteil in der Zeit fester Saisonnummern. */
const MODERN_POOL: Record<string, number[]> = {
  GK: [1, 12, 22, 13, 25, 30, 33, 35, 40],
  DEF: [2, 3, 4, 5, 15, 16, 6, 18, 20, 21, 23, 24, 26, 28, 31, 32, 34, 36],
  MID: [8, 6, 10, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 31],
  ATT: [9, 11, 7, 10, 14, 17, 18, 19, 20, 21, 27, 29, 33, 39],
};
const STAR: Record<string, number[]> = { ATT: [9, 10, 7, 11], MID: [10, 8, 7, 6], DEF: [4, 5, 3, 2] };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Saison (Startjahr) zu einem Datum JJJJ-MM-TT. */
export const shirtSeasonOf = (date: string): number => Number(date.slice(0, 4)) - (Number(date.slice(5, 7)) < 7 ? 1 : 0);

/** Stammelf 1–11 nach Position + Ersatztorwart 12 (klassisch). */
function classicCore(pros: ShirtEntry[], out: Map<string, number>, used: Set<number>): void {
  const keepers = pros.filter((e) => e.pos === 'TW').sort((a, b) => b.ov - a.ov);
  if (keepers[0]) { out.set(keepers[0].id, 1); used.add(1); }
  if (keepers[1]) { out.set(keepers[1].id, 12); used.add(12); }
  const field = pros.filter((e) => e.pos !== 'TW');
  const taken = new Set<string>();
  for (const [n, list] of CLASSIC) {
    let best: ShirtEntry | undefined, bestV = -1e9;
    for (const e of field) {
      if (taken.has(e.id)) continue;
      const i = list.indexOf(e.pos);
      const v = e.ov - (i < 0 ? 40 : i * 6);
      if (v > bestV) { bestV = v; best = e; }
    }
    if (!best) break;
    taken.add(best.id); out.set(best.id, n); used.add(n);
  }
}

function firstFree(used: Set<number>, from: number, to = 99): number {
  for (let n = from; n <= to; n++) if (!used.has(n)) return n;
  return 0;
}

/** Eine freie Nummer für einen Spieler ohne Nummer. `star` = einer der drei Besten im Kader. */
function pickNumber(e: ShirtEntry, used: Set<number>, modern: boolean, star: boolean): number {
  const grp = POSITION_GROUPS[e.pos] ?? 'MID';
  if (!modern) {
    if (grp === 'GK') for (const n of [1, 12, 22]) if (!used.has(n)) return n;
    return firstFree(used, 12) || firstFree(used, 2) || 99;
  }
  if (e.youth) return firstFree(used, 30, 40) || firstFree(used, 41) || firstFree(used, 13) || 99;
  if (star && STAR[grp]) for (const n of STAR[grp]) if (!used.has(n)) return n;
  const pool = MODERN_POOL[grp];
  // Fest je Spieler verschobener Einstieg in die Liste: nicht jeder Verteidiger trägt die 2.
  const head = Math.min(pool.length, grp === 'GK' ? 3 : 4);
  const off = hash(e.id + '#') % head;
  const order = [...pool.slice(off, head), ...pool.slice(0, off), ...pool.slice(head)];
  for (const n of order) if (!used.has(n) && (n !== 1 || grp === 'GK')) return n;
  return firstFree(used, 2, 40) || firstFree(used, 41) || 99;
}

/**
 * Nummern für einen ganzen Kader. `fresh` = neu vergeben (Spielbeginn, klassischer
 * Saisonwechsel), sonst bleiben gültige, eindeutige Nummern und nur die übrigen
 * bekommen eine freie. Liefert die Nummer jedes Eintrags.
 */
export function numberSquad(list: ShirtEntry[], year: number, fresh: boolean): Map<string, number> {
  const modern = year >= FIXED_SHIRTS_FROM;
  const out = new Map<string, number>();
  const used = new Set<number>();
  if (!fresh) {
    for (const e of list) {
      const n = e.cur ?? 0;
      if (n >= 1 && n <= 99 && !used.has(n)) { used.add(n); out.set(e.id, n); }
    }
  } else {
    const pros = list.filter((e) => !e.youth);
    classicCore(pros, out, used);
    if (modern) {
      // Feste Saisonnummern: manche Stammkräfte wählen eine freie Nummer (fest aus der ID).
      for (const [id, n] of [...out]) {
        if (n === 1 || hash(id + '~') % 100 >= 30) continue;
        out.delete(id); used.delete(n);
      }
    }
  }
  const pros = list.filter((e) => !e.youth).sort((a, b) => b.ov - a.ov || (a.id < b.id ? -1 : 1));
  const stars = new Set(pros.slice(0, 3).map((e) => e.id));
  const need = [...pros, ...list.filter((e) => e.youth).sort((a, b) => b.ov - a.ov || (a.id < b.id ? -1 : 1))]
    .filter((e) => !out.has(e.id));
  for (const e of need) {
    const n = pickNumber(e, used, modern, stars.has(e.id));
    used.add(n); out.set(e.id, n);
  }
  return out;
}

/** Nummern eines vollen Kaders setzen (`fresh` = neu vergeben); liefert die Zahl geänderter Nummern. */
export function numberClub(club: Pick<Club, 'playerIds'>, players: Record<string, Player>, year: number, fresh: boolean): number {
  const list: ShirtEntry[] = club.playerIds.map((id) => players[id]).filter(Boolean)
    .map((p) => ({ id: p.id, pos: p.naturalPosition, ov: p.overall, cur: p.shirtNumber }));
  if (!list.length) return 0;
  const nums = numberSquad(list, year, fresh);
  let changed = 0;
  for (const e of list) {
    const n = nums.get(e.id)!;
    if (n !== e.cur) { players[e.id].shirtNumber = n; changed++; }
  }
  return changed;
}

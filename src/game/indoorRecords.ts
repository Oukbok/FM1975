// =============================================================================
// HALLE – Hallenruf der Spieler und Hallentraining (Wunsch Pascal)
// -----------------------------------------------------------------------------
// Hallenruf: Wer in Hallenturnieren trifft und Turniere gewinnt, sammelt über die
// Winter einen Ruf (Tore + 3 je Turniersieg + 5 je Masters-Sieg). Ab der Schwelle
// `hallSpecialistAt` gilt er als „Hallenspezialist“ (Etikett in Hallenkader-Auswahl,
// Spielerprofil, Bestenliste „Hallenkönige“ unter Statistiken › Halle). Die Schwelle
// hängt von der Epoche ab (Wunsch Pascal): Ruf des HALL_SPEC_TARGET-besten aktiven
// Hallenspielers, begrenzt durch eine Kurve je Winter (`hallSpecialistBounds`) –
// so gibt es je Saison etwa gleich viele Spezialisten, früh (wenige Turniere, kein
// Masters) mit niedrigerer, in der Masters-Zeit mit höherer Schwelle; nach 2004
// bleibt die Kurve auf dem letzten Hallenwinter stehen. Torschützen: aus dem
// Hallen-Textmodus (`IndoorMatch.sc`, engine/indoorMatch.ts), sonst je Tor fest
// aus Turnier/Spiel/Tor verteilt nach Torgefahr in der Halle (wie indoorSide).
// Gespeichert im optionalen `game.indoor.rec` (alte Spielstände: fehlt = leer).
//
// Hallentraining (Baustein `halle`, engine/weeklyTraining.ts, 1976–2004): volle
// Wirkung Nov–Jan (sonst halber Lerneffekt, game/trainerTeam.ts), jede Einheit der
// letzten 14 Tage vor einem Turnier gibt deinem Verein +0,5 Hallenstärke (höchstens
// +2 ≈ +5 % Torerwartung). Tage im optionalen `game.indoor.drill`. KI unverändert.
// =============================================================================
import { INDOOR_FIRST_WINTER, INDOOR_LAST_WINTER, winterYearOf } from '../data/indoorHistory';
import { CalendarEngine } from '../engine/calendar';
import { indoorSkill, type IndoorResult } from '../engine/indoor';
import { hashStr, mulberry32 } from '../engine/leagues';
import type { Player } from '../types';
import type { Game } from './state';
import { indoorState, type IndoorRec, type IndoorTournament } from './winterShared';

/** Hallenruf: Tore + 3 je Turniersieg + 5 je Masters-Sieg. */
export const hallRuf = (r: IndoorRec): number => r.g + 3 * r.w + 5 * r.m;

export function indoorRecs(g: Game): Record<string, IndoorRec> {
  return indoorState(g).rec ?? {};
}
export function hallRecOf(g: Game, pid: string): IndoorRec | undefined {
  return indoorState(g).rec?.[pid];
}
export function hallRufOf(g: Game, pid: string): number {
  const r = hallRecOf(g, pid);
  return r ? hallRuf(r) : 0;
}
// -----------------------------------------------------------------------------
// Schwelle „Hallenspezialist“ je Epoche
// -----------------------------------------------------------------------------
/** So viele aktive Spieler sollen je Saison ungefähr Hallenspezialist sein. */
export const HALL_SPEC_TARGET = 15;
/** Grenzen der Schwelle je Hallenwinter [Jahr, Untergrenze, Obergrenze] (Sim-Messung tests/simHall.ts). */
// Gemessen (2 × 34 Saisons): Ruf des 15. aktiven Spielers 1976 ≈ 5, 1980 ≈ 15, 1987 ≈ 22,
// Masters-Zeit 1990–1997 ≈ 35–57, 2001–2004 ≈ 25–37. Die Grenzen fangen Ausreißer ab
// (erster Winter, Kaderumbrüche) und halten die Schwelle nach 2004 fest.
const SPEC_CURVE: [number, number, number][] = [
  [1976, 6, 12], [1980, 10, 22], [1987, 16, 30], [1990, 24, 50], [1995, 30, 65], [2001, 30, 65], [2004, 24, 50],
];

/** Unter- und Obergrenze der Spezialisten-Schwelle im Winter `year` (linear zwischen den Stützstellen). */
export function hallSpecialistBounds(year: number): [number, number] {
  const y = Math.max(INDOOR_FIRST_WINTER, Math.min(INDOOR_LAST_WINTER, year));
  let i = 0;
  while (i < SPEC_CURVE.length - 2 && SPEC_CURVE[i + 1][0] <= y) i++;
  const [y0, lo0, hi0] = SPEC_CURVE[i], [y1, lo1, hi1] = SPEC_CURVE[i + 1];
  const f = y1 > y0 ? Math.min(1, Math.max(0, (y - y0) / (y1 - y0))) : 0;
  return [Math.round(lo0 + (lo1 - lo0) * f), Math.round(hi0 + (hi1 - hi0) * f)];
}

const specCache = new WeakMap<object, { key: string; at: number }>();
/**
 * Hallenruf, ab dem ein Spieler in der laufenden Saison „Hallenspezialist“ heißt:
 * Ruf des HALL_SPEC_TARGET-besten aktiven Spielers (noch in `game.players`),
 * begrenzt durch `hallSpecialistBounds` des aktuellen Winters.
 */
export function hallSpecialistAt(g: Game): number {
  const rec = indoorState(g).rec ?? {};
  const ids = Object.keys(rec);
  let sum = 0;
  for (const id of ids) sum += rec[id].t + rec[id].g;
  const key = `${g.season}|${ids.length}|${sum}`;
  const hit = specCache.get(rec);
  if (hit && hit.key === key) return hit.at;
  const rufs = ids.filter((id) => g.players[id]).map((id) => hallRuf(rec[id])).sort((a, b) => b - a);
  const [lo, hi] = hallSpecialistBounds(winterYearOf(g.season));
  const at = Math.max(lo, Math.min(hi, rufs[HALL_SPEC_TARGET - 1] ?? 0));
  specCache.set(rec, { key, at });
  return at;
}
export function isHallSpecialist(g: Game, pid: string): boolean {
  return hallRufOf(g, pid) >= hallSpecialistAt(g);
}
/** Kurzer Erklärsatz zur Schwelle (Spaltenkopf, Fußnote, i-Hilfe). */
export function hallSpecialistNote(g: Game): string {
  return `derzeit ab Ruf ${hallSpecialistAt(g)} – die Schwelle richtet sich nach den etwa ${HALL_SPEC_TARGET} besten aktiven Hallenspielern der Epoche`;
}

/** Torgefahr in der Halle (gleiches Gewicht wie im Textmodus, screens/indoor/indoorScript.ts). */
function threat(p: Player): number {
  return Math.max(1, (indoorSkill(p) - 35) * ((p.attributes.shooting + p.attributes.dribbling) / 120));
}

function pick(field: Player[], rng: () => number): Player {
  const tot = field.reduce((s, p) => s + threat(p), 0);
  let r = rng() * tot;
  for (const p of field) { r -= threat(p); if (r <= 0) return p; }
  return field[field.length - 1];
}

/**
 * Turnier verbuchen (game/indoorGame.ts `applyTournament`): Turniere, Spiele, Tore,
 * Turnier- und Masters-Siege je Spieler der Hallenkader (nur Vereine mit vollem Kader).
 */
export function creditIndoorTournament(g: Game, t: IndoorTournament, res: IndoorResult, squads: Map<string, Player[]>, winterYear: number): void {
  const rec = (indoorState(g).rec ??= {});
  const touch = (p: Player, cid: string): IndoorRec => {
    const r = (rec[p.id] ??= { n: p.fullName, c: cid, g: 0, s: 0, t: 0, w: 0, m: 0, y: winterYear });
    r.n = p.fullName; r.c = cid; r.y = winterYear;
    return r;
  };
  for (const [cid, sq] of squads) {
    if (!sq.length) continue;
    const games = res.matches.filter((m) => m.a === cid || m.b === cid).length;
    const won = res.ranking[0] === cid;
    for (const p of sq) {
      const r = touch(p, cid);
      r.t++; r.s += games;
      if (won) { r.w++; if (t.kind === 'masters') r.m++; }
    }
  }
  const rng = mulberry32(hashStr(`hallruf|${t.id}`));
  for (const m of res.matches) {
    for (const side of [0, 1] as const) {
      const sq = squads.get(side === 0 ? m.a : m.b);
      const n = side === 0 ? m.ga : m.gb;
      if (!sq?.length || n <= 0) continue;
      const field = sq.filter((p) => p.naturalPosition !== 'TW');
      if (!field.length) continue;
      const ids = (m.sc?.[side] ?? []).filter((id) => field.some((p) => p.id === id)).slice(0, n);
      while (ids.length < n) ids.push(pick(field, rng).id);
      for (const id of ids) if (rec[id]) rec[id].g++;
    }
    delete m.sc; // Spielstand schlank halten
  }
}

/** Winterende: kleine, alte Einträge aufräumen (Ruf < 4 und seit vier Wintern ohne Turnier). */
export function pruneIndoorRecs(g: Game, winterYear: number): void {
  const rec = indoorState(g).rec;
  if (!rec) return;
  for (const [id, r] of Object.entries(rec)) if (hallRuf(r) < 4 && r.y < winterYear - 3) delete rec[id];
}

export type HallKingSort = 'ruf' | 'g' | 'w';
export interface HallKing { id: string; r: IndoorRec; ruf: number }
/** Ewige Bestenliste („Hallenkönige“). */
export function hallKings(g: Game, by: HallKingSort = 'ruf', n = 30): HallKing[] {
  return Object.entries(indoorRecs(g)).map(([id, r]) => ({ id, r, ruf: hallRuf(r) }))
    .filter((k) => k.r.g > 0 || k.r.w > 0)
    .sort((a, b) => (by === 'g' ? b.r.g - a.r.g || b.ruf - a.ruf : by === 'w' ? b.r.w - a.r.w || b.r.m - a.r.m || b.ruf - a.ruf : b.ruf - a.ruf || b.r.g - a.r.g))
    .slice(0, n);
}

// -----------------------------------------------------------------------------
// Hallentraining
// -----------------------------------------------------------------------------
/** Hallenzeit: November bis Januar in den Hallenwintern 1976–2004. */
export function hallDrillSeason(date: string): boolean {
  const m = parseInt(date.slice(5, 7), 10);
  if (m !== 11 && m !== 12 && m !== 1) return false;
  const wy = parseInt(date.slice(0, 4), 10) + (m === 1 ? 0 : 1);
  return wy >= INDOOR_FIRST_WINTER && wy <= INDOOR_LAST_WINTER;
}

/** Hallenform je Einheit der letzten 14 Tage und Obergrenze (Hallenstärke). */
export const DRILL_STEP = 0.5;
export const DRILL_MAX = 2;
const DRILL_DAYS = 14;

/** Trainingstag des eigenen Vereins (game/trainingWeek.ts): Einheiten Hallentraining merken. */
export function noteHallDrill(g: Game, today: string, units: number): void {
  if (units <= 0 || !hallDrillSeason(today)) return;
  const st = indoorState(g);
  st.drill = [...(st.drill ?? []), ...Array.from({ length: units }, () => today)].slice(-12);
}

/** Einheiten Hallentraining in den 14 Tagen vor `date`. */
export function hallDrillUnits(g: Game, date: string): number {
  const from = CalendarEngine.addDays(date, -DRILL_DAYS);
  return (indoorState(g).drill ?? []).filter((d) => d < date && d >= from).length;
}

/** Bonus auf die Hallenstärke deines Vereins für ein Turnier am `date`. */
export function hallDrillBonus(g: Game, date: string): number {
  return Math.min(DRILL_MAX, DRILL_STEP * hallDrillUnits(g, date));
}

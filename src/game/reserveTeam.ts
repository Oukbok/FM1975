// =============================================================================
// ZWEITE MANNSCHAFT (Wunsch Pascal, #26): von einem eigenen Trainer geführt,
// du gibst Anweisungen. Jeder Verein mit Baustein „Zweite Mannschaft“
// (youthInvest.levels.reserve ≥ 1) hat eine; die KI-Vereine laufen wie bisher über
// die Reserve-Minuten (engine/youthAcademy.ts `reserveMinutesFor`).
// -----------------------------------------------------------------------------
// Eigener Verein (optionales `game.reserve`):
//  • Liga: Amateur-Oberliga (Stufe 1) bzw. Regionalliga (U23, Stufe 2 ab 1994) mit
//    17 Gegnern (zweite Mannschaften anderer Vereine + Amateurvereine), Spieltag
//    sonntags (nicht im Juni/Juli), Tabelle und Ergebnisse.
//  • Aufstellung je Spieltag nach Schwerpunkt: „Nachwuchs fördern“ (U23 und
//    Eigengewächse zuerst), „Ergebnisse“ (Stärkste), „Rückkehrer aufbauen“
//    (Profis ohne Spielpraxis, nach Verletzung oder Formtief zuerst).
//  • „Positionen trainieren“: bis zu drei Spieler spielen fest auf einer gewählten
//    Position und sammeln dort Vertrautheit (engine/positionSkill.ts).
//  • Wirkung: Wer spielt, bekommt Reserve-Minuten (Spielpraxis bis 23, gewichtet nach
//    Stufe und Schwerpunkt) – auch eingekaufte junge Profis; Rückkehrer über 23 gewinnen
//    Form. Wer nicht aufgestellt wird, bekommt keine Reserve-Minuten.
// Seite: views/jugend/ReserveTeamView.tsx.
// =============================================================================
import type { Game } from './state';
import type { Club, Player, Position } from '../types';
import { POOL_TOWNS } from '../data/poolTowns';
import { RESERVE_MINUTES, RESERVE_WEIGHT } from '../engine/youthAcademy';
import { addPositionMinutes } from '../engine/positionSkill';
import { hashStr, mulberry32, simMatchGoals } from '../engine/leagues';
import { positionSuitability } from '../engine/positions';

export type ReserveFocus = 'youth' | 'results' | 'comeback';
export const FOCUS_LABEL: Record<ReserveFocus, string> = { youth: 'Nachwuchs fördern', results: 'Ergebnisse', comeback: 'Rückkehrer aufbauen' };
export const FOCUS_TEXT: Record<ReserveFocus, string> = {
  youth: 'Junge Spieler und Eigengewächse spielen zuerst – mehr Spielpraxis für die Entwicklung, dafür schwächere Ergebnisse.',
  results: 'Der Trainer stellt die Stärksten auf. Gut für Tabelle und Selbstvertrauen, aber Talente sitzen öfter draußen.',
  comeback: 'Profis ohne Einsätze, nach Verletzungen oder im Formtief spielen zuerst und kommen in Form.',
};

export interface ReserveRow { id: string; name: string; str: number; p: number; w: number; d: number; l: number; gf: number; ga: number }
export interface ReserveResult { date: string; opp: string; home: boolean; gf: number; ga: number }
export interface ReserveState {
  season: string;
  focus: ReserveFocus;
  /** Profis über 23 dürfen mitspielen (für „Rückkehrer“ immer an). */
  pros: boolean;
  posTrain: { pid: string; pos: Position }[];
  table: ReserveRow[];
  results: ReserveResult[];
  /** Aufstellung des letzten Spieltags: [Spieler-ID, Position]. */
  lastXI: [string, Position][];
  md: number;
  /** Höhere Liga ab 1994 (Stufe 2). */
  level: number;
}
type G = Game & { reserve?: ReserveState };

export const OWN_ID = 'own';
const SLOTS: Position[] = ['TW', 'RV', 'IV', 'IV', 'LV', 'DM', 'ZM', 'OM', 'RA', 'LA', 'MS'];

export const reserveLevel = (c: Club) => c.youthInvest?.levels.reserve ?? 0;
export function reserveLeagueName(level: number, year: number): string {
  if (level >= 2) return year >= 2008 ? 'Regionalliga (U23)' : 'Regionalliga';
  return year >= 1994 ? 'Oberliga (Amateure)' : 'Amateur-Oberliga';
}

function newTable(g: Game, club: Club, level: number, base: number): ReserveRow[] {
  const r = mulberry32(hashStr(`${club.id}|${g.season}|res`));
  const others = Object.values(g.clubs).filter((c) => c.id !== club.id && reserveLevel(c) > 0 && !c.id.startsWith('am'))
    .sort((a, b) => hashStr(a.id + g.season) - hashStr(b.id + g.season)).slice(0, 9);
  const towns = [...POOL_TOWNS].sort((a, b) => hashStr(a.town + g.season) - hashStr(b.town + g.season)).map((t) => t.town)
    .filter((t) => !Object.values(g.clubs).some((c) => c.city === t)).slice(0, 17 - others.length);
  const rows: ReserveRow[] = [
    { id: OWN_ID, name: `${club.shortName || club.name} II`, str: base, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 },
    ...others.map((c) => ({ id: c.id, name: `${c.name} II`, str: base - 3 + (c.reputation - 60) * 0.12 + r() * 6, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 })),
    ...towns.map((t) => ({ id: `t:${t}`, name: t, str: base - 5 + level * 2 + r() * 8, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 })),
  ];
  if (rows.length % 2) rows.pop(); // Rundlauf braucht eine gerade Zahl
  return rows;
}

/** Zustand der zweiten Mannschaft (legt Tabelle zur neuen Saison an); null ohne zweite Mannschaft. */
export function reserveState(g: Game): ReserveState | null {
  const club = g.clubs[g.managedClubId];
  const level = reserveLevel(club);
  if (!level) return null;
  const gg = g as G;
  const prev = gg.reserve;
  if (!prev || prev.season !== g.season || prev.level !== level) {
    const el = eligible(g, club, prev?.pros ?? false);
    const squadStr = (avgTop(el, 11) * Math.min(11, el.length) + Math.max(0, 11 - el.length) * amateurStrength(level)) / 11;
    gg.reserve = {
      season: g.season, focus: prev?.focus ?? 'youth', pros: prev?.pros ?? false, posTrain: (prev?.posTrain ?? []).filter((x) => club.playerIds.includes(x.pid)),
      table: newTable(g, club, level, squadStr || 55), results: [], lastXI: [], md: 0, level,
    };
    catchUp(g, gg.reserve!);
  }
  return gg.reserve!;
}

const avgTop = (ps: Player[], n: number) => { const o = ps.map((p) => p.overall).sort((a, b) => b - a).slice(0, n); return o.length ? o.reduce((a, b) => a + b, 0) / o.length : 0; };
const out = (p: Player) => !!p.injury || p.suspensionMatches > 0 || p.availability !== 'available';

/** Spieler, die für die zweite Mannschaft in Frage kommen (nicht in der Profi-Startelf). */
export function eligible(g: Game, club: Club, pros: boolean): Player[] {
  const xi = new Set(club.tactics?.startingXI ?? Object.values(club.tactics?.lineupMap ?? {}));
  const squad = club.playerIds.map((id) => g.players[id]).filter((p): p is Player => !!p && !out(p) && !xi.has(p.id) && (pros || p.age <= 23));
  // Ältere A-Jugendliche (ab 17) helfen aus – wie bei echten Amateurmannschaften.
  const youth = (club.youthPlayerIds ?? []).map((id) => g.youthPlayers?.[id] ?? g.players[id]).filter((p): p is Player => !!p && !out(p) && p.age >= 17);
  return [...squad, ...youth.filter((y) => !squad.includes(y))];
}

/** Stärke der Amateure, die freie Plätze füllen (Vertragsamateure ohne Profistatus). */
export const amateurStrength = (level: number) => 50 + level * 4;

/** Aufstellung nach Schwerpunkt; Positions-Trainees fest auf ihrer Position. */
export function pickReserveXI(g: Game, club: Club, st: ReserveState): [Player, Position][] {
  const pros = st.pros || st.focus === 'comeback';
  const pool = eligible(g, club, pros);
  const prio = (p: Player) => st.focus === 'results' ? p.overall
    : st.focus === 'youth' ? p.overall * 0.3 + (23 - Math.min(23, p.age)) * 3 + (p.id.includes('_y_') ? 12 : 0)
      : p.overall * 0.4 + (100 - (p.development.recentMinutes ?? 0) / 6) * 0.4 + (100 - p.form) * 0.3;
  const used = new Set<string>();
  const xi: [Player, Position][] = [];
  const slots = [...SLOTS];
  for (const t of st.posTrain) {
    const p = pool.find((x) => x.id === t.pid);
    if (!p || used.has(p.id)) continue;
    const i = slots.indexOf(t.pos);
    if (i >= 0) slots.splice(i, 1); else slots.pop();
    xi.push([p, t.pos]); used.add(p.id);
  }
  for (const pos of slots) {
    let best: Player | undefined; let bv = -Infinity;
    for (const p of pool) {
      if (used.has(p.id)) continue;
      const fit = positionSuitability(p, pos);
      const v = prio(p) + fit * 0.6 - (pos === 'TW' ? (p.naturalPosition === 'TW' ? 0 : 200) : p.naturalPosition === 'TW' ? 200 : 0);
      if (v > bv) { bv = v; best = p; }
    }
    if (best) { xi.push([best, pos]); used.add(best.id); }
  }
  return xi;
}

/** Spieltag der zweiten Mannschaft (sonntags aus day.ts). */
export function reserveDaily(g: Game, today: string): void {
  if (new Date(`${today}T00:00:00Z`).getUTCDay() !== 0) return;
  const mo = today.slice(5, 7);
  if (mo === '06' || mo === '07') return;
  const st = reserveState(g);
  if (!st || st.md >= (st.table.length - 1) * 2) return;
  playMatchday(g, st, today, true);
}

function playMatchday(g: Game, st: ReserveState, today: string, effects: boolean): void {
  const club = g.clubs[g.managedClubId];
  const xi = pickReserveXI(g, club, st);
  st.lastXI = xi.map(([p, pos]) => [p.id, pos]);
  const r = mulberry32(hashStr(`${club.id}|${today}|resmd`));
  // Freie Plätze füllen Vertragsamateure.
  const fill = Math.max(0, 11 - xi.length);
  const ownStr = (xi.reduce((a, [p, pos]) => a + p.overall * Math.min(1, 0.6 + positionSuitability(p, pos) / 250), 0) + fill * amateurStrength(st.level)) / 11;
  const own = st.table.find((x) => x.id === OWN_ID)!;
  own.str = ownStr;
  // Paarungen des Spieltags: Rundlauf, der eigene Verein immer dabei.
  const ids = st.table.map((x) => x.id);
  const n = ids.length, round = st.md % (n - 1), second = st.md >= n - 1;
  const rot = [ids[0], ...ids.slice(1).slice(round), ...ids.slice(1).slice(0, round)];
  for (let i = 0; i < n / 2; i++) {
    let a = rot[i], b = rot[n - 1 - i];
    if ((i + st.md + (second ? 1 : 0)) % 2) [a, b] = [b, a];
    const A = st.table.find((x) => x.id === a)!, B = st.table.find((x) => x.id === b)!;
    const res = simMatchGoals(A.str, B.str, r);
    const book = (row: ReserveRow, gf: number, ga: number) => { row.p++; row.gf += gf; row.ga += ga; if (gf > ga) row.w++; else if (gf < ga) row.l++; else row.d++; };
    book(A, res.home, res.away); book(B, res.away, res.home);
    if (a === OWN_ID || b === OWN_ID) {
      const home = a === OWN_ID;
      st.results.unshift({ date: today, opp: (home ? B : A).name, home, gf: home ? res.home : res.away, ga: home ? res.away : res.home });
      if (st.results.length > 40) st.results.length = 40;
    }
  }
  st.md++;
  if (!effects) return;
  // Wirkung: Positionsminuten, Form für Rückkehrer (über 23); Spielpraxis bis 23 über withReserve.
  for (const [p, pos] of xi) {
    addPositionMinutes(p, pos, 90, today);
    if (p.age > 23 && st.focus === 'comeback') p.form = Math.min(100, p.form + 4);
  }
}

/** Neu angelegt mitten in der Saison (alter Spielstand, Baustein gerade gebaut): bisherige Spieltage nachholen (nur Tabelle). */
function catchUp(g: Game, st: ReserveState): void {
  const today = g.calendar.currentDate;
  const y = parseInt(g.season.slice(0, 4), 10);
  const d = new Date(Date.UTC(y, 7, 1));
  while (d.getUTCDay() !== 0) d.setUTCDate(d.getUTCDate() + 1);
  for (; d.toISOString().slice(0, 10) < today && st.md < (st.table.length - 1) * 2; d.setUTCDate(d.getUTCDate() + 7)) {
    const iso = d.toISOString().slice(0, 10);
    if (iso.slice(5, 7) === '06' || iso.slice(5, 7) === '07') continue;
    playMatchday(g, st, iso, false);
  }
}

/** Reserve-Minuten (Entwicklung) des eigenen Vereins: nur, wer in der zweiten Mannschaft spielt. */
export function ownReserveMinutes(g: Game, p: Player, proMinutes: number): number {
  const st = (g as G).reserve;
  if (!st || st.season !== g.season || !st.lastXI.some(([id]) => id === p.id) || p.age > 23) return 0;
  const w = RESERVE_WEIGHT[Math.min(2, st.level)] * (st.focus === 'youth' ? 1.15 : st.focus === 'results' ? 0.95 : 1);
  return Math.max(0, RESERVE_MINUTES - proMinutes) * w;
}

export function sortedTable(st: ReserveState): ReserveRow[] {
  return [...st.table].sort((a, b) => (b.w * 3 + b.d) - (a.w * 3 + a.d) || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
}

export function setReserveFocus(g: Game, f: ReserveFocus): void { const st = reserveState(g); if (st) st.focus = f; }
export function setReservePros(g: Game, on: boolean): void { const st = reserveState(g); if (st) st.pros = on; }
export function setPosTrain(g: Game, list: { pid: string; pos: Position }[]): void { const st = reserveState(g); if (st) st.posTrain = list.slice(0, 3); }

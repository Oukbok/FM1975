// =============================================================================
// ZWEITE MANNSCHAFT (Wunsch Pascal, #26): von einem eigenen Trainer geführt,
// du gibst Anweisungen. Jeder Verein mit Baustein „Zweite Mannschaft“
// (youthInvest.levels.reserve ≥ 1) hat eine; die KI-Vereine laufen über die
// Reserve-Minuten (engine/youthAcademy.ts `reserveMinutesFor`) und als schlanke
// Sim-Vereine in der Ligapyramide (game/reservePyramid.ts).
// -----------------------------------------------------------------------------
// Eigener Verein (optionales `game.reserve`, Sim-Verein `res-<id>`):
//  • Liga: Spielt die zweite Mannschaft in einer simulierten Staffel (Regionalliga,
//    3. Liga, NOFV-Oberliga), zählt deren Tabelle (engine/leagues.ts); Stärke = Elf des
//    letzten Sonntags. Sonst in der höchsten Amateurliga der Zeit (bis 1994 Amateur-
//    Oberliga, danach Oberliga; Tiefe 1/2 = Verbands-/Landesliga) mit 18 Mannschaften:
//    Pool-Vereine und zweite Mannschaften der Region + Amateurvereine, sonntags (nicht
//    im Juni/Juli). Auf-/Abstieg zum Saisonwechsel in game/reservePyramid.ts.
//  • Aufstellung je Spieltag nach Schwerpunkt: „Nachwuchs fördern“ (U23 und
//    Eigengewächse zuerst), „Ergebnisse“ (Stärkste), „Rückkehrer aufbauen“
//    (Profis ohne Spielpraxis, nach Verletzung oder Formtief zuerst). Ab 2008 höchstens
//    drei Spieler über 23 (data/reserveRules.ts).
//  • „Positionen trainieren“: bis zu drei Spieler spielen fest auf einer gewählten
//    Position und sammeln dort Vertrautheit (engine/positionSkill.ts).
//  • Wirkung: Wer spielt, bekommt Reserve-Minuten (Spielpraxis bis 23, gewichtet nach
//    Stufe und Schwerpunkt); Rückkehrer über 23 gewinnen Form.
// Seite: views/jugend/ReserveTeamView.tsx.
// =============================================================================
import type { Game } from './state';
import { homeCountryOf } from './state';
import type { Club, Player, Position } from '../types';
import { POOL_TOWNS } from '../data/poolTowns';
import { POOL_TIER } from '../data/history/historicClubs';
import { RESERVE_MINUTES, RESERVE_WEIGHT } from '../engine/youthAcademy';
import { addPositionMinutes } from '../engine/positionSkill';
import { hashStr, mulberry32, type LeagueDivision } from '../engine/leagues';
import { worldMatchGoals } from '../engine/world';
import { positionSuitability } from '../engine/positions';
import { localLeagueName, reserveEra } from '../data/reserveRules';
import { seasonStartYear } from '../data/timeline';
import { isReserveId, ownReserveId, reserveIdOf } from './reserveIds';
import { regionOf } from './reservePyramid';

export type ReserveFocus = 'youth' | 'results' | 'comeback';
export const FOCUS_LABEL: Record<ReserveFocus, string> = { youth: 'Nachwuchs fördern', results: 'Ergebnisse', comeback: 'Rückkehrer aufbauen' };
export const FOCUS_TEXT: Record<ReserveFocus, string> = {
  youth: 'Junge Spieler und Eigengewächse spielen zuerst – mehr Spielpraxis für die Entwicklung, dafür schwächere Ergebnisse.',
  results: 'Der Trainer stellt die Stärksten auf. Gut für Tabelle und Selbstvertrauen, aber Talente sitzen öfter draußen.',
  comeback: 'Profis ohne Einsätze, nach Verletzungen oder im Formtief spielen zuerst und kommen in Form.',
};

export interface ReserveRow { id: string; name: string; str: number; p: number; w: number; d: number; l: number; gf: number; ga: number }
export interface ReserveResult { date: string; opp: string; home: boolean; gf: number; ga: number; oppId?: string }
export interface ReserveState {
  season: string;
  focus: ReserveFocus;
  /** Profis über 23 dürfen mitspielen (für „Rückkehrer“ immer an). */
  pros: boolean;
  posTrain: { pid: string; pos: Position }[];
  /** Tabelle der Amateurliga (leer, wenn die Mannschaft in einer simulierten Staffel spielt). */
  table: ReserveRow[];
  results: ReserveResult[];
  /** Aufstellung des letzten Spieltags: [Spieler-ID, Position]. */
  lastXI: [string, Position][];
  md: number;
  /** Ausbaustufe des Bausteins (Gewicht der Spielpraxis). */
  level: number;
  /** Amateurliga: 0 = höchste (Oberliga), 1 = Verbandsliga, 2 = Landesliga. */
  depth?: number;
  /** Name der Amateurliga dieser Saison. */
  leagueName?: string;
  /** Letzter Hinweis zum Saisonwechsel (Aufstieg gesperrt, Zwangsabstieg …). */
  note?: string;
  /** Endplätze der vergangenen Saisons. */
  hist?: { season: string; league: string; pos: number; n: number }[];
}
type G = Game & { reserve?: ReserveState };

export const OWN_ID = 'own';
const SLOTS: Position[] = ['TW', 'RV', 'IV', 'IV', 'LV', 'DM', 'ZM', 'OM', 'RA', 'LA', 'MS'];

export const reserveLevel = (c: Club | undefined) => c?.youthInvest?.levels.reserve ?? 0;

/** Staffel der simulierten Pyramide, in der deine zweite Mannschaft spielt (oder null = Amateurliga). */
export function ownReserveDivision(g: Game): LeagueDivision | null {
  const id = ownReserveId(g);
  return g.leagues?.otherDivisions.find((d) => d.tier < 100 && d.clubIds.includes(id)) ?? null;
}

/** Eigenen Sim-Verein der zweiten Mannschaft sicherstellen (Pool = Amateurliga). */
function ensureOwnClub(g: Game, club: Club): void {
  const id = reserveIdOf(club.id);
  if (g.simClubs[id] || homeCountryOf(g) !== 'ger') return; // anderes Heimatland: nur die Amateurliga
  g.simClubs[id] = {
    id, name: `${club.name} ${seasonStartYear(g.season) >= 2005 ? 'II' : 'Amateure'}`, shortName: `${club.shortName.slice(0, 3)}2`, city: club.city,
    strength: 50, colors: { primary: club.colors.primary, secondary: club.colors.secondary }, tier: POOL_TIER, group: regionOf(g, club.id),
  };
}

function poolBase(g: Game): number {
  const pool = Object.values(g.simClubs).filter((s) => s.tier === POOL_TIER && !isReserveId(s.id));
  return pool.length ? pool.reduce((a, s) => a + s.strength, 0) / pool.length : 48;
}

/** Amateurliga der Region: Pool-Vereine und zweite Mannschaften der Region, Rest Amateurvereine aus Städten ohne Verein. */
function newLocalTable(g: Game, club: Club, depth: number): ReserveRow[] {
  const region = regionOf(g, club.id);
  const own = ownReserveId(g);
  const base = poolBase(g);
  const r = mulberry32(hashStr(`${club.id}|${g.season}|res`));
  const row = (id: string, name: string, str: number): ReserveRow => ({ id, name, str, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 });
  const rows: ReserveRow[] = [row(OWN_ID, g.simClubs[own]?.name ?? `${club.name} II`, base)];
  if (depth === 0) {
    const pool = Object.values(g.simClubs).filter((s) => s.tier === POOL_TIER && s.id !== own && regionOf(g, s.id) === region);
    const res = pool.filter((s) => isReserveId(s.id)).sort((a, b) => b.strength - a.strength).slice(0, 4);
    const ama = pool.filter((s) => !isReserveId(s.id)).sort((a, b) => b.strength - a.strength).slice(0, 13 - res.length);
    for (const s of [...res, ...ama]) rows.push(row(s.id, s.name, s.strength));
  }
  const cities = new Set([...Object.values(g.clubs).map((c) => c.city), ...Object.values(g.simClubs).map((c) => c.city)]);
  const towns = [...POOL_TOWNS].sort((a, b) => (b.group === region ? 1 : 0) - (a.group === region ? 1 : 0) || hashStr(a.town + g.season) - hashStr(b.town + g.season))
    .map((t) => t.town).filter((t) => !cities.has(t));
  for (const t of towns) {
    if (rows.length >= 18) break;
    rows.push(row(`t:${t}`, t, base - 2 - depth * 4 + r() * 6));
  }
  if (rows.length % 2) rows.pop(); // Rundlauf braucht eine gerade Zahl
  return rows;
}

/** Zustand der zweiten Mannschaft (legt die Amateurliga zur neuen Saison an); null ohne zweite Mannschaft. */
export function reserveState(g: Game): ReserveState | null {
  const club = g.clubs[g.managedClubId];
  const level = reserveLevel(club);
  if (!level) return null;
  const gg = g as G;
  const prev = gg.reserve;
  ensureOwnClub(g, club);
  if (!prev || prev.season !== g.season) {
    const div = ownReserveDivision(g);
    const depth = div ? 0 : prev?.depth ?? 0;
    gg.reserve = {
      season: g.season, focus: prev?.focus ?? 'youth', pros: prev?.pros ?? false, posTrain: (prev?.posTrain ?? []).filter((x) => club.playerIds.includes(x.pid)),
      table: div ? [] : newLocalTable(g, club, depth), results: [], lastXI: [], md: 0, level, depth,
      leagueName: div ? div.name : localLeagueName(seasonStartYear(g.season), depth), note: prev?.note, hist: prev?.hist,
    };
    if (!div) catchUp(g, gg.reserve!);
  }
  gg.reserve!.level = level;
  return gg.reserve!;
}

const avgTop = (ps: Player[], n: number) => { const o = ps.map((p) => p.overall).sort((a, b) => b - a).slice(0, n); return o.length ? o.reduce((a, b) => a + b, 0) / o.length : 0; };
const out = (p: Player) => !!p.injury || p.suspensionMatches > 0 || p.availability !== 'available';

/** Spieler, die für die zweite Mannschaft in Frage kommen (nicht in der Profi-Startelf). */
export function eligible(g: Game, club: Club, pros: boolean, exclude?: Set<string>): Player[] {
  const xi = new Set(club.tactics?.startingXI ?? Object.values(club.tactics?.lineupMap ?? {}));
  for (const id of exclude ?? []) xi.add(id);
  const squad = club.playerIds.map((id) => g.players[id]).filter((p): p is Player => !!p && !out(p) && !xi.has(p.id) && (pros || p.age <= 23));
  // Ältere A-Jugendliche (ab 17) helfen aus – wie bei echten Amateurmannschaften.
  const youth = (club.youthPlayerIds ?? []).map((id) => g.youthPlayers?.[id] ?? g.players[id]).filter((p): p is Player => !!p && !out(p) && p.age >= 17);
  return [...squad, ...youth.filter((y) => !squad.includes(y) && !xi.has(y.id))];
}

/** Stärke der Vertragsamateure (ohne Profistatus), die Plätze füllen: Niveau der Amateurliga + Ausbaustufe. */
export const amateurStrength = (g: Game, level: number) => poolBase(g) + 2 + level * 2;
const effOf = (p: Player, pos: Position) => p.overall * Math.min(1, 0.6 + positionSuitability(p, pos) / 250);

/** Aufstellung nach Schwerpunkt; Positions-Trainees fest auf ihrer Position; ab 2008 höchstens drei über 23. */
export function pickReserveXI(g: Game, club: Club, st: Pick<ReserveState, 'pros' | 'focus' | 'posTrain'>, exclude?: Set<string>): [Player, Position][] {
  const pros = st.pros || st.focus === 'comeback';
  const pool = eligible(g, club, pros, exclude);
  const maxOld = reserveEra(seasonStartYear(g.season)).over23 ?? 11;
  const prio = (p: Player) => st.focus === 'results' ? p.overall
    : st.focus === 'youth' ? p.overall * 0.3 + (23 - Math.min(23, p.age)) * 3 + (p.id.includes('_y_') ? 12 : 0)
      : p.overall * 0.4 + (100 - (p.development.recentMinutes ?? 0) / 6) * 0.4 + (100 - p.form) * 0.3;
  const used = new Set<string>();
  const xi: [Player, Position][] = [];
  const slots = [...SLOTS];
  const old = () => xi.filter(([p]) => p.age > 23).length;
  for (const t of st.posTrain) {
    const p = pool.find((x) => x.id === t.pid);
    if (!p || used.has(p.id) || (p.age > 23 && old() >= maxOld)) continue;
    const i = slots.indexOf(t.pos);
    if (i >= 0) slots.splice(i, 1); else slots.pop();
    xi.push([p, t.pos]); used.add(p.id);
  }
  for (const pos of slots) {
    let best: Player | undefined; let bv = -Infinity;
    for (const p of pool) {
      if (used.has(p.id) || (p.age > 23 && old() >= maxOld)) continue;
      const fit = positionSuitability(p, pos);
      const v = prio(p) + fit * 0.6 - (pos === 'TW' ? (p.naturalPosition === 'TW' ? 0 : 200) : p.naturalPosition === 'TW' ? 200 : 0);
      if (v > bv) { bv = v; best = p; }
    }
    if (best) { xi.push([best, pos]); used.add(best.id); }
  }
  // Vertragsamateure: Wer schwächer ist als sie, sitzt draußen – bei „Nachwuchs“/„Rückkehrer“
  // spielen trotzdem mindestens sechs bzw. sieben eigene Spieler, Positions-Trainees immer.
  const keep = st.focus === 'results' ? 0 : st.focus === 'youth' ? 6 : 7;
  const am = amateurStrength(g, reserveLevel(club));
  const fixed = new Set(st.posTrain.map((t) => t.pid));
  const weak = xi.filter(([p, pos]) => !fixed.has(p.id) && effOf(p, pos) < am).sort((a, b) => effOf(a[0], a[1]) - effOf(b[0], b[1]));
  let drop = Math.min(weak.length, Math.max(0, xi.length - keep));
  const out = new Set<string>();
  for (const [p] of weak) { if (drop-- <= 0) break; out.add(p.id); }
  // Frei gewordene Plätze: zuerst ein eigener Spieler, der dort stärker ist als die Amateure.
  const res: [Player, Position][] = [];
  for (const [p, pos] of xi) {
    if (!out.has(p.id)) { res.push([p, pos]); continue; }
    const alt = pool.filter((q) => !used.has(q.id) && (pos === 'TW') === (q.naturalPosition === 'TW') && effOf(q, pos) >= am && !(q.age > 23 && res.filter(([x]) => x.age > 23).length + xi.filter(([x]) => !out.has(x.id) && x.age > 23).length >= maxOld))
      .sort((a, b) => prio(b) - prio(a))[0];
    if (alt) { used.add(alt.id); res.push([alt, pos]); }
  }
  return res;
}

function xiStrength(g: Game, xi: [Player, Position][], level: number): number {
  const fill = Math.max(0, 11 - xi.length);
  return (xi.reduce((a, [p, pos]) => a + effOf(p, pos), 0) + fill * amateurStrength(g, level)) / 11;
}

/** Stärke deiner zweiten Mannschaft mit der Elf, die der Trainer jetzt aufstellen würde (0 ohne zweite Mannschaft). */
export function xiStrengthNow(g: Game): number {
  const club = g.clubs[g.managedClubId];
  const level = reserveLevel(club);
  if (!level) return 0;
  const st = (g as G).reserve;
  return xiStrength(g, pickReserveXI(g, club, { pros: st?.pros ?? false, focus: st?.focus ?? 'youth', posTrain: st?.posTrain ?? [] }), level);
}

/** Spieltag der zweiten Mannschaft (sonntags aus day.ts). */
export function reserveDaily(g: Game, today: string): void {
  if (new Date(`${today}T00:00:00Z`).getUTCDay() !== 0) return;
  const mo = today.slice(5, 7);
  if (mo === '06' || mo === '07') return;
  const st = reserveState(g);
  if (!st) return;
  const div = ownReserveDivision(g);
  if (div) { divisionWeek(g, st, div, today); return; }
  if (!st.table.length || st.md >= (st.table.length - 1) * 2) return;
  playMatchday(g, st, today, true);
}

/** Staffel-Modus: Elf aufstellen, Stärke setzen; Wirkung, wenn die Mannschaft in dieser Woche gespielt hat. */
function divisionWeek(g: Game, st: ReserveState, div: LeagueDivision, today: string): void {
  const club = g.clubs[g.managedClubId];
  const id = ownReserveId(g);
  const xi = pickReserveXI(g, club, st);
  const sc = g.simClubs[id];
  if (sc) sc.strength = Math.round(xiStrength(g, xi, st.level));
  const weekAgo = new Date(Date.parse(`${today}T00:00:00Z`) - 7 * 86400000).toISOString().slice(0, 10);
  const played = div.fixtures.some((m) => m.status === 'finished' && m.date > weekAgo && m.date <= today && (m.homeClubId === id || m.awayClubId === id));
  if (!played) return;
  st.lastXI = xi.map(([p, pos]) => [p.id, pos]);
  st.md++;
  applyEffects(st, xi, today);
}

function applyEffects(st: ReserveState, xi: [Player, Position][], today: string): void {
  for (const [p, pos] of xi) {
    addPositionMinutes(p, pos, 90, today);
    if (p.age > 23 && st.focus === 'comeback') p.form = Math.min(100, p.form + 4);
  }
}

const rowStr = (g: Game, r: ReserveRow) => g.simClubs[r.id]?.strength ?? r.str;

function playMatchday(g: Game, st: ReserveState, today: string, effects: boolean): void {
  const club = g.clubs[g.managedClubId];
  const xi = pickReserveXI(g, club, st);
  if (effects) st.lastXI = xi.map(([p, pos]) => [p.id, pos]);
  const r = mulberry32(hashStr(`${club.id}|${today}|resmd`));
  const own = st.table.find((x) => x.id === OWN_ID)!;
  own.str = xiStrength(g, xi, st.level);
  const sc = g.simClubs[ownReserveId(g)];
  if (sc && effects) sc.strength = Math.round(own.str);
  // Paarungen des Spieltags: Rundlauf, der eigene Verein immer dabei.
  const ids = st.table.map((x) => x.id);
  const n = ids.length, round = st.md % (n - 1), second = st.md >= n - 1;
  const rot = [ids[0], ...ids.slice(1).slice(round), ...ids.slice(1).slice(0, round)];
  for (let i = 0; i < n / 2; i++) {
    let a = rot[i], b = rot[n - 1 - i];
    if ((i + st.md + (second ? 1 : 0)) % 2) [a, b] = [b, a];
    const A = st.table.find((x) => x.id === a)!, B = st.table.find((x) => x.id === b)!;
    // Schärferes Modell der Auslandsligen (engine/world.ts): Der Stärkere setzt sich über eine Saison eher durch.
    const [hg, ag] = worldMatchGoals(A.id === OWN_ID ? A.str : rowStr(g, A), B.id === OWN_ID ? B.str : rowStr(g, B), r);
    const res = { home: hg, away: ag };
    const book = (row: ReserveRow, gf: number, ga: number) => { row.p++; row.gf += gf; row.ga += ga; if (gf > ga) row.w++; else if (gf < ga) row.l++; else row.d++; };
    book(A, res.home, res.away); book(B, res.away, res.home);
    if (a === OWN_ID || b === OWN_ID) {
      const home = a === OWN_ID;
      const opp = home ? B : A;
      st.results.unshift({ date: today, opp: opp.name, oppId: opp.id.startsWith('t:') ? undefined : opp.id, home, gf: home ? res.home : res.away, ga: home ? res.away : res.home });
      if (st.results.length > 40) st.results.length = 40;
    }
  }
  st.md++;
  if (effects) applyEffects(st, xi, today);
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

/** Saisonende der Amateurliga: offene Spieltage nachholen (nur Tabelle), Endplatz. */
export function finishLocalSeason(g: Game, st: ReserveState): { pos: number; n: number } {
  const y = seasonStartYear(st.season) + 1;
  for (let guard = 0; st.md < (st.table.length - 1) * 2 && guard < 60; guard++) playMatchday(g, st, `${y}-06-${String(1 + (guard % 28)).padStart(2, '0')}`, false);
  const t = sortedTable(st, g.pointSystem === '3-point' ? 3 : 2);
  return { pos: t.findIndex((r) => r.id === OWN_ID) + 1, n: t.length };
}

/** Reserve-Minuten (Entwicklung) des eigenen Vereins: nur, wer in der zweiten Mannschaft spielt. */
export function ownReserveMinutes(g: Game, p: Player, proMinutes: number): number {
  const st = (g as G).reserve;
  if (!st || st.season !== g.season || !st.lastXI.some(([id]) => id === p.id) || p.age > 23) return 0;
  const w = RESERVE_WEIGHT[Math.min(2, st.level)] * (st.focus === 'youth' ? 1.15 : st.focus === 'results' ? 0.95 : 1);
  return Math.max(0, RESERVE_MINUTES - proMinutes) * w;
}

export function sortedTable(st: ReserveState, win = 3): ReserveRow[] {
  return [...st.table].sort((a, b) => (b.w * win + b.d) - (a.w * win + a.d) || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
}

export function setReserveFocus(g: Game, f: ReserveFocus): void { const st = reserveState(g); if (st) st.focus = f; }
export function setReservePros(g: Game, on: boolean): void { const st = reserveState(g); if (st) st.pros = on; }
export function setPosTrain(g: Game, list: { pid: string; pos: Position }[]): void { const st = reserveState(g); if (st) st.posTrain = list.slice(0, 3); }

// =============================================================================
// SPIELERPOOL (Transfers › Spielerpool, Wunsch Pascal): alle Spieler der Welt
// -----------------------------------------------------------------------------
// Eine Zeile je Spieler aus drei Quellen: volle Kader (`g.players`), Jugend der
// Vereine mit vollem Kader (`g.youthPlayers`) und Weltspieler (game/worldPool.ts).
//
// BEKANNTHEIT 0..1 – wie gut dein Stab einen Spieler kennt (verdeckt):
//   Grundwert nach Liga: eigene Liga ≈ 0,5, andere Vereine mit vollem Kader 0,38,
//   2. Liga 0,22, Amateure 0,06–0,12, Ausland 1. Liga 0,10–0,18, darunter 0,04.
//   + Medien je Epoche (Fernsehen, Internet, Datenbanken: 1975 0 → heute +0,3, im
//     Ausland voll, im Inland halb), + Ruhm (Stars sind überall bekannt),
//   + direkte Duelle der letzten drei Jahre (je Spiel +0,07, höchstens +0,3),
//   + Scouting-Abteilung (Qualität der Scouts), + laufende Verhandlung.
//   Jugendliche: nur knapp die Hälfte. Scouting-Berichte heben den Wert (game/
//   scoutingGame.ts) und veralten mit 0,12 je Jahr.
// SCHÄTZUNG: Stärke, Potenzial und Marktwert als Spanne um einen fest verschobenen
//   Mittelwert (Schätzfehler je Spieler aus der ID). Je besser bekannt, desto
//   schmaler und genauer. Sortierung und Filter nutzen nur die Schätzung.
// =============================================================================
import { homeNationality } from '../data/origins';
import { potentialToStars, type Player, type Position } from '../types';
import { scoutRange } from '../engine/scouting';
import { isForeignId } from '../engine/world';
import { staffEffectsOf } from './staffGame';
import type { Game } from './state';
import { ensureWorldPool, worldClubs, worldValue, WP_FIELD as W, type WorldClubInfo } from './worldPool';
import { scoutReport } from './scoutingGame';

export type PoolKind = 'pro' | 'youth' | 'world';
export interface PoolRow {
  id: string;
  kind: PoolKind;
  name: string;
  clubId: string;
  /** Land des Vereins (Schlüssel, 'Deutschland' für deutsche Vereine). */
  country: string;
  level: number;
  nat: string;
  face: string;
  age: number;
  born: number;
  pos: Position;
  ov: number;
  pot: number;
  value: number;
  youth: boolean;
  foot: string;
  height: number;
  /** Vertragsende (nur volle Kader). */
  contractEnd?: string;
  player?: Player;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Land und Liga-Ebene eines Vereins mit vollem Kader. */
function clubFormOf(g: Game, id: string): { country: string; level: number } {
  if (g.table?.rows.some((r) => r.clubId === id)) return { country: 'Deutschland', level: g.leagues?.playerDivision?.tier ?? 1 };
  if (id.startsWith('ddr')) return { country: 'DDR', level: 1 };
  if (/^am\d/.test(id)) return { country: 'Deutschland', level: 5 };
  const e = g.euroClubs?.[id];
  if (e) return { country: e.country, level: 1 };
  const d = g.leagues?.otherDivisions.find((x) => x.clubIds.includes(id));
  return { country: 'Deutschland', level: d ? d.tier % 100 : 1 };
}
function h01(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967296;
}

let cache: { key: string; rows: PoolRow[]; clubs: Map<string, WorldClubInfo> } | null = null;

/** Alle Spieler der Welt (Zwischenspeicher je Spieltag und Bestand). */
export function poolRows(g: Game): { rows: PoolRow[]; clubs: Map<string, WorldClubInfo> } {
  const wp = ensureWorldPool(g);
  const key = `${g.calendar.currentDate}|${Object.keys(g.players).length}|${Object.keys(g.youthPlayers ?? {}).length}|${wp.p.length}|${wp.next}|${g.managedClubId}`;
  if (cache?.key === key) return cache;
  const year = Number(g.calendar.currentDate.slice(0, 4));
  const startYear = Number(g.season.slice(0, 4));
  const clubs = worldClubs(g);
  const rows: PoolRow[] = [];
  const realInfo = (id: string) => clubFormOf(g, id);
  const fromPlayer = (p: Player, kind: PoolKind): PoolRow | null => {
    if (!p.clubId) return null;
    if ((p as Player & { world?: boolean }).world) return null; // steht als Weltspieler im Pool
    if (isForeignId(p.clubId) && p.clubId !== g.managedClubId) return null; // alte Europapokal-Kader: der Weltpool ersetzt sie
    const info = realInfo(p.clubId);
    return {
      id: p.id, kind, name: p.fullName, clubId: p.clubId, country: info.country, level: info.level, nat: p.nationality || 'GER', face: p.face ?? '',
      age: p.age, born: Number(p.dateOfBirth?.slice(0, 4)) || year - p.age, pos: p.naturalPosition, ov: p.overall,
      pot: Math.max(p.overall, (p.development?.basePotential ?? p.overall) + (p.development?.unfold ?? 0)),
      value: p.contract?.transferValue ?? 0, youth: kind === 'youth' || p.age <= 18, foot: p.preferredFoot, height: p.height,
      contractEnd: p.contract?.expiryDate, player: p,
    };
  };
  for (const p of Object.values(g.players)) { const r = fromPlayer(p, 'pro'); if (r) rows.push(r); }
  for (const p of Object.values(g.youthPlayers ?? {})) { const r = fromPlayer(p, 'youth'); if (r) rows.push(r); }
  for (const w of wp.p) {
    const c = clubs.get(w[W.club]);
    if (!c) continue;
    rows.push({
      id: w[W.id], kind: 'world', name: `${w[W.first]} ${w[W.last]}`, clubId: c.id, country: c.country, level: c.level, nat: w[W.nat], face: w[W.face],
      age: startYear - w[W.born], born: w[W.born], pos: w[W.pos], ov: w[W.ov], pot: w[W.pot], value: worldValue(w, year), youth: !!w[W.youth],
      foot: w[W.foot] === 1 ? 'left' : w[W.foot] === 2 ? 'both' : 'right', height: w[W.height],
    });
  }
  cache = { key, rows, clubs };
  return cache;
}

/** Treffen deines Vereins mit diesem Verein in den letzten drei Jahren. */
function meetings(g: Game, clubId: string): number {
  const book = (g as Game & { clubRecords?: { h2hClub: string; h2h: Record<string, [string, string, string, number, number, number][]> } }).clubRecords;
  if (!book || book.h2hClub !== g.managedClubId) return 0;
  const since = `${Number(g.calendar.currentDate.slice(0, 4)) - 3}${g.calendar.currentDate.slice(4)}`;
  return (book.h2h[clubId] ?? []).filter((m) => m[1] >= since).length;
}

/** Medienpräsenz je Epoche (0 … 0,3). */
export function mediaEra(year: number): number {
  const t = clamp((year - 1975) / 50, 0, 1);
  return 0.3 * t;
}

export interface KnowCtx { g: Game; year: number; scout: number; home: string; leagueIds: Set<string>; meet: Map<string, number>; talks: Set<string> }

export function knowCtx(g: Game): KnowCtx {
  const fx = staffEffectsOf(g);
  return {
    g, year: Number(g.calendar.currentDate.slice(0, 4)), scout: fx.scouting ?? 0, home: homeNationality(),
    leagueIds: new Set((g.table?.rows ?? []).map((r) => r.clubId)), meet: new Map(),
    talks: new Set((g.transferTalks ?? []).filter((t) => t.phase === 'club' || t.phase === 'player' || t.phase === 'agreed').map((t) => t.playerId)),
  };
}

/** Bekanntheit 0..1 (1 = eigener Spieler). */
export function knowledge(ctx: KnowCtx, r: PoolRow): number {
  const g = ctx.g;
  if (r.clubId === g.managedClubId) return 1;
  const domestic = r.country === 'Deutschland';
  let k: number;
  if (ctx.leagueIds.has(r.clubId)) k = 0.5;
  else if (r.kind !== 'world' && domestic) k = 0.38;
  else if (domestic) k = r.level <= 2 ? 0.22 : r.level === 3 ? 0.12 : 0.06;
  else k = r.level === 1 ? 0.1 : 0.04;
  const media = mediaEra(ctx.year) * (domestic ? 0.5 : 1);
  k += media;
  // Ruhm: Spitzenspieler kennt man überall (mit der Zeit immer besser).
  const fame = clamp((r.ov - 72) / 18, 0, 1) * (0.3 + media) * (r.level === 1 ? 1 : 0.6);
  k += fame * (1 - k);
  let m = ctx.meet.get(r.clubId);
  if (m == null) { m = meetings(g, r.clubId); ctx.meet.set(r.clubId, m); }
  k += Math.min(0.3, m * 0.07);
  if (r.nat === ctx.home && !domestic) k += 0.04;
  k += ctx.scout * 1.2;
  if (r.youth) k *= 0.45;
  if (ctx.talks.has(r.id)) k += 0.15;
  const rep = scoutReport(g, r.id);
  if (rep) k = Math.max(k, rep);
  return clamp(k, 0.03, 0.97);
}

export interface Estimate {
  k: number;
  /** Stärke: Mitte und Spanne. */
  ov: number; ovLo: number; ovHi: number;
  /** Potenzial in Sternen. */
  st: number; stLo: number; stHi: number;
  value: number;
  /** genau (Spanne ≤ 1) */
  exact: boolean;
}

const q2 = (x: number) => Math.round(x * 2) / 2;

/** Geschätzte Werte nach Bekanntheit (fester Schätzfehler je Spieler). */
export function estimate(r: PoolRow, k: number): Estimate {
  const u = 1 - k;
  const b1 = h01(`${r.id}|ov`) * 2 - 1, b2 = h01(`${r.id}|pt`) * 2 - 1, b3 = h01(`${r.id}|mw`) * 2 - 1;
  const ov = Math.round(clamp(r.ov + b1 * u * 12, 20, 99));
  const half = Math.round(u * 10);
  const stars = potentialToStars(r.pot);
  const st = clamp(q2(stars + b2 * u * 1.4), 0.5, 5);
  const sh = Math.max(0, q2(u * 1.5));
  const value = Math.max(5000, Math.round((r.value * (1 + b3 * u * 0.6)) / 5000) * 5000);
  let stLo = clamp(st - sh, 0.5, 5), stHi = clamp(st + sh, 0.5, 5), stMid = st;
  // Potenzial bleibt auch bei bekannten Spielern eine Einschätzung: volle Kader nutzen die
  // Scout-Spanne des Spiels (engine/scouting.ts), sonst mindestens ±0,25 Sterne.
  if (r.player && k < 0.999) {
    const [a, b] = scoutRange(r.player);
    if (k >= 0.75 && b - a > 0.5) { stMid = q2((a + b) / 2); stLo = clamp(stMid - 0.25, 0.5, 5); stHi = clamp(stMid + 0.25, 0.5, 5); }
    else { stLo = a; stHi = b; stMid = q2((a + b) / 2); }
  } else if (k < 0.999 && stLo === stHi) { stLo = clamp(st - 0.25, 0.5, 5); stHi = clamp(st + 0.25, 0.5, 5); }
  return { k, ov, ovLo: clamp(ov - half, 20, 99), ovHi: clamp(ov + half, 20, 99), st: stMid, stLo, stHi, value, exact: half <= 1 };
}

/** Schätzung für einen einzelnen Spieler (Verhandlung, Steckbrief); null = eigener/unbekannter Spieler. */
export function estimateFor(g: Game, id: string): Estimate | null {
  const r = poolRows(g).rows.find((x) => x.id === id);
  if (!r || r.clubId === g.managedClubId) return null;
  return estimate(r, knowledge(knowCtx(g), r));
}

/** Bekanntheit in Worten. */
export function knowWord(k: number): string {
  return k >= 0.9 ? 'genau bekannt' : k >= 0.7 ? 'gut bekannt' : k >= 0.45 ? 'bekannt' : k >= 0.2 ? 'vage bekannt' : 'unbekannt';
}

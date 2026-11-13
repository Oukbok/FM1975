// =============================================================================
// GEGNER (Aufstellung › Gegner, Wunsch Pascal): nächstes eigenes Pflichtspiel in
// allen Wettbewerben (Liga, Landespokal, Europapokal, Supercup) und Anzeigedaten
// über den Gegner – nur gelesen, kein Spielstand-Feld.
// =============================================================================
import type { Match, Player } from '../types';
import type { Game } from './state';
import { ownFixtureOn } from './euroFixture';
import { h2hOf } from './clubRecords';
import { clubStrength, drawClubName } from './cupDraw';
import { POSITION_GROUPS } from '../types';

export interface NextOpp {
  date: string;
  opp: string;
  home: boolean;
  /** Wettbewerb/Runde zur Anzeige. */
  comp: string;
  kind: 'liga' | 'pokal' | 'euro' | 'super';
  matchday?: number;
}

/** Nächstes eigenes Pflichtspiel ab heute (frühester Termin über alle Wettbewerbe). */
export function nextOpponent(g: Game): NextOpp | null {
  const me = g.managedClubId;
  const today = g.calendar.currentDate;
  let best: NextOpp | null = null;
  const take = (n: NextOpp) => { if (!best || n.date < best.date) best = n; };
  for (const m of g.fixtures) {
    if (m.status !== 'scheduled' || m.date < today || (m.homeClubId !== me && m.awayClubId !== me)) continue;
    const home = m.homeClubId === me;
    take({ date: m.date, opp: home ? m.awayClubId : m.homeClubId, home, comp: `Liga · ${m.matchday}. Spieltag`, kind: 'liga', matchday: m.matchday });
  }
  for (const ev of g.calendar.events) {
    if (ev.date < today || (best && ev.date >= (best as NextOpp).date)) continue;
    if (ev.type !== 'cup_matchday' && ev.type !== 'euro_matchday' && ev.type !== 'super_cup') continue;
    const fx = ownFixtureOn(g, ev);
    if (!fx || !fx.opp || fx.match?.status === 'finished') continue;
    take({ date: ev.date, opp: fx.opp, home: fx.home, comp: fx.comp, kind: ev.type === 'cup_matchday' ? 'pokal' : ev.type === 'euro_matchday' ? 'euro' : 'super' });
  }
  return best;
}

export const oppName = (g: Game, id: string) => g.clubs[id]?.name ?? drawClubName(g, id);
export const oppStrength = (g: Game, id: string) => Math.round(clubStrength(g, id));

/** Letzte Pflichtspiele eines Vereins mit vollem Spielplan (Liga der Spielerliga). */
export function recentMatches(g: Game, clubId: string, n = 6): Match[] {
  return g.fixtures
    .filter((m) => m.status === 'finished' && m.result && (m.homeClubId === clubId || m.awayClubId === clubId))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, n);
}

/** Heim-/Auswärtsbilanz der laufenden Ligasaison: [S, U, N, Tore, Gegentore]. */
export function homeAwayRecord(g: Game, clubId: string): { home: number[]; away: number[] } {
  const home = [0, 0, 0, 0, 0], away = [0, 0, 0, 0, 0];
  for (const m of g.fixtures) {
    if (m.status !== 'finished' || !m.result) continue;
    const isHome = m.homeClubId === clubId;
    if (!isHome && m.awayClubId !== clubId) continue;
    const gf = isHome ? m.result.homeGoals : m.result.awayGoals;
    const ga = isHome ? m.result.awayGoals : m.result.homeGoals;
    const r = isHome ? home : away;
    r[gf > ga ? 0 : gf === ga ? 1 : 2]++;
    r[3] += gf; r[4] += ga;
  }
  return { home, away };
}

export interface UnitRow { key: 'GK' | 'DEF' | 'MID' | 'ATT'; label: string; us: number; them: number }
const UNIT_N = { GK: 1, DEF: 4, MID: 4, ATT: 2 } as const;
const UNIT_DE = { GK: 'Torwart', DEF: 'Abwehr', MID: 'Mittelfeld', ATT: 'Angriff' } as const;

const squad = (g: Game, clubId: string): Player[] => (g.clubs[clubId]?.playerIds ?? []).map((id) => g.players[id]).filter(Boolean);

function unitAvg(ps: Player[], key: UnitRow['key']): number {
  const best = ps.filter((p) => POSITION_GROUPS[p.naturalPosition] === key).sort((a, b) => b.overall - a.overall).slice(0, UNIT_N[key]);
  return best.length ? Math.round(best.reduce((a, p) => a + p.overall, 0) / best.length) : 0;
}

/** Mannschaftsteile im Vergleich (Ø der Besten je Teil: TW 1, Abwehr 4, Mittelfeld 4, Angriff 2). */
export function unitCompare(g: Game, oppId: string): UnitRow[] | null {
  const them = squad(g, oppId);
  if (!them.length) return null;
  const us = squad(g, g.managedClubId);
  return (['GK', 'DEF', 'MID', 'ATT'] as const).map((k) => ({ key: k, label: UNIT_DE[k], us: unitAvg(us, k), them: unitAvg(them, k) }));
}

/** Ausfälle des Gegners (verletzt/gesperrt/abgestellt). */
export function absences(g: Game, oppId: string): { p: Player; why: string }[] {
  return squad(g, oppId).flatMap((p) => {
    if (p.availability === 'injured') return [{ p, why: p.injury ? `verletzt · ${p.injury.daysRemaining} Tage` : 'verletzt' }];
    if (p.suspensionMatches > 0) return [{ p, why: `gesperrt · ${p.suspensionMatches} ${p.suspensionMatches === 1 ? 'Spiel' : 'Spiele'}` }];
    if (p.availability === 'international') return [{ p, why: 'auf Länderspielreise' }];
    return [];
  }).sort((a, b) => b.p.overall - a.p.overall);
}

/** Torjäger und Vorlagengeber des Gegners in der Saison. */
export function topScorers(g: Game, oppId: string, n = 3): Player[] {
  return squad(g, oppId).filter((p) => p.seasonStats.goals > 0).sort((a, b) => b.seasonStats.goals - a.seasonStats.goals).slice(0, n);
}

/** Direkter Vergleich mit dem Gegner (alle gespeicherten Pflichtspiele). */
export function h2hSummary(g: Game, oppId: string): { w: number; d: number; l: number; gf: number; ga: number; last: ReturnType<typeof h2hOf> } {
  const all = h2hOf(g, oppId);
  let w = 0, d = 0, l = 0, gf = 0, ga = 0;
  for (const t of all) { const a = t[4], b = t[5]; gf += a; ga += b; if (a > b) w++; else if (a < b) l++; else d++; }
  return { w, d, l, gf, ga, last: [...all].sort((a, b) => b[1].localeCompare(a[1])).slice(0, 4) };
}

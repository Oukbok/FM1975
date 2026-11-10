// =============================================================================
// ERGEBNISSE JE SPIELTAG (Wunsch Pascal: Statistiken › Liga für jede Saison mit
// Gesamt/Heim/Auswärts/Form, Spieltage durchschalten, Box „Begegnungen“)
// -----------------------------------------------------------------------------
// Laufende Saison: direkt aus den Spielplänen (`g.fixtures` = Liga mit vollen Kadern,
// `otherDivisions[].fixtures`). Vergangene Saisons: beim Saisonwechsel als Tupel
// gespeichert (optionales `g.leagueResults`, höchstens MAX_SEASONS Saisons, alle
// Ligen des Heimatlandes inkl. DDR). Halbzeitstand nur, wo Spielereignisse vorliegen.
// Tabellen nach Spieltag N / Heim / Auswärts / Form werden daraus berechnet.
// =============================================================================
import type { Match } from '../types';
import { seasonStartYear } from '../data/timeline';
import type { Game } from './state';

/** [Spieltag, Datum, Heim, Gast, Tore Heim, Tore Gast, HZ Heim, HZ Gast] (HZ −1 = unbekannt) */
export type ResTuple = [number, string, string, string, number, number, number, number];
export interface LeagueResults { v: 1; seasons: Record<string, Record<string, ResTuple[]>> }

const MAX_SEASONS = 40;

function halftime(m: Match): [number, number] {
  let h = -1, a = -1;
  for (const e of m.events ?? []) {
    if (e.minute > 45 || !e.scoreAfter) continue;
    h = e.scoreAfter.home; a = e.scoreAfter.away;
  }
  if (h < 0 && (m.events?.length ?? 0) > 0) return [0, 0];
  return [h, a];
}

function pack(list: Match[]): ResTuple[] {
  const out: ResTuple[] = [];
  for (const m of list) {
    if (m.status !== 'finished' || !m.result) continue;
    const [hh, ha] = halftime(m);
    out.push([m.matchday, m.date, m.homeClubId, m.awayClubId, m.result.homeGoals, m.result.awayGoals, hh, ha]);
  }
  return out;
}

/** Alle Spiele (auch ungespielt) einer laufenden Liga – für die Spieltagsliste. */
export function liveFixtures(g: Game, divId: string): Match[] | null {
  if (g.leagues?.playerDivision?.id === divId) return g.fixtures;
  return g.leagues?.otherDivisions.find((d) => d.id === divId)?.fixtures ?? null;
}

/** Gespielte Spiele einer Liga in einer Saison; null = keine Einzelergebnisse vorhanden. */
export function resultsFor(g: Game, season: string, divId: string): ResTuple[] | null {
  if (season === g.season) {
    const f = liveFixtures(g, divId);
    return f ? pack(f) : null;
  }
  return (g as Game & { leagueResults?: LeagueResults }).leagueResults?.seasons[season]?.[divId] ?? null;
}

/** Saisonende: Ergebnisse aller Ligen festhalten (vor dem Neuaufbau der Spielpläne). */
export function storeSeasonResults(g: Game, season: string): void {
  const gg = g as Game & { leagueResults?: LeagueResults };
  const store = (gg.leagueResults ??= { v: 1, seasons: {} });
  const out: Record<string, ResTuple[]> = {};
  const pd = g.leagues?.playerDivision;
  if (pd) out[pd.id] = pack(g.fixtures);
  for (const d of g.leagues?.otherDivisions ?? []) if (d.tier < 200) out[d.id] = pack(d.fixtures);
  store.seasons[season] = out;
  const keys = Object.keys(store.seasons).sort((a, b) => seasonStartYear(a) - seasonStartYear(b));
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_SEASONS))) delete store.seasons[k];
}

export interface LiveRow { clubId: string; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number; form: ('W' | 'D' | 'L')[] }
export type TableMode = 'all' | 'home' | 'away' | 'form';

/** Tabelle bis einschließlich Spieltag `upTo` (Reihenfolge: Punkte, Tordifferenz, Tore). */
export function tableFrom(res: ResTuple[], clubIds: string[], upTo: number, mode: TableMode, ptsWin: number): LiveRow[] {
  const rows = new Map<string, LiveRow>(clubIds.map((id) => [id, { clubId: id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] }]));
  const games = res.filter((r) => r[0] <= upTo).sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1]));
  const add = (id: string, gf: number, ga: number) => {
    let r = rows.get(id);
    if (!r) { r = { clubId: id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] }; rows.set(id, r); }
    r.p++; r.gf += gf; r.ga += ga;
    const res2 = gf > ga ? 'W' : gf === ga ? 'D' : 'L';
    if (res2 === 'W') { r.w++; r.pts += ptsWin; } else if (res2 === 'D') { r.d++; r.pts += 1; } else r.l++;
    r.form.push(res2);
  };
  if (mode === 'form') {
    // Letzte fünf Spiele je Verein bis zum Spieltag.
    const per = new Map<string, [number, number][]>();
    for (const g0 of games) {
      (per.get(g0[2]) ?? per.set(g0[2], []).get(g0[2])!).push([g0[4], g0[5]]);
      (per.get(g0[3]) ?? per.set(g0[3], []).get(g0[3])!).push([g0[5], g0[4]]);
    }
    for (const [id, list] of per) for (const [gf, ga] of list.slice(-5)) add(id, gf, ga);
  } else {
    for (const g0 of games) {
      if (mode !== 'away') add(g0[2], g0[4], g0[5]);
      if (mode !== 'home') add(g0[3], g0[5], g0[4]);
    }
  }
  return [...rows.values()].sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.clubId.localeCompare(b.clubId));
}

/** Punkte für einen Sieg in einer Saison (Deutschland: 3 Punkte ab 1995/96). */
export function winPoints(g: Game, season: string): number {
  if (season === g.season) return g.pointSystem === '3-point' ? 3 : 2;
  return seasonStartYear(season) >= 1995 ? 3 : 2;
}

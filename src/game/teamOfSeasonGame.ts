// =============================================================================
// ELF DER SAISON — Spielablauf und Archiv (Wertung engine/teamOfSeason.ts)
// -----------------------------------------------------------------------------
// Eigene Liga mit echten Noten (Ligastatistik, game/seasonAwardsGame.ts
// `awardCandidates`), 1. Ligen im Ausland mit geschätzten Noten wie bei den Besten
// der Saison (game/worldAwardsGame.ts `leanCandidates`). Eigene Liga gespeichert kompakt in
// `game.extraAwards.xi`: Saison, Liga, Formation, Vereinsliste `c` und je Platz (Reihenfolge = Slots
// der Formation, daraus die Position) ein Tupel [Name, Note × 100, Index in `c`, Spieler-ID].
// Ausland: zusammen mit den Besten der Saison in `seasonAwards.wv` (game/worldAwardsGame.ts
// `worldSeasonAwards`, letzte WORLD_AWARD_SEASONS Saisons), gelesen über `worldTeamsOf`.
// =============================================================================
import { seasonStartYear } from '../data/timeline';
import { pickTeamOfSeason, tosFormationId } from '../engine/teamOfSeason';
import { ensureExtraAwards, extraAwardsState } from './extraAwardsGame';
import { awardCandidates } from './seasonAwardsGame';
import type { Game } from './state';
import { worldDivName, worldTeamsOf } from './worldAwardsGame';

/** Ein Platz der Elf: Name, Note × 100, Verein (Index in `TosSeason.c`), Spieler-ID (fehlt bei Weltspielern). */
export type TosRow = [string, number, number, string?];
/** Elf einer Saison; `dn`/`f` nur bei der eigenen Liga gespeichert (Ausland: aus Länderschlüssel und Saison, `worldTeamsOf`). */
export interface TosSeason { s: string; d: string; dn?: string; f?: string; c: string[]; x: TosRow[] }

export const MAX_XI_SEASONS = 80;

function pack(season: string, d: string, dn: string | undefined, res: ReturnType<typeof pickTeamOfSeason>, full: boolean): TosSeason | null {
  if (res.xi.length < 11) return null;
  const c: string[] = [];
  const x = res.xi.map((t) => {
    let i = c.indexOf(t.c.clubId);
    if (i < 0) i = c.push(t.c.clubId) - 1;
    const row: TosRow = [t.c.name, Math.round(t.c.avg * 100), i];
    if (full) row.push(t.c.pid);
    return row;
  });
  return { s: season, d, ...(full ? { dn, f: res.formation } : {}), c, x };
}

/** Elf der Saison der eigenen Liga (einmal je Saison). */
export function homeTeamOfSeason(g: Game): TosSeason | null {
  const st = ensureExtraAwards(g);
  if (st.xi.some((x) => x.s === g.season)) return null;
  const { cands, matchdays, teams } = awardCandidates(g);
  if (teams < 4) return null;
  const pd = g.leagues.playerDivision;
  const res = pack(g.season, pd.id, pd.name, pickTeamOfSeason(cands, { matchdays, teams }, seasonStartYear(g.season) + 1), true);
  if (!res) return null;
  st.xi.push(res);
  if (st.xi.length > MAX_XI_SEASONS) st.xi.splice(0, st.xi.length - MAX_XI_SEASONS);
  return res;
}

/** Alle Elf einer Saison (Anzeige, `dn`/`f` immer gesetzt): eigene Liga zuerst, dann das Ausland nach Name. */
export function teamsOfSeason(g: Game, season: string): (TosSeason & { dn: string; f: string })[] {
  const st = extraAwardsState(g);
  const f = tosFormationId(seasonStartYear(season) + 1);
  const own = (st?.xi ?? []).filter((x) => x.s === season).map((x) => ({ ...x, dn: x.dn ?? x.d, f: x.f ?? f }));
  const world = worldTeamsOf(g, season).map((x) => ({ ...x, dn: worldDivName(x.d), f }))
    .sort((a, b) => a.dn.localeCompare(b.dn, 'de'));
  return [...own, ...world];
}

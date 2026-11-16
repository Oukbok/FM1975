// =============================================================================
// Spielstart in einer unteren Liga (Wunsch Pascal): 3. Liga, Regionalligen, NOFV-Oberliga
// -----------------------------------------------------------------------------
// Die Ebenen ab Tier 3 entstehen beim Start aus dem Vereins-Pool (game/startYear.ts
// `fillLowerTiers`). Damit der Assistent sie vorher zeigen und man dort einen Verein wählen
// kann, rechnet `lowerTierPlan` dieselbe Besetzung auf einem schlanken Spielstand vor
// (Pool wie beim Start: seedStartPool → ensurePool/refillPool → padSecondTier → pickLowerTiers).
// Liegt der gewählte Verein in einer dieser Ligen, wird sie in newGame.ts zur Spielerliga:
// alle Vereine bekommen volle Kader (Niveau der Ebene, data/generate.ts `buildProClub` mit
// `tier`), 1. und 2. Liga laufen simuliert – wie nach einem Abstieg in die 3. Ebene.
// =============================================================================
import { buildProClub } from '../data/generate';
import { makePlaceholder } from '../data/reforms';
import { seasonLabelOf } from '../data/world/countries';
import { buildDivision, type DivisionMeta, type LeagueDivision, type LeagueGroup, type SimClub } from '../engine/leagues';
import type { Club, Player } from '../types';
import { ensurePool, refillPool } from './clubPool';
import { historicPointSystem } from './leagueSetup';
import { padSecondTier, pickLowerTiers, reformsAppliedAt, seedStartPool } from './startYear';
import type { Game } from './state';
import { composeHome, secondSimClubs } from './worldCompose';

export interface LowerDivPlan { meta: DivisionMeta; size: number; clubs: SimClub[] }

/** Besetzung der Ligen ab der 3. Ebene beim Spielstart (nur Deutschland mit Ligastruktur des Jahres). */
export function lowerTierPlan(home: string, year: number): LowerDivPlan[] {
  if (home !== 'ger') return [];
  const comp = composeHome(home, year);
  if (!comp) return [];
  const season = seasonLabelOf(year);
  const ligaStart = `${year}-08-15`;
  const pointSystem = historicPointSystem(season);
  const simClubs = secondSimClubs(comp);
  const clubs: Record<string, Club> = {};
  for (const s of comp.tier1) clubs[s.id] = { id: s.id, city: s.city } as Club;
  const otherDivisions: LeagueDivision[] = comp.second.map((sec) => buildDivision(
    { id: sec.group ? `tier2-${sec.group}` : 'tier2', name: sec.name, tier: 2, group: sec.group },
    Object.values(simClubs).filter((x) => x.group === sec.group).map((x) => x.id), pointSystem, season, ligaStart,
  ));
  const g = {
    clubs, simClubs, season, pointSystem, appliedReforms: reformsAppliedAt(year, home),
    leagues: { playerDivision: { id: 'tier1', name: '1. Liga', tier: 1, group: null }, otherDivisions, season },
  } as unknown as Game;
  seedStartPool(g, home, year);
  ensurePool(g);
  refillPool(g, season);
  padSecondTier(g, year, ligaStart);
  return pickLowerTiers(g.simClubs, season).map(({ t, ids }) => ({
    meta: { id: t.id, name: t.name, tier: t.tier, group: t.group as LeagueGroup },
    size: t.teamCount,
    clubs: ids.map((id) => ({ ...g.simClubs[id], tier: t.tier, group: t.group as LeagueGroup })),
  }));
}

/** Liga der unteren Ebenen, in der der Verein beim Start spielt (null = nicht dort). */
export function lowerStartDivision(home: string, year: number, clubId: string): LowerDivPlan | null {
  return lowerTierPlan(home, year).find((d) => d.clubs.some((c) => c.id === clubId)) ?? null;
}

/** Spielerliga einer unteren Ebene mit vollen Kadern anlegen (fehlende Plätze = fiktive Vereine). */
export function materializeLowerStart(
  plan: LowerDivPlan, managedClubId: string, date: string,
  clubs: Record<string, Club>, players: Record<string, Player>, youthPlayers: Record<string, Player>,
): void {
  const src = [...plan.clubs];
  while (src.length < plan.size) src.push(makePlaceholder(`start:${seasonLabelOf(Number(date.slice(0, 4)))}`, plan.meta.tier, plan.meta.group));
  for (const sc of src) clubs[sc.id] = buildProClub(sc, managedClubId, date, players, youthPlayers, plan.meta.tier);
}

// =============================================================================
// ZWEITE MANNSCHAFTEN: Kennungen und Zulassungsregel (ohne Abhängigkeiten zu
// anderen Spielmodulen, damit clubPool/startYear sie nutzen können).
// Zweite Mannschaften leben als schlanke Sim-Vereine `res-<Stammverein>` in
// `game.simClubs` (Ebene der Liga bzw. Pool = Amateurligen). Regeln: data/reserveRules.ts,
// Ablauf: game/reservePyramid.ts.
// =============================================================================
import { RESERVE_TOP_TIER, reserveEra } from '../data/reserveRules';
import { seasonStartYear } from '../data/timeline';
import type { Game } from './state';

export const RES_PREFIX = 'res-';
export const reserveIdOf = (parentId: string) => `${RES_PREFIX}${parentId}`;
export const isReserveId = (id: string) => id.startsWith(RES_PREFIX);
export const parentOfReserve = (id: string) => id.slice(RES_PREFIX.length);
export const ownReserveId = (g: Pick<Game, 'managedClubId'>) => reserveIdOf(g.managedClubId);

/** Ebene, in der ein Verein gerade spielt (volle Vereine = Spielerliga; unbekannt = 99). */
export function clubTierNow(g: Game, id: string): number {
  const s = g.simClubs?.[id];
  if (s) return s.tier;
  if (g.clubs[id]) return g.leagues?.playerDivision?.tier ?? 1;
  return 99;
}

/**
 * Darf eine zweite Mannschaft auf dieser (simulierten) Ebene spielen? Nie 2. Liga, nie gleich/über der ersten
 * Mannschaft. Zweite Mannschaften von Vereinen ab Ebene 3 höchstens Oberliga (DFB) – also nie in einer simulierten Staffel.
 */
export const reserveTierOk = (tier: number, parentTier: number) => tier >= RESERVE_TOP_TIER && tier < 100 && tier > parentTier && parentTier <= 2;

/** Höchstens so viele zweite Mannschaften je Staffel (Regel ab 2008: sieben je Regionalliga; 3. Liga vier). */
export function reserveCap(year: number, single: boolean): number {
  const e = reserveEra(year);
  return single ? e.capThirdLeague : e.capPerDivision;
}

/**
 * Darf der Pool-Tausch / eine Reform diesen Pool-Verein in eine Liga der Ebene `tier` holen?
 * Zweite Mannschaften nur nach der Regel oben, nicht über die Obergrenze je Staffel – und deine
 * eigene nie (sie steigt nur über ihre eigene Tabelle auf, game/reservePyramid.ts).
 */
export function poolPickAllowed(g: Game, id: string, tier: number, ids?: string[], single = false): boolean {
  if (!isReserveId(id)) return true;
  if (id === ownReserveId(g)) return false;
  if (!reserveTierOk(tier, clubTierNow(g, parentOfReserve(id)))) return false;
  if (ids) {
    const n = ids.filter(isReserveId).length;
    if (n >= reserveCap(seasonStartYear(g.season), single)) return false;
  }
  return true;
}

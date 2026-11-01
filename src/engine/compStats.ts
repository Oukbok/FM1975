// =============================================================================
// SPIELERSTATISTIK JE WETTBEWERB (laufende Saison)
// -----------------------------------------------------------------------------
// Die Match-Engine (engine/match/finish.ts) zählt zusätzlich zu Saison-/Karriere-
// Statistik je Wettbewerb: L = Liga, P = Landespokal, E = Europapokal (welcher, folgt
// beim Archivieren aus der Teilnahme des Vereins). Kompaktes Tupel am Spieler
// (optionales Feld `compStats`), wird am Saisonende in die Bestenlisten des
// Liga-Archivs übernommen und geleert (game/leagueArchive.ts).
// =============================================================================
import type { Player } from '../types';

/** [Einsätze, Tore, Vorlagen, Gelb, Gelb-Rot, Rot, Zu-null-Spiele als Torhüter] */
export type CompTuple = [number, number, number, number, number, number, number];
export type CompCode = 'L' | 'P' | 'E';

type WithComp = Player & { compStats?: Partial<Record<CompCode, CompTuple>> };

export function compCodeOf(competition: 'Liga' | 'Pokal' | 'Europapokal'): CompCode {
  return competition === 'Pokal' ? 'P' : competition === 'Europapokal' ? 'E' : 'L';
}

export function addCompStats(
  p: Player, code: CompCode,
  m: { goals: number; assists: number; yellow: number; yellowRed: number; red: number }, cleanKeeper: boolean,
): void {
  const pw = p as WithComp;
  const all = (pw.compStats ??= {});
  const t = (all[code] ??= [0, 0, 0, 0, 0, 0, 0]);
  t[0]++; t[1] += m.goals; t[2] += m.assists; t[3] += m.yellow; t[4] += m.yellowRed; t[5] += m.red;
  if (cleanKeeper) t[6]++;
}

export function compStatsOf(p: Player): Partial<Record<CompCode, CompTuple>> | undefined {
  return (p as WithComp).compStats;
}

export function clearCompStats(players: Record<string, Player>): void {
  for (const p of Object.values(players)) delete (p as WithComp).compStats;
}

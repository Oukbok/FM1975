// =============================================================================
// VERTRAGSVERHANDLUNG 2.0 — Lage aus dem Spielstand
// -----------------------------------------------------------------------------
// Stellenwert im Kader, erwartete Einsätze/Tore/Zu-null-Spiele, Titel-, Abstiegs-
// und Europapokal-Chance (aus Ansehen und Tabelle), echtes Interesse anderer
// Vereine (für den Berater-Bluff) und wie verlässlich dein Stab Gerüchte prüft.
// =============================================================================
import { GROUP_OF } from '../engine/aiManager';
import { isLeagueClub } from '../engine/clubEconomy';
import { Club, Player } from '../types';
import { clubWants, playsEurope, wishesFor } from './playerWishesGame';
import { staffEffectsOf } from './staffGame';
import { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export interface Expectation {
  expApps: number; expGoals: number; expCleanSheets: number;
  pTitle: number; pRelegation: number; pEuro: number;
}

/** Erwartungen je Saison für einen Spieler bei `club` (eigener Verein oder Käufer). */
export function calcAgeRank(g: Game, p: Player, club: Club): { depthRank: number; starter: boolean; keeperOrDef: boolean; attacker: boolean; expect: Expectation } {
  const squad = club.playerIds.map((id) => g.players[id]).filter((x) => x && x.id !== p.id);
  const grp = GROUP_OF[p.naturalPosition] ?? 'ZM';
  const depthRank = squad.filter((x) => GROUP_OF[x.naturalPosition] === grp && x.overall > p.overall).length;
  const better = squad.filter((x) => x.overall > p.overall).length;
  const starter = better < 11 && depthRank <= (grp === 'TW' ? 0 : grp === 'ZM' || grp === 'IV' ? 2 : 1);
  const keeperOrDef = grp === 'TW' || grp === 'IV' || grp === 'RV' || grp === 'LV';
  const attacker = grp === 'ST' || grp === 'RF' || grp === 'LF' || p.naturalPosition === 'OM';
  // Pflichtspiele je Saison: Liga + etwa drei Pokalspiele.
  const own = g.fixtures.filter((m) => m.homeClubId === club.id || m.awayClubId === club.id).length;
  const rows = g.table?.rows ?? [];
  const n = Math.max(rows.length, 10);
  const matches = (own || (n - 1) * 2) + 3;
  const share = starter ? 0.85 : better < 16 ? 0.45 : 0.15;
  const expApps = Math.round(matches * share);
  const goalRate = grp === 'ST' ? 0.38 : grp === 'RF' || grp === 'LF' || p.naturalPosition === 'OM' ? 0.2 : grp === 'ZM' ? 0.08 : grp === 'TW' ? 0 : 0.04;
  const expGoals = Math.round(expApps * goalRate * clamp(p.overall / 75, 0.6, 1.4) * 10) / 10;
  // Rang nach Ansehen in der eigenen Liga.
  const ids = rows.length ? rows.map((r) => r.clubId) : [club.id];
  const reps = ids.map((id) => g.clubs[id]?.reputation ?? 50).sort((a, b) => b - a);
  const repRank = reps.findIndex((r) => r <= club.reputation) + 1 || ids.length;
  const played = rows[0]?.played ?? 0;
  const pos = rows.findIndex((r) => r.clubId === club.id) + 1;
  const rank = played >= 10 && pos > 0 ? (repRank + pos) / 2 : repRank;
  const expCleanSheets = keeperOrDef ? Math.round(expApps * clamp(0.38 - rank / n * 0.22, 0.12, 0.38) * 10) / 10 : 0;
  const pTitle = (rank <= 1.5 ? 0.3 : rank <= 3 ? 0.15 : rank <= 6 ? 0.06 : 0.02) + 0.03;
  const pRelegation = rank > n - 3 ? 0.3 : rank > n - 6 ? 0.12 : 0.03;
  const tier = g.leagues?.playerDivision?.tier ?? 1;
  const pEuro = tier !== 1 ? 0.02 : playsEurope(g, club.id) ? 0.6 : rank <= 4 ? 0.35 : rank <= 7 ? 0.15 : 0.04;
  return { depthRank, starter, keeperOrDef, attacker, expect: { expApps, expGoals, expCleanSheets, pTitle, pRelegation, pEuro } };
}

/** Vereine, die ihn wirklich wollen und die ihn reizen würden (Namen, höchstens zwei). */
export function rivalInterest(g: Game, p: Player): string[] {
  const own = g.clubs[g.managedClubId];
  const out: [string, number][] = [];
  for (const c of Object.values(g.clubs)) {
    if (c.id === own.id || !isLeagueClub(c) || (c.reputation ?? 0) < (own.reputation ?? 0) - 3) continue;
    if (!clubWants(g, p, c)) continue;
    const w = wishesFor(g, p, c, { freeAgent: true });
    if (!w.appeal.dealBreaker && w.appeal.score >= 52) out.push([c.name, w.appeal.score]);
  }
  return out.sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => x[0]);
}

/** Wie oft dein Sportdirektor Gerüchte richtig einordnet (0,6–0,95, Scouting-Stab). */
export function staffAccuracy(g: Game): number {
  return clamp(0.6 + (staffEffectsOf(g).scouting ?? 0) * 2, 0.6, 0.95);
}

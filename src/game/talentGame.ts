// =============================================================================
// FRÜHSTARTER — profireife Talente mit 16–19 (organisch, ohne Sonderregeln)
// -----------------------------------------------------------------------------
// Zum 1. Juli prüft jeder Verein seine Jugend: Wer mit 16–19 schon auf dem
// Niveau der Profimannschaft spielt (Stärke ≥ Kaderniveau − 6, mindestens 60),
// wird hochgezogen – wie Messi mit 17 oder Kimmich, Musiala, Wirtz. Das betrifft
// nur sehr wenige Spieler: frühreife, große Talente (engine/talent.ts).
// Dein eigener Verein entscheidet selbst – du bekommst einen Hinweis.
// =============================================================================
import { makeMessage, pushMessage } from '../engine/messages';
import { promoteYouth } from '../engine/youth';
import type { Club, Player } from '../types';
import type { Game } from './state';

const MAX_SQUAD = 26;

/** Kaderniveau: Schnitt der besten 14 Profis. */
function squadLevel(g: Game, club: Club): number {
  const o = club.playerIds.map((id) => g.players[id]?.overall ?? 0).sort((a, b) => b - a).slice(0, 14);
  return o.length ? o.reduce((a, b) => a + b, 0) / o.length : 60;
}

/** Talente, die schon jetzt für die Profis reichen. */
export function readyTalents(g: Game, club: Club): Player[] {
  const bar = Math.max(60, squadLevel(g, club) - 6);
  return (club.youthPlayerIds ?? []).map((id) => g.youthPlayers[id])
    .filter((p): p is Player => !!p && p.age >= 16 && p.age <= 19 && p.overall >= bar)
    .sort((a, b) => b.overall - a.overall);
}

export function promoteEarlyTalents(g: Game, today: string): void {
  const auto = !!(g as unknown as { simAutoManage?: boolean }).simAutoManage;
  for (const club of Object.values(g.clubs)) {
    const ready = readyTalents(g, club);
    if (!ready.length) continue;
    if (club.id === g.managedClubId && !auto) {
      const p = ready[0];
      pushMessage(g.messages, makeMessage({
        date: today, category: 'training', from: 'Leiter Jugendakademie',
        subject: `${p.fullName} ist reif für die Profis`,
        shortText: `Mit ${p.age} spielt er schon auf dem Niveau der ersten Mannschaft.`,
        bodyText: `${p.fullName} (${p.naturalPosition}, ${p.age} Jahre, Stärke ${p.overall}) ist in der Jugend unterfordert. Mit Spielpraxis bei den Profis entwickelt er sich am schnellsten – zieh ihn unter Kader › Jugend hoch, bevor andere Vereine anklopfen.`,
      }));
      continue;
    }
    for (const p of ready.slice(0, 2)) promoteYouth(club, p.id, g.players, g.youthPlayers, MAX_SQUAD + 2);
  }
}

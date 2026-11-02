// =============================================================================
// Taktik-Labor: misst die echte Wirkung einer Taktik mit der Match-Engine.
// Dieselbe Mannschaft spielt mit deiner Taktik und mit einer neutralen Taktik
// je n Heim- und Auswärtsspiele gegen denselben Gegner (gleiche Zufallsfolgen,
// damit der Unterschied nicht im Rauschen untergeht). Genutzt von der Taktikseite
// (Kasten „Wirkung im Spiel“) und von `node scripts/matchbench.mjs` (MODE=tactics).
// =============================================================================
import type { Club, Player, Tactics } from '../../types';
import { MatchSim } from './sim';
import type { TeamState } from './state';

export interface LabStats {
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  shots: number;
  shotsAgainst: number;
  crosses: number;
  headers: number;
  counters: number;
  longShots: number;
  throughBalls: number;
  dribbles: number;
  setPieceGoals: number;
  possession: number;
  passAcc: number;
  duelsWon: number;
  fouls: number;
  cards: number;
  offsidesAgainst: number;
  energy: number;
  injuries: number;
}

const ZERO = (): LabStats => ({
  goalsFor: 0, goalsAgainst: 0, points: 0, shots: 0, shotsAgainst: 0, crosses: 0, headers: 0, counters: 0, longShots: 0,
  throughBalls: 0, dribbles: 0, setPieceGoals: 0, possession: 0, passAcc: 0, duelsWon: 0, fouls: 0, cards: 0, offsidesAgainst: 0,
  energy: 0, injuries: 0,
});

/** Neutrale Taktik (Regler 50, kurz, gemischt, keine Falle) mit derselben Aufstellung. */
export function neutralTactics(t: Tactics): Tactics {
  return {
    ...t, style: 'balanced', pressing: 50, tempo: 50, defensiveLine: 50, tackleHardness: 50, effort: 50,
    widthFocus: 50, buildup: 'short', offsideTrap: false, crossStyle: 'mixed',
  };
}

function collect(sim: MatchSim, me: TeamState, opp: TeamState, acc: LabStats): void {
  const s = me.stats;
  acc.goalsFor += me.goals; acc.goalsAgainst += opp.goals;
  acc.points += me.goals > opp.goals ? 3 : me.goals === opp.goals ? 1 : 0;
  acc.shots += s.shots; acc.shotsAgainst += opp.stats.shots;
  acc.crosses += s.crosses ?? 0; acc.counters += s.counters ?? 0; acc.dribbles += s.dribbles ?? 0;
  acc.possession += s.possession / Math.max(1, s.possession + opp.stats.possession);
  acc.passAcc += s.passesOk / Math.max(1, s.passes);
  acc.duelsWon += s.duelsWon / Math.max(1, s.duels);
  acc.fouls += s.fouls; acc.cards += s.yellow + s.red; acc.offsidesAgainst += opp.stats.offsides;
  let e = 0, n = 0;
  for (const m of me.players) if (m.onPitch) { e += m.energy; n++; }
  acc.energy += n ? e / n : 0;
  for (const id of sim.injuries.keys()) if (me.players.some((m) => m.id === id)) acc.injuries++;
  for (const ev of sim.events) {
    if (ev.kind !== 'chance' || ev.side !== me.side || !ev.chance) continue;
    const c = ev.chance;
    if (c.type === 'header') acc.headers++;
    if (c.type === 'long') acc.longShots++;
    if (ev.build === 'steilpass') acc.throughBalls++;
    if (c.outcome === 'goal' && !c.disallowed && (c.sp || c.type === 'penalty' || c.type === 'freekick')) acc.setPieceGoals++;
  }
}

/** Spielt n Heim- und n Auswärtsspiele des Vereins (mit `tactics`) gegen `opp` und liefert Mittelwerte je Spiel. */
export function labRun(club: Club, opp: Club, players: Record<string, Player>, tactics: Tactics, year: number, n: number, seed = 1): LabStats {
  const me: Club = { ...club, tactics };
  const acc = ZERO();
  for (let i = 0; i < n; i++) {
    for (const home of [true, false]) {
      const sim = new MatchSim(home ? me : opp, home ? opp : me, players, {
        year, seed: seed + i * 7919 + (home ? 0 : 3571), humanClubIds: [club.id],
      });
      sim.trace = true;
      sim.runToEnd();
      collect(sim, home ? sim.home : sim.away, home ? sim.away : sim.home, acc);
    }
  }
  const k = 1 / (2 * n);
  for (const key of Object.keys(acc) as (keyof LabStats)[]) acc[key] *= k;
  return acc;
}

/** Gegner für das Labor: der Verein selbst mit neutraler Taktik (Spiegel) – unabhängig vom Spielplan. */
export function mirrorOf(club: Club): Club {
  return { ...club, id: `${club.id}~lab`, city: `${club.city ?? ''}~lab`, isPlayerControlled: false, tactics: neutralTactics(club.tactics) };
}

/** Wirkung: deine Taktik gegen neutral, beide gegen denselben Gegner. */
export function measureTactics(club: Club, players: Record<string, Player>, tactics: Tactics, year: number, n = 60, opp?: Club): { mine: LabStats; neutral: LabStats } {
  const o = opp ?? mirrorOf(club);
  return {
    mine: labRun(club, o, players, tactics, year, n),
    neutral: labRun(club, o, players, neutralTactics(tactics), year, n),
  };
}

// =============================================================================
// Match-Engine – öffentliche Schnittstelle.
//   new MatchEngine(home, away, players, pointSystem, options)
//     .simulate()     → { result, events }              (Liga)
//     .simulateCup()  → { …, decision, penalties, homeWins } (K.-o.)
// Die eigentliche Simulation steckt in src/engine/match/ (MatchSim).
//
// Eigene Spiele werden vor dem Spieltag vorbereitet (Schnellsimulation oder
// Textmodus) und hier hinterlegt: Der reguläre Spieltagsablauf (Liga, Pokal,
// Europapokal) bekommt dann genau dieses Ergebnis zurück, ohne doppelt zu
// verbuchen.
// =============================================================================
import type { Club, MatchEvent, MatchResult, Player, PointSystem } from '../types';
import { getEraYear } from './positions';
import { MatchSim, type SimOptions } from './match/sim';
import { finishMatch, type FinishOptions } from './match/finish';
import { computeUnits, referenceWeights, makeMPlayer, resolveLineup } from './match/team';
import { eraRules } from './match/era';
import type { MatchOutcome } from './match/types';

export { createMatchInjury } from './match/finish';
export { MatchSim } from './match/sim';
export type { MatchOutcome } from './match/types';

export interface MatchEngineOptions {
  /** Optionaler Seed für reproduzierbare Simulationen. */
  seed?: number;
  /** Zuschauerzahl überschreiben (sonst aus Stadion/Reputation abgeleitet). */
  attendance?: number;
  /** Spieldatum (ISO). Nötig für Spielliste und echte Verletzungen. */
  date?: string;
  /** Wettbewerb für die Spielliste im Profil. */
  competition?: 'Liga' | 'Pokal' | 'Europapokal';
  /** Vereine, deren Spieler eine Spielliste bekommen (meist nur der eigene). */
  logClubIds?: string[];
  /** Im Spiel entstandene Verletzungen als echte Ausfälle übernehmen. */
  applyInjuries?: boolean;
}

// -----------------------------------------------------------------------------
// Vorbereitete (bereits gespielte) eigene Spiele
// -----------------------------------------------------------------------------

const prepared = new Map<string, MatchOutcome>();
const keyOf = (homeId: string, awayId: string, date?: string) => `${homeId}|${awayId}|${date ?? ''}`;

export function registerPreparedMatch(homeId: string, awayId: string, date: string, outcome: MatchOutcome): void {
  prepared.set(keyOf(homeId, awayId, date), outcome);
}
export function hasPreparedMatch(homeId: string, awayId: string, date: string): boolean {
  return prepared.has(keyOf(homeId, awayId, date));
}
export function clearPreparedMatches(): void { prepared.clear(); }

/** Jahr aus ISO-Datum (UTC) oder aktuelles Spieljahr. */
export function yearFor(date?: string): number {
  return date ? Number(date.slice(0, 4)) : getEraYear();
}

/** Erzeugt die Live-Simulation für ein Spiel (Textmodus und Schnellsimulation). */
export function createMatchSim(home: Club, away: Club, players: Record<string, Player>, opts: Partial<SimOptions> & { logClubIds?: string[] } = {}): MatchSim {
  return new MatchSim(home, away, players, {
    year: opts.year ?? yearFor(opts.date), date: opts.date, seed: opts.seed, knockout: opts.knockout,
    humanSides: opts.humanSides, humanClubIds: opts.humanClubIds ?? opts.logClubIds, live: opts.live,
  });
}

export class MatchEngine {
  constructor(
    private readonly homeClub: Club,
    private readonly awayClub: Club,
    private readonly players: Record<string, Player>,
    _pointSystem: PointSystem = '3-point',
    private readonly options: MatchEngineOptions = {},
  ) {}

  private take(): MatchOutcome | undefined {
    const k = keyOf(this.homeClub.id, this.awayClub.id, this.options.date);
    const o = prepared.get(k);
    if (o) prepared.delete(k);
    return o;
  }

  private run(knockout: boolean): MatchOutcome {
    const pre = this.take();
    if (pre) return pre;
    const sim = createMatchSim(this.homeClub, this.awayClub, this.players, {
      date: this.options.date, seed: this.options.seed, knockout, logClubIds: this.options.logClubIds,
    });
    sim.runToEnd();
    const fo: FinishOptions = { ...this.options };
    return finishMatch(sim, fo);
  }

  simulate(): { result: MatchResult; events: MatchEvent[] } {
    const o = this.run(false);
    return { result: o.result, events: o.events };
  }

  simulateCup(): {
    result: MatchResult;
    events: MatchEvent[];
    decision: 'regular' | 'aet' | 'penalties';
    penalties: { home: number; away: number } | null;
    homeWins: boolean;
  } {
    return this.run(true);
  }
}

// -----------------------------------------------------------------------------
// Mannschaftsstärke (für Vorschauen/Anzeigen)
// -----------------------------------------------------------------------------

/** Aufgeschlüsselte Team-Stärke (0–100-Skala). */
export interface TeamStrength {
  overall: number;
  attack: number;
  defense: number;
  midfield: number;
  goalkeeping: number;
}

/**
 * Stärke einer Mannschaft in ihrer aktuellen (bzw. automatisch besten)
 * Aufstellung: Positionsstärke × Tagesform, verdichtet zu Mannschaftsteilen.
 */
export function calculateTeamStrength(club: Club, players: Record<string, Player>, lineupOverride?: Player[]): TeamStrength {
  const era = eraRules(getEraYear());
  const assigned = club.tactics?.assignedPositions ?? {};
  const xi = lineupOverride
    ? lineupOverride.map((p) => ({ p, pos: assigned[p.id] ?? p.naturalPosition }))
    : resolveLineup(club, players, !!club.isPlayerControlled, era.benchSize).xi;
  if (xi.length === 0) return { overall: 40, attack: 40, defense: 40, midfield: 40, goalkeeping: 40 };
  const ms = xi.map(({ p, pos }) => makeMPlayer(p, 'home', pos, true, 0));
  for (const m of ms) m.energy = 100;
  const u = computeUnits(ms, referenceWeights(ms));
  const overall = (u.attack + u.control + u.defense + u.keeper) / 4;
  return { overall, attack: u.attack, defense: u.defense, midfield: u.control, goalkeeping: u.keeper };
}

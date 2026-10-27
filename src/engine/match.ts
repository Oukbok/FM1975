// =============================================================================
// FOOTBALL MANAGER 1980 — Match-Engine mit Text-Simulation
// 1. Liga Saison 1980/81
// =============================================================================
// Dieses Modul stellt die Spiel-Simulation bereit:
//   1. MatchEngine       — simuliert ein Spiel (komplett oder Minute-für-Minute)
//   2. simulate()        — 90 Minuten auf einmal, liefert MatchResult + Events
//   3. simulateLive()    — Async-Generator für den Live-Ticker (Minute für Minute)
//   4. updatePlayerStats — schreibt Tore/Assists/Karten/Minuten in die Spieler
//   5. Hilfsfunktionen   — Team-Stärke, Spielerauswahl, Retro-Kommentar u.a.
//
// Design-Ziele:
//   • Realistische, spannende Ergebnisse (Ø ~2–3 Tore pro Spiel)
//   • Authentisches 1980er-Flair im Kommentar (kein xG, kein VAR, wenig Karten)
//   • Framework-agnostisch: keine React-Abhängigkeit, rein datengetrieben
//   • Deterministisch bei gesetztem Seed (stabile Save/Load- & Test-Läufe)
// =============================================================================

import { logMatch, recordInjury } from './history';
import type {
  Club,
  Player,
  PointSystem,
  MatchEvent,
  MatchEventType,
  MatchResult,
  InjuryType,
  InjurySeverity,
  Injury,
} from '../types';
import { POSITION_GROUPS } from '../types';
import type { Position } from '../types';
import { positionSuitability } from './positions';

// -----------------------------------------------------------------------------
// KONSTANTEN — Wahrscheinlichkeiten & Balancing
// -----------------------------------------------------------------------------
// Alle Werte sind Pro-Minute-Wahrscheinlichkeiten PRO TEAM (sofern nicht anders
// vermerkt) und wurden so abgestimmt, dass über viele Spiele hinweg realistische
// Durchschnitte entstehen (siehe Kommentare).

/** Basis-Torwahrscheinlichkeit pro Minute/Team bei ausgeglichenen Kräften.
 *  0.0155 * 90 * 2 Teams ≈ 2.8 Tore/Spiel. */
const BASE_GOAL_PER_MIN = 0.0155;

/** Wahrscheinlichkeit für eine gefährliche Aktion ohne Tor (Chance/Parade). */
const CHANCE_PER_MIN = 0.11;

/** Foul-Wahrscheinlichkeit pro Minute/Team (~0.10*90 ≈ 9–10 Fouls/Team). */
const FOUL_PER_MIN = 0.105;

/** Anteil der Fouls, die eine Gelbe Karte nach sich ziehen (~1 Gelbe/Team/Spiel). */
const YELLOW_GIVEN_FOUL = 0.095;

/** Wahrscheinlichkeit einer glatten Roten Karte pro Foul (sehr selten, 1980er). */
const RED_GIVEN_FOUL = 0.0028;

/** Verletzungswahrscheinlichkeit pro Minute/Team (Basiswert, wird pro Spieler
 *  mit dessen injuryProneness skaliert). */
const INJURY_PER_MIN = 0.0014;

/** Eckball-Wahrscheinlichkeit pro Minute/Team. */
const CORNER_PER_MIN = 0.05;

/** Heimvorteil: +5 % auf die Stärke der Heimmannschaft. */
const HOME_ADVANTAGE = 1.05;

/** Wahrscheinlichkeit, dass ein Tor eine Vorlage (Assist) hatte. */
const ASSIST_PROBABILITY = 0.6;

/** Spieldauer in Minuten (ohne Nachspielzeit-Modellierung). */
const MATCH_MINUTES = 90;

// -----------------------------------------------------------------------------
// ZUFALLSZAHLEN — optional seedbar für reproduzierbare Läufe
// -----------------------------------------------------------------------------

/** Deterministischer PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// -----------------------------------------------------------------------------
// INTERNE TYPEN
// -----------------------------------------------------------------------------

/** Aufgeschlüsselte Team-Stärke (0–100-Skala). */
export interface TeamStrength {
  /** Gesamtstärke (gewichtetes Mittel). */
  overall: number;
  /** Offensivkraft (Sturm + offensives Mittelfeld). */
  attack: number;
  /** Defensivstärke (Abwehr + Torwart + defensives Mittelfeld). */
  defense: number;
  /** Mittelfeld-/Spielkontrolle. */
  midfield: number;
  /** Torwart-Stärke separat. */
  goalkeeping: number;
}

/** Laufender Zustand einer Mannschaft während der Simulation. */
interface TeamMatchState {
  club: Club;
  /** Aktuelle Startelf/Feldspieler (inkl. TW), reduziert bei Rot/Verletzung. */
  lineup: Player[];
  goalkeeper: Player | null;
  strength: TeamStrength;
  /** Effektive Stärke nach Heimvorteil & Taktik (wird bei Rot reduziert). */
  effectiveAttack: number;
  effectiveDefense: number;
  /** Taktik-Multiplikator auf die Chancenmenge (Tempo/Pressing/Aufbau). */
  chanceMod: number;
  /** Taktik-Multiplikator auf die Foulhäufigkeit (Zweikampfhärte/Pressing). */
  foulMod: number;
  isHome: boolean;

  // Live-Zähler
  goals: number;
  shots: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
  yellowCards: number;
  redCards: number;

  /** IDs bereits verwarnter Spieler (für Gelb-Rot-Logik). */
  bookedPlayerIds: Set<string>;
  /** IDs vom Platz gestellter / verletzt raus Spieler. */
  unavailableIds: Set<string>;
}

/** Pro-Spieler-Ereignisse eines Spiels (für updatePlayerStats). */
interface PlayerMatchTally {
  playerId: string;
  started: boolean;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellow: number;
  yellowRed: number;
  red: number;
  isGoalkeeper: boolean;
}

// -----------------------------------------------------------------------------
// HILFSFUNKTIONEN — Spielerstärke
// -----------------------------------------------------------------------------

/** Form-Faktor (0.85–1.15) aus der Tagesform des Spielers. */
function formFactor(player: Player): number {
  return 0.85 + (clamp(player.form, 0, 100) / 100) * 0.3;
}

/** Fitness-Faktor (0.7–1.0) aus der Ausdauer/Kondition des Spielers. */
function fitnessFactor(player: Player): number {
  return 0.7 + (clamp(player.attributes.fitness, 0, 100) / 100) * 0.3;
}

/**
 * Frische-Faktor (0.7–1.0) aus der aktuell verfügbaren Kraft. Volle Frische (100)
 * = voller Wert (1.0); sehr niedrige Frische senkt die physische Leistung spürbar,
 * aber nicht vernichtend (min. 0.7). Fehlt der Wert (Altstand), wird 100 angenommen.
 */
function frischeFactor(player: Player): number {
  const f = typeof player.frische === 'number' ? player.frische : 100;
  return 0.7 + (clamp(f, 0, 100) / 100) * 0.3;
}

/** Effektive Tagesstärke eines Spielers (Overall * Form * Fitness * Frische). */
function effectiveRating(player: Player): number {
  return player.overall * formFactor(player) * fitnessFactor(player) * frischeFactor(player);
}

/** Begrenzt einen Wert auf [min, max]. */
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// -----------------------------------------------------------------------------
// MATCH-ENGINE
// -----------------------------------------------------------------------------

export interface MatchEngineOptions {
  /** Optionaler Seed für reproduzierbare Simulationen. */
  seed?: number;
  /** Zuschauerzahl überschreiben (sonst aus Stadion/Reputation abgeleitet). */
  attendance?: number;
  /** Spieldatum (ISO). Nötig für Spielliste und echte Verletzungen. */
  date?: string;
  /** Wettbewerb für die Spielliste im Profil. */
  competition?: 'Liga' | 'Pokal' | 'Europapokal';
  /** Vereine, deren Spieler eine Spielliste bekommen (Speicher sparen: meist nur der eigene). */
  logClubIds?: string[];
  /** Im Spiel entstandene Verletzungen als echte Ausfälle übernehmen. */
  applyInjuries?: boolean;
}

/**
 * Die MatchEngine simuliert ein einzelnes Spiel zwischen zwei Vereinen.
 *
 * Da ein {@link Club} nur `playerIds` speichert, benötigt die Engine zusätzlich
 * ein Lookup aller Spieler (`players`), um Kader & Attribute aufzulösen.
 */
export class MatchEngine {
  private readonly homeClub: Club;
  private readonly awayClub: Club;
  private readonly players: Record<string, Player>;
  private readonly pointSystem: PointSystem;
  private readonly rng: () => number;
  private readonly attendanceOverride?: number;
  private readonly options: MatchEngineOptions;
  /** Im Spiel verletzte Spieler → Schwere (wird nach dem Spiel übernommen). */
  private readonly matchInjuries = new Map<string, InjurySeverity>();

  private eventCounter = 0;

  constructor(
    homeClub: Club,
    awayClub: Club,
    players: Record<string, Player>,
    pointSystem: PointSystem = '3-point',
    options: MatchEngineOptions = {},
  ) {
    this.homeClub = homeClub;
    this.awayClub = awayClub;
    this.players = players;
    this.pointSystem = pointSystem;
    this.attendanceOverride = options.attendance;
    this.options = options;
    // Seed: entweder explizit gesetzt oder aus IDs + Zufall abgeleitet.
    const seed =
      options.seed ??
      (hashString(homeClub.id + awayClub.id) ^ Math.floor(Math.random() * 0xffffffff));
    this.rng = mulberry32(seed >>> 0);
  }

  // ---------------------------------------------------------------------------
  // ÖFFENTLICHE API
  // ---------------------------------------------------------------------------

  /**
   * Simuliert das komplette Spiel (alle 90 Minuten auf einmal).
   * Liefert das {@link MatchResult} inklusive aller {@link MatchEvent}s.
   * Die Events werden über den zweiten Rückgabewert bereitgestellt.
   */
  simulate(): { result: MatchResult; events: MatchEvent[] } {
    const { home, away } = this.buildTeamStates();
    const events: MatchEvent[] = [];
    const tallies = this.initTallies(home, away);

    // Anpfiff
    events.push(
      this.makeEvent(0, 'kickoff', home.club.id, undefined, undefined, home, away,
        `Anpfiff im ${home.club.stadium.name}! ${home.club.name} gegen ${away.club.name}.`),
    );

    for (let minute = 1; minute <= MATCH_MINUTES; minute++) {
      const minuteEvents = this.simulateMinute(minute, home, away, tallies);
      events.push(...minuteEvents);

      if (minute === 45) {
        events.push(
          this.makeEvent(45, 'half_time', home.club.id, undefined, undefined, home, away,
            `Halbzeit. Es steht ${home.goals}:${away.goals}.`),
        );
      }
    }

    // Abpfiff
    events.push(
      this.makeEvent(90, 'full_time', home.club.id, undefined, undefined, home, away,
        `Abpfiff! Endstand: ${home.club.shortName} ${home.goals}:${away.goals} ${away.club.shortName}.`),
    );

    const result = this.buildResult(home, away, tallies);
    return { result, events };
  }

  /**
   * Simuliert eine K.-o.-Begegnung (Landespokal, Single-Leg):
   *   1. 90 Minuten reguläre Spielzeit
   *   2. bei Gleichstand: Verlängerung (Minuten 91–120)
   *   3. bei weiterhin Gleichstand: Elfmeterschießen
   * Liefert Result + Events sowie die Entscheidung und ggf. das Elfmeter-Ergebnis.
   */
  simulateCup(): {
    result: MatchResult;
    events: MatchEvent[];
    decision: 'regular' | 'aet' | 'penalties';
    penalties: { home: number; away: number } | null;
    homeWins: boolean;
  } {
    const { home, away } = this.buildTeamStates();
    const events: MatchEvent[] = [];
    const tallies = this.initTallies(home, away);

    events.push(
      this.makeEvent(0, 'kickoff', home.club.id, undefined, undefined, home, away,
        `Anpfiff im ${home.club.stadium.name}! Pokal: ${home.club.name} gegen ${away.club.name}.`),
    );

    for (let minute = 1; minute <= MATCH_MINUTES; minute++) {
      events.push(...this.simulateMinute(minute, home, away, tallies));
      if (minute === 45) {
        events.push(
          this.makeEvent(45, 'half_time', home.club.id, undefined, undefined, home, away,
            `Halbzeit. Es steht ${home.goals}:${away.goals}.`),
        );
      }
    }

    let decision: 'regular' | 'aet' | 'penalties' = 'regular';
    let penalties: { home: number; away: number } | null = null;

    if (home.goals === away.goals) {
      // --- Verlängerung ---
      decision = 'aet';
      events.push(
        this.makeEvent(90, 'full_time', home.club.id, undefined, undefined, home, away,
          `Ende der regulären Spielzeit — ${home.goals}:${away.goals}. Es geht in die Verlängerung!`),
      );
      events.push(
        this.makeEvent(90, 'extra_time_start', home.club.id, undefined, undefined, home, away,
          `Die Mannschaften wechseln die Seiten, 30 Minuten Verlängerung stehen an.`),
      );
      for (let minute = 91; minute <= 120; minute++) {
        events.push(...this.simulateMinute(minute, home, away, tallies));
        if (minute === 105) {
          events.push(
            this.makeEvent(105, 'extra_time_half', home.club.id, undefined, undefined, home, away,
              `Halbzeit in der Verlängerung. Zwischenstand ${home.goals}:${away.goals}.`),
          );
        }
      }
      events.push(
        this.makeEvent(120, 'extra_time_end', home.club.id, undefined, undefined, home, away,
          `Ende der Verlängerung — ${home.goals}:${away.goals}.`),
      );

      if (home.goals === away.goals) {
        // --- Elfmeterschießen ---
        decision = 'penalties';
        penalties = this.simulateShootout(home, away, events);
      } else {
        events.push(
          this.makeEvent(120, 'full_time', home.club.id, undefined, undefined, home, away,
            `Abpfiff nach Verlängerung! ${home.club.shortName} ${home.goals}:${away.goals} ${away.club.shortName}.`),
        );
      }
    } else {
      events.push(
        this.makeEvent(90, 'full_time', home.club.id, undefined, undefined, home, away,
          `Abpfiff! Endstand: ${home.club.shortName} ${home.goals}:${away.goals} ${away.club.shortName}.`),
      );
    }

    const result = this.buildResult(home, away, tallies);
    const homeWins =
      decision === 'penalties'
        ? (penalties as { home: number; away: number }).home >
          (penalties as { home: number; away: number }).away
        : home.goals > away.goals;
    return { result, events, decision, penalties, homeWins };
  }

  /**
   * Simuliert das Elfmeterschießen: Best-of-5 mit anschließendem "Sudden Death".
   * Schreibt Kommentar-Events in `events` und liefert den Endstand.
   */
  private simulateShootout(
    home: TeamMatchState,
    away: TeamMatchState,
    events: MatchEvent[],
  ): { home: number; away: number } {
    const takers = (team: TeamMatchState): Player[] =>
      [...team.lineup].sort(
        (a, b) => (b.attributes.penalties ?? 50) - (a.attributes.penalties ?? 50),
      );
    const homeTakers = takers(home);
    const awayTakers = takers(away);

    events.push(
      this.makeEvent(120, 'shootout_start', home.club.id, undefined, undefined, home, away,
        `Es kommt zum Elfmeterschießen! Die Entscheidung fällt vom Punkt.`),
    );

    let hs = 0;
    let as = 0;
    let hi = 0;
    let ai = 0;

    const kick = (
      shooters: Player[],
      idx: number,
      gk: Player | null,
      team: TeamMatchState,
    ): boolean => {
      const taker = shooters[idx % shooters.length];
      const penSkill = taker.attributes.penalties ?? 50;
      const gkReflexes = gk?.attributes.reflexes ?? 50;
      const scoreProb = clamp(
        0.58 + (penSkill - 55) / 160 - (gkReflexes - 50) / 300,
        0.45,
        0.92,
      );
      const scored = this.rng() < scoreProb;
      if (scored) {
        events.push(
          this.makeEvent(120, 'shootout_goal', team.club.id, taker.id, undefined, home, away,
            `${taker.lastName} tritt an — und verwandelt sicher! (${hs + (team === home ? 1 : 0)}:${as + (team === away ? 1 : 0)})`),
        );
      } else {
        events.push(
          this.makeEvent(120, 'shootout_miss', team.club.id, taker.id, undefined, home, away,
            `${taker.lastName} scheitert — kein Tor!`),
        );
      }
      return scored;
    };

    // Best-of-5
    for (let round = 0; round < 5; round++) {
      if (kick(homeTakers, hi++, away.goalkeeper, home)) hs++;
      // Vorzeitige Entscheidung prüfen
      if (this.shootoutDecided(hs, as, round, 5, true)) break;
      if (kick(awayTakers, ai++, home.goalkeeper, away)) as++;
      if (this.shootoutDecided(hs, as, round, 5, false)) break;
    }

    // Sudden Death
    while (hs === as) {
      const h = kick(homeTakers, hi++, away.goalkeeper, home);
      if (h) hs++;
      const a = kick(awayTakers, ai++, home.goalkeeper, away);
      if (a) as++;
    }

    const winner = hs > as ? home : away;
    events.push(
      this.makeEvent(120, 'shootout_end', winner.club.id, undefined, undefined, home, away,
        `Elfmeterschießen entschieden: ${home.club.shortName} ${hs}:${as} ${away.club.shortName} n.E. — ${winner.club.name} steht in der nächsten Runde!`),
    );
    return { home: hs, away: as };
  }

  /** Prüft, ob das Best-of-5-Schießen vorzeitig entschieden ist. */
  private shootoutDecided(
    hs: number,
    as: number,
    round: number,
    total: number,
    afterHome: boolean,
  ): boolean {
    const homeShotsTaken = round + 1;
    const awayShotsTaken = afterHome ? round : round + 1;
    const homeRemaining = total - homeShotsTaken;
    const awayRemaining = total - awayShotsTaken;
    if (hs - as > awayRemaining) return true;
    if (as - hs > homeRemaining) return true;
    return false;
  }

  /**
   * Async-Generator für den Live-Ticker: liefert Minute für Minute die
   * angefallenen Events (oder gar keins) und gibt am Ende das MatchResult
   * als Return-Wert des Generators zurück.
   *
   * Verwendung (später in der UI):
   *   const gen = engine.simulateLive();
   *   for await (const ev of gen) { render(ev); }
   */
  async *simulateLive(): AsyncGenerator<MatchEvent, MatchResult, void> {
    const { home, away } = this.buildTeamStates();
    const tallies = this.initTallies(home, away);

    yield this.makeEvent(0, 'kickoff', home.club.id, undefined, undefined, home, away,
      `Anpfiff im ${home.club.stadium.name}! ${home.club.name} gegen ${away.club.name}.`);

    for (let minute = 1; minute <= MATCH_MINUTES; minute++) {
      const minuteEvents = this.simulateMinute(minute, home, away, tallies);
      for (const ev of minuteEvents) {
        yield ev;
      }
      if (minute === 45) {
        yield this.makeEvent(45, 'half_time', home.club.id, undefined, undefined, home, away,
          `Halbzeit. Es steht ${home.goals}:${away.goals}.`);
      }
    }

    yield this.makeEvent(90, 'full_time', home.club.id, undefined, undefined, home, away,
      `Abpfiff! Endstand: ${home.club.shortName} ${home.goals}:${away.goals} ${away.club.shortName}.`);

    return this.buildResult(home, away, tallies);
  }

  /**
   * Aktualisiert die Spieler-Statistiken (Saison & Karriere) nach einem Spiel.
   * Muss mit demselben Ergebnis/Tally-Kontext aufgerufen werden — daher stellt
   * simulate() die nötigen Daten intern zusammen. Diese öffentliche Variante
   * erlaubt das Nachziehen der Stats aus einem bereits vorhandenen Ergebnis.
   */
  updatePlayerStats(result: MatchResult, events: MatchEvent[]): void {
    // Rekonstruiere die Tallies aus den Events, damit die Methode auch
    // eigenständig (z.B. nach dem Laden) verwendbar ist.
    const tallies = this.rebuildTalliesFromEvents(events);
    const homeCleanSheet = result.awayGoals === 0;
    const awayCleanSheet = result.homeGoals === 0;

    for (const tally of tallies.values()) {
      const player = this.players[tally.playerId];
      if (!player) continue;
      const isHomePlayer = this.homeClub.playerIds.includes(player.id);
      const cleanSheet = isHomePlayer ? homeCleanSheet : awayCleanSheet;
      this.applyTally(player, tally, cleanSheet);
    }
  }

  // ---------------------------------------------------------------------------
  // TEAM-AUFBAU & STÄRKE
  // ---------------------------------------------------------------------------

  private buildTeamStates(): { home: TeamMatchState; away: TeamMatchState } {
    const homeLineup = this.resolveLineup(this.homeClub);
    const awayLineup = this.resolveLineup(this.awayClub);

    const homeStrength = calculateTeamStrength(this.homeClub, this.players, homeLineup);
    const awayStrength = calculateTeamStrength(this.awayClub, this.players, awayLineup);

    const home = this.makeTeamState(this.homeClub, homeLineup, homeStrength, true);
    const away = this.makeTeamState(this.awayClub, awayLineup, awayStrength, false);
    return { home, away };
  }

  private makeTeamState(
    club: Club,
    lineup: Player[],
    strength: TeamStrength,
    isHome: boolean,
  ): TeamMatchState {
    const gk = lineup.find((p) => POSITION_GROUPS[p.naturalPosition] === 'GK') ?? null;

    // Taktik-Modifikatoren
    const style = club.tactics?.style ?? 'balanced';
    let attackMod = 1;
    let defenseMod = 1;
    switch (style) {
      case 'attacking':
        attackMod = 1.12;
        defenseMod = 0.9;
        break;
      case 'defensive':
        attackMod = 0.88;
        defenseMod = 1.12;
        break;
      case 'counter':
        attackMod = 1.04;
        defenseMod = 1.04;
        break;
      case 'balanced':
      default:
        attackMod = 1;
        defenseMod = 1;
        break;
    }

    const homeMod = isHome ? HOME_ADVANTAGE : 1;

    // --- Erweiterte Taktik-Dimensionen (optional; wirken zusätzlich) ---
    const t = club.tactics;
    const norm = (v: number | undefined, def = 50) => ((v ?? def) - 50) / 50; // -1..+1
    const tempo = norm(t?.tempo);
    const pressing = norm(t?.pressing);
    const defLine = norm(t?.defensiveLine);
    const hardness = norm(t?.tackleHardness);
    // Hohes Tempo & hohe Linie → mehr Offensive, etwas anfälliger hinten.
    attackMod *= 1 + tempo * 0.08 + defLine * 0.05;
    defenseMod *= 1 - defLine * 0.05 + pressing * 0.04;
    if (t?.offsideTrap) defenseMod *= 1.03; // riskante Absicherung, leicht +Def
    if (t?.buildup === 'short') attackMod *= 1.02;

    // Chancenmenge: Tempo & Pressing erzeugen mehr Aktionen.
    const chanceMod = clamp(1 + tempo * 0.18 + pressing * 0.1, 0.7, 1.4);
    // Fouls: Zweikampfhärte & Pressing erhöhen die Foulrate.
    const foulMod = clamp(1 + hardness * 0.4 + pressing * 0.15, 0.6, 1.8);

    return {
      club,
      lineup,
      goalkeeper: gk,
      strength,
      effectiveAttack: strength.attack * attackMod * homeMod,
      effectiveDefense: strength.defense * defenseMod * homeMod,
      chanceMod,
      foulMod,
      isHome,
      goals: 0,
      shots: 0,
      shotsOnTarget: 0,
      corners: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      bookedPlayerIds: new Set(),
      unavailableIds: new Set(),
    };
  }

  /**
   * Löst die einsatzfähige Startelf eines Vereins auf:
   *   1. bevorzugt die in der Taktik gesetzte startingXI (nur verfügbare Spieler)
   *   2. füllt bei Bedarf mit den besten verfügbaren Kaderspielern auf
   */
  private resolveLineup(club: Club): Player[] {
    const lineup: Player[] = [];
    const used = new Set<string>();

    const isAvailable = (p: Player | undefined): p is Player =>
      !!p && p.availability === 'available' && !p.injury;

    // 1. Vorgegebene Startelf
    for (const id of club.tactics?.startingXI ?? []) {
      const p = this.players[id];
      if (isAvailable(p) && !used.has(id)) {
        lineup.push(p);
        used.add(id);
      }
      if (lineup.length >= 11) break;
    }

    // 2. Auffüllen mit besten verfügbaren Kaderspielern
    if (lineup.length < 11) {
      const rest = club.playerIds
        .map((id) => this.players[id])
        .filter((p) => isAvailable(p) && !used.has(p.id))
        .sort((a, b) => b.overall - a.overall);

      // Sicherstellen, dass ein TW dabei ist
      const hasGk = lineup.some((p) => POSITION_GROUPS[p.naturalPosition] === 'GK');
      if (!hasGk) {
        const gk = rest.find((p) => POSITION_GROUPS[p.naturalPosition] === 'GK');
        if (gk) {
          lineup.push(gk);
          used.add(gk.id);
        }
      }

      for (const p of rest) {
        if (lineup.length >= 11) break;
        if (used.has(p.id)) continue;
        lineup.push(p);
        used.add(p.id);
      }
    }

    return lineup;
  }

  // ---------------------------------------------------------------------------
  // MINUTEN-SIMULATION
  // ---------------------------------------------------------------------------

  /**
   * Simuliert eine einzelne Minute für beide Teams und liefert die
   * entstandenen Events. Mutiert die TeamMatchStates und Tallies.
   */
  private simulateMinute(
    minute: number,
    home: TeamMatchState,
    away: TeamMatchState,
    tallies: Map<string, PlayerMatchTally>,
  ): MatchEvent[] {
    const events: MatchEvent[] = [];

    // Reihenfolge leicht zufällig, damit nicht immer Heim zuerst "handelt".
    const order: [TeamMatchState, TeamMatchState][] =
      this.rng() < 0.5 ? [[home, away], [away, home]] : [[away, home], [home, away]];

    for (const [team, opponent] of order) {
      // --- Torchance / Tor ---
      const goalProb = this.goalProbability(team, opponent);
      if (this.rng() < goalProb) {
        events.push(this.handleGoal(minute, team, opponent, home, away, tallies));
        continue; // pro Team max. 1 Großereignis pro Minute
      }

      // --- Gefährliche Aktion ohne Tor ---
      if (this.rng() < CHANCE_PER_MIN * team.chanceMod) {
        events.push(this.handleChance(minute, team, opponent, home, away));
      }

      // --- Eckball ---
      if (this.rng() < CORNER_PER_MIN) {
        team.corners++;
        // Ecken werden nur gezählt, nicht immer als Event ausgegeben (Rauschen).
        if (this.rng() < 0.3) {
          const taker = this.selectAttacker(team);
          events.push(
            this.makeEvent(minute, 'corner', team.club.id, taker?.id, undefined, home, away,
              generateCommentary('corner', taker ? taker.lastName : team.club.shortName, minute, this.rng)),
          );
        }
      }

      // --- Foul ---
      if (this.rng() < FOUL_PER_MIN * team.foulMod) {
        events.push(...this.handleFoul(minute, team, home, away, tallies));
      }

      // --- Verletzung ---
      const injuryEvent = this.maybeInjury(minute, team, home, away, tallies);
      if (injuryEvent) events.push(injuryEvent);
    }

    return events;
  }

  /** Pro-Minute-Torwahrscheinlichkeit eines Teams gegen den Gegner. */
  private goalProbability(team: TeamMatchState, opponent: TeamMatchState): number {
    const ratio = clamp(team.effectiveAttack / Math.max(opponent.effectiveDefense, 1), 0.5, 2);
    // Numerischer Unterzahl-Malus (Rote Karten reduzieren Feldspieler)
    const menOnPitch = team.lineup.length - team.unavailableIds.size;
    const undermanned = menOnPitch < 11 ? 0.85 : 1;
    return BASE_GOAL_PER_MIN * ratio * undermanned;
  }

  // ---------------------------------------------------------------------------
  // EREIGNIS-HANDLER
  // ---------------------------------------------------------------------------

  private handleGoal(
    minute: number,
    team: TeamMatchState,
    opponent: TeamMatchState,
    home: TeamMatchState,
    away: TeamMatchState,
    tallies: Map<string, PlayerMatchTally>,
  ): MatchEvent {
    const scorer = this.selectAttacker(team) ?? team.lineup[0];
    const defender = this.selectDefender(opponent);

    team.goals++;
    team.shots++;
    team.shotsOnTarget++;

    // Tally: Tor
    const scorerTally = tallies.get(scorer.id);
    if (scorerTally) scorerTally.goals++;

    // Assist?
    let assistPlayer: Player | undefined;
    if (this.rng() < ASSIST_PROBABILITY) {
      assistPlayer = this.selectAssistProvider(team, scorer);
      if (assistPlayer) {
        const at = tallies.get(assistPlayer.id);
        if (at) at.assists++;
      }
    }

    const commentary = generateGoalCommentary(scorer, assistPlayer, minute, this.rng);
    void defender; // Verteidiger fließt in shouldScoreGoal / Balancing ein

    return this.makeEvent(
      minute,
      'goal',
      team.club.id,
      scorer.id,
      assistPlayer?.id,
      home,
      away,
      commentary,
    );
  }

  private handleChance(
    minute: number,
    team: TeamMatchState,
    opponent: TeamMatchState,
    home: TeamMatchState,
    away: TeamMatchState,
  ): MatchEvent {
    const attacker = this.selectAttacker(team) ?? team.lineup[0];
    team.shots++;

    // Wird es eine Parade (Schuss aufs Tor) oder ein Fehlschuss?
    const gk = opponent.goalkeeper;
    const onTarget = this.rng() < 0.5;
    if (onTarget) team.shotsOnTarget++;

    let type: MatchEventType;
    let commentary: string;
    if (onTarget && gk) {
      type = 'save';
      commentary = generateCommentary('save', gk.lastName, minute, this.rng, attacker.lastName);
    } else {
      type = 'chance';
      commentary = generateCommentary('chance', attacker.lastName, minute, this.rng, team.club.shortName);
    }

    return this.makeEvent(minute, type, team.club.id, attacker.id, undefined, home, away, commentary);
  }

  private handleFoul(
    minute: number,
    team: TeamMatchState,
    home: TeamMatchState,
    away: TeamMatchState,
    tallies: Map<string, PlayerMatchTally>,
  ): MatchEvent[] {
    const events: MatchEvent[] = [];
    team.fouls++;
    const fouler = this.selectFouler(team);
    if (!fouler) return events;

    const roll = this.rng();

    // Glatte Rote Karte (sehr selten)
    if (roll < RED_GIVEN_FOUL) {
      team.redCards++;
      team.unavailableIds.add(fouler.id);
      this.reduceStrengthOnDismissal(team);
      const t = tallies.get(fouler.id);
      if (t) t.red++;
      events.push(
        this.makeEvent(minute, 'red_card', team.club.id, fouler.id, undefined, home, away,
          generateCommentary('red_card', fouler.lastName, minute, this.rng)),
      );
      return events;
    }

    // Gelbe Karte
    if (roll < YELLOW_GIVEN_FOUL + RED_GIVEN_FOUL) {
      if (team.bookedPlayerIds.has(fouler.id)) {
        // Zweite Gelbe → Gelb-Rot
        team.redCards++;
        team.unavailableIds.add(fouler.id);
        this.reduceStrengthOnDismissal(team);
        const t = tallies.get(fouler.id);
        if (t) t.yellowRed++;
        events.push(
          this.makeEvent(minute, 'yellow_red_card', team.club.id, fouler.id, undefined, home, away,
            `${minute}. Min: Gelb-Rot! ${fouler.lastName} muss nach der zweiten Verwarnung vom Platz.`),
        );
      } else {
        team.yellowCards++;
        team.bookedPlayerIds.add(fouler.id);
        const t = tallies.get(fouler.id);
        if (t) t.yellow++;
        events.push(
          this.makeEvent(minute, 'yellow_card', team.club.id, fouler.id, undefined, home, away,
            generateCommentary('yellow_card', fouler.lastName, minute, this.rng)),
        );
      }
      return events;
    }

    // Nur ein Foul ohne Karte — meist ohne eigenes Event, gelegentlich Kommentar
    if (this.rng() < 0.25) {
      events.push(
        this.makeEvent(minute, 'foul', team.club.id, fouler.id, undefined, home, away,
          generateCommentary('foul', fouler.lastName, minute, this.rng)),
      );
    }
    return events;
  }

  private maybeInjury(
    minute: number,
    team: TeamMatchState,
    home: TeamMatchState,
    away: TeamMatchState,
    tallies: Map<string, PlayerMatchTally>,
  ): MatchEvent | null {
    // Kandidat wählen, dann dessen Anfälligkeit einrechnen
    const candidate = this.selectRandomFieldPlayer(team);
    if (!candidate) return null;
    const proneness = clamp(candidate.development?.injuryProneness ?? 40, 0, 100);
    const prob = INJURY_PER_MIN * (0.5 + proneness / 100);
    if (this.rng() >= prob) return null;

    team.unavailableIds.add(candidate.id);
    // Verletzungstyp/-schwere bestimmen (nur für Kommentar; echte Injury-Objekte
    // erzeugt später das Verletzungs-/Kalender-System in der Nachbearbeitung).
    const severity = this.rollInjurySeverity();
    this.matchInjuries.set(candidate.id, severity);
    const commentary = generateInjuryCommentary(candidate, severity, minute, this.rng);

    // Minuten kappen für den verletzt raus gegangenen Spieler
    const t = tallies.get(candidate.id);
    if (t) t.minutesPlayed = Math.min(t.minutesPlayed, minute);

    void team; // Stärke-Reduktion durch Verletzung ist bewusst mild (Wechsel möglich)

    return this.makeEvent(minute, 'injury', team.club.id, candidate.id, undefined, home, away, commentary);
  }

  private rollInjurySeverity(): InjurySeverity {
    const r = this.rng();
    if (r < 0.6) return 'minor';
    if (r < 0.9) return 'moderate';
    return 'severe';
  }

  private reduceStrengthOnDismissal(team: TeamMatchState): void {
    // Unterzahl schwächt Offensive & Defensive spürbar.
    team.effectiveAttack *= 0.9;
    team.effectiveDefense *= 0.88;
  }

  // ---------------------------------------------------------------------------
  // SPIELERAUSWAHL
  // ---------------------------------------------------------------------------

  /** Wählt gewichtet einen Offensivspieler (Sturm/OM bevorzugt). */
  private selectAttacker(team: TeamMatchState): Player | undefined {
    return this.weightedPick(team, (p) => {
      const group = POSITION_GROUPS[p.naturalPosition];
      const base =
        group === 'ATT' ? 3.0 : group === 'MID' ? 1.3 : group === 'DEF' ? 0.25 : 0;
      // Abschlussstärke fließt ein
      const shootingBonus = 0.5 + p.attributes.shooting / 100;
      return base * shootingBonus;
    });
  }

  /** Wählt gewichtet einen Verteidiger (Abwehr/DM bevorzugt). */
  private selectDefender(team: TeamMatchState): Player | undefined {
    return this.weightedPick(team, (p) => {
      const group = POSITION_GROUPS[p.naturalPosition];
      return group === 'DEF' ? 3.0 : group === 'MID' ? 1.0 : group === 'GK' ? 0.5 : 0.2;
    });
  }

  /** Wählt gewichtet einen Vorlagengeber (nicht den Torschützen selbst). */
  private selectAssistProvider(team: TeamMatchState, scorer: Player): Player | undefined {
    return this.weightedPick(team, (p) => {
      if (p.id === scorer.id) return 0;
      const group = POSITION_GROUPS[p.naturalPosition];
      const base = group === 'MID' ? 2.5 : group === 'ATT' ? 1.8 : group === 'DEF' ? 0.6 : 0;
      const passBonus = 0.5 + (p.attributes.passing + p.attributes.crossing) / 200;
      return base * passBonus;
    });
  }

  /** Wählt gewichtet einen Foulspieler (aggressive/defensive Spieler eher). */
  private selectFouler(team: TeamMatchState): Player | undefined {
    return this.weightedPick(team, (p) => {
      const group = POSITION_GROUPS[p.naturalPosition];
      const base = group === 'DEF' ? 2.0 : group === 'MID' ? 1.5 : group === 'ATT' ? 0.8 : 0.2;
      const aggro = 0.5 + (p.attributes.aggression ?? 50) / 100;
      return base * aggro;
    });
  }

  /** Rein zufälliger Feldspieler (für Verletzungen). */
  private selectRandomFieldPlayer(team: TeamMatchState): Player | undefined {
    const available = team.lineup.filter((p) => !team.unavailableIds.has(p.id));
    if (available.length === 0) return undefined;
    return available[Math.floor(this.rng() * available.length)];
  }

  /** Gewichtete Zufallsauswahl über die verfügbaren Feldspieler. */
  private weightedPick(
    team: TeamMatchState,
    weightFn: (p: Player) => number,
  ): Player | undefined {
    const available = team.lineup.filter((p) => !team.unavailableIds.has(p.id));
    if (available.length === 0) return undefined;
    const weights = available.map((p) => Math.max(0, weightFn(p)));
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) return available[Math.floor(this.rng() * available.length)];
    let r = this.rng() * total;
    for (let i = 0; i < available.length; i++) {
      r -= weights[i];
      if (r <= 0) return available[i];
    }
    return available[available.length - 1];
  }

  // ---------------------------------------------------------------------------
  // ERGEBNIS & STATISTIK
  // ---------------------------------------------------------------------------

  private buildResult(
    home: TeamMatchState,
    away: TeamMatchState,
    tallies: Map<string, PlayerMatchTally>,
  ): MatchResult {
    // Ballbesitz aus Mittelfeldstärke ableiten
    const midSum = home.strength.midfield + away.strength.midfield;
    const homePossession =
      midSum > 0 ? Math.round((home.strength.midfield / midSum) * 100) : 50;

    const attendance = this.attendanceOverride ?? this.estimateAttendance(home);
    const manOfTheMatchId = this.pickManOfTheMatch(home, away, tallies);

    // Spieler-Stats direkt fortschreiben (simulate() nutzt denselben Kontext)
    this.commitTallies(home, away, tallies);

    return {
      homeGoals: home.goals,
      awayGoals: away.goals,
      homePossession: clamp(homePossession, 25, 75),
      homeShots: home.shots,
      awayShots: away.shots,
      homeShotsOnTarget: home.shotsOnTarget,
      awayShotsOnTarget: away.shotsOnTarget,
      homeCorners: home.corners,
      awayCorners: away.corners,
      homeFouls: home.fouls,
      awayFouls: away.fouls,
      homeYellowCards: home.yellowCards,
      awayYellowCards: away.yellowCards,
      homeRedCards: home.redCards,
      awayRedCards: away.redCards,
      attendance,
      manOfTheMatchId,
    };
  }

  private estimateAttendance(home: TeamMatchState): number {
    const cap = home.club.stadium?.capacity ?? 30000;
    const baseRate = home.club.stadium?.averageAttendanceRate ?? 0.7;
    // Ticket-Preis-Elastizitaet: hoeherer Preis -> weniger Zuschauer, niedriger -> mehr.
    const reputation = home.club.reputation ?? 50;
    const ticketPrice = home.club.stadium?.ticketPrice ?? 14;
    const refPrice = Math.round(8 + reputation * 0.12);
    const priceFactor = clamp(1 - ((ticketPrice - refPrice) / refPrice) * 0.5, 0.6, 1.15);
    const rate = clamp(baseRate * priceFactor + (this.rng() - 0.5) * 0.1, 0.3, 1.0);
    return Math.round(cap * rate);
  }

  private pickManOfTheMatch(
    home: TeamMatchState,
    away: TeamMatchState,
    tallies: Map<string, PlayerMatchTally>,
  ): string | undefined {
    let bestId: string | undefined;
    let bestScore = -Infinity;
    for (const t of tallies.values()) {
      const score = t.goals * 3 + t.assists * 2 - t.yellow * 0.5 - t.red * 3;
      if (score > bestScore && score > 0) {
        bestScore = score;
        bestId = t.playerId;
      }
    }
    // Fallback: bester Spieler des Siegers/beste Elf
    if (!bestId) {
      const winner = home.goals >= away.goals ? home : away;
      bestId = [...winner.lineup].sort((a, b) => b.overall - a.overall)[0]?.id;
    }
    return bestId;
  }

  // ---------------------------------------------------------------------------
  // TALLY-VERWALTUNG (Spieler-Statistiken)
  // ---------------------------------------------------------------------------

  private initTallies(
    home: TeamMatchState,
    away: TeamMatchState,
  ): Map<string, PlayerMatchTally> {
    const map = new Map<string, PlayerMatchTally>();
    for (const team of [home, away]) {
      for (const p of team.lineup) {
        map.set(p.id, {
          playerId: p.id,
          started: true,
          minutesPlayed: MATCH_MINUTES,
          goals: 0,
          assists: 0,
          yellow: 0,
          yellowRed: 0,
          red: 0,
          isGoalkeeper: POSITION_GROUPS[p.naturalPosition] === 'GK',
        });
      }
    }
    return map;
  }

  /** Schreibt die Tallies in die Spielerobjekte (Saison & Karriere). */
  private commitTallies(
    home: TeamMatchState,
    away: TeamMatchState,
    tallies: Map<string, PlayerMatchTally>,
  ): void {
    const homeCleanSheet = away.goals === 0;
    const awayCleanSheet = home.goals === 0;
    const homeIds = new Set(home.lineup.map((p) => p.id));

    const { date, competition = 'Liga', logClubIds, applyInjuries } = this.options;
    for (const tally of tallies.values()) {
      const player = this.players[tally.playerId];
      if (!player) continue;
      const isHome = homeIds.has(player.id);
      const cleanSheet = isHome ? homeCleanSheet : awayCleanSheet;
      const rating = this.applyTally(player, tally, cleanSheet);
      if (date && logClubIds?.includes(player.clubId)) {
        logMatch(player, {
          date, competition, home: isHome,
          opponent: (isHome ? away.club : home.club).name,
          score: isHome ? `${home.goals}:${away.goals}` : `${away.goals}:${home.goals}`,
          minutes: tally.minutesPlayed, goals: tally.goals, assists: tally.assists, rating,
          card: tally.red > 0 ? 'Rot' : tally.yellowRed > 0 ? 'Gelb-Rot' : tally.yellow > 0 ? 'Gelb' : undefined,
        });
      }
    }
    // Im Spiel entstandene Verletzungen als echte Ausfälle übernehmen.
    if (date && applyInjuries) {
      for (const [id, severity] of this.matchInjuries) {
        const p = this.players[id];
        if (!p || p.injury) continue;
        const inj = createMatchInjury(severity, date);
        p.injury = inj;
        p.availability = 'injured';
        recordInjury(p, inj);
      }
    }
  }

  private applyTally(player: Player, tally: PlayerMatchTally, cleanSheet: boolean): number {
    const rating = computeMatchRating(tally, cleanSheet);
    for (const stats of [player.seasonStats, player.careerStats]) {
      stats.appearances++;
      if (tally.started) stats.starts++;
      else stats.substituteAppearances++;
      stats.minutesPlayed += tally.minutesPlayed;
      stats.goals += tally.goals;
      stats.assists += tally.assists;
      stats.yellowCards += tally.yellow;
      stats.yellowRedCards += tally.yellowRed;
      stats.redCards += tally.red;
      if (cleanSheet && (tally.isGoalkeeper || isDefensivePlayer(player))) {
        stats.cleanSheets++;
      }
      // Durchschnittsnote (dt. Notensystem, 1.0 = sehr gut)
      stats.ratingSum += rating;
      stats.ratedMatches++;
      stats.averageRating =
        stats.ratedMatches > 0 ? stats.ratingSum / stats.ratedMatches : 0;
    }

    // Gelbkarten-Zähler & Sperren-Logik (Basis; Feindetails im Kalendersystem)
    player.yellowCardCount += tally.yellow;
    if (tally.red > 0 || tally.yellowRed > 0) {
      player.suspensionMatches = Math.max(player.suspensionMatches, 1);
    }
    return rating;
  }

  /** Rekonstruiert Tallies aus einer Event-Liste (für updatePlayerStats extern). */
  private rebuildTalliesFromEvents(events: MatchEvent[]): Map<string, PlayerMatchTally> {
    const map = new Map<string, PlayerMatchTally>();
    const ensure = (id: string): PlayerMatchTally => {
      let t = map.get(id);
      if (!t) {
        const player = this.players[id];
        t = {
          playerId: id,
          started: true,
          minutesPlayed: MATCH_MINUTES,
          goals: 0,
          assists: 0,
          yellow: 0,
          yellowRed: 0,
          red: 0,
          isGoalkeeper: player
            ? POSITION_GROUPS[player.naturalPosition] === 'GK'
            : false,
        };
        map.set(id, t);
      }
      return t;
    };

    for (const ev of events) {
      switch (ev.type) {
        case 'goal':
        case 'penalty_goal':
          if (ev.playerId) ensure(ev.playerId).goals++;
          if (ev.secondaryPlayerId) ensure(ev.secondaryPlayerId).assists++;
          break;
        case 'yellow_card':
          if (ev.playerId) ensure(ev.playerId).yellow++;
          break;
        case 'yellow_red_card':
          if (ev.playerId) ensure(ev.playerId).yellowRed++;
          break;
        case 'red_card':
          if (ev.playerId) ensure(ev.playerId).red++;
          break;
        case 'injury':
          if (ev.playerId) ensure(ev.playerId).minutesPlayed = Math.min(
            ensure(ev.playerId).minutesPlayed, ev.minute,
          );
          break;
        default:
          break;
      }
    }
    return map;
  }

  // ---------------------------------------------------------------------------
  // EVENT-FABRIK
  // ---------------------------------------------------------------------------

  private makeEvent(
    minute: number,
    type: MatchEventType,
    clubId: string,
    playerId: string | undefined,
    secondaryPlayerId: string | undefined,
    home: TeamMatchState,
    away: TeamMatchState,
    commentary: string,
  ): MatchEvent {
    this.eventCounter++;
    return {
      id: `${this.homeClub.id}-${this.awayClub.id}-ev${this.eventCounter}`,
      minute,
      type,
      clubId,
      playerId,
      secondaryPlayerId,
      commentary,
      scoreAfter: { home: home.goals, away: away.goals },
    };
  }
}

// =============================================================================
// EXPORTIERTE HILFSFUNKTIONEN
// =============================================================================

/**
 * Berechnet die Team-Stärke aus den besten 11 Spielern.
 * Gewichtet nach Positionsgruppe (Sturm zählt mehr für die Offensive usw.)
 * und berücksichtigt Form & Fitness über {@link effectiveRating}.
 */
export function calculateTeamStrength(
  club: Club,
  players: Record<string, Player>,
  lineupOverride?: Player[],
): TeamStrength {
  const lineup =
    lineupOverride ??
    club.playerIds
      .map((id) => players[id])
      .filter((p): p is Player => !!p && p.availability === 'available' && !p.injury)
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 11);

  if (lineup.length === 0) {
    return { overall: 40, attack: 40, defense: 40, midfield: 40, goalkeeping: 40 };
  }

  // Zugewiesene Positionen (aus der Aufstellung) → sonst Stammposition.
  const assigned = club.tactics?.assignedPositions;

  let attackW = 0, attackSum = 0;
  let defenseW = 0, defenseSum = 0;
  let midW = 0, midSum = 0;
  let gkSum = 0, gkCount = 0;
  let overallSum = 0;

  for (const p of lineup) {
    const pos: Position = (assigned?.[p.id] as Position) ?? p.naturalPosition;
    // Positionseignung skaliert die Tagesstärke: fehlbesetzte Spieler bringen
    // weniger, ideal aufgestellte ihr volles Potenzial.
    const suit = positionSuitability(p, pos);
    const suitFactor = clamp(suit / Math.max(p.overall, 1), 0.55, 1.1);
    const eff = effectiveRating(p) * suitFactor;
    overallSum += eff;
    const group = POSITION_GROUPS[pos];

    // Offensiv-Gewichte
    const aw = group === 'ATT' ? 3 : group === 'MID' ? 1.5 : group === 'DEF' ? 0.3 : 0.1;
    attackW += aw;
    attackSum += aw * (eff * (0.6 + p.attributes.shooting / 250 + p.attributes.technique / 250));

    // Defensiv-Gewichte
    const dw = group === 'DEF' ? 3 : group === 'GK' ? 3 : group === 'MID' ? 1.2 : 0.2;
    defenseW += dw;
    defenseSum += dw * (eff * (0.6 + p.attributes.tackling / 250 + p.attributes.marking / 250));

    // Mittelfeld-Gewichte
    const mw = group === 'MID' ? 3 : group === 'ATT' ? 1 : group === 'DEF' ? 1 : 0.2;
    midW += mw;
    midSum += mw * (eff * (0.6 + p.attributes.passing / 250 + p.attributes.vision / 250));

    if (group === 'GK') {
      gkSum += eff * (0.6 + (p.attributes.reflexes + p.attributes.handling) / 500);
      gkCount++;
    }
  }

  return {
    overall: overallSum / lineup.length,
    attack: attackW > 0 ? attackSum / attackW : 50,
    defense: defenseW > 0 ? defenseSum / defenseW : 50,
    midfield: midW > 0 ? midSum / midW : 50,
    goalkeeping: gkCount > 0 ? gkSum / gkCount : 50,
  };
}

/** Ob ein Spieler defensiv ausgerichtet ist (für Clean-Sheet-Gutschrift). */
function isDefensivePlayer(player: Player): boolean {
  const group = POSITION_GROUPS[player.naturalPosition];
  return group === 'DEF' || group === 'GK';
}

/**
 * Entscheidet, ob ein Torabschluss zum Tor führt — vergleicht die
 * Abschlussstärke des Angreifers mit der Defensiv-/TW-Klasse.
 * (Wird intern für Feinjustierung genutzt und ist exportiert für Tests/UI.)
 */
export function shouldScoreGoal(attacker: Player, defender: Player): boolean {
  const atk =
    (attacker.attributes.shooting +
      attacker.attributes.composure +
      attacker.attributes.technique) /
    3;
  const def =
    (defender.attributes.tackling +
      defender.attributes.marking +
      defender.attributes.positioning) /
    3;
  const chance = clamp(0.5 + (atk - def) / 200, 0.1, 0.9);
  return Math.random() < chance;
}

/** Wählt einen zufälligen Offensivspieler aus einem Verein (Convenience). */
export function selectRandomAttacker(
  club: Club,
  players: Record<string, Player>,
): Player | undefined {
  const candidates = club.playerIds
    .map((id) => players[id])
    .filter((p): p is Player => !!p && POSITION_GROUPS[p.naturalPosition] === 'ATT');
  const pool =
    candidates.length > 0
      ? candidates
      : club.playerIds
          .map((id) => players[id])
          .filter((p): p is Player => !!p && POSITION_GROUPS[p.naturalPosition] === 'MID');
  if (pool.length === 0) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Wählt einen zufälligen Verteidiger aus einem Verein (Convenience). */
export function selectRandomDefender(
  club: Club,
  players: Record<string, Player>,
): Player | undefined {
  const pool = club.playerIds
    .map((id) => players[id])
    .filter((p): p is Player => !!p && POSITION_GROUPS[p.naturalPosition] === 'DEF');
  if (pool.length === 0) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}

// -----------------------------------------------------------------------------
// KOMMENTAR-GENERIERUNG (Retro-Stil 1980er)
// -----------------------------------------------------------------------------

/** Wählt zufällig einen Eintrag aus einem Array. */
function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Minuten-Präfix im klassischen Ticker-Stil, z.B. "12. Min: ". */
function minutePrefix(minute: number): string {
  return `${minute}. Min: `;
}

/**
 * Allgemeiner Kommentar-Generator für Standard-Ereignisse.
 * @param eventType logischer Ereignistyp
 * @param playerName Nachname des Hauptbeteiligten
 * @param minute Spielminute
 * @param rng Zufallsquelle
 * @param secondary optionaler zweiter Name (z.B. Team oder Angreifer)
 */
export function generateCommentary(
  eventType: string,
  playerName: string,
  minute: number,
  rng: () => number = Math.random,
  secondary?: string,
): string {
  const p = minutePrefix(minute);
  switch (eventType) {
    case 'chance':
      return p + pick([
        `Knapp vorbei! ${playerName} zielt zu hoch.`,
        `${playerName} zieht ab – der Ball streicht am Pfosten vorbei!`,
        `Am Pfosten! Kein Glück für ${secondary ?? playerName}.`,
        `Toller Angriff, aber ${playerName} findet keinen Abschluss.`,
        `${playerName} verzieht aus aussichtsreicher Position.`,
        `Ein satter Distanzschuss von ${playerName} – drüber!`,
      ], rng);
    case 'save':
      return p + pick([
        `Glanzparade! ${playerName} rettet gegen ${secondary ?? 'den Stürmer'}.`,
        `${playerName} ist zur Stelle und hält sicher.`,
        `Was für eine Parade! ${playerName} lenkt den Ball um den Pfosten.`,
        `${playerName} taucht ab und fischt das Leder aus dem Eck!`,
      ], rng);
    case 'corner':
      return p + pick([
        `Eckball für ${playerName}s Farben.`,
        `${playerName} tritt zur Ecke an.`,
        `Die nächste Ecke wird hereingebracht.`,
      ], rng);
    case 'foul':
      return p + pick([
        `Foul von ${playerName}. Freistoß.`,
        `${playerName} steigt zu hart ein – Pfiff des Schiedsrichters.`,
        `Unterbrechung: ${playerName} hat den Gegner gelegt.`,
      ], rng);
    case 'yellow_card':
      return p + pick([
        `Gelb für ${playerName} nach hartem Einsteigen.`,
        `Der Schiedsrichter zeigt Gelb! Taktisches Foul von ${playerName}.`,
        `Verwarnung für ${playerName} – das war überhart.`,
        `${playerName} sieht die Gelbe Karte.`,
      ], rng);
    case 'red_card':
      return p + pick([
        `Rote Karte! ${playerName} muss vom Platz!`,
        `Glatt Rot für ${playerName} – das war eine Notbremse!`,
        `${playerName} fliegt vom Platz! Der Schiedsrichter zückt Rot.`,
      ], rng);
    default:
      return p + `${playerName} am Ball.`;
  }
}

/** Erzeugt einen Tor-Kommentar (mit optionaler Vorlage). */
export function generateGoalCommentary(
  scorer: Player,
  assist: Player | undefined,
  minute: number,
  rng: () => number = Math.random,
): string {
  const p = minutePrefix(minute);
  const name = scorer.lastName;
  const base = pick([
    `TOR! ${name} zieht aus 20 Metern ab – unhaltbar!`,
    `${name} köpft nach Flanke ein – das Leder zappelt im Netz!`,
    `Traumtor von ${name}! Das Stadion tobt!`,
    `Ein präziser Schuss ins lange Eck – ${name} trifft!`,
    `TOR! ${name} vollendet eiskalt vor dem Kasten!`,
    `${name} lässt dem Torwart keine Chance – drin!`,
    `Was für ein Treffer! ${name} hämmert die Kugel unter die Latte!`,
  ], rng);
  if (assist && rng() < 0.8) {
    return (
      p +
      base +
      ` ${pick([
        `Vorbereitet von ${assist.lastName}.`,
        `Die Vorlage kam von ${assist.lastName}.`,
        `Mustergültig aufgelegt durch ${assist.lastName}.`,
      ], rng)}`
    );
  }
  return p + base;
}

/** Erzeugt einen Verletzungs-Kommentar je nach Schweregrad. */
export function generateInjuryCommentary(
  player: Player,
  severity: InjurySeverity,
  minute: number,
  rng: () => number = Math.random,
): string {
  const p = minutePrefix(minute);
  const name = player.lastName;
  if (severity === 'severe') {
    return p + pick([
      `${name} bleibt liegen! Es sieht nicht gut aus – Auswechslung nötig, er kann nicht weiterspielen.`,
      `Böse Szene: ${name} muss verletzt vom Feld getragen werden.`,
    ], rng);
  }
  if (severity === 'moderate') {
    return p + pick([
      `${name} bleibt liegen! Er hält sich das Knie.`,
      `${name} humpelt – die Betreuer eilen auf den Platz.`,
      `Auswechslung nötig – ${name} kann nicht weiterspielen.`,
    ], rng);
  }
  return p + pick([
    `${name} muss kurz behandelt werden, macht aber weiter.`,
    `${name} hat sich vertreten, beißt jedoch auf die Zähne.`,
  ], rng);
}

/**
 * Erzeugt (für spätere Nachbearbeitung durch das Verletzungssystem) ein
 * vollständiges Injury-Objekt aus einer im Spiel entstandenen Verletzung.
 * Wird hier bereitgestellt, damit die Match-Nachbereitung darauf zugreifen kann.
 */
export function createMatchInjury(
  severity: InjurySeverity,
  startDate: string,
): Injury {
  const typeBySeverity: Record<InjurySeverity, InjuryType> = {
    minor: 'bruise',
    moderate: 'muscle',
    severe: 'ligament',
    critical: 'bone',
  };
  const daysBySeverity: Record<InjurySeverity, number> = {
    minor: 5,
    moderate: 18,
    severe: 55,
    critical: 120,
  };
  const totalDays = daysBySeverity[severity];
  const start = new Date(startDate);
  const ret = new Date(start.getTime() + totalDays * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const descByType: Record<InjuryType, string> = {
    muscle: 'Muskelverletzung im Oberschenkel',
    ligament: 'Bänderriss',
    bone: 'Knochenbruch',
    bruise: 'Prellung',
    concussion: 'Gehirnerschütterung',
    fatigue: 'Überlastung',
    illness: 'Krankheit',
  };
  const type = typeBySeverity[severity];
  return {
    id: `inj-${startDate}-${Math.floor(Math.random() * 1e6)}`,
    type,
    severity,
    description: descByType[type],
    startDate,
    expectedReturnDate: iso(ret),
    daysRemaining: totalDays,
    totalDays,
    fromTraining: false,
  };
}

// -----------------------------------------------------------------------------
// BEWERTUNG (dt. Notensystem 1.0–6.0)
// -----------------------------------------------------------------------------

/** Errechnet die Spielnote aus den Tally-Daten (1.0 sehr gut … 6.0 ungenügend). */
function computeMatchRating(tally: PlayerMatchTally, cleanSheet: boolean): number {
  let rating = 3.5; // Ausgangsnote (befriedigend)
  rating -= tally.goals * 0.8;
  rating -= tally.assists * 0.5;
  if (cleanSheet && tally.isGoalkeeper) rating -= 0.7;
  rating += tally.yellow * 0.3;
  rating += tally.yellowRed * 0.6;
  rating += tally.red * 1.0;
  return clamp(Number(rating.toFixed(1)), 1.0, 6.0);
}

// -----------------------------------------------------------------------------
// SONSTIGE HILFEN
// -----------------------------------------------------------------------------

/** Einfache String-Hash-Funktion (für deterministische Seeds). */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

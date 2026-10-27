// =============================================================================
// Typen der Spiel-Engine (Simulation, Live-Ereignisse, Spielbericht).
// =============================================================================
import type { InjurySeverity, MatchEvent, MatchResult, Player, Position, PositionGroup } from '../../types';

export type Side = 'home' | 'away';
export const other = (s: Side): Side => (s === 'home' ? 'away' : 'home');

/** Grundausrichtung im Spiel: -2 Mauern … +2 Alles nach vorne. */
export type Mentality = -2 | -1 | 0 | 1 | 2;
export const MENTALITY_LABEL: Record<Mentality, string> = {
  [-2]: 'Mauern', [-1]: 'Defensiv', 0: 'Normal', 1: 'Offensiv', 2: 'Alles nach vorne',
};

/** Zurufe von der Seitenlinie (kurz wirksam, Abklingzeit, nutzen sich ab). */
export type ShoutId = 'druck' | 'ruhe' | 'kompakt' | 'fluegel' | 'konzentration' | 'zweikampf';
/** Halbzeitansprache. */
export type TeamTalk = 'loben' | 'analyse' | 'predigt';

/** Ein Spieler während des Spiels. */
export interface MPlayer {
  p: Player;
  id: string;
  side: Side;
  pos: Position;
  group: PositionGroup;
  /** Positionsstärke auf der gespielten Position (1–99). */
  base: number;
  /** Tagesform-Faktor (Form, Moral, Fitness, Frische), ~0.85–1.08. */
  cond: number;
  /** Kraft im Spiel (100 = frisch). */
  energy: number;
  onPitch: boolean;
  started: boolean;
  minuteIn: number;
  minuteOut: number | null;
  sentOff: boolean;
  injured: boolean;
  // --- Zähler ---
  goals: number;
  ownGoals: number;
  assists: number;
  yellow: number;
  yellowRed: number;
  red: number;
  shots: number;
  shotsOnTarget: number;
  xg: number;
  bigMissed: number;
  keyPasses: number;
  passes: number;
  passesOk: number;
  duels: number;
  duelsWon: number;
  tackles: number;
  saves: number;
  errors: number;
  distance: number;
  /** Leistungspunkte für die Note (positiv = gut). */
  impact: number;
}

export type ChanceKind = 'big' | 'normal' | 'long' | 'header' | 'freekick' | 'penalty' | 'counter' | 'solo';
export type ShotOutcome = 'goal' | 'saved' | 'wide' | 'over' | 'post' | 'blocked';
export type BuildKind = 'kurzpass' | 'konter' | 'flanke' | 'steilpass' | 'dribbling' | 'weit' | 'fehler' | 'ecke' | 'freistoss' | 'elfer' | 'abpraller';
export type Zone = 'def' | 'mid' | 'att';

export type SimEventKind =
  | 'kickoff' | 'halftime' | 'second_half' | 'fulltime'
  | 'et_start' | 'et_half' | 'et_second' | 'et_end'
  | 'flow' | 'attack_fail' | 'chance' | 'corner' | 'foul' | 'card' | 'offside'
  | 'injury' | 'sub' | 'mentality' | 'shout' | 'talk' | 'var' | 'stoppage'
  | 'shootout_start' | 'shootout_kick' | 'shootout_end';

/** Ein Ereignis der Live-Simulation (reicher als das gespeicherte MatchEvent). */
export interface SimEvent {
  seq: number;
  minute: number;
  /** Nachspielzeit-Minute (z. B. 2 bei 90+2). */
  stoppage?: number;
  period: 1 | 2 | 3 | 4 | 5;
  kind: SimEventKind;
  side?: Side;
  player?: string;
  other?: string;
  assist?: string;
  keeper?: string;
  build?: BuildKind;
  zone?: Zone;
  chance?: {
    type: ChanceKind;
    xg: number;
    outcome: ShotOutcome;
    big: boolean;
    ownGoal?: boolean;
    /** Tor nach Videobeweis aberkannt. */
    disallowed?: boolean;
    /** Torwart vorher mit Parade (Nachschuss). */
    rebound?: boolean;
  };
  card?: 'yellow' | 'yellowRed' | 'red';
  severity?: InjurySeverity;
  /** Grund für Fehlversuch / VAR / Ansage (frei). */
  detail?: string;
  /** Neue Ausrichtung / Zuruf / Ansprache. */
  value?: string | number;
  /** Elfmeterschießen. */
  shootout?: { scored: boolean; home: number; away: number; round: number; saved?: boolean };
  /** Spielstand nach dem Ereignis. */
  score: [number, number];
}

/** Mannschaftsstatistik eines Spiels. */
export interface TeamStats {
  shots: number;
  shotsOnTarget: number;
  xg: number;
  bigChances: number;
  corners: number;
  fouls: number;
  yellow: number;
  red: number;
  offsides: number;
  possession: number; // Minutenanteil-Summe
  passes: number;
  passesOk: number;
  duels: number;
  duelsWon: number;
  distance: number;
  saves: number;
}

export interface LineupEntry {
  id: string;
  pos: Position;
  in: number;
  out: number | null;
  started: boolean;
  grade: number;
  goals: number;
  assists: number;
  card?: 'Gelb' | 'Gelb-Rot' | 'Rot';
}

/** Ausführlicher Bericht (nur für Spiele mit Beteiligung des eigenen Vereins gespeichert). */
export interface MatchReport {
  year: number;
  home: TeamStats;
  away: TeamStats;
  lineups: { home: LineupEntry[]; away: LineupEntry[] };
  /** Druckphasen: je Minute -1 (Gast) … +1 (Heim). */
  momentum: number[];
  weather?: string;
  halftime: [number, number];
  /** Wurde das Spiel im Textmodus verfolgt? */
  watched?: boolean;
}

export type MatchResultExt = MatchResult & { report?: MatchReport };
export type MatchEventExt = MatchEvent & { stoppage?: number; xg?: number; big?: boolean };

export interface MatchOutcome {
  result: MatchResultExt;
  events: MatchEventExt[];
  decision: 'regular' | 'aet' | 'penalties';
  penalties: { home: number; away: number } | null;
  homeWins: boolean;
}

// =============================================================================
// Europapokal 2.0 / Landespokal-Wiederholungsspiele: optionale Spielstand-Felder.
// Alte Spielstände kennen sie nicht – dort spielt der laufende Wettbewerb im
// alten Modus (ein Spiel je Runde) bis zum Saisonende (game/euroSetup.ts `isV2`).
// =============================================================================
import type { CupTieDecision, Match } from './index';
import type { StageKind } from '../data/euroFormats';

/** Ein Spiel einer Begegnung (Hinspiel, Rückspiel oder Wiederholungsspiel). */
export interface CupLeg {
  home: string;
  away: string;
  date: string;
  played: boolean;
  homeGoals: number | null;
  awayGoals: number | null;
  decision: CupTieDecision | null;
  penalties: { home: number; away: number } | null;
  /** Volles Match-Objekt (nur Spiele mit voller Match-Engine). */
  match: Match | null;
}

/** Ein Spiel einer Gruppe bzw. der Ligaphase. */
export interface GroupMatch {
  id: string;
  /** Spieltag (0-basiert, Index in `CupRound.dates`). */
  md: number;
  date: string;
  home: string;
  away: string;
  hg: number | null;
  ag: number | null;
  match?: Match | null;
}

/** Eine Gruppe (Ligaphase = eine Gruppe mit allen Teams). */
export interface CupGroup {
  name: string;
  ids: string[];
  matches: GroupMatch[];
  /** Abschluss-Reihenfolge (nach dem letzten Spieltag). */
  final?: string[];
}

/** Statistik-Tupel wie engine/compStats.ts: [Sp, Tore, Vorlagen, Gelb, Gelb-Rot, Rot, Zu null]. */
export type XTuple = [number, number, number, number, number, number, number];

/** Zusatzfelder an CupRound (Europapokal 2.0). */
export interface CupRoundV2 {
  kind?: StageKind;
  /** Schlüssel der Runde aus data/euroFormats.ts. */
  key?: string;
  /** 1 = ein Spiel, 2 = Hin- und Rückspiel. */
  legs?: 1 | 2;
  /** Alle Spieltermine der Runde (Leg 1/2, Gruppenspieltage, Wiederholungstermin). */
  dates?: string[];
  /** Teilnehmer, die (aus Vorrunde, Gruppe oder anderem Wettbewerb) feststehen. */
  entrants?: string[];
  /** Herkunft je Teilnehmer: Gruppenplatz (1 = Sieger …) bzw. 9 = aus anderem Wettbewerb. */
  seedOf?: Record<string, number>;
  /** Herkunftsgruppe je Teilnehmer (Gruppenname), für den Gruppenschutz der Ziehung. */
  groupOf?: Record<string, string>;
  groups?: CupGroup[];
  /** Ziehung der K.-o.-Runde (data/euroFormats.ts `StageSpec.draw`). */
  drawMode?: 'free' | 'seeded' | 'fixed' | 'none';
  /** Erwartete Teilnehmerzahl (Ziehung erst, wenn alle feststehen). */
  need?: number;
}

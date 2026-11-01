// =============================================================================
// JUGENDWETTBEWERBE — Spielstand-Typen (optionales Feld `game.youthComps`)
// =============================================================================
import type { CompTuple } from '../../engine/compStats';
import type { ArchRow, ArchStatList } from '../leagueArchive';
import type { YcCls, YcFormat, YcKey } from '../../data/youthCompetitions';

/** Spiel: [Datum, Heim, Gast, Tore Heim, Tore Gast] – Tore −1 = noch nicht gespielt. */
export type YcFix = [string, string, string, number, number];

export interface YcLeague {
  id: string;
  name: string;
  /** Phase (0 = Vorrunde/Liga, 1 = Hauptrunde der Nachwuchsliga). */
  stage: number;
  /** Gruppe einer Gruppenphase (Anzeige als Gruppenübersicht). */
  group?: boolean;
  clubs: string[];
  fx: YcFix[];
  /** Plätze, die in die Endrunde / nächste Phase kommen. */
  slots: number;
  /** Plätze, die absteigen (Bundesliga/Regionalliga). */
  down?: number;
}

export interface YcTie {
  h: string; a: string;
  /** Ergebnisse je Spiel aus Sicht von h (Hin-/Rückspiel: Rückspiel ebenfalls h zuerst). */
  g: [number, number][];
  w?: string;
  /** 0 regulär, 1 n. V., 2 i. E. */
  dec?: 0 | 1 | 2;
  pen?: [number, number];
}

export interface YcRound {
  name: string;
  legs: 1 | 2;
  dates: string[];
  ties: YcTie[];
  drawn: boolean;
  /** Weg der nationalen Meister (UEFA Youth League). */
  path?: 'dcp';
  /** Feste Teilnehmer dieser Runde (erste Pokalrunde, Meisterweg). */
  entrants?: string[];
}

export interface YcComp {
  key: YcKey;
  fmt: YcFormat;
  cls: YcCls;
  label: string;
  section: string;
  /** Punkte für einen Sieg (2 bis 1994/95, dann 3). */
  pts: 2 | 3;
  leagues: YcLeague[];
  ko: YcRound[];
  /** Alle Teilnehmer der Endrunde (für Nachrichten/Effekte). */
  winner?: string | null;
  done?: boolean;
}

export interface YcArchComp {
  key: YcKey; label: string; section: string;
  leagues: { id: string; name: string; stage: number; group?: boolean; slots: number; down?: number; rows: ArchRow[] }[];
  ko: { n: string; t: [string, string, number, number, number, string, number?, number?, string?][] }[];
  winner: string | null;
  stats: ArchStatList;
}

export interface YcArchSeason {
  season: string;
  comps: YcArchComp[];
  /** Spieler der Bestenlisten: ID → [Name, Verein, Position]. */
  people: Record<string, [string, string, string]>;
}

export interface YouthCompsState {
  v: 1;
  season: string;
  comps: YcComp[];
  /** Mitglieder der Staffeln (Regionalliga/Bundesliga) je Wettbewerb: Liga-ID → Vereine. */
  members: Partial<Record<YcKey, Record<string, string[]>>>;
  /** Teamstärke der Saison: `${verein}|${klasse}` → Stärke (OVR-Skala). */
  str: Record<string, number>;
  /** Spielerstatistik je Wettbewerb: Spieler-ID → [Einsätze, Tore, Vorlagen, Gelb, Gelb-Rot, Rot, Zu null]. */
  stats: Partial<Record<YcKey, Record<string, CompTuple>>>;
  /** Echte Spieler mit Statistik: ID → [Name, Verein, Position] (falls sie später fehlen). */
  people: Record<string, [string, string, string]>;
  /** Vorjahressieger (Pokal/Meister für UEFA Youth League, Pokal-Titelverteidiger). */
  lastWinners?: Partial<Record<YcKey, string>>;
  /** Zuletzt verarbeiteter Tag. */
  day?: string;
  archive: YcArchSeason[];
}

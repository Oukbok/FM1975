// =============================================================================
// Presse: Typen der Zeitungsausgabe (Zentrale › Presse).
// Ausgaben werden nicht gespeichert, sondern bei Bedarf aus dem Spielstand
// rekonstruiert (Ergebnisse, Transfers, Trainerwechsel, Verletzungen, Nachrichten).
// =============================================================================
import type { Screen } from '../../shell/navigation';

export type PressKind =
  | 'spiel' | 'spieltag' | 'tabelle' | 'transfer' | 'geruecht' | 'trainer' | 'verletzung'
  | 'pokal' | 'europa' | 'jugend' | 'kabine' | 'rekord' | 'chronik' | 'vorschau' | 'kommentar' | 'meldung';

/** Bild eines Artikels: Spielergesicht, Trainergesicht oder Vereinswappen. */
export type PressImage =
  | { kind: 'player'; id: string }
  | { kind: 'coach'; id: string; name: string; clubId?: string }
  | { kind: 'club'; id: string };

/** Wohin ein Artikel führt (Spielbericht oder Seite). */
export type PressTarget =
  | { kind: 'match'; id: string; label: string }
  | { kind: 'screen'; screen: Screen; label: string };

/** Ergebniszeile (Spieltag, Pokal, Europapokal). */
export interface PressResult {
  matchId?: string;
  home: string;
  away: string;
  hg: number;
  ag: number;
  /** Zusatz, z. B. „n. V.“, „i. E. 4:3“. */
  note?: string;
}

export interface PressStory {
  id: string;
  kind: PressKind;
  /** Rubrik („Bundesliga“, „Transfermarkt“ …). */
  rubric: string;
  date: string;
  /** Gewicht für die Platzierung (Aufmacher = höchstes Gewicht). */
  weight: number;
  headline: string;
  /** Unterzeile. */
  dek?: string;
  /** Absätze des vollen Artikels (der erste ist der Vorspann). */
  body: string[];
  image?: PressImage;
  /** Beteiligte Spieler (IDs, Gesichter im Artikel). */
  people: string[];
  /** Beteiligte Vereine (IDs, Wappen im Artikel). */
  clubs: string[];
  targets: PressTarget[];
  results?: PressResult[];
  /** Betrifft den eigenen Verein. */
  own?: boolean;
  /** Gerücht (kursiv gekennzeichnet). */
  rumor?: boolean;
}

/** Kurze Tabellenzeile zum Stichtag der Ausgabe. */
export interface PressTableRow { clubId: string; pos: number; pts: number; gd: number; played: number }

export interface PressMasthead { name: string; claim: string; founded: number }

export interface PressEdition {
  date: string;
  /** Berichtszeitraum [from, date). */
  from: string;
  masthead: PressMasthead;
  /** Ausgabe-Nummer im Kalenderjahr. */
  number: number;
  /** Jahrgang der Zeitung. */
  volume: number;
  /** Reguläre Ausgabe (Montag/Donnerstag) oder aktuelle Ausgabe des Tages. */
  regular: boolean;
  lead: PressStory | null;
  stories: PressStory[];
  briefs: PressStory[];
  /** Ergebnisse des jüngsten Liga-Spieltags im Zeitraum. */
  matchday: { md: number; results: PressResult[] } | null;
  table: PressTableRow[];
  tableSize: number;
  /** Paarungen des nächsten Spieltags (wenn im Zeitraum kein Spieltag lag). */
  upcoming: { md: number; pairs: { home: string; away: string; date: string }[] } | null;
  /** Torjäger zum Stichtag (Spieler-ID, Tore). */
  scorers: { id: string; name: string; clubId: string; goals: number }[];
}

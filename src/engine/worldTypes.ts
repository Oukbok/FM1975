// Typen und Konstanten der Hintergrund-Welt (engine/world.ts).
import { EuroCompId } from '../data/europe';

export interface WorldCountry {
  name: string;
  origin: string;
  /** Grundniveau 1975 (Trends werden je Jahr addiert). */
  base: number;
  tier1: number;
  tier2: number;
  /** Liga-Ebenen: [1. Liga, 2. Liga] mit Vereins-IDs. */
  tiers: string[][];
  /** Ungenutzte Städte für Nachrücker. */
  spareCities: string[];
  /** Letzte Endtabelle der 1. Liga (IDs nach Platz). */
  lastTable: string[];
  lastChampion?: string;
  lastCupWinner?: string;
  /** Koeffizienten-Punkte der letzten fünf Saisons (neueste zuletzt). */
  coef: number[];
  /** Meistertitel je Verein (für Chronik/Übersicht). */
  titles: Record<string, number>;
  active: boolean;
  /** Unterbau (Wunsch Pascal): Amateurvereine, die mit den Letzten der 2. Liga tauschen. Optional (alte Spielstände). */
  pool?: string[];
  /** Ligaruf 0–100 (engine/leagueRep.ts, Option „Entwicklung der Ligen“). Fehlt = Landesniveau aus COUNTRY_TRENDS (alte Spielstände). */
  rep?: number;
  /** Landesniveau = repBase + REP_LEVEL_K × rep (beim Anlegen so gewählt, dass das Niveau unverändert bleibt). */
  repBase?: number;
  /** Ligaruf beim Anlegen (Grundgröße des Landes, Option „Frei“). */
  repStart?: number;
  /** Ligaruf der letzten Saisonwechsel (neueste zuletzt, höchstens 10). */
  repHist?: number[];
}

export interface WorldClubMeta {
  country: string;
  /** Größe 0..1 (Einzugsgebiet, Tradition, Wirtschaftskraft) – wächst mit Erfolg. */
  size: number;
  /** Natürliche Größe (Stadt, Tradition): dahin kehrt `size` langsam zurück. */
  home: number;
  /** Generationen-Zyklus: goldene und magere Jahre (langsamer Zufallsprozess). */
  cycle: number;
}

export interface WorldSeasonRecord {
  season: string;
  champions: Record<string, string>;
  cupWinners: Record<string, string>;
  /** Abschluss-Reihenfolge der 1. Liga je Land (nur die letzten WORLD_TABLES_KEEP Saisons; optional). */
  tables?: Record<string, string[]>;
  /** Auslandsligen der Saison je Land [1. Liga, 2. Liga] mit allen Ergebnissen (game/worldLeagues.ts; nur die letzten WORLD_TABLES_KEEP Saisons). */
  divs?: Record<string, (LeanDiv | null)[]>;
  /** Landespokale der Saison je Land mit allen Runden (game/worldCups.ts; nur die letzten WORLD_TABLES_KEEP Saisons). */
  cups?: Record<string, LeanCup>;
  /** Torschützenlisten der Auslandsligen, Schlüssel `Land|Ebene`: [Name, Verein, Position, Tore] (nur die letzten WORLD_TABLES_KEEP Saisons). */
  scorers?: Record<string, [string, string, string, number][]>;
  /** Alle Einzelwertungen (beste zehn) je `Land|Ebene` bzw. `Land|cup`: Wertung → [Name, Verein, Position, Wert, Gesicht, Geburtsjahr]. */
  pstats?: Record<string, Partial<Record<string, [string, string, string, number, string, number][]>>>;
}

/**
 * Schlanke Liga einer Saison: Vereine in Spielplan-Reihenfolge und alle Ergebnisse als Zeichenkette
 * (je Spiel zwei Zeichen Heim-/Gasttore, Basis 36, Spieltag für Spieltag in der Reihenfolge der
 * Paarungen). Spielplan und Termine ergeben sich daraus (kein gespeicherter Spielplan).
 */
export interface LeanDiv { ids: string[]; r: string }
/** Laufende Saison einer Auslandsliga: dazu gespielte Spieltage `md` von `n`. */
export interface WorldLiveDiv extends LeanDiv { md: number; n: number }
/**
 * Schlanker Landespokal: Teilnehmer (sortiert) und alle Ergebnisse als Zeichenkette – je Spiel drei Zeichen
 * (Heimtore, Gasttore nach Verlängerung, Entscheidung 0 regulär / 1 n. V. / 2, 3 Elfmeterschießen Heim/Gast).
 * Jede Runde wird neu gelost; die Auslosung ergibt sich fest aus Land, Saison und Runde (kein gespeicherter Baum).
 */
export interface LeanCup { ids: string[]; r: string }
/** Laufender Landespokal: gespielte Runden `rd` von `n`. */
export interface WorldLiveCup extends LeanCup { rd: number; n: number }
export interface WorldLive { season: string; divs: Record<string, WorldLiveDiv>; cups?: Record<string, WorldLiveCup> }

/** So viele Saisons behält die Welt-Historie die Abschluss-Reihenfolge (Spielstand-Größe). */
export const WORLD_TABLES_KEEP = 10;

export interface WorldState {
  version: 1;
  countries: Record<string, WorldCountry>;
  meta: Record<string, WorldClubMeta>;
  /** Koeffizient Deutschlands (gleiche Wertung, für die Rangliste). */
  germanCoef: number[];
  /** Europapokal-Starter der aktuellen Saison (ausländische IDs je Wettbewerb). */
  participants: Record<EuroCompId, string[]> | null;
  history: WorldSeasonRecord[];
  /** Laufende Saison aller Auslandsligen, Spieltag für Spieltag (game/worldLeagues.ts). */
  live?: WorldLive;
  /** Endplätze aller Auslandsvereine über die ganze Geschichte (engine/worldPlaces.ts); fehlt = alter Spielstand vor der Nachrüstung. */
  places?: import('./worldPlaces').WorldPlaces;
  nextId: number;
}

/** Auslandsverein (Europa-Simulation) statt deutscher Verein? */
export const isForeignId = (id: string) => id.startsWith('eu_') || id.startsWith('w_');

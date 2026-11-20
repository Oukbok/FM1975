// =============================================================================
// KONTINENTE AUSSERHALB EUROPAS – Typen (Wunsch Pascal: „Für internationale
// Wettbewerbe über Europa hinaus müssen wir auch Mannschaften auf anderen
// Kontinenten simulieren – effektiv, ohne dass man dort spielen kann.“)
// -----------------------------------------------------------------------------
// Je Land nur wenige Spitzenvereine als feste Stammdaten (NICHT im Spielstand):
// Name nach Stadt/Farbe verfremdet, Farben, Stadt und Stärke je Epoche
// (Stützjahre 1975/1990/2005/2025, dazwischen linear, danach gehalten; einzelne
// Ausreißer als Zusatzpunkte `x`). Echte Vorbilder und Quellen nur in
// docs/recherche/kontinente.md. Vereins-IDs `w_ct_<land>_<kürzel>` (Präfix w_ = Auslandsverein wie die Weltdaten: überall von deutschen Abläufen ausgenommen) – die Reihenfolge
// je Land ist Teil des Spielstand-Formats (Platzierungen werden als Index
// gespeichert): neue Vereine nur HINTEN anhängen.
// =============================================================================

export type ContinentKey = 'sa' | 'na' | 'af' | 'as' | 'oc';

/** Stützjahre der Stärke-Angaben `s`. */
export const CT_ANCHOR_YEARS = [1975, 1990, 2005, 2025] as const;

export interface CtClub {
  /** Kürzel im Land (ID = `ct_<land>_<key>`). */
  key: string;
  name: string;
  short: string;
  city: string;
  colors: [string, string];
  /** Stärke 1975/1990/2005/2025 (Maßstab der Hintergrund-Welt, Europas Spitze ≈ 82–86). */
  s: [number, number, number, number];
  /** Zusätzliche Stützpunkte [Jahr, Stärke] (z. B. kurze Blütezeit). */
  x?: [number, number][];
  /** Spielbetrieb von–bis (Gründung, Auflösung, Liga-Pause); fehlt = immer. */
  y?: [number, number][];
}

export interface CtCountry {
  /** Landeskürzel (klein, wie data/world/countries.ts), z. B. 'bra'. */
  cc: string;
  /** Flaggen-/Länderschlüssel aus data/countryFlags.ts, z. B. 'Brasilien'. */
  key: string;
  /** Herkunft der Spielernamen (data/origins.ts). */
  origin: string;
  /** Kontinentalverband je Zeitraum (Australien: Ozeanien bis 2005, danach Asien). */
  conf: [number, ContinentKey][];
  /** Ligabetrieb von–bis (fehlt = immer). */
  league?: [number, number][];
  /** Startplätze im Kontinentalpokal je Zeitraum [ab Jahr, Anzahl]. */
  slots: [number, number][];
  /** Ab diesem Jahr im Kontinentalpokal zugelassen (Südafrika nach der Isolation). */
  cupFrom?: number;
  /** Lage der Vereinsstädte (Vorschau-Karte), [Breite, Länge]. */
  geo: Record<string, [number, number]>;
  /** Landesmitte (Karte, falls die Stadt fehlt). */
  center: [number, number];
  clubs: CtClub[];
}

/** Kontinentalwettbewerb einer Epoche. */
export interface CtCupEra {
  from: number;
  to: number;
  name: string;
  /** Teilnehmerfeld (Zweierpotenz, K.-o.). */
  size: number;
  /** Hin- und Rückspiel in den Runden vor dem Finale. */
  legs: 1 | 2;
  /** Finale: 1 = ein Spiel (neutral), 2 = Hin/Rück. */
  finalLegs: 1 | 2;
  /** Nur in diesen Jahren ausgetragen (fehlt = jedes Jahr der Epoche). */
  years?: number[];
  /** Jahre ohne Austragung. */
  skip?: number[];
}

export interface CtContinent {
  key: ContinentKey;
  name: string;
  /** Kurzname des Verbands-Raums für Texte („Südamerika“). */
  short: string;
  cups: CtCupEra[];
  /** Historische Sieger (Jahr → Vereins-ID), Grundlage der historischen Lenkung + Siegerliste vor dem Spielstart. */
  winners: Record<number, string>;
}

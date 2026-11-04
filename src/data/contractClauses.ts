// =============================================================================
// VERTRAGSBAUSTEINE je Epoche (Vertragsverhandlung 2.0, engine/contractNegotiation.ts)
// -----------------------------------------------------------------------------
// Welche Punkte kann man in einem Spielervertrag verhandeln – und ab wann? Der
// deutsche Profifußball kannte von 1963 bis 1972 Gehalts- und Handgeld-
// Obergrenzen (Lizenzspielerstatut des DFB, z. B. 1.200 DM Monatsgehalt plus
// Prämien); nach dem Bundesliga-Skandal fielen sie 1972 weg. Ab 1975 sind
// Grundgehalt, Handgeld und Prämien daher frei verhandelbar.
// Vor dem Bosman-Urteil (EuGH C-415/93 vom 15.12.1995) stand dem alten Verein
// auch nach Vertragsende eine Ablöse zu – Spieler ließen sie sich deshalb gern
// vertraglich festschreiben („festgeschriebene Ablöse“). Danach ersetzt die
// Ausstiegsklausel diese Rolle (in Deutschland ab etwa 1996 verbreitet).
// Vereinsoptionen auf ein weiteres Jahr kommen in den 1990ern auf, Spieler-
// optionen (Spieler entscheidet) erst um 2000; Abstiegsklauseln mit Gehalts-
// kürzung sind seit den 1980ern üblich, gestaffelte Gehälter (jährliche
// Steigerung) ebenfalls. Berater: siehe engine/playerWishes.ts (`hasAgent`).
// Vereinfachungen: Jahreszahlen sind Richtwerte für den deutschen Markt.
// =============================================================================
import type { InfoKey } from './infoTexts';

export type ClauseKey =
  | 'wage' | 'years' | 'signing' | 'appearance' | 'goal' | 'cleanSheet' | 'title' | 'stay'
  | 'raise' | 'fixedFee' | 'release' | 'option' | 'relegation' | 'promises' | 'agent' | 'loyalty' | 'success';

export interface ClauseDef {
  key: ClauseKey;
  label: string;
  /** Erstes Jahr, in dem der Baustein angeboten wird. */
  from: number;
  /** Letztes Jahr (z. B. festgeschriebene Ablöse nur bis Bosman). */
  to?: number;
  /** Kurzer Erklärsatz für die Tabelle. */
  short: string;
  /** Herkunft der Jahreszahl (Recherche, vereinfacht). */
  source: string;
  info?: InfoKey;
}

export const CLAUSES: ClauseDef[] = [
  { key: 'wage', label: 'Grundgehalt', from: 1975, short: 'Festes Gehalt, unabhängig von Einsätzen.', source: 'Gehaltsobergrenze des Lizenzspielerstatuts 1972 aufgehoben.', info: 'v2_gehalt' },
  { key: 'years', label: 'Laufzeit', from: 1975, short: 'Ab der nächsten Saison, ein bis fünf Jahre.', source: 'Übliche Laufzeiten 1–5 Jahre.', info: 'v2_laufzeit' },
  { key: 'signing', label: 'Handgeld', from: 1975, short: 'Einmalzahlung bei Unterschrift.', source: 'Handgeld seit den 1960ern üblich, Obergrenze bis 1972.', info: 'v2_handgeld' },
  { key: 'appearance', label: 'Einsatzprämie', from: 1975, short: 'Je Pflichtspiel-Einsatz.', source: 'Auflauf- und Einsatzprämien seit Gründung der Bundesliga.', info: 'v2_praemien' },
  { key: 'goal', label: 'Torprämie', from: 1975, short: 'Je eigenem Pflichtspieltor.', source: 'Individuelle Torprämien seit den 1970ern belegt.', info: 'v2_praemien' },
  { key: 'cleanSheet', label: 'Zu-null-Prämie', from: 1975, short: 'Je Spiel ohne Gegentor auf dem Platz.', source: 'Prämie für Torhüter und Abwehr, analog zur Torprämie.', info: 'v2_praemien' },
  { key: 'title', label: 'Titelprämie', from: 1975, short: 'Je Meisterschaft/Staffelsieg oder Pokalsieg.', source: 'Meisterprämien seit den 1960ern.', info: 'v2_titel' },
  { key: 'stay', label: 'Klassenerhalt-Prämie', from: 1975, short: 'Wenn die Liga gehalten wird.', source: 'Übliche Prämie bei Abstiegskandidaten.', info: 'v2_titel' },
  { key: 'raise', label: 'Gehaltssteigerung', from: 1985, short: 'Gestaffelt: jede weitere Saison mehr.', source: 'Gestaffelte Verträge ab den 1980ern verbreitet (vereinfacht).', info: 'v2_staffel' },
  { key: 'fixedFee', label: 'Festgeschriebene Ablöse', from: 1975, to: 1995, short: 'Ablöse, wenn er nach Vertragsende geht.', source: 'Vor Bosman (EuGH 15.12.1995) Ablöse auch nach Vertragsende.', info: 'v2_festablose' },
  { key: 'release', label: 'Ausstiegsklausel', from: 1996, short: 'Wer sie zahlt, bekommt ihn ohne Verhandlung.', source: 'Nach Bosman in Deutschland verbreitet (ab etwa 1996).', info: 'ausstiegsklausel' },
  { key: 'option', label: 'Verlängerungsoption', from: 1990, short: 'Ein weiteres Jahr zu gleichen Bedingungen.', source: 'Vereinsoption ab den 1990ern, Spieleroption ab etwa 2000.', info: 'v2_option' },
  { key: 'relegation', label: 'Abstiegsklausel', from: 1985, short: 'Gehaltskürzung nach einem Abstieg.', source: 'Abstiegsklauseln seit den 1980ern üblich (vereinfacht).', info: 'v2_abstieg' },
  { key: 'promises', label: 'Rolle & Zusagen', from: 1975, short: 'Stammplatz, Kapitänsbinde … – werden am Saisonende geprüft.', source: 'Mündliche Zusagen, gekoppelt an die Versprechen.', info: 'v2_zusagen' },
  { key: 'agent', label: 'Beraterprovision', from: 1975, short: 'Einmalzahlung an seinen Berater.', source: 'FIFA-Spielervermittler ab 1994, nach Bosman praktisch jeder Profi.', info: 'berater' },
  { key: 'loyalty', label: 'Treueprämie', from: 1975, short: 'Einmalig zum Vertragsende, wenn er bleibt.', source: 'Treueprämien seit den 1970ern.', info: 'treuepraemie' },
  { key: 'success', label: 'Erfolgsklausel', from: 1975, short: 'Mehr Gehalt bei einem Europapokal-Platz.', source: 'Leistungsbezogene Gehaltsanpassung.', info: 'erfolgsklausel' },
];

export const CLAUSE_BY_KEY: Record<ClauseKey, ClauseDef> = Object.fromEntries(CLAUSES.map((c) => [c.key, c])) as Record<ClauseKey, ClauseDef>;

/** Vereinsoption ab, Spieleroption ab. */
export const OPTION_CLUB_FROM = 1990;
export const OPTION_PLAYER_FROM = 2000;

/** Ist der Baustein in diesem Jahr verhandelbar? */
export function clauseOpen(key: ClauseKey, year: number): boolean {
  const c = CLAUSE_BY_KEY[key];
  return year >= c.from && (c.to == null || year <= c.to);
}

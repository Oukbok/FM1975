// =============================================================================
// Echte Geschichte bis 2026/27 als datumsabhängige Einflüsse (ergänzt die Chronik
// in data/timeline.ts). Datengetrieben, im Datensatz/Editor änderbar.
// =============================================================================

export interface HistoryConfig {
  /** Letzte Saison (Startjahr) des Pokals der Pokalsieger. */
  cupWinnersCupLastSeason: number;
  /** Zuschauer-Beschränkungen: Zeiträume mit Faktor (0 = Geisterspiele). */
  attendanceRestrictions: { from: string; to: string; factor: number }[];
  /** TV-Markt-Faktoren je Jahr (Krisen/Booms). */
  tvMarket: { year: number; factor: number }[];
  /** Erster Sommer, in dem Spieler nach Vertragsende ablösefrei wechseln (Bosman-Urteil Dez. 1995). */
  bosmanFromYear?: number;
}

export const HISTORY: HistoryConfig = {
  cupWinnersCupLastSeason: 1998,
  attendanceRestrictions: [
    { from: '2020-03-14', to: '2021-06-30', factor: 0 },
    { from: '2021-07-01', to: '2022-03-19', factor: 0.5 },
  ],
  tvMarket: [{ year: 2002, factor: 0.85 }, { year: 2003, factor: 0.92 }],
  bosmanFromYear: 1996,
};

/** Pokal der Pokalsieger aktiv? */
export function cupWinnersCupActive(seasonStartYear: number): boolean {
  return seasonStartYear <= HISTORY.cupWinnersCupLastSeason;
}

/** Zuschauer-Beschränkung am Datum (1 = keine). */
let euphoria: { from: string; to: string; factor: number } | null = null;
/** WM-Euphorie (game/clubEventsGame.ts): Zuschauer-Faktor > 1 für einen Zeitraum. */
export function setAttendanceEuphoria(e: { from: string; to: string; factor: number } | null): void { euphoria = e; }

export function attendanceRestriction(dateISO?: string): number {
  if (!dateISO) return 1;
  for (const r of HISTORY.attendanceRestrictions) if (dateISO >= r.from && dateISO <= r.to) return r.factor;
  if (euphoria && dateISO >= euphoria.from && dateISO <= euphoria.to) return euphoria.factor;
  return 1;
}

/** TV-Markt-Faktor eines Jahres (1 = normal). */
export function tvMarketFactor(year: number): number {
  return HISTORY.tvMarket.find((t) => t.year === year)?.factor ?? 1;
}

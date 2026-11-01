// =============================================================================
// Zugriff auf die Historie vor Spielbeginn (1963/64–1974/75)
// =============================================================================
import { HIST_DFB_POKAL, HIST_EURO_FINALS, HIST_FOREIGN, HIST_TOP_SCORERS, type HistFinal } from './finals';
import { HIST_BUNDESLIGA, HIST_DDR_OBERLIGA, HIST_ZWEITE_1974, type HistRow } from './tables1963';

export type { HistFinal, HistRow };
export { HIST_FOREIGN, HIST_TOP_SCORERS };

/** Saisons mit Historie (älteste zuerst). */
export const HISTORIC_SEASONS: string[] = Object.keys(HIST_BUNDESLIGA).sort();

export interface HistDivision { id: string; name: string; tier: number; group: 'nord' | 'sued' | 'nordost' | null; rows: HistRow[] }

/** Ligen einer historischen Saison (IDs wie im laufenden Spiel). */
export function historicDivisions(season: string): HistDivision[] {
  const out: HistDivision[] = [];
  if (HIST_BUNDESLIGA[season]) out.push({ id: 'tier1', name: '1. Liga', tier: 1, group: null, rows: HIST_BUNDESLIGA[season] });
  if (season === '1974/75') {
    out.push({ id: 'tier2-nord', name: '2. Liga Nord', tier: 2, group: 'nord', rows: HIST_ZWEITE_1974.nord });
    out.push({ id: 'tier2-sued', name: '2. Liga Süd', tier: 2, group: 'sued', rows: HIST_ZWEITE_1974.sued });
  }
  if (HIST_DDR_OBERLIGA[season]) out.push({ id: 'ddr-oberliga', name: 'DDR-Oberliga', tier: 101, group: 'nordost', rows: HIST_DDR_OBERLIGA[season] });
  return out;
}

export function historicFinal(season: string, comp: 'cup' | 'ec' | 'cwc' | 'uefa'): HistFinal | undefined {
  return comp === 'cup' ? HIST_DFB_POKAL[season] : HIST_EURO_FINALS[season]?.[comp];
}

/** Anzahl Absteiger der historischen Bundesliga (zwei je Saison). */
export const HIST_RELEGATED = 2;

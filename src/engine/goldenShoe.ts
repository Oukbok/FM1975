// =============================================================================
// GOLDENER SCHUH — bester Torjäger Europas (rein, ohne Spielstand)
// -----------------------------------------------------------------------------
// Vorbild ist die europäische Torjäger-Wertung der Fachpresse (seit 1968).
// Quellen: rsssf.org „European Golden Boot“, Wikipedia „European Golden Shoe“
// (Regelwerk der European Sports Media):
//   • bis 1996: reine Torzahl in der 1. Liga (ungewichtet; 1991–1996 gab es
//     offiziell keinen Sieger – im Spiel wird ungewichtet weiter vergeben),
//   • ab der Saison 1996/97: Tore × Ligafaktor nach der Fünfjahreswertung der
//     Länder – Rang 1–5 Faktor 2, Rang 6–21 Faktor 1,5, alle übrigen Faktor 1.
// Gleichstand: weniger Spiele zuerst, dann mehr Tore.
// =============================================================================

export const SHOE_WEIGHTED_FROM = 1997; // Endjahr der ersten gewichteten Saison (1996/97)

/** Ligafaktor nach Rang des Landes in der Fünfjahreswertung (1 = bestes Land). */
export function shoeFactor(endYear: number, countryRank: number): number {
  if (endYear < SHOE_WEIGHTED_FROM) return 1;
  if (countryRank >= 1 && countryRank <= 5) return 2;
  if (countryRank >= 6 && countryRank <= 21) return 1.5;
  return 1;
}

export interface ShoeCandidate { pid: string; name: string; clubId: string; clubName: string; country: string; home: boolean; pos: string; apps: number; goals: number; rank: number }
export interface ShoeScored extends ShoeCandidate { factor: number; points: number }

/** Top-N der Wertung (nur Spieler mit mindestens einem Tor). */
export function rankGoldenShoe(cands: ShoeCandidate[], endYear: number, n = 10): ShoeScored[] {
  return cands
    .filter((c) => c.goals > 0)
    .map((c) => { const factor = shoeFactor(endYear, c.rank); return { ...c, factor, points: Math.round(c.goals * factor * 10) / 10 }; })
    .sort((a, b) => b.points - a.points || a.apps - b.apps || b.goals - a.goals || a.pid.localeCompare(b.pid))
    .slice(0, n);
}

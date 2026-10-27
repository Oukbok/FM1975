// =============================================================================
// Echte Geschichte bis 2026/27 als datumsabhängige Einflüsse (ergänzt die Chronik
// in data/timeline.ts). Alles hier ist bewusst datengetrieben und für den
// späteren Editor/Datensatz gedacht.
// =============================================================================

/** Pokal der Pokalsieger: bis einschließlich 1998/99. */
export function cupWinnersCupActive(seasonStartYear: number): boolean {
  return seasonStartYear < 1999;
}

/**
 * Zuschauer-Beschränkungen (Pandemie 2020–2022): Geisterspiele ab Mitte März 2020,
 * Teilöffnung mit halber Kapazität bis Frühjahr 2022.
 */
export function attendanceRestriction(dateISO?: string): number {
  if (!dateISO) return 1;
  if (dateISO >= '2020-03-14' && dateISO < '2021-07-01') return 0;
  if (dateISO >= '2021-07-01' && dateISO < '2022-03-20') return 0.5;
  return 1;
}

/** TV-Markt-Krise (Insolvenz eines großen Rechtehändlers 2002): weniger TV-Geld. */
export function tvMarketFactor(year: number): number {
  if (year === 2002) return 0.85;
  if (year === 2003) return 0.92;
  return 1;
}

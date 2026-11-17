// =============================================================================
// FANKULTUR JE LAND (Wunsch Pascal: Gästeblock und Fankurve – gibt es das überall?)
// -----------------------------------------------------------------------------
// Recherche (Stand 2026):
// • Gästeblock gibt es in allen europäischen Ligen: Deutschland mindestens 10 %
//   der Kapazität (DFL-Spielordnung), England 3.000 Plätze bzw. 10 % bei
//   kleineren Stadien, Uefa-Wettbewerbe und Spanien mindestens 5 %, Italien
//   „settore ospiti“ (zeitweise Fankarte/Reiseverbote).
// • Eine Kurve der eigenen harten Fans gibt es ebenfalls überall: Fankurve
//   (Deutschland), Curva (Italien), Grada de Animación (Spanien), Home End
//   (England), Virage (Frankreich).
// • Stehplätze sind nicht überall erlaubt: England – Sitzplatzpflicht in den
//   obersten zwei Ligen ab 1994/95 (Taylor-Report), lizenzierte Stehbereiche
//   erst wieder ab 2022/23; Spanien – Sitzplatzstadien ab Ende der 1990er;
//   Italien – Sitzplätze seit den Umbauten zur WM 1990 (gestanden wird trotzdem).
//   Uefa-Spiele ab 1998/99 nur Sitzplätze (engine/stadiumBlocks.ts allSeaterEuro).
// Quellen: DFL-Spielordnung (Gästekontingent 10 %), SGSA „Licensed standing“,
// LaLiga-Mitteilungen (Gästekontingent ≥ 5 %), Berichte zur Tessera del Tifoso.
// =============================================================================

export interface FanCulture {
  /** Name der Heimkurve im Land. */
  curve: string;
  /** Erstes Jahr ohne Stehplätze in den oberen Ligen (fehlt = Stehen erlaubt). */
  seatsFrom?: number;
  /** Ab diesem Jahr wieder (lizenzierte) Stehbereiche. */
  standAgain?: number;
  /** Gästekontingent laut Regel (Anteil). */
  guest: number;
}

const DEFAULT: FanCulture = { curve: 'Fankurve', guest: 0.05 };
const BY_CC: Record<string, FanCulture> = {
  ger: { curve: 'Fankurve', guest: 0.1 },
  gdr: { curve: 'Fankurve', guest: 0.1 },
  aut: { curve: 'Fankurve', guest: 0.1 },
  sui: { curve: 'Fankurve', guest: 0.08 },
  eng: { curve: 'Home End', seatsFrom: 1994, standAgain: 2022, guest: 0.1 },
  sco: { curve: 'Home End', seatsFrom: 1994, standAgain: 2011, guest: 0.1 },
  wal: { curve: 'Home End', seatsFrom: 1994, standAgain: 2022, guest: 0.1 },
  esp: { curve: 'Grada de Animación', seatsFrom: 1998, guest: 0.05 },
  ita: { curve: 'Curva', seatsFrom: 1990, guest: 0.05 },
  fra: { curve: 'Virage', guest: 0.05 },
  ned: { curve: 'Vak', guest: 0.05 },
  por: { curve: 'Claque', seatsFrom: 2004, guest: 0.05 },
};

export const fanCultureOf = (cc: string): FanCulture => BY_CC[cc] ?? DEFAULT;

/** Stehplätze in den oberen Ligen erlaubt? */
export function standingAllowed(cc: string, year: number): boolean {
  const c = fanCultureOf(cc);
  if (c.seatsFrom == null || year < c.seatsFrom) return true;
  return c.standAgain != null && year >= c.standAgain;
}

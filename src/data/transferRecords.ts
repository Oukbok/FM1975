// =============================================================================
// REKORDKURVE DER ABLÖSESUMMEN (Spitzenablöse eines Jahres, nominal in EUR)
// -----------------------------------------------------------------------------
// Grundlage: Recherche in docs/recherche/transferrekorde.md (Weltrekorde und
// Spitzentransfers je Jahr, Bundesliga-Rekordzugänge). Die Stützwerte sind
// GEGLÄTTET: Ausreißer wie der 222-Mio.-Transfer 2017 heben die Kurve nur
// teilweise an. Im Spiel ist die Kurve eine weiche Obergrenze – sie kann
// durchbrochen werden, die Spitzenablösen einer Saison liegen im Schnitt aber
// darunter (engine/transferMarket.ts).
//
// world   = Spitzenablöse international (große Auslandsvereine)
// germany = Spitzenablöse eines deutschen Vereins (Zugang)
// Werte vor 2001 für Deutschland sind Schätzungen aus Einzelangaben
// (1976 erster Millionentransfer, 2001 Rekord mit 50 Mio. DM).
// Ab 2027 fiktive Fortschreibung (+3,5 % pro Jahr).
// =============================================================================

export interface FeeAnchor { year: number; world: number; germany: number }

const M = 1_000_000;

/** Geglättete Stützwerte (EUR nominal). Vom Datensatz änderbar (economy.transferRecords). */
export const TRANSFER_RECORD_ANCHORS: FeeAnchor[] = [
  { year: 1975, world: 3.6 * M, germany: 0.4 * M },
  { year: 1976, world: 4.1 * M, germany: 0.51 * M },
  { year: 1980, world: 5.0 * M, germany: 1.0 * M },
  { year: 1984, world: 9.0 * M, germany: 1.4 * M },
  { year: 1990, world: 12 * M, germany: 3.0 * M },
  { year: 1992, world: 17 * M, germany: 3.8 * M },
  { year: 1996, world: 20 * M, germany: 6.0 * M },
  { year: 1998, world: 32 * M, germany: 9.0 * M },
  { year: 2000, world: 55 * M, germany: 14 * M },
  { year: 2001, world: 65 * M, germany: 18 * M },
  { year: 2004, world: 45 * M, germany: 15 * M },
  { year: 2007, world: 48 * M, germany: 25 * M },
  { year: 2009, world: 80 * M, germany: 30 * M },
  { year: 2013, world: 95 * M, germany: 40 * M },
  { year: 2016, world: 105 * M, germany: 43 * M },
  { year: 2017, world: 160 * M, germany: 45 * M },
  { year: 2019, world: 140 * M, germany: 70 * M },
  { year: 2021, world: 115 * M, germany: 65 * M },
  { year: 2023, world: 120 * M, germany: 85 * M },
  { year: 2025, world: 135 * M, germany: 70 * M },
  { year: 2026, world: 135 * M, germany: 72 * M },
];

/** Ungeglättete Spitzenablösen einzelner Jahre (EUR, gerundet) – nur zur Anzeige/Doku. */
export const TRANSFER_RECORD_RAW: [number, number][] = [
  [1975, 3.6], [1976, 4.1], [1982, 6.5], [1984, 9.7], [1987, 9.0], [1990, 11.8], [1992, 18.3], [1996, 19],
  [1997, 28], [1998, 32], [1999, 46], [2000, 62], [2001, 75], [2002, 46], [2006, 44], [2008, 42], [2009, 94],
  [2011, 58], [2013, 100], [2014, 81], [2015, 75], [2016, 105], [2017, 222], [2018, 180], [2019, 127], [2020, 81],
  [2021, 117.5], [2022, 95], [2023, 121], [2025, 145],
];

const FUTURE_GROWTH = 1.035;

/** Spitzenablöse (EUR nominal) eines Jahres – log-linear interpoliert, danach fortgeschrieben. */
export function recordFeeEUR(year: number, scope: 'world' | 'germany'): number {
  const a = TRANSFER_RECORD_ANCHORS;
  if (year <= a[0].year) return a[0][scope];
  for (let i = 0; i < a.length - 1; i++) {
    if (year >= a[i].year && year <= a[i + 1].year) {
      const t = (year - a[i].year) / (a[i + 1].year - a[i].year);
      return a[i][scope] * Math.pow(a[i + 1][scope] / a[i][scope], t);
    }
  }
  const last = a[a.length - 1];
  return last[scope] * Math.pow(FUTURE_GROWTH, year - last.year);
}

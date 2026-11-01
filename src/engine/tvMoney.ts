// =============================================================================
// TV-GELDER — Topf der Ligen nach den echten Rechteverträgen und Verteilung nach
// Tabellenplatz (Finanzen 2.0). Quellen: docs/specs/FINANZEN_SPEC.md §10.4.
// =============================================================================
import { Club } from '../types';
import { revenueScale } from './economy';
import { tvMarketFactor } from '../data/history';

// -----------------------------------------------------------------------------
// Zentrale TV-Vermarktung
// -----------------------------------------------------------------------------
/**
 * TV-Topf der 1. Liga in 1975-Werten: ARD/ZDF zahlten 1975/76 4,8 Mio. DM für die
 * Bundesliga (Recherche); davon 4,2 Mio. für die 1. Liga (≈ 233.000 DM je Verein),
 * der Rest über den Anteil der 2. Liga.
 */
export const TV_POOL_1975 = 4_200_000;

/**
 * TV-Topf der 1. Liga nach den echten Rechteverträgen (Mio., nominal: DM bis 2001, € ab 2002;
 * 1. Liga ≈ 80 % der Bundesliga-Summe, ab 2014/15 inkl. Auslandsvermarktung). Quellen:
 * basicthinking.de „Kosten & Inhaber der Bundesliga-Rechte seit 1965“ (1977/78 5,38 Mio. DM,
 * 1984/85 10, 1988/89 40, 1992/93 145, 1997/98 255, 1999/2000 330 Mio. DM, 2000/01 Kirch
 * 355 Mio. €, 2006/07 407 Mio. €, 2013/14 628 Mio. €, 2017/18 1,16 Mrd. € + Ausland),
 * 90min.de TV-Geld-Tabelle 2024/25 (national 965 Mio. € für 18 Klubs, Bayern 70,6 – Kiel 29,4;
 * plus ≈ 200 Mio. € international). Der Einbruch 2002/03 (Kirch-Pleite) steckt im
 * Datensatz-Faktor tvMarketFactor, nicht hier. Nach 2025: Wachstum wie revenueScale('tv').
 */
const TV_POOL_ANCHORS: [number, number][] = [
  [1975, 4.2], [1977, 4.3], [1984, 8], [1987, 14], [1988, 32], [1990, 40], [1991, 64], [1992, 116],
  [1995, 132], [1996, 156], [1997, 204], [1999, 264], [2000, 555], [2001, 560], [2004, 469],
  [2006, 637], [2009, 610], [2012, 690], [2013, 980], [2015, 1280], [2017, 2190], [2021, 2280], [2025, 2330],
];

/** TV-Topf der 1. Liga (nominal) ohne Krisenfaktor. */
export function tvPoolBase(year: number): number {
  const A = TV_POOL_ANCHORS;
  const last = A[A.length - 1];
  if (year >= last[0]) return last[1] * 1e6 * revenueScale('tv', year) / revenueScale('tv', last[0]);
  if (year <= A[0][0]) return A[0][1] * 1e6;
  for (let i = 0; i < A.length - 1; i++) {
    const [ya, va] = A[i], [yb, vb] = A[i + 1];
    if (year <= yb) return va * Math.pow(vb / va, (year - ya) / (yb - ya)) * 1e6;
  }
  return last[1] * 1e6;
}

export function tvPoolFor(tier: number, year: number): number {
  const top = tvPoolBase(year) * tvMarketFactor(year);
  if (tier <= 1) return top;
  if (tier === 2) return top * (year < 2000 ? 0.25 : 0.2);
  if (tier === 3) return top * 0.035;
  return top * 0.008;
}

/** Gewicht der Tabellenplatzierung bei der TV-Verteilung (früher fast gleichmäßig). */
export function tvPerformanceWeight(year: number): number {
  // Ab 2017/18 vier Säulen (Leistung, Nachwuchs, Interesse, Ausland): Bayern bekommt 2024/25
  // rund das 2,4-Fache des Letzten (national), mit Auslandsgeldern ≈ 1,6-Fache des Mittels.
  return year < 1990 ? 0.15 : year < 2000 ? 0.25 : year < 2017 ? 0.35 : 0.5;
}

/**
 * Verteilt den TV-Topf der Liga auf ihre Vereine (Jahresbetrag, nominal).
 * @param perfOf  0..1 (1 = Meister der Vorsaison), Aufsteiger ≈ 0,15
 */
export function allocateTv(clubs: Club[], tier: number, year: number, perfOf: (id: string) => number): void {
  if (!clubs.length) return;
  const pool = tvPoolFor(tier, year);
  const w = tvPerformanceWeight(year);
  const weights = clubs.map((c) => (1 - w) + w * 2 * perfOf(c.id));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  clubs.forEach((c, i) => { c.finances.tvAnnual = Math.round((pool * weights[i]) / sum); });
}


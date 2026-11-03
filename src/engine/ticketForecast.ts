// =============================================================================
// KARTENVERKAUF — Prognose als Spanne je Platzkategorie und Heimspiel
// -----------------------------------------------------------------------------
// Der Verkauf eines eigenen Heimspiels schwankt je Spiel fest (Zufall aus dem
// Schlüssel „Datum|Gegner“, gleiche Verteilung wie zuvor: gemeinsam ±5 %, je
// Kategorie ±4 %). Die Prognose ist eine Spanne um den wahren Verkauf, deren Lage
// ebenfalls fest aus dem Schlüssel folgt:
//   • Breite  = Grundunschärfe der Kategorie × (1 − Mitarbeiter) × Unsicherheit
//               (Derby, Pokal/Europapokal, Wetterbericht noch offen, wenig Erfahrung).
//   • Lage    = gleichverteilt: der Ist-Wert liegt mal am unteren, mal am oberen
//               Ende, mal dazwischen – nie systematisch in der Mitte.
//   • Ausreißer: in rund 10 % der Fälle liegt der Ist-Wert knapp außerhalb.
// Ändert sich bis zum Spiel etwas (Preise, Form, Zuspruch), wandert die Spanne mit.
// Am Spieltag wird die Spanne mit dem Verkauf gespeichert (Prognose gegen Ist).
// Verkauf: engine/seating.ts `ticketedSale`; Anzeige: views/verein/TicketsView.tsx.
// =============================================================================
import { SEAT_CAT } from '../data/seatingCatalog';
import type { SeatCat, SeatNums } from '../types';

export type CatWindows = Partial<Record<SeatCat, [number, number]>>;

/** Anteil der Prognosen, deren Ist-Wert außerhalb der Spanne liegt. */
export const OUTLIER_SHARE = 0.1;

export const ticketKey = (date: string, awayId: string) => `${date}|${awayId}`;

function fnv(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Gleichverteilte Zahl 0–1 aus einem Text. */
export const hashU = (s: string) => mulberry(fnv(s))();
/** Zufallsfolge des Kartenverkaufs eines Spiels (fest je Schlüssel). */
export const saleRng = (key: string) => mulberry(fnv(`tk:${key}`));

export interface UncertaintyCtx { derby?: boolean; euro?: boolean; cup?: boolean; weather?: string; daysAhead: number; seen: number }

/** Unsicherheit der Prognose (Faktor auf die Breite) mit Gründen für die Anzeige. */
export function ticketUncertainty(c: UncertaintyCtx): { f: number; reasons: string[] } {
  let f = 1;
  const reasons: string[] = [];
  if (c.derby) { f *= 1.2; reasons.push('Derby'); }
  if (c.euro) { f *= 1.15; reasons.push('Europapokal'); } else if (c.cup) { f *= 1.1; reasons.push('Pokalspiel'); }
  if (c.daysAhead > 5) { f *= 1.25; reasons.push('Wetterbericht noch offen'); } else if (c.weather === 'regen' || c.weather === 'schnee') { f *= 1.1; reasons.push(c.weather === 'regen' ? 'Regen' : 'Schnee'); }
  if (c.seen < 3) { f *= 1.2; reasons.push('kaum Erfahrungswerte'); }
  return { f, reasons };
}

/** Spannenbreite (Anteil des Verkaufs) einer Kategorie. */
export const windowWidth = (k: SeatCat, staff: number, unc: number) => 2 * SEAT_CAT[k].fog * 0.55 * (1 - Math.min(0.55, staff)) * unc;

/**
 * Prognose-Spannen je Kategorie um den wahren Verkauf `sold`. `caps` = Kontingente des Spiels
 * (vor Sperren), `restriction` = zugelassener Anteil. Ausverkauf deckelt die Spanne oben.
 */
export function forecastWindows(sold: SeatNums, caps: SeatNums, key: string, o: { staff: number; unc: number; restriction?: number }): CatWindows {
  const out: CatWindows = {};
  for (const k of Object.keys(sold) as SeatCat[]) {
    const cap = Math.floor((caps[k] ?? 0) * (o.restriction ?? 1));
    if (cap <= 0) continue;
    const T = sold[k] ?? 0;
    const loge = k === 'loge';
    const W = Math.max(loge ? 2 : 100, Math.max(T, cap * 0.15) * windowWidth(k, o.staff, o.unc));
    let u = hashU(`${key}|${k}|u`);
    if (hashU(`${key}|${k}|o`) < OUTLIER_SHARE) {
      const d = 0.04 + 0.3 * hashU(`${key}|${k}|d`);
      u = hashU(`${key}|${k}|s`) < 0.5 ? -d : 1 + d;
    }
    let lo = T - u * W, hi = lo + W;
    const step = loge ? 1 : W > 2500 ? 100 : W > 600 ? 50 : 10;
    lo = Math.max(0, Math.round(lo / step) * step);
    hi = Math.round(hi / step) * step;
    if (hi > cap) hi = cap;
    if (lo > hi) lo = hi;
    out[k] = [lo, hi];
  }
  return out;
}

/** Lage des Ist-Werts in der Spanne (0 = unteres, 1 = oberes Ende; außerhalb < 0 bzw. > 1). */
export function positionIn(w: [number, number], truth: number): number {
  const [lo, hi] = w;
  return hi > lo ? (truth - lo) / (hi - lo) : truth === lo ? 0.5 : truth < lo ? -1 : 2;
}

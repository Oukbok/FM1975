// =============================================================================
// Jugendsystem: gemeinsame Helfer (deterministischer Zufall, Jugend-Marktwert)
// für engine/youth.ts und engine/youthWeekly.ts.
// =============================================================================
import { Player } from '../types';
import { baseMarketValue as proMarketValue } from './clubEconomy';

/** Jugendspieler ohne Profivertrag: halber Profi-Marktwert (Ausbildungsentschädigung statt Ablöse). */
export const baseMarketValue = (p: Player) => Math.round(proMarketValue(p) * 0.5 / 5000) * 5000;

// -----------------------------------------------------------------------------
// Deterministischer RNG (mulberry32) — aus einem String-Seed abgeleitet.
// -----------------------------------------------------------------------------
export function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministischer Pseudo-Zufall 0..1 aus einem String (ohne Zustand). */
export function pseudo(str: string): number {
  return mulberry32(hashSeed(str))();
}

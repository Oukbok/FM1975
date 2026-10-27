// =============================================================================
// VERBORGENE JUWELEN — seltene Talente, deren wahres Können niemand ahnt
// -----------------------------------------------------------------------------
// Ein Juwel wirkt lange unauffällig (Scouts sehen nur das „normale“ Potenzial).
// Mit 18 oder 19 Jahren platzt der Knoten: Das Potenzial steigt um 7–13 Punkte
// und die Entwicklung bekommt einen Schub. Wer früh auf so einen Spieler setzt,
// wird belohnt – sicher erkennen kann ihn aber niemand.
// =============================================================================
import { Player, potentialToStars, starsToPotential, clampStars } from '../types';

/** Chance je neuem Talent (Jugendjahrgang). */
export const GEM_CHANCE_YOUTH = 0.025;
/** Chance je jungem Nachrücker im Profibereich (≤ 20 Jahre). */
export const GEM_CHANCE_YOUNG_PRO = 0.012;

export function maybeMakeGem(p: Player, chance: number, rng: () => number = Math.random): boolean {
  if (p.development.gem || rng() >= chance) return false;
  p.development.gem = { boostAge: rng() < 0.55 ? 18 : 19, boost: 7 + Math.floor(rng() * 7) };
  return true;
}

/** Jugendspieler: Schub bei Erreichen des Alters (Aufruf nach dem jährlichen Altern). */
export function applyYouthGem(p: Player): boolean {
  const g = p.development.gem;
  if (!g || g.done || p.age < g.boostAge) return false;
  g.done = true;
  const pot = starsToPotential(p.potentialStars) + g.boost;
  p.potentialStars = clampStars(potentialToStars(pot));
  p.development.potentialAbility = Math.max(p.development.potentialAbility ?? 0, pot);
  return true;
}

/** Profis: Schub zur Großen Saison-Bewertung (Aufruf vor der Auszahlung). */
export function applyProGem(p: Player): boolean {
  const g = p.development.gem;
  if (!g || g.done || p.isYouth || p.age < g.boostAge) return false;
  g.done = true;
  const d = p.development;
  d.basePotential = (d.basePotential ?? p.overall) + g.boost;
  d.devPoints = (d.devPoints ?? 0) + g.boost * 0.45;
  return true;
}

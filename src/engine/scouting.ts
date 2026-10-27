// =============================================================================
// Scouting: Sterne sind eine EINSCHÄTZUNG des verdeckten Potenzials mit Spanne.
// Genauigkeit wächst mit Scout-Qualität und Vertrautheit (eigener Kader).
// Die Einschätzung kann danebenliegen (fester Schätzfehler je Spieler).
// =============================================================================
import { Player, potentialToStars, clampStars } from '../types';

const q = (x: number) => Math.round(x * 4) / 4;

/** Wahres Potenzial ohne Import-Zyklus mit development.ts. */
function truePot(p: Player): number {
  const d = p.development;
  return Math.max(30, Math.min(99, (d.basePotential ?? d.potentialAbility ?? p.overall) + (d.unfold ?? 0)));
}

/**
 * Neue Sterne-Spanne berechnen.
 * @param quality 0 (kein Scout) … 1 (Weltklasse-Scouting)
 * @param own eigener Spieler (Vertrautheit → schmalere Spanne)
 */
export function updateScoutEstimate(p: Player, quality: number, own: boolean): void {
  const trueStars = potentialToStars(truePot(p));
  const bias = (p.development.scoutBias ?? 0) * (1 - quality * 0.7);
  const center = trueStars + bias;
  // Halbe Spannweite: 1,0 Sterne (blind) … 0,25 (eigener Spieler, Top-Scout); ältere Spieler sind leichter einzuschätzen.
  let half = 1.0 - quality * 0.55 - (own ? 0.2 : 0);
  if (p.age >= 27) half -= 0.25;
  half = Math.max(0.25, half);
  p.scoutedPotentialMin = clampStars(q(center - half));
  p.scoutedPotentialMax = clampStars(q(center + half));
  // `potentialStars` bleibt der WAHRE Wert (verdeckt); die UI zeigt die Spanne.
  p.potentialStars = clampStars(trueStars);
}

/** Anzeige-Spanne (fehlt sie, wird eine grobe Spanne erzeugt). */
export function scoutRange(p: Player): [number, number] {
  if (p.scoutedPotentialMin != null && p.scoutedPotentialMax != null) return [p.scoutedPotentialMin, p.scoutedPotentialMax];
  const s = p.potentialStars;
  return [clampStars(q(s - 0.75)), clampStars(q(s + 0.75))];
}

/** Text wie „3,5–4,5 ★“. */
export function scoutRangeText(p: Player): string {
  const [a, b] = scoutRange(p);
  const f = (x: number) => x.toLocaleString('de-DE', { minimumFractionDigits: x % 1 ? 1 : 0, maximumFractionDigits: 2 });
  return a === b ? `${f(a)} ★` : `${f(a)}–${f(b)} ★`;
}

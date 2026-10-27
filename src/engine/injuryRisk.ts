// =============================================================================
// Verletzungsrisiko-Faktor je Spieler (Stab, Trainingsphilosophie). Wird vom
// Spielablauf gesetzt (game/day.ts) und von der Match-Engine gelesen, damit die
// Engine selbst nichts über Mitarbeiter oder Philosophie wissen muss.
// =============================================================================
import type { Player } from '../types';

let factorFor: (p: Player) => number = () => 1;

export function setInjuryRiskHook(fn: (p: Player) => number): void { factorFor = fn; }

export function injuryRiskFactor(p: Player): number {
  const f = factorFor(p);
  return Number.isFinite(f) ? Math.max(0.3, Math.min(2, f)) : 1;
}

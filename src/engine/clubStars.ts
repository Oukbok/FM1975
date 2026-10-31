// =============================================================================
// STARS ERZEUGTER KADER — wer schon Weltklasse ist, wenn der Verein ins Spiel kommt
// -----------------------------------------------------------------------------
// Neu erzeugte Kader (Spielstart 1975, Vereine aus der Hintergrund-Simulation,
// die in deine Liga kommen) sind auf 84 gedeckelt. Ein Spitzenverein hatte aber
// schon vorher seine Leistungsträger – sonst gäbe es 1975 oder nach einem
// Abstieg jahrelang keinen einzigen Weltklassespieler. Deshalb erhalten starke
// Kader (Schnitt ≥ 71) im Mittel (Schnitt − 71) × 0,4 Stars (höchstens 3),
// stets etablierte Spieler zwischen 24 und 30 mit Stärke 85–91 (meist 85–87).
// Bei einem Schnitt von 72,5 (Liga-Ziel) sind das 18 × ~0,6 ≈ 11 Spieler ≥ 85.
// =============================================================================
import { clampStars, potentialToStars, type Player } from '../types';
import { applyOverallChange } from './development';

export function seedClubStars(ids: string[], players: Record<string, Player>, rng: () => number): number {
  const squad = ids.map((id) => players[id]).filter((p): p is Player => !!p);
  if (!squad.length) return 0;
  const avg = squad.reduce((s, p) => s + p.overall, 0) / squad.length;
  const expected = Math.max(0, Math.min(3, (avg - 71) * 0.4));
  let n = Math.floor(expected) + (rng() < expected - Math.floor(expected) ? 1 : 0);
  const cands = squad.filter((p) => p.age >= 24 && p.age <= 30 && p.overall < 85).sort((a, b) => b.overall - a.overall);
  let made = 0;
  for (const p of cands) {
    if (n-- <= 0) break;
    const target = Math.min(91, 85 + Math.floor(-Math.log(Math.max(1e-6, 1 - rng())) * 1.4));
    applyOverallChange(p, target - p.overall);
    const d = p.development;
    // Etabliert: kaum noch Luft nach oben (Höhepunkt erreicht oder kurz davor).
    d.basePotential = p.overall + Math.floor(rng() * 3);
    d.potentialAbility = d.basePotential;
    p.potentialStars = clampStars(potentialToStars(d.basePotential));
    made++;
  }
  return made;
}

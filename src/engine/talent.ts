// =============================================================================
// TALENT — organische Spielerkurven (ersetzt das frühere Legenden-System)
// -----------------------------------------------------------------------------
// Jeder Spieler entsteht nach denselben Regeln. Drei verdeckte Größen formen
// seine Kurve (Recherche: docs/recherche/spielerkurven.md):
//  • Potenzial (OVR-Skala): meist 60–82, selten 85+, ganz selten 93+ – ein
//    „Jahrhunderttalent“ entsteht nur aus dem äußersten Rand der Verteilung.
//  • Frühreife (−1 … +1): frühreife Spieler wachsen bis 20 schneller und sind
//    früher profireif; Spätentwickler holen zwischen 23 und 27 auf. Große
//    Talente sind im Schnitt frühreifer (Messi, Ronaldo, Mbappé).
//  • Langlebigkeit (−1 … +1): verschiebt den Abbau um bis zu ±1,5 Jahre.
// Frühreife und Langlebigkeit werden aus der Spieler-ID abgeleitet – alte
// Spielstände brauchen dafür keine Umstellung.
// =============================================================================
import type { Player } from '../types';

function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
/** Dreiecksverteilung −1 … +1 aus einem Hash (mittig gehäuft). */
function tri(s: string): number {
  const h = hash(s);
  return ((h & 0xffff) / 0xffff + ((h >>> 16) & 0xffff) / 0xffff) - 1;
}

/** Wahres Höchstpotenzial ohne Entfaltung (Profis: basePotential, Jugend: potentialAbility). */
function rawPotential(p: Player): number {
  const d = p.development;
  return (p.isYouth ? d.potentialAbility : d.basePotential ?? d.potentialAbility) ?? p.overall;
}

/** Frühreife −1 (Spätentwickler) … +1 (frühreif). Große Talente zeigen sich eher früh. */
export function maturity(p: Player): number {
  return clamp(tri(p.id + '|reife') * 0.8 + Math.max(0, rawPotential(p) - 86) * 0.06, -1, 1);
}

/** Langlebigkeit −1 … +1 (verschiebt den Abbau). */
export function longevity(p: Player): number {
  return tri(p.id + '|dauer');
}

/** Wachstumsfaktor der Profi-Entwicklung nach Alter und Frühreife. */
export function maturityGrowth(p: Player): number {
  const m = maturity(p);
  if (p.age <= 20) return 1 + 0.4 * m;
  if (p.age <= 22) return 1 + 0.15 * m;
  if (p.age <= 27) return 1 - 0.3 * m; // Spätentwickler holen auf, Frühreife sind fast fertig
  return 1;
}

/** Verschiebung des Abbaus in Jahren (−1,5 … +1,5). */
export function declineShiftOf(p: Player): number {
  return longevity(p) * 1.5;
}

/**
 * Altersgerechter Reifegrad: Anteil des Potenzials, den ein Profi in diesem
 * Alter typischerweise erreicht (Kurven in docs/recherche/spielerkurven.md:
 * Normalprofi 66/73 mit 21, Kimmich 80/88, Messi 89/97 mit 20). Frühreife
 * verschiebt um bis zu ±7 %. Darüber wächst ein Spieler nur noch sehr langsam.
 */
const RIPENESS: Record<number, number> = { 16: 0.66, 17: 0.72, 18: 0.77, 19: 0.82, 20: 0.86, 21: 0.9, 22: 0.93, 23: 0.96, 24: 0.98 };
export function ageCeiling(p: Player, truePot: number): number {
  const f = p.age >= 25 ? 1 : RIPENESS[Math.max(16, p.age)] ?? 1;
  return truePot * Math.min(1, f + 0.07 * maturity(p));
}

/** Zuschlag zur altersgerechten Obergrenze in der Jugend (frühreif bis +7 %). */
export function youthMaturityCap(p: Player): number {
  return 0.07 * maturity(p);
}

/**
 * Seltener Ausreißer-Schwanz des Potenzials: ab 85 fällt die Häufigkeit je
 * Punkt um rund 27 % (Exponential mit Mittel 3,2). Von 100 solchen Talenten
 * haben ~21 ein Potenzial ≥ 90, ~8 ≥ 93, ~2 ≥ 96.
 */
export function exceptionalPotential(rand: () => number): number {
  const tail = -Math.log(Math.max(1e-6, 1 - rand())) * 3.2;
  return Math.round(clamp(85 + tail, 85, 99));
}

/**
 * Potenzial eines Akademie-Talents (OVR-Skala, fein statt Sterne-Raster).
 * `lift` = Akademie-Qualität (0 … 0,2): mehr hohe und sehr hohe Talente.
 */
export function youthTalentPotential(rand: () => number, lift: number): number {
  const roll = rand();
  if (roll < 0.012 + lift * 0.08) return exceptionalPotential(rand); // Ausnahmetalent
  if (roll < 0.10 + lift * 0.5) return Math.round(80 + rand() * 6);  // hohes Talent 80–86
  if (roll < 0.48 + lift) return Math.round(73 + rand() * 7);        // solides Talent 73–79
  return Math.round(64 + rand() * 9);                                // Durchschnitt 64–72
}

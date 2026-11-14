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
  const c = p.development?.clock;
  if (c) return clamp(c.m, -1, 1); // fest eingestellte Körperuhr (Datensatz, game/legendFactory.ts)
  return clamp(tri(p.id + '|reife') * 0.8 + Math.max(0, rawPotential(p) - 86) * 0.06, -1, 1);
}

/** Langlebigkeit −1 … +1 (verschiebt den Abbau). */
export function longevity(p: Player): number {
  const c = p.development?.clock;
  if (c) return clamp(c.l, -1, 1);
  return tri(p.id + '|dauer');
}

/**
 * Entwicklungstempo 0–100 (verdeckt): wie schnell ein Spieler im Training lernt.
 * Fehlt der Wert, entsteht er fest aus der Spieler-ID (20–80, mittig gehäuft).
 */
export function tempoOf(p: Player): number {
  const t = p.development?.tempo;
  return t != null ? clamp(t, 0, 100) : Math.round(50 + 30 * tri(p.id + '|tempo'));
}

/** Lernfaktor aus dem Entwicklungstempo: 0,8 (sehr langsam) … 1,0 (Mittel 50) … 1,2 (sehr schnell). */
export function tempoFactor(p: Player): number {
  return 0.8 + tempoOf(p) * 0.004;
}

/** Trainingsfleiß (Professionalität) in der Jugend: 0,85 … 1,15, Mittel ≈ 1. */
export function diligenceFactor(p: Player): number {
  return 0.85 + clamp(p.development?.professionalism ?? 55, 0, 100) * 0.0028;
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
 * verschiebt um bis zu ±8 %. Darüber wächst ein Spieler nur noch sehr langsam.
 */
const RIPENESS: Record<number, number> = { 16: 0.68, 17: 0.74, 18: 0.79, 19: 0.84, 20: 0.88, 21: 0.92, 22: 0.95, 23: 0.97, 24: 0.99 };
export function ageCeiling(p: Player, truePot: number): number {
  const f = p.age >= 25 ? 1 : RIPENESS[Math.max(16, p.age)] ?? 1;
  return truePot * Math.min(1, f + 0.08 * maturity(p));
}

/** Zuschlag zur altersgerechten Obergrenze in der Jugend (frühreif bis +7 %). */
export function youthMaturityCap(p: Player): number {
  return 0.07 * maturity(p);
}

/**
 * Talent-Angebot (0,5 … 1,5): das Liga-Gleichgewicht (game/leagueBalance.ts)
 * senkt die Häufigkeit hoher Potenziale neuer Spieler, wenn die 1. Liga dauerhaft
 * zu viele Spieler ≥ 85 hat (und hebt sie bei zu wenigen). Bestehende Spieler
 * bleiben unverändert.
 */
let talentSupply = 1;
export function setTalentSupply(f: number): void { talentSupply = clamp(f, 0.5, 1.5); }
export function getTalentSupply(): number { return talentSupply; }

/**
 * Seltener Ausreißer-Schwanz des Potenzials: ab 84 fällt die Häufigkeit je
 * Punkt um rund 35 % (Exponential mit Mittel 2,3), Deckel 93. Maßstab EA FC
 * (Wunsch Pascal): die Weltspitze liegt bei 90–93, die Nr. 10 der Welt bei ~89.
 * Von 100 solchen Talenten haben ~7 ein Potenzial ≥ 90, ~2 ≥ 92; mehr erreichen
 * nur die Ausnahmetalente der Fußballgeschichte (`legendPotential`).
 */
export const POT_CAP = 93;
export function exceptionalPotential(rand: () => number): number {
  const tail = -Math.log(Math.max(1e-6, 1 - rand())) * 2.3;
  return Math.round(clamp(84 + tail, 84, POT_CAP));
}

/**
 * Höchststärke junger Spieler (Wunsch Pascal, Maßstab EA FC): Selbst die größten
 * Talente lagen mit 17 bei ~81, mit 19 bei ~85–87, mit 21 bei ~90. Darüber wächst
 * ein junger Spieler nur noch zäh (`eliteBrake`), Weltspieler und Ausnahmetalente
 * der Geschichte werden höchstens so stark erzeugt.
 */
const YOUNG_TOP: Record<number, number> = { 16: 78, 17: 81, 18: 84, 19: 86, 20: 88, 21: 90, 22: 91 };
export function youngTop(age: number): number {
  return age >= 23 ? 99 : YOUNG_TOP[Math.max(16, age)];
}

/**
 * Potenzial eines Ausnahmetalents der Fußballgeschichte (data/legends, Skala 80–99)
 * auf die Spielskala: oberhalb von 88 zählt nur 60 % – aus 99 wird 95, aus 95 wird 92,
 * aus 90 wird 89 (EA-FC-Höchstwerte der Besten ihrer Zeit lagen bei 93–94).
 */
export function legendPotential(pot: number): number {
  return pot <= 88 ? pot : Math.round(88 + (pot - 88) * 0.6);
}

/**
 * Potenzial eines Akademie-Talents (OVR-Skala, fein statt Sterne-Raster).
 * `lift` = Akademie-Qualität (0 … 0,2): mehr hohe und sehr hohe Talente.
 */
export function youthTalentPotential(rand: () => number, lift: number): number {
  const roll = rand();
  const exc = (0.012 + lift * 0.04) * talentSupply;
  if (roll < exc) return exceptionalPotential(rand);                       // Ausnahmetalent
  if (roll < exc + (0.078 + lift * 0.36) * talentSupply) return Math.round(80 + rand() * 5); // hohes Talent 80–85 (85 selten)
  if (roll < 0.48 + lift) return Math.round(73 + rand() * 7);        // solides Talent 73–79
  return Math.round(64 + rand() * 9);                                // Durchschnitt 64–72
}

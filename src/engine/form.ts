// =============================================================================
// FOOTBALL MANAGER 1980 — Form- & Fitness-System
// =============================================================================
// Form (0–100): kurzfristige Verfassung. Steigt nach guten Leistungen/Ergebnissen,
//   sinkt nach schlechten. Wird nach jedem Spiel aktualisiert und driftet leicht
//   zur Mitte (50) zurück, damit Ausschläge nicht dauerhaft bleiben.
// Fitness (0–100): Frische. Sinkt durch Spiele (Einsatzminuten) und hartes
//   Training, regeneriert an Ruhe-/leichten Tagen (siehe engine/training.ts).
// =============================================================================
import { Club, Player } from '../types';

/** Begrenzt einen Wert auf [0, 100]. */
function clamp100(x: number): number {
  return Math.max(0, Math.min(100, x));
}

/** Ergebnis eines Vereins aus dessen eigener Sicht. */
export type SideResult = 'W' | 'D' | 'L';

/**
 * Ermittelt die (angenommene) Startelf eines Vereins: die 11 einsatzfähigen
 * Spieler mit der höchsten Gesamtstärke. Dient als Näherung, welche Spieler
 * Einsatzminuten (und damit Form-/Fitness-Effekte) bekommen.
 */
export function selectStarters(club: Club, players: Record<string, Player>): Player[] {
  const available = club.playerIds
    .map((id) => players[id])
    .filter((p) => p && p.availability === 'available');
  available.sort((a, b) => b.overall - a.overall);
  return available.slice(0, 11);
}

/**
 * Aktualisiert Form eines einzelnen Spielers anhand einer Einzelnote/Leistung.
 * @param rating Leistung 0–10 (6+ = gut). Ohne Note: neutrale Drift.
 */
export function updatePlayerForm(player: Player, resultDelta: number, rating: number): void {
  // Leistungsanteil: Note 6 ist neutral, jede Note darüber/darunter zählt.
  const perf = (rating - 6) * 2.2;
  const noise = (Math.random() - 0.5) * 3;
  let next = player.form + resultDelta + perf + noise;
  // Sanfte Rückkehr zur Mitte (Formen sind flüchtig).
  next += (50 - player.form) * 0.05;
  player.form = clamp100(next);
}

/** Reduziert Fitness eines Spielers nach Einsatzminuten (skaliert mit Ausdauer). */
export function applyMatchFatigue(player: Player, minutes: number): void {
  const staminaFactor = 1 - (player.attributes.stamina - 50) / 200; // 0.75–1.25
  const loss = (minutes / 90) * (14 + Math.random() * 8) * staminaFactor;
  player.attributes.fitness = clamp100(player.attributes.fitness - loss);
}

/**
 * Reduziert die Frische (aktuell verfügbare Kraft) nach einem Spiel STARK.
 * Ein voller Einsatz kostet ~25–40 Punkte, leicht gedämpft durch hohe Ausdauer.
 * Skaliert mit den Einsatzminuten (Einwechslungen kosten anteilig weniger).
 */
export function applyMatchFreshnessDrain(player: Player, minutes: number): void {
  if (typeof player.frische !== 'number') player.frische = 100;
  const staminaFactor = 1 - (player.attributes.stamina - 50) / 250; // ~0.8–1.2
  const drain = (minutes / 90) * (25 + Math.random() * 15) * staminaFactor; // ~25–40 bei 90 Min.
  player.frische = clamp100(player.frische - drain);
}

/**
 * Tägliche Frische-Erholung eines Spielers (+8 bis +15/Tag, gedeckelt bei 100).
 * Jüngere und ausdauerndere Spieler regenerieren etwas schneller, sodass ein
 * Spieler nach einem harten Spiel mehrere Tage bis zur vollen Frische braucht.
 */
export function recoverFreshness(player: Player): void {
  if (typeof player.frische !== 'number') { player.frische = 100; return; }
  if (player.frische >= 100) { player.frische = 100; return; }
  // Ausdauer-Bonus: 50→0, 99→~+2.5. Alters-Bonus: ≤23 +2, ≥32 −1.5.
  const staminaBonus = ((player.attributes.stamina - 50) / 50) * 2.5;
  const ageBonus = player.age <= 23 ? 2 : player.age >= 32 ? -1.5 : 0;
  const rec = 9 + Math.max(-2, Math.min(6, staminaBonus + ageBonus));
  player.frische = clamp100(player.frische + rec);
}

/**
 * Wendet die Effekte EINES Spiels auf einen kompletten Kader an.
 * - Startelf: Einsatzminuten (~90), Fitnessverlust, Form nach Note & Ergebnis.
 * - Übrige einsatzfähige Spieler: leichte Form-Drift zur Mitte (kein Einsatz).
 *
 * @param side Ergebnis aus Sicht dieses Vereins.
 */
export function applyMatchEffects(
  club: Club,
  players: Record<string, Player>,
  side: SideResult,
): void {
  const resultDelta = side === 'W' ? 5 : side === 'D' ? 1 : -5;
  const starters = selectStarters(club, players);
  const starterIds = new Set(starters.map((p) => p.id));

  for (const p of starters) {
    // Individuelle Note 0–10: um 6 herum, beeinflusst von Overall & Ergebnis.
    const base = 5.5 + (side === 'W' ? 0.8 : side === 'L' ? -0.8 : 0);
    const rating = Math.max(1, Math.min(10, base + (Math.random() - 0.45) * 3));
    updatePlayerForm(p, resultDelta, rating);
    applyMatchFatigue(p, 90);
    applyMatchFreshnessDrain(p, 90);
  }

  // Nicht eingesetzte, einsatzfähige Spieler: nur leichte Drift Richtung 50.
  // Ohne Einsatz kaum Frischeverlust (leichte Trainingsbelastung: -2).
  for (const id of club.playerIds) {
    const p = players[id];
    if (!p || starterIds.has(p.id)) continue;
    if (p.availability !== 'available') continue;
    p.form = clamp100(p.form + (50 - p.form) * 0.08 + (Math.random() - 0.5) * 1.5);
    if (typeof p.frische !== 'number') p.frische = 100;
    p.frische = clamp100(p.frische - 2);
  }
}

/**
 * Aktualisiert Form nach einer Trainingseinheit (kleiner Effekt).
 * Gutes, fokussiertes Training hebt die Form minimal; sehr hohe Belastung bei
 * niedriger Fitness senkt sie.
 */
export function applyTrainingForm(player: Player, intensity: number): void {
  const fit = player.attributes.fitness;
  let delta = 0.6; // Grundnutzen einer Einheit
  if (intensity > 70 && fit < 55) delta -= 2.5; // Überlastung schadet der Form
  player.form = clamp100(player.form + delta + (Math.random() - 0.5));
}

/** Kategorisiert einen Formwert für die UI (Label, Farbe, Trend-Pfeil). */
export function formIndicator(form: number): { label: string; color: string; arrow: string } {
  if (form >= 75) return { label: 'Bestform', color: 'var(--green)', arrow: '▲▲' };
  if (form >= 60) return { label: 'gut', color: 'var(--green)', arrow: '▲' };
  if (form >= 45) return { label: 'normal', color: 'var(--yellow)', arrow: '▬' };
  if (form >= 30) return { label: 'schwach', color: 'var(--orange)', arrow: '▼' };
  return { label: 'Formkrise', color: 'var(--red)', arrow: '▼▼' };
}

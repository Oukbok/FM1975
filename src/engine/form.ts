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
  const perf = (rating - 6) * 2.4;
  const noise = (Math.random() - 0.5) * 4;
  let next = player.form + resultDelta + perf + noise;
  // Rückkehr zur Mitte (Formen sind flüchtig): eine Siegesserie trägt bis etwa 75–85,
  // nicht dauerhaft an die 100 – sonst wäre beim Tabellenführer jeder in „Topform“.
  next += (50 - player.form) * 0.15;
  player.form = clamp100(next);
}

/** Reduziert Fitness eines Spielers nach Einsatzminuten (skaliert mit Ausdauer). */
export function applyMatchFatigue(player: Player, minutes: number): void {
  const staminaFactor = 1 - (player.attributes.stamina - 50) / 200; // 0.75–1.25
  const loss = (minutes / 90) * (14 + Math.random() * 8) * staminaFactor;
  player.attributes.fitness = clamp100(player.attributes.fitness - loss);
}

// -----------------------------------------------------------------------------
// Frische nach dem Spiel aus der tatsächlichen Belastung (Wunsch Pascal, Nov. 2026)
// -----------------------------------------------------------------------------
/**
 * Belastung je Spieler aus der Match-Engine (`match/finish.ts` merkt Minuten und Energieverlust),
 * verbraucht vom folgenden `applyMatchEffects` desselben Vereins. So verliert Frische, wer
 * wirklich gespielt hat – Einwechselspieler und früh Ausgewechselte weniger, Torhüter deutlich weniger.
 */
let matchLoads = new WeakMap<Player, { mins: number; drop: number }>();
export function noteMatchLoad(p: Player, mins: number, drop: number): void {
  matchLoads.set(p, { mins, drop: Math.max(0, drop) });
}
/** Ausgangszustand (game/resetModuleState.ts). */
export function resetMatchLoads(): void { matchLoads = new WeakMap(); }

/** Frischeverlust aus Minuten und Energieverlust im Spiel: 12 je 90 Min. + 0,5 × Energieverlust (Feld voll ≈ 33–40, Torwart ≈ 20). */
export const FRESH_PER_90 = 12;
export const FRESH_PER_ENERGY = 0.5;
export function freshnessCostOf(mins: number, drop: number): number {
  return Math.min(45, (mins / 90) * FRESH_PER_90 + drop * FRESH_PER_ENERGY);
}

/**
 * Reduziert die Frische (aktuell verfügbare Kraft) nach einem Spiel STARK (Rückfall ohne
 * Daten der Match-Engine, z. B. Hintergrundspiele): ~25–40 Punkte, gedämpft durch hohe Ausdauer.
 * Skaliert mit den Einsatzminuten (Einwechslungen kosten anteilig weniger).
 */
export function applyMatchFreshnessDrain(player: Player, minutes: number, effortFactor = 1): void {
  if (typeof player.frische !== 'number') player.frische = 100;
  const staminaFactor = 1 - (player.attributes.stamina - 50) / 250; // ~0.8–1.2
  const drain = (minutes / 90) * (25 + Math.random() * 15) * staminaFactor * effortFactor; // ~25–40 bei 90 Min.
  player.frische = clamp100(player.frische - drain);
}

// -----------------------------------------------------------------------------
// Tägliche Erholung der Frische (Wunsch Pascal, Nov. 2026): je niedriger, desto mehr kommt
// pro Tag zurück, die letzten Punkte kommen langsamer; abhängig vom Training des Tages.
// -----------------------------------------------------------------------------
/** Anteil der Lücke zu 100, der an einem normalen Tag zurückkommt (50 → +20, 80 → +8, 95 → +2). */
export const RECOVERY_RATE = 0.4;
/** Mindestens so viel je Tag, damit die letzten Punkte nicht ewig dauern. */
export const RECOVERY_MIN = 1;

/**
 * Trainingsfaktor aus der Tagesbelastung (`dayLoad` in engine/weeklyTraining.ts; ohne Angabe = 1,
 * z. B. KI-Vereine und Spieltage): Regeneration (−4) ×1,25, frei (0) ×1,15, normal (6–9) ≈ ×1,
 * hart (12) ×0,85, sehr hart (16+) ×0,75 und weniger.
 */
export function trainingRecoveryFactor(load: number | undefined): number {
  if (load == null) return 1;
  return Math.max(0.6, Math.min(1.3, 1.15 - 0.025 * load));
}
/** Sehr hartes Training kostet zusätzlich Frische: je Belastungspunkt über 10 −0,4 (16 → −2,4). */
export const trainingFreshCost = (load: number | undefined): number => (load == null ? 0 : Math.max(0, load - 10) * 0.4);

/** Ausdauer/Alter wie bisher: Ausdauer 50→0, 99→+2,5; ≤23 +2, ≥32 −1,5 → als Faktor 0,87–1,30. */
export function personalRecoveryFactor(player: Player): number {
  const staminaBonus = ((player.attributes.stamina - 50) / 50) * 2.5;
  const ageBonus = player.age <= 23 ? 2 : player.age >= 32 ? -1.5 : 0;
  return 1 + Math.max(-2, Math.min(4.5, staminaBonus + ageBonus)) / 15;
}

/** Erholung eines Tages bei Frische `fr` (ohne Deckel/Abzug): Lücke × Rate × Training × Person, mind. 1. */
export function freshnessGain(fr: number, trainF = 1, personF = 1): number {
  const gap = Math.max(0, 100 - fr);
  return Math.min(gap, Math.max(RECOVERY_MIN, gap * RECOVERY_RATE * trainF * personF));
}

/**
 * Tägliche Frische-Erholung eines Spielers. `load` = Trainingsbelastung des Tages (eigener Verein
 * über den Wochenplan), fehlt sie, gilt ein normaler Tag.
 */
export function recoverFreshness(player: Player, load?: number): void {
  if (typeof player.frische !== 'number') { player.frische = 100; return; }
  const fr = clamp100(player.frische);
  const gain = fr >= 100 ? 0 : freshnessGain(fr, trainingRecoveryFactor(load), personalRecoveryFactor(player));
  player.frische = clamp100(fr + gain - trainingFreshCost(load));
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
  const resultDelta = side === 'W' ? 3 : side === 'D' ? 0 : -3;
  const starters = selectStarters(club, players);
  const starterIds = new Set(starters.map((p) => p.id));
  // Einsatz-Regler der Taktik: volle Kraft kostet mehr Frische, schonendes Spiel weniger.
  const effortF = 1 + (((club.tactics?.effort ?? 50) - 50) / 50) * 0.15;

  // Hat die Match-Engine die Belastung gemerkt, zählt sie (wer wie lange und wie müde gespielt hat).
  const measured = club.playerIds.some((id) => players[id] && matchLoads.has(players[id]));

  for (const p of starters) {
    // Individuelle Note 0–10: um 6 herum, beeinflusst von Overall & Ergebnis.
    const base = 5.5 + (side === 'W' ? 0.8 : side === 'L' ? -0.8 : 0);
    const rating = Math.max(1, Math.min(10, base + (Math.random() - 0.45) * 3));
    updatePlayerForm(p, resultDelta, rating);
    applyMatchFatigue(p, 90);
    if (!measured) applyMatchFreshnessDrain(p, 90, effortF);
  }

  const played = new Set<string>();
  if (measured) {
    for (const id of club.playerIds) {
      const p = players[id];
      const ld = p && matchLoads.get(p);
      if (!p || !ld) continue;
      matchLoads.delete(p);
      played.add(id);
      if (typeof p.frische !== 'number') p.frische = 100;
      p.frische = clamp100(p.frische - freshnessCostOf(ld.mins, ld.drop) * (0.92 + Math.random() * 0.16));
    }
  }

  // Nicht eingesetzte, einsatzfähige Spieler: nur leichte Drift Richtung 50.
  // Ohne Einsatz kaum Frischeverlust (leichte Trainingsbelastung: -2).
  for (const id of club.playerIds) {
    const p = players[id];
    if (!p || p.availability !== 'available') continue;
    if (!starterIds.has(p.id)) p.form = clamp100(p.form + (50 - p.form) * 0.08 + (Math.random() - 0.5) * 1.5);
    if (measured ? played.has(p.id) : starterIds.has(p.id)) continue;
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
  if (form >= 60) return { label: 'gut', color: 'var(--text)', arrow: '▲' };
  if (form >= 45) return { label: 'normal', color: 'var(--text-3)', arrow: '▬' };
  if (form >= 30) return { label: 'schwach', color: 'var(--orange)', arrow: '▼' };
  return { label: 'Formkrise', color: 'var(--red)', arrow: '▼▼' };
}

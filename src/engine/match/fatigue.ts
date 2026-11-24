// =============================================================================
// Leistungs- und Verletzungskurve der Energie im Spiel (Wunsch Pascal, Nov. 2026:
// „Ab welchem Wert spielen Spieler wie viel schlechter, wie steigt das Verletzungsrisiko?“).
// Eine Kurve für alles: `tiredness(E)` (0 = frisch, 1 = leer) – bis Energie 80 kein Verlust,
// darunter immer steiler. Jede Wirkung ist `1 − Höchstverlust × tiredness(E)`.
// Tabellen und Begründung: docs/research/match-energy.md, Wiki „Energie und Frische“.
// =============================================================================

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/** Linear zwischen Stützstellen [x, y] (x absteigend). */
function curve(pts: readonly (readonly [number, number])[], x: number): number {
  if (x >= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    if (x >= x1) { const [x0, y0] = pts[i - 1]; return y1 + ((x - x1) / (x0 - x1)) * (y0 - y1); }
  }
  return pts[pts.length - 1][1];
}

/** Müdigkeit je Energie: ab 80 abwärts, dazwischen linear. */
export const TIRED_POINTS = [[80, 0], [70, 0.12], [60, 0.28], [50, 0.46], [40, 0.64], [30, 0.82], [20, 1]] as const;
export const tiredness = (energy: number): number => curve(TIRED_POINTS, energy);

/**
 * Höchstverlust bei leerem Tank (Energie ≤ 20) je Wirkung. Technik leidet weniger als Laufen:
 * Duelle/Pässe/Tempo 18 %, Mannschaftsstärke 20 %, Abschluss 15 %, Torwart 10 %, Konzentration der Abwehr 9 %.
 */
export const FATIGUE_MAX = { duel: 0.18, rating: 0.2, finish: 0.15, keeper: 0.1, conc: 0.09 } as const;
export type FatigueKind = keyof typeof FATIGUE_MAX;
export const fatigueFactor = (energy: number, kind: FatigueKind): number => 1 - FATIGUE_MAX[kind] * tiredness(energy);

/**
 * KI-Wechsel (sim.ts `aiManager`): Bedarf (AI_TIRED_NEED − Energie)/10 + Spielzeit; Grund „müde“ unter
 * AI_TIRED_BELOW (wie der Co-Trainer). Vorher 78/62 bei ≈ 10 Punkte höherer Energie.
 */
export const AI_TIRED_NEED = 72;
export const AI_TIRED_BELOW = 55;

/** Verletzungsrisiko im Spiel nach aktueller Energie (Faktor auf die Grundwahrscheinlichkeit). */
export const INJ_ENERGY_POINTS = [[70, 1], [60, 1.15], [50, 1.35], [40, 1.6], [30, 1.9], [20, 2.2]] as const;
/** Verletzungsrisiko im Spiel nach der Frische vor dem Anpfiff (wer müde anreist, verletzt sich leichter). */
export const INJ_FRESH_POINTS = [[90, 1], [80, 1.1], [70, 1.2], [60, 1.35], [50, 1.5]] as const;
export const injuryEnergyFactor = (energy: number): number => curve(INJ_ENERGY_POINTS, energy);
export const injuryFreshFactor = (frische: number | undefined): number => curve(INJ_FRESH_POINTS, clamp(frische ?? 100, 0, 100));

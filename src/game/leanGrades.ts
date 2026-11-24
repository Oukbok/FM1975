// =============================================================================
// GESCHÄTZTE NOTEN FÜR WELTSPIELER (Auslandsligen ohne Spielereignisse)
// -----------------------------------------------------------------------------
// Die Auslandsligen kennen Tore, Vorlagen und Zu-null-Spiele je Spieler
// (game/worldScorers.ts `leanLines`), aber keine Noten. Damit „Die Besten der
// Saison“ je Land und der Kristallstern fair vergleichen, wird die Note aus dem
// Maßstab der voll simulierten Liga gelernt (kleinste Quadrate je Mannschaftsteil):
//   Note ≈ a + b1 · (Stärke − Ligaschnitt) + b2 · Tabellenplatz-Anteil + b3 · Beitrag
// (Beitrag: Tore + ½ Vorlagen je Spiel, Torwart/Abwehr dazu Zu-null-Quote).
// Dazu kommt eine feste Formschwankung je Spieler und Saison in der Größe der
// echten Streuung (Reststreuung des Modells) – sonst stünden die Weltspieler immer
// genau im Mittel, und die Besten der voll simulierten Liga gewännen jede Wahl
// (Fehlermeldung Pascal: beim Kristallstern nur Spieler deutscher Vereine).
// =============================================================================
import { hashStr } from '../engine/leagues';
import type { PositionGroup } from '../types';

export interface GradeSample { group: PositionGroup; avg: number; ovrDev: number; rankShare: number; contrib: number }
/** Koeffizienten je Mannschaftsteil: [a, b1, b2, b3, Reststreuung]. */
export type GradeModel = Record<PositionGroup, [number, number, number, number, number]>;

const GROUPS: PositionGroup[] = ['GK', 'DEF', 'MID', 'ATT'];
const FALLBACK: [number, number, number, number, number] = [3.25, -0.035, 0.7, -0.8, 0.32];

/** Beitrag je Spiel nach Mannschaftsteil. */
export function contribOf(group: PositionGroup, apps: number, goals: number, assists: number, clean: number): number {
  if (!apps) return 0;
  const sc = (goals + 0.5 * assists) / apps;
  const cs = clean / apps;
  return group === 'GK' ? cs : group === 'DEF' ? 0.5 * cs + sc : sc;
}

/** Lineares Gleichungssystem (Gauß mit Pivot). */
function solve(m: number[][], v: number[]): number[] | null {
  const n = v.length;
  const a = m.map((row, i) => [...row, v[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
    if (Math.abs(a[p][c]) < 1e-9) return null;
    [a[c], a[p]] = [a[p], a[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = a[r][c] / a[c][c];
      for (let k = c; k <= n; k++) a[r][k] -= f * a[c][k];
    }
  }
  return a.map((row, i) => row[n] / row[i]);
}

/** Modell aus den Spielern der voll simulierten Liga lernen. */
export function fitGrades(samples: GradeSample[]): GradeModel {
  const out = {} as GradeModel;
  for (const grp of GROUPS) {
    const s = samples.filter((x) => x.group === grp && x.avg > 0);
    if (s.length < 12) { out[grp] = [...FALLBACK]; continue; }
    const X = s.map((x) => [1, x.ovrDev, x.rankShare, x.contrib]);
    const xtx = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => X.reduce((t, r) => t + r[i] * r[j], 0) + (i === j && i > 0 ? 0.5 : 0)));
    const xty = [0, 1, 2, 3].map((i) => X.reduce((t, r, k) => t + r[i] * s[k].avg, 0));
    const b = solve(xtx, xty);
    if (!b) { out[grp] = [...FALLBACK]; continue; }
    const res = s.map((x, k) => x.avg - (b[0] + b[1] * X[k][1] + b[2] * X[k][2] + b[3] * X[k][3]));
    const sd = Math.sqrt(res.reduce((t, r) => t + r * r, 0) / Math.max(1, s.length - 4));
    out[grp] = [b[0], b[1], b[2], b[3], Math.max(0.15, Math.min(0.6, sd))];
  }
  return out;
}

/** Feste Normalverteilung aus einem Schlüssel (Box-Muller über zwei Hashes). */
function gauss(key: string): number {
  const u = ((hashStr(key + '|u') % 100000) + 0.5) / 100000;
  const v = ((hashStr(key + '|v') % 100000) + 0.5) / 100000;
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Geschätzte Note (1,0 … 5,5) eines Weltspielers. */
export function estimateGrade(m: GradeModel | undefined, x: Omit<GradeSample, 'avg'>, key: string): number {
  const [a, b1, b2, b3, sd] = m?.[x.group] ?? FALLBACK;
  const v = a + b1 * x.ovrDev + b2 * x.rankShare + b3 * x.contrib + sd * gauss(key);
  return Math.round(Math.max(1, Math.min(5.5, v)) * 100) / 100;
}

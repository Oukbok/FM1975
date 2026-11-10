// Rechenzeit je Spieltag ohne Oberfläche: `SPEED=1 node scripts/sim.mjs 50` (`FULL=eng,ita` mit weiteren Ländern Spiel für Spiel).
// Je Saison: Durchschnitt, 95. Perzentil und Maximum von processDay, Dauer des Saisonwechsels,
// Größe des Spielstands (JSON) und Spieleranzahl – um zu sehen, wie die Zeit über Jahrzehnte wächst.
import type { Game } from '../src/game/state';

let days: number[] = [];
const rows: string[] = [];
export function speedNote(ms: number): void { days.push(ms); }
export function speedSeason(g: Game, season: string, switchMs: number): void {
  const s = [...days].sort((a, b) => a - b);
  const avg = s.reduce((a, b) => a + b, 0) / Math.max(1, s.length);
  const p95 = s[Math.floor(s.length * 0.95)] ?? 0, max = s[s.length - 1] ?? 0;
  const size = JSON.stringify(g).length / 1e6;
  const line = `SPEED ${season}  Tag Ø ${avg.toFixed(1)} ms  p95 ${p95.toFixed(1)}  max ${max.toFixed(0)}  Saisonwechsel ${switchMs.toFixed(0)} ms  Spielstand ${size.toFixed(1)} MB  Spieler ${Object.keys(g.players).length}  Heap ${(process.memoryUsage().heapUsed / 1e6).toFixed(0)} MB`;
  rows.push(line); console.log(line);
  days = [];
}
export function speedSummary(): void { console.log('\n' + rows.join('\n')); }

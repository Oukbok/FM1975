// =============================================================================
// Sim-Bericht Hallenspezialisten (HALL=1 node scripts/sim.mjs 32): je Saison
// nach dem Winter, wie viele aktive Spieler (noch in game.players) einen
// Hallenruf haben, wie viele davon Hallenspezialist sind (feste Schwelle 35 zum
// Vergleich und aktuelle Regel `isHallSpecialist`) und wie hoch der Ruf der
// Ränge 10/15/20 ist. Grundlage für die Kurve in game/indoorRecords.ts.
// =============================================================================
import type { Game } from '../src/game/state';
import { hallRuf, hallSpecialistAt, indoorRecs } from '../src/game/indoorRecords';
import { seasonStartYear } from '../src/data/timeline';

interface Row { y: number; n: number; fix35: number; now: number; at: number; r10: number; r15: number; r20: number; top: number }
const rows: Row[] = [];

export function hallTrack(g: Game): void {
  const y = seasonStartYear(g.season) + 1;
  const rufs = Object.entries(indoorRecs(g)).filter(([id]) => g.players[id]).map(([, r]) => hallRuf(r)).filter((x) => x > 0).sort((a, b) => b - a);
  const at = hallSpecialistAt(g);
  const row: Row = { y, n: rufs.length, fix35: rufs.filter((x) => x >= 35).length, now: rufs.filter((x) => x >= at).length, at, r10: rufs[9] ?? 0, r15: rufs[14] ?? 0, r20: rufs[19] ?? 0, top: rufs[0] ?? 0 };
  rows.push(row);
  console.log(`   HALLE ${y}: aktiv mit Ruf ${row.n} | ab 35: ${row.fix35} | Schwelle jetzt ${at}: ${row.now} | Rang 10/15/20: ${row.r10}/${row.r15}/${row.r20} | bester ${row.top}`);
}

export function hallSummary(): void {
  const span = (a: number, b: number) => rows.filter((r) => r.y >= a && r.y <= b);
  const avg = (xs: number[]) => (xs.length ? (xs.reduce((s, x) => s + x, 0) / xs.length).toFixed(1) : '-');
  for (const [a, b, l] of [[1976, 1987, 'früh'], [1988, 2001, 'Masters'], [2002, 2004, 'spät'], [2005, 2012, 'danach']] as const) {
    const r = span(a, b);
    if (r.length) console.log(`HALLE ${l} ${a}–${b}: Spezialisten Ø ab 35 ${avg(r.map((x) => x.fix35))} (min ${Math.min(...r.map((x) => x.fix35))}, max ${Math.max(...r.map((x) => x.fix35))}) | jetzt Ø ${avg(r.map((x) => x.now))} (min ${Math.min(...r.map((x) => x.now))}, max ${Math.max(...r.map((x) => x.now))})`);
  }
}

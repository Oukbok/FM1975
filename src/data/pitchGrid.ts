// =============================================================================
// Positionsraster des Spielfelds (Aufstellung: „Fest einrasten“, freie Positionen)
// =============================================================================
// Koordinaten wie in data/formations.ts: Prozent des hochkant gezeichneten
// Felds (x 0 = links … 100 = rechts, y 8 = Angriff … 92 = eigenes Tor).
// Jeder Rasterpunkt trägt eine Position aus engine/positions.ts. Im Modus
// „Fest einrasten“ springt ein gezogener Spieler auf den nächsten freien Punkt;
// frei gesetzt heißt die Position wie der nächstgelegene Punkt.
// Der Torwart hat genau einen festen Punkt und wird nicht verschoben.
// =============================================================================
import type { Position } from '../types';
import type { Formation, FormationSlot } from './formations';

export interface GridPoint { id: string; position: Position; x: number; y: number; label: string }

const P = (id: string, position: Position, x: number, y: number, label: string): GridPoint => ({ id, position, x, y, label });

/** Feste Positionsfelder (ohne Torwart), von hinten nach vorne. */
export const PITCH_GRID: GridPoint[] = [
  P('lib', 'LIB', 50, 82, 'Libero'),
  P('avl', 'AV', 14, 71, 'Außenverteidiger links'),
  P('ivl', 'VS', 32, 72, 'Innenverteidiger links'),
  P('ivz', 'VS', 50, 73, 'Innenverteidiger zentral'),
  P('ivr', 'VS', 68, 72, 'Innenverteidiger rechts'),
  P('avr', 'AV', 86, 71, 'Außenverteidiger rechts'),
  P('wbl', 'AV', 12, 59, 'offensiver Außenverteidiger links'),
  P('dml', 'DM', 34, 60, 'Defensives Mittelfeld links'),
  P('dmz', 'DM', 50, 61, 'Defensives Mittelfeld zentral'),
  P('dmr', 'DM', 66, 60, 'Defensives Mittelfeld rechts'),
  P('wbr', 'AV', 88, 59, 'offensiver Außenverteidiger rechts'),
  P('lm', 'FL', 13, 48, 'Linkes Mittelfeld'),
  P('zml', 'ZM', 33, 49, 'Zentrales Mittelfeld links'),
  P('zmz', 'ZM', 50, 49, 'Zentrales Mittelfeld zentral'),
  P('zmr', 'ZM', 67, 49, 'Zentrales Mittelfeld rechts'),
  P('rm', 'FL', 87, 48, 'Rechtes Mittelfeld'),
  P('oml', 'OM', 34, 38, 'Offensives Mittelfeld links'),
  P('omz', 'OM', 50, 38, 'Offensives Mittelfeld zentral'),
  P('omr', 'OM', 66, 38, 'Offensives Mittelfeld rechts'),
  P('lf', 'FL', 16, 28, 'Linksaußen'),
  P('hsl', 'HS', 38, 29, 'Hängende Spitze links'),
  P('hsr', 'HS', 62, 29, 'Hängende Spitze rechts'),
  P('rf', 'FL', 84, 28, 'Rechtsaußen'),
  P('msl', 'MS', 34, 20, 'Mittelstürmer links'),
  P('msz', 'MS', 50, 19, 'Mittelstürmer zentral'),
  P('msr', 'MS', 66, 20, 'Mittelstürmer rechts'),
];

/** Bewegungsbereich für Feldspieler (kein Feldspieler steht im eigenen Tor). */
export const FIELD_BOUNDS = { xMin: 5, xMax: 95, yMin: 8, yMax: 84 };

export const clampField = (x: number, y: number) => ({
  x: Math.max(FIELD_BOUNDS.xMin, Math.min(FIELD_BOUNDS.xMax, x)),
  y: Math.max(FIELD_BOUNDS.yMin, Math.min(FIELD_BOUNDS.yMax, y)),
});

/** Abstand im Feld-Seitenverhältnis (68 × 105 m), damit „nah“ wie auf dem Rasen wirkt. */
function dist(ax: number, ay: number, bx: number, by: number): number {
  const dx = (ax - bx) * 0.68, dy = (ay - by) * 1.05;
  return Math.hypot(dx, dy);
}

/** Nächstgelegener Rasterpunkt; `taken` = besetzte Punkte (werden übersprungen). */
export function nearestGrid(x: number, y: number, taken?: Set<string>): GridPoint {
  let best = PITCH_GRID[0], bd = Infinity;
  for (const g of PITCH_GRID) {
    if (taken?.has(g.id)) continue;
    const d = dist(x, y, g.x, g.y);
    if (d < bd) { bd = d; best = g; }
  }
  return best;
}

/** Rasterpunkt, auf dem eine Koordinate genau liegt (sonst null). */
export function gridAt(x: number, y: number): GridPoint | null {
  return PITCH_GRID.find((g) => Math.abs(g.x - x) < 0.6 && Math.abs(g.y - y) < 0.6) ?? null;
}

/** Eigene Lage eines Slots (gespeichert in Tactics.slotLayout). */
export interface SlotPlacement { x: number; y: number; position: Position }

/** Formation mit eigenen Slot-Lagen (Koordinaten + abgeleitete Position). */
export function withLayout(f: Formation, layout: Record<string, SlotPlacement> | undefined): Formation {
  if (!layout || !Object.keys(layout).length) return f;
  const slots: FormationSlot[] = f.slots.map((s) => {
    const o = layout[s.id];
    return o && s.position !== 'TW' && o.position !== 'TW' ? { ...s, x: o.x, y: o.y, position: o.position } : s;
  });
  return { ...f, slots };
}

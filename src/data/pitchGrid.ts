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

/** Feste Positionsfelder (ohne Torwart), von hinten nach vorne. Dichtes Raster (Wunsch Pascal:
 *  deutlich mehr Einrastpunkte): je Linie Außen, Halbräume und Zentrum, dazu Zwischenlinien. */
export const PITCH_GRID: GridPoint[] = [
  // Tiefe Abwehr
  P('lib', 'LIB', 50, 82, 'Libero'),
  P('ivtl', 'IV', 38, 81, 'Innenverteidiger tief links'),
  P('ivtr', 'IV', 62, 81, 'Innenverteidiger tief rechts'),
  // Abwehrlinie
  P('avl', 'LV', 14, 71, 'Linker Verteidiger'),
  P('avli', 'LV', 23, 71, 'Linker Verteidiger innen'),
  P('ivl', 'IV', 32, 72, 'Innenverteidiger links'),
  P('ivhl', 'IV', 38, 72, 'Innenverteidiger halblinks'),
  P('ivz', 'IV', 50, 73, 'Innenverteidiger zentral'),
  P('ivhr', 'IV', 62, 72, 'Innenverteidiger halbrechts'),
  P('ivr', 'IV', 68, 72, 'Innenverteidiger rechts'),
  P('avri', 'RV', 77, 71, 'Rechter Verteidiger innen'),
  P('avr', 'RV', 86, 71, 'Rechter Verteidiger'),
  // Vor der Abwehr
  P('wbl2', 'LV', 13, 65, 'Linker Verteidiger aufgerückt'),
  P('dmtl', 'DM', 42, 66, 'Sechser tief links'),
  P('dmtz', 'DM', 50, 67, 'Sechser tief zentral'),
  P('dmtr', 'DM', 58, 66, 'Sechser tief rechts'),
  P('wbr2', 'RV', 87, 65, 'Rechter Verteidiger aufgerückt'),
  // Sechserraum
  P('wbl', 'LV', 12, 59, 'Linker Verteidiger offensiv'),
  P('lmd', 'LM', 23, 60, 'Linker Mittelfeldspieler defensiv'),
  P('dml', 'DM', 34, 60, 'Defensives Mittelfeld links'),
  P('dmlz', 'DM', 41, 60.5, 'Defensives Mittelfeld halblinks'),
  P('dmz', 'DM', 50, 61, 'Defensives Mittelfeld zentral'),
  P('dmrz', 'DM', 59, 60.5, 'Defensives Mittelfeld halbrechts'),
  P('dmr', 'DM', 66, 60, 'Defensives Mittelfeld rechts'),
  P('rmd', 'RM', 77, 60, 'Rechter Mittelfeldspieler defensiv'),
  P('wbr', 'RV', 88, 59, 'Rechter Verteidiger offensiv'),
  // Zwischenlinie
  P('lm2', 'LM', 13, 54, 'Linker Mittelfeldspieler tief'),
  P('zm54l', 'ZM', 40, 54.5, 'Achter links'),
  P('zm54z', 'ZM', 50, 55, 'Achter zentral'),
  P('zm54r', 'ZM', 60, 54.5, 'Achter rechts'),
  P('rm2', 'RM', 87, 54, 'Rechter Mittelfeldspieler tief'),
  // Mittelfeld
  P('lm', 'LM', 13, 48, 'Linker Mittelfeldspieler'),
  P('lmi', 'LM', 23, 48.5, 'Linker Mittelfeldspieler innen'),
  P('zml', 'ZM', 33, 49, 'Zentrales Mittelfeld links'),
  P('zmhl', 'ZM', 41.5, 49, 'Zentrales Mittelfeld halblinks'),
  P('zmz', 'ZM', 50, 49, 'Zentrales Mittelfeld zentral'),
  P('zmhr', 'ZM', 58.5, 49, 'Zentrales Mittelfeld halbrechts'),
  P('zmr', 'ZM', 67, 49, 'Zentrales Mittelfeld rechts'),
  P('rmi', 'RM', 77, 48.5, 'Rechter Mittelfeldspieler innen'),
  P('rm', 'RM', 87, 48, 'Rechter Mittelfeldspieler'),
  // Zwischen Mittelfeld und Zehnerraum
  P('lm3', 'LM', 14, 43, 'Linker Mittelfeldspieler hoch'),
  P('zmol', 'ZM', 40, 43.5, 'Achter hoch links'),
  P('zmoz', 'ZM', 50, 44, 'Achter hoch zentral'),
  P('zmor', 'ZM', 60, 43.5, 'Achter hoch rechts'),
  P('rm3', 'RM', 86, 43, 'Rechter Mittelfeldspieler hoch'),
  // Zehnerraum
  P('lat', 'LA', 15, 36, 'Linksaußen tief'),
  P('oml', 'OM', 34, 38, 'Offensives Mittelfeld links'),
  P('omhl', 'OM', 42, 38, 'Offensives Mittelfeld halblinks'),
  P('omz', 'OM', 50, 38, 'Offensives Mittelfeld zentral'),
  P('omhr', 'OM', 58, 38, 'Offensives Mittelfeld halbrechts'),
  P('omr', 'OM', 66, 38, 'Offensives Mittelfeld rechts'),
  P('rat', 'RA', 85, 36, 'Rechtsaußen tief'),
  // Hinter den Spitzen
  P('lf', 'LA', 16, 28, 'Linksaußen'),
  P('lfi', 'LA', 26, 27, 'Linksaußen innen'),
  P('hsl', 'HS', 38, 29, 'Hängende Spitze links'),
  P('hsz', 'HS', 50, 29, 'Hängende Spitze zentral'),
  P('hsr', 'HS', 62, 29, 'Hängende Spitze rechts'),
  P('rfi', 'RA', 74, 27, 'Rechtsaußen innen'),
  P('rf', 'RA', 84, 28, 'Rechtsaußen'),
  // Sturm
  P('lfh', 'LA', 20, 20, 'Linksaußen hoch'),
  P('msl', 'MS', 34, 20, 'Mittelstürmer links'),
  P('msll', 'MS', 42, 19.5, 'Mittelstürmer halblinks'),
  P('msz', 'MS', 50, 19, 'Mittelstürmer zentral'),
  P('msrr', 'MS', 58, 19.5, 'Mittelstürmer halbrechts'),
  P('msr', 'MS', 66, 20, 'Mittelstürmer rechts'),
  P('rfh', 'RA', 80, 20, 'Rechtsaußen hoch'),
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

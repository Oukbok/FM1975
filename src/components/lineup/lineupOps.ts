// =============================================================================
// Aufstellung: Änderungen an Tactics (Startelf-Slots, Bank, Reserve, freie
// Positionen) und Hinweise. Reine Logik ohne React, arbeitet direkt auf dem
// Taktik-Objekt des eigenen Vereins (wie bisher LineupView).
// =============================================================================
import type { Player, Position, Tactics } from '../../types';
import { POSITION_GROUPS } from '../../types';
import { getFormation, type Formation } from '../../data/formations';
import { clampField, gridAt, nearestGrid, PITCH_GRID, withLayout, type GridPoint } from '../../data/pitchGrid';
import { positionSuitability } from '../../engine/positions';

/** Formation mit den eigenen Slot-Lagen des Taktik-Objekts. */
export const effectiveFormation = (t: Tactics): Formation => withLayout(getFormation(t.formation), t.slotLayout);

/** startingXI/assignedPositions aus lineupMap neu bilden; Bank bereinigen. */
export function syncLineup(t: Tactics, benchSize: number): void {
  const f = effectiveFormation(t);
  const map = t.lineupMap ?? (t.lineupMap = {});
  const assigned: Record<string, Position> = {};
  const xi: string[] = [];
  for (const s of f.slots) {
    const pid = map[s.id];
    if (pid) { assigned[pid] = s.position; xi.push(pid); }
  }
  for (const k of Object.keys(map)) if (!f.slots.some((s) => s.id === k)) delete map[k];
  t.assignedPositions = assigned;
  t.startingXI = xi;
  const inXI = new Set(xi);
  const seen = new Set<string>();
  t.substitutes = (t.substitutes ?? []).filter((id) => !inXI.has(id) && !seen.has(id) && (seen.add(id), true)).slice(0, benchSize);
}

export function slotOf(t: Tactics, pid: string): string | null {
  for (const [sid, id] of Object.entries(t.lineupMap ?? {})) if (id === pid) return sid;
  return null;
}
const benchIdx = (t: Tactics, pid: string) => (t.substitutes ?? []).indexOf(pid);

/** Spieler auf einen Slot setzen (Tausch mit dem bisherigen Inhaber). */
export function assignToSlot(t: Tactics, pid: string, slotId: string, benchSize: number): void {
  const map = t.lineupMap ?? (t.lineupMap = {});
  const from = slotOf(t, pid);
  if (from === slotId) return;
  const occ = map[slotId];
  const bi = benchIdx(t, pid);
  if (from) { if (occ) map[from] = occ; else delete map[from]; }
  else if (bi >= 0) { if (occ) t.substitutes[bi] = occ; else t.substitutes.splice(bi, 1); }
  map[slotId] = pid;
  syncLineup(t, benchSize);
}

/** Spieler auf einen Bankplatz (index) setzen; belegter Platz → Tausch. */
export function assignToBench(t: Tactics, pid: string, index: number, benchSize: number): void {
  const map = t.lineupMap ?? (t.lineupMap = {});
  const subs = t.substitutes ?? (t.substitutes = []);
  const from = slotOf(t, pid);
  const bi = subs.indexOf(pid);
  const i = Math.max(0, Math.min(index, benchSize - 1));
  const occ = subs[i];
  if (bi === i) return;
  if (from) {
    if (occ) { map[from] = occ; subs[i] = pid; } else { delete map[from]; subs.push(pid); }
  } else if (bi >= 0) {
    if (occ) { subs[bi] = occ; subs[i] = pid; } else { subs.splice(bi, 1); subs.push(pid); }
  } else if (occ) subs[i] = pid;
  else if (subs.length < benchSize) subs.push(pid);
  syncLineup(t, benchSize);
}

/** Spieler aus Startelf und Bank nehmen (Reserve). */
export function toReserve(t: Tactics, pid: string, benchSize: number): void {
  const from = slotOf(t, pid);
  if (from && t.lineupMap) delete t.lineupMap[from];
  t.substitutes = (t.substitutes ?? []).filter((id) => id !== pid);
  syncLineup(t, benchSize);
}

/** Wohin ein Slot beim Ziehen auf (x, y) kommt – mit oder ohne Einrasten. */
export function placementFor(t: Tactics, slotId: string, x: number, y: number, snap: boolean): { x: number; y: number; position: Position; grid: GridPoint } {
  const f = effectiveFormation(t);
  if (snap) {
    // Punkte, auf (oder ganz nah an) denen ein anderer Slot steht, sind belegt.
    const taken = new Set<string>();
    for (const s of f.slots) {
      if (s.id === slotId || s.position === 'TW') continue;
      const g = gridAt(s.x, s.y) ?? nearestGrid(s.x, s.y);
      if (Math.hypot((g.x - s.x) * 0.68, (g.y - s.y) * 1.05) < 4.5) taken.add(g.id);
    }
    const g = nearestGrid(x, y, taken.size < PITCH_GRID.length ? taken : undefined);
    return { x: g.x, y: g.y, position: g.position, grid: g };
  }
  const c = clampField(x, y);
  const g = nearestGrid(c.x, c.y);
  return { x: Math.round(c.x * 10) / 10, y: Math.round(c.y * 10) / 10, position: g.position, grid: g };
}

/** Slot verschieben (Torwart bleibt fest). */
export function moveSlot(t: Tactics, slotId: string, x: number, y: number, snap: boolean, benchSize: number): void {
  const base = getFormation(t.formation).slots.find((s) => s.id === slotId);
  if (!base || base.position === 'TW') return;
  const p = placementFor(t, slotId, x, y, snap);
  t.slotLayout = { ...(t.slotLayout ?? {}), [slotId]: { x: p.x, y: p.y, position: p.position } };
  syncLineup(t, benchSize);
}

// -----------------------------------------------------------------------------
// Hinweise
// -----------------------------------------------------------------------------

export type HintLevel = 'warn' | 'info';
export interface Hint { level: HintLevel; text: string }

const isOut = (p: Player) => p.availability !== 'available' || !!p.injury || p.suspensionMatches > 0;

/** Stamm-, Neben- oder fremde Position. */
export function familiarityOf(p: Player, pos: Position): 'stamm' | 'neben' | 'fremd' {
  if (p.naturalPosition === pos) return 'stamm';
  return p.secondaryPositions?.includes(pos) ? 'neben' : 'fremd';
}

export function lineupHints(t: Tactics, players: Record<string, Player>, benchSize: number): Hint[] {
  const f = effectiveFormation(t);
  const map = t.lineupMap ?? {};
  const out: Hint[] = [];
  const xi = f.slots.map((s) => ({ s, p: map[s.id] ? players[map[s.id]] : undefined }));
  const filled = xi.filter((x) => x.p).length;
  if (filled < 11) out.push({ level: 'warn', text: `Aufstellung unvollständig (${filled}/11) – freie Plätze besetzt der Co-Trainer beim Anpfiff mit dem Passendsten.` });
  const gk = xi.find((x) => x.s.position === 'TW');
  if (gk?.p && gk.p.naturalPosition !== 'TW') out.push({ level: 'warn', text: `Im Tor steht kein Torwart (${gk.p.lastName}).` });
  for (const { p } of xi) if (p && isOut(p)) out.push({ level: 'warn', text: `${p.lastName} ist nicht einsatzfähig (${p.injury ? 'verletzt' : 'gesperrt'}) – wird vor dem Spiel ersetzt.` });
  for (const { s, p } of xi) {
    if (!p || s.position === 'TW' || p.naturalPosition === 'TW') continue;
    if (familiarityOf(p, s.position) !== 'fremd') continue;
    const here = positionSuitability(p, s.position), home = positionSuitability(p, p.naturalPosition);
    out.push({ level: here < home - 6 ? 'warn' : 'info', text: `${p.lastName} spielt außerhalb seiner Position (${p.naturalPosition} → ${s.position}, Eignung ${here} statt ${home}).` });
  }
  for (const { p } of xi) if (p && !isOut(p) && (p.frische ?? 100) < 70) out.push({ level: 'info', text: `${p.lastName} ist müde (Frische ${Math.round(p.frische)}).` });
  // Ausgewogenheit der Formation
  const cnt = (ps: Position[]) => f.slots.filter((s) => ps.includes(s.position)).length;
  const def = cnt(['LIB', 'IV', 'RV', 'LV']);
  if (def < 3) out.push({ level: 'warn', text: `Nur ${def} Abwehrspieler – die Abwehr ist sehr dünn besetzt.` });
  if (def > 6) out.push({ level: 'info', text: `${def} Abwehrspieler – sehr defensiv, vorne fehlt Durchschlagskraft.` });
  if (cnt(['MS', 'HS']) === 0) out.push({ level: 'warn', text: 'Kein Stürmer in der Formation.' });
  if (cnt(['LIB']) > 1) out.push({ level: 'warn', text: 'Mehr als ein Libero – üblich ist genau einer.' });
  if (f.slots.filter((s) => POSITION_GROUPS[s.position] === 'MID').length < 2) out.push({ level: 'info', text: 'Weniger als zwei Mittelfeldspieler – die Ballkontrolle leidet.' });
  // Bank
  const bench = (t.substitutes ?? []).map((id) => players[id]).filter(Boolean);
  if (bench.length >= benchSize && !bench.some((p) => p.naturalPosition === 'TW')) out.push({ level: 'info', text: 'Kein Ersatztorwart auf der Bank.' });
  if (bench.length < benchSize) out.push({ level: 'info', text: `${benchSize - bench.length} Bankplätze frei – das Spiel füllt sie vor dem Anpfiff mit den Besten auf.` });
  return out;
}

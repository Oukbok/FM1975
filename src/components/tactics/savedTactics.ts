// =============================================================================
// Taktiken speichern & laden (Wunsch Pascal): nur die Anweisungen und Rollen,
// nicht die Aufstellung (die hat ihr eigenes Speichern, components/lineup/SavedLineups.tsx).
// Am Spielstand im optionalen `game.savedTactics` (höchstens 12).
// =============================================================================
import type { Tactics } from '../../types';
import type { Game } from '../../game/state';
import { getFormation } from '../../data/formations';
import { instrPatchOf, type InstrPatch } from './instructions';

export interface SavedTactic {
  id: string;
  name: string;
  date: string;
  patch: InstrPatch;
  /** Rollen je Slot gelten nur für diese Formation. */
  formation: string;
  roles?: Record<string, string>;
}
export const MAX_SAVED_TACTICS = 12;

export const savedTactics = (g: Game): SavedTactic[] => (g.savedTactics ??= []);

export function saveTactic(g: Game, t: Tactics, year: number, name: string): SavedTactic | null {
  const list = savedTactics(g);
  const nm = name.trim() || `Taktik ${list.length + 1}`;
  const same = list.find((x) => x.name.toLowerCase() === nm.toLowerCase());
  if (!same && list.length >= MAX_SAVED_TACTICS) return null;
  const s: SavedTactic = {
    id: same?.id ?? `tx${Date.now().toString(36)}${list.length}`, name: nm, date: g.calendar.currentDate,
    patch: instrPatchOf(t, year), formation: getFormation(t.formation).id, roles: t.roles ? { ...t.roles } : undefined,
  };
  if (same) list[list.indexOf(same)] = s; else list.push(s);
  return s;
}

/** Anweisungen übernehmen; Rollen nur, wenn die Formation dieselbe ist. */
export function applySaved(t: Tactics, s: SavedTactic): Partial<Tactics> {
  const patch: Partial<Tactics> = { ...s.patch };
  if (s.roles && getFormation(t.formation).id === s.formation) patch.roles = { ...s.roles };
  return patch;
}

export function deleteTactic(g: Game, id: string): void {
  g.savedTactics = savedTactics(g).filter((x) => x.id !== id);
}

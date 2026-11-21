// =============================================================================
// Laden: Verweise der Aufstellung auf Spieler, die nicht mehr im Kader stehen
// (Spielstand-Kompatibilität, tests/savecompat-test.ts). Wechsel, Leihen,
// Karriereende und frühere Kaderbereinigungen (Pokal-Amateure alter Stände)
// nehmen Spieler aus `playerIds`, lassen aber Startelf/Bank/Slot-Zuordnung/
// Kapitän/Standards stehen. Die Match-Engine nimmt ohnehin nur Spieler aus dem
// Kader (`resolveLineup`, `firstXi` in engine/match/sim.ts) – das Aufräumen
// ändert also kein Ergebnis, verhindert aber, dass Anzeige (Kapitän, Bank,
// Profil-Reiter) einen längst gewechselten Spieler zeigt. Idempotent.
// =============================================================================
import type { Club } from '../types';
import type { Game } from './state';

/** Entfernt in einer Taktik alle Spieler-IDs, die nicht in `club.playerIds` stehen; liefert die Zahl der Änderungen. */
export function pruneTacticsRefs(club: Club): number {
  const t = club.tactics;
  if (!t) return 0;
  const squad = new Set(club.playerIds ?? []);
  let n = 0;
  const keepList = (l: string[] | undefined) => {
    if (!Array.isArray(l)) return l;
    const k = l.filter((id) => squad.has(id));
    n += l.length - k.length;
    return k.length === l.length ? l : k;
  };
  t.startingXI = keepList(t.startingXI) ?? [];
  t.substitutes = keepList(t.substitutes) ?? [];
  if (t.lineupMap) for (const [slot, id] of Object.entries(t.lineupMap)) if (!squad.has(id)) { delete t.lineupMap[slot]; n++; }
  if (t.assignedPositions) for (const id of Object.keys(t.assignedPositions)) if (!squad.has(id)) { delete t.assignedPositions[id]; n++; }
  if (t.takers) for (const k of Object.keys(t.takers) as (keyof NonNullable<typeof t.takers>)[]) t.takers[k] = keepList(t.takers[k]);
  for (const k of ['captainId', 'penaltyTakerId', 'freeKickTakerId', 'cornerTakerId'] as const) {
    if (t[k] && !squad.has(t[k]!)) { t[k] = null; n++; }
  }
  return n;
}

/** Alle Vereine: verwaiste Aufstellungs-Verweise entfernen. */
export function migrateTacticsRefs(g: Game): number {
  let n = 0;
  for (const c of Object.values(g.clubs)) n += pruneTacticsRefs(c);
  return n;
}

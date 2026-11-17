// =============================================================================
// AUTO-BESETZUNG DER ERSATZBANK (Wunsch Pascal): Die Bank soll so stehen, dass
// jede Position der Startelf ausgewechselt werden kann – in fester Reihenfolge:
//   1. Torwart
//   2. Abwehr innen (LIB/IV), 3. Abwehr außen (RV/LV)
//   4. Mittelfeld innen (DM/ZM/OM), 5. Mittelfeld außen (RM/LM)
//   6. Sturm außen (RA/LA), 7. Sturm innen (HS/MS)
// Erst ein Ersatz je Mannschaftsteil, der in der Startelf vorkommt; ist dann noch
// Platz (z. B. 9 Ersatzspieler), ein zweiter für mehrfach besetzte Teile in derselben
// Reihenfolge. Fehlt für einen Teil ein brauchbarer Ersatz (Vertrautheit mindestens
// „ausreichend“), wird die Bank am Ende mit den Spielern aufgefüllt, die die
// Startelf-Positionen am besten vertreten können.
// Genutzt von engine/lineupAI.ts (Auto-Aufstellen, KI) und engine/match/team.ts (Spielbogen).
// =============================================================================
import type { Player, Position } from '../types';
import { familiarity, positionSuitability } from './positions';

interface Part { pos: Position[] }
const PARTS: Part[] = [
  { pos: ['TW'] },
  { pos: ['LIB', 'IV'] },
  { pos: ['RV', 'LV'] },
  { pos: ['DM', 'ZM', 'OM'] },
  { pos: ['RM', 'LM'] },
  { pos: ['RA', 'LA'] },
  { pos: ['HS', 'MS'] },
];
/** Mindest-Vertrautheit für einen „echten“ Ersatz (≈ Vertrautheit 75, „ausreichend“). */
const MIN_FAM = 0.88;

/**
 * Wählt `size` Ersatzspieler aus `rest` (ohne Startelf) zu den Positionen der Startelf `xiPos`.
 * `fits` = zusätzliche Bedingung (z. B. Ausländergrenze), wird vor jedem Aufnehmen geprüft; `onTake` meldet jede Aufnahme.
 */
export function pickBench(xiPos: Position[], rest: Player[], size: number, fits: (p: Player) => boolean = () => true, onTake?: (p: Player) => void): Player[] {
  const out: Player[] = [];
  if (size <= 0) return out;
  const free = rest.filter(Boolean);
  const used = new Set<string>();
  const take = (p: Player) => { out.push(p); used.add(p.id); onTake?.(p); };
  // Wert eines Kandidaten für einen Mannschaftsteil: beste Eignung für eine der Startelf-Positionen darin.
  const valueFor = (p: Player, ps: Position[]) => {
    let best = 0;
    for (const pos of ps) if (familiarity(p, pos) >= MIN_FAM) best = Math.max(best, positionSuitability(p, pos));
    return best;
  };
  const fill = (ps: Position[]): boolean => {
    let bp: Player | null = null, bv = 0;
    for (const p of free) {
      if (used.has(p.id) || !fits(p)) continue;
      const v = valueFor(p, ps);
      if (v > bv) { bv = v; bp = p; }
    }
    if (bp) take(bp);
    return !!bp;
  };
  const need = PARTS.map((part) => {
    const ps = part.pos.filter((x) => xiPos.includes(x));
    return { ps, n: xiPos.filter((x) => part.pos.includes(x)).length };
  });
  // Runde 1: je Teil der Startelf ein Ersatz, zuerst der Torwart.
  for (let i = 0; i < need.length && out.length < size; i++) {
    if (need[i].ps.length) fill(need[i].ps);
  }
  // Runde 2: mehrfach besetzte Teile doppelt (nie ein dritter Torwart).
  for (let i = 1; i < need.length && out.length < size; i++) {
    if (need[i].n >= 2 && need[i].ps.length) fill(need[i].ps);
  }
  // Auffüllen: wer die Startelf-Positionen am besten vertreten kann (Feldspieler; ohne zweiten Ersatztorwart,
  // solange es Feldspieler gibt).
  const fieldPos = xiPos.filter((x) => x !== 'TW');
  const score = (p: Player) => Math.max(0, ...fieldPos.map((pos) => positionSuitability(p, pos)));
  const left = free.filter((p) => !used.has(p.id) && fits(p))
    .sort((a, b) => (Number(a.naturalPosition === 'TW') - Number(b.naturalPosition === 'TW')) || score(b) - score(a) || b.overall - a.overall);
  for (const p of left) { if (out.length >= size) break; if (fits(p)) take(p); }
  return out;
}

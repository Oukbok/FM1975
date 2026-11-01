// =============================================================================
// Gruppenauslosung (Europapokal 2.0): Töpfe nach Stärke (bzw. Sieger/Zweite in der
// zweiten Gruppenphase 1999–2003), je Topf eine Kugel pro Gruppe (bei Zweier-Töpfen
// zwei), Länderschutz und Vorgruppen-Schutz. Gezogen wird Topf für Topf; die Kugel
// geht in die erste Gruppe (A, B, …), in die sie passen darf – wie bei der Auslosung
// des Verbands mit Computerhilfe. Geht es nicht auf, wird neu gemischt; als letzte
// Rückfallebene ohne Länderschutz. Ligaphase: Töpfe + Gegner je Topf (engine/euroGroups.ts).
// =============================================================================
import type { DrawBall } from '../types/draw';
import { groupName } from './euroGroups';

function rng32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffleWith<T>(arr: T[], rnd: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface GroupDrawInput {
  pots: { label: string; ids: string[] }[];
  groups: number;
  /** Teams je Gruppe aus jedem Topf (Standard 1). */
  perPot?: number[];
  /** Dürfen a und b nicht in dieselbe Gruppe (Land, Vorgruppe)? */
  clash: (a: string, b: string) => boolean;
  seed: number;
  nameOf: (id: string) => string;
}

export interface GroupDrawOutput {
  pots: { label: string; ids: string[] }[];
  balls: DrawBall[];
  groups: { name: string; ids: string[] }[];
}

/** Töpfe nach Stärke: `count` Töpfe gleicher Größe, stärkste zuerst. */
export function potsByStrength(ids: string[], count: number, strengthOf: (id: string) => number, label = 'Topf'): { label: string; ids: string[] }[] {
  const sorted = [...ids].sort((a, b) => strengthOf(b) - strengthOf(a) || a.localeCompare(b));
  const size = Math.ceil(sorted.length / count);
  return Array.from({ length: count }, (_, i) => ({ label: `${label} ${i + 1}`, ids: sorted.slice(i * size, (i + 1) * size) }));
}

export function drawGroups(inp: GroupDrawInput): GroupDrawOutput {
  const rnd = rng32(inp.seed);
  const pots = inp.pots.map((p) => ({ label: p.label, ids: [...p.ids].sort((a, b) => inp.nameOf(a).localeCompare(inp.nameOf(b), 'de')) }));
  const numbers = new Map<string, number>();
  pots.forEach((p) => p.ids.forEach((id, i) => numbers.set(id, i + 1)));
  const per = (pi: number) => inp.perPot?.[pi] ?? 1;

  const attempt = (strict: boolean): { balls: DrawBall[]; groups: string[][] } | null => {
    const groups: string[][] = Array.from({ length: inp.groups }, () => []);
    const fromPot: number[][] = Array.from({ length: inp.groups }, () => pots.map(() => 0));
    const balls: DrawBall[] = [];
    for (let pi = 0; pi < pots.length; pi++) {
      const order = shuffleWith(pots[pi].ids, rnd);
      for (const id of order) {
        const fits = (gi: number) => fromPot[gi][pi] < per(pi) && (!strict || !groups[gi].some((x) => inp.clash(id, x)));
        // Erste passende Gruppe – aber nur, wenn die übrigen Kugeln des Topfs danach noch Platz finden.
        let placed = -1;
        for (let gi = 0; gi < inp.groups && placed < 0; gi++) {
          if (!fits(gi)) continue;
          groups[gi].push(id); fromPot[gi][pi]++;
          const rest = order.slice(order.indexOf(id) + 1);
          if (canPlace(rest, groups, fromPot, pi, per(pi), strict ? inp.clash : () => false)) placed = gi;
          else { groups[gi].pop(); fromPot[gi][pi]--; }
        }
        if (placed < 0) return null;
        balls.push({ id, pot: pi, no: numbers.get(id) ?? 0, pair: placed, group: placed });
      }
    }
    return { balls, groups };
  };
  for (let t = 0; t < 80; t++) {
    const res = attempt(true);
    if (res) return { pots, balls: res.balls, groups: res.groups.map((ids, i) => ({ name: groupName(i), ids })) };
  }
  const res = attempt(false)!;
  return { pots, balls: res.balls, groups: res.groups.map((ids, i) => ({ name: groupName(i), ids })) };
}

/** Passen die restlichen Kugeln eines Topfs noch in die Gruppen? (Paarung über Erweiterungspfade) */
function canPlace(rest: string[], groups: string[][], fromPot: number[][], pi: number, cap: number, clash: (a: string, b: string) => boolean): boolean {
  if (!rest.length) return true;
  const slots: number[] = [];
  groups.forEach((g, gi) => { for (let k = fromPot[gi][pi]; k < cap; k++) slots.push(gi); });
  if (slots.length < rest.length) return false;
  const match = new Array<number>(slots.length).fill(-1);
  const ok = (b: number, s: number) => !groups[slots[s]].some((x) => clash(rest[b], x));
  const tryB = (b: number, seen: boolean[]): boolean => {
    for (let s = 0; s < slots.length; s++) {
      if (seen[s] || !ok(b, s)) continue;
      seen[s] = true;
      if (match[s] < 0 || tryB(match[s], seen)) { match[s] = b; return true; }
    }
    return false;
  };
  for (let b = 0; b < rest.length; b++) if (!tryB(b, new Array(slots.length).fill(false))) return false;
  return true;
}

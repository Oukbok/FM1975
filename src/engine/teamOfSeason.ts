// =============================================================================
// ELF DER SAISON — beste Mannschaft einer Liga (rein, ohne Spielstand)
// -----------------------------------------------------------------------------
// Die Sportredaktion stellt am Saisonende aus allen Stammspielern einer Liga die
// beste Elf in der typischen Formation der Epoche auf (data/formations.ts):
//   bis 1984 Libero 1-4-3-2 · 1985–1995 Libero 1-3-4-2 · 1996–2007 4-4-2 · ab 2008 4-2-3-1
//   (Endjahr der Saison; Libero bis zum Ende der Libero-Ära, siehe LIBERO_END).
// Wertung je Spieler = Punkte der Besten der Saison (engine/seasonAwards.ts awardScore,
// Mindesteinsätze wie dort). Besetzung: Slot für Slot zuerst nur Spieler genau dieser
// Position, dann verwandte Positionen (POS_FALLBACK), zuletzt der ganze Mannschaftsteil.
// =============================================================================
import { getFormation } from '../data/formations';
import type { Position } from '../types';
import { type AwardCandidate, type AwardContext, awardScore, minApps } from './seasonAwards';

export function tosFormationId(endYear: number): string {
  if (endYear < 1985) return 'libero-1-4-3-2';
  if (endYear <= 1995) return 'libero-1-3-4-2';
  if (endYear <= 2007) return '4-4-2';
  return '4-2-3-1';
}

/** Verwandte Positionen (Reihenfolge = Vorrang). */
const POS_FALLBACK: Record<string, string[]> = {
  TW: ['TW'], LIB: ['LIB', 'IV', 'DM'], IV: ['IV', 'LIB', 'DM'],
  LV: ['LV', 'RV', 'LM', 'IV'], RV: ['RV', 'LV', 'RM', 'IV'],
  DM: ['DM', 'ZM', 'IV', 'LIB'], ZM: ['ZM', 'DM', 'OM'], OM: ['OM', 'ZM', 'HS'],
  LM: ['LM', 'LA', 'RM', 'ZM'], RM: ['RM', 'RA', 'LM', 'ZM'],
  LA: ['LA', 'LM', 'RA', 'HS'], RA: ['RA', 'RM', 'LA', 'HS'],
  HS: ['HS', 'MS', 'OM'], MS: ['MS', 'HS', 'LA', 'RA'],
};

export interface TosPick { slot: Position; x: number; y: number; c: AwardCandidate; score: number }

/** Beste Elf einer Liga (leere Slots bleiben weg, wenn niemand passt). */
export function pickTeamOfSeason(cands: AwardCandidate[], ctx: AwardContext, endYear: number): { formation: string; xi: TosPick[] } {
  const formation = tosFormationId(endYear);
  const f = getFormation(formation);
  const need = minApps(ctx);
  const pool = cands
    .filter((c) => c.apps >= need && Number.isFinite(c.avg) && c.avg > 0)
    .map((c) => ({ c, score: awardScore(c, ctx).score }))
    .sort((a, b) => b.score - a.score || a.c.avg - b.c.avg || a.c.pid.localeCompare(b.c.pid));
  const used = new Set<string>();
  const names = new Set<string>(); // Weltspieler können gleich heißen – keine zwei gleichen Namen in einer Elf
  const out = new Map<string, TosPick>();
  const grpOf = (pos: string) => (pos === 'TW' ? 'GK' : ['LIB', 'IV', 'LV', 'RV'].includes(pos) ? 'DEF' : ['MS', 'HS', 'LA', 'RA'].includes(pos) ? 'ATT' : 'MID');
  for (let tier = 0; tier < 5; tier++) {
    for (const s of f.slots) {
      if (out.has(s.id)) continue;
      const list = POS_FALLBACK[s.position] ?? [s.position];
      const ok = (pos: string) => (tier < 4 ? list.slice(0, tier + 1).includes(pos) : grpOf(pos) === grpOf(s.position));
      const hit = pool.find((x) => !used.has(x.c.pid) && !names.has(x.c.name) && ok(x.c.pos));
      if (hit) { used.add(hit.c.pid); names.add(hit.c.name); out.set(s.id, { slot: s.position, x: s.x, y: s.y, c: hit.c, score: hit.score }); }
    }
  }
  return { formation, xi: f.slots.map((s) => out.get(s.id)).filter((x): x is TosPick => !!x) };
}

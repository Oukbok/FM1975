// =============================================================================
// Saisonwechsel der Ligapyramide – Nachbearbeitung (aus data/reformTransition.ts ausgelagert,
// Dateien < 600 Zeilen): Sollgrößen nach übergroßen Saisons, Schutz des eigenen Vereins.
// =============================================================================
import type { DivisionMeta } from '../engine/leagues';
import { structureForSeason, type DivisionTarget } from './reforms';
import type { CurrentDivision, TransitionResult } from './reformTransition';

// -----------------------------------------------------------------------------
// Normalisierung übergroßer Ebenen auf die Soll-(Steady-)Struktur
// -----------------------------------------------------------------------------
// Nach der einmalig übergroßen Wiedervereinigungs-Saison (1. Liga = 20, 2. Liga
// vergrößert) führt der reguläre Saisonwechsel die Ebenen schrittweise auf ihre
// Sollgrößen zurück: übergroße Ebenen geben ihre schwächsten Vereine an die
// nächsttiefere Ebene ab (top-down); auf der untersten Ebene fallen Überzählige
// aus der Simulation. Dadurch steigen in der Normalisierungs-Saison mehr Vereine
// ab als sonst. Passt eine Ebene bereits, ist der Schritt ein No-op.
export function normalizeToSteady(res: TransitionResult, newSeason: string, given?: DivisionTarget[], current: CurrentDivision[] = [], protectedId?: string): TransitionResult {
  const targets = given ?? structureForSeason(newSeason);
  // Opfer = Schwächster, der schon in der Vorsaison in dieser Staffel spielte (nicht der eben Auf-/Abgestiegene).
  const before = new Map(current.map((c) => [c.id, new Set(c.orderedIds)]));
  const victimOf = (d: { meta: DivisionMeta; ids: string[] }): string => {
    const was = before.get(d.meta.id);
    for (let i = d.ids.length - 1; i >= 0 && was; i--) {
      if (was.has(d.ids[i]) && d.ids[i] !== protectedId) return d.ids.splice(i, 1)[0];
    }
    return d.ids.pop() as string;
  };
  const tiers = Array.from(new Set(res.divisions.map((d) => d.meta.tier))).sort((a, b) => a - b);
  const dropped = [...res.dropped];
  for (const tier of tiers) {
    for (const d of res.divisions.filter((x) => x.meta.tier === tier)) {
      const tgt = targets.find((t) => t.id === d.meta.id)?.teamCount
        ?? targets.find((t) => t.tier === tier)?.teamCount
        ?? d.ids.length;
      while (d.ids.length > tgt) {
        const victim = victimOf(d); // schwächster (Tabellenende) zuerst
        const lower = res.divisions.find((x) => x.meta.tier === tier + 1);
        if (lower) lower.ids.push(victim); else dropped.push(victim);
      }
    }
  }
  return { ...res, dropped };
}

/**
 * Stellt sicher, dass der Verein des Spielers nie aus der Ligapyramide fällt.
 * Falls eine Reform ihn (z. B. als Absteiger in eine nicht simulierte Amateurliga)
 * entfernen würde, wird er stattdessen in die unterste Ebene aufgenommen und
 * verdrängt dort den schwächsten Eintrag (Platzhalter bevorzugt, sonst realer
 * Verein, der dann absteigt). So bleiben alle Staffelgrößen gerade.
 */
export function ensureProtected(res: TransitionResult, protectedId?: string): TransitionResult {
  if (!protectedId) return res;
  if (res.divisions.some((d) => d.ids.includes(protectedId))) return res;
  const lowestTier = Math.max(...res.divisions.map((d) => d.meta.tier));
  const target = res.divisions.find((d) => d.meta.tier === lowestTier);
  if (!target || target.ids.length === 0) return res;
  const victimIdx = target.ids.length - 1;
  const victim = target.ids[victimIdx];
  target.ids[victimIdx] = protectedId;
  const dropped = res.dropped.filter((id) => id !== protectedId);
  let placeholders = res.placeholders;
  if (victim && victim.startsWith('ph-')) {
    placeholders = res.placeholders.filter((p) => p.id !== victim); // Platzhalter entfällt lautlos
  } else if (victim) {
    dropped.push(victim); // realer Verein steigt an Stelle des Spielers ab
  }
  return { ...res, dropped, placeholders };
}


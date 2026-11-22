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
 * Sicherheitsnetz für Ligareformen: Würde eine Reform den Verein des Spielers aus der
 * Pyramide entfernen, wird er stattdessen in die unterste Ebene aufgenommen und
 * verdrängt dort den schwächsten Eintrag (Platzhalter bevorzugt, sonst realer
 * Verein, der dann absteigt). So bleiben alle Staffelgrößen gerade.
 * Der sportliche Abstieg aus der untersten Liga ist davon NICHT geschützt: Steht der
 * eigene Verein auf einem Abstiegsplatz, endet die Amtszeit (game/relegationGame.ts) –
 * `protectedId` ist dann schon der neue Verein bzw. das Spiel ist beendet.
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


/**
 * Gleicht Ligagrößen an die Sollstruktur an: Überzählige (schwächste) wandern eine
 * Ebene tiefer, fehlende Plätze werden mit den stärksten Vereinen der Ebene darunter
 * aufgefüllt. Auf der untersten Ebene werden Überzählige gestrichen.
 */
export function balanceDivisions(
  membership: Record<string, { ids: string[]; meta: DivisionMeta }>,
  target: { id: string; tier: number; teamCount: number }[],
  strengthOf: (id: string) => number,
  protectedId?: string,
): void {
  const want: Record<string, number> = {};
  for (const t of target) want[t.id] = t.teamCount;
  const keys = Object.keys(membership).filter((k) => want[k] != null);
  const tiers = [...new Set(keys.map((k) => membership[k].meta.tier))].sort((a, b) => a - b);
  for (const tier of tiers) {
    const here = keys.filter((k) => membership[k].meta.tier === tier);
    const below = keys.filter((k) => membership[k].meta.tier === tier + 1);
    for (const k of here) {
      const ids = membership[k].ids;
      // Zu viele: schwächste nach unten (nie den eigenen Verein).
      while (ids.length > want[k]) {
        const sorted = ids.filter((id) => id !== protectedId).sort((a, b) => strengthOf(a) - strengthOf(b));
        const out = sorted[0];
        if (!out) break;
        ids.splice(ids.indexOf(out), 1);
        if (below.length) {
          const dest = below.sort((a, b) => (membership[a].ids.length - want[a]) - (membership[b].ids.length - want[b]))[0];
          membership[dest].ids.push(out);
        }
      }
      // Zu wenige: stärkste von unten holen.
      while (ids.length < want[k] && below.length) {
        const src = below.sort((a, b) => membership[b].ids.length - membership[a].ids.length)[0];
        const pool = membership[src].ids.filter((id) => id !== protectedId).sort((a, b) => strengthOf(b) - strengthOf(a));
        const inn = pool[0];
        if (!inn) break;
        membership[src].ids.splice(membership[src].ids.indexOf(inn), 1);
        ids.push(inn);
      }
    }
  }
}

// =============================================================================
// HEIMATLAND ≠ DEUTSCHLAND: historische Ligastruktur beim Saisonwechsel
// -----------------------------------------------------------------------------
// Die eigene Pyramide läuft über data/reformTransition.ts mit `ctx.targets` (keine
// deutschen Reformen). Früher waren die Zielgrößen = aktuelle Ligen (Größen blieben für
// immer gleich). Jetzt kommen sie aus der historischen Struktur des Landes
// (data/world/structure.ts `worldStructureFor`), z. B. England 1995/96 22 → 20:
//  • 1. Liga: Sollgröße + Aufsteiger in historischer Zahl (`upSlots`); die Absteiger
//    ergeben sich in normalTransition aus Aufsteigern ± Größenänderung;
//  • 2. Ebene: Gesamtgröße der Saison. Gleiche Staffelzahl → Größe je Staffel; wird aus
//    mehreren Staffeln eine (Frankreich 1993/94), werden sie zu einer „2. Liga“ zusammengelegt.
//    Mehr Staffeln als im Spiel (z. B. Portugal ab 1988/89 drei Staffeln) werden NICHT neu
//    aufgeteilt (Umbau der Divisionen zu groß) – dann bleiben die Größen;
//  • unterste Ebene ↔ Amateure (Pool): historische Zahl der Absteiger, wächst/schrumpft die
//    Ebene, rücken entsprechend mehr/weniger nach (Plätze = Platzhalter, die
//    game/clubPool.ts `absorbPlaceholders` mit Pool-Vereinen besetzt).
// Ohne Weltdaten für das Land bleibt alles wie bisher (Zielgrößen = aktuelle Ligen).
// Alte Spielstände: greift ab dem nächsten Saisonwechsel, keine Migration nötig.
// =============================================================================
import type { CurrentDivision, TransitionResult } from '../data/reformTransition';
import { makePlaceholder, type DivisionTarget } from '../data/reforms';
import { seasonStartYear } from '../data/timeline';
import { worldStructureFor } from '../data/world/structure';

export interface HomePlan {
  targets: DivisionTarget[];
  /** Staffeln der 2. Ebene, die zur neuen Saison zu einer zusammengelegt werden. */
  merge: { ids: string[]; into: DivisionTarget } | null;
  /** Absteiger unterste Ebene → Amateure laut Daten (undefined = bisherige Zahl in poolExchange). */
  poolOut?: number;
}

const keep = (c: CurrentDivision): DivisionTarget => ({ id: c.id, tier: c.tier, group: c.group, name: c.name, teamCount: c.orderedIds.length });

/** Zielstruktur der neuen Saison für das Heimatland `cc`. */
export function homeSeasonPlan(cc: string, current: CurrentDivision[], newSeason: string): HomePlan {
  const divs = current.filter((c) => c.tier < 100);
  const y = seasonStartYear(newSeason);
  const st = worldStructureFor(cc, y);
  if (!st) return { targets: divs.map(keep), merge: null };
  const prev = worldStructureFor(cc, y - 1);
  const targets: DivisionTarget[] = [];
  let merge: HomePlan['merge'] = null;
  const second = divs.filter((d) => d.tier === 2);
  for (const d of divs.filter((x) => x.tier === 1)) targets.push({ ...keep(d), teamCount: st.t1, upSlots: second.length ? st.up : undefined });
  if (!st.groups || !second.length) targets.push(...second.map(keep));
  else if (st.groups.length === 1 && second.length === 1) targets.push({ ...keep(second[0]), teamCount: st.t2! });
  else if (st.groups.length === 1) {
    const into: DivisionTarget = { id: 'tier2', tier: 2, group: null, name: '2. Liga', teamCount: st.t2! };
    merge = { ids: second.map((d) => d.id), into };
    targets.push(into);
  } else if (st.groups.length === second.length) second.forEach((d, i) => targets.push({ ...keep(d), teamCount: st.groups![i] }));
  else targets.push(...second.map(keep));
  targets.push(...divs.filter((d) => d.tier > 2).map(keep));
  const lowest = Math.max(...divs.map((d) => d.tier));
  const singleBoth = (st.groups?.length ?? 0) === 1 && (prev?.groups?.length ?? 0) === 1;
  const poolOut = lowest === 1 ? st.down : lowest === 2 && singleBoth && st.down2 != null && !merge ? st.down2 : undefined;
  return { targets, merge, poolOut };
}

/**
 * Nach computeSeasonTransition: Staffeln zusammenlegen, unterste Ebene auf Sollgröße bringen
 * (Platzhalter bzw. Schwächste in die Amateure). Liefert die Zahl der Tauschpaare unterste
 * Ebene ↔ Pool für poolExchange (undefined = bisherige Zahl).
 */
export function applyHomePlan(res: TransitionResult, plan: HomePlan, current: CurrentDivision[], season: string, protectedId?: string): number | undefined {
  const before = new Map<string, Set<string>>(current.map((c) => [c.id, new Set(c.orderedIds)]));
  if (plan.merge) {
    const parts = res.divisions.filter((d) => plan.merge!.ids.includes(d.meta.id));
    if (parts.length) {
      // Im Wechsel aus allen Staffeln (Tabellenplätze), damit die Spitze beider Staffeln vorne steht.
      const ids: string[] = [];
      for (let i = 0; i < Math.max(...parts.map((p) => p.ids.length)); i++) for (const p of parts) if (p.ids[i]) ids.push(p.ids[i]);
      const into = plan.merge.into;
      const at = res.divisions.indexOf(parts[0]);
      res.divisions = res.divisions.filter((d) => !parts.includes(d));
      res.divisions.splice(at, 0, { meta: { id: into.id, name: into.name, tier: into.tier, group: into.group }, ids });
      before.set(into.id, new Set(parts.flatMap((p) => [...(before.get(p.meta.id) ?? [])])));
    }
  }
  const tiers = res.divisions.map((d) => d.meta.tier).filter((t) => t < 100);
  const lowest = Math.max(...tiers);
  const lowSets = res.divisions.filter((d) => d.meta.tier === lowest).map((d) => before.get(d.meta.id) ?? new Set<string>());
  // Schon von normalizeToSteady abgegebene Vereine der untersten Ebene mitzählen.
  let shrink = res.dropped.filter((id) => lowSets.some((s) => s.has(id))).length;
  for (const d of res.divisions.filter((x) => x.meta.tier === lowest)) {
    const t = plan.targets.find((x) => x.id === d.meta.id) ?? plan.targets.find((x) => x.tier === lowest && x.group === d.meta.group);
    if (!t) continue;
    const was = before.get(d.meta.id) ?? new Set<string>();
    while (d.ids.length > t.teamCount) {
      let i = d.ids.length - 1;
      while (i >= 0 && (!was.has(d.ids[i]) || d.ids[i] === protectedId)) i--;
      if (i < 0) i = d.ids.length - 1;
      res.dropped.push(d.ids.splice(i, 1)[0]);
      shrink++;
    }
    while (d.ids.length < t.teamCount) {
      const ph = makePlaceholder(`home:${season}`, d.meta.tier, d.meta.group);
      res.placeholders.push(ph);
      d.ids.push(ph.id);
    }
  }
  return plan.poolOut == null ? undefined : Math.max(0, plan.poolOut - shrink);
}

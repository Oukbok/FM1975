// =============================================================================
// Zustand des Planungsmodus „Stadion ausbauen“ (nur Oberfläche): Entwurf je Block,
// Bearbeitung „nur dieser Block“ / „ganze Seite“ (sideTargets wie bisher), Merken
// im localStorage je Spielstand (Verein + Manager + Startjahr; ohne Speicher geht
// es ohne). Der Spielstand wird erst mit „Bauen“ verändert (PlanPanel.tsx).
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import { BLOCK_SIDE } from '../../../engine/stadiumBlocks';
import { sideTargets } from '../../../game/stadiumGame';
import type { Game } from '../../../game/state';
import type { BlockId, StadiumBlock } from '../../../types';
import { PlanMap, applyPlan, cleanPlan, planList, putInPlan } from './planModel';

const KEY = 'fm_stadium_plan';
const fingerprint = (g: Game) => `${g.managedClubId}|${g.manager?.name ?? ''}|${(g as unknown as { startYear?: number }).startYear ?? 1975}`;
const copy = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

function load(g: Game, blocks: StadiumBlock[]): PlanMap {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const d = JSON.parse(raw) as { fp?: string; plan?: PlanMap };
    return d.fp === fingerprint(g) && d.plan ? cleanPlan(blocks, d.plan) : {};
  } catch { return {}; }
}

export function usePlanDraft(g: Game, blocks: StadiumBlock[], editable: boolean) {
  const [plan, setPlan] = useState<PlanMap>(() => (editable ? load(g, blocks) : {}));
  const [sel, setSel] = useState<BlockId | null>(null);
  const [whole, setWholeRaw] = useState(false);
  const snap = useRef<PlanMap>({}); // Entwurf vor „ganze Seite“ – zurück bei „nur dieser Block“
  useEffect(() => {
    try {
      if (planList(blocks, plan).length) localStorage.setItem(KEY, JSON.stringify({ fp: fingerprint(g), plan }));
      else localStorage.removeItem(KEY);
    } catch { /* ohne Speicher */ }
  }, [plan]); // eslint-disable-line react-hooks/exhaustive-deps

  const applied = applyPlan(blocks, plan);
  const cur = sel ? blocks.find((b) => b.id === sel) ?? null : null;
  const draft = sel && cur ? copy(plan[sel] ?? cur) : null;
  const targets = draft ? (whole ? sideTargets(applied, draft, true) : [draft]) : [];
  const siblings = (id: BlockId) => blocks.filter((b) => b.id !== id && BLOCK_SIDE[b.id] === BLOCK_SIDE[id]).map((b) => b.id);

  const select = (id: BlockId | null) => { setSel(id); setWholeRaw(false); };
  const setDraft = (b: StadiumBlock) => setPlan((p) => putInPlan(blocks, p, whole ? sideTargets(applyPlan(blocks, p), b, true) : [b]));
  const setWhole = (w: boolean) => {
    if (!draft || w === whole) return;
    if (w) { snap.current = plan; setPlan((p) => putInPlan(blocks, p, sideTargets(applyPlan(blocks, p), draft, true))); }
    else setPlan((p) => {
      const next = { ...p };
      for (const id of siblings(draft.id)) { if (snap.current[id]) next[id] = snap.current[id]; else delete next[id]; }
      return next;
    });
    setWholeRaw(w);
  };
  const reset = () => {
    if (!sel) return;
    setPlan((p) => { const next = { ...p }; delete next[sel]; if (whole) for (const id of siblings(sel)) delete next[id]; return next; });
    setWholeRaw(false);
  };
  const remove = (id: BlockId) => { setPlan((p) => { const next = { ...p }; delete next[id]; return next; }); if (id === sel) setWholeRaw(false); };
  const discard = () => { setPlan({}); setSel(null); setWholeRaw(false); };

  return { plan, applied, list: planList(blocks, plan), sel, select, draft, targets, whole, setWhole, setDraft, reset, remove, discard };
}

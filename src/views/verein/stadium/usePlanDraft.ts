// =============================================================================
// Zustand des Planungsmodus „Stadion ausbauen“ (nur Oberfläche): Entwurf je Block,
// Bearbeitung „nur dieser Block“ / „ganze Seite“ (sideTargets wie bisher; dazu
// VIP-Bereich und Logen auf allen Blöcken der Seite – Wunsch Pascal: ein Klick
// = eine Loge mehr je Block), Ausstattung (Anzeigetafel, Banden, Laufbahn) und
// Bauablauf. Merken im localStorage je Spielstand (Verein + Manager + Startjahr;
// ohne Speicher geht es ohne). Der Spielstand wird erst mit „Bauen“ verändert.
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import { BLOCK_SIDE, vipAllowed } from '../../../engine/stadiumBlocks';
import { loungeLimit } from '../../../engine/stadiumStandard';
import { extrasOf, type StadiumExtras } from '../../../engine/stadiumExtras';
import { yearOf } from '../../../engine/economy';
import { sideTargets } from '../../../game/stadiumGame';
import type { BuildMode } from '../../../game/stadiumBuild';
import type { Game } from '../../../game/state';
import type { BlockId, StadiumBlock } from '../../../types';
import { PlanMap, applyPlan, cleanPlan, planList, putInPlan } from './planModel';

const KEY = 'fm_stadium_plan';
const fingerprint = (g: Game) => `${g.managedClubId}|${g.manager?.name ?? ''}|${(g as unknown as { startYear?: number }).startYear ?? 1975}`;
const copy = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const sameX = (a: StadiumExtras, b: StadiumExtras) => a.board === b.board && a.ads === b.ads && a.track === b.track
  && JSON.stringify([...a.spots].sort()) === JSON.stringify([...b.spots].sort());

interface Stored { fp?: string; plan?: PlanMap; extras?: StadiumExtras | null; mode?: BuildMode }
function load(g: Game, blocks: StadiumBlock[]): Stored {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const d = JSON.parse(raw) as Stored;
    return d.fp === fingerprint(g) ? { plan: d.plan ? cleanPlan(blocks, d.plan) : {}, extras: d.extras ?? null, mode: d.mode } : {};
  } catch { return {}; }
}

export function usePlanDraft(g: Game, blocks: StadiumBlock[], editable: boolean) {
  const club = g.clubs[g.managedClubId];
  const curX = extrasOf(club, yearOf(g.calendar.currentDate));
  const [stored] = useState<Stored>(() => (editable ? load(g, blocks) : {}));
  const [plan, setPlan] = useState<PlanMap>(stored.plan ?? {});
  const [extrasRaw, setExtrasRaw] = useState<StadiumExtras | null>(stored.extras ?? null);
  const [mode, setMode] = useState<BuildMode>(stored.mode ?? 'stages');
  const [sel, setSel] = useState<BlockId | null>(null);
  const [whole, setWholeRaw] = useState(false);
  const snap = useRef<PlanMap>({}); // Entwurf vor „ganze Seite“ – zurück bei „nur dieser Block“
  // Ausstattung im Entwurf nur, wenn sie sich vom Bestand unterscheidet
  const extras = extrasRaw && !sameX(extrasRaw, curX) ? extrasRaw : null;
  useEffect(() => {
    try {
      if (planList(blocks, plan).length || extras) localStorage.setItem(KEY, JSON.stringify({ fp: fingerprint(g), plan, extras, mode }));
      else localStorage.removeItem(KEY);
    } catch { /* ohne Speicher */ }
  }, [plan, extras, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const applied = applyPlan(blocks, plan);
  const cur = sel ? blocks.find((b) => b.id === sel) ?? null : null;
  const draft = sel && cur ? copy(plan[sel] ?? cur) : null;
  const targets = draft ? (whole ? sideTargets(applied, draft, true) : [draft]) : [];
  const siblings = (id: BlockId) => blocks.filter((b) => b.id !== id && BLOCK_SIDE[b.id] === BLOCK_SIDE[id]).map((b) => b.id);

  const select = (id: BlockId | null) => { setSel(id); setWholeRaw(false); };
  /** Ganze Seite: Ränge/Dach/Bauweise wie der Block; VIP an/aus für alle; Logen ± je Block. */
  const sideOf = (p: PlanMap, b: StadiumBlock): StadiumBlock[] => {
    const ap = applyPlan(blocks, p);
    const prev = ap.find((x) => x.id === b.id) ?? b;
    const dL = b.lounges - prev.lounges, vipCh = b.vip !== prev.vip;
    return sideTargets(ap, b, true).map((t) => {
      if (t.id === b.id) return t;
      const sib = ap.find((x) => x.id === t.id) ?? t;
      return { ...t, vip: vipCh ? b.vip && vipAllowed(t.id) : sib.vip, lounges: Math.max(0, Math.min(loungeLimit(t.id, club.stadium.built), sib.lounges + dL)) };
    });
  };
  const setDraft = (b: StadiumBlock) => setPlan((p) => putInPlan(blocks, p, whole ? sideOf(p, b) : [b]));
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
  const discard = () => { setPlan({}); setExtrasRaw(null); setSel(null); setWholeRaw(false); };
  const setExtras = (x: StadiumExtras | null) => setExtrasRaw(x);

  return {
    plan, applied, list: planList(blocks, plan), sel, select, draft, targets, whole, setWhole, setDraft, reset, remove, discard,
    extras, curExtras: curX, shownExtras: extras ?? curX, setExtras, mode, setMode,
  };
}

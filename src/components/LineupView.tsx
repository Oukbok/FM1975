// =============================================================================
// AUFSTELLUNG — Aufbau wie ein moderner Fußballmanager:
//   links Kaderliste (Startelf / Bank / Reserve, sortierbar),
//   Mitte Spielfeld mit Spielerkarten + Ersatzbank, rechts Taktik-Kopf,
//   Kapitän/Standards und Hinweise.
// Ziehen per Zeiger: Liste ↔ Feld ↔ Bank, Tausch auf dem Feld, Positionen
// frei verschieben oder auf feste Positionsfelder einrasten.
// Logik in components/lineup/lineupOps.ts, Raster in data/pitchGrid.ts.
// =============================================================================
import { useRef, useState, type PointerEvent as RPE } from 'react';
import { createPortal } from 'react-dom';
import type { Club, Player, Tactics } from '../types';
import { FORMATIONS, getFormation } from '../data/formations';
import { positionSuitability } from '../engine/positions';
import { autoFillLineup } from '../engine/lineupAI';
import { promiseLineupPrefs } from '../game/seasonPromisesGame';
import type { Game } from '../game/state';
import { eraRules } from '../engine/match/era';
import { DashBox, DashPage } from '../ui/DashPage';
import PlayerModal from './PlayerModal';
import SquadList, { type ListRow } from './lineup/SquadList';
import PitchBoard, { type SlotPreview } from './lineup/PitchBoard';
import { RolesAndHints, TacticHead } from './lineup/LineupSide';
import {
  assignToBench, assignToSlot, effectiveFormation, familiarityOf, lineupHints, moveSlot, placementFor, slotOf, syncLineup, toReserve,
} from './lineup/lineupOps';
import { InfoTip } from '../ui/InfoTip';
import { posGroupClass } from '../ui/positionBadges';

// Loses Game-Interface (Vollstruktur liegt in game/state.ts).
interface G {
  clubs: Record<string, any>;
  players: Record<string, Player>;
  managedClubId: string;
  calendar: { currentDate: string };
  season: string;
}

type Src = { kind: 'slot'; slotId: string } | { kind: 'player'; pid: string };
/** Wo das Ziehen begann: Spielfeld (Verschieben möglich), Bank oder Kaderliste. */
type Origin = 'pitch' | 'bench' | 'list';
interface Drag {
  src: Src; pid: string | null; origin: Origin; touch: boolean; armed: boolean;
  sx: number; sy: number; active: boolean; cx: number; cy: number; scale: number;
  target: string | null; preview: SlotPreview | null;
  /** Ziel ist voll (Ablage wird abgewiesen). */
  full: 'bench' | 'xi' | null;
}
/** Touch: so lange halten, bis das Ziehen beginnt (Kontextmenü erst nach 550 ms). */
const TOUCH_HOLD_MS = 260;

const isAvail = (p: Player | undefined): p is Player => !!p && p.availability === 'available' && !p.injury && !(p.suspensionMatches > 0);

/** Kurztext am Geist: wohin der Spieler beim Loslassen kommt. */
function dropLabel(target: string | null, full: Drag['full']): string {
  if (full === 'bench') return 'Bank voll';
  if (full === 'xi') return 'Startelf voll';
  if (!target) return 'zurück';
  if (target.startsWith('slot:')) return 'Startelf';
  if (target.startsWith('bench:')) return 'Ersatzbank';
  if (target === 'reserve') return 'Reserve';
  if (target === 'xi') return 'Startelf';
  return '';
}

export default function LineupView({ g, onChange }: { g: G; onChange: () => void }) {
  const club: Club = g.clubs[g.managedClubId];
  const t: Tactics = club.tactics;
  const benchSize = eraRules(Number(g.calendar.currentDate.slice(0, 4))).benchSize;
  const [, force] = useState(0);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [profile, setProfile] = useState<string | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const noteTimer = useRef(0);
  const refresh = () => { force((n) => n + 1); onChange(); };

  if (!t.lineupMap) Object.assign(t, autoFillLineup(club, g.players, t, benchSize, promiseLineupPrefs(g as unknown as Game)));
  const map = t.lineupMap!;
  const snap = t.snapToGrid !== false;
  const formation = effectiveFormation(t);
  const squad = (club.playerIds as string[]).map((id) => g.players[id]).filter(Boolean) as Player[];
  const xiIds = new Set(Object.values(map));
  const benchPlayers = (t.substitutes ?? []).map((id) => g.players[id]).filter((p) => p && !xiIds.has(p.id)).slice(0, benchSize);
  const benchIds = new Set(benchPlayers.map((p) => p.id));

  const xiRows: ListRow[] = formation.slots.filter((s) => map[s.id] && g.players[map[s.id]]).map((s) => ({ p: g.players[map[s.id]], pos: s.position, slotId: s.id }));
  const benchRows: ListRow[] = benchPlayers.map((p, i) => ({ p, pos: null, benchIndex: i }));
  const reserveRows: ListRow[] = squad.filter((p) => !xiIds.has(p.id) && !benchIds.has(p.id)).map((p) => ({ p, pos: null }));
  const xiPlayers = xiRows.map((r) => r.p);

  const xiAvg = xiPlayers.length ? Math.round(xiPlayers.reduce((s, p) => s + p.overall, 0) / xiPlayers.length) : 0;
  const suitAvg = xiRows.length ? Math.round(xiRows.reduce((s, r) => s + positionSuitability(r.p, r.pos!), 0) / 11) : 0;
  const familiar = xiRows.filter((r) => r.pos === 'TW' ? r.p.naturalPosition === 'TW' : familiarityOf(r.p, r.pos!) !== 'fremd').length;
  const hints = lineupHints(t, g.players, benchSize);

  const set = (patch: Partial<Tactics>) => { Object.assign(t, patch); refresh(); };

  // ---------------------------------------------------------------- Formation
  const changeFormation = (fid: string) => {
    const f = getFormation(fid);
    const keep = xiPlayers.filter(isAvail);
    const newMap: Record<string, string> = {};
    const used = new Set<string>();
    // Erst die bisherige Startelf bestmöglich verteilen, dann offene Plätze aus Reserve/Bank füllen.
    const fill = (pool: Player[]) => {
      const pairs: { s: string; p: Player; v: number }[] = [];
      for (const s of f.slots) if (!newMap[s.id]) for (const p of pool) if (!used.has(p.id)) pairs.push({ s: s.id, p, v: positionSuitability(p, s.position) });
      pairs.sort((a, b) => b.v - a.v);
      for (const x of pairs) if (!newMap[x.s] && !used.has(x.p.id)) { newMap[x.s] = x.p.id; used.add(x.p.id); }
    };
    fill(keep);
    fill(squad.filter((p) => isAvail(p) && !benchIds.has(p.id)));
    fill(squad.filter(isAvail));
    t.formation = f.id;
    t.slotLayout = undefined;
    t.lineupMap = newMap;
    syncLineup(t, benchSize);
    refresh();
  };
  const doAuto = () => { Object.assign(t, autoFillLineup(club, g.players, t, benchSize, promiseLineupPrefs(g as unknown as Game))); refresh(); };
  const resetLayout = () => { t.slotLayout = undefined; syncLineup(t, benchSize); refresh(); };

  // ---------------------------------------------------------------- Ziehen
  // Maus: Ziehen ab 5 px Bewegung. Touch: erst nach kurzem Halten (langer Druck),
  // vorher gehört die Bewegung dem Scrollen der Liste. Escape bricht ab.
  const fieldPct = (cx: number, cy: number) => {
    const el = document.querySelector('.lu-field');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: ((cx - r.left) / r.width) * 100, y: ((cy - r.top) / r.height) * 100 };
  };
  const benchList = () => (t.substitutes ?? []).filter((id) => !xiIds.has(id)).slice(0, benchSize);

  const compute = (d: Drag) => {
    d.target = null; d.preview = null; d.full = null;
    let key: string | null = null;
    for (const el of document.elementsFromPoint(d.cx, d.cy)) {
      const k = (el as HTMLElement).dataset?.luDrop;
      if (!k) continue;
      if (d.src.kind === 'slot' && k === `slot:${d.src.slotId}` && (el as HTMLElement).classList.contains('lu-slot') && d.origin === 'pitch') continue;
      key = k; break;
    }
    if (!key) return;
    if (key === 'pitch' || (d.src.kind === 'slot' && key === `slot:${d.src.slotId}`)) {
      const pt = fieldPct(d.cx, d.cy);
      if (!pt) return;
      if (d.src.kind === 'slot' && d.origin === 'pitch') {
        const base = getFormation(t.formation).slots.find((s) => s.id === (d.src as { slotId: string }).slotId);
        if (!base || base.position === 'TW') return;
        const p = placementFor(t, d.src.slotId, pt.x, pt.y, snap);
        d.preview = { slotId: d.src.slotId, x: p.x, y: p.y, position: p.position, grid: p.grid, swapWith: null };
        d.target = 'move';
      } else {
        // Aus Liste/Bank aufs Feld: nächstgelegener Slot
        let best = formation.slots[0], bd = Infinity;
        for (const s of formation.slots) { const dd = Math.hypot((s.x - pt.x) * 0.68, (s.y - pt.y) * 1.05); if (dd < bd) { bd = dd; best = s; } }
        if (d.src.kind === 'slot' && best.id === d.src.slotId) return;
        d.target = `slot:${best.id}`;
      }
      if (d.target?.startsWith('slot:') && d.src.kind === 'slot') d.preview = { slotId: d.src.slotId, x: 0, y: 0, position: 'ZM', grid: null, swapWith: d.target.slice(5) };
      return;
    }
    d.target = key;
    if (d.src.kind === 'slot' && key.startsWith('slot:')) d.preview = { slotId: d.src.slotId, x: 0, y: 0, position: 'ZM', grid: null, swapWith: key.slice(5) };
    const pid = d.pid;
    if (!pid) { if (!key.startsWith('slot:')) d.target = null; return; }
    // Bank voll: allgemeine Ablage auf die Bank geht nur, wenn ein Platz frei ist –
    // sonst direkt auf einen Bankspieler ziehen (Tausch).
    const bl = benchList();
    const benchIdx = key.startsWith('bench:') && key !== 'bench:end' ? Number(key.slice(6)) : -1;
    if (!bl.includes(pid) && bl.length >= benchSize && (key === 'bench:end' || (benchIdx >= 0 && !bl[benchIdx]))) d.full = 'bench';
    if (key === 'xi' && !slotOf(t, pid) && formation.slots.every((s) => map[s.id])) d.full = 'xi';
    if (key === 'xi' && slotOf(t, pid)) d.target = null;
  };

  const apply = (d: Drag) => {
    const k = d.target;
    if (!k) return;
    if (d.full) {
      flash(d.full === 'bench' ? `Ersatzbank voll (${benchSize}/${benchSize}) – zum Tauschen direkt auf einen Bankspieler ziehen.` : 'Startelf voll – zum Tauschen direkt auf einen Spieler auf dem Feld ziehen.');
      return;
    }
    const pid = d.pid;
    if (k === 'move' && d.src.kind === 'slot' && d.preview) { moveSlot(t, d.src.slotId, d.preview.x, d.preview.y, snap, benchSize); return; }
    if (k.startsWith('slot:')) {
      const target = k.slice(5);
      if (pid) assignToSlot(t, pid, target, benchSize);
      else if (d.src.kind === 'slot' && map[target]) assignToSlot(t, map[target], d.src.slotId, benchSize);
      return;
    }
    if (!pid) return;
    if (k.startsWith('bench:')) {
      const bl = benchList();
      const i = k === 'bench:end' ? (bl.includes(pid) ? bl.length - 1 : bl.length) : Math.min(Number(k.slice(6)), bl.includes(pid) ? bl.length - 1 : bl.length);
      assignToBench(t, pid, i, benchSize);
    } else if (k === 'reserve') toReserve(t, pid, benchSize);
    else if (k === 'xi' && !slotOf(t, pid)) {
      const p = g.players[pid];
      const open = formation.slots.filter((s) => !map[s.id]).sort((a, b) => positionSuitability(p, b.position) - positionSuitability(p, a.position));
      if (open[0]) assignToSlot(t, pid, open[0].id, benchSize);
    }
  };

  const flash = (text: string) => {
    setNote(text);
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNote(null), 4000);
  };

  const begin = (e: RPE, src: Src, pid: string | null, origin: Origin) => {
    if (e.button !== 0 || dragRef.current) return;
    const touch = e.pointerType === 'touch';
    if (!touch) e.preventDefault();
    const field = document.querySelector('.lu-field') as HTMLElement | null;
    const scale = field ? field.getBoundingClientRect().width / Math.max(1, field.offsetWidth) : 1;
    const d: Drag = { src, pid, origin, touch, armed: !touch, sx: e.clientX, sy: e.clientY, active: false, cx: e.clientX, cy: e.clientY, scale, target: null, preview: null, full: null };
    dragRef.current = d;
    let hold = 0;
    const end = () => {
      window.clearTimeout(hold);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('touchmove', block);
      dragRef.current = null;
      setDrag(null);
    };
    const move = (ev: PointerEvent) => {
      const cur = dragRef.current;
      if (!cur || ev.pointerId !== e.pointerId) return;
      cur.cx = ev.clientX; cur.cy = ev.clientY;
      const dist = Math.hypot(ev.clientX - cur.sx, ev.clientY - cur.sy);
      // Touch vor dem langen Druck: Bewegung = Scrollen → kein Ziehen.
      if (!cur.armed) { if (dist > 8) end(); return; }
      if (!cur.active && dist > (cur.touch ? 6 : 5)) cur.active = true;
      if (!cur.active) return;
      compute(cur);
      setDrag({ ...cur });
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      const cur = dragRef.current;
      const wasArmedTouch = cur?.touch && cur.armed;
      end();
      if (!cur) return;
      if (!cur.active) { if (cur.pid && !wasArmedTouch) setProfile(cur.pid); return; }
      apply(cur);
      refresh();
    };
    const cancel = () => end();
    const key = (ev: KeyboardEvent) => { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); end(); } };
    const block = (ev: TouchEvent) => { if (dragRef.current?.armed && ev.cancelable) ev.preventDefault(); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', key, true);
    window.addEventListener('touchmove', block, { passive: false });
    if (touch) hold = window.setTimeout(() => {
      const cur = dragRef.current;
      if (!cur) return;
      cur.armed = true;
      navigator.vibrate?.(8);
      setDrag({ ...cur });
    }, TOUCH_HOLD_MS);
  };
  const onSlotDown = (e: RPE, slotId: string) => begin(e, { kind: 'slot', slotId }, map[slotId] ?? null, 'pitch');
  const onPlayerDown = (e: RPE, p: Player, origin: Origin = 'list') => {
    const sid = slotOf(t, p.id);
    begin(e, sid ? { kind: 'slot', slotId: sid } : { kind: 'player', pid: p.id }, p.id, origin);
  };

  const hover = drag?.target === 'move' ? null : drag?.target ?? null;
  const dragPid = drag?.pid ?? null;
  // Geister-Karte folgt dem Zeiger, außer beim Verschieben auf dem Feld (dort wandert die Karte selbst).
  const ghost = drag?.active && dragPid && drag.target !== 'move' ? g.players[dragPid] : null;
  const ghostPos = drag?.src.kind === 'slot' ? formation.slots.find((s) => s.id === (drag.src as { slotId: string }).slotId)?.position : undefined;
  const prof = profile ? g.players[profile] : null;
  const libero = FORMATIONS.filter((f) => f.libero), chain = FORMATIONS.filter((f) => !f.libero);

  return (
    <DashPage className={`lu-page ${drag ? 'lu-dragging' : ''} ${drag?.active ? 'lu-drag-live' : ''}`}>
      <DashBox title="Kader" icon="squad" rows={2} flush right={`${squad.length} Spieler`}>
        <SquadList xi={xiRows} bench={benchRows} reserve={reserveRows} benchSize={benchSize} captainId={t.captainId}
          hover={hover} dragId={drag?.active ? dragPid : null} full={drag?.full ?? null} onDown={(e, p) => onPlayerDown(e, p, 'list')} />
      </DashBox>

      <DashBox title="Aufstellung" info="formation" icon="lineup" rows={2} right={
        <span className="lu-tools">
          <select className="lu-formation" value={t.formation} onChange={(e) => changeFormation(e.target.value)} title="Formation">
            <optgroup label="Libero-Systeme">{libero.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</optgroup>
            <optgroup label="Ketten-Systeme">{chain.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</optgroup>
          </select>
          <label className="lu-check" title="Gezogene Spieler rasten auf feste Positionsfelder ein">
            <input type="checkbox" checked={snap} onChange={(e) => set({ snapToGrid: e.target.checked })} /> Fest einrasten<InfoTip k="festEinrasten" />
          </label>
          {t.slotLayout && Object.keys(t.slotLayout).length > 0 && <button className="dchip" onClick={resetLayout} title="Eigene Positionen verwerfen, zurück zur Formation">Standard</button>}
          <button className="dchip" onClick={doAuto}>Auto</button>
        </span>
      }>
        <PitchBoard formation={formation} map={map} players={g.players} captainId={t.captainId} bench={benchPlayers} benchSize={benchSize}
          hover={hover} preview={drag?.preview ?? null} dragSlot={drag?.src.kind === 'slot' ? drag.src.slotId : null} snap={snap}
          reserveCount={reserveRows.length} full={drag?.full ?? null} note={note} lifted={!!ghost} dragPid={dragPid}
          onSlotDown={onSlotDown} onPlayerDown={(e, p) => onPlayerDown(e, p, 'bench')} />
      </DashBox>

      <DashBox title="Taktik" icon="tactics" right={getFormation(t.formation).label}>
        <TacticHead t={t} formation={formation} set={set} xiAvg={xiAvg} suitAvg={suitAvg} familiar={familiar} xiCount={xiRows.length} />
      </DashBox>

      <DashBox title="Kapitän & Standards" info="standards" icon="matchball" right={hints.some((h) => h.level === 'warn') ? <span className="lu-warn-n">{hints.filter((h) => h.level === 'warn').length} Hinweise</span> : undefined}>
        <RolesAndHints t={t} xi={xiPlayers} hints={hints} set={set} />
      </DashBox>

      {ghost && createPortal(
        <div className={`lu-ghost ${drag!.full ? 'no' : ''}`} style={{ left: drag!.cx, top: drag!.cy, transform: `translate(-50%, -50%) scale(${drag!.scale})` }}>
          <span className={`lu-card-pos ${posGroupClass(ghostPos ?? ghost.naturalPosition)}`}>{ghostPos ?? ghost.naturalPosition}</span>
          <span className="lu-ghost-name">{ghost.lastName}</span>
          <span className="lu-ghost-st">{ghost.overall}</span>
          <span className="lu-ghost-to">{dropLabel(drag!.target, drag!.full)}</span>
        </div>, document.body)}
      {prof && <PlayerModal player={prof} club={club} squad={squad} today={g.calendar.currentDate} season={g.season} onClose={() => setProfile(null)} />}
    </DashPage>
  );
}

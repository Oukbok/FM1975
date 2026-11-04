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
import Select from '../ui/Select';

// Loses Game-Interface (Vollstruktur liegt in game/state.ts).
interface G {
  clubs: Record<string, any>;
  players: Record<string, Player>;
  managedClubId: string;
  calendar: { currentDate: string };
  season: string;
}

type Src = { kind: 'slot'; slotId: string } | { kind: 'player'; pid: string };
interface Drag { src: Src; pid: string | null; sx: number; sy: number; active: boolean; cx: number; cy: number; scale: number; target: string | null; preview: SlotPreview | null }

const isAvail = (p: Player | undefined): p is Player => !!p && p.availability === 'available' && !p.injury && !(p.suspensionMatches > 0);

export default function LineupView({ g, onChange }: { g: G; onChange: () => void }) {
  const club: Club = g.clubs[g.managedClubId];
  const t: Tactics = club.tactics;
  const benchSize = eraRules(Number(g.calendar.currentDate.slice(0, 4))).benchSize;
  const [, force] = useState(0);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [profile, setProfile] = useState<string | null>(null);
  const dragRef = useRef<Drag | null>(null);
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
  const fieldPct = (cx: number, cy: number) => {
    const el = document.querySelector('.lu-field');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: ((cx - r.left) / r.width) * 100, y: ((cy - r.top) / r.height) * 100 };
  };

  const compute = (d: Drag) => {
    d.target = null; d.preview = null;
    let key: string | null = null;
    for (const el of document.elementsFromPoint(d.cx, d.cy)) {
      const k = (el as HTMLElement).dataset?.luDrop;
      if (!k) continue;
      if (d.src.kind === 'slot' && k === `slot:${d.src.slotId}` && (el as HTMLElement).classList.contains('lu-slot')) continue;
      key = k; break;
    }
    if (!key) return;
    if (key === 'pitch' || (d.src.kind === 'slot' && key === `slot:${d.src.slotId}`)) {
      const pt = fieldPct(d.cx, d.cy);
      if (!pt) return;
      if (d.src.kind === 'slot') {
        const base = getFormation(t.formation).slots.find((s) => s.id === (d.src as { slotId: string }).slotId);
        if (!base || base.position === 'TW') return;
        const p = placementFor(t, d.src.slotId, pt.x, pt.y, snap);
        d.preview = { slotId: d.src.slotId, x: p.x, y: p.y, position: p.position, grid: p.grid, swapWith: null };
        d.target = 'move';
      } else {
        // Aus der Liste aufs Feld: nächstgelegener Slot
        let best = formation.slots[0], bd = Infinity;
        for (const s of formation.slots) { const dd = Math.hypot((s.x - pt.x) * 0.68, (s.y - pt.y) * 1.05); if (dd < bd) { bd = dd; best = s; } }
        d.target = `slot:${best.id}`;
      }
      return;
    }
    d.target = key;
    if (d.src.kind === 'slot' && key.startsWith('slot:')) d.preview = { slotId: d.src.slotId, x: 0, y: 0, position: 'ZM', grid: null, swapWith: key.slice(5) };
  };

  const apply = (d: Drag) => {
    const k = d.target;
    if (!k) return;
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
      const i = k === 'bench:end' ? Math.min((t.substitutes ?? []).filter((id) => id !== pid).length, benchSize - 1) : Number(k.slice(6));
      assignToBench(t, pid, i, benchSize);
    } else if (k === 'reserve') toReserve(t, pid, benchSize);
    else if (k === 'xi' && !slotOf(t, pid)) {
      const p = g.players[pid];
      const open = formation.slots.filter((s) => !map[s.id]).sort((a, b) => positionSuitability(p, b.position) - positionSuitability(p, a.position));
      if (open[0]) assignToSlot(t, pid, open[0].id, benchSize);
    }
  };

  const begin = (e: RPE, src: Src, pid: string | null) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const field = document.querySelector('.lu-field') as HTMLElement | null;
    const scale = field ? field.getBoundingClientRect().width / Math.max(1, field.offsetWidth) : 1;
    const d: Drag = { src, pid, sx: e.clientX, sy: e.clientY, active: false, cx: e.clientX, cy: e.clientY, scale, target: null, preview: null };
    dragRef.current = d;
    const move = (ev: PointerEvent) => {
      const cur = dragRef.current;
      if (!cur) return;
      cur.cx = ev.clientX; cur.cy = ev.clientY;
      if (!cur.active && Math.hypot(ev.clientX - cur.sx, ev.clientY - cur.sy) > 5) cur.active = true;
      if (!cur.active) return;
      compute(cur);
      setDrag({ ...cur });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const cur = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!cur) return;
      if (!cur.active) { if (cur.pid) setProfile(cur.pid); return; }
      apply(cur);
      refresh();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const onSlotDown = (e: RPE, slotId: string) => begin(e, { kind: 'slot', slotId }, map[slotId] ?? null);
  const onPlayerDown = (e: RPE, p: Player) => {
    const sid = slotOf(t, p.id);
    begin(e, sid ? { kind: 'slot', slotId: sid } : { kind: 'player', pid: p.id }, p.id);
  };

  const hover = drag?.target === 'move' ? null : drag?.target ?? null;
  const dragPid = drag?.pid ?? null;
  const ghost = drag && drag.src.kind === 'player' && dragPid ? g.players[dragPid] : null;
  const prof = profile ? g.players[profile] : null;
  const libero = FORMATIONS.filter((f) => f.libero), chain = FORMATIONS.filter((f) => !f.libero);

  return (
    <DashPage className={`lu-page ${drag ? 'lu-dragging' : ''}`}>
      <DashBox title="Kader" icon="squad" rows={2} flush right={`${squad.length} Spieler`}>
        <SquadList xi={xiRows} bench={benchRows} reserve={reserveRows} benchSize={benchSize} captainId={t.captainId}
          hover={hover} dragId={dragPid} onDown={onPlayerDown} />
      </DashBox>

      <DashBox title="Aufstellung" info="formation" icon="lineup" rows={2} right={
        <span className="lu-tools">
          <Select className="lu-formation" value={t.formation} onChange={(v) => changeFormation(v)} title="Formation">
            <optgroup label="Libero-Systeme">{libero.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</optgroup>
            <optgroup label="Ketten-Systeme">{chain.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</optgroup>
          </Select>
          <label className="lu-check" title="Gezogene Spieler rasten auf feste Positionsfelder ein">
            <input type="checkbox" checked={snap} onChange={(e) => set({ snapToGrid: e.target.checked })} /> Fest einrasten<InfoTip k="festEinrasten" />
          </label>
          {t.slotLayout && Object.keys(t.slotLayout).length > 0 && <button className="dchip" onClick={resetLayout} title="Eigene Positionen verwerfen, zurück zur Formation">Standard</button>}
          <button className="dchip" onClick={doAuto}>Auto</button>
        </span>
      }>
        <PitchBoard formation={formation} map={map} players={g.players} captainId={t.captainId} bench={benchPlayers} benchSize={benchSize}
          hover={hover} preview={drag?.preview ?? null} dragSlot={drag?.src.kind === 'slot' ? drag.src.slotId : null} snap={snap}
          onSlotDown={onSlotDown} onPlayerDown={onPlayerDown} />
      </DashBox>

      <DashBox title="Taktik" icon="tactics" right={getFormation(t.formation).label}>
        <TacticHead t={t} formation={formation} set={set} xiAvg={xiAvg} suitAvg={suitAvg} familiar={familiar} xiCount={xiRows.length} />
      </DashBox>

      <DashBox title="Kapitän & Standards" info="standards" icon="matchball" right={hints.some((h) => h.level === 'warn') ? <span className="lu-warn-n">{hints.filter((h) => h.level === 'warn').length} Hinweise</span> : undefined}>
        <RolesAndHints t={t} xi={xiPlayers} hints={hints} set={set} />
      </DashBox>

      {ghost && createPortal(
        <div className="lu-ghost" style={{ left: drag!.cx, top: drag!.cy, transform: `translate(-50%, -50%) scale(${drag!.scale})` }}>
          <span className="lu-card-pos">{ghost.naturalPosition}</span> {ghost.lastName}
        </div>, document.body)}
      {prof && <PlayerModal player={prof} club={club} squad={squad} today={g.calendar.currentDate} season={g.season} onClose={() => setProfile(null)} />}
    </DashPage>
  );
}

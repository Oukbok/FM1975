// =============================================================================
// Wechsel-Bildschirm rechts: „Spielsystem“ mit Formationswahl, Spielfeld mit
// Gesichtern und „Pos | Stärke“, Bank daneben. Ziehen per Zeiger: Spieler auf
// einen anderen Slot = Positionstausch, Bankspieler auf einen Slot = Wechsel.
// Ein Klick ohne Ziehen wählt aus (wie in der Liste).
// =============================================================================
import { useRef, useState, type PointerEvent as RPE } from 'react';
import PlayerAvatar from '../../../components/PlayerAvatar';
import PitchSVG from '../../../components/lineup/PitchSVG';
import { FORMATIONS } from '../../../data/formations';
import type { MatchSim } from '../../../engine/match/sim';
import { onPitch } from '../../../engine/match/state';
import type { Side } from '../../../engine/match/types';
import { vColor } from '../../../ui/format';
import { draftPlayers, draftStrength, type Draft } from './draft';
import { posGroupClass } from '../../../ui/positionBadges';

export function SystemPitch({ sim, side, d, sel, onPick, onSwap, onFormation }: {
  sim: MatchSim; side: Side; d: Draft; sel: string | null;
  onPick: (key: string) => void; onSwap: (a: string, b: string) => void; onFormation: (id: string) => void;
}) {
  const t = sim.team(side);
  const { benchList } = draftPlayers(sim, side, d);
  const nowOn = new Set(onPitch(t).map((m) => m.id));
  const [drag, setDrag] = useState<{ key: string; x: number; y: number; moved: boolean } | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  /** Zeigerposition → Koordinaten im (skalierten) Bildschirm. */
  const local = (x: number, y: number) => {
    const el = box.current;
    if (!el) return { x, y };
    const r = el.getBoundingClientRect();
    const k = r.width / (el.offsetWidth || r.width);
    return { x: (x - r.left) / k, y: (y - r.top) / k };
  };
  const formations = FORMATIONS.filter((f) => !f.libero || sim.year < 2000 || f.id === d.formation);

  const down = (e: RPE, key: string) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
    setDrag({ key, x: e.clientX, y: e.clientY, moved: false });
  };
  const move = (e: RPE) => {
    if (!drag || !start.current) return;
    const moved = drag.moved || Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 6;
    setDrag({ ...drag, x: e.clientX, y: e.clientY, moved });
  };
  const up = (e: RPE) => {
    if (!drag) return;
    const d0 = drag;
    setDrag(null);
    if (!d0.moved) { onPick(d0.key); return; }
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-dnd]') as HTMLElement | null;
    const target = el?.dataset.dnd;
    if (target && target !== d0.key) onSwap(d0.key, target);
  };
  const ghostOf = drag?.moved ? sim.players[drag.key] : undefined;

  return (
    <div className="tm-sys" ref={box} onPointerMove={move} onPointerUp={up} onPointerCancel={() => setDrag(null)}>
      <div className="tm-sys-head">
        <span className="tm-sec">Spielsystem</span>
        <select value={d.formation} onChange={(e) => onFormation(e.target.value)} aria-label="Formation">
          {formations.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </div>
      <div className="tm-sys-main">
        <div className="lu-pitch tm-sys-pitch">
          <div className="lu-field">
            <PitchSVG />
            {d.slots.map((s) => {
              const id = d.map[s.id];
              const m = id ? t.players.find((x) => x.id === id) : undefined;
              const key = id ?? `slot:${s.id}`;
              return (
                <div key={s.id} className={`tm-sys-slot ${sel === key ? 'sel' : ''} ${m && !nowOn.has(m.id) ? 'rein' : ''} ${drag?.moved && drag.key === key ? 'dragging' : ''}`}
                  style={{ left: `${s.x}%`, top: `${s.y}%` }} data-dnd={key} onPointerDown={(e) => down(e, key)}>
                  {m ? (
                    <>
                      <PlayerAvatar player={m.p} club={t.club} size={64} />
                      <span className="tm-sys-name">{m.p.lastName}</span>
                      <span className="tm-sys-ps">{s.position} | <b style={{ color: vColor(draftStrength(sim, side, d, m.id)) }}>{draftStrength(sim, side, d, m.id)}</b></span>
                    </>
                  ) : <span className="tm-sys-empty">{s.position}<br />frei</span>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="tm-sys-bench">
          <div className="tm-sec">Bank</div>
          {benchList.map((m) => (
            <div key={m.id} className={`tm-sys-b ${sel === m.id ? 'sel' : ''} ${nowOn.has(m.id) ? 'raus' : ''}`} data-dnd={m.id} onPointerDown={(e) => down(e, m.id)}>
              <PlayerAvatar player={m.p} club={t.club} size={44} />
              <span className="tm-sys-name">{m.p.lastName}</span>
              <span className="tm-sys-ps"><span className={posGroupClass(m.p.naturalPosition)}>{m.p.naturalPosition}</span> | {m.p.overall}</span>
            </div>
          ))}
        </div>
      </div>
      {ghostOf && drag && (
        <div className="tm-sys-ghost" style={{ left: local(drag.x, drag.y).x, top: local(drag.x, drag.y).y }}>
          <PlayerAvatar player={ghostOf} club={t.club} size={54} /><span>{ghostOf.lastName}</span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Wechsel-Bildschirm rechts: „Spielsystem“ mit Formationswahl, Spielfeld mit
// Spielerkarten wie Aufstellung › Aufstellung (PitchBoard), Ersatzbank darunter. Ziehen per Zeiger (auch von/zur
// Spielerliste, useDnd): Spieler auf einen anderen Slot = Positionstausch,
// Bankspieler auf einen Slot = Wechsel. Klick ohne Ziehen wählt aus.
// =============================================================================
import type { PointerEvent as RPE } from 'react';
import type { DndState } from '../useDnd';
import FaceThumb from '../../../components/FaceThumb';
import { positionSuitability, suitabilityColor } from '../../../engine/positions';
import type { Position } from '../../../types';
import PitchSVG from '../../../components/lineup/PitchSVG';
import { benchCols } from '../../../components/lineup/PitchBoard';
import { FORMATIONS } from '../../../data/formations';
import type { MatchSim } from '../../../engine/match/sim';
import { onPitch } from '../../../engine/match/state';
import type { MPlayer, Side } from '../../../engine/match/types';
import { vColor } from '../../../ui/format';
import { draftPlayers, draftStrength, type Draft } from './draft';
import { posGroupClass } from '../../../ui/positionBadges';
import Select from '../../../ui/Select';

export function SystemPitch({ sim, side, d, sel, drag, down, onPick, onFormation }: {
  sim: MatchSim; side: Side; d: Draft; sel: string | null;
  /** Gemeinsames Ziehen des Wechsel-Bildschirms (useDnd in ChangesScreen). */
  drag: DndState; down: (e: RPE, key: string) => void;
  onPick: (key: string) => void; onFormation: (id: string) => void;
}) {
  const t = sim.team(side);
  const { benchList } = draftPlayers(sim, side, d);
  const nowOn = new Set(onPitch(t).map((m) => m.id));
  const fieldKeys = new Set(d.slots.map((s) => d.map[s.id] ?? `slot:${s.id}`));
  const formations = FORMATIONS.filter((f) => !f.libero || sim.year < 2000 || f.id === d.formation);

  const card = (m: MPlayer, pos: Position, small: boolean, key: string) => {
    const st = small ? m.p.overall : draftStrength(sim, side, d, m.id);
    const tag = nowOn.has(m.id) ? (fieldKeys.has(key) ? '' : 'raus') : fieldKeys.has(key) ? 'rein' : '';
    return (
      <div className={`lu-card ${small ? 'sm' : ''} ${tag}`} style={{ borderLeftColor: suitabilityColor(positionSuitability(m.p, pos)) }}>
        <div className="lu-card-top">
          <span className={`lu-card-pos ${posGroupClass(pos)}`}>{pos}</span>
          {t.captainId === m.id && <span className="lu-cap" title="Kapitän">K</span>}
          <span className="lu-card-suit" title="Stärke auf dieser Position" style={{ color: vColor(st) }}>{st}</span>
        </div>
        {!small && <FaceThumb p={m.p} size={40} className="lu-card-head" />}
        <div className="lu-card-name">{small && <FaceThumb p={m.p} size={16} className="lu-card-face" />}{m.p.lastName}</div>
      </div>
    );
  };
  const benchSize = benchCols(Math.max(benchList.length, 1));

  return (
    <div className="tm-sys">
      <div className="tm-sys-head">
        <span className="tm-sec">Spielsystem</span>
        <Select value={d.formation} onChange={(v) => onFormation(v)} aria-label="Formation">
          {formations.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </Select>
      </div>
      {/* Wunsch Pascal: gleicher Aufbau wie Aufstellung › Aufstellung – Feld mit Karten, Ersatzbank darunter. */}
      <div className="lu-board tm-sys-board">
        <div className="lu-pitch-area">
          <div className="lu-pitch">
            <div className="lu-field" data-dnd="pitch">
              <PitchSVG />
              {d.slots.map((s) => {
                const id = d.map[s.id];
                const m = id ? t.players.find((x) => x.id === id) : undefined;
                const key = id ?? `slot:${s.id}`;
                return (
                  <div key={s.id} className={`lu-slot tm-sys-slot ${s.position === 'TW' ? 'gk' : ''} ${sel === key ? 'sel' : ''} ${drag?.over === key ? 'over' : ''} ${drag && drag.key === key ? 'dragging' : ''}`}
                    style={{ left: `${s.x}%`, top: `${s.y}%` }} data-dnd={key} onPointerDown={(e) => down(e, key)} onClick={() => onPick(key)}>
                    {m ? card(m, s.position, false, key)
                      : <div className="lu-card empty"><div className="lu-card-top"><span className={`lu-card-pos ${posGroupClass(s.position)}`}>{s.position}</span></div><div className="lu-card-name dim">frei</div></div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className={`lu-bench tm-sys-bench ${drag ? 'live' : ''} ${drag?.over === 'bench' && fieldKeys.has(drag.key) ? 'no' : ''}`} data-dnd="bench">
          <div className="lu-bench-head"><span>Ersatzbank</span><span className="lu-sec-n">{benchList.length}</span></div>
          <div className="lu-bench-row" style={{ gridTemplateColumns: `repeat(${benchSize}, minmax(0, 1fr))` }}>
            {benchList.map((m) => (
              <div key={m.id} className={`lu-bslot tm-sys-b ${sel === m.id ? 'sel' : ''} ${drag?.over === m.id ? 'over' : ''} ${drag?.key === m.id ? 'dragging' : ''}`}
                data-dnd={m.id} onPointerDown={(e) => down(e, m.id)} onClick={() => onPick(m.id)}>
                {card(m, m.p.naturalPosition, true, m.id)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Wechsel-Bildschirm rechts: „Spielsystem“ mit Formationswahl, Spielfeld mit
// Gesichtern und „Pos | Stärke“, Bank daneben. Ziehen per Zeiger (auch von/zur
// Spielerliste, useDnd): Spieler auf einen anderen Slot = Positionstausch,
// Bankspieler auf einen Slot = Wechsel. Klick ohne Ziehen wählt aus.
// =============================================================================
import type { PointerEvent as RPE } from 'react';
import type { DndState } from '../useDnd';
import PlayerAvatar from '../../../components/PlayerAvatar';
import PitchSVG from '../../../components/lineup/PitchSVG';
import { FORMATIONS } from '../../../data/formations';
import type { MatchSim } from '../../../engine/match/sim';
import { onPitch } from '../../../engine/match/state';
import type { Side } from '../../../engine/match/types';
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

  return (
    <div className="tm-sys">
      <div className="tm-sys-head">
        <span className="tm-sec">Spielsystem</span>
        <Select value={d.formation} onChange={(v) => onFormation(v)} aria-label="Formation">
          {formations.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </Select>
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
                <div key={s.id} className={`tm-sys-slot ${sel === key ? 'sel' : ''} ${drag?.over === key ? 'over' : ''} ${m && !nowOn.has(m.id) ? 'rein' : ''} ${drag && drag.key === key ? 'dragging' : ''}`}
                  style={{ left: `${s.x}%`, top: `${s.y}%` }} data-dnd={key} onPointerDown={(e) => down(e, key)} onClick={() => onPick(key)}>
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
        <div className={`tm-sys-bench ${drag ? 'live' : ''} ${drag?.over === 'bench' && fieldKeys.has(drag.key) ? 'no' : ''}`} data-dnd="bench">
          <div className="tm-sec">Bank</div>
          {benchList.map((m) => (
            <div key={m.id} className={`tm-sys-b ${sel === m.id ? 'sel' : ''} ${drag?.over === m.id ? 'over' : ''} ${nowOn.has(m.id) ? 'raus' : ''}`} data-dnd={m.id} onPointerDown={(e) => down(e, m.id)} onClick={() => onPick(m.id)}>
              <PlayerAvatar player={m.p} club={t.club} size={44} />
              <span className="tm-sys-name">{m.p.lastName}</span>
              <span className="tm-sys-ps"><span className={posGroupClass(m.p.naturalPosition)}>{m.p.naturalPosition}</span> | {m.p.overall}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

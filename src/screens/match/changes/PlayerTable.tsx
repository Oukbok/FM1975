// =============================================================================
// Wechsel-Bildschirm, Reiter „Aufstellung“ links: Spielerliste Startelf + Bank
// (Nr, Pos, B.Pos, Name, Note, Stärke, Fitness, Kraft, Form, Moral, Potenzial).
// Klick wählt einen Spieler, zweiter Klick tauscht (Wechsel oder Positionstausch);
// Zeilen lassen sich auch ziehen – auf eine andere Zeile, einen Slot oder Bankspieler.
// =============================================================================
import { FitnessIcon, FormIcon, FreshnessIcon, MoraleIcon, fitness100, form100, playerMorale100 } from '../../../components/status';
import Icon from '../../../components/Icon';
import { grade } from '../../../engine/match/finish';
import type { MatchSim } from '../../../engine/match/sim';
import { onPitch } from '../../../engine/match/state';
import type { MPlayer, Side } from '../../../engine/match/types';
import { ScoutStars } from '../../../views/shared';
import { vColor } from '../../../ui/format';
import { fmtGrade, gradeCls, gradeEarly } from '../board/LineupBoard';
import { draftPlayers, draftStrength, playerSlot, type Draft } from './draft';
import { posGroupClass } from '../../../ui/positionBadges';
import type { PointerEvent as RPE } from 'react';
import type { DndState } from '../useDnd';

export function PlayerTable({ sim, side, d, sel, drag, down, onPick, onPlayer }: {
  sim: MatchSim; side: Side; d: Draft; sel: string | null; drag: DndState; down: (e: RPE, key: string) => void;
  onPick: (id: string) => void; onPlayer: (id: string) => void;
}) {
  const { field, benchList } = draftPlayers(sim, side, d);
  const nowOn = new Set(onPitch(sim.team(side)).map((m) => m.id));
  const early = gradeEarly(sim);
  const row = (m: MPlayer, onField: boolean) => {
    const sid = playerSlot(d, m.id);
    const pos = sid ? d.slots.find((s) => s.id === sid)?.position ?? m.pos : null;
    const tag = onField && !nowOn.has(m.id) ? 'rein' : !onField && nowOn.has(m.id) ? 'raus' : null;
    const st = onField ? draftStrength(sim, side, d, m.id) : Math.round(m.p.overall);
    const playing = nowOn.has(m.id) || m.minuteIn > 0;
    return (
      <div key={m.id} className={`tm-cs-row ${onField ? 'field' : 'bench'} ${sel === m.id ? 'sel' : ''} ${tag ?? ''} ${drag?.over === m.id ? 'over' : ''} ${drag?.key === m.id ? 'dragging' : ''}`}
        data-dnd={m.id} onPointerDown={(e) => down(e, m.id)} role="button" tabIndex={0} onClick={() => onPick(m.id)} onKeyDown={(e) => { if (e.key === 'Enter') onPick(m.id); }}>
        <span className="tm-nr">{m.p.shirtNumber || ''}</span>
        <span className={`tm-pos ${onField ? posGroupClass(pos) : ''}`}>{onField ? pos : 'Bank'}</span>
        <span className={`tm-dim ${posGroupClass(m.p.naturalPosition)}`}>{m.p.naturalPosition}</span>
        <span className="tm-namecell">
          <button type="button" className="tm-plink tm-name" onClick={(e) => { e.stopPropagation(); onPlayer(m.id); }}>{m.p.firstName?.[0]}. {m.p.lastName}</button>
          {tag && <span className={`tm-tag ${tag}`}>{tag}</span>}
          {m.injured && <Icon name="injury" size={18} />}
          {m.yellow > 0 && <i className="ms-card y" />}
        </span>
        <span className={early || !playing ? 'tm-dim' : `ms-grade ${gradeCls(grade(sim, m))}`}>{early || !playing ? '–' : fmtGrade(grade(sim, m))}</span>
        <span style={{ color: vColor(st) }}>{st}</span>
        <span><FitnessIcon value={fitness100(m.p)} size={20} /></span>
        <span><FreshnessIcon kind="kraft" value={Math.round(m.energy)} size={20} /></span>
        <span><FormIcon value={form100(m.p)} size={20} /></span>
        <span><MoraleIcon value={playerMorale100(m.p)} size={20} /></span>
        <span className="tm-pot"><ScoutStars p={m.p} /></span>
      </div>
    );
  };
  return (
    <div className="tm-cs-table">
      <div className="tm-cs-row head">
        <span>Nr</span><span>Pos</span><span>B.Pos</span><span>Name</span><span>Note</span><span>Stä</span>
        <span>Fit</span><span>Kraft</span><span>Form</span><span>Moral</span><span>Potenzial</span>
      </div>
      <div className="tm-cs-list">
        {field.map((m) => row(m, true))}
        <div className="tm-lt-sec">Ersatzbank</div>
        {benchList.map((m) => row(m, false))}
      </div>
    </div>
  );
}

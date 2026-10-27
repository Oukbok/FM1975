import { useState } from 'react';
import { scoutRangeText } from '../../engine/scouting';
import { minYouthMoveAge } from '../../engine/youthScouting';
import { yearOf } from '../../engine/economy';
import { Game } from '../../game/state';
import { approachedThisSeason, scoutedYouth } from '../../game/youthMarket';
import { DashBox, Empty } from '../../ui/DashPage';
import { YouthModal } from '../kader/YouthModal';

// =============================================================================
// Talente anderer Vereine (Jugend-Scouting): Sichtungen deiner Scouts.
// =============================================================================
export function YouthScoutBox({ g, onChange }: { g: Game; onChange: () => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const list = scoutedYouth(g).slice(0, 30);
  const year = yearOf(g.calendar.currentDate);
  const minAge = minYouthMoveAge(year);
  const p = sel ? g.youthPlayers[sel] : null;
  const club = p ? g.clubs[p.clubId] : null;
  return (<>
    <DashBox title="Talente anderer Vereine" icon="youth" right={`${list.length} gesichtet`}>
      {list.length ? list.map((y) => (
        <div key={y.id} className="dlist-row clickable" onClick={() => setSel(y.id)}>
          <span className="grow">
            <b>{y.fullName}</b> <span className="muted">· {y.naturalPosition} · {y.age} J. · {g.clubs[y.clubId]?.shortName}</span>
          </span>
          <span className="meta" style={{ color: 'var(--yellow)' }}>{scoutRangeText(y)}</span>
          {approachedThisSeason(g, y.id) && <span className="meta">angesprochen</span>}
          {y.age < minAge && <span className="meta">zu jung</span>}
        </div>
      )) : <Empty icon="youth">Deine Scouts haben noch keine fremden Talente gesichtet. Mehr Scouting-Personal erweitert die Reichweite.</Empty>}
      <div className="dnote mt8">Die Sichtungen wechseln monatlich. Mehr Scouts = mehr Akademien im Blick.</div>
    </DashBox>
    {p && club && <YouthModal g={g} player={p} club={club} foreign onClose={() => setSel(null)} onChange={onChange} />}
  </>);
}

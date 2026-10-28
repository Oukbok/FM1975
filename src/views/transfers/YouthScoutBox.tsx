import { useState } from 'react';
import { scoutRangeText } from '../../engine/scouting';
import { minYouthMoveAge } from '../../engine/youthScouting';
import { yearOf } from '../../engine/economy';
import { Game } from '../../game/state';
import { approachedThisSeason, scoutedYouth } from '../../game/youthMarket';
import { prospectFee, prospectMinAge, signProspect, visibleProspects } from '../../game/legendProspects';
import { DashBox, Empty } from '../../ui/DashPage';
import { fmtPrice } from '../../ui/format';
import { YouthModal } from '../kader/YouthModal';

// =============================================================================
// Talente anderer Vereine (Jugend-Scouting): Sichtungen deiner Scouts, dazu
// Geheimtipps bei Amateurvereinen und Auslandstalente (Legenden).
// =============================================================================
export function YouthScoutBox({ g, onChange }: { g: Game; onChange: () => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const list = scoutedYouth(g).slice(0, 30);
  const tips = visibleProspects(g);
  const year = yearOf(g.calendar.currentDate);
  const minAge = minYouthMoveAge(year);
  const p = sel ? g.youthPlayers[sel] : null;
  const club = p ? g.clubs[p.clubId] : null;
  const sign = (id: string) => { setMsg(signProspect(g, id)); onChange(); };
  return (<>
    <DashBox title="Talente anderer Vereine" icon="youth" right={`${list.length + tips.length} gesichtet`}>
      {tips.map((x) => {
        const y = x.player;
        const tooYoung = y.age < prospectMinAge(x);
        const asked = approachedThisSeason(g, y.id);
        return (
          <div key={y.id} className="dlist-row">
            <span className="grow">
              <b>{y.fullName}</b> <span className="muted">· {y.naturalPosition} · {y.age} J. · {x.from}</span>
            </span>
            <span className="meta" style={{ color: 'var(--accent)' }}>{x.kind === 'amateur' ? 'Geheimtipp' : 'Ausland'}</span>
            <span className="meta" style={{ color: 'var(--yellow)' }}>{scoutRangeText(y)}</span>
            {tooYoung || asked
              ? <span className="meta">{tooYoung ? 'zu jung' : 'angesprochen'}</span>
              : <button className="btn-sm" onClick={() => sign(y.id)}>Holen ({fmtPrice(prospectFee(x, year))})</button>}
          </div>
        );
      })}
      {list.map((y) => (
        <div key={y.id} className="dlist-row clickable" onClick={() => setSel(y.id)}>
          <span className="grow">
            <b>{y.fullName}</b> <span className="muted">· {y.naturalPosition} · {y.age} J. · {g.clubs[y.clubId]?.shortName}</span>
          </span>
          <span className="meta" style={{ color: 'var(--yellow)' }}>{scoutRangeText(y)}</span>
          {approachedThisSeason(g, y.id) && <span className="meta">angesprochen</span>}
          {y.age < minAge && <span className="meta">zu jung</span>}
        </div>
      ))}
      {!list.length && !tips.length && <Empty icon="youth">Deine Scouts haben noch keine fremden Talente gesichtet. Mehr Scouting-Personal erweitert die Reichweite.</Empty>}
      {msg && <div className="dnote mt8" style={{ color: 'var(--text-1)' }}>{msg}</div>}
      <div className="dnote mt8">Die Sichtungen wechseln monatlich. Mehr Scouts = mehr Akademien und Auslandstalente im Blick. Geheimtipps bei Amateurvereinen hört jeder – wer schnell ist, bekommt sie.</div>
    </DashBox>
    {p && club && <YouthModal g={g} player={p} club={club} foreign onClose={() => setSel(null)} onChange={onChange} />}
  </>);
}

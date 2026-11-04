// Reiter „Kader“: Kadertabelle (Klick = Spielerprofil, Verhandeln) | Kaderstruktur | Vertragslage
import { useState } from 'react';
import { activeTalks, talkBlocker } from '../../game/transferTalks';
import { Player } from '../../types';
import { DashBox, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtPrice, vColor } from '../../ui/format';
import { GROUP_DE, ScoutStars, avg, groupOf, monthsUntil, scoutMid } from '../../views/shared';
import { ClubTabProps } from './shared';
import PosBadge from '../PosBadge';

type Sort = 'pos' | 'ovr' | 'pot' | 'age' | 'val' | 'ctr';
const GROUP_ORDER = ['GK', 'DEF', 'MID', 'ATT'];
const IDEAL: Record<string, number> = { GK: 2, DEF: 6, MID: 6, ATT: 4 };

export default function SquadTab({ g, d, openPlayer, onTalk, talkErr }: ClubTabProps & { onTalk: (id: string) => void; talkErr: string | null }) {
  const [sort, setSort] = useState<Sort>('pos');
  const [grp, setGrp] = useState('all');
  const today = g.calendar.currentDate;
  const all = d.squad;
  if (!all.length) {
    return (
      <DashBox title="Kader" icon="squad" span={3} rows={2}>
        <Empty icon="squad">Für {d.name} liegt kein detaillierter Kader vor. Der Verein spielt in einer rein simulierten Liga – die Scouts kennen nur die Gesamtstärke (Ø {d.strength}).</Empty>
      </DashBox>
    );
  }
  const cmp = (a: Player, b: Player) => {
    switch (sort) {
      case 'pos': return GROUP_ORDER.indexOf(groupOf(a)) - GROUP_ORDER.indexOf(groupOf(b)) || b.overall - a.overall;
      case 'pot': return scoutMid(b) - scoutMid(a) || b.overall - a.overall;
      case 'age': return a.age - b.age;
      case 'val': return b.contract.transferValue - a.contract.transferValue;
      case 'ctr': return a.contract.expiryDate.localeCompare(b.contract.expiryDate);
      default: return b.overall - a.overall;
    }
  };
  const list = all.filter((p) => grp === 'all' || groupOf(p) === grp).sort(cmp);
  const Th = ({ k, cls, children }: { k: Sort; cls?: string; children: React.ReactNode }) => (
    <th className={`sortable ${cls ?? ''} ${sort === k ? 'sorted' : ''}`} onClick={() => setSort(k)}>{children}</th>
  );
  const running = new Set(activeTalks(g).map((t) => t.playerId));
  const expiring = all.filter((p) => monthsUntil(today, p.contract.expiryDate) <= 12).sort((a, b) => b.overall - a.overall);
  const unhappy = all.filter((p) => p.transferListed || p.contract.satisfaction < 60).sort((a, b) => b.overall - a.overall);

  return (
    <>
      <DashBox title={`Kader (${all.length})`} icon="squad" span={2} rows={2} flush
        right={<span className="dbtnrow">
          <button className={`dchip ${grp === 'all' ? 'on' : ''}`} onClick={() => setGrp('all')}>Alle</button>
          {GROUP_ORDER.map((k) => <button key={k} className={`dchip ${grp === k ? 'on' : ''}`} onClick={() => setGrp(k)}>{GROUP_DE[k]}</button>)}
        </span>}>
        <table className="dtable rl-players">
          <thead><tr>
            <th className="ctr">#</th><th>Name</th><Th k="pos" cls="ctr">Pos</Th><Th k="age" cls="num">Alter</Th>
            <Th k="ovr" cls="num">Stärke</Th><Th k="pot">Potenzial</Th><Th k="val" cls="num">Marktwert</Th><Th k="ctr" cls="num">Vertrag</Th>
            {!d.isPlayerClub && <th />}
          </tr></thead>
          <tbody>
            {list.map((p) => {
              const block = running.has(p.id) ? null : talkBlocker(g, p);
              return (
                <tr key={p.id} data-pid={p.id} className="clickable" onClick={() => openPlayer(p.id)}>
                  <td className="ctr muted">{p.shirtNumber}</td>
                  <td className="nowrap rl-name">{p.fullName}{p.transferListed && <span className="cmx-tag">Transferliste</span>}</td>
                  <td className="ctr"><PosBadge p={p} /></td>
                  <td className="num">{p.age}</td>
                  <td className="num"><b style={{ color: vColor(p.overall) }}>{p.overall}</b></td>
                  <td className="nowrap"><ScoutStars p={p} /></td>
                  <td className="num">{fmtPrice(p.contract.transferValue)}</td>
                  <td className="num muted">{monthsUntil(today, p.contract.expiryDate)} M.</td>
                  {!d.isPlayerClub && (
                    <td className="num" onClick={(e) => e.stopPropagation()}>
                      <button className={`dchip ${block ? '' : 'on'}`} title={block ?? 'Transferverhandlung starten'} disabled={!!block} onClick={() => onTalk(p.id)}>
                        {running.has(p.id) ? 'Fortsetzen' : 'Verhandeln'}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </DashBox>

      <DashBox title="Kaderstruktur" icon="dashKader">
        <div className="dkpis">
          <Kpi value={Math.round(avg(all.map((p) => p.overall)))} label="Ø Stärke" color={vColor(avg(all.map((p) => p.overall)))} />
          <Kpi value={avg(all.map((p) => p.age)).toFixed(1)} label="Ø Alter" />
        </div>
        {GROUP_ORDER.map((k) => {
          const xs = all.filter((p) => groupOf(p) === k);
          return <Meter key={k} label={`${GROUP_DE[k]} (${xs.length})`} value={xs.length} max={IDEAL[k] + 2}
            text={xs.length ? `Ø ${Math.round(avg(xs.map((p) => p.overall)))}` : '–'} color={xs.length < IDEAL[k] ? 'var(--red)' : undefined} />;
        })}
        <KV k="Unter 23 Jahren" v={all.filter((p) => p.age < 23).length} />
        <KV k="Über 30 Jahre" v={all.filter((p) => p.age > 30).length} />
      </DashBox>

      <DashBox title="Vertragslage" icon="contracts" right={d.isPlayerClub ? undefined : 'Gelegenheiten'}>
        <div className="dsec">Vertrag endet in 12 Monaten ({expiring.length})</div>
        {expiring.length ? expiring.slice(0, 4).map((p) => (
          <div key={p.id} data-pid={p.id} className="dlist-row clickable" onClick={() => openPlayer(p.id)}>
            <PosBadge p={p} compact /><span className="grow">{p.fullName}</span>
            <span className="val" style={{ color: vColor(p.overall) }}>{p.overall}</span>
          </div>
        )) : <div className="dnote">Niemand.</div>}
        <div className="dsec">Wechselwillig oder auf der Transferliste ({unhappy.length})</div>
        {unhappy.length ? unhappy.slice(0, 4).map((p) => (
          <div key={p.id} data-pid={p.id} className="dlist-row clickable" onClick={() => openPlayer(p.id)}>
            <PosBadge p={p} compact /><span className="grow">{p.fullName}</span>
            <span className="val" style={{ color: vColor(p.overall) }}>{p.overall}</span>
          </div>
        )) : <div className="dnote">Alle Spieler sind zufrieden.</div>}
        {talkErr && <div className="dnote mt8" style={{ color: 'var(--red)', fontWeight: 700 }}>{talkErr}</div>}
      </DashBox>
    </>
  );
}

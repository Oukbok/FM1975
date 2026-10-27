import PlayerModal from '../../components/PlayerModal';
import { formIndicator } from '../../engine/form';
import { Game } from '../../game/state';
import { Player, renderStars } from '../../types';
import { DashBox, DashPage, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtDM, vColor } from '../../ui/format';
import { GROUP_DE, PlayerRow, avg, groupOf } from '../shared';
import { useState } from 'react';

// =============================================================================
// KADER — sortierbare Kadertabelle, Kaderstruktur, Verfügbarkeit
// =============================================================================
export type SquadSort = 'pos' | 'ovr' | 'pot' | 'form' | 'fri' | 'fit' | 'age' | 'apps' | 'goals';

const MORALE_DE: Record<string, string> = { very_low: 'sehr schlecht', low: 'schlecht', okay: 'okay', good: 'gut', excellent: 'super' };
const GROUP_ORDER = ['GK', 'DEF', 'MID', 'ATT'];

export function SquadView({ g }: { g: Game }) {
  const [sel, setSel] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SquadSort>('pos');
  const [grp, setGrp] = useState<string>('all');
  const club = g.clubs[g.managedClubId];
  const all = club.playerIds.map((id) => g.players[id]).filter(Boolean);
  const cmp = (a: Player, b: Player): number => {
    switch (sortBy) {
      case 'pos': return (GROUP_ORDER.indexOf(groupOf(a)) - GROUP_ORDER.indexOf(groupOf(b))) || (b.overall - a.overall);
      case 'pot': return (b.potentialStars - a.potentialStars) || (b.overall - a.overall);
      case 'form': return b.form - a.form;
      case 'fri': return (a.frische ?? 100) - (b.frische ?? 100);
      case 'fit': return b.attributes.fitness - a.attributes.fitness;
      case 'age': return a.age - b.age;
      case 'apps': return b.seasonStats.appearances - a.seasonStats.appearances;
      case 'goals': return b.seasonStats.goals - a.seasonStats.goals;
      default: return b.overall - a.overall;
    }
  };
  const squad = all.filter((p) => grp === 'all' || groupOf(p) === grp).sort(cmp);
  const p = sel ? g.players[sel] : null;

  const Th = ({ k, children, cls }: { k: SquadSort; children: React.ReactNode; cls?: string }) => (
    <th className={`sortable ${cls ?? ''} ${sortBy === k ? 'sorted' : ''}`} onClick={() => setSortBy(k)}>{children}</th>
  );

  const unavailable = all.filter((x) => x.availability === 'injured' || x.suspensionMatches > 0);
  const tired = [...all].filter((x) => (x.frische ?? 100) < 80).sort((a, b) => (a.frische ?? 100) - (b.frische ?? 100)).slice(0, 5);
  const wages = all.reduce((s, x) => s + x.contract.weeklyWage, 0);

  return (
    <DashPage>
      <DashBox title={`Kader (${all.length})`} icon="squad" span={2} rows={2} flush
        right={<span className="dbtnrow">
          <button className={`dchip ${grp === 'all' ? 'on' : ''}`} onClick={() => setGrp('all')}>Alle</button>
          {GROUP_ORDER.map((k) => <button key={k} className={`dchip ${grp === k ? 'on' : ''}`} onClick={() => setGrp(k)}>{GROUP_DE[k]}</button>)}
        </span>}>
        <table className="dtable">
          <thead><tr>
            <th className="ctr">#</th><th>Name</th><Th k="pos" cls="ctr">Pos</Th><Th k="age" cls="num">Alter</Th>
            <Th k="ovr" cls="num">Stärke</Th><Th k="pot">Potenzial</Th><Th k="form" cls="num">Form</Th>
            <Th k="fri" cls="num">Frische</Th><Th k="fit" cls="num">Fitness</Th><th>Moral</th>
            <Th k="apps" cls="num">Sp.</Th><Th k="goals" cls="num">Tore</Th><th>Status</th>
          </tr></thead>
          <tbody>
            {squad.map((pl) => {
              const fi = formIndicator(pl.form);
              const fr = Math.round(pl.frische ?? 100);
              return (
                <tr key={pl.id} className="clickable" onClick={() => setSel(pl.id)}>
                  <td className="ctr muted">{pl.shirtNumber}</td>
                  <td className="nowrap" style={{ fontWeight: 700 }}>{pl.fullName}</td>
                  <td className="ctr"><span className="pos-badge">{pl.naturalPosition}</span></td>
                  <td className="num">{pl.age}</td>
                  <td className="num"><b style={{ color: vColor(pl.overall) }}>{pl.overall}</b></td>
                  <td className="nowrap"><span className="stars">{renderStars(pl.potentialStars)}</span></td>
                  <td className="num nowrap" style={{ color: fi.color, fontWeight: 700 }} title={fi.label}>{fi.arrow} {Math.round(pl.form)}</td>
                  <td className="num" style={{ color: vColor(fr), fontWeight: 700 }}>{fr}</td>
                  <td className="num" style={{ color: vColor(pl.attributes.fitness) }}>{Math.round(pl.attributes.fitness)}</td>
                  <td className="muted">{MORALE_DE[pl.morale] ?? pl.morale}</td>
                  <td className="num">{pl.seasonStats.appearances}</td>
                  <td className="num">{pl.seasonStats.goals}</td>
                  <td className={`nowrap ${pl.availability === 'injured' ? 'red' : pl.suspensionMatches > 0 ? 'orange-text' : 'green'}`}>
                    {pl.availability === 'injured' ? `verletzt (${pl.injury?.daysRemaining} T.)` : pl.suspensionMatches > 0 ? `gesperrt (${pl.suspensionMatches})` : 'fit'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DashBox>

      <DashBox title="Kaderstruktur" icon="dashKader">
        <div className="dkpis">
          <Kpi value={Math.round(avg(all.map((x) => x.overall)))} label="Ø Stärke" />
          <Kpi value={avg(all.map((x) => x.age)).toFixed(1)} label="Ø Alter" />
        </div>
        {GROUP_ORDER.map((k) => {
          const xs = all.filter((x) => groupOf(x) === k);
          return <KV key={k} k={`${GROUP_DE[k]} (${xs.length})`} v={xs.length ? `Ø ${Math.round(avg(xs.map((x) => x.overall)))}` : '–'} />;
        })}
        <KV k="Gehälter pro Woche" v={fmtDM(wages)} strong />
        <Meter label="Unter 23 Jahren" value={all.filter((x) => x.age < 23).length} max={Math.max(1, all.length)} text={`${all.filter((x) => x.age < 23).length}`} />
      </DashBox>

      <DashBox title="Verfügbarkeit" icon="training" right={unavailable.length ? `${unavailable.length} fehlen` : 'alle fit'}>
        {unavailable.length ? <>
          <div className="dsec">Ausfälle</div>
          {unavailable.map((x) => (
            <PlayerRow key={x.id} p={x} onClick={() => setSel(x.id)} color="var(--red)"
              value={x.availability === 'injured' ? `${x.injury?.daysRemaining} T.` : `${x.suspensionMatches} Sp.`}
              sub={x.availability === 'injured' ? 'verletzt' : 'gesperrt'} />
          ))}
        </> : null}
        <div className="dsec">Wenig Frische</div>
        {tired.length ? tired.map((x) => <PlayerRow key={x.id} p={x} value={Math.round(x.frische ?? 100)} onClick={() => setSel(x.id)} />)
          : <Empty icon="training">Alle Spieler sind ausgeruht.</Empty>}
      </DashBox>

      {p && <PlayerModal player={p} club={club} squad={all} today={g.calendar.currentDate} season={g.season} onClose={() => setSel(null)} />}
    </DashPage>
  );
}

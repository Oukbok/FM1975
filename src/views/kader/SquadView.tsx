import { autoFillLineup } from '../../engine/lineupAI';
import { promiseLineupPrefs } from '../../game/seasonPromisesGame';
import { eraRules } from '../../engine/match/era';
import PlayerModal from '../../components/PlayerModal';
import { Game } from '../../game/state';
import { Player } from '../../types';
import { DashBox, DashPage, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtDM, vColor, fmtWage, wageUnit } from '../../ui/format';
import { PlayerFitness, PlayerForm, PlayerFreshness, PlayerMorale, MORALE_100, playerMorale100 } from '../../components/status';
import { InfoTip } from '../../ui/InfoTip';
import { GROUP_DE, PlayerRow, ScoutStars, avg, groupOf, scoutMid } from '../shared';
import { useState } from 'react';
import { SubTabsPage, useSubTab } from '../../ui/SubTabs';
import { demandFor, offerContract } from '../../game/contracts';
import Icon from '../../components/Icon';
import { PlayerTalkModal } from './talk/PlayerTalkModal';
import PosBadge from '../../components/PosBadge';
import Select from '../../ui/Select';
import { setShirtNumber } from '../../game/squads';

// =============================================================================
// KADER — sortierbare Kadertabelle, Kaderstruktur, Verfügbarkeit
// =============================================================================
export type SquadSort = 'pos' | 'ovr' | 'pot' | 'form' | 'fri' | 'fit' | 'mor' | 'age' | 'apps' | 'goals';

const GROUP_ORDER = ['GK', 'DEF', 'MID', 'ATT'];

export function SquadView({ g, onChange }: { g: Game; onChange?: () => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const [talk, setTalk] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [sortBy, setSortBy] = useState<SquadSort>('pos');
  const [grp, setGrp] = useSubTab<string>('kader.uebersicht', 'all');
  const club = g.clubs[g.managedClubId];
  const all = club.playerIds.map((id) => g.players[id]).filter(Boolean);
  // Spieltagskader: Startelf (lineupMap) und Bank (substitutes) farbig hinterlegt.
  const lu = club.tactics?.lineupMap ? club.tactics
    : autoFillLineup(club, g.players, club.tactics, eraRules(Number(g.calendar.currentDate.slice(0, 4))).benchSize, promiseLineupPrefs(g));
  const xiIds = new Set(Object.values(lu.lineupMap ?? {}));
  const benchIds = new Set((lu.substitutes ?? []).filter((id) => !xiIds.has(id)));
  const roleCls = (id: string) => (xiIds.has(id) ? 'sq-xi' : benchIds.has(id) ? 'sq-bench' : '');
  const cmp = (a: Player, b: Player): number => {
    switch (sortBy) {
      case 'pos': return (GROUP_ORDER.indexOf(groupOf(a)) - GROUP_ORDER.indexOf(groupOf(b))) || (b.overall - a.overall);
      case 'pot': return (scoutMid(b) - scoutMid(a)) || (b.overall - a.overall);
      case 'form': return b.form - a.form;
      case 'fri': return (a.frische ?? 100) - (b.frische ?? 100);
      case 'fit': return b.attributes.fitness - a.attributes.fitness;
      case 'mor': return playerMorale100(b) - playerMorale100(a);
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

  // Drittes Menü: Mannschaftsteile (ui/SubTabs)
  const tabs = [{ id: 'all', label: 'Alle', count: all.length },
    ...GROUP_ORDER.map((k) => ({ id: k, label: GROUP_DE[k], count: all.filter((x) => groupOf(x) === k).length }))];

  return (
    <SubTabsPage tabs={tabs} active={grp} onSelect={setGrp}>
    <DashPage>
      <DashBox title={grp === 'all' ? `Kader (${all.length})` : `${GROUP_DE[grp]} (${squad.length})`} span={2} rows={2} flush
        right={<span className="dbtnrow">
          <span className="sq-legend"><span><i className="xi" />Startelf</span><span><i className="bench" />Bank</span></span>
        </span>}>
        <table className="dtable rl-players">
          <thead><tr>
            <th className="rl-rank">#</th><th>Name</th><Th k="pos" cls="ctr">Pos</Th><Th k="age" cls="num">Alter</Th>
            <Th k="ovr" cls="num">Stärke</Th><Th k="pot">Potenzial<InfoTip k="potenzial" /></Th><Th k="form" cls="ctr">Form</Th>
            <Th k="fri" cls="ctr">Frische<InfoTip k="frische" /></Th><Th k="fit" cls="ctr">Fitness<InfoTip k="fitness" /></Th><Th k="mor" cls="ctr">Moral</Th>
            <Th k="apps" cls="num">Sp.</Th><Th k="goals" cls="num">Tore</Th><th>Status</th><th className="ctr" aria-label="Gespräch" />
          </tr></thead>
          <tbody>
            {squad.map((pl) => {
              return (
                <tr key={pl.id} data-pid={pl.id} className={`clickable ${roleCls(pl.id)}`} onClick={() => setSel(pl.id)}>
                  <td className="rl-rank sq-shirt" onClick={(e) => e.stopPropagation()}>
                    <Select size="s" width={58} popWidth={230} listHeight={420} value={pl.shirtNumber} title="Rückennummer vergeben"
                      onChange={(v) => { setShirtNumber(club, g.players, pl.id, Number(v)); onChange?.(); setTick((t) => t + 1); }}
                      options={Array.from({ length: 99 }, (_, i) => {
                        const n = i + 1; const who = all.find((x) => x.shirtNumber === n && x.id !== pl.id);
                        return { value: n, text: String(n), label: who ? `${n} · ${who.lastName} (Tausch)` : String(n) };
                      })} />
                  </td>
                  <td className="nowrap rl-name">{pl.fullName}</td>
                  <td className="ctr"><PosBadge p={pl} /></td>
                  <td className="num">{pl.age}</td>
                  <td className="num"><b style={{ color: vColor(pl.overall) }}>{pl.overall}</b></td>
                  <td className="nowrap"><ScoutStars p={pl} /></td>
                  <td className="ctr"><PlayerForm p={pl} /></td>
                  <td className="ctr"><PlayerFreshness p={pl} /></td>
                  <td className="ctr"><PlayerFitness p={pl} /></td>
                  <td className="ctr"><PlayerMorale p={pl} /></td>
                  <td className="num">{pl.seasonStats.appearances}</td>
                  <td className="num">{pl.seasonStats.goals}</td>
                  <td className={`nowrap ${pl.availability === 'injured' ? 'red' : pl.suspensionMatches > 0 ? 'orange-text' : 'muted'}`}>
                    {pl.availability === 'injured' ? `verletzt (${pl.injury?.daysRemaining} T.)` : pl.suspensionMatches > 0 ? `gesperrt (${pl.suspensionMatches})` : 'fit'}
                  </td>
                  <td className="ctr">{!pl.isYouth && <button className="ptk-open" title="Gespräch führen" aria-label={`Gespräch mit ${pl.lastName} führen`}
                    onClick={(e) => { e.stopPropagation(); setTalk(pl.id); }}><Icon name="talk" size={18} /></button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DashBox>

      <DashBox title="Kaderstruktur" info="kaderbedarf" icon="dashKader">
        <div className="dkpis">
          <Kpi value={Math.round(avg(all.map((x) => x.overall)))} label="Ø Stärke" />
          <Kpi value={avg(all.map((x) => x.age)).toFixed(1)} label="Ø Alter" />
        </div>
        {GROUP_ORDER.map((k) => {
          const xs = all.filter((x) => groupOf(x) === k);
          return <KV key={k} k={`${GROUP_DE[k]} (${xs.length})`} v={xs.length ? `Ø ${Math.round(avg(xs.map((x) => x.overall)))}` : '–'} />;
        })}
        <KV k={`Gehälter / ${wageUnit()}`} v={fmtWage(wages, { unit: false })} strong />
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
        {tired.length ? tired.map((x) => <PlayerRow key={x.id} p={x} value={<PlayerFreshness p={x} showValue />} onClick={() => setSel(x.id)} />)
          : <Empty icon="training">Alle Spieler sind ausgeruht.</Empty>}
      </DashBox>

      {talk && <PlayerTalkModal g={g} pid={talk} onClose={() => { setTalk(null); onChange?.(); }} onChange={onChange} />}
      {p && <PlayerModal player={p} club={club} squad={all} today={g.calendar.currentDate} season={g.season} onClose={() => setSel(null)}
        negotiation={{ demand: (x) => demandFor(g, x), offer: (x, w, y) => { const r = offerContract(g, x.id, w, y); onChange?.(); return r; } }} />}
    </DashPage>
    </SubTabsPage>
  );
}

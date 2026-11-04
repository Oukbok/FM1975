// Zentrale › Karriere, Reiter „Trainer & Spieler“: deine Cheftrainer, Transferbilanz,
// Spieler mit den meisten Einsätzen/Toren unter dir, Eigengewächse.
import PosBadge from '../../../components/PosBadge';
import { pointsPerGame } from '../../../game/coachRecord';
import { headCoachNow, headCoachRows } from '../../../game/headCoaches';
import { economyScale, yearOf } from '../../../engine/economy';
import { memberMonthlySalary } from '../../../engine/staffPeople';
import type { MgrTransfer } from '../../../game/managerLog';
import type { CareerData, PlayerLine } from '../../../game/managerView';
import type { Game } from '../../../game/state';
import { DashBox, DashPage, Empty, KV } from '../../../ui/DashPage';
import { fmtPrice, fmtStaffWage } from '../../../ui/format';
import { ClubCell, dmy } from './parts';

const END_DE: Record<string, string> = {
  entlassen: 'entlassen', vertragsende: 'Vertragsende', abgeworben: 'abgeworben', ruhestand: 'Ruhestand', gegangen: 'gegangen',
};
const span = (a: string, b?: string) => `${a.slice(5, 7)}.${a.slice(0, 4)} – ${b ? `${b.slice(5, 7)}.${b.slice(0, 4)}` : 'heute'}`;

/** Der Cheftrainer im Amt: Eckdaten und Stand beim Vorstand. */
function CoachNow({ g }: { g: Game }) {
  const m = headCoachNow(g);
  if (!m) return null;
  const scale = economyScale(yearOf(g.calendar.currentDate));
  const backed = g.career?.press?.backed;
  const conf = g.clubs[g.managedClubId]?.boardConfidence ?? 60;
  return (
    <div className="car-coach-now">
      <div className="dsec">Im Amt: {m.name}</div>
      <div className="car-coach-kv">
        <KV k="Alter" v={m.age} />
        <KV k="Vertrag bis" v={m.contractEnd ? `30.06.${m.contractEnd.slice(0, 4)}` : '–'} />
        <KV k="Gehalt" v={fmtStaffWage(memberMonthlySalary(m, scale))} />
        <KV k="Laufbahn" v={m.exPro ? `Ex-Profi (${m.exPro.pos}, ${m.exPro.apps} Spiele)` : 'Fußballlehrer'} />
        <KV k="Stand beim Vorstand" v={backed && backed.coachId === m.id ? 'von dir gestützt – Vorstand prüft nach' : conf < 30 ? 'in der Kritik' : conf < 45 ? 'unter Beobachtung' : 'unumstritten'} info="vorstandsdruck" />
      </div>
    </div>
  );
}

function Coaches({ g }: { g: Game }) {
  const rows = headCoachRows(g);
  if (!rows.length) {
    return <Empty icon="whistle">Du hast noch keinen Cheftrainer eingestellt – die Trainerbank besetzt du unter Training › Trainerteam. Bis dahin leitest du das Training selbst.</Empty>;
  }
  return (
    <table className="dtable rl-sm car-coaches">
      <thead><tr><th>Cheftrainer</th><th>Amtszeit</th><th className="rl-num">Liga S-U-N</th><th className="rl-num">P/Sp</th><th>Ende</th><th>Vorstand</th></tr></thead>
      <tbody>
        {rows.map((e) => {
          const n = e.r.w + e.r.d + e.r.l;
          return (
            <tr key={e.id + e.from} className={e.live ? 'me' : ''}>
              <td className="rl-name">{e.name}</td>
              <td>{span(e.from, e.to)}</td>
              <td className="rl-num">{n ? `${e.r.w}-${e.r.d}-${e.r.l}` : '–'}{e.recFrom && <span className="car-dim"> ab {e.recFrom}</span>}</td>
              <td className="rl-num rl-main">{n ? pointsPerGame(e.r).toFixed(2).replace('.', ',') : '–'}</td>
              <td>{e.live ? 'im Amt' : END_DE[e.end ?? 'gegangen']}</td>
              <td className="car-dim">{[e.backed ? `${e.backed}× gestützt` : '', e.pressured ? 'auf Druck entlassen' : ''].filter(Boolean).join(' · ') || '–'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function PlayerList({ list, val, empty }: { list: PlayerLine[]; val: (p: PlayerLine) => string; empty: string }) {
  if (!list.length) return <Empty icon="squad">{empty}</Empty>;
  return (
    <div className="rl rl-sm rl-players car-players">
      {list.map((p, i) => (
        <div key={p.id} className={`rl-row car-pl ${p.active ? '' : 'gone'}`} data-pid={p.active ? p.id : undefined}>
          <span className="rl-rank">{i + 1}</span>
          <PosBadge pos={p.pos} />
          <span className="car-pl-name"><span className="rl-name">{p.name}</span><span className="car-dim">{p.from === p.to ? p.from : `${p.from.slice(0, 4)}–${p.to.slice(5)}`}{p.active ? ' · im Kader' : ''}</span></span>
          <span className="rl-num rl-main">{val(p)}</span>
        </div>
      ))}
    </div>
  );
}

function TransferLine({ g, t }: { g: Game; t: MgrTransfer }) {
  return (
    <div className="rl-row car-tr">
      <span className="car-tr-who"><span className="rl-name">{t[2]}</span><span className="car-dim">{dmy(t[0])}</span></span>
      <ClubCell g={g} id={t[3]} name={t[5]} />
      <span className="rl-num rl-main">{fmtPrice(t[4])}</span>
    </div>
  );
}

export function PeopleTab({ g, d }: { g: Game; d: CareerData }) {
  const byApps = [...d.players].sort((a, b) => b.apps - a.apps || b.goals - a.goals).slice(0, 15);
  const byGoals = [...d.players].filter((p) => p.goals > 0).sort((a, b) => b.goals - a.goals || a.apps - b.apps).slice(0, 15);
  const hg = d.players.filter((p) => p.hg).sort((a, b) => b.apps - a.apps);
  const net = d.tin - d.tout;
  return (
    <DashPage className="car-page">
      <DashBox title="Deine Trainer" span={2} flush info="deineTrainer" right={`${headCoachRows(g).length}`}>
        <Coaches g={g} />
        <CoachNow g={g} />
      </DashBox>

      <DashBox title="Transferbilanz" info="karriereTransfers">
        <KV k="Einnahmen" v={fmtPrice(d.tin)} />
        <KV k="Ausgaben" v={fmtPrice(d.tout)} />
        <KV k="Saldo" v={`${net >= 0 ? '+' : '−'}${fmtPrice(Math.abs(net))}`} color={net >= 0 ? 'var(--pos)' : 'var(--neg)'} strong />
        <div className="dsec">Teuerste Zugänge</div>
        {d.buys.length ? <div className="rl rl-sm">{d.buys.slice(0, 3).map((t) => <TransferLine key={t[0] + t[1]} g={g} t={t} />)}</div> : <div className="dnote">Noch kein Kauf gegen Ablöse.</div>}
        <div className="dsec">Teuerste Abgänge</div>
        {d.sells.length ? <div className="rl rl-sm">{d.sells.slice(0, 3).map((t) => <TransferLine key={t[0] + t[1]} g={g} t={t} />)}</div> : <div className="dnote">Noch kein Verkauf gegen Ablöse.</div>}
      </DashBox>

      <DashBox title="Meiste Einsätze" flush right="Pflichtspiele">
        <PlayerList list={byApps} val={(p) => `${p.apps}`} empty="Noch keine Einsätze unter dir." />
      </DashBox>
      <DashBox title="Meiste Tore" flush right="Pflichtspiele">
        <PlayerList list={byGoals} val={(p) => `${p.goals}`} empty="Noch kein Tor unter dir." />
      </DashBox>
      <DashBox title="Eigengewächse" flush right={hg.length ? `${hg.length}` : undefined} info="eigengewaechse">
        <PlayerList list={hg} val={(p) => `${p.apps}`} empty="Noch hat kein Spieler aus der eigenen Jugend unter dir ein Pflichtspiel bestritten." />
      </DashBox>
    </DashPage>
  );
}

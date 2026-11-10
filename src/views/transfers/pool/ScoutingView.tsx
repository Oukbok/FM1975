// =============================================================================
// TRANSFERS › SCOUTING (Wunsch Pascal): laufende Aufträge, Berichte, Abteilung
// =============================================================================
import { useMemo, useState } from 'react';
import PosBadge from '../../../components/PosBadge';
import { NatFlag } from '../../../components/competition/CountryFlag';
import { estimate, knowCtx, knowledge, poolRows, type Estimate, type PoolRow } from '../../../game/playerPool';
import { cancelScouting, jobProgress, jobTerms, scoutSlots, scoutingOf } from '../../../game/scoutingGame';
import type { Game } from '../../../game/state';
import { CalendarEngine } from '../../../engine/calendar';
import { DashBox, DashPage, Empty, KV } from '../../../ui/DashPage';
import { fmtPrice } from '../../../ui/format';
import { ClubCell, Face, KnowBar, OvEst, StarEst, ValueEst } from './poolParts';

export function ScoutingView({ g, onChange = () => {} }: { g: Game; onChange?: () => void }) {
  const [, setTick] = useState(0);
  const s = scoutingOf(g);
  const { rows, clubs } = poolRows(g);
  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const ctx = knowCtx(g);
  const est = (r: PoolRow): Estimate => estimate(r, knowledge(ctx, r));
  const reports = Object.entries(s.reports).sort((a, b) => b[1].date.localeCompare(a[1].date))
    .map(([id, rep]) => ({ id, rep, r: byId.get(id) })).filter((x): x is { id: string; rep: typeof x.rep; r: PoolRow } => !!x.r);
  const slots = scoutSlots(g);
  const home = jobTerms(g, false, false), abroad = jobTerms(g, true, false);
  const cancel = (id: string) => { cancelScouting(g, id); setTick((t) => t + 1); onChange(); };

  return (
    <DashPage>
      <DashBox title="Scouts unterwegs" info="scouting" span={2} right={`${s.jobs.length} / ${slots}`}>
        {s.jobs.length ? s.jobs.map((j) => {
          const r = byId.get(j.id);
          return (
            <div key={j.id} className="dlist-row pool-jobrow">
              {r && <Face r={r} size={24} />}
              <span className="grow"><b>{j.name}</b><span className="muted"> · {j.clubName}{j.abroad ? ' · Ausland' : ''}{j.youth ? ' · Jugend' : ''}</span></span>
              <span className="pool-jobmeter"><span className="dmeter-track"><span className="dmeter-fill" style={{ width: `${Math.round(jobProgress(g, j) * 100)}%`, background: 'var(--bar-fill-hi)' }} /></span>
                <span className="muted">bis {CalendarEngine.formatDate(CalendarEngine.addDays(j.start, j.days))}</span></span>
              <button className="dchip" onClick={() => cancel(j.id)} title="Reisekosten werden nicht erstattet">Abbrechen</button>
            </div>
          );
        }) : <Empty icon="watchlist">Kein Scout unterwegs. Im Spielerpool wählst du einen Spieler und schickst über den Steckbrief einen Scout los.</Empty>}
      </DashBox>

      <DashBox title="Abteilung" rows={2}>
        <KV k="Aufträge gleichzeitig" v={slots} info="scouting" />
        <KV k="Inland" v={`${home.days} Tage · ${fmtPrice(home.cost)}`} />
        <KV k="Ausland" v={`${abroad.days} Tage · ${fmtPrice(abroad.cost)}`} />
        <KV k="Jugendspieler" v="+4 Tage" />
        <div className="dnote mt8">Jeder Scouting-Mitarbeiter (Scout, Chefscout, internationaler Scout, Nachwuchskoordinator) übernimmt einen weiteren Auftrag. Ein internationaler Scout macht Auslandsreisen kürzer und billiger, Video- und Datenanalysten beschleunigen jede Beobachtung, gute Scouts liefern genauere Berichte.</div>
        <div className="dnote mt8">Wie gut du einen Spieler kennst, hängt auch ohne Scout von vielem ab: Spieler deiner Liga und Gegner, gegen die du oft spielst, kennst du gut, Stars kennt jeder, Amateure, Jugendliche und kleine Auslandsligen kaum. Mit Fernsehen, Internet und Datenbanken wächst das Wissen über die Jahrzehnte. Berichte veralten nach einigen Jahren.</div>
      </DashBox>

      <DashBox title="Berichte" span={2} flush right={`${reports.length}`}>
        {reports.length ? (
          <table className="dtable rl-players">
            <thead><tr><th>Name</th><th>Verein</th><th className="ctr w-s">Land</th><th className="ctr">Pos</th><th className="num w-s">Alter</th><th className="num">Stärke</th><th className="w-m">Potenzial</th><th className="num w-l">Wert</th><th className="ctr">Bekannt</th><th className="num w-l">Bericht</th></tr></thead>
            <tbody>
              {reports.slice(0, 100).map(({ id, rep, r }) => {
                const e = est(r);
                return (
                  <tr key={id} data-pid={id}>
                    <td className="nowrap rl-name"><span className="tm-name"><Face r={r} /><span>{r.name}</span></span></td>
                    <td className="nowrap"><ClubCell g={g} id={r.clubId} world={clubs} /></td>
                    <td className="ctr"><NatFlag nat={r.nat} /></td>
                    <td className="ctr"><PosBadge pos={r.pos} /></td>
                    <td className="num">{r.age}</td>
                    <td className="num nowrap"><OvEst e={e} /></td>
                    <td className="nowrap"><StarEst e={e} /></td>
                    <td className="num nowrap"><ValueEst e={e} /></td>
                    <td className="ctr"><KnowBar k={e.k} /></td>
                    <td className="num muted">{CalendarEngine.formatDate(rep.date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <Empty icon="watchlist">Noch keine Berichte.</Empty>}
      </DashBox>
    </DashPage>
  );
}

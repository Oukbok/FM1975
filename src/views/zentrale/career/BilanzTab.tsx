// Zentrale › Karriere, Reiter „Bilanz“: Managerbilanz, Ansehen je Saison, Wettbewerbe, Titel & Rekorde, Meilensteine.
import { repLabel } from '../../../game/careerState';
import type { CareerData } from '../../../game/managerView';
import { games } from '../../../game/managerView';
import { trophyTally } from '../../../game/trophyCabinet';
import type { Game } from '../../../game/state';
import { DashBox, DashPage, Empty, KV, Kpi, Meter } from '../../../ui/DashPage';
import { vColor } from '../../../ui/format';
import { ClubCell, COMP_DE, dmy, ppgText, wdlText } from './parts';
import { RepChart } from './RepChart';

export function BilanzTab({ g, d, rep }: { g: Game; d: CareerData; rep: number }) {
  const club = g.clubs[g.managedClubId];
  const all = d.totals.all;
  const years = d.seasons.length;
  const tally = trophyTally(d.titles.filter((t) => t.cat !== 'jugend'));
  const youth = d.titles.filter((t) => t.cat === 'jugend').length;
  const miles = [...d.tally.miles].reverse();
  return (
    <DashPage className="car-page">
      <DashBox title="Managerbilanz" info="managerBilanz" right={`seit ${d.from}`}>
        <div className="dkpis">
          <Kpi value={d.tally.n} label="Pflichtspiele" />
          <Kpi value={ppgText(all)} label="Punkte je Spiel" info="trainerBilanz" />
          <Kpi value={years} label={years === 1 ? 'Saison' : 'Saisons'} />
        </div>
        <KV k="Verein" v={club.name} strong />
        <KV k="Siege · Remis · Niederlagen" v={wdlText(all)} />
        <KV k="Tore" v={`${all[3]}:${all[4]}`} />
        <KV k="Titel" v={tally.reduce((a, t) => a + t.n, 0) || '–'} />
        <Meter label={repLabel(rep)} value={rep} color={vColor(rep)} info="trainerAnsehen" text={Math.round(rep)} />
      </DashBox>

      <DashBox title="Ansehen je Saison" span={2} info="trainerAnsehen" right={d.repSeries.length ? `${d.repSeries.length} Saisons` : undefined}>
        {d.repSeries.length ? <RepChart points={d.repSeries} liveLast={!!d.seasons[0]?.live} />
          : <Empty icon="stats">Nach deiner ersten Saison siehst du hier, wie sich dein Ansehen entwickelt.</Empty>}
      </DashBox>

      <DashBox title="Je Wettbewerb" flush>
        <table className="dtable rl-sm car-comp">
          <thead><tr><th>Wettbewerb</th><th className="rl-num">Sp</th><th className="rl-num">S-U-N</th><th className="rl-num">Tore</th><th className="rl-num">P/Sp</th></tr></thead>
          <tbody>
            {(['L', 'P', 'E'] as const).map((k) => {
              const r = d.totals[k];
              return (
                <tr key={k}>
                  <td className="rl-name">{k === 'L' ? 'Liga' : k === 'P' ? 'Landespokal' : 'Europapokal'}</td>
                  <td className="rl-num">{games(r)}</td><td className="rl-num">{wdlText(r)}</td>
                  <td className="rl-num">{r[3]}:{r[4]}</td><td className="rl-num rl-main">{ppgText(r)}</td>
                </tr>
              );
            })}
            <tr className="car-total">
              <td className="rl-name">Gesamt</td><td className="rl-num">{games(all)}</td><td className="rl-num">{wdlText(all)}</td>
              <td className="rl-num">{all[3]}:{all[4]}</td><td className="rl-num rl-main">{ppgText(all)}</td>
            </tr>
          </tbody>
        </table>
      </DashBox>

      <DashBox title="Titel & Rekorde" right={tally.length ? `${tally.reduce((a, t) => a + t.n, 0)} Titel` : undefined}>
        {tally.length ? <div className="car-titles">
          {tally.map((t) => <KV key={t.title} k={t.title} v={`${t.n}×`} strong />)}
          {youth ? <KV k="Jugendtitel" v={`${youth}×`} /> : null}
        </div> : <div className="dnote">Noch kein Titel in deiner Amtszeit.</div>}
        <div className="dsec">Rekorde deiner Amtszeit</div>
        {d.records.length ? d.records.map((r) => (
          <div key={r.k} className="car-rec"><span className="car-rec-k">{r.k}</span><span className="car-rec-v">{r.v}</span>{r.sub && <span className="car-rec-sub">{r.sub}</span>}</div>
        )) : <div className="dnote">Rekorde zählen ab der ersten abgeschlossenen Saison.</div>}
      </DashBox>

      <DashBox title="Meilensteine" right={d.nextMile ? `nächster: ${d.nextMile.n}. Spiel` : undefined}>
        {d.nextMile && (
          <div className="car-next">
            <span className="car-next-v">{d.nextMile.left}</span>
            <span className="car-next-k">{d.nextMile.left === 1 ? 'Spiel' : 'Spiele'} bis zu deinem {d.nextMile.n}. Pflichtspiel</span>
          </div>
        )}
        {miles.length ? <div className="rl rl-sm">
          {miles.map(([n, x]) => (
            <div key={n} className="rl-row car-mile">
              <span className="rl-main car-mile-n">{n}.</span>
              <span className="car-mile-when">{dmy(x[0])}<span className="car-dim"> · {COMP_DE[x[1]]}</span></span>
              <ClubCell g={g} id={x[2]} name={x[6]} />
              <span className="rl-num">{x[4]}:{x[5]}</span>
            </div>
          ))}
        </div> : <Empty icon="kalender">Dein erstes Pflichtspiel steht noch aus.</Empty>}
      </DashBox>
    </DashPage>
  );
}

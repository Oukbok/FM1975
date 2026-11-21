// Nationalteam › Spiele & Turniere: Länderspiele unter dir | laufendes/letztes Turnier
// (Bausteine MatchLine/TournamentBox aus views/stats/NationalView.tsx) |
// Bilanz je Wettbewerb | Turniere und Qualifikationen deiner Amtszeit.
import type { Game } from '../../game/state';
import { NatFlag } from '../../components/competition/CountryFlag';
import { nationalJob, fmtDay } from '../../game/national/nationalJob';
import { nationalState, upcoming } from '../../game/national/nationalGame';
import { jobMatches, recText } from '../../game/national/nationalJobView';
import { DashBox, DashPage, Empty, KV } from '../../ui/DashPage';
import { MatchLine, TournamentBox } from '../stats/NationalView';

export function NtMatchesTab({ g }: { g: Game }) {
  const job = nationalJob(g)!;
  const today = g.calendar.currentDate;
  const st = nationalState(g);
  const t = st.tourn && today >= st.tourn.nominate ? st.tourn : null;
  const games = jobMatches(g);
  const next = upcoming(g).find((x) => /meisterschaft/.test(x.text));
  const evals = job.history.filter((h) => h.what === 'qual' || h.what === 'tourn').reverse();
  return (
    <DashPage className="ntj-matches">
      <DashBox title="Länderspiele unter dir" right={games.length ? `${games.length}` : undefined}>
        {games.length ? <div className="ntj-list">{games.map((m, i) => <MatchLine key={i} m={m} today={today} label={m.label} />)}</div>
          : <Empty icon="schedule">Noch kein Länderspiel unter dir.</Empty>}
      </DashBox>
      <DashBox title={t ? <span className="kv-flag">{t.kind} {t.year} {t.place}{t.hosts.map((h) => <NatFlag key={h} nat={h} />)}</span> : 'Turnier'} span={2}>
        {t ? <TournamentBox t={t} today={today} home={job.nat} mine={job.nat} />
          : <Empty icon="trophy">{next ? `${next.text} – Gruppen und Spielplan 25 Tage vor dem Anpfiff.` : 'Kein Turnier angesetzt.'}</Empty>}
      </DashBox>
      <DashBox title="Bilanz je Wettbewerb">
        {job.record.total.p ? <>
          <KV k="Gesamt" v={`${recText(job.record.total)} · ${job.record.total.gf}:${job.record.total.ga}`} strong />
          {Object.entries(job.record.by).reverse().map(([k, r]) => <KV key={k} k={k} v={`${recText(r)} · ${r.gf}:${r.ga}`} />)}
        </> : <Empty icon="stats">Noch keine Bilanz.</Empty>}
      </DashBox>
      <DashBox title="Turniere deiner Amtszeit" span={2}>
        {evals.length ? <div className="ntj-list">{evals.map((h, i) => (
          <div key={i} className="ntj-hrow">
            <span className="ntj-date">{fmtDay(h.date)}</span><span>{h.what === 'qual' ? `Qualifikation ${h.key}` : h.key}</span>
            <span className="dim">Ziel: {h.goal}</span><span>{h.result}</span>
            <span className={`num ${h.delta > 0 ? 'pos' : h.delta < 0 ? 'neg' : ''}`}>{h.delta > 0 ? '+' : ''}{h.delta}</span>
          </div>
        ))}</div> : <Empty icon="trophy">Noch kein Turnier bewertet.</Empty>}
      </DashBox>
    </DashPage>
  );
}

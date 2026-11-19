// Privat › Karriere › Nationalteam: alle Amtszeiten als Nationaltrainer (laufend + frühere
// aus `nationalJob.prev`), Bilanz, Turniere. Daten game/national/nationalJob.ts.
import type { Game } from '../../game/state';
import { NatFlag } from '../../components/competition/CountryFlag';
import { fmtDay, nationalJob, type NationalJob } from '../../game/national/nationalJob';
import { natName } from '../../game/national/nationalGame';
import { recText } from '../../game/national/nationalJobView';
import { DashBox, DashPage, Empty, KV } from '../../ui/DashPage';

const END: Record<string, string> = { sacked: 'entlassen', expired: 'Vertrag ausgelaufen', declined: 'Verlängerung abgelehnt', resigned: 'zurückgetreten' };

export function NtCareerTab({ g }: { g: Game }) {
  const cur = nationalJob(g);
  const jobs: NationalJob[] = cur ? [...(cur.prev ?? []), cur] : [];
  const tourns = jobs.flatMap((j) => j.history.filter((h) => h.what === 'tourn' || (h.what === 'qual' && h.result !== 'qualifiziert')).map((h) => ({ ...h, nat: j.nat }))).reverse();
  const tot = jobs.reduce((a, j) => ({ p: a.p + j.record.total.p, w: a.w + j.record.total.w, d: a.d + j.record.total.d, l: a.l + j.record.total.l, gf: a.gf + j.record.total.gf, ga: a.ga + j.record.total.ga }), { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 });
  const titles = tourns.filter((h) => /meister$/.test(h.result));
  return (
    <DashPage>
      <DashBox title="Amtszeiten als Nationaltrainer" span={2} info="nationaltrainer">
        {jobs.length ? <div className="ntj-list">{[...jobs].reverse().map((j, i) => (
          <div key={i} className="ntj-hrow">
            <span><NatFlag nat={j.nat} /> {natName(j.nat)}</span>
            <span className="ntj-date">{fmtDay(j.since)} – {j.ended ? fmtDay(j.ended.date) : 'heute'}</span>
            <span>{j.record.total.p} Spiele · {recText(j.record.total)}</span>
            <span className="dim">{j.ended ? END[j.ended.reason] : `Vertrag bis ${j.untilKey}`}</span>
            <span className="num"><b>{j.trust}</b></span>
          </div>
        ))}</div> : <Empty icon="international">Noch keine Amtszeit als Nationaltrainer.</Empty>}
      </DashBox>
      <DashBox title="Bilanz gesamt">
        <KV k="Länderspiele" v={tot.p} strong />
        <KV k="Siege · Remis · Niederlagen" v={`${tot.w} · ${tot.d} · ${tot.l}`} />
        <KV k="Tore" v={`${tot.gf}:${tot.ga}`} />
        <KV k="Titel" v={titles.length ? titles.map((t) => t.key).join(', ') : 'keine'} />
      </DashBox>
      <DashBox title="Turniere" span={3}>
        {tourns.length ? <div className="ntj-list">{tourns.map((h, i) => (
          <div key={i} className="ntj-hrow"><span className="ntj-date">{fmtDay(h.date)}</span><span><NatFlag nat={h.nat} /> {h.key}</span><span className="dim">Ziel: {h.goal}</span><span>{h.result}</span><span className="num">{h.delta > 0 ? '+' : ''}{h.delta}</span></div>
        ))}</div> : <Empty icon="trophy">Noch kein Turnier bewertet.</Empty>}
      </DashBox>
    </DashPage>
  );
}

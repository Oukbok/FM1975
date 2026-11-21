// =============================================================================
// STATISTIKEN › NATIONALTEAMS › WELTRANGLISTE (Wunsch Pascal): alle Nationen mit
// Platz, Veränderung, Flagge, Kontinent, Punkten und Punkte-Veränderung (Filter je
// Kontinent) | dein Land mit Verlauf | Bewegung seit der Ausgabe davor.
// Daten: game/national/ranking.ts (Elo-Verfahren, Ausgabe am Monatsersten).
// =============================================================================
import { useState } from 'react';
import type { Game } from '../../../game/state';
import type { Conf } from '../../../data/nationalTeams';
import { confLabel } from '../../../game/countryProfile';
import { natName } from '../../../game/national/nationalGame';
import { activeJob } from '../../../game/national/nationalJob';
import { rankHistory, rankingOf, rankingRows, worldRank, type RankRow } from '../../../game/national/ranking';
import { homeNat } from '../../../game/registrationGame';
import { DashBox, DashPage, Empty } from '../../../ui/DashPage';
import { NatFlag } from '../../../components/competition/CountryFlag';
import { RankDelta, RankSpark, editionLabel } from './rankingParts';

const CONFS: (Conf | 'all')[] = ['all', 'UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'];
const SHORT: Record<Conf | 'all', string> = { all: 'Alle', UEFA: 'Europa', CONMEBOL: 'Südamerika', CONCACAF: 'Nordamerika', CAF: 'Afrika', AFC: 'Asien', OFC: 'Ozeanien' };

const ptsDelta = (d: number | null) => (d == null ? '' : d > 0 ? `+${d}` : d < 0 ? `−${-d}` : '±0');

function TableRow({ r, me, mine, pos }: { r: RankRow; me: boolean; mine: boolean; pos: number }) {
  return (
    <div className={`wr-trow ${me ? 'me' : ''}`}>
      <span className="rl-rank">{r.rank}</span>
      <RankDelta d={r.delta} />
      <span className="wr-name"><NatFlag nat={r.code} /> {natName(r.code)}{mine && <i className="ntj-tag">Dein Team</i>}</span>
      <span className="wr-conf">{confLabel(r.conf)}{pos !== r.rank ? ` · ${pos}.` : ''}</span>
      <b className="wr-pts">{r.pts}</b>
      <span className={`wr-dp ${r.dPts && r.dPts > 0 ? 'up' : r.dPts && r.dPts < 0 ? 'down' : ''}`}>{ptsDelta(r.dPts)}</span>
    </div>
  );
}

export default function WorldRankingView({ g }: { g: Game }) {
  const [conf, setConf] = useState<Conf | 'all'>('all');
  const rows = rankingRows(g);
  const home = homeNat(g);
  const job = activeJob(g)?.nat;
  const me = job ?? home;
  const wr = worldRank(g, me);
  const shown = conf === 'all' ? rows : rows.filter((r) => r.conf === conf);
  const moves = rows.filter((r) => r.delta != null && r.delta !== 0);
  const ups = [...moves].sort((a, b) => b.delta! - a.delta! || a.rank - b.rank).filter((r) => r.delta! > 0).slice(0, 5);
  const downs = [...moves].sort((a, b) => a.delta! - b.delta! || a.rank - b.rank).filter((r) => r.delta! < 0).slice(0, 5);
  const ed = rankingOf(g)?.ed;
  if (!rows.length) return <DashPage><DashBox title="Weltrangliste" span={3} rows={2}><Empty icon="international">Noch keine Weltrangliste.</Empty></DashBox></DashPage>;

  return (
    <DashPage className="wr-page">
      <DashBox title="Weltrangliste" info="weltrangliste" span={2} rows={2}
        right={<span className="nt-tabs">{CONFS.map((c) => <button key={c} type="button" className={`dchip ${conf === c ? 'on' : ''}`} onClick={() => setConf(c)}>{SHORT[c]}</button>)}</span>}>
        <div className="wr-table">
          <div className="wr-trow wr-thead"><span>Platz</span><span>±</span><span>Nation</span><span>Kontinent</span><span>Punkte</span><span>± Pkt.</span></div>
          <div className="wr-tbody">
            {shown.map((r, i) => <TableRow key={r.code} r={r} pos={i + 1} me={r.code === home || r.code === job} mine={r.code === job} />)}
          </div>
        </div>
        <div className="wr-foot">Ausgabe {ed ? editionLabel(ed) : '–'} · {rows.length} Nationen · ± = Plätze bzw. Punkte seit der Ausgabe davor{conf !== 'all' ? ' · hinter dem Kontinent: Platz im Kontinent' : ''}</div>
      </DashBox>

      <DashBox title={natName(me)} right={<NatFlag nat={me} height={18} />}>
        {wr ? <div className="wr-box">
          <div className="wr-kpis">
            <div><b>{wr.rank}.</b><span>von {wr.of}</span></div>
            <div><b>{wr.pts}</b><span>Punkte</span></div>
            <div><RankDelta d={wr.delta} wide /><span>zur Ausgabe davor</span></div>
          </div>
          <div className="dsec">Verlauf des Rangs</div>
          <RankSpark pts={rankHistory(g, me)} of={wr.of} w={520} h={150} />
        </div> : <Empty icon="international">{natName(me)} steht nicht in der Weltrangliste.</Empty>}
      </DashBox>

      <DashBox title="Bewegung" right={ed ? editionLabel(ed) : undefined}>
        {ups.length || downs.length ? <div className="wr-moves">
          <div className="dsec">Nach vorn</div>
          {ups.length ? ups.map((r) => <div key={r.code} className="wr-row"><span className="rl-rank">{r.rank}</span><NatFlag nat={r.code} /><span className="wr-name">{natName(r.code)}</span><RankDelta d={r.delta} /></div>) : <div className="dnote">keine</div>}
          <div className="dsec">Zurückgefallen</div>
          {downs.length ? downs.map((r) => <div key={r.code} className="wr-row"><span className="rl-rank">{r.rank}</span><NatFlag nat={r.code} /><span className="wr-name">{natName(r.code)}</span><RankDelta d={r.delta} /></div>) : <div className="dnote">keine</div>}
        </div> : <Empty icon="international">Seit der Ausgabe davor keine Veränderung – Länderspiele verschieben die Liste erst nach ihrem Spieltag.</Empty>}
      </DashBox>
    </DashPage>
  );
}

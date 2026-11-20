// Länderprofil › Übersicht: Box „Weltrangliste“ (Wunsch Pascal, ersetzt die Box
// „Nationalmannschaft“) – Platz, Punkte, Veränderung seit der letzten Ausgabe,
// Ausschnitt der Liste um die Nation (eigene hervorgehoben) und Verlauf des Rangs.
// Daten: game/national/ranking.ts, Bausteine views/statistiken/national/rankingParts.tsx.
import { activeJob } from '../../game/national/nationalJob';
import { rankHistory, rankingRows, worldRank } from '../../game/national/ranking';
import { DashBox, Empty } from '../../ui/DashPage';
import { RankDelta, RankLine, RankSpark, editionLabel, excerpt } from '../../views/statistiken/national/rankingParts';
import type { Game } from '../../game/state';
import type { CountryRef } from '../../game/countryProfile';

export function WorldRankBox({ g, c }: { g: Game; c: CountryRef }) {
  const code = c.code;
  const job = activeJob(g)?.nat;
  const wr = c.nation ? worldRank(g, code) : null;
  const hist = c.nation ? rankHistory(g, code) : [];
  const rows = rankingRows(g);
  const right = <>{job === code && <i className="ntj-tag">Dein Team</i>}{wr ? ` Ausgabe ${editionLabel(wr.ed)}` : ''}</>;
  if (!c.nation) {
    return <DashBox title="Weltrangliste" info="weltrangliste"><Empty icon="international">Für {c.name} gibt es im Spiel keine Nationalmannschaft – kein Platz in der Weltrangliste.</Empty></DashBox>;
  }
  if (!wr) {
    return (
      <DashBox title="Weltrangliste" info="weltrangliste">
        <div className="wr-box">
          <div className="dnote">{c.name} besteht in dieser Saison nicht – keine Wertung.</div>
          {hist.length > 0 && <><div className="dsec">Verlauf des Rangs</div><RankSpark pts={hist} of={rows.length || 60} /></>}
        </div>
      </DashBox>
    );
  }
  return (
    <DashBox title="Weltrangliste" info="weltrangliste" right={right}>
      <div className="wr-box">
        <div className="wr-kpis">
          <div><b>{wr.rank}.</b><span>Platz von {wr.of}</span></div>
          <div><b>{wr.pts}</b><span>Punkte</span></div>
          <div><RankDelta d={wr.delta} wide /><span>zur Ausgabe davor</span></div>
        </div>
        <div className="wr-list wr-excerpt">
          {excerpt(rows, code, 2).map((r) => <RankLine key={r.code} r={r} me={r.code === code} mine={r.code === job && r.code !== code} />)}
        </div>
        <div className="dsec">Verlauf des Rangs</div>
        <RankSpark pts={hist} of={wr.of} />
      </div>
    </DashBox>
  );
}

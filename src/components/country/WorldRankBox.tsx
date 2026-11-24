// Länderprofil › Übersicht: Box „Weltrangliste“ (Wunsch Pascal, ersetzt die Box
// „Nationalmannschaft“) – Platz, Punkte, Veränderung seit der letzten Ausgabe,
// Ausschnitt der Liste um die Nation (eigene hervorgehoben) und Verlauf des Rangs.
// Daten: game/national/ranking.ts, Bausteine views/stats/national/rankingParts.tsx.
import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { activeJob } from '../../game/national/nationalJob';
import { rankHistory, rankingRows, worldRank } from '../../game/national/ranking';
import { DashBox, Empty } from '../../ui/DashPage';
import { RankDelta, RankLine, RankSpark, editionShort, excerpt } from '../../views/stats/national/rankingParts';
import type { Game } from '../../game/state';
import type { CountryRef } from '../../game/countryProfile';

/** Zeilen des Ausschnitts nach Platz in der Box (1366×768: drei statt fünf, damit der Verlauf Platz hat). */
function useExcerptSize(): [RefObject<HTMLDivElement>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(2);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fit = () => {
      const row = el.querySelector('.wr-row')?.getBoundingClientRect().height ?? 29;
      const list = el.querySelector('.wr-excerpt')?.getBoundingClientRect().height ?? 0;
      const spark = el.querySelector('.wr-spark-wrap')?.getBoundingClientRect().height ?? 64;
      // Rest ohne Liste und Verlauf (Kennzahlen, Überschrift, Abstände); der Verlauf braucht ≥ 90 px.
      const other = Math.max(el.scrollHeight, el.clientHeight) - list - spark;
      const rows = Math.floor((el.clientHeight - other - 90) / Math.max(20, row));
      setN(rows >= 5 ? 2 : rows >= 3 ? 1 : 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, n];
}

export function WorldRankBox({ g, c }: { g: Game; c: CountryRef }) {
  const [boxRef, near] = useExcerptSize();
  const code = c.code;
  const job = activeJob(g)?.nat;
  const wr = c.nation ? worldRank(g, code) : null;
  const hist = c.nation ? rankHistory(g, code) : [];
  const rows = rankingRows(g);
  const right = <>{job === code && <i className="ntj-tag">Dein Team</i>}{wr ? ` ${editionShort(wr.ed)}` : ''}</>;
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
      <div className="wr-box" ref={boxRef}>
        <div className="wr-kpis">
          <div><b>{wr.rank}.</b><span>Platz von {wr.of}</span></div>
          <div><b>{wr.pts}</b><span>Punkte</span></div>
          <div><RankDelta d={wr.delta} wide /><span>zur Ausgabe davor</span></div>
        </div>
        <div className="wr-list wr-excerpt">
          {excerpt(rows, code, near).map((r) => <RankLine key={r.code} r={r} me={r.code === code} mine={r.code === job && r.code !== code} />)}
        </div>
        <div className="dsec">Verlauf des Rangs</div>
        <RankSpark pts={hist} of={wr.of} cur={{ pts: wr.pts, ed: wr.ed, dPts: rows.find((r) => r.code === code)?.dPts }} />
      </div>
    </DashBox>
  );
}

// =============================================================================
// <RoundsBracket>: Turnierbaum als Spalten je Runde (Statistiken › Liga/Pokal/International)
// -----------------------------------------------------------------------------
// Jede Runde eine Spalte, Begegnungen gleichmäßig verteilt (spätere Runden mittig).
// Keine Verbindungslinien: im K.-o.-System dieser Zeit wurde jede Runde neu
// ausgelost, die Paarungen folgen also keinem festen Baum. Rein darstellend –
// Namen/Wappen kommen über `renderTeam` vom Aufrufer.
// =============================================================================
import type { ReactNode } from 'react';
import type { RoundLite, TieLite } from '../../game/competitionView';

export function tieScore(t: TieLite): ReactNode {
  if (t.scoreText) return <span className="rb-score-txt">{t.scoreText}</span>;
  if (t.hg == null || t.ag == null) return <span className="rb-open">–</span>;
  return <>
    <b>{t.hg}:{t.ag}</b>
    {t.dec === 1 && <span className="rb-dec">n. V.</span>}
    {t.dec === 2 && <span className="rb-dec">i. E.{t.pen ? ` ${t.pen[0]}:${t.pen[1]}` : ''}</span>}
  </>;
}

export default function RoundsBracket({ rounds, renderTeam, onTie, active }: {
  rounds: RoundLite[];
  renderTeam: (id: string, won: boolean) => ReactNode;
  onTie?: (t: TieLite) => void;
  /** Hervorgehobene Runde (Rundenwahl). */
  active?: number;
}) {
  return (
    <div className="rb">
      {rounds.map((r) => (
        <div key={r.index} className={`rb-col ${active === r.index ? 'on' : ''}`}>
          <div className="rb-head">{r.name}</div>
          <div className="rb-ties">
            {r.drawn && r.ties.length ? r.ties.map((t) => {
              const done = t.winner != null && (t.hg != null || !!t.scoreText);
              return (
                <div key={t.id} className={`rb-tie ${t.mine ? 'mine' : ''} ${onTie && t.matchId ? 'clickable' : ''}`}
                  onClick={() => onTie && t.matchId && onTie(t)}>
                  <div className={`rb-team ${done && t.winner === t.home ? 'won' : ''}`}>{renderTeam(t.home, done && t.winner === t.home)}<span className="rb-g">{t.hg ?? ''}</span></div>
                  <div className={`rb-team ${done && t.winner === t.away ? 'won' : ''}`}>{renderTeam(t.away, done && t.winner === t.away)}
                    {t.dec > 0 && !t.scoreText && <span className="rb-note">{t.dec === 1 ? 'n. V.' : `i. E. ${t.pen ? `${t.pen[0]}:${t.pen[1]}` : ''}`}</span>}
                    <span className="rb-g">{t.ag ?? ''}</span></div>
                  {t.scoreText && <div className="rb-note rb-txt">{t.scoreText}</div>}
                </div>
              );
            }) : <div className="rb-tie rb-pending">offen</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

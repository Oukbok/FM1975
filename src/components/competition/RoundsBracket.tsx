// =============================================================================
// <RoundsBracket>: Turnierbaum als Spalten je Runde (Statistiken › Liga/Pokal/International)
// -----------------------------------------------------------------------------
// Jede Runde eine Spalte, Begegnungen gleichmäßig verteilt (spätere Runden mittig).
// Keine Verbindungslinien: im K.-o.-System dieser Zeit wurde jede Runde neu
// ausgelost, die Paarungen folgen also keinem festen Baum. Hin- und Rückspiel:
// beide Ergebnisse klein, das Gesamtergebnis fett; Wiederholungsspiele mit Hinweis.
// Rein darstellend – Namen/Wappen kommen über `renderTeam` vom Aufrufer.
// =============================================================================
import type { ReactNode } from 'react';
import type { RoundLite, TieLite } from '../../game/competitionView';

/** Zusatz zur Entscheidung (n. V., i. E., Auswärtstore). */
export function tieNote(t: TieLite): string {
  if (t.awayGoals) return 'Auswärtstore';
  if (t.dec === 2) return `i. E.${t.pen ? ` ${t.pen[0]}:${t.pen[1]}` : ''}`;
  if (t.dec === 1) return 'n. V.';
  return '';
}

export function tieScore(t: TieLite): ReactNode {
  if (t.scoreText) return <span className="rb-score-txt">{t.scoreText}</span>;
  const legs = t.legs ?? [];
  if (t.hg == null || t.ag == null) {
    // Hinspiel gespielt, Rückspiel offen bzw. Wiederholung steht aus.
    if (legs.length) return <span className="rb-open">{legs.map((l) => `${l[0]}:${l[1]}`).join(', ')}{t.agg ? ' · Rückspiel offen' : ' n. V. · Wiederholung offen'}</span>;
    return <span className="rb-open">–</span>;
  }
  const note = tieNote(t);
  return <>
    <b>{t.hg}:{t.ag}</b>
    {legs.length === 2 && <span className="rb-legs-txt">({t.agg ? `${legs[0][0]}:${legs[0][1]}, ${legs[1][0]}:${legs[1][1]}` : `Wdh., zuvor ${legs[0][0]}:${legs[0][1]} n. V.`})</span>}
    {note && <span className="rb-dec">{note}</span>}
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
          <div className="rb-head">{r.name}{r.legs === 2 && <span className="rb-head-sub">Hin/Rück</span>}</div>
          <div className="rb-ties">
            {r.drawn && r.ties.length ? r.ties.map((t) => {
              const done = t.winner != null && (t.hg != null || !!t.scoreText);
              const legs = t.agg ? t.legs ?? [] : [];
              const note = done ? tieNote(t) : '';
              const goals = (side: 0 | 1) => (
                <span className="rb-gs">
                  {legs.map((l, i) => <span key={i} className="rb-lg">{l[side]}</span>)}
                  <span className="rb-g">{side === 0 ? t.hg ?? '' : t.ag ?? ''}</span>
                </span>
              );
              return (
                <div key={t.id} className={`rb-tie ${t.mine ? 'mine' : ''} ${onTie && t.matchId ? 'clickable' : ''} ${legs.length ? 'legs' : ''}`}
                  onClick={() => onTie && t.matchId && onTie(t)}>
                  <div className={`rb-team ${done && t.winner === t.home ? 'won' : ''}`}>{renderTeam(t.home, done && t.winner === t.home)}{goals(0)}</div>
                  <div className={`rb-team ${done && t.winner === t.away ? 'won' : ''}`}>{renderTeam(t.away, done && t.winner === t.away)}
                    {note && !t.scoreText && <span className="rb-note">{note}</span>}
                    {goals(1)}</div>
                  {t.scoreText && <div className="rb-note rb-txt">{t.scoreText}</div>}
                  {!t.agg && (t.legs?.length ?? 0) === 2 && <div className="rb-note rb-txt">Wiederholung · zuvor {t.legs![0][0]}:{t.legs![0][1]} n. V.</div>}
                </div>
              );
            }) : <div className="rb-tie rb-pending">offen</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

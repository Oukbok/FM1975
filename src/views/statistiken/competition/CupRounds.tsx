// =============================================================================
// Pokal: Turnierbaum ↔ Rundenliste, Rundenwahl, Auslosung ansehen (laufende Saison)
// =============================================================================
import { useEffect, useState } from 'react';
import Icon from '../../../components/Icon';
import RoundsBracket, { tieScore } from '../../../components/competition/RoundsBracket';
import { CalendarEngine } from '../../../engine/calendar';
import type { CompSnapshot, TieLite } from '../../../game/competitionView';
import type { Game } from '../../../game/state';
import { Empty } from '../../../ui/DashPage';
import { Chips, TeamName } from './parts';

type View = 'tree' | 'list';

export function CupRounds({ g, snap, onWatch, onReplayDraw }: {
  g: Game; snap: CompSnapshot; onWatch?: (matchId: string) => void; onReplayDraw?: (roundIndex: number) => void;
}) {
  const rounds = snap.rounds ?? [];
  const current = Math.max(0, rounds.findIndex((r) => !r.drawn || r.ties.some((t) => t.winner == null)));
  const fallback = rounds.every((r) => r.drawn && r.ties.every((t) => t.winner != null)) ? rounds.length - 1 : current;
  const [view, setView] = useState<View>(rounds.length > 1 ? 'tree' : 'list');
  const [ri, setRi] = useState(fallback);
  useEffect(() => { setRi(fallback); setView(rounds.length > 1 ? 'tree' : 'list'); }, [snap.key, snap.season]); // eslint-disable-line react-hooks/exhaustive-deps
  const round = rounds[Math.min(ri, rounds.length - 1)];
  const watch = (t: TieLite) => { if (t.matchId && onWatch) onWatch(t.matchId); };
  if (!rounds.length) return <Empty icon="trophy">Für diesen Wettbewerb liegen keine Runden vor.</Empty>;

  return (
    <div className="cmp-cup">
      <div className="cmp-toolbar">
        {rounds.length > 1 && <Chips<View> value={view} onChange={setView} options={[{ v: 'tree', label: 'Turnierbaum' }, { v: 'list', label: 'Runden' }]} />}
        {view === 'list' && rounds.length > 1 && (
          <Chips<number> value={round.index} onChange={(v) => setRi(rounds.findIndex((r) => r.index === v))}
            options={rounds.map((r) => ({ v: r.index, label: r.name, disabled: !r.drawn }))} />
        )}
      </div>
      {view === 'tree' ? (
        <div className="cmp-scroll">
          <RoundsBracket rounds={rounds} renderTeam={(id) => <TeamName g={g} id={id} season={snap.season} size={14} />} onTie={snap.source === 'live' ? watch : undefined} />
        </div>
      ) : (
        <div className="cmp-scroll">
          <div className="cmp-round-head">
            <b>{round.name}</b>
            {round.date && <span className="dnote">{CalendarEngine.formatDate(round.date)}</span>}
            {snap.source === 'live' && round.hasDraw && onReplayDraw && (
              <button className="dchip" onClick={() => onReplayDraw(round.index)}><Icon name="play" size={14} /> Auslosung</button>
            )}
          </div>
          {!round.drawn ? <div className="dnote">{round.drawDate ? `Auslosung am ${CalendarEngine.formatDate(round.drawDate)}.` : 'Noch nicht ausgelost.'}</div> : (
            <div className="cmp-ties">
              {round.ties.map((t) => {
                const done = t.winner != null && (t.hg != null || !!t.scoreText);
                return (
                  <div key={t.id} className={`cmp-tie ${t.mine ? 'mine' : ''} ${t.matchId && onWatch && snap.source === 'live' ? 'clickable' : ''}`} onClick={() => snap.source === 'live' && watch(t)}>
                    <span className={`cmp-side ${done && t.winner === t.home ? 'won' : ''}`}><TeamName g={g} id={t.home} season={snap.season} /></span>
                    <span className="cmp-res">{t.hg == null && !t.scoreText && t.date ? <span className="dnote">{CalendarEngine.formatDate(t.date)}</span> : tieScore(t)}</span>
                    <span className={`cmp-side away ${done && t.winner === t.away ? 'won' : ''}`}><TeamName g={g} id={t.away} season={snap.season} /></span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

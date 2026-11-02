// =============================================================================
// Pokal: Gruppen ↔ Turnierbaum ↔ Rundenliste, Rundenwahl, Auslosung ansehen.
// Europapokal 2.0: Gruppen-/Ligaphase als Tabellen (components/competition/GroupTables)
// mit Kennzeichnung Weiterkommen/Zwischenrunde/Wechsel, Hin-/Rückspiel im Baum und in
// der Rundenliste, Spiele der Gruppen je Spieltag.
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import Icon from '../../../components/Icon';
import RoundsBracket, { tieScore } from '../../../components/competition/RoundsBracket';
import { GroupTables } from '../../../components/competition/GroupTables';
import type { BracketClub } from '../../../components/competition/CupBracket';
import { CalendarEngine } from '../../../engine/calendar';
import { compClubName, type CompSnapshot, type RoundLite, type TieLite } from '../../../game/competitionView';
import { clubView } from '../../../game/clubProfile';
import { seasonStartYear } from '../../../data/timeline';
import type { Game } from '../../../game/state';
import type { Club } from '../../../types';
import { Empty } from '../../../ui/DashPage';
import { Chips, TeamName } from './parts';

type View = 'groups' | 'tree' | 'list';
const isGroup = (r: RoundLite) => r.kind === 'groups' || r.kind === 'league';

export function CupRounds({ g, snap, onWatch, onReplayDraw }: {
  g: Game; snap: CompSnapshot; onWatch?: (matchId: string) => void; onReplayDraw?: (roundIndex: number) => void;
}) {
  const rounds = snap.rounds ?? [];
  const groupRounds = rounds.filter((r) => isGroup(r) && r.groups?.length);
  const koRounds = rounds.filter((r) => !isGroup(r));
  const current = Math.max(0, rounds.findIndex((r) => !r.drawn || (isGroup(r) ? r.matches?.some((m) => m.hg == null) ?? false : r.ties.some((t) => t.winner == null))));
  const fallback = rounds.every((r) => r.drawn && (isGroup(r) || r.ties.every((t) => t.winner != null))) ? rounds.length - 1 : current;
  const startView = (): View => (groupRounds.length && rounds[fallback] && isGroup(rounds[fallback]) ? 'groups' : koRounds.length > 1 ? 'tree' : groupRounds.length ? 'groups' : 'list');
  const [view, setView] = useState<View>(startView);
  const [ri, setRi] = useState(fallback);
  const [gi, setGi] = useState(() => Math.max(0, groupRounds.findIndex((r) => r.index === fallback)));
  useEffect(() => { setRi(fallback); setView(startView()); setGi(Math.max(0, groupRounds.findIndex((r) => r.index === fallback))); }, [snap.key, snap.season]); // eslint-disable-line react-hooks/exhaustive-deps
  const round = rounds[Math.min(ri, rounds.length - 1)];
  const watch = (t: { matchId?: string }) => { if (t.matchId && onWatch) onWatch(t.matchId); };
  const year = seasonStartYear(snap.season);
  const club = useMemo(() => (id: string): BracketClub => {
    const full = g.clubs[id];
    const eu = g.euroClubs?.[id];
    const cv = clubView(g, id, year);
    const name = compClubName(g, id, snap.season);
    return { name, short: full?.shortName ?? eu?.shortName ?? cv.shortName, crest: (full ?? { id, name, shortName: eu?.shortName ?? cv.shortName, city: eu?.city ?? cv.city, colors: eu?.colors ?? cv.colors }) as Club };
  }, [g, snap.season, year]);
  if (!rounds.length) return <Empty icon="trophy">Für diesen Wettbewerb liegen keine Runden vor.</Empty>;

  const views: { v: View; label: string }[] = [
    ...(groupRounds.length ? [{ v: 'groups' as View, label: groupRounds.some((r) => r.kind === 'league') ? 'Ligaphase' : 'Gruppen' }] : []),
    ...(koRounds.length > 1 ? [{ v: 'tree' as View, label: 'Turnierbaum' }] : []),
    { v: 'list', label: 'Runden' },
  ];
  const gr = groupRounds[Math.min(gi, groupRounds.length - 1)];

  return (
    <div className="cmp-cup">
      <div className="cmp-toolbar">
        {views.length > 1 && <Chips<View> value={view} onChange={setView} options={views} />}
        {view === 'groups' && groupRounds.length > 1 && (
          <Chips<number> value={gi} onChange={setGi} options={groupRounds.map((r, i) => ({ v: i, label: r.name }))} />
        )}
        {view === 'list' && rounds.length > 1 && (
          <Chips<number> value={round.index} onChange={(v) => setRi(rounds.findIndex((r) => r.index === v))}
            options={rounds.map((r) => ({ v: r.index, label: r.name, disabled: !r.drawn }))} />
        )}
      </div>
      {view === 'groups' && gr ? (
        <div className="cmp-scroll cmp-groups">
          <GroupTables groups={gr.groups ?? []} club={club} zones={gr.zones ?? []} highlightId={g.managedClubId}
            wide={gr.kind === 'league'} extraAdvance={gr.extraAdvance ? new Set(gr.extraAdvance) : undefined} />
        </div>
      ) : view === 'tree' ? (
        <div className="cmp-scroll">
          <RoundsBracket rounds={koRounds} renderTeam={(id) => <TeamName g={g} id={id} season={snap.season} size={14} />} onTie={snap.source === 'live' ? watch : undefined} />
        </div>
      ) : (
        <div className="cmp-scroll">
          <div className="cmp-round-head">
            <b>{round.name}</b>
            {round.date && <span className="dnote">{CalendarEngine.formatDate(round.date)}{round.legs === 2 ? ' · Hin- und Rückspiel' : ''}</span>}
            {snap.source === 'live' && round.hasDraw && onReplayDraw && (
              <button className="dchip" onClick={() => onReplayDraw(round.index)}><Icon name="play" size={14} /> Auslosung</button>
            )}
          </div>
          {!round.drawn ? <div className="dnote">{round.drawDate ? `Auslosung am ${CalendarEngine.formatDate(round.drawDate)}.` : 'Noch nicht ausgelost.'}</div>
            : isGroup(round) ? <GroupMatches g={g} snap={snap} round={round} onWatch={snap.source === 'live' ? watch : undefined} />
            : (
              <div className="rl cmp-ties">
                {round.ties.map((t, i) => <TieRow key={t.id} g={g} snap={snap} t={t} no={i + 1} onWatch={onWatch} watch={watch} />)}
              </div>
            )}
        </div>
      )}
    </div>
  );
}

function TieRow({ g, snap, t, no, onWatch, watch }: { g: Game; snap: CompSnapshot; t: TieLite; no: number; onWatch?: (id: string) => void; watch: (t: TieLite) => void }) {
  const done = t.winner != null && (t.hg != null || !!t.scoreText);
  const open = t.hg == null && !t.scoreText && !t.legs?.length;
  const side = (id: string) => `rl-side ${done ? (t.winner === id ? 'won' : 'lost') : ''}`;
  return (
    <div className={`rl-row rl-tie ${t.mine ? 'mine' : ''} ${t.matchId && onWatch && snap.source === 'live' ? 'clickable' : ''}`} onClick={() => snap.source === 'live' && watch(t)}>
      <span className="rl-rank">{no}</span>
      <span className={side(t.home)}><TeamName g={g} id={t.home} season={snap.season} size={28} /></span>
      <span className="cmp-res">{open ? <span className="rl-dash">–</span> : tieScore(t)}</span>
      <span className={side(t.away)}><TeamName g={g} id={t.away} season={snap.season} size={28} /></span>
      <span className="rl-dim rl-meta">{open && t.date ? `${CalendarEngine.formatDate(t.date)}${t.legDates?.[1] && t.agg !== false ? ` / ${CalendarEngine.formatDate(t.legDates[1])}` : ''}` : ''}</span>
    </div>
  );
}

/** Spiele einer Gruppen-/Ligarunde je Spieltag (laufende Saison); Archiv: nur Tabellen. */
function GroupMatches({ g, snap, round, onWatch }: { g: Game; snap: CompSnapshot; round: RoundLite; onWatch?: (t: { matchId?: string }) => void }) {
  const ms = round.matches ?? [];
  if (!ms.length) return <div className="dnote">Für frühere Saisons sind nur die Abschlusstabellen gespeichert (Ansicht „Gruppen“).</div>;
  const mds = [...new Set(ms.map((m) => m.md))].sort((a, b) => a - b);
  const league = round.kind === 'league';
  return (
    <div className="cmp-mds">
      {mds.map((md) => {
        const list = ms.filter((m) => m.md === md);
        const shown = list.filter((m) => m.mine).concat(list.filter((m) => !m.mine));
        return (
          <div key={md} className="cmp-md rl rl-sm">
            <div className="cmp-md-head">{md + 1}. Spieltag <span className="dnote">{CalendarEngine.formatDate(list[0].date)}</span></div>
            {shown.map((m) => (
              <div key={m.id} className={`rl-row rl-tie ${m.mine ? 'mine' : ''} ${m.matchId && onWatch ? 'clickable' : ''}`} onClick={() => onWatch?.(m)}>
                <span className="rl-rank">{!league ? m.group : ''}</span>
                <span className="rl-side"><TeamName g={g} id={m.home} season={snap.season} size={22} /></span>
                <span className="cmp-res">{m.hg == null ? <span className="rl-dash">–</span> : <b>{m.hg}:{m.ag}</b>}</span>
                <span className="rl-side"><TeamName g={g} id={m.away} season={snap.season} size={22} /></span>
                <span />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

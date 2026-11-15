// =============================================================================
// SPIELBERICHT im Look des Textmodus (Wunsch Pascal: „als wäre das komplette
// Spiel simuliert worden“): dunkle Bühne wie screens/match/ – Kopf mit Wappen,
// Leiste (Platz, Flagge, Verein), großem Ergebnis, Trainern, Torschützen, Uhr
// beim Abpfiff, Spieler des Spiels und Zeitleiste 0–90 mit Druckphasen; darunter
// der vollständige Spielticker (Reiter Alles/Highlights/Tore/Wechsel/Karten) und
// rechts Statistik bzw. Aufstellungen mit Noten/Einzelwerten.
// Daten: Match + Bericht aus dem Spielstand, Zeilen aus game/matchTicker.ts.
// =============================================================================
import { useMemo, useState } from 'react';
import ClubCrest from '../../../components/ClubCrest';
import FaceThumb from '../../../components/FaceThumb';
import { ClubLink } from '../../../components/club/ClubLink';
import { PlayerLink, usePlayerProfile } from '../../../components/playerMenu/PlayerLink';
import { WeatherGlyph } from '../../../components/WeatherGlyph';
import { eraRules } from '../../../engine/match/era';
import type { MatchEventExt, MatchResultExt, Side } from '../../../engine/match/types';
import { unpackLines, type MatchTicker } from '../../../game/matchTicker';
import type { Game } from '../../../game/state';
import { ClockView, splitLabel, StageRow, TeamInfo, TimelineView, type Mark } from '../../../screens/match/board/Stage';
import { TickerFeed, type FeedSource } from '../../../screens/match/board/TickerList';
import type { Match } from '../../../types';
import { fmtDateFull } from '../../../ui/format';
import { ClubFlag, LineupCol, StatTable, WEATHER } from './reportParts';

type RTab = 'stats' | 'lineups' | 'detail';

function marksOf(m: Match): Mark[] {
  const out: Mark[] = [];
  (m.events as MatchEventExt[]).forEach((e, i) => {
    const side: Side = e.clubId === m.homeClubId ? 'home' : 'away';
    const kind: Mark['kind'] | null = e.type === 'goal' || e.type === 'own_goal' || e.type === 'penalty_goal' ? 'goal'
      : e.type === 'yellow_card' ? 'card-y' : e.type === 'yellow_red_card' || e.type === 'red_card' ? 'card-r'
        : e.type === 'substitution' ? 'sub' : e.type === 'injury' ? 'injury' : null;
    if (kind) out.push({ min: e.minute, side, kind, seq: i + 1 });
  });
  return out;
}

export function TickerReport({ g, match: m, label, ticker: t, onClose }: { g: Game; match: Match; label: string; ticker: MatchTicker; onClose: () => void }) {
  const [tab, setTab] = useState<RTab>('stats');
  const api = usePlayerProfile();
  const r = m.result as MatchResultExt;
  const rep = r.report;
  const H = g.clubs[m.homeClubId], A = g.clubs[m.awayClubId];
  const lines = useMemo(() => unpackLines(t), [t]);
  const history = useMemo(() => lines.slice().reverse(), [lines]);
  const year = rep?.year ?? Number(m.date.slice(0, 4));
  const av = eraRules(year).stats;

  // Positionen/Seiten aus den Aufstellungen des Berichts (Färbung + „(IV)“ im Ticker)
  const who = useMemo(() => {
    const map = new Map<string, { side: Side; pos: string }>();
    for (const s of ['home', 'away'] as Side[]) for (const e of rep?.lineups[s] ?? []) map.set(e.id, { side: s, pos: e.pos });
    return map;
  }, [rep]);
  const src: FeedSource = {
    club: (s) => (s === 'home' ? H : A),
    who: (id) => who.get(id),
    goalsBefore: (id) => t.sg[id] ?? 0,
    lastName: (id) => g.players[id]?.lastName ?? lines.find((l) => l.scorerId === id)?.scorer ?? '',
  };
  const scorers = (s: Side) => lines.filter((l) => l.scorer && l.side === s).map((l) => ({ key: l.id, label: `${l.scorer} ${l.minute}` }));
  const aet = m.events.some((e) => e.type === 'extra_time_start');
  const tie = m.events.find((e) => e.type === 'shootout_end');
  const len = aet ? 120 : 90;
  const motm = r.manOfTheMatchId ? g.players[r.manOfTheMatchId] : null;
  const motmGrade = r.manOfTheMatchId ? [...(rep?.lineups.home ?? []), ...(rep?.lineups.away ?? [])].find((e) => e.id === r.manOfTheMatchId)?.grade : undefined;
  const [comp, sub] = splitLabel(label);
  const hasDetail = !!rep?.lineups.home.some((e) => e.st);
  const tabs: [RTab, string][] = [['stats', 'Statistik'], ['lineups', 'Aufstellungen'], ...(hasDetail ? [['detail', 'Einzelwerte'] as [RTab, string]] : [])];
  const Teams = () => (
    <div className="mr2-teams">
      {([m.homeClubId, m.awayClubId] as const).map((id, i) => (
        <ClubLink key={id} id={id} className={`mr2-team ${i ? 'away' : 'home'} ${id === g.managedClubId ? 'mine' : ''}`}>
          <ClubFlag g={g} id={id} date={m.date} height={14} /><ClubCrest club={i ? A : H} size={24} /><span>{(i ? A : H).name}</span>
        </ClubLink>
      ))}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal mr-modal mr2" onClick={(e) => e.stopPropagation()}>
        <div className="ms-top mr2-top">
          <div className="ms-top-l">
            <span className="ms-comp">Spielbericht</span>
            <span className="ms-dim">{fmtDateFull(m.date)}</span>
            {H.stadium?.name && <span className="ms-dim">{H.stadium.name}</span>}
            {rep?.weather && <span className="ms-dim ms-wx"><WeatherGlyph w={rep.weather} size={26} /> {WEATHER[rep.weather] ?? rep.weather}</span>}
            <span className="ms-dim">{r.attendance.toLocaleString('de-DE')} Zuschauer</span>
            <span className="ms-pill mr2-pill">{t.w ? 'Im Textmodus verfolgt' : 'Simuliert'}</span>
          </div>
          <button type="button" className="modal-close mr2-close" onClick={onClose} aria-label="Schließen">×</button>
        </div>

        <div className="tm-stage mr2-stage">
          <div className="tm-comp"><div>{comp}{sub && <span> · {sub}</span>}{aet && !tie && <b> · n.V.</b>}{tie?.scoreAfter && <b> · {tie.scoreAfter.home}:{tie.scoreAfter.away} i.E.</b>}</div></div>
          <StageRow home={H} away={A} ranks={t.rank} mySide={t.me} score={[r.homeGoals, r.awayGoals]} ht={rep?.halftime ?? null}
            flags={[<ClubFlag key="h" g={g} id={H.id} date={m.date} height={26} />, <ClubFlag key="a" g={g} id={A.id} date={m.date} height={26} />]} />
          <div className="tm-stage-info">
            <TeamInfo side="home" coach={t.coach[0]} strength={t.str[0]} scorers={scorers('home')} />
            <div className="tm-stage-mid mr2-motm">
              {motm ? (
                <>
                  <span className="mr2-motm-h">Spieler des Spiels</span>
                  <PlayerLink id={motm.id} className="mr2-motm-p">
                    <FaceThumb p={motm} size={40} />
                    <b>{motm.firstName} {motm.lastName}</b>
                    {motmGrade != null && <em>Note {motmGrade.toFixed(1).replace('.', ',')}</em>}
                  </PlayerLink>
                </>
              ) : <span className="mr2-motm-h">Abpfiff</span>}
            </div>
            <div className="tm-stage-away">
              <ClockView frac={1} clock={tie ? 'i.E.' : 'Ende'} />
              <TeamInfo side="away" coach={t.coach[1]} strength={t.str[1]} scorers={scorers('away')} />
            </div>
          </div>
          <TimelineView len={len} now={len} momentum={rep?.momentum ?? []} marks={marksOf(m)} />
        </div>

        <div className="mr2-body">
          <TickerFeed src={src} history={history} current={null} revealing={false} mySide={t.me}
            onPlayer={(id) => { if (api?.canOpen(id)) api.open(id); }}
            head={<span className="mr2-tkhead"><ClubFlag g={g} id={H.id} date={m.date} height={13} />{H.shortName ?? H.name}<b>{r.homeGoals}:{r.awayGoals}</b><ClubFlag g={g} id={A.id} date={m.date} height={13} />{A.shortName ?? A.name}</span>} />
          <div className="ms-panel mr2-side">
            <div className="tm-tabs" role="tablist">
              {tabs.map(([id, l]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{l}</button>)}
            </div>
            <Teams />
            <div className="mr2-side-body">
              {tab === 'stats' && <StatTable r={r} hs={rep?.home} as={rep?.away} av={av} />}
              {tab !== 'stats' && (rep ? (
                <div className="mr-lineups">
                  <LineupCol g={g} list={rep.lineups.home} detail={tab === 'detail'} av={av} />
                  <LineupCol g={g} list={rep.lineups.away} detail={tab === 'detail'} av={av} />
                </div>
              ) : <div className="mr-empty">Für dieses Spiel liegen keine Aufstellungen vor.</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

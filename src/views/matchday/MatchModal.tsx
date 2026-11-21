// =============================================================================
// SPIELBERICHT – Einstieg. Eigene Spiele mit gespeichertem Ticker
// (game/matchTicker.ts, letzte TICKER_KEEP Spiele) zeigen den Bericht im Look
// des Textmodus (report/TickerReport.tsx). Sonst – fremde Spiele, ältere eigene
// Spiele, alte Spielstände – das bisherige Fenster: Verlauf, zeitgemäße
// Statistik, Aufstellungen mit Noten, Druckphasen.
// =============================================================================
import { PlayerLink } from '../../components/playerMenu/PlayerLink';
import { useState } from 'react';
import { ClubLink } from '../../components/club/ClubLink';
import ClubCrest from '../../components/ClubCrest';
import Icon from '../../components/Icon';
import { eraRules } from '../../engine/match/era';
import type { MatchEventExt, MatchResultExt } from '../../engine/match/types';
import { findMatch } from '../../game/ownMatch';
import { tickerFor } from '../../game/matchTicker';
import { Game } from '../../game/state';
import { fmtDateFull } from '../../ui/format';
import type { MatchEventType } from '../../types';
import { ClubFlag, LineupCol, StatTable, WEATHER } from './report/reportParts';
import { TickerReport } from './report/TickerReport';

const KEY: MatchEventType[] = ['goal', 'own_goal', 'penalty_goal', 'penalty_missed', 'penalty_saved', 'yellow_card', 'yellow_red_card',
  'red_card', 'substitution', 'injury', 'chance', 'half_time', 'extra_time_start', 'shootout_start', 'shootout_goal', 'shootout_miss', 'shootout_end'];

function evLabel(e: MatchEventExt): { tag: string; cls: string } {
  switch (e.type) {
    case 'goal': case 'penalty_goal': case 'own_goal': return { tag: 'Tor', cls: 'goal' };
    case 'yellow_card': return { tag: 'Gelb', cls: 'y' };
    case 'yellow_red_card': return { tag: 'Gelb-Rot', cls: 'r' };
    case 'red_card': return { tag: 'Rot', cls: 'r' };
    case 'substitution': return { tag: 'Wechsel', cls: 'sub' };
    case 'injury': return { tag: 'Verletzt', cls: 'inj' };
    case 'chance': return { tag: 'Chance', cls: 'ch' };
    case 'penalty_missed': case 'penalty_saved': return { tag: 'Elfer', cls: 'ch' };
    case 'shootout_goal': case 'shootout_miss': return { tag: 'i.E.', cls: 'so' };
    default: return { tag: '', cls: 'phase' };
  }
}

export function MatchModal({ g, matchId, onClose }: { g: Game; matchId: string; onClose: () => void }) {
  const [detail, setDetail] = useState(false);
  const found = findMatch(g, matchId);
  if (!found || !found.match.result) return null;
  const m = found.match;
  const ticker = tickerFor(g, m.date, m.homeClubId, m.awayClubId);
  if (ticker && g.clubs[m.homeClubId] && g.clubs[m.awayClubId]) return <TickerReport g={g} match={m} label={found.label} ticker={ticker} onClose={onClose} />;
  const r = m.result as MatchResultExt;
  const rep = r.report;
  const h = g.clubs[m.homeClubId], a = g.clubs[m.awayClubId];
  const year = rep?.year ?? Number(m.date.slice(0, 4));
  const av = eraRules(year).stats;
  const events = (m.events as MatchEventExt[]).filter((e) => KEY.includes(e.type));
  const motm = r.manOfTheMatchId ? g.players[r.manOfTheMatchId] : null;
  const tie = m.events.find((e) => e.type === 'shootout_end');
  const aet = m.events.some((e) => e.type === 'extra_time_start');
  const myId = g.managedClubId;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal mr-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        {/* ---------- Kopf ---------- */}
        <div className="mr-head">
          <div className="mr-meta">
            <span className="mr-comp">{found.label}</span>
            <span>{fmtDateFull(m.date)}</span>
            <span>{h?.stadium?.name}</span>
            <span>{r.attendance.toLocaleString('de-DE')} Zuschauer</span>
            {rep?.weather && <span><Icon name="weather" size={18} /> {WEATHER[rep.weather] ?? rep.weather}</span>}
          </div>
          <div className="mr-score">
            <div className={`mr-team ${m.homeClubId === myId ? 'mine' : ''}`}><ClubLink id={m.homeClubId} block className="mr-team-link"><ClubCrest club={h} size={92} /><ClubFlag g={g} id={m.homeClubId} date={m.date} height={22} /><b>{h?.name}</b></ClubLink></div>
            <div className="mr-res">
              <div className="mr-big">{r.homeGoals}<span>:</span>{r.awayGoals}</div>
              <div className="mr-sub">
                {rep && <>Halbzeit {rep.halftime[0]}:{rep.halftime[1]}</>}
                {aet && <> · n.V.</>}
                {tie?.scoreAfter && <> · {tie.scoreAfter.home}:{tie.scoreAfter.away} i.E.</>}
              </div>
            </div>
            <div className={`mr-team ${m.awayClubId === myId ? 'mine' : ''}`}><ClubLink id={m.awayClubId} block className="mr-team-link"><ClubCrest club={a} size={92} /><b>{a?.name}</b><ClubFlag g={g} id={m.awayClubId} date={m.date} height={22} /></ClubLink></div>
          </div>
          {motm && <div className="mr-motm">Spieler des Spiels: <PlayerLink id={motm.id}><b>{motm.firstName} {motm.lastName}</b></PlayerLink></div>}
        </div>

        {rep?.momentum?.length ? (
          <div className="mr-mom" title="Druckphasen">
            {rep.momentum.map((v, i) => (
              <span key={i} className={i === 44 ? 'ht' : ''}>
                {v > 0.02 && <i className="up" style={{ height: `${Math.min(100, v * 160)}%` }} />}
                {v < -0.02 && <i className="dn" style={{ height: `${Math.min(100, -v * 160)}%` }} />}
              </span>
            ))}
          </div>
        ) : null}

        {/* ---------- Inhalt ---------- */}
        <div className="mr-body">
          <div className="mr-box">
            <div className="mr-box-h">Spielverlauf</div>
            <div className="mr-events">
              {events.map((e) => {
                const l = evLabel(e);
                const home = e.clubId === m.homeClubId;
                return (
                  <div key={e.id} className={`mr-ev ${l.cls} ${home ? 'h' : 'a'}`}>
                    <span className="mr-ev-min">{e.type === 'half_time' ? 'HZ' : e.stoppage ? `${e.minute}+${e.stoppage}'` : `${e.minute}'`}</span>
                    {l.tag && <span className={`mr-ev-tag ${l.cls}`}>{l.tag}</span>}
                    <span className="mr-ev-txt">{e.commentary}</span>
                  </div>
                );
              })}
              {!events.length && <div className="mr-empty">Keine besonderen Vorkommnisse.</div>}
            </div>
          </div>

          <div className="mr-box">
            <div className="mr-box-h">Statistik</div>
            <StatTable r={r} hs={rep?.home} as={rep?.away} av={av} />
          </div>

          <div className="mr-box">
            <div className="mr-box-h">Aufstellungen{rep ? (detail ? ' und Einzelwerte' : ' und Noten') : ''}</div>
            {rep?.lineups.home.some((e) => e.st) && (
              <div className="mr-lu-toggle">
                <button className={!detail ? 'on' : ''} onClick={() => setDetail(false)}>Noten</button>
                <button className={detail ? 'on' : ''} onClick={() => setDetail(true)}>Einzelwerte</button>
              </div>
            )}
            {rep ? (
              <div className="mr-lineups">
                <LineupCol g={g} list={rep.lineups.home} detail={detail} av={av} />
                <LineupCol g={g} list={rep.lineups.away} detail={detail} av={av} />
              </div>
            ) : <div className="mr-empty">Für dieses Spiel liegen keine Aufstellungen vor.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

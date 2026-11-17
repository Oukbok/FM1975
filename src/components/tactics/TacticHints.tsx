// =============================================================================
// „Einschätzung des Trainerteams“ (ersetzt die gemessene „Wirkung im Spiel“,
// Wunsch Pascal: keine Zahlen, die die beste Taktik verraten). Oben das Profil
// der Startelf in Worten, darunter je Bereich höchstens ein Hinweis: Warnung,
// ungenutzte Stärke (Idee), nächster Gegner, Bestätigung. Logik game/tacticHints.ts.
// =============================================================================
import { useMemo } from 'react';
import type { Club, Player } from '../../types';
import type { Game } from '../../game/state';
import { AREA_LABEL, tacticHints, type HintTone } from '../../game/tacticHints';
import { ownCoaching } from '../../game/coachingGame';
import { PlayerLink } from '../playerMenu/PlayerLink';

const TONE: Record<HintTone, string> = { warn: 'Vorsicht', idea: 'Idee', opp: 'Gegner', good: 'Passt' };

export function TacticHints({ g, club, opp, year }: { g: Game; club: Club; opp: Club | null; year: number }) {
  const t = club.tactics;
  const key = JSON.stringify([t, opp?.id, year]);
  const level = useMemo(() => { try { return ownCoaching(g).level; } catch { return 60; } }, [g]);
  const res = useMemo(() => tacticHints(club, g.players, year, opp, level), [key, level]); // eslint-disable-line react-hooks/exhaustive-deps
  const players: Record<string, Player> = g.players;
  return (
    <div className="txh">
      <div className="txh-traits">
        {res.traits.map((x) => (
          <span key={x.label} className={`txh-trait ${x.tone}`}><i>{x.label}</i><b>{x.word}</b></span>
        ))}
      </div>
      <ul className="txh-list sb-out">
        {res.hints.map((h, i) => (
          <li key={i} className={`txh-hint ${h.tone}`}>
            <div className="txh-top"><span className="txh-tone">{TONE[h.tone]}</span><span className="txh-area">{AREA_LABEL[h.area]}</span></div>
            <p>{h.text}</p>
            {h.who?.length ? (
              <div className="txh-who">vor allem {h.who.map((id, k) => (
                <span key={id}>{k ? ', ' : ''}<PlayerLink id={id}>{players[id]?.lastName ?? ''}</PlayerLink></span>
              ))}</div>
            ) : null}
          </li>
        ))}
      </ul>
      {!res.sure && <div className="txh-note">Das Trainerteam ist sich unsicher – ein stärkerer Stab sieht mehr.</div>}
    </div>
  );
}

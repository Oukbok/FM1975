// =============================================================================
// Box „Begegnungen“ (Wunsch Pascal, Vorbild Spieltagsübersicht einer Sportzeitung):
// Spiele des gewählten Spieltags nach Datum, Heim rechtsbündig | Ergebnis mit
// Halbzeitstand | Gast. Blättern über die Pfeile (gleicher Spieltag wie die Tabelle).
// =============================================================================
import Icon from '../../../components/Icon';
import { CalendarEngine } from '../../../engine/calendar';
import type { ResTuple } from '../../../game/leagueResults';
import type { Game } from '../../../game/state';
import { DashBox, Empty } from '../../../ui/DashPage';
import { TeamName } from './parts';

export interface MdGame { md: number; date: string; home: string; away: string; hg: number | null; ag: number | null; hh: number; ha: number }

export function MatchdayBox({ g, season, games, md, maxMd, onMd, none }: {
  g: Game; season: string; games: MdGame[]; md: number; maxMd: number; onMd: (n: number) => void; none?: string;
}) {
  const day = games.filter((x) => x.md === md).sort((a, b) => a.date.localeCompare(b.date) || a.home.localeCompare(b.home));
  const dates = [...new Set(day.map((x) => x.date))];
  const mid = g.managedClubId;
  return (
    <DashBox title={maxMd ? `Begegnungen · ${md}. Spieltag` : 'Begegnungen'} className="cmp-mdbox"
      right={maxMd ? <span className="dbtnrow">
        <button className="b3 b3-s b3-icon" disabled={md <= 1} onClick={() => onMd(md - 1)} aria-label="Vorheriger Spieltag" title="Vorheriger Spieltag"><Icon name="navPrev" size={16} /></button>
        <button className="b3 b3-s b3-icon" disabled={md >= maxMd} onClick={() => onMd(md + 1)} aria-label="Nächster Spieltag" title="Nächster Spieltag"><Icon name="navNext" size={16} /></button>
      </span> : undefined}>
      {none ? <Empty icon="stats">{none}</Empty> : (
        <div className="md-list">
          {dates.map((d) => (
            <div key={d} className="md-day">
              <div className="md-date">{CalendarEngine.formatDate(d)}</div>
              {day.filter((x) => x.date === d).map((x) => (
                <div key={`${x.home}-${x.away}`} className={`md-row ${x.home === mid || x.away === mid ? 'me' : ''}`}>
                  <span className="md-home"><TeamName g={g} id={x.home} season={season} size={22} /></span>
                  <span className="md-score">
                    <b>{x.hg == null ? '–:–' : `${x.hg}:${x.ag}`}</b>
                    {x.hg != null && x.hh >= 0 && <small>{x.hh}:{x.ha}</small>}
                  </span>
                  <span className="md-away"><TeamName g={g} id={x.away} season={season} size={22} /></span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </DashBox>
  );
}

export const fromTuple = (r: ResTuple): MdGame => ({ md: r[0], date: r[1], home: r[2], away: r[3], hg: r[4], ag: r[5], hh: r[6], ha: r[7] });

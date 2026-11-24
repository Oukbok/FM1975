// =============================================================================
// Relegation/Play-offs unter der Ligatabelle (Statistiken › Liga): Format der Saison,
// Paarungen mit Hin-/Rückspiel und Sieger – Heimatland und Auslandsligen
// (Daten game/relegationView.ts `relSnapshotInfo`).
// =============================================================================
import type { Game } from '../../../game/state';
import type { RelSnapInfo } from '../../../game/relegationView';
import { CalendarEngine } from '../../../engine/calendar';
import { TeamName } from './parts';
import { InfoTip } from '../../../ui/InfoTip';

const score = (l: { hg?: number; ag?: number; et?: 1; p?: [number, number] }) =>
  l.hg == null ? '–:–' : `${l.hg}:${l.ag}${l.p ? ` (${l.p[0]}:${l.p[1]} i.E.)` : l.et ? ' n.V.' : ''}`;

export function RelegationStrip({ g, season, info, onWatch }: { g: Game; season: string; info: RelSnapInfo; onWatch?: (matchId: string) => void }) {
  return (
    <div className="rgx">
      {!info.blocks.length && <div className="rgx-block"><div className="rgx-head"><b>Relegation</b><InfoTip k="relegation" /><span className="rgx-sub">{info.hint}</span></div>
        <div className="rgx-note">Die Paarungen stehen nach dem letzten Spieltag fest.</div></div>}
      {info.blocks.map((b, i) => (
        <div key={i} className="rgx-block">
          <div className="rgx-head">
            <b>{b.title}</b>{i === 0 && <InfoTip k="relegation" />}
            {b.w ? <span className="rgx-win">Sieger: <TeamName g={g} id={b.w} season={season} size={18} /></span>
              : b.skip ? <span className="rgx-sub">nicht nötig</span> : b.pending ? <span className="rgx-sub">Paarungen nach dem letzten Spieltag</span> : null}
          </div>
          {b.skip && <div className="rgx-note">Keine Punktgleichheit – das Entscheidungsspiel entfällt.</div>}
          {b.ties.map((t, k) => (
            <div key={k} className="rgx-tie">
              {t.name && <span className="rgx-stage">{t.name}</span>}
              {t.legs.map((l, j) => (
                <button key={j} type="button" className={`rgx-leg ${l.matchId ? 'link' : ''}`} disabled={!l.matchId || !onWatch}
                  onClick={() => l.matchId && onWatch?.(l.matchId)} title={l.matchId ? 'Spielbericht öffnen' : CalendarEngine.formatDate(l.d)}>
                  <span className="rgx-date">{`${+l.d.slice(8)}.${+l.d.slice(5, 7)}.`}</span>
                  <TeamName g={g} id={l.h} season={season} size={18} />
                  <span className="rgx-score">{score(l)}</span>
                  <TeamName g={g} id={l.a} season={season} size={18} />
                </button>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

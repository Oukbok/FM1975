// =============================================================================
// Gruppenübersicht (Gruppenphase) – wiederverwendbar. Kennzeichnet, wie viele
// Vereine je Gruppe weiterkommen und wer in einen anderen Wettbewerb wechselt
// (z. B. Gruppendritte). Stil: .gt-* in styles/28-draw.css.
// Hinweis: Die Europapokal-Engine spielt derzeit reines K.-o.-System; die
// Komponente ist für eine spätere Gruppenphase und eigene Daten vorbereitet.
// =============================================================================
import ClubCrest from '../ClubCrest';
import { ClubLink } from '../club/ClubLink';
import type { BracketClub } from './CupBracket';

export interface GroupRow { id: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; pts: number }
export interface GroupTable { name: string; rows: GroupRow[] }

export interface GroupTablesProps {
  groups: GroupTable[];
  club: (id: string) => BracketClub;
  /** Plätze 1…advance kommen weiter (z. B. 2). */
  advance: number;
  /** Bezeichnung der nächsten Runde („Achtelfinale“). */
  advanceLabel: string;
  /** Optional: die nächsten `count` Plätze wechseln in einen anderen Wettbewerb. */
  transfer?: { count: number; label: string };
  highlightId?: string;
}

export function GroupTables({ groups, club, advance, advanceLabel, transfer, highlightId }: GroupTablesProps) {
  const zone = (pos: number) => pos < advance ? 'adv' : transfer && pos < advance + transfer.count ? 'move' : 'out';
  return (
    <div className="gt-root">
      <div className="gt-legend">
        <span className="gt-key adv" /> Platz 1{advance > 1 ? `–${advance}` : ''}: {advanceLabel}
        {transfer && <><span className="gt-key move" /> Platz {advance + 1}{transfer.count > 1 ? `–${advance + transfer.count}` : ''}: {transfer.label}</>}
        <span className="gt-key out" /> ausgeschieden
      </div>
      <div className="gt-grid">
        {groups.map((g) => (
          <div key={g.name} className="gt-group">
            <div className="gt-head"><span>{g.name}</span><span>Sp</span><span>Tore</span><span>Pkt</span></div>
            {g.rows.map((r, i) => {
              const c = club(r.id);
              return (
                <div key={r.id} className={`gt-row ${zone(i)} ${r.id === highlightId ? 'me' : ''}`}>
                  <span className="gt-pos">{i + 1}</span>
                  <ClubLink id={r.id}><span className="gt-club"><ClubCrest club={c.crest} size={18} /><span>{c.name}</span></span></ClubLink>
                  <span className="gt-num">{r.played}</span>
                  <span className="gt-num">{r.gf}:{r.ga}</span>
                  <span className="gt-num gt-pts">{r.pts}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

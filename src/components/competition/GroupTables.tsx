// =============================================================================
// Gruppenübersicht (Gruppenphase / Ligaphase) – wiederverwendbar. Kennzeichnet je
// Platz, wohin es geht: weiter (grün), Zwischenrunde/Play-offs (gedämpft grün),
// Wechsel in einen anderen Wettbewerb (grau), raus. Stil: .gt-* in styles/28-draw.css
// bzw. 28-euro2.css. Daten: game/competitionView.ts (`RoundLite.groups`).
// =============================================================================
import ClubCrest from '../ClubCrest';
import { ClubLink } from '../club/ClubLink';
import type { BracketClub } from './CupBracket';

export interface GroupRow { id: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; pts: number }
export interface GroupTable { name: string; rows: GroupRow[] }
/** Platzbereich (1-basiert) mit Ziel. `kind`: adv = weiter, po = Zwischenrunde/Play-offs, move = anderer Wettbewerb. */
export interface GroupZone { from: number; to: number; label: string; kind: 'adv' | 'po' | 'move' }

export interface GroupTablesProps {
  groups: GroupTable[];
  club: (id: string) => BracketClub;
  zones: GroupZone[];
  highlightId?: string;
  /** Eine große Tabelle (Ligaphase) mit allen Spalten. */
  wide?: boolean;
  /** Zusätzlich die besten Gruppenzweiten (1997/98) als weiter markieren. */
  extraAdvance?: Set<string>;
}

export function GroupTables({ groups, club, zones, highlightId, wide, extraAdvance }: GroupTablesProps) {
  const zone = (pos: number, id: string) => zones.find((z) => pos + 1 >= z.from && pos + 1 <= z.to)?.kind ?? (extraAdvance?.has(id) ? 'adv' : 'out');
  const range = (z: GroupZone) => (z.from === z.to ? `Platz ${z.from}` : `Platz ${z.from}–${z.to}`);
  return (
    <div className={`gt-root ${wide ? 'wide' : ''}`}>
      <div className="gt-legend">
        {zones.map((z) => <span key={`${z.from}-${z.label}`} className="gt-leg"><span className={`gt-key ${z.kind}`} /> {range(z)}: {z.label}</span>)}
        {extraAdvance && extraAdvance.size > 0 && <span className="gt-leg"><span className="gt-key adv" /> beste Gruppenzweite: weiter</span>}
        <span className="gt-leg"><span className="gt-key out" /> ausgeschieden</span>
      </div>
      <div className="gt-grid">
        {groups.map((g) => (
          <div key={g.name} className="gt-group">
            <div className="gt-head">
              <span>{wide ? g.name : `Gruppe ${g.name}`}</span><span>Sp</span>
              {wide && <><span>S</span><span>U</span><span>N</span></>}
              <span>Tore</span>{wide && <span>Diff</span>}<span>Pkt</span>
            </div>
            <div className="gt-rows">
              {g.rows.map((r, i) => {
                const c = club(r.id);
                return (
                  <div key={r.id} className={`gt-row ${zone(i, r.id)} ${r.id === highlightId ? 'me' : ''}`}>
                    <span className="gt-pos">{i + 1}</span>
                    <ClubLink id={r.id}><span className="gt-club"><ClubCrest club={c.crest} size={18} /><span>{c.name}</span></span></ClubLink>
                    <span className="gt-num">{r.played}</span>
                    {wide && <><span className="gt-num">{r.won}</span><span className="gt-num">{r.drawn}</span><span className="gt-num">{r.lost}</span></>}
                    <span className="gt-num">{r.gf}:{r.ga}</span>
                    {wide && <span className="gt-num">{r.gf - r.ga > 0 ? '+' : ''}{r.gf - r.ga}</span>}
                    <span className="gt-num gt-pts">{r.pts}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Turnierbaum (K.-o.-Runden) – wiederverwendbar in der Auslosungs-Show und auf
// den Statistikseiten. Daten: game/cupBracket.ts `bracketFromCup` (oder eigene
// Runden im selben Format). Stil: .cb-* in styles/28-draw.css.
// =============================================================================
import ClubCrest from '../ClubCrest';
import { ClubLink } from '../club/ClubLink';
import type { Club } from '../../types';
import type { BracketRound, BracketTie } from '../../game/cupBracket';
import { fmtDateShort } from '../../ui/format';

export interface BracketClub { name: string; short: string; crest: Club }

export interface CupBracketProps {
  rounds: BracketRound[];
  /** Anzeigedaten eines Vereins (Name, Kürzel, Wappen). */
  club: (id: string) => BracketClub;
  /** Hervorgehobener Verein (meist der eigene). */
  highlightId?: string;
  /** Runde, die gerade ausgelost wurde (Spaltenkopf hervorgehoben). */
  focusRound?: number;
  /** Kürzel statt voller Namen (enge Spalten). */
  useShort?: boolean;
}

export function CupBracket({ rounds, club, highlightId, focusRound, useShort }: CupBracketProps) {
  const dense = (rounds[0]?.ties.length ?? 0) >= 16;
  return (
    <div className={`cb-root ${dense ? 'dense' : ''}`} style={{ gridTemplateColumns: `repeat(${rounds.length}, minmax(0, 1fr))` }}>
      {rounds.map((r, ri) => (
        <div key={ri} className={`cb-col ${ri === focusRound ? 'focus' : ''} ${ri === rounds.length - 1 ? 'last' : ''} ${ri === 0 ? 'first' : ''}`}>
          <div className="cb-head">
            <span className="cb-head-name">{r.name}</span>
            <span className="cb-head-date">{fmtDateShort(r.date).dmy}</span>
          </div>
          <div className="cb-body">
            {r.ties.map((t, ti) => (
              <div key={ti} className={`cb-slot ${ti % 2 ? 'odd' : 'even'}`}>
                {t ? <TieBox t={t} club={club} hl={highlightId} useShort={useShort} />
                  : <div className="cb-tie empty"><span>{r.drawn ? '' : 'offen'}</span></div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TieBox({ t, club, hl, useShort }: { t: BracketTie; club: CupBracketProps['club']; hl?: string; useShort?: boolean }) {
  const mine = !!hl && (t.home === hl || t.away === hl);
  const row = (id: string, goals: number | null, pen: number | undefined) => {
    const c = club(id);
    const cls = t.winner ? (t.winner === id ? 'win' : 'lose') : '';
    return (
      <div className={`cb-row ${cls} ${id === hl ? 'me' : ''}`}>
        <ClubLink id={id}><span className="cb-club"><ClubCrest club={c.crest} size={18} /><span className="cb-name">{useShort ? c.short : c.name}</span></span></ClubLink>
        <span className="cb-goals">{goals ?? ''}{pen != null && <sup>{pen}</sup>}</span>
      </div>
    );
  };
  return (
    <div className={`cb-tie ${mine ? 'mine' : ''}`} title={t.badge ? (t.badge === 'i.E.' ? 'im Elfmeterschießen' : 'nach Verlängerung') : undefined}>
      {row(t.home, t.homeGoals, t.pens?.home)}
      {row(t.away, t.awayGoals, t.pens?.away)}
      {t.badge && <span className="cb-badge">{t.badge}</span>}
    </div>
  );
}

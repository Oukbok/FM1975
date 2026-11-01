// =============================================================================
// Nach der Ziehung: „Alle Paarungen“ (eigener Verein hervorgehoben) und der
// Turnierbaum (bisherige Runden mit Ergebnissen, kommende Runden leer).
// Bausteine: components/competition/CupBracket.tsx, game/cupBracket.ts.
// =============================================================================
import { useMemo } from 'react';
import ClubCrest from '../../components/ClubCrest';
import { ClubLink } from '../../components/club/ClubLink';
import { CupBracket, type BracketClub } from '../../components/competition/CupBracket';
import { bracketFromCup } from '../../game/cupBracket';
import type { Game } from '../../game/state';
import type { CupState } from '../../types';
import type { DrawRecord } from '../../types/draw';
import { fmtDateFull } from '../../ui/format';
import { showClub, type ShowClub } from './drawScript';

export type OverviewTab = 'los' | 'pairs' | 'bracket';

/** Anzeigedaten beliebiger Teilnehmer (auch aus früheren Runden), zwischengespeichert. */
export function useClubLookup(g: Game, cup: CupState | null, base: Record<string, ShowClub>): (id: string) => ShowClub {
  return useMemo(() => {
    const cache: Record<string, ShowClub> = { ...base };
    const am = new Set(cup?.amateurClubIds ?? []);
    return (id: string) => (cache[id] ??= showClub(g, id, am));
  }, [g, cup, base]);
}

export function PairsOverview({ rec, clubs, myId }: { rec: DrawRecord; clubs: (id: string) => ShowClub; myId: string }) {
  const n = rec.pairs.length;
  const cols = n > 4 ? 2 : 1;
  const rows = Math.ceil(n / cols);
  const size = rows <= 4 ? 'lg' : 'md';
  const euro = rec.comp !== 'cup';
  const sub = (c: ShowClub) => [euro ? c.country : c.amateur ? 'Amateurverein' : 'Profiverein', `Stärke ${c.strength}`].join(' · ');
  return (
    <div className="dr-wide-body">
      <div className="dr-ov-head">
        <span>{n} Paarungen · gespielt am {fmtDateFull(rec.matchDate)}</span>
        <span className="dr-dim">Links steht der Gastgeber</span>
      </div>
      <div className={`dr-ov-grid ${size}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
        {rec.pairs.map((p, i) => {
          const h = clubs(p.home), a = clubs(p.away);
          const mine = p.home === myId || p.away === myId;
          return (
            <div key={i} className={`dr-ov-card ${mine ? 'mine' : ''}`}>
              <span className="dr-pno">{i + 1}</span>
              <OvClub c={h} sub={sub(h)} side="home" crest={size === 'lg' ? 72 : 44} />
              <span className="dr-ov-mid">{p.swapped ? <span className="dr-tag" title="Heimrecht für den Amateurverein">Heimrecht</span> : <span className="dr-pdash">–</span>}</span>
              <OvClub c={a} sub={sub(a)} side="away" crest={size === 'lg' ? 72 : 44} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OvClub({ c, sub, side, crest }: { c: ShowClub; sub: string; side: 'home' | 'away'; crest: number }) {
  return (
    <div className={`dr-ov-club ${side} ${c.mine ? 'me' : ''}`}>
      <ClubLink id={c.id}><ClubCrest club={c.crest} size={crest} /></ClubLink>
      <div className="dr-ov-txt">
        <div className="dr-ov-name">{c.name}</div>
        <div className="dr-ov-sub">{sub}</div>
      </div>
    </div>
  );
}

export function BracketOverview({ cup, rec, clubs, myId }: { cup: CupState; rec: DrawRecord; clubs: (id: string) => ShowClub; myId: string }) {
  const rounds = useMemo(() => bracketFromCup(cup), [cup, rec]);
  const club = (id: string): BracketClub => clubs(id);
  return (
    <div className="dr-wide-body dr-bracket">
      <CupBracket rounds={rounds} club={club} highlightId={myId} focusRound={rec.roundIndex} />
    </div>
  );
}

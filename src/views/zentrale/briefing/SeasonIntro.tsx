// =============================================================================
// SAISON-AUFTAKT — Eröffnungsanimation vor dem Saison-Briefing (ca. 6 s)
// -----------------------------------------------------------------------------
// Bühne in Textmodus-Größe: Mittellinie und Mittelkreis zeichnen sich, die
// Saisonzahl rollt ein (bis 1986 als Fallblatt-Anzeigetafel), Schlagzeile,
// Epoche, dann Wappen, Verein, Liga und Saisonziel. Der Bernstein-Bogen um den
// Mittelkreis zeigt die Restzeit. Überspringen: Klick, Leertaste, Enter, Esc
// (Tasten fängt BriefingModal ab). Nur CSS-Animationen (28-season-intro.css),
// `prefers-reduced-motion` → BriefingModal zeigt die Bühne gar nicht.
// =============================================================================
import { useEffect } from 'react';
import ClubCrest from '../../../components/ClubCrest';
import type { EraTipSet } from '../../../data/briefings/eraTips';
import type { SeasonBriefing } from '../../../game/seasonBriefing';
import type { Club } from '../../../types';

/** Gesamtdauer bis zum automatischen Übergang (ms). */
export const INTRO_MS = 6200;

/** Ziffernfolge einer Rolle: von `from` mehrfach durchlaufen bis `to`. */
function rollSeq(from: number, to: number, spins: number): number[] {
  const seq: number[] = [from];
  let d = from;
  const steps = spins * 10 + ((to - from + 10) % 10);
  for (let i = 0; i < steps; i++) { d = (d + 1) % 10; seq.push(d); }
  return seq;
}

function RollingYear({ year, prev, flap }: { year: number; prev: number; flap: boolean }) {
  const digits = String(year).split('').map(Number);
  const from = String(prev).padStart(4, '0').split('').map(Number);
  return (
    <span className={`si-year ${flap ? 'flap' : ''}`} aria-label={String(year)}>
      {digits.map((d, i) => {
        // Hintere Stellen drehen länger – wie ein Zählwerk.
        const seq = rollSeq(from[i], d, i >= 2 ? i - 1 : 0);
        const n = seq.length - 1;
        return (
          <span key={i} className="si-digit" style={{ ['--i' as string]: i }}>
            <span className="si-digit-col" style={{ ['--n' as string]: n, animationDuration: `${900 + i * 160}ms`, animationDelay: `${450 + i * 110}ms` }}>
              {seq.map((x, k) => <span key={k}>{x}</span>)}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function SeasonIntro({ b, club, era, leaving, onSkip }: {
  b: SeasonBriefing; club?: Club; era: EraTipSet; leaving: boolean; onSkip: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onSkip, INTRO_MS);
    return () => clearTimeout(t);
  }, [onSkip]);
  const y = b.startYear;
  const tail = b.season.slice(b.season.indexOf('/') + 1).slice(-2);
  const sit = b.situation;
  const flap = era.motif === 'tv';
  return (
    <div className={`si-stage si-motif-${era.motif} ${leaving ? 'leaving' : ''}`} onClick={onSkip} role="presentation">
      <div className="si-pattern" />
      <svg className="si-pitch" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <line className="si-halfway l" x1="680" y1="420" x2="0" y2="420" />
        <line className="si-halfway r" x1="1240" y1="420" x2="1920" y2="420" />
        <circle className="si-circle" cx="960" cy="420" r="280" />
        <circle className="si-arc" cx="960" cy="420" r="280" pathLength={1000} style={{ animationDuration: `${INTRO_MS}ms` }} />
        <circle className="si-spot" cx="960" cy="420" r="5" />
      </svg>

      <div className="si-top">
        <div className="si-kicker">Saison-Briefing · {b.first ? 'Spielbeginn' : 'Saisonwechsel'}</div>
        <div className="si-era">{era.label}</div>
      </div>

      <div className="si-center">
        <div className="si-season">
          <RollingYear year={y} prev={b.first ? 0 : y - 1} flap={flap} />
          <span className="si-slash">/{tail}</span>
        </div>
      </div>
      <div className="si-headline-wrap"><h1 className="si-headline">{b.headline}</h1></div>

      <div className="si-club">
        {club && <span className="si-crest"><ClubCrest club={club} size={136} /></span>}
        <div className="si-club-id">
          <div className="si-club-name">{club?.name ?? ''}</div>
          <div className="si-chips">
            {sit && <span className="si-chip" style={{ ['--k' as string]: 0 }}>{sit.league}</span>}
            {sit && <span className="si-chip goal" style={{ ['--k' as string]: 1 }}>Saisonziel: {sit.goal}</span>}
            {sit && <span className="si-chip" style={{ ['--k' as string]: 2 }}>Kaderstärke: Rang {sit.rank} von {sit.of}</span>}
          </div>
        </div>
      </div>

      <div className="si-skip">Klick, Leertaste oder Esc – weiter zum Briefing</div>
    </div>
  );
}

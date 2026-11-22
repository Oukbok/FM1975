// =============================================================================
// Laufzeit der Zurufe im Textmodus (Wunsch Pascal: wie lange ein Zuruf gilt,
// muss sichtbar sein): Ring + Text im Reiter Taktik, kleines Etikett in der
// Kopfzeile. Regeln und Zahlen aus engine/match/shouts.ts.
// =============================================================================
import type { MatchSim } from '../../../engine/match/sim';
import { SHOUT_COOLDOWN, SHOUT_MINUTES, shoutLabel, shoutStatus, type ShoutStatus } from '../../../engine/match/shouts';
import type { Side } from '../../../engine/match/types';

type Phase = 'active' | 'pause' | 'ready' | 'closed';
const PAUSE = SHOUT_COOLDOWN - SHOUT_MINUTES;

function phaseOf(sim: MatchSim, s: ShoutStatus): Phase {
  if (sim.finished || sim.phase === 'shootout') return 'closed';
  if (s.active) return 'active';
  return s.wait > 0 ? 'pause' : 'ready';
}
const minText = (n: number) => `${n} Min.`;

/** Ring: Anteil `frac` (0–1) der Strecke gefüllt, in der Mitte die Zahl. */
function Ring({ frac, num, size }: { frac: number; num: string; size: number }) {
  const r = 42, c = 2 * Math.PI * r;
  return (
    <svg className="ms-sring" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r={r} className="bg" />
      <circle cx="50" cy="50" r={r} className="fg" strokeDasharray={`${c * Math.max(0, Math.min(1, frac))} ${c}`} transform="rotate(-90 50 50)" />
      <text x="50" y="50" dominantBaseline="central" textAnchor="middle">{num}</text>
    </svg>
  );
}

/** Stärke des laufenden Zurufs (100 % = normal; Kapitän, Tagesform, Wiederholung). */
const powerText = (p: number): string => `Stärke ${Math.round(p * 100)} %`;

/** Großer Status im Reiter Taktik. */
export function ShoutTimer({ sim, side }: { sim: MatchSim; side: Side }) {
  const s = shoutStatus(sim, side);
  const ph = phaseOf(sim, s);
  if (ph === 'closed') return <div className="ms-stimer closed"><div className="ms-stimer-txt"><b>Keine Zurufe mehr</b><span>Das Spiel ist entschieden.</span></div></div>;
  const frac = ph === 'active' ? s.left / SHOUT_MINUTES : ph === 'pause' ? 1 - s.wait / PAUSE : 1;
  return (
    <div className={`ms-stimer ${ph}`}>
      <Ring frac={frac} size={72} num={ph === 'ready' ? '' : String(ph === 'active' ? s.left : s.wait)} />
      <div className="ms-stimer-txt">
        {ph === 'active' && <>
          <b>{shoutLabel(s.active!)} – noch {minText(s.left)}</b>
          <span>wirkt bis zur {s.until}. Min. · {powerText(s.power)}</span>
          <span>nächster Zuruf ab der {s.readyAt}. Min.</span>
        </>}
        {ph === 'pause' && <>
          <b>Pause – wieder möglich ab der {s.readyAt}. Min.</b>
          <span>noch {minText(s.wait)}, die Spieler setzen den letzten Zuruf erst um.</span>
        </>}
        {ph === 'ready' && <>
          <b>Bereit für einen Zuruf</b>
          <span>Ein Zuruf wirkt {SHOUT_MINUTES} Minuten, der nächste geht {SHOUT_COOLDOWN} Minuten danach.</span>
        </>}
      </div>
      <div className="ms-stimer-bar" aria-hidden="true">
        <i className="w" style={{ width: `${(SHOUT_MINUTES / SHOUT_COOLDOWN) * 100}%` }} />
        <i className="p" style={{ width: `${(PAUSE / SHOUT_COOLDOWN) * 100}%` }} />
        {ph !== 'ready' && <em style={{ left: `${((SHOUT_COOLDOWN - s.wait) / SHOUT_COOLDOWN) * 100}%` }} />}
      </div>
    </div>
  );
}

/** Kleines Etikett für die Kopfzeile (nur solange ein Zuruf wirkt oder die Pause läuft). */
export function ShoutChip({ sim, side, onClick }: { sim: MatchSim; side: Side; onClick: () => void }) {
  const s = shoutStatus(sim, side);
  const ph = phaseOf(sim, s);
  if (ph !== 'active' && ph !== 'pause') return null;
  const frac = ph === 'active' ? s.left / SHOUT_MINUTES : 1 - s.wait / PAUSE;
  const title = ph === 'active' ? `${shoutLabel(s.active!)} wirkt noch ${minText(s.left)} (bis zur ${s.until}. Min.)` : `Nächster Zuruf ab der ${s.readyAt}. Min.`;
  return (
    <button type="button" className={`ms-schip ${ph === 'active' ? 'run' : 'wait'}`} onClick={onClick} title={title}>
      <Ring frac={frac} size={30} num="" />
      {ph === 'active' ? <span><b>{shoutLabel(s.active!)}</b> noch {minText(s.left)}</span> : <span>Zuruf ab <b>{s.readyAt}.</b> Min.</span>}
    </button>
  );
}

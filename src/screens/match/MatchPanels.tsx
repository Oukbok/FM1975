// =============================================================================
// Seitenteile des Textmodus: Statistik (zeitgemäß) und Taktik/Zurufe (Laufzeit board/ShoutTimer.tsx).
// Aufstellung: board/LineupBoard.tsx, Druckphasen: Zeitleiste in board/Stage.tsx.
// =============================================================================
import Icon from '../../components/Icon';
import type { MatchSim } from '../../engine/match/sim';
import type { TeamState } from '../../engine/match/state';
import { MENTALITY_LABEL, type Mentality, type ShoutId, type Side } from '../../engine/match/types';
import {
  captainLead, leadFactor, repeatFactor, SHOUT_LIST, SHOUT_MINUTES, SHOUT_REPEAT_WINDOW, shoutFxText, shoutRepeats, shoutStatus,
} from '../../engine/match/shouts';
import { InfoTip } from '../../ui/InfoTip';
import { ShoutTimer } from './board/ShoutTimer';

// -----------------------------------------------------------------------------
// Statistik (nur, was es in der jeweiligen Zeit schon gab)
// -----------------------------------------------------------------------------

function liveKm(sim: MatchSim, t: TeamState): number {
  const kmPerMin = sim.year < 1985 ? 0.088 : sim.year < 2000 ? 0.1 : sim.year < 2012 ? 0.112 : 0.118;
  const now = sim.minute;
  let km = 0;
  for (const m of t.players) {
    if (!m.started && m.minuteIn === 0 && !m.onPitch) continue;
    const mins = Math.max(0, (m.minuteOut ?? now) - m.minuteIn);
    const a = m.p.attributes;
    const work = m.group === 'GK' ? 0.5 : 0.82 + (a.workRate / 100) * 0.22 + (a.stamina / 100) * 0.1;
    km += mins * kmPerMin * work;
  }
  return km;
}

export function StatsPanel({ sim }: { sim: MatchSim }) {
  const H = sim.home.stats, A = sim.away.stats, av = sim.era.stats;
  const possT = H.possession + A.possession || 1;
  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
  const rows: [string, number | string, number | string, number, number][] = [];
  const add = (label: string, h: number, a: number, fmt: (v: number) => string = (v) => String(Math.round(v))) =>
    rows.push([label, fmt(h), fmt(a), h, a]);
  add('Tore', sim.home.goals, sim.away.goals);
  if (av.xg) add('Expected Goals', H.xg, A.xg, (v) => v.toFixed(2).replace('.', ','));
  if (av.possession) add('Ballbesitz', pct(H.possession, possT), pct(A.possession, possT), (v) => `${v} %`);
  add('Torschüsse', H.shots, A.shots);
  if (av.shotsOnTarget) add('Aufs Tor', H.shotsOnTarget, A.shotsOnTarget);
  if (av.bigChances) add('Großchancen', H.bigChances, A.bigChances);
  if (av.passes) {
    add('Pässe', H.passes, A.passes);
    add('Passquote', pct(H.passesOk, H.passes), pct(A.passesOk, A.passes), (v) => `${v} %`);
  }
  if (av.duels) add('Zweikämpfe gewonnen', pct(H.duelsWon, H.duels), pct(A.duelsWon, A.duels), (v) => `${v} %`);
  if (av.duels) add('Luftduelle gewonnen', pct(H.aerialsWon ?? 0, H.aerials ?? 0), pct(A.aerialsWon ?? 0, A.aerials ?? 0), (v) => `${v} %`);
  if (av.passes) add('Flanken', H.crosses ?? 0, A.crosses ?? 0);
  if (av.distance) add('Laufleistung', liveKm(sim, sim.home), liveKm(sim, sim.away), (v) => `${v.toFixed(1).replace('.', ',')} km`);
  add('Ecken', H.corners, A.corners);
  add('Fouls', H.fouls, A.fouls);
  add('Abseits', H.offsides, A.offsides);
  add('Gelbe Karten', H.yellow, A.yellow);
  if (H.red || A.red) add('Rote Karten', H.red, A.red);
  if (H.saves || A.saves) add('Paraden', H.saves, A.saves);
  return (
    <div className="ms-stats">
      {rows.map(([label, hs, as, h, a]) => {
        const tot = h + a || 1;
        return (
          <div key={label} className="ms-stat">
            <div className="ms-stat-v"><b>{hs}</b><span>{label}</span><b>{as}</b></div>
            <div className="ms-stat-bar">
              <span className="h" style={{ width: `${(h / tot) * 100}%` }} />
              <span className="a" style={{ width: `${(a / tot) * 100}%` }} />
            </div>
          </div>
        );
      })}
      {sim.year < 1992 && <div className="ms-note">Ballbesitz und weitere Werte werden in dieser Zeit noch nicht erfasst.</div>}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Taktik & Zurufe
// -----------------------------------------------------------------------------

/** Etikett vor dem Klick: Abschlag durch Wiederholung (−30 % je Wiederholung unter den letzten drei). */
function repeatTag(t: TeamState, id: ShoutId): { pct: number; n: number } {
  const n = shoutRepeats(t, id);
  return { n, pct: Math.round((1 - repeatFactor(n)) * 100) };
}

export function TacticsPanel({ sim, side, act }: { sim: MatchSim; side: Side; act: (fn: () => unknown) => unknown }) {
  const t = sim.team(side);
  const st = shoutStatus(sim, side);
  const closed = sim.finished || sim.phase === 'shootout';
  const lead = captainLead(t), lf = Math.round((leadFactor(lead) - 1) * 100);
  return (
    <div className="ms-tactics">
      <div className="ms-sec">Ausrichtung</div>
      <div className="ms-ment">
        {([-2, -1, 0, 1, 2] as Mentality[]).map((m) => (
          <button key={m} className={`ms-chip ${t.mentality === m ? 'on' : ''}`} disabled={closed}
            onClick={() => act(() => sim.setMentality(side, m))}>{MENTALITY_LABEL[m]}</button>
        ))}
      </div>
      <div className="ms-sec"><span>Zurufe <InfoTip k="zurufe" /></span></div>
      <ShoutTimer sim={sim} side={side} />
      <div className="ms-shouts">
        {SHOUT_LIST.map(([id, label, hint]) => {
          const rep = repeatTag(t, id);
          const title = `${label}: ${shoutFxText(id)} – ${SHOUT_MINUTES} Minuten lang.`
            + (rep.n ? ` Schon ${rep.n}× unter deinen letzten ${SHOUT_REPEAT_WINDOW} Zurufen: Wirkung −${rep.pct} %.` : ' Volle Wirkung.');
          return (
            <button key={id} className={`ms-shout ${st.active === id ? 'on' : ''}`} disabled={closed || st.wait > 0 || !!st.active}
              title={title} onClick={() => act(() => sim.shout(side, id))}>
              <Icon name="whistle" size={26} />
              <span className="ms-shout-t">{label}</span>
              <span className="ms-shout-h">{hint}</span>
              {st.active === id ? <span className="ms-shout-tag now">wirkt gerade</span>
                : <span className={`ms-shout-tag ${rep.n ? 'rep' : ''}`}>{rep.n ? `Wiederholung: −${rep.pct} %` : 'volle Wirkung'}</span>}
            </button>
          );
        })}
      </div>
      <div className="ms-note">
        Dein Kapitän (Führung {lead}) gibt Zurufe weiter: {lf === 0 ? 'normale Stärke' : `${lf > 0 ? '+' : '−'}${Math.abs(lf)} %`}.
        Derselbe Zuruf kurz hintereinander nutzt sich ab.
      </div>
    </div>
  );
}

// =============================================================================
// „Aufstellung“ im laufenden Spiel: eigene Elf (oder Gegner) als Tabelle mit
// Live-Note, Stärke, Kraft, Fitness und Status; darunter die Bank mit
// Aufwärmen per Klick und den verbleibenden Wechseln.
// =============================================================================
import Icon from '../../../components/Icon';
import { FitnessIcon, FreshnessIcon, fitness100 } from '../../../components/status';
import { grade } from '../../../engine/match/finish';
import type { MatchSim } from '../../../engine/match/sim';
import { isWarm, stopWarmUps, warmUp } from '../../../engine/match/sideline';
import { bench } from '../../../engine/match/state';
import type { MPlayer, Side } from '../../../engine/match/types';
import { vColor } from '../../../ui/format';
import { shortNamer } from '../names';

export const fmtGrade = (g: number) => g.toFixed(1).replace('.', ',');
export const gradeCls = (g: number) => (g <= 2 ? 'g-top' : g <= 3 ? 'g-good' : g <= 4 ? 'g-mid' : 'g-bad');
/** Noten erst, wenn es etwas zu bewerten gibt. */
export const gradeEarly = (sim: MatchSim) => sim.period === 1 && sim.minute < 15;

export function LineupBoard({ sim, mySide, view, act, onPlayer }: {
  sim: MatchSim; mySide: Side; view: Side; act: (fn: () => unknown) => unknown; onPlayer: (id: string) => void;
}) {
  const mine = view === mySide;
  const t = sim.team(view);
  const field = t.players.filter((m) => m.onPitch);
  const gone = t.players.filter((m) => !m.onPitch && (m.started || m.minuteIn > 0));
  const benchList = bench(t);
  const nm = shortNamer(t.players.map((m) => m.p));
  const early = gradeEarly(sim);
  const closed = sim.finished || sim.phase === 'shootout';
  const anyWarm = benchList.some((b) => b.warmSince != null);
  const avg = (f: (m: MPlayer) => number) => field.length ? field.reduce((s, m) => s + f(m), 0) / field.length : 0;
  const gAvg = avg((m) => grade(sim, m));

  return (
    <div className="tm-lineup">
      <div className="tm-lt">
        <div className="tm-lt-row head">
          <span>Nr</span><span>Pos</span><span>Name</span><span>Note</span><span>Stä</span><span>Kraft</span><span>Fit</span><span />
        </div>
        <div className="tm-lt-body">
          {field.map((m) => <Row key={m.id} sim={sim} m={m} name={nm(m.p)} early={early} onPlayer={onPlayer} />)}
          <div className="tm-lt-row avg">
            <span /><span /><span>Durchschnitt</span>
            <span>{early ? '–' : fmtGrade(gAvg)}</span>
            <span>{Math.round(avg((m) => m.base))}</span>
            <span>{Math.round(avg((m) => m.energy))}</span>
            <span>{Math.round(avg((m) => fitness100(m.p)))}</span><span />
          </div>
          <div className="tm-lt-sec">Ersatzspieler auf der Bank</div>
          {benchList.map((b) => {
            const warming = b.warmSince != null;
            const ready = isWarm(sim, b);
            return (
              <div key={b.id} className={`tm-lt-row bench ${warming ? 'warming' : ''}`}>
                <span className="tm-nr">{b.p.shirtNumber || ''}</span>
                <span className="tm-pos">{b.p.naturalPosition}</span>
                <button type="button" className="tm-plink tm-name" onClick={() => onPlayer(b.id)}>{nm(b.p)}</button>
                <span className="tm-dim">–</span>
                <span style={{ color: vColor(b.p.overall) }}>{b.p.overall}</span>
                <span><FreshnessIcon kind="kraft" value={Math.round(b.energy)} size={20} /></span>
                <span><FitnessIcon value={fitness100(b.p)} size={20} /></span>
                {mine ? (
                  <button type="button" className={`tm-warm ${warming ? 'on' : ''} ${ready ? 'ready' : ''}`} disabled={closed}
                    aria-label={warming ? 'Aufwärmen beenden' : 'Zum Aufwärmen schicken'}
                    onClick={() => act(() => warmUp(sim, mySide, b.id, !warming))}>
                    <Icon name="warmup" size={22} />
                  </button>
                ) : <span />}
              </div>
            );
          })}
          {gone.map((m) => <Row key={m.id} sim={sim} m={m} name={nm(m.p)} early={early} onPlayer={onPlayer} dim />)}
          {!benchList.length && !gone.length && <div className="tm-ev-empty">Niemand mehr auf der Bank.</div>}
        </div>
      </div>
      {mine && (
        <div className="tm-lt-foot">
          <span>{closed ? 'Keine Wechsel mehr möglich' : `Verbleibende Wechsel: ${sim.subsLeft(t)}`}</span>
          <span className="tm-dim">{anyWarm ? 'Aufgewärmte Spieler kommen frischer ins Spiel.' : 'Klick auf das Symbol: zum Aufwärmen schicken.'}</span>
          {anyWarm
            ? <button type="button" className="ms-btn ghost" onClick={() => act(() => stopWarmUps(sim, mySide))}>Aufwärmen abbrechen</button>
            : <button type="button" className="ms-btn ghost" disabled={closed || !benchList.length}
                onClick={() => act(() => { for (const b of benchList) warmUp(sim, mySide, b.id, true); })}>Alle Spieler aufwärmen</button>}
        </div>
      )}
    </div>
  );
}

function Row({ sim, m, name, early, dim, onPlayer }: { sim: MatchSim; m: MPlayer; name: string; early: boolean; dim?: boolean; onPlayer: (id: string) => void }) {
  const g = grade(sim, m);
  const cap = sim.team(m.side).captainId === m.id;
  return (
    <div className={`tm-lt-row ${dim ? 'out' : ''} ${m.injured && m.onPitch ? 'hurt' : ''}`}>
      <span className="tm-nr">{m.p.shirtNumber || ''}</span>
      <span className="tm-pos">{m.pos}</span>
      <span className="tm-namecell">
        <button type="button" className="tm-plink tm-name" onClick={() => onPlayer(m.id)}>{name}{cap ? ' (K)' : ''}</button>
        {m.goals > 0 && <span className="tm-tag"><Icon name="matchball" size={16} />{m.goals > 1 ? m.goals : ''}</span>}
        {!m.started && m.minuteIn > 0 && <span className="tm-tag">{m.minuteIn}.</span>}
        {dim && m.minuteOut != null && <span className="tm-tag">bis {m.minuteOut}.</span>}
      </span>
      <span className={early ? 'tm-dim' : `ms-grade ${gradeCls(g)}`}>{early ? '–' : fmtGrade(g)}</span>
      <span style={{ color: vColor(m.base) }}>{Math.round(m.base)}</span>
      <span>{dim ? '' : <FreshnessIcon kind="kraft" value={Math.round(m.energy)} size={20} />}</span>
      <span>{dim ? '' : <FitnessIcon value={fitness100(m.p)} size={20} />}</span>
      <span className="tm-status">
        {m.yellow > 0 && !m.yellowRed && !m.red && <i className="ms-card y" />}
        {(m.red > 0 || m.yellowRed > 0) && <i className="ms-card r" />}
        {m.injured && <Icon name="injury" size={18} />}
      </span>
    </div>
  );
}

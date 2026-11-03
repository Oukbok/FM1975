// =============================================================================
// Kopf-Bühne des Textmodus: beide Wappen groß, Leiste „(Platz) Heim – Gast
// (Platz)“ mit Ergebnis, Spieluhr als Kreis, Wettbewerb darunter und die
// Zeitleiste mit Toren/Karten/Wechseln und Druckphasen.
// =============================================================================
import ClubCrest from '../../../components/ClubCrest';
import type { MatchSim } from '../../../engine/match/sim';
import type { Side, SimEvent } from '../../../engine/match/types';
import type { Game } from '../../../game/state';
import type { OwnMatchInfo } from '../../../game/ownMatch';
import type { Line } from '../../../data/ticker/narrator';
import Icon from '../../../components/Icon';
import { onPitch } from '../../../engine/match/state';
import { rating } from '../../../engine/match/team';
import { InfoTip } from '../../../ui/InfoTip';
import { DangerMeter } from './DangerMeter';

export function Stage({ g, sim, info, score, pens, clock, revealing, shownSeq, history, current }: {
  g: Game; sim: MatchSim; info: OwnMatchInfo; score: [number, number]; pens: [number, number] | null;
  clock: string; revealing: boolean; shownSeq: number; history: Line[]; current: Line | null;
}) {
  const side = info.side;
  const H = sim.home.club, A = sim.away.club;
  const rank = (id: string) => {
    if (info.kind !== 'liga' || !g.table.rows.some((r) => r.played > 0)) return null;
    return g.table.rows.find((r) => r.clubId === id)?.position ?? null;
  };
  const rh = rank(H.id), ra = rank(A.id);
  const scorers = (s: Side) => history.filter((l) => l.scorer && l.side === s).reverse();
  const coach = (s: Side) => (s === side ? g.manager?.name : sim.team(s).club.coach?.name) ?? '–';
  const strength = (s: Side) => Math.round(onPitch(sim.team(s)).reduce((x, m) => x + rating(m), 0) / 11);
  const ht = sim.period >= 2 || sim.phase === 'halftime' ? sim.halftimeScore : null;
  const [label, sub] = splitLabel(info.label);
  const Team = ({ s }: { s: Side }) => (
    <div className={`tm-tinfo ${s}`}>
      <div>Trainer: <b>{coach(s)}</b></div>
      <div>Mannschaftsstärke: <b>{strength(s)}</b> <InfoTip k="mannschaftsstaerke" /></div>
      <div className="tm-scorers">{scorers(s).map((l) => <span key={l.id}>{l.scorer} {l.minute}</span>)}</div>
    </div>
  );
  return (
    <div className="tm-stage">
      <div className="tm-comp"><div>{label}{sub && <span> · {sub}</span>}{pens && <b> · {pens[0]}:{pens[1]} i.E.</b>}</div>
        {info.firstLeg ? <AggNote fl={info.firstLeg} hs={score[0]} as={score[1]} homeName={H.shortName ?? H.name} awayName={A.shortName ?? A.name} />
          : info.stageNote ? <em className="tm-agg">{info.stageNote}</em> : null}</div>
      <div className="tm-stage-row">
        <ClubCrest club={H} size={128} />
        <div className="tm-bar">
          <div className={`tm-bar-team home ${side === 'home' ? 'mine' : ''}`}>
            {rh != null && <span className="tm-rank">({rh})</span>}<span className="tm-bar-name">{H.name}</span>
          </div>
          <div className={`tm-bar-score ${revealing ? 'tense' : ''}`}>
            <div>{score[0]}<span>:</span>{score[1]}</div>
            {ht && <small aria-label="Halbzeitstand">[{ht[0]}] [{ht[1]}]</small>}
          </div>
          <div className={`tm-bar-team away ${side === 'away' ? 'mine' : ''}`}>
            <span className="tm-bar-name">{A.name}</span>{ra != null && <span className="tm-rank">({ra})</span>}
          </div>
        </div>
        <ClubCrest club={A} size={128} />
      </div>
      <div className="tm-stage-info">
        <Team s="home" />
        <div className="tm-stage-mid">
          <DangerMeter line={sim.finished ? null : current} homeName={H.name} awayName={A.name} />
          <Clock sim={sim} clock={clock} />
        </div>
        <Team s="away" />
      </div>
      <Timeline sim={sim} shownSeq={shownSeq} />
    </div>
  );
}

/** „Liga · 12. Spieltag“ → [„Liga“, „12. Spieltag“]. */
function splitLabel(l: string): [string, string] {
  const i = l.indexOf(' · ');
  return i < 0 ? [l, ''] : [l.slice(0, i), l.slice(i + 3)];
}

/** Spieluhr als Kreis: Fortschritt der Halbzeit + Minute. */
function Clock({ sim, clock }: { sim: MatchSim; clock: string }) {
  const p = sim.period;
  const start = p === 1 ? 0 : p === 2 ? 45 : p === 3 ? 90 : 105;
  const span = p <= 2 ? 45 : 15;
  const frac = sim.phase === 'halftime' || sim.phase === 'done' ? 1 : Math.max(0, Math.min(1, (sim.minute - start) / span));
  const r = 40, c = 2 * Math.PI * r;
  const word = clock === 'HZ' ? 'Halbzeit' : clock === 'Ende' ? 'Abpfiff' : clock === 'i.E.' ? 'Elfmeter' : 'Minute';
  const num = clock === 'HZ' || clock === 'Ende' || clock === 'i.E.' ? '' : clock.replace("'", '.');
  return (
    <div className="tm-clock" aria-label={`Spielminute ${clock}`}>
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} className="tm-clock-bg" />
        <circle cx="50" cy="50" r={r} className="tm-clock-fg" strokeDasharray={`${c * frac} ${c}`} transform="rotate(-90 50 50)" />
      </svg>
      <div className="tm-clock-txt">{num && <b>{num}</b>}<span>{word}</span></div>
    </div>
  );
}

type Mark = { min: number; side: Side; kind: 'goal' | 'card-y' | 'card-r' | 'sub' | 'injury'; seq: number };

function marksOf(evs: SimEvent[], shownSeq: number): Mark[] {
  const out: Mark[] = [];
  for (const ev of evs) {
    if (ev.seq > shownSeq || !ev.side) continue;
    const min = ev.minute;
    if (ev.kind === 'chance' && ev.chance?.outcome === 'goal' && !ev.chance.disallowed) out.push({ min, side: ev.side, kind: 'goal', seq: ev.seq });
    else if (ev.kind === 'card') out.push({ min, side: ev.side, kind: ev.card === 'yellow' ? 'card-y' : 'card-r', seq: ev.seq });
    else if (ev.kind === 'sub') out.push({ min, side: ev.side, kind: 'sub', seq: ev.seq });
    else if (ev.kind === 'injury') out.push({ min, side: ev.side, kind: 'injury', seq: ev.seq });
  }
  return out;
}

/** Zeitleiste 0–90 (bzw. 120) mit Ereignissen beider Teams (Heim oben, Gast unten) und Druckphasen. */
export function Timeline({ sim, shownSeq }: { sim: MatchSim; shownSeq: number }) {
  const len = sim.knockout && sim.period >= 3 ? 120 : 90;
  const now = sim.phase === 'done' ? len : Math.min(len, sim.minute);
  const pct = (m: number) => `${(Math.min(len, Math.max(0, m)) / len) * 100}%`;
  const marks = marksOf(sim.events, shownSeq);
  const ticks = len === 120 ? [15, 30, 45, 60, 75, 90, 105] : [15, 30, 45, 60, 75];
  return (
    <div className="tm-tl" title="Zeitleiste: oben Heim, unten Gast">
      <div className="tm-tl-mom">
        {Array.from({ length: len }, (_, i) => {
          const v = sim.momentum[i];
          if (v == null || Math.abs(v) < 0.02) return <span key={i} />;
          return <span key={i}><i className={v > 0 ? 'up' : 'dn'} style={{ height: `${Math.min(100, Math.abs(v) * 160)}%` }} /></span>;
        })}
      </div>
      <div className="tm-tl-track">
        <div className="tm-tl-fill" style={{ width: pct(now) }} />
        {ticks.map((t) => <span key={t} className={`tm-tl-tick ${t === 45 || t === 90 ? 'half' : ''}`} style={{ left: pct(t) }}><em>{t}</em></span>)}
        <span className="tm-tl-ball" style={{ left: pct(now) }}><Icon name="matchball" size={22} /></span>
      </div>
      {marks.map((m) => (
        <span key={m.seq} className={`tm-tl-mark ${m.side} k-${m.kind}`} style={{ left: pct(m.min) }}>
          {m.kind === 'goal' ? <Icon name="matchball" size={20} /> : m.kind === 'sub' ? <Icon name="swap" size={20} />
            : m.kind === 'injury' ? <Icon name="injury" size={20} /> : <i className={`ms-card ${m.kind === 'card-y' ? 'y' : 'r'}`} />}
        </span>
      ))}
    </div>
  );
}

/** Rückspiel: Hinspiel (heutiges Heimteam zuerst), Gesamtstand und (bis 2020/21) die Auswärtstore live. */
function AggNote({ fl, hs, as, homeName, awayName }: { fl: NonNullable<OwnMatchInfo['firstLeg']>; hs: number; as: number; homeName: string; awayName: string }) {
  const aggH = hs + fl.ag, aggA = as + fl.hg;
  let note = '';
  if (aggH === aggA) {
    if (fl.awayGoals && fl.ag !== as) note = `${fl.ag > as ? homeName : awayName} vorn durch Auswärtstore`;
    else note = 'Gleichstand – Verlängerung droht';
  } else note = `${aggH > aggA ? homeName : awayName} liegt vorn`;
  return <em className="tm-agg">Hinspiel {fl.ag}:{fl.hg} · Gesamt <b>{aggH}:{aggA}</b> · {note}</em>;
}

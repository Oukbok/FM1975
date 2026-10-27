// =============================================================================
// Seitenteile des Textmodus: Aufstellung mit Wechseln, Statistik (zeitgemäß),
// Taktik/Zurufe, Druckphasen.
// =============================================================================
import { useState } from 'react';
import Icon from '../../components/Icon';
import type { MatchSim } from '../../engine/match/sim';
import { bench, type TeamState } from '../../engine/match/state';
import { cachedSuitability } from '../../engine/match/team';
import { grade } from '../../engine/match/finish';
import { shortNamer } from './names';
import { MENTALITY_LABEL, type Mentality, type MPlayer, type ShoutId, type Side } from '../../engine/match/types';

const fmtGrade = (g: number) => g.toFixed(1).replace('.', ',');
const gradeCls = (g: number) => (g <= 2 ? 'g-top' : g <= 3 ? 'g-good' : g <= 4 ? 'g-mid' : 'g-bad');

// -----------------------------------------------------------------------------
// Aufstellung
// -----------------------------------------------------------------------------

export function LineupPanel({ sim, side, mine, onSub }: {
  sim: MatchSim; side: Side; mine: boolean; onSub?: (outId: string, inId: string) => void;
}) {
  const t = sim.team(side);
  const [out, setOut] = useState<string | null>(null);
  const subsLeft = sim.subsLeft(t);
  const canSub = mine && subsLeft > 0 && !sim.finished && sim.phase !== 'shootout';
  const field = t.players.filter((m) => m.onPitch);
  const gone = t.players.filter((m) => !m.onPitch && (m.started || m.minuteIn > 0));
  const benchList = bench(t);
  const outM = out ? t.players.find((m) => m.id === out) : null;
  const nm = shortNamer(t.players.map((m) => m.p));

  return (
    <div className="ms-panel ms-lineup">
      <div className="ms-panel-head">
        <span>{mine ? 'Deine Elf' : t.club.name}</span>
        {mine && <span className="ms-subs"><Icon name="swap" size={22} /> {sim.era.maxSubs - subsLeft}/{sim.era.maxSubs}</span>}
      </div>
      <div className="ms-rows">
        {field.map((m) => (
          <PlayerRow key={m.id} sim={sim} m={m} name={nm(m.p)} mine={mine} selected={out === m.id}
            onClick={canSub ? () => setOut(out === m.id ? null : m.id) : undefined} />
        ))}
        {gone.map((m) => <PlayerRow key={m.id} sim={sim} m={m} name={nm(m.p)} mine={mine} dim />)}
      </div>
      {mine && (
        <>
          <div className="ms-panel-sub">
            {outM ? <>Für <b>{nm(outM.p)}</b> ({outM.pos}) einwechseln:</> : canSub ? 'Bank – erst Spieler auf dem Platz wählen' : subsLeft <= 0 ? 'Keine Wechsel mehr' : 'Bank'}
          </div>
          <div className="ms-rows ms-bench">
            {benchList.map((b) => {
              const fit = outM ? cachedSuitability(b.p, outM.pos) : null;
              return (
                <button key={b.id} className={`ms-row ms-benchrow ${outM ? 'pickable' : ''}`} disabled={!outM}
                  onClick={() => { if (outM && onSub) { onSub(outM.id, b.id); setOut(null); } }}>
                  <span className="ms-pos">{b.p.naturalPosition}</span>
                  <span className="ms-name">{nm(b.p)}</span>
                  <span className="ms-ovr">{fit != null ? <>Eignung <b>{fit}</b></> : b.p.overall}</span>
                </button>
              );
            })}
            {!benchList.length && <div className="ms-empty">Niemand mehr auf der Bank.</div>}
          </div>
        </>
      )}
    </div>
  );
}

function PlayerRow({ sim, m, name, mine, selected, dim, onClick }: {
  sim: MatchSim; m: MPlayer; name: string; mine: boolean; selected?: boolean; dim?: boolean; onClick?: () => void;
}) {
  // Noten erst, wenn es etwas zu bewerten gibt
  const early = sim.period === 1 && sim.minute < 15;
  const g = grade(sim, m);
  const energy = Math.round(m.energy);
  return (
    <button className={`ms-row ${selected ? 'sel' : ''} ${dim ? 'dim' : ''}`} onClick={onClick} disabled={!onClick}>
      <span className="ms-pos">{m.pos}</span>
      <span className="ms-name">
        {name}
        {m.goals > 0 && <span className="ms-tag goal">{m.goals > 1 ? `${m.goals}×` : ''}Tor</span>}
        {m.assists > 0 && <span className="ms-tag">{m.assists > 1 ? `${m.assists}×` : ''}Vorl.</span>}
        {m.yellow > 0 && !m.yellowRed && <span className="ms-card y" />}
        {(m.red > 0 || m.yellowRed > 0) && <span className="ms-card r" />}
        {m.injured && <span className="ms-tag bad">verletzt</span>}
        {!m.started && m.minuteIn > 0 && <span className="ms-tag">{m.minuteIn}'</span>}
      </span>
      {mine && !dim && (
        <span className="ms-energy" title={`Kraft ${energy}`}>
          <span style={{ width: `${energy}%` }} className={energy < 55 ? 'low' : energy < 70 ? 'mid' : ''} />
        </span>
      )}
      <span className={`ms-grade ${early ? '' : gradeCls(g)}`}>{early ? '–' : fmtGrade(g)}</span>
    </button>
  );
}

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

const SHOUTS: [ShoutId, string, string][] = [
  ['druck', 'Mehr Druck!', 'Mehr Angriffe, kostet Kraft'],
  ['ruhe', 'Ruhe reinbringen', 'Ballkontrolle, weniger Fehler'],
  ['kompakt', 'Kompakt stehen', 'Sicherer hinten, weniger vorne'],
  ['fluegel', 'Über die Flügel', 'Mehr Flanken und Kopfbälle'],
  ['konzentration', 'Konzentration!', 'Weniger Fehler und Karten'],
  ['zweikampf', 'Zweikämpfe annehmen', 'Härter, aber foulanfälliger'],
];

export function TacticsPanel({ sim, side, act }: { sim: MatchSim; side: Side; act: (fn: () => unknown) => unknown }) {
  const t = sim.team(side);
  const cd = sim.shoutCooldown(side);
  const active = t.shout && sim.minute < t.shoutUntil ? t.shout : null;
  const closed = sim.finished || sim.phase === 'shootout';
  return (
    <div className="ms-tactics">
      <div className="ms-sec">Ausrichtung</div>
      <div className="ms-ment">
        {([-2, -1, 0, 1, 2] as Mentality[]).map((m) => (
          <button key={m} className={`ms-chip ${t.mentality === m ? 'on' : ''}`} disabled={closed}
            onClick={() => act(() => sim.setMentality(side, m))}>{MENTALITY_LABEL[m]}</button>
        ))}
      </div>
      <div className="ms-sec">
        Zurufe {active ? <span className="ms-hint">wirkt bis {t.shoutUntil}'</span> : cd > 0 ? <span className="ms-hint">wieder in {cd}'</span> : null}
      </div>
      <div className="ms-shouts">
        {SHOUTS.map(([id, label, hint]) => {
          const used = t.shoutHistory.slice(-3).filter((x) => x === id).length;
          return (
            <button key={id} className={`ms-shout ${active === id ? 'on' : ''}`} disabled={closed || cd > 0 || !!active}
              onClick={() => act(() => sim.shout(side, id))}>
              <Icon name="whistle" size={26} />
              <span className="ms-shout-t">{label}</span>
              <span className="ms-shout-h">{used >= 2 ? 'nutzt sich ab' : hint}</span>
            </button>
          );
        })}
      </div>
      <div className="ms-note">Zurufe wirken etwa zehn Minuten. Wer zu oft dasselbe ruft, wird überhört.</div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Druckphasen
// -----------------------------------------------------------------------------

export function Momentum({ sim }: { sim: MatchSim }) {
  const len = sim.knockout && sim.period >= 3 ? 120 : 90;
  const vals = Array.from({ length: len }, (_, i) => sim.momentum[i] ?? null);
  return (
    <div className="ms-mom" title="Druckphasen: oben Heim, unten Gast">
      {vals.map((v, i) => (
        <span key={i} className={`ms-mom-c ${i === 44 ? 'ht' : ''}`}>
          {v != null && v > 0.02 && <i className="up" style={{ height: `${Math.min(100, v * 160)}%` }} />}
          {v != null && v < -0.02 && <i className="dn" style={{ height: `${Math.min(100, -v * 160)}%` }} />}
        </span>
      ))}
    </div>
  );
}


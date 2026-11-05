// =============================================================================
// Bausteine der Bewertungsrunde im Aufbau „Auf- und Abwertungsrunde“:
//   oben links  Bühne (Start / aktueller Spieler / Abschluss-Text)
//   oben rechts Spielerentwicklung – die drei größten Sprünge bzw. Verluste
//   unten       Überblick – Tabelle aller Spieler mit Grund 1 / Grund 2
// Rahmen + Steuerung in RatingShow.tsx, Stil in 28-ratings.css (.rb2-*).
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import PlayerAvatar from '../../components/PlayerAvatar';
import { scoutRangeText } from '../../engine/scouting';
import type { RatingReason } from '../../engine/devLog';
import type { Club } from '../../types';
import type { ShowRow } from './ratingScript';
import type { RatingPhase } from './useRatingPlayer';
import PosBadge from '../../components/PosBadge';

export const sgn = (d: number) => (d > 0 ? `+${d}` : d < 0 ? `−${-d}` : '±0');
export const cls = (d: number) => (d > 0 ? 'up' : d < 0 ? 'down' : 'flat');

/** Zahl zählt ruhig von `from` nach `to`. */
function CountUp({ from, to, run, ms }: { from: number; to: number; run: boolean; ms: number }) {
  const [v, setV] = useState(run ? from : to);
  useEffect(() => {
    if (!run || from === to || ms <= 0) { setV(to); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      setV(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, run, ms]);
  return <>{v}</>;
}

/** Kleines Richtungszeichen (Dreieck auf/ab, Strich bei unverändert). */
export function Trend({ d, size = 14 }: { d: number; size?: number }) {
  const c = cls(d);
  return (
    <svg className={`rb2-trend ${c}`} viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      {d > 0 ? <path d="M8 2 L15 13 H1 Z" fill="currentColor" />
        : d < 0 ? <path d="M8 14 L15 3 H1 Z" fill="currentColor" />
        : <rect x="2" y="7" width="12" height="2.4" rx="1" fill="currentColor" />}
    </svg>
  );
}

/** Die beiden wichtigsten Gründe in Ergebnisrichtung (sonst die stärksten überhaupt). */
export function topReasons(row: ShowRow, n = 2): RatingReason[] {
  const dir = Math.sign(row.delta);
  const sorted = [...row.reasons].filter((x) => x.v !== 0).sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  const fit = dir === 0 ? sorted : sorted.filter((x) => Math.sign(x.v) === dir);
  const rest = sorted.filter((x) => !fit.includes(x));
  const out = [...fit, ...rest].slice(0, n);
  if (!out.length) { const note = row.reasons.find((x) => x.v === 0); if (note) out.push(note); }
  return out;
}

const short = (t: string) => t.replace(/\s*\(.*\)$/, '');

function Reason({ x }: { x: RatingReason | undefined }) {
  if (!x) return <span className="rb2-none">–</span>;
  return (
    <span className="rb2-reason" title={x.text}>
      <Trend d={Math.sign(x.v)} size={12} />
      <span className="rb2-reason-t">{short(x.text)}</span>
    </span>
  );
}

/** Oben links: aktueller Spieler mit zählender Stärke und Begründung. */
export function StageCard({ row, club, phase, reduced, countMs }: {
  row: ShowRow; club: Club | undefined; phase: RatingPhase; reduced: boolean; countMs: number;
}) {
  const p = row.p;
  const counting = phase === 'count' || phase === 'hold' || phase === 'done';
  const holding = phase === 'hold' || phase === 'done';
  const d = row.delta;
  const verdict = d > 0 ? 'Aufgewertet' : d < 0 ? 'Abgewertet' : 'Unverändert';
  return (
    <div key={row.r.playerId} className={`rt-card rb2-card ${holding ? cls(d) : ''}`}>
      <div className="rb2-face">{p ? <PlayerAvatar key={p.id} player={p} club={club} size={150} priority /> : <div className="rb2-face-empty" />}</div>
      <div className="rb2-info">
        <div className="rb2-kicker"><PosBadge pos={row.r.position} /> {row.r.age} Jahre{p ? ` · Nr. ${p.shirtNumber}` : ''}</div>
        <div className="rb2-name"><span className="rb2-first">{row.first}</span> {row.last}</div>
        <div className="rb2-values">
          <span className="rb2-old">{row.r.oldOverall}</span>
          <span className={`rb2-arrow ${counting ? 'on ' + cls(d) : ''}`} aria-hidden="true">
            <svg viewBox="0 0 60 24" width="44" height="18"><path d="M2 12 H52 M42 3 L54 12 L42 21" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <span className={`rb2-new ${holding ? cls(d) : ''}`}>
            {counting ? <CountUp from={row.r.oldOverall} to={row.r.newOverall} run={!reduced && phase === 'count'} ms={countMs} /> : <span className="rt-q">?</span>}
          </span>
          {holding && <span className={`rb2-delta ${cls(d)}`}>{sgn(d)}</span>}
          {holding && <span className={`rb2-verdict ${cls(d)}`}>{verdict}{row.r.tag && d !== 0 ? ` · ${row.r.tag}` : ''}</span>}
        </div>
        {phase === 'call' && <div className="rt-wait"><span /><span /><span /></div>}
        {holding && d !== 0 && (
          <ul className="rt-reasons rb2-reasons">
            {row.reasons.slice(0, 5).map((x, i) => (
              <li key={x.k + i} className={x.v > 0 ? 'plus' : x.v < 0 ? 'minus' : 'note'} style={{ animationDelay: `${0.1 + i * 0.1}s` }}>
                <span className="rt-sign">{x.v > 0 ? '+' : x.v < 0 ? '−' : '·'}</span>
                <span>{x.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Oben links am Ende: „Damit wurden alle Spieler neu beurteilt.“ */
export function SummaryCard({ rows, prevLine }: { rows: ShowRow[]; prevLine: string | null }) {
  const ups = rows.filter((r) => r.delta > 0).length, downs = rows.filter((r) => r.delta < 0).length;
  const sum = rows.reduce((a, r) => a + r.delta, 0);
  return (
    <div className="rt-summary rb2-summary">
      <div className="rb2-sum-title">Damit wurden alle Spieler neu beurteilt.</div>
      <div className="rb2-sum-lines">
        <div>Insgesamt {ups === 1 ? 'hat sich 1 Spieler' : `haben sich ${ups} Spieler`} verbessert.</div>
        <div>{downs === 1 ? '1 Spieler hat sich' : `${downs} Spieler haben sich`} verschlechtert.</div>
        <div>{sum === 0 ? 'Unterm Strich ist deine Mannschaft gleich stark geblieben.'
          : `Insgesamt hat deine Mannschaft ${Math.abs(sum)} Stärkepunkt${Math.abs(sum) === 1 ? '' : 'e'} ${sum > 0 ? 'gewonnen' : 'verloren'}.`}</div>
        {prevLine && <div className="rb2-sum-prev">{prevLine}</div>}
      </div>
    </div>
  );
}

/** Oben rechts: Spielerentwicklung – drei größte Sprünge oder Verluste. */
export function TopThree({ rows, shown, club, onPick }: { rows: ShowRow[]; shown: number; club: Club | undefined; onPick: (i: number) => void }) {
  const [mode, setMode] = useState<'up' | 'down'>('up');
  const seen = rows.map((r, i) => ({ r, i })).slice(0, shown);
  const list = seen.filter(({ r }) => (mode === 'up' ? r.delta > 0 : r.delta < 0))
    .sort((a, b) => (mode === 'up' ? b.r.delta - a.r.delta : a.r.delta - b.r.delta) || b.r.r.newOverall - a.r.r.newOverall)
    .slice(0, 3);
  return (
    <div className="rb2-top">
      <div className="rb2-head">
        <span>Spielerentwicklung</span>
        <span className="seg-group rb2-seg">
          <button type="button" className={`seg-btn ${mode === 'up' ? 'active' : ''}`} onClick={() => setMode('up')} aria-label="Größte Sprünge"><Trend d={1} /></button>
          <button type="button" className={`seg-btn ${mode === 'down' ? 'active' : ''}`} onClick={() => setMode('down')} aria-label="Größte Verluste"><Trend d={-1} /></button>
        </span>
      </div>
      <div className="rb2-top-list">
        {list.length === 0 ? <div className="rb2-empty">{mode === 'up' ? 'Noch niemand aufgewertet.' : 'Noch niemand abgewertet.'}</div>
          : list.map(({ r, i }, k) => (
            <button key={r.r.playerId} type="button" className="rb2-top-row" onClick={() => onPick(i)}>
              <span className="rb2-top-rank">{k + 1}</span>
              <span className="rb2-top-face">{r.p && <PlayerAvatar player={r.p} club={club} size={62} />}</span>
              <span className="rb2-top-txt">
                <span className="rb2-top-name">{r.first} {r.last}</span>
                <span className="rb2-top-sub"><PosBadge pos={r.r.position} />
                  {topReasons(r, 2).map((x, j) => <span key={j} className="rb2-top-why"><Trend d={Math.sign(x.v)} size={11} />{short(x.text)}</span>)}
                </span>
              </span>
              <span className="rb2-top-val">
                <span className={`rb2-top-d ${cls(r.delta)}`}>{sgn(r.delta)}</span>
                <span className="rb2-top-new">Neu: {r.r.newOverall}</span>
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}

/** Unten: Überblick aller Spieler (alphabetisch), Ergebnisse erscheinen nacheinander. */
export function Overview({ rows, shown, current, picked, onPick }: {
  rows: ShowRow[]; shown: number; current: number; picked: number | null; onPick: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => { (ref.current?.querySelector('tr.cur') as HTMLElement | null)?.scrollIntoView?.({ block: 'nearest' }); }, [current]);
  return (
    <div className="rb2-over">
      <div className="rb2-head"><span>Überblick</span><span className="rb2-dim">{Math.min(shown, rows.length)} / {rows.length} bewertet</span></div>
      <div className="rb2-scroll" ref={ref}>
        <table className="dtable rl-sm rb2-table">
          <thead>
            <tr>
              <th className="rb2-c-st" />
              <th className="num">Nr.</th><th>Pos.</th><th>Spieler</th><th className="num">Alter</th><th>Potenzial</th>
              <th className="num">Alte Stä.</th><th className="num">Neue Stä.</th><th>Grund 1</th><th>Grund 2</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const done = i < shown;
              const sel = picked != null ? picked === i : current === i;
              const [r1, r2] = done ? topReasons(row, 2) : [];
              return (
                <tr key={row.r.playerId} className={`rt-lrow ${done ? 'done ' + cls(row.delta) : 'open'} ${sel ? 'cur' : ''}`}
                  onClick={done ? () => onPick(i) : undefined}>
                  <td className="rb2-c-st">{done ? <Trend d={row.delta} /> : <span className="rb2-open" />}</td>
                  <td className="num rl-dim">{row.p?.shirtNumber ?? ''}</td>
                  <td><PosBadge pos={row.r.position} /></td>
                  <td className="rb2-c-name"><b>{row.last}</b>, {row.first}</td>
                  <td className="num">{row.r.age}</td>
                  <td className="rl-dim">{row.p ? scoutRangeText(row.p) : '–'}</td>
                  <td className="num">{row.r.oldOverall}</td>
                  <td className={`num rl-main rb2-c-new ${done ? cls(row.delta) : ''}`}>{done ? row.r.newOverall : '·'}</td>
                  {/* Gründe nur bei veränderter Stärke (Wunsch Pascal) */}
                  <td className="rb2-c-why">{done && row.delta !== 0 ? <Reason x={r1} /> : null}</td>
                  <td className="rb2-c-why">{done && row.delta !== 0 ? <Reason x={r2} /> : null}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

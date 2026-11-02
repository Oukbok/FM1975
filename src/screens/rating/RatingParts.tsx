// =============================================================================
// Bausteine der Bewertungs-Show: Spielerliste mit Status (links), Bühne mit
// Gesicht und zählender Stärke (Mitte), Zwischenstand (rechts), Übersicht am
// Ende. Rahmen + Steuerung in RatingShow.tsx, Stil in 28-ratings.css.
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import PlayerAvatar from '../../components/PlayerAvatar';
import type { Club } from '../../types';
import { mainReason, type ShowRow } from './ratingScript';
import type { RatingPhase } from './useRatingPlayer';

const sgn = (d: number) => (d > 0 ? `+${d}` : d < 0 ? `−${-d}` : '±0');
const cls = (d: number) => (d > 0 ? 'up' : d < 0 ? 'down' : 'flat');
const fmtAvg = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v).toFixed(2).replace('.', ',')}`;

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

/** Links: alle Spieler alphabetisch mit Status (offen / ▲ / ▼ / =). */
export function PlayerList({ rows, shown, current, onPick, picked }: {
  rows: ShowRow[]; shown: number; current: number; onPick?: (i: number) => void; picked?: number | null;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => { (ref.current?.querySelector('.rt-lrow.cur') as HTMLElement | null)?.scrollIntoView?.({ block: 'nearest' }); }, [current]);
  return (
    <div className="rt-list">
      <div className="dr-panel-head"><span>Kader</span><span className="dr-dim">{Math.min(shown, rows.length)} / {rows.length}</span></div>
      <div className="rt-lrows" ref={ref}>
        {rows.map((row, i) => {
          const done = i < shown;
          const sel = picked != null ? picked === i : current === i;
          return (
            <button key={row.r.playerId} type="button" className={`rt-lrow ${done ? 'done ' + cls(row.delta) : 'open'} ${sel ? 'cur' : ''}`}
              onClick={onPick ? () => onPick(i) : undefined} disabled={!onPick}>
              <span className="pos-badge rt-lpos">{row.r.position}</span>
              <span className="rt-lname"><b>{row.last}</b>, {row.first}</span>
              <span className="rt-lval">{done ? row.r.newOverall : row.r.oldOverall}</span>
              <span className={`rt-lstat ${done ? cls(row.delta) : 'open'}`}>
                {!done ? '' : row.delta > 0 ? `▲ ${sgn(row.delta)}` : row.delta < 0 ? `▼ ${sgn(row.delta)}` : '='}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Mitte: Spieler groß, alte → neue Stärke, Ergebnis und Begründung. */
export function StageCard({ row, club, phase, reduced, countMs }: {
  row: ShowRow; club: Club | undefined; phase: RatingPhase; reduced: boolean; countMs: number;
}) {
  const p = row.p;
  const counting = phase === 'count' || phase === 'hold' || phase === 'done';
  const holding = phase === 'hold' || phase === 'done';
  const d = row.delta;
  const verdict = d > 0 ? 'Aufgewertet' : d < 0 ? 'Abgewertet' : 'Unverändert';
  return (
    <div key={row.r.playerId} className={`rt-card ${holding ? cls(d) : ''}`}>
      <div className="rt-face">
        {p ? <PlayerAvatar player={p} club={club} size={230} /> : <div className="rt-face-empty" />}
      </div>
      <div className="rt-info">
        <div className="rt-kicker"><span className="pos-badge">{row.r.position}</span> {row.r.age} Jahre</div>
        <div className="rt-name"><span className="rt-first">{row.first}</span> {row.last}</div>
        <div className="rt-values">
          <span className="rt-old">{row.r.oldOverall}</span>
          <span className={`rt-arrow ${counting ? 'on ' + cls(d) : ''}`} aria-hidden="true">
            <svg viewBox="0 0 60 24" width="60" height="24"><path d="M2 12 H52 M42 3 L54 12 L42 21" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <span className={`rt-new ${holding ? cls(d) : ''}`}>
            {counting ? <CountUp from={row.r.oldOverall} to={row.r.newOverall} run={!reduced && phase === 'count'} ms={countMs} /> : <span className="rt-q">?</span>}
          </span>
          {holding && <span className={`rt-delta ${cls(d)}`}>{sgn(d)}</span>}
        </div>
        {phase === 'call' && <div className="rt-wait"><span /><span /><span /></div>}
        {holding && (
          <div className="rt-result">
            <div className="rt-verdict-row">
              <span className={`rt-verdict ${cls(d)}`}>{verdict}</span>
              {row.r.tag && d !== 0 && <span className="dr-pill dim">{row.r.tag}</span>}
            </div>
            <ul className="rt-reasons">
              {row.reasons.map((x, i) => (
                <li key={x.k + i} className={x.v > 0 ? 'plus' : x.v < 0 ? 'minus' : 'note'} style={{ animationDelay: `${0.12 + i * 0.12}s` }}>
                  <span className="rt-sign">{x.v > 0 ? '+' : x.v < 0 ? '−' : '·'}</span>
                  <span>{x.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export interface PrevRound { label: string; date: string; n: number; ups: number; downs: number; sum: number }

function stats(rows: ShowRow[]) {
  const ups = rows.filter((r) => r.delta > 0).length, downs = rows.filter((r) => r.delta < 0).length;
  const sum = rows.reduce((a, r) => a + r.delta, 0);
  return { ups, downs, flat: rows.length - ups - downs, avg: rows.length ? sum / rows.length : 0 };
}

/** Rechts: Zwischenstand der laufenden Runde. */
export function LivePanel({ rows, shown, prev }: { rows: ShowRow[]; shown: number; prev: PrevRound | null }) {
  const seen = rows.slice(0, shown);
  const s = stats(seen);
  const best = [...seen].filter((r) => r.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 4);
  const worst = [...seen].filter((r) => r.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 4);
  return (
    <div className="rt-live">
      <div className="dr-panel-head"><span>Zwischenstand</span><span className="dr-dim">{shown} bewertet</span></div>
      <div className="rt-live-body">
        <div className="rt-kpis">
          <div className="rt-kpi"><span className="rt-kpi-v up">{s.ups}</span><span className="rt-kpi-l">aufgewertet</span></div>
          <div className="rt-kpi"><span className="rt-kpi-v down">{s.downs}</span><span className="rt-kpi-l">abgewertet</span></div>
          <div className="rt-kpi"><span className="rt-kpi-v">{s.flat}</span><span className="rt-kpi-l">unverändert</span></div>
          <div className="rt-kpi"><span className="rt-kpi-v">{fmtAvg(s.avg)}</span><span className="rt-kpi-l">Ø Veränderung</span></div>
        </div>
        <MiniList title="Größte Sprünge" rows={best} />
        <MiniList title="Größte Verluste" rows={worst} />
        {prev && (
          <div className="rt-prev">
            <div className="rt-sub">Letzte Runde · {prev.label}</div>
            <div className="rt-prev-line">
              <span className="up">▲ {prev.ups}</span><span className="down">▼ {prev.downs}</span>
              <span>Ø {fmtAvg(prev.n ? prev.sum / prev.n : 0)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniList({ title, rows }: { title: string; rows: ShowRow[] }) {
  return (
    <div className="rt-mini">
      <div className="rt-sub">{title}</div>
      {rows.length === 0 ? <div className="rt-mini-empty">noch keine</div> : rows.map((r) => (
        <div key={r.r.playerId} className="rt-mini-row">
          <span className="rt-mini-name">{r.first} {r.last}</span>
          <span className="rt-mini-v">{r.r.oldOverall} → {r.r.newOverall}</span>
          <span className={`rt-mini-d ${cls(r.delta)}`}>{sgn(r.delta)}</span>
        </div>
      ))}
    </div>
  );
}

/** Ende: Gewinner/Verlierer, Ø Veränderung, Vergleich zur letzten Runde. */
export function RatingSummary({ rows, prev, label, onClose }: { rows: ShowRow[]; prev: PrevRound | null; label: string; onClose: () => void }) {
  const s = stats(rows);
  const best = [...rows].filter((r) => r.delta > 0).sort((a, b) => b.delta - a.delta || b.r.newOverall - a.r.newOverall).slice(0, 3);
  const worst = [...rows].filter((r) => r.delta < 0).sort((a, b) => a.delta - b.delta || b.r.oldOverall - a.r.oldOverall).slice(0, 3);
  const prevAvg = prev && prev.n ? prev.sum / prev.n : null;
  const trend = prevAvg == null ? '' : s.avg > prevAvg + 0.05 ? 'besser als' : s.avg < prevAvg - 0.05 ? 'schwächer als' : 'ähnlich wie';
  return (
    <div className="rt-summary">
      <div className="dr-sum-kicker">{label} · Bilanz</div>
      <div className="rt-sum-kpis">
        <div className="rt-kpi big"><span className="rt-kpi-v up">{s.ups}</span><span className="rt-kpi-l">aufgewertet</span></div>
        <div className="rt-kpi big"><span className="rt-kpi-v down">{s.downs}</span><span className="rt-kpi-l">abgewertet</span></div>
        <div className="rt-kpi big"><span className="rt-kpi-v">{s.flat}</span><span className="rt-kpi-l">unverändert</span></div>
        <div className="rt-kpi big"><span className="rt-kpi-v">{fmtAvg(s.avg)}</span><span className="rt-kpi-l">Ø Veränderung</span></div>
      </div>
      <div className="rt-sum-cols">
        <SumCol title="Gewinner der Runde" rows={best} empty="Niemand wurde aufgewertet." />
        <SumCol title="Verlierer der Runde" rows={worst} empty="Niemand wurde abgewertet." />
      </div>
      <div className="dr-sum-line">
        {prev && prevAvg != null
          ? <>Im Vergleich zur letzten Runde ({prev.label}: ▲ {prev.ups} / ▼ {prev.downs}, Ø {fmtAvg(prevAvg)}) {trend} zuvor.</>
          : 'Die erste Bewertungsrunde mit diesem Kader – noch kein Vergleich.'}
      </div>
      <button className="dr-close" onClick={onClose}>Schließen</button>
    </div>
  );
}

function SumCol({ title, rows, empty }: { title: string; rows: ShowRow[]; empty: string }) {
  return (
    <div className="rt-sum-col">
      <div className="rt-sub">{title}</div>
      {rows.length === 0 ? <div className="rt-mini-empty">{empty}</div> : rows.map((r) => (
        <div key={r.r.playerId} className="rt-sum-row">
          <span className="rt-sum-name">{r.first} {r.last} <span className="dr-dim">· {r.r.position}, {r.r.age}</span></span>
          <span className="rt-mini-v">{r.r.oldOverall} → {r.r.newOverall}</span>
          <span className={`rt-mini-d ${cls(r.delta)}`}>{sgn(r.delta)}</span>
          <span className="rt-sum-why">{mainReason(r)?.text ?? ''}</span>
        </div>
      ))}
    </div>
  );
}

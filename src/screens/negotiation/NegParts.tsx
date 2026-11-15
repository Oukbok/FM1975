// =============================================================================
// VERHANDLUNGSTISCH — Bausteine für alle Gespräche: Kräfteverhältnis (was deine
// Position stärkt oder schwächt), Stimmung mit Geduld und Runden, Gespräch als
// Wortwechsel, Stand je Punkt, „nicht verhandelbar“, Regler mit Feinschritten.
// =============================================================================
import { type ReactNode, useEffect, useRef } from 'react';
import Icon from '../../components/Icon';

// ---------------------------------------------------------------- Kräfteverhältnis
export interface LeverItem { text: string; side: 1 | -1; w: number }

/** Waage zwischen dir und dem Gegenüber: Summe der gewichteten Hebel, darunter die Gründe. */
export function Balance({ levers, me, them, max = 6 }: { levers: LeverItem[]; me: string; them: string; max?: number }) {
  const plus = levers.filter((l) => l.side > 0).reduce((s, l) => s + l.w, 0);
  const minus = levers.filter((l) => l.side < 0).reduce((s, l) => s + l.w, 0);
  // −1 (alles beim Gegenüber) … +1 (alles bei dir); gedämpft, damit ein einzelner Hebel nicht alles kippt.
  const tilt = Math.max(-1, Math.min(1, (plus - minus) / 6));
  const word = tilt >= 0.5 ? 'Du sitzt am längeren Hebel' : tilt >= 0.17 ? 'Leichter Vorteil für dich' : tilt > -0.17 ? 'Ausgeglichen' : tilt > -0.5 ? `Leichter Vorteil für ${them}` : `${them} sitzt am längeren Hebel`;
  const list = [...levers].filter((l) => l.w > 0).sort((a, b) => b.w - a.w).slice(0, max);
  return (
    <div className="vt-bal">
      <div className="vt-bal-ends"><span>{me}</span><span>{them}</span></div>
      <div className="vt-bal-track" role="img" aria-label={word}>
        <i className="vt-bal-mid" />
        <i className="vt-bal-knob" style={{ left: `${50 - tilt * 44}%` }} />
      </div>
      <div className="vt-bal-word">{word}</div>
      <ul className="vt-levers">
        {list.map((l) => (
          <li key={l.text} className={l.side > 0 ? 'plus' : 'minus'}>
            <span className="vt-lever-sign" aria-hidden="true">{l.side > 0 ? '+' : '−'}</span>
            <span className="vt-lever-t">{l.text}</span>
            <span className="vt-lever-w" aria-label={l.w >= 3 ? 'wiegt schwer' : l.w === 2 ? 'spürbar' : 'leicht'}>{[0, 1, 2].map((i) => <i key={i} className={i < l.w ? 'on' : ''} />)}</span>
          </li>
        ))}
        {!list.length && <li className="none">Keine besonderen Hebel auf einer Seite.</li>}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------- Stimmung
export function moodWord(ratio: number): { word: string; cls: 'good' | 'mid' | 'bad' } {
  return ratio >= 0.7 ? { word: 'Gesprächsbereit', cls: 'good' } : ratio >= 0.4 ? { word: 'Angespannt', cls: 'mid' } : { word: 'Gereizt', cls: 'bad' };
}

/** Stimmung als Wort, Geduld als zehn Segmente, Runden als Punkte. */
export function Mood({ patience, start, round, maxRounds, ended }: { patience: number; start: number; round: number; maxRounds?: number; ended?: 'agreed' | 'failed' | null }) {
  const ratio = Math.max(0, Math.min(1, patience / Math.max(1, start)));
  const m = ended === 'agreed' ? { word: 'Einig', cls: 'good' as const } : ended === 'failed' ? { word: 'Abgebrochen', cls: 'bad' as const } : moodWord(ratio);
  const on = ended === 'failed' ? 0 : Math.round(ratio * 10);
  return (
    <div className="vt-mood">
      <div className={`vt-mood-word ${m.cls}`}>{m.word}</div>
      <div className="vt-mood-row">
        <span className="vt-mood-l">Geduld</span>
        <span className={`vt-segs ${m.cls}`} role="img" aria-label={`Geduld ${Math.round(ratio * 100)} Prozent`}>{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < on ? 'on' : ''} />)}</span>
      </div>
      {maxRounds != null && (
        <div className="vt-mood-row">
          <span className="vt-mood-l">Runde</span>
          <span className="vt-rounds" role="img" aria-label={`Runde ${round} von ${maxRounds}`}>{Array.from({ length: maxRounds }, (_, i) => <i key={i} className={i < round ? 'on' : ''} />)}</span>
          <span className="vt-mood-n">{round} / {maxRounds}</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Gespräch
export interface TalkLine { who: string; text: string }

/** Wortwechsel: das Gegenüber links, du rechts, Hinweise deines Stabs mittig. */
export function TalkLog({ lines, names, empty = 'Noch kein Wort gewechselt.' }: { lines: TalkLine[]; names: Record<string, string>; empty?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = ref.current; if (el) el.scrollTop = el.scrollHeight; }, [lines.length]);
  return (
    <div className="vt-log" ref={ref}>
      {lines.length === 0 && <div className="vt-log-empty">{empty}</div>}
      {lines.map((l, i) => (
        <div key={i} className={`vt-say who-${l.who === 'du' ? 'du' : l.who === 'info' ? 'info' : 'them'}`}>
          {l.who !== 'info' && <span className="vt-say-who">{names[l.who] ?? l.who}</span>}
          <span className="vt-say-t">{l.text}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Stand je Punkt
export type TermStatus = 'met' | 'open' | 'their' | 'mine' | 'na';
const STATUS_TEXT: Record<TermStatus, string> = { met: 'einig', open: 'offen', their: 'Bedingung', mine: 'steht fest', na: '' };

export function StatusPill({ status, title }: { status: TermStatus; title?: string }) {
  if (status === 'na') return <span className="vt-pill na" />;
  return (
    <span className={`vt-pill ${status}`} title={title}>
      {status === 'met' && <Icon name="check" size={14} />}
      {(status === 'their' || status === 'mine') && <LockGlyph closed />}
      <span>{STATUS_TEXT[status]}</span>
    </span>
  );
}

export function LockGlyph({ closed }: { closed: boolean }) {
  return (
    <svg className="vt-lock-g" viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <path d={closed ? 'M5 7V5a3 3 0 0 1 6 0v2' : 'M5 7V5a3 3 0 0 1 5.6-1.5'} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="3.2" y="7" width="9.6" height="6.8" rx="1.4" fill="currentColor" />
    </svg>
  );
}

/** „Nicht verhandelbar“: Der Punkt bleibt, wie du ihn anbietest – das Gegenüber muss den Wert woanders suchen. */
export function LockButton({ locked, onToggle, disabled }: { locked: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button type="button" className={`vt-lockbtn${locked ? ' on' : ''}`} onClick={onToggle} disabled={disabled} aria-pressed={locked}
      title={locked ? 'Nicht verhandelbar – wieder freigeben' : 'Als nicht verhandelbar erklären (kostet etwas Geduld)'}>
      <LockGlyph closed={locked} />
    </button>
  );
}

/** Wichtigkeit als drei Punkte (nie als Zahl). */
export function Dots({ n, known = true }: { n: number; known?: boolean }) {
  const v = known ? Math.max(0, Math.min(3, n)) : 0;
  const word = !known ? 'noch unbekannt' : v >= 3 ? 'sehr wichtig' : v === 2 ? 'wichtig' : v === 1 ? 'nebensächlich' : 'egal';
  return <span className="vt-dots" aria-label={word} title={word}>{[0, 1, 2].map((i) => <i key={i} className={i < v ? 'on' : ''} />)}</span>;
}

// ---------------------------------------------------------------- Regler
/** Schieberegler mit Feinschritten (− / +) und dem Wert rechts. */
export function Amount({ value, min, max, step, onChange, label, text, miss, disabled }: {
  value: number; min: number; max: number; step: number; onChange: (v: number) => void; label: string; text: ReactNode; miss?: boolean; disabled?: boolean;
}) {
  const hi = Math.max(min + step, Math.ceil(max / step) * step);
  const v = Math.min(hi, Math.max(min, value));
  const set = (x: number) => onChange(Math.min(hi, Math.max(min, Math.round(x / step) * step)));
  return (
    <span className="vt-amount">
      <button type="button" className="vt-nudge" onClick={() => set(v - step)} disabled={disabled || v <= min} aria-label={`${label} verringern`}>−</button>
      <input className="vt-range" type="range" min={min} max={hi} step={step} value={v} aria-label={label} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} />
      <button type="button" className="vt-nudge" onClick={() => set(v + step)} disabled={disabled || v >= hi} aria-label={`${label} erhöhen`}>+</button>
      <b className={`vt-val${miss ? ' miss' : ''}${min === 0 && v <= 0 ? ' zero' : ''}`}>{text}</b>
    </span>
  );
}

/** Zeile „Beschriftung … Wert“ für Seitenleisten. */
export function Row({ k, children, strong, tone }: { k: ReactNode; children: ReactNode; strong?: boolean; tone?: 'neg' | 'pos' }) {
  return <div className={`vt-kv${strong ? ' strong' : ''}`}><span>{k}</span><b className={tone ?? ''}>{children}</b></div>;
}

// ---------------------------------------------------------------- Paketwert
/** Woraus sich der Wert deines Pakets für das Gegenüber zusammensetzt: gestapelter Balken gegen die Forderung. */
export function ValueStack({ parts, ask, fmt, title }: { parts: { label: string; value: number }[]; ask: number | null; fmt: (v: number) => string; title: string }) {
  const list = parts.filter((x) => x.value > 0);
  const total = list.reduce((s, x) => s + x.value, 0);
  const max = Math.max(total, ask ?? 0, 1) * 1.04;
  return (
    <div className="vt-stack">
      <div className="vt-stack-h"><span>{title}</span><b>{fmt(total)}</b></div>
      <div className="vt-stack-bar" role="img" aria-label={`${title}: ${fmt(total)}${ask != null ? `, Forderung ${fmt(ask)}` : ''}`}>
        {list.map((x, i) => <i key={x.label} className={`s${Math.min(i, 5)}`} style={{ width: `${(x.value / max) * 100}%` }} />)}
        {ask != null && <span className="vt-stack-ask" style={{ left: `${(ask / max) * 100}%` }}><em>Forderung</em></span>}
      </div>
      <div className="vt-stack-leg">
        {list.map((x, i) => <span key={x.label}><i className={`s${Math.min(i, 5)}`} />{x.label} <b>{fmt(x.value)}</b></span>)}
      </div>
    </div>
  );
}

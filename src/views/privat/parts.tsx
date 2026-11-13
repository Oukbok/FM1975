// Gemeinsame Bausteine der Privat-Seiten (views/privat/): Stufenwahl, kleiner Balken,
// Rückmeldezeile, Personen-Kurzinfo. CSS 28-privat.css (`.pv-*`).
import { useState, type ReactNode } from 'react';
import type { Game } from '../../game/state';
import { ageOf, type Person } from '../../game/private/privateState';

export function Steps({ value, max = 5, onChange, label }: { value: number; max?: number; onChange: (v: number) => void; label: string }) {
  return (
    <span className="pv-steps" role="group" aria-label={label}>
      <button type="button" className="pv-step-btn" disabled={value <= 0} onClick={() => onChange(value - 1)} aria-label={`${label} weniger`}>−</button>
      <span className="pv-dots" aria-hidden>{Array.from({ length: max }, (_, i) => <i key={i} className={i < value ? 'on' : ''} />)}</span>
      <button type="button" className="pv-step-btn" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`${label} mehr`}>+</button>
    </span>
  );
}

export function Bar({ v, max = 100, tone }: { v: number; max?: number; tone?: 'pos' | 'neg' | 'warn' }) {
  const pct = Math.max(0, Math.min(100, (v / max) * 100));
  const t = tone ?? (pct < 30 ? 'neg' : pct < 50 ? 'warn' : 'pos');
  return <span className="pv-bar"><span className={`pv-bar-fill ${t}`} style={{ width: `${pct}%` }} /></span>;
}

export function MeterRow({ k, v, max = 100, text, hint }: { k: ReactNode; v: number; max?: number; text?: ReactNode; hint?: string }) {
  return (
    <div className="pv-mrow" title={hint}>
      <span className="pv-mrow-k">{k}</span>
      <Bar v={v} max={max} />
      <b className="pv-mrow-v">{text ?? Math.round(v)}</b>
    </div>
  );
}

/** Rückmeldung nach einer Aktion (verschwindet bei der nächsten). */
export function useFeedback(): [string, (t: string) => void] {
  const [t, setT] = useState('');
  return [t, setT];
}
export function Feedback({ text }: { text: string }) {
  return text ? <div className="pv-feedback">{text}</div> : null;
}

export const ROLE_DE: Record<Person['role'], string> = { self: 'Du', partner: 'Partner', kind: 'Kind', ex: 'Ex', eltern: 'Eltern', alt: 'früher Manager' };

export function personLine(g: Game, p: Person): string {
  const a = ageOf(g, p);
  return p.alive ? yearsTxt(a) : `${p.birth.slice(0, 4)}–${p.died?.slice(0, 4)}`;
}

/** Einschätzung statt Zahl (verdeckte Anlagen). */
export function talentWord(v: number): string {
  return v >= 80 ? 'außergewöhnlich' : v >= 65 ? 'groß' : v >= 50 ? 'ordentlich' : v >= 35 ? 'durchschnittlich' : 'gering';
}
export const pronoun = (p: Person) => (p.sex === 'm' ? 'er' : 'sie');

export const yearsTxt = (a: number) => (a === 1 ? '1 Jahr' : `${a} Jahre`);

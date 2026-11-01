// =============================================================================
// Zustands-Symbole: Frische (Batterie), Form (Daumen), Moral (Smiley)
// =============================================================================
// Eingang ist immer ein Wert 0–100 (Umrechnung in ./statusScale.ts). Farbe
// über die Tokens --st-1 (rot) … --st-5 (dunkelgrün). Hover/Fokus zeigt den
// Wert („Frische 83/100 – gut erholt“) als Titel; `showValue` schreibt die Zahl
// zusätzlich daneben. Formen in components/iconPaths.ts (`STATUS_SHAPES`).
// =============================================================================
import { STATUS_SHAPES as S } from '../iconPaths';
import { type StatusKind, statusColor, statusLevel, statusText } from './statusScale';

interface Props {
  /** Wert 0–100. */
  value: number;
  /** Kantenlänge in px (Standard 18). */
  size?: number;
  /** Zahl neben dem Symbol anzeigen. */
  showValue?: boolean;
  className?: string;
  /** Andere Bezeichnung im Hover (z. B. Kraft im Textmodus). */
  kind?: StatusKind;
}

function Frame({ kind, value, size = 18, showValue, className, children }: Props & { kind: StatusKind; children: React.ReactNode }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const lvl = statusLevel(kind, v);
  const text = statusText(kind, v);
  return (
    <span className={`st-icon st-${kind} st-l${lvl}${className ? ` ${className}` : ''}`} style={{ color: statusColor(lvl) }}
      title={text} aria-label={text} role="img" tabIndex={0}>
      <svg width={size} height={size} viewBox="0 0 24 24" overflow="visible" aria-hidden="true" focusable="false">{children}</svg>
      {showValue && <span className="st-val">{v}</span>}
    </span>
  );
}

/** Frische: Batterie mit Füllstand (stufenlos) in der Farbe der Stufe. */
export function FreshnessIcon(props: Props) {
  const v = Math.max(0, Math.min(100, props.value));
  const w = Math.max(1.4, (16 * v) / 100);
  return (
    <Frame {...props} kind={props.kind ?? 'frische'}>
      <path d={S.batteryBody} fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d={S.batteryTip} fill="currentColor" />
      <rect x="3" y="7.6" width={w} height="8.8" rx="1" fill="currentColor" />
    </Frame>
  );
}

/** Form: Daumen – Stufe 1 nach unten, 3 waagerecht, 5 nach oben. */
export function FormIcon(props: Props) {
  const lvl = statusLevel('form', Math.round(props.value));
  const angle = [180, 135, 90, 45, 0][lvl - 1];
  return (
    <Frame {...props} kind="form">
      <g transform={`rotate(${angle} 12 12)`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={S.thumb} fill="currentColor" fillOpacity="0.22" />
        <path d={S.thumbCuff} />
      </g>
    </Frame>
  );
}

/** Moral: Smiley von traurig (rot) bis strahlend (dunkelgrün). */
export function MoraleIcon(props: Props) {
  const lvl = statusLevel('moral', Math.round(props.value));
  const open = lvl === 5;
  return (
    <Frame {...props} kind="moral">
      <path d={S.face} fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.7" />
      <path d={S.eyes} fill="currentColor" />
      <path d={S.mouth[lvl - 1]} fill={open ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

// =============================================================================
// Zustands-Symbole: Frische (Batterie), Form (Daumen), Moral (Smiley), Fitness (Hantel)
// =============================================================================
// Eingang ist immer ein Wert 0–100 (Umrechnung in ./statusScale.ts). Farbe
// über die Tokens --st-1 (rot) … --st-5 (dunkelgrün); Form nur in Grünstufen --fg-1…5. Hover/Fokus/Tippen zeigt
// den Wert sofort („Frische 83/100 – gut erholt“, ./StatusTip.tsx); `showValue` schreibt die Zahl
// zusätzlich daneben. Formen in components/iconPaths.ts (`STATUS_SHAPES`).
// =============================================================================
import { STATUS_SHAPES as S } from '../iconPaths';
import { type StatusKind, STATUS_NOTE, STATUS_TITLE, statusColor, statusLevel, statusText, statusTipWord } from './statusScale';
import { useStatusTip } from './StatusTip';

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
  const tip = useStatusTip(STATUS_TITLE[kind], `${v}/100 – ${statusTipWord(kind, lvl)}`, statusColor(lvl, kind), STATUS_NOTE[kind]);
  return (
    <span {...tip.handlers} className={`st-icon st-${kind} st-l${lvl}${className ? ` ${className}` : ''}`} style={{ color: statusColor(lvl, kind) }}
      aria-label={text} role="img" tabIndex={0}>
      <svg width={size} height={size} viewBox="0 0 24 24" overflow="visible" aria-hidden="true" focusable="false">{children}</svg>
      {showValue && <span className="st-val">{v}</span>}
      {tip.layer}
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

/** Form: Daumen immer nach oben; die Stufe zeigt nur die Grünstufe (blass … kräftig) und die Füllung. */
export function FormIcon(props: Props) {
  const lvl = statusLevel('form', Math.round(props.value));
  return (
    <Frame {...props} kind="form">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={S.thumb} fill="currentColor" fillOpacity={[0.08, 0.16, 0.24, 0.34, 0.45][lvl - 1]} />
        <path d={S.thumbCuff} />
      </g>
    </Frame>
  );
}

/** Fitness: Hantel in der Farbe der Stufe; je fitter, desto voller die Scheiben. */
export function FitnessIcon(props: Props) {
  const lvl = statusLevel('fitness', Math.round(props.value));
  return (
    <Frame {...props} kind="fitness">
      <path d={S.dumbbellBar} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d={S.dumbbellPlates} fill="currentColor" fillOpacity={[0.15, 0.3, 0.5, 0.75, 1][lvl - 1]} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d={S.dumbbellOuter} fill="currentColor" fillOpacity={[0.15, 0.3, 0.5, 0.75, 1][lvl - 1]} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
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

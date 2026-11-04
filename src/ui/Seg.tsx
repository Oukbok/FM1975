// =============================================================================
// <Seg> — Segment-Umschalter des Knopf-Systems (CSS `.seg3` in 29-buttons.css)
// =============================================================================
// Wenige gleichrangige Ansichten („Gesamt / Heim / Auswärts / Form“). Ab
// `maxSeg` Einträgen wird daraus automatisch eine Auswahlliste (ui/Select),
// damit nichts umbricht oder gequetscht wird.
// =============================================================================
import type { ReactNode } from 'react';
import Select from './Select';

export interface SegOption<T extends string | number> {
  v: T;
  label: ReactNode;
  disabled?: boolean;
  title?: string;
}

export default function Seg<T extends string | number>({
  value, options, onChange, size = 'm', fill, maxSeg = 6, selectWidth = 220, className, 'aria-label': ariaLabel,
}: {
  value: T;
  options: SegOption<T>[];
  onChange: (v: T) => void;
  size?: 's' | 'm' | 'l';
  /** Volle Breite, Felder gleich breit. */
  fill?: boolean;
  /** Ab so vielen Einträgen Auswahlliste statt Segmenten. */
  maxSeg?: number;
  selectWidth?: number;
  className?: string;
  'aria-label'?: string;
}) {
  if (options.length > maxSeg) {
    return (
      <Select
        className={className}
        size={size}
        width={selectWidth}
        aria-label={ariaLabel}
        value={value}
        onChange={(raw) => {
          const hit = options.find((o) => String(o.v) === raw);
          if (hit) onChange(hit.v);
        }}
        options={options.map((o) => ({ value: o.v, label: o.label, disabled: o.disabled }))}
      />
    );
  }
  return (
    <span
      className={`seg3${size !== 'm' ? ` seg3-${size}` : ''}${fill ? ' seg3-fill' : ''}${className ? ` ${className}` : ''}`}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          className={value === o.v ? 'on' : ''}
          aria-pressed={value === o.v}
          disabled={o.disabled}
          title={o.title}
          onClick={() => onChange(o.v)}
        >
          {o.label}
        </button>
      ))}
    </span>
  );
}

import { CSSProperties } from 'react';
import { fmtWage, wageFromDisplay, wageStep, wageToDisplay, wageUnit } from './format';

// =============================================================================
// GEHALTS-REGLER — eingestellt wird in der Anzeige-Einheit (pro Jahr bzw. pro
// Woche, Währung der Epoche), weitergegeben das Wochengehalt in 1975-Basis.
// Die Beschriftung zeigt exakt den Betrag, der gesendet und später angezeigt
// wird (fmtWage auf die Einserstelle).
// =============================================================================
export function WageSlider({ label, value, min, max, onChange, valueClass, valueStyle }: {
  label?: string;
  /** Wochengehalt in 1975-Basis. */
  value: number;
  min: number;
  max: number;
  onChange: (weeklyBase: number) => void;
  valueClass?: string;
  valueStyle?: CSSProperties;
}) {
  const hiD = wageToDisplay(max);
  const step = wageStep(hiD);
  const lo = Math.max(step, Math.floor(wageToDisplay(min) / step) * step);
  const hi = Math.ceil(hiD / step) * step;
  const cur = Math.round(wageToDisplay(value));
  return (
    <label className="talk-row"><span>{label ?? `Gehalt / ${wageUnit()}`}</span>
      <input type="range" min={lo} max={hi} step={step} value={cur} aria-label={label ?? 'Gehalt'}
        onChange={(e) => onChange(wageFromDisplay(Number(e.target.value)))} />
      <b className={valueClass} style={valueStyle}>{fmtWage(value, { unit: false })}</b></label>
  );
}

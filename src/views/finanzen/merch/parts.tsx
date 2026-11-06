// Fanartikel-Seite: kleine Bausteine (Bild-Slot mit Fallback, Schrittregler, Reiter).
import { useState, type ReactNode } from 'react';
import Icon, { type IconName } from '../../../components/Icon';
import { itemPriceScale } from '../../../engine/merch';
import type { MerchItemDef } from '../../../data/merchCatalog';
import { fmtSmallMoney } from '../../shared';
import { _displayYear, fmtDM, fmtDMfull } from '../../../ui/format';
import { DM_PER_EUR, currencyForYear } from '../../../engine/economy';

/** Betrag: unter 100.000 voll ausgeschrieben, darüber kurz (Tsd./Mio., ohne „1.000 Tsd.“). */
export function money(v: number): string {
  const div = currencyForYear(_displayYear) === 'EUR' ? DM_PER_EUR : 1;
  const a = Math.abs(v) / div;
  if (a < 100000) return fmtDMfull(Math.round(v));
  return fmtDM(a >= 999500 && a < 1e6 ? Math.sign(v) * 1e6 * div : v);
}

/**
 * Bild-Slot: `bilder/merch/<name>.webp`; fehlt die Datei, bleibt eine ruhige
 * Fläche mit Icon stehen (Bildwünsche im Bericht / Wiki).
 */
export function MerchImage({ name, alt, icon = 'merch', className = '' }: { name: string; alt: string; icon?: IconName; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`mc-img ${className}`}>
      {!failed
        ? <img src={`assets/merch/${name}.webp`} alt={alt} draggable={false} onError={() => setFailed(true)} />
        : <span className="mc-img-fb"><Icon name={icon} size={34} /></span>}
    </div>
  );
}

/** Wert mit −/+ in festen Schritten (Preis-Faktor, Rabatt, Menge). */
export function Stepper({ value, onChange, step, min, max, fmt, label }: {
  value: number; onChange: (v: number) => void; step: number; min: number; max: number; fmt: (v: number) => ReactNode; label: string;
}) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, Math.round(v / step) * step)));
  return (
    <div className="mc-step" role="group" aria-label={label}>
      <button className="mc-step-btn" onClick={() => set(value - step)} disabled={value <= min + 1e-9} aria-label={`${label} senken`}>−</button>
      <span className="mc-step-val">{fmt(value)}</span>
      <button className="mc-step-btn" onClick={() => set(value + step)} disabled={value >= max - 1e-9} aria-label={`${label} erhöhen`}>+</button>
    </div>
  );
}

export type MerchTab = 'allgemein' | 'statistik';

/** Stückpreis (1975-Basis) als Betrag des Jahres (Verbraucherpreise × Markenaufschlag), mit Pfennig/Cent. */
export const unitPrice = (d: MerchItemDef, base: number, year: number) => fmtSmallMoney(base * itemPriceScale(d, year), year);

/** Ganze Zahl mit Tausenderpunkt. */
export const n0 = (v: number) => Math.round(v).toLocaleString('de-DE');

/** Betrag mit Vorzeichen-Farbe (nur Saldo/Gewinn). */
export function Signed({ v, fmt, pos }: { v: number; fmt: (x: number) => string; pos?: boolean }) {
  return <span style={{ color: v < 0 ? 'var(--neg)' : v > 0 && pos ? 'var(--pos)' : undefined }}>{v < 0 ? '−' : ''}{fmt(Math.abs(v))}</span>;
}

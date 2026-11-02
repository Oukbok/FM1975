// Zustands-Symbole (Frische/Form/Moral/Fitness) – Einstieg. Siehe StatusIcons.tsx + statusScale.ts.
import type { Player } from '../../types';
import { FitnessIcon, FormIcon, FreshnessIcon, MoraleIcon } from './StatusIcons';
import { fitness100, form100, freshness100, morale100, playerMorale100, statusLevel, statusWord, type StatusKind } from './statusScale';
import { InfoTip } from '../../ui/InfoTip';

export { FitnessIcon, FormIcon, FreshnessIcon, MoraleIcon };
export * from './statusScale';

/** Frische eines Spielers als Symbol. */
export const PlayerFreshness = ({ p, size, showValue }: { p: Player; size?: number; showValue?: boolean }) =>
  <FreshnessIcon value={freshness100(p)} size={size} showValue={showValue} />;
/** Form eines Spielers als Symbol. */
export const PlayerForm = ({ p, size, showValue }: { p: Player; size?: number; showValue?: boolean }) =>
  <FormIcon value={form100(p)} size={size} showValue={showValue} />;
/** Fitness eines Spielers als Symbol (Hantel). */
export const PlayerFitness = ({ p, size, showValue }: { p: Player; size?: number; showValue?: boolean }) =>
  <FitnessIcon value={fitness100(p)} size={size} showValue={showValue} />;
/** Moral eines Spielers als Symbol. */
export const PlayerMorale = ({ p, size, showValue }: { p: Player; size?: number; showValue?: boolean }) =>
  <MoraleIcon value={playerMorale100(p)} size={size} showValue={showValue} />;

/**
 * Zeile „Beschriftung · Symbol + Wort · Wert“ im Raster der Profil-Balken
 * (`.pp-bar-row`), z. B. im Kopf des Spielerprofils.
 */
export function StatusLine({ kind, value, label }: { kind: Exclude<StatusKind, 'kraft'>; value: number; label?: string }) {
  const Ico = kind === 'frische' ? FreshnessIcon : kind === 'form' ? FormIcon : kind === 'fitness' ? FitnessIcon : MoraleIcon;
  const v = Math.round(value);
  const title = label ?? (kind === 'frische' ? 'Frische' : kind === 'form' ? 'Form' : kind === 'fitness' ? 'Fitness' : 'Moral');
  return (
    <div className="pp-bar-row st-line">
      <span className="pp-bar-lbl">{title}<InfoTip k={kind} /></span>
      <span className="st-line-mid"><Ico value={v} size={18} /><span className="st-line-word">{statusWord(kind, statusLevel(kind, v))}</span></span>
      <span className="pp-bar-val">{v}</span>
    </div>
  );
}

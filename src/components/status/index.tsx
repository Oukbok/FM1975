// Zustands-Symbole (Frische/Form/Moral) – Einstieg. Siehe StatusIcons.tsx + statusScale.ts.
import type { Player } from '../../types';
import { FormIcon, FreshnessIcon, MoraleIcon } from './StatusIcons';
import { form100, freshness100, morale100 } from './statusScale';

export { FormIcon, FreshnessIcon, MoraleIcon };
export * from './statusScale';

/** Frische eines Spielers als Symbol. */
export const PlayerFreshness = ({ p, size, showValue }: { p: Player; size?: number; showValue?: boolean }) =>
  <FreshnessIcon value={freshness100(p)} size={size} showValue={showValue} />;
/** Form eines Spielers als Symbol. */
export const PlayerForm = ({ p, size, showValue }: { p: Player; size?: number; showValue?: boolean }) =>
  <FormIcon value={form100(p)} size={size} showValue={showValue} />;
/** Moral eines Spielers als Symbol. */
export const PlayerMorale = ({ p, size, showValue }: { p: Player; size?: number; showValue?: boolean }) =>
  <MoraleIcon value={morale100(p.morale)} size={size} showValue={showValue} />;

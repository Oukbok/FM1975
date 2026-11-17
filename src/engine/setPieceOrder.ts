// =============================================================================
// Reihenfolgen für Kapitän und Standards (Wunsch Pascal)
// -----------------------------------------------------------------------------
// Statt eines einzelnen Schützen legt man je Standard eine Reihenfolge fest
// (Aufstellung › Kapitän & Standards, Popup je Standard). Ecken von links und von
// rechts sind getrennt, Freistöße direkt aufs Tor und als Flanke ebenso. Im Spiel
// (engine/match/setpieces.ts, sim.ts) führt der Erste der Liste aus, der auf dem Platz
// steht; ist keiner da, der Beste nach dem passenden Attribut.
// Alte Stände/KI-Vereine ohne `takers`: die Einzel-IDs der Taktik gelten als Liste.
// =============================================================================
import type { AttributeKey, Tactics, TakerKind } from '../types';

export const TAKER_KINDS: { kind: TakerKind; label: string; attr: AttributeKey }[] = [
  { kind: 'captain', label: 'Kapitän', attr: 'leadership' },
  { kind: 'penalty', label: 'Elfmeter', attr: 'penalties' },
  { kind: 'fkDirect', label: 'Freistöße direkt', attr: 'freeKicks' },
  { kind: 'fkCross', label: 'Freistöße als Flanke', attr: 'crossing' },
  { kind: 'cornerL', label: 'Ecken von links', attr: 'corners' },
  { kind: 'cornerR', label: 'Ecken von rechts', attr: 'corners' },
];

/** Höchstzahl Einträge je Reihenfolge. */
export const TAKER_MAX = 5;

/** Reihenfolge eines Standards (mit Rückfall auf die Einzel-IDs). */
export function takerOrder(t: Partial<Tactics> | undefined, kind: TakerKind): string[] {
  const own = t?.takers?.[kind];
  if (own?.length) return own;
  const one = kind === 'captain' ? t?.captainId : kind === 'penalty' ? t?.penaltyTakerId
    : kind === 'fkDirect' ? t?.freeKickTakerId : kind === 'fkCross' ? (t?.freeKickTakerId ?? t?.cornerTakerId) : t?.cornerTakerId;
  return one ? [one] : [];
}

/** Reihenfolge setzen; die Einzel-IDs folgen dem Ersten (Anzeigen, ältere Programmteile). */
export function setTakerOrder(t: Tactics, kind: TakerKind, ids: string[]): void {
  const list = [...new Set(ids.filter(Boolean))].slice(0, TAKER_MAX);
  t.takers = { ...(t.takers ?? {}), [kind]: list };
  const first = list[0] ?? null;
  if (kind === 'captain') t.captainId = first;
  else if (kind === 'penalty') t.penaltyTakerId = first;
  else if (kind === 'fkDirect') t.freeKickTakerId = first;
  else if (kind === 'cornerL' || kind === 'cornerR') t.cornerTakerId = takerOrder(t, 'cornerL')[0] ?? takerOrder(t, 'cornerR')[0] ?? first;
}

/** Erster der Reihenfolge, der in `present` ist (sonst null). */
export const firstPresent = (order: string[], present: (id: string) => boolean): string | null => order.find(present) ?? null;

// Kurznamen für Aufstellungen: Nachname, bei Gleichheit mit Initiale („M. Krüger“).
import type { Player } from '../../types';

export function shortNamer(players: (Player | undefined)[]): (p: Player | undefined) => string {
  const count = new Map<string, number>();
  for (const p of players) if (p) count.set(p.lastName, (count.get(p.lastName) ?? 0) + 1);
  return (p) => (!p ? '?' : (count.get(p.lastName) ?? 0) > 1 ? `${p.firstName?.[0] ?? ''}. ${p.lastName}` : p.lastName);
}

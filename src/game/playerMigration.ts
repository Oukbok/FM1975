// =============================================================================
// Spielstand-Nachrüstung: Das frühere Legenden-System (fest geplante Ausnahme-
// talente) ist entfernt. Alte Spielstände behalten ihre Spieler – frühere
// Legenden sind danach ganz normale Spieler mit ihrem bisherigen Potenzial.
// Idempotent: mehrfaches Aufrufen ändert nichts mehr.
// =============================================================================
import type { Player } from '../types';
import type { Game } from './state';

const OLD_DEV_KEYS = ['legendId', 'legendBoost', 'legendCurve', 'legendSignature'] as const;
const OLD_GAME_KEYS = ['spawnedLegends', 'legendMode', 'legendProspects'] as const;

function stripPlayer(p: Player | undefined): number {
  const d = p?.development as unknown as Record<string, unknown> | undefined;
  if (!d) return 0;
  let n = 0;
  for (const k of OLD_DEV_KEYS) if (k in d) { delete d[k]; n++; }
  return n;
}

/** Entfernt alle Legenden-Felder aus Spielern, Archiv und Spielstand. Gibt die Zahl der bereinigten Felder zurück. */
export function migrateLegacyLegends(g: Game): number {
  let n = 0;
  for (const p of Object.values(g.players ?? {})) n += stripPlayer(p);
  for (const p of Object.values(g.youthPlayers ?? {})) n += stripPlayer(p);
  for (const a of (g.archive ?? []) as unknown as Record<string, unknown>[]) if ('legendId' in a) { delete a.legendId; n++; }
  const raw = g as unknown as Record<string, unknown>;
  for (const k of OLD_GAME_KEYS) if (k in raw) { delete raw[k]; n++; }
  return n;
}

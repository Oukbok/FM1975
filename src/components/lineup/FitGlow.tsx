// =============================================================================
// Eignungs-Rahmen beim Ziehen (Wunsch Pascal): Während ein Spieler gezogen wird,
// leuchten die Karten in der Farbe der Eignung (`positionSuitability`, Skala
// `suitabilityColor` wie Spalte „EIG“) – Feldkarten nach Eignung des gezogenen
// Spielers für die jeweilige Position, Bankkarten nach ihrer Eignung für die
// Position des vom Feld gezogenen Spielers. Gemeinsam für Aufstellung › Aufstellung
// und den Wechsel-Bildschirm im Textmodus. CSS `.fit`/`.lu-fit-badge` in 08-lineup-match.css.
// =============================================================================
import type { CSSProperties } from 'react';
import type { Player, Position } from '../../types';
import { positionSuitability, suitabilityColor } from '../../engine/positions';

/** Eignung je Position, einmal je Zug gerechnet (Aufrufer memoisiert über Spieler + Positionen). */
export function fitByPosition(p: Player, positions: Iterable<Position>): Partial<Record<Position, number>> {
  const out: Partial<Record<Position, number>> = {};
  for (const pos of positions) out[pos] ??= positionSuitability(p, pos);
  return out;
}

/** Eignung je Spieler (Bank) für eine Position. */
export function fitByPlayer(list: { id: string; p: Player }[], pos: Position): Record<string, number> {
  const out: Record<string, number> = {};
  for (const x of list) out[x.id] = positionSuitability(x.p, pos);
  return out;
}

/** Klasse + CSS-Variable `--fit` für die Hülle einer Karte/Zeile. */
export const fitProps = (v: number | null | undefined): { cls: string; style?: CSSProperties } =>
  v == null ? { cls: '' } : { cls: 'fit', style: { '--fit': suitabilityColor(v) } as CSSProperties };

/** Kleine Zahl an der Karte: Eignung des betreffenden Spielers. */
export function FitBadge({ v, title }: { v: number | null | undefined; title?: string }) {
  return v == null ? null : <span className="lu-fit-badge" title={title}>{v}</span>;
}

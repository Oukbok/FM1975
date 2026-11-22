// =============================================================================
// Namenspools, sechste Stufe (Wunsch Pascal: „Alle anderen Top-Länder brauchen genau so
// viele Namen wie Deutschland. Proportional im Verhältnis mit den simulierten Vereinen zu
// Deutschland …“). Ziel je Land = Namen Deutschlands (ger + ger_modern + ger_ost) ×
// simulierte Vereine mit Spielern bei diesem Heimatland ÷ bei Heimat Deutschland, Länder
// mit 4. Ebene (England, Spanien, Italien, Frankreich) mindestens so viele wie Deutschland.
// Zählung, Ziele und Vorgehen: docs/research/names-target.md (Skript tests/name-count.ts).
// Rohdaten je Region in namePoolsXL5<Region>.ts; Vornamen dort als Zeitspannen der
// Geburtsjahrgänge, hier in Stufen je Jahrzehnt umgesetzt (Format `XLNames.eras` wie
// data/namePoolsXL.ts) und in data/origins.ts über `mergeXL` eingemischt.
// =============================================================================
import type { XLNames } from './namePoolsXL';
import { XL5_SPAIN } from './namePoolsXL5Spain';
import { XL5_ITALY } from './namePoolsXL5Italy';
import { XL5_FRANCE } from './namePoolsXL5France';
import { XL5_BRITAIN } from './namePoolsXL5Britain';
import { XL5_NETHERLANDS } from './namePoolsXL5Netherlands';
import { XL5_BELGIUM } from './namePoolsXL5Belgium';
import { XL5_PORTUGAL } from './namePoolsXL5Portugal';
import { XL5_NORTH } from './namePoolsXL5North';
import { XL5_EAST } from './namePoolsXL5East';
import { XL5_SOUTH } from './namePoolsXL5South';
import { XL5_ALPS } from './namePoolsXL5Alps';

/** Rohdaten: Nachnamen + Vornamen je Zeitspanne der Geburtsjahrgänge [von, bis, Namen]. */
export interface XL5Names { last: string[]; spans: [number, number, string[]][] }

/** Stufenjahre der Vornamen (Geburtsjahrzehnte; 0 = alle Jahrgänge vor 1950). */
const STEPS = [0, 1950, 1960, 1970, 1980, 1990, 2000, 2010];

/** Zeitspannen → Vornamen-Stufen je Jahrzehnt (eine Stufe gilt bis zur nächsten). */
export function spansToEras(spans: XL5Names['spans']): [number, string[]][] {
  return STEPS.map((y, i) => {
    const decade = i === 0 ? 1940 : y;
    return [y, [...new Set(spans.filter(([a, b]) => a <= decade && b >= decade).flatMap(([, , n]) => n))]] as [number, string[]];
  }).filter(([, n]) => n.length);
}

const RAW: Record<string, XL5Names> = {
  ...XL5_SPAIN, ...XL5_ITALY, ...XL5_FRANCE, ...XL5_BRITAIN, ...XL5_NETHERLANDS, ...XL5_BELGIUM,
  ...XL5_PORTUGAL, ...XL5_NORTH, ...XL5_EAST, ...XL5_SOUTH, ...XL5_ALPS,
};

export const XL5: Record<string, XLNames> = Object.fromEntries(
  Object.entries(RAW).map(([id, x]) => [id, { last: x.last, eras: spansToEras(x.spans) }]),
);

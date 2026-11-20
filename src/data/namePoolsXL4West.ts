// =============================================================================
// Namenspools, fünfte Stufe (Wunsch Pascal: „immer noch zu viele doppelte Namen –
// vervierfache die Anzahl der verfügbaren Namen“). Aufbau wie data/namePoolsXL.ts
// (`XLNames`: last, first, eras = [ab Geburtsjahr, Vornamen]); eingemischt in
// data/origins.ts über `mergeXL` nach der vierten Stufe. Nur in der Bevölkerung
// häufige Namen, keine bekannten Fußballer-Paare. Rohdaten je Region:
// namePoolsXL4West2.ts (DE/AT/CH), …West3.ts (Benelux/Skandinavien/Suriname),
// …West4.ts (Britische Inseln, USA, Ozeanien, Karibik), …West5.ts (Frankreich).
// =============================================================================
import type { XLNames } from './namePoolsXL';
import { DE_LAST_ALL, DE_LAST_MORE, DE_LAST_OST, DE_LAST_OST2, DE_FIRST, DE_FIRST_MORE, DE_FIRST_KATH, DE_FIRST_NORD, DE_FIRST_OST, AT_FIRST, AT_FIRST_MORE, AT_LAST, CH_LAST, CH_FIRST, CH_FIRST_MORE } from './namePoolsXL4West2';
import { XL4_WEST_NORTH } from './namePoolsXL4West3';
import { XL4_WEST_ENG } from './namePoolsXL4West4';
import { XL4_WEST_FRA } from './namePoolsXL4West5';

type Eras = Record<number, string[]>;
/** Stufen [Jahr, Namen] aus mehreren Tabellen (je Jahr gilt in jeder Tabelle die letzte Stufe davor; vereinigt, ohne Dubletten). */
export function erasOf(...tabs: Eras[]): [number, string[]][] {
  const years = [...new Set(tabs.flatMap((t) => Object.keys(t).map(Number)))].sort((a, b) => a - b);
  const at = (t: Eras, y: number): string[] => {
    const k = Object.keys(t).map(Number).filter((x) => x <= y).sort((a, b) => b - a)[0];
    return k == null ? [] : t[k];
  };
  return years.map((y) => [y, [...new Set(tabs.flatMap((t) => at(t, y)))]]);
}

const DACH: Record<string, XLNames> = {
  ger: { last: [...DE_LAST_ALL, ...DE_LAST_MORE], eras: erasOf(DE_FIRST, DE_FIRST_MORE, DE_FIRST_KATH, DE_FIRST_NORD) },
  ger_modern: { last: [...DE_LAST_ALL, ...DE_LAST_MORE], eras: erasOf(DE_FIRST, DE_FIRST_MORE, DE_FIRST_KATH, DE_FIRST_NORD) },
  ger_ost: { last: [...DE_LAST_OST, ...DE_LAST_OST2], eras: erasOf(DE_FIRST_OST, DE_FIRST) },
  aut: { last: AT_LAST, eras: erasOf(AT_FIRST, AT_FIRST_MORE, DE_FIRST_KATH) },
  sui: { last: CH_LAST, eras: erasOf(CH_FIRST, CH_FIRST_MORE) },
};

export const XL4_WEST: Record<string, XLNames> = { ...DACH, ...XL4_WEST_NORTH, ...XL4_WEST_ENG, ...XL4_WEST_FRA };

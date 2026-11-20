// =============================================================================
// Namenspools, fünfte Stufe (Wunsch Pascal: „immer noch zu viele doppelte Namen –
// vervierfache die Anzahl der verfügbaren Namen“). Aufbau wie data/namePoolsXL.ts
// (`XLNames`: last, first, eras = [ab Geburtsjahr, Vornamen]); eingemischt in
// data/origins.ts über `mergeXL` nach der vierten Stufe. Nur in der Bevölkerung
// häufige Namen, keine bekannten Fußballer-Paare.
// =============================================================================
import type { XLNames } from './namePoolsXL';

export const XL4_SOUTH: Record<string, XLNames> = {};

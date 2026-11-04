// Aktive Liste der Ausnahmetalente. Der eingebaute Datensatz liefert BUILTIN_LEGENDS;
// ein eigener Datensatz ersetzt die Liste in place (data/dataset/apply.ts).
import { LEGENDS_A } from './list1';
import { LEGENDS_B } from './list2';
import type { LegendDef } from './types';

export * from './types';

export const BUILTIN_LEGENDS: LegendDef[] = [...LEGENDS_A, ...LEGENDS_B];

/** Die im laufenden Spiel gültige Liste (wird beim Anwenden eines Datensatzes ersetzt). */
export const LEGENDS: LegendDef[] = JSON.parse(JSON.stringify(BUILTIN_LEGENDS));

export function legendById(id: string): LegendDef | undefined {
  return LEGENDS.find((l) => l.id === id);
}

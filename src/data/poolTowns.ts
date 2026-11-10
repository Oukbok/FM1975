// =============================================================================
// AMATEUR-POOL: Städte für den Nachschub (game/clubPool.ts `refillPool`)
// -----------------------------------------------------------------------------
// Reformen holen viele Pool-Vereine in die Pyramide. Fällt der Pool unter
// POOL_MIN, rücken Amateurvereine aus diesen Städten nach (Name = Stadt), sofern
// die Stadt noch keinen Verein im Spiel hat. Region = Staffel bzw. DDR (nordost).
// Datensatz-Feld `poolTowns` (Editor „Amateur-Pool“) ersetzt die Liste.
// =============================================================================
export type PoolRegion = 'nord' | 'west' | 'sued' | 'nordost';
export interface PoolTown { town: string; group: PoolRegion }

export const POOL_REGIONS: { value: PoolRegion; label: string }[] = [
  { value: 'nord', label: 'Nord' }, { value: 'west', label: 'West' }, { value: 'sued', label: 'Süd' }, { value: 'nordost', label: 'Nordost (DDR)' },
];

export const POOL_TOWNS: PoolTown[] = [
  { town: 'Cuxhaven', group: 'nord' },
  { town: 'Celle', group: 'nord' },
  { town: 'Lüneburg', group: 'nord' },
  { town: 'Stade', group: 'nord' },
  { town: 'Emden', group: 'nord' },
  { town: 'Wilhelmshaven', group: 'nord' },
  { town: 'Husum', group: 'nord' },
  { town: 'Rendsburg', group: 'nord' },
  { town: 'Neumünster', group: 'nord' },
  { town: 'Delmenhorst', group: 'nord' },
  { town: 'Nienburg', group: 'nord' },
  { town: 'Verden', group: 'nord' },
  { town: 'Siegen', group: 'west' },
  { town: 'Hagen', group: 'west' },
  { town: 'Iserlohn', group: 'west' },
  { town: 'Lünen', group: 'west' },
  { town: 'Marl', group: 'west' },
  { town: 'Moers', group: 'west' },
  { town: 'Düren', group: 'west' },
  { town: 'Hamm', group: 'west' },
  { town: 'Gütersloh', group: 'west' },
  { town: 'Lippstadt', group: 'west' },
  { town: 'Bergheim', group: 'west' },
  { town: 'Arnsberg', group: 'west' },
  { town: 'Ulm', group: 'sued' },
  { town: 'Aalen', group: 'sued' },
  { town: 'Pforzheim', group: 'sued' },
  { town: 'Kempten', group: 'sued' },
  { town: 'Rosenheim', group: 'sued' },
  { town: 'Passau', group: 'sued' },
  { town: 'Landshut', group: 'sued' },
  { town: 'Bamberg', group: 'sued' },
  { town: 'Ansbach', group: 'sued' },
  { town: 'Konstanz', group: 'sued' },
  { town: 'Ravensburg', group: 'sued' },
  { town: 'Memmingen', group: 'sued' },
  { town: 'Wismar', group: 'nordost' },
  { town: 'Stendal', group: 'nordost' },
  { town: 'Torgau', group: 'nordost' },
  { town: 'Plauen', group: 'nordost' },
  { town: 'Gera', group: 'nordost' },
  { town: 'Suhl', group: 'nordost' },
  { town: 'Görlitz', group: 'nordost' },
  { town: 'Eberswalde', group: 'nordost' },
  { town: 'Neubrandenburg', group: 'nordost' },
  { town: 'Greifswald', group: 'nordost' },
  { town: 'Halberstadt', group: 'nordost' },
  { town: 'Wittenberg', group: 'nordost' },
];

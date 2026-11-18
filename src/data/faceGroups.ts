// =============================================================================
// Gesichtsgruppen (verdeckte Ethnie, data/origins.ts `FaceGroup`) mit deutschen
// Beschriftungen für den Editor. Die Liste selbst ist fest (Bilder in
// bilder/faces/<gruppe>/), nur die Beschriftung ist für Menschen gedacht.
// =============================================================================
import type { FaceGroup } from './origins';

export const FACE_GROUPS: FaceGroup[] = [
  'mitteleuropa', 'nordeuropa', 'suedeuropa', 'osteuropa', 'balkan',
  'tuerkei', 'westafrika', 'lateinamerika', 'ostasien', 'nordafrika',
];

export const FACE_LABELS: Record<FaceGroup, string> = {
  mitteleuropa: 'Mitteleuropa', nordeuropa: 'Nordeuropa', suedeuropa: 'Südeuropa', osteuropa: 'Osteuropa',
  balkan: 'Balkan', tuerkei: 'Türkei', westafrika: 'Westafrika', lateinamerika: 'Lateinamerika',
  ostasien: 'Ostasien', nordafrika: 'Nordafrika',
};

/** Auswahlliste für Editor-Felder (Wert = Gruppen-Schlüssel, Beschriftung deutsch). */
export const FACE_OPTIONS = FACE_GROUPS.map((value) => ({ value, label: FACE_LABELS[value] }));

export const isFaceGroup = (x: unknown): x is FaceGroup => typeof x === 'string' && (FACE_GROUPS as string[]).includes(x);

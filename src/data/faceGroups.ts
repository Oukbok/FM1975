// =============================================================================
// Gesichtsgruppen (verdeckte Ethnie, data/origins.ts `FaceGroup`) mit deutschen
// Beschriftungen für den Editor. Die Liste selbst ist fest, nur die Beschriftung
// ist für Menschen gedacht. Die Schlüssel (z. B. 'mitteleuropa') stehen so in
// Spielständen und Datensätzen und bleiben unverändert; die Bilder liegen in
// englisch benannten Ordnern images/faces/<ordner>/ – Zuordnung in faceDirs.json
// (eine Quelle auch für scripts/faces-register.mjs und die Python-Skripte).
// =============================================================================
import type { FaceGroup } from './origins';
import FACE_DIR_MAP from './faceDirs.json';

/** Ordner unter images/faces/ je Gesichtsgruppe (plus `staff`). */
export const FACE_DIRS: Record<FaceGroup | 'staff', string> = FACE_DIR_MAP;
/** Ordnername einer Gruppe; unbekannte Schlüssel bleiben, wie sie sind. */
export const faceDir = (group: string): string => (FACE_DIRS as Record<string, string>)[group] ?? group;

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

// =============================================================================
// LEGENDEN-PROFILE: Archetyp, Seltenheit, Entwicklungskurve, Signatur-Werte
// -----------------------------------------------------------------------------
// Ein Archetyp legt fest, welche Attribute einer Legende von Anfang an hoch
// sind und wohin sie sich entwickelt. Die Seltenheit bestimmt den verdeckten
// Talent-Korridor (in Sternen): Beim Auftauchen wird das wahre Potenzial
// daraus ausgewürfelt – eine „Weltklasse“-Legende wird meistens ein Star, aber
// nicht immer.
// =============================================================================
import { AttributeKey, Position } from '../types';

export type LegendRarity = 'weltklasse' | 'national' | 'liebling';
export type LegendCurve = 'frueh' | 'normal' | 'spaet';

export interface LegendArchetype {
  id: string;
  label: string;
  positions: Position[];
  /** Kennzeichnende Attribute (starten hoch, wachsen bevorzugt). */
  attrs: AttributeKey[];
}

export const LEGEND_ARCHETYPES: LegendArchetype[] = [
  { id: 'katze', label: 'Torwart-Katze', positions: ['TW'], attrs: ['reflexes', 'oneOnOnes', 'agility', 'handling'] },
  { id: 'mitspieler_tw', label: 'Mitspielender Torwart', positions: ['TW'], attrs: ['kicking', 'communication', 'composure', 'aerialReach'] },
  { id: 'libero', label: 'Libero', positions: ['LIB'], attrs: ['vision', 'passing', 'positioning', 'composure'] },
  { id: 'ausputzer', label: 'Ausputzer', positions: ['LIB', 'VS'], attrs: ['tackling', 'heading', 'strength', 'positioning'] },
  { id: 'manndecker', label: 'Manndecker', positions: ['VS'], attrs: ['marking', 'tackling', 'aggression', 'stamina'] },
  { id: 'spielende_iv', label: 'Spielender Innenverteidiger', positions: ['VS'], attrs: ['passing', 'composure', 'interceptions', 'decisions'] },
  { id: 'aussenlaeufer', label: 'Offensiver Außenverteidiger', positions: ['AV'], attrs: ['crossing', 'speed', 'stamina', 'workRate'] },
  { id: 'abraeumer', label: 'Abräumer', positions: ['DM'], attrs: ['tackling', 'interceptions', 'stamina', 'workRate'] },
  { id: 'regisseur', label: 'Regisseur', positions: ['DM', 'ZM'], attrs: ['passing', 'longPassing', 'vision', 'composure'] },
  { id: 'motor', label: 'Motor', positions: ['ZM'], attrs: ['stamina', 'workRate', 'passing', 'teamwork'] },
  { id: 'spielmacher', label: 'Spielmacher', positions: ['OM', 'ZM'], attrs: ['vision', 'passing', 'technique', 'flair'] },
  { id: 'fluegelflitzer', label: 'Flügelflitzer', positions: ['FL', 'AV'], attrs: ['speed', 'acceleration', 'dribbling', 'crossing'] },
  { id: 'strafraumstuermer', label: 'Strafraumstürmer', positions: ['MS'], attrs: ['shooting', 'positioning', 'composure', 'heading'] },
  { id: 'kopfballungeheuer', label: 'Kopfballungeheuer', positions: ['MS', 'VS'], attrs: ['heading', 'jumping', 'strength', 'aerialReach'] },
  { id: 'dribbelkuenstler', label: 'Dribbelkünstler', positions: ['HS', 'FL', 'OM'], attrs: ['dribbling', 'flair', 'ballControl', 'agility'] },
  { id: 'freistossspezialist', label: 'Freistoß-Spezialist', positions: ['OM', 'HS', 'ZM'], attrs: ['freeKicks', 'shotPower', 'longShots', 'technique'] },
];

export const ARCHETYPE_BY_ID: Record<string, LegendArchetype> = Object.fromEntries(LEGEND_ARCHETYPES.map((a) => [a.id, a]));

/** Standard-Archetyp je Position (für Legenden ohne Angabe). */
const DEFAULT_ARCHETYPE: Record<string, string> = {
  TW: 'katze', LIB: 'libero', VS: 'manndecker', AV: 'aussenlaeufer', DM: 'abraeumer',
  ZM: 'motor', OM: 'spielmacher', FL: 'fluegelflitzer', MS: 'strafraumstuermer', HS: 'dribbelkuenstler',
};

export function archetypeFor(id: string | undefined, pos: Position): LegendArchetype {
  return ARCHETYPE_BY_ID[id ?? ''] ?? ARCHETYPE_BY_ID[DEFAULT_ARCHETYPE[pos] ?? 'motor'];
}

export const RARITY_LABEL: Record<LegendRarity, string> = {
  weltklasse: 'Weltklasse', national: 'Nationalspieler', liebling: 'Publikumsliebling',
};

/** Talent-Korridor in Sternen (nur für Editor/Wiki; das Spiel würfelt verdeckt). */
export const RARITY_CORRIDOR: Record<LegendRarity, [number, number]> = {
  weltklasse: [4.0, 5.0], national: [3.5, 4.5], liebling: [3.0, 4.0],
};

/**
 * Verdeckt ausgewürfeltes Höchstpotenzial (OVR-Skala). Zielquote Weltklasse:
 * etwa 7 von 10 werden Stars, 2 gute Profis, 1 bleibt hinter den Erwartungen.
 */
const ROLL_BANDS: Record<LegendRarity, [number, number, number][]> = {
  // [Anteil, von, bis]
  weltklasse: [[0.7, 88, 95], [0.2, 83, 87], [0.1, 76, 82]],
  national: [[0.4, 82, 87], [0.45, 77, 81], [0.15, 72, 76]],
  liebling: [[0.5, 75, 81], [0.35, 70, 74], [0.15, 65, 69]],
};

export function rollLegendPeak(rarity: LegendRarity, cap: number | undefined, rng: () => number): number {
  let r = rng();
  let band = ROLL_BANDS[rarity][0];
  for (const b of ROLL_BANDS[rarity]) { band = b; if (r < b[0]) break; r -= b[0]; }
  const v = Math.round(band[1] + rng() * (band[2] - band[1]));
  return cap ? Math.min(cap, v) : v;
}

/** Seltenheit aus der alten Höchststärke ableiten (Datensätze ohne Angabe). */
export function rarityFromPeak(peak: number): LegendRarity {
  return peak >= 91 ? 'weltklasse' : peak >= 85 ? 'national' : 'liebling';
}

/** Entwicklungsschub je Seltenheit (Auffassungsgabe). */
export const RARITY_BOOST: Record<LegendRarity, number> = { weltklasse: 1.4, national: 1.15, liebling: 1.0 };

/** Alter des Leistungshöhepunkts je Kurve. */
export const CURVE_PEAK_AGE: Record<LegendCurve, number> = { frueh: 25, normal: 27, spaet: 29 };

/** Wachstumsfaktor je Kurve und Alter (früh: Sprung mit 17–20, spät: mit 22–26). */
export function curveFactor(curve: LegendCurve | undefined, age: number): number {
  if (curve === 'frueh') return age <= 20 ? 1.25 : age <= 23 ? 0.95 : 0.85;
  if (curve === 'spaet') return age <= 19 ? 0.8 : age <= 21 ? 1.0 : age <= 26 ? 1.35 : 1.1;
  return 1;
}

/** Signatur-Wert „heading:90-95“ → { attr, min, max }. */
export function parseSignature(s: string): { attr: AttributeKey; min: number; max: number } | null {
  const m = /^\s*([a-zA-Z]+)\s*:\s*(\d+)\s*-\s*(\d+)\s*$/.exec(s);
  if (!m) return null;
  const min = Number(m[2]), max = Number(m[3]);
  return { attr: m[1] as AttributeKey, min: Math.min(min, max), max: Math.max(min, max) };
}

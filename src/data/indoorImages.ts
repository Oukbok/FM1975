// =============================================================================
// Foto-Slots der Hallen-Show (screens/indoor/IndoorHall.tsx)
// -----------------------------------------------------------------------------
// Liegt ein Foto unter `bilder/indoor/halle-<epoche>.webp`, hier die Epoche
// eintragen – dann liegt das Foto über der gezeichneten Halle (die bleibt Rückfall,
// auch bei Ladefehlern). Nur eingetragene Epochen werden geladen (keine 404-Anfragen).
// Format: WebP 1920 × 1080 px, Halleninneres mit Tribünen und Rundumbande, ohne
// erkennbare Personen und Logos, entsättigt und kühl abgedunkelt. Motive: docs/bilder/BILDER.md.
// =============================================================================
export type HallEra = '70er' | '80er' | '90er' | '2000er';

export const INDOOR_HALL_PHOTOS: Partial<Record<HallEra, true>> = {
  // '90er': true,
};

export function hallEra(year: number): HallEra {
  return year < 1980 ? '70er' : year < 1990 ? '80er' : year < 2000 ? '90er' : '2000er';
}

export function hallPhoto(year: number): string | null {
  const e = hallEra(year);
  return INDOOR_HALL_PHOTOS[e] ? `assets/indoor/halle-${e}.webp` : null;
}

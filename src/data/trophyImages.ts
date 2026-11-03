// =============================================================================
// Foto-Slots für Trophäen (Verein › Erfolge, Vereinsprofil › Erfolge)
// -----------------------------------------------------------------------------
// Liegt ein fotorealistisches Bild unter `public/assets/trophies/<form>.webp`,
// hier die Form eintragen – dann zeigt die Vitrine das Foto statt der Zeichnung
// (views/verein/trophies/TrophyArt.tsx bleibt Rückfall, auch bei Ladefehlern).
// Nur eingetragene Formen werden geladen (keine 404-Anfragen).
// Format: WebP, quadratnah 1000 × 1100 px, freigestellt (Alpha) oder auf
// dunklem neutralem Grund, Licht von links oben, Trophäe mittig auf dem Sockel.
// =============================================================================
import type { TrophyShape } from '../game/trophyCabinet';

export const TROPHY_PHOTOS: Partial<Record<TrophyShape, true>> = {
  // schale: true,
};

export function trophyPhoto(shape: TrophyShape): string | null {
  return TROPHY_PHOTOS[shape] ? `assets/trophies/${shape}.webp` : null;
}

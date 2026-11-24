// =============================================================================
// Foto-Slots für Trophäen (Verein › Erfolge, Vereinsprofil › Erfolge)
// -----------------------------------------------------------------------------
// Fotorealistische Bilder liegen unter `images/trophies/<datei>.webp` (englische,
// neutrale Dateinamen, Wunsch Pascal). Form → Datei hier eintragen – dann zeigt die
// Vitrine das Foto statt der Zeichnung
// (views/club/trophies/TrophyArt.tsx bleibt Rückfall, auch bei Ladefehlern).
// Nur eingetragene Formen werden geladen (keine 404-Anfragen).
// Format: WebP, quadratnah 1000 × 1100 px, freigestellt (Alpha) oder auf
// dunklem neutralem Grund, Licht von links oben, Trophäe mittig auf dem Sockel.
// =============================================================================
import type { TrophyShape } from '../game/trophyCabinet';

export const TROPHY_PHOTOS: Partial<Record<TrophyShape, string>> = {
  schale: 'league-champions-plate',
  ddr: 'gdr-champions-cup',
  teller: 'division-winners-plate',
  pokal: 'national-cup',
  henkel: 'continental-champions-cup',
  cwc: 'cup-winners-cup',
  uefa: 'continental-league-cup',
  konferenz: 'europe-trophy',
  welt: 'world-club-cup',
  halle: 'indoor-cup',
  jugend: 'youth-cup',
  uyl: 'youth-champions-cup',
  aufstieg: 'promotion-plaque',
};

/** Spieler des Jahres (Kristallstern auf schwarzem Sockel) – angezeigt über components/awards/CrystalStarTrophy.tsx
 *  (Gala, Statistiken › Auszeichnungen, Spielerprofil), Rückfall: gezeichneter Stern. */
export const PLAYER_OF_THE_YEAR_PHOTO = 'assets/trophies/player-of-the-year.webp';

export function trophyPhoto(shape: TrophyShape): string | null {
  const f = TROPHY_PHOTOS[shape];
  return f ? `assets/trophies/${f}.webp` : null;
}

// =============================================================================
// Foto-Slots für Trainingslager-Ziele (Planer › Trainingsprogramm, großes Ortsbild)
// -----------------------------------------------------------------------------
// Liegt ein Foto unter `public/assets/camp/<ziel-id>.webp`, hier die Ziel-ID eintragen –
// dann zeigt der Planer das Foto statt der gezeichneten Landschaft
// (views/kader/camp/CampScenery.tsx bleibt Rückfall, auch bei Ladefehlern).
// Nur eingetragene Ziele werden geladen (keine 404-Anfragen). Motive je Ziel:
// docs/bilder/camp.md. Format: WebP 1280 × 800 px (16:10), Landschaft/Ort ohne
// Personen und Logos, entsättigt und kühl (wie die übrigen Hintergrundfotos).
// =============================================================================
export const CAMP_PHOTOS: Record<string, true> = {
  // tegernsee: true,
};

export function campPhoto(destId: string): string | null {
  return CAMP_PHOTOS[destId] ? `assets/camp/${destId}.webp` : null;
}

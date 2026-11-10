// =============================================================================
// Bild-Slots des Saison-Briefings (Zentrale › Briefing, Wunsch Pascal: Archiv im
// Zeitungslayout mit Fotos je Ereignis)
// -----------------------------------------------------------------------------
// Je Ereignis einer Saison ein Foto unter `bilder/briefing/<jahr>-<titel-slug>.webp`
// (Schlüssel aus `briefingImageKey`), je Art von „Neu im Spiel“ eines unter
// `bilder/briefing/neu/<art>.webp`. Liegt ein Bild vor, hier den Schlüssel eintragen –
// nur Eingetragenes wird geladen (keine 404-Anfragen); sonst zeichnet die Seite einen
// ruhigen Ersatz mit Themen-Symbol. Vollständige Liste mit Motiven:
// docs/bilder/briefing.md (erzeugt mit `node scripts/run-ts.mjs scripts/briefing-image-list.ts`).
// Format: WebP 1280 × 720 px (16:9), keine echten Logos, Vereine, Personen oder Marken.
// =============================================================================

/** Vorhandene Ereignis-Fotos, Schlüssel = `briefingImageKey(jahr, titel)`. */
export const BRIEFING_PHOTOS: Record<string, true> = {
  // '2015-torlinientechnik': true,
};

/** Vorhandene Fotos je Art von „Neu im Spiel“ (CHANGE_KIND_META in game/briefingChanges.ts). */
export const BRIEFING_KIND_PHOTOS: Record<string, true> = {
  // technik: true,
};

/** Dateiname ohne Endung: „2015-torlinientechnik“. */
export function briefingImageKey(startYear: number, title: string): string {
  const slug = title.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
  return `${startYear}-${slug}`;
}

export function briefingPhoto(key: string): string | null {
  return BRIEFING_PHOTOS[key] ? `assets/briefing/${key}.webp` : null;
}

export function briefingKindPhoto(kind: string): string | null {
  return BRIEFING_KIND_PHOTOS[kind] ? `assets/briefing/neu/${kind}.webp` : null;
}

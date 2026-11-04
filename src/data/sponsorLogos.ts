// =============================================================================
// Bild-Slots für Sponsorenlogos (Finanzen › Sponsoring: Trikot, Banden, Pyramide, Karteikarte)
// -----------------------------------------------------------------------------
// Liegt ein Logo unter `public/assets/sponsor/logos/<slug>.webp`, hier den Slug eintragen –
// dann zeigt `views/finanzen/sponsor/SponsorLogo.tsx` das Bild statt des gezeichneten Logos
// (die Zeichnung bleibt Rückfall, auch bei Ladefehlern). Nur eingetragene Logos werden geladen
// (keine 404-Anfragen). Slug = Firmenname klein, Umlaute ausgeschrieben, Akzente weg, alles
// außer Buchstaben/Ziffern → „-“ (Beispiel „Kesselberg Bräu“ → `kesselberg-braeu`).
// Liste aller Firmen mit Branche/Land/Zeitraum/Stil: docs/bilder/sponsorlogos.md.
// Format: 600 × 300 px, transparent (WebP oder PNG mit Alpha), Logo mittig mit ~8 % Rand.
// =============================================================================

export const SPONSOR_LOGOS: Record<string, true> = {
  // 'kesselberg-braeu': true,
};

export function sponsorLogoSlug(name: string): string {
  return name.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' und ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Pfad des Logobilds oder null, wenn keins eingetragen ist. */
export function sponsorLogoImage(name: string): string | null {
  const s = sponsorLogoSlug(name);
  return SPONSOR_LOGOS[s] ? `assets/sponsor/logos/${s}.webp` : null;
}

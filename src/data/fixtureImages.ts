// =============================================================================
// Bild-Slot „Fans“ oben links in Aufstellung › Spielplan (Wunsch Pascal)
// -----------------------------------------------------------------------------
// Schwarz-Weiß-Foto einer Fankurve, je Jahrzehnt ein eigenes Motiv (Kleidung,
// Fahnen, Schals, Pyro, Handys … ändern sich über die Zeit). Keine Farben im Bild,
// damit es zu jedem Verein passt – die Seite legt die Vereinsfarbe ganz leicht
// darüber. Liegt eine Datei unter `bilder/spielplan/fans-<jahrzehnt>.webp`
// (z. B. fans-1970.webp), hier das Jahrzehnt eintragen; nur eingetragene Dateien
// werden geladen (keine 404-Anfragen). Fehlt das Jahrzehnt, nimmt die Seite das
// nächstfrühere vorhandene, sonst das nächstspätere, sonst die gezeichnete Kurve.
// Format: WebP, 1200 × 450 px (8 : 3), Motiv rechts ausgedünnt (läuft ins Papier aus).
// Prompt und Motive: docs/bilder/BILDER.md, Abschnitt „Spielplan – Fanbild“.
// =============================================================================

export const FAN_PHOTO_DECADES: number[] = [
  // 1970, 1980, 1990, 2000, 2010, 2020, 2030,
];

export function fanPhoto(year: number): string | null {
  if (!FAN_PHOTO_DECADES.length) return null;
  const dec = Math.floor(year / 10) * 10;
  const sorted = [...FAN_PHOTO_DECADES].sort((a, b) => a - b);
  const pick = [...sorted].reverse().find((d) => d <= dec) ?? sorted[0];
  return `assets/spielplan/fans-${pick}.webp`;
}

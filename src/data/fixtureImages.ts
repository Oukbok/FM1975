// =============================================================================
// Bild-Slot „Fans“ oben links in Aufstellung › Spielplan (Wunsch Pascal)
// -----------------------------------------------------------------------------
// Schwarz-Weiß-Fotos von Fans, je Jahrzehnt eigene Motive (Kleidung, Fahnen,
// Schals, Pyro, Handys … ändern sich über die Zeit). Keine Farben im Bild, damit
// es zu jedem Verein passt – die Seite legt die Vereinsfarbe ganz leicht darüber.
// Je Jahrzehnt eine Liste von Bildpfaden (unter bilder/ = assets/); die Seite
// wechselt fest je Spiel. Fehlt ein Jahrzehnt, nimmt sie das nächstfrühere, sonst
// das nächstspätere, sonst die gezeichnete Kurve. Nur eingetragene Dateien werden
// geladen (keine 404-Anfragen).
// Eigene Motive: `bilder/spielplan/fans-<jahrzehnt>.webp` (1200 × 450) oder die
// Pressefotos „fans“ der Epoche (1200 × 600). Prompts: docs/bilder/BILDER.md,
// Abschnitt „Spielplan – Fanbild“.
// =============================================================================

const press1975 = ['fans', ...Array.from({ length: 10 }, (_, i) => `fans_${String(i + 1).padStart(2, '0')}`)].map((n) => `assets/presse/1975/${n}.webp`);

export const FAN_PHOTOS: Record<number, string[]> = {
  1970: press1975,
};

const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };

/** Fanbild für ein Jahr; `key` (z. B. Datum + Gegner) wählt fest unter den Fassungen. */
export function fanPhoto(year: number, key = ''): string | null {
  const decades = Object.keys(FAN_PHOTOS).map(Number).sort((a, b) => a - b);
  if (!decades.length) return null;
  const dec = Math.floor(year / 10) * 10;
  const pick = [...decades].reverse().find((d) => d <= dec) ?? decades[0];
  const list = FAN_PHOTOS[pick];
  return list[hash(key) % list.length];
}

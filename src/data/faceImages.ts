// =============================================================================
// Register der Gesichtsbilder (Spieler + Mitarbeiter) – WIRD ERZEUGT.
// -----------------------------------------------------------------------------
// Nicht von Hand pflegen: Bilder nach `public/assets/faces/…` legen und
//   node scripts/faces-register.mjs
// ausführen – das Skript prüft die Dateinamen und schreibt diese Datei neu.
// Nur eingetragene Bilder werden geladen (keine 404-Anfragen); fehlt ein Bild
// für eine Gruppe, zeichnet das Spiel das Gesicht wie bisher (PlayerAvatar).
//
// Pfad je Eintrag (ohne `.webp`): `<gruppe>/<epoche>/<nr>` oder `<gruppe>/<epoche>/<nr>-<alter>`
//   gruppe  = Gesichtsgruppe aus data/origins.ts (mitteleuropa, nordeuropa, …) oder `staff`
//   epoche  = 1970 | 1980 | 1990 | 2000 | 2010 | 2020
//   nr      = laufende Nummer (01, 02, …) = eine Person
//   alter   = 18 | 25 | 32 | 38 (Spieler) bzw. 35 | 45 | 55 | 65 (Mitarbeiter), optional
// FACE_MASKS: Einträge, zu denen eine Trikot-Maske `<…>-maske.webp` vorliegt.
// Anleitung: docs/bilder/BILDER.md, Abschnitt 2.
// =============================================================================
export const FACE_FILES: string[] = [
];

export const FACE_MASKS: string[] = [
];

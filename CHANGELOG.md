# Änderungen

Versionsnummer: `package.json` (einzige Quelle) → Hauptmenü unten links, Fenstertitel der Desktop-Fassung,
Dateinamen der Builds. Schema `GROSS.KLEIN.PATCH` (Wunsch Pascal: erste Version 0.1.x, Patches zählen die letzte Stelle hoch): PATCH = Fehlerbehebungen, KLEIN = neue Inhalte,
GROSS = Spielstände älterer Fassungen laden nicht mehr (soll nie nötig werden – `npm run test:savecompat`).
Ablauf für einen Patch: `desktop/README.md`.

## 0.1.0 – erste Version, erster Desktop-Build (November 2026)
- Desktop-Fassung für Windows und Linux/Steam Deck (Electron, Ordner `desktop/`).
- Spielstände der Desktop-Fassung als Dateien im Benutzerordner (`saves/<slot>.fm1975save`, gzip, mit Sicherung
  der vorherigen Fassung); vorhandene Stände aus dem Browser-Speicher der Desktop-Fassung werden einmalig übernommen.
- Versionsnummer und Build-Kennung im Hauptmenü.
- Desktop: Vollbild mit F11 oder Alt+Enter, Schriften liegen bei (kein Netz nötig), Rückfrage beim Schließen im laufenden Spiel.

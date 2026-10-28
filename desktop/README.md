# Desktop-Version (Windows, später Steam)

Das Spiel läuft komplett ohne Server. Diese Hülle verpackt den Build aus `../dist` mit Electron als Windows-Programm.

## Starten (Entwicklung)
```
cd desktop
npm install
npm start
```

## Windows-Installer bauen
Auf einem Windows-Rechner (oder mit Wine unter Linux):
```
cd desktop
npm install
npm run dist:win
```
Ergebnis in `desktop/release/`: Installer (NSIS) und eine portable `.exe`.

## Wo liegen die Spielstände?
Spielstände (localStorage) sowie Datensätze und eigene Wappen (IndexedDB) liegen im Benutzerordner der App,
unter Windows `%APPDATA%\1975 A Football Manager`. Menü „Spiel → Spielstand-Ordner öffnen“ zeigt ihn an.
Das Spiel wird über das eigene Protokoll `app://fm1975/` geladen, damit dieser Ordner über Updates hinweg gleich bleibt.

## Steam (nächster Schritt)
- Steamworks-SDK über ein Node-Modul (z. B. `steamworks.js`) im Hauptprozess einbinden: Erfolge, Cloud-Speicher.
- Für Steam-Cloud die Spielstände zusätzlich als Dateien im Benutzerordner ablegen (Export aus localStorage beim Speichern).
- Bilder (Wappen, Hintergründe, Gesichter) müssen frei verwendbar sein; keine echten Namen (siehe CLAUDE.md).

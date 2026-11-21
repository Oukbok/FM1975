# Desktop-Fassung (Windows, Linux/Steam Deck – Ziel Steam)

Das Spiel läuft komplett ohne Server und ohne Netz. Diese Hülle verpackt den Build aus `../dist` mit Electron.

| Datei | Aufgabe |
|---|---|
| `main.cjs` | Hauptprozess: Fenster, Protokoll `app://fm1975/`, Tasten, IPC, sperrt alle Netz-Anfragen |
| `preload.cjs` | Brücke zum Spiel (`window.fm1975Desktop`, Gegenstück `src/engine/saveStore.ts` `DesktopApi`) |
| `saves.cjs` | Spielstände als Dateien (gzip, atomar, Sicherung) |
| `offline-fonts.cjs` | ersetzt nach dem Spiel-Build die Google-Fonts-Verweise in `dist` durch beigelegte Schriften (Fontsource, OFL) |
| `sync-version.cjs` | übernimmt die Versionsnummer aus `../package.json` |
| `build/icon.png` | Programmsymbol (Platzhalter aus dem Logo – vor Steam ersetzen) |

## Bauen
```
npm ci                 # im Hauptordner (einmalig)
cd desktop && npm ci   # Electron + electron-builder (einmalig)
npm start              # Spiel bauen und unverpackt starten (mit Entwickler-Menü)
npm run dist:win       # Windows: Installer (NSIS) + portable .exe + ZIP   → release/
npm run dist:linux     # Linux: AppImage (+ release/linux-unpacked)         → release/
npm run dist:dir       # nur release/linux-unpacked (schnell, für den Test)
npm run dist:win:zip   # Windows-ZIP – geht auch unter Linux ohne Wine
```
- Der NSIS-Installer und die portable .exe brauchen Windows (oder funktionierendes Wine). Unter Linux ohne Wine
  entsteht nur das ZIP (entpacken, `1975 A Football Manager.exe` starten).
- Steht `GH_TOKEN`/`GITHUB_TOKEN` in der Umgebung, hält electron-builder das für einen Veröffentlichungs-Lauf und
  bricht ohne Git-Repository mit „reading 'channel'“ ab → `env -u GH_TOKEN -u GITHUB_TOKEN npm run dist:linux`.
- GitHub Actions: `.github/workflows/desktop.yml` baut von Hand (Actions → Desktop-Build → Run workflow) oder bei
  einem Tag `v*` auf Windows und Linux, lässt den Desktop-Test laufen und lädt die Dateien als Artefakte hoch.
- Nichts aus `release/` oder `node_modules/` wird eingecheckt.

## Testen
`npm run test:desktop` (im Hauptordner):
1. Dateiablage ohne Electron (gzip, atomar, Sicherung, beschädigte Datei, Liste, ungültige Namen) – läuft immer.
2. App (nur wenn `release/linux-unpacked` bzw. `release/win-unpacked` oder Electron + `dist` vorhanden, sonst
   übersprungen; unter Linux ohne Bildschirm automatisch über `xvfb-run`): Start über `app://`, Version im
   Hauptmenü/Fenstertitel, Schriften, F11/Alt+Enter, 1280×800, neues Spiel, Zeitlauf, Speichern, Beenden,
   Neustart mit Umzug alter Stände, Laden, Weiterspielen – ohne Konsolenfehler und ohne Anfrage nach außen.
   `APP=<datei>` testet einen anderen Build (AppImage ohne FUSE: zusätzlich `APPIMAGE_EXTRACT_AND_RUN=1`).

## Wo liegen die Spielstände?
Benutzerordner der App → Unterordner `saves` (im Hauptmenü unten links „Spielstand-Ordner öffnen“):
- Windows `%APPDATA%\1975 A Football Manager\saves`
- Linux/Steam Deck `~/.config/1975 A Football Manager/saves`

| Datei | Inhalt |
|---|---|
| `<slot>.fm1975save` | Spielstand, gzip-komprimiertes JSON `{ meta, game }` (≈ 1/5 der JSON-Größe) |
| `<slot>.fm1975save.bak` | vorherige Fassung; wird automatisch geladen, wenn die Hauptdatei beschädigt ist |
| `<slot>.meta.json` | Metadaten für die Liste; fehlt sie, wird sie aus dem Stand neu erzeugt |

Geschrieben wird im Hauptprozess: erst `.tmp` vollständig (fsync), alte Datei nach `.bak`, dann umbenennen – ein
Absturz mitten im Speichern zerstört keinen Stand. Komprimieren läuft im Thread-Pool von Node, die Oberfläche
wartet nicht darauf (nur `JSON.stringify` läuft noch im Fenster). Einstellungen (localStorage) sowie Datensätze und
eigene Wappen (IndexedDB) liegen weiter im selben Benutzerordner. Stände, die eine frühere Desktop-Fassung in
IndexedDB/localStorage abgelegt hat, zieht `initSaveStore` beim ersten Start in Dateien um (Quelle wird erst nach
erfolgreichem Schreiben gelöscht). Die Browser-Fassung bleibt bei IndexedDB.
Zum Weitergeben reicht die `.fm1975save`-Datei: in den Ordner eines anderen Rechners legen, Spiel neu starten.

## Fenster
- F11 oder Alt+Enter: Vollbild ↔ Fenster. Die Einstellung „Anzeige-Modus“ im Spiel setzt den Zustand beim Start.
- Mindestgröße 1280 × 720, Start 1600 × 900; auf kleineren Bildschirmen (Steam Deck 1280 × 800) maximiert.
- Release ohne Menüband; `npm start` zeigt ein Entwickler-Menü (Alt).
- Schließen im laufenden Spiel fragt nach („Nicht gespeicherter Fortschritt geht verloren“) – auch nach dem
  Speichern, die Hülle weiß nicht, ob seitdem etwas geändert wurde.

## Patch-Ablauf
1. Version in `../package.json` erhöhen (einzige Quelle), Eintrag in `../CHANGELOG.md`.
2. `npm run check`, `npm run test:savecompat` (alte Stände müssen laden), `npm run test:saves`.
3. `cd desktop && npm run sync` (übernimmt die Version; machen die `dist:*`-Befehle auch selbst), einchecken.
4. Tag `vX.Y.Z` setzen und pushen → Workflow baut und testet beide Plattformen (prüft Tag = Version).
5. Artefakte verteilen (später: Steam-Depots hochladen, Steam liefert nur die geänderten Dateien aus).
Spielstände liegen außerhalb des Programmordners und bleiben bei Updates und Neuinstallation erhalten
(Installer: `deleteAppDataOnUninstall: false`).

## Nächste Schritte für Steam
- **Steamworks**: App-ID anlegen, `steamworks.js` im Hauptprozess (`main.cjs`) einbinden – Start über Steam,
  Erfolge, Overlay (für das Overlay in Electron `--in-process-gpu`/`disable-direct-composition` prüfen).
- **Depots**: je eines für Windows (`release/win-unpacked`) und Linux (`release/linux-unpacked`); hochladen mit
  `steamcmd` + `app_build.vdf`, am besten als weiterer Schritt im Workflow. Für Steam die entpackten Ordner nehmen,
  nicht Installer/AppImage.
- **Steam Cloud** (Auto-Cloud, ohne Code): Pfad `saves/` im Benutzerordner, Muster `*.fm1975save` (optional
  `*.meta.json`; `.bak`/`.tmp` nicht) – Windows-Wurzel `WinAppDataRoaming`, Linux `LinuxXdgConfigHome`,
  Unterordner `1975 A Football Manager/saves`. Ein Stand nach 60 Jahren ≈ 5 MB komprimiert → Kontingent z. B.
  1 GB / 200 Dateien.
- **Steam Deck**: läuft mit dem Linux-Build bei 1280 × 800 (Test). Offen: Bedienung per Controller/Trackpad,
  Bildschirmtastatur für Namensfelder, „Deck Verified“-Prüfliste.
- Programmsymbol ersetzen (`build/icon.png` ≥ 512 px, für Windows zusätzlich `build/icon.ico`), Windows-Signatur
  (sonst SmartScreen-Warnung beim Installer außerhalb von Steam).
- Rechte: Bilder (Wappen, Hintergründe, Gesichter) frei verwendbar, keine echten Namen (siehe CLAUDE.md).
- Speichern großer Stände: `JSON.stringify` in einen Worker verlegen, falls es bei 50+ Jahren spürbar hakt
  (Messwerte `docs/research/leistung.md`).

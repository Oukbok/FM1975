# Ordner-Umbenennung Deutsch → Englisch (2026-11-21)

Wunsch Pascal: alle Ordner englisch benennen, damit das Spiel übersetzbar und für Modder leicht zugänglich ist
(Regel in `CLAUDE.md`: Ordner und Dateinamen auf Englisch). Umbenannt wurden **nur Pfade** – Inhalt und
Verhalten des Spiels sind unverändert. Umbenennung mit `git mv` (Geschichte bleibt: `git log --follow <datei>`).

## Seiten (`src/views/`)

| alt | neu | Menü im Spiel |
|---|---|---|
| `src/views/zentrale/` | `src/views/office/` | Zentrale |
| `src/views/zentrale/presse/` | `src/views/office/press/` | Zentrale › Presse |
| `src/views/spieltag/` | `src/views/matchday/` | Aufstellung (Gegner, Spielplan, Spielbericht) |
| `src/views/spieltag/gegner/` | `src/views/matchday/opponent/` | Aufstellung › Gegner |
| `src/views/kader/` | `src/views/squad/` | Kader |
| `src/views/kader/kabine/` | `src/views/squad/dressingRoom/` | Kader › Kabine |
| `src/views/jugend/` | `src/views/youth/` | Jugend |
| `src/views/finanzen/` | `src/views/finance/` | Finanzen |
| `src/views/verein/` | `src/views/club/` | Verein |
| `src/views/statistiken/` | `src/views/stats/` | Statistiken |
| `src/views/privat/` | `src/views/private/` | Privat |

Alle übrigen Unterordner (z. B. `squad/camp`, `club/stadium`, `stats/awards`) waren schon englisch und heißen
gleich; sie wandern nur mit ihrem Elternordner.

## Bilder (`bilder/` → `images/`, im Spiel weiter `assets/…`)

| alt | neu | im Spiel (URL) |
|---|---|---|
| `bilder/` | `images/` | `assets/` (Build kopiert `images/` → `dist/assets/`) |
| `bilder/akte/` | `images/dossier/` | `assets/dossier/…` |
| `bilder/akte/bilanz/` | `images/dossier/balance/` | `assets/dossier/balance/…` |
| `bilder/presse/` | `images/press/` | `assets/press/<epoche>/…` |
| `bilder/briefing/neu/` (Bild-Slot, noch leer) | `images/briefing/new/` | `assets/briefing/new/<art>.webp` |
| `bilder/faces/mitteleuropa/` | `images/faces/central-europe/` | |
| `bilder/faces/nordeuropa/` | `images/faces/northern-europe/` | |
| `bilder/faces/suedeuropa/` | `images/faces/southern-europe/` | |
| `bilder/faces/osteuropa/` | `images/faces/eastern-europe/` | |
| `bilder/faces/balkan/` | `images/faces/balkans/` | |
| `bilder/faces/tuerkei/` | `images/faces/turkey/` | |
| `bilder/faces/westafrika/` | `images/faces/west-africa/` | |
| `bilder/faces/lateinamerika/` | `images/faces/latin-america/` | |
| `bilder/faces/ostasien/` | `images/faces/east-asia/` | |
| `bilder/faces/nordafrika/` | `images/faces/north-africa/` | |

Unverändert (schon englisch): `crests`, `icons`, `sound`, `tickets`, `trophies`, `faces/staff` sowie die
Bild-Slots `briefing`, `camp`, `indoor`, `merch`, `promises`, `sponsor/logos`.

**Gesichtsgruppen:** Die Gruppen-IDs (`mitteleuropa`, `tuerkei` …) stehen in Spielständen (`Player.face`), in
Datensätzen, im Register `src/data/faceImages.ts` und in der Sichtungsliste `docs/images/faces-reviewed.txt`.
Sie bleiben **unverändert** – so bricht kein Spielstand und kein Datensatz. Nur die Ordner auf der Platte heißen
englisch; die Zuordnung ID → Ordner steht an **einer** Stelle, `src/data/faceDirs.json`, und wird vom Spiel
(`data/faceGroups.ts` `faceDir` → `components/faces/faceLookup.ts`), von `scripts/faces-register.mjs`,
`scripts/faces-sheet.py` und `scripts/faces-import.py` gelesen. Neue Gruppe = Eintrag in `faceDirs.json` +
Ordner anlegen.

## Dokumentation

| alt | neu |
|---|---|
| `docs/recherche/` | `docs/research/` |
| `docs/bilder/` | `docs/images/` |

## Spielstände

Die Vorlagen in `public/saves/` und die eingefrorenen Stände in `tests/fixtures/saves/` wurden entpackt und nach
Pfaden durchsucht (`bilder/`, `assets/`, `.webp`/`.png`/`.jpg`, `faces/`, `views/`): keine Treffer – Spielstände
speichern keine Datei- oder Ordnerpfade (nur IDs wie `mitteleuropa` oder Ereignis-Typen wie `kabine_predigt`, die
bleiben). Eine Migration ist deshalb nicht nötig.

## Dateinamen

Die deutschen Dateinamen (z. B. `images/stadion-hintergrund.jpg`, `src/styles/31-akte.css`,
`src/views/matchday/GegnerView.tsx`, Berichte in `docs/research/`) sind im zweiten Schritt umbenannt worden –
Tabelle alt → neu und Ausnahmen in `docs/research/file-renames.md`.

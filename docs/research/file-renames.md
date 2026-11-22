# Datei-Umbenennung Deutsch → Englisch (2026-11-22)

Wunsch Pascal: „Benenne auch die kleineren Dateinamen um.“ Nach den Ordnern (`docs/research/folder-renames.md`)
heißen jetzt auch die Dateien englisch (Regel in `CLAUDE.md`: Ordner und Dateinamen auf Englisch). Umbenannt
wurden **nur Dateinamen** – Inhalt und Verhalten des Spiels sind unverändert, IDs und Schlüssel in Code,
Datensätzen und Spielständen bleiben (Screen-IDs wie `cat-spieltag`, `ruhmeshalle`, `presse`, Icon-Namen,
Pressemotive, Gesichtsgruppen). Umbenennung mit `git mv` (Geschichte: `git log --follow <datei>`), Verweise
per Skript angepasst. Gleiche Konvention wie die vorhandenen englischen Dateien: PascalCase für Komponenten,
Präfixnummern bei CSS bleiben (Reihenfolge der Kaskade in `src/styles/index.ts` unverändert), kebab-case für
Bilder, Tests und Berichte.

Insgesamt **180 Dateien**: Quellcode 11, CSS 5, Bilder 89 (67 Pressefotos), Tests 6, Doku 69.

## Quellcode (Seiten)

Die exportierte Komponente heißt jetzt wie die Datei (nur intern, nirgends gespeichert); die Screen-IDs bleiben.

| alt | neu | Komponente |
|---|---|---|
| `src/views/club/ErfolgeView.tsx` | `src/views/club/AchievementsView.tsx` | `ErfolgeView` → `AchievementsView` |
| `src/views/matchday/GegnerView.tsx` | `src/views/matchday/OpponentView.tsx` | `GegnerView` → `OpponentView` |
| `src/views/office/PresseView.tsx` | `src/views/office/PressView.tsx` | `PresseView` → `PressView` |
| `src/views/office/career/BilanzTab.tsx` | `src/views/office/career/BalanceTab.tsx` | `BilanzTab` → `BalanceTab` |
| `src/views/private/FamilieView.tsx` | `src/views/private/FamilyView.tsx` | `FamilieView` → `FamilyView` |
| `src/views/private/FreizeitView.tsx` | `src/views/private/LeisureView.tsx` | `FreizeitView` → `LeisureView` |
| `src/views/private/PrivatView.tsx` | `src/views/private/PrivateView.tsx` | `PrivatView` → `PrivateView` |
| `src/views/private/VermoegenView.tsx` | `src/views/private/WealthView.tsx` | `VermoegenView` → `WealthView` |
| `src/views/squad/VertraegeView.tsx` | `src/views/squad/ContractsView.tsx` | `VertraegeView` → `ContractsView` |
| `src/views/transfers/pool/SpielerpoolView.tsx` | `src/views/transfers/pool/PlayerPoolView.tsx` | `SpielerpoolView` → `PlayerPoolView` |
| `src/views/youth/JugendDashboard.tsx` | `src/views/youth/YouthDashboard.tsx` | `JugendDashboard` → `YouthDashboard` |

## CSS (`src/styles/`)

| alt | neu |
|---|---|
| `src/styles/28-kabine.css` | `src/styles/28-dressing-room.css` |
| `src/styles/28-presse.css` | `src/styles/28-press.css` |
| `src/styles/28-privat.css` | `src/styles/28-private.css` |
| `src/styles/28-verhandlung.css` | `src/styles/28-negotiation.css` |
| `src/styles/31-akte.css` | `src/styles/31-dossier.css` |

Die Reihenfolge der Imports in `src/styles/index.ts` (= Kaskade, von `scripts/compact-fonts.mjs` gelesen) ist
unverändert; nur die Namen tauschen. `34-compact-fonts.css` ändert sich nur in den Kommentarzeilen der Dateinamen.

## Bilder (`images/`, im Spiel `assets/…`)

| alt | neu |
|---|---|
| `images/dossier/balance/klebestreifen.webp` | `images/dossier/balance/tape.webp` |
| `images/dossier/balance/zettel-abriss.webp` | `images/dossier/balance/note-torn.webp` |
| `images/dossier/balance/zettel-blatt.webp` | `images/dossier/balance/note-lined.webp` |
| `images/dossier/balance/zettel-gelb.webp` | `images/dossier/balance/note-yellow.webp` |
| `images/dossier/balance/zettel-klein.webp` | `images/dossier/balance/note-small.webp` |
| `images/dossier/balance/zettel-orange.webp` | `images/dossier/balance/note-orange.webp` |
| `images/dossier/balance/zettel-zeitung.webp` | `images/dossier/balance/note-newspaper.webp` |
| `images/dossier/bilanz.webp` | `images/dossier/balance-binder.webp` |
| `images/dossier/blatt.webp` | `images/dossier/sheet.webp` |
| `images/dossier/kalender.webp` | `images/dossier/calendar.webp` |
| `images/dossier/mappe.webp` | `images/dossier/folder.webp` |
| `images/dossier/papier.webp` | `images/dossier/paper.webp` |
| `images/dossier/zeitung.webp` | `images/dossier/newspaper.webp` |
| `images/icons/kalender.svg` | `images/icons/calendar.svg` |
| `images/icons/presse.svg` | `images/icons/press.svg` |
| `images/icons/zentrale.svg` | `images/icons/office.svg` |
| `images/stadion-hintergrund.jpg` | `images/stadium-background.jpg` |
| `images/stadion-zuschauer.jpg` | `images/stadium-crowd.jpg` |
| `images/start-tribuene.jpg` | `images/start-grandstand.jpg` |
| `images/trikot-basis.png` | `images/shirt-base.png` |
| `images/zentrale-hintergrund.png` | `images/office-background.png` |
| `images/tickets/rasen.jpg` | `images/tickets/grass.jpg` |

**Pressefotos** `images/press/1975/` – die Motiv-IDs (`torjubel`, `verletzung` …) bleiben, sie stehen auch in
Datensätzen (Pose eigener Spielerfotos). Den Dateinamen je Motiv liefert `PRESS_FILES` in `src/data/pressPhotos.ts`;
die Wahl des Fotos je Nachricht (Hash) ist unverändert. Fassungen `_01` … `_10` gehen mit:

| Motiv-ID | alt | neu | Dateien |
|---|---|---|---|
| `abpfiff` | `abpfiff[_NN].webp` | `final-whistle[_NN].webp` | 11 |
| `auslosung` | `auslosung[_NN].webp` | `draw[_NN].webp` | 1 |
| `kopfball` | `kopfball[_NN].webp` | `header[_NN].webp` | 4 |
| `stadion` | `stadion[_NN].webp` | `stadium[_NN].webp` | 1 |
| `torjubel` | `torjubel[_NN].webp` | `goal-celebration[_NN].webp` | 7 |
| `torschuss` | `torschuss[_NN].webp` | `shot[_NN].webp` | 11 |
| `torwart` | `torwart[_NN].webp` | `goalkeeper[_NN].webp` | 8 |
| `verletzung` | `verletzung[_NN].webp` | `injury[_NN].webp` | 11 |
| `vertrag` | `vertrag[_NN].webp` | `contract[_NN].webp` | 1 |
| `vorstand` | `vorstand[_NN].webp` | `board[_NN].webp` | 11 |
| `zweikampf` | `zweikampf[_NN].webp` | `duel[_NN].webp` | 1 |

Unverändert (schon englisch): `fans`, `training`.

**Icons:** `images/icons/calendar.svg`, `press.svg`, `office.svg` heißen jetzt englisch; die Icon-Namen im Code
(`kalender`, `presse`, `zentrale` in `components/iconPaths.ts`) bleiben als Schlüssel.

**Bild-Slots ohne Datei** (feste Namen im Code, nur die erwartete Datei heißt neu): Trikotmaske der Gesichter
`<nr>-<alter>-maske.webp` → `<nr>-<alter>-mask.webp` (`faceLookup.ts`, `scripts/faces-register.mjs`,
`scripts/faces-sheet.py`), `indoor/halle-<epoche>.webp` → `indoor/hall-<epoche>.webp`,
`promises/erstes-training.webp` → `promises/first-training.webp`, `spielplan/fans-<jahrzehnt>.webp` →
`fixtures/fans-<jahrzehnt>.webp` (nur Hinweis in `data/fixtureImages.ts`). Prompts in `docs/images/IMAGES.md`.

## Tests

| alt | neu |
|---|---|
| `tests/kabine-shots.mjs` | `tests/dressing-room-shots.mjs` |
| `tests/presse-shots.mjs` | `tests/press-shots.mjs` |
| `tests/chronik-wiki-shots.mjs` | `tests/chronicle-wiki-shots.mjs` |
| `tests/winterhalle-shots.mjs` | `tests/winter-indoor-shots.mjs` |
| `tests/ligsys-shots.mjs` | `tests/league-system-shots.mjs` |
| `tests/regio-checks.ts` | `tests/regional-league-checks.ts` |

Die Standard-Ausgabeordner unter `test-output/` (nicht im Repo) heißen wie bisher.

## Dokumentation

| alt | neu |
|---|---|
| `docs/ideen-spaetere-updates.md` | `docs/future-update-ideas.md` |
| `docs/pruefliste.md` | `docs/checklist.md` |
| `docs/images/BILDER.md` | `docs/images/IMAGES.md` |
| `docs/images/faces-gesichtet.txt` | `docs/images/faces-reviewed.txt` |
| `docs/research/FINANZEN_Recherche_1975.md` | `docs/research/finances-research-1975.md` |
| `docs/research/FINANZEN_Recherche_Entwicklung_1980_heute.md` | `docs/research/finances-research-1980-today.md` |
| `docs/research/ablösefrei.md` | `docs/research/free-transfers.md` |
| `docs/research/audit-bericht.md` | `docs/research/audit-report.md` |
| `docs/research/ethnie.md` | `docs/research/ethnicity.md` |
| `docs/research/fussball_historie_designdaten_1975_2030.md` | `docs/research/football-history-design-data-1975-2030.md` |
| `docs/research/kontinente.md` | `docs/research/continents.md` |
| `docs/research/legenden.md` | `docs/research/legends.md` |
| `docs/research/leistung.md` | `docs/research/performance.md` |
| `docs/research/ligastruktur-ausland.md` | `docs/research/foreign-league-structure.md` |
| `docs/research/namen-zaehlung-vorher.txt` | `docs/research/names-count-before.txt` |
| `docs/research/namen-ziel.md` | `docs/research/names-target.md` |
| `docs/research/namen.md` | `docs/research/names.md` |
| `docs/research/neutrale-namen.md` | `docs/research/neutral-names.md` |
| `docs/research/privatleben.md` | `docs/research/private-life.md` |
| `docs/research/spielerkurven.md` | `docs/research/player-curves.md` |
| `docs/research/spielstand-kompatibilitaet.md` | `docs/research/save-compatibility.md` |
| `docs/research/testlauf.md` | `docs/research/test-run.md` |
| `docs/research/transferrekorde.md` | `docs/research/transfer-records.md` |
| `docs/research/waehrungen.md` | `docs/research/currencies.md` |
| `docs/research/weltrangliste.md` | `docs/research/world-ranking.md` |
| `docs/research/zweite-mannschaften.md` | `docs/research/reserve-teams.md` |
| `docs/specs/BILANZ_BEISPIELE_1975.md` | `docs/specs/BALANCE_EXAMPLES_1975.md` |
| `docs/specs/FINANZEN_SPEC.md` | `docs/specs/FINANCES_SPEC.md` |
| `docs/specs/WELTDATEN_SPEC.md` | `docs/specs/WORLD_DATA_SPEC.md` |

Recherche je Land: `docs/research/weltvereine_<cc>.md` → `docs/research/world-clubs-<cc>.md` ({len(welt)} Dateien,
`alb` … `yug`).

## Ausnahmen (bleiben deutsch)

| Dateien | Grund |
|---|---|
| `public/saves/*.txt` + `index.json` (`frankreich-2000`, `test-3-jahre`, `regionalliga-1995` …) | Vorlagen-Namen stehen als Daten in `index.json`, in den eingefrorenen Ständen `tests/fixtures/saves/` (`<vorlage>_<datum>_<commit>.txt`, `source`) und in vielen Tests/Skripten (`SAVE=public/saves/…`); Kompatibilität der Fixtures geht vor. |
| `tests/fixtures/saves/*.txt` | eingefrorene Stände, nie umbenennen/überschreiben (Name = Vorlage + Datum + Commit). |
| `images/crests/<id>.png` (z. B. `ddr-berlin-ost.png`) | Dateiname = Vereins-ID aus Spielstand und Datensatz. |
| `src/data/ddr.ts`, `src/game/ddrHome.ts`, `src/game/ddrReserves.ts`, `tests/ddr-shots.mjs`, `tests/ddrhome-test.ts` | „DDR“ ist hier Eigenname und Liga-ID (`ddr`) in Spielständen, Befehl `npm run test:ddrhome`; die Weltdaten nutzen schon `gdr`. |
| Bild-Slots mit ID im Namen (`briefing/<jahr>-<titel-slug>`, `camp/<ziel-id>`, `merch/<artikel>`, `trophies/<form>`) | Name kommt aus IDs/Titeln der Daten. |
| Screenshots unter `test-output/` | erzeugt, nicht im Repo. |

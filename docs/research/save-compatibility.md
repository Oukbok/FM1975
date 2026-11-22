# Spielstand-Kompatibilität (Steam: Spielstände über Patches hinweg)

Nachtauftrag 21.11.2026, Branch `night/savecompat`. Ziel: Spieler sollen ihre Spielstände über jedes Update hinweg behalten. Dafür gibt es jetzt einen eingefrorenen Testsatz alter Spielstände und einen Test, der jeden davon lädt, weiterspielt und wieder speichert.

## 1. Eingefrorener Testsatz `tests/fixtures/saves/`

Die Dateien sind byte-gleiche Kopien (Format `LZ1:` + lz-string, wie die Vorlagen). Der Name enthält Speicherdatum und Commit (`<vorlage>_<datum>_<commit>.txt`). So ersetzt eine neu erzeugte Vorlage in `public/saves/` nie einen alten Stand. Die Liste mit Herkunft und Begründung steht in `index.json`.

| Datei | Quelle | Saison | Warum |
|---|---|---|---|
| `test-10-jahre_2026-11-10_8b8bbb5.txt` | Historie, gespeichert 10.11. | 1985/86 | ältester Stand der Historie: noch ohne `ids`, `national`, `registration`, `private`, `reserve`, `superCup`; IDs noch nach Uhrzeit |
| `test-3-jahre_2026-11-15_8b8bbb5.txt` | Historie, erste Fassung im Repo | 1978/79 | vor `ids`/`extraAwards`/`clubTransfers`/`shirtsV`, 2-Punkte-Regel |
| `italien-1985_2026-11-18_9bf5963.txt` | Historie, erste Liga-Vorlagen | 1985/86 | Heimatland Italien, vor den Ligareformen und zweiten Ligen im Ausland und vor dem Ethnie-Abgleich |
| `regionalliga-2004_2026-11-18_0000527.txt` | Historie | 2004/05 | Regionalliga vor der Neubesetzung der Staffeln nach Region, ohne `amateurLeagues`/`continents`/`faceNameV` |
| `ddr-1980_2026-11-20_ead6e41.txt` | aktuelle Vorlage | 1980/81 | Start in der DDR |
| `england3-1995_2026-11-20_ead6e41.txt` | aktuelle Vorlage | 1995/96 | Heimatland England, 3. Ebene |
| `liga1-2025_2026-11-20_ead6e41.txt` | aktuelle Vorlage | 2025/26 | späteste Epoche |

**Größe 22,3 MB** (Ziel unter ~25 MB). Ganz `public/saves/` umfasst 94 MB mit 21 Dateien. Die Frankfurt-Reihe „Test 10–60 Jahre“ ist allein 4–11 MB je Datei groß. Deshalb habe ich ausgewählt:
- vier Formate aus der Historie, in der jeweils frühesten Fassung,
- drei aktuelle Vorlagen, die Sonderwege abdecken: DDR, Ausland mit unterer Ebene, späteste Epoche.

Zusammen decken sie die Jahre 1978, 1980, 1985, 1995, 2004 und 2025 ab, dazu die Heimatländer Deutschland, DDR, Italien und England.

**Grenze der Historie:** Die Git-Historie beginnt erst am 15.11.2026. Davor wurde das Repo zusammengefasst. „Stände von vor Wochen“ gibt es deshalb nicht. Der älteste erreichbare Stand ist `test-10-jahre` @ 8b8bbb5, gespeichert am 10.11.2026 und damit älter als das Repo. Er unterscheidet sich am stärksten vom heutigen Format: 61 statt 67–74 Felder im Spielstand.

## 2. Test `npm run test:savecompat` (`tests/savecompat-test.ts`)

Die Umgebung ist dieselbe wie in `test:season`: localStorage-Ersatz, feste Uhr, fester Zufall, `simAutoManage`, Vorschau-Pause → „Schnell simulieren“. Für jeden Stand aus `index.json` läuft:
1. **Laden** wie in App.tsx (`prepareLoadedGame`).
2. **Invarianten** prüfen:
   - keine NaN/Infinity in Kontoständen, Ansehen, Sim-Stärken, Stärke und Attributen,
   - jeder Spieler höchstens in einem Kader und `clubId` passt zum Kader,
   - kein Spieler zugleich Profi und Jugend, kein Profi außerhalb jedes Kaders,
   - eindeutige Nachrichten- und Spiel-IDs,
   - jeder Verein der Spielerliga mit mindestens 16 Spielern und Torwart,
   - Spielerliga mit Spielplan, eigener Verein in Spielplan und Tabelle, Tabelle = Vereine des Spielplans,
   - Vereine der Sim-Divisionen vorhanden,
   - keine Aufstellungs-Verweise auf Spieler außerhalb des Kaders (Startelf, Bank, Slot-Zuordnung, Positionen, Kapitän, Schützen, Reihenfolgen, Kabinen-Kapitän).
3. **14 Tage `processDay`** ohne Ausnahme. Das Datum muss wirklich 14 Tage weiterlaufen, damit eine Endlosschleife auffällt.
4. **Speichern → Laden** über `saveGameSync`/`loadGameSync`:
   - Der Fingerabdruck (sha1 des JSON) des geladenen Standes muss gleich dem laufenden Stand mit denselben Nachrüstungen sein.
   - Laden darf am laufenden Spiel nichts Spielrelevantes ändern. Die erlaubten Ausnahmen sind dieselben wie in `test:season`, dazu das Aufräumen der Aufstellungs-Verweise.
   - Danach werden die Invarianten am geladenen Stand erneut geprüft.
5. Bei `fullSeason` (drei Stände: der älteste, Regionalliga 2004, DDR 1980):
   - weiter bis zum Saisonende, dann `startNextSeason`,
   - 3 Tage in die neue Saison,
   - danach erneut Rundlauf und Invarianten.

Rechenzeit: ≈ 80 s, ein Kern. Optionen: `ONLY=<teil des dateinamens>`, `FULL=0`, `DAYS=…`.

## 3. Gefundene Fehler und Behebung

| # | Fund | Ursache | Behebung |
|---|---|---|---|
| 1 | Verwaiste Aufstellungs-Verweise in 5 von 7 Ständen, z. B. ein abgewanderter Spieler noch als Kapitän (DDR 1980), auf der Bank (Frankfurt) oder in `assignedPositions` (Wolfsburg, Mailand). In den ältesten Ständen hatte die Startelf fast aller Pokal-Amateure Spieler, die nicht mehr im Kader stehen. | Wechsel, Leihen, Karriereende und eine frühere Kaderbereinigung nehmen Spieler aus `playerIds`, lassen die Taktik aber stehen. | Neue Migration `game/tacticsRefsMigration.ts` `migrateTacticsRefs`, als letzter Schritt von `prepareLoadedGame`. **Ergebnisneutral:** `resolveLineup` und `firstXi` der Engine nehmen ohnehin nur Kaderspieler; `lineupMap` bleibt als Objekt erhalten. |
| 2 | **Endlosschleife** im DDR-Stand: Europapokal-Viertelfinale gegen einen *simulierten* Bundesligisten (`s_vfb`). Der Tag wartet auf das eigene Spiel, „Simulieren“ kann es nicht aufbauen (`ensureClubs` → kein voller Verein) – das Spiel bleibt am 4.3.1981 stehen. Das passiert auch ohne Laden, also auch in der Oberfläche. | `findOwnMatchDue` meldete Spiele, deren Gegner sich nicht als voller Verein bauen lässt. Der Spieltag selbst (`euroFlow.ts` `playOne`) hat dafür schon den Hintergrund-Weg `lightMatch`. | `findOwnMatchDue` meldet nur Spiele, bei denen `canBuildClubs` erfüllt ist: Verein vorhanden, anderer Kontinent oder Auslands-Europapokalverein. Sonst entscheidet der Spieltag das Spiel wie vorgesehen im Hintergrund, und die Nachricht zum Spiel kommt wie gewohnt. Wiki „Start in der DDR“ ergänzt. Der Fall kann auch beim Start in einer unteren Liga auftreten. |
| 3 | Nach dem Saisonwechsel und erneutem Laden bekamen neue Vereine (Aufsteiger, zweite Mannschaften, Pokal-Amateure `amr-…`) sofort eine Eingespieltheit. Ohne Speichern bekommen sie sie erst am nächsten Montag. Folge: Der geladene Stand spielte anders weiter. | `migrateCohesion` rüstete beim Laden jeden Verein ohne Eingespieltheit nach. | `migrateCohesion` rüstet nur noch nach, wenn der Spielstand die Eingespieltheit überhaupt nicht kennt (Altstand) – oder beim neuen Spiel. |
| 4 | Nach dem Nachwuchs-Jahrgang am 1. Juli: Der Marktwert eines Ausnahmetalents in der Jugend (z. B. 1 123 600 statt 35 000) sank erst beim Laden. | `makeLegendYouth` setzte `overall² × 400` ungedeckelt. Für alle anderen Jugendspieler gilt der Deckel aus `generateYouthPlayer` bzw. `migrateYouthContracts`, also halber Basis-Marktwert. | Der gleiche Deckel gilt jetzt auch in `game/legendFactory.ts`. Das ist keine neue Regel: Erzeuger und Migration rechnen jetzt gleich. |

Alle Vorlagen ließen sich laden und liefen ohne Ausnahme weiter. Der Rundlauf Speichern → Laden war in jedem Stand verlustfrei. Die Fehler 1, 3 und 4 betrafen nur die Gleichheit „geladen = nie gespeichert“ bzw. die Anzeige, Fehler 2 die Spielbarkeit.

Nicht geändert: `src/engine/match/*` sowie Rechenregeln und Balance. Die Taktik-Bereinigung ist ergebnisneutral, Fehler 3 und 4 betreffen nur Unterschiede zwischen geladenem und laufendem Spiel. Eine Randnotiz zu 1: Bestand eine eigene Schützen-Reihenfolge nur noch aus Abgängen, fällt die Reihenfolge jetzt auf den Einzelschützen der Taktik zurück. Das ist derselbe Rückfall wie bei einer leeren Reihenfolge.

**Ablauf außerhalb des Ladens (nicht geändert, zur Entscheidung):** Im laufenden Spiel entstehen nach Wechseln weiter verwaiste Aufstellungs-Verweise, bis zum nächsten Laden. Die Engine ignoriert sie. In der Oberfläche könnte aber z. B. ein abgewanderter Spieler als Kapitän stehen. Sauber wäre ein Aufräumen in `transferPlayer` bzw. `repairSquadLists`.

**Offene Designfrage (DDR-Start):** Der Europapokal gegen einen BRD-Verein wird jetzt nach Stärke entschieden, statt zu hängen. Will man dieses Spiel selbst spielen, bräuchte der Bundesligist für die Dauer des Wettbewerbs einen vollen Kader. Dazu gehört ein Abbau beim Saisonwechsel wie bei Auslandsvereinen, ohne die Sim-Stärke zu verändern.

## 4. Regeln für künftige Formatänderungen

Siehe CLAUDE.md, Abschnitt „Spielstandformat ändern“. Kurz:
- Neue Felder nur optional.
- Jede Umstellung braucht eine idempotente `migrate…` in `prepareLoadedGame`.
- Erkannt wird am Feld bzw. an einer Markierung je Thema. `SAVE_VERSION` steuert nichts.
- Eine Migration darf nur das herstellen, was das Spiel ohne Speichern auch hätte.
- Nach einer Formatänderung eine neue Vorlage als neue Datei in den Testsatz aufnehmen.

Für den Steam-Release spricht nichts gegen das bisherige Verfahren „Feld erkennen statt Versionsnummer“. Es ist robuster, weil auch Stände aus Zwischenständen ohne passende Versionsnummer korrekt nachgerüstet werden.

Ein globales Versionsfeld wäre erst nötig, wenn eine Umstellung am Feld nicht erkennbar ist. Dann besser eine Markierung je Thema (wie `financeLevel`/`shirtsV`) statt einer Gesamtversion.

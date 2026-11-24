# Leistung & Speicher über lange Karrieren

Wunsch Pascal (Nachtauftrag, Ziel Steam-Release mit 50+ Jahren): Rechenzeit je Tag und Saisonwechsel, Größe des Spielstands, Ladezeit und schwere Seiten messen, die teuersten Stellen verbessern – **ohne ein einziges Spielergebnis zu verändern**.

## Messwerkzeuge

- `node scripts/run-ts.mjs tests/perf-bench.ts [saisons=60]` – spielt wie `tests/sim.ts` (Seed 1975, Mönchengladbach automatisch) und schreibt je Saison: Rechenzeit je Tag (Ø/p95/max), Saisonwechsel, CPU-Zeit des Prozesses, Heap (mit `node --expose-gc` nach voller GC), Teilschritte von `processDay`/`startNextSeason` aus einem V8-CPU-Profil (`DRILL=f,g` schlüsselt weitere Funktionen auf, `CALLERS=f` zeigt Aufrufer, `DUMPPROF=pfad` speichert Profile für die DevTools, `PROF=0` ohne Profil), Größe des Spielstands je Feld nach `SIZES=1,10,20,40,60` Jahren (JSON, gzip, lz-string wie die Vorlagen, dazu stringify/parse) und mit `FP=1` einen Fingerabdruck je Saison (Tabelle, Kontostand, Spielerzahl, Europapokalsieger).
- `npm run build && SAVE=… node tests/page-bench.mjs` – lädt einen Spielstand im Browser (Playwright) und öffnet jede Unterseite zweimal (kalt/warm), gemessen vom Klick bis zum ersten Bild ohne Platzhalter, dazu die längste Aufgabe. `DIST=…` anderer Build, `THROTTLE=4` gedrosselte CPU.
- `node tests/startup-bench.mjs` – Ladezeit bis Hauptmenü und bis zum laufenden Spiel (Vorlage „Test 3 Jahre“).

**Messbedingungen:** Rechner mit 2 Kernen, auf dem parallel andere Aufgaben liefen (Last 2–9). Wanduhr-Zeiten schwanken deshalb stark; verglichen wird vor allem die **CPU-Zeit** je Saison, gemessen mit altem und neuem Stand **gleichzeitig** (gleiche Last für beide). Vorher = Commit `bd1f36d` (main), nachher = Branch `night/perf`.

## Ergebnis Rechenzeit

Gleichzeitiger Lauf vorher/nachher, 25 Saisons ohne Profil (`PROF=0`):

| Kennzahl | vorher | nachher | Änderung |
|---|---|---|---|
| CPU je Saison (inkl. Saisonwechsel) | 6,87 s | 5,00 s | **−27 %** |
| Tag Ø (Wanduhr, unter Last) | 27,4 ms | 20,9 ms | −24 % |
| Tag p95 (Median der Saisons) | 108 ms | 72 ms | −33 % |
| langsamster Tag (Median der Saisons) | 650 ms | 361 ms | −44 % |
| Saisonwechsel (Median) | 1848 ms | 1006 ms | **−46 %** |
| Heap nach GC (Median) | 89 MB | 92 MB | +3 MB (Zwischenspeicher) |

CPU je Saison über 62 Saisons (gleichzeitiger Lauf mit Profil, ohne die fünf Saisons mit Größenmessung):

| Jahrzehnt | vorher | nachher | Änderung |
|---|---|---|---|
| 1970er | 8,87 s | 6,77 s | −24 % |
| 1980er | 7,88 s | 6,12 s | −22 % |
| 1990er | 9,28 s | 6,28 s | −32 % |
| 2000er | 9,48 s | 7,54 s | −20 % |
| 2010er | 8,68 s | 6,84 s | −21 % |
| 2020er | 8,82 s | 6,39 s | −28 % |
| 2030er | 8,76 s | 6,59 s | −25 % |
| gesamt (57 Saisons) | 8,83 s | 6,65 s | **−25 %** |

Die Rechenzeit wächst über die Jahrzehnte kaum (Spielerzahl bleibt bei ≈ 700–900 vollen Spielern, Weltpool ≈ 26 000); 60 Jahre laufen ohne UI in rund 6–7 Minuten CPU.

Teilschritte (ms je Saison, Mittel über 62 Saisons, Profil):

| Teilschritt | vorher | nachher | was geändert wurde |
|---|---|---|---|
| `processDayEvents` (Spieltage, Fenster, Bewertungen) | 3691 | 2976 | KI-Formationswahl, Europapokal-Hintergrundspiele |
| `nationalDaily` (Nationalteams, Weltrangliste) | 2574 | 1093 | Aufgebote ohne Vollsortierung |
| `ensureWorldPool` (montags) | 693 | 434 | nur prüfen statt neu aufbauen |
| `aiClubsDaily` (Saisonstart der KI) | 590 | 308 | KI-Formationswahl |
| `updateAges` | 446 | 359 | ohne Date-Objekte |
| `fixtureWatchDaily` | 426 | 421 | Termine je Verein einmal am Tag (Anteil klein) |
| `worldPoolSeason` (Saisonwechsel) | 793 | 384 | Überzählige einmal herausnehmen |
| Auslandsstatistik im Saisonwechsel (Bestenlisten + Die Besten + Goldener Schuh) | 973 | ≈ 635 | einmal je Liga, schnelleres Hashen |

Größter verbleibender Block ist die Match-Engine der eigenen Liga (`simulate` ≈ 1,0–1,1 s je Saison, `src/engine/match/` – bewusst nicht angefasst, anderer Branch).

## Ergebnis Spielstand

Größe nach N Jahren (Ende der Saison, alles im Spielstand; IndexedDB speichert das JSON **unkomprimiert**):

| nach | JSON vorher | JSON nachher | gzip vorher → nachher | lz-string (Vorlagen) vorher → nachher |
|---|---|---|---|---|
| 1 Jahr | 8,31 MB | 8,31 MB | 1,25 → 1,25 MB | 1,99 → 1,99 MB |
| 10 Jahre | 16,64 MB | 15,62 MB | 3,22 → 3,08 MB | 4,39 → 4,17 MB |
| 20 Jahre | 18,89 MB | 17,48 MB | 3,71 → 3,52 MB | 5,03 → 4,74 MB |
| 40 Jahre | 24,63 MB | 22,14 MB | 4,79 → 4,46 MB | 6,50 → 5,98 MB |
| 60 Jahre | 28,64 MB | **25,08 MB** (−12 %) | 5,53 → 5,10 MB | 7,53 → 6,82 MB |

Größte Felder nach 60 Jahren (KB JSON, vorher → nachher): `world` 5270 → 4460 (Welt-Historie 10 Saisons), `players` 4172, `leagueResults` 4039 → **1209**, `youthPlayers` 2565, `worldPool` 2412, `fixtures` 1821 (laufende Saison), `leagueArchive` 1302, `youthComps` 1229, `worldTransfers` 1132, `leagues` 1007, `clubs` 732, `clubTransfers` 574.

Geändert (verlustfrei, alte Spielstände werden beim Laden umgestellt):

- **Ergebnisse je Spieltag** (`game/leagueResults.ts`): je Liga und Saison Vereine und Termine einmal, je Spiel 12 Zeichen statt eines Tupels mit Datum und zwei IDs – ≈ 70 % kleiner (20-Jahre-Stand 1058 → 329 KB, alle 85 Ligen nachgeprüft gleich). Lesen nur über `resultsFor`, alte Tupel-Listen packt `migrateLeagueResults`.
- **Bestenlisten der Auslandsligen** (`WorldSeasonRecord.pstats`): Spieler einmal je Liga in einer Tabelle, Zeilen nur noch [Nummer, Wert]; die doppelte Torschützenliste `scorers` entfällt, wo Bestenlisten vorliegen (sie wird nur gelesen, wenn `pstats` fehlt). Welt-Historie 4303 → 3531 KB am 20-Jahre-Stand, 942 Wertungen nachgeprüft gleich (`migrateWorldStats`).

Wachsende Felder – alle großen Archive haben bereits eine Obergrenze: Welt-Historie (Details 10 Saisons, tiefe Ligen 3), Ergebnisse je Spieltag 40, Jugendwettbewerbe 50, Liga-Archiv 100, Vereins-Historie 200, Auszeichnungen/Goldener Ball 80, Spieler-Archiv 4000 Einträge, Transferprotokoll 8 Fenster, Weltwechsel ausgedünnt. **Ohne Obergrenze**, bewusst so gewünscht und klein: Transferarchiv je Verein `clubTransfers` (≈ 10 KB je Saison, „dauerhaftes Archiv“) und Platzierungen der Auslandsvereine `world.places` (≈ 6 KB je Saison, ein Zeichen je Saison und Verein). Nach 100 Jahren wären das zusammen ≈ 1,6 MB – keine Begrenzung nötig.

## Ladezeit und Seiten im Browser

- `startup-bench` (Vorlage „Test 3 Jahre“, je 2 × 3 Läufe abwechselnd): Hauptmenü ≈ 1,4–1,7 s, Spiel geladen ≈ 1,7–2,1 s vorher wie nachher (Schwankung durch Last größer als jeder Unterschied). Statisch geladenes JS beim Start unverändert 1913 KiB (gemessen über die Importe von `app.js`; der Wert „JS beim Start“ des Skripts schwankt mit dem Vorladen im Leerlauf).
- `page-bench` mit einem Spielstand nach 20 Jahren (Dezember 1994, `DUMP=… node scripts/sim.mjs 20`): Laden bis zur Spieloberfläche ≈ 1,9–2,3 s. Fast alle Seiten öffnen in unter 60 ms. Die schwersten (warm, mehrere Läufe, unter Last): Transfers › Spielerpool 250–460 ms (29 000 Spieler der Welt mit geschätzten Werten), Transfermarkt 140–300 ms, Beobachtung 125–220 ms, Jugend › Jugendwettbewerbe ≈ 110 ms, Verein › Stadion ≈ 100 ms (Zeichnung). Keine Seite hängt spürbar; der Alt-Spielstand wird im neuen Build ohne Fehler umgestellt.

## Bilder ohne Ladezeit (Wunsch Pascal: Zentrale/Newscenter, Steam-Fassung)

Messung `npm run build && node tests/image-load-probe.mjs` (`RUNS=3`, `CPU=4` gedrosselt, `DIST=…` anderer Build; frischer Browser-Kontext, lokaler Server wie die Desktop-Fassung). Gemessen wird je Bild-Frame, wann das letzte sichtbare Bild der Seite noch fehlte (img nicht geladen, Gesicht ohne `.loaded`, Wappen wechselt noch auf die zentrierte Fassung, CSS-Textur noch unterwegs) – „Verzögerung“ = Zeit vom Erscheinen der Seite bis zum endgültigen Bild. Spielstand Vorlage „Test 3 Jahre“, 1920×1080, Median aus 3 Läufen:

| Verzögerung nach Erscheinen | vorher | nachher | vorher 4× CPU | nachher 4× CPU |
|---|---|---|---|---|
| Zentrale nach „Laden“ | 741 ms | 0 ms | 1637 ms | 0 ms |
| Kader › Kader (25 Gesichter) | 191 ms | 0 ms | 394 ms | 0 ms |
| Zentrale erneut | 0 ms | 0 ms | 0 ms | 0 ms |
| Nachricht wechseln (Foto/Gesichter, 24 Nachrichten) | Median 18 / max 123 ms | 3 / 11 ms | 46 / 122 ms | 15 / 30 ms |

Ursachen vorher: Gesichter (Platzhalter bis `onLoad`, dann Einblenden), Wappen erst im Original und ~0,7 s später in der zentrierten Fassung (`ui/crestTrim.ts`), Pressefoto `loading="lazy"`. Die Zentrale erscheint nach „Laden“ unverändert schnell (ungedrosselt 1,8 → 1,7 s ab Klick); gedrosselt wartet das Laden höchstens `WARM_CAP_MS` = 600 ms länger, die Messwerte schwanken dort stark (Erscheinen 5,0–6,7 s je Lauf).

Was läuft:
- `ui/imagePreload.ts`: `preloadImage` = unsichtbares `<img>` + `decode()`. Akten-Texturen `UI_TEXTURES` (müssen den CSS-Adressen aus `31-dossier.css` exakt entsprechen, Prüfung `npm run test:images`) lädt das Hauptmenü im Leerlauf (`preloadUiTextures` aus App.tsx) und hält sie. Gesichter/Fotos liegen in einer begrenzten Liste (`LRU_MAX` 96) – nicht alle Hunderte Gesichter bleiben im Speicher; was herausfällt, darf der Browser verwerfen.
- `shell/warmImages.ts`: `warmGameImages` beim Laden/Starten eines Spiels, bevor die Zentrale erscheint (App.tsx, höchstens 600 ms): Texturen, zentrierte Wappen der eigenen Liga (`warmCrest`, ≈ 2,7 ms je Wappen), Gesichter des eigenen Kaders, Foto + Gesichter der ersten Nachricht. `warmSquadFaces` danach im Leerlauf (Kader + Jugend, höchstens 60).
- Newscenter: `readerPhoto`/`preloadReader` – beim Wählen einer Nachricht werden die Nachbarn (+1, −1, +2, +3) vorgeladen; Pressefoto ohne `lazy`, feste Seitenverhältnisse (`aspect-ratio`) gab es schon (kein Layoutsprung).
- `PlayerAvatar.preloadFace` dekodiert jetzt vor dem Markieren als fertig und lädt die Trikotmaske mit.
- Desktop (`desktop/main.cjs`): Spiel kommt weiter lokal über `app://`; Bilder und Stücke unter `assets/`/`chunks/` mit `Cache-Control: immutable` (nur Speicher-Cache der Sitzung, kein Festplatten-Cache für eigene Protokolle → nach einem Steam-Update keine alten Bilder). Web: `public/_headers` (Cloudflare) – `chunks/*` ein Jahr, `assets/*` einen Tag + `stale-while-revalidate` 30 Tage (Namen ohne Hash).
- Größe: Bilder, die das Spiel nicht mehr zeigt (früherer Büro-/Stadion-Hintergrund 3,5 + 0,4 MB, Zuschauerfoto 1,9 MB, Trikot 0,7 MB, `menu-bg-3.jpg`), bleiben in `images/`, werden aber nicht mehr nach `dist` kopiert (`NOT_SHIPPED` in `scripts/build.mjs`, tote CSS-Adressen entfernt): `dist/assets` 73 → 66 MB. Hauptmenü-Bild als WebP über `scripts/optimize-images.mjs` (Chromium aus Playwright, keine neue Abhängigkeit; 471 → 243 KB, Original bleibt, Vergleich 1:1 ohne sichtbaren Unterschied, mittlere Abweichung ≈ 2,4/255).
- Pro Lauf lädt die Probe jetzt 104 statt 50 Bilddateien (6,1 statt 3,2 MB, lokal) – das Vorladen holt Texturen, Kadergesichter und Nachbar-Nachrichten im Voraus.

Offen: Gesichter sind 512 × 600 und werden auch als 26-px-Miniatur in Listen voll dekodiert (≈ 1,2 MB Speicher je Gesicht); eigene Miniaturen (z. B. 128 px) würden Speicher und Dekodierzeit in langen Listen sparen. Wappen sind 256-px-PNG (≈ 90 KB); WebP würde ≈ die Hälfte sparen, Pfade stehen aber auch in Datensätzen.

## Was die Optimierungen tun (Ergebnisse unverändert)

- **Aufgebote der Nationalteams** (`game/national/pool.ts` `pickSquad`): die Wertung (Stärke + Note des Bundestrainers aus `hashStr`) wurde in jedem Vergleich der Sortierung neu gerechnet – jetzt einmal je Kandidat, dann nur die besten 3 Torhüter bzw. Feldspieler ausgewählt (gleiche Reihenfolge wie die stabile Sortierung, Gleichstand → frühere Stelle). Nation je Kürzel und Note je Jahr zwischengespeichert.
- **KI-Formationswahl** (`engine/aiManager.ts` `chooseFormation`, `engine/lineupAI.ts`): 33 Systeme fragten dieselbe Positionseignung je Spieler immer neu ab und bauten jedes Mal eine Ersatzbank, die niemand brauchte – jetzt `suitabilityMemo` und `noBench`.
- **Weltspieler** (`game/worldPool.ts`): montags wird nur geprüft, ob jemand ohne Verein in der Welt ist (meist nicht) statt den Pool neu aufzubauen; im Saisonwechsel werden Überzählige einmal am Ende statt je Verein über den ganzen Pool herausgenommen.
- **Europapokal-Hintergrundspiele** (`engine/euroLight.ts` `withWorldRosters`): Kader der Weltspieler je Spieltag über einen Vereins-Index statt zweimal je Spiel den ganzen Pool zu filtern.
- **Auslandsstatistik im Saisonwechsel** (`game/worldScorers.ts` `withLeanMemo`): Bestenlisten, Die Besten der Saison und Goldener Schuh verteilen dieselben Tore auf dieselben Kader – einmal je Liga. Der Zufall je Tor bleibt `mulberry32(hashStr(Schlüssel))`, der feste Schlüsselanfang wird aber nur einmal gehasht (FNV-1a läuft weiter, an 200 000 Schlüsseln geprüft gleich); Sortieren mit festem `Intl.Collator('de')`, reine Saisonzeilen ohne Sortieren.
- **Terminwart** (`game/fixtureWatch.ts`): Pokal-/Europapokal-/Hallentermine je Verein einmal am Tag (Verlegungen ändern nur Ligatermine).
- **Alter** (`engine/development.ts` `updateAges`): täglich für alle Spieler ohne zwei Date-Objekte je Spieler (Tag ≤ 28, sonst wie bisher).

Neue Zwischenspeicher sind in `game/resetModuleState.ts` eingetragen (`clearWorldRosters`, `clearLeanMemo`, Note des Bundestrainers in `clearNationalCache`).

## Prüfung „gleiche Ergebnisse“

- Fingerabdruck je Saison (`FP=1`) über **62 Saisons** vorher und nachher identisch; zweiter, gleichzeitiger Lauf über 25 Saisons ebenfalls.
- `node scripts/sim.mjs 20` (kompletter Balance-Bericht aller 20 Saisons) Zeile für Zeile identisch.
- `npm run test:newgame-repro` und `npm run test:season`: Ausgabe vorher/nachher identisch (gleiche Fingerabdrücke), alle Prüfungen bestanden.
- Außerdem grün: `test:world` (angepasst: prüft die Torschützen jetzt in `pstats`), `test:national`, `test:worldpool`, `test:goldenball`, `test:awards`, `test:euro2`, `test:leagues`, `test:ai`, `test:schedule`, `test:saves`, `test:continents`; `npm run check` 0 Fehler, `npm run build`.

## Nächste Kandidaten (nicht umgesetzt)

- Match-Engine der eigenen Liga (größter Einzelposten, eigener Branch).
- Spielerpool-Seite: geschätzte Werte für alle 29 000 Spieler bei jedem Öffnen (`marketInfoRows`, ≈ 80–230 ms); ein Zwischenspeicher über Seitenwechsel bräuchte einen sicheren Schlüssel (Scouting-Stab, Software, Berichte, Gespräche).
- `candidatesByNation` (≈ 0,5 s je Saison): baut an jedem Länderspiel-/Monatsersten alle Kandidaten neu; ein Zwischenspeicher bräuchte eine Änderungsmarke am Weltpool.
- Speichern: IndexedDB hält das JSON unkomprimiert (25 MB nach 60 Jahren, `JSON.stringify` einige 100 ms im Hauptthread). Für die Steam-Fassung (Electron) lohnt es, Spielstände komprimiert (gzip ≈ 5 MB) und außerhalb des Hauptthreads zu schreiben – das ist der Punkt, an dem echte Builds statt Browser-Tests sinnvoll werden.

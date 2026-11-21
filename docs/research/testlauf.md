# Testlauf aller Testskripte (21.11.2026, Branch `night/tests`)

Alle 74 `npm run test:*`-Skripte aus `package.json` und `node tests/match-ui.mjs` nacheinander (2 Kerne, parallel lief ein Screenshot-Agent – Laufzeiten daher eher hoch). Grenze je Test 20 min.
Eingeschränkt: `test:audit` mit `VIEWS=1920x1080 SAVES=neu REPORT=0` (der volle Lauf über 3 Auflösungen × 5 Stände dauert deutlich über 20 min; `REPORT=0`, damit `docs/research/audit-bericht.md` nicht überschrieben wird), `test:walk` mit `MAXMIN=15`.
Spalte „nach Korrektur“: erneuter Lauf nach allen Änderungen für die roten Tests und alle Tests ohne UI, die vor den Spieländerungen gelaufen waren (Werbepreis, Kabine, direkter Vergleich können sie berühren). Die übrigen Tests liefen schon mit dem geänderten Spiel. Nach dem Rebase auf `origin/main` (Ordner-Umbenennung) liefen `history`, `marketing`, `talent`, `career`, `matchdnd`, `match-ui`, `season`, `savecompat` und `dressing` noch einmal – diese Zeiten stehen in der Spalte.

**Ergebnis:** 1. Lauf 69 grün, 6 rot (`history`, `marketing`, `dressing`, `career`, `talent`, `matchdnd`). Drei echte Fehler im Spiel behoben, drei veraltete Tests angepasst – keine Prüfung abgeschwächt (bei `marketing` und `talent` eher verschärft). `npm run check` 0 Fehler, `npm run build` grün.

## Ergebnisse

| # | Test | 1. Lauf | nach Korrektur | Bemerkung |
|---|---|---|---|---|
| 1 | `test:history` | rot (11 s) | grün (38 s) | Test veraltet → angepasst (Welt des Spielstands statt `initWorld` ohne Weltdaten) |
| 2 | `test:marketing` | rot (3 s) | grün (2 s) | Echter Balance-Fehler → im Spiel behoben (`marketingPrice`), Test prüft jetzt zusätzlich die ganze Liga |
| 3 | `test:dressing` | rot (500 s) | grün (392 s) | Echter Balance-Fehler → im Spiel behoben (Aussprache in tiefer Krise stärker) |
| 4 | `test:dataset` | grün (4 s) | grün (4 s) |  |
| 5 | `test:contracts` | grün (6 s) | grün (6 s) |  |
| 6 | `test:contracts2` | grün (9 s) | grün (10 s) |  |
| 7 | `test:negotiation` | grün (9 s) | grün (9 s) |  |
| 8 | `test:loans` | grün (15 s) | grün (15 s) |  |
| 9 | `test:business` | grün (2 s) | grün (2 s) |  |
| 10 | `test:registration` | grün (2 s) | grün (2 s) |  |
| 11 | `test:national` | grün (19 s) | grün (20 s) |  |
| 12 | `test:ranking` | grün (10 s) | grün (9 s) |  |
| 13 | `test:supercup` | grün (10 s) | grün (10 s) |  |
| 14 | `test:private` | grün (3 s) | grün (3 s) |  |
| 15 | `test:reserve` | grün (32 s) | grün (33 s) |  |
| 16 | `test:transfers` | grün (10 s) | grün (9 s) |  |
| 17 | `test:worldpool` | grün (6 s) | grün (7 s) |  |
| 18 | `test:scouting` | grün (7 s) | grün (8 s) |  |
| 19 | `test:youth` | grün (5 s) | grün (3 s) |  |
| 20 | `test:stadium` | grün (8 s) | grün (7 s) |  |
| 21 | `test:ai` | grün (4 s) | grün (4 s) |  |
| 22 | `test:career` | rot (13 s) | grün (26 s) | Echter Fehler → im Spiel behoben (direkter Vergleich ohne Hin-/Rück-/Wiederholungsspiele) |
| 23 | `test:winter` | grün (35 s) | grün (34 s) |  |
| 24 | `test:winterbreak` | grün (31 s) | grün (31 s) |  |
| 25 | `test:schedule` | grün (34 s) | grün (33 s) |  |
| 26 | `test:grounds` | grün (3 s) | grün (2 s) |  |
| 27 | `test:finance` | grün (8 s) | grün (11 s) |  |
| 28 | `test:briefing` | grün (9 s) | grün (11 s) |  |
| 29 | `test:awards` | grün (30 s) | grün (37 s) |  |
| 30 | `test:goldenball` | grün (22 s) | grün (25 s) |  |
| 31 | `test:seats` | grün (3 s) | grün (2 s) |  |
| 32 | `test:tickets` | grün (11 s) | grün (8 s) |  |
| 33 | `test:draw` | grün (64 s) | grün (39 s) |  |
| 34 | `test:sponsor` | grün (4 s) | grün (2 s) |  |
| 35 | `test:names` | grün (48 s) | grün (34 s) |  |
| 36 | `test:texts` | grün (73 s) | grün (58 s) |  |
| 37 | `test:realnames` | grün (34 s) | grün (32 s) |  |
| 38 | `test:talent` | rot (1 s) | grün (4 s) | Test veraltet → angepasst (Potenzialskala 84–93 statt 85–99) |
| 39 | `test:positions` | grün (5 s) | grün (3 s) |  |
| 40 | `test:leagues` | grün (81 s) | grün (48 s) |  |
| 41 | `test:promises` | grün (25 s) | grün (17 s) |  |
| 42 | `test:staff` | grün (322 s) | grün (217 s) | langer Lauf (40 Saisons) |
| 43 | `test:camp` | grün (7 s) | grün (5 s) |  |
| 44 | `test:youthcomp` | grün (27 s) | grün (15 s) |  |
| 45 | `test:euro2` | grün (29 s) | grün (16 s) |  |
| 46 | `test:continents` | grün (179 s) | – |  |
| 47 | `test:engine` | grün (8 s) | – |  |
| 48 | `test:tactics` | grün (8 s) | – |  |
| 49 | `test:sideline` | grün (3 s) | – |  |
| 50 | `test:press` | grün (7 s) | – |  |
| 51 | `test:ratings` | grün (14 s) | – |  |
| 52 | `test:leaguerep` | grün (12 s) | – |  |
| 53 | `test:transferlog` | grün (18 s) | – |  |
| 54 | `test:merch` | grün (39 s) | – |  |
| 55 | `test:budget` | grün (263 s) | – | langer Lauf |
| 56 | `test:faces` | grün (0 s) | – |  |
| 57 | `test:ethnicity` | grün (25 s) | – |  |
| 58 | `test:season` | grün (35 s) | grün (39 s) |  |
| 59 | `test:savecompat` | grün (79 s) | grün (75 s) |  |
| 60 | `test:world` | grün (93 s) | – |  |
| 61 | `test:ddrhome` | grün (47 s) | – |  |
| 62 | `test:worldstructure` | grün (47 s) | – |  |
| 63 | `test:worlddeep` | grün (79 s) | – |  |
| 64 | `test:newgame-repro` | grün (24 s) | – |  |
| 65 | `test:honours` | grün (0 s) | – |  |
| 66 | `test:ui` | grün (76 s) | – |  |
| 67 | `node tests/match-ui.mjs` | grün (59 s) | grün (90 s) |  |
| 68 | `test:saves` | grün (11 s) | – |  |
| 69 | `test:editor` | grün (53 s) | – |  |
| 70 | `test:matchdnd` | rot (395 s) | grün (56 s) | Test veraltet → angepasst (Fensterkette über `walkToPrematch`); im 1. Lauf nach 395 s abgebrochen |
| 71 | `test:club` | grün (35 s) | – |  |
| 72 | `test:popups` | grün (367 s) | – | 0 Größenänderungen; nicht geöffnet (Hinweis): Fälle „land“, „spielbericht“ |
| 73 | `test:legends` | grün (48 s) | – |  |
| 74 | `test:walk` | grün (582 s) | – | `MAXMIN=15`; ganze Saison 1975/76 in 573 s, 0 JS-Fehler; 1 Hinweis „toter Klick?“ am 21.12.1975 direkt vor dem Hallenturnier |
| 75 | `test:audit` | grün (104 s) | – | eingeschränkt: `VIEWS=1920x1080 SAVES=neu REPORT=0` (voller Lauf ≈ 15 × so lang); 291 Funde, 0 schwer |

## Rote Tests: Ursache und Behebung

### `test:history` – Test veraltet
*Meldung:* „Kein Auslandsverein mit historischer Kurve in der Startwelt“.
*Ursache:* Der Test baute sich mit `initWorld(gs.euroClubs, 1976)` eine eigene Welt – ohne das Weltdaten-Overlay (`engine/worldData.ts`). Seit es Weltdaten gibt, heißen die Auslandsvereine des Spielstands `w_<land>-…` (Paris = `w_fra-paris`); eine Welt ohne Overlay enthält nur Lückenfüller `w_1 …`, von denen zufällig 7 einen Kurvennamen tragen, keiner mit Faktor ≥ 1,2. Das Spiel selbst lenkt richtig: `game.world` enthält 53 der 60 Kurvenvereine.
*Änderung:* Der Test nimmt `gs.world` (Rückfall wie bisher). Damit greift wieder der ursprünglich gemeinte Fall Paris; die Prüfung „2015 deutlich gewachsen (+0,08)“ ist unverändert und grün.

### `test:marketing` – echter Balance-Fehler im Spiel
*Meldung:* Braunschweig (Vorlage 1978, Ruf 75, Zugkraft ×0,76): am Anschlag Kosten 0,18 Mio. gegen Ertrag 0,16 Mio. (×0,90) – verletzt das Balance-Ziel aus CLAUDE.md „Werbung trägt sich auf jeder Stufe“.
*Ursache:* Nicht (nur) die niedrige Zugkraft. Eine Auswertung aller 18 Erstligisten zeigte: Der Kampagnenpreis hing allein am **Ruf** (`marketingPriceFactor(jahr, ruf)`, Ruf^1,5), der Ertrag aber an den **tatsächlichen Erlösen** aus Spieltag, Mitgliedern und Fanartikeln. Traditionsvereine mit kleinem Stadion zahlten den Preis eines Großklubs: Mönchengladbach (Ruf 82, 3,2 Mio. Spieltagserlös) ×0,92 schon bei normaler Zugkraft, Kaiserslautern ×0,83, Braunschweig ×0,90 – Hamburg mit ähnlichem Ruf, aber 7 Mio. Spieltagserlös, ×1,50.
*Änderung:* `marketingPrice(g)` in `game/marketingGame.ts` (Kosten, Monatsbuchung, Budgetprognose, Anzeige in `MarketingView.tsx`): Größe = Ruf, höchstens aber der erreichte Markt (Erlöse der Vorsaison gegen den Schnitt der Liga × mittlerer Preisfaktor der Liga) – nie teurer als bisher. Danach schwächster Erstligist am Anschlag 1978 Kaiserslautern ×1,23 (Zugkraft 0,70), 1995 (Vorlage „Test 20 Jahre“) Berlin (Ost) ×1,24. Der Test prüft jetzt zusätzlich die **ganze Liga** am Anschlag (vorher nur drei Vereine). Wiki `marketing-overview` und CLAUDE.md ergänzt. Saisonstart ohne Vorsaison-Erlöse (neues Spiel 2025): wie bisher nach Ruf.

### `test:dressing` – echter Balance-Fehler im Spiel
*Meldung:* „keine Dauerkrise (längste 154 Tage < 150)“ im passiven Lauf (30 Saisons, Mönchengladbach). Die Grenze steht im Test als Wunsch Pascal: Krise ja, „aber keine halbe Saison und mehr“.
*Ursache:* Saison 1990/91: Platz 16–17 statt Soll 4, Zielstimmung 5–17, Stimmung fiel von 35 bis 7,5. Die Selbsthilfe „Spieler raufen sich zusammen“ (`rallyIfStuck`, alle 5 Wochen +10/+14 auf die Zielstimmung) kam dagegen nicht an; die Krise endete erst mit der Winterpause. Passiv lagen die Krisentage bei 11,1 % (Kopf des Tests: gedacht 4–8 %).
*Änderung:* `rallyIfStuck` in `game/dressingRoomGame.ts`: Stärke + 0,6 je Punkt unter 35, + 4, wenn die letzte Aussprache ≤ 60 Tage zurückliegt, 30 % davon wirken sofort („die Luft ist klarer“). Danach passiv 5,4 % Krisentage, längste Krise 70 Tage, aktiv 1,8 %; alle Kabinen-Prüfungen grün (Eingreifen hilft weiter deutlich, verfehlte Ziele bringen weiter deutlich mehr Krisen, Gegenversuch Bremen grün). Wiki-Satz zur Kabine ergänzt. Betrifft nur den eigenen Verein, kein Spielstandfeld neu.

### `test:career` – echter Fehler im Spiel
*Meldung:* „Rekonstruktion Spielzahl 37 ≠ 38“.
*Ursache:* `currentH2H` in `game/clubRecords.ts` (direkter Vergleich, gespeichert zum Saisonende) las bei Pokal/Europapokal nur die Paarung (`ties`) – Spiele, die als `legs` geführt werden (Hin-/Rückspiel im Europapokal 2.0, Wiederholungsspiel im Landespokal) und Gruppenspiele (`groups`) fehlten. Im Testlauf 1975/76 fehlte so eines von vier Pokalspielen (Pokalbilanz 2-1-1 – vermutlich das Wiederholungsspiel nach dem Remis). Folgen im Spiel: direkter Vergleich im Vereinsprofil/Gegner/Vorschau unvollständig, Rekonstruktion der Managerbilanz alter Spielstände falsch, Bekanntheit aus direkten Duellen (`playerPool.ts`) zu niedrig.
*Änderung:* `currentH2H` zählt `legs` und `groups` wie `seasonGames` in `game/managerLog.ts`; Gegner aus Gruppenspielen kommen in die Liste. Alte Spielstände behalten ihre gespeicherten Einträge (keine Migration nötig, ab der nächsten Saison vollständig).

### `test:talent` – Test veraltet
*Meldung:* „Ausnahmepotenzial außerhalb 85–99“ – bei jedem Lauf, ungesteuerter Zufall.
*Ursache:* `exceptionalPotential` ist laut `engine/talent.ts` auf die EA-FC-Skala umgestellt: Ausreißer-Schwanz **ab 84**, Deckel `POT_CAP` 93 (Wunsch Pascal). Rund 20 % der Ziehungen sind genau 84 – der Test erwartete noch 85–99.
*Änderung:* Prüfung auf 84–`POT_CAP` (Obergrenze damit strenger) und neu der dokumentierte Anteil ≥ 90 („von 100 rund 7“, Rahmen 3–15 %; gemessen ≈ 9 %).

### `test:matchdnd` – Test veraltet
*Meldung:* kein Ergebnis, Abbruch nach 395 s (von Hand, sonst 20-min-Grenze).
*Ursache:* Die eigene Schleife des Tests (allgemeine Knöpfe „Überspringen/Schließen/OK“ + „Weiter“) kam an der Pokalauslosung am 8.7.1975 (Gala, schließt über Esc → „Weiter“) nicht vorbei und erreichte die Vorschau „Nächstes Spiel“ nie. `match-ui.mjs` nutzt dafür längst den gemeinsamen Helfer.
*Änderung:* `walkToPrematch` aus `tests/prematch-walk.mjs`, danach `.pm-go-btn` „Textmodus“; Prüfungen zum Ziehen & Ablegen unverändert. Lauf 43 s grün (Vorschau nach 24 s).

## Hinweise ohne Fehler
- `test:popups`: Fälle „land“ und „spielbericht“ wurden bei beiden Auflösungen nicht geöffnet (nur Hinweis, kein Fehler) – lohnt eine Prüfung, ob die Einstiege noch stimmen.
- `test:walk`: einmal „TOTER KLICK? Weiter ohne Fortschritt“ am 21.12.1975, unmittelbar bevor das Hallenturnier Dortmund aufging – vermutlich Startverzögerung der Hallen-Show, kein Absturz.
- `test:audit` (eingeschränkt): 291 Funde, davon 0 schwer; der volle Seiten-Check über alle Auflösungen/Stände steht noch aus (am besten nach dem Abschluss von `night/compact`, da Layout).
- Nicht angefasst: `src/engine/match/*`, CSS/Layout, Ordnernamen.

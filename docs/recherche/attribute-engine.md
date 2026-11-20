# Attribute in der Match-Engine – Recherche, Wirkung, Kalibrierung

Stand 11/2026, Branch `feature/attribute-engine`. Wunsch Pascal: „Alle Stats neu anschauen, ihre Wirkung in die
Match-Engine einbauen und mit den Textbausteinen verbinden, damit realistische Ergebnisse herauskommen.“

## 1. Wie Football Manager (Sports Interactive) die Werte versteht – in eigenen Worten

Quellen: [SI-Handbuch FM2020, Spieler/Attribute](https://community.sports-interactive.com/manual/football-manager-2020/players-r562),
[Passion4FM: Player Attributes Explained](https://www.passion4fm.com/football-manager-player-attributes/),
[FMInside: Player Attributes](https://fminside.net/football-manager-player-attributes),
[FM Scout: Understanding player attributes](https://www.fmscout.com/a-understanding-player-attributes-fm-guide.html).

- **Antritt** = wie schnell ein Spieler aus dem Stand auf Höchsttempo kommt; **Schnelligkeit** = Höchsttempo.
  Beide hängen eng zusammen; ohne Ball sind Spieler etwas schneller. Laufduelle nach Steilpässen und Kontern
  entscheiden sich daran – gegen eine aufgerückte Abwehr zählt vor allem das Tempo.
- **Ausdauer** = wie lange ein Spieler auf hohem Niveau bleibt; wer müde wird, führt Aktionen schlechter aus.
  **Natürliche Fitness** (bei uns: Fitness) = Erholung zwischen den Spielen und Belastbarkeit.
- **Antizipation** (bei uns Abfangen + Stellungsspiel) = Spiel lesen, Gefahr früh erkennen.
- **Konzentration** = Aufmerksamkeit Szene für Szene, vermeidet Fehler und falsches Stellungsspiel – besonders
  wichtig, wenn das Spiel lange dauert.
- **Nervenstärke (Composure)** = Ruhe bei Großchancen und unter Druck; ruhige Spieler „haben mehr Zeit“.
- **Entscheidungen** = die richtige Aktion wählen, mit und ohne Ball.
- **Laufbereitschaft (Work Rate)** = der innere Antrieb, mit Nachdruck in die richtigen Räume zu kommen
  (setzt die körperlichen Werte voraus).
- **Teamwork** = Anweisungen umsetzen und mit den Mitspielern zusammenarbeiten.
- **Führung** = Einfluss auf die Mitspieler; sie spielen neben einem Führungsspieler besser.
- **Aggressivität** = Wucht in Pressing und Zweikampf – mehr Ballgewinne, aber auch mehr Fouls.
- **Kreativität/Flair** = Neigung zu unvorhersehbaren, riskanten Aktionen. **Übersicht** = Pass- und
  Torchancen erkennen.
- **Ballannahme**, **Technik**, **Ballkontrolle**, **Balance** (auf den Beinen bleiben), **Beweglichkeit**
  (Richtungswechsel), **Kraft**, **Sprungkraft** (zusammen mit der Körpergröße).
- Torwart: **Reflexe** (schwierige Paraden), **Eins gegen eins** (Läufer richtig lesen),
  **Strafraumbeherrschung** (Flanken herunterholen), **Kommandos** (Abwehr ordnen, Abwehr fühlt sich sicherer),
  **Fangsicherheit** (Ball festhalten, keine Abpraller – v. a. bei Regen), **Abschlag** (Weite des Abstoßes;
  in FM zusätzlich *Abwurf* = schnelle Spieleröffnung, oft Konter).

## 2. Inventar: Attribut → Szene (vorher / nachher)

Messung `MODE=attrs node scripts/matchbench.mjs 600` (Verein aus dem Ligamittelfeld 1995, Attribut der Gruppe
auf 60 bzw. 85, Positionsstärke unverändert – es zählt nur die direkte Wirkung in den Szenen; TD = Tordifferenz
je Spiel, Δ = 85 minus 60). Vorher = Stand vor diesem Branch.

| Attribut | Wo es wirkt (nachher) | vorher Δ | nachher Δ |
|---|---|---|---|
| Schnelligkeit (Angriff) | Laufduell `raceP` (Linie!), Konterzahl `counterPaceF`, Steilpass-Wahl `steilRouteF`, Tempodribbling | Laufduelle +8,9 %, Konter −0,08, TD +0,08 | Laufduelle +8,3 %, **Konter +0,86**, TD +0,17 |
| Antritt (Angriff) | wie Schnelligkeit + Dribbling | TD +0,15 | TD +0,25 |
| … gegen hohe Linie (alle Gegner Linie 100) | `raceP`: Tempo-Unterschied zählt doppelt | – | **Laufduelle 50 → 71 %, Konter 3,4 → 5,2, Tore 1,24 → 1,53** |
| … gegen tiefe Linie (Linie 0) | Stellungsspiel des Verteidigers zählt mehr, Tempo 0,7-fach | – | Laufduelle 33 → 44 %, Tore 1,14 → 1,30 |
| Schnelligkeit/Antritt (Abwehr) | Verfolger im Laufduell, Konter gegen | Gegner-Konter −0,03 | **Gegner-Konter −0,84**, TD +0,20 |
| Ausdauer | Kraftverlust, Laufbereitschaft × Kraft | TD +0,12 | TD +0,06 (Kraft 68 → 78) |
| Laufbereitschaft | Angriffsrate, Pressing-Fehler, Zurückeilen | Konter gegen −0,06, TD +0,01 | Konter gegen −0,44, **TD +0,24** |
| Teamwork | Pässe (kurz/steil/Konter), Passquote, Abseitsfalle | **keine Wirkung** | Pässe +3,2 %, Abseits Gegner +0,3, TD +0,06 |
| Konzentration | Patzer (spät doppelt), späte Lücken im Strafraum | Patzer ±0, TD +0,05 | **Patzer 0,27 → 0,14**, Gegentore ab 70. −0,05, TD +0,13 |
| Führung | Kapitän hebt die Elf (±3 %), weniger Druck, weniger Patzer | **keine Wirkung** | Patzer −0,04, TD +0,04 |
| Aggressivität | Fouls/Karten (Mannschaft!), Pressing-Wucht | Fouls +0,3 | Fouls +5,5, Karten +0,8, TD +0,13 (Abwägen) |
| Ballkontrolle (Abw./Mf.) | Pressingresistenz, Dribbling | Patzer ±0 | Patzer 0,25 → 0,18 |
| Erfahrung | Pressingresistenz, Timing, Konstanz, Karten | Patzer −0,02 | Patzer −0,06, TD +0,07 |
| Ballannahme | Pass in die Spitze, Mitnahme im Lauf, Strafraum | Pässe +0,2 % | Pässe +1,6 % |
| Technik | Pass, Flanke, Abschluss, jetzt auch Dribbling | TD +0,02 | TD +0,11 |
| Balance / Beweglichkeit | Dribbling (Balance 12 %), Zweikampf | Dribblings +2,2 % / +2,0 % | +2,7 % / +2,8 % |
| Übersicht | Pass, Steilpass, Großchance nach Kombination | Großchancen +0,15 | Großchancen +0,10, Pässe +4,5 % |
| Nervenstärke | Abschluss, Druck, zusätzlich allein vor dem Torwart | Großchancen-Quote +1,9 % | **+4,5 %** |
| Flair | Dribbler-Wahl, Dribbling, Solo-Abschluss nach Dribbling | Solo +0,02 | Solo +0,08 |
| Deckung | Tackling, Block, jetzt Zuordnung bei Flanken/Ecken | Gegner-Kopfballtore ±0 | Gegner-Dribblings −4,5 % |
| Schusskraft | Distanzschuss (35 %), Freistoß | Distanztore +0,02 | +0,02, TD +0,07 |
| Freistöße | direkter Freistoß, Spezialist zählt stärker | Freistoßtore +0,01 | **+0,03** |
| Ecken | Hereingabe (Gewicht 0,55 statt 0,4) | +0,02 | +0,04 |
| TW Fangsicherheit | Abpraller nach Paraden | Nachschüsse −0,01 | **Nachschüsse 0,96 → 0,60**, TD +0,13 |
| TW Abschlag | Konter nach Parade/gefangener Flanke, lange Bälle vom Torwart | **keine Wirkung** | Konter +0,16, lange Bälle −0,26 |
| TW Kommandos | Kopfball-/Standardabwehr, weniger Patzer | Gegner-Kopfballtore −0,03 | −0,05 |
| TW Strafraumbeherrschung | Flanken abfangen | (Messung falsch) | Flanken gefangen 1,20 → 1,67 |
| unverändert stark | Kopfball, Sprungkraft, Kraft, Flanken, Passen, Abfangen, Reflexe, Eins gegen eins, Elfmeter, Abschluss, Weitschuss, Tackling, Stellungsspiel | | |

Neutral gehalten: alle neuen Wirkungen sind auf typische Ligawerte zentriert (`NEUTRAL_TRAITS`, `REF` in
`engine/match/traits.ts`, gemessen über je 120 Spiele 1975/1995/2015). Eine durchschnittliche Elf
spielt deshalb wie vorher; die Torzahl je Epoche wird über `era.ts` gehalten.

## 3. Echte Statistiken je Epoche (Soll-Werte `data/matchStats.ts`)

Ausgewertet mit einem kleinen Skript aus zwei offenen Datensätzen:
- alle Bundesligaspiele 1963/64–2008/09 (R-Paket *vcd*, Datensatz „Bundesliga“,
  [Rdatasets](https://raw.github.com/vincentarelbundock/Rdatasets/master/doc/vcd/Bundesliga.html)),
- Spielstatistik 1993/94–2025/26 von football-data.co.uk (Spiegel
  [datasets/football-datasets](https://datahub.io/core/german-bundesliga)), dazu Premier League, LaLiga, Serie A.

| Bundesliga | Tore | Heim | Remis | Ausw. | 0:0 | Schüsse/Team | aufs Tor | Fouls | Ecken | Gelb | Rot | 2. HZ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1965–74 | 3,21 | 56,0 % | 24,2 % | 19,8 % | 6,0 % | | | | | | | |
| 1975–84 | 3,41 | 56,7 % | 24,2 % | 19,1 % | 5,1 % | | | | | | | |
| 1985–94 | 2,93 | 49,3 % | 29,2 % | 21,5 % | 8,2 % | | | | | | | |
| 1995–2004 | 2,87 | 48,5 % | 25,8 % | 25,8 % | 6,9 % | 12–14 (ab 2000) | ≈ 40 % | 35–41 | 10,5 | 4,3 | 0,21 | 56,7 % |
| 2005–14 | 2,87 | 45,1 % | 25,5 % | 29,4 % | 6,8 % | 13,4 | 38 % | 34,0 | 10,1 | 3,65 | 0,18 | 56,1 % |
| 2015–23 | 3,05 | 44,9 % | 24,7 % | 30,5 % | 5,6 % | 12,9 | 37 % | 25,0 | 9,6 | 3,75 | 0,14 | 55,6 % |
| 2024–25 | 3,18 | 41,2 % | 24,8 % | 34,0 % | 5,6 % | 13,1 | 36 % | 21,1 | 9,7 | 3,83 | 0,18 | 54,3 % |

Andere Ligen (2005–14 / 2015–23): Premier League 2,66 / 2,82 Tore, Heimsiege 46,9 / 44,9 %;
LaLiga 2,70 / 2,62, 47,8 / 45,5 %; Serie A 2,60 / 2,78, 46,4 / 43,0 %. Häufigstes Ergebnis überall 1:1 (10–13 %).
Heimvorteil langfristig: [Springer, Sportwissenschaft 2021](https://link.springer.com/article/10.1007/s12662-021-00787-7)
– Punkteanteil der Heimteams 1964–89 ≈ 68 %, ab 1990 ≈ 60 %.

Erkenntnisse für die Engine:
- **1985–94 war torärmer als gedacht** (2,93 statt der früher angenommenen 3,3) und hatte **29 % Remis** –
  Zwei-Punkte-Regel: bei Gleichstand nach der 60. gehen jetzt beide Teams weniger Risiko (`level` in `sim.ts`).
- **Fouls** wurden bis etwa 2014 deutlich höher gezählt (34–41 je Spiel, vor der heutigen Datenerfassung);
  `EraRules.foulRate` bildet das ab, Gelb/Rot je Foul (`yellowPerFoul`, `redPerFoul`) sinken entsprechend.
- **Gut 55 % der Tore nach der Pause** – vorher 52 %: die Angriffsrate steigt jetzt nach der Pause und in der
  Schlussphase (`late` in `sim.ts`), dazu Ausdauer/Konzentration.
- **Schüsse aufs Tor heute ≈ 37 %** (vorher 43 %) – ab 2000 seltener aufs Tor.
- Für 1975–84 gibt es keine Schuss-/Foulzählung; die Spannen dort sind Annahmen (wie Anfang der 2000er).

## 4. Ist/Soll vorher – nachher (`MODE=era MIX=1 node scripts/matchbench.mjs 2000`)

| Kennzahl | 1975 vorher → nachher (Soll) | 1985 | 1995 | 2005 | 2015 | 2024 |
|---|---|---|---|---|---|---|
| Tore/Spiel | 3,28 → 3,49 (3,25–3,55) | 3,31 → 2,94 (2,8–3,1) | 3,03 → 2,96 (2,75–3,0) | 3,10 → 2,99 (2,75–3,0) | 3,25 → 3,06 (2,9–3,2) | 3,52 → 3,27 (3,0–3,35) |
| Heimsiege | 52,0 → 54,0 % | 47,9 → 47,3 % | 43,7 → 48,2 % | 43,3 → 44,5 % | 45,1 → 43,0 % | 44,8 → 43,0 % |
| Remis | 22,3 → 22,4 % | 21,9 → 27,4 % | 24,1 → 23,8 % | 23,9 → 24,1 % | 21,9 → 25,8 % | 21,1 → 22,9 % |
| 0:0 | – → 3,2 % | – → 7,0 % | – → 6,3 % | – → 5,8 % | – → 5,9 % | – → 5,3 % |
| Tore 2. HZ | ≈ 52 % → 54,0 % | → 54,0 % | → 54,5 % | → 56,0 % | → 54,4 % | → 55,5 % |
| Schüsse aufs Tor | 42 % → 42,7 % | 43 → 41,5 % | 43 → 42,2 % | 43 → 37,9 % | 43 → 38,4 % | 43 → 38,7 % |
| Fouls | 22 → 36,8 | 21 → 36,7 | 21 → 39,4 | 21 → 35,5 | 21 → 24,8 | 21 → 20,6 |
| Abweichungen gesamt | 26 von 144 (alte Soll-Werte) → **3 von 162** (neue Soll-Werte aus echten Daten) |

## 5. Kommentar (Textbausteine)

`engine/match/traits.ts` bestimmt das **entscheidende Attribut** einer Szene (`whyRace`, `whyDribble`,
`whyAerial`, `whyIntercept`, `whyPass`, `whyFinish`) – nur mit Textmodus/Trace, ohne Zufallszahlen. Am Ereignis
steht `why` (Duell davor) bzw. `fin` (Abschluss). Der Kommentar (`data/ticker/narrator.ts`) sucht zuerst
`fail_<Art>_<why>`, `b_<Aufbau>_<why>`, `o_<Ausgang>_<fin>` in `data/ticker/attrDuels.ts` und fällt sonst auf
die bisherigen Bausteine zurück. Beispiele: „Steilpass Müller – Becker zieht den Turbo an und lässt Schmidt
einfach stehen!“, „Die Kette steht hoch … Becker ist schneller als Schmidt“, „Gutes Stellungsspiel von Göbel“,
„Eiskalt! … schiebt ein“, „Kiefer kann den Ball nicht festhalten – Möbius ist zur Stelle“.

## 6. Hat der menschliche Manager einen versteckten Vorteil?

Geprüft: alle Stellen mit `managedClubId`, `human`, `own`, `humanClubIds`, Schwierigkeitsgrad, Heimvorteil, Moral,
Ehrungen. **Ergebnis: Es gibt keinen pauschalen Motivations-Bonus in der Match-Engine.** Einzelheiten:
- Heimvorteil (`attack.ts` `advantage`/`HOME_EXTRA`, `sim.ts` `homeCtrl`, `actions.ts` Schiedsrichter) ist symmetrisch
  und hängt nur von Heim/Auswärts und Epoche ab.
- Schwierigkeitsgrad wirkt nur auf die Häufigkeit von Jobangeboten (`game/careerGame.ts:151`), nie auf Spiele.
- Schnell-Simulation: der eigene Verein bekommt dieselbe KI an der Seitenlinie (`sim.ts:393`) – Unterschied nur:
  gespeicherte Aufstellung und Rollen (`ownMatch.ts:190` → `state.ts:95–99`); ohne gesetzte Rolle gilt die
  Standardrolle der Position, die KI wählt die passendste (eher ein kleiner Nachteil).
- **Nur der eigene Verein:** Stab-Faktor `staffStrength` (`state.ts:128`, Rechnung `game/staffGame.ts:254`):
  unbesetzte Stellen kosten bis zu −4 %, volle Besetzung mit sehr guten Leuten bringt höchstens **+0,4 %**;
  KI-Vereine immer 1,0. Verletzungsrisiko über medizinisches Personal und Trainingsschwerpunkt (`game/day.ts:126`),
  KI-Vereine neutral.
- Textmodus: Zurufe (`sim.ts:506`), Halbzeitansprache (`sim.ts:529`, bis +3,5 % in der 2. Halbzeit), Spielergespräche
  (`sideline.ts:125`, ±1,5 %) und Aufwärmen (`sideline.ts:42`, +4 Kraft, +1 %) kann nur der Mensch nutzen – die KI
  verzichtet darauf. Das ist kein versteckter Bonus, aber ein Werkzeug, das nur du hast.
- Für alle Vereine gleich: Vereinsauszeichnungen (`honourFx`, `state.ts:131`, alle Vereine der Liga), Teambonus
  der Führungsspieler (`teamBoostOf`, `state.ts:135`), Eingespieltheit, Moral (KI wöchentlich).

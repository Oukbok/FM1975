# Relegation, Play-offs und Entscheidungsspiele zwischen den Ligen

Wunsch Pascal: „Füge Relegation komplett hinzu und nutze sie akkurat in jedem Ligensystem“ – „mit jedem meine ich auch anderen Ländern als Deutschland“.
Daten: `src/data/relegationRules.ts` (ein Format je Land, Ebenen-Grenze und Zeitraum), Ablauf Heimatland `src/game/relegationHome.ts`, Ausland `src/game/relegationWorld.ts`, gemeinsamer Kern `src/game/relegationCore.ts`, Anzeige `src/game/relegationView.ts`, Test `npm run test:relegation2`.

Nicht verwechseln: `src/game/relegationGame.ts` = Ende der Amtszeit nach dem Abstieg aus der untersten Liga.

## Modell

- Jahreszahl = Startjahr der **gespielten** Saison (2008 = Relegation am Ende von 2008/09).
- Ebene `lv` = Grenze zwischen Ebene lv und lv+1.
- Ein Format besteht aus Klammern. Jede Klammer entscheidet über **genau einen** Platz in der oberen Liga; Teilnehmer sind Tabellenplätze (negativ = von unten, damit dieselbe Regel für 16er-, 18er- und 20er-Ligen gilt), Staffeln der unteren Ebene über den Index.
- Die **Zahl** der Auf- und Absteiger rechnet der Saisonwechsel wie bisher (Deutschland `data/reforms.ts`, Ausland/Heimatland ≠ Deutschland `data/world/structure.ts` aus den Weltdaten – dort sind die historischen Relegationsergebnisse schon in den Zahlen enthalten). Die Relegation tauscht danach nur, **wer** den umkämpften Platz bekommt (`relSwap`): je Klammer weicht der Verein, der ohne Relegation oben stünde, dem Sieger. Bekommt eine Klammer wegen abweichender Ligagröße zwei Plätze und eine andere keinen, wird innerhalb derselben Grenze ausgeglichen; bekommt sie gar keinen, bleibt die Tabelle maßgeblich.
- Entscheidung: Gesamtstand, Auswärtstore (bis `awayGoalsTo`), Verlängerung, Elfmeterschießen; `tieBetter` = ohne Elfmeterschießen kommt der Besserplatzierte weiter (Italien, Spanien).
- Termine im Heimatland: letzter Spieltag der beteiligten Ligen + 4 Tage, Rückspiel + 3 Tage, nächste Runde + 7 Tage (Ausweichen um Pokal-/Europapokaltermine). Kalender-Ereignis `super_cup` mit `matchId` `rl_…` – Vorschau, Textmodus, Spielbericht, Kalender laufen über die vorhandenen Wege.
- Spiele: zwei volle Vereine → Match-Engine; eigener Verein gegen Sim-Verein → Gastverein aus den Weltspielern (`ensureGuestClub`); sonst Schnellmodell der Sim-Ligen (`simMatchGoals`). Ausland: `worldMatchGoals`, entschieden am ersten Tag nach dem letzten Spieltag, Ergebnisse ab ihrem Termin sichtbar.
- Speicher: Heimatland `game.relegation` (laufende Saison + Archiv 10 Saisons), Ausland `world.live.rel` bzw. `WorldSeasonRecord.rel` (10 Saisons). Alte Spielstände: Feld fehlt → laufende Saison ohne Relegation, ab der nächsten Saison aktiv.

## Formate und Quellen

| Land | Ebenen | Zeitraum | Format | Quelle |
|---|---|---|---|---|
| Deutschland | 1/2 | 1975/76–1980/81 | Zweite der 2. Liga Nord und Süd, Hin/Rück, um den dritten Aufstiegsplatz | DE1 |
| Deutschland | 1/2 | 1981/82–1990/91, ab 2008/09 | 16. gegen 3., Hin/Rück, Hinspiel beim Erstligisten, Auswärtstore bis 2020/21 | DE1, DE2 |
| Deutschland | 2/3 | ab 2008/09 | 16. gegen 3. der 3. Liga, Hinspiel beim Drittligisten, Auswärtstore bis 2020/21 | DE2 |
| Deutschland | 3/4 | ab 2012/13 | geloste Aufstiegsspiele der Regionalliga-Meister (+ Zweiter Südwest), drei Duelle Hin/Rück | DE3 |
| Deutschland | – | 1991/92–2007/08 | keine Relegation (1991/92 Sonderrunde: vier direkte Absteiger aus der 20er-Liga; Aufstiegsrunde der Regionalliga 1994–2000 vereinfacht als direkte Plätze) | DE1 |
| DDR | – | bis 1990/91 | keine Relegation zwischen Oberliga und DDR-Liga (Aufstiegsrunde der Staffelsieger 1976–84 bleibt vereinfacht in `ddrExchange`) | DE1 |
| England | 1/2, 2/3, 3/4 | 1986/87–1987/88 | Play-offs mit dem Verein der oberen Liga (Viertletzter bzw. Drittletzter) und Plätzen 3–5 bzw. 4–6, Finale Hin/Rück | EN1 |
| England | 1/2, 2/3, 3/4 | 1988/89 | Play-offs Plätze 3–6 (4–7), Finale Hin/Rück | EN1 |
| England | 1/2, 2/3, 3/4 | ab 1989/90 | Play-offs, Finale als ein Spiel auf neutralem Platz | EN1 |
| Schottland | 1/2 | 1995/96–1999/2000; ab 2013/14 | Vorletzter gegen Zweiten; ab 2013/14 Viertel-/Halbfinale der Plätze 4/3/2, Finale gegen den Vorletzten | SC1 |
| Schottland | 2/3 | ab 2005/06 | Vorletzter + Plätze 2–4 (Paarungen vereinfacht) | SC1 |
| Frankreich | 1/2 | 1975/76–1992/93 | Staffelzweite der D2, Sieger gegen den 18. (Drittletzter), Hin/Rück (vereinfacht) | FR2 |
| Frankreich | 1/2 | 2016/17; 2017/18–2018/19, 2020/21–2021/22, ab 2023/24 | Barrage Drittletzter gegen Dritten; ab 2017/18 vorher Ligue-2-Play-off 4./5. und 3. (Einzelspiele); 2019/20 und 2022/23 keine | FR1 |
| Frankreich | 2/3 | 2015/16–2018/19, 2020/21–2021/22, ab 2023/24 | Drittletzter gegen Dritten der 3. Ebene (Annahme nach dem Muster oben) | FR1 |
| Italien | 1/2 | bis 2004/05, ab 2022/23 | Entscheidungsspiel bei Punktgleichheit an der Abstiegslinie; bis 2003/04 auch an der Aufstiegslinie der Serie B | IT1 |
| Italien | 1/2 | ab 2005/06 | Play-offs der Serie B (3–6, ab 2013/14 3–8 mit Vorrunde), ohne Elfmeterschießen – Besserplatzierter | IT2 |
| Italien | 2/3 | ab 2003/04 | Play-out Viertletzter gegen Fünftletzten | IT2 |
| Spanien | 1/2 | 1987/88–1998/99 | Promoción: 17./18. gegen 4./3. der Segunda, Hin/Rück | ES1 |
| Spanien | 1/2 | ab 2010/11 | Play-offs der Segunda 3–6, Hin/Rück, ohne Elfmeterschießen | ES1 |
| Niederlande | 1/2 | 1984/85–1988/89 | Nacompetitie nur Eerste Divisie (vereinfacht 3. gegen 4.) | NL1 |
| Niederlande | 1/2 | 1989/90–1991/92 | Gruppen der Periodensieger → Duell um einen Platz + Duell gegen den 16. (vereinfacht) | NL1 |
| Niederlande | 1/2 | 1992/93–2016/17 | 16. und 17. der Eredivisie mit Periodensiegern, zwei Klammern (vereinfacht) | NL1 |
| Niederlande | 1/2 | ab 2017/18 | 16. + Eerste Divisie, zwei Plätze (vereinfacht) | NL2 |
| Belgien | 1/2 | 1975/76–2014/15; ab 2015/16 | Endrunde der 2. Division (vereinfacht Plätze 2–5 K.-o.); ab 2015/16 Finale der Periodensieger (Erster gegen Zweiten) | BE1 |
| Schweiz | 1/2 | 2003/04–2011/12, ab 2019/20 | Barrage Vorletzter gegen Zweiten; Auf-/Abstiegsrunde 1987–2003 nicht abgebildet | CH1 |
| Österreich | 1/2 | ab 2026/27 | Relegation angekündigt; Paarung Letzter gegen Zweiten = Annahme | AT1 |
| Portugal | 1/2 | ab 2021/22 | 16. gegen 3., Hin/Rück | PT1 |
| Schweden | 1/2 | ab 2000 | Kvalifikation Drittletzter gegen Dritten, Hin/Rück, Auswärtstore | SE1 |
| Norwegen | 1/2 | ab 2009 | Play-off 3–6 der 1. divisjon, Sieger gegen den Drittletzten (Hin/Rück) | NO1 |
| Finnland | 1/2 | ab 1995 | Vorletzter gegen Zweiten (Beginn = Annahme) | FI1 |
| Nordirland | 1/2 | ab 2008/09 | Vorletzter gegen Zweiten | NI1 |
| Irland | 1/2 | ab 2009 | Vorletzter gegen Zweiten (Vorrunde zusammengefasst) | IE1 |
| Russland | 1/2 | ab 2011/12 | Viertletzter/Drittletzter gegen 4./3., Hin/Rück, Auswärtstore bis 2020/21 | RU1 |
| Ukraine | 1/2 | ab 2020/21 | Drittletzter gegen Dritten (Annahme) | – |
| Kroatien | 1/2 | 2009/10–2021/22 | Vorletzter gegen Zweiten (Zeitraum = Annahme) | – |
| Türkei | 1/2 | ab 2005/06 | Play-offs 3–6 der 2. Ebene auf neutralem Platz (Beginn = Annahme) | – |

Alle übrigen Länder der Weltdaten (Griechenland, Dänemark, Polen, Tschechien/Slowakei, Ungarn, Rumänien, Bulgarien, Jugoslawien/Serbien, Albanien, Zypern, Israel, Island, Luxemburg, Malta, Wales, Sowjetunion) spielen im Spiel direkten Auf- und Abstieg. Für viele gab es zeitweise Entscheidungsspiele (z. B. bei Punktgleichheit); ohne verlässliche Quelle bleiben sie bewusst weg.

### Quellen
- **DE1** Relegation (Fußball) / 2. Bundesliga, Geschichte: https://de.wikipedia.org/wiki/Relegation_(Fu%C3%9Fball), https://de.wikipedia.org/wiki/2._Fu%C3%9Fball-Bundesliga
- **DE2** Relegation zur Bundesliga / zur 2. Bundesliga (Abschaffung der Auswärtstorregel 2021/22): https://de.wikipedia.org/wiki/Relegation_zur_Fu%C3%9Fball-Bundesliga
- **DE3** Aufstiegsspiele zur 3. Liga: https://de.wikipedia.org/wiki/Aufstiegsspiele_zur_3._Fu%C3%9Fball-Liga
- **EN1** English Football League play-offs: https://en.wikipedia.org/wiki/English_Football_League_play-offs
- **SC1** Scottish Premiership play-offs: https://en.wikipedia.org/wiki/Scottish_Premiership_play-offs
- **FR1** Ligue 1 relegation/promotion play-offs (Ligue-2-Verein hat im Hinspiel Heimrecht; Zeiträume, Ausfälle 2019/20 und 2022/23): https://en.wikipedia.org/wiki/Ligue_1_relegation/promotion_play-offs
- **FR2** z. B. 1980–81 French Division 2 (Duell der Staffelzweiten, Sieger gegen den 18. der D1): https://en.wikipedia.org/wiki/1980%E2%80%9381_French_Division_2
- **IT1** Spareggio (Serie A/B): https://it.wikipedia.org/wiki/Spareggio_(calcio)
- **IT2** Serie B play-off/play-out: https://it.wikipedia.org/wiki/Play-off_e_play-out_della_Serie_B
- **ES1** La Liga play-offs (Promoción 1987–1999, Play-offs ab 2011): https://en.wikipedia.org/wiki/La_Liga_play-offs
- **NL1** RSSSF, Promotion and relegation Dutch competition 1981/82–1999/2000: https://rsssf.org/tablesn/ned-nacomphist.html
- **NL2** Eredivisie promotion/relegation play-offs: https://en.wikipedia.org/wiki/Eredivisie_promotion/relegation_play-offs
- **BE1** Belgian Second Division final round: https://en.wikipedia.org/wiki/Belgian_Second_Division_final_round
- **CH1** Barrage (Fußball), Super League: https://de.wikipedia.org/wiki/Barrage_(Fu%C3%9Fball)
- **AT1** Österreichische Bundesliga, „Richtlinien Relegations-Bewerb BL1-BL2 ab 01.07.2026“ (bundesliga.at; Inhalt nicht maschinenlesbar, Paarung als Annahme)
- **PT1** Primeira Liga, Relegation play-off seit 2021–22: https://en.wikipedia.org/wiki/Primeira_Liga
- **SE1** Allsvenskan, Kvalspel: https://en.wikipedia.org/wiki/Allsvenskan
- **NO1** Eliteserien, promotion/relegation play-offs: https://en.wikipedia.org/wiki/Eliteserien
- **FI1** Veikkausliiga: https://en.wikipedia.org/wiki/Veikkausliiga
- **NI1** NIFL Premiership: https://en.wikipedia.org/wiki/NIFL_Premiership
- **IE1** League of Ireland Premier Division: https://en.wikipedia.org/wiki/League_of_Ireland_Premier_Division
- **RU1** Russian Premier League (Relegation play-offs seit 2011–12): https://en.wikipedia.org/wiki/Russian_Premier_League

## Vereinfachungen (Überblick)
- Rundenturniere (Nacompetitie, belgische Endrunde, Schweizer Auf-/Abstiegsrunde) → K.-o.-Duelle; Periodensieger → Tabellenplätze.
- Keine Wiederholungsspiele, keine Sonderregeln („Play-off entfällt bei ≥ 10 Punkten Abstand“, B-Teams in Spanien nicht spielberechtigt).
- Relegationsspiele zählen in der Spielerstatistik als Pokalspiele (Wettbewerb `Pokal` der Match-Engine, wie der Supercup).
- Weicht die Ligagröße im Spiel von der historischen ab (gerade Ligagrößen, England 1987/88), kann eine Klammer keinen Platz bekommen – dann zählt die Tabelle.
- Der Unterbau (Amateurbereich) hat keine Relegation; das Ende der Amtszeit (`relegationGame.ts`) prüft erst nach einer offenen Relegation des eigenen Vereins.

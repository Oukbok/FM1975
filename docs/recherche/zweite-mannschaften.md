# Zweite Mannschaften (Amateure / U23 / „II“) – Regeln je Epoche

Umsetzung: `src/data/reserveRules.ts` (Regeln + Quellen), `src/game/reservePyramid.ts` (Pyramide, Auf-/Abstieg, Pokal),
`src/game/reserveTeam.ts` (eigene Mannschaft, Amateurliga), Anzeige `src/game/reserveView.ts` + `views/jugend/ReserveTeamView.tsx`.

## Deutschland
| Zeit | Höchste Liga | Besonderheiten |
|---|---|---|
| 1951–1963 | ab Ende der 1950er Amateurliga (3. Ebene) | 1951 dürfen Vertragsspielervereine Amateurmannschaften melden |
| 1963–1978 | Amateurliga (3. Ebene) | Status unverändert; ab 1974 über die Verbandspokale im DFB-Pokal |
| 1978–1994 | Amateur-Oberliga (3. Ebene) | 2. Bundesliga gesperrt – Meisterplatz geht an den Nächsten |
| 1994–2008 | Regionalliga (3. Ebene) | zugelassen nach sportlicher Qualifikation; ab 2005 „II“ statt „Amateure“; DFB-Pokal bis 2007/08 (Hertha BSC Amateure im Finale 1993, 0:1 gegen Leverkusen) |
| ab 2008 | 3. Liga | im Gegenzug kein DFB-Pokal mehr; je Regionalliga-Staffel höchstens sieben zweite Mannschaften |
| ab 2014 | 3. Liga | U23 keine Pflicht mehr für Lizenzvereine → Abmeldungen (u. a. Frankfurt, Leverkusen 2014; Bochum, Dresden 2015) |

Immer: zwei Mannschaften eines Vereins nie in derselben Spielklasse, die zweite nie höher. Steigt ein Zweitligist in die
3. Liga ab, muss seine zweite Mannschaft bis in die Oberliga (Zwangsabstieg); zweite Mannschaften von Drittligisten
höchstens Oberliga; Aufstieg einer gesperrten zweiten Mannschaft → Nachrücker.
Spielberechtigung heute: Kader überwiegend U23, je Spiel bis zu drei ältere Spieler; Profis, die nach dem fünften
Spieltag in mehr als der Hälfte der Pflichtspiele eingesetzt wurden, sind als „Stammspieler“ in der 3. Liga gesperrt
(ab dem fünftletzten Spieltag festgestellt). Erfolge: elf der 48 Amateurmeisterschaften 1950–1998 gingen an zweite
Mannschaften (Hannover 96 und Werder je drei, VfB zwei); Bayern II Meister der 3. Liga 2019/20.

**DDR:** zweite Mannschaften der Oberligisten in der DDR-Liga bis 1976 (dann alle elf ausgeschlossen, eigene
Nachwuchsoberliga), ab 1984 wieder in der DDR-Liga ohne Aufstiegsrecht, 1990/91 keine mehr.

## Ausland (für spätere Auslandsligen)
- **England:** Reserveteams in eigenen Ligen (Central League, Football Combination, Premier Reserve League, seit 2012
  Professional Development League), nicht in der Pyramide; seit 2016/17 U21-Teams im EFL Trophy.
- **Spanien:** „B“-Teams in derselben Pyramide, nie in der Liga der ersten Mannschaft (Castilla 1983/84 Meister der
  Segunda ohne Aufstieg; Mestalla 1952 Aufstieg verweigert); seit 1990/91 nicht mehr in der Copa del Rey (Castilla im Finale 1980).
- **Italien:** seit 2018/19 U23-Teams der Serie-A-Vereine ab der Serie C (Juventus, später Atalanta, Milan, Inter);
  nie gleich/höher als die erste Mannschaft, Zwangsabstieg, höchstens vier Spieler über 23 im Spielbericht.
- **Frankreich:** Reserveteams höchstens vierte (mit Ausbildungszentrum) bzw. fünfte Ebene, Aufstieg geht sonst an
  den Nächsten; nicht im Coupe de France.

## Im Spiel (vereinfacht)
- KI-Vereine der 1./2. Liga haben je Epoche eine zweite Mannschaft (bis 2007/08 alle Erstligisten + ~70 % der
  Zweitligisten, 2008–2014 alle, danach ~80 % bzw. ~45 %); Stärke = Amateurniveau + Abstand des Stammvereins.
  Abgestiegene Vereine auf Ebene 3 behalten sie (höchstens Amateurliga), darunter melden sie ab.
- Unterhalb der simulierten Ligen (bis 1994 immer) spielen zweite Mannschaften im Amateur-Pool; deine spielt dort in
  der höchsten Amateurliga ihrer Region (Pool-Vereine + zweite Mannschaften der Region + Amateurvereine), Meister
  steigt auf, wenn erlaubt; die letzten drei steigen ab (Verbands-/Landesliga).
- Beim Spielstart ab 1994 belegen bis zu drei zweite Mannschaften je Staffel die unterste simulierte Ebene.
- Obergrenze je Staffel vor 2008: sechs (Spielannahme), ab 2008 sieben, 3. Liga vier.
- DFB-Pokal bis 2007/08: bis zu drei zweite Mannschaften je Saison (deine bei Platz 1–3, KI nach Abschneiden/Stärke)
  als Pokal-Verein mit Vertragsamateuren (Pokalbindung).
- Ab 2008 höchstens drei Spieler über 23 in der Elf deiner zweiten Mannschaft; die Stammspieler-Regel ist durch
  „wer in der Profi-Startelf steht, spielt nicht mit“ ersetzt. DDR-Vereine ohne zweite Mannschaften.

## Quellen
- Wikipedia (en): German reserve football teams – https://en.wikipedia.org/wiki/German_reserve_football_teams
- DFB: Wo dürfen zweite Mannschaften spielen? – https://www.dfb.de/news/detail/wo-duerfen-zweite-mannschaften-spielen-das-ist-zu-beachten-144294
- hessenschau: Zweite Mannschaften in der Regionalliga – https://www.hessenschau.de/sport/fussball/regionalliga/zweite-mannschaften-in-der-regionalliga-ist-das-wettbewerb-oder-kann-das-weg--v1,regionalliga-zweitmannschaften-100.html
- ran.de: Welche Bundesliga-Profis sind in der 3. Liga spielberechtigt? – https://ran.joyn.de/sports/fussball/3-liga/3-liga-borussia-dortmund-und-vfb-stuttgart-im-abstiegskampf-welche-bundesliga-profis-sind-spielberechtigt-73620
- DFB: Veränderte Regelung für U23-Spieler in der 3. Liga (2025) – https://www.dfb.de/news/veraenderte-regelung-fuer-u-23-spieler-in-der-3-liga
- Wikipedia (en): 1993 DFB-Pokal final – https://en.wikipedia.org/wiki/1993_DFB-Pokal_final
- Wikipedia (en): DDR-Liga – https://en.wikipedia.org/wiki/DDR-Liga
- Wikipedia (en): Reserve team – https://en.wikipedia.org/wiki/Reserve_team
- Wikipedia (en): Italian reserve football teams – https://en.wikipedia.org/wiki/Italian_reserve_football_teams
- Sportskeeda: Spanish B teams and their eligibility – https://sportskeeda.com/football/spanish-b-teams-and-their-eligibility
- Wikipedia (en): 2016–17 EFL Trophy – https://en.wikipedia.org/wiki/2016%E2%80%9317_EFL_Trophy

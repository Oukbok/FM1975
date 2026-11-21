# Zweite Mannschaften (Amateure / U23 / „II“) – Regeln je Epoche

Umsetzung: `src/data/reserveRules.ts` (Regeln + Quellen), `src/game/reservePyramid.ts` (Pyramide, Auf-/Abstieg, Pokal),
`src/game/reserveTeam.ts` (eigene Mannschaft, Amateurliga), Anzeige `src/game/reserveView.ts` + `views/youth/ReserveTeamView.tsx`.

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
- **Portugal:** „B“-Teams 1999–2006 in der dritten Liga, seit 2012/13 in der Segunda Liga; nie in der Liga der ersten
  Mannschaft (kein Aufstieg in die Primeira Liga), von Taça de Portugal und Taça da Liga ausgeschlossen.
- **Frankreich:** Reserveteams höchstens vierte (mit Ausbildungszentrum) bzw. fünfte Ebene, Aufstieg geht sonst an
  den Nächsten; nicht im Coupe de France.

## Im Spiel (vereinfacht)
- KI-Vereine der 1./2. Liga haben je Epoche eine zweite Mannschaft (bis 2007/08 alle Erstligisten + ~70 % der
  Zweitligisten, 2008–2014 alle, danach ~80 % bzw. ~45 %); Stärke = Amateurniveau + Abstand des Stammvereins.
  Abgestiegene Vereine auf Ebene 3 behalten sie (höchstens Amateurliga), darunter melden sie ab.
- **Amateurligen** (`src/game/amateurLeagues.ts`): unterhalb der simulierten Ligen je Verbandsgruppe eine Staffel
  mit 18 Mannschaften (Nord, Berlin bzw. ab 1991 Nordost, Nordrhein, Westfalen, Südwest, Hessen, Baden-Württemberg,
  Bayern; Amateurliga → 1978 Amateur-Oberliga → 1994 Oberliga): zweite Mannschaften der Gruppe (höchstens acht),
  stärkste Pool-Vereine, Ortsvereine. Sonntags mit `worldMatchGoals`, nur Tabelle. Meister haben beim Pool-Tausch
  Vorrang (+40, dann −12 je Platz), zweite Mannschaften sind bis 1994 für die 2. Bundesliga gesperrt. 1991–94 liegt
  der Nordosten eine Ebene tiefer (unter der NOFV-Oberliga, „Verbandsliga Nordost“). Deine zweite Mannschaft spielt
  in der Staffel ihrer Gruppe (gleiche Besetzung).
- Beim Spielstart ab 1994 belegen bis zu drei zweite Mannschaften je Staffel die unterste simulierte Ebene.
- Obergrenze je Staffel vor 2008: sechs (Spielannahme), ab 2008 sieben, 3. Liga vier.
- **DFB-Pokal bis 2007/08**: bis zu drei zweite Mannschaften je Saison (deine bei Platz 1–3, KI nach Endplatz in
  Staffel/Amateurliga). Deine spielt mit ihrem echten Kader (`src/game/reserveCup.ts`: Auswahl wie am Liga-Sonntag,
  Vertragsamateure füllen auf, Profis am selben Tag gesperrt). **Pokalbindung** (Spielannahme): wer für die Amateure
  im Pokal gespielt hat, darf in der Saison im Pokal nicht mehr für die Profis spielen und umgekehrt. Eine
  ausdrückliche Regel dazu war in den heutigen Ordnungen nicht zu finden; die DFB-Spielordnung § 12 Nr. 1 regelt den
  Einsatz in zweiten Mannschaften bei DFB-Pokalspielen eigens (heute: U23 + bis zu drei Ältere) und verbietet
  Lizenzspieler in Landespokalspielen. KI-Amateure spielen mit Vertragsamateuren.
- Ab 2008 höchstens drei Spieler über 23 in der Elf deiner zweiten Mannschaft; die Stammspieler-Regel ist durch
  „wer in der Profi-Startelf steht, spielt nicht mit“ ersetzt.
- **DDR** (`src/game/ddrReserves.ts`): bis 1976 und 1984–1990 in der DDR-Liga ohne Aufstiegsrecht – im Spiel ist die
  DDR-Liga eine Staffel mit zwölf Vereinen, deshalb höchstens vier zweite Mannschaften; Zwangsabstieg, Abstieg =
  abgemeldet; 1976–1984 Nachwuchsoberliga aller Oberligisten (Tabelle); ab 1990/91 keine mehr.
- **Ausland** (`src/engine/worldReserves.ts`): B-Teams der Weltdaten (`…-ii`, Spanien/Portugal) höchstens 2. Liga, nie
  in oder über der Liga der ersten Mannschaft, Pokal nach Landesregel; auch in der eigenen Pyramide, wenn Spanien
  oder Portugal Heimatland ist. England/Italien/Frankreich: zweite Mannschaften unterhalb der simulierten Ebenen bzw.
  in eigenen Reserveligen – in der Hintergrund-Welt nicht geführt (sie bräuchten eigene Vereine mit Kadern im
  Weltpool, ohne sichtbaren Nutzen).

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
- Wikipedia (en): FC Porto B – https://en.wikipedia.org/wiki/FC_Porto_B
- DFB-Spielordnung (§ 12 Einsatz in zweiten Mannschaften, Pokalspiele) – https://assets.dfb.de/uploads/000/328/557/original_Heft_04_Spielordnung_Schiedsrichterordnung_20251128.pdf

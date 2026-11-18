# Verdeckte Ethnie je Land und Jahrzehnt (Wunsch Pascal)

Ziel: Das Aussehen (Gesichtsgruppe `Player.face`) passt zum Namen, und mit den Jahrzehnten
weichen Nationalität und Ethnie immer öfter voneinander ab – z. B. Kinder afrikanischer
Eltern in Frankreich oder England, Spieler mit Wurzeln auf dem Balkan in der Schweiz.
Umsetzung: `data/origins.ts` (`FACE_MIX`), Namen `data/ethnicity.ts`, alte Spielstände
`game/faceNameMigration.ts`. Grobe Werte genügen; entscheidend ist die Entwicklung 1975 → 2030.

## Quellen (abgerufen 11/2026)

- Big Think, „The multiculturalism of World Cup teams“ (Karte nach Pew/UN, WM 2018): Anteil der
  Kaderspieler mit Migrationswurzeln – Frankreich mehr als drei Viertel, Schweiz fast zwei
  Drittel, Belgien fast die Hälfte, England 48 %, Deutschland 39 %, Portugal 30 %, Spanien 17 %,
  Schweden 17 %, Dänemark 13 %, Island 4 %.
  https://bigthink.com/strange-maps/the-multiculturalism-of-world-cup-teams
- The Conversation, „Football and race relations have progressed a lot since Cyrille Regis's day“:
  in den 1970ern eine „kleine, aber wachsende“ schwarze britische Gruppe im Profifußball, heute
  rund ein Drittel der Profis mit schwarzen Wurzeln.
  https://theconversation.com/football-and-race-relations-have-progressed-a-lot-since-cyrille-regiss-day-but-not-enough-90274
- Irish Examiner (Black Footballers Partnership): 43 % der Spieler der Premier League sind
  schwarz (inkl. Ausländer). https://www.irishexaminer.com/sport/soccer/arid-41275759.html
- These Football Times, „How Surinamese migrants revolutionised Dutch football“: 2009 fast 150
  Spieler der Eredivisie mit surinamischen Wurzeln; ab den 1980ern Stars im Nationalteam.
  https://thesefootballtimes.co/2017/05/03/how-surinamese-migrants-revolutionised-dutch-football/
- swissinfo, „Switzerland: 12 nations, one team“ (EM 2016): 14 von 23 Spielern mit
  Migrationsgeschichte, etwa ein Drittel aus dem ehemaligen Jugoslawien (vier mit Wurzeln im
  Kosovo), dazu Kamerun und Elfenbeinküste.
  https://www.swissinfo.ch/eng/euro-2016_switzerland--12-nations--one-team/42215610
- bpb, „Migranten im deutschen Fußball und die vielfältige Nationalmannschaft der Männer“:
  WM 2010 fast 50 % des Kaders mit Migrationsbiografie (türkisch, ghanaisch, tunesisch,
  brasilianisch, spanisch, polnisch), 2024 rund 25 %; 1970er erste afrodeutsche Nationalspieler;
  Bundesliga 2022/23 rund 49 % Ausländer.
  https://www.bpb.de/themen/migration-integration/kurzdossiers/548692/migranten-im-deutschen-fussball-und-die-vielfaeltige-nationalmannschaft-der-maenner/
- Al Jazeera, „How immigration ‘made French football better’“ (2022): 17 von 23 Spielern des
  WM-Kaders 2018 hätten für mindestens ein anderes Land spielen dürfen; fünf der neun Spieler
  mit mehr als 100 Länderspielen haben außereuropäische Wurzeln.
  https://www.aljazeera.com/news/2022/11/30/how-immigration-made-french-football-better
- Bloomberg (2018): fünf der elf Startspieler Frankreichs im WM-Halbfinale 2018 im Ausland
  geboren bzw. mit Eltern aus dem Ausland.
  https://www.bloomberg.com/view/articles/2018-07-11/world-cup-2018-immigrant-players-key-for-france-u-k-belgium

## Herleitung

- Nationalteams liegen deutlich über dem Ligaschnitt (Auswahl der Besten, Großstädte).
  `FACE_MIX` beschreibt die Profis einer Nationalität, deshalb bewusst unter den WM-Werten 2018.
- „Migrationswurzeln“ schließt europäische Herkunft ein (Italiener in der Schweiz, Portugiesen
  in Frankreich, Polen in Deutschland). Die Gesichtsgruppe zählt nur, was man sieht – so ist
  z. B. ein Schweizer mit italienischen Eltern `suedeuropa`, ein Engländer mit irischen nicht.
- Ostblock (Polen, Tschechoslowakei, Ungarn, UdSSR/Russland) bis 1990 praktisch ohne
  Einwanderung, danach sehr wenig (Stützjahr 1990 = 100 % einheimisch).
- Deutschland: Vielfalt über eigene Herkünfte in der Mischung `MIX` (ger_tr, ger_af, ger_pl,
  ger_it, ger_yu) plus seit 2000 eine kleine Mischung bei `ger_modern`.

| Land | Stützjahr ≈ 20-Jährige | Anteil abweichend (Spiel, gerundet) |
|---|---|---|
| Frankreich | 1975 / 1995 / 2010 / 2025 | 14 % / 34 % / 48 % / 58 % |
| England | 1975 / 1990 / 2010 / 2025 | 3 % / 14 % / 30 % / 40 % |
| Niederlande | 1975 / 1990 / 2010 / 2025 | 5 % / 20 % / 32 % / 40 % |
| Belgien | 1975 / 1995 / 2010 / 2025 | 3 % / 18 % / 34 % / 46 % |
| Schweiz | 1975 / 1990 / 2005 / 2025 | 6 % / 12 % / 28 % / 42 % |
| Österreich | 1975 / 1995 / 2025 | 2 % / 8 % / 30 % |
| Schweden | 1975 / 2000 / 2025 | 2 % / 13 % / 26 % |
| Dänemark, Norwegen | 1975 / 1995 / 2025 | 0 % / 3 % / 16–20 % |
| Portugal | 1975 / 2000 / 2025 | 12 % / 20 % / 30 % (westafrikanische Wurzeln, Namen portugiesisch) |
| Spanien, Italien | 1975 / 2000 / 2025 | 0–1 % / 2–4 % / 12–16 % |
| Polen, Tschechien, Ungarn | 1990 / 2025 | 0 % / 3 % |

Gemessen mit `npm run test:ethnicity` (je Land und Jahr 500 erzeugte Spieler).

## Namen

- Weicht die Ethnie von der typischen der Herkunft ab, kommt der Nachname aus einer Herkunft
  dieser Ethnie: westafrika → Ghana/Nigeria/Kamerun (Frankreich, Belgien, Schweiz zuerst die
  frankophone Liste `fra_af`, Deutschland `ger_af`), nordafrika → Marokko, tuerkei → Türkei,
  balkan → Jugoslawien/Kroatien/Serbien, osteuropa → Polen/Tschechien/Ungarn/Russland,
  lateinamerika → Brasilien/Argentinien, ostasien → Japan/Korea, suedeuropa → Italien/Spanien/
  Portugal/Griechenland.
- Vorname: Je später der Jahrgang, desto öfter einer des Gastlandes (2./3. Generation):
  Jahrgang 1950 10 %, 1975 ≈ 36 %, 2000 ≈ 62 %, ab 2005 70 %.
- Ausnahmen, in denen die Ethnie am Namen nicht zu erkennen ist und der Landesname bleibt:
  Brasilien (afro-brasilianisch, europäische Wurzeln), Argentinien (italienisch/spanisch),
  Portugal (kapverdisch/angolanisch, lateinamerikanisch), Spanien (lateinamerikanisch),
  USA (afroamerikanisch), Niederlande (indonesisch-niederländisch).

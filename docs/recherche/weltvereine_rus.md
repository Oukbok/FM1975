# Weltvereine Russland (`rus`) – Recherche

Umfang: höchste Spielklasse Russlands 1992–2025/26 (Oberste Liga, ab 2001 Premjer-Liga), Pokalsieger/-finalist,
russische Europapokal-Teilnehmer. Vorgänger: Sowjetunion (`urs`, bis 1991).

## Saison-Schlüssel
- **1992–2010**: Meisterschaft im Kalenderjahr; Schlüssel = Jahr (wie bei `urs`). `euro` = Teilnehmer der
  Europapokal-Saison Y/Y+1 (Startrecht aus der Meisterschaft Y−1), `cup` = Pokalsieger mit Endspiel im Jahr Y
  (1992: letztes Endspiel des Pokals der UdSSR/GUS).
- **2011** = Übergangssaison 2011/12 (März 2011 bis Mai 2012), Pokal 2011/12, Europapokal 2011/12.
- **ab 2012** = Herbst-Frühjahr-Saison (2012 = 2012/13), Pokal und Europapokal derselben Saison.
  Der Pokal mit Endspiel im Mai 2011 fällt dadurch weg.
- Ab 2022: Ausschluss russischer Vereine aus den UEFA-Wettbewerben – `euro` leer.

## Quellen und Herkunft der Daten
- **Datensätze (geprüft)**: 2012/13–2023/24 Spielergebnisse aus `footballcsv/cache.footballdata` (`<saison>/ru.1.csv`),
  Tabellen berechnet (3 Punkte, Tordifferenz; Relegationsspiele herausgefiltert; Gleichstände nach direktem
  Vergleich können um einen Platz abweichen). 2025/26-Zusammensetzung aus dem RSSSF-Spiegel `tablesr/rus2026.txt`
  ([C]/[P]-Markierungen); Landesmeister-/CL-Teilnehmer bis 2016/17 aus `champs.csv`.
- **Aus Wissen, ungeprüft**: Tabellen 1992–2011/12 (Meister und Medaillenränge sicher, Mittelfeld und einzelne
  Auf-/Absteiger der 1990er unsicher), 2024/25 (Meister Krasnodar, Absteiger sicher; Mittelfeld unsicher),
  Pokalfinalisten der 1990er, UEFA-Pokal-/EL-/ECL-Teilnehmer.
- Prüfwürdige Quellen: Wikipedia „<Jahr> Russian Top League“ / „<Saison> Russian Premier League“, RSSSF `tablesr/rus<jj>.html`.

## Besonderheiten
- 1992: 20 Vereine in zwei Vorrundengruppen, danach Meister- und Abstiegsrunde (hier als Gesamtreihenfolge).
- Größen: 1993 18, 1994–1995 16, 1996–1997 18, ab 1998 16 Vereine.
- Torpedo Moskau / Torpedo-Luschniki (1996–1997) = ein Verein; Torpedo-ZIL → Torpedo-Metallurg → FK Moskau
  (aufgelöst 2010) = „Moskau Süd“. Saturn Ramenskoje nach 2010 aufgelöst; Tosno 2018 nach dem Pokalsieg aufgelöst.
- Uralmasch und Ural Jekaterinburg = ein Verein; Rostselmasch = FK Rostow; Spartak/Alanija Wladikawkas = ein Verein.

## Verfremdung
Moskauer Vereine wie bei der Sowjetunion: Rot-Weiß (Spartak), Blau (Dynamo, aus `europe.ts`), Rot-Blau (ZSKA),
Schwarz-Weiß (Torpedo), Rot-Grün (Lokomotive), Süd (Torpedo-ZIL/FK Moskau), Gelb (Asmaral). Zwei Vereine in
Krasnodar: Kuban „Krasnodar Gelb-Grün“, FK Krasnodar „Krasnodar“. Drei in Nischni Nowgorod nach Farben, zwei in
Togliatti, Sotschi und Machatschkala.

| Echter Name | ID | Spielname |
|---|---|---|
| Akron Togliatti | `rus-togliatti-schwarz-blau` | Togliatti Schwarz-Blau |
| Amkar Perm | `rus-perm` | Perm |
| Anschi Machatschkala | `rus-machatschkala` | Machatschkala |
| Arsenal Tula | `rus-tula` | Tula |
| Asmaral Moskau | `rus-moskau-gelb` | Moskau Gelb |
| Baltika Kaliningrad | `rus-kaliningrad` | Kaliningrad |
| Dinamo Machatschkala | `rus-machatschkala-blau` | Machatschkala Blau |
| Dinamo Stawropol | `rus-stawropol` | Stawropol |
| Dynamo Moskau | `rus-moskau-blau` | Moskau Blau |
| Fakel Woronesch | `rus-woronesch` | Woronesch |
| FK Chimki | `rus-chimki` | Chimki |
| FK Krasnodar | `rus-krasnodar` | Krasnodar |
| FK Nischni Nowgorod / Pari NN | `rus-nischni-nowgorod` | Nischni Nowgorod |
| FK Tambow | `rus-tambow` | Tambow |
| FK Tjumen | `rus-tjumen` | Tjumen |
| FK Tosno | `rus-tosno` | Tosno |
| FK Ufa | `rus-ufa` | Ufa |
| Gasowik/FK Orenburg | `rus-orenburg` | Orenburg |
| Jenissei Krasnojarsk | `rus-krasnojarsk` | Krasnojarsk |
| KAMAZ Nabereschnyje Tschelny | `rus-nabereschnyje-tschelny` | Nabereschnyje Tschelny |
| Krylja Sowetow Samara | `rus-samara` | Samara |
| Kuban Krasnodar | `rus-krasnodar-gelb-gruen` | Krasnodar Gelb-Grün |
| Lada Togliatti | `rus-togliatti` | Togliatti |
| Lokomotive Moskau | `rus-moskau-rot-gruen` | Moskau Rot-Grün |
| Lokomotive Nischni Nowgorod | `rus-nischni-nowgorod-rot-gruen` | Nischni Nowgorod Rot-Grün |
| Lutsch(-Energija) Wladiwostok | `rus-wladiwostok` | Wladiwostok |
| Mordowija Saransk | `rus-saransk` | Saransk |
| Okean Nachodka | `rus-nachodka` | Nachodka |
| PFK Sotschi | `rus-sotschi` | Sotschi |
| Rostselmasch / FK Rostow | `rus-rostow` | Rostow |
| Rotor Wolgograd | `rus-wolgograd` | Wolgograd |
| Rubin Kasan | `rus-kasan` | Kasan |
| Saturn Ramenskoje | `rus-ramenskoje` | Ramenskoje |
| Schemtschuschina Sotschi | `rus-sotschi-weiss-blau` | Sotschi Weiß-Blau |
| Schinnik Jaroslawl | `rus-jaroslawl` | Jaroslawl |
| Sibir Nowosibirsk | `rus-nowosibirsk` | Nowosibirsk |
| SKA-Chabarowsk | `rus-chabarowsk` | Chabarowsk |
| Sokol Saratow | `rus-saratow` | Saratow |
| Spartak Moskau | `rus-moskau-rot-weiss` | Moskau Rot-Weiß |
| Spartak Naltschik | `rus-naltschik` | Naltschik |
| Spartak/Alanija Wladikawkas | `rus-wladikawkas` | Wladikawkas |
| Tekstilschtschik Kamyschin | `rus-kamyschin` | Kamyschin |
| Terek / Achmat Grosny | `rus-grosny` | Grosny |
| Tom Tomsk | `rus-tomsk` | Tomsk |
| Torpedo Moskau (1996–1997 Torpedo-Luschniki) | `rus-moskau-schwarz-weiss` | Moskau Schwarz-Weiß |
| Torpedo-ZIL / Torpedo-Metallurg / FK Moskau | `rus-moskau-sued` | Moskau Süd |
| Tschernomorez Noworossijsk | `rus-noworossijsk` | Noworossijsk |
| Uralan Elista | `rus-elista` | Elista |
| Uralmasch / Ural Jekaterinburg | `rus-jekaterinburg` | Jekaterinburg |
| Wolga Nischni Nowgorod | `rus-nischni-nowgorod-blau` | Nischni Nowgorod Blau |
| Zenit Sankt Petersburg | `rus-sankt-petersburg` | Sankt Petersburg |
| ZSKA Moskau (CSKA) | `rus-moskau-rot-blau` | Moskau Rot-Blau |

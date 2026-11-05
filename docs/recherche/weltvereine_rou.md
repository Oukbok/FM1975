# Weltvereine Rumänien (`rou`) – Recherche

Umfang: Divizia A / Liga I jeder Saison 1975/76–2025/26, Pokalsieger/-finalist (Cupa României), rumänische
Europapokal-Teilnehmer. Schlüssel = Startjahr.

## Quellen und Herkunft der Daten
- **Datensätze (geprüft)**:
  - 2012/13–2023/24: Spielergebnisse `footballcsv/cache.footballdata` (`<saison>/ro.1.csv`), Tabellen berechnet.
    Ab 2015/16 Meister-/Abstiegsrunde mit halbierten Punkten: Meisterrunde (weniger Spiele) zuerst, innerhalb der
    Gruppen nach berechneten Punkten mit Wissen abgeglichen – mittlere Plätze können um 1–2 abweichen.
  - 2024/25: RSSSF-Spiegel `tablesr/roem2025.txt` (Hauptrunde und Meisterrunde; Abstiegsrunde nach Hauptrunde).
  - Landesmeister-/CL-Teilnehmer bis 2016/17: `champs.csv`.
- **Aus Wissen, ungeprüft**: Tabellen 1975/76–2011/12 (Meister, Pokalsieger und Vizemeister sicher; Mittelfeld,
  Absteiger und Ligagröße 2001/02–2005/06 unsicher; 1987/88 und 1988/89 nahezu gleich angesetzt),
  Pokalfinalisten, `cwc`/`uefa`/`el`/`ecl`, Ab-/Aufsteiger 2025.
- Prüfwürdige Quellen: Wikipedia „<Saison> Divizia A“ / „Liga I“, RSSSF `tablesr/roem<jj>.html`, romaniansoccer.ro.

## Besonderheiten
- Steaua Bukarest / FCSB: im Spiel ein Verein „Bukarest Rot-Blau“ (Namensstreit seit 2017 nicht abgebildet).
- Universitatea Craiova: der alte Verein (bis 2011) und CS Universitatea (ab 2013) = „Craiova“; FC U Craiova 1948
  (ab 2021 erstklassig) = „Craiova Weiß-Blau“.
- Viitorul Constanța spielt als „Ovidiu“ (Trainingszentrum) und heißt ab 2021 nach der Übernahme der Farul-Tradition
  „Constanța Orange“; der alte Farul-Verein bleibt „Constanța“.
- Astra Giurgiu spielte bis 2012 in Ploiești (im Spiel durchgehend Giurgiu).
- 2010/11: Politehnica Timișoara (Vizemeister) ohne Lizenz zwangsweise abgestiegen; 2012/13 Vaslui ausgeschlossen.
- Größen: 18 Vereine bis 2001/02, 16 bis 2005/06, 18 bis 2014/15, 14 (Play-offs) 2015/16–2019/20, 16 ab 2020/21.
- Victoria Bukarest (Polizeiverein) wurde nach der Revolution 1990 aufgelöst.

## Verfremdung
Übernommen aus `src/data/europe.ts` bzw. `worldSeed.ts`: Bukarest Rot-Blau (Steaua), Bukarest Rot-Weiß (Dinamo).
Weitere Bukarester Vereine nach Farbe bzw. Stadtteil (Weinrot = Rapid, Schwarz-Weiß = Sportul Studențesc,
Blau-Weiß = Progresul/Național, Colentina, Pantelimon). FC Hermannstadt heißt nach der Stadt „Sibiu“ (der Vereinsname
ist selbst ein Ortsname), Inter Sibiu „Sibiu Rot-Blau“.

| Echter Name | ID | Spielname |
|---|---|---|
| Academica Clinceni | `rou-clinceni` | Clinceni |
| ASA Târgu Mureș | `rou-targu-mures` | Târgu Mureș |
| Astra Giurgiu (bis 2012 Ploiești) | `rou-giurgiu` | Giurgiu |
| Ceahlăul Piatra Neamț | `rou-piatra-neamt` | Piatra Neamț |
| CFR Cluj | `rou-cluj-weinrot` | Cluj Weinrot |
| Chimia Râmnicu Vâlcea | `rou-ramnicu-valcea` | Râmnicu Vâlcea |
| Chindia Târgoviște | `rou-targoviste` | Târgoviște |
| Concordia Chiajna | `rou-chiajna` | Chiajna |
| Corona Brașov | `rou-brasov-blau` | Brașov Blau |
| Corvinul Hunedoara | `rou-hunedoara` | Hunedoara |
| CS Mioveni | `rou-mioveni` | Mioveni |
| CS Turnu Severin | `rou-turnu-severin` | Drobeta-Turnu Severin |
| Dacia Unirea Brăila | `rou-braila` | Brăila |
| Dinamo Bukarest | `rou-bukarest-rot-weiss` | Bukarest Rot-Weiß |
| Dunărea Călărași | `rou-calarasi` | Călărași |
| Farul Constanța (alter Verein) | `rou-constanta` | Constanța |
| FC Argeș Pitești | `rou-pitesti` | Pitești |
| FC Baia Mare | `rou-baia-mare` | Baia Mare |
| FC Bihor Oradea | `rou-oradea` | Oradea |
| FC Botoșani | `rou-botosani` | Botoșani |
| FC Brașov (FCM Brașov) | `rou-brasov` | Brașov |
| FC Hermannstadt | `rou-sibiu` | Sibiu |
| FC U Craiova 1948 | `rou-craiova-weiss-blau` | Craiova Weiß-Blau |
| FC Vaslui | `rou-vaslui` | Vaslui |
| FC Voluntari | `rou-voluntari` | Voluntari |
| FCM Galați / Oțelul Galați | `rou-galati` | Galați |
| FK Csíkszereda | `rou-miercurea-ciuc` | Miercurea Ciuc |
| Flacăra Moreni | `rou-moreni` | Moreni |
| Gaz Metan Mediaș | `rou-medias` | Mediaș |
| Gloria Bistrița | `rou-bistrita` | Bistrița |
| Gloria Buzău | `rou-buzau` | Buzău |
| Inter Sibiu | `rou-sibiu-rot-blau` | Sibiu Rot-Blau |
| Jiul Petroșani | `rou-petrosani` | Petroșani |
| Juventus București / Daco-Getica | `rou-bukarest-colentina` | Bukarest Colentina |
| Metaloglobus București | `rou-bukarest-pantelimon` | Bukarest Pantelimon |
| Olt Scornicești (FC Olt) | `rou-scornicesti` | Scornicești |
| Pandurii Târgu Jiu | `rou-targu-jiu` | Târgu Jiu |
| Petrolul Ploiești | `rou-ploiesti` | Ploiești |
| Politehnica Iași | `rou-iasi` | Iași |
| Politehnica Timișoara | `rou-timisoara` | Timișoara |
| Progresul / FC Național Bukarest | `rou-bukarest-blau-weiss` | Bukarest Blau-Weiß |
| Rapid Bukarest | `rou-bukarest-weinrot` | Bukarest Weinrot |
| SC Bacău (FCM Bacău) | `rou-bacau` | Bacău |
| Sepsi OSK | `rou-sfantu-gheorghe` | Sfântu Gheorghe |
| Sportul Studențesc | `rou-bukarest-schwarz-weiss` | Bukarest Schwarz-Weiß |
| Steaua Bukarest / FCSB | `rou-bukarest-rot-blau` | Bukarest Rot-Blau |
| Unirea / Apulum Alba Iulia | `rou-alba-iulia` | Alba Iulia |
| Unirea Slobozia | `rou-slobozia` | Slobozia |
| Unirea Urziceni | `rou-urziceni` | Urziceni |
| Universitatea Cluj | `rou-cluj-schwarz-weiss` | Cluj Schwarz-Weiß |
| Universitatea Craiova (CS U Craiova ab 2013) | `rou-craiova` | Craiova |
| UTA Arad | `rou-arad` | Arad |
| Victoria Bukarest | `rou-bukarest-blau` | Bukarest Blau |
| Viitorul / Săgeata Năvodari | `rou-navodari` | Năvodari |
| Viitorul Constanța (ab 2021 Farul Constanța) | `rou-ovidiu` | Ovidiu; später Constanța Orange ab 2021 |

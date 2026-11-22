# Weltvereine Polen (`pol`) – Recherche

Umfang: höchste Spielklasse (I liga, ab 2005/06 Ekstraklasa) jeder Saison 1975/76–2025/26, Pokalsieger/-finalist,
polnische Europapokal-Teilnehmer je Saison. Schlüssel = Startjahr (`1985` = 1985/86).

## Quellen und Herkunft der Daten
- **Datensätze (geprüft)**:
  - 2012/13–2023/24: Spielergebnisse aus `footballcsv/cache.footballdata` (`<saison>/pl.1.csv`, GitHub raw),
    Tabellen daraus berechnet (3 Punkte, Tordifferenz). 2013/14–2019/20 mit Meister-/Abstiegsrunde und
    halbierten Punkten: Reihenfolge innerhalb der Gruppen nach Wissen an die offizielle Tabelle angeglichen.
  - 2024/25: RSSSF-Spiegel `tablesp/pol2025.txt` (Abschlusstabelle; [C] = Titelverteidiger, [P] = Aufsteiger).
  - Landesmeister-Teilnehmer 1975/76–2016/17: `champs.csv` (`jalapic/engsoccerdata`).
- **Aus Wissen, ungeprüft**: Tabellen 1975/76–2011/12 (Meister, Vizemeister, Pokalsieger und die meisten
  Absteiger sicher; Reihenfolge der Mittelfeldplätze und einzelne Ab-/Aufsteiger unsicher, v. a. 1977–1992),
  Pokalfinalisten, alle `cwc`/`uefa`/`el`/`ecl`-Teilnehmer, Europapokal 2024/25 und 2025/26.
- Prüfwürdige Quellen: Wikipedia „<Saison> Ekstraklasa“ bzw. „<Saison> I liga“, RSSSF `tablesp/pol<jj>.html`,
  90minut.pl.

## Ligareformen / Besonderheiten
- 16 Vereine bis 1991/92, 18 Vereine 1992/93–1997/98, 16 Vereine 1998/99–2002/03, 14 Vereine 2003/04–2004/05,
  16 Vereine 2005/06–2020/21, 18 Vereine ab 2021/22. 3-Punkte-Regel ab 1995/96 (in den 1980ern zeitweise
  Zusatzpunkte für hohe Siege / Abzug bei Remis nach Elfmeterschießen – nicht abgebildet).
- 1992/93: Legia Warszawa und ŁKS Łódź wurden nach dem letzten Spieltag Punkte aberkannt; Meister Lech Poznań.
- 1999/2000: Meister Wisła Kraków für die Europapokal-Saison gesperrt (Messerwurf gegen Parma).
- 2001/02: Vorrundengruppen mit Meister-/Abstiegsrunde.
- 2006/07–2007/08: Zwangsabstiege wegen des Bestechungsskandals (Korona, Zagłębie Lubin u. a.).
- Fusionen: Amica Wronki → Lech Poznań (2006), Groclin Dyskobolia → Polonia Warszawa (2008); im Spiel getrennte
  Vereine, die jeweils enden.
- 2013/14–2019/20 Meister-/Abstiegsrunde (37 Spiele) mit Halbierung der Punkte.

## Verfremdung
Übernommen aus `src/data/europe.ts`: Chorzów (Ruch), Zabrze (Górnik). Deutsche Ortsnamen wo üblich (Warschau,
Krakau, Posen, Breslau, Stettin, Danzig, Kattowitz, Oppeln). Mehrere Vereine einer Stadt nach Farben bzw.
Stadtteil (Krakau Nowa Huta = Hutnik). Legia „Warschau Grün-Weiß“, Polonia „Warschau Schwarz-Weiß“,
Widzew „Łódź Rot“, ŁKS „Łódź Weiß“, Wisła „Krakau Rot“, Cracovia „Krakau Rot-Weiß“.

| Echter Name | ID | Spielname |
|---|---|---|
| Amica Wronki | `pol-wronki` | Wronki |
| Arka Gdynia | `pol-gdynia` | Gdynia |
| Bałtyk Gdynia | `pol-gdynia-blau` | Gdynia Blau-Weiß |
| Bruk-Bet Termalica Nieciecza | `pol-nieciecza` | Nieciecza |
| GKS Bełchatów | `pol-belchatow` | Bełchatów |
| GKS Katowice | `pol-kattowitz` | Kattowitz |
| GKS Tychy | `pol-tychy` | Tychy |
| Groclin Dyskobolia Grodzisk | `pol-grodzisk` | Grodzisk |
| Gwardia Warszawa | `pol-warschau-blau` | Warschau Blau |
| Górnik Wałbrzych | `pol-walbrzych` | Wałbrzych |
| Górnik Zabrze | `pol-zabrze` | Zabrze |
| Górnik Łęczna | `pol-leczna` | Łęczna |
| Hutnik Kraków | `pol-krakau-nowa-huta` | Krakau Nowa Huta |
| Igloopol Dębica | `pol-debica` | Dębica |
| Jagiellonia Białystok | `pol-bialystok` | Białystok |
| Korona Kielce | `pol-kielce` | Kielce |
| KS Cracovia | `pol-krakau-rot-weiss` | Krakau Rot-Weiß |
| KSZO Ostrowiec Świętokrzyski | `pol-ostrowiec` | Ostrowiec |
| Lech Poznań | `pol-posen` | Posen |
| Lechia Gdańsk | `pol-danzig` | Danzig |
| Legia Warszawa | `pol-warschau-gruen` | Warschau Grün-Weiß |
| Miedź Legnica | `pol-legnica` | Legnica |
| Motor Lublin | `pol-lublin` | Lublin |
| Odra Opole | `pol-oppeln` | Oppeln |
| Odra Wodzisław | `pol-wodzislaw` | Wodzisław |
| Olimpia Poznań | `pol-posen-rot` | Posen Rot |
| Piast Gliwice | `pol-gliwice` | Gliwice |
| Podbeskidzie Bielsko-Biała | `pol-bielsko` | Bielsko-Biała |
| Pogoń Szczecin | `pol-stettin` | Stettin |
| Polonia Bytom | `pol-bytom-blau` | Bytom Blau |
| Polonia Warszawa | `pol-warschau-schwarz` | Warschau Schwarz-Weiß |
| Puszcza Niepołomice | `pol-niepolomice` | Niepołomice |
| Radomiak Radom | `pol-radom` | Radom |
| Raków Częstochowa | `pol-czestochowa` | Częstochowa |
| ROW Rybnik | `pol-rybnik` | Rybnik |
| Ruch Chorzów | `pol-chorzow` | Chorzów |
| Ruch Radzionków | `pol-radzionkow` | Radzionków |
| Sandecja Nowy Sącz | `pol-nowy-sacz` | Nowy Sącz |
| Siarka Tarnobrzeg | `pol-tarnobrzeg` | Tarnobrzeg |
| Sokół Pniewy | `pol-pniewy` | Pniewy |
| Stal Mielec | `pol-mielec` | Mielec |
| Stal Rzeszów | `pol-rzeszow` | Rzeszów |
| Stal Stalowa Wola | `pol-stalowa-wola` | Stalowa Wola |
| Stilon Gorzów | `pol-gorzow` | Gorzów |
| Stomil Olsztyn | `pol-olsztyn` | Olsztyn |
| Szombierki Bytom | `pol-bytom-gruen` | Bytom Grün |
| Warta Poznań | `pol-posen-gruen` | Posen Grün |
| Widzew Łódź | `pol-lodz-rot` | Łódź Rot |
| Wisła Kraków | `pol-krakau-rot` | Krakau Rot |
| Wisła Płock (Petrochemia Płock) | `pol-plock` | Płock |
| Zagłębie Lubin | `pol-lubin` | Lubin |
| Zagłębie Sosnowiec | `pol-sosnowiec` | Sosnowiec |
| Zawisza Bydgoszcz | `pol-bydgoszcz` | Bydgoszcz |
| ŁKS Łódź | `pol-lodz-weiss` | Łódź Weiß |
| Śląsk Wrocław | `pol-breslau` | Breslau |
| Świt Nowy Dwór Mazowiecki | `pol-nowy-dwor` | Nowy Dwór |

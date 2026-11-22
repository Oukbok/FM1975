# Weltvereine Sowjetunion (`urs`) – Recherche

Umfang: Oberste Liga (t1) der UdSSR 1975–1991, Pokalsieger/-finalist, sowjetische Europapokal-Teilnehmer.
Danach Nachfolgestaaten Russland (`rus`) und Ukraine (`ukr`) ab 1992 (Existenz laut `src/data/world/countries.ts`).

## Saison-Schlüssel (Kalenderjahr-Saison)
Die sowjetische Meisterschaft lief im **Kalenderjahr** (Frühjahr bis Spätherbst). Schlüssel = Jahr, in dem die
Meisterschaft begann (`1985` = Meisterschaft 1985). Das passt zur Spiellogik „Stärke beim Start = Tabelle der
Vorsaison“: Wer 1985/86 startet, bekommt die Stärke aus der Meisterschaft 1984.
`euro` eines Schlüssels Y = sowjetische Teilnehmer der Europapokal-Saison **Y/Y+1** (die im Herbst Y begann).
Darin spielte im Landesmeister-Wettbewerb der Meister des Jahres **Y−1** (Abgleich mit `champs.csv`, s. u.).
- **1976**: zwei Meisterschaften – Frühjahr (Meister Dynamo Moskau, ohne Abstieg) und Herbst (Meister Torpedo
  Moskau, mit Abstieg). Eingetragen ist die **Herbstmeisterschaft**, weil nur sie Auf-/Abstieg und den
  Landesmeister-Startplatz 1977/78 bestimmte; die Frühjahrsrunde steht in `note`.
- Pokal: Sieger/Finalist des Endspiels im Jahr Y (ab 1988/89 lief der Pokal über den Jahreswechsel, Endspiel
  im Jahr Y).

## Quellen und Herkunft der Daten
- **Datensatz**: `champs.csv` aus `jalapic/engsoccerdata` (GitHub raw) – Teilnehmer am Europapokal der
  Landesmeister 1975/76–1991/92 (dort nach heutigen Ländern kodiert: UKR/RUS/GEO/BLR). Damit sind die
  `euro.ec`-Einträge **geprüft**.
- **Aus Wissen, ungeprüft** (Websuche in dieser Sitzung aufgebraucht, Wikipedia/RSSSF nicht erreichbar):
  alle Abschlusstabellen `t1`, Pokalsieger/-finalisten, `cwc`- und `uefa`-Teilnehmer.
  Sicher(er): Meister und Vizemeister jedes Jahres, Pokalsieger (bis auf 1989), Abstieg von Spartak Moskau 1976,
  Größen 16/18/13. Unsicher: Reihenfolge der Plätze 4–14, einzelne Auf-/Absteiger (v. a. 1975–1979 und
  1985–1989), UEFA-Pokal-Teilnehmer fast aller Jahre, Pokalwettbewerb der Pokalsieger 1978–1982
  (Startrecht teils mit einem Jahr Versatz).
- Prüfwürdige Quellen für eine spätere Korrektur: Wikipedia „<Jahr> Soviet Top League“, RSSSF
  `tablesu/ussr<jj>.html`, „Soviet Cup <Jahr>“.

## Ligareformen / Besonderheiten
- 16 Vereine 1975–1978, 18 Vereine 1979–1985, 16 Vereine 1986–1989, 13 Vereine 1990 (Austritt Žalgiris und
  der georgischen Vereine), 16 Vereine 1991. Remis-Begrenzung (Punkte nur für die ersten 8/10 Remis) in den
  Tabellen nicht abgebildet.
- 1990: Zorja Woroschilowgrad heißt nach der Rückbenennung der Stadt Luhansk; Spartak Ordschonikidse
  entsprechend Wladikawkas (`rename`).

## Verfremdung
Übernommen aus `src/data/europe.ts`: Kiew (Dynamo Kiew), Moskau Blau (Dynamo Moskau), Tiflis (Dinamo Tiflis).
Weitere Moskauer Vereine nach Farben: Rot-Weiß (Spartak), Rot-Blau (ZSKA), Schwarz-Weiß (Torpedo), Rot-Grün
(Lokomotive). SKA Rostow „Rostow Rot-Blau“. Städte mit sowjetischem Namen der Zeit (Leningrad, Kuibyschew,
Woroschilowgrad, Ordschonikidse, Alma-Ata).

| Echter Name | ID | Spielname |
|---|---|---|
| Ararat Jerewan | `urs-jerewan` | Jerewan |
| Dinamo Minsk | `urs-minsk` | Minsk |
| Dinamo Tbilisi | `urs-tiflis` | Tiflis |
| Dnipro Dnipropetrowsk | `urs-dnipropetrowsk` | Dnipropetrowsk |
| Dynamo Kyiv (Dinamo Kiew) | `urs-kiew` | Kiew |
| Dynamo Moskau | `urs-moskau-blau` | Moskau Blau |
| Fakel Woronesch | `urs-woronesch` | Woronesch |
| Guria Lantschchuti | `urs-lantschchuti` | Lantschchuti |
| Kairat Alma-Ata | `urs-alma-ata` | Alma-Ata |
| Karpaty Lwiw | `urs-lwiw` | Lwiw |
| Krylja Sowetow Kuibyschew (Samara) | `urs-kuibyschew` | Kuibyschew; später Samara ab 1991 |
| Kuban Krasnodar | `urs-krasnodar` | Krasnodar |
| Lokomotive Moskau | `urs-moskau-rot-gruen` | Moskau Rot-Grün |
| Metalist Charkiw | `urs-charkiw` | Charkiw |
| Metalurh Saporischschja | `urs-saporischschja` | Saporischschja |
| Neftschi Baku | `urs-baku` | Baku |
| Pachtakor Taschkent | `urs-taschkent` | Taschkent |
| Pamir Duschanbe | `urs-duschanbe` | Duschanbe |
| Rotor Wolgograd | `urs-wolgograd` | Wolgograd |
| Shakhtar Donetsk | `urs-donezk` | Donezk |
| SKA Rostow | `urs-rostow-rot-blau` | Rostow Rot-Blau |
| Sorja Woroschilowgrad (Luhansk) | `urs-woroschilowgrad` | Woroschilowgrad; später Luhansk ab 1990 |
| Spartak Moskau | `urs-moskau-rot-weiss` | Moskau Rot-Weiß |
| Spartak Ordschonikidse (Wladikawkas) | `urs-ordschonikidse` | Ordschonikidse; später Wladikawkas ab 1990 |
| Sudnobudiwnyk Nikolajew | `urs-nikolajew` | Nikolajew |
| Tawrija Simferopol | `urs-simferopol` | Simferopol |
| Torpedo Kutaissi | `urs-kutaissi` | Kutaissi |
| Torpedo Moskau | `urs-moskau-schwarz-weiss` | Moskau Schwarz-Weiß |
| Tschornomorez Odessa | `urs-odessa` | Odessa |
| Zenit Leningrad | `urs-leningrad` | Leningrad |
| ZSKA Moskau (CSKA) | `urs-moskau-rot-blau` | Moskau Rot-Blau |
| Žalgiris Vilnius | `urs-wilna` | Wilna |

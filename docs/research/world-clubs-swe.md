# Weltvereine Schweden (`swe`) – Recherche

Umfang: Allsvenskan (t1) 1975–2025, Pokal (Svenska Cupen) und Europapokal-Teilnehmer je Saison.

## Schlüssel = Jahr (Kalenderjahr-Saison)
Die Allsvenskan läuft im Kalenderjahr. **Schlüssel `Y` = Allsvenskan des Jahres `Y`** (z. B. 1976 → Schlüssel
1976). Begründung: Die zweite Hälfte der Saison `Y` liegt in der Spielzeit `Y/Y+1`, und der Meister von `Y`
spielt im Europapokal `Y+1/Y+2` – genau wie bei den Herbst-Frühjahr-Ligen (Meister von Schlüssel `Y` → `ec`/`cl`
in Schlüssel `Y+1`). `euro` von Schlüssel `Y` = Teilnehmer der Europapokalsaison `Y/Y+1`
(z. B. 1976: Malmö als Meister 1975 im Landesmeister-Pokal 1976/77).
**Pokal:** `cup` von Schlüssel `Y` = das Endspiel, das in der Spielzeit `Y/Y+1` (Juli–Juni) stattfand:
Endspiele im Frühjahr (bis 2000 und ab 2013) → Schlüssel = Endspieljahr − 1; Endspiele im Herbst
(2001–2011) → Schlüssel = Endspieljahr. In der Spielzeit 2000/01 gab es wegen der Umstellung kein Endspiel.

## Ligareformen
- 1975–1981: 14 Vereine. 1982–1990: 12 Vereine, Meister über Endrunde (SM-slutspel) – in `t1` steht der
  Meister vorn, der Rest nach der Ligatabelle. 1989 wurde der Verein aus Norrköping Meister, den Platz im
  Landesmeister-Pokal bekam der Ligasieger aus Malmö (laut Datensatz).
- 1991–1992: 10 Vereine, danach Meisterrunde (Mästerskapsserien); Reihenfolge = Meisterrunde, dann Rest.
- 1993–2007: 14 Vereine, ab 2008: 16 Vereine.
- 1999: Abstieg des Vereins aus Malmö (2000 zweitklassig). 2004: Örebro ohne Lizenz zwangsabgestiegen.

## Herkunft je Saison
- Meister 1975–2016 + `ec`/`cl` 1975–2017: Datensatz (champs.csv) bzw. daraus abgeleitet.
- 2023, 2024: Tabellen aus openfootball-Spielergebnissen berechnet (Datensatz).
- 2025: Meister aus RSSSF (Mjällby), Teilnehmer 2026 aus RSSSF; übrige Reihenfolge aus Wissen, ungeprüft.
- Alle übrigen Tabellen (Reihenfolge, Auf-/Absteiger) und alle Pokalsieger: aus Wissen, ungeprüft;
  besonders unsicher sind die Zusammensetzungen 1975–1992 und die mittleren Plätze.

## Verfremdung
Vorhandener Name übernommen: Malmö (`data/europe.ts` `eu_mal`). Mehrere Vereine einer Stadt mit Farbe:
Göteborg Blau/Grün-Schwarz/Rot-Blau/Gelb, Stockholm Blau/Schwarz-Gelb/Grün; Vereine mit Ortsteil- oder
Vereinsnamen nach ihrem Ort (Östers IF → Växjö, Elfsborg → Borås, Brage → Borlänge, Sirius → Uppsala,
Brommapojkarna → Bromma, Västra Frölunda → Göteborg Frölunda). Södertälje: zwei Vereine nach Farbe.
## Quellenlage dieser Sitzung (gilt für alle Länder dieses Strangs)
- Websuche/Wikipedia/RSSSF online waren in dieser Sitzung **nicht erreichbar** (Proxy 403). Genutzt wurden:
  1. `jalapic/engsoccerdata` `data-raw/champs.csv` (GitHub raw): alle Spiele im Europapokal der Landesmeister /
     Champions League 1955/56–2017/18 inkl. Qualifikation. Daraus je Saison die Teilnehmer des Landes →
     **`ec`/`cl` 1975–2017 aus dem Datensatz**, und damit eine Gegenprobe des Meisters der Vorsaison.
  2. `openfootball/europe` (GitHub, geklont): Spielergebnisse der jüngsten Saisons (2023–2025), daraus
     Abschlusstabellen berechnet (Punkte, Tordifferenz, Tore; Meister-/Abstiegsrunden zusammengezählt und
     nach Wissen in die Teilungsreihenfolge gebracht).
  3. RSSSF-Spiegel (lokal, nur 2024/25 bzw. 2025): Endtabellen/Meister der letzten Saison.
- Alles andere ist **„aus Wissen, ungeprüft“**: Meister und Pokalsieger mit hoher Sicherheit, Absteiger/
  Aufsteiger mittel, Reihenfolge der mittleren Plätze und frühe Zusammensetzungen (1970er/80er) **unsicher**.
- `cwc`/`uefa`/`el`/`ecl` sind, wo nicht ausdrücklich eingetragen, nach den Startplatzregeln aus Meister,
  Pokalsieger (bei Double der Finalist für den Pokalsieger-Wettbewerb) und den nächsten Ligaplätzen der
  Vorsaison abgeleitet (Anzahl je Epoche im Kopf der Spezifikation). Wechsel aus der Champions League in
  UEFA-Pokal/Europa League sind nicht systematisch erfasst. Europapokal-Teilnehmer aus tieferen Ligen
  (Pokalsieger aus der 2. Liga) stehen in `euro`, werden vom Spiel aber nur genutzt, wenn sie in `t1` stehen.
- Generiert aus einer Kurzspezifikation (Kürzel je Verein); IDs = `<cc>-<Spielname als Slug>`.

## Zuordnung echter Name → Spielname

| Echter Name | ID | Spielname |
|---|---|---|
| IK Brage | `swe-borlaenge` | Borlänge |
| Dalkurd FF | `swe-borlaenge-rot-gruen` | Borlänge Rot-Grün |
| IF Elfsborg | `swe-boraas` | Borås |
| IF Brommapojkarna | `swe-bromma` | Bromma |
| Degerfors IF | `swe-degerfors` | Degerfors |
| Enköpings SK | `swe-enkoeping` | Enköping |
| AFC Eskilstuna | `swe-eskilstuna` | Eskilstuna |
| Falkenbergs FF | `swe-falkenberg` | Falkenberg |
| Gefle IF | `swe-gaevle` | Gävle |
| IFK Göteborg | `swe-goeteborg-blau` | Göteborg Blau |
| Västra Frölunda IF | `swe-goeteborg-froelunda` | Göteborg Frölunda |
| BK Häcken | `swe-goeteborg-gelb` | Göteborg Gelb |
| GAIS | `swe-goeteborg-gruen-schwarz` | Göteborg Grün-Schwarz |
| Örgryte IS | `swe-goeteborg-rot-blau` | Göteborg Rot-Blau |
| Halmstads BK | `swe-halmstad` | Halmstad |
| Helsingborgs IF | `swe-helsingborg` | Helsingborg |
| Jönköpings Södra IF | `swe-joenkoeping` | Jönköping |
| Kalmar FF | `swe-kalmar` | Kalmar |
| Landskrona BoIS | `swe-landskrona` | Landskrona |
| Ljungskile SK | `swe-ljungskile` | Ljungskile |
| Malmö FF | `swe-malmoe` | Malmö |
| Mjällby AIF | `swe-mjaellby` | Mjällby |
| IFK Norrköping | `swe-norrkoeping` | Norrköping |
| Djurgårdens IF | `swe-stockholm-blau` | Stockholm Blau |
| Hammarby IF | `swe-stockholm-gruen` | Stockholm Grün |
| AIK | `swe-stockholm-schwarz-gelb` | Stockholm Schwarz-Gelb |
| GIF Sundsvall | `swe-sundsvall` | Sundsvall |
| Syrianska FC | `swe-soedertaelje-rot` | Södertälje Rot |
| Assyriska FF | `swe-soedertaelje-weiss` | Södertälje Weiß |
| Trelleborgs FF | `swe-trelleborg` | Trelleborg |
| Umeå FC | `swe-umeaa` | Umeå |
| IK Sirius | `swe-uppsala` | Uppsala |
| Varbergs BoIS | `swe-varberg` | Varberg |
| IFK Värnamo | `swe-vaernamo` | Värnamo |
| Västerås SK | `swe-vaesteraas` | Västerås |
| Östers IF | `swe-vaexjoe` | Växjö |
| Åtvidabergs FF | `swe-aatvidaberg` | Åtvidaberg |
| Örebro SK | `swe-oerebro` | Örebro |
| Östersunds FK | `swe-oestersund` | Östersund |

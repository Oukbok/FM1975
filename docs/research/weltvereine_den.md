# Weltvereine Dänemark (`den`) – Recherche

Umfang: höchste Liga (1. division bis 1990, Superliga ab 1991/92) 1975–2025, Pokal (Landspokal) und
Europapokal-Teilnehmer je Saison.

## Schlüssel
- 1975–1990: Kalenderjahr-Saison, **Schlüssel = Jahr** (Begründung wie Schweden: Meister von `Y` spielt im
  Europapokal `Y+1/Y+2` = Schlüssel `Y+1`; `euro` von Schlüssel `Y` = Teilnehmer der Europapokalsaison `Y/Y+1`).
- Frühjahr 1991: Übergangsrunde mit 10 Vereinen (Meister: Verein aus Brøndby) – **nicht erfasst**, da sie in
  keiner Spielzeit Juli–Juni vollständig liegt; ihr Meister steht als `ec` in Schlüssel 1991.
- Ab 1991/92 Herbst-Frühjahr: Schlüssel = Startjahr (1991 = 1991/92).
- Pokal: Endspiel im Mai → Schlüssel = Endspieljahr − 1 (gleiche Spielzeit).

## Ligareformen
1975–1990: 16 Vereine. 1991/92–1994/95: 10 Vereine (Herbstrunde + Meisterrunde). 1995/96–2015/16: 12.
2016/17–2019/20: 14 Vereine mit Meister-/Abstiegsrunden. Ab 2020/21: 12 Vereine mit Teilung nach 22 Spieltagen
(Reihenfolge = erst Meisterrunde, dann Abstiegsrunde). 1992: Fusion KB + B 1903 zum FC aus Kopenhagen.
1999: Fusion Ikast + Herning Fremad (Midtjylland, im Spiel „Herning“). HB Køge (2009, Fusion Herfølge + Køge)
läuft im Spiel unter der ID des Køge-Vereins weiter.

## Herkunft je Saison
- Meister 1974–2016 + `ec`/`cl` 1975–2017: Datensatz (champs.csv), Tabellenköpfe danach ausgerichtet.
- 2023/24, 2024/25: Tabellen aus openfootball-Ergebnissen berechnet (mit Teilung nachgeordnet), Pokal 2024/25
  und Aufsteiger 2025/26 aus openfootball/RSSSF. 2025/26 = Zusammensetzung zu Saisonbeginn.
- Alle übrigen Tabellen und Pokalsieger: aus Wissen, ungeprüft (1975–1990 und mittlere Plätze sehr unsicher).

## Verfremdung
Kopenhagen und Umland: FC København → „Kopenhagen“, KB → „Kopenhagen Frederiksberg“, B 93 →
„Kopenhagen Østerbro“, Frem → „Kopenhagen Valby“, Fremad Amager → „Amager“, Brønshøj → „Brønshøj“,
Brøndby IF → „Kopenhagen Gelb“ (Vereinsname gesperrt, Ort Brøndby), B 1903 → „Gentofte“, AB → „Gladsaxe“.
Odense: OB → „Odense“, B 1909 → „Odense Rot“, B 1913 → „Odense Hellblau“. Vereine mit Regionsnamen
nach ihrem Ort (Midtjylland → Herning, Nordsjælland → Farum, SønderjyskE → Haderslev, Vendsyssel → Hjørring).
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
| AaB | `den-aalborg` | Aalborg |
| AGF | `den-aarhus` | Aarhus |
| Fremad Amager | `den-amager` | Amager |
| Brønshøj BK | `den-broenshoej` | Brønshøj |
| Esbjerg fB | `den-esbjerg` | Esbjerg |
| FC Nordsjælland (bis 2003 Farum BK) | `den-farum` | Farum |
| FC Fredericia | `den-fredericia` | Fredericia |
| Frederikshavn fI | `den-frederikshavn` | Frederikshavn |
| B 1903 | `den-gentofte` | Gentofte |
| Akademisk Boldklub (AB) | `den-gladsaxe` | Gladsaxe |
| SønderjyskE | `den-haderslev` | Haderslev |
| FC Helsingør | `den-helsingoer` | Helsingør |
| Herfølge BK | `den-herfoelge` | Herfølge |
| FC Midtjylland (ab 1999, Fusion Ikast/Herning Fremad) | `den-herning` | Herning |
| Vendsyssel FF | `den-hjoerring` | Hjørring |
| Hobro IK | `den-hobro` | Hobro |
| Holbæk B&I | `den-holbaek` | Holbæk |
| AC Horsens | `den-horsens` | Horsens |
| Hvidovre IF | `den-hvidovre` | Hvidovre |
| Ikast FS | `den-ikast` | Ikast |
| F.C. København (ab 1992) | `den-kopenhagen` | Kopenhagen |
| Kjøbenhavns Boldklub (KB) | `den-kopenhagen-frederiksberg` | Kopenhagen Frederiksberg |
| Brøndby IF | `den-kopenhagen-gelb` | Kopenhagen Gelb |
| Boldklubben Frem | `den-kopenhagen-valby` | Kopenhagen Valby |
| B 93 | `den-kopenhagen-oesterbro` | Kopenhagen Østerbro |
| Køge BK; ab 2009 HB Køge (Fusion mit Herfølge BK) | `den-koege` | Køge |
| Lyngby BK | `den-lyngby` | Lyngby |
| Næstved IF / Næstved BK | `den-naestved` | Næstved |
| Odense Boldklub (OB) | `den-odense` | Odense |
| B 1913 | `den-odense-hellblau` | Odense Hellblau |
| B 1909 | `den-odense-rot` | Odense Rot |
| Randers Freja; ab 2003 Randers FC | `den-randers` | Randers |
| Silkeborg IF | `den-silkeborg` | Silkeborg |
| Vejle BK | `den-vejle` | Vejle |
| Viborg FF | `den-viborg` | Viborg |

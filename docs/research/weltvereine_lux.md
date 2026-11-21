# Weltvereine Luxemburg (`lux`) – Recherche

Umfang: Nationaldivision 1975–2025, Luxemburger Pokal (Coupe de Luxembourg) und Europapokal-Teilnehmer.

## Schlüssel
Herbst-Frühjahr-Saison: Schlüssel = Startjahr. Pokalendspiel im Frühjahr → Schlüssel = Endspieljahr − 1.
2019/20 abgebrochen ohne Meister (Reihenfolge = Stand beim Abbruch, angenommen), Pokal 2020 und 2021 nicht
ausgespielt; Pokalsieger 2024/25 nicht erfasst.

## Ligareformen
12 Vereine bis 2005/06 (in den 1990ern zeitweise 10 mit Meisterrunde – hier vereinfacht als 12 geführt),
14 Vereine 2006/07–2018/19, 16 Vereine ab 2019/20. Fusionen: 1991 Stade, Alliance und US Dudelange → F91
(„Düdelingen“); 2003 Red Boys + AS Differdange → FC Differdange 03 („Differdingen“, Vorgänger „Differdingen Rot“);
2005 Union, Spora und CA Spora-Nachfolger → Racing FC Union („Luxemburg“); 2015 Titus Pétange + Union Kayl-Tétange →
Union Titus Pétange (läuft unter „Petingen“ weiter).

## Herkunft je Saison
- Meister 1974/75–2014/15 + `ec`/`cl` 1975–2015: Datensatz (champs.csv; 1994–1996 ohne Einträge).
- 2023/24: aus openfootball-Ergebnissen berechnet; 2024/25: Endtabelle aus RSSSF.
- Übrige Tabellen, Pokalsieger und die Aufsteiger 2025/26: aus Wissen, ungeprüft (Mittelfeld und
  Zusammensetzungen der 1970er–1990er unsicher).

## Verfremdung
Deutsche Ortsnamen (Düdelingen, Differdingen, Petingen, Hesperingen, Rümelingen, Ettelbrück, Rodingen,
Bettemburg, Schifflingen, Monnerich). Esch: Jeunesse → „Esch Schwarz-Weiß“, Fola → „Esch Rot-Weiß“; Düdelingen vor 1991: Stade → „Düdelingen Stade“, Alliance → „Düdelingen Blau“.
Luxemburg-Stadt: Racing Union → „Luxemburg“, Union → „Luxemburg Blau“, Spora → „Luxemburg Blau-Gelb“,
Avenir Beggen → „Luxemburg Beggen“, Aris Bonnevoie → „Luxemburg Bonneweg“, RM Hamm Benfica → „Luxemburg Hamm“
(Stadtteile). Progrès → „Niederkorn“, Swift → „Hesperingen“, Victoria → „Rosport“, Etzella → „Ettelbrück“.
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
| SC Bettembourg | `lux-bettemburg` | Bettemburg |
| Jeunesse Canach | `lux-canach` | Canach |
| FC Differdange 03 | `lux-differdingen` | Differdingen |
| Red Boys Differdange | `lux-differdingen-rot` | Differdingen Rot |
| F91 Dudelange (ab 1991, Fusion Stade, Alliance, US Dudelange) | `lux-duedelingen` | Düdelingen |
| Alliance Dudelange | `lux-duedelingen-blau` | Düdelingen Blau |
| Stade Dudelange | `lux-duedelingen-stade` | Düdelingen Stade |
| Fola Esch | `lux-esch-rot-weiss` | Esch Rot-Weiß |
| Jeunesse Esch | `lux-esch-schwarz-weiss` | Esch Schwarz-Weiß |
| Etzella Ettelbruck | `lux-ettelbrueck` | Ettelbrück |
| CS Grevenmacher | `lux-grevenmacher` | Grevenmacher |
| Swift Hesperange | `lux-hesperingen` | Hesperingen |
| US Hostert | `lux-hostert` | Hostert |
| Union 05 Kayl-Tétange | `lux-kayl` | Kayl |
| UN Käerjéng 97 | `lux-kaeerjeng` | Käerjeng |
| Racing FC Union Luxembourg (ab 2005) | `lux-luxemburg` | Luxemburg |
| Avenir Beggen | `lux-luxemburg-beggen` | Luxemburg Beggen |
| Union Luxemburg | `lux-luxemburg-blau` | Luxemburg Blau |
| Spora Luxemburg | `lux-luxemburg-blau-gelb` | Luxemburg Blau-Gelb |
| Aris Bonnevoie | `lux-luxemburg-bonneweg` | Luxemburg Bonneweg |
| FC RM Hamm Benfica | `lux-luxemburg-hamm` | Luxemburg Hamm |
| FC Mamer 32 | `lux-mamer` | Mamer |
| Marisca Mersch | `lux-mersch` | Mersch |
| US Mondorf-les-Bains | `lux-mondorf` | Mondorf |
| FC Mondercange | `lux-monnerich` | Monnerich |
| Progrès Niederkorn | `lux-niederkorn` | Niederkorn |
| Titus Pétange / Union Titus Pétange | `lux-petingen` | Petingen |
| FC Rodange 91 | `lux-rodingen` | Rodingen |
| Victoria Rosport | `lux-rosport` | Rosport |
| US Rumelange | `lux-ruemelingen` | Rümelingen |
| FC Schifflange 95 | `lux-schifflingen` | Schifflingen |
| UNA Strassen | `lux-strassen` | Strassen |
| FC Wiltz 71 | `lux-wiltz` | Wiltz |

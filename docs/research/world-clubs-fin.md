# Weltvereine Finnland (`fin`) – Recherche

Umfang: Mestaruussarja / Futisliiga / Veikkausliiga 1975–2025, finnischer Pokal (Suomen Cup) und
Europapokal-Teilnehmer je Saison.

## Schlüssel = Jahr (Kalenderjahr-Saison)
Wie Schweden: Schlüssel `Y` = Saison `Y`; Meister von `Y` → `ec`/`cl` in Schlüssel `Y+1`; `euro` von
Schlüssel `Y` = Teilnehmer der Europapokalsaison `Y/Y+1`. Pokalendspiel im Herbst des Jahres → `cup`
Schlüssel = Endspieljahr.

## Ligareformen
12 Vereine (1975–1993), 14 (1994–1996), 10 (1997–1999), 12 (2000–2005), 14 (2006–2010), 12 (ab 2011;
ab 2020 mit Meister-/Abstiegsrunde, Reihenfolge nach der Teilung). 1996: Fusion Kuusysi + Reipas zu FC Lahti.

## Herkunft je Saison
- Meister 1974–2014 + `ec`/`cl` 1975–2015: Datensatz (champs.csv; 1994–1996 ohne Einträge, weil kleine Länder
  damals im UEFA-Pokal starteten – Meister aus Wissen).
- 2023, 2024: aus openfootball-Ergebnissen berechnet und nach Wissen in die Teilungsreihenfolge gebracht.
- 2025: Endtabelle und Pokalendspiel aus RSSSF.
- Übrige Tabellen und Pokalsieger: aus Wissen, ungeprüft (Mittelfeld und 1975–1990 unsicher).

## Verfremdung
Helsinki: HJK → „Helsinki Blau“, HIFK → „Helsinki Rot“, Jokerit → „Helsinki Nord“, Atlantis → „Helsinki Ost“,
FinnPa → „Helsinki Süd“, Gnistan → „Helsinki Oulunkylä“ (Stadtteil). Turku: TPS → „Turku Schwarz-Weiß“,
Inter → „Turku Blau-Schwarz“. Tampere: Ilves → „Tampere Gelb-Grün“, TPV → „Tampere Blau“, Tampere United →
„Tampere“. Lahti: Kuusysi → „Lahti Blau“, Reipas → „Lahti Rot“, FC Lahti → „Lahti“. Oulu: OPS → „Oulu Rot“,
AC Oulu → „Oulu“. Sonst Ortsname (Haka → Valkeakoski, Honka → Espoo, MyPa → Kouvola, Jaro → Jakobstad,
Jazz → Pori, Pallo-Iirot → Rauma).
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
| Ekenäs IF | `fin-ekenaes` | Ekenäs |
| FC Honka | `fin-espoo` | Espoo |
| HJK | `fin-helsinki-blau` | Helsinki Blau |
| FC Jokerit | `fin-helsinki-nord` | Helsinki Nord |
| Atlantis FC | `fin-helsinki-ost` | Helsinki Ost |
| IF Gnistan | `fin-helsinki-oulunkylae` | Helsinki Oulunkylä |
| HIFK | `fin-helsinki-rot` | Helsinki Rot |
| FinnPa | `fin-helsinki-sued` | Helsinki Süd |
| FF Jaro | `fin-jakobstad` | Jakobstad |
| JJK | `fin-jyvaeskylae` | Jyväskylä |
| PS Kemi | `fin-kemi` | Kemi |
| KPV | `fin-kokkola` | Kokkola |
| KTP | `fin-kotka` | Kotka |
| MyPa | `fin-kouvola` | Kouvola |
| KuPS | `fin-kuopio` | Kuopio |
| FC Lahti (ab 1996, Fusion Kuusysi + Reipas) | `fin-lahti` | Lahti |
| Kuusysi | `fin-lahti-blau` | Lahti Blau |
| Reipas | `fin-lahti-rot` | Lahti Rot |
| IFK Mariehamn | `fin-mariehamn` | Mariehamn |
| Mikkelin Palloilijat | `fin-mikkeli` | Mikkeli |
| AC Oulu | `fin-oulu` | Oulu |
| OPS | `fin-oulu-rot` | Oulu Rot |
| FC Jazz | `fin-pori` | Pori |
| Pallo-Iirot | `fin-rauma` | Rauma |
| RoPS | `fin-rovaniemi` | Rovaniemi |
| SJK | `fin-seinaejoki` | Seinäjoki |
| Tampere United | `fin-tampere` | Tampere |
| TPV | `fin-tampere-blau` | Tampere Blau |
| Ilves | `fin-tampere-gelb-gruen` | Tampere Gelb-Grün |
| FC Inter Turku | `fin-turku-blau-schwarz` | Turku Blau-Schwarz |
| TPS | `fin-turku-schwarz-weiss` | Turku Schwarz-Weiß |
| VPS | `fin-vaasa` | Vaasa |
| FC Haka | `fin-valkeakoski` | Valkeakoski |

# Weltvereine Island (`isl`) – Recherche

Umfang: höchste Liga (1. deild, ab 1997 Úrvalsdeild) 1975–2025, isländischer Pokal und Europapokal-Teilnehmer.

## Schlüssel = Jahr (Kalenderjahr-Saison)
Wie Schweden: Schlüssel `Y` = Saison `Y` (Mai–September); Meister von `Y` → `ec`/`cl` in Schlüssel `Y+1`;
`euro` von Schlüssel `Y` = Teilnehmer der Europapokalsaison `Y/Y+1`. Pokalendspiel im Spätsommer →
`cup` Schlüssel = Endspieljahr. 2020: Saison abgebrochen, Pokal nicht ausgespielt.

## Ligareformen
8 Vereine (1975–1976), 10 (1977–2007), 12 (ab 2008; ab 2022 mit Meister-/Abstiegsrunde, Reihenfolge nach
der Teilung).

## Herkunft je Saison
- Meister 1974–2014 + `ec`/`cl` 1975–2015: Datensatz (champs.csv; 1994–1996 ohne Einträge).
- 2023, 2024: aus openfootball-Ergebnissen berechnet, nach Wissen in die Teilungsreihenfolge gebracht.
- 2025: Teilnehmer aus openfootball; Meister (Víkingur → „Reykjavík Rot-Schwarz“), Reihenfolge und Pokal
  (Vestri → „Ísafjörður“) aus Wissen, ungeprüft.
- Übrige Tabellen und Pokalsieger: aus Wissen, ungeprüft (Mittelfeld und Zusammensetzungen unsicher).

## Verfremdung
Reykjavík: Valur → „Reykjavík Rot“, KR → „Reykjavík Schwarz-Weiß“, Fram → „Reykjavík Blau“, Víkingur →
„Reykjavík Rot-Schwarz“, Þróttur → „Reykjavík Laugardalur“, Fylkir → „Reykjavík Árbær“, Leiknir →
„Reykjavík Breiðholt“, Fjölnir → „Reykjavík Grafarvogur“, ÍR → „Reykjavík Süd“ (Stadtteile).
Kópavogur: Breiðablik → „Kópavogur Grün“, HK → „Kópavogur Rot“. Hafnarfjörður: FH → „Hafnarfjörður
Schwarz-Weiß“, Haukar → „Hafnarfjörður Rot“. Akureyri: KA → „Akureyri Gelb-Blau“, Þór → „Akureyri Rot-Weiß“.
Stjarnan → „Garðabær“, ÍBV → „Vestmannaeyjar“, Vestri/ÍBÍ → „Ísafjörður“, sonst Ortsname.
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
| ÍA | `isl-akranes` | Akranes |
| KA | `isl-akureyri-gelb-blau` | Akureyri Gelb-Blau |
| Þór Akureyri | `isl-akureyri-rot-weiss` | Akureyri Rot-Weiß |
| Skallagrímur | `isl-borgarnes` | Borgarnes |
| Stjarnan | `isl-gardabaer` | Garðabær |
| Víðir | `isl-gardur` | Garður |
| Grindavík | `isl-grindavik` | Grindavík |
| Haukar | `isl-hafnarfjoerdur-rot` | Hafnarfjörður Rot |
| FH | `isl-hafnarfjoerdur-schwarz-weiss` | Hafnarfjörður Schwarz-Weiß |
| Völsungur | `isl-husavik` | Húsavík |
| ÍBK / Keflavík | `isl-keflavik` | Keflavík |
| Breiðablik | `isl-kopavogur-gruen` | Kópavogur Grün |
| HK | `isl-kopavogur-rot` | Kópavogur Rot |
| Afturelding | `isl-mosfellsbaer` | Mosfellsbær |
| Fram | `isl-reykjavik-blau` | Reykjavík Blau |
| Leiknir R. | `isl-reykjavik-breidholt` | Reykjavík Breiðholt |
| Fjölnir | `isl-reykjavik-grafarvogur` | Reykjavík Grafarvogur |
| Þróttur | `isl-reykjavik-laugardalur` | Reykjavík Laugardalur |
| Valur | `isl-reykjavik-rot` | Reykjavík Rot |
| Víkingur | `isl-reykjavik-rot-schwarz` | Reykjavík Rot-Schwarz |
| KR | `isl-reykjavik-schwarz-weiss` | Reykjavík Schwarz-Weiß |
| ÍR | `isl-reykjavik-sued` | Reykjavík Süd |
| Fylkir | `isl-reykjavik-arbaer` | Reykjavík Árbær |
| Selfoss | `isl-selfoss` | Selfoss |
| Grótta | `isl-seltjarnarnes` | Seltjarnarnes |
| ÍBV | `isl-vestmannaeyjar` | Vestmannaeyjar |
| ÍBÍ / BÍ/Bolungarvík / Vestri | `isl-isafjoerdur` | Ísafjörður |
| Leiftur | `isl-olafsfjoerdur` | Ólafsfjörður |

# Weltvereine Nordirland (`nir`) – Recherche

Umfang: Irish League / Premier Division / Premiership 1975–2025, Irish Cup und Europapokal-Teilnehmer je Saison.

## Schlüssel
Herbst-Frühjahr-Saison: Schlüssel = Startjahr (1975 = 1975/76). Pokalendspiel im Frühjahr → Schlüssel =
Endspieljahr − 1.

## Ligareformen
12 Vereine (1975/76–1982/83), 14 (1983/84–1989/90), 16 (1990/91–1994/95), Premier Division mit 8 Vereinen
(1995/96–2002/03), Premier League 16 (2003/04–2007/08), Premiership 12 mit Teilung (ab 2008/09; Reihenfolge
nach der Teilung).

## Herkunft je Saison
- Meister 1974/75–2016/17 + `ec`/`cl` 1975–2017: Datensatz (champs.csv; dort fälschlich ebenfalls unter
  Nordirland geführte Teilnahmen des Vereins aus Derry gehören zu Irland und sind dort eingetragen).
- 2023/24, 2024/25: aus openfootball-Ergebnissen berechnet und nach der Teilung geordnet.
- Übrige Tabellen und Pokalsieger: aus Wissen, ungeprüft (Zusammensetzung 1975–1995 und Mittelfeld unsicher).
- 2025/26: Zusammensetzung zu Saisonbeginn (Aufsteiger Bangor angenommen).

## Verfremdung
Belfast: Linfield → „Belfast Blau“, Glentoran → „Belfast Grün-Rot“, Crusaders → „Belfast Rot-Schwarz“,
Cliftonville → „Belfast Rot-Weiß“, Donegal Celtic → „Belfast West“. Distillery → „Lisburn“, Glenavon →
„Lurgan“, Ards → „Newtownards“, Carrick Rangers → „Carrickfergus“, Institute → „Drumahoe“, sonst Ortsname.
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
| Armagh City | `nir-armagh` | Armagh |
| Ballinamallard United | `nir-ballinamallard` | Ballinamallard |
| Ballymena United | `nir-ballymena` | Ballymena |
| Bangor | `nir-bangor` | Bangor |
| Linfield | `nir-belfast-blau` | Belfast Blau |
| Glentoran | `nir-belfast-gruen-rot` | Belfast Grün-Rot |
| Crusaders | `nir-belfast-rot-schwarz` | Belfast Rot-Schwarz |
| Cliftonville | `nir-belfast-rot-weiss` | Belfast Rot-Weiß |
| Donegal Celtic | `nir-belfast-west` | Belfast West |
| Carrick Rangers | `nir-carrickfergus` | Carrickfergus |
| Coleraine | `nir-coleraine` | Coleraine |
| Institute | `nir-drumahoe` | Drumahoe |
| Dungannon Swifts | `nir-dungannon` | Dungannon |
| Larne | `nir-larne` | Larne |
| Limavady United | `nir-limavady` | Limavady |
| Distillery / Lisburn Distillery | `nir-lisburn` | Lisburn |
| Loughgall | `nir-loughgall` | Loughgall |
| Glenavon | `nir-lurgan` | Lurgan |
| Newry City | `nir-newry` | Newry |
| Ards | `nir-newtownards` | Newtownards |
| Omagh Town | `nir-omagh` | Omagh |
| Portadown | `nir-portadown` | Portadown |
| Warrenpoint Town | `nir-warrenpoint` | Warrenpoint |

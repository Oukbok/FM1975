# Weltvereine Irland (`irl`) – Recherche

Umfang: League of Ireland (bis 1984/85 eine Liga, ab 1985/86 Premier Division) 1975–2025, FAI-Pokal und
Europapokal-Teilnehmer je Saison.

## Schlüssel
- Bis 2002/03 Herbst-Frühjahr: Schlüssel = Startjahr (1975 = 1975/76).
- 2002/03: verkürzte Übergangssaison (Juli 2002 – Januar 2003) → Schlüssel 2002.
- Ab 2003 Kalenderjahr: **Schlüssel = Jahr** (der Meister von `Y` spielt in Schlüssel `Y+1` in der
  Champions League; passt zur Herbst-Frühjahr-Logik davor: Meister 2002/03 → Schlüssel 2003).
- Pokal: Endspiel im Frühjahr bis 2002 (Schlüssel = Endspieljahr − 1), ab 2003 im Herbst (Schlüssel =
  Endspieljahr). In der Spielzeit 2002/03 kein Endspiel.

## Ligareformen
14 Vereine (1975/76–1976/77), 16 (1977/78–1984/85), Premier Division 12 (1985/86–2001/02, ab 1992/93 mit
Teilung), 10 (2002/03–2006), 12 (2007–2008), 10 (2009–2011), 12 (2012–2017), 10 (ab 2018).
2006: Meister aus Dublin (Shelbourne) aus finanziellen Gründen in die zweite Liga versetzt; der
Champions-League-Platz 2007/08 ging an Derry. 2009: Cork City wegen Lizenz zurückgestuft.
Derry (Nordirland) spielt seit 1985/86 in der irischen Liga und wird daher hier geführt.

## Herkunft je Saison
- Meister 1974/75–2016 + `ec`/`cl` 1975–2017: Datensatz (champs.csv; Derry steht dort unter Nordirland).
- 2023, 2024: Tabellen aus openfootball-Ergebnissen berechnet; 2025: Endtabelle + Pokalendspiel aus RSSSF.
- Übrige Tabellen und Pokalsieger: aus Wissen, ungeprüft (Reihenfolge der unteren Hälfte, Zusammensetzung
  1975–1985 unsicher).

## Verfremdung
Dublin: Bohemians → „Dublin Rot-Schwarz“, Shamrock Rovers → „Dublin Grün“, Shelbourne → „Dublin Rot“,
St Patrick's Athletic → „Dublin Inchicore“ (Stadtteil), Home Farm → „Dublin Drumcondra“, UCD →
„Dublin Universität“, Sporting Fingal → „Fingal“. Cork: Cork City → „Cork“, Cork Hibernians → „Cork Grün-Weiß“,
Cork Celtic → „Cork Weiß“. Finn Harps → „Ballybofey“, sonst Ortsname.
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
| Athlone Town | `irl-athlone` | Athlone |
| Finn Harps | `irl-ballybofey` | Ballybofey |
| Bray Wanderers | `irl-bray` | Bray |
| Cobh Ramblers | `irl-cobh` | Cobh |
| Cork City | `irl-cork` | Cork |
| Cork Hibernians | `irl-cork-gruen-weiss` | Cork Grün-Weiß |
| Cork Celtic | `irl-cork-weiss` | Cork Weiß |
| Derry City | `irl-derry` | Derry |
| Drogheda United | `irl-drogheda` | Drogheda |
| Home Farm | `irl-dublin-drumcondra` | Dublin Drumcondra |
| Shamrock Rovers | `irl-dublin-gruen` | Dublin Grün |
| St Patrick's Athletic | `irl-dublin-inchicore` | Dublin Inchicore |
| Shelbourne | `irl-dublin-rot` | Dublin Rot |
| Bohemians | `irl-dublin-rot-schwarz` | Dublin Rot-Schwarz |
| University College Dublin (UCD) | `irl-dublin-universitaet` | Dublin Universität |
| Dundalk | `irl-dundalk` | Dundalk |
| Sporting Fingal | `irl-fingal` | Fingal |
| Galway Rovers / Galway United | `irl-galway` | Galway |
| EMFA / Kilkenny City | `irl-kilkenny` | Kilkenny |
| Limerick (Limerick United/City) | `irl-limerick` | Limerick |
| Longford Town | `irl-longford` | Longford |
| Monaghan United | `irl-monaghan` | Monaghan |
| Sligo Rovers | `irl-sligo` | Sligo |
| Thurles Town | `irl-thurles` | Thurles |
| Waterford (United) | `irl-waterford` | Waterford |
| Wexford Youths | `irl-wexford` | Wexford |

# Weltvereine Norwegen (`nor`) – Recherche

Umfang: höchste Liga (1. divisjon, ab 1990 Tippeligaen, ab 2017 Eliteserien) 1975–2025, Pokal (NM) und
Europapokal-Teilnehmer je Saison.

## Schlüssel = Jahr (Kalenderjahr-Saison)
Wie Schweden: Schlüssel `Y` = Saison `Y`; Meister von `Y` → `ec`/`cl` in Schlüssel `Y+1`; `euro` von
Schlüssel `Y` = Teilnehmer der Europapokalsaison `Y/Y+1`. Der Pokal endet im Herbst → `cup` Schlüssel =
Endspieljahr. 2020: Pokal ausgefallen. Pokal 2021/22 (Endspiel Mai 2022) → Schlüssel 2021; 2022 (Endspiel
Dezember 2022) → Schlüssel 2022.

## Ligareformen
1975–1994: 12 Vereine, 1995–2008: 14, ab 2009: 16 (mit Relegationsspiel des 14.).

## Herkunft je Saison
- Meister 1974–2016 + `ec`/`cl` 1975–2017: Datensatz (champs.csv).
- 2023, 2024: Tabellen aus openfootball-Ergebnissen berechnet. 2025: Teilnehmer aus openfootball,
  Meister (Stavanger) und Reihenfolge aus Wissen, ungeprüft.
- Übrige Tabellen und Pokalsieger: aus Wissen, ungeprüft (1975–1990 und mittlere Plätze sehr unsicher).

## Verfremdung
Oslo: Vålerenga → „Oslo Blau-Rot“, Lyn → „Oslo Rot“, Skeid → „Oslo Nord“, KFUM → „Oslo Ekeberg“.
Trondheim: Rosenborg → „Trondheim“, Strindheim → „Trondheim Strinda“, Ranheim (Ortsteil) → „Ranheim“.
Bergen: Brann → „Bergen“, Fyllingen → „Fyllingsdalen“. Vereinsnamen → Ort: Viking → Stavanger,
Start → Kristiansand, Odd → Skien, Hødd → Ulsteinvik, Stabæk → Bærum, Strømsgodset → Drammen,
Bodø/Glimt → Bodø, Jerv → Grimstad, HamKam → Hamar.
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
| SK Brann | `nor-bergen` | Bergen |
| FK Bodø/Glimt | `nor-bodoe` | Bodø |
| Bryne FK | `nor-bryne` | Bryne |
| Stabæk | `nor-baerum` | Bærum |
| Strømsgodset IF | `nor-drammen` | Drammen |
| Fredrikstad FK | `nor-fredrikstad` | Fredrikstad |
| Fyllingen | `nor-fyllingsdalen` | Fyllingsdalen |
| FK Jerv | `nor-grimstad` | Grimstad |
| Hamarkameratene | `nor-hamar` | Hamar |
| FK Haugesund | `nor-haugesund` | Haugesund |
| Hønefoss BK | `nor-hoenefoss` | Hønefoss |
| Kongsvinger IL | `nor-kongsvinger` | Kongsvinger |
| IK Start | `nor-kristiansand` | Kristiansand |
| Kristiansund BK | `nor-kristiansund` | Kristiansund |
| Lillestrøm SK | `nor-lillestroem` | Lillestrøm |
| Mjøndalen IF | `nor-mjoendalen` | Mjøndalen |
| Molde FK | `nor-molde` | Molde |
| Moss FK | `nor-moss` | Moss |
| Vålerenga | `nor-oslo-blau-rot` | Oslo Blau-Rot |
| KFUM Oslo | `nor-oslo-ekeberg` | Oslo Ekeberg |
| Skeid | `nor-oslo-nord` | Oslo Nord |
| Lyn | `nor-oslo-rot` | Oslo Rot |
| Ranheim | `nor-ranheim` | Ranheim |
| Sandefjord Fotball | `nor-sandefjord` | Sandefjord |
| Sarpsborg 08 (1970er: Sarpsborg FK) | `nor-sarpsborg` | Sarpsborg |
| Odd (Odds BK) | `nor-skien` | Skien |
| Sogndal | `nor-sogndal` | Sogndal |
| Viking FK | `nor-stavanger` | Stavanger |
| Tromsø IL | `nor-tromsoe` | Tromsø |
| Rosenborg BK | `nor-trondheim` | Trondheim |
| Strindheim IL | `nor-trondheim-strinda` | Trondheim Strinda |
| Eik-Tønsberg | `nor-toensberg` | Tønsberg |
| IL Hødd | `nor-ulsteinvik` | Ulsteinvik |
| Aalesunds FK | `nor-aalesund` | Ålesund |

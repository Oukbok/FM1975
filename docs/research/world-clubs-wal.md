# Weltvereine Wales (`wal`) – Recherche

Umfang: League of Wales / Welsh Premier League / Cymru Premier **ab 1992/93** (Schlüssel 1992–2025), walisischer
Pokal (soweit Sieger aus der walisischen Liga) und Europapokal-Teilnehmer.

## Warum keine Saisons 1975–1991
Eine eigene walisische Liga gibt es erst seit 1992/93. Davor spielten die großen walisischen Vereine in
England (im Spiel bereits als englische Vereine erfasst: Cardiff, Swansea, Wrexham – `data/world/clubs/eng.ts`)
und vertraten Wales nur über den walisischen Pokal im Europapokal der Pokalsieger. Ein Datensatz ohne `t1`
wird vom Spiel nicht genutzt (`worldSeason` verlangt mindestens zwei Ligavereine), und dieselben Vereine
zusätzlich als walisische IDs zu führen, würde sie im Hintergrund-Europa doppeln. Für Wales bleibt das Land
1975–1991 daher ohne Daten (wie bisher ohne Hintergrundliga). Zur Information die walisischen Teilnehmer im
Pokalsieger-Wettbewerb 1975/76–1991/92 (aus Wissen, ungeprüft): überwiegend die Vereine aus Cardiff, Wrexham
und Swansea, vereinzelt Newport (1980/81) und Bangor (1985/86).
- 1993 (Cardiff) und 1995 (Wrexham) gewannen noch Vereine der englischen Liga den Pokal – dort kein `cup`.

## Schlüssel
Herbst-Frühjahr-Saison: Schlüssel = Startjahr. Pokalendspiel im Frühjahr → Schlüssel = Endspieljahr − 1.
2019/20 abgebrochen, Pokal 2020 und 2021 ausgefallen.

## Ligareformen
20 Vereine (1992/93–1996/97, zeitweise 21), danach 16–18, ab 2010/11 12 Vereine mit Teilung nach 22 Spieltagen
(Reihenfolge nach der Teilung).

## Herkunft je Saison
- Meister + `ec`/`cl` 1993–2015: Datensatz (champs.csv); 1994–1996 ohne Einträge (UEFA-Pokal-Vorrunde).
- 2023/24: aus openfootball-Ergebnissen, 2024/25: Endstand, Pokal und Ligapokal aus RSSSF.
- Übrige Tabellen, Pokalsieger und Aufsteiger 2025/26: aus Wissen, ungeprüft – die Zusammensetzungen der
  großen Ligen 1992–2010 (16–20 Vereine) sind besonders unsicher.

## Verfremdung
Vereine heißen nach ihrem Ort. Llansantffraid/Total Network Solutions/The New Saints → „Llansantffraid“, ab
2007 (Umzug) „Oswestry“; Inter Cardiff/Inter CableTel → „Cardiff Ost“, Cardiff Met → „Cardiff Universität“;
Airbus UK → „Broughton“; Afan Lido → „Aberavon“ (Stadtteil von Port Talbot, daneben „Port Talbot“);
Cefn Druids → „Cefn Mawr“; Penybont → „Bridgend“.
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
| Afan Lido | `wal-aberavon` | Aberavon |
| Aberystwyth Town | `wal-aberystwyth` | Aberystwyth |
| Bala Town | `wal-bala` | Bala |
| Bangor City | `wal-bangor` | Bangor |
| Barry Town (United) | `wal-barry` | Barry |
| Penybont | `wal-bridgend` | Bridgend |
| Briton Ferry (Athletic / Llansawel) | `wal-briton-ferry` | Briton Ferry |
| Airbus UK Broughton | `wal-broughton` | Broughton |
| Caernarfon Town | `wal-caernarfon` | Caernarfon |
| Caersws | `wal-caersws` | Caersws |
| Inter Cardiff / Inter CableTel / Cardiff Grange Harlequins | `wal-cardiff-ost` | Cardiff Ost |
| Cardiff Metropolitan University | `wal-cardiff-universitaet` | Cardiff Universität |
| Carmarthen Town | `wal-carmarthen` | Carmarthen |
| Cefn Druids | `wal-cefn-mawr` | Cefn Mawr |
| Colwyn Bay | `wal-colwyn-bay` | Colwyn Bay |
| Connah's Quay Nomads | `wal-connah-s-quay` | Connah's Quay |
| Conwy United/Borough | `wal-conwy` | Conwy |
| Cwmbran Town | `wal-cwmbran` | Cwmbran |
| Ebbw Vale | `wal-ebbw-vale` | Ebbw Vale |
| Flint Town United | `wal-flint` | Flint |
| Haverfordwest County | `wal-haverfordwest` | Haverfordwest |
| Holywell Town | `wal-holywell` | Holywell |
| Llandudno | `wal-llandudno` | Llandudno |
| Llanelli (AFC/Town) | `wal-llanelli` | Llanelli |
| Llansantffraid / Total Network Solutions / The New Saints | `wal-llansantffraid` | Llansantffraid |
| Maesteg Park | `wal-maesteg` | Maesteg |
| Newtown | `wal-newtown` | Newtown |
| Pontypridd (Town/United) | `wal-pontypridd` | Pontypridd |
| Port Talbot Town | `wal-port-talbot` | Port Talbot |
| Prestatyn Town | `wal-prestatyn` | Prestatyn |
| Rhayader Town | `wal-rhayader` | Rhayader |
| Rhyl | `wal-rhyl` | Rhyl |
| Ton Pentre | `wal-ton-pentre` | Ton Pentre |
| Welshpool Town | `wal-welshpool` | Welshpool |

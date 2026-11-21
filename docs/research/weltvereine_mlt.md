# Weltvereine mlt – Malta (Premier League / First Division)

Echte Vereinsnamen stehen **nur hier**. Datenformat: `docs/specs/WELTDATEN_SPEC.md`.
Erfasst: `t1` je Saison, Landespokal (soweit bekannt), Europapokal-Teilnehmer. Keine 2. Liga.

## Quellen

- **1997/98–2024/25:** berechnet aus allen Ligaspielen in `schochastics/football-data` (`games.parquet`, „malta“), 3 Punkte.
  1997/98–2013/14 nach der Vorrunde Punkte halbiert (aufgerundet), dann Meister- und Abstiegsrunde; 2014/15–2023/24 eine Tabelle
  (2019/20 und 2020/21 wegen der Pandemie abgebrochen, Meister erklärt); 2024/25 Meister Hamrun gesetzt (Meisterrunde im Datensatz nicht abbildbar).
  **Aus Datensatz berechnet**; Meister geprüft.
- **1975/76–1996/97:** **aus Wissen, ungeprüft.** Meister = Landesmeister-Teilnehmer der Folgesaison, Zweiter = UEFA-Pokal-Teilnehmer der
  Folgesaison (Datensatz); übrige Plätze = Vereine der Epoche (10 Vereine angenommen).
- **2025/26:** Zusammensetzung zu Saisonbeginn (Absteiger San Giljan und Balzan, Aufsteiger Valletta und Tarxien laut Datensatz).
- **Europapokal:** `schochastics/football-data` (`games.parquet`, alle Spiele Landesmeister/CL, UEFA-Pokal/EL, Conference League
  inkl. Qualifikation, bis Sept. 2025; Saisonwechsel 15. Juni). **Aus Datensatz.**
  Europapokal der Pokalsieger **nicht erfasst** (Pokalsieger nicht verlässlich bekannt). **Pokal nicht erfasst.**

## Zuordnung

- Hibernians = „Paola“ (Spielort), Sliema Wanderers = „Sliema“, Hamrun Spartans = „Hamrun“, Rabat Ajax = „Rabat“, Vittoriosa Stars = „Birgu“,
  St. George's = „Cospicua“, Sirens = „St. Paul’s Bay“, Melita = „San Giljan“ (St. Julian's).

## Echter Name → Spielname / ID

| Echter Verein | Spielname | ID | Kürzel | Ort |
|---|---|---|---|---|
| Balzan FC | Balzan | `mlt-balzan` | BAL | Balzan |
| Birkirkara FC | Birkirkara | `mlt-birkirkara` | BIR | Birkirkara |
| Dingli Swallows | Dingli | `mlt-dingli` | DIN | Dingli |
| Floriana FC | Floriana | `mlt-floriana` | FLO | Floriana |
| Gozo FC | Gozo | `mlt-gozo` | GOZ | Victoria (Gozo) |
| Gudja United | Gudja | `mlt-gudja` | GUD | Gudja |
| Gzira United | Gzira | `mlt-gzira` | GZI | Gzira |
| Hamrun Spartans | Hamrun | `mlt-hamrun` | HAM | Hamrun |
| Hibernians FC | Paola | `mlt-paola` | PAO | Paola |
| Lija Athletic | Lija | `mlt-lija` | LIJ | Lija |
| Marsa FC | Marsa | `mlt-marsa` | MAR | Marsa |
| Marsaxlokk FC | Marsaxlokk | `mlt-marsaxlokk` | MXK | Marsaxlokk |
| Melita FC (St. Julian's) | San Giljan | `mlt-san-giljan` | SGI | San Giljan |
| Mosta FC | Mosta | `mlt-mosta` | MOS | Mosta |
| Mqabba FC | Mqabba | `mlt-mqabba` | MQA | Mqabba |
| Msida St. Joseph | Msida | `mlt-msida` | MSI | Msida |
| Naxxar Lions | Naxxar | `mlt-naxxar` | NAX | Naxxar |
| Pembroke Athleta | Pembroke | `mlt-pembroke` | PEM | Pembroke |
| Pietà Hotspurs | Pietà | `mlt-pieta` | PIE | Pietà |
| Qormi FC | Qormi | `mlt-qormi` | QOR | Qormi |
| Rabat Ajax | Rabat | `mlt-rabat` | RAB | Rabat |
| Senglea Athletic | Senglea | `mlt-senglea` | SEN | Senglea |
| Sirens FC (St. Paul's Bay) | St. Paul’s Bay | `mlt-st-paul-s-bay` | SPB | San Pawl il-Bahar |
| Sliema Wanderers | Sliema | `mlt-sliema` | SLI | Sliema |
| St. Andrews FC | St. Andrews | `mlt-st-andrews` | STA | Pembroke |
| St. George's FC (Cospicua) | Cospicua | `mlt-cospicua` | COS | Cospicua |
| St. Lucia FC | Santa Lucija | `mlt-santa-lucija` | SLU | Santa Lucija |
| Tarxien Rainbows | Tarxien | `mlt-tarxien` | TAR | Tarxien |
| Valletta FC | Valletta | `mlt-valletta` | VAL | Valletta |
| Vittoriosa Stars | Birgu | `mlt-birgu` | BIG | Birgu |
| Xgħajra Tornadoes | Xghajra | `mlt-xghajra` | XGH | Xghajra |
| Żabbar St. Patrick | Zabbar | `mlt-zabbar` | ZAB | Zabbar |
| Żebbuġ Rangers | Zebbug | `mlt-zebbug` | ZEB | Zebbug |
| Żejtun Corinthians | Zejtun | `mlt-zejtun` | ZEJ | Zejtun |
| Żurrieq FC | Zurrieq | `mlt-zurrieq` | ZUR | Zurrieq |

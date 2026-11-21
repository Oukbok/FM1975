# Weltvereine fra – Frankreich (Division 1 / Ligue 1, Division 2 / Ligue 2)

Echte Vereinsnamen stehen **nur hier**. Datenformat: `docs/specs/WELTDATEN_SPEC.md`.
Erzeugt mit Skripten im Scratchpad (nicht im Repo): Tabellen aus Spielergebnissen berechnet, Namen über eine Zuordnungsliste.

## Quellen

- **1. Liga 1975/76–2024/25, berechnet aus Spielergebnissen:** `jalapic/engsoccerdata` (`data-raw/france.csv`), 1994/95 fehlt dort
  und kommt aus `schochastics/football-data` (`data/results/games.parquet`). Punkte nach damaliger Regel (2 Punkte bis 1993/94,
  3 Punkte ab 1994/95; 1975/76 Bonuspunkt für Siege mit drei Toren Unterschied), dann Tordifferenz, Tore.
  Abgleich der Teilnehmer je Saison gegen `schochastics/football-data`: gleich bis auf Namensfehler dort (Racing Paris 1984/85, 1989/90).
  In engsoccerdata 2015/16 heißt Gazélec Ajaccio fälschlich „AC Ajaccio“ – beim Einlesen korrigiert.
- **1. Liga 2025/26:** `openfootball/europe` (`france/2025-26_fr1.txt`), vollständige Saison → Abschlusstabelle.
- **2. Liga 1996/97–2013/14:** football-data.co.uk über `footballcsv/cache.footballdata` (`fr.2.csv`), berechnet.
- **2. Liga 2014/15–2024/25:** `openfootball/europe` (`france/<saison>_fr2.txt`), berechnet. 2025/26 dort nur bis Spieltag ~13 →
  Zusammensetzung (Absteiger aus Liga 1 vorn, dann Vorjahresplatz, Aufsteiger hinten).
- **2. Liga 1975/76–1995/96: aus Wissen, ungeprüft.** Sicher sind nur die Vereine, die laut den Daten der 1. Liga in diesem
  Jahr ab- bzw. im Folgejahr aufgestiegen sind (Aufsteiger stehen vorn, dann die Absteiger aus Liga 1). Die übrigen Plätze sind
  mit typischen Zweitligisten der Epoche aufgefüllt (Staffel A Nord/West = `t2`, Staffel B Süd/Ost = `t2b`, je 18; ab 1993/94
  eingleisig 22) – Reihenfolge und Zusammensetzung der Mitte sind **nicht** belegt.
- **Europapokal:** `schochastics/football-data` (alle Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation bis Sept. 2025).
  Europapokal der Pokalsieger fehlt dort → aus den Pokalendspielen abgeleitet (Pokalsieger; war er Meister, der Finalist;
  Titelverteidiger Paris 1996/97) – **aus Wissen, ungeprüft**. 1992/93 (Pokal 1991/92 nicht ausgespielt): Monaco, unsicher.
  2025/26: Ligaphase der EL (Lille, Lyon, Nizza) aus Wissen ergänzt.
- **Pokal (Sieger/Finalist): aus Wissen, ungeprüft** (gut belegte Endspielliste); 1991/92 nicht ausgespielt, 2025/26 fehlt.

## Ligareformen / Besonderheiten

- Division 1 mit 20 Vereinen; 1997/98–2001/02 18; ab 2002/03 wieder 20; ab 2023/24 18.
- Division 2 bis 1992/93 in zwei Staffeln, 1993/94 eingleisig (22), ab 1997/98 20, ab 2024/25 18 (Ligue 2).
- 1990/91: Bordeaux, Nizza, Brest finanziell zwangsabgestiegen. 1992/93: Marseille Titel aberkannt, 1993/94 als Zweiter zwangsabgestiegen.
- 2019/20: Abbruch, Wertung nach Punkten je Spiel.
- Fusionen/Umbenennungen: Troyes AF (bis 1979) und ESTAC (ab 1986) = ein Verein im Spiel; Racing Club de France/Matra Racing = ein
  Verein; Valenciennes (US Valenciennes-Anzin / Valenciennes FC) = ein Verein; Le Mans UC 72 / Le Mans FC = ein Verein;
  US Quevilly und Quevilly-Rouen = ein Verein.
- Spielnamen: Paris Saint-Germain = „Paris“ (wie im Hintergrund und in `historicStrength`), Paris FC = „Paris Blau-Weiß“,
  Racing = „Paris Himmelblau“, Red Star = „Saint-Ouen“ (Ort). Bestehende Namen aus `data/europe.ts` (Saint-Étienne, Marseille,
  Nizza, Lyon, Nîmes) und `data/worldSeed.ts` (Städte) übernommen.

## Echter Name → Spielname / ID

| Echter Verein | Spielname | ID | Kürzel | Ort |
|---|---|---|---|---|
| AAJ Blois | Blois | `fra-blois` | BLO | Blois |
| AC Ajaccio | Ajaccio | `fra-ajaccio` | AJA | Ajaccio |
| AC Arles-Avignon | Arles | `fra-arles` | ARL | Arles |
| AJ Auxerre | Auxerre | `fra-auxerre` | AUX | Auxerre |
| Amiens SC | Amiens | `fra-amiens` | AMI | Amiens |
| Angers SCO | Angers | `fra-angers` | ANG | Angers |
| AS Avignonnaise | Avignon | `fra-avignon` | AVI | Avignon |
| AS Beauvais | Beauvais | `fra-beauvais` | BEA | Beauvais |
| AS Béziers | Béziers | `fra-beziers` | BEZ | Béziers |
| AS Cannes | Cannes | `fra-cannes` | CAN | Cannes |
| AS Cherbourg | Cherbourg | `fra-cherbourg` | CHE | Cherbourg |
| AS Lyon-Duchère | Lyon-Duchère | `fra-lyon-duchere` | LYD | Lyon |
| AS Monaco | Monaco | `fra-monaco` | MON | Monaco |
| AS Nancy-Lorraine | Nancy | `fra-nancy` | NCY | Nancy |
| AS Saint-Étienne | Saint-Étienne | `fra-saint-etienne` | STE | Saint-Étienne |
| ASOA Valence | Valence | `fra-valence` | VLC | Valence |
| CA Bastia | Bastia Rot-Blau | `fra-bastia-rot-blau` | BRB | Bastia |
| Calais RUFC | Calais | `fra-calais` | CAL | Calais |
| Chamois Niortais | Niort | `fra-niort` | NIO | Niort |
| Clermont Foot (AS Montferrand) | Clermont | `fra-clermont` | CLE | Clermont-Ferrand |
| CS Louhans-Cuiseaux | Louhans | `fra-louhans` | LOU | Louhans |
| CS Sedan Ardennes | Sedan | `fra-sedan` | SED | Sedan |
| Dijon FCO | Dijon | `fra-dijon` | DIJ | Dijon |
| EA Guingamp | Guingamp | `fra-guingamp` | GUI | Guingamp |
| EDS Montluçon | Montluçon | `fra-montlucon` | MLU | Montluçon |
| ES Viry-Châtillon | Viry-Châtillon | `fra-viry-chatillon` | VIR | Viry-Châtillon |
| ES Wasquehal | Wasquehal | `fra-wasquehal` | WAS | Wasquehal |
| FC Annecy | Annecy | `fra-annecy` | ANN | Annecy |
| FC Bourg-Péronnas | Bourg-en-Bresse | `fra-bourg` | BPE | Bourg-en-Bresse |
| FC Chambly | Chambly | `fra-chambly` | CMB | Chambly |
| FC Gueugnon | Gueugnon | `fra-gueugnon` | GUE | Gueugnon |
| FC Istres | Istres | `fra-istres` | IST | Istres |
| FC Libourne(-Saint-Seurin) | Libourne | `fra-libourne` | LIB | Libourne |
| FC Lorient | Lorient | `fra-lorient` | LOR | Lorient |
| FC Martigues | Martigues | `fra-martigues` | MTG | Martigues |
| FC Metz | Metz | `fra-metz` | MET | Metz |
| FC Montceau Bourgogne | Montceau | `fra-montceau` | MCE | Montceau-les-Mines |
| FC Mulhouse | Mülhausen | `fra-mulhouse` | MUL | Mülhausen |
| FC Nantes | Nantes | `fra-nantes` | NAN | Nantes |
| FC Rouen | Rouen | `fra-rouen` | ROU | Rouen |
| FC Sochaux-Montbéliard | Sochaux | `fra-sochaux` | SOC | Montbéliard |
| FC Sète | Sète | `fra-sete` | SET | Sète |
| FC Thionville | Thionville | `fra-thionville` | THI | Thionville |
| Gazélec Ajaccio | Ajaccio Blau-Rot | `fra-ajaccio-blau-rot` | AJB | Ajaccio |
| Girondins de Bordeaux | Bordeaux | `fra-bordeaux` | BOR | Bordeaux |
| Grenoble Foot 38 | Grenoble | `fra-grenoble` | GRE | Grenoble |
| LB Châteauroux (La Berrichonne) | Châteauroux | `fra-chateauroux` | CHX | Châteauroux |
| Le Havre AC | Le Havre | `fra-le-havre` | HAV | Le Havre |
| Le Mans UC 72 / Le Mans FC | Le Mans | `fra-le-mans` | LMA | Le Mans |
| Le Puy Foot | Le Puy | `fra-le-puy` | LPU | Le Puy-en-Velay |
| Les Herbiers VF | Les Herbiers | `fra-les-herbiers` | LHE | Les Herbiers |
| Lille OSC | Lille | `fra-lille` | LIL | Lille |
| Limoges FC | Limoges | `fra-limoges` | LIM | Limoges |
| Montpellier HSC (La Paillade) | Montpellier | `fra-montpellier` | MPL | Montpellier |
| Nîmes Olympique | Nîmes | `fra-nimes` | NIM | Nîmes |
| OGC Nice | Nizza | `fra-nizza` | NIZ | Nizza |
| Olympique Charleville | Charleville | `fra-charleville` | CHV | Charleville-Mézières |
| Olympique d'Alès | Alès | `fra-ales` | ALE | Alès |
| Olympique de Marseille | Marseille | `fra-marseille` | MAR | Marseille |
| Olympique Lyonnais | Lyon | `fra-lyon` | LYO | Lyon |
| Paris FC | Paris Blau-Weiß | `fra-paris-blau-weiss` | PBW | Paris |
| Paris Saint-Germain | Paris | `fra-paris` | PAR | Paris |
| Pau FC | Pau | `fra-pau` | PAU | Pau |
| Perpignan FC / Canet Roussillon | Perpignan | `fra-perpignan` | PER | Perpignan |
| Racing Besançon | Besançon | `fra-besancon` | BES | Besançon |
| Racing Club de France / Matra Racing (Racing Paris) | Paris Himmelblau | `fra-paris-himmelblau` | PHB | Paris |
| RC Lens | Lens | `fra-lens` | LEN | Lens |
| RC Strasbourg | Straßburg | `fra-strassburg` | STR | Straßburg |
| Red Star (Saint-Ouen) | Saint-Ouen | `fra-saint-ouen` | SOU | Saint-Ouen |
| Rodez AF | Rodez | `fra-rodez` | ROD | Rodez |
| SAS Épinal | Épinal | `fra-epinal` | EPI | Épinal |
| SC Abbeville | Abbeville | `fra-abbeville` | ABB | Abbeville |
| SC Bastia | Bastia | `fra-bastia` | BAS | Bastia |
| SM Caen | Caen | `fra-caen` | CAE | Caen |
| Sporting Toulon Var | Toulon | `fra-toulon` | TLN | Toulon |
| Stade Brestois / Brest Armorique | Brest | `fra-brest` | BRE | Brest |
| Stade Briochin | Saint-Brieuc | `fra-saint-brieuc` | SBR | Saint-Brieuc |
| Stade Béthunois | Béthune | `fra-bethune` | BET | Béthune |
| Stade de Reims | Reims | `fra-reims` | REI | Reims |
| Stade Lavallois | Laval | `fra-laval` | LAV | Laval |
| Stade Montois | Mont-de-Marsan | `fra-mont-de-marsan` | MDM | Mont-de-Marsan |
| Stade Quimpérois | Quimper | `fra-quimper` | QUI | Quimper |
| Stade Rennais | Rennes | `fra-rennes` | REN | Rennes |
| Toulouse FC | Toulouse | `fra-toulouse` | TOU | Toulouse |
| Tours FC | Tours | `fra-tours` | TRS | Tours |
| Troyes AF (bis 1979) / ESTAC Troyes (ab 1986) | Troyes | `fra-troyes` | TRO | Troyes |
| US Boulogne | Boulogne | `fra-boulogne` | BOU | Boulogne-sur-Mer |
| US Concarneau | Concarneau | `fra-concarneau` | CON | Concarneau |
| US Créteil-Lusitanos | Créteil | `fra-creteil` | CRE | Créteil |
| US Nœux-les-Mines | Nœux-les-Mines | `fra-noeux` | NOE | Nœux-les-Mines |
| US Orléans | Orléans | `fra-orleans` | ORL | Orléans |
| US Quevilly(-Rouen Métropole) | Quevilly | `fra-quevilly` | QUE | Le Petit-Quevilly |
| US Valenciennes-Anzin / Valenciennes FC | Valenciennes | `fra-valenciennes` | VAL | Valenciennes |
| USL Dunkerque | Dünkirchen | `fra-dunkerque` | DUN | Dünkirchen |
| Vannes OC | Vannes | `fra-vannes` | VAN | Vannes |
| Évian Thonon Gaillard | Thonon | `fra-thonon` | THO | Thonon-les-Bains |

## Herkunft je Saison

| Saison | t1 | t2 | Pokal | Europapokal | Anmerkung |
|---|---|---|---|---|---|
| 1975/76 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (Staffeln A/B; Auf-/Absteiger aus den Daten der 1. Liga) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1976/77 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (Staffeln A/B; Auf-/Absteiger aus den Daten der 1. Liga) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1977/78 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (Staffeln A/B; Auf-/Absteiger aus den Daten der 1. Liga) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1978/79 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (Staffeln A/B; Auf-/Absteiger aus den Daten der 1. Liga) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1979/80 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (Staffeln A/B; Auf-/Absteiger aus den Daten der 1. Liga) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1980/81 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (Staffeln A/B; Auf-/Absteiger aus den Daten der 1. Liga) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1981/82 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (Staffeln A/B; Auf-/Absteiger aus den Daten der 1. Liga) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1982/83 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (Staffeln A/B; Auf-/Absteiger aus den Daten der 1. Liga) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1983/84 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (Staffeln A/B; Auf-/Absteiger aus den Daten der 1. Liga) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1984/85 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (Staffeln A/B; Auf-/Absteiger aus den Daten der 1. Liga) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1985/86 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (Staffeln A/B; Auf-/Absteiger aus den Daten der 1. Liga) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1986/87 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (Staffeln A/B; Auf-/Absteiger aus den Daten der 1. Liga) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1987/88 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (Staffeln A/B; Auf-/Absteiger aus den Daten der 1. Liga) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1988/89 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (Staffeln A/B; Auf-/Absteiger aus den Daten der 1. Liga) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1989/90 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (Staffeln A/B; Auf-/Absteiger aus den Daten der 1. Liga) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1990/91 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (Staffeln A/B; Auf-/Absteiger aus den Daten der 1. Liga) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) | Bordeaux, Nizza und Brest aus finanziellen Gründen zwangsabgestiegen |
| 1991/92 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (Staffeln A/B; Auf-/Absteiger aus den Daten der 1. Liga) | fehlt | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) | Landespokal nach der Tribünenkatastrophe von Bastia nicht ausgespielt |
| 1992/93 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (Staffeln A/B; Auf-/Absteiger aus den Daten der 1. Liga) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) | Marseille: Meistertitel wegen Bestechung aberkannt (nicht vergeben) |
| 1993/94 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (Auf-/Absteiger aus den Daten der 1. Liga) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) | Marseille als Zweiter zwangsabgestiegen |
| 1994/95 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft (Auf-/Absteiger aus den Daten der 1. Liga) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1995/96 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (Auf-/Absteiger aus den Daten der 1. Liga) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1996/97 | engsoccerdata (berechnet) | football-data.co.uk über footballcsv (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1997/98 | engsoccerdata (berechnet) | football-data.co.uk über footballcsv (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1998/99 | engsoccerdata (berechnet) | football-data.co.uk über footballcsv (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1999/00 | engsoccerdata (berechnet) | football-data.co.uk über footballcsv (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2000/01 | engsoccerdata (berechnet) | football-data.co.uk über footballcsv (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2001/02 | engsoccerdata (berechnet) | football-data.co.uk über footballcsv (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2002/03 | engsoccerdata (berechnet) | football-data.co.uk über footballcsv (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2003/04 | engsoccerdata (berechnet) | football-data.co.uk über footballcsv (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2004/05 | engsoccerdata (berechnet) | football-data.co.uk über footballcsv (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2005/06 | engsoccerdata (berechnet) | football-data.co.uk über footballcsv (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2006/07 | engsoccerdata (berechnet) | football-data.co.uk über footballcsv (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2007/08 | engsoccerdata (berechnet) | football-data.co.uk über footballcsv (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2008/09 | engsoccerdata (berechnet) | football-data.co.uk über footballcsv (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2009/10 | engsoccerdata (berechnet) | football-data.co.uk über footballcsv (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2010/11 | engsoccerdata (berechnet) | football-data.co.uk über footballcsv (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2011/12 | engsoccerdata (berechnet) | football-data.co.uk über footballcsv (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2012/13 | engsoccerdata (berechnet) | football-data.co.uk über footballcsv (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2013/14 | engsoccerdata (berechnet) | football-data.co.uk über footballcsv (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2014/15 | engsoccerdata (berechnet) | openfootball/europe (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2015/16 | engsoccerdata (berechnet) | openfootball/europe (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2016/17 | engsoccerdata (berechnet) | openfootball/europe (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2017/18 | engsoccerdata (berechnet) | openfootball/europe (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2018/19 | engsoccerdata (berechnet) | openfootball/europe (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2019/20 | engsoccerdata (berechnet) | openfootball/europe (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) | Saison abgebrochen (Pandemie), Wertung nach Punkten je Spiel |
| 2020/21 | engsoccerdata (berechnet) | openfootball/europe (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2021/22 | engsoccerdata (berechnet) | openfootball/europe (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2022/23 | engsoccerdata (berechnet) | openfootball/europe (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2023/24 | engsoccerdata (berechnet) | openfootball/europe (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2024/25 | engsoccerdata (berechnet) | openfootball/europe (berechnet) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2025/26 | openfootball/europe 2025/26 (berechnet, Abschlusstabelle) | openfootball/europe 2025/26 (Zusammensetzung; Reihenfolge = Vorjahr, Absteiger vorn, Aufsteiger hinten) | fehlt | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |

## Unsicherheiten (Zusammenfassung)

- Alles, was oben „aus Wissen, ungeprüft“ heißt, wurde ohne Websuche aus dem Gedächtnis eingetragen (Websuche war in der Sitzung aufgebraucht).
- Bei berechneten Tabellen fehlen Punktabzüge und grüne-Tisch-Entscheidungen, soweit sie oben nicht als Anmerkung stehen.
- 2. Ligen aus Wissen: Reihenfolge außer Auf-/Absteigern **nicht** nach Abschlusstabelle; Zusammensetzung der Mitte kann je Saison um mehrere Vereine abweichen.

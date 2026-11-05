# Weltvereine ita – Italien (Serie A / Serie B)

Echte Vereinsnamen stehen **nur hier**. Datenformat: `docs/specs/WELTDATEN_SPEC.md`.

## Quellen (gesamt)

- **1. Liga, berechnet aus Spielergebnissen:** `jalapic/engsoccerdata` (GitHub, `data-raw/italy.csv`, `spain.csv`, `portugal.csv`),
  `schochastics/football-data` (`games.parquet`, Portugal 1975–1993), `openfootball/europe` (Portugal 2025/26).
  Tabellen nach Punkten (2/3-Punkte-Regel je Land/Jahr), dann direkter Vergleich, Tordifferenz, Tore.
  Bekannte Punktabzüge/Entscheidungsspiele wurden von Hand eingearbeitet (siehe `note`).
- **RSSSF-Spiegel** `rsssf/tables` (GitHub, Text der RSSSF-Saisonseiten): Italien 1999/2000–2025/26 (Serie A + B, Coppa),
  Spanien 2010/11–2025/26 (Primera + Segunda, Copa).
- **Wikipedia (en) bzw. RSSSF per WebFetch**, Saisonartikel „<Saison> Serie B“, „<Saison> Segunda División“,
  „<Saison> Segunda Divisão (de Honra)“, „Liga de Honra“, RSSSF „ital2-NN“ (Serie B 2004/05–2008/09).
- **Europapokal:** `schochastics/football-data` (alle Spiele von Europapokal der Landesmeister/CL, UEFA-Pokal/EL,
  Conference League inkl. Qualifikation, bis Sept. 2025). Europapokal der Pokalsieger fehlt dort und wurde aus den
  Pokalendspielen abgeleitet (Pokalsieger; war er Meister, der Finalist; dazu Titelverteidiger) – Regel geprüft gegen
  bekannte Fälle (Castilla 1980/81, Atalanta 1987/88, Valladolid 1989/90, Betis 1997/98, Braga 1982/83 u. a.).
  2025/26: Teilnehmer nach Tabellenplätzen 2024/25 **aus Wissen, ungeprüft** (Quelle endet in der Qualifikation).
- **Pokal (Sieger/Finalist):** 2010–2025 Italien/Spanien gegen RSSSF geprüft; übrige Jahre **aus Wissen, ungeprüft**
  (gut belegte Endspiellisten). Portugal 2025/26 fehlt.
- Saison 2025/26 ist in den Quellen bereits abgeschlossen; `t1`/`t2` sind deshalb Abschlusstabellen (nicht Saisonstart).


## Echter Name → Spielname / ID

| Echter Verein | Spielname | ID | Kürzel | Ort |
|---|---|---|---|---|
| AC Ancona | Ancona | `ita-ancona` | ANC | Ancona |
| AC Arezzo | Arezzo | `ita-arezzo` | ARE | Arezzo |
| AC Cesena / Cesena FC | Cesena | `ita-cesena` | CES | Cesena |
| AC ChievoVerona | Verona-Chievo | `ita-verona-chievo` | VEC | Verona |
| AC Licata | Licata | `ita-licata` | LIC | Licata |
| AC Mantova | Mantua | `ita-mantua` | MAN | Mantua |
| AC Milan | Mailand Rot-Schwarz | `ita-mailand-rot-schwarz` | MRS | Mailand |
| AC Monza | Monza | `ita-monza` | MON | Monza |
| AC Perugia | Perugia | `ita-perugia` | PER | Perugia |
| AC Pisa / Pisa SC | Pisa | `ita-pisa` | PIS | Pisa |
| AC Pistoiese | Pistoia | `ita-pistoia` | PIT | Pistoia |
| AC Reggiana | Reggio Emilia | `ita-reggio-emilia` | REE | Reggio Emilia |
| AC Siena | Siena | `ita-siena` | SIE | Siena |
| AC/FC Venezia | Venedig | `ita-venedig` | VEN | Venedig |
| ACF Fiorentina | Florenz | `ita-florenz` | FLO | Florenz |
| Acireale Calcio | Acireale | `ita-acireale` | ACI | Acireale |
| ACR/FC Messina | Messina | `ita-messina` | MES | Messina |
| Alzano Virescit | Alzano | `ita-alzano` | ALZ | Alzano Lombardo |
| AS Barletta | Barletta | `ita-barletta` | BAL | Barletta |
| AS Cittadella | Cittadella | `ita-cittadella` | CIT | Cittadella |
| AS Gubbio 1910 | Gubbio | `ita-gubbio` | GUB | Gubbio |
| AS Livorno | Livorno | `ita-livorno` | LIV | Livorno |
| AS Lucchese | Lucca | `ita-lucca` | LUC | Lucca |
| AS Roma | Rom Rot-Gelb | `ita-rom-rot-gelb` | RRG | Rom |
| AS Varese | Varese | `ita-varese` | VAR | Varese |
| AS/SSC Bari | Bari | `ita-bari` | BAR | Bari |
| Ascoli Calcio | Ascoli | `ita-ascoli` | ASC | Ascoli Piceno |
| ASG Nocerina | Nocera | `ita-nocera` | NOC | Nocera Inferiore |
| Atalanta BC | Bergamo | `ita-bergamo` | BER | Bergamo |
| Benevento Calcio | Benevento | `ita-benevento` | BEN | Benevento |
| Bologna FC | Bologna | `ita-bologna` | BOL | Bologna |
| Brescia Calcio | Brescia | `ita-brescia` | BRE | Brescia |
| Brindisi Sport | Brindisi | `ita-brindisi` | BRI | Brindisi |
| Cagliari Calcio | Cagliari | `ita-cagliari` | CAG | Cagliari |
| Calcio Catania | Catania | `ita-catania` | CAT | Catania |
| Calcio Como / Como 1907 | Como | `ita-como` | COM | Como |
| Calcio Lecco 1912 | Lecco | `ita-lecco` | LCC | Lecco |
| Calcio Padova | Padua | `ita-padua` | PAD | Padua |
| Campobasso Calcio | Campobasso | `ita-campobasso` | CAM | Campobasso |
| Carpi FC | Carpi | `ita-carpi` | CAR | Carpi |
| Carrarese Calcio | Carrara | `ita-carrara` | CRR | Carrara |
| Casertana FC | Caserta | `ita-caserta` | CAS | Caserta |
| Castel di Sangro Calcio | Castel di Sangro | `ita-castel-di-sangro` | CDS | Castel di Sangro |
| Cavese 1919 | Cava | `ita-cava` | CAV | Cava de’ Tirreni |
| Cosenza Calcio | Cosenza | `ita-cosenza` | COS | Cosenza |
| Empoli FC | Empoli | `ita-empoli` | EMP | Empoli |
| FC Crotone | Crotone | `ita-crotone` | CRO | Crotone |
| FC Internazionale | Mailand Blau-Schwarz | `ita-mailand-blau-schwarz` | MBS | Mailand |
| FC Pro Vercelli | Vercelli | `ita-vercelli` | VER | Vercelli |
| FC Südtirol | Bozen | `ita-bozen` | BOZ | Bozen |
| FeralpiSalò | Salò | `ita-salo` | SAL | Salò |
| Fermana FC | Fermo | `ita-fermo` | FER | Fermo |
| Fidelis Andria | Andria | `ita-andria` | AND | Andria |
| Frosinone Calcio | Frosinone | `ita-frosinone` | FRO | Frosinone |
| Gallipoli Calcio | Gallipoli | `ita-gallipoli` | GAL | Gallipoli |
| Genoa CFC | Genua Rot-Blau | `ita-genua-rot-blau` | GRB | Genua |
| Hellas Verona | Verona Gelb-Blau | `ita-verona-gelb-blau` | VGB | Verona |
| Juventus FC | Turin Schwarz-Weiß | `ita-turin-schwarz-weiss` | TSW | Turin |
| Lanerossi Vicenza / Vicenza Calcio / LR Vicenza | Vicenza | `ita-vicenza` | VIC | Vicenza |
| Latina Calcio | Latina | `ita-latina` | LAT | Latina |
| Matera Calcio | Matera | `ita-matera` | MAT | Matera |
| Modena FC | Modena | `ita-modena` | MOD | Modena |
| Novara Calcio | Novara | `ita-novara` | NOV | Novara |
| Parma AC / Parma FC / Parma Calcio | Parma | `ita-parma` | PAR | Parma |
| Pescara Calcio / Delfino Pescara | Pescara | `ita-pescara` | PES | Pescara |
| Piacenza Calcio | Piacenza | `ita-piacenza` | PIA | Piacenza |
| Pordenone Calcio | Pordenone | `ita-pordenone` | POR | Pordenone |
| Portogruaro Summaga | Portogruaro | `ita-portogruaro` | POT | Portogruaro |
| Ravenna Calcio | Ravenna | `ita-ravenna` | RAV | Ravenna |
| Reggina Calcio | Reggio Calabria | `ita-reggio-calabria` | REC | Reggio Calabria |
| Rimini Calcio | Rimini | `ita-rimini` | RIM | Rimini |
| Sambenedettese | San Benedetto | `ita-san-benedetto` | SAB | San Benedetto del Tronto |
| Savoia 1908 | Torre Annunziata | `ita-torre-annunziata` | TOA | Torre Annunziata |
| SPAL | Ferrara | `ita-ferrara` | FRR | Ferrara |
| Spezia Calcio | La Spezia | `ita-la-spezia` | LAS | La Spezia |
| SS Juve Stabia | Castellammare | `ita-castellammare` | CST | Castellammare di Stabia |
| SS Lazio | Rom Himmelblau | `ita-rom-himmelblau` | ROH | Rom |
| SS Virtus Lanciano | Lanciano | `ita-lanciano` | LAN | Lanciano |
| SSC Napoli | Neapel | `ita-neapel` | NEA | Neapel |
| Taranto FC | Taranto | `ita-taranto` | TAR | Taranto |
| Ternana Calcio | Terni | `ita-terni` | TER | Terni |
| Torino FC | Turin Granat | `ita-turin-granat` | TGR | Turin |
| Trapani Calcio | Trapani | `ita-trapani` | TRA | Trapani |
| Treviso FBC | Treviso | `ita-treviso` | TRE | Treviso |
| UC AlbinoLeffe | Albino | `ita-albino` | ALB | Albino |
| UC Sampdoria | Genua Blau-Weiß | `ita-genua-blau-weiss` | GBW | Genua |
| Udinese Calcio | Udine | `ita-udine` | UDI | Udine |
| US Alessandria | Alessandria | `ita-alessandria` | ALE | Alessandria |
| US Avellino | Avellino | `ita-avellino` | AVE | Avellino |
| US Catanzaro | Catanzaro | `ita-catanzaro` | CAA | Catanzaro |
| US Cremonese | Cremona | `ita-cremona` | CRE | Cremona |
| US Foggia | Foggia | `ita-foggia` | FOG | Foggia |
| US Grosseto | Grosseto | `ita-grosseto` | GRO | Grosseto |
| US Lecce | Lecce | `ita-lecce` | LEC | Lecce |
| US Salernitana | Salerno | `ita-salerno` | SAE | Salerno |
| US Sassuolo | Sassuolo | `ita-sassuolo` | SAS | Sassuolo |
| US Triestina | Triest | `ita-triest` | TRI | Triest |
| US/Città di Palermo, Palermo FC | Palermo | `ita-palermo` | PAL | Palermo |
| Virtus Entella | Chiavari | `ita-chiavari` | CHI | Chiavari |

Farben großer Vereine nach Vereinsfarben; bei kleinen Vereinen teils **geschätzt**.

## Quelle je Saison

| Saison | 1. Liga | 2. Liga | Anmerkung |
|---|---|---|---|
| 1975/76 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) |  |
| 1976/77 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) | Aufstiegs-Entscheidungsrunde Atalanta/Pescara/Cagliari |
| 1977/78 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) |  |
| 1978/79 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) | Aufstiegs-Entscheidungsspiel Pescara–Monza 2:0 |
| 1979/80 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) | Totonero 1980: Mailand Rot-Schwarz (3.) und Rom Himmelblau per Urteil in die Serie B versetzt |
| 1980/81 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) | Totonero: Avellino, Bologna und Perugia je 5 Punkte Abzug; Milan und Lazio nach Totonero-Skandal 1980 in die Serie B versetzt; Palermo 5 Punkte Abzug (Totonero) |
| 1981/82 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) |  |
| 1982/83 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) | Aufstiegs-Entscheidungsrunde: Catania steigt auf |
| 1983/84 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) |  |
| 1984/85 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) | Padova vom Verband auf den letzten Platz gesetzt (Betrug), später begnadigt? – Quelle: Platz 20 |
| 1985/86 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) | Totonero 1986: Vicenza (3.) Aufstieg verweigert, Empoli rückt nach; Perugia Zwangsabstieg in die Serie C2; Palermo wegen Konkurs ausgeschlossen, Pescara bleibt; Triestina -1 Punkt |
| 1986/87 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) | Totonero 1986: Udine 9 Punkte Abzug; Totonero 1986: Lazio -9, Cagliari -5, Triestina -4 Punkte; Aufstiegsrunde Cesena; Abstiegsrunde Taranto/Lazio bleiben, Campobasso steigt ab |
| 1987/88 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) | Empoli 5 Punkte Abzug; Triestina -5 Punkte |
| 1988/89 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) | Aufstockung auf 18 Vereine; Aufstiegs-Entscheidungsspiel Cremonese–Reggina; Abstiegs-Entscheidungsspiel Brescia–Empoli |
| 1989/90 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) | Abstiegs-Entscheidungsspiel Messina–Monza |
| 1990/91 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) | Udinese -5 Punkte; Abstiegs-Entscheidungsspiel Cosenza–Salernitana |
| 1991/92 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) | Abstiegs-Entscheidungsspiel Taranto–Casertana |
| 1992/93 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) | Abstiegs-Entscheidungsspiel Udine–Brescia; Taranto und Ternana wegen Konkurs zwangsabgestiegen |
| 1993/94 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) | Pescara -3 Punkte; Aufstiegs-Entscheidungsspiel Padova–Cesena; Abstiegs-Entscheidungsspiel Acireale–Pisa |
| 1994/95 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) | Erste Saison mit drei Punkten pro Sieg; Abstiegs-Entscheidungsspiel Padua–Genua Rot-Blau; Cosenza -9 Punkte |
| 1995/96 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) |  |
| 1996/97 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) | Abstiegs-Entscheidungsspiel Piacenza–Cagliari; Ravenna -3 Punkte |
| 1997/98 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) | Aufstiegs-Entscheidungsspiel Perugia–Torino |
| 1998/99 | engsoccerdata (berechnet) | Wikipedia/RSSSF (WebFetch) |  |
| 1999/00 | RSSSF tablesi/ital00.txt | RSSSF tablesi/ital00.txt |  |
| 2000/01 | RSSSF tablesi/ital01.txt | RSSSF tablesi/ital01.txt |  |
| 2001/02 | RSSSF tablesi/ital02.txt | RSSSF tablesi/ital02.txt |  |
| 2002/03 | RSSSF tablesi/ital03.txt | RSSSF tablesi/ital03.txt |  |
| 2003/04 | RSSSF tablesi/ital04.txt | RSSSF tablesi/ital04.txt |  |
| 2004/05 | RSSSF tablesi/ital05.txt | Wikipedia/RSSSF (WebFetch) | Aufstockung auf 20 Vereine; Titel von Turin Schwarz-Weiß 2006 aberkannt (Calciopoli), nicht vergeben; Genoa (sportlich 1.) wegen Spielmanipulation auf den letzten Platz gesetzt und in die Serie C1 versetzt; Torino und Perugia ohne Aufstieg (Konkurs), Treviso und Ascoli rücken nach; Salernitana, Perugia, Venezia aus finanziellen Gründen abgestiegen |
| 2005/06 | RSSSF tablesi/ital06.txt | Wikipedia/RSSSF (WebFetch) | Calciopoli: Turin Schwarz-Weiß auf den letzten Platz gesetzt und in die Serie B versetzt, Titel an Mailand Blau-Schwarz; Punktabzüge u. a. für Mailand Rot-Schwarz, Florenz, Rom Himmelblau; Torino steigt über die Play-offs auf |
| 2006/07 | RSSSF tablesi/ital07.txt | Wikipedia/RSSSF (WebFetch) | Calciopoli-Abzüge: Mailand Rot-Schwarz -8, Florenz -15, Rom Himmelblau -3, Reggio Calabria -11, Siena -1; Calciopoli: Juventus -9 (Zwangsabstieg 2006), Arezzo -6 Punkte |
| 2007/08 | RSSSF tablesi/ital08.txt | Wikipedia/RSSSF (WebFetch) | Lecce steigt über die Play-offs auf |
| 2008/09 | RSSSF tablesi/ital09.txt | Wikipedia/RSSSF (WebFetch) | Livorno steigt über die Play-offs auf |
| 2009/10 | RSSSF tablesi/ital2010.txt | RSSSF tablesi/ital2010.txt |  |
| 2010/11 | RSSSF tablesi/ital2011.txt | RSSSF tablesi/ital2011.txt |  |
| 2011/12 | RSSSF tablesi/ital2012.txt | RSSSF tablesi/ital2012.txt |  |
| 2012/13 | RSSSF tablesi/ital2013.txt | RSSSF tablesi/ital2013.txt |  |
| 2013/14 | RSSSF tablesi/ital2014.txt | RSSSF tablesi/ital2014.txt |  |
| 2014/15 | RSSSF tablesi/ital2015.txt | RSSSF tablesi/ital2015.txt |  |
| 2015/16 | RSSSF tablesi/ital2016.txt | RSSSF tablesi/ital2016.txt |  |
| 2016/17 | RSSSF tablesi/ital2017.txt | RSSSF tablesi/ital2017.txt |  |
| 2017/18 | RSSSF tablesi/ital2018.txt | RSSSF tablesi/ital2018.txt |  |
| 2018/19 | RSSSF tablesi/ital2019.txt | RSSSF tablesi/ital2019.txt |  |
| 2019/20 | RSSSF tablesi/ital2020.txt | RSSSF tablesi/ital2020.txt |  |
| 2020/21 | RSSSF tablesi/ital2021.txt | RSSSF tablesi/ital2021.txt |  |
| 2021/22 | RSSSF tablesi/ital2022.txt | RSSSF tablesi/ital2022.txt |  |
| 2022/23 | RSSSF tablesi/ital2023.txt | RSSSF tablesi/ital2023.txt |  |
| 2023/24 | RSSSF tablesi/ital2024.txt | RSSSF tablesi/ital2024.txt |  |
| 2024/25 | RSSSF tablesi/ital2025.txt | Wikipedia/RSSSF (WebFetch) | Brescia -4 Punkte, danach ausgeschlossen; Sampdoria bleibt über die Play-outs gegen Salernitana; Cosenza -4; Cremonese steigt über die Play-offs auf |
| 2025/26 | RSSSF tablesi/ital2026.txt | RSSSF tablesi/ital2026.txt |  |

## Unsicherheiten / Besonderheiten

- Serie A 1975/76–1998/99 aus Ergebnissen berechnet; Abzüge 1980/81 (Avellino, Bologna, Perugia je -5), 1986/87 (Udinese -9),
  1987/88 (Empoli -5) eingearbeitet; Entscheidungsspiele 1992/93, 1994/95, 1996/97 von Hand gesetzt. Punktgleiche ohne
  Entscheidungsspiel nach direktem Vergleich – kann bei geteilten Plätzen von der offiziellen Liste abweichen.
- Serie B: geteilte Plätze (Quelle) in Quellreihenfolge übernommen. 1984/85 Padova laut Quelle auf Platz 20.
- Gleiche Vereine trotz Neugründung/Umbenennung zusammengefasst: Parma (AC/FC/Calcio), Palermo, Fiorentina (AC/ACF),
  Napoli, Bari (AS/SSC), Vicenza (Lanerossi/Vicenza Calcio/LR Vicenza), Modena (FC/Modena FC 2018), Venezia, Messina.
- Verona: Hellas = „Verona Gelb-Blau“, Chievo = „Verona-Chievo“ (Stadtteil). Reggiana/Reggina nach Stadt getrennt.

# Weltvereine esp – Spanien (Primera / Segunda División)

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
| AD Alcorcón | Alcorcón | `esp-alcorcon` | ALC | Alcorcón |
| AD Almería (bis 1982) | Almería Ost | `esp-almeria-ost` | ALO | Almería |
| AgD Ceuta / AD Ceuta FC | Ceuta | `esp-ceuta` | CEU | Ceuta |
| Albacete Balompié | Albacete | `esp-albacete` | ALB | Albacete |
| Algeciras CF | Algeciras | `esp-algeciras` | ALG | Algeciras |
| Alicante CF | Alicante Nord | `esp-alicante-nord` | ALN | Alicante |
| Almería CF / UD Almería | Almería | `esp-almeria` | ALM | Almería |
| Athletic Club | Bilbao | `esp-bilbao` | BIL | Bilbao |
| Atlético de Madrid | Madrid Rot-Weiß | `esp-madrid-rot-weiss` | MRW | Madrid |
| Atlético Madrileño / Atlético B (Reserve) | Madrid Rot-Weiß II | `esp-madrid-rot-weiss-ii` | MA2 | Madrid |
| Atlético Marbella | Marbella | `esp-marbella` | MAR | Marbella |
| Barakaldo CF | Barakaldo | `esp-barakaldo` | BAA | Barakaldo |
| Barcelona Atlètic / FC Barcelona B (Reserve) | Barcelona II | `esp-barcelona-ii` | BA2 | Barcelona |
| Bilbao Athletic (Reserve) | Bilbao II | `esp-bilbao-ii` | BI2 | Bilbao |
| Burgos CF (alt und neu) | Burgos | `esp-burgos` | BUR | Burgos |
| CA Osasuna | Pamplona | `esp-pamplona` | PAM | Pamplona |
| Cartagena FC / FC Cartagena | Cartagena | `esp-cartagena` | CAR | Cartagena |
| Castilla CF / Real Madrid Castilla (Reserve) | Madrid Weiß II | `esp-madrid-weiss-ii` | MD2 | Madrid |
| CD Alcoyano | Alcoy | `esp-alcoy` | ACO | Alcoy |
| CD Badajoz | Badajoz | `esp-badajoz` | BAD | Badajoz |
| CD Castellón | Castellón | `esp-castellon` | CAS | Castellón |
| CD Eldense | Elda | `esp-elda` | ELD | Elda |
| CD Ensidesa | Avilés-Llaranes | `esp-aviles-llaranes` | AVL | Avilés |
| CD Guadalajara | Guadalajara | `esp-guadalajara` | GUA | Guadalajara |
| CD Leganés | Leganés | `esp-leganes` | LEG | Leganés |
| CD Linares | Linares | `esp-linares` | LIN | Linares |
| CD Logroñés / UD Logroñés | Logroño | `esp-logrono` | LOG | Logroño |
| CD Lugo | Lugo | `esp-lugo` | LUG | Lugo |
| CD Mirandés | Miranda de Ebro | `esp-miranda-de-ebro` | MDE | Miranda de Ebro |
| CD Málaga (bis 1992) / Málaga CF | Málaga | `esp-malaga` | MAL | Málaga |
| CD Numancia | Soria | `esp-soria` | SOR | Soria |
| CD Ourense | Ourense | `esp-ourense` | OUR | Ourense |
| CD Tenerife | Teneriffa | `esp-teneriffa` | TEN | Santa Cruz de Tenerife |
| CD Toledo | Toledo | `esp-toledo` | TOL | Toledo |
| CE Sabadell | Sabadell | `esp-sabadell` | SAB | Sabadell |
| CF Calvo Sotelo | Puertollano | `esp-puertollano` | PUE | Puertollano |
| CF Extremadura / Extremadura UD | Almendralejo | `esp-almendralejo` | ALE | Almendralejo |
| CF Fuenlabrada | Fuenlabrada | `esp-fuenlabrada` | FUE | Fuenlabrada |
| CF Lorca Deportiva / Lorca Deportiva / Lorca FC | Lorca | `esp-lorca` | LOR | Lorca |
| CF Palencia | Palencia | `esp-palencia` | PAE | Palencia |
| CF Rayo Majadahonda | Majadahonda | `esp-majadahonda` | MAJ | Majadahonda |
| CF Reus Deportiu | Reus | `esp-reus` | REU | Reus |
| CFJ Mollerussa | Mollerussa | `esp-mollerussa` | MOL | Mollerussa |
| Ciudad de Murcia | Murcia Stadt | `esp-murcia-stadt` | MUS | Murcia |
| Club Getafe Deportivo (bis 1982) | Getafe Süd | `esp-getafe-sued` | GES | Getafe |
| CP Mérida | Mérida | `esp-merida` | MER | Mérida |
| Cultural y Deportiva Leonesa | León | `esp-leon` | LEO | León |
| Cádiz CF | Cádiz | `esp-cadiz` | CAD | Cádiz |
| Córdoba CF | Córdoba | `esp-cordoba` | COR | Córdoba |
| Deportivo Alavés | Vitoria | `esp-vitoria` | VIT | Vitoria |
| Deportivo Aragón (Reserve) | Saragossa II | `esp-saragossa-ii` | SR2 | Saragossa |
| Elche CF | Elche | `esp-elche` | ELC | Elche |
| FC Andorra | Andorra | `esp-andorra` | AND | Andorra la Vella |
| FC Barcelona | Barcelona | `esp-barcelona` | BAR | Barcelona |
| Getafe CF | Getafe | `esp-getafe` | GET | Getafe |
| Gimnàstic de Tarragona | Tarragona | `esp-tarragona` | TAR | Tarragona |
| Girona FC | Girona | `esp-girona` | GIR | Girona |
| Granada 74 | Granada Ost | `esp-granada-ost` | GRO | Granada |
| Granada CF | Granada | `esp-granada` | GRA | Granada |
| Hércules CF | Alicante | `esp-alicante` | ALI | Alicante |
| Levante UD | Valencia Blau-Rot | `esp-valencia-blau-rot` | VBR | Valencia |
| Málaga B (Reserve) | Málaga II | `esp-malaga-ii` | ML2 | Málaga |
| Orihuela Deportiva | Orihuela | `esp-orihuela` | ORI | Orihuela |
| Palamós CF | Palamós | `esp-palamos` | PAA | Palamós |
| Polideportivo Ejido | El Ejido | `esp-el-ejido` | ELE | El Ejido |
| Pontevedra CF | Pontevedra | `esp-pontevedra` | POT | Pontevedra |
| Racing Club de Ferrol | Ferrol | `esp-ferrol` | FER | Ferrol |
| Rayo Vallecano | Madrid-Vallecas | `esp-madrid-vallecas` | MAV | Madrid |
| RC Celta de Vigo | Vigo | `esp-vigo` | VIG | Vigo |
| RC Deportivo de La Coruña | La Coruña | `esp-la-coruna` | LAC | La Coruña |
| RCD Espanyol | Barcelona Blau-Weiß | `esp-barcelona-blau-weiss` | BBW | Barcelona |
| RCD Mallorca | Palma | `esp-palma` | PAL | Palma |
| RCD Mallorca B (Reserve) | Palma II | `esp-palma-ii` | PA2 | Palma |
| Real Avilés | Avilés | `esp-aviles` | AVI | Avilés |
| Real Betis | Sevilla Grün-Weiß | `esp-sevilla-gruen-weiss` | SGW | Sevilla |
| Real Burgos CF | Burgos Nord | `esp-burgos-nord` | BUN | Burgos |
| Real Jaén | Jaén | `esp-jaen` | JAE | Jaén |
| Real Madrid CF | Madrid Weiß | `esp-madrid-weiss` | MAW | Madrid |
| Real Murcia | Murcia | `esp-murcia` | MUR | Murcia |
| Real Oviedo | Oviedo | `esp-oviedo` | OVI | Oviedo |
| Real Racing Club de Santander | Santander | `esp-santander` | SAN | Santander |
| Real Sociedad | San Sebastián | `esp-san-sebastian` | SAS | San Sebastián |
| Real Sociedad B (Reserve) | San Sebastián II | `esp-san-sebastian-ii` | SA2 | San Sebastián |
| Real Sporting de Gijón | Gijón | `esp-gijon` | GIJ | Gijón |
| Real Unión | Irún | `esp-irun` | IRU | Irún |
| Real Valladolid | Valladolid | `esp-valladolid` | VLL | Valladolid |
| Real Zaragoza | Saragossa | `esp-saragossa` | SAR | Saragossa |
| Recreativo de Huelva | Huelva | `esp-huelva` | HUL | Huelva |
| SD Amorebieta | Amorebieta | `esp-amorebieta` | AMO | Amorebieta |
| SD Compostela | Santiago de Compostela | `esp-santiago-de-compostela` | SDC | Santiago de Compostela |
| SD Eibar | Eibar | `esp-eibar` | EIB | Eibar |
| SD Huesca | Huesca | `esp-huesca` | HUE | Huesca |
| SD Ponferradina | Ponferrada | `esp-ponferrada` | PON | Ponferrada |
| Sestao SC | Sestao | `esp-sestao` | SES | Sestao |
| Sevilla Atlético (Reserve) | Sevilla Weiß-Rot II | `esp-sevilla-weiss-rot-ii` | SE2 | Sevilla |
| Sevilla FC | Sevilla Weiß-Rot | `esp-sevilla-weiss-rot` | SWR | Sevilla |
| Terrassa FC | Terrassa | `esp-terrassa` | TER | Terrassa |
| UCAM Murcia CF | Murcia Universität | `esp-murcia-universitaet` | MUU | Murcia |
| UD Alzira | Alzira | `esp-alzira` | ALZ | Alzira |
| UD Ibiza | Ibiza | `esp-ibiza` | IBI | Ibiza |
| UD Las Palmas | Las Palmas | `esp-las-palmas` | LAP | Las Palmas |
| UD Salamanca | Salamanca | `esp-salamanca` | SAL | Salamanca |
| UD Vecindario | Vecindario | `esp-vecindario` | VEC | Vecindario |
| UE Figueres | Figueres | `esp-figueres` | FIG | Figueres |
| UE Llagostera | Llagostera | `esp-llagostera` | LLA | Llagostera |
| UE Lleida | Lleida | `esp-lleida` | LLE | Lleida |
| UE Sant Andreu | Barcelona-Sant Andreu | `esp-barcelona-sant-andreu` | BSA | Barcelona |
| Universidad de Las Palmas CF | Las Palmas Universität | `esp-las-palmas-universitaet` | LPU | Las Palmas |
| Valencia CF | Valencia | `esp-valencia` | VAL | Valencia |
| Villarreal CF | Villarreal | `esp-villarreal` | VIL | Villarreal |
| Villarreal CF B (Reserve) | Villarreal II | `esp-villarreal-ii` | VI2 | Villarreal |
| Xerez CD | Jerez | `esp-jerez` | JER | Jerez de la Frontera |
| Écija Balompié | Écija | `esp-ecija` | ECI | Écija |

Farben großer Vereine nach Vereinsfarben; bei kleinen Vereinen teils **geschätzt**.

## Quelle je Saison

| Saison | 1. Liga | 2. Liga | Anmerkung |
|---|---|---|---|
| 1975/76 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Cádiz Relegationsrunde (bleibt) |
| 1976/77 | engsoccerdata (berechnet) | Wikipedia (WebFetch) |  |
| 1977/78 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Erste Saison mit Segunda División B als dritter Liga |
| 1978/79 | engsoccerdata (berechnet) | Wikipedia (WebFetch) |  |
| 1979/80 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Castilla (Reserve) als Pokalfinalist im Europapokal der Pokalsieger 1980/81 |
| 1980/81 | engsoccerdata (berechnet) | Wikipedia (WebFetch) |  |
| 1981/82 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Almería -4 Punkte; Burgos, Almería, Levante, Getafe wegen nicht gezahlter Gehälter abgestiegen; Alavés bleibt |
| 1982/83 | engsoccerdata (berechnet) | Wikipedia (WebFetch) |  |
| 1983/84 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Reservemannschaften Castilla und Bilbao B nicht aufstiegsberechtigt |
| 1984/85 | engsoccerdata (berechnet) | Wikipedia (WebFetch) |  |
| 1985/86 | engsoccerdata (berechnet) | Wikipedia (WebFetch) |  |
| 1986/87 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | 18 Vereine, Endrunde in Aufstiegs- und Abstiegsgruppen; wegen Aufstockung auf 20 kein Absteiger |
| 1987/88 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Aufstockung auf 20 Vereine; Oviedo über Relegation aufgestiegen (Castilla nicht aufstiegsberechtigt) |
| 1988/89 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Tenerife und Mallorca über Relegation aufgestiegen |
| 1989/90 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Espanyol über Relegation aufgestiegen |
| 1990/91 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Orihuela wegen nicht gezahlter Gehälter zwangsabgestiegen, Barcelona B bleibt |
| 1991/92 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Murcia ohne Umwandlung in eine SAD zwangsabgestiegen, Sestao bleibt; CD Málaga aufgelöst |
| 1992/93 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Racing über Relegation aufgestiegen |
| 1993/94 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Compostela über Relegation aufgestiegen |
| 1994/95 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Salamanca über Relegation aufgestiegen; Sevilla/Celta-Zwangsabstieg 1995 zurückgenommen, Getafe und Leganés bleiben |
| 1995/96 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Sevilla Weiß-Rot und Vigo im Sommer 1995 zwangsabgestiegen (fehlende Bürgschaften), wieder zugelassen; Liga auf 22 Vereine aufgestockt; erste Saison mit drei Punkten pro Sieg; Extremadura über Relegation aufgestiegen; Castilla nicht aufstiegsberechtigt; erste Saison mit drei Punkten pro Sieg |
| 1996/97 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Mallorca über Relegation aufgestiegen |
| 1997/98 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Verkleinerung auf 20 Vereine; 22 Vereine; Villarreal über Relegation aufgestiegen |
| 1998/99 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Sevilla und Rayo über Relegation aufgestiegen; Atlético B nicht aufstiegsberechtigt |
| 1999/00 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Mérida und Logroñés wegen nicht gezahlter Gehälter zwangsabgestiegen, Atlético B wegen Abstieg der ersten Mannschaft; Recreativo bleibt |
| 2000/01 | engsoccerdata (berechnet) | Wikipedia (WebFetch) |  |
| 2001/02 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Burgos ohne SAD-Umwandlung zwangsabgestiegen, Levante bleibt |
| 2002/03 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Compostela (Kapitalerhöhung) und Oviedo (Gehälter) zwangsabgestiegen, Leganés bleibt |
| 2003/04 | engsoccerdata (berechnet) | Wikipedia (WebFetch) |  |
| 2004/05 | engsoccerdata (berechnet) | Wikipedia (WebFetch) |  |
| 2005/06 | engsoccerdata (berechnet) | Wikipedia (WebFetch) |  |
| 2006/07 | engsoccerdata (berechnet) | Wikipedia (WebFetch) |  |
| 2007/08 | engsoccerdata (berechnet) | Wikipedia (WebFetch) |  |
| 2008/09 | engsoccerdata (berechnet) | Wikipedia (WebFetch) |  |
| 2009/10 | engsoccerdata (berechnet) | Wikipedia (WebFetch) |  |
| 2010/11 | RSSSF tabless/span2011.txt | RSSSF tabless/span2011.txt |  |
| 2011/12 | RSSSF tabless/span2012.txt | RSSSF tabless/span2012.txt |  |
| 2012/13 | RSSSF tabless/span2013.txt | RSSSF tabless/span2013.txt |  |
| 2013/14 | RSSSF tabless/span2014.txt | RSSSF tabless/span2014.txt |  |
| 2014/15 | RSSSF tabless/span2015.txt | RSSSF tabless/span2015.txt |  |
| 2015/16 | RSSSF tabless/span2016.txt | RSSSF tabless/span2016.txt |  |
| 2016/17 | RSSSF tabless/span2017.txt | RSSSF tabless/span2017.txt |  |
| 2017/18 | RSSSF tabless/span2018.txt | RSSSF tabless/span2018.txt |  |
| 2018/19 | RSSSF tabless/span2019.txt | RSSSF tabless/span2019.txt |  |
| 2019/20 | RSSSF tabless/span2020.txt | RSSSF tabless/span2020.txt |  |
| 2020/21 | RSSSF tabless/span2021.txt | RSSSF tabless/span2021.txt |  |
| 2021/22 | RSSSF tabless/span2022.txt | RSSSF tabless/span2022.txt |  |
| 2022/23 | RSSSF tabless/span2023.txt | RSSSF tabless/span2023.txt |  |
| 2023/24 | RSSSF tabless/span2024.txt | RSSSF tabless/span2024.txt |  |
| 2024/25 | RSSSF tabless/span2025.txt | footballcsv/cache.wfb (berechnet) |  |
| 2025/26 | RSSSF tabless/span2026.txt | RSSSF tabless/span2026.txt |  |

## Unsicherheiten / Besonderheiten

- Primera 1979/80: in engsoccerdata fehlt ein Spiel (Tabelle aus 305 Spielen); Reihenfolge an der Spitze unverändert.
- Reservemannschaften (Castilla, Atlético B/Madrileño, Barcelona B, Bilbao Athletic, Sevilla Atlético, Mallorca B,
  Málaga B, Villarreal B, Real Sociedad B, Deportivo Aragón) sind eigene Vereine „<Stammverein> II“.
- 1986/87 Segunda mit Zwischenrunden (Aufstiegsgruppen A1/A2 + Abstiegsgruppe B): Reihenfolge = Aufstiegsgruppen
  nach Punkten, dann Gruppe B.
- Zusammengefasst trotz Neugründung: Málaga (CD Málaga bis 1992 / Málaga CF), Burgos CF (alt/neu), Logroñés (CD/UD),
  Extremadura (CF/UD), Lorca (drei Vereine), Almería CF / UD Almería. Getrennt: AD Almería („Almería Ost“),
  Getafe Deportivo („Getafe Süd“), Real Burgos („Burgos Nord“), Granada 74 („Granada Ost“), Alicante CF („Alicante Nord“).
  Diese Zusatznamen sind frei gewählt (keine Farb-/Stadtteilgrundlage).

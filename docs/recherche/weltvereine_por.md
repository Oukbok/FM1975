# Weltvereine por – Portugal (Primeira Divisão/Liga / 2. Liga)

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
| AC Marinhense | Marinha Grande | `por-marinha-grande` | MAG | Marinha Grande |
| Académica de Coimbra | Coimbra | `por-coimbra` | COI | Coimbra |
| Académico de Viseu | Viseu | `por-viseu` | VIS | Viseu |
| AD Esposende | Esposende | `por-esposende` | ESO | Esposende |
| AD Fafe | Fafe | `por-fafe` | FAF | Fafe |
| AD Guarda | Guarda | `por-guarda` | GUA | Guarda |
| AD Ovarense | Ovar | `por-ovar` | OVA | Ovar |
| AD Sanjoanense | São João da Madeira | `por-sao-joao-da-madeira` | SJD | São João da Madeira |
| Almada AC | Almada | `por-almada` | ALM | Almada |
| Amarante FC | Amarante | `por-amarante` | AMR | Amarante |
| Amora FC | Amora | `por-amora` | AMO | Seixal |
| Anadia FC | Anadia | `por-anadia` | ANA | Anadia |
| Atlético CP | Lissabon-Alcântara | `por-lissabon-alcantara` | LIA | Lissabon |
| AVS Futebol SAD (ab 2023) | Vila das Aves | `por-vila-das-aves` | VDA | Vila das Aves |
| Belenenses SAD / B-SAD (ab 2018/19) | Oeiras | `por-oeiras` | OEI | Oeiras |
| Boavista FC | Porto Schwarz-Weiß | `por-porto-schwarz-weiss` | PSW | Porto |
| CA Valdevez | Arcos de Valdevez | `por-arcos-de-valdevez` | ADV | Arcos de Valdevez |
| Caldas SC | Caldas da Rainha | `por-caldas-da-rainha` | CDR | Caldas da Rainha |
| Casa Pia AC | Lissabon Schwarz-Weiß | `por-lissabon-schwarz-weiss` | LSW | Lissabon |
| CD Aves | Aves | `por-aves` | AVE | Vila das Aves |
| CD Beja | Beja | `por-beja` | BEJ | Beja |
| CD Cova da Piedade | Cova da Piedade | `por-cova-da-piedade` | CDP | Almada |
| CD Estarreja | Estarreja | `por-estarreja` | EST | Estarreja |
| CD Feirense | Feira | `por-feira` | FEI | Santa Maria da Feira |
| CD Lousanense | Lousã | `por-lousa` | LOS | Lousã |
| CD Mafra | Mafra | `por-mafra` | MAF | Mafra |
| CD Montijo | Montijo | `por-montijo` | MOT | Montijo |
| CD Nacional | Funchal Schwarz-Weiß | `por-funchal-schwarz-weiss` | FSW | Funchal |
| CD Olivais e Moscavide | Lissabon-Olivais | `por-lissabon-olivais` | LIO | Lissabon |
| CD Portalegrense | Portalegre | `por-portalegre` | POT | Portalegre |
| CD Santa Clara | Ponta Delgada | `por-ponta-delgada` | POD | Ponta Delgada |
| CD Tondela | Tondela | `por-tondela` | TON | Tondela |
| CD Torres Novas | Torres Novas | `por-torres-novas` | TNO | Torres Novas |
| CD Trofense | Trofa | `por-trofa` | TRO | Trofa |
| CF Esperança de Lagos | Lagos | `por-lagos` | LAG | Lagos |
| CF Estrela da Amadora (alt und neu) | Amadora | `por-amadora` | AMA | Amadora |
| CF Os Belenenses | Lissabon Blau | `por-lissabon-blau` | LIB | Lissabon |
| CF União (Madeira) | Funchal Blau-Gelb | `por-funchal-blau-gelb` | FBG | Funchal |
| CF União de Coimbra | Coimbra Rot | `por-coimbra-rot` | COR | Coimbra |
| CF União de Lamas | Lamas | `por-lamas` | LAM | Santa Maria de Lamas |
| Clube Oriental de Lisboa | Lissabon-Marvila | `por-lissabon-marvila` | LIM | Lissabon |
| CS Marítimo | Funchal Grün-Rot | `por-funchal-gruen-rot` | FGR | Funchal |
| Ermesinde SC | Ermesinde | `por-ermesinde` | ERM | Ermesinde |
| FC Alverca | Alverca | `por-alverca` | ALV | Alverca do Ribatejo |
| FC Arouca | Arouca | `por-arouca` | ARO | Arouca |
| FC Barreirense | Barreiro Rot-Weiß | `por-barreiro-rot-weiss` | BRW | Barreiro |
| FC Famalicão | Famalicão | `por-famalicao` | FAM | Vila Nova de Famalicão |
| FC Felgueiras | Felgueiras | `por-felgueiras` | FEL | Felgueiras |
| FC Infesta | Infesta | `por-infesta` | INF | São Mamede de Infesta |
| FC Maia | Maia | `por-maia` | MAI | Maia |
| FC Marco | Marco de Canaveses | `por-marco-de-canaveses` | MDC | Marco de Canaveses |
| FC Paços de Ferreira | Paços de Ferreira | `por-pacos-de-ferreira` | PDF | Paços de Ferreira |
| FC Penafiel | Penafiel | `por-penafiel` | PEN | Penafiel |
| FC Porto | Porto | `por-porto` | POR | Porto |
| FC Porto B (Reserve) | Porto II | `por-porto-ii` | PO2 | Porto |
| FC Tirsense | Santo Tirso | `por-santo-tirso` | SAT | Santo Tirso |
| FC Vizela | Vizela | `por-vizela` | VIZ | Vizela |
| GC Alcobaça | Alcobaça | `por-alcobaca` | ALC | Alcobaça |
| GD Alcochetense | Alcochete | `por-alcochete` | ALO | Alcochete |
| GD Bragança | Bragança | `por-braganca` | BRG | Bragança |
| GD Chaves | Chaves | `por-chaves` | CHA | Chaves |
| GD CUF / Quimigal / Fabril do Barreiro | Barreiro Grün | `por-barreiro-gruen` | BAG | Barreiro |
| GD Estoril Praia | Estoril | `por-estoril` | ETO | Estoril |
| GD Joane | Joane | `por-joane` | JOA | Joane |
| GD Mangualde | Mangualde | `por-mangualde` | MAN | Mangualde |
| GD Mealhada | Mealhada | `por-mealhada` | MEA | Mealhada |
| GD Nazarenos | Nazaré | `por-nazare` | NAZ | Nazaré |
| GD Peniche | Peniche | `por-peniche` | PEI | Peniche |
| GD Riopele | Saramagos | `por-saramagos` | SAR | Pousada de Saramagos |
| GD Samora Correia | Samora Correia | `por-samora-correia` | SCO | Samora Correia |
| GD Sesimbra | Sesimbra | `por-sesimbra` | SES | Sesimbra |
| Gil Vicente FC | Barcelos | `por-barcelos` | BAR | Barcelos |
| GUS Montemor | Montemor-o-Novo | `por-montemor-o-novo` | MON | Montemor-o-Novo |
| Imortal DC | Albufeira | `por-albufeira` | ALU | Albufeira |
| Juventude Sport Clube (Évora) | Évora Schwarz-Weiß | `por-evora-schwarz-weiss` | ESW | Évora |
| Leixões SC | Matosinhos | `por-matosinhos` | MAT | Matosinhos |
| Leça FC | Leça | `por-leca` | LEC | Leça da Palmeira |
| Louletano DC | Loulé | `por-loule` | LOU | Loulé |
| Lusitano FC (VRSA) | Vila Real de Santo António | `por-vila-real-de-santo-antonio` | VRD | Vila Real de Santo António |
| Lusitano GC (Évora) | Évora Grün-Weiß | `por-evora-gruen-weiss` | EGW | Évora |
| Lusitânia FC (Lourosa) | Lourosa | `por-lourosa` | LOR | Lourosa |
| Luso (Centro-Staffel 1988/89) | Luso | `por-luso` | LUS | Luso |
| Moreirense FC | Moreira | `por-moreira` | MOR | Moreira de Cónegos |
| Naval 1º de Maio | Figueira da Foz | `por-figueira-da-foz` | FDF | Figueira da Foz |
| Neves FC | Neves | `por-neves` | NEV | Viana do Castelo |
| O Elvas CAD | Elvas | `por-elvas` | ELV | Elvas |
| Odivelas FC | Odivelas | `por-odivelas` | ODI | Odivelas |
| Oliveira do Bairro SC | Oliveira do Bairro | `por-oliveira-do-bairro` | ODB | Oliveira do Bairro |
| Os Marialvas | Cantanhede | `por-cantanhede` | CAN | Cantanhede |
| Portimonense SC | Portimão | `por-portimao` | PRT | Portimão |
| RD Águeda | Águeda | `por-agueda` | AGU | Águeda |
| Rio Ave FC | Vila do Conde | `por-vila-do-conde` | VDC | Vila do Conde |
| Santa Maria FC (Norte-Staffel 1988/89) | Galegos | `por-galegos` | GAL | Barcelos |
| SC Alba | Albergaria | `por-albergaria` | ALB | Albergaria-a-Velha |
| SC Beira-Mar | Aveiro | `por-aveiro` | AVI | Aveiro |
| SC Braga | Braga | `por-braga` | BRA | Braga |
| SC Campomaiorense | Campo Maior | `por-campo-maior` | CAM | Campo Maior |
| SC Covilhã | Covilhã | `por-covilha` | COV | Covilhã |
| SC Espinho | Espinho | `por-espinho` | ESP | Espinho |
| SC Estrela (Portalegre) | Portalegre Rot | `por-portalegre-rot` | PRO | Portalegre |
| SC Farense | Faro | `por-faro` | FAR | Faro |
| SC Freamunde | Freamunde | `por-freamunde` | FRE | Freamunde |
| SC Lusitânia (Azoren) | Angra | `por-angra` | ANG | Angra do Heroísmo |
| SC Mirandela | Mirandela | `por-mirandela` | MIR | Mirandela |
| SC Olhanense | Olhão | `por-olhao` | OLH | Olhão |
| SC Régua | Régua | `por-regua` | REG | Peso da Régua |
| SC Salgueiros | Porto Rot | `por-porto-rot` | PRR | Porto |
| SC Vianense | Viana do Castelo | `por-viana-do-castelo` | VID | Viana do Castelo |
| SC Vila Real | Vila Real | `por-vila-real` | VIR | Vila Real |
| SCU Torreense | Torres Vedras | `por-torres-vedras` | TOV | Torres Vedras |
| Seixal FC | Seixal | `por-seixal` | SEI | Seixal |
| SG Sacavenense | Sacavém | `por-sacavem` | SAC | Sacavém |
| Silves FC | Silves | `por-silves` | SIL | Silves |
| SL Benfica | Lissabon Rot | `por-lissabon-rot` | LSR | Lissabon |
| SL Benfica B (Reserve) | Lissabon Rot II | `por-lissabon-rot-ii` | LI2 | Lissabon |
| SL Cartaxo | Cartaxo | `por-cartaxo` | CAR | Cartaxo |
| Sport Benfica e Castelo Branco | Castelo Branco | `por-castelo-branco` | CAB | Castelo Branco |
| Sport Viseu e Benfica | Viseu Rot | `por-viseu-rot` | VRO | Viseu |
| Sporting CP | Lissabon Grün | `por-lissabon-gruen` | LSG | Lissabon |
| SU Sintrense | Sintra | `por-sintra` | SIN | Sintra |
| UD Leiria | Leiria | `por-leiria` | LEI | Leiria |
| UD Oliveirense | Oliveira de Azeméis | `por-oliveira-de-azemeis` | ODA | Oliveira de Azeméis |
| UD Rio Maior | Rio Maior | `por-rio-maior` | RIM | Rio Maior |
| UD Valonguense | Valongo | `por-valongo` | VAL | Valongo |
| UD Vilafranquense | Vila Franca de Xira | `por-vila-franca-de-xira` | VFD | Vila Franca de Xira |
| União de Santarém | Santarém | `por-santarem` | SAN | Santarém |
| União de Santiago | Santiago do Cacém | `por-santiago-do-cacem` | SDC | Santiago do Cacém |
| União de Tomar | Tomar | `por-tomar` | TOM | Tomar |
| União Mirense | Mira | `por-mira` | MIA | Mira |
| USC Paredes | Paredes | `por-paredes` | PAR | Paredes |
| Varzim SC | Póvoa | `por-povoa` | POV | Póvoa de Varzim |
| Vasco da Gama AC (Sines) | Sines | `por-sines` | SIE | Sines |
| Vilanovense FC | Vila Nova de Gaia | `por-vila-nova-de-gaia` | VND | Vila Nova de Gaia |
| Vilaverdense FC | Vila Verde | `por-vila-verde` | VIV | Vila Verde |
| Vitória FC (Setúbal) | Setúbal | `por-setubal` | SET | Setúbal |
| Vitória SC (Guimarães) | Guimarães | `por-guimaraes` | GUI | Guimarães |

Farben großer Vereine nach Vereinsfarben; bei kleinen Vereinen teils **geschätzt**.

## Quelle je Saison

| Saison | 1. Liga | 2. Liga | Anmerkung |
|---|---|---|---|
| 1975/76 | schochastics/football-data (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 1976/77 | schochastics/football-data (berechnet) | Wikipedia (WebFetch) | Drei Staffeln Nord/Mitte/Süd; Meisterrunde Marítimo; Aufstiegsrunde Espinho |
| 1977/78 | schochastics/football-data (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 1978/79 | schochastics/football-data (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 1979/80 | schochastics/football-data (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 1980/81 | schochastics/football-data (berechnet) | Wikipedia (WebFetch) | Meisterrunde Leiria; Aufstiegsrunde Académico Viseu |
| 1981/82 | schochastics/football-data (berechnet) | Wikipedia (WebFetch) | Meisterrunde Marítimo; Aufstiegsrunde Salgueiros und Penafiel |
| 1982/83 | schochastics/football-data (berechnet) | Wikipedia (WebFetch) | Meisterrunde Farense; Aufstiegsrunde Espinho |
| 1983/84 | schochastics/football-data (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 1984/85 | schochastics/football-data (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 1985/86 | schochastics/football-data (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 1986/87 | schochastics/football-data (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 1987/88 | schochastics/football-data (berechnet) | **fehlt (keine Quelle erreichbar)** | Aufstockung auf 20 Vereine; 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 1988/89 | schochastics/football-data (berechnet) | Wikipedia (WebFetch) | Aufstiegsrunde: União da Madeira, Tirsense, Feirense steigen auf |
| 1989/90 | schochastics/football-data (berechnet) | Wikipedia (WebFetch) | Verkleinerung auf 18 Vereine; Letzte Saison der dreigeteilten 2. Liga; Salgueiros, Gil Vicente, Farense steigen auf; ab 1990/91 Segunda Divisão de Honra |
| 1990/91 | schochastics/football-data (berechnet) | Wikipedia (WebFetch) | 20 Vereine; Neue Segunda Divisão de Honra (eine Staffel, 20 Vereine); sieben Absteiger wegen Verkleinerung auf 18 |
| 1991/92 | schochastics/football-data (berechnet) | Wikipedia (WebFetch) | 18 Vereine |
| 1992/93 | schochastics/football-data (berechnet) | Wikipedia (WebFetch) |  |
| 1993/94 | football-data (nur Hinrunde) + Wissen – **Reihenfolge ab Platz 4 unsicher** | Wikipedia (WebFetch) | Tabelle ab Platz 4 nur aus der Hinrunde rekonstruiert (Quelle unvollständig) |
| 1994/95 | engsoccerdata (berechnet) | Wikipedia (WebFetch) |  |
| 1995/96 | engsoccerdata (berechnet) | Wikipedia (WebFetch) | Erste Saison mit drei Punkten pro Sieg |
| 1996/97 | engsoccerdata (berechnet) | Wikipedia (WebFetch) |  |
| 1997/98 | engsoccerdata (berechnet) | Wikipedia (WebFetch) |  |
| 1998/99 | engsoccerdata (berechnet) | Wikipedia (WebFetch) |  |
| 1999/00 | engsoccerdata (berechnet) | Wikipedia (WebFetch) |  |
| 2000/01 | engsoccerdata (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 2001/02 | engsoccerdata (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 2002/03 | engsoccerdata (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 2003/04 | engsoccerdata (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 2004/05 | engsoccerdata (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 2005/06 | engsoccerdata (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 2006/07 | engsoccerdata (berechnet) | **fehlt (keine Quelle erreichbar)** | Verkleinerung auf 16 Vereine; 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 2007/08 | engsoccerdata (berechnet) | **fehlt (keine Quelle erreichbar)** | Apito Dourado: Porto 6 Punkte Abzug, Porto Schwarz-Weiß in die 2. Liga versetzt; 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 2008/09 | engsoccerdata (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 2009/10 | engsoccerdata (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 2010/11 | engsoccerdata (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 2011/12 | engsoccerdata (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 2012/13 | engsoccerdata (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 2013/14 | engsoccerdata (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 2014/15 | engsoccerdata (berechnet) | **fehlt (keine Quelle erreichbar)** | Aufstockung auf 18 Vereine; 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 2015/16 | engsoccerdata (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 2016/17 | engsoccerdata (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 2017/18 | engsoccerdata (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 2018/19 | engsoccerdata (berechnet) | **fehlt (keine Quelle erreichbar)** | Oeiras (B-SAD) übernimmt den Erstliga-Platz von Lissabon Blau; 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 2019/20 | engsoccerdata (berechnet) | **fehlt (keine Quelle erreichbar)** | Setúbal und Aves nach der Saison aus finanziellen Gründen zwangsabgestiegen; 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |
| 2020/21 | engsoccerdata (berechnet) | openfootball (berechnet) |  |
| 2021/22 | engsoccerdata (berechnet) | openfootball (berechnet) |  |
| 2022/23 | engsoccerdata (berechnet) | openfootball (berechnet) |  |
| 2023/24 | engsoccerdata (berechnet) | openfootball (berechnet) |  |
| 2024/25 | engsoccerdata (berechnet) | openfootball (berechnet, unvollständig 234 Spiele) |  |
| 2025/26 | openfootball (berechnet) | **fehlt (keine Quelle erreichbar)** | 2. Liga (Segunda Divisão / Liga de Honra) in dieser Saison nicht erfasst – Quelle fehlte |

## Unsicherheiten / Lücken

- **2. Liga fehlt** (keine Quelle erreichbar, Suchkontingent erschöpft): 1975/76, 1977/78–1979/80, 1983/84–1987/88,
  2000/01–2019/20, 2025/26. Bis 1989/90 spielte die 2. Liga in drei Staffeln (Norte → `t2`, Centro + Sul → `t2b`).
- 2024/25 2. Liga aus unvollständigen Ergebnissen (234 von 306 Spielen) berechnet – Reihenfolge unsicher.
- 1993/94 1. Liga: nur Hinrunde in der Quelle; Plätze 1–3 und Europapokalplätze aus Europapokal-Teilnahme/Wissen,
  Rest nach Hinrundentabelle, Absteiger (Paços, Estoril, Famalicão) aus der Folgesaison abgeleitet.
- Zonenzuordnung 1980/81 und 1981/82 ohne Zonennamen in der Quelle, nach Lage der Vereine.
- Belenenses: Verein bis 2017/18 = „Lissabon Blau“; der Erstliga-Platz ab 2018/19 gehört B-SAD = „Oeiras“.
- Zusammengefasst: Estrela da Amadora (alt/neu), União da Madeira („Madeira“ in engsoccerdata). Getrennt: CD Aves / AVS.
- Viele kleine Drittligisten der Staffeln: Farben geschätzt; „Luso“, „Santa Maria“ (→ „Galegos“), „Lusitânia“ (Azoren)
  nur aus Kurznamen der Quelle zugeordnet.

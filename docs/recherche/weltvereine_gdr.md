# Weltvereine DDR (`gdr`) – Recherche

DDR-Oberliga (t1) und DDR-Liga (t2) 1975/76–1990/91, FDGB-Pokal, Europapokal. Ab 1991/92 spielen die Vereine in
den gesamtdeutschen Ligen (`seasons/ger.ts`) mit denselben IDs. Echte Namen stehen **nur** hier.

## Quellen und Belegstand
- **Oberliga 1975/76–1990/91:** claudionicoletti.eu „german DR 1971-80“ und „german DR 1981-91“; 1975/76 gegengeprüft
  mit en.wikipedia „1975–76 DDR-Oberliga“. Belegt.
- **DDR-Liga 1975/76–1987/88:** RSSSF „East Germany YYYY/YY“ (rsssf.org/tablesd/ddr76.html … ddr88.html). Belegt.
  Staffeln in `t2` nacheinander (A … E bzw. A, B), je in Tabellenfolge. Reservemannschaften (z. B. Dynamo Dresden II)
  weggelassen, weil derselbe Verein in t1 steht (1975/76 und ab 1984/85 spielten Oberliga-Reserven in der DDR-Liga).
  1976/77 Staffel D hatte laut Quelle nur 11 Vereine. 1977/78 Staffel B: Platz 2 nennt die Quelle „Motor Steinach“,
  der zugleich in Staffel E steht – unplausibel, Eintrag weggelassen (Staffel B daher mit 11).
- **DDR-Liga 1988/89, 1989/90 und NOFV-Liga 1990/91: fehlen** (RSSSF-Seiten über die Sitzung nicht erreichbar,
  Suchkontingent aufgebraucht). Sicher bekannt: 1988/89 u. a. Vorwärts Frankfurt und Riesa (Absteiger 1988),
  Eisenhüttenstadt und Bischofswerda (Aufsteiger 1989); 1989/90 u. a. Union Berlin, Zwickau, Dynamo Schwerin,
  Chemie Leipzig, Vorwärts Frankfurt; 1990/91 u. a. Aue, Bischofswerda, Union, Zwickau, PSV Schwerin.
- **FDGB-Pokal:** Sieger/Finalist 1975/76–1987/88 aus den RSSSF-Saisonseiten; 1988/89–1990/91 **aus Wissen, ungeprüft**.
- **Europapokal:** RSSSF „European Competitions“ 1975/76–1990/91 (Landesmeister zusätzlich `engsoccerdata` champs.csv). Belegt.

## Umbenennungen
- FC Karl-Marx-Stadt → Chemnitzer FC (1990): Name „Karl-Marx-Stadt“, ab 1990 „Chemnitz“; ebenso die zwei kleineren
  Vereine Karl-Marx-Stadt Nord/Süd.
- BFC Dynamo → FC Berlin (1990), Dynamo Dresden → 1. FC Dynamo Dresden (1990), Vorwärts Frankfurt → FC Victoria 91,
  Chemie Leipzig → FC Sachsen Leipzig (1990), Dynamo Schwerin → PSV Schwerin, Zentronik → Robotron Sömmerda,
  Aufbau → Chemie PCK Schwedt, Fortschritt → Aufbau Krumhermersdorf: jeweils dieselbe ID, Spielname unverändert.
- Farben der DDR-Liga-Vereine nach Trägerbereich (Chemie grün, Motor blau, Stahl dunkelblau, Dynamo weinrot,
  Vorwärts rot-gelb, Lok blau-gelb, Aktivist schwarz-gelb …), nicht einzeln belegt.

## Zuordnung echter Name → Spiel
| Echter Verein | ID | Spielname | Kürzel |
|---|---|---|---|
| BSG Motor Altenburg | `gdr-altenburg` | Altenburg | ALT |
| BSG Lokomotive Anklam | `gdr-anklam` | Anklam | ANK |
| FC Erzgebirge Aue (DDR: BSG/FC Wismut Aue) | `ddr-aue` | Aue | AUE |
| SV Babelsberg 03 (DDR: BSG Motor Babelsberg) | `gdr-babelsberg` | Babelsberg | BAB |
| BSG Landbau Bad Langensalza | `gdr-bad-langensalza` | Bad Langensalza | BAL |
| BSG Motor Bautzen | `gdr-bautzen` | Bautzen | BAU |
| BSG Lokomotive Bergen | `gdr-bergen` | Bergen (Rügen) | BER |
| Berliner FC Dynamo (1990: FC Berlin) | `ddr-berlin-ost` | Berlin (Ost) | BEO |
| BSG NARVA Berlin | `gdr-berlin-friedrichshain` | Berlin Friedrichshain | BEF |
| 1. FC Union Berlin | `ddr-union` | Berlin Köpenick | BKÖ |
| BSG EAB Lichtenberg 47 | `gdr-berlin-lichtenberg` | Berlin Lichtenberg | BEL |
| BSG KWO Berlin (Kabelwerk Oberspree) | `gdr-berlin-oberschoeneweide` | Berlin Oberschöneweide | BOB |
| BSG Einheit Pankow | `gdr-berlin-pankow` | Berlin Pankow | BEP |
| BSG Rotation Berlin | `gdr-berlin-prenzlauer-berg` | Berlin Prenzlauer Berg | BPR |
| BSG Bergmann-Borsig Berlin | `gdr-berlin-wilhelmsruh` | Berlin Wilhelmsruh | BEW |
| BSG Fortschritt Bischofswerda | `gdr-bischofswerda` | Bischofswerda | BIS |
| BSG Stahl Blankenburg | `gdr-blankenburg` | Blankenburg | BLA |
| BSV Stahl Brandenburg (DDR: BSG Stahl Brandenburg) | `ddr-brandenburg` | Brandenburg | BRB |
| BSG Motor Süd Brandenburg | `gdr-brandenburg-sued` | Brandenburg Süd | BRS |
| BSG Chemie Böhlen | `gdr-boehlen` | Böhlen | BÖH |
| FC Energie Cottbus | `ddr-cottbus` | Cottbus | COT |
| BSG Lokomotive Cottbus | `gdr-cottbus-blau` | Cottbus Blau | COB |
| BSG Demminer Verkehrsbetriebe | `gdr-demmin` | Demmin | DEM |
| ASG Vorwärts Dessau | `gdr-dessau` | Dessau | DES |
| SG Dynamo Dresden / 1. FC Dynamo Dresden | `ddr-dresden` | Dresden | DRE |
| FSV Lokomotive Dresden | `gdr-dresden-blau` | Dresden Blau | DRB |
| BSG Empor Tabak Dresden | `gdr-dresden-gruen` | Dresden Grün | DRG |
| BSG Chemie Döbern | `gdr-doebern` | Döbern | DÖB |
| BSG Motor Eberswalde | `gdr-eberswalde` | Eberswalde | EBE |
| BSG Motor Eisenach | `gdr-eisenach` | Eisenach | EIS |
| BSG Stahl Eisenhüttenstadt (1990: Eisenhüttenstädter FC Stahl) | `ddr-eisenh` | Eisenhüttenstadt | EHS |
| SG Dynamo Eisleben | `gdr-eisleben` | Eisleben | EIL |
| FC Rot-Weiß Erfurt | `ddr-erfurt` | Erfurt | ERF |
| BSG Umformtechnik Erfurt | `gdr-erfurt-nord` | Erfurt Nord | ERN |
| BSG Aktivist Espenhain | `gdr-espenhain` | Espenhain | ESP |
| BSG Stahl Finow | `gdr-finow` | Finow | FIN |
| FC Vorwärts Frankfurt/Oder (1991: FC Victoria 91) | `ddr-frankfurt-oder` | Frankfurt (Oder) | FFO |
| BSG Halbleiterwerk Frankfurt (Oder) | `gdr-frankfurt-oder-markendorf` | Frankfurt (Oder) Markendorf | FRO |
| SG Dynamo Fürstenwalde | `gdr-fuerstenwalde` | Fürstenwalde | FÜR |
| BSG Wismut Gera | `ddr-gera` | Gera | GER |
| SG Dynamo Gera | `gdr-gera-weinrot` | Gera Weinrot | GEW |
| BSG KKW Greifswald | `gdr-greifswald` | Greifswald | GRE |
| BSG Einheit Grevesmühlen | `gdr-grevesmuehlen` | Grevesmühlen | GRV |
| BSG Motor Grimma | `gdr-grimma` | Grimma | GRI |
| BSG Traktor Groß Lindow | `gdr-gross-lindow` | Groß Lindow | GRL |
| TSG Gröditz | `gdr-groeditz` | Gröditz | GRÖ |
| BSG Chemie Wilhelm-Pieck-Stadt Guben | `gdr-guben` | Guben | GUB |
| BSG Einheit Güstrow | `gdr-guestrow` | Güstrow | GÜS |
| BSG Lokomotive Halberstadt | `gdr-halberstadt` | Halberstadt | HAB |
| Hallescher FC (DDR: Hallescher FC Chemie) | `ddr-halle` | Halle | HAL |
| BSG Empor Halle | `gdr-halle-sued` | Halle Süd | HAS |
| BSG Stahl Hennigsdorf | `gdr-hennigsdorf` | Hennigsdorf | HEN |
| BSG Motor Hennigsdorf | `gdr-hennigsdorf-rot` | Hennigsdorf Rot | HER |
| BSG Motor Hermsdorf | `gdr-hermsdorf` | Hermsdorf | HEM |
| BSG Stahl Walzwerk Hettstedt | `gdr-hettstedt` | Hettstedt | HET |
| BSG Chemie IW Ilmenau | `gdr-ilmenau` | Ilmenau | ILM |
| FC Carl Zeiss Jena | `ddr-jena` | Jena | JEN |
| ASG Vorwärts Kamenz | `gdr-kamenz` | Kamenz | KAM |
| Chemnitzer FC (DDR: FC Karl-Marx-Stadt) | `ddr-chemnitz` | Karl-Marx-Stadt | CHE |
| BSG Motor „Fritz Heckert“ Karl-Marx-Stadt | `gdr-kms-nord` | Karl-Marx-Stadt Nord | KAN |
| BSG Motor „Ascota“ Karl-Marx-Stadt | `gdr-kms-sued` | Karl-Marx-Stadt Süd | KAS |
| BSG Fortschritt/Aufbau Krumhermersdorf | `gdr-krumhermersdorf` | Krumhermersdorf | KRU |
| VfB Leipzig (DDR: 1. FC Lokomotive Leipzig) | `ddr-leipzig` | Leipzig | LEI |
| BSG Chemie Leipzig (1990: FC Sachsen Leipzig) | `ddr-leipzig-chemie` | Leipzig Grün | LEG |
| BSG Stahl Nordwest Leipzig | `gdr-leipzig-nordwest` | Leipzig Nordwest | LEN |
| BSG Motor Ludwigsfelde | `gdr-ludwigsfelde` | Ludwigsfelde | LUD |
| SG Dynamo Lübben | `gdr-luebben` | Lübben | LÜB |
| TSG Lübbenau | `gdr-luebbenau` | Lübbenau | LÜE |
| 1. FC Magdeburg | `ddr-magdeburg` | Magdeburg | MAG |
| BSG/TSG Chemie Markkleeberg | `gdr-markkleeberg` | Markkleeberg | MAR |
| BSG Post Neubrandenburg | `ddr-neubrandenburg` | Neubrandenburg | NBG |
| ASG Vorwärts Neubrandenburg | `gdr-neubrandenburg-rot` | Neubrandenburg Rot | NER |
| BSG Baumechanik Neubrandenburg | `gdr-neubrandenburg-sued` | Neubrandenburg Süd | NES |
| BSG Fortschritt Neustadt (Sachsen) | `gdr-neustadt` | Neustadt (Sachsen) | NSA |
| TSG Neustrelitz | `gdr-neustrelitz` | Neustrelitz | NEU |
| BSG Motor Nordhausen | `gdr-nordhausen` | Nordhausen | NOR |
| BSG Hydraulik Parchim | `gdr-parchim` | Parchim | PAR |
| ASG Vorwärts Plauen | `gdr-plauen` | Plauen | PLA |
| BSG Motor „WaMa“ Plauen | `gdr-plauen-rot` | Plauen Rot | PLR |
| BSG Chemie Premnitz | `gdr-premnitz` | Premnitz | PRE |
| BSG Lokomotive/Armaturen Prenzlau | `gdr-prenzlau` | Prenzlau | PRN |
| BSG Stahl Riesa | `ddr-riesa` | Riesa | RIE |
| FC Hansa Rostock | `ddr-rostock` | Rostock | ROS |
| BSG Schiffahrt/Hafen Rostock | `gdr-rostock-hafen` | Rostock Hafen | ROH |
| TSG Bau Rostock | `gdr-rostock-sued` | Rostock Süd | RSÜ |
| BSG Motor Rudisleben | `gdr-rudisleben` | Rudisleben | RUD |
| TSG Ruhla | `gdr-ruhla` | Ruhla | RUH |
| BSG Mansfeld-Kombinat Sangerhausen | `gdr-sangerhausen` | Sangerhausen | SAN |
| TSG MAB Schkeuditz | `gdr-schkeuditz` | Schkeuditz | SCH |
| BSG Chemie Buna Schkopau | `gdr-schkopau` | Schkopau | SCK |
| BSG Motor/WK Schmalkalden | `gdr-schmalkalden` | Schmalkalden | SCM |
| BSG Chemie Schwarza | `gdr-schwarza` | Schwarza | SCW |
| BSG Aktivist Schwarze Pumpe | `gdr-schwarze-pumpe` | Schwarze Pumpe | SCP |
| BSG Aufbau Schwedt (später Chemie PCK Schwedt) | `gdr-schwedt` | Schwedt | SCE |
| SG Dynamo Schwerin (1990: PSV Schwerin) | `gdr-schwerin` | Schwerin | SCR |
| BSG Motor Schwerin | `gdr-schwerin-rot` | Schwerin Rot | SRO |
| ISG Schwerin-Süd | `gdr-schwerin-sued` | Schwerin Süd | SCS |
| BSG Motor Schönebeck | `gdr-schoenebeck` | Schönebeck | SCÖ |
| BSG Chemie Schönebeck | `gdr-schoenebeck-gruen` | Schönebeck Grün | SCG |
| BSG Aktivist Brieske-Senftenberg | `gdr-senftenberg` | Senftenberg | SEN |
| BSG Stahl Silbitz | `gdr-silbitz` | Silbitz | SIL |
| BSG Glückauf Sondershausen | `gdr-sondershausen` | Sondershausen | SON |
| SG Sosa | `gdr-sosa` | Sosa | SOS |
| BSG Motor Steinach | `ddr-steinach` | Steinach | STN |
| BSG Lokomotive Stendal | `ddr-stendal` | Stendal | STD |
| ASG Vorwärts Stralsund | `ddr-stralsund` | Stralsund | STR |
| BSG Motor Stralsund | `gdr-stralsund-blau` | Stralsund Rot | STA |
| BSG Motor Suhl | `gdr-suhl` | Suhl | SUH |
| BSG Zentronik / Robotron Sömmerda | `gdr-soemmerda` | Sömmerda | SÖM |
| BSG Empor Tangermünde | `gdr-tangermuende` | Tangermünde | TAN |
| BSG Stahl Thale | `gdr-thale` | Thale | THA |
| BSG Aktivist Kali Werra Tiefenort | `gdr-tiefenort` | Tiefenort | TIE |
| BSG Nord „Max Matern“ Torgelow | `gdr-torgelow` | Torgelow | TOR |
| BSG Rotes Banner Trinwillershagen | `gdr-trinwillershagen` | Trinwillershagen | TRI |
| BSG Motor Veilsdorf | `gdr-veilsdorf` | Veilsdorf | VEI |
| BSG Motor Warnowwerft Warnemünde | `gdr-warnemuende` | Warnemünde | WAR |
| BSG Fortschritt Weida | `gdr-weida` | Weida | WEI |
| BSG Motor Weimar | `gdr-weimar` | Weimar | WEM |
| BSG Fortschritt Weißenfels | `gdr-weissenfels` | Weißenfels | WES |
| BSG Motor Werdau | `gdr-werdau` | Werdau | WER |
| BSG Einheit Wernigerode | `gdr-wernigerode` | Wernigerode | WEN |
| TSG Wismar | `gdr-wismar` | Wismar | WIS |
| BSG Chemie/Motor Veritas Wittenberge | `gdr-wittenberge` | Wittenberge | WIT |
| BSG Chemie Wolfen | `gdr-wolfen` | Wolfen | WOL |
| BSG Motor Wolgast | `gdr-wolgast` | Wolgast | WOG |
| BSG Chemie Zeitz | `gdr-zeitz` | Zeitz | ZEI |
| BSG Motor Zeulenroda | `gdr-zeulenroda` | Zeulenroda | ZEU |
| BSG Robur Zittau | `gdr-zittau` | Zittau | ZIT |
| FSV Zwickau (DDR: BSG Sachsenring Zwickau) | `ddr-zwickau` | Zwickau | ZWI |

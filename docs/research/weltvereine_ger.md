# Weltvereine Deutschland (`ger`) – Recherche

Bundesliga (t1) und 2. Bundesliga (t2; 1975/76–1980/81 und 1991/92 Nord = t2, Süd = t2b) 1975/76–2025/26,
DFB-Pokal, Europapokal. Echte Namen stehen **nur** hier. Ex-DDR-Vereine (ab 1991/92) behalten ihre DDR-IDs
(`ddr-*`/`gdr-*`) und sind in `clubs/gdr.ts` definiert (siehe weltvereine_gdr.md) – Prüfungen müssen beide Dateien
zusammen betrachten.

## Quellen und Belegstand je Bereich
- **Abschlusstabellen 1975/76–2024/25 (t1, t2):** berechnet aus allen Spielergebnissen des Datensatzes
  `engsoccerdata` (jalapic, GitHub, `data-raw/germany.csv`: Bundesliga und 2. Bundesliga 1963–2024/25):
  Punkte (2-Punkte-Regel bis 1994/95, danach 3), Tordifferenz, erzielte Tore. Spielzahl je Verein geprüft (einheitlich).
- **Bundesliga 1991/92:** im Datensatz unvollständig (nur 34 von 38 Spieltagen) → Reihenfolge aus RSSSF
  „Germany 1991/92“ (rsssf.org/tablesd/duit92.html).
- **2. Bundesliga 1991/92 Nord/Süd:** aus dem Datensatz; Auf-/Abstiegsrunde über Begegnungszahl (4 Spiele = gleiche
  Sechsergruppe) bestimmt, Aufstiegsrunde Platz 1–6, Abstiegsrunde Platz 7–12, Punkte voll übernommen.
- **Punktabzüge (eingerechnet):** 1999/2000 Frankfurt −2 (dadurch 14. statt 11.), 2. BL 2008/09 Koblenz −3
  (en.wikipedia „2008–09 2. Bundesliga“), 2010/11 1860 München −2 und Bielefeld −3 (wikiwand „2010–11 2. Bundesliga“),
  2014/15 Aalen −2 (Wissen). **Unsicherheit:** weitere Punktabzüge in der 2. Bundesliga vor 2008 sind nicht
  systematisch geprüft (Suchkontingent aufgebraucht); sie betreffen meist nur Plätze im Tabellenkeller.
- **1979/80:** Stuttgart und Kaiserslautern punkt- und torgleich (41, 75:53) – Stuttgart als Dritter gesetzt (Wissen).
- **2025/26 (laufend):** Zusammensetzung zu Saisonbeginn **aus Wissen, ungeprüft**: Reihenfolge = Platzierung 2024/25,
  Aufsteiger hinten (1. Liga: Heidenheim nach Relegation, Köln, HSV; 2. Liga: Bochum, Kiel als Absteiger vorn,
  Braunschweig nach Relegation, Bielefeld und Dresden als Aufsteiger hinten).
- **DFB-Pokal 1975/76–2024/25:** **aus Wissen, ungeprüft** (Sieger + Finalist). 1992/93: Finalist war die
  Amateurmannschaft von Hertha BSC → `cupFinalist` leer. 2025/26 offen.
- **Europapokal 1975/76–2008/09:** RSSSF „European Competitions YYYY-YY“ (rsssf.org/ec/ec197576.html …
  ec200809.html), dazu `engsoccerdata` `champs.csv` für Landesmeister/Champions League bis 2015/16
  (Korrektur: Stuttgart 2003/04 CL fehlte in der RSSSF-Auswertung). 2006/07: Frankfurt im UEFA-Pokal aus Wissen ergänzt.
  Eintrag = **Einstiegswettbewerb**: wer aus der Champions League (Gruppe/Qualifikation) in den UEFA-Pokal/die Europa
  League wechselte, steht nur unter `cl`/`ec`. Reine UI-Cup-Teilnehmer (Intertoto) fehlen, Intertoto-Sieger stehen
  im UEFA-Pokal.
- **Europapokal 2009/10–2025/26 (EL, ECL, CL ab 2016/17):** **aus Wissen, ungeprüft** (nach Tabellenplätzen und
  Pokalsiegern plausibilisiert).
- **1991/92:** Rostock (NOFV-Meister), Eisenhüttenstadt (NOFV-Pokalfinalist), Erfurt und Halle starteten aus der
  letzten DDR-Saison – im `euro` der gesamtdeutschen Saison 1991.

## Ligareformen
- 1975/76–1980/81: 2. Bundesliga Nord/Süd (je 20; 1979/80 Süd 21, 1980/81 Nord 22).
- 1981/82: eingleisige 2. Bundesliga (20).
- 1991/92: Bundesliga 20 Vereine (+ Rostock, Dresden), 2. Bundesliga Nord/Süd je 12 mit Auf-/Abstiegsrunde.
- 1992/93: 2. Bundesliga 24; 1993/94 20; ab 1994/95 18. 3-Punkte-Regel ab 1995/96.
- Lizenzentzüge/Rückzüge (keine Wirkung auf die Tabellenreihenfolge): u. a. St. Pauli 1979, 1860 1982,
  Oberhausen 1988, Offenbach 1989, Essen 1991/1994, Blau-Weiß 90 1992, Saarbrücken 1995, TeBe 2000, Duisburg 2013.

## Fusionen / Umbenennungen / Zuordnungen
- Bayer 05 Uerdingen → KFC Uerdingen 05 (1995): eine ID `kre` („Krefeld“).
- SpVgg Fürth → SpVgg Greuther Fürth (1996, Fusion mit TSV Vestenbergsgreuth): `s_fue` („Fürth“).
- TuS Schloß Neuhaus (2. BL 1982/83) → 1985 Fusion zu TuS Paderborn-Neuhaus → SC Paderborn 07: `ger-paderborn`,
  Name „Schloß Neuhaus“, ab 1985 „Paderborn“ (`rename`).
- DJK Gütersloh (1975/76) und FC Gütersloh (1996–1999, Nachfolger) → `n_gue`.
- ESV Ingolstadt (1979–1981) und FC Ingolstadt 04 (Fusion ESV + MTV 2004) → `h_ing`; MTV Ingolstadt eigener
  Verein `ger-ingolstadt-blau`.
- LR Ahlen / Rot Weiss Ahlen → `ger-ahlen`. VfB Leipzig = 1. FC Lok Leipzig → `ddr-leipzig`.
- Wismut Aue / Erzgebirge Aue → `ddr-aue`; Sachsenring/FSV Zwickau → `ddr-zwickau`; Motor Babelsberg / SV Babelsberg 03
  → `gdr-babelsberg`; FC Karl-Marx-Stadt / Chemnitzer FC → `ddr-chemnitz`.
- Farben neuer Vereine nach Vereinsfarben; bei Würzburg West, Freiburg Blau, Berlin Charlottenburg, Wanne-Eickel,
  Schwenningen, Eppingen, Hanau nicht einzeln geprüft.

## Zuordnung echter Name → Spiel
| Echter Verein | ID | Spielname | Kürzel |
|---|---|---|---|
| Alemannia Aachen | `n_aac` | Aachen | AAC |
| VfR Aalen | `ger-aalen` | Aalen | AAL |
| LR Ahlen / Rot Weiss Ahlen | `ger-ahlen` | Ahlen | AHL |
| SV Viktoria Aschaffenburg | `ger-aschaffenburg` | Aschaffenburg | ASC |
| FC Augsburg | `s_aug` | Augsburg | AUG |
| Eintracht Bad Kreuznach | `s_bkr` | Bad Kreuznach | BKR |
| KSV Baunatal | `h_bau` | Baunatal | BAU |
| SpVgg Bayreuth | `s_bay` | Bayreuth | BAY |
| Hertha BSC | `ber` | Berlin Blau | BEB |
| SC Charlottenburg | `ger-berlin-charlottenburg` | Berlin Charlottenburg | BCH |
| Tennis Borussia Berlin | `n_tebe` | Berlin Lila | BEL |
| SC Wacker 04 Berlin | `n_wac` | Berlin Reinickendorf | BRK |
| Spandauer SV | `n_spa` | Berlin Rot | BER |
| SC Blau-Weiß 1890 Berlin | `ger-berlin-tempelhof` | Berlin Tempelhof | BTH |
| Arminia Bielefeld | `n_bie` | Bielefeld | BIE |
| 1. FC Bocholt | `ger-bocholt` | Bocholt | BOH |
| VfL Bochum | `boc` | Bochum | BOC |
| Bonner SC | `h_bon` | Bonn | BON |
| Eintracht Braunschweig | `bra` | Braunschweig | BRA |
| SV Werder Bremen | `bre` | Bremen | BRE |
| OSC Bremerhaven | `h_brh` | Bremerhaven | BRH |
| SV Wacker Burghausen | `ger-burghausen` | Burghausen | BUR |
| VfR Bürstadt | `ger-buerstadt` | Bürstadt | BÜR |
| SV Darmstadt 98 | `s_dar` | Darmstadt | DAR |
| Borussia Dortmund | `n_dor` | Dortmund | DOR |
| MSV Duisburg | `dui` | Duisburg | DUI |
| Fortuna Düsseldorf | `dus` | Düsseldorf | DÜS |
| SV Elversberg | `ger-elversberg` | Elversberg | ELV |
| VfB Eppingen | `ger-eppingen` | Eppingen | EPP |
| SpVgg Erkenschwick | `n_erk` | Erkenschwick | ERK |
| Rot-Weiss Essen | `ess` | Essen Rot | ESR |
| Schwarz-Weiß Essen | `n_ess` | Essen Schwarz | ESZ |
| FSV Frankfurt | `s_fsv` | Frankfurt Blau | FRB |
| Eintracht Frankfurt | `fra` | Frankfurt Rot | FRR |
| SC Freiburg | `h_fre` | Freiburg | FRE |
| Freiburger FC | `ger-freiburg-blau` | Freiburg Blau | FBL |
| SpVgg Fürth / SpVgg Greuther Fürth (1996) | `s_fue` | Fürth | FÜR |
| FC Schalke 04 | `gel` | Gelsenkirchen | GEL |
| 1. SC Göttingen 05 | `n_goe` | Göttingen | GÖT |
| DJK Gütersloh / FC Gütersloh | `n_gue` | Gütersloh | GÜT |
| Hamburger SV | `ham` | Hamburg Blau | HAB |
| FC St. Pauli | `n_ham` | Hamburg Braun | HBR |
| 1. Hanauer FC 1893 | `ger-hanau` | Hanau | HNU |
| Hannover 96 | `han` | Hannover | HAN |
| SV Arminia Hannover | `h_arh` | Hannover Blau | HAB |
| OSV Hannover | `ger-hannover-oststadt` | Hannover Oststadt | HOS |
| TSV Havelse | `ger-havelse` | Havelse | HVL |
| 1. FC Heidenheim 1846 | `ger-heidenheim` | Heidenheim | HDH |
| SC Herford | `h_her` | Herford | HFD |
| DSC Westfalia Herne | `n_hern` | Herne | HRN |
| FC Bayern Hof | `s_hof` | Hof | HOF |
| TSG 1899 Hoffenheim | `ger-hoffenheim` | Hoffenheim | HOH |
| FC 08 Homburg | `s_hom` | Homburg | HOM |
| ESV Ingolstadt-Ringsee | `h_ing` | Ingolstadt | ING |
| MTV Ingolstadt | `ger-ingolstadt-blau` | Ingolstadt Blau | INB |
| 1. FC Kaiserslautern | `kai` | Kaiserslautern | KAI |
| Karlsruher SC | `kar` | Karlsruhe | KAR |
| KSV Hessen Kassel | `h_kas` | Kassel | KAS |
| Holstein Kiel | `h_kie` | Kiel | KIE |
| TuS Koblenz | `ger-koblenz` | Koblenz | KOB |
| Bayer 05 Uerdingen / KFC Uerdingen 05 | `kre` | Krefeld | KRE |
| SC Viktoria 04 Köln | `ger-koeln-hoehenberg` | Köln Höhenberg | KÖH |
| 1. FC Köln | `kln` | Köln Rot | KÖR |
| SC Fortuna Köln | `n_koes` | Köln Süd | KÖS |
| RB Leipzig | `ger-leipzig-rot` | Leipzig Rot | LER |
| Bayer 04 Leverkusen | `n_lev` | Leverkusen | LEV |
| VfB Lübeck | `ger-luebeck` | Lübeck | LÜB |
| Rot-Weiß Lüdenscheid | `h_lue` | Lüdenscheid | LÜD |
| 1. FSV Mainz 05 | `s_mai` | Mainz | MAI |
| SV Waldhof Mannheim | `s_man` | Mannheim | MAN |
| SV Meppen | `ger-meppen` | Meppen | MEP |
| Borussia Mönchengladbach | `mgl` | Mönchengladbach | MGL |
| 1. FC Mülheim-Styrum | `n_mue` | Mülheim | MÜL |
| TSV 1860 München | `s_muc` | München Blau | MÜB |
| FC Bayern München | `muc` | München Rot | MÜR |
| SC Preußen Münster | `n_mun` | Münster | MÜN |
| Borussia Neunkirchen | `h_neu` | Neunkirchen | NEU |
| 1. FC Nürnberg | `s_nue` | Nürnberg | NÜR |
| Rot-Weiß Oberhausen | `h_rwo` | Oberhausen | OBH |
| Kickers Offenbach | `off` | Offenbach | OFF |
| VfB Oldenburg | `h_old` | Oldenburg | OLD |
| VfL Osnabrück | `n_osn` | Osnabrück | OSN |
| FK Pirmasens | `s_pir` | Pirmasens | PIR |
| SSV Jahn Regensburg | `s_reg` | Regensburg | REG |
| FC Remscheid | `ger-remscheid` | Remscheid | REM |
| SSV Reutlingen 05 | `s_reu` | Reutlingen | REU |
| 1. FC Saarbrücken | `s_saa` | Saarbrücken | SAA |
| FSV Salmrohr | `ger-salmrohr` | Salmrohr | SAL |
| SV Sandhausen | `ger-sandhausen` | Sandhausen | SAN |
| SC Paderborn 07 | `ger-paderborn` | Schloß Neuhaus | PAD |
| 1. FC Schweinfurt 05 | `s_sch` | Schweinfurt | SCW |
| BSV 07 Schwenningen | `ger-schwenningen` | Schwenningen | SWN |
| Sportfreunde Siegen | `ger-siegen` | Siegen | SIE |
| SG Union Solingen | `n_sol` | Solingen | SOL |
| Stuttgarter Kickers | `s_stk` | Stuttgart Blau | STB |
| VfB Stuttgart | `s_vfb` | Stuttgart Rot | STR |
| SV Eintracht Trier 05 | `h_tri` | Trier | TRI |
| SSV Ulm 1846 | `ger-ulm` | Ulm | ULM |
| SpVgg Unterhaching | `ger-unterhaching` | Unterhaching | UHA |
| SV Röchling Völklingen | `s_voe` | Völklingen | VÖL |
| DSC Wanne-Eickel | `ger-wanne-eickel` | Wanne-Eickel | WAN |
| SG Wattenscheid 09 | `n_wat` | Wattenscheid | WAT |
| SV Wehen Wiesbaden | `ger-wiesbaden` | Wiesbaden | WIE |
| VfL Wolfsburg | `h_wob` | Wolfsburg | WOB |
| VfR Wormatia Worms | `h_wor` | Worms | WOR |
| Wuppertaler SV | `n_wup` | Wuppertal | WUP |
| Würzburger Kickers | `h_wue` | Würzburg | WÜR |
| FV 04 Würzburg | `ger-wuerzburg-west` | Würzburg West | WÜW |

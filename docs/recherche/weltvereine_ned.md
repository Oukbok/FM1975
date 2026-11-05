# Weltvereine ned – Niederlande (Eredivisie, Eerste Divisie)

Echte Vereinsnamen stehen **nur hier**. Datenformat: `docs/specs/WELTDATEN_SPEC.md`.
Erzeugt mit Skripten im Scratchpad (nicht im Repo): Tabellen aus Spielergebnissen berechnet, Namen über eine Zuordnungsliste.

## Quellen

- **Eredivisie 1975/76–2024/25, berechnet:** `jalapic/engsoccerdata` (`data-raw/holland.csv`), 2 Punkte bis 1994/95, 3 ab 1995/96,
  dann Tordifferenz. Play-off-Spiele (ab 2005/06) zählen nicht zur Tabelle. Abgleich der Teilnehmer gegen
  `schochastics/football-data`: identisch.
- **Eredivisie 2025/26:** `openfootball/europe` (`netherlands/2025-26_nl1.txt`), vollständige Saison → Abschlusstabelle.
- **Eerste Divisie 2020/21–2024/25:** `openfootball/europe` (`<saison>_nl2.txt`), berechnet, **ohne Jong-Mannschaften**
  (Jong Ajax, Jong PSV, Jong AZ, Jong Utrecht – nicht aufstiegsberechtigt, keine eigenen Vereine).
- **Eerste Divisie 1975/76–2019/20 und 2025/26: aus Wissen, ungeprüft.** Aufbau: alle Profivereine der Zeit (Liste mit Zeiträumen,
  z. B. FC Amsterdam bis 1982, FC Wageningen bis 1992, SVV bis 1991, Haarlem bis 2010, RBC Roosendaal 1983–2011, AGOVV 2003–2013,
  Almere City ab 2005, Achilles '29 2012–2017) ohne die Eredivisie-Vereine der Saison. Die Zusammensetzung ist damit weitgehend
  richtig; die **Reihenfolge** ist nur für die Aufsteiger (vorn) und die Absteiger aus der Eredivisie (danach) sinnvoll, der Rest
  ist nicht nach Tabelle geordnet.
- **Europapokal:** `schochastics/football-data` (EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation). Pokalsieger-Pokal aus den
  Pokalendspielen abgeleitet (Titelverteidiger Amsterdam 1987/88) – **aus Wissen, ungeprüft**. 2025/26: Rotterdam (aus der CL-Quali)
  und Deventer (Pokalsieger) in der EL aus Wissen ergänzt.
- **Pokal (Sieger/Finalist): aus Wissen, ungeprüft.** 2019/20 nicht beendet, 2025/26 fehlt.

## Besonderheiten

- 1990/91: Amsterdam für den Europapokal gesperrt. 2019/20: Abbruch, kein Meister, kein Auf-/Abstieg.
- 2023/24: Arnheim 18 Punkte Abzug (Letzter) – von Hand eingearbeitet.
- Spielnamen: Ajax = „Amsterdam“, PSV = „Eindhoven“, Feyenoord = „Rotterdam“, Twente = „Enschede“ (wie `data/europe.ts`);
  Sparta = „Rotterdam-Spangen“, Excelsior = „Rotterdam-Kralingen“ (Stadtteile), SC/FC Eindhoven = „Eindhoven Blau-Weiß“,
  Telstar = „Velsen“, FC Amsterdam = „Amsterdam Süd“.
- Ein Verein im Spiel: DS'79/Dordrecht '90/FC Dordrecht; FC Den Haag/ADO Den Haag; BVV/FC Den Bosch; PEC Zwolle/FC Zwolle.

## Echter Name → Spielname / ID

| Echter Verein | Spielname | ID | Kürzel | Ort |
|---|---|---|---|---|
| Achilles '29 (2012–2017) | Groesbeek | `ned-groesbeek` | GRB | Groesbeek |
| ADO Den Haag / FC Den Haag | Den Haag | `ned-den-haag` | DHA | Den Haag |
| AFC Ajax | Amsterdam | `ned-amsterdam` | AMS | Amsterdam |
| AGOVV Apeldoorn (2003–2013) | Apeldoorn | `ned-apeldoorn` | APE | Apeldoorn |
| Almere City FC | Almere | `ned-almere` | ALE | Almere |
| AZ ('67) Alkmaar | Alkmaar | `ned-alkmaar` | ALK | Alkmaar |
| BV Veendam | Veendam | `ned-veendam` | VEE | Veendam |
| De Graafschap | Doetinchem | `ned-doetinchem` | DOE | Doetinchem |
| DS '79 / Drechtsteden '79 / SVV-Dordrecht '90 / FC Dordrecht | Dordrecht | `ned-dordrecht` | DOR | Dordrecht |
| FC Amsterdam (1972–1982) | Amsterdam Süd | `ned-amsterdam-sued` | AMZ | Amsterdam |
| FC Den Bosch (BVV Den Bosch, FC Den Bosch '67) | Den Bosch | `ned-den-bosch` | DBO | ’s-Hertogenbosch |
| FC Emmen | Emmen | `ned-emmen` | EMM | Emmen |
| FC Groningen | Groningen | `ned-groningen` | GRO | Groningen |
| FC Twente | Enschede | `ned-enschede` | ENS | Enschede |
| FC Utrecht | Utrecht | `ned-utrecht` | UTR | Utrecht |
| FC Vlaardingen '74 (bis 1981) | Vlaardingen | `ned-vlaardingen` | VLA | Vlaardingen |
| FC Volendam | Volendam | `ned-volendam` | VOL | Volendam |
| FC Wageningen (bis 1992) | Wageningen | `ned-wageningen` | WAG | Wageningen |
| Feyenoord | Rotterdam | `ned-rotterdam` | ROT | Rotterdam |
| Fortuna Sittard | Sittard | `ned-sittard` | SIT | Sittard |
| Go Ahead Eagles | Deventer | `ned-deventer` | DEV | Deventer |
| Helmond Sport | Helmond | `ned-helmond` | HEL | Helmond |
| Heracles Almelo | Almelo | `ned-almelo` | ALM | Almelo |
| HFC Haarlem (bis 2010) | Haarlem | `ned-haarlem` | HAA | Haarlem |
| MVV Maastricht | Maastricht | `ned-maastricht` | MAA | Maastricht |
| NAC Breda | Breda | `ned-breda` | BRE | Breda |
| NEC Nijmegen | Nimwegen | `ned-nimwegen` | NIM | Nimwegen |
| PEC Zwolle ('82) / FC Zwolle | Zwolle | `ned-zwolle` | ZWO | Zwolle |
| PSV Eindhoven | Eindhoven | `ned-eindhoven` | EIN | Eindhoven |
| RBC Roosendaal (bis 2011) | Roosendaal | `ned-roosendaal` | ROO | Roosendaal |
| RKC Waalwijk | Waalwijk | `ned-waalwijk` | WAA | Waalwijk |
| Roda JC Kerkrade | Kerkrade | `ned-kerkrade` | KER | Kerkrade |
| SBV Excelsior | Rotterdam-Kralingen | `ned-rotterdam-kralingen` | RKR | Rotterdam |
| SC Amersfoort (bis 1982) | Amersfoort | `ned-amersfoort` | AME | Amersfoort |
| SC Cambuur | Leeuwarden | `ned-leeuwarden` | LEE | Leeuwarden |
| SC Eindhoven / FC Eindhoven | Eindhoven Blau-Weiß | `ned-eindhoven-blau-weiss` | EBW | Eindhoven |
| SC Heerenveen | Heerenveen | `ned-heerenveen` | HEE | Heerenveen |
| Sparta Rotterdam | Rotterdam-Spangen | `ned-rotterdam-spangen` | RSP | Rotterdam |
| SVV Schiedam | Schiedam | `ned-schiedam` | SCH | Schiedam |
| Telstar | Velsen | `ned-velsen` | VEL | Velsen |
| TOP Oss (FC Oss) | Oss | `ned-oss` | OSS | Oss |
| Vitesse | Arnheim | `ned-arnheim` | ARN | Arnheim |
| VVV-Venlo | Venlo | `ned-venlo` | VEN | Venlo |
| Willem II | Tilburg | `ned-tilburg` | TIL | Tilburg |

## Herkunft je Saison

| Saison | t1 | t2 | Pokal | Europapokal | Anmerkung |
|---|---|---|---|---|---|
| 1975/76 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1976/77 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1977/78 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1978/79 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1979/80 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1980/81 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1981/82 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1982/83 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1983/84 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1984/85 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1985/86 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1986/87 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1987/88 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1988/89 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1989/90 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1990/91 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) | Amsterdam im Europapokal gesperrt (1990/91) |
| 1991/92 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1992/93 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1993/94 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1994/95 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1995/96 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1996/97 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1997/98 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1998/99 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1999/00 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2000/01 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2001/02 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2002/03 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2003/04 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2004/05 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2005/06 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2006/07 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2007/08 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2008/09 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2009/10 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2010/11 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2011/12 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2012/13 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2013/14 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2014/15 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2015/16 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2016/17 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2017/18 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2018/19 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2019/20 | engsoccerdata (berechnet) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | fehlt | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) | Saison abgebrochen (Pandemie), kein Meister, kein Auf-/Abstieg; Landespokal nicht beendet |
| 2020/21 | engsoccerdata (berechnet) | openfootball/europe (berechnet, ohne Jong-Mannschaften) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2021/22 | engsoccerdata (berechnet) | openfootball/europe (berechnet, ohne Jong-Mannschaften) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2022/23 | engsoccerdata (berechnet) | openfootball/europe (berechnet, ohne Jong-Mannschaften) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2023/24 | engsoccerdata (berechnet) | openfootball/europe (berechnet, ohne Jong-Mannschaften) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) | Arnheim 18 Punkte Abzug (Lizenz), Letzter |
| 2024/25 | engsoccerdata (berechnet) | openfootball/europe (berechnet, ohne Jong-Mannschaften) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2025/26 | openfootball/europe 2025/26 (berechnet, Abschlusstabelle) | aus Wissen, ungeprüft (alle Profivereine ohne Eredivisie; Reihenfolge nur Aufsteiger/Absteiger sicher) | fehlt | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |

## Unsicherheiten (Zusammenfassung)

- Alles, was oben „aus Wissen, ungeprüft“ heißt, wurde ohne Websuche aus dem Gedächtnis eingetragen (Websuche war in der Sitzung aufgebraucht).
- Bei berechneten Tabellen fehlen Punktabzüge und grüne-Tisch-Entscheidungen, soweit sie oben nicht als Anmerkung stehen.
- 2. Ligen aus Wissen: Reihenfolge außer Auf-/Absteigern **nicht** nach Abschlusstabelle; Zusammensetzung der Mitte kann je Saison um mehrere Vereine abweichen.

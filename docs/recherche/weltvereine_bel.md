# Weltvereine bel – Belgien (Eerste Klasse / Pro League, Tweede Klasse / 1B / Challenger Pro League)

Echte Vereinsnamen stehen **nur hier**. Datenformat: `docs/specs/WELTDATEN_SPEC.md`.
Erzeugt mit Skripten im Scratchpad (nicht im Repo): Tabellen aus Spielergebnissen berechnet, Namen über eine Zuordnungsliste.

## Quellen

- **1. Liga 1975/76–2024/25, berechnet:** `schochastics/football-data` (`games.parquet`), 2 Punkte bis 1994/95, 3 ab 1995/96;
  Gleichstand nach Siegen, dann Tordifferenz. Ab 2009/10 Play-off I: halbierte Punkte (aufgerundet) + Play-off-Spiele
  (Top 6, 2020/21–2022/23 Top 4); Plätze dahinter nach Grunddurchgang. Meister je Saison gegen Wissen geprüft.
- **1. Liga 2025/26:** Zusammensetzung aus `openfootball/belgium` (`2025-26/be1.txt`); Reihenfolge = Vorjahresplatz, Aufsteiger hinten.
- **2. Liga 1975/76–2025/26: aus Wissen, ungeprüft.** Sicher sind nur Auf- und Absteiger (aus den Daten der 1. Liga). Die übrigen
  Plätze sind mit typischen Zweitligisten der Epoche gefüllt; Größe 16 bis 1993/94, 18 bis 2015/16, 8 in der 1B Pro League
  (2016/17–2021/22), 12 in der Challenger Pro League ab 2022/23 (U23-Mannschaften weggelassen). Reihenfolge der Mitte unbelegt.
- **Europapokal:** `schochastics/football-data`; Pokalsieger-Pokal aus Pokalendspielen abgeleitet (Titelverteidiger Brüssel Lila
  1976/77 und 1978/79, Mechelen 1988/89) – **aus Wissen, ungeprüft**.
- **Pokal (Sieger/Finalist): aus Wissen, ungeprüft.** 2025/26 fehlt.

## Besonderheiten

- 1975/76 19 Vereine, 2002/03 17 (Lommel insolvent), 2009/10 15 in der Wertung (Mouscron ausgeschieden).
- 1985/86 und 2008/09 Meister nach Entscheidungsspielen bei Punktgleichheit (Brüssel Lila 1986, Lüttich 2009 – von Hand gesetzt).
- 2019/20 Abbruch vor den Play-offs; 2020/21 Liga mit 18 Vereinen.
- Ein Verein im Spiel (Nachfolger/Fusionen): KSC Winterslag → KRC Genk (1988, `rename` „Genk“, Waterschei getrennt);
  RWD Molenbeek / FC Brussels / RWDM; Beerschot VAV / Germinal Beerschot / Beerschot (VA) = „Beerschot“ (Germinal Ekeren bis
  1999 getrennt); KSV Waregem / SV Zulte Waregem; KSK Beveren / Waasland-Beveren; Excel Mouscron / Royal Excel Mouscron;
  Lierse SK / Lierse Kempenzonen; RFC Seraing alt/neu; RAA Louviéroise / RAAL La Louvière.
- Spielnamen: Anderlecht = „Brüssel Lila“, Club Brugge = „Brügge“, Standard = „Lüttich“ (wie `data/europe.ts`); Union = „Saint-Gilles“
  (Gemeinde), Cercle = „Brügge Grün-Schwarz“, RFC Liège = „Lüttich Rot-Blau“, Racing Mechelen = „Mechelen Grün-Rot“, Lierse = „Lier“
  (Ort statt Vereinsname), Beerschot/Berchem/Ekeren = Antwerpener Stadtteile.

## Echter Name → Spielname / ID

| Echter Verein | Spielname | ID | Kürzel | Ort |
|---|---|---|---|---|
| AFC Tubize | Tubize | `bel-tubize` | TUB | Tubize |
| Beerschot VAV / Germinal Beerschot / Beerschot (VA) | Beerschot | `bel-beerschot` | BEE | Antwerpen |
| Berchem Sport | Berchem | `bel-berchem` | BER | Antwerpen |
| Cercle Brugge | Brügge Grün-Schwarz | `bel-bruegge-gruen-schwarz` | BGS | Brügge |
| Club Brugge KV | Brügge | `bel-bruegge` | BRG | Brügge |
| CS Visé | Visé | `bel-vise` | VIS | Visé |
| Eendracht Aalst | Aalst | `bel-aalst` | AAL | Aalst |
| Excel Mouscron / Royal Excel Mouscron | Mouscron | `bel-mouscron` | MOU | Mouscron |
| Excelsior Virton | Virton | `bel-virton` | VIR | Virton |
| FCV Dender EH | Denderleeuw | `bel-dender` | DEN | Denderleeuw |
| Francs Borains | Boussu | `bel-francs-borains` | BOS | Boussu |
| Germinal Ekeren | Ekeren | `bel-ekeren` | EKE | Antwerpen |
| K Beringen FC | Beringen | `bel-beringen` | BRI | Beringen |
| K Beringen-Heusden-Zolder | Heusden-Zolder | `bel-heusden-zolder` | HZO | Heusden-Zolder |
| K Boom FC | Boom | `bel-boom` | BOO | Boom |
| K Diest FC | Diest | `bel-diest` | DIE | Diest |
| KAA Gent | Gent | `bel-gent` | GEN | Gent |
| KAS Eupen | Eupen | `bel-eupen` | EUP | Eupen |
| KFC Dessel Sport | Dessel | `bel-dessel` | DES | Dessel |
| KFC Eeklo | Eeklo | `bel-eeklo` | EEK | Eeklo |
| KFC Lommel SK / Lommel SK | Lommel | `bel-lommel` | LOM | Lommel |
| KFC Turnhout | Turnhout | `bel-turnhout` | TUR | Turnhout |
| KMSK Deinze | Deinze | `bel-deinze` | DEI | Deinze |
| KRC Harelbeke | Harelbeke | `bel-harelbeke` | HAR | Harelbeke |
| KSC Hasselt | Hasselt | `bel-hasselt` | HAS | Hasselt |
| KSC Lokeren-Temse | Lokeren-Temse | `bel-lokeren-temse` | LKT | Lokeren |
| KSC Winterslag / KRC Genk (ab 1988) | Winterslag (ab 1988 „Genk“) | `bel-winterslag` | WIN | Genk |
| KSK Beveren / Waasland-Beveren | Beveren | `bel-beveren` | BEV | Beveren |
| KSK Heist | Heist | `bel-heist` | HEI | Heist-op-den-Berg |
| KSK Ronse | Ronse | `bel-ronse` | RON | Ronse |
| KSK Tongeren | Tongeren | `bel-tongeren` | TON | Tongeren |
| KSV Roeselare | Roeselare | `bel-roeselare` | ROE | Roeselare |
| KSV Waregem / SV Zulte Waregem | Waregem | `bel-waregem` | WAR | Waregem |
| KV Kortrijk | Kortrijk | `bel-kortrijk` | KOR | Kortrijk |
| KV Mechelen | Mechelen | `bel-mechelen` | MEC | Mechelen |
| KV Oostende | Ostende | `bel-ostende` | OST | Ostende |
| KVC Westerlo | Westerlo | `bel-westerlo` | WES | Westerlo |
| KVK Ieper | Ypern | `bel-ieper` | YPE | Ypern |
| KVK Tienen | Tienen | `bel-tienen` | TIE | Tienen |
| KVV Overpelt-Fabriek | Overpelt | `bel-overpelt` | OVP | Overpelt |
| Lierse SK | Lier | `bel-lier` | LIE | Lier |
| Oud-Heverlee Leuven | Löwen | `bel-loewen` | LÖW | Löwen |
| Patro Eisden Maasmechelen | Eisden | `bel-eisden` | EIS | Maasmechelen |
| RAA Louviéroise / RAAL La Louvière | La Louvière | `bel-la-louviere` | LLO | La Louvière |
| Racing Jet Wavre | Wavre | `bel-wavre` | WAV | Wavre |
| Racing Mechelen (KRC Mechelen) | Mechelen Grün-Rot | `bel-mechelen-gruen-rot` | MGR | Mechelen |
| RAEC Mons | Bergen | `bel-bergen` | MON | Mons |
| RCS Montegnée | Montegnée | `bel-montegnee` | MTG | Saint-Nicolas |
| RFC Liège (FC Liégeois) | Lüttich Rot-Blau | `bel-luettich-rot-blau` | LRB | Lüttich |
| RFC Seraing (alt, bis 1996) / RFC Seraing (neu) | Seraing | `bel-seraing` | SER | Seraing |
| RFC Tilleur | Tilleur | `bel-tilleur` | TLL | Saint-Nicolas |
| Royal Antwerp FC | Antwerpen | `bel-antwerpen` | ANT | Antwerpen |
| Royale Union Saint-Gilloise | Saint-Gilles | `bel-saint-gilles` | SGI | Brüssel |
| RSC Anderlecht | Brüssel Lila | `bel-bruessel-lila` | BRL | Brüssel |
| RWD Molenbeek / FC Brussels / RWDM | Molenbeek | `bel-molenbeek` | MOL | Brüssel |
| Sint-Niklase SKE | Sint-Niklaas | `bel-sint-niklaas` | SNI | Sint-Niklaas |
| Sint-Truidense VV | Sint-Truiden | `bel-sint-truiden` | STR | Sint-Truiden |
| Sporting Charleroi | Charleroi | `bel-charleroi` | CHA | Charleroi |
| Sporting Lokeren | Lokeren | `bel-lokeren` | LOK | Lokeren |
| Standard Lüttich (Standard de Liège) | Lüttich | `bel-luettich` | LÜT | Lüttich |
| Union Royale Namur | Namur | `bel-namur` | NAM | Namur |
| Verbroedering Geel | Geel | `bel-geel` | GEE | Geel |
| Waterschei SV Thor Genk | Waterschei | `bel-waterschei` | WAT | Genk |

## Herkunft je Saison

| Saison | t1 | t2 | Pokal | Europapokal | Anmerkung |
|---|---|---|---|---|---|
| 1975/76 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) | 19 Vereine |
| 1976/77 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1977/78 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1978/79 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1979/80 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1980/81 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1981/82 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1982/83 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1983/84 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1984/85 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1985/86 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) | Punktgleich mit Brügge, Meister nach Entscheidungsspielen |
| 1986/87 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1987/88 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1988/89 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1989/90 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1990/91 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1991/92 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1992/93 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1993/94 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1994/95 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1995/96 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1996/97 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1997/98 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1998/99 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation); Pokalsieger-Pokal aus den Pokalendspielen abgeleitet (aus Wissen, ungeprüft) |  |
| 1999/00 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2000/01 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2001/02 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2002/03 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) | 17 Vereine (Lommel im Herbst 2002 insolvent ausgeschieden) |
| 2003/04 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2004/05 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2005/06 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2006/07 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2007/08 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2008/09 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) | Punktgleich mit Brüssel Lila, Meister nach Entscheidungsspielen |
| 2009/10 | schochastics/football-data (berechnet) + Play-off I (halbierte Punkte) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) | 15 Vereine in der Wertung (Mouscron im Dezember 2009 ausgeschieden) |
| 2010/11 | schochastics/football-data (berechnet) + Play-off I (halbierte Punkte) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2011/12 | schochastics/football-data (berechnet) + Play-off I (halbierte Punkte) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2012/13 | schochastics/football-data (berechnet) + Play-off I (halbierte Punkte) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2013/14 | schochastics/football-data (berechnet) + Play-off I (halbierte Punkte) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2014/15 | schochastics/football-data (berechnet) + Play-off I (halbierte Punkte) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2015/16 | schochastics/football-data (berechnet) + Play-off I (halbierte Punkte) | aus Wissen, ungeprüft | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2016/17 | schochastics/football-data (berechnet) + Play-off I (halbierte Punkte) | aus Wissen, ungeprüft (ohne U23-Mannschaften) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2017/18 | schochastics/football-data (berechnet) + Play-off I (halbierte Punkte) | aus Wissen, ungeprüft (ohne U23-Mannschaften) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2018/19 | schochastics/football-data (berechnet) + Play-off I (halbierte Punkte) | aus Wissen, ungeprüft (ohne U23-Mannschaften) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2019/20 | schochastics/football-data (berechnet) | aus Wissen, ungeprüft (ohne U23-Mannschaften) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) | Saison vor den Play-offs abgebrochen (Pandemie), Wertung nach Punkten je Spiel; Liga 2020/21 auf 18 Vereine erweitert |
| 2020/21 | schochastics/football-data (berechnet) + Play-off I (halbierte Punkte) | aus Wissen, ungeprüft (ohne U23-Mannschaften) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2021/22 | schochastics/football-data (berechnet) + Play-off I (halbierte Punkte) | aus Wissen, ungeprüft (ohne U23-Mannschaften) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2022/23 | schochastics/football-data (berechnet) + Play-off I (halbierte Punkte) | aus Wissen, ungeprüft (ohne U23-Mannschaften) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2023/24 | schochastics/football-data (berechnet) + Play-off I (halbierte Punkte) | aus Wissen, ungeprüft (ohne U23-Mannschaften) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2024/25 | schochastics/football-data (berechnet) + Play-off I (halbierte Punkte) | aus Wissen, ungeprüft (ohne U23-Mannschaften) | aus Wissen, ungeprüft | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |
| 2025/26 | openfootball/belgium 2025/26 (Zusammensetzung; Reihenfolge = Vorjahresplatz, Aufsteiger hinten) | aus Wissen, ungeprüft (ohne U23-Mannschaften) | fehlt | schochastics/football-data (Spiele EC/CL, UEFA-Pokal/EL, ECL inkl. Qualifikation) |  |

## Unsicherheiten (Zusammenfassung)

- Alles, was oben „aus Wissen, ungeprüft“ heißt, wurde ohne Websuche aus dem Gedächtnis eingetragen (Websuche war in der Sitzung aufgebraucht).
- Bei berechneten Tabellen fehlen Punktabzüge und grüne-Tisch-Entscheidungen, soweit sie oben nicht als Anmerkung stehen.
- 2. Ligen aus Wissen: Reihenfolge außer Auf-/Absteigern **nicht** nach Abschlusstabelle; Zusammensetzung der Mitte kann je Saison um mehrere Vereine abweichen.

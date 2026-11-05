# Weltvereine aut – Österreich (Bundesliga / 1. Division)

Echte Vereinsnamen stehen **nur hier**. Datenformat: `docs/specs/WELTDATEN_SPEC.md`.
Erfasst: `t1` je Saison 1975/76–2025/26, Landespokal (Sieger/Finalist), Europapokal-Teilnehmer. Keine 2. Liga (kein Top-8-Land).

## Quellen

- **1. Liga (alle Saisons): RSSSF-Saisonseiten** „Austria 1975/76“ … „Austria 2025/26“ (`rsssf.org/tableso/oostNN.html`,
  Spiegel `github.com/rsssf/tables`, Dateien `oost76` … `oost2026`). Abschlusstabellen direkt übernommen; bei geteilten
  Formaten zusammengesetzt (siehe Ligareformen). **Aus Datensatz, geprüft.**
- **Europapokal:** `schochastics/football-data` (`games.parquet`, alle Spiele Landesmeister/CL, UEFA-Pokal/EL,
  Conference League inkl. Qualifikation bis Sept. 2025) – Teilnehmer je Saison daraus (Saisonwechsel 15. Juni; die im
  August 2020 nachgeholten EL-Runden zählen zu 2019/20). **Aus Datensatz.**
  Europapokal der Pokalsieger fehlt dort: abgeleitet aus dem Pokalendspiel der Vorsaison (Sieger; war er Meister,
  der Finalist) – **Regel, ungeprüft**. 1975/76 Sturm Graz (Finalist, da Wacker Innsbruck das Double holte).
  2025/26: Salzburg und Sturm Graz nach dem CL-Aus zusätzlich in der EL **aus Wissen**.
- **Pokal (Sieger/Finalist):** 1990/91–2025/26 aus den RSSSF-Seiten (Endspiel); 1975/76–1989/90 **aus Wissen, ungeprüft**
  (bekannte Endspielliste). 2007/08 kein Pokal (EM 2008 im eigenen Land).
- **Saison 2025/26:** laut RSSSF abgeschlossen (Meister LASK, Pokal LASK gegen Altach) – `t1` ist deshalb die
  Abschlusstabelle, nicht die Zusammensetzung zu Saisonbeginn.

## Ligareformen / Format je Saison

| Saisons | Format | `t1` = |
|---|---|---|
| 1975/76–1981/82 | 10 Vereine, 36 Runden | Abschlusstabelle |
| 1982/83–1984/85 | 16 Vereine, 30 Runden | Abschlusstabelle |
| 1985/86–1992/93 | 12 Vereine Herbst, dann Meister-Playoff (8, halbe Punkte) + Mittleres Playoff mit 2. Liga | Meister-Playoff 1–8, dann Plätze 9–12 des Grunddurchgangs |
| 1993/94–2017/18 | 10 Vereine („Zehnerliga“), 36 Runden | Abschlusstabelle |
| 2018/19–2025/26 | 12 Vereine, Grunddurchgang 22 Runden, Meister- und Qualifikationsgruppe (Punkte halbiert) | Meistergruppe 1–6, Qualifikationsgruppe 7–12 |

## Fusionen, Umbenennungen, Zuordnung

- **Wien Violett** = FK Austria Wien (1975/76 noch Austria/WAC).
- **Innsbruck** fasst die Innsbrucker Lizenz zusammen: SSW/FC Wacker Innsbruck, FC (Swarovski) Tirol Innsbruck (1986–1992),
  FC Wacker Innsbruck (1992/93), FC Innsbruck Tirol / FC Tirol Innsbruck (bis 2002), FC Wacker Tirol / FC Wacker Innsbruck (ab 2002).
- **Maria Enzersdorf** = FC Admira/Wacker (Südstadt), ab 1997 mit VfB Mödling fusioniert (VfB Admira Wacker Mödling). **Mödling** = VfB Mödling vor der Fusion.
- **Salzburg** = SV Austria Salzburg, ab 2005 FC Red Bull Salzburg (rechtlich derselbe Verein; der neu gegründete SV Austria Salzburg spielte nicht in der 1. Liga).
- **Linz Blau-Weiß** = SK VÖEST Linz / FC Stahl Linz / FC Linz (1997 im LASK aufgegangen) und der Traditionsnachfolger FC Blau-Weiß Linz (1. Liga ab 2023/24) – eine ID.
- **Klagenfurt** = SK Austria Klagenfurt (bis 1999), FC Kärnten (1999–2007), SK Austria Kärnten (2007–2010, Lizenz aus Pasching) und der neue SK Austria Klagenfurt (ab 2021/22) – eine ID je Stadt.
- **St. Pölten** = VSE St. Pölten (bis 2000) und SKN St. Pölten (ab 2000) – eine ID je Stadt.
- **Pasching** = SV (Superfund) Pasching 2002–2007 und FC Pasching (Pokalsieger 2013 als Drittligist, danach UEFA-Qualifikation).
- **Leoben** = Donawitzer SV Alpine / DSV Leoben.
- **Stockerau** spielte nur als Pokalsieger 1991 (2. Liga) im Europapokal der Pokalsieger 1991/92.

## Echter Name → Spielname / ID

| Echter Verein | Spielname | ID | Kürzel | Ort |
|---|---|---|---|---|
| 1. Simmeringer SC | Wien-Simmering | `aut-wien-simmering` | WSI | Wien |
| Donawitzer SV Alpine / DSV Leoben | Leoben | `aut-leoben` | LEO | Leoben |
| Favoritner AC | Wien-Favoriten | `aut-wien-favoriten` | WFA | Wien |
| FC Admira/Wacker, VfB Admira Wacker Mödling, FC Admira Wacker Mödling | Maria Enzersdorf | `aut-maria-enzersdorf` | MEN | Maria Enzersdorf |
| First Vienna FC 1894 | Wien Blau-Gelb | `aut-wien-blau-gelb` | WBG | Wien |
| FK Austria Wien (bis 1977 Austria/WAC) | Wien Violett | `aut-wien-violett` | WIV | Wien |
| Grazer AK / GAK 1902 | Graz Rot | `aut-graz-rot` | GRR | Graz |
| Kapfenberger SV 1919 | Kapfenberg | `aut-kapfenberg` | KAP | Kapfenberg |
| Kremser SC | Krems | `aut-krems` | KRE | Krems |
| LASK (Linzer ASK) | Linz Schwarz-Weiß | `aut-linz-schwarz-weiss` | LSW | Linz |
| Salzburger AK 1914 | Salzburg-Nonntal | `aut-salzburg-nonntal` | SAN | Salzburg |
| SC Austria Lustenau | Lustenau | `aut-lustenau` | LUS | Lustenau |
| SC Eisenstadt | Eisenstadt | `aut-eisenstadt` | EIS | Eisenstadt |
| SC Neusiedl am See | Neusiedl | `aut-neusiedl` | NEU | Neusiedl am See |
| SC Rheindorf Altach | Altach | `aut-altach` | ALT | Altach |
| SC Schwarz-Weiß Bregenz | Bregenz | `aut-bregenz` | BRE | Bregenz |
| SC Wiener Neustadt (Magna Wiener Neustadt) | Wiener Neustadt | `aut-wiener-neustadt` | WNE | Wiener Neustadt |
| SK Austria Klagenfurt (bis 1999 und ab 2007 neu gegründet), FC Kärnten (1999–2007), SK Austria Kärnten (2007–2010, Lizenz aus Pasching) | Klagenfurt | `aut-klagenfurt` | KLA | Klagenfurt |
| SK Rapid Wien | Wien Grün | `aut-wien-gruen` | WIG | Wien |
| SK Sturm Graz | Graz Schwarz-Weiß | `aut-graz-schwarz-weiss` | GSW | Graz |
| SK Vorwärts Steyr | Steyr | `aut-steyr` | STE | Steyr |
| SK VÖEST Linz / FC Stahl Linz / FC Linz (bis 1997) und FC Blau-Weiß Linz (ab 1997, Traditionsnachfolger) | Linz Blau-Weiß | `aut-linz-blau-weiss` | LBW | Linz |
| SSW/FC Wacker Innsbruck, FC (Swarovski) Tirol Innsbruck, FC Innsbruck Tirol, FC Wacker Tirol | Innsbruck | `aut-innsbruck` | INN | Innsbruck |
| SV (Superfund) Pasching 2002–2007; FC Pasching (Pokalsieger 2013) | Pasching | `aut-pasching` | PAS | Pasching |
| SV Austria Salzburg (bis 2005) / FC Red Bull Salzburg (ab 2005) | Salzburg | `aut-salzburg` | SBG | Salzburg |
| SV Grödig | Grödig | `aut-groedig` | GRÖ | Grödig |
| SV Mattersburg | Mattersburg | `aut-mattersburg` | MAT | Mattersburg |
| SV Ried | Ried | `aut-ried` | RIE | Ried im Innkreis |
| SV Sankt Veit | St. Veit | `aut-st-veit` | STV | St. Veit an der Glan |
| SV Spittal/Drau | Spittal | `aut-spittal` | SPI | Spittal an der Drau |
| SV Stockerau | Stockerau | `aut-stockerau` | STO | Stockerau |
| TSV Hartberg | Hartberg | `aut-hartberg` | HAR | Hartberg |
| Union Wels | Wels | `aut-wels` | WEL | Wels |
| VfB Mödling | Mödling | `aut-moedling` | MOD | Mödling |
| VSE St. Pölten (bis 2000) / SKN St. Pölten (ab 2000) | St. Pölten | `aut-st-poelten` | STP | St. Pölten |
| Wiener Sport-Club (zeitweise WSC/Post) | Wien Schwarz-Weiß | `aut-wien-schwarz-weiss` | WSW | Wien |
| Wolfsberger AC (WAC/St. Andrä) | Wolfsberg | `aut-wolfsberg` | WOL | Wolfsberg |
| WSG Wattens / WSG Tirol | Wattens | `aut-wattens` | WAT | Wattens |

## Unsicherheiten

- Pokalendspiele 1975/76–1989/90 aus Wissen (Sieger sicher, Finalisten weitgehend sicher).
- Europapokal der Pokalsieger nach Regel abgeleitet; Sonderfälle (Verzicht, Titelverteidiger) nicht geprüft.
- Farben teils vereinfacht (Hauptfarbe + Zweitfarbe). Salzburg violett-weiß (Tradition vor 2005).
- Zusammenlegungen gleicher Städte (Klagenfurt, St. Pölten, Linz Blau-Weiß) bewusst je eine ID, damit Spielstände stabil bleiben.

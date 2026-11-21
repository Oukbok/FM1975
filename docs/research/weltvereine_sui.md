# Weltvereine sui – Schweiz (Nationalliga A / Super League)

Echte Vereinsnamen stehen **nur hier**. Datenformat: `docs/specs/WELTDATEN_SPEC.md`.
Erfasst: `t1` je Saison 1975/76–2025/26, Landespokal (Sieger/Finalist), Europapokal-Teilnehmer. Keine 2. Liga.

## Quellen

- **1. Liga:** berechnet aus allen Ligaspielen in `schochastics/football-data` (`games.parquet`, Wettbewerb „switzerland“),
  Formatlogik je Saison (siehe unten), Gleichstand nach Tordifferenz/Toren. **Aus Datensatz berechnet.**
  2024/25 aus der RSSSF-Seite „Switzerland 2024/25“ (`zwit2025`, Spiegel `github.com/rsssf/tables`).
- **Europapokal:** `games.parquet` (Landesmeister/CL, UEFA-Pokal/EL, Conference League inkl. Qualifikation, bis Sept. 2025).
  Europapokal der Pokalsieger aus dem Pokalendspiel der Vorsaison abgeleitet (Sieger; war er Meister, der Finalist) – **Regel, ungeprüft**.
- **Pokal (Sieger/Finalist) 1975/76–2024/25:** **aus Wissen, ungeprüft** (bekannte Endspielliste). 2025/26 offen.
- **2025/26:** Zusammensetzung zu Saisonbeginn (Reihenfolge = Platz 2024/25, Aufsteiger Thun hinten).

## Datenqualität je Saison (wichtig)

Der Datensatz ist für die Schweiz vor 1991 lückenhaft (nur Herbstrunde, fehlende Finalrunden, vermischte Saisons).
Der **Meister ist in jeder Saison gegen die Landesmeister-Teilnahme der Folgesaison geprüft** (gleiche Quelle) und wo nötig gesetzt.

| Saison | Grundlage | Hinweis |
|---|---|---|
| 1975/76 | nur Herbstrunde (13 Runden) | Reihenfolge ab Platz 2 unsicher; Absteiger Biel, Lugano, La Chaux-de-Fonds passen |
| 1977/78 | Qualifikation + unvollständige Finalrunde | Meister Zürich Blau-Weiß gesetzt, Rest unsicher |
| 1979/80 | nur Herbstrunde | Meister Basel gesetzt, Rest unsicher |
| 1983/84 | Daten vermischt | Meister Zürich Blau-Weiß (nach Entscheidungsspiel gegen Genf Granat) gesetzt |
| 1984/85 + 1985/86 | eine Datensaison (Meister Bern) für beide | 1984/85 Meister Genf Granat gesetzt; **Zusammensetzung 1984/85 = 1985/86, ungeprüft** |
| 1986/87 | nur Herbstrunde | Meister Neuenburg passt |
| 1987/88 | Qualifikation + unvollständige Finalrunde | Meister Neuenburg gesetzt |
| 1990/91 | nur Qualifikation | Meister Zürich Blau-Weiß gesetzt, Finalrunde = Plätze 1–8 der Qualifikation |
| 2011/12 | aus Wissen | Sitten −36 Punkte, Neuenburg ausgeschlossen |
| übrige | vollständig | Abschlusstabelle berechnet |

## Ligareformen / Format

| Saisons | Format | `t1` = |
|---|---|---|
| 1975/76 | 14 Vereine, 26 Runden | Tabelle |
| 1976/77–1978/79 | 12 Vereine, Qualifikation 22 Runden, Final- und Abstiegsrunde je 6 (halbe Punkte) | Finalrunde 1–6, Abstiegsrunde 7–12 |
| 1979/80–1986/87 | 14 bzw. (ab 1981/82) 16 Vereine, eine Tabelle | Tabelle |
| 1987/88–2002/03 | 12 Vereine, Qualifikation 22 Runden, Finalrunde 8 (halbe Punkte, aufgerundet), Auf-/Abstiegsrunde mit 4 NLB-Vereinen | Finalrunde 1–8, dann Plätze 9–12 der Qualifikation |
| 2003/04–2022/23 | 10 Vereine, 36 Runden (Super League) | Tabelle |
| 2023/24– | 12 Vereine, 33 Runden + Meister-/Abstiegsgruppe (Punkte bleiben) | Gruppe 1–6, Gruppe 7–12 |

Besonderheiten: 2004/05 Konkurs Genf Granat (Spiele annulliert, Tabellenletzter). 2011/12 Sitten −36 Punkte, Neuenburg im Januar ausgeschlossen.
Vaduz (Liechtenstein) spielt in der Schweizer Liga und steht deshalb in `t1` (Europapokal über Liechtenstein, hier nicht erfasst).
2019/20 wurde bis August 2020 fertig gespielt (Spiele bis 10.8.2020 zählen zu 2019/20).

## Echter Name → Spielname / ID

| Echter Verein | Spielname | ID | Kürzel | Ort |
|---|---|---|---|---|
| AC Bellinzona | Bellinzona | `sui-bellinzona` | BEL | Bellinzona |
| BSC Young Boys | Bern | `sui-bern` | BER | Bern |
| CS Chênois | Chêne-Bourg | `sui-chene-bourg` | CHB | Chêne-Bourg |
| FC Aarau | Aarau | `sui-aarau` | AAR | Aarau |
| FC Baden | Baden | `sui-baden` | BAD | Baden |
| FC Basel 1893 | Basel | `sui-basel` | BAS | Basel |
| FC Biel-Bienne | Biel | `sui-biel` | BIE | Biel |
| FC Bulle | Bulle | `sui-bulle` | BUL | Bulle |
| FC Chiasso | Chiasso | `sui-chiasso` | CHI | Chiasso |
| FC Grenchen | Grenchen | `sui-grenchen` | GRE | Grenchen |
| FC La Chaux-de-Fonds | La Chaux-de-Fonds | `sui-la-chaux-de-fonds` | LCF | La Chaux-de-Fonds |
| FC Lausanne-Sport | Lausanne | `sui-lausanne` | LAU | Lausanne |
| FC Lugano (AC Lugano) | Lugano | `sui-lugano` | LUG | Lugano |
| FC Luzern | Luzern | `sui-luzern` | LUZ | Luzern |
| FC Nordstern Basel | Basel-Kleinbasel | `sui-basel-kleinbasel` | BKL | Basel |
| FC Schaffhausen | Schaffhausen | `sui-schaffhausen` | SHA | Schaffhausen |
| FC Sion | Sitten | `sui-sitten` | SIT | Sitten |
| FC St. Gallen 1879 | St. Gallen | `sui-st-gallen` | STG | St. Gallen |
| FC Stade Lausanne-Ouchy | Lausanne-Ouchy | `sui-lausanne-ouchy` | LOU | Lausanne |
| FC Thun | Thun | `sui-thun` | THU | Thun |
| FC Vaduz (Liechtenstein, spielt in der Schweizer Liga) | Vaduz | `sui-vaduz` | VAD | Vaduz |
| FC Wettingen | Wettingen | `sui-wettingen` | WET | Wettingen |
| FC Wil 1900 | Wil | `sui-wil` | WIL | Wil |
| FC Winterthur | Winterthur | `sui-winterthur` | WIN | Winterthur |
| FC Zürich | Zürich | `sui-zuerich` | ZÜR | Zürich |
| Grasshopper Club Zürich | Zürich Blau-Weiß | `sui-zuerich-blau-weiss` | ZBW | Zürich |
| Neuchâtel Xamax FC(S) | Neuenburg | `sui-neuenburg` | NEU | Neuenburg |
| SC Kriens | Kriens | `sui-kriens` | KRI | Kriens |
| SC Young Fellows Juventus | Zürich-Wiedikon | `sui-zuerich-wiedikon` | ZWI | Zürich |
| SC Zug | Zug | `sui-zug` | ZUG | Zug |
| Servette FC | Genf Granat | `sui-genf-granat` | GEG | Genf |
| SR Delémont | Delsberg | `sui-delsberg` | DEL | Delsberg |
| Vevey-Sports | Vevey | `sui-vevey` | VEV | Vevey |
| Yverdon-Sport FC | Yverdon | `sui-yverdon` | YVE | Yverdon-les-Bains |
| Étoile Carouge FC | Carouge | `sui-carouge` | CAR | Carouge |

## Verfremdung / Zuordnung

- Zürich: FC Zürich behält den vorhandenen Spielnamen „Zürich“ (weiß-blau); Grasshopper Club = „Zürich Blau-Weiß“; Young Fellows Juventus = „Zürich-Wiedikon“.
- Servette = „Genf Granat“ (Vereinsfarbe Granat, wie „Turin Granat“). Sion = „Sitten“, Xamax = „Neuenburg“, Delémont = „Delsberg“ (deutsche Ortsnamen).
- Nordstern Basel = „Basel-Kleinbasel“ (Basel = FC Basel). Stade Lausanne-Ouchy = „Lausanne-Ouchy“.
- „Etoile La Chaux-de-Fonds“ im Datensatz = FC La Chaux-de-Fonds (Namensfehler der Quelle).

## Unsicherheiten

- Siehe Tabelle „Datenqualität“; Mittelfeld-Reihenfolge der markierten Saisons unsicher.
- Pokalendspiele aus Wissen; Europapokal der Pokalsieger nach Regel.

# Design-Research-Dossier 1975–2030: „1975 – A Football Manager“
*Pascal Franke — September 10, 2026*

Dieses Dokument trennt drei Datenklassen:

- **H – historisch belegt:** unmittelbar durch die Evidenz gestützte Regel, Struktur oder Zahl.
- **A – abgeleitet:** rechnerisch aus belegten Eckwerten oder mehreren belegten Strukturen hergeleitet.
- **M – Modellwert:** bewusst gesetzter Spielparameter; keine Behauptung über die historische Realität.
- **U – ungeklärt:** in der vorliegenden Evidenz nicht ausreichend spezifiziert. Solche Felder dürfen nicht als historische Fakten fest codiert werden.

Für die Implementierung sollte jeder Datensatz mindestens `valid_from`, `valid_to`, `status`, `source_keys` und optional `uncertainty_note` besitzen. Saisons sind vorzugsweise als `YYYY/YY` zu speichern; Regeländerungen mitten im Kalenderjahr benötigen zusätzlich ein exaktes Wirksamkeitsdatum oder ein Saison-Flag.

## 1. Chronologische Feature- und Regel-Timeline 1975–2030

### 1.1 Grundprinzip für die Regel-Engine

Gesetze des Spiels, Wettbewerbsregeln und wirtschaftliche Vorschriften dürfen nicht in einer einzigen Regelklasse zusammengefasst werden:

| Regelklasse | Beispiele | Zuständige Ebene im Spiel | Empfohlene Datenklasse |
|---|---|---|---|
| Spielregel | Rückpass zum Torwart, VAR-Prüffälle | global bzw. verbandsweit | `law_rule` |
| Wettbewerbsregel | Punktewertung, Aufstieg, Playoff | Wettbewerb/Saison | `competition_rule` |
| Registrierungsregel | Ausländer- oder Kaderregel | Verband/Wettbewerb | `registration_rule` |
| Finanzregel | FFP, Nachhaltigkeitskontrolle | UEFA/Lizenzierung | `finance_rule` |
| Eigentums-/Governance-Regel | 50+1 | Verband/Lizenzierung | `ownership_rule` |
| Ausrüstungsregel | Werbung, Name, Nummer | Wettbewerb/Saison | `kit_rule` |
| Technische Infrastruktur | Torlinientechnik, VAR-Zentrale | Wettbewerb und Stadion | `technology_rule` |
| Kalenderregel | Winterpause | Wettbewerb/Saison | `calendar_rule` |

Die Drei-Punkte-Regel ist beispielsweise keine IFAB-Spielregel, sondern eine vom Wettbewerbsveranstalter festgelegte Wertungsregel. Sie darf deshalb nicht zusammen mit Fouls, Abseits oder Rückpass in einer globalen `laws_of_game`-Tabelle liegen.

### 1.2 Timeline

| Jahr/Saison | Regel oder Feature | Historischer Status | Spielmechanische Umsetzung |
|---|---|---|---|
| 1975/76 | Zwei Punkte für einen Sieg, ein Punkt für ein Unentschieden | H: Die Drei-Punkte-Regel wurde erst 1995/96 eingeführt; zuvor galt die Zwei-Punkte-Wertung. | `points_win=2`, `points_draw=1`, `points_loss=0`. Tabellenberechnung saisonabhängig konfigurieren. |
| 1975/76 | Drei Absteiger aus der Bundesliga | H: Hannover 96, Bayer 05 Uerdingen und Kickers Offenbach stiegen am Saisonende ab. | Für diese Saison `direct_relegation_slots=3`. Keine Relegation zwischen Bundesliga und 2. Bundesliga. |
| 1975/76 | Aufstieg aus der zweigleisigen 2. Bundesliga | H: Beide Staffelmeister stiegen direkt auf; die beiden Zweiten spielten den dritten Platz in Hin- und Rückspiel aus. | Nord- und Südmeister direkt befördern. Playoff mit zwei Partien, aggregiertem Ergebnis und Entscheidung bei Gleichstand gemäß gesonderter, in der Evidenz nicht spezifizierter Tiebreak-Regel. |
| 1975/76 | Auswechslungen | U: Zahl und genaue damalige Ausgestaltung werden in der Evidenz nicht genannt. | Nicht mit einem unbelegten Festwert ausliefern. Felder: `outfield_sub_limit`, `goalkeeper_sub_limit`, `bench_size`, `extra_time_subs`. Bis zur Ergänzung durch Primärquellen als `historical_value=null`. |
| 1975/76 | Differenzierung Torwartwechsel | U: Die Evidenz enthält keine belastbare Aussage, ob oder wie Torwartwechsel auf das damalige Wechselkontingent angerechnet wurden. | Eigenständige Flags vorsehen: `gk_change_counts_as_sub`, `gk_injury_exception`, `gk_change_after_limit`. Keine automatische Gleichsetzung mit Feldspielerwechseln. |
| 1975 | Rückpass zum Torwart | A/U: Belegt ist nur die spätere Einschränkung von 1992. Daraus folgt, dass die 1992 verbotene Aufnahme eines absichtlichen Zuspiels zuvor nicht nach dieser neuen Regel sanktioniert wurde; Detailformulierungen für 1975 sind nicht dokumentiert. | Vor 1992 kein `deliberate_kick_to_keeper_handling`-Verstoß auslösen. Andere Torwartverstöße nur bei gesonderter Evidenz simulieren. |
| 1975 | Trikotwerbung bereits vorhanden | H: Der Bundesliga-Premierentermin war der 24. März 1973 mit Eintracht Braunschweig und dem Jägermeister-Logo; weitere Vereine folgten. | Zum Spielstart 1975 ist Trikotsponsoring freigeschaltet. Sponsorverträge erzeugen Einnahmen, Reputationsrisiken und Ausrüstungsfreigaben. |
| 1975 | Spielernamen auf Trikots | U: Die vorliegenden Quellen beschreiben nur heutige DFL-Vorgaben, nicht den historischen Einführungstermin. | `player_name_on_shirt=false/unknown` nicht als historische Gewissheit behandeln. Einführung über eine später nachzurecherchierende Saisonregel steuern. |
| 1975 | Nachspielzeit | U: Kein belastbarer Einführungs- oder Anwendungsdatensatz vorhanden. | Zufalls- oder ereignisbasierte Nachspielzeit technisch unterstützen, historische Parameter aber nicht datieren. Felder: `stoppage_time_mode`, `display_policy`, `mean_added_minutes`. |
| 1975 | Winterpause | U: Dauer und saisonale Lage sind in der Evidenz nicht angegeben. | Kalenderdaten nicht aus einer pauschalen Winterpause ableiten. Pro Saison `winter_break_start`, `winter_break_end` und `winter_break_active` importieren. |
| 1981/82 | Eingleisige 2. Bundesliga | H: Die bisherigen Staffeln Nord und Süd wurden durch eine eingleisige Liga ersetzt; die Quelle nennt für den Beginn 20 Vereine. | Staffeln zusammenführen; `league_groups=1`, `team_count=20`. Qualifikation muss über Abschlusstabellen 1980/81 importiert werden und darf nicht nur nach Reputation erfolgen. |
| Seit 1982, periodisch | Relegation Bundesliga/2. Bundesliga | H: Ein Format zwischen dem Bundesliga-16. und dem Dritten der 2. Bundesliga wurde seit 1982 zeitweise verwendet. Die Evidenz liefert keine lückenlose Liste aller aktiven Saisons. | Relegation nicht dauerhaft ab 1982 einschalten. Saisonweise Flag `promotion_playoff_active` verwenden. Paarung: `tier1_rank=16` gegen `tier2_rank=3`, sofern das Saisonflag aktiv ist. |
| 1984/85 | DDR-Liga von fünf auf zwei Staffeln | H: Von 1971 bis 1984 bestanden fünf Staffeln; von 1984 bis 1991 zwei Staffeln mit jeweils 18 Mannschaften und direktem Aufstieg der Meister. | DDR-Datenbank migrieren: `groups=5` auf `groups=2`, `teams_per_group=18`; Aufstiegsrunde abschalten und beide Meister direkt aufsteigen lassen. |
| 1990/91 | Letzte DDR-/NOFV-Qualifikationssaison | H: Die letzte Oberliga-Saison diente als Qualifikation für das vereinigte Ligasystem. | Abschlusstabelle löst ein einmaliges Migrationsskript aus; keine reguläre Auf-/Abstiegsroutine anwenden. |
| 1991/92 | Bundesliga vorübergehend mit 20 Teams | H: Hansa Rostock und Dynamo Dresden wurden integriert; die Liga spielte einmalig mit 20 Mannschaften und 380 statt 306 Spielen. | `team_count=20`, Doppelrunde mit `matches=20×19=380`. Nachfolgende Normalisierung nur anhand separat gepflegter Saisondaten. |
| 1991/92 | 2. Bundesliga mit 24 Teams | H: Die Liga wurde zur Aufnahme ostdeutscher Teilnehmer auf 24 Vereine erweitert. Die Evidenz nennt zusätzlich regionale Segmente, jedoch keine vollständig präzise Konfiguration aller Phasen. | `team_count=24`; Spielplanmodus als migrationsspezifisches Objekt speichern. Ohne ergänzende Tabellenquelle keinen fiktiven Standardmodus generieren. |
| 1991/92 | NOFV-Oberliga als dritte Ebene | H: Drei regionale Staffeln Nord, Mitte und Süd; anschließend spielten die Staffelmeister um den Aufstieg. | Neue Liga-ID mit `tier=3`, `groups=3`; geografische Zuweisung und Aufstiegsrunde aktivieren. |
| 1992 | Rückpassregel | H: Am 30. Mai 1992 beschloss das IFAB in Newport, dass der Torwart einen von einem Mitspieler absichtlich zu ihm getretenen Ball nicht mehr mit den Händen aufnehmen darf. Ziel waren weniger Zeitspiel und mehr Angriffsspiel. | Bei `deliberate=true`, `played_by_teammate=true`, `method=kick` und `keeper_handles=true`: indirekter Freistoß. Regel ab dem festzulegenden Wirksamkeitsdatum der Saison 1992/93 aktivieren. |
| 1992/93 | UEFA Champions League | H: Umbenennung und Umstrukturierung des Europapokals; erste Saison unter dem Namen Champions League 1992/93. | Europapokal-Wettbewerbsobjekt wechseln; Medien-, Prämien- und Reputationskurven ab 1992/93 separat konfigurieren. |
| 1994/95 | Regionalliga als dritte Ebene, vier Staffeln | H: Vier Regionalligen; in der Premierensaison stiegen alle vier Meister direkt in die 2. Bundesliga auf. | `tier=3`, `groups=4`, `promotion_slots=4`, `promotion_mode=group_champions_direct`. Oberligen darunter um eine Ebene verschieben. |
| 1995/96 | Geänderter Regionalliga-Aufstieg | H: Ab 1995/96 spielten die Meister aus Nord und Nordost einen Aufsteiger aus, statt beide direkt aufsteigen zu lassen. | Aufstiegsobjekt mit Playoff Nord gegen Nordost; Zahl der direkt vergebenen Plätze entsprechend reduzieren. |
| 1995 | Bosman-Liberalisierung | H mit begrenzter Detailtiefe: Die Professionalisierung und Liberalisierung des Spielermarkts wird mit dem Bosman-Urteil von 1995 verbunden. Die Evidenz enthält keine vollständigen Registrierungs- oder Ablösungsregeln. | Ereignis `bosman_1995` aktiviert ein neues Transferregime. Konkrete Vertragsende-, Ablöse- und EU-Spielerparameter bleiben `U`, bis eine juristische Primärquelle ergänzt wird. |
| 1995/96 | Drei Punkte für einen Sieg | H: Einführung in der Bundesliga zum Saisonbeginn 1995/96, um Siege stärker zu belohnen und die Attraktivität zu erhöhen. | `points_win=3`, `points_draw=1`, `points_loss=0`. Bestehende historische Tabellen niemals rückwirkend umrechnen. |
| 1995 ff. | Ausländerregel | U: Die Evidenz nennt den Bosman-Effekt, liefert aber keine belastbare chronologische Folge konkreter Ausländer- oder EU-Kontingente. | Mehrdimensionale Registrierung vorsehen: `foreign_total_limit`, `eu_exempt`, `homegrown_min`, `non_eu_limit`. Historische Werte bis zur Quellenanreicherung auf `null` setzen. |
| 2004 | Systematische technomotorische Talentdiagnostik | H: Seit 2004 wird die Diagnostik im DFB-Talentförderprogramm halbjährlich eingesetzt. | Ab 2004 kann ein Diagnosemodul mit wiederholten Talenttests freigeschaltet werden. Es verbessert Beobachtungsqualität, nicht automatisch die reale Spielerfähigkeit. |
| 2008/09 | Einführung der 3. Liga | H: Eingleisige, vom DFB verwaltete Liga mit 20 Teams; darunter drei Regionalliga-Staffeln mit je 18 Teams. | Neue Ebene 3 erstellen; bisherige Regionalliga auf Ebene 4 verschieben. `third_league.team_count=20`; `regionalliga.groups=3`, `teams_per_group=18`. |
| 2008/09 | Qualifikation für die neue 3. Liga | H: Grundsätzlich qualifizierten sich die ersten zehn Teams jeder der zwei Regionalliga-Staffeln 2007/08, vorbehaltlich wirtschaftlicher und technisch-organisatorischer Anforderungen. | `sporting_qualifier=true` genügt nicht: zusätzlich `license_passed=true`. Bei Lizenzversagen Nachrücklogik als gesonderte Wettbewerbsregel. |
| 2008/09 | Begrenzung zweiter Mannschaften in der 3. Liga | H: Höchstens vier zweite Mannschaften professioneller Clubs waren vorgesehen. | `reserve_team_cap=4`; Lizenz- und Nachrückroutine muss Mannschaftstyp berücksichtigen. |
| 2010 | UEFA Financial Fair Play beschlossen | H: Genehmigung im Mai 2010; stufenweise Einführung 2010–2012. | Finanzprüfung als UEFA-Lizenzbedingung einführen; Übergangsperioden statt sofortiger Vollwirkung. |
| 2012–2013/14 | FFP-Kernprüfung | H: Break-even-Anforderung für Abschlüsse mit Ende 2012; erste Bewertungen 2013/14. | Rollierende Finanzperiode, Prüfung über mehrere Geschäftsjahre, überfällige Verbindlichkeiten und Zukunftsinformationen als getrennte Tests. Konkrete Toleranzbeträge sind in der Evidenz nicht enthalten. |
| 2015/16 | Torlinientechnik in der Bundesliga | H: Bundesliga-Einführung 2015/16. Sieben Kameras je Strafraum; Signal an den Schiedsrichter in weniger als einer Sekunde. | Nur Bundesliga-Stadien mit Infrastrukturflag aktivieren. Torentscheidung deterministisch aus Ballposition ableiten; Anzeigeverzögerung unter einer Sekunde simulieren. |
| 2017/18 | VAR in der Bundesliga | H: Einführung 2017/18. | VAR-System, Infrastrukturkosten, Videozentrum und zusätzliche Offizielle aktivieren. |
| 2017/18 | Vier VAR-Fallgruppen | H: Tore, Strafstöße, direkte rote Karten und Spielerverwechslungen. | Review-Trigger strikt auf `GOAL`, `PENALTY`, `DIRECT_RED`, `MISTAKEN_IDENTITY` begrenzen. Keine allgemeine Überprüfung jeder Entscheidung. |
| 2019/20 | VAR in der 2. Bundesliga | H: Einführung verzögert bis 2019/20, unter anderem wegen notwendiger Glasfaser- und Stadioninfrastruktur. | Zweite Liga erst ab dieser Saison aktivieren. Stadion-Upgrade als Zulassungsvoraussetzung und Kostenposten führen. |
| 2022 | UEFA-Finanznachhaltigkeitsregeln | H: Weiterentwicklung des FFP mit Fokus auf Solvenz, Stabilität und Kostenkontrolle. | Altes `break_even`-Modul durch zusammengesetzte Prüfungen ergänzen; keine unbelegten Grenzwerte fest codieren. |
| 2024/25 | Moderne DFL-Trikotregeln | H für Gegenwart: Name zentriert ober- oder unterhalb der Nummer, Blockbuchstaben bis 7,5 cm; Rückennummer 25–35 cm; Hosenfrontnummer 10–15 cm. | Trikoteditor validiert Position, Größe, Schrift und Kontrast. Diese Werte nicht rückwirkend auf historische Trikots anwenden. |
| 2027/28 | Geplanter Umzug des Video Assist Centers | H als angekündigter Zukunftstermin: Verlegung von Köln auf den DFB-Campus in Frankfurt. | Infrastrukturereignis mit `planned=true`. Vor Aktivierung im Spiel optional bestätigen, da Planung und tatsächliche Umsetzung auseinanderfallen können. |
| 2030 | Regelstand | M: Zukunft gegenüber der Quellenlage. | Alle nach dem letzten belegten Stand eintretenden Änderungen über Ereigniskarten oder Datenupdates abbilden, nicht als historische Gewissheit. |

### 1.3 Besonders kritische Regelfelder

#### Auswechslungen und Torwartwechsel

Die geforderte Differenzierung ist technisch notwendig, kann aber anhand der Evidenz nicht historisch befüllt werden:

```text
substitution_rule:
  outfield_sub_limit
  goalkeeper_sub_limit
  goalkeeper_counts_against_total
  goalkeeper_injury_exception
  bench_size
  substitution_windows
  extra_time_additional_sub
  concussion_substitution
```

Ein Nullwert bedeutet nicht „unbegrenzt“, sondern „historisch noch nicht verifiziert“. Die Match-Engine muss beim Laden einer historischen Saison entweder einen geprüften Datensatz verlangen oder einen ausdrücklich als `M` markierten Gameplay-Preset verwenden.

#### Werbung und Trikotnamen

Trikotwerbung ist 1975 kein später freizuschaltendes Zukunftsfeature, weil sie bereits 1973 in der Bundesliga auftrat. Dagegen darf der Zeitpunkt für Spielernamen nicht aus heutigen Ausrüstungsregeln zurückgerechnet werden. Sinnvoll sind zwei voneinander unabhängige Flags:

- `shirt_sponsor_allowed`
- `player_name_required`
- `club_name_required`
- `fixed_squad_number_active`
- `kit_approval_required`

#### 50+1

Die Evidenz beschreibt 50+1 als zentrale Governance-Forderung im Spannungsfeld zwischen Vereinsstrukturen und Kommerzialisierung, enthält aber weder ein belastbares Einführungsdatum noch vollständige Ausnahmen oder Kontrollkriterien. Im historischen Modus ist deshalb nur die Datenstruktur, nicht eine erfundene Timeline zulässig:

```text
ownership_rule:
  member_control_required
  minimum_member_vote_share
  exception_type
  grandfathering
  license_consequence
```

#### Winterpause und Nachspielzeit

Für beide Themen fehlen datierte historische Parameter. Sie sind als saisonale Kalender- bzw. Matchparameter anzulegen. Ein einziges globales Flag würde historische Änderungen, witterungsbedingte Verschiebungen und unterschiedliche Darstellungspraktiken unzulässig vermischen.

---

## 2. Mathematisch nutzbare Umsatzkurve 1975–2030

### 2.1 Bezugsgröße

Das Basismodell verwendet als Zielgröße:

> **Gesamtumsatz aller Clubs der Bundesliga und 2. Bundesliga je Saison, ohne Transfererlöse, sofern der jeweilige Bericht diese Abgrenzung verwendet.**

Diese Wahl orientiert sich an den modernen DFL-Aggregaten der 36 Clubs. Historische Werte vor der verfügbaren Berichtsreihe sind ausdrücklich keine rekonstruierten Buchhaltungsdaten. Öffentliche, konsistente TV-Reihen beginnen in der vorliegenden Evidenz erst um 2001. Zudem beziehen sich einzelne ältere Eckwerte nur auf die Bundesliga, während moderne DFL-Werte Bundesliga und 2. Bundesliga zusammenfassen. Eine unmarkierte Verkettung wäre methodisch falsch.

### 2.2 Währungsrelation

Für die technische Umstellung gilt die feste Relation:

- `1 EUR = 1,95583 DM`
- `1 DM = 0,51129 EUR`

Formeln:

```text
EUR = DM / 1,95583
DM  = EUR × 1,95583
```

Diese Umrechnung ist eine technische Modellkonstante. Nominale DM-Werte werden nicht inflationsbereinigt, sofern `price_basis=nominal` gesetzt ist.

### 2.3 Belegte moderne Ankerwerte

| Saison | Umfang | Umsatz | Status | Verwendung |
|---|---:|---:|---|---|
| 2014, ungefähr | Bundesliga | rund 1,7 Mrd. € | H, aber anderer Umfang als 36-Clubs-Modell | Plausibilitätsanker, nicht direkt in die kombinierte Reihe einsetzen |
| 2021/22 | Bundesliga + 2. Bundesliga, 36 Clubs | 4,48 Mrd. € | H | Exakter Kalibrierungspunkt |
| 2022/23 | Bundesliga + 2. Bundesliga, 36 Clubs | 5,24 Mrd. € | H | Exakter Kalibrierungspunkt |
| 2023/24 | Bundesliga + 2. Bundesliga, 36 Clubs | 5,87 Mrd. € | H | Exakter Kalibrierungspunkt |
| 2024/25 | Bundesliga + 2. Bundesliga, 36 Clubs | 6,33 Mrd. € | H | Exakter Kalibrierungspunkt |
| 2025/26–2028/29 | nationale Medienrechte | 1,121 Mrd. € je Saison | H, nur ein Umsatzbestandteil | Medienmodul, nicht als Gesamtumsatz behandeln |

Für 2022/23 nennt eine andere Quelle für die Bundesliga allein einen Gesamtumsatz von mehr als 4,4 Mrd. € und einen Medienanteil von über 34 Prozent. Das ist mit dem DFL-Wert von 5,24 Mrd. € für beide Ligen vereinbar, aber aufgrund des unterschiedlichen Umfangs nicht identisch.

### 2.4 Direkt verwendbare Stützwerte

Die folgende Reihe ist eine **Gameplay-Basiskurve**, keine historische Statistik. Alle Werte bis einschließlich 2001 sind in nominalen DM angegeben; ab 2002 wird intern auf Euro gewechselt. Die runden Größenordnungen vermeiden Scheingenauigkeit.

| Jahr/Saisonanker | Basismodell | Währung | Status | Kommentar |
|---:|---:|---|---|---|
| 1975 | 120 Mio. | DM | M | Startwert für eine kleine, bereits werbefähige Profiliga |
| 1980 | 180 Mio. | DM | M | moderate Kommerzialisierungsphase |
| 1985 | 300 Mio. | DM | M | wachsender Medien- und Sponsoringeinfluss |
| 1990 | 500 Mio. | DM | M | Vorstufe zur Wiedervereinigungs- und Europapokalexpansion |
| 1995 | 900 Mio. | DM | M | Bosman-/Drei-Punkte-Ära als struktureller Wendepunkt, nicht als unmittelbare Umsatzkausalität |
| 2000 | 1,80 Mrd. | DM | M | beschleunigte Medien- und Sponsoringentwicklung |
| 2001 | 2,00 Mrd. | DM | M | Währungsbrücke; entspricht rund 1,02 Mrd. € |
| 2005 | 1,30 Mrd. | € | M | kombinierter 36-Clubs-Spielwert |
| 2010 | 1,80 Mrd. | € | M | FFP-Einführung als Governance-Ereignis |
| 2015 | 2,80 Mrd. | € | M | mit dem belegten Bundesliga-Einzelwert um 2014 grob kompatible Größenordnung |
| 2020 | 4,20 Mrd. | € | M | geglätteter Basispfad; kein behaupteter Ist-Umsatz |
| 2021/22 | 4,48 Mrd. | € | H | DFL-Anker |
| 2022/23 | 5,24 Mrd. | € | H | DFL-Anker |
| 2023/24 | 5,87 Mrd. | € | H | DFL-Anker |
| 2024/25 | 6,33 Mrd. | € | H | DFL-Anker |
| 2025 | 6,30 Mrd. | € | A/M | gerundeter Fünfjahresstützwert aus 2024/25 |
| 2030 | 8,10 Mrd. | € | M-Projektion | Zukunftswert, kein Quellenbefund |

### 2.5 Interpolationsformel

Zwischen zwei Stützpunkten wird geometrisch interpoliert. Für die Jahre `y0` und `y1` mit den Umsätzen `R0` und `R1`:

```text
R(y) = R0 × (R1 / R0)^((y - y0) / (y1 - y0))
```

Der jährliche Wachstumsfaktor lautet:

```text
g = (R1 / R0)^(1 / (y1 - y0))
```

Die jährliche Wachstumsrate ist:

```text
rate = g - 1
```

Beispiel für 2025–2030:

```text
g = (8,10 / 6,30)^(1/5)
g ≈ 1,052
```

Das Basismodell nimmt damit für diesen Projektionsabschnitt ungefähr 5,2 Prozent nominales Wachstum pro Jahr an. Dies ist ein Modellparameter, keine Prognosegarantie.

### 2.6 Wachstumsfaktoren der Basiskurve

| Zeitraum | Start | Ende | Gesamtfaktor | Ungefähres jährliches Wachstum | Status |
|---|---:|---:|---:|---:|---|
| 1975–1985 | 120 Mio. DM | 300 Mio. DM | 2,50 | 9,6 % | M |
| 1985–1995 | 300 Mio. DM | 900 Mio. DM | 3,00 | 11,6 % | M |
| 1995–2005 | 900 Mio. DM = ca. 460 Mio. € | 1,30 Mrd. € | 2,83 | 11,0 % | M |
| 2005–2015 | 1,30 Mrd. € | 2,80 Mrd. € | 2,15 | 8,0 % | M |
| 2015–2025 | 2,80 Mrd. € | 6,30 Mrd. € | 2,25 | 8,4 % | gemischt M/H |
| 2025–2030 | 6,30 Mrd. € | 8,10 Mrd. € | 1,29 | 5,2 % | M-Projektion |

### 2.7 Umsatztreiber

Die Quellen stützen folgende Kategorien als reale Treiber, ohne für alle Jahrzehnte quantitative Anteile zu liefern:

| Treiber | Evidenz | Umsetzung |
|---|---|---|
| Medienrechte | Fernsehen ist ein zentraler Umsatzpfeiler; akademische Befunde nennen ungefähr 37 Prozent für europäische Clubs. In der Bundesliga 2022/23 lag der Medienanteil laut vorliegender Statistik bei über 34 Prozent. | Zentraler Medienpool plus clubabhängige Verteilung |
| Sponsoring und Werbung | Trikotwerbung begann 1973; Sponsoring wurde zu einem wesentlichen Erlösfeld. | Sponsorvertrag nach Reichweite, Tabellenrang und Markenpassung |
| Spieltag | Moderne europäische Topclubs verzeichneten starkes Wachstum bei Matchday-Umsätzen; Infrastruktur und Fan-Erlebnis sind Treiber. | Kapazität × Auslastung × Preis × Hospitality-Faktor |
| Kommerzielle Erlöse | Bei den 20 umsatzstärksten Clubs war der kommerzielle Bereich 2024/25 mit 43 Prozent der größte Block. | Merchandising, Partnerschaften, internationale Reichweite |
| Europapokal | Neue bzw. erweiterte Wettbewerbsformate steigerten moderne Clubumsätze. | Prämien, Medienanteil, Sponsorboni und Reputationssprung |
| Digitalisierung | Neue Plattformen verändern Distribution und Fanbindung. | Digitalerlöse, Abonnements, internationale Fanbasis |
| Stadionmodernisierung | Matchday-Wachstum wurde mit Infrastrukturmodernisierung und erweitertem Fan-Erlebnis verbunden. | Investition erhöht Hospitality, Preisobergrenze und Nebenumsatz |

### 2.8 Clubumsatz aus dem Ligagesamtwert

Ein direkt implementierbares Verteilungsmodell:

```text
club_revenue_i =
    league_revenue
  × normalized_weight_i
  × club_shock_i
```

Gewicht:

```text
raw_weight_i =
    0,30 × equal_share
  + 0,20 × sporting_score_i
  + 0,18 × audience_score_i
  + 0,12 × stadium_score_i
  + 0,12 × commercial_score_i
  + 0,08 × european_score_i

normalized_weight_i = raw_weight_i / sum(raw_weight_all_clubs)
```

Alle Koeffizienten sind M-Werte. Für eine historische Simulation sollte `commercial_score` in frühen Jahren eine engere Streuung besitzen als in späteren Jahrzehnten.

Optionaler Ligastufenfaktor:

| Liga | Faktor am normalisierten Clubgewicht | Status |
|---|---:|---|
| Bundesliga | 1,00 | M |
| 2. Bundesliga | 0,28 | M |
| 3. Liga | 0,08 | M |
| Regionalliga | 0,025 | M |

Diese Faktoren sind Balancingparameter und nicht als reale Umsatzverhältnisse zu zitieren.

---

## 3. Robustes Wirtschafts- und Ereignismodell nach 2030

Alle Werte dieses Abschnitts sind Projektionen oder Spielparameter. Die Quellen liefern keine historischen Daten für die Zeit nach 2030.

### 3.1 Basispfad

Für das Jahr `t > 2030`:

```text
R_t = R_(t-1) × (1 + g_base + g_media + g_digital + g_international
                 - d_saturation - d_regulation) × shock_t
```

Empfohlener neutraler Parametersatz:

| Parameter | Neutral | Pessimistisch | Optimistisch | Harte Modellgrenze |
|---|---:|---:|---:|---:|
| `g_base` | 2,0 % | 0,5 % | 3,0 % | −3 % bis +5 % |
| `g_media` | 1,0 % | −1,5 % | 2,5 % | −5 % bis +5 % |
| `g_digital` | 1,0 % | 0,2 % | 2,0 % | 0 % bis +4 % |
| `g_international` | 0,8 % | 0,0 % | 2,0 % | −1 % bis +4 % |
| `d_saturation` | 0,8 % | 1,5 % | 0,3 % | 0 % bis 3 % |
| `d_regulation` | 0,3 % | 1,0 % | 0,1 % | 0 % bis 2 % |

Neutral ergibt dies vor Schocks ungefähr:

```text
2,0 + 1,0 + 1,0 + 0,8 - 0,8 - 0,3 = 3,7 % pro Jahr
```

### 3.2 Sättigungsfunktion

Damit Umsätze nicht unbegrenzt exponentiell wachsen:

```text
d_saturation_t = s_max × R_t / (R_t + K)
```

Empfehlung:

- `s_max = 0,035`
- `K = 12 Mrd. €`
- `R_t` = Gesamtumsatz der beiden Profiligen

Bei steigendem Umsatz nähert sich der Sättigungsabzug maximal 3,5 Prozentpunkten.

### 3.3 Zufällige Jahresschocks

```text
shock_t = product(1 + impact_e)
```

| Ereignis | Jährliche Wahrscheinlichkeit | Umsatzwirkung im ersten Jahr | Dauer | Folgewirkung |
|---|---:|---:|---:|---|
| Medienrechte-Boom | 8 % | +8 bis +18 % | 1–4 Jahre | höheres Lohnwachstum |
| Medienrechte-Rückgang | 10 % | −6 bis −15 % | 2–4 Jahre | Transferbudgets sinken |
| Internationale Formatreform | 6 % | +4 bis +12 % für qualifizierte Clubs | 3–6 Jahre | größere Erlösstreuung |
| Regulatorische Kostenkontrolle | 8 % | Umsatz 0 bis −2 %, Kosten −4 bis −10 % | 3–8 Jahre | bessere Solvenz |
| Stadion-/Publikumsbeschränkung | 3 % | −12 bis −35 % | 1–2 Jahre | Matchday stark betroffen |
| Digitale Plattforminnovation | 12 % | +2 bis +8 % | 2–6 Jahre | Reichweite steigt |
| Sponsorenskandal | 5 % je exponiertem Club | −5 bis −20 % Clubumsatz | 1–3 Jahre | Reputationsverlust |
| Wirtschaftliche Rezession | 10 % | −3 bis −10 % | 1–3 Jahre | Sponsoring und Hospitality betroffen |
| Europapokalerfolg | leistungsabhängig | +5 bis +25 % Clubumsatz | 1–2 Jahre | Reputation und Kaderkosten steigen |
| Infrastrukturmodernisierung | investitionsabhängig | +2 bis +10 % nach Fertigstellung | 5–15 Jahre | vorher Baukosten und Ausfallrisiko |

Die Wahrscheinlichkeiten sind M-Werte. Mehrere Ereignisse dürfen korreliert sein. Eine Rezession sollte etwa die Wahrscheinlichkeit eines schwachen Sponsorenmarkts erhöhen.

### 3.4 Kostenmodell

```text
total_cost_t =
    squad_cost
  + staff_cost
  + stadium_cost
  + administration_cost
  + youth_cost
  + finance_cost
  + compliance_cost
```

Kaderkosten:

```text
squad_cost =
    club_revenue
  × target_squad_ratio
  × ambition_multiplier
```

Empfohlene Grenzen:

| Clubstrategie | Zielquote Kaderkosten/Umsatz | Insolvenzrisiko-Multiplikator |
|---|---:|---:|
| konservativ | 30–40 % | 0,7 |
| ausgeglichen | 40–52 % | 1,0 |
| aggressiv | 52–65 % | 1,6 |
| extrem | über 65 % | 2,5 |

Als moderner Plausibilitätsanker nennt die DFL für beide Profiligen zusammen eine Kaderkostenquote von 34 Prozent; europäische Vergleichsligen lagen häufig zwischen 50 und 70 Prozent. Deloitte nennt für die Bundesliga im Big-Five-Vergleich eine Personalaufwandsquote von 54 Prozent. Diese Werte widersprechen sich nicht zwingend, weil „Kaderkosten“ und „Personalaufwand“ unterschiedliche Abgrenzungen haben können. Im Datenmodell sind deshalb `squad_cost_ratio` und `total_personnel_ratio` getrennt zu führen.

### 3.5 Solvenz und Lizenzrisiko

```text
liquidity_months =
    liquid_assets / (annual_cash_cost / 12)

distress_score =
    0,35 × max(0, 3 - liquidity_months)
  + 0,25 × overdue_payables_flag
  + 0,20 × max(0, wage_ratio - 0,60) × 10
  + 0,20 × negative_equity_flag
```

Empfohlene Ereignisgrenzen:

| `distress_score` | Folge |
|---:|---|
| unter 0,5 | normal |
| 0,5–1,0 | erhöhte Kreditkosten |
| 1,0–1,5 | Transferkontrolle und Lizenzauflagen |
| 1,5–2,0 | Punktabzugs-/Lizenzrisiko als Zufallsereignis |
| über 2,0 | akute Restrukturierung oder Insolvenzereignis |

FFP und spätere Nachhaltigkeitsregeln verlangen unter anderem ausgeglichene Finanzen, keine überfälligen Zahlungen und Zukunftsinformationen. Die konkreten Schwellen des obigen Scores sind jedoch reine Spielgestaltung.

### 3.6 Harte Grenzen gegen Modellinstabilität

- Jährlicher Ligagesamtumsatz darf ohne als außergewöhnlich markiertes Ereignis höchstens um 25 Prozent steigen.
- Ein normaler Rückgang wird bei −20 Prozent gekappt; größere Einbrüche benötigen ein Schockereignis.
- Ticketumsatz darf physische Kapazität und ausgetragene Heimspiele nicht überschreiten.
- Medienerlöse dürfen nicht gleichzeitig vollständig als zentraler Ligawert und als zusätzlicher Clubwert gebucht werden.
- Europapokalprämien werden nur qualifizierten Clubs zugewiesen.
- Staffkosten reduzieren keine Verletzungen auf null.
- Datenanalyse verbessert Entscheidungsqualität, garantiert aber weder Transfers noch Siege.
- Ein Sponsor darf nur dann doppelt aktiviert werden, wenn die Ausrüstungsvorschriften mehrere Flächen erlauben.
- Zukunftsregeln werden als `projected`, nie als `historical`, gespeichert.

---

## 4. Westdeutsche Ligenstruktur 1975/76

### 4.1 Ebenenhierarchie

| Ebene | Wettbewerb 1975/76 | Staffeln | Mannschaften | Aufstieg | Abstieg |
|---:|---|---:|---:|---|---|
| 1 | Bundesliga | 1 | 18 | entfällt | drei Clubs in die 2. Bundesliga |
| 2 | 2. Bundesliga | 2: Nord und Süd | 20 je Staffel | Meister direkt; Zweite im Hin-/Rückspiel um Platz 3 | jeweils vier belegte Absteiger in regionale Amateurligen |
| 3 | Oberligen und höchste regionale Amateurligen | mehrere regionale Wettbewerbe | unterschiedlich | direkte Plätze und komplexe Aufstiegsrunden | regional |
| 4+ | regionale Unterbauten | in der Evidenz nicht vollständig | unterschiedlich | regional | regional |

Die 2. Bundesliga befand sich in ihrem zweiten Jahr und bestand aus insgesamt 40 Clubs.

### 4.2 Vollständige Teilnehmerliste der Bundesliga 1975/76

Die 18 Teilnehmer sind durch die DFB-Tabelle des 15. Spieltags belegt:

1. Borussia Mönchengladbach  
2. Hamburger SV  
3. Eintracht Braunschweig  
4. Bayern München  
5. 1. FC Kaiserslautern  
6. FC Schalke 04  
7. 1. FC Köln  
8. Hertha BSC  
9. Eintracht Frankfurt  
10. Rot-Weiss Essen  
11. Fortuna Düsseldorf  
12. MSV Duisburg  
13. SV Werder Bremen  
14. FC Bayer 05 Uerdingen  
15. Karlsruher SC  
16. Hannover 96  
17. VfL Bochum  
18. Kickers Offenbach  

Borussia Mönchengladbach wurde Meister; Hannover 96, Bayer 05 Uerdingen und Kickers Offenbach stiegen ab.

### 4.3 2. Bundesliga Nord 1975/76

Die Evidenz bestätigt 20 Teilnehmer, enthält jedoch **keine vollständige Teilnehmerliste**. Eine Ergänzung unbekannter Clubs aus nicht belegtem Wissen würde gegen den geforderten Faktenstandard verstoßen.

Belegte Teilnehmer und Saisonrollen:

| Club | Belegter Status 1975/76 |
|---|---|
| Tennis Borussia Berlin | Meister, direkter Aufstieg |
| Borussia Dortmund | Zweiter; Playoff-Sieger und dritter Aufsteiger |
| Preußen Münster | Dritter |
| Wuppertaler SV | Fünfter |
| 1. FC Mülheim bzw. 1. FC Mülheim-Styrum | Absteiger; Namensform in den Quellen uneinheitlich |
| SpVgg Erkenschwick | Absteiger |
| DJK Gütersloh | Absteiger |
| Spandauer SV | Absteiger und Tabellenletzter |

Tennis Borussia Berlin gewann die Staffel. Borussia Dortmund setzte sich gegen den Süd-Zweiten 1. FC Nürnberg durch. Spandauer SV erreichte 8:68 Punkte; die Quellen bezeichnen dies als niedrigsten Punktwert der Zweitligageschichte.

Für den Produktionsdatensatz fehlen damit zwölf verifizierte Nord-Teilnehmer. Der Import muss die Saison als `roster_complete=false` kennzeichnen.

### 4.4 2. Bundesliga Süd 1975/76

Auch für die Südgruppe bestätigt die Evidenz 20 Teilnehmer, liefert aber keine vollständige Liste.

Belegte Teilnehmer:

| Club | Belegter Status 1975/76 |
|---|---|
| 1. FC Saarbrücken | Meister, direkter Aufstieg |
| 1. FC Nürnberg | Zweiter; verlor das Aufstiegsplayoff |
| SV Röchling Völklingen | Club des belegten Staffel-Torschützen Karl-Heinz Granitza |
| 1. FSV Mainz 05 | Absteiger |
| 1. FC Schweinfurt 05 | Absteiger |
| Eintracht Bad Kreuznach | Absteiger |
| SSV Reutlingen 05 | Absteiger |

Der 1. FC Saarbrücken stieg direkt auf; der 1. FC Nürnberg verpasste den Aufstieg im Playoff gegen Borussia Dortmund. Für eine vollständige Startdatenbank fehlen dreizehn verifizierte Süd-Teilnehmer.

### 4.5 Auf- und Abstieg 1975/76

#### Bundesliga zur 2. Bundesliga

- Hannover 96
- Bayer 05 Uerdingen
- Kickers Offenbach

#### 2. Bundesliga zur Bundesliga

- Tennis Borussia Berlin, Meister Nord
- 1. FC Saarbrücken, Meister Süd
- Borussia Dortmund, Playoff-Sieger gegen 1. FC Nürnberg

#### 2. Bundesliga zu den regionalen Amateurligen

Nord:

- 1. FC Mülheim/Mülheim-Styrum
- SpVgg Erkenschwick
- DJK Gütersloh
- Spandauer SV

Süd:

- 1. FSV Mainz 05
- 1. FC Schweinfurt 05
- Eintracht Bad Kreuznach
- SSV Reutlingen 05

### 4.6 Regionale dritte Ebene und Aufstieg

Die Bezeichnung „Amateur-Oberligen“ ist für 1975/76 nicht überall einheitlich anzuwenden. Die Evidenz nennt Oberligen und regionale Amateurligen nebeneinander.

Belegte Wettbewerbsräume:

- Oberliga Nord
- Oberliga Berlin
- Amateurliga Mittelrhein
- Amateurliga Niederrhein
- Amateurliga Westfalen
- Amateurliga Hessen
- Amateurliga Bayern
- Amateurliga Saarland
- Amateurliga Südwest
- Amateurliga Rheinland
- Amateurliga Nordbaden
- Amateurliga Südbaden
- Amateurliga Württemberg
- Amateurliga Schwarzwald-Bodensee

Dreizehn Clubs nahmen 1975/76 an den relevanten Aufstiegsentscheidungen teil. Belegte Aufsteiger zur 2. Bundesliga 1976/77:

| Club | Herkunft/Mechanismus laut Evidenz |
|---|---|
| SV Arminia Hannover | Meister Oberliga Nord; erfolgreich in der Aufstiegsrunde |
| VfL Wolfsburg | Zweiter Oberliga Nord; erfolgreich in der Aufstiegsrunde |
| Bonner SC | Aufstieg über Nord-System |
| SC Herford | Aufstieg über Nord-System |
| KSV Baunatal | direkter Aufstieg |
| FV Würzburg 04 | direkter Aufstieg |
| Eintracht Trier | erfolgreicher südlicher Teilnehmer |
| BSV 07 Schwenningen | erfolgreicher südlicher Teilnehmer |

SC Union 06 Berlin gewann die Oberliga Berlin, scheiterte jedoch in der Aufstiegsrunde.

### 4.7 Implementierungsanforderung für unvollständige Teilnehmerdaten

```text
competition_season:
  season_id
  competition_id
  expected_team_count
  imported_team_count
  roster_complete
  standings_complete
  promotion_rules_complete
```

Der Saisonstart darf im Modus „historisch strikt“ nur erfolgen, wenn:

```text
imported_team_count == expected_team_count
and roster_complete == true
```

Im Sandbox-Modus können fehlende Clubs durch klar als fiktiv markierte Platzhalter ersetzt werden. Diese dürfen weder historische Vereinsnamen noch historische Tabellenplätze erhalten.

---

## 5. DDR-Struktur und Wiedervereinigungsintegration

### 5.1 Ligapyramide

Die DDR-Oberliga war von 1949 bis 1991 die höchste Spielklasse; darunter stand die DDR-Liga.

| Zeitraum | Ebene 1 | Ebene 2 | Weitere belegte Ebene | Aufstieg zur Oberliga |
|---|---|---|---|---|
| 1971–1984 | DDR-Oberliga | DDR-Liga, fünf Staffeln A–E | 15 Bezirksligen; Quellen ordnen sie wegen einer zeitweise vorhandenen Zwischenebene als vierte Ebene ein | fünf Staffelmeister in Aufstiegsrunde |
| 1984–1991 | DDR-/NOFV-Oberliga | DDR-Liga, zwei Staffeln mit je 18 Teams | Bezirksligen | beide Staffelmeister direkt |
| 1991/92 | gemeinsame Bundesliga | gemeinsame 2. Bundesliga | NOFV-Oberliga Nord, Mitte, Süd als dritte Ebene | Staffelmeister in Aufstiegsrunde |

Für 1980/81 nennt die Evidenz 60 DDR-Liga-Teams in fünf Staffeln. Die fünf Meister bestritten eine Aufstiegsrunde; Energie Cottbus und Chemie Buna Schkopau stiegen auf. Insgesamt stiegen 15 Clubs in die Bezirksligen ab.

### 5.2 Prägende Clubs der 1970er und 1980er

| Club | Historische Einordnung |
|---|---|
| Dynamo Dresden | prägte die 1970er, blieb in den 1980ern Titelanwärter; acht Meisterschaften und sieben Pokalsiege insgesamt |
| 1. FC Magdeburg | besonders erfolgreich in den 1970ern; drei Oberliga-Meisterschaften, sieben Pokalsiege und 1974 als einziger DDR-Club ein europäischer Titel |
| BFC Dynamo | zehn Meistertitel in Folge von 1979 bis 1988; dominante Kraft der 1980er |
| FC Carl Zeiss Jena | langjährige Spitzenkraft, fünfmal Vizemeister unter Hans Meyer und Finalist im Europapokal der Pokalsieger 1981 |

Der Leistungsunterschied wurde durch staatliche Förderung und die Konzentration von Spielern in Fußballclubs gegenüber kleineren Betriebssportgemeinschaften beeinflusst. Für das Spiel ist dieser Zusammenhang eher als institutioneller Rekrutierungsbonus denn als normaler freier Transfermarkt abzubilden.

### 5.3 Saisonbeispiel 1975/76

SG Dynamo Dresden gewann 1975/76 die DDR-Oberliga mit 43 Punkten, 19 Siegen und nur zwei Niederlagen. BFC Dynamo wurde Zweiter, der 1. FC Magdeburg Dritter.

Diese Saison kann als paralleles Spielgebiet zum westdeutschen Startsystem geladen werden:

```text
country_system = "DDR"
top_league = "DDR-Oberliga"
second_league = "DDR-Liga"
transfer_market_model = "state_constrained"
currency_economy = separate
cross_border_transfers = restricted/unknown
```

Die konkrete historische Transfergesetzgebung ist in der Evidenz nicht ausreichend dokumentiert; `state_constrained` ist daher eine abstrahierende Modellklasse.

### 5.4 Integration 1991/92: exakt belegte Profiziele

Der DFV trat am 21. November 1990 dem DFB bei; der NOFV übernahm die regionale Organisation.

#### Bundesliga 1991/92

| Platz 1990/91 | Club | Zielklasse 1991/92 | Qualifikationsart |
|---:|---|---|---|
| 1 | F.C. Hansa Rostock | Bundesliga | direkt |
| 2 | 1. FC Dynamo Dresden | Bundesliga | direkt |

Die DFB-Evidenz verwendet auch die Kurzformen Hansa Rostock und Dynamo Dresden. Für die Vereins-ID sollte der zeitgenössische Name gespeichert und ein Alias hinterlegt werden.

#### 2. Bundesliga 1991/92

| Ausgang | Club | Zielklasse | Qualifikationsart |
|---|---|---|---|
| Platz 3 | FC Rot-Weiß Erfurt | 2. Bundesliga | direkt |
| Platz 4 | Hallescher FC | 2. Bundesliga | direkt |
| Platz 5 | Chemnitzer FC | 2. Bundesliga | direkt |
| Platz 6 | FC Carl Zeiss Jena | 2. Bundesliga | direkt |
| Playoff aus Plätzen 7–12 | 1. FC Lokomotive Leipzig | 2. Bundesliga | Qualifikationsrunde |
| Playoff aus Plätzen 7–12 | BSV Stahl Brandenburg | 2. Bundesliga | Qualifikationsrunde |

Diese acht Zielzuweisungen sind durch die Übergangsdaten belegt.

#### NOFV-Oberliga 1991/92

Die übrigen nicht für Bundesliga oder 2. Bundesliga qualifizierten Clubs wurden der neuen NOFV-Oberliga zugeordnet, die als dritte Ebene in Nord, Mitte und Süd spielte. Die Evidenz nennt jedoch nicht sämtliche verbleibenden Clubnamen. Eine vollständige namentliche Migrationsliste unterhalb der acht Profizuweisungen kann deshalb nicht ohne zusätzliche Abschlusstabelle 1990/91 erstellt werden.

### 5.5 Direkt umsetzbare Migrationslogik

```text
for club in nofv_top_league_1990_91:

    if final_rank == 1:
        destination = BUNDESLIGA_1991_92

    else if final_rank == 2:
        destination = BUNDESLIGA_1991_92

    else if final_rank in [3, 4, 5, 6]:
        destination = SECOND_BUNDESLIGA_1991_92

    else if final_rank in [7, 8, 9, 10, 11, 12]:
        destination = qualification_result.destination

    else:
        destination = NOFV_OBERLIGA_1991_92
```

Qualifikationsausgang:

```text
1. FC Lokomotive Leipzig -> 2. Bundesliga
BSV Stahl Brandenburg    -> 2. Bundesliga
other playoff entrants   -> NOFV-Oberliga
```

Regionale Zuweisung:

```text
if region in Mecklenburg-Vorpommern or north_cluster:
    group = NORD
else if region in Sachsen-Anhalt or central_Berlin_Brandenburg_cluster:
    group = MITTE
else if region in Sachsen or Thüringen:
    group = SÜD
```

Die Quellen nennen SV Merseburg 99 als Ausnahme aus Sachsen-Anhalt in der Südstaffel. Deshalb muss die regionale Logik eine Override-Tabelle unterstützen:

```text
group_override["SV Merseburg 99"] = SÜD
```

### 5.6 Identitäts- und Namensmigration

Jeder Club benötigt eine dauerhafte Identität unabhängig von Namenswechseln:

```text
club:
  club_id
  canonical_identity
  historical_name
  valid_from
  valid_to
  successor_club_id
  region_id
  association_id
```

Beispiel für die Quellenlage: Der Staffelmeister der NOFV-Oberliga Nord 1991/92 wird als FC Berlin bezeichnet, ehemals BFC Dynamo. Das Spiel darf beide Namen nicht als separate Clubs zählen.

### 5.7 NOFV-Oberliga 1991/92

| Staffel | Meister | Ergebnis der Aufstiegsrunde |
|---|---|---|
| Nord | FC Berlin | kein Aufstieg |
| Mitte | 1. FC Union Berlin | kein Aufstieg |
| Süd | FSV Zwickau | kein Aufstieg |

Keiner der drei Staffelmeister erreichte in dieser Saison die 2. Bundesliga.

---

## 6. Strukturreformen 1975–2010

| Saison/Jahr | Vorher | Nachher | Teams/Staffeln | Auf-/Abstiegseffekt | Status |
|---|---|---|---|---|---|
| 1974/75, für Start 1975 relevant | regionale zweite Ebenen vor Gründung | 2. Bundesliga Nord und Süd | 2 × 20 Clubs im Zeitraum bis 1981 | beide Meister direkt; Zweite spielen dritten Aufsteiger aus | H |
| 1975/76 | bestehende zweigleisige 2. Bundesliga | unverändert | Nord 20, Süd 20 | zwei direkte Aufsteiger plus Playoff-Sieger; je vier belegte Absteiger | H |
| 1981/82 | 2. Bundesliga Nord und Süd | eingleisige 2. Bundesliga | vorher 40 Clubs in zwei Staffeln; danach 20 Clubs in einer Liga | regionale Meister-/Playofflogik entfällt; einheitliche Tabelle | H |
| seit 1982, nicht durchgehend | direkter Austausch | zeitweise Relegation | Bundesliga-16. gegen Zweitliga-Dritten | zusätzlicher Entscheidungspfad neben Direktaufstieg und -abstieg | H, Saisonliste unvollständig |
| 1984/85 DDR | DDR-Liga mit fünf Staffeln | DDR-Liga mit zwei Staffeln | vorher 5 Staffeln; danach 2 × 18 | Aufstiegsrunde der fünf Meister entfällt; zwei Meister steigen direkt auf | H |
| 1991/92 Bundesliga | reguläre westdeutsche Bundesliga | vereinigte Bundesliga | vorübergehend 20 Teams | Aufnahme von Hansa Rostock und Dynamo Dresden; 380 Spiele | H |
| 1991/92 2. Bundesliga | eingleisige zweite Liga | Übergangswettbewerb mit 24 Teams | 24 Clubs; regionale Segmente belegt, Detailmodus unvollständig | Aufnahme von sechs ostdeutschen Clubs | H mit Strukturunsicherheit |
| 1991/92 Nordost | DDR-Ligensystem | NOFV-Oberliga als dritte Ebene | 3 Staffeln Nord, Mitte, Süd; 18–20 Teams je Staffel laut Quelle | Staffelmeister in Aufstiegsrunde; viele Abstiege wegen geplanter Reduktion auf 16 | H |
| 1994/95 | Oberligen als dritte Ebene | Regionalliga als dritte Ebene | 4 Regionalliga-Staffeln | alle vier Meister direkt in die 2. Bundesliga | H |
| 1995/96 | vier direkte Meisteraufstiege | Playoff Nord gegen Nordost | weiterhin 4 Staffeln | Nord und Nordost teilen sich einen über Playoff bestimmten Aufstiegsplatz | H |
| 2004 | keine in der Evidenz belegte Ligareform | systematische Talentdiagnostik im DFB-Fördersystem | 366 Stützpunkte im modernen Programmbefund | kein direkter Auf-/Abstiegseffekt; verbesserte Talenterfassung | H |
| Beschluss 2006, wirksam 2008/09 | zwei Regionalligen als dritte Ebene | eingleisige 3. Liga; Regionalliga wird vierte Ebene | 3. Liga mit 20; darunter 3 × 18 | neue professionelle Zwischenebene zwischen 2. Bundesliga und Regionalliga | H |
| 2008/09 Qualifikation | zwei Regionalliga-Staffeln 2007/08 | 20 Startplätze der 3. Liga | grundsätzlich je zehn sportliche Qualifikanten | wirtschaftliche und organisatorische Lizenzprüfung kann sportliche Qualifikation übersteuern | H |
| 2008/09 zweite Mannschaften | keine hier belegte identische Obergrenze | Obergrenze in der 3. Liga | maximal vier Reserveteams | Nachrück- und Lizenzlogik abhängig vom Teamtyp | H |
| Mai 2010 | UEFA-Clubfinanzkontrolle vor FFP | stufenweise FFP-Einführung | keine Ligateamänderung | indirekter Effekt über Teilnahmeberechtigung und Finanzplanung | H |

### 6.1 Reform-Engine

Jede Reform sollte als atomare Migration ausgeführt werden:

```text
league_reform:
  reform_id
  effective_season
  affected_competitions[]
  old_tier
  new_tier
  old_group_count
  new_group_count
  old_team_count
  new_team_count
  qualification_rule_id
  relegation_rule_id
  licensing_rule_id
```

Ablauf:

1. Alte Saison abschließen.
2. Sportliche Qualifikanten berechnen.
3. Playoffs und Aufstiegsrunden ausführen.
4. Lizenzprüfung anwenden.
5. Reformbedingte Zusatzqualifikation ausführen.
6. Vereine geografisch zuweisen.
7. Sollgrößen prüfen.
8. Neue Spielpläne generieren.
9. Alte Tabellen unverändert archivieren.

### 6.2 Nicht ausreichend belegte Reformen

Für folgende Punkte liegen keine vollständigen Parameter vor:

- genaue Normalisierung der Bundesliga nach der 20er-Saison 1991/92;
- vollständiger Austragungsmodus der 24er-2.-Bundesliga 1991/92;
- mögliche Regionalliga-Reformen um 2000;
- lückenlose Saisons mit Bundesliga-Relegation;
- vollständige Staffelgrößen und Absteiger jeder regionalen Amateurliga 1975/76.

Diese Datensätze benötigen ergänzende Verbandsordnungen oder vollständige Abschlusstabellen.

---

## 7. Mitarbeiterrollen und Epochenfreischaltungen

### 7.1 Trennung von Historie und Gameplay

Die Quellen belegen einen langfristigen Übergang von traditioneller Vereinsorganisation zu spezialisierten Stäben mit Medizin, Physiotherapie, Psychologie, Ernährung, Datenanalyse und Medienmanagement. Sie liefern jedoch keine vollständige Jahresliste, ab wann jede Rolle in jedem Bundesligaclub vorhanden war.

Daher gelten:

- Rollenexistenz in modernen Stäben: überwiegend **H**.
- exakte Freischaltjahre und Kostenklassen: **M**.
- Verbreitungsgrade je Dekade: **M**, sofern nicht ausdrücklich als Quellenbefund markiert.
- Effekte auf Siegchance, Verletzungsrisiko oder Umsatz: **M**.

Kostenklassen:

| Klasse | Relative jährliche Kosten |
|---|---:|
| K1 | 0,2–0,5 Basispersonaleinheiten |
| K2 | 0,5–1,0 |
| K3 | 1,0–2,0 |
| K4 | 2,0–4,0 |
| K5 | 4,0–8,0 |

Eine Basispersonaleinheit ist ein skalierbarer Clubwert:

```text
staff_cost_unit = max(minimum_staff_budget, club_revenue × 0,001)
```

### 7.2 Startpersonal 1975–1979

| Rolle | Historischer Status | Spieleffekt | Kosten | Freischaltfenster |
|---|---|---|---:|---|
| Cheftrainer | H als traditionelle Kernrolle | Training, Taktik, Aufstellung, Moral | K3 | ab 1975 obligatorisch |
| Co-Trainer | M als standardisierte Startrolle; konkrete Verbreitung unbelegt | +5–10 % Trainingsorganisation, Vertretung | K2 | ab 1975 verfügbar |
| Mannschaftsarzt | H als traditionelle medizinische Kernfunktion im Professionalisierungsprozess | Diagnosequalität, Behandlungsentscheidung | K2–K3 | ab 1975 verfügbar |
| Masseur/Physiotherapeut | H für medizinisch-physiotherapeutische Betreuung allgemein | schnellere Regeneration; geringere Ausfalltage | K1–K2 | ab 1975 verfügbar |
| Zeugwart | M; Rolle in der Evidenz nicht einzeln datiert | Ausrüstungszuverlässigkeit, geringe Betriebskosten | K1 | ab 1975 |
| Geschäftsstelle/Verwaltung | H als Bestandteil der zunehmenden Vereinsorganisation | Vertrags- und Terminabwicklung | K2 | ab 1975 |
| Schatzmeister/Finanzverwaltung | M als Spielrolle | Budgetkontrolle, geringeres Zahlungsrisiko | K1–K2 | ab 1975 |
| Jugendtrainer | H in allgemeiner Talententwicklungslogik, aber nicht datiert | Jugendfortschritt und Sichtung | K1–K2 | ab 1975 |
| Platzwart | M | geringeres Platzqualitätsrisiko | K1 | ab 1975 |
| Scout/Talentsichter | H als allgemeiner Bestandteil moderner Kaderplanung | reduziert Unsicherheit bei Spielerwerten | K1–K2 | ab 1975, zunächst geringe Genauigkeit |

### 7.3 1980er: organisatorische Professionalisierung

| Rolle | Evidenz-/Modellstatus | Effekt | Kosten | Verbreitungsmodell |
|---|---|---|---:|---|
| Sportlicher Leiter | H als moderne Management- und Kaderplanungsfunktion; Dekadenfreischaltung M | Verhandlung, Kaderkohärenz, Trainerentlastung | K3 | 1980: selten; 1989: zunehmend |
| Konditionstrainer | H im modernen interdisziplinären Stab; Datum M | Fitnessaufbau, Belastungssteuerung | K2 | schrittweise ab 1980 |
| hauptamtlicher Physiotherapeut | H für moderne Betreuung; Datum M | Reha- und Regenerationsbonus | K2 | ab Mitte der 1980er zunehmend |
| Pressesprecher | H für professionelle Kommunikation allgemein | Medienrisiko und Sponsorenzufriedenheit | K2 | ab 1980 freischalten |
| kaufmännischer Leiter | H für betriebswirtschaftliche Professionalisierung | Kostenkontrolle und Vertragsqualität | K3 | ab 1985 |
| Gegnerbeobachter | M als Vorstufe moderner Analyse | bessere Matchvorbereitung | K1–K2 | gesamte Dekade |

### 7.4 1990er: Transfermarkt, Kommerzialisierung und Spezialisierung

| Rolle | Effekt | Kosten | Fenster/Verbreitung | Status |
|---|---|---:|---|---|
| Sportdirektor | Kaderstrategie, Vertragsplanung, Trainerwahl | K4 | ab 1990 zunehmend | H als moderne Funktion, Termin M |
| Chefscout | koordiniert Beobachternetz und Datenqualität | K3 | ab 1990 | M-Ausgestaltung |
| internationaler Scout | größere Spielerdatenbank, höhere Reise- und Fehlerrisiken | K2 | ab 1995 stärker | M; Bosman-Kontext H |
| Marketing-/Sponsoringmanager | erhöht kommerzielle Erlöse und Sponsorbindung | K3 | ab 1990 zunehmend | H als Professionalisierungsfeld |
| Reha-Trainer | verbessert Rückkehr nach Verletzung | K2 | ab 1995 | H als moderne Brückenfunktion, Datum M |
| Videoanalyst | taktische Mustererkennung, Gegnerberichte | K2 | ab 1995 selten | H für Analysefunktion, Datum M |
| Vertrags-/Rechtsmanager | reduziert Vertragsfehler und Registrierungsrisiko | K2–K3 | ab 1995 | M-Ausgestaltung |
| Stadion-/Eventmanager | Matchday-Organisation und Hospitality | K3 | ab 1995 | M-Ausgestaltung |

### 7.5 2000er: Leistungsdiagnostik und integrierte Betreuung

| Rolle | Effekt | Kosten | Freischaltung | Evidenz |
|---|---|---:|---|---|
| Leistungsdiagnostiker | objektiviert Fitness- und Talentprofile | K3 | 2000–2004 | DFB-Diagnostik seit 2004 belegt |
| Athletiktrainer | individuelle Belastungs- und Kraftsteuerung | K3 | ab 2000 zunehmend | moderne Rolle belegt |
| Sportpsychologe | Druckbewältigung, Aufmerksamkeit, Krisenprävention | K3 | ab 2000 selten, später zunehmend | Entwicklung über etwa zwei Jahrzehnte zur etablierten Hintergrundfunktion |
| Ernährungsberater | belastungsabhängige Ernährungspläne | K2 | ab 2000 | moderne Funktion belegt |
| Nachwuchskoordinator | strukturiert Talentpfad und Diagnostik | K3 | ab 2004 | Talentförderung und Profile belegt |
| Spielanalyst | Video-, Ereignis- und Taktikanalyse | K3 | ab 2000 | moderne Analyseabteilung belegt |
| IT-Administrator | Verfügbarkeit digitaler Systeme | K2 | ab 2000 | M-Ausgestaltung |
| Lizenzmanager | reduziert Verbands- und Infrastrukturverstöße | K2 | spätestens mit differenzierten Lizenzverfahren relevant | Lizenzanforderungen 3. Liga belegt |

### 7.6 2010er: Daten, Social Media und Performance-Abteilungen

| Rolle | Effekt | Kosten | Verbreitung | Status |
|---|---|---:|---|---|
| Datenanalyst | bessere Bewertung von Spielern und taktischen Mustern | K3 | zunehmend | H |
| Dateningenieur | Datenqualität, Schnittstellen und Modellgeschwindigkeit | K4 | zunächst selten | H als spezialisierte moderne Analysefunktion |
| Social-Media-Manager | Faninteraktion, digitale Reichweite, Sponsorwerte | K2–K3 | stark zunehmend | H |
| Head of Performance | integriert Medizin, Reha, Athletik und Diagnostik | K4 | bei ressourcenstarken Clubs | H als moderne Zentralrolle |
| Sportwissenschaftler | Trainingsplanung, Belastungs- und Leistungsmodelle | K3 | zunehmend | H |
| Spezialkoch | Umsetzungsqualität individueller Ernährung | K2 | selektiv | H für moderne Clubs |
| Mental-Health-Beauftragter | Krisenpfad, Prävention, Verweis an Fachbehandlung | K2–K3 | zunächst selten | H für moderne Professionalisierung |
| Compliance-/FFP-Manager | Finanzberichte, Fälligkeiten, Lizenzrisiko | K3 | ab 2010 | FFP-Anforderungen belegt |
| VAR-Koordinator | Schulung, Kommunikations- und Reviewprozesse | K2 | ab 2017/18 in Bundesliga-Clubs | VAR-Einführung belegt |

### 7.7 2020er bis 2030

| Rolle | Effekt | Kosten | Freischaltfenster | Status |
|---|---|---:|---|---|
| Head of Data Analytics | priorisiert Modelle und verbindet Sport/Management | K4–K5 | 2020–2030 zunehmend | H als moderne Rollenklasse |
| Sport Data Engineer | Positions-, Ereignis- und Trainingsdaten integrieren | K4 | 2020–2030 | H |
| Machine-Learning-Spezialist | automatisierte Muster- und Spielertypanalyse | K4–K5 | 2020–2030 selektiv | H für moderne Anwendungen |
| Belastungsmanager | kombiniert Tracking, Medizin und Einsatzplanung | K3–K4 | 2020–2030 | H-gestützte Funktionsklasse |
| Return-to-Play-Koordinator | medizinisch-athletischer Freigabeprozess | K3 | 2020–2030 | H-gestützte Funktionsklasse |
| Fußballpsychologie-Experte | mentale Leistung, Stress- und Krisenarbeit | K3 | ab 2023 stärker standardisiert | DFB-Zertifikatsprogramm 2023 belegt |
| Nachhaltigkeits-/Kostenkontrollmanager | Solvenz-, Stabilitäts- und Kaderkostenprüfung | K3 | ab 2022 | Regulierungsrahmen belegt |
| Fan-Data-/CRM-Manager | Segmentierung und digitale Bindung | K3 | 2020–2030 | M-Ausgestaltung auf Basis digitaler Plattformtrends |
| KI-Scouting-Leiter | kombiniert Scouts, Datenmodelle und Marktwerte | K4 | 2025–2030 | M-Projektion, technische Vorstufen belegt |
| Datenschutz-/Datenethikbeauftragter Sport | kontrolliert Zugriffe und Modellnutzung | K3 | 2025–2030 | M-Projektion |
| Multiplattform-Content-Leiter | globale Distribution, Sponsorintegration | K4 | 2020–2030 | M-Ausgestaltung auf Basis moderner Medienrollen |

### 7.8 Rollenwirkungen ohne garantierten Erfolg

Einheitliche Effektformel:

```text
effective_department_quality =
    role_skill
  × availability
  × integration_factor
  × data_quality
  × budget_factor
```

Beispiel Verletzungsprävention:

```text
injury_risk =
    base_injury_risk
  × workload_factor
  × schedule_density
  × psychological_risk
  × prevention_multiplier
```

Psychologische Faktoren wie Stress, Angst, Perfektionismus und Schlafqualität können das Verletzungsrisiko beeinflussen. Teamunterschiede bei Verletzungslast sprechen zudem gegen einen pauschalen, für alle Clubs identischen Wert.

Empfohlene Modellgrenzen:

- Medizinische Gesamtwirkung maximal `−20 %` Verletzungshäufigkeit.
- Reha-Gesamtwirkung maximal `−25 %` Ausfallzeit.
- Psychologie maximal `−10 %` Formschwankung und `−8 %` stressbezogenes Verletzungsrisiko.
- Datenanalyse maximal `+15 %` Scoutinggenauigkeit.
- Ernährungsabteilung maximal `+8 %` Regenerationsqualität.
- Social Media maximal `+20 %` digitales Reichweitenwachstum, aber kein direkter Siegbonus.

Die Prozentwerte sind M-Parameter. Sie dienen dem Balancing und sind keine medizinischen Effektgrößen.

---

## 8. Kompakte Umsetzungsmatrix

### 8.1 Kerndatenobjekte

| Objekt | Pflichtfelder | Zentrale Flags |
|---|---|---|
| `competition` | `competition_id`, `name`, `country_system`, `tier` | `professional`, `regionalized` |
| `competition_season` | `season_id`, `team_count`, `group_count`, `rounds` | `historical_verified`, `roster_complete` |
| `club_season` | `club_id`, `season_id`, `competition_id`, `group_id` | `license_passed`, `reserve_team` |
| `table_rule` | Punkte, Tiebreak-Folge | `three_points_active` |
| `movement_rule` | direkte Auf-/Abstiegsplätze | `playoff_active`, `license_override` |
| `match_rule` | Wechsel, Torwart, Nachspielzeit | `backpass_active`, `var_active`, `glt_active` |
| `registration_rule` | Kader- und Spielerquoten | `eu_exempt`, `foreign_limit_active` |
| `finance_rule` | Prüfperiode, Kosten- und Solvenztests | `ffp_active`, `sustainability_active` |
| `ownership_rule` | Kontroll- und Stimmrechtsparameter | `member_control_required` |
| `kit_rule` | Werbung, Namen, Nummern | `sponsor_allowed`, `name_required` |
| `calendar_rule` | Saisonbeginn/-ende, Pausen | `winter_break_active` |
| `league_reform` | Alt-/Neu-Struktur, Wirksamkeit | `migration_required` |
| `club_identity` | dauerhafte ID, historische Namen | `successor`, `renamed` |
| `staff_role` | Rolle, Abteilung, Kostenklasse | `historical`, `model_only` |
| `economy_anchor` | Jahr, Wert, Währung, Umfang | `observed`, `estimated`, `projected` |
| `economy_shock` | Wahrscheinlichkeit, Wirkung, Dauer | `systemic`, `club_specific` |

### 8.2 Mindestflags nach Saison

| Flag | 1975/76 | 1981/82 | 1991/92 | 1995/96 | 2008/09 | 2015/16 | 2017/18 | 2019/20 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `second_division_groups` | 2 | 1 | Übergang/24 Clubs | 1 | 1 | 1 | 1 | 1 |
| `points_win` | 2 | 2 | 2 | 3 | 3 | 3 | 3 | 3 |
| `backpass_active` | 0 | 0 | 0 | 1 | 1 | 1 | 1 | 1 |
| `bundesliga_team_count` | 18 | U | 20 | U | U | U | U | U |
| `third_league_active` | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 1 |
| `goal_line_technology_bl` | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 |
| `var_bundesliga` | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| `var_second_bundesliga` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `ffp_framework` | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 |

`U` bedeutet, dass der Wert im vorliegenden Material nicht für die betreffende Saison belegt ist; es ist kein Nullwert.

### 8.3 Quellen- und Statusfelder

```text
evidence_status:
  H = historical_observed
  A = derived
  M = gameplay_model
  U = unresolved

source_keys:
  ["ref9", "ref14"]

uncertainty_note:
  free_text

future_status:
  historical
  announced
  projected
  fictional
```

### 8.4 Validierungsregeln

1. Ein `H`-Datensatz benötigt mindestens einen `source_key`.
2. Ein `M`-Datensatz darf keinen Quellenbeleg als Beweis für seinen Zahlenwert ausgeben.
3. Ein `announced`-Ereignis wird nicht automatisch zu `historical`.
4. Teilnehmerzahl und importierte Clubzahl müssen übereinstimmen.
5. Namensänderungen erzeugen keinen neuen Club ohne explizite Nachfolgebeziehung.
6. Punktregeln werden niemals rückwirkend auf archivierte Tabellen angewandt.
7. Reformen müssen nach sportlicher Qualifikation und vor Spielplangenerierung laufen.
8. Währungsumstellung und Ligareform sind getrennte Migrationen.
9. Umsatzwerte mit unterschiedlichem Umfang — Bundesliga allein gegenüber 36 Clubs — dürfen nicht ungekennzeichnet interpoliert werden.
10. Unbekannte historische Wechsel-, Ausländer-, Winterpausen- oder 50+1-Parameter dürfen im strikten Modus den Saisonstart blockieren.

## 9. Evidenz- und Modellgrenzen

Die belastbarsten Bereiche dieses Dossiers sind die Einführung der Rückpassregel 1992, die Drei-Punkte-Regel 1995/96, die technischen Einführungstermine von Torlinientechnik und VAR, die moderne FFP-Chronologie, die Grundstruktur 1975/76, die Reformen 1981, 1994 und 2008 sowie die acht namentlich belegten ostdeutschen Profizuweisungen für 1991/92.

Wesentliche Grenzen:

- Die Evidenz enthält keine vollständigen Teilnehmerlisten der 2. Bundesliga Nord und Süd 1975/76. Die belegten Teilmengen dürfen nicht als vollständige Ligen ausgeliefert werden.
- Die genaue Zahl und Behandlung von Auswechslungen, insbesondere von Torwartwechseln, ist für die historischen Epochen nicht belegt.
- Zur Ausländerregel liegt keine belastbare saisonweise Parameterreihe vor.
- Das Bosman-Urteil ist als Liberalisierungspunkt belegt, seine konkrete Umsetzung in Ablöse-, Vertrags- und Registrierungscode aber nicht ausreichend spezifiziert.
- Für 50+1 fehlt eine belastbare Einführungs- und Ausnahmenchronologie.
- Einführung und historische Darstellung von Spielernamen auf Trikots sind nicht datiert; heutige DFL-Maße dürfen nicht rückwirkend verwendet werden.
- Winterpause und Nachspielzeit sind nicht mit hinreichenden Saisonparametern belegt.
- Die historischen Umsatzstützwerte vor den modernen DFL-Berichten sind Modellwerte. Öffentliche Medienreihen reichen in der vorliegenden Evidenz nicht bis 1975 zurück.
- Der Wert von rund 1,7 Mrd. € um 2014 betrifft die Bundesliga, moderne Rekordwerte dagegen beide Profiligen; die Umfänge sind getrennt zu halten.
- Alle Werte für 2030 und danach sind Modellprojektionen. Sie beschreiben mögliche Spielpfade und keine vorhergesagte Realität.
- Die vorgeschlagenen Mitarbeiterfreischaltungen, Kostenklassen und prozentualen Effekte sind Balancingentscheidungen. Historisch gestützt ist die allgemeine Spezialisierung, nicht ihre exakte Dekadenverteilung.
- Sekundärquellen stützen mehrere historische Tabellen- und Strukturangaben. Für einen archivfesten Produktionsdatensatz sollten offene Clublisten, Wechselregeln, Aufstiegsordnungen und Registrierungsregeln durch zeitgenössische Verbandsordnungen oder vollständige offizielle Saisonarchive ergänzt werden.

---

## Sources

1. <https://mobileapi.theifab.com/history/laws>
2. <https://www.theifab.com/documents/?documentType=laws-of-the-game&language=en&years=all>
3. <https://www.dfb.de/news/detail/50-jahre-bundesliga-spielzeit-19951996-35559/>
4. <https://de.wikipedia.org/wiki/2._Fu%C3%9Fball-Bundesliga_1975/76>
5. <https://dewiki.de/Lexikon/2._Fu%C3%9Fball-Bundesliga_1975/76>
6. <https://de.wikipedia.org/wiki/Fu%C3%9Fball-Bundesliga_1975/76>
7. <https://www.rsssf.org/tablesd/duit2champ.html>
8. <https://www.dfl.de/de/aktuelles/50-jahre-sportsponsoring/>
9. <https://magazin.dfl.de/html5/CkiTJdACjH/3IQKqOcOZRgk7/article/5b3ea18b7f6d4d84afaee70d78eb08eb>
10. <https://dfl.de/de/hintergrund/relegation/einmal-sogar-elfmeterschiessen-die-historie>
11. <https://dfl.de/de/aktuelles/informationen-zum-saisonfinale-2025-26-der-bundesliga-und-2-bundesliga>
12. <https://en.wikipedia.org/wiki/DDR-Liga>
13. <https://dewiki.de/Lexikon/DDR-Liga>
14. <https://www.fcc-supporters.org/wiki/NOFV-Oberliga>
15. <https://de.wikipedia.org/wiki/DDR-Fu%C3%9Fball-Oberliga_1990/91>
16. <https://www.dfb.de/news/detail/saison-19911992-wiedervereinte-bundesliga-spannend-bis-zum-ende-254145>
17. <https://datencenter.dfb.de/competitions/2-bundesliga/seasons/1991-1992-nord-abstieg/teams/vfl-osnabrueck>
18. <https://datencenter.dfb.de/2-bundesliga/1991-1992-nord-abstieg/mannschaft/eintracht-braunschweig>
19. <https://datencenter.dfb.de/competitions/2-bundesliga/seasons/1991-1992-nord-aufstieg/teams/vfb-oldenburg>
20. <https://www.nofv-online.de/index.php/ueber-nofv.html>
21. <https://www.nofv-online.de/index.php/oberliga-nord.html>
22. <https://de.wikipedia.org/wiki/Fußball-Oberliga_Nordost_1991/92>
23. <https://downloads.theifab.com/downloads/laws-of-the-game-1992-93?l=en>
24. <https://www.uefa.com/uefachampionsleague/history/>
25. <https://www.dfb.de/news/detail/meister-in-den-playoffs-die-geschichte-der-aufstiegsspiele-146842/full/1/>
26. <https://www.bpb.de/themen/sport/bundesliga/160779/der-lange-weg-zum-profi/>
27. <https://www.grin.com/document/61371>
28. <https://www.diplomarbeiten24.de/document/308869>
29. <https://datencenter.dfb.de/competitions/bundesliga/seasons/1995-1996/matchday?datacenter_name=datencenter>
30. <https://www.grin.com/document/889002>
31. <https://assets.dfb.de/public/uploads/f10eecf7d57b95211501a72643b12d6166a13d2fa04163d7444a5189e959>
32. <https://www.dfb.de/fileadmin/_dfbdam/11112-OM-09-2006.pdf>
33. <https://www.uefa.com/news-media/news/0253-0d7f34cc6783-5ebf120a4764-1000--financial-fair-play-all-you-need-to-know/>
34. <https://www.uefa.com/news-media/news/01e5-0ea1848137bd-b1291315b87e-1000--financial-fair-play-regulations-are-approved/>
35. <https://www.bundesliga.com/en/faq/10-things-on-the-bundesliga>
36. <https://www.bundesliga.com/en/2bundesliga/news/bundesliga-2-ready-to-implement-goal-line-technology-in-2024-25-25634>
37. <https://www.bundesliga.com/en/bundesliga/news/bizarre-ghost-goals-bayern-munich-bayer-leverkusen-kiessling-24771>
38. <https://www.bundesliga.com/de/faq/wie-sehen-die-fussball-regeln-aus/der-var-im-fussball-was-er-kann-und-was-er-darf-22362>
39. <https://www.bundesliga.com/en/faq/what-are-the-rules-and-regulations-of-soccer/var-what-is-video-assistant-referee-and-how-does-it-work-10566>
40. <https://www.bundesliga.com/de/bundesliga/news/der-var-im-fussball-was-er-kann-und-was-er-darf-22362>
41. <https://www.bundesliga.com/de/bundesliga/news/video-assistent-schiedsrichter-zusammenarbeit-transparenz-entscheidungen-2903>
42. <https://www.uefa.com/running-competitions/integrity/financial-sustainability/>
43. <https://media.dfl.de/sites/2/2018/11/anhang-IV-zur-LO-2018-07-01.pdf>
44. <https://media.dfl.de/sites/2/2020/09/Anhang-IV-zur-LO-2020-09-04-Stand.pdf>
45. <https://www.bundesliga.com/en/bundesliga/news/var-decision-centre-to-move-from-cologne-to-dfb-campus-frankfurt-31127>
46. <https://epub.uni-bayreuth.de/7446/1/Brandt%20Social%20anthropology%20of%20football%20fan%20culture-Ver%C3%B6ffentlichungsversion.pdf>
47. <https://www.statista.com/statistics/370614/bundesliga-tv-broadcasting-rights/>
48. <https://ediss.sub.uni-hamburg.de/bitstream/ediss/5873/1/Dissertation.pdf>
49. <https://media.dfl.de/sites/2/2024/03/3XMcqMwrz_DFL_Wirtschaftsreport_2024_DE.pdf>
50. <https://media.dfl.de/sites/2/2023/04/DE_DFL_Wirtschaftsreport_2023_M.pdf>
51. <https://report.dfl.de/2324/de/_assets/downloads/entire-dfl-er24.pdf>
52. <https://report.dfl.de/2425/de/_assets/downloads/entire-dfl-er25.pdf>
53. <https://report.dfl.de/2425/de/_assets/downloads/rep-german-licensed-football-dfl-er25.pdf>
54. <https://www.dfl.de/de/aktuelles/dfl-steigert-nationale-medienerloese-ab-2025-26-auf-1121-milliarden-euro-pro-saison/>
55. <https://www.statista.com/statistics/282825/percentage-segmentation-german-bundesliga-revenue/>
56. <https://www.statista.com/statistics/282611/revenue-german-bundesliga-soccer/>
57. <https://diskussionspapiere.wiwi.uni-hannover.de/pdf_bib/dp-345.pdf>
58. <https://epub.uni-bayreuth.de/5957/1/spektrum-2021-2-sport-EN.pdf>
59. <https://repo.uni-hannover.de/bitstreams/fb76d5f7-843f-431b-b93e-a277b1fb982f/download>
60. <https://www.deloitte.com/de/de/Industries/tmt/perspectives/football-money-league.html>
61. <https://www.deloitte.com/de/de/about/press-room/Neue-Umsatzrekorde-im-Weltfussball.html>
62. <https://www.deloitte.com/uk/en/services/consulting-financial/analysis/deloitte-football-money-league.html>
63. <https://mpra.ub.uni-muenchen.de/128742/2/MPRA_paper_128742.pdf>
64. <https://www.deloitte.com/de/de/Industries/tmt/research/annual-review-of-football-finance.html>
65. <https://schweissperlen.wordpress.com/2019/01/28/sammelalbum-alle-vereine-der-2-bundesliga-nord-von-1974-bis-1981/>
66. <https://datencenter.dfb.de/datencenter/bundesliga/1975-1976/15>
67. <https://en.wikipedia.org/wiki/1975%E2%80%9376_Bundesliga>
68. <https://www.rsssf.org/tablesd/duitchamp.html>
69. <https://www.rsssf.org/tablesd/duit76.html>
70. <https://en.wikipedia.org/wiki/1975%E2%80%9376_Oberliga>
71. <https://de.wikipedia.org/wiki/Fu%C3%9Fball-Oberliga_1975/76>
72. <https://de.wikipedia.org/wiki/1._Amateurliga_Bayern_1976/77>
73. <https://de.wikipedia.org/wiki/Fu%C3%9Fball-Oberliga_Berlin_1975/76>
74. <https://www.fussball-ddr.de/oberliga/>
75. <https://www.ddr-fussball.net/ddr-oberliga/>
76. <https://nordostfussball.de/diskussionen/thread/23318-die-ligenstruktur-der-ddr/>
77. <https://de.wikipedia.org/wiki/DDR-Fu%C3%9Fball-Liga_1980/81>
78. <https://www.fussball-ddr.de/ddr-liga/ddr-liga-1980-1981/>
79. <https://www.fussball-ddr.de/oberliga/oberliga-1980-1981/>
80. <https://vereins.fandom.com/wiki/DDR-Oberliga>
81. <https://www.bundesliga.com/de/2bundesliga/news/sg-dynamo-dresden-1-fc-magdeburg-elb-clasico-ddr-klassiker-fehlstart-33370>
82. <https://www.bundesliga.com/en/bundesliga/news/dynamo-dresden-club-by-club-historical-guide-24217>
83. <https://www.bundesliga.com/en/bundesliga/news/longest-serving-coaches-german-football-low-schmidt-finke-streich-24768>
84. <https://www.ddr-fussball.net/ddr-oberliga/ewige-tabelle/>
85. <https://www.rsssf.org/tablesd/ddr76.html>
86. <https://fussballkarte-deutschland.de/content/31>
87. <https://footballinsights.wordpress.com/2009/08/22/clubs-of-the-former-east-germany/>
88. <https://www.transfermarkt.us/nofv-oberliga-staffel-nord-91-94-/startseite/wettbewerb/OBSN/saison_id/1991>
89. <https://www.dfb.de/datencenter/aufstiegsrunde-2-bundesliga/1991-1992/mannschaft/vfl-wolfsburg>
90. <https://www.dfb.de/maenner/nationalmannschaften/nationalmannschaft/team-hinter-dem-team>
91. <https://www.bisp-surf.de/Record/PU202104003264>
92. <https://www.dfb-akademie.de/management-im-profifussball/-/id-11009596>
93. <https://serwiss.bib.hs-hannover.de/frontdoor/index/index/docId/284>
94. <http://archiv.ub.uni-heidelberg.de/volltextserver/5497/1/Dissertation.pdf>
95. <https://www.vfl-bochum.de/aktuelles/2026/06/medizinische-abteilung-des-vfl-stellt-sich-neu-auf/>
96. <https://www.herthabsc.com/de/nachrichten/2022/06/funktionsteam-2223>
97. <https://www.fham.de/studiengaenge/bachelor/fussballmanagement/>
98. <https://www.sport.tu-darmstadt.de/media/institut_fuer_sportwissenschaften_1/dvs_konferenz_sportsoziologie_2024/Abstractband_Jahrestagung_dvs-Sektion_Sportsoziologie_Darmstadt_2024.pdf>
99. <https://www.dfb.de/news/hermann-du-musst-ansprechbar-sein-wenn-es-brennt>
100. <https://www.studienundberufsberatung.de/studium-job-der-woche/sportpsychologie-untersttzung-im-profigeschft-der-fuball-bundesliga>
101. <https://www.einstieg.com/story/news/berufe-in-der-bundesliga-diese-jobs-sind-im-profi-fussball-gefragt.html>
102. <https://www.dfb.de/news/detail/erfolgreiche-aera-geht-zu-ende-joti-chatzialexiou-verlaesst-den-dfb-257754>
103. <https://www.futbollab.com/de/Nachrichten/interne-struktur-und-organisation-von-analyseabteilungen-in-clubs>
104. <https://uni-tuebingen.de/fakultaeten/wirtschafts-und-sozialwissenschaftliche-fakultaet/faecher/fachbereich-sozialwissenschaften/sportwissenschaft/institut/arbeitsbereiche/sportpsychologie-und-methodenlehre/forschung/datengetriebene-analyse-zur-objektiven-quantifizierung-und-analyse-taktischer-handlungen-im-fussball/>
105. <https://esentri.com/tech/data-science-fussball-bundesliga/>
106. <https://www.grin.com/document/351902?lang=de>
107. <https://publikationen.uni-tuebingen.de/xmlui/bitstream/handle/10900/44141/pdf/NACHSPIELZEIT_2013_2.pdf?sequence=1&isAllowed=y>
108. <https://www.ifss.kit.edu/nachwuchsgruppe-leistungsdiagnostik-und-fussballforschung.php>
109. <https://www.dshs-koeln.de/universitaet/organisation/institute-einrichtungen/institut-fuer-trainingswissenschaft-und-sportinformatik/abt-sportinformatik-und-sportspielforschung>
110. <https://www.dfb.de/news/detail/fussball-ein-kopf-spiel-261238>
111. <https://assets.dfb.de/uploads/000/222/954/original_psyGA_Sport_140411_K.pdf?0=>
112. <https://www.international-football-institute.com/aus-und-weiterbildung/zertifikate/spielanalyst-im-professionellen-fussball/>
113. <https://pubmed.ncbi.nlm.nih.gov/31324965/>
114. <https://pubmed.ncbi.nlm.nih.gov/36157961/>
115. <https://pubmed.ncbi.nlm.nih.gov/42006993/>
116. <https://pubmed.ncbi.nlm.nih.gov/42303655/>
117. <https://pubmed.ncbi.nlm.nih.gov/26168148/>

# Ligastruktur im Ausland (Ligagrößen, Auf-/Abstieg je Saison)

Grundlage im Spiel: `src/data/world/structure.ts` – abgeleitet aus den Weltdaten
(`src/data/world/seasons/<cc>.ts`), keine Handarbeit je Land. Größe = Länge von t1 bzw.
t2 + t2b; Absteiger = Erstligisten der Vorsaison, die fehlen; Aufsteiger = Absteiger +
Größenänderung; Absteiger 2. Ebene → Unterbau nur, wenn beide Saisons eine 2. Liga haben.
Ungerade Größen werden auf gerade abgerundet (Spielplan).

Übersicht aller Länder: `node scripts/run-ts.mjs tests/world-structure-checks.ts` (Teil 1
prüft Stichproben, Teil 2 die Hintergrund-Welt über 50 Saisons).

## Stichproben (Daten = Geschichte)

| Land | Wechsel | Daten / Spiel | Geschichte |
|---|---|---|---|
| England | 1986/87 → 1987/88 → 1988/89 | 22 → 21 → 20 (Spiel 22 → 20 → 20), 2 auf / 3 ab, dann 3 auf / 4 ab | First Division 1987/88 mit 21 Vereinen, 1988/89 mit 20 |
| England | 1990/91 → 1991/92 | 20 → 22, 4 auf / 2 ab | Aufstockung auf 22 |
| England | 1994/95 → 1995/96 | 22 → 20, 2 auf / 4 ab | Premier League auf 20 verkleinert, vier Absteiger |
| England 2. Ebene | ab 1988/89 | 24 | Second Division/First Division/Championship 24 |
| Italien | 1987/88 → 1988/89 | 16 → 18, 4 auf / 2 ab | Serie A auf 18 |
| Italien | 2003/04 → 2004/05 | 18 → 20, 6 auf / 4 ab | Serie A auf 20 (Sonderfall mit Zusatzaufsteiger) |
| Spanien | 1986/87 → 1987/88 | 18 → 20, 3 auf / 1 ab | Primera División auf 20 |
| Spanien | 1994/95 → 1995/96 | 20 → 22, 3 auf / 1 ab | 22 Vereine 1995/96 und 1996/97 |
| Spanien | 1996/97 → 1997/98 | 22 → 20, 3 auf / 5 ab | zurück auf 20 |
| Frankreich 2. Ebene | bis 1992/93 → 1993/94 | 18 + 18 → 22 | Division 2 bis 1992/93 zwei Gruppen, ab 1993/94 eingleisig |
| Frankreich | 1996/97 → 1997/98, 2001/02 → 2002/03, 2022/23 → 2023/24 | 20 → 18 → 20 → 18 | Division 1/Ligue 1 18 (1997–2002), 20, 18 ab 2023/24 |
| Niederlande | 2019/20 → 2020/21 | 0 auf / 0 ab | Saison 2019/20 abgebrochen, kein Abstieg |
| Portugal | 1986/87 → 1987/88 → … | 16 → 20 → 20 → 18 → 20 → 18 | Primeira Divisão 1987/88 und 1988/89 20, 1989/90 18, 1990/91 20, ab 1991/92 18 |
| Portugal 2. Ebene | 1988/89–1989/90 | 18 + 36 (drei Zonen) | Segunda Divisão in Zonen Norte/Centro/Sul; ab 1990/91 Divisão de Honra (20) |
| Deutschland 2. Ebene | 1993/94 → 1994/95 | 20 → 18, 5 ab in den Unterbau, 3 auf | 2. Bundesliga ab 1994/95 mit 18 Vereinen |

Prüfung: Abgleich der Werte aus den Weltdaten mit den unten genannten Wikipedia-Artikeln
(Saisonartikel der jeweiligen Ligen). Abrufe der Artikelinhalte waren in dieser Sitzung nicht
freigegeben; die Zahlen wurden gegen die Saisonartikel (Titel/Fundstellen der Suche) und
bekannte Ligageschichte geprüft – bei Zweifeln die Artikel öffnen.

## Quellen

- England: https://en.wikipedia.org/wiki/1994%E2%80%9395_FA_Premier_League,
  https://en.wikipedia.org/wiki/1994%E2%80%9395_in_English_football
- Italien: https://www.wikipedia.org/wiki/Serie_A (Abschnitt Geschichte/Format),
  https://footballhistory.org/league/serie-a.html
- Spanien: https://en.wikipedia.org/wiki/1995%E2%80%9396_La_Liga,
  https://en.wikipedia.org/wiki/1996%E2%80%9397_La_Liga,
  https://en.wikipedia.org/wiki/1997%E2%80%9398_Segunda_Divisi%C3%B3n
- Frankreich: https://en.wikipedia.org/wiki/1992%E2%80%9393_French_Division_2,
  https://rsssf.org/tablesf/fran2hist.html
- Portugal: https://en.wikipedia.org/wiki/1987%E2%80%9388_Primeira_Divis%C3%A3o,
  https://en.wikipedia.org/wiki/1990%E2%80%9391_Primeira_Divis%C3%A3o
- Niederlande: https://en.wikipedia.org/wiki/1992%E2%80%9393_Eerste_Divisie,
  https://www.wikipedia.com/wiki/Eerste_Divisie
- Deutschland: https://en.wikipedia.org/wiki/1994%E2%80%9395_Regionalliga,
  https://www.wikipedia.org/wiki/1994%E2%80%9395_2._Bundesliga

## Mehrere Staffeln der 2. Ebene (alle simuliert)

Länder/Saisons mit mehreren Staffeln in den Weltdaten (`t2` + `t2b`, `rowGroups` in
`src/data/world/secondGroups.ts`):

| Land | Saisons | Staffeln | Quelle |
|---|---|---|---|
| Frankreich | 1975/76–1992/93 | 2 × 18 (Groupe A Nord/West, Groupe B Süd/Ost) | https://en.wikipedia.org/wiki/1992%E2%80%9393_French_Division_2 (zwei Gruppen à 18, 1993/94 eingleisig), https://rsssf.org/tablesf/fran2hist.html |
| Portugal | 1976/77, 1980/81–1982/83 (dazwischen Datenlücken), 1988/89–1989/90 | 3 × 16, ab 1988/89 3 × 18 (Zona Norte/Centro/Sul) | https://en.wikipedia.org/wiki/1976%E2%80%9377_Segunda_Divis%C3%A3o (drei Zonen à 16, Zonensieger steigen auf), https://en.wikipedia.org/wiki/1988%E2%80%9389_Segunda_Divis%C3%A3o (drei Zonen à 18, drei Aufsteiger) |
| Deutschland (nur im Hintergrund) | 1975/76–1980/81, 1991/92 | 2 × 20 (1980/81 22 + 20), 1991/92 2 × 12 | bekannt (2. Bundesliga Nord/Süd) |

Im Spiel: jede Staffel eine eigene Liga (Hintergrund `engine/worldSecond.ts`, Heimatland
`game/homeStructure.ts`); Staffelsieger steigen auf, weitere Aufsteiger = Zweite (stärkste zuerst);
Absteiger in den Unterbau reihum vom Tabellenende jeder Staffel (Zahl aus den Daten);
Zuordnung zu einer Staffel: bisherige Staffel → Zone laut Weltdaten → Zone der Stadt → meiste freie
Plätze. Portugal-Lücken 1977–79 und 1983–87 (keine 2. Liga in den Daten): drei Zonen bleiben
bestehen; Start in einer Lücke übernimmt die Zonen der nächstgelegenen Saison (`gapGroups`).

## Vereinfachungen

- Ungerade Größen → gerade abgerundet (England 1987/88 20 statt 21, Belgien 1975/76 18 statt 19,
  Türkei 2020/21 20 statt 21, UdSSR 1990 12 statt 13).
- Mehrere Staffeln: keine Aufstiegsrunde/Relegation – bei weniger Aufsteigern als Staffeln steigen die
  stärksten Staffelsieger auf, zusätzliche Plätze bekommen die stärksten Zweiten (Frankreich:
  historisch Barrage der Zweiten). Staffelnamen vereinfacht Nord/Süd bzw. Nord/Mitte/Süd.
- Ist die Staffel der Region voll (viele Absteiger aus einer Region), rückt ein Verein in die Staffel
  mit den meisten freien Plätzen.
- Länder ohne 2. Liga in den Daten: Größe der 2. Liga bleibt wie bisher; Auf-/Abstieg zur 1. Liga
  trotzdem aus den Daten (Neulinge/Abgänge der 1. Liga).
- Nach 2025: letzte Größe, Auf-/Abstieg wie im letzten Saisonwechsel ohne Größenänderung.
- Datenfehler (Umbenennungen mit neuer ID, Fusionen) zählen als Ab- und Aufsteiger.

## 3. und 4. Ebene (Wunsch Pascal: Auslandsligen tiefer simulieren und spielbar)

Tiefe nach dem Rang in der Länderwertung (Ligaruf, `data/leagueReputation.ts` – grob aus der
UEFA-Fünfjahreswertung je Jahrzehnt; mit Option „Entwicklung der Ligen“ der Ruf im Spiel):
Rang 1–5 bis Ebene 4, Rang 6–7 bis Ebene 3, sonst Ebene 1/2. Beim Start so, wie ein 1975 begonnenes
Spiel bis dahin hätte (alle fünf Jahre geprüft), danach alle fünf Jahre mit Puffer (4. Ebene fällt erst
ab Rang 8 weg, 3. Ebene ab Rang 10) – Grund: England fiel durch den Europapokal-Ausschluss 1985–90 bis
1995 auf Rang 6/7, behält aber seine Football League. Code `data/world/deepStructure.ts`,
Hintergrund `engine/worldDeep.ts`, Heimatland `game/homeDeep.ts`.

Struktur je Saison (Namen, Staffeln, Größen) in `data/leagueTiers.ts`. Quellen (abgerufen 11/2026):

- England, Spanien, Italien, Frankreich, Deutschland: siehe Kopf von `data/leagueTiers.ts`
  (en.wikipedia.org English_Football_League, Segunda_División_B, Tercera_División, Serie_C1,
  Serie_C2, Serie_D, French_Division_3/4, Championnat_National, Oberliga_(football)).
- Niederlande: en.wikipedia.org/wiki/Vierde_Divisie (Hoofdklasse ab 1974 höchste Amateurklasse, erst
  nur Sonntag – 42 Vereine in drei Staffeln –, Samstag ab 1996; 2010 Topklasse darüber, 2016 Tweede
  Divisie + Derde Divisie), en.wikipedia.org/wiki/Derde_Divisie,
  en.wikipedia.org/wiki/Dutch_football_league_system. Eerste Divisie ↔ Amateure bis 2009/10 praktisch
  geschlossen: die Weltdaten zeigen kaum Absteiger, entsprechend wenig Tausch.
- Belgien: en.wikipedia.org/wiki/Belgian_National_Division_1 (2016 Eerste Amateurklasse als 3. Ebene,
  2020 Nationale 1, 2022/23 20, 2023/24 18, ab 2024/25 in Flandern 16 + Wallonien 12 geteilt),
  en.wikipedia.org/wiki/Belgian_football_league_system; davor Derde Klasse 2 × 16, Bevordering 4 × 16.
- Portugal: en.wikipedia.org/wiki/Portuguese_Second_Division (bis 1989/90 2. Ebene in Zonen, 1990–2013
  3. Ebene, 2012/13 drei Zonen × 16, 2013 Verschmelzung mit der Terceira Divisão),
  en.wikipedia.org/wiki/Portuguese_football_league_system (Liga 3 2 × 10, Campeonato de Portugal 4 × 14).
- Sowjetunion/Russland: Vtoraya Liga in Zonen, Russland 1998–2010 Vtoroi Divizion, 2011–22 PFL, ab
  2023 Vtoraya Liga A/B (en.wikipedia.org/wiki/Russian_Second_League); Staffelgrößen gerundet.

Vereinfachungen:

- Höchstens vier Staffeln je Ebene (Spanien Tercera 17–18, Serie D 9, Frankreich Division 4 8 Staffeln);
  regional verschiedene Größen = 16 Mannschaften, ungerade Größen gerade abgerundet.
- Vereine: echte Daten nur für Ebene 1/2. Darunter zuerst die übrigen Vereine des Landes aus den
  Weltdaten (Unterbau), dann erfundene Vereine aus Städten des Landes (`data/world/deepTowns.ts`),
  bei zwei Vereinen einer Stadt mit Farbe.
- Auf-/Abstieg ohne Aufstiegsrunden: Staffelsieger zuerst, dann Zweite (stärkste zuerst); Absteiger
  je Grenze ⌊Größe / 6⌉ (mindestens eine je Staffel darunter, England 3. → 4. Ebene: 4), unterste Ebene
  ↔ Unterbau 2 je Staffel; 2. ↔ 3. Ebene in der historischen Zahl der 2. Ebene.
- Keine Kader (keine Weltspieler) für Ebene 3/4: keine Einzelstatistik, keine Transfers dieser Vereine;
  Ergebnisse der Ebenen 3/4 nur für die letzten drei Saisons gespeichert (`WORLD_DEEP_KEEP`).
- Heimatland: Staffelzahl der Ebenen 3/4 bleibt wie beim Start; Größe je Staffel und Name folgen der
  Saison, wenn die Staffelzahl gleich ist.

Speicherbedarf (Spielstand Deutschland 1995, JSON / lz-string komprimiert wie im Speicher):
neues Spiel vorher 6 028 KB / 1 441 KB, nachher 6 192 KB / 1 483 KB (+2,9 %); nach drei Saisons
(Herbst 1998) vorher 12 082 KB / 3 158 KB, nachher 12 415 KB / 3 273 KB (+3,6 %) – rund 520 zusätzliche
Auslandsvereine ohne Kader plus Ergebnisse der Ebenen 3/4 für drei Saisons.

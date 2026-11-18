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

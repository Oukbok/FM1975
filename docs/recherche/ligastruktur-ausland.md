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

## Vereinfachungen

- Ungerade Größen → gerade abgerundet (England 1987/88 20 statt 21, Belgien 1975/76 18 statt 19,
  Türkei 2020/21 20 statt 21, UdSSR 1990 12 statt 13).
- Hintergrund-Welt: 2. Ebene immer eingleisig; bei mehreren Staffeln eine Liga in Staffelgröße mit den
  Besten aller Staffeln (im Wechsel), die übrigen im Unterbau. Absteiger in den Unterbau dann
  nicht aus den Daten (2).
- Heimatland: zwei Staffeln (Nord/Süd) möglich; Zusammenlegen zu einer Liga ja (Frankreich 1993/94),
  Aufteilen in mehr Staffeln nein (Portugal 1988/89 drei Zonen) – dann bleiben die Größen.
- Länder ohne 2. Liga in den Daten: Größe der 2. Liga bleibt wie bisher; Auf-/Abstieg zur 1. Liga
  trotzdem aus den Daten (Neulinge/Abgänge der 1. Liga).
- Nach 2025: letzte Größe, Auf-/Abstieg wie im letzten Saisonwechsel ohne Größenänderung.
- Datenfehler (Umbenennungen mit neuer ID, Fusionen) zählen als Ab- und Aufsteiger.

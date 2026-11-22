# Weltrangliste der Nationalmannschaften (Elo-Verfahren)

Wunsch Pascal: eine Weltrangliste aller Nationen, historisch plausibel zum Start und danach nur aus den Länderspielen fortgeschrieben, die das Spiel selbst ausspielt. Umsetzung `src/game/national/ranking.ts`, Stützwerte `src/data/eloAnchors.ts`, Test `npm run test:ranking`.

## Vorbild: World Football Elo Ratings

Die bekannteste rückwirkende Weltrangliste rechnet seit 1872 jedes Länderspiel nach dem Schach-Verfahren von Arpad Elo, angepasst an den Fußball. Anders als die FIFA-Liste (erst ab 1992/93) gibt es sie für jedes Jahr seit Spielbeginn 1975 – sie eignet sich deshalb als Maßstab.

**Rechnung je Spiel** (eigene Worte, Werte wie bei der Vorlage):

- Neue Punkte = alte Punkte + K · G · (W − We).
- **W** = Ergebnis: Sieg 1, Remis 0,5, Niederlage 0. Ein Sieg nach Verlängerung zählt als Sieg, ein Elfmeterschießen als Remis.
- **We** = erwartetes Ergebnis = 1 / (10^(−dr/400) + 1); dr = Punktedifferenz, die Heimmannschaft bekommt dafür **+100**. Bei dr = 130 erwartet man 0,679.
- **K** = Gewicht der Spielart: WM-Endrunde 60 · Kontinentalmeisterschaft (EM, Copa, Afrika-Cup …) 50 · Qualifikation zu WM/Kontinentalturnier und große Turniere 40 · andere Turniere 30 · Freundschaftsspiele 20.
- **G** = Zuschlag nach Tordifferenz: bis ein Tor 1, zwei Tore 1,5, ab drei Toren (11 + N) / 8 (3 → 1,75, 10 → 2,625).
- Beispiel der Vorlage: Freundschaftsspiel auf neutralem Platz, 630 gegen 500, 3:1 → 20 · 1,5 · (1 − 0,679) ≈ +9,6 Punkte; der Verlierer verliert genauso viel.

## Im Spiel

- **Spielarten:** WM-Endrunde 60, EM-Endrunde 50, Länderspielfenster mit Qualifikation (WM/EM) oder Nations League 40, Freundschaftsspiel 20 (Bezeichnung wie im Spiel `intlMatchLabel`). Außerhalb Europas zählen EM-Fenster als Freundschaftsspiel.
- **Heimvorteil:** im Länderspielfenster spielt die erstgenannte Mannschaft zu Hause; bei WM/EM nur der Gastgeber, alle anderen Spiele neutral.
- **Zeitpunkt:** jedes Spiel wird am Tag danach verbucht (Turniere sind beim Nominieren schon ausgespielt; die Liste kennt nur Gespieltes).
- **Ausgabe am Monatsersten** wie die FIFA-Liste: Rang, Punkte, ± zur Ausgabe davor; die Januar-Ausgabe geht als Rang des Vorjahres in den Verlauf (höchstens 30 Jahre).
- **Nachfolger:** Russland übernimmt die Punkte der UdSSR, Serbien die Jugoslawiens, Tschechien die der Tschechoslowakei (wie bei der Vorlage); die DDR fällt nach 1990 weg. Neue Nationen starten beim Richtwert.

## Startwerte (Stützwerte je Jahrzehnt)

Die Originalseite liefert keine maschinenlesbaren Jahreswerte. Die Stützwerte sind deshalb **selbst nachgerechnet**: Skript `scripts/elo-anchors.mjs` wendet obige Formel auf den öffentlichen Ergebnisdatensatz aller Männer-Länderspiele seit 1872 an (rund 50 000 Spiele; Spalten Datum, Mannschaften, Tore, Wettbewerb, neutral) und schreibt die Punkte am 1. Juli 1975/1985/1995/2005/2015/2025 heraus. Jede Mannschaft beginnt mit 1500, daher liegen die Werte insgesamt etwas unter denen der Vorlage; die Reihenfolge passt.

Startliste 1. Juli 1975 (nachgerechnet): BR Deutschland 1972, Niederlande 1964, Brasilien 1920, Polen 1895, England 1855, Italien 1807, Jugoslawien 1797, Belgien 1794, Spanien 1769, Schottland/Tschechoslowakei 1762 – passend zur WM 1974 (Weltmeister, Vize, Dritter Polen) und zur EM 1976.

Zwischen den Stützjahren wird linear übergeblendet. Fehlt ein Stützwert (Nation entsteht oder vergeht im Jahrzehnt), zählt die Grundstärke aus `data/nationalTeams.ts` über die Ausgleichsgerade **Elo ≈ 450 + 17,8 · Grundstärke** (383 Wertepaare, mittlere Abweichung ≈ 90 Punkte).

## Drift (eigene Ergänzung)

Zwei Eigenheiten des Spiels würden eine reine Elo-Fortschreibung über Jahrzehnte verzerren:

1. Länderspiele finden fast nur **innerhalb des eigenen Verbands** statt; die Töpfe sind abgeschottet und tauschen nur über WM-Spiele Punkte aus.
2. Ergebnisse im Spiel liegen **enger beieinander** als echte (das Ergebnismodell der Länderspiele ist flacher): ein Favorit mit historisch +300 Punkten gegen seine Nachbarn gewinnt im Spiel seltener, als die Formel erwartet, und verliert stetig Punkte. Ohne Ausgleich fiel Brasilien in einer Probe bis 1983 auf Platz 23, während der Stärkste eines kleinen Verbands weit nach vorn rückte.

Deshalb nähert sich jede Nation am Monatsersten ihrem **Richtwert**: historischer Wert (Stützwerte oben) + Abweichung ihrer Stärke im Spiel von der Grundstärke × 17,8 (höchstens ±8 Stärkepunkte). Anteil der Lücke: **6 %** je Monat, ohne Länderspiel seit 12 Monaten **10 %**. Ergebnisse wirken damit kurz- bis mittelfristig (ein Turniersieg bringt 60–100 Punkte, die über rund ein Jahr abklingen), die Stärke im Spiel langfristig – wird eine Nation im Spiel dauerhaft stärker als historisch, steigt auch ihr Richtwert.

Außerdem zählen Länderspielfenster mit der Bezeichnung EM-Qualifikation oder Nations League für Nationen außerhalb Europas als Freundschaftsspiel (K 20) – dort ging es historisch nicht um diese Wettbewerbe.

Im Test über 20 Saisons (nur Grundstärken) bleibt die Rangkorrelation zum historischen Richtwert über 0,7, die Schnitte je Verband bleiben beim Richtwert.

## Quellen

- World Football Elo Ratings, Erklärung des Verfahrens (Wikipedia, engl. Artikel „World Football Elo Ratings“): Formel, K-Faktoren, Tordifferenz, Heimvorteil, Rechenbeispiel.
- eloratings.net – Originalseite der Rangliste (nur als Vorlage genannt, Werte nicht übernommen).
- Ergebnisdatensatz „international_results“ (öffentliches Repository, Länderspiele seit 1872) – Grundlage der eigenen Nachrechnung.

# Namen nach Herkunft und Geburtsjahrgang – Kurzrecherche

Umsetzung: `src/data/nameEras.ts` (Vornamen je Jahrgang), `src/data/origins.ts` (Herkünfte, Nachnamen,
Mischung je Jahr), `src/data/namePools.ts` (Zusatzlisten, gesperrte Paare). Nur gängige Namen; Paare
entstehen zufällig, bekannte reale Kombinationen sperrt `BLOCKED_NAMES`.

## Grundidee
- Ein Kader von 1975 besteht aus Jahrgängen ca. 1940–1957, die Jugend von 2025 aus Jahrgängen um 2008.
  Vornamen folgen deshalb dem **Geburtsjahr** (Kohorten je Jahrzehnt), nicht dem Spieljahr.
- Nachnamen ändern sich über die Zeit kaum – sie bleiben je Herkunft fest.
- Die **Herkunftsmischung** neuer Spieler folgt dem Spieljahr (`MIX`, Stützjahre 1975/85/90/95/2005/15/25).

## Quellen (Ranglisten häufigster Jungennamen nach Geburtsjahr/-jahrzehnt)
| Herkunft | Quelle |
|---|---|
| Deutschland (West) | Knud Bielefeld, beliebte-vornamen.de – Jahrgangslisten ab 1890 (Auswertung von Geburtsanzeigen/Standesämtern); Gesellschaft für deutsche Sprache (GfdS), Vornamenstatistik ab 1977 |
| DDR | beliebte-vornamen.de, DDR-Jahrgänge 1950–1989; GfdS-Auswertungen Ost (typisch 1970er/80er: Ronny, René, Enrico, Sandro, Maik, Danny, Kevin, Steve) |
| Österreich | Statistik Austria, Vornamenstatistik (ab 1984); ältere Jahrgänge nach Taufnamen-Auswertungen |
| Niederlande | Meertens Instituut, Nederlandse Voornamenbank (Häufigkeit je Geburtsjahr) |
| Dänemark / Schweden / Norwegen | Danmarks Statistik (navne), SCB „Namnstatistik“, SSB „Navn“ – jeweils nach Geburtsjahrzehnt |
| Polen | GUS / PESEL-Register (Vornamen nach Geburtsjahr) |
| Italien | ISTAT „I nomi più frequenti“ (nach Geburtsjahrzehnt) |
| Spanien | INE „Nombres por década de nacimiento“ |
| Frankreich | INSEE „Fichier des prénoms“ (ab 1900) |
| England | ONS Baby Names (ab 1996), ältere Top-100-Listen je Jahrzehnt |
| Türkei | TÜİK, häufigste Namen nach Geburtsjahrzehnt |
| Brasilien | IBGE, Censo 2010 „Nomes no Brasil“ (Häufigkeit je Geburtsjahrzehnt) |
| Kroatien / Serbien | DZS bzw. RZS, Namen nach Geburtsjahr |

## Herkünfte mit Wurzeln in anderen Ländern (Spieljahr-Anteile, `MIX`)
- **Ostdeutsche (`ger_ost`)**: vor 1990 kaum (Flüchtlinge), Stützjahr 1990 = 0,4, 1995 = 4,5, 2005 = 2,5, 2015 = 1.
  Ab Jahrgang 1990 dieselben Vornamen wie im Westen.
- **Deutsch-Türken (`ger_tr`)**, **Deutsch-Italiener (`ger_it`)**, **Deutsche mit jugoslawischen Wurzeln (`ger_yu`)**:
  Kinder der Gastarbeiter (Anwerbeabkommen Italien 1955, Türkei 1961, Jugoslawien 1968) – im Profifußball ab
  den späten 1980ern sichtbar, Vornamen der Kohorten 1970er/80er/2000er.
- **Deutsche mit polnischen Wurzeln (`ger_pl`)**: Aussiedler der 1980er; Mischung deutscher und polnischer Vornamen.
- **Deutsche mit afrikanischen Wurzeln (`ger_af`)**: ab den 1990ern, überwiegend internationale Vornamen.

## Bestehende Spielstände
Namen sind Identität: vorhandene Spieler werden **nie** umbenannt. Neue Jahrgangsnamen gelten nur für neu
erzeugte Personen (Jugend, KI-Neuzugänge, Trainer/Mitarbeiter, neue Spielwelten). Virtuelle Jugendspieler der
Jugendwettbewerbe (`game/youthComps/sim.ts`) bilden ihren Namen bei jeder Anzeige neu aus der ID und nutzen
deshalb weiter die Grundliste ohne Jahrgang.

# Namen je Land nach simulierten Vereinen (sechste Stufe der Namenspools)

Wunsch Pascal (wörtlich): „Alle anderen Top-Länder brauchen genau so viele Namen wie Deutschland.
Proportional im Verhältnis mit den simulierten Vereinen zu Deutschland, wenn man das Land wählt,
brauchen andere Länder weniger Namen.“

Umsetzung: `src/data/namePoolsXL5.ts` (Aufbau, Vornamen-Stufen) + Rohdaten `src/data/namePoolsXL5<Region>.ts`
(Spain, Italy, France, Britain, Netherlands, Belgium, Portugal, North, East, South, Alps), eingemischt in
`src/data/origins.ts` über `mergeXL` nach der fünften Stufe. Gesperrte reale Paare `BLOCKED_XL5` in
`src/data/namePoolsBlocked.ts`.

## Regel

- **Ziel Nachnamen je Herkunft** = Nachnamen Deutschlands × (simulierte Vereine mit Spielern, wenn das Land
  Heimatland ist ÷ simulierte Vereine bei Heimat Deutschland). Deutschland = `ger` + `ger_modern` + `ger_ost`
  zusammen (2066 verschiedene Nachnamen), Bezugsgröße 189 Vereine (Start 2025).
- **Top-Länder** (Rang 1–5 der Länderwertung mit 4. Ebene, `data/world/deepStructure.ts`: England, Spanien,
  Italien, Frankreich – Deutschland zählt mit) mindestens so viele wie Deutschland. Damit gilt für England
  2066 statt 0,93 × 2066.
- Je Land zählt die **größte** Vereinszahl der Startjahre 1975/1995/2025 („die maximale Tiefe zählt“). Teilen
  sich mehrere Länder eine Herkunft (z. B. `eng` für Wales/Nordirland/Irland, `gre` für Zypern/Israel), gilt das
  Land mit den meisten Vereinen.
- **Vornamen je Geburtsjahrzehnt** analog: Vornamen Deutschlands im Jahrzehnt × dasselbe Verhältnis.

## Zählung der Vereine (Schritt 1)

`node scripts/run-ts.mjs tests/name-count.ts clubs` – je Heimatland × Startjahr ein neues Spiel (erster
Verein der 1. Liga), gezählt werden Vereine des Heimatlandes mit Spielern: volle Kader (`g.clubs`, ≥ 11
Spieler) + Weltspieler-Kader des Heimatlandes (`worldClubs`, Land „Deutschland“ = Heimatland, inkl. Jugend
der Weltspieler). Tiefere Auslandsligen (3./4. Ebene) haben keine Weltspieler-Kader und zählen darum nicht.
Auffällig: die Niederlande und Belgien führen 1975 einen großen Unterbau aus den Weltdaten, der bei Heimat
Niederlande/Belgien Weltspieler-Kader bekommt – deshalb liegen sie über Deutschland.

| Land | Herkunft | 1975 | 1995 | 2025 | größte Zahl | ÷ Deutschland (189) |
|---|---|---:|---:|---:|---:|---:|
| Deutschland | `ger` | 139 | 154 | 189 | 189 | 1.00 |
| Spanien | `esp` | 270 | 264 | 218 | 270 | 1.43 |
| Italien | `ita` | 186 | 194 | 236 | 236 | 1.25 |
| Niederlande | `ned` | 224 | 200 | 154 | 224 | 1.19 |
| Belgien | `bel` | 218 | 198 | 172 | 218 | 1.15 |
| Frankreich | `fra` | 136 | 206 | 168 | 206 | 1.09 |
| England | `eng` | 176 | 156 | 156 | 176 | 0.93 |
| Portugal | `por` | 160 | 156 | 176 | 176 | 0.93 |
| Schottland | `sco` | 96 | 74 | 72 | 96 | 0.51 |
| Wales | `eng` | – | 75 | 75 | 75 | 0.40 |
| Nordirland | `eng` | 90 | 76 | 72 | 90 | 0.48 |
| Irland | `eng` | 94 | 76 | 72 | 94 | 0.50 |
| Österreich | `aut` | 93 | 77 | 72 | 93 | 0.49 |
| Schweiz | `sui` | 96 | 75 | 72 | 96 | 0.51 |
| Luxemburg | `fra` | 92 | 71 | 75 | 92 | 0.49 |
| Schweden | `swe` | 96 | 78 | 78 | 96 | 0.51 |
| Finnland | `swe` | 93 | 75 | 74 | 93 | 0.49 |
| Norwegen | `nor` | 95 | 75 | 75 | 95 | 0.50 |
| Island | `nor` | 94 | 77 | 74 | 94 | 0.50 |
| Dänemark | `den` | 95 | 77 | 73 | 95 | 0.50 |
| UdSSR | `rus` | 95 | – | – | 95 | 0.50 |
| Russland | `rus` | – | 81 | 104 | 104 | 0.55 |
| Ukraine | `rus` | – | 73 | 81 | 81 | 0.43 |
| Jugoslawien | `yug` | 92 | – | – | 92 | 0.49 |
| Serbien | `srb` | – | 72 | 79 | 79 | 0.42 |
| Kroatien | `cro` | – | 76 | 72 | 76 | 0.40 |
| Tschechoslowakei | `cze` | 94 | – | – | 94 | 0.50 |
| Tschechien | `cze` | – | 73 | 71 | 73 | 0.39 |
| Slowakei | `cze` | – | 73 | 73 | 73 | 0.39 |
| Polen | `pol` | 96 | 82 | 78 | 96 | 0.51 |
| Ungarn | `hun` | 94 | 75 | 75 | 94 | 0.50 |
| Rumänien | `hun` | 93 | 75 | 78 | 93 | 0.49 |
| Bulgarien | `srb` | 92 | 76 | 75 | 92 | 0.49 |
| Albanien | `yug` | 90 | 75 | 75 | 90 | 0.48 |
| Griechenland | `gre` | 95 | 83 | 75 | 95 | 0.50 |
| Zypern | `gre` | 92 | 76 | 77 | 92 | 0.49 |
| Israel | `gre` | – | 74 | 75 | 75 | 0.40 |
| Türkei | `tur` | 98 | 87 | 84 | 98 | 0.52 |
| Malta | `ita` | 90 | 72 | 78 | 90 | 0.48 |

## Ziel, vorher, nachher (Schritt 1 + 2)

`node scripts/run-ts.mjs tests/name-count.ts pools` (vorher-Stand: `docs/research/namen-zaehlung-vorher.txt`
ist die Zählung vor der fünften Stufe; die Spalte „vorher“ hier ist der Stand nach der fünften Stufe, direkt vor
dieser Änderung). Vornamen = verschiedene Vornamen, die `firstNamesFor` für Geburtsjahre des Jahrzehnts liefert
(inkl. der Mischung an Stufengrenzen).

| Herkunft | Nachnamen Ziel | vorher | nachher | Vornamen je Jahrzehnt Ziel (1940/1970/2010) | vorher (1940/1970/2010) | nachher (1940/1970/2010) | nachher min–max |
|---|---:|---:|---:|---|---|---|---|
| Deutschland (ger + ger_modern + ger_ost) `ger` | 2066 | 2066 | 2066 | 331/411/309 | 331/411/309 | 331/411/309 | 309–420 |
| Spanien `esp` | 2951 | 479 | 2951 | 473/587/441 | 152/183/174 | 544/699/505 | 505–699 |
| Italien (auch Malta) `ita` | 2580 | 595 | 2580 | 413/513/386 | 178/164/130 | 436/485/403 | 403–485 |
| Niederlande `ned` | 2449 | 438 | 2449 | 392/487/366 | 119/183/121 | 422/526/464 | 422–538 |
| Belgien `bel` | 2383 | 351 | 2383 | 382/474/356 | 96/101/109 | 448/586/500 | 448–586 |
| Frankreich (auch Luxemburg) `fra` | 2252 | 520 | 2252 | 361/448/337 | 167/192/156 | 314/433/394 | 314–433 |
| England (auch Wales, Nordirland, Irland) `eng` | 2066 | 672 | 2066 | 331/411/309 | 183/195/173 | 333/436/332 | 332–436 |
| Portugal `por` | 1924 | 374 | 1924 | 308/383/288 | 122/139/110 | 422/467/351 | 351–467 |
| UdSSR/Russland/Ukraine `rus` | 1137 | 425 | 1137 | 182/226/170 | 100/93/83 | 212/216/136 | 136–228 |
| Türkei `tur` | 1071 | 387 | 1071 | 172/213/160 | 139/214/146 | 169/244/176 | 169–266 |
| Schottland `sco` | 1049 | 347 | 1049 | 168/209/157 | 98/93/91 | 184/225/189 | 184–255 |
| Schweiz `sui` | 1049 | 457 | 1049 | 168/209/157 | 129/136/141 | 179/186/191 | 179–239 |
| Schweden (auch Finnland) `swe` | 1049 | 330 | 1049 | 168/209/157 | 98/161/94 | 190/253/173 | 173–253 |
| Polen `pol` | 1049 | 381 | 1049 | 168/209/157 | 107/118/118 | 180/187/165 | 155–187 |
| Norwegen (auch Island) `nor` | 1038 | 303 | 1038 | 166/206/155 | 93/153/94 | 218/278/219 | 218–296 |
| Dänemark `den` | 1038 | 339 | 1038 | 166/206/155 | 94/146/90 | 167/219/163 | 163–219 |
| Griechenland (auch Zypern, Israel) `gre` | 1038 | 239 | 1038 | 166/206/155 | 96/112/93 | 167/183/164 | 164–183 |
| Ungarn (auch Rumänien) `hun` | 1028 | 271 | 1028 | 165/205/154 | 90/86/76 | 192/199/169 | 165–199 |
| Tschechoslowakei/Tschechien/Slowakei `cze` | 1028 | 307 | 1028 | 165/205/154 | 80/83/76 | 164/177/153 | 153–179 |
| Österreich `aut` | 1017 | 492 | 1017 | 163/202/152 | 139/150/151 | 180/202/202 | 180–214 |
| Jugoslawien (auch Albanien) `yug` | 1006 | 331 | 1006 | 161/200/150 | 109/145/96 | 205/241/192 | 192–315 |
| Serbien (auch Bulgarien) `srb` | 1006 | 201 | 1006 | 161/200/150 | 95/141/82 | 173/219/160 | 160–219 |
| Kroatien `cro` | 831 | 225 | 831 | 133/165/124 | 93/153/99 | 173/233/179 | 173–233 |

**Nachnamen:** alle 22 Herkünfte haben genau die Zielzahl (zusammen ≈ 23 600 neue Familiennamen).

**Vornamen:** fast alle Herkünfte liegen in den meisten Jahrzehnten am oder über dem Ziel; darunter bleiben
vor allem
- Spanien/Italien/Frankreich/Portugal in einzelnen Jahrzehnten (z. B. Frankreich 1940er 314 statt 361, Italien
  1970er) – mehr Namen gäbe es nur mit Kurz-/Koseformen (Paco, Javi, Juanjo …, die zum Teil bewusst drin sind),
  Einwanderer-Namen (rumänisch, albanisch, westafrikanisch, maghrebinisch – die laufen über eigene Herkünfte und
  `HERITAGE`) oder Namen, die im Jahrgang praktisch nicht vorkamen;
- Osteuropa (Russland, Polen, Tschechien, Ungarn) ab den 1970er-Jahrgängen (≈ 140–170 statt ≈ 205): die
  Jungennamen der Jahrgänge 1970–2010 waren dort stark konzentriert; die Ranglisten enthalten darüber hinaus fast
  nur Kose-/Kurzformen (Tomek, Honza, Dima …) und Namen nichtslawischer Minderheiten. **Realistische Obergrenze**
  wie bei Korea/China: lieber weniger, aber übliche Namen.
- Schottland, Dänemark, Schweden und Griechenland in einzelnen späten Jahrzehnten knapp darunter (aus demselben
  Grund – Kurzformen bzw. „Greeklish“-Schreibungen wurden verworfen).

## Quellen und Vorgehen (Schritt 2)

- **Familiennamen**: Ranglisten der häufigsten Nachnamen je Land aus dem frei verfügbaren *names-dataset*
  (Philippe Rémy, v3, Rang je Land aus gut 490 Mio. öffentlichen Profilen) – genutzt nur als Häufigkeitsrangfolge.
  Je Herkunft in Rangfolge übernommen, bis das Ziel erreicht war (Spanien bis Rang ≈ 10 000, sonst meist
  ≈ 600–4 500), mit Filtern:
  - nur Namen, die im Land mindestens halb so häufig sind wie im häufigsten Fremdland (Nachbarländer gleicher
    Sprache erlaubt: Lateinamerika für Spanien, Brasilien für Portugal, Flandern/Wallonie für Belgien usw.),
    Anteil in Herkunftsländern von Einwanderung (Südasien, Nahost, Maghreb, Westafrika, Ostasien) < 30 %;
    Spanien/Portugal zusätzlich gegen reine Lateinamerika-/Brasilien-Namen (Pazmiño, Souza);
  - keine Überschneidung mit den Ethnien-Herkünften desselben Landes (`eng_car`, `fra_af`, `fra_car`, `fra_mag`,
    `ned_sur`) und mit afrikanischen, nordafrikanischen, türkischen und ostasiatischen Pools; Schweiz/Österreich/
    Nordeuropa ohne Balkan-Namen (die kommen über `HOST_HERITAGE`);
  - keine Vornamen als Nachnamen (Eintragsfehler), keine weiblichen Formen (polnisch -ska, tschechisch -ová,
    russisch -owa/-ina, griechisch -opoulou/-aki), keine Abkürzungen, Orts-, Firmen- und Wortangaben (über
    Sperrlisten im Extraktionsskript), keine Bindestrich-Doppelnamen;
  - Schreibweise: Variante mit Sonderzeichen bevorzugt (García, Đorđević, Yılmaz), niederländische Voorvoegsel
    klein (van der Meer), flämische groß (Van den Broeck), irische O’-Namen mit Apostroph; Russisch in deutscher
    Umschrift (Duden: Schewtschenko, Wlassow), Serbisch in Lateinschrift; Griechisch nur lateinisch (Festland und
    Zypern).
  - Schottland: Mac/Mc-Namen der britischen Liste, typisch schottische Familiennamen (Prüfung gegen die britische
    Rangliste), Rest mit den häufigsten britischen Namen, die in Schottland ebenso verbreitet sind.
- **Vornamen**: je Land Listen nach Geburtsjahrgängen (Bänder alle Jahrgänge / 1940–1969 / 1960–1989 /
  1980–2019 / 2000–2019, für die großen Länder ausgeschrieben, angelehnt an die Jahrgangsranglisten von INE, ISTAT, INSEE,
  ONS, IRN, Statbel, Meertens, SCB/SSB/DST, GUS, ČSÚ, KSH – siehe docs/research/namen.md) plus häufige männliche Vornamen der Ranglisten, von
  Hand durchgesehen: Kose-/Kurzformen, Einwanderer-Namen, Tippfehler und modische Namen (nur ab 1980) markiert
  bzw. verworfen. Alle Vornamen sind im Datensatz überwiegend männlich belegt (Ausnahmen wie Andrea, Elia in
  Italien, Pau in Katalonien ausdrücklich erlaubt).
- **Keine bekannten Personen**: `node scripts/run-ts.mjs tests/name-celeb-check.ts` (Teil von `npm run test:names`)
  prüft ≈ 1 360 bekannte Personen (`tests/realPeopleNames.ts`: Fußballer, Trainer, Sportler, Politiker, Künstler
  der Länder; dazu die vollen Namen aus `tests/realPeopleList.ts`). Jedes Paar, das eine Herkunft aus Vor- und
  Nachnamen bilden kann, steht in `BLOCKED_XL5` (530 Paare, z. B. „Raúl González“, „Bobby Charlton“, „Paolo
  Rossi“) – Test schlägt fehl, wenn eines fehlt.

## Doppelte Namen im Spiel (Schritt 3)

`node scripts/run-ts.mjs tests/name-dupes.ts` – neues Spiel 1995 je Heimatland, alle Spieler mit Namen (volle
Kader, Jugend, Weltspieler); gezählt werden Spieler, deren Vor- + Nachname innerhalb derselben Nationalität ein
zweites Mal vorkommt.

**Vorher**

| Heimat | Spieler der Heimat-Nationalität | mit Namensvetter | Anteil | häufigstes Paar | alle Spieler | mit Namensvetter | Anteil |
|---|---:|---:|---:|---|---:|---:|---:|
| ger | 2826 | 6 | 0.2 % | Carsten Benz ×2 | 30348 | 868 | 2.9 % |
| eng | 4489 | 120 | 2.7 % | Kevin Maddox ×2 | 29334 | 1013 | 3.5 % |
| ita | 3900 | 166 | 4.3 % | Fulvio Di Giacomo ×2 | 30399 | 1014 | 3.3 % |
| esp | 4685 | 262 | 5.6 % | Joan Irigoyen ×3 | 32120 | 1150 | 3.6 % |
| fra | 4379 | 154 | 3.5 % | Yannick Barthélemy ×3 | 30635 | 1106 | 3.6 % |

**Nachher**

| Heimat | Spieler der Heimat-Nationalität | mit Namensvetter | Anteil | häufigstes Paar | alle Spieler | mit Namensvetter | Anteil |
|---|---:|---:|---:|---|---:|---:|---:|
| ger | 2826 | 6 | 0.2 % | Carsten Benz ×2 | 30348 | 114 | 0.4 % |
| eng | 4489 | 28 | 0.6 % | Nathaniel Yarde ×2 | 29334 | 162 | 0.6 % |
| ita | 3900 | 14 | 0.4 % | Mattia Santonocito ×2 | 30399 | 164 | 0.5 % |
| esp | 4682 | 4 | 0.1 % | Gregorio Almirall ×2 | 32120 | 116 | 0.4 % |
| fra | 4379 | 28 | 0.6 % | Kingsley Etoundi ×2 | 30635 | 162 | 0.5 % |

Ergebnis: bei Heimat England/Italien/Spanien/Frankreich fallen Namensvettern unter den Einheimischen von
2,7–5,6 % auf 0,1–0,6 %, über alle Spieler der Welt von ≈ 3,5 % auf ≈ 0,5 %. Deutschland war schon vorher bei
0,2 % (die Welt-Spalte sinkt trotzdem, weil die Auslandsligen jetzt mehr Namen haben).

## Bestehende Spielstände

Namen sind Identität – vorhandene Spieler werden nicht umbenannt. Die neuen Namen gelten für neu erzeugte
Personen (neue Spiele, Jugend, Weltspieler-Nachrücker, Mitarbeiter).

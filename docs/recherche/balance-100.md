# Langzeit-Balance über 100 Saisons (1975–2075)

Nachtauftrag Pascal (11/2026): Das Spiel soll über Jahrzehnte Spaß machen, Investitionen und Risiken sollen sich kurz- und langfristig lohnen können. Geprüft wurde die Hintergrund-Welt über 100 Saisons ohne Oberfläche (`node scripts/sim.mjs 100`, eigener Verein im Autopiloten `simAutoManage`, Option „Historisch“ wie im Assistenten: `HIST=mittel LEAGUEREP=historisch`).

## Läufe

| Lauf | Aufruf | Saisons |
|---|---|---|
| fra | `CLUB=fra` (Seed 1975) | 1975/76–2074/75 |
| muc | `CLUB=muc SEED=7` | 1975/76–2074/75 |
| goe (kleiner Verein, 2. Liga Nord) | `CLUB=n_goe SEED=11` | 1975/76–2074/75 |
| 1995 (Startjahr 1995) | `START=1995 CLUB=fra SEED=3` | 1995/96–2074/75 (80) |

Alle mit `FIN=1 TOP=1 BAL=1 YOUTH=1 TRANSFERS=1 AI=1 STAFF=1 AWARDS=1 HONOURS=1 SEATS=1 SPEED=1 SAVESIZE=25`. Auswertung je Jahrzehnt: `python3 tests/simLongTable.py <ausgabe.txt>`.
Geldbeträge „real“ = in 1975-Kaufkraft (÷ `economyScale`), Median der eigenen Liga ohne eigenen Verein. „nachher“ für goe/1995 = Stand vor der letzten Feinjustierung der Mitglieder-Obergrenze (siehe Befund 2; die anderen Korrekturen enthalten).

Neu im Sim-Bericht: `START=…` (Startjahr), Zeile `LONG` je Saison (Skala, Zuschauer Ø, Umsatz/KI-Konten/Gehälter/Marktwert real, stärkste Elf), `SAVESIZE=25` (Größe des Spielstands je Teil alle 25 Saisons), Jahrzehnt-Auswertungen bis 2100 (`tests/simReportYouthTop.ts`, `simCareers.ts`, `simHistory.ts`).

## Vorher/Nachher – 1975–2024 und 2025–2074

| Lauf | Zeitraum | Stand | Meister versch. | häufigster | häufigster KI | längste Serie | Umsatz med real | KI-Konto med real | im Minus Ø | MW top real | Spitzenablöse % Kurve | ≥85 Liga | Welt ≥85 | eigenes Konto real | Mitgliedsbeiträge % Umsatz eigen | Stand MB max |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| fra | 1975–2024 | vorher | 9 | MÜR 36 | MÜR 36 | 14 | 4.65 M | 1.22 M | 0.9 | 3.0 M | 81 % | 16.3 | 75 | 6.1 M | 2.3 % | 24.4 |
| fra | 2025–2074 | vorher | 7 | MÜR 24 | MÜR 24 | 6 | 3.98 M | 0.52 M | 2.8 | 5.5 M | 77 % | 11.4 | 110 | 13.8 M | 14.7 % | 29.7 |
| fra | 1975–2024 | nachher | 5 | MÜR 28 | MÜR 28 | 7 | 4.50 M | 1.12 M | 1.2 | 1.9 M | 86 % | 16.4 | 74 | 5.7 M | 1.7 % | 24.0 |
| fra | 2025–2074 | nachher | 8 | FRR 18 | DOR 18 | 4 | 3.85 M | 0.46 M | 3.1 | 1.5 M | 74 % | 11.0 | 97 | 10.0 M | 4.3 % | 29.7 |
| muc | 1975–2024 | vorher | 5 | MÜR 29 | FRR 11 | 10 | 4.49 M | 1.06 M | 1.3 | 2.9 M | 83 % | 15.9 | 75 | 8.1 M | 3.0 % | 24.2 |
| muc | 2025–2074 | vorher | 8 | MÜR 23 | LEV 9 | 6 | 4.21 M | 0.59 M | 3.0 | 4.9 M | 75 % | 11.8 | 121 | 24.5 M | 31.0 % | 29.8 |
| muc | 1975–2024 | nachher | 5 | MÜR 30 | BEB 10 | 10 | 4.42 M | 1.05 M | 1.3 | 1.9 M | 79 % | 15.8 | 74 | 8.4 M | 1.8 % | 24.0 |
| muc | 2025–2074 | nachher | 7 | MÜR 20 | DOR 12 | 11 | 3.82 M | 0.52 M | 2.7 | 1.5 M | 70 % | 10.6 | 101 | 10.0 M | 5.6 % | 29.1 |
| goe | 1975–2024 | vorher | - | - | - | 0 | 0.81 M | 0.42 M | 2.7 | 8.5 M | 39 % | nan | nan | -0.1 M | 12.2 % | 22.3 |
| goe | 2025–2074 | vorher | - | - | - | 0 | 0.12 M | 0.12 M | 4.2 | 8.9 M | 20 % | nan | nan | 0.1 M | 24.7 % | 28.0 |
| goe | 1975–2024 | nachher | - | - | - | 0 | 0.80 M | 0.45 M | 2.9 | 1.6 M | 30 % | nan | nan | -0.0 M | 11.8 % | 22.4 |
| goe | 2025–2074 | nachher | - | - | - | 0 | 0.12 M | 0.10 M | 4.6 | 0.5 M | 22 % | nan | nan | 0.1 M | 24.1 % | 27.9 |
| 1995 | 1975–2024 | vorher | 5 | DOR 13 | DOR 13 | 4 | 5.47 M | 1.39 M | 1.1 | 2.3 M | 92 % | 17.4 | 94 | 1.9 M | 2.3 % | 22.9 |
| 1995 | 2025–2074 | vorher | 9 | MÜR 28 | MÜR 28 | 10 | 4.35 M | 0.60 M | 2.6 | 5.4 M | 73 % | 11.7 | 135 | 6.0 M | 6.8 % | 29.6 |
| 1995 | 1975–2024 | nachher | 7 | DOR 10 | DOR 10 | 5 | 4.90 M | 1.41 M | 1.2 | 2.1 M | 80 % | 16.9 | 94 | 4.9 M | 1.8 % | 22.7 |
| 1995 | 2025–2074 | nachher | 7 | DOR 23 | DOR 23 | 4 | 4.16 M | 0.55 M | 2.8 | 1.4 M | 76 % | 11.4 | 108 | 12.0 M | 4.9 % | 29.7 |

Spalten: „häufigster KI“ = häufigster Meister ohne den eigenen Verein; „eigenes Konto real“ = Kontostand des eigenen Vereins (Autopilot); „Stand MB max“ = Spielstand unkomprimiert (JSON).

## Je Jahrzehnt (Lauf fra)

#### Vorher (`CLUB=fra`, Seed 1975) (100 Saisons)

| Jahre | Ø Liga | Top10 | ≥85 Liga | Welt ≥85/≥80 | max | Spitze–Keller | Meister (versch./Saisons, häufigster) | Umsatz med real | KI-Konto med real (min) | Konto/Umsatz med | im Minus Ø | Gehalt top/med real | MW top real | Spitzenablöse % Kurve | Zuschauer Ø | Eigengew. | Trainerwechsel | Tag ms | Wechsel s | Stand MB | Heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1975–1984 | 73.2 | 87.4 | 18.2 | 49/238 | 89 | 12.6 | 4/10, KÖR 4 | 3.45M | 1.15M (-0.48) | 0.28 | 1.3 | 0.279M/83k | 3.6M | 85 % | 21791 | 24 | 4.0 | 40 | 2.1 | 12.4 | 232 |
| 1985–1994 | 72.5 | 88.4 | 19.1 | 54/236 | 91 | 11.7 | 6/10, MÜR 4 | 3.44M | 0.95M (-0.33) | 0.30 | 0.7 | 0.330M/76k | 3.4M | 82 % | 21649 | 67 | 6.2 | 50 | 3.4 | 17.4 | 358 |
| 1995–2004 | 73.1 | 88.1 | 14.6 | 81/330 | 91 | 10.4 | 1/10, MÜR 10 | 4.97M | 1.57M (-1.35) | 0.34 | 0.6 | 0.533M/106k | 2.0M | 85 % | 32586 | 82 | 5.4 | 52 | 4.2 | 19.7 | 373 |
| 2005–2014 | 73.1 | 89.0 | 16.5 | 84/395 | 92 | 11.5 | 3/10, MÜR 8 | 5.79M | 1.37M (-0.44) | 0.28 | 0.3 | 0.698M/112k | 2.8M | 78 % | 38452 | 105 | 5.0 | 53 | 4.9 | 21.6 | 342 |
| 2015–2024 | 73.0 | 87.6 | 13.3 | 105/423 | 91 | 10.5 | 1/10, MÜR 10 | 5.59M | 1.06M (-1.67) | 0.26 | 1.8 | 0.620M/108k | 3.1M | 76 % | 34316 | 131 | 5.7 | 81 | 6.4 | 23.7 | 405 |
| 2025–2034 | 73.0 | 87.2 | 10.0 | 114/479 | 91 | 10.1 | 5/10, MÜR 4 | 4.67M | 0.52M (-1.68) | 0.21 | 2.9 | 0.559M/98k | 1.5M | 81 % | 39653 | 118 | 5.5 | 73 | 5.9 | 25.2 | 409 |
| 2035–2044 | 72.9 | 87.4 | 11.0 | 103/465 | 92 | 10.6 | 2/10, MÜR 8 | 3.93M | 0.56M (-1.00) | 0.21 | 2.4 | 0.639M/94k | 4.9M | 70 % | 39354 | 112 | 7.0 | 49 | 3.4 | 26.4 | 430 |
| 2045–2054 | 72.8 | 87.4 | 12.1 | 112/469 | 94 | 11.7 | 3/10, DOR 7 | 3.76M | 0.39M (-1.00) | 0.17 | 3.1 | 0.648M/92k | 5.6M | 81 % | 38182 | 99 | 6.0 | 22 | 1.7 | 27.8 | 450 |
| 2055–2064 | 72.7 | 86.7 | 11.6 | 115/468 | 91 | 11.1 | 5/10, MÜR 3 | 3.77M | 0.54M (-1.10) | 0.21 | 3.2 | 0.563M/95k | 7.7M | 79 % | 38542 | 102 | 6.5 | 21 | 1.6 | 28.7 | 422 |
| 2065–2074 | 72.4 | 87.1 | 12.4 | 106/472 | 93 | 12.1 | 4/10, MÜR 7 | 3.75M | 0.60M (-0.98) | 0.24 | 2.6 | 0.688M/92k | 7.7M | 75 % | 38329 | 112 | 6.2 | 40 | 3.1 | 29.5 | 437 |

Meister gesamt: 12 verschiedene – MÜR 60, DOR 10, FRR 8, KÖR 6, WOB 4, LEV 4, GEL 3, BEB 1 | längste Serie 14 (MÜR)

#### Nachher (`CLUB=fra`, Seed 1975) (100 Saisons)

| Jahre | Ø Liga | Top10 | ≥85 Liga | Welt ≥85/≥80 | max | Spitze–Keller | Meister (versch./Saisons, häufigster) | Umsatz med real | KI-Konto med real (min) | Konto/Umsatz med | im Minus Ø | Gehalt top/med real | MW top real | Spitzenablöse % Kurve | Zuschauer Ø | Eigengew. | Trainerwechsel | Tag ms | Wechsel s | Stand MB | Heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1975–1984 | 73.2 | 87.7 | 17.2 | 47/243 | 90 | 12.9 | 4/10, KÖR 5 | 3.75M | 1.03M (-1.09) | 0.27 | 1.3 | 0.290M/84k | 1.3M | 85 % | 21694 | 26 | 4.2 | 37 | 2.3 | 12.4 | 242 |
| 1985–1994 | 72.8 | 88.4 | 19.3 | 63/272 | 92 | 11.7 | 3/10, MÜR 5 | 3.49M | 0.88M (-0.99) | 0.25 | 1.0 | 0.320M/75k | 1.6M | 89 % | 21341 | 68 | 5.6 | 38 | 2.4 | 17.5 | 310 |
| 1995–2004 | 72.7 | 88.1 | 14.0 | 74/317 | 92 | 10.9 | 3/10, MÜR 6 | 4.65M | 1.37M (-0.65) | 0.30 | 0.7 | 0.586M/103k | 2.0M | 82 % | 31799 | 72 | 6.5 | 38 | 3.2 | 19.6 | 370 |
| 2005–2014 | 73.2 | 88.8 | 18.4 | 86/372 | 92 | 11.5 | 3/10, MÜR 7 | 5.53M | 1.28M (-1.64) | 0.28 | 0.9 | 0.734M/114k | 2.5M | 91 % | 39951 | 92 | 6.2 | 30 | 2.5 | 21.4 | 387 |
| 2015–2024 | 73.3 | 87.8 | 13.1 | 98/410 | 91 | 10.2 | 2/10, MÜR 7 | 5.09M | 1.05M (-1.32) | 0.28 | 2.2 | 0.607M/106k | 2.1M | 82 % | 34861 | 112 | 7.7 | 34 | 2.9 | 23.4 | 408 |
| 2025–2034 | 72.9 | 88.1 | 9.2 | 118/484 | 93 | 10.5 | 6/10, FRR 4 | 4.09M | 0.41M (-1.12) | 0.15 | 2.9 | 0.647M/96k | 1.6M | 81 % | 39084 | 89 | 6.0 | 29 | 2.1 | 24.9 | 399 |
| 2035–2044 | 72.7 | 87.0 | 9.2 | 86/435 | 92 | 11.0 | 2/10, FRR 5 | 3.71M | 0.44M (-1.00) | 0.19 | 2.2 | 0.546M/95k | 1.5M | 70 % | 39482 | 100 | 5.5 | 28 | 2.3 | 26.5 | 431 |
| 2045–2054 | 73.0 | 88.7 | 14.7 | 95/444 | 93 | 12.1 | 2/10, DOR 5 | 3.68M | 0.50M (-1.74) | 0.23 | 3.3 | 0.560M/94k | 1.6M | 75 % | 38802 | 111 | 6.5 | 24 | 1.9 | 27.9 | 442 |
| 2055–2064 | 73.2 | 86.9 | 11.5 | 83/441 | 89 | 11.0 | 3/10, DOR 5 | 3.88M | 0.41M (-1.36) | 0.20 | 4.1 | 0.492M/96k | 1.3M | 67 % | 38555 | 120 | 6.1 | 25 | 1.8 | 28.8 | 484 |
| 2065–2074 | 72.6 | 87.6 | 10.2 | 103/452 | 92 | 11.0 | 6/10, FRR 4 | 3.92M | 0.54M (-1.06) | 0.24 | 2.8 | 0.566M/94k | 1.5M | 78 % | 39527 | 114 | 6.2 | 26 | 2.1 | 29.5 | 454 |

Meister gesamt: 10 verschiedene – MÜR 32, FRR 27, DOR 18, KÖR 8, GEL 5, LEV 3, BEL 3, LEI 2 | längste Serie 7 (MÜR)

## Befunde und Korrekturen

1. **Marktwerte neuer Spieler ohne Rekordkurve** (Fehler, behoben). `createPlayer` (engine/playerFactory.ts) setzte Stärke² × 1000 – nominal, ohne Kurve. Europapokal-Gegner und Nachrücker standen bis zum nächsten Saisonstart mit bis zu 55-fachem Wert in der Liste (75er 1976 ≈ 8,4 Mio. statt ≈ 0,15 Mio. Basis; „Top-Marktwert“ aller Spieler 1976 9,6 Mio. statt ≈ 1 Mio.). Hochgezogene Talente behielten den ungedeckelten Jugendwert (`baseMarketValue`) – 2060 stand ein Eigengewächs mit ≈ 1 Mrd. € in der Liga (Kurve ≈ 250 Mio. €). Ausnahmetalente in der Jugend hatten Stärke² × 400. Jetzt: `marketValueFor` beim Erzeugen und Hochziehen (`promoteYouth` mit Datum, `graduateYouth` mit Jahr), Jugend-Legenden wie jedes Talent. Wirkung: Spitzen-Marktwert der Liga real 3,0/5,5 Mio. → 1,9/1,5 Mio. (1975–2024/2025–2074), passt jetzt zur Kurve.
2. **Mitglieder des eigenen Vereins wuchsen ungebremst** (Fehler, behoben). `monthlyEnvironment` (engine/environment.ts) ließ die Mitglieder eines erfolgreichen Vereins ≈ 8 % im Jahr wachsen, ohne Obergrenze; die KI rechnet fest mit Ruf-Schätzung. Folge: Mitgliedsbeiträge 2070 = 30 % (Frankfurt) bzw. 50 % (München) des Umsatzes, eigenes Konto real bis 55 Mio. (≈ 13 Jahresumsätze der Liga). Neu: `memberCap` = Startzahl × Epochen-Vielfaches (1975 × 3, 1995 × 4, 2005 × 5, 2015 × 7, ab 2025 × 8), darüber langsamer Rückgang. Anteil am Umsatz jetzt bis 2025 ≈ 2–4 %, 2065 6–7 % (der Rest des Anstiegs kommt daher, dass die Vereinsumsätze real sinken, siehe offene Punkte).
3. **Historische Lenkung fror die Welt von 2025 ein** (Balance, geändert). Die Zielkurven der Vereine und des Ligarufs enden 2025 und galten danach unverändert weiter – München Rot holte als KI 60 von 100 Titeln (bis zu 14 in Folge), England blieb bis 2075 bei Ligaruf 100. Neu: `historicFade` (data/historicStrength.ts) – die Lenkung (nicht die Kurve) läuft nach 2025 mit Halbwertszeit 25 Jahren aus (2050 halb, 2075 ein Viertel); gilt für `historicSteer.ts` und den Ligaruf (`HIST_PULL`/`MIN_SHARE` in engine/leagueRep.ts). Wiki „Historische Entwicklung …“ und „Ligaruf …“ ergänzt, Prüfung in `test:history`. Wirkung im Lauf fra (2025–2074): München Rot 24 → 4 Titel, Dortmund 9 → 18, Frankfurt Rot (eigener Verein) 7 → 18, 8 statt 7 verschiedene Meister, längste Serie 6 → 4. Im Lauf 1995 bleiben es 7–9 verschiedene Meister, längste Serie 10 → 4. Der Ligaruf bleibt trotzdem nahe an 2025 (siehe offene Punkte).
4. **Rekordkurve der Ablösen lief der Wirtschaft davon** (Balance, geändert). Nach 2026 fest +3,5 % pro Jahr, die Wirtschafts-Basis wächst nach 2030 nur ≈ 2 %: Spitzenablöse 2075 ≈ 390 Mio. € = 60 % des Medianumsatzes eines Erstligisten (2025: 28 %), Kurve in 1975-Basis 1,2 → 2,5 Mio. Jetzt im Gleichschritt mit `economyScale` (data/transferRecords.ts). Die gezahlten Spitzenablösen liegen weiter bei 70–90 % der Kurve.
5. **Kein Absturz, kein NaN, keine Strukturfehler** in allen acht Läufen (`STRUKTUR: alle Saisons korrekt besetzt`).

## Was über 100 Jahre stabil ist

- **Spielerstärken:** Liga-Schnitt 72–73, Top 10 86–89, Höchstwert 89–95 über alle Jahrzehnte – keine Inflation/Deflation. Weltweit wächst die Breite (≥ 85: ≈ 50 → ≈ 100–120, ≥ 80: ≈ 240 → ≈ 450–500) bis ≈ 2030 mit den zusätzlich simulierten Ligen und bleibt dann stehen. In der eigenen Liga sinkt die Zahl der ≥ 85er ab 2015 von ≈ 17 auf ≈ 10–12 (die Stars gehen nach England/Spanien/Italien).
- **Finanzen der KI:** Gehaltsquote Ø 0,54–0,64 durchgehend, Konto/Umsatz Median 0,2–0,3, im Minus Ø 1–3 von 18 Vereinen, kein Punktabzug in Liga 1. Kein Verein explodiert oder implodiert.
- **Transfers:** Spitzenablöse je Saison Median 84 % der Kurve (vorher wie nachher), selten darüber (max 108 %).
- **Jugend:** Eigengewächse in Liga 1 von ≈ 25 (1975–84) auf ≈ 100–130 (ab 2005); viel Investition (Ø 81) bringt je Verein ≈ 82–90 Akademie-Profis, wenig Investition (Ø 45–52) ≈ 7–11 – Investieren lohnt sich deutlich.
- **Zuschauer:** Ø ≈ 21.000 (70er/80er) → ≈ 32.000 (90er) → ≈ 38.000–41.000 ab 2005, danach stabil.
- **Trainerkarussell:** 4–7 Trainerwechsel je Saison in Liga 1, durchgehend.
- **Aufsteiger:** Ø Platz 13,4, ≈ 2–3 % landen in den Top 3, einer von ≈ 300 wird Meister.
- **Rechenzeit:** Tag Ø 20–80 ms, Saisonwechsel 1,5–8 s je nach Last der Maschine (zwei bis vier Läufe parallel auf 2 Kernen) – kein Wachstum über die Jahrzehnte erkennbar. Heap 230 MB (1975) → 400–480 MB ab 2005, danach stabil.
- **Speicher:** Spielstand (JSON unkomprimiert) 18,5 MB (2000) → 22,9 (2025) → 26,6 (2050) → 28,4 MB (2075). Wachstum nach 2025 ≈ 60 KB je Saison, vor allem Archive mit voller Historie: `leagueArchive` (+28 KB/Saison), `clubTransfers`/`worldTransfers` (je ≈ +9 KB), `youthComps` (+10 KB), `clubRecords`, `archive`. `leagueResults` ist bei 40 Saisons gedeckelt (≈ 5 MB).

## Offene Punkte (nicht geändert)

- **Vereinsumsätze sinken nach 2015 real** (Median Liga 1 ≈ 5,5 Mio. → ≈ 3,8–4,2 Mio. in 1975-Kaufkraft): Die Wirtschafts-Basis (`economyScale`, Stützwerte bis 2030) wächst 2020–2030 schneller als die einzelnen Erlösarten (TV-Verträge 2021–2025 fast flach, Spieltag-Anteil sinkt planmäßig auf 11 %). Kosten (Gehälter, Bau) laufen mit der Basis, deshalb sind die KI-Konten ab 2025 etwa halb so dick (real 1,1–1,4 → 0,4–0,6 Mio.). Stabil, aber knapper. Eine Anpassung der Stützwerte 2024/2030 wäre ein Eingriff in die Finanzkalibrierung (`test:finance`) – bewusst offen gelassen.
- **Autopilot des eigenen Vereins hortet Geld:** Konto real 10–12 Mio. (≈ 2,5 Jahresumsätze) ab 2025, dadurch prägt der eigene Verein im Sim die Meisterliste nach 2025 (fra: Frankfurt Rot 18 Titel). Betrifft nur `simAutoManage`, nicht das Spiel eines Menschen; Meisterstatistik deshalb immer auch ohne eigenen Verein lesen.
- **Eigener Verein in der untersten simulierten Liga kann nicht absteigen** (`ensureProtected` in data/reformSteady.ts): Göttingen wurde im Autopiloten 1982–1990 neunmal Letzter der 2. Liga, danach 16-mal Letzter der Regionalliga, mit Punktabzügen und einem „Zwangsabstieg“ – und blieb jedes Mal drin. Gewollt (der Verein fällt nie aus der Pyramide), aber das Risiko „Abstieg“ fehlt ganz unten. Lösung bräuchte eine Amateurliga mit vollem Kader für den eigenen Verein.
- **Kleiner Verein im Autopiloten:** Personalkosten des echten Stabs (≈ 25 % des Umsatzes) plus Gehälter nach KI-Haushalt → Dauerschulden. Sim-Artefakt (der KI-Haushalt kennt den Stab des eigenen Vereins nicht), für einen Menschen nicht maßgeblich.
- **Ligaruf bleibt nahe an 2025** trotz auslaufender Lenkung: Der „verdiente Ruf“ (Rang der Fünfjahreswertung → k-höchster historischer Wert des Jahres, nach 2025 also die Werte von 2025) und das daraus folgende Landesniveau stabilisieren die Rangordnung selbst. England 100 / Italien ≈ 93 / Spanien ≈ 92 bis 2075. Mehr Bewegung bräuchte eine Änderung am freien Modus.
- **Jugend-Marktwerte über dem Profiwert:** `youthShared.baseMarketValue` = halber **ungedeckelter** Profi-Rohwert; der Profi-Marktwert (`marketValueFor`) skaliert den Rohwert mit Kurve ÷ Bezugswert (1975 ≈ 0,17, ab 2026 ≈ 0,28). Ein Talent ist dadurch in der Jugend 2–3 × mehr wert als derselbe Spieler als Profi und verliert beim Hochziehen an Wert. Nicht geändert (wirkt auf Ausbildungsentschädigung/Jugendmarkt).
- **Mitgliedsbeiträge eigener Verein** steigen nach 2025 noch langsam (Anteil 4 % → 6–7 % bis 2065), weil die Obergrenze in Mitgliedern gilt und die Umsätze real sinken (siehe oben).
- **Vorher schon rot** (nicht durch diese Änderungen, geprüft auf dem Ausgangsstand 295a5d3): `test:history` („Kein Auslandsverein mit historischer Kurve in der Startwelt“ – der Test sucht „Paris“/Vereinsnamen, die in der Startwelt anders heißen) und `test:marketing` (Braunschweig 1978 „Werbung trägt sich auf jeder Stufe“, ×0,90 am Anschlag).

## Prüfungen

`npm run check` 0 Fehler · `npm run build` · `npm run test:newgame-repro` grün · `npm run test:season 1` grün · `test:leaguerep`, `test:youth`, `test:transfers`, `test:finance`, `test:legends`, `test:budget`, `test:ai`, `test:grounds` grün · `test:history`/`test:marketing` wie auf dem Ausgangsstand (siehe oben) · `test:dressing 2` ohne zusätzliche Meldungen gegenüber dem Ausgangsstand (2 statt 3 – die Langzeitprüfungen brauchen mehr Saisons; der volle Lauf mit 30 Saisons war neben den Sims nicht in der Zeit möglich).

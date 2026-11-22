# Balance: KI-Stäbe vorher/nachher (Haushalt, Spitze ≥ 85, Meister)

Stand 22.11.2026. Abgleich der Einführung voller KI-Stäbe (Commits `fe73e83` … `7aa66f3`) mit dem Stand davor
(`269ae36`, Merge-Basis vor den staffai-Commits) und mit den Ausgleichen dieses Branches.

**Lauf:** `SEED=<s> CLUB=<c> TOP=1 BAL=1 STAFF=1 FIN=1 node scripts/sim.mjs 40` (1975/76 … 2014/15), Seeds
1975/fra, 11/muc, 7/fra, 23/muc, dazu für engere Mittelwerte 3/fra, 42/muc, 99/fra, 5/muc.
Werte = Mittel der Saisons je Jahrzehnt (Spieler ≥ 85/≥ 90 aus den `TOP`-Jahrzehntzeilen, Konto/Umsatz aus `BAL`,
KI-Konto real aus `LONG`, Personalquote aus `FLUSS` „Gehalt+Stab“, Trainerteams aus `COACH`).

| Stand | Inhalt |
|---|---|
| vorher (269ae36) | KI-Vereine ohne echten Stab (pauschaler Betreuerstab 18 % in `computeMonthly`, Co-/Torwarttrainer vom Arbeitsmarkt) |
| main (7aa66f3) | volle KI-Stäbe mit Gehältern, Stab-Faktor −4 % … +2 %, Abwerben |
| nur Haushalt | main + Stabkosten in der KI-Haushaltsplanung (Zwischenstand) |
| nachher (Branch) | nur Haushalt + Nachbesetzung von Co-/Torwarttrainer auf Vereinsniveau |

## Befund

1. **Haushalt.** Mit main zahlen KI-Vereine ihren Stab zusätzlich, planen ihn aber nicht ein: Personalquote
   +3–6 Punkte, KI-Konto/Umsatz 0,22–0,27 statt 0,29–0,34 (−20 bis −25 %).
2. **Spitze ≥ 85.** Der Rückgang 1995–2004 ist echt (4 Seeds: 16,1 → 14,4), Ursache zweigeteilt:
   - *Geld:* Niedrigere Konten → kleinere Transferbudgets, Leistungsträger bleiben seltener in der Liga.
     Mit dem Haushaltsausgleich allein: 1995–2004 15,4 (8 Seeds, vorher 15,7), 2005–14 auf Vorher-Niveau.
   - *Trainerteams:* Ligaweit greift die Trainer-Decke öfter (44 → 53 Spieler 1975–84) und das Lerntempo sinkt.
     Die Top-6 sind nicht betroffen (Co-Trainer Ø 82–87 wie vorher), sondern die kleineren Vereine: Fiel ein
     Co-Trainer weg (Abwerben, Beförderung zum Cheftrainer, neuer Trainer bringt eigenen Co mit), besetzte die KI
     die Stelle monatlich mit dem besten Freien oder einem Quereinsteiger 1–3,5 Punkte *unter* ihrem Anspruch –
     früher galt eine leere Stelle als „normal besetzt“ (Vereinsniveau).
3. **Meister-Vielfalt** bleibt im alten Rahmen (Ø 6,75 → 7,25 verschiedene Meister in 40 Saisons, Rekordmeister
   Ø 18,8 → 17,1 Titel).

## Änderungen

- `engine/clubEconomy.ts` `runAiEconomy`: neues Feld `staffAnnual` im Kontext. Der Personalrahmen
  (Quote × Umsatz nach Betrieb, gedeckelt durch `room`) deckt Spieler **und** Stab: Die Jahreskosten des Stabs gehen
  vom Spieler-Gehaltsrahmen ab, höchstens 20 % des Rahmens (Spitzengehälter bleiben bezahlbar).
- `game/staffAi.ts` `aiStaffAnnual` (Monatsgehälter × 12 inkl. Cheftrainer), übergeben in `game/seasonFinance.ts`.
- `game/staffAi.ts` `aiFillClub`: Co- und Torwarttrainer (`COACH_ROLES`) – Freie nur ab Anspruch −2,5 (sonst −4),
  Quereinsteiger auf Anspruch −0 … −1,5 (sonst −1 … −3,5), ein zu schwacher Amtsinhaber wird dann auch ersetzt.
  Die neue Mechanik (Stäbe, Faktor, Abwerben, Gehälter) bleibt unverändert.
- `tests/sim.ts` Zeile `COACH`: `Top6 Ø … Co Ø … Decke ≥78 …` (Trainerteams der sechs größten Vereine).
- `tests/staff-ai-checks.ts`: Haushalt-Prüfung (Stabkosten mindern die Spielergehälter, höchstens um ihren Betrag;
  1995, größter Verein: Stab ≈ 2,3 Mio. DM/Jahr nominal → Spielergehälter −4,9 %).

## Ergebnis nachher (8 Seeds)

- Spieler ≥ 85: 18,6 / 19,4 / 15,8 / 17,2 (vorher 19,1 / 20,2 / 15,7 / 17,9) – Abweichungen im Rahmen des
  Seed-Rauschens (Streuung je Seed ±1,5).
- Trainerteams: Ø Niveau, Decke und Lerntempo wieder wie vorher (z. B. 1985–94 Decke 42 wie vorher, Lerntempo 1,036).
- KI-Konto/Umsatz 0,28–0,32 (vorher 0,29–0,34, main 0,22–0,27); Rest ≈ −5 bis −9 %, weil Gehälter nur schrittweise
  nachgeführt werden und Neuverpflichtungen ihr Gehalt außerhalb der Haushaltsplanung bekommen.
- Personalquote Spieler+Stab 0,59–0,69 (vorher 0,57–0,68): Stab ist echter Aufwand, die Spielergehälter sinken nur
  um ihn, nicht darüber hinaus.

**Offen:** 2005–14 ≥ 85 und ≥ 90 knapp unter vorher (−0,7 bzw. −0,4) – innerhalb des Rauschens, bei weiteren
Änderungen an Stäben oder Finanzen mit denselben 8 Seeds nachmessen.

## Tabellen

### Spieler ≥ 85 in Liga 1 (Ø je Saison) je Seed

| Seed / Verein | Stand | 1975–84 | 1985–94 | 1995–2004 | 2005–14 |
|---|---|---|---|---|---|
| 1975 / fra | vorher (269ae36) | 19.3 | 18.9 | 16.4 | 17.8 |
| 1975 / fra | main (7aa66f3) | 19.2 | 19.2 | 16.1 | 15.6 |
| 1975 / fra | nur Haushalt | 18.3 | 17.1 | 16.0 | 17.7 |
| 1975 / fra | nachher (Branch) | 19.6 | 20.8 | 15.3 | 18.4 |
| 11 / muc | vorher (269ae36) | 20.0 | 19.7 | 17.2 | 18.1 |
| 11 / muc | main (7aa66f3) | 19.1 | 17.9 | 14.3 | 15.3 |
| 11 / muc | nur Haushalt | 19.5 | 15.1 | 14.9 | 15.9 |
| 11 / muc | nachher (Branch) | 18.8 | 18.5 | 16.4 | 18.5 |
| 7 / fra | vorher (269ae36) | 17.6 | 19.7 | 16.6 | 17.1 |
| 7 / fra | main (7aa66f3) | 19.0 | 19.0 | 13.7 | 16.1 |
| 7 / fra | nur Haushalt | 18.2 | 18.8 | 14.9 | 16.3 |
| 7 / fra | nachher (Branch) | 18.3 | 18.9 | 16.7 | 16.4 |
| 23 / muc | vorher (269ae36) | 19.5 | 21.2 | 14.0 | 16.8 |
| 23 / muc | main (7aa66f3) | 19.0 | 20.2 | 13.7 | 19.2 |
| 23 / muc | nur Haushalt | 19.7 | 22.3 | 15.2 | 19.4 |
| 23 / muc | nachher (Branch) | 19.4 | 20.1 | 14.0 | 16.7 |
| 3 / fra | vorher (269ae36) | 19.7 | 19.9 | 13.3 | 17.8 |
| 3 / fra | nur Haushalt | 19.5 | 20.1 | 16.0 | 21.2 |
| 3 / fra | nachher (Branch) | 18.6 | 17.8 | 14.5 | 17.7 |
| 42 / muc | vorher (269ae36) | 18.2 | 19.8 | 16.2 | 20.8 |
| 42 / muc | nur Haushalt | 18.1 | 21.1 | 16.4 | 18.5 |
| 42 / muc | nachher (Branch) | 17.7 | 20.0 | 16.6 | 17.4 |
| 99 / fra | vorher (269ae36) | 19.0 | 20.7 | 16.6 | 16.2 |
| 99 / fra | nur Haushalt | 18.2 | 19.2 | 15.0 | 17.3 |
| 99 / fra | nachher (Branch) | 18.0 | 20.2 | 15.1 | 16.0 |
| 5 / muc | vorher (269ae36) | 19.1 | 22.1 | 14.9 | 18.6 |
| 5 / muc | nur Haushalt | 18.2 | 18.9 | 15.1 | 18.1 |
| 5 / muc | nachher (Branch) | 18.1 | 18.9 | 17.5 | 16.2 |

### Mittelwerte


**4 Seeds (1975/fra, 11/muc, 7/fra, 23/muc)**

| Kennzahl | Stand | 1975–84 | 1985–94 | 1995–2004 | 2005–14 |
|---|---|---|---|---|---|
| ≥ 85 (Liga 1) | vorher (269ae36) | 19.1 | 19.9 | 16.1 | 17.5 |
| ≥ 85 (Liga 1) | main (7aa66f3) | 19.1 | 19.1 | 14.4 | 16.6 |
| ≥ 85 (Liga 1) | nur Haushalt | 18.9 | 18.3 | 15.2 | 17.3 |
| ≥ 85 (Liga 1) | nachher (Branch) | 19.0 | 19.6 | 15.6 | 17.5 |
| ≥ 90 (Liga 1) | vorher (269ae36) | 1.6 | 2.2 | 1.7 | 2.8 |
| ≥ 90 (Liga 1) | main (7aa66f3) | 1.3 | 2.5 | 2.7 | 3.7 |
| ≥ 90 (Liga 1) | nur Haushalt | 1.8 | 2.7 | 2.1 | 2.5 |
| ≥ 90 (Liga 1) | nachher (Branch) | 1.8 | 3.1 | 1.8 | 2.6 |
| KI-Konto / Umsatz (Median) | vorher (269ae36) | 0.312 | 0.291 | 0.333 | 0.293 |
| KI-Konto / Umsatz (Median) | main (7aa66f3) | 0.237 | 0.227 | 0.266 | 0.224 |
| KI-Konto / Umsatz (Median) | nur Haushalt | 0.302 | 0.273 | 0.324 | 0.301 |
| KI-Konto / Umsatz (Median) | nachher (Branch) | 0.287 | 0.262 | 0.309 | 0.288 |
| KI-Konto Median (Mio., 1975-Kaufkraft) | vorher (269ae36) | 1.14 | 1.13 | 1.35 | 1.43 |
| KI-Konto Median (Mio., 1975-Kaufkraft) | main (7aa66f3) | 0.97 | 0.80 | 1.03 | 1.03 |
| KI-Konto Median (Mio., 1975-Kaufkraft) | nur Haushalt | 1.07 | 0.91 | 1.43 | 1.27 |
| KI-Konto Median (Mio., 1975-Kaufkraft) | nachher (Branch) | 1.04 | 0.89 | 1.35 | 1.22 |
| Personalquote Spieler+Stab (FLUSS) | vorher (269ae36) | 0.577 | 0.659 | 0.677 | 0.675 |
| Personalquote Spieler+Stab (FLUSS) | main (7aa66f3) | 0.602 | 0.696 | 0.740 | 0.712 |
| Personalquote Spieler+Stab (FLUSS) | nur Haushalt | 0.584 | 0.669 | 0.695 | 0.680 |
| Personalquote Spieler+Stab (FLUSS) | nachher (Branch) | 0.589 | 0.678 | 0.694 | 0.683 |
| Trainerteams Ø Niveau | vorher (269ae36) | 78.7 | 79.1 | 78.0 | 77.6 |
| Trainerteams Ø Niveau | main (7aa66f3) | 78.3 | 77.0 | 76.6 | 76.6 |
| Trainerteams Ø Niveau | nur Haushalt | 77.9 | 77.4 | 77.7 | 77.2 |
| Trainerteams Ø Niveau | nachher (Branch) | 78.4 | 77.8 | 77.9 | 77.3 |
| Decke greift (Spieler) | vorher (269ae36) | 46 | 40 | 43 | 40 |
| Decke greift (Spieler) | main (7aa66f3) | 48 | 51 | 51 | 49 |
| Decke greift (Spieler) | nur Haushalt | 55 | 50 | 50 | 49 |
| Decke greift (Spieler) | nachher (Branch) | 48 | 43 | 40 | 45 |
| Lerntempo ≤ 27 | vorher (269ae36) | 1.014 | 1.035 | 1.025 | 1.018 |
| Lerntempo ≤ 27 | main (7aa66f3) | 1.007 | 1.023 | 1.017 | 1.022 |
| Lerntempo ≤ 27 | nur Haushalt | 1.003 | 1.028 | 1.019 | 1.016 |
| Lerntempo ≤ 27 | nachher (Branch) | 1.010 | 1.036 | 1.026 | 1.025 |

**8 Seeds (zusätzlich 3/fra, 42/muc, 99/fra, 5/muc)**

| Kennzahl | Stand | 1975–84 | 1985–94 | 1995–2004 | 2005–14 |
|---|---|---|---|---|---|
| ≥ 85 (Liga 1) | vorher (269ae36) | 19.1 | 20.2 | 15.7 | 17.9 |
| ≥ 85 (Liga 1) | nur Haushalt | 18.7 | 19.1 | 15.4 | 18.1 |
| ≥ 85 (Liga 1) | nachher (Branch) | 18.6 | 19.4 | 15.8 | 17.2 |
| ≥ 90 (Liga 1) | vorher (269ae36) | 1.7 | 2.9 | 2.2 | 3.0 |
| ≥ 90 (Liga 1) | nur Haushalt | 1.6 | 3.0 | 2.2 | 3.3 |
| ≥ 90 (Liga 1) | nachher (Branch) | 1.5 | 2.8 | 1.9 | 2.6 |
| KI-Konto / Umsatz (Median) | vorher (269ae36) | 0.316 | 0.300 | 0.338 | 0.298 |
| KI-Konto / Umsatz (Median) | nur Haushalt | 0.289 | 0.281 | 0.325 | 0.299 |
| KI-Konto / Umsatz (Median) | nachher (Branch) | 0.289 | 0.279 | 0.315 | 0.289 |
| KI-Konto Median (Mio., 1975-Kaufkraft) | vorher (269ae36) | 1.17 | 1.12 | 1.37 | 1.37 |
| KI-Konto Median (Mio., 1975-Kaufkraft) | nur Haushalt | 1.07 | 0.95 | 1.46 | 1.31 |
| KI-Konto Median (Mio., 1975-Kaufkraft) | nachher (Branch) | 1.08 | 0.96 | 1.35 | 1.23 |
| Personalquote Spieler+Stab (FLUSS) | vorher (269ae36) | 0.571 | 0.656 | 0.681 | 0.676 |
| Personalquote Spieler+Stab (FLUSS) | nur Haushalt | 0.588 | 0.669 | 0.695 | 0.682 |
| Personalquote Spieler+Stab (FLUSS) | nachher (Branch) | 0.588 | 0.672 | 0.692 | 0.682 |
| Trainerteams Ø Niveau | vorher (269ae36) | 78.8 | 78.8 | 78.2 | 77.9 |
| Trainerteams Ø Niveau | nur Haushalt | 78.0 | 77.8 | 78.1 | 77.3 |
| Trainerteams Ø Niveau | nachher (Branch) | 78.4 | 78.3 | 78.3 | 77.3 |
| Decke greift (Spieler) | vorher (269ae36) | 44 | 42 | 41 | 40 |
| Decke greift (Spieler) | nur Haushalt | 53 | 47 | 44 | 45 |
| Decke greift (Spieler) | nachher (Branch) | 48 | 42 | 39 | 47 |
| Lerntempo ≤ 27 | vorher (269ae36) | 1.014 | 1.033 | 1.026 | 1.021 |
| Lerntempo ≤ 27 | nur Haushalt | 1.005 | 1.027 | 1.023 | 1.017 |
| Lerntempo ≤ 27 | nachher (Branch) | 1.010 | 1.036 | 1.029 | 1.022 |

### Meister-Vielfalt (40 Saisons)

| Seed / Verein | vorher (269ae36) | main (7aa66f3) | nur Haushalt | nachher (Branch) |
|---|---|---|---|---|
| 1975 / fra | 7 (FRR 19) | 7 (MÜR 19) | 6 (KÖR 14) | 8 (MÜR 16) |
| 11 / muc | 7 (MÜR 24) | 5 (MÜR 15) | 9 (MÜR 16) | 7 (MÜR 16) |
| 7 / fra | 7 (MÜR 26) | 8 (FRR 17) | 6 (MÜR 28) | 7 (MÜR 22) |
| 23 / muc | 10 (MÜR 12) | 9 (DRE 15) | 6 (GEL 16) | 6 (DÜS 16) |
| 3 / fra | 7 (FRR 18) | – | 5 (MÜR 23) | 8 (FRR 14) |
| 42 / muc | 5 (HAB 24) | – | 7 (MÜR 11) | 7 (FRR 18) |
| 99 / fra | 5 (FRR 12) | – | 7 (FRR 13) | 8 (HAB 14) |
| 5 / muc | 6 (HAB 15) | – | 9 (HAB 15) | 7 (MÜR 21) |

vorher (269ae36): Ø 6.75 verschiedene Meister, Ø Rekordmeister 18.8 Titel (8 Läufe)
main (7aa66f3): Ø 7.25 verschiedene Meister, Ø Rekordmeister 16.5 Titel (4 Läufe)
nur Haushalt: Ø 6.88 verschiedene Meister, Ø Rekordmeister 17.0 Titel (8 Läufe)
nachher (Branch): Ø 7.25 verschiedene Meister, Ø Rekordmeister 17.1 Titel (8 Läufe)

# Zwei Beispiel-Monatsbilanzen 1975 — Frankfurt Rot

Beide Bilanzen sind **mit den Formeln des implementierten Finanzsystems** gerechnet
(`src/engine/finances.ts`, `src/engine/infrastructure.ts`, `src/engine/economy.ts`, `FINANZEN_SPEC.md`).
Wirtschafts-Skalierung `scale = economyScale(1975) = 1.0` (reine 1975-DM-Basis), Zuschauer-Nachfrage 1975 = 1,0.
Ein typischer Monat der Hinrunde enthält **2 Liga-Heimspiele**.

**Verein:** Frankfurt Rot — Ruf 80, Stadionkapazität 62.000, fairer Eintritt `3 + 80 × 0,07 = 8,60 DM`,
gleicher Kader in beiden Szenarien.

> **Hinweis Spielergehälter:** Das Marktgehalt ist `1.400 × 2^((Stärke − 72) / 11)` DM/Woche.
> Für einen Ruf-80-Kader (~24 Spieler, Ø-Stärke ~73) ergibt sich eine **Wochenlohnsumme von rund
> 42.000 DM** (≈ 2,2 Mio. DM im Jahr) — Recherche: Spieleraufwand 1,3–2,6 Mio. DM.
> Monatslohn `42.000 × 4,33 = 181.860 DM`, in beiden Bilanzen gleich.

---

## Szenario A — Erfolgreiche Saison: viele Zuschauer, ausgebaute Gebäude

**Sportliche Lage:** Platz 2 (Vorsaison ebenfalls oben), das Stadion ist gut gefüllt.
**Gebäudeausbau:** Trainingszentrum St. 4, Jugendakademie St. 3, Medizin St. 3, Fanshop St. 4,
**Catering St. 4 im Eigenbetrieb**.
**Verträge:** Trikot „National" 275.000 DM/Jahr, Banden 235.000 DM/Jahr.

**Parameter:** Eintritt 9 DM, **33.000 Zuschauer/Heimspiel** (Auslastung 53 %), Stadionzustand 85.
Monat mit **1 Sieg + 1 Unentschieden** zu Hause. TV-Anteil nach Platz 2 der Vorsaison:
`4,2 Mio. / 18 × (0,85 + 0,15 × 2 × 0,94) ≈ 264.000 DM/Jahr`.

### Einnahmen

| Posten | Rechnung | Betrag (DM) |
|---|---|---:|
| Eintritt (Stadion) | 2 × 33.000 × 9 | **594.000** |
| Fanartikel | 2 × 33.000 × 0,474 (0,316 × Fanshop-Faktor 1,5) | **31.284** |
| Catering / Würstchenbuden | 2 × 33.000 × 1,35 (Eigenbetrieb St. 4) | **89.100** |
| Programmhefte & Spieltag | 2 × 33.000 × 0,25 | **16.500** |
| TV-Gelder (zentral) | 264.000 / 12 | **22.000** |
| Trikotsponsoring | 275.000 / 12 | **22.917** |
| Bandenwerbung | 235.000 / 12 | **19.583** |
| Mitgliedsbeiträge | 2.750 Mitglieder × 40 / 12 | **9.167** |
| Leistungsprämien (Sponsoren) | Sieg (6.000 + 80 × 50) + Remis 2.000 | **12.000** |
| Platzierungsbonus (Sponsor) | Platz ≤ 3 | **9.000** |
| **Summe Einnahmen** | | **825.551** |

### Ausgaben

| Posten | Rechnung | Betrag (DM) |
|---|---|---:|
| Spielergehälter | 42.000 × 4,33 | **181.860** |
| Auflauf-/Siegprämien | Sieg 0,55 × 42.000 + Remis 0,2 × 42.000 | **31.500** |
| Betreuerstab | 18 % der Spielergehälter | **32.735** |
| Stadionunterhalt | 62.000 × 0,3 + (100 − 85) × 250 | **22.350** |
| Gebäude-Fixkosten | TZ 3.500 + Jugend 1.995 + Med. 1.663 + Fanshop 1.750 + Catering 9.000 | **17.908** |
| Sonstige Betriebskosten | 2.500 + 80 × 200 | **18.500** |
| **Summe Ausgaben** | | **304.853** |

### Monatssaldo A: **+520.698 DM**

---

## Szenario B — Durchwachsene Saison: weniger Zuschauer, sparsamer Ausbau

**Sportliche Lage:** Platz 12 (Vorsaison ebenfalls Mittelfeld), das Stadion ist nur zu gut einem Drittel gefüllt.
**Gebäudeausbau:** Trainingszentrum St. 2, Jugendakademie St. 2, Medizin St. 2, Fanshop St. 2,
**Catering St. 2 in Verpachtung**.
**Verträge:** Trikot „Regional" 100.000 DM/Jahr, Banden 130.000 DM/Jahr.

**Parameter:** Eintritt 9 DM, **22.000 Zuschauer/Heimspiel** (Auslastung 35 %), Stadionzustand 65.
Monat mit **1 Unentschieden + 1 Niederlage** zu Hause. TV-Anteil nach Platz 12: ≈ 223.000 DM/Jahr.

### Einnahmen

| Posten | Rechnung | Betrag (DM) |
|---|---|---:|
| Eintritt (Stadion) | 2 × 22.000 × 9 | **396.000** |
| Fanartikel | 2 × 22.000 × 0,363 (0,316 × Fanshop-Faktor 1,15) | **15.990** |
| Catering / Würstchenbuden | 2 × 22.000 × 0,28 (Verpachtung St. 2) + Monatspacht 6.000 | **18.320** |
| Programmhefte & Spieltag | 2 × 22.000 × 0,25 | **11.000** |
| TV-Gelder (zentral) | 223.000 / 12 | **18.583** |
| Trikotsponsoring | 100.000 / 12 | **8.333** |
| Bandenwerbung | 130.000 / 12 | **10.833** |
| Mitgliedsbeiträge | 2.750 Mitglieder × 40 / 12 | **9.167** |
| Leistungsprämien (Sponsoren) | Remis 2.000 | **2.000** |
| Platzierungsbonus (Sponsor) | Platz 12 → keiner | **0** |
| **Summe Einnahmen** | | **490.226** |

### Ausgaben

| Posten | Rechnung | Betrag (DM) |
|---|---|---:|
| Spielergehälter | 42.000 × 4,33 | **181.860** |
| Auflauf-/Siegprämien | Remis 0,2 × 42.000 | **8.400** |
| Betreuerstab | 18 % der Spielergehälter | **32.735** |
| Stadionunterhalt | 62.000 × 0,3 + (100 − 65) × 250 | **27.350** |
| Gebäude-Fixkosten | TZ 1.960 + Jugend 1.470 + Med. 1.225 + Fanshop 980 + Catering 1.100 | **6.735** |
| Sonstige Betriebskosten | 2.500 + 80 × 200 | **18.500** |
| **Summe Ausgaben** | | **275.580** |

### Monatssaldo B: **+214.646 DM**

---

## Hochgerechnet auf die Saison (17 Liga-Heimspiele, ohne Pokal und Transfers)

| Kennzahl | Szenario A | Szenario B |
|---|---:|---:|
| Spieltagserlöse (Eintritt, Fanartikel, Catering, Programm) | 6,21 Mio. | 3,70 Mio. |
| Feste Erlöse (TV, Trikot, Banden, Mitglieder, Pacht, Bonus) | 0,99 Mio. | 0,64 Mio. |
| Sponsoren-Prämien (A: 20 S/8 U, B: 10 S/9 U) | 0,22 Mio. | 0,12 Mio. |
| **Umsatz** | **≈ 7,4 Mio.** | **≈ 4,5 Mio.** |
| Gehälter, Prämien, Stab | 3,10 Mio. | 2,88 Mio. |
| Stadion, Gebäude, Sonstiges | 0,71 Mio. | 0,63 Mio. |
| **Ergebnis vor Transfers** | **≈ +3,6 Mio.** | **≈ +1,0 Mio.** |

Szenario B entspricht dem Recherche-Mittel (≈ 4,5 Mio. DM Umsatz), Szenario A einem großen Zuschauermagneten
(Recherche-Korridor bis ≈ 8,3 Mio.). Das Ergebnis vor Transfers ist das Geld für Zugänge: 1975 kostet ein Spitzenspieler
0,5–1,5 Mio. DM Ablöse (Rekordkurve), also ein bis zwei Spitzentransfers im guten Jahr, im mittleren Jahr keiner.

## Vergleich & Interpretation

- **Eintritt bleibt der größte Hebel** (72 % bzw. 81 % der Einnahmen). 11.000 Zuschauer mehr pro Spiel
  bringen allein rund **198.000 DM** zusätzlich pro Monat — die von der Recherche belegte Dominanz der
  Stadioneinnahmen 1975.
- **Catering im Eigenbetrieb** (1,35 DM/Kopf) statt Verpachtung (0,28 DM/Kopf + Pacht) macht die Würstchenbuden
  zu einer ernsthaften Einnahmequelle (~89.000 statt ~18.000 DM) — aber nur bei vollem Haus und mit höheren
  Fixkosten (9.000 statt 1.100 DM).
- **Fanartikel** sind 1975 ein Nebenposten (Schals, Wimpel); sie wachsen erst mit der Vermarktung der 1990er.
- **TV-Geld** ist eine kleine, fast gleich verteilte Grundzahlung (≈ 220.000–265.000 DM im Jahr).
- **Erfolg kostet auch:** Siegprämien an die Mannschaft steigen mit jedem Sieg (A zahlt 31.500 statt 8.400 DM).
  Trotzdem überwiegt der Zuschauereffekt deutlich.

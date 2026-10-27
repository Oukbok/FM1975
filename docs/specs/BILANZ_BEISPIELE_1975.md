# Zwei Beispiel-Monatsbilanzen 1975 — Frankfurt Rot

Beide Bilanzen sind **exakt mit den Formeln des implementierten Finanzsystems** gerechnet
(`src/engine/finances.ts` + `src/engine/infrastructure.ts`, `FINANZEN_SPEC.md`).
Wirtschafts-Skalierung `scale = economyScale(1975) = 1.0` (reine 1975-DM-Basis).
Ein typischer Monat der Hinrunde enthält **2 Liga-Heimspiele**.

**Verein:** Frankfurt Rot — Ruf 80, Stadionkapazität 62.000, gleicher Kader in beiden Szenarien.

> **Hinweis Spielergehälter:** Die Wochengehälter werden pro Spieler zufalls­generiert
> (`overall × 120 + Zufall`). Für einen ruf-80-Kader (~24 Spieler, Ø-Stärke ~70) ergibt sich
> ein **repräsentativer** Monatslohn von rund **750.000 DM** (Wochenlohnsumme ~173.000 DM × 4,33).
> Dieser Wert ist in beiden Bilanzen identisch angesetzt, da es derselbe Kader ist.

---

## Szenario A — Erfolgreiche Saison: viele Zuschauer, ausgebaute Gebäude

**Sportliche Lage:** Frankfurt Rot spielt oben mit (Tabellenplatz 2), das Stadion ist fast voll.
**Gebäudeausbau:** Trainingszentrum St. 4, Jugendakademie St. 3, Medizin St. 3, Fanshop St. 4,
**Catering St. 4 im Eigenbetrieb** (höchster Pro-Kopf-Erlös).
**Verträge:** Trikot „National" 275.000 DM/Jahr, Banden 235.000 DM/Jahr.

**Parameter:** Ticketpreis 14 DM, Auslastung ~89 % → **55.000 Zuschauer/Heimspiel**,
Stadionzustand 85. Monat mit **1 Sieg + 1 Unentschieden** zu Hause. Tabellenplatz 2 → Platzierungsbonus 30.000.

### Einnahmen

| Posten | Rechnung | Betrag (DM) |
|---|---|---:|
| Eintritt (Stadion) | 2 × 55.000 × 14 | **1.540.000** |
| Fanartikel | 2 × 55.000 × 7,80 (Ø 5,20 × Fanshop-Faktor 1,5) | **858.000** |
| Catering / Würstchenbuden | 2 × 55.000 × 1,35 (Eigenbetrieb St. 4) | **148.500** |
| Programmhefte & Spieltag | 2 × 55.000 × 0,25 | **27.500** |
| TV- / Mediengelder | 2 × (20.000 + 80×400) | **104.000** |
| Trikotsponsoring | 275.000 / 12 | **22.917** |
| Bandenwerbung | 235.000 / 12 | **19.583** |
| Mitgliedsbeiträge | (30.000 + 80×1.000) / 12 | **9.167** |
| Leistungsprämien | Sieg (25.000+16.000) + Remis (8.000) | **49.000** |
| Platzierungsbonus (Sponsor) | Platz ≤ 3 | **30.000** |
| **Summe Einnahmen** | | **2.808.667** |

### Ausgaben

| Posten | Rechnung | Betrag (DM) |
|---|---|---:|
| Spielergehälter | Kaderlohn (repräsentativ, s. o.) | **750.000** |
| Betreuerstab | 18 % der Spielergehälter | **135.000** |
| Stadionunterhalt | 62.000×0,9 + (100−85)×800 | **67.800** |
| Gebäude-Fixkosten | TZ 10.000 + Jugend 5.700 + Med. 4.750 + Fanshop 5.000 + Catering 9.000 | **34.450** |
| Sonstige Betriebskosten | 6.000 + 80×500 | **46.000** |
| **Summe Ausgaben** | | **1.033.250** |

### Monatssaldo A: **+1.775.417 DM**

---

## Szenario B — Durchwachsene Saison: weniger Zuschauer, sparsamer Ausbau

**Sportliche Lage:** Frankfurt Rot steckt im Mittelfeld fest (Tabellenplatz 12), das Stadion ist nur mäßig gefüllt.
**Gebäudeausbau:** Trainingszentrum St. 2, Jugendakademie St. 2, Medizin St. 2, Fanshop St. 2,
**Catering St. 2 in Verpachtung** (niedriger Pro-Kopf-Erlös, dafür feste Monatspacht).
**Verträge:** Trikot „Regional" 100.000 DM/Jahr, Banden 130.000 DM/Jahr.

**Parameter:** Ticketpreis 14 DM, Auslastung ~60 % → **37.000 Zuschauer/Heimspiel**,
Stadionzustand 65. Monat mit **1 Unentschieden + 1 Niederlage** zu Hause. Tabellenplatz 12 → kein Platzierungsbonus.

### Einnahmen

| Posten | Rechnung | Betrag (DM) |
|---|---|---:|
| Eintritt (Stadion) | 2 × 37.000 × 14 | **1.036.000** |
| Fanartikel | 2 × 37.000 × 5,98 (Ø 5,20 × Fanshop-Faktor 1,15) | **442.520** |
| Catering / Würstchenbuden | 2 × 37.000 × 0,28 (Verpachtung St. 2) + Monatspacht 6.000 | **26.720** |
| Programmhefte & Spieltag | 2 × 37.000 × 0,25 | **18.500** |
| TV- / Mediengelder | 2 × (20.000 + 80×400) | **104.000** |
| Trikotsponsoring | 100.000 / 12 | **8.333** |
| Bandenwerbung | 130.000 / 12 | **10.833** |
| Mitgliedsbeiträge | (30.000 + 80×1.000) / 12 | **9.167** |
| Leistungsprämien | Remis (8.000) + Niederlage (0) | **8.000** |
| Platzierungsbonus (Sponsor) | Platz 12 → keiner | **0** |
| **Summe Einnahmen** | | **1.664.073** |

### Ausgaben

| Posten | Rechnung | Betrag (DM) |
|---|---|---:|
| Spielergehälter | Kaderlohn (repräsentativ, s. o.) | **750.000** |
| Betreuerstab | 18 % der Spielergehälter | **135.000** |
| Stadionunterhalt | 62.000×0,9 + (100−65)×800 | **83.800** |
| Gebäude-Fixkosten | TZ 5.600 + Jugend 4.200 + Med. 3.500 + Fanshop 2.800 + Catering 1.100 | **17.200** |
| Sonstige Betriebskosten | 6.000 + 80×500 | **46.000** |
| **Summe Ausgaben** | | **1.032.000** |

### Monatssaldo B: **+632.073 DM**

---

## Vergleich & Interpretation

| Kennzahl | Szenario A (voll ausgebaut) | Szenario B (sparsam) | Differenz |
|---|---:|---:|---:|
| Zuschauer je Heimspiel | 55.000 | 37.000 | +18.000 |
| Summe Einnahmen | 2.808.667 | 1.664.073 | **+1.144.594** |
| Summe Ausgaben | 1.033.250 | 1.032.000 | +1.250 |
| **Monatssaldo** | **+1.775.417** | **+632.073** | **+1.143.344** |

**Was den Unterschied macht:**

- **Eintritt bleibt der größte Hebel** (~55 % bzw. ~62 % der Einnahmen). 18.000 Zuschauer mehr pro Spiel
  bringen allein rund **504.000 DM** zusätzlich pro Monat — genau die von der Recherche belegte
  Dominanz der Stadioneinnahmen in der Ära 1975.
- **Catering im Eigenbetrieb** (1,35 DM/Kopf) statt Verpachtung (0,28 DM/Kopf + Pacht) verwandelt die
  Würstchenbuden von einem Nebenposten (~27.000 DM) in eine ernsthafte Einnahmequelle (~148.500 DM) —
  aber nur, wenn genug Publikum kommt und man die höheren Fixkosten (9.000 statt 1.100 DM) trägt.
- **Fanartikel** skalieren doppelt: mehr Zuschauer **und** höherer Fanshop-Faktor (1,5 statt 1,15).
- **Sponsoring & Platzierungsbonus** verstärken den Erfolg: der „National"-Trikotvertrag plus der
  30.000-DM-Bonus für Platz 2 hebeln die Kluft weiter auf.
- **Die Ausgaben sind fast identisch** — der ausgebaute Verein zahlt nur ~1.250 DM/Monat mehr
  (höhere Gebäude-Fixkosten, aber besserer Stadionzustand senkt den Unterhalt). Der Ausbau
  **rechnet sich also klar**, solange das Stadion gefüllt ist.

Beide Monate sind positiv — realistisch für einen etablierten Erstligisten 1975 —, aber der Abstand
zeigt, wie stark sportlicher Erfolg (Zuschauer, Prämien, Boni) und kluge Infrastruktur-Entscheidungen
(Eigenbetrieb vs. Verpachtung, Ausbaustufen) das Monatsergebnis auseinandertreiben.

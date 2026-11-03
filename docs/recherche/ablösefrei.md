# Ablösefreie Wechsel in der Bundesliga – Recherche und Soll-Werte

Für die Kalibrierung von `src/game/aiContracts.ts` (KI-Verträge, Vorverträge, Bosman-Verkäufe).
Stand der Recherche: November 2026. Die Datenlage ist dünn: Es gibt keine frei zugängliche
Saison-für-Saison-Zählung ablösefreier Bundesliga-Wechsel zurück bis 1985. Die Soll-Werte unten sind
deshalb **Größenordnungen**, abgeleitet aus den Quellen und auf unsere Sim umgerechnet.

## Regeln (qualitativ, gesichert)
- **Bis 1995:** In Deutschland war auch nach Vertragsende eine Ablöse fällig (Transferentschädigung
  nach Tabelle bzw. Einigung). „Ablösefrei“ waren praktisch nur Karriereende, Wechsel in den
  Amateurbereich mit geringer Entschädigung und Einzelfälle. Das Bosman-Urteil des EuGH
  (15.12.1995) schaffte Ablösen nach Vertragsende für Wechsel innerhalb der EU ab; der deutsche
  Verband übernahm das für den Inlandsmarkt zur Saison 1996/97 (im Spiel ab Sommer 1995, `bosmanActive`).
  Quelle: [bpb – Geld und Spiele](https://www.bpb.de/izpb/8782/geld-und-spiele?p=0),
  [Bosman-Urteil (gazetefutbol)](https://gazetefutbol.de/bosman-urteil-als-ein-belgischer-mittelfeldmann-den-transfermarkt-revolutionierte).
- **Nach Bosman:** Vereine binden Leistungsträger länger und verlängern früher; wer nicht verlängert,
  wird im letzten Vertragsjahr verkauft oder geht per Vorvertrag (ab 1. Januar des letzten Vertragsjahrs
  erlaubt) ablösefrei. Der Anteil ablösefreier Wechsel steigt über die Jahrzehnte mit dem Beratermarkt.

## Zahlen
| Quelle | Bezug | Wert |
|---|---|---|
| [FIFA TMS Global Transfer Market Report 2017](https://inside.fifa.com/en/news/fifa-global-transfer-market-report-a-new-dimension-in-transfer-spendin-2927376) | alle **internationalen** Transfers weltweit (alle Ligen, inkl. Leihen) | 84,2 % ohne Ablöse – nicht vergleichbar (viele Amateure/kleine Ligen) |
| [Econofútbol: Free transfers (Transfermarkt-Daten 2013–2025, 8 Topligen inkl. Bundesliga)](https://econofutbol.github.io/econofutbol/free-transfers) | alle Wechsel in/aus 8 Topligen | ≈ 20 % mit Ablöse, 28 % Ablöse unbekannt, 39 % Leihen, **≈ 13 % echte ablösefreie Wechsel (Vertragsende)**; Anteil über die Jahre stabil |
| [90min: Sommer-Transfers Bundesliga 2026 (alle offiziellen Wechsel)](https://www.90min.de/sommer-transfers-in-der-bundesliga-2026-alle-offiziellen-wechsel-im-uberblick), Stand vor Fensterschluss | 18 Bundesligisten, Profikader | 131 Zugänge, davon **31 ablösefrei (24 %)**, 26 Leihen, 69 mit Ablöse; **42 ablösefreie Abgänge** (≈ 2,3 je Verein, ohne Karriereende) |
| [weltfussball.de: Transfers 2. Bundesliga 2001/02](https://weltfussball.de/transfers/2-bundesliga-2001-2002) | 18 Zweitligisten | 146 Zugänge in der Saison (≈ 8 je Verein; ≈ 80 % im Sommer) – Ablöse nicht ausgewiesen |
| [CIES Football Observatory, Big-5 Weekly Post 247](https://football-observatory.com/IMG/sites/b5wp/2018/247/en/) | Sommer 2018, Big-5 | Spitzenkräfte kommen auch ablösefrei (Emre Can, de Vrij) – Größenordnung „einige je Liga und Saison“ |

Nicht gefunden (offen): eine Zählung je Saison für 1985–2010 und die Zahl der Verkäufe im letzten
Vertragsjahr. Für Letzteres gibt es nur Einzelfälle und die Logik von `sellerPosition` (Abschlag bei
≤ 12 Monaten Restlaufzeit, engine/transferMarket.ts).

## Was die Sim zählt (`game.aiSquadLog`, `AI=1 node scripts/sim.mjs`)
- Nur **KI-Vereine der Spielerliga** (17 bei 18er-Liga, eigener Verein ausgenommen), nur Profikader
  (≈ 22–25 Spieler; real 28–32 inkl. U23/Rückkehrer). Jugend, Amateure, Leihrückkehrer zählen nicht.
- `freeLeaves` = Abgänge **zum Vertragsende ohne Ablöse** (Vorverträge, Spieler ohne neuen Vertrag,
  auslaufende Altstars – auch ins Ausland/unterklassig/Karriereende). Entspricht den „ablösefreien
  Abgängen“ der Bundesliga-Übersichten (+ Karriereenden).
- `pre` = Vorverträge zwischen KI-Vereinen (ablösefreie Wechsel innerhalb der Liga, eher Stammkräfte).
- `bosmanSales` = Verkäufe im letzten Vertragsjahr nach abgelehnter Verlängerung.
- Umrechnung: real ≈ 2,3–3 ablösefreie Abgänge je Verein und Saison bei 30er-Kadern (Sommer 2026, Winter
  und Karriereenden dazu) → bei unseren ≈ 24er-Kadern ≈ 1,9–2,4 je Verein ≈ **32–40 je Saison** (17 KI-Vereine).

## Soll-Werte je Saison (17 KI-Vereine, Profikader) – Grundlage der Kalibrierung
| Epoche | ablösefreie Abgänge | Vorverträge KI↔KI | Bosman-Verkäufe | Begründung |
|---|---|---|---|---|
| 1975–84 | 0–3 | 0 | 0 | Ablöse auch nach Vertragsende; nur Karriereende/Amateure |
| 1985–94 | 1–5 | 0 | 0 | wie oben, etwas mehr Wechsel in den Amateurbereich |
| 1995–2004 | 18–30 | 4–10 | 3–8 | Bosman-Anfangsjahre: Vereine binden länger, Markt lernt (≈ 60–80 % des heutigen Niveaus) |
| 2005–14 | 25–38 | 6–12 | 4–9 | Beratermarkt, Vorverträge üblich |
| ab 2015 | 30–42 | 8–14 | 4–10 | heutiges Niveau (≈ 24 % der Zugänge ablösefrei, ≈ 2,3+ Abgänge je Verein) |

Kaufoptionen bei KI-Leihen (ab 2000): Soll **20–35 % der vereinbarten Optionen werden gezogen**
(Größenordnung aus Einzelfällen; Leihen mit Option sind die Ausnahme, gezogen wird nur bei Stammplatz/guten Noten).

## Kalibrierung (`freeAgentEra` in `src/game/aiContracts.ts`, Stand November 2026)
| Epoche | refuse | preRefused | preKey | fringe |
|---|---|---|---|---|
| bis 1994 | 0,04 | 0 | 0 | 0 |
| 1995–2004 | 0,11 | 0,40 | 0,08 | 0,05 |
| 2005–14 | 0,19 | 0,55 | 0,14 | 0,30 |
| ab 2015 | 0,21 | 0,60 | 0,15 | 0,60 |

`fringe` = Chance, dass ein Ergänzungsspieler (ab Platz 16, ab 25 Jahren, Vertrag endet zum Saisonende) am 20.4.
keinen neuen Vertrag bekommt (`aiLetGo`). Kaufoption: Wahrscheinlichkeit aus Startelf-Anteil/Note × 0,85
(`optionWanted` in `src/game/aiLoans.ts`), Optionspreis 1,2 × Marktwert, Kassenpuffer 2 % des Umsatzes.

## Ist/Soll (Sim `CLUB=muc AI=1 node scripts/sim.mjs 46`, Mittel aus SEED 1975 und 7, je Saison)
| Epoche | ablösefreie Abgänge Ist (Soll) | Vorverträge Ist (Soll) | Bosman-Verkäufe Ist (Soll) | Kaufoption gezogen Ist (Soll) |
|---|---|---|---|---|
| 1975–84 | 1,6 (0–3) | 0 (0) | 0 (0) | – |
| 1985–94 | 3,3 (1–5) | 0 (0) | 0 (0) | – |
| 1995–2004 | 21,0 (18–30) | 5,9 (4–10) | 4,1 (3–8) | 4/18 = 22 % (20–35 %) |
| 2005–14 | 28,2 (25–38) | 10,1 (6–12) | 7,4 (4–9) | 12/50 = 24 % (20–35 %) |
| ab 2015 | 33,4 (30–42) | 10,7 (8–14) | 6,6 (4–10) | 7/38 = 18 % (20–35 %) |

Streuung: Einzelläufe schwanken je Epoche um etwa ±2 (Vorverträge/Bosman) bzw. ±3 (Abgänge); die
Kaufoptionen beruhen auf 10–30 Fällen je Lauf und streuen stark (über alle Läufe mit Faktor 0,85 ≈ 27 %).
Vor dieser Feinkalibrierung lagen die Vorverträge 1995–2004 bei ≈ 16 je Saison und die Abgänge ab 2015 bei ≈ 22.

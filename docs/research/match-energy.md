# Energie im Spiel (früher „Kraft“)

Wunsch Pascal (Nov. 2026): Spieler verlieren im Spiel zu wenig Energie; „Kraft“ heißt überall „Energie“
(Symbol Batterie bleibt, interne Schlüssel `MPlayer.energy`/`StatusKind 'kraft'`/i-Hilfe `kraft` bleiben);
der Torwart verliert ebenfalls Energie, aber deutlich weniger als Feldspieler.

## Belastungsdaten (Annahmen)

- Hochintensives Laufen ist in den letzten 15 Minuten **35–45 % geringer** als in den ersten 15 Minuten;
  nach der intensivsten 5-Minuten-Phase fällt die Leistung in den nächsten 5 Minuten um **12 %** unter
  den Spielschnitt; Einwechselspieler laufen in der Schlussviertelstunde **25 % mehr** hochintensiv als die
  übrigen (Mohr, Krustrup, Bangsbo 2003, J Sports Sci, PubMed 12848386).
- Hitze verstärkt die Ermüdung (Mohr u. a. 2012, PubMed 21029199) – im Spiel `heat` = ×1,18.
- Technische Werte (Passquote, Zweikampfquote) sinken deutlich weniger als die Laufleistung.
  Deshalb wirkt die Energie im Spiel abgeschwächt: ein Duellwert fällt bei Energie 60 um ≈ 7 %
  (`energyF` = 0,82 + 0,18 × E/100), Torwart ≈ 4 %, Abschluss ≈ 6 %.
- Tore nach der Pause 54–58 % (data/matchStats.ts, Bundesliga 1963–2026).

## Umsetzung (engine/match/team.ts `energyDrain`, Takt alle 5 Minuten)

- Feldspieler: `ENERGY_FIELD_K` 2,7 × (1,45 − Ausdauer/100) × Taktik (`TacticMods.drain`: Pressing ±12 %,
  Tempo ±7 %, Einsatz ±13 %, Gegenpressing +7 %, Ausrichtung ±5 % je Stufe) × Rolle (`rd`) × Hitze × Verlängerung (×1,15).
- Torwart: `ENERGY_GK_K` 0,9 × (1,3 − Ausdauer/200), Taktik nur zu 30 %.
- Pause +6, vor der Verlängerung +3, Untergrenze 15 (unverändert). Kabinenpredigt +2, Aufwärmen +4.
- Startenergie aus der Frische: 75 + 0,25 × Frische (vorher 85 + 0,15 × Frische) – Rotation lohnt sich mehr.
- Konzentration der Abwehr × (0,91 + 0,09 × E/100) (engine/match/traits.ts): frisch etwas weniger, müde etwas
  mehr Patzer in der Schlussphase. Angriffstakt nach der Pause leicht nachgezogen (sim.ts `late` 0,95/1,09/1,2
  statt 0,96/1,08/1,17), weil die mit der Energie sinkende Laufbereitschaft beider Teams späte Angriffe dämpft.
- Co-Trainer: wärmt ab Energie < 70 auf, wechselt unter 62 (`CO_WARM_AT`/`CO_SUB_BELOW`, vorher 64/58).
  KI-Wechsel: Bedarf (78 − E)/10 statt (84 − E)/10, Grund „müde“ unter 62 statt 60.
- Erholung nach dem Spiel (engine/form.ts) unverändert: 25–40 Punkte Frische je 90 Minuten, +7 bis +15 je Tag.

## Messung `node scripts/run-ts.mjs tests/energybench.ts 200` (von Beginn an auf dem Platz, Frische 100)

Ausdauer der Startelf-Feldspieler: Median 72, 25 % ≤ 63, 75 % ≥ 78.

| nach 90 Min. (1975/1995/2025) | vorher normal | vorher hoch | jetzt normal | jetzt hoch |
|-------------------------------|---------------|-------------|--------------|------------|
| Torwart                       | 96            | 93–94       | 88–89        | 87–88      |
| Feld, Ausdauer < 60           | 67–68         | 45–51       | 55–58        | 43–49      |
| Feld, Ausdauer 60–74          | 72–74         | 55–59       | 63–65        | 53–57      |
| Feld, Ausdauer ≥ 75           | 78–79         | 63–66       | 70–72        | 62–65      |

„normal“ = Vereinstaktik der KI, „hoch“ = Pressing 85, Tempo 80, Einsatz 85. Bei hoher Intensität lag
der Verlust schon vorher im Zielbereich; der Taktik-Aufschlag ist deshalb kleiner geworden (vorher ≈ ×1,55,
jetzt ≈ ×1,23), der Grundverlust größer – Pressing kostet absolut gleich viel wie bisher, normales Spiel mehr. Nach 60 Minuten haben
Feldspieler mit mittlerer Ausdauer ≈ 76–78 (hoch ≈ 70) – ein frischer Einwechselspieler bringt dann
≈ 4 % in jedem Duell, in der Schlussviertelstunde 6–8 %.

Matchbench `MODE=era` (3000 Spiele je Epoche): vorher 2 Abweichungen (0:0 1975, Flanken 2005), nachher 1
(Flanken 2005); Tore 2. Halbzeit 54,6/53,7/54,4/55,1/55,4/55,5 % (vorher 54,5/53,4/54,2/55,3/54,6/55,5 %).

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
- Pause +6, vor der Verlängerung +3, Untergrenze 15 (Stufe 2: 20). Kabinenpredigt +2, Aufwärmen +4.
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

## Stufe 2 (Nov. 2026): 10 Punkte mehr Verlust, Leistungskurve, Erholung „je müder, desto schneller“

Wunsch Pascal: „Die Ausdauer darf noch um durchschnittlich 10 Punkte mehr sinken. Lass sie außerdem nach dem
folgenden Prinzip wieder steigen: Je niedriger, desto mehr Energie kommt pro Tag (auch abhängig vom Training an
dem Tag) hinzu, die letzten Punkte kommen etwas langsamer. … Sag mir und erkläre es auch im Wiki, ab welchem Wert
Spieler wie viel schlechter spielen und wie das Verletzungsrisiko steigt.“

### Verlust im Spiel (engine/match/team.ts)
- Feld: `ENERGY_FIELD_K` 2,62 × (`ENERGY_FIELD_A` 1,66 − Ausdauer/100) statt 2,7 × (1,45 − Ausdauer/100) – gute
  Ausdauer verliert jetzt etwas mehr zusätzlich (sonst wären es bei ≥ 75 nur +7). Torwart `ENERGY_GK_K` 1,1 statt 0,9.
- Untergrenze 20 statt 15 (Ende der Leistungskurve).

### Eine Kurve für alle Energie-Wirkungen (engine/match/fatigue.ts)
Vorher wirkte die Energie linear ab 100 (Duell 0,82 + 0,18 × E/100, Stärke 0,8 + 0,2 × E, Abschluss 0,85 + 0,15 × E,
Torwart 0,9 + 0,1 × E, Konzentration 0,91 + 0,09 × E) und das Verletzungsrisiko sprang unter 50 auf ×1,4.
Jetzt: `tiredness(E)` = 0 bis 80, dann linear über 70: 0,12 · 60: 0,28 · 50: 0,46 · 40: 0,64 · 30: 0,82 · 20: 1;
jede Wirkung ist `1 − Höchstverlust × tiredness` mit denselben Höchstwerten wie vorher (Duell 18 %, Stärke 20 %,
Abschluss 15 %, Torwart 10 %, Konzentration 9 %). Begründung: frische Spieler laufen in der ersten Phase nicht
schlechter, der Abfall kommt in der Schlussphase und dann deutlich (Mohr u. a. 2003).

| Energie | Duelle/Pässe/Tempo | Mannschaftsstärke | Abschluss | Torwart | Verletzung (Energie) |
|---------|--------------------|-------------------|-----------|---------|----------------------|
| 80–100  | 0 %                | 0 %               | 0 %       | 0 %     | ×1                   |
| 70      | −2,2 %             | −2,4 %            | −1,8 %    | −1,2 %  | ×1                   |
| 65      | −3,6 %             | −4,0 %            | −3,0 %    | −2,0 %  | ×1,08                |
| 60      | −5,0 %             | −5,6 %            | −4,2 %    | −2,8 %  | ×1,15                |
| 55      | −6,7 %             | −7,4 %            | −5,6 %    | −3,7 %  | ×1,25                |
| 50      | −8,3 %             | −9,2 %            | −6,9 %    | −4,6 %  | ×1,35                |
| 40      | −11,5 %            | −12,8 %           | −9,6 %    | −6,4 %  | ×1,6                 |
| 30      | −14,8 %            | −16,4 %           | −12,3 %   | −8,2 %  | ×1,9                 |
| 20      | −18 %              | −20 %             | −15 %     | −10 %   | ×2,2                 |

Verletzung zusätzlich nach Frische vor dem Anpfiff (`injuryFreshFactor`): ≥ 90 ×1, 80 ×1,1, 70 ×1,2, 60 ×1,35, ≤ 50 ×1,5.
Co-Trainer wärmt unter 65 auf, wechselt unter 55 (vorher 70/62); KI-Bedarf (72 − E)/10, „müde“ unter 55 (vorher 78/62).
Kommentar „müde“ im Duell unter 45 statt 52. Weil bis 80 kein Verlust mehr anfällt und Schützen gegen den kaum müden
Torwart etwas besser abschließen, stiegen Tore und Schüsse um ≈ 3 %: `ATTACK_PACE` 0,405 → 0,398.

### Frische nach dem Spiel und tägliche Erholung (engine/form.ts)
- Nach dem Spiel: `finish.ts` merkt je Spieler Minuten und Energieverlust (`noteMatchLoad`), `applyMatchEffects`
  zieht 12 je 90 Min. + 0,5 × Energieverlust ab (± 8 %, höchstens 45) – wer wirklich gespielt hat, nicht mehr die
  „11 Besten nach Stärke“. Feld voll ≈ 33–40, Torwart ≈ 20. Ohne Daten der Engine die alte Pauschale.
- Je Tag: 40 % der Lücke zu 100 (mind. 1) × Training (1,15 − 0,025 × Tagesbelastung, 0,6–1,3) × Ausdauer/Alter
  (0,87–1,30); über 10 Belastungspunkte kostet jeder Punkt 0,4. Ohne Trainingsplan (KI, Spieltag) Faktor 1.

| Frische | Regeneration | frei | normal 6,5 | hart 10 | sehr hart 16 |
|---------|--------------|------|------------|---------|--------------|
| 40      | +32          | +29  | +25        | +23     | +17          |
| 50      | +27          | +25  | +21        | +19     | +14          |
| 60      | +21          | +20  | +17        | +15     | +10          |
| 70      | +16          | +15  | +13        | +12     | +7           |
| 80      | +11          | +10  | +8         | +8      | +4           |
| 90      | +5           | +5   | +4         | +4      | +1           |
| 95      | +3           | +3   | +2         | +2      | −1           |

(Ausdauer 70, Alter 26; `node scripts/run-ts.mjs tests/energy-recovery.ts`.) Englische Woche Sa–Mi–Sa mit echter
Match-Engine und Wochenplan (6 Durchläufe, Startelf): nach dem Samstag Ø 72 (min 60), Mittwochmorgen Ø 97,6 (min 95),
Samstag danach Ø 95,3 (min 89), nach einer normalen Woche Ø 99,8; Vorlage „Englische Woche“ 98,1/95,9/100.

### Messung vorher → nachher
`tests/energybench.ts 200` (90. Min., Vereinstaktik, 1975/1995/2025):

| nach 90 Min.         | vorher normal | jetzt normal | vorher hoch | jetzt hoch |
|----------------------|---------------|--------------|-------------|------------|
| Torwart              | 88–89         | 84–86        | 87–88       | 83–84      |
| Feld, Ausdauer < 60  | 55–58         | 45–48        | 43–49       | 31–37      |
| Feld, Ausdauer 60–74 | 63–65         | 53–56        | 53–57       | 41–45      |
| Feld, Ausdauer ≥ 75  | 70–72         | 60–62        | 62–65       | 49–53      |

60. Minute mittlere Ausdauer 69–71 (vorher 76–78). Matchbench `MODE=era`: vorher 1 Abweichung (Flanken 2005),
nachher 3 (Flanken 2005, Tore 2005 3,00 an der Grenze, Rot 2015 0,20 an der Grenze); Tore 2. Halbzeit
55,2/53,3/55,0/55,3/55,0/55,9 %. Verletzungen je Saison im Sim-Bericht (`BAL=1 node scripts/sim.mjs 3`, 1. Liga inkl.
Training): vorher 166/181/189, nachher 159/154/189.

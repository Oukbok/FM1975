# Tabellen-Regel (Entwurf, wartet auf Pascals Okay)

**Ziel:** Keine Tabelle scrollt waagerecht – auch nicht auf kleinen Flächen (Steam Deck 1280×800, 1366×768) mit angehobener Schrift. Auf 1920×1080 bleibt alles, wie es ist.

Stand: Entwurf vom 21.11.2026. Noch **nicht** als feste Regel in `CLAUDE.md` eingetragen.

## Das Prinzip in einem Satz

Jede Tabelle wird beim ersten Erscheinen gemessen. Passt sie nicht in ihre Box, wird sie in drei festen Stufen schmaler – erst enger, dann ohne unwichtige Spalten, zuletzt mit gekürzten Namen.

| Stufe | Was passiert | Was man dafür schreibt |
|---|---|---|
| a) eng | Zellabstand 4 px, keine Sperrung im Kopf, Kurzform der Spaltenköpfe („Fr.“ statt „Frische“, voller Name als Tooltip) | `<Short s="Fr.">Frische</Short>` im Spaltenkopf |
| b) Spalten weglassen | Spalten fallen nach Wichtigkeit weg, bis die Tabelle passt – die höchste Zahl zuerst, bei Gleichstand die rechte | `data-pri={2…9}` am `<th>`; ohne Angabe bleibt die Spalte immer |
| c) Namen kürzen | Die Namensspalte wird schmaler, lange Namen enden mit „…“ (voller Text beim Zeigen) | `data-flex` am `<th>` der Namensspalte (sonst nimmt der Helfer die breiteste) |

Der Helfer ist `src/ui/stableTables.ts` (läuft für jede `table.dtable` von selbst), das CSS steht in `src/styles/33-tables.css`.

## Regeln für jede neue Tabelle

1. **Klasse `dtable`** verwenden (`dtable rl-players` für Spielerlisten, `dtable rl-sm` für kleine Boxen). Eigene Tabellen-Klassen nur, wenn es nicht anders geht – dann zusätzlich `fit-cols`, damit der Helfer sie einpasst.
2. **Wichtigkeit je Spalte festlegen:** Pflicht (Name, Position, Stärke, Aktion) ohne Angabe, wichtig `data-pri={2}`, optional `data-pri={3}` und höher. Wegfallen darf nur, was an anderer Stelle erreichbar ist (Infokarte, Spielerprofil, Tooltip).
3. **Namensspalte** bekommt `data-flex` und die Zellen `className="nowrap rl-name"`.
4. **Lange Spaltenköpfe** (ab etwa 7 Buchstaben) bekommen eine Kurzform über `Short`. Der volle Name bleibt als Tooltip.
5. **Zahlen** rechtsbündig (`className="num"`), Symbole mittig (`ctr`). Keine festen Mindestbreiten (`min-width`, `width` in px) an Zellen – die Breite ergibt sich aus dem Inhalt.
6. **Kein waagerechter Bildlauf** als Lösung (`overflow-x: auto` um eine Tabelle). Ausnahme: Turnierbäume.
7. **Zeilen über die ganze Breite** (Abschnittsköpfe, Leertext) mit `colSpan` = Zahl aller Spalten; der Helfer kürzt sie um die ausgeblendeten Spalten. Tabellen mit Teil-`colSpan` in Datenzeilen bekommen kein `data-pri`.
8. **Prüfen:** `npm run test:audit` darf für die Seite keine „Waagerechte Bildlaufleiste“ melden. Der Fund „Tabelle zusammengeschoben“ heißt: Stufe c) hat gegriffen – dann fehlt ein `data-pri`.

## Codebeispiel

```tsx
import Short from '../../ui/Short';

<table className="dtable rl-players">
  <thead><tr>
    <th data-flex>Name</th>
    <th className="ctr">Pos</th>
    <th className="num">Stärke</th>
    <th><Short s="Pot.">Potenzial</Short></th>
    <th className="ctr"><Short s="Fr.">Frische</Short></th>
    <th className="num" data-pri={2}>Marktwert</th>   {/* wichtig: fällt als Letztes */}
    <th className="num" data-pri={3}>Vertrag</th>     {/* optional: fällt zuerst */}
    <th />                                            {/* Aktion: bleibt immer */}
  </tr></thead>
  <tbody>
    {rows.map((p) => (
      <tr key={p.id} className="clickable">
        <td className="nowrap rl-name">{p.fullName}</td>
        <td className="ctr"><PosBadge p={p} /></td>
        <td className="num">{p.overall}</td>
        <td className="nowrap"><ScoutStarBar p={p} /></td>
        <td className="ctr"><PlayerFreshness p={p} /></td>
        <td className="num">{fmtPrice(p.contract.transferValue)}</td>
        <td className="num">{months} M.</td>
        <td className="num"><button className="dchip on">Verhandeln</button></td>
      </tr>
    ))}
  </tbody>
</table>
```

Die Zellen brauchen keine eigenen Klassen für das Ausblenden: Der Helfer setzt `data-drop="7"` an die Tabelle, `33-tables.css` blendet die siebte Zelle jeder Zeile aus.

## Tabellen mit fester Spaltenbreite

Für Tabellen mit `table-layout: fixed` (Aufstellung › Kaderliste) wird die Namensspalte nicht breiter als der Rest übrig lässt. Dort gibt `data-min={170}` am Namenskopf die Mindestbreite vor: Wird sie unterschritten, gilt die Tabelle als zu breit und die Stufen laufen genauso.

## Was wo wegfällt (Stand dieses Durchgangs, 1280×800)

Siehe Tabelle im Abschnitt „Durchgang Tabellen“ in `docs/research/audit-bericht.md`.

## Werkzeuge

- `node tests/table-shots.mjs [ordner]` – Screenshots der wichtigsten Tabellen; `MEASURE=1` zeigt je Tabelle Breite, Stufe und Spalten, `WHY=1` nennt bei waagerechtem Bildlauf das Element, das hinausragt. `DIST=…` für einen älteren Build, `VIEWS=…`, `SAVE=…`, `ONLY=…`.
- `python3 tests/table-montage.py <vorher> <nachher> <ziel> [auflösung]` – Montage links vorher, rechts nachher.

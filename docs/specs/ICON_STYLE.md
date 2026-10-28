# Icon-Stil „Set C" (Duotone / Flat modern)

Dieses Dokument beschreibt den verbindlichen Stil für **alle Menü- und
UI-Icons** in *1975 – A Football Manager* sowie die Schritte, um ein neues Icon
hinzuzufügen. Es gilt für Icons, **nicht** für Vereinswappen (die eigene Logik
haben).

> **Grundsatz:** Menü-Icons werden ausschließlich in diesem Set-C-Stil erstellt.
> Keine Emojis, keine echten Marken/Logos, keine fremden Icon-Packs.

---

## 1. Stilregeln

| Merkmal            | Vorgabe                                                                 |
|--------------------|------------------------------------------------------------------------|
| **Look**           | Duotone / Flat modern – flache, gefüllte Formen                        |
| **Basisfarbe**     | Off-White `#e8edf4` (entspricht `--text`)                              |
| **Akzentfarbe**    | Genau **EIN** türkiser Akzent `#f2a541` (entspricht `--accent`) pro Icon |
| **Outline/Glow**   | Keine Konturlinien, kein Schlagschatten, kein Glow                     |
| **Ecken**          | Sanft gerundet (weiche, freundliche Formen)                           |
| **Zeichenfläche**  | `viewBox="0 0 24 24"`, optisch einheitlich groß (ca. 2 px Rand)       |
| **Strichstärke**   | Keine Striche – es wird mit Flächen (`fill`) gearbeitet               |
| **Farben**         | Als **literale Hex-Werte** im SVG (nicht `currentColor`/`var()`),      |
|                    | damit die Datei standalone (`.svg`) identisch wie in React aussieht    |

**Akzent-Prinzip:** Der Türkis-Akzent hebt genau *ein* charakteristisches
Element hervor (z. B. der Zahnkranz-Kern beim Zahnrad, der Stern im Pokal, die
Abspiel-Fläche des Balls). Nie mehrere Elemente türkis einfärben – das zerstört
den ruhigen Duotone-Look.

---

## 2. Das aktuelle Set (14 Icons)

Alle Icons liegen doppelt vor: als Formdaten in `src/components/iconPaths.ts`
(Single Source of Truth) und – daraus generiert – als Einzeldateien in
`public/assets/icons/`.

| Icon-Name (`IconName`) | Datei                       | Bedeutung / Verwendung            |
|------------------------|-----------------------------|-----------------------------------|
| `newGame`              | `new-game.svg`              | Neues Spiel / Start / Weiter      |
| `loadGame`             | `load-game.svg`             | Spiel laden                       |
| `settings`            | `settings.svg`              | Einstellungen / Optionen          |
| `quit`                 | `quit.svg`                  | Verlassen / Menü                  |
| `schedule`             | `schedule.svg`              | Spielplan / Termin / Datum        |
| `squad`                | `squad.svg`                 | Kader                             |
| `lineup`               | `lineup.svg`                | Aufstellung                       |
| `transfers`            | `transfers.svg`             | Transfers                         |
| `trophy`               | `trophy.svg`                | Pokal / Titel / Prämien           |
| `finances`             | `finances.svg`              | Finanzen                          |
| `stadium`              | `stadium.svg`               | Stadion / Gelände / Unterhalt     |
| `news`                 | `news.svg`                  | Nachrichten                       |
| `save`                 | `save.svg`                  | Speichern                         |
| `matchball`            | `matchball.svg`             | Spiel / Spieltag / Anpfiff        |

Die Referenzvorlage liegt unter
`public/assets/icons/_set-c-reference.png` (nicht löschen).

---

## 3. Verwendung im Code

```tsx
import Icon from './components/Icon';

<Icon name="trophy" />              // Größe folgt der font-size (1em)
<Icon name="save" size={20} />      // feste Pixelgröße
<Icon name="news" className="foo" /> // zusätzliche CSS-Klasse
```

- Jedes gerenderte SVG erhält automatisch die Klasse `.game-icon`
  (Größen-/Ausrichtungsregeln in `src/index.css`).
- Innerhalb von Buttons/Labels wird das Icon einfach vor den Text gesetzt.

---

## 4. Neues Icon hinzufügen

1. **Form definieren:** In `src/components/iconPaths.ts` einen neuen Eintrag im
   Objekt `RAW` ergänzen. Als Platzhalter für die Farben **`%BASE%`** (Off-White)
   und **`%ACCENT%`** (Türkis) verwenden – genau *ein* Element bekommt `%ACCENT%`.

   ```ts
   myicon: `
     <path d="…" fill="%BASE%"/>
     <circle cx="12" cy="12" r="3" fill="%ACCENT%"/>
   `,
   ```

2. **`.svg`-Datei erzeugen:** Im Projektordner ausführen:

   ```bash
   node scripts/gen-icons.mjs
   ```

   Das Skript liest `iconPaths.ts`, ersetzt die Farb-Platzhalter durch die
   literalen Hex-Werte und schreibt `public/assets/icons/<kebab-name>.svg`.
   (Der Dateiname wird automatisch aus dem camelCase-Key abgeleitet, z. B.
   `loadGame` → `load-game.svg`.)

3. **Verwenden:** `<Icon name="myicon" />` – der Name ist dank
   `IconName = keyof typeof RAW` typsicher.

### Checkliste vor dem Commit
- [ ] Nur **eine** Farbfläche in Türkis (`%ACCENT%`), Rest Off-White (`%BASE%`).
- [ ] `viewBox="0 0 24 24"`, optische Größe passt zu den bestehenden Icons.
- [ ] Keine Outline/Glow/Schatten, weiche Rundungen.
- [ ] `node scripts/gen-icons.mjs` ausgeführt, `.svg` liegt vor.
- [ ] `npm run build` läuft fehlerfrei.

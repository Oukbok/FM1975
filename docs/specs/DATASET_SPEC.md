# Datensatz-Format `fm1975-dataset` (Version 1)

Ein Datensatz ist **eine JSON-Datei** (`<id>.fm1975.json`). Er legt fest, womit ein neues Spiel startet. Erstellt wird er im **Datensatz-Editor** (`/editor/`, Quelltext `src/editor/`), importiert und gewählt im Spiel unter **Datensätze** bzw. **Neues Spiel**.

Verbindliche Typen: `src/data/dataset/schema.ts`. Anwenden: `src/data/dataset/apply.ts` (ersetzt die Tabellen im Speicher in place). Speicher: IndexedDB `fm1975-datasets`, Store `datasets`, Schlüssel = `meta.id` (`src/data/dataset/storage.ts`).

## Grundregeln

- `format` = `"fm1975-dataset"`, `version` ≤ `DATASET_VERSION` (aktuell 1). Steigt nur bei inkompatiblen Änderungen.
- `meta.id`: nur `a–z`, `0–9`, `_`, `-`; `builtin` ist reserviert. Gleiche ID überschreibt beim Übernehmen.
- **Fallback:** Fehlt ein Teil oder ist eine Liste **leer**, nimmt das Spiel den eingebauten Standard (Ausnahme: `names.blocked` – leer bleibt leer; `history` und `europe.firstSeasonGerman` als Ganzes).
- Ein Spielstand speichert `datasetId` und wendet den Datensatz beim Laden erneut an. Vereine/Kader liegen im Spielstand; Tabellen (Chronik, Reformen, Mitarbeiter, Marketing, Namen, Wirtschaft …) kommen aus dem Datensatz.
- Preise und Kosten sind in **DM-Basis 1975** (werden mit der Teuerung skaliert), außer `economy.anchors` (EUR).
- Nur **erfundene** Namen für Vereine, Spieler, Stadien, Wettbewerbe und Marken.

## Aufbau

| Feld | Typ | Inhalt |
|---|---|---|
| `meta` | `{ id, name, author?, description?, created, updated? }` | Anzeige im Spiel. Datum `JJJJ-MM-TT`. |
| `clubs.tier1` | `ClubSeed[]` | 1. Liga 1975/76: `id, name, shortName, city, founded, primary, secondary, reputation (1–99), stadium, capacity`. Gerade Anzahl, mind. 6. |
| `clubs.secondNord`, `clubs.secondSued` | `SecondLigaSeed[]` | `id, name, shortName, city, primary, secondary, strength`. Gerade Anzahl. |
| `clubs.ddrOberliga`, `clubs.ddrLiga` | `SimClub[]` | `id, name, shortName, city, strength, colors{primary,secondary}, tier (101/102), group, historicalName?, renamedYear?`. |
| `crests` | `Record<vereinsId, dataUrl>` | Wappen als PNG/SVG-Data-URL (Editor verkleinert auf 256 px). |
| `kits` | `Record<vereinsId, {home, away}>` | `Kit = { primary, secondary, pattern }`, `pattern` ∈ `solid, stripes, hoops, sash, mittelstreifen, halves`. Gilt nur, wenn **beide** gesetzt sind. |
| `europe.countries` | `CountrySeed[]` | `name, origin, base, tier1, tier2, cities[]` – Hintergrund-Ligen je Land. |
| `europe.trends` | `Record<land, [jahr, delta][]>` | Niveau-Verschiebung gegenüber `base`. |
| `europe.splits` | `CountrySplit[]` | Staatenteilungen: `year, from, parts[], dropCities[], renameRest?, restOrigin?, restBaseDelta?, restCities?`. |
| `europe.exclusions` | `{country, from, to}[]` | Europapokal-Sperren (Saison-Startjahre). |
| `europe.clubs` | `EuroClub[]` | Ausländische Starter 1975/76: `id` mit Präfix `eu_`, `comp` ∈ `ec, cwc, uefa`. Soll: 15 / 15 / 29. |
| `europe.firstSeasonGerman` | `{ ec[], cwc[], uefa[] }` | Deutsche Starter 1975/76 (Vereins-IDs). Soll: 1 / 1 / 3. |
| `timeline` | `TimelineEvent[]` | `id, season ("1995/96"), year, type, title, description, effect?{pointSystem?, unlock?, attendanceBoost?}, fictional?`. |
| `leagues.base` | `DivisionTarget[]` | Startpyramide: `id, tier, group, name, teamCount` (gerade). |
| `leagues.reforms` | `LeagueReform[]` | `reformId, effectiveSeason, title, description, affectedTiers[], qualificationRule, targetStructure[]` (vollständige Pyramide). |
| `facilities` | `FacilityData[]` | `key` (fest, siehe `FacilityKey`), `name, desc, baseCost, unlockYear?, obsoleteYear?`. Wirkung bleibt im Code. |
| `staff` | `StaffRole[]` | `id, name, group, unlockYear, obsoleteYear?, costClass (K1–K5), effect, injuryReduction?, rehabReduction?, recovery?, scouting?, reach?, flavor?`. |
| `marketing` | `MarketingArea[]` | `id, name, unlockYear, obsoleteYear?, icon, desc, maxUnits, costPerUnit (DM/Monat), maxBenefit, k`. |
| `names.origins` | `OriginData[]` | `id, nationality, face, first[], last[]`. `face` ∈ `mitteleuropa, nordeuropa, suedeuropa, osteuropa, balkan, tuerkei, westafrika, lateinamerika, ostasien, nordafrika`. |
| `names.mix` | `[jahr, {herkunft: gewicht}][]` | Herkunfts-Mischung je Stützjahr (interpoliert). |
| `names.blocked` | `string[]` | Gesperrte Kombinationen „Vorname Nachname“. |
| `legends` | `LegendSeed[]` | `id, firstName, lastName, origin, position, birthYear, peak, cities?, bio, professionalism, ambition`; optional (Legenden 2.0): `rarity` (`weltklasse`/`national`/`liebling` → verdeckter Talent-Korridor, fehlt: aus `peak`), `archetype` (ID aus `data/legendArchetypes.ts`, fehlt: Standard je Position), `curve` (`frueh`/`normal`/`spaet`), `signature` (Liste `attribut:von-bis`, z. B. `heading:90-95`), `homeClub` (Vereins-ID des Jugendvereins), `ddr` (erst nach der Wende im Spiel). `peak` ist die Obergrenze des ausgewürfelten Potenzials. Legenden ohne `cities` mit ausländischer Herkunft erscheinen als Auslandstalente; wer 1975 mindestens 15 ist, steht beim Spielstart im Kader. Der Standard-Datensatz enthält ~450 Legenden (handverlesen + je Jahrgang 1940–2010 erzeugt, `data/legendsGenerated.ts`). |
| `economy.anchors` | `{year, value}[]` | Erlös-Basis eines Erstligisten in EUR. |
| `economy.revenueMix` | `{year, matchday, tv, commercial}[]` | Anteile, Summe ≈ 0,9. |
| `history` | `HistoryConfig` | `cupWinnersCupLastSeason`, `attendanceRestrictions[{from,to,factor}]`, `tvMarket[{year,factor}]`. |

## Feste Verknüpfungen (nicht frei änderbar)

- **Einrichtungen:** nur vorhandene `key`s; neue Arten erfordern Code.
- **Ligareformen:** Die Übergänge 1981, 1991 (DDR-Integration), 1994 und 2008 haben eigene Migrationsregeln, verknüpft über die `reformId` (`reform-1981-single-second`, `reform-1991-reunification`, `reform-1994-regionalliga`, `reform-2008-third-league`). **Offen:** Reformen mit eigener ID laufen derzeit über den normalen Saisonwechsel (Auf-/Abstieg ohne Umbau) – neue Ebenen oder Staffeln werden dabei noch nicht automatisch befüllt. Bis dahin eignen sich eigene Reformen v. a. für Chronik-Text und Namen; strukturelle Änderungen besser über die vier eingebauten Reform-IDs.
- **Chronik-Effekte:** `unlock` schaltet nur Flags frei, die das Spiel abfragt (z. B. `shirt_sponsorship`).

## Prüfungen

- Beim Import (Spiel): `validateDataset` – Format, Version, Meta, 1. Liga (≥ 6, gerade, eindeutige IDs), gerade 2. Ligen.
- Im Editor zusätzlich (`src/editor/validate.ts`): eindeutige Vereins-IDs über alle Ligen, Ansehen/Kapazität, Europapokal-Feldgrößen und `eu_`-Präfix, bekannte Länder, gerade Ligagrößen je Land, Jahre 1975–2100 und `obsolete > unlock`, Saisonformat, eindeutige Chronik-IDs, Erlös-Mix, Herkünfte der Namensmischung, leere Listen (Hinweis: Standard greift).

## Tests

- `node scripts/run-ts.mjs tests/dataset-test.ts` – Standard-Datensatz exportieren/anwenden.
- `node tests/editor-ui.mjs` – Editor im Browser: alle Bereiche, Umbenennen, Trikot, Prüfen, Export, Übernahme, Sichtbarkeit im Spiel.

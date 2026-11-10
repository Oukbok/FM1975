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
| `crests` | `Record<vereinsId, dataUrl>` | Wappen als PNG/SVG-Data-URL (Editor verkleinert auf 256 px), gilt ab Spielbeginn. |
| `crestEras` | `Record<vereinsId, { from: number; crest: dataUrl }[]>` | Optional: spätere Wappen; jedes ersetzt das vorige ab Saisonbeginn (1. Juli) des Jahres `from`. |
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
| `names.origins` | `OriginData[]` | `id, nationality, face, first[], last[]`, optional `firstByEra: [abGeburtsjahr, vornamen[]][]` (Vornamen je Jahrgang, aufsteigend; fehlt das Feld, gelten die eingebauten Jahrgänge derselben `id`, `[]` schaltet sie ab). `face` ∈ `mitteleuropa, nordeuropa, suedeuropa, osteuropa, balkan, tuerkei, westafrika, lateinamerika, ostasien, nordafrika`. |
| `names.mix` | `[jahr, {herkunft: gewicht}][]` | Herkunfts-Mischung je Stützjahr (interpoliert). |
| `names.blocked` | `string[]` | Gesperrte Kombinationen „Vorname Nachname“. |
| `legends` | – | **entfernt** (Legenden-System gestrichen, Spieler entwickeln sich organisch). Ältere Dateien dürfen das Feld noch enthalten; es wird beim Anwenden ignoriert. |
| `worldData` | Editor „Vereine“ (Land → Liga → Saison) + „Ligen je Saison“ | Je Land (Code aus `data/world/countries.ts`, z. B. `ger`, `eng`) `{ clubs: RealClub[], seasons: { <Startjahr>: SeasonRow } }` im Format von `docs/specs/WELTDATEN_SPEC.md` (Vereine: `id`, `name`, `short`, `city`, `colors`, `rename?`; Saison: `t1`, `t2?`, `t2b?`, `cup?`, `cupFinalist?`, `euro?`, `note?`). Fehlt das Feld oder ein Land, gelten die eingebauten Länderdateien; ein eigener Datensatz ergänzt/ersetzt einzelne Vereine und Saisons. Deutschland nutzt die IDs der Startvereine (DDR-IDs aus `gdr` ab 1991/92); geänderte Namen/Kürzel/Städte/Farben deutscher Vereine gelten auch für `clubs.tier1`/`secondNord`/`secondSued`/DDR. Eine geänderte Saison 1975/76 Deutschland ersetzt den Startaufbau aus `clubs`. Prüfung im Editor: IDs eindeutig, Saisons nur bekannte IDs, gerade Ligagrößen (Warnung). |
| `poolTowns` | Editor „Amateur-Pool“ | Liste `{ town, group }` (Region `nord`/`west`/`sued`/`nordost`) der Städte, aus denen Amateurvereine nachrücken, wenn der Pool unter der untersten Liga unter 24 Vereine fällt (`game/clubPool.ts` `refillPool`, Daten `data/poolTowns.ts`). Fehlt das Feld, gilt die eingebaute Liste. Prüfung: Stadt nicht leer, Region gültig, Doppelte als Warnung. |
| `legendsV2` | Editor „Legenden“ | Ausnahmetalente der Fußballgeschichte (`data/legends/types.ts` `LegendDef`): `id`, `firstName`/`lastName` (nur erfundene Namen), `birth` (JJJJ-MM-TT), `country` (Kürzel, `DDR` = bis 1990 in der DDR), `pos`, `pos2[]`, `foot` (`right`/`left`/`both`), `type` (Spielertyp aus `LEGEND_TYPES`), `potential` (50–99, Ausnahmetalente ab 80), `height`, `face?`, `club?` (Vereins-ID des Landes; leer = zufällig, gewichtet nach Jugendarbeit), `maturity`/`longevity` (−1…1), `hidden` {`consistency`, `nerves`, `injury` (hoch = anfällig), `tempo`, `professionalism`, `ambition`, `adaptability`} je 0–100, `persona?` {`loyalitaet`, `geld`, `heimat`, `abenteuer`, `rampenlicht`, `familie`}. Fehlt das Feld, gilt die eingebaute Liste (100 Einträge); eine leere Liste schaltet sie ab. Unvollständige Einträge werden beim Anwenden übergangen. Im Spiel still: keine Nachricht, keine Markierung, verdeckte Werte nie als Zahl (Ablauf `game/legendsGame.ts`). |
| `economy.anchors` | `{year, value}[]` | Erlös-Basis eines Erstligisten in EUR. |
| `economy.revenueMix` | `{year, matchday, tv, commercial}[]` | Anteile, Summe ≈ 0,9. |
| `economy.transferRecords` | `{year, world, germany}[]` (optional) | Rekordkurve: Spitzenablöse je Jahr in EUR (international / deutsche Vereine); weiche Obergrenze für Marktwerte und Ablösen, danach +3,5 %/Jahr. |
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

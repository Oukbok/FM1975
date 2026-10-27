# FM1975 – Arbeitsanleitung für Claude

Browser-Fußballmanager „1975 – A Football Manager“: Start 1975, Verein über Jahrzehnte mit sich ändernden Regeln führen.
React 18 + TypeScript, gebaut mit esbuild. Kein Backend – alles läuft im Browser (Spielstände in localStorage, eigene Wappen/Trikots in IndexedDB).

## Befehle
- `npm run check` – Typprüfung, muss **0 Fehler** ergeben.
- `npm run build` – Build nach `dist/`. `npm run dev` – lokaler Server auf http://localhost:5173.
- `npm run test:ui` – Rauchtest (Playwright): startet ein Spiel, öffnet jede Seite, lässt Zeit laufen, meldet JS-Fehler. Screenshots in `test-output/`.
- Hosting: Cloudflare Pages baut jeden Push auf `main` automatisch (Build `npm run build`, Ausgabe `dist`).

## Wo liegt was (nur die betroffene Datei lesen, nicht breit suchen)
- `src/App.tsx` – Wurzel: Hauptmenü ↔ Spiel, Laden/Speichern-Einstieg.
- `src/shell/GameShell.tsx` – laufendes Spiel: **Tagesablauf `processDay`**, Header, Routing der Seiten.
- `src/shell/navigation.tsx` – `Screen`-Typ + `MENU_STRUCTURE` (einzige Quelle für Menü/Unterpunkte). `CalendarStrip.tsx` – Kalenderstreifen oben.
- `src/game/` – Spielablauf ohne UI: `season.ts` (Spieltag, Saisonwechsel, Timeline), `competitions.ts` (Pokal/Europapokal-Kalender + Nachrichten), `leagueSetup.ts` (Ligensystem, DDR, Punkteregel), `state.ts` (`Game`-Typ, Sponsoring-Migration), `clubProfile.ts`.
- `src/engine/` – Spielmechaniken: `match.ts` (Match-Engine), `finances.ts`, `economy.ts` (Inflation, DM/EUR), `development.ts`, `youth.ts`, `training.ts`/`weeklyTraining.ts`, `form.ts`, `transfers.ts`, `cup.ts`, `euro.ts`, `leagues.ts`, `calendar.ts`, `save.ts`, `lineupAI.ts`, `infrastructure.ts`.
- `src/data/` – Stammdaten: `generate.ts` (Vereine/Kader), `reforms.ts` (Ligareformen), `timeline.ts`, `staff.ts`, `marketing.ts`, `europe.ts`, `ddr.ts`, `defaultCrests.ts`, `clubOverrides.ts` (Editor-Wappen/Trikots), `wiki.ts` (In-Game-Wiki).
- `src/views/<bereich>/` – je Menübereich (zentrale, spieltag, kader, transfers, finanzen, verein, statistiken, wiki, modals); `categoryDashboards.tsx` = Übersichtsseiten der Kategorien.
- `src/screens/` – Hauptmenü, Neues Spiel, Laden, Einstellungen. `src/ui/` – `PageHead`, `DisplayFrame` (Skalierung), `format.ts` (Geld/Datum).
- `src/components/` – wiederverwendbar: Icon, ClubCrest, PlayerAvatar, PlayerModal, ClubModal, LineupView, TacticsView, MatchLiveView, JerseySVG, ClubEditorModal.
- `src/types/index.ts` – alle zentralen Typen (`Club`, `Player`, `ClubFinances` …). Groß: gezielt per grep lesen.
- `src/styles/NN-bereich.css` – CSS nach Bereichen; Reihenfolge = Kaskade (`styles/index.ts`). Design-Tokens in `00-base.css` (`:root`).
- `docs/specs/` – verbindliche Formeln (Finanzen, Europapokal, Icons). `docs/recherche/` – historische Recherche, nur bei Bedarf.

## Feste Vorgaben von Pascal
- **Keine Emojis** in der UI – nur `<Icon>` (`src/components/iconPaths.ts`; neues Icon dort ergänzen).
- Genau **eine** Akzentfarbe `#00D9FF`. Sprache Deutsch, informelles „du“.
- Währung DM bis 2001, EUR ab 2002 (`engine/economy.ts`). Datum **immer UTC**.
- Zentrale (Dashboard): Footer unten lassen, Boxenhöhen nicht ändern, Boxen nur verschieben, ohne Scrollen.
- Neue Seiten: in `MENU_STRUCTURE` eintragen (erster Unterpunkt = Kategorie selbst), Kopf über `PageHead`, gerendert in `<main className="app-main">` unter `CalendarStrip`.
- Alle Vereine werden simuliert. Änderungen minimal und nicht-destruktiv; Spielstand-Kompatibilität beachten (`SAVE_VERSION` in `engine/save.ts`).
- **Wiki-Pflicht:** neue/geänderte Mechanik → passenden Artikel in `src/data/wiki.ts` mitpflegen (einzige Wiki-Quelle).

## Arbeitsweise
- Vor dem Commit: `npm run check` (0 Fehler) und `npm run build`; bei UI-Änderungen zusätzlich `npm run test:ui`.
- Dateien klein halten (Ziel < 600 Zeilen). Neue Seite = neue Datei unter `src/views/<bereich>/`.
- Diese Datei aktuell halten, wenn Struktur sich ändert – kurz, ohne Zeilennummern.

## Offene Wünsche (Backlog)
- Klickbare Gegner-/Vereins-Infoseite (Basis: `game/clubProfile.ts`, `components/ClubModal.tsx`).
- Spielerprofil-Redesign + Attribut „Frische“ (`form.ts`, `PlayerModal.tsx`).
- Chronik ins In-Game-Wiki einbinden (`views/statistiken/ChronicleView.tsx`).
- Kalender-Feinschliff (`views/zentrale/CalendarView.tsx`, `engine/calendar.ts`).
- Langfristig: Manager-KI für Gegnervereine.
- Technisch: `processDay` aus `GameShell.tsx` in `src/game/` verlagern und einen Saison-Test ohne UI ergänzen.

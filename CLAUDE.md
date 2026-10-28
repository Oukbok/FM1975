# FM1975 – Arbeitsanleitung für Claude

Browser-Fußballmanager „1975 – A Football Manager“: Start 1975, Verein über Jahrzehnte mit sich ändernden Regeln führen.
React 18 + TypeScript, gebaut mit esbuild. Kein Backend – alles läuft im Browser (Spielstände in localStorage, eigene Wappen/Trikots in IndexedDB).

## Befehle
- `npm run check` – Typprüfung, muss **0 Fehler** ergeben.
- `npm run build` – Build nach `dist/`. `npm run dev` – lokaler Server auf http://localhost:5173.
- `node scripts/sim.mjs <n>` – n Saisons ohne UI (Balance-Bericht, `FIN=1` mit Finanzen); `node scripts/sim.mjs --world 50` – nur Europa.
- `node scripts/matchbench.mjs [n]` – Balance der Match-Engine je Epoche; `node scripts/tickerdemo.mjs [jahr] [seed]` – Textmodus auf der Konsole; `node tests/match-ui.mjs` – Oberflächentest Textmodus.
- `npm run test:ui` – Rauchtest (Playwright): startet ein Spiel, öffnet jede Seite, lässt Zeit laufen, meldet JS-Fehler. Screenshots in `test-output/`. Ablauf „Neues Spiel“ für Tests: `tests/newgame-flow.mjs`; Screenshots des Assistenten: `node tests/newgame-shots.mjs`.
- `npm run test:dataset` – Datensatz-Test ohne UI; `npm run test:editor` – Oberflächentest des Datensatz-Editors (Screenshots in `test-output/editor/`); `npm run test:business` – Stadionbau/Kredite/Namensrechte/Investor/Überschuldung ohne UI; `npm run test:contracts`, `npm run test:transfers`, `npm run test:youth`, `npm run test:stadium` – Verträge, Transferverhandlungen bzw. Jugendakademie bzw. Stadion-Blöcke ohne UI (`node tests/stadium-shots.mjs` = Screenshots der Stadionseite). Sim-Bericht der Ablösen: `TRANSFERS=1 node scripts/sim.mjs 40`.
- Live: https://fm1975.pas-franke.workers.dev
- Hosting: Cloudflare Workers (statische Assets, `wrangler.jsonc`) baut jeden Push auf `main` automatisch (Build `npm run build`, Ausgabe `dist`).

## Wo liegt was (nur die betroffene Datei lesen, nicht breit suchen)
- `src/App.tsx` – Wurzel: Hauptmenü ↔ Spiel, Laden/Speichern-Einstieg.
- `src/shell/GameShell.tsx` – laufendes Spiel: **Tagesablauf `processDay`**, Header, Routing der Seiten.
- `src/shell/navigation.tsx` – `Screen`-Typ + `MENU_STRUCTURE` (einzige Quelle für Menü/Unterpunkte). `CalendarStrip.tsx` – Kalenderstreifen oben.
- `src/game/` – Spielablauf ohne UI: `season.ts` (Spieltag, Saisonwechsel, Timeline), `competitions.ts` (Pokal/Europapokal-Kalender + Nachrichten), `leagueSetup.ts` (Ligensystem, DDR, Punkteregel), `state.ts` (`Game`-Typ, Sponsoring-Migration), `clubProfile.ts`, `ownMatch.ts` (eigenes Spiel: Schnell simulieren / Textmodus vorbereiten), `seasonFinance.ts`, `staffGame.ts`, `youthMarket.ts`, `environmentGame.ts`, `eventsGame.ts`, `squads.ts` (Kaderpflege), `clubBusiness.ts` (Kredite, Stadion-Bauprojekte, Namensrechte, Ausgliederung/Investor, Punktabzug/Zwangsabstieg), `contracts.ts` (Verlängerung, Bosman, Vorverträge), `aiOffers.ts` (KI-Angebote, Kabinenfrieden), `transferTalks.ts` (Transferverhandlungen) + `promises.ts` (Versprechen), `stadiumGame.ts` (14 Stadion-Blöcke des eigenen Vereins – je 3 auf den Geraden, je 2 hinter den Toren, 4 Kurven: Einführung, Umwandlung alter Spielstände, Umbau einzeln oder seitenweise, Fertigstellung; Rechnung in `engine/stadiumBlocks.ts`, Zeichnung in `views/verein/stadium/` – `geo.tsx` Kamera/Blockgeometrie, `StadiumBlockShape.tsx` ein Block, `StadiumScene.tsx` Gesamtbild, `BlockConfigurator.tsx` Planer), `youthTeams.ts` (volle Jugendmannschaften des eigenen Vereins) + `youthRecruit.ts` (Rekrutierungs-Ereignisse, Daten in `data/youthRecruitEvents.ts`), `day.ts` (`processDay`).
- `src/engine/` – Spielmechaniken: `match.ts` (Schnittstelle der Match-Engine; Simulation in `engine/match/`: `sim.ts` Minutenablauf + Eingriffe, `actions.ts` Chancen/Fouls/Karten, `team.ts` Positionsstärke × Tagesform, `era.ts` Epochenregeln, `finish.ts` Noten + Verbuchung), `finances.ts`, `economy.ts` (Inflation, DM/EUR), `development.ts`, `youth.ts`, `training.ts`/`weeklyTraining.ts`, `form.ts`, `transfers.ts`, `cup.ts`, `euro.ts`, `leagues.ts`, `calendar.ts`, `save.ts`, `lineupAI.ts`, `infrastructure.ts`, `world.ts` (Europa im Hintergrund), `clubEconomy.ts` (Finanzen 2.0), `staffPeople.ts` (Mitarbeiter 2.0), `gems.ts`/`youthScouting.ts` (Juwelen, Jugend-Scouting), `environment.ts` (Vereinsumfeld), `randomEvents.ts` (Zufallsereignisse), `clubBusiness.ts` (Zinsen, Bauprojekt, Logen, Namensrechte, Investorpreise, Überschuldung), `transferMarket.ts` (Rekordkurve als weiche Obergrenze, Marktwert, Verkäuferposition, Spielerinteresse; Daten in `data/transferRecords.ts`, Recherche `docs/recherche/transferrekorde.md`), `contractTalks.ts` (Vertragsforderungen).
- `src/data/` – Stammdaten: `generate.ts` (Vereine/Kader), `reforms.ts` (Ligareformen), `timeline.ts`, `staff.ts`, `marketing.ts`, `europe.ts`, `ddr.ts`, `defaultCrests.ts`, `clubOverrides.ts` (Editor-Wappen/Trikots), `wiki.ts` (In-Game-Wiki), Legenden: `legends.ts` (handverlesen) + `legendsGenerated.ts` (je Jahrgang) + `legendArchetypes.ts` (Archetyp/Seltenheit/Kurve) + `legendNames.ts` (private Namensdatei); Spielablauf in `game/legendsGame.ts`, `legendFactory.ts`, `legendProspects.ts` (Geheimtipps/Auslandstalente).
- `src/views/<bereich>/` – je Menübereich (Verein → Vorstand: `verein/BoardView.tsx`) (zentrale, spieltag, kader, transfers, finanzen, verein, statistiken, wiki, modals); `categoryDashboards.tsx` = Übersichtsseiten der Kategorien.
- `src/screens/` – Hauptmenü (`MainMenu.tsx`: Startbildschirm „Abendhimmel“ mit Tribünenfoto `public/assets/start-tribuene.jpg`, Zeitreise 1975/1995/2025, CSS `.st-*` in `02-startmenu.css`; Screenshots `node tests/menu-shots.mjs test-output/menu`), Neues Spiel (Assistent: `NewGameScreen.tsx` + Schritte in `screens/newgame/`, Vereinsvorschau `clubPreview.ts`, CSS `24-newgame.css`), Laden, Einstellungen; `screens/match/` = Textmodus (eigene Oberfläche ohne Menü). Kommentar-Grammatik in `src/data/ticker/`. `src/ui/` – `DashPage.tsx` (Seitenraster wie die Zentrale: `DashPage`/`DashBox`, `Kpi`, `KV`, `Meter`, `Empty`), `PageHead`, `DisplayFrame` (Skalierung), `format.ts` (Geld/Datum).
- Seiten-Layout: jede Unterseite = `<DashPage>` mit 3×2 `DashBox`en (Spalten/Zeilen per `span`/`rows`), Seite scrollt nie, Boxen intern. Große Popups: `modal modal-xl` + `mx-head`/`mx-body` (optional `mx-grid` mit DashBoxen). Gemeinsame Anzeige-Helfer in `src/views/shared.tsx` (`ScoutStars`, `MatchRow`, `PlayerRow` …), CSS dazu in `styles/22-pages.css`.
- `src/components/` – wiederverwendbar: Icon, ClubCrest, PlayerAvatar, PlayerModal, ClubModal, LineupView, TacticsView, JerseySVG, ClubEditorModal.
- `src/components/player/` – Reiter des Spielerprofils (`PlayerModal.tsx` ist nur Rahmen + Kopf): Übersicht, Attribute, Entwicklung, Statistik, Vertrag, Medizin, Bericht; `shared.tsx` = Kategorien/Beschriftungen.
- `src/types/index.ts` – alle zentralen Typen (`Club`, `Player`, `ClubFinances` …). Groß: gezielt per grep lesen.
- `src/styles/NN-bereich.css` – CSS nach Bereichen; Reihenfolge = Kaskade (`styles/index.ts`). Design-Tokens in `00-base.css` (`:root`).
- `src/data/dataset/` – Datensätze (Modding): `schema.ts` Format, `builtin.ts` Standard, `apply.ts` Anwenden, `storage.ts` IndexedDB. `src/editor/` – externer Datensatz-Editor (eigene Seite `/editor/`, zweiter esbuild-Einstieg `src/editor/main.tsx` → `dist/editor/`; Bereiche in `editor/sections/`, Prüfungen in `editor/validate.ts`). Neue Datensatz-Felder: Schema + builtin + apply + Editor-Bereich + `DATASET_SPEC.md`.
- `desktop/` – Electron-Hülle für Windows/Steam (`main.cjs` lädt `dist/` über `app://fm1975/`; Anleitung in `desktop/README.md`).
- `docs/specs/` – verbindliche Formeln (Finanzen, Europapokal, Icons, Datensatz-Format `DATASET_SPEC.md`). `docs/recherche/` – historische Recherche, nur bei Bedarf.

## Feste Vorgaben von Pascal
- **Keine Emojis** in der UI – nur `<Icon>` (`src/components/iconPaths.ts`; neues Icon dort ergänzen).
- Genau **eine** Akzentfarbe `#00D9FF`. Sprache Deutsch, informelles „du“.
- Währung DM bis 2001, EUR ab 2002 (`engine/economy.ts`). Datum **immer UTC**.
- Geld: Kontostand/Buchungen **nominal**; Preisschilder (Gehalt, Marktwert, Transferbudget, Prämien-/Vertragswerte) in **1975-Basis**, Anzeige mit `fmtPrice`, Buchung × `economyScale`. Finanzen 2.0 (Marke, TV, Vermarktung, KI-Haushalt, FFP) in `engine/clubEconomy.ts` + `game/seasonFinance.ts`.
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
- Fotorealistische Spielergesichter je Jahrzehnt/Herkunft (Porträtrahmen in `PlayerModal.tsx`); vorher Namensgenerator nach Herkunft (`generate.ts`, `youth.ts`).
- Chronik ins In-Game-Wiki einbinden (`views/statistiken/ChronicleView.tsx`).
- Kalender-Feinschliff (`views/zentrale/CalendarView.tsx`, `engine/calendar.ts`).
- Langfristig: Manager-KI für Gegnervereine.
- Technisch: `processDay` aus `GameShell.tsx` in `src/game/` verlagern und einen Saison-Test ohne UI ergänzen.

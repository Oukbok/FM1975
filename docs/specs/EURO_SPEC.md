# EURO_SPEC — Basic Internationale Pokale (Vorbild 1975/76)

Implementierungs-Spezifikation. Datenquelle: `src/data/europe.ts` (bereits vorhanden).
Ziel: DREI europaeische Wettbewerbe wie 1975 – Europapokal der Landesmeister (`ec`),
Europapokal der Pokalsieger (`cwc`), UEFA-Pokal (`uefa`) – mit deutscher Qualifikation
aus Liga/DFB-Pokal, spielbar wenn der Spielerverein qualifiziert ist, sonst per Staerke
simuliert. K.-o.-System, EIN Spiel pro Runde (kein Hin/Rueck – "basic").

WICHTIG / HARTE VORGABEN:
- Es duerfen am Ende GENAU 7 vorbestehende TS-Fehler bestehen (App.tsx 5 + LineupView.tsx 2).
  Check: `npx tsc --noEmit 2>&1 | grep -c "error TS"` MUSS 7 ergeben. Keine NEUEN Fehler.
- Deutsch, informell ("du"), genau EINE Akzentfarbe #f2a541. Keine Emojis in UI-Komponenten
  (Icons via <Icon name=...>). Datum immer UTC. Waehrung DM (bis 2001).
- Minimal-invasiv: keine unnoetigen Refactors, bestehende Boxenhoehen/Footer nicht anfassen.
- Commit-Messages: ASCII, praegnant.

---

## 1. Feld-Groessen & Wettbewerbe

| comp  | Name                              | Feld | dt. Plaetze | Runden                                  |
|-------|-----------------------------------|------|-------------|-----------------------------------------|
| ec    | Europapokal der Landesmeister     | 16   | 1 (Meister) | Achtelfinale, Viertelfinale, Halbfinale, Finale |
| cwc   | Europapokal der Pokalsieger       | 16   | 1 (Pokalsieger) | Achtelfinale, Viertelfinale, Halbfinale, Finale |
| uefa  | UEFA-Pokal                        | 32   | 3 (Liga 2..4) | 1. Runde, Achtelfinale, Viertelfinale, Halbfinale, Finale |

Auslaendische Teilnehmer kommen fix aus `europe.ts` (EC_CLUBS/CWC_CLUBS/UEFA_CLUBS), die
deutschen dynamisch (siehe 3). Feld MUSS exakt aufgehen (16/16/32).

## 2. Datenmodell

- Wiederverwende die bestehende `CupState`/`CupRound`/`CupTie`-Struktur (`src/types/index.ts`)
  fuer jeden Wettbewerb. Fuege dem `Game` (App.tsx) ein optionales Feld hinzu:
  `euroCups?: { ec: CupState | null; cwc: CupState | null; uefa: CupState | null }` und
  `euroClubs?: Record<string, EuroClub>` (aus `allEuroClubs()`).
  Optional halten -> Abwaertskompatibilitaet mit Alt-Saves.
- Fuer jeden `CupState` gilt: `participantIds` = deutsche Club-IDs (in g.clubs) + eu_-IDs
  (in g.euroClubs). `amateurClubIds` bleibt leer. Eigene Runden-Namen je Wettbewerb.
- Neue Datei `src/engine/euro.ts` fuer die Europapokal-Engine (analog `cup.ts`).

## 3. Qualifikationsregeln (deutsche Teilnehmer)

Die Europapokal-Saison X/Y wird aus der VORSAISON gespeist:
- `ec`: Meister der Vorsaison (Endtabelle Platz 1 der 1. Liga).
- `cwc`: DFB-Pokalsieger der Vorsaison (`cup.winnerClubId`). Ist dieser bereits fuer `ec`
  qualifiziert (=Meister) ODER identisch mit dem EC-Starter, ruecke den DFB-Pokal-FINALISTEN
  nach (Verlierer des Finales = der andere Verein im Final-Tie). Ist auch der nicht ermittelbar,
  nimm den Vizemeister.
- `uefa`: die naechsten 3 Ligaplaetze ab Platz 2 (also 2,3,4), ABER es darf kein Verein doppelt
  qualifiziert sein. Entferne alle bereits fuer `ec`/`cwc` qualifizierten Vereine und KASKADIERE
  nach unten (Platz 5,6,...) bis genau 3 UEFA-Starter feststehen.

Die deutschen Starter sind IMMER volle `Club`s (g.clubs) – Bundesligisten oder ggf.
aufgestiegene. Nur der Spielerverein wird real gemanagt; die uebrigen deutschen laufen wie
auslaendische per Staerke (ausser sie sind der Spielerverein).

### Erste Saison 1975/76
Es gibt keine gespielte Vorsaison -> nutze `EURO_FIRST_SEASON_GERMAN` aus europe.ts fest:
ec=['mgl'], cwc=['fra'], uefa=['ber','off','dui'].
(Real: Gladbach Meister 74/75, Frankfurt DFB-Pokalsieger 74/75, Hertha/Offenbach/Duisburg.)

Helferfunktion `computeGermanEuroQualifiers(g, firstSeason: boolean): Record<EuroCompId,string[]>`
in euro.ts (fuer firstSeason einfach die Konstante zurueckgeben).

## 4. Erstellung & Terminierung

- `createEuroCup(comp, germanIds, foreignIds, leagueDates, cupDates, seed, earliest, managedClubId)`
  in euro.ts, analog `createCup` in cup.ts: baut Runden mit passenden Namen, Termine auf
  Mittwoch-Terminen, die NICHT mit Liga- und DFB-Pokal-Terminen kollidieren, und lost die
  erste Runde aus (`drawRound` aus cup.ts wiederverwenden – ist exportiert).
- Termine: europaeische Runden liegen historisch verteilt ueber die Saison (Sep/Okt/Nov 1.Rd
  + AF, Mrz VF, Apr HF, Mai Finale). Whle midweek-Termine; nutze eine eigene Vorlagen-Liste
  analog `PREFERRED_DATE_TEMPLATE` in cup.ts. Vermeide Kollision mit `leagueDates`-Set.
- Prize-Geld je Wettbewerb (DM), z.B. ec groesser als uefa. Setze plausible Werte in
  `prizeByRound` (z.B. ec: [50k,100k,200k,400k], cwc: [40k,80k,160k,320k],
  uefa: [20k,40k,80k,160k,320k]). Preisgeld je gewonnener Begegnung, ueber `bookCupPrize`
  (existiert in App.tsx) verbuchen.

## 5. Simulation einer Begegnung

Funktion `simulateEuroTie(g, cup, tie, seed)`:
- Wenn der Spielerverein (`g.managedClubId`) beteiligt ist -> VOLLE Match-Engine (wie DFB-Pokal
  via `simulateCupTie`). Falls der Gegner ein auslaendischer eu_-Verein ist, generiere EINMALIG
  einen vollen Kader (siehe 5a) und fuege ihn zu g.clubs/g.players hinzu (nur beim ersten Mal).
- Wenn der Spielerverein NICHT beteiligt ist -> reine Staerke-Simulation (deterministisch,
  mulberry32-Seed aus tie.id), analog `decidePlayoff`/`simMatchGoals` in App.tsx. Kein
  Match-Objekt noetig; setze homeGoals/awayGoals/winnerClubId/decision/played.
  Staerke: auslaendisch = g.euroClubs[id].strength; deutsch = clubStrengthFor(g,id).

### 5a. Lazy-Kadergenerierung fuer auslaendische Gegner des Spielers
- Neue Funktion in `src/data/generate.ts`: `buildEuroClubFull(euro: EuroClub, seasonStart, players)`
  analog `generateCupAmateurs`/`buildProClub`: erzeugt einen vollen `Club` (id = euro.id,
  name/shortName/city/colors aus euro) mit Kader passend zur `euro.strength`, schreibt die
  Spieler in `players` und gibt den Club zurueck. KEIN Jugendstamm.
- Wird nur aufgerufen, wenn der Spieler tatsaechlich gegen diesen Verein spielt -> Save bleibt klein.

## 6. Saison-Lebenszyklus

- Bei `Neues Spiel` (App.tsx doNewGame ~Z.400ff): nach dem DFB-Pokal-Setup `euroClubs` = allEuroClubs()
  setzen und die drei euroCups fuer 1975/76 mit den festen Startern erstellen. Kalendereintraege
  ergaenzen (analog addCupCalendarEvents). Eine Info-Nachricht "Europapokal-Auslosung" an den
  Spieler (nur wenn sein Verein qualifiziert ist, sonst dezente Chronik-Notiz).
- Beim Tages-Tick (App.tsx processDay ~Z.1300ff, wo der DFB-Pokal abgearbeitet wird): analog fuer
  die euroCups die faellige Runde simulieren, Sieger ermitteln, naechste Runde auslosen, Preisgeld
  buchen, Ergebnis-/Auslosungs-Nachrichten (nur wenn Spieler beteiligt). Spieler-Begegnungen wie
  beim DFB-Pokal spielbar machen (nextPlayerTie-Analog, MatchLiveView-Weg wiederverwenden).
- Bei `startNextSeason` (App.tsx ~Z.2294ff): nach Feststehen der Endtabellen die neuen euroCups
  aus `computeGermanEuroQualifiers(g, false)` erstellen (dynamisch). Alte euroCups ersetzen.
- Save-Migration (doLoad ~Z.470ff, und der Block ~Z.510 der fehlende Strukturen nachruestet):
  fehlt `euroClubs`/`euroCups` -> `euroClubs=allEuroClubs()` und euroCups fuer die laufende Saison
  aufsetzen (deutsche Starter via computeGermanEuroQualifiers mit firstSeason = (season==='1975/76')).
  Niemals crashen; alles defensiv (Alt-Saves ohne diese Felder muessen laufen).

## 7. UI — InternationalView (App.tsx ~Z.3416)

Ersetze den Platzhalter durch eine echte Ansicht:
- Drei Tabs/Abschnitte (ec / cwc / uefa) mit `EURO_COMP_NAMES`.
- Je Wettbewerb: aktuelle Runde + Begegnungen (Heim vs Gast mit Ergebnis falls gespielt,
  `decisionBadge` fuer n.V./i.E.), gespielte Runden einklappbar, Sieger hervorgehoben.
- Ist der Spielerverein beteiligt, seine Begegnung hervorheben; naechste spielbare Partie als
  Button (gleicher Weg wie DFB-Pokal-Partien).
- Vereinsnamen: deutsche via clubView(g,id), auslaendische via g.euroClubs[id].name (+ Land).
  Fuer auslaendische KEIN ClubCrest noetig; ein simpler Farbpunkt (colors.primary) genuegt.
- Design konsistent (Panels wie sonst, Akzent #f2a541, Gold `--gold` fuer Pokal-Titel ok).

## 8. Ligatabelle — Markierungen anpassen (App.tsx)

Aktuell: `divisionZone` (Z.2946 globale + Z.3508 lokale Variante) markiert 1.Liga:
Platz1 zone-cl (Meister), Platz2-3 zone-eu (Europapokal), unten zone-rel (Abstieg).
NEU fuer die 1. Liga (tier 1):
- Platz 1  -> zone-cl  (Landesmeister-Pokal)  [bestehende Klasse/Farbe behalten]
- Platz 2,3,4 -> zone-eu (UEFA-Pokal)          [Bereich auf 2..4 erweitern]
- Abstieg unten unveraendert (zone-rel).
Beide `divisionZone`-Vorkommen konsistent aendern (global ~Z.2946 UND lokal ~Z.3508). Achte auf
die tatsaechliche Zeilenzahl (rowCount) statt hart 16.
LEGENDE (App.tsx ~Z.3690): Text anpassen:
- zone-cl: "Landesmeister-Pokal"
- zone-eu: "UEFA-Pokal"
- zone-rel: "Abstieg" (unveraendert)
Der Pokalsieger-Pokal (cwc) haengt am DFB-Pokal, nicht an der Ligatabelle -> KEINE Tabellenzone,
aber in der Legende darf ein kurzer Hinweis stehen ("Pokalsieger-Pokal: ueber den DFB-Pokal").
2.-Liga-Zonen (tier 2) NICHT anfassen.

## 9. Nachrichten
- Auslosungs- und Ergebnis-Nachrichten NUR wenn der Spielerverein beteiligt ist (wie DFB-Pokal).
- Saison-Titel: europ. Sieger als dezente Chronik-/Info-Nachricht (auch wenn nicht der Spieler).

## 10. Wiki-Pflicht (HART)
Neue Mechanik -> BEIDE Wiki-Quellen im selben Schritt pflegen:
- `src/data/wiki.ts`: neue Kategorie `{ id: 'euro', title: 'Europapokal', icon: '🌍' }` + Artikel,
  die Wettbewerbe, Qualifikationsregeln (Liga/DFB-Pokal, Kaskade), K.-o.-Format, Preisgeld und
  Simulation beschreiben (reale Werte, keine TODOs).
- `DEV_WIKI.md`: denselben Inhalt spiegeln. Beide duerfen nie auseinanderlaufen.

## 11. Abschluss
- `npm run build` muss durchlaufen. `npx tsc --noEmit 2>&1 | grep -c "error TS"` == 7.
- Kurz pruefen, dass ein neues Spiel startet und die International-Seite die drei Wettbewerbe zeigt.

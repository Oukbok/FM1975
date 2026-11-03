// =============================================================================
// FOOTBALL MANAGER 1980 — Entwickler-Wiki (Single Source of Truth im Code)
// =============================================================================
// Dokumentiert ALLE Spielmechaniken. Wird 1:1 im In-App-Wiki (durchsuchbar,
// nach Kategorien) angezeigt. Eine menschenlesbare Master-Kopie liegt in
// /home/ubuntu/football-manager-1980/DEV_WIKI.md und MUSS synchron gehalten
// werden (bei Änderungen hier immer auch DEV_WIKI.md aktualisieren).
//
// Struktur bewusst erweiterbar: spätere Blöcke (Training, Entwicklung,
// Auf-/Abwertung, Aufstellung/Taktik, Positions-Gewichtungen, Match-Engine,
// Finanzen) ergänzen einfach weitere Kategorien/Artikel in den Arrays unten.
// =============================================================================

/** Kategorie eines Wiki-Artikels. */
import { YOUTH_RECRUIT_EVENTS } from './youthRecruitEvents';

export interface WikiCategory {
  id: string;
  title: string;
  icon: string;
}

/** Ein einzelner Wiki-Artikel (Body im leichten Markdown/Text-Format). */
export interface WikiArticle {
  id: string;
  category: string; // WikiCategory.id
  title: string;
  /** Freitext (Markdown-artig: ## Überschrift, - Liste, **fett**). */
  body: string;
  /** Suchschlagworte für den Freitext-Filter. */
  keywords?: string[];
}

export const WIKI_CATEGORIES: WikiCategory[] = [
  { id: 'core', title: 'Grundlagen', icon: '📘' },
  { id: 'leagues', title: 'Ligastruktur & Auf-/Abstieg', icon: '🪜' },
  { id: 'squad', title: 'Kader & Spieler', icon: '👥' },
  { id: 'condition', title: 'Form & Fitness', icon: '📈' },
  { id: 'messages', title: 'Nachrichten', icon: '📬' },
  { id: 'save', title: 'Speichern & Laden', icon: '💾' },
  // --- Platzhalter-Kategorien für spätere Blöcke ---
  { id: 'training', title: 'Training', icon: '🎯' },
  { id: 'development', title: 'Entwicklung & Potenzial', icon: '⭐' },
  { id: 'tactics', title: 'Aufstellung & Taktik', icon: '🧩' },
  { id: 'match', title: 'Match-Engine', icon: '⚽' },
  { id: 'ai', title: 'KI-Vereine & Trainer', icon: '' },
  { id: 'finance', title: 'Finanzen', icon: '💰' },
  { id: 'youth', title: 'Jugendsystem', icon: '🧒' },
  { id: 'facilities', title: 'Vereinsgelände', icon: '🏟️' },
  { id: 'staff', title: 'Mitarbeiter', icon: '🧑‍💼' },
  { id: 'marketing', title: 'Marketing', icon: '📣' },
  { id: 'environment', title: 'Vereinsumfeld', icon: '' },
  { id: 'calendar', title: 'Kalender & Aktivitäten', icon: '🗓️' },
  { id: 'cup', title: 'Landespokal', icon: '🏆' },
  { id: 'euro', title: 'Europapokal', icon: '🌍' },
  { id: 'chronicle', title: 'Chronik & Epochen', icon: '📜' },
];

export const WIKI_ARTICLES: WikiArticle[] = [
  // ---------------------------------------------------------------------------
  // GRUNDLAGEN
  // ---------------------------------------------------------------------------
  {
    id: 'core-overview',
    category: 'core',
    title: 'Spielüberblick',
    keywords: ['bundesliga', '1975', 'saison', 'punkte', 'weiter', 'epoche', 'chronik'],
    body: `## 1975 – A Football Manager
Deutsche Retro-Fußballmanager-Simulation. Der Spielstand startet in der **Saison 1975/76** (18 Vereine, 34 Spieltage) im Libero-Zeitalter und lässt sich über Jahrzehnte fortführen — Saison für Saison. Startdatum: **1. Juli 1975** (UTC).

## Zeitfortschritt
- Der Kalender läuft tageweise. Mit dem **Weiter**-Button oben rechts (oder der **Leertaste**) startest/stoppst du den Auto-Advance.
- Solange die Zeit läuft, erscheint in der Bildschirmmitte der **Kalenderstreifen** (siehe Artikel „Kalender & planbare Aktivitäten“); der Rest des Bildschirms ist dann unscharf und abgedunkelt, nur der **Pause**-Knopf bleibt bedienbar.
- Der Button hat eine **feste Größe** und wechselt je nach Kontext die Beschriftung (Weiter / Pause / Simulieren / ▶ Neue Saison), ohne zu springen.
- An wichtigen Ereignissen (**dein Spiel** – hier hält der Vorlauf unmittelbar vor dem Anpfiff an und öffnet das Match-Fenster im Vor-Anpfiff-Zustand –, **große Saison-Bewertung**, Saisonende) hält das Spiel automatisch an. Die Pause landet dabei **genau auf dem betreffenden Tag** (also z.B. **am Spieltag selbst**, nicht am Folgetag): Das angezeigte Datum in der Zentrale bleibt auf diesem Tag stehen, der Tageswechsel wird erst nachgeholt, sobald du den Vorlauf fortsetzt. Auch die drei Bewertungsrunden (Herbst, Winter, Saisonende) halten an und zeigen die Bewertungs-Show. Am Saisonende wird der **Weiter**-Button zu **„▶ Neue Saison"** und startet die Folgesaison samt fälliger Chronik-Meilensteine.

## Punktesystem
- Das Punktesystem ist **historisch automatisch** und **nicht mehr manuell wählbar**: **2 Punkte pro Sieg bis Saison 1994/95**, **ab Saison 1995/96 automatisch 3 Punkte pro Sieg** (Remis stets 1 Punkt).
- Die Umstellung erfolgt ausschließlich über den Chronik-Meilenstein „3-Punkte-Regel" beim Erreichen der Saison **1995/96** — das wirkt **real auf die Tabellenberechnung**.

## Chronik & Epochen
- Historische Meilensteine (Rückpassregel, Meisterliga, Bosman, FFP, Torlinientechnik, VAR …) werden zur jeweiligen Saison ausgelöst — siehe **Chronik des deutschen Fußballs** (Link unten rechts in der Fußleiste; öffnet ein großes Fenster mit Suche, Sprung zur aktuellen Saison und Jahrzehnten).`,
  },
  {
    id: 'core-datetime',
    category: 'core',
    title: 'Datum & Zeitzonen (UTC-Regel)',
    keywords: ['utc', 'datum', 'zeitzone', 'kalender', 'bug'],
    body: `## Datumslogik immer in UTC
Alle Datumsberechnungen nutzen **UTC** (\`'T00:00:00Z'\`, \`setUTCDate\`, \`getUTCDate\`).

**Warum:** Mit lokaler Datumsmathematik (z.B. Europe/Berlin, CEST) konnte der Tageswechsel bei der Sommerzeit-Umstellung "hängen bleiben". Durch konsequentes UTC ist der Fortschritt in jeder Zeitzone stabil.

Betroffen: \`engine/calendar.ts\`, \`engine/league.ts\` und jede neue datumsbezogene Logik.`,
  },
  {
    id: 'core-datasets',
    category: 'core',
    title: 'Datensätze & Datensatz-Editor (Modding)',
    keywords: ['datensatz', 'editor', 'modding', 'mod', 'wappen', 'trikot', 'vereine', 'import', 'export', 'json'],
    body: `## Was ist ein Datensatz?
Ein Datensatz ist eine einzelne JSON-Datei (\`<id>.fm1975.json\`), die festlegt, womit ein **neues Spiel** startet: Vereine aller Ligen, Wappen und Trikots, Europa (Länder, Starter der ersten Saison), Chronik-Ereignisse, Ligareformen, Einrichtungen, Mitarbeiter-Rollen, Marketing-Kanäle, Namen und Herkünfte, Wirtschaftskurven und besondere Zeitabschnitte. Der eingebaute Datensatz **Standard (1975)** entspricht den Werten im Code.

## Der Editor
Der Datensatz-Editor ist eine eigene Seite unter **/editor/** (Hauptmenü → Datensätze → Editor öffnen).
- **Neu** legt eine Kopie des Standards an, **Datei öffnen** lädt eine JSON-Datei, **Aus dem Spiel öffnen** einen bereits übernommenen Datensatz.
- Die **Arbeitskopie** sichert sich automatisch im Browser – auch nach dem Schließen geht nichts verloren.
- Jeder Bereich hat einen kurzen Erklärtext. Jahre steuern, **wann** etwas kommt oder verschwindet (z. B. „Ab Jahr“/„Bis Jahr“ bei Einrichtungen, Mitarbeitern und Marketing, Saison bei Chronik und Reformen).
- **Vereine:** je Verein eigenes Wappen (PNG/JPG/SVG, auf 256 px verkleinert) und Heim-/Auswärtstrikot (Farben + Muster).
- **Prüfen** zeigt Fehler (z. B. doppelte IDs, ungerade Ligagrößen, fehlende Starter) und Hinweise.
- **Exportieren** lädt die Datei herunter (zum Teilen), **Ins Spiel übernehmen** speichert sie direkt im Browser.

## Im Spiel
Übernommene oder importierte Datensätze erscheinen unter **Datensätze** und werden bei **Neues Spiel** gewählt. Ein Spielstand merkt sich die ID seines Datensatzes und wendet ihn beim Laden erneut an. Vereine und Kader stecken im Spielstand selbst; Tabellen wie Chronik, Mitarbeiter oder Marketing kommen aber aus dem Datensatz – überschreibst du einen Datensatz mit gleicher ID, gelten solche Änderungen auch für dessen Spielstände. Für Experimente lieber eine neue ID wählen. Fehlende Felder fallen auf den Standard zurück.

## Grenzen
Wirkungen von Einrichtungen sowie die Übergangsregeln der vier eingebauten Ligareformen bleiben im Spiel fest (verknüpft über Schlüssel bzw. Reform-ID). Reformen mit eigener ID bauen die Ligapyramide noch nicht um. Bitte nur erfundene Namen für Vereine, Spieler und Stadien verwenden. Das genaue Format steht in \`docs/specs/DATASET_SPEC.md\`.`,
  },

  // ---------------------------------------------------------------------------
  // LIGASTRUKTUR & AUF-/ABSTIEG
  // ---------------------------------------------------------------------------
  {
    id: 'leagues-structure',
    category: 'leagues',
    title: 'Ligastruktur & Ebenen',
    keywords: ['liga', 'ebene', 'tier', '2. liga', 'nord', 'süd', 'staffel', 'ligasystem', 'struktur'],
    body: `## Mehrstufiges Ligasystem
Das Spiel bildet ab 1975/76 mehrere **Ebenen** (Tiers) ab. Die Datenstruktur ist bewusst erweiterbar, damit spätere Reformen (eingleisige 2. Liga, 3. Ebene, DDR-Ligen) ohne Bruch andocken können.

- **Ebene 1 — 1. Liga:** 18 Vereine, 34 Spieltage. Reale Teilnehmer der Saison 1975/76, rechtssicher als Städtenamen.
- **Ebene 2 — 2. Liga (1975/76 zweigleisig):** **Staffel Nord** (20 Vereine) + **Staffel Süd** (20 Vereine), je 38 Spieltage.

## Vereine der 2. Liga
Die 2.-Liga-Vereine sind reine **Städtenamen** (rechtssicher, keine geschützten Vereinsnamen/Logos):
- **Belegte reale Standorte 1975/76** — Nord u. a. Berlin, Dortmund, Münster, Wuppertal; Süd u. a. Saarbrücken, Nürnberg, Mainz, Schweinfurt, Reutlingen, Völklingen, Bad Kreuznach.
- **Klar fiktive Platzhalter** aus kleineren realen Städten ohne bekannten Profiverein — z. B. Lüdenscheid, Goslar, Detmold, Buxtehude (Nord); Kempten, Rosenheim, Landshut, Passau (Süd).

Jeder 2.-Liga-Verein hat nur eine aggregierte **Stärke** + **Farben** + generisches Wappen — **keinen vollen Kader**. Erst beim Aufstieg in die Spielerliga wird ein vollständiger Kader generiert.

## Tabellen-Ansicht
Im Bereich **Tabelle** schaltest du oben zwischen **1. Liga**, **2. Liga Nord** und **2. Liga Süd** um. Deine aktuelle Liga ist mit **** markiert und vorausgewählt.

## Single Source of Truth
Ligadaten leben in \`src/data/generate.ts\` (Seeds: \`CLUB_SEEDS\`, \`SECOND_LIGA_NORD_SEEDS\`, \`SECOND_LIGA_SUED_SEEDS\`) und im Ligamodul \`src/engine/leagues.ts\` (Typen \`SimClub\`, \`LeagueDivision\`, \`LeagueSystem\`).`,
  },
  {
    id: 'leagues-simulation',
    category: 'leagues',
    title: 'Vereinfachte Simulation der Nicht-Spieler-Ligen',
    keywords: ['simulation', 'stärke', 'performant', 'sim', 'nicht-spieler', 'ki', 'spieltag', 'engine'],
    body: `## Zwei Simulationsstufen
- **Deine Liga (volle Match-Engine):** Nur die Liga/Staffel, in der dein Verein aktuell spielt, wird mit der vollständigen Match-Engine (Minutenevents, Fitness, Finanzen …) berechnet.
- **Alle anderen Ligen/Staffeln (Stärke-Simulation):** Werden **performant** pro Spieltag rein aus den aggregierten Stärken plus Zufall berechnet (schnelle Torermittlung, Heimvorteil). Kein Tick-Lag, keine Kaderpflege.

## Ablauf
- Jede Sim-Staffel spielt nach ihrem **eigenen Spielplan**: Sobald der Termin eines Spieltags erreicht ist, wird er berechnet (\`advanceDivisionsTo\` → \`advanceDivision\`) und die Tabelle aktualisiert. So hat die 2. Liga ihre eigenen englischen Wochen und die DDR-Oberliga ihre lange Winterpause bis Ende Februar (Artikel „Winterpause“).
- Am Saisonende werden restliche Sim-Spieltage automatisch fertig simuliert (\`flushDivision\`), bevor Auf-/Abstieg berechnet wird.
- Die Ergebnisse sind **deterministisch** (seed-basierter RNG pro Staffel & Spieltag).

## Umbau bei Auf-/Abstieg
Es gilt strikt: **Nur die Spielerliga hat volle Kader.** Bei jedem Saisonwechsel wird abgeglichen:
- Verein steigt **in** die Spielerliga auf → voller Kader wird generiert (\`buildProClub\`).
- Verein verlässt die Spielerliga → wird auf einen aggregierten \`SimClub\` reduziert (Stärke = Ø-Overall des bisherigen Kaders), Kader wird freigegeben.`,
  },
  {
    id: 'leagues-promotion',
    category: 'leagues',
    title: 'Auf- und Abstiegsregeln',
    keywords: ['aufstieg', 'abstieg', 'playoff', 'relegation', 'meister', 'saisonwechsel', 'wiederaufstieg'],
    body: `## Regelwerk (ab 1975/76)
Am Saisonende (Übergang zur Folgesaison) gilt:

- **Absteiger 1. Liga:** die **letzten 3** der Abschlusstabelle steigen in die 2. Liga ab.
- **Aufsteiger 2. Liga:**
  - Der **Meister der Staffel Nord** steigt direkt auf.
  - Der **Meister der Staffel Süd** steigt direkt auf.
  - Zusätzlich spielen die beiden **Staffel-Zweiten** ein **Aufstiegs-Playoff** (Hin-/Rückspiel, deterministisch simuliert) um den **dritten** Aufstiegsplatz.
- Ergebnis: **3 rauf / 3 runter**, die 1. Liga bleibt konstant bei **18** Vereinen.

## Staffeln bleiben bei 20
Die 3 Absteiger füllen die 2. Liga wieder auf: Sie werden so verteilt, dass **jede Staffel wieder 20 Vereine** hat (die Staffel, die zwei Aufsteiger abgegeben hat, erhält zwei Absteiger; die andere einen).

## Dein Verein steigt mit
- Steigt dein Verein auf oder ab, **folgt die volle Match-Engine deinem Verein** in die neue Liga/Staffel. Spielplan, Tabelle und Landespokal-Feld passen sich automatisch an (18 → 34 Spieltage bzw. 20 → 38 Spieltage).
- Du erhältst eine Vorstands-Nachricht zum Auf- bzw. Abstieg; eine Sportredaktions-Meldung fasst alle Auf-/Absteiger zusammen.

## Amateurligen: Tausch mit dem Vereins-Pool
Unterhalb der untersten simulierten Liga liegen die **Amateurligen** als Vereins-Pool: frühere Bundesligisten wie **Oberhausen**, **Neunkirchen** oder **Berlin Neukölln** (Tasmania), die Absteiger der 2. Liga 1975 und Amateur-Spitzenvereine (z. B. Kiel, Trier, Freiburg). Jede Saison tauschen die Schlechtesten der untersten Liga mit den stärksten Pool-Vereinen ihrer Region – bei zwei Staffeln **je 4**, eingleisig **3**, ab drei Staffeln **je 2**. Wer in den Pool fällt, kann später zurückkehren; steigt ein Pool-Verein bis in deine Liga auf, bekommt er wie jeder Aufsteiger einen vollen Kader. Ligareformen besetzen neue Plätze zuerst aus dem Pool, erst danach mit fiktiven Platzhaltern.

## Ausblick
Die historischen Ligareformen (eingleisige 2. Liga **1981/82**, Regionalliga **1994/95**, 3. Liga **2008/09**) sind als datengetriebenes **Reformsystem** umgesetzt und greifen automatisch beim jeweiligen Saisonwechsel — Details siehe Artikel „Ligareformen (historischer Umbau)“. Die DDR-Integration 1991/92 dockt als weiterer Reform-Datensatz an.`,
  },

  {
    id: 'leagues-reforms',
    category: 'leagues',
    title: 'Ligareformen (historischer Umbau)',
    keywords: ['reform', 'reformen', 'umbau', 'struktur', '1981', '1994', '2008', 'eingleisig', 'regionalliga', '3. liga', 'platzhalter', 'migration', 'saisonwechsel'],
    body: `## Was ist das Reformsystem?
Die deutsche Ligastruktur hat sich über die Jahrzehnte mehrfach umgebaut. Diese historischen Umbauten sind im Spiel als **atomare Reform-Datensätze** hinterlegt. Jeder Datensatz beschreibt:

- **Wirksame Saison** – ab wann der Umbau greift (z. B. 1981/82).
- **Titel & Beschreibung** – was sich ändert.
- **Betroffene Ebenen** – welche Ligastufen berührt werden.
- **Qualifikationsregel** – nach welcher sportlichen Regel die bestehenden Vereine der neuen Struktur zugeordnet werden.
- **Ziel-Struktur** – die vollständige Soll-Pyramide (Ligen, Staffeln, Sollgrößen) ab dieser Saison.

## Ablauf beim Saisonwechsel
Steht zur neuen Saison eine noch nicht angewandte Reform an, führt die Engine – **integriert in den normalen Auf-/Abstieg** – diese Schritte aus:

1. Alte Saison abschließen (alle Endtabellen stehen fest).
2. Sportliche Qualifikanten nach der Reformregel bestimmen.
3. Aufstiegs-/Playoff-Runden (vereinfacht) auflösen.
4. Lizenzprüfung (vereinfacht: **sportlich qualifiziert = lizenziert**).
5. Reformbedingte Zusatz-Qualifikation.
6. Vereine geografisch (Nord/Nordost/West/Süd) den Staffeln zuweisen.
7. Sollgrößen prüfen: fehlende Plätze mit **klar fiktiven Platzhaltervereinen** auffüllen (erkennbar erfundene Städtenamen wie „FC Musterstadt“, „SV Beispielheim“) **oder** überzählige Vereine dokumentiert entfernen.
8. Neue Spielpläne der neuen Struktur erzeugen.
9. Alte Tabellen ersetzen und eine **Chronik-Meldung** zur Reform auslösen.

**Dein Verein ist geschützt:** Auch bei einer Reform, die Vereine aus der Simulation entfernt, fällt dein eigener Verein nie heraus – er wird notfalls in die unterste Ebene übernommen.

## Reform 1981/82 – Eingleisige 2. 1. Liga
Die beiden Staffeln **Nord und Süd** der 2. Liga werden zu **einer eingleisigen 2. Liga mit 20 Vereinen** (38 Spieltage) zusammengeführt.
- **Qualifikation:** die **besten 10** jeder Staffel (Nord + Süd) der Saison 1980/81, abzüglich der Aufsteiger in die 1. Liga, ergänzt um die 3 Erstliga-Absteiger.
- Alle übrigen 2.-Liga-Vereine steigen in die (nicht simulierten) Amateurligen ab und werden aus der Simulation entfernt.

## Reform 1994/95 – Regionalliga als 3. Ebene
Unterhalb der 2. Liga entsteht eine neue **dritte Ebene: die Regionalliga mit vier Staffeln** (Nord, Nordost, West, Süd) zu je 18 Vereinen.
- **Besetzung:** Da die realen Amateur-Oberligen nicht Teil der Simulation sind, werden die vier Staffeln mit **klar fiktiven Platzhaltervereinen** besetzt (geografisch zugeordnet).
- Ab jetzt ist Auf-/Abstieg zwischen 2. Liga und Regionalliga möglich.

## Reform 2008/09 – Einführung der 3. Liga
Zwischen 2. Liga und Regionalliga wird eine neue, **eingleisige 3. Liga mit 20 Vereinen** eingezogen; die Regionalliga rückt auf **Ebene 4** (nun drei Staffeln: Nord, Nordost, Süd zu je 18).
- **Qualifikation:** die **besten 5** jeder der vier bisherigen Regionalliga-Staffeln (2007/08) bilden die 20 Startplätze der 3. Liga (vereinfachte Lizenzprüfung).
- Die übrigen Vereine bilden die neue viertklassige Regionalliga; fehlende Plätze werden mit fiktiven Platzhaltern aufgefüllt.

## Nur die Spielerliga spielt „echt“
Wie im übrigen Spiel gilt: **nur deine eigene Liga** nutzt die volle Match-Engine. Alle zusätzlichen und neuen Ebenen werden **performant per Stärke simuliert**.

## Erweiterbar
Das System ist bewusst datengetrieben: weitere Reformen (z. B. die **DDR-Integration 1991/92**) lassen sich als zusätzlicher Reform-Datensatz ergänzen, ohne die Kernlogik zu ändern.`,
  },

  {
    id: 'leagues-ddr',
    category: 'leagues',
    title: 'DDR-Ligen & Wiedervereinigung 1991/92',
    keywords: ['ddr', 'oberliga', 'ddr-liga', 'ost', 'osten', 'wiedervereinigung', 'wende', 'nofv', '1991', 'karl-marx-stadt', 'chemnitz', 'dresden', 'rostock', 'ostberlin'],
    body: `## Parallele DDR-Ligapyramide (bis 1991/92)
Von Saisonstart 1975/76 an läuft **parallel** zum bundesdeutschen Ligasystem eine eigene DDR-Ligapyramide:

- **DDR-Oberliga** – oberste DDR-Ebene, **14 Vereine**.
- **DDR-Liga** – vereinfachter Unterbau, eine Staffel (**12 Vereine**).

Jede Saison steigen die **zwei Letzten der Oberliga** ab und die **zwei Besten der DDR-Liga** auf; die zwei Letzten der DDR-Liga tauschen mit dem DDR-Pool (u. a. Stralsund, Stendal, Steinach, Neubrandenburg, Gera, Eisenhüttenstadt).

Beide werden – wie alle Nicht-Spielerligen – **performant per Stärke simuliert** und haben ihre **eigenen Tabellen**. Im Bereich **Tabelle** lassen sie sich über den Liga-Umschalter auswählen (klar beschriftet als „DDR-Oberliga“ / „DDR-Liga“).

## Rechtssichere Städtenamen
Alle Vereine tragen reine **Städtenamen** (keine geschützten realen Vereinsnamen/Logos). Die Oberliga entspricht dem echten Teilnehmerfeld **1975/76**: **Dresden, Berlin (Ost), Magdeburg, Jena, Leipzig, Frankfurt (Oder), Erfurt, Halle, Karl-Marx-Stadt, Zwickau, Aue, Riesa, Leipzig Grün, Cottbus**. „**Berlin (Ost)**“ ist klar von West-Berlin unterschieden. In der DDR-Liga spielen u. a. Rostock, Brandenburg und Berlin Köpenick; die restlichen Plätze füllen **klar fiktive Platzhalterstädte**.

## Zeit-korrekte Umbenennung (Chemnitz ↔ Karl-Marx-Stadt)
Historische Umbenennungen werden über eine **kanonische Identität** (\`canonicalId\`) plus **historischen Namen** (\`historicalName\`) und **Umbenennungsjahr** (\`renamedYear\`) modelliert. Beispiel **Chemnitz**: bis 1989 wird der Verein als **„Karl-Marx-Stadt“** angezeigt, ab 1990 als **„Chemnitz“** – die Tabelle zeigt stets den zum Spieljahr passenden Namen.

## Reform 1991/92 – Deutsche Wiedervereinigung im Fußball
Zur Saison **1991/92** wird das DDR-System in die gesamtdeutsche Pyramide integriert (Chronik-Meldung **„Deutsche Wiedervereinigung im Fußball“**). Nach dem DDR-Oberliga-Endstand der Vorsaison:

- **Platz 1–2 → 1. Liga** (historisch Rostock + Dresden). Die 1. Liga wird dafür **einmalig auf 20 Vereine** (38 Spieltage) vergrößert.
- **Platz 3–6 → 2. Liga** (direkt: Erfurt, Halle, Chemnitz, Jena).
- **Platz 7–8 → 2. Liga** über eine Aufstiegsrunde (z. B. Leipzig, Brandenburg).
- **Restliche DDR-Oberliga + komplette DDR-Liga → NOFV-Oberliga** als **dritte Ebene** (Staffel Nordost). 1991/92 gibt es noch **keine** Regionalliga – diese kommt erst mit der Reform **1994/95**, in die die NOFV-Oberliga dann übergeht.

Die separat geführte DDR-Struktur wird damit **aufgelöst**; die Ost-Vereine sind ab sofort Teil des gesamtdeutschen Auf-/Abstiegs.

## Normalisierung 20 → 18
Die einmalig vergrößerte 1. Liga (und die vergrößerte 2. Liga) werden **ab der Folgesaison 1992/93** durch den regulären Auf-/Abstieg wieder auf ihre **Sollgrößen** (18 bzw. 20) zurückgeführt: In jener Saison steigen entsprechend **mehr Vereine ab** als sonst (übergroße Ebenen geben ihre schwächsten Vereine an die nächsttiefere Ebene ab, auf der untersten Ebene fallen Überzählige aus der Simulation).

## Reihenfolge der Reformen
Die 1981er-Reform (eingleisige 2. Liga) liegt vor der Wiedervereinigung, die Regionalliga-Reform (1994/95) danach. Alle Reformen greifen sauber ineinander, und dein eigener Verein bleibt jederzeit geschützt (fällt nie aus der Simulation).`,
  },

  {
    id: 'season-awards',
    category: 'leagues',
    title: 'Auszeichnungen: Die Besten der Saison & Goldener Ball',
    keywords: ['goldener ball', 'fußballer des jahres', 'weltfußballer', 'gala', 'auszeichnung', 'ehrung', 'spieler der saison', 'newcomer', 'torwart', 'abwehr', 'mittelfeld', 'sturm', 'beste', 'elf', 'notenschnitt', 'zu null'],
    body: `## Worum geht es?
Am Tag nach dem letzten Ligaspieltag ehrt die Sportredaktion die **besten Spieler auf ihren Positionen** – in vier Kategorien: **Torwart, Abwehr, Mittelfeld und Sturm**, jeweils mit Platz 1 bis 3. Dazu kommen der **Spieler der Saison** und der **Newcomer der Saison** (höchstens 21 Jahre). Ein festliches Fenster zeigt die Geehrten; alle Jahrgänge findest du unter **Statistiken › Auszeichnungen**.

## Welche Liga?
Geehrt wird in der Liga deines Vereins – nur dort spielen alle Mannschaften mit vollen Kadern und Einzelstatistik. Die Kategorie richtet sich nach der Stammposition des Spielers.

## So wird gewertet
Es zählen nur **Ligaspiele**. Wertbar ist, wer mindestens **die Hälfte der Spieltage** gespielt hat (Newcomer: 40 %). Jeder bekommt Wertungspunkte:
- **Leistung:** 3 × (4,0 − Notenschnitt) – der wichtigste Baustein.
- **Einsätze:** Anteil der Spieltage, bis 1 Punkt.
- **Mannschaftserfolg:** Meister 1 Punkt, Tabellenletzter 0 – nur leicht gewichtet.
- **Torwart:** Spiele zu null (× 3 je Spiel) und wenige Gegentore der Mannschaft.
- **Abwehr:** Spiele zu null (× 2), wenige Gegentore, dazu Tore und Vorlagen.
- **Mittelfeld:** Tore (× 0,7) und Vorlagen je Spiel × 4.
- **Sturm:** Tore (und 0,4 × Vorlagen) je Spiel × 5 – Torjäger landen meist vorn.

Den **Spieler der Saison** bestimmt der Abstand zur eigenen Konkurrenz: Wer sich in seinem Mannschaftsteil am deutlichsten von den anderen abhebt, gewinnt – so stehen Torhüter und Stürmer fair gegeneinander.

## Folgen
Geehrte Spieler aus deinem Kader freuen sich: kleiner Moral-Schub (Sieger mehr als Platz 2 und 3, Spieler der Saison zusätzlich). Die Ehrungen bleiben im Archiv – auch wenn der Spieler später wechselt oder seine Karriere beendet.

## Goldener Ball – Fußballer des Jahres
Am **20. Dezember** hält der Zeitlauf an: Bei einer **Gala** (bis 2009 und ab 2016 in Paris, 2010–2015 in Zürich) wird der beste Spieler des **Kalenderjahres** geehrt – erst Platz 3, dann Platz 2, dann der Sieger mit dem Goldenen Ball, danach die Plätze 4 bis 10.
- **Wer ist wählbar?** Bis **1994** nur Spieler mit europäischer Staatsangehörigkeit bei europäischen Vereinen („Europas Fußballer des Jahres“), ab **1995** alle Spieler europäischer Vereine, ab **2007** Spieler aller Ligen weltweit („Weltfußballer des Jahres“) – im Spiel sind die europäischen Ligen simuliert.
- **Kalenderjahr:** Rückrunde der abgelaufenen Saison (halb gewichtet) plus Hinrunde der laufenden Saison, alle Wettbewerbe. Mindestens 10 Spiele.
- **Wertung:** 3 × (4,0 − Notenschnitt), Klasse (Stärke über 70), Tore und Vorlagen je Spiel (Sturm am stärksten gewichtet), Spiele zu null für Torwart und Abwehr, dazu **Titel**: Landesmeister-Cup 2 Punkte, Pokalsieger-Cup 1, UEFA-Pokal 0,8, Meisterschaft 1, Pokal 0,5. Unter 20 Spielen gibt es anteilig weniger.
- **Auslandsstars:** Für die Spitzenvereine Europas kennt das Spiel nur die Stars aus dem Europapokal. Ihre Noten und Torquoten werden aus ihrer Stärke geschätzt – nach dem gleichen Maßstab wie bei den voll simulierten Spielern –, Europapokal-Tore und Titel zählen echt.
- **Folgen:** Preisträger aus deinem Kader bekommen einen Moral-Schub (Sieger am meisten), ein Sieger hebt zudem das Ansehen deines Vereins leicht.
- Die Zeremonie lässt sich in den Einstellungen („Ehrungen“) abschalten; alle Sieger stehen unter **Statistiken › Auszeichnungen** – ein Klick auf ein Jahr zeigt die Gala erneut.`,
  },

  {
    id: 'leagues-history',
    category: 'leagues',
    title: 'Ligen, Pokale, Historie & Bestenlisten',
    keywords: ['tabelle', 'historie', 'archiv', 'saison', 'torschützen', 'vorlagen', 'scorer', 'gelb', 'rot', 'weiße weste', 'zu null', 'turnierbaum', 'runden', 'bundesliga', '1963', 'pool', 'amateur'],
    body: `## Eine Seite für jeden Wettbewerb
Unter **Statistiken › Liga, Pokal und International** siehst du jeden Wettbewerb im gleichen Aufbau: links groß die **Tabelle** (umschaltbar Gesamt / Heim / Auswärts / Form) bzw. beim Pokal der **Turnierbaum** oder die **Rundenliste** mit Rundenwahl, rechts die **Statistik** und darunter Saisonbilanz bzw. „Dein Weg“. Oben wählst du **Saison** und **Wettbewerb**: alle Ligen aller Ebenen, die DDR-Ligen, Landespokal, Europapokale und – für die zuletzt beendete Saison – die Auslandsligen.

## Bestenlisten
Die Match-Engine zählt je Wettbewerb: **Tore, Vorlagen, Scorer** (Tore + Vorlagen), **Gelbe Karten, Rote Karten** (Gelb-Rot zählt mit) und die **Weiße Weste** (Spiele ohne Gegentor eines Torhüters). Ligen ohne volle Kader werden vereinsweise simuliert – dort zeigt die Statistik **Vereinswerte** (Tore, Gegentore, Siege, Zu-null-Spiele). Im Europapokal zählen die voll simulierten Spiele mit deutscher Beteiligung.

## Archiv
Am Saisonende werden alle Abschlusstabellen, alle Pokalrunden und die **besten 10** (Pokale: 5) jeder Kategorie archiviert. So kannst du jede vergangene Saison wieder aufrufen.

## Historie vor Spielbeginn (1963/64–1974/75)
Die echten Abschlusstabellen der Bundesliga seit 1963/64, der 2. Liga Nord/Süd 1974/75 und der DDR-Oberliga, alle Pokal- und Europapokal-Endspiele sowie der Verein des Torschützenkönigs sind hinterlegt – übertragen auf die Spiel-Vereine (Städtenamen). Sie stehen auch in der **Vereins-Historie** (Endplätze, Titel), in der **Ruhmeshalle** (Rekordmeister) und in der **Chronik**. Namen echter Spieler werden nicht verwendet.

## Vereine unterhalb der Ligen
Frühere Bundesligisten, die 1975 nur noch in den Amateurligen spielen, existieren als Vereine im **Pool** und können über den Auf-/Abstieg zurückkehren (siehe „Auf- und Abstiegsregeln“).`,
  },

  // ---------------------------------------------------------------------------
  // KADER & SPIELER
  // ---------------------------------------------------------------------------
  {
    id: 'squad-table',
    category: 'squad',
    title: 'Kader-Tabelle',
    keywords: ['kader', 'tabelle', 'spalten', 'ovr', 'sterne', 'form', 'fitness', 'sortieren'],
    body: `## Kader als Tabelle
Der Kader-Bildschirm zeigt die Mannschaft als **übersichtliche Tabelle** (kein Spielerbild/Avatar), damit du alle wichtigen Werte auf einen Blick vergleichen kannst.

**Farben:** Spieler der aktuellen **Startelf** sind grün hinterlegt, die **Ersatzbank** blau, alle übrigen (nicht im Spieltagskader) ohne Farbe – genauso in der Aufstellung.

## Rechtsklick auf Spieler
Ein **Rechtsklick** auf einen Spieler – in Listen, Tabellen oder auf sein Gesicht – öffnet ein Menü mit den passenden Aktionen: Spielerprofil, Entwicklung, Vertrag, Wünsche, Medizin, bei eigenen Spielern **Transferliste** und **Zur Aufstellung**, bei fremden Spielern **Transferverhandlung**, dazu der Verein. Auf Touch-Geräten öffnet ein **langer Druck** dasselbe Menü.

## Spalten
- **#** Rückennummer
- **Name**
- **Pos** natürliche Position
- **Alter**
- **OVR** Gesamtstärke, farbcodiert (Grün > 75, Gelb 60–75, Orange/Rot < 60)
- **Potenzial** als **goldene Sterne** (1.0–5.0), plus max. erreichbare OVR
- **Form** Indikator mit Pfeil & Farbe (siehe Kategorie „Form & Fitness")
- **Fitness** 0–100, farbcodiert
- **Wichtige Attribute** je nach Position (z.B. Torschuss, Passspiel, Zweikampf)
- **Status** fit / verletzt (mit Resttagen) / gesperrt

## Interaktion
- Jede **Zeile ist anklickbar** und öffnet das bestehende Spieler-Detailfenster (PlayerModal) mit Radar-Chart und allen Attributen.
- Sortierung nach OVR, Potenzial, Form oder Fitness möglich.`,
  },
  {
    id: 'club-profile',
    category: 'core',
    title: 'Vereinsprofil (Gegner-Info)',
    keywords: ['verein', 'profil', 'gegner', 'wappen', 'scouting', 'historie', 'direkter vergleich', 'trainer', 'rekord', 'platzierung'],
    body: `## Aufruf
Fast jeder **Vereinsname und jedes Wappen** ist anklickbar und öffnet das Vereinsprofil: Tabelle (Liga und Zentrale), Spielplan und Spieltag, Landespokal, Europapokal, Transfermarkt, Verhandlungen, Torjäger, Spielbericht, Taktik („Nächster Gegner“), Presse und das Spielerprofil (Vereinsname bzw. Wappen am Porträt). Das Profil liegt über allen anderen Fenstern; öffnest du daraus einen weiteren Verein, bringt dich **Zurück** zum vorherigen. Escape schließt erst das Spielerprofil, dann das Vereinsprofil.

## Reiter
- **Übersicht**: Stadt, Gründung, Liga und Tabellenplatz, Form, Ansehen. Kräftevergleich und Duelle mit deinem Verein (nächstes, letztes, Bilanz über alle Jahre). Trainer. **Kurzbewertung**: Ø der Stammkräfte je Mannschaftsteil (1 Torwart, je 4 Abwehr/Mittelfeld, 2 Angriff) als Spiegelbalken gegen dein Team; der stärkere Wert ist hervorgehoben. Stärkste Spieler und die letzten/nächsten Spiele.
- **Kader**: alle Spieler, sortierbar. Die Stärke siehst du wie auf dem Transfermarkt genau, das **Potenzial nur als Scouting-Spanne** (Sterne von–bis, je nach Scout-Qualität). Klick öffnet das Spielerprofil, **Verhandeln** startet direkt eine Transferverhandlung. Rechts Kaderstruktur und Vertragslage (auslaufende Verträge, wechselwillige Spieler).
- **Verein**: Stadion, Finanzen aus **Außensicht** (Umsatzklasse in der Liga, Umsatz der Vorsaison gerundet, Transferbudget als geschätzte Spanne, Kaderwert, Gehälter – Kontostand und Schulden bleiben geheim), Trikots, Ausbaustufen des Geländes, Marke/Bekanntheit, Nachwuchs.
- **Historie**: Platzierungsverlauf über alle Ligaebenen (goldener Punkt = Meister, offener Punkt = laufende Saison), Titel, beste Platzierung, Auf-/Abstiege, direkter Vergleich Spiel für Spiel, Rekordspieler (Einsätze/Tore für den Verein) und Rekordtransfers.

## Simulierte Vereine
Vereine aus rein simulierten Ligen haben keinen Einzelkader. Ihr Profil zeigt Liga, Tabellenplatz, geschätzte Gesamtstärke, Spiele und die Historie; Kader und Vereinsdaten werden sichtbar, sobald sie in deine Liga kommen.

## Historie
Die Historie wird beim Saisonwechsel geschrieben (Endplätze aller Ligen inkl. DDR, Meister, Landespokal, Europapokal, alle Pflichtspiele gegen deinen Verein). Sie beginnt mit deinem Spielstart; ältere Spielstände füllen sie ab der nächsten Saison.`,
  },
  {
    id: 'squad-attributes',
    category: 'squad',
    title: 'Attribute & Overall (OVR)',
    keywords: ['attribute', 'overall', 'ovr', 'position', 'farben'],
    body: `## Overall (OVR)
Die Gesamtstärke wird aus den positionsrelevanten Attributen abgeleitet (0–100).

## Farbcodierung (überall einheitlich)
- **Grün:** > 75 (stark)
- **Gelb:** 60–75 (solide)
- **Orange/Rot:** < 60 (schwach)

## Potenzial-Sterne
Goldene Sterne (1.0–5.0 in 0.25-Schritten) zeigen das maximale Niveau (Softcap). Details siehe Kategorie „Entwicklung & Potenzial".`,
  },

  // ---------------------------------------------------------------------------
  // FORM & FITNESS
  // ---------------------------------------------------------------------------
  {
    id: 'condition-form',
    category: 'condition',
    title: 'Form-System',
    keywords: ['form', 'leistung', 'note', 'trend', 'pfeil', 'krise', 'bestform', 'system', 'daumen'],
    body: `## Was ist Form?
Form zeigt, **wie gut ein Spieler im System zurechtkommt** – Skala **0–100**, 50 = Durchschnitt. Wer in der Mannschaft gut funktioniert (gute Noten, Siege, sinnvolles Training), steigt; wer sich schwertut, fällt. Ausschläge sind flüchtig.

## Wirkung im Spiel
Form wirkt bewusst **gering**: Sie geht als Faktor in die Tagesstärke ein – Form 100 bringt **+2,5 %**, Form 0 **−2,5 %** Positionsstärke (\`formFactor\` in \`engine/match/team.ts\`). Ein Spieler in Topform spielt also leicht besser, mehr nicht.

## Wie ändert sich Form?
Nach jedem Spiel wird die Form der eingesetzten Spieler neu berechnet aus:
- **Ergebnis-Anteil:** Sieg +5, Unentschieden +1, Niederlage −5.
- **Leistungs-Anteil:** individuelle Spielnote (0–10). Note 6 ist neutral; jede Note darüber hebt, jede darunter senkt die Form (Faktor ~2,2).
- **Zufalls-Rauschen:** kleine Streuung, damit es lebendig bleibt.
- **Rückkehr zur Mitte:** die Form driftet je Update ~5 % Richtung 50 – Ausschläge sind also flüchtig.

Nicht eingesetzte Spieler driften nur langsam Richtung 50.
Training kann die Form leicht heben; Überlastung (hohe Intensität bei niedriger Fitness) senkt sie.

## Anzeige (Daumen-Symbol)
In Kader, Aufstellung und Spielerprofil zeigt ein **Daumen nach oben** die Form – immer nach oben, nur die **Grünstufe** ändert sich: blasses Grau-Grün = Formtief, kräftiges Dunkelgrün = Topform (kein Rot). Fahre mit der Maus darüber, um den genauen Wert zu sehen (z. B. „Form 62/100 – kommt gut im System zurecht“).
| Form | Farbe | Hover | Kurzwort |
|------|-------|-------|----------|
| ≥ 68 | kräftiges Dunkelgrün | blüht im System auf | Topform |
| 56–67 | Grün | kommt gut im System zurecht | gute Form |
| 44–55 | Hellgrün | kommt im System zurecht | durchschnittlich |
| 32–43 | blasses Grün | tut sich im System schwer | schwache Form |
| < 32 | Grau-Grün | kommt im System nicht zurecht | Formtief |

## Moral (Smiley)
Die Moral hat fünf Stufen (sehr unzufrieden … sehr glücklich). Für die Anzeige wird sie auf 0–100 umgerechnet (10/30/50/70/90) und als **Smiley** gezeigt – von traurig in Rot bis strahlend in Dunkelgrün.

## Code
- \`engine/form.ts\`: \`updatePlayerForm\`, \`applyMatchEffects\`, \`applyTrainingForm\`, \`formIndicator\`.
- Feld: \`Player.form\` (0–100).
- Anzeige: \`components/status/\` (\`FormIcon\`, \`MoraleIcon\`, Umrechnung und Stufen in \`statusScale.ts\`).`,
  },
  {
    id: 'condition-fitness',
    category: 'condition',
    title: 'Fitness-System (Kondition/Ausdauer)',
    keywords: ['fitness', 'kondition', 'ausdauer', 'durchhalten', 'müdigkeit', 'regeneration', 'erschöpfung'],
    body: `## Was ist Fitness?
Fitness ist die **konditionelle Grundverfassung** eines Spielers (**0–100**) – also wie gut er über eine Saison hinweg **durchhält**. Sie ist bewusst **getrennt** von der neuen **Frische** (aktuell verfügbare Tageskraft, eigener Artikel): Fitness sinkt/steigt langsam über Wochen, Frische schwankt stark von Spiel zu Spiel.

## Fitness sinkt durch
- **Spiele:** Einsatzminuten kosten Fitness. Der Verlust skaliert mit der **Ausdauer** (stamina): ausdauernde Spieler verlieren weniger. Grober Rahmen: ~14–22 Punkte bei 90 Minuten (\`applyMatchFatigue\`).
- **Hartes Training:** hohe Intensität zehrt zusätzlich (siehe Training-Block).

## Fitness regeneriert durch
- **Ruhe-/leichte Tage:** tägliche Regeneration in \`engine/training.ts\` (\`dailyRecovery\`).
- **Regenerations-Training** (Fokus „Regeneration") mit geringer Last.

## Wirkung im Spiel
Fitness fließt als eigener **Fitness-Faktor** in die Tagesstärke ein: \`0.9 + fitness/100 * 0.1\` (0,9–1,0, \`conditionFactor\` in \`engine/match/team.ts\`). Hartes Training bei niedriger Fitness drückt zudem die Form.

## Anzeige (Hantel)
Fitness erscheint als **Hantel** – gestaffelt wie Frische und Moral von Rot bis Dunkelgrün, je fitter, desto voller die Scheiben. Hover zeigt sofort den Wert („Fitness 82/100 – fit“).
| Fitness | Farbe | Wort |
|---------|-------|------|
| ≥ 88 | Dunkelgrün | topfit |
| 75–87 | Hellgrün | fit |
| 62–74 | Gelb | ordentlich |
| 48–61 | Orange | Trainingsrückstand |
| < 48 | Rot | kaum belastbar |

## Code
- Feld: \`Player.attributes.fitness\` (0–100).
- \`engine/form.ts\`: \`applyMatchFatigue\`. \`engine/match.ts\`: \`fitnessFactor\`. \`engine/training.ts\`: Trainingsverbrauch & \`dailyRecovery\`.`,
  },
  {
    id: 'condition-frische',
    category: 'condition',
    title: 'Frische-System (aktuelle Tageskraft)',
    keywords: ['frische', 'frisch', 'tageskraft', 'müdigkeit', 'ermüdung', 'belastung', 'rotation', 'regeneration', 'erholung'],
    body: `## Was ist Frische?
Frische ist die **aktuell verfügbare Kraft** eines Spielers (**0–100**) und ein **eigenes Attribut**, getrennt von der Fitness:
- **Fitness = Ausdauer/Durchhalten** über die Saison (ändert sich langsam).
- **Frische = wie ausgeruht der Spieler HEUTE ist** (fällt nach Spielen stark, kommt über Tage zurück).

Ein topfitter Spieler kann trotzdem „platt" (unfrisch) sein, wenn er drei Spiele in einer Woche gemacht hat – das ist der Kern der Rotationslogik.

## Frische sinkt durch
- **Spiele (stark):** Ein voller Einsatz (90 Min.) kostet **~25–40 Punkte**, leicht gedämpft durch hohe Ausdauer. Einwechslungen kosten anteilig zur Spielzeit weniger. Formel: \`(minutes/90) * (25 + rand*15) * staminaFaktor\` (\`staminaFaktor\` ≈ 0,8–1,2).
- **Nicht eingesetzte Kaderspieler:** nur leichte Trainingsbelastung (**−2**).

## Frische regeneriert durch
- **Tägliche Erholung:** **+8 bis +15 pro Tag**, gedeckelt bei 100 (\`recoverFreshness\` in \`dailyRecovery\`/Wochentraining). Basis +9, plus Ausdauer-Bonus (bis +2,5) und Alters-Bonus (≤23 Jahre +2, ≥32 Jahre −1,5).
- **Rückkehr aus Verletzung:** Frische wird auf **100** zurückgesetzt.

Nach einem harten Spiel braucht ein Spieler damit **mehrere Tage** bis zur vollen Frische → Rotation lohnt sich.

## Wirkung im Spiel
Frische fließt als eigener **Frische-Faktor** in die effektive Tagesstärke ein: \`0.7 + frische/100 * 0.3\` (0,7–1,0). Volle Frische = voller Wert; sehr niedrige Frische senkt die physische Leistung spürbar (bis −30 %), aber nicht vernichtend. Effektivstärke = \`Overall * Form * Fitness * Frische\`.

## Anzeige (Batterie-Symbol)
Frische erscheint überall als **Batterie**: Der Füllstand entspricht dem Wert, die Farbe der Stufe – Dunkelgrün ab 90 (voll erholt), Hellgrün 75–89, Gelb 60–74, Orange 45–59, Rot unter 45 (erschöpft). Mit der Maus darüber siehst du den genauen Wert, im Spielerprofil steht er daneben. Im Textmodus zeigt dieselbe Batterie die **Kraft** während des Spiels.

## Erklärungen (i-Symbol)
Hinter vielen Begriffen im Spiel steht ein kleines **i**. Maus darüber, antippen oder per Tastatur fokussieren zeigt eine kurze Erklärung, oft mit Verweis auf den passenden Wiki-Artikel.

## Speicherstände
Save-Version **7**: Altstände ohne Frische werden beim Laden nachgerüstet (\`retrofitFrische\`: Frische = vorhandene Fitness, ersatzweise 100).

## Code
- Feld: \`Player.frische\` (0–100), eigenständig neben \`Player.attributes.fitness\`.
- \`engine/form.ts\`: \`applyMatchFreshnessDrain\`, \`recoverFreshness\`, Anwendung in \`applyMatchEffects\`.
- \`engine/match.ts\`: \`frischeFactor\` (in \`effectiveRating\`).
- \`engine/training.ts\` & \`engine/weeklyTraining.ts\`: tägliche/wöchentliche Regeneration.
- \`engine/save.ts\`: \`SAVE_VERSION = 7\`. \`App.tsx\`: \`retrofitFrische\` beim Laden.`,
  },
  {
    id: 'condition-kabine',
    category: 'condition',
    title: 'Kabine: Moral, Einfluss und Teamstimmung',
    keywords: ['kabine', 'moral', 'stimmung', 'teamstimmung', 'zusammenhalt', 'einfluss', 'führungsspieler', 'außenseiter', 'clique', 'gruppe', 'kapitän', 'mannschaftsrat', 'gespräch', 'mannschaftssitzung', 'teamevent', 'streit', 'konflikt', 'sprachbarriere', 'kabinenpredigt', 'pyramide', 'saisonziel', 'krise', 'moral-sprung'],
    body: `## Worum geht es?
Unter **Kader › Kabine** siehst du, wie deine Mannschaft innen funktioniert: wer den Ton angibt, wer außen vor ist und warum – und wie es um die **Moral** jedes Spielers steht. Die Moral wirkt über die Tagesform direkt auf die Leistung im Spiel (sehr schlecht ×0,95 bis sehr gut ×1,03).

## Moral (0–100)
Jeder Spieler deines Vereins hat eine Moral von 0 bis 100. Sie folgt täglich langsam einem **Zielwert** (etwa 8 % des Abstands pro Tag). Was passiert, wirkt aber **sofort** (siehe „Sofortige Sprünge“). Der Zielwert ist die Summe sichtbarer Faktoren – beim Spieler im Fokus steht unter „Warum diese Moral?“ jeder einzelne mit + oder −:
- **Spielzeit gemessen an der Rolle:** Wer sich als Stammkraft sieht (Top 11 im Kader) und draußen sitzt, verliert deutlich – Ehrgeizige mehr. Ergänzungsspieler und Talente sind geduldiger. In Sommer- und Winterpause zählt die Spielzeit nicht.
- **Teamstimmung**, **eigene Form**, **Vertrag und Zufriedenheit** (siehe Kabinenfrieden).
- **Gehalt deutlich unter Gleichwertigen** (Spieler mit ähnlicher Stärke verdienen viel mehr) – Geldbewusste stört das mehr.
- **Sprachbarriere**, **Konflikte**, **gebrochene Versprechen**, **verweigerter Wechsel**, **Transferliste**, **außen vor**.
- **Kapitän** (+) und **Mannschaftsrat** (+), Aufbruchstimmung bei Neuzugängen.
- **Gespräche, Ereignisse, Teamevents** wirken als Faktor, der langsam abklingt. Auch Ereignisse aus dem Postfach, Trainingslager oder Hallenturniere, die die Moral verändern, erscheinen hier.
- **Professionalität:** Profis stecken Rückschläge besser weg, andere lassen sich hängen.

Stufen: unter 24 sehr schlecht, ab 24 schlecht, ab 41 okay, ab 59 gut, ab 77 sehr gut.

## Sofortige Sprünge
Ereignisse verändern die Moral sofort; danach gleitet sie wieder zum Zielwert zurück (nach einer Woche ist gut die Hälfte des Sprungs verflogen). Beim Spieler im Fokus stehen sie unter „Zuletzt passiert“, z. B. „+6 Siegtor beim 2:1 gegen …“.
- **Spiele:** Sieg (+2 bis +5 je nach Höhe) bzw. Niederlage (−2 bis −5) für alle, **Tor** (+2, mehrere Tore mehr), **Siegtor** beim Sieg mit einem Tor Unterschied (+4), **Glanzleistung** (Note bis 1,6) bzw. **schwaches Spiel** (ab 5,0), **Platzverweis**. Wer sich als Stammkraft sieht und **nicht aufgestellt** wird, verliert sofort (−3 bis −5, Ehrgeizige mehr); **nur eingewechselt** ärgert Stammkräfte, Talente und Ergänzungsspieler freuen sich über die **Einwechslung**. Ein Spiel zählt höchstens ±10.
- **Pokal-Aus:** gegen Amateure ein Schock für alle (−5 sofort, dazu Teamstimmung und Zusammenhalt), sonst ein kleiner Dämpfer.
- **Gespräche** (Lob, Kritik, Einsatzzusage, Beruhigen), **Kapitän/Mannschaftsrat**, **Antworten auf Kabinen-Vorfälle**, **Zusagen** gehalten oder gebrochen: Sprung sofort, dazu ein abklingender Faktor.
- **Vertrag:** Verlängerung +6, abgelehntes Angebot −1, ein deutlich zu niedriges −4, abgebrochene Gespräche −7.
- **Transferliste:** draufgesetzt −8, heruntergenommen +4. **Versprechen** gehalten +5, gebrochen −22.
- Ereignisse aus dem Postfach, Trainingslager oder Hallenturniere, die die Moral-Stufe ändern, erscheinen mit dem Betreff der Nachricht.

## Einfluss (0–100)
Wie sehr ein Spieler die Kabine prägt: **Alter und Erfahrung**, **Jahre im Verein**, **Stammplatz**, **Stärke im Kader**, **Kapitän** (+15) und **Mannschaftsrat** (+8), **Führungsqualität** (Attribut), **Auftreten** (Rampenlicht, Ehrgeiz, Professionalität), **Sprachbarriere** und **neu im Verein** (−). Daraus ergibt sich die Rolle: **Führungsspieler** (der Einflussreichste und bis zu drei weitere ab 62), **Stütze** (ab 42), **Mitläufer** – oder **außen vor**.

## Außenseiter
Gründe werden gewichtet: keine Einsätze, Sprachbarriere (Landsleute im Kader helfen), Gehalt deutlich unter Gleichwertigen, gebrochenes Versprechen, Konflikt (mit einem Führungsspieler besonders schwer), abgelehnter Wechselwunsch, Transferliste, noch nicht angekommen. Erst mehrere Gründe zusammen machen einen Spieler zum Außenseiter. Außenseiter verlieren Moral und drücken Zusammenhalt und Stimmung.

## Gruppen
Jeder Spieler gehört einer Gruppe an: **Führungskreis**, **Sprachgruppen** (ab zwei Spielern gleicher Fremdsprache), **Neuzugänge** (ab drei), **Junge Wilde** (bis 22), **Routiniers** (ab 30), **Stammkräfte**, **Ergänzungsspieler**. Die **Kabinen-Pyramide** zeigt die Hierarchie: oben die Führungsspieler, darunter Stützen und Mitläufer, unten wer außen vor ist; je Stufe steht links der Einflussreichste. Der Smiley ist die Moral, die kleine Ziffer die Gruppe (Legende unter der Pyramide – zeigst du auf eine Gruppe, werden ihre Mitglieder hervorgehoben), gestrichelte Linien sind Konflikte.

## Zusammenhalt und Teamstimmung
**Zusammenhalt** steigt mit gemeinsamen Jahren der Stammkräfte und guter Führung; viele Neuzugänge, abgeschottete Sprachgruppen, Außenseiter, Konflikte und Unruhe auf der Bank senken ihn. Teamevents stärken ihn.
**Teamstimmung** folgt den letzten fünf Ligaergebnissen, dem **Saisonziel** (siehe unten), der Laune der Führungsspieler (nach Einfluss gewichtet), dem Zusammenhalt, Außenseitern, Konflikten und deinen Maßnahmen. Sie fließt in die Moral aller Spieler ein.

## Was du tun kannst
- **Einzelgespräch:** loben, kritisieren, Einsatz versprechen, beruhigen. Ob es ankommt, hängt von Persönlichkeit, Form und Lage ab (Einschätzung unter dem Knopf). Mit demselben Spieler frühestens nach 10 Tagen wieder; jedes weitere Gespräch innerhalb von 60 Tagen wirkt schwächer (×0,65). Ein **Einsatzversprechen** muss gehalten werden: zwei Startelf-Einsätze in vier Wochen, sonst sinken Moral und Glaubwürdigkeit.
- **Mannschaftssitzung** (alle 14 Tage): „Aufbauen“ hilft bei gedrückter Stimmung, wenn die Führungsspieler mitziehen; „Klartext“ wirkt in der Krise bei professionellen Mannschaften, nach Siegen kommt er schlecht an. Zu viele Sitzungen schaden.
- **Teamevent** (alle 30 Tage, kostet Geld): je nach Epoche Kegelabend, Dampferfahrt, Kartbahn, Hochseilgarten, Kurztrip. Hebt Stimmung und Zusammenhalt, Außenseiter kommen ins Gespräch. Ohne Geld auf dem Konto gibt der Vorstand nichts frei.
- **Kapitän und Mannschaftsrat** (bis zu drei Spieler): stärkt Einfluss und Moral der Gewählten. Wer die Binde verliert, ist enttäuscht; ein Kapitän ohne Rückhalt in der Kabine ist umstritten.

## Vorfälle
Selten (höchstens alle drei Wochen) meldet sich die Kabine im Postfach und unter „Vorfälle“: **Streit** zweier Spieler, ein **Führungsspieler fordert etwas** für die Mannschaft (je nach Epoche Siegprämie, Masseur, Familienbereich, freie Tage, Social-Media-Freiheiten), ein **Neuzugang findet keinen Anschluss** (Pate, Sprachkurs), der **Mannschaftsrat wünscht sich einen Teamabend**, **Grüppchenbildung nach einer Niederlagenserie** oder die Frage nach einer **Kabinenpredigt** nach einer hohen Niederlage. Ohne Antwort gilt nach sieben Tagen die vorsichtige Standardwahl.

## Saisonziel und Tabellendruck
Die Mannschaft kennt das Saisonziel des Vorstands. Ab etwa dem vierten Spieltag (volle Stärke nach zehn) drückt die Tabelle auf die Teamstimmung:
- **Saisonziel verfehlt:** je weiter du hinter dem verlangten Platz stehst, desto mehr, ab zwei Plätzen Rückstand (bis −18; Meisterschaft = Platz 1, Europapokal = Platz 4, Mittelfeld = Mitte, Klassenerhalt = über dem Strich).
- **Abstiegskampf wider Erwarten:** auf einem Abstiegsplatz, obwohl mehr verlangt war (−8).
- **Sieglos:** ab drei Ligaspielen ohne Sieg −2,5 je weiterem Spiel (bis −12).
- **Besser als erwartet** hebt die Stimmung etwas (bis +6).

## Ohne Eingreifen
Die Kabine läuft meist von selbst ordentlich – an etwa jedem 15. bis 25. Tag ist die Stimmung aber schlecht (unter 35), in Spielzeiten mit klar verfehltem Saisonziel etwa dreimal so oft. Mit Gesprächen (vor allem mit den Führungsspielern), gut dosierten Sitzungen und Teamevents kannst du das deutlich abfedern. Krisen entstehen vor allem durch Niederlagenserien, Tabellendruck, viele Neuzugänge mit Sprachproblemen, unzufriedene Stammkräfte auf der Bank und Konflikte. Steckt die Stimmung gut drei Wochen unter 35, raufen sich die Spieler selbst zusammen (mit einem anerkannten Kapitän stärker) – eine Dauerkrise gibt es also nicht, aber schneller geht es mit dir. Eingreifen hilft spürbar – ständiges Eingreifen nutzt sich ab.

## KI-Vereine
Bei den anderen Vereinen folgt die Stimmung den letzten Ergebnissen; die Moral ihrer Spieler wandert wöchentlich in diese Richtung (Stammkräfte ohne Einsätze und Unzufriedene eine Stufe tiefer).

## Code
- \`engine/dressingRoom.ts\` (Rechnung, Tabellendruck \`goalFactors\`), \`game/dressingRoomGame.ts\` (Tageslauf, KI, Aktionen, \`goalOf\`), \`game/moraleJolt.ts\` (sofortige Sprünge), \`game/dressingRoomEvents.ts\` (Vorfälle), Seite \`views/kader/DressingRoomView.tsx\` + \`kabine/RoomPyramid.tsx\`.
- Felder: \`Player.moraleScore\`, \`Club.dressingRoom\` (darin \`jolts\`, \`joltScan\`, \`listed\`).`,
  },

  // ---------------------------------------------------------------------------
  // NACHRICHTEN
  // ---------------------------------------------------------------------------
  {
    id: 'zentrale',
    category: 'messages',
    title: 'Die Zentrale',
    keywords: ['zentrale', 'dashboard', 'newscenter', 'übersicht', 'fan-app', 'videotext', 'stadionheft', 'sms', 'widgets', 'managerstatus', 'teamstatus'],
    body: `## Aufbau
Die **Zentrale** ist deine Startseite. Oben bleibt das Hauptmenü; den Kalender siehst du nur, solange die Zeit läuft (Überblendung).
- **Links** stehen kleine Übersichten: Ausschnitt der **Ligatabelle** um deinen Verein, **Liste der Spiele** (die letzten zwei Ergebnisse, die nächsten drei Termine; L = Liga, P = Pokal, E = Europapokal), **Budget** der laufenden Saison, **Managerstatus** (Saisonziel, Vertrauen des Vorstands, Fanstimmung, Mediendruck, Leitbild), **Sperren und Verletzungen**, **Teamstatus** (Stärke der Startelf, Fitness, Frische, Form, Moral) und deine **Taktik** in Kurzform. Ein Klick auf ein Kästchen öffnet die passende Seite. Die Spalte lässt sich scrollen.
- **In der Mitte** liegt das **Newscenter**: links deine Nachrichten (gruppiert nach Heute, Gestern, Diese Woche, Älter; ungelesene fett), rechts die gewählte Nachricht mit Datum, Text, Entscheidungsknöpfen und Sprungzielen. Betrifft sie einen Spieler, siehst du unten rechts sein Gesicht – ein Klick öffnet das Profil. Unten wählst du, welche Nachrichten angezeigt werden.
- **Rechts oben** die **Übersicht** aller Wettbewerbe der Saison (Deutschland, DDR, international, Auslandsligen der Vorsaison). Ein Klick öffnet Statistiken › Liga, Pokal oder International mit genau diesem Wettbewerb. Dein Verein ist hervorgehoben.
- **Rechts unten** erfährst du, was die Fans über deinen Verein lesen – im Medium der Zeit: bis Mai 1980 das **Stadionheft**, ab Juni 1980 der **Videotext** von ARD und ZDF, ab 1999 der **SMS-Dienst** aufs Handy, ab Juli 2008 die **Fan-App**. Die Meldungen und Gerüchte stammen aus der Sportzeitung (Zentrale › Presse); ein Klick öffnet den Artikel.`,
  },
  {
    id: 'presse',
    category: 'messages',
    title: 'Presse: die Sportzeitung',
    keywords: ['presse', 'zeitung', 'schlagzeile', 'aufmacher', 'artikel', 'gerücht', 'gerüchteküche', 'ausgabe', 'archiv', 'kurz notiert', 'torjäger', 'kommentar'],
    body: `## Worum geht es?
Unter **Zentrale › Presse** liest du die Sportzeitung des Spiels. Sie erscheint **montags und donnerstags** (wie die großen Fußball-Fachblätter); dazu gibt es immer die **aktuelle Ausgabe des Tages**. Jede Ausgabe berichtet über die Tage seit der vorigen Ausgabe. Oben rechts blätterst du zu älteren Ausgaben der laufenden Saison.

## Was drinsteht
- **Aufmacher** mit großer Schlagzeile und Bild – das wichtigste Ereignis, dein Verein wird etwas bevorzugt.
- **Spielberichte** mit Torschützen, bestem Spieler und Fazit, **Spieltag-Überblick**, **Tabellenspitze** und **Abstiegskampf**.
- **Transfermarkt** (alle Wechsel der Liga mit Ablöse), **Gerüchteküche** (gute Spieler mit auslaufendem Vertrag oder auf der Transferliste – nur Gerede, nicht bestätigt), **Trainerkarussell**, **Lazarett** (längere Ausfälle).
- **Pokal** und **Europapokal** (Ergebnisse deutscher Vereine), **Talente** (junge Torschützen), **Rekorde** (Hattricks, Torjäger-Marken, Saison-Rekordkulisse), **Chronik**, **Hinter den Kulissen** (Gerüchte aus deiner Kabine), **Kommentar** zur Form deines Vereins und eine **Vorschau** aufs nächste Spiel.
- Rechts: Ergebnisse des Spieltags, Tabelle (Spitze und Keller) und Torjäger **zum Erscheinungstag**; unten **Kurz notiert** mit weiteren Meldungen.

## Alles ist anklickbar
Eine Schlagzeile öffnet den vollen Artikel mit allen Beteiligten und Knöpfen zum Ziel (Spielbericht, Tabelle, Transfermarkt, Kabine …). **Gesichter** öffnen das Spielerprofil, **Wappen und Vereinsnamen** das Vereinsprofil, ein Ergebnis den Spielbericht.

## Epochen
Blattname und Aufmachung wechseln mit der Zeit (die Blätter sind erfunden). Ab den 2000ern taucht das Netz in den Texten auf, Ablösen stehen bis 2001 in DM, danach in Euro.

## Speicher
Ausgaben werden nicht gespeichert, sondern beim Lesen aus dem Spielstand zusammengesetzt (Ergebnisse, Spielerverlauf, Trainerhistorie, Pokalrunden, Nachrichten). Dieselbe Ausgabe sieht deshalb immer gleich aus.`,
  },
  {
    id: 'messages-system',
    category: 'messages',
    title: 'Nachrichten / E-Mail-System',
    keywords: ['nachrichten', 'berichte', 'email', 'inbox', 'ungelesen', 'badge', 'absender', 'betreff'],
    body: `## Von „Berichte" zu „Nachrichten"
Der frühere „Berichte"-Bereich heißt jetzt **Nachrichten** und funktioniert wie ein E-Mail-Postfach.

## Listenansicht
Jede Nachricht zeigt **Absender, Betreff, Kurztext, Datum, Kategorie** und einen **Ungelesen-Punkt**. In der unteren Navigation erscheint ein **Badge** mit der Zahl ungelesener Nachrichten.

## Detailansicht (E-Mail)
Ein Klick öffnet die **ausführliche Ansicht**: Absender, Betreff, Datum und ein **erklärender Fließtext**, was passiert ist. Beim Öffnen wird die Nachricht als **gelesen** markiert.

## Datenmodell (\`InboxMessage\`)
\`\`\`
id, date, category, from, subject, shortText, bodyText, read, actionRequired?, relatedId?
\`\`\`
Kategorien: transfer, injury, match, board, contract, training, media, general.

## Code
- \`engine/messages.ts\`: \`makeMessage\`, \`pushMessage\`, \`unreadCount\`, \`CATEGORY_META\`.
- Erzeugt u.a. bei Spielergebnissen, Transfers, Bewertungen und Saison-Ereignissen.`,
  },

  // ---------------------------------------------------------------------------
  // SPEICHERN & LADEN
  // ---------------------------------------------------------------------------
  {
    id: 'save-system',
    category: 'save',
    title: 'Speichern, Laden & Startbildschirm',
    keywords: ['speichern', 'laden', 'save', 'load', 'slot', 'startbildschirm', 'menü', 'einstellungen', 'manager', 'neues spiel', 'vereinswahl', 'liga wählen'],
    body: `## Startbildschirm
Beim Start erscheint ein Menü mit:
- **Neues Spiel** – Assistent in drei Schritten: Spielwelt, Verein, Manager.
- **Spiel laden** – vorhandene Speicherstände mit Vorschau (Verein, Manager, Datum).
- **Einstellungen** – Geschwindigkeit, Autosave, Anzeige u.a.
- **Spiel verlassen** – schließt/entkoppelt die laufende Partie.

## Neues Spiel in drei Schritten
1. **Spielwelt:** Datensatz, Schwierigkeit, Verletzungen, realistische Kader, Spieltempo; dazu ein Hinweis, wie Talente und Stars entstehen. Start ist immer der 1. Juli 1975.
2. **Verein:** Links wählst du die Liga (1. Liga, 2. Liga Nord, 2. Liga Süd; die DDR-Oberliga kommt erst 1991 ins Spiel). In der Mitte siehst du alle Vereine der Liga als Wappen – sortierbar nach Stärke, Name oder Region. Rechts zeigt die Detailkarte Trikots, Stadion, Kapazität, Ansehen, Finanzkraft, die geschätzte Kaderstärke im Ligavergleich, das Ziel des Vorstands und die Rivalen. Kaderstärke und Ziel sind **Einschätzungen**: Die echten Kader entstehen beim Start, das endgültige Saisonziel richtet sich danach.
3. **Manager:** Name, Nationalität, Geburtsjahr, Spielstil und Trainer-Hintergrund, daneben eine Zusammenfassung. „Karriere starten“ erzeugt die Spielwelt.

Über den Stepper oben springst du jederzeit zu einem früheren Schritt zurück. Das **Punktesystem ist historisch automatisch** (2 Punkte bis 1994/95, ab 1995/96 automatisch 3 Punkte) und nicht wählbar.

## Speicherstände
- Gespeichert wird im **Browser (localStorage)**. Der Spielzustand ist ein reines Datenobjekt und damit direkt als JSON serialisierbar.
- Jeder Slot führt **Metadaten** (Verein, Manager, In-Game-Datum, Zeitstempel) für die Vorschau.
- Funktionen: \`saveGame\`, \`loadGame\`, \`listSaves\`, \`deleteSave\`, \`nextFreeSlot\` (\`engine/save.ts\`).
- Globale Einstellungen werden separat unter \`fm1980_settings\` persistiert.`,
  },

  // ---------------------------------------------------------------------------
  // PLATZHALTER FÜR SPÄTERE BLÖCKE
  // ---------------------------------------------------------------------------
  {
    id: 'training-planner',
    category: 'training',
    title: 'Trainingsplan: Bausteine ziehen',
    keywords: ['training', 'trainingsplan', 'wochenplan', 'baustein', 'block', 'einheit', 'ziehen', 'vorlage', 'spieltag', 'regeneration', 'anreise', 'videoanalyse', 'pressing', 'athletik'],
    body: `## Trainingsplan
Unter **Training › Trainingsplan** legst du die Trainingswoche fest: **7 Tage** mit je **drei Feldern** – **Vormittag**, **Nachmittag** und **Abend / Zusatz** (die Zusatzeinheit belastet ×1,3, bringt aber auch etwas mehr Lernreiz).

### Bedienung
- **Ziehen:** Baustein aus der Leiste in ein Feld ziehen. Ein belegtes Feld auf ein anderes ziehen **tauscht** beide.
- **Leeren:** Feld zurück in die Leiste ziehen, auf „Frei“ setzen oder **doppelklicken**.
- **Ohne Ziehen:** Baustein anklicken (er wird markiert), dann Felder anklicken.
- **Vorlagen:** Ausgewogen, Vorbereitung, Englische Woche, Taktikwoche, Abschluss & Technik, Schonung.
- **Diese Woche / Nächste Woche:** Der Plan ist eine Wochenvorlage; die Ansicht zeigt, wie die echten Spiele ihn verändern.

### Spiele sperren Felder
- **Spieltag** (Liga, Pokal, Europapokal): kein Training.
- **Tag nach dem Spiel:** Vormittag fest **Auslaufen** (Regeneration).
- **Abend vor einem Auswärtsspiel:** **Anreise**, kein Training.

### Bausteine
Jeder Baustein hat ein Symbol, eine Intensität (Striche oben rechts), eine Belastung und gewichtete Attribute: Ausdauer, Kondition, Sprint, Koordination, Kraft, Technik, Dribbling, Passspiel, Flanken, Torschuss, Kopfball, Zweikampf, Taktik, Spielform, Torwart, Standards und Regeneration. Mit der Zeit kommen neue hinzu:
| Baustein | ab | Hintergrund |
|---|---|---|
| Pressing & Umschalten | 1988 | Sacchis AC Mailand macht das Pressing populär |
| Videoanalyse | 1993 | systematische Spielanalyse (Prozone/Amisco Mitte der 90er) – wirkt nur mit Analyst richtig |
| Mentaltraining | 2003 | Sportpsychologie wird Teil des Profialltags |
| Athletik & Stabilisation | 2004 | funktionelles Athletiktraining, senkt das Verletzungsrisiko |

### Wochenwirkung
- **Schwerpunkte:** Balken je Bereich (Ausdauer, Schnelligkeit, Kraft, Technik, Passspiel, Abschluss, Defensive, Spielverständnis, Standards, Torwart). Sie lenken, **welche** Attribute bei den nächsten Bewertungen wachsen.
- **Fitness je Tag:** Grund-Regeneration 10 minus Belastung.
- **Verletzungsrisiko:** Tage mit mehr als 6 Belastungspunkten bergen ein kleines Risiko für Zerrungen; müde Spieler (Fitness < 50) doppelt so stark. Fitness- und Medizinwissen im Trainerteam senkt es um bis zu 30 %.
- **Entwicklung:** Der Trainingsumfang verändert das Entwicklungstempo leicht (etwa −6 % bei fast keinem Training bis +5 % bei vollem Programm; Überlastung kostet wieder).
- **Trainerteam:** Jeder Baustein wird von einem Fachgebiet angeleitet (Fitness, Technik, Taktik, Torwart, Mentales, Analyse). Der Beste deines Teams in diesem Fach bestimmt den Lernfaktor (0,85 ohne Fachmann bis 1,2 mit Spitzenkraft).`,
  },
  {
    id: 'training-fitness',
    category: 'training',
    title: 'Fitness, Belastung & Regeneration',
    keywords: ['fitness', 'belastung', 'regeneration', 'müdigkeit', 'erholung', 'load', 'extraeinheit'],
    body: `## Fitness-Modell
Jeder Trainingstag verrechnet eine **Grund-Regeneration** gegen die **Trainingsbelastung**:

\`\`\`
Fitness-Delta (pro Tag) = 10  −  Summe der Slot-Belastungen
Extraeinheit: Belastung × 1.3
\`\`\`

- **Grund-Regeneration:** +10 Fitness/Tag (\`DAILY_BASE_RECOVERY\`).
- **Belastung** je Slot = Belastungswert des Blocks (siehe Blocktabelle). Die **Extraeinheit** zählt mit **Faktor 1.3**.
- Der **Regenerationsblock** hat eine negative Belastung (−4) und wirkt daher zusätzlich erholend.

### Faustregeln
- **Zwei mittlere Einheiten** (z.B. 3.5 + 3.0 = 6.5) → Delta ≈ **+3.5**: solides Training mit **leichter Regeneration**.
- **Zwei harte Einheiten + Extraeinheit** → Delta deutlich **negativ**: die Fitness sinkt (Übertraining droht).
- **Wenig/kein Training oder Regeneration** → starke Erholung (bis +10 und mehr).

Die Vorschau im Planer zeigt für jeden Tag das erwartete **Fitness-Delta** (grün = Erholung, gelb = neutral, orange/rot = Ermüdung) sowie die **Ø Fitness/Tag** der ganzen Woche.

### Auswirkungen
- Sinkt die Fitness dauerhaft unter ~35, drohen **Abwertungen durch Übertraining** (siehe Entwicklung).
- Müde Spieler **lernen langsamer** (die Frische dämpft den Lerneffekt).
- Verletzte Spieler trainieren nicht (nur Verletzungs-Countdown läuft weiter).`,
  },
  {
    id: 'player-hidden-values',
    category: 'development',
    title: 'Verdeckte Werte & Attribut-Wirkung',
    keywords: ['konstanz', 'nervenstärke', 'verdeckt', 'versteckt', 'einschätzung', 'scout', 'trainerteam', 'verletzungsanfälligkeit', 'attribut', 'wirkung'],
    body: `## Verdeckte Werte
**Konstanz**, **Nervenstärke**, **Verletzungsanfälligkeit** und **Entwicklungstempo** sind verdeckt – du siehst nie eine Zahl, nur eine **Einschätzung** („wirkt nervenstark“, „schwankt stark“).
- **Eigene Spieler:** Das **Trainerteam** urteilt. Je länger der Spieler im Verein ist, desto treffsicherer (nach rund zweieinhalb Jahren „gesichert“).
- **Fremde Spieler:** Die **Scouts** urteilen – je besser dein Scouting (und je länger ihr verhandelt), desto genauer. Ohne Kenntnis heißt es „noch kein Urteil“.
- Jede Einschätzung kann **danebenliegen**: Jeder Spieler hat einen festen Schätzfehler, der mit wachsender Kenntnis schrumpft.

## Was beeinflusst ein Attribut?
Hinter jedem Attribut im Spielerprofil steht ein kleines **i**. Es zeigt, wo der Wert im Spiel direkt gerechnet wird (z. B. Kopfball: Kopfballduelle bei Flanken und Ecken, Kopfball-Abschluss), für welche Positionen er in die **Positionsstärke** eingeht (live aus der Epoche) und welche **Trainingsbausteine** ihn verbessern.

## Code
- Einschätzung: \`game/hiddenTraits.ts\` (\`hiddenKnowledge\`, \`estimateHidden\`).
- Attribut-Texte: \`data/attributeInfo.ts\`; Anzeige \`components/player/AttrTip.tsx\`.`,
  },
  {
    id: 'development-hidden',
    category: 'development',
    title: 'Versteckte Entwicklung (0,1-Schritte)',
    keywords: ['entwicklung', 'potenzial', 'sterne', 'softcap', 'akkumulator', '0.1', 'wachstum', 'alter'],
    body: `## Versteckte Entwicklung in 0,1-Schritten
Training verbessert Attribute **nicht sofort sichtbar**. Stattdessen füllt jede Einheit einen **versteckten Akkumulator** je Attribut (in **0,1-Schritten**). Der angezeigte Attributwert (ganze Zahl) ändert sich **erst**, wenn der Akkumulator **1,0** erreicht — dann steigt das Attribut sichtbar um **+1** und der Akkumulator startet wieder bei 0 (Rest bleibt erhalten).

### Lernformel je Einheit und Attribut
\`\`\`
Zuwachs = 0.11 × Gewicht × Altersfaktor × Potenzialfaktor
              × Intensitätsfaktor × (Anlagen/100) × Frische
(auf 0,1 gerundet)
\`\`\`

- **Gewicht** = Attribut-Gewichtung des Blocks (0..1).
- **Altersfaktor:** ≤20 → 1.5 · ≤23 → 1.2 · ≤27 → 1.0 · ≤30 → 0.7 · ≤33 → 0.4 · sonst 0.2.
  → **Junge Spieler wachsen deutlich schneller.**
- **Potenzialfaktor:** \`(Potenzial − aktuelle Stärke) / 20\`, begrenzt auf **0.1 … 1.0**. Je mehr „Kopffreiheit", desto schneller.
- **Intensitätsfaktor:** niedrig 0.7 · mittel 1.0 · hoch 1.3.
- **Anlagen** = Qualität des Trainingsgeländes (0..100).
- **Frische** = 0.6 + 0.4 × (Fitness/100): müde Spieler lernen langsamer.
- Die **Extraeinheit** gibt zusätzlich ×1.15 Lernreiz.

### Softcap durch Potenzial-Sterne
Das **Stern-Potenzial** (1.0–5.0, \`starsToPotential\`) begrenzt das Wachstum. Liegt die aktuelle Gesamtstärke **≥ Potenzial + 2**, werden keine sichtbaren Attribut-Punkte mehr gutgeschrieben (der Akkumulator wird bei ~0,95 gestaut).

### Kopplung an die Gesamtstärke (OVR)
Jeder sichtbare **Attribut-Punkt** speist einen versteckten **OVR-Akkumulator** mit **+0,34**. Erreicht dieser **1,0**, steigt die **Gesamtstärke um +1**. So sind OVR-Aufwertungen direkt an das Training gekoppelt.`,
  },
  {
    id: 'development-events',
    category: 'development',
    title: 'Auf- & Abwertungen',
    keywords: ['aufwertung', 'abwertung', 'ereignis', 'begründung', 'wahrscheinlichkeit', 'hintergrund', 'still'],
    body: `## Wöchentliche Entwicklung läuft still
Am Ende jeder Trainingswoche (**sonntags**) wertet der Trainerstab die versteckte Entwicklung aus. Diese wöchentliche Auswertung geschieht **komplett still im Hintergrund**: Die Spielerwerte (Attribute und Gesamtstärke) verändern sich, aber der Vorlauf **hält nicht an** und es erscheint **keine Meldung und kein Popup**. Die neuen Werte findest du jederzeit im **Kader**.

Eine sichtbare Meldung und die Bewertungs-Show gibt es nur zu den drei Bewertungsrunden (siehe „Periodische Leistungsbewertung" weiter unten) — nicht wöchentlich.

Die folgenden Regeln beschreiben, **wie** die wöchentliche Veränderung berechnet wird (auch wenn sie nicht mehr angezeigt wird):

### Aufwertungen
Entstehen aus dem versteckten Akkumulator (siehe „Versteckte Entwicklung"). Die Begründung ist **trainings- bzw. leistungsbezogen** und passt zum geförderten Attribut, z.B.:
- „Harte Ausdauereinheiten zahlen sich aus"
- „Durchbruch im Abschlusstraining"
- „Sprinttraining zeigt Wirkung"
- bei jungen Talenten: „Das große Talent bricht sich Bahn"

### Abwertungen (max. 1 pro Spieler/Woche)
Treten nur auf, wenn es keine Aufwertung gab. Wahrscheinlichkeiten pro Woche:

| Ursache | Bedingung | Wahrscheinlichkeit | Beispiel-Grund |
|---|---|---|---|
| Alter | Alter ≥ 30 | (Alter − 29) × 3 % | „Altersbedingter Leistungsabfall" |
| Formkrise | Form < 40 **und** < 200 Saisonminuten | 15 % | „Formschwäche und wenig Spielpraxis" |
| Übertraining | Fitness < 35 oder Trainingslast > 120 | 10 % | „Übertraining zehrt an der Substanz" |

Betroffen ist ein passendes Attribut (Alter/Übertraining → körperliche Werte); bei genug angesammeltem Minus zieht auch die Gesamtstärke um −1 nach.

### Seltene Lebensereignisse (~4 %)
In **sehr seltenen Fällen** überschreibt ein **unkontrollierbares Lebensereignis** die normale Begründung (Kennzeichnung „Privat"). Diese sind bewusst die **Ausnahme** — die überwältigende Mehrheit der Veränderungen ist trainings- und leistungsbasiert.
- positiv: „Neue Motivation nach Vaterschaft", „Privates Glück beflügelt die Leistung" …
- negativ: „Privatunglück belastet den Spieler", „Feiert zu viel neben dem Platz" …

## Periodische Leistungsbewertung
Die Entwicklungspunkte aller Profis werden in drei Bewertungsrunden je Saison ausgezahlt:

| Anlass | Zeitpunkt | Auszahlung |
|---|---|---|
| Herbst-Bewertung | **3. November** | die Hälfte der Punkte, höchstens ±2 |
| Winter-Bewertung | **2. Januar** | 70 % der Punkte, höchstens ±3; neue Potenzial-Einschätzung der Scouts |
| Große Saison-Bewertung | **zwei Wochen vor Saisonende** | alle Punkte, bis ±6; Durchbrüche, Spätzünder, Leistungsknicke, Entfaltung des Potenzials |

Nicht ausgezahlte Punkte bleiben (begrenzt) für die nächste Runde stehen. Eine kleine Unschärfe sorgt dafür, dass knappe Fälle mal so, mal so ausgehen. **Alle Vereine** werden bewertet; gezeigt wird dein Kader. Eine Woche vorher nennt dein Co-Trainer Tendenzen.

### Die Bewertungs-Show
Jede Runde hält die Zeit an und öffnet das Fenster **„Auf- und Abwertungsrunde“**. Oben links steht die Bühne: erst Anlass, Trainerteam und Regeln, nach **Starten** der jeweils aufgerufene Spieler (Gesicht, Position, Alter, Rückennummer, alte → neue Stärke, Ergebnis und Begründung). Die Spieler kommen **alphabetisch nach Nachnamen** automatisch dran. Oben rechts zeigt **Spielerentwicklung** die drei größten Sprünge (oder per Umschalter die größten Verluste) mit den Hauptgründen. Unten füllt sich der **Überblick**: Nr., Position, Name, Alter, Potenzial, alte und neue Stärke sowie **Grund 1** und **Grund 2** für jeden Spieler. In der Fußleiste: **Jeden Spieler einzeln bestätigen** (dann wartet die Runde nach jedem Spieler auf **Spieler vor**), Tempo **Langsam/Normal/Schnell**, **Künftig nur die kurze Liste zeigen** und rechts **Spieler vor** bzw. am Ende **OK**. Dazu **Pause** (Leertaste), **Bis zum Ende springen** (Esc) und Enter für „Spieler vor“. Am Ende steht „Damit wurden alle Spieler neu beurteilt“ mit Verbesserungen, Verschlechterungen, der Stärkebilanz der Mannschaft und dem Vergleich zur letzten Runde; ein Klick auf eine Zeile zeigt das Ergebnis des Spielers noch einmal.

### Woher kommt die Auf- oder Abwertung?
Für deinen Kader schreibt das Spiel jede Woche mit, **welche Ursache wie viele Entwicklungspunkte** gebracht oder gekostet hat – exakt aus der Rechnung, die Summe der Beiträge ergibt die Punkte. Die Begründung nennt die gewichtigsten Ursachen, zuerst die in Richtung des Ergebnisses:
- **Alter:** Entwicklungsjahre bis Anfang 20, ab etwa 29 natürlicher Abbau; ein robuster Körper verschiebt ihn nach hinten.
- **Spielpraxis:** Einsatzminuten seit der letzten Runde (auch in der zweiten Mannschaft); wer verletzt fehlt, sammelt keine.
- **Training:** Anlagen, Trainerteam (Stärke und Größe im Verhältnis zum Kader), Spezialtrainer, Trainingsschwerpunkt, Trainingsplan, Förderspieler.
- **Charakter und Moral**, die **Epoche** (Sportwissenschaft), der **Reifegrad** (Früh-/Spätentwickler) und der **Abstand zum Potenzial** (die letzten Punkte sind die schwersten; ab 82 die Weltklasse-Bremse).
- **Einmaliges:** Trainingslager, Hallenturniere, Extraschichten, ein geplatztes Juwel, Durchbruch, Spätzünder, Leistungsknick.
- **Hinweise:** knappe Entscheidung, Grenze des Potenzials, Höchstwert der Runde, weitere Fortschritte oder fortgesetzter Abbau.

Die Begründungen der letzten Runden stehen auch im **Spielerprofil › Entwicklung** („Bewertungen und Gründe“). Für Spieler aus älteren Spielständen oder Neuzugänge, deren Punkte noch aus der Zeit vor der Aufzeichnung stammen, steht eine allgemeine Begründung.

## Liga-Ticker nach den Bewertungen
Nach der Winter- und der Saison-Bewertung meldet der **Liga-Ticker** die größten Gewinner und Verlierer der anderen Vereine deiner Liga. Junge Spieler mit großen Sprüngen sind die Transferziele von morgen.

## Liga-Gleichgewicht
Zum 1. Juli vergleicht das Spiel die Durchschnittsstärke der 1. Liga mit dem Zielwert **72,5**. Liegt sie mehr als einen Punkt darüber, werden die **neuen** Jugendjahrgänge aller Akademien um 0,1 Sterne Potenzial schwächer erzeugt (bis −0,6), liegt sie darunter, etwas stärker (bis +0,5); im Zielkorridor läuft die Korrektur wieder aus. Bestehende Spieler werden nie nachträglich verändert. So bleibt die Liga über Jahrzehnte vergleichbar, ohne dass dein Kader bestraft wird.

## Weltklasse ist selten
Spieler mit Stärke **85 oder mehr** sind die Ausnahme: In der 1. Liga gibt es davon meist nur **rund 10 bis 15**, Spieler mit 90 oder mehr höchstens ein, zwei. Unter 21 Jahren sind 80er schon selten (meist null bis drei), 85er eine Sensation. Wie Stars entstehen, steht unter **Talente & Spielerkurven**.
- **Erzeugte Spieler** (Startkader, Aufsteiger, Nachrücker, Zugänge aus dem Ausland oder von unterklassigen Vereinen) kommen fast nie als fertige Weltklasse ins Spiel: höchstens 84 (Nachrücker 82, Ausland 83, unterklassig 79), junge Spieler altersgerecht schwächer. Auch ihr verdecktes Potenzial wird oberhalb von 82 deutlich gestaucht – nur seltene Ausnahmetalente haben wirklich Luft bis ganz nach oben. Einzige Ausnahme: Ein starker Kader, der neu ins Spiel kommt (Spielstart 1975 oder ein Verein aus der Hintergrund-Simulation), bringt seine etablierten Leistungsträger mit – je nach Kaderschnitt bis zu drei Spieler mit 85–91 im Alter von 23 bis 29. Unter seinen jungen Spielern (bis 23) steckt zudem mit 5 % ein kommender Star mit Weltklasse-Potenzial.
- **Weltklasse-Bremse:** Ab Stärke 82 wird jeder weitere Punkt schwerer (je Punkt rund 15 % langsamer, höchstens auf ein Fünftel des Tempos). Spitzentraining (gute Anlagen, großer Verein) schiebt den Beginn um bis zu 3 Punkte nach hinten – Weltklasse reift eher bei den Großen. Ausnahmetalente (verdecktes Potenzial über 88) spüren sie bis zu 5 Punkte später.
- **Breite der Spitze:** Zum 1. Juli zählt das Liga-Gleichgewicht auch die Spieler ab 85 in der 1. Liga und vergleicht mit dem Ziel 12,5. Je Spieler Abweichung verschiebt sich die Bremse im Folgejahr um 0,4 Punkte, dazu kommt ein langsamer Anteil aus den Vorjahren (insgesamt −5 bis +4): bei zu vielen früher, bei zu wenigen später. Die spätere Bremse hilft nur bis 88 – Spieler mit 90 oder mehr bleiben rar. Bleibt die Abweichung über Jahre bestehen, ändert sich auch das **Talent-Angebot**: Neue Talente und neu erzeugte junge Spieler haben dann seltener (oder häufiger) Weltklasse-Potenzial. Bestehende Spieler werden nie verändert.
- **Epochen-Ausgleich:** Sportwissenschaft und Leistungszentren bringen ab etwa 2000 mehr Spitzenspieler hervor, Mitte der 80er klafft dagegen eine Lücke, wenn die Stars der 70er abtreten. Die Bremse setzt deshalb 1983–1994 etwas später und ab 2002 etwas früher ein. Ist die Spitze dicht besetzt, bleiben Weltklasse-Kandidaten bis zu 2,5 Punkte unter ihrem Potenzial, und alternde Stars (83+) bauen schneller ab; fehlt Weltklasse, halten sie sich länger, und Spieler mit Potenzial ab 82 können bis zu 2 Punkte darüber hinauswachsen.
Für dich heißt das: Ein 85er ist ein echter Unterschiedsspieler – teuer, begehrt und schwer zu ersetzen.`,
  },
  {
    id: 'tactics',
    category: 'tactics',
    title: 'Aufstellung & Formationen',
    keywords: ['taktik', 'aufstellung', 'formation', 'libero', '4-4-2', '4-3-3'],
    body: `## Aufstellung & Formationen
Unter **Spieltag › Aufstellung** stellst du deine Mannschaft – aufgebaut wie in modernen Fußballmanagern:

- **Links – Kaderliste:** drei Abschnitte *Startelf*, *Ersatzbank* und *Reserve* mit Position, Rückennummer, Eignung, Frische, Form, Moral, Durchschnittsnote und Stärke. Ein Klick auf eine Spaltenüberschrift sortiert innerhalb der Abschnitte.
- **Mitte – Spielfeld:** maßstabsgetreu nach FIFA-Regeln (105 × 68 m) mit Spielerkarten auf den Positionen: Position, Eignung, Name und Frischebalken; der farbige Rand zeigt, wie gut der Spieler auf diese Position passt. Darunter die **Ersatzbank** mit so vielen Plätzen, wie die Epoche erlaubt (bis 1994 fünf, ab 1995 sieben, ab 2020 neun).
- **Rechts:** Mentalität und Teamanweisungen im Überblick, Ø Stärke, Ø Eignung und **vertraute Positionen** (wie viele Spieler auf Stamm- oder Nebenposition stehen), darunter Kapitän, Standardschützen und **Hinweise** (Spieler außerhalb seiner Position, Verletzte/Gesperrte, müde Spieler, unausgewogene Formation, fehlender Ersatztorwart).

### Formationen
Die Formation wählst du oben im Spielfeld:

| Formation | Typ | Charakter |
|-----------|-----|-----------|
| 4-4-2 | klassisch | ausgewogen, kompakte Viererkette, zwei Spitzen |
| 4-3-3 | offensiv | drei Angreifer, breite Flügel |
| 3-5-2 | Mittelfeld | starkes Zentrum, laufstarke Außen |
| 4-2-3-1 | modern | Doppelsechs, ein Zielspieler |
| 5-3-2 | defensiv | Fünferkette, sicher gegen starke Gegner |
| 3-4-3 | offensiv | mutig, viel Risiko |
| Libero 1-4-3-2 | 70er/80er | freier Libero hinter der Viererkette |
| Libero 1-3-4-2 | 70er/80er | Libero + Dreierkette, starkes Mittelfeld |
| Libero 1-4-4-1 | 70er/80er | Libero, defensiv, ein Stürmer |

Beim Wechsel der Formation bleibt deine Startelf zusammen und wird bestmöglich auf die neuen Positionen verteilt; eigene Positionsänderungen werden dabei verworfen.

### Ziehen und Tauschen
- Spieler aus der **Liste** oder von der **Bank** auf eine Karte im Feld ziehen setzt ihn dort ein (der bisherige Spieler tauscht den Platz). Lässt du ihn irgendwo auf dem Rasen los, kommt er auf die nächstgelegene Position.
- Eine **Karte auf eine andere Karte** ziehen tauscht die beiden Spieler.
- Auf die Bank oder in die Reserve ziehen nimmt einen Spieler aus der Startelf.
- Ein einfacher Klick auf Karte oder Zeile öffnet das Spielerprofil.

### Positionen verschieben
Ziehst du eine Karte auf eine freie Stelle des Rasens, verschiebst du die **Position selbst**:
- **Fest einrasten (an):** Die Karte springt auf das nächste freie Feld eines festen Rasters (Libero, Innenverteidiger links/zentral/rechts, Außenverteidiger, offensive Außenverteidiger, Sechser, zentrales und offensives Mittelfeld, Flügel, hängende Spitzen, Mittelstürmer). Das Ziel wird beim Ziehen hervorgehoben.
- **Fest einrasten (aus):** Die Karte bleibt genau dort, wo du sie loslässt. Die Position heißt wie das nächstgelegene Rasterfeld – beim Ziehen siehst du den Namen live.

Die so entstandene Position zählt im Spiel genauso wie eine Formationsposition (Eignung, Mannschaftsteile, Torschützenwahl). Der Torwart bleibt fest im Tor, kein Feldspieler kann ins Tor gezogen werden. **Zurücksetzen** stellt die Positionen der Formation wieder her. Die Einstellung *Fest einrasten* wird mit deiner Taktik gespeichert.

### Auto
**Auto** besetzt alle Positionen nach bestmöglicher Eignung (nur einsatzfähige Spieler) und füllt die Bank samt Ersatztorwart – Formation, eigene Positionen und Anweisungen bleiben erhalten.

### Was vor dem Anpfiff passiert
Das Spiel nimmt genau diese Aufstellung. Fällt ein Spieler bis dahin aus (verletzt, gesperrt), rückt auf seine Position der passendste Freie. Freie Bankplätze füllt das Spiel mit den besten Übrigen auf, bevorzugt mit einem Ersatztorwart.`,
  },
  {
    id: 'position-weights',
    category: 'tactics',
    title: 'Positions-Gewichtungen (Attribut-Tabelle)',
    keywords: ['gewichtung', 'attribut', 'position', 'eignung', 'tabelle'],
    body: `## Positions-Gewichtungen
Jede Position bewertet bestimmte Attribute stärker als andere. Diese Gewichte (in \`engine/positions.ts\`, \`POSITION_WEIGHTS\`) bestimmen, welche Fähigkeiten für die Eignung zählen. Je höher der Faktor, desto wichtiger das Attribut.

### Wichtigste Attribute je Position
| Position | Top-Attribute (Gewicht) |
|----------|--------------------------|
| Torwart (TW) | Reflexe 3.0, Fangsicherheit 2.5, 1-gegen-1 2.0, Luftherrschaft 1.5 |
| Libero (LIB) | Stellungsspiel 2.5, Abfangen 2.2, Manndeckung/Zweikampf 1.8, Passspiel 1.8 |
| Innenverteidiger (IV) | Manndeckung 2.8, Zweikampf 2.8, Kopfball 2.2, Kraft 2.0 |
| Rechter/Linker Verteidiger (RV/LV) | Zweikampf 2.0, Tempo 2.0, Ausdauer 2.0, Manndeckung 1.8 |
| Defensives MF (DM) | Zweikampf 2.2, Abfangen 2.2, Stellungsspiel 2.0, Passspiel 2.0 |
| Zentrales MF (ZM) | Passspiel 2.5, Übersicht 2.2, Technik 2.0, Ausdauer 1.8 |
| Rechter/Linker Mittelfeldspieler (RM/LM) | Flanken 2.2, Ausdauer 2.0, Laufbereitschaft 1.8, Tempo 1.8, Passspiel 1.6 |
| Offensives MF (OM) | Technik 2.2, Übersicht 2.2, Passspiel 2.0, Dribbling 1.8 |
| Rechtsaußen/Linksaußen (RA/LA) | Tempo 2.4, Dribbling 2.2, Flanken 2.0, Antritt 2.0 |
| Mittelstürmer (MS) | Abschluss 2.8, Kopfball 2.0, Schusskraft 1.8, Nervenstärke 1.8 |
| Hängende Spitze (HS) | Abschluss 2.0, Dribbling 2.0, Technik 2.0, erster Kontakt 1.8 |

Rechte und linke Positionen haben dieselben Gewichte; die Seite entscheiden **Vertrautheit** und **starker Fuß** (siehe *Positionen & Seiten*).

Ein Mittelstürmer mit starkem Abschluss erreicht also eine deutlich höhere Eignung als einer mit gleichem Gesamtwert, dessen Stärken aber in der Defensive liegen.

### Im Spielerprofil
Oben im Profil stehen die **sechs Positionen mit der besten Eignung**; ein Klick darauf, auf einen Punkt im kleinen Spielfeld oder die Auswahl „für …“ über den Fähigkeiten wählt eine Position. Die fünf für sie am stärksten gewichteten Attribute tragen einen kräftigen **blauen Strich** (Schlüsselattribute), die übrigen gewichteten einen schlanken hellblauen; „Nur wichtige“ blendet alle Attribute ohne Einfluss auf die Position aus. Die Gewichte gelten für das aktuelle Spieljahr – sie ändern sich mit den Epochen (Rückpassregel, Viererkette, Pressing, Spielaufbau).`,
  },
  {
    id: 'player-profile',
    category: 'squad',
    title: 'Spielerprofil – so ist es aufgebaut',
    keywords: ['spielerprofil', 'profil', 'fähigkeiten', 'trainingsfortschritt', 'trend', 'hütchen', 'allgemein'],
    body: `## Spielerprofil
Ein Klick auf einen Spieler öffnet sein Profil. Es ist in vier Bereiche geteilt:

- **Oben links:** Rückennummer, Name und Verein, daneben Stärke, Potenzial (nur als Spanne deiner Scouts), Nation, die **sechs besten Positionen** mit ihrer Eignung, starker Fuß, Spielertyp und Charakter (nur, wenn ihr ihn schon kennt).
- **Oben rechts:** kleines Spielfeld mit allen Positionen (Farbe = Vertrautheit), Saisonbilanz aller Pflichtspiele und Vertragsstatus. Für eigene Spieler startest du hier das **Positionstraining**.
- **Unten links – Fähigkeiten:** alle Attribute nach Gruppen, immer sichtbar. Blauer Strich = wichtig für die gewählte Position. Ein **grüner Pfeil** (bzw. roter nach unten) zeigt eine Veränderung seit der vorletzten Bewertungsrunde. Das **Hütchen** markiert, was dein Wochentraining gerade am stärksten fördert (nur eigener Kader). „Trainingsfortschritt zeigen“ schreibt hinter jeden Wert, wie viel er sich seit Beginn der Aufzeichnung verändert hat.
- **Unten rechts – Reiter:** Allgemein (Spielerdaten, Alter, Größe, Gewicht, Fitness, Frische, Erfahrung, Moral, Form, Zufriedenheit, Verfügbarkeit, Disziplin und Führung), Entwicklung, Saison (Zahlen und letzte Spiele), Karriere, Vertrag (mit Vertragsgespräch), Wünsche, Medizin und Bericht. Bei Jugendspielern steht vorn der Reiter Akademie bzw. Scouting.

Mit den Pfeilen oben rechts (oder den Pfeiltasten) blätterst du durch den Kader, Escape schließt das Profil. Verdeckte Werte wie Konstanz oder Nervenstärke siehst du nie als Zahl – nur als Einschätzung deines Trainerteams bzw. deiner Scouts.`,
  },
  {
    id: 'suitability',
    category: 'tactics',
    title: 'Positionseignung – so wird sie berechnet',
    keywords: ['eignung', 'suitability', 'berechnung', 'farbe'],
    body: `## Positionseignung (0–100)
Für jeden Spieler auf jedem Slot zeigt das Feld eine **Eignungszahl** mit Farbcode:

- **grün** > 75 – Idealbesetzung
- **gelb** 60–75 – solide
- **orange** 45–59 – Notlösung
- **rot** < 60 (unterer Bereich) – ungeeignet

### Formel
\`Eignung = gewichteter Attribut-Mittelwert × Vertrautheits-Faktor × Fuß-Faktor\`

1. **Gewichteter Mittelwert:** Alle für die Position relevanten Attribute (siehe Positions-Gewichtungen) werden mit ihrem Gewicht multipliziert und gemittelt.
2. **Vertrautheits-Faktor:** Wie gut kennt der Spieler die Position?
3. **Fuß-Faktor:** Auf der Seite seines schwachen Fußes verliert ein Spieler 4 % (Verteidiger, Mittelfeld außen). Flügelstürmer auf der „falschen“ Seite verlieren bis 1994 4 %, bis 2004 2 %, danach nichts – inverse Flügel, die nach innen ziehen, sind dann normal. Beidfüßige verlieren nie etwas.

Der Faktor kommt aus der **Positionsvertrautheit** des Spielers (0–100, siehe Artikel *Positionsvertrautheit*):

| Vertrautheit | Faktor |
|-----------|--------|
| ≥ 95 (natürlich) | 1.00 |
| 90 | 0.97 |
| 75 (gut) | 0.89 |
| 60 | 0.80 |
| 50 (ausreichend) | 0.73 |
| 30 | 0.60 |
| 0 (z. B. Feldspieler im Tor) | 0.30 |

Das Ergebnis wird auf 1–99 begrenzt. Deshalb kann ein Weltklasse-Stürmer als Innenverteidiger trotzdem nur eine mittelmäßige Eignung haben – ihm fehlt die Vertrautheit **und** die passenden Attribute.`,
  },
  {
    id: 'position-skill',
    category: 'tactics',
    title: 'Positionsvertrautheit – mehrere Positionen lernen',
    keywords: ['vertrautheit', 'position', 'nebenposition', 'positionstraining', 'umschulen', 'natürlich', 'grün'],
    body: `## Positionsvertrautheit (0–100)
Jeder Spieler hat für **jede** Position einen eigenen Vertrautheitswert. Im Spielerprofil siehst du oben auf dem kleinen Spielfeld je Position einen Punkt mit „Kürzel|Eignung“ – je grüner der Punkt, desto vertrauter:

- **Natürlich** (≥ 90, kräftiges Grün) – hier spielt er wie zu Hause.
- **Gut** (75–89, mittleres Grün) – solide einsetzbar, zählt als Nebenposition.
- **Ausreichend** (50–74, schwaches Grün) – geht, kostet aber spürbar Leistung.
- **Ungeeignet** (< 50, neutral) – Notlösung.

Vorausgewählt ist die Position, auf der er am stärksten ist. Klickst du eine andere an, siehst du ihre Eignung und die dafür wichtigen Attribute: **kräftiger blauer Strich** = Schlüsselattribut, **schlanker, hellerer Strich** = ebenfalls wichtig. Unter jeder Position zeigt ein Balken den Fortschritt; eine dezente Marke steht beim bisherigen Höchstwert.

### Ausgangslage
Die meisten Spieler haben eine natürliche Position, ein bis zwei gute und einige ausreichende (verwandte Rollen wie IV–LIB, ZM–DM/OM, MS–HS, RV–RM–RA liegen nahe beieinander; passende Attribute helfen). Rechts und links sind getrennte Positionen: Ein rechtsfüßiger Rechtsverteidiger ist links meist nur „ausreichend“, als RM oft „gut“, als LM kaum zu gebrauchen. Beidfüßige wechseln die Seite leichter. Torhüter sind auf dem Feld kaum zu gebrauchen und umgekehrt.

### Wachstum
- **Spielen:** Jeder Einsatz auf einer Position steigert die Vertrautheit – schnell, solange sie niedrig ist, dann immer langsamer. Von null auf „gut“ dauert es etwa anderthalb Spielzeiten Stammplatz; junge Spieler lernen schneller, ältere langsamer.
- **Positionstraining:** Im Spielerprofil wählst du für einen eigenen Spieler **eine** Zielposition („Position trainieren“). Er lernt dann an jedem Trainingstag dazu – bessere Trainingsanlagen helfen. Training allein bringt ihn höchstens auf **85**; den letzten Schliff zur natürlichen Position holt er sich nur in Spielen. Erreicht er eine neue Stufe, meldet sich der Trainerstab.

### Abbau
Wer eine Position über ein Jahr nicht mehr spielt, verlernt sie langsam – nicht jeden Monat, sondern zufällig verzögert und umso langsamer, je näher der Wert an der Untergrenze liegt. Er fällt **nie unter 50 % seines Höchstwerts**. Die Stammposition und die gerade trainierte Position bauen nicht ab.

### Wirkung
Die Vertrautheit ist der Vertrautheits-Faktor der **Positionseignung** (siehe dort) und wirkt damit überall: Match-Engine, Aufstellungs-KI, Eignungsfarben in der Aufstellung und Einwechslungen. Alle Vereine nutzen das System: Die KI stellt Spieler auch auf guten Nebenpositionen auf und lässt zu Saisonbeginn je Verein höchstens einen jungen Spieler eine Position lernen, auf der die Formation dünn besetzt ist.

*Technik:* \`engine/positionSkill.ts\` (Erzeugung, Wachstum, Abbau), \`game/positionsGame.ts\` (Monat, KI, Nachrüstung), optionales Feld \`Player.positionSkill\`.`,
  },
  {
    id: 'positions-sides',
    category: 'tactics',
    title: 'Positionen & Seiten (Kürzel)',
    keywords: ['position', 'kürzel', 'rv', 'lv', 'rm', 'lm', 'ra', 'la', 'iv', 'vorstopper', 'seite', 'fuß', 'linksfuß'],
    body: `## Positionen und ihre Kürzel
Positionen sind **seitengenau** wie im Football Manager:

| Kürzel | Position |
|--------|----------|
| TW | Torwart |
| LIB | Libero – freier Mann hinter der Abwehr, vor allem in den 70ern und 80ern |
| IV | Innenverteidiger – in Libero-Systemen der Vorstopper/Manndecker |
| RV / LV | Rechter / Linker Verteidiger |
| DM | Defensives Mittelfeld |
| ZM | Zentrales Mittelfeld |
| RM / LM | Rechter / Linker Mittelfeldspieler |
| OM | Offensives Mittelfeld |
| RA / LA | Rechtsaußen / Linksaußen |
| HS | Hängende Spitze |
| MS | Mittelstürmer |

Den **Vorstopper** gibt es nicht mehr als eigene Position: Er ist die Rolle des Innenverteidigers vor dem Libero und braucht dieselben Stärken (Manndeckung, Zweikampf, Kopfball). Offensive Außenverteidiger (Schienenspieler in der Fünferkette) sind RV/LV mit etwas höherer Lage auf dem Feld.

### Seite und starker Fuß
Die meisten Linksverteidiger und Linksaußen sind Linksfüßer, auf rechts dominieren Rechtsfüßer. Wer auf der Seite seines schwachen Fußes spielt, verliert etwas Eignung (siehe *Positionseignung*), und seine Vertrautheit dort ist meist geringer. Beidfüßige sind auf beiden Seiten einsetzbar – ein großer Vorteil.

### Aufstellung
Im Raster heißen die Felder nach ihrer Lage: links LV/LM/LA, rechts RV/RM/RA. Setzt du einen Spieler frei, gilt die Position des nächstgelegenen Rasterpunkts.

### Alte Spielstände
Beim Laden werden die früheren Kürzel umgerechnet: VS → IV, AV → RV/LV, FL → RA/LA – die Seite folgt dem starken Fuß, bei Beidfüßigen der bisherigen Seite in der Aufstellung. Die Vertrautheit für neue Positionen (Gegenseite, RM/LM) leitet sich aus den bisherigen Werten ab. Auch die Kader-Planung der KI denkt jetzt in Seiten: Fehlt ein Linksverteidiger, sucht sie gezielt einen.

*Technik:* Helfer \`positionGroup\`, \`sideOf\`, \`roleOf\`, \`mirrorPosition\`, \`isFullBack\`, \`isWide\`, \`footFactor\`, \`normalizePosition\` in \`engine/positions.ts\`; Umrechnung \`game/positions2Migration.ts\`.`,
  },
  {
    id: 'tactic-options',
    category: 'tactics',
    title: 'Taktik-Anweisungen & ihre Wirkung',
    keywords: ['taktik', 'tempo', 'pressing', 'abseitsfalle', 'aufbau', 'anweisung'],
    body: `## Taktik-Anweisungen
Unter **Spieltag › Taktik** stellst du Mentalität und Teamanweisungen ein – gegliedert in *Mit Ball* und *Gegen den Ball*. Die Taktik entscheidet, **auf welchem Weg** deine Elf angreift (Kombination durch die Mitte, Flanke, Steilpass, Dribbling, langer Ball, Konter) und verschiebt die **Einzelduelle** (siehe *So rechnet die Match-Engine*).

### Wirkung im Spiel – gemessen
Der Kasten **Wirkung im Spiel** rechnet nicht mit Schätzwerten: Die Match-Engine spielt deine Mannschaft mit deiner Taktik und mit einer neutralen Taktik je 40-mal daheim und auswärts gegen den nächsten Gegner (ohne Gegner gegen dein eigenes Spiegelbild). Links steht der neutrale Wert, rechts deiner, der Balken zeigt den Unterschied je Spiel (orange = Nachteil). Weil echte Spiele simuliert werden, schwanken kleine Unterschiede etwas.

### Mit Ball
- **Breite (0–100):** Flügel = deutlich mehr Flanken und Kopfballchancen (gemessen: aus etwa 14 Flanken werden 25 je Spiel), Mitte = Kombinationen, Steilpässe und mehr Distanzschüsse.
- **Flanken hoch / gemischt / flach:** Hoch führt zu Kopfballduellen (lohnt mit großen, kopfballstarken Stürmern), flach zu Abschlüssen aus dem Rückraum (für schnelle, abschlussstarke Angreifer). Die Flankenqualität des Flankengebers entscheidet mit, ob der Ball ankommt.
- **Tempo (0–100):** mehr Steilpässe, Dribblings und Konter, weniger Geduld und Distanzschüsse; schlechtere Passquote und mehr Kraftverbrauch.
- **Aufbauspiel kurz/lang:** Kurz = höhere Passquote; lang = viele lange Bälle auf den Zielspieler (Kopfballduell), dazu Steilpässe – lohnt mit einem starken Mittelstürmer und gegen hohe Abwehrlinien.

### Gegen den Ball
- **Pressinghöhe:** Gegnerische Pässe werden öfter abgefangen, du kommst häufiger zum Konter – kostet aber viel Kraft und bringt Fouls und Karten.
- **Abwehrlinie:** Hoch = Raum hinter deiner Abwehr (gegnerische Steilpässe und Konter gewinnen leichter das Laufduell), aber mehr Abseits des Gegners; tief = sicher gegen Tempo, dafür mehr Distanzschüsse des Gegners.
- **Abseitsfalle:** deutlich mehr gegnerische Abseitsstellungen; wird sie überlaufen, ist der Stürmer meist frei durch.
- **Zweikampfhärte:** gewinnt mehr Zweikämpfe in der Abwehr, kostet aber Fouls, Freistöße, Elfmeter und Karten.
- **Einsatz:** mehr gewonnene Zweikämpfe und Laufduelle in beide Richtungen, aber mehr Kraftverbrauch, Frischeverlust und Verletzungen.

### Grundausrichtung
Offensiv: mehr Dribblings und Steilpässe, mehr Schüsse, anfälliger für Konter. Defensiv: weniger Risiko, mehr lange Bälle. Konter: weniger Ballbesitz, aber viel mehr Gegenstöße nach Ballgewinn.

Die **KI-Trainer** spielen nach ihrem Stil und ihrem Kader: kopfballstarke Stürmer → hohe Flanken und mehr Breite (manchmal langer Aufbau), kleine wendige Stürmer → flache Hereingaben, gute Flankengeber → mehr über die Flügel.

Im Textmodus kannst du zusätzlich während des Spiels die **Ausrichtung** ändern und **Zurufe** geben (siehe *Textmodus*).

*Messung für Entwickler:* \`MODE=tactics node scripts/matchbench.mjs\` (Tabelle Einstellung → Wirkung).`,
  },
  {
    id: 'set-pieces',
    category: 'tactics',
    title: 'Standardschützen & Kapitän',
    keywords: ['standard', 'elfmeter', 'freistoß', 'ecke', 'kapitän', 'schütze'],
    body: `## Standardschützen
Im Kasten **Kapitän & Standards** auf der Aufstellungsseite legst du fest, wer ruhende Bälle ausführt. Zur Auswahl stehen nur Spieler der aktuellen Startelf, sortiert nach dem passenden Attribut:

- **Elfmeter** – nach Attribut *Elfmeter*
- **Freistoß** – nach Attribut *Freistöße*
- **Ecke** – nach Attribut *Ecken*
- **Kapitän** – nach Attribut *Führung*

Der gewählte Schütze wird in der Simulation bei der jeweiligen Standardsituation bevorzugt – ein guter Elfmeterschütze erhöht die Verwandlungschance. Bei *automatisch (Bester)* nimmt das Spiel den Feldspieler mit dem besten Wert. Der **Kapitän** trägt die Binde (Kennzeichen K) und gibt im Textmodus den Zurufen Gewicht: Je besser seine Führungsqualität, desto stärker wirkt ein Zuruf.`,
  },
  {
    id: 'match',
    category: 'match',
    title: 'Nächstes Spiel, Textmodus und Simulation',
    keywords: ['match', 'text', 'textmodus', 'live', 'kommentar', 'simulieren', 'schnell', 'wechsel', 'zuruf', 'halbzeit', 'ansprache', 'spannung', 'statistik', 'xg', 'nächstes spiel', 'vorschau', 'wetter', 'zuschauer', 'distanz', 'stadt', 'aufwärmen', 'co-trainer', 'schiedsrichter', 'formation', 'chancen-meter', 'wechsel-bildschirm'],
    body: `## Vor dem Anpfiff: „Nächstes Spiel“
Erreicht der Vorlauf einen Tag mit einem Spiel deines Vereins (Liga, Pokal, Europapokal), hält er an und zeigt die Vorschau **Nächstes Spiel**:
- **Bühne:** beide Wappen, Tabellenplätze, Stadion und Datum.
- **Schnelle Aufstellung:** deine Aufstellung übernehmen, den Co-Trainer die beste Elf nach Eignung aufstellen lassen (Taktik bleibt) oder zur Aufstellung wechseln.
- **Fakten:** Mannschaftsstärke der voraussichtlichen Elf (mit Rang in deiner Liga), Saison bisher (S-U-N, Punkte), Form der letzten fünf Pflichtspiele und das Hinspiel – im Europapokal-Rückspiel mit Hinspielergebnis und Auswärtstorregel.
- **Historische Daten:** direkter Vergleich der letzten zehn Saisons (Ligaspiele; im Pokal mit Pokalspielen, im Europapokal die Europapokalspiele), H = im Stadion des heutigen Heimvereins, A = beim heutigen Gast.
- **Karte und Distanz:** beide Orte und die Luftlinie; dazu ein gezeichnetes Stadtbild und ein kurzer Text **Über die Stadt** des Gegners.
- **Zuschauer:** Kapazität und erwartete Zuschauer – gleiche Rechnung wie am Spieltag (Nachfrage, Gegner, Derby, Monat, Wetter), nur ohne Zufall.
- **Wetter:** Die Vorhersage ist genau das Wetter, mit dem die Match-Engine das Spiel austrägt. Regen und Schnee bringen mehr Fehler im Aufbau und gefährlichere Fernschüsse und halten Zuschauer von offenen Plätzen fern, Hitze kostet schneller Kraft.

Unten rechts wählst du die Spielart:
- **Simulieren:** Das Spiel wird sofort berechnet, danach öffnet sich der Spielbericht.
- **Im Textmodus spielen:** Eine eigene Oberfläche ohne Menü. Du verfolgst das Spiel live und greifst ein.

Hervorgehoben ist die zuletzt gewählte Art. Schließt du die Vorschau (Esc), öffnet der Knopf **Nächstes Spiel** oben rechts sie wieder. Mit **Diesen Bildschirm nicht wieder anzeigen** (auch unter Einstellungen umschaltbar) erscheinen stattdessen direkt oben rechts die zwei Knöpfe *Schnell simulieren* und *Textmodus*.

Beide Wege nutzen **dieselbe Match-Engine** und verbuchen alles identisch (Ergebnis, Statistik, Noten, Spielliste, Verletzungen, Karten).

## Der Textmodus
- **Kopf:** beide Wappen, Leiste „(Platz) Heim – Gast (Platz)“ mit Ergebnis und darunter dem Halbzeitstand, Trainer und **Mannschaftsstärke** beider Teams, die Spieluhr als Kreis.
- **Chancen-Meter:** Zwischen den Teams zeigt ein Meter mit sieben Feldern, wer gerade angreift und wie gefährlich es wird – ein Feld Gelb (Aufbau), zwei Orange (gefährlich), drei Rot (Abschluss, Großchance), jeweils in Richtung der angreifenden Mannschaft. Danach gleitet es zur Mitte zurück.
- **Zeitleiste 0–90** (bzw. 120): Tore, Karten, Wechsel und Verletzungen beider Teams (oben Heim, unten Gast), Druckphasen als feine Balken und der Ball als Fortschritt.
- **Ereignisliste:** Tabelle Min. | Erg. | Symbol | Wappen | Ereignis, neueste oben. Jede Szene ist ein Block – Aufbau, Verlauf und Abschluss stehen untereinander. Spielernamen erscheinen mit Position, deine in Bernstein, die des Gegners hellblau; ein Klick öffnet das Spielerprofil. Tore stehen fett mit „1:0 Name (n. Tor in dieser Saison)“. Reiter filtern: **Alles, Highlights, Tore, Wechsel, Karten**.
- **Spannungsmoment:** Bei Großchancen, Elfmetern und direkten Freistößen flimmert im Block zuerst unleserlicher Text, der sich erst dann zu **TOR!**, **GEHALTEN!**, **DANEBEN!** oder **LATTE!** auflöst.
- **Schiedsrichter:** Name, Linie und Stimmung – abgeleitet aus Fouls und Karten dieses Spiels. Er hat keinen eigenen Einfluss, die Kartenhärte folgt der Epoche.
- **Rechts:** Reiter **Team** (deine Aufstellung mit Live-Note, Stärke, Kraft, Fitness, Karten/Verletzung; Bank mit Aufwärmen, ausgewechselte Spieler rot), **Taktik** (Ausrichtung, Zurufe), **Gegner**, **Live** (Tabelle mit dem aktuellen Spielstand), **Statistik** und **Tabelle** (vor dem Anpfiff).

## Wechsel und Taktik: der Wechsel-Bildschirm
Wechsel, Umstellungen und Ansprachen laufen über einen eigenen Bildschirm. Er öffnet sich über **Wechsel / Taktik** (oben rechts) bzw. die Knöpfe **Aufstellung, Taktik, Individuelle Anweisungen**, zur **Halbzeit** und wenn eine Option das Spiel anhält. Das Spiel steht so lange still; alles ist ein Entwurf und gilt erst mit **Bestätigen** (Abbrechen verwirft ihn).
- **Aufstellung:** links die Spielerliste (Startelf und Bank mit Note, Stärke auf der Position, Fitness, Kraft, Form, Moral und Potenzial-Einschätzung der Scouts), rechts das **Spielsystem** mit Formationswahl und dem Feld mit Gesichtern und „Position | Stärke“, die Bank daneben. Wechseln oder Positionen tauschen: zwei Spieler nacheinander anklicken (Liste oder Feld) oder auf dem Feld ziehen. Ein Bankspieler auf einem Platz bedeutet eine Einwechslung (grün „rein“, der Ausgewechselte rot „raus“). Eine neue Formation verteilt deine Elf nach Eignung auf die Positionen. **Mannschaftsstärke** und **verbleibende Wechsel** rechnen sofort mit. Wechsel je nach Epoche: **2** (bis 1994), **3** (ab 1995), **5** (ab 2020).
- **Taktik öffnen:** Ausrichtung sowie Tempo, Breite, Pressing, Abwehrlinie, Einsatz und Aufbauspiel **nur für dieses Spiel** – deine gespeicherte Taktik bleibt unverändert.
- **Halbzeitansprache** (nur in der Pause): Loben, ruhig analysieren oder Kabinenpredigt, daneben die Statistik zur Pause. Lob hilft bei Führung, eine Predigt bei Rückstand; falscher Ton kann schaden.
- **Spielergespräche:** ein kurzes Wort an einzelne Spieler, einmal je Halbzeit. **Loben** stärkt Spieler, die gut spielen; **Mehr fordern** weckt schwache, kränkt aber starke; **Beruhigen** hilft Verwarnten und Nervösen. Die Wirkung ist klein (rund ±1–2 % Tagesleistung).

## Aufwärmen
Ein Klick auf das Lauf-Symbol in der Bank schickt einen Ersatzspieler zum Aufwärmen („Alle Spieler aufwärmen“, „Aufwärmen abbrechen“). Nach **drei Minuten** ist er warm: Eingewechselt bringt er etwas mehr Kraft mit (+4) und kommt schneller ins Spiel (+1 % Tagesleistung). Wer länger als zehn Minuten an der Linie läuft, verliert langsam etwas Kraft.

## Optionen (Knopf „Einstellungen“)
- **Automatische Auswechslungen:** Dein Co-Trainer wärmt bei nachlassender Kraft einen Ersatz auf und wechselt Erschöpfte und Verletzte selbst aus; den letzten Wechsel hebt er bis zur Schlussphase auf. Ausrichtung und Taktik bleiben deine Sache.
- Ohne Co-Trainer **humpelt ein Verletzter weiter**, bis du ihn auswechselst – das Spiel hält dann immer an. Hast du keinen Wechsel mehr, muss er raus und deine Elf spielt in Unterzahl.
- **Zur Halbzeit anhalten**, **Bei Auswechslungen anhalten** (Verletzung, Platzverweis, ein Spieler am Ende seiner Kräfte, Wechsel des Co-Trainers), **Zur Schlussphase anhalten** (75. Minute), **Bei Rückstand anhalten**, **Spannungsmomente** und die **Schnelligkeit** (Langsam, Normal, Schnell, Rasant). Alles wird gespeichert und gilt auch beim nächsten Spiel.
- **Pause** (runder Knopf unten rechts oder Leertaste) und **Vorspulen** bis zur Pause bzw. zum Ende – angehalten wird trotzdem, wenn eine Option greift.

## Statistik passend zur Zeit
Angezeigt wird nur, was es damals schon gab: Schüsse, Ecken, Fouls, Karten und Abseits immer; **Schüsse aufs Tor** ab 1985, **Ballbesitz** ab 1992, **Zweikampfquote** ab 1998, **Pässe, Passquote und Laufleistung** ab 2003, **Großchancen** ab 2013, **Expected Goals** ab 2016. Auch der Kommentar verändert sich: Libero und Bananenflanke in den Siebzigern, Gegenpressing und Halbräume heute, Videobeweis ab 2017.

## Abwechslung im Text
Der Kommentar wird aus einer Grammatik mit vielen ineinander verschachtelten Bausteinen gebaut (\`data/ticker/\`). Ein Gedächtnis verhindert, dass dieselbe Formulierung kurz hintereinander auftaucht; Wetter, Derby, Pokal, Spielstand und Epoche verändern die Wortwahl.`,
  },
  {
    id: 'match-engine',
    category: 'match',
    title: 'So rechnet die Match-Engine',
    keywords: ['engine', 'simulation', 'stärke', 'position', 'eignung', 'heimvorteil', 'tore', 'xg', 'chance', 'note', 'kraft', 'frische', 'epoche'],
    body: `## Spielerstärke im Spiel
Jeder Spieler bringt seine **Positionsstärke** auf der Position mit, auf der er tatsächlich spielt, dazu die **Tagesform** aus Form, Moral, Fitness und Frische. Während des Spiels sinkt die **Kraft**; müde Spieler verlieren in jedem Duell bis zu 18 %.

## Jede Aktion ist ein Duell
Ein Angriff besteht aus mehreren Schritten, und jeder Schritt wird zwischen **zwei konkreten Spielern** mit den passenden Attributen entschieden:
- **Pass:** Passspiel, Technik, Übersicht, Entscheidungen gegen Abfangen, Stellungsspiel, Konzentration des Verteidigers.
- **Zweikampf / Dribbling:** Dribbling, Ballkontrolle, Beweglichkeit, Balance, Antritt, Kreativität gegen Tackling, Stärke, Aggressivität, Antritt, Manndeckung, Stellungsspiel.
- **Flanke:** Erst muss der Außenspieler gegen seinen Gegenspieler zur Flanke kommen, dann zählt sein Wert **Flanken**. Hohe Bälle: **Kopfballduell** (Kopfball, Sprungkraft, Stärke, **Körpergröße**), der Torwart kann mit **Strafraumbeherrschung** abfangen. Flache Bälle: Duell um den Ball im Rückraum.
- **Steilpass & Konter:** Pass in die Tiefe, dann das **Timing** des Läufers gegen die Abseitslinie, danach das **Laufduell** (Schnelligkeit, Antritt gegen Tempo und Stellungsspiel des Verteidigers).
- **Langer Ball:** Weiter Pass, Kopfballduell des Zielspielers, Ablage auf den zweiten Mann.
- **Abschluss:** Abschluss, Schusskraft, Ruhe, Technik (Distanzschuss: Fernschüsse; Kopfball: Kopfball) gegen den Torwart in genau dieser Situation – Reflexe und Stellungsspiel, **Eins gegen eins** bei Großchancen, Strafraumbeherrschung bei Kopfbällen. Verteidiger können Schüsse blocken.
- **Standards:** Der Eckenschütze (Wert **Ecken**) bzw. Freistoßschütze bestimmt die Qualität der Hereingabe; bei Ecken rücken die Innenverteidiger mit auf. Direkte Freistöße und Elfmeter: Schütze gegen Torwart.
- **Fouls & Karten:** Ein geschlagener Verteidiger foult umso eher, je aggressiver und schlechter im Tackling er ist und je härter die Taktik; Karten hängen an Aggressivität und Disziplin (Ruhe, Konzentration) – **Erfahrung** hilft in hitzigen Phasen.

Ein Duell 60 gegen 85 gewinnt der Bessere in gut drei von vier Fällen – deutlich, aber mit Zufall. Die Mannschaftsstärke (Angriff gegen Abwehr), der **Heimvorteil** und deine **Ausrichtung** verschieben alle Duelle ein wenig.

### Verdeckte Werte
- **Konstanz:** Die Tagesleistung schwankt je Spiel – wenig konstante Spieler streuen stärker nach oben und unten, im Schnitt sind sie nicht schlechter.
- **Nervenstärke (wichtige Spiele) und Ruhe:** wirken unter Druck – Derby, Pokal, Europapokal, Verlängerung, Elfmeter und eine knappe Schlussphase – auf Abschluss und Torwart.

## Minute für Minute
- **Ballbesitz** folgt der Spielkontrolle; daneben laufen in jeder Minute Zweikämpfe und Luftduelle im Mittelfeld (rund 220 je Spiel).
- **Angriffe** entstehen je nach Ballbesitz, Tempo und Ausrichtung; den Weg wählt die Taktik (siehe *Taktik-Anweisungen*). Ein verlorenes Duell beendet den Angriff – und kann einen **Konter** auslösen.
- Dazu kommen Fehler im Aufbau, Verletzungen, Nachspielzeit, im Pokal Verlängerung und Elfmeterschießen. Die **KI-Trainer** wechseln und ändern bei Rückstand die Ausrichtung.

## Statistik
Gezählt wird jede Aktion: Schüsse und Schüsse aufs Tor, Pässe (angekommen), Zweikämpfe und Luftduelle (gewonnen), Flanken, Dribblings, Balleroberungen und Torvorlagen je Spieler. Der Spielbericht zeigt sie unter **Einzelwerte**, das Spielerprofil (Reiter Saison) die Quoten der Saison – jeweils nur, was es in der Epoche schon gab.

## Epochen (Soll-Werte mit Quellen in \`data/matchStats.ts\`)
- **Torschnitt:** rund 3,3 Tore pro Spiel in den Siebzigern, um 2,9 um die Jahrtausendwende, heute gut 3,1.
- **Torarten heute:** etwa 16 % Kopfballtore, ein Viertel nach Standards (Ecken ~10 %, Freistöße ~7 %, Elfmeter ~6 %), ~13–15 % nach Kontern, ~12 % aus der Distanz. In den Siebzigern mehr Flanken, Kopfbälle, lange Bälle und Fernschüsse, weniger Pressing und Konter, weniger Pässe (gut 70 % Passquote statt heute über 80 %).
- **Heimvorteil:** in den Siebzigern deutlich stärker (rund 55 % Heimsiege), heute gut 40 %.
- **Karten, Wechsel, Videobeweis:** Gelb-Rot ab 1991/92, Gelbsperre ab 1979/80; 2 Wechsel bis 1994, 3 ab 1995/96, 5 ab 2020/21; Videobeweis ab 2017/18. Regeln gelten ab dem **Saisonstart (1. Juli)**.

## Noten
Jeder Spieler bekommt eine Note von **1,0 bis 6,0** in halben Schritten – aus Toren, Vorlagen, Torvorbereitungen, Paraden, gewonnenen Zweikämpfen, Fehlern, Karten, Gegentoren und seiner Leistung auf der Position.

## Kalibrierung
\`node scripts/matchbench.mjs\` simuliert tausende Spiele je Epoche und vergleicht Ist mit Soll; \`MODE=attrs\` misst Attribute 60 gegen 85, \`MODE=tactics\` die Taktik-Wirkung.`,
  },
  {
    id: 'cpu-ai',
    category: 'match',
    title: 'CPU-Aufstellung & Gegner-KI',
    keywords: ['cpu', 'ki', 'gegner', 'aufstellung', 'ai', 'formation'],
    body: `## CPU-Aufstellung & Gegner-KI
Nicht nur du stellst auf – **alle 17 anderen Vereine** bekommen eine sinnvolle Aufstellung und Taktik (\`engine/lineupAI.ts\`).

### So denkt die CPU
1. **Formationswahl:** Für jede der neun Formationen wird durchgerechnet, wie gut der Kader sie besetzen kann (Summe der Eignungen). Dazu kommen die Vorlieben des **Vereinstrainers** (Lieblingsformation, Stil) und der Zeitgeist: Libero-Systeme bekommen bis Mitte der 80er einen Bonus, ab den späten 90ern einen deutlichen Abschlag (siehe **Trainer der KI-Vereine**). Neu gewählt wird beim Trainerwechsel, zum Saisonstart und nach jedem Transferfenster.
2. **Besetzung** (\`assignToFormation\`): Alle (Slot, Spieler)-Paare werden nach Eignung sortiert und greedy vergeben – der beste passende Spieler bekommt zuerst seinen Platz.
3. **Standardschützen & Kapitän:** automatisch nach den passenden Attributen (Elfmeter, Freistöße, Ecken, Führung).
4. **Taktik-Werte:** folgen dem Stil des Trainers (offensiv, ausgewogen, defensiv, Konter) mit kleiner persönlicher Note – jeder Klub hat so den „Charakter" seines Trainers, und ein Trainerwechsel ändert ihn.

Weil jede CPU-Aufstellung dieselbe Eignungs- und Taktik-Logik nutzt wie deine, wirken sich Kaderqualität und Positionsbesetzung des Gegners real auf die Simulation aus. Ein Verein mit schlecht besetzten Positionen spielt spürbar schwächer.`,
  },
  {
    id: 'ai-coaches',
    category: 'ai',
    title: 'Trainer der KI-Vereine',
    keywords: ['trainer', 'ki', 'coach', 'stil', 'philosophie', 'formation', 'libero', 'gegner'],
    body: `## Trainer der KI-Vereine
Jeder andere Verein deiner Liga hat einen **Trainer** mit Namen, Alter, Herkunft, Ansehen (0–100) und zwei Eigenschaften (\`engine/aiManager.ts\`, \`game/coachCarousel.ts\`). Dein eigener Verein hat keinen – das bist du.

### Stil → Taktik
- **Offensiv:** Angriffsausrichtung, mehr Pressing und Tempo, höhere Linie.
- **Ausgewogen:** alles in der Mitte.
- **Defensiv:** tiefe Linie, weniger Tempo, Absicherung.
- **Konterfußball:** tief stehen, schnell umschalten (Konter-Bonus der Engine).

Jeder Trainer hat eine **Lieblingsformation**, die zu Stil und Epoche passt (Libero in den 70ern/80ern, Dreierkette und 4-4-2 in den 90ern, 4-2-3-1 ab 2000). Gewählt wird trotzdem nur, was der Kader besetzen kann. Die Stilverteilung ändert sich mit der Zeit: früher mehr Vorsicht, später mehr Pressing und Umschaltspiel.

### Philosophie → Kaderplanung
- **Jugend:** zieht Talente früh hoch, kauft eher junge Spieler, bekommt weniger Transferbudget.
- **Einkauf:** kauft lieber fertige Spieler, bekommt mehr Budget.
- **Ausgewogen:** je nach Lage.

### Herkunft
Überwiegend einheimische Trainer; ausländische kamen anfangs vor allem aus Österreich, Jugoslawien, Ungarn und den Niederlanden, später aus ganz Europa. Große Vereine holen bekanntere Trainer.

### Neuer Trainer
Ein neuer Trainer bringt seine Taktik mit und sorgt kurz für bessere Stimmung (Moral +1 Stufe) – der bekannte „Trainereffekt".`,
  },
  {
    id: 'ai-carousel',
    category: 'ai',
    title: 'Vorstandsdruck & Trainerkarussell',
    keywords: ['entlassung', 'trainer', 'druck', 'vorstand', 'karussell', 'ruhestand', 'abgeworben'],
    body: `## Vorstandsdruck & Trainerkarussell
### Erwartung
Vor jedem Urteil schätzt der Vorstand, wo der Verein stehen müsste: zu 60 % nach der Stärke der besten Elf, zu 40 % nach dem Ruf.

### Druck (0–100)
Jeden Montag ab dem 4. Spieltag bewegt sich der Druck auf einen Zielwert zu:
- Platz schlechter als erwartet erhöht ihn deutlich, besser senkt ihn.
- Die Form der letzten fünf Spiele zählt mit.
- Abstiegsplätze (+20) und die Plätze davor (+10) machen nervös.
- Bekannte Trainer genießen etwas mehr Geduld.

### Entlassung während der Saison
Ab Druck 72 (September bis April, frühestens 70 Tage nach Amtsantritt) wird es gefährlich – je höher, desto wahrscheinlicher. Nach etwa sechs Entlassungen in einer Saison wird die Liga zurückhaltender. Üblich sind **drei bis sechs Entlassungen pro Saison**. Jede Entlassung meldet die Sportredaktion in deinen Nachrichten, samt Nachfolger.

### Zum Saisonende
- **Ansehen** steigt oder fällt mit dem Abschneiden gegenüber der Erwartung (Meister +6).
- **Ruhestand** ab 65 möglich, mit 70 sicher.
- **Entlassung**, wenn das Ziel klar verfehlt wurde.
- **Vertragsende** nach einigen Jahren.
- **Abgeworben:** Ein großer Verein ohne Trainer holt sich gern den Trainer eines kleineren Vereins, der klar über den Erwartungen lag.

Die Sportredaktion fasst das Karussell in einer Nachricht zusammen.

### Arbeitslose Trainer
Entlassene Trainer und solche ohne neuen Vertrag bleiben im **Trainerpool** und können später woanders wieder anfangen – nur nicht sofort bei dem Verein, der sie gerade entlassen hat. Mit 70 hören sie auf.`,
  },
  {
    id: 'ai-squad-planning',
    category: 'ai',
    title: 'Kaderplanung der KI-Vereine',
    keywords: ['ki', 'transfer', 'kader', 'bedarf', 'jugend', 'ausland', 'nachrücker', 'transferliste', 'angebot'],
    body: `## Kaderplanung der KI-Vereine
Die anderen Vereine kaufen nicht zufällig, sondern nach **Bedarf** (\`game/aiClubs.ts\`).

### Markttage
Im Sommer jede Woche von Anfang Juli bis Ende August, im Winter jede Woche im Januar. An jedem Markttag prüft jeder KI-Verein seinen Kader; nicht jeder schlägt jedes Mal zu.

### Bedarf je Positionsgruppe
Tor, Innenverteidigung, Außenverteidigung, Mittelfeld, Flügel, Sturm. Die Formation bestimmt die Stammplätze, die gewünschte Tiefe ist etwa das Doppelte (im Tor drei). Bewertet werden:
- **Breite:** zu wenige Spieler (Spieler ab 33 zählen halb, im Winter fehlen Langzeitverletzte),
- **Qualität:** ein Stammspieler deutlich unter dem Niveau der Mannschaft,
- **Alter:** alle Stammkräfte der Gruppe über 30.

### Wie der Bedarf gedeckt wird
1. **Jugend**, wenn ein Talent ab 17 gut genug ist (Trainer mit Jugend-Philosophie sind großzügiger). Sie ziehen zum Saisonstart zusätzlich ihr bestes Talent hoch.
2. **Kauf bei einem anderen KI-Verein:** Ablöse über die Verhandlungslogik des Transfermarkts (Marktwert, Rekordkurve, Vertragslaufzeit, Bedeutung im Kader). Wer sonst selbst eine Lücke hätte, gibt nur zur vollen Forderung ab. Der Spieler muss wollen (Vereinsgröße, Aussicht auf Spielzeit).
3. **Kauf bei einem unterklassigen Verein** (jünger, etwas schwächer, günstiger).
4. **Kauf im Ausland** – in den 70ern selten, ab den 2000ern häufig.

Spitzentransfers meldet die Sportpresse sofort; die übrigen Wechsel stehen in der Nachricht zum Fensterschluss.

### Mengen
Höchstens fünf Zugänge im Sommer, zwei im Winter, sieben pro Saison. Im Schnitt sind es drei bis fünf Zugänge je Verein und Saison (Jugend eingerechnet) – wie in der Bundesliga.

### Abgänge
Überzählige einer Gruppe kommen auf die **Transferliste** (für dich und die Konkurrenz sichtbar). Ist der Kader zu groß, werden die schwächsten oder ältesten abgegeben; im Sommer verabschieden sich Routiniers über 32, die nicht mehr mithalten, zu unterklassigen Vereinen.

### Notnagel
Fehlen nach dem Sommerfenster immer noch Spieler (unter 20), rücken neue Spieler nach. Das ist nur noch selten nötig.

### Dein Verein
Dein Kader wird nie automatisch verändert. Angebote für deine Spieler kommen bevorzugt von Vereinen, die auf der Position Bedarf haben.`,
  },
  {
    id: 'ai-history-mode',
    category: 'ai',
    title: 'Entwicklung der anderen Vereine (zufällig oder historisch)',
    keywords: ['historisch', 'geschichte', 'zufällig', 'großklubs', 'bayern', 'münchen', 'madrid', 'manchester', 'option', 'spielstart', 'aus', 'mittel', 'stark'],
    body: `## Entwicklung der anderen Vereine
Beim Spielstart wählst du im Schritt **Spielwelt**, wie sich die anderen Vereine über die Jahrzehnte entwickeln. Die Wahl steht danach fest (Zusammenfassung im Schritt **Manager**); alte Spielstände laufen mit **Aus**.

### Die drei Stufen
- **Aus:** frei und zufällig. Jeder Verein wächst mit Erfolg, Geld und Glück – auch Braunschweig kann eine Ära prägen, auch München Rot kann absteigen.
- **Mittel:** leicht an der echten Geschichte orientiert. Die historischen Großklubs haben einen spürbaren Vorteil, Überraschungen bleiben aber häufig.
- **Stark:** deutlich an der Geschichte orientiert. Die echten Großklubs landen meist oben: Mönchengladbach und Hamburg Blau in den 70ern/80ern, München Rot dauerhaft und ab etwa 2012 erdrückend, Dortmund ab Mitte der 90er und in den 2010ern, Bremen und Kaiserslautern in ihren Phasen; im Ausland Liverpool Rot in den 70ern/80ern, Manchester ab 1990, Madrid Weiß und Barcelona, Paris ab 2011.

### Was gelenkt wird – und was nicht
Jeder Verein mit echtem Vorbild hat eine **Zielkurve** über die Jahre (Titel, Europapokal, Umsatzranking ab 1996). Daran ausgerichtet werden nur die Mittel der KI-Vereine:
- **Ruf und Marke** – sie bestimmen Zuschauer, Sponsoren, wen der Verein auf dem Star-Markt holen kann, welche Spieler kommen wollen, welchen Trainer er bekommt und wie viel er in den Nachwuchs steckt,
- **Geld aus dem Umfeld** – Großklubs erhalten zum Saisonstart einen Zufluss (Gönner, Konzern, Investor, Vermarktungsvorsprung), abgestürzte Vereine tragen Altlasten,
- **Stärke** der nur simulierten Vereine anderer Ligen (und der DDR) – Großklubs drängen nach oben,
- **Größe** der Auslandsvereine im Europa-Hintergrund.

Es gibt **keine Ergebnisvorgabe** und keinen Eingriff ins Spiel selbst: Ein Großklub mit schlechtem Kader oder Trainer kann trotzdem scheitern.

### Dein Verein
Für deinen Verein gilt die Kurve **nie** – egal welche Stufe. Wechselst du den Verein, gilt sie wieder für den Verein, den du verlassen hast.

### Fiktive Namen
Die Vereine tragen Städtenamen. Wo der echte Verein fehlt, trägt der Verein derselben Stadt die Kurve (z. B. **Manchester** für United und City, **London Nord** für Arsenal/Tottenham, **Leipzig** ab 2009 für den neuen Leipziger Spitzenverein).`,
  },
  {
    id: 'staff-people',
    category: 'staff',
    title: 'Mitarbeiter als Personen — Qualität, Methoden, Abwerbung',
    keywords: ['mitarbeiter', 'trainer', 'cotrainer', 'qualität', 'methoden', 'fortbildung', 'abwerbung', 'kapazität', 'spezialist', 'torwarttrainer', 'bewerber'],
    body: `## Jede Stelle ist ein Mensch
Für jede Rolle gibt es **drei Bewerber**: eine günstige Nachwuchskraft, eine erfahrene Kraft und eine teure Spitzenkraft. Jede Person hat:
- **Qualität** (1–20): bestimmt, wie stark ihre Rolle wirkt (Verletzungen, Reha, Regeneration, Scouting, Reichweite, Training).
- **Spezialgebiet** (z. B. Technik, Taktik, Athletik, Torwart, Mentales): wirkt zusätzlich auf passende Spieler.
- **Methodenstand**: das Jahr, in dem das Wissen aktuell war. Nach acht Jahren ohne **Fortbildung** (drei Monatsgehälter) verliert die Arbeit spürbar an Wirkung.
- **Alter und Vereinstreue**: Ältere gehen in den Ruhestand, gute Leute werden von größeren Vereinen **abgeworben**. Treue, ein gutes Gehalt und ein großer Verein halten sie.

## Wirkung des Trainerteams – spürbar, aber gebremst
- Das Trainerteam (Chef-, Co-, Konditions-, Athletik-, Torwarttrainer …) verändert das **Entwicklungstempo** um etwa −2 % bis +20 %. Die Wirkung sättigt: Der dritte Spitzentrainer bringt weniger als der erste.
- **Das Potenzial steigt nicht.** Gute Trainer holen nur zuverlässiger heraus, was in den Spielern steckt – deshalb hast du mit einem Top-Co-Trainer nicht automatisch für immer die besten Spieler.
- **Kapazität:** Ein Trainer betreut etwa neun Spieler sinnvoll. Ein aufgeblähter Kader verwässert die Arbeit.
- **Spezialisten:** Ein Torwarttrainer hilft nur den Torhütern, ein Techniktrainer vor allem Offensivspielern, ein Taktiktrainer der Abwehr.
- Die Qualität deines Co-Trainers bestimmt auch, wie treffsicher seine Einschätzungen im **Trainingsbericht** und vor Bewertungsrunden sind.`,
  },
  {
    id: 'staff-trainerteam',
    category: 'staff',
    title: 'Trainerteam und Arbeitsmarkt',
    keywords: ['trainerteam', 'co-trainer', 'torwarttrainer', 'fitnesstrainer', 'athletiktrainer', 'analyst', 'videoanalyst', 'jugendtrainer', 'arbeitsmarkt', 'ex-profi', 'quereinsteiger', 'abfindung', 'ablöse', 'verhandlung', 'fachgebiet'],
    body: `## Trainerteam
Unter **Training › Trainerteam** stellst du Cheftrainer-Assistenz, Co-Trainer, Torwarttrainer (ab 1980), Fitnesstrainer (ab 1983), Reha-Trainer und Videoanalyst (ab 1993), Athletiktrainer, Spielanalyst und Sportpsychologe (ab 2003) sowie Jugendtrainer ein. Übrige Mitarbeiter (Medizin, Scouting, Medien, Verwaltung) bleiben unter **Verein › Mitarbeiter**.

### Fachgebiete
Jede Person hat acht Fachgebiete (1–20): **Taktik, Technik, Fitness, Torwart, Mentales, Nachwuchs, Analyse, Medizin & Reha**. Ihre **Qualität in der Rolle** ergibt sich daraus (ein Torwarttrainer zählt nur mit seinem Torwartwissen, ein Co-Trainer vor allem mit Taktik und Technik). Im Beruf lernen Trainer dazu – bei erfolgreichen Vereinen schneller –, im Alter bauen sie ab; wer lange ohne Stelle ist, rostet ein.

### Anstellen, Verlängern, Entlassen
- **Verhandlung:** Jede Person nennt eine Gehaltsforderung. Ein großer Verein und eine lange Laufzeit geben bis zu etwa 14 % Spielraum; nach drei Absagen ist Schluss.
- **Abwerben:** Angestellte anderer Vereine kosten **sechs Monatsgehälter Ablöse** und wechseln nur zu einem mindestens etwa gleich großen Verein.
- **Entlassen:** Abfindung = halbe Restlaufzeit (mindestens zwei, höchstens 18 Monatsgehälter). Die Person kehrt auf den Arbeitsmarkt zurück.
- **Vertragsende** (30.6.): Treue Leute verlängern zu ihrer aktuellen Forderung, andere gehen. Mit „+2 Jahre“ verlängerst du vorher selbst.

### Wirkung
- Lernfaktor je Trainingsbaustein (siehe „Trainingsplan“), weniger Trainingsverletzungen durch Fitness/Medizin.
- Entwicklungstempo, Betreuung, Spezialisten, Reha und Regeneration wie unter „Mitarbeiter als Personen“ beschrieben.

## Der Arbeitsmarkt über die Jahrzehnte
Alle Vereine der Liga haben ein Trainerteam; der Markt wird jede Saison neu gemischt:
- **Ehemalige Profis:** Beendet ein Spieler seine Karriere, geht er mit einer gewissen Wahrscheinlichkeit ins Trainergeschäft. **Erfolgreiche Spieler** (Titel, viele Einsätze, hohe Spitzenstärke, Kapitän) tun das öfter und haben im Schnitt mehr Trainer-Potenzial – eine Garantie ist es nicht. Ihre Stärken stammen aus der Spielerzeit: Spielintelligenz → Taktik, Technik → Technik, Athletik → Fitness, Torhüter → Torwarttraining, Persönlichkeit → Nachwuchsarbeit.
- **Quereinsteiger:** Sportlehrer, Amateurtrainer, Sportwissenschaftler, Physiotherapeuten, ab den 90ern Analysten, ab 2000 Psychologen.
- **KI-Vereine** besetzen ihre Stellen nach ihrem Ruf, werben Bessere ab und verlängern Verträge. Ihr Trainerteam beeinflusst die Entwicklung ihrer Spieler.
- **Aufstieg:** Gute Co-Trainer und sehr erfolgreiche Ex-Kapitäne werden Kandidaten für Cheftrainerposten der KI-Vereine (Trainerkarussell).
- **Ruhestand** spätestens mit 69, Berufswechsel nach langer Zeit ohne Stelle.`,
  },
  {
    id: 'training-philosophy',
    category: 'training',
    title: 'Trainingsphilosophie, Förderspieler & Monatsbericht',
    keywords: ['philosophie', 'schwerpunkt', 'belastung', 'schonung', 'förderspieler', 'trainingsbericht', 'phase', 'vorbereitung', 'rückrunde'],
    body: `## Vier Phasen, eine Entscheidung je Phase
Statt jede Woche alles neu zu planen, legst du für **Vorbereitung, Hinrunde, Winter und Rückrunde** je einen Schwerpunkt fest (Training → Trainingsplan):
- **Ausgewogen:** keine Nebenwirkungen.
- **Hohe Belastung:** +6 % Entwicklung, aber weniger Frische und gelegentlich **Überlastungsverletzungen** (medizinisches Personal senkt das Risiko).
- **Technik & Taktik:** +5 % für Offensivspieler und junge Spieler, etwas weniger für Ältere.
- **Schonung:** mehr Frische und weniger Verletzungen, dafür −5 % Entwicklung.
- **Talente fördern:** Spieler bis 23 +10 %, Ältere −4 %.

## Förderspieler
Bis zu **drei Spieler** bekommen besondere Aufmerksamkeit: +25 % Entwicklungstempo (+15 %, wenn das Trainerteam überlastet ist). Der Rest des Kaders bekommt dafür etwas weniger (−3 %).

## Trainingsbericht zum Monatsanfang
Der Trainerstab meldet, wer auffällig zulegt, wer trotz Luft nach oben stagniert, wer Spielpraxis braucht und wie es den Förderspielern geht. Er weist auf einen zu großen Kader und veraltete Methoden hin. Die Einschätzung ist umso genauer, je besser dein Co- oder Cheftrainer ist.`,
  },
  {
    id: 'finance-overview',
    category: 'finance',
    title: 'Finanzen – Überblick',
    keywords: ['finanzen', 'kontostand', 'budget', 'bilanz', 'dm', 'mark', 'euro', 'währung', 'wirtschaft', 'epoche'],
    body: `## Bereich "Finanzen"
Der Bereich **Finanzen** (unteres Menü, ) zeigt Kontostand, Budgets, die aufgeschlüsselte Einnahmen-/Ausgaben-Bilanz der Saison, einen Verlaufsgraphen, eine Prognose bis Saisonende sowie die letzten Buchungen.

## Währungs-Ära (DM/EUR) — automatisch
Alle Beträge werden **ära-gerecht** angezeigt:
- **bis einschließlich 2001:** Deutsche Mark (**DM**)
- **ab 2002:** Euro (**€**), fest umgerechnet mit **1 € = 1,95583 DM**

Intern rechnet das Spiel durchgehend in nominalen DM; die Anzeige stellt ab 2002 automatisch auf Euro um.

## Das Finanzniveau ist recherchiert
1975/76 setzt ein Erstligist im Mittel rund **4,5 Mio. DM** um: etwa 70 % Eintritt (Ø 23.000 Zuschauer × 8 DM), dazu Catering,
Trikot- und Bandenwerbung, ein kleiner TV-Anteil (ARD/ZDF zahlten 4,8 Mio. DM für die ganze Liga), Programmhefte und Mitgliedsbeiträge.
Kleine Vereine kommen auf knapp 2–3 Mio., große Zuschauermagneten auf 7–9 Mio. DM. Ein Stammspieler verdient rund 75.000 DM im Jahr,
ein Star 200.000–250.000 DM. Ablösen folgen der echten Rekordkurve: 1975 ist ein Spitzenspieler für 0,5–1,5 Mio. DM eine Investition
von einem Viertel des Jahresumsatzes. Bis heute wächst ein mittlerer Erstligist auf rund 200 Mio. € (TV-Explosion ab 1988/1992/2000,
Vermarktung ab den 2000ern), die Spitze auf ein Vielfaches davon.

## Steigende Finanzbasis über die Jahrzehnte
Die gesamte Finanzbasis des Fußballs **wächst über die Jahre real mit** — Sponsoring, TV-, Ticket- und Fanartikel-Erlöse
sowie die Fixkosten skalieren gemeinsam mit einem **Wirtschafts-Index** (economyScale). Bezugsjahr ist **1975 ≈ 1×**,
bis **2030 ≈ 130×**. Die Erlösarten wachsen unterschiedlich schnell (siehe *Finanzen im Wandel der Epochen*). Details siehe *Chronik: Steigende Finanzbasis & Währung*.

## Kontostand & Budgets
- **Kontostand:** wird real fortgeschrieben (rot bei Minus, türkis bei Plus).
- **Transferbudget:** verfügbares Geld für Spielerkäufe.
- **Gehaltsbudget:** Sollwert für die Spielergehälter; ein Balken zeigt die aktuelle Auslastung (Summe der Kadergehälter ÷ Gehaltsbudget), farbcodiert.
- **Gehälter pro Jahr oder pro Woche:** Alle Gehälter (Kader, Verträge, Verhandlungen, Mitarbeiter) stehen standardmäßig **pro Jahr** und auf die Mark bzw. den Euro genau da, z. B. „312.457 DM / Jahr“. In den **Einstellungen › Gehälter** kannst du auf **pro Woche** umstellen – Anzeige und Eingabe in Verhandlungen folgen der Einstellung, gerechnet wird intern unverändert (Jahr = 52 Wochen).

## Saldo
- **Saldo Saison:** Gesamteinnahmen − Gesamtausgaben seit Saisonbeginn.
- **Monatssaldo (fix):** fester monatlicher Netto-Wert (Sponsoring + Platzierungsbonus − Gehälter − Fixkosten), ohne Heimspiel-Einnahmen.

## Fortschreibung & Speichern
Buchungen entstehen automatisch beim Zeitfortschritt: **bei jedem Heimspiel** (Zuschauereinnahmen) und zum **Monatsabschluss** (Gehälter/Fixkosten). Alles wird im Spielstand persistiert; für den Manager-Verein wird zusätzlich eine Einzelbuchungs-Historie und ein Monats-Verlauf geführt.`,
  },
  {
    id: 'finance-income',
    category: 'finance',
    title: 'Einnahmen & Formeln',
    keywords: ['einnahmen', 'stadion', 'zuschauer', 'ticket', 'fanartikel', 'tv', 'sponsor', 'prämie', 'transfer', 'catering', 'würstchen', 'programmheft', 'trikot', 'banden', 'mitglied', 'beitrag'],
    body: `## Einnahmeposten (mit Formeln)

### Stadioneinnahmen (pro Heimspiel)
\`Zuschauer × Ticketpreis × Preismix der Tribünen\`
Zuschauer = \`Kapazität × Grund-Auslastung × Preis-Reaktion × Gegner × Derby × Nachfrage der Epoche\` (siehe *Ticketpreis & Preiselastizität*).
Die **Grund-Auslastung** folgt bei KI-Vereinen Ruf, Tabellenplatz und Liga (1975 etwa 40–50 %, die Stadien waren groß), beim eigenen Verein der Fanstimmung.
Große Gegner ziehen bis zu 20 % mehr, kleine bis zu 12 % weniger, ein Derby 15 % mehr. Der Ticketpreis liegt 1975 bei **5–11 DM** (Schnitt 8 DM).

### Fanartikel / Merchandising (pro Heimspiel)
\`Zuschauer × ProKopf × Fanshop-Faktor\`, mit \`ProKopf = 0,10 + (Reputation / 100) × 0,27\` DM (1975 ≈ 0,30 DM, Schals und Wimpel).
Wächst mit der **Vermarktung** und der Marke: ab den 1990ern wird der Fanshop zu einer eigenen Säule.

### TV- & Mediengelder (monatlich)
Zentral vermarktet (siehe *Finanzen im Wandel der Epochen*): 1975 rund 230.000 DM je Erstligist im Jahr. Pokalspiele bringen je Heimspiel \`2.500 + Reputation × 50\` DM × TV-Skala.

### Catering / Würstchenbuden (pro Heimspiel)
\`Zuschauer × Netto-pro-Kopf\`, wobei der Pro-Kopf-Erlös von **Ausbaustufe** und **Betriebsform** abhängt (Eigenbetrieb > Umsatzbeteiligung > Verpachtung). Details siehe *Catering & Betriebsformen*.

### Programmhefte & Spieltagserlöse (pro Heimspiel)
\`Zuschauer × 0,25\` DM (1975-Basis). Skaliert direkt mit der Auslastung.

Alle Preise je Besucher (Eintritt, Catering, Programm, Logen) wachsen mit der **Preis-Skala** = Stadionumsatz-Skala ÷ Zuschauer-Nachfrage der Epoche.

### Sponsoring & Werbung (monatlich, aus echten Verträgen)
Monatsrate = Summe aller Verträge der Partner-Pyramide ÷ 12 (Brust, Ausrüster, Ärmel, Premium-/Co-/Regionalpartner …; Banden und Wettpartner als „Werbung“). Details: Artikel **Sponsoring & Werbung**.


### Mitgliedsbeiträge (monatlich)
Jahreswert = \`30.000 + Reputation × 1.000\` DM, monatlich gebucht (\`÷ 12\`). Wächst mit dem Ansehen des Vereins.

### Prämien
- **Siegprämie (Sponsoren/Gönner):** \`6.000 + Reputation × 50\` DM pro Sieg (1975; wächst wie die Preise im Stadion).
- **Remisprämie:** \`2.000\` DM pro Unentschieden.
- **Sponsor-Platzierungsbonus (monatlich):** Platz 1–3 → 9.000 DM · Platz 4–6 → 4.500 DM · Platz 7–10 → 2.000 DM.
- **Pokal und Europapokal:** Preisgeld je gewonnener Runde (siehe *Landespokal* und *Europapokal*).

### Transfererlöse
Spielerverkäufe fließen über die Transfer-Engine ein (Ablösesumme als Einnahme gebucht, sobald ein Deal abgeschlossen ist).`,
  },
  {
    id: 'finance-expenses',
    category: 'finance',
    title: 'Ausgaben & Formeln',
    keywords: ['ausgaben', 'gehalt', 'stab', 'unterhalt', 'trainingsbetrieb', 'fixkosten', 'transfer', 'gebäude', 'einrichtung', 'catering', 'pacht'],
    body: `## Ausgabeposten (mit Formeln, überwiegend monatlich)

### Spielergehälter
\`Summe der Wochengehälter des Kaders × 4,33\` (Wochen je Monat).
Die Wochengehälter der Spieler richten sich nach dem **Marktgehalt**: \`1.400 × 2^((Stärke − 72) / 11)\` DM/Woche (1975-Basis). Stärke 72 ≈ 73.000 DM im Jahr, 80 ≈ 120.000, 90 ≈ 226.000 DM.
Verlängerungen verhandelst du selbst (siehe Artikel **Verträge, Bosman & Kabine**). KI-Vereine verlängern meist automatisch: Laufzeit nach Alter, neues Gehalt = Mittel aus altem Gehalt und Marktgehalt.

### Auflauf- und Siegprämien
Je Sieg zahlt der Verein der Mannschaft gut ein halbes Wochengehalt des Kaders (\`× 0,55\`), je Remis ein Fünftel. Über eine Saison sind das rund 15–20 % der Grundgehälter (Recherche).

### Betreuerstab
\`Spielergehälter × 0,18\` – Trainer-, Betreuer- und Verwaltungspersonal.

### Stadionunterhalt
\`Kapazität × 0,3 + (100 − Zustand) × 250\` DM/Monat (1975: 50.000 Plätze ≈ 250.000 DM im Jahr). Ein schlechterer Stadionzustand erhöht die Kosten.

### Gebäude-Fixkosten (Unterhalt)
Jede **gebaute Einrichtung** verursacht monatliche Fixkosten (ersetzt den alten Pauschalposten "Trainingsbetrieb"):
\`Basis × Stufen-Multiplikator\` (era-skaliert), summiert über alle Einrichtungen.
- **Stufen-Multiplikator** (Stufe 1..5): \`1 · 1,4 · 1,9 · 2,5 · 3,2\`.
- **Basis-Unterhalt/Monat (1975-DM):** Trainingszentrum 1.400 · Medizin 875 · Fanshop 700 · Reha-Zentrum 1.050 (Jugendakademie und NLZ: Kosten über **Jugend → Akademie**) · Leistungszentrum 1.575 · Datenanalyse 1.225.
- **Stadion** ist ausgenommen (steckt im Stadionunterhalt), **Catering** ist Sonderfall je Betriebsform (siehe *Catering & Betriebsformen*).
- Zukunfts-Einrichtungen (Reha, NLZ, Leistungs-/Datenzentrum) zählen erst ab **Stufe ≥ 2** als gebaut.

### Catering-Fixkosten & -Pacht (monatlich)
Fixkosten je Betriebsform/Stufe; bei **Verpachtung** zusätzlich eine feste Monatspacht als Einnahme (siehe *Catering & Betriebsformen*).

### Betrieb & Vermarktung (monatlich)
Wareneinsatz der Fanartikel (35 % des Fanartikel-Umsatzes der Vorsaison), Betreuung der Sponsoren (5 % der Sponsoring- und Vermarktungserlöse 1975, 12 % ab 2010) und Geschäftsstelle, Berater, Reisen (1975 nichts, 2020 5 % des Vorjahresumsatzes). Ein Weltverein mit großem Fanartikel- und Sponsorengeschäft hat davon deutlich mehr; KI-Vereine planen ihre Gehälter nach dem Umsatz abzüglich dieser Kosten.

### Sonstige Fixkosten
\`2.500 + Reputation × 200\` DM/Monat (Reisen, Organisation, Verwaltung, Versicherungen; Ruf 75 ≈ 210.000 DM im Jahr).

Alle Werte gelten in 1975-DM. Stadionunterhalt und sonstige Fixkosten wachsen über die Jahrzehnte mit dem **Stadiongeschäft** (bis heute etwa um das 25-Fache), Gehälter mit dem gesamten Fußballmarkt (etwa um das 100-Fache).

## Liga-Ebene
Der Boom von Vermarktung und Stadiongeschäft kam vor allem in der 1. Liga an. Unterklassige Vereine wachsen deshalb nur mit einem Anteil über das Niveau von 1975 hinaus: Trikot, Banden und Fanartikel in der 2. Liga mit gut einem Drittel, in der 3. Liga mit 15 %, darunter mit 8 %; Eintrittspreise, Catering, Sponsorenprämien, Stadionbetrieb, Gebäudeunterhalt und Mitgliedsbeiträge in der 2. Liga mit 70 %, in der 3. Liga mit 45 %, darunter mit 30 %. 1975 macht das keinen Unterschied, heute trennt es die Ligen deutlich. TV-Gelder werden je Liga verteilt (2. Liga ein Fünftel bis ein Viertel des Erstliga-Topfs).

Entsprechend zahlen unterklassige Vereine weniger: Das Marktgehalt gilt für die 1. Liga, in der 2. Liga liegt das Gehaltsniveau 1975 bei 45 % (heute rund ein Viertel), in der 3. Liga bei 20 % (heute rund 7 %), darunter noch tiefer. Forderungen bei Verlängerungen und Wechseln richten sich nach dem Niveau der Liga, in der dein Verein spielt.

### Transferausgaben
Spielerkäufe werden als Ausgabe gebucht (Ablöse verringert Kontostand und Transferbudget).

## Warnungen
Die Seite warnt automatisch bei: Konto im Minus, negativer Saisonend-Prognose, Gehaltssumme über Gehaltsbudget und negativem festen Monatssaldo. Zum Monatsabschluss erhältst du zusätzlich eine **Finanz-Nachricht** ("Monatsabschluss"), bei Minus eine Vorstandswarnung.`,
  },
  {
    id: 'finance-forecast',
    category: 'finance',
    title: 'Verlaufsgraph & Prognose',
    keywords: ['graph', 'verlauf', 'prognose', 'hochrechnung', 'endkontostand', 'chart'],
    body: `## Kontostand-Verlauf (Graph)
Ein selbstgebauter SVG-Graph (Dark-Theme, Türkis-Akzent) zeigt den Kontostand an den **Monatsabschluss-Stützpunkten** plus den aktuellen Stand. Eine gestrichelte rote Linie markiert die Null-Marke; Minus-Punkte werden rot dargestellt.

## Prognose bis Saisonende
Hochrechnung des erwarteten Endkontostands:
\`Endkontostand ≈ aktueller Kontostand + (fester Monatssaldo × Restmonate) + (erwartete Heimspiel-Einnahmen × Restheimspiele)\`

- **Restmonate:** aus aktuellem Datum bis Saisonende (UTC-basiert).
- **Erwartete Heimspiel-Einnahme:** \`erwartete Zuschauer × (Ticketpreis + Catering + Fanartikel + Programm)\` zum laufenden Preisniveau; TV kommt über den Monatssaldo.
- Zusätzlich werden erwartete Gesamt-Einnahmen und -Ausgaben separat ausgewiesen.

## Budget-Aufteilung
Transferbudget (Spielerkäufe) und Gehaltsbudget (Wochenlohnsumme) werden getrennt dargestellt, damit Investitionen in Ablöse und in laufende Gehälter unabhängig planbar sind.`,
  },
  {
    id: 'finance-catering',
    category: 'finance',
    title: 'Catering & Betriebsformen (Würstchenbuden)',
    keywords: ['catering', 'würstchen', 'imbiss', 'getränke', 'betriebsform', 'eigenbetrieb', 'umsatz', 'verpachtung', 'pacht', 'pro-kopf', 'spieltag'],
    body: `## Catering / Würstchenbuden
Catering ist eine **ausbaubare Einrichtung** (Bereich **Gelände**, 5 Stufen) mit eigenem Icon. Der Erlös entsteht **pro Heimspiel**:
\`Zuschauer × Netto-pro-Kopf\` (era-skaliert, 1975-Basis). Die **Betriebsform** wählst du im Bereich **Marketing** oder direkt an der Catering-Einrichtung im **Gelände**.

## Die drei Betriebsformen
- **Eigenbetrieb:** höchster Pro-Kopf-Erlös, aber die höchsten monatlichen Fixkosten.
- **Umsatzbeteiligung:** mittlerer Pro-Kopf-Erlös, mittlere Fixkosten.
- **Verpachtung:** niedrigster Pro-Kopf-Erlös, dafür kaum Fixkosten und eine **feste Monatspacht** als planbare Einnahme.

## Netto-Erlös pro Besucher (DM, 1975-Basis) je Stufe 1..5
| Betriebsform | St.1 | St.2 | St.3 | St.4 | St.5 |
|---|---|---|---|---|---|
| Eigenbetrieb | 0,60 | 0,85 | 1,10 | 1,35 | 1,60 |
| Umsatzbeteiligung | 0,45 | 0,62 | 0,80 | 0,98 | 1,18 |
| Verpachtung | 0,20 | 0,28 | 0,36 | 0,44 | 0,52 |

## Monatliche Fixkosten (DM, 1975-Basis) je Stufe 1..5
| Betriebsform | St.1 | St.2 | St.3 | St.4 | St.5 |
|---|---|---|---|---|---|
| Eigenbetrieb | 3.000 | 4.500 | 6.500 | 9.000 | 12.000 |
| Umsatzbeteiligung | 1.500 | 2.200 | 3.000 | 4.200 | 5.500 |
| Verpachtung | 800 | 1.100 | 1.500 | 2.000 | 2.600 |

## Monatspacht (nur bei Verpachtung, DM 1975-Basis) je Stufe 1..5
\`4.000 · 6.000 · 8.000 · 11.000 · 14.000\` DM/Monat (als Einnahme im Bucket **catering** gebucht).

## Faustregel
Große Vereine mit hoher Auslastung profitieren stärker vom **Eigenbetrieb** (viele Besucher × hoher Pro-Kopf-Erlös), kleine Vereine fahren mit **Verpachtung** risikoärmer (feste Pacht, kaum Fixkosten).`,
  },
  {
    id: 'finance-epochs',
    category: 'finance',
    title: 'Finanzen im Wandel der Epochen — TV, Vermarktung, Marke',
    keywords: ['tv', 'fernsehgelder', 'vermarktung', 'hospitality', 'marke', 'sponsoring', 'epoche', 'fairplay', 'ffp', 'lizenz', 'schulden', 'zinsen', 'marktwert', 'gehaltsquote'],
    body: `## Der Erlös-Mix verschiebt sich
1975 lebt ein Verein vom Stadion: rund 60 % des Umsatzes sind Eintritt, Catering und Programmhefte. Ab Ende der 1980er wachsen die **TV-Gelder** (Privatfernsehen, Pay-TV), ab den 2000ern **Vermarktung** (Lizenzen, Partner) – Logen und Business-Seats zählen als Eintritt ihrer Platzkategorie. Jede Erlösart wächst deshalb unterschiedlich schnell:

| Jahr | Spieltag | TV | Vermarktung |
|---|---|---|---|
| 1975 | 60 % | 7 % | 24 % |
| 1992 | 42 % | 22 % | 29 % |
| 2000 | 26 % | 36 % | 31 % |
| 2020 | 12 % | 40 % | 38 % |

## TV-Gelder (zentrale Vermarktung)
- Zu Saisonbeginn wird der TV-Topf der Liga verteilt und **monatlich** ausgezahlt. 1975 umfasst er 4,2 Mio. DM für die 1. Liga (ARD/ZDF zahlten 4,8 Mio. für die Bundesliga), heute über eine Milliarde Euro.
- Die Größe des Topfs folgt den echten Rechteverträgen (1. Liga ≈ 80 %): 1984/85 rund 8 Mio. DM, 1988/89 (UFA, Privatfernsehen) 32, 1992/93 (SAT.1 „ran“) 116, 1997/98 204, 2000/01 (Kirch) rund 555 Mio. DM; 2006/07 ≈ 330 Mio. €, 2017/18 mit Auslandsrechten über 1,1 Mrd. €, 2024/25 ≈ 1,17 Mrd. €. Die Kirch-Pleite 2002/03 drückt den Topf vorübergehend.
- Die Verteilung richtet sich nach **Liga** (2. Liga ein Fünftel bis ein Viertel, darunter wenig) und dem **Tabellenplatz der Vorsaison**. Bis 1990 fast gleichmäßig (15 % leistungsabhängig), ab 2000 zu 35 %, ab 2017/18 (vier Säulen) zu 50 % – der Meister bekommt dann gut das Doppelte des Letzten.

## Marke: regional, national, international
- Jeder Verein hat eine **Marke** aus drei Werten (0–100). Sie wächst mit Tabellenplätzen, Titeln, Pokalsiegen und Europapokal-Erfolgen und kehrt langsam zu dem Niveau zurück, das der Ruf erwarten lässt.
- Die **internationale Bekanntheit** zählt anfangs kaum, wird aber über die Jahrzehnte immer wichtiger (Globalisierung).
- Die Marke bestimmt die **Reichweite** im Sponsoring (siehe **Sponsoring & Werbung**), multipliziert **Fanartikel** und die **Vermarktung** (Lizenzen). International bekannte Vereine verkaufen außerdem **Fanartikel weltweit** (Lizenzen, Versand): eine echte Weltmarke 2024 bis rund 130 Mio. € im Jahr.

## Europapokal
- 1975 verdient ein Verein im Europapokal vor allem an den **Heimspielen** (volle Ränge); die Prämien sind klein. Prämien und **Startgelder** wachsen mit der Wirtschaft. Ab 1992 (Meisterliga mit Gruppenphase) steigen die Prämien im Landesmeister-Wettbewerb bis 2000 auf das Fünffache, in den anderen Wettbewerben auf das Doppelte. Mit der Gruppenphase der Champions League kommen hohe **Startgelder** dazu: Ein Teilnehmer bekommt 1999/2000 rund 8 Mio. €, heute rund 45 Mio. € schon fürs Dabeisein, international bekannte Vereine über Marktpool und Koeffizient bis knapp das Doppelte (FC Bayern 2024/25 insgesamt 106 Mio. € bis zum Viertelfinale); im UEFA-Pokal ab der Gruppenphase 2004 und der Europa League 2009 deutlich weniger. Europäischer Erfolg ist damit der stärkste Hebel für eine Dynastie – garantiert aber nichts.

## Preisschilder und Kontostand
- **Gehälter, Marktwerte und das Transferbudget** sind Preisschilder in 1975-Werten und werden mit dem Spieljahr hochgerechnet angezeigt und gebucht. Der **Kontostand** ist nominal.
- **Marktwerte** werden zu jeder Saison neu bewertet: Alle fünf Stärkepunkte verdoppelt sich der Wert, junge Spieler mit Luft nach oben sind teurer, ältere günstiger.
- Das **Transferbudget** legt der Vorstand zu Saisonbeginn fest: je nach Vertrauen 40–90 % des Polsters über einer Reserve von einem Viertel des Jahresumsatzes.

## Schulden, Lizenz, Finanzielles Fairplay
- Ein **negativer Kontostand** kostet monatlich Zinsen (etwa 8 % im Jahr).
- Liegt der Kontostand am Saisonende unter **−40 % des Jahresumsatzes**, gibt es die Lizenz nur mit **Transfersperre**.
- Ab **2011/12** gilt das **Finanzielle Fairplay**: Liegt das Ergebnis der letzten drei Saisons mehr als 5 % des Umsatzes im Minus, folgt eine Verwarnung, beim zweiten Verstoß eine Transfersperre.

## Die anderen Vereine wirtschaften mit
- KI-Vereine passen ihre Gehälter dem Umsatz an (Gehälter, Stab und Prämien zusammen gut zwei Drittel des Vorjahresumsatzes; wer viel Geld auf dem Konto hat, zahlt deutlich mehr, ab Bosman 1996 etwas mehr als vorher), verkaufen bei Schulden Spieler, investieren Überschüsse in Gelände und Stadion und geben ein **Transferbudget** frei. Als Reserve bleibt rund **ein Zehntel des Jahresumsatzes**; vom Überschuss darüber fließt ein Viertel in Gelände und Stadion (Ränge nur, wenn das Stadion fast voll ist; verschuldete Vereine bauen teure Einrichtungen zurück), vom Rest werden 85 % zum Transferbudget ( Trainer mit Einkaufs-Philosophie bekommen mehr, solche mit Jugend-Philosophie weniger). Wofür es ausgegeben wird, entscheidet die Kaderplanung (siehe **Kaderplanung der KI-Vereine**). Geld bleibt nicht einfach auf dem Konto liegen – auch die Konkurrenz wird stärker, wenn sie erfolgreich ist.
- Jeder KI-Kader hält **zwei Torhüter**: Beendet einer seine Karriere oder wird verkauft, holt der Verein vor allen anderen Wechseln Ersatz (Ersatztorwart eines Liga-Rivalen oder aus dem Ausland, bei leerer Kasse ablösefrei).`,
  },
  {
    id: 'finance-contracts',
    category: 'finance',
    title: 'Sponsoring & Werbung: Partner-Pyramide, Klauseln, Verhandlung',
    keywords: ['sponsoring', 'trikot', 'brust', 'ärmel', 'ausrüster', 'banden', 'led', 'werbung', 'vertrag', 'laufzeit', 'klausel', 'katar', 'trainingslager', 'wetten', 'krypto', 'tabak', 'premium', 'partner', 'verhandlung', 'prämie', 'abstieg', 'exklusiv'],
    body: `## Werbeflächen nach Epochen
Jede Fläche ist ein eigener Vertrag mit Partner, Branche, Herkunftsland, Jahreswert, Laufzeit, Prämien und Klauseln (Finanzen › Sponsoring).

| Fläche | ab | Hinweis |
|---|---|---|
| Trikot-Brust | 1975 | seit Jägermeister bei Braunschweig (1973) |
| Ausrüster | 1975 | erst ab den 1990ern viel Geld |
| Banden | 1975 | Wert = Zuschauer × TV-Präsenz, ab 2010 LED (+20 %) |
| Regionalpartner | 1975 | 2–4 kleine Partner, in den unteren Ligen das Rückgrat |
| Premium-Partner | 1990 | 1 → 3 Plätze (1. Liga) |
| Trainingsanzug & Kollektion | 1994 | 1. und 2. Liga |
| Co-/Exklusivpartner | 1995 | 2 → 6 Plätze |
| Nachwuchs-Partner | 2001 | Teil zweckgebunden für den Jugendetat |
| Wettpartner | 2005 | 2006–2011 verboten, ab 2012 mit Lizenz |
| Digitalpartner | 2012 | Technologie, Streaming |
| Ärmel | 2017/18 | vorher vermarktete die Liga den Ärmel |
| Krypto/NFT | 2021–22 | Einbruch nach der FTX-Pleite im November 2022 |

Namensrechte am Stadion (ab 2000) laufen weiter über **Stadion › Namensrechte**.

## Was ein Vertrag wert ist
- Grundlage ist der Marktwert der Fläche für einen durchschnittlichen Erstligisten in diesem Jahr (1975 Brust ≈ 0,25 Mio. DM, 2024 ≈ 9 Mio. €).
- Darauf wirkt die **Reichweite**: regionale Marke (Regionalpartner), nationale Marke (Brust, Banden, Premium) oder weltweite Strahlkraft (Ausrüster, Ärmel, Digital). Je weiter die Globalisierung, desto stärker zählt Größe (1975 Reichweite^1,25, ab 2020 ^2,5): Ein Weltverein bekommt heute ein Vielfaches des Durchschnitts – der FC Bayern nahm 2024/25 240 Mio. € mit Sponsoring ein.
- Unterklassige Vereine wachsen nur anteilig mit (wie bei Trikot und Banden früher).
- Werte stehen in 1975-Basis und steigen mit der Inflation – nicht mit dem schnelleren Werbemarkt. Lange Verträge werden deshalb mit der Zeit günstig für den Sponsor; die Verlängerung bringt dann den Sprung.

## Branchen im Wandel
1970er Spirituosen und Brauereien, 1980er Unterhaltungselektronik, ab 1992 Telekommunikation, ab 1998 Energie und IT, ab 2000 Fluggesellschaften, ab 2011 Staatsfonds und Tourismus vom Golf, ab 2012 Wettanbieter, 2021/22 Krypto. **Regulierung:** Tabak nur auf Banden (Fernsehwerbung seit 1975 verboten), ab 2007 gar nicht mehr; Spirituosen ab 2000 nicht mehr auf dem Trikot; Wettanbieter 2006–2011 untersagt. Ein Verbot beendet laufende Verträge zur neuen Saison. Im März 2022 enden alle Verträge mit russischen Energiekonzernen.

## Klauseln
- **Pflicht-Trainingslager / Pflicht-Sommerreise im Herkunftsland:** Katar (ab 2011, nur für Vereine, die Doha buchen dürfen), VAE, Türkei; China, Japan, Korea, USA mit Sommertour. Erinnerung sechs Wochen vorher; findet das Lager woanders statt, kostet es **25 % des Jahreswerts** Vertragsstrafe. Der Sponsor zahlt für die Klausel rund 12 % mehr.
- **Freundschaftsspiel beim Sponsor:** einmal im Winter, Einnahme, Spieler etwas müde.
- **Abstieg:** Ausstieg oder Kürzung um 30–50 %, solange der Verein unten spielt.
- **Mindestplatzierung** (Topklubs): unter Platz 4 bzw. 6 sinkt der Wert in der nächsten Saison.
- **Exklusivität:** kein zweiter Partner derselben Branche.
- **Verlängerungsoption:** du kannst im letzten Jahr um zwei Saisons verlängern (+10 %).
- **Jugend:** Fällt der Jugendetat unter die Zweckbindung, zieht sich der Nachwuchs-Partner zurück.
- **Umstrittene Partner** (Tabak, Wetten, Krypto, Golfstaaten, ab 2014 russische Energie): Sie zahlen mehr, aber die Fan-Stimmung leidet bei der Unterschrift und jeden Monat – heute stärker als 1980.
- **Erfolgsprämien:** Meister, Pokal, Europapokal, Klassenerhalt – am Saisonende gebucht.

## Verhandlung
Jedes Angebot kannst du annehmen, ablehnen oder verhandeln: höherer Jahreswert, andere Laufzeit, Klauseln streichen (kostet den Wert, den die Klausel für den Sponsor hat). Ein interessierter Sponsor kommt entgegen; wer zu viel fordert, riskiert den Abbruch. Höchstens zwei Runden. Im **Januar** melden sich Partner im letzten Vertragsjahr mit einem Verlängerungsangebot; neue Konditionen gelten ab der nächsten Saison. Für freie Flächen kommen im Lauf der Saison neue Interessenten.

## KI-Vereine
Sie füllen freie Flächen zu Saisonbeginn mit dem besten von zwei Angeboten, ziehen Verlängerungsoptionen und unterliegen denselben Abstiegs-, Prämien- und Verbotsregeln.

## Betrieb & Vermarktung (Ausgaben)
Vermarktung kostet: Wareneinsatz der Fanartikel (35 %), Betreuung der Sponsoren (5 % 1975 → 12 % ab 2010) und eine wachsende Geschäftsstelle mit Beratern und Reisen (0 → 5 % des Umsatzes). Große Marken haben davon mehr – ihre Personalquote liegt deshalb niedriger (FC Bayern 2024/25: Personal 47 % des Umsatzes ohne Transfers).`,
  },
  {
    id: 'finance-elasticity',
    category: 'finance',
    title: 'Platzkategorien, Ticketpreise und Nachfrage',
    keywords: ['ticket', 'ticketpreis', 'preis', 'elastizität', 'auslastung', 'zuschauer', 'nachfrage', 'referenzpreis', 'richtpreis', 'stehplatz', 'sitzplatz', 'business', 'business-seat', 'loge', 'logen', 'premium', 'gästeblock', 'gäste', 'vip', 'hospitality', 'rollstuhl', 'schätzung', 'marktforschung'],
    body: `## Sieben Platzkategorien
Jeder Platz im Stadion gehört zu einer Kategorie mit **eigenem Preis** und **eigener Nachfrage**:

| Kategorie | ab | Herkunft im Stadion | Richtpreis Erstligist (Ruf 70) |
|---|---|---|---|
| Stehplätze | 1975 | Stehränge | 1975 ≈ 5,60 DM · 2024 ≈ 15 € |
| Sitzplätze (offen) | 1975 | Bänke/Schalensitze ohne Dach | 1975 ≈ 10,50 DM · 2024 ≈ 30 € |
| Sitzplätze (überdacht) | 1975 | Bänke/Schalensitze unter Dach (Teildach: halb) | 1975 ≈ 15 DM · 2024 ≈ 50 € |
| Premium-Sitze | 1988 | Komfortsitze | 1990 ≈ 45 DM · 2024 ≈ 90 € |
| Business-Seats | 1980 | VIP-Bereich eines Blocks (≈ 200 Plätze), ab 1992 ganze Business-Ränge | 1985 ≈ 90 DM · 2024 ≈ 360 € je Spiel |
| Logen | 1985 | Logen der Blöcke (≈ 11 Gäste) | 1990 ≈ 3.500 DM · 2024 ≈ 9.000 € je Spiel |
| Gästeblock | 1984 | 10 % der Plätze (im Europapokal 5 %), zuerst aus Stehplätzen | wie Stehplatz, etwas teurer |

Größere Vereine dürfen mehr verlangen (Fans wie der faire Preis nach Ruf, Business und Logen deutlich steiler). Das **Hospitality-Modul** des Stadionumfelds (VIP-Zelt, Business-Club, Premium-Hospitality) hebt Nachfrage (+6/15/25 %) und Preisbereitschaft (halb so viel) für Business-Seats und Logen. Ab 2002 sind 1 % der Sitzplätze Rollstuhlplätze (Pflicht, nur Anzeige).

## Unabhängige Nachfrage
- **Fans:** Zuschauerpotenzial des Vereins × Zuspruch (Erfolg, Stimmung) × Nachfrage der Epoche × Gegner × Derby. Aufgeteilt nach Vorlieben der Zeit: 1975 wollen 70 % stehen, 1998 noch 42 %, heute rund ein Drittel; Sitzplatz-Fans wollen zunehmend ein Dach; ab 1988 kommt ein kleiner Premium-Markt dazu. Gästefans hängen am Gegner (Ruf, Derby).
- **Business & Logen:** eigene, absolute Märkte aus Vereinsgröße, Marke, Wirtschaftskraft der Region (München, Frankfurt, Stuttgart … stärker; Ostdeutschland nach 1990 schwächer; in der DDR-Oberliga gar keine) und Reife des Hospitality-Markts (1980 kaum, ab den WM-Stadien 2006 voll). Wer mehr Business-Seats baut, als der Markt hergibt, bekommt leere Plätze – VIP lässt sich nicht beliebig stapeln.
- **Wetter:** Bei Regen bleiben offene Plätze leer (−18 %), überdachte sind gefragter.
- **Ausweichen:** Wer in seiner Kategorie keinen Platz bekommt, nimmt teils die Nachbarkategorie (Steh → Sitz, Sitz ↔ Tribüne, Business → Premium, Logen → Business).
- Das Potenzial hängt **nicht** an der Kapazität: Ein größeres Stadion zieht über Jahre neue Fans an (15 % je Saison), aber nur bis zur Obergrenze, die der Ruf hergibt.

## Preise und Elastizität
Nachfrage × (1 − Elastizität × (Preis/Richtpreis − 1)); günstiger als der Richtpreis lockt etwas mehr. Elastizität: Steh 0,6, Gäste 0,5, Sitz 0,75, Tribüne 0,8, Premium 0,95, Business 1,05, Logen 1,15 – teure Plätze reagieren stärker. Je teurer die Kategorie, desto mehr bringt der einzelne Platz: Ein Business-Seat erlöst ein Vielfaches eines Stehplatzes.
Die Preise wachsen jede Saison mit dem Richtpreis der Epoche mit (dein Preisniveau bleibt). Das Preisniveau der Fanplätze (Steh, Sitz, Tribüne, Gäste; Stehplätze zählen 1,5-fach) bestimmt die Fanstimmung.

## Nachfrage nur geschätzt
Unter **Stadion → Tickets & Nachfrage** siehst du die Nachfrage als **Spanne**, nicht als genaue Zahl. Grundunschärfe: Kurve ±16 %, Sitzplätze ±20 %, Premium ±28 %, Business ±34 %, Logen ±40 %. Genauer wird es durch **Kaufmännischen Leiter, Marketing-/Sponsoringmanager, Stadion-/Eventmanager, Fan-Data/CRM-Manager und Datenanalyst** (je nach Qualität, zusammen höchstens −55 %) und durch Erfahrung: jedes Heimspiel, in dem die Kategorie **nicht** ausverkauft war, verrät mehr. Ausverkauft heißt nur: Die Nachfrage ist mindestens so groß wie das Kontingent.

## KI-Vereine
KI-Vereine haben keine Blöcke, aber Kontingente je Kategorie: Sie bauen ihren Platzmix jede Saison ein Stück in Richtung Epoche um (Sitzplatz-Boom ab den 1990ern, Business-Seats und Logen nach Nachfrage) und erhöhen Preise, wenn sie ausverkauft sind, oder senken sie bei leeren Rängen.

## Größenordnung
Ein Erstligist nimmt 1975 je Heimspiel rund 150.000 DM Eintritt (≈ 70 % des Umsatzes inkl. Catering und Programm), ein Spitzenverein 2024 mit voller Arena rund 6–8 Mio. € (FC Bayern 2023: ≈ 121 Mio. € Spieltagserlöse, ≈ 5,2 Mio. € je Heimspiel).

Quellen: Allianz Arena (fcbayern.com: 106 Logen, 2.200 Business-Plätze, 227 Plätze für Menschen mit Behinderung), Westfalenstadion 1974 mit 17.000 von 54.000 Sitzplätzen (bvb.de), Eintracht Frankfurt Hospitality (Loge ab 640 € je Platz und Spiel, Business ab ≈ 360 €), Stehplatz-Dauerkarten 2024/25 (Schnitt 213 €), UEFA-Gästekontingent 5 %. Annahmen: VIP-Bereiche 1980, Logen 1985, Gästeblock 1984, Premium 1988.`,
  },
  {
    id: 'facilities-grounds',
    category: 'facilities',
    title: 'Das Vereinsgelände',
    keywords: ['vereinsgelände', 'gelände', 'ausbau', 'gebäude', 'bauplatz', 'kunstrasen', 'halle'],
    body: `## Eine Anlage, die mitwächst
Unter **Verein → Vereinsgelände** siehst du deine Anlage als Zeichnung. Jede Einrichtung ist ein Gebäude oder Platz, der mit der Ausbaustufe wächst:

| Einrichtung | Was sich zeigt |
|---|---|
| Stadion | Folgt deinen Blöcken: Höhe je Seite aus den Rängen, Dächer, bei vier vollen Dächern eine Arena; Laufbahn, solange alle Blöcke nur einen Rang haben. Laufender Bau: Kran |
| Trainingszentrum | 1 bis 3 Plätze, ab Stufe 3 (ab 1995) Kunstrasen, ab Stufe 4 Flutlicht, Stufe 5 Trainingshalle |
| Jugendakademie | Jugendplätze und ein Gebäude von der Holzbaracke bis zum Campus mit Internat |
| Medizin, Fanshop, Buden | wachsen sichtbar mit jeder Stufe |
| Umfeld | Bahnstrecke mit Sonderzügen und Stadion-Bahnhof, Shuttlebusse, Parkplatz bis Parkhaus, VIP-Zelt bis Premium-Hospitality, Familienbereich, Museum, Fan-Zone, Pressezentrum mit Ü-Wagen, Flutlicht je Lux-Stufe, Vereinsheim, Megastore, Versandlager, Fanprojekt, Fanräume, zugekaufte Grundstücke – noch nicht Gebautes als **Bauplatz** (siehe *Stadionumfeld*) |
| Reha-Zentrum, NLZ, Leistungszentrum, Datenanalyse | erscheinen erst, wenn ihre Zeit gekommen ist – zuerst als **Bauplatz** |

Der Baustil folgt der Epoche (Backstein und Satteldach in den 70ern und 80ern, Putz und Flachdach ab 1990, Glas ab 2010), die Jahreszeit ist sichtbar (Herbstlaub, Schnee im Winter), und der Parkplatz füllt sich mit dem Ansehen des Vereins. Ein Klick auf ein Gebäude zeigt Stufe, Wirkung, Fixkosten und den nächsten Ausbau.`,
  },
  {
    id: 'youth-competitions',
    category: 'youth',
    title: 'Jugendwettbewerbe',
    keywords: ['jugendwettbewerbe', 'a-jugend', 'b-jugend', 'u19', 'u17', 'jugendmeister', 'junioren-bundesliga', 'nachwuchsliga', 'junioren-pokal', 'youth league', 'ddr', 'endrunde', 'verbandsliga', 'regionalliga', 'c-jugend', 'd-jugend', 'e-jugend', 'f-jugend', 'bambini', 'kreisliga', 'bezirksliga', 'spielfest', 'funino', 'kinderfußball'],
    body: `## Was gespielt wird
Unter **Jugend › Jugendwettbewerbe** laufen die Meisterschaften und Pokale des Nachwuchses – für alle Vereine, nicht nur für dich. Die Seite ist aufgebaut wie Statistiken › Liga: oben Saison und Wettbewerb, links Tabelle, Gruppen oder Endrunde (Turnierbaum oder Runden), rechts die Bestenlisten (Tore, Vorlagen, Scorer, Karten, Weiße Weste) und deine Lage. In der Auswahl stehen nur Wettbewerbe, die es in der gewählten Saison gibt und die schon Teilnehmer haben: Ligen und Spielklassen tauchen erst ab dem Jahr ihrer Einführung auf, eine Endrunde erst nach ihrer Auslosung.

## Formate nach Epoche
- **A-Jugend (U19):** bis 1995/96 Verbandsligen der Landesverbände, deren Meister (16 Plätze) spielen die **Endrunde** im K.-o.-System mit Hin- und Rückspiel, Endspiel in einem Spiel. 1996/97–2002/03 fünf **Regionalligen** (Nord, Nordost, West, Südwest, Süd) und eine Endrunde der letzten Acht. Ab 2003/04 **A-Junioren-Bundesliga** mit drei Staffeln à 14 (Nord/Nordost, West, Süd/Südwest); die drei Meister und der Zweite aus Süd/Südwest spielen das Halbfinale. Ab 2024/25 **DFB-Nachwuchsliga**: Vorrunde in regionalen Gruppen, Hauptrunde Liga A, Achtelfinale in einem Spiel.
- **B-Jugend (U17):** ab 1976/77 wie die A-Jugend; Regionalligen ab 2000/01, Bundesliga ab 2007/08, Nachwuchsliga ab 2024/25.
- **DFB-Junioren-Pokal (U19):** ab 1986/87 mit den Pokalsiegern der Landesverbände, ab 2017/18 mit 32 und ab 2025/26 mit 64 Teams. Ein Spiel, Verlängerung, Elfmeterschießen; Amateure haben Heimrecht.
- **DDR:** Junioren- bzw. Nachwuchsoberliga der 14 Oberligisten (Doppelrunde, ohne Auf- und Abstieg) bis 1990/91.
- **UEFA Youth League:** ab 2013/14 die Jugend der Champions-League-Vereine (Gruppen, dann K.-o., Final Four in Nyon); ab 2015/16 zusätzlich der Meisterweg mit dem deutschen A-Jugend-Meister des Vorjahres; ab 2024/25 Ligaphase mit 36 Teams.
In Regionalliga und Bundesliga steigen je Staffel drei Vereine ab; nachrücken die Vereine der Region mit der stärksten Jugend.

## C- bis G-Jugend: deine Staffel
Jede deiner Jugendmannschaften hat ihren eigenen Wettbewerb; in der Auswahl sind sie nach Jugend gruppiert (A-Jugend, B-Jugend, C-Jugend …). Simuliert wird nur die **Staffel, in der deine Mannschaft spielt** – Gegner sind Jugendteams von Vereinen aus deiner Region bzw. deinem Landesverband und Ortsvereine aus deinem Kreis.
- **C-Jugend (U15):** Verbandsliga deines Landesverbands (Bayern: Bezirksoberliga, ab 2005 Bayernliga), darunter die Landesliga. **C-Junioren-Regionalligen:** Nord ab 2004/05, Süd ab 2010/11 (als letzte der fünf), West, Nordost und Südwest im Spiel ab 2008/09. 11 gegen 11.
- **D-Jugend (U13):** Bezirksliga, darunter Kreisliga. 11 gegen 11, ab 2011/12 9 gegen 9 auf Kleinfeldtore.
- **E-Jugend (U11):** Kreisliga bzw. Kreisklasse, 7 gegen 7 – bis 2023/24.
- **F-Jugend (U9):** bis 1983/84 kein geregelter Spielbetrieb (Freundschaftsspiele, Turniere), ab 1984/85 Kreisstaffeln mit Tabelle, ab 2010/11 als Fair-Play-Liga ohne Schiedsrichter – bis 2023/24.
- **G-Jugend (Bambini, U7):** nie eine Meisterschaft, nur Spielfeste und Turniere.
- **Kinderfußball-Reform 2024/25:** Für G-, F- und E-Jugend gibt es verbindlich nur noch **Spielfeste** (2 gegen 2 bis 7 gegen 7 auf Minitore, viele Ballkontakte, alle spielen). Die Seite zeigt dann **keine Tabelle**, sondern die Termine der Spielfeste und wie oft deine Kinder dabei waren – Ergebnisse werden nicht festgehalten.
Je Altersklasse gibt es zwei Spielklassen: Wird deine Mannschaft in der unteren Erster, steigt sie auf; landet sie in der oberen auf einem Abstiegsplatz, steigt sie ab. Die Stärke deiner Mannschaft ist die deiner echten Spieler; die Gegner liegen je nach Ausbildungsqualität und Ruf darüber oder darunter – je jünger, desto größer der Abstand zwischen Nachwuchsleistungszentrum und Dorfverein. In E- und F-Jugend gibt es keine Karten.

## Wie gespielt wird
Jugendspiele sind sonntags (Europapokal mittwochs), mit Winterpause wie bei den Profis; alles ist vor dem Saisonende entschieden. Die Ergebnisse folgen der **Stärke der A- bzw. B-Jugend**: Bei dir zählt die beste Elf deiner echten Mannschaft (Jugend › Mannschaften). Bei anderen Vereinen ergibt sie sich aus Ausbildungsqualität und Ruf der Akademie (Jugend › Akademie) bzw. der Vereinsgröße; ihre bekannten Talente spielen mit, die übrigen Spieler werden erzeugt.

## Was es bringt
- Titel (und ein Endspiel) heben den **Ruf der Akademie** – und damit die Anziehungskraft im Wettbewerb um Talente.
- Siege geben deinen eingesetzten Jugendspielern einen kleinen **Entwicklungsschub**, ein Titel zusätzlich Moral.
- Meistertitel stehen in der **Vereins-Historie** (Vereinsprofil › Historie), auch Staffelsiege deiner C- bis F-Jugend; vergangene Saisons bleiben im Archiv (Tabellen, Runden, die besten Spieler je Kategorie).
- C- bis F-Jugend: Siege geben einen etwas kleineren Entwicklungsschub, Spielfeste einen ganz kleinen – plus etwas Moral für alle Kinder, die dabei sind.
- Jugend › Übersicht und Jugend › Mannschaften zeigen je Mannschaft Liga und Tabellenplatz.
Alte Spielstände starten sofort mit der laufenden Saison; bereits vergangene Spieltage werden beim Laden nachgespielt (auch für die C- bis G-Jugend, wenn ein Spielstand sie noch nicht kennt).`,
  },
  {
    id: 'youth-overview',
    category: 'youth',
    title: 'Jugendsystem — Überblick',
    keywords: ['jugend', 'nachwuchs', 'talente', 'akademie', 'jugendakademie', 'überblick'],
    body: `## Die Jugendakademie
Jeder Verein besitzt eine **Jugendakademie**. Ihre **Nachwuchs-Investitionen** (Bereich **Jugend → Akademie**, siehe Artikel
**Nachwuchs-Investitionen**) bestimmen, **wie viele** und **wie gute** Talente entstehen und **wie schnell** sie sich entwickeln.

Die Jugendakademie ist ein **eigenständiger Bildschirm** (Bereich **Jugend**, Symbol in der unteren Navigation).
Dort sind alle Talente **nach Altersklassen** (Jahrgängen) gruppiert — von der G-Jugend (Bambini) bis zur A-Jugend:
- Register/Filter für **Alle** sowie jede Altersklasse **G · F · E · D · C · B · A** mit Anzahl.
- Je Altersklasse eine eigene Tabelle mit Position, Alter, Gesamtstärke (OVR) und Attributen (farbcodiert).
- Das **geschätzte Potenzial** wird als **goldene Sterne-Spanne** angezeigt (nicht als exakter Wert!).
- Klick auf ein Talent öffnet die Detailansicht mit Altersklasse, allen Attributen und der Schaltfläche **Hochziehen in den Profikader**.

## Deutsche Altersklassen (Jahrgänge)
Nach dem deutschen Jugendfußball-System durchläuft jedes Talent die Altersklassen von der G-Jugend (Bambini) bis
zur A-Jugend. Die Klasse ergibt sich **direkt aus dem Alter**:

| Altersklasse | Alter | Bezeichnung |
|---|---|---|
| **G-Jugend (Bambini)** | bis 7 | U7 |
| **F-Jugend** | 8–9 | U9 |
| **E-Jugend** | 10–11 | U11 |
| **D-Jugend** | 12–13 | U13 |
| **C-Jugend** | 14–15 | U15 |
| **B-Jugend** | 16–17 | U17 |
| **A-Jugend** | 18–19 | U19 |

## Kernideen
- **Eintritt mit 7 Jahren:** Neue Talente kommen als **G-Jugend (Bambini)** mit **7 Jahren** in die Akademie.
- **Jährliches Aufrücken:** Zum **1. Juli** altern alle Talente um ein Jahr und rücken eine Altersklasse auf; ein neuer G-Jugend-Jahrgang kommt nach (siehe *Hochziehen & Nachwuchs-Rhythmus*).
- **Abgang am Ende der A-Jugend:** Mit ~19→20 Jahren verlassen die Talente die Akademie — die besten werden hochgezogen, der Rest verlässt den Verein.
- **Verstecktes Potenzial:** Das wahre Potenzial ist verborgen — die Scouts nennen nur eine Spanne, die bei jungen Jahrgängen besonders breit ist (siehe *Verstecktes Potenzial & Scouting*).
- **Echte Attribute & Entwicklung:** Talente haben vollwertige Attribute; sehr junge Jahrgänge sind spielerisch noch schwach, haben aber viel Entwicklungsspielraum (siehe *Talententwicklung*).
- **Getrennte Verwaltung:** Talente zählen NICHT zum 26er-Profikader, bis sie hochgezogen werden.

## Farbcodierung der Attribute
Wie im gesamten Spiel: <span>&gt; 75 grün</span>, 60–75 gelb, 45–59 orange, darunter rot. Potenzial-Sterne sind stets **golden**.`,
  },
  {
    id: 'youth-potential',
    category: 'youth',
    title: 'Verstecktes Potenzial & Scouting-Spanne',
    keywords: ['potenzial', 'scouting', 'sterne', 'spanne', 'verborgen', 'talent', 'einschätzung'],
    body: `## Warum eine Spanne statt eines Werts?
Das **wahre Potenzial** eines Talents (interne Potenzial-Sterne, 1.0–5.0) ist **verborgen**. In der Jugend-Liste und im
Detail siehst du stattdessen die **Scouting-Einschätzung** als **Sterne-Spanne** *min – max* (golden).

Beispiel: Ein Talent mit wahrem Potenzial **4.0** kann anfangs als **3.25 – 4.75** angezeigt werden. Erst mit der Zeit
verengt sich die Spanne auf den echten Wert.

## Anfangs-Unschärfe (alters- und akademieabhängig)
Die anfängliche Spanne hängt von der **Akademie-Stufe** UND vom **Alter** des Talents ab — bessere Akademien scouten
präziser, und je jünger das Talent, desto unsicherer die Einschätzung:
\`Unschärfe je Seite ≈ (1,5 − Akademie-Stufe × 0,12) × Alters-Faktor × Zufall(0,5–1,0) Sterne\`

Der **Alters-Faktor** verbreitert die Spanne für junge Jahrgänge deutlich:

| Alter (Altersklasse) | Alters-Faktor |
|---|---|
| ≤ 9 (G-/F-Jugend, Bambini) | ×2,20 |
| 10–11 (E-Jugend) | ×1,90 |
| 12–13 (D-Jugend) | ×1,55 |
| 14–15 (C-Jugend) | ×1,25 |
| 16–17 (B-Jugend) | ×1,05 |
| 18–19 (A-Jugend) | ×0,90 |

Ein 7-jähriges G-Jugend-Talent (Bambini) lässt sich also praktisch nicht einschätzen (sehr breite Spanne), während ein A-Jugend-Talent
schon recht konkret bewertet wird. Es gilt stets: \`min ≤ wahres Potenzial ≤ max\`. Die Grenzen liegen im 0,25-Raster.

## Annäherung an den wahren Wert
Bei jeder wöchentlichen Jugendentwicklung rückt die Spanne einen Raster-Schritt näher an das wahre Potenzial:
- **Standard:** je Woche **0,25 Sterne** enger (min steigt Richtung Wahrheit, max sinkt Richtung Wahrheit).
- **Akademie-Stufe 4–5:** gelegentlich **0,5 Sterne** pro Woche (schnellere Klärung).

Sobald \`min = max\`, steht das Potenzial faktisch fest. Beim **Hochziehen in den Profikader** wird das wahre Potenzial
endgültig offengelegt und als exakter Sterne-Wert im Kader angezeigt.

## Talent-Verteilung bei der Erzeugung
Grobe Wahrscheinlichkeiten (mit Akademie-Bonus leicht nach oben verschoben):
- ~6 % **Ausnahmetalent** (4,5–5,0 Sterne)
- ~24 % **hohes Talent** (3,75–4,5)
- ~40 % **solides Talent** (3,0–3,75)
- Rest **Durchschnitt** (2,0–3,0)

Das Potenzial liegt nie unter der aktuellen Gesamtstärke — jedes Talent hat Luft nach oben.`,
  },
  {
    id: 'youth-development',
    category: 'youth',
    title: 'Talententwicklung',
    keywords: ['entwicklung', 'training', 'wachstum', 'lernrate', 'akademie', 'attribute'],
    body: `## Startstärke je Alter
Die aktuelle Spielstärke eines Talents ist **stark altersabhängig**. Ein 7-jähriges G-Jugend-Talent (Bambini) ist spielerisch
noch sehr schwach, ein A-Jugend-Talent bereits deutlich weiter:
\`Grundstärke ≈ 8 + (Alter − 7) × 3,7 + Akademie-Qualitätsbonus × 0,55 (+ Streuung)\`

Das ergibt grob eine Grund-Gesamtstärke von ~8 (7 Jahre) bis ~52 (19 Jahre), begrenzt auf 6–70. Junge Talente
haben also eine **niedrige aktuelle Stärke**, aber oft **viel verstecktes Potenzial** und den größten Entwicklungsspielraum.

## Wöchentliches Wachstum
Talente entwickeln sich **jeden Sonntag** (wie die Profi-Wochenentwicklung). Pro Woche wird ein versteckter
**Attribut-Akkumulator** gefüllt; erreicht er für ein Attribut **1,0**, gibt es **+1 sichtbaren Punkt** (max. +1 pro Attribut/Woche).

Der wöchentliche Lernreiz je Attribut:
\`Zuwachs = Grundwert(0,26) × Altersfaktor × Kopffreiheit-Faktor × Akademie-Lernrate × Streuung\`

- **Altersfaktor:** ≤ 20 Jahre = 1,5 · 21–23 = 1,2 (jüngere Talente lernen am schnellsten).
- **Kopffreiheit-Faktor:** \`(Potenzial − aktuelle Stärke) / 20\`, begrenzt auf 0,1–1,0. Je größer der Abstand zum Potenzial, desto schneller.
- **Akademie-Lernrate** (academyGrowthFactor) je Stufe:

| Akademie-Stufe | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Lernrate ×    | 0,85 | 1,0 | 1,15 | 1,3 | 1,5 |

## Softcap durch das Potenzial
Erreicht die Gesamtstärke das aus dem wahren Potenzial abgeleitete Maximum (+2 Toleranz), stoppt das Wachstum —
weitere Fortschritte werden „gestaut". So bestimmt das (verborgene) Potenzial die Obergrenze jedes Talents.

## Gesamtstärke (OVR)
Jeder sichtbare Attribut-Punkt füllt zusätzlich einen OVR-Akkumulator (0,34 pro Punkt). Bei 1,0 steigt der OVR um 1.
Mit dem OVR steigt auch der Marktwert des Talents.

## Wo sehe ich Fortschritte?
Die aktuellen Werte stehen jederzeit im Bereich **Jugend**. Zusätzlich verengt sich mit jeder Entwicklungswoche die
Scouting-Spanne des Potenzials.`,
  },
  {
    id: 'youth-promotion-intake',
    category: 'youth',
    title: 'Hochziehen & Nachwuchs-Rhythmus',
    keywords: ['hochziehen', 'beförderung', 'profikader', 'promotion', 'jahrgang', 'intake', 'nachwuchs', 'juli'],
    body: `## Hochziehen in den Profikader
In der Detailansicht eines Talents (Bereich **Jugend**) gibt es die Schaltfläche **⬆ Hochziehen**:
- Das Talent wandert aus der Jugend in den **Profikader** (A-Mannschaft) und erhält eine freie Rückennummer.
- Das **verborgene Potenzial wird offengelegt** und fortan als exakter Sterne-Wert angezeigt.
- Ein hochgezogenes Talent trainiert danach ganz normal mit dem Wochen-Trainingsplan.
- Eine Nachricht des Akademieleiters bestätigt die Beförderung samt endgültigem Potenzial.

**Kadergröße beachten:** Der Profikader fasst maximal **26 Spieler**. Ist er voll, musst du zuerst einen Spieler abgeben,
bevor ein weiteres Talent hochgezogen werden kann (die Schaltfläche ist dann gesperrt).

## Jahrgangsabschluss am Ende der A-Jugend
Talente, die nach dem Aufrücken **20 Jahre** alt sind (die A-Jugend also beendet haben), verlassen die Jugendakademie:
- **Dein Verein:** Talente mit **≥ 3,0 Potenzial-Sternen** werden automatisch in den Profikader **hochgezogen**, solange
  ein Kaderplatz frei ist (max. 26). Alle übrigen **verlassen den Verein**.
- **CPU-Vereine:** ziehen 1–3 Talente hoch – Grundregel ab **3,5 Sternen**, gute Akademien (Ausbildung ≥ 55) und Trainer mit
  Jugend-Philosophie schon ab 3,25 bzw. 3,0 Sternen, Einkaufs-Trainer erst ab 3,75. Der Rest verlässt den Verein.
- Für deinen Verein fasst die Nachricht **„Jahrgangsabschluss der A-Jugend"** zusammen, wer hochgezogen wurde und wer gegangen ist.

## Nachwuchs-Rhythmus (neue Jahrgänge)
Jeweils zum **1. Juli** vollzieht jede Akademie den Jahreswechsel — in dieser Reihenfolge:
1. Alle bestehenden Talente **altern um ein Jahr** und rücken damit eine **Altersklasse auf** (G→F→E→D→C→B→A).
2. **Jahrgangsabschluss** (siehe oben): die A-Jugend-Absolventen (nun 20) werden hochgezogen oder verlassen den Verein.
3. Ein neuer **G-Jugend-Jahrgang (Bambini, 7 Jahre)** rückt nach — **1 bis 4 Kinder**, je nach Ausbildungsqualität,
   Plätzen und Jugendetat (siehe **Nachwuchs-Investitionen**). Ausbildung und Ruf heben außerdem Grundstärke und
   Potenzial der neuen Talente – bessere Akademien liefern mehr, stärkere und potenzialträchtigere Talente.
   Vorher (ebenfalls am 1. Juli) läuft der **Wettbewerb um Talente**: herausragende 12- bis 16-Jährige wählen ihren Verein.

4. Für deinen Verein erscheint die Nachricht **„Neuer G-Jugend-Jahrgang (Bambini) in der Jugendakademie"** mit der Liste der Neuzugänge.
5. **Nur dein Verein:** Die Jugendmannschaften werden auf volle Stärke gebracht – siehe Artikel **Volle Jugendmannschaften & Rekrutierung**.

## Startjahrgang (kompletter Altersaufbau)
Zu Spielbeginn (Saison 1975/76) besitzt jeder Verein einen **vollständigen Altersaufbau** von der G-Jugend (Bambini) bis
zur A-Jugend: für **jeden Jahrgang von 7 bis 19 Jahren** wird je nach Akademie-Stufe **ein Talent** (Stufe 1–3) bzw. **zwei
Talente** (Stufe 4–5) erzeugt. So besitzt jeder Verein von Beginn an eine glaubhaft besetzte Jugendabteilung über alle Altersklassen.

## Altstände & Migration
Ältere Spielstände werden beim Laden automatisch angepasst: fehlt die Jugend ganz, wird ein kompletter Altersaufbau
erzeugt; sind nur ältere Jahrgänge vorhanden, werden die **fehlenden jüngeren Jahrgänge (7–16 Jahre) nachgefüllt**. Die
Altersklasse selbst wird nicht gespeichert, sondern stets aus dem Alter abgeleitet — bestehende Talente ordnen sich damit
automatisch korrekt ein.`,
  },
  {
    id: 'chronicle-history-future',
    category: 'chronicle',
    title: 'Echte Geschichte bis 2026/27, danach fiktive Zukunft',
    keywords: ['geschichte', 'zukunft', 'fiktiv', 'pokalsieger', 'geisterspiele', 'heim-wm', 'tv-krise', 'gehaltsquote', 'meisterliga'],
    body: `## Bis 2026/27: angelehnt an die echte Geschichte
Neben Regeln (Rückpass, 3 Punkte, Wechsel) prägen echte Ereignisse das Spiel – mit Wirkung:
- **1985–1990:** Englische Vereine sind von den Europapokalen ausgeschlossen.
- **1988:** Privatfernsehen kauft die Liga, die TV-Gelder steigen stark.
- **1999/2000:** Der **Pokal der Pokalsieger** endet; Pokalsieger spielen im Europa-Pokal.
- **2002/03–2003/04:** Krise des TV-Marktes – spürbar weniger TV-Geld.
- **2006:** Heim-WM – die Grundauslastung aller Stadien steigt.
- **März 2020 bis Frühjahr 2022:** Geisterspiele, danach halbe Kapazität – die Spieltagseinnahmen brechen ein.
- Europapokal-Teilnahme: Maßgeblich ist immer die Tabelle der **1. Liga**.

## Ab 2027/28: eine glaubwürdige, erfundene Zukunft
Die Chronik markiert diese Ereignisse als **fiktive Zukunft**, z. B. halbautomatisches Abseits, der Streit um eine geschlossene Europaliga, eine **Gehaltsquote** als Lizenzauflage (ab 2034/35: höchstens 70 % des Umsatzes, sonst Verwarnung und Transfersperre), Klimaauflagen für Stadien und weltweite Streaming-Rechte.`,
  },
  {
    id: 'transfers-market',
    category: 'squad',
    title: 'Transfers: Ablösen, Verhandlungen & Versprechen',
    keywords: ['transfer', 'ablöse', 'rekord', 'verhandlung', 'forderung', 'berater', 'handgeld', 'versprechen', 'stammplatz', 'ausstiegsklausel', 'raten', 'weiterverkauf', 'ausland'],
    body: `## Die Rekordkurve
Ablösen folgen einer **Kurve der Spitzenablösen** je Jahr, recherchiert aus echten Rekordtransfers von 1975 bis heute (geglättet; ab 2027 fiktiv fortgeschrieben). Es gibt zwei Linien: **deutsche Vereine** (1976 etwa 1 Mio. DM, 2023 rund 95 Mio. €) und **international** (1975 etwa 3,6 Mio. €, 2017 Ausreißer 222 Mio. €).

- **Marktwert:** Ein Spieler mit Stärke 90 ist etwa die deutsche Spitzenablöse wert; schwächere entsprechend weniger, Stärkere höchstens das 1,3-Fache.
- **Weiche Obergrenze:** Bis 70 % der Kurve wirkt sie nicht, darüber werden Forderungen gestaucht. Bei Spitzengeschäften kann ein **Bieterwettstreit** die Kurve übertreffen – in Simulationen liegt die Saisonspitze im Schnitt bei etwa 95 % der Kurve, in rund jeder vierten Saison darüber.
- **Ausland:** Große Auslandsvereine bieten nach der internationalen Kurve – ein Star bringt dort deutlich mehr.

## Verhandeln mit dem Verein
Im Transfermarkt und in der Beobachtungsliste startest du mit **Verhandeln** ein Gespräch. Dein Sportdirektor schätzt die Forderung – je besser dein Scouting, desto enger und genauer die Spanne. Die **Schmerzgrenze** des Vereins bleibt verdeckt.

| Einfluss auf die Forderung | Wirkung |
| --- | --- |
| Vertrag ≥ 3 Jahre / 2 Jahre | +25 % / +10 % |
| Vertrag endet in ≤ 1 Jahr (ab Bosman) | −35 bis −55 % |
| Leistungsträger (Top 3) / Ergänzungsspieler | +30 % / −12 % |
| Verein in Geldnot, Spieler auf der Transferliste, Spieler will weg | jeweils günstiger |
| Du bist ein Rivale | +15 % |
| Verhandlungshärte des Vereins | −8 bis +17 % |
| Bester Spieler eines gleich großen Vereins | „unverkäuflich“: +50 % |

Dein Angebot besteht aus **Ablöse**, **Zahlung** (sofort, zwei Raten – der Verein bewertet sie mit 93 % – oder ab 1990 drei Raten, 89 %), **Weiterverkaufsbeteiligung** (0/10/20 %), **Erfolgsprämie** (fällig bei 20 Einsätzen) und optional einem **Spieler-Tausch**: Der Verkäufer rechnet deinen Spieler mit 50–85 % seines Marktwerts an – je nachdem, ob er auf dessen Position Bedarf hat –, und der Tauschspieler muss selbst wechseln wollen. Ab **2000** gibt es die **Leihe mit Kaufoption** (nur für Ergänzungsspieler oder Talente bis 21; der Verein bewertet die Option mit 60 %; am Saisonende entscheidest du, ob du sie ziehst), ab **2005** die **Rückkaufoption** für den Verkäufer (zwei Jahre, senkt den Preis etwas). Ist dein Verein **direkter Tabellennachbar**, verlangt der Verkäufer 8 % mehr. Der Verein antwortet mit einer Gegenforderung. Lächerliche Angebote kosten viel **Geduld**; ist sie aufgebraucht, endet das Gespräch. Liegt die Ablöse (bei Raten: die erste Rate) über deinem **Transferbudget**, gibt der Vorstand das Angebot nicht frei: Es wird **nicht abgeschickt**, der Grund steht im Verlauf und unter dem Knopf.

## Verhandeln mit dem Spieler
Danach überzeugst du den Spieler – was er will, hängt von seiner **Persönlichkeit** ab (Artikel „Spielerwünsche“). Sein **Berater** (bzw. er selbst) nennt eine überhöhte Forderung, das echte Mindestgehalt bleibt verdeckt. Du bietest **Gehalt** (pro Jahr oder pro Woche, je nach Einstellung), **Laufzeit**, **Handgeld** (zählt anteilig wie Gehalt, Geldgierige schätzen es mehr), **Beraterprovision** (fehlt sie, rät der Berater ab), **Treueprämie** (fällig bei Vertragsende, wenn er bleibt), **Erfolgsklausel** (+10/+20 % Gehalt bei einem Europapokal-Platz), ab **1996** eine **Ausstiegsklausel** (reizt Ehrgeizige und Abenteurer; zahlt ein Verein sie, wechselt der Spieler ohne Verhandlung) und **Versprechen**:

| Versprechen | Wird geprüft (Saisonende) |
| --- | --- |
| Stammplatz | mind. 60 % der Ligaspiele in der Startelf (Mahnung am 2. Januar) |
| Kapitänsbinde | Kapitän zum Saisonende |
| Europapokal / Um Titel spielen | Platz 1–5 / Platz 1–3 |
| Weitere Verstärkungen | mind. ein Zugang auf seinem Niveau |
| Einsätze zur Entwicklung (bis 21 J.) | mind. 15 Pflichtspiele |
| Freigabe bei Topangebot | du lehnst kein Angebot eines größeren Vereins ab |
| Umzug & Familie | sofort erfüllt, kostet einmalig etwas |
| Wunschposition | am Saisonende Startelf-Anteil ≥ 40 % und Einsatz in seinem Mannschaftsteil |
| Kein Verkauf an Rivalen | gilt die ganze Vertragslaufzeit; gebrochen, wenn du ihn an einen Rivalen verkaufst |

Was ihm wichtig ist, erfährst du im ersten Gespräch – mit gutem Scouting schon vorher (Wichtigkeit als Punkte neben jedem Versprechen). Mehr als drei Versprechen wirken unglaubwürdig.

**Glaubwürdigkeit** (Start 70): Gehaltene Versprechen +5, gebrochene −15 – der Spieler verliert stark an Zufriedenheit und Moral. Wenig loyale oder sehr ehrgeizige Spieler wollen danach weg und lehnen ein halbes Jahr lang Vertragsgespräche ab. Die **Kabine** bekommt es mit: alle Mitspieler −2 Zufriedenheit, wer selbst offene Versprechen hat −4.

## Abschluss
Im Transferfenster (Juli/August, Januar) wird sofort gewechselt, sonst zum nächsten Fenster. Ab Bosman kannst du Spieler, deren Vertrag in höchstens sechs Monaten endet, ohne Ablöse per **Vorvertrag** holen. Höchstens vier Verhandlungen laufen gleichzeitig; ohne neue Angebote schläft ein Gespräch nach 30 Tagen ein.

## Wenn andere bieten
Für deine Spieler bieten vor allem KI-Vereine, die auf seiner Position **Bedarf** haben und sich die Ablöse leisten können (Kaderplanung); für Stars melden sich auch einfach die Großen. Sie bieten nach ihrer verdeckten Höchstgrenze. Forderst du 25 % mehr, zahlen sie, wenn es in ihren Rahmen passt – sonst bessern sie oft bis zur Grenze nach oder springen ab.`,
  },
  {
    id: 'transfers-window',
    category: 'squad',
    title: 'Transferbilanz & Top-Transfers',
    keywords: ['transferbilanz', 'top-transfers', 'transferfenster', 'fensterschluss', 'gerüchteküche', 'trainerkarussell', 'vertragsverlängerung', 'transfer des fensters', 'leihe', 'ablösefrei'],
    body: `## Wann erscheint sie?
Am **Tag nach jedem Fensterschluss** (Sommer: 31. August, Winter: 31. Januar) hält das Spiel an. Zuerst kommt die Zeitungsseite **Top-Transfers**: die zehn stärksten Neuzugänge der Vereine **deiner Liga**, die drei besten auf dem Podest. Mit **OK** geht es zur **Transferbilanz**. Abschalten kannst du beides mit „Diesen Bildschirm nicht wieder anzeigen“ oder in den Einstellungen; nachträglich öffnest du sie jederzeit im **Transfermarkt** über „Transferbilanz“ (mit Auswahl des Fensters).

## Was zählt zu einem Fenster?
Alle Wechsel seit dem letzten Fensterschluss – auch die außerhalb der Fristen, etwa Spieler mit Vertragsende am 1. Juli, Vorverträge, Leih-Rückkehrer oder Verkäufe ins Ausland. Gezählt werden die Vereine mit vollem Kader, die Unterklasse und das Ausland, soweit sie beteiligt sind.

## Aufbau
- **Links:** deine Liga und der **Transfer des Fensters** – der teuerste Wechsel (ohne Ablöse: der stärkste Neuzugang) mit Potenzial-Einschätzung deiner Scouts, Positionen, Ablöse und Vertragsende.
- **Reiter Transfers:** alle Wechsel, sortierbar nach jeder Spalte. Rechts filterst du nach national/international, Mannschaftsteil, Mindest-Ablöse und Mindeststärke. „Verein auswählen“ zeigt nur einen Verein.
- **Verträge:** Verlängerungen der Vereine (im Sommer nach dem Vertragsende, dazu deine eigenen).
- **Gerüchteküche:** gute Spieler der Liga mit auslaufendem Vertrag, auf der Transferliste oder unzufrieden – und welcher Verein angeblich interessiert ist. Nur Gerede.
- **Trainerkarussell:** Entlassungen, Rücktritte, Nachfolger und Trainer, die zum Fensterschluss wackeln.

Namen öffnen das Spielerprofil, Wappen und Vereinsnamen das Vereinsprofil. Dein Verein ist hervorgehoben.

## Speicher
Das Spiel merkt sich die letzten acht Fenster; die beiden neuesten vollständig, ältere mit den 60 bedeutendsten Wechseln. Bei älteren Spielständen wird das laufende Fenster aus den Spielerverläufen nachgebaut – Spieler, die das Spiel schon verlassen haben, fehlen dort.`,
  },
  {
    id: 'transfers-search',
    category: 'squad',
    title: 'Spieler suchen',
    keywords: ['spielersuche', 'suche', 'filter', 'transfermarkt', 'suchprofil', 'realistische transfers', 'eingespieltheit', 'herkunft', 'heimatregion', 'fähigkeiten'],
    body: `## So funktioniert es
Im **Transfermarkt** öffnet „Spieler suchen“ ein großes Suchfenster. Durchsucht werden **alle Spieler** der Vereine mit vollem Kader (nicht nur die abgabebereiten). Das Ergebnis erscheint in der Liste des Transfermarkts; „Suche aufheben“ zeigt wieder die abgabebereiten Spieler.

## Vorgaben
- **Allgemein:** Name, Nationalität, Alter, Stärke, **Potenzial** (nur als Spanne deiner Scouts – ein Spieler passt, wenn sich die Spanne mit deinem Bereich überschneidet), Form, Erfahrung, starker Fuß, Mindestgröße, „Darf nicht verletzt sein“.
- **Position:** Position oder ganzer Mannschaftsteil, Seite (links/zentral/rechts), „Nur beste Position“ (nur die Stammposition; sonst zählen Nebenpositionen und Spieler, die die Position fast so gut spielen).
- **Herkunft:** bis zu drei Heimatregionen bzw. Länder („oder“).
- **Fähigkeiten:** bis zu vier Attribute mit Mindestwert – dieselben Werte, die das Spielerprofil zeigt.
- **Eingespieltheit:** Positionsvertrautheit (0–100) auf einer Position.
- **Finanzen:** Marktwert und Gehalt (von/bis), Vertragsstatus (läuft in zwölf Monaten aus / langfristig gebunden), Transferstatus (Transferliste / abgabebereit). Ab **1996** gibt es Ausstiegsklauseln, ab **2005** Rückkaufoptionen – erst dann erscheinen die Häkchen.
- **Nur realistische Transfers:** nur Spieler, die nach ihren Wünschen grundsätzlich zu dir wechseln würden (siehe „Spielerwünsche“). Ob ihr Verein verkauft, steht auf einem anderen Blatt.
- **Suchgebiet:** alle Vereine, deine Liga oder Amateure/Unterklasse. Ausländische Vereine führt das Spiel ohne Kader.

Suchen kannst du benennen und speichern; sie liegen im Browser und gelten für alle Spielstände.`,
  },
  {
    id: 'transfers-wishes',
    category: 'squad',
    title: 'Spielerwünsche: Persönlichkeit, Wunschverein, Gehalt',
    keywords: ['persönlichkeit', 'charakter', 'wünsche', 'ehrgeiz', 'loyalität', 'geld', 'heimat', 'abenteuer', 'rampenlicht', 'familie', 'karrierephase', 'berater', 'provision', 'handgeld', 'verzicht', 'rivale', 'wunschverein', 'interesse'],
    body: `## Persönlichkeit
Jeder Spieler hat sieben verdeckte Charakterzüge (0–100): **Ehrgeiz**, **Loyalität**, **Geld** (Geldgier), **Heimatverbundenheit**, **Abenteuerlust**, **Rampenlicht** und **Familie** (wiegt mit dem Alter schwerer). Dazu kommen **Heimat** (Region seines Herkunftsvereins), **Jugendverein** und die **Karrierephase**:

| Phase | Alter | Was zählt |
| --- | --- | --- |
| Talent / Durchbruch | bis 24 | Spielzeit, Entwicklung; nimmt weniger Gehalt |
| Leistungshöhepunkt | 25–29 | Titel, Europapokal, großer Verein |
| Spätphase | 30–32 | der letzte große Vertrag: mehr Gehalt, längere Laufzeit |
| Ausklang | ab 33 | Ruhe, Familie, Nähe zur Heimat; Größe zählt kaum noch |

Im Spielerprofil zeigt der Reiter **Wünsche** Charakter, Wünsche und das Interesse an deinem Verein – bei fremden Spielern nur als Spanne, deren Genauigkeit von deinem Scouting und dem Verlauf der Gespräche abhängt.

## Wohin will er?
Der Reiz eines Vereins setzt sich aus Punkten zusammen (50 = neutral):
- **Größe** gegenüber seinem jetzigen Verein und gegenüber seiner Klasse – ein Star geht ungern zu einem Verein unter seinem Niveau (je ehrgeiziger, desto weniger).
- **Stammplatz-Chance**: wie viele Spieler seiner Positionsgruppe besser sind. Talente gewichten das am stärksten.
- **Europapokal**, **Trainer-Ansehen**, **tiefere Liga** (stark negativ).
- **Heimat**: Heimkehr zum Jugendverein, Rückkehr in die Region, Abschied aus der Heimat; **Ausland** reizt Abenteurer und schreckt Familienmenschen.
- **Große Bühne** (Großstadt, Spitzenverein) für Spieler mit viel Rampenlicht.
- **Bindung** an den jetzigen Verein (Loyalität × Jahre) und **Unzufriedenheit**.
- **Rivale**: Ein Wechsel zum Erzrivalen seines Vereins kostet viel; sehr loyale Spieler mit langer Bindung (oder Jugendverein) wechseln **nie** dorthin.

Die Interesse-Ampel: „Will unbedingt zu euch“, „offen“, „zögerlich“, „kein Interesse“. Ohne Interesse hilft höchstens sehr viel Geld – und nur bei Geldgierigen.

## Gehalt und Verzicht
Grundlage ist das **Marktgehalt** (Stärke, Liga-Niveau), dazu Karrierephase, Geldgier und die Größe des Vereins (große Vereine zahlen mehr). Wer wechselt, will mindestens 6 % mehr als bisher. Reizt ihn der Verein, **verzichtet** er auf bis zu 30 %; reizt er ihn nicht, verlangt er bis zu 35 % **Aufschlag** – Geldgierige verzichten kaum.

- **Bosman (ab 1996):** Ablösefreie Spieler verlangen 10 % mehr Gehalt und ein hohes **Handgeld** (8–25 Wochengehälter) – die gesparte Ablöse landet beim Spieler.
- **Berater:** In den 70ern verhandeln die meisten selbst. In Deutschland war Arbeitsvermittlung bis 1994 Sache der Bundesanstalt für Arbeit; die FIFA regelt Spielervermittler ab 1994; nach Bosman hat fast jeder Profi einen Berater. Die übliche Provision (5–10 % des Gehalts über die Laufzeit) zahlt der Verein einmalig.

## Die KI hält sich an dieselben Regeln
KI-Vereine kaufen nur Spieler, die auch wollen. Deshalb sammeln sich die Stars bei den großen Vereinen: Die angesehensten Vereine holen im Sommer gezielt die Leistungsträger kleinerer Vereine, die Kleinen kassieren Ablöse und kaufen günstiger nach. Spieler ohne Vertrag suchen sich ihren Wunschverein unter den Vereinen, die sie brauchen; ehrgeizige Leistungsträger kleiner Vereine verlängern seltener. Von außen (Ausland, untere Ligen) bekommt ein Verein nur Spieler, die zu seinem Ansehen passen.`,
  },
  {
    id: 'squad-contracts',
    category: 'squad',
    title: 'Verträge, Bosman & Kabine',
    keywords: ['vertrag', 'verlängerung', 'bosman', 'ablösefrei', 'vorvertrag', 'angebot', 'zufriedenheit', 'gehaltsgefüge', 'spielzeit'],
    body: `## Verlängern
Verhandelt wird im Spielerprofil (Reiter **Vertrag**), frühestens 30 Monate vor Vertragsende. Der Spieler nennt **Haltung**, **Forderung** und **Wunschlaufzeit**:

| Einfluss | Wirkung auf die Forderung |
| --- | --- |
| Marktgehalt | Grundlage (Stärke) |
| Stellenwert im Kader | Leistungsträger bis +30 %, Ergänzungsspieler bis −12 % |
| Alter | ab 31 J. und bis 21 J. etwa −10 % |
| Zufriedenheit | unter 40: +18 %, über 75: −4 % |
| Ehrgeiz | ± bis 12 % |
| Bosman (ab 1996) | im letzten Vertragsjahr +10 % |

Ob er überhaupt will, hängt von Zufriedenheit, Moral, Ehrgeiz, **Loyalität** und dem **Ansehen deines Vereins im Verhältnis zu seiner Stärke** ab („gern“, „offen“, „zögerlich“, „ablehnend“). Geldgierige fordern bis zu 17 % mehr, Loyale etwas weniger. Knapp unter der Forderung entscheidet ein kleiner Zufall. Nach drei gescheiterten Angeboten bricht er die Gespräche für zwei Monate ab. Der Vorstand gibt keine Erhöhung frei, wenn die Gehälter danach über 115 % des Gehaltsrahmens lägen.

## Vertragsende und Bosman
Wer am 30. Juni ohne neuen Vertrag ist, wechselt zum 1. Juli:
- **bis Sommer 1995:** gegen eine Ablöse (60 % des Marktwerts) – so war es vor dem Bosman-Urteil.
- **ab Sommer 1996:** **ablösefrei**. Zusätzlich können andere Vereine ab dem 15. Januar **Vorverträge** mit deinen auslaufenden Leistungsträgern schließen – dann ist er weg, außer du verkaufst ihn im Winter.

Der Sportdirektor erinnert dich am 2. Januar und am 1. April an alle Verträge, die im Sommer enden.

## Angebote der Konkurrenz
In den Transferfenstern (Juli, August, Januar) bieten größere Vereine für deine besten Spieler – umso eher, je stärker der Spieler im Vergleich zu deinem Verein ist und je unzufriedener er ist. Du kannst **annehmen**, **ablehnen** oder **25 % mehr fordern** (die Hälfte der Vereine springt dann ab). Lehnst du ab, obwohl der Spieler wechseln wollte, sinken Zufriedenheit und Moral. Ohne Antwort gilt das Angebot nach fünf Tagen als abgelehnt.

## Kabinenfrieden
Monatlich verschiebt sich die **Zufriedenheit**:
- **Gehaltsgefüge:** Verdient ein schwächerer Mitspieler über 35 % mehr, kostet das bis zu 4 Punkte im Monat.
- **Spielzeit:** Stammkräfte (Top 11, ab 21 J.) ohne Einsätze verlieren 4–5 Punkte im Monat; regelmäßige Einsätze bringen Punkte zurück.
- Ohne Anlass kehrt die Zufriedenheit langsam zur Mitte (60) zurück.

Unzufriedene Spieler fordern mehr, verlängern ungern, sinken in der Moral und ziehen Angebote anderer Vereine an.`,
  },
  {
    id: 'chronicle-briefing',
    category: 'chronicle',
    title: 'Saison-Briefing',
    keywords: ['briefing', 'saisonbriefing', 'damals', 'heute', 'neu im spiel', 'gesellschaft', 'saisonwechsel', 'ausgangslage', 'archiv', 'auftakt', 'animation', 'aufgaben', 'tipps', 'epoche'],
    body: `## Wann es erscheint
Zu **Spielbeginn** und nach jedem **Saisonwechsel** öffnet sich automatisch das Saison-Briefing als großes Fenster über der ganzen Spielfläche (wie der Textmodus). Solange es offen ist, steht die Zeit. „Los geht’s“ bzw. „Saison starten“ schließt es. Abschalten kannst du das unter **Einstellungen → Saison-Briefing automatisch anzeigen**; das Briefing liegt trotzdem als Nachricht im Posteingang. Beim Laden eines Spielstands öffnet es sich nicht.

## Auftakt
Vor dem Briefing läuft ein kurzer Auftakt (etwa 6 Sekunden): Mittelkreis und Mittellinie zeichnen sich, die Saisonzahl rollt ein, dann folgen Schlagzeile der Saison, Epoche, dein Wappen, Liga und Saisonziel. Der Bernstein-Bogen um den Mittelkreis zeigt, wie lange der Auftakt noch läuft. Die Anmutung wechselt mit der Zeit – bis Mitte der Achtziger als Fallblatt-Anzeigetafel mit Fernsehzeilen, später Video-, Neunziger- und digitale Optik. **Klick, Leertaste, Enter oder Esc** überspringen. Abschalten: **Einstellungen → Auftakt-Animation vor dem Saison-Briefing zeigen**; bei „Bewegung reduzieren“ im Betriebssystem entfällt er automatisch.

## Aufbau
- **Überblick:** die 3–5 wichtigsten Punkte und **deine Ausgangslage** (Saisonziel des Vorstands, Liga, Kaderstärke im Ligavergleich, Vertrauen, Kontostand, Transferbudget, Kader-Eckdaten).
- **Deine Aufgaben** (Überblick und Reiter **Aufgaben & Tipps**): aus deinem Spielstand abgeleitete Empfehlungen, sortiert nach **Dringend**, **Wichtig** und **Tipp** – mit Knopf, der direkt zur passenden Seite springt. Erkannt werden: weniger als zwei Torhüter, zu kleiner oder aufgeblähter Kader, dünn besetzte Mannschaftsteile, abgelaufene und auslaufende Verträge deiner wichtigsten 14 Spieler (ab Bosman dringend, weil sie ablösefrei gehen), ungenutztes Transferbudget (mit dem schwächsten Mannschaftsteil), ein Saisonziel deutlich über der Kaderstärke (oder darunter), geringes Vertrauen des Vorstands, noch nicht gebuchte Trainingslager im Sommer und Winter, fehlende NLZ-Bausteine (ab drei Jahre vor der Pflicht), Talente ab 17 mit hohem Potenzial oder schwache Nachwuchsarbeit, Konto im Minus, Punktabzug, knappe Reserve für Kreditraten, fehlender oder auslaufender Trikotsponsor, unbesetzte Bandenwerbung und neu freigeschaltete Bauten in Umfeld, Einrichtungen und Akademie. Die Aufgaben werden bei jedem Öffnen neu berechnet – Erledigtes verschwindet. Im Archiv früherer Saisons gibt es keine Aufgaben.
- **Typisch für diese Spielzeit:** Trainer-Tipps je Epoche (z. B. 1975 Libero und Manndeckung, Zuschauer als Haupteinnahme, Trikotsponsor; ab 1995 Bosman, Drei-Punkte-Regel, drei Wechsel; ab 2000 Viererkette, NLZ-Pflicht, Euro und Fernsehkrise; ab 2011 Finanzielles Fairplay und Gegenpressing) – jeweils mit dem, was es im Spiel für dich heißt.
- **Fußball** und **Gesellschaft:** was sich in dieser Saison im Fußball ändert und was das Land bewegt – Politik, Alltag, Kultur.
- **Damals & heute:** In der ersten Saison alle Unterschiede zum heutigen Fußball (2025/26), nach Thema geordnet. Danach nur die Wechsel: was **ab jetzt wie heute** ist, was **neu anders** wird, was **zum letzten Mal** gilt – der Rest aufklappbar unter „Noch anders als heute“.
- **Neu im Spiel:** automatisch aus den Spielregeln abgeleitet – Chronik-Meilensteine (z. B. 1995/96 drei Punkte pro Sieg), Ligareformen, neue Trainingslager-Ziele, Beginn und Ende von Hallenturnieren und Hallen-Masters, neue Nachwuchs-Bausteine und die NLZ-Pflicht, neue Bauten und Lizenzauflagen im Stadionumfeld, neue Einrichtungen und die Umstellung von D-Mark auf Euro (1. Januar 2002).

## Archiv
Unter **Zentrale → Briefing** findest du die Briefings aller Saisons dieses Spiels; „Briefing öffnen“ zeigt dasselbe Fenster ohne Auftakt. Alte Spielstände führen das Archiv ab der Saison, in der sie zuerst geladen werden.

## Vorschau und Chronik
Am **2. Januar** kündigt der Verband an, was ab der nächsten Saison gilt. Die Einzelmeldungen der Chronik zum Saisonstart sind im Briefing zusammengefasst; alle Meilensteine stehen weiter in der **Chronik des deutschen Fußballs** (unten rechts in der Fußleiste).`,
  },
  {
    id: 'chronicle-hall-of-fame',
    category: 'chronicle',
    title: 'Ruhmeshalle & Spieler-Archiv',
    keywords: ['ruhmeshalle', 'archiv', 'karriereende', 'rekorde', 'vereinslegende'],
    body: `## Was nach dem Karriereende bleibt
Beendet ein Spieler seine Karriere, wird er aus dem Spielstand entfernt. Bemerkenswerte Karrieren bleiben als **Eckdaten** im Archiv: Name, Position, Geburts- und Abschiedsjahr, Spitzenstärke, Einsätze, Tore und die letzten Stationen. So bleiben Spielstände auch nach 50 Jahren klein.

Archiviert werden:
- alle Spieler, die zuletzt bei **deinem Verein** waren,
- Karrieren mit **Spitzenstärke ab 78** oder **250 Einsätzen**,

Höchstens 4000 Einträge; darüber fallen zuerst die unauffälligsten fremden Karrieren heraus.

## Ruhmeshalle
Unter **Verein → Ruhmeshalle** siehst du die größten Karrieren, deine Vereinslegenden (nach Einsätzen), die Rekordhalter und die Weltklassespieler (Spitze 85+) im Ruhestand.`,
  },
  {
    id: 'development-talent',
    category: 'development',
    title: 'Talente & Spielerkurven',
    keywords: ['talent', 'jahrhunderttalent', 'ausnahmetalent', 'frühreif', 'spätentwickler', 'frühstarter', 'höhepunkt', 'karriere', 'weltklasse', 'potenzial'],
    body: `## Jeder Spieler folgt denselben Regeln
Es gibt keine fest geplanten Stars: Die Startkader sind in jedem Spiel gleich, wer daraus und aus den Akademien zum Star wird, würfelt jedes Spiel neu aus. Jeder Spieler – ob aus deiner Akademie, einem anderen Verein oder dem Ausland – entwickelt sich nach denselben Regeln: **Talent** (verdecktes Potenzial), **Training**, **Spielpraxis**, **Charakter**, **Umfeld** und etwas Glück.

## Typische Kurven
- **Normalprofi:** Stammspieler mit 22–23, Höhepunkt mit 26–29 um 73, ab 31 spürbarer Abbau.
- **Bundesliga-Topspieler:** oft früh im Profikader, aber erst mit 26–29 auf der Höhe (um 80–83), manchmal Nationalspieler erst mit 28.
- **Weltstar:** Durchbruch mit 20–21, Weltklasse (85+) ab etwa 23, Plateau bis 30 um 88.
- **Jahrhunderttalent:** mit 17 im Profikader, mit 19–21 schon Weltklasse, danach acht bis zehn Jahre über 93. So etwas gibt es in der ganzen Fußballwelt nur alle 10–20 Jahre – in der Bundesliga noch seltener.

## Was die Kurve formt
- **Potenzial:** Die meisten Talente reichen für die 2. Liga oder einen Platz im Kader eines Erstligisten. Nur etwa 1–2 von 100 Akademie-Talenten haben Weltklasse-Potenzial (85+), und davon wieder nur ein kleiner Teil 93 oder mehr. Bessere Nachwuchsarbeit erhöht die Chance etwas.
- **Frühreife (verdeckt):** Frühreife Spieler wachsen bis 20 deutlich schneller und sind mit 16–19 schon weiter; Spätentwickler holen zwischen 23 und 27 auf. Große Talente zeigen sich meist früh.
- **Langlebigkeit (verdeckt):** verschiebt den Abbau um bis zu anderthalb Jahre. Gutes Training und Professionalität bremsen ihn zusätzlich.
- **Spielpraxis:** Ein junges Talent ohne Einsätze entfaltet sein Potenzial nicht ganz – mit viel Spielzeit manchmal mehr als erwartet.
- **Verletzungen:** Schwere Verletzungen in jungen Jahren kosten Entfaltung.

## Frühstarter
Zum 1. Juli ziehen die Vereine Jugendspieler von 16 bis 19 hoch, die schon auf dem Niveau ihrer Profimannschaft spielen. Das sind nur sehr wenige. Spielt ein solches Talent in **deiner** Jugend, meldet sich der Leiter der Jugendakademie – hochziehen musst du es selbst. Ausnahmetalente schickt beim Jahrgangsabschluss niemand fort; notfalls wird der Kader kurz größer.

## Ältere Spielstände
Früher gab es fiktive „Legenden“ mit festen Jahrgängen. Dieses System ist entfernt: Spieler, die in einem alten Spielstand Legenden waren, bleiben ganz normale Spieler mit ihrem bisherigen Können und Potenzial.`,
  },
  {
    id: 'stadium-blocks',
    category: 'environment',
    title: 'Stadion: Blöcke, Ränge und Dächer',
    keywords: ['stadion', 'block', 'tribüne', 'haupttribüne', 'gegengerade', 'kurve', 'ecke', 'nordtribüne', 'südtribüne', 'schüssel', 'rang', 'oberrang', 'sitzplätze', 'stehplätze', 'dach', 'vip', 'logen', 'lounge', 'anzeigetafel', 'videowand', 'umbau', 'all-seater'],
    body: `## 14 Blöcke
Unter **Verein → Stadion** siehst du dein leeres Stadion von schräg oben, über der Haupttribüne. Es besteht aus **14 Blöcken**:
- **Haupttribüne** (West) und **Gegengerade** (Ost) mit je drei Blöcken: Nord, Mitte, Süd.
- **Nord- und Südtribüne** hinter den Toren mit je zwei Blöcken: West und Ost.
- **Vier Kurven** in den Ecken (Nordwest, Nordost, Südwest, Südost), gebogen um die Eckfahne. Sie schließen das Stadion zur Schüssel.

Gezeichnet werden Stufen, Sitzreihen in Vereinsfarben, Wellenbrecher, Mundlöcher, Dächer, Logen und das Flutlicht der jeweiligen Epoche. Das Dach der Haupttribüne ist durchscheinend, damit das Spielfeld sichtbar bleibt. Der Bildausschnitt ist fest auf das größtmögliche Stadion ausgelegt: Beim Ausbau wachsen nur die Tribünen. Klick auf einen Block öffnet das **Bau-Popover** am Rand, die Szene zeigt den geplanten Block als Vorschau (gestrichelter Umriss), dazu Kapazität, erwartete Zuschauer und Eintritt vorher → nachher. Rund ums Stadion stehen **Würstchenbuden, Fanshop, Megastore, Kassen, Parkplatz, ÖPNV-Haltestelle, Hospitality, Vereinsheim, Fan-Zone und Museum** – anklicken und direkt ausbauen (dieselben Regeln wie auf dem Vereinsgelände). Die Leiste unten filtert, was anklickbar ist (Tribünen, Gastronomie, Handel, Anreise, Hospitality); die **Kassen** bzw. „Tickets & Nachfrage“ öffnen Preise und geschätzte Nachfrage je Platzkategorie.

Ältere Spielstände mit vier Blöcken werden beim Laden umgewandelt: Die Kurven übernehmen den Aufbau der Hintertor-Tribünen, Kapazität, Logen und VIP-Bereich bleiben erhalten.

## Was du planst
- **Ränge:** bis zu drei (Unter-, Mittel-, Oberrang), je 3–36 Reihen. Ein neuer Rang kostet 30 % Aufschlag, Abriss 15 DM je Platz. Baukosten je Platz (1975): Stehplatz 35 DM, Holzbank 65, Schalensitz 120, Komfortsitz 210, Business-Seat 550; Teildach 22, volles Dach 55 DM; VIP-Tribüne 125.000, Loge 55.000 DM.
- **Platzart je Rang:** Stehplätze (fassen doppelt so viele Menschen wie Sitze), Holzbänke (bis 1999) und Schalensitze (offen oder überdacht je nach Dach), Komfortsitze als **Premium** (ab 1988), Business-Seats (ab 1992, nur auf Haupttribüne und Gegengerade, höchstens ein Business-Rang je Block, wenig Platz). Jede Platzart wird als eigene **Platzkategorie** mit eigenem Preis und eigener Nachfrage verkauft (siehe *Platzkategorien, Ticketpreise und Nachfrage*).
- **Dach:** keins, Teildach oder volles Dach. Überdachte Plätze locken bei Regen bis zu 7 % mehr Zuschauer an, im Winter 3,5 %. Ein neues Dach hebt die Fan-Stimmung um 2 Punkte.
- **VIP-Bereich** (ab 1980, nicht in den Kurven): Business-Club mit rund 200 Business-Seats (Gerade). **Logen** (ab 1985; je Block: Haupttribüne Mitte bis 6, sonst auf den Geraden bis 3 bzw. 4 in der Gegengerade Mitte, hinter dem Tor bis 2, Kurven bis 1) brauchen einen zweiten Rang oder ein volles Dach. Logen werden je Heimspiel vermietet – so viele, wie der Hospitality-Markt des Vereins hergibt.
- **Anzeigetafel** hinter dem Tor oder in einer Kurve, ab 1994 als Videowand.

## Bauen
Jeder Umbau ist ein Bauprojekt: 2–18 Monate Bauzeit, in der die Hälfte des Blocks gesperrt ist. Die Kosten sind ein Preisschild in 1975-Basis × Wirtschaftsskala. Du zahlst bar oder per Kredit über 10, 15 oder 20 Jahre; die Bank lehnt ab, wenn alle Raten zusammen mehr als 12 % des Jahresumsatzes kosten. Es läuft immer nur ein Umbau, der aber eine ganze Seite umfassen kann: Mit **„Ganze Haupttribüne“** (bzw. Gegengerade, Nord-, Südtribüne oder **„Alle 4 Kurven“**) gelten Ränge und Dach für alle Blöcke der Seite. Gemeinsam gebaut ist es 5 % günstiger; die Bauzeit ist die des längsten Blocks plus ein Monat je weiterem Block (höchstens 24 Monate). Mehr als 90.000 Plätze genehmigt die Stadt nicht.

## Fans
Werden Stehplätze zu Sitzplätzen, murren die Fans: bis zu 12 Punkte Stimmung, bei Traditionsvereinen (Tradition ab 70) und in der Ultra-Zeit (2005–2014) anderthalbmal so viel. Neue Stehplätze ab 2005 freuen die Kurve ein wenig.

## Europapokal
Ab 1998 sind im Europapokal nur Sitzplätze erlaubt: Bei Europapokal-Heimspielen werden deine Stehränge mit Klappsitzen bestuhlt und fassen dann nur die Hälfte. Wer oft international spielt, baut deshalb früher auf Sitzplätze um.

## Gegner
KI-Vereine bauen weiter vereinfacht aus (Kapazität wächst mit Überschüssen) und stellen ihren Platzmix je Saison um; Blöcke hat nur dein eigener Verein.`,
  },
  {
    id: 'club-business',
    category: 'environment',
    title: 'Stadionbau, Kredite, Namensrechte, Investoren und Überschuldung',
    keywords: ['stadion', 'ausbau', 'kredit', 'zins', 'logen', 'vip', 'namensrechte', 'arena', 'ausgliederung', 'kapitalgesellschaft', 'investor', '50+1', 'dividende', 'punktabzug', 'zwangsabstieg', 'überschuldung', 'vorstand'],
    body: `## Stadionausbau als Bauprojekt
Dein eigenes Stadion baust du Block für Block um (siehe *Stadion: Blöcke, Ränge und Dächer*). Die folgenden Regeln gelten für den alten Ausbau in Stufen (+6.000 Plätze), der in älteren Spielständen noch zu Ende läuft:
- **Bauzeit:** Stufe 2–3 eine Saison, Stufe 4 zwei, Stufe 5 drei Spielzeiten. Fertig wird immer zum 1. Juli.
- **Während des Baus** sind rund 8 % der Plätze gesperrt.
- **Kosten:** Preisschild in 1975-Basis × Wirtschaftsskala; ab 2004 (Arenen) ×1,1.
- **Finanzierung:** bar oder per Kredit über 10, 15 oder 20 Jahre. Die Monatsrate (Annuität: Zins + Tilgung) wird jeden Monat gebucht. Die Bank lehnt ab, wenn alle Kreditraten zusammen mehr als 12 % des Jahresumsatzes kosten würden.
- **Zinsen je Epoche:** etwa 8,5 % (1975), 10,5 % (1981), 6 % (1998), 2–3 % (2016–2021), danach wieder rund 4,5 %. Wer im Minus steht, zahlt 1,5 Prozentpunkte Aufschlag.

## Logen
Ab 1985 bringt jeder Ausbauschritt Logen mit (8 bis 1992, 16 bis 2003, danach 28). Logen sind eine eigene Platzkategorie mit Preis und begrenzter Nachfrage (siehe *Platzkategorien, Ticketpreise und Nachfrage*).

## Namensrechte (ab 2000)
Unter **Verein → Vorstand** liegen drei Angebote fiktiver Firmen (3, 5 oder 8 Jahre). Der Jahreswert richtet sich nach Kapazität und Ansehen und wächst mit Vermarktungs-Skala und Marke; er wird monatlich gebucht. Traditionsvereine zahlen mit Fan-Stimmung (je nach Tradition und Leitbild 2–15 Punkte). Läuft der Vertrag aus, heißt das Stadion wieder wie früher; im letzten Vertragsjahr bietet der Partner eine Verlängerung (+10 %).

## Ausgliederung und Investor (ab 1998)
- **Ausgliederung** des Profibereichs bringt einmalig Kapital (12 % des Jahresumsatzes) und +8 Vorstandsvertrauen. Die Saisonziele fallen danach eine Stufe ehrgeiziger aus. Je nach Leitbild murren die Fans (bis −8, Traditionsvereine −3 zusätzlich).
- **Investor:** Danach kannst du Anteile verkaufen (10, 15 oder 24 %), höchstens 49 % wegen der **50+1-Regel**. Preis ≈ 6 % des Umsatzes je Prozentpunkt × Marke. Ab 25 % steigen die Ziele noch eine Stufe.
- **Renditedruck:** Nach jeder Saison erhält der Investor seinen Anteil am Gewinn. Ohne Gewinn sinkt das Vorstandsvertrauen um 5.
- **Fanprotest:** Jeder Verkauf kostet Stimmung (stärker ab 2005 und bei bodenständigen Vereinen). Liegt die Stimmung danach unter 45, gibt es Proteste und etwas weniger Zuschauer.

## Vorstandsvertrauen
Unter 40 gibt der Vorstand weniger Transfermittel frei, unter 20 halbiert er das Transferbudget zusätzlich. Entlassen wirst du nicht.

## Überschuldung: Punktabzug und Zwangsabstieg
Zum Saisonstart prüft der Verband **alle Vereine**: Schulden (negativer Kontostand + ein Viertel der Kreditrestschuld) im Verhältnis zum Jahresumsatz.
- über 60 %: **3 Punkte Abzug**, über 90 %: **6**, über 120 %: **9** – sichtbar in der Tabelle.
- Wer schon in der Vorsaison einen Abzug hatte und über 150 % liegt, steigt **zum Saisonende zwangsweise ab** (landet auf dem letzten Platz).
- Dazu kommen die Lizenzauflagen (Transfersperre) wie bisher.`,
  },
  {
    id: 'environment-overview',
    category: 'environment',
    title: 'Vereinsumfeld — Fans, Mitglieder, Medien, Vorstand',
    keywords: ['fans', 'stimmung', 'mitglieder', 'medien', 'vorstand', 'vertrauen', 'leitbild', 'identität', 'derby', 'rivalen', 'fankultur', 'saisonziel', 'ticketpreis'],
    body: `## Stimmung als Zustand
Die **Fan-Stimmung** (0–100) wird jeden Monat fortgeschrieben: Ergebnisse der letzten Spiele, **Derbys** gegen Rivalen aus der Region, das **Leitbild** des Vereins und zu hohe **Eintrittspreise** bewegen sie. Gute Stimmung füllt das Stadion langsam, schlechte leert es.

## Leitbild (Identität)
Jeder Verein hat ein Leitbild, das die Fans erwarten:
- **Ausbildungsverein:** junge und eigene Spieler sollen spielen.
- **Offensivfußball:** viele Tore.
- **Bodenständig & solide:** gesunde Finanzen, keine Abenteuer.
- **Titel und Stars:** Spitzenplätze und Stars im Kader.
- **Arbeiter und Kämpfer:** Einsatz, keine Klatschen.
Wie gut du es erfüllst, steht unter Verein → Fans.

## Mitglieder
Die Mitgliederzahl ist echt: Sie wächst mit Erfolg, guter Stimmung und der Fankultur der Epoche und bestimmt die **Mitgliedsbeiträge** (40 DM je Mitglied und Jahr, 1975-Wert).

## Fankultur im Wandel
| Epoche | Prägung |
|---|---|
| bis 1984 | Kuttenzeit: Stimmung ändert sich langsam |
| 1985–1992 | Krawall-Jahre: Sicherheitskosten, schwache Spielzeiten leeren die Kurve |
| 1993–2004 | Eventisierung: höhere Preise werden akzeptiert, Mitglieder wachsen |
| 2005–2014 | Ultra-Kultur: Choreos, aber Proteste gegen teure Tickets |
| ab 2015 | Soziale Medien: Stimmung schwankt so stark wie nie |

## Medien & Vorstand
- Der **Medien-Druck** steigt mit dem Ansehen des Vereins, der Epoche und Negativserien. Er verstärkt die Ausschläge beim **Vorstandsvertrauen**.
- Das Vertrauen bewegt sich monatlich mit Tabellenplatz gegenüber dem **Saisonziel**, Fan-Stimmung, Finanzen und Leitbild.
- Der Vorstand setzt jede Saison ein Ziel nach der Kaderstärke (Meisterschaft, Europa-Pokal-Platz, Mittelfeld, Klassenerhalt; in unteren Ligen Aufstieg).
- **Entlassen wirst du nicht** – aber das Vertrauen bestimmt, wie viel vom finanziellen Polster der Vorstand als **Transferbudget** freigibt (40–90 %). Unter 30 und 15 gibt es Warnungen.

## Die Fankurve
Unter **Verein → Fans** zeigt eine gezeichnete Stehtribüne, wie es um deine Anhänger steht: Je besser Stimmung und Auslastung, desto mehr Fans (6 bis 32 Figuren). Stimmung und die letzten fünf Spiele bestimmen das Gemüt – jubelnd mit erhobenen Armen, Schal oder Fahne, gelassen oder enttäuscht mit verschränkten Armen. Bei Euphorie hängen Fahnen und ein Spruchband, bei großem Ärger ein Protestbanner. Die Ausstattung folgt der Epoche: Kutte und Wollmütze in den 70ern und 80ern, Schals ab den 90ern, Handys ab 2010.`,
  },
  {
    id: 'environment-events',
    category: 'environment',
    title: 'Zufallsereignisse',
    keywords: ['zufall', 'ereignis', 'entscheidung', 'heimweh', 'berater', 'disco', 'werbung', 'mentor', 'sturm', 'gönner', 'sponsor', 'shitstorm'],
    body: `## Selten und persönlich
Etwa **drei Ereignisse pro Saison** betreffen einzelne Spieler; den ganzen Verein trifft es nur ungefähr einmal in vier Spielzeiten (Sturmschaden, Gönner, Pleite des Trikotsponsors). Es gibt **keinen künstlichen Ausgleich**: Gute und schlechte Ereignisse werden unabhängig gewürfelt.

## Passend zur Epoche
Der Spieler, der eine Kneipe eröffnen will, gehört in die 1970er und 80er, der fordernde **Berater** in die Zeit nach 1995, der **Shitstorm** in die Ära der sozialen Medien. Wunderheiler verschwinden mit der modernen Sportmedizin.

## Entscheidungen
Viele Ereignisse fragen nach deiner Entscheidung (Nachrichten → Knöpfe unter dem Text), z. B. Heimweh, Disco-Eskapade, Werbeangebot, Berater-Forderung, öffentliche Kritik oder Wunderheiler. Sie wirken auf Moral, Zufriedenheit, Professionalität, Form, Sperren, Vorstandsvertrauen oder kosten Geld.
Wer eine Woche nicht reagiert, bekommt die vorsichtige **Standardwahl** – das Spiel bleibt nie stehen.

## Kleine Glücksmomente
Ein Routinier nimmt ein Talent unter seine Fittiche, ein junger Spieler zerreißt sich im Training, ein Spieler wird Vater: Solche Ereignisse geben Entwicklungs- oder Moralschübe ohne Entscheidung.

## Vereinsereignisse
Daneben gibt es seltene Ereignisse für den ganzen Verein, jeweils mit drei Jahren Sperrzeit:

| Ereignis | Wann | Entscheidung | Wirkung |
| --- | --- | --- | --- |
| Mäzen bietet Geld | bis 1998, häufiger bei Schulden | annehmen / ablehnen | 6–12 % eines Jahresumsatzes, aber Vorstandsvertrauen −6 |
| Derby-Warnung | häufiger 1980–1999 | Sicherheit verstärken / nichts tun | ohne Ordner zu 50 % Strafe, Fanstimmung −4 |
| Fanprotest | ab 2000, bei schlechter Stimmung | Gespräch / Preise −10 % / aussitzen | Stimmung +4 / +8 / −6 |
| Pressekampagne | ab 1984, nach 3 Niederlagen in Folge | Interview / schweigen | Vertrauen und Mediendruck ± |
| Flutlichtschaden | eher in alten Stadien | sofort / verschieben | Kosten oder Ärger |
| Grippewelle | November–Februar | – | 2–4 Spieler 4–9 Tage krank |
| Probetraining | jederzeit | Ausbildungsvertrag / absagen | 16-jähriges Talent mit unbekanntem Potenzial |
| Konjunktur | September | – | ±3 % eines Jahresumsatzes |
| WM-Euphorie | WM-Sommer (1978, 1982 …) zu 50 % | – | eine Saison 5–10 % mehr Zuschauer bei allen Vereinen |

## Häufigkeit und fester Zufall
In den **Einstellungen** wählst du „Ereignisse: wenige · normal · viele“ (Faktor 0,5 / 1 / 1,8). Gewürfelt wird mit einem festen Zufall aus Verein und Datum – Neuladen ändert nichts an den Ereignissen eines Tages.

## Regeln mit Vorlauf
Am 2. Januar kündigt der Verband an, welche Regeln, Wettbewerbe und Ligareformen ab der nächsten Saison gelten.`,
  },
  {
    id: 'youth-teams-recruit',
    category: 'youth',
    title: 'Volle Jugendmannschaften & Rekrutierung',
    keywords: ['jugendmannschaft', 'kader', 'breite', 'aussortiert', 'aufhören', 'rekrutierung', 'leichtathlet', 'handball', 'probetraining', 'sichtung', 'ereignis'],
    body: `## Volle Mannschaften
Dein Verein hat in jeder Altersklasse eine volle Mannschaft:

| Klasse | G | F | E | D | C | B | A |
|---|---|---|---|---|---|---|---|
| Spieler | 10 | 12 | 14 | 16 | 20 | 20 | 22 |

Den Kern bilden die **Akademie-Talente** (je nach Ausbaustufe 1–4 pro Jahr). Aufgefüllt wird mit **Breitensportlern**: rund 70 % haben unter 2 Sterne Potenzial, 22 % 2–2,75, 7 % 3–3,5 und nur 1 % mehr. Die meisten spielen aus Freude am Fußball – im Test schafften es über 15 Jahre nur etwa **13 %** der A-Jugend-Abgänger zu den Profis.

Zum **1. Juli** rücken alle auf. Danach:
- **Abgänge:** bis 11 Jahre 4 %, bis 15 Jahre 8 %, darüber 12 % pro Jahr – im schwächsten Drittel fast doppelt so oft, erkennbare Talente (≥ 3,5 Sterne laut Scouts) nur selten. Gründe: aufhören, Schule, Ausbildung, Umzug, andere Sportart, Nachbarverein.
- **Aussortieren:** Ist eine Mannschaft zu groß, gehen die Schwächsten (Stärke plus erkennbares Potenzial). Spieler mit Fördervertrag bleiben.
- **Auffüllen:** Lücken werden mit neuen Spielern auf den fehlenden Positionen geschlossen (je Mannschaft 1–2 Torhüter, sonst etwa 36 % Abwehr, 36 % Mittelfeld, 28 % Angriff).

KI-Vereine behalten schlanke Akademien – so bleiben Spielstände klein.

## Rekrutierungs-Ereignisse
Etwa **einmal pro Jahr** (Einstellung „Ereignisse“ wirkt mit) bietet sich eine besondere Chance – ein Leichtathlet aus der Leichtathletikabteilung, ein Handballtorwart, der lieber Fußball spielen will, ein Straßenfußballer vom Bolzplatz. Jedes Ereignis bringt eigene Stärken und Schwächen mit, passt zur Epoche und kommt höchstens alle acht Jahre wieder. Du entscheidest: **aufnehmen** oder **absagen** (manche kosten eine Ausbildungsentschädigung).

**Zufall:** Ein verdeckter Wurf entscheidet über die wahre Klasse – 8 % **Glücksgriff** (+0,75 Sterne), 17 % besser als gedacht (+0,25), 60 % wie erwartet, 15 % **Blender** (−0,75). Die Scouts sehen nur die übliche Sterne-Spanne.

## Alle Ereignisse
| Ereignis | Zeitraum | Alter | Positionen |
|---|---|---|---|
` + YOUTH_RECRUIT_EVENTS.map((e) => `| ${e.title} | ${e.from ?? 1975}–${e.to ?? 'heute'} | ${e.ages[0]}–${e.ages[1]} | ${[...new Set(e.positions)].join(', ')} |`).join('\n'),
  },
  {
    id: 'youth-gems-scouting',
    category: 'youth',
    title: 'Verborgene Juwelen & Talente anderer Vereine',
    keywords: ['juwel', 'verborgen', 'spätzünder', 'talent', 'abwerben', 'fördervertrag', 'ausbildungsentschädigung', 'scouting', 'jugend', 'heimat'],
    body: `## Verborgene Juwelen
- Etwa jedes 40. Talent eines Jahrgangs (und selten ein junger Profi) ist ein **verborgenes Juwel**: Lange wirkt es unauffällig, die Scouts sehen nur ein normales Potenzial.
- Mit **18 oder 19 Jahren platzt der Knoten**: Das Potenzial steigt um 7–13 Punkte, Profis bekommen zur Großen Saison-Bewertung zusätzlich einen Entwicklungsschub (Kennzeichen **Juwel**).
- Erst danach korrigieren die Scouts ihre Einschätzung. Wer einem unscheinbaren Talent Spielzeit und Geduld schenkt, wird manchmal belohnt – sicher erkennen kann ein Juwel niemand.

## Talente anderer Vereine
- Unter **Transfers → Beobachtungsliste** zeigen deine Scouts Talente aus fremden Akademien. Wie viele Akademien sie im Blick haben, hängt vom **Scouting-Personal** (und später vom Datenzentrum) ab; die Sichtungen wechseln monatlich.
- **Mindestalter** für einen Wechsel: bis 1990 16 Jahre, bis 2010 15, danach 14.
- Pro Talent und Saison hast du **einen Versuch**. Hürden:
  - **Blockade:** Vereine geben ihre zwei größten Talente nicht frei, wenn sie nicht deutlich kleiner sind als du. Ab 1990 binden sie Talente mit **Förderverträgen**.
  - **Wechselwille:** Ansehen beider Vereine, Qualität der Akademien, Anpassungsfähigkeit und Alter zählen; wer in eine andere Stadt müsste, bleibt lieber in der Heimat.
  - **Ausbildungsentschädigung:** abhängig vom geschätzten Potenzial, ab 2000 deutlich teurer; sie geht vom Transferbudget ab.

## Deine Talente schützen
- Größere Vereine versuchen zum Saisonwechsel, deine besten Talente (ab ca. 3,75 Sterne, bis 18 Jahre) abzuwerben – ab 2010 häufiger. Du erhältst dann eine Ausbildungsentschädigung.
- Ab 1990 schützt ein **Fördervertrag** (Jugend → Talent öffnen) für ein Jahr. Er kostet jährlich, je nach Potenzial.`,
  },
  {
    id: 'youth-invest',
    category: 'youth',
    title: 'Nachwuchs-Investitionen (Akademie)',
    keywords: ['akademie', 'nachwuchs', 'investition', 'jugendtrainer', 'internat', 'schule', 'scouting', 'zweite mannschaft', 'amateure', 'u23', 'nlz', 'leistungszentrum', 'ruf', 'durchlässigkeit', 'talentwettbewerb', 'jugendetat'],
    body: `## Worum es geht
Unter **Jugend → Akademie** entscheidest du, wie viel du in den Nachwuchs steckst – und worin. Die Wirkung kommt **verzögert**:
Eine Investition zahlt sich typischerweise erst nach **3–6 Jahren** aus. Wer kürzt, verliert schneller, als er aufgebaut hat.

## Die Bausteine
Jeder Baustein hat Stufen mit **Baukosten**, **Bauzeit** und **jährlichem Unterhalt** (Preise wachsen mit der Epoche). Neue Stufen werden erst in ihrer Zeit verfügbar.

| Baustein | Stufen | Wirkung |
|---|---|---|
| **Jugendtrainer** (Qualität × Anzahl) | Ehrenamt → Lizenztrainer → hauptamtlich → Fußballlehrer (ab 1985) → Ausbilder-Team (ab 2001) | stärkster Hebel der Ausbildung; volle Wirkung nur mit genug Trainern (7, ab 2001: 10) |
| **Plätze & Halle** | Rasenplatz → Flutlicht → Kunstrasen & Halle (ab 1985) → Campus (ab 1998) | Ausbildung, mehr Kinder je Jahrgang |
| **Internat** | Gastfamilien → Jugendhaus (ab 1988) → Internat im Campus (ab 2003) | auswärtige Talente kommen; etwas Ausbildung |
| **Schulkooperation** | Partnerschule (ab 1985) → Eliteschule des Fußballs (ab 2006) | Trainingszeit am Vormittag |
| **Sportwissenschaft** | Ernährung & Diagnostik (ab 1995) → Psychologie (ab 2004) → Analyse-Team (ab 2012) | kleine Ausbildungs-Vorteile |
| **Scouting-Netz** | lokal → regional → national (ab 1985) → international (ab 1996) | wie viele Talente du im Wettbewerb überhaupt kennst |
| **Zweite Mannschaft** | Amateure (Oberliga) → U23 (ab 1994) | Spielpraxis für junge Profis bis 23 |

Dazu kommt der **Jugendetat** je Saison (Fahrten, Turniere, Material, Sichtungstage): mehr Breite und etwas Qualität; über der Empfehlung flacht die Wirkung ab.

## Was die Akademie ausmacht
- **Ausbildung (0–100):** aus Trainern, Plätzen, Etat, Internat, Schule, Wissenschaft. Die *wirksame* Ausbildung folgt dem Ziel nur um **etwa 20 % pro Jahr** (Abbau ≈ 35 %). Sie steuert Lernrate der Talente (×0,8 bis ×1,65), wie reif sie mit 18/19 sind (bis +8 % Spielstärke), Zahl und Potenzial der Bambini und wie genau deine Scouts einschätzen.
- **Ruf (0–100):** Langzeitwert. Jedes Jahr ≈ 15 % Richtung Ausbildung, Vereinsgröße und **Erfolg eigener Absolventen** (wer spielt, wie gut).
- **Durchlässigkeit (0–100):** bekommen eigene Talente bis 23 Einsatzzeit bei den Profis? Eine zweite Mannschaft hilft ein wenig.

## Wettbewerb um Talente (1. Juli)
Jedes Jahr gibt es eine Handvoll herausragender **12- bis 16-Jähriger** (ab 1990 und 2002 mehr; ab 1996 auch aus dem Ausland). Sie wählen den Verein mit der größten **Anziehungskraft**: Ruf der Akademie, Ansehen des Vereins, Durchlässigkeit und Ausbildung – Heimatvereine haben einen Bonus, auswärtige Talente brauchen ein **Internat**. Du konkurrierst nur um Talente, die dein **Scouting-Netz** kennt. Die Nachricht „Talentwettbewerb“ zeigt Zu- und Absagen.

## Zweite Mannschaft & Potenzial
Junge Profis, die bei den Profis kaum spielen, verloren früher Jahr für Jahr Entfaltung (Potenzial). Mit **Amateuren** sammeln **Eigengewächse** (Spieler aus einer Jugendakademie) bis 23 gewichtete Minuten (40 %), mit einer **U23** mehr (55 %). Eingekaufte junge Profis profitieren davon nicht. Das hält sie im Rhythmus; echte Sprünge gibt es weiter nur mit Einsätzen bei den Profis.

## Leistungszentrum-Pflicht
Nach dem EM-Aus 2000 wurde ein Leistungszentrum Lizenzbedingung: **ab 2001 für die Bundesliga, ab 2002 für die 2. Liga**. Mindestens: Fußballlehrer im Nachwuchs, zwei Plätze mit Flutlicht, Gastfamilien, Partnerschule und 8 Jugendtrainer. Fehlt etwas, gibt es jedes Jahr eine **Geldstrafe** und der Ruf leidet. Ein Jahr vorher kommt eine Ankündigung. 2002 startet das **DFB-Talentförderprogramm** (Stützpunkte): Alle Scouting-Netze finden mehr Talente.

## Was kostet das?
Alle Preise sind Preisschilder in 1975-Basis und wachsen mit der Epoche. Ein üblicher Erstligist gibt 1975 rund **100 Tsd. DM** im Jahr für den Nachwuchs aus, ein stark investierender 200–300 Tsd. – grob 3–6 % des Umsatzes. Ein volles Leistungszentrum der 2010er/2020er liegt bei mehreren Millionen bis über 20 Mio. €. Die Kosten erscheinen in der Bilanz unter **Nachwuchs**.

## KI-Vereine
KI-Vereine investieren vereinfacht einen Anteil ihres Umsatzes – Trainer mit **Jugend-Philosophie** deutlich mehr, Einkaufs-Trainer weniger – höchstens einen neuen Ausbau pro Jahr, und erfüllen die Leistungszentrum-Pflicht.`,
  },
  {
    id: 'facilities-overview',
    category: 'facilities',
    title: 'Vereinsgelände — Überblick',
    keywords: ['vereinsgelände', 'gelände', 'infrastruktur', 'ausbau', 'stufen', 'gebäude', 'überblick'],
    body: `## Das Vereinsgelände
Im Bereich **Gelände** (Symbol in der unteren Navigation) baust du deine Einrichtungen aus. Jede hat **5 Stufen**
und einen **konkreten, real wirkenden Effekt** in den Spiel-Engines.

| Einrichtung | Wirkung |
|---|---|
| Stadion | +Zuschauerkapazität → mehr Stadioneinnahmen |
| Trainingszentrum | schnellere Attribut-Entwicklung des ganzen Kaders |
| Jugendakademie | mehr & bessere Talente, schnellere Jugendentwicklung |
| Medizinische Abteilung | schnellere Fitness-Regeneration & kürzere Ausfälle |
| Fanshop / Merchandising | höherer Fanartikel-Erlös je Besucher |
| Catering / Würstchenbuden | Pro-Kopf-Erlös je Heimspiel; Betriebsform wählbar |

Das **Catering** wird über ein eigenes \`<Icon>\` (kein Emoji) dargestellt und hat eine wählbare **Betriebsform** (Eigenbetrieb/Umsatzbeteiligung/Verpachtung) — direkt an der Einrichtung oder im Bereich **Marketing**. Details siehe *Catering & Betriebsformen*.

## Monatliche Gebäude-Fixkosten
Jede **gebaute Einrichtung** verursacht laufende Fixkosten (Unterhalt), die je Einrichtung auf der Karte ausgewiesen und im **Monatsabschluss** gebucht werden: \`Basis × Stufen-Multiplikator (1 · 1,4 · 1,9 · 2,5 · 3,2)\`, era-skaliert. Stadion ist ausgenommen (im Stadionunterhalt), Catering ist Sonderfall je Betriebsform. Zukunfts-Einrichtungen zählen erst ab Stufe ≥ 2. Details: *Ausgaben & Formeln*.

## Ausbau & Kosten
- Der Ausbau wird **sofort vom Vereinskonto** abgebucht (ära-gerechte Währung, Größenordnung steigt mit dem Spieljahr) und ist nur bei
  **ausreichendem Kontostand** möglich.
- Jede Karte zeigt die **aktuelle Stufe**, den **aktuellen Effekt**, den **Effekt nach dem Ausbau** und die **Kosten**.
- Nach Abschluss erhältst du eine Vorstands-Nachricht mit neuem Effekt und Kontostand.

Die Ausbaukosten steigen überproportional mit der Zielstufe:
\`Kosten(Zielstufe) = Basiskosten × Faktor × Wirtschaftsskala des Jahres  (auf 5.000 gerundet)\`
mit den Faktoren **Stufe 2 = ×1,0**, **Stufe 3 = ×2,1**, **Stufe 4 = ×3,6**, **Stufe 5 = ×5,4**. Die Basiskosten sind Preise von 1975; später steigen sie mit der Inflation des Fußballs.
Das **Stadion** ist die Ausnahme: Es wird als Bauprojekt mit Bauzeit und wahlweise per Kredit ausgebaut (siehe *Stadionbau, Kredite, Namensrechte, Investoren und Überschuldung*).

## Startausstattung
Größere Vereine (höhere Reputation) starten mit besserer Infrastruktur (Stufen 1–3). Auch die KI-Vereine besitzen
Infrastruktur-Stufen; ihre Stadion- und Akademie-Effekte wirken ebenfalls (z. B. auf ihren Nachwuchs).

Details zu Kosten und Effekten je Einrichtung: siehe *Einrichtungen im Detail*.`,
  },
  {
    id: 'facilities-details',
    category: 'facilities',
    title: 'Einrichtungen im Detail (Kosten & Effekte)',
    keywords: ['stadion', 'trainingszentrum', 'medizin', 'fanshop', 'merchandising', 'kosten', 'kapazität', 'effekte', 'dm'],
    body: `Alle Kosten in **DM von 1975** (später × Wirtschaftsskala), auf 5.000 gerundet. Stufe 1 ist die Grundausstattung (kostenlos).

## Stadion — Basiskosten 450.000 DM
Jede Stufe über 1 erhöht die **Kapazität um 6.000 Plätze**. Mehr Kapazität → höhere Zuschauerzahl und damit
**mehr Stadion- und Fanartikel-Einnahmen** pro Heimspiel (wirkt direkt in den Finanzen und in der Saisonprognose).

| Zielstufe | 2 | 3 | 4 | 5 |
|---|---|---|---|---|
| Kosten | 450.000 | 945.000 | 1.620.000 | 2.430.000 |
| Kapazität ggü. Stufe 1 | +6.000 | +12.000 | +18.000 | +24.000 |

## Trainingszentrum — Basiskosten 100.000 DM
Setzt die **Anlagenqualität** (facilitiesQuality), die das Training direkt multipliziert — höhere Qualität = schnelleres
Attribut-Wachstum des gesamten Profikaders.

| Zielstufe | 2 | 3 | 4 | 5 |
|---|---|---|---|---|
| Kosten | 100.000 | 210.000 | 360.000 | 540.000 |
| Anlagenqualität (Stufe 1→5) | 68 | 78 | 88 | 96 |

(Stufe 1 = Qualität 55.)

## Jugendakademie — Basiskosten 80.000 DM
Steuert **Anzahl** und **Qualität** neuer Talente sowie die **Lernrate** der Jugendentwicklung (Details im Bereich *Jugendsystem*).

| Zielstufe | 2 | 3 | 4 | 5 |
|---|---|---|---|---|
| Kosten | 80.000 | 170.000 | 290.000 | 430.000 |
| Talente/Jahr | 2 | 2 | 3 | 4 |
| Qualitäts-Bonus | +3 | +6 | +9 | +13 |
| Lernrate × | 1,0 | 1,15 | 1,3 | 1,5 |

(Stufe 1 = 1 Talent/Jahr, Bonus 0, Lernrate ×0,85.)

## Medizinische Abteilung — Basiskosten 60.000 DM
Beschleunigt die **Fitness-Regeneration** deiner Spieler und **verkürzt Ausfallzeiten** nach Verletzungen (wirkt täglich
auf den Profikader).

| Zielstufe | 2 | 3 | 4 | 5 |
|---|---|---|---|---|
| Kosten | 60.000 | 125.000 | 215.000 | 325.000 |
| Regeneration/Tag | +1 | +2 | +3 | +5 |
| Reha-Verkürzung/Tag | – | −1 Tag | −1 Tag | −2 Tage |

(Stufe 1 = kein Bonus.) „Regeneration/Tag" sind zusätzliche Fitnesspunkte pro Tag, „Reha-Verkürzung" reduziert die
verbleibenden Verletzungstage zusätzlich.

## Fanshop / Merchandising — Basiskosten 55.000 DM
Multipliziert den **Fanartikel-Erlös pro Besucher** (wirkt bei jedem Heimspiel in den Finanzen).

| Zielstufe | 2 | 3 | 4 | 5 |
|---|---|---|---|---|
| Kosten | 55.000 | 115.000 | 200.000 | 295.000 |
| Erlös-Multiplikator | ×1,15 | ×1,3 | ×1,5 | ×1,75 |

(Stufe 1 = ×1,0. Grund-Erlös 1975 ≈ 0,25–0,35 DM je Besucher, abhängig von der Reputation; wächst mit der Vermarktung.)

## Catering / Würstchenbuden — Basiskosten 60.000 DM
Steigert den **Pro-Kopf-Erlös je Heimspiel**. Die Betriebsform bestimmt Erlös und Fixkosten (vollständige Tabellen: *Catering & Betriebsformen*).

| Zielstufe | 2 | 3 | 4 | 5 |
|---|---|---|---|---|
| Kosten | 60.000 | 125.000 | 215.000 | 325.000 |
| Netto/Besucher (Eigenbetrieb) | 0,85 | 1,10 | 1,35 | 1,60 |

(Stufe 1 = 0,60 DM/Besucher im Eigenbetrieb.)

## Monatliche Fixkosten je Einrichtung
Basis-Unterhalt/Monat (1975-DM, Stufe-1-Basis), skaliert mit \`1 · 1,4 · 1,9 · 2,5 · 3,2\` je Stufe:
Trainingszentrum 1.400 · Medizin 875 · Fanshop 700 · Reha-Zentrum 1.050 (Jugendakademie und NLZ: Kosten über **Jugend → Akademie**) · Leistungszentrum 1.575 · Datenanalyse 1.225. Stadion ausgenommen; Catering je Betriebsform.`,
  },
  {
    id: 'facilities-future',
    category: 'facilities',
    title: 'Zukünftige Einrichtungen (Epochen)',
    keywords: ['zukunft', 'reha-zentrum', 'nlz', 'leistungszentrum', 'datenanalyse', 'epoche', 'freischalten', 'ausgegraut'],
    body: `## Epochen-Einrichtungen
Neben den fünf Grund-Einrichtungen schalten sich im Laufe der Jahrzehnte **vier weitere** Einrichtungen frei.
Mit der Checkbox **„Zukunft anzeigen"** siehst du sie schon vorab **ausgegraut** samt Freischaltjahr.

| Einrichtung | ab | Basiskosten | Wirkung |
|---|---|---|---|
| Reha-Zentrum | 1990 | 75.000 | verkürzt Ausfallzeiten & steigert die Regeneration zusätzlich |
| Nachwuchsleistungszentrum (NLZ) | 1998 | 115.000 | beschleunigt die Jugendentwicklung (Wachstums-Bonus) |
| Leistungszentrum | 2003 | 100.000 | hebt die Anlagenqualität → schnellere Kaderentwicklung |
| Datenanalyse-Zentrum | 2013 | 90.000 | präzisiert das Scouting im Nachwuchs (Genauigkeit) |

## Wirkung im Spiel (real)
- **Reha-Zentrum**: addiert zu Medizin & Reha-Personal — kürzere Verletzungsausfälle und mehr tägliche Regeneration.
- **NLZ**: erhöht den Wachstums-Bonus in der wöchentlichen Jugendentwicklung (\`developYouthWeekly\`).
- **Leistungszentrum**: fließt in die **Anlagenqualität** (facilitiesQuality) ein — wie das Trainingszentrum, aber
  additiv on top — und beschleunigt so die Attribut-Entwicklung des Profikaders.
- **Datenanalyse-Zentrum**: erhöht die Scouting-Genauigkeit im Nachwuchs, zusätzlich zum Scouting-Personal.

Alle vier Einrichtungen haben — wie die Grund-Einrichtungen — **5 Stufen** und werden erst ab ihrem Freischaltjahr
ausbaubar.`,
  },
  {
    id: 'facilities-surroundings',
    category: 'facilities',
    title: 'Stadionumfeld: Anreise, Handel, Fans, Medien',
    keywords: ['umfeld', 'stadionumfeld', 'parkplatz', 'parkhaus', 'öpnv', 'kombiticket', 'bahnhof', 'anreise', 'chaos', 'vereinsheim', 'megastore', 'onlineshop', 'museum', 'führung', 'ordnungsdienst', 'fanprojekt', 'familienblock', 'fan-zone', 'choreo', 'hospitality', 'vip', 'business', 'presse', 'tv', 'flutlicht', 'lux', 'lizenz', 'grundstück', 'fläche', 'genehmigung', 'anwohner', 'protest', 'polizei', 'strafe', 'ausschreitungen', 'sanierung', 'abriss'],
    body: `## Das Umfeld rund ums Stadion
Unter **Verein → Vereinsgelände** steuerst du neben Training, Jugend und Medizin auch das **Umfeld**: wie die Fans anreisen, was sie rund ums Spiel kaufen, wie sicher es ist und wie Presse, Fernsehen und Sponsoren arbeiten. Rechts wählst du **Lage & Wirkung** (Kennzahlen) oder die **Bauliste**; ein Klick auf ein Gebäude in der Zeichnung öffnet die Details.

## Lage und Fläche
Jeder Verein hat eine feste **Lage**: **Innenstadt** (viele kommen zu Fuß, gute Bahn, aber nur ~12 Parzellen und empfindliche Nachbarn), **Stadtteil** (~18 Parzellen) oder **Stadtrand** (~26 Parzellen, billiges Land, fast alle kommen mit dem Auto). Trainingsplätze, Gebäude und Umfeld teilen sich die Fläche. Ist sie voll, kaufst du ein **Grundstück** dazu (+2 Parzellen; in der Innenstadt höchstens einmal, teuer) oder **reißt** etwas ab.

## Bauen: Genehmigung, Protest, Bauzeit
Größere Bauten brauchen eine **Baugenehmigung** (1975 etwa 6 Wochen, ab 2005 vier, ab 2020 sechs Monate). Die Kosten werden beim Antrag gebucht. **Anwohner** können protestieren – je lauter das Bauwerk (Fan-Zone, Flutlicht, Parkplatz) und je enger die Lage, desto eher: Das Verfahren verzögert sich, die Stadt erteilt **Auflagen** (+12 % Kosten) oder **lehnt ab** (90 % zurück). Danach folgt die Bauzeit. Höchstens zwei Vorhaben laufen gleichzeitig.

## Anbindung & Anreise
| Teil | Stufen | Wirkung |
|---|---|---|
| Parkplätze | Schotter → Asphalt → Parkhaus (ab 1985) → Leitsystem (ab 2000) | Parkgebühr je Pkw, mehr Anreisekapazität; das Parkhaus braucht weniger Fläche |
| ÖPNV | Shuttlebusse → Sonderzüge (Verhandlung) → **Kombiticket** (ab 1993, Vorbild SC Freiburg 1993/94) → eigener Stadion-Bahnhof (ab 2000) | mehr Kapazität, Auslastung +1 bis +5 %; Kosten je Spiel bzw. je Zuschauer |

Ab Stufe 2 verhandelst du mit der **Stadt**: Sie zahlt mit, entscheidet aber nach sechs bis zehn Wochen selbst (besser mit hohem Ansehen, schlechter nach Ausschreitungen). Liegt die Nachfrage über der Kapazität (Autos, Bus & Bahn, Wildparken), gibt es **Anreise-Chaos**: Fans verpassen Buden und Shop (entgangener Umsatz), die Stimmung sinkt, dauerhaft zu kleine Kapazität kostet Auslastung.

## Gastronomie & Handel
Buden und Fanshop baust du wie bisher aus (Betriebsform des Caterings unter Marketing). Dazu: **Vereinsheim** (Pacht jeden Monat, etwas Stimmung), **Megastore** (ab 1990 als City-Filiale, ab 1995 am Stadion; braucht Fanshop Stufe 3), **Versand & Onlineshop** (Katalog ab 1985, Onlineshop ab 1998, international ab 2010 – je bekannter der Verein, desto mehr), **Vereinsmuseum** (ab 2004, Vorbild HSV-Museum) und **Stadionführungen** (ab 1998). Handelserlöse laufen mit der **Marke** und litten 1997–1999 unter der Fanartikel-Flaute (-30 %).

## Fanbereich & Sicherheit
Jedes Heimspiel kann **Ausschreitungen** bringen: Grundrisiko 4 % (bis 1979), **12 % in der Hooligan-Zeit 1980–1992**, 6 % ab 1993, 9 % in der Pyro-Zeit 2005–2014, danach 8 %; **Derbys ×2,2**, schlechte Stimmung ×1,3. Folge: **DFB-Geldstrafe**, in den 80ern bleiben Familien weg, die Stimmung leidet. Dagegen helfen **Ordnungsdienst** (bis −65 %, kostet je Zuschauer), **Fanprojekt** (ab 1981 – erstes deutsches Fanprojekt in Bremen; wirkt nach etwa einem Jahr voll; ab 1993 tragen Stadt, Land und DFB nach dem NKSS den Großteil), **Familienblock** (ab 1990: mehr Zuschauer, weniger Krawall, aber Rabatte; zur Ultra-Zeit murrt die Kurve), **Fanräume & Choreo-Lager** (ab 1998, Stimmung) und die **Fan-Zone** (ab 2006, Erlös vor dem Spiel, laut).
Ab **2015** stellen manche Länder **Polizeikosten** für Hochrisikospiele (Derbys) in Rechnung (Bremen, erster Bescheid ~425.000 € für Werder–HSV), ab **2025** häufiger (Urteil des Bundesverfassungsgerichts). Ein guter Ordnungsdienst senkt die Rechnung.

## Hospitality & Medien
**Hospitality** (VIP-Zelt ab 1985, Business-Club ab 1995, Premium ab 2005) liefert Räume, Küche und Service für die Business-Seats und Logen im Stadion: +6/15/25 % Nachfrage und halb so viel mehr Preisbereitschaft. Eigene Plätze hat das Modul nicht mehr – ohne Business-Seats oder Logen im Stadion bringt es nichts. **Presse & TV** (Pressezentrum ab 1988, TV-Compound ab 1992, Medienzentrum ab 2008) und **Flutlicht** (300 lx bis LED 1.600 lx) stärken die nationale Marke bzw. erlauben Abendspiele.
**Lizenzauflagen** (1. und 2. Liga) prüft der Verband zu jedem Saisonstart: Flutlicht in der 1. Liga ab 1988 TV-tauglich, ab 2000 1.200 lx, ab 2008 1.400 lx, **ab 2019 1.600 lx** (DFL; 2. Liga je eine Stufe weniger), Presse ab 1992 ein TV-Compound. Fehlt etwas, gibt es eine Geldstrafe, die bei Wiederholung steigt, und der Vorstand verliert Vertrauen.

## Zustand und Modernisierung
Alles nutzt sich ab. Der **Zustand** bestimmt die Wirkung (100 % → voll, 0 % → 60 %). Nach der **Lebensdauer** (z. B. Onlineshop 10, Flutlicht 25 Jahre) gilt eine Anlage als **veraltet**: Sie wirkt schwächer und verfällt doppelt so schnell. **Sanieren** stellt den Zustand her und modernisiert.

## Was es kostet (Größenordnung)
Preise sind 1975-Basis und wachsen mit dem Stadiongeschäft (bis 2025 etwa ×27). Ein Schotterparkplatz kostet 1975 rund 40.000 DM, ein Parkhaus 1985 etwa 2,5 Mio. DM, Premium-Hospitality 2025 rund 16 Mio. €. 1975 ist das Umfeld ein Nebengeschäft (einige zehntausend DM im Jahr); ein voll ausgebautes Umfeld eines Spitzenclubs bringt 2025 netto über 10 Mio. € im Jahr.

## KI-Vereine
Die anderen Vereine ziehen vereinfacht mit: Zum Saisonstart bauen sie je nach Ruf und freiem Geld höchstens zwei Stufen aus, sanieren Verfallenes und erfüllen Lizenzauflagen sofort.`,
  },
  // ---------------------------------------------------------------------------
  // MITARBEITER (Personal)
  // ---------------------------------------------------------------------------
  {
    id: 'staff-overview',
    category: 'staff',
    title: 'Mitarbeiter — Überblick',
    keywords: ['mitarbeiter', 'personal', 'staff', 'anstellen', 'entlassen', 'gehalt', 'rollen', 'epoche', 'zukunft'],
    body: `## Mitarbeiterstab
Im Bereich **Mitarbeiter** (in der unteren Navigation) stellst du Personal abseits des Spielerkaders an:
Trainerteam, Medizin/Reha, Scouting/Analyse, Medien/Marketing und Verwaltung. Jede Rolle ist einer **Epoche**
zugeordnet und wird erst ab ihrem **Freischaltjahr** anstellbar — passend zur Professionalisierung des Fußballs.

## Epochen
Die Rollen schalten sich in sechs Wellen frei: **1975** (Grundstab), **1983** (beginnende Professionalisierung),
**1993** (Kommerzialisierung), **2003** (moderne Strukturen), **2013** (Datenzeitalter), **2021** (KI & Nachhaltigkeit).
Die Chronik meldet die wichtigsten Personal-Wellen als Meilenstein.

## Zukunft anzeigen
Mit der Checkbox **„Zukunft anzeigen"** blendest du Rollen späterer Epochen ein — sie erscheinen **ausgegraut**
und tragen ein „ab JAHR"-Kennzeichen. So planst du langfristig, ohne sie schon anstellen zu können.

## Kosten
Jede Rolle hat eine **Kostenklasse K1–K5** mit einem Grundgehalt (Basisjahr 1975):

| Klasse | K1 | K2 | K3 | K4 | K5 |
|---|---|---|---|---|---|
| Gehalt/Monat (Basis) | 400 | 800 | 1.700 | 3.500 | 8.000 |

Die Gehälter **skalieren mit der Wirtschafts-Basis** (economyScale) über die Jahrzehnte mit. Die Summe aller
Monatsgehälter wird **monatlich** (am 1. des Monats) als Ausgabe in den Finanzen unter **„Betreuerstab"
(staff_wages)** gebucht — nur für deinen Verein.`,
  },
  {
    id: 'staff-effects',
    category: 'staff',
    title: 'Mitarbeiter — Effekte & Obergrenzen',
    keywords: ['effekt', 'gedeckelt', 'cap', 'verletzung', 'reha', 'regeneration', 'scouting', 'reichweite', 'sieg-bonus'],
    body: `## Effekte sind real & GEDECKELT
Mehrere Rollen derselben Wirkung **addieren** sich, aber nur bis zu einer festen Obergrenze. Es gibt bewusst
**KEINEN direkten Sieg-Bonus** — Personal verbessert die Rahmenbedingungen, nicht das Ergebnis per Knopfdruck.

| Wirkung | Obergrenze | Wirkt im Spiel |
|---|---|---|
| Verletzungsrisiko | −20 % | vorbereitet* |
| Ausfallzeit / Reha | −25 % | **real** (kürzere Ausfälle) |
| zusätzl. Regeneration | +3 Fitness/Tag | **real** (tägliche Fitness) |
| Scouting-Genauigkeit | +15 % | **real** (präzisere Talentbewertung) |
| Reichweite / Fanbindung | +20 % | Nebenerträge / atmosphärisch |

Die Effekt-Kachel oben im Bereich zeigt jederzeit den aktuellen aggregierten Wert und die jeweilige Obergrenze.

## So wirken die Effekte konkret
- **Reha-Verkürzung & Regeneration**: fließen täglich in \`App.processDay\` ein — zusammen mit der Medizinischen
  Abteilung und dem Reha-Zentrum verkürzen sie Ausfälle und heben die Fitness schneller.
- **Scouting-Genauigkeit**: verengt im Nachwuchs die Potenzial-Einschätzung schneller (\`developYouthWeekly\`),
  zusammen mit dem Datenanalyse-Zentrum.
- **Reichweite**: erzeugt keine direkten Punkte, sondern speist kleine Marketing-Nebenerträge.

(*) Die Verletzungs-Reduktion senkt das Risiko von Spiel- und Trainingsverletzungen deiner Spieler. Im Spiel
verletzen sich im Schnitt etwa **0,3 Spieler je Mannschaft und Spiel** (rund neun Verletzungen pro Verein und
Saison, meist Prellungen und Zerrungen von wenigen Tagen, jede zehnte schwer mit 40–90 Tagen Pause). Anfällige,
müde und überlastete Spieler trifft es häufiger.`,
  },
  // ---------------------------------------------------------------------------
  // MARKETING
  // ---------------------------------------------------------------------------
  {
    id: 'marketing-overview',
    category: 'marketing',
    title: 'Marketing — Werbekanäle & Sättigung',
    keywords: ['marketing', 'werbung', 'regler', 'slider', 'sättigung', 'kosten', 'nutzen', 'reichweite', 'sponsoring', 'merchandising', 'epoche', 'zukunft'],
    body: `## Marketing
Im Bereich **Marketing** (in der unteren Navigation) stellst du je Werbekanal ein Budget per **Schieberegler** ein.
Neue Kanäle schalten sich epochengerecht frei: **1975** (Stadionwerbung, Lokalpresse), **1984** (Fernsehwerbung),
**1993** (überregionale Kampagnen, Merchandising), **2000** (Online), **2010** (Social Media), **2020**
(Influencer/Content, internationale Digitalkampagnen). Die Checkbox **„Zukunft anzeigen"** blendet spätere Kanäle
ausgegraut ein.

## Kosten linear, Nutzen gesättigt
- Die **Kosten** steigen **LINEAR** mit der Reglerstufe (Kosten/Stufe je Kanal fest).
- Der **Nutzen** folgt einer **Sättigungskurve**:

\`Nutzen(x) = Nutzen_max · (1 − e^(−k · Stufe))\`

Das erste Geld bringt viel Reichweite, jede weitere Stufe immer weniger. Der Balken je Kanal zeigt den erreichten
Anteil am Maximum in Prozent.

## Wirkung
- Marketing erhöht primär die **Reichweite/Fanbindung** und speist daraus **kleine** monatliche Zusatzerträge:
  **Merchandising** und **Sponsoring** (in den Finanzen unter den jeweiligen Einnahme-Kategorien gebucht).
- Auf das **Vereinsansehen** wirkt Marketing nur **sehr schwach** (maximal +0,05 Reputationspunkte pro Monat) —
  Ansehen entsteht vor allem aus sportlichem Erfolg.
- Alle Kosten und Erträge werden **monatlich** (am 1.) gebucht und mit economyScale ära-gerecht skaliert; die
  Ausgaben laufen unter der Kategorie **„Sonstiges" (other)**.

Marketing ist damit bewusst **kein Selbstläufer**: Es lohnt sich in Maßen, ersetzt aber niemals den sportlichen Erfolg.

## Weitere Erlösquellen im Marketing-Bereich
Unter den Werbereglern zeigt der Bereich drei zusätzliche Karten des Finanzsystems:
- **Mitgliedsbeiträge:** erwartete Monats-/Jahreseinnahme (ansehensabhängig, siehe *Einnahmen & Formeln*).
- **Catering-Betriebsform:** Umschalter Eigenbetrieb/Umsatzbeteiligung/Verpachtung mit Netto-pro-Kopf- und Fixkosten-Vergleich (siehe *Catering & Betriebsformen*).
- **Programmhefte / Spieltag:** erwartete Zuschauerzahl sowie erwarteter Programm- und Catering-Erlös je Heimspiel (siehe *Ticketpreis & Preiselastizität*).`,
  },
  // ---------------------------------------------------------------------------
  // KALENDER & AKTIVITÄTEN
  // ---------------------------------------------------------------------------
  {
    id: 'calendar-overview',
    category: 'calendar',
    title: 'Kalender & planbare Aktivitäten',
    keywords: ['kalender', 'monat', 'aktivität', 'trainingslager', 'freundschaftsspiel', 'teambuilding', 'planen', 'freie tage', 'kollision', 'kalenderstreifen', 'zeitlauf', 'pause'],
    body: `## Kalenderstreifen während des Zeitlaufs
Einen festen Kalenderstreifen oben auf den Seiten gibt es nicht mehr – die Seiten nutzen die volle Höhe. Sobald du
**Weiter** drückst (oder die **Leertaste**), blendet sich in der Bildschirmmitte ein Streifen mit **11 Tagen** ein:
**3 vergangene Tage**, **heute** im festen Bernstein-Rahmen und die **7 kommenden Tage**. Mit jedem Tageswechsel
gleitet der Streifen einen Tag weiter (so schnell wie dein Spieltempo); die äußeren Tage blenden zum Rand hin aus.

Je Tag siehst du das wichtigste Ereignis und bis zu zwei weitere: **eigene Spiele** mit Wappen des Gegners,
Heim/Auswärts und Wettbewerb (Liga, Pokal, Europapokal, Testspiel) – gespielte Partien links mit **Ergebnis** –,
dazu **Auslosungen**, **Transferfenster**, **Vertragsenden** im eigenen Kader, **Hallenturniere**, **Trainingslager**,
Bewertungen, Winterpause, Saisonstart und -ende.

Der Hintergrund ist währenddessen unscharf und abgedunkelt; nur der **Pause**-Knopf oben rechts bleibt klar.
Anhalten kannst du mit dem Knopf, der Leertaste oder einem Klick irgendwo auf den Hintergrund. Hält das Spiel von
selbst an (dein Spieltag, Auslosung, Briefing, Ereignis mit Entscheidung, Saisonende), blendet der Streifen weich aus;
Popups (Auslosung, Briefing, Textmodus, Spielbericht) erscheinen nie zusammen mit ihm.

## Monatskalender
Unter **Zentrale › Kalender** siehst du den aktuellen Monat als Tagesraster (Mo–So).
Du blätterst mit **‹ Vormonat** / **Folgemonat ›**. Die Tage sind farblich markiert:

- **frei** (grün umrandet, klickbar) — planbar
- **Spiel/Planung** (rot) — Ligaspiel , Pokalspiel oder bereits geplante Aktivität 
- **heute** (Bernstein-Rahmen)
- **Auswahl** (grün = gültiger Zeitraum, rot = Kollision)

## Aktivitäten planen
Oben wählst du den Typ, bei mehrtägigen Aktivitäten die Dauer, klickst einen **freien Starttag** und bestätigst
mit **„Einplanen"**. Planung ist **nur an freien Tagen** möglich — der komplette Zeitraum darf mit **keinem
Spiel und keiner anderen Aktivität** kollidieren.

| Aktivität | Dauer | Kosten (Basis) | Effekt | Erlös |
|---|---|---|---|---|
| Freundschaftsspiel | 1 Tag | keine | Fitness +5, Form +4 | +7.000 (Basis) |
| Teambuilding-Event | 1–2 Tage | 1.800/Tag | Form +3, Moral ↑ | – |

## Buchung & Wirkung
- **Kosten** werden **sofort bei der Planung** vom Vereinskonto gebucht (ära-gerecht skaliert). Noch nicht
  begonnene Aktivitäten lassen sich **stornieren** (Kosten werden erstattet).
- Die **Effekte** (Fitness/Form/Moral auf den Kader) treten ein, sobald das **Enddatum** im Kalenderlauf erreicht
  ist (\`App.processDay\`). Der Erlös eines Freundschaftsspiels wird dann als Einnahme gebucht.
- Alle Datumsberechnungen laufen konsequent in **UTC**.

**Trainingslager** werden nicht mehr hier, sondern unter **Training › Trainingslager** gebucht (siehe Artikel „Trainingslager“).
Zugesagte Hallenturniere und gebuchte Lager erscheinen im Kalender als belegte Tage.`,
  },
  {
    id: 'winter-break',
    category: 'calendar',
    title: 'Winterpause & Spielplan',
    keywords: ['winterpause', 'rückrunde', 'hinrunde', 'spielplan', 'englische woche', 'pause', 'wm', 'katar', 'ddr', 'spieltag'],
    body: `## Historische Winterpause
Die Pause liegt in jeder Saison dort, wo sie in der Bundesliga wirklich lag (DFB-Datencenter, RSSSF; Jahre ohne Beleg werden innerhalb ihrer Epoche interpoliert):

| Epoche | typische Pause | Wochen | Beispiel |
|---|---|---|---|
| 1975–1985 | Mitte Dezember bis Mitte/Ende Januar | 3–8 (meist 5–6) | 1975/76: 6.12. bis 17.1. |
| 1986–1996 | Anfang Dezember bis Mitte/Ende Februar | 8–11 | 1986/87: 6.12. bis 21.2. (elf Wochen) |
| 1997–2008 | Mitte Dezember bis Ende Januar | 5–9 (meist 6) | 1997/98: 20.12. bis 31.1. |
| 2009–2019 | kurz vor Weihnachten bis Mitte/Ende Januar | 4–6 | 2017/18: 16.12. bis 13.1. |
| ab 2020 | so nah an Weihnachten wie möglich bis ~10. Januar | 3 | 2025/26: 20.12. bis 10.1. |

Sonderfälle: **WM in Katar 2022** – Pause vom 13. November bis 20. Januar. Die Corona-Unterbrechung 2019/20 und die gestauchte Pause 2020/21 werden **nicht** nachgebaut.
Ab 2027/28 wird die heutige Regel fortgeschrieben (Annahme: WM 2034 wieder im Winter).

## Spielplan
- Spieltage liegen **samstags**. Die Pause beginnt nicht immer nach der Hinrunde – wie 1987/88 (19 Spieltage vor der Pause) oder 2024/25 (15).
- Passen nicht alle Spieltage auf die Samstage, gibt es **englische Wochen** (Mittwoch) – vor allem in der 2. Liga mit 38 Spieltagen und in den langen Pausen der 80er/90er.
- **Saisonende** je Epoche: bis 1991 Mitte Juni, danach Ende Mai, in WM-Jahren Mitte Mai oder früher (1986: 26. April). Die 2. Liga beginnt eine bzw. (ab 2009) zwei Wochen früher.
- **DDR-Oberliga/DDR-Liga** (bis 1990/91): 26 Spieltage ab Mitte August, Pause von Mitte Dezember bis Ende Februar (9–11 Wochen), Saisonende Ende Mai.
- Laufende Saisons behalten ihren Spielplan; die neuen Termine gelten ab dem nächsten Saisonwechsel.
- Pokal- und Europapokalrunden weichen allen Ligaspieltagen aus (Europapokal auch denen der anderen West-Ligen).

## In der Pause
- **Hallenturniere** und das **Hallen-Masters** (Mitte Januar) liegen in der Pause, ebenso das **Winter-Trainingslager** (KI-Vereine in den letzten vier Wochen vor dem Rückrundenstart).
- **Frische und Fitness** erholen sich täglich. Ohne Spielrhythmus driftet die **Form** aller Spieler leicht zur Mitte (0,5 % je Tag): Formstarke verlieren in drei Wochen ≈ 1–2 Punkte, in elf Wochen ≈ 6; Formschwache fangen sich. Training bringt in der Pause Fitness, aber kein Form-Plus.`,
  },
  {
    id: 'training-camps',
    category: 'calendar',
    title: 'Trainingslager',
    keywords: ['trainingslager', 'camp', 'türkei', 'belek', 'katar', 'dubai', 'florida', 'spanien', 'asien', 'jetlag', 'sportschule', 'alpen', 'hotel', 'unterkunft', 'höhentraining', 'schwerpunkt', 'disziplin', 'sponsor', 'dünen', 'malente', 'hennef', 'planer', 'karte', 'reisegruppe', 'südafrika', 'bilanz'],
    body: `## Wo und wann
Unter **Training › Trainingslager** buchst du je Saison ein **Sommerlager** (Vorbereitung bis kurz vor dem 1. Spieltag) und ein
**Winterlager** (in der Winterpause – deren Länge hängt von der Saison ab, siehe „Winterpause & Spielplan“). Die Ziele werden so
freigeschaltet, wie sie historisch aufkamen – und zunächst nur für Vereine, die es sich damals leisten konnten (Ansehen):

| Region | Ziele | ab |
|---|---|---|
| Sportschulen | Kaiserau, Hennef (Halle mit Kunstrasen seit 1965), Wedau, Grünberg, Barsinghausen, Malente (WM-Quartier 1974) | 1975 |
| Nord- und Ostsee | Norderney, Sylt (Sommer, Dünenläufe), Timmendorfer Strand (auch Winter) | 1975 |
| Mittelgebirge | Harz, Schwarzwald (u. a. Leistungszentrum am Feldberg, 1.350 m), Sauerland | 1975 |
| Alpen (Sommer) | Tegernsee 1975; Tirol, Zillertal, Salzburger Land, Kärnten 1977; Steiermark, Schweiz, Südtirol 1980 | 1975–1980 |
| Höhentraining | Engadin/Wallis (St. Moritz, Saas-Fee, ~1.800 m): 1980 ab Ansehen 65, ab 1992 für alle | 1980 |
| Süden (Winter) | Kanaren 1980, Andalusien 1982, Mallorca 1985, La Manga und Algarve 1990, Türkei 1992 (ab 1996 für alle), Malta und Zypern 1995 | 1980–1995 |
| Fernreisen | VAE 1984 (nur Ansehen ≥ 85), Florida 1992, Katar 2011, USA-Tour 2014, Asien-Reise und Südafrika (Kapstadt/Johannesburg, Winter) 2015; Corona-Pausen 2020–2022 | 1984– |

## Planen
Jedes Fenster hat seinen eigenen Knopf (**Sommerlager planen** bzw. **Winterlager planen** auf der Karte des Fensters; der
große Knopf rechts plant das nächste freie Fenster). Im Planer selbst wechselst du nicht zwischen Sommer und Winter. Er führt
in drei Schritten; rechts zeigen **Wirkungsbalken** (wie in der Taktik) bei jeder Wahl, was das Lager bringt: Fitness,
Taktik & Form, Teamgeist, Erholung, Verletzungsrisiko und Kosten im Verhältnis zur Kasse. Jeder Balken zeigt eine **Spanne**
(heller Bereich) und den Erwartungswert (Strich): Fitness und Form schwanken mit dem Wetter (bei Ausfallrisiko r zwischen
1 − 0,6·r und 1 + 0,3·r der Erwartung), der Teamgeist mit dem Zufall in der Reisegruppe, die Verletzten zeigen die Zahl, die in
8 von 10 Lagern nicht überschritten bzw. erreicht wird. Erholung und Kosten stehen vorher fest.
1. **Zeitraum:** Kalender der Sommervorbereitung bzw. Winterpause. Pflichtspiele und zugesagte Hallenturniere sind gesperrt,
   die erste Woche (Vorlauf) ebenso; kurzfristige Tage (unter 21 Tagen) sind markiert. Dauer 5–14 Tage. Fährst du mit der Maus
   über einen Tag, siehst du das Lager ab diesem Tag als Vorschau; ein **Klick auf den Anreisetag** springt direkt zu den Zielen.
2. **Ziel & Unterkunft:** Karte mit Umschalter **Deutschland & Alpen, Europa & Mittelmeer, Afrika, Asien & Naher Osten,
   Amerika, Welt**. Gezeigt werden nur die Ziele, die für dieses Fenster und Jahr **in Frage kommen** (buchbar); gesperrte
   (Ansehen, Sponsor-Pflicht, Corona) blendest du mit **gesperrte zeigen** gedimmt ein. Über jedem Punkt zeigen **Sonne**
   und **Schneeflocke**, ob der Ort im Sommer, im Winter oder in beiden Fenstern gebucht werden kann. Überfahren zeigt eine
   Kurzinfo (Ort, Jahreszeiten, Klima im Monat), ein Klick **Vor- und Nachteile** (Klima im gewählten Monat, Reise und Jetlag,
   Anlage, Höhe, Ablenkung, Sponsor- und Image-Folgen, andere Vereine vor Ort) und die Unterkünfte mit Gesamtpreis.
3. **Reisegruppe:** wer mitfährt; beide Listen (Profis und Jugend) lassen sich über die Spaltenköpfe sortieren. Die
   **Schwerpunkte** tragen dieselben Symbole wie die Bausteine im Trainingsplan. Verletzte bleiben zunächst zur Reha daheim (mit Schwerpunkt Regeneration lohnt es, sie
   mitzunehmen). Bis zu **6 Spieler aus B- und A-Jugend** können mit – sie lernen im Training mit den Profis besonders viel
   (Entwicklung ×1,3, hohe Moral-Chance). **Gesunde Profis, die daheim bleiben, sind zu 40 % enttäuscht** (Moral −1).
   Die Kosten richten sich nach der Größe der Reisegruppe (Spieler plus rund neun Betreuer); mindestens 11 Spieler.

## Unterkunft und Anlage
Jedes Ziel bietet mehrere **Unterkünfte** – von der Sportschule mit Mehrbettzimmern und der Pension über Mittelklasse- und
Sporthotels bis zum Luxus-Resort. Manche kommen erst später dazu (z. B. Belek-Resorts ab 1996, Haus Schleiden in Hennef ab 2006).
Die Vergleichstabelle zeigt:
- **Komfort** (1–4): Zufriedenheit +2 ± 1,5 je Stufe, etwas mehr Moral. In der **einfachsten Stufe murren ältere Stars** (ab 28 Jahren) bei großen Vereinen.
- **Anlage:** Zahl der Plätze (ein Platz bremst Taktik-Arbeit), Rasenzustand, **Halle** und **Kunstrasen** – im Winter fangen sie Frost und Schnee ab.
- **Kraftraum** (vor 1985 nur Hantelraum), **Regeneration** (Sauna → Physio/Bäder → ab 1998 Eisbad, ab 2012 Kältekammer), **Küche** (Ernährungsplan wirkt erst ab den 2000ern voll).
- **Ruhe und Ablenkung:** Strand, Nachtleben, Kasino und Luxus verführen die weniger Professionellen zu **Disziplinverstößen** (Professionalität −3, Form −2). Abgeschiedenheit (Gasthof im Talschluss, Malente) **stärkt** dagegen die Disziplin.
- **Laufstrecken:** Dünen, Strand, Wald, Berg geben bei Kondition zusätzliche Fitness (Dünen etwas verletzungsanfälliger).
- **Höhe:** ab 1.000 m ein Teil, ab 1.500 m fast die Hälfte der Konditionswirkung **verzögert** – sie kommt rund **12 Tage nach der Rückkehr**; die Höhe zehrt an der Frische.

Das **Wetter** kommt aus einer Klimatabelle je Monat: Januar in Mitteleuropa und im Gebirge mit großem Ausfallrisiko und
gefrorenen Plätzen, Mittelmeer und Kanaren mild, die Golfstaaten im Winter ideal. **Rummel** (Zaungäste, Presse, Berater) kostet
etwas Trainingszeit; heimatnahe Lager bringen dafür Fan-Stimmung.

## Trainingsschwerpunkt
| Schwerpunkt | Wirkung |
|---|---|
| Ausgewogen | üblicher Mix |
| Kondition | Fitness ×1,35, Entwicklung ×0,75, Verletzungen ×1,3, müde Beine (Frische −8) |
| Taktik | Entwicklung ×1,5, Form ×1,25, Fitness ×0,8 |
| Mannschaftsgeist | Moral-Chance ×2, Zufriedenheit +3, Fitness ×0,75 |
| Regeneration | Verletzungen ×0,45, Frische +12, mitreisende Verletzte werden schneller fit, Fitness ×0,55 |
| Jugendintegration | Spieler bis 21: Entwicklung ×2,4, mehr Testspiel-Minuten und Moral |

## Buchung
- Mindestens **7 Tage im Voraus**; unter 21 Tagen kostet es **20 % Aufschlag**. Storno bringt **50 %** zurück.
- Kosten = (Reise + Tagessatz der Unterkunft × Tage × Schwerpunkt-Faktor) × Tross-Faktor (Ansehen) × Wirtschaftsindex – auf dem
  Zielniveau (Erstligist 1975 ≈ 4,5 Mio. DM Umsatz): Sportschule eine Woche ≈ 9.000–12.000 DM (1975), Luxushotel am See ≈ das Dreifache.
- Das Lager darf nicht mit Pflichtspielen oder **zugesagten Hallenturnieren** kollidieren; offene Hallen-Einladungen im Zeitraum werden abgesagt.
- **Sponsor-Klausel:** Schreibt ein Sponsorvertrag ein Pflicht-Trainingslager vor (z. B. im Herkunftsland des Sponsors), ist für
  dieses Fenster nur dieses Ziel buchbar – auch ohne das sonst nötige Ansehen. KI-Vereine halten sich ebenfalls daran.

## Wirkung (bei Rückkehr)
- **Kondition:** Fitness ≈ Tage × 1,6 (Sommer) bzw. 1,3 (Winter) × Platzqualität × Schwerpunkt × Ausstattung, minus Wetterausfälle. Die Vorschau zeigt die Spanne je nach Wetter.
- **Taktik/Technik:** Entwicklungspunkte; Chance auf bessere **Moral** (Mannschaftsgefüge), Zufriedenheit.
- **Risiken:** Verletzungen (schlechte Plätze, harte Umfänge, Testspiele), **Reisestrapazen** (Bus/Bahn: Stunden × 0,8/0,5; Flug: Flugstunden × 1,6 + Zeitzonen × 3; Form −Zeitzonen × 0,7), Disziplin.
- **Testspiele:** Erlös und Spielpraxis, stärkere Gegner bringen mehr Form, aber mehr Verletzungsrisiko; Asien-/USA-Reisen bringen viel Geld und Bekanntheit, aber wenig Training.
- **Kritik:** Katar (ab 2014, verstärkt ab 2020), Golf- und Marketingreisen kosten Fan-Stimmung.

## Bilanz und Archiv
Am letzten Lagertag erscheint eine kurze **animierte Bilanz** (überspringbar): Gesamterfolg 0–100 (Wetterglück, Fitness-Zuwachs,
Entwicklung, Stimmung, minus Verletzte und Disziplinverstöße), Vorher/Nachher von Fitness, Form, Frische und **Teamgeist**
(mittlere Moral des Kaders), Kosten und Erlöse sowie die Spieler, die **am meisten profitiert** haben, und die **Sorgenkinder**
(Verletzte, Verstöße, enttäuschte Daheimgebliebene). Unter **Vergangene Lager** bleibt die gemessene Wirkung jedes Lagers
abrufbar; ein Höhentraining wird nachgetragen, sobald es greift.

## KI-Vereine
Alle Vereine fahren: Ziel nach Größe und Epoche (Kanaren in den 80ern, Belek-Boom 1998–2016, Rückkehr nach Spanien ab 2017),
Unterkunft nach Kasse und Ansehen, Schwerpunkt nach Trainerstil (Konter → Kondition, Offensiv → Taktik, Jugend-Philosophie →
Jugendintegration). Sie zahlen über ihre Finanzen und bekommen rund ein Drittel der Wirkung.`,
  },
  {
    id: 'indoor-football',
    category: 'calendar',
    title: 'Hallenfußball & Hallen-Masters',
    keywords: ['halle', 'hallenturnier', 'masters', 'hallenpokal', 'budenzauber', 'bande', 'westfalenhalle', 'olympiahalle', 'winterpause'],
    body: `## Geschichte im Spiel
- **1976–1987:** Einladungsturniere mit Bundesligisten (Dortmund, Berlin, Stuttgart, München, Frankfurt) – ohne Endrunde.
- **1988–2001: DFB-Hallenpokal.** Qualifikationsturniere (1988: 18, bis 1997: 16, ab 1998: 4), Wertung nach **Durchschnittspunkten je Spiel**
  (ein einziges Turnier kann reichen), die **8 Besten** spielen das **Hallen-Masters** (Frankfurter Festhalle, Westfalenhalle Dortmund, Olympiahalle München – Ort wie in der Wirklichkeit).
- **Termine:** Alle Turniere liegen in der echten Winterpause der Saison (Artikel „Winterpause & Spielplan“), nie auf Pflichtspieltagen. Die Tour-Turniere laufen bis kurz vor dem
  **Masters**, das wie historisch **Mitte Januar** stattfindet (Wochenende um den 13.1.); ohne Masters enden die Turniere Ende Januar – der Februar der langen Pausen gehört dem Trainingslager.
- **2002–2004:** nur noch wenige Regionalturniere. **Danach findet nichts mehr statt** (Chronik: „Hallen-Masters abgeschafft“).

## Modus
Sechs Teams je Turnier (zwei Dreiergruppen, Halbfinale, Spiel um Platz 3, Finale); Masters mit zwei Vierergruppen über zwei Tage.
Fünf Feldspieler plus Torwart, Rundumbande, Gruppenspiele 12 Minuten, K.-o.-Spiele 2 × 10 Minuten, Neunmeterschießen bei Remis,
Zwei-Minuten-Strafen. Die Hallenstärke zählt Technik, Ballkontrolle, Antritt und Wendigkeit stärker als Kopfball und Härte; Außenseiter gewinnen öfter als draußen.

## Deine Entscheidung
Einladungen kommen Anfang November als Nachricht und stehen unter **Statistiken › Halle**: **Stammkräfte**, **gemischt**, **Nachwuchs** oder **Absage**.
- **Vorteile:** Antrittsgeld und Prämien (Masters nominal: 1988 Sieger 40.000 DM, ab 1989 120.000 DM; Startgeld 1994 50.000, 1996 200.000, ab 1997 350.000 DM),
  Fan-Stimmung (Heimturnier), Spielpraxis und Entwicklungspunkte für Reservisten/Junge, Moral bei Turniersieg, Masters-Titel in der Vereinshistorie (+Marke, +Ansehen).
- **Nachteile:** Verletzungen durch Hallenboden und Bande (≈ 1,6 % je Spieler und Turniertag), Frische −9 und Fitness −2 je Tag, kürzere Pause,
  Konflikt mit dem Trainingslager. **Absage:** Fan-Stimmung −1 (Heimturnier −2,5, Masters −1,5) und Verärgerung – wer oft absagt, wird seltener eingeladen.

## KI-Vereine
Alle Vereine spielen mit: Teilnahme nach Größe, Epoche und Trainer (offensive und Jugend-Trainer lieber). Spitzenvereine schonen ab Mitte der 90er ihre Stars
und verzichten öfter auf das Masters – wie 1988, als zehn qualifizierte Bundesligisten absagten.`,
  },
  // ---------------------------------------------------------------------------
  // Verband-POKAL
  // ---------------------------------------------------------------------------
  {
    id: 'cup-overview',
    category: 'cup',
    title: 'Landespokal — Überblick & Format',
    keywords: ['pokal', 'dfb', 'ko', 'knockout', 'runde', 'finale', 'amateure', 'turnierbaum', 'bracket'],
    body: `## Landespokal
Parallel zur 1. Liga läuft der **Landespokal** als reiner **K.-o.-Wettbewerb**. Er hat eine eigene Seite (**Pokal** in der Navigation) mit Turnierbaum, deinem eingefärbten Pokalweg und der Preisgeld-Leiter.

## Teilnehmerfeld — 32 Mannschaften
- **18 Bundesligisten** (alle Erstligavereine der Saison)
- **14 generierte Amateurvereine** (kleine Reputation 30–55, kleines Stadion, deterministisch erzeugt)
- Zusammen ergibt das ein volles **32er-Feld** für fünf Runden.

## Fünf Runden bis zum Titel
1. **1. Hauptrunde** (32 → 16)
2. **Achtelfinale** (16 → 8)
3. **Viertelfinale** (8 → 4)
4. **Halbfinale** (4 → 2)
5. **Finale** (2 → 1 = Pokalsieger)

## Spielmodus je Begegnung
- **Ein Spiel entscheidet** (Single-Leg). Der **zuerst gezogene Verein hat Heimrecht** – ab 1982/83 spielt ein **Amateurverein gegen Profis immer zu Hause** (siehe *Pokalauslosung*).
- Steht es nach **90 Minuten** unentschieden, folgt die **Verlängerung** (2 × 15 Minuten).
- **Bis 1990/91: Wiederholungsspiel.** Steht es auch nach 120 Minuten unentschieden, wird das Spiel **mit getauschtem Heimrecht wiederholt** (eine Woche später, über die Feiertage schon nach drei Tagen). Erst wenn auch die Wiederholung nach Verlängerung unentschieden endet, entscheidet das Elfmeterschießen. Das **Endspiel** wurde zuletzt **1977** wiederholt (Köln – Hertha 1:1 n. V., 1:0) – im Spiel bis 1976/77, danach Elfmeterschießen im Finale.
- **Ab 1991/92:** nach der Verlängerung direkt **Elfmeterschießen** (Best-of-5, danach „Sudden Death").
- In der Anzeige stehen **n.V.** bzw. **i.E.** hinter dem Ergebnis; Wiederholungen mit dem Ergebnis des ersten Spiels („Wdh., zuvor 1:1 n. V.“). Im Kalender steht der Wiederholungstermin nur, wenn dein Verein ein Wiederholungsspiel hat.
- Quelle: DFB-Pokal-Regeln („replayed with the home field right reversed“, Abschaffung der Wiederholungen 1991).

## Auslosung
- **Jede Runde wird an einem eigenen Termin ausgelost** (die 1. Hauptrunde im Sommer, die Folgerunden am Wochenende nach der Vorrunde) — es gibt keinen festen Turnierpfad. Termine, Regeln und die Ziehungs-Show: *Pokalauslosung*.
- Alle Auslosungen leiten ihren Zufall aus einem **festen Pokal-Seed** ab. Derselbe Spielstart erzeugt reproduzierbar denselben Wettbewerb.`,
  },
  {
    id: 'cup-draw',
    category: 'cup',
    title: 'Pokalauslosung — Termine, Regeln & Ziehungs-Show',
    keywords: ['auslosung', 'ziehung', 'losfee', 'lostopf', 'heimrecht', 'amateure', 'setzliste', 'länderschutz', 'zürich', 'genf', 'nyon', 'monaco', 'sportstudio', 'wiederholung', 'turnierbaum', 'auswärtstore', 'wiederholungsspiel', 'regeln'],
    body: `## Wann wird gelost?
Die Paarungen entstehen erst **am Tag der Auslosung** – vorher steht im Pokalbaum „Auslosung am …“, im Kalender ist der Termin eingetragen. Die Spieltermine selbst ändern sich dadurch nicht.

| Wettbewerb | Epoche | 1. Runde | Folgerunden |
|---|---|---|---|
| Landespokal | bis 2016/17 | Samstag Mitte Juli, Fernsehstudio | Samstag nach der Vorrunde |
| Landespokal | ab 2017/18 | erster Sonntag der Saison, Fußballmuseum Dortmund (historisch schon im Juni) | Sonntag nach der Vorrunde |
| Europapokal | bis 1989/90 | Anfang Juli, Zürich | Freitag nach der Vorrunde |
| Europapokal | 1990–1997 | Mitte Juli, Genf | Genf, ab 1995 Nyon |
| Europapokal | ab 1998 | Ende August, Monaco (zum Supercup) | Nyon |

Liegt zwischen zwei Europapokal-Runden die Winterpause, wird Mitte Dezember gelost. Das **Finale** wird nicht gelost: Die Halbfinalsieger stehen fest.

## Regeln der Ziehung
- **Landespokal bis 1981/82:** ein Lostopf, der zuerst gezogene Verein hat Heimrecht.
- **Landespokal ab 1982/83:** In der 1. Hauptrunde gibt es **zwei Töpfe** (Amateure, Profis); jede Paarung beginnt mit einer Amateurkugel. In allen Runden bis zum Halbfinale hat ein **Amateurverein gegen Profis Heimrecht** – auch wenn die Profikugel zuerst kam.
- **Europapokal (K.-o.-Runden):** In der ersten Runde sind die stärkeren Vereine **gesetzt** und treffen auf Ungesetzte; je Paarung entscheidet das Los, aus welchem Topf die erste Kugel kommt – der zuerst gezogene Verein hat im Hinspiel Heimrecht. **Länderschutz** in der ersten Runde (im Europa-Pokal bis 2003 auch in der zweiten): Passt die gezogene Kugel nicht, geht sie zurück in den Topf. Nach einer Gruppen- oder Ligaphase sind die **besser Platzierten gesetzt**, spielen zuerst auswärts und haben das Rückspiel daheim; Duelle aus derselben Gruppe oder demselben Land sind ausgeschlossen.
- **Gruppenauslosung:** Lostöpfe nach Stärke (in der zweiten Gruppenphase 1999–2003: Gruppensieger und Gruppenzweite), aus jedem Topf ein Verein je Gruppe, keine zwei Vereine eines Landes in einer Gruppe. Die Kugel geht in die erste Gruppe, in die sie passen darf. **Ligaphase** (ab 2024/25): Töpfe nach Stärke, jeder Verein bekommt zwei Gegner aus jedem Topf (Konferenz-Liga: einen), keine Gegner aus dem eigenen Land.

## Wie wird gespielt? (Regeln dieser Runde)
Vor jeder Ziehung zeigt der Startbildschirm die Regeln der Runde – genau so, wie das Spiel sie austrägt, und das ist das historische Vorbild der Saison (*Europapokal — Formate je Epoche*):
- **Hin- und Rückspiel** im Europapokal mit Gesamtergebnis, **Auswärtstorregel** bis 2020/21 (auch in der Verlängerung), Verlängerung und Elfmeterschießen erst im Rückspiel; Endspiele als ein Spiel (das Europa-Pokal-Finale bis 1996/97 mit Rückspiel).
- **Gruppenphase/Ligaphase** mit Punkten je Sieg, Wertung bei Punktgleichheit und wohin welcher Platz führt (auch der Wechsel in einen anderen Wettbewerb).
- **Landespokal:** ein Spiel, bis 1990/91 mit Wiederholungsspiel (Endspiel bis 1976/77), danach Verlängerung und Elfmeterschießen.
- Dazu Lostöpfe, Heimrecht, Setzliste und Länderschutz der Runde. In der ersten Runde nennt der Bildschirm das Format der Saison; Qualifikationsrunden werden im Spiel nicht ausgespielt.
- Spielstände aus älteren Versionen spielen den **laufenden** Wettbewerb noch im alten Modus (ein Spiel je Runde) zu Ende – der Startbildschirm sagt das dann so.

## Die Ziehungs-Show
Am Auslosungstag hält die Zeit an und die Show öffnet im Vollbild mit dem **Startbildschirm** (Wettbewerb, Runde, Termin, Ort, Regeln). Die Ziehung beginnt erst mit **Mit der Auslosung beginnen** (oder Leertaste/Enter); **Ergebnis sofort zeigen** (Esc) springt gleich zur Übersicht. Die Show sieht aus wie eine **Gala**: Scheinwerfer, Lichtwände, in der Mitte eine Karte mit Pokal und Titel. Oben steht der **Lostopf** als Raster aller Teilnehmer (bei mehreren Töpfen je Topf eine Reihe). Wird ein Verein gezogen, verschwindet er aus dem Raster – sein Feld bleibt leer, nichts verrutscht – und taucht unten in der **Paarungsliste „Heim – Gast“** auf; die neue Zeile leuchtet kurz auf. Darunter ordnet das Kommentarband ein („Ein Kracher!“, „Der Amateurverein hat Heimrecht“); der runde Knopf unten rechts startet die Ziehung bzw. holt die nächste Kugel. Ort und Sendung (Fernsehstudio der 70er, TV-Studio, Fußballmuseum, Verbandssaal, Gala in Monaco) stehen oben links. Am Ende steht **dein Los**: Gegner, Termin, Heim/Auswärts und der Stärkevergleich; ein Klick aufs Wappen öffnet das Vereinsprofil.
- **Tempo** langsam/normal/schnell (etwas ruhiger als früher: eine Ziehung dauert rund 30 % länger), **Pause** (Leertaste), **Bis zu meiner Ziehung**, **Überspringen** (Esc; Esc in der Zusammenfassung schließt).
- **Nach der Ziehung** oben drei Reiter: **Dein Los** (bzw. das Topspiel, wenn dein Verein nicht dabei ist), **Alle Paarungen** (Gastgeber des Hinspiels links, Land bzw. Amateur/Profi, Stärke, dein Verein hervorgehoben) und **Turnierbaum** (bisherige K.-o.-Runden mit Hin- und Rückspiel klein und Gesamtstand fett, n. V./i. E./Auswärtstore, die neue Runde, spätere Runden noch offen). Weil jede Runde neu gelost wird, ordnet der Baum die gespielten Begegnungen nachträglich so, dass die Sieger zu ihrer nächsten Paarung führen; er beginnt mit der ersten Runde nach Gruppen-, Ligaphase oder Zwischenrunde.
- **Gruppenauslosung:** Die Kugeln füllen unten die Gruppen (feste Plätze); am Ende **Deine Gruppe** (bzw. **Deine Gegner** in der Ligaphase) und **Alle Gruppen** (bzw. **Alle Töpfe**).
- Wer reduzierte Bewegung im System eingestellt hat, sieht die Ziehung ohne rollende Kugeln.
- **Einstellungen › Pokalauslosung:** *Immer*, *Mit eigenem Verein* (Standard) oder *Nur Nachricht*. Eine Nachricht mit allen Paarungen kommt in jedem Fall.
- **Wiederholung:** In *Statistiken › Pokal* und *International* steht an jeder gelosten Runde der Knopf **Auslosung**. Auf dem Startbildschirm führt **Direkt zur Übersicht** zu Paarungen und Turnierbaum, ohne die Ziehung erneut abzuspielen.
- Spielstände aus früheren Versionen: Die laufende Saison wird wie bisher direkt nach der Vorrunde gelost; die Show gibt es ab der nächsten Saison.`,
  },
  {
    id: 'cup-flow',
    category: 'cup',
    title: 'Pokal — Ablauf, Termine & dein Spiel',
    keywords: ['pokal', 'termin', 'englische woche', 'mittwoch', 'textmodus', 'simulieren', 'kalender', 'nachricht'],
    body: `## Termine (englische Wochen)
- Die Pokalrunden liegen **unter der Woche** und sind **kollisionsfrei zu den Liga-Spieltagen** geplant.
- Fällt ein Wunschtermin auf einen Ligaspieltag (oder zu dicht an die Vorrunde), wird er **tageweise verschoben**, bis er frei ist.
- Jede Runde erzeugt ein eigenes **Kalender-Ereignis**; an deinem Pokalspiel hält das Spiel automatisch an.

## Dein Pokalspiel
- Steht dein Verein in einer Runde, öffnet sich dein Spiel im **Textmodus** (wie in der Liga) — mit Tempo-Wahl, **Pause** und **„Spiel simulieren"** (Überspringen).
- Verlängerung und Elfmeterschießen werden **im Textticker mitverfolgt**.
- Über den Turnierbaum kannst du jede bereits gespielte Begegnung als **Spielbericht** erneut öffnen.

## CPU-Begegnungen
- Alle anderen Begegnungen einer Runde werden **automatisch simuliert** (mit der Aufstellungs-KI).
- Ergebnisse und Weiterkommen erhältst du als **Nachricht** in der Kategorie **Pokal**; die Auslosung der nächsten Runde folgt am Auslosungstag (Nachricht und – je nach Einstellung – Ziehungs-Show).

## Preisgeld & Einnahmen
- **Rundenabhängiges Preisgeld** (pro gewonnener Begegnung, in DM von 1975, später × Wirtschaftsskala):

| Runde | Prämie |
|---|---|
| 1. Hauptrunde | 7.500 DM |
| Achtelfinale | 15.000 DM |
| Viertelfinale | 30.000 DM |
| Halbfinale | 60.000 DM |
| Finale | 120.000 DM |

- Zusätzlich verbucht der **Ausrichter** (Heimrecht) die **Heimspiel-Einnahmen** aus Eintritt, Fanartikeln und TV-Geldern (etwas höher als in der Liga).

## Persistenz
- Der Pokal ist Teil des Spielstands. **Ältere Spielstände** ohne Pokal werden beim Laden **automatisch nachgerüstet** (das Teilnehmerfeld und die Runden werden ab dem aktuellen Datum neu angelegt), ohne den Spielstand zu beschädigen.`,
  },
  // ---------------------------------------------------------------------------
  // EUROPAPOKAL
  // ---------------------------------------------------------------------------
  {
    id: 'euro-overview',
    category: 'euro',
    title: 'Europapokal — Die Wettbewerbe',
    keywords: ['europapokal', 'europa', 'landesmeister', 'meisterliga', 'pokalsieger', 'uefa', 'europa-liga', 'konferenz-liga', 'ec', 'cwc', 'international', 'europacup'],
    body: `## Drei Wettbewerbe, die sich wandeln
Parallel zur Liga und zum Landespokal laufen die europäischen Wettbewerbe der jeweiligen Zeit (Seite **Statistiken › International**):

| Fach | bis | danach |
|---|---|---|
| Pokal der Landesmeister | 1991/92 | **Meisterliga** (ab 1992/93, Gruppenphase schon ab 1991/92, Ligaphase ab 2024/25) |
| Pokal der Pokalsieger | 1998/99 | ruht bis 2020/21, ab 2021/22 **Konferenz-Liga** |
| Europa-Pokal | 2008/09 | **Europa-Liga** (ab 2009/10) |

Formate, Feldgrößen und Weiterleitungen je Saison: *Europapokal — Formate je Epoche*.

## Ausländische Teilnehmer
- In der **ersten Saison** stammen die ausländischen Klubs aus dem Datensatz (\`src/data/europe.ts\`), angelehnt an die Spitzenvereine des Jahres 1975, mit erfundenen Namen (z. B. Madrid Weiß, Liverpool Rot, Amsterdam, Turin Schwarz-Weiß).
- **Ab der zweiten Saison** qualifizieren sich die Auslandsvereine sportlich über ihre eigenen Ligen (siehe **Europa im Hintergrund**) – mit so vielen Vereinen, wie das Format der Saison braucht (bis zu 48 im Europa-Pokal).
- Ihre **Stärke** liegt auf der Skala ~55–82. Sie werden als leichte Einträge geführt; einen vollen Kader bekommen sie, sobald sie deinem Verein zugelost werden.

## Erste Saison 1975/76 — feste historische Starter
- **Landesmeister-Pokal:** Mönchengladbach (Meister 1974/75)
- **Pokalsieger-Pokal:** Frankfurt Rot (Landespokalsieger 1974/75)
- **Europa-Pokal:** Berlin Blau, Offenbach, Duisburg (Ligaplätze 2–4)

Ab 1976/77 werden die deutschen Teilnehmer aus dem Spielstand ermittelt (siehe **Qualifikation**).`,
  },
  {
    id: 'euro-formats',
    category: 'euro',
    title: 'Europapokal — Formate je Epoche',
    keywords: ['format', 'gruppenphase', 'ligaphase', 'hinspiel', 'rückspiel', 'auswärtstore', 'auswärtstorregel', 'zwischenrunde', 'play-offs', 'sechzehntelfinale', 'gruppendritte', 'meisterliga', 'konferenz-liga', 'europa-liga'],
    body: `## Hin- und Rückspiel
- Alle K.-o.-Runden mit **Hin- und Rückspiel**; das **Gesamtergebnis** entscheidet. Das Rückspiel hat der Gegner des Hinspiels daheim.
- **Auswärtstorregel bis 2020/21:** Bei gleichem Gesamtergebnis kommt weiter, wer mehr Tore auswärts erzielt hat – auch Tore in der Verlängerung des Rückspiels zählen. Seit 2021/22 abgeschafft (UEFA-Beschluss vom 24.06.2021).
- **Verlängerung und Elfmeterschießen nur im Rückspiel**, das Hinspiel endet nach 90 Minuten.
- **Endspiele** als ein Spiel (Landesmeister/Meisterliga, Pokalsieger, Konferenz-Liga); das **Europa-Pokal-Finale bis 1996/97 mit Hin- und Rückspiel**, ab 1997/98 ein Spiel.
- Im Textmodus steht beim Rückspiel unter dem Spielstand **Hinspiel, Gesamtstand** und wer gerade (auch durch Auswärtstore) vorn liegt.

## Formate im Spiel
| Saison | Meisterliga / Landesmeister | Europa-Pokal / Europa-Liga | Pokalsieger / Konferenz-Liga |
|---|---|---|---|
| 1975/76–1990/91 | 16 Teams, K.-o. ab Achtelfinale | 32 Teams, K.-o., Finale Hin/Rück (bis 1996/97) | 16 Teams, K.-o. |
| 1991/92–1992/93 | 2. Runde (16), zwei Vierergruppen, Gruppensieger ins Finale | wie oben | wie oben |
| 1993/94 | 2. Runde, zwei Vierergruppen, Halbfinale als ein Spiel beim Gruppensieger | wie oben | wie oben |
| 1994/95–1996/97 | vier Vierergruppen, die ersten zwei ins Viertelfinale | wie oben | wie oben |
| 1997/98–1998/99 | sechs Vierergruppen, Sieger + zwei beste Zweite ins Viertelfinale | Finale ein Spiel | letzte Saison 1998/99 |
| 1999/00–2002/03 | zwei Gruppenphasen (8 und 4 Gruppen), Dritte → 3. Runde Europa-Pokal | 48 Teams ab 2. Runde, 3. Runde mit 8 Gruppendritten | – |
| 2003/04 | acht Gruppen, Achtelfinale, Dritte → 3. Runde Europa-Pokal | wie oben (3. Runde im Februar) | – |
| 2004/05–2008/09 | acht Gruppen, Achtelfinale, Dritte → Sechzehntelfinale | acht Fünfergruppen (4 Spiele), Platz 1–3 + 8 Dritte → Sechzehntelfinale | – |
| 2009/10–2020/21 | wie oben | zwölf Vierergruppen, Platz 1–2 + 8 Dritte → Sechzehntelfinale | – |
| 2021/22–2023/24 | acht Gruppen, Dritte → Zwischenrunde Europa-Liga | acht Gruppen: Sieger → Achtelfinale, Zweite → Zwischenrunde gegen CL-Dritte, Dritte → Konferenz-Liga | acht Gruppen: Sieger → Achtelfinale, Zweite → Zwischenrunde gegen EL-Dritte |
| ab 2024/25 | Ligaphase 36 Teams, 8 Spiele; 1–8 Achtelfinale, 9–24 Play-offs | Ligaphase 36 Teams, 8 Spiele | Ligaphase 36 Teams, 6 Spiele |

Nach 2026 bleibt das letzte Format bestehen.

## Gruppen und Ligaphase
- **Punkte:** Sieg 2 Punkte bis 1994/95, danach 3. Unentschieden 1 Punkt.
- **Wertung bei Punktgleichheit:** bis 1998/99 Tordifferenz, Tore, Auswärtstore; 1999/00–2023/24 zuerst der **direkte Vergleich** (Punkte, Tordifferenz, Tore, Auswärtstore), dann Tordifferenz und Tore; in der Ligaphase Tordifferenz, Tore, Auswärtstore, Siege, Auswärtssiege. Zuletzt entscheidet im Spiel die Stärke (statt Koeffizient/Los).
- Spieltage liegen im Kalender (meist Mittwoch, Europa-Liga und Konferenz-Liga donnerstags), kollisionsfrei zu Liga und Landespokal.
- In *Statistiken › International* zeigt die Ansicht **Gruppen** bzw. **Ligaphase** alle Tabellen: grün = weiter, gedämpft grün = Zwischenrunde/Play-offs, grau = Wechsel in einen anderen Wettbewerb. Unter **Runden** stehen die Spiele je Spieltag.

## Vereinfachungen
- Qualifikations- und frühe Runden werden nicht ausgespielt; das Feld beginnt mit der Runde der Tabelle (z. B. Landesmeister bis 1990/91 im Achtelfinale).
- Startplätze nach dem Rang Deutschlands in der Fünfjahreswertung des Spiels, nicht nach der echten UEFA-Liste jedes Jahres; kein Extraplatz für den Titelverteidiger.
- Quellen und Details: \`src/data/euroFormats.ts\`.`,
  },
  {
    id: 'euro-qualification',
    category: 'euro',
    title: 'Europapokal — Qualifikation & Startplätze',
    keywords: ['qualifikation', 'meister', 'vizemeister', 'pokalsieger', 'finalist', 'kaskade', 'startplätze', 'rang', 'koeffizient'],
    body: `## Deutsche Startplätze (ab 1976/77)
Wie viele deutsche Vereine starten, hängt vom **Rang Deutschlands** in der Fünfjahreswertung des Spiels ab (siehe *Europa im Hintergrund*):

| Saison | Meisterliga | Europa-Pokal / Europa-Liga (inkl. Pokalsieger ab 1999) | Pokalsieger / Konferenz-Liga |
|---|---|---|---|
| bis 1996/97 | 1 (Meister) | Rang 1–3: 4, Rang 4–8: 3, sonst 2 | 1 (Pokalsieger) |
| 1997/98–1998/99 | Rang 1–8: 2 | wie oben | 1 |
| 1999/00–2017/18 | Rang 1–3: 4, Rang 4–6: 3, sonst 2 | Rang 1–6: 3 | – |
| ab 2018/19 | Rang 1–4: 4 | 2 (ab 2021/22) | 1 (ab 2021/22) |

- **Meisterliga:** die ersten Plätze der 1. Liga.
- **Pokalsieger-Pokal (bis 1998/99):** der Landespokalsieger; ist er schon in der Meisterliga, der Pokalfinalist, sonst der nächste Ligaplatz. Ab 1999/00 spielt der Pokalsieger im Europa-Pokal bzw. in der Europa-Liga.
- **Europa-Pokal / Europa-Liga, Konferenz-Liga:** die nächsten Ligaplätze. Kein Verein ist doppelt qualifiziert; die Plätze kaskadieren nach unten.

## Wechsel zwischen den Wettbewerben
Gruppendritte der Meisterliga spielen 1999/00–2023/24 im Europa-Pokal bzw. in der Europa-Liga weiter, Gruppendritte der Europa-Liga 2021/22–2023/24 in der Konferenz-Liga (Tabelle in *Formate je Epoche*). Ab 2024/25 gibt es keinen Wechsel mehr.`,
  },
  {
    id: 'euro-simulation',
    category: 'euro',
    title: 'Europapokal — Simulation, Bestenlisten, Einnahmen & Prämien',
    keywords: ['simulation', 'kader', 'stärke', 'preisgeld', 'prämie', 'startgeld', 'tabelle', 'zone', 'matchengine', 'bestenliste', 'torschützen', 'belastung'],
    body: `## Wie gespielt wird
- **Spiele deines Vereins** (Hin- und Rückspiel, Gruppenspiele) laufen über die **volle Match-Engine** mit Textmodus. Ausländische Gegner bekommen beim Zulosen einmalig einen vollen Kader passend zu ihrer Stärke.
- **Alle anderen Europapokalspiele** laufen im Hintergrund: Tore nach Stärke mit Heimvorteil (früher größer als heute), dazu **Torschützen, Vorlagen, Karten, Einsätze und Zu-null-Spiele**. Deutsche Vereine nehmen ihre echten Spieler, Auslandsvereine einen festen Kurzkader von 16 Spielern, der sich über die Jahre erneuert.
- Deshalb zählen die **Bestenlisten** je Wettbewerb **alle Spiele** – auch Gruppenspiele und Spiele ohne deutsche Beteiligung. Statistik je Wettbewerb getrennt (wer als Gruppendritter wechselt, hat zwei Einträge).

## Einnahmen & Prämien
- **Jedes Heimspiel** bringt Einnahmen (Eintritt je Platzkategorie, Fanartikel, Catering, TV) – im K.-o.-Modus also zwei Spiele je Runde, in der Gruppe drei Heimspiele. Das gilt für alle deutschen Vereine.
- **Startgeld** zu Saisonbeginn (stark steigend mit Meisterliga und Ligaphase, siehe Finanzen).
- **Prämie je gewonnener K.-o.-Runde** (DM von 1975 × Wirtschaftsskala; Finale 120.000, Halbfinale 60.000, Viertelfinale 30.000, Achtelfinale 15.000, davor 10.000 bzw. 8.000 – in den anderen Wettbewerben 80 %; ab 1992 in der Meisterliga bis zum Fünffachen).
- **Prämie je Sieg/Unentschieden in Gruppe und Ligaphase** nach den Verteilungen des Verbands: Meisterliga 2005/06 321.000/161.000 €, 2009/10 800.000/400.000 €, 2016/17 1,5 Mio./500.000 €, 2024/25 2,1 Mio./700.000 €; Europa-Liga 2010/11 140.000/70.000 €, 2018/19 570.000/190.000 €, ab 2024/25 450.000/150.000 €; Konferenz-Liga 400.000/133.000 €. Davor im Spiel zurückgerechnet (Annahme).

## Belastung
Jedes Europapokalspiel kostet Frische und bewegt die Form – bei dir wie bei den KI-Vereinen. Mit Hin- und Rückspiel und sechs bis acht Gruppenspielen kommen deutlich mehr englische Wochen zusammen als früher.

## Nachrichten
- **Auslosung, Hinspiel, Rückspiel, Gruppenspiel und Gruppen-Abschluss** melden sich nur, wenn dein Verein beteiligt ist; europäische Titelträger erscheinen als Chronik-Notiz.

## Alte Spielstände
Ein laufender Europapokal aus einer älteren Version spielt bis Saisonende im alten Modus (ein Spiel je Runde); ab der nächsten Saison gilt das historische Format.`,
  },
  {
    id: 'euro-world',
    category: 'euro',
    title: 'Europa im Hintergrund — Auslandsligen & Koeffizienten',
    keywords: ['europa', 'ausland', 'ligen', 'koeffizient', 'fünfjahreswertung', 'meister', 'pokalsieger', 'teilung', 'sperre', 'welt'],
    body: `## Alle großen Ligen Europas laufen mit
Rund **20 Länder** mit je **1. und 2. Liga** (über 700 Vereine) werden im Hintergrund simuliert. Jeder Auslandsverein ist nur ein schlanker Eintrag (Name, Stadt, Land, Stärke, Farben) – erst wenn dein Verein gegen ihn spielt, entsteht ein voller Kader. Eine komplette Europa-Saison kostet nur Millisekunden, damit das Spiel auch nach Jahrzehnten flüssig bleibt.

## Saison im Zeitraffer
- Am **Saisonende** werden alle Auslandsligen auf einmal ausgespielt (Hin- und Rückrunde, Ergebnisse nach Stärke mit Heimvorteil und Zufall).
- **Auf- und Abstieg:** 3 Vereine je Richtung (2 in kleinen Ligen).
- **Landespokal** jedes Landes: K.-o.-Turnier, Außenseiter gewinnen manchmal.

## Wie sich Vereine entwickeln
- Jeder Verein hat eine **Größe** (Stadt, Tradition, Wirtschaftskraft). Sie zieht seine Stärke langfristig an und wächst mit Titeln und Europapokal-Erfolgen – kehrt aber langsam zur natürlichen Größe zurück. Auch die natürliche Größe verschiebt sich über Jahrzehnte ein wenig (Aufschwung einer Stadt, Investoren, Niedergang), damit Dynastien kommen und gehen.
- Ein **Generationen-Zyklus** sorgt für goldene und magere Jahre: Auch große Vereine erleben Durststrecken, kleine Vereine haben ihre Glanzzeit.
- Das **Niveau der Länder** verschiebt sich über die Jahrzehnte (z. B. wird England ab den 1990ern stärker, Osteuropa schwächer).

## Koeffizienten (Fünfjahreswertung)
- Jede Europapokal-Saison bringt Punkte: 1 für die Teilnahme, 2 je gewonnener K.-o.-Runde, 1 je Sieg und 0,5 je Unentschieden in Gruppe/Ligaphase, 2 Bonus für den Titel. Der Landeswert ist der Schnitt der Starter eines Landes, summiert über die **letzten fünf Saisons**.
- Danach richten sich die Startplätze (Tabelle in *Qualifikation & Startplätze*): Meister der bestplatzierten Länder, ab 1997/98 auch Zweite und Dritte der Spitzenländer in der Meisterliga, Pokalsieger im Pokalsieger-Pokal (ab 1999/00 im Europa-Pokal), dazu die nächsten Plätze nach Rang. Wie viele Auslandsvereine starten, richtet sich nach dem Format der Saison.
- Auch für **Deutschland** wird der Koeffizient mitgeführt.

## Geschichte
- **Sperre englischer Vereine** 1985/86 bis 1989/90.
- **Staatenteilungen:** 1992 zerfallen die Sowjetunion (Russland, Ukraine) und Jugoslawien (Serbien, Kroatien), 1993 die Tschechoslowakei (Tschechien, Slowakei). Vereine wechseln anhand ihrer Stadt in die neuen Ligen, fehlende Plätze füllen neue Vereine auf.
- Alle Vereinsnamen sind erfunden (Stadt, ggf. mit Farbe).`,
  },
  {
    id: 'euro-simulation',
    category: 'euro',
    title: 'Europapokal — Simulation, Preisgeld & Tabellen-Markierung',
    keywords: ['simulation', 'lazy', 'kader', 'stärke', 'preisgeld', 'prämie', 'tabelle', 'zone', 'matchengine'],
    body: `## Wie Begegnungen simuliert werden
- **Dein Verein beteiligt:** die Partie läuft über die **volle Match-Engine** (wie beim Landespokal, inkl. Verlängerung/Elfmeterschießen im Textticker). Ist der Gegner ein ausländischer Verein, wird **einmalig** ein voller Kader passend zur Stärke des Klubs erzeugt (**Lazy-Kader**, ohne Jugendstamm) und dem Spielstand hinzugefügt — nur beim ersten Aufeinandertreffen. So bleibt der Spielstand klein.
- **Neutrale Begegnungen** (dein Verein nicht dabei): reine, **deterministische Stärke-Simulation** (Zufall aus einem Seed der Begegnung). Es wird kein Match-Objekt erzeugt; Ergebnis, ggf. Verlängerung/Elfmeterschießen und Sieger werden direkt gesetzt.
- **Stärke-Basis:** ausländische Vereine nutzen ihren festen Stärkewert; deutsche Vereine den **Kader-Schnitt** (bzw. den Ruf als Rückfall).

## Nachrichten
- **Auslosungs- und Ergebnis-Nachrichten** bekommst du nur, wenn **dein Verein beteiligt** ist (wie beim Landespokal).
- Europäische Titelträger tauchen sonst als dezente **Chronik-/Info-Notiz** auf.

## Preisgeld je gewonnener Begegnung (DM)
Das Preisgeld ist ära-gerecht gestaffelt (Landesmeister-Pokal > Pokalsieger-Pokal > Europa-Pokal) und wird **pro gewonnener Begegnung** verbucht:

| Runde | Landesmeister-Pokal | Pokalsieger-Pokal | Europa-Pokal |
|---|---|---|---|
| 1. Runde (nur Europa-Verband) | — | — | 6.000 |
| Achtelfinale | 15.000 | 12.000 | 12.000 |
| Viertelfinale | 30.000 | 24.000 | 24.000 |
| Halbfinale | 60.000 | 48.000 | 48.000 |
| Finale | 120.000 | 96.000 | 96.000 |

Werte in DM von 1975 (später × Wirtschaftsskala, ab 1992 im Landesmeister-Wettbewerb bis zum Fünffachen). Das große Geld brachten 1975 die ausverkauften Heimspiele.

## Ligatabelle — Europapokal-Zonen (1. Liga)
Die Tabellen-Markierung der 1. Liga zeigt die europäische Qualifikation:
- **Platz 1** → **Landesmeister-Pokal** (Meister-Zone).
- **Platz 2–4** → **Europa-Pokal**.
- Der **Pokalsieger-Pokal** hängt am **Landespokal**, nicht an der Ligatabelle — dafür gibt es keine eigene Tabellenzone (nur ein Legenden-Hinweis).
- Die Abstiegszone unten bleibt unverändert.

## Persistenz
- Die Europapokale sind Teil des Spielstands. **Ältere Spielstände** ohne diese Felder werden beim Laden **automatisch nachgerüstet** (Teilnehmerfeld und Runden ab dem aktuellen Datum), ohne den Spielstand zu beschädigen.`,
  },
  // ---------------------------------------------------------------------------
  // CHRONIK & EPOCHEN
  // ---------------------------------------------------------------------------
  {
    id: 'chronicle-overview',
    category: 'chronicle',
    title: 'Chronik & Epochen — Überblick',
    keywords: ['chronik', 'epoche', 'timeline', 'meilenstein', 'geschichte', 'regel', '1975', 'zeitleiste'],
    body: `## Was ist die Chronik?
Das Spiel beginnt zum **1. Juli 1975** (Saison **1975/76**) und lässt den deutschen Fußball über die Jahrzehnte
historisch mitwachsen. Alle großen Regel-, Wettbewerbs-, Rechts-, Technik- und Wirtschafts-**Meilensteine** sind in
einer zentralen **Chronik** hinterlegt (Bereich **Chronik**, Symbol in der unteren Navigation).

Die vollständige, interaktive Zeitleiste ist **auch direkt hier im Wiki** erreichbar — siehe den Eintrag
**„Chronik der Epochen – Historische Zeitleiste"** in dieser Kategorie.

## Wie Meilensteine ausgelöst werden
Jeder Meilenstein ist einer **Auslöse-Saison** zugeordnet. Sobald diese Saison beginnt (Button **„▶ Neue Saison"**),
- erscheint eine **Meilenstein-Nachricht** im Postfach (Kategorie *Meilenstein*),
- und – falls hinterlegt – wird ein **Spiel-Effekt** angewendet (z. B. Umstellung des Punktesystems, Freischalten eines Features).

In der Chronik siehst du alle Ereignisse chronologisch: **erreichte** (), das **aktuelle** und **bevorstehende**
Meilensteine – jeweils mit Jahr, Saison, Kategorie und Beschreibung.

## Die Meilensteine (1975 → 2030er)
| Saison | Meilenstein | Wirkung |
|---|---|---|
| **1975/76** | 2-Punkte-Regel, drei Absteiger & Trikotwerbung | Startbedingungen; Trikotsponsoring freigeschaltet |
| **1992/93** | Rückpassregel | Torwart darf Rückpass nicht mehr aufnehmen |
| **1992/93** | Europa-Verband Meisterliga | Wettbewerb entsteht |
| **1995/96** | **3-Punkte-Regel** | **3 Punkte pro Sieg — verändert die Tabellenrechnung real** |
| **1995/96** | Bosman-Urteil | ablösefreie Wechsel, EU-Transfermarkt |
| **2010/11** | Financial Fair Play | solide Vereinsfinanzen als Auflage |
| **2015/16** | Torlinientechnik | zweifelsfreie Tor-Entscheidung |
| **2017/18** | Video-Assistent (1. Liga) | VAR in der 1. 1. Liga |
| **2019/20** | Video-Assistent (2. Liga) | VAR in der 2. 1. Liga |

## Neue Saison starten
Am Saisonende wird aus dem **„Weiter"-Button** oben rechts ein **„▶ Neue Saison"-Button**. Ein Klick erzeugt Spielplan,
Tabelle, Kalender und Landespokal der Folgesaison neu, zählt das Saison-Label hoch und löst die fälligen Chronik-Meilensteine
aus. Kader, Finanzen und Jugendakademien bleiben erhalten (der Nachwuchs rückt am 1. Juli automatisch nach).

## Für Entwickler: erweiterbar
Die Chronik liegt als zentrale, leicht erweiterbare Datenstruktur in \`src/data/timeline.ts\` (Array \`TIMELINE\`). Ein neuer
Meilenstein ist einfach ein weiterer Eintrag mit \`season\`, \`type\`, \`title\`, \`description\` und optionalem \`effect\`
(\`pointSystem\` und/oder \`unlock\`-Feature-Flag).`,
  },
  {
    id: 'chronicle-three-point',
    category: 'chronicle',
    title: 'Punktesystem & die 3-Punkte-Regel (1995/96)',
    keywords: ['punkte', '3-punkte', 'drei punkte', 'tabelle', '1995', 'punktesystem', 'sieg'],
    body: `## 2 Punkte bis 1994/95, 3 Punkte ab 1995/96
Das Punktesystem ist **historisch automatisch** und **nicht mehr manuell wählbar**. Zum Spielstart 1975/76 gilt die
klassische **2-Punkte-Regel** (Sieg 2, Remis 1) – und sie bleibt bis einschließlich Saison **1994/95** aktiv.

Mit Beginn der Saison **1995/96** stellt die Chronik automatisch auf die **3-Punkte-Regel** um: **3 Punkte** pro Sieg,
weiterhin **1** für ein Remis. 

## Reale Auswirkung auf die Tabelle
Die Umstellung ist **kein reiner Text**: Beim Auslösen des Meilensteins wird das aktive Punktesystem gesetzt **und die
Tabelle sofort neu berechnet** (\`calculateTable\`). Ab diesem Zeitpunkt werden alle Siege in der Tabellenrechnung mit
3 Punkten gewertet, was Offensivfußball belohnt und die Platzierungen spürbar verändern kann.`,
  },
  {
    id: 'chronicle-economy',
    category: 'chronicle',
    title: 'Steigende Finanzbasis & Währung (DM/EUR)',
    keywords: ['wirtschaft', 'finanzbasis', 'economyscale', 'dm', 'euro', 'währung', '1995583', 'inflation', 'sponsoring'],
    body: `## Warum steigt das Geld über die Jahre?
Der Profifußball ist 1975 finanziell winzig gegenüber heute. Damit die Finanzen glaubhaft mitwachsen, führt das Spiel
einen **Wirtschafts-Index** (economyScale) über eine **Makro-Erlöskurve** (\`src/engine/economy.ts\`).

- **Stützwerte:** historische Größenordnungen der 1. Liga-Gesamterlöse (1975 → 2030) bilden Ankerpunkte.
- **Zwischen den Ankern:** **geometrische Interpolation** \`R(y) = R0 · (R1/R0)^((y−y0)/(y1−y0))\` — gleichmäßiges prozentuales Wachstum.
- **Nach 2030 (Projektion):** jährliche Fortschreibung mit ~**+3,7 %** Basiswachstum, gedämpft durch eine
  **Sättigung** \`d_sat = 0,035 · R/(R + 12 Mrd €)\` und überlagert von deterministischen **±3 %-Schocks** je Jahr.

Aus der Kurve ergibt sich der Skalierungsfaktor: **1975 ≈ 1×**, **2001 ≈ 17×**, **2010 ≈ 29×**, **2030 ≈ 130×**.

## Worauf wirkt der Index?
Vereinseinnahmen **und** Fixkosten skalieren gemeinsam mit \`economyScale(Jahr)\`, damit das gesamte Finanz-Niveau
mitwächst, ohne die Vereine unrealistisch reich werden zu lassen:
- Heimspiel: Ticket-, Fanartikel-, TV-Erlöse und Leistungsprämie
- Monatsabschluss: Sponsoring, Platzierungsbonus, Gehälter, Stab, Stadionunterhalt, Trainingsbetrieb, sonstige Kosten

Das Niveau 1975 ist recherchiert (Erstligist ≈ 4,5 Mio. DM Umsatz). Mit dem Index ergibt sich für einen mittleren Erstligisten etwa
1985 ≈ 11 Mio. DM, 1995 ≈ 30–35 Mio. DM, 2005 ≈ 45 Mio. €, 2015 ≈ 90 Mio. € und 2024 ≈ 220 Mio. €.

## Währungs-Ära DM → EUR
Interne Beträge bleiben **nominal in DM**; die Anzeige rechnet ära-gerecht um:
- **bis 2001:** Deutsche Mark (**DM**)
- **ab 2002:** Euro (**€**), fest mit **1 € = 1,95583 DM**

So zeigt ein und derselbe interne Betrag vor 2002 „… DM" und ab 2002 den korrekt umgerechneten Euro-Wert.`,
  },
];

/** Freitext-Filter über Titel, Body und Keywords. */
export function searchWiki(query: string): WikiArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return WIKI_ARTICLES;
  return WIKI_ARTICLES.filter((a) => {
    const hay = `${a.title} ${a.body} ${(a.keywords ?? []).join(' ')}`.toLowerCase();
    return hay.includes(q);
  });
}

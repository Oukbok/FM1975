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
- Der Button hat eine **feste Größe** und wechselt je nach Kontext die Beschriftung (Weiter / Pause / Simulieren / ▶ Neue Saison), ohne zu springen.
- An wichtigen Ereignissen (**dein Spiel** – hier hält der Vorlauf unmittelbar vor dem Anpfiff an und öffnet das Match-Fenster im Vor-Anpfiff-Zustand –, **große Saison-Bewertung**, Saisonende) hält das Spiel automatisch an. Die Pause landet dabei **genau auf dem betreffenden Tag** (also z.B. **am Spieltag selbst**, nicht am Folgetag): Das angezeigte Datum in der Zentrale bleibt auf diesem Tag stehen, der Tageswechsel wird erst nachgeholt, sobald du den Vorlauf fortsetzt. Die drei kleinen periodischen Leistungsbewertungen laufen dagegen still im Hintergrund und stoppen den Vorlauf nicht. Am Saisonende wird der **Weiter**-Button zu **„▶ Neue Saison"** und startet die Folgesaison samt fälliger Chronik-Meilensteine.

## Punktesystem
- Das Punktesystem ist **historisch automatisch** und **nicht mehr manuell wählbar**: **2 Punkte pro Sieg bis Saison 1994/95**, **ab Saison 1995/96 automatisch 3 Punkte pro Sieg** (Remis stets 1 Punkt).
- Die Umstellung erfolgt ausschließlich über den Chronik-Meilenstein „3-Punkte-Regel" beim Erreichen der Saison **1995/96** — das wirkt **real auf die Tabellenberechnung**.

## Chronik & Epochen
- Historische Meilensteine (Rückpassregel, Meisterliga, Bosman, FFP, Torlinientechnik, VAR …) werden zur jeweiligen Saison ausgelöst — siehe Bereich **Chronik** ().`,
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
Ein Datensatz ist eine einzelne JSON-Datei (\`<id>.fm1975.json\`), die festlegt, womit ein **neues Spiel** startet: Vereine aller Ligen, Wappen und Trikots, Europa (Länder, Starter der ersten Saison), Chronik-Ereignisse, Ligareformen, Einrichtungen, Mitarbeiter-Rollen, Marketing-Kanäle, Namen und Herkünfte, Legenden, Wirtschaftskurven und besondere Zeitabschnitte. Der eingebaute Datensatz **Standard (1975)** entspricht den Werten im Code.

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
- Mit jedem gespielten Ligaspieltag rückt jede Sim-Staffel um genau **einen** Spieltag vor (\`advanceDivision\`) und ihre Tabelle wird aktualisiert.
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

## Ausblick
Eine 3. Ebene existiert 1975/76 noch nicht — daher gibt es (noch) keinen Abstieg **aus** der 2. Liga. Die historischen Ligareformen (eingleisige 2. Liga **1981/82**, Regionalliga **1994/95**, 3. Liga **2008/09**) sind als datengetriebenes **Reformsystem** umgesetzt und greifen automatisch beim jeweiligen Saisonwechsel — Details siehe Artikel „Ligareformen (historischer Umbau)“. Die DDR-Integration 1991/92 dockt als weiterer Reform-Datensatz an.`,
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

Beide werden – wie alle Nicht-Spielerligen – **performant per Stärke simuliert** und haben ihre **eigenen Tabellen**. Im Bereich **Tabelle** lassen sie sich über den Liga-Umschalter auswählen (klar beschriftet als „DDR-Oberliga“ / „DDR-Liga“).

## Rechtssichere Städtenamen
Alle Vereine tragen reine **Städtenamen** (keine geschützten realen Vereinsnamen/Logos). Prägende DDR-Standorte sind vertreten: **Dresden, Rostock, Berlin (Ost), Magdeburg, Jena, Erfurt, Halle, Chemnitz, Leipzig, Brandenburg**. „**Berlin (Ost)**“ ist dabei klar von West-Berlin unterschieden. Die restlichen Plätze füllen **klar fiktive Platzhalterstädte** (z. B. Ostheim, Elbstadt, Spreewald).

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
    keywords: ['form', 'leistung', 'note', 'trend', 'pfeil', 'krise', 'bestform'],
    body: `## Was ist Form?
Form ist die **kurzfristige Verfassung** eines Spielers auf einer Skala von **0–100**. Sie verändert sich abhängig davon, wie ein Spieler zuletzt performt hat.

## Wie ändert sich Form?
Nach jedem Spiel wird die Form der eingesetzten Spieler neu berechnet aus:
- **Ergebnis-Anteil:** Sieg +5, Unentschieden +1, Niederlage −5.
- **Leistungs-Anteil:** individuelle Spielnote (0–10). Note 6 ist neutral; jede Note darüber hebt, jede darunter senkt die Form (Faktor ~2,2).
- **Zufalls-Rauschen:** kleine Streuung, damit es lebendig bleibt.
- **Rückkehr zur Mitte:** die Form driftet je Update ~5 % Richtung 50 – Ausschläge sind also flüchtig.

Nicht eingesetzte Spieler driften nur langsam Richtung 50.
Training kann die Form leicht heben; Überlastung (hohe Intensität bei niedriger Fitness) senkt sie.

## Anzeige (Indikator)
| Form | Label | Pfeil | Farbe |
|------|-------|-------|-------|
| ≥ 75 | Bestform | ▲▲ | Grün |
| 60–74 | gut | ▲ | Grün |
| 45–59 | normal | ▬ | Gelb |
| 30–44 | schwach | ▼ | Orange |
| < 30 | Formkrise | ▼▼ | Rot |

## Code
- \`engine/form.ts\`: \`updatePlayerForm\`, \`applyMatchEffects\`, \`applyTrainingForm\`, \`formIndicator\`.
- Feld: \`Player.form\` (0–100).`,
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
Fitness fließt als eigener **Fitness-Faktor** in die effektive Tagesstärke ein: \`0.7 + fitness/100 * 0.3\` (0,7–1,0). Niedrige Fitness erhöht außerdem das Verletzungsrisiko.

## Anzeige
Farbcodiert wie Attribute: Grün > 75, Gelb 60–75, Orange/Rot < 60. Im Spielerprofil eigene Kachel **„Fit"** direkt neben **„Frisch"**.

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

## Anzeige
Eigene Kachel **„Frisch (x/100)"** im Spielerprofil, direkt neben **„Fit"**. Farbcodiert: Grün > 75, Gelb 60–75, Orange 45–59, Rot < 45.

## Speicherstände
Save-Version **7**: Altstände ohne Frische werden beim Laden nachgerüstet (\`retrofitFrische\`: Frische = vorhandene Fitness, ersatzweise 100).

## Code
- Feld: \`Player.frische\` (0–100), eigenständig neben \`Player.attributes.fitness\`.
- \`engine/form.ts\`: \`applyMatchFreshnessDrain\`, \`recoverFreshness\`, Anwendung in \`applyMatchEffects\`.
- \`engine/match.ts\`: \`frischeFactor\` (in \`effectiveRating\`).
- \`engine/training.ts\` & \`engine/weeklyTraining.ts\`: tägliche/wöchentliche Regeneration.
- \`engine/save.ts\`: \`SAVE_VERSION = 7\`. \`App.tsx\`: \`retrofitFrische\` beim Laden.`,
  },

  // ---------------------------------------------------------------------------
  // NACHRICHTEN
  // ---------------------------------------------------------------------------
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
    keywords: ['speichern', 'laden', 'save', 'load', 'slot', 'startbildschirm', 'menü', 'einstellungen', 'manager'],
    body: `## Startbildschirm
Beim Start erscheint ein Menü mit:
- **Neues Spiel** – Managerprofil + Verein + Optionen festlegen.
- **Spiel laden** – vorhandene Speicherstände mit Vorschau (Verein, Manager, Datum).
- **Einstellungen** – Geschwindigkeit, Autosave, Anzeige u.a.
- **Spiel verlassen** – schließt/entkoppelt die laufende Partie.

## Neues Spiel: Managerprofil
Du stellst **dich selbst als Manager** ein: Name, Nationalität, Geburtsjahr, bevorzugter Spielstil und Trainer-Hintergrund. Dazu Optionen wie Schwierigkeitsgrad, Verletzungen an/aus und Spieltempo. Das **Punktesystem ist historisch automatisch** (2 Punkte bis 1994/95, ab 1995/96 automatisch 3 Punkte) und nicht mehr wählbar.

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
    title: 'Wochen-Trainingsplaner',
    keywords: ['training', 'wochenplan', 'block', 'einheit', 'slot', 'spieltag', 'planer', 'intensität'],
    body: `## Wochen-Trainingsplaner
Unter **Training** stellst du den Trainingsplan deiner Mannschaft für die ganze Woche ein — **7 Tage (Mo–So)** mit je **drei Slots**:

- **Einheit 1** (Vormittag)
- **Einheit 2** (Nachmittag)
- **Extraeinheit** (zusätzliche Belastung, freiwillig)

### Spieltage
An Tagen mit einem **Pflichtspiel deines Vereins** wird **nicht trainiert**. Diese Tage sind im Raster rot markiert (Spieltag) und gesperrt. Die aktuelle Kalenderwoche wird automatisch anhand des Spielplans erkannt.

### Vorgefertigte Trainingsblöcke
Jeder Slot wird mit einem **vorgefertigten Block** belegt (Dropdown). Die Blöcke decken **alle Fähigkeitsbereiche** ab. Jeder Block hat eine **Intensität** (niedrig / mittel / hoch), einen **Belastungswert** und die von ihm geförderten **Attribute** (mit Gewichtung):

| Block | Intensität | Belastung | Schwerpunkt-Attribute |
|---|---|---|---|
| Ausdauerlauf | hoch | 6 | Ausdauer, Fitness, Arbeitseinsatz |
| Konditionszirkel | mittel | 3.5 | Ausdauer, Fitness, Kraft |
| Sprinttraining | hoch | 5.5 | Antritt, Schnelligkeit, Agilität |
| Beweglichkeit & Balance | mittel | 3 | Agilität, Balance, Antritt |
| Krafttraining | hoch | 5.5 | Kraft, Sprungkraft |
| Technikschulung | mittel | 3 | Technik, Ballannahme, Ballkontrolle |
| Dribbling & Finten | mittel | 3 | Dribbling, Ballkontrolle, Kreativität |
| Passspiel | mittel | 3 | Passspiel, Langer Ball, Übersicht |
| ↗️ Flankentraining | niedrig | 2 | Flanken, Langer Ball |
| Abschlusstraining | mittel | 3.5 | Torschuss, Schusskraft, Distanzschuss |
| Kopfballtraining | mittel | 3.5 | Kopfball, Sprungkraft |
| Zweikampf & Verteidigung | hoch | 5 | Tackling, Manndeckung, Abfangen |
| Taktik & Positionsspiel | niedrig | 2 | Stellungsspiel, Entscheidung, Teamwork |
| 🆚 Spielform (Match Practice) | hoch | 5 | Teamwork, Entscheidung, Passspiel u.v.m. |
| Torwarttraining | mittel | 3.5 | Reflexe, Fangsicherheit, 1-gg-1 |
| Standardsituationen | niedrig | 2 | Freistöße, Ecken, Elfmeter |
| Mentaltraining | niedrig | 1.5 | Nervenstärke, Konzentration, Führung |
| Regeneration | niedrig | −4 | (kein Lerneffekt, starke Erholung) |

### Standardplan
Neue Spiele starten mit einem ausgewogenen Vorschlag (Mo–Fr je zwei Einheiten, Sa leicht, So Regeneration). Alles ist frei umstellbar; der Plan wird gespeichert.`,
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

Eine sichtbare Meldung bzw. eine Zeremonie gibt es **ausschließlich** bei der großen Saison-Bewertung (siehe „Periodische Leistungsbewertung" weiter unten) — nicht mehr wöchentlich.

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
Zusätzlich zur stillen Wochen-Entwicklung wird die gesamte Liga an festen Anlässen neu bewertet:

| Anlass | Zeitpunkt | Sichtbarkeit |
|---|---|---|
| Nach dem Sommer-Transferfenster | Tag nach Fensterschluss (**1. September**) | still im Hintergrund |
| Jahreswechsel | **1. Januar** (Übergang 31.12. → 01.01.) | still im Hintergrund |
| Nach dem Winter-Transferfenster | Tag nach Fensterschluss (**1. Februar**) | still im Hintergrund |
| Große Saison-Bewertung | **zwei Wochen nach Saisonende** | Zeremonie + Meldung |

### Jeder Spieler bekommt seine Chance
Bei **jeder** dieser Bewertungen wird **jeder Spieler der Liga** neu bewertet — jeder kann auf- oder abgewertet werden (altersabhängig, gebremst durch das Stern-Potenzial). Auch **dein eigener Verein** wird an allen Terminen mitbewertet.

### Kleine Bewertungen laufen im Hintergrund
Die **drei periodischen** Bewertungen (September, Januar, Februar) laufen **still im Hintergrund**: Die Werte deiner und aller anderen Spieler ändern sich, aber der Vorlauf hält **nicht** an und es erscheint **keine Meldung**. Die neuen Werte findest du jederzeit im **Kader**.

### Nur die große Saison-Bewertung wird gefeiert
Ausschließlich die **große Saison-Bewertung** öffnet ein **Bewertungs-Fenster** (Zeremonie) und schreibt eine **Nachricht** in die Zentrale. Das Fenster enthüllt die Ergebnisse **deines Vereins** nacheinander (die übrigen Vereine ändern sich im Hintergrund). Steuerung:

- **x1** — enthüllt den nächsten Spieler einzeln.
- **x2** — enthüllt zwei Spieler pro Schritt (schneller).
- **Überspringen** — zeigt sofort die vollständige Ergebnisliste.

Je Spieler siehst du **Name, Verein, Position, Alter** sowie **alter → neuer Overall** mit farbiger Änderung (grün bei Auf-, rot bei Abwertung, grau bei keiner Änderung). Am Ende fasst das Fenster zusammen, wie viele Auf-/Abwertungen es gab; mit **Fertig** schließt du die Zeremonie und das Spiel läuft weiter.

## Liga-Ticker nach den Bewertungen
Nach der Winter- und der Saison-Bewertung meldet der **Liga-Ticker** die größten Gewinner und Verlierer der anderen Vereine deiner Liga. Junge Spieler mit großen Sprüngen sind die Transferziele von morgen.

## Liga-Gleichgewicht
Zum 1. Juli vergleicht das Spiel die Durchschnittsstärke der 1. Liga mit dem Zielwert **72,5**. Liegt sie mehr als einen Punkt darüber, werden die **neuen** Jugendjahrgänge aller Akademien um 0,1 Sterne Potenzial schwächer erzeugt (bis −0,6), liegt sie darunter, etwas stärker (bis +0,3); im Zielkorridor läuft die Korrektur wieder aus. Bestehende Spieler werden nie nachträglich verändert. So bleibt die Liga über Jahrzehnte vergleichbar, ohne dass dein Kader bestraft wird.`,
  },
  {
    id: 'tactics',
    category: 'tactics',
    title: 'Aufstellung & Formationen',
    keywords: ['taktik', 'aufstellung', 'formation', 'libero', '4-4-2', '4-3-3'],
    body: `## Aufstellung & Formationen
Auf der Seite **Aufstellung** (in der unteren Leiste) stellst du deine Mannschaft.

### Formationen
Es stehen neun Formationen zur Wahl – vom modernen System bis zum klassischen Libero-System der 80er:

| Formation | Typ | Charakter |
|-----------|-----|-----------|
| 4-4-2 | klassisch | ausgewogen, kompakte Viererkette, zwei Spitzen |
| 4-3-3 | offensiv | drei Angreifer, breite Flügel |
| 3-5-2 | Mittelfeld | starkes Zentrum, laufstarke Außen |
| 4-2-3-1 | modern | Doppelsechs, ein Zielspieler |
| 5-3-2 | defensiv | Fünferkette, sicher gegen starke Gegner |
| 3-4-3 | offensiv | mutig, viel Risiko |
| Libero 1-4-3-2 | 80er | freier Libero hinter der Viererkette |
| Libero 1-3-4-2 | 80er | Libero + Dreierkette, starkes Mittelfeld |
| Libero 1-4-4-1 | 80er | Libero, defensiv, ein Stürmer |

Formationen mit ¹ sind Libero-Systeme – zeitgemäß für 1980. Die CPU-Vereine bevorzugen diese Systeme leicht.

### Spieler zuordnen (Drag & Drop)
Ziehe einen Spieler von der **Ersatzbank** auf einen **Positions-Slot** im Feld – oder tausche zwei Spieler, indem du einen auf einen belegten Slot ziehst. Ziehst du einen Feldspieler zurück auf die Bank, wird der Slot frei.

### Auto-Aufstellen
Der Button **Auto-Aufstellen** besetzt alle Slots automatisch nach bestmöglicher Eignung – deine Formation und deine Taktik-Feineinstellungen bleiben erhalten.`,
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
| Vorstopper (VS) | Manndeckung 2.8, Zweikampf 2.8, Kopfball 2.2, Kraft 2.0 |
| Außenverteidiger (AV) | Zweikampf 2.0, Tempo 2.0, Ausdauer 2.0, Manndeckung 1.8 |
| Defensives MF (DM) | Zweikampf 2.2, Abfangen 2.2, Stellungsspiel 2.0, Passspiel 2.0 |
| Zentrales MF (ZM) | Passspiel 2.5, Übersicht 2.2, Technik 2.0, Ausdauer 1.8 |
| Offensives MF (OM) | Technik 2.2, Übersicht 2.2, Passspiel 2.0, Dribbling 1.8 |
| Flügel (FL) | Tempo 2.4, Dribbling 2.2, Flanken 2.0, Antritt 2.0 |
| Mittelstürmer (MS) | Abschluss 2.8, Kopfball 2.0, Schusskraft 1.8, Nervenstärke 1.8 |
| Hängende Spitze (HS) | Abschluss 2.0, Dribbling 2.0, Technik 2.0, erster Kontakt 1.8 |

Ein Mittelstürmer mit starkem Abschluss erreicht also eine deutlich höhere Eignung als einer mit gleichem Gesamtwert, dessen Stärken aber in der Defensive liegen.`,
  },
  {
    id: 'suitability',
    category: 'tactics',
    title: 'Positionseignung – so wird sie berechnet',
    keywords: ['eignung', 'suitability', 'berechnung', 'vertrautheit', 'farbe'],
    body: `## Positionseignung (0–100)
Für jeden Spieler auf jedem Slot zeigt das Feld eine **Eignungszahl** mit Farbcode:

- **grün** > 75 – Idealbesetzung
- **gelb** 60–75 – solide
- **orange** 45–59 – Notlösung
- **rot** < 60 (unterer Bereich) – ungeeignet

### Formel
\`Eignung = gewichteter Attribut-Mittelwert × Vertrautheits-Faktor\`

1. **Gewichteter Mittelwert:** Alle für die Position relevanten Attribute (siehe Positions-Gewichtungen) werden mit ihrem Gewicht multipliziert und gemittelt.
2. **Vertrautheits-Faktor:** Wie gut kennt der Spieler die Position?

| Situation | Faktor |
|-----------|--------|
| Stammposition | 1.00 |
| eingetragene Nebenposition | 0.92 |
| selbe Positionsgruppe (z.B. VS→LIB) | 0.82 |
| benachbarte Gruppe (z.B. DEF→MID) | 0.70 |
| weit entfernte Gruppe (z.B. DEF→ATT) | 0.55 |
| Feldspieler im Tor / Torwart im Feld | 0.30 |

Das Ergebnis wird auf 1–99 begrenzt. Deshalb kann ein Weltklasse-Stürmer als Innenverteidiger trotzdem nur eine mittelmäßige Eignung haben – ihm fehlt die Vertrautheit **und** die passenden Attribute.`,
  },
  {
    id: 'tactic-options',
    category: 'tactics',
    title: 'Taktik-Anweisungen & ihre Wirkung',
    keywords: ['taktik', 'tempo', 'pressing', 'abseitsfalle', 'aufbau', 'anweisung'],
    body: `## Taktik-Anweisungen
Über den Button **Taktik** öffnest du das Taktik-Popup. Alle Einstellungen wirken direkt in der Match-Engine (\`engine/match/team.ts\`, Funktion \`tacticMods\`).

### Ausrichtung
- **Grundausrichtung:** Defensiv / Ausgewogen / Offensiv / Konter. Offensiv: mehr und gefährlichere Angriffe, dafür anfälliger für Konter. Konter: weniger Ballbesitz, aber deutlich gefährlichere Gegenstöße.
- **Tempo (0–100):** mehr Angriffe pro Minute, aber auch mehr Fehler im Aufbau und höherer Kraftverbrauch.
- **Pressinghöhe (0–100):** etwas mehr Spielkontrolle und Angriffe, mehr Fouls, mehr Kraftverbrauch; hohe Linie und Pressing öffnen Räume für Konter.
- **Abwehrlinie (0–100):** Hoch = mehr Konteranfälligkeit für dich, tief = sicherer.

### Verhalten
- **Zweikampfhärte (0–100):** gewinnt mehr Zweikämpfe, kostet aber Fouls und Karten.
- **Abseitsfalle (an/aus):** mehr gegnerische Abseitsstellungen, vor allem gegen Steilpässe und Konter.
- **Breite (0–100):** Hohe Breite = mehr Flanken und Kopfballchancen; wie gefährlich das ist, hängt von deinen Flankengebern und Kopfballspielern ab.
- **Aufbauspiel:** Kurz (bessere Passquote, mehr Kontrolle) oder lang (mehr lange Bälle und Flanken).

Im Textmodus kannst du zusätzlich während des Spiels die **Ausrichtung** ändern und **Zurufe** geben (siehe *Textmodus*).`,
  },
  {
    id: 'set-pieces',
    category: 'tactics',
    title: 'Standardschützen & Kapitän',
    keywords: ['standard', 'elfmeter', 'freistoß', 'ecke', 'kapitän', 'schütze'],
    body: `## Standardschützen
Im Abschnitt **Standardschützen** auf der Aufstellungsseite legst du fest, wer ruhende Bälle ausführt. Zur Auswahl stehen nur Spieler der aktuellen Startelf, sortiert nach dem passenden Attribut:

- **Elfmeter** – nach Attribut *Elfmeter*
- **Freistoß** – nach Attribut *Freistöße*
- **Ecke** – nach Attribut *Ecken*
- **Kapitän** – nach Attribut *Führung*

Der gewählte Schütze wird in der Simulation bei der jeweiligen Standardsituation bevorzugt – ein guter Elfmeterschütze erhöht die Verwandlungschance. Wählst du niemanden, schlägt das Spiel automatisch den besten verfügbaren Spieler vor.`,
  },
  {
    id: 'match',
    category: 'match',
    title: 'Textmodus und Schnellsimulation',
    keywords: ['match', 'text', 'textmodus', 'live', 'kommentar', 'simulieren', 'schnell', 'wechsel', 'zuruf', 'halbzeit', 'ansprache', 'spannung', 'statistik', 'xg'],
    body: `## Dein Spiel: Schnell simulieren oder Textmodus
Erreicht der Vorlauf einen Tag mit einem Spiel deines Vereins (Liga, Pokal, Europapokal), hält er an. Oben rechts erscheinen dann zwei Knöpfe:
- **Schnell simulieren:** Das Spiel wird sofort berechnet, danach öffnet sich der Spielbericht.
- **Textmodus:** Eine eigene Oberfläche ohne Menü. Du verfolgst das Spiel live und greifst ein.

Beide Wege nutzen **dieselbe Match-Engine** und verbuchen alles identisch (Ergebnis, Statistik, Noten, Spielliste, Verletzungen, Karten).

## Der Textmodus
- **Anzeigetafel** mit Spielstand, Torschützen und Spielminute (inklusive Nachspielzeit).
- **Druckphasen:** Balken je Minute zeigen, wer gerade drückt (oben Heim, unten Gast).
- **Ticker:** Chancen bauen sich über mehrere Zeilen auf (Aufbau, Abschluss, Ausgang, Echo). Jede Zeile bleibt so lange stehen, dass du sie lesen kannst, dann folgt direkt die nächste.
- **Spannungsmoment:** Bei Großchancen, Elfmetern und direkten Freistößen flimmert zuerst unleserlicher Text, der sich erst dann zu **TOR!**, **GEHALTEN!**, **DANEBEN!** oder **LATTE!** auflöst.
- **Deine Elf:** Kraft (Balken) und Live-Note jedes Spielers, Karten, Tore, Vorlagen.
- **Rechts:** Taktik (Ausrichtung, Zurufe), Statistik, gegnerische Aufstellung.

## Eingreifen
- **Wechseln:** Spieler auf dem Platz anklicken, dann einen Ersatzspieler wählen. Der Neue übernimmt die Position; seine **Eignung** für die Position wird angezeigt. Wechsel je nach Epoche: **2** (bis 1994), **3** (ab 1995), **5** (ab 2020).
- **Ausrichtung:** Mauern, Defensiv, Normal, Offensiv, Alles nach vorne. Wirkt sofort auf Angriffshäufigkeit, Stabilität und Konteranfälligkeit.
- **Zurufe:** sechs kurze Anweisungen (Mehr Druck, Ruhe reinbringen, Kompakt stehen, Über die Flügel, Konzentration, Zweikämpfe annehmen). Ein Zuruf wirkt etwa **zehn Minuten**, danach brauchst du eine kurze Pause. Wie gut er ankommt, hängt auch vom Kapitän ab. Wer immer wieder dasselbe ruft, wird überhört.
- **Halbzeitansprache:** Loben, ruhig analysieren oder Kabinenpredigt. Lob hilft bei Führung, eine Predigt bei Rückstand. Falscher Ton kann schaden.
- Verletzt sich ein Spieler, wird er automatisch ersetzt, wenn noch Wechsel übrig sind.

## Tempo und Optionen
Lesetempo **Langsam / Normal / Schnell**, **Pause** (auch Leertaste) und **Bis zur Pause / Bis zum Ende** (spult ohne Lesepausen vor). Tempo, Spannungsmoment und Halbzeitansprache lassen sich in den **Einstellungen** dauerhaft festlegen.

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
Jeder Spieler bringt seine **Positionsstärke** auf der Position mit, auf der er tatsächlich spielt (Attribute nach Positionsgewichten der jeweiligen Epoche, Abzug für deutliche Schwächen, Vertrautheit mit der Position). Dazu kommt die **Tagesform** aus Form, Moral, Fitness und Frische. Während des Spiels sinkt die **Kraft** je nach Ausdauer, Tempo, Pressing, Hitze und Verlängerung; müde Spieler verlieren an Wirkung. Frische Einwechselspieler bringen volle Kraft.

## Mannschaftsteile
Aus den Spielern auf dem Platz entstehen vier Werte: **Angriff**, **Spielkontrolle**, **Abwehr** und **Torwart**. Jede Position trägt unterschiedlich bei (ein Flügelstürmer viel zum Angriff, ein Sechser viel zu Kontrolle und Abwehr). Fehlt ein Spieler (Platzverweis, Verletzung ohne Wechsel), sinken die Werte spürbar.

## Minute für Minute
- **Ballbesitz** folgt der Spielkontrolle (die führende Mannschaft überlässt dem Gegner etwas mehr den Ball).
- **Angriffe** entstehen je nach Ballbesitz, Tempo und Ausrichtung. Ob daraus eine **Chance** wird, entscheidet das Verhältnis Angriff gegen Abwehr (inklusive Heimvorteil).
- Verpufft ein Angriff, gibt es Abseits, Ecke, Foul (vor dem Strafraum mit Freistoß oder Elfmeter) oder einen Ballverlust – mit Kontergefahr.
- Jede Chance hat eine **Torwahrscheinlichkeit** (Großchance, normaler Schuss, Kopfball, Distanzschuss, Freistoß, Elfmeter). Ob der Ball reingeht, hängt zusätzlich vom Abschluss des Schützen und vom Torwart ab. Fehler im Aufbau führen zu Großchancen.
- Dazu kommen Fouls, Karten, Verletzungen, Nachspielzeit, und im Pokal Verlängerung und Elfmeterschießen.
- Die **KI-Trainer** wechseln müde oder schwache Spieler aus und ändern bei Rückstand oder knapper Führung die Ausrichtung.

## Epochen
- **Heimvorteil:** in den Siebzigern deutlich stärker als heute.
- **Torschnitt:** um 3,1 Tore pro Spiel früher, um 2,9 heute.
- **Karten:** früher seltener Gelb; ab 1995 mehr Verwarnungen.
- **Wechsel und Bank:** 2 Wechsel bei 5 Bankplätzen, ab 1995 3 Wechsel (7 Plätze), ab 2020 5 Wechsel (9 Plätze).
- **Videobeweis** ab 2017: Treffer können nachträglich aberkannt werden.

## Noten
Jeder Spieler bekommt eine Note von **1,0 bis 6,0** in halben Schritten. Sie ergibt sich aus seinem Beitrag (Tore, Vorlagen, Schlüsselpässe, Paraden, Zweikämpfe, Fehler, Karten, Gegentore) und seiner Leistung auf der Position. Kurzeinsätze liegen näher an 3,5.

## Kalibrierung
Mit \`node scripts/matchbench.mjs\` werden tausende Spiele je Epoche simuliert und Torschnitt, Heimsiege, Favoritenquote und der Einfluss schlechter Aufstellungen gemessen.`,
  },
  {
    id: 'cpu-ai',
    category: 'match',
    title: 'CPU-Aufstellung & Gegner-KI',
    keywords: ['cpu', 'ki', 'gegner', 'aufstellung', 'ai', 'formation'],
    body: `## CPU-Aufstellung & Gegner-KI
Nicht nur du stellst auf – **alle 17 anderen Vereine** bekommen eine sinnvolle Aufstellung und Taktik (\`engine/lineupAI.ts\`).

### So denkt die CPU
1. **Formationswahl** (\`pickBestFormation\`): Für jede der neun Formationen wird durchgerechnet, wie gut der Kader sie besetzen kann (Summe der Eignungen). Libero-Systeme erhalten einen kleinen Ära-Bonus (+12), damit die KI zeitgemäß für 1980 aufstellt.
2. **Besetzung** (\`assignToFormation\`): Alle (Slot, Spieler)-Paare werden nach Eignung sortiert und greedy vergeben – der beste passende Spieler bekommt zuerst seinen Platz.
3. **Standardschützen & Kapitän:** automatisch nach den passenden Attributen (Elfmeter, Freistöße, Ecken, Führung).
4. **Taktik-Werte:** pro Verein leicht variiert, aber deterministisch aus der Vereins-ID abgeleitet – jeder Klub hat also einen eigenen „Charakter".

Weil jede CPU-Aufstellung dieselbe Eignungs- und Taktik-Logik nutzt wie deine, wirken sich Kaderqualität und Positionsbesetzung des Gegners real auf die Simulation aus. Ein Verein mit schlecht besetzten Positionen spielt spürbar schwächer.`,
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
    id: 'training-philosophy',
    category: 'training',
    title: 'Trainingsphilosophie, Förderspieler & Monatsbericht',
    keywords: ['philosophie', 'schwerpunkt', 'belastung', 'schonung', 'förderspieler', 'trainingsbericht', 'phase', 'vorbereitung', 'rückrunde'],
    body: `## Vier Phasen, eine Entscheidung je Phase
Statt jede Woche alles neu zu planen, legst du für **Vorbereitung, Hinrunde, Winter und Rückrunde** je einen Schwerpunkt fest (Kader → Training):
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

Intern rechnet das Spiel durchgehend in nominalen DM; die Anzeige stellt ab 2002 automatisch auf Euro um. Zum Start
1975/76 sind die Beträge bewusst klein gehalten (keine modernen Millionensummen).

## Steigende Finanzbasis über die Jahrzehnte
Die gesamte Finanzbasis des Fußballs **wächst über die Jahre real mit** — Sponsoring, TV-, Ticket- und Fanartikel-Erlöse
sowie die Fixkosten skalieren gemeinsam mit einem **Wirtschafts-Index** (economyScale). Bezugsjahr ist **1975 ≈ 1×**,
bis **2030 ≈ 130×**. Details siehe *Chronik: Steigende Finanzbasis & Währung*.

## Kontostand & Budgets
- **Kontostand:** wird real fortgeschrieben (rot bei Minus, türkis bei Plus).
- **Transferbudget:** verfügbares Geld für Spielerkäufe.
- **Gehaltsbudget / Woche:** Sollwert für die Wochengehälter; ein Balken zeigt die aktuelle Auslastung (Summe der Kader-Wochengehälter ÷ Gehaltsbudget), farbcodiert.

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
\`Zuschauer × Ticketpreis\`
Die Zuschauerzahl liefert die Match-Engine abhängig von Erfolg/Form, Gegner, Attraktivität und **Stadionkapazität** des Vereins. Der Ticketpreis liegt Ära-gerecht bei ca. **8–20 DM**.

### Fanartikel / Merchandising (pro Heimspiel)
\`Zuschauer × ProKopf\`, mit \`ProKopf = 2 + (Reputation / 100) × 4\` (≈ 2–6 DM je Besucher).
Steigt also mit Zuschauerzahl und Reputation des Vereins.

### TV- & Mediengelder (pro Heimspiel)
\`20.000 + Reputation × 400\` DM – Ära-gerecht bewusst **klein** (1980 gab es noch keine großen TV-Verträge).

### Catering / Würstchenbuden (pro Heimspiel)
\`Zuschauer × Netto-pro-Kopf\`, wobei der Pro-Kopf-Erlös von **Ausbaustufe** und **Betriebsform** abhängt (Eigenbetrieb > Umsatzbeteiligung > Verpachtung). Details siehe *Catering & Betriebsformen*.

### Programmhefte & Spieltagserlöse (pro Heimspiel)
\`Zuschauer × 0,25\` DM (1975-Basis, era-skaliert). Skaliert direkt mit der Auslastung.

### Trikotsponsoring (monatlich, aus echtem Vertrag)
Monatsrate = \`Jahreswert des Trikotvertrags ÷ 12\`. Der Vertrag wird im Bereich **Sponsoring** unterschrieben (2–3 Saison-Angebote, Laufzeit 1–5 Jahre). Ohne Vertrag: keine Einnahme.

### Bandenwerbung (monatlich, aus echtem Vertrag)
Monatsrate = \`Jahreswert des Bandenvertrags ÷ 12\`. Grundwert je Verein: \`80.000 + Kapazität/1000 × 1.500 + Reputation × 800\` DM/Jahr (gedeckelt 100.000–300.000). Laufzeit 1–3 Jahre.

### Mitgliedsbeiträge (monatlich)
Jahreswert = \`30.000 + Reputation × 1.000\` DM, monatlich gebucht (\`÷ 12\`). Wächst mit dem Ansehen des Vereins.

### Prämien
- **Siegprämie:** \`25.000 + Reputation × 200\` DM pro Sieg.
- **Remisprämie:** \`8.000\` DM pro Unentschieden.
- **Sponsor-Platzierungsbonus (monatlich):** Platz 1–3 → 30.000 DM · Platz 4–6 → 15.000 DM · Platz 7–10 → 6.000 DM.

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
Die Wochengehälter der Spieler werden aus OVR/Alter abgeleitet (Vertrag \`weeklyWage\`).
Verlängerungen verhandelst du selbst (siehe Artikel **Verträge, Bosman & Kabine**). KI-Vereine verlängern meist automatisch: Laufzeit nach Alter, neues Gehalt = Mittel aus altem Gehalt und Marktgehalt.

### Betreuerstab
\`Spielergehälter × 0,18\` – Trainer-, Betreuer- und Verwaltungspersonal.

### Stadionunterhalt
\`Kapazität × 0,9 + (100 − Zustand) × 800\` DM/Monat. Ein schlechterer Stadionzustand erhöht die Kosten.

### Gebäude-Fixkosten (Unterhalt)
Jede **gebaute Einrichtung** verursacht monatliche Fixkosten (ersetzt den alten Pauschalposten "Trainingsbetrieb"):
\`Basis × Stufen-Multiplikator\` (era-skaliert), summiert über alle Einrichtungen.
- **Stufen-Multiplikator** (Stufe 1..5): \`1 · 1,4 · 1,9 · 2,5 · 3,2\`.
- **Basis-Unterhalt/Monat (1975-DM):** Trainingszentrum 4.000 · Jugendakademie 3.000 · Medizin 2.500 · Fanshop 2.000 · Reha-Zentrum 3.000 · NLZ 4.000 · Leistungszentrum 4.500 · Datenanalyse 3.500.
- **Stadion** ist ausgenommen (steckt im Stadionunterhalt), **Catering** ist Sonderfall je Betriebsform (siehe *Catering & Betriebsformen*).
- Zukunfts-Einrichtungen (Reha, NLZ, Leistungs-/Datenzentrum) zählen erst ab **Stufe ≥ 2** als gebaut.

### Catering-Fixkosten & -Pacht (monatlich)
Fixkosten je Betriebsform/Stufe; bei **Verpachtung** zusätzlich eine feste Monatspacht als Einnahme (siehe *Catering & Betriebsformen*).

### Sonstige Fixkosten
\`6.000 + Reputation × 500\` DM/Monat (Reise, Organisation, Verwaltung).

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
- **Erwartete Heimspiel-Einnahme:** \`Ø-Auslastung × Kapazität × (Ticketpreis + ProKopf-Fanartikel) + TV\`.
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
1975 lebt ein Verein vom Stadion: rund 60 % des Umsatzes sind Eintritt, Catering und Programmhefte. Ab Ende der 1980er wachsen die **TV-Gelder** (Privatfernsehen, Pay-TV), ab den 2000ern **Vermarktung & Hospitality** (Logen, Lizenzen, Partner). Jede Erlösart wächst deshalb unterschiedlich schnell:

| Jahr | Spieltag | TV | Vermarktung |
|---|---|---|---|
| 1975 | 60 % | 7 % | 24 % |
| 1992 | 42 % | 22 % | 29 % |
| 2000 | 26 % | 36 % | 31 % |
| 2020 | 16 % | 40 % | 38 % |

## TV-Gelder (zentrale Vermarktung)
- Zu Saisonbeginn wird der TV-Topf der Liga verteilt und **monatlich** ausgezahlt.
- Die Verteilung richtet sich nach **Liga** (2. Liga ein Fünftel bis ein Viertel, darunter wenig) und dem **Tabellenplatz der Vorsaison**. Bis 1990 fast gleichmäßig (15 % leistungsabhängig), ab 2000 zu 35 % leistungsabhängig.

## Marke: regional, national, international
- Jeder Verein hat eine **Marke** aus drei Werten (0–100). Sie wächst mit Tabellenplätzen, Titeln, Pokalsiegen und Europapokal-Erfolgen und kehrt langsam zu dem Niveau zurück, das der Ruf erwarten lässt.
- Die **internationale Bekanntheit** zählt anfangs kaum, wird aber über die Jahrzehnte immer wichtiger (Globalisierung).
- Die Marke multipliziert **Trikot- und Bandenwerbung** sowie **Fanartikel** (gedeckelt, abnehmender Grenznutzen) und bestimmt die **Vermarktung & Hospitality** – hier verdienen große Marken überproportional.

## Europapokal
- Prämien und **Startgelder** wachsen mit der Wirtschaft. Ab 1992 (Meisterliga mit Gruppenphase) steigen die Prämien im Landesmeister-Wettbewerb bis 2000 auf das Fünffache, in den anderen Wettbewerben auf das Doppelte. Europäischer Erfolg ist damit der stärkste Hebel für eine Dynastie – garantiert aber nichts.

## Preisschilder und Kontostand
- **Gehälter, Marktwerte und das Transferbudget** sind Preisschilder in 1975-Werten und werden mit dem Spieljahr hochgerechnet angezeigt und gebucht. Der **Kontostand** ist nominal.
- **Marktwerte** werden zu jeder Saison neu bewertet: Alle fünf Stärkepunkte verdoppelt sich der Wert, junge Spieler mit Luft nach oben sind teurer, ältere günstiger.
- Das **Transferbudget** legt der Vorstand zu Saisonbeginn fest: je nach Vertrauen 40–90 % des Polsters über einer Reserve von einem Viertel des Jahresumsatzes.

## Schulden, Lizenz, Finanzielles Fairplay
- Ein **negativer Kontostand** kostet monatlich Zinsen (etwa 8 % im Jahr).
- Liegt der Kontostand am Saisonende unter **−40 % des Jahresumsatzes**, gibt es die Lizenz nur mit **Transfersperre**.
- Ab **2011/12** gilt das **Finanzielle Fairplay**: Liegt das Ergebnis der letzten drei Saisons mehr als 5 % des Umsatzes im Minus, folgt eine Verwarnung, beim zweiten Verstoß eine Transfersperre.

## Die anderen Vereine wirtschaften mit
- KI-Vereine passen ihre Gehälter dem Umsatz an (Gehaltsquote um 60 %), verkaufen bei Schulden Spieler und investieren Überschüsse in Neuzugänge (aus der Liga oder dem Ausland) sowie in Gelände und Stadion. Geld bleibt nicht einfach auf dem Konto liegen – auch die Konkurrenz wird stärker, wenn sie erfolgreich ist.`,
  },
  {
    id: 'finance-contracts',
    category: 'finance',
    title: 'Trikotsponsoring & Bandenwerbung (Verträge)',
    keywords: ['sponsoring', 'trikot', 'banden', 'werbung', 'vertrag', 'laufzeit', 'jahreswert', 'angebot', 'unterschreiben'],
    body: `## Echte Verträge statt Pauschale
Trikotsponsoring und Bandenwerbung laufen über **echte Verträge** mit Name, Jahreswert und Restlaufzeit. Die monatliche Buchung ist \`Jahreswert ÷ 12\` (era-skaliert). Ohne aktiven Vertrag gibt es keine Einnahme aus diesem Kanal.

## Trikotsponsoring
- Angebote entstehen zu **Saisonbeginn** (2–3 Stück, im Bereich **Sponsoring** sichtbar).
- Historische Anker (1975-DM/Jahr): **Regional 100.000 · National 275.000 · Premium 500.000**.
- Jahreswert = \`Tier × (0,85 + Reputation/100 × 0,4) × Varianz\`, gerundet auf 5.000.
- Laufzeit **1–5 Jahre**. Bessere Reputation schaltet höhere Tiers frei.

## Bandenwerbung
- Grundwert = \`80.000 + Kapazität/1000 × 1.500 + Reputation × 800\` DM/Jahr, gedeckelt **100.000–300.000**.
- Angebote (2–3) zu Saisonbeginn, Laufzeit **1–3 Jahre**.

## Ablauf & Restlaufzeit
Zu jedem Saisonstart wird die Restlaufzeit aller Verträge um 1 Jahr reduziert; abgelaufene Verträge enden automatisch und es werden neue Angebote erzeugt. KI-Vereine schließen automatisch passende Verträge, damit ihre Bilanz stimmt.`,
  },
  {
    id: 'finance-elasticity',
    category: 'finance',
    title: 'Ticketpreis & Preiselastizität',
    keywords: ['ticket', 'ticketpreis', 'preis', 'elastizität', 'auslastung', 'zuschauer', 'nachfrage', 'referenzpreis'],
    body: `## Ticketpreis steuert die Auslastung
Im Bereich **Stadion** setzt du den Ticketpreis (±1 DM, Bereich ca. 4–60 DM). Ein höherer Preis senkt die Auslastung, ein niedrigerer hebt sie (bis zur Kapazitätsgrenze).

## Formel (Match-Engine)
- **Referenzpreis:** \`refPrice = round(8 + Reputation × 0,12)\` DM — der "faire" Preis für die Vereinsgröße.
- **Preisfaktor:** \`priceFactor = clamp(1 − ((Preis − refPrice) / refPrice) × 0,5 , 0,6 , 1,15)\`.
- **Auslastungsrate:** \`clamp(baseRate × priceFactor + Zufall(±0,10) , 0,3 , 1,0)\`, mit \`baseRate = Ø-Auslastung des Vereins\`.

Die gleiche Zahl gilt für **alle** Match-Buchungen (Eintritt, Catering, Programmhefte) — Vorschau und Buchung sind konsistent.

## Vorschau ohne Zufall
Die Bereiche **Stadion**, **Marketing** und **Fans** zeigen eine erwartete Auslastung/Zuschauerzahl **ohne** den ±0,10-Zufallsterm (\`expectedAttendanceRate\`), damit die Wirkung einer Preisänderung planbar ist. Faustregel: Preis unter dem Referenzpreis → mehr Zuschauer → mehr Catering-/Programm-Erlös; deutlich über Referenz → leere Ränge.`,
  },
  {
    id: 'youth-overview',
    category: 'youth',
    title: 'Jugendsystem — Überblick',
    keywords: ['jugend', 'nachwuchs', 'talente', 'akademie', 'jugendakademie', 'überblick'],
    body: `## Die Jugendakademie
Jeder Verein besitzt eine **Jugendakademie**. Ihre Ausbaustufe (Bereich **Gelände** → Infrastruktur) bestimmt,
**wie viele** und **wie gute** Talente entstehen und **wie schnell** sie sich entwickeln.

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
- **CPU-Vereine:** ziehen höchstens ein besonders vielversprechendes Talent (≥ 3,5 Sterne) hoch, der Rest verlässt den Verein
  (bewusst simpel gehalten).
- Für deinen Verein fasst die Nachricht **„Jahrgangsabschluss der A-Jugend"** zusammen, wer hochgezogen wurde und wer gegangen ist.

## Nachwuchs-Rhythmus (neue Jahrgänge)
Jeweils zum **1. Juli** vollzieht jede Akademie den Jahreswechsel — in dieser Reihenfolge:
1. Alle bestehenden Talente **altern um ein Jahr** und rücken damit eine **Altersklasse auf** (G→F→E→D→C→B→A).
2. **Jahrgangsabschluss** (siehe oben): die A-Jugend-Absolventen (nun 20) werden hochgezogen oder verlassen den Verein.
3. Ein neuer **G-Jugend-Jahrgang (Bambini, 7 Jahre)** rückt nach — **Anzahl nach Akademie-Stufe** (academyIntakeCount):

| Akademie-Stufe | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Neue G-Jugend/Jahr | 1 | 2 | 2 | 3 | 4 |
| Qualitäts-Bonus (OVR) | 0 | +3 | +6 | +9 | +13 |

Der **Qualitäts-Bonus** (academyQualityBonus) hebt die Grundstärke neuer Talente an — bessere Akademien liefern also
sowohl mehr als auch stärkere und potenzialträchtigere Talente.

4. Für deinen Verein erscheint die Nachricht **„Neuer G-Jugend-Jahrgang (Bambini) in der Jugendakademie"** mit der Liste der Neuzugänge.

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
    id: 'squad-contracts',
    category: 'squad',
    title: 'Verträge, Bosman & Kabine',
    keywords: ['vertrag', 'verlängerung', 'bosman', 'ablösefrei', 'vorvertrag', 'angebot', 'zufriedenheit', 'gehaltsgefüge', 'spielzeit'],
    body: `## Verlängern
Verhandelt wird im Spielerprofil (Reiter **Vertrag & Wert**), frühestens 30 Monate vor Vertragsende. Der Spieler nennt **Haltung**, **Forderung** und **Wunschlaufzeit**:

| Einfluss | Wirkung auf die Forderung |
| --- | --- |
| Marktgehalt | Grundlage (Stärke) |
| Stellenwert im Kader | Leistungsträger bis +30 %, Ergänzungsspieler bis −12 % |
| Alter | ab 31 J. und bis 21 J. etwa −10 % |
| Zufriedenheit | unter 40: +18 %, über 75: −4 % |
| Ehrgeiz | ± bis 12 % |
| Bosman (ab 1996) | im letzten Vertragsjahr +10 % |

Ob er überhaupt will, hängt von Zufriedenheit, Moral, Ehrgeiz und dem **Ansehen deines Vereins im Verhältnis zu seiner Stärke** ab („gern“, „offen“, „zögerlich“, „ablehnend“). Knapp unter der Forderung entscheidet ein kleiner Zufall. Nach drei gescheiterten Angeboten bricht er die Gespräche für zwei Monate ab. Der Vorstand gibt keine Erhöhung frei, wenn die Gehälter danach über 115 % des Gehaltsrahmens lägen.

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
    id: 'development-legends',
    category: 'development',
    title: 'Legenden',
    keywords: ['legende', 'jahrhunderttalent', 'ausnahmetalent', 'gerücht', 'akademie'],
    body: `## Jahrhunderttalente zu festen Jahrgängen
Rund 30 erfundene **Legenden** sind über die Jahrzehnte verteilt – vom Bomber aus dem Kohlenpott in den 1970ern bis zum Jahrhundertstürmer der 2020er. Jede taucht mit etwa 15 Jahren in der **Jugendakademie** eines Vereins deiner Liga auf.

- **Wo** sie landet, entscheidet der Zufall: Gute Akademien und Vereine aus der Heimatregion der Legende sind wahrscheinlicher.
- Landet sie bei dir, meldet sich der Leiter der Jugendakademie. Sonst berichten deine Scouts von einem **Gerücht** – unter Transfers → Beobachtungsliste kannst du versuchen, das Talent zu holen (siehe „Talente anderer Vereine“).
- Legenden lernen schneller als andere und werden nie aus der Jugend fortgeschickt. Ob sie wirklich zur Legende werden, hängt trotzdem von **Training, Spielpraxis und Umfeld** ab: In einer schwachen Liga ohne gute Trainer bleibt auch ein Jahrhunderttalent unter seinen Möglichkeiten.
- Steigt ihr Verein aus deiner Liga ab, wechselt die Legende zu einem Verein, der bleibt – sie geht nicht verloren.`,
  },
  {
    id: 'club-business',
    category: 'environment',
    title: 'Stadionbau, Kredite, Namensrechte, Investoren und Überschuldung',
    keywords: ['stadion', 'ausbau', 'kredit', 'zins', 'logen', 'vip', 'namensrechte', 'arena', 'ausgliederung', 'kapitalgesellschaft', 'investor', '50+1', 'dividende', 'punktabzug', 'zwangsabstieg', 'überschuldung', 'vorstand'],
    body: `## Stadionausbau als Bauprojekt
Das Stadion wächst nicht über Nacht. Unter **Verein → Stadion** startest du den nächsten Ausbauschritt (+6.000 Plätze):
- **Bauzeit:** Stufe 2–3 eine Saison, Stufe 4 zwei, Stufe 5 drei Spielzeiten. Fertig wird immer zum 1. Juli.
- **Während des Baus** sind rund 8 % der Plätze gesperrt.
- **Kosten:** Preisschild in 1975-Basis × Wirtschaftsskala; ab 2004 (Arenen) ×1,1.
- **Finanzierung:** bar oder per Kredit über 10, 15 oder 20 Jahre. Die Monatsrate (Annuität: Zins + Tilgung) wird jeden Monat gebucht. Die Bank lehnt ab, wenn alle Kreditraten zusammen mehr als 12 % des Jahresumsatzes kosten würden.
- **Zinsen je Epoche:** etwa 8,5 % (1975), 10,5 % (1981), 6 % (1998), 2–3 % (2016–2021), danach wieder rund 4,5 %. Wer im Minus steht, zahlt 1,5 Prozentpunkte Aufschlag.

## Logen
Ab 1985 bringt jeder Ausbauschritt Logen mit (8 bis 1992, 16 bis 2003, danach 28). Jede Loge bringt je Heimspiel 1.400 DM (1975-Basis) × Spieltags-Skala × Marke.

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
- **Entlassen wirst du nicht** – aber das Vertrauen bestimmt, wie viel vom finanziellen Polster der Vorstand als **Transferbudget** freigibt (40–90 %). Unter 30 und 15 gibt es Warnungen.`,
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
\`Kosten(Zielstufe) = Basiskosten × Faktor × Wirtschaftsskala des Jahres  (auf 10.000 gerundet)\`
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
    body: `Alle Kosten in **DM von 1975** (später × Wirtschaftsskala), auf 10.000 gerundet. Stufe 1 ist die Grundausstattung (kostenlos).

## Stadion — Basiskosten 900.000 DM
Jede Stufe über 1 erhöht die **Kapazität um 6.000 Plätze**. Mehr Kapazität → höhere Zuschauerzahl und damit
**mehr Stadion- und Fanartikel-Einnahmen** pro Heimspiel (wirkt direkt in den Finanzen und in der Saisonprognose).

| Zielstufe | 2 | 3 | 4 | 5 |
|---|---|---|---|---|
| Kosten | 900.000 | 1.890.000 | 3.240.000 | 4.860.000 |
| Kapazität ggü. Stufe 1 | +6.000 | +12.000 | +18.000 | +24.000 |

## Trainingszentrum — Basiskosten 320.000 DM
Setzt die **Anlagenqualität** (facilitiesQuality), die das Training direkt multipliziert — höhere Qualität = schnelleres
Attribut-Wachstum des gesamten Profikaders.

| Zielstufe | 2 | 3 | 4 | 5 |
|---|---|---|---|---|
| Kosten | 320.000 | 670.000 | 1.150.000 | 1.730.000 |
| Anlagenqualität (Stufe 1→5) | 68 | 78 | 88 | 96 |

(Stufe 1 = Qualität 55.)

## Jugendakademie — Basiskosten 260.000 DM
Steuert **Anzahl** und **Qualität** neuer Talente sowie die **Lernrate** der Jugendentwicklung (Details im Bereich *Jugendsystem*).

| Zielstufe | 2 | 3 | 4 | 5 |
|---|---|---|---|---|
| Kosten | 260.000 | 550.000 | 940.000 | 1.400.000 |
| Talente/Jahr | 2 | 2 | 3 | 4 |
| Qualitäts-Bonus | +3 | +6 | +9 | +13 |
| Lernrate × | 1,0 | 1,15 | 1,3 | 1,5 |

(Stufe 1 = 1 Talent/Jahr, Bonus 0, Lernrate ×0,85.)

## Medizinische Abteilung — Basiskosten 200.000 DM
Beschleunigt die **Fitness-Regeneration** deiner Spieler und **verkürzt Ausfallzeiten** nach Verletzungen (wirkt täglich
auf den Profikader).

| Zielstufe | 2 | 3 | 4 | 5 |
|---|---|---|---|---|
| Kosten | 200.000 | 420.000 | 720.000 | 1.080.000 |
| Regeneration/Tag | +1 | +2 | +3 | +5 |
| Reha-Verkürzung/Tag | – | −1 Tag | −1 Tag | −2 Tage |

(Stufe 1 = kein Bonus.) „Regeneration/Tag" sind zusätzliche Fitnesspunkte pro Tag, „Reha-Verkürzung" reduziert die
verbleibenden Verletzungstage zusätzlich.

## Fanshop / Merchandising — Basiskosten 180.000 DM
Multipliziert den **Fanartikel-Erlös pro Besucher** (wirkt bei jedem Heimspiel in den Finanzen).

| Zielstufe | 2 | 3 | 4 | 5 |
|---|---|---|---|---|
| Kosten | 180.000 | 380.000 | 650.000 | 970.000 |
| Erlös-Multiplikator | ×1,15 | ×1,3 | ×1,5 | ×1,75 |

(Stufe 1 = ×1,0. Grund-Erlös ≈ 2–6 DM je Besucher, abhängig von der Reputation.)

## Catering / Würstchenbuden — Basiskosten 120.000 DM
Steigert den **Pro-Kopf-Erlös je Heimspiel**. Die Betriebsform bestimmt Erlös und Fixkosten (vollständige Tabellen: *Catering & Betriebsformen*).

| Zielstufe | 2 | 3 | 4 | 5 |
|---|---|---|---|---|
| Kosten | 120.000 | 250.000 | 430.000 | 650.000 |
| Netto/Besucher (Eigenbetrieb) | 0,85 | 1,10 | 1,35 | 1,60 |

(Stufe 1 = 0,60 DM/Besucher im Eigenbetrieb.)

## Monatliche Fixkosten je Einrichtung
Basis-Unterhalt/Monat (1975-DM, Stufe-1-Basis), skaliert mit \`1 · 1,4 · 1,9 · 2,5 · 3,2\` je Stufe:
Trainingszentrum 4.000 · Jugendakademie 3.000 · Medizin 2.500 · Fanshop 2.000 · Reha-Zentrum 3.000 · NLZ 4.000 · Leistungszentrum 4.500 · Datenanalyse 3.500. Stadion ausgenommen; Catering je Betriebsform.`,
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
| Reha-Zentrum | 1990 | 240.000 | verkürzt Ausfallzeiten & steigert die Regeneration zusätzlich |
| Nachwuchsleistungszentrum (NLZ) | 1998 | 380.000 | beschleunigt die Jugendentwicklung (Wachstums-Bonus) |
| Leistungszentrum | 2003 | 340.000 | hebt die Anlagenqualität → schnellere Kaderentwicklung |
| Datenanalyse-Zentrum | 2013 | 300.000 | präzisiert das Scouting im Nachwuchs (Genauigkeit) |

## Wirkung im Spiel (real)
- **Reha-Zentrum**: addiert zu Medizin & Reha-Personal — kürzere Verletzungsausfälle und mehr tägliche Regeneration.
- **NLZ**: erhöht den Wachstums-Bonus in der wöchentlichen Jugendentwicklung (\`developYouthWeekly\`).
- **Leistungszentrum**: fließt in die **Anlagenqualität** (facilitiesQuality) ein — wie das Trainingszentrum, aber
  additiv on top — und beschleunigt so die Attribut-Entwicklung des Profikaders.
- **Datenanalyse-Zentrum**: erhöht die Scouting-Genauigkeit im Nachwuchs, zusätzlich zum Scouting-Personal.

Alle vier Einrichtungen haben — wie die Grund-Einrichtungen — **5 Stufen** und werden erst ab ihrem Freischaltjahr
ausbaubar.`,
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
| Gehalt/Monat (Basis) | 1.200 | 2.500 | 5.000 | 10.000 | 20.000 |

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

(*) Die Verletzungs-Reduktion wird als Faktor bereitgestellt und dort angewandt, wo das Spiel Verletzungen
auslöst; im aktuellen Spielverlauf treten aktive Verletzungen selten auf, daher ist dieser Wert v. a. vorbereitet.`,
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
    keywords: ['kalender', 'monat', 'aktivität', 'trainingslager', 'freundschaftsspiel', 'teambuilding', 'planen', 'freie tage', 'kollision'],
    body: `## Monatskalender
Im Bereich **Kalender** (in der unteren Navigation) siehst du den aktuellen Monat als Tagesraster (Mo–So).
Du blätterst mit **‹ Vormonat** / **Folgemonat ›**. Die Tage sind farblich markiert:

- **frei** (grün umrandet, klickbar) — planbar
- **Spiel/Planung** (rot) — Ligaspiel , Pokalspiel oder bereits geplante Aktivität 
- **heute** (türkiser Rahmen)
- **Auswahl** (grün = gültiger Zeitraum, rot = Kollision)

## Aktivitäten planen
Oben wählst du den Typ, bei mehrtägigen Aktivitäten die Dauer, klickst einen **freien Starttag** und bestätigst
mit **„Einplanen"**. Planung ist **nur an freien Tagen** möglich — der komplette Zeitraum darf mit **keinem
Spiel und keiner anderen Aktivität** kollidieren.

| Aktivität | Dauer | Kosten (Basis) | Effekt | Erlös |
|---|---|---|---|---|
| Trainingslager | 3–10 Tage | 9.000/Tag | Fitness +12, Form +5, Moral ↑ | – |
| Freundschaftsspiel | 1 Tag | keine | Fitness +5, Form +4 | +22.000 (Basis) |
| Teambuilding-Event | 1–2 Tage | 6.000/Tag | Form +3, Moral ↑ | – |

## Buchung & Wirkung
- **Kosten** werden **sofort bei der Planung** vom Vereinskonto gebucht (ära-gerecht skaliert). Noch nicht
  begonnene Aktivitäten lassen sich **stornieren** (Kosten werden erstattet).
- Die **Effekte** (Fitness/Form/Moral auf den Kader) treten ein, sobald das **Enddatum** im Kalenderlauf erreicht
  ist (\`App.processDay\`). Der Erlös eines Freundschaftsspiels wird dann als Einnahme gebucht.
- Alle Datumsberechnungen laufen konsequent in **UTC**.`,
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
- **Ein Spiel entscheidet** (Single-Leg). Der **zuerst gezogene Verein hat Heimrecht**.
- Steht es nach **90 Minuten** unentschieden, folgt die **Verlängerung** (2 × 15 Minuten).
- Bleibt es auch nach **120 Minuten** gleich, entscheidet das **Elfmeterschießen** (Best-of-5, danach „Sudden Death").
- In der Anzeige stehen **n.V.** (nach Verlängerung) bzw. **i.E.** (im Elfmeterschießen) hinter dem Ergebnis; bei Elfmeterschießen zusätzlich der Elfmeterstand.

## Auslosung (deterministisch)
- **Nach jeder Runde wird neu ausgelost** — es gibt keinen festen Turnierpfad.
- Alle Auslosungen leiten ihren Zufall aus einem **festen Pokal-Seed** ab. Derselbe Spielstart erzeugt reproduzierbar denselben Wettbewerb.`,
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
- Ergebnisse, Weiterkommen und Auslosung der nächsten Runde erhältst du als **Nachricht** in der Kategorie **Pokal**.

## Preisgeld & Einnahmen
- **Rundenabhängiges Preisgeld** (pro gewonnener Begegnung, in DM):

| Runde | Prämie |
|---|---|
| 1. Hauptrunde | 25.000 DM |
| Achtelfinale | 50.000 DM |
| Viertelfinale | 100.000 DM |
| Halbfinale | 200.000 DM |
| Finale | 400.000 DM |

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
    title: 'Europapokal — Die drei Wettbewerbe',
    keywords: ['europapokal', 'europa', 'landesmeister', 'pokalsieger', 'uefa', 'ec', 'cwc', 'international', 'europacup'],
    body: `## Drei Wettbewerbe wie 1975
Parallel zur Liga und zum Landespokal laufen die **drei europäischen Wettbewerbe der Ära** — genau wie 1975/76. Sie haben eine eigene Seite (**International** in der Navigation) mit den Begegnungen je Wettbewerb.

| Kürzel | Wettbewerb | Feld | deutsche Plätze |
|---|---|---|---|
| ec | Europapokal der Landesmeister | 16 | 1 (Meister) |
| cwc | Europapokal der Pokalsieger | 16 | 1 (Landespokalsieger) |
| uefa | Europa-Pokal | 32 | 3 (Ligaplätze 2–4) |

- **Europapokal der Landesmeister:** 16 Teams — **15 ausländische** Vereine + der **deutsche Meister**.
- **Europapokal der Pokalsieger:** 16 Teams — **15 ausländische** Vereine + der **deutsche Landespokalsieger**.
- **Europa-Pokal:** 32 Teams — **29 ausländische** Vereine + **3 deutsche** (Ligaplätze 2–4).

Das Feld geht in jedem Wettbewerb exakt auf (16/16/32).

## Ausländische Teilnehmer
- In der **ersten Saison** stammen die ausländischen Klubs aus dem Datensatz (\`src/data/europe.ts\`), angelehnt an die Spitzenvereine des Jahres 1975, mit erfundenen Namen (z. B. Madrid Weiß, Liverpool Rot, Amsterdam, Turin Schwarz-Weiß).
- **Ab der zweiten Saison** qualifizieren sich die Auslandsvereine sportlich über ihre eigenen Ligen (siehe **Europa im Hintergrund**).
- Ihre **Stärke** liegt auf der Skala ~55–82 (plausible Spielwerte, keine exakten historischen Tabellenplätze).
- Sie werden als leichte Einträge geführt (Name/Stadt/Land/Stärke/Farben) — **kein voller Kader**, solange dein Verein nicht gegen sie spielt.

## Erste Saison 1975/76 — feste historische Starter
Für die allererste Saison gibt es noch keine gespielte Vorsaison. Deshalb sind die deutschen Starter fest auf die realen Europapokal-Teilnehmer 1975/76 gesetzt (Basis Saison 1974/75):
- **Landesmeister-Pokal:** Mönchengladbach (Meister 1974/75)
- **Pokalsieger-Pokal:** Frankfurt Rot (Landespokalsieger 1974/75)
- **Europa-Pokal:** Berlin Blau, Offenbach, Duisburg (Ligaplätze 2–4)

Ab 1976/77 werden die deutschen Teilnehmer dynamisch aus dem Spielstand ermittelt (siehe **Qualifikation**).`,
  },
  {
    id: 'euro-qualification',
    category: 'euro',
    title: 'Europapokal — Qualifikation & K.-o.-Format',
    keywords: ['qualifikation', 'meister', 'vizemeister', 'pokalsieger', 'finalist', 'kaskade', 'ko', 'verlängerung', 'elfmeter', 'auslosung'],
    body: `## Deutsche Qualifikation (ab 1976/77)
Die Europapokal-Saison X/Y wird aus der **Vorsaison** gespeist:

- **Landesmeister-Pokal (ec):** der **Meister** der Vorsaison (Endtabelle 1. Liga, Platz 1).
- **Pokalsieger-Pokal (cwc):** der **Landespokalsieger** der Vorsaison. Ist er zugleich Meister (also schon im Landesmeister-Pokal), rückt der **Pokalfinalist** (Verlierer des Finales) nach; ist auch der nicht ermittelbar, der **Vizemeister**.
- **Europa-Pokal:** die nächsten **3 Ligaplätze ab Platz 2** (also 2, 3, 4). Kein Verein darf doppelt qualifiziert sein: bereits für ec/cwc qualifizierte Vereine werden entfernt und die Startplätze **kaskadieren nach unten** (Platz 5, 6, …), bis genau 3 Europapokal-Starter feststehen.

Die deutschen Starter sind immer volle Vereine des Spielstands. Nur dein Verein wird real gemanagt; die übrigen deutschen laufen wie die ausländischen per Stärke.

## K.-o.-Format — ein Spiel pro Runde
- **Ein Spiel entscheidet** je Runde (kein Hin- und Rückspiel — „basic"). Der **zuerst gezogene Verein hat Heimrecht**.
- Steht es nach **90 Minuten** unentschieden, folgt die **Verlängerung**; bleibt es auch danach gleich, entscheidet das **Elfmeterschießen**.
- In der Anzeige stehen **n.V.** (nach Verlängerung) bzw. **i.E.** (im Elfmeterschießen) hinter dem Ergebnis.
- **Runden je Wettbewerb:**
  - Landesmeister-Pokal & Pokalsieger-Pokal (16 Teams): Achtelfinale, Viertelfinale, Halbfinale, Finale.
  - Europa-Pokal (32 Teams): 1. Runde, Achtelfinale, Viertelfinale, Halbfinale, Finale.

## Auslosung & Termine
- **Nach jeder Runde wird neu ausgelost** — kein fester Turnierpfad. Alle Auslosungen leiten ihren Zufall aus einem **festen Seed** ab (reproduzierbar).
- Die europäischen Runden liegen historisch über die Saison verteilt (Herbst-Runden, Frühjahr Viertel-/Halbfinale, Mai Finale) auf **Mitte-der-Woche-Terminen** und werden **kollisionsfrei zu Liga- und Landespokal-Terminen** geplant (bei Kollision tageweise verschoben).`,
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
- Jeder Verein hat eine **Größe** (Stadt, Tradition, Wirtschaftskraft). Sie zieht seine Stärke langfristig an und wächst mit Titeln und Europapokal-Erfolgen – kehrt aber langsam zur natürlichen Größe zurück.
- Ein **Generationen-Zyklus** sorgt für goldene und magere Jahre: Auch große Vereine erleben Durststrecken, kleine Vereine haben ihre Glanzzeit.
- Das **Niveau der Länder** verschiebt sich über die Jahrzehnte (z. B. wird England ab den 1990ern stärker, Osteuropa schwächer).

## Koeffizienten (Fünfjahreswertung)
- Jede Europapokal-Saison bringt Punkte: 1 für die Teilnahme, 2 je gewonnener Runde, 2 Bonus für den Titel. Der Landeswert ist der Schnitt der Starter eines Landes, summiert über die **letzten fünf Saisons**.
- Danach richten sich die Startplätze: Die **Meister der 15 bestplatzierten Länder** spielen im Landesmeister-Pokal, deren **Pokalsieger** im Pokalsieger-Pokal (ist der Pokalsieger schon Meister, rückt der Nächste der Tabelle nach). Im **Europa-Pokal** erhalten die Länder auf Rang 1–2 drei Plätze, Rang 3–9 zwei, Rang 10–18 einen.
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
| 1. Runde (nur Europa-Verband) | — | — | 20.000 |
| Achtelfinale | 50.000 | 40.000 | 40.000 |
| Viertelfinale | 100.000 | 80.000 | 80.000 |
| Halbfinale | 200.000 | 160.000 | 160.000 |
| Finale | 400.000 | 320.000 | 320.000 |

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

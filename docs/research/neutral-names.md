# Neutrale Namen für Verbände, Wettbewerbe, Institutionen und feste Begriffe

Stand 11/2026 (Stufe 2: 22.11.2026). Entscheidungen von Pascal:

1. „Ja, Verbände und Wettbewerbe müssen neutral heißen.“
2. Parteien und Institutionen (SED, CDU, SPD, NATO, EU, EZB …): „Wenn da keine Klagen kann, dann drin lassen. Ansonsten rausnehmen.“
3. Feste Begriffe mit Namen (Bosman-Urteil, Hartz IV, Orkan Kyrill, Stuttgart 21, Fridays for Future, Ice Bucket Challenge): „Hier gilt das Gleiche wie bei 2.“
4. Weltpokal, Klub-WM, Interkontinentalpokal, Goldener Schuh, (Europäischer) Supercup und alle übrigen noch realen Wettbewerbs- und Preisnamen: „Ja, bitte alles neutral umbenennen.“ Dazu Orte als Marke („Wembley“) und der Filmtitel „Sommermärchen“.
5. „Erstligist“ klingt holprig („als erster Erstligist“): überall sprachlich glätten.

**Keine Rechtsberatung.** Das hier ist eine Einschätzung für die Arbeit am Spiel. Vor der Veröffentlichung auf Steam sollte jemand mit Fachwissen im Marken- und Wettbewerbsrecht darauf schauen.

## 1. Verbände und Wettbewerbe – umbenannt

Verbände und Ligen vermarkten ihre Namen und Logos als eingetragene Marken (UEFA Champions League, Bundesliga, DFB-Pokal, Premier League, Serie A, LaLiga …). Sportspiele zahlen für diese Namen Lizenzen. Ohne Lizenz könnte das Spiel den Eindruck einer offiziellen Partnerschaft erwecken. Deshalb heißen sie im Spiel durchgehend neutral (Schema-Tabelle in `CLAUDE.md`, Regeln in `src/data/neutralNames.ts`):
Weltverband, Europaverband, Fußballbund, Ligaverband, Regelgremium, 1. Liga/2. Liga, Landespokal, Pokal der Landesmeister → Meisterliga, Pokal der Pokalsieger → Europa-Trophäe, Messepokal → Europa-Pokal → Kontinental-Liga, Jugend-Meisterliga (Stufe 3: die früheren Namen „Europa-Liga“ und „Konferenz-Liga“ waren direkte Übersetzungen der Marken „Europa League“/„Conference League“ und wurden ersetzt; „Europa-Pokal“/„Europapokal“ bleibt als allgemeiner historischer Begriff), Nationenliga, Sommerpokal.

### Stufe 2 (Entscheidung 4, Spielstände `game.namesV` 2)

Auch Namen, die nur die eingeführte deutsche Übersetzung eines geschützten Wettbewerbs sind, heißen jetzt eigen. Der Grund: Sie zeigen ohne Lizenz eindeutig auf den echten Veranstalter. Das Schema soll kurz sein, gut klingen und mit keinem echten Wettbewerb verwechselbar sein. Das Geschlecht bleibt möglichst gleich, damit Sätze und alte Spielstände grammatisch stimmen. Nur das Klub-Weltturnier ist sächlich statt weiblich; die Migration zieht Artikel und Präpositionen mit.

| echt | im Spiel | Begründung |
|---|---|---|
| Weltpokal / Intercontinental Cup (1960–2004) | Transatlantik-Pokal | Europas gegen Südamerikas Meister, also über den Atlantik |
| Klub-WM / Klub-Weltmeisterschaft (2000, 2005–) | Klub-Weltturnier (das) | beschreibt das Turnier, ohne „Weltmeisterschaft“ als Titel zu führen |
| Interkontinentalpokal (ab 2024) | Kontinentalsieger-Pokal | die Sieger der Kontinentalpokale spielen ihn aus |
| Confed-Cup / Konföderationen-Pokal | Turnier der Kontinentalmeister | nur im Briefing 2005 |
| (DFB-/DFL-)Supercup, Supercups der Länder | Gipfelpokal | Meister gegen Pokalsieger, das Gipfeltreffen zum Saisonstart |
| UEFA-Supercup | Europäischer Gipfelpokal | |
| DFL-Ligapokal (1997–2007) | Auftaktpokal | Turnier vor dem Saisonstart; der portugiesische Liga-Pokal heißt „Pokal der Profiligen“ |
| Hallen-Masters / „das Masters“ (1988–2001) | Hallenfinale (Hallenfinal-Wertung, -Platz, -Sieger) | „Masters“ war der Vermarktungsname; Hallenpokal bleibt (Gattung) |
| Ballon d'Or / Goldener Ball | Goldener Stern | „Goldener Ball“ ist die Übersetzung von „Ballon d'Or“ und zugleich ein Preis bei der WM; der Gala-Pokal ist jetzt ein Stern |
| Goldener Schuh (European Golden Shoe) | Torjägerstern | gleiche Familie wie der Goldene Stern; „Goldener Stiefel“ wäre ebenfalls real |
| Wembley (Stadion, Arena) | London, Arena im Londoner Nordwesten | Wembley ist eine geschützte Marke des Stadionbetreibers |
| „Sommermärchen“ (Titel des WM-Films 2006) | Heim-WM, WM-Sommer, Fußballsommer | |

Bleiben, weil es reine Gattungs- oder Ortsbegriffe sind: Weltmeisterschaft/WM und Europameisterschaft/EM (der Bundesgerichtshof hat 2006 die Wortmarke „FUSSBALL WM 2006“ mangels Unterscheidungskraft weitgehend gelöscht; Jahres-Marken wie „EURO 2024“ werden trotzdem nicht benutzt), Europapokal (als Oberbegriff), Hallenpokal, Fünfjahreswertung, Trainer des Jahres, (Europas) Fußballer des Jahres, Meisterschale, Spielorte wie Westfalenhalle oder Olympiahalle und Olympia als historisches Ereignis (nur Nennung, kein Wettbewerb im Spiel). Grenzfälle sind die eigenen Übersetzungen Europa-Pokal, Kontinental-Liga und Europa-Trophäe aus Stufe 1. Sie bleiben vorerst, sollten aber vor der Veröffentlichung noch einmal geprüft werden.

**Sprache:** „Erstligist“ heißt in Texten „Verein der 1. Liga“, „Klub der 1. Liga“ oder „Oberhaus-Klub“, je nach Satz. Die Migration alter Spielstände setzt „Klub der 1. Liga“ mit dem passenden Fall ein (Begleiter davor entscheidet über Einzahl/Mehrzahl). Wortverbindungen wie „Erstligaspiel“ oder „Erstliga-Profis“ bleiben.

## 2. Parteien und Institutionen – bleiben (nur Nennung)

SED, CDU, SPD, FDP, Grüne, NATO, EU, EZB, UNO und Behörden wie die Bundesanstalt für Arbeit werden nur im historischen Zusammenhang genannt („1990 tritt die DDR der Bundesrepublik bei“, „die EZB senkt den Leitzins“). Die bloße Nennung einer Partei oder Institution in einer Tatsachenschilderung ist nach allgemeinem Verständnis keine Markennutzung. Es wird nichts verkauft, und es entsteht kein Eindruck einer Billigung. Deshalb bleibt sie im Spiel. Ausgeschlossen sind Logos, Embleme, Flaggen der Organisationen und jede Darstellung, die nach Unterstützung oder Werbung aussieht. Personen bleiben ohnehin umschrieben („der Bundeskanzler“).

## 3. Feste Begriffe

- **Bleiben:** Ereignis- und Rechtsbegriffe ohne Markenschutz, die nur einen Vorgang benennen. Dazu gehören das Bosman-Urteil (Gerichtsentscheidung), Hartz IV (Gesetzesname), Orkan Kyrill (Name eines Wetterdienstes für ein Sturmtief), Stuttgart 21 (Name eines öffentlichen Bauprojekts) sowie Calciopoli und Totonero (Skandalnamen der Presse). „Sommermärchen“ ist seit Stufe 2 umschrieben (Filmtitel).
- **Umschrieben:** Kampagnen- und Aktionsnamen sowie Organisationsnamen, die als Marke oder Bewegungsname geführt werden: „Fridays for Future“ → „Schulstreiks fürs Klima“, „Ice Bucket Challenge“ → „Eiswasser für die Forschung“, „One Love“-Binde → „bunte Kapitänsbinde gegen Diskriminierung“. Sender, Sendungen, Zeitschriften und Produkte waren schon umschrieben (Sperrliste `tests/realnames-test.ts`, `tests/realPeopleList.ts`). Neu gefunden und ersetzt wurde „Jugend-Kicker-Pokal“ (Zeitschriftenname) → „Junioren-Pokal“.

## Prüfung

- `npm run test:names`: Gruppe `ORGS` (+ `CLUNKY` für „Erstligist“) in `tests/realPeopleList.ts`, durchsucht alle String-Inhalte unter `src/`. Ausgenommen sind die Regeln selbst, die Recherche-Belege in `data/leagueTiers.ts`, Quellen mit `url:` und reine interne Schlüssel.
- `npm run test:texts`: harter Fehler „echter Verbands-/Wettbewerbsname“ in Ticker, Presse, Nachrichten und Briefing.
- Alte Spielstände: `migrateNeutralNames` (`game/neutralNamesMigration.ts`, `game.namesV` 1 → 2) schreibt gespeicherte Anzeigetexte einmal beim Laden um. Personennamen (`firstName`/`lastName`/`fullName`) bleiben, damit ein Spieler namens Masters nicht umbenannt wird. `npm run test:savecompat` prüft, dass in allen eingefrorenen Ständen danach kein alter Name übrig ist.

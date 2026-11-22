# Neutrale Namen für Verbände, Wettbewerbe, Institutionen und feste Begriffe

Stand 11/2026. Entscheidungen von Pascal:

1. „Ja, Verbände und Wettbewerbe müssen neutral heißen.“
2. Parteien und Institutionen (SED, CDU, SPD, NATO, EU, EZB …): „Wenn da keine Klagen kann, dann drin lassen. Ansonsten rausnehmen.“
3. Feste Begriffe mit Namen (Bosman-Urteil, Hartz IV, Orkan Kyrill, Stuttgart 21, Fridays for Future, Ice Bucket Challenge): „Hier gilt das Gleiche wie bei 2.“

**Keine Rechtsberatung.** Das hier ist eine Einschätzung für die Arbeit am Spiel. Vor der Veröffentlichung auf Steam sollte jemand mit Fachwissen im Marken- und Wettbewerbsrecht darauf schauen.

## 1. Verbände und Wettbewerbe – umbenannt

Verbände und Ligen vermarkten ihre Namen und Logos als eingetragene Marken (UEFA Champions League, Bundesliga, DFB-Pokal, Premier League, Serie A, LaLiga …). Sportspiele zahlen für diese Namen Lizenzen. Ohne Lizenz könnte das Spiel den Eindruck einer offiziellen Partnerschaft erwecken. Deshalb heißen sie im Spiel durchgehend neutral (Schema-Tabelle in `CLAUDE.md`, Regeln in `src/data/neutralNames.ts`):
Weltverband, Europaverband, Fußballbund, Ligaverband, Regelgremium, 1. Liga/2. Liga, Landespokal, Pokal der Landesmeister → Meisterliga, Pokal der Pokalsieger → Konferenz-Liga, Messepokal → Europa-Pokal → Europa-Liga, Jugend-Meisterliga, Nationenliga, Sommerpokal, Goldener Ball.

Gattungsbegriffe bleiben: Weltmeisterschaft/WM, Europameisterschaft/EM, Weltpokal, Klub-Weltmeisterschaft, Supercup, Europapokal (als Oberbegriff), Fünfjahreswertung, Transfermarkt. Grenzfälle: „Weltpokal“, „Klub-WM“ und „Goldener Schuh“ sind beschreibende deutsche Begriffe und keine eingetragenen Wortmarken. Sie bleiben deshalb stehen. Das sollte vor der Veröffentlichung noch einmal geprüft werden.

## 2. Parteien und Institutionen – bleiben (nur Nennung)

SED, CDU, SPD, FDP, Grüne, NATO, EU, EZB, UNO und Behörden wie die Bundesanstalt für Arbeit werden nur im historischen Zusammenhang genannt („1990 tritt die DDR der Bundesrepublik bei“, „die EZB senkt den Leitzins“). Die bloße Nennung einer Partei oder Institution in einer Tatsachenschilderung ist nach allgemeinem Verständnis keine Markennutzung. Es wird nichts verkauft, und es entsteht kein Eindruck einer Billigung. Deshalb bleibt sie im Spiel. Ausgeschlossen sind Logos, Embleme, Flaggen der Organisationen und jede Darstellung, die nach Unterstützung oder Werbung aussieht. Personen bleiben ohnehin umschrieben („der Bundeskanzler“).

## 3. Feste Begriffe

- **Bleiben:** Ereignis- und Rechtsbegriffe ohne Markenschutz, die nur einen Vorgang benennen. Dazu gehören das Bosman-Urteil (Gerichtsentscheidung), Hartz IV (Gesetzesname), Orkan Kyrill (Name eines Wetterdienstes für ein Sturmtief), Stuttgart 21 (Name eines öffentlichen Bauprojekts), Sommermärchen (Schlagwort der WM 2006) sowie Calciopoli und Totonero (Skandalnamen der Presse).
- **Umschrieben:** Kampagnen- und Aktionsnamen sowie Organisationsnamen, die als Marke oder Bewegungsname geführt werden: „Fridays for Future“ → „Schulstreiks fürs Klima“, „Ice Bucket Challenge“ → „Eiswasser für die Forschung“, „One Love“-Binde → „bunte Kapitänsbinde gegen Diskriminierung“. Sender, Sendungen, Zeitschriften und Produkte waren schon umschrieben (Sperrliste `tests/realnames-test.ts`, `tests/realPeopleList.ts`). Neu gefunden und ersetzt wurde „Jugend-Kicker-Pokal“ (Zeitschriftenname) → „Junioren-Pokal“.

## Prüfung

- `npm run test:names`: Gruppe `ORGS` in `tests/realPeopleList.ts`, durchsucht alle String-Inhalte unter `src/`. Ausgenommen sind die Regeln selbst, die Recherche-Belege in `data/leagueTiers.ts`, Quellen mit `url:` und reine interne Schlüssel.
- `npm run test:texts`: harter Fehler „echter Verbands-/Wettbewerbsname“ in Ticker, Presse, Nachrichten und Briefing.
- Alte Spielstände: `migrateNeutralNames` (`game/neutralNamesMigration.ts`) schreibt gespeicherte Anzeigetexte einmal beim Laden um.

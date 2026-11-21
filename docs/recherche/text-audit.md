# Text-Audit (Nachtauftrag Pascal, 21.11.2026)

Ziel: Texte des Spiels im großen Stil erzeugen, automatisch prüfen und die Bausteine verbessern
(Grammatik, Wiederholungen, Epochen, unpassende Inhalte). Werkzeug: `npm run test:texts`
(`tests/text-audit.ts`, Regeln in `tests/textAuditChecks.ts`).

## Was erzeugt wird (ein Lauf ≈ 1,5–2,5 Min.)

| Quelle | Umfang | Wie |
|---|---|---|
| Ticker | 180 Spiele (je 30 in 1975, 1985, 1995, 2005, 2015, 2025), ≈ 34 700 Zeilen | `MatchSim` + `Narrator` wie `scripts/tickerdemo.mjs`, Pokal (Verlängerung/Elfmeter), Derby (gleiche Stadt), Zurufe, Halbzeitansprache, mit/ohne eigene Seite |
| Presse | ≈ 1 090 Ausgaben, ≈ 40 600 Texte (Schlagzeile, Unterzeile, Rubrik, Absätze) | `buildEdition` für jeden Erscheinungstag der Saison an 12 Vorlagen aus `public/saves/` (Frankfurt-Reihe 1978–2025, 2. Liga 1977, Regionalliga 1995, 3. Liga 2010, England 1992, Italien 1985, DDR 1980) nach dem Weiterspielen |
| Nachrichten | ≈ 2 900 Texte (Betreff, Kurztext, Text, Antworten) | `g.messages`, die beim Weiterspielen neu entstehen: 130 Tage je Vorlage, drei Vorlagen (1978, 1995, 2015) über den Saisonwechsel + 75 Tage |
| Briefings | ≈ 7 600 Texte | `composeBriefing` 1975/76–2030/31 + Epochen-Tipps |

## Prüfregeln

- **Platzhalter / leere Slots**: `#symbol#`, `{slot}`, `[a|b]`, `${`, `undefined`, `NaN`, `null`, `[object Object]`; zusätzlich wird `Speaker.expand` mitgeschnitten – jeder `{slot}` ohne Wert zählt.
- **Mehrzahl**: „1 Tore“, „1 Spielen“, „1 weitere Saisons“, „3 Tor“ …; **Genus**: „ein Niederlage“, „eine Sieg“ …
- **Artikel vor Vereinsnamen**: „des Frankfurt Rot“, „beim Bremen“ (nur Namen, die mit der Stadt beginnen; „des VfB Bocholt“ ist richtig).
- **doppelte Wörter**, **Leerzeichen** (doppelt, vor Satzzeichen, fehlend nach Komma/Punkt), **Satzzeichen** (`..`, `!.`, `,.`, leere Klammern), **ae/oe/ue statt Umlaut** (ohne Namen/Fremdwörter), **Kleinschreibung am Anfang**, fehlendes Satzende (nur Hinweis).
- **Grammatik-Muster** aus der Durchsicht: „gastierte X gegen Y“, „verlässt Ausland“, „Mittwoch, Mi,“, „des Achtelfinale“, „mit einen“ …
- **Epochen** (`ERA_RULES`): soziale Netzwerke < 2007, Internet < 1996, Handy < 1993, Smartphone/App < 2009, Videobeweis < 2016, Champions League < 1992, Europa League < 2009, UEFA-Cup > 2009, Libero > 2001, Viererkette < 1990, Pressing < 1987, Gegenpressing < 2005, Halbräume < 2008, xG/Datenanalyse < 2012, Rückpassregel < 1992, Golden Goal außerhalb 1996–2004, Bosman < 1995, Gelb-Rot < 1991, Ultras < 1995, „Sechser“ < 1995, One-Touch < 2000, Physio/Trinkpause/LED-Banden im Ticker, „Dreier“/„um drei Punkte“ ohne Drei-Punkte-Regel, DDR nach 1991 (außer Rückblick). Briefings sind ausgenommen (sie vergleichen bewusst mit heute).
- **Währung**: € vor 2002 bzw. DM ab 2002 (Heimat Deutschland), DM im Ausland.
- **Inhalt**: „Richtung zweite Liga“/„Jagd auf die Schale“ unterhalb der 1. Liga, Aufstiegsrennen in der 1. Liga, Rubrik „Bundesliga“ in anderen Ligen/Ländern, Derby-Regionen mit Städten > 160 km auseinander.
- **Echte Namen**: weiter `npm run test:names` (grün).
- **Wiederholung**: je Einheit (ein Spiel, eine Ausgabe, ein Spielstand) Anteil der Sätze, die wörtlich bzw. als gleiches Muster (Eigennamen → §, Zahlen → 0) schon vorkamen.

## Ergebnis vorher → nachher

Gleicher Prüfstand (gleiche Regeln, gleiche Seeds) auf Stand `bd1f36d` (vorher) und nach den Änderungen.

| Fehlerart | vorher | nachher |
|---|---:|---:|
| Inhalt (Rubrik „Bundesliga“ in 2./3. Liga, England, Italien, DDR · „Richtung zweite Liga“/„Jagd auf die Schale“ unterhalb der 1. Liga · 46 Derby-Paare > 160 km) | 796 | 0 |
| Mehrzahl („1 Tore“, „1 Spielen“, „1 Einsätze“, „1 Partien“, „1 weitere Saisons“, „1 Torschüsse“ …) | 181 | 0 |
| Grammatik („verlässt Ausland“, „Mittwoch, Mi,“, „gastierte Köln Rot gegen …“) | 167 | 0 |
| Epoche (One-Touch 41, „Sechser“ 24, Pressing 12, LED-Banden 9, „Dreier“ vor 1995 9, Physio 4, Trinkpause 2, Bosman-Vorgriff 1979 1) | 102 | 0 |
| Genus („ein Niederlage aus deiner Sicht“) | 63 | 0 |
| Umlaut („Mitgliedsbeitraege“) | 57 | 0 |
| **Harte Fehler gesamt** | **1 366** | **0** |
| Satzende fehlt (Hinweis, Kurzmeldung aus einer Nachricht) | 1 | 1 |

| Wiederholung | vorher | nachher |
|---|---:|---:|
| Ticker: wörtlich gleiche Zeile im selben Spiel | 2,92 % | 1,21 % |
| Ticker: gleiches Muster im selben Spiel | 13,83 % | 4,34 % |
| Presse: gleicher Satz in derselben Ausgabe | 0,67 % | 0,42 % |
| Presse: gleiches Satzmuster in derselben Ausgabe | 4,03 % | 2,21 % |
| Presse: Schlagzeile wörtlich schon in der Saison | 34,50 % | 26,66 % |
| Presse: Schlagzeilen-Muster schon in der Saison | 74,59 % | 67,10 % |
| Nachrichten: Betreff-Muster je Spielstand | 19,75 % | 20,10 % (Monats-/Trainingsberichte, gewollt gleich) |

Häufigste Ticker-Wiederholungen vorher: „§ klärt per Kopf vor §“ (186 ×), „§ kommt nicht an § vorbei – in der Luft …“ (185 ×), „Kopfballduell: § gewinnt gegen §“ (180 ×), „Ecke für §“ (119 ×), „Abgefälscht – Ecke.“ (104 ×). Nachher liegt die häufigste wiederholte Zeile bei 27 × in 180 Spielen.

## Was geändert wurde

**Presse** (`data/press/grammar.ts`, `game/press/`)
- Rubrik der Spielberichte = Name der eigenen Liga (`divisionTitle`) statt fest „Bundesliga“.
- Flags für alle Texte einer Ausgabe: `p3` (Drei-Punkte-Regel), `oberhaus` (1. Liga), `schale` (deutsche 1. Liga) – „Dreier“, „Richtung zweite Liga“, „Jagd auf die Schale“, Meisterschafts-/Aufstiegsfavorit nur, wo es passt.
- Zahl + Nomen mit Kasus (`count`): „nach einem Spiel mit 2 Punkten“, „kam auf einen Einsatz und kein Tor“, „mit einem Punkt Rückstand“, „Nach einem Jahr an der Seitenlinie“, „aus dem letzten Spiel“, „ein Remis“; Ausfallzeit im Dativ („rechnet mit zwölf Tagen Pause“).
- Transfer-Texte bekommen ihre Flags (vorher „verlässt Ausland und schließt sich … an“); „Es zieht X ins Ausland“.
- „David schlägt Goliath: X gewinnt bei Y“ nur bei Auswärtssieg; „Aus im Viertelfinale“ statt „Aus in Viertelfinale“; „Dahinter lauert …“ nur bei höchstens drei Punkten Abstand; Tabellenkeller „A, B und C“.
- „Sechser“ erst ab 1995 (vorher „Mittelfeldspieler“).
- Kurzmeldungen aus Nachrichten ohne Menüpfade „(Jugend › …)“ und ohne Sätze, die dich direkt ansprechen.
- Gerüchte reihum über die Kandidaten (nicht jede Ausgabe dasselbe), viele neue Varianten (Sieg, Remis, knapper Sieg, Held, Transfer, Ablöse, Gerücht, Verletzung, Tabellenspitze/-keller, Vorschau, Rekorde, Kommentar).

**Ticker** (`data/ticker/`; `duels.ts` und `engine/match/*` unverändert)
- Epochen-Sperren: Pressing ab 1987 (vorher „Umklammerung“), One-Touch ab 2000, Physio ab 1990 (vorher Masseur), Trinkpause ab 2010, blinkende LED-Banden ab 2005 (1990–2004 Prismenbanden), Derby „um mehr als drei Punkte“ erst ab 1995 (vorher zwei).
- Neue Datei `duelsMore.ts`: zusätzliche Varianten für die häufigsten Duell-Symbole, im Erzähler über `withMore(DUELS, DUELS_MORE)` angehängt; mehr Varianten für Ecken, Abseits, Gelb, Wechselgründe, Abschluss, Kopfball, Fernschuss, drüber/vorbei.
- „kommt bisher auf 1 Torschuss“; `tidy` schreibt nach Ordnungszahlen nicht mehr groß („der Tabellen-5. empfängt“).

**Nachrichten**
- Spielbericht: „gastierte Frankfurt Rot bei Nürnberg“ (vorher vertauscht), „eine Niederlage“, „60 % : 40 %“.
- Pokal-/Europapokal-Prämien in der Währung der Zeit (vorher immer „DM“, auch 2025); „Ausgelost: Achtelfinale im Landespokal …“ statt „Die Auslosung des Achtelfinale“, „des Pokals der Landesmeister“; alte Meldung „18 Bundesligisten und 14 Amateurvereine“ ersetzt durch die echte Teilnehmerzahl.
- Buchungstexte „Mitgliedsbeiträge“, „Spieltagserlöse“, „Gebäude-Fixkosten“, „Prämie“.
- Mehrzahl in Bewertungsrunde, Auszeichnungen/Goldener Ball, Europapokal-Gruppen, Punktabzug, Sponsor-Verlängerung („für eine weitere Saison“), Briefing („1 Änderung“) über `nOf` (`engine/textNum.ts`).
- Spielabsage: „Mittwoch, 14. Feb 1979“ statt „Mittwoch, Mi, 14. Feb 1979“.
- Vertragsende vor dem Bosman-Urteil: kein Vorgriff mehr („das ändert sich erst mit dem Bosman-Urteil“ in 1979) – bis 1990 „so will es das Transferrecht“, ab 1991 Hinweis auf die laufende Klage.

**Derbys** (`engine/environment.ts`)
- Region allein reicht nicht mehr: höchstens 160 km Luftlinie (Kiel–Braunschweig, Kassel–Saarbrücken, München–Würzburg, Dresden–Rostock … sind keine Derbys mehr; Nordderby Hamburg–Bremen, Bayern-Derby München–Nürnberg, Südwest Frankfurt–Kaiserslautern bleiben). „Frankfurt (Oder)“ zählt nicht mehr als Frankfurt (jetzt Berlin & Brandenburg), Osnabrück zusätzlich Westfalen.
- Polizei-Warnung „vor dem Derby gegen X“ nur, wenn X wirklich der nächste Gegner in den kommenden vier Wochen ist. Wiki „Fan-Stimmung“ ergänzt.

## Offen / für andere Branches

- `data/ticker/duels.ts`: „@-1991 Libero {d} räumt in der Luft ab.“ nennt jeden Verteidiger „Libero“, auch Innen-/Außenverteidiger – besser nur mit Flag für die Position (Match-Engine-Branch).
- Presse-Schlagzeilen über die Saison wiederholen sich naturgemäß (gleiche Spieler im Gerücht, gleicher Spitzenreiter); Werte oben eher als Trend lesen.
- Nachrichten-Texte sind weiter Vorlagen in vielen Modulen (keine Grammatik); neue Texte mit Zahlen bitte über `nOf`.

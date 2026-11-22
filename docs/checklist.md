# Prüfliste für alle Seiten (FM1975)

Stand: 20.11.2026. Jede Seite in mehreren Spielständen (1975, DDR 1980, England 1995, 2010+, 2025) und Auflösungen (1920×1080, 1366×768, 2560×1440, Steam Deck 1280×800) prüfen. **A** = automatisch in `npm run test:audit`, **S** = Sichtprüfung anhand der Screenshots.

## 1. Technik
- [A] JS-Fehler, Konsolenwarnungen, React-Key-Warnungen
- [A] Netzwerkfehler: fehlende Bilder (404), Wappen, Flaggen, Gesichter
- [A] Ladezeit je Seite, Hänger beim Umschalten

## 2. Layout
- [A] Waagerechter Überlauf in Boxen/Kopfleisten/Tabellen
- [A] Abgeschnittener Text (Ellipse) bei wichtigen Namen
- [A] Seite scrollt (verboten), feste Boxgrößen wachsen
- [A] Popups/Tooltips außerhalb des Bildschirms
- [S] Überlappungen (Karten, Beschriftungen, Pfeile)
- [A] Wappen uneinheitlich groß/unzentriert

## 3. Inhalt
- [A] „NaN“, „undefined“, „null“, „Infinity“, „[object Object]“ im sichtbaren Text
- [S] Leere Boxen ohne erklärenden Text, unpassende Leertexte
- [S] Falsche Flaggen/Länder
- [S] Wettbewerbe in falschen Listen
- [A] Doppelte Einträge (Namen im Kader, Dropdown-Optionen, Bestenlisten)
- [A] Epochenfehler: € vor 2002, DM nach 2002 (Heimat Deutschland), DDR nach 1991
- [A] Echte Namen/Marken (`test:names`)
- [A] Grammatik-Muster: „1 Tore“, „1 Spiele“, „1 Saisons“, „0 Tor“

## 4. Logik und Daten
- [A] Tabellen: S+U+N = Spiele, Tordifferenz = Tore − Gegentore, Punkte passen zur Regel
- [S] Widersprüche zwischen Seiten (Platz/Stärke Profil vs. Liste)
- [A] Termine außerhalb der Saison, Pflichtspiele an Folgetagen
- [A] Links ins Leere (Profil öffnet nicht)

## 5. Bedienung
- [A] Native `<select>`, Emojis, Farben ohne Token im CSS
- [A] Escape schließt Fenster, Fokus hängt nicht
- [A] Doppelklick auf Aktionsknöpfe löst nichts doppelt aus
- [S] Klickbares ohne Wirkung / ohne Hover

## 6. Einheitlichkeit
- [S] Wappen+Name, Flaggen, Positionsabzeichen, Sterne, Notenfarben, Geld-/Datumsformat überall gleich
- [S] Begriffe einheitlich (Stärke/Gesamt/OVR)
- [A] Sortierung: Länderlisten alphabetisch
- [S] Eigener Verein/Land/Liga überall gleich hervorgehoben
- [S] Klick auf Name/Wappen/Flagge öffnet überall das Profil (ganze Fläche)

## 7. Epochen und Zeitpunkte
- [S] Bildsprache/Begriffe/Währung/Regeln je Epoche
- [S] Direkt nach Saisonwechsel, erster Spieltag, späte Saison
- [S] Sonderfälle: Abstieg, Aufstieg, Pokal-Aus, Entlassung, Ausland, DDR, untere Liga, Nationaltrainer

## 8. Leistung und Speicher
- [A] Spielstandgröße nach 20/40 Jahren, Rechenzeit je Tag
- [A] Seiten mit spürbarer Rechenzeit beim Öffnen

## 9. Robustheit
- [A] Alte Spielstände laden, jede Seite fehlerfrei
- [S] Extremwerte (lange Namen, 0/40 Spieler, Minus-Konto, Millionen)
- [S] Fenster übereinander, Zurück-Kette

## 10. Steam-Tauglichkeit
- [A] Auflösungen 2560×1440, 16:10, Steam Deck 1280×800
- [S] Bedienung ohne Hover (Steam Deck/Touch)
- [S] Lesbarkeit/Kontrast auf dem Steam Deck

## 11. Balance auf den Seiten
- [S] Plausible Wertverteilungen, Torschützen, Ablösen/Gehälter/Zuschauer je Epoche
- [S] Prognosen gegen Ergebnis
- [S] KI-Kader sinnvoll (Größe, Positionen)

## 12. Texte und Erzählung
- [S] Nachrichten/Presse/Ticker passen zur Lage, keine Wiederholungen
- [S] Grammatik in zusammengesetzten Texten (Fall, Genus, Mehrzahl)
- [S] Ton je Epoche

## 13. Bilder
- [S] Gesicht passt zu Alter/Ethnie/Epoche, keine Doppel-Gesichter im Kader
- [S] Pressefotos/Wappen/Trikotfarben passend

## 14. Verknüpfung, Hinweise, Zustand
- [S] Jede Zahl führt zu ihrer Ursache, keine toten Enden
- [S] Kalender/Nachrichten/Aufgaben führen zur richtigen Seite
- [S] Warnungen zu Fristen erscheinen und verschwinden richtig
- [S] Filter/Sortierung/Reiter bleiben erhalten bzw. werden zurückgesetzt
- [A] Nach Speichern + Laden sieht die Seite gleich aus

## 15. Barrierefreiheit
- [S] Farbe nie einzige Information (S/U/N, Eignung)
- [A] Mindestschriftgröße, Kontrast der Tokens
- [A] Symbolknöpfe mit Beschriftung (aria-label/title)

## 16. Recht, Lokalisierung, Langzeit
- [S] Bild-/Schriftrechte, Paketlizenzen, Altersfreigabe-Themen
- [S] Fest verdrahtete Texte/Formate (spätere Übersetzung)
- [A] Determinismus (gleicher Stand + Klickweg = gleiches Ergebnis)
- [A] Spielstand-Kompatibilität über Versionen (feste Test-Spielstände)
- [S] Abbruch beim Speichern hinterlässt keinen kaputten Spielstand
- [A] Langzeitlauf bis 2100+

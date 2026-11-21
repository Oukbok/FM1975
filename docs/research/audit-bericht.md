# Seiten-Check (test:audit)

Erzeugt von `npm run test:audit` (`tests/audit.mjs`, Prüfungen `tests/audit-checks.mjs`). Stände: neu, sim20, liga1-2025, england-1992, ddr-1980. Auflösungen: 1920x1080, 1366x768, 1280x800. 1659 Seitenansichten, 357 Fensteransichten, 2016 Screenshots (`test-output/audit/<auflösung>/<stand>/`), Laufzeit 22 min.

Schwere Arten (✗) lassen den Test scheitern, die übrigen sind Hinweise für die Sichtprüfung. Stand 21.11.2026; die Abschnitte „Sichtprüfung“ und „Offen“ sind von Hand ergänzt (ein neuer Lauf überschreibt die Datei).

| Art | schwer | 1920x1080 | 1366x768 | 1280x800 | verschieden |
|---|---|---:|---:|---:|---:|
| JS-Fehler / Konsole | ✗ | 0 | 0 | 0 | 0 |
| Bild/Datei fehlt (404) | ✗ | 0 | 0 | 0 | 0 |
| undefined/NaN/[object im Text | ✗ | 0 | 0 | 0 | 0 |
| Seite scrollt / abgeschnitten | ✗ | 0 | 0 | 0 | 0 |
| Natives <select> | ✗ | 0 | 0 | 0 | 0 |
| Emoji im Text | ✗ | 0 | 0 | 0 | 0 |
| Box läuft über / wächst |  | 5 | 5 | 5 | 2 |
| Inhalt waagerecht abgeschnitten |  | 0 | 1 | 1 | 1 |
| Waagerechte Bildlaufleiste |  | 13 | 45 | 53 | 10 |
| Text mit … gekürzt |  | 2160 | 3544 | 4589 | 88 |
| Leere Box ohne Leertext |  | 0 | 0 | 0 | 0 |
| Element außerhalb des Fensters |  | 0 | 0 | 0 | 0 |
| Boxen überlappen |  | 0 | 0 | 0 | 0 |
| Schrift < 11 px (effektiv) |  | 0 | 672 | 672 | 1 |
| Textfarbe ohne Token (berechnet) |  | 136 | 136 | 136 | 6 |
| Seite/Fenster nicht erreichbar | ✗ | 0 | 0 | 0 | 0 |
| Menü passt nicht (Einträge verdeckt) | ✗ | 0 | 0 | 0 | 0 |

## Vorher / nachher

Vorher = derselbe Check auf dem Stand vor diesem Durchgang (`DIST=…`, 1659 Seiten-, 357 Fensteransichten). Je Auflösung: vorher → nachher.

| Art | 1920x1080 | 1366x768 | 1280x800 |
|---|---|---|---|
| JS-Fehler / Konsole | 20 → 0 | 20 → 0 | 20 → 0 |
| Bild/Datei fehlt (404) | 20 → 0 | 20 → 0 | 20 → 0 |
| Box läuft über / wächst | 5 → 5 | 5 → 5 | 5 → 5 |
| Inhalt waagerecht abgeschnitten | 0 → 0 | 0 → 1 | 0 → 1 |
| Waagerechte Bildlaufleiste | 13 → 13 | 13 → 45 | 13 → 53 |
| Text mit … gekürzt | 1568 → 2160 | 1568 → 3544 | 1562 → 4589 |
| Schrift < 11 px (effektiv) | 0 → 0 | 672 → 672 | 672 → 672 |
| Textfarbe ohne Token (berechnet) | 136 → 136 | 136 → 136 | 136 → 136 |
| Menü passt nicht (Einträge verdeckt) | 397 → 0 | 0 → 0 | 0 → 0 |

Zum Vergleich: **Schrift** zählt Seiten mit zu kleiner Schrift (jede Seite hat welche); der Anteil der Textstellen unter 11 px sank bei 1366×768 von 97 % auf 71 %, bei 1280×800 von 98 % auf 71 % (Maßstab 0,53/0,50 → 0,63, kleinste Schrift 4,3 → 5,3 px). **Text mit …** zählt nachher jede gekürzte Stelle (alle zeigen jetzt beim Zeigen den vollen Text, `ui/ellipsisTitle.ts`), vorher nur die ohne title – die Zahlen sind deshalb nicht vergleichbar. **Waagerechte Bildlaufleiste** steigt auf kleiner Fläche, weil die Fläche jetzt schmaler ist (2048 statt 2560 CSS-Pixel); betroffen sind breite Tabellen/Bäume, die intern scrollen. **Menü passt nicht**: vorher bei 1920×1080 mit langem Vereinsnamen („Mönchengladbach“) auf 397 Seiten, jetzt nirgends. JS-/404-Fehler vorher: Bild-Slots der Fanartikel ohne Datei.

## Durchgang Lesbarkeit Steam Deck (21.11.2026, Nacht)

Gemessen mit `VIEWS=1280x800,1366x768 SAVES=neu,liga1-2025,england-1992,ddr-1980` (ohne `sim20`), vorher = Build vor dem Durchgang (`DIST=…`), je 894 Seiten- und 190 Fensteransichten je Lauf.

| Art | 1280×800 vorher → nachher | 1366×768 vorher → nachher |
|---|---|---|
| Anteil Textstellen < 11 px (effektiv) | **70,6 % → 13,4 %** (124 404 → 22 121 Stellen) | **70,7 % → 13,5 %** (124 949 → 22 270) |
| Kleinste Schrift | 5,3 px → 6,3 px | 5,3 px → 6,3 px |
| Seiten mit mindestens einer Stelle < 11 px | 542 → 520 | 542 → 520 |
| Waagerechte Bildlaufleiste | 43 → 76 | 35 → 77 |
| Inhalt waagerecht abgeschnitten | 1 → 13 | 1 → 1 |
| Text mit … gekürzt | 3752 → 3769 | 2886 → 3168 |
| 1920×1080 | unverändert (Rahmen ohne `data-fs`; Screenshots aller 114 Seiten von liga1-2025 vorher/nachher verglichen – Unterschiede nur durch nachladende Gesichter/Wappen) | |

**Weg:** Unter Maßstab 0,7 setzt `ui/DisplayFrame.tsx` `data-fs="lift"`; `styles/34-compact-fonts.css` wird von `scripts/compact-fonts.mjs` im Build aus allen Stylesheets erzeugt (jede `font-size` gespiegelt mit `[data-fs]` davor, gleiche Kaskade): Text ab 12 CSS-px → 17,6 px (= 11 px bei 0,625), kleinere Etiketten +4 px. Spalten mit wenig Informationswert entfallen bei angehobener Schrift (`33-compact.css`): Transfermarkt/Beobachtung ohne Ländercode, Empfehlungstext und Kenntnis-Balken (Tooltips bleiben), Mitarbeiter-Markt ohne „Aussicht“, Eignungsbalken und zweite Fähigkeit, Filter in zwei Zeilen. Kopfleiste mit schmaleren Abständen.

**Noch unter 11 px (bewusst):** Positions-Etiketten in Tabellen (11,5 → 15,5 CSS-px = 9,7 px), i-Symbole (Glyphe im Kreis), Formkürzel S/U/N, Kennzahl-Beschriftungen, Fähigkeiten-Raster im Spielerprofil (feste Zeilenhöhe, ausgenommen über `NO_LIFT`), Schrift in SVG (Achsen, Netzdiagramm) und Inline-Größen.

**Nach der Messung behoben (nur Stichprobe nachgemessen):** „Menü passt nicht“ trat mit angehobener Schrift bei 1280×800 mit langen Vereinsnamen auf (404 Ansichten in neu/england/ddr) – Kopfleiste schmaler, Nachprüfung neu 1280×800: 0. Spielerprofil 1366×768 (england-1992) ließ den Rahmen um 6 px wachsen – Fähigkeiten-Raster ausgenommen, Nachprüfung 0. Tabellen-Zellabstand 5 px jetzt auch bei 1366×768 (vorher nur „narrow“).

**Offen aus diesem Durchgang:** Waagerechter Bildlauf ist mit größerer Schrift häufiger (Aufstellung › Kaderliste 15 px, Kader › Übersicht/Kabine, Budget, Beobachtung bei 1366, Vereins-/Länderprofil-Kader, Infokarte) – Inhalte erreichbar, nächster Schritt je Tabelle eine Spalte weniger. Verein › Erfolge: Kategorienleiste der Vitrine 10–16 px zu breit. Verhandlungstisch: Chip „Weitere Verstärkungen“ abgeschnitten.

**Gegner-Seite:** Box heißt jetzt „Begegnung“ (nicht mehr doppelt „Nächstes Spiel“).

**Zeitgeist/Briefing im DDR-Spielstand:** nicht umgebaut. Die Gesellschafts-Punkte (`data/briefings/seasons1975.ts`, 43 × Thema `politik` bis 1990) sind durchgehend aus westdeutscher Sicht geschrieben; eine neutrale Variante per Filter ließe das Briefing 1975–1990 fast leer, eine echte DDR-Sicht braucht eigene redaktionelle Texte je Saison (optional `societyDdr` in `SeasonBriefingEntry`, Auswahl in `composeBriefing`/`RightWidgets` über `game.ddrHome`). Vorschlag, Entscheidung bei Pascal; echte Politiker-Namen unverändert.

## Sichtprüfung (S-Punkte, Stichproben aus den Screenshots)

Durchgesehen: alle Seiten im Stand „Deutschland 2025 · 1. Liga“ bei 1920×1080 und 1280×800, dazu Stichproben aus dem neuen Spiel 1975, DDR 1980 und den Fenstern (Spielerprofil, Vereinsprofil, Länderprofil, Infokarte, Verhandlungstisch, Chronik).

| Bereich | Fund | Stand |
|---|---|---|
| Steam Deck 1280×800 | Ganze Oberfläche auf 0,5 verkleinert, Schrift 6–9 px | behoben: Mindestmaßstab 0,625 (`ui/DisplayFrame.tsx` `MIN_AUTO_SCALE`), Fläche 2048×1280 statt 2560×1440 ohne schwarze Ränder, Anpassungen in `styles/33-compact.css` über `data-ui` |
| Kopfleiste | Bei kleiner Fläche und bei langen Vereinsnamen („Mönchengladbach“) waren „Privat“ bzw. „Zentrale“ abgeschnitten (auch bei 1920×1080) | behoben: Abstände, Vereinsname höchstens 172 px, auf kleiner Fläche ohne „Kontostand:“ und Untertitel; neue harte Prüfung „Menü passt nicht“ |
| Untermenü Statistiken | Neun Punkte + Datum passten auf dem Steam Deck nicht | behoben (schmalere Plätze in `33-compact.css`) |
| Transfermarkt/Beobachtung | „Verhandeln“-Spalte nur per waagerechtem Bildlauf erreichbar (1280) | Transfermarkt behoben (engere Zellen), Beobachtung/Mitarbeiter-Markt scrollen intern noch leicht |
| Newscenter (1280) | Filterleiste abgeschnitten, Betreff kaum lesbar | behoben: Zahlen ausgeblendet, Kategorie in zweite Zeile, Spalte „Kategorie“ entfällt auf dem Steam Deck |
| Fanartikel | Jeder Bild-Slot lud ein nicht vorhandenes Bild (404 + Konsolenfehler) | behoben: nur freigeschaltete Bilder laden (`MERCH_PHOTOS`) |
| Jugend/Kader-Übersicht | Potenzial als „4.25–4.25“ (Punkt, gleiche Spanne) | behoben: Sterne wie überall (`ScoutStars`) |
| Privat › Karriere (Startjahr 2025) | „Im Amt seit 01.07.1975 · 50,5 Jahre“, 26 Saisons, fremde Meistertitel 2008/09 als eigene Bilanz | behoben: erste Station und Managerbilanz ab Startjahr (`game/careerState.ts`, alte Stände werden beim Laden zurechtgerückt) |
| Statistiken › International (Start 2025) | Fünfjahreswertung als Liste aus lauter „0.0“ (Punkt statt Komma) | behoben: Hinweis statt Nullliste, Komma |
| Trainingslager / Akademie | Abschnittsköpfe „Demnächst neu“/„Meilensteine“ ohne Inhalt | behoben: Kopf nur mit Inhalt |
| Aufstellung › Spielplan | Knopf „Bericht“ abgeschnitten („Beri…“) | behoben (Spalte breiter) |
| Verein › Erfolge | Saison „2008/…“ abgeschnitten | behoben |
| Finanzen › Bilanz | Lange Buchungstexte schoben das Datum zusammen („01.12.2025Betrieb …“) | behoben (`.dlist-row .meta/.val` schrumpfen nicht) |
| Balken-Beschriftungen | „Gehaltsbudget genu…“ | behoben: Beschriftung bricht um |
| Gekürzte Texte allgemein | ~1700 Stellen mit „…“ ohne vollen Text | behoben: `ui/ellipsisTitle.ts` setzt beim Zeigen den vollen Text als Tooltip |
| Mitarbeiter | Gehälter-Kachel „484.71…“ | behoben (kleinere Kachelschrift auf kleiner Fläche, Tooltip) |
| Test match-ui | Suchte `.dchip` „Bericht“, der Spielplan hat `.fxp-rep` | Test angepasst, grün |

## Offen (nicht behoben, Vorschlag)

- **Schrift auf dem Steam Deck:** erledigt bis auf Etiketten/Symbole, siehe „Durchgang Lesbarkeit“ (71 % → 13 % der Textstellen unter 11 px).
- **Zeitgeist/Briefing:** nennt echte Politiker (Helmut Schmidt, Friedrich Merz …). Das ist redaktionell gewollt, steht aber im Spannungsfeld zur Regel „keine realen Personen“ – bitte entscheiden. Im DDR-Stand erscheint dieselbe westdeutsche Politik (Vorschlag im Abschnitt „Durchgang Lesbarkeit“).
- **Alte Spielstände:** Buchungen/Nachrichten aus der Zeit vor dem Text-Audit behalten „Gebaeude-Fixkosten“/„Mitgliedsbeitraege“ (neue Buchungen sind richtig).
- **Mitarbeiter (Startjahr 2025, 1. Liga):** nur 2 von 37 Stellen besetzt, Spielstärke −3,4 % – vermutlich Startausstattung späterer Startjahre (Spiellogik, nicht angefasst).
- **Kalender:** Ringbuch-Box ragt gewollt 10 px über den Rand (negativer Rand, Bild hat transparente Kante) – im Bericht als „Box läuft über“ sichtbar, optisch in Ordnung.
- **Waagerechter Bildlauf** bleibt bei breiten Bäumen (Pokal, Gruppen) und dem Mitarbeiter-Markt auf kleiner Fläche; Inhalte sind erreichbar.
- **Textfarben ohne Token** (Vereinsprofil-Kopf, Taktiktafel): halbtransparentes Weiß auf dunklen Bühnen – berechnete Mischfarben, keine festen Farben im CSS; die festen Farben im CSS stehen in der Tabelle oben.

## Funde (zusammengefasst)

| Art | Anzahl | Auflösung | Stände | Seiten (Beispiele) | Beschreibung (Beispiel) |
|---|---:|---|---|---|---|
| Box läuft über / wächst | 9 | 1920x1080, 1280x800, 1366x768 | liga1-2025, england-1992, ddr-1980 | ZENTRALE › KALENDER | Box „Dezember 2025“ Inhalt 1095 > 1085 |
| Box läuft über / wächst | 6 | 1920x1080, 1280x800, 1366x768 | neu, sim20 | ZENTRALE › KALENDER | Box „Juli 1975“ Inhalt 1095 > 1085 |
| Inhalt waagerecht abgeschnitten | 2 | 1280x800, 1366x768 | liga1-2025 | FINANZEN › SPONSORING | div.sp3-scard.big > span.sp3-scard-cl > span.sp-clauses.compact: „Pflicht-Trainingslager: Vereinigte Arabi“ (348 > 304) |
| Waagerechte Bildlaufleiste | 27 | 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | TRANSFERS › BEOBACHTUNG; TRANSFERS › BEOBACHTUNG › VERTRAG LÄUFT AUS; TRANSFERS › BEOBACHTUNG › JUNGE TALENTE (BIS 21) | div.dbox-body.flush > div.mk.compact > div.mk-scroll 1273 > 1233 |
| Waagerechte Bildlaufleiste | 23 | 1920x1080, 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | VEREIN › MITARBEITER; TRAINING › TRAINERTEAM | section.card.dbox > div.dbox-body.flush > div.sf-table-wrap 1565 > 1553 |
| Waagerechte Bildlaufleiste | 22 | 1920x1080, 1280x800, 1366x768 | liga1-2025, england-1992, ddr-1980, neu, sim20 | JUGEND › JUGENDWETTBEWERBE › EUROPA; STATISTIKEN › POKAL; STATISTIKEN › INTERNATIONAL (+1) | div.dbox-body > div.cmp-cup > div.cmp-scroll 1295 > 1108 |
| Waagerechte Bildlaufleiste | 15 | 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | FINANZEN › BUDGET; KADER › KABINE; JUGEND › 2. MANNSCHAFT | div.dpage.dpage-r2 > section.card.dbox > div.dbox-body 571 > 565 |
| Waagerechte Bildlaufleiste | 6 | 1920x1080, 1280x800, 1366x768 | liga1-2025 | JUGEND › JUGENDWETTBEWERBE; JUGEND › JUGENDWETTBEWERBE › B-JUNIOREN | section.card.dbox > div.dbox-body > div.cmp-scroll.yc-groups 1116 > 1108 |
| Waagerechte Bildlaufleiste | 6 | 1920x1080, 1280x800, 1366x768 | liga1-2025 | STATISTIKEN › INTERNATIONAL; Vereinsprofil Ausland | div.dbox-body > div.cmp-cup > div.cmp-scroll.cmp-groups 1116 > 1108 |
| Waagerechte Bildlaufleiste | 5 | 1280x800, 1366x768 | sim20, liga1-2025, england-1992, ddr-1980 | STATISTIKEN › AUSZEICHNUNGEN; KADER › KABINE | div.dpage.dpage-r2 > section.card.dbox > div.dbox-body.flush 1459 > 1233 |
| Waagerechte Bildlaufleiste | 4 | 1280x800, 1366x768 | neu, sim20, liga1-2025 | Vereinsprofil › Kader | div.mx-body.mx-grid > section.card.dbox > div.dbox-body.flush 947 > 915 |
| Waagerechte Bildlaufleiste | 2 | 1280x800, 1366x768 | liga1-2025 | Länderprofil › Länderspiele | div.mx-body.mx-grid > section.card.dbox > div.dbox-body 497 > 421 |
| Waagerechte Bildlaufleiste | 1 | 1280x800 | liga1-2025 | STATISTIKEN › LIGENSYSTEM | div.lp > div.lp-main > div.lp-stage 816 > 791 |
| Text mit … gekürzt | 1320 | 1920x1080, 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | KADER › ÜBERSICHT › TORWART; KADER › ÜBERSICHT › ABWEHR; KADER › ÜBERSICHT › MITTELFELD (+8) | tbody > tr.clickable.sq-xi > td.ctr: „TW“ |
| Text mit … gekürzt | 758 | 1280x800 | neu, sim20, liga1-2025, england-1992, ddr-1980 | TRANSFERS › TRANSFERMARKT; TRANSFERS › TRANSFERMARKT › ABWEHR; TRANSFERS › TRANSFERMARKT › MITTELFELD (+9) | td.nowrap > span.mk-rec.t5 > span.mk-rec-t: „Sofort Leistungsträger“ |
| Text mit … gekürzt | 730 | 1920x1080, 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | KADER › ÜBERSICHT › TORWART; KADER › ÜBERSICHT › ABWEHR; KADER › ÜBERSICHT › MITTELFELD (+8) | tbody > tr.clickable.sq-bench > td.ctr: „TW“ |
| Text mit … gekürzt | 730 | 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | TRANSFERS › BEOBACHTUNG; TRANSFERS › BEOBACHTUNG › VERTRAG LÄUFT AUS; TRANSFERS › BEOBACHTUNG › JUNGE TALENTE (BIS 21) | tbody > tr.clickable > td.num.nowrap: „Verhandeln“ |
| Text mit … gekürzt | 634 | 1920x1080, 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | TRANSFERS › TRANSFERMARKT; TRANSFERS › TRANSFERMARKT › TORWART; TRANSFERS › TRANSFERMARKT › ABWEHR (+8) | tbody > tr.clickable > td.mk-c-info: „Will weg+“ |
| Text mit … gekürzt | 602 | 1920x1080, 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | ZENTRALE › ZENTRALE; Chronik | tbody > tr.dz-msg.unread > td.dz-nsubj: „Sponsoren warten auf deine Antwort (11 A“ |
| Text mit … gekürzt | 476 | 1920x1080, 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | KADER › ÜBERSICHT › ANGRIFF; Spielerprofil; Spielerprofil › Details (+8) | tbody > tr.clickable > td.ctr: „LARA“ |
| Text mit … gekürzt | 472 | 1920x1080, 1280x800, 1366x768 | ddr-1980, sim20, liga1-2025, england-1992 | JUGEND › JUGENDWETTBEWERBE › C-JUGEND; JUGEND › JUGENDWETTBEWERBE › D-JUGEND; JUGEND › JUGENDWETTBEWERBE › E-JUGEND (+13) | span.cmp-pclub > span.club-link.cmp-team > span.cmp-team-name: „Frankfurt (Oder) Markendorf“ |
| Text mit … gekürzt | 442 | 1920x1080, 1280x800, 1366x768 | sim20, liga1-2025, ddr-1980 | JUGEND › JUGENDWETTBEWERBE › D-JUGEND; JUGEND › JUGENDWETTBEWERBE › E-JUGEND; JUGEND › JUGENDWETTBEWERBE › F-JUGEND (+4) | span.cmp-pclub > span.cmp-team > span.cmp-team-name: „SG Grün-Weiß Mönchengladbach-Ost“ |
| Text mit … gekürzt | 407 | 1920x1080, 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | TRANSFERS › TRANSFERMARKT › TORWART; TRANSFERS › TRANSFERMARKT › ABWEHR; TRANSFERS › TRANSFERMARKT › MITTELFELD (+9) | span.club-link > span.mk-club > span: „SC Vestenbergsgreuth“ |
| Text mit … gekürzt | 274 | 1280x800, 1366x768 | england-1992 | ZENTRALE › ZENTRALE; ZENTRALE › PRESSE; ZENTRALE › PRESSE › MO 07.12. (+134) | div.hd-right > div.hd-club > span.hd-club-name: „Sheffield Blau-Weiß“ |
| Text mit … gekürzt | 240 | 1920x1080, 1280x800, 1366x768 | neu, sim20, ddr-1980, liga1-2025 | TRANSFERS › TRANSFERMARKT › TORWART; TRANSFERS › TRANSFERMARKT › ABWEHR; TRANSFERS › TRANSFERMARKT › MITTELFELD (+9) | tbody > tr.clickable > td.nowrap: „VESSC Vestenbergsgreuth“ |
| Text mit … gekürzt | 231 | 1920x1080, 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | KADER › ÜBERSICHT › TORWART; KADER › ÜBERSICHT › ABWEHR; KADER › ÜBERSICHT › MITTELFELD (+8) | thead > tr > th.sortable.ctr: „Frischei“ |
| Text mit … gekürzt | 220 | 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | AUFSTELLUNG › AUFSTELLUNG; Spieler-Infokarte | tbody.lu-sec.lu-sec-xi > tr.lu-row > td.lu-c-name: „Ralf KronbergK“ |
| Text mit … gekürzt | 180 | 1920x1080, 1280x800, 1366x768 | liga1-2025, england-1992, sim20 | JUGEND › JUGENDWETTBEWERBE › EUROPA; STATISTIKEN › INTERNATIONAL; Vereinsprofil Ausland (+1) | span.cmp-team > span.club-link > span.cmp-team-name: „Sevilla Grün-Weiß“ |
| Text mit … gekürzt | 179 | 1920x1080, 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | STATISTIKEN › LIGA; STATISTIKEN › POKAL; STATISTIKEN › INTERNATIONAL › WELT (+18) | section.card.dbox > div.dxh > span.dxh-title: „1. Ligai“ |
| Text mit … gekürzt | 176 | 1280x800, 1366x768 | sim20, liga1-2025, england-1992, ddr-1980 | JUGEND › JUGENDWETTBEWERBE; JUGEND › JUGENDWETTBEWERBE › C-JUGEND; JUGEND › JUGENDWETTBEWERBE › D-JUGEND (+19) | div.cmp-stat.clickable > span.cmp-pname > span.cmp-pn: „Sebastian Wojciechowicz“ |
| Text mit … gekürzt | 165 | 1920x1080, 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | KADER › ÜBERSICHT › TORWART; KADER › ÜBERSICHT › ABWEHR; KADER › ÜBERSICHT › MITTELFELD (+8) | thead > tr > th.sortable: „Potenziali“ |
| Text mit … gekürzt | 153 | 1920x1080, 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | ZENTRALE › PRESSE; ZENTRALE › PRESSE › MO 08.12.; ZENTRALE › PRESSE › DO 04.12. (+6) | div.np-res > span.np-res-team.h > span.club-link: „Mönchengladbach“ |
| Text mit … gekürzt | 141 | 1920x1080, 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | ZENTRALE › PRESSE; ZENTRALE › PRESSE › MO 08.12.; ZENTRALE › PRESSE › DO 04.12. (+6) | div.np-res > span.np-res-team > span.club-link: „Braunschweig“ |
| Text mit … gekürzt | 141 | 1920x1080, 1280x800, 1366x768 | liga1-2025, england-1992, ddr-1980 | ZENTRALE › PRESSE › MO 01.12.; ZENTRALE › PRESSE › MO 24.11.; ZENTRALE › PRESSE › MO 17.11. (+5) | div.np-res.clickable > span.np-res-team.h > span.club-link: „München Rot“ |
| Text mit … gekürzt | 132 | 1920x1080, 1280x800, 1366x768 | liga1-2025, england-1992, ddr-1980 | ZENTRALE › PRESSE › MO 01.12.; ZENTRALE › PRESSE › MO 24.11.; ZENTRALE › PRESSE › MO 17.11. (+5) | div.np-res.clickable > span.np-res-team > span.club-link: „Frankfurt Rot“ |
| Text mit … gekürzt | 124 | 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | AUFSTELLUNG › AUFSTELLUNG; Spieler-Infokarte | tbody.lu-sec.lu-sec-bench > tr.lu-row > td.lu-c-name: „Peter Benesch“ |
| Text mit … gekürzt | 84 | 1920x1080, 1280x800, 1366x768 | liga1-2025, england-1992, ddr-1980 | ZENTRALE › PRESSE › MO 01.12.; ZENTRALE › PRESSE › MO 17.11.; ZENTRALE › PRESSE (+5) | div.np-res.clickable > span.np-res-team.h > span.club-link.np-crest: „BKÖ“ |
| Text mit … gekürzt | 82 | 1920x1080, 1280x800, 1366x768 | sim20, liga1-2025, england-1992, ddr-1980 | FINANZEN › BILANZ; TRANSFERS › TRANSFERS | div.dbox-body > div.dlist-row > span.grow: „Betrieb & Vermarktung: Wareneinsatz, Spo“ |
| Text mit … gekürzt | 80 | 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | AUFSTELLUNG › AUFSTELLUNG; Spieler-Infokarte | tbody.lu-sec.lu-sec-reserve > tr.lu-row > td.lu-c-name: „Jochen Zell“ |
| Text mit … gekürzt | 79 | 1920x1080, 1366x768 | liga1-2025 | JUGEND › JUGENDWETTBEWERBE; JUGEND › JUGENDWETTBEWERBE › B-JUNIOREN; STATISTIKEN › INTERNATIONAL (+1) | span.club-link > span.gt-club > span: „Hamburg Braun“ |
| Text mit … gekürzt | 77 | 1920x1080, 1280x800, 1366x768 | neu, liga1-2025, england-1992, ddr-1980 | Spielerprofil; Spielerprofil › Details; Spielerprofil › Statistiken (+4) | div.pp2-sgroup > div.pp2-srow.pp-tier-core > span.pp-attr-lbl: „Strafraumbeherrschungi“ |
| Text mit … gekürzt | 75 | 1920x1080, 1280x800, 1366x768 | sim20, liga1-2025, england-1992, ddr-1980, neu | VEREIN › MITARBEITER; TRAINING › TRAINERTEAM | div.sf-slot.vacant > span.sf-slot-main > span.sf-slot-sub: „Erschließt Sponsoren & Fanmärkte – mehr “ |
| Text mit … gekürzt | 75 | 1920x1080, 1280x800, 1366x768 | liga1-2025, england-1992, ddr-1980 | STATISTIKEN › POKAL | div.rb-team > span.club-link.cmp-team > span.cmp-team-name: „VfR Vestenbergsgreuth“ |
| Schrift < 11 px (effektiv) | 1344 | 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | ZENTRALE › ZENTRALE; ZENTRALE › PRESSE; ZENTRALE › KALENDER (+149) | 166/200 Textstellen < 11 px (Maßstab 0.63, kleinste 5.9 px): span 5.9, span.pos-badge.pg-gk 6.6, span.pos-badge.pg-def 6.6, span.dz-comp 7.5 |
| Textfarbe ohne Token (berechnet) | 192 | 1920x1080, 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | Vereinsprofil; Vereinsprofil › Kader; Vereinsprofil › Jugend (+10) | div.dkpi-lbl rgba(255, 255, 255, 0.66) (3×) |
| Textfarbe ohne Token (berechnet) | 93 | 1920x1080, 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | Vereinsprofil; Vereinsprofil › Kader; Vereinsprofil › Jugend (+5) | div.dkpi-val rgb(227, 231, 238) (1×) |
| Textfarbe ohne Token (berechnet) | 75 | 1920x1080, 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | Länderprofil; Länderprofil › Länderspiele; Länderprofil › Nationalkader (+2) | span rgba(255, 255, 255, 0.82) (1×) |
| Textfarbe ohne Token (berechnet) | 30 | 1920x1080, 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | TRAINING › TRAINERTEAM; VEREIN › MITARBEITER | button rgba(235, 242, 238, 0.82) (1×) |
| Textfarbe ohne Token (berechnet) | 15 | 1920x1080, 1280x800, 1366x768 | neu, sim20, liga1-2025, england-1992, ddr-1980 | AUFSTELLUNG › TAKTIK | span.txb-name rgb(235, 242, 238) (22×) |
| Textfarbe ohne Token (berechnet) | 3 | 1920x1080, 1280x800, 1366x768 | neu | FINANZEN › SPONSORING › BANDENWERBUNG | span.sp3-board-free rgb(42, 47, 55) (6×) |

## Feste Farben im CSS (außerhalb 00-base/25-theme/30-theme)

87 Farbwerte ohne Token in 20 Dateien (Zeichnungen/Szenen nutzen bewusst eigene Farben).

| Datei | Farbwerte |
|---|---:|
| 28-sponsor.css | 26 |
| 31-akte.css | 19 |
| 02-startmenu.css | 6 |
| 28-opponent.css | 6 |
| 28-calendar.css | 4 |
| 18-header.css | 3 |
| 19-dashboard.css | 3 |
| 22-pages.css | 3 |
| 13-staff-marketing-calendar.css | 2 |
| 23-match-screen.css | 2 |
| 28-draw.css | 2 |
| 28-fixtures.css | 2 |
| 28-stadium.css | 2 |
| 01-misc-widgets.css | 1 |
| 07-rating-ceremony.css | 1 |
| 08-lineup-match.css | 1 |
| 24-newgame.css | 1 |
| 28-lazy.css | 1 |
| 28-training.css | 1 |
| 28-trophies.css | 1 |


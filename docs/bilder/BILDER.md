# Bilderliste – generierte Bilder für den AAA-Look

Lebende Liste (Wunsch Pascal): Jeder neue oder umgebaute Bereich trägt hier seine Bildwünsche ein.
Bilder kommen nach `public/assets/<bereich>/`. Jede Stelle hat eine gezeichnete Ersatzdarstellung,
das Spiel läuft also auch ohne Bild. Ein Bild wird erst angezeigt, wenn es im jeweiligen Register
(z. B. `src/data/trophyImages.ts`) eingetragen ist.

## Gemeinsamer Bildstil (für alle Motive)
- **Stil:** fotorealistisch, Abendlicht, leicht entsättigt, kühle Schiefer-/Nachtblautöne; Bernstein (#F2A541) nur als Lichtakzent (Flutlicht, Abendsonne). Kein Sepia- oder Braunschleier.
- **Keine** echten Vereinswappen, Logos, Markennamen, Schriftzüge oder erkennbaren echten Personen. Keine Wasserzeichen.
- **Epochen:** Wo „je Epoche“ steht, gibt es vier Fassungen: 1975–84 (Betonränge, Flutlichtmasten, Holzbanden), 1985–99 (Sitzschalen, erste Dächer, Werbebanden), 2000–14 (moderne Arenen, LED-Banden), ab 2015 (Hightech-Arenen, LED-Dach).
- **Format:** WebP (Fotos) bzw. PNG mit Alpha (freigestellte Objekte). Größenangaben in Pixeln.

Priorität: **A** = sichtbar auf vielen Seiten bzw. großer Wow-Effekt, **B** = wichtiger Einzelbereich, **C** = Feinschliff.

---

## 1. Hintergründe & Rahmen (A)
| Datei | Motiv | Größe | Einsatz |
|---|---|---|---|
| `bg/stadion-abend-{1975,1985,2000,2015}.webp` | Leeres Stadion von der Tribüne in der Dämmerung, Flutlicht an, Spielfeld unscharf | 2560×1440 | Hintergrund aller Seiten (`.app-shell::before`), je Epoche |
| `bg/kabine-{1975,2000}.webp` | Umkleidekabine: Holzbank/Haken (1975) bzw. moderne Spinde (2000) | 2560×1440 | Kader › Kabine, Spielergespräch |
| `bg/buero-{1975,1995,2015}.webp` | Managerbüro, Schreibtisch mit Telefon/Akten (1975), Faxgerät/PC (1995), Bildschirme (2015) | 2560×1440 | Zentrale, Saisonbudget, Vorstand |
| `bg/trainingsplatz-{1975,2015}.webp` | Trainingsplatz mit Hütchen, Toren, Nebel am Morgen | 2560×1440 | Training, Erstes Training |
| `bg/pressesaal.webp` | Pressekonferenz-Raum, Mikrofone, leere Stuhlreihen | 2560×1440 | Presse, Pressekonferenzen |
| `bg/gala-buehne.webp` | Festliche Bühne mit Scheinwerfern und Lichtpunkt-Raster, dunkelblau | 2560×1440 | Auslosung, Goldener Ball, Saisonehrung |

## 2. Spielergesichter (A – größter Einzelhebel)
| Datei | Motiv | Größe | Einsatz |
|---|---|---|---|
| `faces/<herkunft>/<epoche>/<nr>.webp` | Porträt Brust aufwärts, neutraler Hintergrund, Trikot neutral grau (Vereinsfarbe wird eingefärbt), Frisuren/Bärte je Jahrzehnt, Herkunft passend (de, ost, tr, yu, it, nl, skandinav., afrik., südamerik. …) | 512×600, Alpha | Spielerprofil, Listen, Presse, Textmodus, Bewertungsrunde |
| Umfang | je Herkunft × Epoche ca. 40 Gesichter, Alterungsstufen 18/25/32/38 | – | Zuordnung deterministisch aus Spieler-ID |
| `faces/staff/<epoche>/<nr>.webp` | Trainer, Co-Trainer, Funktionäre, Finanzberater (Anzug, Trainingsjacke) | 512×600 | Trainerteam, Vorstand, Budget-Berater |

## 3. Stadien & Vereinsumfeld (A)
| Datei | Motiv | Größe | Einsatz |
|---|---|---|---|
| `stadium/luftbild-{1975,1990,2005,2020}.webp` | Stadion-Luftbild schräg von oben, Umfeld mit Parkplatz, Bäumen | 1920×1080 | Stadionseite, Kartenverkauf, Namensrechte |
| `stadium/tribuene-<art>.webp` | Stehplatz-Kurve, Sitzplatz-Gerade, Haupttribüne mit Logen, Gästeblock | 1200×800 | Kartenverkauf, Tribünen-Popover |
| `grounds/<gebäude>.webp` | Fanshop, Imbissbude, Parkhaus, Trainingszentrum, Jugendinternat, Geschäftsstelle | 800×600, Alpha | Vereinsgelände-Bauliste |

## 4. Wettbewerbe, Auslosung, Ehrungen (B)
| Datei | Motiv | Größe | Einsatz |
|---|---|---|---|
| `trophies/{schale,ddr,teller,pokal,henkel,cwc,konferenz,uefa,halle,jugend,uyl,aufstieg}.webp` | Trophäe frontal, mittig, Licht von links oben, dunkler Schiefersockel, ohne Schrift | 1000×1100, Alpha | Verein › Erfolge, Saisonehrung, Gala |
| `trophies/goldener-ball.webp` | Goldene Kugel-Trophäe auf schwarzem Sockel | 1000×1100, Alpha | Gala Goldener Ball |
| `draw/lostopf.webp` | Glaskugeln/Lostopf auf Bühne | 1200×900, Alpha | Auslosung |
| `awards/podest.webp` | Podest mit Spotlights | 1600×900 | Saisonehrung |

## 5. Spieltag & Textmodus (B)
| Datei | Motiv | Größe | Einsatz |
|---|---|---|---|
| `match/stadion-innen-<epoche>-{tag,nacht,regen,schnee}.webp` | Blick vom Spielfeldrand auf volle Tribüne | 1920×600 | Kopf des Textmodus und von „Nächstes Spiel“ |
| `cities/<stadt>.webp` | Stadtansicht (Skyline/Fluss/Altstadt) der Vereinsstädte, Abendlicht | 1200×800 | „Nächstes Spiel“ › Über die Stadt (ca. 40 dt. + 60 Auslandsstädte) |
| `weather/{sonne,wolken,regen,schnee,nebel,wind}.webp` | Wetterstimmung über einem Stadiondach | 600×400 | Wettervorhersage |

## 6. Training & Trainingslager (B)
| Datei | Motiv | Größe | Einsatz |
|---|---|---|---|
| `training/einheit-<baustein>.webp` | Illustrationsfotos je Trainingsbaustein (Sprint, Torschuss, Kopfball, Taktiktafel, Kraftraum, Regeneration …) | 400×400 | Kacheln im Wochenplan |
| `camp/<ziel-id>.webp` | Ortsfoto je Trainingslager-Ziel (Berge, Küste, Wüste, Wald, Stadt), ohne Personen | 1600×1000 | Trainingslager-Planer (großes Ortsfoto, „aufgeklebt“) |
| `camp/karte-papier.webp` | Papierstruktur/Polaroid-Rahmen mit Klebestreifen | 800×800, Alpha | Aufgeklebte Karten im Planer |

## 7. Finanzen, Sponsoring, Fanartikel (B)
| Datei | Motiv | Größe | Einsatz |
|---|---|---|---|
| `sponsor/trikot-<epoche>.webp` | Leeres Trikot auf Bügel/Torso, Schnitt je Epoche (Kragen 70er, weit 90er, eng 2010er) | 900×1100, Alpha | Hauptsponsor (Logo wird aufgelegt) |
| `sponsor/bande-<epoche>.webp` | Bandenausschnitt (Holz 1975, Kunststoff 1990, LED 2010) | 1600×300 | Bandenwerbung |
| `merch/<artikel>.webp` | Schal, Mütze, Wimpel, Trikot, Aufnäher, Becher, Ball, VHS/DVD, Spielkonsole-Spiel | 600×600, Alpha | Fanartikel-Sortiment |
| `finance/berater.webp` | Finanzberater am Schreibtisch mit Akten | 800×1000 | Saisonbudget |

## 8. Menü, Neues Spiel, Saisonwechsel (C)
| Datei | Motiv | Größe | Einsatz |
|---|---|---|---|
| `newgame/schritt-<n>.webp` | Stimmungsbild je Assistenten-Schritt (Vertrag unterschreiben, Landkarte, Stadioneingang, Willkommensschild) | 1920×1080 | Neues-Spiel-Assistent |
| `intro/saison-<jahr>.webp` | Zeitgeist-Collage je Jahrzehnt (Fernseher, Zeitung, Fankultur) | 1920×1080 | Saison-Auftakt-Animation |
| `press/zeitung-<epoche>.webp` | Papierstruktur Zeitung je Epoche | 1600×1200 | Presse-Zeitung |

---

## Offene Bildwünsche aus laufenden Umbauten
Werden beim Zusammenführen der Stränge ergänzt.

| Bereich | Datei | Motiv | Größe | Einsatz |
|---|---|---|---|---|
| Auslosung | `draw/gala-buehne.webp` | Gala-Bühne mit Scheinwerfern und Lichtwänden, entsättigt, kühl | 1920×1080 | hinter der Auslosungs-Show (Ersatz: gezeichnete Bühne) |
| Fanartikel | `merch/{schal,wimpel,magazin,poster,ball,musik,trikot,bekleidung,accessoires,video}.webp` | Freisteller auf dunklem Schiefer, 70er/80er-Look, ohne Logos | 384×384 | Sortiment (Ersatz: Icon) |
| Fanartikel | `merch/lager.webp` | Lagerraum hinter dem Fanshop, Regale, Kartons, kühl | 480×480 | Box „Lager“ |
| Kartenverkauf | `tickets/rasen.jpg` | Rasen von oben mit Mähstreifen, kühl, entsättigt | 1200×750 | Draufsicht der Tribünen (Platzhalter vorhanden) |
| Erfolge | `trophies/<form>.webp` | 12 Formen, siehe Abschnitt 4 | 1000×1100 | Vitrine (freischalten in `src/data/trophyImages.ts`) |
| Saisonbudget | `budget/berater-<jahrzehnt>.webp` | Porträt des Finanzberaters/Schatzmeisters je Jahrzehnt (Anzug, Akten) | 160×184 (Quelle 640×736) | Budget-Fenster und Finanzen › Budget (Ersatz: gezeichnetes Gesicht) |
| Trainingslager | `camp/<ziel>.webp` | Ortsbild je Ziel (35 Ziele), Landschaft ohne Personen, kühl – Motive je Ziel in `docs/bilder/camp.md` | 1280×800 | Planer › Trainingsprogramm, großes Ortsbild (Ersatz: gezeichnete Landschaft je Typ; freischalten in `src/data/campImages.ts`) |

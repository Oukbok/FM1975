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
Technik steht (Register `src/data/faceImages.ts`, Zuordnung `src/components/faces/faceLookup.ts`, Anzeige `src/components/PlayerAvatar.tsx`).
Jedes Bild, das du ablegst, erscheint sofort an **allen** Stellen mit Gesicht: Spielerprofil, Presse,
Newscenter, Textmodus (Wechsel-Bildschirm), Bewertungsrunde, Erstes Training, Spielergespräch,
Ehrungen/Gala, Transferverhandlung, Fanartikel – Trainer/Berater/Manager über `faces/staff/`.
Fehlt ein Bild, zeichnet das Spiel das Gesicht wie bisher (Hautton passend zur Herkunft).

### Ordner und Dateinamen
`public/assets/faces/<gruppe>/<epoche>/<nr>-<alter>.webp`

| Teil | Werte | Bedeutung |
|---|---|---|
| `gruppe` | `mitteleuropa`, `nordeuropa`, `suedeuropa`, `osteuropa`, `balkan`, `tuerkei`, `westafrika`, `lateinamerika`, `ostasien`, `nordafrika`, `staff` | Aussehen nach Herkunft (Tabelle unten); `staff` = Trainer, Berater, Funktionäre, Manager |
| `epoche` | `1970`, `1980`, `1990`, `2000`, `2010`, `2020` | Spieler: Jahrzehnt, in dem er etwa 25 ist (Frisur/Bart seiner aktiven Zeit – bleibt ein Spielerleben lang gleich). Mitarbeiter: laufendes Spieljahrzehnt (Kleidung der Zeit). Fehlt eine Epoche, nimmt das Spiel die nächstgelegene vorhandene derselben Gruppe. |
| `nr` | `01`, `02`, … | eine Person. Gleiche Nummer = gleiche Person in verschiedenen Altersstufen. |
| `alter` | Spieler `18`, `25`, `32`, `38` · Mitarbeiter `35`, `45`, `55`, `65` (optional) | Das Spiel zeigt die Stufe, die dem aktuellen Alter am nächsten liegt – so altert ein Spieler. Ohne Altersangabe (`<nr>.webp`) passt das Bild zu jedem Alter. |
| Maske (optional) | `<nr>-<alter>-maske.webp` | Trikotfläche weiß/deckend, Rest transparent – damit färbt das Spiel das Trikot in der Vereinsfarbe. Ohne Maske bleibt das Trikot grau. |

Beispiele: `faces/mitteleuropa/1970/01-25.webp`, `faces/mitteleuropa/1970/01-32.webp` (dieselbe Person sieben Jahre älter), `faces/mitteleuropa/1970/01-25-maske.webp`, `faces/staff/1990/04-55.webp`.

### Herkunft → Gruppe (aus `src/data/origins.ts`)
| Gruppe | Herkünfte im Spiel |
|---|---|
| `mitteleuropa` | deutsch (West, Ost/DDR, „modern“), Österreich, Schweiz, Niederlande, Belgien, Frankreich, England, Schottland, USA |
| `nordeuropa` | Dänemark, Schweden, Norwegen |
| `suedeuropa` | Italien, Spanien, Portugal, Griechenland, Deutsche mit italienischen Wurzeln |
| `osteuropa` | Polen, Tschechoslowakei/Tschechien, Ungarn, Sowjetunion/Russland, Deutsche mit polnischen Wurzeln |
| `balkan` | Jugoslawien, Kroatien, Serbien, Deutsche mit jugoslawischen Wurzeln |
| `tuerkei` | Türkei, Deutsch-Türken |
| `westafrika` | Ghana, Nigeria, Kamerun, Deutsche/Franzosen mit afrikanischen Wurzeln |
| `lateinamerika` | Brasilien, Argentinien |
| `ostasien` | Japan, Korea |
| `nordafrika` | Marokko |

### Bildvorgaben
- **Format:** WebP mit Alpha-Kanal (transparenter Hintergrund), **512 × 600 px**, Qualität ~80, Ziel < 150 KB.
- **Ausschnitt:** Kopf und Schultern bis Brustmitte; Kopf mittig, Scheitel ca. 60 px unter dem oberen Rand, Kinn bei ca. 60 % der Höhe; Schultern füllen die Breite unten aus (das Bild wird unten bündig eingepasst).
- **Blick:** frontal bis leicht schräg (max. 15°), Blick in die Kamera, neutraler bis leicht freundlicher Ausdruck; gleichmäßiges, weiches Licht von vorne, kein Bernstein-Schein, keine harten Schatten.
- **Hintergrund:** transparent (das Spiel legt den dunklen Porträt-Hintergrund darunter).
- **Trikot:** schlichtes Rundhals- oder Kragentrikot ohne Logo/Schrift/Nummer in **Mittelgrau #808080** mit natürlichen Falten. Mit Maske wird daraus genau die Vereinsfarbe (Falten bleiben); ohne Maske bleibt es grau. Mitarbeiter: Anzug, Trainingsjacke oder Pullover in gedeckten Farben (keine Maske nötig).
- **Epochenlook:** 1970er lange Haare/Koteletten/Schnauzer, 1980er Vokuhila/Locken/Schnauzer, 1990er Seitenscheitel/Undercut/Spitzbart, 2000er kurz/gegelt/Irokese, 2010er Fade/Dutt/Vollbart, 2020er Fade/Locken/gepflegter Bart. Alterungsstufen: 18 jugendlich, 25 Höhepunkt, 32 erste Falten, 38 grau meliert.
- **Keine echten Personen** (keine Ähnlichkeit mit realen Spielern), keine Wasserzeichen.

### Umfang (Vorschlag in Stufen)
1. **Start (spürbar sofort):** `mitteleuropa` 1970 + 1980 je 20 Personen, nur Stufe `25` → 40 Bilder. Deckt die ersten 15 Spieljahre fast vollständig ab.
2. **Ausbau:** dieselben Personen zusätzlich in `18`, `32`, `38`; `mitteleuropa` 1990–2020; `balkan`, `nordeuropa`, `tuerkei`, `westafrika` je Epoche 10–20 Personen.
3. **Voll:** je Gruppe × Epoche ca. 40 Personen, alle Altersstufen; `staff` je Epoche 20 Personen in `45`/`55`.
Je mehr Personen eine Gruppe hat, desto seltener sehen zwei Spieler gleich aus (Zuordnung = fester Hash der Spieler-ID).

### So schaltest du Bilder frei (Schritt für Schritt)
1. Bilder nach den Vorgaben oben erzeugen und als `.webp` speichern (z. B. mit squoosh.app: „WebP“, Qualität 80, Alpha an).
2. In den passenden Ordner legen, z. B. `public/assets/faces/mitteleuropa/1970/01-25.webp` (Ordner bei Bedarf anlegen).
3. Optional die Trikotmaske daneben legen: `01-25-maske.webp` (Trikot weiß, alles andere transparent).
4. Im Projektordner ausführen: `node scripts/faces-register.mjs` – das Skript prüft alle Dateinamen, zeigt eine Übersicht Gruppe × Epoche und schreibt das Register `src/data/faceImages.ts` neu. Hinweise (falscher Name, PNG statt WebP, zu groß, Maske ohne Bild) stehen darunter. Nur prüfen: `node scripts/faces-register.mjs --check`.
5. `npm run build` (bzw. `npm run dev`) und ein Spiel laden – die Gesichter erscheinen überall. Kontrolle mit Screenshots: `node tests/faces-shots.mjs test-output/faces` (Profil, Presse, Budget-Berater, Textmodus; meldet fehlende Dateien und Größensprünge).
6. Bilder **und** `src/data/faceImages.ts` committen. Hinweis: Kommen neue Personen in eine Gruppe, verteilen sich die Spieler dieser Gruppe neu auf die Bilder (die Namen bleiben natürlich gleich).

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
| `camp/<ziel>.webp` | Ortsfoto je Trainingslager-Ziel (35 Ziele, Motive in `docs/bilder/camp.md`), ohne Personen, kühl | 1280×800 | Trainingslager-Planer (großes Ortsbild, „aufgeklebt“; freischalten in `src/data/campImages.ts`) |
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
Werden beim Zusammenführen der Stränge ergänzt (Erstes Training, Trainingslager, Sponsoring, Training, Fanartikel, Kartenverkauf).

| Bereich | Datei | Motiv | Größe | Einsatz |
|---|---|---|---|---|
| Gesichter (Start) | `faces/mitteleuropa/{1970,1980}/{01..20}-25.webp` (+ `-maske.webp`) | 40 Spielerporträts nach Abschnitt 2 – deckt die ersten 15 Spieljahre ab; danach Altersstufen 18/32/38 und weitere Gruppen | 512×600, Alpha | überall mit Gesicht (Ersatz: gezeichnetes Gesicht) |
| Gesichter Mitarbeiter | `faces/staff/{1970,1990,2010}/{01..10}-55.webp` | Trainer/Berater/Funktionäre in Anzug oder Trainingsjacke der Zeit | 512×600, Alpha | Budget-Berater, Presse (Trainer), Manager im Assistenten |
| Erstes Training | `promises/erstes-training.webp` | Trainingsauftakt: Spieler im Halbkreis um den Trainer auf dem Trainingsplatz, Hütchen, Zaun; entsättigt, kühl abgedunkelt, Querformat | 1200×340 | Kopf des Versprechen-Popups (Ersatz: gezeichneter Trainingsplatz) |
| Auslosung | `draw/gala-buehne.webp` | Gala-Bühne mit Scheinwerfern und Lichtwänden, entsättigt, kühl | 1920×1080 | hinter der Auslosungs-Show (Ersatz: gezeichnete Bühne) |
| Fanartikel | `merch/{schal,wimpel,magazin,poster,ball,musik,trikot,bekleidung,accessoires,video}.webp` | Freisteller auf dunklem Schiefer, 70er/80er-Look, ohne Logos | 384×384 | Sortiment (Ersatz: Icon) |
| Fanartikel | `merch/lager.webp` | Lagerraum hinter dem Fanshop, Regale, Kartons, kühl | 480×480 | Box „Lager“ |
| Kartenverkauf | `tickets/rasen.jpg` | Rasen von oben mit Mähstreifen, kühl, entsättigt | 1200×750 | Draufsicht der Tribünen (Platzhalter vorhanden) |
| Erfolge | `trophies/<form>.webp` | 12 Formen, siehe Abschnitt 4 | 1000×1100 | Vitrine (freischalten in `src/data/trophyImages.ts`) |
| Saisonbudget | `budget/berater-<jahrzehnt>.webp` | Porträt des Finanzberaters/Schatzmeisters je Jahrzehnt (Anzug, Akten) | 160×184 (Quelle 640×736) | Budget-Fenster und Finanzen › Budget (Ersatz: gezeichnetes Gesicht) |
| Training | `training/einheit-<baustein-id>.webp` (21 Bausteine, IDs aus `engine/weeklyTraining.ts`) | Piktogramm/Silhouette der Übung (Läufer, Hantel, Kopfball …), einfarbig hell auf transparent, ohne Text | 96×96 (Quelle 384×384), Alpha | Kacheln im Ringbuch und in den Bausteinreitern (Ersatz: Icon; Slot noch nicht verdrahtet) |
| Training | `training/spieltag-<epoche>.webp` | Matchball/Stollenschuh-Stillleben je Epoche (70er Leder, 90er, heute), kühl | 160×320 | Spieltag-Spalte im Ringbuch (Ersatz: Ball-Symbol + Wappen) |
| Neues Spiel / Ligensystem | `leagues/<liga-id>.webp` | Neutrales Liga-Emblem je Spielklasse (Schild/Wimpel, ohne echte Logos/Schrift), Stufe über Farbe/Metall | 64×64 (Quelle 256×256), Alpha | Ligensystem-Pyramide im Assistenten und Statistiken › Ligensystem (Ersatz: Flagge + Stufenzahl) |
| Trainingslager | `camp/<ziel>.webp` | Ortsbild je Ziel (35 Ziele), Landschaft ohne Personen, kühl – Motive je Ziel in `docs/bilder/camp.md` | 1280×800 | Planer › Trainingsprogramm, großes Ortsbild (Ersatz: gezeichnete Landschaft je Typ; freischalten in `src/data/campImages.ts`) |
| Hallenturnier | `indoor/halle-{70er,80er,90er,2000er}.webp` | Halleninneres je Epoche: Tribünen rundum, Rundumbande mit neutralen Werbeflächen, Hallenlicht unter dem Stahldach; 70er/80er heller Kunststoffboden, ab 90er Kunstrasen-Teppich und Videowürfel; ohne erkennbare Personen/Logos, entsättigt, kühl abgedunkelt | 1920×1080 | Hintergrund der Hallen-Show, Bühne „Nächstes Spiel“ und Siegerehrung (Ersatz: gezeichnete Halle `screens/indoor/IndoorHall.tsx`; freischalten in `src/data/indoorImages.ts`) |

### Sponsoring (Strang sponsor3, Finanzen › Sponsoring)
| Datei | Motiv | Größe | Einsatz |
|---|---|---|---|
| `sponsor/trikot-<epoche>.webp` (1975, 1990, 2010) | Leeres Heimtrikot frontal, neutral weiß/grau (wird nicht eingefärbt – nur als Lichter/Falten-Ebene über dem gezeichneten Trikot), Schnitt je Epoche | 900×945, Alpha | Reiter Hauptsponsor (`sponsor/SponsorJersey.tsx`, gezeichneter Ersatz: `JerseySVG`) |
| `sponsor/bande-holz.webp`, `bande-kunststoff.webp`, `bande-led.webp` | Leere Bande frontal ohne Schrift: Holzbretter mit Schrauben / glatte Kunststofftafel im Alurahmen / dunkles LED-Modul mit Pixelraster | 1200×200 | Reiter Bandenwerbung als Struktur über dem Logo (`sponsor/BoardsTab.tsx`, Ersatz: CSS-Struktur) |
| `sponsor/tribuene-draufsicht.webp` | Stadion von oben, Tribünen ohne Beschriftung, kühl abgedunkelt | 1240×800 | Reiter Namensrechte, Hintergrund der Draufsicht (Ersatz: SVG-Schraffur) |
| `sponsor/spielfeldrand-<epoche>.webp` | Blick über den Rasen auf Banden + Zuschauer (unscharf), 1978 / 1995 / 2015 | 1920×400 | Reiter Bandenwerbung, Kulisse hinter den Banden (Ersatz: Punkteraster) |


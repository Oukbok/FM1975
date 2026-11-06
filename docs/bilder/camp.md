# Bildwünsche Trainingslager (Planer › Trainingsprogramm)

Großes Ortsbild im Planer (Schritt 3, rechts; Vorbild EA FM „Trainingslager“). Ohne Foto zeigt der Planer eine
gezeichnete Landschaft je Typ (`src/views/kader/camp/CampScenery.tsx`); Länderkarte und Anlagen-Skizze sind immer
gezeichnet und liegen „aufgeklebt“ über dem Bild (`CampPinned.tsx`).

- Datei: `bilder/camp/<id>.webp`, freischalten in `src/data/campImages.ts` (`CAMP_PHOTOS`).
- Format: WebP, 1280 × 800 px (16:10), Querformat; wird mittig beschnitten (oben/unten ca. 5 % Rand lassen).
- Stil: Landschaft/Ort, keine Personen, keine Logos/Werbung; entsättigt, kühl, Tageslicht (kein Sepia, kein warmer Schleier).
- Rechts oben liegt die Länderkarte, unten links die Anlagen-Skizze – Hauptmotiv in die Bildmitte/oben links setzen.
- Optional je Ziel eine Winterfassung `<id>-winter.webp` (Schnee) – derzeit nicht eingebunden, die Zeichnung schneit selbst.

| Ziel-ID | Ziel | Ort | Fenster | Motiv |
|---|---|---|---|---|
| `sportschule` | Sportschule Kaiserau | Kamen (Westfalen) (Deutschland) | Sommer + Winter | Sportschule Kaiserau: flaches Bettenhaus, mehrere Rasenplätze, Flutlichtmasten, Waldrand |
| `hennef` | Sportschule Hennef | Hennef (Sieg) (Deutschland) | Sommer + Winter | Sportschule Hennef an der Sieg: Hallenkomplex und Plätze im Grünen, Siebengebirge im Hintergrund |
| `wedau` | Sportschule Wedau | Duisburg (Deutschland) | Sommer + Winter | Sportpark Wedau: Regattabahn mit Wald, Plätze und Bettenhaus am Wasser |
| `gruenberg` | Sportschule Grünberg | Grünberg (Mittelhessen) (Deutschland) | Sommer + Winter | Sportschule Grünberg: Plätze am Ortsrand, mittelhessische Hügel |
| `barsinghausen` | Sportschule Barsinghausen | Barsinghausen (Deister) (Deutschland) | Sommer + Winter | Sportschule am Deister: Plätze vor bewaldetem Höhenzug |
| `malente` | Sportschule Malente | Malente (Holsteinische Schweiz) (Deutschland) | Sommer + Winter | Malente: Holsteinische Schweiz, See mit Schilf, Sportschule im Wald |
| `norderney` | Norderney | Norderney (Nordsee) (Deutschland) | Sommer | Norderney: Dünen, Strand, Leuchtturm, Nordsee bei Ebbe |
| `sylt` | Sylt | Westerland / Rantum (Deutschland) | Sommer | Sylt: Dünenkamm, Strandkörbe ohne Logos, Rotes Kliff |
| `timmendorf` | Timmendorfer Strand | Timmendorfer Strand (Ostsee) (Deutschland) | Sommer + Winter | Timmendorfer Strand: Ostseestrand mit Seebrücke (Winterlager: gern verschneit) |
| `harz` | Harz | Braunlage / Bad Lauterberg (Deutschland) | Sommer + Winter | Harz: Fichtenwälder, Brocken in der Ferne, Kurort Braunlage |
| `schwarzwald` | Schwarzwald | Hinterzarten / Schluchsee / Feldberg (Deutschland) | Sommer + Winter | Schwarzwald: Hinterzarten/Feldberg, dunkle Tannen, Schluchsee |
| `sauerland` | Sauerland | Winterberg / Schmallenberg (Deutschland) | Sommer + Winter | Sauerland: Winterberg, sanfte Hügel, Hotel am Hang |
| `tegernsee` | Tegernsee | Rottach-Egern / Kreuth (Deutschland) | Sommer | Tegernsee: See mit Bergen (Wallberg), Rottach-Egern, Trainingsplatz am Ufer |
| `tirol` | Tirol | Seefeld / Kitzbühel (Österreich) | Sommer | Tirol: Seefelder Plateau, Wiesen, Karwendel im Hintergrund |
| `zillertal` | Zillertal | Zell am Ziller / Gerlos (Österreich) | Sommer | Zillertal: enges Tal, Zell am Ziller, Fußballplatz zwischen Bergen |
| `salzburgerland` | Salzburger Land | Saalfelden / Maria Alm / Leogang (Österreich) | Sommer | Salzburger Land: Saalfelden mit Steinernem Meer, Almwiesen |
| `steiermark` | Steiermark | Schladming / Bad Waltersdorf (Österreich) | Sommer | Steiermark: Schladming, Dachstein, Thermenlandschaft |
| `kaernten` | Kärnten | Velden / Wörthersee (Österreich) | Sommer | Kärnten: Wörthersee, Velden mit Uferpromenade |
| `schweiz` | Schweizer Alpen | Crans-Montana / Bad Ragaz (Schweiz) | Sommer | Schweizer Alpen: Crans-Montana, Hochplateau mit Blick ins Wallis |
| `engadin` | Höhentraining Engadin/Wallis | St. Moritz / Saas-Fee (Schweiz) | Sommer | Engadin: St. Moritz, See auf 1.800 m, karge Hochgebirgslandschaft |
| `suedtirol` | Südtirol | Eppan / Passeiertal / Bruneck (Italien) | Sommer | Südtirol: Weinberge bei Eppan, Dolomiten-Zacken |
| `kanaren` | Kanarische Inseln | Gran Canaria / Teneriffa (Spanien) | Winter | Kanaren: Gran Canaria, Vulkanberge, Atlantik, Palmen, Hotel am Hang |
| `spanien` | Andalusien | Marbella / Jerez (Spanien) | Winter | Andalusien: Marbella, Sierra Blanca über der Küste, Golfplatz-Grün |
| `mallorca` | Mallorca | Palma / Inselinneres (Spanien) | Winter | Mallorca: Inselinneres mit Mandelbäumen, Tramuntana-Berge |
| `lamanga` | La Manga | La Manga Club (Murcia) (Spanien) | Winter | La Manga Club: viele Trainingsplätze nebeneinander, trockene Hügel, Mar Menor |
| `algarve` | Algarve | Almancil / Albufeira (Portugal) | Winter | Algarve: Felsküste mit Klippen, Pinien, Golfresort |
| `malta` | Malta | St. Julian’s (Malta) | Winter | Malta: St. Julian’s, Kalksteinhäuser, Hafenbucht |
| `tuerkei` | Türkische Riviera | Belek / Antalya (Türkei) | Winter | Türkische Riviera: Belek, große Hotelanlage, Pinien, Taurusgebirge |
| `zypern` | Zypern | Limassol / Paphos (Zypern) | Winter | Zypern: Limassol/Paphos, Felsküste, Troodos-Berge |
| `florida` | Florida | Orlando / Bradenton (USA) | Winter | Florida: Orlando/Bradenton, Sportakademie, Palmen, flache Lagune |
| `dubai` | Vereinigte Arabische Emirate | Dubai / Abu Dhabi (VAE) | Winter | VAE: Dubai, Skyline in Dunst, Wüste und Rasenplätze |
| `katar` | Katar | Doha (Aspire Academy) (Katar) | Winter | Katar: Doha, Aspire Zone (Sportanlage), Wüstenlicht |
| `suedafrika` | Südafrika | Kapstadt / Johannesburg (Südafrika) | Winter | Südafrika: Kapstadt mit Tafelberg, Atlantik |
| `asien` | Asien-Reise | China / Japan / Singapur (Asien) | Sommer | Asien-Reise: Skyline (Shanghai/Tokio/Singapur) mit Stadion, Abendlicht kühl |
| `usatour` | USA-Sommertour | New York / Miami / Los Angeles (USA) | Sommer | USA-Sommertour: Großstadt-Skyline, College-Stadion |

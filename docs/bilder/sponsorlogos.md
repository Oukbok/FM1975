# Sponsorenlogos – Bildliste

Pascal: „Füge Logos für Sponsoren zur Liste der benötigten Bilder hinzu.“ Alle Firmen sind **erfunden**
(Prüfung `npm run test:names` gegen eine Sperrliste echter Marken). Die Logos dürfen **keiner echten Marke
ähneln** – keine bekannten Zeichen (Stern, Kranich, Muschel, drei Streifen, Raubkatze im Sprung …), keine
Farb-/Schriftkombinationen, die an eine bestehende Marke erinnern, keine echten Wappen.

Bis ein Bild eingetragen ist, zeichnet das Spiel ein Logo aus Name, Branche und Jahrzehnt
(`src/views/finanzen/sponsor/SponsorLogo.tsx`). Eingesetzt wird das Logo auf dem Trikot (Brust, Ärmel,
Ausrüster), auf den Banden, in der Sponsoren-Pyramide, auf der Karteikarte und in den Angebotslisten
(Finanzen › Sponsoring).

## Vorgaben

- **Größe:** 600 × 300 px (2 : 1), Logo mittig mit etwa 8 % Rand.
- **Format:** WebP mit Alpha (PNG mit Alpha geht als Vorlage; vor dem Einbau nach WebP wandeln).
- **Hintergrund:** transparent. Das Spiel legt bei Kachel/Zeichen die Branchenfarbe darunter, auf dem
  Trikot steht das Logo frei auf dem Stoff – darum gut lesbar auf hellem **und** dunklem Grund
  (helle Kontur oder eigene kleine Fläche im Logo).
- **Stil je Jahrzehnt** (Jahrzehnt des ersten Auftritts, Spalte „Stil“):
  - **70er** – Schriftzug in Serifen oder Großbuchstaben, oft kleines Wappen/Siegel, Doppelrahmen, 1–2 Farben.
  - **80er** – kantig, Blockschrift, harte Kontraste, geometrisches Zeichen.
  - **90er** – kursiv, Schwung/Swoosh-artige Linie (nicht nach echten Vorbildern), Farbverlauf.
  - **ab 2000** – flach, moderne Groteske, ruhige Fläche, Zeichen im Kreis/Quadrat, keine Effekte.
- **Inhalt:** Firmenname genau wie in der Tabelle (Umlaute/Akzente richtig), höchstens ein Zeichen.
- **Rechte:** selbst erstellt oder frei lizenziert; keine Schriften mit Markenbindung.

## Freischalten (Schritt für Schritt)

1. Logo nach den Vorgaben erstellen, als WebP speichern.
2. Datei unter `bilder/sponsor/logos/<datei>` ablegen – Dateiname aus der Spalte „Datei“
   (Slug des Namens: klein, Umlaute ausgeschrieben, Akzente weg, Leerzeichen/Sonderzeichen → `-`).
3. In `src/data/sponsorLogos.ts` den Slug ohne `.webp` in `SPONSOR_LOGOS` eintragen,
   z. B. `'kesselberg-braeu': true,`.
4. `npm run test:names` (prüft, dass nur bekannte Firmen eingetragen sind) und `npm run build`.
5. Ansehen: `node tests/sponsor-shots.mjs test-output/sponsor` (Trikot, Banden, Pyramide, Karteikarte;
   1920×1080 + 1366×768). Lädt ein Bild nicht, zeigt das Spiel wieder das gezeichnete Logo.

Wird eine Firma umbenannt, ändert sich ihr Dateiname mit; alte Spielstände werden beim Laden über
`src/data/sponsorRenames.ts` auf die neuen Namen umgestellt.

## Firmen (Sponsoring 2.0, `src/data/sponsorNames.ts`)

Zeitraum = Jahre, in denen die Firma als Sponsor auftreten kann (Firma, Branche und Herkunftsland zusammen).

| Name | Branche | Land | Zeitraum | Stil | Datei |
|---|---|---|---|---|---|
| Falkenhorst Kräuterlikör | Spirituosen | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `falkenhorst-kraeuterlikoer.webp` |
| Heidekrug Korn | Spirituosen | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `heidekrug-korn.webp` |
| Lotsenbitter | Spirituosen | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `lotsenbitter.webp` |
| Doppelkorn Brakelmann | Spirituosen | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `doppelkorn-brakelmann.webp` |
| Amaro Ventoso | Spirituosen | Italien | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `amaro-ventoso.webp` |
| Weinbrand Goldhügel | Spirituosen | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `weinbrand-goldhuegel.webp` |
| Kesselberg Bräu | Brauerei | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `kesselberg-braeu.webp` |
| Rheinperle Pils | Brauerei | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `rheinperle-pils.webp` |
| Brauerei Sonnwiese | Brauerei | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `brauerei-sonnwiese.webp` |
| Kogge Bräu | Brauerei | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `kogge-braeu.webp` |
| Abtei Hohenwald | Brauerei | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `abtei-hohenwald.webp` |
| Steinbock Bräu | Brauerei | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `steinbock-braeu.webp` |
| Lindenhof Export | Brauerei | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `lindenhof-export.webp` |
| Polder Bier | Brauerei | Niederlande | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `polder-bier.webp` |
| Kompass Zigaretten | Tabak | Deutschland | 1975–2006 | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `kompass-zigaretten.webp` |
| Leuchtfeuer Tabak | Tabak | Deutschland | 1975–2006 | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `leuchtfeuer-tabak.webp` |
| Silberstreif Filter | Tabak | Deutschland | 1975–2006 | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `silberstreif-filter.webp` |
| Pfeifenhaus Nordtabak | Tabak | Deutschland | 1975–2006 | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `pfeifenhaus-nordtabak.webp` |
| Deichgraf Versicherung | Versicherung | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `deichgraf-versicherung.webp` |
| Kontor Leben | Versicherung | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `kontor-leben.webp` |
| Ankerhof Assekuranz | Versicherung | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `ankerhof-assekuranz.webp` |
| Domblick Versicherungen | Versicherung | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `domblick-versicherungen.webp` |
| Gotthard Rück | Versicherung | Schweiz | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `gotthard-rueck.webp` |
| Mutuelle Clairval | Versicherung | Frankreich | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `mutuelle-clairval.webp` |
| Thamesgate Insurance | Versicherung | Großbritannien | 1990–heute | 90er: kursiv, Schwung, Farbverlauf | `thamesgate-insurance.webp` |
| Kontorbank Nord | Bank | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `kontorbank-nord.webp` |
| Heimatkasse | Bank | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `heimatkasse.webp` |
| Rheintaler Kreditbank | Bank | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `rheintaler-kreditbank.webp` |
| Brunnenthal Sparbank | Bank | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `brunnenthal-sparbank.webp` |
| Säntis Privatbank | Bank | Schweiz | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `saentis-privatbank.webp` |
| Marmara Kredi | Bank | Türkei | 2005–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `marmara-kredi.webp` |
| Pearl Gulf Bank | Bank | Katar | 2011–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `pearl-gulf-bank.webp` |
| Grachten Bank | Bank | Niederlande | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `grachten-bank.webp` |
| Merlin Automobile | Automobil | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `merlin-automobile.webp` |
| Kronwagen | Automobil | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `kronwagen.webp` |
| Ruhrwagen | Automobil | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `ruhrwagen.webp` |
| Lohwald Autohäuser | Automobil | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `lohwald-autohaeuser.webp` |
| Turino Motori | Automobil | Italien | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `turino-motori.webp` |
| Lumière Automobiles | Automobil | Frankreich | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `lumiere-automobiles.webp` |
| Hayashi Motors | Automobil | Japan | 1978–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `hayashi-motors.webp` |
| Hanmoo Motors | Automobil | Südkorea | 1995–heute | 90er: kursiv, Schwung, Farbverlauf | `hanmoo-motors.webp` |
| Tianhe Motors | Automobil | China | 2015–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `tianhe-motors.webp` |
| Hansa Elektro | Unterhaltungselektronik | Deutschland | 1975–2012 | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `hansa-elektro.webp` |
| Wellenwerk Radio | Unterhaltungselektronik | Deutschland | 1975–2012 | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `wellenwerk-radio.webp` |
| Nordklang Phono | Unterhaltungselektronik | Deutschland | 1975–2012 | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `nordklang-phono.webp` |
| Kaiyo Denki | Unterhaltungselektronik | Japan | 1978–2012 | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `kaiyo-denki.webp` |
| Shinrai Electronics | Unterhaltungselektronik | Japan | 1978–2012 | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `shinrai-electronics.webp` |
| Asahina Audio | Unterhaltungselektronik | Japan | 1978–2012 | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `asahina-audio.webp` |
| Atlas Computers | Unterhaltungselektronik | USA | 1980–1995 | 80er: kantig, Blockschrift, harte Kontraste | `atlas-computers.webp` |
| Corvid Micro | Unterhaltungselektronik | USA | 1982–2000 | 80er: kantig, Blockschrift, harte Kontraste | `corvid-micro.webp` |
| Polderlicht | Unterhaltungselektronik | Niederlande | 1975–2012 | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `polderlicht.webp` |
| Hanbit Electronics | Unterhaltungselektronik | Südkorea | 1995–2012 | 90er: kursiv, Schwung, Farbverlauf | `hanbit-electronics.webp` |
| Jinxiu Electronics | Unterhaltungselektronik | China | 2012–2012 | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `jinxiu-electronics.webp` |
| Marktkorb | Handel | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `marktkorb.webp` |
| Kaufkontor | Handel | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `kaufkontor.webp` |
| Möbel Wohnwerk | Handel | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `moebel-wohnwerk.webp` |
| Baumarkt Hammerschmidt | Handel | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `baumarkt-hammerschmidt.webp` |
| Elektro-Discount Blitz | Handel | Deutschland | 1990–heute | 90er: kursiv, Schwung, Farbverlauf | `elektro-discount-blitz.webp` |
| Pazar Lale | Handel | Türkei | 2005–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `pazar-lale.webp` |
| Ruhr-Bau | Bau & Immobilien | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `ruhr-bau.webp` |
| Domstadt Immobilien | Bau & Immobilien | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `domstadt-immobilien.webp` |
| Weserbau Lohmann | Bau & Immobilien | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `weserbau-lohmann.webp` |
| Sahil Construction | Bau & Immobilien | Vereinigte Arabische Emirate | 2004–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `sahil-construction.webp` |
| Greifen Chemie | Chemie & Industrie | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `greifen-chemie.webp` |
| Siegtal Metallwerke | Chemie & Industrie | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `siegtal-metallwerke.webp` |
| Emscher Kohle | Chemie & Industrie | Deutschland | 1975–2005 | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `emscher-kohle.webp` |
| Elbgummi Werke | Chemie & Industrie | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `elbgummi-werke.webp` |
| Sonnen Molkerei | Lebensmittel | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `sonnen-molkerei.webp` |
| Weltmarke Kaffee | Lebensmittel | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `weltmarke-kaffee.webp` |
| Kutterfang Fisch | Lebensmittel | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `kutterfang-fisch.webp` |
| Schoko Bodenhain | Lebensmittel | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `schoko-bodenhain.webp` |
| Pasta Fiorentina | Lebensmittel | Italien | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `pasta-fiorentina.webp` |
| Bergwiesen Milch | Lebensmittel | Schweiz | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `bergwiesen-milch.webp` |
| Prairie Cola | Lebensmittel | USA | 1980–heute | 80er: kantig, Blockschrift, harte Kontraste | `prairie-cola.webp` |
| Rhein-Pharma | Pharma & Gesundheit | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `rhein-pharma.webp` |
| Medivalis | Pharma & Gesundheit | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `medivalis.webp` |
| Alpenapotheke Pharma | Pharma & Gesundheit | Schweiz | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `alpenapotheke-pharma.webp` |
| Gepard Sport | Sportartikel | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `gepard-sport.webp` |
| Nordstern Sportswear | Sportartikel | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `nordstern-sportswear.webp` |
| Herzog Sport | Sportartikel | Deutschland | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `herzog-sport.webp` |
| Linea Atletica | Sportartikel | Italien | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `linea-atletica.webp` |
| Vantor Athletics | Sportartikel | USA | 1985–heute | 80er: kantig, Blockschrift, harte Kontraste | `vantor-athletics.webp` |
| Étoile Sport | Sportartikel | Frankreich | 1975–heute | 70er: Schriftzug in Serifen/Großbuchstaben oder kleines Wappen, Doppelrahmen | `etoile-sport.webp` |
| Paketblitz | Logistik | Deutschland | 1990–heute | 90er: kursiv, Schwung, Farbverlauf | `paketblitz.webp` |
| Hanse Logistik | Logistik | Deutschland | 1990–heute | 90er: kursiv, Schwung, Farbverlauf | `hanse-logistik.webp` |
| Kurierwind Express | Logistik | Deutschland | 1990–heute | 90er: kursiv, Schwung, Farbverlauf | `kurierwind-express.webp` |
| Speedline Cargo | Logistik | Niederlande | 1990–heute | 90er: kursiv, Schwung, Farbverlauf | `speedline-cargo.webp` |
| Telenova | Telekommunikation | Deutschland | 1992–heute | 90er: kursiv, Schwung, Farbverlauf | `telenova.webp` |
| Funknetz Plus | Telekommunikation | Deutschland | 1992–heute | 90er: kursiv, Schwung, Farbverlauf | `funknetz-plus.webp` |
| Mobiwell | Telekommunikation | Deutschland | 1996–heute | 90er: kursiv, Schwung, Farbverlauf | `mobiwell.webp` |
| Kabelwelt | Telekommunikation | Deutschland | 1996–heute | 90er: kursiv, Schwung, Farbverlauf | `kabelwelt.webp` |
| Hanbit Mobile | Telekommunikation | Südkorea | 2000–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `hanbit-mobile.webp` |
| Jinxiu Mobile | Telekommunikation | China | 2012–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `jinxiu-mobile.webp` |
| Rheinstrom | Energie | Deutschland | 1998–heute | 90er: kursiv, Schwung, Farbverlauf | `rheinstrom.webp` |
| Lumen Energie | Energie | Deutschland | 1998–heute | 90er: kursiv, Schwung, Farbverlauf | `lumen-energie.webp` |
| Küstengas | Energie | Deutschland | 1998–heute | 90er: kursiv, Schwung, Farbverlauf | `kuestengas.webp` |
| Stadtwerke Plus | Energie | Deutschland | 1998–heute | 90er: kursiv, Schwung, Farbverlauf | `stadtwerke-plus.webp` |
| Taiga Gas Export | Energie | Russland | 2006–2021 | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `taiga-gas-export.webp` |
| Pearl Energy | Energie | Katar | 2011–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `pearl-energy.webp` |
| Desert Petroleum | Energie | Saudi-Arabien | 2023–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `desert-petroleum.webp` |
| Netzwerk AG | Technologie & IT | Deutschland | 1998–heute | 90er: kursiv, Schwung, Farbverlauf | `netzwerk-ag.webp` |
| Datawerk | Technologie & IT | Deutschland | 2000–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `datawerk.webp` |
| Cloudhaven | Technologie & IT | USA | 2008–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `cloudhaven.webp` |
| Bytestream | Technologie & IT | USA | 2010–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `bytestream.webp` |
| Yunhai Tech | Technologie & IT | China | 2012–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `yunhai-tech.webp` |
| Kaiyo Digital | Technologie & IT | Japan | 2010–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `kaiyo-digital.webp` |
| Hanbit Cloud | Technologie & IT | Südkorea | 2012–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `hanbit-cloud.webp` |
| Klickhaus.de | Online-Handel & Portale | Deutschland | 1999–heute | 90er: kursiv, Schwung, Farbverlauf | `klickhaus-de.webp` |
| Fanbox24 | Online-Handel & Portale | Deutschland | 2005–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `fanbox24.webp` |
| Modeplatz | Online-Handel & Portale | Deutschland | 2010–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `modeplatz.webp` |
| Shopwelt | Online-Handel & Portale | USA | 2008–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `shopwelt.webp` |
| Jade Mall | Online-Handel & Portale | China | 2014–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `jade-mall.webp` |
| Bitmarkt Online | Online-Handel & Portale | Niederlande | 2008–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `bitmarkt-online.webp` |
| Möwe Charter | Fluggesellschaft | Deutschland | 2000–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `moewe-charter.webp` |
| Alpenflug | Fluggesellschaft | Deutschland | 2000–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `alpenflug.webp` |
| Al-Sahra Airways | Fluggesellschaft | Vereinigte Arabische Emirate | 2004–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `al-sahra-airways.webp` |
| Gulf Crown Air | Fluggesellschaft | Vereinigte Arabische Emirate | 2004–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `gulf-crown-air.webp` |
| Doha Pearl Airways | Fluggesellschaft | Katar | 2011–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `doha-pearl-airways.webp` |
| Lale Air | Fluggesellschaft | Türkei | 2005–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `lale-air.webp` |
| Desert Wings | Fluggesellschaft | Saudi-Arabien | 2023–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `desert-wings.webp` |
| Doha Horizons | Staatsfonds & Tourismus | Katar | 2011–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `doha-horizons.webp` |
| Pearl Investment Authority | Staatsfonds & Tourismus | Katar | 2011–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `pearl-investment-authority.webp` |
| Discover Liwa | Staatsfonds & Tourismus | Vereinigte Arabische Emirate | 2011–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `discover-liwa.webp` |
| Desert Vision Fund | Staatsfonds & Tourismus | Saudi-Arabien | 2023–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `desert-vision-fund.webp` |
| Invest Rheinland | Staatsfonds & Tourismus | Deutschland | 2011–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `invest-rheinland.webp` |
| Torwette | Sportwetten | Deutschland | 2005–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `torwette.webp` |
| Bet-Arena | Sportwetten | Malta | 2005–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `bet-arena.webp` |
| Valletta Bet | Sportwetten | Malta | 2005–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `valletta-bet.webp` |
| Quotenkönig | Sportwetten | Deutschland | 2012–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `quotenkoenig.webp` |
| Royal Odds | Sportwetten | Großbritannien | 2012–heute | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `royal-odds.webp` |
| Coinkeller | Krypto & Fan-Token | USA | 2021–2022 | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `coinkeller.webp` |
| BitArena | Krypto & Fan-Token | Malta | 2021–2022 | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `bitarena.webp` |
| Blockwerft | Krypto & Fan-Token | USA | 2021–2022 | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `blockwerft.webp` |
| FanToken Hub | Krypto & Fan-Token | Malta | 2021–2022 | ab 2000: flach, moderne Groteske, Zeichen im Kreis | `fantoken-hub.webp` |

## Partner aus alten Spielständen (`src/engine/finances.ts`)

Nur in Spielständen vor Sponsoring 2.0 als Trikot- bzw. Bandenpartner übernommen (niedrige Priorität).

| Name | Fläche | Land | Zeitraum | Stil | Datei |
|---|---|---|---|---|---|
| Lohwald Bekleidung | Trikot (alter Spielstand) | Deutschland | 1975–1990 | 70er: Schriftzug/Wappen | `lohwald-bekleidung.webp` |
| Elbgummi Reifen | Trikot (alter Spielstand) | Deutschland | 1975–1990 | 70er: Schriftzug/Wappen | `elbgummi-reifen.webp` |
| Schuhhaus Brenner | Trikot (alter Spielstand) | Deutschland | 1975–1990 | 70er: Schriftzug/Wappen | `schuhhaus-brenner.webp` |
| Regio Werbung | Bande (alter Spielstand) | Deutschland | 1975–1990 | 70er: Schriftzug/Wappen | `regio-werbung.webp` |
| Plakat & Co. | Bande (alter Spielstand) | Deutschland | 1975–1990 | 70er: Schriftzug/Wappen | `plakat-und-co.webp` |
| Stadion-Marketing GmbH | Bande (alter Spielstand) | Deutschland | 1975–1990 | 70er: Schriftzug/Wappen | `stadion-marketing-gmbh.webp` |
| Säulen Media | Bande (alter Spielstand) | Deutschland | 1975–1990 | 70er: Schriftzug/Wappen | `saeulen-media.webp` |
| City Reklame | Bande (alter Spielstand) | Deutschland | 1975–1990 | 70er: Schriftzug/Wappen | `city-reklame.webp` |
| Panorama Werbung | Bande (alter Spielstand) | Deutschland | 1975–1990 | 70er: Schriftzug/Wappen | `panorama-werbung.webp` |
| Arena Promotion | Bande (alter Spielstand) | Deutschland | 1975–1990 | 70er: Schriftzug/Wappen | `arena-promotion.webp` |

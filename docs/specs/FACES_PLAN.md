# Spieler-Portraits — Generierungsplan (Stand: 31.10.2026)

Dieses Dokument ist die verbindliche Spezifikation fuer die Spieler-Gesichter.
Es wird gemeinsam mit Pascal abgestimmt, BEVOR ein neues Set generiert wird.
Kein Bild-Auftrag ohne ausdrueckliche Freigabe (kostet Credits).

Aenderungen gegenueber der Vorversion: kein Trikot mehr im Bild (Schnitt am Hals),
Pools nach Jahrzehnt x Gesichtsgruppe statt fester Ethnien-Prozente, getestete Prompt-Vorlage,
Umfang neu zur Diskussion (Vorschlag ~3.700 statt 2.100).

## 1. Ziel & Umfang

- Fotorealistische Portraits, die in den **Top-5-Ligen Europas** glaubwuerdig wirken.
- Jahrzehnt-Mechanik (unveraendert): Nur mit 16 Jahren nachrueckende Jugendspieler bekommen das
  Gesicht des aktuellen Jahrzehnts; ein Spieler behaelt sein Gesicht lebenslang. Deshalb muessen
  alle Dekaden-Pools (1970er–2030er) gleichzeitig existieren. Der Startkader 1975 nutzt den 1970er-Pool.
- Umfang: siehe Abschnitt 5 (Vorschlag ~3.700 Bilder, offen).

## 2. Bildausschnitt (harte Vorgabe)

- **Nur Kopf und Gesicht.** Der Bildausschnitt endet knapp unter dem Kinn am oberen Hals.
- **Keine Kleidung**: kein Trikot, kein Kragen, keine Schultern. Damit entfallen Trikotform,
  Kragenstil pro Epoche und das Einfaerben in Vereinsfarben komplett.
- Vereinsbezug kommt zur Laufzeit ueber die Oberflaeche (z. B. Rahmen oder Hintergrund in
  Vereinsfarbe, Wappen daneben), nicht ueber das Bild.
- Quadratisch 1:1, Gesicht mittig, Blick ungefaehr in die Kamera.
- Keine Logos, Schrift, Nummern, kein Schmuck.

## 3. Hintergrund (offen, Empfehlung)

- Getestet und fuer gut befunden: **einheitlich neutrales Dunkelgrau**, weiches gleichmaessiges Licht.
- Empfehlung: dabei bleiben. Nachtraegliches Freistellen hat in v2 die Haare beschaedigt;
  ein einheitlicher Hintergrund braucht kein Freistellen und sieht in Kaderlisten ruhig aus.
- Falls im Spiel doch ein transparenter Hintergrund noetig ist: vor der Massenproduktion an
  10 Bildern pruefen, ob die Haarkanten sauber bleiben.

## 4. Herkunft: Pools nach Jahrzehnt x Gesichtsgruppe

- Jede Herkunft im Spiel hat bereits eine Gesichtsgruppe (`face` in `src/data/origins.ts`):
  mitteleuropa, nordeuropa, suedeuropa, osteuropa, balkan, tuerkei, westafrika, nordafrika,
  lateinamerika, ostasien.
- Bilder werden je **Jahrzehnt x Gesichtsgruppe** erzeugt. Ein Spieler bekommt ein Bild aus dem Pool
  seines Eintrittsjahrzehnts und seiner Gesichtsgruppe. Das Gesicht passt damit immer zu Name und Herkunft.
- Die Verteilung ergibt sich aus der Herkunftsmischung des Spiels (`originMixForYear`), nicht aus
  einer eigenen Tabelle. Gemessene Anteile (Stichprobe je Jahr, gerundet):

| Jahr | Anteile laut Spiel |
|------|--------------------|
| 1975 | mitteleuropa 96 %, nordeuropa 3 %, balkan 2 % |
| 1985 | mitteleuropa 93 %, nordeuropa 3 %, balkan 2 %, osteuropa/tuerkei/ostasien je < 1 % |
| 1995 | mitteleuropa 71 %, osteuropa 9 %, balkan/nordeuropa/westafrika/tuerkei je ~4 %, lateinamerika 3 % |
| 2005 | mitteleuropa 60 %, osteuropa 9 %, lateinamerika/westafrika je 7 %, balkan/tuerkei je 5 %, nordeuropa 4 % |
| 2015 | mitteleuropa 57 %, westafrika 9 %, osteuropa 7 %, nordeuropa 6 %, balkan/ostasien/tuerkei/suedeuropa/lateinamerika je ~4 % |
| 2025 | mitteleuropa 56 %, westafrika 10 %, nordeuropa 7 %, osteuropa 6 %, ostasien 5 %, uebrige je 1–4 % |

- Aendert sich die Herkunftsmischung im Spiel, wird die Pool-Tabelle in Abschnitt 5 neu berechnet.
- Prompt-Formulierung neutral als Herkunft (z. B. "German man of Turkish descent, olive skin").
  Frisur und Gesichtsausdruck werden **unabhaengig** von der Herkunft gewuerfelt (keine Stereotype).

## 5. Umfang: Wie viele Gesichter? (offen)

Bisher bestaetigt: 300 pro Jahrzehnt = 2.100. Neue Ueberlegung:

- Volle Kader hat nur die Liga des Spielers (18 Vereine, ~450 Spieler gleichzeitig sichtbar).
  Allein der Start 1975 braucht dafuer ~450 Gesichter aus dem 1970er-Pool, dazu Jugend und Zugaenge
  ueber das Jahrzehnt: grob 1.000 Spieler im 1970er-Pool, 600–800 in spaeteren Jahrzehnten.
- Bei 300 Bildern (davon ~290 mitteleuropa in den 1970ern) taucht jedes Gesicht im Schnitt 3x
  gleichzeitig in der Liga auf, teils im selben Kader. Das faellt auf.
- Kleine Gruppen brauchen eine **Mindestzahl** (Vorschlag 15), sonst haben z. B. alle japanischen
  Spieler eines Jahrzehnts dasselbe Gesicht. Gerade diese Spieler fallen auf.

Vorschlag: 1970er 600, sonst ~500 je Jahrzehnt, je Gruppe Anteil x Gesamtzahl, mindestens 15
(auf 5 gerundet; 0 % = kein Pool):

| Jahrzehnt | mittel | nord | sued | ost | balkan | tuerkei | westafr. | nordafr. | latein | ostasien | Summe |
|-----------|-------:|-----:|-----:|----:|-------:|--------:|---------:|---------:|-------:|---------:|------:|
| 1970er    | 575 | 15 |  0 |  0 | 15 |  0 |  0 |  0 |  0 |  0 | 605 |
| 1980er    | 465 | 15 |  0 | 15 | 15 | 15 |  0 |  0 |  0 | 15 | 540 |
| 1990er    | 355 | 20 | 15 | 45 | 20 | 20 | 20 |  0 | 15 |  0 | 510 |
| 2000er    | 300 | 20 | 15 | 45 | 25 | 25 | 35 |  0 | 35 | 15 | 515 |
| 2010er    | 285 | 30 | 20 | 35 | 25 | 20 | 40 | 15 | 20 | 20 | 510 |
| 2020er    | 280 | 35 | 20 | 30 | 20 | 20 | 50 | 15 | 15 | 25 | 510 |
| 2030er    | 280 | 35 | 20 | 30 | 20 | 20 | 50 | 15 | 15 | 25 | 510 |
| **Gesamt**|     |    |    |    |    |    |    |    |    |    | **3.700** |

Ergaenzend, kostenlos: **Spiegeln zur Laufzeit** (horizontal, per Seed) verdoppelt die
wahrgenommene Vielfalt. Voraussetzung: keine seitengebundenen Merkmale im Prompt (Narbe links o. ae.).

Fallback, falls ein Pool leer ist (z. B. Gruppe kommt in einem Jahrzehnt unerwartet vor):
naechstes Jahrzehnt derselben Gruppe, sonst SVG-Avatar.

## 6. Prompt-Vorlage (getestet 31.10.2026, Ergebnis gut)

Feste Grundvorlage (fuer alle Bilder unveraendert):

```
Photorealistic head-and-face portrait of a fictional professional footballer,
not resembling any real person. Square 1:1 format. Tight crop: the frame ends
just below the chin at the upper neck. No shoulders, no clothing, no jersey,
no collar visible. Face centered, looking roughly into the camera. Plain,
neutral dark-grey studio background. Soft, even lighting. No text, no logos,
no jewelry.
```

Variable Felder je Bild: Jahrzehnt, Alter (17–36), Herkunft/Hautton/Augenfarbe, Frisur + Bart,
Gesichtsausdruck, Foto-Look.

Bausteine pro Jahrzehnt:

| Jahrzehnt | Frisuren & Baerte | Foto-Look |
|-----------|-------------------|-----------|
| 1970er | lange Haare ueber den Ohren, Koteletten, Locken, Vollbart, Schnauzer, Mittelscheitel, Topfschnitt | warmer 70er-Film, leichtes Korn |
| 1980er | Vokuhila, Dauerwelle, buschiger Schnauzer, Foehnfrisur | Blitzlicht, kontrastreicher |
| 1990er | Curtains, kurzer Undercut, Glatze, Ziegenbart, gegelte Straehnen | saubere Farben, leicht entsaettigt |
| 2000er | Faux-Hawk, Gel-Spikes, Cornrows, Dreitagebart | fruehes Digitalfoto, etwas kuehl |
| 2010er+ | Fade/Undercut mit Seitenscheitel, Man Bun, gepflegter Vollbart, Blondierung | scharfes Studiofoto |

Gesichtsausdruecke (zufaellig): ernst/konzentriert, leichtes Laecheln, selbstbewusstes Grinsen,
entschlossen mit zusammengekniffenen Augen, neutral, freundlich, verschmitzt, schuechtern.
Aeltere Spieler mit leichten Falten/Geheimratsecken.

Bekannte Stolpersteine:
- Generator zeigt gelegentlich doch Schultern/Kragen → "extreme close-up, cropped at the neck,
  bare neck only" ergaenzen oder neu generieren.
- Kombinationen wie Dauerwelle + Schnauzer erinnern manchmal an echte Stars → neu generieren.

## 7. Naechste Schritte (erst nach Freigabe)

1. Umfang festlegen (Abschnitt 5).
2. Hintergrund festlegen (Abschnitt 3).
3. Test-Set je Jahrzehnt: 5 Bilder ueber verschiedene Gruppen, Einheitlichkeit nebeneinander pruefen.
4. Massengenerierung ueber die Bild-API mit automatisch gebauten Prompts (Jahrzehnt, Gruppe,
   gewuerfelte Bausteine), erst nach ausdruecklicher Freigabe fuer einen Credits ausgebenden Lauf.
   Kosten vorher anhand des aktuellen API-Preises hochrechnen.

## 8. Spaetere Integration (eigener Turn)

- Ordnerstruktur: `public/assets/faces/<decade>/<group>/<index>.webp` (z. B. `1970/mitteleuropa/0042.webp`).
- Auswahl in `src/components/PlayerAvatar.tsx`: Eintrittsjahrzehnt + `player.face` + Seed → Index,
  Spiegelung per Seed, SVG-Fallback wenn Bild fehlt.
- Groesse: ~256 px reichen fuer Kaderliste und Profil; WebP haelt 3.700 Bilder klein.

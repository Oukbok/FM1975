# Spieler-Portraits — Generierungsplan (Stand: Planungsphase)

Dieses Dokument ist die verbindliche Spezifikation fuer die Spieler-Gesichter.
Es wird gemeinsam mit Pascal abgestimmt, BEVOR ein neues Test-Set generiert wird.
Kein Bild-Auftrag ohne ausdrueckliche Freigabe (kostet Credits).

## 1. Ziel & Umfang

- Zielumfang (bestaetigt): Balanced = **300 Gesichter / Jahrzehnt x 7 Jahrzehnte (1970er-2030er) = 2.100 Bilder**.
- Jahrzehnt-Mechanik: Nur mit 16 Jahren nachrueckende Jugendspieler bekommen das Gesicht des
  aktuellen Jahrzehnts; ein Spieler behaelt sein Gesicht lebenslang. Deshalb muessen alle
  Dekaden-Pools gleichzeitig existieren.
- Aktueller Fokus: Gesichter, die in den **Top-5-Ligen Europas** (England, Spanien, Deutschland,
  Italien, Frankreich) glaubwuerdig wirken.

## 2. Trikot (EINHEITLICH — harte Vorgabe)

- **Eine feste Trikot-Form** je Jahrzehnt, NICHT pro Bild variierend.
- Muss klar als **echtes Fussballtrikot** erkennbar sein: fester Stoff-Look, sichtbarer
  Schulter-/Aermelansatz, **echter Trikotkragen**. KEIN schlaffer Rundhals-T-Shirt-Ausschnitt
  (Hauptfehler von v1/v2).
- **Farblogik:** Hauptteil = **Hauptfarbe** des Vereins; **Kragen (+ ggf. Aermelbuendchen) =
  Zweitfarbe** des Vereins.
- **Kragenstil pro Epoche** (Retro-Alterung):
  - 1970er: klassischer Spitz-/Umlegekragen
  - 1980er/1990er: Polo-/V-Kragen
  - ab 2000er: moderner schmaler Kragen
- **KEINE** Logos, Nummern, Sponsoren, Wappen im Bild (kommen zur Laufzeit im Spiel dazu).
- **Technik Farbe:**
  - Test-Set: Trikots direkt in verschiedenen Farbkombis zur Beurteilung von Form + Wirkung.
  - Massenproduktion: Trikot neutral/graustufig mit sauber getrennten Zonen (Koerper vs. Kragen)
    generieren und **zur Laufzeit in echte Vereinsfarben einfaerben** (Recolor). So passt jedes
    Gesicht zu jedem Verein, ohne pro Club eigene Bilder. Form bleibt identisch, nur Farbe wechselt.

## 3. Koepfe (NEU generieren — keine Ausschnitte)

- **Kein rembg-Cutout mehr.** Nachtraegliches Freistellen hat die Haare beschaedigt (sichtbar in v2).
- Jedes Portrait **frisch als Brustbild** generieren (Kopf + Schultern mit Trikot bereits im Bild),
  transparenter Hintergrund per haarschonendem Matting oder direkt transparent — je nachdem, was
  bei den Haarkanten besser aussieht. Ziel: saubere Kanten, kein ausgefranster Rand.
- Maltstil / Gesichtsqualitaet / Retro-Look bleiben wie im grundsaetzlich akzeptierten Stil,
  nur neu und mit echtem Trikot.
- **Transparenter Hintergrund** bleibt Pflicht (Hintergrund wechselt im Spiel).

## 4. Ethnische Vielfalt ueber die Jahrzehnte (Richtwerte, anpassbar)

Verteilungs-Stellschrauben pro Jahrzehnt (keine festen Fakten; gemeinsam justierbar):

| Jahrzehnt | Weiss/europ. | Schwarz/afrik. | Arab./nordafr. | Asiatisch | Sonstige/gemischt |
|-----------|-------------:|---------------:|---------------:|----------:|------------------:|
| 1970er    | 90 %         | 7 %            | 2 %            | 0 %       | 1 %               |
| 1980er    | 84 %         | 11 %           | 3 %            | 1 %       | 1 %               |
| 1990er    | 77 %         | 16 %           | 4 %            | 1 %       | 2 %               |
| 2000er    | 70 %         | 21 %           | 5 %            | 2 %       | 2 %               |
| 2010er    | 62 %         | 27 %           | 6 %            | 3 %       | 2 %               |
| 2020er    | 57 %         | 30 %           | 7 %            | 3 %       | 3 %               |
| 2030er    | 54 %         | 32 %           | 7 %            | 4 %       | 3 %               |

Zusaetzliche Variation gegen Klon-Eindruck: Hautton-Abstufungen, zeittypische Frisuren
(70er: Vollbart/Koteletten/Lockenmaehne -> modern: kurz/Fade/Undercut), Gesichtsbehaarung, Alter.

## 5. Naechster Schritt (erst nach Freigabe)

- Test-Set "1970er v3": 12 frisch generierte Koepfe, einheitliches echtes Trikot
  (Haupt-/Kragenfarbe), transparenter Hintergrund, 70er-Ethnienmix lt. Tabelle.
- Optional direkt danach: Mini-Set einer modernen Dekade (z. B. 2010er) zum Diversitaets-Vergleich.

## 6. Offene Abstimmpunkte mit Pascal

1. Trikot-Form final (echter Kragen + Haupt/Zweitfarbe, Kragenstil pro Epoche) — ok?
2. Verteilungs-Richtwerte in der Tabelle — zu viel/zu wenig in einzelnen Dekaden?
3. Erstes Test-Set nur 1970er ODER 1970er + eine moderne Dekade zum Vergleich?

## 7. Spaetere Integration (nach Stil-Freigabe, eigener Turn)

- Seed->Bild-Index-Mapping in src/components/PlayerAvatar.tsx (mit SVG-Fallback, wenn Bild fehlt).
- Ordnerstruktur: public/assets/faces/<decade>/<index>.png
- Shirt-Recolor-Mechanik zur Laufzeit (Koerper- und Kragenzone getrennt einfaerben).
- Massengenerierung ueber autonomen Daemon-Agent (erst nach ausdruecklicher Freigabe fuer
  unbeaufsichtigten, Credits ausgebenden Lauf).

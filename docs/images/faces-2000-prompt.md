# Spielergesichter Epoche 2000 – Prompt und Paketplan

Epoche 2000 = Spieler, die in den 2000ern etwa 25 sind (Jahrgänge 1975–1984). 300 Bilder in 30 Paketen à 10.

## Verteilung (passend zum Spiel)

Gemessen im Spiel an allen Spielern der Jahrgänge 1975–1984 (Vorlage „Test 30 Jahre“, 16 909 Spieler aller Ligen und des Weltpools). Kleine Gruppen haben mindestens 10 Bilder, damit sich die Gesichter nicht zu oft wiederholen.

| Gruppe | Anteil im Spiel | Bilder | Pakete | Nummern |
|---|---|---|---|---|
| mitteleuropa | 30,1 % | 80 | 01–08 | 001–080 |
| osteuropa | 18,5 % | 50 | 09–13 | 081–130 |
| suedeuropa | 16,1 % | 40 | 14–17 | 131–170 |
| balkan | 10,1 % | 30 | 18–20 | 171–200 |
| nordeuropa | 9,8 % | 30 | 21–23 | 201–230 |
| westafrika | 7,9 % | 30 | 24–26 | 231–260 |
| tuerkei | 3,9 % | 10 | 27 | 261–270 |
| lateinamerika | 1,7 % | 10 | 28 | 271–280 |
| nordafrika | 1,3 % | 10 | 29 | 281–290 |
| ostasien | 0,5 % | 10 | 30 | 291–300 |

## Stand 21.11.2026

Alle 300 Bilder sind im Spiel und gesichtet. Umsortiert nach Aussehen: 273 und 277 von `lateinamerika` nach `westafrika`.

**Gemischte Herkunft:** Einordnen nach dem Aussehen, nicht nach dem Pass. Ein Franzose mit senegalesischen Eltern liegt bei `westafrika`, ein Niederländer mit marokkanischen Eltern bei `nordafrika`. Die Herkunft darf als Zusatz im Dateinamen stehen.

**Westafrika-Pakete 24–26:** Davon etwa die Hälfte europäische Spieler mit afrikanischen oder karibischen Wurzeln (französisch, englisch, niederländisch-surinamisch, belgisch, portugiesisch, deutsch). Die andere Hälfte sind Spieler aus Nigeria, Ghana, Kamerun, der Elfenbeinküste und dem Senegal.

## Dateien

- Name: `2000_<nr>_<gruppe>[_<herkunft>].png`, z. B. `2000_237_westafrika_franzoesisch-senegalesisch.png`.
- Format: PNG mit transparentem Hintergrund, 1024 × 1200 px (wie die 1990er Pakete).
- Nur Kopf und Hals, ohne Trikot und ohne Schultern; unterhalb des Halses ist alles durchsichtig (wie die 1990er Bilder). Ein Bild mit Trikot passt nicht zu den übrigen Köpfen.
- Je Paket eine ZIP-Datei `faces_2000_batch_<NN>_<gruppe>.zip` mit genau 10 Bildern.

## Prompt (für jedes Paket; nur den Block „Paket“ anpassen)

```
Create 10 separate photorealistic portrait images of fictional professional male football players from the 2000s (born 1975–1984, age about 25). They must NOT resemble any real person.

TECHNICAL (identical for all 10):
- One person per image, 1024 x 1200 px, PNG with fully transparent background (no backdrop, no shadow, no white).
- ONLY the head and the neck – NO shirt, NO collar, NO clothing, NO shoulders. The neck ends in a soft, slightly curved cut just below the Adam's apple, like a cut-out portrait sticker; everything below the cut is transparent.
- Framing: top of the hair about 50 px below the top edge, bottom of the neck cut at about 89 % of the image height (about 1070 px), head centred, the head (incl. hair) about 75–80 % of the image width. Leave transparent space left and right of the head – do NOT fill the frame.
- Frontal to slightly angled (max 15°), eyes looking into the camera, neutral to slightly friendly expression.
- Soft, even studio light from the front, no hard shadows, no coloured light.
- Natural skin texture, typical mid-2000s team-photo look (sharp digital photo, slightly saturated).
- No jewellery except at most a small earring stud, no headbands, no hats, no glasses, no text, no watermark.

PAKET:
- Group: <GRUPPE> – <HERKUNFT-LISTE>
- Numbers: <NR-VON> to <NR-BIS>, file names 2000_<nr>_<gruppe>_<herkunft>.png

VARIATION: Every image must differ clearly. For each image pick ONE option from every list below, never repeat the same combination of hairstyle + facial hair + face shape within the package, and spread the choices across the whole list.
```

Unter den Prompt die Merkmal-Listen hängen:

### Frisur (2000er)
1. kurz gegelt, Spitzen nach oben
2. Irokesen-Streifen, Seiten kurz
3. Faux-Hawk, leicht gegelt
4. Buzzcut 3 mm
5. ganz kahl rasiert
6. kurzer Caesar-Schnitt mit Pony
7. Undercut, oben länger nach hinten gegelt
8. Seitenscheitel, sauber gekämmt
9. kinnlange Haare hinter die Ohren
10. schulterlang mit dünnem Haarband-Abdruck, offen
11. kurze Locken
12. Stoppelhaar mit ausrasiertem Seitenstreifen
13. blondierte Spitzen auf dunklem Haar
14. Wet-Look, nach hinten gekämmt
15. kurze Cornrows (nur westafrika/lateinamerika)
16. kurze Dreadlocks (nur westafrika/lateinamerika)
17. Afro kurz und rund
18. Hochfrisur „Pompadour light“
19. Stirnfransen, verwuschelt
20. Mittelscheitel, ohrlang („Curtains“)
21. Glatze mit leichtem Haarkranz (Geheimratsecken)
22. Kurzhaar mit Geheimratsecken
23. Messy-Look mit Wachs
24. Topfschnitt modernisiert
25. halblang, gewellt, leicht strähnig

### Bart
1. glatt rasiert
2. Drei-Tage-Bart
3. Kinnbart (Goatee)
4. schmaler Kinnstreifen („Soul Patch“)
5. dünner Ringbart
6. gestutzter Vollbart
7. Koteletten bis zum Ohrläppchen
8. lange schmale Koteletten
9. Schnurrbart dünn
10. Bartstoppeln nur am Kinn
11. Linienbart entlang des Kiefers („Chinstrap“)
12. Henriquatre
13. leichter Flaum
14. Bartschatten, frisch rasiert
15. Kinnbart mit Schnurrbart verbunden
16. ungleichmäßiger Jugendbart
17. kurzer Kinnbart mit rasierten Wangen
18. Wangenbart kurz
19. sehr kurzer Vollbart, dicht
20. Ankerbart
21. Spitzbart lang
22. glatt rasiert mit Narbe am Kinn
23. Drei-Tage-Bart nur auf der Oberlippe dichter
24. Koteletten mit Kinnstreifen
25. glatt rasiert, Grübchen im Kinn

### Gesichtsform
1. oval
2. rund
3. eckig mit breitem Kiefer
4. lang und schmal
5. herzförmig
6. rautenförmig, hohe Wangenknochen
7. breit, kräftig
8. kantig, markantes Kinn
9. schmal mit spitzem Kinn
10. voll, weiche Züge
11. hager, eingefallene Wangen
12. breite Stirn, schmales Kinn
13. kurzes Gesicht, breiter Mund
14. lang mit kräftigem Kinn
15. jungenhaft rund
16. athletisch, definierte Kieferlinie
17. leicht asymmetrisch
18. hohe Stirn
19. niedrige Stirn, kräftige Brauen
20. Doppelkinn-Ansatz
21. eckig mit Grübchenkinn
22. schmal mit langem Hals
23. breiter Nacken, kurzer Hals
24. markante Wangenknochen, schmale Wangen
25. weiche Rundung, kleine Nase

### Nase
1. gerade, mittelgroß
2. schmal und lang
3. breit, flache Nasenwurzel
4. Adlernase
5. Stupsnase
6. leicht schief (gebrochen)
7. kräftiger Höcker
8. kurz und breit
9. spitz zulaufend
10. breite Nasenflügel
11. schmal mit hohem Rücken
12. leicht nach oben zeigend
13. knollig
14. gerade mit breiter Spitze
15. römische Nase
16. klein und fein
17. lang mit hängender Spitze
18. flach und breit
19. markant, schmale Flügel
20. leicht gebogen
21. kräftig, gerade
22. mit kleiner Narbe
23. schmal mit Höcker
24. breit mit runder Spitze
25. kurz, gerade

### Augen
1. mandelförmig
2. rund, groß
3. tiefliegend
4. schmal, leicht zusammengekniffen
5. weit auseinander
6. eng zusammen
7. hängende Lider
8. Schlupflider
9. leicht schräg nach oben
10. leicht schräg nach unten
11. groß mit dichten Wimpern
12. klein, wach
13. Lachfältchen
14. dunkle Augenringe
15. kantige Augenbrauenpartie
16. monolid (nur ostasien)
17. mandelförmig mit Lidfalte
18. weich, freundlich
19. intensiv, durchdringend
20. müde wirkend
21. tiefliegend mit kräftigen Brauen
22. hell (blau/grau/grün, nur wo zur Gruppe passend)
23. braun, warm
24. dunkelbraun bis fast schwarz
25. haselnuss

### Augenbrauen
1. dicht und gerade
2. dünn, gezupft (2000er-Look)
3. buschig
4. zusammengewachsen
5. hoch gewölbt
6. flach, tief sitzend
7. mit Rasur-Strich (2000er)
8. hell, kaum sichtbar
9. kantig
10. kurz
11. lang auslaufend
12. schräg nach oben
13. schräg nach unten
14. ungleichmäßig
15. sehr dunkel und kräftig
16. mittel, natürlich
17. weich gebogen
18. mit Narbe
19. breit
20. schmal und dunkel
21. buschig in der Mitte
22. hoch angesetzt
23. dicht mit Wirbel
24. kurz und hell
25. dünn und dunkel

### Mund und Kinn
1. schmale Lippen
2. volle Lippen
3. breiter Mund
4. kleiner Mund
5. leichtes Lächeln, geschlossen
6. Lächeln mit Zähnen
7. Zahnlücke
8. leicht schiefer Mund
9. markante Oberlippe
10. herabhängende Mundwinkel
11. Grübchen beim Lächeln
12. kräftiges Kinn
13. fliehendes Kinn
14. Kinngrübchen
15. breites Kinn
16. spitzes Kinn
17. ernster, geschlossener Mund
18. leicht geöffneter Mund
19. volle Unterlippe
20. schmale Oberlippe
21. kantiger Kiefer
22. weicher Kiefer
23. Narbe an der Lippe
24. gerade Zähne, Kronen-Lächeln (2000er)
25. leicht vorstehende Zähne

### Ohren
1. anliegend
2. abstehend
3. groß
4. klein
5. angewachsene Ohrläppchen
6. freie Ohrläppchen
7. leicht spitz
8. „Blumenkohlohr“ (vernarbt)
9. hoch angesetzt
10. tief angesetzt
11. kleiner Ohrstecker links
12. kleiner Ohrstecker rechts
13. Ohrstecker beidseitig
14. asymmetrisch
15. breit
16. schmal
17. rund
18. mit Narbe
19. lange Ohrläppchen
20. kurze Ohrläppchen
21. unter Haaren halb verdeckt
22. ganz verdeckt
23. mittelgroß, unauffällig
24. leicht abstehend oben
25. stark abstehend

### Haut und Gesichtsdetails
1. glatte Haut
2. Sommersprossen
3. leichte Aknenarben
4. gerötete Wangen
5. Muttermal auf der Wange
6. Muttermal am Kinn
7. kleine Narbe über der Augenbraue
8. Narbe an der Wange
9. sonnengebräunt
10. blass
11. ölige Stirn (Spieltag-Look)
12. ebenmäßig, matt
13. leichte Falten auf der Stirn
14. Lachfalten
15. großporig
16. kleine Pickel am Kinn
17. Bartschatten
18. glänzend vor Schweiß
19. gerötete Nase
20. sehr ebenmäßig
21. leichte Augenringe
22. Wangenknochen glänzend
23. rasierter Hals mit Rasurbrand
24. leichte Verfärbung um die Augen
25. eine kleine Brandnarbe am Hals

### Ausdruck
1. neutral, konzentriert
2. leichtes Lächeln
3. breites Lächeln
4. selbstbewusst
5. verschmitzt
6. ernst
7. müde
8. entschlossen
9. schüchtern
10. arrogant
11. freundlich
12. nachdenklich
13. angespannt
14. stolz
15. gelassen
16. kampfbereit
17. leicht genervt
18. fröhlich
19. skeptisch
20. kühl
21. herzlich
22. zufrieden
23. fokussiert
24. trotzig
25. ruhig

## Gruppenblöcke (in „PAKET“ einsetzen, dazu Hautton und Haarfarbe passend wählen)

| Paket | Gruppe | Herkunft (abwechseln) | Hautton / Haar |
|---|---|---|---|
| 01–08 | mitteleuropa | deutsch, österreichisch, schweizerdeutsch, niederländisch, flämisch, wallonisch, französisch, englisch, schottisch, walisisch, irisch, elsässisch | hell bis leicht gebräunt; blond, dunkelblond, braun, rotblond |
| 09–13 | osteuropa | polnisch, tschechisch, slowakisch, ungarisch, russisch, ukrainisch, rumänisch, bulgarisch, baltisch | hell; aschblond, braun, dunkelbraun |
| 14–17 | suedeuropa | italienisch, spanisch, portugiesisch, griechisch, südfranzösisch, maltesisch | oliv bis gebräunt; dunkelbraun, schwarz |
| 18–20 | balkan | serbisch, kroatisch, bosnisch, slowenisch, montenegrinisch, mazedonisch, albanisch | hell bis oliv; dunkelbraun, schwarz, selten blond |
| 21–23 | nordeuropa | dänisch, schwedisch, norwegisch, finnisch, isländisch | sehr hell; hellblond, blond, rotblond, hellbraun |
| 24–26 | westafrika | nigerianisch, ghanaisch, kamerunisch, ivorisch, senegalesisch, malisch; zur Hälfte französisch-/englisch-/niederländisch-/belgisch-/portugiesisch-/deutsch-afrikanisch bzw. -karibisch | hellbraun bis sehr dunkel; schwarz, kraus/lockig |
| 27 | tuerkei | türkisch, deutsch-türkisch, kurdisch | oliv; schwarz, dunkelbraun |
| 28 | lateinamerika | brasilianisch (auch afrobrasilianisch), argentinisch, uruguayisch, kolumbianisch, mexikanisch, chilenisch | sehr hell bis dunkel gemischt; braun, schwarz |
| 29 | nordafrika | marokkanisch, algerisch, tunesisch, ägyptisch; französisch-/niederländisch-/belgisch-maghrebinisch | oliv bis hellbraun; schwarz, lockig |
| 30 | ostasien | japanisch, koreanisch, chinesisch | hell bis leicht gelblich; schwarz, teils gefärbt (braun, blond – 2000er) |

**Hinweis:** Es gibt keine eigene Gruppe für Südasien. Ein englisch-pakistanischer Spieler aus dem 1990er-Paket liegt deshalb vorerst bei `nordafrika`. Soll Südasien eine eigene Gruppe werden, gib Bescheid, dann lege ich sie im Spiel an.

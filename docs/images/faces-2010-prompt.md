# Spielergesichter Epoche 2010 – Prompt und Paketplan

Epoche 2010 = Spieler, die in den 2010ern etwa 25 sind (Jahrgänge 1985–1994). 300 Bilder in 30 Paketen à 10.

## Verteilung (passend zum Spiel)

Gemessen am 24.11.2026 im Spiel an allen Spielern der Jahrgänge 1985–1994 (Vorlage „Test 50 Jahre“, 27 446 Spieler aller Ligen und des Weltpools). Kleine Gruppen haben mindestens 10 Bilder.

| Gruppe | Anteil im Spiel | Bilder | Pakete | Nummern |
|---|---|---|---|---|
| mitteleuropa | 21,0 % | 60 | 01–06 | 001–060 |
| osteuropa | 19,3 % | 50 | 07–11 | 061–110 |
| suedeuropa | 16,4 % | 40 | 12–15 | 111–150 |
| balkan | 11,9 % | 40 | 16–19 | 151–190 |
| westafrika | 11,6 % | 40 | 20–23 | 191–230 |
| nordeuropa | 10,9 % | 30 | 24–26 | 231–260 |
| tuerkei | 3,2 % | 10 | 27 | 261–270 |
| nordafrika | 2,7 % | 10 | 28 | 271–280 |
| lateinamerika | 2,2 % | 10 | 29 | 281–290 |
| ostasien | 0,7 % | 10 | 30 | 291–300 |

**Gemischte Herkunft:** Einordnen nach dem Aussehen, nicht nach dem Pass (wie bei den 2000ern). Die Herkunft darf als Zusatz im Dateinamen stehen.

**Westafrika-Pakete 20–23:** etwa die Hälfte europäische Spieler mit afrikanischen oder karibischen Wurzeln (französisch, englisch, niederländisch, belgisch, portugiesisch, deutsch, schweizerisch), die andere Hälfte Spieler aus Nigeria, Ghana, Kamerun, der Elfenbeinküste, dem Senegal und Mali.

## Dateien

- Name: `2010_<nr>_<gruppe>[_<herkunft>].png`, z. B. `2010_195_westafrika_belgisch-kongolesisch.png`.
- Format: PNG mit transparentem Hintergrund, 1024 × 1200 px.
- Nur Kopf und Hals, ohne Trikot und ohne Schultern; unterhalb des Halses durchsichtig.
- Je Paket eine ZIP-Datei `faces_2010_batch_<NN>_<gruppe>.zip` mit genau 10 Bildern.

## Prompt (für jedes Paket; nur den Block „PAKET“ anpassen)

```
Create 10 separate photorealistic portrait images of fictional professional male football players from the 2010s (born 1985–1994, age about 25). They must NOT resemble any real person.

TECHNICAL (identical for all 10):
- One person per image, 1024 x 1200 px, PNG with fully transparent background (no backdrop, no shadow, no white).
- ONLY the head and the neck – NO shirt, NO collar, NO clothing, NO shoulders. The neck ends in a soft, slightly curved cut just below the Adam's apple, like a cut-out portrait sticker; everything below the cut is transparent.
- Framing: top of the hair about 50 px below the top edge, bottom of the neck cut at about 89 % of the image height (about 1070 px), head centred, the head (incl. hair) about 75–80 % of the image width. Leave transparent space left and right of the head – do NOT fill the frame.
- Frontal to slightly angled (max 15°), eyes looking into the camera, neutral to slightly friendly expression.
- Soft, even studio light from the front, no hard shadows, no coloured light.
- Natural skin texture, typical 2010s HD team-photo look (very sharp, clean, natural colours, slightly cool).
- No jewellery except at most small earring studs, no headbands, no hats, no glasses, no text, no watermark. A small neck tattoo is allowed only if the chosen skin detail asks for it.

PAKET:
- Group: <GRUPPE> – <HERKUNFT-LISTE>
- Skin tone and hair colour: <HAUTTON / HAAR>
- Numbers: <NR-VON> to <NR-BIS>, file names 2010_<nr>_<gruppe>_<herkunft>.png

VARIATION: Every image must differ clearly. For each image pick ONE option from every list below, never repeat the same combination of hairstyle + facial hair + face shape within the package, and spread the choices across the whole list. Hairstyles marked (afro-textured) only for people with afro-textured hair; hairstyles marked (straight/wavy) only for people with straight or wavy hair.
```

Unter den Prompt die Merkmal-Listen hängen (in ChatGPT reicht es, die Listen einmal mitzuschicken und für jedes weitere Paket nur „PAKET“ zu ändern).

### Frisur (2010er)
1. Undercut, oben lang nach hinten gegelt (straight/wavy)
2. Undercut, oben lang zur Seite gekämmt (straight/wavy)
3. Pompadour mit Volumen, Seiten kurz
4. Quiff, nach oben und hinten geföhnt
5. Fade (Seiten auf null verlaufend), oben kurz strukturiert
6. Skin Fade mit hartem Seitenscheitel (rasierte Linie)
7. Low Fade mit Crop-Pony („French Crop“)
8. Man Bun, Seiten rasiert (straight/wavy)
9. Man Bun mit längeren Seiten (straight/wavy)
10. Top Knot, kleiner Dutt am Hinterkopf, Seiten Fade
11. schulterlang, offen, Mittelscheitel (straight/wavy)
12. halblang, hinter die Ohren gestrichen (straight/wavy)
13. Messy Textured Crop, Wachs
14. Buzzcut 3 mm
15. ganz kahl rasiert, glänzend
16. kurzer Igel mit Fade
17. Slick Back, glänzend, eng anliegend (straight/wavy)
18. Comb-Over mit Fade
19. Mittelscheitel kurz, 2010er-Curtains
20. kurze Locken oben, Seiten Fade
21. lange Locken oben, Seiten Fade („Curly Top“)
22. Afro mittellang, rund (afro-textured)
23. High-Top-Fade (afro-textured)
24. kurze Twists oben, Seiten Fade (afro-textured)
25. Freeform-Dreadlocks kinnlang (afro-textured)
26. Dreadlocks zum Zopf gebunden (afro-textured)
27. Cornrows nach hinten (afro-textured)
28. Waves mit sehr kurzem Schnitt (afro-textured)
29. Buzzcut mit eingeschnittenem Linienmuster an der Seite
30. Mohawk-Streifen, schmal, Seiten kahl
31. Faux-Hawk, kurz, nach oben gezogen
32. Blondierter Kurzhaarschnitt („Platinblond“)
33. Blondierte Spitzen auf dunklem Haar
34. gefärbte Seitenpartie (z. B. blonder Streifen)
35. Bowl Cut modern mit Fade
36. Ivy League, kurz, Seitenscheitel
37. lange Haare zum Zopf gebunden (straight/wavy)
38. Pony nach vorn, Seiten kurz („Fringe“)
39. Spiky Crew Cut, leicht gegelt
40. Wet Look, Strähnen nach hinten (straight/wavy)
41. kurz mit Geheimratsecken, ordentlich
42. Glatze mit Haarkranz, kurz geschoren
43. Seitenscheitel lang über die Stirn (straight/wavy)
44. Locken mittellang, natürlich, ungestylt
45. Crew Cut, klassisch
46. Disconnected Undercut mit Haarknoten
47. kurz mit hoher Stirn und leichtem Wirbel
48. Kurzhaar mit tiefem Haaransatz, gerade Kante
49. gewellt halblang, hinter die Ohren, leicht verwuschelt (straight/wavy)
50. Buzzcut mit sichtbarer Narbe im Haar

### Bart
1. glatt rasiert
2. Drei-Tage-Bart
3. dichter Vollbart, gestutzt (Hipster-Bart)
4. langer Vollbart, gepflegt
5. kurzer Vollbart mit hart rasierten Konturen
6. Vollbart mit Fade an den Wangen
7. Kinnbart (Goatee)
8. Kinnbart mit Schnurrbart verbunden (Circle Beard)
9. schmaler Kinnstreifen
10. Ankerbart
11. Linienbart entlang des Kiefers
12. Schnurrbart dünn, Rest rasiert
13. Schnurrbart dicht mit Drei-Tage-Bart
14. Koteletten bis Kieferwinkel
15. Bartstoppeln, frisch nachgewachsen
16. lückenhafter Jugendbart
17. Wangenbart ohne Kinnbart
18. Bart nur am Kinn und unter der Lippe
19. Spitzbart lang, Wangen rasiert
20. Bartschatten, frisch rasiert
21. Vollbart kurz, dicht, dunkel
22. Vollbart rötlich (bei passender Haarfarbe)
23. Vollbart mit grauen Einzelhaaren
24. Henriquatre
25. Van-Dyke-Bart
26. Schnurrbart mit Kinnstreifen
27. Drei-Tage-Bart nur am Kinn dichter
28. kurzer Bart mit rasierter Linie im Bart
29. glatt rasiert mit kleiner Narbe an der Oberlippe
30. glatt rasiert, Grübchen im Kinn
31. Koteletten kurz, Rest glatt
32. Kinnbart breit, Wangen Drei-Tage
33. Bart zum Kiefer abgestuft (Fade-Beard)
34. Vollbart mittellang, leicht unordentlich
35. Ringbart dünn
36. Schnurrbart „Hufeisen“ kurz
37. Wangenflaum, kaum Bartwuchs
38. kurzer dichter Bart mit scharf gezogener Wangenlinie
39. Bart nur entlang der Kieferkante und Kinn
40. Bart dicht am Hals, oben kurz
41. Drei-Tage-Bart ungleichmäßig
42. Kinnbart kurz, Schnurrbart dünn getrennt
43. Vollbart sehr kurz, fast Stoppel
44. Vollbart breit und kastig
45. Schnurrbart mit langem Drei-Tage-Bart
46. glatt rasiert, leichter Rasurausschlag am Hals
47. Kinnbart geflochten-frei, spitz zulaufend
48. Bart mit hellerer Kinnpartie (natürlich zweifarbig)
49. Wangenbart mit Koteletten verbunden, Kinn rasiert
50. Drei-Tage-Bart mit sauber rasiertem Hals

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
18. hohe Stirn, schmale Wangen
19. niedrige Stirn, breite Wangen
20. dreieckig, breiter Kiefer
21. birnenförmig, kräftige Kieferpartie
22. sehr schmal, länglich
23. kurz und breit
24. markante Jochbeine, schmaler Kiefer
25. rundlich mit Doppelkinn-Ansatz
26. eckig, flache Wangen
27. oval mit fliehendem Kinn
28. oval mit vorstehendem Kinn
29. kantig, tiefliegende Augenpartie
30. breit mit flachem Gesichtsprofil
31. schmal mit großer Stirn
32. kompakt, kräftiger Nacken
33. markant, starke Brauenwülste
34. weich, babyface
35. lang mit hohen Wangenknochen
36. quadratisch, stämmig
37. herzförmig mit Grübchen
38. oval, sehr symmetrisch
39. rund mit spitzem Kinn
40. breiter Unterkiefer, schmale Stirn
41. schmal mit kantigem Kinn
42. hohe Wangen, eingefallene Schläfen
43. kurzes Kinn, breiter Hals
44. leicht längliches Gesicht, weiche Kieferlinie
45. robust, große Gesichtszüge
46. fein, kleine Gesichtszüge
47. breites Gesicht, schmale Augenpartie
48. kantig mit kurzer Mittelpartie
49. lang mit kurzer Nasen-Mund-Partie
50. oval mit breiter Kieferkante

### Nase
1. gerade, mittelgroß
2. schmal und lang
3. breit und flach
4. Hakennase
5. Stupsnase
6. Höckernase
7. gebrochen wirkend, leicht schief
8. breiter Nasenrücken
9. schmaler Nasenrücken, breite Flügel
10. kurz und rund
11. lang mit hängender Spitze
12. römische Nase
13. kleine, feine Nase
14. kräftige, fleischige Nase
15. leicht nach oben gebogen
16. gerade mit breiter Spitze
17. markante Adlernase
18. platte Boxernase
19. schmal mit spitzer Spitze
20. weite Nasenlöcher
21. schmale Nasenlöcher
22. gerade, leicht nach rechts geneigt
23. tiefe Nasenwurzel
24. hohe Nasenwurzel
25. Knollennase
26. kurze breite Nase
27. lange gerade Nase
28. sanft gewölbter Rücken
29. kantige Nasenspitze
30. runde Nasenspitze
31. Nase mit kleinem Höcker
32. leicht gespaltene Nasenspitze
33. breit, kurzer Rücken
34. schmal und hoch
35. Nase mit kleiner Narbe am Rücken
36. groß und gerade
37. klein und flach
38. leicht asymmetrische Flügel
39. markant, griechisches Profil
40. schmal, leicht gebogen
41. breite Flügel, gerader Rücken
42. Spitze nach unten zeigend
43. Spitze nach oben zeigend
44. lang und schmal mit Höcker
45. kompakt, mittelbreit
46. gerade mit tiefen Nasolabialfalten
47. flacher Rücken, breite Spitze
48. hohe, schmale Nase
49. kräftig, gerade, breite Basis
50. fein geschnitten, kurze Spitze

### Augen
1. mandelförmig
2. rund
3. schmal
4. tiefliegend
5. hervorstehend
6. weit auseinander
7. eng zusammen
8. Schlupflider
9. leicht hängende Außenwinkel
10. leicht steigende Außenwinkel
11. große Augen
12. kleine Augen
13. schwere Oberlider
14. leichte Augenringe
15. deutliche Tränensäcke
16. Lachfältchen
17. stechender Blick
18. müder Blick
19. wacher, offener Blick
20. Monolid
21. tiefliegend mit kräftigen Brauenknochen
22. leicht asymmetrisch
23. hellblau
24. graublau
25. grün
26. haselnussbraun
27. hellbraun
28. dunkelbraun
29. fast schwarz
30. grau
31. bernsteinfarben
32. blau mit dunklem Rand
33. kurze Wimpern
34. lange dichte Wimpern
35. halb geschlossen, entspannt
36. leicht zusammengekniffen
37. ernster, fokussierter Blick
38. freundlicher Blick
39. runde Augen mit hohem Lid
40. schmale, tiefe Augen
41. Augen leicht schräg
42. weit geöffnet
43. Augenwinkel mit feinen Fältchen
44. dunkle Schatten unter den Augen
45. helle Iris mit dunklem Ring
46. braun mit grünlichem Schimmer
47. eng stehend, intensiver Blick
48. weit stehend, sanfter Blick
49. leicht verschiedenfarbige Iris (subtil)
50. mandelförmig, leicht schläfriger Blick

### Augenbrauen
1. gerade, dicht
2. gerade, dünn
3. gewölbt, mittel
4. stark gewölbt
5. buschig
6. sehr buschig, fast zusammengewachsen
7. zusammengewachsen (Monobraue angedeutet)
8. hoch angesetzt
9. tief angesetzt
10. kurz
11. lang, bis zur Schläfe
12. dünn gezupft (2010er-Look)
13. mit rasiertem Schlitz (Eyebrow Slit)
14. mit zwei rasierten Schlitzen
15. kantig, Winkel in der Mitte
16. weich gebogen
17. hell, kaum sichtbar
18. dunkel, kontrastreich
19. rötlich
20. leicht asymmetrisch
21. innen hoch, außen flach
22. innen tief, außen hoch
23. mit Narbe durch die Braue
24. dicht innen, dünn außen
25. gleichmäßig breit
26. schräg nach unten
27. schräg nach oben
28. gepflegt, sauber konturiert
29. ungepflegt, struppig
30. weit auseinander
31. eng zusammen
32. kräftige Brauenknochen darunter
33. flach, waagerecht
34. leicht hängend außen
35. kurz und kräftig
36. fein, gebogen
37. dunkel, gerade, breit
38. blond, buschig
39. dunkelbraun, mittel
40. schwarz, dicht
41. leicht zusammengezogen (konzentriert)
42. leicht angehoben (offen)
43. eine Braue minimal höher
44. Brauen mit Wirbel am Anfang
45. lichte Brauen mit kleinen Lücken
46. dicke Brauen, gezupfte Mitte
47. sanft geschwungen, natürlich
48. kantig, sportlich
49. kurz, nach oben gebürstet
50. breit, waagerecht, kräftig

### Mund und Kinn
1. volle Lippen
2. schmale Lippen
3. breiter Mund
4. kleiner Mund
5. ausgeprägter Amorbogen
6. Oberlippe schmal, Unterlippe voll
7. Mundwinkel leicht nach unten
8. Mundwinkel leicht nach oben
9. leichtes Lächeln, geschlossen
10. leichtes Lächeln, Zähne sichtbar
11. Grübchen im Kinn
12. Kinngrübchen tief (Cleft)
13. vorstehendes Kinn
14. fliehendes Kinn
15. breites Kinn
16. spitzes Kinn
17. kräftige Kieferwinkel
18. weiche Kieferlinie
19. Doppelkinn-Ansatz
20. markante Nasolabialfalten
21. kleine Narbe an der Lippe
22. Lippen leicht geöffnet
23. asymmetrisches Lächeln
24. ernster Mund, gerade Linie
25. breite Unterlippe
26. dünne Oberlippe mit Schnurrbartschatten
27. Zahnlücke vorn (sichtbar beim Lächeln)
28. leicht schiefe Zähne
29. sehr gerade, helle Zähne
30. Lippen dunkler pigmentiert
31. Kinn mit kleiner Narbe
32. kurzes Kinn
33. langes Kinn
34. kantiges, eckiges Kinn
35. rundes Kinn
36. Grübchen in den Wangen beim Lächeln
37. Mund leicht schief
38. Lippen trocken, leicht rissig
39. kräftige Kaumuskeln
40. schmale Kieferpartie
41. Kinn leicht nach vorn geschoben
42. Unterbiss angedeutet
43. Überbiss angedeutet
44. volle Unterlippe, gerader Mund
45. breites, freundliches Lächeln
46. zurückhaltendes Halblächeln
47. ausgeprägte Mundwinkel-Grübchen
48. Lippenkontur scharf
49. weiche, runde Lippen
50. markanter Kiefer mit Bartschatten

### Ohren
1. anliegend, mittelgroß
2. abstehend
3. leicht abstehend
4. groß
5. klein
6. Ohrläppchen angewachsen
7. Ohrläppchen frei, groß
8. spitz zulaufend oben
9. rund
10. Blumenkohlohr angedeutet (Ringer-Look, subtil)
11. ein Ohr leicht höher
12. tief angesetzt
13. hoch angesetzt
14. schmal und lang
15. breit
16. mit kleinem Ohrstecker links
17. mit kleinem Ohrstecker rechts
18. mit zwei kleinen Ohrsteckern
19. mit kleinem dunklen Ohrstecker
20. Ohrläppchen mit kleiner Narbe
21. vom Haar halb verdeckt
22. vom Haar ganz verdeckt
23. deutlich sichtbar durch Fade
24. kräftige Ohrmuschel
25. feine Ohrmuschel
26. flache Ohrmuschel
27. leicht gerötet
28. große Ohrläppchen
29. kleine Ohrläppchen
30. nach vorn geneigt
31. eng am Kopf, kaum sichtbar
32. leicht asymmetrisch
33. mit glänzendem Diamant-Stecker (klein)
34. mit kleinem Ring-Piercing (eng anliegend)
35. Tragus deutlich
36. Helix stark gerollt
37. Helix flach
38. oberer Rand eckig
39. oben breit, unten schmal
40. mittelgroß, schräg gestellt
41. dicht am Kopf, rund
42. auffällig groß, anliegend
43. klein, abstehend
44. leicht spitz, anliegend
45. sichtbar unter kurzem Haar, schlicht
46. teilweise unter Locken
47. mit kleinem Muttermal am Ohrläppchen
48. rund, Ohrläppchen angewachsen
49. lang, Ohrläppchen frei
50. schlicht, unauffällig

### Haut und Gesichtsdetails
1. glatte, reine Haut
2. leichte Sommersprossen
3. viele Sommersprossen
4. einzelnes Muttermal an der Wange
5. Muttermal über der Lippe
6. leichte Aknenarben
7. kleine Narbe an der Augenbraue
8. kleine Narbe an der Stirn
9. kleine Narbe am Kinn
10. leicht gerötete Wangen
11. sonnengebräunt
12. blass
13. ölige T-Zone
14. sehr matte Haut
15. sichtbare Poren
16. feine Stirnfalten
17. Lachfalten
18. leichte Rötung um die Nase
19. Bartschatten bis zum Hals
20. kleines Tattoo seitlich am Hals (Schrift ohne lesbare Buchstaben)
21. kleines Stern-Tattoo hinter dem Ohr
22. Tattoo-Ansatz am Hals, unten abgeschnitten
23. kleines Kreuz-Tattoo am Hals
24. kleines Linien-Tattoo am Hals (abstrakt)
25. Hautunreinheiten am Kinn
26. Pigmentflecken an der Stirn
27. Grübchen in den Wangen
28. hohe Wangenknochen glänzend
29. leicht unruhige Haut nach dem Rasieren
30. Narbe durch die Oberlippe
31. kleine Schürfung an der Stirn (frisch, subtil)
32. dunkle Augenringe
33. ebenmäßiger Teint, gepflegt
34. leicht wettergegerbt
35. Sonnenbrand-Ansatz auf der Nase
36. Stirn mit Schweißglanz (nach Training, subtil)
37. Muttermal am Hals
38. mehrere kleine Muttermale
39. gleichmäßige Bräune
40. Narbe am Kieferwinkel
41. leichte Vitiligo-Flecken (klein, an Schläfe oder Kinn)
42. Haut mit leichtem Rosaton
43. Haut mit warmem Olivton
44. gepflegte Haut, leicht glänzend
45. markante Adern an der Schläfe
46. Adamsapfel deutlich
47. Halsmuskulatur kräftig
48. schlanker Hals
49. breiter, kurzer Hals
50. keine Besonderheiten

### Ausdruck
1. neutral
2. leicht lächelnd
3. selbstbewusst
4. ernst
5. konzentriert
6. entspannt
7. freundlich
8. stolz
9. zurückhaltend
10. verschmitzt
11. müde
12. kühl
13. offen
14. skeptisch
15. entschlossen
16. gelassen
17. nachdenklich
18. jungenhaft
19. streng
20. warmherzig
21. leicht angespannt
22. ruhig
23. wach
24. leicht schüchtern
25. souverän
26. ehrgeizig
27. sanft
28. distanziert
29. zufrieden
30. fokussiert
31. selbstsicheres Halblächeln
32. unbeeindruckt
33. herausfordernd
34. höflich
35. ausgeglichen
36. kämpferisch
37. sympathisch
38. kritisch
39. erwartungsvoll
40. lässig
41. bescheiden
42. energisch
43. leicht amüsiert
44. aufmerksam
45. reserviert
46. optimistisch
47. respektvoll
48. kühl professionell
49. fröhlich
50. ruhig entschlossen

## Gruppenblöcke (in „PAKET“ einsetzen)

| Paket | Gruppe | Herkunft (abwechseln) | Hautton / Haar |
|---|---|---|---|
| 01–06 | mitteleuropa | deutsch, österreichisch, schweizerdeutsch, niederländisch, flämisch, wallonisch, französisch, englisch, schottisch, walisisch, irisch, luxemburgisch | hell bis leicht gebräunt; blond, dunkelblond, braun, rotblond, schwarz |
| 07–11 | osteuropa | polnisch, tschechisch, slowakisch, ungarisch, russisch, ukrainisch, belarussisch, rumänisch, bulgarisch, baltisch, georgisch | hell; aschblond, braun, dunkelbraun, schwarz |
| 12–15 | suedeuropa | italienisch, spanisch, portugiesisch, griechisch, südfranzösisch, maltesisch, zypriotisch | oliv bis gebräunt; dunkelbraun, schwarz |
| 16–19 | balkan | serbisch, kroatisch, bosnisch, slowenisch, montenegrinisch, nordmazedonisch, albanisch, kosovarisch | hell bis oliv; dunkelbraun, schwarz, selten blond |
| 20–23 | westafrika | nigerianisch, ghanaisch, kamerunisch, ivorisch, senegalesisch, malisch, kongolesisch; zur Hälfte französisch-/englisch-/niederländisch-/belgisch-/portugiesisch-/deutsch-/schweizerisch-afrikanisch bzw. -karibisch | hellbraun bis sehr dunkel; schwarz, kraus/lockig |
| 24–26 | nordeuropa | dänisch, schwedisch, norwegisch, finnisch, isländisch | sehr hell; hellblond, blond, rotblond, hellbraun |
| 27 | tuerkei | türkisch, deutsch-türkisch, kurdisch, aserbaidschanisch | oliv; schwarz, dunkelbraun |
| 28 | nordafrika | marokkanisch, algerisch, tunesisch, ägyptisch; französisch-/niederländisch-/belgisch-maghrebinisch | oliv bis hellbraun; schwarz, lockig |
| 29 | lateinamerika | brasilianisch (auch afrobrasilianisch), argentinisch, uruguayisch, kolumbianisch, chilenisch, venezolanisch | sehr hell bis dunkel gemischt; braun, schwarz |
| 30 | ostasien | japanisch, koreanisch, chinesisch | hell bis leicht gelblich; schwarz, teils gefärbt (braun, blond, platin – 2010er) |

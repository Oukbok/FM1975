# Andere Kontinente, Kontinentalpokale, Weltpokal & Klub-WM

Grundlage für `src/data/world/continents/` (Vereine, Stärke, Formate) und
`src/game/continents.ts` / `src/game/intercontinental.ts`. Im Spiel stehen nur die
verfremdeten Namen (Stadt + Farbe); die echten Vorbilder stehen ausschließlich hier.

## Leitidee (Frage Pascal: „effektiv, ohne dass man dort spielen kann“)

- Keine Ligen, keine Spieltage, keine Kader außerhalb Europas. Je Land 4–12 Spitzenvereine
  als Stammdaten (nicht im Spielstand), Stärke je Epoche als Stützwerte 1975/1990/2005/2025
  (dazwischen linear, einzelne Blütezeiten als Zusatzpunkte).
- Saisonergebnis je Land = gewichtete Ziehung (Stärke + Saisonform ±2 fest aus Verein/Jahr +
  Normalrauschen σ 2,6). Gespeichert werden nur die ersten vier als Index-Zeichenkette;
  nach 20 Jahren nur noch der Meister.
- Kontinentalpokal = K.-o.-Baum (8/16 Teams, Hin/Rück als Gesamtergebnis, Freilose für die
  Stärksten), Baumdetails für die letzten 12 Jahre, danach Sieger/Finale.
- Historische Lenkung: der echte Sieger des Jahres ist im Feld und bekommt +4 (Historisch) bzw.
  +7 (Streng) Stärke; Option „Frei“ = keine Lenkung.
- Weltpokal/Klub-WM: ohne deinen Verein sofort schlank ausgespielt (Archiv), mit deinem Verein
  über den Supercup-Weg (Kalender, Vorschau, Textmodus, Spielbericht).
- Gegnerkader erst für dein Spiel (wie Europapokal-Phantomkader, Herkunft des Landes für
  Namen/Gesichter, neue Herkünfte in `data/origins.ts`), beim Saisonwechsel gelöscht.

## Weltspieler anderer Kontinente als Talentquelle – bewusst weggelassen

Ein Weltpool für die ~130 Kontinentalvereine (22 + 3 Spieler je Verein, Tupel wie
`game/worldPool.ts`) wären ≈ 3 300 zusätzliche Spieler – grob 250–350 KB roh je Spielstand
und Entwicklung/Transfers jede Saison. Das sprengt das Ziel „< +3 % Speicher“ und braucht
Ausländerregeln für Nicht-Europäer im Transfermarkt. Vorschlag für später: nur je Land die
besten 3–5 Talente (U21) als Einträge im bestehenden Weltpool, Wechsel nur nach Europa, Sperre
für Nicht-EU-Ausländer nach `data/registrationRules.ts`.

## Messung (npm run test:continents)

- Rechenzeit Hintergrund je Saison: Ø ≈ 3–6 ms (Meister + 5 Kontinentalpokale + Weltpokal/Klub-WM).
- Speicher: 40 Jahre Historie auf der Vorlage „Test 40 Jahre“ komprimiert +0,4 % (Ziel < 3 %);
  roh nach 59 Saisons ≈ 48 KB Kontinente + ≈ 18–30 KB Weltpokal-Archiv.

## Formate (Vorbilder)

| Spiel | Vorbild | Zeit | Format im Spiel |
|---|---|---|---|
| Weltpokal | Intercontinental Cup (Europapokal-/CL-Sieger gegen Copa-Libertadores-Sieger) | 1960–2004 | 1960–1979 Hin/Rück (Nov./Dez.), 1970er Absagen: KI-Meister verzichtet mit 35 %, Finalist springt ein oder Ausfall (echt 1975/1978 ausgefallen); 1980–2004 ein Spiel in Tokio (Dezember) |
| Klub-WM 2000 | FIFA Club World Championship, Brasilien, 5.–14.1.2000 | Saison 1999/2000 | 8 Teams, Gruppen A/B, Gruppensieger im Finale, Zweite um Platz 3; Europa = Sieger 1998/99 + 1997/98, Gastgeber = Meister Brasiliens |
| Klub-WM | FIFA Club World Cup, Japan/VAE/Marokko/Katar/Saudi-Arabien | 2005–2023 | 2005/06 sechs Kontinentalsieger, ab 2007 + Meister des Gastlandes (Play-off gegen Ozeanien); Europa/Südamerika im Halbfinale; Spiele 2020–2022 im Folgejahr → im Spiel immer Dezember |
| Interkontinentalpokal | FIFA Intercontinental Cup | ab 2024 | Erste Runde Asien–Ozeanien, Afrika-Asien-Pazifik-Pokal, Derby der Amerikas, Herausforderer-Spiel, Finale mit Europas Meister (Dezember) |
| Große Klub-WM | FIFA Club World Cup 2025, USA, 14.6.–13.7.2025 | 2025, dann alle 4 Jahre | 32 Teams: 12 Europa (Sieger der letzten 4 Spielzeiten + Beste, max. 2 je Land), 6 Südamerika, je 4 Afrika/Asien/Nord-Mittelamerika, 1 Ozeanien, Gastgeber; 8 Gruppen, Achtelfinale–Finale; im Spiel Juli VOR dem Ligastart der Saison 2025/26 (nicht über den Saisonwechsel) |

Quellen: Wikipedia (de/en) „Weltpokal (Fußball)“ / „Intercontinental Cup (football)“,
„FIFA-Klub-Weltmeisterschaft“ je Ausgabe (2000, 2005–2023), „FIFA Club World Cup 2025“,
„FIFA Intercontinental Cup 2024/2025“; Gastgeberliste und Teilnehmer je Ausgabe dort.

Prämien (1975-Basis × `economyScale`, Anzeige in DM/€): grob nach FIFA-Angaben – Klub-WM 2000
≈ 2,5 Mio. $ Antritt / 6 Mio. $ Sieger; 2005–2023 Sieger ≈ 4–5 Mio. $; 2025 Europas Teilnehmer
12–36 Mio. € Antritt, Sieger zusammen > 100 Mio. €.

## Kontinentalpokale

| Kontinent | Vorbild | im Spiel |
|---|---|---|
| Südamerika | Copa Libertadores (ab 1960) | „Südamerika-Pokal der Landesmeister“, 16 Teams Hin/Rück, Finale Hin/Rück bis 2018, ab 2019 ein Spiel |
| Afrika | African Cup of Champions Clubs (1964–1996), CAF Champions League (ab 1997) | „Afrika-Pokal der Landesmeister“ 8 Teams / „Afrikanische Meisterliga“ 16 Teams |
| Asien | Asian Champion Club Tournament 1967–1971, Asian Club Championship 1985/86–2001/02, AFC Champions League ab 2002/03 | 1972–1985 kein Wettbewerb; 8 bzw. 16 Teams, Jahr = Endjahr der Ausgabe |
| Nord-/Mittelamerika | CONCACAF Champions' Cup (ab 1962), Champions League 2008–2023, Champions Cup ab 2024 | „Pokal der Landesmeister Nord- und Mittelamerikas“, 8 Teams; 2001 ausgefallen |
| Ozeanien | Oceania Club Championship 1987, 1999, 2001, ab 2005 jährlich (OFC Champions League ab 2007; 2020/21 ausgefallen) | „Ozeanien-Meisterliga“, 4 Teams; Australien bis 2005 Ozeanien, ab 2006 Asien |

Historische Sieger (Lenkung + Siegerliste vor dem Start) in `data/world/continents/index.ts`
nach den Siegerlisten der Wikipedia-Artikel; nur Vereine aus diesen Daten (z. B. Afrika 1975/77
Hafia Conakry fehlt → keine Lenkung).

## Stärke-Maßstab

Hintergrund-Welt: Europas Spitze ≈ 79 (1975–1995), 82 (2005), 83 (2025). Abgeleitet aus dem
Weltpokal (1980–2004 gewann Südamerika 15 von 25 Endspielen in Tokio) und der Klub-WM (2005–2024
nur 4 Titel für Südamerika – 2005, 2006, 2012 –, sonst Europa; Finalisten aus Afrika/Asien selten):
- Südamerika: Spitze ≈ 79–81 bis 1995, ≈ 75 um 2005, ≈ 75–77 heute.
- Mexiko: ≈ 70–73 (1975–2005), ≈ 73–74 heute; USA (MLS ab 1996, NASL bis 1984) ≈ 66–71.
- Afrika (Ägypten, Marokko, Tunesien, Südafrika …): ≈ 66–70, heute ≈ 70–73.
- Asien: ≈ 60–66 bis 1990, ≈ 70 um 2005, Saudi-Arabien heute ≈ 72–74 (großer Ausbau nach 2022).
- Ozeanien: ≈ 56–63.
Langlauf-Prüfung (Europas Sieger wechselnd aus den Top 6): Europa gewinnt 1980–2004 ≈ 60 %,
2005–2023 ≈ 65–70 %, ab 2024 ≈ 80 %.

## Vereine (Spielname → Vorbild)

**Brasilien:** Rio Rot-Schwarz → Flamengo · Rio Grün-Weinrot → Fluminense · Rio Schwarz-Weiß → Vasco da Gama ·
Rio Stern → Botafogo · São Paulo Rot-Weiß → São Paulo FC · São Paulo Schwarz-Weiß → Corinthians ·
São Paulo Grün → Palmeiras · Santos → Santos FC · Porto Alegre Blau → Grêmio · Porto Alegre Rot → Internacional ·
Belo Horizonte Blau → Cruzeiro · Belo Horizonte Schwarz-Weiß → Atlético Mineiro
**Argentinien:** Buenos Aires Rot-Weiß → River Plate · Buenos Aires Blau-Gelb → Boca Juniors · Avellaneda Rot → Independiente ·
Avellaneda Himmelblau → Racing · Buenos Aires Blau-Rot → San Lorenzo · Buenos Aires Weiß-Blau → Vélez Sarsfield ·
La Plata Rot-Weiß → Estudiantes · Buenos Aires Rot → Argentinos Juniors
**Uruguay:** Montevideo Gelb-Schwarz → Peñarol · Montevideo Weiß → Nacional · Montevideo Violett → Defensor · Montevideo Weiß-Schwarz → Danubio
**Kolumbien:** Medellín Grün → Atlético Nacional · Bogotá Blau → Millonarios · Cali Rot → América de Cali · Manizales Weiß → Once Caldas · Barranquilla Rot-Weiß → Junior
**Chile:** Santiago Weiß-Schwarz → Colo-Colo · Santiago Blau → Universidad de Chile · Santiago Weiß-Blau → Universidad Católica · Calama Orange → Cobreloa
**Paraguay:** Asunción Weiß → Olimpia · Asunción Blau-Rot → Cerro Porteño · Asunción Schwarz-Weiß → Libertad · Asunción Gelb-Schwarz → Guaraní
**Ecuador:** Quito Weiß → LDU Quito · Guayaquil Gelb → Barcelona SC · Guayaquil Blau → Emelec · Sangolquí Schwarz-Blau → Independiente del Valle
**Peru:** Lima Creme → Universitario · Lima Blau-Weiß → Alianza Lima · Lima Himmelblau → Sporting Cristal · Cusco Rot → Cienciano
**Mexiko:** Mexiko-Stadt Gelb → Club América · Mexiko-Stadt Blau → Cruz Azul · Guadalajara Rot-Weiß → Guadalajara (Chivas) · Pachuca Blau-Weiß → Pachuca ·
Monterrey Blau → CF Monterrey · Monterrey Gelb → Tigres UANL · León Grün → Club León · Mexiko-Stadt Gold-Blau → Pumas UNAM
**USA:** New York Grün → New York Cosmos (1975–1984) · Tampa Orange → Tampa Bay Rowdies · Seattle Grün → Seattle Sounders (NASL bis 1983, MLS ab 2009) ·
Los Angeles Weiß-Gold → LA Galaxy · Washington Schwarz-Rot → D.C. United · Columbus Gelb → Columbus Crew · Miami Rosa → Inter Miami
**Costa Rica:** San José Violett → Saprissa · Alajuela Rot-Schwarz → Alajuelense · Heredia Rot-Gelb → Herediano · Cartago Blau → Cartaginés
**Ägypten:** Kairo Rot → Al Ahly · Kairo Weiß → Zamalek · Ismailia Gelb → Ismaily · Kairo Blau → Pyramids FC (ab 2018)
**Marokko:** Casablanca Grün → Raja · Casablanca Rot → Wydad · Rabat Schwarz-Rot → FAR Rabat · Berkane Orange → RS Berkane
**Tunesien:** Tunis Rot-Gelb → Espérance · Sousse Rot-Weiß → Étoile du Sahel · Tunis Weiß-Rot → Club Africain · Sfax Schwarz-Weiß → CS Sfaxien
**Algerien:** Sétif Schwarz-Weiß → ES Sétif · Tizi Ouzou Gelb-Grün → JS Kabylie · Algier Rot-Grün → MC Alger · Oran Rot-Weiß → MC Oran
**Nigeria:** Aba Blau → Enyimba · Enugu Grün → Enugu Rangers · Ibadan Blau-Weiß → Shooting Stars · Kano Blau → Kano Pillars
**Ghana:** Kumasi Rot → Asante Kotoko · Accra Regenbogen → Hearts of Oak · Obuasi Gelb-Schwarz → Ashanti Gold · Tamale Gelb → Real Tamale United
**Kamerun:** Yaoundé Rot-Grün → Canon Yaoundé · Yaoundé Weiß-Blau → Tonnerre · Douala Gelb → Union Douala · Garoua Grün-Weiß → Coton Sport
**Südafrika:** Johannesburg Gold-Schwarz → Kaizer Chiefs · Johannesburg Schwarz-Weiß → Orlando Pirates · Pretoria Gelb-Blau → Mamelodi Sundowns · Pretoria Blau → SuperSport United
**DR Kongo:** Lubumbashi Schwarz-Weiß → TP Mazembe · Kinshasa Grün-Schwarz → AS Vita Club · Kinshasa Grün-Weiß → DC Motema Pembe · Lubumbashi Blau → Lupopo
**Elfenbeinküste:** Abidjan Gelb-Schwarz → ASEC Mimosas · Abidjan Rot-Grün → Africa Sports · Abidjan Rot-Weiß → Stella Club · Abidjan Himmelblau → Stade d'Abidjan
**Japan:** Saitama Rot → Urawa Reds · Kashima Dunkelrot → Kashima Antlers · Osaka Blau-Schwarz → Gamba Osaka · Yokohama Blau → Yokohama F. Marinos · Kawasaki Himmelblau → Kawasaki Frontale
**Südkorea:** Pohang Rot-Schwarz → Pohang Steelers · Jeonju Grün → Jeonbuk Hyundai · Seongnam Gelb-Schwarz → Seongnam (Ilhwa Chunma) · Ulsan Blau → Ulsan Hyundai · Suwon Blau-Rot → Suwon Samsung
**Saudi-Arabien:** Riad Blau → Al-Hilal · Riad Gelb → Al-Nassr · Dschidda Gelb-Schwarz → Al-Ittihad · Dschidda Grün → Al-Ahli
**Iran:** Teheran Rot → Persepolis · Teheran Blau → Esteghlal · Isfahan Gelb → Sepahan · Tabriz Rot → Tractor
**China:** Guangzhou Rot → Guangzhou (Evergrande) · Jinan Orange → Shandong · Shanghai Rot → Shanghai Port · Peking Grün → Beijing Guoan
**Katar:** Doha Weiß → Al Sadd · Doha Rot → Al-Duhail · Doha Gelb-Blau → Al-Gharafa · Doha Weinrot → Al-Rayyan
**VAE:** Al Ain Violett → Al Ain · Dubai Rot → Shabab Al-Ahli · Dubai Gelb → Al-Wasl · Abu Dhabi Weinrot → Al-Wahda
**Australien:** Melbourne Weiß-Blau → South Melbourne (NSL) · Adelaide Schwarz-Rot → Adelaide City (NSL) · Sydney Himmelblau → Sydney FC · Melbourne Blau → Melbourne Victory · Sydney Rot-Schwarz → Western Sydney Wanderers
**Neuseeland:** Christchurch Rot-Schwarz → Christchurch United · Auckland Gelb → Mount Wellington · Auckland Blau → Auckland City · Waitakere Rot → Waitakere United · Wellington Gelb-Grün → Team Wellington

## Vereinfachungen

- Südamerika/Afrika/Asien rechnen in Kalenderjahren: beim Saisonwechsel in y/y+1 laufen die
  Meisterschaft y−1 und der Kontinentalpokal y; der Sieger spielt im Dezember y den Weltpokal.
- Keine Gruppenphasen in den Kontinentalpokalen, kein Spiel um Platz 5 bei der Klub-WM.
- Neutrale Plätze: die Match-Engine kennt keinen neutralen Platz – im eigenen Spiel bleibt ein
  Heimrecht (Weltpokal in Tokio: abwechselnd je Jahr), die Vorschau nennt den Austragungsort.
  Schnellsimulation neutraler Spiele ohne Heimvorteil.
- Klub-WM 2025 im Juli der neuen Saison statt Juni/Juli über den Saisonwechsel.
- Europas Teilnehmer der großen Klub-WM nach aktueller Stärke statt UEFA-Vierjahreswertung.

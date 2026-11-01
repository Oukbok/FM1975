# Spielerkurven: Jahrhunderttalent, Weltstar, Bundesliga-Topspieler, Normalprofi

Grundlage für die organische Spielerentwicklung (`engine/talent.ts`, `engine/development.ts`,
`engine/youth.ts`, `engine/playerFactory.ts`, `game/talentGame.ts`, `game/leagueBalance.ts`).
Das frühere Legenden-System (fest geplante Ausnahmetalente) ist entfernt.

**Spielskala:** 0–100, Bundesliga-Schnitt ≈ 72–74, Weltklasse ≥ 85, Weltspitze ≥ 90.
Die Werte unten sind **Schätzungen** auf dieser Skala. Grundlage sind öffentlich bekannte
Meilensteine (Debüt, Stammplatz, Auszeichnungen, Ablösen); Werte über 30 (Kimmich) bzw.
ab 32 (Hofmann) sind fortgeschrieben.

## 1. Meilensteine (Belege)

| Spieler | Meilenstein | Alter |
|---|---|---|
| **Lionel Messi** (* 24.06.1987) | Freundschaftsspiel 1. Mannschaft Barcelona (16.11.2003) | 16 |
| | Pflichtspiel-Debüt La Liga (16.10.2004) | 17 |
| | erstes Tor (01.05.2005), damals jüngster Torschütze Barcelonas | 17 |
| | Goldener Ball der U20-WM 2005 | 18 |
| | 2008/09 erste Saison ohne Unterbrechung (Triple) | 21 |
| | Ballon d'Or 2009, 2010, 2011, 2012 | 22–25 |
| | 2011/12: 73 Pflichtspieltore, 2012: 91 Tore im Kalenderjahr | 24–25 |
| | Ballon d'Or 2015, 2019 | 28, 32 |
| | Wechsel zu PSG (08/2021), Ballon d'Or 2021 | 34 |
| | Weltmeister 2022, Goldener Ball (als Erster zum zweiten Mal) | 35 |
| | Ballon d'Or 2023, Wechsel nach Miami (07/2023) | 36 |
| **Cristiano Ronaldo** (* 05.02.1985) | Debüt Sporting (14.08.2002, CL-Quali gegen Inter) | 17 |
| | Wechsel zu Manchester United für 12 Mio. £ (Rekord für einen Teenager in England) | 18 |
| | 2006/07: PFA- und FWA-Spieler des Jahres, 2. beim Ballon d'Or | 22 |
| | Ballon d'Or 2008 | 23 |
| | Weltrekord-Wechsel zu Real Madrid (≈ 94 Mio. €) | 24 |
| | Ballon d'Or 2013, 2014, 2016, 2017 | 28–32 |
| | Juventus für 100 Mio. € (höchste Ablöse für einen Spieler über 30) | 33 |
| | 2019/20: ältester Spieler seit 1948 mit 30+ Ligatoren in einer Top-5-Liga | 35 |
| | Rückkehr zu Manchester United, danach Al-Nassr | 36–37 |
| **Joshua Kimmich** (* 08.02.1995) | Jugend VfB Stuttgart (2007–2013) | 12–18 |
| | RB Leipzig in 3. Liga und 2. Bundesliga (53 Ligaspiele) | 18–20 |
| | Wechsel zum FC Bayern (≈ 7 Mio. €), 2015/16: 23 Bundesligaspiele, 15 von Beginn | 20–21 |
| | A-Länderspiel-Debüt (29.05.2016), EM 2016: Stammspieler, UEFA-Team des Turniers | 21 |
| | Champions-League-Sieger 2020, UEFA-Team des Jahres 2020 | 25 |
| | Kapitän der Nationalmannschaft (09/2024); EA FC 25: Wertung 86 | 29 |
| **Jonas Hofmann** (* 1992) – Bundesliga-Topspieler, später Nationalspieler | Jugend Hoffenheim, U19-Pokalsieger | 12–18 |
| | Bundesliga-Debüt für Dortmund unter Klopp (12/2012) | 20 |
| | 2013/14: 26 Bundesliga- und 8 Champions-League-Spiele; danach Leihe nach Mainz | 21–22 |
| | Wechsel nach Mönchengladbach (01/2016), dort 184 BL-Spiele, 40 Tore, 40 Vorlagen | 23–30 |
| | A-Länderspiel-Debüt 2020 (gegen die Türkei) | 28 |
| | Leverkusen 2023 (mit 30), Meister und Pokalsieger 2024 | 30–31 |

**Zum Alter:** Spieler erreichen ihren Höhepunkt im Mittel mit 25–28. Flügelspieler bauen am
frühesten ab, Innenverteidiger erst mit 31–32, Torhüter am spätesten (ESPN-Auswertung der
Alterskurven). **Breite der Spitze:** Im Bundesliga-Kader von EA FC 25 haben 14 Spieler
eine Wertung von 85 oder mehr, 9 von 86 oder mehr, 3 von 88 oder mehr und nur einer von
90 (Kane). Die zwei 21-Jährigen Wirtz (88) und Musiala (87) sind eine historische Ausnahme.

## 2. Kurven (Spielskala, Alter 16–38)

| Alter | Messi | Ronaldo | Kimmich | Hofmann (BL-Top) | Normalprofi |
|---:|---:|---:|---:|---:|---:|
| 16 | 64 | 60 | 52 | 46 | 44 |
| 17 | 71 | 67 | 57 | 51 | 49 |
| 18 | 78 | 73 | 62 | 56 | 54 |
| 19 | 84 | 77 | 67 | 61 | 59 |
| 20 | 89 | 81 | 74 | 66 | 63 |
| 21 | 92 | 85 | 80 | 70 | 66 |
| 22 | 95 | 89 | 83 | 71 | 68 |
| 23 | 96 | 92 | 85 | 73 | 70 |
| 24 | 97 | 93 | 86 | 75 | 71 |
| 25 | 97 | 94 | 88 | 77 | 72 |
| 26 | 97 | 95 | 88 | 78 | 73 |
| 27 | 97 | 95 | 88 | 80 | 73 |
| 28 | 96 | 96 | 88 | 82 | 73 |
| 29 | 96 | 96 | 88 | 83 | 73 |
| 30 | 96 | 95 | 87 | 83 | 72 |
| 31 | 95 | 95 | 86* | 81 | 71 |
| 32 | 95 | 95 | 85* | 79* | 69 |
| 33 | 93 | 93 | 83* | 77* | 66 |
| 34 | 92 | 92 | 81* | 74* | 63 |
| 35 | 91 | 91 | 79* | 71* | 60 |
| 36 | 89 | 89 | 76* | – | – |
| 37 | 87 | 86 | – | – | – |
| 38 | 85 | 84 | – | – | – |

\* fortgeschrieben

```
Stärke
 96 |            M M M M M M M M M M M
 92 |          M   R R R               M M M
 88 |        M   R     K K K K K K           M M
 84 |      M   R K K K         H H K K K       R M
 80 |        R K           H H     H H   K K
 76 |    M R         H H H             H     K
 72 |  M R   K   H H N N N N N N N N     H H
 68 |  R   K   H N N                 N
 64 |M       H N                       N N
 60 |R   K H                               N
 56 |  K H
 52 |K H N
 48 |  N
 44 |H
    +----------------------------------------------
     16  18  20  22  24  26  28  30  32  34  36  38  Alter
 M = Messi  R = Ronaldo  K = Kimmich  H = Hofmann  N = Normalprofi – wo Messi und Ronaldo gleichauf liegen, steht M
```

**Muster:**
- **Jahrhunderttalent** (Messi, Ronaldo): mit 17 im Profikader, mit 19–21 schon ≥ 85,
  ≥ 95 über rund 8–10 Jahre, langsamer Abbau dank Professionalität – mit 35 noch ≥ 90.
  Messi ist frühreif (89 mit 20), Ronaldo braucht drei Jahre länger und hält dafür länger.
- **Weltstar** (Kimmich): Profi mit 18–19 unterklassig, Durchbruch mit 20–21, ≥ 85 ab 23,
  Plateau 25–30 bei 88.
- **Bundesliga-Topspieler** (Hofmann): früh im Profikader, aber erst mit 26–29 auf der Höhe
  (Spätentwickler), Nationalspieler mit 28, ≥ 80 nur einige Jahre.
- **Normalprofi:** Stammspieler ab 22–23, Plateau 26–29 um 73, ab 31 deutlicher Abbau.

## 3. Zielverteilungen (1. Liga, zu jedem Zeitpunkt)

| Größe | Ziel | Begründung |
|---|---|---|
| Spieler ≥ 90 | 0–2 (Ø ≈ 1) | EA FC 25: 1 Spieler mit 90 |
| Spieler ≥ 85 | 10–15 | EA FC 25: 14 Spieler mit 85+ |
| Spieler ≥ 80 | ≈ 40–75 | Breite Spitze der Europapokal-Vereine |
| U21 ≥ 80 | 0–4 (Ø ≈ 1–2) | 2024: Wirtz, Musiala, Simons – Ausnahmejahrgang |
| U21 ≥ 85 | 0–1 (Ø ≤ 0,5) | Wirtz/Musiala 2024 sind die Ausnahme |
| Frühstar (≥ 85 mit ≤ 20) in der Liga | ≈ 0,5–2 je Jahrzehnt | z. B. Schuster, Haaland, Musiala, Wirtz |
| Jahrhunderttalent (Spitze ≥ 93 und ≥ 85 mit ≤ 20) | Spielwelt ≈ 1 in 10–20 Jahren, in der Liga 0–2 in 50 Jahren | Messi, Ronaldo, Mbappé – weltweit nur eine Handvoll in 25 Jahren |
| Höhepunkt-Alter | 26–29 (Weltklasse 25–29) | ESPN-Alterskurven |

## 4. Umsetzung im Spiel (Kurzfassung)

- **Potenzial** fein auf der OVR-Skala statt im Sterne-Raster. Akademie-Talente: ~52 %
  Durchschnitt (64–72), ~38 % solide (73–79), ~8 % hoch (80–85, 85 selten), ~1,2–2 % Ausnahmetalent
  (≥ 85, Exponential-Schwanz mit Mittel 2,8: ~17 % davon ≥ 90, ~6 % ≥ 93, ~1 % ≥ 96).
  Erzeugte junge Profis nutzen denselben Schwanz (1,2 %).
- **Frühreife** (verdeckt, −1 … +1): bis 20 bis zu ±40 % Tempo, 23–27 umgekehrt (Spätentwickler
  holen auf); große Talente sind im Schnitt frühreifer. In der Jugend hebt sie die
  altersgerechte Obergrenze um bis zu 7 %; bei Profis bis 24 begrenzt ein altersgerechter
  Reifegrad (Anteil des Potenzials: 79 % mit 18, 88 % mit 20, 95 % mit 22, ±8 % Frühreife)
  das Tempo.
- **Langlebigkeit** (verdeckt): Abbau ±1,5 Jahre; zusätzlich bremsen Training und
  Professionalität wie bisher.
- **Frühstarter:** profireife 16–19-Jährige (Stärke ≥ Kaderniveau − 6) rücken zum 1. Juli
  zu den Profis auf; beim eigenen Verein gibt es einen Hinweis.
- **Weltklasse-Bremse** ab 82 wie bisher, für Ausnahmetalente (Potenzial > 88) bis zu
  5 Punkte später. Das Liga-Gleichgewicht (PI-Regler auf 12,5 Spieler ≥ 85) verschiebt die
  Bremse (eine spätere Bremse wirkt nur bis 88) und bei dauerhafter Abweichung das
  Talent-Angebot neuer Spieler (0,7 … 1,3-fache Häufigkeit hoher Potenziale).
- **Startkader 1975 / neu erzeugte Kader:** junge Spieler sind altersgerecht schwächer
  (18 J. ≈ −9), nur selten ist ein Junger schon auf dem Niveau der Etablierten. Starke Kader
  bringen ihre etablierten Stars mit (Schnitt 72,5 → ~0,6 je Verein, 85–91, 23–29 Jahre) und
  mit 5 % je jungem Spieler einen kommenden Star (Potenzial ≥ 84) – sonst klafft Mitte der
  80er eine Lücke, bis die ersten Akademie-Jahrgänge reif sind.
- **Epochen-Ausgleich:** Die Bremse setzt 1983–1992 1,5 Punkte später, 1993–2001 0,5,
  2002–2014 2 und ab 2015 1,8 Punkte früher ein; Sportwissenschaft und Leistungszentren
  würden sonst die Spitze aufblähen. Ist die Spitze dicht besetzt, bleiben
  Weltklasse-Kandidaten bis zu 2,5 Punkte unter ihrem Potenzial und alternde Stars (83+)
  bauen bis 1,6-fach schneller ab (bei zu wenigen bis halb so schnell; dann wachsen Spieler mit Potenzial ab 82 bis zu
  2 Punkte darüber hinaus).

## Quellen

- Wikipedia: [Lionel Messi](https://en.wikipedia.org/wiki/Lionel_Messi),
  [Career of Lionel Messi](https://en.wikipedia.org/wiki/Career_of_Lionel_Messi)
- Wikipedia: [Cristiano Ronaldo](https://en.wikipedia.org/wiki/Cristiano_Ronaldo),
  [Career of Cristiano Ronaldo](https://en.wikipedia.org/wiki/Career_of_Cristiano_Ronaldo)
- Wikipedia: [Joshua Kimmich](https://en.wikipedia.org/wiki/Joshua_Kimmich);
  FC Bayern: [Pressemitteilung Kimmich-Verpflichtung 2015](https://fcbayern.com/en/news/2015/01/press-release-fcb-sign-joshua-kimmich-020114)
- Bayer 04: [Profil Jonas Hofmann](https://www.bayer04.de/en-US/news/bayer04/profile-of-new-signing-jonas-hofmann)
- ESPN: [Soccer age curves – goalkeepers and central defenders peak latest](https://global.espn.com/football/story/_/id/37467220/soccer-age-curves-show-goalkeepers-central-defenders-peak-latest)
- Sports Illustrated: [EA Sports FC 25 Ratings – Top 25 Players in the Bundesliga](https://www.si.com/soccer/ea-sports-fc-25-ratings-top-25-players-in-the-bundesliga)

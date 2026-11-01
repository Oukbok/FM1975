# Sponsoring und Werbung im deutschen Profifußball 1973–heute

Grundlage für Sponsoring 2.0 (`data/sponsorCatalog.ts`, `engine/sponsorship.ts`, `game/sponsorGame.ts`).
Belegte Punkte mit Quelle, Spielwerte ohne Beleg sind im Code als „Annahme“ markiert.

## Werbeflächen und Freischaltjahre

| Fläche | Im Spiel ab | Beleg |
|---|---|---|
| Trikot-Brust | 1975 (real seit 1973) | 1967 Wormatia Worms (CAT, 5.000 DM) → DFB-Verbot; 24.3.1973 Jägermeister-Hirsch bei Eintracht Braunschweig, DFB gibt Trikotwerbung im Oktober 1973 frei; 1974 folgen HSV (Campari), Duisburg, Düsseldorf, Bayern (adidas) [S1] |
| Ausrüster | 1975 | Ausrüster seit den 1960ern; Geldwert erst ab den 1990ern nennenswert (Annahme) |
| Bandenwerbung | 1975, LED ab 2010 | Annahme (LED-Banden setzen sich um 2010 durch) |
| Regionalpartner | 1975 | Annahme |
| Premium-Partner | 1990 | Pyramide mit Platin-/Premium-Partnern (z. B. FC Bayern) [B2], Annahme Jahr |
| Co-/Exklusivpartner | 1995 | Annahme |
| Trainingsanzug & Kollektion | 1994 | Annahme |
| Nachwuchs-Partner | 2001 | NLZ-Pflicht 2001 (game/youthInvest.ts) |
| Digitalpartner | 2012 | Annahme |
| Wettpartner | 2005; Verbot 2006/07–2011/12; ab 2012/13 | bwin musste 2006 von den Trikots (auch in Bremen) [S3]; Glücksspielstaatsvertrag 2008 (Werbeverbot), Änderung 2012 (Lizenzen), Neuregelung 2021 |
| Ärmel | 2017/18 | Klubs vermarkten den Ärmel seit 2017/18 selbst (vorher Hermes für alle) [S2] |
| Krypto/NFT | 2021/22–2022/23 | Krypto-Welle, Einbruch nach FTX-Insolvenz (11/2022) [S6] |
| Namensrechte Stadion | 2000 (bestehendes System, `engine/clubBusiness.ts`) | AOL Arena 2001 |

## Branchen je Epoche

- **1970er:** Spirituosen und Brauereien, dazu Elektronik und Versicherungen [S2]. Spirituosen
  >15 % Vol. sind heute im Sport nicht mehr zulässig [S1] (im Spiel ab 2000 nicht mehr auf dem Trikot – Annahme).
- **Tabak:** Fernsehwerbung für Zigaretten seit 1.1.1975 verboten → im Spiel nur Banden;
  ab 2007 Sponsoringverbot (EU-Tabakwerberichtlinie 2003/33/EG, Umsetzung Ende 2006) [S7].
- **1980er:** Unterhaltungselektronik (kurze Verträge), erste internationale Firmen [S2].
- **1990er–2000er:** Autos (Opel), Chemie/Pharma (Bayer), Telekommunikation ab der Liberalisierung,
  Energie ab 1998, Finanzen/Versicherungen [S2].
- **2006:** Wettanbieter bwin verliert die Trikotwerbung [S2][S3].
- **2010er–2020er:** Online-Portale, Technologie, Airlines und Staatsfonds vom Golf, Krypto (2021/22).
- **2022:** Schalke entfernt Gazprom nach dem Angriff auf die Ukraine [S2] → im Spiel enden alle
  Verträge mit russischen Energiekonzernen im März 2022.

## Besondere Klauseln

- **Katar:** FC Bayern seit Januar 2011 im Winter in Doha [C4]; Qatar Airways 2018–2023
  Platin-Partner/Ärmel (≈ 17 Mio. £ pro Jahr), beendet nach Fanprotesten [S4]. Im Spiel: katarische
  Sponsoren ab 2011, Pflicht-Trainingslager „Katar“ nur, wenn der Verein Doha buchen darf
  (Ansehen ≥ 82, `data/campDestinations.ts`), wachsende Fan-Kritik (Image-Stufe 1 → 3 ab 2020).
- **Asien-/USA-Reisen:** Sommertouren ab 2014/15 (Bayern China 2017, ≈ 10 Mio. € Erlös) [C6] →
  Pflicht-Sommerreise für chinesische, japanische, koreanische und US-Partner.
- **Abstieg:** Ausstiegsklausel oder Kürzung (30–50 %) üblich; Spitzenklubs handeln sie seltener ein.
- **Erfolgsprämien:** Meister, Pokal, Europapokal, Klassenerhalt.
- **Mindestplatzierung:** Topklubs: unter Platz 4/6 sinkt der Wert in der Folgesaison.
- **Exklusivität:** „Offizieller Partner der Branche“ – kein zweiter Partner derselben Branche.

## Werteniveau (Median-Erstligist; Spitze in Klammern)

| Jahr | Brust | Ausrüster | Gesamt Werbung (Median) |
|---|---:|---:|---:|
| 1975 | ≈ 0,2 Mio. DM (Remington/Frankfurt 275 Tsd.) | ≈ 0,05 Mio. DM | ≈ 0,4–0,6 Mio. DM |
| 1990 | ≈ 1,5 Mio. DM | ≈ 0,6 Mio. DM | ≈ 3–4 Mio. DM |
| 2005 | ≈ 4,5 Mio. € | ≈ 2 Mio. € | ≈ 15 Mio. € |
| 2024 | ≈ 9 Mio. € (Telekom/Bayern ≈ 55–60 Mio. €) [B1] | ≈ 5 Mio. € (Bayern ≈ 60 Mio. €) [B3] | ≈ 35–45 Mio. € (Bayern 240 Mio. €, `fcbayern_2026.md`) |

## Quellen

- [S1] dewiki „Trikotwerbung“: https://dewiki.de/Lexikon/Trikotwerbung
- [S2] Get Football News Germany, „Bundesliga shirt sponsor history“ (2024): https://www.getfootballnewsgermany.com/2024/bundesliga-shirt-sponsor-history/
- [S3] Horizont, „Bwin muss auch in Bremen von den Trikots“: https://www.horizont.net/marketing/nachrichten/-Bwin-muss-auch-in-Bremen-von-den-Trikots-65512 ; Der Standard, „bwin-Urteil bringt Sponsorprobleme“: https://www.derstandard.at/story/2547325/bwin-urteil-bringt-sponsorprobleme
- [S4] City A.M., „Bayern Munich end £17m-a-year Qatari sponsor deal following fan protests“: https://cityam.com/?p=2016783 ; Qatar Airways, Pressemitteilung 03/2018 (Platinum Partner): https://www.qatarairways.com/en/press-releases/2018/march-/qatar-airways-becomes-platinum-partner-of-football-giant-fc-baye.html
- [S6] FTX-Insolvenz November 2022 (allgemein bekannt); Krypto-Sponsoring 2021/22 als Welle – Werte Annahme.
- [S7] Horizont, „Tabakwerbeverbot wird ausgeweitet“: https://www.horizont.net/marketing/nachrichten/-Tabakwerbeverbot-wird-ausgeweitet-90673 ; RL 2003/33/EG: https://gesetze.legal/eu/rl_2003_33_eg/praeambel
- [B1] Telekom, „Telekom und FC Bayern setzen Unlimited in Szene“ (04/2025): https://www.telekom.com/de/newsroom/aktuelles/medieninformationen/2025/04/telekom-und-fc-bayern-setzen-unlimited-in-szene
- [B2] FC Bayern, Jahresabschluss 2023/24 (Sponsoring/Vermarktung 225,7 Mio. €): https://fcbayern.com/binaries/content/assets/downloads/homepage/jhv/2024/jahresabschluss-23-24-fc-bayern.pdf
- [B3] Ausrüsterverträge der Spitzenklubs (Presseberichte, Größenordnung) – Annahme.
- [C4], [C6] siehe `data/campDestinations.ts`.
- TV-Rechte je Saison: basicthinking.de, „Die Kosten & Inhaber der Bundesliga-Rechte seit 1965“: https://www.basicthinking.de/blog/2017/05/19/bundesliga-rechte/

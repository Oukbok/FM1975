# FC Bayern München – Umsatz und Ausgaben (Stand November 2026)

Kalibrierungsanker für den Spitzenklub in „1975 – A Football Manager“. Zuletzt veröffentlicht ist das
Geschäftsjahr **2024/25** (1. Juli 2024 – 30. Juni 2025, Jahreshauptversammlung November 2025).
Die Zahlen für 2025/26 (Klub-WM-Erlöse im Sommer 2025 fallen schon in 2024/25) lagen bei der
Recherche noch nicht vor.

## 1. Umsatz 2024/25 (Konzern)

| Bereich | Mio. € | Veränderung | Anmerkung |
|---|---:|---:|---|
| **Konzernumsatz** | **978,3** | +2,8 % (Vj. 951,5) | Rekord, 33. Gewinnjahr in Folge [1][2][3] |
| Spielbetrieb | 260,7 | ≈ +15 % | enthält Teilnahme-/Prämiengelder der UEFA [2][4] |
| davon UEFA Champions League | 105,9 | | Viertelfinale (Aus gegen Inter) [6] |
| davon Ticketing/Hospitality (Rest) | ≈ 155 | | rechnerisch |
| Sponsoring/Vermarktung | 240,4 | +6,5 % | Telekom (Brust, seit 2002), Ausrüster, Platin-/Premium-Partner [2][4] |
| Merchandising | 150,5 | +11,4 % | [2][4] |
| Medien (zentrale Vermarktung) | 102,9–105,3 | +13,2 % | davon DFL 102,9 (national 70,6 + international) [2][4][7] |
| Transfererlöse | 117,7 | −36,8 % | u. a. de Ligt, Tel [2][4] |
| Sonstiges (Catering, Arena, Campus, Museum …) | ≈ 52 | | rechnerisch / [4] |

Umsatz **ohne Transfererlöse ≈ 861 Mio. €** – das ist die Größe, die das Spiel als „Umsatz“ führt
(`revenueOf` zählt Transfers nicht mit).

## 2. Ausgaben und Ergebnis 2024/25

| Posten | Mio. € | Anteil am Umsatz (ohne Transfers) |
|---|---:|---:|
| Personal (Kader, Trainer, Verwaltung) | 408,3 (+3,0 %) | 47 % (41,7 % vom Konzernumsatz) [2][4] |
| Materialaufwand (v. a. Wareneinsatz Fanartikel, Catering) | 59,9 | 7 % [4] |
| Sonstige betriebliche Aufwendungen (Spielbetrieb, Arena, Reisen, Vermarktung, Berater, Verwaltung) | 310,0 | 36 % [4] |
| Abschreibungen | 132,3, davon Spielerwerte 126,4 | 15 % [4] |
| **EBITDA** | **187,8** (+11,3 %) | [1][2] |
| Ergebnis vor Steuern | 42,5 (Vj. 62,7) | [1][2] |
| Jahresüberschuss | 27,1 (Vj. 43,1) | [1][2] |
| Eigenkapital | ≈ 571–586 | keine Bankschulden (Angaben schwanken nach Stichtag/Ebene) [4][5] |

Die Abschreibungen auf Spielerwerte sind die über die Vertragslaufzeit verteilten Ablösen
(Kane ≈ 95–100 Mio. €, Musiala-Verlängerung, Olise, Palhinha …). Im Spiel werden Ablösen sofort
gebucht – ein Spitzenklub mit dauerhaft negativem Transfersaldo von 10–20 % des Umsatzes
entspricht diesen Abschreibungen.

## 3. Vorjahr 2023/24 (Einzelabschluss FC Bayern München AG) [8]

| Umsatz nach Bereichen | Mio. € | Aufwand | Mio. € |
|---|---:|---|---:|
| Spielbetrieb | 226,9 | Personal | 396,5 |
| Sponsoring/Vermarktung | 225,7 | Material | 53,9 |
| Medienvermarktung | 91,7 (DFL 90,9) | Abschreibungen | 95,1 (Spieler 89,2) |
| Transfers | 186,1 | Sonstige betriebliche | 325,0 |
| Merchandising | 135,1 | | |
| Sonstiges | 42,7 | | |
| **Summe AG** | **908,1** (Konzern 951,5) | EBITDA Konzern | 168,7 |

## 4. Einordnung gegenüber der Liga

- Bundesliga 2023/24: 4,80 Mrd. € Umsatz für 18 Klubs, Medien 1,53 Mrd., Werbung 1,02 Mrd.,
  Transfers 1,00 Mrd., Spielbetrieb 524 Mio., Merchandising 271 Mio. (DFL-Wirtschaftsreport,
  siehe `FINANZEN_Recherche_Entwicklung_1980_heute.md`).
- Bayern allein: rund **ein Viertel des Werbe-** und **mehr als die Hälfte des Merchandising-Umsatzes**
  der Liga. Der Median-Erstligist liegt bei rund 150–230 Mio. € (je nach Abgrenzung mit/ohne Transfers),
  Werbung ≈ 30–45 Mio. €, Merchandising ≈ 5–10 Mio. €.
- TV national 2024/25: Bayern 70,6 Mio. €, Schlusslicht Kiel 29,4 Mio. € (Faktor 2,4), Summe
  965 Mio. € [7]; mit Auslandsgeldern ≈ 1,17 Mrd. € für die 1. Liga.
- UEFA 2024/25: PSG (Sieger) 144,4 Mio. €, Bayern 105,9, Dortmund 102,2, Leverkusen 87,1 [6].

## 5. Ziele für das Spiel (Kalibrierung, `docs/specs/FINANZEN_SPEC.md` Abschnitt 10)

| Größe 2024/25 | Real (Bayern) | Ziel im Spiel (dauerhaft erfolgreicher Topklub) |
|---|---:|---|
| Umsatz ohne Transfers | ≈ 861 Mio. € | 750–950 Mio. €; mit CL-Siegen und Weltmarke bis ≈ 1,1 Mrd. € |
| Sponsoring + Werbung | 240 Mio. € | 200–280 Mio. € (Pyramide, Reichweite^2,1) |
| Merchandising | 150 Mio. € | 100–170 Mio. € (Stadion + weltweit) |
| TV (DFL) | 103 Mio. € | 90–110 Mio. € (Topf nach echten Verträgen, 50 % leistungsabhängig) |
| UEFA | 106 Mio. € | 60–140 Mio. € je nach Runde (Startgeld-Faktor) |
| Personalquote | 47 % | 45–60 % |
| Betrieb & Vermarktung + Material | 43 % | 30–45 % inkl. Stadion, Gelände, Umfeld |
| Median-Erstligist | – | unverändert ≈ 200–230 Mio. € |

## Quellen

1. FC Bayern, „Jahresabschluss der Saison 2024/25“ (Pressemitteilung, 11/2025): https://fcbayern.com/de/news/2025/11/pm-jahresabschluss-der-saison-2024-25
2. Inside World Football, „Bayern Munich post record €978.3m ‘despite turbulent times’“ (03.11.2025): https://www.insideworldfootball.com/2025/11/03/bayern-munich-post-record-e978-3m-despite-turbulent-times/
3. Bavarian Football Works, „Financial success during turbulent times highlights Bayern Munich’s AGM“: https://www.bavarianfootballworks.com/bavarian-financial-works/146295/financial-success-during-turbulent-times-highlights-bayern-munichs-agm
4. Calcio e Finanza, „Bayern Monaco, ricavi record a quasi un miliardo nel 2024/25“: https://www.calcioefinanza.it/?p=207838 und Insider Sport, „FC Bayern record turnover is backed by fundamental sustainability“ (04.11.2025): https://insidersport.com/2025/11/04/fc-bayern-record-turnover-sustainabili/
5. Heidelberg24, „FC Bayern verkündet positive Geschäftszahlen – doch muss Einbußen hinnehmen“: https://www.heidelberg24.de/sport/fussball/letzten-geschaeftsjahr-bekannt-positives-ergebnis-bayern-gibt-zahlen-zum-zr-94017362.html (Ergebnis des e. V., Eigenkapital 571 Mio. €)
6. ran.de, „Champions League: Einnahmen der Klubs in der Saison 2024/25“: https://ran.joyn.de/sports/fussball/champions-league/champions-league-einnahmen-der-klubs-in-saison202425-drei-bundesligisten-in-top10-91370
7. 90min, „Die TV-Geld-Tabelle der Bundesliga 24/25“: https://www.90min.de/posts/die-tv-geld-tabelle-der-bundesliga-24-25
8. FC Bayern, „Jahresabschluss 2023/24“ (PDF zur JHV 2024): https://fcbayern.com/binaries/content/assets/downloads/homepage/jhv/2024/jahresabschluss-23-24-fc-bayern.pdf

Hinweise: Die Medienangaben weichen je nach Quelle ab (102,9 = DFL-Ausschüttung, 105,3 = Medien
gesamt). Personal 396,5 Mio. € ist der Wert der AG 2023/24, 408,3 Mio. € der Konzernwert 2024/25.

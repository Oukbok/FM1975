# Bundesliga-Finanzen 1975: Design-Recherche für „1975 – A Football Manager“
*Pascal Franke — September 15, 2026*

## Methodik und Quellenkritik

Für die Startsaison 1975/76 sind Zuschauerzahlen, zentrale Fernsehgelder und einzelne Sponsoring- beziehungsweise Transferverträge vergleichsweise gut greifbar. Dagegen fehlen digital zugängliche, standardisierte Vereinsbilanzen mit getrennten Positionen für Eintrittspreise, Verpflegung, Bandenwerbung, Mitgliedsbeiträge, Personal, Reisen oder Nachwuchs. Eine verbindliche Veröffentlichung wesentlicher Finanzkennzahlen aller Bundesligisten wurde erst Jahrzehnte später eingeführt; rückwirkend existiert deshalb keine einheitliche Finanzstatistik für 1975 [[1]](https://www.bundesliga-gruppe.de/hintergrund/lizenzierungsverfahren/finanzkennzahlen-der-proficlubs/) [[2]](https://www.dfl.de/de/hintergrund/lizenzierungsverfahren/finanzkennzahlen-der-proficlubs/).

Der Bericht trennt daher strikt zwischen:

1. **nachweisbaren historischen Werten**,  
2. **rechnerischen Ableitungen aus diesen Werten**,  
3. **provisorischen Designparametern**, die keine historischen Bilanzen darstellen.

Alle Beträge stehen in D-Mark. In Euro geführte retrospektive Transferdaten werden nicht umgerechnet, weil das Evidenzmaterial keinen anzuwendenden Umrechnungsschlüssel vorgibt. Zudem widersprechen sich die Datenquellen: Eine retrospektive Datenbank weist aggregierte Transferbewegungen schon für 1974/75 und 1975/76 aus [[3]](https://www.transfermarkt.us/bundesliga/transferbilanz/wettbewerb/L1), während andere Befunde erklären, systematische Finanzreihen begännen erst 1980/81 und belastbare zeitgenössische Jahresberichte seien nicht verfügbar [[4]](https://de.wikipedia.org/wiki/Vorlage:Transferausgaben_und_-erl%C3%B6se_der_Vereine_der_Fu%C3%9Fball-Bundesliga) [[5]](https://www.transfermarkt.us/bundesliga/einnahmenausgaben/wettbewerb/L1). Für die Simulation sollten daher nur einzeln dokumentierte Ablösen als historische Anker gelten.

## Finanzrealität zum Start 1975/76

Die Bundesliga befand sich unmittelbar nach der Aufhebung zentraler Beschränkungen in einer riskanten Übergangsphase. 1972 fielen die Gehaltsobergrenzen, 1974 die Begrenzungen der Ablösesummen [[6]](https://www.bpb.de/shop/zeitschriften/apuz/163804/wegmarken-aus-50-jahren-bundesliga/) [[7]](https://monami.hs-mittweida.de/files/2710/Bachelorarbeit_Roman_Harder.pdf). Damit wurden Gehälter und Transfers marktnäher, ohne dass bereits moderne Medien- und Vermarktungserlöse zur Verfügung standen.

Trikotwerbung war erst seit Herbst 1973 zugelassen. Für die Freigabe wird je nach Quelle der 27. oder 30. Oktober 1973 genannt [[8]](http://www.remember-blaugelb.de/4/src/web/?c=Articles&a=showDay&m=07&d=04) [[9]](https://www.stuttgarter-zeitung.de/inhalt.fussball-bundesliga-50-jahre-trikotwerbung-ganze-branche-muss-mast-dankbar-sein.c05cc8fc-e41b-45e6-9a10-1f1cc655b4b6.html) [[10]](https://www.ndr.de/sport/fussball/50_jahre_bundesliga/Braunschweiger-Fussballrevolution-mit-Hirsch,braunschweig2433.html) [[11]](https://www.trikotgeschichte.de/stadionzeitung/vereinsgeschichte/eintracht-braunschweig-jaegermeister/). Die genaue Tagesangabe ist damit strittig; eindeutig ist die Zulassung vor der Saison 1974/75. In jener Spielzeit liefen sechs Vereine bereits mit Trikotsponsoren auf [[12]](https://bpb.de/gesellschaft/medien-und-sport/bundesliga/160779/geschichte-der-bundesliga) [[13]](https://www.bpb.de/themen/sport/bundesliga/160779/der-lange-weg-zum-profi/). Zugleich blieben Eintrittsgelder die wichtigste Erlössäule, während die zentralen Fernsehrechte 1975/76 insgesamt nur 4,8 Mio. DM einbrachten [[14]](https://www.spiegel.de/sport/fussball/uebersicht-tv-gelder-von-1965-bis-heute-a-74669.html) [[15]](https://monami.hs-mittweida.de/files/3984/Bachelorarbeit_Nicolas_Heck.pdf).

## Einnahmen

### Zuschauer und Eintritt

Für 1975/76 meldet das DFB-Datencenter 7.093.100 Zuschauer und einen Schnitt von 23.180 pro Bundesligaspiel; 1974/75 waren es 6.955.321 beziehungsweise 22.729 [[16]](https://datencenter.dfb.de/datencenter/bundesliga/zuschauerzahlen). Eine alternative Statistik nennt für 1975/76 ungefähr 7,12 Mio. beziehungsweise 23.267 Zuschauer [[17]](https://www.transfermarkt.us/bundesliga/besucherzahlenentwicklung/wettbewerb/L1). Für das Spielmodell ist der amtlich wirkende DFB-Wert von 23.180 die besser gestützte Basis, während eine Abweichung von rund 0,4 Prozent als historische Datenunsicherheit bestehen bleiben sollte.

Bei 18 Vereinen und 306 Ligaspielen entfielen rechnerisch 17 Liga-Heimspiele auf jeden Verein [[18]](https://de.wikipedia.org/wiki/Fu%C3%9Fball-Bundesliga_1975/76) [[19]](https://en.wikipedia.org/wiki/1975%E2%80%9376_Bundesliga). Ein Verein mit exakt durchschnittlichem Besuch käme damit auf:

- **23.180 Zuschauer je Heimspiel**
- **394.060 Zuschauerbesuche je Ligasaison**

Zeitgenössische Bundesliga-Ticketpreise sind im Material nicht dokumentiert [[20]](http://www.bulibox.de/bundesliga/zuschauerzahlen.html) [[16]](https://datencenter.dfb.de/datencenter/bundesliga/zuschauerzahlen). Die folgende Hochrechnung ist deshalb ausdrücklich ein **Designmodell**, keine historische Eintrittsbilanz.

| Modellpreis 1975 | Brutto je durchschnittlichem Heimspiel | Brutto aus 17 Liga-Heimspielen |
|---:|---:|---:|
| 5 DM | 115.900 DM | 1.970.300 DM |
| 8 DM | 185.440 DM | 3.152.480 DM |
| 10 DM | 231.800 DM | 3.940.600 DM |

Diese Beträge sind Bruttowerte vor möglichen Steuern, Verbandsanteilen, Freikarten, Ermäßigungen, Dauerkartenrabatten und Abrechnungen mit dem Stadionträger. Für diese Abzüge liegen keine Werte vor. Das Spiel sollte deshalb nicht unterstellen, dass Zuschauerzahl mal Listenpreis automatisch als freie Vereinskasse verfügbar ist.

### Fernsehgelder

ARD und ZDF zahlten für die Bundesliga-Rechte:

| Saison | Zentrale Rechtezahlung |
|---|---:|
| 1973/74 | 3.400.000 DM |
| 1974/75 | 4.400.000 DM |
| 1975/76 | 4.800.000 DM |
| 1976/77 | 4.800.000 DM |

[[14]](https://www.spiegel.de/sport/fussball/uebersicht-tv-gelder-von-1965-bis-heute-a-74669.html)

Eine rein gleichmäßige Verteilung der 4,8 Mio. DM auf 18 Vereine ergäbe rechnerisch **266.667 DM pro Verein**. Dieser Betrag ist nur eine **Verteilungsannahme**: Das Material enthält weder den tatsächlichen Schlüssel noch mögliche Vorwegabzüge des DFB. Als Größenordnung zeigt er dennoch, dass TV-Geld 1975 deutlich hinter den modellierten Eintrittserlösen lag.

### Trikotwerbung und Sponsoring

Eintracht Braunschweigs ursprünglicher Jägermeister-Vertrag hatte ein Volumen von 500.000 DM über fünf Jahre, entsprechend **100.000 DM je Saison** [[21]](https://sport.sky.de/fussball/artikel/bundesliga-50-jahre-trikotwerbung-jaegermeister-war-in-braunschweig-vorreiter/12839476/33896) [[9]](https://www.stuttgarter-zeitung.de/inhalt.fussball-bundesliga-50-jahre-trikotwerbung-ganze-branche-muss-mast-dankbar-sein.c05cc8fc-e41b-45e6-9a10-1f1cc655b4b6.html). Für 1974/75 werden außerdem folgende Einzelverträge genannt:

- Hamburger SV/Campari: **500.000 DM je Saison**
- Eintracht Frankfurt/Remington: **275.000 DM je Saison** [[22]](https://trikotbuch.de/der-einzug-der-trikotwerbung/)

Damit ist für die Spielbalance eine dokumentierte Spannweite von **100.000 bis 500.000 DM pro Saison** verfügbar. Sie ist jedoch keine vollständige Marktstatistik. Der HSV-Wert darf nicht als gewöhnlicher Ligadurchschnitt behandelt werden.

### Catering, Würstchenbuden und Getränke

Für 1974–1976 sind keine getrennten Cateringumsätze oder Pachtabrechnungen dokumentiert. Die zeitgenössische Bewirtschaftung wird als wesentlich weniger professionalisiert beschrieben als heutige, häufig ausgelagerte Stadiongastronomie [[23]](https://spobis.com/article/bundesliga-catering-wer-verdient-was) [[24]](https://bellini-freiburg.de/wp-content/uploads/2024/11/Stadionwelt_12-24.pdf). Daraus lässt sich weder ein historischer Pro-Kopf-Umsatz noch die Beteiligung des Vereins ableiten.

Für das Spiel eignet sich daher ein klar gekennzeichneter Parameter **„Nettoerlös des Vereins je Zuschauer“**. Eine vorläufige Testspanne von **0,50 bis 1,50 DM je Besucher** ergäbe bei 394.060 Saisonbesuchen **197.030 bis 591.090 DM**. Diese Werte sind ausschließlich Simulationsannahmen.

### Bandenwerbung

Für Bandenwerbung liegt im Material keine belastbare Vertragssumme aus den Jahren 1974–1976 vor. Sie sollte getrennt von der Trikotwerbung geführt werden, aber nicht mit erfundenen historischen Verträgen versehen werden. Als provisorischer Spielkorridor können **100.000 bis 300.000 DM pro Saison** getestet werden. Die Höhe sollte von Stadiongröße, TV-Präsenz, Tabellenrang und regionalem Wirtschaftsraum abhängen.

### Mitgliedsbeiträge, Programmhefte und Sonstiges

Separate Bundesliga-Zahlen für Mitgliedsbeiträge und Programmverkäufe sind nicht verfügbar [[1]](https://www.bundesliga-gruppe.de/hintergrund/lizenzierungsverfahren/finanzkennzahlen-der-proficlubs/) [[2]](https://www.dfl.de/de/hintergrund/lizenzierungsverfahren/finanzkennzahlen-der-proficlubs/). Historische Programmhefte sind zwar als zeitgenössische Spieltagsobjekte nachweisbar, ihre Auflage, Verkaufspreise und Ergebnisbeiträge jedoch nicht [[25]](https://www.stadionheft.de/vk_listen/witte_vk.pdf).

Für eine erste Simulation sind daher nur vorsichtige Modellwerte vertretbar:

- Mitgliedsbeiträge: **50.000 bis 150.000 DM**
- Programmhefte und sonstige Spieltagserlöse: **50.000 bis 200.000 DM**

Merchandising sollte 1975 nicht automatisch als moderne, eigenständige Millionensäule modelliert werden; dafür enthält das Material keinen Beleg.

### Transfererlöse

Transfererlöse waren unregelmäßig und von einzelnen Verkäufen abhängig. Eine standardisierte Bundesliga-Gesamtrechnung für 1975/76 ist nicht belastbar verfügbar [[4]](https://de.wikipedia.org/wiki/Vorlage:Transferausgaben_und_-erl%C3%B6se_der_Vereine_der_Fu%C3%9Fball-Bundesliga) [[5]](https://www.transfermarkt.us/bundesliga/einnahmenausgaben/wettbewerb/L1). Im laufenden Grundetat sollte deshalb **0 DM** angesetzt werden; Verkäufe erscheinen als ereignisbezogene Sondererlöse. Ein erfolgreicher Verkauf kann das Jahresergebnis stark verändern, darf aber nicht als jährlich garantiertes Einkommen gelten.

## Einnahmequellen 1975 und ihr Anteil

Die zentrale Tabelle zeigt ein **rechnerisches Liga-Durchschnittsszenario**, nicht die Bilanz eines realen Vereins. Parameter: 23.180 Zuschauer, 17 Heimspiele, 8 DM durchschnittlicher Eintritt, 1 DM Catering-Netto je Besucher, 275.000 DM Trikotsponsoring, gleichmäßige TV-Verteilung und mittlere Designwerte für die nicht dokumentierten Positionen.

| Einnahmequelle | Betrag pro Saison | Anteil | Status |
|---|---:|---:|---|
| Eintritt | 3.152.480 DM | 69,5 % | Rechnung aus dokumentierter Zuschauerzahl und angenommenen 8 DM |
| Catering/Verpflegung | 394.060 DM | 8,7 % | Modellannahme: 1 DM je Besucher |
| Trikotwerbung | 275.000 DM | 6,1 % | dokumentierter Einzelvertrag Frankfurt, kein Ligamittel [[22]](https://trikotbuch.de/der-einzug-der-trikotwerbung/) |
| Fernsehgeld | 266.667 DM | 5,9 % | Rechnung bei gleichmäßiger Verteilung |
| Bandenwerbung | 200.000 DM | 4,4 % | Modellannahme |
| Programmhefte/Sonstiges | 150.000 DM | 3,3 % | Modellannahme |
| Mitgliedsbeiträge | 100.000 DM | 2,2 % | Modellannahme |
| Transfererlöse | 0 DM | 0,0 % | konservativer Grundetat |
| **Gesamt** | **4.538.207 DM** | **100,0 %** | **Modellsumme, keine historische Bilanz** |

Der zentrale Designbefund lautet: **Die Zuschauerzahl muss 1975 den stärksten unmittelbaren Einfluss auf die Vereinsfinanzen haben.** Sie wirkt zugleich auf Eintritt, Verpflegung und Programme. Das TV-Geld sollte dagegen eine relativ kleine, weitgehend zentrale Grundzahlung darstellen.

## Ausgaben

### Spieler: Gehälter und Prämien

Belastbare Durchschnitts- oder Spitzengehälter für 1975/76 enthält das Material nicht. Frühere Nennungen von 1.200 bis 1.400 DM Monatsgehalt betreffen die inzwischen aufgehobenen Obergrenzen beziehungsweise einzelne Stars der 1960er Jahre und dürfen nicht als Gehaltsniveau von 1975 fortgeschrieben werden [[6]](https://www.bpb.de/shop/zeitschriften/apuz/163804/wegmarken-aus-50-jahren-bundesliga/) [[13]](https://www.bpb.de/themen/sport/bundesliga/160779/der-lange-weg-zum-profi/). Sicher ist nur, dass seit 1972 keine allgemeine Gehaltsobergrenze mehr galt und Grundbezüge durch leistungsabhängige Prämien ergänzt wurden [[6]](https://www.bpb.de/shop/zeitschriften/apuz/163804/wegmarken-aus-50-jahren-bundesliga/) [[26]](https://www.sueddeutsche.de/sport/60-jahre-fussball-oberhaus-spiel-ohne-grenzen-bundesliga-wird-zur-liga-der-millionaere-dpa.urn-newsml-dpa-com-20090101-230810-99-788799).

Für einen spielbaren Prototyp kann vorläufig angenommen werden:

- Kader: **22 Spieler**
- durchschnittliches Jahresgrundgehalt: **50.000 bis 100.000 DM**
- Spitzenspieler: **150.000 bis 250.000 DM jährlich**
- Prämienbudget: **15 bis 20 Prozent** der Grundgehälter

Daraus folgt ein modellierter Spieleraufwand von rund **1.265.000 DM** im unteren Fall beziehungsweise **2.640.000 DM** im oberen Fall. Diese Zahlen sind reine Designparameter und müssen im Spiel entsprechend gekennzeichnet werden.

### Transfers

Seit 1974 waren Ablösen nicht mehr durch die frühere Obergrenze gedeckelt [[6]](https://www.bpb.de/shop/zeitschriften/apuz/163804/wegmarken-aus-50-jahren-bundesliga/) [[7]](https://monami.hs-mittweida.de/files/2710/Bachelorarbeit_Roman_Harder.pdf). Transfers sollten deshalb hohe, unregelmäßige Liquiditätsbelastungen auslösen. Der dokumentierte Millionenwechsel von 1976 zeigt, dass ein einziger Spitzentransfer einen erheblichen Teil eines modellierten Jahresetats beanspruchen konnte [[27]](https://de.wikipedia.org/wiki/Fu%C3%9Fball-Bundesliga).

### Stadion, Personal und Betrieb

Für Stadionmiete, Instandhaltung, Trainer, Betreuer, Verwaltung, Reisen und Nachwuchs fehlen getrennte Erstliga-Werte. Die wirtschaftlichen Probleme der 1974 gegründeten 2. Bundesliga zeigen jedoch die Größenordnung des strukturellen Risikos: Nur sieben von 40 Vereinen schrieben 1974/75 schwarze Zahlen; die beiden Staffeln häuften 3,2 Mio. DM beziehungsweise 1,6 Mio. DM Schulden an. Hinzu kamen Lizenzanforderungen von 75.000 DM Bürgschaft und 25.000 DM Kaution je Verein [[28]](https://www.zeitspiel-magazin.de/ausgaben/35-1974-75.die-geburt-der-2.-bundesliga/). Diese Zweitligawerte sind kein Erstligaetat, belegen aber, dass Infrastruktur- und Personalkosten existenzbedrohend sein konnten.

Für die Simulation können folgende provisorische Jahreskorridore dienen:

| Ausgabenposition | Designkorridor |
|---|---:|
| Spieler einschließlich Prämien | 1.265.000–2.640.000 DM |
| Transferausgaben | 0–1.000.000 DM |
| Stadionmiete, Betrieb, Unterhalt | 150.000–500.000 DM |
| Trainer, Betreuer, Verwaltung | 250.000–700.000 DM |
| Reisen | 80.000–200.000 DM |
| Nachwuchs | 100.000–300.000 DM |
| Sonstige Kosten | 100.000–400.000 DM |
| **Gesamtkorridor** | **1.945.000–5.740.000 DM** |

Keine dieser Einzelpositionen außer dem Transferanker ist als reale Bilanzzahl eines Bundesligisten von 1975 belegt.

## Gesamtetat: kleine und große Vereine

Ein kleines Designszenario mit 12.000 Zuschauern, 5 DM Eintritt, 0,50 DM Catering-Netto, 100.000 DM Trikotsponsoring und niedrigen Nebenerlösen ergibt rund **1,69 Mio. DM Saisonumsatz** ohne Transfers. Ein großes Szenario mit 35.000 Zuschauern, 10 DM Eintritt, 1,50 DM Catering-Netto, 500.000 DM Trikotsponsoring und höheren Nebenerlösen erreicht rund **8,26 Mio. DM**.

Damit ist für die Simulation ein vorläufiger Umsatzkorridor von **1,7 bis 8,3 Mio. DM** vertretbar. Er ist keine rekonstruierte historische Etatstatistik. Zusammen mit dem modellierten Kostenkorridor von **1,9 bis 5,7 Mio. DM** erzeugt er die gewünschte Finanzdynamik: Kleine Vereine können trotz sparsamer Führung defizitär werden; große Zuschauermarken können Spitzentransfers finanzieren, tragen aber höhere Gehalts- und Erfolgsrisiken.

## Transfers und Spielerkosten 1974–1976

| Jahr/Saison | Spieler beziehungsweise Vorgang | Von | Zu | Ablöse/Kosten | Evidenzstatus |
|---|---|---|---|---:|---|
| 1974 | Aufhebung der Ablösebegrenzungen | – | – | kein Einzelbetrag | regulatorisch belegt [[6]](https://www.bpb.de/shop/zeitschriften/apuz/163804/wegmarken-aus-50-jahren-bundesliga/) [[7]](https://monami.hs-mittweida.de/files/2710/Bachelorarbeit_Roman_Harder.pdf) |
| 1974/75 | Einzeltransfers | nicht belastbar dokumentiert | nicht belastbar dokumentiert | nicht verfügbar | keine verlässliche zentrale DM-Reihe [[4]](https://de.wikipedia.org/wiki/Vorlage:Transferausgaben_und_-erl%C3%B6se_der_Vereine_der_Fu%C3%9Fball-Bundesliga) [[5]](https://www.transfermarkt.us/bundesliga/einnahmenausgaben/wettbewerb/L1) |
| 1975/76 | Einzeltransfers | nicht belastbar dokumentiert | nicht belastbar dokumentiert | nicht verfügbar | keine verlässliche zentrale DM-Reihe [[4]](https://de.wikipedia.org/wiki/Vorlage:Transferausgaben_und_-erl%C3%B6se_der_Vereine_der_Fu%C3%9Fball-Bundesliga) [[5]](https://www.transfermarkt.us/bundesliga/einnahmenausgaben/wettbewerb/L1) |
| 1976 | Roger van Gool | FC Brügge | 1. FC Köln | **1.000.000 DM** | dokumentierter Spitzenanker [[27]](https://de.wikipedia.org/wiki/Fu%C3%9Fball-Bundesliga) |

Die Quellenlage erlaubt keine seriöse längere Transferliste mit Ablösen. Zusätzliche Namen oder Beträge würden eine Scheingenauigkeit erzeugen.

## Umsetzungsorientierte Simulationshebel

1. **Zuschauer als Hauptmotor:** Tabellenlage, Gegner, Stadionkapazität und Form beeinflussen die Besucherzahl; jeder zusätzliche Zuschauer wirkt gleichzeitig auf Eintritt, Verpflegung und Programme.

2. **Preispolitik mit Nachfragewirkung:** Der Manager setzt einen Durchschnittspreis. Höhere Preise steigern den Erlös pro verkauftem Platz, können aber die Auslastung senken. Der historische Preis selbst bleibt ein kalibrierbarer Designparameter.

3. **Würstchenbuden und Ausschank:** Drei Betriebsformen sind sinnvoll: Eigenbetrieb mit höherem Risiko, Verpachtung mit fester Zahlung und Umsatzbeteiligung. Der entscheidende Wert ist der dem Verein verbleibende Nettoerlös je Besucher, nicht der Verkaufspreis der Wurst.

4. **Bandenwerbung:** Verträge sollten lokal, kurzfristiger und kleiner als Spitzentrikotsponsoring ausfallen. TV-Präsenz und sportlicher Erfolg erhöhen den Wert, ohne moderne Erlösdimensionen zu erreichen.

5. **Trikotsponsoring:** Historisch verankerte Vertragsstufen von **100.000, 275.000 und 500.000 DM** bieten belastbare Kalibrierungspunkte [[22]](https://trikotbuch.de/der-einzug-der-trikotwerbung/) [[21]](https://sport.sky.de/fussball/artikel/bundesliga-50-jahre-trikotwerbung-jaegermeister-war-in-braunschweig-vorreiter/12839476/33896). Ein Verein kann 1975 noch ohne Trikotsponsor starten.

6. **Fernsehgeld als begrenzte Basis:** Die zentrale Gesamtsumme beträgt 1975/76 **4,8 Mio. DM**; der tatsächliche Verteilungsschlüssel bleibt konfigurierbar [[14]](https://www.spiegel.de/sport/fussball/uebersicht-tv-gelder-von-1965-bis-heute-a-74669.html).

7. **Transfers als Liquiditätsschocks:** Der Grundetat enthält keine garantierten Transfererlöse. Ein Millionenwechsel ist ein seltenes Spitzenereignis, keine normale jährliche Ausgabe.

8. **Quellenunsicherheit sichtbar machen:** Historisch belegt sind Zuschauerzahlen, zentrale TV-Summen, einzelne Trikotsponsorverträge, die Deregulierung und der Millionenwechsel von 1976. Nur Größenordnungen sind Eintrittsumsätze und Gesamtetats. Kaum separat auffindbar sind Catering, Bandenwerbung, Mitgliedsbeiträge, Programme, Stadionbetrieb, Trainerstab, Verwaltung, Reisen und Nachwuchs. Diese Positionen sollten als editierbare Szenarioparameter und niemals als verborgene „historisch korrekte“ Festwerte implementiert werden.

---

## References

1. <https://www.bundesliga-gruppe.de/hintergrund/lizenzierungsverfahren/finanzkennzahlen-der-proficlubs/>
2. <https://www.dfl.de/de/hintergrund/lizenzierungsverfahren/finanzkennzahlen-der-proficlubs/>
3. <https://www.transfermarkt.us/bundesliga/transferbilanz/wettbewerb/L1>
4. <https://de.wikipedia.org/wiki/Vorlage:Transferausgaben_und_-erl%C3%B6se_der_Vereine_der_Fu%C3%9Fball-Bundesliga>
5. <https://www.transfermarkt.us/bundesliga/einnahmenausgaben/wettbewerb/L1>
6. <https://www.bpb.de/shop/zeitschriften/apuz/163804/wegmarken-aus-50-jahren-bundesliga/>
7. <https://monami.hs-mittweida.de/files/2710/Bachelorarbeit_Roman_Harder.pdf>
8. <http://www.remember-blaugelb.de/4/src/web/?c=Articles&a=showDay&m=07&d=04>
9. <https://www.stuttgarter-zeitung.de/inhalt.fussball-bundesliga-50-jahre-trikotwerbung-ganze-branche-muss-mast-dankbar-sein.c05cc8fc-e41b-45e6-9a10-1f1cc655b4b6.html>
10. <https://www.ndr.de/sport/fussball/50_jahre_bundesliga/Braunschweiger-Fussballrevolution-mit-Hirsch,braunschweig2433.html>
11. <https://www.trikotgeschichte.de/stadionzeitung/vereinsgeschichte/eintracht-braunschweig-jaegermeister/>
12. <https://bpb.de/gesellschaft/medien-und-sport/bundesliga/160779/geschichte-der-bundesliga>
13. <https://www.bpb.de/themen/sport/bundesliga/160779/der-lange-weg-zum-profi/>
14. <https://www.spiegel.de/sport/fussball/uebersicht-tv-gelder-von-1965-bis-heute-a-74669.html>
15. <https://monami.hs-mittweida.de/files/3984/Bachelorarbeit_Nicolas_Heck.pdf>
16. <https://datencenter.dfb.de/datencenter/bundesliga/zuschauerzahlen>
17. <https://www.transfermarkt.us/bundesliga/besucherzahlenentwicklung/wettbewerb/L1>
18. <https://de.wikipedia.org/wiki/Fu%C3%9Fball-Bundesliga_1975/76>
19. <https://en.wikipedia.org/wiki/1975%E2%80%9376_Bundesliga>
20. <http://www.bulibox.de/bundesliga/zuschauerzahlen.html>
21. <https://sport.sky.de/fussball/artikel/bundesliga-50-jahre-trikotwerbung-jaegermeister-war-in-braunschweig-vorreiter/12839476/33896>
22. <https://trikotbuch.de/der-einzug-der-trikotwerbung/>
23. <https://spobis.com/article/bundesliga-catering-wer-verdient-was>
24. <https://bellini-freiburg.de/wp-content/uploads/2024/11/Stadionwelt_12-24.pdf>
25. <https://www.stadionheft.de/vk_listen/witte_vk.pdf>
26. <https://www.sueddeutsche.de/sport/60-jahre-fussball-oberhaus-spiel-ohne-grenzen-bundesliga-wird-zur-liga-der-millionaere-dpa.urn-newsml-dpa-com-20090101-230810-99-788799>
27. <https://de.wikipedia.org/wiki/Fu%C3%9Fball-Bundesliga>
28. <https://www.zeitspiel-magazin.de/ausgaben/35-1974-75.die-geburt-der-2.-bundesliga/>

# Weltvereine tur – Türkei (1. Lig / Süper Lig)

Echte Vereinsnamen stehen **nur hier**. Datenformat: `docs/specs/WELTDATEN_SPEC.md`.
Erfasst: `t1` je Saison 1975/76–2025/26, Landespokal (Sieger/Finalist), Europapokal-Teilnehmer. Keine 2. Liga.

## Quellen

- **1. Liga 1975/76–2024/25:** berechnet aus allen Ligaspielen in `schochastics/football-data` (`games.parquet`,
  Wettbewerb „turkey“; für 1994–2024 deckungsgleich mit `jalapic/engsoccerdata` `turkey.csv`). Punkte 2/1/0 bis 1986/87,
  danach 3/1/0; bei Gleichstand direkter Vergleich, dann Tordifferenz, Tore. **Aus Datensatz berechnet.**
  Alle Meister gegen die bekannte Meisterliste geprüft (stimmen alle).
- **2011/12:** Play-offs mit halbierten Punkten – Meisterrunde (1–4) und Europa-Runde (5–8) von Hand gesetzt, **aus Wissen**.
- **2025/26:** Zusammensetzung zu Saisonbeginn (Reihenfolge = Platz 2024/25, Aufsteiger Izmit, Ankara Rot-Schwarz, Istanbul-Karagümrük hinten).
- **Europapokal:** `games.parquet` (Landesmeister/CL, UEFA-Pokal/EL, Conference League inkl. Qualifikation, bis Sept. 2025).
  Europapokal der Pokalsieger aus dem Pokalendspiel der Vorsaison abgeleitet (Sieger; war er Meister, der Finalist) – **Regel, ungeprüft**;
  1975/76 Istanbul Schwarz-Weiß als Pokalsieger 1974/75 **aus Wissen, ungeprüft**. 2025/26: Istanbul Gelb-Blau (EL) und Samsun (Conference League) nach dem Aus in der Qualifikation **aus Wissen** ergänzt.
- **Pokal (Sieger/Finalist):** **aus Wissen, ungeprüft** (bekannte Endspielliste). 2025/26 offen.

## Ligareformen / Besonderheiten

| Saisons | Vereine |
|---|---|
| 1975/76–1980/81 | 16 |
| 1981/82 | 17 |
| 1982/83–1984/85 | 18 |
| 1985/86–1986/87 | 19 |
| 1987/88 | 20 |
| 1988/89 | 19 |
| 1989/90 | 18 |
| 1990/91–1993/94 | 16 |
| 1994/95–2019/20 | 18 (2011/12 mit Play-offs) |
| 2020/21 | 21 (kein Absteiger 2019/20) |
| 2021/22 | 20 |
| 2022/23 | 19 (zwei Rückzüge nach dem Erdbeben) |
| 2023/24 | 20 |
| 2024/25 | 19 |
| 2025/26 | 18 |

- 2009/10: Ankaraspor vom Verband zwangsabgestiegen (Tabellenende).
- 2019/20 im Juni/Juli 2020 zu Ende gespielt (Spiele bis 15.8.2020 zählen zu 2019/20).
- Punktabzüge aus Verbandsentscheiden sind in den Daten nicht enthalten; Meister/Absteiger stimmen trotzdem.

## Fusionen, Umbenennungen, Zuordnung

- İstanbul Büyükşehir Belediyespor / İstanbul Başakşehir FK = „Istanbul-Başakşehir“ (eine ID).
- Ankaraspor (2004–2010) und Osmanlıspor (2015–2018) = „Ankara Lila“ (gleicher Verein, umbenannt).
- Hacettepe = Gençlerbirliği OFTAŞ (Farmteam von Gençlerbirliği) – eigene ID.
- Malatyaspor und Yeni Malatyaspor sind getrennte Vereine („Malatya“, „Malatya Gelb-Schwarz“); ebenso Gaziantepspor und Gaziantep FK („Gaziantep“, „Gaziantep-Şahinbey“)
  sowie Kayserispor und Kayseri Erciyesspor („Kayseri“, „Kayseri-Erciyes“).
- Erzurumspor und BB Erzurumspor = „Erzurum“. Kocaelispor = „Izmit“ (Stadt), Sakaryaspor = „Adapazarı“, Hatayspor = „Antakya“.

## Echter Name → Spielname / ID

| Echter Verein | Spielname | ID | Kürzel | Ort |
|---|---|---|---|---|
| (Çaykur) Rizespor | Rize | `tur-rize` | RIZ | Rize |
| Adana Demirspor | Adana Blau | `tur-adana-blau` | ADB | Adana |
| Adanaspor | Adana Orange | `tur-adana-orange` | ADO | Adana |
| Akhisarspor (Akhisar Belediyespor) | Akhisar | `tur-akhisar` | AKH | Akhisar |
| Akçaabat Sebatspor | Akçaabat | `tur-akcaabat` | AKC | Akçaabat |
| Alanyaspor | Alanya | `tur-alanya` | ALA | Alanya |
| Altay SK | Izmir Schwarz-Weiß | `tur-izmir-schwarz-weiss` | IZS | Izmir |
| Ankaraspor (2004–2010) / Osmanlıspor FK (2015–2018) | Ankara Lila | `tur-ankara-lila` | ALI | Ankara |
| Antalyaspor | Antalya | `tur-antalya` | ANT | Antalya |
| Aydınspor | Aydın | `tur-aydin` | AYD | Aydın |
| Bakırköyspor | Istanbul-Bakırköy | `tur-istanbul-bakirkoey` | IBA | Istanbul |
| Balıkesirspor | Balıkesir | `tur-balikesir` | BAL | Balıkesir |
| Beşiktaş JK | Istanbul Schwarz-Weiß | `tur-istanbul-schwarz-weiss` | ISW | Istanbul |
| Bodrum FK | Bodrum | `tur-bodrum` | BOD | Bodrum |
| Boluspor | Bolu | `tur-bolu` | BOL | Bolu |
| Bucaspor | Izmir-Buca | `tur-izmir-buca` | IZB | Izmir |
| Bursaspor | Bursa | `tur-bursa` | BUR | Bursa |
| Denizlispor | Denizli | `tur-denizli` | DEN | Denizli |
| Diyarbakırspor | Diyarbakır | `tur-diyarbakir` | DIY | Diyarbakır |
| Elazığspor | Elazığ | `tur-elazig` | ELA | Elazığ |
| Erzurumspor / BB Erzurumspor | Erzurum | `tur-erzurum` | ERZ | Erzurum |
| Eskişehirspor | Eskişehir | `tur-eskisehir` | ESK | Eskişehir |
| Etimesgut Şekerspor | Ankara-Etimesgut | `tur-ankara-etimesgut` | AET | Ankara |
| Eyüpspor | Istanbul-Eyüp | `tur-istanbul-eyuep` | IEY | Istanbul |
| Fatih Karagümrük SK | Istanbul-Karagümrük | `tur-istanbul-karaguemruek` | IKR | Istanbul |
| Fenerbahçe SK | Istanbul Gelb-Blau | `tur-istanbul-gelb-blau` | IGB | Istanbul |
| Galatasaray SK | Istanbul Gelb-Rot | `tur-istanbul-gelb-rot` | IGR | Istanbul |
| Gaziantep FK | Gaziantep-Şahinbey | `tur-gaziantep-sahinbey` | GSA | Gaziantep |
| Gaziantepspor | Gaziantep | `tur-gaziantep` | GAZ | Gaziantep |
| Gençlerbirliği SK | Ankara Rot-Schwarz | `tur-ankara-rot-schwarz` | ARS | Ankara |
| Giresunspor | Giresun | `tur-giresun` | GIR | Giresun |
| Göztepe SK | Izmir Gelb-Rot | `tur-izmir-gelb-rot` | IZG | Izmir |
| Hacettepe SK (Gençlerbirliği OFTAŞ) | Ankara-Hacettepe | `tur-ankara-hacettepe` | AHA | Ankara |
| Hatayspor | Antakya | `tur-antakya` | ANK | Antakya |
| İstanbul BB / İstanbul Başakşehir FK | Istanbul-Başakşehir | `tur-istanbul-basaksehir` | IBS | Istanbul |
| İstanbulspor | Istanbul Gelb-Schwarz | `tur-istanbul-gelb-schwarz` | IGS | Istanbul |
| Kahramanmaraşspor | Kahramanmaraş | `tur-kahramanmaras` | KAH | Kahramanmaraş |
| Kardemir Karabükspor | Karabük | `tur-karabuek` | KRB | Karabük |
| Karşıyaka SK | Izmir Grün-Rot | `tur-izmir-gruen-rot` | IZR | Izmir |
| Kasımpaşa SK | Istanbul-Kasımpaşa | `tur-istanbul-kasimpasa` | IKA | Istanbul |
| Kayseri Erciyesspor | Kayseri-Erciyes | `tur-kayseri-erciyes` | KER | Kayseri |
| Kayserispor | Kayseri | `tur-kayseri` | KAY | Kayseri |
| Kocaelispor | Izmit | `tur-izmit` | IZM | Izmit |
| Konyaspor | Konya | `tur-konya` | KON | Konya |
| Malatyaspor | Malatya | `tur-malatya` | MAL | Malatya |
| Manisaspor | Manisa | `tur-manisa` | MAN | Manisa |
| Mersin İdmanyurdu | Mersin | `tur-mersin` | MER | Mersin |
| MKE Ankaragücü | Ankara Gelb-Blau | `tur-ankara-gelb-blau` | AGB | Ankara |
| MKE Kırıkkalespor | Kırıkkale | `tur-kirikkale` | KIR | Kırıkkale |
| Orduspor | Ordu | `tur-ordu` | ORD | Ordu |
| Pendikspor | Istanbul-Pendik | `tur-istanbul-pendik` | IPE | Istanbul |
| Petrol Ofisi SK | Ankara-Petrol | `tur-ankara-petrol` | APE | Ankara |
| Sakaryaspor | Adapazarı | `tur-adapazari` | ADA | Adapazarı |
| Samsunspor | Samsun | `tur-samsun` | SAM | Samsun |
| Sarıyer SK | Istanbul-Sarıyer | `tur-istanbul-sariyer` | ISA | Istanbul |
| Siirtspor (Siirt Jet-PA) | Siirt | `tur-siirt` | SII | Siirt |
| Sivasspor | Sivas | `tur-sivas` | SIV | Sivas |
| Trabzonspor | Trabzon | `tur-trabzon` | TRA | Trabzon |
| Vanspor (Belediye Vanspor) | Van | `tur-van` | VAN | Van |
| Yeni Malatyaspor | Malatya Gelb-Schwarz | `tur-malatya-gelb-schwarz` | MGS | Malatya |
| Yozgatspor | Yozgat | `tur-yozgat` | YOZ | Yozgat |
| Zeytinburnuspor | Istanbul-Zeytinburnu | `tur-istanbul-zeytinburnu` | IZE | Istanbul |
| Zonguldakspor (Zonguldak Kömürspor) | Zonguldak | `tur-zonguldak` | ZON | Zonguldak |
| Çanakkale Dardanelspor | Çanakkale | `tur-canakkale` | CAN | Çanakkale |
| Ümraniyespor | Istanbul-Ümraniye | `tur-istanbul-uemraniye` | IUM | Istanbul |

## Unsicherheiten

- Pokalendspiele aus Wissen; Europapokal der Pokalsieger nach Regel.
- Reihenfolge bei Gleichstand nach direktem Vergleich berechnet; amtliche Kriterien wichen zeitweise ab (Tordifferenz).
- Farben vereinfacht.

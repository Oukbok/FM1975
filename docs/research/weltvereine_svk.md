# Weltvereine Slowakei (`svk`) – Recherche

Umfang: höchste slowakische Spielklasse 1993/94–2025/26 (1. liga, Corgoň liga, Fortuna liga, Niké liga),
Pokalsieger/-finalist, slowakische Europapokal-Teilnehmer. Vorgänger: Tschechoslowakei (`tch`). Schlüssel = Startjahr.

## Quellen und Herkunft der Daten
- **Datensätze (geprüft)**: 2024/25 Hauptrunde und Meisterrunde aus dem RSSSF-Spiegel `tabless/slow2025.txt`;
  Landesmeister-/CL-Teilnehmer bis 2016/17 aus `champs.csv`.
- **Aus Wissen, ungeprüft**: alle übrigen Tabellen (Meister und Pokalsieger sicher, Vizemeister meist; Mittelfeld,
  Absteiger und Ligagrößen 1996–2006 unsicher), Pokalfinalisten, Pokalsieger 2024/25, `cwc`/`uefa`/`el`/`ecl`,
  Aufsteiger 2025 (Prešov angenommen).
- Prüfwürdige Quellen: Wikipedia „<Saison> Slovak First Football League“, RSSSF `tabless/slow<jj>.html`.

## Besonderheiten
- Größen: 12 Vereine (1993–1996), 16 (1996/97–1999/2000), 12/10 in den 2000ern, ab 2006/07 12 Vereine, seit den
  2010ern mit Meister- und Abstiegsrunde.
- 1. FC Košice / FC VSS Košice / FC Košice = ein Spielverein „Košice“ (Insolvenzen und Neugründungen nicht abgebildet).
- Artmedia Petržalka (Meister 2004/05, 2007/08) = „Bratislava Petržalka“.

## Verfremdung
Übernommen aus `src/data/europe.ts`: Bratislava (Slovan). Inter Bratislava wie bei `tch` „Bratislava Gelb-Schwarz“,
Petržalka als Stadtteil. Übrige Vereine nach ihrer Stadt (Dukla nach Banská Bystrica, Zemplín nach Michalovce,
Železiarne nach Podbrezová, Pohronie nach Žiar nad Hronom).

| Echter Name | ID | Spielname |
|---|---|---|
| 1. FC Košice / FC VSS Košice / FC Košice | `svk-kosice` | Košice |
| Artmedia Petržalka (FC Petržalka) | `svk-bratislava-petrzalka` | Bratislava Petržalka |
| AS Trenčín (Laugaricio) | `svk-trencin` | Trenčín |
| Chemlon Humenné | `svk-humenne` | Humenné |
| DAC Dunajská Streda | `svk-dunajska-streda` | Dunajská Streda |
| Dukla Banská Bystrica | `svk-banska-bystrica` | Banská Bystrica |
| FC Nitra | `svk-nitra` | Nitra |
| FK Dubnica | `svk-dubnica` | Dubnica |
| FK Pohronie | `svk-pohronie` | Pohronie |
| FK Senica | `svk-senica` | Senica |
| Inter Bratislava | `svk-bratislava-gelb` | Bratislava Gelb-Schwarz |
| KFC Komárno | `svk-komarno` | Komárno |
| Koba Senec | `svk-senec` | Senec |
| Lokomotíva Košice | `svk-kosice-blau` | Košice Blau |
| Matador Púchov | `svk-puchov` | Púchov |
| MFK Ružomberok | `svk-ruzomberok` | Ružomberok |
| MFK Skalica | `svk-skalica` | Skalica |
| MŠK Žilina | `svk-zilina` | Žilina |
| Partizán Bardejov | `svk-bardejov` | Bardejov |
| Spartak Myjava | `svk-myjava` | Myjava |
| Spartak Trnava | `svk-trnava` | Trnava |
| Tatran Prešov | `svk-presov` | Prešov |
| ViOn Zlaté Moravce | `svk-zlate-moravce` | Zlaté Moravce |
| Zemplín Michalovce | `svk-michalovce` | Michalovce |
| ŠK Slovan Bratislava | `svk-bratislava` | Bratislava |
| Železiarne Podbrezová | `svk-podbrezova` | Podbrezová |

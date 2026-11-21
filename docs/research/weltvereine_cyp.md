# Weltvereine cyp – Zypern (First Division)

Echte Vereinsnamen stehen **nur hier**. Datenformat: `docs/specs/WELTDATEN_SPEC.md`.
Erfasst: `t1` je Saison, Landespokal (soweit bekannt), Europapokal-Teilnehmer. Keine 2. Liga.

## Quellen

- **1996/97–2024/25:** berechnet aus allen Ligaspielen in `schochastics/football-data` (`games.parquet`, „cyprus“), 3 Punkte,
  Gleichstand direkter Vergleich/Tordifferenz/Tore. Zweite Phase je Saison (Punkte bleiben): 2007/08–2012/13 Gruppen 1–4/5–8/9–12,
  danach Meister- und Abstiegsgruppe (6/6 bzw. 6/8). **Aus Datensatz berechnet**; alle Meister stimmen mit der Meisterliste.
- **1975/76–1995/96:** **aus Wissen, ungeprüft.** Meister = Landesmeister-Teilnehmer der Folgesaison, Zweiter = UEFA-Pokal-Teilnehmer
  der Folgesaison (beides aus dem Datensatz); übrige 12 Plätze = Vereine der Epoche in grober Stärke-Reihenfolge (Zusammensetzung unsicher).
- **2019/20:** wegen der Pandemie abgebrochen, kein Meister; Stand beim Abbruch.
- **2025/26:** Zusammensetzung zu Saisonbeginn; Aufsteiger (Nikosia Schwarz-Grün, Chloraka, Ypsonas) **aus Wissen, ungeprüft**.
- **Europapokal:** `schochastics/football-data` (`games.parquet`, alle Spiele Landesmeister/CL, UEFA-Pokal/EL, Conference League
  inkl. Qualifikation, bis Sept. 2025; Saisonwechsel 15. Juni). **Aus Datensatz.**
  Europapokal der Pokalsieger: Pokalsieger der Vorsaison (war er Meister, fehlt der Eintrag – Finalisten nicht erfasst).
- **Pokal:** nur Sieger, **aus Wissen**; 1990er/2000er gegen die UEFA-Pokal-Teilnehmer des Datensatzes plausibilisiert. 2019/20 kein Pokal.

## Fusionen

- 1994: Pezoporikos und EPA Larnaka → AEK Larnaka („Larnaka Gelb-Grün“, eigene ID).
- 2000: APOP Paphos und Evagoras → AEP Paphos („Paphos“); Pafos FC (ab 2014) eigene ID „Paphos Blau-Weiß“.
- Flüchtlingsvereine aus Famagusta/Morfou/Kyrenia tragen den Herkunftsort (Spielstätte heute Larnaka/Nikosia).

## Echter Name → Spielname / ID

| Echter Verein | Spielname | ID | Kürzel | Ort |
|---|---|---|---|---|
| AE Kouklion | Kouklia | `cyp-kouklia` | KOU | Kouklia |
| AEK Larnaka (1994 aus Pezoporikos und EPA) | Larnaka Gelb-Grün | `cyp-larnaka-gelb-gruen` | LGG | Larnaka |
| AEL Limassol | Limassol Gelb-Blau | `cyp-limassol-gelb-blau` | LIG | Limassol |
| AEP Paphos (2000 aus APOP und Evagoras) | Paphos | `cyp-paphos` | PAP | Paphos |
| AEZ Zakakiou | Zakaki | `cyp-zakaki` | ZAK | Limassol |
| Akritas Chlorakas | Chloraka | `cyp-chloraka` | CHL | Chloraka |
| Alki Larnaka | Larnaka Rot-Blau | `cyp-larnaka-rot-blau` | LRB | Larnaka |
| Alki Oroklinis | Oroklini | `cyp-oroklini` | ORO | Oroklini |
| Anagennisi Deryneia | Deryneia | `cyp-deryneia` | DER | Deryneia |
| Anorthosis Famagusta | Famagusta Blau | `cyp-famagusta-blau` | FAB | Larnaka |
| AO Ayia Napa | Ayia Napa | `cyp-ayia-napa` | AYN | Ayia Napa |
| APEP Pitsilia | Kyperounta | `cyp-kyperounta` | KYP | Kyperounta |
| APOEL Nikosia | Nikosia Gelb-Blau | `cyp-nikosia-gelb-blau` | NGB | Nikosia |
| Apollon Limassol | Limassol Blau-Weiß | `cyp-limassol-blau-weiss` | LIB | Limassol |
| APOP Kinyras Peyias | Peyia | `cyp-peyia` | PEY | Peyia |
| APOP Paphos | Paphos Gelb | `cyp-paphos-gelb` | PGE | Paphos |
| Aris Limassol | Limassol Grün-Weiß | `cyp-limassol-gruen-weiss` | LGW | Limassol |
| Atromitos Yeroskipou | Geroskipou | `cyp-geroskipou` | GER | Geroskipou |
| Digenis Akritas Morphou | Morfou | `cyp-morfou` | MOR | Nikosia |
| Doxa Katokopias | Katokopia | `cyp-katokopia` | KAT | Peristerona |
| Enosis Neon Paralimni | Paralimni | `cyp-paralimni` | PAR | Paralimni |
| Enosis Neon Thoi Lakatamias | Lakatamia | `cyp-lakatamia` | LAK | Lakatamia |
| EPA Larnaka | Larnaka Grün | `cyp-larnaka-gruen` | LGR | Larnaka |
| Ermis Aradippou | Aradippou | `cyp-aradippou` | ARA | Aradippou |
| Ethnikos Achna | Achna | `cyp-achna` | ACH | Dasaki Achnas |
| Ethnikos Assia | Assia | `cyp-assia` | ASS | Nikosia |
| Evagoras Paphos | Paphos Rot | `cyp-paphos-rot` | PRO | Paphos |
| Karmiotissa | Pano Polemidia | `cyp-pano-polemidia` | PPO | Pano Polemidia |
| Krasava ENY Ypsonas | Ypsonas | `cyp-ypsonas` | YPS | Ypsonas |
| Nea Salamis Famagusta | Famagusta Rot | `cyp-famagusta-rot` | FAR | Larnaka |
| Olympiakos Nikosia | Nikosia Schwarz-Grün | `cyp-nikosia-schwarz-gruen` | NSG | Nikosia |
| Omonia 29is Maiou | Nikosia Weiß-Grün | `cyp-nikosia-weiss-gruen` | NWG | Nikosia |
| Omonia Aradippou | Aradippou Grün | `cyp-aradippou-gruen` | ARG | Aradippou |
| Omonia Nikosia | Nikosia Grün | `cyp-nikosia-gruen` | NIG | Nikosia |
| Onisillos Sotira | Sotira | `cyp-sotira` | SOT | Sotira |
| Othellos Athienou | Athienou | `cyp-athienou` | ATH | Athienou |
| PAEEK (Keryneia) | Keryneia | `cyp-keryneia` | KER | Nikosia |
| Pafos FC (ab 2014) | Paphos Blau-Weiß | `cyp-paphos-blau-weiss` | PBW | Paphos |
| Pezoporikos Larnaka | Larnaka Rot-Weiß | `cyp-larnaka-rot-weiss` | LRW | Larnaka |

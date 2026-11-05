# Weltvereine gre – Griechenland (Alpha Ethniki / Super League)

Echte Vereinsnamen stehen **nur hier**. Datenformat: `docs/specs/WELTDATEN_SPEC.md`.
Erfasst: `t1` je Saison 1975/76–2025/26, Landespokal (Sieger/Finalist), Europapokal-Teilnehmer. Keine 2. Liga.

## Quellen

- **1. Liga 1987/88–1992/93 und 1994/95–2024/25:** berechnet aus allen Ligaspielen in `schochastics/football-data` (`games.parquet`,
  Wettbewerb „greece“; ab 1994 deckungsgleich mit `jalapic/engsoccerdata` `greece.csv`). Punkte 2/1/0 bis 1991/92, danach 3/1/0;
  Gleichstand: direkter Vergleich, Tordifferenz, Tore. Play-off-Spiele um die Europapokalplätze (2007/08–2018/19) zählen nicht zur Tabelle.
  Ab 2019/20 Meister- und Abstiegsgruppe (Punkte bleiben): `t1` = Gruppe 1–6, dann 7–14; 2024/25 Gruppen 1–4, 5–8, 9–14. **Aus Datensatz berechnet.**
- **1975/76–1986/87 und 1993/94:** **aus Wissen, ungeprüft.** Meister und Europapokalplätze gegen die Europapokal-Teilnahmen
  der Folgesaison (Datensatz) geprüft; Zusammensetzung und Mittelfeld/Absteiger unsicher. Ligagröße 18 (1986/87: 16) angenommen.
- **2025/26:** Zusammensetzung zu Saisonbeginn (Reihenfolge = Platz 2024/25, Aufsteiger Larisa, Kifisia hinten).
- **Europapokal:** `games.parquet` (Landesmeister/CL, UEFA-Pokal/EL, Conference League inkl. Qualifikation, bis Sept. 2025).
  Europapokal der Pokalsieger aus dem Pokalendspiel der Vorsaison abgeleitet (Sieger; war er Meister, der Finalist) – **Regel, ungeprüft**
  (1975/76 ohne Eintrag: Finalist Saloniki spielte im UEFA-Pokal).
- **Pokal (Sieger/Finalist):** **aus Wissen, ungeprüft** (bekannte Endspielliste). 2025/26 offen.

## Besonderheiten / Korrekturen

- 2010/11: Volos Rot (Olympiakos Volos) und Kavala wegen Spielmanipulation zwangsabgestiegen – ans Tabellenende gesetzt.
- 2014/15: Niki Volos ausgeschlossen; Datensatz vermischt Play-off-Spiele → Meister Piräus gesetzt, Rest berechnet.
- 2019/20: Xanthi zwangsabgestiegen (ans Ende), PAOK −7 Punkte (nicht eingerechnet, Platz 2 bleibt).
- Weitere Punktabzüge (häufig in Griechenland) sind in den Daten nicht enthalten; Meister/Europapokalplätze geprüft.
- „Apollon Larisas“ im Datensatz 1988–1992 = AEL Larisa (Namensfehler der Quelle).

## Echter Name → Spielname / ID

| Echter Verein | Spielname | ID | Kürzel | Ort |
|---|---|---|---|---|
| AEK Athen | Athen Gelb | `gre-athen-gelb` | ATE | Athen |
| AEL Kalloni | Kalloni | `gre-kalloni` | KLO | Kalloni |
| AEL Larisa | Larisa | `gre-larisa` | LAR | Larisa |
| Akratitos | Ano Liosia | `gre-ano-liosia` | ANL | Ano Liosia |
| AO Kavala | Kavala | `gre-kavala` | KAV | Kavala |
| AO Kerkyra | Korfu | `gre-korfu` | KRF | Korfu |
| AO Kifisia | Kifisia | `gre-kifisia` | KIF | Kifisia |
| Apollon Kalamarias | Kalamaria | `gre-kalamaria` | KLM | Kalamaria |
| Apollon Smyrnis (Apollon Athen) | Athen Blau-Weiß | `gre-athen-blau-weiss` | ABW | Athen |
| Aris Saloniki | Saloniki Gelb | `gre-saloniki-gelb` | SGE | Saloniki |
| Asteras Tripolis | Tripoli | `gre-tripoli` | TRP | Tripoli |
| Athinaikos | Athen-Vyronas | `gre-athen-vyronas` | AVY | Athen |
| Atromitos | Peristeri | `gre-peristeri` | PER | Peristeri |
| Chalkidona | Agios Ioannis Rentis | `gre-agios-ioannis-rentis` | AIR | Agios Ioannis Rentis |
| Diagoras Rhodos | Rhodos Blau-Weiß | `gre-rhodos-blau-weiss` | RBW | Rhodos |
| Doxa Drama | Drama | `gre-drama` | DRA | Drama |
| Edessaikos | Edessa | `gre-edessa` | EDE | Edessa |
| Egaleo (AO Aigaleo) | Egaleo | `gre-egaleo` | EGA | Egaleo |
| Ergotelis | Iraklio Gelb-Schwarz | `gre-iraklio-gelb-schwarz` | IGS | Iraklio |
| Ethnikos Asteras | Athen-Kaisariani | `gre-athen-kaisariani` | AKA | Athen |
| Ethnikos Piräus | Piräus Blau-Weiß | `gre-piraeus-blau-weiss` | PBW | Piräus |
| FAS Naoussa | Naoussa | `gre-naoussa` | NAO | Naoussa |
| Ionikos Nikaia | Nikaia | `gre-nikaia` | NIK | Nikaia |
| Iraklis Saloniki | Saloniki Blau-Weiß | `gre-saloniki-blau-weiss` | SBW | Saloniki |
| Kalamata | Kalamata | `gre-kalamata` | KLA | Kalamata |
| Kallithea (Athens Kallithea) | Kallithea | `gre-kallithea` | KAL | Kallithea |
| Kastoria | Kastoria | `gre-kastoria` | KAS | Kastoria |
| Levadiakos | Livadia | `gre-livadia` | LIV | Livadia |
| Niki Volos | Volos Blau-Weiß | `gre-volos-blau-weiss` | VBW | Volos |
| OFI Kreta | Iraklio | `gre-iraklio` | IRA | Iraklio |
| Olympiakos Piräus | Piräus | `gre-piraeus` | PRS | Piräus |
| Olympiakos Volos | Volos Rot | `gre-volos-rot` | VOR | Volos |
| Panachaiki | Patras | `gre-patras` | PAT | Patras |
| Panaitolikos | Agrinio | `gre-agrinio` | AGR | Agrinio |
| Panathinaikos | Athen Grün | `gre-athen-gruen` | ATG | Athen |
| Panelefsiniakos | Elefsina | `gre-elefsina` | ELE | Elefsina |
| Paniliakos | Pyrgos | `gre-pyrgos` | PYR | Pyrgos |
| Panionios | Nea Smyrni | `gre-nea-smyrni` | NSM | Nea Smyrni |
| Panserraikos | Serres | `gre-serres` | SER | Serres |
| Panthrakikos | Komotini | `gre-komotini` | KOM | Komotini |
| PAOK Saloniki | Saloniki | `gre-saloniki` | SAL | Saloniki |
| PAS Giannina | Ioannina | `gre-ioannina` | IOA | Ioannina |
| PAS Korinthos | Korinth | `gre-korinth` | KOT | Korinth |
| PAS Lamia 1964 | Lamia | `gre-lamia` | LAM | Lamia |
| Pierikos Katerini | Katerini | `gre-katerini` | KAT | Katerini |
| Platanias | Chania | `gre-chania` | CHA | Chania |
| Proodeftiki | Korydallos | `gre-korydallos` | KOR | Korydallos |
| Rodos FC | Rhodos | `gre-rhodos` | RHO | Rhodos |
| Skoda Xanthi | Xanthi | `gre-xanthi` | XAN | Xanthi |
| Thrasyvoulos Fylis | Fyli | `gre-fyli` | FYL | Fyli |
| Trikala | Trikala | `gre-trikala` | TRI | Trikala |
| Veria | Veria | `gre-veria` | VER | Veria |
| Volos NFC | Volos | `gre-volos` | VOL | Volos |

## Verfremdung

- Vorhandene Spielnamen übernommen: Olympiakos = „Piräus“, Panathinaikos = „Athen Grün“, PAOK = „Saloniki“, AEK = „Athen Gelb“ (worldSeed), OFI = „Iraklio“, AEL = „Larisa“.
- Mehrere Vereine einer Stadt über Farbe oder Stadtteil/Vorort: „Saloniki Gelb“ (Aris), „Saloniki Blau-Weiß“ (Iraklis), „Piräus Blau-Weiß“ (Ethnikos),
  „Nea Smyrni“ (Panionios), „Peristeri“ (Atromitos), „Athen-Vyronas“, „Athen-Kaisariani“, „Volos“/„Volos Rot“/„Volos Blau-Weiß“, „Rhodos“/„Rhodos Blau-Weiß“.

## Unsicherheiten

- 1975/76–1986/87 und 1993/94 aus Wissen (siehe oben) – deutlich unsicherer als die übrigen Saisons.
- Pokalendspiele aus Wissen; Europapokal der Pokalsieger nach Regel.

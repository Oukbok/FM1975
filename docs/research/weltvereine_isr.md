# Weltvereine isr – Israel (Liga Leumit / Ligat ha’Al)

Echte Vereinsnamen stehen **nur hier**. Datenformat: `docs/specs/WELTDATEN_SPEC.md`.
Erfasst: `t1` je Saison, Landespokal (soweit bekannt), Europapokal-Teilnehmer. Keine 2. Liga.

Israel spielt seit 1992/93 in UEFA-Wettbewerben (countries.ts `from: 1992`) – erfasst 1992/93–2025/26.

## Quellen

- **1995/96–2024/25:** berechnet aus allen Ligaspielen in `schochastics/football-data` (`games.parquet`, „israel“), 3 Punkte.
  2009/10–2011/12 nach 30 Runden Punkte halbiert (Meister-/Mittel-/Abstiegsrunde 6/4/6), ab 2012/13 Meister- und Abstiegsgruppe 6/8 (Punkte bleiben).
  **Aus Datensatz berechnet**; Meister geprüft. 2024/25 Meister Tel Aviv Gelb-Blau gesetzt (Datensatz unvollständig).
  Im Datensatz fehlt bei Hapoel Jerusalem 2021–2025 der Name (aus der Vereinskennung ergänzt).
- **1992/93–1994/95:** **aus Wissen, ungeprüft** (Meister/Europapokalplatz gegen Datensatz geprüft, Rest Vereine der Epoche).
- **2025/26:** Zusammensetzung zu Saisonbeginn (Vorjahresplatz, Aufsteiger Tel Aviv Rot und Petach Tikva Rot hinten).
- **Europapokal:** `schochastics/football-data` (`games.parquet`, alle Spiele Landesmeister/CL, UEFA-Pokal/EL, Conference League
  inkl. Qualifikation, bis Sept. 2025; Saisonwechsel 15. Juni). **Aus Datensatz.**
  Europapokal der Pokalsieger 1993/94–1998/99 aus dem Pokalsieger der Vorsaison abgeleitet.
- **Pokal:** nur Sieger, **aus Wissen** (gegen die Europapokal-Teilnahmen plausibilisiert). 2020/21 offen.

## Zuordnung

- Ironi Ashdod und MS Ashdod (Fusion 1999) = „Ashdod“. Hapoel Nazareth Illit / Hapoel Nof HaGalil = „Nof HaGalil“.
- Mehrere Vereine einer Stadt über Farben bzw. Stadtteil: Tel Aviv Gelb-Blau/Rot/Gelb-Schwarz, Tel Aviv-Hatikva, Haifa Grün/Rot,
  Jerusalem Gelb-Schwarz/Rot, Petach Tikva Blau/Rot, Ramat Gan Blau-Weiß/Rot.

## Echter Name → Spielname / ID

| Echter Verein | Spielname | ID | Kürzel | Ort |
|---|---|---|---|---|
| Beitar Jerusalem | Jerusalem Gelb-Schwarz | `isr-jerusalem-gelb-schwarz` | JGS | Jerusalem |
| Beitar Tel Aviv | Tel Aviv Gelb-Schwarz | `isr-tel-aviv-gelb-schwarz` | TGS | Tel Aviv |
| Bnei Sakhnin | Sachnin | `isr-sachnin` | SAC | Sachnin |
| Bnei Yehuda Tel Aviv | Tel Aviv-Hatikva | `isr-tel-aviv-hatikva` | THA | Tel Aviv |
| Hakoah Amidar Ramat Gan | Ramat Gan Blau-Weiß | `isr-ramat-gan-blau-weiss` | RGB | Ramat Gan |
| Hapoel Acre | Akko | `isr-akko` | AKK | Akko |
| Hapoel Ashkelon | Aschkelon | `isr-aschkelon` | ASK | Aschkelon |
| Hapoel Be'er Sheva | Beer Sheva | `isr-beer-sheva` | BEE | Beer Sheva |
| Hapoel Beit She'an | Beit Shean | `isr-beit-shean` | BSH | Beit Shean |
| Hapoel Hadera | Hadera | `isr-hadera` | HAD | Hadera |
| Hapoel Haifa | Haifa Rot | `isr-haifa-rot` | HAR | Haifa |
| Hapoel Ironi Kiryat Shmona | Kiryat Schmona | `isr-kiryat-schmona` | KSC | Kiryat Schmona |
| Hapoel Ironi Rishon LeZion | Rischon LeZion | `isr-rischon-lezion` | RLZ | Rischon LeZion |
| Hapoel Jerusalem | Jerusalem Rot | `isr-jerusalem-rot` | JRO | Jerusalem |
| Hapoel Kfar Saba | Kfar Saba | `isr-kfar-saba` | KFS | Kfar Saba |
| Hapoel Nazareth Illit / Hapoel Nof HaGalil | Nof HaGalil | `isr-nof-hagalil` | NHG | Nof HaGalil |
| Hapoel Petah Tikva | Petach Tikva Rot | `isr-petach-tikva-rot` | PTR | Petach Tikva |
| Hapoel Ra'anana | Raanana | `isr-raanana` | RAA | Raanana |
| Hapoel Ramat Gan | Ramat Gan Rot | `isr-ramat-gan-rot` | RGR | Ramat Gan |
| Hapoel Taibe | Taibe | `isr-taibe` | TAI | Taibe |
| Hapoel Tel Aviv | Tel Aviv Rot | `isr-tel-aviv-rot` | TAR | Tel Aviv |
| Hapoel Tzafririm Holon | Holon | `isr-holon` | HOL | Holon |
| Ironi Ashdod / MS Ashdod (1999 fusioniert) | Ashdod | `isr-ashdod` | ASH | Ashdod |
| Ironi Ramat HaSharon | Ramat HaScharon | `isr-ramat-hascharon` | RHS | Ramat HaScharon |
| Ironi Tiberias | Tiberias | `isr-tiberias` | TIB | Tiberias |
| Maccabi Ahi Nazareth | Nazareth | `isr-nazareth` | NAZ | Nazareth |
| Maccabi Bnei Reineh | Reineh | `isr-reineh` | REI | Reineh |
| Maccabi Haifa | Haifa Grün | `isr-haifa-gruen` | HAG | Haifa |
| Maccabi Herzliya | Herzlia | `isr-herzlia` | HER | Herzlia |
| Maccabi Jaffa | Jaffa | `isr-jaffa` | JAF | Tel Aviv |
| Maccabi Kiryat Ata | Kiryat Ata | `isr-kiryat-ata` | KAT | Kiryat Ata |
| Maccabi Netanya | Netanya | `isr-netanya` | NET | Netanya |
| Maccabi Petah Tikva | Petach Tikva Blau | `isr-petach-tikva-blau` | PTB | Petach Tikva |
| Maccabi Tel Aviv | Tel Aviv Gelb-Blau | `isr-tel-aviv-gelb-blau` | TGB | Tel Aviv |
| Sektzia Nes Tziona | Nes Ziona | `isr-nes-ziona` | NES | Nes Ziona |
| Shimshon Tel Aviv | Tel Aviv-Shimshon | `isr-tel-aviv-shimshon` | TSH | Tel Aviv |

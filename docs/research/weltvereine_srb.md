# Weltvereine Serbien (`srb`) – Recherche

Umfang: höchste Spielklasse 1992/93–2025/26 – bis 2002/03 Liga der **BR Jugoslawien**, 2003/04–2005/06
**Serbien und Montenegro** (montenegrinische Vereine enthalten, wie in `src/data/world/countries.ts` als Nachfolger
von `yug` definiert), ab 2006/07 Serbische SuperLiga. Pokalsieger/-finalist, Europapokal-Teilnehmer. Schlüssel = Startjahr.

## Quellen und Herkunft der Daten
- **Datensätze (geprüft)**: 2024/25 Hauptrunde und Meisterrunde aus dem RSSSF-Spiegel `tabless/serv2025.txt`;
  Landesmeister-/CL-Teilnehmer bis 2016/17 aus `champs.csv`.
- **Aus Wissen, ungeprüft**: alle übrigen Tabellen (Meister, Pokalsieger, Vizemeister sicher; Mittelfeld,
  Absteiger und die zweigeteilte Liga 1993–1995 grob), Pokalfinalisten, `cwc`/`uefa`/`el`/`ecl`; Rückkehr in den
  Europapokal (1995/96 angenommen), Aufsteiger 2025.
- Prüfwürdige Quellen: Wikipedia „<Saison> First League of FR Yugoslavia“ / „Serbian SuperLiga“, RSSSF `tabless/serv<jj>.html`.

## Besonderheiten
- 1992/93–1994/95: Ausschluss aus den UEFA-Wettbewerben (UN-Sanktionen) – `euro` leer.
- 1993/94–1994/95: Liga in zwei Staffeln (A/B) mit Auf-/Abstieg nach jeder Halbserie; hier eine Gesamtreihenfolge.
- 1998/99: Saison wegen der NATO-Luftangriffe abgebrochen.
- 2006/07–2008/09 SuperLiga mit 12, danach 16 Vereinen; 2019/20–2020/21 20 Vereine; ab 2015/16 Meister- und
  Abstiegsrunde mit halbierten Punkten.
- 2014/15: Roter Stern ohne Europapokal-Zulassung (finanzielle Auflagen).
- Sartid Smederevo = FK Smederevo (ein Verein).

## Verfremdung
Übernommen wie bei `yug`: Belgrad Rot (Roter Stern), Belgrad Schwarz-Weiß (Partizan), Belgrad Blau-Weiß (OFK),
Belgrad Banjica (Rad). Weitere Belgrader Vereine nach Stadtteil: Čukarica, Vračar (Obilić), Železnik, Bežanija, Borča,
Voždovac, Neu-Belgrad (IMT). Zemun bleibt eigener Ort. Proleter Novi Sad „Novi Sad Gelb“.

| Echter Name | ID | Spielname |
|---|---|---|
| Bežanija | `srb-belgrad-bezanija` | Belgrad Bežanija |
| Borac Čačak | `srb-cacak` | Čačak |
| BSK Borča | `srb-belgrad-borca` | Belgrad Borča |
| Budućnost Podgorica | `srb-podgorica` | Podgorica |
| Dinamo Vranje | `srb-vranje` | Vranje |
| FK Bečej | `srb-becej` | Bečej |
| FK Inđija | `srb-indija` | Inđija |
| FK Jagodina | `srb-jagodina` | Jagodina |
| FK Loznica | `srb-loznica` | Loznica |
| FK Novi Pazar | `srb-novi-pazar` | Novi Pazar |
| FK Priština | `srb-pristina` | Priština |
| FK Rad | `srb-belgrad-banjica` | Belgrad Banjica |
| FK Zemun | `srb-zemun` | Zemun |
| Hajduk Kula | `srb-kula` | Kula |
| IMT Novi Beograd | `srb-belgrad-neu` | Belgrad Neu-Belgrad |
| Javor Ivanjica | `srb-ivanjica` | Ivanjica |
| Jedinstvo Ub | `srb-ub` | Ub |
| Kolubara Lazarevac | `srb-lazarevac` | Lazarevac |
| Mačva Šabac | `srb-sabac` | Šabac |
| Metalac Gornji Milanovac | `srb-gornji-milanovac` | Gornji Milanovac |
| Mladost Lučani | `srb-lucani` | Lučani |
| Napredak Kruševac | `srb-krusevac` | Kruševac |
| Obilić | `srb-belgrad-vracar` | Belgrad Vračar |
| OFK Beograd | `srb-belgrad-blau-weiss` | Belgrad Blau-Weiß |
| OFK Kikinda | `srb-kikinda` | Kikinda |
| Partizan Belgrad | `srb-belgrad-schwarz-weiss` | Belgrad Schwarz-Weiß |
| Proleter Novi Sad | `srb-novi-sad-gelb` | Novi Sad Gelb |
| Proleter Zrenjanin | `srb-zrenjanin` | Zrenjanin |
| Radnik Surdulica | `srb-surdulica` | Surdulica |
| Radnički Kragujevac | `srb-kragujevac` | Kragujevac |
| Radnički Niš | `srb-nis` | Niš |
| Roter Stern Belgrad (Crvena zvezda) | `srb-belgrad-rot` | Belgrad Rot |
| Rudar Pljevlja | `srb-pljevlja` | Pljevlja |
| Sartid / FK Smederevo | `srb-smederevo` | Smederevo |
| Sloboda Užice | `srb-uzice` | Užice |
| Spartak Subotica | `srb-subotica` | Subotica |
| Sutjeska Nikšić | `srb-niksic` | Nikšić |
| Tekstilac Odžaci | `srb-odzaci` | Odžaci |
| TSC Bačka Topola | `srb-backa-topola` | Bačka Topola |
| Vojvodina Novi Sad | `srb-novi-sad` | Novi Sad |
| Voždovac | `srb-belgrad-vozdovac` | Belgrad Voždovac |
| Zeta Golubovci | `srb-golubovci` | Golubovci |
| Zlatibor Čajetina | `srb-cajetina` | Čajetina |
| Čukarički | `srb-belgrad-cukarica` | Belgrad Čukarica |
| Železnik | `srb-belgrad-zeleznik` | Belgrad Železnik |
| Železničar Pančevo | `srb-pancevo` | Pančevo |

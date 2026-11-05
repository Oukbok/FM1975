// =============================================================================
// DAMALS VS. HEUTE – Unterschiede zum Fußball von 2025/26 (reine Daten)
// -----------------------------------------------------------------------------
// Jeder Eintrag gilt von `from` bis einschließlich `to` (Saison-Startjahre; `to` =
// letzte Saison, in der es noch anders war als heute). Nur Dinge, die heute ANDERS
// sind. Wo das Spiel eine Regel zu einem Jahr umsetzt, stimmen die Jahre überein
// (z. B. 3-Punkte-Regel und Bosman zur Saison 1995/96, Rückpassregel 1992/93).
// Format: ./types.ts. Datei darf groß sein (reine Daten).
// =============================================================================

import type { DifferenceToToday } from './types';

export const DIFFERENCES: DifferenceToToday[] = [
  // --- Regeln -----------------------------------------------------------------
  {
    from: 1975, to: 1994, topic: 'regeln',
    title: 'Zwei Punkte für einen Sieg',
    then: 'Ein Sieg bringt zwei Punkte, ein Remis einen. Unentschieden sind fast so viel wert wie Siege.',
    today: 'Seit 1995/96 zählt ein Sieg drei Punkte.',
  },
  {
    from: 1975, to: 1994, topic: 'regeln',
    title: 'Nur zwei Auswechslungen',
    then: 'Pro Spiel dürfen nur zwei Spieler eingewechselt werden. Wer sich danach verletzt, hinterlässt eine Lücke.',
    today: 'Fünf Wechsel in drei Unterbrechungen sind erlaubt.',
  },
  {
    from: 1995, to: 2019, topic: 'regeln',
    title: 'Drei Auswechslungen',
    then: 'Pro Spiel sind drei Wechsel erlaubt.',
    today: 'Seit 2020/21 sind fünf Wechsel erlaubt.',
  },
  {
    from: 1975, to: 1991, topic: 'regeln',
    title: 'Rückpass in die Hände',
    then: 'Der Torwart darf jeden Rückpass aufnehmen – Ballhalten auf Zeit ist ein beliebtes Mittel.',
    today: 'Absichtliche Rückpässe mit dem Fuß darf er seit 1992 nicht mehr in die Hand nehmen.',
  },
  {
    from: 1975, to: 1989, topic: 'regeln',
    title: 'Gleiche Höhe ist Abseits',
    then: 'Ein Angreifer auf gleicher Höhe mit dem vorletzten Verteidiger steht im Abseits.',
    today: 'Gleiche Höhe ist seit 1990 kein Abseits, über knappe Fälle entscheiden kalibrierte Linien.',
  },
  {
    from: 1975, to: 1989, topic: 'regeln',
    title: 'Notbremse ohne Rot',
    then: 'Wer eine klare Torchance per Foul verhindert, kommt oft mit einer Verwarnung davon.',
    today: 'Die Notbremse wird seit 1990 grundsätzlich mit Platzverweis bestraft (bei Elfmeter teils abgemildert).',
  },
  {
    from: 1975, to: 1990, topic: 'regeln',
    title: 'Keine Gelb-Rote Karte',
    then: 'Wer zum zweiten Mal verwarnt wird, sieht glatt Rot.',
    today: 'Seit 1991 gibt es Gelb-Rot mit kürzerer Sperre.',
  },
  {
    from: 1975, to: 1978, topic: 'regeln',
    title: 'Keine Gelbsperren',
    then: 'Gesammelte Gelbe Karten führen in der Bundesliga noch nicht zu einer Sperre.',
    today: 'Nach der fünften Gelben Karte ist ein Spieler gesperrt.',
  },
  {
    from: 1975, to: 1997, topic: 'regeln',
    title: 'Grätsche von hinten erlaubt',
    then: 'Das Hineingrätschen von hinten gehört zum Handwerk von Abwehrspielern.',
    today: 'Seit 1998 gilt es als grobes Foulspiel, meist mit Rot.',
  },
  {
    from: 1975, to: 2018, topic: 'regeln',
    title: 'Keine Karten für Trainer',
    then: 'Trainer werden bei Unsportlichkeit nur ermahnt oder auf die Tribüne geschickt.',
    today: 'Seit 2019/20 sehen auch Trainer Gelb und Rot.',
  },
  {
    from: 1975, to: 1993, topic: 'regeln',
    title: 'Nummern 1 bis 11',
    then: 'Rückennummern werden je Spiel nach Position vergeben, Namen stehen nicht auf dem Trikot.',
    today: 'Jeder Spieler hat eine feste Nummer für die Saison, darüber steht sein Name.',
  },
  {
    from: 1995, to: 2003, topic: 'regeln',
    title: 'Golden Goal',
    then: 'Bei großen Turnieren entscheidet in der Verlängerung das erste Tor sofort (später das Silver Goal).',
    today: 'Die Verlängerung wird immer voll gespielt, danach folgt das Elfmeterschießen.',
  },
  {
    from: 1975, to: 2016, topic: 'regeln',
    title: 'Kein Videobeweis',
    then: 'Was der Schiedsrichter sieht, gilt – Fehlentscheidungen werden in der Sportsendung am Samstag diskutiert, nicht korrigiert.',
    today: 'Seit 2017/18 prüft der Video-Assistent Tore, Elfmeter, Rote Karten und Verwechslungen.',
  },
  {
    from: 1975, to: 2014, topic: 'regeln',
    title: 'Keine Torlinientechnik',
    then: 'Ob der Ball hinter der Linie war, entscheidet das Auge von Schiedsrichter und Linienrichter.',
    today: 'Seit 2015/16 meldet die Torlinientechnik der Bundesliga ein Tor in unter einer Sekunde.',
  },
  // --- Liga & Wettbewerbe -------------------------------------------------------
  {
    from: 1975, to: 1980, topic: 'liga',
    title: 'Zweigleisige 2. Bundesliga',
    then: 'Die 2. Bundesliga spielt in den Staffeln Nord und Süd mit je 20 Vereinen.',
    today: 'Es gibt eine eingleisige 2. Bundesliga mit 18 Vereinen.',
  },
  {
    from: 1981, to: 1993, topic: 'liga',
    title: 'Größere 2. Bundesliga',
    then: 'Die eingleisige 2. Bundesliga hat 20 Vereine, nach der Einheit kurzzeitig sogar 24.',
    today: 'Seit 1994/95 spielen 18 Vereine in der 2. Bundesliga.',
  },
  {
    from: 1975, to: 1980, topic: 'liga',
    title: 'Keine Relegation (Staffelzeit)',
    then: 'Drei Bundesligisten steigen direkt ab; die Staffel-Zweiten der 2. Liga spielen den dritten Aufsteiger aus.',
    today: 'Der 16. der Bundesliga spielt in der Relegation gegen den Dritten der 2. Bundesliga.',
  },
  {
    from: 1991, to: 2007, topic: 'liga',
    title: 'Keine Relegation',
    then: 'Die drei Letzten der Bundesliga steigen direkt ab, die ersten drei der 2. Liga direkt auf.',
    today: 'Seit 2008/09 gibt es wieder eine Relegation zwischen dem 16. und dem Zweitliga-Dritten.',
  },
  {
    from: 1975, to: 2007, topic: 'liga',
    title: 'Keine bundesweite 3. Liga',
    then: 'Unter der 2. Bundesliga spielen regionale Amateurligen, ab 1994 die Regionalligen.',
    today: 'Seit 2008/09 gibt es die eingleisige 3. Liga mit 20 Vereinen.',
  },
  {
    from: 1975, to: 1990, topic: 'liga',
    title: 'DDR-Oberliga',
    then: 'In der DDR spielt eine eigene Oberliga mit 14 Vereinen; die Spieler sind offiziell Amateure mit Arbeitsstelle im Trägerbetrieb.',
    today: 'Ostdeutsche Vereine spielen im gesamtdeutschen Ligasystem.',
  },
  {
    from: 1975, to: 1990, topic: 'liga',
    title: 'Zwei deutsche Nationalteams',
    then: 'BRD und DDR stellen eigene Nationalmannschaften, die sich nur einmal (1974) begegnen.',
    today: 'Es gibt eine gesamtdeutsche Nationalmannschaft.',
  },
  {
    from: 1975, to: 2000, topic: 'liga',
    title: 'Der DFB führt die Liga',
    then: 'Bundesliga und 2. Bundesliga werden direkt vom DFB organisiert und vermarktet.',
    today: 'Seit 2001 organisiert die DFL die Profiligen und ihre Vermarktung.',
  },
  {
    from: 1975, to: 1996, topic: 'liga',
    title: 'Landesmeister-Pokal nur für Meister',
    then: 'In Europas wichtigstem Wettbewerb spielen nur die Landesmeister (und der Titelverteidiger).',
    today: 'Aus der Bundesliga spielen vier, manchmal fünf Vereine in der Champions League.',
  },
  {
    from: 1975, to: 1990, topic: 'liga',
    title: 'Europapokal ohne Gruppen',
    then: 'Alle Europapokale laufen vom ersten Spiel an im K.-o.-System mit Hin- und Rückspiel.',
    today: 'Die Europapokale beginnen mit einer großen Ligaphase.',
  },
  {
    from: 1975, to: 1998, topic: 'liga',
    title: 'Pokal der Pokalsieger',
    then: 'Die nationalen Pokalsieger spielen einen eigenen Europapokal.',
    today: 'Den Pokal der Pokalsieger gibt es nicht mehr; Pokalsieger spielen in der Europa League.',
  },
  {
    from: 1975, to: 1996, topic: 'liga',
    title: 'UEFA-Pokal-Finale mit Rückspiel',
    then: 'Das Finale des UEFA-Pokals wird in Hin- und Rückspiel ausgetragen.',
    today: 'Alle Europapokal-Endspiele finden als ein Spiel an einem neutralen Ort statt.',
  },
  {
    from: 1975, to: 2020, topic: 'regeln',
    title: 'Auswärtstorregel',
    then: 'Bei Gleichstand nach Hin- und Rückspiel kommt weiter, wer auswärts mehr Tore erzielt hat.',
    today: 'Seit 2021/22 zählen Auswärtstore nicht mehr doppelt, es folgt die Verlängerung.',
  },
  {
    from: 1995, to: 2008, topic: 'liga',
    title: 'UI-Cup im Sommer',
    then: 'Über den Intertoto-Cup im Sommer können sich Vereine für den UEFA-Pokal qualifizieren.',
    today: 'Den UI-Cup gibt es nicht mehr; die Conference League ist der dritte Europapokal.',
  },
  {
    from: 1997, to: 2007, topic: 'liga',
    title: 'DFB-Ligapokal',
    then: 'Vor der Saison spielen die besten Bundesligisten den Ligapokal aus.',
    today: 'Stattdessen gibt es den Supercup zwischen Meister und Pokalsieger.',
  },
  {
    from: 1975, to: 1986, topic: 'liga',
    title: 'Kein Supercup',
    then: 'Ein Spiel zwischen Meister und Pokalsieger gibt es nicht.',
    today: 'Der Supercup eröffnet jede Saison.',
  },
  {
    from: 1975, to: 2004, topic: 'liga',
    title: 'Weltpokal statt Klub-WM',
    then: 'Der Europapokalsieger der Landesmeister spielt gegen den Sieger Südamerikas um den Weltpokal.',
    today: 'Die FIFA veranstaltet eine Klub-Weltmeisterschaft mit Teams aller Kontinente.',
  },
  {
    from: 1975, to: 2014, topic: 'liga',
    title: 'Kleine EM-Endrunde',
    then: 'Zur EM-Endrunde reisen nur 4 (1976), 8 (1980–1992) oder 16 Teams (1996–2012).',
    today: 'Die EM-Endrunde hat 24 Teilnehmer.',
  },
  {
    from: 1975, to: 2024, topic: 'liga',
    title: 'Kleinere Weltmeisterschaft',
    then: 'An der WM-Endrunde nehmen 16 (1978), 24 (1982–1994) oder 32 Teams (1998–2022) teil.',
    today: 'Die WM 2026 spielt mit 48 Mannschaften.',
  },
  {
    from: 1975, to: 2003, topic: 'liga',
    title: 'Profis in der Halle',
    then: 'In der Winterpause spielen Bundesligisten Hallenturniere mit Bande vor vollen Rängen.',
    today: 'Hallenfußball mit Profimannschaften gibt es nicht mehr.',
  },
  {
    from: 1987, to: 2000, topic: 'liga',
    title: 'Hallen-Masters',
    then: 'Der DFB-Hallenpokal mit Qualifikationsturnieren und Endrunde im Januar ist ein offizieller Wettbewerb.',
    today: 'Nach der Endrunde 2001 wurde das Hallen-Masters abgeschafft.',
  },
  {
    from: 1975, to: 1981, topic: 'liga',
    title: 'Keine Frauen-Nationalelf',
    then: 'Eine offizielle Frauen-Nationalmannschaft des DFB gibt es noch nicht.',
    today: 'Die DFB-Frauen sind mehrfache Europameister und Weltmeister.',
  },
  {
    from: 1975, to: 1989, topic: 'liga',
    title: 'Keine Frauen-Bundesliga',
    then: 'Frauenfußball findet in regionalen Ligen statt, kaum beachtet.',
    today: 'Seit 1990/91 gibt es die Frauen-Bundesliga, heute mit Spielen in großen Stadien und im Fernsehen.',
  },
  // --- Geld ---------------------------------------------------------------------
  {
    from: 1975, to: 1994, topic: 'geld',
    title: 'Ablöse auch nach Vertragsende',
    then: 'Auch wenn sein Vertrag ausläuft, kann ein Spieler nur gegen Ablöse wechseln.',
    today: 'Nach Vertragsende ist ein Wechsel ablösefrei (Bosman-Urteil 1995).',
  },
  {
    from: 1975, to: 1995, topic: 'geld',
    title: 'Ausländerbeschränkung',
    then: 'Pro Spiel dürfen nur wenige Ausländer mitwirken – auch Spieler aus anderen EG-Ländern zählen dazu.',
    today: 'Spieler aus der EU sind Inländern gleichgestellt; es gibt kein Ausländerlimit mehr.',
  },
  {
    from: 1996, to: 2005, topic: 'geld',
    title: 'Nicht-EU-Kontingent',
    then: 'EU-Spieler sind frei, aber nur wenige Nicht-EU-Ausländer dürfen gleichzeitig spielen.',
    today: 'Seit 2006/07 gibt es kein Ausländerlimit, sondern eine Mindestzahl lokal ausgebildeter Spieler.',
  },
  {
    from: 1975, to: 1995, topic: 'geld',
    title: 'Bescheidene Gehälter',
    then: 'Ein Stammspieler verdient rund 75.000 DM im Jahr, ein Star um 250.000 DM.',
    today: 'Bundesliga-Profis verdienen im Schnitt Millionen pro Jahr, Stars ein Vielfaches.',
  },
  {
    from: 1975, to: 2001, topic: 'geld',
    title: 'Bezahlt wird in D-Mark',
    then: 'Gehälter, Ablösen und Eintrittskarten werden in D-Mark (DDR: Mark) bezahlt.',
    today: 'Seit 2002 wird in Euro gerechnet.',
  },
  {
    from: 1975, to: 1987, topic: 'geld',
    title: 'Fernsehgeld ist Nebensache',
    then: 'Die öffentlich-rechtlichen Sender zahlen der ganzen Liga nur wenige Millionen DM pro Saison. Das Geld kommt von der Kasse am Stadion.',
    today: 'Die Medienerlöse der Bundesliga liegen bei über einer Milliarde Euro pro Saison.',
  },
  {
    from: 1975, to: 2016, topic: 'geld',
    title: 'Werbung nur auf der Brust',
    then: 'Trikotwerbung ist erst seit 1973 erlaubt und nur auf der Brust.',
    today: 'Seit 2017/18 ist zusätzlich ein Ärmelsponsor erlaubt.',
  },
  {
    from: 1975, to: 2000, topic: 'geld',
    title: 'Stadien ohne Sponsorennamen',
    then: 'Stadien heißen nach Stadt, Verein oder Lage, Namensrechte werden nicht verkauft.',
    today: 'Die meisten Bundesliga-Arenen tragen den Namen eines Sponsors.',
  },
  {
    from: 1975, to: 1997, topic: 'geld',
    title: 'Nur eingetragene Vereine',
    then: 'Profimannschaften gehören eingetragenen Vereinen, Investoren und Börsengänge sind ausgeschlossen.',
    today: 'Profiabteilungen sind meist GmbH oder AG; 50+1 sichert dem Verein die Stimmenmehrheit.',
  },
  // --- Taktik, Training, Nachwuchs -----------------------------------------------
  {
    from: 1975, to: 1999, topic: 'taktik',
    title: 'Libero und Manndeckung',
    then: 'Hinter der Abwehr räumt ein Libero ab, jeder Gegenspieler hat seinen persönlichen Bewacher.',
    today: 'Gespielt wird mit Viererkette, Raumdeckung und Pressing.',
  },
  {
    from: 1975, to: 2002, topic: 'taktik',
    title: 'Training nach Gefühl',
    then: 'Waldläufe, Medizinball und viel Spielform – Leistungsdiagnostik gibt es kaum.',
    today: 'GPS-Daten, Laktattests und Belastungssteuerung bestimmen jede Trainingswoche.',
  },
  {
    from: 1975, to: 1999, topic: 'taktik',
    title: 'Ernährung ist Privatsache',
    then: 'Was Profis essen und trinken, entscheiden sie meist selbst – Ernährungsberater gibt es nicht.',
    today: 'Ernährungsexperten planen Mahlzeiten, Regeneration und Schlaf.',
  },
  {
    from: 1975, to: 1989, topic: 'taktik',
    title: 'Lange Verletzungspausen',
    then: 'Knie- und Bänderverletzungen bedeuten oft monatelange Pausen oder das Karriereende.',
    today: 'Moderne Operationen und Reha bringen Spieler deutlich schneller zurück.',
  },
  {
    from: 1975, to: 1999, topic: 'taktik',
    title: 'Scouting per Augenschein',
    then: 'Scouts sitzen auf der Tribüne und machen Notizen, Spielanalyse heißt Videokassette.',
    today: 'Datenbanken, Tracking und Videoanalyse durchleuchten jeden Spieler.',
  },
  {
    from: 1975, to: 2000, topic: 'taktik',
    title: 'Keine Nachwuchsleistungszentren',
    then: 'Jugendarbeit ist Sache von Ehrenamtlichen und einzelnen Trainern.',
    today: 'Seit 2001 müssen Lizenzvereine ein Nachwuchsleistungszentrum betreiben.',
  },
  {
    from: 1975, to: 1990, topic: 'taktik',
    title: 'Winterlager in der Heimat',
    then: 'Im Winter trainiert man auf gefrorenen Plätzen daheim, wer es sich leisten kann, auf den Kanaren.',
    today: 'Trainingslager in Spanien, Portugal oder der Türkei sind Standard.',
  },
  // --- Medien & Fans ------------------------------------------------------------
  {
    from: 1975, to: 1990, topic: 'medien',
    title: 'Bundesliga fast nie live',
    then: 'Im Fernsehen gibt es nur Zusammenfassungen, live hört man die Konferenz im Radio.',
    today: 'Jedes Spiel läuft live, meist im Bezahlfernsehen oder per Stream.',
  },
  {
    from: 1975, to: 1983, topic: 'medien',
    title: 'Kein Privatfernsehen',
    then: 'Es gibt nur die zwei öffentlich-rechtlichen Programme und die Dritten.',
    today: 'Dutzende Sender und Streamingdienste konkurrieren um Fußballrechte.',
  },
  {
    from: 1975, to: 1997, topic: 'medien',
    title: 'Ergebnisse per Radio',
    then: 'Zwischenstände kommen aus dem Radio und von der Anzeigetafel, später aus dem Videotext.',
    today: 'Liveticker, Apps und Push-Nachrichten melden jedes Tor in Sekunden.',
  },
  {
    from: 1975, to: 1996, topic: 'alltag',
    title: 'Telefon, Telex und Fax',
    then: 'Die Geschäftsstelle verhandelt per Festnetz, Telex und Brief, ab den Achtzigern per Fax. Spieler sind nur zu Hause erreichbar.',
    today: 'E-Mail, Handy und Videocall – Transfers werden rund um die Uhr verhandelt.',
  },
  {
    from: 1975, to: 1991, topic: 'medien',
    title: 'Halbvolle Stadien',
    then: 'Im Schnitt kommen 18.000 bis 25.000 Zuschauer zu einem Bundesligaspiel.',
    today: 'Der Schnitt liegt bei fast 40.000 Zuschauern.',
  },
  {
    from: 1975, to: 2005, topic: 'medien',
    title: 'Laufbahn, Zaun und offene Kurven',
    then: 'Viele Stadien haben eine Laufbahn, unüberdachte Stehkurven und hohe Zäune vor den Rängen.',
    today: 'Die meisten Bundesligisten spielen in reinen Fußballstadien mit Dach und ohne Zaun.',
  },
  {
    from: 1975, to: 1997, topic: 'medien',
    title: 'Kuttenfans statt Ultras',
    then: 'In der Kurve stehen Fans in Jeanskutten mit Aufnähern und schwenken Fahnen.',
    today: 'Ultragruppen prägen die Kurven mit Choreografien, Gesängen und Fanpolitik.',
  },
];

// =============================================================================
// Quellen (abgerufen Oktober/November 2026)
//  - 90min.de, „Alte Fußballregeln“ (Abseits/Notbremse 1990, Gelb-Rot 1991, Rückpass 1992,
//    Gelbsperre 1979/80, Grätsche 1998, drei Wechsel 1995/96, Golden Goal):
//    https://www.90min.de/posts/6321935-alte-fussballregeln-diese-gesetze-haben-sich-veraendert
//  - bundesliga.com, „Soccer jersey numbers: a Bundesliga explainer“ (Nummern vor 1994/95
//    je Spiel nach Position): https://www.bundesliga.com/en/bundesliga/news/soccer-jersey-numbers-explained-position-roles-meaning-5332
//  - bundesliga.com, „60 Jahre Bundesliga: 1983–1993“ (Live-TV, Premiere 1991, Zuschauer):
//    https://www.bundesliga.com/de/bundesliga/news/60-jahre-bundesliga-1983-1993-live-tv-24519
//  - goal.com, „Seit wann gibt es Gelbe und Rote Karten für Trainer?“:
//    https://www.goal.com/de/meldungen/fussball-seit-wann-gelbe-rote-karten-trainer/blt29a2bd347ffc5d2c
//  - streamwert.de / horizont.net zu den TV-Rechten (1965: 650.000 DM, 1988: 40 Mio. DM,
//    2017/18 erstmals über 1 Mrd. €).
//  - en.wikipedia.org: Bosman ruling; Promotion to the Bundesliga; Foreign football players in
//    Germany (Nicht-EU-Limit bis 2005/06, Local-Player-Regel ab 2006/07).
//  - web.de, „Otto Rehhagels Wechselfehler“ (2+1-Regel, Nicht-EU-Kontingent).
//  - Projektintern: docs/recherche/fussball_historie_designdaten_1975_2030.md (Torlinie
//    2015/16, VAR 2017/18, 3. Liga 2008/09, Trikotwerbung 1973), data/indoorHistory.ts
//    (Hallen-Masters 1988–2001, Hallenturniere bis Winter 2004), data/campDestinations.ts,
//    engine/economy.ts (DM bis 2001), CLAUDE.md (Gehaltsniveau 1975).
// =============================================================================

// =============================================================================
// SAISON-BRIEFING 1975/76 – 1999/2000 (redaktionelle Inhalte, reine Daten)
// -----------------------------------------------------------------------------
// Je Saison: was im Fußball neu ist bzw. die Saison prägt (football) und was die
// Gesellschaft in BRD und DDR bewegt (society). Format: ./types.ts.
// Grundsätze:
//  • Echte Ergebnisse von Vereinen NACH Spielbeginn werden nicht genannt, weil das
//    Spiel Liga und Europapokal selbst simuliert. Nationalmannschaften spielt das
//    Spiel nicht – WM/EM-Ergebnisse sind deshalb echte Geschichte.
//  • Turniere im Sommer stehen in der Saison, die mit ihnen endet („steht an“), das
//    Ergebnis im Rückblick der Folgesaison.
//  • `inGame` nur, wenn das Spiel die Regel/Neuerung zum genannten Jahr umsetzt.
// Datei darf groß sein (reine Daten, Ausnahme von der 600-Zeilen-Regel).
// =============================================================================

import type { SeasonBriefingEntry } from './types';

export const SEASONS_1975: SeasonBriefingEntry[] = [
  // ---------------------------------------------------------------------------
  {
    season: '1975/76',
    headline: 'Anpfiff: Fußball im Jahr 1975',
    football: [
      {
        topic: 'regeln',
        title: 'Zwei Punkte für einen Sieg',
        text: 'Ein Sieg bringt zwei Punkte, ein Unentschieden einen. Wer auswärts ein Remis holt, hat schon viel gewonnen.',
        inGame: 'Tabelle nach 2-Punkte-Regel (bis 1994/95)',
      },
      {
        topic: 'liga',
        title: '1. Liga und zweigeteilte 2. Liga',
        text: 'Oben spielen 18 Vereine, darunter die 2. Liga seit 1974 in den Staffeln Nord und Süd mit je 20 Klubs. Drei steigen ab, die Staffelmeister steigen auf, die beiden Zweiten spielen den dritten Aufsteiger in Hin- und Rückspiel aus.',
        inGame: '1. Liga + 2. Liga Nord/Süd, Playoff der Staffel-Zweiten',
      },
      {
        topic: 'regeln',
        title: 'Nur zwei Auswechslungen',
        text: 'Du darfst pro Spiel nur zweimal wechseln. Verletzt sich danach noch jemand, spielt deine Mannschaft in Unterzahl weiter.',
        inGame: 'Höchstens 2 Wechsel pro Spiel',
      },
      {
        topic: 'geld',
        title: 'Werbung auf der Brust',
        text: 'Seit Braunschweig im März 1973 mit dem Hirschkopf eines Kräuterlikörs auflief, tragen immer mehr Vereine Werbung auf dem Trikot. Für viele Klubs ist das eine ganz neue Einnahmequelle.',
        inGame: 'Trikotsponsoring ab Spielstart verfügbar',
      },
      {
        topic: 'medien',
        title: 'Zusammenfassung statt Live-Bilder',
        text: 'Live im Fernsehen läuft die 1. Liga praktisch nie. Am Samstag hörst du die Konferenz im Radio, abends zeigen die Sportsendungen der Öffentlich-Rechtlichen Zusammenfassungen.',
      },
      {
        topic: 'taktik',
        title: 'Weltmeisterland mit Libero',
        text: 'Deutschland ist seit 1974 Weltmeister, München Rot gewann 1974 und 1975 den Landesmeister-Pokal, Mönchengladbach ist Meister 1975. Gespielt wird mit Libero hinter der Abwehr und strenger Manndeckung.',
      },
    ],
    society: [
      {
        topic: 'politik',
        title: 'Zwei deutsche Staaten',
        text: 'In Bonn regiert seit 1974 ein sozialdemokratischer Bundeskanzler, in Ost-Berlin führt seit 1971 ein neuer Erster Sekretär die SED. Im August 1975 unterzeichnen beide Staaten die KSZE-Schlussakte von Helsinki.',
      },
      {
        topic: 'politik',
        title: 'Nach der Ölkrise',
        text: 'Die Ölkrise von 1973/74 wirkt nach: Erstmals seit den 1950ern sind in der Bundesrepublik über eine Million Menschen arbeitslos.',
      },
      {
        topic: 'alltag',
        title: 'Drei Programme, Wählscheibe',
        text: 'Fernsehen heißt zwei öffentlich-rechtliche Programme und das Dritte, in vielen Wohnzimmern noch in Schwarz-Weiß. Telefoniert wird mit Wählscheibe, Ferngespräche sind teuer.',
      },
      {
        topic: 'alltag',
        title: 'Anschnallen zur Auswärtsfahrt',
        text: 'Ab dem 1. Januar 1976 gilt auf den Vordersitzen die Gurtpflicht. Ein Bußgeld droht allerdings erst ab 1984.',
      },
      {
        topic: 'kultur',
        title: 'Schlaghosen und Schlager',
        text: 'In der Schlagerparade im Fernsehen läuft deutscher Schlager, im Radio Schwedenpop und Disco. Schlaghosen, lange Haare und Koteletten sieht man auch auf dem Mannschaftsfoto.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1976/77',
    headline: 'Gelupfter Elfmeter, Gold und Budenzauber',
    football: [
      {
        topic: 'liga',
        title: 'EM-Finale vom Punkt verloren',
        text: 'Im Juni 1976 unterliegt Deutschland im EM-Finale von Belgrad der ČSSR im Elfmeterschießen. Der tschechoslowakische Schütze lupft den entscheidenden Strafstoß lässig in die Mitte.',
      },
      {
        topic: 'liga',
        title: 'Olympiagold für die DDR',
        text: 'Die DDR-Auswahl gewinnt im Juli 1976 in Montreal das olympische Fußballturnier mit 3:1 gegen Polen – der größte Erfolg ihrer Geschichte.',
      },
      {
        topic: 'liga',
        title: 'Weltmeister ohne Qualifikation',
        text: 'Als Titelverteidiger ist Deutschland für die WM 1978 in Argentinien automatisch gesetzt. Die Nationalspieler haben in diesem Winter keine Pflichtspiele.',
      },
      {
        topic: 'medien',
        title: 'Budenzauber im Winter',
        text: 'In der Winterpause laden Veranstalter Profimannschaften zu Hallenturnieren ein – vor vollen Rängen und mit Bande statt Seitenaus.',
        inGame: 'Einladungen zu Hallenturnieren unter Statistiken › Halle',
      },
    ],
    society: [
      {
        topic: 'politik',
        title: 'Bundestagswahl 1976',
        text: 'Im Oktober 1976 bleibt der Bundeskanzler mit seiner sozialliberalen Koalition im Amt. Die Union wird mit ihrem Herausforderer aus Rheinland-Pfalz knapp stärkste Fraktion.',
      },
      {
        topic: 'politik',
        title: 'Liedermacher ausgebürgert',
        text: 'Nach einem Konzert in Köln bürgert die DDR im November 1976 einen bekannten Liedermacher aus. Zahlreiche Künstler protestieren, einige verlassen später das Land.',
      },
      {
        topic: 'alltag',
        title: 'Hits vom Kassettenrekorder',
        text: 'Mit dem Kassettenrekorder schneidet man Lieder aus dem Radio mit – und manchmal auch die Liga-Konferenz.',
      },
      {
        topic: 'kultur',
        title: 'Disco aus Deutschland',
        text: 'Eine in Deutschland produzierte Disco-Gruppe stürmt 1976 die Hitparaden in ganz Europa. Disco wird zum Lebensgefühl.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1977/78',
    headline: 'Deutscher Herbst, Ziel Argentinien',
    football: [
      {
        topic: 'liga',
        title: 'WM 1978 in Argentinien',
        text: 'Im Juni 1978 verteidigt Deutschland in Argentinien seinen Titel – ohne seinen Kapitän und Libero, der im Frühjahr 1977 zu einem New Yorker Klub gewechselt ist.',
      },
      {
        topic: 'geld',
        title: 'Amerika lockt mit Dollars',
        text: 'In der nordamerikanischen Profiliga NASL spielen Weltstars aus Brasilien und Deutschland vor großem Publikum. Für alternde Stars wird der Wechsel über den Atlantik eine lukrative Option.',
      },
      {
        topic: 'liga',
        title: 'Drei Europapokale',
        text: 'Meister spielen im Landesmeister-Pokal, Pokalsieger im Pokal der Pokalsieger, die nächstbesten im Europa-Pokal. Alle drei laufen im K.-o.-System mit Hin- und Rückspiel, Auswärtstore zählen bei Gleichstand doppelt.',
        inGame: 'Landesmeister, Pokalsieger und Europa-Pokal',
      },
      {
        topic: 'regeln',
        title: 'WM ohne Halbfinale',
        text: 'Die 16 WM-Teilnehmer spielen zwei Gruppenrunden. Die Sieger der beiden Zwischenrundengruppen bestreiten direkt das Finale.',
      },
    ],
    society: [
      {
        topic: 'politik',
        title: 'Deutscher Herbst',
        text: 'Im September 1977 entführt die RAF den Arbeitgeberpräsidenten, im Oktober wird die entführte Passagiermaschine „Landshut“ in Mogadischu befreit. Fahndungsplakate und Straßensperren prägen wochenlang den Alltag.',
      },
      {
        topic: 'alltag',
        title: 'Kaffeekrise in der DDR',
        text: 'Weil Devisen fehlen, bringt die DDR 1977 einen gestreckten „Kaffee-Mix“ in die Läden. Der Ärger in der Bevölkerung ist so groß, dass er bald wieder verschwindet.',
      },
      {
        topic: 'kultur',
        title: 'Weltraummärchen im Kino',
        text: 'Im Februar 1978 startet ein Weltraummärchen aus Hollywood in den bundesdeutschen Kinos – der Beginn des modernen Blockbusters.',
      },
      {
        topic: 'kultur',
        title: 'Der King ist tot',
        text: 'Im August 1977 stirbt der „King of Rock ’n’ Roll“. Gleichzeitig erreicht das Disco-Fieber 1978 mit einem Tanzfilm aus den USA auch die deutschen Tanzflächen.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1978/79',
    headline: 'Córdoba, Schnee und ein Deutscher im All',
    football: [
      {
        topic: 'liga',
        title: 'Aus in Córdoba',
        text: 'Im Juni 1978 verliert der Titelverteidiger in der WM-Zwischenrunde 2:3 gegen Österreich und fährt nach Hause. In Österreich wird das Spiel zur Legende.',
      },
      {
        topic: 'liga',
        title: 'Neuer Bundestrainer',
        text: 'Nach 14 Jahren hört der Bundestrainer auf. Sein langjähriger Assistent übernimmt die Nationalmannschaft.',
      },
      {
        topic: 'liga',
        title: 'Flucht eines Oberliga-Spielers',
        text: 'Im März 1979 kehrt ein Nationalspieler des Ost-Berliner Serienmeisters nach einem Freundschaftsspiel in Gießen nicht in die DDR zurück. Für DDR-Klubs werden Westreisen danach noch strenger überwacht.',
      },
    ],
    society: [
      {
        topic: 'kultur',
        title: 'Ein Deutscher im All',
        text: 'Am 26. August 1978 fliegt ein DDR-Kosmonaut mit Sojus 31 als erster Deutscher ins All.',
      },
      {
        topic: 'alltag',
        title: 'Schneekatastrophe im Norden',
        text: 'Zum Jahreswechsel 1978/79 versinken Schleswig-Holstein, Niedersachsen und der Norden der DDR im Schnee. Dörfer sind tagelang abgeschnitten, Bundeswehr und NVA helfen mit Panzern.',
      },
      {
        topic: 'kultur',
        title: 'Eine Serie erschüttert das Land',
        text: 'Im Januar 1979 zeigen die Dritten Programme eine US-Serie über den Völkermord an den europäischen Juden. Millionen sehen zu, die Sendung löst eine breite Debatte über die NS-Vergangenheit aus.',
      },
      {
        topic: 'politik',
        title: 'Zweite Ölkrise',
        text: 'Nach der Revolution im Iran steigen 1979 die Ölpreise erneut. Benzin und Heizöl werden teurer.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1979/80',
    headline: 'Gelbsperren, Grüne und Boykott',
    football: [
      {
        topic: 'regeln',
        title: 'Sperre nach Gelben Karten',
        text: 'Ab 1979/80 wird in der 1. Liga gesperrt, wer im Lauf der Saison eine bestimmte Zahl Gelber Karten sammelt. Wiederholte Fouls haben nun Folgen über das Spiel hinaus.',
      },
      {
        topic: 'liga',
        title: 'EM 1980 mit acht Teams',
        text: 'Im Juni 1980 steigt in Italien die erste EM-Endrunde mit acht Mannschaften. Bisher spielten nur vier Teams das Turnier aus.',
      },
      {
        topic: 'geld',
        title: 'Der Manager-Beruf entsteht',
        text: 'Im Mai 1979 wird ein 27-jähriger Ex-Nationalspieler Manager von München Rot. Immer mehr Vereine setzen auf hauptamtliche Manager statt ehrenamtlicher Präsidenten.',
      },
    ],
    society: [
      {
        topic: 'politik',
        title: 'NATO-Doppelbeschluss',
        text: 'Im Dezember 1979 beschließt die NATO, neue Mittelstreckenraketen zu stationieren und gleichzeitig zu verhandeln. Die Friedensbewegung wächst.',
      },
      {
        topic: 'politik',
        title: 'Die Grünen gründen sich',
        text: 'Im Januar 1980 gründet sich in Karlsruhe die Bundespartei Die Grünen aus Umwelt-, Friedens- und Anti-AKW-Bewegung.',
      },
      {
        topic: 'kultur',
        title: 'Olympia ohne Bundesrepublik',
        text: 'Nach dem sowjetischen Einmarsch in Afghanistan boykottiert die Bundesrepublik die Sommerspiele 1980 in Moskau. Die DDR nimmt teil.',
      },
      {
        topic: 'alltag',
        title: 'Musik zum Mitnehmen',
        text: 'Um 1980 kommt der tragbare Kassettenspieler aus Japan nach Deutschland: Musik von der Kassette, über Kopfhörer, überall – auch in der Straßenbahn zum Stadion.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1980/81',
    headline: 'Europameister und letzte Staffelsaison',
    football: [
      {
        topic: 'liga',
        title: 'Europameister 1980',
        text: 'Im Juni 1980 gewinnt Deutschland in Rom das EM-Finale 2:1 gegen Belgien, der Mittelstürmer aus Hamburg trifft doppelt.',
      },
      {
        topic: 'liga',
        title: 'Letzte Saison im Norden und Süden',
        text: 'Ab 1981/82 wird die 2. Liga eingleisig. Wer sich in dieser Saison nicht für die neue Liga qualifiziert, fällt in den Amateurbereich.',
        inGame: 'Je Staffel qualifizieren sich die besten 10 (ohne Aufsteiger)',
      },
      {
        topic: 'liga',
        title: 'Qualifikation für Spanien',
        text: 'Die WM 1982 wird auf 24 Teilnehmer aufgestockt. Die Nationalmannschaft spielt in dieser Saison um die Fahrkarte nach Spanien.',
      },
    ],
    society: [
      {
        topic: 'politik',
        title: 'Bundestagswahl 1980',
        text: 'Im Oktober 1980 setzt sich der Bundeskanzler gegen den Unions-Kandidaten aus Bayern durch.',
      },
      {
        topic: 'politik',
        title: 'Anschlag auf das Oktoberfest',
        text: 'Am 26. September 1980 explodiert am Eingang der Wiesn eine Bombe, 13 Menschen sterben. Es ist einer der schwersten Anschläge der Bundesrepublik.',
      },
      {
        topic: 'politik',
        title: 'Streiks in Polen',
        text: 'Im August 1980 entsteht in Danzig die Gewerkschaft Solidarność. Die DDR schränkt im Herbst den bis dahin visafreien Reiseverkehr nach Polen ein.',
      },
      {
        topic: 'alltag',
        title: 'Videotext startet',
        text: 'Im Juni 1980 beginnen die öffentlich-rechtlichen Sender mit dem Videotext. Bald lassen sich Ergebnisse auch abseits der Sportsendungen am Fernseher nachlesen.',
      },
      {
        topic: 'kultur',
        title: 'Neue Deutsche Welle',
        text: 'Junge Bands aus Berlin und Düsseldorf singen auf Deutsch – frech, kühl und elektronisch. Die Neue Deutsche Welle rollt an.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1981/82',
    headline: 'Eine 2. Liga für alle',
    football: [
      {
        topic: 'liga',
        title: 'Eingleisige 2. Liga',
        text: 'Nord und Süd werden zu einer 2. Liga mit 20 Vereinen und 38 Spieltagen zusammengelegt. Auswärtsfahrten werden länger und teurer.',
        inGame: 'Eine 2. Liga mit 20 Vereinen',
      },
      {
        topic: 'liga',
        title: 'Relegation um den letzten Platz',
        text: 'Erster und Zweiter der 2. Liga steigen direkt auf, der Dritte spielt in Hin- und Rückspiel gegen den 16. der 1. Liga. Diese Relegation gibt es bis 1990/91.',
      },
      {
        topic: 'liga',
        title: 'WM 1982 mit 24 Teams',
        text: 'Im Sommer 1982 spielt die WM in Spanien erstmals mit 24 Mannschaften. Der Europameister reist als Mitfavorit an.',
      },
    ],
    society: [
      {
        topic: 'politik',
        title: 'Friedensdemo im Hofgarten',
        text: 'Am 10. Oktober 1981 demonstrieren in Bonn rund 300.000 Menschen gegen die Nachrüstung – die bis dahin größte Kundgebung der Bundesrepublik.',
      },
      {
        topic: 'politik',
        title: 'Kanzler am Werbellinsee',
        text: 'Im Dezember 1981 besucht der Bundeskanzler den Staatsratsvorsitzenden in der DDR. Es ist das erste Treffen der Regierungschefs seit 1970.',
      },
      {
        topic: 'kultur',
        title: 'Deutsch in der Hitparade',
        text: 'Die Neue Deutsche Welle erreicht die Hitparade: Minimalistische Trios und freche Sängerinnen machen deutschsprachigen Pop zum Massenphänomen.',
      },
      {
        topic: 'alltag',
        title: 'Heimcomputer im Kinderzimmer',
        text: 'Die ersten erschwinglichen Heimcomputer ziehen in die Kinderzimmer ein. Programme kommen von der Kassette.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1982/83',
    headline: 'Nach Gijón und Sevilla',
    football: [
      {
        topic: 'liga',
        title: 'Vizeweltmeister 1982',
        text: 'Im WM-Finale von Madrid verliert Deutschland im Juli 1982 mit 1:3 gegen Italien.',
      },
      {
        topic: 'regeln',
        title: 'Die Folgen von Gijón',
        text: 'Das 1:0 gegen Österreich, mit dem beide Teams weiterkamen, sorgt weltweit für Empörung. Seitdem werden die letzten Gruppenspiele großer Turniere zeitgleich angepfiffen.',
      },
      {
        topic: 'regeln',
        title: 'Erstes WM-Elfmeterschießen',
        text: 'Das Halbfinale in Sevilla gegen Frankreich wird als erstes WM-Spiel im Elfmeterschießen entschieden. Deutschland gewinnt nach 3:3.',
      },
      {
        topic: 'liga',
        title: 'Frauen-Nationalmannschaft',
        text: 'Im November 1982 bestreitet die erste offizielle Frauen-Nationalmannschaft des Fußballbunds ihr erstes Länderspiel: 5:1 gegen die Schweiz in Koblenz.',
      },
    ],
    society: [
      {
        topic: 'politik',
        title: 'Kanzlerwechsel in Bonn',
        text: 'Am 1. Oktober 1982 wird der CDU-Vorsitzende durch ein konstruktives Misstrauensvotum Kanzler. Bei der Wahl im März 1983 ziehen erstmals die Grünen in den Bundestag ein.',
      },
      {
        topic: 'kultur',
        title: 'Deutscher Pop an der Spitze',
        text: 'Anfang 1983 steht ein deutschsprachiges Lied über Luftballons an der Spitze der Charts, später auch international.',
      },
      {
        topic: 'medien',
        title: 'Gefälschte Tagebücher',
        text: 'Im April 1983 präsentiert eine Hamburger Illustrierte angebliche Tagebücher des NS-Diktators. Wenige Tage später sind sie als Fälschung entlarvt.',
      },
      {
        topic: 'alltag',
        title: 'Der Videorekorder',
        text: 'Drei Kassettensysteme kämpfen um die Wohnzimmer. Wer einen Rekorder hat, kann die Sportsendung am Samstag aufnehmen.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1983/84',
    headline: 'Das Privatfernsehen kommt',
    football: [
      {
        topic: 'geld',
        title: 'Profis auch neben dem Platz',
        text: 'Die Vereine der 1. Liga stellen Co-Trainer, Physiotherapeuten und hauptamtliche Geschäftsstellen ein. Die Werbeflächen im Stadion werden systematisch vermarktet.',
        inGame: 'Neue Mitarbeiter-Rollen freigeschaltet',
      },
      {
        topic: 'medien',
        title: 'Neue Sender, alte Rechte',
        text: 'Ab Januar 1984 senden die ersten Privatsender. Die Liga-Bilder bleiben aber vorerst bei den Öffentlich-Rechtlichen.',
      },
      {
        topic: 'liga',
        title: 'EM 1984 in Frankreich',
        text: 'Im Juni 1984 verteidigt Deutschland seinen EM-Titel von 1980 in Frankreich.',
      },
    ],
    society: [
      {
        topic: 'politik',
        title: 'Milliardenkredit für die DDR',
        text: 'Im Sommer 1983 verbürgt sich die Bundesrepublik auf Vermittlung des bayerischen Ministerpräsidenten für einen Kredit von einer Milliarde DM an die DDR.',
      },
      {
        topic: 'politik',
        title: 'Raketen und Menschenkette',
        text: 'Im Oktober 1983 bilden Hunderttausende eine Menschenkette von Stuttgart nach Neu-Ulm. Im November stimmt der Bundestag der Stationierung neuer Raketen zu.',
      },
      {
        topic: 'politik',
        title: 'Volkszählungsurteil',
        text: 'Im Dezember 1983 stoppt das Bundesverfassungsgericht die geplante Volkszählung und schafft das Recht auf informationelle Selbstbestimmung.',
      },
      {
        topic: 'medien',
        title: 'Kabelfernsehen',
        text: 'Am 1. und 2. Januar 1984 starten im Kabelpilotprojekt Ludwigshafen und aus Luxemburg die ersten privaten Programme.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1984/85',
    headline: 'Der Libero wird Teamchef',
    football: [
      {
        topic: 'liga',
        title: 'Ein Teamchef ohne Lizenz',
        text: 'Nach dem Vorrunden-Aus bei der EM 1984 tritt der Bundestrainer zurück. Der Weltmeister-Kapitän von 1974 übernimmt als „Teamchef“, weil ihm die Trainerlizenz fehlt.',
      },
      {
        topic: 'medien',
        title: 'Live im ganzen Land',
        text: 'Am 11. Dezember 1984 überträgt das öffentlich-rechtliche Fernsehen erstmals ein Erstligaspiel bundesweit live: das Nachholspiel Mönchengladbach gegen München Rot.',
      },
      {
        topic: 'geld',
        title: 'Italien lockt die Stars',
        text: 'Die italienische 1. Liga zahlt die höchsten Gehälter Europas. Mehrere deutsche Nationalspieler wechseln für Millionenablösen über die Alpen.',
      },
    ],
    society: [
      {
        topic: 'politik',
        title: 'Neuer Mann in Moskau',
        text: 'Im März 1985 wird ein 54-jähriger Reformer Generalsekretär der KPdSU. In der DDR horchen viele auf.',
      },
      {
        topic: 'politik',
        title: 'Rede zum 8. Mai',
        text: 'Zum 40. Jahrestag des Kriegsendes nennt der Bundespräsident den 8. Mai 1945 einen „Tag der Befreiung“.',
      },
      {
        topic: 'alltag',
        title: 'Bleifrei und Katalysator',
        text: 'Mitte der 1980er kommen bleifreies Benzin und der Katalysator an die Zapfsäulen. Das Waldsterben ist ein großes Thema.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1985/86',
    headline: 'Nach Heysel',
    football: [
      {
        topic: 'liga',
        title: 'Heysel und die Folgen',
        text: 'Beim Landesmeister-Finale in Brüssel sterben im Mai 1985 39 Menschen. Englische Vereine werden für fünf Jahre aus den Europapokalen ausgeschlossen, Stadionsicherheit wird überall zum Thema.',
        inGame: 'Englische Vereine fehlen in den Europapokalen',
      },
      {
        topic: 'medien',
        title: 'Halbleere Ränge',
        text: 'Die 1. Liga steckt im Zuschauertief: Im Schnitt kommen weniger als 20.000 Fans pro Spiel. Erst 1990/91 wird diese Marke wieder überschritten.',
        inGame: 'Zuschauernachfrage auf dem Tiefpunkt',
      },
      {
        topic: 'liga',
        title: 'WM 1986 in Mexiko',
        text: 'Im Juni 1986 spielt die Nationalmannschaft unter ihrem Teamchef bei der WM in Mexiko – in Hitze und Höhe.',
      },
    ],
    society: [
      {
        topic: 'kultur',
        title: 'Wimbledonsieger mit 17',
        text: 'Am 7. Juli 1985 gewinnt ein 17-Jähriger aus Leimen als jüngster Spieler aller Zeiten Wimbledon. In Deutschland bricht ein Tennis-Boom aus.',
      },
      {
        topic: 'kultur',
        title: 'Benefizkonzert für Afrika',
        text: 'Im Juli 1985 sehen weltweit Hunderte Millionen ein Benefizkonzert in London und Philadelphia im Fernsehen.',
      },
      {
        topic: 'kultur',
        title: 'Serie am Sonntagabend',
        text: 'Am 8. Dezember 1985 läuft die erste Folge einer wöchentlichen Familienserie. Der Sonntagabend gehört ab jetzt einer Münchner Nachbarschaft.',
      },
      {
        topic: 'alltag',
        title: 'Tschernobyl',
        text: 'Nach dem Reaktorunglück vom 26. April 1986 werden Spielplätze gesperrt und vor Freilandgemüse und Milch gewarnt. Im Juni entsteht das Bundesumweltministerium.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1986/87',
    headline: 'Vizeweltmeister und lange Winterpause',
    football: [
      {
        topic: 'liga',
        title: 'Finale in Mexiko verloren',
        text: 'Im WM-Finale am 29. Juni 1986 verliert Deutschland 2:3 gegen Argentinien und seinen überragenden Spielmacher – nach einem 0:2-Rückstand war der Ausgleich schon gelungen.',
      },
      {
        topic: 'liga',
        title: 'Elf Wochen Winterpause',
        text: 'Ab 1986/87 ruht die 1. Liga rund elf Wochen. Hallenturniere und Trainingslager füllen die Lücke.',
        inGame: 'Hallenturniere und Winterlager unter Statistiken › Halle bzw. Training › Trainingslager',
      },
      {
        topic: 'medien',
        title: 'Ein Torwart packt aus',
        text: 'Im März 1987 erscheint das Buch des Nationaltorwarts mit Vorwürfen über Doping und Kabinenleben. Er verliert daraufhin seinen Platz im Verein und in der Nationalmannschaft.',
      },
    ],
    society: [
      {
        topic: 'politik',
        title: 'Bundestagswahl 1987',
        text: 'Im Januar 1987 wird die christlich-liberale Koalition bestätigt. Die Grünen legen deutlich zu.',
      },
      {
        topic: 'politik',
        title: 'Streit um die Volkszählung',
        text: 'Im Mai 1987 wird die Volkszählung nachgeholt. Initiativen rufen zum Boykott auf.',
      },
      {
        topic: 'alltag',
        title: 'Landung auf dem Roten Platz',
        text: 'Am 28. Mai 1987 landet ein 19-jähriger Hobbypilot aus der Bundesrepublik mit einem Sportflugzeug mitten in Moskau.',
      },
      {
        topic: 'kultur',
        title: '750 Jahre Berlin',
        text: 'Ost- und West-Berlin feiern 1987 getrennt das Stadtjubiläum, jeweils mit großem Programm.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1987/88',
    headline: 'Hallenfinale und Heim-EM',
    football: [
      {
        topic: 'liga',
        title: 'Hallenpokal',
        text: 'Die Lizenzvereine beschließen eine offizielle Hallenrunde. Die erste Endrunde steigt im Januar 1988 in der Frankfurter Festhalle.',
        inGame: 'Hallentour mit Hallenfinale',
      },
      {
        topic: 'liga',
        title: 'EM 1988 im eigenen Land',
        text: 'Im Juni 1988 richtet die Bundesrepublik die Europameisterschaft aus. Acht Teams spielen in acht Stadien, darunter das Olympiastadion München.',
      },
      {
        topic: 'medien',
        title: 'Kutten und Hooligans',
        text: 'In den Kurven stehen Fans in Jeanskutten mit Aufnähern. Gleichzeitig wächst eine gewaltbereite Hooliganszene, die Polizei begleitet Auswärtsfahrten mit großem Aufgebot.',
      },
    ],
    society: [
      {
        topic: 'politik',
        title: 'Staatsbesuch in Bonn',
        text: 'Im September 1987 besucht erstmals ein DDR-Staatschef die Bundesrepublik – mit Hymne und Ehrenformation.',
      },
      {
        topic: 'politik',
        title: 'Kieler Affäre',
        text: 'Im Herbst 1987 erschüttert die Affäre um Schleswig-Holsteins Ministerpräsidenten die Bundesrepublik.',
      },
      {
        topic: 'kultur',
        title: 'Eiskunstlauf-Gold in Calgary',
        text: 'Im Februar 1988 gewinnt eine Eiskunstläuferin aus der DDR ihr zweites olympisches Gold.',
      },
      {
        topic: 'alltag',
        title: 'Die CD setzt sich durch',
        text: 'CD-Spieler werden erschwinglich, die Schallplatte bekommt Konkurrenz.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1988/89',
    headline: 'Das Fernsehen entdeckt das Geld',
    football: [
      {
        topic: 'geld',
        title: 'Privatfernsehen kauft die Liga',
        text: 'Für rund 40 Millionen DM pro Saison sichert sich eine Rechteagentur für einen Privatsender die Liga-Rechte – etwa das Sechzigfache von 1965. Statt der öffentlich-rechtlichen Samstags-Sportsendung zeigt eine neue Privatsender-Sendung die Tore.',
        inGame: 'TV-Erlöse steigen deutlich',
      },
      {
        topic: 'liga',
        title: 'EM-Halbfinale verloren',
        text: 'Bei der Heim-EM scheidet Deutschland im Juni 1988 in Hamburg mit 1:2 gegen die Niederlande aus.',
      },
      {
        topic: 'liga',
        title: 'Olympia-Bronze in Seoul',
        text: 'Die Olympia-Auswahl der Bundesrepublik holt im Herbst 1988 in Seoul die Bronzemedaille.',
      },
    ],
    society: [
      {
        topic: 'medien',
        title: 'Gladbecker Geiseldrama',
        text: 'Im August 1988 berichten Reporter live aus dem Fluchtauto von Geiselnehmern. Die Grenzen der Berichterstattung werden danach heftig diskutiert.',
      },
      {
        topic: 'kultur',
        title: 'Golden Slam im Tennis',
        text: 'Eine 19-Jährige aus Brühl gewinnt 1988 alle vier Grand-Slam-Turniere und Olympia-Gold in Seoul.',
      },
      {
        topic: 'politik',
        title: 'Sowjetisches Magazin verboten',
        text: 'Im November 1988 verbietet die DDR eine sowjetische Monatszeitschrift, die über Reformen berichtet.',
      },
      {
        topic: 'politik',
        title: 'Gefälschte Kommunalwahl',
        text: 'Bei der DDR-Kommunalwahl im Mai 1989 weisen Bürgerrechtler Wahlfälschung nach. Der Protest wächst.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1989/90',
    headline: 'Die Mauer fällt',
    football: [
      {
        topic: 'liga',
        title: 'Frauen werden Europameister',
        text: 'Im Juli 1989 gewinnen die Nationalspielerinnen in Osnabrück das EM-Finale 4:1 gegen Norwegen. Das Turnier läuft live im Fernsehen.',
      },
      {
        topic: 'geld',
        title: 'Von Ost nach West',
        text: 'Nach dem Mauerfall wechselt im Dezember 1989 ein Ost-Berliner Stürmer als erster Oberliga-Spieler offiziell in die 1. Liga. Viele DDR-Talente folgen.',
      },
      {
        topic: 'liga',
        title: 'WM 1990 in Italien',
        text: 'Im Juni 1990 spielt Deutschland bei der WM in Italien. Der Teamchef kündigt an, danach aufzuhören.',
      },
    ],
    society: [
      {
        topic: 'politik',
        title: 'Montagsdemonstrationen',
        text: 'Am 9. Oktober 1989 ziehen in Leipzig rund 70.000 Menschen friedlich über den Ring. Der Protest erfasst die ganze DDR.',
      },
      {
        topic: 'politik',
        title: 'Die Mauer ist offen',
        text: 'Am 9. November 1989 fällt die Mauer. Zweitakter rollen über die Grenze, jeder DDR-Bürger erhält 100 DM Begrüßungsgeld.',
      },
      {
        topic: 'politik',
        title: 'Erste freie Volkskammerwahl',
        text: 'Am 18. März 1990 wählt die DDR zum ersten Mal frei. Die neue Regierung steuert auf die Einheit zu.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1990/91',
    headline: 'Weltmeister, Einheit, letzte Oberliga',
    football: [
      {
        topic: 'liga',
        title: 'Weltmeister 1990',
        text: 'Am 8. Juli 1990 gewinnt Deutschland in Rom das WM-Finale 1:0 gegen Argentinien, der Linksverteidiger verwandelt den Elfmeter. Der bisherige Assistent übernimmt vom Teamchef.',
      },
      {
        topic: 'regeln',
        title: 'Gleiche Höhe ist kein Abseits',
        text: 'Seit 1990 steht ein Angreifer auf gleicher Höhe mit dem vorletzten Verteidiger nicht mehr im Abseits. Die „Notbremse“ gegen eine klare Torchance wird mit Rot bestraft.',
      },
      {
        topic: 'liga',
        title: 'Die letzte Oberliga',
        text: 'Im November 1990 tritt der DDR-Verband dem Fußballbund bei. Die letzte Oberliga-Saison entscheidet, wer 1991/92 in 1. Liga und 2. Liga spielt.',
        inGame: 'Endstand der Oberliga bestimmt die Plätze ab 1991/92',
      },
      {
        topic: 'liga',
        title: 'Letztes DDR-Länderspiel',
        text: 'Am 12. September 1990 gewinnt die DDR-Auswahl in Brüssel 2:0 gegen Belgien – ihr letztes Spiel.',
      },
      {
        topic: 'medien',
        title: 'Bezahlfernsehen live',
        text: 'Am 2. März 1991 zeigt ein Abosender erstmals ein Erstligaspiel live – der Beginn des Pay-TV-Fußballs.',
      },
      {
        topic: 'taktik',
        title: 'Moderne Sportmedizin',
        text: 'Eigene Reha-Abteilungen und bessere Operationsmethoden verkürzen Verletzungspausen spürbar.',
        inGame: 'Reha-Zentrum auf dem Vereinsgelände baubar',
      },
    ],
    society: [
      {
        topic: 'alltag',
        title: 'D-Mark im Osten',
        text: 'Am 1. Juli 1990 kommt die D-Mark in die DDR. Westwaren füllen die Regale, viele Betriebe geraten in Not.',
      },
      {
        topic: 'politik',
        title: 'Deutsche Einheit',
        text: 'Am 3. Oktober 1990 tritt die DDR der Bundesrepublik bei. Am 2. Dezember wählt ganz Deutschland erstmals gemeinsam den Bundestag.',
      },
      {
        topic: 'alltag',
        title: 'Treuhand und Arbeitslosigkeit',
        text: 'Die Treuhandanstalt privatisiert die DDR-Betriebe. Hunderttausende verlieren ihre Arbeit – auch die Trägerbetriebe der Ostklubs wanken.',
      },
      {
        topic: 'politik',
        title: 'Golfkrieg',
        text: 'Im Januar 1991 beginnt der Krieg um Kuwait. Viele Städte sagen ihre Rosenmontagszüge ab.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1991/92',
    headline: 'Gesamtdeutsche 1. Liga mit 20 Vereinen',
    football: [
      {
        topic: 'liga',
        title: 'Zwei Ostklubs in der 1. Liga',
        text: 'Rostock und Dresden kommen hinzu, die 1. Liga spielt einmalig mit 20 Vereinen und 38 Spieltagen.',
        inGame: '1. Liga mit 20 Vereinen, danach Rückführung auf 18',
      },
      {
        topic: 'liga',
        title: '2. Liga mit 24 Vereinen',
        text: 'Sechs ehemalige DDR-Klubs ergänzen die 2. Liga, die in zwei Staffeln Nord und Süd startet. Die Relegation entfällt.',
      },
      {
        topic: 'liga',
        title: 'Dritte Ebene im Osten',
        text: 'Die übrigen Ostvereine spielen in der Oberliga Nordost, der dritten Ebene.',
        inGame: 'Oberliga Nordost als 3. Ebene',
      },
      {
        topic: 'regeln',
        title: 'Die Gelb-Rote Karte',
        text: 'Seit 1991 gibt es für die zweite Verwarnung Gelb-Rot – mit kürzerer Sperre als nach einer glatten Roten Karte.',
      },
      {
        topic: 'taktik',
        title: 'Ab in die Wärme',
        text: 'Im Januar 1992 fliegt Gelsenkirchen als erster Verein der 1. Liga ins Winterlager an die türkische Riviera, Leverkusen nach Florida. Bisher ging es auf die Kanaren – oder auf gefrorene Plätze daheim.',
        inGame: 'Neue Ziele unter Training › Trainingslager',
      },
    ],
    society: [
      {
        topic: 'politik',
        title: 'Berlin wird Hauptstadt',
        text: 'Im Juni 1991 beschließt der Bundestag knapp den Umzug von Parlament und Regierung nach Berlin.',
      },
      {
        topic: 'alltag',
        title: 'Solidaritätszuschlag',
        text: 'Ab Juli 1991 zahlen Steuerpflichtige den „Soli“ – zunächst befristet.',
      },
      {
        topic: 'politik',
        title: 'Blick in die Stasi-Akten',
        text: 'Seit Januar 1992 können Bürger ihre Stasi-Akten einsehen. Manche entdecken, dass Freunde oder Mitspieler sie bespitzelt haben.',
      },
      {
        topic: 'politik',
        title: 'Vertrag von Maastricht',
        text: 'Im Februar 1992 wird die Europäische Union gegründet und eine gemeinsame Währung bis Ende des Jahrzehnts verabredet.',
      },
      {
        topic: 'kultur',
        title: 'Techno aus Berlin',
        text: 'In leerstehenden Gebäuden Ost-Berlins entstehen Techno-Clubs. Die sommerliche Techno-Parade über den Kurfürstendamm wächst von Jahr zu Jahr.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1992/93',
    headline: 'Rückpass verboten, Meisterliga',
    football: [
      {
        topic: 'regeln',
        title: 'Rückpassregel',
        text: 'Ein absichtlich zugespielter Rückpass mit dem Fuß darf vom Torwart nicht mehr in die Hand genommen werden. Das Zeitspiel wird schwerer, Torhüter müssen kicken können.',
        inGame: 'Rückpassregel in der Match-Engine aktiv',
      },
      {
        topic: 'liga',
        title: 'Die Meisterliga',
        text: 'Der Landesmeister-Pokal heißt ab 1992/93 Meisterliga und spielt mit Gruppenphase – mit eigener Hymne und viel mehr Geld.',
        inGame: 'Meisterliga mit Gruppenphase',
      },
      {
        topic: 'medien',
        title: 'Fußball als Samstagsshow',
        text: 'Eine Münchner Mediengruppe zahlt über ihre Rechteagentur 700 Millionen DM für fünf Jahre. Ihr Privatsender inszeniert die 1. Liga ab August 1992 als große Samstagsshow.',
      },
      {
        topic: 'liga',
        title: 'EM-Finale gegen Dänemark verloren',
        text: 'Im Juni 1992 unterliegt Deutschland im EM-Finale von Göteborg dem Nachrücker Dänemark mit 0:2.',
      },
      {
        topic: 'liga',
        title: '2. Liga mit 24 Vereinen',
        text: 'Die 2. Liga spielt 1992/93 eingleisig mit 24 Vereinen und 46 Spieltagen.',
      },
      {
        topic: 'medien',
        title: '„Mein Freund ist Ausländer“',
        text: 'Im Dezember 1992 laufen alle Vereine der 1. Liga statt mit Trikotwerbung mit diesem Schriftzug auf – eine Reaktion auf fremdenfeindliche Anschläge.',
      },
    ],
    society: [
      {
        topic: 'alltag',
        title: 'Die D-Netze starten',
        text: 'Mitte 1992 gehen die digitalen Mobilfunknetze D1 und D2 an den Start. Handys sind noch teuer und groß.',
      },
      {
        topic: 'politik',
        title: 'Lichterketten',
        text: 'Nach Ausschreitungen in Rostock-Lichtenhagen und dem Brandanschlag von Mölln gehen im Winter 1992 Hunderttausende mit Kerzen auf die Straße.',
      },
      {
        topic: 'medien',
        title: 'Privatsender überholen die Öffentlichen',
        text: 'Die Privatsender holen auf, 1993 wird erstmals ein Privatsender zum meistgesehenen Programm.',
      },
      {
        topic: 'kultur',
        title: 'Eurodance',
        text: 'Tanzmusik-Produktionen aus Frankfurt stürmen die europäischen Charts.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1993/94',
    headline: 'Neue Postleitzahlen, Ziel USA',
    football: [
      {
        topic: 'regeln',
        title: 'Drei Ausländer plus zwei',
        text: 'Seit 1993 dürfen drei Ausländer spielen, dazu zwei „assimilierte“, die lange im Land und in der Jugend gespielt haben.',
      },
      {
        topic: 'liga',
        title: '2. Liga wieder mit 20',
        text: 'Nach der Übergangszeit spielt die 2. Liga wieder mit 20 Vereinen.',
      },
      {
        topic: 'medien',
        title: 'Sport rund um die Uhr',
        text: 'Seit Januar 1993 sendet ein eigener Sportspartensender. Fußball läuft zunehmend auch abseits der großen Sender.',
      },
      {
        topic: 'liga',
        title: 'WM 1994 in den USA',
        text: 'Im Juni 1994 verteidigt der Weltmeister seinen Titel in den Vereinigten Staaten.',
      },
    ],
    society: [
      {
        topic: 'alltag',
        title: 'Fünfstellige Postleitzahlen',
        text: 'Am 1. Juli 1993 bekommt ganz Deutschland neue, fünfstellige Postleitzahlen.',
      },
      {
        topic: 'alltag',
        title: 'Bahnreform',
        text: 'Zum 1. Januar 1994 werden Bundesbahn und Reichsbahn zu einer gemeinsamen Aktiengesellschaft verschmolzen.',
      },
      {
        topic: 'kultur',
        title: 'Dinosaurier im Kino',
        text: 'Im September 1993 startet ein Dinosaurier-Abenteuer aus Hollywood und wird zum Kassenschlager.',
      },
      {
        topic: 'politik',
        title: 'Neuer Bundespräsident',
        text: 'Im Mai 1994 wird der Präsident des Bundesverfassungsgerichts zum Bundespräsidenten gewählt.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1994/95',
    headline: 'Regionalliga und Truppenabzug',
    football: [
      {
        topic: 'liga',
        title: 'Die Regionalliga',
        text: 'Unter der 2. Liga entsteht eine dritte Ebene mit vier Regionalligen. Die vier Meister der ersten Saison steigen direkt auf.',
        inGame: 'Regionalliga mit vier Staffeln als 3. Ebene',
      },
      {
        topic: 'liga',
        title: '2. Liga mit 18 Vereinen',
        text: 'Die 2. Liga schrumpft ab 1994/95 auf 18 Vereine.',
      },
      {
        topic: 'liga',
        title: 'Aus gegen Bulgarien',
        text: 'Im Juli 1994 scheidet der Titelverteidiger im WM-Viertelfinale mit 1:2 gegen Bulgarien aus.',
      },
    ],
    society: [
      {
        topic: 'politik',
        title: 'Abschied der Truppen',
        text: 'Ende August 1994 verlassen die letzten russischen Soldaten Deutschland, wenige Tage später auch die Westalliierten Berlin.',
      },
      {
        topic: 'politik',
        title: 'Bundestagswahl 1994',
        text: 'Im Oktober 1994 wird die Regierungskoalition knapp bestätigt.',
      },
      {
        topic: 'kultur',
        title: 'Formel-1-Weltmeister aus Kerpen',
        text: 'Ein Rennfahrer aus Kerpen wird im November 1994 erster deutscher Formel-1-Weltmeister. Sonntags läuft nun auch Formel 1.',
      },
      {
        topic: 'alltag',
        title: 'Grenzen ohne Kontrolle',
        text: 'Seit März 1995 entfallen die Kontrollen an den Grenzen zu mehreren Nachbarländern (Schengen).',
      },
      {
        topic: 'kultur',
        title: 'Verhüllter Reichstag',
        text: 'Im Juni 1995 verhüllt ein Künstlerpaar den Reichstag. Millionen kommen nach Berlin.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1995/96',
    headline: 'Drei Punkte, drei Wechsel, Bosman',
    football: [
      {
        topic: 'regeln',
        title: 'Drei-Punkte-Regel',
        text: 'Ein Sieg zählt ab 1995/96 drei Punkte, ein Remis weiter einen. Angriff lohnt sich mehr als Mauern.',
        inGame: 'Sieg = 3 Punkte',
      },
      {
        topic: 'regeln',
        title: 'Drei Auswechslungen',
        text: 'Pro Spiel darfst du jetzt dreimal wechseln, unabhängig von der Position.',
        inGame: 'Höchstens 3 Wechsel, größere Ersatzbank',
      },
      {
        topic: 'geld',
        title: 'Das Bosman-Urteil',
        text: 'Am 15. Dezember 1995 urteilt der Europäische Gerichtshof: Nach Vertragsende darf keine Ablöse mehr verlangt werden, EU-Bürger dürfen nicht als Ausländer beschränkt werden.',
        inGame: 'Ablösefreie Wechsel nach Vertragsende',
      },
      {
        topic: 'liga',
        title: 'Sommerpokal als Tür nach Europa',
        text: 'Seit 1995 führt der Europaverband den Sommerpokal im Sommer. Wer ihn gewinnt, rückt in den Europa-Pokal.',
      },
      {
        topic: 'liga',
        title: 'EM 1996 in England',
        text: 'Im Juni 1996 spielt die EM erstmals mit 16 Teams. Bei Gleichstand nach 90 Minuten entscheidet in der K.-o.-Runde das Golden Goal.',
      },
    ],
    society: [
      {
        topic: 'alltag',
        title: 'Der PC geht online',
        text: 'Im August 1995 erscheint ein neues Betriebssystem für den Heim-PC, der frühere Staatskonzern startet seinen Onlinedienst. Ein Modem pfeift sich ins Internet.',
      },
      {
        topic: 'politik',
        title: 'Vier Millionen ohne Arbeit',
        text: 'Im Winter 1995/96 steigt die Arbeitslosigkeit über vier Millionen.',
      },
      {
        topic: 'kultur',
        title: 'Großfamilie und Boygroups',
        text: 'Eine singende Großfamilie füllt Hallen und Stadien, Boygroups und Eurodance beherrschen die Charts.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1996/97',
    headline: 'Europameister per Golden Goal',
    football: [
      {
        topic: 'liga',
        title: 'Europameister 1996',
        text: 'Am 30. Juni 1996 gewinnt Deutschland in London das EM-Finale gegen Tschechien 2:1 – ein eingewechselter Stürmer erzielt das erste Golden Goal eines großen Finales.',
      },
      {
        topic: 'geld',
        title: 'Die Bosman-Ära',
        text: 'Spieler mit auslaufendem Vertrag wechseln ablösefrei, Handgelder und Gehälter steigen. Für Spieler aus der EU gibt es keine Ausländerbegrenzung mehr, nur Nicht-EU-Spieler bleiben kontingentiert.',
      },
      {
        topic: 'medien',
        title: 'Digitales Bezahlfernsehen',
        text: 'Im Juli 1996 startet das erste digitale Abo-Fernsehen. Der Kampf um Pay-TV-Kunden beginnt.',
      },
    ],
    society: [
      {
        topic: 'alltag',
        title: 'Neue Rechtschreibung',
        text: 'Im Juli 1996 vereinbaren die deutschsprachigen Staaten eine Rechtschreibreform – aus „daß“ wird „dass“.',
      },
      {
        topic: 'politik',
        title: 'Rekord-Arbeitslosigkeit',
        text: 'Anfang 1997 sind in Deutschland deutlich über vier Millionen Menschen arbeitslos.',
      },
      {
        topic: 'kultur',
        title: 'Küken am Schlüsselbund',
        text: 'Das elektronische Haustier aus Japan wird 1997 zum Pausenhof-Hit.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1997/98',
    headline: 'Auch Zweite dürfen in die Königsklasse',
    football: [
      {
        topic: 'liga',
        title: 'Meisterliga für Vizemeister',
        text: 'Ab 1997/98 dürfen die Zweitplatzierten der großen Ligen in der Meisterliga mitspielen.',
      },
      {
        topic: 'liga',
        title: 'Kürzere Winterpause',
        text: 'Die Winterpause schrumpft auf etwa sechs Wochen, die Hallentour von 16 auf vier Turniere. Topklubs schicken oft die zweite Garnitur.',
        inGame: 'Weniger Hallenturniere',
      },
      {
        topic: 'liga',
        title: 'Ein Auftaktpokal vor der Saison',
        text: 'Seit dem Sommer 1997 spielen die besten Vereine der 1. Liga vor dem Saisonstart den Auftaktpokal aus.',
      },
      {
        topic: 'liga',
        title: 'WM 1998 mit 32 Teams',
        text: 'Im Juni 1998 spielt die WM in Frankreich erstmals mit 32 Mannschaften.',
      },
    ],
    society: [
      {
        topic: 'alltag',
        title: 'Jahrhundertflut an der Oder',
        text: 'Im Juli und August 1997 kämpfen Tausende Helfer und Soldaten an der Oder gegen das Hochwasser.',
      },
      {
        topic: 'kultur',
        title: 'Deutscher Toursieger',
        text: 'Im Juli 1997 gewinnt ein 23-jähriger Rostocker als erster Deutscher die Tour de France. Radsport boomt.',
      },
      {
        topic: 'kultur',
        title: 'Untergang im Kino',
        text: 'Ab Januar 1998 läuft ein Liebesdrama um einen sinkenden Ozeandampfer monatelang in den Kinos.',
      },
      {
        topic: 'alltag',
        title: 'Unglück von Eschede',
        text: 'Am 3. Juni 1998 entgleist ein ICE bei Eschede, 101 Menschen sterben.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1998/99',
    headline: 'Neue Regierung, neue Vereinsformen',
    football: [
      {
        topic: 'liga',
        title: 'WM-Aus gegen Kroatien',
        text: 'Im Juli 1998 scheidet Deutschland im WM-Viertelfinale 0:3 gegen Kroatien aus. Der Bundestrainer tritt im September zurück, ein Routinier aus dem Ruhestand folgt.',
      },
      {
        topic: 'geld',
        title: 'Profifußball als Kapitalgesellschaft',
        text: 'Im Oktober 1998 erlaubt der Fußballbund, Profiabteilungen in Kapitalgesellschaften auszugliedern. Die Mehrheit der Stimmen muss beim Verein bleiben (50+1).',
        inGame: 'Ausgliederung und Investor möglich',
      },
      {
        topic: 'regeln',
        title: 'Grätsche von hinten: Rot',
        text: 'Seit 1998 wird das Hineingrätschen von hinten mit der Roten Karte bestraft.',
      },
      {
        topic: 'taktik',
        title: 'Viererkette statt Libero',
        text: 'Raumdeckung und Viererkette verdrängen Libero und Manndeckung. Im Dezember 1998 erklärt ein junger Zweitliga-Trainer im Fernsehen die neue Abwehr.',
      },
      {
        topic: 'taktik',
        title: 'Talentförderung im Fokus',
        text: 'Nach dem WM-Aus wird über systematische Nachwuchsarbeit diskutiert. Erste Vereine bauen Leistungszentren auf, ab 2001 werden sie Pflicht.',
        inGame: 'Nachwuchsleistungszentrum baubar',
      },
      {
        topic: 'liga',
        title: 'Letzter Pokal der Pokalsieger',
        text: '1998/99 wird der Pokal der Pokalsieger zum letzten Mal ausgespielt.',
      },
    ],
    society: [
      {
        topic: 'politik',
        title: 'Regierungswechsel in Bonn',
        text: 'Nach 16 Jahren unter demselben Kanzler wird im Oktober 1998 ein Sozialdemokrat aus Niedersachsen Kanzler einer rot-grünen Koalition.',
      },
      {
        topic: 'alltag',
        title: 'Der Euro als Buchgeld',
        text: 'Seit 1. Januar 1999 gibt es den Euro im Bankverkehr. Bar bezahlt wird weiter in D-Mark.',
      },
      {
        topic: 'politik',
        title: 'Kosovo-Einsatz',
        text: 'Im März 1999 beteiligt sich die Bundeswehr an den NATO-Luftangriffen im Kosovo-Krieg.',
      },
      {
        topic: 'politik',
        title: 'Bundestag im Reichstag',
        text: 'Im April 1999 tagt der Bundestag erstmals im umgebauten Reichstagsgebäude in Berlin.',
      },
      {
        topic: 'alltag',
        title: 'Handy für alle',
        text: 'Prepaid-Karten machen das Handy massentauglich, SMS werden zum Volkssport.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '1999/2000',
    headline: 'Countdown zum Jahrtausend',
    football: [
      {
        topic: 'liga',
        title: 'Meisterliga mit 32 Teams',
        text: 'Ab 1999/2000 spielen 32 Mannschaften in der Meisterliga – mit zwei Gruppenphasen und vielen Zusatzspielen.',
      },
      {
        topic: 'liga',
        title: 'Pokalsieger im Europa-Pokal',
        text: 'Ohne Pokal der Pokalsieger spielen die nationalen Pokalsieger im Europa-Pokal, der größer und wichtiger wird.',
        inGame: 'Pokalsieger spielen im Europa-Pokal',
      },
      {
        topic: 'liga',
        title: 'EM 2000 in Belgien und Holland',
        text: 'Im Juni 2000 steigt die erste EM in zwei Gastgeberländern.',
      },
      {
        topic: 'medien',
        title: 'Bewerbung um die WM 2006',
        text: 'Deutschland bewirbt sich um die WM 2006. Im Juli 2000 entscheidet der Weltverband.',
      },
    ],
    society: [
      {
        topic: 'alltag',
        title: 'Sonnenfinsternis',
        text: 'Am 11. August 1999 verdunkelt sich der Himmel über Süddeutschland – Millionen schauen mit Spezialbrillen zu.',
      },
      {
        topic: 'alltag',
        title: '„Bin ich schon drin?“',
        text: 'Das Internet erreicht die Wohnzimmer, Werbung mit einem Tennisstar macht den Einstieg zum Witz.',
      },
      {
        topic: 'alltag',
        title: 'Angst vor dem Jahr 2000',
        text: 'Firmen und Behörden prüfen ihre Computer auf den „Millennium-Bug“. Die Silvesternacht verläuft ruhig.',
      },
      {
        topic: 'politik',
        title: 'CDU-Spendenaffäre',
        text: 'Ab November 1999 erschüttert die Affäre um schwarze Kassen die CDU.',
      },
      {
        topic: 'kultur',
        title: 'Reality-TV im Container',
        text: 'Ab März 2000 läuft im Privatfernsehen eine Container-Show – das Reality-TV ist da.',
      },
    ],
  },
];

// =============================================================================
// Quellen (abgerufen Oktober/November 2026)
//  - bundesliga.com, „60 Jahre Bundesliga: 1983–1993“ (Live-TV 11.12.1984, Premiere
//    2.3.1991, „Mein Freund ist Ausländer“ Dez. 1992, Zuschauerschnitt):
//    https://www.bundesliga.com/de/bundesliga/news/60-jahre-bundesliga-1983-1993-live-tv-24519
//  - streamwert.de, „Bundesliga TV-Rechte: 60 Jahre Fußball im Fernsehen“ (1965: 650.000 DM,
//    1988: 40 Mio. DM/Saison, 1992 ISPR 700 Mio. DM/5 Jahre):
//    https://streamwert.de/2026/03/23/bundesliga-tv-rechte-60-jahre-fussball-im-fernsehen/
//  - horizont.net, „Vom TV-Verbot bis zum Milliardendeal“:
//    https://www.horizont.net/medien/nachrichten/vom-tv-verbot-bis-zum-milliardendeal-wie-die-bundesliga-in-60-jahren-zum-medienspektakel-wurde-213983
//  - 90min.de, „Alte Fußballregeln“ (Abseits/Notbremse 1990, Gelb-Rot 1991, Rückpass 1992,
//    Gelbsperre 1979/80, Grätsche 1998, drei Wechsel 1995/96, Golden Goal):
//    https://www.90min.de/posts/6321935-alte-fussballregeln-diese-gesetze-haben-sich-veraendert
//  - web.de, „Otto Rehhagels Wechselfehler“ (2+1-Wechselregel, Nicht-EU-Kontingent):
//    https://web.de/magazine/sport/fussball/otto-rehhagels-wechselfehler-25-jahren-38703610
//  - taz, 2.2.1990 (3+2-Ausländerregel ab 1993): https://taz.de/Hoch-lebe-die-deutsche-Bundesliga/!1782158/
//  - en.wikipedia.org: Bosman ruling, Promotion to the Bundesliga (Relegation 1981/82–1990/91,
//    1992/93–2007/08 drei Direktaufsteiger), Foreign football players in Germany.
//  - museumofjerseys.com, „Great one-offs: Hamburg and Stuttgart 1992“.
//  - Projektintern: docs/research/football-history-design-data-1975-2030.md,
//    data/indoorHistory.ts, data/campDestinations.ts, data/timeline.ts, data/reforms.ts.
// =============================================================================

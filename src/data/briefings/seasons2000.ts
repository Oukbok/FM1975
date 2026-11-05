// =============================================================================
// SAISON-BRIEFINGS 2000/01 – 2034/35
// -----------------------------------------------------------------------------
// Je Saison: was sich im Fußball ändert (football) und was die Gesellschaft in
// Deutschland bewegt (society). Format: ./types.ts.
//
// Abgleich mit dem Spiel: Wo das Spiel eine Neuerung zu einem Jahr umsetzt
// (data/timeline.ts, data/reforms.ts, engine/match/era.ts, engine/economy.ts,
// data/indoorHistory.ts, data/campDestinations.ts, game/youthInvest.ts,
// data/groundsCatalog.ts, engine/environment.ts, engine/clubBusiness.ts,
// engine/clubEconomy.ts), nennt der Eintrag dasselbe Jahr und trägt `inGame`.
//
// Ab 2026/27: nur bereits beschlossene/angekündigte Dinge; alles andere ist als
// „Spielwelt-Ausblick“ gekennzeichnet und erfindet keine Ereignisse realer
// Personen. Quellen am Dateiende.
// =============================================================================
import type { SeasonBriefingEntry } from './types';

export const SEASONS_2000: SeasonBriefingEntry[] = [
  // ---------------------------------------------------------------------------
  {
    season: '2000/01',
    headline: 'Neustart nach dem EM-Debakel',
    football: [
      { topic: 'taktik', title: 'Lehren aus der EM 2000', text: 'Nach dem Vorrunden-Aus bei der EM in Belgien und den Niederlanden ziehen Liga und DFB Konsequenzen: Ab 2001/02 braucht jeder Erstligist ein Nachwuchsleistungszentrum, ab 2002/03 auch jeder Zweitligist.', inGame: 'Plane jetzt: Ab 2001/02 kostet ein fehlendes Leistungszentrum in der 1. Liga jedes Jahr eine Geldstrafe (Jugend › Akademie).' },
      { topic: 'liga', title: 'WM 2006 kommt nach Deutschland', text: 'Am 6. Juli 2000 vergibt die FIFA die Weltmeisterschaft 2006 an Deutschland. Die Planungen für neue Arenen beginnen.' },
      { topic: 'geld', title: 'Kirch zahlt Milliarden', text: 'Die Kirch-Gruppe hat die Bundesliga-Rechte bis 2004 für rund drei Milliarden DM gekauft. Sat.1 zeigt die Zusammenfassungen bei „ran“, Premiere die Live-Spiele.' },
      { topic: 'geld', title: 'Stadionnamen zu verkaufen', text: 'Namensrechte werden zur neuen Einnahmequelle: Im Sommer 2001 trägt das Hamburger Stadion erstmals den Namen eines Internetdienstes.', inGame: 'Ab sofort kannst du die Namensrechte an deinem Stadion verkaufen.' },
      { topic: 'liga', title: 'Regionalliga nur noch zweigleisig', text: 'Die dritte Liga schrumpft von vier auf zwei Regionalliga-Staffeln (Nord und Süd).' },
      { topic: 'liga', title: 'Letztes Hallen-Masters', text: 'Im Januar 2001 steigt in Dortmund die letzte Endrunde des DFB-Hallenpokals.', inGame: 'Letzter Winter mit Hallentour und Masters-Endrunde (Statistiken › Halle).' },
    ],
    society: [
      { topic: 'politik', title: 'Der Euro als Buchgeld', text: 'Überwiesen wird schon in Euro, bezahlt noch in D-Mark. Viele Geschäfte zeichnen ihre Preise bereits doppelt aus.' },
      { topic: 'alltag', title: 'UMTS-Milliarden', text: 'Im August 2000 bringt die Versteigerung der UMTS-Mobilfunklizenzen dem Bund fast 100 Milliarden DM. Handy und SMS sind längst Alltag, auch für Spielstände.' },
      { topic: 'politik', title: 'Die Börsenblase platzt', text: 'Die Kurse am Neuen Markt brechen ein. Viele Kleinanleger, die mit Internet-Aktien reich werden wollten, verlieren Geld.' },
      { topic: 'alltag', title: 'BSE-Krise', text: 'Im November 2000 wird der erste BSE-Fall bei einem in Deutschland geborenen Rind bekannt. Rindfleisch verschwindet von vielen Speisekarten.' },
      { topic: 'kultur', title: 'Reality-TV', text: 'Seit März 2000 läuft „Big Brother“ auf RTL II und wird zum Dauergesprächsthema.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2001/02',
    headline: 'Das letzte Jahr der D-Mark',
    football: [
      { topic: 'geld', title: 'Euro an der Stadionkasse', text: 'Ab dem 1. Januar 2002 zahlen Fans Eintritt, Bier und Schal in Euro; ein Euro entspricht 1,95583 DM.', inGame: 'Ab Januar 2002 zeigt das Spiel alle Beträge in Euro.' },
      { topic: 'taktik', title: 'Leistungszentrum ist Lizenzpflicht', text: 'Seit dieser Saison bekommt nur noch eine Erstliga-Lizenz, wer ein Nachwuchsleistungszentrum betreibt.', inGame: 'Erstligisten ohne vollständiges Leistungszentrum zahlen jährlich eine Geldstrafe, der Ruf der Akademie leidet.' },
      { topic: 'liga', title: 'Die DFL übernimmt', text: 'Seit Sommer 2001 organisiert und vermarktet die Deutsche Fußball Liga (DFL) die beiden Bundesligen. Der DFB bleibt für Nationalteams, Pokal und Amateure zuständig.' },
      { topic: 'liga', title: 'Hallen-Masters abgeschafft', text: 'Der DFB stellt den Hallenpokal ein: kürzere Winterpause, Verletzungsangst und Absagen der Topklubs. Nur regionale Hallenturniere laufen noch.', inGame: 'Im Winter gibt es nur noch regionale Hallenturniere ohne Masters.' },
      { topic: 'geld', title: 'Kirch-Imperium wankt', text: 'Im April 2002 meldet KirchMedia Insolvenz an. Die Vereine bangen um vereinbarte Fernsehgelder.' },
      { topic: 'liga', title: 'WM erstmals in Asien', text: 'Die WM 2002 findet im Sommer erstmals in Asien und erstmals mit zwei Gastgebern statt: Japan und Südkorea.' },
    ],
    society: [
      { topic: 'politik', title: 'Der 11. September', text: 'Die Anschläge in den USA am 11. September 2001 verändern die Weltpolitik. Europapokalspiele am Folgetag werden verschoben, Sicherheitskonzepte verschärft.' },
      { topic: 'alltag', title: 'Euro-Bargeld', text: 'Am 1. Januar 2002 kommen Euro-Münzen und -Scheine; bis Ende Februar darf noch mit D-Mark bezahlt werden. Bald ist vom „Teuro“ die Rede.' },
      { topic: 'politik', title: 'PISA-Schock', text: 'Im Dezember 2001 zeigt die erste PISA-Studie deutliche Schwächen deutscher Schülerinnen und Schüler. Bildung wird zum Dauerthema.' },
      { topic: 'politik', title: 'Eingetragene Partnerschaft', text: 'Seit August 2001 können gleichgeschlechtliche Paare eine eingetragene Lebenspartnerschaft schließen.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2002/03',
    headline: 'Kirch-Pleite und Transferfenster',
    football: [
      { topic: 'geld', title: 'Weniger Fernsehgeld', text: 'Nach der Kirch-Pleite fließt deutlich weniger TV-Geld als vereinbart. Mehrere Vereine geraten in finanzielle Schwierigkeiten.', inGame: 'Die TV-Einnahmen sinken für zwei Spielzeiten spürbar.' },
      { topic: 'liga', title: 'Feste Wechselperioden', text: 'FIFA und UEFA führen verbindliche Transferfenster ein: Wechsel sind nur noch im Sommer und in einem kurzen Winterfenster möglich.' },
      { topic: 'taktik', title: 'DFB-Talentförderprogramm', text: 'Der DFB startet 2002 ein bundesweites Netz von Stützpunkten, an denen Talente ab elf Jahren zusätzlich trainiert werden.', inGame: 'Alle Scouting-Netze finden mehr herausragende Talente.' },
      { topic: 'taktik', title: 'NLZ auch in der 2. Liga', text: 'Ab dieser Saison ist das Nachwuchsleistungszentrum auch für Zweitligisten Lizenzbedingung.', inGame: 'Auch in der 2. Liga gibt es ohne Leistungszentrum Geldstrafen.' },
      { topic: 'liga', title: 'Letzte Zwischenrunde', text: 'Die Champions League spielt 2002/03 zum letzten Mal zwei Gruppenphasen hintereinander.' },
    ],
    society: [
      { topic: 'alltag', title: 'Jahrhundertflut an der Elbe', text: 'Im August 2002 überflutet das Hochwasser von Elbe und Mulde weite Teile Sachsens und Sachsen-Anhalts. Die Spendenbereitschaft ist riesig.' },
      { topic: 'politik', title: 'Bundestagswahl 2002', text: 'Im September 2002 wird die rot-grüne Koalition knapp bestätigt.' },
      { topic: 'politik', title: 'Agenda 2010', text: 'Im März 2003 kündigt Kanzler Gerhard Schröder umfassende Reformen bei Arbeitsmarkt und Sozialsystemen an.' },
      { topic: 'alltag', title: 'Pfand auf Dosen', text: 'Seit dem 1. Januar 2003 gibt es Pfand auf Einweg-Getränkedosen und -flaschen.' },
      { topic: 'politik', title: 'Irak-Krieg', text: 'Im März 2003 beginnt der Irak-Krieg; Deutschland beteiligt sich nicht. Hunderttausende gehen gegen den Krieg auf die Straße.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2003/04',
    headline: 'Weltmeisterinnen und Sportwissenschaft',
    football: [
      { topic: 'liga', title: 'Frauen werden Weltmeister', text: 'Im Oktober 2003 gewinnt die Frauen-Nationalmannschaft in den USA erstmals die WM, per Golden Goal im Finale gegen Schweden.' },
      { topic: 'liga', title: 'Achtelfinale statt Zwischenrunde', text: 'In der Champions League folgt auf die Gruppenphase nun ein Achtelfinale mit Hin- und Rückspiel.' },
      { topic: 'taktik', title: 'Athletik und Medienprofis', text: 'Athletiktrainer, Leistungsdiagnostik und professionelle Medienabteilungen ziehen in die Vereine ein.', inGame: 'Neue Mitarbeiterrollen und ein Leistungszentrum auf dem Vereinsgelände werden verfügbar.' },
      { topic: 'medien', title: 'Mehr Zahlen im Fernsehen', text: 'Datenanbieter erfassen immer mehr: Passquoten und erste Laufwerte tauchen in Übertragungen auf.', inGame: 'Spielberichte zeigen jetzt Pässe und Laufdistanz.' },
      { topic: 'liga', title: 'Budenzauber vor dem Ende', text: 'Die letzten regionalen Hallenturniere mit Profiteams laufen aus.', inGame: 'Letzter Winter mit Hallenturnieren für Profimannschaften.' },
      { topic: 'liga', title: 'EM 2004 in Portugal', text: 'Im Sommer 2004 spielt Europa in Portugal um den EM-Titel. Danach schafft das IFAB Golden und Silver Goal in der Verlängerung wieder ab.' },
    ],
    society: [
      { topic: 'politik', title: 'Hartz-Gesetze beschlossen', text: 'Im Dezember 2003 werden die Arbeitsmarktreformen beschlossen: Arbeitslosen- und Sozialhilfe sollen 2005 zusammengelegt werden.' },
      { topic: 'alltag', title: 'Zehn Euro Praxisgebühr', text: 'Seit Januar 2004 kostet der erste Arztbesuch im Quartal zehn Euro Praxisgebühr.' },
      { topic: 'politik', title: 'Die EU wächst', text: 'Am 1. Mai 2004 treten zehn Staaten der EU bei, darunter Polen und Tschechien.' },
      { topic: 'alltag', title: 'Handy mit Kamera', text: 'Fotohandys mit Farbdisplay werden erschwinglich. Erste verwackelte Bilder aus dem Fanblock machen die Runde.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2004/05',
    headline: 'Neuer Bundestrainer, verkaufte Spiele',
    football: [
      { topic: 'taktik', title: 'Neuer Bundestrainer', text: 'Ein Weltmeister von 1990 übernimmt im Sommer 2004 die Nationalmannschaft und bringt Fitnesstrainer aus den USA, Psychologen und neue Trainingsmethoden mit.' },
      { topic: 'liga', title: 'Der Wettskandal', text: 'Im Januar 2005 wird bekannt, dass ein Schiedsrichter Spiele für eine Wettmafia manipuliert hat. Betroffen sind DFB-Pokal und 2. Liga.' },
      { topic: 'geld', title: 'Arenen statt Schüsseln', text: 'Für die WM entstehen reine Fußballarenen mit Logen; im Mai 2005 öffnet in München die neue Arena im Norden der Stadt.', inGame: 'Stadionausbau heißt jetzt „Ausbau zur Arena“: teurer pro Platz, dafür mehr Logen.' },
      { topic: 'liga', title: 'Confed-Cup als Generalprobe', text: 'Im Juni 2005 testet Deutschland mit dem Konföderationen-Pokal Stadien, Verkehr und Sicherheit für die WM.' },
      { topic: 'liga', title: 'UEFA-Pokal mit Gruppen', text: 'Der UEFA-Pokal bekommt eine Gruppenphase mit Fünfergruppen.' },
      { topic: 'medien', title: 'Vereine erzählen Geschichte', text: 'Vereinsmuseen entstehen, 2004 etwa bei Hamburg Blau im eigenen Stadion.', inGame: 'Ein Vereinsmuseum ist baubar (Verein › Gelände).' },
    ],
    society: [
      { topic: 'politik', title: 'Hartz IV startet', text: 'Seit dem 1. Januar 2005 gibt es das Arbeitslosengeld II. Die Reform bleibt heftig umstritten.' },
      { topic: 'alltag', title: 'Tsunami im Indischen Ozean', text: 'Die Flutwelle vom 26. Dezember 2004 trifft auch viele deutsche Urlauber. Die Spendenbereitschaft erreicht Rekordwerte.' },
      { topic: 'kultur', title: '„Wir sind Papst“', text: 'Im April 2005 wird Joseph Ratzinger als Benedikt XVI. zum Papst gewählt.' },
      { topic: 'politik', title: 'Neuwahl angekündigt', text: 'Im Mai 2005 kündigt Kanzler Schröder vorgezogene Bundestagswahlen für den Herbst an.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2005/06',
    headline: 'Countdown zum Sommermärchen',
    football: [
      { topic: 'liga', title: 'WM im eigenen Land', text: 'Vom 9. Juni bis 9. Juli 2006 ist Deutschland Gastgeber der WM mit 32 Teams in zwölf Stadien.' },
      { topic: 'medien', title: 'Die Ultras prägen die Kurve', text: 'Ultragruppen mit großen Choreografien bestimmen die Stimmung – und protestieren gegen Kommerz und Anstoßzeiten.', inGame: 'Neue Fan-Epoche „Ultra-Kultur“: Die Stimmung schwankt stärker, Ticketpreise werden kritischer gesehen.' },
      { topic: 'geld', title: 'Logen und Business-Seats', text: 'Hospitality wird zur festen Einnahmesäule der neuen Arenen; die Anforderungen an Flutlicht steigen.', inGame: 'Premium-Hospitality und Flutlicht mit 1.400 Lux sind baubar.' },
      { topic: 'taktik', title: 'Fitness nach US-Vorbild', text: 'Die Nationalelf arbeitet mit amerikanischen Fitnessexperten und Gummibändern. In der Liga wird erst gespottet, dann kopiert.' },
      { topic: 'medien', title: 'Überraschung beim Pay-TV', text: 'Im Dezember 2005 sichert sich der Kabelanbieter Unity Media („arena“) die Pay-TV-Rechte ab 2006/07; Premiere geht leer aus.' },
    ],
    society: [
      { topic: 'politik', title: 'Erste Kanzlerin', text: 'Im November 2005 wird Angela Merkel als erste Frau Bundeskanzlerin einer großen Koalition.' },
      { topic: 'alltag', title: 'Mehrwertsteuer soll steigen', text: 'Die Koalition beschließt, die Mehrwertsteuer zum 1. Januar 2007 von 16 auf 19 Prozent anzuheben.' },
      { topic: 'alltag', title: 'Vogelgrippe auf Rügen', text: 'Im Februar 2006 werden auf Rügen tote Wildvögel mit Vogelgrippe gefunden; Geflügel muss in den Stall.' },
      { topic: 'kultur', title: 'Fahnen und Fanmeilen', text: 'Im Juni 2006 hängen Deutschlandfahnen an Autos und Balkonen, Public Viewing auf Fanmeilen wird zum Massenerlebnis.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2006/07',
    headline: 'Nach dem Sommermärchen',
    football: [
      { topic: 'liga', title: 'Der WM-Effekt', text: 'Nach der Heim-WM strömen mehr Familien und neue Fans in die modernisierten Stadien.', inGame: 'Die Zuschauernachfrage steigt ligaweit spürbar.' },
      { topic: 'taktik', title: 'Der Assistent übernimmt', text: 'Der bisherige Assistent wird im Juli 2006 Bundestrainer und setzt auf schnelles Kurzpassspiel.' },
      { topic: 'medien', title: 'Bundesliga bei arena', text: 'Live-Spiele laufen nun beim Pay-TV-Sender arena; viele Fans brauchen neue Receiver oder Kabelverträge. Die ARD-„Sportschau“ bleibt.' },
      { topic: 'medien', title: 'Fanmeile vor dem Stadion', text: 'Großbildleinwände und Fan-Zonen nach WM-Vorbild tauchen auch an Bundesliga-Spieltagen auf.', inGame: 'Fan-Zone mit Großbildleinwand baubar (Verein › Gelände).' },
      { topic: 'geld', title: 'Stadion als Ausflugsziel', text: 'Führungen durch Kabine und Spielertunnel werden beliebt und bringen zusätzliche Einnahmen.', inGame: 'Arena-Touren sind baubar.' },
    ],
    society: [
      { topic: 'alltag', title: '19 Prozent Mehrwertsteuer', text: 'Seit dem 1. Januar 2007 gilt der höhere Mehrwertsteuersatz; vieles im Alltag wird teurer.' },
      { topic: 'politik', title: 'Elterngeld kommt', text: 'Seit Januar 2007 gibt es das Elterngeld, mit „Partnermonaten“ auch für Väter.' },
      { topic: 'alltag', title: 'Orkan Kyrill', text: 'Im Januar 2007 legt der Orkan Kyrill den Bahnverkehr bundesweit lahm.' },
      { topic: 'politik', title: 'Rente mit 67', text: 'Im März 2007 beschließt der Bundestag die schrittweise Anhebung des Rentenalters auf 67 Jahre.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2007/08',
    headline: 'Das Smartphone kommt',
    football: [
      { topic: 'liga', title: 'Wieder Weltmeisterinnen', text: 'Im September 2007 verteidigen die deutschen Frauen in China ihren WM-Titel – ohne ein einziges Gegentor im Turnier.' },
      { topic: 'medien', title: 'Premiere zurück', text: 'Nach dem Fehlstart von arena zeigt Premiere die Live-Spiele wieder, per Sublizenz.' },
      { topic: 'liga', title: 'Letzter Ligapokal', text: 'Im Juli 2007 wird der DFL-Ligapokal zum letzten Mal ausgespielt.' },
      { topic: 'liga', title: 'Kampf um die 3. Liga', text: 'Zur Saison 2008/09 kommt eine eingleisige 3. Liga. Die Regionalligisten spielen um die Startplätze.', inGame: 'In der Regionalliga zählt diese Saison doppelt: Die Besten jeder Staffel qualifizieren sich für die neue 3. Liga.' },
      { topic: 'liga', title: 'EM in den Alpen', text: 'Im Juni 2008 richten Österreich und die Schweiz gemeinsam die EM aus.' },
    ],
    society: [
      { topic: 'alltag', title: 'iPhone in Deutschland', text: 'Am 9. November 2007 kommt das iPhone nach Deutschland. Das Smartphone verändert, wie Fans Ergebnisse, Videos und Nachrichten verfolgen.' },
      { topic: 'alltag', title: 'Rauchverbote in Kneipen', text: 'Bund und Länder verbieten 2007/08 das Rauchen in Behörden, Bahnhöfen und den meisten Gaststätten.' },
      { topic: 'politik', title: 'Streik bei der Bahn', text: 'Die Lokführergewerkschaft GDL legt den Bahnverkehr im Herbst und Winter mehrfach lahm – auch Auswärtsfahrer stranden.' },
      { topic: 'politik', title: 'Die Bankenkrise beginnt', text: 'Die US-Immobilienkrise erreicht deutsche Banken wie die IKB und die Sachsen LB.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2008/09',
    headline: 'Neue 3. Liga, große Krise',
    football: [
      { topic: 'liga', title: 'Die 3. Liga startet', text: 'Unter der 2. Bundesliga spielt nun eine eingleisige 3. Liga mit 20 Vereinen; die Regionalliga wird viertklassig und hat drei Staffeln.', inGame: 'Die Ligapyramide bekommt eine 3. Liga; die Regionalliga rückt auf Ebene 4.' },
      { topic: 'liga', title: 'Relegation ist zurück', text: 'Der 16. der Bundesliga spielt wieder gegen den Dritten der 2. Liga, der 16. der 2. Liga gegen den Dritten der 3. Liga.' },
      { topic: 'geld', title: 'Erlebniswelten und Vereins-TV', text: 'Fanshops werden zu Megastores, Vereine bauen eigene Medienzentren und Vereinsfernsehen im Netz auf.', inGame: 'Erlebnis-Megastore, Medienzentrum und Fanhaus der Kurve sind baubar.' },
      { topic: 'geld', title: 'Krise erreicht Sponsoren', text: 'Die Finanzkrise trifft Banken und Konzerne, die als Sponsoren auftreten. Neue Verträge werden vorsichtiger verhandelt.' },
    ],
    society: [
      { topic: 'politik', title: 'Lehman-Pleite', text: 'Mit der Pleite der US-Bank Lehman Brothers im September 2008 eskaliert die Finanzkrise. Die Regierung garantiert die Spareinlagen.' },
      { topic: 'alltag', title: 'Prämie fürs Abwracken', text: 'Ab Januar 2009 gibt es 2.500 Euro, wer sein altes Auto verschrotten lässt und ein neues kauft.' },
      { topic: 'alltag', title: 'Kurzarbeit statt Kündigung', text: 'Hunderttausende Beschäftigte gehen in Kurzarbeit, um Entlassungen zu vermeiden.' },
      { topic: 'kultur', title: 'Soziale Netzwerke', text: 'StudiVZ, wer-kennt-wen und Facebook ziehen Millionen Nutzer an. Fanclubs organisieren sich zunehmend online.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2009/10',
    headline: 'Europa League und Vuvuzelas',
    football: [
      { topic: 'liga', title: 'Aus UEFA-Pokal wird Europa League', text: 'Der zweite Europapokal heißt jetzt Europa League und spielt eine Gruppenphase mit 48 Teams.', inGame: 'Der Europa-Pokal hat eine Gruppenphase mit mehr Spielen und höheren Prämien.' },
      { topic: 'medien', title: 'Premiere wird Sky', text: 'Im Juli 2009 wird aus Premiere Sky Deutschland. Die ARD-„Sportschau“ zeigt weiter die Zusammenfassungen.' },
      { topic: 'geld', title: 'Neuer TV-Vertrag', text: 'Bis 2013 erhält die Liga gut 400 Mio. Euro pro Saison aus der nationalen Vermarktung.' },
      { topic: 'regeln', title: 'Torrichter im Test', text: 'In der Europa League stehen versuchsweise zwei zusätzliche Schiedsrichterassistenten an den Torlinien.' },
      { topic: 'liga', title: 'WM in Südafrika', text: 'Im Sommer 2010 findet die WM erstmals in Afrika statt. Der Klang der Vuvuzelas wird zum Markenzeichen.' },
    ],
    society: [
      { topic: 'politik', title: 'Bundestagswahl 2009', text: 'Im September 2009 bilden Union und FDP eine neue Regierung.' },
      { topic: 'alltag', title: 'Aschewolke über Europa', text: 'Im April 2010 legt ein isländischer Vulkan den Flugverkehr lahm; Barcelona fährt mit dem Bus zum Halbfinale nach Mailand.' },
      { topic: 'politik', title: 'Euro-Krise', text: 'Im Mai 2010 erhält Griechenland das erste Hilfspaket. Der Euro gerät unter Druck.' },
      { topic: 'alltag', title: 'Tablets und Apps', text: 'Smartphones und das erste iPad machen Apps zum Alltag, auch für Liveticker und Tabellen.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2010/11',
    headline: 'Fairplay-Regeln und Frauen-WM',
    football: [
      { topic: 'geld', title: 'Finanzielles Fairplay', text: 'Die UEFA beschließt 2010 das Finanzielle Fairplay: Wer europäisch spielen will, darf auf Dauer nicht mehr ausgeben, als er einnimmt.', inGame: 'Ab 2011/12 prüft das Spiel nach jeder Saison die Bilanz der letzten Jahre.' },
      { topic: 'liga', title: 'WM-Vergaben an Russland und Katar', text: 'Im Dezember 2010 vergibt die FIFA die WM 2018 an Russland und die WM 2022 an Katar. Die Kritik reißt nicht ab.' },
      { topic: 'taktik', title: 'Winterlager in Katar', text: 'Im Januar 2011 schlägt München Rot sein Winterquartier erstmals in Doha auf: perfekte Plätze, gute Sponsorenkontakte.', inGame: 'Katar wird als Winterziel für Spitzenvereine buchbar (Training › Trainingslager).' },
      { topic: 'taktik', title: 'Ballbesitz als Maßstab', text: 'Spaniens Weltmeister und Barcelona machen Kurzpassspiel und sofortiges Pressing zum Vorbild für ganz Europa.' },
      { topic: 'liga', title: 'Frauen-WM in Deutschland', text: 'Im Sommer 2011 richtet Deutschland die Frauen-WM aus; die Stadien sind gut gefüllt, die Quoten hoch.' },
      { topic: 'geld', title: 'Trikots weltweit online', text: 'Vereine verkaufen Fanartikel über eigene Onlineshops in alle Welt.', inGame: 'Ein internationaler Onlineshop ist baubar.' },
    ],
    society: [
      { topic: 'politik', title: 'Fukushima und Atomausstieg', text: 'Nach der Reaktorkatastrophe in Japan im März 2011 beschließt der Bundestag den Atomausstieg bis 2022.' },
      { topic: 'politik', title: 'Wehrpflicht ausgesetzt', text: 'Zum 1. Juli 2011 wird die Wehrpflicht ausgesetzt; an die Stelle des Zivildiensts tritt der Bundesfreiwilligendienst.' },
      { topic: 'alltag', title: 'E10 an der Zapfsäule', text: 'Anfang 2011 kommt der Biosprit E10 – viele Autofahrer trauen ihm nicht.' },
      { topic: 'politik', title: 'Streit um Stuttgart 21', text: 'Der Protest gegen den Bahnhofsneubau in Stuttgart bewegt im Herbst 2010 das ganze Land.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2011/12',
    headline: 'Euro-Krise, Pyro-Streit, TV-Sprung',
    football: [
      { topic: 'geld', title: 'Fairplay wird ernst', text: 'Mit dieser Saison beginnt der Beobachtungszeitraum des Finanziellen Fairplays; die ersten Prüfungen folgen 2013/14.', inGame: 'Ab jetzt prüft das Spiel nach jeder Saison deine Bilanz für die Europapokal-Lizenz.' },
      { topic: 'medien', title: 'Pyro-Gespräche gescheitert', text: 'Fanvertreter verhandeln mit DFB und DFL über legale Pyrotechnik; im Herbst 2011 erklärt der DFB die Gespräche für beendet.' },
      { topic: 'geld', title: 'TV-Geld steigt kräftig', text: 'Im April 2012 vergibt die DFL die Rechte ab 2013/14 für durchschnittlich rund 628 Mio. Euro pro Saison.' },
      { topic: 'liga', title: 'Regionalliga-Reform beschlossen', text: 'Ab 2012/13 wird die Regionalliga in fünf Staffeln gespielt; die Meister müssen in Aufstiegsspiele.' },
      { topic: 'liga', title: 'EM in Polen und der Ukraine', text: 'Im Juni 2012 findet die EM erstmals in Osteuropa statt.' },
    ],
    society: [
      { topic: 'politik', title: 'Euro-Rettungsschirm', text: 'Rettungspakete und der dauerhafte Rettungsschirm ESM bestimmen die Nachrichten.' },
      { topic: 'politik', title: 'Freiwillige statt Zivis', text: 'Die erste Saison ohne Wehr- und Zivildienst: Auch Sportvereine werben um Bundesfreiwillige.' },
      { topic: 'alltag', title: 'Energiewende auf dem Dach', text: 'Solaranlagen und Windräder breiten sich aus; die Ökostrom-Umlage auf der Stromrechnung steigt.' },
      { topic: 'kultur', title: 'Musik aus dem Netz', text: 'Im März 2012 startet Spotify in Deutschland; Streaming löst CD und Download langsam ab.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2012/13',
    headline: 'Stille Kurven und billiges Geld',
    football: [
      { topic: 'liga', title: 'Fünf Regionalligen', text: 'Die vierte Liga spielt nun in den Staffeln Nord, Nordost, West, Südwest und Bayern.' },
      { topic: 'medien', title: 'Protest „12:12“', text: 'Gegen das Sicherheitspapier der Liga schweigen Fans an mehreren Spieltagen 12 Minuten und 12 Sekunden lang. Im Dezember 2012 wird „Sicheres Stadionerlebnis“ trotzdem beschlossen.', inGame: 'Personalisierte Einlasskontrollen sind baubar: weniger Risiko, aber Unmut in der Kurve.' },
      { topic: 'regeln', title: 'Torlinientechnik erlaubt', text: 'Im Juli 2012 lässt das IFAB Torlinientechnik offiziell zu. Ob die Bundesliga sie nutzt, bleibt umstritten.' },
      { topic: 'geld', title: 'Zinsen im Keller', text: 'Die Europäische Zentralbank senkt den Leitzins auf Rekordtiefs; Kredite werden billig.', inGame: 'Kredite für Stadionprojekte werden günstiger.' },
      { topic: 'geld', title: 'Museum als Erlebnis', text: 'Große Vereine eröffnen interaktive Erlebnismuseen.', inGame: 'Ein Erlebnismuseum ist baubar.' },
    ],
    society: [
      { topic: 'alltag', title: 'Rundfunkbeitrag für alle', text: 'Seit Januar 2013 zahlt jeder Haushalt den Rundfunkbeitrag, egal ob mit oder ohne Fernseher.' },
      { topic: 'alltag', title: 'Fernbusse rollen', text: 'Seit 2013 dürfen Fernbusse im Inland fahren – günstige Tickets auch für Auswärtsfahrten.' },
      { topic: 'politik', title: 'NSA-Enthüllungen', text: 'Im Juni 2013 machen die Snowden-Dokumente die Massenüberwachung im Netz öffentlich.' },
      { topic: 'alltag', title: 'Hochwasser 2013', text: 'Im Juni 2013 treten Elbe, Donau und Saale über die Ufer; erneut sind viele Orte im Osten und Süden betroffen.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2013/14',
    headline: 'Daten, Phantomtor, WM in Brasilien',
    football: [
      { topic: 'geld', title: 'Mehr TV-Geld', text: 'Der neue Medienvertrag bringt der Liga ab 2013/14 im Schnitt rund 628 Mio. Euro pro Saison.' },
      { topic: 'taktik', title: 'Datenanalyse und Videoscouting', text: 'Tracking-Kameras erfassen jeden Laufweg; Analysten und Videoscouting werden Standard.', inGame: 'Datenanalyse-Zentrum baubar; Spielberichte zeigen nun Großchancen.' },
      { topic: 'regeln', title: 'Das Phantomtor', text: 'Im Oktober 2013 zählt in Sinsheim ein Kopfball eines Leverkuseners, der durch ein Loch im Außennetz ging. Die Debatte um Torlinientechnik wird lauter.' },
      { topic: 'liga', title: 'WM in Brasilien', text: 'Im Sommer 2014 nutzt die FIFA bei der WM erstmals Torlinientechnik und Freistoß-Spray.' },
    ],
    society: [
      { topic: 'politik', title: 'Große Koalition', text: 'Nach der Wahl im September 2013 regieren Union und SPD; ein gesetzlicher Mindestlohn wird vereinbart.' },
      { topic: 'politik', title: 'Rente mit 63', text: 'Ab Juli 2014 können langjährig Versicherte früher abschlagsfrei in Rente gehen.' },
      { topic: 'politik', title: 'Krim-Krise', text: 'Im März 2014 annektiert Russland die Krim; die EU verhängt Sanktionen.' },
      { topic: 'alltag', title: 'Messenger statt SMS', text: 'WhatsApp und Co. verdrängen die SMS; Gruppenchats ersetzen den Anruf beim Fanclub.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2014/15',
    headline: 'Weltmeister, Mindestlohn und Netflix',
    football: [
      { topic: 'liga', title: 'Mit dem vierten Stern', text: 'Im Juli 2014 hat Deutschland in Rio den WM-Titel gewonnen. Das Interesse am Fußball ist riesig.' },
      { topic: 'taktik', title: 'Sommerreise nach Amerika', text: 'Spitzenvereine nutzen die Vorbereitung für Marketingreisen in die USA.', inGame: 'Für große Vereine wird eine USA-Reise im Sommer buchbar.' },
      { topic: 'regeln', title: 'Torlinientechnik beschlossen', text: 'Im Dezember 2014 stimmen die Erstligisten für Torlinientechnik ab 2015/16.' },
      { topic: 'geld', title: 'Polizeikosten für Vereine', text: 'Bremen will Vereine an den Polizeikosten von Hochrisikospielen beteiligen; im April 2015 geht ein erster Bescheid von rund 425.000 Euro an die DFL.', inGame: 'Ab 2015 können Polizeigebühren für Hochrisikospiele anfallen.' },
      { topic: 'geld', title: 'Premier-League-Milliarden', text: 'Im Februar 2015 verkauft die Premier League ihre TV-Rechte ab 2016 für über fünf Milliarden Pfund. Der Druck auf die Bundesliga wächst.' },
      { topic: 'liga', title: 'Frauen-WM in Kanada', text: 'Im Sommer 2015 spielen erstmals 24 Teams um den Titel der Frauen-WM.' },
    ],
    society: [
      { topic: 'alltag', title: 'Der Mindestlohn kommt', text: 'Seit dem 1. Januar 2015 gilt ein gesetzlicher Mindestlohn von 8,50 Euro pro Stunde.' },
      { topic: 'kultur', title: 'Netflix startet', text: 'Im September 2014 startet Netflix in Deutschland; Serien werden „am Stück“ geschaut.' },
      { topic: 'kultur', title: 'Ice Bucket Challenge', text: 'Im Sommer 2014 kippen sich Prominente und Profis Eiswasser über den Kopf, um Spenden für ALS-Forschung zu sammeln.' },
      { topic: 'politik', title: 'Griechenland-Krise', text: 'Im Sommer 2015 steht Griechenland kurz vor dem Austritt aus dem Euro.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2015/16',
    headline: 'Torlinientechnik und Affären',
    football: [
      { topic: 'regeln', title: 'Torlinientechnik im Einsatz', text: 'Ab 2015/16 erkennen Kameras in der Bundesliga, ob der Ball die Linie überschritten hat; das Signal kommt in unter einer Sekunde.', inGame: 'In der 1. Liga gibt es keine Phantomtore mehr.' },
      { topic: 'taktik', title: 'Sommertour nach Asien', text: 'Spitzenvereine verlegen Teile der Vorbereitung nach China und Japan – Millionen-Erlöse, aber Jetlag.', inGame: 'Asienreisen im Sommer sind für die größten Vereine buchbar.' },
      { topic: 'medien', title: 'Social Media bestimmt die Stimmung', text: 'Vereine, Spieler und Fans kommunizieren über Facebook, Twitter und Instagram. Krisen und Hypes entstehen in Stunden.', inGame: 'Neue Fan-Epoche „Soziale Medien“: Die Stimmung schwankt so stark wie nie.' },
      { topic: 'liga', title: 'Affären bei FIFA und DFB', text: 'Im Herbst 2015 wird der FIFA-Präsident gesperrt und Zahlungen rund um die WM 2006 untersucht; der DFB-Präsident tritt zurück.' },
      { topic: 'geld', title: 'Die TV-Milliarde', text: 'Im Juni 2016 vergibt die DFL die Rechte ab 2017/18 für gut eine Milliarde Euro pro Saison.' },
      { topic: 'liga', title: 'EM mit 24 Teams', text: 'Im Sommer 2016 spielt die EM in Frankreich erstmals mit 24 Mannschaften.' },
    ],
    society: [
      { topic: 'politik', title: 'Fluchtbewegung 2015', text: 'Im Spätsommer 2015 kommen sehr viele Geflüchtete nach Deutschland. In vielen Stadien hängen „Refugees Welcome“-Banner, Vereine organisieren Hilfe.' },
      { topic: 'politik', title: 'Terror in Paris', text: 'Am 13. November 2015 explodieren Bomben am Stade de France während des Spiels gegen Frankreich. Das Länderspiel in Hannover vier Tage später wird abgesagt.' },
      { topic: 'alltag', title: 'Der Abgasskandal', text: 'Im September 2015 wird bekannt, dass ein großer Autokonzern Abgaswerte manipuliert hat – auch ein großer Fußballsponsor gerät unter Druck.' },
      { topic: 'politik', title: 'Brexit-Votum', text: 'Im Juni 2016 stimmt Großbritannien für den Austritt aus der EU.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2016/17',
    headline: 'Videobeweis im Probelauf',
    football: [
      { topic: 'regeln', title: 'Video-Assistent im Test', text: 'In der Bundesliga läuft der Videobeweis 2016/17 „offline“ mit: Die Technik wird geprobt, greift aber noch nicht ein.', inGame: 'Im Spiel greift der Video-Assistent bereits ab Januar 2017 ein.' },
      { topic: 'taktik', title: 'Expected Goals', text: 'Der Wert „xG“ wandert aus Analystenblogs in die Vereinsanalyse: Wie gut waren die Chancen wirklich?', inGame: 'Spielberichte zeigen jetzt xG.' },
      { topic: 'geld', title: 'Ablösen explodieren', text: 'Im August 2016 wechselt ein französischer Mittelfeldstar für rund 105 Mio. Euro zu Manchester Rot – Weltrekord.' },
      { topic: 'geld', title: 'China lockt', text: 'Klubs der chinesischen Super League locken im Winter mit Rekordgehältern und hohen Ablösen.' },
    ],
    society: [
      { topic: 'kultur', title: 'Pokémon Go', text: 'Im Sommer 2016 jagen Millionen mit dem Smartphone virtuelle Monster durch Parks und Innenstädte.' },
      { topic: 'politik', title: 'Mehr Sicherheit bei Großveranstaltungen', text: 'Nach dem Anschlag auf den Berliner Weihnachtsmarkt im Dezember 2016 werden Sicherheitskonzepte weiter verschärft.' },
      { topic: 'alltag', title: 'Smarte Lautsprecher', text: 'Smarte Lautsprecher ziehen in Wohnzimmer ein und lesen auf Zuruf die Bundesliga-Ergebnisse vor.' },
      { topic: 'alltag', title: 'Mindestlohn steigt', text: 'Seit Januar 2017 liegt der Mindestlohn bei 8,84 Euro.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2017/18',
    headline: 'Der Video-Assistent kommt',
    football: [
      { topic: 'regeln', title: 'Der Video-Assistent', text: 'Seit 2017/18 überprüft der Video-Assistent in der Bundesliga Tore, Elfmeter, Rote Karten und Verwechslungen.', inGame: 'In der 1. Liga gibt es Video-Überprüfungen.' },
      { topic: 'liga', title: 'Fußball am Montag', text: 'Erstmals finden einzelne Bundesligaspiele am Montagabend statt. Fans protestieren mit Bannern und Boykotten.' },
      { topic: 'geld', title: 'TV-Geld über einer Milliarde', text: 'Der neue Medienvertrag bringt im Schnitt rund 1,16 Milliarden Euro pro Saison; Eurosport zeigt Freitags- und Montagsspiele.' },
      { topic: 'geld', title: '222 Millionen', text: 'Im August 2017 wechselt Neymar für 222 Mio. Euro nach Paris. Die Preise im ganzen Markt ziehen an.' },
      { topic: 'liga', title: 'WM in Russland', text: 'Im Sommer 2018 setzt die FIFA bei einer WM erstmals den Video-Assistenten ein.' },
    ],
    society: [
      { topic: 'politik', title: 'Lange Regierungsbildung', text: 'Nach der Wahl im September 2017 dauert es fast ein halbes Jahr, bis im März 2018 eine Regierung steht.' },
      { topic: 'politik', title: 'Ehe für alle', text: 'Seit Oktober 2017 dürfen gleichgeschlechtliche Paare heiraten.' },
      { topic: 'alltag', title: 'Diesel-Fahrverbote', text: 'Im Februar 2018 erlaubt das Bundesverwaltungsgericht Fahrverbote für ältere Diesel in Städten.' },
      { topic: 'alltag', title: 'Datenschutz-Grundverordnung', text: 'Seit Mai 2018 gilt die DSGVO; auch Vereine müssen ihre Mitgliederdaten neu ordnen.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2018/19',
    headline: 'Nations League und Hitzesommer',
    football: [
      { topic: 'liga', title: 'Nach dem WM-Aus', text: 'Nach dem Vorrunden-Aus 2018 debattiert Deutschland über Ausbildung, Spielidee und Nachwuchsleistungszentren.' },
      { topic: 'liga', title: 'Nations League', text: 'Im September 2018 startet die UEFA Nations League und ersetzt viele Freundschaftsspiele.' },
      { topic: 'medien', title: 'Königsklasse im Pay-TV', text: 'Die Champions League läuft ab 2018/19 fast nur noch bei Sky und DAZN.' },
      { topic: 'regeln', title: 'VAR in Europa', text: 'Ab dem Achtelfinale 2018/19 setzt auch die Champions League den Video-Assistenten ein.' },
      { topic: 'liga', title: 'Frauen-WM in Frankreich', text: 'Im Sommer 2019 erreicht die Frauen-WM in Frankreich Rekordquoten.' },
    ],
    society: [
      { topic: 'alltag', title: 'Hitze und Dürre', text: 'Der Sommer 2018 ist extrem heiß und trocken; Rasenplätze verbrennen, Landwirte klagen über Ernteausfälle.' },
      { topic: 'politik', title: 'Fridays for Future', text: 'Ab Anfang 2019 demonstrieren Schülerinnen und Schüler freitags für mehr Klimaschutz.' },
      { topic: 'alltag', title: '5G-Auktion', text: 'Im Frühjahr 2019 versteigert der Bund die 5G-Frequenzen für rund 6,5 Milliarden Euro.' },
      { topic: 'alltag', title: 'Mindestlohn 9,19 Euro', text: 'Seit Januar 2019 liegt der Mindestlohn bei 9,19 Euro.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2019/20',
    headline: 'Die Saison der Geisterspiele',
    football: [
      { topic: 'regeln', title: 'VAR auch in der 2. Liga', text: 'Ab 2019/20 gibt es den Video-Assistenten auch in der 2. Bundesliga, nach dem Ausbau von Glasfaser und Stadiontechnik.', inGame: 'Auch in der 2. Liga gibt es Video-Überprüfungen.' },
      { topic: 'liga', title: 'Spiele ohne Publikum', text: 'Am 13. März 2020 stoppt die DFL wegen der Pandemie den Spielbetrieb. Am 16. Mai geht es als erste große Liga weiter – ohne Zuschauer.', inGame: 'Ab März 2020 keine Zuschauereinnahmen; die Stadien bleiben bis Frühjahr 2022 leer oder nur teilweise gefüllt.' },
      { topic: 'regeln', title: 'Fünf Wechsel', text: 'Zum Neustart im Mai 2020 erlaubt das IFAB vorübergehend fünf Auswechslungen in drei Unterbrechungen.', inGame: 'Im Spiel gelten fünf Wechsel und neun Ersatzspieler schon ab Januar 2020.' },
      { topic: 'geld', title: 'Hellere Stadien', text: 'Seit Juli 2019 verlangt die Lizenz in der 1. Liga eine Flutlicht-Beleuchtungsstärke von 1.600 Lux.', inGame: 'Lizenzauflage: 1.600 Lux Flutlicht in der 1. Liga.' },
      { topic: 'medien', title: 'DAZN zeigt Bundesliga', text: 'Per Sublizenz von Eurosport laufen Freitags- und Montagsspiele nun beim Streamingdienst DAZN.' },
      { topic: 'liga', title: 'Finalturnier in Lissabon', text: 'Die Champions League wird im August 2020 mit einem Finalturnier in Lissabon zu Ende gespielt.' },
    ],
    society: [
      { topic: 'alltag', title: 'Der erste Lockdown', text: 'Ab März 2020 schließen Schulen, Geschäfte und Restaurants; Homeoffice und Kontaktbeschränkungen bestimmen den Alltag.' },
      { topic: 'alltag', title: 'Masken und Warn-App', text: 'Ab April 2020 gilt Maskenpflicht in Läden und Bahnen, im Juni startet die Corona-Warn-App.' },
      { topic: 'politik', title: 'Kurzarbeit und Hilfspakete', text: 'Milliardenhilfen und Kurzarbeit sollen Jobs und Unternehmen durch die Krise retten.' },
      { topic: 'alltag', title: 'E-Scooter', text: 'Seit Juni 2019 sind E-Scooter erlaubt; Leihroller stehen bald an jeder Ecke, auch vor dem Stadion.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2020/21',
    headline: 'Leere Ränge, volle Terminkalender',
    football: [
      { topic: 'regeln', title: 'Fünf Wechsel bleiben', text: 'Wegen der dichten Spielpläne bleiben fünf Auswechslungen erlaubt; die Regel wird später dauerhaft.', inGame: 'Fünf Wechsel in drei Unterbrechungen, neun Spieler auf der Bank.' },
      { topic: 'liga', title: 'Weiter ohne Publikum', text: 'Fast die ganze Saison wird vor leeren Rängen gespielt; Pappfiguren und eingespielter Jubel ersetzen die Kurve.', inGame: 'Kaum Zuschauereinnahmen in dieser Saison.' },
      { topic: 'geld', title: 'Neuer TV-Vertrag', text: 'Im Juni 2020 vergibt die DFL die Rechte ab 2021/22 für durchschnittlich 1,1 Milliarden Euro pro Saison an Sky und DAZN.' },
      { topic: 'liga', title: 'Super-League-Versuch', text: 'Im April 2021 kündigen zwölf europäische Großklubs eine eigene Liga an. Nach Fanprotesten zerfällt das Projekt binnen zwei Tagen; deutsche Vereine machen nicht mit.' },
      { topic: 'liga', title: 'EM in elf Städten', text: 'Die um ein Jahr verschobene EM 2020 findet im Sommer 2021 in elf Ländern statt, auch in München.' },
    ],
    society: [
      { topic: 'alltag', title: 'Die Impfungen beginnen', text: 'Ende Dezember 2020 beginnen die Impfungen gegen das Coronavirus.' },
      { topic: 'alltag', title: 'Schule zu Hause', text: 'Im Winter 2020/21 lernen Kinder monatelang zu Hause, der Amateursport ruht.' },
      { topic: 'politik', title: 'Mehrwertsteuer gesenkt', text: 'Von Juli bis Dezember 2020 sinkt die Mehrwertsteuer auf 16 Prozent.' },
      { topic: 'alltag', title: 'CO2-Preis', text: 'Seit Januar 2021 kostet der Ausstoß von CO2 beim Heizen und Tanken extra; Sprit wird teurer.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2021/22',
    headline: 'Die Fans kehren zurück',
    football: [
      { topic: 'liga', title: 'Zuschauer mit Auflagen', text: 'Mit 2G- und 3G-Regeln dürfen wieder Fans ins Stadion; im Winter wird erneut ohne Publikum gespielt, ab März 2022 füllen sich die Ränge.' },
      { topic: 'liga', title: 'Montagsspiele abgeschafft', text: 'Seit 2021/22 gibt es in der Bundesliga keine Montagsspiele mehr.' },
      { topic: 'liga', title: 'Conference League', text: 'Die UEFA startet mit der Conference League einen dritten Europapokal.' },
      { topic: 'regeln', title: 'Auswärtstorregel fällt', text: 'In den Europapokalen zählen Auswärtstore bei Gleichstand nicht mehr doppelt.' },
      { topic: 'medien', title: 'Klubs als Medienhäuser', text: 'Instagram, TikTok und eigene Apps werden zu Hauptkanälen; Vereine stellen Social-Media-Redaktionen und Datenwissenschaftler ein.', inGame: 'Neue Fachkräfte für Social Media und Datenwissenschaft im Mitarbeiterstab.' },
    ],
    society: [
      { topic: 'alltag', title: 'Flut im Ahrtal', text: 'Im Juli 2021 zerstören Sturzfluten im Ahrtal und in Teilen Nordrhein-Westfalens ganze Orte.' },
      { topic: 'politik', title: 'Neue Regierung', text: 'Nach der Wahl im September 2021 regiert ab Dezember eine Koalition aus SPD, Grünen und FDP.' },
      { topic: 'politik', title: 'Krieg in der Ukraine', text: 'Am 24. Februar 2022 greift Russland die Ukraine an. Russische Teams werden aus den UEFA-Wettbewerben ausgeschlossen.' },
      { topic: 'alltag', title: 'Energiepreise und 9-Euro-Ticket', text: 'Gas, Strom und Sprit werden deutlich teurer. Von Juni bis August 2022 fährt man für 9 Euro im Monat bundesweit Nahverkehr.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2022/23',
    headline: 'Winter-WM und Energiekrise',
    football: [
      { topic: 'liga', title: 'WM im Winter', text: 'Vom 20. November bis 18. Dezember 2022 findet die WM in Katar statt. Die Bundesliga pausiert von Mitte November bis in den Januar.' },
      { topic: 'medien', title: 'Streit um die Binde', text: 'Die FIFA droht mit Gelben Karten für die „One Love“-Binde; die deutsche Elf hält sich beim Mannschaftsfoto den Mund zu.' },
      { topic: 'liga', title: 'Frauenfußball-Boom', text: 'Das EM-Finale der Frauen im Juli 2022 sehen in Deutschland fast 18 Millionen im Fernsehen; die Frauen-Bundesliga meldet Zuschauerrekorde.' },
      { topic: 'geld', title: 'Investor abgelehnt', text: 'Im Mai 2023 verfehlt der Plan, einen Investor an den Medienerlösen der Liga zu beteiligen, die nötige Mehrheit.' },
      { topic: 'geld', title: 'Die Zinswende', text: 'Ab Juli 2022 erhöht die EZB die Zinsen in schnellen Schritten; Kredite werden deutlich teurer.', inGame: 'Kreditzinsen für Stadionprojekte steigen wieder.' },
    ],
    society: [
      { topic: 'alltag', title: 'Hohe Inflation', text: 'Die Preise steigen so stark wie seit Jahrzehnten nicht; Entlastungspakete und Energiepreisbremsen sollen helfen.' },
      { topic: 'alltag', title: 'Das Deutschlandticket', text: 'Seit Mai 2023 gilt das Deutschlandticket für 49 Euro im Monat im ganzen Nahverkehr.' },
      { topic: 'alltag', title: 'Künstliche Intelligenz', text: 'Ende November 2022 erscheint ChatGPT; KI-Chatbots werden in wenigen Monaten zum Massenthema.' },
      { topic: 'politik', title: 'Bürgergeld und Atomausstieg', text: 'Im Januar 2023 löst das Bürgergeld Hartz IV ab, im April gehen die letzten drei Atomkraftwerke vom Netz.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2023/24',
    headline: 'Heim-EM und Tennisbälle',
    football: [
      { topic: 'liga', title: 'EM im eigenen Land', text: 'Vom 14. Juni bis 14. Juli 2024 richtet Deutschland die EM in zehn Stadien aus.' },
      { topic: 'medien', title: 'Tennisball-Proteste', text: 'Im Dezember 2023 stimmt die Liga einem Investorenmodell zu. Fans werfen Tennisbälle und Schokotaler, im Februar 2024 wird der Prozess gestoppt.' },
      { topic: 'geld', title: 'Rekordtransfer nach München', text: 'Im August 2023 wechselt Englands Kapitän für rund 100 Mio. Euro zu München Rot – Rekord in der Bundesliga.' },
      { topic: 'geld', title: 'Kaderkosten-Quote', text: 'Die UEFA begrenzt die Ausgaben für Gehälter, Ablösen und Berater schrittweise: 90 Prozent der Einnahmen 2023, 80 Prozent 2024, 70 Prozent ab 2025.' },
      { topic: 'liga', title: 'Frauen-WM in Australien und Neuseeland', text: 'Im Sommer 2023 spielen erstmals 32 Teams um den Titel der Frauen-WM.' },
    ],
    society: [
      { topic: 'alltag', title: 'Streit ums Heizungsgesetz', text: 'Seit Januar 2024 sollen neue Heizungen überwiegend mit erneuerbarer Energie laufen; der Streit darüber prägte den Sommer 2023.' },
      { topic: 'politik', title: 'Bauern blockieren Straßen', text: 'Im Dezember 2023 und Januar 2024 blockieren Landwirte mit Traktoren Straßen und Autobahnauffahrten.' },
      { topic: 'politik', title: 'Cannabis-Gesetz', text: 'Seit dem 1. April 2024 sind Besitz und Anbau kleiner Mengen Cannabis für Erwachsene erlaubt.' },
      { topic: 'alltag', title: 'KI im Alltag', text: 'Textgeneratoren und Bild-KI werden in Schule, Büro und Freizeit genutzt – und kontrovers diskutiert.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2024/25',
    headline: 'Mega-Champions-League und Neuwahlen',
    football: [
      { topic: 'liga', title: 'Ligaphase statt Gruppen', text: 'Champions League, Europa League und Conference League spielen mit 36 Teams in einer großen Ligaphase.', inGame: 'Die Meisterliga hat eine Ligaphase: mehr Spiele, mehr Prämien.' },
      { topic: 'regeln', title: 'Nur der Kapitän spricht', text: 'Nach dem Vorbild der EM 2024 soll im deutschen Profifußball nur noch der Kapitän mit dem Schiedsrichter diskutieren.' },
      { topic: 'geld', title: 'TV-Poker mit Schiedsgericht', text: 'Nach einem Streit mit DAZN vergibt die DFL im Dezember 2024 die Rechte ab 2025/26 neu – im Schnitt rund 1,12 Milliarden Euro pro Saison.' },
      { topic: 'geld', title: 'Polizeikosten bestätigt', text: 'Im Januar 2025 bestätigt das Bundesverfassungsgericht, dass Bremen die Liga an Polizeikosten für Hochrisikospiele beteiligen darf.', inGame: 'Polizeigebühren für Hochrisikospiele steigen ab 2025.' },
      { topic: 'liga', title: 'Klub-WM in den USA', text: 'Im Sommer 2025 spielen erstmals 32 Vereine bei der neuen Klub-WM in den USA.' },
    ],
    society: [
      { topic: 'politik', title: 'Ampel-Aus', text: 'Im November 2024 zerbricht die Regierungskoalition; am 23. Februar 2025 wird vorgezogen gewählt.' },
      { topic: 'alltag', title: 'Deutschlandticket wird teurer', text: 'Seit Januar 2025 kostet das Deutschlandticket 58 Euro im Monat.' },
      { topic: 'alltag', title: 'Elektronische Patientenakte', text: 'Ab 2025 bekommen gesetzlich Versicherte eine elektronische Patientenakte, sofern sie nicht widersprechen.' },
      { topic: 'alltag', title: 'Teure Lebensmittel', text: 'Lebensmittel und Restaurantbesuche bleiben spürbar teurer als vor der Inflationswelle – auch Stadionbier und Bratwurst.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2025/26',
    headline: 'Neue Technik, WM mit 48 Teams',
    football: [
      { topic: 'regeln', title: 'Halbautomatisches Abseits', text: 'Seit 2025/26 berechnen Kameras und Software in der Bundesliga Abseitslinien; das Fernsehen zeigt animierte Grafiken.' },
      { topic: 'regeln', title: 'Schiedsrichter erklären sich', text: 'Nach Überprüfungen am Monitor sagt der Schiedsrichter seine Entscheidung im Stadion durch.' },
      { topic: 'regeln', title: 'Acht Sekunden für den Torwart', text: 'Hält der Torwart den Ball länger als acht Sekunden, gibt es Eckstoß für den Gegner statt eines indirekten Freistoßes.' },
      { topic: 'geld', title: 'Neuer Medienvertrag', text: 'Bis 2028/29 erhält die Liga im Schnitt rund 1,12 Milliarden Euro pro Saison aus der nationalen Vermarktung.' },
      { topic: 'liga', title: 'Frauen-Bundesliga wächst', text: 'Die Frauen-Bundesliga spielt erstmals mit 14 statt 12 Teams. Im Dezember 2025 erhält Deutschland die Frauen-EM 2029.' },
      { topic: 'liga', title: 'WM mit 48 Teams', text: 'Im Sommer 2026 spielen in den USA, Kanada und Mexiko erstmals 48 Nationen in 104 Spielen um den Titel.' },
    ],
    society: [
      { topic: 'politik', title: 'Neue Bundesregierung', text: 'Seit Mai 2025 regiert eine Koalition aus Union und SPD mit Kanzler Friedrich Merz.' },
      { topic: 'politik', title: 'Neuer Wehrdienst', text: 'Seit Januar 2026 bekommen alle 18-Jährigen einen Fragebogen der Bundeswehr; für Männer ist die Antwort Pflicht.' },
      { topic: 'alltag', title: 'Mindestlohn 13,90 Euro', text: 'Seit dem 1. Januar 2026 liegt der Mindestlohn bei 13,90 Euro.' },
      { topic: 'alltag', title: 'Deutschlandticket 63 Euro', text: 'Seit Januar 2026 kostet das Deutschlandticket 63 Euro im Monat.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2026/27',
    headline: 'Countdown gegen das Zeitspiel',
    football: [
      { topic: 'regeln', title: 'Countdown bei Einwurf und Abstoß', text: 'Wie bei der WM 2026 zählt der Schiedsrichter fünf Sekunden herunter. Dauert der Abstoß zu lange, gibt es Ecke; beim Einwurf wechselt der Ballbesitz.' },
      { topic: 'regeln', title: 'Schneller raus', text: 'Ausgewechselte Spieler haben zehn Sekunden, um den Platz zu verlassen. Wer auf dem Feld behandelt wird, muss danach eine Minute draußen bleiben.' },
      { topic: 'regeln', title: 'Mehr Arbeit für den VAR', text: 'Der Video-Assistent darf nun auch bei klar falscher Gelb-Roter Karte und bei Verwechslungen eingreifen.' },
      { topic: 'liga', title: 'Aus DFL wird „Bundesliga“', text: 'Der Ligaverband tritt nur noch unter dem Namen Bundesliga auf; die Vereine haben das im März 2026 einstimmig beschlossen.' },
      { topic: 'regeln', title: 'Abschied vom „Kölner Keller“', text: 'Ab der Rückrunde testet der Video-Assistent auf dem DFB-Campus in Frankfurt; der Umzug aus Köln ist für Sommer 2027 geplant.' },
      { topic: 'liga', title: 'Frauen-WM in Brasilien', text: 'Im Sommer 2027 findet die Frauen-WM erstmals in Südamerika statt.' },
    ],
    society: [
      { topic: 'alltag', title: 'Mindestlohn 14,60 Euro', text: 'Zum 1. Januar 2027 steigt der Mindestlohn wie beschlossen auf 14,60 Euro.' },
      { topic: 'politik', title: 'Musterung kehrt zurück', text: 'Mit dem Jahrgang 2008 sollen junge Männer wieder verpflichtend gemustert werden.' },
      { topic: 'alltag', title: 'KI überall', text: 'KI-Assistenten stecken in Handys, Suchmaschinen und Büroprogrammen; Schulen und Betriebe ringen um Regeln.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2027/28',
    headline: 'Videozentrale am Main',
    football: [
      { topic: 'regeln', title: 'VAR-Zentrale in Frankfurt', text: 'Ab Sommer 2027 sollen die Video-Assistenten vom DFB-Campus in Frankfurt aus arbeiten.' },
      { topic: 'regeln', title: 'Abseits noch schneller', text: 'Spielwelt-Ausblick: Kameras und Sensoren sollen Abseitsentscheidungen weiter beschleunigen. Die Diskussionen verlagern sich zum Handspiel.', inGame: 'Die Chronik meldet in dieser Saison das „Halbautomatische Abseits“.' },
      { topic: 'liga', title: 'EM 2028 auf den Britischen Inseln', text: 'Im Sommer 2028 richten England, Schottland, Wales und Irland gemeinsam die EM aus.' },
      { topic: 'taktik', title: 'Belastung im Blick', text: 'Spielwelt-Ausblick: Mit Klub-WM, großer Ligaphase und Länderspielen streiten Vereine und Verbände weiter über die Zahl der Spiele.' },
    ],
    society: [
      { topic: 'alltag', title: 'Babyboomer gehen in Rente', text: 'Die geburtenstarken Jahrgänge verlassen nach und nach das Berufsleben; Fachkräfte fehlen in vielen Branchen, auch im Ehrenamt der Vereine.' },
      { topic: 'alltag', title: 'Elektrisch unterwegs', text: 'Elektroautos und Ladesäulen werden häufiger, auch auf Stadionparkplätzen.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2028/29',
    headline: 'Olympia in L.A., Frauen-EM daheim',
    football: [
      { topic: 'liga', title: 'Olympia in Los Angeles', text: 'Im Sommer 2028 finden die Olympischen Spiele in Los Angeles statt, mit Fußballturnieren für Frauen und Männer.' },
      { topic: 'liga', title: 'Frauen-EM in Deutschland', text: 'Im Sommer 2029 richtet Deutschland die Frauen-EM aus.' },
      { topic: 'geld', title: 'Letzte Saison des TV-Vertrags', text: 'Der laufende Medienvertrag endet mit dieser Saison. Spielwelt-Ausblick: Streamingdienste und Plattformen bieten um die nächste Rechteperiode mit.' },
    ],
    society: [
      { topic: 'alltag', title: 'Heiße Sommer', text: 'Hitzeperioden werden häufiger; Städte und Vereine planen mehr Schatten, Trinkwasser und spätere Anstoßzeiten im Amateursport.' },
      { topic: 'alltag', title: 'Digitale Verwaltung', text: 'Immer mehr Behördengänge lassen sich online erledigen – langsamer als geplant, aber spürbar.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2029/30',
    headline: 'Hundert Jahre Weltmeisterschaft',
    football: [
      { topic: 'liga', title: 'Jubiläums-WM 2030', text: 'Im Sommer 2030 spielen Spanien, Portugal und Marokko die WM aus; zum 100. Geburtstag finden drei Auftaktspiele in Uruguay, Argentinien und Paraguay statt.' },
      { topic: 'geld', title: 'Neue Rechteperiode', text: 'Spielwelt-Ausblick: Ab dieser Saison gilt ein neuer Medienvertrag der Liga. Höhe und Partner sind offen.' },
      { topic: 'taktik', title: 'Training nach Daten', text: 'Spielwelt-Ausblick: Belastungssteuerung per Sensor und Video ist in allen Profiklubs Standard.' },
    ],
    society: [
      { topic: 'politik', title: 'Klimaziel 2030', text: 'Bis 2030 soll Deutschland seinen Treibhausgasausstoß um 65 Prozent gegenüber 1990 senken.' },
      { topic: 'alltag', title: 'Eine älter werdende Gesellschaft', text: 'Mehr Rentner, weniger Berufseinsteiger: Pflege, Rente und Fachkräfte bleiben Dauerthemen.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2030/31',
    headline: 'Streit um Europas Spitze',
    football: [
      { topic: 'liga', title: 'Druck der Großklubs', text: 'Spielwelt-Ausblick: Europäische Großvereine drohen mit einer geschlossenen Liga; die Verbände suchen einen Kompromiss.', inGame: 'Die Chronik meldet den Streit; am Ende steht eine erweiterte Meisterliga.' },
      { topic: 'liga', title: 'Frauen-WM in Nordamerika', text: 'Im Sommer 2031 soll die Frauen-WM mit 48 Teams in den USA, Mexiko, Costa Rica und Jamaika stattfinden; die FIFA will sie im November 2026 formell vergeben.' },
      { topic: 'taktik', title: 'Nachwuchs im Wettbewerb', text: 'Spielwelt-Ausblick: Der Kampf um Talente beginnt immer früher; Vereine investieren in Scouting und Internate.' },
    ],
    society: [
      { topic: 'politik', title: 'Abschied von der Kohle', text: 'Der Kohleausstieg schreitet voran; spätestens 2038 soll das letzte Kohlekraftwerk vom Netz gehen.' },
      { topic: 'alltag', title: 'Arbeit im Wandel', text: 'KI und Automatisierung verändern viele Berufe; Weiterbildung wird zum Normalfall.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2031/32',
    headline: 'EM am Mittelmeer und Bosporus',
    football: [
      { topic: 'liga', title: 'EM 2032', text: 'Im Sommer 2032 richten Italien und die Türkei gemeinsam die EM aus.' },
      { topic: 'medien', title: 'Anstoßzeiten für die Welt', text: 'Spielwelt-Ausblick: Die Liga diskutiert, ob Spiele zu Zeiten angepfiffen werden sollen, die auch in Asien und Amerika gut passen.' },
      { topic: 'liga', title: 'Frauenfußball als eigene Marke', text: 'Spielwelt-Ausblick: Die Frauen-Bundesliga vermarktet sich zunehmend eigenständig und verhandelt eigene Medienverträge.' },
    ],
    society: [
      { topic: 'alltag', title: 'Wohnen in der Stadt', text: 'Bezahlbarer Wohnraum bleibt in Großstädten knapp; viele Fans pendeln weite Wege zum Stadion.' },
      { topic: 'alltag', title: 'Nahverkehr im Umbau', text: 'Bahn und Nahverkehr werden saniert und ausgebaut; Baustellen gehören zum Alltag.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2032/33',
    headline: 'Olympischer Sommer in Brisbane',
    football: [
      { topic: 'liga', title: 'Olympia in Brisbane', text: 'Im Sommer 2032 finden die Olympischen Spiele im australischen Brisbane statt; die Vorbereitung vieler Profis wird verkürzt.' },
      { topic: 'regeln', title: 'Regeln im Wandel', text: 'Spielwelt-Ausblick: Das IFAB prüft weitere Maßnahmen gegen Zeitspiel und für mehr Nettospielzeit.' },
      { topic: 'geld', title: 'Stadien als Kraftwerke', text: 'Spielwelt-Ausblick: Mehr Vereine erzeugen mit Solardächern und Speichern einen Teil ihres Stroms selbst.' },
    ],
    society: [
      { topic: 'alltag', title: 'Gesundheit digital', text: 'Videosprechstunde, E-Rezept und Fitnessdaten auf der Uhr gehören für viele zum Alltag.' },
      { topic: 'politik', title: 'Europa und die Sicherheit', text: 'Verteidigung und Zusammenhalt in Europa bleiben wichtige Themen der Politik.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2033/34',
    headline: 'Blick auf die nächste WM',
    football: [
      { topic: 'liga', title: 'WM 2034 in Saudi-Arabien', text: 'Die FIFA hat die WM 2034 im Dezember 2024 an Saudi-Arabien vergeben; ein Termin im Winter wird diskutiert.' },
      { topic: 'geld', title: 'Kluft zwischen Arm und Reich', text: 'Spielwelt-Ausblick: Die Erlöse der Spitzenklubs wachsen schneller als die der übrigen Vereine. Die Liga ringt um eine gerechte Verteilung.' },
      { topic: 'medien', title: 'Fernsehen auf Abruf', text: 'Spielwelt-Ausblick: Immer mehr Fans schauen Highlights und Spiele auf dem Handy statt im Fernsehen.' },
    ],
    society: [
      { topic: 'alltag', title: 'Rente und Arbeit', text: 'Länger arbeiten, später in Rente: Die Debatte über das Rentensystem bleibt aktuell.' },
      { topic: 'alltag', title: 'Städte gegen Hitze', text: 'Städte bauen um: mehr Grün, Wasserspeicher und Hitzeschutz.' },
    ],
  },
  // ---------------------------------------------------------------------------
  {
    season: '2034/35',
    headline: 'Gehaltsgrenze und Wüsten-WM',
    football: [
      { topic: 'geld', title: 'Gehaltsquote als Lizenzauflage', text: 'Seit 2025 dürfen Kaderkosten bei der UEFA höchstens 70 Prozent der Einnahmen betragen. Spielwelt-Ausblick: Die Quote wird zur festen Lizenzauflage mit Transfersperren.', inGame: 'Ab 2034/35 ersetzt eine Gehaltsquote von 70 Prozent im Spiel das Finanzielle Fairplay.' },
      { topic: 'liga', title: 'WM in Saudi-Arabien', text: 'Die WM 2034 findet in Saudi-Arabien statt; der genaue Termin steht noch nicht fest.' },
      { topic: 'liga', title: 'Frauen-WM 2035', text: 'Großbritannien ist einziger Bewerber für die Frauen-WM 2035; die formelle Vergabe ist für November 2026 geplant.' },
    ],
    society: [
      { topic: 'alltag', title: 'Neuwagen ohne Abgas?', text: 'Die EU-Flottenregeln zielen auf 2035 für emissionsfreie Neuwagen; wie streng sie bleiben, wird weiter diskutiert.' },
      { topic: 'politik', title: 'Ziel Klimaneutralität', text: 'Bis 2045 will Deutschland klimaneutral sein; Wärme, Verkehr und Industrie stehen unter Umbaudruck.' },
    ],
  },
];

// =============================================================================
// Quellen (Auswahl, Stand Oktober 2026)
// -----------------------------------------------------------------------------
// TV-Verträge 2000–2018: https://www.basicthinking.de/blog/2017/05/19/bundesliga-rechte/
// Kirch-Vertrag (3 Mrd. DM): https://www.ariva.de/forum/kirch-zahlt-drei-milliarden-dm-fuer-fussballrechte-108178
// Kirch-Gruppe/Insolvenz: https://en.wikipedia.org/wiki/Kirch_Group
// Transferperioden ab 2002/03: https://www.90min.de/seit-wann-gibt-es-eigentlich-transferfenster
// AOL Arena (2001): https://en.wikipedia.org/wiki/Volksparkstadion
// DFL seit 2001 / Umbenennung 2026: https://www.horizont.net/marketing/nachrichten/namensaenderung-nach-25-jahren-die-dfl-heisst-ab-naechster-saison-bundesliga-233413
// Medienrechte ab 2021/22: https://www.bundesliga.com/en/bundesliga/news/dfl-to-generate-e1-1-billion-average-revenue-per-season-from-2021-22-11709
// Medienrechte ab 2025/26: https://www.bundesliga.com/en/bundesliga/news/dfl-increases-national-media-revenue-to-1121-billion-per-season-from-2025-26-29981
// Neuerungen 2025/26 (SAOT, Durchsagen): https://www.dfb.de/news/schiri-durchsagen-abseitstechnologie-handshake-dialog-was-2025/2026-neu-ist
// Regeln 2025/26 (Torwart 8 s): https://www.bundesliga.com/de/bundesliga/news/saison-2025-26-regeln-neu-torwart-acht-sekunden-regelanderungen-32683
// Regeln 2026/27: https://www.bundesliga.com/de/bundesliga/news/regelanderungen-saison-2026-27-neue-regeln-38031
// Neues 2026/27 (Name, Ball): https://www.bundesliga.com/en/bundesliga/news/what-s-new-2026-27-germany-s-top-flight-rules-match-ball-name-37628
// Video Assist Center Frankfurt: https://www.dfb.de/news/ab-2027-video-assist-center-zieht-von-koeln-an-den-dfb-campus-nach-frankfurt
// Frauen-Bundesliga 14 Teams: https://www.dfb.de/news/detail/google-pixel-frauen-bundesliga-ab-2526-mit-14-teams-262626
// Frauen-EM 2029: https://dfb.de/news/dfb-to-host-uefa-womens-euro-2029
// Frauen-WM 2031/2035: https://en.wikipedia.org/wiki/2031_FIFA_Women%27s_World_Cup
// Neuer Wehrdienst 2026: https://www.bundesregierung.de/breg-de/aktuelles/antworten-zum-neuen-wehrdienst-2397476
// Spielinterne Daten/Recherche: docs/recherche/fussball_historie_designdaten_1975_2030.md,
//   data/timeline.ts, data/indoorHistory.ts, data/campDestinations.ts,
//   data/groundsCatalog.ts, engine/youthAcademy.ts
// =============================================================================

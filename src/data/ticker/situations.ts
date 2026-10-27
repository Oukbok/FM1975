// =============================================================================
// Textbausteine abseits der Torchancen: Fouls, Karten, Abseits, Ecken,
// Verletzungen, Wechsel, Zurufe, Spielabschnitte, Elfmeterschießen.
// =============================================================================
import type { Grammar } from './grammar';

export const SITUATIONS: Grammar = {
  // --- Verpuffte Angriffe ----------------------------------------------------
  fail: [
    '{d} läuft den Pass ab.', '{d} geht dazwischen und klärt.', 'Stark verteidigt von {d}.', '{d} gewinnt den Zweikampf gegen {p}.',
    '{p} bleibt an {d} hängen.', 'Der Pass von {t} ist zu ungenau, {o} hat den Ball.', '{d} grätscht den Ball sauber weg.',
    'Der Angriff von {t} verpufft.', '{d} steht goldrichtig.', 'Zu umständlich – {o} erobert den Ball.', '{p} verliert den Ball im Dribbling.',
    '{d} mit einer perfekt getimten Grätsche.', 'Kopfballduell gewonnen von {d}.', '@-1991 Der Libero {d} räumt ab.',
    '@2008- {o} presst früh, {t} kommt nicht durch.', '{tn} findet keine Lücke und spielt zurück.',
  ],
  offside: [
    'Abseits! Die Fahne geht hoch.', '{p} stand im Abseits.', 'Die Abseitsfalle von {o} schnappt zu.', 'Knapp, aber abseits – {p} war einen Schritt zu früh.',
    'Der Linienrichter hebt die Fahne gegen {p}.', '@2017- Abseits – gut erkannt, das bestätigt auch die kalibrierte Linie.', '@-1990 Abseits, pfeift der Unparteiische. {p} protestiert.',
  ],
  corner_plain: ['Ecke für {t}.', 'Eckball für {t}, {a} geht hinüber.', '{tn} bekommt einen Eckstoß.', 'Abgefälscht – Ecke.'],
  corner_cleared: ['Die Ecke wird geklärt.', '{k} pflückt den Ball sicher herunter.', 'Kopfball abgewehrt, die Gefahr ist gebannt.', 'Zu weit – Abstoß.', 'Am ersten Pfosten geklärt.'],

  // --- Fouls & Karten --------------------------------------------------------
  foul: [
    'Foul von {p} an {d}.', '{p} kommt zu spät gegen {d}.', '{p} hält {d} am Trikot fest.', '{p} senst {d} um. Freistoß.',
    '{p} mit dem Ellbogen – Pfiff.', 'Harter Zweikampf, {d} bleibt liegen. Freistoß.', '{p} stellt {d} ein Bein.',
    '{p} geht mit offener Sohle rein.', 'Taktisches Foul von {p}.', '{p} rempelt {d} von hinten.',
    '@-1989 Ein Tritt von {p}, der Schiedsrichter lässt sich die Nummer zeigen.', '?derby Im Derby wird nichts verschenkt: {p} gegen {d}, Foul.',
  ],
  foul_danger: [
    'Foul von {p} an {d} kurz vor dem Strafraum!', '{p} holt {d} an der Strafraumgrenze von den Beinen.', '{p} bringt {d} zu Fall – gefährlicher Freistoß!',
    'Notbremse? {p} zieht {d} zurück.', '{d} wird an der Sechzehnmeterlinie gelegt.',
  ],
  penalty_call: [
    'Elfmeter! {p} trifft {d} im Strafraum!', 'Der Schiedsrichter zeigt auf den Punkt! {d} wurde von {p} gefoult.', 'Strafstoß! {p} reißt {d} im Sechzehner um.',
    'Pfiff – Elfmeter! {p} kommt im Strafraum zu spät gegen {d}.', '@2017- Nach Ansicht der Bilder: Elfmeter! {p} hatte {d} getroffen.',
  ],
  yellow: [
    'Gelbe Karte für {p}.', '{p} sieht Gelb.', 'Dafür gibt es Gelb für {p}.', 'Der Schiedsrichter zückt Gelb – {p} ist verwarnt.',
    'Verwarnung für {p}. Er muss jetzt aufpassen.', 'Gelb für {p}, berechtigt.', '{p} reklamiert – und sieht Gelb.',
  ],
  yellowRed: [
    'Gelb-Rot! {p} muss vom Platz!', 'Zweite Gelbe für {p} – und damit Gelb-Rot!', 'Das war zu viel: {p} sieht die Ampelkarte.',
    '{p} fliegt mit Gelb-Rot. {t} nur noch zu zehnt.',
  ],
  red: [
    'Rot! {p} muss runter!', 'Glatt Rot für {p}!', 'Der Schiedsrichter zeigt {p} die Rote Karte!', 'Platzverweis für {p}! Das war brutal.',
    'Rote Karte! {p} geht mit gesenktem Kopf.', '@2017- Nach Videobeweis: Rot für {p}!',
  ],
  red_after: ['{tn} muss jetzt in Unterzahl weiterspielen.', 'Das verändert das Spiel.', 'Ein Mann weniger bei {t}.', '?eigen Deine Elf ist jetzt in Unterzahl – reagiere!'],

  // --- Verletzungen ---------------------------------------------------------
  injury: [
    '{p} bleibt nach einem Zweikampf liegen.', '{p} greift sich an den Oberschenkel.', '{p} humpelt, der Physio kommt aufs Feld.',
    '{p} hat sich wehgetan.', 'Sorgen um {p}: Er hält sich das Knie.', '{p} knickt um und bleibt sitzen.', 'Der Arzt eilt zu {p}.',
    '@-1990 Der Masseur sprintet mit dem Eisspray auf den Platz – {p} liegt am Boden.',
  ],
  injury_on: ['{p} beißt auf die Zähne und macht weiter.', 'Es geht weiter für {p}.', '{p} wird behandelt und kehrt zurück.'],
  injury_off: ['Für {p} geht es nicht weiter.', '{p} muss raus.', '{p} wird vom Platz getragen.', 'Das sieht nicht gut aus – {p} kann nicht weitermachen.'],

  // --- Wechsel --------------------------------------------------------------
  sub: [
    'Wechsel bei {t}: {p} kommt für {d}.', '{p} ersetzt {d}.', '{tn} wechselt: {d} geht, {p} kommt.', 'Frische Kräfte: {p} für {d}.',
    '{d} verlässt unter Applaus den Platz, {p} ist neu dabei.', 'Der Trainer von {t} reagiert: {p} für {d}.',
  ],
  sub_reason_muede: ['{d} war platt.', '{d} hatte keine Kraft mehr.'],
  sub_reason_taktik: ['Eine taktische Maßnahme.', '{tn} will neue Impulse.'],
  sub_reason_verletzt: ['{d} kann nicht mehr.'],
  sub_reason_torwart: ['Ersatztorwart {p} muss rein.'],

  // --- Ausrichtung ---------------------------------------------------------
  ment_up: ['{tn} stellt auf Angriff um.', '{tn} wirft jetzt alles nach vorne.', '{tn} öffnet das Spiel – mehr Risiko.', 'Der Trainer von {t} gibt das Signal zum Angriff.'],
  ment_down: ['{tn} zieht sich zurück und verteidigt.', '{tn} macht hinten dicht.', '{tn} will das Ergebnis über die Zeit bringen.', 'Mehr Absicherung bei {t}.'],
  ment_zero: ['{tn} kehrt zur normalen Ausrichtung zurück.'],

  // --- Zurufe (eigene Elf) -------------------------------------------------
  shout_druck: ['Du brüllst: „Mehr Druck! Nach vorne!“', 'Du treibst deine Elf an: „Jetzt drücken!“', '„Gas geben!“, rufst du aufs Feld.'],
  shout_ruhe: ['Du gibst das Zeichen: „Ruhe reinbringen, Ball laufen lassen!“', '„Ruhig bleiben!“, rufst du.', 'Du deutest mit beiden Händen nach unten: Tempo raus.'],
  shout_kompakt: ['„Kompakt stehen! Abstände!“, rufst du.', 'Du forderst: „Hinten sicher stehen!“', 'Du schiebst mit den Armen: „Zusammenrücken!“'],
  shout_fluegel: ['„Über die Flügel!“, rufst du deinen Außen zu.', 'Du zeigst nach außen: „Breit machen, Flanken!“'],
  shout_konzentration: ['„Konzentration! Keine Fehler jetzt!“', 'Du klatschst in die Hände: „Wach bleiben!“'],
  shout_zweikampf: ['„Rein in die Zweikämpfe!“', 'Du forderst mehr Härte: „Dagegenhalten!“'],
  shout_zuendet: ['Die Mannschaft nimmt es auf, man sieht es sofort.', 'Der Kapitän gibt es weiter – die Elf zieht mit.', 'Das kommt an!'],
  shout_stumpf: ['Die Spieler nicken nur noch müde – zu oft gehört.', 'Der Zuruf verpufft. Immer wieder dasselbe nutzt sich ab.'],
  shout_normal: ['Die Spieler haben verstanden.', 'Dein Kapitän winkt ab: angekommen.'],

  talk_gut: ['Die Ansprache sitzt. Die Spieler kommen hellwach aus der Kabine.', 'Deine Worte zeigen Wirkung – Feuer in den Augen.'],
  talk_neutral: ['Die Spieler hören zu und nicken.', 'Eine sachliche Halbzeit. Mal sehen, ob es hilft.'],
  talk_schlecht: ['Die Ansprache kommt nicht gut an. Einige Spieler wirken verunsichert.', 'Falscher Ton? Die Stimmung in der Kabine ist gedrückt.'],

  // --- Videobeweis / aberkannt ---------------------------------------------
  var_check: ['Moment … der Schiedsrichter fasst sich ans Ohr.', 'Halt! Es gibt einen Check.', 'Videobeweis! Der Treffer wird überprüft …'],
  var_abseits: ['Kein Tor! Abseits, um wenige Zentimeter.', 'Aberkannt – {p} stand im Abseits.'],
  var_foul: ['Kein Tor! Vorher gab es ein Foulspiel.', 'Aberkannt – Handspiel in der Entstehung.'],
  disallowed: ['Doch kein Tor! Die Fahne ist oben – Abseits.', 'Der Schiedsrichter gibt den Treffer nicht! Foul vorher.', 'Abgepfiffen! Stürmerfoul. Kein Tor.'],

  // --- Nachspielzeit ----------------------------------------------------------
  stoppage: [
    '@1998- Die Tafel geht hoch: {nmin} Nachspielzeit.', '@1998- {nmin} gibt es obendrauf.',
    '@-1997 Der Schiedsrichter schaut auf die Uhr und lässt nachspielen.', '@-1997 Ein paar Minuten werden noch nachgespielt.',
  ],

  // --- Spielabschnitte --------------------------------------------------------
  kickoff: [
    'Anpfiff im {stadium}! {home} gegen {away}.', 'Der Ball rollt! {home} empfängt {away}.', 'Los geht’s im {stadium}: {home} – {away}.',
    'Der Schiedsrichter pfeift an. {home} gegen {away}, {crowd} Zuschauer sind dabei.',
  ],
  kickoff_atmo: [
    '{crowd} Zuschauer sind gekommen.', '?derby Derbytime! Die Stadt ist in zwei Lager gespalten.', '?derby Ein Derby – hier geht es um mehr als drei Punkte.',
    '?pokal Pokalabend! Hier zählt nur das Weiterkommen.', '?ausverkauft Ausverkauftes Haus!', '?regen Es regnet in Strömen, der Rasen ist tief.',
    '?schnee Schneefall – der Platz ist weiß gezuckert, gespielt wird mit dem orangen Ball.', '?hitze Brütende Hitze, das wird ein Kraftakt.',
    '?nebel Nebel zieht übers Stadion – von der Tribüne sieht man kaum das andere Tor.', '?wind Ein böiger Wind pfeift durchs Stadion.',
    '?sonnig Strahlender Sonnenschein, bestes Fußballwetter.', '#zeitgeist#',
  ],
  halftime: ['Halbzeit! Es steht {score}.', 'Pause im {stadium}. Zwischenstand: {score}.', 'Der Schiedsrichter pfeift zur Pause. {score}.'],
  halftime_talk: ['Zeit für deine Halbzeitansprache.'],
  second_half: ['Weiter geht’s! Die zweite Halbzeit läuft.', 'Wiederanpfiff im {stadium}.', 'Die zweite Hälfte beginnt.'],
  fulltime: [
    'Abpfiff! Endstand: {home} {score} {away}.', 'Schluss! Das Spiel endet {score}.', 'Aus! Das Spiel ist vorbei – {score}.',
    'Der Schiedsrichter pfeift ab. {score} ist das Endergebnis.',
  ],
  fulltime_et: ['Ende der regulären Spielzeit – {score}. Es geht in die Verlängerung!'],
  et_start: ['Die Verlängerung läuft. 30 Minuten noch.', 'Auf in die Verlängerung!'],
  et_half: ['Seitenwechsel in der Verlängerung. {score}.'],
  et_second: ['Die letzten 15 Minuten der Verlängerung.'],
  et_end: ['Ende der Verlängerung – {score}.'],
  shootout_start: ['Elfmeterschießen! Die Nerven werden auf die Probe gestellt.', 'Es geht ins Elfmeterschießen.'],
  so_kick: ['{p} tritt an …', '{p} legt sich den Ball hin …', 'Jetzt {p} …', '{p} gegen {k} …'],
  so_goal: ['Drin! ({sh}:{sa})', 'Verwandelt! ({sh}:{sa})', 'Sicher! ({sh}:{sa})'],
  so_saved: ['Gehalten! {k} pariert! ({sh}:{sa})', '{k} hält! ({sh}:{sa})'],
  so_miss: ['Vorbei! ({sh}:{sa})', 'Drüber! ({sh}:{sa})', 'Pfosten! ({sh}:{sa})'],
  shootout_end: ['{tn} gewinnt das Elfmeterschießen {sh}:{sa}!', 'Entschieden! {t} setzt sich vom Punkt durch – {sh}:{sa}.'],
};

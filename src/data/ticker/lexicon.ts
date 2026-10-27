// =============================================================================
// Wortschatz des Textmodus: Bausteine, die in vielen Sätzen wiederkehren
// (Verben, Adjektive, Publikum, Wetter, Zeitgeist der Epochen).
// =============================================================================
import type { Grammar } from './grammar';

export const LEXICON: Grammar = {
  // --- Ball und Bewegung --------------------------------------------------
  ball: ['den Ball', 'das Leder', 'die Kugel', '@-1995 das Spielgerät', 'den Ball', 'die Murmel'],
  schnell: ['blitzschnell', 'in Windeseile', 'ohne zu zögern', 'mit einem Haken', 'im Vollsprint', 'geschmeidig', 'mit viel Tempo'],
  geschickt: ['geschickt', 'clever', 'gefühlvoll', 'mit Übersicht', 'elegant', 'abgezockt', 'mit dem ersten Kontakt'],
  passVerb: ['spielt', 'schiebt', 'legt', 'chippt', 'lupft', 'steckt', 'schlenzt', 'passt'],
  laeuft: ['läuft', 'sprintet', 'stürmt', 'zieht', 'marschiert', 'prescht', 'rennt'],
  seite: ['links', 'rechts', 'über links', 'über rechts', 'auf der linken Seite', 'auf der rechten Bahn', 'am Flügel'],
  strafraum: ['den Strafraum', 'den Sechzehner', 'die Box', 'den Sechzehnmeterraum', 'den gegnerischen Strafraum'],
  imStrafraum: ['im Strafraum', 'im Sechzehner', 'am Elfmeterpunkt', 'am kurzen Pfosten', 'am langen Pfosten', 'zentral vor dem Tor', 'halbrechts im Strafraum', 'halblinks im Strafraum'],
  tor: ['das Tor', 'den Kasten', 'das Gehäuse', 'den Kasten von {k}', 'das Tor von {k}'],
  ecke_tor: ['ins linke Eck', 'ins rechte Eck', 'unter die Latte', 'flach ins Eck', 'halbhoch neben den Pfosten', 'genau in den Winkel', 'durch die Beine von {k}', 'ins kurze Eck', 'ins lange Eck', 'über {k} hinweg'],
  knapp: ['knapp', 'um Haaresbreite', 'ganz knapp', 'nur Zentimeter', 'hauchdünn', 'nur eine Handbreit'],
  klar: ['deutlich', 'meilenweit', 'weit', 'klar', 'ein gutes Stück'],

  // --- Gefühle, Bewertung -------------------------------------------------
  stark: ['stark', 'großartig', 'herausragend', 'famos', 'klasse', 'glänzend', 'erstklassig', 'überragend'],
  schoen: ['schön', 'sehenswert', 'feinst', 'herrlich', 'wunderbar', 'traumhaft', 'zauberhaft'],
  bitter: ['bitter', 'ärgerlich', 'unglücklich', 'tragisch', 'zum Haareraufen', 'schmerzhaft'],
  ausruf: ['Was für eine Szene!', 'Unglaublich!', 'Das gibt es doch nicht!', 'Wahnsinn!', 'Meine Güte!', 'Donnerwetter!', 'Ach du liebe Zeit!', 'Mensch!', 'Ja, ist denn das die Möglichkeit!'],
  ausrufGut: ['Herrlich!', 'Traumhaft!', 'Was für ein Ding!', 'Großartig!', 'Sensationell!', 'Ein Gedicht!', 'Bilderbuch!', 'Das ist Fußball!'],

  // --- Publikum -----------------------------------------------------------
  publikum: ['das Publikum', 'die Kurve', 'das Stadion', 'der Anhang', 'die Tribüne', 'die Fankurve', 'die Gegengerade', '@-1995 die Stehplatzkurve', 'das weite Rund'],
  laut: ['tobt', 'bebt', 'kocht', 'steht Kopf', 'explodiert', 'singt', 'ist außer sich', 'feiert'],
  stille: ['Stille im weiten Rund.', 'Ein Raunen geht durchs Stadion.', 'Schweigen auf den Rängen, nur der Gästeblock jubelt.', 'Man hört die Gästefans bis hier oben.', 'Kurz ist es mucksmäuschenstill.', 'Die Heimfans setzen sich wieder.'],
  raunen: ['Ein Raunen geht durch das Stadion.', 'Die Zuschauer stöhnen auf.', 'Lautes Aufstöhnen auf den Rängen.', 'Man hält den Atem an.', 'Hände fliegen an die Köpfe.', 'Die Fans springen schon auf – und setzen sich wieder.'],

  // --- Mannschaftsteile ---------------------------------------------------
  abwehr: ['die Abwehr', 'die Hintermannschaft', 'die Defensive', '@-1994 die Deckung', '@1995- die Viererkette', 'der Abwehrverbund', 'die Innenverteidigung'],
  mittelfeld: ['das Mittelfeld', 'die Zentrale', 'die Schaltzentrale', 'den Mittelkreis'],

  // --- Zeitgeist ----------------------------------------------------------
  zeitgeist: [
    '@-1984 Im Radio würde man jetzt sagen: Ein Spiel mit offenem Visier.',
    '@-1989 Ein Spiel wie aus dem Bilderbuch der alten Schule: Manndeckung und lange Bälle.',
    '@-1991 Der Libero schaltet sich immer wieder mit ein.',
    '@1992- Seit der Rückpassregel muss jeder Torwart auch mitspielen können.',
    '@1995-2005 Viererkette und Raumdeckung – das neue Zauberwort an der Seitenlinie.',
    '@2008- Gegenpressing, wie es im Lehrbuch steht.',
    '@2012- Viel Bewegung zwischen den Linien, die Halbräume sind besetzt.',
    '@2016- Die Datenanalysten auf der Tribüne dürften fleißig mitschreiben.',
    '@2017- Im Videoraum ist es bisher ruhig geblieben.',
  ],
};

// =============================================================================
// PLATZHALTER – wird beim Zusammenführen durch die redaktionellen Inhalte
// (Saisons 1975/76–1999/2000) ersetzt. Nur damit System und Oberfläche bauen.
// =============================================================================
import type { SeasonBriefingEntry } from './types';

export const SEASONS_1975: SeasonBriefingEntry[] = [
  {
    season: '1975/76',
    headline: 'Trikotwerbung, Libero und Schlaghosen',
    football: [
      { topic: 'regeln', title: 'Zwei Punkte pro Sieg', text: 'Ein Sieg bringt zwei Punkte, ein Unentschieden einen. Remis sind deshalb viel wertvoller als heute.', inGame: 'Sieg 2, Remis 1 Punkt' },
      { topic: 'geld', title: 'Trikotwerbung setzt sich durch', text: 'Seit 1973 darf auf der Brust geworben werden. Der Sponsor ist für dich eine der wichtigsten Einnahmen.' },
      { topic: 'taktik', title: 'Libero hinter der Abwehr', text: 'Fast jede Mannschaft spielt mit Libero und Manndeckung. Raumdeckung und Pressing kennt kaum jemand.' },
      { topic: 'medien', title: 'Die Sportschau am Samstag', text: 'Tore siehst du nur in Zusammenfassungen. Live im Fernsehen läuft praktisch kein Ligaspiel.' },
    ],
    society: [
      { topic: 'politik', title: 'Zwei deutsche Staaten', text: 'Die Bundesrepublik und die DDR spielen getrennte Meisterschaften. Kontakte über die Grenze sind die Ausnahme.' },
      { topic: 'alltag', title: 'Das Telefon hängt im Flur', text: 'Wer telefonieren will, braucht einen Festnetzanschluss oder eine Telefonzelle. Ergebnisse kommen per Radio.' },
      { topic: 'kultur', title: 'Disco und Schlager', text: 'ABBA und Udo Jürgens laufen im Radio, im Kino startet „Der weiße Hai“.' },
    ],
  },
  {
    season: '1976/77',
    headline: 'Europameister im Elfmeterschießen geschlagen',
    football: [
      { topic: 'liga', title: 'EM-Finale in Belgrad', text: 'Die Nationalmannschaft verliert das EM-Finale gegen die Tschechoslowakei im Elfmeterschießen.' },
      { topic: 'geld', title: 'Gehälter steigen', text: 'Die besten Spieler verdienen inzwischen deutlich mehr als ein Facharbeiter.' },
      { topic: 'medien', title: 'Mehr Farbfernseher', text: 'Immer mehr Haushalte schauen die Sportschau in Farbe.' },
    ],
    society: [
      { topic: 'politik', title: 'Der Deutsche Herbst naht', text: 'Die Angst vor dem Terror der RAF prägt das Land.' },
      { topic: 'alltag', title: 'Autofreie Sonntage sind vorbei', text: 'Nach der Ölkrise fährt man wieder – Benzin bleibt aber teuer.' },
      { topic: 'kultur', title: 'Punk kommt auf', text: 'Aus England schwappt eine neue, laute Jugendkultur herüber.' },
    ],
  },
];

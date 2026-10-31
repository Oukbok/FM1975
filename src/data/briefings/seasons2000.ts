// =============================================================================
// PLATZHALTER – wird beim Zusammenführen durch die redaktionellen Inhalte
// (Saisons 2000/01–2034/35) ersetzt. Nur damit System und Oberfläche bauen.
// =============================================================================
import type { SeasonBriefingEntry } from './types';

export const SEASONS_2000: SeasonBriefingEntry[] = [
  {
    season: '2000/01',
    headline: 'Neustart nach dem EM-Debakel',
    football: [
      { topic: 'liga', title: 'Leistungszentren werden Pflicht', text: 'Nach dem Vorrunden-Aus bei der EM 2000 verlangt der Verband Nachwuchsleistungszentren.', inGame: 'NLZ-Pflicht ab 2001/02 (1. Liga)' },
      { topic: 'medien', title: 'Bezahlfernsehen wächst', text: 'Live-Spiele laufen im Pay-TV, frei empfangbar bleiben nur Zusammenfassungen.' },
      { topic: 'geld', title: 'Börsengang eines Vereins', text: 'Erstmals geht ein deutscher Profiverein an die Börse.' },
    ],
    society: [
      { topic: 'alltag', title: 'Handy für alle', text: 'Prepaid-Handys machen das Mobiltelefon zum Alltagsgegenstand. SMS ist das Medium der Jugend.' },
      { topic: 'politik', title: 'Der Euro kommt', text: 'Die Bargeldumstellung zum 1. Januar 2002 wird vorbereitet.' },
      { topic: 'kultur', title: 'Big Brother', text: 'Reality-TV wird zum Gesprächsthema.' },
    ],
  },
];

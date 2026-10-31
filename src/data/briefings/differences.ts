// =============================================================================
// PLATZHALTER – wird beim Zusammenführen durch die redaktionellen Inhalte
// ersetzt. Unterschiede zum heutigen Fußball (2025/26), gültig von–bis (Startjahre).
// =============================================================================
import type { DifferenceToToday } from './types';

export const DIFFERENCES: DifferenceToToday[] = [
  { from: 1975, to: 1994, topic: 'regeln', title: 'Zwei Punkte pro Sieg', then: 'Ein Sieg zählt zwei Punkte, ein Remis einen.', today: 'Ein Sieg bringt drei Punkte.' },
  { from: 1975, to: 1994, topic: 'regeln', title: 'Zwei Auswechslungen', then: 'Pro Spiel dürfen nur zwei Spieler eingewechselt werden.', today: 'Fünf Wechsel in drei Unterbrechungen.' },
  { from: 1975, to: 1991, topic: 'regeln', title: 'Rückpass zum Torwart', then: 'Der Torwart darf einen Rückpass in die Hand nehmen.', today: 'Rückpässe mit dem Fuß darf er nicht aufnehmen.' },
  { from: 1975, to: 1995, topic: 'geld', title: 'Ablöse auch nach Vertragsende', then: 'Auch ein Spieler ohne Vertrag kostet Ablöse.', today: 'Nach Vertragsende wechselt man ablösefrei (Bosman).' },
  { from: 1975, to: 1991, topic: 'liga', title: 'Zwei deutsche Ligen', then: 'Bundesrepublik und DDR spielen getrennt.', today: 'Eine gesamtdeutsche Liga.' },
  { from: 1975, to: 1987, topic: 'medien', title: 'Kaum Live-Fußball im TV', then: 'Ligaspiele siehst du nur als Zusammenfassung.', today: 'Jedes Spiel läuft live.' },
  { from: 1975, to: 2001, topic: 'geld', title: 'Bezahlt wird in D-Mark', then: 'Gehälter und Ablösen in DM.', today: 'Euro.' },
  { from: 1975, to: 2016, topic: 'taktik', title: 'Kein Videobeweis', then: 'Was der Schiedsrichter sieht, gilt.', today: 'Der VAR prüft Tore, Elfmeter und Rote Karten.' },
  { from: 1977, to: 1990, topic: 'taktik', title: 'Libero als Abwehrchef', then: 'Fast jedes Team spielt mit Libero und Manndeckung.', today: 'Viererkette mit Raumdeckung.' },
];

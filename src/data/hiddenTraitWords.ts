// =============================================================================
// Einschätzungen der VERDECKTEN Spielerwerte – nur Worte, nie Zahlen.
// Je Wert Stufen von niedrig nach hoch: [Untergrenze 0–100, Urteil].
// Genutzt von game/hiddenTraits.ts (Treffsicherheit nach Kenntnis von Trainerteam/Scouts).
// Die Stufen-Nummer (0 = unterste) steuert auch die Sätze im Scout-Bericht.
// =============================================================================
export type HiddenTrait = 'konstanz' | 'nerven' | 'verletzung' | 'tempo' | 'fleiss';

export const HIDDEN_WORDS: Record<HiddenTrait, [number, string][]> = {
  konstanz: [[0, 'schwankt stark'], [42, 'mal so, mal so'], [60, 'meist verlässlich'], [75, 'sehr konstant'], [88, 'ein Uhrwerk']],
  nerven: [[0, 'wirkt nervös'], [42, 'unauffällig'], [60, 'wirkt gefestigt'], [75, 'nervenstark'], [88, 'Nerven aus Stahl']],
  verletzung: [[0, 'kaum kleinzukriegen'], [12, 'robust'], [30, 'normal'], [55, 'anfällig'], [72, 'sehr verletzungsanfällig']],
  tempo: [[0, 'lernt langsam'], [35, 'normal'], [62, 'lernt schnell'], [82, 'saugt alles auf']],
  fleiss: [[0, 'bequem'], [35, 'trainiert ordentlich'], [60, 'fleißig'], [78, 'sehr fleißig'], [90, 'trainiert wie ein Weltmeister']],
};

export const HIDDEN_LABEL: Record<HiddenTrait, string> = {
  konstanz: 'Konstanz', nerven: 'Nervenstärke', verletzung: 'Verletzungsanfälligkeit', tempo: 'Entwicklungstempo', fleiss: 'Trainingsfleiß',
};

/** Sätze im Scout-Bericht je Stufe (nur ganz unten/ganz oben). */
export const HIDDEN_REPORT: Partial<Record<HiddenTrait, { low?: string; high?: string; top?: string }>> = {
  konstanz: { low: 'schwankt stark zwischen guten und schwachen Tagen', high: 'sehr konstant in seinen Leistungen', top: 'liefert Woche für Woche – ein Uhrwerk' },
  nerven: { low: 'wirkt in wichtigen Spielen nervös', high: 'blüht in großen Spielen auf', top: 'Nerven aus Stahl, wenn es darauf ankommt' },
  fleiss: { low: 'lässt es im Training gern ruhig angehen', high: 'arbeitet hart an sich', top: 'trainiert wie ein Weltmeister' },
  verletzung: { high: 'muss körperlich geschont werden – verletzungsanfällig' },
};

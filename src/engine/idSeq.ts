// =============================================================================
// Laufende Nummer für IDs (Nachrichten, Buchungen, Termine, Aktivitäten,
// Verletzungen, Platzhaltervereine, Mitarbeiter …) – aus dem Spielstand statt
// aus der Uhrzeit: Der Zähler liegt als Objekt im Spielstand (`Game.ids`) und
// wird von newGame/loadMigrations/processDay gebunden (`bindIdCounter`).
// Neue IDs tragen ein `s` vor der Nummer (z. B. `msg-s1f`) und kollidieren so
// nie mit den alten uhrzeitbasierten IDs (`msg-<zeit>-<n>`) älterer Spielstände.
// =============================================================================

export interface IdCounter { n: number }

let cur: IdCounter = { n: 0 };

/** Zähler des aktiven Spielstands binden (dasselbe Objekt wird mitgespeichert). */
export function bindIdCounter(c: IdCounter): void { cur = c; }
/** Frischer, ungebundener Zähler (resetModuleState). */
export function resetIdCounter(): void { cur = { n: 0 }; }
/** Nächste laufende Nummer (1, 2, 3 …). */
export function nextSeq(): number { return ++cur.n; }
/** ID mit Präfix und laufender Nummer (Basis 36), z. B. `seqId('msg-')` → `msg-s1f`. */
export function seqId(prefix: string): string { return `${prefix}s${nextSeq().toString(36)}`; }

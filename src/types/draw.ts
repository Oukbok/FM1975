// =============================================================================
// Pokalauslosung: gespeicherter Ablauf einer Ziehung (für Show und Wiederholung).
// Optional an CupRound (`draw`), alte Spielstände kennen das Feld nicht.
// =============================================================================

/** Wettbewerb der Auslosung: Landespokal oder einer der Europapokale. */
export type DrawComp = 'cup' | 'ec' | 'cwc' | 'uefa';

/** Bühne der Show (nur Anmutung: Farben, Titel). */
export type DrawStage = 'studio70' | 'studio90' | 'museum' | 'uefa70' | 'uefa90' | 'uefaGala';

/** Eine gezogene Kugel in Ziehungsreihenfolge. */
export interface DrawBall {
  /** Verein (Club-ID oder eu_-ID). */
  id: string;
  /** Index des Lostopfs in `DrawRecord.pots`. */
  pot: number;
  /** Losnummer (Position im Topf, 1-basiert, alphabetisch). */
  no: number;
  /** Index der Paarung, zu der die Kugel gehört (−1 = zurückgelegt). */
  pair: number;
  /** Länderschutz: Kugel passte nicht und wurde für die nächste Paarung zurückgelegt. */
  rejected?: boolean;
}

/** Eine Paarung nach Anwendung aller Regeln (Index = Begegnungs-Index der Runde). */
export interface DrawPair {
  home: string;
  away: string;
  /** Heimrecht nach Regel getauscht (Amateure empfangen Profis). */
  swapped?: boolean;
}

export interface DrawRecord {
  comp: DrawComp;
  roundIndex: number;
  roundName: string;
  /** Datum der Ziehung (UTC, ISO). */
  date: string;
  /** Spieltermin der Runde. */
  matchDate: string;
  /** Ort/Sendung als Klartext (z. B. „Zürich“). */
  venue: string;
  stage: DrawStage;
  pots: { label: string; ids: string[] }[];
  balls: DrawBall[];
  pairs: DrawPair[];
  /** Geltende Regeln als kurze Sätze (Anzeige zu Beginn der Show). */
  rules: string[];
}

// =============================================================================
// AUF-/ABSTIEG DER 3./4. EBENE IM HEIMATLAND (historische Zahlen, Wunsch Pascal: England 1995/96
// 4 Aufsteiger aus der 4. Ebene statt 3, Unterbau nur 0–2 statt immer 3)
// -----------------------------------------------------------------------------
// Ohne Eintrag rechnet der Saisonwechsel wie bisher (data/reformTransition.ts `normalTransition`:
// 3 bzw. Staffelzahl; mehrgleisig data/multiUpperTransition.ts; Unterbau game/clubPool.ts
// `poolSwapCount`). Mit Eintrag gibt game/homeStructure.ts `homeSeasonPlan` die Zahlen als `upSlots`
// der oberen Liga bzw. als `poolOut` der untersten Ebene vor. Die Größen der Ebenen (data/leagueTiers.ts)
// gleicht normalTransition wie bisher über die Zahl der Absteiger aus. Relegation/Play-offs
// (data/relegationRules.ts) entscheiden nur, WER den umkämpften Platz bekommt.
// `year` = Startjahr der GESPIELTEN Saison (1995 = 1995/96), wie relegationFormats.
//
// Quellen (abgerufen 11/2026): en.wikipedia.org/wiki/English_Football_League, Saisonartikel
// „19xx–xx Football League Third/Fourth Division“ und en.wikipedia.org/wiki/Football_League_re-election:
//  • Ebene 3 → 2: 3 Aufsteiger (bis 1986 direkt, danach 2 + Play-off); 1994/95 nur 2 (Verkleinerung der
//    Premier League auf 20, die First Division gab 4 ab).
//  • Ebene 4 → 3: 4 Aufsteiger (bis 1986 direkt, danach 3 + Play-off); 1994/95 nur 3 (2 + Play-off).
//  • Ebene 4 → Unterbau: bis 1986 Wiederwahl (abgewählt nur Workington 1976/77, Southport 1977/78),
//    ab 1986/87 ein automatischer Absteiger in die Conference, ab 2002/03 zwei.
// Vereinfachungen: Jahre, in denen der Letzte drinblieb, weil der Conference-Meister kein zugelassenes
// Stadion hatte (1993/94–1995/96: Kidderminster, Macclesfield, Stevenage) bzw. Aldershot 1991/92 aufgab,
// zählen wie die Regel (1 Absteiger – Spielende des eigenen Vereins als Letzter bleibt verlässlich);
// Sonderjahr der Erweiterung 1990/91 (5 Aufsteiger aus der Fourth Division) entfällt, die Größen gleicht
// der Saisonwechsel aus.
// =============================================================================

export interface DeepMoves {
  /** Aufsteiger Ebene 3 → 2 (fehlt = bisherige Rechnung). */
  up3?: number;
  /** Aufsteiger Ebene 4 → 3. */
  up4?: number;
  /** Absteiger der untersten Ebene (3 oder 4) in den Unterbau, je Staffel. */
  out?: number;
}

function eng(y: number): DeepMoves {
  const up3 = y === 1994 ? 2 : 3;
  const up4 = y === 1994 ? 3 : 4;
  const out = y >= 2002 ? 2 : y >= 1986 ? 1 : y === 1976 || y === 1977 ? 1 : 0;
  return { up3, up4, out };
}

const BY_CC: Record<string, (y: number) => DeepMoves> = { eng };

/** Historische Auf-/Abstiegszahlen der Ebenen 3/4 im Land `cc` (Saison-Startjahr); null = keine Daten. */
export function deepMovesFor(cc: string, year: number): DeepMoves | null {
  return BY_CC[cc]?.(year) ?? null;
}

// =============================================================================
// Entwicklungs-Protokoll (nur eigener Kader): Woher kommen die Entwicklungspunkte
// zwischen zwei Bewertungsrunden? weeklyDevelopment (engine/development.ts)
// rechnet Basis(Alter) × Faktoren. Die Faktoren werden per logarithmischer
// Mittelwert-Zerlegung (LMDI) exakt in additive Beiträge aufgeteilt:
//   pts − base = Σ L(pts, base) · ln f_i
// Dazu kommen einmalige Gutschriften (Trainingslager, Halle, Ereignisse,
// Durchbruch …) über addDevPoints. So gilt immer:
//   start + Σ parts = devPoints  (vor der Auszahlung)
// Optionales Feld `development.devLog` – alte Spielstände haben keins.
// =============================================================================
import type { Player } from '../types';

export interface DevLog {
  /** Stand von devPoints beim Beginn der Aufzeichnung (Übertrag). */
  start: number;
  /** true = Aufzeichnung begann mitten in der Periode (alter Spielstand, Neuzugang). */
  partial?: boolean;
  /** Beiträge je Ursache (OVR-Punkte). Schlüssel siehe engine/ratingReasons.ts. */
  parts: Record<string, number>;
  /** Pflichtspielminuten seit der letzten Bewertung. */
  min: number;
  /** Gewichtete Minuten in der zweiten Mannschaft (Summe der Wochenwerte). */
  res: number;
  /** Tage verletzt (wochenweise gezählt). */
  inj: number;
  /** Ausgewertete Wochen. */
  weeks: number;
}

/** Eine Begründungszeile (Text ohne Vorzeichen; v = Beitrag in OVR-Punkten). */
export interface RatingReason { k: string; v: number; text: string }

/** Bewertung im Spielerprofil (Reiter Entwicklung). */
export interface RatingLogEntry {
  date: string;
  label: string;
  old: number;
  new: number;
  change: number;
  reasons: RatingReason[];
  /** Kein (vollständiges) Protokoll – allgemeine Begründung. */
  generic?: boolean;
  tag?: string;
}

export function newDevLog(start: number, partial: boolean): DevLog {
  return { start, partial: partial || undefined, parts: {}, min: 0, res: 0, inj: 0, weeks: 0 };
}

/** Beitrag eintragen (nur wenn protokolliert wird). */
export function logPart(p: Player, key: string, v: number): void {
  const log = p.development.devLog;
  if (!log || !Number.isFinite(v) || v === 0) return;
  log.parts[key] = (log.parts[key] ?? 0) + v;
}

/** Entwicklungspunkte gutschreiben und – beim eigenen Kader – mit Ursache protokollieren. */
export function addDevPoints(p: Player, key: string, v: number): void {
  const d = p.development;
  d.devPoints = (d.devPoints ?? 0) + v;
  logPart(p, key, v);
}

/** Logarithmisches Mittel (für positive a, b). */
function logMean(a: number, b: number): number {
  if (Math.abs(a - b) < 1e-12) return a;
  return (a - b) / (Math.log(a) - Math.log(b));
}

/**
 * Zerlegt pts = base · Π f in base + Σ Beiträge (exakt). Ein Faktor 0 nimmt die
 * ganze Basis weg (z. B. Potenzial erreicht). Gibt die Beiträge je Schlüssel zurück.
 */
export function decompose(base: number, factors: [string, number][]): [string, number][] {
  if (base === 0) return [];
  const zero = factors.find(([, f]) => !(f > 0));
  if (zero) return [[zero[0], -base]];
  let prod = 1;
  for (const [, f] of factors) prod *= f;
  const sign = base < 0 ? -1 : 1;
  const a = Math.abs(base), b = a * prod;
  const L = logMean(b, a);
  const out: [string, number][] = [];
  for (const [k, f] of factors) {
    if (f === 1) continue;
    out.push([k, sign * L * Math.log(f)]);
  }
  return out;
}

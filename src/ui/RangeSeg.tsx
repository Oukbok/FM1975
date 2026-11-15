// =============================================================================
// Zeitraum-Wahl für Verlaufsdiagramme (Wunsch Pascal): 1 J. / 3 J. / 5 J. / 10 J. / Max.
// Kleine Segment-Gruppe (ui/Seg) für den Box-Kopf; die Wahl gilt je Diagrammart und
// wird im localStorage gemerkt (`fm_range_<art>`). Zeiträume, die nicht mehr zeigen
// als der nächstkleinere (zu wenig Daten), sind gesperrt – „Max“ zeigt immer alles.
// Helfer filtern Datumspunkte (`inRange`) bzw. Saisons (`seasonsInRange`).
// =============================================================================
import { useState } from 'react';
import Seg, { type SegOption } from './Seg';
import { seasonStartYear } from '../data/timeline';

export type ChartRange = '1' | '3' | '5' | '10' | 'max';
export const RANGES: ChartRange[] = ['1', '3', '5', '10', 'max'];
const YEARS: Record<ChartRange, number> = { '1': 1, '3': 3, '5': 5, '10': 10, max: Infinity };
const LABEL: Record<ChartRange, string> = { '1': '1 J.', '3': '3 J.', '5': '5 J.', '10': '10 J.', max: 'Max' };
const DAY = 86_400_000;

const ts = (d: string) => Date.parse(d.slice(0, 10) + 'T00:00:00Z');

/** Wahl je Diagrammart, gemerkt im localStorage (fehlt/gesperrt = Standard). */
export function useChartRange(kind: string, def: ChartRange): [ChartRange, (r: ChartRange) => void] {
  const key = `fm_range_${kind}`;
  const [r, setR] = useState<ChartRange>(() => {
    try {
      const v = localStorage.getItem(key) as ChartRange | null;
      return v && RANGES.includes(v) ? v : def;
    } catch { return def; }
  });
  const set = (v: ChartRange) => {
    setR(v);
    try { localStorage.setItem(key, v); } catch { /* ohne Speicher: nur bis zum Neuladen */ }
  };
  return [r, set];
}

/** Gesperrt, wenn der nächstkleinere Zeitraum schon alle Daten zeigt (`span` = Jahre mit Daten). */
export function rangeDisabled(r: ChartRange, span: number, minRange: ChartRange = '1'): boolean {
  const i = RANGES.indexOf(r);
  if (i < RANGES.indexOf(minRange)) return true;
  if (r === 'max' || i === RANGES.indexOf(minRange)) return false;
  return YEARS[RANGES[i - 1]] >= span - 1e-6;
}

/** Tatsächlich gezeigter Zeitraum: gesperrte Wahl → Max (zeigt dann ohnehin alles). */
export function effectiveRange(r: ChartRange, span: number, minRange: ChartRange = '1'): ChartRange {
  return rangeDisabled(r, span, minRange) ? (RANGES.indexOf(r) < RANGES.indexOf(minRange) ? minRange : 'max') : r;
}

/** Jahre zwischen erstem Datum und heute. */
export function spanYears(firstDate: string | undefined, today: string): number {
  return firstDate ? Math.max(0, (ts(today) - ts(firstDate)) / (365.25 * DAY)) : 0;
}

/** Punkte im Zeitraum (Datum ≥ heute − N Jahre). */
export function inRange<T>(items: T[], dateOf: (x: T) => string, today: string, r: ChartRange): T[] {
  if (r === 'max') return items;
  const y = +today.slice(0, 4) - YEARS[r];
  const from = `${y}${today.slice(4, 10)}`;
  return items.filter((x) => dateOf(x).slice(0, 10) >= from);
}

/** Saisons im Zeitraum: N Jahre = laufende Saison + die N davor. */
export function seasonsInRange<T>(items: T[], seasonOf: (x: T) => string, current: string, r: ChartRange): T[] {
  if (r === 'max') return items;
  const from = seasonStartYear(current) - YEARS[r];
  return items.filter((x) => seasonStartYear(seasonOf(x)) >= from);
}

/** Jahre, die eine Saisonreihe abdeckt (für die Sperren). */
export function seasonSpan<T>(items: T[], seasonOf: (x: T) => string, current: string): number {
  return items.length ? seasonStartYear(current) - Math.min(...items.map((x) => seasonStartYear(seasonOf(x)))) : 0;
}

/** Segment-Gruppe 1 J. / 3 J. / 5 J. / 10 J. / Max für den Box-Kopf. */
export default function RangeSeg({ value, onChange, span, minRange = '1', minTitle, className }: {
  value: ChartRange;
  onChange: (r: ChartRange) => void;
  /** Jahre mit Daten – größere Zeiträume ohne Mehrwert sind gesperrt. */
  span: number;
  /** Kleinster sinnvoller Zeitraum (z. B. „3“ bei Werten je Saison). */
  minRange?: ChartRange;
  /** Hinweis an gesperrten kleinen Zeiträumen. */
  minTitle?: string;
  className?: string;
}) {
  const shown = effectiveRange(value, span, minRange);
  const options: SegOption<ChartRange>[] = RANGES.map((r) => {
    const off = rangeDisabled(r, span, minRange);
    const small = RANGES.indexOf(r) < RANGES.indexOf(minRange);
    return {
      v: r, label: LABEL[r], disabled: off,
      title: off ? (small ? minTitle ?? 'Zu kurz für diese Werte' : 'Noch nicht genug Verlauf – zeigt dasselbe wie der kürzere Zeitraum')
        : r === 'max' ? 'Gesamter Verlauf' : `Letzte ${YEARS[r] === 1 ? '12 Monate' : `${YEARS[r]} Jahre`}`,
    };
  });
  return (
    // Box-Köpfe sind teils klickbar (Übersichtsseiten): Klicks auf die Wahl nicht weiterreichen.
    <span className={`rseg ${className ?? ''}`} onClick={(e) => e.stopPropagation()}>
      <Seg size="s" value={shown} options={options} onChange={onChange} aria-label="Zeitraum" />
    </span>
  );
}

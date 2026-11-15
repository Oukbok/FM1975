// =============================================================================
// Kompakter Monatsverlauf (Wunsch Pascal: Diagramme über 1/3/5/10 Jahre und „Max“).
// Ein Wert je Monat ab dem Startmonat `s` (YYYY-MM): `v[i]` gehört zu Monat s + i.
// Fehlt ein Monat (z. B. nach dem Laden eines alten Spielstands), wird die Lücke mit
// dem letzten bekannten Wert gefüllt – so bleibt der Index immer gleich dem Monat.
// Genutzt für Kontostand (`ClubFinances.balanceLog`) und Teamstimmung
// (`DressingRoomState.moodLog`); beide optional, alte Stände füllen sich aus den
// gekürzten Verläufen auf (`seedMonthLog`).
// =============================================================================

export interface MonthLog {
  /** Erster Monat (YYYY-MM). */
  s: string;
  /** Ein Wert je Monat ab `s`. */
  v: number[];
}

const idx = (ym: string) => +ym.slice(0, 4) * 12 + (+ym.slice(5, 7) - 1);
const ymOf = (i: number) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;

/** Trägt den Wert für den Monat `ym` (YYYY-MM) ein; ältere Monate als `s` werden ignoriert. */
export function pushMonth(log: MonthLog, ym: string, value: number): void {
  const k = idx(ym) - idx(log.s);
  if (k < 0) return;
  if (k < log.v.length) { log.v[k] = value; return; }
  const fill = log.v.length ? log.v[log.v.length - 1] : value;
  while (log.v.length < k) log.v.push(fill);
  log.v.push(value);
}

/** Neuer Verlauf aus vorhandenen Datumspunkten (je Monat der letzte Wert). */
export function seedMonthLog(points: { date: string; value: number }[]): MonthLog | undefined {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) return undefined;
  const log: MonthLog = { s: sorted[0].date.slice(0, 7), v: [] };
  for (const p of sorted) pushMonth(log, p.date.slice(0, 7), p.value);
  return log;
}

/** Punkte des Verlaufs: Datum = Erster des Monats (Monatsabschluss). */
export function monthLogPoints(log: MonthLog | undefined): { date: string; value: number }[] {
  if (!log) return [];
  const i0 = idx(log.s);
  return log.v.map((value, i) => ({ date: `${ymOf(i0 + i)}-01`, value }));
}

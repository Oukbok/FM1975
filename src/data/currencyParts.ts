// Bausteine der Währungstabellen (data/currencies.ts, data/currencySuccessors.ts).

export interface CurrencyEra {
  /** Stichtag (erster Tag der neuen Währung), ISO. */
  from: string;
  code: string;
  /** Kurzzeichen in der Anzeige („£“, „Lire“, „€“). */
  unit: string;
  /** Name im Text („Pfund Sterling“). */
  name: string;
  /** [Jahr, DM je 1 Einheit] – aufsteigend. */
  rates: [number, number][];
  /** Umstellungskurs zur Vorgängerwährung (Anzeige im Briefing), z. B. „10.000 Zloty = 1 Zloty“. */
  note?: string;
}

export const DM_PER_EUR = 1.95583;
export const EURO = (from: string, note: string): CurrencyEra => ({ from, code: 'EUR', unit: '€', name: 'Euro', rates: [[1999, DM_PER_EUR]], note });
/** Eurokurs-Reihe (Euro je Einheit) → DM je Einheit. */
export const eur = (rows: [number, number][]): [number, number][] => rows.map(([y, e]) => [y, e * DM_PER_EUR]);

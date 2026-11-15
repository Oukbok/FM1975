// =============================================================================
// Finanz-Engine: zentrale Buchung (Kontostand, Einnahmen-/Ausgaben-Töpfe,
// Buchungsverlauf) und Saisonsummen. Teil von engine/finances.ts (dort weitergereicht).
// =============================================================================
import { ClubFinances, FinanceCategory, FinanceTransaction } from '../types';
import { seqId } from './idSeq';

/** Buchungs-ID: laufende Nummer des Spielstands (engine/idSeq.ts), nicht die Uhrzeit. */
function txId(): string {
  return seqId('tx-');
}

/** Zuordnung Kategorie → Einnahmen-Bucket. */
const INCOME_BUCKET: Partial<Record<FinanceCategory, keyof ClubFinances['income']>> = {
  ticket_sales: 'ticketSales',
  tv_money: 'tvMoney',
  sponsorship: 'sponsorship',
  merchandise: 'merchandise',
  transfer_income: 'transferIncome',
  prize_money: 'prizeMoney',
  catering: 'catering',
  advertising: 'advertising',
  commercial: 'commercial',
  membership: 'membership',
  matchday: 'matchday',
  other: 'other',
};

/** Zuordnung Kategorie → Ausgaben-Bucket. */
const EXPENSE_BUCKET: Partial<Record<FinanceCategory, keyof ClubFinances['expenses']>> = {
  wages: 'wages',
  transfer_expense: 'transferExpense',
  stadium_maintenance: 'stadiumMaintenance',
  training_facilities: 'trainingFacilities',
  staff_wages: 'staffWages',
  facilities: 'facilities',
  operations: 'operations',
  other: 'other',
};

/**
 * Zentrale Buchung. amount > 0 = Einnahme, amount < 0 = Ausgabe.
 * `trackDetail` legt die Einzelbuchung in der Historie ab (nur Manager-Verein,
 * damit Speicherstände nicht unbegrenzt wachsen).
 */
export function book(
  fin: ClubFinances,
  date: string,
  amount: number,
  category: FinanceCategory,
  description: string,
  trackDetail: boolean,
): void {
  fin.balance += amount;
  if (amount >= 0) {
    const k = INCOME_BUCKET[category];
    if (k) fin.income[k] = (fin.income[k] ?? 0) + amount;
  } else {
    const k = EXPENSE_BUCKET[category];
    if (k) fin.expenses[k] = (fin.expenses[k] ?? 0) + -amount;
  }
  if (trackDetail) {
    const tx: FinanceTransaction = { id: txId(), date, amount, category, description };
    fin.transactions.unshift(tx);
    if (fin.transactions.length > 400) fin.transactions.length = 400;
  }
}

/** Gesamt-Einnahmen der Saison bislang (DM). */
export function totalIncome(fin: ClubFinances): number {
  const i = fin.income;
  return i.ticketSales + i.tvMoney + i.sponsorship + i.merchandise + i.transferIncome + i.prizeMoney
    + (i.catering ?? 0) + (i.advertising ?? 0) + (i.commercial ?? 0) + (i.membership ?? 0) + (i.matchday ?? 0) + i.other;
}

/** Gesamt-Ausgaben der Saison bislang (DM). */
export function totalExpense(fin: ClubFinances): number {
  const e = fin.expenses;
  return e.wages + e.transferExpense + e.stadiumMaintenance + e.trainingFacilities
    + (e.facilities ?? 0) + (e.operations ?? 0) + e.staffWages + e.other;
}

// =============================================================================
// LEIHEN — Abschluss, Laufzeit und Ende (Wunsch Pascal: Leihen vollständig im Spiel)
// -----------------------------------------------------------------------------
// • `makeLoan`: Spieler wechselt zum Leihverein (Vertrag und Gehalt bleiben beim
//   Stammverein gebunden, das Gehalt zahlt der Leihverein – anteilig nach `share`,
//   den Rest erstattet der Stammverein monatlich), Leihgebühr, Protokoll.
// • Grenzen je Epoche (data/loanRules.ts): Höchstzahl je Verein, je Vereinspaar.
// • Täglich (`loanLifeDaily`, game/day.ts vor aiLoansDaily): Monatserstattung am 1.,
//   Rückkehr nach Leihende (auch Halbjahresleihen zum 31.12.), Rückruf der KI im
//   Januar, am 29.6. Abrechnung: Einsatzgarantie/Strafzahlung, Kaufpflicht; laufende
//   Leihen über zwei Spielzeiten merken sich die Bilanz der Saison.
// • Kaufoption: du entscheidest in der Nachricht (game/playerWishesGame.ts), die KI
//   nach Leistung (game/aiLoans.ts `optionWanted`).
// =============================================================================
import type { Club, Player } from '../types';
import { CalendarEngine } from '../engine/calendar';
import { economyScale, yearOf } from '../engine/economy';
import { book, bookTransfer } from '../engine/finances';
import { recordTransfer } from '../engine/history';
import { type LoanDeal, type LoanTerms, loanStats } from '../engine/loanDeal';
import { makeMessage, pushMessage } from '../engine/messages';
import { loanRulesFor } from '../data/loanRules';
import { fmtPrice } from '../ui/format';
import { isHomegrown } from './clubHonours';
import { homeCountryOf, type Game } from './state';
import { repairSquadLists } from './squads';
import { noteLoan } from './transferLog';

const seasonYearOf = (g: Game) => parseInt(g.season.slice(0, 4), 10);
/** Leihregeln der laufenden Saison im Heimatland. */
export const loanRulesNow = (g: Game) => loanRulesFor(seasonYearOf(g), homeCountryOf(g));

/** Ende der Saison (30.6.) für ein Datum. */
export function seasonEndOf(date: string): string {
  const y = yearOf(date), m = Number(date.slice(5, 7));
  return `${m >= 7 ? y + 1 : y}-06-30`;
}

/** Zählt der Spieler gegen die Höchstzahl? (Ausnahme: jung bzw. Eigengewächs.) */
function countsToCap(g: Game, p: Player, exemptAge: number | null, parent: Club | undefined): boolean {
  if (exemptAge == null) return true;
  if (p.age <= exemptAge) return false;
  return !(parent && isHomegrown(p, parent));
}

/** Verliehene/ausgeliehene Spieler eines Vereins, die gegen die Höchstzahl zählen. */
export function loanCount(g: Game, clubId: string): { out: number; in: number } {
  const r = loanRulesNow(g);
  let out = 0, inn = 0;
  for (const p of Object.values(g.players)) {
    if (!p.loan) continue;
    if (!countsToCap(g, p, r.exemptAge, g.clubs[p.loan.fromClubId])) continue;
    if (p.loan.fromClubId === clubId) out++;
    if (p.clubId === clubId) inn++;
  }
  return { out, in: inn };
}

/** Darf `p` von `from` an `to` verliehen werden? Grund, falls nicht. */
export function loanLimitBlocker(g: Game, p: Player, from: Club, to: Club): string | null {
  const r = loanRulesNow(g);
  if (p.loan) return r.sublet === 'banned' || p.loan.deal?.noSublet ? 'Er ist selbst nur ausgeliehen – weiterverleihen ist ausgeschlossen.' : 'Er ist selbst nur ausgeliehen.';
  if (r.samePair != null) {
    const pair = Object.values(g.players).filter((x) => x.loan && ((x.loan.fromClubId === from.id && x.clubId === to.id) || (x.loan.fromClubId === to.id && x.clubId === from.id))).length;
    if (pair >= r.samePair) return `Zwischen ${from.shortName ?? from.name} und ${to.shortName ?? to.name} laufen schon ${pair} Leihen (Höchstzahl ${r.samePair}).`;
  }
  if (r.maxLoans != null && countsToCap(g, p, r.exemptAge, from)) {
    const a = loanCount(g, from.id), b = loanCount(g, to.id);
    if (a.out + a.in >= r.maxLoans) return `${from.shortName ?? from.name} hat die Höchstzahl von ${r.maxLoans} Leihspielern erreicht (bis ${r.exemptAge} Jahre und Eigengewächse ausgenommen).`;
    if (b.out + b.in >= r.maxLoans) return `${to.shortName ?? to.name} hat die Höchstzahl von ${r.maxLoans} Leihspielern erreicht (bis ${r.exemptAge} Jahre und Eigengewächse ausgenommen).`;
  }
  return null;
}

/** Leihe vollziehen: Spieler zum Leihverein, Leihgebühr, Bedingungen am Spieler. */
export function makeLoan(g: Game, p: Player, from: Club, to: Club, today: string, t: LoanTerms): void {
  const s = p.seasonStats;
  from.playerIds = from.playerIds.filter((id) => id !== p.id);
  if (!to.playerIds.includes(p.id)) to.playerIds.push(p.id);
  p.clubId = to.id;
  p.transferListed = false;
  p.loanListed = undefined;
  const deal: LoanDeal = {
    since: today, fee: t.fee, share: t.share, obligation: t.obligation, minApps: t.minApps, penalty: t.penalty,
    recall: t.recall, noParent: t.noParent, noSublet: t.noSublet, ov0: Math.round(p.overall),
    base: [s?.appearances ?? 0, s?.starts ?? 0, s?.minutesPlayed ?? 0, s?.goals ?? 0], acc: [0, 0, 0, 0],
  };
  p.loan = { fromClubId: from.id, until: t.until, optionFee: t.optionFee ?? 0, wage: p.contract.weeklyWage, noOption: !t.optionFee || undefined, deal };
  if (p.contract.expiryDate < t.until) p.contract.expiryDate = t.until; // Vertrag läuft mindestens bis zum Leihende
  if (t.fee > 0) {
    to.finances.transferBudget -= t.fee;
    from.finances.transferBudget += t.fee;
    bookTransfer(to, t.fee, true, `${p.fullName} (Leihgebühr)`, today, to.id === g.managedClubId);
    bookTransfer(from, t.fee, false, `${p.fullName} (Leihgebühr)`, today, from.id === g.managedClubId);
  }
  if (from.tactics?.startingXI?.includes(p.id)) from.tactics.startingXI = from.tactics.startingXI.filter((id) => id !== p.id);
  recordTransfer(p, from.name, to.name, Math.round(t.fee * economyScale(yearOf(today))), today, 'loan');
  noteLoan(g, p.id);
  repairSquadLists(g);
}

/** Zurück zum Stammverein (Leihende, Rückruf). */
export function returnLoan(g: Game, p: Player, today: string, why: string): void {
  const loan = p.loan;
  if (!loan) return;
  const holder = g.clubs[p.clubId], parent = g.clubs[loan.fromClubId];
  if (!parent) { p.loan = undefined; return; }
  if (holder) holder.playerIds = holder.playerIds.filter((id) => id !== p.id);
  if (holder?.tactics?.startingXI?.includes(p.id)) holder.tactics.startingXI = holder.tactics.startingXI.filter((id) => id !== p.id);
  if (!parent.playerIds.includes(p.id)) parent.playerIds.push(p.id);
  p.clubId = parent.id;
  p.contract.weeklyWage = loan.wage ?? p.contract.weeklyWage;
  const st = loanStats(p);
  p.loan = undefined;
  recordTransfer(p, holder?.name ?? '', parent.name, 0, today, 'back');
  if (parent.id === g.managedClubId || holder?.id === g.managedClubId) {
    const mine = parent.id === g.managedClubId;
    pushMessage(g.messages, makeMessage({
      date: today, category: 'transfer', from: 'Sportdirektor', relatedId: p.id,
      subject: mine ? `${p.fullName} kehrt zurück` : `${p.fullName} verlässt uns`,
      shortText: `${why} ${st.apps} Einsätze für ${holder?.shortName ?? 'den Leihverein'}.`,
      bodyText: `${why} ${p.fullName} kam beim Leihverein auf ${st.apps} Pflichtspiele (${st.starts} von Beginn, ${st.minutes} Minuten, ${st.goals} Tore) und steht jetzt wieder im Kader von ${parent.name}. Stärke heute: ${Math.round(p.overall)}.`,
    }));
  }
  repairSquadLists(g);
}

/** Fester Wechsel am Ende der Leihe (Kaufoption gezogen bzw. Kaufpflicht). */
export function buyLoaned(g: Game, p: Player, fee: number, today: string, label: string): void {
  const loan = p.loan;
  const holder = g.clubs[p.clubId], parent = loan ? g.clubs[loan.fromClubId] : undefined;
  p.loan = undefined;
  if (!holder || !parent) return;
  holder.finances.transferBudget -= fee;
  parent.finances.transferBudget += fee;
  bookTransfer(holder, fee, true, `${p.fullName} (${label})`, today, holder.id === g.managedClubId);
  bookTransfer(parent, fee, false, `${p.fullName} (${label})`, today, parent.id === g.managedClubId);
  recordTransfer(p, parent.name, holder.name, Math.round(fee * economyScale(yearOf(today))), today);
}

/** Erfüllt? Kaufpflicht-Bedingung am Saisonende. */
function obligationMet(g: Game, p: Player, holder: Club): boolean {
  const o = p.loan?.deal?.obligation;
  if (!o) return false;
  if (o.cond === 'always') return true;
  if (o.cond === 'apps') return loanStats(p).apps >= (o.apps ?? 20);
  // Klassenerhalt: nicht unter den letzten drei seiner Liga (nur bekannt für die eigene Liga; sonst erfüllt).
  const rows = g.table?.rows ?? [];
  const i = rows.findIndex((r) => r.clubId === holder.id);
  return i < 0 || i < rows.length - 3;
}

/** Leihende: Einsatzgarantie (Strafzahlung) und Kaufpflicht abrechnen. */
function settleOne(g: Game, p: Player, today: string): void {
  const loan = p.loan, d = loan?.deal;
  if (!loan || !d || d.settled) return;
  const holder = g.clubs[p.clubId], parent = g.clubs[loan.fromClubId];
  if (!holder || !parent) return;
  d.settled = true;
  const mineIn = holder.id === g.managedClubId, mineOut = parent.id === g.managedClubId;
  const st = loanStats(p);
  if (d.minApps && st.apps < d.minApps && d.penalty) {
    const nominal = Math.round(d.penalty * economyScale(yearOf(today)));
    book(holder.finances, today, -nominal, 'transfer_expense', `Leihe ${p.fullName}: Strafzahlung Einsatzgarantie`, mineIn);
    book(parent.finances, today, nominal, 'transfer_income', `Leihe ${p.fullName}: Strafzahlung Einsatzgarantie`, mineOut);
    if (mineIn || mineOut) pushMessage(g.messages, makeMessage({
      date: today, category: 'transfer', from: 'Sportdirektor', relatedId: p.id,
      subject: `Einsatzgarantie verfehlt: ${p.fullName}`,
      shortText: `${st.apps} statt ${d.minApps} Pflichtspiele – ${fmtPrice(d.penalty)} Strafzahlung.`,
      bodyText: `Vereinbart waren mindestens ${d.minApps} Pflichtspiele für ${holder.name}. Es wurden ${st.apps}. Laut Leihvertrag zahlt ${holder.name} deshalb ${fmtPrice(d.penalty)} an ${parent.name}.`,
    }));
  }
  if (d.obligation && obligationMet(g, p, holder)) {
    const fee = d.obligation.fee;
    buyLoaned(g, p, fee, today, 'Kaufpflicht');
    if (mineIn || mineOut) pushMessage(g.messages, makeMessage({
      date: today, category: 'transfer', from: 'Sportdirektor', relatedId: p.id,
      subject: `Kaufpflicht greift: ${p.fullName} bleibt bei ${holder.name}`,
      shortText: `Bedingung erfüllt – ${fmtPrice(fee)} Ablöse.`,
      bodyText: `Die Bedingung der Kaufpflicht ist erfüllt (${st.apps} Pflichtspiele für ${holder.name}). ${p.fullName} wechselt fest für ${fmtPrice(fee)} von ${parent.name} zu ${holder.name}.`,
    }));
    repairSquadLists(g);
  }
}

/** 29.6.: Leihen zum Saisonende abrechnen; Leihen über zwei Spielzeiten sichern die Bilanz der Saison. */
function settleSeason(g: Game, today: string): void {
  const end = `${today.slice(0, 4)}-06-30`;
  for (const p of Object.values(g.players)) {
    const loan = p.loan, d = loan?.deal;
    if (!loan || !d || d.settled) continue;
    if (loan.until > end) {
      // Die Saisonwerte werden zum 1.7. zurückgesetzt.
      const st = loanStats(p);
      d.acc = [st.apps, st.starts, st.minutes, st.goals];
      d.base = [0, 0, 0, 0];
      continue;
    }
    settleOne(g, p, today);
  }
}

/** Monatlich: Der Stammverein erstattet den Gehaltsanteil, den der Leihverein nicht trägt. */
function wageShares(g: Game, today: string): void {
  const scale = economyScale(yearOf(today));
  for (const p of Object.values(g.players)) {
    const d = p.loan?.deal;
    if (!p.loan || !d || d.share >= 1) continue;
    const holder = g.clubs[p.clubId], parent = g.clubs[p.loan.fromClubId];
    if (!holder || !parent) continue;
    const nominal = Math.round(p.contract.weeklyWage * 4.33 * (1 - d.share) * scale);
    if (nominal <= 0) continue;
    book(parent.finances, today, -nominal, 'wages', `Leihe ${p.fullName}: Gehaltsanteil`, parent.id === g.managedClubId);
    book(holder.finances, today, nominal, 'other', `Leihe ${p.fullName}: Gehaltsanteil vom Stammverein`, holder.id === g.managedClubId);
  }
}

/** Darf der Stammverein ihn jetzt zurückholen (Rückrufklausel, Januar)? */
export function canRecall(g: Game, p: Player): boolean {
  return !!p.loan?.deal?.recall && Number(g.calendar.currentDate.slice(5, 7)) === 1 && p.loan.until > g.calendar.currentDate;
}

/** Rückruf durch dich (Rückrufklausel). */
export function recallLoan(g: Game, pid: string): string {
  const p = g.players[pid];
  if (!p?.loan || p.loan.fromClubId !== g.managedClubId) return 'Er ist nicht von dir verliehen.';
  if (!canRecall(g, p)) return p.loan.deal?.recall ? 'Zurückholen geht nur im Januar.' : 'Der Leihvertrag hat keine Rückrufklausel.';
  returnLoan(g, p, g.calendar.currentDate, 'Du hast die Rückrufklausel gezogen.');
  return `${p.fullName} ist zurück.`;
}

/** 5.1.: KI-Stammvereine holen Spieler zurück, die bei dir kaum spielen (Rückrufklausel). */
function aiRecalls(g: Game, today: string): void {
  const own = g.clubs[g.managedClubId];
  for (const id of [...(own?.playerIds ?? [])]) {
    const p = g.players[id];
    if (!p?.loan?.deal?.recall || p.loan.until <= today) continue;
    const st = loanStats(p);
    const days = (Date.parse(today) - Date.parse(p.loan.deal.since)) / 86400000;
    if (days < 60 || st.starts >= Math.max(3, days / 14)) continue;
    returnLoan(g, p, today, `${g.clubs[p.loan.fromClubId]?.name ?? 'Sein Verein'} zieht die Rückrufklausel – er kam bei uns zu selten zum Zug.`);
  }
}

/** Täglicher Einstieg (game/day.ts, vor aiLoansDaily). */
export function loanLifeDaily(g: Game, today: string): void {
  const md = today.slice(5);
  if (md.endsWith('-01')) wageShares(g, today);
  if (md === '06-29') settleSeason(g, today);
  if (md === '01-05') aiRecalls(g, today);
  // Rückkehr nach Leihende außerhalb des Saisonendes (Halbjahresleihen zum 31.12.).
  if (md !== '06-29') {
    for (const p of Object.values(g.players)) {
      if (!p.loan || p.loan.until >= today) continue;
      // Zum 30.6. entscheiden aiLoans.ts/playerWishesGame.ts (Kaufoption); hier nur, was danach liegen blieb.
      if (p.loan.until.endsWith('06-30') && CalendarEngine.addDays(p.loan.until, 5) >= today) continue;
      settleOne(g, p, today);
      if (p.loan) returnLoan(g, p, today, 'Die Leihe ist zu Ende.');
    }
  }
}


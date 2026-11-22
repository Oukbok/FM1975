// =============================================================================
// KI-LEIHEN — junge Ersatzspieler sammeln Spielpraxis bei kleineren Vereinen
// -----------------------------------------------------------------------------
// • Markttage 27.7., 17.8., 19.1.: Größere KI-Vereine verleihen junge Spieler
//   (18–22, außerhalb der ersten 15, Luft nach oben) an kleinere Ligavereine mit
//   Bedarf auf ihrer Position. Leihen werden über die Epochen häufiger (1975 selten,
//   ab den 90ern üblich); Kaufoption ab 2000 gelegentlich (CLAUSE_FROM.loanOption).
// • Anfragen an dich und Angebote für deine Leihliste: game/loanMarket.ts.
// • 29./30. Juni (und zur Sicherheit beim Saisonwechsel): Rückkehr zum Stammverein;
//   mit Kaufoption bleibt er, wenn der Leihverein ihn will und es sich leisten kann.
// Nutzt das Leihfeld `Player.loan` der Transferverhandlungen (game/transferTalks.ts).
// =============================================================================
import { Club, Player } from '../types';
import { assessSquad, GROUP_OF, squadLevel11, targetStrength } from '../engine/aiManager';
import { CalendarEngine } from '../engine/calendar';
import { seasonEndYear } from '../engine/contractTalks';
import { economyScale, yearOf } from '../engine/economy';
import { bookTransfer } from '../engine/finances';
import { recordTransfer } from '../engine/history';
import { makeMessage, pushMessage } from '../engine/messages';
import { CLAUSE_FROM } from '../engine/transferMarket';
import { hasTransferBan, lastRevenue } from '../engine/clubEconomy';
import { fmtPrice } from '../ui/format';
import { isAiClub, monthsLeftOf, squadOf } from './aiClubs';
import { noteSquad } from './aiSquadLog';
import { CHOICE_HANDLERS } from './eventsGame';
import { repairSquadLists } from './squads';
import { loanLimitBlocker, loanRulesNow, makeLoan } from './loanLife';
import { loanFrequency } from '../data/loanRules';
import { Game } from './state';

const r5k = (v: number) => Math.round(v / 5000) * 5000;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const LOAN_DAYS = new Set(['07-27', '08-17', '01-19']);
/** Höchstens so viele Leihspieler je KI-Verein (zusätzlich die Grenzen aus data/loanRules.ts). */
export const MAX_BORROWED = 2;

/** Wie häufig Leihen in der Epoche sind (0–1). */
export function loanEra(year: number): number {
  return loanFrequency(year);
}

export const borrowedBy = (g: Game, c: Club) => c.playerIds.filter((id) => g.players[id]?.loan).length;

/** Junge Spieler, die beim Verein kaum spielen würden und sich entwickeln können. */
export function loanCandidates(g: Game, club: Club, today: string): Player[] {
  const squad = squadOf(g, club).filter((p) => !p.isYouth);
  const byOv = [...squad].sort((a, b) => b.overall - a.overall);
  const level = squadLevel11(squad);
  return squad.filter((p) => p.age >= 18 && p.age <= 22 && !p.loan && !p.contract.preContractClubId && !p.injury
    && byOv.indexOf(p) >= 15 && p.overall < level - 4 && monthsLeftOf(p, today) >= 14
    && (p.development.potentialAbility - p.overall >= 6 || p.potentialStars >= 3));
}

/** Kleinerer KI-Verein mit Bedarf auf der Position des Spielers. */
export function loanTaker(g: Game, p: Player, lender: Club): Club | null {
  const group = GROUP_OF[p.naturalPosition];
  let best: Club | null = null, bestS = 0;
  for (const c of Object.values(g.clubs)) {
    if (c.id === lender.id || !isAiClub(g, c) || c.playerIds.length >= 25 || borrowedBy(g, c) >= MAX_BORROWED) continue;
    if ((c.reputation ?? 60) > (lender.reputation ?? 60) - 4) continue;
    const a = assessSquad(squadOf(g, c), c.tactics?.formation);
    const need = a.groups[group];
    if (p.overall < targetStrength(a, need).min - 3) continue;
    const s = need.score + (p.overall - a.level) * 0.5;
    if (s >= 4 && s > bestS) { bestS = s; best = c; }
  }
  return best;
}

/** Leihe vollziehen (Vertrag und Gehalt bleiben; der Leihverein zahlt das Gehalt) – game/loanLife.ts `makeLoan`. */
export function lendPlayer(g: Game, p: Player, from: Club, to: Club, today: string, opts: { fee?: number; optionFee?: number } = {}): void {
  const r = loanRulesNow(g);
  makeLoan(g, p, from, to, today, {
    until: `${seasonEndYear(today)}-06-30`, fee: opts.fee ?? 0, share: 1, optionFee: opts.optionFee || undefined,
    noParent: r.parentPlay === 'banned' || undefined, noSublet: r.sublet === 'banned' || undefined,
  });
}

/** Markttag: KI-Vereine verleihen junge Ersatzspieler. */
export function aiLoanRound(g: Game, today: string, rng: () => number = Math.random): number {
  if (!LOAN_DAYS.has(today.slice(5))) return 0;
  const year = yearOf(today);
  const era = loanEra(year);
  let n = 0;
  const lenders = Object.values(g.clubs).filter((c) => isAiClub(g, c)).sort((a, b) => (b.reputation ?? 0) - (a.reputation ?? 0));
  for (const lender of lenders) {
    if (lender.playerIds.length <= 20) continue;
    let k = 0;
    for (const p of loanCandidates(g, lender, today)) {
      if (k >= 2 || lender.playerIds.length <= 20 || rng() > 0.45 * era) continue;
      const to = loanTaker(g, p, lender);
      if (!to || loanLimitBlocker(g, p, lender, to)) continue;
      const fee = year >= 1990 && rng() < 0.4 ? r5k(p.contract.transferValue * 0.08) : 0;
      const optionFee = year >= CLAUSE_FROM.loanOption && rng() < 0.35 ? r5k(p.contract.transferValue * 1.2) : 0;
      if (fee > Math.max(0, to.finances.transferBudget)) continue;
      lendPlayer(g, p, lender, to, today, { fee, optionFee });
      g.aiMarket?.news.push(`${lender.name} verleiht ${p.fullName} (${p.age}) an ${to.name}${optionFee ? ` – Kaufoption ${fmtPrice(optionFee)}` : ''}`);
      noteSquad(g, 'loans');
      if (optionFee) noteSquad(g, 'loanOptions');
      k++; n++;
    }
  }
  if (n) repairSquadLists(g);
  return n;
}

// -----------------------------------------------------------------------------
// Saisonende: Rückkehr oder Kaufoption
// -----------------------------------------------------------------------------
/**
 * Zieht der Leihverein die Kaufoption? Entscheidend ist, wie der Spieler bei ihm
 * gespielt hat (Startelf-Anteil, Note), nicht seine Stärke allein – und ob die Kasse
 * die Option hergibt (Kontostand nach Zahlung über einer kleinen Reserve).
 */
export function optionWanted(g: Game, p: Player, holder: Club, today: string, rng: () => number): boolean {
  if (hasTransferBan(holder, g.season)) return false;
  const fee = p.loan?.optionFee ?? 0;
  const nominal = fee * economyScale(yearOf(today));
  if (holder.finances.balance - nominal < lastRevenue(holder, yearOf(today)) * 0.02) return false;
  const st = p.seasonStats;
  // Ligaspiele der Saison (doppelte Runde); Pokal/Europa zählen in den Einsätzen mit.
  const played = Math.max(g.table.rows.find((r) => r.clubId === holder.id)?.played ?? 0, 2 * Math.max(1, g.table.rows.length - 1));
  const share = (st?.starts ?? 0) / Math.max(1, played);
  const note = st?.ratedMatches ? st.averageRating : 4; // 1 = sehr gut … 6
  const regular = share >= 0.45 || ((st?.appearances ?? 0) >= played * 0.5 && note <= 3.4);
  const pBuy = regular ? clamp(0.5 + (3.4 - note) * 0.3 + (share - 0.5) * 0.5, 0.25, 0.85) : share >= 0.25 ? 0.2 : 0.03;
  // Ergibt gut ein Viertel gezogene Optionen (Soll 20–35 %, docs/research/free-transfers.md): Stammspieler meist,
  // Ergänzungsspieler selten, wer kaum spielte fast nie.
  return rng() < pBuy;
}

// -----------------------------------------------------------------------------
// Rückkehr
// -----------------------------------------------------------------------------
export function aiLoansSeasonEnd(g: Game, today: string, rng: () => number = Math.random): number {
  let n = 0;
  for (const p of Object.values(g.players)) {
    const loan = p.loan;
    if (!loan || loan.until > today) continue;
    const holder = g.clubs[p.clubId];
    if (!holder || !isAiClub(g, holder)) continue; // deine Leihspieler: Entscheidung in playerWishesGame.ts
    const parent = g.clubs[loan.fromClubId];
    const mineParent = parent?.id === g.managedClubId;
    const wants = !loan.noOption && loan.optionFee > 0 && optionWanted(g, p, holder, today, rng);
    if (wants || !parent) {
      p.loan = undefined;
      if (wants && parent) {
        holder.finances.transferBudget -= loan.optionFee;
        parent.finances.transferBudget += loan.optionFee;
        bookTransfer(holder, loan.optionFee, true, `${p.fullName} (Kaufoption)`, today, holder.isPlayerControlled);
        bookTransfer(parent, loan.optionFee, false, `${p.fullName} (Kaufoption)`, today, parent.isPlayerControlled);
        recordTransfer(p, parent.name, holder.name, Math.round(loan.optionFee * economyScale(yearOf(today))), today);
        noteSquad(g, 'loanBuys');
        if (mineParent) pushMessage(g.messages, makeMessage({
          date: today, category: 'transfer', from: 'Sportdirektor', relatedId: p.id,
          subject: `${holder.name} zieht die Kaufoption für ${p.fullName}`,
          shortText: `${fmtPrice(loan.optionFee)} – er bleibt dort.`,
          bodyText: `${holder.name} hat die vereinbarte Kaufoption über ${fmtPrice(loan.optionFee)} gezogen. ${p.fullName} bleibt fest beim Leihverein.`,
        }));
      }
      n++;
      continue;
    }
    holder.playerIds = holder.playerIds.filter((id) => id !== p.id);
    parent.playerIds.push(p.id);
    p.clubId = parent.id;
    p.contract.weeklyWage = loan.wage ?? p.contract.weeklyWage;
    p.loan = undefined;
    recordTransfer(p, holder.name, parent.name, 0, today, 'back');
    if (mineParent) pushMessage(g.messages, makeMessage({
      date: today, category: 'transfer', from: 'Sportdirektor', relatedId: p.id,
      subject: `${p.fullName} kehrt von der Leihe zurück`,
      shortText: `${p.seasonStats?.appearances ?? 0} Einsätze für ${holder.shortName}, Stärke jetzt ${p.overall}.`,
      bodyText: `Die Leihe an ${holder.name} ist beendet. ${p.fullName} kam dort auf ${p.seasonStats?.appearances ?? 0} Einsätze und steht wieder in unserem Kader.`,
    }));
    n++;
  }
  if (n) repairSquadLists(g);
  return n;
}

/** Täglicher Einstieg (game/day.ts). */
export function aiLoansDaily(g: Game, today: string, rng: () => number = Math.random): void {
  aiLoanRound(g, today, rng);
  // Der 30. Juni selbst wird nicht mehr als Spieltag verarbeitet (Saisonende) → am 29.6. abrechnen.
  if (today.slice(5) === '06-29') aiLoansSeasonEnd(g, `${today.slice(0, 4)}-06-30`, rng);
}

// =============================================================================
// KI-LEIHEN — junge Ersatzspieler sammeln Spielpraxis bei kleineren Vereinen
// -----------------------------------------------------------------------------
// • Markttage 27.7., 17.8., 19.1.: Größere KI-Vereine verleihen junge Spieler
//   (18–22, außerhalb der ersten 15, Luft nach oben) an kleinere Ligavereine mit
//   Bedarf auf ihrer Position. Leihen werden über die Epochen häufiger (1975 selten,
//   ab den 90ern üblich); Kaufoption ab 2000 gelegentlich (CLAUSE_FROM.loanOption).
// • Auch dein Verein wird gefragt: Ein KI-Verein möchte einen deiner jungen
//   Ergänzungsspieler ausleihen (Nachricht mit Entscheidung).
// • 30. Juni (und zur Sicherheit beim Saisonwechsel): Rückkehr zum Stammverein;
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
import { fmtPrice } from '../ui/format';
import { isAiClub, monthsLeftOf, squadOf } from './aiClubs';
import { noteSquad } from './aiSquadLog';
import { CHOICE_HANDLERS } from './eventsGame';
import { repairSquadLists } from './squads';
import { noteLoan } from './transferLog';
import { Game } from './state';

const r5k = (v: number) => Math.round(v / 5000) * 5000;
const LOAN_DAYS = new Set(['07-27', '08-17', '01-19']);
const ASK_DAYS = new Set(['07-25', '01-17']);
const ASK_TYPE = 'ai_loan_request';
/** Höchstens so viele Leihspieler je Verein. */
const MAX_BORROWED = 2;

/** Wie häufig Leihen in der Epoche sind (0–1). */
export function loanEra(year: number): number {
  return year < 1985 ? 0.25 : year < 1995 ? 0.55 : year < 2005 ? 0.85 : 1;
}

const sim = (g: Game) => !!(g as any).simAutoManage;
const borrowedBy = (g: Game, c: Club) => c.playerIds.filter((id) => g.players[id]?.loan).length;

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

/** Leihe vollziehen (Vertrag und Gehalt bleiben; der Leihverein zahlt das Gehalt). */
export function lendPlayer(g: Game, p: Player, from: Club, to: Club, today: string, opts: { fee?: number; optionFee?: number } = {}): void {
  const fee = opts.fee ?? 0;
  from.playerIds = from.playerIds.filter((id) => id !== p.id);
  to.playerIds.push(p.id);
  p.clubId = to.id;
  p.transferListed = false;
  p.loan = { fromClubId: from.id, until: `${seasonEndYear(today)}-06-30`, optionFee: opts.optionFee ?? 0, wage: p.contract.weeklyWage, noOption: !opts.optionFee || undefined };
  if (fee > 0) {
    to.finances.transferBudget -= fee;
    from.finances.transferBudget += fee;
    bookTransfer(to, fee, true, `${p.fullName} (Leihgebühr)`, today, to.isPlayerControlled);
    bookTransfer(from, fee, false, `${p.fullName} (Leihgebühr)`, today, from.isPlayerControlled);
  }
  if (from.tactics?.startingXI?.includes(p.id)) from.tactics.startingXI = from.tactics.startingXI.filter((id) => id !== p.id);
  recordTransfer(p, from.name, to.name, Math.round(fee * economyScale(yearOf(today))), today, 'loan');
  noteLoan(g, p.id);
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
      if (!to) continue;
      const fee = year >= 1990 && rng() < 0.4 ? r5k(p.contract.transferValue * 0.08) : 0;
      const optionFee = year >= CLAUSE_FROM.loanOption && rng() < 0.35 ? r5k(p.contract.transferValue * 1.4) : 0;
      if (fee > Math.max(0, to.finances.transferBudget)) continue;
      lendPlayer(g, p, lender, to, today, { fee, optionFee });
      g.aiMarket?.news.push(`${lender.name} verleiht ${p.fullName} (${p.age}) an ${to.name}${optionFee ? ` – Kaufoption ${fmtPrice(optionFee)}` : ''}`);
      noteSquad(g, 'loans');
      k++; n++;
    }
  }
  if (n) repairSquadLists(g);
  return n;
}

// -----------------------------------------------------------------------------
// Anfragen an dich
// -----------------------------------------------------------------------------
export function aiLoanRequests(g: Game, today: string, rng: () => number = Math.random): void {
  if (!ASK_DAYS.has(today.slice(5)) || sim(g)) return;
  const own = g.clubs[g.managedClubId];
  if (!own || own.playerIds.length <= 20) return;
  if (g.messages.some((m) => m.eventRef?.type === ASK_TYPE && !m.eventRef.resolved)) return;
  const year = yearOf(today);
  if (rng() > 0.35 + 0.4 * loanEra(year)) return;
  for (const p of loanCandidates(g, own, today)) {
    const to = loanTaker(g, p, own);
    if (!to) continue;
    const optionFee = year >= CLAUSE_FROM.loanOption ? r5k(p.contract.transferValue * 1.5) : 0;
    const apps = p.seasonStats?.appearances ?? 0;
    const msg = makeMessage({
      date: today, category: 'transfer', from: 'Sportdirektor', relatedId: p.id,
      subject: `${to.name} möchte ${p.fullName} ausleihen`,
      shortText: `Für eine Saison – Spielpraxis statt Tribüne.`,
      bodyText: `${to.name} fragt an, ob wir ${p.fullName} (${p.naturalPosition}, ${p.age} J., Stärke ${p.overall}) bis zum 30. Juni ausleihen. `
        + `Bei uns kam er zuletzt auf ${apps} Einsätze; dort wäre er ${p.overall >= squadLevel11(squadOf(g, to)) - 2 ? 'Kandidat für die Startelf' : 'Herausforderer für die Startelf'}.\n\n`
        + `Der Leihverein übernimmt sein volles Gehalt. Spielpraxis beschleunigt seine Entwicklung; am Saisonende kehrt er zurück.`
        + (optionFee ? ` Auf Wunsch mit Kaufoption über ${fmtPrice(optionFee)} – zieht ${to.shortName} sie, ist er weg.` : '')
        + `\n\nOhne Antwort lehnen wir nach fünf Tagen ab.`,
      actionRequired: true,
    });
    msg.choices = [
      { id: 'leihen', label: 'Ausleihen', hint: 'ohne Kaufoption' },
      ...(optionFee ? [{ id: 'option', label: 'Mit Kaufoption', hint: fmtPrice(optionFee) }] : []),
      { id: 'nein', label: 'Ablehnen' },
    ];
    msg.eventRef = { type: ASK_TYPE, playerId: p.id, deadline: CalendarEngine.addDays(today, 5), defaultChoice: 'nein', data: { to: to.id, option: optionFee } };
    pushMessage(g.messages, msg);
    return;
  }
}

CHOICE_HANDLERS[ASK_TYPE] = (g, ref, choice) => {
  const p = ref.playerId ? g.players[ref.playerId] : undefined;
  const own = g.clubs[g.managedClubId];
  const to = g.clubs[String(ref.data?.to ?? '')];
  if (choice === 'nein') return { text: `${to?.shortName ?? 'Der Verein'} sucht sich eine andere Lösung.` };
  if (!p || !own || !to || p.clubId !== own.id || p.loan) return { text: 'Die Leihe ist nicht mehr möglich.' };
  const optionFee = choice === 'option' ? Number(ref.data?.option ?? 0) : 0;
  lendPlayer(g, p, own, to, g.calendar.currentDate, { optionFee });
  noteSquad(g, 'loansFromYou');
  repairSquadLists(g);
  return { text: `${p.fullName} spielt bis zum 30. Juni für ${to.name}${optionFee ? ` (Kaufoption ${fmtPrice(optionFee)})` : ''}.` };
};

// -----------------------------------------------------------------------------
// Saisonende: Rückkehr oder Kaufoption
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
    const level = squadLevel11(squadOf(g, holder));
    const wants = !loan.noOption && loan.optionFee > 0 && p.overall >= level - 6 && holder.finances.balance > 0 && rng() < 0.6;
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
  aiLoanRequests(g, today, rng);
  if (today.slice(5) === '06-30') aiLoansSeasonEnd(g, today, rng);
}

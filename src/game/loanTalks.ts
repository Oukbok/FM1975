// =============================================================================
// AUSLEIHEN — du leihst einen Spieler eines anderen Vereins aus (Wunsch Pascal)
// -----------------------------------------------------------------------------
// Einstieg „Leihe anfragen“ (Spielerprofil, Rechtsklick, Transfers › Leihen) →
// Verhandlungstisch (screens/negotiation/LoanTalk.tsx). Ablauf:
//   1. Verein: Laufzeit, Leihgebühr, Gehaltsanteil, je nach Epoche Kaufoption,
//      Kaufpflicht, Einsatzgarantie, Rückrufklausel, Einsatz gegen den Stammverein,
//      Weiterverleihung. Der Stammverein bewertet das Paket (engine/loanDeal.ts) und
//      besteht bei Talenten, die bei dir nicht Stammspieler wären, auf einer
//      Einsatzgarantie. Leistungsträger und Stammspieler verleiht er nicht.
//   2. Spieler: Er stimmt zu, wenn er bei dir spielt (oder Einsätze garantiert sind).
//   3. Abschluss: im Transferfenster sofort, sonst zum nächsten Fenster.
// Optionales Feld `game.loanTalks`.
// =============================================================================
import type { Club, Player } from '../types';
import { CalendarEngine } from '../engine/calendar';
import { hasTransferBan } from '../engine/clubEconomy';
import { yearOf } from '../engine/economy';
import {
  expectedRole, type LenderStance, lenderAnswer, lenderCounter, lenderStance, lenderValue, type LoanTerms, loanMonths, playerConsent, r5k, ROLE_DE, type SquadRole,
} from '../engine/loanDeal';
import { hash01 } from '../engine/transferMarket';
import { makeMessage, pushMessage } from '../engine/messages';
import { fmtPrice, fmtWage } from '../ui/format';
import { wageLimitFactor } from './budgetPlan';
import { isAiClub } from './aiClubs';
import { loanLimitBlocker, loanRulesNow, makeLoan, seasonEndOf } from './loanLife';
import { registrationBlocker } from './registrationGame';
import type { Game } from './state';
import { inTransferWindow } from './transferTalks';

export interface LoanTalk {
  id: string;
  playerId: string;
  lenderId: string;
  started: string;
  lastAction: string;
  phase: 'club' | 'agreed' | 'done' | 'failed';
  round: number;
  patience: number;
  patience0: number;
  /** Aktuelle Forderung als Wert (1975-Basis) und die erste. */
  ask: number;
  ask0: number;
  /** Gegenvorschlag des Stammvereins aus der letzten Runde. */
  counter?: LoanTerms;
  /** Vereinbarte Bedingungen. */
  terms?: LoanTerms;
  /** Verlauf je Runde: [Wert deines Angebots, seine Forderung danach]. */
  hist: [number, number][];
  /** Antwort des Spielers (nach der Einigung mit dem Verein). */
  playerNote?: string;
  endNote?: string;
  log: { date: string; who: 'du' | 'verein' | 'spieler' | 'info'; text: string }[];
}

const sq = (g: Game, c: Club) => c.playerIds.map((id) => g.players[id]).filter((x): x is Player => !!x);

export const loanTalksOf = (g: Game): LoanTalk[] => (g.loanTalks ??= []);
export const activeLoanTalks = (g: Game) => loanTalksOf(g).filter((t) => t.phase === 'club' || t.phase === 'agreed');
export const loanTalkFor = (g: Game, pid: string) => activeLoanTalks(g).find((t) => t.playerId === pid);

function say(t: LoanTalk, date: string, who: LoanTalk['log'][number]['who'], text: string): void {
  t.log.push({ date, who, text });
  if (t.log.length > 30) t.log.splice(0, t.log.length - 30);
  t.lastAction = date;
}

/** Kann dieser Spieler ausgeliehen werden? Grund, falls nicht. */
export function loanTalkBlocker(g: Game, p: Player): string | null {
  const own = g.clubs[g.managedClubId];
  if (p.clubId === g.managedClubId) return 'Er spielt bereits bei dir.';
  if (p.isYouth) return 'Jugendspieler kannst du nicht ausleihen.';
  const lender = g.clubs[p.clubId];
  if (!lender || !isAiClub(g, lender)) return 'Leihen gibt es nur mit Vereinen, deren Kader voll simuliert wird.';
  if (!g.ddrHome && p.clubId.startsWith('ddr') && yearOf(g.calendar.currentDate) < 1990) return 'Spieler aus der DDR-Oberliga dürfen nicht in den Westen wechseln.';
  if (p.contract.preContractClubId) return 'Er hat schon bei einem anderen Verein unterschrieben.';
  if (hasTransferBan(own, g.season)) return 'Transfersperre (Lizenzauflage).';
  const reg = registrationBlocker(g, p);
  if (reg) return reg;
  return loanLimitBlocker(g, p, lender, own);
}

/** Alles, was der Tisch über das Gespräch wissen muss. */
export function loanCtx(g: Game, t: LoanTalk): { p: Player; lender: Club; own: Club; role: SquadRole; rank: number; st: LenderStance; months: (u: string) => number } | null {
  const p = g.players[t.playerId];
  const lender = g.clubs[t.lenderId];
  const own = g.clubs[g.managedClubId];
  if (!p || !lender || !own) return null;
  const today = g.calendar.currentDate;
  const squadL = (p.clubId === lender.id ? sq(g, lender) : [...sq(g, lender), p]).sort((a, b) => b.overall - a.overall);
  const rank = squadL.findIndex((x) => x.id === p.id);
  const role = expectedRole(p, sq(g, own));
  const r = loanRulesNow(g);
  const st = lenderStance(p, {
    year: r.year, rank, role, lenderRep: lender.reputation ?? 60, borrowerRep: own.reputation ?? 60, broke: lender.finances.balance < 0,
    frequency: r.frequency, months: loanMonths(today, seasonEndOf(today)), seed: hash01(`${p.id}|${lender.id}|loan`),
  });
  return { p, lender, own, role, rank, st, months: (u) => loanMonths(today, u) };
}

/** Bedingungen, die der Stammverein voraussetzt (Regeln der Epoche + Talente müssen spielen). */
export function lenderMust(g: Game, t: LoanTalk): Partial<LoanTerms> {
  const c = loanCtx(g, t);
  const r = loanRulesNow(g);
  const must: Partial<LoanTerms> = {};
  if (r.sublet === 'banned') must.noSublet = true;
  if (r.parentPlay === 'banned') must.noParent = true;
  if (c?.st.wantsMinutes && c.role !== 'start' && r.clauses.minApps) {
    must.minApps = c.role === 'bench' ? 20 : 15;
    must.penalty = r5k(Math.max(10000, c.p.contract.transferValue * 0.06));
  }
  return must;
}

/** Erstes Angebot am Tisch (bewusst knapp unter seinem Wunsch). */
export function draftTerms(g: Game, t: LoanTalk): LoanTerms {
  const c = loanCtx(g, t);
  const today = g.calendar.currentDate;
  const share = c ? Math.max(0.25, Math.round((c.st.wish.share - 0.25) * 4) / 4) : 0.75;
  return { until: seasonEndOf(today), fee: 0, share, ...lenderMust(g, t), recall: undefined };
}

export function startLoanTalk(g: Game, pid: string): LoanTalk | string {
  const running = loanTalkFor(g, pid);
  if (running) return running;
  const p = g.players[pid];
  if (!p) return 'Spieler nicht gefunden.';
  const block = loanTalkBlocker(g, p);
  if (block) return block;
  const today = g.calendar.currentDate;
  const t: LoanTalk = {
    id: `lt_${pid}_${today}`, playerId: pid, lenderId: p.clubId, started: today, lastAction: today, phase: 'club',
    round: 0, patience: 0, patience0: 0, ask: 0, ask0: 0, hist: [], log: [],
  };
  const c = loanCtx(g, t)!;
  if (c.st.refuse) return `${c.lender.shortName ?? c.lender.name}: ${c.st.refuse}`;
  t.patience = t.patience0 = c.st.patience;
  t.ask = t.ask0 = c.st.ask;
  const r = loanRulesNow(g);
  say(t, today, 'info', `${p.fullName} wäre bei dir ${ROLE_DE[c.role]}. ${r.frequency < 0.5 ? 'Leihen sind in dieser Zeit unüblich – rechne mit Zurückhaltung.' : 'Dein Sportdirektor rechnet mit Gesprächsbereitschaft.'}`);
  if (c.st.wantsMinutes) say(t, today, 'verein', c.role === 'start' ? 'Er braucht Spielpraxis – bei euch bekäme er sie.' : r.clauses.minApps ? 'Er soll spielen. Ohne Einsatzgarantie geben wir ihn nicht her.' : 'Er soll bei euch spielen, nicht auf der Bank sitzen.');
  loanTalksOf(g).push(t);
  return t;
}

/** Wert deines Pakets für den Stammverein. */
export function loanOfferValue(g: Game, t: LoanTalk, terms: LoanTerms): number {
  const c = loanCtx(g, t);
  if (!c) return 0;
  const st = { ...c.st, wageCost: c.p.contract.weeklyWage * 52 * c.months(terms.until) / 12 };
  return lenderValue(terms, c.p, st, c.role);
}

/** Prüft das Paket gegen Epoche, Budget und Gehaltsrahmen. */
function checkTerms(g: Game, t: LoanTalk, terms: LoanTerms): string | null {
  const r = loanRulesNow(g);
  const today = g.calendar.currentDate;
  const own = g.clubs[g.managedClubId];
  const p = g.players[t.playerId];
  if (terms.until <= today) return 'Das Leihende liegt in der Vergangenheit.';
  if (terms.until > seasonEndOf(today) && r.maxSeasons < 2) return r.year >= 2022 ? 'Leihen dauern höchstens ein Jahr (FIFA).' : 'Leihen über zwei Spielzeiten sind in dieser Zeit unüblich.';
  if (terms.optionFee && !r.clauses.option) return 'Kaufoptionen gibt es erst ab 2000.';
  if (terms.obligation && !r.clauses.obligation) return 'Eine Kaufpflicht ist erst ab 2010 üblich.';
  if (terms.minApps && !r.clauses.minApps) return 'Einsatzgarantien gibt es erst ab 2000.';
  if (terms.recall && !r.clauses.recall) return 'Rückrufklauseln gibt es erst ab 1995.';
  if (terms.optionFee && terms.obligation) return 'Kaufoption und Kaufpflicht schließen sich aus.';
  if (terms.fee > own.finances.transferBudget) return `Der Vorstand gibt ${fmtPrice(terms.fee)} nicht frei: Dein Transferbudget beträgt ${fmtPrice(own.finances.transferBudget)}.`;
  const wages = own.playerIds.reduce((s, id) => s + (g.players[id]?.contract.weeklyWage ?? 0), 0) + p.contract.weeklyWage * terms.share;
  const wf = wageLimitFactor(g);
  if (own.finances.wageBudget > 0 && wages > own.finances.wageBudget * wf) return `Der Vorstand gibt ${fmtWage(p.contract.weeklyWage * terms.share)} nicht frei: Die Gehälter lägen bei ${Math.round((wages / own.finances.wageBudget) * 100)} % des Gehaltsbudgets.`;
  return null;
}

/** Angebot an den Stammverein. Rückgabe: Antworttext bzw. Grund, warum es nicht abgeschickt wurde. */
export function loanOffer(g: Game, id: string, terms: LoanTerms): string {
  const t = loanTalksOf(g).find((x) => x.id === id);
  if (!t || t.phase !== 'club') return 'Kein offenes Gespräch.';
  const today = g.calendar.currentDate;
  const c = loanCtx(g, t);
  if (!c || c.p.clubId !== t.lenderId) { t.phase = 'failed'; t.endNote = 'Der Spieler ist nicht mehr verfügbar.'; return t.endNote; }
  const bad = checkTerms(g, t, terms) ?? loanTalkBlocker(g, c.p);
  if (bad) { t.log.push({ date: today, who: 'info', text: `Nicht abgeschickt: ${bad}` }); return bad; }
  t.round++;
  const value = loanOfferValue(g, t, terms);
  say(t, today, 'du', `Angebot: bis ${CalendarEngine.formatDate(terms.until)}, ${Math.round(terms.share * 100)} % Gehalt, ${terms.fee ? `${fmtPrice(terms.fee)} Leihgebühr` : 'keine Leihgebühr'}${terms.optionFee ? `, Kaufoption ${fmtPrice(terms.optionFee)}` : ''}${terms.obligation ? `, Kaufpflicht ${fmtPrice(terms.obligation.fee)}` : ''}${terms.minApps ? `, ${terms.minApps} Einsätze garantiert` : ''}.`);
  const must = lenderMust(g, t);
  // Forderung und Schmerzgrenze gelten für eine Leihe bis Saisonende – kürzere/längere Laufzeiten anteilig.
  const k = c.months(terms.until) / c.months(seasonEndOf(today));
  const st = { ...c.st, wageCost: c.p.contract.weeklyWage * 52 * c.months(terms.until) / 12, ask: c.st.ask * k, walkaway: c.st.walkaway * k };
  // Seine Bedingungen lassen sich nicht wegverhandeln.
  const missing = (must.minApps && (terms.minApps ?? 0) < must.minApps) || (must.noSublet && !terms.noSublet) || (must.noParent && !terms.noParent);
  if (missing) {
    t.patience -= 6;
    t.counter = lenderCounter(terms, c.p, st, c.role, t.ask * k, must);
    t.hist.push([Math.round(value), Math.round(t.ask * k)]);
    const text = must.minApps && (terms.minApps ?? 0) < must.minApps ? `Ohne Einsatzgarantie über ${must.minApps} Pflichtspiele geht es nicht – er soll spielen, nicht zuschauen.` : 'Die Regeln sind klar: Weiterverleihen ist ausgeschlossen, und er spielt nicht gegen uns.';
    say(t, today, 'verein', text);
    if (t.patience <= 0) { t.phase = 'failed'; t.endNote = `${c.lender.shortName ?? c.lender.name} hat das Interesse verloren.`; }
    return text;
  }
  const ans = lenderAnswer(st, t.ask * k, value, t.round, t.patience, hash01(`${t.id}|${t.round}|${terms.fee}|${terms.share}`));
  if (ans.kind === 'accept') {
    t.hist.push([Math.round(value), Math.round(value)]);
    say(t, today, 'verein', ans.text);
    const pc = playerConsent(c.p, c.role, c.rank, terms, c.own.reputation ?? 60, c.lender.reputation ?? 60);
    t.playerNote = pc.text;
    say(t, today, 'spieler', pc.text);
    if (!pc.ok) { t.phase = 'failed'; t.endNote = pc.text; t.terms = terms; return pc.text; }
    t.terms = terms;
    t.phase = 'agreed';
    t.counter = undefined;
    if (inTransferWindow(today)) return `${ans.text} ${completeLoanTalk(g, t)}`;
    say(t, today, 'info', 'Einigung erzielt. Die Leihe beginnt mit dem nächsten Transferfenster.');
    return `${ans.text} Die Leihe beginnt mit dem nächsten Transferfenster.`;
  }
  if (ans.kind === 'breakoff') {
    t.phase = 'failed'; t.endNote = `${c.lender.shortName ?? c.lender.name} hat die Geduld verloren.`;
    t.hist.push([Math.round(value), Math.round(t.ask * k)]);
    say(t, today, 'verein', ans.text);
    return ans.text;
  }
  t.patience -= ans.loss;
  t.ask = ans.ask / k;
  t.hist.push([Math.round(value), Math.round(ans.ask)]);
  t.counter = lenderCounter(terms, c.p, st, c.role, ans.ask, must);
  say(t, today, 'verein', `${ans.text} Unser Vorschlag: ${Math.round(t.counter.share * 100)} % Gehalt${t.counter.fee ? `, ${fmtPrice(t.counter.fee)} Leihgebühr` : ''}.`);
  return ans.text;
}

export function cancelLoanTalk(g: Game, id: string): void {
  const t = loanTalksOf(g).find((x) => x.id === id);
  if (t && (t.phase === 'club' || t.phase === 'agreed')) { t.phase = 'failed'; t.endNote = 'Du hast die Verhandlung beendet.'; say(t, g.calendar.currentDate, 'info', t.endNote); }
}

/** Leihe vollziehen (im Fenster). */
export function completeLoanTalk(g: Game, t: LoanTalk): string {
  const today = g.calendar.currentDate;
  const p = g.players[t.playerId], lender = g.clubs[t.lenderId], own = g.clubs[g.managedClubId];
  const block = p && lender ? (p.clubId !== lender.id ? 'Er spielt nicht mehr dort.' : loanLimitBlocker(g, p, lender, own)) : 'Der Spieler ist nicht mehr verfügbar.';
  if (!p || !lender || !t.terms || block) { t.phase = 'failed'; t.endNote = `Die Leihe ist geplatzt: ${block}`; say(t, today, 'info', t.endNote); return t.endNote; }
  // Laufzeit, die beim Vollzug schon begonnen hat, rückt auf das nächste Saisonende.
  const terms = t.terms.until <= today ? { ...t.terms, until: seasonEndOf(today) } : t.terms;
  makeLoan(g, p, lender, own, today, terms);
  t.phase = 'done';
  const text = `${p.fullName} spielt bis ${CalendarEngine.formatDate(terms.until)} auf Leihbasis für dich.`;
  say(t, today, 'info', text);
  pushMessage(g.messages, makeMessage({
    date: today, category: 'transfer', from: 'Sportdirektor', relatedId: p.id, subject: `Leihe perfekt: ${p.fullName}`, shortText: text,
    bodyText: `${text} Er kommt von ${lender.name}; sein Vertrag dort läuft weiter. Du trägst ${Math.round(terms.share * 100)} % seines Gehalts (${fmtWage(p.contract.weeklyWage * terms.share)}).${terms.minApps ? ` Zugesagt sind ${terms.minApps} Pflichtspiele – sonst ${fmtPrice(terms.penalty ?? 0)} Strafzahlung.` : ''}${terms.noParent ? ` Gegen ${lender.shortName ?? lender.name} darf er nicht spielen.` : ''}`,
  }));
  return text;
}

/** Täglich: Einigungen im Fenster vollziehen, eingeschlafene Gespräche schließen, alte entfernen. */
export function loanTalksDaily(g: Game, today: string): void {
  const talks = g.loanTalks;
  if (!talks?.length) return;
  for (const t of talks) {
    if (t.phase === 'agreed' && inTransferWindow(today)) completeLoanTalk(g, t);
    else if (t.phase === 'club' && CalendarEngine.addDays(t.lastAction, 30) < today) { t.phase = 'failed'; t.endNote = 'Ohne neue Angebote ist die Verhandlung eingeschlafen.'; say(t, today, 'info', t.endNote); }
  }
  g.loanTalks = talks.filter((t) => t.phase === 'club' || t.phase === 'agreed' || CalendarEngine.addDays(t.lastAction, 60) >= today);
}

/** Was deine Position stärkt (+) oder schwächt (−). */
export function loanLevers(g: Game, t: LoanTalk): { text: string; side: 1 | -1; w: number }[] {
  const c = loanCtx(g, t);
  if (!c) return [];
  const out: { text: string; side: 1 | -1; w: number }[] = [];
  if (c.rank >= 16) out.push({ text: 'Bei seinem Verein nur Reservist', side: 1, w: 2 });
  else if (c.rank >= 11) out.push({ text: 'Bei seinem Verein Ergänzungsspieler', side: 1, w: 1 });
  else out.push({ text: 'Bei seinem Verein fest eingeplant', side: -1, w: 2 });
  if (c.role === 'start') out.push({ text: 'Bei dir wäre er Stammspieler', side: 1, w: 2 });
  else if (c.role === 'bench') out.push({ text: 'Bei dir säße er meist auf der Bank', side: -1, w: 3 });
  if (c.st.wantsMinutes) out.push({ text: 'Er braucht Spielpraxis', side: 1, w: 1 });
  if (c.st.keeper) out.push({ text: 'Großes Talent – sein Verein plant mit ihm', side: -1, w: 2 });
  if (c.lender.finances.balance < 0) out.push({ text: `${c.lender.shortName ?? c.lender.name} braucht Geld`, side: 1, w: 1 });
  const r = loanRulesNow(g);
  if (r.frequency < 0.5) out.push({ text: 'Leihen sind in dieser Zeit unüblich', side: -1, w: 2 });
  out.push(c.st.hardness >= 0.66 ? { text: 'Harter Verhandlungspartner', side: -1, w: 1 } : c.st.hardness <= 0.33 ? { text: 'Umgänglicher Verhandlungspartner', side: 1, w: 1 } : { text: 'Sachlicher Verhandlungspartner', side: 1, w: 0 });
  return out;
}

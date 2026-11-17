// =============================================================================
// VERLEIHEN — eigene Spieler an andere Vereine (Wunsch Pascal)
// -----------------------------------------------------------------------------
// • „Zur Leihe anbieten“ (`Player.loanListed`, Spielerprofil/Rechtsklick/Seite
//   Transfers › Leihen): Im Transferfenster melden sich KI-Vereine mit Bedarf auf
//   seiner Position, bei denen er spielen würde, montags und donnerstags mit einem
//   Leihangebot (Laufzeit, Gebühr, Gehaltsanteil, je nach Epoche Kaufoption/Kaufpflicht,
//   Einsatzgarantie, Rückrufklausel).
// • Auch ohne Angebot fragen Vereine nach jungen Ergänzungsspielern (25.7., 17.1.).
// • Antwort in der Nachricht oder unter Transfers › Leihen › Angebote: Annehmen,
//   Bessere Bedingungen fordern (volles Gehalt + Leihgebühr; die KI geht mit oder
//   springt ab), Ablehnen. Frist fünf Tage.
// Nachrichten-Typ `ai_loan_request` (alte Anfragen ohne Bedingungen bleiben gültig).
// =============================================================================
import type { Club, Player } from '../types';
import { assessSquad, GROUP_OF, targetStrength } from '../engine/aiManager';
import { CalendarEngine } from '../engine/calendar';
import { yearOf } from '../engine/economy';
import { aiLoanBid, expectedRole, type LoanTerms, loanMonths, r5k, ROLE_DE, termsLines } from '../engine/loanDeal';
import { makeMessage, pushMessage } from '../engine/messages';
import { fmtPrice, fmtWage } from '../ui/format';
import { isAiClub, squadOf } from './aiClubs';
import { borrowedBy, loanCandidates, MAX_BORROWED } from './aiLoans';
import { noteSquad } from './aiSquadLog';
import { CHOICE_HANDLERS } from './eventsGame';
import { inTransferWindow } from './transferTalks';
import { loanLimitBlocker, loanRulesNow, makeLoan, seasonEndOf } from './loanLife';
import { repairSquadLists } from './squads';
import type { Game } from './state';

export const LOAN_ASK_TYPE = 'ai_loan_request';
const ASK_DAYS = new Set(['07-25', '01-17']);
const sim = (g: Game) => !!(g as { simAutoManage?: boolean }).simAutoManage;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const dateDe = (iso: string) => CalendarEngine.formatDate(iso);

/** Spieler zur Leihe anbieten bzw. zurückziehen. */
export function toggleLoanListed(g: Game, pid: string): string | null {
  const p = g.players[pid];
  if (!p || p.clubId !== g.managedClubId) return 'Nur Spieler deines Kaders.';
  if (p.isYouth) return 'Jugendspieler kannst du nicht verleihen.';
  if (p.loan) return 'Er ist selbst nur ausgeliehen.';
  p.loanListed = p.loanListed ? undefined : true;
  return null;
}

/** Verein mit Bedarf, bei dem der Spieler spielen würde (Leihe ist sonst für ihn uninteressant). */
export function loanTakerFor(g: Game, p: Player, lender: Club, relaxed: boolean, rnd: () => number = Math.random): Club | null {
  const group = GROUP_OF[p.naturalPosition];
  const opts: { c: Club; s: number }[] = [];
  for (const c of Object.values(g.clubs)) {
    if (c.id === lender.id || !isAiClub(g, c) || c.playerIds.length >= 26 || borrowedBy(g, c) >= MAX_BORROWED) continue;
    if ((c.reputation ?? 60) > (lender.reputation ?? 60) + (relaxed ? 12 : -4)) continue;
    const squad = squadOf(g, c);
    if (expectedRole(p, squad) === 'bench') continue;
    const a = assessSquad(squad, c.tactics?.formation);
    const need = a.groups[group];
    if (p.overall < targetStrength(a, need).min - 3) continue;
    const s = need.score + (p.overall - a.level) * 0.5;
    if (s >= (relaxed ? 2 : 4) && !loanLimitBlocker(g, p, lender, c)) opts.push({ c, s });
  }
  if (!opts.length) return null;
  opts.sort((a, b) => b.s - a.s);
  return opts[Math.min(opts.length - 1, Math.floor(rnd() * Math.min(3, opts.length)))].c;
}

/** Angebot eines KI-Vereins für einen deiner Spieler (Bedingungen nach Epoche und Lage). */
export function aiBidFor(g: Game, p: Player, to: Club, today: string, rnd: () => number = Math.random): LoanTerms {
  const r = loanRulesNow(g);
  const half = Number(today.slice(5, 7)) >= 7 && r.year < 2022 && rnd() < 0.12;
  const two = r.maxSeasons === 2 && Number(today.slice(5, 7)) >= 7 && p.age <= 21 && rnd() < 0.15;
  const end = seasonEndOf(today);
  const until = half ? `${yearOf(today)}-12-31` : two ? `${Number(end.slice(0, 4)) + 1}-06-30` : end;
  const own = g.clubs[g.managedClubId];
  const rich = clamp(((to.reputation ?? 60) - (own?.reputation ?? 60) + 20) / 40, 0, 1);
  const need = clamp(assessSquad(squadOf(g, to), to.tactics?.formation).groups[GROUP_OF[p.naturalPosition]].score / 10, 0, 1);
  return aiLoanBid(p, {
    year: r.year, until, months: loanMonths(today, until), rich, need, rnd, clauses: r.clauses, feeCommon: r.feeCommon,
    noParent: r.parentPlay === 'banned', noSublet: r.sublet === 'banned',
  });
}

const openFor = (g: Game, pid: string) => g.messages.some((m) => m.eventRef?.type === LOAN_ASK_TYPE && !m.eventRef.resolved && !m.resultText && m.eventRef.playerId === pid);

/** Nachricht mit Leihangebot schreiben. */
function postOffer(g: Game, p: Player, to: Club, t: LoanTerms, today: string, listed: boolean): void {
  const role = expectedRole(p, squadOf(g, to));
  const lines = termsLines(t, fmtPrice, dateDe, fmtWage(p.contract.weeklyWage * t.share));
  const msg = makeMessage({
    date: today, category: 'transfer', from: 'Sportdirektor', relatedId: p.id,
    subject: `${to.name} möchte ${p.fullName} ausleihen`,
    shortText: `Bis ${dateDe(t.until)}, ${Math.round(t.share * 100)} % Gehalt${t.fee ? `, ${fmtPrice(t.fee)} Leihgebühr` : ''}${t.optionFee ? `, Kaufoption ${fmtPrice(t.optionFee)}` : ''}${t.obligation ? `, Kaufpflicht ${fmtPrice(t.obligation.fee)}` : ''}.`,
    bodyText: `${listed ? `Auf deine Leihliste hin meldet sich ${to.name}.` : `${to.name} fragt an, ob wir ${p.fullName} ausleihen.`} ${p.fullName} (${p.naturalPosition}, ${p.age} J., Stärke ${Math.round(p.overall)}) wäre dort ${ROLE_DE[role]}.\n\n`
      + `Die Bedingungen:\n${lines.map((l) => `• ${l.k}: ${l.v}`).join('\n')}\n\n`
      + `Spielpraxis beschleunigt seine Entwicklung; sein Vertrag bei uns läuft weiter. Du kannst annehmen, bessere Bedingungen fordern (volles Gehalt und eine Leihgebühr – ${to.shortName ?? to.name} kann dann abspringen) oder ablehnen.\n\nOhne Antwort lehnen wir nach fünf Tagen ab.`,
    actionRequired: true,
  });
  msg.choices = [
    { id: 'leihen', label: 'Annehmen', hint: 'zu diesen Bedingungen' },
    ...(t.share < 1 || !t.fee ? [{ id: 'mehr', label: 'Bessere Bedingungen fordern', hint: 'volles Gehalt + Leihgebühr' }] : []),
    { id: 'nein', label: 'Ablehnen' },
  ];
  msg.eventRef = { type: LOAN_ASK_TYPE, playerId: p.id, deadline: CalendarEngine.addDays(today, 5), defaultChoice: 'nein', data: { to: to.id, option: t.optionFee ?? 0, terms: JSON.stringify(t) } };
  pushMessage(g.messages, msg);
}

/** Täglich: Angebote für deine Leihliste und Anfragen nach jungen Ergänzungsspielern. */
export function loanMarketDaily(g: Game, today: string, rng: () => number = Math.random): void {
  if (sim(g)) return;
  const own = g.clubs[g.managedClubId];
  if (!own) return;
  const md = today.slice(5);
  // Nur im Fenster und nicht in den letzten Tagen (die Frist muss im Fenster enden).
  if (!inTransferWindow(today) || md >= '08-26' || (md >= '01-26' && md <= '01-31')) return;
  const r = loanRulesNow(g);
  const open = g.messages.filter((m) => m.eventRef?.type === LOAN_ASK_TYPE && !m.eventRef.resolved && !m.resultText).length;
  if (open >= 3) return;
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay();
  if (dow === 1 || dow === 4) {
    for (const p of squadOf(g, own).filter((x) => x.loanListed && !x.loan && !openFor(g, x.id))) {
      if (rng() > 0.25 + 0.4 * r.frequency) continue;
      const to = loanTakerFor(g, p, own, true, rng);
      if (!to) continue;
      postOffer(g, p, to, aiBidFor(g, p, to, today, rng), today, true);
      return;
    }
  }
  if (!ASK_DAYS.has(md) || own.playerIds.length <= 20 || open) return;
  if (rng() > 0.35 + 0.4 * r.frequency) return;
  for (const p of loanCandidates(g, own, today)) {
    if (openFor(g, p.id)) continue;
    const to = loanTakerFor(g, p, own, false, rng);
    if (!to) continue;
    postOffer(g, p, to, aiBidFor(g, p, to, today, rng), today, false);
    return;
  }
}

/** Bedingungen aus der Nachricht (alte Anfragen: volle Gehaltsübernahme, ggf. Kaufoption). */
export function offerTerms(g: Game, data: Record<string, number | string> | undefined, today: string): LoanTerms {
  try { if (data?.terms) return JSON.parse(String(data.terms)) as LoanTerms; } catch { /* alte Anfrage */ }
  const option = Number(data?.option ?? 0);
  return { until: seasonEndOf(today), fee: 0, share: 1, optionFee: option || undefined };
}

CHOICE_HANDLERS[LOAN_ASK_TYPE] = (g, ref, choice) => {
  const p = ref.playerId ? g.players[ref.playerId] : undefined;
  const own = g.clubs[g.managedClubId];
  const to = g.clubs[String(ref.data?.to ?? '')];
  if (choice === 'nein') return { text: `${to?.shortName ?? 'Der Verein'} sucht sich eine andere Lösung.` };
  if (!p || !own || !to || p.clubId !== own.id || p.loan) return { text: 'Die Leihe ist nicht mehr möglich.' };
  const today = g.calendar.currentDate;
  let t = offerTerms(g, ref.data, today);
  if (choice === 'option') t = { ...t, optionFee: Number(ref.data?.option ?? 0) || t.optionFee }; // alte Nachrichten
  else if (choice === 'leihen' && !ref.data?.terms) t = { ...t, optionFee: undefined };
  const block = loanLimitBlocker(g, p, own, to);
  if (block) return { text: `Die Leihe ist nicht möglich: ${block}` };
  if (choice === 'mehr') {
    // Volles Gehalt und eine Leihgebühr: Wer den Spieler dringend braucht, geht mit.
    const need = clamp(assessSquad(squadOf(g, to), to.tactics?.formation).groups[GROUP_OF[p.naturalPosition]].score / 10, 0, 1);
    const fee = r5k(Math.max(t.fee * 1.5, p.contract.transferValue * 0.05, 5000));
    const accept = Math.random() < 0.3 + need * 0.4 && fee <= Math.max(0, to.finances.transferBudget);
    if (!accept) return { text: `${to.shortName ?? to.name} ist das zu teuer – die Anfrage ist vom Tisch.` };
    t = { ...t, share: 1, fee };
  }
  makeLoan(g, p, own, to, today, t);
  noteSquad(g, 'loansFromYou');
  repairSquadLists(g);
  return { text: `${p.fullName} spielt bis ${dateDe(t.until)} für ${to.name} (${Math.round(t.share * 100)} % Gehalt${t.fee ? `, ${fmtPrice(t.fee)} Leihgebühr` : ''}${t.optionFee ? `, Kaufoption ${fmtPrice(t.optionFee)}` : ''}).` };
};

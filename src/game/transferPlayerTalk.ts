// =============================================================================
// SPIELERGESPRÄCH BEIM TRANSFER — am Verhandlungstisch (Wunsch Pascal:
// Verhandlungen wie in großen Managern)
// -----------------------------------------------------------------------------
// Dieselbe Paketlogik wie bei der Vertragsverlängerung (engine/contract-
// Negotiation.ts): Der Spieler bewertet dein ganzes Paket, lehnt mit einem
// Gegenangebot ab, das ihm selbst reicht, verliert je nach Abstand Geduld und
// nennt, woran es hakt. Punkte, die du für „nicht verhandelbar“ erklärst, lässt
// er stehen und holt sich den Wert woanders.
// Unterschied zur Verlängerung: Wie sehr ihn dein Verein reizt, verschiebt seine
// Schwelle (bei großem Interesse unterschreibt er unter seinem fairen Paket, bei
// geringem nur mit Aufschlag) – abgestimmt auf die frühere Rechnung
// (`playerAnswer`, bleibt für Tests und die schnelle Fassung bestehen).
// Abschluss über game/transferTalks.ts `sealPlayerTerms`.
// =============================================================================
import type { ClauseKey } from '../data/contractClauses';
import { CLAUSE_BY_KEY } from '../data/contractClauses';
import { answer, buildDemand, ContractTerms, MAX_ROUNDS, packageValue } from '../engine/contractNegotiation';
import { personaOf } from '../engine/persona';
import { hash01, PlayerOffer } from '../engine/transferMarket';
import { wageLimitFactor } from './budgetPlan';
import { termsSummary } from './contractClausesGame';
import { lineOf, NegResult, sanitizeTerms } from './contractTalk';
import { transferCtx } from './contractView';
import { Game } from './state';
import { refuse, say, sealPlayerTerms, sellerOf, stanceFor } from './transferTalks';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Verschiebung seiner Schwelle durch das Interesse an deinem Verein (50 = neutral ≈ +7 %). */
export function interestBoost(interest: number): number {
  return clamp(0.0714 - 0.005 * (interest - 50), -0.12, 0.25);
}

/** Bausteine, die der alte Vertragsabschluss nicht kennt, als eigenes Paket (wird beim Wechsel in den Vertrag geschrieben). */
export function toPlayerOffer(terms: ContractTerms): PlayerOffer {
  return {
    wage: terms.wage, years: terms.years, signingFee: terms.signing, releaseClause: terms.release > 0, promises: terms.promises,
    loyaltyBonus: terms.loyalty || undefined, successRaise: terms.success || undefined, agentFee: terms.agent,
    releaseAmount: terms.release || undefined,
    extras: { appearance: terms.appearance, goal: terms.goal, cleanSheet: terms.cleanSheet, title: terms.title, stay: terms.stay, raise: terms.raise, option: terms.option, relegation: terms.relegation, fixedFee: terms.fixedFee },
  };
}

/** Vereinbartes Paket eines Transfers wieder als Vertragspunkte (Anzeige im Abschluss). */
export function termsFromOffer(o: PlayerOffer): ContractTerms {
  const x = o.extras;
  return {
    wage: o.wage, years: o.years, signing: o.signingFee, appearance: x?.appearance ?? 0, goal: x?.goal ?? 0, cleanSheet: x?.cleanSheet ?? 0,
    title: x?.title ?? 0, stay: x?.stay ?? 0, raise: x?.raise ?? 0, fixedFee: x?.fixedFee ?? 0, release: o.releaseAmount ?? 0, option: x?.option ?? 'none',
    relegation: x?.relegation ?? 0, promises: o.promises, agent: o.agentFee ?? 0, loyalty: o.loyaltyBonus ?? 0, success: o.successRaise ?? 0,
  };
}

/** Eine Runde des Spielergesprächs: Angebot abgeben. */
export function transferPlayerOffer(g: Game, talkId: string, raw: ContractTerms, locks: ClauseKey[] = []): NegResult {
  const t = (g.transferTalks ?? []).find((x) => x.id === talkId);
  if (!t || t.phase !== 'player') return { ok: false, done: true, text: 'Kein offenes Spielergespräch.' };
  const today = g.calendar.currentDate;
  const own = g.clubs[g.managedClubId];
  const p = g.players[t.playerId];
  if (!p || p.clubId !== t.sellerId) { t.phase = 'failed'; t.endNote = 'Der Spieler ist nicht mehr verfügbar.'; return { ok: false, done: true, text: 'Der Spieler ist nicht mehr verfügbar.' }; }
  const ctx = transferCtx(g, t, p);
  const d = buildDemand(p, ctx);
  const terms = sanitizeTerms(raw, d);
  const no = (text: string): NegResult => ({ ok: false, done: false, refused: true, text: refuse(t, today, text) });
  // Vorstandsgrenzen wie bisher: Gehaltsbudget hart, Einmalzahlungen gegen das Transferbudget (nach der Ablöse).
  const wages = own.playerIds.reduce((s, id) => s + (g.players[id]?.contract.weeklyWage ?? 0), 0) + terms.wage;
  const wf = wageLimitFactor(g);
  if (own.finances.wageBudget > 0 && wages > own.finances.wageBudget * wf) {
    return no(`Der Vorstand gibt das Gehalt nicht frei: Die Gehälter lägen bei ${Math.round((wages / own.finances.wageBudget) * 100)} % des Gehaltsbudgets (Grenze ${Math.round(wf * 100)} %).${wf < 1.15 ? ' Mehr Spielraum schaffst du unter Finanzen › Budget.' : ''}`);
  }
  const fee = t.pkg ? t.pkg.fee / (t.pkg.installments ? (t.pkg.rates ?? 2) : 1) : 0;
  if (terms.signing + terms.agent > own.finances.transferBudget - fee) return no('Für Handgeld und Provision reicht das Transferbudget nicht.');

  const st = stanceFor(g, t);
  const pe = personaOf(p);
  const voice = ctx.agent ? 'berater' : 'spieler';
  const seed = `${t.id}|p${t.pRound + 1}`;
  t.pRound += 1;
  say(t, today, 'du', `Angebot: ${termsSummary(terms)}.`);
  const open0 = packageValue(d.ask, d, ctx);
  const worth = packageValue(terms, d, ctx);
  const fail = (note: string, line: string): NegResult => {
    t.phase = 'failed';
    t.endNote = note;
    say(t, today, 'spieler', line);
    return { ok: false, done: true, text: note };
  };
  if (st.dealBreaker) {
    (t.pHist ??= []).push([worth, open0]);
    return fail(`${p.lastName} lehnt einen Wechsel ab: ${st.dealBreaker}`, `${p.lastName} lehnt ab. ${st.dealBreaker}`);
  }
  if (st.interest < 25 && !(worth / Math.max(1, d.reservation) >= 1.35 && pe.geld >= 60)) {
    t.pPatience -= 34;
    (t.pHist ??= []).push([worth, packageValue(t.pAsk ?? d.ask, d, ctx)]);
    say(t, today, 'spieler', `${p.lastName} hat kein Interesse an einem Wechsel zu euch. Ein Verein wie eurer reizt ihn nicht – höchstens sehr viel Geld könnte ihn umstimmen.`);
    if (t.pPatience <= 0) return fail(`${p.lastName} reizt ein Wechsel zu euch nicht – er bleibt bei ${sellerOf(g, t.sellerId)?.name ?? 'seinem Verein'}.`, `${p.lastName} beendet die Gespräche.`);
    return { ok: false, done: false, text: `${p.lastName} hat kein Interesse an einem Wechsel zu euch.` };
  }
  const ans = answer(terms, d, ctx, t.pAsk ?? d.ask, t.pRound, interestBoost(st.interest), locks);
  if (ans.accepted) {
    (t.pHist ??= []).push([worth, worth]);
    say(t, today, voice, lineOf(g, p, 'accept', seed, {}, ctx.agent) || `${p.lastName} sagt zu.`);
    const text = sealPlayerTerms(g, t, toPlayerOffer(terms));
    return { ok: true, done: true, text };
  }
  t.pPatience -= ans.patienceLoss;
  say(t, today, voice, lineOf(g, p, ans.kind, seed, {}, ctx.agent) || `${p.lastName} lehnt ab.`);
  (t.pHist ??= []).push([worth, ans.counter ? packageValue(ans.counter, d, ctx) : packageValue(t.pAsk ?? d.ask, d, ctx)]);
  if (t.pPatience <= 0 || t.pRound >= MAX_ROUNDS) {
    const line = lineOf(g, p, 'breakoff', seed + 'b', {}, ctx.agent) || `${p.lastName} hat genug.`;
    return fail(t.pPatience <= 0 ? `${p.lastName} hat die Geduld verloren und bleibt bei ${sellerOf(g, t.sellerId)?.name ?? 'seinem Verein'}.` : `Nach ${MAX_ROUNDS} Runden ohne Einigung beendet ${p.lastName} die Gespräche.`, line);
  }
  if (ans.focus) {
    const years = d.range[0] === d.range[1] ? `genau ${d.range[0]} Jahr${d.range[0] > 1 ? 'e' : ''}` : `${d.range[0]} bis ${d.range[1]} Jahre`;
    const f = lineOf(g, p, `focus_${ans.focus}`, seed + 'f', { years, focus: CLAUSE_BY_KEY[ans.focus].label }, ctx.agent && ans.focus === 'agent');
    if (f) say(t, today, ans.focus === 'agent' ? 'berater' : 'spieler', f);
  }
  if (ans.counter) {
    t.pAsk = ans.counter;
    const cheap = (['signing', 'appearance', 'loyalty'] as const).find((k) => d.keys.includes(k) && (k === 'signing' ? d.k.sign >= 1.1 : k === 'appearance' ? d.k.bonus >= 1 : d.k.loyal >= 0.75));
    if (cheap && hash01(seed + 'pk') < 0.5) { const l = lineOf(g, p, 'package', seed + 'p', { focus: CLAUSE_BY_KEY[cheap].label }, ctx.agent); if (l) say(t, today, voice, l); }
    say(t, today, voice, lineOf(g, p, 'counter', seed + 'k', { x: termsSummary(ans.counter) }, ctx.agent) || `So würde ich es machen: ${termsSummary(ans.counter)}.`);
  }
  return { ok: false, done: false, text: t.log[t.log.length - 1]?.text ?? '' };
}

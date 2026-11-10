// =============================================================================
// VERHANDLUNGSTISCH — Anzeigedaten für screens/contract/ (Verlängerung und
// Spielergespräch beim Transfer). Beide Wege liefern dieselbe Form (`NegView`),
// damit der Bildschirm nicht wissen muss, woher die Forderung kommt.
// • Verlängerung: game/contractTalk.ts (Runden, Gegenangebote, Geduld).
// • Transfer: Antwort weiter über game/transferTalks.ts `playerOffer` (Balance
//   der Transfers unverändert); neue Bausteine (Prämien, Staffelung, Option,
//   Abstiegsklausel, festgeschriebene Ablöse) fließen als Gegenwert
//   `extrasWeekly` ein und werden beim Wechsel in den Vertrag geschrieben.
// =============================================================================
import type { ClauseKey } from '../data/contractClauses';
import {
  buildDemand, ContractTerms, MAX_ROUNDS, NegCtx, NegDemand, packageValue,
} from '../engine/contractNegotiation';
import { yearOf } from '../engine/economy';
import { PlayerOffer } from '../engine/transferMarket';
import { Player } from '../types';
import { calcAgeRank } from './contractCtx';
import { termsOfContract } from './contractClausesGame';
import { agentLabel, NegResult, renewalState, sanitizeTerms, submitRenewal } from './contractTalk';
import { trustOf } from './promises';
import { Game } from './state';
import { playerOffer, scoutKnowledge, sellerOf, stanceFor, TransferTalk } from './transferTalks';

export type LogWho = 'du' | 'spieler' | 'berater' | 'info' | 'verein';

export interface NegView {
  mode: 'renew' | 'transfer';
  pid: string;
  talkId?: string;
  status: 'open' | 'agreed' | 'failed' | 'blocked';
  blocked?: string;
  d: NegDemand | null;
  ctx: NegCtx | null;
  /** Aktuelle Forderung (Verlängerung: nach Gegenangeboten). */
  ask: ContractTerms | null;
  /** Vorbelegung deines Angebots. */
  start: ContractTerms | null;
  patience: number;
  startPatience: number;
  round: number;
  maxRounds: number;
  log: { d: string; who: LogWho; text: string }[];
  agent: string;
  /** Kopfzeile, z. B. „Verlängerung“ oder „Wechsel von X“. */
  context: string;
  /** Kennt er schon seine Wünsche genau? (Transfer: Scouting/Runde) */
  known: boolean;
}

const r100 = (x: number) => Math.round(x / 100) * 100;

export function renewView(g: Game, pid: string): NegView {
  const p = g.players[pid];
  const year = yearOf(g.calendar.currentDate);
  const s = renewalState(g, pid);
  const st = s.st;
  const start = s.d && p ? { ...termsOfContract(p, s.d.ideal), promises: [] } : null;
  const status: NegView['status'] = st?.status === 'agreed' ? 'agreed' : s.blocked ? 'blocked' : st?.status ?? 'open';
  return {
    mode: 'renew', pid, status, blocked: s.blocked ?? undefined, d: s.d, ctx: s.ctx, ask: st?.ask ?? null, start,
    patience: Math.max(0, st?.patience ?? 0), startPatience: st?.start ?? 100, round: st?.round ?? 0, maxRounds: MAX_ROUNDS,
    log: st?.log ?? [], agent: agentLabel(year), context: 'Vertragsverlängerung', known: true,
  };
}

/** Lage des Spielergesprächs beim Transfer (Forderung aus seiner Haltung). */
export function transferCtx(g: Game, t: TransferTalk, p: Player): NegCtx {
  const own = g.clubs[g.managedClubId];
  const st = stanceFor(g, t);
  const r = calcAgeRank(g, p, own);
  return {
    year: yearOf(g.calendar.currentDate), mode: 'transfer', fairWage: st.minWage, askWage: st.agentWage, fairSigning: st.signingFee,
    agent: st.agent, agentFee: st.agentFee, yearsRange: st.years, ...r.expect, marketValue: p.contract.transferValue,
    promiseWeights: st.priorities, trust: trustOf(g), starter: r.starter, keeperOrDef: r.keeperOrDef, attacker: r.attacker,
    moodFactor: 1, startPatience: 100, seed: `${t.id}`,
  };
}

export function transferViewOf(g: Game, talkId: string): NegView | null {
  const t = (g.transferTalks ?? []).find((x) => x.id === talkId);
  const p = t ? g.players[t.playerId] : undefined;
  if (!t || !p) return null;
  const year = yearOf(g.calendar.currentDate);
  const seller = sellerOf(g, t.sellerId);
  const status: NegView['status'] = t.phase === 'player' ? 'open' : t.phase === 'club' ? 'blocked' : t.phase === 'failed' ? 'failed' : 'agreed';
  const ctx = transferCtx(g, t, p);
  const d = buildDemand(p, ctx);
  const st = stanceFor(g, t);
  const start: ContractTerms = {
    ...d.fair, wage: Math.round(st.agentWage * 0.85 / 10) * 10, signing: r100(st.signingFee * 0.5), agent: r100(st.agentFee * 0.8),
    promises: [], release: 0, fixedFee: 0,
  };
  return {
    mode: 'transfer', pid: p.id, talkId, status, blocked: t.phase === 'club' ? 'Erst musst du dich mit seinem Verein einigen.' : undefined,
    d, ctx, ask: d.ask, start, patience: Math.max(0, t.pPatience), startPatience: 100, round: t.pRound, maxRounds: 4,
    log: t.log.map((l) => ({ d: l.date, who: l.who as LogWho, text: l.text })), agent: agentLabel(year),
    context: `Wechsel von ${seller?.name ?? 'seinem Verein'}${t.freeAgent ? ' (ablösefrei)' : ''}`,
    known: t.pRound >= 1 || scoutKnowledge(g, p) >= 0.55,
  };
}

/** Bausteine, die playerAnswer nicht kennt, als Wochengehalt-Gegenwert. */
const EXTRA_KEYS: ClauseKey[] = ['appearance', 'goal', 'cleanSheet', 'title', 'stay', 'raise', 'option', 'relegation', 'fixedFee'];

export function submitView(g: Game, v: NegView, raw: ContractTerms): NegResult {
  if (v.mode === 'renew') return submitRenewal(g, v.pid, raw);
  const t = (g.transferTalks ?? []).find((x) => x.id === v.talkId);
  const p = g.players[v.pid];
  if (!t || !p || !v.d || !v.ctx) return { ok: false, done: true, text: 'Kein offenes Spielergespräch.' };
  const ctx = transferCtx(g, t, p);
  const d = buildDemand(p, ctx);
  const terms = sanitizeTerms(raw, d);
  const plain: ContractTerms = { ...terms, appearance: 0, goal: 0, cleanSheet: 0, title: 0, stay: 0, raise: 0, option: 'none', relegation: 0, fixedFee: 0 };
  const extrasWeekly = packageValue(terms, d, ctx) - packageValue(plain, d, ctx);
  const offer: PlayerOffer = {
    wage: terms.wage, years: terms.years, signingFee: terms.signing, releaseClause: terms.release > 0, promises: terms.promises,
    loyaltyBonus: terms.loyalty || undefined, successRaise: terms.success || undefined, agentFee: terms.agent,
    extrasWeekly: EXTRA_KEYS.some((k) => d.keys.includes(k)) ? extrasWeekly : 0,
    releaseAmount: terms.release || undefined,
    extras: { appearance: terms.appearance, goal: terms.goal, cleanSheet: terms.cleanSheet, title: terms.title, stay: terms.stay, raise: terms.raise, option: terms.option, relegation: terms.relegation, fixedFee: terms.fixedFee },
  };
  const before = t.pRound;
  const text = playerOffer(g, t.id, offer);
  const phase = t.phase as TransferTalk['phase'];
  return { ok: phase === 'agreed' || phase === 'done', done: phase !== 'player', refused: t.pRound === before, text };
}

// =============================================================================
// VERHANDLUNGSTISCH — Anzeigedaten für screens/contract/ (Verlängerung und
// Spielergespräch beim Transfer). Beide Wege liefern dieselbe Form (`NegView`),
// damit der Bildschirm nicht wissen muss, woher die Forderung kommt.
// • Verlängerung: game/contractTalk.ts (Runden, Gegenangebote, Geduld).
// • Transfer: game/transferPlayerTalk.ts – dieselbe Paketlogik mit Gegenangeboten;
//   sein Interesse an deinem Verein verschiebt die Schwelle.
// Dazu die Positionsanzeige: Wert deines Pakets für ihn gegen seine Forderung,
// Schätzung deines Stabs, ab wo er unterschreibt, und der Verlauf je Runde.
// =============================================================================
import type { ClauseKey } from '../data/contractClauses';
import {
  buildDemand, ContractTerms, MAX_ROUNDS, NegCtx, NegDemand, packageValue,
} from '../engine/contractNegotiation';
import { yearOf } from '../engine/economy';
import { bosmanActive, monthsLeft } from '../engine/contractTalks';
import { hash01, PlayerStance } from '../engine/transferMarket';
import { Player } from '../types';
import { calcAgeRank, rivalInterest, staffAccuracy } from './contractCtx';
import { interestBoost, termsFromOffer, transferPlayerOffer } from './transferPlayerTalk';
import { termsOfContract } from './contractClausesGame';
import { agentLabel, NegResult, renewalState, submitRenewal } from './contractTalk';
import { trustOf } from './promises';
import { Game } from './state';
import { scoutKnowledge, sellerOf, stanceFor, TransferTalk } from './transferTalks';

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
  // --- Positionsanzeige (alles relativ zum Wert seiner Eröffnungsforderung = 1) ---
  /** Wert eines Pakets für ihn. */
  worth: ((t: ContractTerms) => number) | null;
  /** Wert seiner aktuellen Forderung. */
  askWorth: number;
  /** Schätzung deines Stabs, ab wo er unterschreibt (Spanne). */
  zone: [number, number] | null;
  /** Verlauf je Runde: [dein Angebot, seine Forderung danach]. */
  hist: [number, number][];
  /** Vereinbartes Paket (nach der Einigung) bzw. Grund des Abbruchs. */
  deal: ContractTerms | null;
  endNote?: string;
  /** Was deine Position stärkt (+) oder schwächt (−). */
  levers: { text: string; side: 1 | -1; w: number }[];
}

type Lever = NegView['levers'][number];

/** Kräfteverhältnis bei einer Verlängerung. */
function renewLevers(g: Game, p: Player, ctx: NegCtx | null): Lever[] {
  const today = g.calendar.currentDate;
  const out: Lever[] = [];
  const months = monthsLeft(today, p.contract.expiryDate);
  const bosman = bosmanActive(today);
  if (months <= 12) out.push({ text: bosman ? 'Vertrag läuft aus – er kann bald ablösefrei gehen' : 'Vertrag läuft aus', side: -1, w: bosman ? 3 : 2 });
  else if (months >= 30) out.push({ text: 'Noch lange an dich gebunden', side: 1, w: 2 });
  const sat = p.contract.satisfaction ?? 60;
  if (sat >= 70) out.push({ text: 'Fühlt sich bei dir wohl', side: 1, w: 2 });
  else if (sat < 45) out.push({ text: 'Ist unzufrieden', side: -1, w: 2 });
  if (ctx) {
    if (ctx.moodFactor < 1) out.push({ text: 'Will gern bleiben', side: 1, w: 2 });
    else if (ctx.moodFactor > 1.02) out.push({ text: 'Lässt sich bitten', side: -1, w: 1 });
    if (ctx.agent) out.push({ text: `Lässt ${agentLabel(ctx.year).replace('sein ', 'seinen ')} verhandeln`, side: -1, w: 1 });
    out.push(ctx.starter ? { text: 'Stammspieler – schwer zu ersetzen', side: -1, w: 1 } : { text: 'Kein Stammspieler', side: 1, w: 1 });
    if (ctx.trust < 45) out.push({ text: 'Deine Zusagen gelten wenig', side: -1, w: 1 });
    else if (ctx.trust >= 80) out.push({ text: 'Auf dein Wort ist Verlass', side: 1, w: 1 });
  }
  if (rivalInterest(g, p).length) out.push({ text: 'Andere Vereine sind interessiert', side: -1, w: 2 });
  if (p.age >= 32) out.push({ text: 'Im Herbst der Karriere', side: 1, w: 1 });
  return out;
}

/** Kräfteverhältnis im Spielergespräch eines Transfers: seine Gründe für und gegen deinen Verein. */
function transferLevers(st: PlayerStance, knowledge: number, agent: boolean, year: number): Lever[] {
  const shown = st.reasons.slice(0, knowledge >= 0.5 ? 6 : 3);
  const out: Lever[] = shown.map((r) => ({ text: r.label.charAt(0).toUpperCase() + r.label.slice(1), side: r.sign, w: knowledge >= 0.6 ? (Math.abs(r.value) >= 8 ? 3 : Math.abs(r.value) >= 4 ? 2 : 1) : 1 }));
  if (agent) out.push({ text: `Lässt ${agentLabel(year).replace('sein ', 'seinen ')} verhandeln`, side: -1, w: 1 });
  return out;
}

/** Positionsdaten aus Forderung, Lage und Verlauf. `acc` = Treffsicherheit deines Stabs (0..1). */
function position(d: NegDemand | null, ctx: NegCtx | null, ask: ContractTerms | null, open0: number | undefined, hist: [number, number][] | undefined, boost: number, acc: number, seed: string): Pick<NegView, 'worth' | 'askWorth' | 'zone' | 'hist'> {
  if (!d || !ctx || !ask) return { worth: null, askWorth: 1, zone: null, hist: [] };
  const base = Math.max(1, open0 ?? packageValue(d.ask, d, ctx));
  const need = d.reservation * (1 + boost) / base;
  const width = 0.11 - 0.07 * Math.max(0, Math.min(1, acc));
  const bias = (hash01(seed + '|zone') - 0.5) * width * 0.8;
  const askWorth = packageValue(ask, d, ctx) / base;
  const lo = Math.min(askWorth, need + bias - width / 2), hi = Math.min(askWorth, need + bias + width / 2);
  return { worth: (t) => packageValue(t, d, ctx) / base, askWorth, zone: [lo, Math.max(lo + 0.01, hi)], hist: (hist ?? []).map(([o, a]) => [o / base, a / base]) };
}

const r100 = (x: number) => Math.round(x / 100) * 100;

export function renewView(g: Game, pid: string): NegView {
  const p = g.players[pid];
  const year = yearOf(g.calendar.currentDate);
  const s = renewalState(g, pid);
  const st = s.st;
  const start = s.d && p ? { ...termsOfContract(p, s.d.ideal), promises: [] } : null;
  // Am Tag des Abbruchs bleibt das Ergebnis stehen (Stempel „Gescheitert“), danach nur noch die Sperre.
  const status: NegView['status'] = st?.status === 'agreed' ? 'agreed' : st?.status === 'failed' && st.last === g.calendar.currentDate ? 'failed' : s.blocked ? 'blocked' : st?.status ?? 'open';
  return {
    mode: 'renew', pid, status, blocked: s.blocked ?? undefined, d: s.d, ctx: s.ctx, ask: st?.ask ?? null, start,
    patience: Math.max(0, st?.patience ?? 0), startPatience: st?.start ?? 100, round: st?.round ?? 0, maxRounds: MAX_ROUNDS,
    log: st?.log ?? [], agent: agentLabel(year), context: 'Vertragsverlängerung', known: true,
    ...position(s.d, s.ctx, st?.ask ?? null, st?.open0, st?.hist, st?.boost ?? 0, staffAccuracy(g), `${pid}|${st?.started ?? ''}`),
    deal: st?.deal ?? null, endNote: st?.endNote, levers: p ? renewLevers(g, p, s.ctx) : [],
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
  const ask = t.pAsk ?? d.ask;
  return {
    mode: 'transfer', pid: p.id, talkId, status, blocked: t.phase === 'club' ? 'Erst musst du dich mit seinem Verein einigen.' : undefined,
    d, ctx, ask, start, patience: Math.max(0, t.pPatience), startPatience: 100, round: t.pRound, maxRounds: MAX_ROUNDS,
    log: t.log.map((l) => ({ d: l.date, who: l.who as LogWho, text: l.text })), agent: agentLabel(year),
    context: `Wechsel von ${seller?.name ?? 'seinem Verein'}${t.freeAgent ? ' (ablösefrei)' : ''}`,
    known: t.pRound >= 1 || scoutKnowledge(g, p) >= 0.55,
    ...position(d, ctx, ask, undefined, t.pHist?.map(([o, a]) => [o, a] as [number, number]), interestBoost(st.interest), scoutKnowledge(g, p), t.id),
    deal: t.terms ? termsFromOffer(t.terms) : null, endNote: t.endNote, levers: transferLevers(st, scoutKnowledge(g, p), ctx.agent, year),
  };
}

export function submitView(g: Game, v: NegView, raw: ContractTerms, locks: ClauseKey[] = []): NegResult {
  if (v.mode === 'renew') return submitRenewal(g, v.pid, raw, locks);
  if (!v.talkId) return { ok: false, done: true, text: 'Kein offenes Spielergespräch.' };
  return transferPlayerOffer(g, v.talkId, raw, locks);
}

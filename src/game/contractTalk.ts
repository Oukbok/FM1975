// =============================================================================
// VERTRAGSVERHANDLUNG 2.0 — Spielablauf (Verlängerung eigener Spieler)
// -----------------------------------------------------------------------------
// Rechnung: engine/contractNegotiation.ts. Hier: Lage aus dem Spielstand
// (Stellenwert, Tabelle, Berater, echte Interessenten), Gesprächszustand am
// Spieler (`contract.talks.neg`), Runden mit Geduld, Abbruch mit Sperre und
// Moral-Sprung, Abschluss mit Buchung von Handgeld/Provision und Zusagen.
// Transfer-Gespräche nutzen denselben Bildschirm über game/contractTransfer.ts.
// Bildschirm: screens/contract/.
// =============================================================================
import { CLAUSE_BY_KEY, ClauseKey } from '../data/contractClauses';
import { CONTRACT_GRAMMAR } from '../data/contractTalkLines';
import { Speaker } from '../data/ticker/grammar';
import { calcAgeRank } from './contractCtx';
import { CalendarEngine, seasonLabel } from '../engine/calendar';
import {
  answer, buildDemand, ContractTerms, MAX_ROUNDS, NegCtx, NegDemand, packageValue, startPatience,
} from '../engine/contractNegotiation';
import { contractDemand, monthsLeft, seasonEndYear } from '../engine/contractTalks';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { makeMessage, pushMessage } from '../engine/messages';
import { personaOf } from '../engine/persona';
import { agentShare, hasAgent, promiseWeights } from '../engine/playerWishes';
import { hash01, PROMISES, PromiseType } from '../engine/transferMarket';
import { Player } from '../types';
import { fmtPrice, fmtWage } from '../ui/format';
import { wageLimitFactor } from './budgetPlan';
import { moraleJolt } from './moraleJolt';
import { trustOf } from './promises';
import { Game } from './state';
import { logRenewal } from './transferLog';
import { applyContractExtras, termsSummary } from './contractClausesGame';
import { rivalInterest, staffAccuracy } from './contractCtx';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export interface NegLog { d: string; who: 'du' | 'spieler' | 'berater' | 'info'; text: string }

/** Laufendes Gespräch (gespeichert in `contract.talks.neg`). */
export interface NegState {
  v: 1;
  started: string;
  last: string;
  round: number;
  patience: number;
  start: number;
  /** Aktuelle Forderung (nach Gegenangeboten). */
  ask: ContractTerms;
  /** Aufschlag wegen echter Konkurrenz. */
  boost: number;
  log: NegLog[];
  status: 'open' | 'agreed' | 'failed';
}

/** Promise-Typen, die bei einer Verlängerung Sinn ergeben. */
export const RENEW_PROMISES: PromiseType[] = ['stammplatz', 'wunschposition', 'kapitaen', 'entwicklung', 'titel', 'europa', 'stars', 'freigabe', 'keinRivale'];

export function agentLabel(year: number): string {
  return year < 1985 ? 'sein Anwalt' : year < 1994 ? 'sein Manager' : 'sein Berater';
}

/** Lage einer Verlängerung (deterministisch aus dem Spielstand). */
export function renewCtx(g: Game, p: Player): { ctx: NegCtx; legacy: ReturnType<typeof contractDemand> } {
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  const club = g.clubs[p.clubId];
  const squad = club.playerIds.map((id) => g.players[id]).filter(Boolean);
  const legacy = contractDemand(p, club, squad, today);
  const pe = personaOf(p);
  const agent = hasAgent(p, year);
  const h = hash01(`${p.id}|neg|ask|${g.season}`);
  const fair = legacy.wage;
  const bosmanSoon = year >= 1996 && monthsLeft(today, p.contract.expiryDate) <= 12;
  const weeks = bosmanSoon ? 6 + pe.geld / 8 : year >= 1996 ? pe.geld / 14 : pe.geld / 28;
  const r = calcAgeRank(g, p, club);
  const moodFactor = { gern: 0.96, offen: 1, zögerlich: 1.05, ablehnend: 1.1 }[legacy.mood];
  const pw = promiseWeights(p, { depthRank: r.depthRank, buyerRep: club.reputation, foreignMove: false, rivals: true })
    .filter(([t]) => RENEW_PROMISES.includes(t) && (t !== 'kapitaen' || club.tactics?.captainId !== p.id));
  const ctx: NegCtx = {
    year, mode: 'renew', fairWage: fair,
    askWage: fair * (agent ? 1.1 + h * 0.12 : 1.03 + h * 0.05),
    fairSigning: Math.round(fair * weeks / 100) * 100,
    agent, agentFee: agent ? Math.round(agentShare(year) * fair * 52 * 3 / 100) * 100 : 0,
    ...r.expect, marketValue: p.contract.transferValue, promiseWeights: pw, trust: trustOf(g),
    starter: r.starter, keeperOrDef: r.keeperOrDef, attacker: r.attacker,
    moodFactor, startPatience: startPatience(legacy.mood, agent), seed: `${p.id}|${g.season}`,
  };
  return { ctx, legacy };
}

function speaker(seed: string): Speaker {
  let s = hash01(seed) * 1e6 + 1;
  return new Speaker({ ...CONTRACT_GRAMMAR }, () => { s = (s * 16807) % 2147483647; return s / 2147483647; });
}

export function lineOf(g: Game, p: Player, sym: string, seed: string, slots: Record<string, string | number> = {}, agent = false): string {
  const year = yearOf(g.calendar.currentDate);
  const ag = agentLabel(year);
  const sp = speaker(seed);
  const ctx = { year, flags: new Set(agent ? ['agent'] : []), slots: { name: p.lastName, agent: ag, Agent: ag.charAt(0).toUpperCase() + ag.slice(1), club: g.clubs[g.managedClubId]?.name ?? '', ...slots } };
  const r = sp.pick(sym, ctx);
  return r ? sp.expand(r, ctx) : '';
}

function pushLog(st: NegState, l: NegLog): void {
  st.log.push(l);
  if (st.log.length > 40) st.log.splice(0, st.log.length - 40);
}

function talksOf(g: Game, p: Player) {
  const season = `${seasonEndYear(g.calendar.currentDate) - 1}`;
  const t = p.contract.talks && p.contract.talks.season === season ? p.contract.talks : { season, attempts: 0 };
  return t;
}

/** Grund, warum (gerade) nicht verhandelt werden kann – sonst null. */
export function renewBlocker(g: Game, p: Player | undefined): string | null {
  if (!p || p.clubId !== g.managedClubId || p.isYouth || !g.players[p.id]) return 'Nur Spieler deines Kaders.';
  if (p.loan) return 'Er ist nur ausgeliehen – verhandeln kannst du mit seinem Verein.';
  const { legacy } = renewCtx(g, p);
  return legacy.open ? null : legacy.blockedText ?? 'Er will gerade nicht verhandeln.';
}

/** Gespräch öffnen bzw. fortsetzen (nach 30 Tagen ohne Runde beginnt es neu). */
export function openRenewal(g: Game, pid: string): NegState | string {
  const p = g.players[pid];
  const block = renewBlocker(g, p);
  const today = g.calendar.currentDate;
  const talks = talksOf(g, p!);
  const prev = talks.neg as NegState | undefined;
  if (prev && (prev.status === 'open' || prev.status === 'agreed') && CalendarEngine.addDays(prev.last, 30) >= today) return prev;
  if (block) return block;
  const { ctx, legacy } = renewCtx(g, p!);
  const d = buildDemand(p!, ctx);
  const st: NegState = { v: 1, started: today, last: today, round: 0, patience: ctx.startPatience, start: ctx.startPatience, ask: d.ask, boost: 0, log: [], status: 'open' };
  const seed = `${p!.id}|${today}`;
  pushLog(st, { d: today, who: 'spieler', text: lineOf(g, p!, legacy.mood === 'gern' ? 'open_gern' : legacy.mood === 'offen' ? 'open_offen' : 'open_zoeg', seed + 'o') });
  if (ctx.agent) pushLog(st, { d: today, who: 'berater', text: lineOf(g, p!, 'agent_open', seed + 'a', {}, true) });
  // Konkurrenz: echt (KI-Interesse im Spielstand) oder Bluff des Beraters.
  const rivals = rivalInterest(g, p!);
  const pe = personaOf(p!);
  const claim = rivals.length > 0 ? (ctx.agent || pe.rampenlicht >= 60) : ctx.agent && hash01(seed + 'bluff') < 0.25 + pe.geld / 250;
  if (claim) {
    pushLog(st, { d: today, who: ctx.agent ? 'berater' : 'spieler', text: lineOf(g, p!, 'bluff_claim', seed + 'c', {}, ctx.agent) });
    const right = hash01(seed + 'sd') < staffAccuracy(g);
    const sym = rivals.length ? (right ? 'sd_confirm' : 'sd_deny') : (right ? 'sd_deny' : 'sd_unsure');
    pushLog(st, { d: today, who: 'info', text: lineOf(g, p!, sym, seed + 's', { rival: rivals[0] ?? '' }) });
  }
  if (rivals.length) st.boost = 0.04;
  talks.neg = st;
  p!.contract.talks = talks;
  return st;
}

export interface NegResult { ok: boolean; done: boolean; text: string; refused?: boolean }

/** Prüft Vorstandsgrenzen (Gehaltsbudget hart, Einmalzahlungen gegen das Transferbudget). */
export function budgetRefusal(g: Game, p: Player | null, t: ContractTerms): string | null {
  const club = g.clubs[g.managedClubId];
  const wages = club.playerIds.reduce((s, id) => s + (g.players[id]?.contract.weeklyWage ?? 0), 0) - (p && p.clubId === club.id ? p.contract.weeklyWage : 0) + t.wage;
  const budget = club.finances.wageBudget ?? 0;
  const wf = wageLimitFactor(g);
  const old = p && p.clubId === club.id ? p.contract.weeklyWage : 0;
  if (budget > 0 && t.wage > old && wages > budget * wf) {
    return `Der Vorstand gibt das nicht frei: Die Gehälter lägen bei ${Math.round((wages / budget) * 100)} % des Gehaltsbudgets (Grenze ${Math.round(wf * 100)} %).${wf < 1.15 ? ' Mehr Spielraum schaffst du unter Finanzen › Budget.' : ''}`;
  }
  const once = t.signing + t.agent;
  if (once > 0 && once > Math.max(0, club.finances.transferBudget)) return `Handgeld und Provision (${fmtPrice(once)}) übersteigen dein Transferbudget (${fmtPrice(Math.max(0, club.finances.transferBudget))}).`;
  return null;
}

/** Angebot auf die erlaubten Punkte und Spannen beschneiden. */
export function sanitizeTerms(t: ContractTerms, d: NegDemand): ContractTerms {
  const keys = new Set(d.keys);
  const n = (k: ClauseKey, v: number) => (keys.has(k) ? Math.max(0, v || 0) : 0);
  return {
    wage: Math.max(1, t.wage), years: clamp(Math.round(t.years), 1, 5),
    signing: n('signing', t.signing), appearance: n('appearance', t.appearance), goal: n('goal', t.goal), cleanSheet: n('cleanSheet', t.cleanSheet),
    title: n('title', t.title), stay: n('stay', t.stay), raise: clamp(n('raise', t.raise), 0, 0.1), fixedFee: n('fixedFee', t.fixedFee),
    release: n('release', t.release), option: keys.has('option') ? t.option : 'none', relegation: clamp(n('relegation', t.relegation), 0, 0.5),
    promises: keys.has('promises') ? t.promises.slice(0, 5) : [], agent: n('agent', t.agent), loyalty: n('loyalty', t.loyalty), success: clamp(n('success', t.success), 0, 0.3),
  };
}

function yearsText(d: NegDemand): string {
  return d.range[0] === d.range[1] ? `genau ${d.range[0]} Jahr${d.range[0] > 1 ? 'e' : ''}` : `${d.range[0]} bis ${d.range[1]} Jahre`;
}

/** Eine Runde: Angebot abgeben. */
export function submitRenewal(g: Game, pid: string, raw: ContractTerms): NegResult {
  const p = g.players[pid];
  const st = openRenewal(g, pid);
  if (typeof st === 'string') return { ok: false, done: true, text: st };
  if (st.status !== 'open') return { ok: false, done: true, text: 'Das Gespräch ist beendet.' };
  const today = g.calendar.currentDate;
  const { ctx } = renewCtx(g, p);
  const d = buildDemand(p, ctx);
  const t = sanitizeTerms(raw, d);
  const refusal = budgetRefusal(g, p, t);
  if (refusal) { pushLog(st, { d: today, who: 'info', text: `Nicht abgeschickt: ${refusal}` }); return { ok: false, done: false, refused: true, text: refusal }; }
  st.round += 1;
  st.last = today;
  const talks = talksOf(g, p);
  talks.attempts += 1;
  pushLog(st, { d: today, who: 'du', text: `Angebot: ${termsSummary(t)}.` });
  const ans = answer(t, d, ctx, st.ask, st.round, st.boost);
  const seed = `${p.id}|${today}|${st.round}`;
  const voice = ctx.agent ? 'berater' : 'spieler';
  if (ans.accepted) {
    pushLog(st, { d: today, who: voice, text: lineOf(g, p, 'accept', seed, {}, ctx.agent) });
    st.status = 'agreed';
    const text = applyRenewal(g, p, t, today);
    return { ok: true, done: true, text };
  }
  st.patience -= ans.patienceLoss;
  const sat = p.contract.satisfaction ?? 60;
  p.contract.satisfaction = clamp(sat - (ans.kind === 'insult' ? 6 : ans.kind === 'far' ? 3 : 1), 0, 100);
  pushLog(st, { d: today, who: voice, text: lineOf(g, p, ans.kind, seed, {}, ctx.agent) });
  if (ans.kind === 'insult') moraleJolt(g, p, -4, 'Vertragsangebot als Geringschätzung empfunden', today);
  if (st.patience <= 0 || st.round >= MAX_ROUNDS) {
    st.status = 'failed';
    const days = ans.kind === 'insult' ? 60 : 21 + Math.round((100 - personaOf(p).loyalitaet) / 4);
    talks.blockedUntil = CalendarEngine.addDays(today, days);
    talks.attempts = 0;
    pushLog(st, { d: today, who: voice, text: lineOf(g, p, 'breakoff', seed + 'b', {}, ctx.agent) });
    moraleJolt(g, p, -7, 'Vertragsgespräche abgebrochen', today);
    const until = `${talks.blockedUntil.slice(8, 10)}.${talks.blockedUntil.slice(5, 7)}.${talks.blockedUntil.slice(0, 4)}`;
    pushLog(st, { d: today, who: 'info', text: `${p.lastName} bricht die Gespräche ab und will erst ab ${until} wieder reden.` });
    return { ok: false, done: true, text: `${p.lastName} bricht die Gespräche ab (bis ${until}).` };
  }
  moraleJolt(g, p, ans.kind === 'far' ? -2 : -1, 'Vertragsangebot abgelehnt', today);
  if (ans.focus) {
    const f = lineOf(g, p, `focus_${ans.focus}`, seed + 'f', { years: yearsText(d), focus: CLAUSE_BY_KEY[ans.focus].label }, ctx.agent && ans.focus === 'agent');
    if (f) pushLog(st, { d: today, who: ans.focus === 'agent' ? 'berater' : 'spieler', text: f });
  }
  if (ans.counter) {
    // Paketlogik: Wenn ihm ein Punkt mehr wert ist, als er dich kostet, sagt er es.
    const cheap = (['signing', 'appearance', 'loyalty'] as const).find((k) => d.keys.includes(k) && (k === 'signing' ? d.k.sign >= 1.1 : k === 'appearance' ? d.k.bonus >= 1 : d.k.loyal >= 0.75));
    if (cheap && hash01(seed + 'pk') < 0.5) pushLog(st, { d: today, who: voice, text: lineOf(g, p, 'package', seed + 'p', { focus: CLAUSE_BY_KEY[cheap].label }, ctx.agent) });
    st.ask = ans.counter;
    pushLog(st, { d: today, who: voice, text: lineOf(g, p, 'counter', seed + 'k', { x: termsSummary(ans.counter) }, ctx.agent) });
  }
  return { ok: false, done: false, text: st.log[st.log.length - 1]?.text ?? '' };
}

/** Vertrag schließen: Gehalt, Laufzeit, Bausteine, Einmalzahlungen, Zusagen, Kabine. */
function applyRenewal(g: Game, p: Player, t: ContractTerms, today: string): string {
  const club = g.clubs[g.managedClubId];
  p.contract.weeklyWage = Math.round(t.wage * 1e4) / 1e4;
  const endYear = Math.max(seasonEndYear(today) + t.years, Number(p.contract.expiryDate.slice(0, 4)) + 1);
  p.contract.expiryDate = `${endYear}-06-30`;
  applyContractExtras(g, p, t, today, true);
  p.contract.satisfaction = clamp((p.contract.satisfaction ?? 60) + 12, 0, 100);
  const scale = economyScale(yearOf(today));
  if (t.signing > 0) { book(club.finances, today, -Math.round(t.signing * scale), 'transfer_expense', `Handgeld ${p.fullName} (Verlängerung)`, true); club.finances.transferBudget -= t.signing; }
  if (t.agent > 0) { book(club.finances, today, -Math.round(t.agent * scale), 'transfer_expense', `Beraterprovision ${p.fullName}`, true); club.finances.transferBudget -= t.agent; }
  // Zusagen: ab März gelten sie für die nächste Saison (sonst wäre die laufende kaum noch zu beeinflussen).
  if (t.promises.length) {
    const late = Number(today.slice(5, 7)) >= 3 && Number(today.slice(5, 7)) <= 6;
    const season = late ? seasonLabel(Number(g.season.slice(0, 4)) + 1) : g.season;
    p.promises = [...(p.promises ?? []), ...t.promises.map((type) => ({ type, madeOn: today, season, result: undefined }))];
  }
  logRenewal(g, p, club.id, today);
  moraleJolt(g, p, 6, 'Vertrag verlängert', today);
  const st = p.contract.talks?.neg;
  const sum = termsSummary(t);
  pushMessage(g.messages, makeMessage({
    date: today, category: 'contract', from: 'Sportdirektor', relatedId: p.id,
    subject: `${p.fullName} verlängert bis ${p.contract.expiryDate.slice(0, 4)}`,
    shortText: `Neues Gehalt: ${fmtWage(p.contract.weeklyWage)}.`,
    bodyText: `${p.fullName} hat seinen Vertrag verlängert. Laufzeit bis 30.06.${p.contract.expiryDate.slice(0, 4)}.\n\nVereinbart: ${sum}.${t.promises.length ? `\n\nZusagen: ${t.promises.map((x) => PROMISES[x].label).join(', ')} – sie werden am Saisonende geprüft.` : ''}`,
  }));
  // Gesprächsstand als „einig“ behalten (Anzeige des Verlaufs), Versuche zurücksetzen.
  p.contract.talks = st ? { season: `${seasonEndYear(today) - 1}`, attempts: 0, neg: { ...st, status: 'agreed' } } : undefined;
  return `${p.fullName} unterschreibt bis 30.06.${endYear}.`;
}

/** Gesprächsstand für die Oberfläche (frisch gerechnet). */
export function renewalState(g: Game, pid: string): { st: NegState | null; d: NegDemand | null; ctx: NegCtx | null; blocked: string | null } {
  const p = g.players[pid];
  if (!p) return { st: null, d: null, ctx: null, blocked: 'Spieler nicht gefunden.' };
  const st = openRenewal(g, pid);
  if (typeof st === 'string') {
    const prev = p.contract.talks?.neg as NegState | undefined;
    return { st: prev ?? null, d: null, ctx: null, blocked: st };
  }
  const { ctx } = renewCtx(g, p);
  return { st, d: buildDemand(p, ctx), ctx, blocked: null };
}

/** Wert eines Angebots relativ zur Schwelle – nur für Tests/Bilanz, nie im UI als Zahl. */
export function offerRatio(g: Game, pid: string, t: ContractTerms): number {
  const p = g.players[pid];
  const { ctx } = renewCtx(g, p);
  const d = buildDemand(p, ctx);
  return packageValue(sanitizeTerms(t, d), d, ctx) / d.reservation;
}

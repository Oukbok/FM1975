// =============================================================================
// VERTRAGSVERHANDLUNG 2.0 — reine Rechnung (ohne Spielstand)
// -----------------------------------------------------------------------------
// Ein Vertrag besteht aus vielen Bausteinen (data/contractClauses.ts): Grund-
// gehalt, Laufzeit, Handgeld, Einsatz-/Tor-/Zu-null-Prämie, Titel- und
// Klassenerhalt-Prämie, Gehaltssteigerung, festgeschriebene Ablöse (vor Bosman)
// bzw. Ausstiegsklausel, Verlängerungsoption, Abstiegsklausel, Zusagen,
// Beraterprovision, Treueprämie, Erfolgsklausel.
//
// Der Spieler bewertet ein Paket in „Wochengehalt-Gegenwert“ (1975-Basis):
// jeder Geldbaustein mit einem persönlichen Faktor (Geldgierige mögen Handgeld,
// Ehrgeizige Prämien, Familienmenschen Sicherheit …), nicht-geldliche Punkte
// (Laufzeit, Zusagen, Optionen, Klauseln, Provision) als Prozent des fairen
// Gehalts. Er unterschreibt, wenn der Gegenwert seine verdeckte Schwelle
// (`reservation` = Wert seines fairen Pakets) erreicht. Dadurch entsteht
// Paketlogik: mehr Handgeld gegen weniger Gehalt lohnt sich für dich bei
// einem Spieler, der Handgeld hoch bewertet – bei einem anderen nicht.
// Zu schwache Angebote kosten Geduld; bei 0 bricht er ab. Nach jeder Ablehnung
// nennt er (bzw. sein Berater) ein Gegenangebot, das ihm selbst reicht.
// Alles deterministisch aus Spieler-ID, Runde und Angebot.
// =============================================================================
import { ClauseKey, clauseOpen, OPTION_CLUB_FROM, OPTION_PLAYER_FROM } from '../data/contractClauses';
import { Player } from '../types';
import { careerPhase, familyWeight, personaOf } from './persona';
import { hash01, PromiseType } from './transferMarket';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r10 = (x: number) => Math.round(x / 10) * 10;
const r100 = (x: number) => Math.round(x / 100) * 100;

export type OptionKind = 'none' | 'club' | 'player';

/** Ein Vertragspaket. Geld in 1975-Basis (Gehalt pro Woche, Prämien je Ereignis, Einmalzahlungen gesamt). */
export interface ContractTerms {
  wage: number;
  years: number;
  signing: number;
  appearance: number;
  goal: number;
  cleanSheet: number;
  title: number;
  stay: number;
  /** Jährliche Gehaltssteigerung (Anteil, 0–0,1). */
  raise: number;
  /** Festgeschriebene Ablöse nach Vertragsende (vor Bosman), 0 = keine. */
  fixedFee: number;
  /** Ausstiegsklausel (ab 1996), 0 = keine. */
  release: number;
  option: OptionKind;
  /** Gehaltskürzung nach Abstieg (Anteil, 0–0,5). */
  relegation: number;
  promises: PromiseType[];
  agent: number;
  loyalty: number;
  /** Gehaltsplus bei Europapokal-Platz (Anteil). */
  success: number;
}

export const EMPTY_TERMS: ContractTerms = {
  wage: 0, years: 3, signing: 0, appearance: 0, goal: 0, cleanSheet: 0, title: 0, stay: 0, raise: 0,
  fixedFee: 0, release: 0, option: 'none', relegation: 0, promises: [], agent: 0, loyalty: 0, success: 0,
};

/** Lage des Gesprächs (vom Spielablauf aus dem Spielstand gebaut). */
export interface NegCtx {
  year: number;
  mode: 'renew' | 'transfer';
  /** Faires Wochengehalt (seine echte Vorstellung, ohne Verhandlungsaufschlag). */
  fairWage: number;
  /** Eröffnungsforderung beim Gehalt. */
  askWage: number;
  /** Faires Handgeld. */
  fairSigning: number;
  agent: boolean;
  /** Übliche Provision seines Beraters (0 ohne Berater). */
  agentFee: number;
  /** Wunschlaufzeit (Spanne) – fehlt, wird sie aus Alter/Persönlichkeit bestimmt. */
  yearsRange?: [number, number];
  /** Erwartete Pflichtspiel-Einsätze, Tore, Zu-null-Spiele je Saison. */
  expApps: number;
  expGoals: number;
  expCleanSheets: number;
  /** Wahrscheinlichkeiten je Saison: Titel, Abstieg, Europapokal-Platz. */
  pTitle: number;
  pRelegation: number;
  pEuro: number;
  marketValue: number;
  /** Gewichte der Zusagen (0..12), wichtigste zuerst. */
  promiseWeights: [PromiseType, number][];
  /** Deine Glaubwürdigkeit (0..100). */
  trust: number;
  starter: boolean;
  keeperOrDef: boolean;
  attacker: boolean;
  /** Stimmung: <1 gibt nach, >1 lässt sich bitten. */
  moodFactor: number;
  startPatience: number;
  seed: string;
}

/** Persönliche Bewertungsfaktoren (verdeckt). */
export interface Valuation {
  sign: number; bonus: number; loyal: number; raise: number; safety: number; succ: number;
  /** Freiheitsdrang: Klauseln, Optionen, kurze Laufzeit. */
  free: number;
  agentPower: number;
  years: number;
}

export interface NegDemand {
  ask: ContractTerms;
  fair: ContractTerms;
  /** Verdeckte Schwelle (Wochengehalt-Gegenwert). */
  reservation: number;
  /** Wichtigkeit je Punkt (0–3) – Anzeige nur als Punkte/Worte. */
  weights: Record<ClauseKey, number>;
  keys: ClauseKey[];
  range: [number, number];
  ideal: number;
  k: Valuation;
}

// -----------------------------------------------------------------------------
// Forderung
// -----------------------------------------------------------------------------
function idealYears(p: Player, ehrgeiz: number): { ideal: number; range: [number, number]; w: number } {
  const ph = careerPhase(p);
  if (ph === 'talent' || ph === 'durchbruch') return ehrgeiz >= 62 ? { ideal: 2, range: [1, 3], w: 2.5 } : { ideal: 4, range: [3, 5], w: 1.5 };
  if (ph === 'peak') return ehrgeiz >= 65 ? { ideal: 2, range: [2, 3], w: 2 } : { ideal: 3, range: [2, 4], w: 1.5 };
  if (ph === 'letzterVertrag') return { ideal: 3, range: [2, 4], w: 3 };
  return p.age >= 35 ? { ideal: 1, range: [1, 2], w: 2 } : { ideal: 2, range: [1, 3], w: 3 };
}

/** Verhandelbare Punkte in diesem Jahr für diesen Spieler. */
export function negotiableKeys(year: number, ctx: Pick<NegCtx, 'agent' | 'keeperOrDef' | 'attacker'>): ClauseKey[] {
  const all: ClauseKey[] = ['wage', 'years', 'signing', 'appearance', 'goal', 'cleanSheet', 'title', 'stay', 'raise', 'fixedFee', 'release',
    'option', 'relegation', 'promises', 'agent', 'loyalty', 'success'];
  return all.filter((k) => clauseOpen(k, year)
    && (k !== 'goal' || !ctx.keeperOrDef || ctx.attacker)
    && (k !== 'cleanSheet' || ctx.keeperOrDef)
    && (k !== 'agent' || ctx.agent));
}

export function buildDemand(p: Player, ctx: NegCtx): NegDemand {
  const pe = personaOf(p);
  const h = (s: string) => hash01(`${p.id}|neg|${s}`);
  const yi = idealYears(p, pe.ehrgeiz);
  const range: [number, number] = ctx.yearsRange ?? yi.range;
  const ideal = clamp(ctx.yearsRange ? Math.round((range[0] + range[1]) / 2) : yi.ideal, range[0], range[1]);
  const k: Valuation = {
    sign: 0.6 + pe.geld / 125 + (p.age >= 30 ? 0.25 : 0),
    bonus: clamp(0.62 + pe.ehrgeiz / 300 + (ctx.starter ? 0.12 : -0.15), 0.45, 1.1),
    loyal: 0.4 + pe.loyalitaet / 250,
    raise: 0.7 + (p.age <= 26 ? 0.25 : 0) + pe.geld / 400,
    safety: 1 + familyWeight(p, pe) / 100 + (p.age >= 30 ? 0.5 : 0),
    succ: 0.5 + pe.ehrgeiz / 100,
    free: clamp((pe.ehrgeiz - 45) / 18 + (pe.abenteuer - 50) / 40 + (p.age <= 27 ? 0.5 : -0.5), 0, 3),
    agentPower: ctx.agent ? 0.6 + pe.geld / 250 : 0,
    years: yi.w,
  };
  const keys = negotiableKeys(ctx.year, ctx);
  const has = (x: ClauseKey) => keys.includes(x);
  const fw = ctx.fairWage;
  const topPromise = ctx.promiseWeights.find(([, w]) => w >= 6);
  const wantsClause = k.free >= 1.2;
  const clauseAsk = wantsClause ? Math.round(ctx.marketValue * (2.6 - k.free * 0.35) / 5000) * 5000 : 0;

  const fair: ContractTerms = {
    ...EMPTY_TERMS,
    wage: r10(fw * ctx.moodFactor), years: ideal, signing: r100(ctx.fairSigning),
    fixedFee: has('fixedFee') ? Math.round(clauseAsk * 0.6 / 5000) * 5000 : 0,
    release: has('release') ? clauseAsk : 0,
    promises: topPromise ? [topPromise[0]] : [],
    agent: has('agent') ? ctx.agentFee : 0,
  };
  const ask: ContractTerms = {
    ...fair,
    wage: r10(Math.max(ctx.askWage, fair.wage)),
    signing: r100(ctx.fairSigning * (ctx.agent ? 1.5 : 1.3)),
    appearance: has('appearance') && (ctx.starter || k.bonus >= 0.8) ? r10(fw * (0.04 + 0.06 * k.bonus)) : 0,
    goal: has('goal') && ctx.attacker ? r10(fw * 0.25 * k.bonus) : 0,
    cleanSheet: has('cleanSheet') ? r10(fw * 0.12 * k.bonus) : 0,
    title: has('title') && ctx.pTitle >= 0.05 ? r100(fw * 4) : 0,
    stay: has('stay') && ctx.pRelegation >= 0.08 ? r100(fw * 3) : 0,
    raise: has('raise') && k.raise >= 0.9 ? 0.05 : 0,
    option: has('option') && k.free >= 1.5 && ctx.year >= OPTION_PLAYER_FROM ? 'player' : 'none',
    loyalty: has('loyalty') && pe.loyalitaet >= 60 && ideal >= 3 ? r100(fw * 8) : 0,
    success: has('success') && pe.ehrgeiz >= 60 && ctx.pEuro >= 0.15 ? 0.15 : 0,
    agent: has('agent') ? r100(ctx.agentFee * (1.1 + h('ag') * 0.2)) : 0,
  };
  const bw = (v: number) => (v >= 0.95 ? 3 : v >= 0.75 ? 2 : 1);
  const topW = ctx.promiseWeights[0]?.[1] ?? 0;
  const weights = {
    wage: pe.geld >= 60 ? 3 : 2, years: Math.round(clamp(k.years, 1, 3)),
    signing: k.sign >= 1.1 ? 3 : k.sign >= 0.85 ? 2 : 1,
    appearance: bw(k.bonus), goal: bw(k.bonus), cleanSheet: bw(k.bonus), title: bw(k.bonus),
    stay: ctx.pRelegation >= 0.15 ? 3 : bw(k.bonus) - 1,
    raise: k.raise >= 1 ? 2 : 1,
    fixedFee: Math.round(clamp(k.free, 0, 3)), release: Math.round(clamp(k.free, 0, 3)), option: Math.round(clamp(k.free, 0, 3)),
    relegation: k.safety >= 1.8 ? 3 : k.safety >= 1.4 ? 2 : 1,
    promises: topW >= 8 ? 3 : topW >= 5 ? 2 : topW > 0 ? 1 : 0,
    agent: ctx.agent ? 3 : 0, loyalty: pe.loyalitaet >= 65 ? 2 : 1, success: pe.ehrgeiz >= 65 ? 2 : 1,
  } as Record<ClauseKey, number>;
  const d: NegDemand = { ask, fair, reservation: 0, weights, keys, range, ideal, k };
  d.reservation = packageValue(fair, d, ctx);
  return d;
}

// -----------------------------------------------------------------------------
// Bewertung
// -----------------------------------------------------------------------------
/** Wert der Zusagen (in % des fairen Gehalts), gedeckelt; zu viele wirken unglaubwürdig. */
export function promisePoints(promises: PromiseType[], ctx: Pick<NegCtx, 'promiseWeights' | 'trust'>): number {
  const w = new Map(ctx.promiseWeights);
  const vals = promises.map((t) => w.get(t) ?? 0.5).sort((a, b) => b - a);
  const cred = clamp(ctx.trust / 70, 0.2, 1.3) * (promises.length > 3 ? 0.6 : 1);
  return ((vals[0] ?? 0) + (vals[1] ?? 0) * 0.7 + (vals[2] ?? 0) * 0.5 + vals.slice(3).reduce((s, v) => s + v * 0.2, 0)) * cred * 0.9;
}

/** Freiheitsklausel (Ablöse/Ausstieg): 1 = wie gewünscht, −1 = keine. */
function clauseShape(off: number, want: number): number {
  if (off <= 0) return -1;
  return clamp((2 * want - off) / want, -1, 1.25);
}

/** Nicht-geldliche Punkte in % des fairen Gehalts. */
export function pointsOf(t: ContractTerms, d: NegDemand, ctx: NegCtx): number {
  const k = d.k;
  const [lo, hi] = d.range;
  let pts = 0;
  if (t.years < lo) pts -= (lo - t.years) * (5 + 3 * k.years);
  if (t.years > hi) pts -= (t.years - hi) * (5 + 3 * k.years);
  pts -= Math.abs(t.years - d.ideal) * k.years * 0.8;
  pts += promisePoints(t.promises, ctx);
  if (t.option === 'club') pts -= 1.5 + 2 * k.free;
  if (t.option === 'player') pts += 0.5 + 1.5 * k.free;
  const want = d.ask.release || d.ask.fixedFee;
  const off = t.release || t.fixedFee;
  if (want > 0) pts += (clauseShape(off, want) - 1) * k.free * 1.6;
  else if (off > 0) pts += k.free * 0.5;
  if (ctx.agent && ctx.agentFee > 0) {
    const short = clamp(1 - t.agent / ctx.agentFee, 0, 1);
    pts -= short * 12 * k.agentPower;
    if (t.agent > ctx.agentFee) pts += Math.min(3, (t.agent / ctx.agentFee - 1) * 6) * k.agentPower;
  }
  return pts;
}

/** Ableitung des Paketwerts nach dem Grundgehalt. */
function wageSlope(t: ContractTerms, d: NegDemand, ctx: NegCtx): number {
  const y = clamp(t.years, 1, 5);
  return Math.max(0.3, 1 + t.raise * (y - 1) / 2 * d.k.raise + t.success * ctx.pEuro * d.k.succ - t.relegation * ctx.pRelegation * d.k.safety);
}

/** Wert eines Pakets für den Spieler (Wochengehalt-Gegenwert, 1975-Basis). */
export function packageValue(t: ContractTerms, d: NegDemand, ctx: NegCtx): number {
  const k = d.k;
  const y = clamp(t.years, 1, 5);
  let v = t.wage * wageSlope(t, d, ctx);
  v += t.signing / (y * 52) * k.sign;
  v += (t.appearance * ctx.expApps + t.goal * ctx.expGoals + t.cleanSheet * ctx.expCleanSheets) / 52 * k.bonus;
  v += (t.title * ctx.pTitle + t.stay * (1 - ctx.pRelegation)) / 52 * k.bonus * 0.9;
  v += t.loyalty / (y * 52) * k.loyal;
  v += ctx.fairWage * pointsOf(t, d, ctx) / 100;
  return v;
}

/** Beitrag der einzelnen Punkte zum Paketwert (für „woran hakt es?“). */
export function contributions(t: ContractTerms, d: NegDemand, ctx: NegCtx): Partial<Record<ClauseKey, number>> {
  const out: Partial<Record<ClauseKey, number>> = {};
  for (const key of d.keys) {
    const probe = { ...t, [key]: d.fair[key] } as ContractTerms;
    if (key === 'appearance' || key === 'goal' || key === 'cleanSheet' || key === 'title' || key === 'stay' || key === 'loyalty' || key === 'success' || key === 'raise') {
      (probe as unknown as Record<string, number>)[key] = d.ask[key] as number;
    }
    out[key] = packageValue(t, d, ctx) - packageValue(probe, d, ctx);
  }
  return out;
}

export type AnswerKind = 'accept' | 'close' | 'gap' | 'far' | 'insult';

export interface NegAnswer {
  kind: AnswerKind;
  accepted: boolean;
  /** Gegenwert ÷ Schwelle. */
  ratio: number;
  patienceLoss: number;
  /** Größter Mangel (für den Hinweis). */
  focus?: ClauseKey;
  counter?: ContractTerms;
}

/**
 * Antwort auf ein Angebot. `boost` = Aufschlag wegen echter Konkurrenz-Angebote,
 * `round` = Runde (1…). Deterministisch aus Seed, Runde und Angebot.
 */
export function answer(t: ContractTerms, d: NegDemand, ctx: NegCtx, cur: ContractTerms, round: number, boost = 0): NegAnswer {
  const need = d.reservation * (1 + boost);
  const val = packageValue(t, d, ctx);
  const jitter = (hash01(`${ctx.seed}|${round}|${Math.round(t.wage)}|${t.years}`) - 0.5) * 0.03;
  const ratio = val / Math.max(1, need);
  if (ratio >= 1 + jitter) return { kind: 'accept', accepted: true, ratio, patienceLoss: 0 };
  const kind: AnswerKind = ratio < 0.75 ? 'insult' : ratio < 0.88 ? 'far' : ratio < 0.97 ? 'gap' : 'close';
  const patienceLoss = kind === 'insult' ? 40 : kind === 'far' ? 22 : kind === 'gap' ? 12 : 6;
  const c = contributions(t, d, ctx);
  const focus = (Object.entries(c) as [ClauseKey, number][]).filter(([, v]) => v < 0).sort((a, b) => a[1] - b[1])[0]?.[0];
  return { kind, accepted: false, ratio, patienceLoss, focus, counter: counterOffer(t, cur, d, ctx, need, round) };
}

const MONEY: (keyof ContractTerms)[] = ['signing', 'appearance', 'goal', 'cleanSheet', 'title', 'stay', 'loyalty', 'agent'];
const PCT: (keyof ContractTerms)[] = ['raise', 'success'];

/**
 * Gegenangebot: Er kommt dir bei Punkten entgegen, die ihm wenig bedeuten, beharrt
 * auf den wichtigen und gleicht den Rest über das Gehalt aus – nie unter seiner Schwelle.
 */
export function counterOffer(o: ContractTerms, cur: ContractTerms, d: NegDemand, ctx: NegCtx, need: number, round: number): ContractTerms {
  const c: ContractTerms = { ...cur, promises: [...cur.promises] };
  const conc = (key: ClauseKey) => clamp(0.45 - 0.12 * (d.weights[key] ?? 1) + round * 0.03, 0.05, 0.6);
  const rec = c as unknown as Record<string, number>, off = o as unknown as Record<string, number>;
  for (const key of [...MONEY, ...PCT]) {
    if (!d.keys.includes(key as ClauseKey)) { rec[key] = 0; continue; }
    const a = rec[key], b = off[key];
    rec[key] = b >= a ? b : a + (b - a) * conc(key as ClauseKey);
  }
  c.years = o.years >= d.range[0] && o.years <= d.range[1] ? o.years : cur.years;
  const optRank = { club: 0, none: 1, player: 2 } as const;
  if (optRank[o.option] >= optRank[cur.option] || d.k.free < 1) c.option = o.option;
  // Freiheitsklausel: eine niedrigere (für ihn bessere) nimmt er; keine nur, wenn sie ihm wenig bedeutet.
  for (const key of ['release', 'fixedFee'] as const) {
    if (!d.keys.includes(key)) { c[key] = 0; continue; }
    if (o[key] > 0 && (cur[key] === 0 || o[key] <= cur[key])) c[key] = o[key];
    else if (o[key] === 0 && d.k.free < 1.2) c[key] = 0;
    else if (o[key] > cur[key] && cur[key] > 0) c[key] = Math.round((cur[key] + (o[key] - cur[key]) * conc(key)) / 5000) * 5000;
  }
  c.relegation = o.relegation > 0 ? Math.round(o.relegation * (d.k.safety >= 1.6 ? 0.5 : 0.8) * 20) / 20 : 0;
  const must = d.fair.promises.filter((x) => (ctx.promiseWeights.find(([t]) => t === x)?.[1] ?? 0) >= 8);
  c.promises = Array.from(new Set([...o.promises, ...must]));
  if (d.keys.includes('agent') && ctx.agentFee > 0) c.agent = Math.max(c.agent, Math.round(ctx.agentFee * 0.9 / 100) * 100);
  // Gehalt ausgleichen: nie unter der Schwelle, nie unter deinem Angebot, Bluff schmilzt.
  c.wage = Math.max(o.wage, c.wage);
  const slope = wageSlope(c, d, ctx);
  const target = need * 1.02;
  const val = packageValue(c, d, ctx);
  if (val < target) c.wage += (target - val) / slope;
  else if (val > target * 1.04) c.wage = Math.max(o.wage, c.wage - (val - target * 1.03) / slope);
  c.wage = Math.ceil(c.wage / 10) * 10;
  for (const key of MONEY) (c as unknown as Record<string, number>)[key] = r100((c as unknown as Record<string, number>)[key]);
  for (const key of PCT) (c as unknown as Record<string, number>)[key] = Math.round((c as unknown as Record<string, number>)[key] * 100) / 100;
  return c;
}

// -----------------------------------------------------------------------------
// Kosten für den Verein (1975-Basis)
// -----------------------------------------------------------------------------
export interface PackageCost {
  /** Erwartete Kosten der ersten Saison (Gehalt + Prämien). */
  season: number;
  /** Einmalzahlungen (Handgeld, Provision; Treueprämie am Ende). */
  oneOff: number;
  /** Alles über die Laufzeit. */
  total: number;
  wages: number;
  bonuses: number;
}

export function packageCost(t: ContractTerms, ctx: Pick<NegCtx, 'expApps' | 'expGoals' | 'expCleanSheets' | 'pTitle' | 'pRelegation' | 'pEuro'>): PackageCost {
  const y = clamp(t.years, 1, 5);
  const avg = 1 + t.raise * (y - 1) / 2;
  const wages = t.wage * 52 * y * avg;
  const perSeasonBonus = t.appearance * ctx.expApps + t.goal * ctx.expGoals + t.cleanSheet * ctx.expCleanSheets
    + t.title * ctx.pTitle + t.stay * (1 - ctx.pRelegation) + t.success * t.wage * 52 * ctx.pEuro * 0.5
    - t.relegation * t.wage * 52 * ctx.pRelegation;
  const bonuses = perSeasonBonus * y;
  const oneOff = t.signing + t.agent + t.loyalty;
  return { season: t.wage * 52 + perSeasonBonus, oneOff, total: wages + bonuses + oneOff, wages, bonuses };
}

/** Geduld zu Beginn je Stimmung (Berater verhandeln länger). */
export function startPatience(mood: 'gern' | 'offen' | 'zögerlich' | 'ablehnend', agent: boolean): number {
  return ({ gern: 100, offen: 85, zögerlich: 65, ablehnend: 0 }[mood]) + (agent ? 10 : 0);
}

export const MAX_ROUNDS = 7;

/** Option bei Vereinsjahren (Verein ab 1990, Spieler ab 2000). */
export function optionKinds(year: number): OptionKind[] {
  return ['none', ...(year >= OPTION_CLUB_FROM ? ['club' as const] : []), ...(year >= OPTION_PLAYER_FROM ? ['player' as const] : [])];
}

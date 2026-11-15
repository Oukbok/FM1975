// =============================================================================
// VERHANDLUNG MIT SPONSOREN — reine Rechnung (ohne Spielstand)
// -----------------------------------------------------------------------------
// Wunsch Pascal: „Die Verhandlungen mit Sponsoren sollen so aufgebaut sein wie die
// Verhandlungen mit Spielern.“ Muster: engine/staffNegotiation.ts – nur mit
// vertauschten Rollen: Der Sponsor zahlt, du forderst. Eine Forderung ist ein Paket
// aus Jahresbetrag, Laufzeit, Erfolgsprämien, gestrichenen Klauseln und der
// Verlängerungsoption. Der Sponsor rechnet das Paket in „Kosten pro Jahr“ (1975-Basis)
// um, unterschreibt bis zu seiner verdeckten Obergrenze, lehnt darüber mit einem
// Gegenvorschlag ab und verliert Geduld.
// Werte aus Sponsoring 2.0 werden nicht neu gerechnet: Was eine Klausel dem Sponsor
// wert ist (`clausePremium`), was er nie streicht (`clauseFixed`) und die
// Laufzeit-Regel (+2 % Spielraum je Jahr) kommen aus engine/sponsorship.ts.
// Spielablauf: game/sponsorTalk.ts · Bildschirm: screens/negotiation/SponsorTalk.tsx.
// =============================================================================
import type { SponsorBonuses, SponsorClause } from '../types/sponsor';
import { clauseFixed, clausePremium } from './sponsorship';
import { hash01 } from './transferMarket';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r500 = (x: number) => Math.round(x / 500) * 500;

export type BonusKey = 'title' | 'cup' | 'euro' | 'survive';
export const BONUS_KEYS: BonusKey[] = ['title', 'cup', 'euro', 'survive'];
/** Punkte am Tisch: Betrag, Laufzeit, Prämien, Klauseln (`c<Index>`), Option. */
export type SponsorPoint = 'value' | 'years' | BonusKey | 'option' | `c${number}`;

/** Die Verlängerungsoption, die du verlangen kannst (wie in engine/sponsorship.ts makeOffers). */
export const OPTION_CLAUSE: SponsorClause = { kind: 'option', years: 2, raise: 0.1 };
/** Was die Option dem Sponsor wert ist (Betrag von clausePremium). */
const OPTION_PREMIUM = Math.abs(clausePremium(OPTION_CLAUSE));

/** Das Eröffnungsangebot des Sponsors (Schnappschuss beim Start des Gesprächs). */
export interface SponsorBase {
  /** Jahreswert (1975-Basis bzw. Basis der Namensrechte). */
  value: number;
  years: number;
  /** Erlaubte Laufzeiten der Fläche. */
  range: [number, number];
  bonuses: SponsorBonuses;
  /** Klauseln des Angebots (ohne Verlängerungsoption – die ist ein eigener Punkt). */
  clauses: SponsorClause[];
  /** Angebot enthält eine Verlängerungsoption. */
  option: boolean;
  /** Option kann verlangt werden (Trikot, Premium …). */
  optionOk: boolean;
  /** Interesse des Sponsors 0–1 (aus dem Angebot). */
  interest: number;
  renewal?: boolean;
}

/** Deine Forderung bzw. sein Gegenvorschlag. */
export interface SponsorTerms {
  value: number;
  years: number;
  bonuses: SponsorBonuses;
  /** Indizes der gestrichenen Klauseln (in base.clauses). */
  drop: number[];
  option: boolean;
}

export interface SponsorNegCtx {
  /** Chance je Saison: Meister, Pokalsieg, Europapokal-Teilnahme, Klassenerhalt. */
  p: Record<BonusKey, number>;
  seed: string;
}

export interface SponsorDemand {
  /** Verdeckte Obergrenze (Kosten pro Jahr, die er gerade noch trägt). */
  limit: number;
  weights: Record<string, number>;
}

export const SPONSOR_MAX_ROUNDS = 4;

/** Ausgangslage aus dem Angebot. */
export function openTerms(b: SponsorBase): SponsorTerms {
  return { value: b.value, years: b.years, bonuses: { ...b.bonuses }, drop: [], option: b.option };
}

/** Wie wichtig dem Sponsor eine Klausel ist (0–3). */
export function clauseWeight(k: SponsorClause): number {
  switch (k.kind) {
    case 'camp': case 'exclusive': return 3;
    case 'minPlace': case 'relegationExit': case 'relegationCut': return 2;
    case 'friendly': case 'option': return 1;
    default: return 3;
  }
}

/** Erwartete Kosten der Prämien je Saison (Europapokal: halbe Prämie für die Teilnahme, wie sponsorSeasonClose). */
function bonusCost(bn: SponsorBonuses, c: SponsorNegCtx): number {
  return (bn.title ?? 0) * c.p.title + (bn.cup ?? 0) * c.p.cup + (bn.euro ?? 0) * 0.5 * c.p.euro + (bn.survive ?? 0) * c.p.survive;
}

/** Kosten eines Pakets für den Sponsor pro Jahr (gleiche Einheit wie `value`). */
export function sponsorCost(t: SponsorTerms, b: SponsorBase, c: SponsorNegCtx): number {
  // Längere Laufzeit nimmt er gern: +2 % Spielraum je Jahr (wie counterOffer in engine/sponsorship.ts).
  let v = t.value / (1 + (t.years - b.years) * 0.02);
  v += bonusCost(t.bonuses, c);
  for (const i of t.drop) { const k = b.clauses[i]; if (k && !clauseFixed(k)) v += clausePremium(k) * b.value; }
  if (t.option && !b.option) v += OPTION_PREMIUM * b.value;
  if (!t.option && b.option) v -= OPTION_PREMIUM * b.value;
  return v;
}

export function buildSponsorDemand(b: SponsorBase, c: SponsorNegCtx): SponsorDemand {
  const h = hash01(`${c.seed}|limit`);
  const margin = 0.04 + 0.22 * clamp(b.interest, 0, 1) + 0.06 * (h - 0.5) + (b.renewal ? 0.03 : 0);
  const weights: Record<string, number> = { value: 3, years: 1, title: 1, cup: 1, euro: 1, survive: 1, option: 1 };
  b.clauses.forEach((k, i) => { weights[`c${i}`] = clauseWeight(k); });
  return { limit: sponsorCost(openTerms(b), b, c) * (1 + margin), weights };
}

export type SponsorAnswerKind = 'accept' | 'close' | 'gap' | 'far' | 'insult';
export interface SponsorAnswer {
  kind: SponsorAnswerKind; accepted: boolean; ratio: number; patienceLoss: number;
  focus?: SponsorPoint; counter?: SponsorTerms;
}

/** Wo drückt ihn deine Forderung am meisten (für seinen Hinweis)? */
function focusOf(t: SponsorTerms, cur: SponsorTerms, b: SponsorBase, c: SponsorNegCtx): SponsorPoint | undefined {
  const base = sponsorCost(t, b, c);
  let worst: SponsorPoint | undefined, gain = 0.004 * b.value;
  const probes: [SponsorPoint, SponsorTerms][] = [['value', { ...t, value: Math.min(t.value, cur.value) }]];
  for (const k of BONUS_KEYS) probes.push([k, { ...t, bonuses: { ...t.bonuses, [k]: Math.min(t.bonuses[k] ?? 0, cur.bonuses[k] ?? 0) } }]);
  for (const i of t.drop) probes.push([`c${i}`, { ...t, drop: t.drop.filter((x) => x !== i) }]);
  if (t.option && !cur.option) probes.push(['option', { ...t, option: false }]);
  for (const [k, p] of probes) { const g = base - sponsorCost(p, b, c); if (g > gain) { gain = g; worst = k; } }
  return worst;
}

/** Antwort auf deine Forderung (deterministisch aus Seed, Runde und Forderung). */
export function sponsorAnswer(t: SponsorTerms, b: SponsorBase, c: SponsorNegCtx, cur: SponsorTerms, round: number, locks: readonly SponsorPoint[] = []): SponsorAnswer {
  const d = buildSponsorDemand(b, c);
  const cost = sponsorCost(t, b, c);
  const jitter = (hash01(`${c.seed}|${round}|${Math.round(t.value)}|${t.years}|${t.drop.join(',')}`) - 0.5) * 0.02;
  const ratio = cost / Math.max(1, d.limit);
  if (ratio <= 1 + jitter) return { kind: 'accept', accepted: true, ratio, patienceLoss: 0 };
  const kind: SponsorAnswerKind = ratio > 1.25 ? 'insult' : ratio > 1.1 ? 'far' : ratio > 1.03 ? 'gap' : 'close';
  const patienceLoss = (kind === 'insult' ? 48 : kind === 'far' ? 32 : kind === 'gap' ? 20 : 12) + Math.min(9, locks.length * 3);
  return { kind, accepted: false, ratio, patienceLoss, focus: focusOf(t, cur, b, c), counter: sponsorCounter(t, cur, b, c, round, locks) };
}

/**
 * Gegenvorschlag: kommt bei Nebensachen entgegen, besteht auf den wichtigen Klauseln,
 * gleicht über den Jahresbetrag aus. Sein Angebot wird nie schlechter als das letzte
 * und nie besser als deine Forderung; übernimmst du es unverändert, sagt er zu.
 */
export function sponsorCounter(t: SponsorTerms, cur: SponsorTerms, b: SponsorBase, c: SponsorNegCtx, round: number, locks: readonly SponsorPoint[] = []): SponsorTerms {
  const d = buildSponsorDemand(b, c);
  const locked = new Set<string>(locks);
  const x: SponsorTerms = { ...cur, bonuses: { ...cur.bonuses }, drop: [...cur.drop] };
  x.years = clamp(t.years, b.range[0], b.range[1]);
  for (const k of BONUS_KEYS) {
    const want = t.bonuses[k] ?? 0, have = cur.bonuses[k] ?? 0;
    x.bonuses[k] = locked.has(k) || want <= have ? want : r500(have + (want - have) * clamp(0.35 + 0.15 * round, 0.35, 0.8)) || undefined;
  }
  // Klauseln: Nebensachen streicht er, Kernpunkte erst spät (oder nie, wenn fest).
  x.drop = t.drop.filter((i) => {
    const k = b.clauses[i];
    if (!k || clauseFixed(k)) return false;
    if (locked.has(`c${i}`)) return true;
    const w = clauseWeight(k);
    return w <= 1 || (w === 2 && round >= 2) || (w >= 3 && round >= 3);
  });
  x.option = locked.has('option') || !t.option || b.option ? t.option : round >= 2;
  // Jahresbetrag: Er rückt mit jeder Runde näher an seine Obergrenze.
  const limit = d.limit * 0.985;
  const open = sponsorCost(openTerms(b), b, c);
  const target = Math.max(sponsorCost(cur, b, c), limit - Math.max(0, limit - open) * Math.max(0, 1 - 0.35 * round));
  const yf = 1 + (x.years - b.years) * 0.02;
  if (locked.has('value')) {
    x.value = t.value;
    // Betrag steht fest: Prämien zurück auf sein Angebot, dann Klauseln behalten.
    if (sponsorCost(x, b, c) > limit) for (const k of BONUS_KEYS) if (!locked.has(k)) x.bonuses[k] = Math.min(x.bonuses[k] ?? 0, cur.bonuses[k] ?? 0) || undefined;
    if (sponsorCost(x, b, c) > limit) x.drop = x.drop.filter((i) => locked.has(`c${i}`));
  } else {
    const rest = sponsorCost({ ...x, value: 0 }, b, c);
    x.value = r500(Math.min(Math.max(t.value, cur.value), Math.max(cur.value, (target - rest) * yf)));
    // Sein Vorschlag muss ihm sicher passen (auch nach dem Runden).
    for (let i = 0; i < 80 && sponsorCost(x, b, c) > limit && x.value > 500; i++) x.value -= 500;
  }
  return x;
}

/** Summe über die Laufzeit inklusive erwarteter Prämien (für die Anzeige, gleiche Einheit wie `value`). */
export function sponsorTotal(t: SponsorTerms, c: SponsorNegCtx): { year: number; total: number; bonus: number } {
  const bonus = bonusCost(t.bonuses, c);
  return { year: t.value, total: (t.value + bonus) * t.years, bonus };
}

/** Klauseln des Vertrags aus dem Paket (Option als eigene Klausel). */
export function termsClauses(t: SponsorTerms, b: SponsorBase): SponsorClause[] {
  const out = b.clauses.filter((k, i) => clauseFixed(k) || !t.drop.includes(i)).map((k) => ({ ...k }));
  if (t.option) out.push({ ...OPTION_CLAUSE });
  return out;
}

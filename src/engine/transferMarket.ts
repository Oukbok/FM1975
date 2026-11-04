// =============================================================================
// TRANSFERMARKT 2.0 — Preise, Verhandlungspositionen, Spielerinteresse
// -----------------------------------------------------------------------------
// Reine Rechenlogik ohne Spielstand. Alle Beträge sind Preisschilder in
// 1975-Basis (wie Marktwert und Gehalt); gebucht wird × economyScale.
//
// 1) Rekordkurve (data/transferRecords.ts) als weiche Obergrenze:
//    bis 70 % wirkt sie nicht, darüber wird gestaucht. Bei Spitzendeals kann
//    ein „Bieterwettstreit“ die Kurve trotzdem übertreffen (selten).
// 2) Verkäufer: Forderung und verdeckte Schmerzgrenze aus Marktwert,
//    Vertragslaufzeit, Bedeutung im Kader, Kassenlage, Rivalität, Härte.
//    Du siehst nur eine Schätzspanne, deren Genauigkeit vom Scouting abhängt.
// 3) Spieler: Mindestgehalt (verdeckt), Forderung des Beraters (sichtbar),
//    Interesse aus Persönlichkeit und Lage (engine/playerWishes.ts), Handgeld,
//    Beraterprovision, Treueprämie, Erfolgsklausel; Versprechen wirken nach
//    seinen Prioritäten und deiner Glaubwürdigkeit.
// =============================================================================
import { Club, Player } from '../types';
import { recordFeeEUR } from '../data/transferRecords';
import { DM_PER_EUR, economyScale } from './economy';
import { personaOf } from './persona';
import { ClubAppeal, WageDemand, WishPromise } from './playerWishes';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}

// -----------------------------------------------------------------------------
// 1) Kurve und weiche Obergrenze
// -----------------------------------------------------------------------------
export type FeeScope = 'world' | 'germany';

/** Spitzenablöse eines Jahres als Preisschild in 1975-Basis. */
export function capBase(year: number, scope: FeeScope): number {
  return (recordFeeEUR(year, scope) * DM_PER_EUR) / economyScale(year);
}

const KNEE = 0.7;
/** Weiche Obergrenze: unter 70 % der Kurve unverändert, darüber gestaucht (nie über die Kurve). */
export function softCap(x: number, cap: number): number {
  if (cap <= 0 || x <= KNEE * cap) return x;
  const over = (x / cap - KNEE) / (1 - KNEE);
  return cap * (KNEE + (1 - KNEE) * (1 - Math.exp(-over)));
}

/**
 * Bieterwettstreit: Faktor ≥ 1 für Geschäfte nahe der Kurve. Etwa jedes
 * zehnte Spitzengeschäft übertrifft die Kurve (bis +60 %).
 */
export function frenzy(fee: number, cap: number, rnd: () => number): number {
  if (fee < 0.6 * cap) return 1;
  const r = rnd();
  if (r < 0.1) return 1.05 + rnd() * 0.55;
  if (r < 0.35) return 1 + rnd() * 0.1;
  return 1;
}

/** Rohwert (baseMarketValue) eines 25-jährigen Spielers mit Stärke 90 – Bezugspunkt der Kurve. */
const ELITE_RAW = 1_000_000 * 4 * 1.15;

/**
 * Marktwert am deutschen Markt: proportional zur Kurve, sodass ein Spieler mit
 * Stärke 90 etwa die deutsche Spitzenablöse wert ist; darüber weich gedeckelt
 * (höchstens 1,3 × Kurve). Auslandsvereine rechnen mit der Weltkurve.
 */
export function cappedMarketValue(raw: number, year: number, scope: FeeScope = 'germany'): number {
  const cap = capBase(year, scope) * (scope === 'germany' ? 1 : 0.8);
  const v = softCap(raw * (cap / ELITE_RAW), cap * 1.3);
  return Math.max(2000, Math.round(v / 1000) * 1000);
}

// -----------------------------------------------------------------------------
// 2) Verkäufer
// -----------------------------------------------------------------------------
export interface SellerPosition {
  /** Eröffnungsforderung (1975-Basis). */
  asking: number;
  /** Verdeckte Schmerzgrenze: darunter verkauft der Verein nie. */
  walkaway: number;
  /** Verhandlungshärte 0..1 (verdeckt). */
  hardness: number;
  /** Schlüsselspieler, eigentlich unverkäuflich. */
  untouchable: boolean;
  /** Geduld zu Beginn (0..100). */
  patience: number;
  /** Gründe (für vage Hinweise). */
  notes: string[];
}

export interface SellerCtx {
  year: number;
  /** Monate Restlaufzeit des Vertrags. */
  monthsLeft: number;
  /** Ablösefreiheit nach Vertragsende aktiv (Bosman). */
  bosman: boolean;
  /** Kader des Verkäufers. */
  squad: Player[];
  /** Käufer ist Rivale (Derby, direkter Konkurrent). */
  rival: boolean;
  scope: FeeScope;
  /** Käufer ist direkter Tabellennachbar (Konkurrent um dieselben Ziele). */
  competitor?: boolean;
}

export function sellerPosition(p: Player, seller: Club, buyer: Club, ctx: SellerCtx): SellerPosition {
  const notes: string[] = [];
  let f = 1;
  // Vertragslaufzeit
  if (ctx.monthsLeft >= 36) { f *= 1.25; notes.push('langer Vertrag'); }
  else if (ctx.monthsLeft >= 24) f *= 1.1;
  else if (ctx.monthsLeft >= 12) f *= 0.95;
  else if (ctx.bosman) { f *= ctx.monthsLeft <= 6 ? 0.45 : 0.65; notes.push('Vertrag läuft aus'); }
  else f *= 0.9;
  // Bedeutung im Kader
  const rank = [...ctx.squad].sort((a, b) => b.overall - a.overall).findIndex((x) => x.id === p.id);
  if (rank >= 0 && rank < 3) { f *= 1.3; notes.push('Leistungsträger'); }
  else if (rank >= 0 && rank < 11) f *= 1.1;
  else { f *= 0.88; notes.push('Ergänzungsspieler'); }
  // Kassenlage und Verkaufswille
  if (seller.finances.balance < 0) { f *= 0.85; notes.push('Geldsorgen'); }
  if (p.transferListed) { f *= 0.85; notes.push('auf der Transferliste'); }
  if ((p.contract.satisfaction ?? 60) < 45) { f *= 0.92; notes.push('Spieler will weg'); }
  // Rivale, größerer Käufer
  if (ctx.rival) { f *= 1.15; notes.push('Rivale'); }
  if (ctx.competitor) { f *= 1.08; notes.push('direkter Konkurrent'); }
  if (buyer.reputation > seller.reputation + 5) f *= 1.06;

  const hardness = hash01(seller.id + '|härte');
  f *= 0.92 + hardness * 0.25;

  const untouchable = rank === 0 && seller.reputation >= buyer.reputation && p.age <= 29 && !p.transferListed;
  if (untouchable) { f *= 1.5; notes.push('unverkäuflich'); }

  const cap = capBase(ctx.year, ctx.scope);
  const raw = Math.max(5000, p.contract.transferValue * f);
  const asking = Math.round(Math.max(raw * 0.6, softCap(raw, cap * (untouchable ? 1.3 : 1))) / 5000) * 5000;
  const walkFactor = (untouchable ? 0.92 : 0.84 + hardness * 0.12) * (p.transferListed || seller.finances.balance < 0 ? 0.92 : 1);
  const walkaway = Math.round(asking * walkFactor / 5000) * 5000;
  const patience = Math.round(55 + (1 - hardness) * 35);
  return { asking, walkaway, hardness, untouchable, patience, notes };
}

/**
 * Angebotspaket an den Verkäufer: Ablöse, Raten (2 oder ab 1990 auch 3),
 * Weiterverkaufsbeteiligung, Erfolgsprämie, Spieler-Tausch (Wert aus Sicht des
 * Verkäufers), Rückkaufoption für den Verkäufer, Leihe mit Kaufoption.
 */
export interface ClubPackage {
  fee: number; installments: boolean; sellOn: number; bonus: number;
  /** Anzahl Raten bei `installments` (Standard 2). */
  rates?: 2 | 3;
  /** Eigener Spieler im Tausch und sein Wert für den Verkäufer (1975-Basis). */
  swapPlayerId?: string; swapValue?: number;
  /** Rückkaufoption für den Verkäufer (Preis, 0/undefined = keine). */
  buyBack?: number;
  /** Leihe für eine Saison: `fee` = Leihgebühr, `optionFee` = Kaufoption. */
  loan?: boolean; optionFee?: number;
}
export function packageValue(o: ClubPackage): number {
  if (o.loan) return o.fee + (o.optionFee ?? 0) * 0.6 + (o.swapValue ?? 0);
  const rate = o.installments ? (o.rates === 3 ? 0.89 : 0.93) : 1;
  return o.fee * rate + o.fee * clamp(o.sellOn, 0, 0.3) * 0.5 + o.bonus * 0.45 + (o.swapValue ?? 0)
    + (o.buyBack ? Math.min(o.fee * 0.08, o.buyBack * 0.05) : 0);
}

export type ClubAnswer =
  | { kind: 'accept'; text: string }
  | { kind: 'counter'; ask: number; text: string; patienceLoss: number }
  | { kind: 'breakoff'; text: string };

/**
 * Antwort des Verkäufers. `currentAsk` = zuletzt genannte Forderung.
 * Nahe an der Forderung reicht oft schon ein Schritt; über der Schmerzgrenze
 * wird es mit jeder Runde wahrscheinlicher, dass er einschlägt.
 */
export function clubAnswer(pos: SellerPosition, currentAsk: number, offer: ClubPackage, round: number, patience: number, rnd: () => number): ClubAnswer {
  const v = packageValue(offer);
  if (v >= currentAsk * 0.985 || (v >= pos.walkaway && rnd() < 0.15 + 0.15 * round)) {
    return { kind: 'accept', text: pos.untouchable ? 'Schweren Herzens – bei diesem Angebot können wir nicht Nein sagen.' : 'Einverstanden, wir sind uns einig.' };
  }
  const ratio = v / currentAsk;
  const loss = ratio < 0.6 ? 35 : ratio < 0.85 ? 18 : 8;
  if (patience - loss <= 0) return { kind: 'breakoff', text: 'Wir sehen keine Grundlage mehr. Die Gespräche sind beendet.' };
  const conc = clamp(0.18 + 0.08 * Math.min(round, 3) - pos.hardness * 0.1, 0.08, 0.45);
  const ask = Math.round(Math.max(pos.walkaway * (1 + (1 - Math.min(1, round / 4)) * 0.04), currentAsk - (currentAsk - v) * conc) / 5000) * 5000;
  const text = ratio < 0.6 ? 'Das ist kein ernsthaftes Angebot. So verlieren wir die Lust an Gesprächen.'
    : ratio < 0.85 ? 'Wir liegen noch weit auseinander. Da müsst ihr deutlich drauflegen.'
      : ratio < 0.95 ? 'Wir nähern uns an – ein Stück fehlt noch.'
        : 'Fast. Ein kleiner Schritt noch.';
  return { kind: 'counter', ask: Math.max(ask, Math.round(v / 5000) * 5000 + 5000), text, patienceLoss: loss };
}

/** Schätzspanne der Forderung: Breite und Abweichung hängen vom Wissen ab (0..1). */
export function estimateRange(value: number, knowledge: number, seed: string): [number, number] {
  const err = 0.32 - 0.22 * clamp(knowledge, 0, 1);
  const bias = (hash01(seed) * 2 - 1) * err * 0.6;
  const mid = value * (1 + bias);
  const r = (x: number) => Math.round(x / 10000) * 10000;
  return [r(mid * (1 - err / 2)), r(mid * (1 + err / 2))];
}

/** Höchstbetrag eines KI-Käufers (verdeckt). */
export function aiMaxPay(p: Player, buyer: Club, year: number, scope: FeeScope, rnd: () => number): number {
  const need = 1 + clamp((p.overall - 75) / 60, 0, 0.25);
  const raw = p.contract.transferValue * (1.0 + rnd() * 0.35) * need;
  const cap = capBase(year, scope);
  const capped = softCap(raw, cap) * frenzy(raw, cap, rnd);
  return Math.round(Math.min(capped, Math.max(0, buyer.finances.transferBudget)) / 5000) * 5000;
}

// -----------------------------------------------------------------------------
// 3) Spieler (Persönlichkeit und Wünsche: engine/persona.ts, engine/playerWishes.ts)
// -----------------------------------------------------------------------------
export type PromiseType = WishPromise;

export const PROMISES: Record<PromiseType, { label: string; desc: string; check: string }> = {
  stammplatz: { label: 'Stammplatz', desc: 'Er spielt von Anfang an.', check: 'Mindestens 60 % der Ligaspiele in der Startelf.' },
  kapitaen: { label: 'Kapitänsbinde', desc: 'Er wird Kapitän.', check: 'Spätestens zum Saisonende Kapitän.' },
  europa: { label: 'Europapokal', desc: 'Wir spielen international.', check: 'Platz 1–5 am Saisonende.' },
  titel: { label: 'Um Titel spielen', desc: 'Wir greifen oben an.', check: 'Platz 1–3 am Saisonende.' },
  stars: { label: 'Weitere Verstärkungen', desc: 'Wir holen weitere Topspieler.', check: 'Bis Saisonende mindestens ein Zugang mindestens so stark wie er (−3).' },
  entwicklung: { label: 'Einsätze zur Entwicklung', desc: 'Er bekommt Spielpraxis.', check: 'Mindestens 15 Pflichtspiele in der Saison (nur bis 21 J.).' },
  freigabe: { label: 'Freigabe bei Topangebot', desc: 'Kommt ein größerer Verein, darf er gehen.', check: 'Du lehnst kein Angebot eines größeren Vereins für ihn ab.' },
  umzug: { label: 'Umzug & Familie', desc: 'Wohnung, Schule, Sprachkurs – wir kümmern uns.', check: 'Sofort erfüllt (kostet einmalig etwas).' },
  wunschposition: { label: 'Wunschposition', desc: 'Er spielt auf seiner Stammposition.', check: 'Am Saisonende in der Startelf in seinem Mannschaftsteil.' },
  keinRivale: { label: 'Kein Verkauf an Rivalen', desc: 'Wir geben ihn nie an einen Rivalen ab.', check: 'Gebrochen, sobald du ihn an einen Rivalen verkaufst.' },
};

/** Ab wann gibt es welche Vertrags- und Ablöse-Bausteine (deutscher Markt, vereinfacht)? */
export const CLAUSE_FROM = {
  /** Ausstiegsklauseln: in Spanien seit 1985 Pflicht, in Deutschland erst nach Bosman verbreitet. */
  releaseClause: 1996,
  /** Leihe mit Kaufoption: ab den 2000ern üblich. */
  loanOption: 2000,
  /** Rückkaufoption: ab Mitte der 2000er. */
  buyBack: 2005,
  /** Ratenzahlung in drei Raten. */
  threeRates: 1990,
} as const;

export interface PlayerStance {
  /** Verdecktes Mindestgehalt (Woche, 1975-Basis). */
  minWage: number;
  /** Forderung des Beraters bzw. des Spielers (sichtbar). */
  agentWage: number;
  years: [number, number];
  /** Interesse am Verein 0..100 (verdeckt; Anzeige als Stufe). */
  interest: number;
  /** Prioritäten (wichtigste zuerst) mit Gewicht 0..12. */
  priorities: [PromiseType, number][];
  /** Sichtbare Gründe mit Richtung. */
  reasons: { label: string; sign: -1 | 1; value: number }[];
  /** Erwartetes Handgeld und Beraterprovision (Einmalzahlungen). */
  signingFee: number;
  agentFee: number;
  agent: boolean;
  /** Verzicht (+) / Aufschlag (−) gegenüber dem Normalgehalt. */
  cut: number;
  market: number;
  dealBreaker?: string;
}

export function stanceFrom(appeal: ClubAppeal, d: WageDemand, priorities: [PromiseType, number][]): PlayerStance {
  return {
    minWage: d.min, agentWage: d.ask, years: d.years, interest: appeal.score, priorities,
    reasons: appeal.factors.map((f) => ({ label: f.label, sign: f.value >= 0 ? 1 : -1, value: f.value })),
    signingFee: d.signingFee, agentFee: d.agentFee, agent: d.agent, cut: d.cut, market: d.market, dealBreaker: appeal.dealBreaker,
  };
}

export interface PlayerOffer {
  wage: number; years: number; signingFee: number; releaseClause: boolean; promises: PromiseType[];
  /** Treueprämie bei Vertragsende (Einmalzahlung, 1975-Basis). */
  loyaltyBonus?: number;
  /** Gehaltssteigerung bei Europapokal-Platz (Anteil, z. B. 0,15). */
  successRaise?: number;
  /** Provision für den Berater (Einmalzahlung). */
  agentFee?: number;
  /** Vertrag 2.0 (Verhandlungstisch): Gegenwert weiterer Bausteine als Wochengehalt (kann negativ sein). */
  extrasWeekly?: number;
  /** Höhe der Ausstiegsklausel (sonst Standard 1,8 × Ablöse/Marktwert). */
  releaseAmount?: number;
  /** Weitere Bausteine, die beim Wechsel in den Vertrag geschrieben werden (game/contractClausesGame.ts). */
  extras?: { appearance: number; goal: number; cleanSheet: number; title: number; stay: number; raise: number; option: 'none' | 'club' | 'player'; relegation: number; fixedFee: number };
}

export interface PlayerAnswer { accepted: boolean; score: number; text: string; hint?: string }

/** Wert der Versprechen (gedeckelt; zu viele wirken unglaubwürdig). */
export function promiseValue(st: PlayerStance, promises: PromiseType[], trust: number): number {
  const w = new Map(st.priorities);
  const vals = promises.map((t) => w.get(t) ?? 0).sort((a, b) => b - a);
  const credibility = clamp(trust / 70, 0.2, 1.3) * (promises.length > 3 ? 0.6 : 1);
  return ((vals[0] ?? 0) + (vals[1] ?? 0) * 0.7 + (vals[2] ?? 0) * 0.5 + vals.slice(3).reduce((s, v) => s + v * 0.2, 0)) * credibility;
}

/** Gehalt inklusive Handgeld, Treueprämie und Erfolgsklausel – wie der Spieler es bewertet. */
export function effectiveWage(p: Player, o: PlayerOffer, euroLikely: boolean): number {
  const pe = personaOf(p);
  const weeks = Math.max(1, o.years * 52);
  return o.wage + (o.signingFee / weeks) * (0.6 + pe.geld / 125) + ((o.loyaltyBonus ?? 0) / weeks) * 0.55
    + (o.successRaise ?? 0) * o.wage * (euroLikely ? 0.6 : 0.3) * (0.5 + pe.ehrgeiz / 100)
    + (o.extrasWeekly ?? 0);
}

export function playerAnswer(p: Player, st: PlayerStance, o: PlayerOffer, trust: number, round: number, rnd: () => number, euroLikely = false): PlayerAnswer {
  const pe = personaOf(p);
  if (st.dealBreaker) return { accepted: false, score: 0, text: `${p.lastName} lehnt ab.`, hint: st.dealBreaker };
  const ratio = effectiveWage(p, o, euroLikely) / Math.max(1, st.minWage);
  if (st.interest < 25 && !(ratio >= 1.35 && pe.geld >= 60)) {
    return { accepted: false, score: st.interest, text: `${p.lastName} hat kein Interesse an einem Wechsel zu euch.`, hint: 'Ein Verein wie eurer reizt ihn nicht – höchstens sehr viel Geld könnte ihn umstimmen.' };
  }
  const wageScore = clamp((ratio - 1) * 70, -45, 22);
  const agentShort = st.agent && st.agentFee > 0 ? clamp(1 - (o.agentFee ?? 0) / st.agentFee, 0, 1) : 0;
  const feeShort = st.signingFee > 0 && o.signingFee < st.signingFee * 0.5 ? 4 * (pe.geld / 60) : 0;
  let score = 55 + wageScore + promiseValue(st, o.promises, trust) + (st.interest - 50) * 0.35 - agentShort * 12 - feeShort
    + (o.releaseClause ? (pe.ehrgeiz - 40) / 8 + (pe.abenteuer - 50) / 20 : 0);
  if (o.years < st.years[0] || o.years > st.years[1]) score -= 12;
  score += (rnd() - 0.5) * 6;
  if (score >= 60) return { accepted: true, score, text: `${p.lastName} sagt zu.` };
  const missingTop = st.priorities.find(([t]) => !o.promises.includes(t));
  const hint = ratio < 0.95 ? (st.agent ? 'Sein Berater: „Beim Gehalt müsst ihr nachlegen.“' : `${p.lastName}: „Beim Gehalt müsst ihr nachlegen.“`)
    : agentShort > 0.3 ? 'Sein Berater besteht auf seiner Provision.'
      : o.years < st.years[0] || o.years > st.years[1] ? `Er möchte ${st.years[0]}–${st.years[1]} Jahre unterschreiben.`
        : feeShort > 0 ? 'Ohne ordentliches Handgeld unterschreibt er nicht.'
          : missingTop && round >= 1 ? `Ihm geht es vor allem um: ${PROMISES[missingTop[0]].label}.`
            : 'Er ist noch nicht überzeugt.';
  const text = score >= 50 ? `${p.lastName} zögert – es fehlt nicht mehr viel.` : score >= 35 ? `${p.lastName} ist skeptisch.` : `${p.lastName} winkt ab.`;
  return { accepted: false, score, text, hint };
}

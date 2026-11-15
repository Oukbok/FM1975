// =============================================================================
// VERHANDLUNG MIT VEREINEN — Vorlieben des Verkäufers und sein Gegenvorschlag
// -----------------------------------------------------------------------------
// Reine Rechnung (ohne Spielstand), ergänzt engine/transferMarket.ts:
// • `sellerPrefs`: Wie bewertet DIESER Verkäufer die Bausteine? Wer Geld braucht,
//   will keine Raten (manchmal ist „Zahlung sofort“ Bedingung). Bei jungen
//   Spielern mit Zukunft ist eine Weiterverkaufsbeteiligung viel wert, bei
//   sicheren Stammkräften der Nachschlag nach Einsätzen, kleinen Vereinen ein
//   Ablösespiel gegen den großen Käufer.
// • `clubCounter`: Statt nur eine Zahl zu nennen, legt der Verkäufer ein
//   vollständiges Gegenpaket auf den Tisch, das ihm genau seine Forderung wert
//   ist: Er übernimmt deine Struktur, setzt seine Bedingungen durch, verlangt,
//   was ihm wichtig ist, und gleicht den Rest über die Ablöse aus. Punkte, die
//   du für „nicht verhandelbar“ erklärst, lässt er stehen und holt sich den Wert
//   bei den übrigen – geht das nicht, sagt er es.
// Die Skala bleibt die alte: `currentAsk` ist der Wert, den ein Paket für ihn
// haben muss (`packageValue(…, prefs)`); jedes Paket mit diesem Wert schlägt ein.
// =============================================================================
import { Club, Player } from '../types';
import { ClubPackage, FRIENDLY_UNTIL, hash01, packageValue, prefFactors, SellerPrefs } from './transferMarket';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const up5k = (x: number) => Math.max(5000, Math.ceil(x / 5000 - 1e-9) * 5000);

/** Verhandelbare Punkte eines Vereinsgesprächs. */
export type ClubClause = 'fee' | 'rates' | 'bonus' | 'euro' | 'sellOn' | 'friendly' | 'swap' | 'buyBack' | 'option';

export interface SellerStance extends SellerPrefs {
  /** Bedingung: keine Raten. */
  noRates: boolean;
  /** Von sich aus geforderte Weiterverkaufsbeteiligung (0 = keine). */
  wantsSellOn: number;
  /** Wünscht sich ein Ablösespiel. */
  wantsFriendly: boolean;
  /** Wichtigkeit je Punkt 0–3 (Anzeige als Punkte). */
  weights: Record<ClubClause, number>;
}

export interface PrefsCtx {
  year: number;
  /** Mittlere Stärke der ersten Elf des Käufers. */
  buyerLevel: number;
  /** Chance des Käufers auf einen Europapokal-Platz 0..1. */
  buyerEuro: number;
  /** Verkäufer ist ein Verein mit eigenem Stadion im Spiel (sonst kein Ablösespiel). */
  realSeller: boolean;
  /** Fassungsvermögen des Stadions des Verkäufers. */
  capacity: number;
  /** Bedarf des Verkäufers auf der Position eines Tauschspielers (0 = kein Tausch möglich). */
  swapNeed?: number;
}

/** Einnahmen eines Ablösespiels beim Verkäufer (1975-Basis): Zugkraft des Käufers, höchstens das Stadion. */
export function friendlyGate(buyerRep: number, capacity: number): number {
  const crowd = Math.min(capacity, (4000 + buyerRep * buyerRep * 2.2) * 0.75);
  return Math.round(crowd * 6 / 1000) * 1000;
}

/** Haltung dieses Verkäufers zu den Bausteinen (fest je Verein, Spieler und Lage). */
export function sellerPrefs(p: Player, seller: Club, buyer: Club, ctx: PrefsCtx): SellerStance {
  const h = (s: string) => hash01(`${seller.id}|${p.id}|${s}`);
  const broke = seller.finances.balance < 0;
  const cash = clamp(broke ? 0.85 + h('c') * 0.15 : (seller.reputation < 55 ? 0.35 : 0.1) + h('c') * 0.3, 0, 1);
  const noRates = broke && h('nr') < 0.6;
  const sellOn = clamp(0.2 + (24 - p.age) * 0.12 + (buyer.reputation > seller.reputation + 5 ? 0.15 : 0), 0.1, 1);
  const bonus = clamp(0.3 + (p.overall - ctx.buyerLevel) / 20, 0.05, 0.9);
  const canFriendly = ctx.realSeller && ctx.year <= FRIENDLY_UNTIL && buyer.reputation >= seller.reputation - 5;
  const friendlyValue = canFriendly ? friendlyGate(buyer.reputation, ctx.capacity) : 0;
  const wantsFriendly = friendlyValue > 0 && buyer.reputation >= seller.reputation + 8 && h('fr') < 0.55;
  const wantsSellOn = sellOn >= 0.85 ? 0.2 : sellOn >= 0.6 ? 0.15 : 0;
  return {
    cash, sellOn, bonus, pEuro: clamp(ctx.buyerEuro, 0, 1), friendlyValue, noRates, wantsSellOn, wantsFriendly,
    weights: {
      fee: 3, rates: noRates ? 3 : cash >= 0.5 ? 2 : 1, bonus: bonus >= 0.55 ? 2 : 1, euro: ctx.buyerEuro >= 0.45 ? 2 : 1,
      sellOn: sellOn >= 0.6 ? 3 : sellOn >= 0.35 ? 2 : 1, friendly: wantsFriendly ? 2 : friendlyValue > 0 ? 1 : 0,
      swap: (ctx.swapNeed ?? 0) >= 8 ? 2 : 1, buyBack: p.age <= 23 ? 2 : 1, option: 2,
    },
  };
}

export interface ClubCounter {
  pkg: ClubPackage;
  /** Punkte, die der Verkäufer von sich aus geändert oder verlangt hat. */
  asks: ClubClause[];
  /** Wert, der trotz allem fehlt (du hast zu viel für unverhandelbar erklärt). */
  short: number;
  /** Deine Sperre steht gegen seine Bedingung. */
  conflict?: ClubClause;
}

/**
 * Gegenpaket des Verkäufers mit dem Wert `target` (seine Forderung). `locks` = Punkte,
 * die du für nicht verhandelbar erklärt hast.
 */
export function clubCounter(offer: ClubPackage, target: number, st: SellerStance, locks: ReadonlySet<ClubClause> = new Set()): ClubCounter {
  const c: ClubPackage = { ...offer };
  const asks: ClubClause[] = [];
  let conflict: ClubClause | undefined;
  const val = () => packageValue(c, st);
  if (c.loan) {
    // Leihe: Leihgebühr bzw. Kaufoption anheben.
    const gap = target - val();
    if (gap > 0) {
      if (!locks.has('fee')) { c.fee = up5k(c.fee + gap); asks.push('fee'); }
      else if (!locks.has('option')) { c.optionFee = up5k((c.optionFee ?? 0) + gap / 0.6); asks.push('option'); }
    }
    return { pkg: c, asks, short: Math.max(0, target - val()) };
  }
  if (st.noRates && c.installments) {
    if (locks.has('rates')) conflict = 'rates';
    c.installments = false; c.rates = undefined; asks.push('rates');
  }
  if (st.wantsSellOn > (c.sellOn || 0) && !locks.has('sellOn')) { c.sellOn = st.wantsSellOn; asks.push('sellOn'); }
  if (st.wantsFriendly && !c.friendly && !locks.has('friendly')) { c.friendly = true; asks.push('friendly'); }
  if (!locks.has('fee')) {
    // Der Wert ist linear in der Ablöse: Rest abziehen, durch die Steigung teilen.
    const k = prefFactors(st, c);
    const slope = k.rate + clamp(c.sellOn, 0, 0.3) * k.sellOn;
    const rest = packageValue({ ...c, fee: 0, buyBack: undefined }, st);
    const fee = up5k((target - rest) / Math.max(0.5, slope));
    if (fee !== c.fee) { c.fee = fee; asks.push('fee'); }
    // Rückkaufoption bleibt, wie du sie angeboten hast; ihr kleiner Wert senkt nur den Abstand.
    return { pkg: c, asks, short: Math.max(0, target - val()), conflict };
  }
  // Ablöse steht fest: Er holt sich den Wert bei dem, was ihm am meisten bedeutet.
  const k = prefFactors(st, c);
  const order: ClubClause[] = (['sellOn', 'friendly', 'bonus', 'euro'] as ClubClause[]).sort((a, b) => st.weights[b] - st.weights[a]);
  for (const key of order) {
    const gap = target - val();
    if (gap <= 0) break;
    if (locks.has(key)) continue;
    if (key === 'sellOn' && c.sellOn < 0.3) {
      const need = gap / Math.max(1, c.fee * k.sellOn);
      const to = clamp(Math.ceil((c.sellOn + need) * 20 - 1e-9) / 20, c.sellOn, 0.3);
      if (to > c.sellOn) { c.sellOn = Math.round(to * 100) / 100; asks.push('sellOn'); }
    } else if (key === 'friendly' && st.friendlyValue > 0 && !c.friendly) {
      c.friendly = true; asks.push('friendly');
    } else if (key === 'bonus') {
      const to = Math.min(up5k(c.fee * 0.5), up5k(c.bonus + gap / k.bonus));
      if (to > c.bonus) { c.bonus = to; asks.push('bonus'); }
    } else if (key === 'euro') {
      const to = Math.min(up5k(c.fee * 0.3), up5k((c.euroBonus ?? 0) + gap / k.euro));
      if (to > (c.euroBonus ?? 0)) { c.euroBonus = to; asks.push('euro'); }
    }
  }
  return { pkg: c, asks: Array.from(new Set(asks)), short: Math.max(0, target - val()), conflict };
}

/** Ist dieser Punkt im Angebot aus Sicht des Verkäufers mindestens so gut wie in seinem Gegenpaket? */
export function clauseMet(key: ClubClause, o: ClubPackage, c: ClubPackage): boolean {
  switch (key) {
    case 'fee': return o.fee >= c.fee;
    case 'rates': return (o.installments ? o.rates ?? 2 : 1) <= (c.installments ? c.rates ?? 2 : 1);
    case 'bonus': return o.bonus >= c.bonus;
    case 'euro': return (o.euroBonus ?? 0) >= (c.euroBonus ?? 0);
    case 'sellOn': return o.sellOn >= c.sellOn;
    case 'friendly': return !!o.friendly || !c.friendly;
    case 'buyBack': return (o.buyBack ?? 0) > 0 || !(c.buyBack ?? 0);
    case 'option': return (o.optionFee ?? 0) >= (c.optionFee ?? 0);
    default: return true;
  }
}

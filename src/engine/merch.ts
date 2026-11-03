// =============================================================================
// Fanartikel – Rechnung (ohne Spielablauf). Der eigene Verein verkauft nicht mehr
// pauschal „Besucher × Pro-Kopf-Erlös“, sondern aus seinem Lager: Das bisherige
// Pauschal-Potenzial je Heimspiel (engine/finances.ts) wird auf das Sortiment der
// Epoche verteilt; zum Richtpreis mit vollem Lager ergibt sich exakt der alte Umsatz.
// Preis, Rabatt, Bestand und Ladenhüter verschieben ihn. KI-Vereine: unverändert.
// Ablauf/Aktionen: game/merchGame.ts · Katalog/Quellen: data/merchCatalog.ts
// =============================================================================
import type { Club } from '../types';
import type { MerchItemId, MerchItemState, MerchShop, MerchCounter } from '../types/merch';
import {
  MERCH_ITEMS, MERCH_BY_ID, MerchItemDef, merchAvailable, VOLUME_DISCOUNT, STORE_CAP, MEGASTORE_CAP,
  FLOCK_YEAR, FLOCK_SHARE, MERCH_CPI,
} from '../data/merchCatalog';
import { clubTier, revenueScale, tierScale } from './economy';

function interp(pts: [number, number][], year: number): number {
  if (year <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (year <= pts[i][0]) { const [y0, v0] = pts[i - 1], [y1, v1] = pts[i]; return v0 + (v1 - v0) * (year - y0) / (y1 - y0); }
  }
  const [yl, vl] = pts[pts.length - 1];
  return vl * Math.pow(1.02, year - yl);
}

/** Verbraucherpreise gegenüber 1975 (Stückpreise der Fanartikel). */
export function merchCPI(year: number): number {
  return interp(MERCH_CPI, year);
}

/** Preis-Skala eines Artikels im Jahr X: Verbraucherpreise × Markenaufschlag. */
export function itemPriceScale(d: MerchItemDef, year: number): number {
  return merchCPI(year) * (d.trend ? interp(d.trend, year) / Math.pow(1.02, Math.max(0, year - d.trend[d.trend.length - 1][0])) : 1);
}

/** Preiselastizität der Nachfrage (Richtpreis ≈ gewinnoptimal bei ~40 % Wareneinsatz). */
export const MERCH_ELASTICITY = 1.8;
/** Anteil der Spieltags-Nachfrage, der sofort am Spieltag gekauft wird (Rest: Nachverkauf in der Folgewoche). */
export const MATCHDAY_SHARE = 0.75;
/** Restpostenhändler zahlt diesen Anteil des Einkaufspreises. */
export const DISPOSE_RATE = 0.15;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const emptyCounter = (): MerchCounter => ({ sold: 0, rev: 0, cost: 0, lost: 0 });

/** Umsatz-Gewicht eines Artikels im Jahr X (linear zwischen den Stützpunkten). */
export function merchWeight(d: MerchItemDef, year: number): number {
  if (!merchAvailable(d, year)) return 0;
  const w = d.w;
  if (year <= w[0][0]) return w[0][1];
  for (let i = 1; i < w.length; i++) {
    if (year <= w[i][0]) {
      const [y0, v0] = w[i - 1], [y1, v1] = w[i];
      return v0 + (v1 - v0) * (year - y0) / (y1 - y0);
    }
  }
  return w[w.length - 1][1];
}

/** Umsatzanteile des Sortiments im Jahr X (Summe 1). */
export function merchShares(year: number): Partial<Record<MerchItemId, number>> {
  const ws = MERCH_ITEMS.map((d) => [d.id, merchWeight(d, year)] as const).filter(([, v]) => v > 0);
  const sum = ws.reduce((a, [, v]) => a + v, 0) || 1;
  return Object.fromEntries(ws.map(([id, v]) => [id, v / sum]));
}

export function availableItems(year: number): MerchItemDef[] {
  return MERCH_ITEMS.filter((d) => merchAvailable(d, year));
}

export function newItemState(): MerchItemState {
  return { stock: 0, stale: 0, value: 0, pf: 1, disc: 0, frac: 0, season: emptyCounter(), week: emptyCounter() };
}

/** Verkaufspreis je Stück in 1975-Basis (nach Rabatt). */
export function salePriceBase(d: MerchItemDef, st: MerchItemState): number {
  return d.price * st.pf * (1 - st.disc);
}

/** Nachfrage-Faktor aus dem Preis (1 beim Richtpreis ohne Rabatt). */
export function priceDemandFactor(st: MerchItemState): number {
  return Math.pow(Math.max(0.2, st.pf * (1 - st.disc)), -MERCH_ELASTICITY);
}

/** Anteil der Kundschaft, der zum Vorjahresmodell greift (mit Ladenhüter-Rabatt deutlich mehr). */
export function staleFactor(sdisc: number): number {
  return clamp(0.1 + sdisc * 1.3, 0, 0.8);
}

/** Preis eines Ladenhüters in 1975-Basis. */
export function stalePriceBase(d: MerchItemDef, st: MerchItemState): number {
  return d.price * st.pf * (1 - (st.sdisc ?? 0));
}

/** Mengenrabatt beim Einkauf. */
export function volumeDiscount(qty: number): number {
  for (const [n, r] of VOLUME_DISCOUNT) if (qty >= n) return r;
  return 0;
}

/** Einkaufskosten (nominal) für qty Stück. */
export function orderCost(d: MerchItemDef, qty: number, year: number): number {
  return Math.round(qty * d.cost * itemPriceScale(d, year) * (1 - volumeDiscount(qty)));
}

/**
 * Wachstum der Stückzahlen gegenüber 1975: Das Fanartikel-Potenzial wächst mit der
 * Vermarktung (wie engine/finances.ts `scalesFor().merch` ohne Marke; enthält die Finanzbasis),
 * Preise je Stück nur mit den Verbraucherpreisen – die Differenz sind mehr verkaufte Stücke.
 */
export function unitGrowth(club: Club, year: number): number {
  const comm = tierScale(revenueScale('commercial', year), clubTier(club), 'commercial');
  return Math.max(0.6, (1 + (comm - 1) * 0.55) / merchCPI(year));
}

/** Lagerplätze: Fanshop-Stufe + Megastore im Umfeld, wachsen mit dem Markt. */
export function storeCapacity(club: Club, year: number): number {
  const lvl = clamp(Math.round(club.infrastructure?.merchandising ?? 1), 0, 5);
  const mega = club.grounds?.modules?.megastore?.level ?? 0;
  return Math.round(STORE_CAP[lvl] * (1 + MEGASTORE_CAP * mega) * unitGrowth(club, year) / 50) * 50;
}

/** Belegte Lagerplätze. */
export function storeUsed(shop: MerchShop): number {
  let u = 0;
  for (const [id, st] of Object.entries(shop.items)) u += ((st?.stock ?? 0) + (st?.stale ?? 0)) * (MERCH_BY_ID[id as MerchItemId]?.vol ?? 1);
  return Math.round(u);
}

/** Wert des Lagers (Einstandswert, nominal). */
export function storeValue(shop: MerchShop): number {
  return Math.round(Object.values(shop.items).reduce((a, st) => a + (st?.value ?? 0), 0));
}

/** Stück, die ein Potenzial (nominal, zum Richtpreis) bei einem Artikel bedeutet – ohne Preis-/Lagerwirkung. */
export function potUnits(d: MerchItemDef, potNominal: number, year: number): number {
  const share = merchShares(year)[d.id] ?? 0;
  return share * potNominal / (d.price * itemPriceScale(d, year));
}

/** Gilt die Zugkraft der Stars für diesen Artikel? (Trikot; vor der Beflockung Poster) */
export function isPlayerItem(id: MerchItemId, year: number): boolean {
  return id === 'trikot' ? true : id === 'poster' && year < FLOCK_YEAR;
}

/** Stück eines Verkaufs, die einem Spieler zugeordnet werden. */
export function playerUnits(id: MerchItemId, sold: number, year: number): number {
  if (year >= FLOCK_YEAR) return id === 'trikot' ? sold * FLOCK_SHARE : 0;
  return id === 'poster' ? sold : 0;
}

function addTo(c: MerchCounter, sold: number, rev: number, lost: number) {
  c.sold += sold; c.rev += rev; c.lost += lost;
}

/**
 * Verkauf aus dem Lager: Potenzial (nominal, zum Richtpreis) → Stück je Artikel →
 * begrenzt durch Bestand. Bucht nichts, sondern liefert den Erlös (nominal).
 */
export function sellFromStock(shop: MerchShop, potNominal: number, year: number): { rev: number; sold: number } {
  const shares = merchShares(year);
  let rev = 0, sold = 0;
  for (const d of MERCH_ITEMS) {
    const share = shares[d.id];
    if (!share) continue;
    const st = shop.items[d.id] ?? (shop.items[d.id] = newItemState());
    const boost = isPlayerItem(d.id, year) ? (shop.boost ?? 1) : 1;
    const eS = itemPriceScale(d, year);
    const want = share * potNominal / (d.price * eS) * priceDemandFactor(st) * boost + st.frac;
    const whole = Math.floor(want);
    st.frac = want - whole;
    // Ladenhüter: ein Teil der Kundschaft nimmt das Vorjahresmodell (statt des neuen),
    // fehlt das neue, greifen mehr zum alten. Ohne Ladenhüter alles wie gehabt.
    const sf = staleFactor(st.sdisc ?? 0);
    const old1 = Math.min(st.stale, Math.round(whole * sf * 0.4));
    const freshWant = whole - old1;
    const fresh = Math.min(st.stock, freshWant);
    const short = freshWant - fresh;
    const old2 = Math.min(st.stale - old1, Math.round(short * sf));
    const old = old1 + old2;
    const lost = short - old2;
    const unitCost = st.stock + st.stale > 0 ? st.value / (st.stock + st.stale) : 0;
    st.stock -= fresh; st.stale -= old;
    st.value = Math.max(0, st.value - unitCost * (fresh + old));
    const r = Math.round((fresh * salePriceBase(d, st) + old * stalePriceBase(d, st)) * eS);
    addTo(st.season, fresh + old, r, lost);
    addTo(st.week, fresh + old, r, lost);
    shop.plUnits += playerUnits(d.id, fresh + old, year);
    rev += r; sold += fresh + old;
  }
  return { rev, sold };
}

/** Bestellung einbuchen (ohne Geld). Liefert die tatsächlich gelieferte Menge (Lagerplatz). */
export function receiveOrder(shop: MerchShop, club: Club, id: MerchItemId, qty: number, year: number): { qty: number; cost: number } {
  const d = MERCH_BY_ID[id];
  const free = Math.max(0, storeCapacity(club, year) - storeUsed(shop));
  const n = Math.max(0, Math.min(Math.floor(qty), Math.floor(free / d.vol)));
  if (n <= 0) return { qty: 0, cost: 0 };
  const cost = orderCost(d, n, year);
  const st = shop.items[id] ?? (shop.items[id] = newItemState());
  st.stock += n; st.value += cost;
  st.season.cost += cost; st.week.cost += cost;
  return { qty: n, cost };
}

/** Saisonumsatz / -einkauf / -gewinn des Ladens. */
export function seasonTotals(shop: MerchShop): MerchCounter {
  const t = emptyCounter();
  for (const st of Object.values(shop.items)) if (st) { t.sold += st.season.sold; t.rev += st.season.rev; t.cost += st.season.cost; t.lost += st.season.lost; }
  return t;
}

/** Laufende Woche gesamt. */
export function weekTotals(shop: MerchShop): MerchCounter {
  const t = emptyCounter();
  for (const st of Object.values(shop.items)) if (st) { t.sold += st.week.sold; t.rev += st.week.rev; t.cost += st.week.cost; t.lost += st.week.lost; }
  return t;
}

// =============================================================================
// Fanartikel – Spielablauf des eigenen Vereins (optionales `Club.merchShop`).
// Tageslauf `merchDaily` (day.ts): Saisonwechsel (Archiv, Modellwechsel → Ladenhüter),
// Montag = Wochenabschluss (Nachverkauf, Trikots je Spieler, Assistent bestellt nach).
// Verkauf am Spieltag: engine/finances.ts `bookMerch` → engine/merch.ts `sellFromStock`.
// =============================================================================
import type { Club, Player } from '../types';
import { POSITION_GROUPS } from '../types';
import type { MerchItemId, MerchShop } from '../types/merch';
import { Game } from './state';
import { MERCH_BY_ID, MERCH_ITEMS, merchAvailable, newKitSeason, FLOCK_YEAR } from '../data/merchCatalog';
import {
  DISPOSE_RATE, availableItems, emptyCounter, isPlayerItem, newItemState, orderCost, potUnits,
  priceDemandFactor, receiveOrder, sellFromStock, storeCapacity, storeUsed, volumeDiscount,
} from '../engine/merch';
import { book, expectedAttendance, merchPotential } from '../engine/finances';
import { clubTier, formatMoney, yearOf } from '../engine/economy';
import { merchGlobalAnnual } from '../engine/sponsorship';
import { makeMessage, pushMessage } from '../engine/messages';

/** Heimspiele je Woche im Saisonmittel (Liga + Pokal, inkl. Sommer- und Winterpause). */
export const HOME_PER_WEEK = 0.42;
/** Assistent: nachbestellen unter … Wochen Vorrat, auffüllen auf … Wochen. */
const AUTO_LOW = 4, AUTO_FILL = 9;

function seasonOf(date: string): string {
  const y = Number(date.slice(0, 4));
  const s = Number(date.slice(5, 7)) >= 7 ? y : y - 1;
  return `${s}/${String((s + 1) % 100).padStart(2, '0')}`;
}
function addDays(iso: string, n: number): string {
  return new Date(Date.parse(iso + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
}
function mondayOf(iso: string): string {
  const wd = new Date(iso + 'T00:00:00Z').getUTCDay();
  return addDays(iso, -((wd + 6) % 7));
}
const ownClub = (g: Game): Club | undefined => g.clubs[g.managedClubId];
const isHuman = (g: Game) => !(g as any).simAutoManage;

// -----------------------------------------------------------------------------
// Nachfrage-Schätzung (für Assistent, Vorschau und Startbestand)
// -----------------------------------------------------------------------------
/** Erwartetes Fanartikel-Potenzial je Woche (nominal, Richtpreis). */
export function weeklyPotential(club: Club, date: string): number {
  const att = expectedAttendance(club, undefined, yearOf(date));
  return merchPotential(club, att, date) * HOME_PER_WEEK;
}

/** Erwartete Nachfrage je Woche in Stück (mit Preis/Rabatt und Zugkraft der Stars). */
export function weeklyUnits(club: Club, shop: MerchShop, id: MerchItemId, date: string): number {
  const d = MERCH_BY_ID[id];
  const y = yearOf(date);
  const st = shop.items[id] ?? newItemState();
  const boost = isPlayerItem(id, y) ? (shop.boost ?? 1) : 1;
  return potUnits(d, weeklyPotential(club, date), y) * priceDemandFactor(st) * boost;
}

// -----------------------------------------------------------------------------
// Anlegen / Nachrüsten
// -----------------------------------------------------------------------------
function createShop(club: Club, today: string): MerchShop {
  const shop: MerchShop = {
    v: 1, season: seasonOf(today), auto: true, items: {}, pending: 0, weekStart: mondayOf(today),
    weeks: [], plUnits: 0, jersey: {}, jerseyW: {}, pot: 0, archive: [], orders: [], boost: 1,
  };
  // Startbestand: gut sechs Wochen Nachfrage, ohne Kosten (war schon im Lager).
  const y = yearOf(today);
  const cap = storeCapacity(club, y);
  const items = availableItems(y);
  const want = items.map((d) => Math.round(weeklyUnits(club, shop, d.id, today) * 6));
  const vol = items.reduce((a, d, i) => a + want[i] * d.vol, 0);
  const f = vol > cap * 0.8 ? (cap * 0.8) / vol : 1;
  items.forEach((d, i) => {
    const st = newItemState();
    st.stock = Math.floor(want[i] * f);
    st.value = orderCost(d, st.stock, y);
    shop.items[d.id] = st;
  });
  return shop;
}

/** Laden des eigenen Vereins anlegen, falls er fehlt. */
export function ensureMerchShop(g: Game): MerchShop | null {
  const club = ownClub(g);
  const today = g.calendar?.currentDate;
  if (!club || !today) return null;
  if (!club.merchShop) {
    club.merchShop = createShop(club, today);
    // Vorsaison (Pauschale) ins Archiv: Wareneinsatz dafür ist schon über den Einkauf abgegolten
    // (engine/sponsorship.ts operationsMonthly), dazu ein erster Balken im Diagramm „Saisons“.
    const h = club.finances.seasonHistory?.[club.finances.seasonHistory.length - 1];
    if (h && h.season !== club.merchShop.season) {
      const y = Number(h.season.slice(0, 4));
      const rev = Math.max(0, Math.round((h.income.merchandise ?? 0) - merchGlobalAnnual(club, y, clubTier(club))));
      club.merchShop.archive.push({ season: h.season, rev, cost: 0, sold: 0, pot: rev });
    }
  }
  return club.merchShop;
}

/** Idempotent: alter Spielstand → Laden mit Startbestand, Assistent an. */
export function migrateMerch(g: Game): void {
  const shop = ensureMerchShop(g);
  if (!shop) return;
  shop.items ??= {}; shop.weeks ??= []; shop.archive ??= []; shop.orders ??= [];
  shop.jersey ??= {}; shop.jerseyW ??= {}; shop.pending ??= 0; shop.pot ??= 0; shop.plUnits ??= 0;
  for (const st of Object.values(shop.items)) if (st) { st.season ??= emptyCounter(); st.week ??= emptyCounter(); st.frac ??= 0; st.stale ??= 0; }
}

// -----------------------------------------------------------------------------
// Tageslauf
// -----------------------------------------------------------------------------
export function merchDaily(g: Game, today: string): void {
  const shop = ensureMerchShop(g);
  const club = ownClub(g);
  if (!shop || !club) return;
  if (shop.season !== seasonOf(today)) seasonRoll(g, club, shop, today);
  if (mondayOf(today) !== shop.weekStart) closeWeek(g, club, shop, today);
}

function seasonRoll(g: Game, club: Club, shop: MerchShop, today: string): void {
  const t = { rev: 0, cost: 0, sold: 0 };
  for (const st of Object.values(shop.items)) if (st) { t.rev += st.season.rev; t.cost += st.season.cost; t.sold += st.season.sold; }
  const top = Object.entries(shop.jersey).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([id, n]) => ({ id, name: g.players[id]?.fullName ?? '?', n }));
  const it: Partial<Record<MerchItemId, number>> = {};
  for (const [id, st] of Object.entries(shop.items)) if (st?.season.rev) it[id as MerchItemId] = st.season.rev;
  shop.archive.push({ season: shop.season, ...t, pot: Math.round(shop.pot), top, it });
  if (shop.archive.length > 40) shop.archive.splice(0, shop.archive.length - 40);
  const startYear = Number(seasonOf(today).slice(0, 4));
  for (const [id, st] of Object.entries(shop.items)) {
    if (!st) continue;
    st.season = emptyCounter();
    if (MERCH_BY_ID[id as MerchItemId]?.model && newKitSeason(startYear) && st.stock > 0) { st.stale += st.stock; st.stock = 0; }
  }
  shop.season = seasonOf(today);
  shop.weeks = []; shop.jersey = {}; shop.jerseyW = {}; shop.pot = 0;
  if (isHuman(g) && newKitSeason(startYear) && (shop.items.trikot?.stale ?? 0) > 0 && !shop.auto) {
    msg(g, today, 'Neues Trikot', `Neues Trikotmodell: ${shop.items.trikot!.stale.toLocaleString('de-DE')} Trikots der Vorsaison liegen jetzt als Ladenhüter im Lager. Mit Rabatt gehen sie besser weg – oder du gibst sie an einen Restpostenhändler (Finanzen › Fanartikel).`);
  }
}

function closeWeek(g: Game, club: Club, shop: MerchShop, today: string): void {
  const y = yearOf(today);
  // 1) Abgelaufene Woche festschreiben.
  const it: Partial<Record<MerchItemId, number>> = {};
  let rev = 0, cost = 0, sold = 0;
  for (const [id, st] of Object.entries(shop.items)) {
    if (!st) continue;
    if (st.week.rev) it[id as MerchItemId] = st.week.rev;
    rev += st.week.rev; cost += st.week.cost; sold += st.week.sold;
  }
  const idx = shop.weeks.length;
  if (seasonOf(shop.weekStart) === shop.season) {
    shop.weeks.push({ d: shop.weekStart, rev, cost, sold, it });
    distributePlayers(g, club, shop, idx, shop.weekStart);
  }
  noticeSellouts(g, shop, today);
  for (const st of Object.values(shop.items)) if (st) st.week = emptyCounter();
  shop.plUnits = 0;
  shop.weekStart = mondayOf(today);
  // 2) Zugkraft der Mannschaft für die neue Woche.
  shop.boost = starBoost(g, club, today);
  // 3) Nachverkauf & Versand aus der Vorwoche.
  if (shop.pending > 0) {
    const r = sellFromStock(shop, shop.pending, y);
    shop.pending = 0;
    if (r.rev > 0) book(club.finances, today, r.rev, 'merchandise', `Fanshop: Nachverkauf & Versand (${r.sold.toLocaleString('de-DE')} Artikel)`, true);
  }
  // 4) Assistent.
  if (shop.auto) autoManage(g, club, shop, today);
}

function msg(g: Game, date: string, subject: string, body: string) {
  pushMessage(g.messages, makeMessage({ date, category: 'board', from: 'Fanshop', subject, shortText: body.slice(0, 120), bodyText: body }));
}

function noticeSellouts(g: Game, shop: MerchShop, today: string): void {
  if (shop.auto || !isHuman(g)) return;
  const out: string[] = [];
  for (const [id, st] of Object.entries(shop.items)) {
    if (!st || st.stock > 0 || st.week.lost < 5) continue;
    if (st.outNote && Date.parse(today) - Date.parse(st.outNote) < 28 * 864e5) continue;
    st.outNote = today;
    out.push(`${MERCH_BY_ID[id as MerchItemId].name} (${st.week.lost.toLocaleString('de-DE')} Kunden ohne Ware)`);
  }
  if (out.length) msg(g, today, 'Fanartikel ausverkauft', `Im Fanshop ist ausverkauft: ${out.join(', ')}. Bestell nach (Finanzen › Fanartikel) oder überlass das dem Assistenten.`);
}

// -----------------------------------------------------------------------------
// Spieler: Trikots (ab 1995/96 beflockt) bzw. Poster & Autogrammkarten
// -----------------------------------------------------------------------------
/** Beliebtheit eines Spielers für Fanartikel (relativ). */
export function playerAppeal(p: Player, club: Club, today: string, maxStarts: number): number {
  const grp = POSITION_GROUPS[p.naturalPosition];
  let w = Math.pow(Math.max(2, p.overall - 52), 1.6);
  w *= grp === 'ATT' ? 1.35 : grp === 'MID' ? 1 : grp === 'DEF' ? 0.75 : 0.7;
  w *= 0.45 + 0.55 * Math.min(1, (p.seasonStats?.starts ?? 0) / Math.max(3, maxStarts));
  w *= 1 + 0.04 * Math.min(25, p.seasonStats?.goals ?? 0);
  if (club.tactics?.captainId === p.id) w *= 1.15;
  if (p.id.includes('_y_')) w *= 1.15; // Eigengewächs
  if (isNewcomer(p, club, today)) w *= 1.6;
  return w;
}

export function isNewcomer(p: Player, club: Club, today: string): boolean {
  const t = p.history?.transfers;
  const last = t?.[t.length - 1];
  return !!last && last.toClub === club.id && Date.parse(today) - Date.parse(last.date) < 120 * 864e5;
}

function squadOf(g: Game, club: Club): Player[] {
  return club.playerIds.map((id) => g.players[id]).filter((p): p is Player => !!p && !p.isYouth && !p.loan);
}

function distributePlayers(g: Game, club: Club, shop: MerchShop, idx: number, date: string): void {
  const units = Math.round(shop.plUnits);
  const squad = squadOf(g, club);
  if (units <= 0 || !squad.length) return;
  const maxStarts = Math.max(...squad.map((p) => p.seasonStats?.starts ?? 0));
  const ws = squad.map((p) => playerAppeal(p, club, date, maxStarts));
  const sum = ws.reduce((a, b) => a + b, 0) || 1;
  // Größte Reste: deterministisch, Summe = units.
  const raw = ws.map((w) => (w / sum) * units);
  const base = raw.map(Math.floor);
  let rest = units - base.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - base[i], i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of order) { if (rest-- <= 0) break; base[i]++; }
  squad.forEach((p, i) => {
    if (!base[i]) return;
    shop.jersey[p.id] = (shop.jersey[p.id] ?? 0) + base[i];
    const arr = shop.jerseyW[p.id] ?? (shop.jerseyW[p.id] = []);
    while (arr.length < idx) arr.push(0);
    arr[idx] = base[i];
  });
}

/** Mittel der drei Besten eines Kaders. */
function top3(ps: Player[]): number {
  const t = [...ps].sort((a, b) => b.overall - a.overall).slice(0, 3);
  return t.length ? t.reduce((a, p) => a + p.overall, 0) / t.length : 0;
}

/**
 * Zugkraft der Mannschaft auf Trikots/Poster (≈ 0,92–1,12): Spitzenspieler im Vergleich zu den
 * übrigen Vereinen der Liga (Ligamittel = 1, damit der Umsatz im Mittel gleich bleibt) und
 * Neuzugänge, die zur Spitze des Kaders gehören.
 */
export function starBoost(g: Game, club: Club, today: string): number {
  const sq = squadOf(g, club);
  if (!sq.length) return 1;
  const mine = top3(sq);
  const peers = Object.values(g.clubs)
    .filter((c) => c.id !== club.id && (c.finances?.leagueTier ?? 0) === (club.finances?.leagueTier ?? 0))
    .map((c) => top3(squadOf(g, c))).filter((v) => v > 0);
  const ref = peers.length ? peers.reduce((a, b) => a + b, 0) / peers.length : mine;
  const star = Math.max(-0.08, Math.min(0.08, (mine - ref) / 80));
  const news = sq.filter((p) => isNewcomer(p, club, today) && p.overall >= mine - 6).length;
  return Math.round((1 + star + Math.min(0.04, news * 0.02)) * 1000) / 1000;
}

// -----------------------------------------------------------------------------
// Assistent
// -----------------------------------------------------------------------------
function autoManage(g: Game, club: Club, shop: MerchShop, today: string): void {
  const y = yearOf(today);
  for (const d of MERCH_ITEMS) {
    const st = shop.items[d.id];
    if (!st) continue;
    // Auslaufartikel und Ladenhüter-Rabatte
    if (!merchAvailable(d, y) && st.stock + st.stale > 0) { disposeItem(club, shop, d.id, today, true); continue; }
    if (st.stale > 0 && (st.sdisc ?? 0) < 0.3) st.sdisc = 0.3;
    if (st.stale <= 0) st.sdisc = 0;
  }
  const items = availableItems(y).sort((a, b) => b.price * b.vol - a.price * a.vol);
  for (const d of items) {
    const wk = weeklyUnits(club, shop, d.id, today);
    const st = shop.items[d.id] ?? (shop.items[d.id] = newItemState());
    // Vor einem Modellwechsel nur noch bis Saisonende einkaufen (sonst Ladenhüter).
    const fill = d.model ? Math.min(AUTO_FILL, modelWeeksLeft(today)) : AUTO_FILL;
    const low = Math.min(AUTO_LOW, fill);
    if (wk <= 0 || st.stock >= wk * low) continue;
    placeOrder(club, shop, d.id, Math.ceil(wk * fill - st.stock), today, true);
  }
}

/** Wochen, die ein Trikotmodell noch verkauft wird (bis Saisonende, wenn danach ein neues kommt). */
function modelWeeksLeft(today: string): number {
  const startYear = Number(seasonOf(today).slice(0, 4));
  if (!newKitSeason(startYear + 1)) return Infinity;
  const end = Date.parse(`${startYear + 1}-06-30T00:00:00Z`);
  // Ab Mai kaum Heimspiele mehr: Vorrat für die Restwochen knapp halten.
  return Math.max(0, (end - Date.parse(today + 'T00:00:00Z')) / (7 * 864e5) * 0.6);
}

function placeOrder(club: Club, shop: MerchShop, id: MerchItemId, qty: number, today: string, auto: boolean): { qty: number; cost: number } {
  const r = receiveOrder(shop, club, id, qty, yearOf(today));
  if (r.qty > 0) {
    book(club.finances, today, -r.cost, 'operations', `Fanartikel-Einkauf: ${r.qty.toLocaleString('de-DE')} × ${MERCH_BY_ID[id].name}${auto ? ' (Assistent)' : ''}`, true);
    shop.orders.unshift({ d: today, id, qty: r.qty, cost: r.cost, auto: auto || undefined });
    if (shop.orders.length > 30) shop.orders.length = 30;
  }
  return r;
}

function disposeItem(club: Club, shop: MerchShop, id: MerchItemId, today: string, all: boolean): number {
  const st = shop.items[id];
  if (!st) return 0;
  const n = all ? st.stock + st.stale : st.stale;
  if (n <= 0) return 0;
  const per = st.stock + st.stale > 0 ? st.value / (st.stock + st.stale) : 0;
  const pay = Math.round(per * n * DISPOSE_RATE);
  st.value = Math.max(0, st.value - per * n);
  if (all) { st.stock = 0; st.stale = 0; } else st.stale = 0;
  if (pay > 0) book(club.finances, today, pay, 'other', `Restposten Fanartikel: ${n.toLocaleString('de-DE')} × ${MERCH_BY_ID[id].name}`, true);
  return n;
}

// -----------------------------------------------------------------------------
// Aktionen (Oberfläche)
// -----------------------------------------------------------------------------
export interface MerchResult { ok: boolean; text: string }

export function setMerchAuto(g: Game, on: boolean): void {
  const shop = ensureMerchShop(g);
  if (shop) shop.auto = on;
}

export function setMerchPrice(g: Game, id: MerchItemId, pf: number): void {
  const st = ensureMerchShop(g)?.items[id];
  if (st) st.pf = Math.max(0.5, Math.min(2, Math.round(pf * 20) / 20));
}

export function setMerchDiscount(g: Game, id: MerchItemId, disc: number): void {
  const st = ensureMerchShop(g)?.items[id];
  if (st) st.disc = Math.max(0, Math.min(0.5, Math.round(disc * 20) / 20));
}

export function setMerchStaleDiscount(g: Game, id: MerchItemId, disc: number): void {
  const st = ensureMerchShop(g)?.items[id];
  if (st) st.sdisc = Math.max(0, Math.min(0.7, Math.round(disc * 20) / 20));
}

/** Freie Lagerplätze ausgedrückt in Stück eines Artikels. */
export function freeUnits(club: Club, shop: MerchShop, id: MerchItemId, year: number): number {
  return Math.max(0, Math.floor((storeCapacity(club, year) - storeUsed(shop)) / MERCH_BY_ID[id].vol));
}

export function orderMerch(g: Game, id: MerchItemId, qty: number): MerchResult {
  const shop = ensureMerchShop(g); const club = ownClub(g);
  const today = g.calendar.currentDate;
  if (!shop || !club) return { ok: false, text: 'Kein Fanshop.' };
  const d = MERCH_BY_ID[id];
  if (!merchAvailable(d, yearOf(today))) return { ok: false, text: `${d.name} gibt es ${d.from > yearOf(today) ? `erst ab ${d.from}` : 'nicht mehr'}.` };
  const cost = orderCost(d, qty, yearOf(today));
  if (cost > club.finances.balance) return { ok: false, text: 'Dafür reicht der Kontostand nicht.' };
  const r = placeOrder(club, shop, id, qty, today, false);
  if (!r.qty) return { ok: false, text: 'Das Lager ist voll.' };
  const y = yearOf(today);
  return { ok: true, text: `${r.qty.toLocaleString('de-DE')} × ${d.name} bestellt für ${formatMoney(r.cost, y)}${r.qty < qty ? ' (mehr passte nicht ins Lager)' : ''}.` };
}

/** Alle Artikel auf N Wochen Vorrat auffüllen. */
export function orderAllWeeks(g: Game, weeks: number): MerchResult {
  const shop = ensureMerchShop(g); const club = ownClub(g);
  const today = g.calendar.currentDate;
  if (!shop || !club) return { ok: false, text: 'Kein Fanshop.' };
  const plan = refillPlan(club, shop, weeks, today);
  const total = plan.reduce((a, p) => a + p.cost, 0);
  if (!plan.length) return { ok: false, text: 'Der Vorrat reicht bereits.' };
  if (total > club.finances.balance) return { ok: false, text: 'Dafür reicht der Kontostand nicht.' };
  let n = 0, c = 0;
  for (const p of plan) { const r = placeOrder(club, shop, p.id, p.qty, today, false); n += r.qty; c += r.cost; }
  return n ? { ok: true, text: `${n.toLocaleString('de-DE')} Artikel bestellt für ${formatMoney(c, yearOf(today))}.` } : { ok: false, text: 'Das Lager ist voll.' };
}

/** Bestellvorschlag: je Artikel die Menge bis N Wochen Vorrat (vor Lagergrenze). */
export function refillPlan(club: Club, shop: MerchShop, weeks: number, today: string): { id: MerchItemId; qty: number; cost: number; disc: number }[] {
  const y = yearOf(today);
  const out: { id: MerchItemId; qty: number; cost: number; disc: number }[] = [];
  for (const d of availableItems(y)) {
    const st = shop.items[d.id];
    const qty = Math.ceil(weeklyUnits(club, shop, d.id, today) * weeks - (st?.stock ?? 0));
    if (qty > 0) out.push({ id: d.id, qty, cost: orderCost(d, qty, y), disc: volumeDiscount(qty) });
  }
  return out;
}

export function disposeMerch(g: Game, id: MerchItemId): MerchResult {
  const shop = ensureMerchShop(g); const club = ownClub(g);
  if (!shop || !club) return { ok: false, text: 'Kein Fanshop.' };
  const d = MERCH_BY_ID[id];
  const gone = !merchAvailable(d, yearOf(g.calendar.currentDate));
  const n = disposeItem(club, shop, id, g.calendar.currentDate, gone);
  return n ? { ok: true, text: `${n.toLocaleString('de-DE')} × ${d.name} an einen Restpostenhändler abgegeben (${Math.round(DISPOSE_RATE * 100)} % des Einkaufspreises).` }
    : { ok: false, text: 'Keine Ladenhüter bei diesem Artikel.' };
}

/** Wochen-Vorrat eines Artikels (bei aktueller Nachfrage). */
export function stockWeeks(club: Club, shop: MerchShop, id: MerchItemId, today: string): number {
  const wk = weeklyUnits(club, shop, id, today);
  return wk > 0 ? (shop.items[id]?.stock ?? 0) / wk : 0;
}

export { FLOCK_YEAR };

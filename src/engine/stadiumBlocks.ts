// =============================================================================
// STADION-BLÖCKE (eigener Verein): Haupttribüne, Gegengerade, Nord- und
// Südkurve mit je 1–3 Rängen, Platzart je Rang, Dach, VIP-Bereich, Logen,
// Anzeigetafel. Reine Rechenlogik – Spielablauf in game/stadiumGame.ts.
// -----------------------------------------------------------------------------
// Kapazität = Σ Reihen × Plätze pro Reihe × Dichte der Platzart.
//   Stehplätze zählen doppelt so viele Menschen wie Schalensitze, bringen aber
//   weniger Eintritt. Der Ticket-Faktor vergleicht den Preismix mit dem Stand
//   bei Einführung der Blöcke (Umbau zu Sitzen = mehr Erlös je Zuschauer).
// Dach: mehr Zuschauer bei Regen und im Winter. VIP-Bereich und Logen:
//   Hospitality-Erlöse je Heimspiel (über vipIncome in clubBusiness.ts).
// Ab 1998 gilt im Europapokal: nur Sitzplätze.
// Alle Preise in 1975-Basis (DM), gebucht × economyScale.
// =============================================================================
import { BlockId, Club, RoofType, SeatType, StadiumBlock, StadiumTier } from '../types';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const BLOCK_IDS: BlockId[] = ['main', 'opposite', 'north', 'south'];
export const BLOCK_NAME: Record<BlockId, string> = { main: 'Haupttribüne', opposite: 'Gegengerade', north: 'Nordkurve', south: 'Südkurve' };
export const SEAT_NAME: Record<SeatType, string> = { steh: 'Stehplätze', bank: 'Holzbänke', schale: 'Schalensitze', komfort: 'Komfortsitze', business: 'Business-Seats' };
export const ROOF_NAME: Record<RoofType, string> = { none: 'kein Dach', partial: 'Teildach', full: 'volles Dach' };
export const TIER_NAME = ['Unterrang', 'Mittelrang', 'Oberrang'];

const SEATS_PER_ROW = 170;
const LENGTH: Record<BlockId, number> = { main: 1, opposite: 1, north: 0.62, south: 0.62 };
const DENSITY: Record<SeatType, number> = { steh: 2.0, bank: 1.25, schale: 1, komfort: 0.85, business: 0.55 };
/** Preisfaktor der Platzart (relativ zum Grundpreis). */
export const SEAT_PRICE: Record<SeatType, number> = { steh: 0.75, bank: 0.9, schale: 1.1, komfort: 1.45, business: 3.2 };
/** Baukosten je Platz (1975-Basis). */
const SEAT_COST: Record<SeatType, number> = { steh: 70, bank: 130, schale: 240, komfort: 420, business: 1100 };
const ROOF_COST: Record<RoofType, number> = { none: 0, partial: 45, full: 110 };
const ROOF_SHARE: Record<RoofType, number> = { none: 0, partial: 0.5, full: 1 };
export const VIP_COST = 250000;
export const LOUNGE_COST = 110000;
export const MAX_LOUNGES: Record<BlockId, number> = { main: 12, opposite: 10, north: 4, south: 4 };
export const MAX_CAPACITY = 90000;

/** Verfügbarkeit der Platzarten je Epoche. */
export function seatAvailable(seat: SeatType, year: number): boolean {
  if (seat === 'bank') return year < 2000;
  if (seat === 'komfort') return year >= 1988;
  if (seat === 'business') return year >= 1992;
  return true;
}
export const vipAvailable = (year: number) => year >= 1980;
export const loungesAvailable = (year: number) => year >= 1985;
export const videoWall = (year: number) => year >= 1994;
/** Ab 1998: internationale Spiele nur mit Sitzplätzen. */
export const allSeaterEuro = (year: number) => year >= 1998;

export function tierCapacity(id: BlockId, t: StadiumTier): number {
  return Math.round((SEATS_PER_ROW * LENGTH[id] * t.rows * DENSITY[t.seat]) / 50) * 50;
}
export function blockCapacity(b: StadiumBlock): number {
  return b.tiers.reduce((s, t) => s + tierCapacity(b.id, t), 0);
}
export function blocksCapacity(blocks: StadiumBlock[]): number {
  return blocks.reduce((s, b) => s + blockCapacity(b), 0);
}
/** Europapokal ab 1998: Stehränge werden mit Klappsitzen bestuhlt und fassen dann nur die Hälfte. */
export function euroCapacity(blocks: StadiumBlock[], capacity: number): number {
  const seated = seatedCapacity(blocks);
  return Math.max(1000, Math.min(capacity, Math.round(seated + (blocksCapacity(blocks) - seated) / 2)));
}
export function seatedCapacity(blocks: StadiumBlock[]): number {
  return blocks.reduce((s, b) => s + b.tiers.filter((t) => t.seat !== 'steh').reduce((a, t) => a + tierCapacity(b.id, t), 0), 0);
}

/** Preismix (kapazitätsgewichteter Preisfaktor). */
export function priceMix(blocks: StadiumBlock[]): number {
  let cap = 0, val = 0;
  for (const b of blocks) for (const t of b.tiers) { const c = tierCapacity(b.id, t); cap += c; val += c * SEAT_PRICE[t.seat]; }
  return cap ? val / cap : 1;
}
/** Ticket-Faktor gegenüber dem Stand bei Einführung der Blöcke (KI-Vereine: 1). */
export function ticketFactor(club: Club): number {
  const b = club.stadium.blocks;
  if (!b?.length || !club.stadium.priceBase) return 1;
  return clamp(priceMix(b) / club.stadium.priceBase, 0.7, 2.2);
}
export function roofShare(blocks: StadiumBlock[]): number {
  let cap = 0, cov = 0;
  for (const b of blocks) { const c = blockCapacity(b); cap += c; cov += c * ROOF_SHARE[b.roof]; }
  return cap ? cov / cap : 0;
}
/** Zuschauer-Faktor durch Überdachung (Regen, Winter). */
export function roofAttendanceFactor(club: Club, weather: string, month: number): number {
  const b = club.stadium.blocks;
  if (!b?.length) return 1;
  const share = roofShare(b);
  const bonus = weather === 'regen' ? 0.07 : (month >= 11 || month <= 2) ? 0.035 : 0.01;
  return 1 + share * bonus;
}
/** VIP-Bereiche zählen wie je 6 Logen (Langseite) bzw. 4 (Kurve). */
export function vipAreaBoxes(club: Club): number {
  return (club.stadium.blocks ?? []).reduce((s, b) => s + (b.vip ? Math.round(6 * LENGTH[b.id] + 0.3) : 0), 0);
}
/** Ausbaustufe 1–5 aus dem Blockzustand (für Gelände, Wiki, Vergleiche). */
export function derivedLevel(blocks: StadiumBlock[]): number {
  const cap = blocksCapacity(blocks);
  const seated = cap ? seatedCapacity(blocks) / cap : 0;
  const score = cap / 16000 + seated * 1.2 + roofShare(blocks) * 1.2 + (blocks.some((b) => b.vip) ? 0.4 : 0);
  return clamp(Math.round(score), 1, 5);
}

// -----------------------------------------------------------------------------
// Einführung: Blöcke aus Kapazität, Stufe, Logen und Epoche ableiten
// -----------------------------------------------------------------------------
export function migrateBlocks(club: Club, year: number): StadiumBlock[] {
  const L = club.infrastructure?.stadium ?? 1;
  const V = club.stadium.vipBoxes ?? 0;
  const seatMain: SeatType = year < 1985 ? 'bank' : 'schale';
  const modern = year >= 1998;
  const roofMain: RoofType = L >= 4 || (modern && L >= 3) ? 'full' : 'partial';
  const roofOther: RoofType = L >= 5 || (modern && L >= 4) ? 'full' : L >= 4 ? 'partial' : 'none';
  const t = (seat: SeatType, rows = 20): StadiumTier => ({ seat, rows });
  // Einnahmen-neutral: ein VIP-Bereich ersetzt sechs der bisherigen Logen.
  const vipMain = vipAvailable(year) && V >= 6;
  const Vl = loungesAvailable(year) ? (vipMain ? V - 6 : V) : 0;
  const lMain = Math.min(MAX_LOUNGES.main, Math.round(Vl * 0.6));
  const blocks: StadiumBlock[] = [
    { id: 'main', tiers: L >= 3 ? [t(seatMain), t(modern ? 'schale' : seatMain, 14)] : [t(seatMain)], roof: roofMain,
      vip: vipMain, lounges: lMain },
    { id: 'opposite', tiers: L >= 4 ? [t(modern ? 'schale' : 'steh'), t(modern ? 'schale' : 'bank', 14)] : [t(modern ? 'schale' : 'steh')], roof: roofOther,
      vip: false, lounges: Math.min(MAX_LOUNGES.opposite, Vl - lMain) },
    { id: 'north', tiers: L >= 5 ? [t('steh'), t(modern ? 'schale' : 'steh', 14)] : [t('steh')], roof: roofOther, vip: false, lounges: 0, scoreboard: true },
    { id: 'south', tiers: L >= 5 ? [t(modern ? 'schale' : 'steh'), t(modern ? 'schale' : 'steh', 14)] : [t(modern ? 'schale' : 'steh')], roof: roofOther, vip: false, lounges: 0 },
  ];
  // Reihen so skalieren, dass die bisherige Kapazität ungefähr erhalten bleibt.
  const target = club.stadium.capacity;
  const fit = () => {
    for (let i = 0; i < 6; i++) {
      const cap = blocksCapacity(blocks);
      if (!cap || Math.abs(cap - target) / target < 0.02) break;
      const f = target / cap;
      for (const b of blocks) for (const tr of b.tiers) tr.rows = clamp(Math.round(tr.rows * f), 3, 36);
    }
  };
  fit();
  // Große Stadien: reichen 36 Reihen nicht, kommt ein weiterer Rang dazu.
  for (let k = 0; k < 8 && blocksCapacity(blocks) < target * 0.97; k++) {
    const b = [...blocks].sort((a, c) => a.tiers.length - c.tiers.length)[0];
    if (b.tiers.length >= 3) break;
    b.tiers.push(t(b.tiers[b.tiers.length - 1].seat, 14));
    fit();
  }
  for (const b of blocks) b.lounges = Math.max(0, b.lounges);
  return blocks;
}

// -----------------------------------------------------------------------------
// Umbau planen: Kosten, Kapazität, Bauzeit, Stimmung, Prüfungen
// -----------------------------------------------------------------------------
export interface BlockPlan {
  ok: boolean;
  errors: string[];
  /** Kosten in 1975-Basis. */
  costBase: number;
  addCapacity: number;
  months: number;
  /** Erwartete Wirkung auf die Fanstimmung (Punkte). */
  mood: number;
  notes: string[];
  changed: boolean;
}

export function planBlock(cur: StadiumBlock, target: StadiumBlock, year: number, totalCapacity: number, tradition: number): BlockPlan {
  const errors: string[] = [], notes: string[] = [];
  let cost = 0, demolish = 0, converted = 0, addedStanding = 0;
  if (!target.tiers.length) errors.push('Ein Block braucht mindestens einen Rang.');
  if (target.tiers.length > 3) errors.push('Höchstens drei Ränge.');
  target.tiers.forEach((t, i) => {
    if (!seatAvailable(t.seat, year) && cur.tiers[i]?.seat !== t.seat) errors.push(`${SEAT_NAME[t.seat]} gibt es ${t.seat === 'bank' ? 'nicht mehr' : 'noch nicht'}.`);
    if (t.rows < 3 || t.rows > 36) errors.push('Ein Rang hat 3 bis 36 Reihen.');
    const old = cur.tiers[i];
    const cap = tierCapacity(target.id, t);
    const rare = t.seat === 'schale' && year < 1985 ? 1.4 : 1;
    if (!old) { cost += cap * SEAT_COST[t.seat] * rare * 1.3; if (t.seat === 'steh') addedStanding += cap; return; }
    const oldCap = tierCapacity(cur.id, old);
    if (old.seat !== t.seat) {
      cost += cap * SEAT_COST[t.seat] * rare * 0.6;
      if (old.seat === 'steh' && t.seat !== 'steh') converted += oldCap;
      if (t.seat === 'steh' && old.seat !== 'steh') addedStanding += cap;
    }
    if (t.rows > old.rows) cost += (t.rows - old.rows) / t.rows * cap * SEAT_COST[t.seat] * rare;
    if (t.rows < old.rows) demolish += Math.max(0, oldCap - cap);
  });
  for (let i = target.tiers.length; i < cur.tiers.length; i++) demolish += tierCapacity(cur.id, cur.tiers[i]);
  cost += demolish * 15;
  const newCap = blockCapacity(target), oldCap = blockCapacity(cur);
  if (ROOF_SHARE[target.roof] > ROOF_SHARE[cur.roof]) cost += newCap * (ROOF_COST[target.roof] - ROOF_COST[cur.roof]);
  else if (target.roof === cur.roof && newCap > oldCap) cost += (newCap - oldCap) * ROOF_COST[target.roof];
  if (target.vip && !cur.vip) { if (!vipAvailable(year)) errors.push('VIP-Bereiche gibt es erst ab 1980.'); cost += VIP_COST; }
  if (target.lounges > cur.lounges) {
    if (!loungesAvailable(year)) errors.push('Logen gibt es erst ab 1985.');
    cost += (target.lounges - cur.lounges) * LOUNGE_COST;
  }
  if (target.lounges > MAX_LOUNGES[target.id]) errors.push(`Höchstens ${MAX_LOUNGES[target.id]} Logen in diesem Block.`);
  if (target.lounges > 0 && target.tiers.length < 2 && target.roof !== 'full') errors.push('Logen brauchen einen zweiten Rang oder ein volles Dach.');
  if (target.scoreboard && !cur.scoreboard) cost += videoWall(year) ? 500000 : 40000;
  if (totalCapacity - oldCap + newCap > MAX_CAPACITY) errors.push(`Mehr als ${MAX_CAPACITY.toLocaleString('de-DE')} Plätze genehmigt die Stadt nicht.`);

  // Stimmung: Sitze statt Stehplätze tun Traditionsvereinen und Ultras weh.
  const ultra = year >= 2005 && year < 2015;
  let mood = 0;
  if (converted) mood -= Math.min(12, (converted / 1500) * (tradition >= 70 || ultra ? 1.5 : 0.8));
  if (addedStanding && year >= 2005) mood += Math.min(3, addedStanding / 3000);
  if (ROOF_SHARE[target.roof] > ROOF_SHARE[cur.roof]) mood += 2;
  if ((target.vip && !cur.vip) || target.lounges > cur.lounges) mood -= tradition >= 70 ? 1 : 0;
  if (converted) notes.push(`${converted.toLocaleString('de-DE')} Stehplätze werden zu Sitzplätzen.`);
  if (allSeaterEuro(year) && target.tiers.some((t) => t.seat === 'steh')) notes.push('Im Europapokal werden Stehränge bestuhlt und fassen nur die Hälfte.');

  const added = Math.max(0, newCap - oldCap);
  const months = clamp(Math.round(3 + added / 2500 + (target.roof !== cur.roof ? 3 : 0) + (target.tiers.length > cur.tiers.length ? 2 : 0)), 2, 18);
  const changed = JSON.stringify(cur) !== JSON.stringify(target);
  if (!changed) errors.push('Es ist nichts geändert.');
  return { ok: !errors.length, errors, costBase: Math.round(cost / 1000) * 1000, addCapacity: newCap - oldCap, months, mood: Math.round(mood * 10) / 10, notes, changed };
}

/** Datum + Monate (UTC, ISO). */
export function addMonths(date: string, months: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

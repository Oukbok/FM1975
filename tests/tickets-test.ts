// =============================================================================
// Kartenverkauf ohne UI (engine/ticketForecast.ts, engine/seating.ts, game/ticketsGame.ts):
// Prognose-Spannen je Kategorie – Ist-Wert über viele Spiele gleichverteilt in der Spanne,
// Trefferquote 85–95 %, Mitarbeiter machen die Spanne enger; Prognose vor dem Spiel = gespeicherte
// Prognose am Spieltag; Tribünenpreise und Preiskategorien; Grundbalance unverändert (gleiche
// Preise = gleicher Erlös, Schwankung im Mittel 1); eine Saison mit echtem Spielablauf.
//   npm run test:tickets
// =============================================================================
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { CalendarEngine } from '../src/engine/calendar';
import { ensureStadiumBlocks } from '../src/game/stadiumGame';
import { CAT_KEYS, STANDS } from '../src/data/seatingCatalog';
import {
  capsFor, demandFor, ensureTickets, expectedSale, priceOf, saleRevenue, seatPriceScale, sellSeats, simulateSeatSales, standCaps, splitByStand,
} from '../src/engine/seating';
import { positionIn } from '../src/engine/ticketForecast';
import { cycleMatchCat, forecastGame, forecastRecord, homeGames, setStandPrice, ticketsDaily } from '../src/game/ticketsGame';
import { yearOf } from '../src/engine/economy';
import type { Club, SeatCat } from '../src/types';

let seed = 4711;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let fails = 0;
const ok = (c: unknown, msg: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${msg}`); if (!c) fails++; };
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const pct = (v: number) => `${(v * 100).toFixed(1)} %`;

const g = createNewGame({
  managedClubId: 'fra',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1945, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
ensureStadiumBlocks(g);
const me0 = g.clubs[g.managedClubId];
ok(me0.stadium.blocks?.length === 14, 'Eigenes Stadion hat 14 Blöcke');
const year = yearOf(g.calendar.currentDate);

// --- Tribünen: Gruppierung deckt alle Blöcke genau einmal ab ---
const all = STANDS.flatMap((s) => s.blocks);
ok(all.length === 14 && new Set(all).size === 14, `8 Tribünen gruppieren die 14 Blöcke (${STANDS.map((s) => s.name).join(', ')})`);
const caps0 = capsFor(me0, year).caps;
const sc0 = standCaps(me0, caps0)!;
for (const k of ['steh', 'sitz', 'dach'] as SeatCat[]) {
  const sum = STANDS.reduce((a, s) => a + (sc0[s.id][k] ?? 0), 0);
  ok(Math.abs(sum - (caps0[k] ?? 0)) <= 8, `${k}: Summe der Tribünen ${sum} = Kontingent ${caps0[k]}`);
}

// --- Viele Spiele: Lage des Ist-Werts in der Spanne ---
const opps = Object.values(g.clubs).filter((c) => c.id !== me0.id && (c.finances.leagueTier ?? 9) <= 2);
const bins = [0, 0, 0, 0, 0];
let hits = 0, n = 0, low = 0, high = 0, games = 0;
const widthBy: Record<string, number[]> = { none: [], staff: [] };
const ratio: number[] = [];
const rng = () => Math.random();
const day0 = Date.parse('1975-08-09T00:00:00Z');
for (let i = 0; i < 320; i++) {
  const me = clone(me0) as Club;
  const away = opps[i % opps.length];
  const date = new Date(day0 + Math.floor(i / opps.length) * 86400000 * 7 + (i % 3) * 86400000).toISOString().slice(0, 10);
  me.stadium.averageAttendanceRate = 0.25 + Math.random() * 0.5;
  for (const k of CAT_KEYS) me.stadium.seating!.prices[k] = priceOf(me0, k, year) * (0.8 + Math.random() * 0.6);
  const staff = i % 2 ? 0.45 : 0;
  ensureTickets(me, year).staff = staff;
  const ctx = { year, date, away, month: Number(date.slice(5, 7)), weather: 'bewoelkt', derby: false };
  const sale = simulateSeatSales(me, away, ctx, rng);
  if (i === 0) ok(!!sale.fc, 'Verkauf trägt die Prognose-Spanne am Spieltag');
  games++;
  for (const k of ['steh', 'sitz', 'dach'] as SeatCat[]) {
    const w = sale.fc?.[k];
    const cap = sale.caps[k] ?? 0;
    const v = sale.sold[k] ?? 0;
    if (!w || v >= cap * 0.98 || w[1] >= cap) continue; // ausverkauft: Spanne oben gedeckelt
    n++;
    const p = positionIn(w, v);
    if (p < 0) low++; else if (p > 1) high++; else { hits++; bins[Math.min(4, Math.floor(p * 5))]++; }
    (staff ? widthBy.staff : widthBy.none).push((w[1] - w[0]) / Math.max(1, v));
    ratio.push(v / Math.max(1, demandFor(me, { ...ctx }, capsFor(me, year).stehCover)[k]));
  }
}
const rate = hits / n;
console.log(`     ${games} Spiele, ${n} Spannen: Treffer ${pct(rate)}, darunter ${low}, darüber ${high}; Lage in 5 Fünfteln: ${bins.map((b) => pct(b / hits)).join(' | ')}`);
ok(n >= 400, `mindestens 400 auswertbare Spannen (${n})`);
ok(rate >= 0.85 && rate <= 0.95, `Trefferquote ${pct(rate)} liegt zwischen 85 und 95 %`);
ok(low > 0 && high > 0, `Ausreißer nach unten (${low}) und oben (${high}) kommen vor`);
ok(bins.every((b) => Math.abs(b / hits - 0.2) < 0.05), 'Ist-Wert gleichverteilt über die Spanne (jedes Fünftel 15–25 %)');
ok(bins[2] / hits < 0.25, `nicht systematisch in der Mitte (mittleres Fünftel ${pct(bins[2] / hits)})`);
const avg = (xs: number[]) => xs.reduce((a, v) => a + v, 0) / Math.max(1, xs.length);
ok(avg(widthBy.staff) < avg(widthBy.none) * 0.7, `Mitarbeiter machen die Spanne enger (Breite ${pct(avg(widthBy.none))} → ${pct(avg(widthBy.staff))})`);
ok(Math.abs(avg(ratio) - 1) < 0.02, `Schwankung je Spiel im Mittel neutral (Verkauf/Nachfrage ${avg(ratio).toFixed(3)})`);

// --- Grundbalance: Erlös je Spiel im Mittel wie mit dem bisherigen Zufall (gleicher Stand, 400 Spiele) ---
{
  const me = clone(me0) as Club;
  me.stadium.averageAttendanceRate = 0.45;
  const away = opps[3];
  const ctx = { year, away, month: 10, weather: 'bewoelkt', derby: false };
  const ci = capsFor(me, year);
  const sum = (o: Partial<Record<SeatCat, number>>) => Object.values(o).reduce((a, v) => a + (v ?? 0), 0);
  let oldRev = 0, newRev = 0;
  for (let i = 0; i < 400; i++) {
    oldRev += sum(saleRevenue(me, sellSeats(ci.caps, demandFor(me, ctx, ci.stehCover), rng).sold, year));
    const date = new Date(day0 + i * 86400000).toISOString().slice(0, 10);
    const s = simulateSeatSales(me, away, { ...ctx, date }, rng);
    newRev += sum(saleRevenue(me, s.sold, year, { mult: s.mult, caps: s.caps }));
  }
  ok(Math.abs(newRev / oldRev - 1) < 0.01, `Eintritt je Spiel im Mittel unverändert (neu/alt ${(newRev / oldRev).toFixed(4)})`);
}

// --- Gleiche Preise: Erlös wie bisher (Grundbalance) ---
{
  const me = clone(me0) as Club;
  const e = expectedSale(me, year);
  const sc = seatPriceScale(me, year);
  const rev = saleRevenue(me, e.sold, year);
  ok(CAT_KEYS.every((k) => rev[k] === Math.round((e.sold[k] ?? 0) * priceOf(me, k, year) * sc)), 'Ohne Tribünenpreise und Preiskategorie: Erlös = Plätze × Kategoriepreis (wie bisher)');
}

// --- Tribünenpreise ---
{
  const g2 = clone(g);
  const me = g2.clubs[g2.managedClubId];
  const k: SeatCat = (capsFor(me, year).caps.steh ?? 0) > 0 ? 'steh' : 'sitz';
  const before = demandFor(me, { year })[k];
  const target = STANDS.find((s) => (standCaps(me, capsFor(me, year).caps)![s.id][k] ?? 0) > 0)!.id;
  for (const s of STANDS) setStandPrice(g2, s.id, k, priceOf(me, k, year));
  ok(!me.stadium.seating!.tickets?.stand?.[target]?.[k], 'Tribünenpreis = Kategoriepreis wird nicht gespeichert');
  setStandPrice(g2, target, k, priceOf(me, k, year) * 1.5);
  const after = demandFor(me, { year })[k];
  ok(after < before && after > before * 0.75, `Eine Tribüne 50 % teurer: ${k}-Nachfrage ${Math.round(before)} → ${Math.round(after)} (nur anteilig)`);
  const caps = capsFor(me, year).caps;
  const split = splitByStand(me, k, year, (caps[k] ?? 0) * 0.6, caps)!;
  const sc = standCaps(me, caps)!;
  const fill = (s: string) => split[s as 'haupt'] / Math.max(1, sc[s as 'haupt'][k] ?? 0);
  const other = STANDS.find((s) => s.id !== target && (sc[s.id][k] ?? 0) > 0)!.id;
  ok(fill(target) < fill(other), `Teure Tribüne füllt sich schwächer (${pct(fill(target))} gegen ${pct(fill(other))})`);
}

// --- Preiskategorie je Spiel ---
{
  const g2 = clone(g);
  const me = g2.clubs[g2.managedClubId];
  ensureTickets(me, year);
  const hg = homeGames(g2).find((h) => !h.played)!;
  ok(!!hg, `Heimspiele der Saison gefunden (${homeGames(g2).length})`);
  const f0 = forecastGame(g2, hg)!;
  cycleMatchCat(g2, hg.key); cycleMatchCat(g2, hg.key); // automatisch → normal → Top
  const fTop = forecastGame(g2, hg)!;
  ok(fTop.priceCat === 'top' && fTop.mult > 1, `Topzuschlag gesetzt (+${Math.round((fTop.mult - 1) * 100)} %)`);
  const revOf = (f: typeof f0) => Object.values(saleRevenue(me, f.sale.sold, year, { mult: f.mult, caps: f.caps })).reduce((a, v) => a + v, 0);
  const sold = (f: typeof f0) => (f.sale.sold.steh ?? 0) + (f.sale.sold.sitz ?? 0) + (f.sale.sold.dach ?? 0);
  ok(sold(fTop) <= sold(f0), `Topzuschlag: weniger oder gleich viele Fans (${sold(f0)} → ${sold(fTop)})`);
  console.log(`     Erlös normal ${revOf(f0)} · Top ${revOf(fTop)}`);
  cycleMatchCat(g2, hg.key);
  const fR = forecastGame(g2, hg)!;
  ok(fR.priceCat === 'rabatt' && sold(fR) >= sold(f0), `Rabatt: mindestens so viele Fans (${sold(fR)})`);
}

// --- Eine Saison mit echtem Spielablauf: Prognose vorher = gespeicherte Prognose am Spieltag ---
{
  (g as any).simAutoManage = true;
  ensureTickets(me0, year).autoTop = 3;
  ticketsDaily(g);
  ok((me0.stadium.seating!.tickets!.topIds ?? []).length === 3, 'Automatischer Topzuschlag: 3 Gegner vorgemerkt');
  const before = new Map<string, string>();
  let guard = 0;
  while (!CalendarEngine.isSeasonOver(g.calendar)) {
    for (const hg of homeGames(g)) if (!hg.played && hg.date === g.calendar.currentDate) {
      const f = forecastGame(g, hg);
      if (f) before.set(hg.key, JSON.stringify(f.fc));
    }
    processDay(g, HEADLESS_UI);
    if (++guard > 1000) throw new Error('Saison endet nicht');
  }
  const log = me0.stadium.seating!.log ?? [];
  const withFc = log.filter((e) => e.fc);
  ok(withFc.length >= 15, `${withFc.length} Heimspiele mit gespeicherter Prognose`);
  const same = withFc.filter((e) => before.has(e.key!) && before.get(e.key!) === JSON.stringify(e.fc)).length;
  const checked = withFc.filter((e) => before.has(e.key!)).length;
  ok(checked >= 10 && same === checked, `Prognose am Morgen des Spieltags = gespeicherte Prognose (${same}/${checked})`);
  ok(withFc.some((e) => e.priceCat === 'top'), 'Topspiele mit Zuschlag verkauft');
  const r = forecastRecord(me0);
  console.log(`     Saison: ${r.hits}/${r.n} Kategorien in der Spanne, ${r.low} darunter, ${r.high} darüber`);
  ok(r.n > 0 && r.hits / r.n >= 0.75, `Saison-Bilanz plausibel (${pct(r.hits / r.n)} Treffer inkl. Ausverkauf)`);
}

console.log(fails ? `\n${fails} Fehler` : '\nAlle Prüfungen bestanden.');
process.exit(fails ? 1 : 0);

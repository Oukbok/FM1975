// Funktionstest Platzkategorien (engine/seating.ts, game/seatingGame.ts):
// Freischaltjahre, unabhängige Nachfrage je Kategorie, Preis-Elastizität,
// VIP-Sättigung, Europapokal/Gästeblock, Schätzung mit Mitarbeitern, Migration.
//   npm run test:seats
import { createNewGame } from '../src/game/newGame';
import { demandEstimate, migrateSeating, seatingNewSeason, setSeatPrice } from '../src/game/seatingGame';
import {
  aiTargetCaps, blockCaps, capsFor, catAvailable, demandFor, ensureSeating, expectedSale, priceOf, refPrice, saleRevenue, sellSeats, vipPool,
} from '../src/engine/seating';
import { CAT_KEYS, SEAT_CATS } from '../src/data/seatingCatalog';
import { ensureClubGrounds } from '../src/game/groundsGame';
import { MatchSim } from '../src/engine/match/sim';
import { bookHomeMatch } from '../src/engine/finances';
import type { Club, SeatCat, StadiumBlock } from '../src/types';

let fails = 0;
const ok = (cond: unknown, label: string) => { console.log(`${cond ? 'OK  ' : 'FEHL'} ${label}`); if (!cond) fails++; };
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const sum = (o: Partial<Record<SeatCat, number>>) => Object.values(o).reduce((a, v) => a + (v ?? 0), 0);

const g = createNewGame({
  managedClubId: 'mgl',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1950, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
const me = g.clubs[g.managedClubId];
const ai = Object.values(g.clubs).find((c) => c.id !== me.id && c.finances.leagueTier === 1 && !c.stadium.blocks)!;

/** KI-Verein in einem Jahr mit festem Zuschnitt (für Vergleiche). */
function testClub(year: number, rep: number, cap: number, market: number): Club {
  const c = clone(ai);
  c.reputation = rep; c.stadium.capacity = cap; c.stadium.averageAttendanceRate = 0.5; c.infrastructure.stadium = 4;
  c.brand = { regional: rep, national: rep - 5, international: rep - 20 } as any;
  c.stadium.seating = { market, prices: {} };
  for (const k of CAT_KEYS) c.stadium.seating.prices[k] = refPrice(c, k, year);
  c.stadium.seating.caps = aiTargetCaps(c, year, cap, 0);
  return c;
}

// --- Freischaltjahre ---
for (const d of SEAT_CATS) ok(!catAvailable(d.key, d.unlock - 1) && catAvailable(d.key, d.unlock) || d.unlock <= 1975, `${d.name} ab ${d.unlock}`);
const c79 = testClub(1979, 85, 50000, 50000);
ok(demandFor(c79, { year: 1979 }).business === 0 && demandFor(c79, { year: 1979 }).loge === 0, '1979: keine Business-/Logen-Nachfrage');
ok(capsFor(c79, 1979).caps.gast === 0, '1979: noch kein abgetrennter Gästeblock');
const c85 = testClub(1985, 85, 50000, 50000);
ok(capsFor(c85, 1985).caps.gast! > 0 && demandFor(c85, { year: 1985 }).loge > 0, `1985: Gästeblock ${capsFor(c85, 1985).caps.gast} Plätze, Logen gefragt`);
ok(demandFor(testClub(1987, 80, 50000, 50000), { year: 1987 }).premium === 0, 'Premium-Sitze erst ab 1988');

// --- Unabhängige Nachfrage je Kategorie ---
const y = 2015;
const base = testClub(y, 78, 55000, 60000);
const d0 = demandFor(base, { year: y });
const dear = clone(base); dear.stadium.seating!.prices.steh = priceOf(base, 'steh', y) * 1.5;
const d1 = demandFor(dear, { year: y });
ok(d1.steh < d0.steh * 0.8, `Stehplatz 50 % teurer: Nachfrage ${Math.round(d0.steh)} → ${Math.round(d1.steh)}`);
ok(d1.business === d0.business && d1.loge === d0.loge && d1.dach === d0.dach && d1.premium === d0.premium, 'Business, Logen, Tribüne und Premium bleiben davon unberührt');
const vip = clone(base); vip.stadium.seating!.prices.business = priceOf(base, 'business', y) * 1.3;
const d2 = demandFor(vip, { year: y });
ok(d2.steh === d0.steh && d2.dach === d0.dach && d2.business < d0.business, 'Business teurer: nur die Business-Nachfrage sinkt');

// --- Preis-Elastizität ---
const drop = (k: SeatCat) => { const c = clone(base); c.stadium.seating!.prices[k] = priceOf(base, k, y) * 1.2; return demandFor(c, { year: y })[k] / d0[k]; };
ok(drop('steh') > drop('dach') && drop('dach') > drop('business') && drop('business') > drop('loge'), `+20 % Preis: Steh ${drop('steh').toFixed(2)}, Tribüne ${drop('dach').toFixed(2)}, Business ${drop('business').toFixed(2)}, Logen ${drop('loge').toFixed(2)} (teure Plätze reagieren stärker)`);
const cheap = clone(base); cheap.stadium.seating!.prices.dach = priceOf(base, 'dach', y) * 0.7;
ok(demandFor(cheap, { year: y }).dach > d0.dach, 'Günstiger → mehr Nachfrage');
// Teurere Kategorien bringen mehr je Platz
const rev = saleRevenue(base, expectedSale(base, y).sold, y), sold = expectedSale(base, y).sold;
ok(rev.business! / sold.business! > rev.premium! / sold.premium! && rev.premium! / sold.premium! > rev.dach! / sold.dach! && rev.dach! / sold.dach! > rev.steh! / sold.steh!,
  `Erlös je Platz: Steh ${Math.round(rev.steh! / sold.steh!)} < Tribüne ${Math.round(rev.dach! / sold.dach!)} < Premium ${Math.round(rev.premium! / sold.premium!)} < Business ${Math.round(rev.business! / sold.business!)}`);

// --- VIP-Sättigung ---
const pool = vipPool(base, 'business', y);
const occ = (n: number) => { const caps = { ...capsFor(base, y).caps, business: n }; const s = sellSeats(caps, demandFor(base, { year: y })); return s.sold.business / n; };
ok(occ(pool * 0.5) > 0.97 && occ(pool * 2) < 0.6 && occ(pool * 4) < 0.3, `Business-Seats (Markt ≈ ${Math.round(pool)}): Auslastung bei ½ ${occ(pool * 0.5).toFixed(2)}, ×2 ${occ(pool * 2).toFixed(2)}, ×4 ${occ(pool * 4).toFixed(2)}`);
ok(vipPool(testClub(y, 95, 75000, 120000), 'business', y) > 2.5 * vipPool(testClub(y, 70, 40000, 40000), 'business', y), 'Großer Verein hat einen deutlich größeren Hospitality-Markt');
const ddr = clone(base); ddr.finances.leagueTier = 101;
ok(vipPool(ddr, 'loge', 1988) === 0, 'DDR-Oberliga: keine Logen vor 1991');
const hosp = clone(base); ensureClubGrounds(hosp, '2015-07-01');
hosp.grounds!.modules.hospitality = { level: 3, condition: 100, builtYear: 2012 } as any;
ok(vipPool(hosp, 'business', y) > pool * 1.15, `Hospitality-Modul (Premium) erhöht den VIP-Markt (${Math.round(pool)} → ${Math.round(vipPool(hosp, 'business', y))})`);

// --- Kapazitätsgrenze statt Ausbau-Wunder ---
const big = clone(base); big.stadium.capacity = 110000; big.stadium.seating!.caps = aiTargetCaps(big, y, 110000, 0);
ok(expectedSale(big, y).attendance < expectedSale(base, y).attendance * 1.25, `Doppelte Kapazität füllt sich nicht von selbst (${expectedSale(base, y).attendance} → ${expectedSale(big, y).attendance})`);

// --- Blöcke → Kategorien, Europapokal, Gästeblock ---
const blocks = clone(me.stadium.blocks!) as StadiumBlock[];
const bc0 = blockCaps(blocks).caps;
blocks.find((b) => b.id === 'main_m')!.vip = true; blocks.find((b) => b.id === 'main_m')!.lounges = 4;
const bc1 = blockCaps(blocks).caps;
ok(bc1.business! - bc0.business! >= 150 && bc1.loge! - bc0.loge! === 4, `VIP-Bereich +${bc1.business! - bc0.business!} Business-Seats, 4 Logen`);
const eu = capsFor(testClub(2005, 80, 60000, 60000), 2005, { euro: true });
ok(eu.caps.steh === 0 && Math.abs(eu.caps.gast! / ((eu.caps.sitz ?? 0) + (eu.caps.dach ?? 0) + eu.caps.gast!) - 0.05) < 0.01, `Europapokal 2005: keine Stehplätze, Gästeblock ${eu.caps.gast} (5 %)`);
const li = capsFor(testClub(2005, 80, 60000, 60000), 2005);
ok(li.caps.steh! > 0 && li.caps.gast! > 0 && li.wheelchair > 0, `Liga 2005: Stehplätze ${li.caps.steh}, Gästeblock ${li.caps.gast}, Rollstuhlplätze ${li.wheelchair}`);

// --- Spiel: Verkauf je Kategorie wird verbucht ---
me.stadium.seating!.log = [];
const away = Object.values(g.clubs).find((c) => c.id !== me.id && c.finances.leagueTier === 1)!;
const sim = new MatchSim(me, away, g.players, { year: 1975, date: '1975-09-13', seed: 3 });
ok(sim.attendance === sim.seatSale.attendance && sim.attendance > 1000, `Match-Engine: ${sim.attendance} Zuschauer aus Kategorien ${JSON.stringify(sim.seatSale.sold)}`);
sim.runToEnd();
const before = me.finances.income.ticketSales;
const res = { homeGoals: 1, awayGoals: 0, attendance: sim.attendance } as any;
const { SEAT_SALES } = await import('../src/engine/seating');
SEAT_SALES.set(res, sim.seatSale);
bookHomeMatch(me, res, true, true, false, '1975-09-13', true, 1);
const booked = me.finances.income.ticketSales - before;
ok(booked > 0 && Math.abs(booked - sum(saleRevenue(me, sim.seatSale.sold, 1975))) < 5, `Eintritt verbucht: ${booked} DM`);
ok(me.finances.transactions.some((t) => t.description.startsWith('Eintritt Stehplätze')) && me.stadium.seating!.log!.length === 1, 'Bilanzzeilen je Kategorie und Verlauf der Heimspiele');

// --- Schätzung: Spanne, Mitarbeiter machen sie genauer ---
const e0 = demandEstimate(g, 'dach');
const truth = expectedSale(me, 1975).demand.dach;
ok(e0.lo <= truth * 1.02 && e0.hi >= truth * 0.98 && e0.hi > e0.lo, `Schätzung Tribüne ${e0.lo}–${e0.hi} enthält den wahren Wert ${Math.round(truth)}`);
const staff0 = g.staff;
g.staff = [{ id: 's1', roleId: 'kaufm_leiter', name: 'A', age: 40, quality: 20, specialty: 'allround', methodYear: 1975, loyalty: 50, salaryFactor: 1, hired: '1975-07-01' },
  { id: 's2', roleId: 'eventmanager', name: 'B', age: 40, quality: 20, specialty: 'allround', methodYear: 1975, loyalty: 50, salaryFactor: 1, hired: '1975-07-01' }] as any;
const e1 = demandEstimate(g, 'dach');
ok(e1.fog < e0.fog * 0.8, `Mit Kaufmännischem Leiter und Eventmanager: ±${Math.round(e0.fog * 100)} % → ±${Math.round(e1.fog * 100)} %`);
g.staff = staff0;
ok(demandEstimate(g, 'business').fog > demandEstimate(g, 'steh').fog, 'VIP-Nachfrage ist unsicherer als die Kurve');

// --- Preise setzen, Saisonwechsel ---
setSeatPrice(g, 'steh', refPrice(me, 'steh', 1975) * 10);
ok(priceOf(me, 'steh', 1975) <= refPrice(me, 'steh', 1975) * 3 + 0.01, 'Preis höchstens 300 % des Richtpreises');
ok(me.stadium.ticketPrice > 9, `Preisindex für die Fanstimmung steigt (ticketPrice ${me.stadium.ticketPrice})`);
const ratio0 = priceOf(ai, 'dach', 1975) / refPrice(ai, 'dach', 1975);
seatingNewSeason(g, '1976-07-01');
ok(Math.abs(priceOf(ai, 'dach', 1976) / refPrice(ai, 'dach', 1976) - ratio0) < 0.08, 'Saisonwechsel: Preise wachsen mit dem Richtpreis mit');

// --- Migration alter Spielstände ---
const old = clone(g);
for (const c of Object.values(old.clubs)) delete c.stadium.seating;
const oc = Object.values(old.clubs).find((c) => c.id === ai.id)!;
const oldRev = Math.min(oc.stadium.capacity, oc.stadium.capacity * oc.stadium.averageAttendanceRate) * oc.stadium.ticketPrice;
ok(migrateSeating(old), 'Alter Spielstand bekommt Platzkategorien');
ok(Object.values(old.clubs).every((c) => c.stadium.seating && c.stadium.seating.market >= 1500), 'Alle Vereine haben Preise und Zuschauerpotenzial');
const newRev = sum(saleRevenue(oc, expectedSale(oc, 1976).sold, 1976));
ok(newRev > oldRev * 0.8 && newRev < oldRev * 1.25, `Eintritt je Spiel bleibt in der Größenordnung (${Math.round(oldRev)} → ${Math.round(newRev)} DM)`);
const snap = JSON.stringify(old.clubs);
ok(!migrateSeating(old) && JSON.stringify(old.clubs) === snap, 'Zweiter Aufruf ändert nichts (idempotent)');
ensureSeating(oc, 1976);

if (fails) { console.log(`\n${fails} Prüfung(en) fehlgeschlagen.`); process.exit(1); }
console.log('\nAlle Prüfungen bestanden.');

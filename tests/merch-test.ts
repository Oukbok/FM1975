// =============================================================================
// Fanartikel ohne UI: Sortiment je Epoche, Preise/Rabatt/Elastizität, Mengenrabatt,
// Lager, Modellwechsel → Ladenhüter, Beflockung ab 1995/96, Migration (idempotent),
// eine ganze Saison mit Assistent (Umsatz ≈ altes Pauschal-Potenzial), ohne Nachbestellung
// (ausverkauft), Aktionen.   npm run test:merch
// =============================================================================
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { startNextSeason } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { Game } from '../src/game/state';
import { MERCH_BY_ID, merchAvailable, newKitSeason, FLOCK_YEAR } from '../src/data/merchCatalog';
import {
  merchShares, priceDemandFactor, newItemState, volumeDiscount, orderCost, storeCapacity, storeUsed,
  sellFromStock, playerUnits, seasonTotals, itemPriceScale,
} from '../src/engine/merch';
import {
  migrateMerch, ensureMerchShop, orderMerch, setMerchPrice, setMerchDiscount, disposeMerch, weeklyUnits,
  setMerchAuto, orderAllWeeks,
} from '../src/game/merchGame';
import { economyScale } from '../src/engine/economy';

let seed = 1975;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let fails = 0;
const ok = (c: boolean, msg: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${msg}`); if (!c) fails++; };
const r2 = (v: number) => v.toFixed(2);

// --- 1) Sortiment je Epoche ---------------------------------------------------------
const ids = (y: number) => Object.keys(merchShares(y)).join(',');
ok(!ids(1975).includes('trikot') && ids(1975).includes('schal') && ids(1975).includes('wimpel'), `1975: ${ids(1975)}`);
ok(ids(1978).includes('trikot') && !ids(1977).includes('trikot'), 'Trikot-Replika ab 1978');
ok(!ids(1985).includes('video') && ids(1986).includes('video') && !ids(2017).includes('video'), 'Video & DVD 1986–2016');
const sh = (y: number) => Object.values(merchShares(y)).reduce((a, v) => a + (v ?? 0), 0);
ok([1975, 1990, 2005, 2025].every((y) => Math.abs(sh(y) - 1) < 1e-9), 'Anteile ergeben je Jahr 100 %');
ok((merchShares(2005).trikot ?? 0) > (merchShares(1985).trikot ?? 0) && (merchShares(2005).trikot ?? 0) > 0.25, `Trikot-Anteil 1985 ${r2(merchShares(1985).trikot ?? 0)} → 2005 ${r2(merchShares(2005).trikot ?? 0)}`);
ok(newKitSeason(1978) && !newKitSeason(1979) && newKitSeason(1991), 'Trikotwechsel: bis 1989 alle 2 Jahre, danach jährlich');
ok(playerUnits('poster', 10, 1980) === 10 && playerUnits('trikot', 10, 1980) === 0 && playerUnits('trikot', 10, FLOCK_YEAR) === 6, 'Spieler-Zuordnung: vor 1995 Poster, danach beflockte Trikots');
ok(merchAvailable(MERCH_BY_ID.schal, 2030), 'Schals immer im Sortiment');

// --- 2) Preise, Rabatt, Einkauf ------------------------------------------------------
const st = newItemState();
ok(Math.abs(priceDemandFactor(st) - 1) < 1e-9, 'Richtpreis → Nachfrage-Faktor 1');
st.pf = 1.3; const hi = priceDemandFactor(st); st.pf = 1; st.disc = 0.2; const lo = priceDemandFactor(st);
ok(hi < 0.7 && lo > 1.4, `Preis +30 % → ×${r2(hi)}, Rabatt 20 % → ×${r2(lo)}`);
ok(volumeDiscount(100) === 0 && volumeDiscount(1000) > 0 && volumeDiscount(25000) > volumeDiscount(3000), 'Mengenrabatt steigt mit der Menge');
ok(orderCost(MERCH_BY_ID.schal, 1000, 1975) < 1000 * 5, 'Mengenrabatt im Einkaufspreis');
for (const d of Object.values(MERCH_BY_ID)) ok(d.cost / d.price > 0.25 && d.cost / d.price < 0.5, `${d.name}: Wareneinsatz ${Math.round(d.cost / d.price * 100)} %`);

// Stückpreise nach Verbraucherpreisen (nicht nach der Fußball-Finanzbasis)
const P = (id: keyof typeof MERCH_BY_ID, y: number) => MERCH_BY_ID[id].price * itemPriceScale(MERCH_BY_ID[id], y);
ok(P('schal', 1975) === 12 && P('schal', 1995) > 18 && P('schal', 1995) < 30, `Schal 1975 ${P('schal', 1975)} DM, 1995 ${P('schal', 1995).toFixed(2)} DM`);
ok(P('trikot', 1978) > 45 && P('trikot', 1978) < 65 && P('trikot', 1995) > 100 && P('trikot', 1995) < 140, `Trikot 1978 ${P('trikot', 1978).toFixed(0)} DM, 1995 ${P('trikot', 1995).toFixed(0)} DM`);
ok(P('trikot', 2015) / 1.95583 > 75 && P('trikot', 2015) / 1.95583 < 95 && P('trikot', 2024) / 1.95583 > 90 && P('trikot', 2024) / 1.95583 < 110, `Trikot 2015 ${(P('trikot', 2015) / 1.95583).toFixed(0)} €, 2024 ${(P('trikot', 2024) / 1.95583).toFixed(0)} €`);

// --- 3) Neues Spiel, Migration, Startbestand -------------------------------------------
const g: Game = createNewGame({
  managedClubId: 'fra', manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
(g as any).simAutoManage = true;
const club = g.clubs[g.managedClubId];
migrateMerch(g);
const shop = club.merchShop!;
const snap = JSON.stringify(shop);
migrateMerch(g);
ok(JSON.stringify(club.merchShop) === snap, 'Migration idempotent');
ok(Object.values(g.clubs).filter((c) => c.merchShop).length === 1, 'Nur der eigene Verein hat einen Laden');
ok(shop.auto && (shop.items.schal?.stock ?? 0) > 0 && !shop.items.trikot, `Startbestand 1975 (Schals ${shop.items.schal?.stock}), kein Trikot`);
const cap = storeCapacity(club, 1975);
const wkVol = Object.keys(shop.items).reduce((a, id) => a + weeklyUnits(club, shop, id as any, g.calendar.currentDate) * MERCH_BY_ID[id as keyof typeof MERCH_BY_ID].vol, 0);
ok(cap / wkVol >= 8, `Lager ${cap} Plätze ≈ ${(cap / wkVol).toFixed(1)} Wochen Nachfrage (${Math.round(wkVol)}/Woche)`);

// --- 4) Eine Saison mit Assistent ----------------------------------------------------
function playSeason(game: Game) {
  let guard = 0;
  while (!CalendarEngine.isSeasonOver(game.calendar)) {
    const t = game.clubs[game.managedClubId]?.tactics;
    if (t && t.startingXI?.length) { t.startingXI = []; t.lineupMap = undefined; }
    processDay(game, HEADLESS_UI);
    if (++guard > 1000) throw new Error('Saison endet nicht');
  }
}
playSeason(g);
let tot = seasonTotals(shop);
const ratio = tot.rev / Math.max(1, shop.pot);
ok(ratio > 0.92 && ratio < 1.08, `1975/76 mit Assistent: Umsatz ${Math.round(tot.rev)} vs. Pauschale ${Math.round(shop.pot)} = ${(ratio * 100).toFixed(1)} %`);
ok(tot.lost / Math.max(1, tot.sold + tot.lost) < 0.03, `Fehlmenge ${tot.lost} von ${tot.sold + tot.lost} Stück`);
ok(tot.cost / Math.max(1, tot.rev) > 0.25 && tot.cost / tot.rev < 0.45, `Einkauf ${Math.round(tot.cost / tot.rev * 100)} % vom Umsatz`);
ok(shop.weeks.length >= 40, `${shop.weeks.length} Wochen protokolliert`);
ok(Object.keys(shop.jersey).length > 5 && Object.values(shop.jersey).reduce((a, b) => a + b, 0) > 0, `Poster/Autogrammkarten je Spieler: ${Object.keys(shop.jersey).length} Spieler`);
ok((club.finances.expenses.operations ?? 0) >= tot.cost * 0.99, 'Einkauf als Betrieb & Vermarktung gebucht');

// Alter Spielstand mit Vorsaison: Archiv bekommt die Pauschale der Vorsaison genau einmal
{
  startNextSeason(g);
  const g2: Game = JSON.parse(JSON.stringify(g));
  delete g2.clubs[g2.managedClubId].merchShop;
  migrateMerch(g2); migrateMerch(g2);
  const arc = g2.clubs[g2.managedClubId].merchShop!.archive;
  ok(arc.length === 1 && arc[0].season === '1975/76' && arc[0].rev > 0, `Migration mit Vorsaison: Archiv ${arc.map((a) => `${a.season} ${a.rev}`).join(', ')}`);
  playSeason(g);
}
// --- 5) Saisonwechsel, weitere Saisons bis zum Trikot -----------------------------------
for (let s = 0; s < 2; s++) { startNextSeason(g); playSeason(g); }
ok(shop.archive.length >= 3 && shop.archive[0].season === '1975/76', `Archiv: ${shop.archive.map((a) => a.season).join(', ')}`);
ok((shop.items.trikot?.season.sold ?? 0) > 0, `1978/79: ${shop.items.trikot?.season.sold} Trikots verkauft`);
tot = seasonTotals(shop);
ok(tot.rev / shop.pot > 0.9 && tot.rev / shop.pot < 1.1, `1978/79: Umsatz/Pauschale ${(tot.rev / shop.pot * 100).toFixed(1)} %`);
startNextSeason(g);
processDay(g, HEADLESS_UI);
// 1979: kein Modellwechsel (ungerades Jahr); 1980: Wechsel
ok((shop.items.trikot?.stale ?? 0) === 0, '1979/80 kein neues Trikot → keine Ladenhüter');
playSeason(g); startNextSeason(g); processDay(g, HEADLESS_UI);
ok((shop.items.trikot?.stale ?? 0) > 0 && (shop.items.trikot?.sdisc ?? 0) >= 0.3 && (shop.items.trikot?.disc ?? 0) === 0, `1980/81 neues Trikot: ${shop.items.trikot?.stale} Ladenhüter, Assistent setzt Ladenhüter-Rabatt`);

// --- 6) Ohne Nachbestellung: ausverkauft ------------------------------------------------
const y = 1980;
const test = JSON.parse(JSON.stringify(shop));
for (const s of Object.values(test.items) as any[]) { s.stock = 10; s.stale = 0; }
const r = sellFromStock(test, 500000, y);
const lost = Object.values(test.items).reduce((a: number, s: any) => a + s.week.lost, 0) as number;
ok(r.sold <= 10 * Object.keys(test.items).length && lost > 0, `Leeres Lager: nur ${r.sold} verkauft, ${lost} Kunden ohne Ware`);

// --- 7) Aktionen ------------------------------------------------------------------------
setMerchAuto(g, false);
club.finances.balance = 5e6;
setMerchPrice(g, 'schal', 1.27);
ok(shop.items.schal!.pf === 1.25, 'Preisfaktor in 5-%-Schritten');
setMerchDiscount(g, 'schal', 0.9);
ok(shop.items.schal!.disc === 0.5, 'Rabatt höchstens 50 %');
const before = shop.items.schal!.stock;
const o = orderMerch(g, 'schal', 500);
ok(o.ok && shop.items.schal!.stock === before + 500, `Bestellung: ${o.text}`);
const used = storeUsed(shop);
const big = orderMerch(g, 'ball', storeCapacity(club, y));
ok(big.ok && storeUsed(shop) > used && storeUsed(shop) <= storeCapacity(club, y) && /passte nicht/.test(big.text), `Lagergrenze greift: ${big.text}`);
const disp = disposeMerch(g, 'trikot');
ok(disp.ok && shop.items.trikot!.stale === 0, `Ladenhüter entsorgt: ${disp.text}`);
const all = orderAllWeeks(g, 2);
ok(typeof all.text === 'string', `Alle auffüllen: ${all.text}`);
ok(!orderMerch(g, 'video', 10).ok, 'Video gibt es 1980 noch nicht');
const sz = JSON.stringify(shop).length;
ok(sz < 60000, `Spielstandgröße Laden ${(sz / 1024).toFixed(1)} KB`);
void economyScale; void ensureMerchShop;

console.log(fails ? `\n${fails} Fehler` : '\nAlle Prüfungen bestanden');
process.exit(fails ? 1 : 0);

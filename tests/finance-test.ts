// =============================================================================
// Finanzniveau ohne UI: Startwerte 1975, eine Saison Bilanz, Umstellung alter
// Spielstände (game/financeMigration.ts).   npm run test:finance
// =============================================================================
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { startNextSeason, leagueClubs } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { FINANCE_LEVEL, migrateFinanceLevel } from '../src/game/financeMigration';
import { marketWage } from '../src/engine/clubEconomy';
import { Game } from '../src/game/state';

let seed = 1975;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${msg}`); if (!c) fails++; };
const med = (xs: number[]) => { const t = [...xs].sort((a, b) => a - b); return t[t.length >> 1] ?? 0; };
const M = (v: number) => `${(v / 1e6).toFixed(2)} Mio.`;

const g: Game = createNewGame({
  managedClubId: 'mgl',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, legendMode: 'fictional',
});
(g as any).simAutoManage = true;

// --- Start 1975 ---
ok(g.financeLevel === FINANCE_LEVEL, `Neues Spiel trägt Finanzniveau ${g.financeLevel}`);
ok(!migrateFinanceLevel(g), 'Neues Spiel wird nicht umgerechnet');
const lc = leagueClubs(g);
const bal = med(lc.map((c) => c.finances.balance));
ok(bal > 600_000 && bal < 2_000_000, `Start-Kontostand Median ${M(bal)} (Soll 0,6–2 Mio.)`);
const wages = lc.flatMap((c) => c.playerIds.map((id) => g.players[id].contract.weeklyWage * 52)).sort((a, b) => b - a);
ok(wages[0] > 150_000 && wages[0] < 400_000, `Spitzengehalt ${Math.round(wages[0] / 1000)} Tsd. DM/Jahr (Recherche 150–250 Tsd.)`);
ok(med(wages) > 40_000 && med(wages) < 110_000, `Mediangehalt ${Math.round(med(wages) / 1000)} Tsd. DM/Jahr (Recherche 50–100 Tsd.)`);
const tickets = lc.map((c) => c.stadium.ticketPrice);
ok(Math.min(...tickets) >= 4 && Math.max(...tickets) <= 12, `Eintritt ${Math.min(...tickets)}–${Math.max(...tickets)} DM`);

// --- Eine Saison spielen ---
let guard = 0;
while (!CalendarEngine.isSeasonOver(g.calendar)) { processDay(g, HEADLESS_UI); if (++guard > 1000) throw new Error('Saison endet nicht'); }
startNextSeason(g);
const revs = leagueClubs(g).map((c) => c.finances.seasonHistory?.at(-1)?.revenue ?? 0).filter((v) => v > 0).sort((a, b) => a - b);
const r50 = med(revs);
ok(r50 > 3_500_000 && r50 < 6_500_000, `Umsatz 1975/76 Median ${M(r50)} (Soll ≈ 4,5 Mio. + Pokal)`);
// Robuster Mittelwert (fünf mittlere Vereine): Bei 15 Bilanzen springt der reine Median zwischen Lücken der Verteilung.
const mid5 = revs.slice(Math.max(0, (revs.length >> 1) - 2), (revs.length >> 1) + 3);
const rMid = mid5.reduce((a, b) => a + b, 0) / mid5.length;
ok(revs[revs.length - 1] > 1.5 * rMid, `Spitze ${M(revs[revs.length - 1])} deutlich über der Mitte (${M(rMid)})`);
ok(revs[0] < 0.8 * r50, `Schlusslicht ${M(revs[0])} deutlich darunter`);
const tickShare = med(leagueClubs(g).map((c) => { const h = c.finances.seasonHistory?.at(-1); return h ? h.income.ticketSales / h.revenue : 0; }).filter((x) => x > 0));
ok(tickShare > 0.55 && tickShare < 0.85, `Eintritt ${Math.round(tickShare * 100)} % des Umsatzes (Recherche ≈ 70 %)`);

// --- Umstellung eines alten Spielstands (Niveau bis v10 nachgestellt) ---
const old = JSON.parse(JSON.stringify(g)) as Game;
delete old.financeLevel;
const me = old.clubs[old.managedClubId];
const oldMW = (o: number) => Math.round(o * 110 + Math.max(0, o - 70) ** 2 * 18);
for (const c of Object.values(old.clubs)) {
  c.finances.balance = Math.round(c.finances.balance / 0.3);
  for (const h of c.finances.seasonHistory ?? []) h.revenue = Math.round(h.revenue / 0.3);
  for (const id of c.playerIds) { const p = old.players[id]; if (p) p.contract.weeklyWage = oldMW(p.overall); }
  c.stadium.ticketPrice = 14;
  c.stadium.averageAttendanceRate = 0.75;
}
const balOld = me.finances.balance;
ok(migrateFinanceLevel(old), 'Alter Spielstand wird umgerechnet');
ok(Math.abs(me.finances.balance - balOld * 0.3) < 2, `Kontostand ${M(balOld)} → ${M(me.finances.balance)}`);
const sq = me.playerIds.map((id) => old.players[id]);
const ratio = sq.reduce((a, p) => a + p.contract.weeklyWage, 0) / sq.reduce((a, p) => a + marketWage(p), 0);
ok(ratio > 0.6 && ratio < 1.6, `Gehälter auf neuem Niveau (Lohnsumme ÷ Marktgehalt ${ratio.toFixed(2)})`);
ok(me.stadium.ticketPrice >= 5 && me.stadium.ticketPrice <= 9, `Eintritt 14 → ${me.stadium.ticketPrice} DM`);
ok(me.stadium.averageAttendanceRate < 0.6, `Auslastung 0,75 → ${me.stadium.averageAttendanceRate}`);
const snap = JSON.stringify(old.clubs);
ok(!migrateFinanceLevel(old) && JSON.stringify(old.clubs) === snap, 'Zweiter Aufruf ändert nichts (idempotent)');

if (fails) { console.log(`\n${fails} Prüfung(en) fehlgeschlagen.`); process.exit(1); }
console.log('\nFinanz-Test bestanden.');

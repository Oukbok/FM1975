// Funktionstest: Stadionbau mit Kredit, Logen, Namensrechte, Ausgliederung/Investor,
// Überschuldung (Punktabzug, Insolvenz, Zwangsabstieg).
//   node scripts/run-ts.mjs tests/club-business-test.ts
import { createNewGame } from '../src/game/newGame';
import {
  acceptNaming, applyForcedRelegation, currentNamingOffers, investorQuote, monthlyClubBusiness, outsource,
  seasonClubBusiness, sellInvestorShare, startStadiumBuild,
} from '../src/game/clubBusiness';
import { calculateTable } from '../src/engine/league';
import { lastRevenue } from '../src/engine/clubEconomy';
import { Club } from '../src/types';

let fails = 0;
const ok = (cond: unknown, label: string) => { console.log(`${cond ? 'OK  ' : 'FEHL'} ${label}`); if (!cond) fails++; };

const g = createNewGame({
  managedClubId: 'mgl',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1950, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
const me = g.clubs[g.managedClubId];

// --- 1975: keine Namensrechte, keine Ausgliederung ---
ok(currentNamingOffers(g).length === 0, '1975 keine Namensrechte-Angebote');
ok(outsource(g).includes('erst ab'), '1975 keine Ausgliederung');

// --- 2001: Stadionbau auf Kredit ---
g.calendar.currentDate = '2001-08-01';
me.finances.seasonHistory = [{ season: '2000/01', income: me.finances.income, expenses: me.finances.expenses, revenue: 60_000_000, result: 4_000_000, balanceEnd: 10_000_000, wageRatio: 0.5 }];
const cap0 = me.stadium.capacity;
const lvl0 = me.infrastructure.stadium;
const t = startStadiumBuild(g, 'loan', 15);
ok(!!me.stadiumProject, `Bauprojekt gestartet (${t})`);
ok((me.loans ?? []).length === 1 && me.loans![0].monthlyRate > 0, `Kredit angelegt: Rate ${me.loans?.[0]?.monthlyRate}, Zins ${me.loans?.[0]?.annualRate}`);
ok(me.stadium.capacity < cap0, `Plätze während Bau gesperrt (${cap0} → ${me.stadium.capacity})`);
const bal0 = me.finances.balance;
monthlyClubBusiness(g, '2001-09-01');
ok(me.finances.balance < bal0, 'Kreditrate gebucht');
monthlyClubBusiness(g, me.stadiumProject!.finishDate);
ok(!me.stadiumProject && me.infrastructure.stadium === lvl0 + 1, `Stadion fertig: Stufe ${me.infrastructure.stadium}`);
ok(me.stadium.capacity === cap0 + 6000, `Kapazität ${me.stadium.capacity} (= ${cap0} + 6000)`);
ok((me.stadium.vipBoxes ?? 0) > 0, `Logen: ${me.stadium.vipBoxes}`);

// --- Namensrechte ---
const offers = currentNamingOffers(g);
ok(offers.length === 3, `3 Angebote: ${offers.map((o) => o.arenaName).join(', ')}`);
const oldName = me.stadium.name;
acceptNaming(g, offers[1]);
ok(me.stadium.name === offers[1].arenaName && me.stadium.baseName === oldName, `Stadion heißt ${me.stadium.name}`);
const b1 = me.finances.balance;
monthlyClubBusiness(g, '2002-08-01');
ok(me.finances.transactions.some((x) => x.description.startsWith('Namensrechte')), 'Namensrechte monatlich gebucht');
void b1;
monthlyClubBusiness(g, `${offers[1].untilYear}-07-01`);
ok(me.stadium.name === oldName && !me.namingRights, 'Namensrechte laufen aus, alter Name zurück');

// --- Ausgliederung & Investor ---
const before = me.finances.balance;
outsource(g);
ok(!!me.corporate && me.finances.balance > before, `Ausgliederung: Kapital ${me.corporate?.capitalRaised}`);
sellInvestorShare(g, 24);
sellInvestorShare(g, 24);
ok(me.corporate!.investorShare === 48, `Investor hält ${me.corporate!.investorShare} %`);
ok(!investorQuote(g, 10).ok, '50+1: weitere 10 % nicht erlaubt');

// --- Überschuldung (KI-Verein) ---
const ai = Object.values(g.clubs).find((c) => c.id !== me.id && !c.id.startsWith('am')) as Club;
ai.finances.seasonHistory = [{ season: '2000/01', income: ai.finances.income, expenses: ai.finances.expenses, revenue: 40_000_000, result: -10_000_000, balanceEnd: 0, wageRatio: 0.9 }];
ai.finances.balance = -40_000_000; // 100 % des Umsatzes
seasonClubBusiness(g, '2001/02', '2001-07-01');
ok(ai.pointDeduction?.points === 6 && !ai.finances.ffp?.forcedRelegation, `Abzug ${ai.pointDeduction?.points} Punkte, kein Zwangsabstieg`);
ai.finances.balance = -70_000_000; // 175 %, Vorsaison mit Abzug
seasonClubBusiness(g, '2002/03', '2002-07-01');
ok(ai.finances.ffp?.forcedRelegation === '2002/03', 'Zwangsabstieg nach erneutem Abzug');
ok(ai.finances.balance >= -0.3 * lastRevenue(ai, 2002) - 1, `Insolvenz: Schuldenschnitt auf ${Math.round(ai.finances.balance / 1e6)} Mio.`);
const clubs = g.table.rows.map((r) => g.clubs[r.clubId]).filter(Boolean) as Club[];
const tab = calculateTable(clubs, g.fixtures, g.pointSystem, '2002/03');
const row = tab.rows.find((r) => r.clubId === ai.id)!;
ok(row.deduction === 9 && row.points === -9, `Tabelle: ${row.points} Punkte (Abzug ${row.deduction})`);
const order = applyForcedRelegation(g, tab.rows.map((r) => r.clubId), '2002/03');
ok(order[order.length - 1] === ai.id, 'Zwangsabsteiger am Tabellenende');

console.log(fails ? `\n${fails} Fehler.` : '\nVereins-Unternehmen: alle Prüfungen bestanden.');
process.exit(fails ? 1 : 0);

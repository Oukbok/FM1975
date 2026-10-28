// Transfer-Test ohne UI: Rekordkurve, Verhandlung mit Verein und Spieler,
// Abschluss im Fenster, Versprechen, Vorvertrag nach Bosman.
//   node scripts/run-ts.mjs tests/transfer-test.ts
import { createNewGame } from '../src/game/newGame';
import { capBase, softCap } from '../src/engine/transferMarket';
import { clubOffer, playerOffer, startTalk, stanceFor, TransferTalk } from '../src/game/transferTalks';
import { checkPromises } from '../src/game/promises';
import { Game } from '../src/game/state';

let seed = 11;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
function fresh(): Game {
  return createNewGame({
    managedClubId: 'mgl',
    manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  });
}

// 1) Kurve und weiche Obergrenze
const c75 = capBase(1975, 'germany'), c23 = capBase(2023, 'world');
if (!(c75 > 0 && c23 > 0)) fail('Kurve leer');
if (softCap(10 * c75, c75) > c75) fail('softCap überschreitet die Kurve');
if (softCap(0.5 * c75, c75) !== 0.5 * c75) fail('softCap wirkt unterhalb des Knies');
console.log(`Kurve 1975 DE ${(c75 / 1e6).toFixed(2)} Mio. Basis, 2023 Welt ${(c23 / 1e6).toFixed(2)} Mio. Basis`);

// 2) Verhandlung
const g = fresh();
g.calendar.currentDate = '1975-07-10';
const own = g.clubs[g.managedClubId];
own.finances.transferBudget = 50_000_000;
own.finances.wageBudget = 10_000_000;
const target = Object.values(g.players).filter((p) => p.clubId !== own.id && g.clubs[p.clubId] && !p.isYouth && p.age <= 28)
  .sort((a, b) => b.overall - a.overall)[5];
target.contract.expiryDate = '1978-06-30';
const t = startTalk(g, target.id) as TransferTalk;
if (typeof t === 'string') fail(t);
console.log(`Ziel ${target.fullName} (${target.overall}), Wert ${target.contract.transferValue}, Schätzung ${t.estimate.join('–')}, Forderung (verdeckt) ${t.asking}, Grenze ${t.walkaway}`);
if (t.estimate[0] > t.asking * 1.5 || t.estimate[1] < t.asking * 0.6) fail('Schätzung völlig daneben');
console.log(' →', clubOffer(g, t.id, { fee: Math.round(t.asking * 0.4), installments: false, sellOn: 0, bonus: 0 }));
if (t.phase !== 'club' && t.phase !== 'failed') fail('Lowball wurde angenommen');
let fee = Math.round(t.asking * 0.8);
for (let i = 0; i < 8 && t.phase === 'club'; i++) {
  console.log(' →', clubOffer(g, t.id, { fee, installments: i % 2 === 1, sellOn: 0.1, bonus: 0 }));
  fee = Math.round((fee + t.currentAsk) / 2 + 10000);
}
if (t.phase !== 'player') fail('Keine Einigung mit dem Verein (Phase ' + t.phase + ')');
const st = stanceFor(g, t);
console.log(`Berater fordert ${st.agentWage}, Mindestgehalt (verdeckt) ${st.minWage}, Interesse ${st.interest}, Prioritäten ${st.priorities.slice(0, 3).map((x) => x[0]).join(', ')}`);
console.log(' →', playerOffer(g, t.id, { wage: Math.round(st.minWage * 0.7), years: st.years[0], signingFee: 0, releaseClause: false, promises: [] }));
if (t.phase === 'agreed' || t.phase === 'done') fail('Zu niedriges Gehalt angenommen');
const top = st.priorities.slice(0, 2).map((x) => x[0]);
console.log(' →', playerOffer(g, t.id, { wage: Math.round(st.agentWage * 1.05), years: st.years[0], signingFee: st.minWage * 8, releaseClause: false, promises: top }));
if (t.phase !== 'done') fail('Spieler nicht überzeugt / Wechsel nicht vollzogen (Phase ' + t.phase + ')');
if (target.clubId !== own.id) fail('Spieler nicht im eigenen Kader');
console.log(`Versprechen: ${(target.promises ?? []).map((x) => x.type).join(', ')}`);

// 3) Versprechen am Saisonende
const trust0 = g.promiseTrust ?? 70;
if (target.promises?.some((x) => x.type === 'stammplatz')) target.seasonStats.starts = 0;
g.fixtures.forEach((m, i) => { if (i < 20 && (m.homeClubId === own.id || m.awayClubId === own.id)) m.result = { homeGoals: 1, awayGoals: 0 } as any; });
checkPromises(g, '1976-06-30');
const res = (target.promises ?? []).map((x) => `${x.type}:${x.result}`).join(', ');
console.log(`Prüfung: ${res}; Glaubwürdigkeit ${trust0} → ${g.promiseTrust ?? 70}`);
if ((target.promises ?? []).some((x) => !x.result)) fail('Offene Versprechen nach der Prüfung');

// 4) Vorvertrag nach Bosman
const g2 = fresh();
g2.calendar.currentDate = '1998-01-10';
const o2 = g2.clubs[g2.managedClubId];
o2.finances.wageBudget = 10_000_000; o2.finances.transferBudget = 10_000_000;
const free = Object.values(g2.players).find((p) => p.clubId !== o2.id && g2.clubs[p.clubId] && !p.isYouth && p.age < 30)!;
free.contract.expiryDate = '1998-06-30';
const t2 = startTalk(g2, free.id) as TransferTalk;
if (typeof t2 === 'string' || !t2.freeAgent || t2.phase !== 'player') fail('Vorvertrag-Gespräch nicht erkannt');
const st2 = stanceFor(g2, t2);
console.log(' →', playerOffer(g2, t2.id, { wage: Math.round(st2.agentWage * 1.2), years: st2.years[0], signingFee: st2.minWage * 20, releaseClause: true, promises: st2.priorities.slice(0, 3).map((x) => x[0]) }));
if (t2.phase !== 'agreed') fail('Vorvertrag nicht vereinbart (Phase ' + t2.phase + ')');
console.log('Transfer-Test bestanden.');

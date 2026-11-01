// Transfer-Test ohne UI: Rekordkurve, Verhandlung mit Verein und Spieler,
// Abschluss im Fenster, Versprechen, Vorvertrag nach Bosman; Transfer 2.0:
// Persönlichkeit (deterministisch, Nachrüstung), Wunschvereine (Stars meiden
// kleine Vereine, Talente wollen spielen, Erzrivale), Gehaltsforderung
// (Bosman-Aufschlag, Berater ab den 90ern), Tausch, Leihe mit Kaufoption,
// Klausel-Freischaltung, neue Versprechen.
//   node scripts/run-ts.mjs tests/transfer-test.ts
import { createNewGame } from '../src/game/newGame';
import { capBase, softCap } from '../src/engine/transferMarket';
import { clubOffer, playerOffer, startTalk, stanceFor, TransferTalk } from '../src/game/transferTalks';
import { checkPromises } from '../src/game/promises';
import { makePersona, personaOf } from '../src/engine/persona';
import { agentShare, hasAgent } from '../src/engine/playerWishes';
import { migratePersonas, wishesFor, contractClausesDaily } from '../src/game/playerWishesGame';
import { chooseEventOption } from '../src/game/eventsGame';
import { swapValueFor } from '../src/game/transferTalks';
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
console.log(' →', playerOffer(g, t.id, { wage: Math.round(st.agentWage * 1.05), years: st.years[0], signingFee: Math.max(st.signingFee, st.minWage * 8), releaseClause: false, promises: top, agentFee: st.agentFee }));
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
console.log(' →', playerOffer(g2, t2.id, { wage: Math.round(st2.agentWage * 1.2), years: st2.years[0], signingFee: Math.max(st2.signingFee, st2.minWage * 20), releaseClause: true, promises: st2.priorities.slice(0, 3).map((x) => x[0]), agentFee: st2.agentFee }));
if (t2.phase !== 'agreed') fail('Vorvertrag nicht vereinbart (Phase ' + t2.phase + ')');

// 5) Persönlichkeit: deterministisch, nachrüstbar, idempotent
const g5 = fresh();
const anyP = Object.values(g5.players)[0];
const pa = makePersona(anyP), pb = makePersona(anyP);
if (JSON.stringify(pa) !== JSON.stringify(pb)) fail('Persönlichkeit nicht deterministisch');
for (const p of Object.values(g5.players)) delete p.persona;
const n1 = migratePersonas(g5), n2 = migratePersonas(g5);
if (!n1 || n2) fail(`Nachrüstung nicht idempotent (${n1}/${n2})`);
const traits = Object.values(g5.players).map((p) => personaOf(p));
const avgT = (k: 'ehrgeiz' | 'loyalitaet' | 'geld') => traits.reduce((a, x) => a + x[k], 0) / traits.length;
console.log(`Persönlichkeit: ${n1} nachgerüstet, Ø Ehrgeiz ${avgT('ehrgeiz').toFixed(0)}, Loyalität ${avgT('loyalitaet').toFixed(0)}, Geld ${avgT('geld').toFixed(0)}`);
if (traits.some((x) => x.ehrgeiz < 0 || x.ehrgeiz > 100)) fail('Charakterwert außerhalb 0..100');

// 6) Wunschvereine: Star will lieber zum großen als zum kleinen Verein
const clubs5 = Object.values(g5.clubs).filter((c) => !c.id.startsWith('am') && !c.id.startsWith('eu_')).sort((a, b) => b.reputation - a.reputation);
const big = clubs5[0], small = clubs5[clubs5.length - 1];
const { depthRankAt } = await import('../src/game/playerWishesGame');
const star = clubs5.slice(Math.floor(clubs5.length / 2), -1).flatMap((c) => c.playerIds.map((id) => g5.players[id]))
  .filter((p) => !p.isYouth && p.age <= 29 && depthRankAt(g5, p, big) <= 1).sort((a, b) => b.overall - a.overall)[0];
const mid = g5.clubs[star.clubId];
const toBig = wishesFor(g5, star, big), toSmall = wishesFor(g5, star, small);
console.log(`Star ${star.fullName} (${star.overall}) von ${mid.shortName}: Interesse ${big.shortName} ${toBig.appeal.score}, ${small.shortName} ${toSmall.appeal.score}; Forderung ${toBig.demand.min} vs ${toSmall.demand.min}`);
if (toBig.appeal.score <= toSmall.appeal.score + 8) fail('Star bevorzugt den großen Verein nicht deutlich');
// Kleiner Verein muss mehr zahlen (Aufschlag), großer Verein bekommt eher Verzicht – relativ zum Marktgehalt
if (toSmall.demand.min / toSmall.demand.market <= toBig.demand.min / toBig.demand.market) fail('Kein Aufschlag beim ungeliebten Verein');
// Erzrivale: loyaler Spieler mit langer Bindung lehnt ab
star.persona = { ...personaOf(star), loyalitaet: 90 };
star.history = { ...(star.history ?? {}), transfers: [{ date: '1969-07-01', fromClub: 'Jugend', toClub: mid.name, fee: 0 }] };
const env = (await import('../src/game/playerWishesGame')).rivalsOf(g5, mid.id);
if (env[0]) {
  const w = wishesFor(g5, star, g5.clubs[env[0]]);
  console.log(`Rivale ${g5.clubs[env[0]].shortName}: Interesse ${w.appeal.score}, ${w.appeal.dealBreaker ?? 'kein Ausschluss'}`);
  if (!w.appeal.dealBreaker) fail('Loyaler Spieler würde zum Erzrivalen wechseln');
}
// Talent: Stammplatz zählt mehr als für einen Routinier
const tal = Object.values(g5.players).find((p) => p.age <= 20 && !p.isYouth && g5.clubs[p.clubId])!;
const tw = wishesFor(g5, tal, big).promises;
if (!tw.slice(0, 2).some(([k]) => k === 'stammplatz' || k === 'entwicklung')) fail('Talent will nicht vor allem spielen');

// 7) Gehalt: Bosman-Aufschlag + Handgeld, Berater ab den 90ern
const fa = wishesFor(g5, star, big, { freeAgent: true });
g5.calendar.currentDate = '1998-07-10';
const fa98 = wishesFor(g5, star, big, { freeAgent: true });
console.log(`Handgeld ablösefrei 1975 ${toBig.demand.signingFee}/${fa.demand.signingFee}, 1998 ${fa98.demand.signingFee}; Berater-Anteil 1980 ${agentShare(1980)}, 2005 ${agentShare(2005)}`);
if (fa98.demand.signingFee <= fa.demand.signingFee) fail('Kein Bosman-Handgeld');
const agents = (y: number) => Object.values(g5.players).filter((p) => hasAgent(p, y)).length / Object.keys(g5.players).length;
console.log(`Spieler mit Berater: 1978 ${(agents(1978) * 100).toFixed(0)} %, 1990 ${(agents(1990) * 100).toFixed(0)} %, 2005 ${(agents(2005) * 100).toFixed(0)} %`);
if (!(agents(1978) < 0.35 && agents(2005) > 0.85)) fail('Berater-Verbreitung unplausibel');

// 8) Klauseln je Epoche, Tausch, Leihe mit Kaufoption
const g6 = fresh();
g6.calendar.currentDate = '1980-07-10';
const o6 = g6.clubs[g6.managedClubId];
o6.finances.transferBudget = 50_000_000; o6.finances.wageBudget = 10_000_000;
const tg = Object.values(g6.players).filter((p) => p.clubId !== o6.id && g6.clubs[p.clubId] && !p.isYouth && p.age <= 27).sort((a, b) => b.overall - a.overall)[30];
const t6 = startTalk(g6, tg.id) as TransferTalk;
if (typeof t6 === 'string') fail(t6);
const r6 = clubOffer(g6, t6.id, { fee: t6.asking, installments: false, sellOn: 0, bonus: 0, loan: true, optionFee: t6.asking });
if (!/erst ab/.test(r6)) fail('Leihe mit Kaufoption 1980 möglich: ' + r6);
const sw = o6.playerIds.map((id) => g6.players[id]).sort((a, b) => b.overall - a.overall)[8];
const sv = swapValueFor(g6, sw, g6.clubs[tg.clubId]);
console.log(`Tausch ${sw.fullName} (${sw.overall}, Wert ${sw.contract.transferValue}) für ${g6.clubs[tg.clubId].shortName}: ${sv.value} (${sv.reason})`);
const g7 = fresh();
g7.calendar.currentDate = '2006-07-10';
const o7 = g7.clubs[g7.managedClubId];
o7.finances.transferBudget = 80_000_000; o7.finances.wageBudget = 20_000_000;
const lp = (() => {
  for (const c of Object.values(g7.clubs)) {
    if (c.id === o7.id || c.id.startsWith('am') || c.id.startsWith('eu_')) continue;
    const sq = c.playerIds.map((id) => g7.players[id]).sort((a, b) => b.overall - a.overall);
    const x = sq.slice(12).find((p) => !p.isYouth && p.age <= 27);
    if (x) return x;
  }
})()!;
lp.contract.expiryDate = '2010-06-30';
const t7 = startTalk(g7, lp.id) as TransferTalk;
if (typeof t7 === 'string') fail(t7);
let lf = Math.round(t7.asking * 0.3);
for (let i = 0; i < 8 && t7.phase === 'club'; i++) { console.log(' →', clubOffer(g7, t7.id, { fee: lf, installments: false, sellOn: 0, bonus: 0, loan: true, optionFee: Math.round(t7.asking * 1.2) })); lf = Math.round(lf * 1.35); }
if (t7.phase !== 'player') fail('Leihe nicht vereinbart (Phase ' + t7.phase + ')');
const st7 = stanceFor(g7, t7);
console.log(' →', playerOffer(g7, t7.id, { wage: Math.round(st7.agentWage * 1.15), years: Math.max(2, st7.years[0]), signingFee: st7.signingFee, releaseClause: true, promises: st7.priorities.slice(0, 2).map((x) => x[0]), agentFee: st7.agentFee, loyaltyBonus: st7.agentWage * 10, successRaise: 0.1 }));
if (t7.phase !== 'done' || !lp.loan || lp.clubId !== o7.id) fail('Leihspieler nicht angekommen (Phase ' + t7.phase + ')');
if (!lp.contract.releaseClause || !lp.contract.loyaltyBonus || !lp.contract.successRaise) fail('Klauseln nicht übernommen');
// Saisonende: Kaufoption ziehen
g7.calendar.currentDate = '2007-06-30';
contractClausesDaily(g7, '2007-06-30');
const optMsg = g7.messages.find((m) => m.eventRef?.type === 'loan_option' && m.eventRef.playerId === lp.id);
if (!optMsg) fail('Keine Nachricht zur Kaufoption');
const res7 = chooseEventOption(g7, optMsg!, 'kaufen');
console.log('Kaufoption:', JSON.stringify(res7));
if (lp.loan || lp.clubId !== o7.id) fail('Kaufoption nicht gezogen');
console.log('Transfer-Test bestanden.');

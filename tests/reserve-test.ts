// Zweite Mannschaft ohne UI: Tabelle/Spieltag sonntags, Aufstellung je Schwerpunkt, Positions-Training,
// Spielpraxis nur für Aufgestellte, keine Spiele im Juni/Juli.
//   node scripts/run-ts.mjs tests/reserve-test.ts
import { createNewGame } from '../src/game/newGame';
import { ownReserveMinutes, pickReserveXI, reserveDaily, reserveState, setPosTrain, setReserveFocus } from '../src/game/reserveTeam';
import { ensurePositionSkill } from '../src/engine/positionSkill';
let fails = 0;
const ok = (c: unknown, l: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${l}`); if (!c) fails++; };
const g = createNewGame({ managedClubId: 'mgl', manager: { name: 'T', nationality: 'GER', birthYear: 1950, style: 'balanced', background: 'newcomer' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300 });
const me = g.clubs[g.managedClubId];
ok(!reserveState(g) || (me.youthInvest?.levels.reserve ?? 0) > 0, 'ohne Baustein keine zweite Mannschaft');
me.youthInvest!.levels.reserve = 1;
const st = reserveState(g)!;
ok(st && st.table.length >= 10 && st.table.length % 2 === 0, `Liga mit ${st.table.length} Mannschaften`);
setReserveFocus(g, 'youth');
const xi = pickReserveXI(g, me, st);
ok(xi.length >= 2 && xi.every(([p]) => p.age <= 23), `Nachwuchs: ${xi.length} Spieler (Rest Amateure), alle ≤ 23`);
setReserveFocus(g, 'comeback');
const xi2 = pickReserveXI(g, me, st);
ok(xi2.some(([p]) => p.age > 23), `Rückkehrer: auch Profis über 23 (${xi2.length})`);
const young = xi[0][0];
setPosTrain(g, [{ pid: young.id, pos: 'LA' }]);
const before = ensurePositionSkill(young, g.calendar.currentDate).v.LA ?? 0;
reserveDaily(g, '1975-07-06');
ok(st.md === 0, 'Juli: kein Spieltag');
reserveDaily(g, '1975-08-17'); reserveDaily(g, '1975-08-24');
ok(st.md === 2 && st.results.length === 2, `zwei Spieltage gespielt (${st.results.map((r) => `${r.gf}:${r.ga}`).join(', ')})`);
ok((ensurePositionSkill(young, '1975-08-24').v.LA ?? 0) > before, 'Positions-Training: Vertrautheit LA steigt');
ok(st.lastXI.some(([id, pos]) => id === young.id && pos === 'LA'), 'Trainee spielt auf seiner Trainingsposition');
const notPlaying = me.playerIds.map((id) => g.players[id]).find((p) => p.age <= 23 && !st.lastXI.some(([id]) => id === p.id));
ok(ownReserveMinutes(g, young, 0) > 0 && (!notPlaying || ownReserveMinutes(g, notPlaying, 0) === 0), 'Spielpraxis nur für Aufgestellte');
console.log(fails ? `\n${fails} Fehler.` : '\nZweite Mannschaft: alle Prüfungen bestanden.');
process.exit(fails ? 1 : 0);

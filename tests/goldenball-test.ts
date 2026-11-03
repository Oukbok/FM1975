// Goldener Ball (Fußballer des Jahres) ohne UI: Sieger je Kalenderjahr, Epochenregel
// Nationalität (bis 1994 nur Europäer), Archiv begrenzt, Migration, einmal je Jahr.
//   npm run test:goldenball [jahre]   (Standard 3)
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { startNextSeason } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { EUROPEAN_NATS, type GBCandidate, gbEligible, gbEra, rankGoldenBall } from '../src/engine/goldenBall';
import { MAX_GB_YEARS, awardGoldenBall, goldenBallCandidates, goldenBallState, migrateGoldenBall, pendingGoldenBall } from '../src/game/goldenBallGame';
import type { Game } from '../src/game/state';

let seed = 1980;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
const expect = (cond: unknown, msg: string) => { if (!cond) fail(msg); };

// 1) Epochenregel
expect(!gbEligible(1980, 'BRA') && gbEligible(1980, 'NED') && gbEligible(1995, 'BRA') && gbEligible(2010, 'JPN'), 'Nationalitätsregel falsch');
expect(gbEra(1985).title.startsWith('Europas') && gbEra(2008).title.startsWith('Welt') && gbEra(2012).venue === 'Zürich' && gbEra(1979).venue === 'Paris', 'Epochen-Bezeichnung/Ort falsch');
const mk = (o: Partial<GBCandidate>): GBCandidate => ({ pid: 'x', name: 'X', nat: 'GER', clubId: 'c', clubName: 'C', country: 'Deutschland', pos: 'MS', group: 'ATT', age: 26, ovr: 85, apps: 30, avg: 2.3, goals: 20, assists: 5, clean: 0, titles: [], ...o });
const br = rankGoldenBall([mk({ pid: 'bra', nat: 'BRA', goals: 40, avg: 1.8 }), mk({ pid: 'ger' })], 1985);
expect(br.length === 1 && br[0].pid === 'ger', '1985: Brasilianer wählbar');
expect(rankGoldenBall([mk({ pid: 'bra', nat: 'BRA', goals: 40, avg: 1.8 }), mk({ pid: 'ger' })], 1996)[0].pid === 'bra', '1996: Brasilianer nicht wählbar');
expect(rankGoldenBall([mk({ titles: ['ec'] , pid: 'a' }), mk({ pid: 'b' })], 1990)[0].pid === 'a', 'Titel zählen nicht');

// 2) Simulation über mehrere Kalenderjahre
const years = Number(process.argv[2] ?? 3);
const g: Game = createNewGame({
  managedClubId: 'fra',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
(g as any).simAutoManage = true;
let done = 0;
for (let s = 0; s <= years && done < years; s++) {
  let guard = 0;
  while (!CalendarEngine.isSeasonOver(g.calendar)) {
    const t = g.clubs[g.managedClubId]?.tactics;
    if (t && t.startingXI?.length) { t.startingXI = []; t.lineupMap = undefined; }
    const before = goldenBallState(g)?.years.length ?? 0;
    processDay(g, HEADLESS_UI);
    if ((goldenBallState(g)?.years.length ?? 0) > before) {
      const y = pendingGoldenBall(g)!;
      expect(y && g.calendar.currentDate.endsWith('12-20'), `Gala nicht am 20.12. (${g.calendar.currentDate})`);
      expect(y.top.length === 10, `${y.year}: keine Top 10`);
      if (y.year < 1995) expect(y.top.every((e) => EUROPEAN_NATS.has(e.nat)), `${y.year}: Nicht-Europäer gewählt`);
      expect(y.top[0].why && y.top[2].why && !y.top[3].why, `${y.year}: Begründungen falsch verteilt`);
      const cands = goldenBallCandidates(g, y.year);
      const own = cands.filter((c) => !c.est).length, est = cands.filter((c) => c.est).length;
      expect(own > 100 && est > 30, `${y.year}: zu wenige Kandidaten (${own}/${est})`);
      console.log(`${y.year} ${y.title} (${y.venue}): ${y.top.slice(0, 5).map((e, i) => `${i + 1}. ${e.n} (${e.cn}, ${e.nat}, ${e.ov}, ${e.ap} Sp, Note ${e.g}, ${e.gl} T${e.tt ? ', ' + e.tt.join('/') : ''}${e.est ? ', geschätzt' : ''}) ${e.pts}`).join(' | ')}`);
      console.log(`   ${y.top[0].why} | Kandidaten ${own} volle + ${est} Ausland | deutsch in Top 10: ${y.top.filter((e) => !e.est).length}`);
      expect(awardGoldenBall(g, y.year, g.calendar.currentDate) === null, 'Doppelte Wahl');
      done++;
    }
    if (++guard > 1000) fail('Saison endet nicht');
  }
  startNextSeason(g);
}
expect(done === years, `nur ${done} von ${years} Galas`);

// 3) Archiv + Migration
const st = goldenBallState(g)!;
for (let i = 0; i < MAX_GB_YEARS + 5; i++) st.years.push({ ...st.years[0], year: 3000 + i });
st.pending = 1;
migrateGoldenBall(g);
expect(st.years.length === MAX_GB_YEARS && st.pending === undefined, 'Archiv nicht begrenzt / pending nicht bereinigt');
const snap = JSON.stringify(st); migrateGoldenBall(g);
expect(JSON.stringify(st) === snap, 'Migration nicht idempotent');
const old = { ...g } as any; delete old.goldenBall; migrateGoldenBall(old);
expect(old.goldenBall === undefined, 'Migration legt Feld an');
console.log(`Spielstand: ${(JSON.stringify(st.years[0]).length / 1024).toFixed(1)} KB je Jahr`);
console.log('OK – Goldener Ball');
